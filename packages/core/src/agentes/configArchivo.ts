import { copyFile, lstat, mkdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { applyEdits, modify, parse, type ParseError } from 'jsonc-parser';
import { parse as parseToml } from 'smol-toml';
import { isMap, parseDocument } from 'yaml';
import { ErrorWolf } from '../errores';
import { escribirAtomico } from '../sitios/urlbase';

/** Nombre de la entrada del MCP de WolfCore Dev en la configuración de cada agente. */
export const NOMBRE_ENTRADA_MCP = 'wolfcore';
/**
 * Variable de entorno con el token del MCP. Las configuraciones de los agentes la nombran (o la
 * expanden con `${…}`): el token nunca queda escrito en sus archivos.
 */
export const VARIABLE_TOKEN_MCP = 'WOLFCORE_MCP_TOKEN';

export type FormatoConfig = 'json' | 'toml' | 'yaml';

/** Valor de la entrada: solo textos (y un nivel de objetos de textos, p. ej. `headers`). */
export type ValorEntradaMcp = Record<string, string | Record<string, string>>;

const BOM = String.fromCharCode(0xfeff);

function ilegible(ruta: string, detalle?: string): ErrorWolf {
  return new ErrorWolf(
    'agentes.config_ilegible',
    `No se pudo interpretar ${path.basename(ruta)}${detalle ? ` (${detalle})` : ''}; no se modificó.`,
    { archivo: path.basename(ruta) },
  );
}

/**
 * Ruta donde se escribe: la real si `ruta` es un enlace (gestores de dotfiles), para no
 * reemplazar el enlace por un archivo. Lanza `agentes.config_ilegible` si no es un archivo.
 */
async function rutaReal(ruta: string): Promise<{ ruta: string; existe: boolean }> {
  let info;
  try {
    info = await lstat(ruta);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { ruta, existe: false };
    throw e;
  }
  if (info.isSymbolicLink()) {
    const real = await realpath(ruta).catch(() => null);
    if (!real) throw ilegible(ruta, 'enlace roto');
    const r = await lstat(real);
    if (!r.isFile()) throw ilegible(ruta, 'no es un archivo');
    return { ruta: real, existe: true };
  }
  if (!info.isFile()) throw ilegible(ruta, 'no es un archivo');
  return { ruta, existe: true };
}

/** Texto del archivo de configuración (sin BOM), o null si no existe. */
export async function leerConfigAgente(ruta: string): Promise<string | null> {
  const r = await rutaReal(ruta);
  if (!r.existe) return null;
  const t = await readFile(r.ruta, 'utf8');
  return t.startsWith(BOM) ? t.slice(1) : t;
}

/* ───────────── interpretar ───────────── */

function objetoJson(texto: string, ruta: string): Record<string, unknown> {
  const errores: ParseError[] = [];
  const v = parse(texto, errores, { allowTrailingComma: true, disallowComments: false });
  if (errores.length > 0 || v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw ilegible(ruta);
  }
  return v as Record<string, unknown>;
}

function objetoToml(texto: string, ruta: string): Record<string, unknown> {
  try {
    return parseToml(texto) as Record<string, unknown>;
  } catch {
    throw ilegible(ruta);
  }
}

function documentoYaml(texto: string, ruta: string) {
  const doc = parseDocument(texto, { prettyErrors: false });
  if (doc.errors.length > 0) throw ilegible(ruta);
  if (doc.contents !== null && !isMap(doc.contents)) throw ilegible(ruta);
  return doc;
}

function objetoYaml(texto: string, ruta: string): Record<string, unknown> {
  const v = documentoYaml(texto, ruta).toJS() as unknown;
  if (v === null || v === undefined) return {};
  return v as Record<string, unknown>;
}

/** Objeto del archivo según su formato; lanza `agentes.config_ilegible` si no se entiende. */
export function interpretarConfig(
  formato: FormatoConfig,
  texto: string | null,
  ruta: string,
): Record<string, unknown> {
  if (texto === null || texto.trim() === '') return {};
  if (formato === 'json') return objetoJson(texto, ruta);
  if (formato === 'toml') return objetoToml(texto, ruta);
  return objetoYaml(texto, ruta);
}

/** Entrada `wolfcore` de la sección de servidores (`seccion`), o undefined. */
export function entradaMcp(obj: Record<string, unknown>, seccion: string): unknown {
  const s = obj[seccion];
  if (s === undefined) return undefined;
  if (s === null || typeof s !== 'object' || Array.isArray(s)) return undefined;
  return (s as Record<string, unknown>)[NOMBRE_ENTRADA_MCP];
}

/** Copia del objeto sin la entrada `wolfcore` (y sin la sección si queda vacía). */
function sinEntrada(obj: Record<string, unknown>, seccion: string): Record<string, unknown> {
  const copia: Record<string, unknown> = { ...obj };
  const s = copia[seccion];
  if (s && typeof s === 'object' && !Array.isArray(s)) {
    const resto = { ...(s as Record<string, unknown>) };
    delete resto[NOMBRE_ENTRADA_MCP];
    if (Object.keys(resto).length === 0) delete copia[seccion];
    else copia[seccion] = resto;
  }
  return copia;
}

/* ───────────── editar ───────────── */

/**
 * Igualdad de datos (no de prototipos: smol-toml crea objetos sin prototipo). Las fechas de TOML
 * se comparan por su texto.
 */
function iguales(a: unknown, b: unknown): boolean {
  const plano = (v: unknown): string => JSON.stringify(v, (_k, x: unknown) => ordenado(x));
  return plano(a) === plano(b);
}

/** Objetos con las claves en orden, para que el orden no cuente como diferencia. */
function ordenado(x: unknown): unknown {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return x;
  if (typeof (x as { toISOString?: unknown }).toISOString === 'function') return String(x);
  const o = x as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(o)
      .sort()
      .map((k) => [k, o[k]]),
  );
}

const eolDe = (t: string): string => (t.includes('\r\n') ? '\r\n' : '\n');

function editarJson(texto: string, seccion: string, valor: ValorEntradaMcp | undefined): string {
  const base = texto.trim() === '' ? '{}' : texto;
  const edits = modify(base, [seccion, NOMBRE_ENTRADA_MCP], valor, {
    formattingOptions: { insertSpaces: true, tabSize: 2, eol: eolDe(base) },
  });
  return applyEdits(base, edits);
}

const cadenaToml = (v: string): string => JSON.stringify(v);

/** `[seccion.wolfcore]` y sus subtablas (`[seccion.wolfcore.headers]`), con o sin comillas. */
function cabeceraPropia(seccion: string): RegExp {
  return new RegExp(
    String.raw`^\s*\[\s*${seccion}\s*\.\s*(?:${NOMBRE_ENTRADA_MCP}|"${NOMBRE_ENTRADA_MCP}"|'${NOMBRE_ENTRADA_MCP}')\s*(?:\.[^\]]*)?\]\s*(?:#.*)?$`,
  );
}

function editarToml(texto: string, seccion: string, valor: ValorEntradaMcp | undefined): string {
  const eol = eolDe(texto);
  const lineas = texto === '' ? [] : texto.split(/\r?\n/);
  const propia = cabeceraPropia(seccion);
  const fuera: string[] = [];
  let dentro = false;
  for (const l of lineas) {
    if (propia.test(l)) {
      dentro = true;
      continue;
    }
    if (dentro && /^\s*\[/.test(l)) dentro = false;
    if (!dentro) fuera.push(l);
  }
  while (fuera.length > 0 && fuera[fuera.length - 1]!.trim() === '') fuera.pop();
  if (valor !== undefined) {
    const simples: string[] = [];
    const tablas: string[] = [];
    for (const [k, v] of Object.entries(valor)) {
      if (typeof v === 'string') simples.push(`${k} = ${cadenaToml(v)}`);
      else {
        const pares = Object.entries(v).map(([a, b]) => `${cadenaToml(a)} = ${cadenaToml(b)}`);
        tablas.push(`${k} = { ${pares.join(', ')} }`);
      }
    }
    if (fuera.length > 0) fuera.push('');
    fuera.push(`[${seccion}.${NOMBRE_ENTRADA_MCP}]`, ...simples, ...tablas);
  }
  return fuera.length > 0 ? fuera.join(eol) + eol : '';
}

function editarYaml(
  texto: string,
  seccion: string,
  valor: ValorEntradaMcp | undefined,
  ruta: string,
): string {
  const doc = documentoYaml(texto, ruta);
  const s = doc.get(seccion, true);
  if (s !== undefined && s !== null && !isMap(s)) throw ilegible(ruta);
  if (valor === undefined) doc.deleteIn([seccion, NOMBRE_ENTRADA_MCP]);
  else doc.setIn([seccion, NOMBRE_ENTRADA_MCP], doc.createNode(valor));
  const salida = String(doc);
  return texto.includes('\r\n') ? salida.replace(/\r?\n/g, '\r\n') : salida;
}

/**
 * Pone (o quita con `valor` undefined) solo la entrada `wolfcore` de `seccion` y conserva todo
 * lo demás. Comprueba el resultado: si algo ajeno cambiara al interpretarlo, lanza
 * `agentes.config_ilegible` (nunca se escribe un archivo que pierda datos del usuario).
 */
export function editarEntradaMcp(
  formato: FormatoConfig,
  texto: string | null,
  seccion: string,
  valor: ValorEntradaMcp | undefined,
  ruta: string,
): string {
  const original = texto ?? '';
  const antes = interpretarConfig(formato, original, ruta);
  const s = antes[seccion];
  if (s !== undefined && (s === null || typeof s !== 'object' || Array.isArray(s))) {
    throw ilegible(ruta, `"${seccion}" no es una tabla`);
  }
  let nuevo: string;
  if (formato === 'json') nuevo = editarJson(original, seccion, valor);
  else if (formato === 'toml') nuevo = editarToml(original, seccion, valor);
  else nuevo = editarYaml(original, seccion, valor, ruta);
  let despues: Record<string, unknown>;
  try {
    despues = interpretarConfig(formato, nuevo, ruta);
  } catch {
    throw ilegible(ruta);
  }
  const igualResto = iguales(sinEntrada(despues, seccion), sinEntrada(antes, seccion));
  const entrada = entradaMcp(despues, seccion);
  const entradaOk = valor === undefined ? entrada === undefined : iguales(entrada, valor);
  if (!igualResto || !entradaOk) throw ilegible(ruta, 'la edición cambiaría otras entradas');
  return nuevo;
}

/** AAAAMMDD-HHmmss en hora local. */
function sello(f: Date): string {
  const n = (v: number): string => String(v).padStart(2, '0');
  return (
    `${f.getFullYear()}${n(f.getMonth() + 1)}${n(f.getDate())}-` +
    `${n(f.getHours())}${n(f.getMinutes())}${n(f.getSeconds())}`
  );
}

/**
 * Copia con fecha junto al archivo (`<archivo>.wolfcore-<fecha>.bak`), sin pisar otra copia.
 * Devuelve su ruta, o null si el archivo no existía.
 */
export async function respaldarConfigAgente(
  ruta: string,
  ahora: Date = new Date(),
): Promise<string | null> {
  const r = await rutaReal(ruta);
  if (!r.existe) return null;
  const base = `${ruta}.wolfcore-${sello(ahora)}`;
  for (let i = 0; ; i++) {
    const destino = `${base}${i ? `-${i}` : ''}.bak`;
    try {
      await copyFile(r.ruta, destino, 1 /* COPYFILE_EXCL */);
      return destino;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST' || i > 100) throw e;
    }
  }
}

export interface ResultadoEdicionConfig {
  /** Ruta de la copia previa (null si el archivo no existía). */
  respaldo: string | null;
  /** false si no hizo falta escribir (ya estaba así). */
  cambiado: boolean;
}

/**
 * Edita la entrada `wolfcore` del archivo de un agente: lee, edita y comprueba en memoria; solo
 * si todo va bien hace la copia con fecha y escribe de forma atómica (conserva el BOM).
 */
export async function editarConfigAgente(
  ruta: string,
  formato: FormatoConfig,
  seccion: string,
  valor: ValorEntradaMcp | undefined,
  ahora?: Date,
): Promise<ResultadoEdicionConfig> {
  const real = await rutaReal(ruta);
  const crudo = real.existe ? await readFile(real.ruta, 'utf8') : null;
  const bom = crudo?.startsWith(BOM) ? BOM : '';
  const texto = crudo === null ? null : crudo.slice(bom.length);
  if (valor === undefined && texto === null) return { respaldo: null, cambiado: false };
  const nuevo = editarEntradaMcp(formato, texto, seccion, valor, ruta);
  if (texto !== null && nuevo === texto) return { respaldo: null, cambiado: false };
  const respaldo = await respaldarConfigAgente(ruta, ahora);
  await mkdir(path.dirname(real.ruta), { recursive: true });
  await escribirAtomico(real.ruta, Buffer.from(bom + nuevo, 'utf8'));
  return { respaldo, cambiado: true };
}
