export type ResultadoEscritura =
  { ok: true } | { ok: false; motivo: 'cancelado' | 'denegado' | 'error'; detalle?: string };

export interface Plataforma {
  rutaHosts(): string;
  escribirComoAdmin(destino: string, contenido: string): Promise<ResultadoEscritura>;
  quienUsaPuerto(puerto: number): Promise<{ pid: number; nombre: string } | null>;
  /** Dueños de varios puertos en una sola consulta; los libres no aparecen en el mapa. */
  duenosDePuertos(puertos: number[]): Promise<Map<number, { pid: number; nombre: string }>>;
  procesoVivo(pid: number): Promise<{ vivo: boolean; ejecutable?: string }>;
  matarArbol(pid: number): Promise<void>;
  abrirUrl(url: string): Promise<void>;
  ejecutable(nombre: 'nginx' | 'php-cgi' | 'php' | 'cloudflared'): string;
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
