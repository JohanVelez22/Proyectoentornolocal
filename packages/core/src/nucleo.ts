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
  /** Última firma emitida por servicio agregado. */
  private readonly ultimo = new Map<string, string>();
  private pendiente = false;
  private cerrado = false;

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
    internos: Eventos<EventosNucleo>,
  ) {
    this.config = {
      leer: () => almacen.leer(),
      guardar: (c) => almacen.guardar(c),
    };
    internos.on('servicio:estado', () => this.pedirRecalculo());
  }

  static async crear(o: OpcionesNucleo = {}): Promise<Nucleo> {
    const rutas = new Rutas(o.base ?? rutaBasePorDefecto());
    await rutas.asegurar();
    const plataforma = o.plataforma ?? crearPlataforma();
    const eventos = new Eventos<EventosNucleo>();
    const almacen = new Almacen(rutas);
    const leerConfig = () => almacen.leer();
    // Bus interno del supervisor: sus eventos crudos (php-8.4-0, tunel-x) nunca llegan a la UI.
    const internos = new Eventos<EventosNucleo>();
    const supervisor = new Supervisor(rutas, plataforma, internos, {
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
      internos,
    );
    o.alIniciar?.(eventos);
    try {
      await supervisor.readoptar();
      await tuneles.restaurar();
      await hosts.estado(dominiosDe(await sitios.listar()));
    } catch (e) {
      nucleo.cerrado = true;
      await supervisor.cerrar().catch(() => undefined);
      throw e;
    }
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

  /** Un evento interno del supervisor pide recalcular; las ráfagas se funden en un solo recálculo. */
  private pedirRecalculo(): void {
    if (this.cerrado) return;
    if (this.sondeando) {
      this.pendiente = true;
      return;
    }
    void this.sondear();
  }

  private async sondear(): Promise<void> {
    if (this.sondeando) return;
    this.sondeando = true;
    try {
      do {
        this.pendiente = false;
        const estados = await this.servicios.estados();
        if (this.cerrado) return;
        for (const e of estados) {
          const firma = JSON.stringify([
            e.estado,
            e.pid,
            e.puertos,
            e.mensaje ?? null,
            e.nombre,
            e.version,
          ]);
          if (this.ultimo.get(e.id) === firma) continue;
          this.ultimo.set(e.id, firma);
          this.eventos.emit('servicio:estado', e);
        }
      } while (this.pendiente);
    } catch (err) {
      console.error('Error al sondear los servicios:', err);
    } finally {
      this.sondeando = false;
    }
  }

  async cerrar(o: { detenerServicios: boolean }): Promise<void> {
    this.cerrado = true;
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
    let primero: unknown;
    let fallo = false;
    const anotar = (e: unknown): void => {
      if (!fallo) {
        fallo = true;
        primero = e;
      }
    };
    try {
      if (o.detenerServicios) {
        for (const t of this.tuneles.estados()) {
          try {
            await this.tuneles.cerrar(t.sitioId);
          } catch (e) {
            anotar(e);
          }
        }
        await this.servicios.detenerTodo();
      }
    } catch (e) {
      anotar(e);
    } finally {
      try {
        await this.supervisor.cerrar();
      } catch (e) {
        anotar(e);
      }
    }
    if (fallo) throw primero;
  }
}
