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
  // Valores de banderas de línea de órdenes: --token X, --authtoken=X, --api-key X, --secret X (también con prefijo: --ngrok-authtoken)
  [
    /((?<![\w-])--(?:[a-z0-9]+[-_])*(?:auth[-_]?token|token|api[-_]?key|secret|password|passwd|authkey)(?:=|[ \t]+))(?!-)("[^"]*"|'[^']*'|\S+)/gi,
    '$1***',
  ],
  // Clave pegada de mysql: -pclave
  // (un puerto pegado, `-p3000`, no: es el de vite, next o php -S)
  [/(^|\s)-p(?!\d{1,5}(?:\s|$))(?=\S)\S+/g, '$1-p***'],
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

/**
 * Nombres de variable de un `.env` cuyo valor es secreto: `*_KEY`, `*_SECRET`, `*_PASSWORD`,
 * `*_PASS`, `*_TOKEN`, `*_PWD`, `APP_KEY`, claves de API y de credenciales, y las de estilo
 * CodeIgniter (`database.default.password`). Se enmascaran aunque el valor no tenga forma de secreto.
 */
export const NOMBRE_VARIABLE_SECRETA =
  /(?:SECRET|PASSWORD|PASSWD|PASS|PWD|TOKEN|API[_-]?KEY|PRIVATE[_-]?KEY|CREDENTIAL)|(?:^|[._])KEY$|_KEY(?:_BASE)?$|^APP_KEY$|(?:^|[._])(?:password|pass|pwd|secret|token)$/i;
