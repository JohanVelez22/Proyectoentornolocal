import type * as childProcess from 'node:child_process';
import { open } from 'node:fs/promises';
import path from 'node:path';
import { Almacen, AlmacenCredenciales, migrarCredenciales } from './almacen';
import {
  BasesDeDatos,
  type BaseListada,
  type DatosConexion,
  type MotorBd,
  type OpcionesCrearBase,
  type ResultadoCrear,
} from './bd/basesDeDatos';
import { detectarFormato, type FormatoRespaldo } from './bd/formato';
import { InstaladorPgvector, type ResultadoBuildTools } from './bd/pgvector';
import {
  Respaldos,
  type OpcionesRestaurar,
  type OrigenImportar,
  type ResultadoRestaurar,
} from './bd/respaldos';
import { Instalador } from './catalogo/instalador';
import { listarVersiones } from './catalogo/catalogo';
import { Eventos, type EventosNucleo } from './eventos';
import { ServidorFtp } from './ftp/servidorFtp';
import { GestorHosts } from './hosts/hosts';
import { GestorHttps, type EstadoHttps, type ResultadoCA } from './https/certificados';
import { Adminer } from './herramientas/adminer';
import { Composer } from './herramientas/composer';
import { PathUsuario } from './herramientas/pathUsuario';
import { Terminal } from './herramientas/terminal';
import { bloqueEnvIa, ClienteOllama, SUGERIDOS, type ModeloOllama } from './ia/ollama';
import { crearPlataforma } from './plataforma/index';
import type { Ejecutor, Plataforma } from './plataforma/tipos';
import { ejecutorPorDefecto } from './plataforma/win';
import { Supervisor } from './procesos/supervisor';
import { Rutas } from './rutas';
import { Mailpit } from './servicios/mailpit';
import { Servicios } from './servicios/servicios';
import { detectarSitio } from './sitios/detectar';
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
  TipoSitio,
} from './tipos';
import { IDS_SERVICIO_DATOS } from './tipos';
import { Tuneles } from './tuneles/tuneles';
// Registran sus DefServicio al cargarse: el núcleo no depende de que alguien importe index.ts.
import './servicios/bd/mysql';
import './servicios/bd/postgresql';
import './servicios/bd/redis';
import './servicios/bd/mongodb';
import './servicios/mailpit';
import './servicios/ollama';
import { Runtimes } from './runtimes/runtimes';
import { ProcesosProyecto } from './proyectos/procesos';

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

interface ModulosNucleo {
  bd: BasesDeDatos;
  respaldos: Respaldos;
  pgvector: InstaladorPgvector;
  https: GestorHttps;
  composer: Composer;
  terminal: Terminal;
  pathUsuario: PathUsuario;
  adminer: Adminer;
  ftp: ServidorFtp;
  ollama: ClienteOllama;
  mailpit: Mailpit;
  credenciales: AlmacenCredenciales;
  puertoOllama: { valor: number };
  procesos: ProcesosProyecto;
}

/** Puerto HTTPS: el estándar 443 o uno de usuario (1024–65535). */
const puertoHttpsValido = (p: number): boolean =>
  Number.isInteger(p) && (p === 443 || (p >= 1024 && p <= 65535));

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

  readonly detectarProyecto = detectarSitio;
  readonly listarVersiones = listarVersiones;
  /** Solo lectura: los cambios pasan por guardarSitio/guardarAjustes, que además aplican. */
  readonly config: { leer(): Promise<Config> };
  /** Aviso de la migración de la carpeta de datos (si hubo algo que informar). */
  avisoInicio: string | null = null;
  /** Arranque de los servicios con `autoIniciar` (tras readoptar); resuelve con los errores. */
  arranqueAutomatico: Promise<string[]> = Promise.resolve([]);
  private readonly avisosPendientes: string[] = [];
  readonly bd: BasesDeDatos;
  readonly respaldos: Respaldos;
  readonly pgvector: InstaladorPgvector;
  readonly https: GestorHttps;
  readonly composer: Composer;
  readonly terminal: Terminal;
  readonly pathUsuario: PathUsuario;
  readonly adminer: Adminer;
  readonly ftp: ServidorFtp;
  readonly ollama: ClienteOllama;
  readonly mailpit: Mailpit;
  /** Procesos supervisados de los proyectos (npm run dev, uvicorn…). */
  readonly procesos: ProcesosProyecto;
  private readonly almacenCredenciales: AlmacenCredenciales;
  /** Puerto de Ollama según la configuración (ClienteOllama lo lee de forma síncrona). */
  private readonly puertoOllama: { valor: number };

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
    m: ModulosNucleo,
  ) {
    this.config = {
      // ConfigSchema no incluye credenciales: viven en etc/credenciales.json.
      leer: () => almacen.leer(),
    };
    this.bd = m.bd;
    this.respaldos = m.respaldos;
    this.pgvector = m.pgvector;
    this.https = m.https;
    this.composer = m.composer;
    this.terminal = m.terminal;
    this.pathUsuario = m.pathUsuario;
    this.adminer = m.adminer;
    this.ftp = m.ftp;
    this.ollama = m.ollama;
    this.mailpit = m.mailpit;
    this.procesos = m.procesos;
    this.almacenCredenciales = m.credenciales;
    this.puertoOllama = m.puertoOllama;
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
    await rutas.purgarTemporales();
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
    // Los procesos de proyecto necesitan servicios (PHP) y composer: también perezosos.
    // eslint-disable-next-line prefer-const
    let procesos!: ProcesosProyecto;
    const https = new GestorHttps({ rutas, plataforma, pidNginx: () => supervisor.pid('nginx') });
    const credenciales = new AlmacenCredenciales(rutas, (fn) => sitios.enCola(fn));
    const adminer = new Adminer({
      rutas,
      instalador,
      leerConfig,
      phpEncendido: async (rama) => {
        const n = (await leerConfig()).servicios.php.trabajadores;
        return Array.from({ length: n }, (_, i) => i).some(
          (i) => supervisor.estado(`php-${rama}-${i}`) === 'encendido',
        );
      },
    });
    const ftp = new ServidorFtp({
      leerConfig,
      modificarConfig: (fn) => sitios.modificarConfig(fn),
      credenciales,
    });
    const servicios = new Servicios({
      ftp,
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
      adminerPrincipal: () => adminer.configNginx(),
      procesosProyecto: {
        estadosServicio: () => procesos.estadosServicio(),
        detenerTodos: () => procesos.detenerTodos(),
      },
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

    const exec = o.ejecutor ?? ejecutorPorDefecto;
    const composer = new Composer({
      rutas,
      plataforma,
      instalador,
      exec,
      leerConfig,
      asegurarPhpIni: (r) => servicios.php.asegurarPhpIni(r),
    });
    const runtimes = new Runtimes(rutas);
    procesos = new ProcesosProyecto({
      rutas,
      supervisor,
      runtimes,
      leerSitios: () => sitios.listar(),
      php: async (rama) => {
        const instaladas = await instalador.instalados('php');
        const elegida = rama && instaladas.includes(rama) ? rama : await composer.phpPorDefecto();
        if (!elegida) throw new Error('No hay PHP instalado: instálelo desde Servicios.');
        return {
          exe: path.join(rutas.bin('php', elegida), 'php.exe'),
          ini: await servicios.php.asegurarPhpIni(elegida),
        };
      },
    });
    const bd = new BasesDeDatos({ servicios, credenciales, rutas, exec });
    const vivo = (id: string): boolean => {
      const e = supervisor.estado(id);
      return e === 'encendido' || e === 'iniciando';
    };
    const puertoOllama = { valor: (await leerConfig()).servicios.datos.ollama.puerto };
    const modulos: ModulosNucleo = {
      bd,
      respaldos: new Respaldos({ bd, servicios, rutas, exec, eventos, plataforma }),
      pgvector: new InstaladorPgvector({
        rutas,
        eventos,
        exec,
        instalador,
        versionPostgres: async () => {
          const def = servicios.datos.def('postgresql');
          if (!def) return null;
          try {
            return await servicios.datos.versionActiva(def);
          } catch {
            return null;
          }
        },
        // Detención limpia de nuestro PostgreSQL (libera vector.dll); dice si estaba en marcha.
        detenerPostgres: async () => {
          if (!vivo('postgresql')) return false;
          await servicios.detener('postgresql');
          return true;
        },
        iniciarPostgres: () => servicios.iniciar('postgresql'),
      }),
      https,
      composer,
      terminal: new Terminal({
        rutas,
        asegurarPhpIni: (r) => servicios.php.asegurarPhpIni(r),
        phpPorDefecto: () => composer.phpPorDefecto(),
        runtimes,
      }),
      pathUsuario: new PathUsuario({ rutas, ...(o.ejecutor ? { exec: o.ejecutor } : {}) }),
      adminer,
      ftp,
      ollama: new ClienteOllama({
        base: () => `http://127.0.0.1:${puertoOllama.valor}`,
        modelosDir: () =>
          path.join(
            rutas.datos('ollama', 'actual', () => 'actual'),
            'models',
          ),
        emitir: (p) => eventos.emit('ia:progreso', p),
        ...(o.fetch ? { fetch: o.fetch } : {}),
      }),
      mailpit: o.fetch ? new Mailpit(undefined, o.fetch) : new Mailpit(),
      credenciales,
      puertoOllama,
      procesos,
    };

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
      modulos,
    );
    nucleo.avisoInicio = avisoInicio;
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
    if (avisoInicio) nucleo.avisosPendientes.push(avisoInicio);
    // Sin bloquear el arranque: un fallo queda en el estado del servicio y en un aviso.
    nucleo.arranqueAutomatico = nucleo
      .iniciarAutomaticos()
      .catch((e: unknown) => [mensajeDe(e)])
      .then((errores) => {
        for (const m of errores) console.error('No se pudo iniciar un servicio automático:', m);
        if (errores.length > 0 && !nucleo.cerrado) {
          const aviso = `No se pudieron encender al iniciar: ${errores.join('; ')}`;
          nucleo.avisosPendientes.push(aviso);
          nucleo.eventos.emit('aviso:inicio', aviso);
        }
        return errores;
      });
    return nucleo;
  }

  /**
   * Enciende los servicios instalados con `autoIniciar` y luego los procesos de proyecto con
   * `autoIniciar`; se detiene si el núcleo se cierra.
   */
  private async iniciarAutomaticos(): Promise<string[]> {
    const cfg = await this.config.leer();
    const errores: string[] = [];
    for (const id of IDS_SERVICIO_DATOS) {
      if (this.cerrado) break;
      if (!cfg.servicios.datos[id].autoIniciar) continue;
      const def = this.servicios.datos.def(id);
      if (!def) continue;
      if ((await this.instalador.instalados(id)).length === 0) continue;
      if (this.cerrado) break;
      try {
        await this.servicios.iniciar(id);
      } catch (e) {
        errores.push(`${def.nombre}: ${mensajeDe(e)}`);
      }
    }
    // Después de los servicios (los procesos suelen usar la base de datos).
    if (!this.cerrado) errores.push(...(await this.procesos.autoIniciar(() => !this.cerrado)));
    return errores;
  }

  /**
   * Avisos de inicio pendientes (migración de la carpeta de datos, fallos del arranque
   * automático) unidos en un texto, o null. Se entregan una sola vez: quedan marcados como leídos.
   */
  tomarAvisoInicio(): string | null {
    if (this.avisosPendientes.length === 0) return null;
    const texto = this.avisosPendientes.join('\n\n');
    this.avisosPendientes.length = 0;
    return texto;
  }

  /**
   * Estado de HTTPS: autoridad local (creada / instalada en el almacén del usuario), puerto
   * configurado y el programa ajeno que lo ocupa (con él, los sitios HTTPS quedan pendientes).
   */
  async estadoHttps(): Promise<EstadoHttps> {
    const puerto = (await this.config.leer()).https.puerto;
    const [ca, ocupadoPor] = await Promise.all([
      this.https.estado(),
      this.https.ocupantePuerto(puerto).catch(() => null),
    ]);
    return { ...ca, puerto, ocupadoPor };
  }

  /** Crea la autoridad de WolfCore Dev si falta y la instala en el almacén del usuario. */
  instalarCA(): Promise<ResultadoCA> {
    return this.https.instalarCA();
  }

  /** Quita la autoridad del almacén del usuario (los sitios vuelven a HTTP al aplicar). */
  quitarCA(): Promise<ResultadoCA> {
    return this.https.quitarCA();
  }

  /** Guarda el puerto HTTPS (443 o 1024–65535) y aplica: los vhosts y nginx lo toman. */
  async cambiarPuertoHttps(puerto: number): Promise<ResultadoAplicar> {
    if (!puertoHttpsValido(puerto)) {
      throw new Error('El puerto HTTPS debe ser 443 o un número entre 1024 y 65535.');
    }
    await this.sitios.modificarConfig((c) => {
      c.https.puerto = puerto;
    });
    return this.sitios.aplicar();
  }

  // ---- Servicios ----

  /** Cambia el puerto de un servicio propio (1024–65535, libre); lo reinicia si estaba encendido. */
  cambiarPuertoServicio(id: IdServicioDatos, puerto: number): Promise<void> {
    return this.servicios.cambiarPuerto(id, puerto);
  }

  /** Marca si el servicio se enciende al iniciar WolfCore Dev (no lo enciende ni lo apaga ahora). */
  async autoIniciarServicio(id: IdServicioDatos, valor: boolean): Promise<void> {
    if (!(IDS_SERVICIO_DATOS as readonly string[]).includes(id)) {
      throw new Error('El servicio no admite el arranque automático.');
    }
    await this.sitios.modificarConfig((c) => {
      c.servicios.datos[id].autoIniciar = valor;
    });
  }

  /** Borra los datos de un servicio; `confirmacion` debe ser su id. */
  borrarDatosServicio(id: IdServicioDatos, confirmacion: string): Promise<void> {
    return this.servicios.borrarDatos(id, confirmacion);
  }

  // ---- Bases de datos ----

  listarBases(motor: MotorBd): Promise<BaseListada[]> {
    return this.bd.listar(motor);
  }

  crearBase(motor: MotorBd, nombre: string, opts?: OpcionesCrearBase): Promise<ResultadoCrear> {
    return this.bd.crear(motor, nombre, opts);
  }

  /** Borra una base; `confirmacion` debe ser su nombre exacto. */
  borrarBase(motor: MotorBd, nombre: string, confirmacion: string): Promise<void> {
    return this.bd.borrar(motor, nombre, confirmacion);
  }

  /** Datos de conexión del motor, con su clave (solo para "Datos de conexión"). */
  conexionBd(motor: MotorBd): Promise<DatosConexion> {
    return this.bd.conexion(motor);
  }

  bloqueEnvBd(
    motor: MotorBd,
    base: string,
    tipoProyecto: TipoSitio | 'generico',
    envActual?: string,
  ): Promise<string> {
    return this.bd.bloqueEnv(motor, base, tipoProyecto, envActual);
  }

  /**
   * Bloque de conexión para el `.env` de un sitio: la carpeta sale de la configuración (nunca
   * del renderer), se lee su `.env` (máx. 256 KB; si no hay, vacío) para respetar las variables
   * que ya usa, y se usa el tipo del sitio. Devuelve solo el bloque generado, nunca el `.env`.
   */
  async bloqueEnvSitio(sitioId: string, motor: MotorBd, base: string): Promise<string> {
    const sitio = (await this.config.leer()).sitios.find((s) => s.id === sitioId);
    if (!sitio) throw new Error('El sitio ya no existe.');
    const envActual = await leerEnvAcotado(path.join(sitio.carpeta, '.env'));
    return this.bd.bloqueEnv(motor, base, sitio.tipo, envActual);
  }

  /** Carpeta real donde se guardan los respaldos y las copias de seguridad automáticas. */
  carpetaRespaldos(): Promise<string> {
    return this.respaldos.carpetaRespaldos();
  }

  /** true si la base existe y tiene tablas (para pedir confirmación antes de sobrescribir). */
  tieneTablas(motor: MotorBd, base: string): Promise<boolean> {
    return this.bd.tieneTablas(motor, base);
  }

  /** Formato de un respaldo según sus primeros bytes. */
  formatoRespaldo(archivo: string): Promise<FormatoRespaldo> {
    return detectarFormato(archivo);
  }

  restaurarBase(
    motor: MotorBd,
    archivo: string,
    base: string,
    opts?: OpcionesRestaurar,
  ): Promise<ResultadoRestaurar> {
    return this.respaldos.restaurar(motor, archivo, base, opts);
  }

  respaldarBase(
    motor: MotorBd,
    base: string,
    carpetaDestino?: string,
  ): Promise<{ archivo: string }> {
    return this.respaldos.respaldar(motor, base, carpetaDestino);
  }

  /** Copia una base de otro servidor (solo se lee el origen) a una base local. */
  importarBase(
    motor: MotorBd,
    origen: OrigenImportar,
    destinoBase: string,
    opts?: OpcionesRestaurar,
  ): Promise<ResultadoRestaurar> {
    return this.respaldos.importar(motor, origen, destinoBase, opts);
  }

  // ---- pgvector ----

  estadoPgvector(): ReturnType<InstaladorPgvector['estado']> {
    return this.pgvector.estado();
  }

  instalarBuildTools(): Promise<ResultadoBuildTools> {
    return this.pgvector.instalarBuildTools();
  }

  compilarPgvector(): Promise<{ version: string }> {
    return this.pgvector.compilarEInstalar();
  }

  activarVector(base: string): Promise<void> {
    return this.bd.activarVector(base);
  }

  // ---- IA local (Ollama) ----

  private async refrescarPuertoOllama(): Promise<void> {
    this.puertoOllama.valor = (await this.config.leer()).servicios.datos.ollama.puerto;
  }

  async modelosIa(): Promise<ModeloOllama[]> {
    await this.refrescarPuertoOllama();
    return this.ollama.modelos();
  }

  /** Descarga un modelo; el avance llega por el evento `ia:progreso`. */
  async descargarModelo(nombre: string): Promise<void> {
    await this.refrescarPuertoOllama();
    return this.ollama.descargar(nombre);
  }

  cancelarDescargaModelo(nombre: string): boolean {
    return this.ollama.cancelarDescarga(nombre);
  }

  async borrarModelo(nombre: string): Promise<void> {
    await this.refrescarPuertoOllama();
    return this.ollama.borrar(nombre);
  }

  async probarModelo(nombre: string, texto: string): Promise<string> {
    await this.refrescarPuertoOllama();
    return this.ollama.probar(nombre, texto);
  }

  espacioIa(): Promise<number> {
    return this.ollama.espacioUsado();
  }

  async bloqueEnvIa(): Promise<string> {
    await this.refrescarPuertoOllama();
    return bloqueEnvIa(this.puertoOllama.valor);
  }

  modelosSugeridos(): string[] {
    return [...SUGERIDOS];
  }

  // ---- Correo (Mailpit) ----

  noLeidosCorreo(): Promise<number> {
    return this.mailpit.noLeidos();
  }

  /** Instala Composer y regenera los shims de tools/bin. */
  instalarComposer(): Promise<void> {
    return this.composer.instalar();
  }

  versionComposer(): Promise<string | null> {
    return this.composer.version();
  }

  actualizarComposer(): Promise<string> {
    return this.composer.actualizar();
  }

  /** Fija el PHP de los shims (null = el más reciente instalado) y los regenera. */
  async cambiarPhpPorDefecto(rama: string | null): Promise<void> {
    if (rama !== null && !(await this.instalador.instalados('php')).includes(rama)) {
      throw new Error(`PHP ${rama} no está instalado.`);
    }
    await this.sitios.modificarConfig((c) => {
      c.herramientas.phpPorDefecto = rama;
    });
    await this.composer.sincronizarShims();
  }

  /** Abre una terminal en la carpeta del sitio con su PHP y Composer en el PATH. */
  async abrirTerminal(sitioId: string): Promise<void> {
    const sitio = (await this.sitios.listar()).find((s) => s.id === sitioId);
    if (!sitio) throw new Error('El sitio no existe.');
    await this.composer.sincronizarShims();
    await this.terminal.abrir(sitio);
  }

  estadoPathUsuario(): Promise<boolean> {
    return this.pathUsuario.estado();
  }

  /** Agrega o quita tools/bin del PATH del usuario; el aviso dice cómo ver el cambio. */
  async cambiarPathUsuario(activar: boolean): Promise<{ aviso: string }> {
    if (activar) await this.composer.sincronizarShims();
    return activar ? this.pathUsuario.agregar() : this.pathUsuario.quitar();
  }

  /** Instala Adminer (se sirve en 127.0.0.1:8090 al aplicar la configuración de nginx). */
  instalarAdminer(): Promise<void> {
    return this.adminer.instalar();
  }

  disponibilidadAdminer(): ReturnType<Adminer['disponibilidad']> {
    return this.adminer.disponibilidad();
  }

  /** URL de Adminer para un motor, sin clave; null si Adminer no lo soporta. */
  urlAdminer(motor: string, usuario: string): Promise<string | null> {
    return this.adminer.urlPara(motor, usuario);
  }

  /** Activa el acceso FTP del sitio (usuario = id del sitio, clave aleatoria) y la devuelve. */
  activarFtp(sitioId: string): Promise<Credenciales> {
    return this.ftp.activarSitio(sitioId);
  }

  desactivarFtp(sitioId: string): Promise<void> {
    return this.ftp.desactivarSitio(sitioId);
  }

  regenerarClaveFtp(sitioId: string): Promise<string> {
    return this.ftp.regenerarClave(sitioId);
  }

  ftpSoloLectura(sitioId: string, valor: boolean): Promise<void> {
    return this.ftp.soloLectura(sitioId, valor);
  }

  /** Usuario y clave FTP del sitio (null si no tiene FTP activo). */
  credencialesFtp(sitioId: string): Promise<Credenciales | null> {
    return this.ftp.credencialesFtp(sitioId);
  }

  /** Permite (o no) conectarse al FTP desde la red local; reinicia el servidor si estaba encendido. */
  async ftpRedLocal(valor: boolean): Promise<void> {
    await this.sitios.modificarConfig((c) => {
      c.ftp.redLocal = valor;
    });
    if ((await this.ftp.estado()).estado === 'encendido') {
      await this.ftp.detener();
      await this.ftp.iniciar();
    }
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
    // El acceso FTP solo cambia con activarFtp/desactivarFtp/ftpSoloLectura.
    const resto: Omit<Sitio, 'id'> = { ...datos };
    delete resto.ftp;
    if (id) await this.cerrarTunelSiCambia(id, datos);
    const previo = id ? (await this.sitios.listar()).find((s) => s.id === id) : undefined;
    const sitio = id ? await this.sitios.editar(id, resto) : await this.sitios.crear(resto);
    // Las sesiones FTP abiertas siguen en la carpeta vieja: se cortan al cambiarla.
    if (id && previo && previo.carpeta !== sitio.carpeta) {
      await this.ftp.cortarSesiones(id);
    }
    // HTTPS recién activado: el certificado (y la CA, si falta) se emite antes de aplicar.
    if (sitio.https && !previo?.https) {
      try {
        await this.https.asegurarCertificado(sitio);
      } catch (e) {
        // aplicar lo reintenta y, si vuelve a fallar, lo informa en su resultado.
        console.error('No se pudo emitir el certificado del sitio:', mensajeDe(e));
      }
    }
    // Un proceso quitado del sitio deja de estar supervisado.
    if (id && previo) {
      for (const e of await this.procesos.detenerHuerfanos()) {
        console.error('No se pudo detener un proceso quitado del proyecto:', mensajeDe(e));
      }
    }
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

  /**
   * "Detener todo": cierra primero los túneles (devolviendo los .env) y luego los procesos de
   * proyecto y los servicios.
   */
  async detenerTodo(): Promise<void> {
    const errores = await this.tuneles.cerrarTodos();
    await this.servicios.detenerTodo();
    if (errores.length) throw errores[0];
  }

  /**
   * Cierra el túnel del sitio, detiene sus procesos, lo quita de la configuración y aplica. Si
   * un proceso no se pudo detener, no se borra (quedaría sin seguimiento).
   */
  async borrarSitio(id: string): Promise<ResultadoAplicar> {
    try {
      await this.tuneles.cerrar(id);
    } catch {
      // el túnel puede no estar abierto
    }
    await this.procesos.detenerSitio(id);
    await this.ftp.desactivarSitio(id).catch(() => undefined);
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
        // `cerrado` ya impide encender más servicios; se espera el que esté arrancando para
        // detenerlo también.
        await this.arranqueAutomatico;
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

/** Máximo que se lee del `.env` de un proyecto para detectar sus variables. */
export const LIMITE_ENV_BYTES = 256 * 1024;

/** Primeros 256 KB del archivo como texto; '' si no existe o no se puede leer. */
async function leerEnvAcotado(ruta: string): Promise<string> {
  let f: Awaited<ReturnType<typeof open>> | null = null;
  try {
    f = await open(ruta, 'r');
    const buf = Buffer.alloc(LIMITE_ENV_BYTES);
    const { bytesRead } = await f.read(buf, 0, LIMITE_ENV_BYTES, 0);
    return buf.subarray(0, bytesRead).toString('utf8');
  } catch {
    return '';
  } finally {
    await f?.close().catch(() => undefined);
  }
}
