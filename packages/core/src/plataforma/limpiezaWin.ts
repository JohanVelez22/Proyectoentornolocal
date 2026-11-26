import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rutaSistema32 } from './procesosWin';
import type { CategoriaLimpieza, NavegadorLimpieza, RutasCategoriaLimpieza } from './tipos';

/**
 * Rutas de la limpieza de disco (D37) en Windows. SOLO LEE: enumera carpetas y devuelve rutas; el
 * borrado lo hace el núcleo (`sistema/limpiezaDisco.ts`), que no sale de lo que se devuelve aquí.
 *
 * En los perfiles de los navegadores solo se devuelven las carpetas de caché: `Cache`,
 * `Code Cache`, `GPUCache` y `cache2`. Nunca el perfil, ni `Cookies`, `Login Data`, `History`,
 * `places.sqlite`, `Local Storage`, `IndexedDB` ni `Sessions`.
 */

/** Únicas carpetas de un perfil de navegador que se pueden limpiar. */
export const CARPETAS_CACHE_NAVEGADOR = ['Cache', 'Code Cache', 'GPUCache', 'cache2'] as const;

/** Nombre del proceso de cada navegador (sin distinguir mayúsculas). */
export const PROCESOS_NAVEGADOR: Readonly<Record<NavegadorLimpieza, string[]>> = {
  chrome: ['chrome.exe'],
  edge: ['msedge.exe'],
  brave: ['brave.exe'],
  firefox: ['firefox.exe'],
};

/** Navegadores con algún proceso en la lista de nombres de procesos dada. */
export function navegadoresDeProcesos(nombres: readonly string[]): NavegadorLimpieza[] {
  const vistos = new Set(nombres.map((n) => n.toLowerCase()));
  return (Object.keys(PROCESOS_NAVEGADOR) as NavegadorLimpieza[]).filter((n) =>
    PROCESOS_NAVEGADOR[n].some((p) => vistos.has(p)),
  );
}

/** Perfiles de Chromium: `Default` y `Profile N`. */
export const PERFIL_CHROMIUM = /^(?:Default|Profile \d{1,3})$/;

/** Rutas de `Path=` de un `profiles.ini` de Firefox (relativas o absolutas); solo el nombre final. */
export function nombresPerfilesFirefox(ini: string): string[] {
  const res: string[] = [];
  for (const linea of ini.split(/\r?\n/)) {
    const m = /^\s*Path\s*=\s*(.+?)\s*$/i.exec(linea);
    if (!m) continue;
    const nombre = m[1]!
      .split(/[\\/]+/)
      .filter((t) => t !== '')
      .pop();
    if (nombre && nombre !== '.' && nombre !== '..' && !res.includes(nombre)) res.push(nombre);
  }
  return res;
}

export interface LecturaDisco {
  /** Nombres de las subcarpetas (no enlaces ni uniones, con `lstat`) de `dir`; [] si no existe. */
  subcarpetas(dir: string): Promise<string[]>;
  /** true solo si es una carpeta de verdad (con `lstat`: un enlace o una unión no cuenta). */
  existeCarpeta(dir: string): Promise<boolean>;
  leerTexto(archivo: string): Promise<string | null>;
  /** Ruta real (sin enlaces ni nombres cortos 8.3); null si no existe o no se puede leer. */
  canonica(ruta: string): Promise<string | null>;
}

const esCarpetaReal = async (r: string): Promise<boolean> => {
  try {
    const st = await lstat(r);
    return st.isDirectory() && !st.isSymbolicLink();
  } catch {
    return false;
  }
};

export const lecturaReal: LecturaDisco = {
  async subcarpetas(dir) {
    try {
      const e = await readdir(dir, { withFileTypes: true });
      const res: string[] = [];
      for (const x of e) {
        if (!x.isDirectory() || x.isSymbolicLink()) continue;
        if (await esCarpetaReal(path.join(dir, x.name))) res.push(x.name);
      }
      return res;
    } catch {
      return [];
    }
  },
  existeCarpeta: esCarpetaReal,
  async leerTexto(archivo) {
    try {
      return await readFile(archivo, 'utf8');
    } catch {
      return null;
    }
  },
  async canonica(ruta) {
    try {
      return await realpath(ruta);
    } catch {
      return null;
    }
  },
};

/**
 * Forma comparable de una ruta: barras `/`, sin barra final, en minúsculas y sin el prefijo
 * `\\?\` (`\\?\UNC\` vuelve a ser `//servidor/...`).
 */
export function normalizarRuta(r: string): string {
  let s = r.replace(/\\/g, '/');
  if (/^\/\/\?\/unc\//i.test(s)) s = `//${s.slice(8)}`;
  else if (s.startsWith('//?/')) s = s.slice(4);
  return s.replace(/\/+$/, '').toLowerCase();
}

/** `hija` es `padre` o está dentro (comparando rutas normalizadas). */
export function rutaDentroDe(padre: string, hija: string): boolean {
  const p = normalizarRuta(padre);
  const h = normalizarRuta(hija);
  return h === p || h.startsWith(`${p}/`);
}

/** Ruta UNC (`\\servidor\recurso`, también `\\localhost\C$`), ya normalizada. */
const esUnc = (n: string): boolean => n.startsWith('//');
/** Raíz de una unidad (`C:`, `C:\`), ya normalizada. */
const esRaizUnidad = (n: string): boolean => /^[a-z]:$/.test(n);
const conUnidad = (n: string): boolean => /^[a-z]:\//.test(n);

/** Carpetas conocidas del perfil que TEMP nunca puede ser (ni estar dentro de ellas). */
export const CARPETAS_USUARIO = [
  'Documents',
  'Desktop',
  'Downloads',
  'Pictures',
  'Music',
  'Videos',
  'Documentos',
  'Escritorio',
  'Descargas',
  'Imágenes',
  'Música',
  'Vídeos',
] as const;

const NOMBRES_TEMP = new Set(['temp', 'tmp']);

export interface ContextoTemp {
  /** `%LOCALAPPDATA%` (ya validado dentro del perfil) o '' si no vale. */
  local: string;
  /** `%USERPROFILE%` o '' si no se conoce. */
  perfil: string;
  /** `os.tmpdir()` del proceso. */
  tmpdir: string;
}

/**
 * ¿Se puede limpiar `temp` como carpeta TEMP? Solo si su ruta real es `%LOCALAPPDATA%\Temp` (o
 * una subcarpeta numérica, `Temp\2`, la de las sesiones de Escritorio remoto) o la de
 * `os.tmpdir()`, su nombre es `Temp` o `Tmp` y no es una raíz de unidad, una ruta UNC, el perfil
 * del usuario o un ancestro suyo, ni está en Documentos, Escritorio, Descargas, Imágenes, Música,
 * Vídeos u OneDrive. `ausente` si no existe (no hay nada que limpiar).
 */
export async function validarTemp(
  temp: string,
  ctx: ContextoTemp,
  lec: Pick<LecturaDisco, 'canonica'>,
): Promise<'valido' | 'invalido' | 'ausente'> {
  const cruda = normalizarRuta(temp);
  if (esUnc(cruda) || esRaizUnidad(cruda) || !conUnidad(cruda)) return 'invalido';
  const real = await lec.canonica(temp);
  if (real === null) return 'ausente';
  const n = normalizarRuta(real);
  if (esUnc(n) || esRaizUnidad(n) || !conUnidad(n)) return 'invalido';
  const partes = n.split('/');
  const ultimo = partes[partes.length - 1] ?? '';
  const nombreOk =
    NOMBRES_TEMP.has(ultimo) ||
    (/^\d{1,4}$/.test(ultimo) && NOMBRES_TEMP.has(partes[partes.length - 2] ?? ''));
  if (!nombreOk) return 'invalido';
  if (ctx.perfil !== '') {
    const perfil = normalizarRuta((await lec.canonica(ctx.perfil)) ?? ctx.perfil);
    // El perfil o cualquier ancestro suyo (C:\Users, C:\…).
    if (rutaDentroDe(n, perfil)) return 'invalido';
    if (rutaDentroDe(perfil, n)) {
      const primera = n.slice(perfil.length + 1).split('/')[0] ?? '';
      if (CARPETAS_USUARIO.some((c) => c.toLowerCase() === primera)) return 'invalido';
      if (primera.startsWith('onedrive')) return 'invalido';
    }
  }
  if (ctx.local !== '') {
    const local = normalizarRuta((await lec.canonica(ctx.local)) ?? ctx.local);
    const resto = n.startsWith(`${local}/`) ? n.slice(local.length + 1) : null;
    if (resto !== null && /^temp(?:\/\d{1,4})?$/.test(resto)) return 'valido';
  }
  if (ctx.tmpdir !== '') {
    const tmp = normalizarRuta((await lec.canonica(ctx.tmpdir)) ?? ctx.tmpdir);
    if (n === tmp) return 'valido';
  }
  return 'invalido';
}

/** `hija` está estrictamente dentro de `padre` (con sus rutas reales si existen). */
async function dentroEstricto(
  padre: string,
  hija: string,
  lec: Pick<LecturaDisco, 'canonica'>,
): Promise<boolean> {
  if (padre === '' || hija === '') return false;
  const p = normalizarRuta((await lec.canonica(padre)) ?? padre);
  const h = normalizarRuta((await lec.canonica(hija)) ?? hija);
  return conUnidad(h) && !esUnc(h) && h.startsWith(`${p}/`);
}

async function existentes(rutas: string[], lec: LecturaDisco): Promise<string[]> {
  const res: string[] = [];
  for (const r of rutas) if (await lec.existeCarpeta(r)) res.push(r);
  return res;
}

async function cachesChromium(raiz: string, lec: LecturaDisco): Promise<string[]> {
  const perfiles = (await lec.subcarpetas(raiz)).filter((n) => PERFIL_CHROMIUM.test(n));
  const candidatas: string[] = [];
  for (const p of perfiles) {
    for (const c of CARPETAS_CACHE_NAVEGADOR) {
      if (c === 'cache2') continue;
      candidatas.push(path.win32.join(raiz, p, c));
    }
  }
  return existentes(candidatas, lec);
}

async function cachesFirefox(local: string, roaming: string, lec: LecturaDisco): Promise<string[]> {
  const raizLocal = path.win32.join(local, 'Mozilla', 'Firefox', 'Profiles');
  const raizRoaming = path.win32.join(roaming, 'Mozilla', 'Firefox', 'Profiles');
  const ini = await lec.leerTexto(path.win32.join(roaming, 'Mozilla', 'Firefox', 'profiles.ini'));
  const nombres = new Set<string>(ini === null ? [] : nombresPerfilesFirefox(ini));
  for (const n of await lec.subcarpetas(raizLocal)) nombres.add(n);
  for (const n of await lec.subcarpetas(raizRoaming)) nombres.add(n);
  const candidatas: string[] = [];
  for (const n of nombres) {
    candidatas.push(path.win32.join(raizLocal, n, 'cache2'));
    candidatas.push(path.win32.join(raizRoaming, n, 'cache2'));
  }
  return existentes(candidatas, lec);
}

/**
 * Todas las categorías con sus rutas. `carpetaDatos` es la carpeta de datos activa de WolfCore
 * Dev: de ella salen solo `tmp` (descargas en caché) y `logs` (registros), nunca `data` ni
 * `respaldos`.
 */
export async function rutasLimpiezaWindows(
  env: NodeJS.ProcessEnv,
  carpetaDatos: string,
  lec: LecturaDisco = lecturaReal,
  temporalDelProceso: string = tmpdir(),
): Promise<RutasCategoriaLimpieza[]> {
  const perfil = env.USERPROFILE ?? '';
  // LOCALAPPDATA y APPDATA solo valen si están dentro del perfil del usuario; si no, las
  // categorías que salen de ellas no se ofrecen.
  const local = (await dentroEstricto(perfil, env.LOCALAPPDATA ?? '', lec))
    ? (env.LOCALAPPDATA ?? '')
    : '';
  const roaming = (await dentroEstricto(perfil, env.APPDATA ?? '', lec)) ? (env.APPDATA ?? '') : '';
  // La carpeta de Windows es la de System32 un nivel por encima (la misma que usa el resto).
  const windir = path.win32.dirname(rutaSistema32(env));
  const temp = env.TEMP ?? env.TMP ?? temporalDelProceso;
  const res: RutasCategoriaLimpieza[] = [];
  const agregar = (
    categoria: CategoriaLimpieza,
    rutas: string[],
    requiereAdmin = false,
    navegador?: NavegadorLimpieza,
  ): void => {
    res.push({ categoria, rutas, requiereAdmin, ...(navegador ? { navegador } : {}) });
  };
  const estadoTemp = await validarTemp(temp, { local, perfil, tmpdir: temporalDelProceso }, lec);
  if (estadoTemp === 'invalido') {
    res.push({ categoria: 'temp', rutas: [], requiereAdmin: false, bloqueo: 'temp-no-seguro' });
  } else {
    agregar('temp', estadoTemp === 'valido' ? [temp] : []);
  }
  if (local !== '') {
    agregar(
      'cache-chrome',
      await cachesChromium(path.win32.join(local, 'Google', 'Chrome', 'User Data'), lec),
      false,
      'chrome',
    );
    agregar(
      'cache-edge',
      await cachesChromium(path.win32.join(local, 'Microsoft', 'Edge', 'User Data'), lec),
      false,
      'edge',
    );
    agregar(
      'cache-brave',
      await cachesChromium(
        path.win32.join(local, 'BraveSoftware', 'Brave-Browser', 'User Data'),
        lec,
      ),
      false,
      'brave',
    );
    agregar('cache-firefox', await cachesFirefox(local, roaming || local, lec), false, 'firefox');
  }
  agregar('wolfcore-descargas', [path.win32.join(carpetaDatos, 'tmp')]);
  agregar('wolfcore-registros', [path.win32.join(carpetaDatos, 'logs')]);
  agregar('prefetch', [path.win32.join(windir, 'Prefetch')], true);
  return res;
}

/** Script que dice si el proceso actual tiene el token de administrador (no pide elevación). */
export const SCRIPT_ES_ADMIN = [
  "$ErrorActionPreference = 'Stop'",
  '$p = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())',
  '[Console]::Out.Write($p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))',
].join('\n');
