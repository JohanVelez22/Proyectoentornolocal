import type * as childProcess from 'node:child_process';
import { Almacen, AlmacenCredenciales, migrarCredenciales } from './almacen';
import { Instalador } from './catalogo/instalador';
import { listarVersiones } from './catalogo/catalogo';
import { Eventos, type EventosNucleo } from './eventos';
import { GestorHosts } from './hosts/hosts';
import { GestorHttps, type ResultadoCA } from './https/certificados';
import { crearPlataforma } from './plataforma/index';
import type { Ejecutor, Plataforma } from './plataforma/tipos';
import { ejecutorPorDefecto } from './plataforma/win';
import { Supervisor } from './procesos/supervisor';
import { Rutas } from './rutas';
import { Servicios } from './servicios/servicios';
import { detectarProyecto } from './sitios/detectar';
import {
  GestorSitios,
  ramasEnUso,
  upstreamsPara,
  validarAjustes,
  type AjustesServicios,
  type ResultadoAplicar,
} from './sitios/sitios';
import { migrarCarpetaDatos } from './migracion';
import { UrlBase } from './sitios/urlbase';
import type {
  Config,
  Credenciales,
  EstadoHosts,
  EstadoServicio,
  EstadoTunel,
  IdServicioDatos,
  Sitio,
} from './tipos';
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
  /** Para pruebas: reemplaza la migración de la carpeta de datos (solo sin `base`). */
  migracion?: typeof migrarCarpetaDatos;
}

export interface EstadoGeneral {
  servicios: EstadoServicio[];
  sitios: Sitio[];
  tuneles: EstadoTunel[];
  hosts: EstadoHosts;
}

export interface ResultadoAjustes {
  aplicar: ResultadoAplicar;
  /** Servicios reiniciados para tomar los ajustes nuevos (p. ej. "Nginx", "PHP 8.4"). */
  reiniciados: string[];
  /** Fallos al reiniciar servicios (los ajustes quedan guardados igual). */
  errores: string[];
}

const INTERVALO_SONDEO_MS = 3000;

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Lee el estado del archivo hosts sin impedir el arranque: un fallo se informa en el estado. */
async function estadoHostsSeguro(
  hosts: GestorHosts,
  eventos: Eventos<EventosNucleo>,
  dominios: string[],
): Promise<EstadoHosts> {
  try {
    return await hosts.estado(dominios);
  } catch (e) {
    const fallo: EstadoHosts = {
      pendientes: [],
      duplicadosFuera: [],
      mensaje: `No se pudo revisar el archivo hosts: ${mensajeDe(e)}`,
    };
    eventos.emit('hosts:estado', fallo);
    return fallo;
  }
}

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
  /** Solo lectura: los cambios pasan por guardarSitio/guardarAjustes, que además aplican. */
  readonly config: { leer(): Promise<Config> };
  /** Aviso de la migración de la carpeta de datos (si hubo algo que informar). */
  avisoInicio: string | null = null;
  private almacenCredenciales!: AlmacenCredenciales;
  private gestorHttps!: GestorHttps;

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
      // ConfigSchema no incluye credenciales: viven en etc/credenciales.json.
      leer: () => almacen.leer(),
    };
    internos.on('servicio:estado', () => this.pedirRecalculo());
  }

  static async crear(o: OpcionesNucleo = {}): Promise<Nucleo> {
    let avisoInicio: string | null = null;
    let baseElegida = o.base;
    if (baseElegida === undefined) {
      const m = await (o.migracion ?? migrarCarpetaDatos)();
      baseElegida = m.base;
      avisoInicio = m.aviso ?? null;
    }
    const rutas = new Rutas(baseElegida);
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
    const https = new GestorHttps({ rutas, plataforma, pidNginx: () => supervisor.pid('nginx') });
    const credenciales = new AlmacenCredenciales(rutas, (fn) => sitios.enCola(fn));
    const servicios = new Servicios({
      rutas,
      plataforma,
      supervisor,
      instalador,
      leerConfig,
      modificarConfig: (fn) => sitios.modificarConfig(fn),
      credenciales,
      ramasEnUso: async () => ramasEnUso(await sitios.listar()),
      obtenerUpstreams: async () =>
        upstreamsPara(
          await sitios.listar(),
          (await leerConfig()).servicios.php.trabajadores,
          await instalador.instalados('php'),
        ),
      ...(o.sonda ? { sonda: o.sonda } : {}),
      ...(o.ejecutor ? { exec: o.ejecutor } : {}),
      httpsPrincipal: async () => https.datosPrincipal((await leerConfig()).https.puerto),
    });
    sitios = new GestorSitios({
      almacen,
      rutas,
      nginx: servicios.nginx,
      estadoNginx: () => supervisor.estado('nginx'),
      hosts,
      instalador,
      eventos,
      https,
    });
    await migrarCredenciales(rutas, almacen, credenciales);
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
    nucleo.avisoInicio = avisoInicio;
    nucleo.almacenCredenciales = credenciales;
    nucleo.gestorHttps = https;
    o.alIniciar?.(eventos);
    try {
      await supervisor.readoptar();
      await tuneles.restaurar();
      await estadoHostsSeguro(hosts, eventos, dominiosDe(await sitios.listar()));
    } catch (e) {
      nucleo.cerrado = true;
      await supervisor.cerrar().catch(() => undefined);
      throw e;
    }
    return nucleo;
  }

  /** Estado de la autoridad de certificados local (creada / instalada en el almacén del usuario). */
  estadoHttps(): ReturnType<GestorHttps['estado']> {
    return this.gestorHttps.estado();
  }

  /** Crea la autoridad de WolfCore Dev si falta y la instala en el almacén del usuario. */
  instalarCA(): Promise<ResultadoCA> {
    return this.gestorHttps.instalarCA();
  }

  /** Quita la autoridad del almacén del usuario (los sitios vuelven a HTTP al aplicar). */
  quitarCA(): Promise<ResultadoCA> {
    return this.gestorHttps.quitarCA();
  }

  /** Usuario y clave de un servicio propio para "Datos de conexión" (null si aún no se generaron). */
  credenciales(id: IdServicioDatos): Promise<Credenciales | null> {
    return this.almacenCredenciales.leer(id);
  }

  async estadoGeneral(): Promise<EstadoGeneral> {
    const sitios = await this.sitios.listar();
    return {
      servicios: await this.servicios.estados(),
      sitios,
      tuneles: this.tuneles.estados(),
      hosts: await estadoHostsSeguro(this.hosts, this.eventos, dominiosDe(sitios)),
    };
  }

  /** Guarda un sitio nuevo o editado (si hay `id`) y aplica la configuración. */
  async guardarSitio(
    datos: Omit<Sitio, 'id'>,
    id?: string,
  ): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }> {
    if (id) await this.cerrarTunelSiCambia(id, datos);
    const sitio = id ? await this.sitios.editar(id, datos) : await this.sitios.crear(datos);
    return { sitio, aplicar: await this.sitios.aplicar() };
  }

  /**
   * Si el sitio tiene un túnel abierto (o abriéndose) y cambia algo de lo que depende el túnel
   * o su .env (carpeta, variable de URL base o dominio), se cierra antes de editar: así el .env
   * vuelve a su estado original en la carpeta de siempre.
   */
  private async cerrarTunelSiCambia(id: string, datos: Omit<Sitio, 'id'>): Promise<void> {
    const t = this.tuneles.estados().find((x) => x.sitioId === id);
    if (!t || (t.estado !== 'activo' && t.estado !== 'iniciando')) return;
    const actual = (await this.sitios.listar()).find((s) => s.id === id);
    if (!actual) return;
    const cambia =
      actual.carpeta !== datos.carpeta ||
      (actual.urlBaseVar ?? null) !== (datos.urlBaseVar ?? null) ||
      actual.dominio !== datos.dominio.trim().toLowerCase();
    if (cambia) await this.tuneles.cerrar(id);
  }

  /**
   * Guarda el puerto de Nginx y los trabajadores de PHP y los pone en marcha: regenera los
   * vhosts (nuevo `listen`), reinicia Nginx si estaba encendido y cambió el puerto (si no, lo
   * recarga) y reinicia las ramas de PHP encendidas si cambiaron los trabajadores.
   */
  async guardarAjustes(a: AjustesServicios): Promise<ResultadoAjustes> {
    validarAjustes(a);
    const previo = await this.config.leer();
    await this.sitios.guardarAjustes(a);
    const reiniciados: string[] = [];
    const errores: string[] = [];
    const vivo = (id: string): boolean => {
      const e = this.supervisor.estado(id);
      return e === 'encendido' || e === 'iniciando';
    };

    if (a.trabajadores !== previo.servicios.php.trabajadores) {
      for (const v of await this.instalador.instalados('php')) {
        if (!vivo(this.servicios.php.idTrabajador(v, 0))) continue;
        try {
          await this.servicios.detener(`php-${v}`);
          await this.servicios.iniciar(`php-${v}`);
          reiniciados.push(`PHP ${v}`);
        } catch (e) {
          errores.push(`PHP ${v}: ${mensajeDe(e)}`);
        }
      }
    }

    const reiniciarNginx = a.puerto !== previo.servicios.nginx.puerto && vivo('nginx');
    if (reiniciarNginx) {
      try {
        await this.servicios.detener('nginx');
      } catch (e) {
        errores.push(`Nginx: ${mensajeDe(e)}`);
      }
    }
    const aplicar = await this.sitios.aplicar();
    if (reiniciarNginx && aplicar.nginx.ok) {
      try {
        await this.servicios.iniciar('nginx');
        reiniciados.push('Nginx');
        aplicar.nginx = { ok: true, salida: `Nginx reiniciado en el puerto ${a.puerto}.` };
      } catch (e) {
        aplicar.nginx = { ok: false, salida: mensajeDe(e) };
      }
    }
    return { aplicar, reiniciados, errores };
  }

  /** "Detener todo": cierra primero los túneles (devolviendo los .env) y luego los servicios. */
  async detenerTodo(): Promise<void> {
    const errores = await this.tuneles.cerrarTodos();
    await this.servicios.detenerTodo();
    if (errores.length) throw errores[0];
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
        // Primero los .env (lo crítico si el cierre se corta), luego los túneles en paralelo.
        for (const e of await this.tuneles.cerrarTodos()) anotar(e);
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
