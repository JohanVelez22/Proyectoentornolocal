import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
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

/**
 * Carpetas de referencia de la limpieza. NUNCA salen de las variables de entorno (TEMP,
 * USERPROFILE o LOCALAPPDATA las puede poner cualquiera que lance el proceso): el perfil sale del
 * token (`os.userInfo().homedir`) y el resto de `[Environment]::GetFolderPath` y del registro
 * (`Shell Folders`), así que una carpeta movida (Documentos en `D:\`) o OneDrive también cuentan.
 */
export interface AnclasLimpieza {
  /** Perfil del usuario (del token). */
  perfil: string;
  /** LocalApplicationData. */
  local: string;
  /** ApplicationData (Roaming). */
  roaming: string;
  /** Carpeta de Windows. */
  windows: string;
  /** Documentos, Escritorio, Imágenes, Música, Vídeos, Descargas y las de OneDrive. */
  conocidas: string[];
}

/**
 * Script que imprime en JSON las carpetas de `AnclasLimpieza` (sin el perfil, que da Node). Solo
 * lee; no depende de TEMP, USERPROFILE ni LOCALAPPDATA.
 */
export const SCRIPT_ANCLAS_LIMPIEZA = [
  "$ErrorActionPreference = 'Stop'",
  // UTF-8 para que una carpeta con tildes llegue bien.
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
  '$g = { param($n) [Environment]::GetFolderPath([Environment+SpecialFolder]::$n) }',
  '$c = @()',
  "foreach ($n in 'MyDocuments','Desktop','MyPictures','MyMusic','MyVideos') { $c += & $g $n }",
  'try {',
  "  $sf = Get-ItemProperty -LiteralPath 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'",
  "  $d = $sf.'{374DE290-123F-4565-9164-39C4925E467B}'",
  '  if ($d) { $c += $d }',
  '} catch {}',
  'try {',
  "  $od = Get-ItemProperty -LiteralPath 'HKCU:\\Software\\Microsoft\\OneDrive' -ErrorAction SilentlyContinue",
  '  if ($od -and $od.UserFolder) { $c += $od.UserFolder }',
  "  Get-ChildItem -LiteralPath 'HKCU:\\Software\\Microsoft\\OneDrive\\Accounts' -ErrorAction SilentlyContinue | ForEach-Object {",
  '    $u = (Get-ItemProperty -LiteralPath $_.PSPath -ErrorAction SilentlyContinue).UserFolder',
  '    if ($u) { $c += $u }',
  '  }',
  '} catch {}',
  '$r = [ordered]@{',
  "  local = & $g 'LocalApplicationData'",
  "  roaming = & $g 'ApplicationData'",
  "  windows = & $g 'Windows'",
  '  conocidas = @($c | Where-Object { $_ })',
  '}',
  '[Console]::Out.Write(($r | ConvertTo-Json -Compress))',
].join('\n');

/** Ruta absoluta con unidad que no es la raíz de la unidad (`C:\algo`). */
const rutaConUnidad = (r: unknown): r is string =>
  typeof r === 'string' && /^[A-Za-z]:\\[^"<>|?*\0]+$/.test(r) && !/(^|\\)\.\.(\\|$)/.test(r);

/** Lee la salida de `SCRIPT_ANCLAS_LIMPIEZA`; null si falta algo o no es una ruta válida. */
export function interpretarAnclas(salida: string, perfil: string): AnclasLimpieza | null {
  let j: unknown;
  try {
    j = JSON.parse(salida.trim());
  } catch {
    return null;
  }
  const o = j as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object') return null;
  if (!rutaConUnidad(perfil) || !rutaConUnidad(o.local) || !rutaConUnidad(o.windows)) return null;
  const lista = Array.isArray(o.conocidas) ? o.conocidas : o.conocidas ? [o.conocidas] : [];
  return {
    perfil,
    local: o.local,
    roaming: rutaConUnidad(o.roaming) ? o.roaming : '',
    windows: o.windows,
    conocidas: lista.filter(rutaConUnidad),
  };
}

export interface ContextoTemp {
  /** Perfil del usuario (ruta real). */
  perfil: string;
  /** LocalApplicationData (ruta real, ya comprobada dentro del perfil). */
  local: string;
  /** Carpeta de Windows (ruta real) o '' si no vale. */
  windows: string;
  /** Carpetas conocidas del usuario (rutas reales). */
  conocidas: string[];
}

export type EstadoTemp =
  { estado: 'valido'; real: string } | { estado: 'invalido' } | { estado: 'ausente' };

/**
 * ¿Se puede limpiar `temp` como carpeta TEMP? Solo si su ruta real es `<LocalAppData>\Temp`,
 * `<LocalAppData>\Temp\<N>` (sesiones de Escritorio remoto) o `<Windows>\Temp`, con las anclas
 * reales (nunca del entorno). Además no puede ser una raíz de unidad, una ruta UNC, el perfil o un
 * ancestro suyo, ni estar en una carpeta conocida (Documentos, Escritorio, Descargas, Imágenes,
 * Música, Vídeos, OneDrive), aunque esté movida a otra unidad. `ausente` si no existe.
 */
export async function validarTemp(
  temp: string,
  ctx: ContextoTemp,
  lec: Pick<LecturaDisco, 'canonica'>,
): Promise<EstadoTemp> {
  const invalido = { estado: 'invalido' } as const;
  const perfil = normalizarRuta(ctx.perfil);
  const local = normalizarRuta(ctx.local);
  if (perfil === '' || esRaizUnidad(perfil) || !conUnidad(perfil) || !conUnidad(local)) {
    return invalido;
  }
  const cruda = normalizarRuta(temp);
  if (esUnc(cruda) || esRaizUnidad(cruda) || !conUnidad(cruda)) return invalido;
  const real = await lec.canonica(temp);
  if (real === null) return { estado: 'ausente' };
  const n = normalizarRuta(real);
  if (esUnc(n) || esRaizUnidad(n) || !conUnidad(n)) return invalido;
  const partes = n.split('/');
  const ultimo = partes[partes.length - 1] ?? '';
  const nombreOk =
    NOMBRES_TEMP.has(ultimo) ||
    (/^\d{1,4}$/.test(ultimo) && NOMBRES_TEMP.has(partes[partes.length - 2] ?? ''));
  if (!nombreOk) return invalido;
  // El perfil o cualquier ancestro suyo (C:\Users, C:\…).
  if (rutaDentroDe(n, perfil)) return invalido;
  if (ctx.conocidas.some((c) => c !== '' && rutaDentroDe(c, n))) return invalido;
  if (rutaDentroDe(perfil, n)) {
    const primera = n.slice(perfil.length + 1).split('/')[0] ?? '';
    if (CARPETAS_USUARIO.some((c) => c.toLowerCase() === primera)) return invalido;
    if (primera.startsWith('onedrive')) return invalido;
  }
  const resto = n.startsWith(`${local}/`) ? n.slice(local.length + 1) : null;
  if (resto !== null && /^temp(?:\/\d{1,4})?$/.test(resto)) return { estado: 'valido', real };
  const windows = normalizarRuta(ctx.windows);
  if (conUnidad(windows) && !esRaizUnidad(windows) && n === `${windows}/temp`) {
    return { estado: 'valido', real };
  }
  return invalido;
}

const estrictamenteDentro = (padre: string, hija: string): boolean => {
  const p = normalizarRuta(padre);
  const h = normalizarRuta(hija);
  return p !== '' && conUnidad(h) && !esUnc(h) && h.startsWith(`${p}/`);
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
 * `respaldos`. Del entorno solo se lee TEMP (o TMP), que es lo que se valida; las anclas
 * (`AnclasLimpieza`) vienen de la plataforma y, si faltan, TEMP queda `temp-no-seguro`, las
 * cachés de navegador no se ofrecen y Prefetch sale sin rutas. Cada categoría lleva sus anclas
 * reales: el núcleo exige que cada raíz cuelgue de una sin enlaces por el camino.
 */
export async function rutasLimpiezaWindows(
  env: NodeJS.ProcessEnv,
  carpetaDatos: string,
  lec: LecturaDisco,
  anclas: AnclasLimpieza | null,
): Promise<RutasCategoriaLimpieza[]> {
  const real = async (r: string): Promise<string> =>
    r === '' ? '' : ((await lec.canonica(r)) ?? '');
  const perfil = anclas ? await real(anclas.perfil) : '';
  const perfilOk = conUnidad(normalizarRuta(perfil)) && !esRaizUnidad(normalizarRuta(perfil));
  // LocalAppData y Roaming solo valen dentro del perfil del usuario.
  const localR = anclas && perfilOk ? await real(anclas.local) : '';
  const local = estrictamenteDentro(perfil, localR) ? localR : '';
  const roamingR = anclas && perfilOk ? await real(anclas.roaming) : '';
  const roaming = estrictamenteDentro(perfil, roamingR) ? roamingR : '';
  const windowsR = anclas ? await real(anclas.windows) : '';
  const windows =
    conUnidad(normalizarRuta(windowsR)) && !esRaizUnidad(normalizarRuta(windowsR)) ? windowsR : '';
  const conocidas: string[] = [];
  for (const c of anclas?.conocidas ?? []) conocidas.push((await lec.canonica(c)) ?? c);
  const temp = env.TEMP ?? env.TMP ?? '';
  const res: RutasCategoriaLimpieza[] = [];
  const agregar = (
    categoria: CategoriaLimpieza,
    rutas: string[],
    anclasCat: string[],
    requiereAdmin = false,
    navegador?: NavegadorLimpieza,
  ): void => {
    res.push({
      categoria,
      rutas,
      requiereAdmin,
      anclas: anclasCat.filter((a) => a !== ''),
      ...(navegador ? { navegador } : {}),
    });
  };
  const estadoTemp: EstadoTemp =
    perfilOk && local !== ''
      ? await validarTemp(temp, { perfil, local, windows, conocidas }, lec)
      : { estado: 'invalido' };
  if (estadoTemp.estado === 'invalido') {
    res.push({ categoria: 'temp', rutas: [], requiereAdmin: false, bloqueo: 'temp-no-seguro' });
  } else {
    agregar('temp', estadoTemp.estado === 'valido' ? [estadoTemp.real] : [], [local, windows]);
  }
  if (local !== '') {
    agregar(
      'cache-chrome',
      await cachesChromium(path.win32.join(local, 'Google', 'Chrome', 'User Data'), lec),
      [local],
      false,
      'chrome',
    );
    agregar(
      'cache-edge',
      await cachesChromium(path.win32.join(local, 'Microsoft', 'Edge', 'User Data'), lec),
      [local],
      false,
      'edge',
    );
    agregar(
      'cache-brave',
      await cachesChromium(
        path.win32.join(local, 'BraveSoftware', 'Brave-Browser', 'User Data'),
        lec,
      ),
      [local],
      false,
      'brave',
    );
    agregar(
      'cache-firefox',
      await cachesFirefox(local, roaming || local, lec),
      [local, roaming],
      false,
      'firefox',
    );
  }
  agregar('wolfcore-descargas', [path.win32.join(carpetaDatos, 'tmp')], [carpetaDatos]);
  agregar('wolfcore-registros', [path.win32.join(carpetaDatos, 'logs')], [carpetaDatos]);
  // Prefetch, de la carpeta de Windows real (nunca de %SystemRoot%).
  agregar(
    'prefetch',
    windows === '' ? [] : [path.win32.join(windows, 'Prefetch')],
    [windows],
    true,
  );
  return res;
}

/** Script que dice el tipo de una unidad (`Win32_LogicalDisk.DriveType`; 3 = disco fijo local). */
export const scriptTipoUnidad = (letra: string): string =>
  [
    "$ErrorActionPreference = 'Stop'",
    "$ProgressPreference = 'SilentlyContinue'",
    `$d = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DeviceID='${letra}:'"`,
    '[Console]::Out.Write([int]$d.DriveType)',
  ].join('\n');

/** Letra de unidad de una ruta (`C`), o null si no tiene (UNC, relativa…). */
export function letraUnidad(ruta: string): string | null {
  const m = /^([A-Za-z]):[\\/]/.exec(ruta);
  return m ? m[1]!.toUpperCase() : null;
}

/** Script que dice si el proceso actual tiene el token de administrador (no pide elevación). */
export const SCRIPT_ES_ADMIN = [
  "$ErrorActionPreference = 'Stop'",
  '$p = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())',
  '[Console]::Out.Write($p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))',
].join('\n');
