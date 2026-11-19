/**
 * Datos de los proveedores de IA en la nube que la interfaz necesita para mostrar y armar el
 * formulario. Son copia de los del núcleo (una prueba lo comprueba); el núcleo vuelve a validar
 * todo lo que llega.
 */
import type { ProveedorIaPublico, TipoProveedorIa } from '../../shared/api';

/** Tipos que se agregan como tarjeta (Ollama tiene su propia sección). */
export const TIPOS_NUBE = ['openai', 'anthropic', 'gemini', 'hermes', 'compatible'] as const;
export type TipoNube = (typeof TIPOS_NUBE)[number];

/** URL base de cada tipo cuando no se escribe una (solo para mostrarla). */
export const URL_POR_DEFECTO: Record<TipoProveedorIa, string | null> = {
  ollama: 'http://127.0.0.1:11434',
  hermes: 'https://inference-api.nousresearch.com/v1',
  gemini: 'https://generativelanguage.googleapis.com',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  compatible: null,
};

/** Compatibles con OpenAI que se ofrecen ya rellenos. */
export const PRESETS_COMPATIBLES: readonly { nombre: string; urlBase: string }[] = [
  { nombre: 'OpenRouter', urlBase: 'https://openrouter.ai/api/v1' },
  { nombre: 'Groq', urlBase: 'https://api.groq.com/openai/v1' },
  { nombre: 'Mistral', urlBase: 'https://api.mistral.ai/v1' },
  { nombre: 'DeepSeek', urlBase: 'https://api.deepseek.com/v1' },
  { nombre: 'LM Studio', urlBase: 'http://127.0.0.1:1234/v1' },
];

/** Tipos que no funcionan sin clave. */
export const TIPOS_CON_CLAVE: ReadonlySet<TipoProveedorIa> = new Set([
  'hermes',
  'gemini',
  'openai',
  'anthropic',
]);

/** URL que usará el proveedor (la escrita o la del tipo), sin barra final. */
export function urlEfectiva(p: Pick<ProveedorIaPublico, 'tipo' | 'urlBase'>): string | null {
  return (p.urlBase ?? URL_POR_DEFECTO[p.tipo])?.replace(/\/+$/, '') ?? null;
}

/** `••••abcd` o null si no hay clave (o no se pudo leer su final). */
export function claveEnmascarada(p: Pick<ProveedorIaPublico, 'clave'>): string | null {
  if (!p.clave.configurada) return null;
  return p.clave.final ? `••••${p.clave.final}` : '••••';
}

/** Id nuevo a partir del nombre (`OpenRouter personal` → `openrouter-personal`), sin repetir. */
export function idDeNombre(nombre: string, tipo: string, existentes: readonly string[]): string {
  const base =
    nombre
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 34)
      .replace(/-+$/, '') || tipo;
  let id = base;
  for (let i = 2; existentes.includes(id); i++) id = `${base}-${i}`;
  return id;
}
