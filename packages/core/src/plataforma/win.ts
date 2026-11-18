import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import type { Ejecutor, Plataforma, ResultadoEscritura } from './tipos';

export const ejecutorPorDefecto: Ejecutor = (cmd, args, opts) =>
  new Promise((resolve) => {
    const hijo = execFile(
      cmd,
      args,
      {
        windowsHide: true,
        encoding: 'utf8',
        timeout: opts?.timeoutMs,
        cwd: opts?.cwd,
        maxBuffer: 16 * 1024 * 1024,
        ...(opts?.env ? { env: { ...process.env, ...opts.env } } : {}),
      },
      (err, stdout, stderr) => {
        const code = (err as { code?: unknown } | null)?.code;
        const codigo = err === null ? 0 : typeof code === 'number' ? code : 1;
        resolve({
          codigo,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? '') || (err?.message ?? ''),
        });
      },
    );
    if (opts?.entrada !== undefined) {
      hijo.stdin?.on('error', () => undefined);
      hijo.stdin?.end(opts.entrada);
    }
  });

/** PID en escucha de cada puerto pedido (una sola pasada por la salida de netstat). */
export function interpretarNetstatVarios(salida: string, puertos: number[]): Map<number, number> {
  const res = new Map<number, number>();
  for (const p of new Set(puertos)) {
    const pid = interpretarNetstat(salida, p);
    if (pid !== null) res.set(p, pid);
  }
  return res;
}

/** Todas las filas "nombre","pid" de `tasklist /FO CSV /NH`. */
export function interpretarTasklistTodos(salida: string): Map<number, string> {
  const res = new Map<number, string>();
  for (const linea of salida.split(/\r?\n/)) {
    const m = /^"([^"]*)","(\d+)"/.exec(linea.trim());
    if (m) res.set(Number(m[2]), m[1] ?? '');
  }
  return res;
}

export function interpretarNetstat(salida: string, puerto: number): number | null {
  for (const linea of salida.split(/\r?\n/)) {
    const c = linea.trim().split(/\s+/);
    if (c.length < 5 || c[0]?.toUpperCase() !== 'TCP') continue;
    // Un socket en escucha tiene remoto sin destino; no se depende del texto (localizado) del estado.
    if (!['0.0.0.0:0', '[::]:0', '*:*'].includes(c[2] ?? '')) continue;
    const local = c[1] ?? '';
    const i = local.lastIndexOf(':');
    if (i < 0 || Number(local.slice(i + 1)) !== puerto) continue;
    const host = local.slice(0, i);
    if (host !== '0.0.0.0' && host !== '[::]' && host !== '[::1]' && host !== '127.0.0.1') continue;
    const pid = Number(c[c.length - 1]);
    if (Number.isInteger(pid)) return pid;
  }
  return null;
}

export function interpretarTasklist(salida: string): { pid: number; nombre: string } | null {
  for (const linea of salida.split(/\r?\n/)) {
    const m = /^"([^"]*)","(\d+)"/.exec(linea.trim());
    if (m) return { pid: Number(m[2]), nombre: m[1] ?? '' };
  }
  return null;
}

const comillaSimple = (s: string): string => s.replace(/'/g, "''");

export class PlataformaWindows implements Plataforma {
  private contador = 0;

  constructor(private readonly ejecutar: Ejecutor = ejecutorPorDefecto) {}

  rutaHosts(): string {
    const raiz = process.env.SystemRoot ?? 'C:\\Windows';
    return path.win32.join(raiz, 'System32', 'drivers', 'etc', 'hosts');
  }

  async escribirComoAdmin(destino: string, contenido: string): Promise<ResultadoEscritura> {
    const tmp = path.join(
      tmpdir(),
      `pel-hosts-${process.pid}-${++this.contador}-${randomUUID().slice(0, 8)}.txt`,
    );
    try {
      await writeFile(tmp, contenido, 'utf8');
      const interno = `Copy-Item -LiteralPath '${comillaSimple(tmp)}' -Destination '${comillaSimple(destino)}' -Force; ipconfig /flushdns | Out-Null`;
      const externo = `Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile','-Command','${comillaSimple(interno)}'`;
      const r = await this.ejecutar('powershell', ['-NoProfile', '-Command', externo]);
      if (r.codigo !== 0 && /cancel/i.test(r.stderr)) return { ok: false, motivo: 'cancelado' };
      let actual: string | null = null;
      try {
        actual = await readFile(destino, 'utf8');
      } catch {
        actual = null;
      }
      if (actual === contenido) return { ok: true };
      const detalle = r.stderr.trim();
      return detalle
        ? { ok: false, motivo: 'denegado', detalle }
        : { ok: false, motivo: 'denegado' };
    } catch (e) {
      return { ok: false, motivo: 'error', detalle: e instanceof Error ? e.message : String(e) };
    } finally {
      await rm(tmp, { force: true }).catch(() => undefined);
    }
  }

  async quienUsaPuerto(puerto: number): Promise<{ pid: number; nombre: string } | null> {
    const r = await this.ejecutar('netstat', ['-ano', '-p', 'TCP'], { timeoutMs: 15000 });
    const pid = interpretarNetstat(r.stdout, puerto);
    if (pid === null) return null;
    const t = await this.ejecutar('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
      timeoutMs: 15000,
    });
    return interpretarTasklist(t.stdout) ?? { pid, nombre: 'desconocido' };
  }

  async duenosDePuertos(puertos: number[]): Promise<Map<number, { pid: number; nombre: string }>> {
    const res = new Map<number, { pid: number; nombre: string }>();
    if (puertos.length === 0) return res;
    const r = await this.ejecutar('netstat', ['-ano', '-p', 'TCP'], { timeoutMs: 15000 });
    const pids = interpretarNetstatVarios(r.stdout, puertos);
    if (pids.size === 0) return res;
    const t = await this.ejecutar('tasklist', ['/FO', 'CSV', '/NH'], { timeoutMs: 15000 });
    const nombres = interpretarTasklistTodos(t.stdout);
    for (const [puerto, pid] of pids)
      res.set(puerto, { pid, nombre: nombres.get(pid) ?? 'desconocido' });
    return res;
  }

  async procesoVivo(pid: number): Promise<{ vivo: boolean; ejecutable?: string }> {
    const t = await this.ejecutar('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
      timeoutMs: 15000,
    });
    const p = interpretarTasklist(t.stdout);
    return p && p.pid === pid ? { vivo: true, ejecutable: p.nombre } : { vivo: false };
  }

  async matarArbol(pid: number): Promise<void> {
    await this.ejecutar('taskkill', ['/PID', String(pid), '/T', '/F'], { timeoutMs: 15000 });
  }

  async abrirUrl(url: string): Promise<void> {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      throw new Error(`URL no permitida: ${url}`);
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error(`URL no permitida: ${url}`);
    }
    await this.ejecutar('rundll32', ['url.dll,FileProtocolHandler', u.href]);
  }

  ejecutable(nombre: 'nginx' | 'php-cgi' | 'php' | 'cloudflared'): string {
    return `${nombre}.exe`;
  }

  private documentos: string | null = null;

  async carpetaDocumentos(): Promise<string> {
    if (this.documentos) return this.documentos;
    try {
      // UTF-8 para que una carpeta con tildes (o redirigida a OneDrive) llegue bien.
      const r = await this.ejecutar(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          "[Console]::OutputEncoding=[Text.Encoding]::UTF8; [Environment]::GetFolderPath('MyDocuments')",
        ],
        { timeoutMs: 15000 },
      );
      const ruta = r.stdout.trim();
      if (r.codigo === 0 && path.win32.isAbsolute(ruta)) {
        this.documentos = ruta;
        return ruta;
      }
    } catch {
      // se usa la ruta de siempre
    }
    return path.win32.join(process.env.USERPROFILE ?? homedir(), 'Documents');
  }
}
