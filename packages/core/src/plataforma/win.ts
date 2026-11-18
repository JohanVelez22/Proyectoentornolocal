import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { interpretarNetstatTodos } from './netstat';
import type {
  Ejecutor,
  MuestraPlataforma,
  Plataforma,
  ResultadoEscritura,
  UsoProceso,
} from './tipos';

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

/** Hosts locales que cuentan como "en escucha" para un servicio propio. */
const HOSTS_ESCUCHA = new Set(['0.0.0.0', '::', '::1', '127.0.0.1']);

/** PID TCP en escucha en el puerto (todas las interfaces o loopback), o null. */
export function interpretarNetstat(salida: string, puerto: number): number | null {
  const f = interpretarNetstatTodos(salida).find(
    (x) => x.protocolo === 'TCP' && x.puerto === puerto && HOSTS_ESCUCHA.has(x.direccion),
  );
  return f ? f.pid : null;
}

export function interpretarTasklist(salida: string): { pid: number; nombre: string } | null {
  for (const linea of salida.split(/\r?\n/)) {
    const m = /^"([^"]*)","(\d+)"/.exec(linea.trim());
    if (m) return { pid: Number(m[2]), nombre: m[1] ?? '' };
  }
  return null;
}

/* ───────────── Métricas (una sola consulta de PowerShell por muestra) ───────────── */

const MUESTRA_VACIA = (): MuestraPlataforma => ({ procesos: [], red: null });

/** Número finito y no negativo, o null. */
function numero(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
}

/** ConvertTo-Json desenvuelve los arreglos de un elemento y deja null los vacíos. */
function comoLista(v: unknown): Record<string, unknown>[] {
  const lista = Array.isArray(v) ? v : v === null || v === undefined ? [] : [v];
  return lista.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null);
}

/**
 * Interpreta la salida JSON del script de `muestraSistemaWindows` (`{p: procesos, n: adaptadores}`).
 * Nunca lanza: lo que no se entienda se descarta.
 */
export function interpretarMuestraWindows(salida: string): MuestraPlataforma {
  const i = salida.indexOf('{');
  if (i < 0) return MUESTRA_VACIA();
  let dato: unknown;
  try {
    dato = JSON.parse(salida.slice(i));
  } catch {
    return MUESTRA_VACIA();
  }
  if (typeof dato !== 'object' || dato === null || Array.isArray(dato)) return MUESTRA_VACIA();
  const { p, n } = dato as { p?: unknown; n?: unknown };
  const procesos: UsoProceso[] = [];
  for (const x of comoLista(p)) {
    const pid = numero(x.IDProcess);
    if (pid === null || !Number.isInteger(pid) || pid <= 0) continue;
    procesos.push({
      pid,
      cpu: numero(x.PercentProcessorTime) ?? 0,
      ramBytes: numero(x.WorkingSetPrivate) ?? numero(x.WorkingSet) ?? 0,
      uptimeS: numero(x.ElapsedTime) ?? 0,
    });
  }
  let rx = 0;
  let tx = 0;
  let adaptadores = 0;
  for (const x of comoLista(n)) {
    const r = numero(x.ReceivedBytes);
    const t = numero(x.SentBytes);
    if (r === null || t === null) continue;
    rx += r;
    tx += t;
    adaptadores++;
  }
  return { procesos, red: adaptadores > 0 ? { rx, tx } : null };
}

/**
 * Script de la muestra: CPU y RAM de los PIDs pedidos y los contadores de red de los adaptadores
 * físicos, en JSON compacto.
 */
export function scriptMuestraWindows(pids: number[]): string {
  const validos = [...new Set(pids)].filter((p) => Number.isInteger(p) && p > 0);
  const filtro = validos.map((p) => `IDProcess=${p}`).join(' OR ');
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    '$p = @()',
    ...(validos.length > 0
      ? [
          `$p = @(Get-CimInstance -ClassName Win32_PerfFormattedData_PerfProc_Process -Filter "${filtro}" | Select-Object IDProcess,PercentProcessorTime,WorkingSetPrivate,WorkingSet,ElapsedTime)`,
        ]
      : []),
    // Solo adaptadores físicos: los virtuales (Hyper-V, VPN, WSL) repiten el mismo tráfico.
    '$f = @(Get-NetAdapter -Physical | ForEach-Object Name)',
    '$n = @(Get-NetAdapterStatistics | Where-Object { $f -contains $_.Name } | Select-Object Name,ReceivedBytes,SentBytes)',
    'ConvertTo-Json -Compress -Depth 3 -InputObject ([pscustomobject]@{ p = $p; n = $n })',
  ].join('\n');
}

/**
 * Una muestra del sistema con un solo PowerShell oculto (`windowsHide` del ejecutor), nunca uno
 * por servicio. Si PowerShell falla o no responde, devuelve una muestra vacía (no lanza).
 */
export async function muestraSistemaWindows(
  ejecutar: Ejecutor,
  pids: number[],
): Promise<MuestraPlataforma> {
  try {
    const r = await ejecutar(
      'powershell',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-EncodedCommand',
        Buffer.from(scriptMuestraWindows(pids), 'utf16le').toString('base64'),
      ],
      { timeoutMs: 10_000 },
    );
    if (r.codigo !== 0) return MUESTRA_VACIA();
    return interpretarMuestraWindows(r.stdout);
  } catch {
    return MUESTRA_VACIA();
  }
}

const comillaSimple = (s: string): string => s.replace(/'/g, "''");

/** ¿Existe el proceso? `process.kill(pid, 0)` no envía nada: solo lo consulta al sistema. */
export function pidExiste(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // EPERM: existe pero es de otro usuario o del sistema.
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export class PlataformaWindows implements Plataforma {
  private contador = 0;

  constructor(
    private readonly ejecutar: Ejecutor = ejecutorPorDefecto,
    private readonly existe: (pid: number) => boolean = pidExiste,
  ) {}

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

  async instalarCertificadoUsuario(rutaCrt: string): Promise<ResultadoEscritura> {
    return this.certutil(['-user', '-addstore', 'Root', rutaCrt]);
  }

  async quitarCertificadoUsuario(huella: string): Promise<ResultadoEscritura> {
    if (!/^[0-9A-Fa-f]{40}$/.test(huella))
      return { ok: false, motivo: 'error', detalle: 'Huella no válida' };
    return this.certutil(['-user', '-delstore', 'Root', huella]);
  }

  async certificadoInstalado(huella: string): Promise<boolean> {
    if (!/^[0-9A-Fa-f]{40}$/.test(huella)) return false;
    const r = await this.ejecutar('certutil', ['-user', '-store', 'Root', huella], {
      timeoutMs: 15000,
    });
    return r.codigo === 0;
  }

  /**
   * certutil siempre sobre el almacén del usuario. Solo ERROR_CANCELLED (0x800704C7) es una
   * cancelación; "no encontrado" (0x80092004) al quitar ya es el resultado buscado.
   */
  private async certutil(args: string[]): Promise<ResultadoEscritura> {
    // Sin límite corto: Windows muestra su propio aviso de confirmación y espera al usuario.
    const r = await this.ejecutar('certutil', args, { timeoutMs: 120000 });
    if (r.codigo === 0) return { ok: true };
    const texto = `${r.stderr}${r.stdout}`.trim();
    const bajo = texto.toLowerCase();
    if (r.codigo === -2147023673 || bajo.includes('0x800704c7') || bajo.includes('cancel')) {
      return { ok: false, motivo: 'cancelado', detalle: texto };
    }
    if (
      args.includes('-delstore') &&
      (r.codigo === -2146885628 || bajo.includes('0x80092004') || bajo.includes('not found'))
    ) {
      return { ok: true };
    }
    return { ok: false, motivo: 'error', detalle: texto };
  }

  async procesoVivo(pid: number): Promise<{ vivo: boolean; ejecutable?: string }> {
    const t = await this.ejecutar('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
      timeoutMs: 15000,
    });
    const p = interpretarTasklist(t.stdout);
    if (p && p.pid === pid) return { vivo: true, ejecutable: p.nombre };
    // Con el sistema ocupado tasklist puede fallar o volver vacío con el proceso vivo: darlo
    // por muerto dejaba el servicio en "error" y su proceso huérfano. Se confirma antes.
    return this.existe(pid) ? { vivo: true } : { vivo: false };
  }

  async inicioProceso(pid: number): Promise<string | null> {
    if (!Number.isInteger(pid) || pid <= 0) return null;
    try {
      // CreationDate de Win32_Process como FILETIME UTC: no depende de la zona ni del idioma.
      const r = await this.ejecutar(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `$p = Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'; if ($p) { $p.CreationDate.ToFileTimeUtc() }`,
        ],
        { timeoutMs: 15000 },
      );
      const texto = r.stdout.trim();
      return r.codigo === 0 && /^\d+$/.test(texto) ? texto : null;
    } catch {
      return null;
    }
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
