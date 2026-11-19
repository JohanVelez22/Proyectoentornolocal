/**
 * Patrones de secretos que se enmascaran en todo texto que sale del núcleo: registros de
 * recetas y procesos (`sanear`) y resúmenes de errores de proveedores de IA (`sinSecretosIa`).
 * Una sola lista para que nada quede cubierto en un sitio y no en el otro. Sin dependencias.
 */
export const PATRONES_SECRETOS: readonly (readonly [RegExp, string])[] = [
  // Credenciales en URLs: esquema://usuario:clave@host
  [/(:\/\/)[^\s/@:]+:[^\s/@]*@/g, '$1***@'],
  // password=…, PASSWORD=…, DB_PASSWORD=…, --password=…
  [/(password\s*=\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1***'],
  // Clave pegada de mysql: -pclave
  [/(^|\s)-p(?=\S)\S+/g, '$1-p***'],
  // Tokens de GitHub
  [/\bgithub_pat_[A-Za-z0-9_]+/g, 'github_pat_***'],
  [/\b(gh[pousr])_[A-Za-z0-9]+/g, '$1_***'],
  // Claves de IA: OpenAI y compatibles (sk-), Google (AIza), Groq, xAI, Perplexity, Hugging Face
  [/\bsk-[A-Za-z0-9_-]{8,}/g, 'sk-***'],
  [/\bAIza[0-9A-Za-z_-]{20,}/g, 'AIza***'],
  [/\bgsk_[A-Za-z0-9_-]{8,}/g, 'gsk_***'],
  [/\bxai-[A-Za-z0-9_-]{8,}/g, 'xai-***'],
  [/\bpplx-[A-Za-z0-9_-]{8,}/g, 'pplx-***'],
  [/\bhf_[A-Za-z0-9_-]{8,}/g, 'hf_***'],
  // Cabeceras de autenticación
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 ***'],
  [/(x-(?:api|goog-api)-key["']?\s*[:=]\s*["']?)[^\s"',}]+/gi, '$1***'],
  // Claves en la consulta de una URL
  [/([?&](?:key|api_key|apikey|token)=)[^&\s"']+/gi, '$1***'],
  // Líneas de .env o variables: NOMBRE_API_KEY=…, NOMBRE_TOKEN=…, NOMBRE_SECRET=…
  [/(^|\s)([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET)\s*=\s*)\S+/gm, '$1$2***'],
];

/** Aplica todos los patrones de `PATRONES_SECRETOS`. */
export function enmascararSecretos(texto: string): string {
  let t = texto;
  for (const [patron, reemplazo] of PATRONES_SECRETOS) t = t.replace(patron, reemplazo);
  return t;
}
