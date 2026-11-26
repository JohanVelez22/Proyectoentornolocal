import { execFile } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import os from 'node:os';
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
  /** ¿Está vivo ese PID? (`process.kill(pid, 0)`). */
  pidVivo: (pid: number) => boolean;
  /** Nombre de imagen del proceso (`WolfCore Dev.exe`), o null si no existe. */
  imagenDe: (pid: number) => Promise<string | null>;
  /** Nombre de imagen que se espera: el del propio ejecutable (el cliente corre sobre el de la app). */
  imagenEsperada: string;
  /** Windows: las ACE de la ruta (`icacls`), o null si no se pudo leer. */
  aclDe?: (ruta: string) => Promise<string[] | null>;
  /** Cuentas del usuario (sin dominio) que valen en la ACL (nombre de usuario y `USERNAME`). */
  usuarios: string[];
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
 * Las ACE que `icacls` muestra para el archivo. Una sola entrada propia (`restringirAlUsuario`
 * quita lo heredado y deja solo al usuario) y ninguna heredada; si no, otro usuario podría haberlo
 * puesto o podría leerlo.
 */
export function aclEsSoloDelUsuario(entradas: string[], usuarios: string[]): boolean {
  if (entradas.length !== 1) return false;
  const e = entradas[0]!;
  const m = /^(.+?):\((.*)\)$/.exec(e.trim());
  if (!m) return false;
  if (/\(I\)/.test(e)) return false;
  const cuenta = m[1]!.split('\\').pop() ?? '';
  return usuarios.some((u) => u !== '' && cuenta.toLowerCase() === u.toLowerCase());
}

/** Extrae las ACE de la salida de `icacls <archivo>`. */
export function entradasDeIcacls(salida: string, ruta: string): string[] {
  const lineas = salida.split(/\r?\n/);
  const res: string[] = [];
  for (let l of lineas) {
    if (l.includes(ruta)) l = l.slice(l.indexOf(ruta) + ruta.length);
    l = l.trim();
    // "DOMINIO\usuario:(F)" y "(I)(F)" van en la misma línea que la ruta o debajo.
    if (/^.+:\(.*\)$/.test(l)) res.push(l);
  }
  return res;
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
    const acl = d.aclDe ? await d.aclDe(ruta) : null;
    if (acl === null || !aclEsSoloDelUsuario(acl, d.usuarios))
      return { ok: false, motivo: 'inseguro' };
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
  if (!d.pidVivo(archivo.pid)) return { ok: false, motivo: 'proceso' };
  const imagen = await d.imagenDe(archivo.pid).catch(() => null);
  if (imagen === null || !mismaImagen(imagen, d.imagenEsperada)) {
    return { ok: false, motivo: 'proceso' };
  }
  return { ok: true, archivo };
}

/* ───────── Implementaciones reales (solo las usa `wolf.ts`) ───────── */

function ejecutar(cmd: string, args: string[], tiempoMs = 10_000): Promise<string | null> {
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
        // EPERM: existe pero es de otro usuario (no es la app de este usuario).
        void e;
        return false;
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
          aclDe: async (ruta: string) => {
            const out = await ejecutar(path.join(sistema32(), 'icacls.exe'), [ruta]);
            return out === null ? null : entradasDeIcacls(out, ruta);
          },
        }
      : {}),
    usuarios: [os.userInfo().username, process.env.USERNAME ?? ''],
    plataforma,
    uidActual: typeof process.getuid === 'function' ? process.getuid() : null,
  };
}
