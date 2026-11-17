export type ResultadoEscritura =
  { ok: true } | { ok: false; motivo: 'cancelado' | 'denegado' | 'error'; detalle?: string };

export interface Plataforma {
  rutaHosts(): string;
  escribirComoAdmin(destino: string, contenido: string): Promise<ResultadoEscritura>;
  quienUsaPuerto(puerto: number): Promise<{ pid: number; nombre: string } | null>;
  procesoVivo(pid: number): Promise<{ vivo: boolean; ejecutable?: string }>;
  matarArbol(pid: number): Promise<void>;
  abrirUrl(url: string): Promise<void>;
  ejecutable(nombre: 'nginx' | 'php-cgi' | 'php' | 'cloudflared'): string;
}

export type Ejecutor = (
  cmd: string,
  args: string[],
  opts?: { timeoutMs?: number; cwd?: string },
) => Promise<{ codigo: number; stdout: string; stderr: string }>;
