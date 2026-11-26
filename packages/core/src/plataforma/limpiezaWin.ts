import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
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
  /** Nombres de las subcarpetas (no enlaces) de `dir`; [] si no existe. */
  subcarpetas(dir: string): Promise<string[]>;
  existeCarpeta(dir: string): Promise<boolean>;
  leerTexto(archivo: string): Promise<string | null>;
}

export const lecturaReal: LecturaDisco = {
  async subcarpetas(dir) {
    try {
      const e = await readdir(dir, { withFileTypes: true });
      return e.filter((x) => x.isDirectory() && !x.isSymbolicLink()).map((x) => x.name);
    } catch {
      return [];
    }
  },
  async existeCarpeta(dir) {
    try {
      return (await stat(dir)).isDirectory();
    } catch {
      return false;
    }
  },
  async leerTexto(archivo) {
    try {
      return await readFile(archivo, 'utf8');
    } catch {
      return null;
    }
  },
};

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
  temporalPorDefecto = 'C:\\Windows\\Temp',
): Promise<RutasCategoriaLimpieza[]> {
  const local = env.LOCALAPPDATA ?? '';
  const roaming = env.APPDATA ?? '';
  const windir = env.SystemRoot ?? env.SYSTEMROOT ?? env.windir ?? 'C:\\Windows';
  const temp = env.TEMP ?? env.TMP ?? temporalPorDefecto;
  const res: RutasCategoriaLimpieza[] = [];
  const agregar = (
    categoria: CategoriaLimpieza,
    rutas: string[],
    requiereAdmin = false,
    navegador?: NavegadorLimpieza,
  ): void => {
    res.push({ categoria, rutas, requiereAdmin, ...(navegador ? { navegador } : {}) });
  };
  agregar('temp', [temp]);
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
