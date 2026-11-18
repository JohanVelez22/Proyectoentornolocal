/**
 * Utilidades de las pruebas reales en Windows: plataforma segura (sin hosts, certificados ni
 * PATH reales), caché de descargas entre corridas, esperas y limpieza de procesos.
 */
import { execFileSync } from 'node:child_process';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { PlataformaWindows } from '../../src/plataforma/win';
import type { Plataforma } from '../../src/plataforma/tipos';

export const esWindows = process.platform === 'win32';

export const dormir = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Plataforma real, salvo lo que tocaría el sistema: el archivo hosts va a una copia temporal,
 * nunca se instalan ni quitan certificados y "Documentos" es una carpeta temporal.
 */
export function plataformaSegura(hostsCopia: string, documentos: string): Plataforma {
  const real = new PlataformaWindows();
  return {
    rutaHosts: () => hostsCopia,
    escribirComoAdmin: async (destino, contenido) => {
      if (destino !== hostsCopia) throw new Error(`Escritura inesperada en ${destino}`);
      writeFileSync(destino, contenido, 'utf8');
      return { ok: true };
    },
    quienUsaPuerto: (p) => real.quienUsaPuerto(p),
    duenosDePuertos: (ps) => real.duenosDePuertos(ps),
    instalarCertificadoUsuario: async () => {
      throw new Error('La prueba no debe instalar certificados');
    },
    quitarCertificadoUsuario: async () => {
      throw new Error('La prueba no debe quitar certificados');
    },
    certificadoInstalado: async () => false,
    procesoVivo: (p) => real.procesoVivo(p),
    matarArbol: (p) => real.matarArbol(p),
    carpetaDocumentos: async () => documentos,
    abrirUrl: async () => undefined,
    ejecutable: (n) => real.ejecutable(n),
  };
}

/** Carpeta de descargas compartida entre corridas (no se borra al terminar). */
export const CARPETA_CACHE =
  process.env.PEL_INT_CACHE ?? path.join(os.tmpdir(), 'pel-etapa-a-cache');

const PAQUETE = /\.(zip|exe|phar|php)$/i;

/**
 * `fetch` que guarda los paquetes descargados (zip, exe, phar, php) en CARPETA_CACHE y los
 * sirve desde ahí en la siguiente corrida. La huella la sigue verificando el instalador.
 */
export function fetchConCache(log: (...a: unknown[]) => void): typeof fetch {
  return async (entrada, init) => {
    const url =
      typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    const u = new URL(url);
    if (!PAQUETE.test(u.pathname)) return fetch(entrada, init);
    const archivo = path.join(CARPETA_CACHE, `${u.hostname}_${path.basename(u.pathname)}`);
    if (existsSync(archivo)) {
      log(`caché: ${path.basename(archivo)} (${statSync(archivo).size} bytes)`);
      const cuerpo = Readable.toWeb(createReadStream(archivo)) as unknown as ReadableStream;
      return new Response(cuerpo, {
        status: 200,
        headers: { 'content-length': String(statSync(archivo).size) },
      });
    }
    log(`descargando ${url}`);
    const res = await fetch(entrada, init);
    if (!res.ok || !res.body) return res;
    const [a, b] = res.body.tee();
    const parcial = `${archivo}.${process.pid}.part`;
    void pipeline(Readable.fromWeb(b as unknown as WebReadableStream), createWriteStream(parcial))
      .then(() => rename(parcial, archivo))
      .catch(() => rm(parcial, { force: true }));
    return new Response(a, { status: res.status, headers: res.headers });
  };
}

/** Procesos cuyo ejecutable vive dentro de `base`. */
export function procesosDeBase(base: string): { pid: number; nombre: string }[] {
  const filtro = base.replace(/'/g, "''");
  const salida = execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith('${filtro}', [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { "$($_.ProcessId)|$($_.Name)" }`,
    ],
    { encoding: 'utf8', windowsHide: true },
  );
  return salida
    .split(/\r?\n/)
    .filter((l) => l.includes('|'))
    .map((l) => {
      const [pid, nombre] = l.trim().split('|');
      return { pid: Number(pid), nombre: nombre ?? '' };
    });
}

/** Mata solo los procesos cuyo ejecutable está dentro de `base` y borra la carpeta. */
export function limpiarBase(base: string, log: (...a: unknown[]) => void): void {
  for (const p of procesosDeBase(base)) {
    log('matando proceso residual', p);
    try {
      execFileSync('taskkill', ['/PID', String(p.pid), '/T', '/F'], { windowsHide: true });
    } catch {
      // ya terminó
    }
  }
  try {
    rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch (e) {
    log('no se pudo borrar por completo', base, e);
  }
}

export async function esperar<T>(
  desc: string,
  fn: () => Promise<T | null>,
  ms: number,
  cada = 500,
): Promise<T> {
  const limite = Date.now() + ms;
  let ultimo: unknown;
  for (;;) {
    try {
      const r = await fn();
      if (r !== null) return r;
    } catch (e) {
      ultimo = e;
    }
    if (Date.now() >= limite) {
      throw new Error(`Tiempo agotado esperando ${desc}${ultimo ? `: ${String(ultimo)}` : ''}`);
    }
    await dormir(cada);
  }
}

const SCRIPT_VENTANAS = `
Add-Type @"
using System; using System.Text; using System.Runtime.InteropServices; using System.Collections.Generic;
public static class PelVentanas {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  public static List<string> Listar() {
    var r = new List<string>();
    EnumWindows((h, l) => { if (IsWindowVisible(h)) { var sb = new StringBuilder(1024); GetWindowText(h, sb, 1024); uint pid; GetWindowThreadProcessId(h, out pid); r.Add(pid + "|" + sb.ToString()); } return true; }, IntPtr.Zero);
    return r;
  }
}
"@
[PelVentanas]::Listar()
`;

/**
 * Ventanas visibles de primer nivel que pertenecen a un proceso de `base` o cuyo título muestra
 * una ruta de `base` (Windows Terminal titula la pestaña con el ejecutable de la consola).
 */
export function ventanasDeBase(base: string): string[] {
  const salida = execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-NonInteractive',
      '-EncodedCommand',
      Buffer.from(SCRIPT_VENTANAS, 'utf16le').toString('base64'),
    ],
    // stderr fuera: PowerShell escribe ahí su progreso de carga de módulos (CLIXML).
    { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] },
  );
  const pids = new Set(procesosDeBase(base).map((p) => p.pid));
  const ruta = base.toLowerCase();
  return salida
    .split(/\r?\n/)
    .filter((l) => l.includes('|'))
    .filter((l) => {
      const [pid, ...titulo] = l.split('|');
      return pids.has(Number(pid)) || titulo.join('|').toLowerCase().includes(ruta);
    });
}
