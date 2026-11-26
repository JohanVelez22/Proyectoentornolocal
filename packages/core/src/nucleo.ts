import type * as childProcess from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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
import {
  armarTabla,
  SERVICIOS_VERSIONES,
  type ServicioVersiones,
  type TablaVersiones,
} from './catalogo/tablaVersiones';
import { huellaDe } from './catalogo/huellas';
import { aislarPlataforma } from './plataforma/aislada';
import { exportarPerfil } from './perfiles/exportar';
import {
  listarInstantaneasEntorno,
  tomarInstantaneaEntorno,
  type DepsInstantaneaEntorno,
  type InstantaneaEntorno,
  type MotivoInstantaneaEntorno,
} from './perfiles/instantaneaEntorno';
import { Perfiles } from './perfiles/importar';
import { crearPuertoWorkspaces } from './workspaces/puerto';
import { Workspaces } from './workspaces/workspaces';
import { GestorTareas } from './tareas/gestor';
import { Programador } from './tareas/programador';
import { CerrojosServicio } from './catalogo/cerrojo';
import {
  Limpieza,
  type DestinoLimpieza,
  type ResultadoLimpieza,
  type SeleccionLimpieza,
  type VersionEnPapelera,
  type UsosVersiones,
  type VersionSinUso,
} from './catalogo/limpieza';
import { calcularUsos } from './catalogo/usoVersiones';
import type {
  DepsPerfiles,
  OpcionesExportarPerfil,
  OpcionesImportarPerfil,
  ResultadoExportarPerfil,
  ResultadoImportarPerfil,
  VistaPreviaPerfil,
} from './perfiles/tipos';
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
import { AccesoBd, type HerramientaBd } from './herramientas/accesoBd';
import { Adminer } from './herramientas/adminer';
import { PhpMyAdmin } from './herramientas/phpmyadmin';
import { Composer } from './herramientas/composer';
import { PathUsuario, respaldoPathUsuario } from './herramientas/pathUsuario';
import {
  abrirArchivoDelSitio,
  abrirEnEditor,
  type ResultadoAbrirEditor,
} from './herramientas/editor';
import type { LanzadorSeparado } from './plataforma/terminalWin';
import { Terminal } from './herramientas/terminal';
import { ClienteOllama, SUGERIDOS, type ModeloOllama } from './ia/ollama';
import { bloqueEnvIa, limpiarRespaldosEnv } from './ia/envIa';
import { GestorIa } from './ia/gestorIa';
import { GestorSmtp } from './correo/gestorSmtp';
import { completarPlataforma, crearPlataforma } from './plataforma/index';
import type {
  EditorDisponible,
  EstadoCaptura,
  IdEditor,
  IdTerminal,
  PlataformaCompleta,
  TerminalDisponible,
} from './plataforma/tipos';
import {
  baseDelProyecto,
  leerBaseDelProyecto,
  leerEnvAcotado,
  type BaseProyecto,
} from './bd/baseProyecto';

export { LIMITE_ENV_BYTES } from './bd/baseProyecto';
import { nombreEjecutable } from './plataforma/sistema';
import type { Ejecutor, Plataforma } from './plataforma/tipos';
import { ejecutorPorDefecto, PlataformaWindows } from './plataforma/win';
import { Supervisor } from './procesos/supervisor';
import { claveMayorMenor, Rutas } from './rutas';
import { Mailpit } from './servicios/mailpit';
import {
  CAPTADORES,
  captadorElegido,
  aplicarEleccionCaptador,
  esIdCaptador,
  estadoCaptador,
  leerRutaSecreta,
  puertoSmtpElegido,
  registrarCaptadores,
  puertosFijosCaptadores,
  IDS_CAPTADOR,
  type EstadoCaptador,
  type IdCaptador,
} from './servicios/correo/captadores';
import { Servicios, type IdServicio } from './servicios/servicios';
import { usosDeCarpeta, type UsoSitio } from './servicios/usoBases';
import { compararVersiones } from './servicios/nginx';
import { parsearInstancia } from './servicios/instancias';
import { Agentes } from './agentes/agentes';
import { ErrorWolf } from './errores';
import { Contenedores } from './contenedores/contenedores';
import { ServidorMcp, type EstadoMcp, type OperacionesMcp } from './mcp/servidor';
import { asegurarArchivosDepuracion, rutasDepuracion } from './depuracion/prepend';
import type { OperacionesCli, SolicitudCli } from './cli/ordenes';
import { ConfirmadorCli } from './cli/confirmador';
import { ServidorCli } from './cli/servidor';
import {
  clienteCliInstalado,
  instalarClienteCli,
  quitarClienteCli,
  type OrigenClienteCli,
} from './herramientas/clienteCli';
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
  CambiosCapturaSchema,
  CambiosPreferenciasUiSchema,
  motivoAtajoCaptura,
  IDS_SERVICIO_DATOS,
  TIPOS_CON_PHP,
  type CambiosCaptura,
  type CapturaConfig,
  type CambiosPreferenciasUi,
  type PreferenciasUi,
} from './tipos';
import { VhostsAuxiliares } from './nginx/auxiliares';
import { GestorLan, PRIMER_PUERTO_LAN, ULTIMO_PUERTO_LAN } from './red/lan';
import { ServidorCa } from './red/servidorCa';
import { Tuneles } from './tuneles/tuneles';
import type { SecretosTunel } from './tuneles/proveedor';
// Registran sus DefServicio al cargarse: el núcleo no depende de que alguien importe index.ts.
import './servicios/bd/mysql';
import './servicios/bd/postgresql';
import './servicios/bd/redis';
import './servicios/bd/mongodb';
import './servicios/mailpit';
import './servicios/correo/captadores';
import './servicios/ollama';
import {
  esTipoRuntime,
  Runtimes,
  type RuntimesProyecto,
  type TipoRuntime,
} from './runtimes/runtimes';
import {
  ProcesosProyecto,
  separarIdSupervisor,
  type EstadoProcesoProyecto,
} from './proyectos/procesos';
import {
  OptimizadorMemoria,
  type CacheApp,
  type ModoMemoria,
  type PlanMemoria,
  type PoolReducible,
  type ResultadoMemoria,
  type ServicioPropio,
} from './sistema/memoria';
import {
  LimpiezaDisco,
  type ResultadoLimpiezaDisco,
  type ResumenCategoria,
} from './sistema/limpiezaDisco';
import {
  EditorCodigo,
  type OpcionesAbrirArchivo,
  type OpcionesGuardarArchivo,
  type ResultadoAbrirArchivo,
  type ResultadoGuardarArchivo,
} from './herramientas/editorCodigo';
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
import { Importador } from './importar/importar';
import type { OpcionesImportar, ResultadoImportar, VistaPreviaImportar } from './importar/importar';
import {
  crearProyecto,
  type OpcionesCrearProyecto,
  type ResultadoCrearProyecto,
} from './proyectos/crear';
import { GestorEnv } from './proyectos/env/gestor';
import { esUsuarioDeProyecto, usuarioDeProyecto } from './bd/usuarioProyecto';
import { errorUsuarioEnUso } from './bd/clienteMysql';
import type { SecretosReceta } from './proyectos/pasos';
import { VERSION_WORDPRESS, type PedidoProyecto } from './proyectos/generadores';
import { RegistroPasos } from './proyectos/pasos';
import { registrarPasosReales, type DepsPasos } from './proyectos/pasos/index';
import { leerHuellaWordpress } from './proyectos/pasos/descargarPlantilla';
import { generadorPorTipo, Plantillas } from './proyectos/plantillas';
import { AuditoriaClaves } from './bd/auditoriaClaves';
import { baseDeDatosReales, baseDeSitio } from './bd/auditoriaClaves/datosReales';
import { Instantaneas } from './bd/instantaneas';
import { CerrojoBases } from './bd/cerrojoBases';
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
import { guardarImagen, leerImagen, type ImagenLeida } from './herramientas/imagenes';
import { optimizarPdf, type ResultadoPdf } from './herramientas/pdf';
import type { EjecutorTrabajo } from './conversor/protocolo';
import { comprimirZip, type ResultadoZip } from './herramientas/zip';
import {
  conversionesDisponibles,
  convertir,
  type Conversion,
  type Formato,
  type ImprimirPdf,
} from './conversor/conversor';
import { Busquedas, type OpcionesBusqueda } from './herramientas/buscar';
import { emitirCertificadoLibre } from './herramientas/certificadosLibres';
import { entornoSistema, PLAZO_VERSION_MS, type EntornoSistema } from './herramientas/entorno';
import { muestraSistemaWindows } from './plataforma/win';
import { lanzadorPorDefecto } from './plataforma/lanzar';
import type { Lanzador, MuestraPlataforma } from './plataforma/tipos';
import { PUERTO_ADMINER, PUERTO_PHPMYADMIN } from './nginx/principal';

export interface OpcionesNucleo {
  base?: string;
  /**
   * Carpeta de datos de prueba (`WOLFCORE_DATOS`): no se escribe el `hosts`, el almacén de
   * certificados, el PATH ni las variables del usuario (ver `aislarPlataforma`).
   */
  aislado?: boolean;
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
  /** Para pruebas: quien lanza el editor (por defecto, un proceso separado real). */
  lanzarEditor?: LanzadorSeparado;
  /**
   * Imprime un HTML saneado a PDF (md y html → pdf del conversor, D34). Lo aporta la aplicación
   * con el Chromium de Electron, sin red ni JavaScript; sin esto esas conversiones no se ofrecen.
   */
  imprimirPdf?: ImprimirPdf;
  /**
   * Proceso de trabajo del conversor y de la optimización de PDF (`utilityProcess` en la
   * aplicación, con plazo y vigilancia de su memoria). Sin él no se ofrece ninguna conversión.
   */
  ejecutorConversor?: EjecutorTrabajo;
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
  /**
   * Habilita el servidor de órdenes de la CLI `wolf` (D31): 127.0.0.1, puerto aleatorio y token en
   * `run/cli.json`. Solo lo pide la aplicación, y solo escucha con el ajuste `cli.activo` (apagado
   * por defecto: se enciende al agregar `wolf` al PATH).
   * `abrirUrl` abre una dirección en el navegador del usuario (orden `open`).
   */
  servidorCli?: {
    version: string;
    abrirUrl?: (url: string) => Promise<void>;
    /**
     * Diálogo nativo de la app: publicar un sitio o cambiar el PHP de todas las terminales nunca lo
     * decide la línea de órdenes. Sin esto, esas órdenes se rechazan.
     */
    confirmar?: (s: SolicitudCli) => Promise<boolean>;
    plazoConfirmacionMs?: number;
    /**
     * De dónde sale el cliente `wolf` (D32): al agregarlo al PATH se copia a `bin/cli/` con la
     * ruta real de la app. Sin esto, agregar `wolf` al PATH falla con `cli.sin_cliente`.
     */
    cliente?: OrigenClienteCli;
    /**
     * Para compilar `wolf.exe` (lanzador mínimo que PowerShell y cmd prefieren a `wolf.cmd`: un `.cmd`
     * no puede evitar que cmd.exe interprete `&` o `|` de los argumentos). Solo Windows; sin esto se
     * instala solo `wolf.cmd`.
     */
    lanzadorExe?: { ejecutar: Ejecutor; csc: string | null };
  };
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
  lanzarEditor?: LanzadorSeparado;
  imprimirPdf?: ImprimirPdf;
  ejecutorConversor?: EjecutorTrabajo;
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
  /** Agentes de programación (Claude Code, Codex CLI, Hermes, Opencode, Gemini CLI, Qwen Code, Copilot CLI, Antigravity). */
  agentes: Agentes;
  /** Proveedores de IA en la nube (config, pruebas y bloque .env por proyecto). */
  ia: GestorIa;
  smtp: GestorSmtp;
  avisos: CentroAvisos;
  bd: BasesDeDatos;
  respaldos: Respaldos;
  pgvector: InstaladorPgvector;
  https: GestorHttps;
  composer: Composer;
  terminal: Terminal;
  pathUsuario: PathUsuario;
  adminer: Adminer;
  phpmyadmin: PhpMyAdmin;
  accesoBd: AccesoBd;
  ftp: ServidorFtp;
  lan: GestorLan;
  caMovil: ServidorCa;
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
  /** Plantillas de proyecto: receta, ajustes y esquema sin datos (D14). */
  plantillas: Plantillas;
  /** Instantáneas de base con un clic (D19). */
  instantaneas: Instantaneas;
  /** Auditoría de contraseñas de las bases propias (D20). */
  auditoriaClaves: AuditoriaClaves;
  /** Una operación a la vez por base: instantáneas, restaurar, importar y borrar. */
  cerrojoBases: CerrojoBases;
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

/** Bases locales que usa cada sitio según el `.env` de su carpeta (sin claves). */
async function usosDeSitios(sitios: Pick<GestorSitios, 'listar'>): Promise<UsoSitio[]> {
  const res: UsoSitio[] = [];
  for (const s of await sitios.listar()) {
    const usos = await usosDeCarpeta(s.carpeta).catch(() => []);
    if (usos.length > 0) res.push({ sitioId: s.id, usos });
  }
  return res;
}

/** El lanzador `wolf.exe` no pasó su prueba (ASR, AppLocker o antivirus): se usa `wolf.cmd`. */
const AVISO_LANZADOR_BLOQUEADO =
  'El lanzador wolf.exe fue bloqueado (ASR, AppLocker o el antivirus): wolf usa wolf.cmd, que no admite & ni | sin comillas en los argumentos.';

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
  /**
   * Arrancó con `WOLFCORE_DATOS` (carpeta de datos de prueba): no se escribe nada del equipo
   * (hosts, almacén de certificados, PATH). La interfaz lo avisa en Ajustes.
   */
  aislado = false;
  /** Una sola importación de perfil a la vez (`perfiles.en_curso`). */
  private importandoPerfil = false;
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
  readonly phpmyadmin: PhpMyAdmin;
  readonly accesoBd: AccesoBd;
  readonly ftp: ServidorFtp;
  /** Compartir sitios en la red local y entregar la CA al móvil (D25). */
  readonly lan: GestorLan;
  readonly caMovil: ServidorCa;
  readonly ollama: ClienteOllama;
  readonly mailpit: Mailpit;
  /** Procesos supervisados de los proyectos (npm run dev, uvicorn…). */
  readonly procesos: ProcesosProyecto;
  /** Workspaces de arranque (D28): conjuntos de instancias, servicios y procesos con nombre. */
  readonly workspaces: Workspaces;
  /** Planificador de las tareas programadas por sitio (D29): solo corre con la app abierta. */
  readonly programador: Programador;
  /** Altas, cambios y confirmaciones de las tareas programadas de los sitios. */
  readonly tareas: GestorTareas;
  /** Limpieza de versiones sin uso: solo `bin/<servicio>/<versión>`, nunca `data/` (D30). */
  readonly limpiezaVersiones: Limpieza;
  private readonly almacenCredenciales: AlmacenCredenciales;
  private readonly plataforma: PlataformaCompleta;
  private readonly lanzarEditor: LanzadorSeparado | undefined;
  private readonly imprimirPdf: ImprimirPdf | undefined;
  private readonly ejecutorConversor: EjecutorTrabajo | undefined;
  /** Puerto de Ollama según la configuración (ClienteOllama lo lee de forma síncrona). */
  private readonly puertoOllama: { valor: number };
  /** Servidor MCP local; se maneja con iniciarMcp/detenerMcp (que guardan `mcp.activo`). */
  readonly mcp: ServidorMcp;
  /** Receptor de dumps (127.0.0.1); se maneja con activarDepuracion (que guarda `depuracion.activa`). */
  readonly depuracion: ReceptorDumps;
  /** Servidor de órdenes de la CLI `wolf` (D31); solo escucha si `OpcionesNucleo.servidorCli`. */
  readonly cli: ServidorCli;
  /** El PATH del usuario con la carpeta del cliente (`bin/cli`), aparte de la de PHP (`tools/bin`). */
  readonly pathCli: PathUsuario;
  private opcionesCli: NonNullable<OpcionesNucleo['servidorCli']> = { version: '0.0.0' };
  private readonly confirmadorCli = new ConfirmadorCli({
    preguntar: (s) => this.opcionesCli.confirmar?.(s) ?? Promise.resolve(false),
    plazoMs: () => this.opcionesCli.plazoConfirmacionMs,
  });
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
  /** Proveedores SMTP remotos: config, prueba de envío y bloque `.env` (D22). */
  readonly smtp: GestorSmtp;
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
  /** Plantillas de proyecto: guardar, listar, borrar y crear proyectos desde ellas. */
  readonly plantillas: Plantillas;
  /** Instantáneas de base: tomar, volver con respaldo previo, borrar a la papelera (D19). */
  readonly instantaneas: Instantaneas;
  /** Auditoría de contraseñas: revisar hashes y restablecer una contraseña con copia (D20). */
  readonly auditoriaClaves: AuditoriaClaves;
  private readonly cerrojoBases: CerrojoBases;
  /** Gestor de `.env` de los proyectos: secretos enmascarados, diff, copia y escritura atómica. */
  readonly env: GestorEnv;
  /**
   * Clave del usuario propio de la base de un proyecto, para las recetas que no pasan por la
   * ventana (MCP, reintentos). La fija el proceso principal (`AlmacenSecretos`); el núcleo nunca la
   * guarda, la registra ni la emite.
   */
  private proveedorClaveBd: (sitioId: string) => Promise<string | null> = async () => null;
  /** Cachés propias que el optimizador de RAM sabe vaciar (las que registra la app). */
  private readonly cachesApp = new Map<string, CacheApp>();
  private readonly optimizadorMemoria: OptimizadorMemoria;
  private readonly limpiezaDisco: LimpiezaDisco;
  private readonly editorCodigo: EditorCodigo;

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
    this.lanzarEditor = m.lanzarEditor;
    this.imprimirPdf = m.imprimirPdf;
    this.ejecutorConversor = m.ejecutorConversor;
    this.bd = m.bd;
    this.respaldos = m.respaldos;
    this.pgvector = m.pgvector;
    this.https = m.https;
    this.composer = m.composer;
    this.terminal = m.terminal;
    this.pathUsuario = m.pathUsuario;
    this.adminer = m.adminer;
    this.phpmyadmin = m.phpmyadmin;
    this.accesoBd = m.accesoBd;
    this.ftp = m.ftp;
    this.lan = m.lan;
    this.caMovil = m.caMovil;
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
    this.optimizadorMemoria = new OptimizadorMemoria({
      plataforma: this.plataforma,
      rutasPropias: () => [this.rutas.base, path.dirname(process.execPath)],
      pidApp: process.pid,
      pidsSupervisados: () => this.pidsSupervisados(),
      caches: () => [...this.cachesApp.values()],
      pools: () => this.poolsReducibles(),
      reducirPool: (version) =>
        this.instalador.cerrojos.con('php', () => this.servicios.php.reducirAUno(version)),
      servicios: () => this.serviciosPropiosEncendidos(),
      detenerServicio: (id) => {
        const p = separarIdSupervisor(id);
        return p
          ? this.procesos.detener(p.sitioId, p.procesoId)
          : this.servicios.detener(id as IdServicio);
      },
    });
    this.limpiezaDisco = new LimpiezaDisco({
      plataforma: this.plataforma,
      carpetaDatos: () => this.rutas.base,
      rutasVetadas: () => this.rutasVetadasLimpieza(),
      carpetaRegistro: () => this.rutas.logs('limpieza'),
    });
    this.editorCodigo = new EditorCodigo({
      carpetaCopias: () => this.rutas.editorCopias(),
      carpetasPropias: () => [...new Set([this.rutas.base, this.plataforma.carpetaDatos()])],
      sitios: () => this.sitios.listar(),
    });
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
    this.smtp = m.smtp;
    this.agentes = m.agentes;
    this.iniPhp = m.iniPhp;
    this.editorVhost = m.editorVhost;
    this.extensionesPhp = m.extensionesPhp;
    this.poolsSitio = m.poolsSitio;
    this.ajustesPhpSitio = m.ajustesPhpSitio;
    this.depsPasos = m.depsPasos;
    this.plantillas = m.plantillas;
    this.instantaneas = m.instantaneas;
    this.auditoriaClaves = m.auditoriaClaves;
    this.cerrojoBases = m.cerrojoBases;
    this.env = new GestorEnv({
      sitio: async (id) => (await this.sitios.listar()).find((x) => x.id === id),
      carpetaRespaldos: () => this.rutas.respaldosEnv(),
      versionado: (carpeta) => this.git.versionado(carpeta),
      puertos: async () => {
        const datos = (await this.config.leer()).servicios.datos;
        const cfg = await this.config.leer();
        return { correo: puertoSmtpElegido(cfg), redis: datos.redis.puerto };
      },
    });
    this.workspaces = new Workspaces({
      leerConfig: () => this.config.leer(),
      modificarConfig: (fn) => this.sitios.modificarConfig(fn),
      avisar: (a) => this.avisos.publicar(a),
      puerto: crearPuertoWorkspaces({
        servicios: this.servicios,
        supervisor: this.supervisor,
        procesos: this.procesos,
        leerSitios: () => this.sitios.listar(),
        leerConfig: () => this.config.leer(),
        nginxInstalado: async () => (await this.instalador.instalados('nginx')).length > 0,
      }),
    });
    this.programador = new Programador({
      rutas: this.rutas,
      leerSitios: () => this.sitios.listar(),
      huellaReceta: (carpeta) => this.huellaCarpeta(carpeta),
      existeCarpeta: async (carpeta) => existsSync(carpeta),
      ejecutar: (sitio, comando, o) => this.procesos.ejecutarUnaVez(sitio, comando, o),
      avisar: (a) => this.avisos.publicar(a),
      emitir: (e) => this.eventos.emit('tarea:terminada', e),
      aislado: () => this.aislado,
    });
    this.tareas = new GestorTareas({
      leerSitios: () => this.sitios.listar(),
      modificarConfig: (fn) => this.sitios.modificarConfig(fn),
      programador: this.programador,
    });
    this.limpiezaVersiones = new Limpieza({
      rutas: this.rutas,
      instaladas: (s) => this.instalador.instalados(s),
      usos: () => this.usosDeVersiones(),
      instantanea: () => this.instantaneaEntorno('limpiar-versiones'),
      cerrojos: this.instalador.cerrojos,
      enCatalogo: async (servicio, carpeta) => {
        // En PHP la carpeta es la rama: el catálogo la conoce por el parche instalado.
        const version = await this.instalador.versionInstalada(servicio, carpeta);
        return (await this.catalogoVivo.buscar(servicio, version)) !== null;
      },
    });
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
    this.pathCli = new PathUsuario({
      rutas: this.rutas,
      entrada: this.rutas.cliCliente(),
      acceso: this.plataforma.pathUsuario({ respaldo: respaldoPathUsuario(this.rutas) }),
    });
    this.cli = new ServidorCli({
      rutas: this.rutas,
      operaciones: this.operacionesCli(),
      restringir: (ruta, o) => this.plataforma.restringirAlUsuario(ruta, o),
      // Con otra carpeta de datos (WOLFCORE_DATOS) el dueño de run/ tiene que ser el usuario.
      duenoEsUsuario: (ruta) =>
        this.aislado ? this.plataforma.duenoEsUsuario(ruta) : Promise.resolve(true),
      version: async () => ({
        app: this.opcionesCli.version,
        idioma: (await this.config.leer()).ui.idioma,
      }),
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
    // Carpeta de datos de prueba (WOLFCORE_DATOS): nada que sea del equipo y no de esa carpeta se
    // escribe (hosts, almacén de certificados, PATH y variables del usuario, servicios).
    const aislar = <T extends object>(x: T): T =>
      o.aislado
        ? aislarPlataforma(x, (que) =>
            console.warn(`Carpeta de datos de prueba: no se hace ${que} (WOLFCORE_DATOS).`),
          )
        : x;
    const plataforma = aislar(o.plataforma ?? crearPlataforma());
    // Lo que una plataforma parcial (pruebas) no tenga lo pone la de Windows con el mismo ejecutor:
    // es lo que hacía el núcleo antes de pasar todo por la plataforma.
    const plat = aislar(
      completarPlataforma(plataforma, new PlataformaWindows(o.ejecutor ?? ejecutorPorDefecto)),
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
    const cerrojosServicio = new CerrojosServicio();
    const instalador = new Instalador(rutas, eventos, o.fetch ?? fetch, {
      cerrojos: cerrojosServicio,
      exec: o.ejecutor ?? ejecutorPorDefecto,
      plataforma: plat,
      alAvisar: (codigo) =>
        avisos.publicar({
          nivel: 'aviso',
          tipo: 'doctor',
          codigo,
          datos: { fuente: 'rustup' },
        }),
    });
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
    const phpEncendido = async (rama: string): Promise<boolean> => {
      const n = (await leerConfig()).servicios.php.trabajadores;
      return Array.from({ length: n }, (_, i) => i).some(
        (i) => supervisor.estado(`php-${rama}-${i}`) === 'encendido',
      );
    };
    // Servidores de datos de WolfCore Dev (una entrada por instancia; sin instancias configuradas,
    // el puerto del propio servicio). Adminer y phpMyAdmin solo se conectan a estos.
    const servidoresDe = async (
      ids: readonly string[],
    ): Promise<{ puerto: number; nombre: string }[]> =>
      (await servicios.estados())
        .filter((e) => ids.includes(e.id))
        .flatMap((e) =>
          e.instancias && e.instancias.length > 0
            ? e.instancias.map((i) => ({ puerto: i.puerto, nombre: `${e.nombre} ${i.version}` }))
            : e.puertos.map((p) => ({ puerto: p, nombre: e.nombre })),
        );
    const restringir = (ruta: string): Promise<boolean> => plat.restringirAlUsuario(ruta);
    registrarCaptadores({ restringir }); // la ruta secreta de la web de los captadores
    const adminer = new Adminer({
      rutas,
      instalador,
      leerConfig,
      phpEncendido,
      puertosPermitidos: async () =>
        (await servidoresDe(['mysql', 'mariadb', 'postgresql'])).map((x) => x.puerto),
    });
    const accesoBd = new AccesoBd({
      rutas,
      puertoHerramienta: (h) => (h === 'adminer' ? PUERTO_ADMINER : PUERTO_PHPMYADMIN),
      restringir,
    });
    const phpmyadmin = new PhpMyAdmin({
      rutas,
      instalador,
      leerConfig,
      phpEncendido,
      // phpMyAdmin solo entra a los servidores MySQL y MariaDB de WolfCore Dev.
      servidores: () => servidoresDe(['mysql', 'mariadb']),
      restringir,
    });
    const ftp = new ServidorFtp({
      leerConfig,
      modificarConfig: (fn) => sitios.modificarConfig(fn),
      credenciales,
    });
    // eslint-disable-next-line prefer-const
    let respaldosRef!: Respaldos;
    let catalogoRef!: CatalogoVivo;
    // La red local se crea después de Servicios (usa su Nginx): Nginx la llama por esta referencia.
    // eslint-disable-next-line prefer-const
    let lanRef!: GestorLan;
    const servicios: Servicios = new Servicios({
      cerrojos: cerrojosServicio,
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
      phpmyadminPrincipal: () => phpmyadmin.configNginx(),
      podarRed: async () => (await lanRef.podarRed()).length > 0,
      procesosProyecto: {
        estadosServicio: () => procesos.estadosServicio(),
        detenerTodos: () => procesos.detenerTodos(),
        autoIniciar: (seguir, bloqueo) => procesos.autoIniciar(seguir, bloqueo),
      },
      usosDeSitios: () => usosDeSitios(sitios),
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
    instalador.fijarAntesDeInstalar((s) => servicios.datos.prepararInstalacion(s));
    const urlBase = new UrlBase({
      rutas,
      ejecutor: o.ejecutor ?? ejecutorPorDefecto,
    });
    // Vhosts propios de una función (túneles, red local): incluidos aparte de los de los sitios.
    const vhostsAux = new VhostsAuxiliares({ rutas, recargar: () => servicios.nginx.recargar() });
    const quitarCertLan = async (id: string): Promise<void> => {
      await rm(rutas.certCrt(id), { force: true });
      await rm(rutas.certKey(id), { force: true });
    };
    // Compartir en la red local: un `server` por sitio, solo en la IP elegida y su propio puerto.
    const lan = new GestorLan({
      sitios,
      vhosts: vhostsAux,
      certificado: (s) => https.asegurarCertificado(s),
      puertoNginx: async () => (await leerConfig()).servicios.nginx.puerto,
      quitarCertificado: quitarCertLan,
      perfilRedDe: (ip) => plat.perfilRedDe(ip),
      avisarRedCambio: (dominios) =>
        avisos.publicar({
          nivel: 'aviso',
          tipo: 'doctor',
          codigo: 'avisos.lan_red_cambio',
          datos: { fuente: dominios.join(', ').slice(0, 120) },
        }),
      reservados: async () => {
        const res = puertosReservados(await leerConfig());
        for (const r of await plat.rangosReservados('tcp').catch(() => [])) {
          const desde = Math.max(r.desde, PRIMER_PUERTO_LAN);
          const hasta = Math.min(r.hasta, ULTIMO_PUERTO_LAN);
          for (let p = desde; p <= hasta; p++) res.push(p);
        }
        return res;
      },
    });
    lanRef = lan;
    // Servidor temporal de `ca.crt` para el móvil (solo ese archivo, nunca la clave).
    const caMovil = new ServidorCa({
      rutaCa: () => rutas.caCrt(),
      asegurarCa: () => https.crearCaSiFalta(),
      elegirPuerto: (ip) => lan.puertoParaCa(ip),
    });
    const tuneles = new Tuneles({
      supervisor,
      sitios,
      almacen,
      instalador,
      rutas,
      urlBase,
      eventos,
      plataforma: plat,
      ejecutor: o.ejecutor ?? ejecutorPorDefecto,
      lanzar: o.lanzar ?? lanzadorPorDefecto,
      // Server de Nginx propio de un túnel (Tailscale): valida y recarga con el resto de la config.
      vhostsAux,
      guardarTunel: async (sitioId, tunel) => {
        await sitios.editar(sitioId, { tunel: tunel ?? undefined });
      },
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
    // `expose.phar` se ejecuta con el PHP de la app (null si no hay PHP instalado).
    tuneles.fijarPhp(async () => {
      try {
        return (await phpDe(null)).exe;
      } catch {
        return null;
      }
    });
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
      eventos,
      runtimes,
      leerSitios: () => sitios.listar(),
      php: phpDe,
      lanzar: o.lanzar ?? lanzadorPorDefecto,
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
    const cerrojoBases = new CerrojoBases();
    const instantaneas = new Instantaneas({
      rutas,
      cerrojo: cerrojoBases,
      respaldos: respaldosRef,
      estadoBase: (objetivo, base) => bd.estadoBase(objetivo, base),
      restringir: (ruta) => plat.restringirAlUsuario(ruta),
    });
    const auditoriaClaves = new AuditoriaClaves({
      rutas,
      abrir: (objetivo, base, modo, plazoMs) => bd.abrirConsulta(objetivo, base, modo, plazoMs),
      instantaneas,
      cerrojo: cerrojoBases,
      esDatosReales: (instancia, base) =>
        baseDeDatosReales({ sitios: () => sitios.listar(), baseDe: baseDeSitio }, instancia, base),
      restringir: (ruta) => plat.restringirAlUsuario(ruta),
    });
    const lanzar = o.lanzar ?? lanzadorPorDefecto;
    // Los pasos de receta llaman a Nucleo.guardarSitio: se resuelve tras construir el núcleo.
    // eslint-disable-next-line prefer-const
    let nucleoRef!: Nucleo;
    // Reemplazar PHP o Nginx: antes, la instantánea del entorno (D27). Sin copia no se reemplaza.
    instalador.fijarAntesDeActualizar(async () => {
      await nucleoRef?.instantaneaAntesDeActualizar();
    });
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
    const gestorSmtp = new GestorSmtp({
      leerConfig,
      modificarConfig: (fn) => sitios.modificarConfig(fn),
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
    const plantillas = new Plantillas({
      rutas,
      sitio: async (id) => {
        const s = (await sitios.listar()).find((x) => x.id === id);
        if (!s) throw new ErrorWolf('proyectos.no_existe', 'El proyecto no existe.');
        return s;
      },
      receta: async (s) => recetaEfectiva(s.carpeta, await detectarProyectoB(s.carpeta)),
      respaldar: (objetivo, base, carpeta, opciones) =>
        respaldosRef.respaldar(objetivo, base, carpeta, opciones),
      resolverObjetivo: async (motor, puerto) => {
        // Toda la familia (MySQL y MariaDB hablan igual): el .env puede decir mysql y ser MariaDB.
        const familia: string[] = motor === 'postgresql' ? ['postgresql'] : ['mysql', 'mariadb'];
        const estados = (await servicios.estados()).filter((e) => familia.includes(e.id));
        if (puerto === null) {
          const e = estados.find((x) => x.id === motor);
          return e ? { servidor: motor, motor } : null;
        }
        for (const e of estados) {
          const instancia = e.instancias?.find((i) => i.puerto === puerto);
          if (instancia) return { servidor: instancia.id, motor: e.id as MotorBd };
          if (e.puertos.includes(puerto))
            return { servidor: e.id as MotorBd, motor: e.id as MotorBd };
        }
        return null;
      },
      generadorDe: async (s) => {
        // Symfony, como sitio, es "laravel": se distingue por sus dependencias.
        if (s.tipo === 'laravel') {
          try {
            const composer = JSON.parse(
              await readFile(path.join(s.carpeta, 'composer.json'), 'utf8'),
            ) as { require?: Record<string, string> };
            const req = Object.keys(composer.require ?? {});
            if (
              !req.includes('laravel/framework') &&
              req.some((x) => x.startsWith('symfony/framework-bundle'))
            ) {
              return 'symfony';
            }
          } catch {
            // Sin composer.json legible: se queda con el tipo.
          }
        }
        return generadorPorTipo(s.tipo);
      },
      leerEsquema: (servidor, archivo) => respaldosRef.esquemaComoTexto(servidor, archivo),
      usaMongodb: async (s) => (await detectarProyectoB(s.carpeta)).servicios.includes('mongodb'),
      extensionesActivas: async (rama) =>
        (await extensionesPhp.listar(rama)).filter((e) => e.activa).map((e) => e.nombre),
    });
    const modulos: ModulosNucleo = {
      plantillas,
      instantaneas,
      auditoriaClaves,
      cerrojoBases,
      editorVhost,
      ...(o.lanzarEditor ? { lanzarEditor: o.lanzarEditor } : {}),
      ...(o.imprimirPdf ? { imprimirPdf: o.imprimirPdf } : {}),
      ...(o.ejecutorConversor ? { ejecutorConversor: o.ejecutorConversor } : {}),
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
      smtp: gestorSmtp,
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
      phpmyadmin,
      accesoBd,
      ftp,
      lan,
      caMovil,
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
      mailpit: new Mailpit(undefined, o.fetch, () =>
        leerRutaSecreta(rutas.datos('mailpit', 'actual', () => 'actual')),
      ),
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
        rustInstalado: async () => (await runtimes.instalados('rust')).length > 0,
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
      restaurarEsquema: (objetivo, archivo, base, opts) =>
        modulos.respaldos.restaurarEsquema(objetivo, archivo, base, opts),
      entregarBase: (objetivo, base, usuario) => bd.entregarBase(objetivo, base, usuario),
      usuarioBdEnUso: (usuario, sitioId) => nucleoRef.usuarioBdEnUso(usuario, sitioId),
      plantillas,
      correo: async () => {
        const cfg = await leerConfig();
        const id = captadorElegido(cfg);
        if ((await instalador.instalados(id)).length === 0) return null;
        return { nombre: CAPTADORES[id].nombre, puerto: puertoSmtpElegido(cfg) };
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
    nucleo.aislado = o.aislado === true;
    nucleo.bajaFuentesAvisos = conectarFuentesAvisos(eventos, avisos);
    // Solo consulta motores que ya mostraron contenedores en marcha (nada si nunca se abrió la pantalla).
    nucleo.contenedores.iniciarVigilancia();
    o.alIniciar?.(eventos);
    try {
      await supervisor.readoptar();
      void nucleo.limpiarUsuariosTemporales();
      void nucleo.instantaneas.purgarPapelera().catch(() => 0);
      void nucleo.instantaneas.limpiarHuerfanos().catch(() => 0);
      await tuneles.restaurar();
      // Nada de la red local sobrevive a una sesión: lo que dejó una caída se quita.
      await lan.restaurar().catch((e: unknown) => {
        console.error('No se pudo limpiar la red local:', mensajeDe(e));
      });
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
    if (o.servidorCli) {
      nucleo.opcionesCli = o.servidorCli;
      if ((await leerConfig()).cli.activo) {
        // Sin poder proteger el token, la CLI no se activa: queda como aviso.
        await nucleo.cli.iniciar().catch((e: unknown) => {
          nucleo.avisosPendientes.push(`No se pudo iniciar el servidor de la CLI: ${mensajeDe(e)}`);
        });
      }
    }
    if (o.servidorCli) {
      await writeFile(rutas.cliApp(), String(process.pid), 'utf8').catch(() => undefined);
    }
    // Una actualización puede cambiar la ruta de la app: el cliente se reescribe si ya estaba instalado.
    if (o.servidorCli?.cliente && !nucleo.aislado && (await clienteCliInstalado(rutas))) {
      await instalarClienteCli(rutas, o.servidorCli.cliente, o.servidorCli.lanzadorExe)
        .then((r) => {
          if (r.bloqueado) nucleo.avisosPendientes.push(AVISO_LANZADOR_BLOQUEADO);
        })
        .catch((e: unknown) => {
          nucleo.avisosPendientes.push(`No se pudo actualizar el cliente wolf: ${mensajeDe(e)}`);
        });
    }
    // Apagada (o sin servidor): ningún `cli.json` de una sesión anterior se queda con un token vivo.
    if (!nucleo.cli.estado().activo)
      await rm(rutas.cliJson(), { force: true }).catch(() => undefined);
    if ((await leerConfig()).mcp.activo) {
      // Un puerto ocupado no impide el arranque: queda como aviso.
      await nucleo.mcp.iniciar().catch((e: unknown) => {
        nucleo.avisosPendientes.push(`No se pudo iniciar el servidor MCP: ${mensajeDe(e)}`);
      });
    }
    // Tareas programadas (D29): corren solo con la app abierta; en carpeta de datos de prueba
    // (WOLFCORE_DATOS) no corre nada hasta que el usuario lo permita.
    nucleo.programador.iniciar();
    void nucleo.programador.purgarHuerfanos().catch(() => undefined);
    // Limpieza de versiones (D30): la papelera de más de 7 días y los restos de un borrado a medias.
    void nucleo.limpiezaVersiones.purgarPapelera().catch(() => 0);
    void nucleo.limpiezaVersiones.limpiarResiduos().catch(() => 0);
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
    // Después de los servicios (los procesos suelen usar la base de datos), y solo si su base
    // responde: sin ella se caerían al instante (y se relanzarían una y otra vez).
    if (!this.cerrado) {
      const usos = await usosDeSitios(this.sitios).catch((): UsoSitio[] => []);
      errores.push(
        ...(await this.procesos.autoIniciar(
          () => !this.cerrado,
          (id) => this.servicios.baseSinResponder(usos, id),
        )),
      );
    }
    return errores;
  }

  /** Espera al arranque automático (nunca lanza: sus fallos ya quedaron en avisos). */
  private async esperarArranque(): Promise<void> {
    await this.arranqueAutomatico.catch(() => undefined);
  }

  /**
   * "Iniciar todo" de la interfaz, la bandeja y `--iniciar-todo`: el mismo flujo para los tres
   * (`Servicios.iniciarTodo`: PHP y Nginx, bases con su salud, procesos de proyecto). Nunca abre
   * túneles: un túnel solo se abre con la acción del usuario en su sitio. Si algo falla, además
   * del error publica un aviso (desde la bandeja no hay otra forma de verlo).
   */
  async iniciarTodo(): Promise<void> {
    // Recién arrancada la app (p. ej. con --iniciar-todo), primero termina el arranque automático:
    // así no se arrancan los mismos servicios y procesos dos veces a la vez.
    await this.esperarArranque();
    try {
      await this.servicios.iniciarTodo();
    } catch (e) {
      const nombres =
        e instanceof ErrorWolf && typeof e.datos?.['nombres'] === 'string'
          ? e.datos['nombres']
          : '';
      this.avisos.publicar({
        nivel: 'error',
        tipo: 'servicio-caido',
        codigo: 'avisos.iniciar_todo_fallos',
        datos: { fuente: 'iniciar-todo', nombres },
        accion: { ruta: 'servicios' },
      });
      throw e;
    }
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
  /** Quita una CA anterior (por su huella SHA-1) del almacén de confianza; nunca la actual. */
  quitarCaAnterior(huella: string): Promise<ResultadoCA> {
    return this.https.quitarPorHuella(huella);
  }

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
    return this.cerrojoBases.con(motor, nombre, () => this.bd.borrar(motor, nombre, confirmacion));
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
    return this.cerrojoBases.con(motor, base, () =>
      this.respaldos.restaurar(motor, archivo, base, opts),
    );
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
    return this.cerrojoBases.con(motor, destinoBase, () =>
      this.respaldos.importar(motor, origen, destinoBase, opts),
    );
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
      servicio as TipoRuntime | 'composer' | 'cloudflared'
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
      // Cambiar la versión de Nginx es actualizarlo: antes, la instantánea del entorno.
      if (antes !== version) await this.instantaneaAntesDeActualizar();
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
    if (esServicioUnico(servicio)) {
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
    if (esTipoRuntime(servicio) || servicio === 'composer' || servicio === 'cloudflared') {
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
    else if (servicio === 'nginx' || esServicioUnico(servicio)) {
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

  /**
   * Quién usa cada versión instalada ahora mismo (D30). Sitios, instancias, predeterminadas,
   * runtimes de proyecto, plantillas, workspaces, tareas y procesos propios en ejecución (por la
   * ruta real de su ejecutable). Lo que no se pueda comprobar cuenta como en uso.
   */
  private usosDeVersiones(): Promise<UsosVersiones> {
    return calcularUsos({
      rutas: this.rutas,
      config: () => this.config.leer(),
      sitios: () => this.sitios.listar(),
      plantillas: () => this.plantillas.lista(),
      estados: () => this.servicios.estados(),
      instaladas: (s) => this.instalador.instalados(s),
      runtimesDe: (sitio) => this.runtimes.paraProyecto(sitio),
      phpPorDefecto: () => this.composer.phpPorDefecto(),
      // Si no se puede leer cuál es la activa, el servicio queda en duda (lo decide `calcularUsos`).
      nginxActiva: () => this.servicios.nginx.versionActiva(),
      carpetaDatos: (servicio, version) => {
        try {
          const def = this.servicios.datos.def(servicio);
          return def ? this.servicios.datos.carpetaDatos(def, version) : null;
        } catch {
          return null;
        }
      },
      ramasHerramientas: async () =>
        [await this.phpmyadmin.ramaDeUso(), await this.adminer.ramaDeUso()].filter(
          (r): r is string => r !== null,
        ),
      versionPreferida: (s, instaladas) => this.versionPreferida(s, instaladas),
      versionEnUso: (s, v) => this.servicios.datos.versionEnUso(s, v),
      pidsPropios: () =>
        this.supervisor
          .ids()
          .map((id) => this.supervisor.pid(id))
          .filter((p): p is number => p !== null),
      ...(this.plataforma.descendientes
        ? { descendientes: (pids: number[]) => this.plataforma.descendientes(pids) }
        : {}),
      rutaProceso: async (pid) => {
        const directa = await this.plataforma.rutaProceso?.(pid).catch(() => null);
        if (directa) return directa;
        return (await this.plataforma.procesoVivo(pid).catch(() => null))?.ejecutable ?? null;
      },
      procesoVivo: async (pid) =>
        (await this.plataforma.procesoVivo(pid).catch(() => ({ vivo: true }))).vivo,
    });
  }

  /**
   * Versiones instaladas con su tamaño y por qué no se pueden quitar (vista previa de la limpieza).
   * Las que tienen motivo se listan pero no se pueden marcar. No borra nada.
   */
  versionesSinUso(): Promise<VersionSinUso[]> {
    return this.limpiezaVersiones.versionesSinUso();
  }

  /**
   * Quita las versiones elegidas de `bin/` (nunca `data/`), a la papelera (se purga a los 7 días)
   * o de forma definitiva (con la instantánea del entorno antes) y vuelve a comprobar el uso de
   * cada una, dentro del cerrojo de su servicio, justo antes de moverla.
   */
  limpiarVersiones(
    seleccion: SeleccionLimpieza[],
    confirmado: true,
    destino: DestinoLimpieza = 'papelera',
  ): Promise<ResultadoLimpieza> {
    return this.limpiezaVersiones.limpiar(seleccion, confirmado, { destino });
  }

  /** Las versiones que están en la papelera de limpieza (se purgan a los 7 días). */
  versionesEnPapelera(): Promise<VersionEnPapelera[]> {
    return this.limpiezaVersiones.listarPapelera();
  }

  /** Devuelve una versión de la papelera a `bin/` (falla si esa carpeta ya existe). */
  recuperarVersion(id: string): Promise<void> {
    return this.limpiezaVersiones.recuperar(id);
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
    o: { confirmacion: string; respaldo?: string; version?: string },
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

  // ---- Correo ----

  /** A dónde envía correo un proyecto: el captador local o un proveedor SMTP remoto (D22). */
  async usarCorreoEnSitio(
    sitioId: string,
    modo: { modo: 'captador' } | { modo: 'smtp'; proveedor: string },
  ): Promise<void> {
    await this.sitioPorId(sitioId);
    await this.smtp.usarEnSitio(sitioId, modo);
    this.eventos.emit('sitio:cambio', await this.sitios.listar());
  }

  /** Borra el proveedor SMTP y avisa a la interfaz: los proyectos que lo usaban vuelven al captador. */
  async borrarProveedorSmtp(id: string): Promise<void> {
    await this.smtp.borrar(id);
    this.eventos.emit('sitio:cambio', await this.sitios.listar());
  }

  /**
   * Lo que cambiaría en el `.env` del proyecto con el bloque `MAIL_*` del proveedor. La clave
   * (si se pide) va enmascarada en el resultado; no se escribe nada.
   */
  async vistaPreviaEnvSmtp(
    sitioId: string,
    proveedorId: string,
    clave: string | null,
  ): Promise<{ diff: string; huella: string }> {
    return this.env.vistaPrevia(sitioId, {
      cambios: await this.smtp.bloqueEnv(proveedorId, clave),
    });
  }

  /**
   * Escribe el bloque `MAIL_*` en el `.env` del proyecto (con copia, escritura atómica y las
   * comprobaciones de git y `.gitignore` de C) y lo deja enviando por ese proveedor. La clave solo
   * se escribe si `clave` no es null; el IPC solo la pasa tras la confirmación explícita del
   * usuario, que sabe que queda en texto plano.
   */
  async escribirEnvSmtp(
    sitioId: string,
    proveedorId: string,
    clave: string | null,
    opciones: { aceptarVersionado?: boolean; agregarGitignore?: boolean; huella?: string } = {},
  ): Promise<{ copia: string | null; gitignoreAgregado: boolean }> {
    const r = await this.env.guardar(
      sitioId,
      { cambios: await this.smtp.bloqueEnv(proveedorId, clave) },
      true,
      opciones,
    );
    await this.usarCorreoEnSitio(sitioId, { modo: 'smtp', proveedor: proveedorId });
    return r;
  }

  /** Mensajes sin leer: solo Mailpit expone ese dato; con otro captador, 0. */
  async noLeidosCorreo(): Promise<number> {
    const cfg = await this.config.leer();
    if (captadorElegido(cfg) !== 'mailpit') return 0;
    return this.mailpit.noLeidos();
  }

  /** Los captadores locales con su estado (D21). Solo escuchan en 127.0.0.1. */
  async captadoresCorreo(): Promise<EstadoCaptador[]> {
    const cfg = await this.config.leer();
    const elegido = captadorElegido(cfg);
    const salida: EstadoCaptador[] = [];
    for (const id of IDS_CAPTADOR) {
      const c = CAPTADORES[id];
      // Directo del supervisor: `servicios.estados()` volvería a leer la configuración y a sondear
      // todos los servicios.
      const e = this.supervisor.estado(id);
      const ruta = c.rutaSecreta
        ? await leerRutaSecreta(this.rutas.datos(id, 'actual', () => 'actual'))
        : null;
      salida.push(
        estadoCaptador(c, {
          instalado: (await this.instalador.instalados(id)).length > 0,
          estado: e,
          elegido: id === elegido,
          puertoSmtp: cfg.correo.puertoSmtp,
          ruta,
        }),
      );
    }
    return salida;
  }

  /**
   * Enciende un captador (y apaga el que corriera), lo deja como el de los proyectos y como el
   * único que arranca solo con la aplicación (los demás pierden el arranque automático, así la
   * elección sobrevive a un reinicio). Todos comparten el puerto SMTP (`Config.correo.puertoSmtp`),
   * por eso los `.env` que ya apuntan a él siguen valiendo sin tocarlos.
   */
  async elegirCaptador(id: IdCaptador): Promise<void> {
    if (!esIdCaptador(id)) {
      throw new ErrorWolf('servicios.desconocido', `Captador desconocido: ${String(id)}`, { id });
    }
    await this.servicios.iniciar(id);
    await this.sitios.modificarConfig((c) => {
      aplicarEleccionCaptador(c, id);
    });
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

  private async depsEditor(): Promise<{
    deps: Parameters<typeof abrirEnEditor>[2];
    predeterminado: IdEditor | null;
  }> {
    return {
      deps: {
        editores: () => this.plataforma.editoresInstalados(),
        ...(this.lanzarEditor ? { lanzar: this.lanzarEditor } : {}),
      },
      predeterminado: (await this.config.leer()).editor.predeterminado,
    };
  }

  /**
   * Abre la carpeta del sitio en el editor elegido o, sin él, en el predeterminado de Ajustes (la
   * ruta sale de la configuración por el id, nunca de afuera).
   */
  async abrirEditor(sitioId: string, editor?: IdEditor | null): Promise<ResultadoAbrirEditor> {
    const carpeta = (await this.sitioPorId(sitioId)).carpeta;
    const { deps, predeterminado } = await this.depsEditor();
    return abrirEnEditor(carpeta, { ...(editor ? { editor } : {}), predeterminado }, deps);
  }

  /** Editores instalados y el predeterminado guardado (null = el primero detectado). */
  async editores(): Promise<{ disponibles: EditorDisponible[]; porDefecto: IdEditor | null }> {
    return {
      disponibles: await this.plataforma.editoresInstalados(),
      porDefecto: (await this.config.leer()).editor.predeterminado,
    };
  }

  /** Fija el editor predeterminado (null = el primero detectado); debe estar instalado. */
  async cambiarEditorPredeterminado(id: IdEditor | null): Promise<void> {
    if (id !== null) {
      const e = (await this.plataforma.editoresInstalados()).find((x) => x.id === id);
      if (!e) {
        throw new ErrorWolf(
          'herramientas.editor_no_instalado',
          `El editor no está instalado: ${id}`,
          {
            nombre: id,
          },
        );
      }
    }
    await this.sitios.modificarConfig((c) => {
      c.editor.predeterminado = id;
    });
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
  async instalarAdminer(): Promise<void> {
    await this.adminer.instalar();
    await this.publicarHerramientaWeb();
  }

  /**
   * El vhost interno de Adminer o phpMyAdmin entra al conf de nginx: si nginx ya corre, se recarga
   * para que el servidor nuevo responda sin esperar a otro cambio de sitios. Un fallo aquí no
   * deshace la instalación (el vhost aparece en la próxima aplicación de la configuración).
   */
  private async publicarHerramientaWeb(): Promise<void> {
    await this.servicios.nginx.recargar().catch((e: unknown) => {
      console.error('No se pudo recargar nginx tras instalar la herramienta:', mensajeDe(e));
    });
  }

  disponibilidadAdminer(): ReturnType<Adminer['disponibilidad']> {
    return this.adminer.disponibilidad();
  }

  /** Instala phpMyAdmin (zip oficial con su SHA-256 y su firma PGP; se sirve en 127.0.0.1:8091). */
  async instalarPhpMyAdmin(): Promise<void> {
    await this.phpmyadmin.instalar();
    await this.publicarHerramientaWeb();
  }

  disponibilidadPhpMyAdmin(): ReturnType<PhpMyAdmin['disponibilidad']> {
    return this.phpmyadmin.disponibilidad();
  }

  /**
   * Abre la base del proyecto (según su `.env`) en Adminer o phpMyAdmin ya autenticada: emite un
   * token de un solo uso (60 s) y devuelve la URL que lo lleva (solo el token: nunca la clave).
   * Entra con el usuario propio `wolf_u_*` del proyecto si lo tiene y su clave está guardada; si no
   * (el proyecto usa root u otro usuario), entra con el administrador del servidor y `propio` es
   * false para que la interfaz lo explique. La clave solo pasa por la memoria del núcleo.
   */
  async abrirBaseProyecto(
    sitioId: string,
    herramienta: HerramientaBd,
  ): Promise<{
    url: string;
    usuario: string;
    propio: boolean;
    /** Por qué entró como administrador (solo con `propio` false). */
    motivo?: 'sin_usuario_propio' | 'sin_clave';
  }> {
    const sitio = await this.sitioPorId(sitioId);
    const b = await leerBaseDelProyecto(sitio.carpeta).catch(() => null);
    if (!b) {
      throw new ErrorWolf(
        'acceso_bd.sin_base',
        'El .env de este proyecto no apunta a una base de datos.',
      );
    }
    if (b.host && !/^(127\.0\.0\.1|localhost|\[?::1\]?)$/i.test(b.host)) {
      throw new ErrorWolf(
        'acceso_bd.servidor_no_resuelto',
        'La base de este proyecto no es de un servidor local de WolfCore Dev.',
      );
    }
    if (herramienta === 'phpmyadmin' && b.motor === 'postgresql') {
      throw new ErrorWolf(
        'acceso_bd.motor_no_soportado',
        'phpMyAdmin solo abre bases de MySQL y MariaDB; use Adminer para PostgreSQL.',
      );
    }
    const disp =
      herramienta === 'adminer'
        ? await this.adminer.disponibilidad()
        : await this.phpmyadmin.disponibilidad();
    if (!disp.disponible) {
      throw new ErrorWolf('acceso_bd.no_listo', disp.motivo);
    }
    const objetivo = await this.objetivoDeServidor(b.motor, b.puerto);
    if (!objetivo) {
      throw new ErrorWolf(
        'acceso_bd.servidor_no_resuelto',
        'No se pudo saber de qué servidor local es la base del proyecto.',
      );
    }
    const admin = await this.bd.conexion(objetivo);
    const claveBd = esUsuarioDeProyecto(b.usuario)
      ? await this.proveedorClaveBd(sitioId).catch(() => null)
      : null;
    const propio = claveBd !== null && claveBd !== '';
    const usuario = propio ? b.usuario : admin.usuario;
    if (herramienta === 'adminer') await this.adminer.preparar();
    else await this.phpmyadmin.preparar();
    const { url } = await this.accesoBd.emitir({
      herramienta,
      sitioId,
      instancia: objetivo,
      base: b.base,
      credenciales: {
        motor: b.motor,
        host: '127.0.0.1',
        puerto: admin.puerto,
        usuario,
        clave: propio ? claveBd : (admin.clave ?? ''),
      },
    });
    const motivo = propio
      ? undefined
      : esUsuarioDeProyecto(b.usuario)
        ? ('sin_clave' as const)
        : ('sin_usuario_propio' as const);
    return { url, usuario, propio, ...(motivo ? { motivo } : {}) };
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

  /** URL `ftp://usuario@host:puerto/` del sitio, sin la clave. */
  urlFtp(sitioId: string): Promise<string> {
    return this.ftp.urlSitio(sitioId);
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

  /**
   * Comando de la consola de administrador para permitir la entrada de un sitio compartido en la
   * red local (solo redes privadas). WolfCore Dev nunca lo ejecuta ni toca el cortafuegos.
   */
  async comandoFirewallLan(puerto: number, para: 'sitio' | 'ca' = 'sitio'): Promise<string> {
    // La regla de un sitio lleva el nginx.exe que lo sirve; la del enlace de la CA, solo el puerto
    // (lo escucha la propia app: nunca se invita a permitirla entera).
    if (para === 'ca') return this.plataforma.comandoManual({ tipo: 'regla-firewall-lan', puerto });
    const bin = this.rutas.bin('nginx', await this.servicios.nginx.versionActiva().catch(() => ''));
    const programa = path.join(bin, this.plataforma.ejecutable('nginx'));
    return this.plataforma.comandoManual({ tipo: 'regla-firewall-lan', puerto, programa });
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
            return this.conSecretos(sitioId, { receta: r.receta }).then((op) =>
              this.recetas.ejecutar(sitioId, op),
            );
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
      // Solo se llama tras la confirmación en la ventana (abrir_tunel la pide siempre).
      abrirTunel: (sitioId, tunel) =>
        this.tuneles.abrir(sitioId, { confirmado: true, tunelConfirmado: tunel }),
      cerrarTunel: (sitioId) => this.tuneles.cerrar(sitioId),
    };
  }

  /**
   * Lo que publican las órdenes de la CLI `wolf` (D31): los mismos métodos que usa la ventana, así
   * cada orden pasa por las mismas puertas (confirmación de túneles, validación de sitios,
   * confianza de las recetas…). No hay nada que repare ni que borre.
   */
  private operacionesCli(): OperacionesCli {
    return {
      carpetaDatos: () => this.rutas.base,
      sitios: () => this.sitios.listar(),
      puertosWeb: async () => {
        const c = await this.config.leer();
        return { http: c.servicios.nginx.puerto, https: c.https.puerto };
      },
      idioma: async () => (await this.config.leer()).ui.idioma,
      estadoServicios: () => this.servicios.estados(),
      estadosTuneles: () => this.tuneles.estados(),
      detectar: (carpeta) => this.detectarProyecto(carpeta),
      guardarSitio: (datos, id) => this.guardarSitio(datos, id),
      cambiarCarpetaVigilada: (carpeta) => this.cambiarCarpetaVigilada(carpeta),
      sugerenciasProyectos: () => this.sugerenciasProyectos(),
      phpInstaladas: () => this.instalador.instalados('php'),
      runtimesInstalados: (tipo) => this.runtimes.instalados(tipo as TipoRuntime),
      cambiarPhpPorDefecto: (rama) => this.cambiarPhpPorDefecto(rama),
      // La misma puerta que la ventana y el MCP: sin `confirmado: true` no se abre nada.
      abrirTunel: (sitioId, o) => this.tuneles.abrir(sitioId, o),
      cerrarTunel: (sitioId) => this.tuneles.cerrar(sitioId),
      revisarDoctor: () => this.doctor.revisar(),
      fuentesRegistro: () => this.registros.fuentes(),
      leerRegistro: (id, lineas) => this.registros.leerFinal(id, lineas),
      seguirRegistro: async (id, alLineas) => {
        const baja = this.eventos.on('registro:lineas', (e) => {
          if (e.id === id) alLineas(e.lineas);
        });
        try {
          const dejar = await this.registros.seguir(id);
          return () => {
            baja();
            dejar();
          };
        } catch (e) {
          baja();
          throw e;
        }
      },
      workspaces: () => this.workspaces.lista(),
      iniciarWorkspace: (id) => this.workspaces.iniciar(id),
      detenerWorkspace: (id) => this.workspaces.detener(id),
      iniciarServicio: async (id) => this.servicios.iniciar(await this.idServicioMcp(id)),
      detenerServicio: async (id) => this.servicios.detener(await this.idServicioMcp(id)),
      iniciarTodo: () => this.iniciarTodo(),
      detenerTodo: () => this.detenerTodo(),
      caConfiable: async () => (await this.https.estado()).caInstalada,
      confirmar: (s) => this.confirmadorCli.pedir(s),
      abrirUrl: async (url) => {
        const abrir = this.opcionesCli.abrirUrl;
        if (!abrir) return false;
        await abrir(url);
        return true;
      },
    };
  }

  /** ¿Está encendido el servidor de la CLI `wolf`, y el ajuste `cli.activo`? */
  async estadoCli(): Promise<{ activo: boolean; ajuste: boolean }> {
    return { activo: this.cli.estado().activo, ajuste: (await this.config.leer()).cli.activo };
  }

  /**
   * Enciende o apaga la CLI y lo guarda en `cli.activo`. Apagada no escucha y no existe `cli.json`.
   * Se enciende al agregar `wolf` al PATH (D32) y se apaga en Ajustes.
   */
  async activarCli(activa: boolean): Promise<{ activo: boolean; ajuste: boolean }> {
    if (activa) {
      await this.cli.iniciar();
      await this.sitios.modificarConfig((c) => {
        c.cli.activo = true;
      });
    } else {
      await this.sitios.modificarConfig((c) => {
        c.cli.activo = false;
      });
      await this.cli.detener();
      await rm(this.rutas.cliJson(), { force: true }).catch(() => undefined);
    }
    return this.estadoCli();
  }

  /** Borra `run/app.pid` solo si es de este proceso. */
  private async borrarMarcaApp(): Promise<void> {
    try {
      if ((await readFile(this.rutas.cliApp(), 'utf8')).trim() === String(process.pid)) {
        await rm(this.rutas.cliApp(), { force: true });
      }
    } catch {
      // no estaba
    }
  }

  /** El botón "Agregar wolf al PATH" de Ajustes: ¿está en el PATH, instalado y encendido? */
  async estadoCliPath(): Promise<{
    enPath: boolean;
    instalado: boolean;
    activo: boolean;
    ajuste: boolean;
    aislado: boolean;
  }> {
    const e = await this.estadoCli();
    return {
      enPath: await this.pathCli.estado(),
      instalado: await clienteCliInstalado(this.rutas),
      ...e,
      aislado: this.aislado,
    };
  }

  /**
   * Agrega (o quita) `wolf` del PATH del usuario (la interfaz ya confirmó). Agregar copia el
   * cliente a `bin/cli/`, agrega esa carpeta con copia del PATH original y enciende `cli.activo`;
   * quitar la saca del PATH, apaga `cli.activo` (sin servidor ni `cli.json`) y borra el cliente.
   * Con otra carpeta de datos (`WOLFCORE_DATOS`) no se toca nada: ni el PATH ni la CLI.
   */
  async cambiarCliPath(activar: boolean): Promise<{ aviso: string }> {
    if (this.aislado) {
      throw new ErrorWolf(
        'cli.path_aislado',
        'Con una carpeta de datos de prueba (WOLFCORE_DATOS) no se cambia el PATH del usuario.',
      );
    }
    if (activar) {
      const cliente = this.opcionesCli.cliente;
      if (!cliente || !existsSync(cliente.script)) {
        throw new ErrorWolf('cli.sin_cliente', 'Esta versión no trae el cliente wolf.');
      }
      // Primero lo que puede fallar sin dejar rastro (sin proteger el token, la CLI no se activa).
      await this.activarCli(true);
      try {
        const inst = await instalarClienteCli(this.rutas, cliente, this.opcionesCli.lanzadorExe);
        if (inst.bloqueado) {
          this.avisosPendientes.push(AVISO_LANZADOR_BLOQUEADO);
          console.warn(AVISO_LANZADOR_BLOQUEADO);
        }
        return await this.pathCli.agregar();
      } catch (e) {
        // Deshace todo: CLI apagada, sin cliente copiado y sin la entrada en el PATH (si llegó a escribirse).
        await this.activarCli(false).catch(() => undefined);
        await quitarClienteCli(this.rutas);
        await this.pathCli.quitar().catch(() => undefined);
        throw e;
      }
    }
    // Si el PATH no se puede cambiar, nada se apaga: el usuario sigue con la CLI como estaba.
    const r = await this.pathCli.quitar();
    await this.activarCli(false);
    await quitarClienteCli(this.rutas);
    return r;
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
  async ejecutarReceta(sitioId: string, opciones: OpcionesReceta = {}): Promise<ResultadoReceta> {
    return this.recetas.ejecutar(sitioId, await this.conSecretos(sitioId, opciones));
  }

  /**
   * La clave del usuario propio de la base de un proyecto (si el proceso principal tiene una) va
   * a la corrida de la receta, solo en memoria. Una que ya traen las opciones manda.
   */
  private async conSecretos(sitioId: string, opciones: OpcionesReceta): Promise<OpcionesReceta> {
    if (opciones.secretos?.claveBd) return opciones;
    const claveBd = await this.proveedorClaveBd(sitioId).catch(() => null);
    return claveBd ? { ...opciones, secretos: { ...opciones.secretos, claveBd } } : opciones;
  }

  /** Quien da la clave del usuario de la base de cada proyecto (el proceso principal). */
  fijarProveedorClaveBd(fn: (sitioId: string) => Promise<string | null>): void {
    this.proveedorClaveBd = fn;
  }

  /**
   * El proceso principal entrega su almacén de secretos para las credenciales de los túneles con
   * nombre (`tunel:<proveedor>`): el núcleo las lee por llamada y nunca las guarda ni las muestra.
   */
  fijarSecretosTunel(fn: () => SecretosTunel | null): void {
    this.tuneles.fijarSecretos(fn);
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

  // ---- Captura de pantalla (D35) ----

  /** Atajo y formato de la captura (`config.json` → `captura`). */
  async capturaConfig(): Promise<CapturaConfig> {
    return (await this.config.leer()).captura;
  }

  /** Guarda solo los campos dados (validados) y devuelve la configuración resultante. */
  async guardarCapturaConfig(cambios: CambiosCaptura): Promise<CapturaConfig> {
    if (motivoAtajoCaptura((cambios as { atajo?: unknown }).atajo) === 'no_permitido') {
      throw new ErrorWolf(
        'captura.atajo_no_permitido',
        'Ese atajo no se permite: use Ctrl o Super con otro modificador y evite los atajos comunes.',
      );
    }
    const p = CambiosCapturaSchema.safeParse(cambios);
    if (!p.success) {
      throw new ErrorWolf('captura.atajo_invalido', 'El atajo de captura no es válido.');
    }
    let res: CapturaConfig | null = null;
    await this.sitios.modificarConfig((c) => {
      const nueva: CapturaConfig = { ...c.captura };
      if (p.data.atajo !== undefined) nueva.atajo = p.data.atajo;
      if (p.data.formato !== undefined) nueva.formato = p.data.formato;
      c.captura = nueva;
      res = nueva;
    });
    return res ?? (await this.config.leer()).captura;
  }

  /** ¿Se puede capturar la pantalla aquí y está el permiso del sistema? */
  capturaDisponible(): Promise<EstadoCaptura> {
    return this.plataforma.capturaDisponible();
  }

  // ---- Optimizador de RAM (D36) ----

  /** La app (proceso principal) registra aquí una caché que sabe vaciar, p. ej. la de Electron. */
  registrarCacheApp(c: CacheApp): void {
    this.cachesApp.set(c.id, c);
  }

  /** Lista lo que se podría liberar (solo lee). Nada se hace hasta `aplicarMemoria`. */
  planMemoria(modo: ModoMemoria): Promise<PlanMemoria> {
    return this.optimizadorMemoria.planMemoria(modo);
  }

  /** Aplica las acciones elegidas del plan `planId` (vigente 5 min); exige `confirmado === true`. */
  aplicarMemoria(planId: string, ids: string[], confirmado: true): Promise<ResultadoMemoria> {
    return this.optimizadorMemoria.aplicarMemoria(planId, ids, confirmado);
  }

  // ---- Limpieza de disco (D37) ----

  /** La app dice cómo se manda un archivo a la papelera (en Electron, `shell.trashItem`). */
  registrarPapelera(enviar: (ruta: string) => Promise<void>): void {
    this.plataforma.registrarPapelera(enviar);
  }

  /** Lista qué se limpiaría y cuánto pesa (solo lee). Sin categorías = todas. */
  analizarLimpieza(categorias: readonly string[] = []): Promise<ResumenCategoria[]> {
    return this.limpiezaDisco.analizar(categorias);
  }

  /** Limpia las categorías elegidas tras un análisis; exige `confirmado === true`. */
  limpiarDisco(categorias: readonly string[], confirmado: true): Promise<ResultadoLimpiezaDisco> {
    return this.limpiezaDisco.limpiar(categorias, confirmado);
  }

  /** Carpeta de los registros de lo borrado (se crea si falta, para poder abrirla). */
  async carpetaRegistroLimpieza(): Promise<string> {
    const carpeta = this.rutas.logs('limpieza');
    await mkdir(carpeta, { recursive: true });
    return carpeta;
  }

  /** Corta el análisis o la limpieza en curso. */
  cancelarLimpieza(): void {
    this.limpiezaDisco.cancelar();
  }

  // ---- Editor de código (D43) ----

  /**
   * Abre un archivo de texto elegido en un diálogo. Rechaza `.env`, binarios, archivos grandes y
   * lo que hay dentro de la carpeta de datos; con forma de secreto o de un sitio con datos reales
   * devuelve `confirmar` (sin contenido) hasta que llegue `confirmadoRiesgo`.
   */
  abrirArchivoEditor(
    ruta: string,
    opciones: OpcionesAbrirArchivo = {},
  ): Promise<ResultadoAbrirArchivo> {
    return this.editorCodigo.abrir(ruta, opciones);
  }

  /** Guarda con copia previa y escritura atómica; exige `confirmado === true` y la huella al abrir. */
  guardarArchivoEditor(
    ruta: string,
    opciones: OpcionesGuardarArchivo,
  ): Promise<ResultadoGuardarArchivo> {
    return this.editorCodigo.guardar(ruta, opciones);
  }

  /** Lo que la limpieza nunca toca: datos, respaldos, proyectos y el resto de lo propio. */
  private async rutasVetadasLimpieza(): Promise<string[]> {
    const carpetas = [
      'data',
      'respaldos',
      'run',
      'etc',
      'instantaneas',
      'papelera',
      'ca',
      'certs',
      'bin',
      'tools',
      'editor-copias',
    ];
    const res: string[] = [];
    for (const base of new Set([this.rutas.base, this.plataforma.carpetaDatos()])) {
      for (const c of carpetas) res.push(path.join(base, c));
    }
    for (const s of await this.sitios.listar()) res.push(s.carpeta);
    return res;
  }

  private pidsSupervisados(): number[] {
    const res: number[] = [];
    for (const id of this.supervisor.ids()) {
      const pid = this.supervisor.pid(id);
      if (pid !== null) res.push(pid);
    }
    return res;
  }

  private async poolsReducibles(): Promise<PoolReducible[]> {
    const ultima = this.metricas.ultimos(1).at(-1);
    const res: PoolReducible[] = [];
    for (const version of await this.instalador.instalados('php')) {
      const encendidos = this.servicios.php.trabajadoresEncendidos(version);
      if (encendidos.length < 2) continue;
      const ids = encendidos.map((i) => this.servicios.php.idTrabajador(version, i));
      const inact = ids.map((id) => this.metricas.inactividadMs(id));
      const obs = ids.map((id) => this.metricas.observadoMs(id));
      const sobran = new Set(ids.slice(1));
      res.push({
        version,
        trabajadores: encendidos.length,
        memoria: (ultima?.procesos ?? [])
          .filter((p) => sobran.has(p.id))
          .reduce((t, p) => t + p.ramBytes, 0),
        // Inactivo solo si todos lo están; sin observar alguno, no se sabe.
        inactivoMs: inact.some((x) => x === null) ? null : Math.min(...(inact as number[])),
        observadoMs: obs.some((x) => x === null) ? null : Math.min(...(obs as number[])),
      });
    }
    return res;
  }

  /**
   * Servicios de datos, instancias y procesos de proyecto encendidos (no nginx, FTP ni PHP). La
   * actividad se lee de lo observado de CADA proceso (`inactividadMs`), nunca del búfer de
   * muestras: la memoria sí sale de la última muestra, pero solo para mostrarla.
   */
  private async serviciosPropiosEncendidos(): Promise<ServicioPropio[]> {
    const ultima = this.metricas.ultimos(1).at(-1);
    const ramPorId = new Map((ultima?.procesos ?? []).map((p) => [p.id, p.ramBytes]));
    const res: ServicioPropio[] = [];
    // Id con el que el supervisor (y, por tanto, Metricas) conoce a cada PID encendido.
    const idPorPid = new Map<number, string>();
    for (const sid of this.supervisor.ids()) {
      const pid = this.supervisor.pid(sid);
      if (pid !== null) idPorPid.set(pid, sid);
    }
    const agregar = (id: string, nombre: string, pid: number | null, puertos: number[]): void => {
      const sid = (pid === null ? undefined : idPorPid.get(pid)) ?? id;
      res.push({
        id,
        nombre,
        memoria: ramPorId.get(sid) ?? 0,
        inactivoMs: this.metricas.inactividadMs(sid),
        observadoMs: this.metricas.observadoMs(sid),
        puertos,
        pid,
      });
    };
    for (const s of await this.servicios.estados()) {
      if (s.id === 'nginx' || s.id === 'ftp' || s.id.startsWith('php-')) continue;
      if (s.instancias && s.instancias.length > 0) {
        for (const i of s.instancias) {
          if (i.estado === 'encendido')
            agregar(i.id, `${s.nombre} ${i.version}`, i.pid, [i.puerto]);
        }
      } else if (s.estado === 'encendido') {
        agregar(s.id, s.nombre, s.pid, s.puertos);
      }
    }
    return res;
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

  /** Imagen elegida en un diálogo, con dimensiones y peso ya acotados (no se decodifica aquí). */
  leerImagen(ruta: string): Promise<ImagenLeida> {
    return leerImagen(ruta);
  }

  /** Guarda una imagen convertida o comprimida en un archivo nuevo (nunca pisa uno existente). */
  guardarImagen(destino: string, datos: Uint8Array): Promise<{ archivo: string; bytes: number }> {
    return guardarImagen(destino, datos);
  }

  /** `.zip` nuevo con los archivos y carpetas elegidos; no sigue enlaces ni pisa el destino. */
  comprimirZip(origenes: string[], destino: string): Promise<ResultadoZip> {
    return comprimirZip({ origenes, destino });
  }

  /** PDF re-guardado en un hilo aparte; solo deja archivo si pesa menos que el original. */
  optimizarPdf(origen: string, destino: string): Promise<ResultadoPdf> {
    return optimizarPdf(origen, destino, {
      ...(this.ejecutorConversor ? { ejecutor: this.ejecutorConversor } : {}),
    });
  }

  /** Conversiones de documentos que se pueden ofrecer ahora (LibreOffice solo si está instalado). */
  async conversionesDocumento(): Promise<{ conversiones: Conversion[]; libreOffice: boolean }> {
    const lo = await this.plataforma.libreOffice();
    return {
      // Sin proceso de trabajo no se convierte nada: lo pesado nunca corre en el principal.
      conversiones: this.ejecutorConversor
        ? conversionesDisponibles({ libreOffice: lo, imprimirPdf: this.imprimirPdf !== undefined })
        : [],
      libreOffice: lo !== null,
    };
  }

  /**
   * Convierte un documento en este equipo (D34). `origen` sale de un diálogo "Abrir" y `destino`
   * de uno "Guardar"; nunca se pisa un archivo existente.
   */
  async convertirDocumento(
    origen: string,
    a: Formato,
    destino: string,
  ): Promise<{ destino: string; bytes: number }> {
    return convertir({ origen, a, destino }, undefined, {
      libreOffice: await this.plataforma.libreOffice(),
      ...(this.ejecutorConversor ? { ejecutor: this.ejecutorConversor } : {}),
      ...(this.imprimirPdf ? { imprimirPdf: this.imprimirPdf } : {}),
    });
  }

  private busquedasEnCurso?: Busquedas;

  private get busquedas(): Busquedas {
    return (this.busquedasEnCurso ??= new Busquedas({
      resultado: (lote) => this.eventos.emit('busqueda:resultado', lote),
      fin: (fin) => this.eventos.emit('busqueda:fin', fin),
    }));
  }

  /**
   * Empieza una búsqueda en segundo plano y devuelve su id; los resultados llegan por
   * `busqueda:resultado` y el cierre por `busqueda:fin`. `o.raiz` ya viene de un diálogo o de la
   * carpeta de un proyecto por id.
   */
  iniciarBusqueda(o: OpcionesBusqueda): string {
    return this.busquedas.iniciar(o);
  }

  cancelarBusqueda(id: string): boolean {
    return this.busquedas.cancelar(id);
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
   * Abre un archivo del sitio en el editor elegido en una línea (desde el visor de errores). Solo archivos
   * reales dentro de la carpeta del sitio: el sitio sale de la configuración por su id.
   */
  async abrirEnEditor(
    sitioId: string,
    archivo: string,
    linea: number,
    editor?: IdEditor | null,
  ): Promise<ResultadoAbrirEditor> {
    const carpeta = (await this.sitioPorId(sitioId)).carpeta;
    const { deps, predeterminado } = await this.depsEditor();
    return abrirArchivoDelSitio(
      carpeta,
      archivo,
      linea,
      { ...(editor ? { editor } : {}), predeterminado },
      deps,
    );
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
   * SHA-1 que wordpress.org publica para esa versión (por defecto la del generador): la interfaz
   * la muestra antes de pedir la confirmación de la huella débil. No baja el zip.
   */
  huellaWordpress(version: string = VERSION_WORDPRESS): Promise<string> {
    return leerHuellaWordpress(this.depsPasos?.fetch ?? fetch, version);
  }

  /**
   * Proyecto nuevo desde un generador (Laravel, CodeIgniter, Symfony, FastAPI, WordPress o
   * estático): valida el pedido, crea la carpeta, el sitio y corre su receta (el avance llega por
   * `receta:progreso`). Nunca pisa una carpeta con archivos; si un paso falla no borra nada y el
   * resultado dice qué quedó creado.
   */
  crearProyecto(p: PedidoProyecto, o: OpcionesCrearProyecto = {}): Promise<ResultadoCrearProyecto> {
    return crearProyecto(
      {
        rutas: this.rutas,
        crearSitio: (datos, receta) => this.crearSitioProyecto(datos, receta),
        ejecutarReceta: (id, receta, secretos?: SecretosReceta) =>
          this.recetas.ejecutar(id, { receta, ...(secretos ? { secretos } : {}) }),
        estadoReceta: (id) => this.recetas.estado(id),
        sitios: () => this.sitios.listar(),
        basesDe: async (objetivo) => (await this.bd.listar(objetivo)).map((b) => b.nombre),
        phpInstaladas: () => this.instalador.instalados('php'),
        pythonInstaladas: () => this.instalador.instalados('python'),
        iniciarProcesos: async (id) => {
          const sitio = (await this.sitios.listar()).find((s) => s.id === id);
          for (const proc of sitio?.procesos ?? []) {
            if (proc.autoIniciar) await this.procesos.iniciar(id, proc.id);
          }
        },
        confiar: (id) => this.confiarReceta(id),
        quitarConfianza: async (id) => {
          const { id: _id, ...resto } = await this.sitioPorId(id);
          void _id;
          await this.guardarSitio({ ...resto, confiado: false }, id);
        },
        plantillas: this.plantillas,
        extensionesActivas: async (rama) =>
          (await this.extensionesPhp.listar(rama)).filter((e) => e.activa).map((e) => e.nombre),
        aplicarAjustes: async (id, a) => {
          const avisos: string[] = [];
          if (Object.keys(a.phpIni).length > 0) {
            // Si el ini no pasa la prueba lanza: crearProyecto lo informa como aviso.
            await this.guardarPhpIniSitio(id, a.phpIni);
          }
          if (a.reglasNginx !== null) {
            const r = await this.editorVhost.aplicar(id, { reglas: a.reglasNginx });
            if (!r.ok) avisos.push('Nginx rechazó las reglas de la plantilla: no se aplicaron.');
          }
          return avisos;
        },
      },
      p,
      o,
    );
  }

  /**
   * "Usar usuario propio": crea para un proyecto que ya existe un usuario de base limitado a SU
   * base (todos los permisos de esa base y nada más: sin FILE, SUPER, GRANT OPTION ni otras bases)
   * y lo pone en el `.env` (con copia previa y escritura atómica). Solo MySQL y MariaDB locales de
   * WolfCore Dev. La clave la genera el proceso principal; `guardarClave` la guarda en
   * `AlmacenSecretos` antes de crear el usuario. El núcleo no la guarda ni la devuelve.
   */
  async usarUsuarioPropio(
    sitioId: string,
    o: {
      claveBd: string;
      /** Guarda en `AlmacenSecretos` la clave que va a usar el proyecto (la nueva o la reutilizada). */
      guardarClave: (clave: string) => Promise<void>;
      aceptarVersionado?: boolean;
      /**
       * Confirma compartir el usuario de otro proyecto que usa la misma base (`env.usuario_compartido`
       * nombra a ese proyecto). Sin esto, nunca se reutiliza su clave.
       */
      compartirUsuario?: boolean;
    },
    confirmado: true,
  ): Promise<{ usuario: string; copia: string | null }> {
    if (confirmado !== true) {
      throw new ErrorWolf(
        'env.sin_confirmar',
        'Confirme que quiere cambiar el usuario de la base en el .env.',
      );
    }
    const sitio = await this.sitioPorId(sitioId);
    const b = await leerBaseDelProyecto(sitio.carpeta).catch(() => null);
    if (!b) {
      throw new ErrorWolf(
        'env.sin_base',
        'El .env de este proyecto no apunta a una base de datos.',
      );
    }
    if (b.host && !/^(127\.0\.0\.1|localhost|\[?::1\]?)$/i.test(b.host)) {
      throw new ErrorWolf(
        'env.base_no_resuelta',
        'La base de este proyecto no es de un servidor local de WolfCore Dev.',
      );
    }
    if (b.motor === 'postgresql') {
      throw new ErrorWolf(
        'env.motor_no_soportado',
        'Por ahora "Usar usuario propio" funciona con MySQL y MariaDB.',
      );
    }
    // Ya usa un usuario propio: solo se vuelve a generar si falta su clave guardada (se creó sin
    // cifrado disponible o se perdió); si la tiene, no hay nada que hacer.
    if (
      esUsuarioDeProyecto(b.usuario) &&
      (await this.proveedorClaveBd(sitioId).catch(() => null))
    ) {
      throw new ErrorWolf('env.ya_usa_usuario_propio', 'Este proyecto ya usa un usuario propio.');
    }
    const objetivo = await this.objetivoDeServidor(b.motor, b.puerto);
    if (!objetivo) {
      throw new ErrorWolf(
        'env.base_no_resuelta',
        'No se pudo saber de qué servidor local es la base del proyecto.',
      );
    }
    const usuario = usuarioDeProyecto(b.base);
    // Otro proyecto con la misma base ya usa este usuario: su clave nunca se cambia (lo dejaría sin
    // conexión). Se reutiliza la que tiene guardada, y `crear` la comprueba contra el servidor.
    let clave = o.claveBd;
    let reutilizada = false;
    for (const otro of await this.otrosConUsuarioBd(usuario, sitioId)) {
      const suya = await this.proveedorClaveBd(otro.id).catch(() => null);
      if (suya) {
        if (o.compartirUsuario !== true) {
          throw new ErrorWolf(
            'env.usuario_compartido',
            `La base ${b.base} también la usa el proyecto ${otro.nombre}: confirme que quiere compartir su usuario.`,
            { base: b.base, proyecto: otro.nombre.slice(0, 80) },
          );
        }
        clave = suya;
        reutilizada = true;
        break;
      }
      throw errorUsuarioEnUso(usuario);
    }
    const r = await this.env.ponerUsuarioBd(sitioId, usuario, clave, {
      ...(o.aceptarVersionado ? { aceptarVersionado: true } : {}),
      // Con el `.env` listo para escribirse: primero se guarda la clave y luego se crea el usuario.
      antes: async () => {
        await o.guardarClave(clave);
        await this.bd.crear(objetivo, b.base, {
          usuario,
          clave,
          ...(reutilizada ? {} : { cambiarClave: true }),
        });
      },
    });
    return { usuario, copia: r.copia };
  }

  // ---- perfiles del entorno (D26) ----

  /** Dependencias de los perfiles; `guardarClave` la da el proceso principal (`AlmacenSecretos`). */
  private depsPerfiles(
    guardarClave: (sitioId: string, clave: string) => Promise<void> = async () => {
      throw new ErrorWolf('secretos.sin_cifrado', 'No hay dónde guardar la clave de la base.');
    },
  ): DepsPerfiles {
    const motores = ['mysql', 'mariadb', 'postgresql'] as const;
    const servicioDe = (id: string): IdServicioDatos =>
      id.slice(0, id.indexOf('@')) as IdServicioDatos;
    const versionEn = async (servicio: string, version: string): Promise<boolean> => {
      for (const clave of await this.instalador.instalados(servicio)) {
        if (clave === version) return true;
        if ((await this.instalador.versionInstalada(servicio, clave)) === version) return true;
      }
      return false;
    };
    return {
      rutas: this.rutas,
      leerConfig: () => this.config.leer(),
      // En la cola de escrituras de config.json de los sitios (nada se pisa entre medio).
      guardarConfig: (c) =>
        this.sitios.modificarConfig((x) => {
          Object.assign(x, c);
        }),
      plantillas: this.plantillas,
      versionesInstaladas: async () => {
        const res: { servicio: string; version: string; huella: string | null }[] = [];
        for (const servicio of SERVICIOS_VERSIONES) {
          for (const clave of await this.instalador.instalados(servicio)) {
            const version = await this.instalador.versionInstalada(servicio, clave);
            const v = await this.catalogoVivo.buscar(servicio, version).catch(() => null);
            const h = v ? huellaDe(v) : null;
            res.push({ servicio, version, huella: h ? `${h.algoritmo}:${h.valor}` : null });
          }
        }
        return res;
      },
      buscarVersion: (servicio, version) =>
        this.catalogoVivo.buscar(servicio as ServicioInstalable, version),
      versionInstalada: versionEn,
      // La importación ya tomó su instantánea: las versiones que instala no toman otra. Una
      // actualización que el usuario lance mientras tanto sí (la opción es de esta llamada).
      instalarVersion: (v) => this.instalador.instalar(v, { sinInstantaneaEntorno: true }),
      puertoLibre: (p) => puertoLibreAhora(p),
      basesParaExportar: async () => {
        const res: { instancia: string; base: string }[] = [];
        for (const m of motores) {
          for (const i of await this.servicios.datos.listaInstancias(m)) {
            if (i.estado !== 'encendido') continue;
            for (const b of await this.bd.listar(i.id).catch(() => [])) {
              res.push({ instancia: i.id, base: b.nombre });
            }
          }
        }
        return res;
      },
      volcarBase: (instancia, base, carpeta) =>
        this.respaldos.volcarParaPerfil(instancia as IdInstancia, base, carpeta),
      prepararInstancia: async (instancia) => {
        const lista = await this.servicios.datos.listaInstancias(servicioDe(instancia));
        const i = lista.find((x) => x.id === instancia);
        if (!i) throw new Error('La instancia no existe.');
        if (i.estado !== 'encendido') await this.servicios.iniciar(instancia as IdInstancia);
      },
      basesDe: async (instancia) =>
        (await this.bd.listar(instancia as IdInstancia)).map((b) => b.nombre),
      instantaneaEntorno: () => this.instantaneaEntorno('importar-perfil'),
      progreso: (p) => this.eventos.emit('perfil:progreso', p),
      restringir: (ruta) => this.plataforma.restringirAlUsuario(ruta),
      aislado: this.aislado,
      instantaneaPrevia: async (instancia, base) => {
        await this.instantaneas.tomar(
          instancia as IdInstancia,
          base,
          'Antes de importar un perfil',
        );
      },
      restaurarBase: async (instancia, archivos, base, o) => {
        const objetivo = instancia as IdInstancia;
        if ('volcado' in archivos) {
          await this.respaldos.restaurarPgDePerfil(objetivo, archivos.volcado, base);
          return;
        }
        await this.respaldos.importarVolcadosAjenos(objetivo, archivos, base, {
          confirmarSobrescribir: o.existe,
          baseExistente: o.existe,
          baseNueva: !o.existe,
        });
      },
      crearUsuarioBd: async (instancia, base, usuario, clave, o) => {
        await this.bd.crear(instancia as IdInstancia, base, {
          usuario,
          clave,
          ...(o.cambiarClave ? { cambiarClave: true } : {}),
        });
      },
      claveCompartida: async (usuario, excluir) => {
        for (const otro of await this.otrosConUsuarioBd(usuario, excluir)) {
          const suya = await this.proveedorClaveBd(otro.id).catch(() => null);
          if (suya) return suya;
          throw errorUsuarioEnUso(usuario);
        }
        return null;
      },
      guardarClaveBd: guardarClave,
      ponerUsuarioEnv: async (sitioId, usuario, clave, puerto, antes) => {
        const r = await this.env.ponerUsuarioBd(sitioId, usuario, clave, { antes });
        if (puerto !== null) {
          const s = await this.sitioPorId(sitioId);
          const texto = await readFile(path.join(s.carpeta, '.env'), 'utf8').catch(() => '');
          if (/^\s*DB_PORT\s*=/m.test(texto)) {
            await this.env.guardar(sitioId, { cambios: { DB_PORT: String(puerto) } }, true);
          }
        }
        return { copia: r.copia };
      },
      regenerarCertificados: async () => {
        await this.https.crearCaSiFalta();
        for (const s of await this.sitios.listar()) {
          if (!s.https || s.pendiente) continue;
          await this.https.asegurarCertificado(s).catch((e) => {
            console.error('No se pudo emitir el certificado del sitio:', mensajeDe(e));
          });
        }
      },
      sistema: this.plataforma.idCatalogo(),
      idCatalogo: this.plataforma.idCatalogo(),
    };
  }

  /**
   * Exporta el entorno a un `.wolfperfil` (sin secretos; bases y CA cifrada opcionales). La ruta
   * de destino sale de un diálogo del proceso principal.
   */
  exportarPerfil(o: OpcionesExportarPerfil): Promise<ResultadoExportarPerfil> {
    return exportarPerfil(this.depsPerfiles(), o);
  }

  /** Lo que importaría un perfil en esta carpeta de datos (no escribe nada). */
  vistaPreviaImportarPerfil(
    archivo: string,
    o: Pick<OpcionesImportarPerfil, 'rutas' | 'prefijos'> = { rutas: {} },
  ): Promise<VistaPreviaPerfil> {
    return new Perfiles(this.depsPerfiles()).vistaPrevia(archivo, o);
  }

  /**
   * Importa un perfil (con la huella de la vista previa y `confirmado`). `guardarClave` guarda en
   * `AlmacenSecretos` (`bd:<sitio>`) la clave nueva de cada usuario propio que se recrea.
   */
  async importarPerfil(
    archivo: string,
    o: OpcionesImportarPerfil & {
      guardarClave: (sitioId: string, clave: string) => Promise<void>;
    },
  ): Promise<ResultadoImportarPerfil> {
    const { guardarClave, ...resto } = o;
    // Una sola importación a la vez; toma su propia instantánea del entorno.
    if (this.importandoPerfil) {
      throw new ErrorWolf('perfiles.en_curso', 'Ya hay una importación de perfil en curso.');
    }
    this.importandoPerfil = true;
    let r: ResultadoImportarPerfil;
    try {
      r = await new Perfiles(this.depsPerfiles(guardarClave)).importar(archivo, resto);
    } finally {
      this.importandoPerfil = false;
    }
    // Pools propios, Nginx y hosts al día con los sitios importados. Con WOLFCORE_DATOS el hosts
    // no se escribe (plataforma aislada) y el aviso lo dice.
    await this.poolsSitio.sincronizar().catch((e) => {
      console.error('No se pudo poner al día el PHP propio de los sitios:', mensajeDe(e));
    });
    try {
      const a = await this.sitios.aplicar();
      if (!a.nginx.ok || !a.hosts.ok) {
        r.avisos.push({
          codigo: 'aplicar',
          datos: { nginx: a.nginx.ok ? 'ok' : 'error', hosts: a.hosts.ok ? 'ok' : 'error' },
        });
      }
    } catch (e) {
      r.avisos.push({
        codigo: 'aplicar',
        datos: { nginx: 'error', hosts: 'error', detalle: mensajeDe(e) },
      });
    }
    return r;
  }

  // ---- instantánea del entorno (D27) ----

  private depsInstantaneaEntorno(): DepsInstantaneaEntorno {
    return {
      rutas: this.rutas,
      leerConfig: () => this.config.leer(),
      restringir: (ruta) => this.plataforma.restringirAlUsuario(ruta),
    };
  }

  /**
   * Copia (sin secretos) de la configuración, Nginx y los php.ini en
   * `respaldos/entorno/<fecha>-<motivo>/`, con las 10 últimas. Devuelve su carpeta (`''` si no
   * había nada). Si falla, lanza `perfiles.instantanea_fallo`.
   */
  instantaneaEntorno(motivo: MotivoInstantaneaEntorno): Promise<string> {
    return tomarInstantaneaEntorno(this.depsInstantaneaEntorno(), motivo);
  }

  /** Las instantáneas del entorno que hay, de la más nueva a la más vieja. */
  instantaneasEntorno(): Promise<InstantaneaEntorno[]> {
    return listarInstantaneasEntorno(this.depsInstantaneaEntorno());
  }

  /** Antes de reemplazar PHP o Nginx. Las instalaciones de una importación no pasan por aquí. */
  private async instantaneaAntesDeActualizar(): Promise<void> {
    await this.instantaneaEntorno('actualizar');
  }

  /** Otros proyectos (no `excluir`) cuyo `.env` usa este usuario de base. */
  private async otrosConUsuarioBd(usuario: string, excluir: string | string[]): Promise<Sitio[]> {
    const fuera = new Set(Array.isArray(excluir) ? excluir : [excluir]);
    const salida: Sitio[] = [];
    for (const s of await this.sitios.listar()) {
      if (fuera.has(s.id)) continue;
      const b = await leerBaseDelProyecto(s.carpeta).catch(() => null);
      if (b && b.usuario.toLowerCase() === usuario.toLowerCase()) salida.push(s);
    }
    return salida;
  }

  /** ¿Otro proyecto (no `sitioId`) usa ya este usuario de base en su `.env`? */
  async usuarioBdEnUso(usuario: string, sitioId: string): Promise<boolean> {
    return (await this.otrosConUsuarioBd(usuario, sitioId)).length > 0;
  }

  /** Servidor local (instancia por puerto) de un motor SQL, o null si ninguno lo usa. */
  private async objetivoDeServidor(
    motor: 'mysql' | 'mariadb' | 'postgresql',
    puerto: number | null,
  ): Promise<ObjetivoBd | null> {
    const familia: string[] = motor === 'postgresql' ? ['postgresql'] : ['mysql', 'mariadb'];
    const estados = (await this.servicios.estados()).filter((e) => familia.includes(e.id));
    // Sin puerto declarado: el motor predeterminado (si está apagado, lo dice BasesDeDatos).
    if (puerto === null) return motor;
    for (const e of estados) {
      const instancia = e.instancias?.find((i) => i.puerto === puerto);
      if (instancia) return instancia.id;
      if (e.puertos.includes(puerto)) return e.id as MotorBd;
    }
    return null;
  }

  private importadorAjeno: Importador | undefined;

  /** Importador de Laragon, XAMPP y Herd (uno por proceso: no admite dos importaciones a la vez). */
  private importador(): Importador {
    this.importadorAjeno ??= new Importador({
      instalaciones: () => this.plataforma.instalacionesAjenas(),
      // Nunca se vincula la carpeta de datos de WolfCore Dev ni una que la contenga.
      prohibidas: [this.rutas.base],
      sitios: () => this.sitios.listar(),
      // Sin "Confío en este repositorio" y sin aplicar: Nginx y hosts se ponen al día una vez al final.
      guardarSitio: async (datos) => {
        let resto: Omit<Sitio, 'id'> = { ...datos, confiado: false, recetaConfiada: null };
        delete resto.ftp;
        delete resto.phpIni;
        delete resto.xdebug;
        delete resto.capturaDumps;
        delete resto.vhostManual;
        delete resto.vhostDesactivado;
        resto.reglasExtra = '';
        if (this.depsPasos) resto = await asignarPuertoProxy(this.depsPasos, resto, undefined);
        return { sitio: await this.sitios.crear(resto) };
      },
      aplicar: async () => {
        await this.poolsSitio.sincronizar().catch(() => undefined);
        const r = await this.sitios.aplicar();
        return r.nginx.ok && r.hosts.ok;
      },
      phpInstaladas: () => this.instalador.instalados('php'),
      basesDe: async (objetivo) => (await this.bd.listar(objetivo)).map((b) => b.nombre),
      importarBase: (objetivo, origen, destino, opciones) =>
        this.respaldos.importarAjeno(objetivo, origen, destino, opciones),
    });
    return this.importadorAjeno;
  }

  /**
   * Lo que se puede importar de Laragon, XAMPP y Herd (sus rutas conocidas), con lo que pasaría
   * con cada sitio. Solo lee: no mueve, no escribe ni enciende nada del otro programa.
   */
  vistaPreviaImportar(instancia?: ObjetivoBd): Promise<VistaPreviaImportar> {
    return this.importador().vistaPrevia(instancia);
  }

  /**
   * Importa los sitios elegidos (vinculados en su lugar) y, con los datos del servidor de origen
   * que encendió el usuario, sus bases (todo o nada; una base existente solo con confirmación).
   */
  importarDeOtros(seleccion: readonly string[], o: OpcionesImportar): Promise<ResultadoImportar> {
    return this.importador().importar(seleccion, o);
  }

  /** Cancela la importación en curso (mata solo su volcado, por PID); true si había una. */
  cancelarImportacion(): boolean {
    return this.importador().cancelar();
  }

  /**
   * Borra los usuarios y roles `wolf_tmp_*` vencidos que dejó una restauración de esquema
   * interrumpida, en los servidores de bases que ya están encendidos. Sin esperar y sin fallar.
   */
  async limpiarUsuariosTemporales(): Promise<void> {
    await this.respaldos.limpiarTemporalesAjenos().catch(() => undefined);
    try {
      for (const e of await this.servicios.estados()) {
        if (e.id !== 'mysql' && e.id !== 'mariadb' && e.id !== 'postgresql') continue;
        const objetivos: string[] = e.instancias?.length
          ? e.instancias.filter((i) => i.estado === 'encendido').map((i) => i.id)
          : e.estado === 'encendido'
            ? [e.id]
            : [];
        for (const o of objetivos) {
          await this.bd.limpiarTemporales(o as ObjetivoBd).catch(() => undefined);
        }
      }
    } catch {
      // Es mantenimiento: nunca estorba al arranque.
    }
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
    // A dónde envía correo el proyecto solo cambia con `usarCorreoEnSitio`: sin `correo` en los
    // cambios, `sitios.editar` conserva el que tiene (en la misma operación, sin carrera).
    delete resto.correo;
    // El proveedor de túnel solo cambia con `tuneles.elegirProveedor` (cierra el túnel abierto).
    delete resto.tunel;
    // Compartir en la red local solo cambia con `lan.activar`/`lan.desactivar` (confirmación).
    delete resto.lan;
    // Las tareas programadas (y su confirmación) solo cambian con `tareas.*`: guardar el sitio
    // conserva las que tiene y nunca acepta otras (ni una confirmada de antemano).
    delete resto.tareas;
    if (id) await this.cerrarTunelSiCambia(id, datos);
    if (id) await this.cerrarLanSiCambia(id, datos);
    const previo = id ? (await this.sitios.listar()).find((s) => s.id === id) : undefined;
    // Las reglas propias y el vhost manual solo cambian con el editor de vhost (revisión,
    // nginx -t y vuelta atrás): guardar el sitio conserva los que tenía y nunca los regenera.
    delete resto.vhostManual;
    delete resto.vhostDesactivado;
    resto.reglasExtra = previo?.reglasExtra ?? '';
    if (previo?.vhostManual) resto.vhostManual = previo.vhostManual;
    // Importado de un perfil con la carpeta pendiente (D26): deja de estarlo cuando la carpeta existe.
    if (existsSync(resto.carpeta)) resto.pendiente = null;
    // FastAPI/Node con el proceso del proxy sin puerto: se le asigna uno libre (no se rechaza).
    if (this.depsPasos) resto = await asignarPuertoProxy(this.depsPasos, resto, id);
    // Otra carpeta es otro código: lo que se confirmó antes ya no vale y lo que corre se detiene.
    // Lo mismo si deja de ser de confianza (o si cambia: la huella se toma de nuevo).
    if (previo && (previo.carpeta !== resto.carpeta || previo.confiado !== resto.confiado)) {
      this.programador.abortarSitio(previo.id);
    }
    if (previo && previo.carpeta !== resto.carpeta && previo.tareas?.length) {
      resto.tareas = previo.tareas.map((t) => ({ ...t, confirmada: null }));
    }
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
   * Si el sitio se comparte en la red local y cambia lo que el `server` de la red local da por
   * hecho (el dominio con el que reenvía, que ahora redirige a HTTPS sin que la red local lo use o
   * que pasa a tener datos reales), se deja de compartir antes de editar: lo que se confirmó ya no es lo que se serviría.
   */
  private async cerrarLanSiCambia(id: string, datos: Omit<Sitio, 'id'>): Promise<void> {
    const actual = (await this.sitios.listar()).find((s) => s.id === id);
    if (!actual?.lan?.activo) return;
    const cambia =
      actual.dominio !== datos.dominio.trim().toLowerCase() ||
      (datos.redirigirHttps && !actual.lan.https) ||
      // Con datos reales no se comparte en la red: si el sitio pasa a tenerlos, se deja de compartir.
      (datos.datosReales && !actual.datosReales);
    if (cambia) await this.lan.desactivar(id);
  }

  /**
   * Guarda el puerto de Nginx y los trabajadores de PHP y los pone en marcha: regenera los
   * vhosts (nuevo `listen`), reinicia Nginx si estaba encendido y cambió el puerto (si no, lo
   * recarga) y reinicia las ramas de PHP encendidas si cambiaron los trabajadores.
   */
  async guardarAjustes(a: AjustesServicios): Promise<ResultadoAjustes> {
    validarAjustes(a);
    const previo = await this.config.leer();
    // Los `server` de la red local reenvían al puerto de Nginx: si cambia, se deja de compartir.
    if (a.puerto !== previo.servicios.nginx.puerto) await this.lan.apagarTodo();
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
    // Si no, el arranque automático aún en curso podría encender algo después de apagarlo todo.
    await this.esperarArranque();
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
    // Un sitio borrado no puede seguir visible en la red local.
    await this.lan.desactivar(id).catch((e: unknown) => {
      console.error('No se pudo dejar de compartir el sitio borrado:', mensajeDe(e));
    });
    await this.procesos.detenerSitio(id);
    await this.ftp.desactivarSitio(id).catch(() => undefined);
    // Lo que esté corriendo de ese sitio se detiene y sus registros se purgan.
    this.programador.abortarSitio(id);
    await this.sitios.borrar(id);
    void this.programador.purgarHuerfanos().catch(() => undefined);
    // Sus copias del .env llevan valores en claro: no se quedan para otro sitio con el mismo id.
    await limpiarRespaldosEnv(this.rutas.respaldosEnv(), id).catch((e) => {
      console.error('No se pudieron borrar las copias del .env del sitio borrado:', mensajeDe(e));
    });
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
    // Las tareas en curso se cancelan (solo el árbol de cada una) antes de apagar nada más.
    await this.programador.detener().catch((e: unknown) => {
      console.error('No se pudo detener el planificador de tareas:', mensajeDe(e));
    });
    await this.cli.detener().catch((e: unknown) => {
      console.error('No se pudo detener el servidor de la CLI:', mensajeDe(e));
    });
    await this.borrarMarcaApp();
    await this.mcp.detener().catch((e: unknown) => {
      console.error('No se pudo detener el servidor MCP:', mensajeDe(e));
    });
    await this.depuracion.detener().catch((e: unknown) => {
      console.error('No se pudo detener el receptor de dumps:', mensajeDe(e));
    });
    await this.accesoBd.detener().catch((e: unknown) => {
      console.error('No se pudo detener el canje de accesos a la base:', mensajeDe(e));
    });
    // La red local y el servidor de la CA se apagan siempre al salir (con o sin detener servicios).
    await this.caMovil.cerrar().catch((e: unknown) => {
      console.error('No se pudo cerrar el servidor de la CA para el móvil:', mensajeDe(e));
    });
    await this.lan.apagarTodo().catch((e: unknown) => {
      console.error('No se pudo apagar el acceso por la red local:', mensajeDe(e));
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

/** Servicios de datos con una sola versión activa: los captadores de correo y Ollama. */
function esServicioUnico(s: string): s is IdCaptador | 'ollama' {
  return s === 'ollama' || esIdCaptador(s);
}

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
    ...puertosFijosCaptadores(),
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
