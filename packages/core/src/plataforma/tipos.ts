import type { PerfilRed, ReglasEntrada } from './firewallWin';
import type { Readable } from 'node:stream';
import type { LanzadorOculto } from './lanzarOculto';

export type ResultadoEscritura =
  | { ok: true }
  | { ok: false; motivo: 'cancelado' | 'denegado' | 'error' | 'tiempo'; detalle?: string };

/** Opciones de una escritura elevada (UAC). */
export interface OpcionesEscrituraAdmin {
  /** Plazo para que el usuario conteste el UAC; al vencer se corta y no se escribe nada. */
  tiempoLimiteMs?: number;
  /**
   * SHA-256 (hex) del destino tal como se leyó al calcular `contenido` (`NINGUNO` si no existía):
   * si cambió mientras se esperaba el permiso, no se copia.
   */
  hashPrevio?: string;
  /**
   * Hora (Unix, ms) en que quien pide la escritura deja de esperarla. Si la escritura sigue en la
   * cola de elevaciones a esa hora, da `tiempo` sin abrir ningún UAC; si empieza antes, el plazo
   * del UAC se recorta para no pasarla.
   */
  vencimientoUnixMs?: number;
}

/** Sistema y arquitectura de los binarios del catálogo. */
export type IdCatalogo =
  'win-x64' | 'win-arm64' | 'linux-x64' | 'linux-arm64' | 'mac-x64' | 'mac-arm64';

/**
 * PATH del usuario (en Windows, HKCU\Environment\Path), como lista de entradas no vacías.
 * `escribir` guarda antes el valor anterior (el ORIGINAL, la primera vez) y comprueba lo escrito.
 */
export interface AccesoPathUsuario {
  leer(): Promise<string[]>;
  escribir(entradas: string[]): Promise<void>;
  /** Valor crudo y su tipo, si el sistema lo distingue (diagnóstico y pruebas). */
  valorCrudo?(): Promise<{ valor: string; tipo: string }>;
}

/**
 * Terminales que WolfCore Dev sabe abrir. Windows: Windows Terminal, PowerShell 5, PowerShell 7
 * (pwsh), Símbolo del sistema y Git Bash. Linux y macOS: la terminal del sistema y algunas
 * conocidas (las usa la plataforma de esos sistemas desde la Etapa E).
 */
export const IDS_TERMINAL = [
  'windows-terminal',
  'powershell',
  'pwsh',
  'cmd',
  'git-bash',
  'sistema',
  'gnome-terminal',
  'konsole',
  'iterm',
] as const;
export type IdTerminal = (typeof IDS_TERMINAL)[number];

/** Una terminal instalada en este equipo. */
export interface TerminalDisponible {
  id: IdTerminal;
  /** Nombre para mostrar (marca del programa; no se traduce). */
  nombre: string;
  ruta: string;
}

/** Editores de código que WolfCore Dev sabe detectar y abrir. */
export const IDS_EDITOR = [
  'vscode',
  'cursor',
  'windsurf',
  'phpstorm',
  'sublime',
  'zed',
  'notepadpp',
] as const;
export type IdEditor = (typeof IDS_EDITOR)[number];

/** Un editor instalado en este equipo. */
export interface EditorDisponible {
  id: IdEditor;
  /** Nombre para mostrar (marca del programa; no se traduce). */
  nombre: string;
  ruta: string;
}

export interface OpcionesAbrirTerminal {
  /** Variables que se agregan (o reemplazan) al entorno de la terminal; solo en ese proceso. */
  env?: Record<string, string | undefined>;
  /** Programa y argumentos a ejecutar en la terminal (sin shell intermedio cuando se puede). */
  comando?: string[];
  /** Terminal elegida; sin ella, la predeterminada del sistema (PowerShell en Windows). */
  terminal?: IdTerminal | null;
}

export interface RangoPuertos {
  desde: number;
  hasta: number;
}

export type EstadoServicioSistema = 'corriendo' | 'detenido' | 'otro' | 'no-existe';

export interface ServicioSistema {
  nombre: string;
  estado: EstadoServicioSistema;
}

/** Perfil de Firefox de `profiles.ini`. */
export interface PerfilFirefoxSistema {
  ruta: string;
  /** Ruta absoluta fuera de la carpeta de Firefox: no se toca sin una confirmación aparte. */
  fuera: boolean;
}

/** Estado del antivirus del sistema respecto de una carpeta (solo se lee; nunca se cambia). */
export interface EstadoAntivirus {
  /** ¿Está activa la protección en tiempo real? */
  activo: boolean;
  /** ¿La carpeta está excluida? null si no se pudo saber (p. ej. hace falta administrador). */
  excluida: boolean | null;
}

/**
 * Comandos que el usuario corre él mismo en una consola de administrador: el Doctor solo los
 * muestra (cambiar la red o la seguridad del equipo lo decide el usuario).
 */
export type ComandoManual =
  | { tipo: 'liberar-rangos' }
  | { tipo: 'exclusion-antivirus'; carpeta: string }
  | { tipo: 'quitar-solo-lectura-hosts' }
  | { tipo: 'detener-servicio'; nombre: string }
  | { tipo: 'instalar-vcredist' }
  | { tipo: 'instalar-build-tools' }
  /** Permitir la entrada TCP de un sitio compartido en la red local (solo redes privadas). */
  | {
      tipo: 'regla-firewall-lan';
      puerto: number;
      /** Ruta del programa que recibe la conexión (nginx.exe); sin ella, solo el puerto. */
      programa?: string;
    }
  /** Quitar reglas de entrada por su `Name` (las que lista el Doctor); nunca se ejecuta solo. */
  | { tipo: 'quitar-reglas-firewall'; nombres: string[] };

/**
 * Lo que la Etapa C agregó a la interfaz. Todo lo que depende del sistema operativo pasa por
 * aquí: fuera de `plataforma/` ningún módulo usa `process.platform`, `path.win32`, PowerShell,
 * `netsh` ni nombres `.exe` (lo comprueba una prueba guardián).
 */
export interface CapacidadesPlataforma {
  /** Carpeta de datos por defecto de WolfCore Dev. */
  carpetaDatos(): string;
  /** Carpeta personal del usuario (`~/.claude`, `~/.codex`, perfiles de Firefox…). */
  carpetaInicio(): string;
  idCatalogo(): IdCatalogo;
  /** Nombre del archivo ejecutable (`php` → `php.exe` en Windows). */
  nombreEjecutable(base: string): string;
  /**
   * Prefijos de `npm install -g` del usuario (en Windows, la carpeta `npm` dentro de
   * `%APPDATA%`): donde buscar agentes instalados con su propio npm. Solo se leen.
   */
  carpetasNpmGlobal(): string[];
  /**
   * Carpetas donde el instalador oficial deja la CLI de Docker o Podman en este sistema (se
   * prueban antes que el PATH). En Windows, para Docker Desktop, primero la de
   * `HKLM\SOFTWARE\Docker Inc.\Docker\1.0` (AppPath). Solo lee; no ejecuta la CLI.
   */
  carpetasContenedores(motor: 'docker' | 'podman'): Promise<string[]>;
  /** Ruta de un ejecutable: primero el PATH, luego las carpetas `extras`; null si no está. */
  buscarEjecutable(nombre: string, extras?: string[]): Promise<string | null>;
  /** PATH del usuario; `respaldo` es el archivo donde se guarda el valor original. */
  pathUsuario(o?: { respaldo?: string }): AccesoPathUsuario;
  /**
   * Valor guardado de una variable persistente del usuario (en Windows, HKCU\Environment, sin
   * expandir), o null si no existe. Lanza si no se pudo leer.
   */
  leerVariableUsuario(nombre: string): Promise<string | null>;
  /** Fija (o borra con null) una variable de entorno persistente del usuario. */
  variableUsuario(nombre: string, valor: string | null): Promise<ResultadoEscritura>;
  /** Abre una terminal VISIBLE en `cwd` (la única ventana que se abre a pedido del usuario). */
  abrirTerminal(cwd: string, o?: OpcionesAbrirTerminal): Promise<void>;
  /** Terminales instaladas que `abrirTerminal` sabe abrir (sin ejecutar nada). */
  terminalesInstaladas(): Promise<TerminalDisponible[]>;
  /** Editores instalados (por PATH y rutas conocidas; solo mira archivos, no ejecuta nada). */
  editoresInstalados(): Promise<EditorDisponible[]>;
  /** Lanzador de servidores sin ventanas; null si este sistema no lo necesita o no lo tiene. */
  lanzadorOculto(carpetaTmp: string): LanzadorOculto | null;
  /** Descendientes (hijos, nietos…) de cada PID, en una sola consulta. */
  descendientes(pids: number[]): Promise<Map<number, number[]>>;
  /** Rangos de puertos reservados por el sistema (Hyper-V, WSL, Docker). */
  rangosReservados(protocolo: 'tcp'): Promise<RangoPuertos[]>;
  serviciosSistema(nombres: string[]): Promise<ServicioSistema[]>;
  /** ¿Está el redistribuible de Visual C++ 2015+ x64? (siempre true donde no aplica). */
  vcRedistInstalado(): Promise<boolean>;
  /**
   * ¿Está el enlazador de C++ para x64 (Visual Studio Build Tools con las herramientas de C++)?
   * Rust con el toolchain MSVC lo necesita para enlazar (siempre true donde no aplica).
   */
  enlazadorMsvc(): Promise<boolean>;
  /**
   * rustup-init puede dejar una entrada de desinstalación en el registro del usuario. Si su
   * `UninstallString` apunta dentro de `carpetaDatos` se borra (`quitada`); si apunta a otro lado
   * (una instalación propia del usuario) no se toca (`ajena`); sin entrada, `ausente`.
   */
  limpiarEntradaRustup(carpetaDatos: string): Promise<'ausente' | 'quitada' | 'ajena'>;
  /** Perfiles de Firefox del usuario ([] si no hay Firefox); sin rutas de red ni con `..`. */
  perfilesFirefox(): Promise<PerfilFirefoxSistema[]>;
  /** ¿Firefox tiene abierto ese perfil? (su archivo de bloqueo está tomado). */
  firefoxEnUso(perfil: string): Promise<boolean>;
  /**
   * Raíces de confianza del sistema en PEM (para el bundle de Python cuando el proyecto no trae
   * `certifi`). Lanza si no se pudieron leer.
   */
  raicesSistema(): Promise<string>;
  /**
   * Detiene un servicio del sistema (p. ej. W3SVC de IIS) con elevación; nunca lo deshabilita. Si
   * otros servicios en marcha dependen de él, no detiene nada (error con el motivo).
   */
  detenerServicioSistema(nombre: string): Promise<ResultadoEscritura>;
  /** Quita el atributo de solo lectura del hosts del sistema, con elevación. */
  quitarSoloLecturaHosts(): Promise<ResultadoEscritura>;
  /** Instala el redistribuible de Visual C++ 2015+ x64 (el instalador pide su propio permiso). */
  instalarVcRedist(): Promise<ResultadoEscritura>;
  /** Estado del antivirus para `carpeta`; null si no hay o no se pudo leer. */
  antivirus(carpeta: string): Promise<EstadoAntivirus | null>;
  /** Texto del comando para la consola de administrador (no se ejecuta). */
  comandoManual(c: ComandoManual): string;
  /**
   * Deja el archivo legible solo por el usuario actual (en Windows, `icacls` sin herencia y con
   * control total para el usuario; en Unix basta el modo 600 al crearlo). false si no se pudo:
   * quien llama decide si sigue (la carpeta de datos ya es del usuario).
   */
  restringirAlUsuario(ruta: string, o?: { carpeta?: boolean }): Promise<boolean>;
  /**
   * ¿El dueño de la ruta es el usuario actual (por SID en Windows)? Una carpeta ajena puede ser
   * cambiada por su dueño aunque la ACL diga otra cosa. Sin poder comprobarlo, false.
   */
  duenoEsUsuario(ruta: string): Promise<boolean>;
  // Con `carpeta: true` el permiso se hereda a lo que se cree dentro (`(OI)(CI)` en Windows).
  /**
   * Instalaciones de Laragon, XAMPP y Herd en sus rutas conocidas (solo comprueba que la carpeta
   * exista: no lee ni ejecuta nada). Para importar sus sitios y bases.
   */
  instalacionesAjenas(): Promise<InstalacionAjena[]>;
  /**
   * El CLI de Tailscale ya instalado en el equipo (WolfCore Dev nunca lo instala: es un servicio
   * del sistema) y si tiene sesión iniciada (`BackendState` en marcha). Solo lee: no cambia nada.
   */
  tailscale(): Promise<{ ruta: string | null; sesion: boolean }>;
  /**
   * Perfil de la red (privada, pública o de dominio) de la interfaz que tiene esa IP; null si no
   * se pudo leer. Solo lee.
   */
  perfilRedDe(ip: string): Promise<PerfilRed | null>;
  /** Reglas de entrada Allow para nginx, PHP, MySQL y PostgreSQL. Solo lee. */
  reglasEntradaPermitidas(): Promise<ReglasEntrada>;
  /**
   * Ruta de `soffice` si LibreOffice YA está instalado (WolfCore Dev nunca lo instala ni lo
   * descarga); null si no. Solo mira archivos: no ejecuta nada.
   */
  libreOffice(): Promise<string | null>;
  /**
   * ¿Puede la app capturar la pantalla en este sistema? `permiso` es el del sistema para grabar
   * la pantalla: `no_aplica` donde no existe (Windows), `concedido`, `denegado` o `pendiente`
   * (macOS aún no lo ha pedido). Solo consulta: nunca captura ni muestra diálogos.
   */
  capturaDisponible(): Promise<EstadoCaptura>;
  /**
   * Procesos del usuario y la sesión actuales (nunca los del sistema, de servicios ni de otros
   * usuarios si la plataforma puede distinguirlos). Solo LEE: es el insumo del optimizador de RAM
   * (D36), que además vuelve a filtrar y a comprobar cada proceso antes de tocarlo.
   */
  procesosDelUsuario(): Promise<ProcesoUsuario[]>;
  /**
   * Pide al proceso `pid` que cierre su ventana principal, como al pulsar la X (cierre amable: el
   * programa puede preguntar si guarda). Nunca termina ni mata el proceso ni actúa por nombre.
   * `inicio` (hora de creación) y `ruta` (ejecutable) son lo que el optimizador vio al listarlo:
   * se comprueban dentro de la misma operación, justo antes de pedir el cierre, para no cerrar
   * otro programa que heredó el PID.
   */
  cerrarVentanaPrincipal(pid: number, inicio: string, ruta: string): Promise<EstadoCierre>;
  /**
   * Consulta puntual de un PID: su hora de inicio (la misma forma que `ProcesoUsuario.inicio`) o
   * `null` si no existe. Falla si no se puede consultar: quien llama no afirma nada.
   */
  inicioDeProceso(pid: number): Promise<string | null>;
  /**
   * Conexiones TCP establecidas ahora mismo (para no detener un servicio que alguien está usando).
   * Falla si no se pueden leer: quien llama debe tratar eso como "no se sabe" y no actuar.
   */
  conexionesActivas(): Promise<ConexionActiva[]>;
  /** Usuario (identificador estable) y sesión del proceso actual. */
  identidadActual(): Promise<IdentidadUsuario>;
  /**
   * Carpetas del sistema cuyos programas nunca se proponen para cerrar (la de Windows, la del
   * antivirus integrado…). Solo lee el entorno.
   */
  rutasProtegidas(): string[];
  /**
   * Rutas que la limpieza de disco (D37) puede tocar, por categoría. Es la ÚNICA lista de la que
   * sale lo que se borra: el núcleo no sale de ella. `carpetaDatos` es la activa (la de
   * `WOLFCORE_DATOS` o la de siempre) y de ella salen solo `wolfcore-descargas` y
   * `wolfcore-registros`. En las cachés de navegador solo vienen las carpetas `Cache`,
   * `Code Cache`, `GPUCache` y `cache2` que existen en cada perfil. Solo lee.
   */
  rutasLimpieza(carpetaDatos: string): Promise<RutasCategoriaLimpieza[]>;
  /**
   * Navegadores con algún proceso abierto del usuario. FALLA si no se puede saber: quien llama
   * trata un fallo como "todos abiertos" (nunca se limpia a ciegas).
   */
  navegadoresAbiertos(): Promise<NavegadorLimpieza[]>;
  /** ¿Se ejecuta con permisos de administrador? Solo consulta; nunca pide elevación. */
  esAdministrador(): Promise<boolean>;
  /**
   * Manda un archivo a la papelera del sistema. La papelera la pone la app (en Electron,
   * `shell.trashItem` desde main) con `registrarPapelera`. Devuelve false si no hay papelera o
   * no se pudo: en ese caso quien llama NO borra el archivo.
   */
  aPapelera(ruta: string): Promise<boolean>;
  /** La app inyecta aquí cómo se manda algo a la papelera. */
  registrarPapelera(enviar: (ruta: string) => Promise<void>): void;
}

export type CategoriaLimpieza =
  | 'temp'
  | 'cache-chrome'
  | 'cache-edge'
  | 'cache-brave'
  | 'cache-firefox'
  | 'wolfcore-descargas'
  | 'wolfcore-registros'
  | 'prefetch';

export type NavegadorLimpieza = 'chrome' | 'edge' | 'brave' | 'firefox';

export interface RutasCategoriaLimpieza {
  categoria: CategoriaLimpieza;
  rutas: string[];
  /** true si limpiarla exige ejecutar como administrador (Prefetch). */
  requiereAdmin: boolean;
  navegador?: NavegadorLimpieza;
  /**
   * La plataforma no se fía de la ruta (TEMP apunta a Documentos, a una raíz de unidad, a una
   * ruta UNC…): la categoría sale bloqueada y `rutas` viene vacía.
   */
  bloqueo?: 'temp-no-seguro';
}

/** Un proceso del usuario tal como lo da `Plataforma.procesosDelUsuario()` (D36). */
export interface ProcesoUsuario {
  pid: number;
  nombre: string;
  /** Ruta completa del ejecutable; null si no se pudo leer (entonces se trata como protegido). */
  ruta: string | null;
  /** Hora de creación (texto opaco: se compara por igualdad); distingue un PID reutilizado. */
  inicio: string | null;
  /** Memoria de trabajo en bytes. */
  memoria: number;
  /** ¿Tiene una ventana principal visible que se pueda cerrar? */
  ventana: boolean;
  sesion: number;
  /** Identificador del dueño (el SID en Windows). */
  usuario: string;
  /** true si es un servicio del sistema (la plataforma lo sabe; el optimizador lo protege). */
  servicio?: boolean;
  /**
   * true si la plataforma no pudo abrir el proceso (típico de uno elevado, de mayor integridad):
   * no se puede ni inspeccionar ni cerrarle la ventana, así que se protege.
   */
  elevado?: boolean;
}

/** Resultado de `cerrarVentanaPrincipal`. */
export type EstadoCierre = 'cerrado-pedido' | 'cambio' | 'sin-ventana' | 'no-se-pudo';

/** Una conexión TCP establecida (`netstat -ano`): puertos de cada extremo y PID que la tiene. */
export interface ConexionActiva {
  puertoLocal: number;
  puertoRemoto: number;
  pid: number;
}

export interface IdentidadUsuario {
  usuario: string;
  sesion: number;
}

/** Resultado de `Plataforma.capturaDisponible()` (D35). */
export interface EstadoCaptura {
  disponible: boolean;
  permiso: 'no_aplica' | 'concedido' | 'denegado' | 'pendiente';
}

/**
 * La interfaz que reciben los módulos. Las capacidades nuevas son opcionales para que las
 * implementaciones parciales anteriores sigan valiendo; `completarPlataforma` da una
 * `PlataformaCompleta`, que es lo que deben usar los módulos nuevos.
 */
/** Un programa de desarrollo local ajeno y la carpeta donde está instalado o configurado. */
export interface InstalacionAjena {
  programa: 'laragon' | 'xampp' | 'herd';
  raiz: string;
}

export interface Plataforma extends Partial<CapacidadesPlataforma> {
  rutaHosts(): string;
  escribirComoAdmin(
    destino: string,
    contenido: string,
    o?: OpcionesEscrituraAdmin,
  ): Promise<ResultadoEscritura>;
  /** Corta las escrituras elevadas en curso (UAC abierto) al cerrar la app. */
  cancelarEscriturasAdmin?(): void;
  /** Borra los temporales de escrituras elevadas de ejecuciones anteriores. */
  limpiarTemporalesAdmin?(): Promise<void>;
  quienUsaPuerto(puerto: number): Promise<{ pid: number; nombre: string } | null>;
  /** Dueños de varios puertos en una sola consulta; los libres no aparecen en el mapa. */
  duenosDePuertos(puertos: number[]): Promise<Map<number, { pid: number; nombre: string }>>;
  /** Agrega el .crt al almacén de certificados raíz del USUARIO (Windows pide confirmación). */
  instalarCertificadoUsuario(rutaCrt: string): Promise<ResultadoEscritura>;
  quitarCertificadoUsuario(huella: string): Promise<ResultadoEscritura>;
  /** ¿Está en el almacén raíz del usuario el certificado con esa huella SHA-1? */
  certificadoInstalado(huella: string): Promise<boolean>;
  procesoVivo(pid: number): Promise<{ vivo: boolean; ejecutable?: string }>;
  /**
   * Hora de creación del proceso (texto opaco: se compara por igualdad), o null si no existe o no
   * se pudo leer. Distingue un PID reutilizado por otro proceso con el mismo ejecutable.
   */
  inicioProceso?(pid: number): Promise<string | null>;
  /**
   * Ruta absoluta del ejecutable del proceso, o null si no existe o no se pudo leer. Sirve para
   * reconocer un proceso propio (dentro de la carpeta de datos) sin fiarse solo del nombre.
   */
  rutaProceso?(pid: number): Promise<string | null>;
  matarArbol(pid: number): Promise<void>;
  abrirUrl(url: string): Promise<void>;
  ejecutable(nombre: 'nginx' | 'php-cgi' | 'php' | 'cloudflared'): string;
  /** Carpeta "Documentos" del usuario (puede estar redirigida, p. ej. a OneDrive). */
  carpetaDocumentos(): Promise<string>;
}

export type PlataformaCompleta = Plataforma & CapacidadesPlataforma;

export type Ejecutor = (
  cmd: string,
  args: string[],
  opts?: {
    timeoutMs?: number;
    cwd?: string;
    /** Variables extra (p. ej. PGPASSWORD) solo para esta llamada; nunca se persisten. */
    env?: Record<string, string>;
    /** Texto que se escribe en la entrada estándar del proceso. */
    entrada?: string;
    /** Prefijos de variables heredadas que NO se pasan al proceso (se quitan antes de `env`). */
    quitarEntorno?: readonly string[];
    /** Al abortarse, se mata el proceso (p. ej. la PowerShell que espera un UAC al cerrar). */
    senal?: AbortSignal;
  },
) => Promise<{ codigo: number; stdout: string; stderr: string }>;

export interface OpcionesLanzar {
  cwd?: string;
  /** Variables extra (p. ej. PGPASSWORD) solo para este proceso; nunca se persisten. */
  env?: Record<string, string>;
  /** Prefijos de variables heredadas que NO se pasan al proceso (se quitan antes de `env`). */
  quitarEntorno?: readonly string[];
  /** Flujo que se copia a la entrada estándar respetando la contrapresión (archivos grandes). */
  entrada?: Readable;
  /** Cada línea de salida, a medida que llega (sin el salto). */
  alLinea?: (linea: string, flujo: 'stdout' | 'stderr') => void;
  /**
   * Corta también en `\r` (progreso que reescribe la línea, como el de git): cada tramo llega en
   * vivo y se omiten los tramos vacíos. Por defecto solo se corta en `\n`.
   */
  cortarEnRetorno?: boolean;
  /**
   * Al abortarse mata el proceso y su árbol de hijos (taskkill /T en Windows). Si ya estaba
   * abortada, no se lanza nada y la promesa se rechaza con "Cancelado".
   */
  senal?: AbortSignal;
  /**
   * En sistemas POSIX lanza el proceso como líder de su propio grupo y, al abortar, mata el grupo
   * entero (`kill(-pid)`): nada de lo que lanzó sobrevive. Solo para quien lo pide (las tareas
   * programadas): un proceso desprendido no muere si la app se cierra sin abortar. En Windows no
   * cambia nada (`taskkill /T` ya mata el árbol del PID).
   */
  matarGrupo?: boolean;
  /**
   * Plazo (ms) para que el lanzamiento termine una vez que el proceso salió o se abortó. Si un
   * nieto sigue con la salida heredada abierta, `close` no llega nunca: pasado el plazo se destruyen
   * stdout y stderr y se resuelve con el código que haya (1 si se abortó). Sin él, como siempre.
   */
  graciaMs?: number;
}

/** Como `Ejecutor`, pero en streaming: no junta la salida en memoria. */
export type Lanzador = (
  cmd: string,
  args: string[],
  opts?: OpcionesLanzar,
) => Promise<{ codigo: number }>;

/** Uso de un proceso tal como lo da el sistema (CPU sin normalizar: 100 = un núcleo lógico). */
export interface UsoProceso {
  pid: number;
  cpu: number;
  ramBytes: number;
  uptimeS: number;
}

/** Lo que se lee del sistema en una sola consulta por muestra (métricas). */
export interface MuestraPlataforma {
  procesos: UsoProceso[];
  /** Bytes acumulados recibidos y enviados por todos los adaptadores; null si no se pudo leer. */
  red: { rx: number; tx: number } | null;
}
