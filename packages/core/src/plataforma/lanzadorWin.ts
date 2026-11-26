import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Ejecutor } from './tipos';

/** Lo específico de Windows del comando `wolf`: el lanzador compilado (la capa Plataforma). */
export const NOMBRE_EXE = 'wolf.exe';
export const NOMBRE_VERSION_EXE = 'wolf.exe.version';

/** El compilador de C# de .NET Framework (viene con Windows); null si no está. */
export function rutaCsc(env: NodeJS.ProcessEnv = process.env): string | null {
  const raiz = env.SystemRoot ?? env.windir ?? 'C:\\Windows';
  for (const f of ['Framework64', 'Framework']) {
    const r = path.win32.join(raiz, 'Microsoft.NET', f, 'v4.0.30319', 'csc.exe');
    if (existsSync(r)) return r;
  }
  return null;
}

/**
 * Compila `wolf.exe` en `carpeta` (si falta o cambió la versión del lanzador). Un fallo no es
 * grave: queda el `.cmd`. Devuelve si el `.exe` quedó disponible.
 */
export async function compilarLanzadorWin(
  carpeta: string,
  d: { ejecutar: Ejecutor; csc: string | null; fuente: string; version: string },
): Promise<boolean> {
  const exe = path.join(carpeta, NOMBRE_EXE);
  const marca = path.join(carpeta, NOMBRE_VERSION_EXE);
  const version = await readFile(marca, 'utf8').catch(() => null);
  if (existsSync(exe) && version?.trim() === d.version) return true;
  if (!d.csc) return false;
  const tmp = path.join(tmpdir(), `wolf-lanzador-${process.pid}-${Date.now()}`);
  const fuente = `${tmp}.cs`;
  const salida = `${tmp}.exe`;
  try {
    await writeFile(fuente, d.fuente, 'utf8');
    const r = await d.ejecutar(
      d.csc,
      ['/nologo', '/target:exe', '/optimize+', `/out:${salida}`, fuente],
      { timeoutMs: 60_000 },
    );
    if (r.codigo !== 0 || !existsSync(salida)) return false;
    await rm(exe, { force: true }).catch(() => undefined);
    await writeFile(exe, await readFile(salida));
    await writeFile(marca, d.version, 'utf8');
    return true;
  } catch {
    return false;
  } finally {
    await rm(fuente, { force: true }).catch(() => undefined);
    await rm(salida, { force: true }).catch(() => undefined);
  }
}
