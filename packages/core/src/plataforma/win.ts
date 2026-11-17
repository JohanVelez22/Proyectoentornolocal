import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Ejecutor, Plataforma, ResultadoEscritura } from './tipos';

export const ejecutorPorDefecto: Ejecutor = (cmd, args, opts) =>
  new Promise((resolve) => {
    execFile(
      cmd,
      args,
      {
        windowsHide: true,
        encoding: 'utf8',
        timeout: opts?.timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
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
  });

export function interpretarNetstat(salida: string, puerto: number): number | null {
  for (const linea of salida.split(/\r?\n/)) {
    const c = linea.trim().split(/\s+/);
    if (c.length < 5 || c[0]?.toUpperCase() !== 'TCP') continue;
    if (c[3]?.toUpperCase() !== 'LISTENING') continue;
    const local = c[1] ?? '';
    const i = local.lastIndexOf(':');
    if (i < 0 || Number(local.slice(i + 1)) !== puerto) continue;
    const host = local.slice(0, i);
    if (host !== '0.0.0.0' && host !== '[::]' && host !== '127.0.0.1') continue;
    const pid = Number(c[4]);
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
    if (!/^https?:\/\//i.test(url)) throw new Error(`URL no permitida: ${url}`);
    await this.ejecutar('cmd', ['/c', 'start', '""', url]);
  }

  ejecutable(nombre: 'nginx' | 'php-cgi' | 'php' | 'cloudflared'): string {
    return `${nombre}.exe`;
  }
}
