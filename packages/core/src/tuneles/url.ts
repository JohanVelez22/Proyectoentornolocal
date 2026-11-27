const PATRON = /https:\/\/([a-z0-9-]+)\.trycloudflare\.com/gi;

/** Devuelve la primera URL pública del túnel; ignora el endpoint de API de Cloudflare. */
export function extraerUrlTunel(texto: string): string | null {
  for (const m of texto.matchAll(PATRON)) {
    if (m[1]!.toLowerCase() !== 'api') return m[0];
  }
  return null;
}
