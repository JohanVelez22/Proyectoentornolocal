import { z } from 'zod';
import { esErrorWolf, type CodigoError, type DatosErrorWolf } from '../errores';
import { clienteAnthropic } from './clienteAnthropic';
import { clienteGemini } from './clienteGemini';
import { clienteOpenAi } from './clienteOpenAi';
import { errorIa } from './errores';
import { PLAZO_IA_MS, type FetchIa } from './http';
import { clienteIaOllama } from './ollama';

export const TIPOS_PROVEEDOR_IA = [
  'ollama',
  'hermes',
  'gemini',
  'openai',
  'anthropic',
  'compatible',
] as const;
export type TipoProveedorIa = (typeof TIPOS_PROVEEDOR_IA)[number];

/**
 * Configuración NO secreta de un proveedor (va en config.json). La clave vive solo en el
 * almacén de secretos del proceso principal, con el id `ia:<id>`.
 */
export interface ConfigProveedorIa {
  id: string;
  tipo: TipoProveedorIa;
  nombre: string;
  /** null = la URL por defecto del tipo (un `compatible` siempre necesita una). */
  urlBase: string | null;
  /** Modelo por defecto (para el .env, los agentes y el mensaje de prueba). */
  modelo: string | null;
}

/** URL base de cada tipo cuando `urlBase` es null. */
export const URL_BASE_POR_DEFECTO: Record<TipoProveedorIa, string | null> = {
  ollama: 'http://127.0.0.1:11434',
  hermes: 'https://inference-api.nousresearch.com/v1',
  gemini: 'https://generativelanguage.googleapis.com',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  compatible: null,
};

/** Proveedores compatibles con OpenAI que se ofrecen ya rellenos (la URL se puede cambiar). */
export const PRESETS_COMPATIBLES: readonly { nombre: string; urlBase: string }[] = [
  { nombre: 'OpenRouter', urlBase: 'https://openrouter.ai/api/v1' },
  { nombre: 'Groq', urlBase: 'https://api.groq.com/openai/v1' },
  { nombre: 'Mistral', urlBase: 'https://api.mistral.ai/v1' },
  { nombre: 'DeepSeek', urlBase: 'https://api.deepseek.com/v1' },
  { nombre: 'LM Studio', urlBase: 'http://127.0.0.1:1234/v1' },
];

/** Tipos que no funcionan sin clave (Ollama y los compatibles locales sí). */
export const TIPOS_CON_CLAVE: ReadonlySet<TipoProveedorIa> = new Set([
  'hermes',
  'gemini',
  'openai',
  'anthropic',
]);

export const ID_PROVEEDOR_IA = /^[a-z0-9][a-z0-9-]{0,39}$/;
/** Nombres de modelo: los de OpenRouter llevan `/` y `:` (`meta-llama/llama-3:free`). */
const NOMBRE_MODELO = /^[A-Za-z0-9][A-Za-z0-9._:@/+-]{0,199}$/;

// Solo IPs de bucle local: `localhost` puede apuntar a otro sitio (archivo hosts, proxies).
const HOSTS_LOCALES = new Set(['127.0.0.1', '[::1]']);

/**
 * Valida una URL base: `https://`, o `http://` solo hacia 127.0.0.1 o [::1] (LM Studio,
 * Ollama). Sin usuario ni clave, sin consulta ni fragmento. El error nunca repite la URL.
 */
export function validarUrlBase(url: string): void {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw errorIa('ia.url_invalida');
  }
  const local = HOSTS_LOCALES.has(u.hostname.toLowerCase());
  if (
    (u.protocol !== 'https:' && !(u.protocol === 'http:' && local)) ||
    u.username !== '' ||
    u.password !== '' ||
    u.search !== '' ||
    u.hash !== '' ||
    url.includes('@') ||
    /[\s\\]/.test(url)
  ) {
    throw errorIa('ia.url_invalida');
  }
}

/** URL base efectiva (sin barra final), ya validada. */
export function urlBaseDe(c: ConfigProveedorIa): string {
  const url = c.urlBase ?? URL_BASE_POR_DEFECTO[c.tipo];
  if (!url) throw errorIa('ia.url_invalida');
  validarUrlBase(url);
  return url.replace(/\/+$/, '');
}

export function validarModeloIa(modelo: string): void {
  if (typeof modelo !== 'string' || !NOMBRE_MODELO.test(modelo) || modelo.includes('..')) {
    throw errorIa('ia.modelo_invalido');
  }
}

export const ConfigProveedorIaSchema = z
  .object({
    id: z.string().regex(ID_PROVEEDOR_IA),
    tipo: z.enum(TIPOS_PROVEEDOR_IA),
    nombre: z.string().trim().min(1).max(60),
    urlBase: z.string().max(500).nullable().default(null),
    modelo: z.string().max(200).nullable().default(null),
  })
  .refine((c) => {
    try {
      urlBaseDe(c);
      if (c.modelo !== null) validarModeloIa(c.modelo);
      return true;
    } catch {
      return false;
    }
  });

/**
 * `ia` de config.json. Un proveedor inválido (tipo desconocido, id o URL base no válidos) se
 * descarta sin perder los demás ni el resto de la configuración; los campos de más (como una
 * clave pegada por error) se quitan y el proveedor se conserva sin ellos.
 */
export const ConfigIaSchema = z
  .object({
    proveedores: z
      .array(z.unknown())
      .catch([])
      .default([])
      .transform((lista) => {
        const vistos = new Set<string>();
        const salida: ConfigProveedorIa[] = [];
        for (const x of lista) {
          const r = ConfigProveedorIaSchema.safeParse(x);
          if (r.success && !vistos.has(r.data.id)) {
            vistos.add(r.data.id);
            salida.push(r.data);
          }
        }
        return salida;
      }),
  })
  .catch({ proveedores: [] })
  .prefault({});

export interface ModeloIa {
  id: string;
  nombre: string;
}

export interface RespuestaMensajeIa {
  texto: string;
  tokens?: { entrada: number; salida: number };
}

export interface ClienteIa {
  /** Lista los modelos (no gasta tokens). */
  modelos(clave: string | null, o?: { senal?: AbortSignal }): Promise<ModeloIa[]>;
  /** Un mensaje corto; `maxTokens` acota la respuesta (16 por defecto). */
  mensaje(
    clave: string | null,
    modelo: string,
    texto: string,
    o?: { maxTokens?: number; senal?: AbortSignal },
  ): Promise<RespuestaMensajeIa>;
}

export interface OpcionesClienteIa {
  /** Plazo de cada petición (20 s por defecto). */
  plazoMs?: number;
}

/** Tope de la respuesta de un mensaje de prueba. */
export const MAX_TOKENS_PRUEBA = 16;

/** Lo que cada familia necesita para armar sus peticiones. */
export interface ContextoCliente {
  tipo: TipoProveedorIa;
  base: string;
  fetchImpl: FetchIa;
  plazoMs: number;
  /** Comprueba la clave (y si el tipo la exige) antes de ponerla en una cabecera. */
  exigirClave(clave: string | null): string | null;
  maxTokens(o?: { maxTokens?: number }): number;
}

/** Crea el cliente de la familia del proveedor. Valida la URL base al crearlo. */
export function crearClienteIa(
  c: ConfigProveedorIa,
  fetchImpl?: FetchIa,
  o: OpcionesClienteIa = {},
): ClienteIa {
  if (!(TIPOS_PROVEEDOR_IA as readonly string[]).includes(c.tipo)) {
    throw errorIa('ia.proveedor_invalido');
  }
  const ctx: ContextoCliente = {
    tipo: c.tipo,
    base: urlBaseDe(c),
    fetchImpl: fetchImpl ?? ((u, i) => fetch(u, i)),
    plazoMs: o.plazoMs ?? PLAZO_IA_MS,
    exigirClave(clave) {
      if (clave === null || clave === '') {
        if (TIPOS_CON_CLAVE.has(c.tipo)) throw errorIa('ia.sin_clave');
        return null;
      }
      if (!/^[\x21-\x7e]{1,4096}$/.test(clave)) throw errorIa('ia.clave_mal_formada');
      return clave;
    },
    maxTokens(op) {
      const n = op?.maxTokens ?? MAX_TOKENS_PRUEBA;
      return Number.isInteger(n) && n >= 1 ? Math.min(n, 4096) : MAX_TOKENS_PRUEBA;
    },
  };
  switch (c.tipo) {
    case 'anthropic':
      return clienteAnthropic(ctx);
    case 'gemini':
      return clienteGemini(ctx);
    case 'ollama':
      return clienteIaOllama(ctx);
    default:
      return clienteOpenAi(ctx);
  }
}

export interface ResultadoPruebaIa {
  ok: boolean;
  latenciaMs: number;
  modelos: ModeloIa[];
  error?: { codigo: CodigoError; datos?: DatosErrorWolf };
}

/**
 * Prueba de conexión gratuita: solo lista los modelos. Nunca lanza; el error trae el código y
 * datos sin la clave.
 */
export async function probarConexion(
  c: ConfigProveedorIa,
  clave: string | null,
  o: OpcionesClienteIa & { fetchImpl?: FetchIa; senal?: AbortSignal; ahora?: () => number } = {},
): Promise<ResultadoPruebaIa> {
  const ahora = o.ahora ?? (() => performance.now());
  const inicio = ahora();
  try {
    const cliente = crearClienteIa(c, o.fetchImpl, o);
    const modelos = await cliente.modelos(clave, o.senal ? { senal: o.senal } : {});
    return { ok: true, latenciaMs: Math.round(ahora() - inicio), modelos };
  } catch (e) {
    const latenciaMs = Math.round(ahora() - inicio);
    if (esErrorWolf(e) && e.codigo.startsWith('ia.')) {
      return {
        ok: false,
        latenciaMs,
        modelos: [],
        error: { codigo: e.codigo, ...(e.datos ? { datos: e.datos } : {}) },
      };
    }
    return { ok: false, latenciaMs, modelos: [], error: { codigo: 'ia.respuesta_rara' } };
  }
}

/** Ordena por id y quita repetidos. */
export function ordenarModelos(lista: ModeloIa[]): ModeloIa[] {
  const vistos = new Map<string, ModeloIa>();
  for (const m of lista) if (!vistos.has(m.id)) vistos.set(m.id, m);
  return [...vistos.values()].sort((a, b) => a.id.localeCompare(b.id));
}
