/**
 * Lógica pura de la pantalla Herramientas: todo corre en el renderer, sin red ni Node.
 * Lo que puede colgar la interfaz (regex, MD5 de archivos) se ejecuta en un Worker con tiempo
 * límite (`ejecutarEnTrabajador`).
 */
import { compare as compararBcrypt, hash as hashBcrypt, truncates } from 'bcryptjs';
import { diffLines } from 'diff';
import MarkdownIt, { type MarkdownIt as InstanciaMarkdown, type RendererRule } from 'markdown-it';
import { es } from '../i18n/es';
import { aHex, md5, type Coincidencia, type ResultadoRegex } from './herramientasTrabajo';

export { aHex, buscarCoincidencias, md5 } from './herramientasTrabajo';
export type { Coincidencia, ResultadoRegex } from './herramientasTrabajo';

const t = es.herramientas.errores;

// ---------------------------------------------------------------- JSON

export type ResultadoJson =
  | { ok: true; texto: string; valor: unknown }
  | { ok: false; error: string; linea?: number; columna?: number };

/** Posición (índice) del primer error de sintaxis JSON, o null si el texto es válido. */
export function posicionErrorJson(s: string): number | null {
  let i = 0;
  const espacios = (): void => {
    while (i < s.length && ' \t\n\r'.includes(s[i] ?? '')) i++;
  };
  const fallo = (): never => {
    throw i;
  };
  const literal = (p: string): void => {
    if (s.startsWith(p, i)) i += p.length;
    else fallo();
  };
  const cadena = (): void => {
    i++;
    while (i < s.length) {
      const c = s.charCodeAt(i);
      if (c === 0x22) {
        i++;
        return;
      }
      if (c < 0x20) fallo();
      if (c === 0x5c) {
        i++;
        const e = s[i] ?? '';
        if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(s.slice(i + 1, i + 5))) fallo();
          i += 5;
        } else if ('"\\/bfnrt'.includes(e) && e) i++;
        else fallo();
      } else i++;
    }
    fallo();
  };
  const numero = (): void => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(s.slice(i));
    if (!m) fallo();
    else i += m[0].length;
  };
  const valor = (profundidad: number): void => {
    if (profundidad > 500) fallo();
    espacios();
    const c = s[i];
    if (c === '{') {
      i++;
      espacios();
      if (s[i] === '}') {
        i++;
        return;
      }
      for (;;) {
        espacios();
        if (s[i] !== '"') fallo();
        cadena();
        espacios();
        if (s[i] !== ':') fallo();
        i++;
        valor(profundidad + 1);
        espacios();
        if (s[i] === ',') i++;
        else if (s[i] === '}') {
          i++;
          return;
        } else fallo();
      }
    } else if (c === '[') {
      i++;
      espacios();
      if (s[i] === ']') {
        i++;
        return;
      }
      for (;;) {
        valor(profundidad + 1);
        espacios();
        if (s[i] === ',') i++;
        else if (s[i] === ']') {
          i++;
          return;
        } else fallo();
      }
    } else if (c === '"') cadena();
    else if (c === 't') literal('true');
    else if (c === 'f') literal('false');
    else if (c === 'n') literal('null');
    else numero();
  };
  try {
    valor(0);
    espacios();
    return i < s.length ? i : null;
  } catch (p) {
    return typeof p === 'number' ? p : 0;
  }
}

function lineaColumna(s: string, pos: number): { linea: number; columna: number } {
  const antes = s.slice(0, pos);
  const linea = antes.split('\n').length;
  return { linea, columna: pos - (antes.lastIndexOf('\n') + 1) + 1 };
}

function leerJson(
  texto: string,
): { ok: true; valor: unknown } | Extract<ResultadoJson, { ok: false }> {
  if (!texto.trim()) return { ok: false, error: t.jsonVacio };
  try {
    return { ok: true, valor: JSON.parse(texto) as unknown };
  } catch {
    const pos = posicionErrorJson(texto) ?? 0;
    const { linea, columna } = lineaColumna(texto, pos);
    return { ok: false, error: t.jsonInvalido(linea, columna), linea, columna };
  }
}

export function formatearJson(texto: string, sangria = 2): ResultadoJson {
  const r = leerJson(texto);
  return r.ok ? { ok: true, valor: r.valor, texto: JSON.stringify(r.valor, null, sangria) } : r;
}

export function minificarJson(texto: string): ResultadoJson {
  const r = leerJson(texto);
  return r.ok ? { ok: true, valor: r.valor, texto: JSON.stringify(r.valor) } : r;
}

export interface NodoArbol {
  key: string;
  label: string;
  children?: NodoArbol[];
}

/** Árbol para NTree, con un tope de nodos para no congelar la vista con JSON enormes. */
export function arbolJson(valor: unknown, max = 2000): NodoArbol[] {
  let restantes = max;
  const corto = (v: unknown): string => {
    const s = JSON.stringify(v) ?? String(v);
    return s.length > 120 ? `${s.slice(0, 117)}…` : s;
  };
  const hijos = (v: unknown, ruta: string): NodoArbol[] => {
    const entradas: [string, unknown][] = Array.isArray(v)
      ? v.map((x, i) => [String(i), x])
      : Object.entries(v as Record<string, unknown>);
    const nodos: NodoArbol[] = [];
    for (let i = 0; i < entradas.length; i++) {
      if (restantes <= 0) {
        nodos.push({ key: `${ruta}/…`, label: es.herramientas.json.mas(entradas.length - i) });
        break;
      }
      restantes--;
      const [k, x] = entradas[i] as [string, unknown];
      nodos.push(nodo(k, x, `${ruta}/${k}`));
    }
    return nodos;
  };
  const nodo = (clave: string, v: unknown, ruta: string): NodoArbol => {
    if (v !== null && typeof v === 'object') {
      const n = Array.isArray(v) ? v.length : Object.keys(v).length;
      const etiqueta = Array.isArray(v) ? `${clave} [${n}]` : `${clave} {${n}}`;
      return { key: ruta, label: etiqueta, children: hijos(v, ruta) };
    }
    return { key: ruta, label: `${clave}: ${corto(v)}` };
  };
  if (valor !== null && typeof valor === 'object') return hijos(valor, '');
  return [{ key: '/', label: corto(valor) }];
}

// ---------------------------------------------------------------- Regex

/** Trozos del texto marcados con el número de coincidencia (null = sin coincidencia). */
export function segmentosResaltado(
  texto: string,
  coincidencias: Pick<Coincidencia, 'indice' | 'fin'>[],
): { texto: string; n: number | null }[] {
  const r: { texto: string; n: number | null }[] = [];
  let pos = 0;
  coincidencias.forEach((c, n) => {
    if (c.fin <= c.indice || c.indice < pos) return;
    if (c.indice > pos) r.push({ texto: texto.slice(pos, c.indice), n: null });
    r.push({ texto: texto.slice(c.indice, c.fin), n });
    pos = c.fin;
  });
  if (pos < texto.length) r.push({ texto: texto.slice(pos), n: null });
  return r;
}

/** Lo mínimo de un Worker (el Web Worker del renderer o un adaptador en las pruebas). */
export interface TrabajadorHerramienta {
  postMessage(mensaje: unknown, transferir?: Transferable[]): void;
  terminate(): void;
  onmessage: ((e: { data: unknown }) => void) | null;
  onerror: ((e: unknown) => void) | null;
}

export type ResultadoTrabajador<T> =
  { estado: 'ok'; resultado: T } | { estado: 'tiempo' } | { estado: 'error'; mensaje: string };

/**
 * Manda un mensaje a un Worker nuevo y espera `{resultado}` o `{error}`. Si tarda más de `ms`
 * (p. ej. un patrón catastrófico) el Worker se termina: es la única forma de cortar un regex.
 */
export function ejecutarEnTrabajador<T>(
  mensaje: unknown,
  crear: () => TrabajadorHerramienta,
  ms: number,
  transferir?: Transferable[],
): Promise<ResultadoTrabajador<T>> {
  return new Promise((resolve) => {
    let w: TrabajadorHerramienta;
    try {
      w = crear();
    } catch (e) {
      resolve({ estado: 'error', mensaje: (e as Error).message || t.trabajador });
      return;
    }
    let listo = false;
    const fin = (r: ResultadoTrabajador<T>): void => {
      if (listo) return;
      listo = true;
      clearTimeout(reloj);
      w.terminate();
      resolve(r);
    };
    const reloj = setTimeout(() => fin({ estado: 'tiempo' }), ms);
    w.onmessage = (e) => {
      const d = e.data as { resultado?: T; error?: string } | null;
      if (d && typeof d.error === 'string') fin({ estado: 'error', mensaje: d.error });
      else fin({ estado: 'ok', resultado: d?.resultado as T });
    };
    w.onerror = () => fin({ estado: 'error', mensaje: t.trabajador });
    w.postMessage(mensaje, transferir);
  });
}

export interface PeticionRegex {
  patron: string;
  banderas: string;
  texto: string;
}

export function probarRegexConLimite(
  peticion: PeticionRegex,
  crear: () => TrabajadorHerramienta,
  ms = 1500,
): Promise<ResultadoTrabajador<ResultadoRegex>> {
  return ejecutarEnTrabajador<ResultadoRegex>({ tipo: 'regex', ...peticion }, crear, ms);
}

// ---------------------------------------------------------------- Diff

export interface FilaDiff {
  tipo: 'igual' | 'quitado' | 'agregado' | 'cambiado';
  izq: string | null;
  der: string | null;
  numIzq: number | null;
  numDer: number | null;
}

export interface ResultadoDiff {
  filas: FilaDiff[];
  agregadas: number;
  quitadas: number;
}

const lineasDe = (valor: string): string[] => {
  const l = valor.split('\n');
  if (l.at(-1) === '') l.pop();
  return l;
};

/** Comparación por líneas, lista para mostrar lado a lado. Lanza si tarda demasiado. */
export function compararTextos(a: string, b: string, timeout = 3000): ResultadoDiff {
  const cambios = diffLines(a.replace(/\r\n/g, '\n'), b.replace(/\r\n/g, '\n'), { timeout });
  if (!cambios) throw new Error(t.diffLento);
  const filas: FilaDiff[] = [];
  let ni = 1;
  let nd = 1;
  let agregadas = 0;
  let quitadas = 0;
  for (let k = 0; k < cambios.length; k++) {
    const c = cambios[k];
    if (!c) continue;
    const lineas = lineasDe(c.value);
    if (c.removed) {
      const sig = cambios[k + 1];
      const nuevas = sig?.added ? lineasDe(sig.value) : [];
      if (sig?.added) k++;
      quitadas += lineas.length;
      agregadas += nuevas.length;
      for (let i = 0; i < Math.max(lineas.length, nuevas.length); i++) {
        const izq = lineas[i] ?? null;
        const der = nuevas[i] ?? null;
        filas.push({
          tipo: izq !== null && der !== null ? 'cambiado' : izq !== null ? 'quitado' : 'agregado',
          izq,
          der,
          numIzq: izq !== null ? ni++ : null,
          numDer: der !== null ? nd++ : null,
        });
      }
    } else if (c.added) {
      agregadas += lineas.length;
      for (const der of lineas) {
        filas.push({ tipo: 'agregado', izq: null, der, numIzq: null, numDer: nd++ });
      }
    } else {
      for (const l of lineas) {
        filas.push({ tipo: 'igual', izq: l, der: l, numIzq: ni++, numDer: nd++ });
      }
    }
  }
  return { filas, agregadas, quitadas };
}

// ---------------------------------------------------------------- Tiempo

/** Segundos si tiene hasta 11 cifras; milisegundos si tiene más. */
export function interpretarTimestamp(texto: string): { ms: number; unidad: 's' | 'ms' } | null {
  const s = texto.trim();
  if (!/^-?\d{1,16}$/.test(s)) return null;
  const n = Number(s);
  const r =
    Math.abs(n) >= 1e11 ? { ms: n, unidad: 'ms' as const } : { ms: n * 1000, unidad: 's' as const };
  return Math.abs(r.ms) <= 8.64e15 ? r : null;
}

const formateadores = new Map<string, Intl.DateTimeFormat>();

function partesEnZona(ms: number, zona: string): Record<string, number> {
  let f = formateadores.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      era: 'short',
    });
    formateadores.set(zona, f);
  }
  const p: Record<string, number> = {};
  let ac = false;
  for (const x of f.formatToParts(new Date(ms))) {
    if (x.type === 'era') ac = x.value.startsWith('B');
    else if (x.type !== 'literal') p[x.type] = Number(x.value);
  }
  if (ac) p['year'] = 1 - (p['year'] ?? 0);
  return p;
}

export function zonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

const dos = (n: number | undefined): string => String(n ?? 0).padStart(2, '0');

/** `AAAA-MM-DD HH:mm:ss` en la zona dada. */
export function formatearEnZona(ms: number, zona: string): string {
  const p = partesEnZona(ms, zona);
  return `${String(p['year']).padStart(4, '0')}-${dos(p['month'])}-${dos(p['day'])} ${dos(p['hour'])}:${dos(p['minute'])}:${dos(p['second'])}`;
}

/** Minutos respecto de UTC en ese instante (incluye el horario de verano). */
export function desplazamientoZona(ms: number, zona: string): number {
  const p = partesEnZona(ms, zona);
  const comoUtc = Date.UTC(
    p['year'] ?? 1970,
    (p['month'] ?? 1) - 1,
    p['day'] ?? 1,
    p['hour'] ?? 0,
    p['minute'] ?? 0,
    p['second'] ?? 0,
  );
  return Math.round((comoUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

export function textoDesplazamiento(min: number): string {
  const signo = min < 0 ? '−' : '+';
  const a = Math.abs(min);
  return `UTC${signo}${dos(Math.floor(a / 60))}:${dos(a % 60)}`;
}

/** `AAAA-MM-DD HH:mm[:ss]` (o con T) leída en `zona`; null si no es una fecha real. */
export function fechaEnZonaAMs(texto: string, zona: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(texto.trim());
  if (!m) return null;
  const [a, me, d, h, mi, s] = m.slice(1).map((x) => Number(x ?? 0)) as number[];
  const supuesto = Date.UTC(a ?? 0, (me ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, s ?? 0);
  const real = new Date(supuesto);
  if (
    real.getUTCMonth() !== (me ?? 1) - 1 ||
    real.getUTCDate() !== d ||
    real.getUTCHours() !== h ||
    real.getUTCMinutes() !== mi
  ) {
    return null;
  }
  const d1 = desplazamientoZona(supuesto, zona);
  let ms = supuesto - d1 * 60000;
  const d2 = desplazamientoZona(ms, zona);
  if (d2 !== d1) ms = supuesto - d2 * 60000;
  return ms;
}

// ---------------------------------------------------------------- Base64 y URL

function bytesABinario(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) {
    s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  }
  return s;
}

export function aBase64(texto: string, url = false): string {
  const b = btoa(bytesABinario(new TextEncoder().encode(texto)));
  return url ? b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b;
}

/** Acepta base64 estándar o URL, con o sin relleno; el resultado debe ser UTF-8 válido. */
export function desdeBase64(texto: string): string {
  let s = texto.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.replace(/=+$/, '').length % 4 === 1) {
    throw new Error(t.base64);
  }
  s = s.replace(/=+$/, '');
  s += '='.repeat((4 - (s.length % 4)) % 4);
  let binario: string;
  try {
    binario = atob(s);
  } catch {
    throw new Error(t.base64);
  }
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(t.utf8);
  }
}

export function codificarUrl(texto: string): string {
  return encodeURIComponent(texto);
}

export function decodificarUrl(texto: string): string {
  try {
    return decodeURIComponent(texto);
  } catch {
    throw new Error(t.url);
  }
}

// ---------------------------------------------------------------- Hash

export type AlgoritmoHash = 'MD5' | 'SHA-1' | 'SHA-256';

/** SHA con SubtleCrypto (no bloquea); MD5 en JS (rápido para textos). */
export async function hashTexto(
  algoritmo: AlgoritmoHash,
  datos: string | Uint8Array,
): Promise<string> {
  const b = typeof datos === 'string' ? new TextEncoder().encode(datos) : datos;
  if (algoritmo === 'MD5') return md5(b);
  return aHex(new Uint8Array(await crypto.subtle.digest(algoritmo, b as BufferSource)));
}

export const COSTE_BCRYPT_MAX = 12;

/** bcryptjs trabaja por tramos asíncronos: la interfaz sigue respondiendo. */
export async function bcryptHash(texto: string, coste: number): Promise<string> {
  if (!Number.isInteger(coste) || coste < 4 || coste > COSTE_BCRYPT_MAX) {
    throw new Error(t.coste(COSTE_BCRYPT_MAX));
  }
  return hashBcrypt(texto, coste);
}

export function bcryptComparar(texto: string, hash: string): Promise<boolean> {
  return compararBcrypt(texto, hash);
}

/** bcrypt solo usa los primeros 72 bytes. */
export function bcryptTrunca(texto: string): boolean {
  return truncates(texto);
}

// ---------------------------------------------------------------- JWT

export interface JwtDecodificado {
  cabecera: unknown;
  carga: unknown;
  firma: string;
  firmaVerificada: false;
  aviso: string;
  /** null si la carga no trae `exp`. */
  vencido: boolean | null;
}

/** Decodifica sin verificar la firma (no hay clave): solo para leer el contenido. */
export function decodificarJwt(token: string, ahora = Date.now()): JwtDecodificado {
  const partes = token.trim().split('.');
  if (partes.length !== 3) throw new Error(t.jwtPartes);
  const leer = (p: string, error: string): unknown => {
    try {
      return JSON.parse(desdeBase64(p)) as unknown;
    } catch {
      throw new Error(error);
    }
  };
  const cabecera = leer(partes[0] ?? '', t.jwtCabecera);
  const carga = leer(partes[1] ?? '', t.jwtCarga);
  const exp = (carga as { exp?: unknown } | null)?.exp;
  return {
    cabecera,
    carga,
    firma: partes[2] ?? '',
    firmaVerificada: false,
    aviso: es.herramientas.cripto.firmaNoVerificada,
    vencido: typeof exp === 'number' ? exp * 1000 < ahora : null,
  };
}

// ---------------------------------------------------------------- Markdown

let md: InstanciaMarkdown | null = null;

/** Solo http(s), mailto y anclas: nada de javascript:, data:, vbscript: ni file:. */
export function enlaceSeguro(url: string): boolean {
  const u = url.trim();
  return /^(https?:\/\/|mailto:|#)/i.test(u);
}

/** HTML de la vista previa: sin HTML crudo (se escapa) y con enlaces filtrados. */
export function renderizarMarkdown(texto: string): string {
  if (!md) {
    md = new MarkdownIt({ html: false, linkify: false, typographer: false });
    md.validateLink = enlaceSeguro;
    const anterior = md.renderer.rules['link_open'];
    const enlace: RendererRule = (tokens, idx, opciones, env, self) => {
      tokens[idx]?.attrSet('rel', 'noopener noreferrer');
      return anterior
        ? anterior(tokens, idx, opciones, env, self)
        : self.renderToken(tokens, idx, opciones);
    };
    md.renderer.rules['link_open'] = enlace;
  }
  return md.render(texto);
}

// ---------------------------------------------------------------- Varios

export interface OpcionesContrasena {
  mayusculas: boolean;
  minusculas: boolean;
  numeros: boolean;
  simbolos: boolean;
}

const CONJUNTOS: Record<keyof OpcionesContrasena, string> = {
  mayusculas: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  minusculas: 'abcdefghijklmnopqrstuvwxyz',
  numeros: '0123456789',
  simbolos: '!#$%&()*+,-./:;<=>?@[]^_{|}~',
};

/** Con `crypto.getRandomValues` y sin sesgo de módulo; incluye al menos uno de cada tipo. */
export function generarContrasena(
  longitud: number,
  opciones: OpcionesContrasena,
  aleatorio: (n: number) => Uint32Array = (n) => crypto.getRandomValues(new Uint32Array(n)),
): string {
  if (!Number.isInteger(longitud) || longitud < 4 || longitud > 256) throw new Error(t.longitud);
  const conjuntos = (Object.keys(CONJUNTOS) as (keyof OpcionesContrasena)[])
    .filter((k) => opciones[k])
    .map((k) => CONJUNTOS[k]);
  if (!conjuntos.length) throw new Error(t.sinConjuntos);
  const alfabeto = conjuntos.join('');
  const limite = Math.floor(2 ** 32 / alfabeto.length) * alfabeto.length;
  for (let intento = 0; intento < 100; intento++) {
    let r = '';
    while (r.length < longitud) {
      for (const v of aleatorio(longitud)) {
        if (v < limite && r.length < longitud) r += alfabeto[v % alfabeto.length];
      }
    }
    if (conjuntos.every((c) => [...r].some((ch) => c.includes(ch)))) return r;
  }
  throw new Error(t.sinConjuntos);
}

/** URL de WebSocket escrita por el usuario: solo ws:// o wss://. */
export function validarUrlWs(texto: string): string | null {
  try {
    const u = new URL(texto.trim());
    return u.protocol === 'ws:' || u.protocol === 'wss:' ? u.href : null;
  } catch {
    return null;
  }
}

export function agregarAcotado<T>(lista: readonly T[], item: T, max: number): T[] {
  const r = [...lista, item];
  return r.length > max ? r.slice(r.length - max) : r;
}

export const MAX_DOMINIOS = 20;

/** Separa por espacios, comas o líneas; el núcleo valida cada nombre. */
export function validarDominios(texto: string): { dominios: string[]; error?: string } {
  const dominios = [
    ...new Set(
      texto
        .split(/[\s,;]+/)
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (!dominios.length) return { dominios, error: t.sinDominios };
  if (dominios.length > MAX_DOMINIOS) return { dominios, error: t.muchosDominios(MAX_DOMINIOS) };
  return { dominios };
}

/** Tamaño legible en unidades binarias. */
export function tamanoLegible(bytes: number): string {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${i === 0 ? v : v.toFixed(1)} ${u[i]}`;
}
