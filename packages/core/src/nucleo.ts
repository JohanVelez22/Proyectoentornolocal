import type * as childProcess from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { Almacen, AlmacenCredenciales, migrarCredenciales } from './almacen';
import {
  BasesDeDatos,
  type BaseListada,
  type DatosConexion,
  type MotorBd,
  type ObjetivoBd,
  type OpcionesCrearBase,
  type ResultadoCrear,
} from './bd/basesDeDatos';
import { migrarInstancias } from './migraciones/instancias';
import { puertosConfigurados } from './servicios/instancias';
import type { RespaldoDatos, TipoRespaldoDatos } from './servicios/actualizar';
import type { PlanActualizar, ResultadoNuevaRama } from './servicios/definicion';
import { armarTabla, type ServicioVersiones, type TablaVersiones } from './catalogo/tablaVersiones';
import { detectarFormato, type FormatoRespaldo } from './bd/formato';
import { InstaladorPgvector, type ResultadoBuildTools } from './bd/pgvector';
import {
  Respaldos,
  type OpcionesRestaurar,
  type OrigenImportar,
  type ResultadoRestaurar,
} from './bd/respaldos';
import { Instalador } from './catalogo/instalador';
import type { ServicioInstalable, VersionDisponible } from './catalogo/catalogo';
import { Novedades, SERVICIOS_NOVEDADES } from './catalogo/novedades';
import {
  CatalogoVivo,
  ramaFija,
  type FiltroVersiones,
  type ListadoVersiones,
} from './catalogo/vivo';
import {
  CentroAvisos,
  TIPOS_AVISO,
  conectarFuentesAvisos,
  revisarVencimientos,
  type TipoAviso,
} from './avisos/avisos';
import { Eventos, type EventosNucleo } from './eventos';
import { ServidorFtp } from './ftp/servidorFtp';
import { GestorHosts } from './hosts/hosts';
import { GestorHttps, type EstadoHttps, type ResultadoCA } from './https/certificados';
import { ConfianzaCa, type EstadoConfianza, type ResultadoFirefox } from './https/confianza';
import { Adminer } from './herramientas/adminer';
import { Composer } from './herramientas/composer';
import { PathUsuario, respaldoPathUsuario } from './herramientas/pathUsuario';
import { abrirArchivoDelSitio, abrirEnVsCode } from './herramientas/editor';
import { Terminal } from './herramientas/terminal';
import { ClienteOllama, SUGERIDOS, type ModeloOllama } from './ia/ollama';
import { bloqueEnvIa } from './ia/envIa';
import { GestorIa } from './ia/gestorIa';
import { completarPlataforma, crearPlataforma } from './plataforma/index';
import type { IdTerminal, PlataformaCompleta, TerminalDisponible } from './plataforma/tipos';
import { baseDelProyecto, leerEnvAcotado, type BaseProyecto } from './bd/baseProyecto';

export { LIMITE_ENV_BYTES } from './bd/baseProyecto';
import { nombreEjecutable } from './plataforma/sistema';
import type { Ejecutor, Plataforma } from './plataforma/tipos';
import { ejecutorPorDefecto, PlataformaWindows } from './plataforma/win';
import { Supervisor } from './procesos/supervisor';
import { claveMayorMenor, Rutas } from './rutas';
import { Mailpit } from './servicios/mailpit';
import { Servicios, type IdServicio } from './servicios/servicios';
import { compararVersiones } from './servicios/nginx';
import { parsearInstancia } from './servicios/instancias';
import { Agentes } from './agentes/agentes';
import { ErrorWolf } from './errores';
import { Contenedores } from './contenedores/contenedores';
import { ServidorMcp, type EstadoMcp, type OperacionesMcp } from './mcp/servidor';
import { asegurarArchivosDepuracion, rutasDepuracion } from './depuracion/prepend';
import {
  VisorErrores,
  type ErrorAgrupado,
  type FiltroErrores,
  type ResumenError,
} from './depuracion/errores';
import {
  ReceptorDumps,
  textoParaCopiar,
  type Dump,
  type EstadoReceptor,
  type FiltroDumps,
  type ResumenDump,
} from './depuracion/receptor';
import { detectarSitio, type ProyectoDetectado } from './sitios/detectar';
import {
  GestorSitios,
  ramasEnUso,
  upstreamsPara,
  validarAjustes,
  type AjustesServicios,
  type ResultadoAplicar,
} from './sitios/sitios';
import { migrarCarpetaDatos } from './migracion';
import { catalogo } from './catalogo/catalogo';
import { EditorVhost } from './nginx/editor';
import { puertosPhp } from './nginx/principal';
import { ARGS_PRUEBA_INI_SITIO, codificarIni, decodificarIni } from './php/ini';
import {
  AjustesPhpSitio,
  esFalloAjenoAlIni,
  iniSitio,
  type AvisoPoolSitio,
  type ResultadoPhpSitio,
  necesitaPoolPropio,
  PoolsSitio,
  RANGO_POOLS_SITIO,
} from './php/poolSitio';
import {
  configPhpStorm,
  escribirLaunchJson,
  vistaLaunchJson,
  type XdebugSitio,
} from './php/xdebug';
import { ExtensionesPhp } from './php/extensiones';
import { IniPhp } from './php/ini';
import { puertoResponde } from './procesos/sonda';
import { UrlBase } from './sitios/urlbase';
import type {
  Config,
  Credenciales,
  EstadoHosts,
  EstadoInstancia,
  EstadoServicio,
  EstadoTunel,
  IdInstancia,
  IdServicioDatos,
  Sitio,
  TipoSitio,
} from './tipos';
import {
  CambiosPreferenciasUiSchema,
  IDS_SERVICIO_DATOS,
  TIPOS_CON_PHP,
  type CambiosPreferenciasUi,
  type PreferenciasUi,
} from './tipos';
import { Tuneles } from './tuneles/tuneles';
// Registran sus DefServicio al cargarse: el núcleo no depende de que alguien importe index.ts.
import './servicios/bd/mysql';
import './servicios/bd/postgresql';
import './servicios/bd/redis';
import './servicios/bd/mongodb';
import './servicios/mailpit';
import './servicios/ollama';
import { Runtimes, type RuntimesProyecto, type TipoRuntime } from './runtimes/runtimes';
import { ProcesosProyecto, type EstadoProcesoProyecto } from './proyectos/procesos';
import {
  escribirConfigProyecto,
  leerConfigProyecto,
  ConfigProyectoSchema,
  type ConfigProyecto,
  type PasoReceta,
} from './proyectos/config';
import {
  detectarProyecto as detectarProyectoB,
  phpPorDefecto,
  type Deteccion,
} from './proyectos/detectar';
import { RegistroPasos } from './proyectos/pasos';
import { registrarPasosReales, type DepsPasos } from './proyectos/pasos/index';
import { asignarPuertoProxy, datosAlCrear } from './proyectos/pasos/sitio';
import {
  EjecutorRecetas,
  recetaEfectiva,
  type EstadoReceta,
  type OpcionesReceta,
  type ResultadoReceta,
} from './proyectos/recetas';
import {
  AVISO_RECETA_CAMBIADA,
  buscarPuertoLibre,
  comandoDePaso,
  huellaReceta,
  puertoLibreAhora,
} from './proyectos/resumen';
import { Doctor } from './doctor/doctor';
import type { CodigoError } from './errores';
import { esIdServicioDatos } from './servicios/definicion';
import { VigilanteProyectos, type SugerenciaProyecto } from './proyectos/vigilar';
import { Git, type DisponibilidadGit, type EstadoGit, type ResultadoTraer } from './git/git';
import { GitHub, type OpcionesRepos, type RepoGithub } from './git/github';
import { Metricas, type MuestraSistema } from './monitor/metricas';
import { Registros, type FuenteRegistro } from './monitor/registros';
import {
  HerramientasPuertos,
  type OpcionesFinalizar,
  type PuertoEnUso,
} from './herramientas/puertos';
import { limpiarBom, type ResultadoBom } from './herramientas/bom';
import { emitirCertificadoLibre } from './herramientas/certificadosLibres';
import { entornoSistema, PLAZO_VERSION_MS, type EntornoSistema } from './herramientas/entorno';
import { muestraSistemaWindows } from './plataforma/win';
import { lanzadorPorDefecto } from './plataforma/lanzar';
import type { Lanzador, MuestraPlataforma } from './plataforma/tipos';
import { PUERTO_ADMINER } from './nginx/principal';

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
  /** Para pruebas: lanzador de los comandos con streaming (pasos de receta, git). */
  lanzar?: Lanzador;
  /** PID del proceso principal y de su padre (por defecto, los de este proceso). */
  pidApp?: number;
  pidPadre?: number;
  /** Para pruebas: consulta de CPU y RAM por PID (por defecto, un PowerShell por muestra). */
  consultarMetricas?: (pids: number[]) => Promise<MuestraPlataforma>;
  /** Para pruebas: ¿se puede escuchar en 127.0.0.1:puerto? */
  probarPuerto?: (puerto: number) => Promise<boolean>;
  /** Para pruebas: git y GitHub con dependencias falsas. */
  git?: Git;
  github?: GitHub;
  /**
   * Espera antes de la primera revisión de versiones nuevas (por defecto 60 s: no compite con el
   * arranque). Después, cada 24 h.
   */
  retrasoNovedadesMs?: number;
}

/** Fuente de registro tal como la ve la interfaz: sin la ruta del archivo. */
export type FuenteRegistroPublica = Omit<FuenteRegistro, 'ruta'>;

/** Estado de un proceso de proyecto para la interfaz: sin la ruta del log. */
export type EstadoProcesoPublico = Omit<EstadoProcesoProyecto, 'log'>;

/** Resumen de la receta para confirmarla: el comando real de cada paso y si cambió. */
export interface ResumenReceta {
  proyecto: string;
  pasos: string[];
  /** La receta no es la que había al marcar "Confío en este repositorio" (o no hay huella). */
  cambio: boolean;
}

/** Receta que se ejecutaría para una carpeta y de dónde sale. */
export interface RecetaPropuesta {
  receta: PasoReceta[];
  origen: 'wolfcore.yml' | 'defecto';
  deteccion: Deteccion;
}

export interface EstadoGeneral {
  servicios: EstadoServicio[];
  sitios: Sitio[];
  tuneles: EstadoTunel[];
  hosts: EstadoHosts;
}

/** PHP de un sitio en su tarjeta (ajustes propios, Xdebug y su pool). */
export interface EstadoPhpSitio {
  phpIni: Record<string, string>;
  xdebug: XdebugSitio | null;
  /** ¿Usa su propio pool de php-cgi? */
  poolPropio: boolean;
  /** ¿Está en marcha ese pool? (vive con el PHP de su rama) */
  enMarcha: boolean;
  /** ¿Está php_xdebug.dll en ext/ de su rama? */
  xdebugInstalado: boolean;
  /** Qué configurar en PhpStorm (si hay Xdebug). */
  phpStorm: string | null;
}

export interface ResultadoAjustes {
  aplicar: ResultadoAplicar;
  /** Servicios reiniciados para tomar los ajustes nuevos (p. ej. "Nginx", "PHP 8.4"). */
  reiniciados: string[];
  /** Fallos al reiniciar servicios (los ajustes quedan guardados igual). */
  errores: string[];
}

interface ModulosNucleo {
  /** Plataforma completa (lo que una parcial de prueba no tenga lo pone la de Windows). */
  plataforma: PlataformaCompleta;
  /** Editor del vhost de cada sitio (reglas propias o vhost completo, con nginx -t y vuelta atrás). */
  editorVhost: EditorVhost;
  /** php.ini de cada rama (editor con prueba, copia y vuelta atrás). */
  iniPhp: IniPhp;
  /** Pools propios de los sitios con ajustes de php.ini o Xdebug. */
  poolsSitio: PoolsSitio;
  /** Cambios de php.ini y Xdebug por sitio (prueba, salud y vuelta atrás). */
  ajustesPhpSitio: AjustesPhpSitio;
  /** Extensiones de PHP de cada rama (ext/ y catálogo de terceros). */
  extensionesPhp: ExtensionesPhp;
  /** Agentes de programación (Claude Code, Codex CLI, Hermes Agent). */
  agentes: Agentes;
  /** Proveedores de IA en la nube (config, pruebas y bloque .env por proyecto). */
  ia: GestorIa;
  avisos: CentroAvisos;
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
  runtimes: Runtimes;
  recetas: EjecutorRecetas;
  git: Git;
  github: GitHub;
  vigilante: VigilanteProyectos;
  metricas: Metricas;
  registros: Registros;
  puertos: HerramientasPuertos;
  doctor: Doctor;
  confianza: ConfianzaCa;
  /** Contenedores Docker/Podman: listar, iniciar, detener, reiniciar y registros. */
  contenedores: Contenedores;
  /** Catálogo en vivo (fuentes oficiales, caché de 6 h y lista fija de respaldo). */
  catalogoVivo: CatalogoVivo;
  /** Dependencias de los pasos de receta (puerto libre…), también para crear proyectos. */
  depsPasos?: DepsPasos;
}

/** Puerto HTTPS: el estándar 443 o uno de usuario (1024–65535). */
const puertoHttpsValido = (p: number): boolean =>
  Number.isInteger(p) && (p === 443 || (p >= 1024 && p <= 65535));

const INTERVALO_SONDEO_MS = 3000;

/** Plazo para que un pool de PHP reiniciado responda en todos sus puertos. */
const PLAZO_PHP_SANO_MS = 15000;

/**
 * ¿Responden todos los puertos del pool antes del plazo? Corta antes si algún trabajador quedó
 * en error (php-cgi que murió al arrancar).
 */
async function phpResponde(
  puertos: number[],
  sonda: (p: number) => Promise<boolean>,
  enError: () => boolean,
  plazoMs = PLAZO_PHP_SANO_MS,
): Promise<boolean> {
  const limite = Date.now() + plazoMs;
  for (;;) {
    if ((await Promise.all(puertos.map((p) => sonda(p)))).every(Boolean)) return true;
    if (enError() || Date.now() >= limite) return false;
    await new Promise((r) => setTimeout(r, 300));
  }
}
/** Publica en el centro de avisos lo que pasa con el PHP propio de un sitio. */
function avisarPoolSitio(avisos: CentroAvisos, a: AvisoPoolSitio): void {
  const datos = {
    fuente: a.sitio,
    ...(a.claves ? { claves: a.claves.join(', ').slice(0, 60) } : {}),
  };
  if (a.tipo === 'sin_puertos') {
    avisos.publicar({
      nivel: 'error',
      tipo: 'puerto-ocupado',
      codigo: 'avisos.php_sitio_sin_puertos',
      datos,
    });
  } else if (a.tipo === 'descartados') {
    avisos.publicar({
      nivel: 'aviso',
      tipo: 'proceso-error',
      codigo: 'avisos.php_sitio_descartados',
      datos,
    });
  } else {
    avisos.publicar({
      nivel: 'error',
      tipo: 'proceso-error',
      codigo: 'avisos.php_sitio_fallo',
      datos,
    });
  }
}

/** Revisión de vencimiento de la CA y de los certificados (cada 24 h y al iniciar). */
const INTERVALO_VENCIMIENTOS_MS = 24 * 60 * 60 * 1000;
/** Versiones nuevas: la primera revisión espera a que termine el arranque; luego, cada 24 h. */
const RETRASO_NOVEDADES_MS = 60_000;
const INTERVALO_NOVEDADES_MS = 24 * 60 * 60 * 1000;

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

/** Copias con fecha de lo que reescribe el Doctor (hosts, PATH, CA). */
const carpetaRespaldosDoctor = (rutas: Rutas): string => path.join(rutas.base, 'etc', 'respaldos');

/** Nginx o hosts que no se pudieron aplicar tras una reparación del Doctor. */
const resultadoAplicarDoctor = (r: ResultadoAplicar): { ok: boolean; codigo?: CodigoError } =>
  r.nginx.ok && r.hosts.ok ? { ok: true } : { ok: false, codigo: 'doctor.reparacion_fallida' };

const dominiosDe = (sitios: Sitio[]): string[] => [
  ...new Set(sitios.flatMap((s) => [s.dominio, ...s.alias])),
];

/** ¿El `.env` nombra ese puerto? (`*_PORT=3306` o `localhost:3306` en una URL). */
export function envUsaPuerto(env: string, puerto: number): boolean {
  const variable = new RegExp(`^\\s*[A-Z0-9_]*PORT\\s*=\\s*["']?${puerto}["']?\\s*$`, 'm');
  const enUrl = new RegExp(`(?:localhost|127\\.0\\.0\\.1|\\[::1\\]):${puerto}(?![0-9])`, 'i');
  return variable.test(env) || enUrl.test(env);
}

export class Nucleo {
  private temporizador: ReturnType<typeof setInterval> | null = null;
  private sondeando = false;
  /** Última firma emitida por servicio agregado. */
  private readonly ultimo = new Map<string, string>();
  private pendiente = false;
  private cerrado = false;

  /** Solo lectura: los cambios pasan por guardarSitio/guardarAjustes, que además aplican. */
  readonly config: { leer(): Promise<Config> };
  /** Aviso de la migración de la carpeta de datos (si hubo algo que informar). */
  avisoInicio: string | null = null;
  /** Arranque de los servicios con `autoIniciar` (tras readoptar); resuelve con los errores. */
  arranqueAutomatico: Promise<string[]> = Promise.resolve([]);
  private readonly avisosPendientes: string[] = [];
  /** Centro de avisos (historial, `aviso:nuevo`); las notificaciones nativas las muestra el proceso principal. */
  readonly avisos: CentroAvisos;
  private bajaFuentesAvisos: (() => void) | null = null;
  private temporizadorVencimientos: ReturnType<typeof setInterval> | null = null;
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
  private readonly plataforma: PlataformaCompleta;
  /** Puerto de Ollama según la configuración (ClienteOllama lo lee de forma síncrona). */
  private readonly puertoOllama: { valor: number };
  /** Servidor MCP local; se maneja con iniciarMcp/detenerMcp (que guardan `mcp.activo`). */
  readonly mcp: ServidorMcp;
  /** Receptor de dumps (127.0.0.1); se maneja con activarDepuracion (que guarda `depuracion.activa`). */
  readonly depuracion: ReceptorDumps;
  readonly runtimes: Runtimes;
  /** Motor de recetas con los pasos reales registrados. */
  readonly recetas: EjecutorRecetas;
  readonly git: Git;
  readonly github: GitHub;
  readonly vigilante: VigilanteProyectos;
  readonly metricas: Metricas;
  readonly registros: Registros;
  /** Errores agrupados de los registros (sigue las fuentes la primera vez que se pide). */
  readonly errores: VisorErrores;
  readonly puertos: HerramientasPuertos;
  /** Revisiones del entorno y reparaciones guiadas (pantalla Doctor). */
  readonly doctor: Doctor;
  /** Confianza de la CA en Node, Python y Firefox. */
  readonly confianza: ConfianzaCa;
  /** Contenedores Docker/Podman (mínimo: nunca crea ni borra contenedores, imágenes ni volúmenes). */
  readonly contenedores: Contenedores;
  /** Catálogo en vivo de versiones (lo que el renderer lista e instala). */
  readonly catalogoVivo: CatalogoVivo;
  /** Avisos de versiones nuevas (nunca instala: solo publica `version-nueva`). */
  readonly novedades: Novedades;
  private temporizadorNovedades: ReturnType<typeof setInterval> | null = null;
  private esperaNovedades: ReturnType<typeof setTimeout> | null = null;
  /** Proveedores de IA en la nube; la clave la pasa el proceso principal en cada llamada. */
  readonly ia: GestorIa;
  /** Agentes: detección, instalación, MCP y apertura en un proyecto (nunca se lanzan solos). */
  readonly agentes: Agentes;
  /** Editor del vhost de Nginx por sitio: reglas propias, modo avanzado, historial. */
  readonly editorVhost: EditorVhost;
  /** php.ini de cada rama: leer, diff, guardar con prueba y vuelta atrás, copias. */
  readonly iniPhp: IniPhp;
  /** Extensiones de PHP: activar, desactivar e instalar del catálogo. */
  readonly extensionesPhp: ExtensionesPhp;
  /** Pools de php-cgi propios de los sitios (ini por sitio y Xdebug). */
  readonly poolsSitio: PoolsSitio;
  private readonly ajustesPhpSitio: AjustesPhpSitio;
  /**
   * Token de GitHub para lo que no pasa por la ventana (MCP). Lo fija el proceso principal
   * (safeStorage); el núcleo nunca lo guarda, lo registra ni lo emite.
   */
  private proveedorTokenGithub: () => string | null | Promise<string | null> = () => null;
  private readonly depsPasos: DepsPasos | undefined;

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
    this.avisos = m.avisos;
    this.plataforma = m.plataforma;
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
    this.runtimes = m.runtimes;
    this.recetas = m.recetas;
    this.git = m.git;
    this.github = m.github;
    this.vigilante = m.vigilante;
    this.metricas = m.metricas;
    this.registros = m.registros;
    this.errores = new VisorErrores({
      registros: this.registros,
      eventos: this.eventos,
      leerSitios: () => this.sitios.listar(),
    });
    this.puertos = m.puertos;
    this.doctor = m.doctor;
    this.confianza = m.confianza;
    this.contenedores = m.contenedores;
    this.catalogoVivo = m.catalogoVivo;
    this.novedades = new Novedades({
      catalogo: this.catalogoVivo,
      instalados: async (servicio) =>
        Promise.all(
          (await this.instalador.instalados(servicio)).map(async (clave) => ({
            version: await this.instalador.versionInstalada(servicio, clave),
          })),
        ),
      centro: this.avisos,
      config: async () => {
        const c = await this.config.leer();
        return { activo: c.avisos.tipos['version-nueva'], silenciados: c.catalogo.silenciados };
      },
    });
    this.ia = m.ia;
    this.agentes = m.agentes;
    this.iniPhp = m.iniPhp;
    this.editorVhost = m.editorVhost;
    this.extensionesPhp = m.extensionesPhp;
    this.poolsSitio = m.poolsSitio;
    this.ajustesPhpSitio = m.ajustesPhpSitio;
    this.depsPasos = m.depsPasos;
    internos.on('servicio:estado', () => this.pedirRecalculo());
    this.mcp = new ServidorMcp({
      operaciones: this.operacionesMcp(),
      token: () => this.tokenMcp(),
      puerto: async () => (await this.config.leer()).mcp.puerto,
      emitirConfirmacion: (s) => this.eventos.emit('mcp:confirmar', s),
      emitirCierre: (c) => this.eventos.emit('mcp:confirmacion-cerrada', c),
    });
    this.depuracion = new ReceptorDumps({
      rutas: this.rutas,
      puerto: async () => (await this.config.leer()).depuracion.puerto,
      emitir: (d) => this.eventos.emit('dump:nuevo', d),
      restringir: (ruta) => this.plataforma.restringirAlUsuario(ruta),
    });
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
    // Lo que una plataforma parcial (pruebas) no tenga lo pone la de Windows con el mismo ejecutor:
    // es lo que hacía el núcleo antes de pasar todo por la plataforma.
    const plat = completarPlataforma(
      plataforma,
      new PlataformaWindows(o.ejecutor ?? ejecutorPorDefecto),
    );
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
    // Temporales de hosts que dejó una ejecución anterior (cierre brusco con un UAC abierto).
    void hosts.limpiarTemporales().catch(() => undefined);
    const avisos = new CentroAvisos({
      archivo: path.join(rutas.base, 'run', 'avisos.json'),
      emitir: (a) => eventos.emit('aviso:nuevo', a),
    });
    avisos.fijarConfig((await leerConfig()).avisos);

    // sitios y servicios se referencian entre sí: se resuelven de forma perezosa.
    // eslint-disable-next-line prefer-const
    let sitios!: GestorSitios;
    // Los procesos de proyecto necesitan servicios (PHP) y composer: también perezosos.
    // eslint-disable-next-line prefer-const
    let procesos!: ProcesosProyecto;
    // Pools propios de los sitios: nginx (upstreams) y servicios (ramas) los usan.
    // eslint-disable-next-line prefer-const
    let pools!: PoolsSitio;
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
    // eslint-disable-next-line prefer-const
    let respaldosRef!: Respaldos;
    let catalogoRef!: CatalogoVivo;
    const servicios: Servicios = new Servicios({
      instalarVersion: async (servicio, version, opciones) => {
        const v = await catalogoRef.buscar(servicio, version);
        if (!v) {
          throw new ErrorWolf(
            'catalogo.version_no_encontrada',
            `No se encontró ${servicio} ${version} en el catálogo.`,
            { servicio, version },
          );
        }
        await instalador.instalar(v, opciones);
      },
      respaldo: {
        listarBases: async (id): Promise<string[]> =>
          (await bd.listar(id as ObjetivoBd)).map((b: BaseListada) => b.nombre),
        respaldar: async (id, base, carpeta) =>
          (await respaldosRef.respaldar(id as ObjetivoBd, base, carpeta)).archivo,
        restaurar: async (id, archivo, base) =>
          (await respaldosRef.restaurar(id as ObjetivoBd, archivo, base)).advertencias,
      },
      avisar: (a) => avisos.publicar(a),
      ftp,
      rutas,
      plataforma,
      supervisor,
      instalador,
      leerConfig,
      modificarConfig: (fn) => sitios.modificarConfig(fn),
      credenciales,
      ramasEnUso: async () => ramasEnUso(await sitios.listar()),
      obtenerUpstreams: async () => {
        const lista = await sitios.listar();
        return [
          ...upstreamsPara(
            lista,
            (await leerConfig()).servicios.php.trabajadores,
            await instalador.instalados('php'),
          ),
          ...(await pools.upstreams(lista)),
        ];
      },
      poolsSitio: {
        // Los fallos de cada sitio ya se avisan en el centro de avisos.
        iniciarRama: async (r) => {
          await pools.sincronizar({ rama: r });
        },
        detenerRama: (r) => pools.detenerRama(r),
      },
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
      avisarVhost: (a) =>
        avisos.publicar({
          nivel: 'aviso',
          tipo: 'proceso-error',
          codigo:
            a.modo === 'manual'
              ? 'avisos.vhost_manual_descartado'
              : 'avisos.vhost_reglas_descartadas',
          datos: { fuente: a.sitio },
        }),
      puertosInternos: async (cfg, id) =>
        puertosInternosVhost(cfg, id, await instalador.instalados('php')),
    });
    await migrarCredenciales(rutas, almacen, credenciales);
    // Servicios de datos a instancias (`mysql` → `mysql@8.4`) antes de readoptar los procesos.
    let avisoInstancias: string | null = null;
    try {
      await migrarInstancias({
        rutas,
        credenciales,
        supervisor,
        definiciones: () => servicios.datos.definiciones(),
        instalados: (s) => instalador.instalados(s),
        rangosReservados: () => plat.rangosReservados('tcp'),
      });
    } catch (e) {
      avisoInstancias = mensajeDe(e);
      console.error(avisoInstancias);
    }
    instalador.fijarVerificadorEnUso((s, v) => servicios.datos.versionEnUso(s, v));
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
    const runtimes = new Runtimes(
      rutas,
      async (tipo) => (await leerConfig()).catalogo.predeterminadas[tipo] ?? null,
    );
    /** php.exe y php.ini de la rama pedida o, si no está instalada, del PHP por defecto. */
    const phpDe = async (rama: string | null): Promise<{ exe: string; ini: string }> => {
      const instaladas = await instalador.instalados('php');
      const elegida = rama && instaladas.includes(rama) ? rama : await composer.phpPorDefecto();
      if (!elegida) throw new Error('No hay PHP instalado: instálelo desde Servicios.');
      return {
        exe: path.join(rutas.bin('php', elegida), nombreEjecutable('php')),
        ini: await servicios.php.asegurarPhpIni(elegida),
      };
    };
    const confianza = new ConfianzaCa({
      rutas,
      plataforma: plat,
      carpetaRespaldos: carpetaRespaldosDoctor(rutas),
    });
    procesos = new ProcesosProyecto({
      confianza,
      depuracion: {
        carpetaPython: async () => (await asegurarArchivosDepuracion(rutas)).carpetaPython,
      },
      rutas,
      supervisor,
      runtimes,
      leerSitios: () => sitios.listar(),
      php: phpDe,
    });
    const serviciosBd = {
      estados: (): Promise<EstadoServicio[]> => servicios.estados(),
      instancias: (m: MotorBd) => servicios.datos.listaInstancias(m),
    };
    const bd: BasesDeDatos = new BasesDeDatos({
      servicios: serviciosBd,
      credenciales,
      rutas,
      exec,
    });
    respaldosRef = new Respaldos({ bd, servicios: serviciosBd, rutas, exec, eventos, plataforma });
    const lanzar = o.lanzar ?? lanzadorPorDefecto;
    // Los pasos de receta llaman a Nucleo.guardarSitio: se resuelve tras construir el núcleo.
    // eslint-disable-next-line prefer-const
    let nucleoRef!: Nucleo;
    const vivo = (id: string): boolean => {
      const e = supervisor.estado(id);
      return e === 'encendido' || e === 'iniciando';
    };
    const puertoOllama = { valor: (await leerConfig()).servicios.datos.ollama.puerto };
    const sondaPhp = o.sonda ?? ((p: number) => puertoResponde(p));
    const phpCli = (r: string): string => path.join(rutas.bin('php', r), nombreEjecutable('php'));
    const iniPhp = new IniPhp({
      rutas,
      exec,
      phpCli,
      ramasInstaladas: () => instalador.instalados('php'),
      asegurarIni: (r) => servicios.php.asegurarPhpIni(r),
      encendida: (r) => vivo(servicios.php.idTrabajador(r, 0)),
      // Los pools de sitio parten del ini de la rama: se reinician con ella (y cuentan en la salud).
      reiniciar: async (r) => {
        await servicios.detener(`php-${r}`);
        await servicios.php.iniciar(r);
        // Un pool de sitio que falla por algo ajeno al ini (su puerto ocupado) se avisa y no hace
        // volver atrás el ini de la rama; cualquier otro fallo, sí.
        for (const e of (await pools.reiniciarRama(r)).values()) {
          if (!esFalloAjenoAlIni(e)) throw e;
        }
      },
      sano: async (r) => {
        const n = (await leerConfig()).servicios.php.trabajadores;
        const ids = Array.from({ length: n }, (_, i) => servicios.php.idTrabajador(r, i));
        const compartido = await phpResponde(puertosPhp(r, n), sondaPhp, () =>
          ids.some((id) => supervisor.estado(id) === 'error'),
        );
        return compartido && (await pools.sanaRama(r));
      },
    });
    const extensionesPhp = new ExtensionesPhp({
      rutas,
      ini: iniPhp,
      exec,
      phpCli,
      catalogo: catalogo.extensionesPhp,
      ...(o.fetch ? { fetch: (u, i) => o.fetch!(u, i) } : {}),
    });
    /** Puertos del rango de los pools de sitio que Windows reserva (Hyper-V…), leídos una vez. */
    let reservadosSistema: Promise<number[]> | null = null;
    const puertosSistema = (): Promise<number[]> => {
      reservadosSistema ??= plat
        .rangosReservados('tcp')
        .then((rangos) => {
          const res: number[] = [];
          for (const r of rangos) {
            const desde = Math.max(r.desde, RANGO_POOLS_SITIO.desde);
            const hasta = Math.min(r.hasta, RANGO_POOLS_SITIO.hasta);
            for (let p = desde; p <= hasta; p++) res.push(p);
          }
          return res;
        })
        .catch(() => []);
      return reservadosSistema;
    };
    const leerIniRama = async (r: string): Promise<Buffer> =>
      readFile(await servicios.php.asegurarPhpIni(r));
    pools = new PoolsSitio({
      rutas,
      plataforma: plat,
      supervisor,
      leerSitios: () => sitios.listar(),
      ramasInstaladas: () => instalador.instalados('php'),
      ramaEncendida: (r) => vivo(servicios.php.idTrabajador(r, 0)),
      leerIniRama,
      rutaDllXdebug: (r) => extensionesPhp.rutaDll(r, 'xdebug'),
      puertosRama: async (r) => puertosPhp(r, (await leerConfig()).servicios.php.trabajadores),
      avisar: (a) => avisarPoolSitio(avisos, a),
      ocupados: async () => {
        const cfg = await leerConfig();
        const ramas = (await instalador.instalados('php')).flatMap((r) =>
          puertosPhp(r, Math.max(cfg.servicios.php.trabajadores, 8)),
        );
        return [...puertosServicios(cfg), ...ramas, ...(await puertosSistema())];
      },
      sonda: sondaPhp,
      rutaPrepend: async () => (await asegurarArchivosDepuracion(rutas)).prepend,
    });
    const ajustesPhpSitio = new AjustesPhpSitio({
      leerSitio: async (id) => (await sitios.listar()).find((x) => x.id === id),
      guardar: (id, campos) =>
        sitios.modificarConfig((c) => {
          const s = c.sitios.find((x) => x.id === id);
          if (!s) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${id}`);
          s.phpIni = campos.phpIni;
          s.xdebug = campos.xdebug;
          if (campos.capturaDumps) s.capturaDumps = true;
          else delete s.capturaDumps;
        }),
      iniPrueba: async (s) => {
        const bytes = await leerIniRama(s.php!);
        const texto = iniSitio(
          s,
          decodificarIni(bytes),
          extensionesPhp.rutaDll(s.php!, 'xdebug'),
          [],
          rutasDepuracion(rutas).prepend,
        );
        return codificarIni(texto, bytes);
      },
      probarIni: (r, t) => iniPhp.probar(r, t, ARGS_PRUEBA_INI_SITIO),
      puertosOcupados: async () => {
        const cfg = await leerConfig();
        const ramas = (await instalador.instalados('php')).flatMap((r) =>
          puertosPhp(r, cfg.servicios.php.trabajadores),
        );
        return [...puertosReservados(cfg), ...ramas];
      },
      dllXdebug: (r) => extensionesPhp.tieneDll(r, 'xdebug'),
      // Solo la DLL: Xdebug nunca se activa en el ini de la rama por esta vía.
      instalarXdebug: async (r) => {
        await extensionesPhp.instalarArchivo(r, 'xdebug');
      },
      sincronizar: () => pools.sincronizar(),
      sanoSitio: (id) => pools.sanoSitio(id),
      aplicar: () => sitios.aplicar(),
    });
    const git = o.git ?? new Git({ exec, lanzar });
    const gestorIa = new GestorIa({
      leerConfig,
      modificarConfig: (fn) => sitios.modificarConfig(fn),
      versionado: (carpeta) => git.versionado(carpeta),
      carpetaRespaldos: () => rutas.respaldosEnv(),
      ...(o.fetch ? { fetch: (u, i) => o.fetch!(u, i) } : {}),
    });
    const sondaNginx = o.sonda ?? ((p: number) => puertoResponde(p));
    const editorVhost = new EditorVhost({
      rutas,
      almacen,
      enCola: (fn) => sitios.enCola(fn),
      vhostDe: (s, cfg) => sitios.vhostDe(s, cfg),
      probar: (id, contenido) => servicios.nginx.probarConVhost(id, contenido),
      estadoNginx: () => supervisor.estado('nginx'),
      recargar: () => servicios.nginx.recargar(),
      sano: async () => {
        const puerto = (await leerConfig()).servicios.nginx.puerto;
        const limite = Date.now() + 5000;
        for (;;) {
          if (supervisor.estado('nginx') === 'error') return false;
          if (await sondaNginx(puerto)) return true;
          if (Date.now() >= limite) return false;
          await new Promise((r) => setTimeout(r, 250));
        }
      },
      emitir: (lista) => eventos.emit('sitio:cambio', lista),
    });
    const modulos: ModulosNucleo = {
      editorVhost,
      iniPhp,
      poolsSitio: pools,
      ajustesPhpSitio,
      extensionesPhp,
      agentes: new Agentes({
        plataforma: plat,
        exec,
        nodePropio: async () => {
          // instalados() va de la más nueva a la más vieja.
          const v = (await runtimes.instalados('node'))[0];
          return v ? runtimes.rutaBin('node', v) : null;
        },
        carpetaAgentes: () => rutas.herramientas('agentes'),
        mcp: { url: () => nucleoRef.mcp.url(), token: () => nucleoRef.tokenMcp() },
        sitio: async (id) => {
          const s = (await sitios.listar()).find((x) => x.id === id);
          if (!s) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${id}`);
          return { carpeta: s.carpeta };
        },
        proveedorIa: (id) => gestorIa.proveedor(id),
        diffPreparado: (carpeta) => git.diffPreparado(carpeta),
        commitPreparado: (carpeta, mensaje) => git.commitPreparado(carpeta, mensaje),
        ...(o.fetch ? { fetch: (u, i) => o.fetch!(u, i) } : {}),
      }),
      ia: gestorIa,
      avisos,
      bd,
      respaldos: respaldosRef,
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
          if (!(await servicios.datos.encendido('postgresql'))) return false;
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
        plataforma: plat,
        confianza,
      }),
      pathUsuario: new PathUsuario({
        rutas,
        acceso: plat.pathUsuario({ respaldo: respaldoPathUsuario(rutas) }),
      }),
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
      runtimes,
      // Se crea abajo: necesita los pasos reales, que usan módulos de esta misma lista.
      recetas: null as unknown as EjecutorRecetas,
      git,
      github: o.github ?? new GitHub({ exec }),
      vigilante: new VigilanteProyectos({ leerConfig, eventos }),
      metricas: new Metricas({
        eventos,
        supervisor,
        consultar: o.consultarMetricas ?? ((p) => muestraSistemaWindows(exec, p)),
        // Con una consulta de prueba no se lee el árbol de procesos real.
        ...(o.consultarMetricas ? {} : { descendientes: (p: number[]) => plat.descendientes(p) }),
        rutaDatos: rutas.base,
      }),
      registros: new Registros({
        rutas,
        eventos,
        leerSitios: () => sitios.listar(),
        rutaLogProceso: (sitioId, procesoId) => procesos.rutaLog(sitioId, procesoId),
      }),
      confianza,
      plataforma: plat,
      doctor: new Doctor({
        plataforma: plat,
        carpetaDatos: rutas.base,
        carpetaRespaldos: carpetaRespaldosDoctor(rutas),
        servicios: () => servicios.estados(),
        puertoHttps: async () => (await leerConfig()).https.puerto,
        puertosPropios: async () => puertosReservados(await leerConfig()),
        probarPuerto: o.probarPuerto ?? puertoLibreAhora,
        puertoCambiable: (s) => s === 'nginx' || s === 'https' || esIdServicioDatos(s),
        cambiarPuerto: (s, p) => nucleoRef.cambiarPuertoDesdeDoctor(s, p),
        dominios: async () => dominiosDe(await sitios.listar()),
        hosts,
        https: {
          vencimientos: async () => {
            const lista = await sitios.listar();
            return (await https.vencimientos()).map((v) => {
              const s = lista.find((x) => x.id === v.id);
              return s ? { ...v, nombre: s.dominio } : v;
            });
          },
          regenerarCertificados: async () => resultadoAplicarDoctor(await sitios.aplicar()),
          regenerarCA: async () => {
            // Confía la nueva antes de tocar nada; aplicar vuelve a emitir los certificados.
            const r = await https.regenerarCA(
              carpetaRespaldosDoctor(rutas),
              async () => (await sitios.aplicar()).nginx.ok,
            );
            if (!r.ok) {
              return {
                ok: false,
                codigo:
                  r.motivo === 'cancelado'
                    ? 'doctor.reparacion_cancelada'
                    : r.vueltaAtrasIncompleta
                      ? 'doctor.ca_vuelta_atras_incompleta'
                      : 'doctor.reparacion_fallida',
              };
            }
            return r.avisoCaVieja
              ? { ok: true, aviso: 'doctor.ca_vieja_sin_quitar' }
              : { ok: true };
          },
        },
        reintentarServicio: (id) => servicios.iniciar(id as IdServicio),
        confianza,
        avisos,
      }),
      puertos: new HerramientasPuertos({
        ejecutar: exec,
        // Supervisor (servicios y procesos de proyecto): sus hijos también cuentan como propios.
        pidsPropios: () =>
          supervisor
            .ids()
            .map((id) => supervisor.pid(id))
            .filter((p): p is number => p !== null),
        ...(o.pidApp !== undefined ? { pidApp: o.pidApp } : {}),
        ...(o.pidPadre !== undefined ? { pidPadre: o.pidPadre } : {}),
      }),
      catalogoVivo: (catalogoRef = new CatalogoVivo(rutas, plat, o.fetch ?? fetch)),
      contenedores: new Contenedores({
        exec,
        lanzar,
        plataforma: plat,
        emitir: (d) => eventos.emit('contenedor:lineas', d),
        alDetenido: (d) =>
          avisos.publicar({
            nivel: 'aviso',
            tipo: 'contenedor-detenido',
            codigo: 'avisos.contenedor_detenido',
            datos: {
              fuente: `${d.motor}:${d.id}`,
              motor: d.motor,
              nombre: d.nombre,
              ...(d.codigoSalida !== null ? { codigoSalida: d.codigoSalida } : {}),
            },
            accion: { ruta: 'contenedores' },
          }),
      }),
    };
    const depsPasos: DepsPasos = {
      rutas,
      lanzar,
      runtimes,
      php: phpDe,
      composerPhar: () => composer.rutaPhar(),
      bd,
      restaurar: (motor, archivo, base, opts) =>
        modulos.respaldos.restaurar(motor, archivo, base, opts),
      mailpit: async () => {
        if ((await instalador.instalados('mailpit')).length === 0) return null;
        return { puerto: (await leerConfig()).servicios.datos.mailpit.puerto };
      },
      guardarSitio: (datos, id) => nucleoRef.guardarSitio(datos, id),
      leerSitio: async (id) => (await sitios.listar()).find((s) => s.id === id),
      puertoLibre: async ({ reservados, preferido, sitioId }) =>
        buscarPuertoLibre({
          reservados: [...reservados, ...puertosReservados(await leerConfig(), sitioId ?? null)],
          preferido: preferido ?? null,
          ...(o.probarPuerto ? { probar: o.probarPuerto } : {}),
        }),
    };
    modulos.depsPasos = depsPasos;
    modulos.recetas = new EjecutorRecetas({
      rutas,
      eventos,
      pasos: registrarPasosReales(new RegistroPasos(), depsPasos),
      sitio: async (id) => (await sitios.listar()).find((s) => s.id === id),
      receta: async (sitio) =>
        recetaEfectiva(sitio.carpeta, await detectarProyectoB(sitio.carpeta)),
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
      modulos,
    );
    nucleoRef = nucleo;
    nucleo.avisoInicio = avisoInicio;
    nucleo.bajaFuentesAvisos = conectarFuentesAvisos(eventos, avisos);
    // Solo consulta motores que ya mostraron contenedores en marcha (nada si nunca se abrió la pantalla).
    nucleo.contenedores.iniciarVigilancia();
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
    if (avisoInstancias) nucleo.avisosPendientes.push(avisoInstancias);
    // Nunca lanza: una carpeta vigilada que ya no existe solo deja de dar sugerencias.
    await nucleo.vigilante.vigilar((await leerConfig()).proyectos.carpetaVigilada);
    // El prepend y wolfdump al día siempre: un sitio con la captura de otra sesión los carga.
    await asegurarArchivosDepuracion(rutas).catch((e: unknown) => {
      console.error('No se pudieron escribir los archivos de la captura de dumps:', mensajeDe(e));
    });
    if ((await leerConfig()).depuracion.activa) {
      await nucleo.depuracion.iniciar().catch((e: unknown) => {
        nucleo.avisosPendientes.push(`No se pudo iniciar la captura de dumps: ${mensajeDe(e)}`);
      });
    } else {
      // El token de una sesión que se cortó no debe quedar: otro programa podría usar ese puerto.
      await rm(rutasDepuracion(rutas).receptor, { force: true }).catch(() => undefined);
    }
    if ((await leerConfig()).mcp.activo) {
      // Un puerto ocupado no impide el arranque: queda como aviso.
      await nucleo.mcp.iniciar().catch((e: unknown) => {
        nucleo.avisosPendientes.push(`No se pudo iniciar el servidor MCP: ${mensajeDe(e)}`);
      });
    }
    nucleo.iniciarRevisionVencimientos();
    nucleo.iniciarRevisionNovedades(o.retrasoNovedadesMs ?? RETRASO_NOVEDADES_MS);
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
    const errores: string[] = [];
    const instancias = await this.servicios.datos.listaInstancias();
    for (const inst of instancias) {
      if (this.cerrado) break;
      if (!inst.autoIniciar) continue;
      const def = this.servicios.datos.def(inst.servicio);
      if (!def) continue;
      const varias = instancias.filter((i) => i.servicio === inst.servicio).length > 1;
      try {
        // La única instancia de un servicio se enciende por el servicio (como siempre).
        await this.servicios.iniciar(varias ? inst.id : inst.servicio);
      } catch (e) {
        errores.push(`${def.nombre}${varias ? ` ${inst.clave}` : ''}: ${mensajeDe(e)}`);
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

  /** Reparación del Doctor: mueve el puerto de Nginx, el HTTPS o el de un servicio de datos. */
  async cambiarPuertoDesdeDoctor(servicio: string, puerto: number): Promise<void> {
    if (servicio === 'https') {
      await this.cambiarPuertoHttps(puerto);
      return;
    }
    if (servicio === 'nginx') {
      const cfg = await this.config.leer();
      await this.guardarAjustes({ puerto, trabajadores: cfg.servicios.php.trabajadores });
      return;
    }
    if (esIdServicioDatos(servicio)) {
      await this.cambiarPuertoServicio(servicio, puerto);
      return;
    }
    throw new Error(`El puerto de ${servicio} no se puede cambiar desde WolfCore Dev.`);
  }

  /** Cambia el puerto de un servicio propio (1024–65535, libre); lo reinicia si estaba encendido. */
  async cambiarPuertoServicio(
    id: IdServicioDatos,
    puerto: number,
  ): Promise<{ proyectos: string[] }> {
    const anterior = (await this.config.leer()).servicios.datos[id].puerto;
    await this.servicios.cambiarPuerto(id, puerto);
    await this.revisarVhostsTrasPuertos();
    if (anterior === puerto) return { proyectos: [] };
    return { proyectos: await this.proyectosConPuerto(anterior) };
  }

  /**
   * Los puertos internos cambiaron: los vhosts (reglas y manuales con proxy_pass) se vuelven a
   * revisar y aplicar. Un fallo se registra; el cambio de puerto ya está hecho.
   */
  private async revisarVhostsTrasPuertos(): Promise<void> {
    try {
      await this.sitios.aplicar();
    } catch (e) {
      console.error('No se pudieron revisar los vhosts tras cambiar un puerto:', mensajeDe(e));
    }
  }

  /** Marca si el servicio se enciende al iniciar WolfCore Dev (no lo enciende ni lo apaga ahora). */
  async autoIniciarServicio(id: IdServicioDatos, valor: boolean): Promise<void> {
    if (!(IDS_SERVICIO_DATOS as readonly string[]).includes(id)) {
      throw new Error('El servicio no admite el arranque automático.');
    }
    await this.servicios.datos.autoIniciar(id, valor);
  }

  /** Borra los datos de un servicio; `confirmacion` debe ser su id. */
  borrarDatosServicio(id: IdServicioDatos, confirmacion: string): Promise<void> {
    return this.servicios.borrarDatos(id, confirmacion);
  }

  // ---- Bases de datos ----

  listarBases(motor: ObjetivoBd): Promise<BaseListada[]> {
    return this.bd.listar(motor);
  }

  crearBase(motor: ObjetivoBd, nombre: string, opts?: OpcionesCrearBase): Promise<ResultadoCrear> {
    return this.bd.crear(motor, nombre, opts);
  }

  /** Borra una base; `confirmacion` debe ser su nombre exacto. */
  borrarBase(motor: ObjetivoBd, nombre: string, confirmacion: string): Promise<void> {
    return this.bd.borrar(motor, nombre, confirmacion);
  }

  /** Datos de conexión del motor, con su clave (solo para "Datos de conexión"). */
  conexionBd(motor: ObjetivoBd): Promise<DatosConexion> {
    return this.bd.conexion(motor);
  }

  bloqueEnvBd(
    motor: ObjetivoBd,
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
  async bloqueEnvSitio(sitioId: string, motor: ObjetivoBd, base: string): Promise<string> {
    const sitio = (await this.config.leer()).sitios.find((s) => s.id === sitioId);
    if (!sitio) throw new Error('El sitio ya no existe.');
    const envActual = (await leerEnvAcotado(path.join(sitio.carpeta, '.env'))) ?? '';
    return this.bd.bloqueEnv(motor, base, sitio.tipo, envActual);
  }

  /**
   * Respaldos, volcados y carpetas apartadas de las actualizaciones de los servicios de datos
   * (con su tamaño), para mostrarlos. Borrarlos es otra operación, con su propia confirmación.
   */
  respaldosDeDatos(servicio?: IdServicioDatos): Promise<RespaldoDatos[]> {
    return this.servicios.datos.respaldosDeDatos(servicio);
  }

  /** Carpeta real donde se guardan los respaldos y las copias de seguridad automáticas. */
  carpetaRespaldos(): Promise<string> {
    return this.respaldos.carpetaRespaldos();
  }

  /** true si la base existe y tiene tablas (para pedir confirmación antes de sobrescribir). */
  tieneTablas(motor: ObjetivoBd, base: string): Promise<boolean> {
    return this.bd.tieneTablas(motor, base);
  }

  /** Formato de un respaldo según sus primeros bytes. */
  formatoRespaldo(archivo: string): Promise<FormatoRespaldo> {
    return detectarFormato(archivo);
  }

  restaurarBase(
    motor: ObjetivoBd,
    archivo: string,
    base: string,
    opts?: OpcionesRestaurar,
  ): Promise<ResultadoRestaurar> {
    return this.respaldos.restaurar(motor, archivo, base, opts);
  }

  respaldarBase(
    motor: ObjetivoBd,
    base: string,
    carpetaDestino?: string,
  ): Promise<{ archivo: string }> {
    return this.respaldos.respaldar(motor, base, carpetaDestino);
  }

  /** Copia una base de otro servidor (solo se lee el origen) a una base local. */
  importarBase(
    motor: ObjetivoBd,
    origen: OrigenImportar,
    destinoBase: string,
    opts?: OpcionesRestaurar,
  ): Promise<ResultadoRestaurar> {
    return this.respaldos.importar(motor, origen, destinoBase, opts);
  }

  // ---- catálogo ----

  /** Versiones publicadas de un servicio (vivo → caché → lista fija), con su origen y fecha. */
  listarCatalogo(
    servicio: ServicioInstalable,
    filtro: FiltroVersiones = {},
  ): Promise<ListadoVersiones> {
    return this.catalogoVivo.listar(servicio, filtro);
  }

  /** Solo las versiones de `listarCatalogo` (forma de siempre). */
  async listarVersiones(
    servicio: ServicioInstalable,
    filtro: FiltroVersiones = {},
  ): Promise<VersionDisponible[]> {
    return (await this.catalogoVivo.listar(servicio, filtro)).versiones;
  }

  /** La versión a instalar, resuelta en el catálogo (nunca con datos del renderer). */
  buscarVersion(servicio: ServicioInstalable, version: string): Promise<VersionDisponible | null> {
    return this.catalogoVivo.buscar(servicio, version);
  }

  // ---- versiones e instancias (pestaña Versiones) ----

  /**
   * Tabla de la pestaña "Versiones" de un servicio: el catálogo (vivo → caché → lista fija) más lo
   * instalado, agrupado por rama, con lo encendido, la predeterminada y las instancias.
   */
  async versionesServicio(
    servicio: ServicioVersiones,
    filtro: FiltroVersiones = {},
  ): Promise<TablaVersiones> {
    const listado = await this.catalogoVivo.listar(servicio, filtro);
    const carpetas = await this.instalador.instalados(servicio);
    const real = new Map<string, string>();
    for (const c of carpetas) real.set(c, await this.instalador.versionInstalada(servicio, c));
    const instaladas = [...real.values()];
    const def = this.servicios.datos.def(servicio);
    const instancias = def ? await this.servicios.datos.listaInstancias(def.id) : [];
    const estados = await this.servicios.estados();
    const vivo = (e: EstadoServicio | undefined): boolean =>
      e?.estado === 'encendido' || e?.estado === 'iniciando';
    const encendidas: string[] = [];
    let predeterminada: string | null = null;
    if (servicio === 'php') {
      for (const [rama, v] of real)
        if (vivo(estados.find((e) => e.id === `php-${rama}`))) {
          encendidas.push(v);
        }
      const rama = await this.composer.phpPorDefecto();
      predeterminada = rama ? (real.get(rama) ?? null) : null;
    } else if (servicio === 'nginx') {
      const activa = await this.servicios.nginx.versionActiva().catch(() => null);
      predeterminada = activa;
      if (activa && vivo(estados.find((e) => e.id === 'nginx'))) encendidas.push(activa);
    } else if (def) {
      for (const i of instancias) if (i.estado === 'encendido') encendidas.push(i.version);
      predeterminada = instancias.find((i) => i.predeterminada)?.version ?? null;
    } else {
      predeterminada = await this.versionPreferida(servicio, instaladas);
    }
    return armarTabla({
      servicio,
      listado,
      instaladas,
      encendidas,
      instancias,
      predeterminada,
      ramaDe: (v) => ramaFija(servicio, v),
    });
  }

  /** Predeterminada de Node, Python, Composer o cloudflared (o la más nueva instalada). */
  private async versionPreferida(servicio: string, instaladas: string[]): Promise<string | null> {
    const elegida = (await this.config.leer()).catalogo.predeterminadas[
      servicio as 'node' | 'python' | 'composer' | 'cloudflared'
    ];
    if (elegida && instaladas.includes(elegida)) return elegida;
    return [...instaladas].sort(compararVersiones).at(-1) ?? null;
  }

  /**
   * Marca la versión que usan los proyectos nuevos y las herramientas: en PHP la rama por
   * defecto, en Nginx la versión activa (si está encendida se reinicia con ella), en Node,
   * Python, Composer y cloudflared la predeterminada. Los servicios de datos usan
   * `predeterminarInstancia`. Solo versiones instaladas.
   */
  async predeterminarVersion(servicio: ServicioVersiones, version: string): Promise<void> {
    const carpetas = await this.instalador.instalados(servicio);
    const noInstalada = (): ErrorWolf =>
      new ErrorWolf('servicios.no_instalado', `${servicio} ${version} no está instalado.`, {
        nombre: `${servicio} ${version}`.slice(0, 60),
      });
    if (servicio === 'php') {
      const rama = claveMayorMenor(version);
      if (!carpetas.includes(rama)) throw noInstalada();
      await this.cambiarPhpPorDefecto(rama);
      return;
    }
    if (!carpetas.includes(version)) throw noInstalada();
    if (servicio === 'nginx') {
      const antes = await this.servicios.nginx.versionActiva().catch(() => null);
      await this.sitios.modificarConfig((c) => {
        c.servicios.nginx.version = version;
      });
      const estado = (await this.servicios.estados()).find((e) => e.id === 'nginx')?.estado;
      if (antes !== version && (estado === 'encendido' || estado === 'iniciando')) {
        await this.servicios.detener('nginx');
        await this.servicios.iniciar('nginx');
      }
      return;
    }
    if (servicio === 'mailpit' || servicio === 'ollama') {
      const estado = (await this.servicios.estados()).find((e) => e.id === servicio)?.estado;
      await this.sitios.modificarConfig((c) => {
        c.servicios.datos[servicio].version = version;
      });
      if (estado === 'encendido' || estado === 'iniciando') {
        await this.servicios.detener(servicio);
        await this.servicios.iniciar(servicio);
      }
      return;
    }
    if (
      servicio === 'node' ||
      servicio === 'python' ||
      servicio === 'composer' ||
      servicio === 'cloudflared'
    ) {
      await this.sitios.modificarConfig((c) => {
        c.catalogo.predeterminadas[servicio] = version;
      });
      return;
    }
    throw new ErrorWolf('servicios.desconocido', `Servicio desconocido: ${servicio}`, {
      id: servicio,
    });
  }

  /**
   * Desinstala solo los binarios de una versión (en PHP, la rama). Nunca borra datos: en los
   * servicios de datos, una versión en uso por una instancia se rechaza; en PHP y Nginx, una
   * versión encendida también.
   */
  async desinstalarVersion(servicio: ServicioVersiones, version: string): Promise<void> {
    const carpeta = servicio === 'php' ? claveMayorMenor(version) : version;
    const estados = await this.servicios.estados();
    const vivo = (id: string): boolean => {
      const e = estados.find((x) => x.id === id)?.estado;
      return e === 'encendido' || e === 'iniciando';
    };
    // La versión activa de Nginx, Mailpit u Ollama (encendida o no) no se quita: antes hay que
    // elegir otra como activa (estrella). En PHP, una rama encendida.
    // La única versión instalada sí se puede quitar si está apagada (el servicio queda sin
    // instalar); con otras instaladas, antes hay que elegir otra como activa.
    let enUso: string | null = null;
    if (servicio === 'php') enUso = vivo(`php-${carpeta}`) ? `php-${carpeta}` : null;
    else if (servicio === 'nginx' || servicio === 'mailpit' || servicio === 'ollama') {
      const activa =
        servicio === 'nginx'
          ? await this.servicios.nginx.versionActiva().catch(() => null)
          : ((await this.servicios.datos.listaInstancias(servicio))[0]?.version ?? null);
      const unica = (await this.instalador.instalados(servicio)).length <= 1;
      if (activa === version && (vivo(servicio) || !unica)) enUso = servicio;
    }
    if (enUso) {
      throw new ErrorWolf(
        'instalador.version_en_uso',
        `No se puede desinstalar ${servicio} ${version}: es la versión en uso (${enUso}). Elija antes otra como activa o, si es la única, apáguela.`,
        { servicio, version, instancia: enUso },
      );
    }
    await this.instalador.desinstalar(servicio, carpeta);
  }

  /** Instancias de un servicio de datos (o de todos) con su estado. */
  listaInstancias(servicio?: IdServicioDatos): Promise<EstadoInstancia[]> {
    return this.servicios.datos.listaInstancias(servicio);
  }

  crearInstancia(servicio: IdServicioDatos, version: string): Promise<IdInstancia> {
    return this.servicios.datos.instancias.crear(servicio, version);
  }

  iniciarInstancia(id: IdInstancia): Promise<void> {
    return this.servicios.iniciar(id);
  }

  detenerInstancia(id: IdInstancia): Promise<void> {
    return this.servicios.detener(id);
  }

  /**
   * Cambia el puerto de una instancia; devuelve los proyectos cuyo `.env` todavía nombra el
   * puerto anterior (para avisar: no se tocan).
   */
  async puertoInstancia(id: IdInstancia, puerto: number): Promise<{ proyectos: string[] }> {
    const { servicio } = parsearInstancia(id);
    const anterior =
      (await this.servicios.datos.listaInstancias(servicio)).find((i) => i.id === id)?.puerto ??
      null;
    await this.servicios.datos.instancias.cambiarPuerto(id, puerto);
    if (anterior === null || anterior === puerto) return { proyectos: [] };
    return { proyectos: await this.proyectosConPuerto(anterior) };
  }

  /** Proyectos cuyo `.env` usa ese puerto (`*_PORT=3306` o `host:3306` en una URL). */
  private async proyectosConPuerto(puerto: number): Promise<string[]> {
    const res: string[] = [];
    for (const s of (await this.config.leer()).sitios) {
      const env = await leerEnvAcotado(path.join(s.carpeta, '.env')).catch(() => null);
      if (env && envUsaPuerto(env, puerto)) res.push(s.nombre);
    }
    return res;
  }

  /** Saca la instancia de la lista (la detiene antes); sus datos quedan en disco. */
  quitarInstancia(id: IdInstancia): Promise<void> {
    return this.servicios.datos.instancias.quitar(id);
  }

  predeterminarInstancia(id: IdInstancia): Promise<void> {
    return this.servicios.datos.instancias.predeterminar(id);
  }

  /** Borra solo data/<servicio>/<clave>; exige escribir el id de la instancia. */
  borrarDatosInstancia(id: IdInstancia, confirmacion: string): Promise<void> {
    return this.servicios.datos.instancias.borrarDatos(id, confirmacion);
  }

  /** Resuelve el bloqueo de una instancia (confirmación escrita; ver `ServiciosDatos.desbloquear`). */
  desbloquearInstancia(
    id: IdInstancia,
    o: { confirmacion: string; respaldo?: string },
  ): Promise<void> {
    return this.servicios.datos.instancias.desbloquear(id, o);
  }

  /** Lo que hará la actualización (para el diálogo): tamaño de los datos y espacio libre. */
  planActualizar(id: IdInstancia): Promise<PlanActualizar> {
    return this.servicios.datos.planActualizar(id);
  }

  /** Parche de la misma rama con respaldo previo (ver `ServiciosDatos.actualizar`). */
  actualizarServicio(
    id: IdInstancia,
    version: string,
    o: { confirmarSinHuella?: true } = {},
  ): Promise<{ anterior: string; respaldo: { carpeta: string; volcados: string[] } }> {
    return this.servicios.datos.actualizar(id, version, o);
  }

  /** Rama nueva = instancia nueva, con copia opcional de las bases de otra instancia. */
  nuevaRamaServicio(
    servicio: IdServicioDatos,
    version: string,
    o: { copiarDesde?: IdInstancia; confirmarSinHuella?: true } = {},
  ): Promise<ResultadoNuevaRama> {
    return this.servicios.datos.nuevaRama(servicio, version, o);
  }

  /** Borra una copia que dejaron las actualizaciones (nunca la carpeta de datos actual). */
  borrarRespaldoDatos(
    r: { servicio: IdServicioDatos; clave: string; tipo: TipoRespaldoDatos; sello: string },
    confirmar: true,
  ): Promise<void> {
    return this.servicios.datos.borrarRespaldoDatos(r, confirmar);
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
    const urlBase = `http://127.0.0.1:${this.puertoOllama.valor}`;
    return bloqueEnvIa(
      { id: 'ollama', tipo: 'ollama', nombre: 'Ollama', urlBase, modelo: null },
      '',
    );
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

  /** Abre la carpeta del sitio en VS Code (la ruta sale de la configuración, nunca de afuera). */
  async abrirEditor(sitioId: string): Promise<void> {
    await abrirEnVsCode((await this.sitioPorId(sitioId)).carpeta);
  }

  /**
   * Abre una terminal en la carpeta del sitio con su PHP y Composer en el PATH: la `terminal`
   * pedida o, sin ella, la predeterminada de Ajustes (o la del sistema).
   */
  async abrirTerminal(sitioId: string, terminal?: IdTerminal | null): Promise<void> {
    const sitio = (await this.sitios.listar()).find((s) => s.id === sitioId);
    if (!sitio) throw new Error('El sitio no existe.');
    const elegida = terminal ?? (await this.config.leer()).herramientas.terminal;
    await this.composer.sincronizarShims();
    await this.terminal.abrir(sitio, elegida);
  }

  /** Terminales instaladas y la predeterminada guardada (null = la del sistema). */
  async terminales(): Promise<{
    disponibles: TerminalDisponible[];
    porDefecto: IdTerminal | null;
  }> {
    return {
      disponibles: await this.terminal.disponibles(),
      porDefecto: (await this.config.leer()).herramientas.terminal,
    };
  }

  /** Fija la terminal predeterminada (null = la del sistema); debe estar instalada. */
  async cambiarTerminalPorDefecto(id: IdTerminal | null): Promise<void> {
    if (id !== null) {
      const t = (await this.terminal.disponibles()).find((x) => x.id === id);
      if (!t) {
        throw new ErrorWolf('terminal.no_instalada', `La terminal no está instalada: ${id}`, {
          nombre: id,
        });
      }
    }
    await this.sitios.modificarConfig((c) => {
      c.herramientas.terminal = id;
    });
  }

  estadoConfianza(): Promise<EstadoConfianza> {
    return this.confianza.estado();
  }

  /** Fija o quita NODE_EXTRA_CA_CERTS como variable del usuario (el renderer ya confirmó). */
  cambiarNodeGlobal(activar: boolean): Promise<EstadoConfianza> {
    return this.confianza.nodeGlobal(activar);
  }

  /**
   * Activa o quita la confianza en `user.js` de los perfiles de Firefox (ya confirmado). Los
   * perfiles fuera de la carpeta de Firefox solo con `incluirFuera` (segunda confirmación).
   */
  cambiarFirefoxConfianza(activar: boolean, incluirFuera = false): Promise<ResultadoFirefox[]> {
    return this.confianza.firefoxActivar(activar, { incluirFuera });
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

  /**
   * Base de datos del proyecto (según su `.env`) y la URL de Adminer que la abre; `url` null si
   * el proyecto no declara una base SQL. Nunca incluye la clave: Adminer la pide.
   */
  async adminerProyecto(
    sitioId: string,
  ): Promise<{ base: BaseProyecto | null; url: string | null }> {
    const sitio = await this.sitioPorId(sitioId);
    const base = await baseDelProyecto(sitio.carpeta);
    return { base, url: base ? await this.adminer.urlProyecto(base) : null };
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
  async credenciales(id: IdServicioDatos | IdInstancia): Promise<Credenciales | null> {
    return this.almacenCredenciales.leer(await this.servicios.datos.claveCredencial(id));
  }

  // ---- Servidor MCP ----

  /** Token del MCP en etc/credenciales.json (`mcp`); se genera la primera vez (32 bytes). */
  /** Token del MCP (solo para el entorno de un agente que abre el usuario; nunca se emite). */
  async tokenMcp(): Promise<string> {
    const c = await this.almacenCredenciales.obtenerOCrear('mcp', () => ({
      usuario: 'mcp',
      clave: randomBytes(32).toString('base64url'),
    }));
    return c.clave;
  }

  /**
   * Token nuevo en etc/credenciales.json; el servidor en marcha deja de aceptar el anterior al
   * instante. No se devuelve: la ventana lo copia con configuracionMcp.
   */
  async regenerarTokenMcp(): Promise<void> {
    await this.almacenCredenciales.guardar('mcp', {
      usuario: 'mcp',
      clave: randomBytes(32).toString('base64url'),
    });
    await this.mcp.recargarToken();
  }

  /** Solo los ids de servicio conocidos (uno desconocido no debe llegar a PHP como versión). */
  private async idServicioMcp(id: string): Promise<IdServicio> {
    if (id === 'nginx' || id === 'ftp' || (IDS_SERVICIO_DATOS as readonly string[]).includes(id)) {
      return id as IdServicio;
    }
    const rama = /^php-(.+)$/.exec(id)?.[1];
    if (rama && (await this.instalador.instalados('php')).includes(rama)) return id as IdServicio;
    throw new Error(`El servicio "${id}" no existe.`);
  }

  /**
   * Lo que publica el servidor MCP, con los mismos métodos que usa la ventana. `prepararReceta`
   * ata la receta a la solicitud: su `ejecutar()` (una sola vez) corre exactamente la receta que
   * se mostró al confirmar, aunque el wolfcore.yml cambie o se prepare otra mientras la ventana
   * pregunta. `traerCambios` usa el token de GitHub que fija el proceso principal.
   */
  private operacionesMcp(): OperacionesMcp {
    return {
      prepararReceta: async (sitioId) => {
        const r = await this.resumenRecetaInterno(sitioId);
        let usada = false;
        return {
          proyecto: r.proyecto,
          pasos: r.pasos.filter((p) => p !== AVISO_RECETA_CAMBIADA),
          ...(r.cambio ? { aviso: AVISO_RECETA_CAMBIADA } : {}),
          ejecutar: () => {
            if (usada) return Promise.reject(new Error('Esta receta preparada ya se usó.'));
            usada = true;
            return this.recetas.ejecutar(sitioId, { receta: r.receta });
          },
        };
      },
      traerCambios: async (sitioId) =>
        this.traerCambios(sitioId, await this.proveedorTokenGithub()),
      leerRegistro: (id, lineas) => this.registros.leerFinal(id, lineas),
      listarDumps: (filtro) => this.listaDumps(filtro),
      leerDump: (id) => this.leerDump(id),
      limpiarDumps: () => this.limpiarDumps(),
      listarErrores: (filtro) => this.listaErrores(filtro),
      leerError: (huella) => this.leerError(huella),
      // Sin rutas de la carpeta de datos (el bloqueo trae las de .fallida y del respaldo).
      listarVersiones: async (servicio, rama) => {
        const t = await this.versionesServicio(servicio, rama ? { rama } : {});
        return {
          ...t,
          instancias: t.instancias.map((i) => ({
            id: i.id,
            version: i.version,
            puerto: i.puerto,
            estado: i.estado,
            predeterminada: i.predeterminada,
            bloqueada: !!i.bloqueo,
          })),
        };
      },
      finalizarProceso: (pid, confirmacion) => this.puertos.finalizarProceso(pid, confirmacion),
      estadoGeneral: () => this.estadoGeneral(),
      listarProyectos: () => this.sitios.listar(),
      estadoServicios: () => this.servicios.estados(),
      iniciarServicio: async (id) => this.servicios.iniciar(await this.idServicioMcp(id)),
      detenerServicio: async (id) => this.servicios.detener(await this.idServicioMcp(id)),
      listarBases: (motor) => this.listarBases(motor),
      crearBase: (motor, nombre) => this.crearBase(motor, nombre),
      respaldarBase: (motor, base) => this.respaldarBase(motor, base),
      restaurarBase: (motor, archivo, base, opts) => this.restaurarBase(motor, archivo, base, opts),
      borrarBase: (motor, nombre, confirmacion) => this.borrarBase(motor, nombre, confirmacion),
      carpetaRespaldos: () => this.carpetaRespaldos(),
      abrirTunel: (sitioId) => this.tuneles.abrir(sitioId),
      cerrarTunel: (sitioId) => this.tuneles.cerrar(sitioId),
    };
  }

  // ---- Proyectos: detección, wolfcore.yml y recetas ----

  private async sitioPorId(id: string): Promise<Sitio> {
    const s = (await this.sitios.listar()).find((x) => x.id === id);
    if (!s) throw new Error('El proyecto ya no existe.');
    return s;
  }

  /**
   * Detección ampliada (Etapa B): tipo, servicios, runtimes y dominio sugerido. Sin una versión
   * de PHP en el proyecto, propone la rama 8.x más nueva instalada.
   */
  async detectarCarpetaProyecto(carpeta: string): Promise<Deteccion> {
    const d = await detectarProyectoB(carpeta);
    return { ...d, php: phpPorDefecto(d.tipo, d.php, await this.instalador.instalados('php')) };
  }

  /** Detección para el formulario de sitios (con el mismo PHP por defecto). */
  async detectarProyecto(carpeta: string): Promise<ProyectoDetectado> {
    const d = await detectarSitio(carpeta);
    return { ...d, php: phpPorDefecto(d.tipo, d.php, await this.instalador.instalados('php')) };
  }

  /** wolfcore.yml de la carpeta, o null si no hay. */
  leerConfigProyecto(carpeta: string): Promise<ConfigProyecto | null> {
    return leerConfigProyecto(carpeta);
  }

  /** Valida y escribe wolfcore.yml en la carpeta. */
  async guardarConfigProyecto(carpeta: string, datos: unknown): Promise<void> {
    const r = ConfigProyectoSchema.safeParse(datos);
    if (!r.success) {
      throw new Error(
        `La configuración del proyecto no es válida: ${r.error.issues
          .slice(0, 5)
          .map((i) => `${i.path.join('.') || 'raíz'}: ${i.message}`)
          .join('; ')}`,
      );
    }
    await escribirConfigProyecto(carpeta, r.data);
  }

  /** Receta que correría la carpeta (la de wolfcore.yml o la de por defecto) y su detección. */
  async recetaPropuesta(carpeta: string): Promise<RecetaPropuesta> {
    const deteccion = await detectarProyectoB(carpeta);
    const config = await leerConfigProyecto(carpeta);
    return {
      receta: await recetaEfectiva(carpeta, deteccion),
      origen: config && config.receta.length > 0 ? 'wolfcore.yml' : 'defecto',
      deteccion,
    };
  }

  /** Ejecuta la receta (exige `confiado`); el avance llega por `receta:progreso`. */
  ejecutarReceta(sitioId: string, opciones: OpcionesReceta = {}): Promise<ResultadoReceta> {
    return this.recetas.ejecutar(sitioId, opciones);
  }

  /** Marca el paso como omitido y sigue desde el siguiente. */
  omitirPasoReceta(sitioId: string, pasoId: string): Promise<ResultadoReceta> {
    return this.recetas.omitir(sitioId, pasoId);
  }

  estadoReceta(sitioId: string): EstadoReceta {
    return this.recetas.estado(sitioId);
  }

  cancelarReceta(sitioId: string): boolean {
    return this.recetas.cancelar(sitioId);
  }

  /** Huella de la receta efectiva de una carpeta; null si no se puede leer (wolfcore.yml roto). */
  private async huellaCarpeta(carpeta: string): Promise<string | null> {
    try {
      return huellaReceta(await recetaEfectiva(carpeta, await detectarProyectoB(carpeta)));
    } catch {
      return null;
    }
  }

  /**
   * Huella que se guarda con el sitio: se toma al marcar "Confío…" (o al cambiar de carpeta), se
   * conserva mientras siga marcado y se borra al desmarcarlo. Lo que mande la interfaz se ignora.
   */
  private async huellaPara(datos: Omit<Sitio, 'id'>, previo: Sitio | undefined) {
    if (!datos.confiado) return null;
    if (previo?.confiado) {
      // Otra carpeta es otro código: sin huella hasta volver a marcar "Confío…".
      return previo.carpeta === datos.carpeta ? (previo.recetaConfiada ?? null) : null;
    }
    return this.huellaCarpeta(datos.carpeta);
  }

  private async resumenRecetaInterno(
    sitioId: string,
  ): Promise<ResumenReceta & { receta: PasoReceta[] }> {
    const sitio = await this.sitioPorId(sitioId);
    const receta = await recetaEfectiva(sitio.carpeta, await detectarProyectoB(sitio.carpeta));
    const cambio = !sitio.recetaConfiada || sitio.recetaConfiada !== huellaReceta(receta);
    const pasos = receta.map(comandoDePaso);
    return {
      proyecto: sitio.nombre || sitio.dominio,
      pasos: cambio ? [AVISO_RECETA_CAMBIADA, ...pasos] : pasos,
      cambio,
      receta,
    };
  }

  /**
   * Lo que correría la receta del proyecto, paso a paso con su comando real (acotado), y si
   * cambió desde que se marcó "Confío en este repositorio".
   */
  async resumenReceta(sitioId: string): Promise<ResumenReceta> {
    const { proyecto, pasos, cambio } = await this.resumenRecetaInterno(sitioId);
    return { proyecto, pasos, cambio };
  }

  // ---- Git y GitHub (el token lo pasa el proceso principal; nunca se guarda aquí) ----

  /**
   * Fija de dónde sale el token de GitHub para lo que no pasa por la ventana (MCP). Solo lo
   * llama el proceso principal.
   */
  fijarProveedorTokenGithub(fn: () => string | null | Promise<string | null>): void {
    this.proveedorTokenGithub = fn;
  }

  disponibilidadGit(): Promise<DisponibilidadGit> {
    return this.git.disponible();
  }

  /** Clona en `destino`; cada línea de progreso (sin tokens) sale por `git:progreso`. */
  clonarRepo(url: string, destino: string, token?: string | null): Promise<void> {
    return this.git.clonar(url, destino, {
      ...(token ? { token } : {}),
      alProgreso: (linea) => this.eventos.emit('git:progreso', { destino, linea }),
    });
  }

  async estadoGit(sitioId: string): Promise<EstadoGit> {
    return this.git.estado((await this.sitioPorId(sitioId)).carpeta);
  }

  /** git fetch + avance rápido; con cambios locales o divergencia no toca nada. */
  async traerCambios(sitioId: string, token?: string | null): Promise<ResultadoTraer> {
    const carpeta = (await this.sitioPorId(sitioId)).carpeta;
    return this.git.traerCambios(carpeta, token ? { token } : {});
  }

  reposGithub(o: OpcionesRepos = {}): Promise<RepoGithub[]> {
    return this.github.repos(o);
  }

  /** Operaciones de gh en curso: cada una corre de a una (winget y el login son interactivos). */
  private readonly ghEnCurso = new Set<'instalar' | 'sesion'>();

  private async unaVezGh(cual: 'instalar' | 'sesion', fn: () => Promise<void>): Promise<void> {
    if (this.ghEnCurso.has(cual)) {
      throw new Error(
        cual === 'instalar'
          ? 'Ya hay una instalación de GitHub CLI en curso.'
          : 'Ya hay un inicio de sesión de GitHub CLI en curso.',
      );
    }
    this.ghEnCurso.add(cual);
    try {
      await fn();
    } finally {
      this.ghEnCurso.delete(cual);
    }
  }

  instalarGh(): Promise<void> {
    return this.unaVezGh('instalar', () => this.github.instalarGh());
  }

  iniciarSesionGh(): Promise<void> {
    return this.unaVezGh('sesion', () => this.github.iniciarSesionGh());
  }

  // ---- Runtimes y procesos de proyecto ----

  runtimesInstalados(tipo: TipoRuntime): Promise<string[]> {
    return this.runtimes.instalados(tipo);
  }

  async runtimesProyecto(sitioId: string): Promise<RuntimesProyecto> {
    return this.runtimes.paraProyecto(await this.sitioPorId(sitioId));
  }

  iniciarProceso(sitioId: string, procesoId: string): Promise<void> {
    return this.procesos.iniciar(sitioId, procesoId);
  }

  detenerProceso(sitioId: string, procesoId: string): Promise<void> {
    return this.procesos.detener(sitioId, procesoId);
  }

  /** Estado de los procesos del proyecto, sin la ruta del log. */
  async estadosProcesos(sitioId: string): Promise<EstadoProcesoPublico[]> {
    return (await this.procesos.estados(sitioId)).map(({ log: _log, ...resto }) => {
      void _log;
      return resto;
    });
  }

  // ---- Carpeta vigilada ----

  sugerenciasProyectos(): Promise<SugerenciaProyecto[]> {
    return this.vigilante.sugerencias();
  }

  /** Guarda la carpeta vigilada (null = no vigilar) y empieza a vigilarla. */
  async cambiarCarpetaVigilada(carpeta: string | null): Promise<void> {
    await this.sitios.modificarConfig((c) => {
      c.proyectos.carpetaVigilada = carpeta;
    });
    await this.vigilante.vigilar(carpeta);
  }

  // ---- Preferencias de la interfaz ----

  /** Tema, idioma, acento y asistente de primer uso (`config.json` → `ui`). */
  async preferenciasUi(): Promise<PreferenciasUi> {
    return (await this.config.leer()).ui;
  }

  /** Guarda solo los campos dados (validados) y devuelve las preferencias resultantes. */
  async guardarPreferenciasUi(cambios: CambiosPreferenciasUi): Promise<PreferenciasUi> {
    const p = CambiosPreferenciasUiSchema.safeParse(cambios);
    if (!p.success) throw new Error('Preferencias no válidas.');
    let res: PreferenciasUi | null = null;
    await this.sitios.modificarConfig((c) => {
      const nuevas: PreferenciasUi = { ...c.ui };
      for (const [k, v] of Object.entries(p.data)) {
        if (v !== undefined) (nuevas as Record<string, unknown>)[k] = v;
      }
      c.ui = nuevas;
      res = nuevas;
    });
    return res ?? (await this.config.leer()).ui;
  }

  // ---- Métricas y registros ----

  iniciarMetricas(): void {
    this.metricas.iniciar();
  }

  pausarMetricas(): void {
    this.metricas.pausar();
  }

  ultimasMetricas(min = 5): MuestraSistema[] {
    return this.metricas.ultimos(min);
  }

  /** Fuentes de registro sin la ruta del archivo (la interfaz solo conoce el id). */
  async fuentesRegistro(): Promise<FuenteRegistroPublica[]> {
    return (await this.registros.fuentes()).map(({ ruta: _ruta, ...resto }) => {
      void _ruta;
      return resto;
    });
  }

  /** Empieza a emitir `registro:lineas` de la fuente; devuelve la función para dejar de seguir. */
  seguirRegistro(id: string): Promise<() => void> {
    return this.registros.seguir(id);
  }

  leerRegistro(id: string, lineas = 500): Promise<string[]> {
    return this.registros.leerFinal(id, lineas);
  }

  /** Carpeta de una fuente de registro (para "Abrir carpeta" desde el proceso principal). */
  async carpetaRegistro(id: string): Promise<string> {
    const f = (await this.registros.fuentes()).find((x) => x.id === id);
    if (!f) throw new Error('La fuente de registro no existe.');
    return path.dirname(f.ruta);
  }

  // ---- Herramientas ----

  puertosEnUso(): Promise<PuertoEnUso[]> {
    return this.puertos.puertosEnUso();
  }

  finalizarProceso(
    pid: number,
    confirmacion: string,
    o: OpcionesFinalizar = {},
  ): Promise<{ pid: number; nombre: string }> {
    return this.puertos.finalizarProceso(pid, confirmacion, o);
  }

  /** Quita el BOM de UTF-8 (con copia .bak-bom); `rutas` vienen de un diálogo. */
  limpiarBom(rutas: string[], simular: boolean): Promise<ResultadoBom[]> {
    return limpiarBom(rutas, { simular });
  }

  /** Certificado firmado por la CA local; devuelve los PEM (no escribe nada). */
  emitirCertificadoLibre(dominios: string[]): Promise<{ certPem: string; clavePem: string }> {
    return emitirCertificadoLibre(dominios, { rutas: this.rutas });
  }

  /**
   * PATH, versiones de las herramientas de WolfCore Dev (lo instalado que ya se conoce; solo
   * Composer, git y gh se consultan, con plazo) y variables con los secretos enmascarados.
   */
  entornoSistema(): Promise<EntornoSistema> {
    const plazo = PLAZO_VERSION_MS;
    return entornoSistema({
      env: this.entornoProceso,
      plazoMs: plazo,
      herramientas: [
        { nombre: 'PHP', leer: () => this.instalador.instalados('php') },
        { nombre: 'Node.js', leer: () => this.runtimes.instalados('node') },
        { nombre: 'Python', leer: () => this.runtimes.instalados('python') },
        {
          nombre: 'Composer',
          leer: async () => {
            const v = await this.composer.version();
            return v ? [v] : [];
          },
        },
        { nombre: 'git', leer: () => this.git.version('git', plazo) },
        { nombre: 'gh', leer: () => this.git.version('gh', plazo) },
      ],
    });
  }

  /** Variables del proceso (sustituible en pruebas). */
  entornoProceso: Record<string, string | undefined> = process.env;

  estadoMcp(): EstadoMcp {
    return this.mcp.estado();
  }

  /** Inicia el servidor MCP y lo deja activo para los próximos arranques. */
  async iniciarMcp(): Promise<EstadoMcp> {
    await this.mcp.iniciar();
    await this.sitios.modificarConfig((c) => {
      c.mcp.activo = true;
    });
    return this.mcp.estado();
  }

  /** Detiene el servidor MCP y lo deja inactivo. */
  async detenerMcp(): Promise<void> {
    await this.mcp.detener();
    await this.sitios.modificarConfig((c) => {
      c.mcp.activo = false;
    });
  }

  /** Cambia el puerto del MCP (1024–65535); si estaba en marcha, lo reinicia en el nuevo. */
  async cambiarPuertoMcp(puerto: number): Promise<EstadoMcp> {
    if (!Number.isInteger(puerto) || puerto < 1024 || puerto > 65535) {
      throw new Error('El puerto del servidor MCP debe ser un número entre 1024 y 65535.');
    }
    const activo = this.mcp.estado().activo;
    await this.sitios.modificarConfig((c) => {
      c.mcp.puerto = puerto;
    });
    if (activo) {
      await this.mcp.detener();
      await this.mcp.iniciar();
    }
    await this.revisarVhostsTrasPuertos();
    return this.mcp.estado();
  }

  /** JSON para "Copiar configuración para Claude Code" (lleva el token: solo al portapapeles). */
  configuracionMcp(): Promise<string> {
    return this.mcp.configuracionClaude();
  }

  /* ───────────── Captura de dumps ───────────── */

  estadoDepuracion(): EstadoReceptor {
    return this.depuracion.estado();
  }

  /**
   * Enciende o apaga el receptor y lo guarda en `depuracion.activa`. Apagarlo apaga también la
   * captura de todos los sitios (sin receptor no tiene sentido dejar el prepend en sus pools):
   * primero Nginx vuelve al pool compartido y después se apagan los pools propios que sobran.
   */
  async activarDepuracion(activa: boolean): Promise<EstadoReceptor> {
    if (activa) {
      await this.depuracion.iniciar();
      await this.sitios.modificarConfig((c) => {
        c.depuracion.activa = true;
      });
      return this.depuracion.estado();
    }
    await this.depuracion.detener();
    let habia = false;
    await this.sitios.modificarConfig((c) => {
      c.depuracion.activa = false;
      for (const s of c.sitios) {
        if (s.capturaDumps) {
          habia = true;
          delete s.capturaDumps;
        }
      }
    });
    if (habia) {
      await this.sitios.aplicar();
      await this.poolsSitio.sincronizar().catch((e: unknown) => {
        console.error('No se pudieron poner al día los PHP de los sitios:', mensajeDe(e));
      });
      this.eventos.emit('sitio:cambio', await this.sitios.listar());
    }
    return this.depuracion.estado();
  }

  /**
   * Captura de dumps de un sitio. Encenderla exige la confirmación de la ventana (define
   * `dump()`/`dd()`/`wd()` en su PHP o pone `wolfdump` en el PYTHONPATH de sus procesos) y
   * enciende el receptor si hacía falta. En PHP pasa por el pool propio con prueba, salud y vuelta
   * atrás; en Python vale desde el próximo arranque de sus procesos.
   */
  async capturaDumpsSitio(
    sitioId: string,
    activa: boolean,
    confirmacion?: true,
  ): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar | null }> {
    const s = await this.sitioPorId(sitioId);
    const esPhp = TIPOS_CON_PHP.includes(s.tipo) && !!s.php;
    if (!esPhp && s.tipo !== 'fastapi') {
      throw new ErrorWolf(
        'depuracion.tipo_no_soportado',
        'La captura de dumps es para sitios PHP y FastAPI.',
      );
    }
    if (activa && confirmacion !== true) {
      throw new ErrorWolf('depuracion.confirmacion', 'Falta confirmar la captura de dumps.');
    }
    if (activa && !this.depuracion.estado().activo) await this.activarDepuracion(true);
    let aplicar: ResultadoAplicar | null = null;
    if (esPhp) {
      aplicar = (await this.ajustesPhpSitio.captura(s.id, activa)).aplicar;
    } else {
      await this.sitios.modificarConfig((c) => {
        const x = c.sitios.find((y) => y.id === s.id);
        if (!x) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${s.id}`);
        if (activa) x.capturaDumps = true;
        else delete x.capturaDumps;
      });
    }
    const lista = await this.sitios.listar();
    this.eventos.emit('sitio:cambio', lista);
    return { sitio: lista.find((x) => x.id === s.id) ?? s, aplicar };
  }

  listaDumps(filtro?: FiltroDumps): ResumenDump[] {
    return this.depuracion.lista(filtro);
  }

  leerDump(id: string): Dump | null {
    return this.depuracion.leer(id);
  }

  limpiarDumps(): void {
    this.depuracion.limpiar();
  }

  /** Texto de un volcado para el portapapeles, con los secretos enmascarados. */
  textoDumpParaCopiar(id: string): string {
    const d = this.depuracion.leer(id);
    if (!d)
      throw new ErrorWolf('depuracion.argumento_invalido', 'Ese volcado ya no está.', {
        campo: 'id',
      });
    return textoParaCopiar(d);
  }

  /** Errores agrupados (sin traza), del más reciente al más viejo. */
  listaErrores(filtro?: FiltroErrores): Promise<ResumenError[]> {
    return this.errores.lista(filtro);
  }

  /** Un error agrupado con la traza de la última vez, o null. */
  leerError(huella: string): Promise<ErrorAgrupado | null> {
    return this.errores.leer(huella);
  }

  /**
   * Abre un archivo del sitio en VS Code en una línea (desde el visor de errores). Solo archivos
   * reales dentro de la carpeta del sitio: el sitio sale de la configuración por su id.
   */
  async abrirEnEditor(sitioId: string, archivo: string, linea: number): Promise<void> {
    await abrirArchivoDelSitio((await this.sitioPorId(sitioId)).carpeta, archivo, linea);
  }

  /** Respuesta de la ventana a `'mcp:confirmar'`; un id desconocido o vencido se ignora. */
  responderConfirmacionMcp(id: string, aprobado: boolean): boolean {
    return this.mcp.responderConfirmacion(id, aprobado);
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
    return this.guardarSitioInterno(datos, id, false);
  }

  /**
   * Proyecto nuevo del asistente: crea el sitio con lo que trae el paso `sitio-crear` de su receta
   * (tipo, PHP, dominio, HTTPS y procesos con puerto libre), así un FastAPI o Node nace con su
   * proxy y su puerto. Exige "Confío en este repositorio". Después se ejecuta la receta.
   */
  async crearSitioProyecto(
    datos: Omit<Sitio, 'id'>,
    receta: readonly PasoReceta[],
  ): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }> {
    if (datos.confiado !== true) {
      throw new Error('Marque "Confío en este repositorio" para montar el proyecto.');
    }
    if (!this.depsPasos) throw new Error('Los pasos de receta no están disponibles.');
    const args = receta.find((p) => p.tipo === 'sitio-crear')?.args ?? {};
    return this.guardarSitio(await datosAlCrear(this.depsPasos, datos, args));
  }

  /**
   * "Confío en este repositorio" otra vez: marca el sitio como confiado y toma la huella de la
   * receta actual, en un solo guardado con los datos frescos del sitio.
   */
  async confiarReceta(sitioId: string): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }> {
    const { id, ...resto } = await this.sitioPorId(sitioId);
    return this.guardarSitioInterno({ ...resto, confiado: true }, id, true);
  }

  private async guardarSitioInterno(
    datos: Omit<Sitio, 'id'>,
    id: string | undefined,
    renovarHuella: boolean,
  ): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }> {
    // El acceso FTP solo cambia con activarFtp/desactivarFtp/ftpSoloLectura; los ajustes de PHP
    // y Xdebug, con guardarPhpIniSitio/xdebugSitio (prueba, salud y vuelta atrás).
    let resto: Omit<Sitio, 'id'> = { ...datos };
    delete resto.ftp;
    delete resto.phpIni;
    delete resto.xdebug;
    // La captura de dumps solo cambia con capturaDumpsSitio (confirmación de la ventana).
    delete resto.capturaDumps;
    if (id) await this.cerrarTunelSiCambia(id, datos);
    const previo = id ? (await this.sitios.listar()).find((s) => s.id === id) : undefined;
    // Las reglas propias y el vhost manual solo cambian con el editor de vhost (revisión,
    // nginx -t y vuelta atrás): guardar el sitio conserva los que tenía y nunca los regenera.
    delete resto.vhostManual;
    delete resto.vhostDesactivado;
    resto.reglasExtra = previo?.reglasExtra ?? '';
    if (previo?.vhostManual) resto.vhostManual = previo.vhostManual;
    // FastAPI/Node con el proceso del proxy sin puerto: se le asigna uno libre (no se rechaza).
    if (this.depsPasos) resto = await asignarPuertoProxy(this.depsPasos, resto, id);
    resto.recetaConfiada = renovarHuella
      ? await this.huellaCarpeta(datos.carpeta)
      : await this.huellaPara(datos, previo);
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
    // Cambió la rama, el tipo o la carpeta: su pool propio (si tiene) se rehace antes de Nginx.
    await this.poolsSitio.sincronizar().catch((e) => {
      console.error('No se pudo poner al día el PHP propio del sitio:', mensajeDe(e));
    });
    return { sitio, aplicar: await this.sitios.aplicar() };
  }

  /** Ajustes de php.ini propios del sitio (prueba con php -v, pool propio y vuelta atrás). */
  guardarPhpIniSitio(sitioId: string, valores: unknown): Promise<ResultadoPhpSitio> {
    return this.ajustesPhpSitio.guardarPhpIni(sitioId, valores);
  }

  /**
   * Xdebug del sitio (null = quitarlo). Activarlo instala la DLL del catálogo si falta, SIN
   * activarla en la rama: solo la carga el pool propio del sitio.
   */
  xdebugSitio(sitioId: string, x: unknown): Promise<ResultadoPhpSitio> {
    return this.ajustesPhpSitio.xdebug(sitioId, x);
  }

  /** Estado de PHP del sitio para su tarjeta: ajustes, Xdebug, pool y configuración de IDE. */
  async phpSitio(sitioId: string): Promise<EstadoPhpSitio> {
    const s = await this.sitioPorId(sitioId);
    const rama = s.php;
    return {
      phpIni: s.phpIni ?? {},
      xdebug: s.xdebug ?? null,
      poolPropio: necesitaPoolPropio(s),
      enMarcha: this.poolsSitio.enMarchaIds().includes(s.id),
      xdebugInstalado: rama ? this.extensionesPhp.tieneDll(rama, 'xdebug') : false,
      phpStorm: s.xdebug ? configPhpStorm(s) : null,
    };
  }

  /** Lo que se escribiría en .vscode/launch.json del proyecto (para confirmarlo). */
  async vistaLaunchJsonSitio(
    sitioId: string,
  ): Promise<{ existe: boolean; contenido: string; diff: string }> {
    return vistaLaunchJson(await this.sitioPorId(sitioId));
  }

  /** Escribe .vscode/launch.json del proyecto (fusiona, con copia previa fuera del proyecto). */
  async escribirLaunchJsonSitio(
    sitioId: string,
  ): Promise<{ creado: boolean; respaldo: string | null }> {
    const s = await this.sitioPorId(sitioId);
    return escribirLaunchJson(
      s,
      path.join(this.rutas.base, 'etc', 'respaldos', 'launch-json', s.id),
    );
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
    // Nginx se vuelve a encender ANTES de hosts: un UAC sin contestar no lo deja apagado.
    const aplicar = await this.sitios.aplicar({
      trasNginx: async (nginx) => {
        if (!reiniciarNginx || !nginx.ok) return nginx;
        try {
          await this.servicios.iniciar('nginx');
          reiniciados.push('Nginx');
          return { ok: true, salida: `Nginx reiniciado en el puerto ${a.puerto}.` };
        } catch (e) {
          return { ok: false, salida: mensajeDe(e) };
        }
      },
    });
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
    const aplicar = await this.sitios.aplicar();
    // Nginx ya no lo sirve: se apaga su PHP propio (si tenía) y se borra su ini.
    await this.poolsSitio.sincronizar().catch((e) => {
      console.error('No se pudo apagar el PHP propio del sitio borrado:', mensajeDe(e));
    });
    return aplicar;
  }

  /** Revisa al iniciar (en segundo plano) y cada 24 h el vencimiento de la CA y los certificados. */
  private iniciarRevisionVencimientos(): void {
    const revisar = (): void => {
      if (this.cerrado) return;
      revisarVencimientos(this.https, this.avisos).catch((e: unknown) => {
        console.error('No se pudo revisar el vencimiento de los certificados:', mensajeDe(e));
      });
    };
    revisar();
    this.temporizadorVencimientos = setInterval(revisar, INTERVALO_VENCIMIENTOS_MS);
    this.temporizadorVencimientos.unref?.();
  }

  /**
   * Revisa en segundo plano si hay versiones nuevas de lo instalado (tras `retraso` y cada 24 h).
   * Sin red no publica nada; nunca instala ni lanza.
   */
  private iniciarRevisionNovedades(retraso: number): void {
    const revisar = (): void => {
      if (this.cerrado) return;
      void this.novedades.revisarYPublicar();
    };
    this.esperaNovedades = setTimeout(revisar, retraso);
    this.esperaNovedades.unref?.();
    this.temporizadorNovedades = setInterval(revisar, INTERVALO_NOVEDADES_MS);
    this.temporizadorNovedades.unref?.();
  }

  /** Silencia (o vuelve a activar) los avisos de versiones nuevas de un servicio. */
  async silenciarVersiones(servicio: string, silenciar: boolean): Promise<string[]> {
    if (!(SERVICIOS_NOVEDADES as readonly string[]).includes(servicio)) {
      throw new ErrorWolf('catalogo.version_no_encontrada', `Servicio desconocido: ${servicio}`, {
        servicio: servicio.slice(0, 40),
        version: '',
      });
    }
    await this.sitios.modificarConfig((c) => {
      const resto = c.catalogo.silenciados.filter((s) => s !== servicio);
      c.catalogo.silenciados = silenciar ? [...resto, servicio] : resto;
    });
    return (await this.config.leer()).catalogo.silenciados;
  }

  /** Cambia las preferencias de avisos (notificaciones nativas y tipos) y las guarda. */
  async configurarAvisos(cambios: {
    nativas?: boolean;
    tipos?: Partial<Record<TipoAviso, boolean>>;
  }): Promise<Config['avisos']> {
    await this.sitios.modificarConfig((c) => {
      if (cambios.nativas !== undefined) c.avisos.nativas = cambios.nativas;
      for (const t of TIPOS_AVISO) {
        const v = cambios.tipos?.[t];
        if (v !== undefined) c.avisos.tipos[t] = v;
      }
    });
    const nuevas = (await this.config.leer()).avisos;
    this.avisos.fijarConfig(nuevas);
    return nuevas;
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
    // Un UAC abierto no debe sobrevivir a la app: se corta la PowerShell que lo espera.
    this.hosts.cancelarElevacion();
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
    if (this.temporizadorVencimientos) clearInterval(this.temporizadorVencimientos);
    this.temporizadorVencimientos = null;
    if (this.esperaNovedades) clearTimeout(this.esperaNovedades);
    this.esperaNovedades = null;
    if (this.temporizadorNovedades) clearInterval(this.temporizadorNovedades);
    this.temporizadorNovedades = null;
    this.bajaFuentesAvisos?.();
    this.bajaFuentesAvisos = null;
    await this.avisos.guardado();
    // Primero lo que solo observa (vigilancia, métricas y registros), luego el MCP y al final
    // túneles, procesos y servicios.
    this.vigilante.dispose();
    this.metricas.pausar();
    this.errores.cerrar();
    this.registros.cerrar();
    this.contenedores.cerrar();
    for (const s of await this.sitios.listar().catch(() => [] as Sitio[])) {
      this.recetas.cancelar(s.id);
    }
    await this.mcp.detener().catch((e: unknown) => {
      console.error('No se pudo detener el servidor MCP:', mensajeDe(e));
    });
    await this.depuracion.detener().catch((e: unknown) => {
      console.error('No se pudo detener el receptor de dumps:', mensajeDe(e));
    });
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

/** Puerto de la interfaz web de Mailpit (fijo). */
const PUERTO_WEB_MAILPIT = 8025;

/**
 * Puertos que un proceso de proyecto nuevo no puede tomar: los de los servicios (Nginx, HTTPS,
 * FTP y su rango pasivo, bases de datos, Mailpit, Ollama, MCP, Adminer) y los de los procesos y
 * proxies de los demás proyectos. Los del sitio `sitioId` no cuentan: el paso que los asigna ya
 * reserva los suyos que no cambian, y así un proceso conserva su puerto si sigue libre.
 */
export function puertosReservados(cfg: Config, sitioId: string | null = null): number[] {
  const r = new Set(puertosServicios(cfg, sitioId));
  // Los pools de php-cgi propios de los sitios (ini por sitio, Xdebug).
  for (let p = RANGO_POOLS_SITIO.desde; p <= RANGO_POOLS_SITIO.hasta; p++) r.add(p);
  return [...r];
}

/**
 * Puertos que el vhost de un sitio no puede usar de destino (`proxy_pass`, `fastcgi_pass`…):
 * los servicios de WolfCore Dev (Adminer, Mailpit, MCP, FTP, bases de datos, Ollama), los PHP de
 * las ramas en uso o instaladas (la de Adminer incluida) y los pools de los sitios. Quedan fuera los de Nginx y los procesos del propio
 * sitio (su servidor de desarrollo).
 */
export function puertosInternosVhost(
  cfg: Config,
  sitioId: string,
  ramasInstaladas: readonly string[] = [],
): number[] {
  const nginx = new Set([cfg.servicios.nginx.puerto, cfg.https.puerto]);
  const r = new Set(puertosReservados(cfg, sitioId).filter((p) => !nginx.has(p)));
  const trabajadores = Math.max(cfg.servicios.php.trabajadores, 8);
  // Las de los sitios y todas las instaladas: Adminer usa la más nueva encendida.
  for (const rama of new Set([...ramasEnUso(cfg.sitios), ...ramasInstaladas])) {
    for (const p of puertosPhp(rama, trabajadores)) r.add(p);
  }
  return [...r];
}

/** Puertos de servicios, de su FTP pasivo y de los procesos y proxies de los proyectos. */
function puertosServicios(cfg: Config, sitioId: string | null = null): number[] {
  const r = new Set<number>([
    cfg.servicios.nginx.puerto,
    cfg.https.puerto,
    cfg.ftp.puerto,
    cfg.mcp.puerto,
    cfg.depuracion.puerto,
    PUERTO_ADMINER,
    PUERTO_WEB_MAILPIT,
    ...Object.values(cfg.servicios.datos).map((d) => d.puerto),
    ...puertosConfigurados(cfg).map((p) => p.puerto),
  ]);
  const [desde, hasta] = cfg.ftp.pasivos;
  for (let p = Math.min(desde, hasta); p <= Math.max(desde, hasta); p++) r.add(p);
  for (const s of cfg.sitios) {
    if (s.id === sitioId) continue;
    if (s.puertoProxy !== null) r.add(s.puertoProxy);
    for (const p of s.procesos) if (p.puerto !== null) r.add(p.puerto);
  }
  return [...r];
}
