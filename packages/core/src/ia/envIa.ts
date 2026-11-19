import { randomBytes } from 'node:crypto';
import { copyFile, lstat, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { valorEnv, type EstiloEnv } from '../bd/env';
import { ErrorWolf } from '../errores';
import { escribirAtomico } from '../sitios/urlbase';
import { enmascararClave, errorIa } from './errores';
import {
  TIPOS_CON_CLAVE,
  URL_BASE_POR_DEFECTO,
  urlBaseDe,
  validarModeloIa,
  type ConfigProveedorIa,
} from './proveedores';

export const MARCA_INICIO_IA = '# >>> WolfCore Dev IA (no editar a mano)';
export const MARCA_FIN_IA = '# <<< WolfCore Dev IA';

/** Variables del bloque, en orden: [nombre, valor]. */
function variables(
  c: ConfigProveedorIa,
  clave: string,
  modelo: string | undefined,
): [string, string][] {
  const base = urlBaseDe(c);
  const m = modelo ?? c.modelo ?? undefined;
  if (m !== undefined) validarModeloIa(m);
  const vars: [string, string][] = [];
  switch (c.tipo) {
    case 'ollama':
      vars.push(
        ['OLLAMA_HOST', base],
        ['OLLAMA_BASE_URL', base],
        ['OPENAI_BASE_URL', `${base}/v1`],
      );
      break;
    case 'anthropic':
      vars.push(['ANTHROPIC_API_KEY', clave]);
      // La URL solo se escribe si se cambió (los SDK ya usan la oficial).
      if (c.urlBase !== null && base !== URL_BASE_POR_DEFECTO.anthropic) {
        vars.push(['ANTHROPIC_BASE_URL', base]);
      }
      break;
    case 'gemini':
      vars.push(['GEMINI_API_KEY', clave]);
      if (c.urlBase !== null && base !== URL_BASE_POR_DEFECTO.gemini) {
        vars.push(['GEMINI_BASE_URL', base]);
      }
      break;
    default:
      // OpenAI, Hermes (Nous) y compatibles: el SDK de OpenAI con su URL base.
      if (clave) vars.push(['OPENAI_API_KEY', clave]);
      vars.push(['OPENAI_BASE_URL', base]);
  }
  if (m !== undefined) vars.push(['AI_MODEL', m]);
  return vars;
}

/** Marca de orden de bytes (se conserva si el .env la tenía). */
const BOM = String.fromCharCode(0xfeff);
/** Claves de proveedores: ASCII visible, sin espacios ni saltos de línea. */
const CLAVE_VALIDA = /^[\x21-\x7e]{1,4096}$/;

const esVariableClave = (nombre: string): boolean => nombre.endsWith('_API_KEY');

/** Une las líneas entre marcas; `mascara` reemplaza el valor de las variables de clave. */
function armar(vars: [string, string][], estilo: EstiloEnv, mascara?: string): string {
  const lineas = vars.map(([n, v]) => {
    if (mascara !== undefined && esVariableClave(n)) return `${n}=${mascara}`;
    if (/[\r\n\0]/.test(v)) {
      throw new ErrorWolf('ia.proveedor_invalido', 'Valor no válido para .env');
    }
    return `${n}=${valorEnv(v, estilo)}`;
  });
  return [MARCA_INICIO_IA, ...lineas, MARCA_FIN_IA, ''].join('\n');
}

/**
 * Bloque `.env` de IA del proveedor entre marcas propias (LF, termina en salto). Los valores
 * se escriben con las reglas del lector del proyecto (`valorEnv`). Es texto puro.
 */
export function bloqueEnvIa(
  c: ConfigProveedorIa,
  clave: string,
  modelo?: string,
  estilo: EstiloEnv = 'dotenv',
): string {
  if (!clave && TIPOS_CON_CLAVE.has(c.tipo)) throw errorIa('ia.sin_clave');
  if (clave && !CLAVE_VALIDA.test(clave)) throw errorIa('ia.clave_mal_formada');
  return armar(variables(c, clave, modelo), estilo);
}

/** El mismo bloque para previsualizar: la clave sale como `****` y sus 4 últimos caracteres. */
export function bloqueEnvIaEnmascarado(
  c: ConfigProveedorIa,
  clave: string | null,
  modelo?: string,
  estilo: EstiloEnv = 'dotenv',
): string {
  // Un marcador para que la variable se vea aunque todavía no haya clave guardada.
  const marcador = clave || (TIPOS_CON_CLAVE.has(c.tipo) ? 'x' : '');
  return armar(variables(c, marcador, modelo), estilo, enmascararClave(clave));
}

const escapar = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Valor sin comillas de una línea `CLAVE=valor` (para comparar con el del bloque). */
function valorDeLinea(linea: string): string {
  const v = linea.slice(linea.indexOf('=') + 1).trim();
  const q = v[0];
  if ((q === '"' || q === "'") && v.lastIndexOf(q) > 0) return v.slice(1, v.lastIndexOf(q));
  return v.replace(/\s+#.*$/, '');
}

export interface ResultadoBloqueEnvIa {
  texto: string;
  /** Variables que ya estaban fuera del bloque con otro valor (y se reemplazaron). */
  conflictos: string[];
}

/**
 * Pone el bloque en el texto de un `.env`: reemplaza el bloque anterior de WolfCore Dev en su
 * sitio o lo agrega al final, con el fin de línea del archivo. Una variable del bloque que ya
 * está fuera de él con OTRO valor es un conflicto: sin `reemplazarAjenas` lanza
 * `ia.env_conflicto` (solo con los nombres, nunca los valores); con él, quita esas líneas. Las
 * de igual valor se quitan siempre para no dejar dos definiciones.
 */
export function aplicarBloqueEnvIa(
  actual: string,
  bloque: string,
  o: { reemplazarAjenas?: boolean } = {},
): ResultadoBloqueEnvIa {
  const bom = actual.startsWith(BOM) ? BOM : '';
  const cuerpo = actual.slice(bom.length);
  const eol = cuerpo.includes('\r\n') ? '\r\n' : '\n';
  const lineas = cuerpo === '' ? [] : cuerpo.split(/\r?\n/);
  if (lineas.length > 0 && lineas[lineas.length - 1] === '') lineas.pop();

  // Sin el bloque anterior; se recuerda dónde estaba.
  let posicion = -1;
  let dentro = false;
  const fuera: string[] = [];
  for (const l of lineas) {
    const t = l.trim();
    if (!dentro && t.startsWith('# >>> WolfCore Dev IA')) {
      dentro = true;
      if (posicion < 0) posicion = fuera.length;
    } else if (dentro) {
      if (t.startsWith('# <<< WolfCore Dev IA')) dentro = false;
    } else {
      fuera.push(l);
    }
  }

  const nuevas = bloque
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), valorDeLinea(l)] as const);
  const conflictos: string[] = [];
  const quitar = new Set<number>();
  for (const [nombre, valor] of nuevas) {
    const re = new RegExp(`^[ \\t]*(?:export[ \\t]+)?${escapar(nombre)}[ \\t]*=`);
    fuera.forEach((l, i) => {
      if (!re.test(l)) return;
      if (valorDeLinea(l) !== valor && !conflictos.includes(nombre)) conflictos.push(nombre);
      quitar.add(i);
    });
  }
  if (conflictos.length > 0 && !o.reemplazarAjenas) {
    throw new ErrorWolf(
      'ia.env_conflicto',
      `El .env ya define ${conflictos.join(', ')} con otro valor; confirme si quiere reemplazarlo.`,
      { claves: conflictos.join(', ') },
    );
  }

  const antes: string[] = [];
  const despues: string[] = [];
  fuera.forEach((l, i) => {
    if (quitar.has(i)) return;
    (posicion >= 0 && i >= posicion ? despues : antes).push(l);
  });
  const salida = [...antes, ...bloque.replace(/\n$/, '').split('\n'), ...despues];
  return { texto: bom + salida.join(eol) + eol, conflictos };
}

/** AAAAMMDD-HHmmss-mmm en hora local. */
function sello(f: Date): string {
  const n = (v: number, l = 2): string => String(v).padStart(l, '0');
  return (
    `${f.getFullYear()}${n(f.getMonth() + 1)}${n(f.getDate())}-` +
    `${n(f.getHours())}${n(f.getMinutes())}${n(f.getSeconds())}-${n(f.getMilliseconds(), 3)}`
  );
}

/** Lee un archivo de texto del proyecto; null si no existe. Se niega a seguir enlaces. */
async function leerArchivoProyecto(ruta: string): Promise<string | null> {
  let info;
  try {
    info = await lstat(ruta);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
  if (!info.isFile()) {
    throw new Error(`${path.basename(ruta)} no es un archivo normal; no se modificó.`);
  }
  return readFile(ruta, 'utf8');
}

/** Ids de sitio que pueden ir en el nombre de una copia (como `rutas.receta`). */
const ID_SITIO = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
/** Copias del .env que se guardan por sitio (las más viejas se borran). */
export const MAX_RESPALDOS_ENV = 5;

function validarSitio(sitioId: string): void {
  if (typeof sitioId !== 'string' || !ID_SITIO.test(sitioId) || sitioId.includes('..')) {
    throw new Error('Id de sitio no válido.');
  }
}

/** Copia con fecha en `carpetaRespaldos` (fuera del proyecto: nunca acaba en el repositorio). */
async function respaldar(ruta: string, carpetaRespaldos: string, prefijo: string): Promise<string> {
  await mkdir(carpetaRespaldos, { recursive: true });
  const nombre = `${prefijo}-${sello(new Date())}-${randomBytes(3).toString('hex')}.respaldo`;
  const destino = path.join(carpetaRespaldos, nombre);
  await copyFile(ruta, destino);
  return destino;
}

/** Copias `env-<sitio>-…` (las de un sitio, o todas), de la más vieja a la más nueva. */
async function copiasEnv(carpetaRespaldos: string, sitioId?: string): Promise<string[]> {
  let nombres: string[];
  try {
    nombres = await readdir(carpetaRespaldos);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const re = sitioId
    ? new RegExp(String.raw`^env-${escapar(sitioId)}-\d{8}-\d{6}-\d{3}-[0-9a-f]{6}\.respaldo$`)
    : /^env-.+\.respaldo$/;
  // Mismo prefijo por sitio: el orden del nombre es el de la fecha.
  return nombres.filter((n) => re.test(n)).sort();
}

/**
 * Borra las copias del .env de un sitio (o de todos sin `sitioId`). Llevan la clave en texto
 * plano: se usa al borrar la clave de un proveedor, con la confirmación de la interfaz.
 */
export async function limpiarRespaldosEnv(
  carpetaRespaldos: string,
  sitioId?: string,
): Promise<void> {
  if (sitioId !== undefined) validarSitio(sitioId);
  for (const n of await copiasEnv(carpetaRespaldos, sitioId)) {
    await rm(path.join(carpetaRespaldos, n), { force: true });
  }
}

/**
 * Comprueba, sin escribir nada, que el bloque se podría poner en `<carpeta>/.env`: lanza
 * `ia.env_conflicto` (o el error de un .env que no es un archivo normal) igual que
 * `escribirEnvIa`. Sirve para no tocar otros archivos (el .gitignore) antes de saberlo.
 */
export async function comprobarEnvIa(
  carpeta: string,
  bloque: string,
  o: { reemplazarAjenas?: boolean } = {},
): Promise<{ conflictos: string[] }> {
  const actual = await leerArchivoProyecto(path.join(carpeta, '.env'));
  const r = aplicarBloqueEnvIa(actual ?? '', bloque, { reemplazarAjenas: o.reemplazarAjenas });
  return { conflictos: r.conflictos };
}

export interface OpcionesEscribirEnvIa {
  /** Lo exige siempre: la interfaz avisó que la clave queda en texto plano. */
  confirmado: true;
  /** Reemplaza variables que el .env ya tenía con otro valor (confirmación aparte). */
  reemplazarAjenas?: boolean;
  /** Carpeta de las copias previas (en la carpeta de datos de WolfCore Dev). */
  carpetaRespaldos: string;
  /** Id del sitio: va en el nombre de la copia (`env-<sitio>-<fecha>.respaldo`). */
  sitioId: string;
  /**
   * ¿Git ya sigue el .env? (`Git.versionado`). true = el próximo commit subiría la clave;
   * null = desconocido (no bloquea; la interfaz avisa).
   */
  versionado: (carpeta: string) => Promise<boolean | null>;
  /** Confirmación aparte para escribir en un .env que git ya sigue. */
  aceptarVersionado?: boolean;
}

/**
 * Escribe el bloque de IA en `<carpeta>/.env` de forma atómica, con copia previa con fecha del
 * archivo anterior (como mucho `MAX_RESPALDOS_ENV` por sitio). No toca nada si hay conflictos
 * sin `reemplazarAjenas` o si git ya sigue el .env sin `aceptarVersionado`.
 */
export async function escribirEnvIa(
  carpeta: string,
  bloque: string,
  o: OpcionesEscribirEnvIa,
): Promise<{ respaldo: string | null; conflictos: string[] }> {
  if (o?.confirmado !== true) {
    throw new ErrorWolf(
      'ia.env_sin_confirmar',
      'Confirme que quiere escribir la clave en el .env (queda en texto plano).',
    );
  }
  validarSitio(o.sitioId);
  if ((await o.versionado(carpeta)) === true && o.aceptarVersionado !== true) {
    throw new ErrorWolf(
      'ia.env_versionado',
      'Git ya sigue el .env de este proyecto: el próximo commit subiría la clave aunque esté en .gitignore. Quítelo del índice con "git rm --cached .env" o confirme aparte.',
    );
  }
  const destino = path.join(carpeta, '.env');
  const actual = await leerArchivoProyecto(destino);
  const r = aplicarBloqueEnvIa(actual ?? '', bloque, {
    reemplazarAjenas: o.reemplazarAjenas === true,
  });
  let respaldo: string | null = null;
  if (actual !== null) {
    respaldo = await respaldar(destino, o.carpetaRespaldos, `env-${o.sitioId}`);
  }
  await escribirAtomico(destino, Buffer.from(r.texto, 'utf8'));
  if (respaldo) {
    const copias = await copiasEnv(o.carpetaRespaldos, o.sitioId);
    for (const n of copias.slice(0, Math.max(0, copias.length - MAX_RESPALDOS_ENV))) {
      await rm(path.join(o.carpetaRespaldos, n), { force: true });
    }
  }
  return { respaldo, conflictos: r.conflictos };
}

/** Convierte un patrón de .gitignore en una expresión para una ruta relativa a la raíz. */
function patronGitignore(p: string): RegExp | null {
  let t = p;
  if (t.endsWith('/')) return null; // solo carpetas: no aplica a un archivo
  const anclado = t.startsWith('/') || t.slice(0, -1).includes('/');
  t = t.replace(/^\//, '');
  let re = '';
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if (t.startsWith('**/', i)) {
      re += '(?:.*/)?';
      i += 2;
    } else if (t.startsWith('**', i)) {
      re += '.*';
      i += 1;
    } else if (ch === '*') re += '[^/]*';
    else if (ch === '?') re += '[^/]';
    else if (ch === '\\' && i + 1 < t.length) re += escapar(t[++i]!);
    else re += escapar(ch);
  }
  return new RegExp(anclado ? `^${re}$` : `^(?:.*/)?${re}$`);
}

export interface EstadoGitignore {
  existe: boolean;
  ignoraEnv: boolean;
  /** Git ya sigue el .env (null = desconocido o no se comprobó). .gitignore no lo destrapa. */
  envVersionado: boolean | null;
}

/**
 * Dice si el `.gitignore` de la carpeta existe, si ignora el `.env` de la raíz y, con
 * `versionado` (`Git.versionado`), si git ya lo sigue.
 */
export async function estadoGitignore(
  carpeta: string,
  o: { versionado?: (carpeta: string) => Promise<boolean | null> } = {},
): Promise<EstadoGitignore> {
  const envVersionado = o.versionado ? await o.versionado(carpeta) : null;
  const texto = await leerArchivoProyecto(path.join(carpeta, '.gitignore'));
  if (texto === null) return { existe: false, ignoraEnv: false, envVersionado };
  let ignora = false;
  for (const bruta of (texto.startsWith(BOM) ? texto.slice(1) : texto).split(/\r?\n/)) {
    const l = bruta.replace(/(?<!\\)\s+$/, '');
    if (!l || l.startsWith('#')) continue;
    const negada = l.startsWith('!');
    const re = patronGitignore(negada ? l.slice(1) : l);
    if (re?.test('.env')) ignora = !negada;
  }
  return { existe: true, ignoraEnv: ignora, envVersionado };
}

/** Agrega `.env` al `.gitignore` (lo crea si falta), con copia previa con fecha. */
export async function agregarEnvAGitignore(
  carpeta: string,
  carpetaRespaldos: string,
): Promise<{ respaldo: string | null }> {
  const ruta = path.join(carpeta, '.gitignore');
  const actual = await leerArchivoProyecto(ruta);
  if (actual !== null && (await estadoGitignore(carpeta)).ignoraEnv) return { respaldo: null };
  const eol = actual?.includes('\r\n') ? '\r\n' : '\n';
  const base = actual ?? '';
  const nuevo = `${base}${base && !/\r?\n$/.test(base) ? eol : ''}.env${eol}`;
  const respaldo = actual !== null ? await respaldar(ruta, carpetaRespaldos, 'gitignore') : null;
  await escribirAtomico(ruta, Buffer.from(nuevo, 'utf8'));
  return { respaldo };
}
