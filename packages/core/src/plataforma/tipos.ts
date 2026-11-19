import type { Readable } from 'node:stream';
import type { LanzadorOculto } from './lanzarOculto';

export type ResultadoEscritura =
  { ok: true } | { ok: false; motivo: 'cancelado' | 'denegado' | 'error'; detalle?: string };

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

export interface OpcionesAbrirTerminal {
  /** Variables que se agregan (o reemplazan) al entorno de la terminal; solo en ese proceso. */
  env?: Record<string, string | undefined>;
  /** Programa y argumentos a ejecutar en la terminal (sin shell intermedio cuando se puede). */
  comando?: string[];
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
  /** Ruta de un ejecutable: primero el PATH, luego las carpetas `extras`; null si no está. */
  buscarEjecutable(nombre: string, extras?: string[]): Promise<string | null>;
  /** PATH del usuario; `respaldo` es el archivo donde se guarda el valor original. */
  pathUsuario(o?: { respaldo?: string }): AccesoPathUsuario;
  /** Fija (o borra con null) una variable de entorno persistente del usuario. */
  variableUsuario(nombre: string, valor: string | null): Promise<ResultadoEscritura>;
  /** Abre una terminal VISIBLE en `cwd` (la única ventana que se abre a pedido del usuario). */
  abrirTerminal(cwd: string, o?: OpcionesAbrirTerminal): Promise<void>;
  /** Lanzador de servidores sin ventanas; null si este sistema no lo necesita o no lo tiene. */
  lanzadorOculto(carpetaTmp: string): LanzadorOculto | null;
  /** Descendientes (hijos, nietos…) de cada PID, en una sola consulta. */
  descendientes(pids: number[]): Promise<Map<number, number[]>>;
  /** Rangos de puertos reservados por el sistema (Hyper-V, WSL, Docker). */
  rangosReservados(protocolo: 'tcp'): Promise<RangoPuertos[]>;
  serviciosSistema(nombres: string[]): Promise<ServicioSistema[]>;
  /** ¿Está el redistribuible de Visual C++ 2015+ x64? (siempre true donde no aplica). */
  vcRedistInstalado(): Promise<boolean>;
  /** Carpetas de los perfiles de Firefox del usuario ([] si no hay Firefox). */
  perfilesFirefox(): Promise<string[]>;
}

/**
 * La interfaz que reciben los módulos. Las capacidades nuevas son opcionales para que las
 * implementaciones parciales anteriores sigan valiendo; `completarPlataforma` da una
 * `PlataformaCompleta`, que es lo que deben usar los módulos nuevos.
 */
export interface Plataforma extends Partial<CapacidadesPlataforma> {
  rutaHosts(): string;
  escribirComoAdmin(destino: string, contenido: string): Promise<ResultadoEscritura>;
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
  },
) => Promise<{ codigo: number; stdout: string; stderr: string }>;

export interface OpcionesLanzar {
  cwd?: string;
  /** Variables extra (p. ej. PGPASSWORD) solo para este proceso; nunca se persisten. */
  env?: Record<string, string>;
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
