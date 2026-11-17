import type * as childProcess from 'node:child_process';
import { Almacen } from './almacen';
import { Instalador } from './catalogo/instalador';
import { listarVersiones } from './catalogo/catalogo';
import { Eventos, type EventosNucleo } from './eventos';
import { GestorHosts } from './hosts/hosts';
import { crearPlataforma } from './plataforma/index';
import type { Ejecutor, Plataforma } from './plataforma/tipos';
import { ejecutorPorDefecto } from './plataforma/win';
import { Supervisor } from './procesos/supervisor';
import { Rutas, rutaBasePorDefecto } from './rutas';
import { Servicios } from './servicios/servicios';
import { detectarProyecto } from './sitios/detectar';
import { GestorSitios, ramasEnUso, upstreamsPara, type ResultadoAplicar } from './sitios/sitios';
import { UrlBase } from './sitios/urlbase';
import type { Config, EstadoHosts, EstadoServicio, EstadoTunel, Sitio } from './tipos';
import { Tuneles } from './tuneles/tuneles';

export interface OpcionesNucleo {
  base?: string;
  plataforma?: Plataforma;
  fetch?: typeof fetch;
  /** Para pruebas: reemplazos de procesos hijos y de ejecución de comandos. */
  spawn?: typeof childProcess.spawn;
  ejecutor?: Ejecutor;
  /** Para pruebas: sonda de puertos TCP. */
  sonda?: (puerto: number) => Promise<boolean>;
  /** Se invoca con el bus de eventos antes de restaurar el estado, para no perder emisiones iniciales. */
  alIniciar?: (eventos: Eventos<EventosNucleo>) => void;
}

export interface EstadoGeneral {
  servicios: EstadoServicio[];
  sitios: Sitio[];
  tuneles: EstadoTunel[];
  hosts: EstadoHosts;
}

const INTERVALO_SONDEO_MS = 3000;

const dominiosDe = (sitios: Sitio[]): string[] => [
  ...new Set(sitios.flatMap((s) => [s.dominio, ...s.alias])),
];

export class Nucleo {
  private temporizador: ReturnType<typeof setInterval> | null = null;
  private sondeando = false;
  /** Última firma conocida por servicio: k = estado/pid/mensaje, p = puertos (solo si los aportó el sondeo). */
  private readonly ultimo = new Map<string, { k: string; p: string | null }>();
  private emitiendoSondeo = false;

  readonly detectarProyecto = detectarProyecto;
  readonly listarVersiones = listarVersiones;
  readonly config: { leer(): Promise<Config>; guardar(c: Config): Promise<void> };

  private constructor(
    readonly rutas: Rutas,
    readonly eventos: Eventos<EventosNucleo>,
    private readonly supervisor: Supervisor,
    readonly instalador: Instalador,
    readonly servicios: Servicios,
    readonly hosts: GestorHosts,
    readonly sitios: GestorSitios,
    readonly tuneles: Tuneles,
    almacen: Almacen,
  ) {
    this.config = {
      leer: () => almacen.leer(),
      guardar: (c) => almacen.guardar(c),
    };
    eventos.on('servicio:estado', (e) => {
      this.ultimo.set(e.id, {
        k: JSON.stringify([e.estado, e.pid, e.mensaje ?? null]),
        p: this.emitiendoSondeo ? JSON.stringify(e.puertos) : null,
      });
    });
  }

  static async crear(o: OpcionesNucleo = {}): Promise<Nucleo> {
    const rutas = new Rutas(o.base ?? rutaBasePorDefecto());
    await rutas.asegurar();
    const plataforma = o.plataforma ?? crearPlataforma();
    const eventos = new Eventos<EventosNucleo>();
    const almacen = new Almacen(rutas);
    const leerConfig = () => almacen.leer();
    const supervisor = new Supervisor(rutas, plataforma, eventos, {
      ...(o.spawn ? { spawn: o.spawn } : {}),
      ...(o.sonda ? { sonda: o.sonda } : {}),
    });
    const instalador = new Instalador(rutas, eventos, o.fetch ?? fetch);
    const hosts = new GestorHosts(plataforma, eventos);

    // sitios y servicios se referencian entre sí: se resuelven de forma perezosa.
    // eslint-disable-next-line prefer-const
    let sitios!: GestorSitios;
    const servicios = new Servicios({
      rutas,
      plataforma,
      supervisor,
      instalador,
      leerConfig,
      ramasEnUso: async () => ramasEnUso(await sitios.listar()),
      obtenerUpstreams: async () =>
        upstreamsPara(
          await sitios.listar(),
          (await leerConfig()).servicios.php.trabajadores,
          await instalador.instalados('php'),
        ),
      ...(o.sonda ? { sonda: o.sonda } : {}),
      ...(o.ejecutor ? { exec: o.ejecutor } : {}),
    });
    sitios = new GestorSitios({
      almacen,
      rutas,
      nginx: servicios.nginx,
      estadoNginx: () => supervisor.estado('nginx'),
      hosts,
      instalador,
      eventos,
    });
    const urlBase = new UrlBase({
      rutas,
      ejecutor: o.ejecutor ?? ejecutorPorDefecto,
    });
    const tuneles = new Tuneles({
      supervisor,
      sitios,
      almacen,
      instalador,
      rutas,
      urlBase,
      eventos,
    });

    const nucleo = new Nucleo(
      rutas,
      eventos,
      supervisor,
      instalador,
      servicios,
      hosts,
      sitios,
      tuneles,
      almacen,
    );
    o.alIniciar?.(eventos);
    await supervisor.readoptar();
    await tuneles.restaurar();
    await hosts.estado(dominiosDe(await sitios.listar()));
    return nucleo;
  }

  async estadoGeneral(): Promise<EstadoGeneral> {
    const sitios = await this.sitios.listar();
    return {
      servicios: await this.servicios.estados(),
      sitios,
      tuneles: this.tuneles.estados(),
      hosts: await this.hosts.estado(dominiosDe(sitios)),
    };
  }

  /** Guarda un sitio nuevo o editado (si hay `id`) y aplica la configuración. */
  async guardarSitio(
    datos: Omit<Sitio, 'id'>,
    id?: string,
  ): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }> {
    const sitio = id ? await this.sitios.editar(id, datos) : await this.sitios.crear(datos);
    return { sitio, aplicar: await this.sitios.aplicar() };
  }

  /** Cierra el túnel del sitio, lo quita de la configuración y aplica. */
  async borrarSitio(id: string): Promise<ResultadoAplicar> {
    try {
      await this.tuneles.cerrar(id);
    } catch {
      // el túnel puede no estar abierto
    }
    await this.sitios.borrar(id);
    return this.sitios.aplicar();
  }

  iniciarSondeo(): void {
    if (this.temporizador) return;
    this.temporizador = setInterval(() => void this.sondear(), INTERVALO_SONDEO_MS);
  }

  private async sondear(): Promise<void> {
    if (this.sondeando) return;
    this.sondeando = true;
    try {
      const estados = await this.servicios.estados();
      if (!this.temporizador) return;
      for (const e of estados) {
        const k = JSON.stringify([e.estado, e.pid, e.mensaje ?? null]);
        const p = JSON.stringify(e.puertos);
        const previo = this.ultimo.get(e.id);
        if (previo && previo.k === k && (previo.p === null || previo.p === p)) continue;
        this.emitiendoSondeo = true;
        try {
          this.eventos.emit('servicio:estado', e);
        } finally {
          this.emitiendoSondeo = false;
        }
      }
    } catch (err) {
      console.error('Error al sondear los servicios:', err);
    } finally {
      this.sondeando = false;
    }
  }

  async cerrar(o: { detenerServicios: boolean }): Promise<void> {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
    if (o.detenerServicios) {
      for (const t of this.tuneles.estados()) {
        try {
          await this.tuneles.cerrar(t.sitioId);
        } catch (e) {
          console.error('No se pudo cerrar el túnel:', e);
        }
      }
      await this.servicios.detenerTodo();
    }
    await this.supervisor.cerrar();
  }
}
