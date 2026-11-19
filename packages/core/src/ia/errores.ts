import { ErrorWolf, type CodigoError, type DatosErrorWolf } from '../errores';
import type { TipoProveedorIa } from './proveedores';

/** Largo máximo del resumen de un cuerpo de error (cabe en `datos` de ErrorWolf). */
const MAX_DETALLE = 200;

/** Patrones de claves de proveedores conocidos (se enmascaran aunque no sean la clave usada). */
const PATRONES_CLAVE: [RegExp, string][] = [
  [/\bsk-[A-Za-z0-9_-]{8,}/g, 'sk-***'],
  [/\bAIza[0-9A-Za-z_-]{20,}/g, 'AIza***'],
  [/\bgsk_[A-Za-z0-9]{8,}/g, 'gsk_***'],
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 ***'],
  [/(x-(?:api|goog-api)-key["']?\s*[:=]\s*["']?)[^\s"',}]+/gi, '$1***'],
  [/([?&](?:key|api_key|apikey|token)=)[^&\s"']+/gi, '$1***'],
  [/(:\/\/)[^\s/@:]+:[^\s/@]*@/g, '$1***@'],
  [/\bgithub_pat_[A-Za-z0-9_]+/g, 'github_pat_***'],
  [/\b(gh[pousr])_[A-Za-z0-9]+/g, '$1_***'],
];

/**
 * Resumen de un texto de un proveedor sin la clave usada (literal) ni nada que parezca una
 * clave, en una línea y cortado a 200 caracteres.
 */
export function sinSecretosIa(texto: string, clave?: string | null): string {
  let t = texto;
  if (clave) t = t.split(clave).join('***');
  for (const [patron, reemplazo] of PATRONES_CLAVE) t = t.replace(patron, reemplazo);
  // Una sola línea: los controles (y cualquier espacio) pasan a ser un espacio.
  t = Array.from(t, (ch) => (ch.charCodeAt(0) < 0x20 || ch.charCodeAt(0) === 0x7f ? ' ' : ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > MAX_DETALLE ? `${t.slice(0, MAX_DETALLE - 1)}…` : t;
}

/** `****` y los 4 últimos caracteres (solo si la clave es lo bastante larga para ocultar el resto). */
export function enmascararClave(clave: string | null | undefined): string {
  if (!clave || clave.length < 8) return '****';
  return `****${clave.slice(-4)}`;
}

/** Los 4 últimos caracteres para la interfaz, o null si la clave es demasiado corta. */
export function finalDeClave(clave: string | null | undefined): string | null {
  if (!clave || clave.length < 8) return null;
  return clave.slice(-4);
}

const MENSAJES: Partial<Record<CodigoError, string>> = {
  'ia.clave_invalida': 'El proveedor rechazó la clave: revísela o genere una nueva.',
  'ia.sin_saldo': 'La cuenta del proveedor no tiene saldo o cuota disponible.',
  'ia.limite': 'El proveedor limitó las peticiones: espere un momento y vuelva a probar.',
  'ia.region': 'El proveedor no da servicio desde su país o región.',
  'ia.sin_red': 'No se pudo conectar con el proveedor: revise la red o la URL base.',
  'ia.url_invalida':
    'La URL base no es válida: use https:// (o http:// solo hacia 127.0.0.1 o localhost), sin usuario ni clave.',
  'ia.plazo': 'El proveedor tardó demasiado en responder.',
  'ia.respuesta_rara': 'El proveedor respondió algo inesperado.',
  'ia.cancelado': 'Se canceló la petición al proveedor.',
  'ia.sin_clave': 'Este proveedor necesita una clave: guárdela primero.',
  'ia.clave_mal_formada': 'La clave no tiene un formato válido (sin espacios ni saltos de línea).',
  'ia.modelo_invalido': 'El nombre del modelo no es válido.',
  'ia.modelo_no_disponible': 'El modelo no existe o su cuenta no tiene acceso a él.',
  'ia.proveedor_invalido': 'La configuración del proveedor no es válida.',
};

/** ErrorWolf de IA con el mensaje en español de respaldo; `datos` nunca lleva la clave. */
export function errorIa(codigo: CodigoError, datos?: DatosErrorWolf, extra?: string): ErrorWolf {
  const base = MENSAJES[codigo] ?? 'Error del proveedor de IA.';
  return new ErrorWolf(codigo, extra ? `${base} ${extra}` : base, datos);
}

const contiene = (t: string, ...partes: string[]): boolean => partes.some((p) => t.includes(p));

/**
 * Traduce el estado HTTP y el cuerpo de error de un proveedor a un código estable. El cuerpo
 * solo se mira en minúsculas para buscar señales conocidas; nunca se devuelve.
 */
export function clasificarErrorIa(
  status: number,
  cuerpo: string,
  tipo: TipoProveedorIa,
): CodigoError {
  const t = cuerpo.toLowerCase();
  const region = contiene(
    t,
    'unsupported_country',
    'country, region, or territory',
    'user location is not supported',
    'not available in your country',
    'not available in your region',
  );
  const saldo = contiene(
    t,
    'insufficient_quota',
    'credit balance is too low',
    'insufficient credits',
    'insufficient_credits',
    'insufficient balance',
    'billing',
    'payment required',
  );
  const clave = contiene(
    t,
    'api_key_invalid',
    'api key not valid',
    'invalid api key',
    'invalid_api_key',
    'incorrect api key',
    'invalid x-api-key',
    'authentication_error',
  );
  const modelo =
    contiene(t, 'model_not_found', 'not_found_error') ||
    (t.includes('model') && contiene(t, 'not found', 'does not exist', 'no access'));

  if (region) return 'ia.region';
  if (status === 402 || saldo) return 'ia.sin_saldo';
  if (status === 401 || clave) return 'ia.clave_invalida';
  if (status === 403) return 'ia.clave_invalida';
  if (status === 429) return 'ia.limite';
  // Anthropic responde 529 cuando está sobrecargado.
  if (tipo === 'anthropic' && status === 529) return 'ia.limite';
  if (status === 404) return modelo ? 'ia.modelo_no_disponible' : 'ia.url_invalida';
  if (status === 400 && modelo) return 'ia.modelo_no_disponible';
  return 'ia.respuesta_rara';
}
