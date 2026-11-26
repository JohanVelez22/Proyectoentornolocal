import { execFile } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

/** Lo que escribe el servidor en `run/cli.json` (D31). */
export interface ArchivoCli {
  puerto: number;
  token: string;
  pid: number;
  version: { app: string; idioma: string | null };
}

export type LecturaCli =
  | { ok: true; archivo: ArchivoCli }
  /**
   * ausente: no hay archivo (app cerrada o CLI apagada); inseguro: enlace, enlace duro o ACL ajena;
   * ilegible: no es el JSON esperado; proceso: el `pid` no está vivo o no es WolfCore (archivo viejo).
   */
  | { ok: false; motivo: 'ausente' | 'inseguro' | 'ilegible' | 'proceso' };

/** Máximo que se lee: el archivo real mide unos 200 bytes. */
const MAX_BYTES = 4096;

export interface DepsLectura {
  /** ¿Está vivo ese PID? */
  pidVivo: (pid: number) => boolean;
  /** Nombre de imagen del proceso (`WolfCore Dev.exe`), o null si no existe. */
  imagenDe: (pid: number) => Promise<string | null>;
  /** Nombre de imagen que se espera: el del propio ejecutable (el cliente corre sobre el de la app). */
  imagenEsperada: string;
  /**
   * Windows: ¿el dueño de la ruta es el SID del usuario actual y su ACL es una sola regla, propia
   * (no heredada) y de ese mismo SID? Se decide por SID, no por nombres (que pueden llevar tildes).
   */
  aclEsDelUsuario?: (ruta: string) => Promise<boolean>;
  plataforma: NodeJS.Platform;
  uidActual?: number | null;
}

const mismaImagen = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

function forma(v: unknown): ArchivoCli | null {
  if (v === null || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const ver = o.version as Record<string, unknown> | null | undefined;
  if (
    !Number.isInteger(o.puerto) ||
    (o.puerto as number) < 1 ||
    (o.puerto as number) > 65535 ||
    typeof o.token !== 'string' ||
    o.token.length < 16 ||
    o.token.length > 256 ||
    !/^[A-Za-z0-9_-]+$/.test(o.token) ||
    !Number.isInteger(o.pid) ||
    (o.pid as number) < 1 ||
    ver === null ||
    typeof ver !== 'object'
  ) {
    return null;
  }
  return {
    puerto: o.puerto as number,
    token: o.token,
    pid: o.pid as number,
    version: {
      app: typeof ver.app === 'string' ? ver.app : '',
      idioma: typeof ver.idioma === 'string' ? ver.idioma : null,
    },
  };
}

/**
 * Lee `run/cli.json` solo si es de fiar: un archivo normal (no un enlace ni un enlace duro, y la
 * carpeta `run/` tampoco), de este usuario y con el `pid` de un proceso de WolfCore vivo. Un archivo
 * que falla cualquiera de esas comprobaciones nunca se usa: el token que lleva se mandaría a quien
 * lo puso ahí.
 */
export async function leerArchivoCliSeguro(ruta: string, d: DepsLectura): Promise<LecturaCli> {
  let st;
  try {
    st = await lstat(ruta);
  } catch {
    return { ok: false, motivo: 'ausente' };
  }
  if (!st.isFile() || st.isSymbolicLink() || st.nlink > 1 || st.size > MAX_BYTES) {
    return { ok: false, motivo: 'inseguro' };
  }
  try {
    const padre = await lstat(path.dirname(ruta));
    if (!padre.isDirectory() || padre.isSymbolicLink()) return { ok: false, motivo: 'inseguro' };
  } catch {
    return { ok: false, motivo: 'ausente' };
  }
  if (d.plataforma === 'win32') {
    const propio = d.aclEsDelUsuario ? await d.aclEsDelUsuario(ruta).catch(() => false) : false;
    if (!propio) return { ok: false, motivo: 'inseguro' };
  } else {
    const uid = d.uidActual;
    if ((uid !== null && uid !== undefined && st.uid !== uid) || (st.mode & 0o077) !== 0) {
      return { ok: false, motivo: 'inseguro' };
    }
  }
  let archivo: ArchivoCli | null;
  try {
    archivo = forma(JSON.parse(await readFile(ruta, 'utf8')));
  } catch {
    return { ok: false, motivo: 'ilegible' };
  }
  if (!archivo) return { ok: false, motivo: 'ilegible' };
  if (!(await procesoDeLaApp(archivo.pid, d))) return { ok: false, motivo: 'proceso' };
  return { ok: true, archivo };
}

/** ¿Ese PID está vivo y es el ejecutable de WolfCore (el mismo que corre este cliente)? */
async function procesoDeLaApp(pid: number, d: DepsLectura): Promise<boolean> {
  if (!d.pidVivo(pid)) return false;
  const imagen = await d.imagenDe(pid).catch(() => null);
  return imagen !== null && mismaImagen(imagen, d.imagenEsperada);
}

/**
 * ¿Hay una app de WolfCore abierta aunque la CLI esté apagada? `run/app.pid` (sin secretos) lo
 * escribe la app mientras vive. `wolf --abrir` lo usa para no lanzar una segunda instancia.
 */
export async function appAbierta(ruta: string, d: DepsLectura): Promise<boolean> {
  try {
    const st = await lstat(ruta);
    if (!st.isFile() || st.isSymbolicLink() || st.size > 32) return false;
    const pid = Number((await readFile(ruta, 'utf8')).trim());
    if (!Number.isInteger(pid) || pid < 1) return false;
    return await procesoDeLaApp(pid, d);
  } catch {
    return false;
  }
}

/* ───────── Windows: ACL por SID con PowerShell ───────── */

const comillas = (t: string): string => `'${t.replace(/'/g, "''")}'`;

/**
 * Script (ASCII, con la ruta ya entre comillas): `SI` solo si el dueño es el SID del usuario actual,
 * hay UNA regla, no es heredada y es de ese mismo SID. Nada depende de nombres de cuenta.
 */
export function scriptAclUsuario(ruta: string): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
    `$a = Get-Acl -LiteralPath ${comillas(ruta)}`,
    '$dueno = $a.GetOwner([System.Security.Principal.SecurityIdentifier]).Value',
    '$r = @($a.Access)',
    '$ok = ($dueno -eq $yo) -and ($r.Count -eq 1) -and (-not $r[0].IsInherited) -and ($r[0].IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value -eq $yo)',
    "if ($ok) { [Console]::Out.Write('SI') } else { [Console]::Out.Write('NO') }",
  ].join('\n');
}

/** Argumentos de PowerShell con el script en Base64 de UTF-16LE (viaja como ASCII puro). */
export const argumentosPowerShell = (script: string): string[] => [
  '-NoProfile',
  '-NonInteractive',
  '-ExecutionPolicy',
  'Bypass',
  '-EncodedCommand',
  Buffer.from(script, 'utf16le').toString('base64'),
];

export type EjecutarSimple = (cmd: string, args: string[]) => Promise<string | null>;

/** Comprueba la ACL y el dueño de `ruta` por SID (salida ASCII: `SI` o `NO`). */
export async function aclEsDelUsuarioPorSid(
  ruta: string,
  ejecutar: EjecutarSimple,
  sistema32: string,
): Promise<boolean> {
  const exe = path.win32.join(sistema32, 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const salida = await ejecutar(exe, argumentosPowerShell(scriptAclUsuario(ruta)));
  return salida !== null && salida.trim() === 'SI';
}

/* ───────── Implementaciones reales (solo las usa `wolf.ts`) ───────── */

function ejecutar(cmd: string, args: string[], tiempoMs = 20_000): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      execFile(cmd, args, { timeout: tiempoMs, windowsHide: true, encoding: 'utf8' }, (e, out) => {
        resolve(e ? null : out);
      });
    } catch {
      resolve(null);
    }
  });
}

const sistema32 = (): string =>
  path.join(process.env.SystemRoot ?? process.env.windir ?? 'C:\\Windows', 'System32');

export function depsLecturaReales(): DepsLectura {
  const plataforma = process.platform;
  return {
    pidVivo: (pid) => {
      try {
        process.kill(pid, 0);
        return true;
      } catch (e) {
        // EPERM: el proceso existe pero no se puede señalar: está vivo (la imagen se comprueba aparte).
        return (e as { code?: string }).code === 'EPERM';
      }
    },
    imagenDe: async (pid) => {
      if (plataforma === 'win32') {
        const out = await ejecutar(path.join(sistema32(), 'tasklist.exe'), [
          '/FI',
          `PID eq ${pid}`,
          '/FO',
          'CSV',
          '/NH',
        ]);
        const m = out ? /^"([^"]+)"/.exec(out.trim()) : null;
        return m ? m[1]! : null;
      }
      const out = await ejecutar('ps', ['-p', String(pid), '-o', 'comm=']);
      return out ? path.basename(out.trim()) || null : null;
    },
    imagenEsperada: path.basename(process.execPath),
    ...(plataforma === 'win32'
      ? {
          aclEsDelUsuario: (ruta: string) =>
            aclEsDelUsuarioPorSid(ruta, (c, a) => ejecutar(c, a), sistema32()),
        }
      : {}),
    plataforma,
    uidActual: typeof process.getuid === 'function' ? process.getuid() : null,
  };
}
