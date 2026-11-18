import type { Readable } from 'node:stream';

export type ResultadoEscritura =
  { ok: true } | { ok: false; motivo: 'cancelado' | 'denegado' | 'error'; detalle?: string };

export interface Plataforma {
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
  matarArbol(pid: number): Promise<void>;
  abrirUrl(url: string): Promise<void>;
  ejecutable(nombre: 'nginx' | 'php-cgi' | 'php' | 'cloudflared'): string;
  /** Carpeta "Documentos" del usuario (puede estar redirigida, p. ej. a OneDrive). */
  carpetaDocumentos(): Promise<string>;
}

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
