import { createHash } from 'node:crypto';
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
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

/**
 * Valor de la entrada: textos, booleanos, listas de textos (p. ej. `tools`) y un nivel de objetos
 * de textos (p. ej. `headers`).
 */
export type ValorEntradaMcp = Record<string, string | boolean | string[] | Record<string, string>>;

const BOM = String.fromCharCode(0xfeff);

/** Tope del archivo de un agente: uno más grande no es una configuración (y no se lee entero). */
const MAX_BYTES_CONFIG = 5 * 1024 * 1024;

/** Por qué no se pudo leer un archivo de configuración (lo usa «Conectar asistentes»). */
export type MotivoIlegible = 'invalido' | 'demasiado_grande' | 'sin_acceso';

function ilegible(ruta: string, detalle?: string, motivo: MotivoIlegible = 'invalido'): ErrorWolf {
  return new ErrorWolf(
    'agentes.config_ilegible',
    `No se pudo interpretar ${path.basename(ruta)}${detalle ? ` (${detalle})` : ''}; no se modificó.`,
    { archivo: path.basename(ruta), motivo },
  );
}

function enlaceRechazado(ruta: string): ErrorWolf {
  return new ErrorWolf(
    'asistentes.enlace_rechazado',
    `${path.basename(ruta)} es un enlace: no se modifica.`,
    { archivo: path.basename(ruta) },
  );
}

/** Opciones de lectura y escritura de una configuración ajena. */
export interface OpcionesConfig {
  /** Con `true`, un archivo que es un enlace (simbólico o unión) se rechaza en vez de seguirlo. */
  rechazarEnlaces?: boolean;
}

/**
 * Rechaza enlaces (simbólicos o uniones) en cada componente de `ruta` por debajo de `raiz`
 * (la carpeta de inicio del usuario): una carpeta intermedia como `~/.config` convertida en
 * unión también redirigiría la escritura. Se comprueba con `lstat`, sin seguir nada; lo que no
 * existe todavía no puede ser un enlace. La raíz misma no se comprueba.
 */
export async function exigirSinEnlaces(raiz: string, ruta: string): Promise<void> {
  const rel = path.relative(raiz, ruta);
  const dentro = rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  const partes = dentro ? rel.split(path.sep) : [];
  const rutas = dentro
    ? partes.map((_, i) => path.join(raiz, ...partes.slice(0, i + 1)))
    : [path.dirname(ruta), ruta];
  for (const r of rutas) {
    let info;
    try {
      info = await lstat(r);
    } catch (e) {
      const c = (e as NodeJS.ErrnoException).code;
      if (c === 'ENOENT' || c === 'ENOTDIR') return;
      throw e;
    }
    if (info.isSymbolicLink()) throw enlaceRechazado(r);
  }
}

/**
 * Ruta donde se escribe: la real si `ruta` es un enlace (gestores de dotfiles), para no
 * reemplazar el enlace por un archivo. Lanza `agentes.config_ilegible` si no es un archivo.
 */
async function rutaReal(
  ruta: string,
  o: OpcionesConfig = {},
): Promise<{ ruta: string; existe: boolean; modo: number }> {
  let info;
  try {
    info = await lstat(ruta);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { ruta, existe: false, modo: 0o600 };
    throw e;
  }
  if (info.isSymbolicLink() && o.rechazarEnlaces) throw enlaceRechazado(ruta);
  if (info.isFile() && info.size > MAX_BYTES_CONFIG) {
    throw ilegible(ruta, 'demasiado grande', 'demasiado_grande');
  }
  if (info.isSymbolicLink()) {
    const real = await realpath(ruta).catch(() => null);
    if (!real) throw ilegible(ruta, 'enlace roto');
    const r = await lstat(real);
    if (!r.isFile()) throw ilegible(ruta, 'no es un archivo');
    if (r.size > MAX_BYTES_CONFIG) throw ilegible(ruta, 'demasiado grande', 'demasiado_grande');
    return { ruta: real, existe: true, modo: r.mode & 0o777 };
  }
  if (!info.isFile()) throw ilegible(ruta, 'no es un archivo');
  return { ruta, existe: true, modo: info.mode & 0o777 };
}

/** Texto del archivo de configuración (sin BOM), o null si no existe. */
export async function leerConfigAgente(
  ruta: string,
  o: OpcionesConfig = {},
): Promise<string | null> {
  const r = await rutaReal(ruta, o);
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

const esTabla = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/** Tabla de la sección (`mcp.servers` baja por `mcp` y `servers`), o undefined si no está. */
function tablaDe(
  obj: Record<string, unknown>,
  seccion: string,
): Record<string, unknown> | undefined {
  let t: unknown = obj;
  for (const k of seccion.split('.')) {
    if (!esTabla(t)) return undefined;
    t = t[k];
  }
  return esTabla(t) ? t : undefined;
}

/** Entrada `wolfcore` de la sección de servidores (`seccion`), o undefined. */
export function entradaMcp(obj: Record<string, unknown>, seccion: string): unknown {
  return tablaDe(obj, seccion)?.[NOMBRE_ENTRADA_MCP];
}

/**
 * Sección donde va (o está) la entrada. Con `alterna` (la V2 de opencode: `mcp.servers`), si esa
 * tabla existe se usa ella; para quitar, si la entrada solo está en la sección clásica, esa.
 */
export function seccionEfectiva(
  obj: Record<string, unknown>,
  seccion: string,
  alterna: string | undefined,
  accion: 'conectar' | 'quitar',
): string {
  if (alterna === undefined || tablaDe(obj, alterna) === undefined) return seccion;
  if (
    accion === 'quitar' &&
    entradaMcp(obj, alterna) === undefined &&
    entradaMcp(obj, seccion) !== undefined
  ) {
    return seccion;
  }
  return alterna;
}

/** Copia del objeto sin la entrada `wolfcore` (y sin la sección si queda vacía). */
function sinEntrada(obj: Record<string, unknown>, seccion: string): Record<string, unknown> {
  const claves = seccion.split('.');
  const copia: Record<string, unknown> = { ...obj };
  const quitar = (nivel: Record<string, unknown>, i: number): void => {
    const k = claves[i]!;
    const hijo = nivel[k];
    if (!esTabla(hijo)) return;
    const resto = { ...hijo };
    if (i === claves.length - 1) delete resto[NOMBRE_ENTRADA_MCP];
    else quitar(resto, i + 1);
    if (Object.keys(resto).length === 0) delete nivel[k];
    else nivel[k] = resto;
  };
  quitar(copia, 0);
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

/** El texto mezcla finales de línea (CRLF y LF): hay que cuidar de no normalizarlos. */
export function mezclaFinales(t: string): boolean {
  const crlf = (t.match(/\r\n/g) ?? []).length;
  const lf = (t.match(/\n/g) ?? []).length - crlf;
  return crlf > 0 && lf > 0;
}

function editarJson(texto: string, seccion: string, valor: ValorEntradaMcp | undefined): string {
  const base = texto.trim() === '' ? '{}' : texto;
  const edits = modify(base, [...seccion.split('.'), NOMBRE_ENTRADA_MCP], valor, {
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

/** Una línea con su propio final de línea (vacío en la última si el texto no acaba en salto). */
interface LineaTexto {
  t: string;
  eol: string;
}

function lineasConFinal(texto: string): LineaTexto[] {
  if (texto === '') return [];
  const partes = texto.split(/(\r?\n)/);
  const salida: LineaTexto[] = [];
  for (let i = 0; i < partes.length; i += 2) {
    const t = partes[i]!;
    const eol = partes[i + 1] ?? '';
    if (t === '' && eol === '') continue;
    salida.push({ t, eol });
  }
  return salida;
}

function bloqueToml(seccion: string, valor: ValorEntradaMcp): string[] {
  const simples: string[] = [];
  const tablas: string[] = [];
  for (const [k, v] of Object.entries(valor)) {
    if (typeof v === 'string') simples.push(`${k} = ${cadenaToml(v)}`);
    else if (typeof v === 'boolean') simples.push(`${k} = ${String(v)}`);
    else if (Array.isArray(v)) simples.push(`${k} = [${v.map(cadenaToml).join(', ')}]`);
    else {
      const pares = Object.entries(v).map(([a, b]) => `${cadenaToml(a)} = ${cadenaToml(b)}`);
      tablas.push(`${k} = { ${pares.join(', ')} }`);
    }
  }
  return [`[${seccion}.${NOMBRE_ENTRADA_MCP}]`, ...simples, ...tablas];
}

/**
 * Reemplaza la tabla `[seccion.wolfcore]` (y sus subtablas) EN SU SITIO, sin moverla; si no
 * existe, la agrega al final. Cada línea conserva su propio final (CRLF o LF): no se normaliza.
 * Una entrada en línea (`wolfcore = { … }`) o con claves con puntos (`wolfcore.url = …`) no se
 * puede editar sin riesgo: error `asistentes.entrada_no_editable`.
 */
function editarToml(
  texto: string,
  seccion: string,
  valor: ValorEntradaMcp | undefined,
  existente: boolean,
  ruta: string,
): string {
  const crlf = (texto.match(/\r\n/g) ?? []).length;
  const lf = (texto.match(/\n/g) ?? []).length - crlf;
  const eolNuevo = crlf > 0 && crlf >= lf ? '\r\n' : '\n';
  const propia = cabeceraPropia(seccion);
  const salida: LineaTexto[] = [];
  let hueco = -1;
  let dentro = false;
  let vacias: LineaTexto[] = [];
  for (const l of lineasConFinal(texto)) {
    if (propia.test(l.t)) {
      if (hueco < 0) hueco = salida.length;
      dentro = true;
      vacias = [];
      continue;
    }
    if (dentro && /^\s*\[/.test(l.t)) {
      dentro = false;
      salida.push(...vacias);
      vacias = [];
    }
    if (dentro) {
      if (l.t.trim() === '') vacias.push(l);
      else vacias = [];
      continue;
    }
    salida.push(l);
  }
  if (existente && hueco < 0) {
    throw new ErrorWolf(
      'asistentes.entrada_no_editable',
      `La entrada ${NOMBRE_ENTRADA_MCP} de ${path.basename(ruta)} tiene un formato que no se puede editar sin riesgo; edítela a mano.`,
      { archivo: path.basename(ruta) },
    );
  }
  const nuevas = (valor === undefined ? [] : bloqueToml(seccion, valor)).map((t) => ({
    t,
    eol: eolNuevo,
  }));
  if (hueco >= 0) {
    salida.splice(hueco, 0, ...nuevas);
    if (nuevas.length === 0) {
      while (salida.length > 0 && salida[salida.length - 1]!.t.trim() === '') salida.pop();
    }
    return salida.map((l) => l.t + l.eol).join('');
  }
  while (salida.length > 0 && salida[salida.length - 1]!.t.trim() === '') salida.pop();
  if (nuevas.length > 0 && salida.length > 0) {
    salida[salida.length - 1]!.eol ||= eolNuevo;
    salida.push({ t: '', eol: eolNuevo });
  }
  salida.push(...nuevas);
  return salida.map((l) => l.t + l.eol).join('');
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

/** Opciones del cálculo de una edición. */
export interface OpcionesCalculo {
  /** Sección de la V2 (`mcp.servers` de opencode): se usa si esa tabla existe. */
  seccionAlterna?: string;
  /**
   * La huella cubre solo la entrada `wolfcore` resultante, no el archivo entero (Claude Code
   * reescribe `~/.claude.json` a cada rato: el resto ajeno no debe provocar una vista desfasada;
   * que no se altere lo comprueba `editarEntradaMcp`).
   */
  huellaSoloEntrada?: boolean;
}

export interface EdicionCalculada {
  nuevo: string;
  /** Sección en la que se editó. */
  seccion: string;
  /** Huella (sha-256) de lo que se escribiría: la vista previa y `aplicar` la comparan. */
  huella: string;
}

const sha = (t: string): string => createHash('sha256').update(t, 'utf8').digest('hex');

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
  return calcularEdicion(formato, texto, seccion, valor, ruta).nuevo;
}

/** Como `editarEntradaMcp`, con la sección efectiva y la huella del resultado. */
export function calcularEdicion(
  formato: FormatoConfig,
  texto: string | null,
  seccionBase: string,
  valor: ValorEntradaMcp | undefined,
  ruta: string,
  o: OpcionesCalculo = {},
): EdicionCalculada {
  const original = texto ?? '';
  const antes = interpretarConfig(formato, original, ruta);
  const seccion = seccionEfectiva(
    antes,
    seccionBase,
    o.seccionAlterna,
    valor === undefined ? 'quitar' : 'conectar',
  );
  let nivel = '';
  for (const k of seccion.split('.')) {
    nivel = nivel === '' ? k : `${nivel}.${k}`;
    const t = nivel.split('.').reduce<unknown>((x, c) => (esTabla(x) ? x[c] : undefined), antes);
    if (t !== undefined && !esTabla(t)) throw ilegible(ruta, `"${nivel}" no es una tabla`);
  }
  let nuevo: string;
  if (formato === 'json') nuevo = editarJson(original, seccion, valor);
  else if (formato === 'toml') {
    nuevo = editarToml(original, seccion, valor, entradaMcp(antes, seccion) !== undefined, ruta);
  } else nuevo = editarYaml(original, seccion, valor, ruta);
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
  const huella = o.huellaSoloEntrada ? sha(JSON.stringify(ordenado(entrada) ?? null)) : sha(nuevo);
  return { nuevo, seccion, huella };
}

/** Copias con fecha que se guardan por archivo (las más nuevas). */
export const MAX_COPIAS_CONFIG = 5;

/** AAAAMMDD-HHmmss en hora local. */
function sello(f: Date): string {
  const n = (v: number): string => String(v).padStart(2, '0');
  return (
    `${f.getFullYear()}${n(f.getMonth() + 1)}${n(f.getDate())}-` +
    `${n(f.getHours())}${n(f.getMinutes())}${n(f.getSeconds())}`
  );
}

const escaparRegex = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Deja solo las `MAX_COPIAS_CONFIG` copias más nuevas de `ruta` (por su fecha y su número, no
 * por la fecha del archivo, que la copia puede conservar). Solo cuentan archivos con el nombre
 * exacto de una copia nuestra; un fallo al borrar una copia vieja no impide la edición.
 */
async function podarCopias(ruta: string): Promise<void> {
  const dir = path.dirname(ruta);
  const patron = new RegExp(
    String.raw`^${escaparRegex(path.basename(ruta))}\.wolfcore-(\d{8}-\d{6})(?:-(\d+))?\.bak$`,
  );
  let nombres: string[];
  try {
    nombres = await readdir(dir);
  } catch {
    return;
  }
  const copias: { nombre: string; sello: string; n: number }[] = [];
  for (const nombre of nombres) {
    const m = patron.exec(nombre);
    if (!m) continue;
    const info = await lstat(path.join(dir, nombre)).catch(() => null);
    if (!info?.isFile()) continue;
    copias.push({ nombre, sello: m[1]!, n: m[2] ? Number(m[2]) : 0 });
  }
  copias.sort((a, b) => (a.sello === b.sello ? b.n - a.n : a.sello < b.sello ? 1 : -1));
  for (const c of copias.slice(MAX_COPIAS_CONFIG)) {
    await rm(path.join(dir, c.nombre), { force: true }).catch(() => undefined);
  }
}

/**
 * Copia con fecha junto al archivo (`<archivo>.wolfcore-<fecha>.bak`), sin pisar otra copia, y
 * deja solo las `MAX_COPIAS_CONFIG` más nuevas. Devuelve su ruta, o null si el archivo no existía.
 */
export async function respaldarConfigAgente(
  ruta: string,
  ahora: Date = new Date(),
  enmascarar?: string,
  o: OpcionesConfig = {},
): Promise<string | null> {
  const r = await rutaReal(ruta, o);
  if (!r.existe) return null;
  const base = `${ruta}.wolfcore-${sello(ahora)}`;
  for (let i = 0; ; i++) {
    const destino = `${base}${i ? `-${i}` : ''}.bak`;
    try {
      if (enmascarar) {
        // Un token escrito a mano no se copia: la copia lo lleva como `***`.
        const t = (await readFile(r.ruta, 'utf8')).split(enmascarar).join('***');
        // Con los mismos permisos que el original (no más abiertos: puede traer otras claves).
        await writeFile(destino, t, { flag: 'wx', mode: r.modo });
      } else {
        await copyFile(r.ruta, destino, 1 /* COPYFILE_EXCL */);
      }
      await podarCopias(ruta);
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

/** Opciones de `editarConfigAgente` (todas opcionales). */
export interface OpcionesEdicionConfig extends OpcionesCalculo, OpcionesConfig {
  /**
   * Carpeta (la de inicio del usuario) desde la que cada componente de la ruta se comprueba con
   * `lstat`: una carpeta intermedia convertida en unión se rechaza, al empezar y otra vez justo
   * antes del reemplazo (si alguien la cambia entre medias).
   */
  raizSinEnlaces?: string;
  /**
   * Huella de la vista previa que vio el usuario. Se comprueba sobre lo que se va a escribir; si
   * no coincide falla con `asistentes.vista_desfasada` y NO se reintenta.
   */
  huellaEsperada?: string;
}

/** Solo para pruebas: un punto justo antes de reemplazar el archivo. */
export interface GanchosEdicionConfig {
  antesDeReemplazar?: () => Promise<void>;
}

/** El archivo cambió entre la lectura y el reemplazo (lo escribió el agente). */
class CambioConcurrente extends Error {}

/** Reintentos si el archivo cambia mientras se edita (el agente lo está escribiendo). */
const REINTENTOS_CAMBIO = 1;

/**
 * Edita la entrada `wolfcore` del archivo de un agente: lee, edita y comprueba en memoria; solo
 * si todo va bien hace la copia con fecha y escribe de forma atómica (conserva el BOM).
 *
 * Justo antes del reemplazo vuelve a leer el archivo: si cambió (el agente abierto lo guardó),
 * empieza de nuevo una vez con el contenido nuevo; si vuelve a cambiar, falla con
 * `agentes.config_en_uso` sin pisar lo que escribió el agente.
 */
export async function editarConfigAgente(
  ruta: string,
  formato: FormatoConfig,
  seccion: string,
  valor: ValorEntradaMcp | undefined,
  ahora?: Date,
  ganchos: GanchosEdicionConfig = {},
  enmascarar?: string,
  opciones: OpcionesEdicionConfig = {},
): Promise<ResultadoEdicionConfig> {
  for (let intento = 0; ; intento++) {
    try {
      return await editarConfigUnaVez(
        ruta,
        formato,
        seccion,
        valor,
        ahora,
        ganchos,
        enmascarar,
        opciones,
      );
    } catch (e) {
      if (!(e instanceof CambioConcurrente)) throw e;
      if (intento >= REINTENTOS_CAMBIO) {
        throw new ErrorWolf(
          'agentes.config_en_uso',
          `${path.basename(ruta)} cambió mientras se editaba: cierre el agente y vuelva a intentarlo.`,
          { archivo: path.basename(ruta) },
        );
      }
    }
  }
}

async function editarConfigUnaVez(
  ruta: string,
  formato: FormatoConfig,
  seccion: string,
  valor: ValorEntradaMcp | undefined,
  ahora: Date | undefined,
  ganchos: GanchosEdicionConfig,
  enmascarar: string | undefined,
  opciones: OpcionesEdicionConfig,
): Promise<ResultadoEdicionConfig> {
  if (opciones.raizSinEnlaces !== undefined) await exigirSinEnlaces(opciones.raizSinEnlaces, ruta);
  const real = await rutaReal(ruta, opciones);
  const crudo = real.existe ? await readFile(real.ruta, 'utf8') : null;
  const bom = crudo?.startsWith(BOM) ? BOM : '';
  const texto = crudo === null ? null : crudo.slice(bom.length);
  if (valor === undefined && texto === null) return { respaldo: null, cambiado: false };
  const calculo = calcularEdicion(formato, texto, seccion, valor, ruta, opciones);
  if (opciones.huellaEsperada !== undefined && calculo.huella !== opciones.huellaEsperada) {
    throw new ErrorWolf(
      'asistentes.vista_desfasada',
      'El archivo cambió desde la vista previa: revísela de nuevo.',
    );
  }
  const nuevo = calculo.nuevo;
  if (texto !== null && nuevo === texto) return { respaldo: null, cambiado: false };
  const respaldo = await respaldarConfigAgente(ruta, ahora, enmascarar, opciones);
  await mkdir(path.dirname(real.ruta), { recursive: true });
  await escribirAtomico(real.ruta, Buffer.from(bom + nuevo, 'utf8'), {
    renombrar: async (tmp, destino) => {
      await ganchos.antesDeReemplazar?.();
      // Otra vez justo antes del reemplazo: una carpeta cambiada por una unión en el medio.
      if (opciones.raizSinEnlaces !== undefined) {
        await exigirSinEnlaces(opciones.raizSinEnlaces, ruta);
      }
      const ahoraTexto = await readFile(destino, 'utf8').catch((e: NodeJS.ErrnoException) =>
        e.code === 'ENOENT' ? null : Promise.reject(e),
      );
      if (ahoraTexto !== crudo) throw new CambioConcurrente();
      await rename(tmp, destino);
    },
  });
  return { respaldo, cambiado: true };
}
