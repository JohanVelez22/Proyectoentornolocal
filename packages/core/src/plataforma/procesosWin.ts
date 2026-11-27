import path from 'node:path';
import type { Ejecutor } from './tipos';
import { interpretarTasklist, interpretarTasklistTodos } from './netstat';

export interface ProcesoTabla {
  padre: number;
  creado: string | null;
  nombre: string;
}

/** Ejecutable de System32 por ruta absoluta (nunca del PATH ni de la carpeta actual). */
export function rutaSistema32(env: NodeJS.ProcessEnv, ...partes: string[]): string {
  return path.win32.join(env.SystemRoot ?? env.SYSTEMROOT ?? 'C:\\Windows', 'System32', ...partes);
}

/** PowerShell de Windows por ruta absoluta. */
export const rutaPowerShell = (env: NodeJS.ProcessEnv): string =>
  rutaSistema32(env, 'WindowsPowerShell', 'v1.0', 'powershell.exe');

/** Líneas `pid|padre|creado|nombre` del script de la tabla de procesos (`creado` puede ir vacío). */
export function interpretarTablaProcesos(salida: string): Map<number, ProcesoTabla> {
  const res = new Map<number, ProcesoTabla>();
  for (const linea of salida.split(/\r?\n/)) {
    const m = /^(\d+)\|(\d+)\|(\d*)\|(.+)$/.exec(linea.trim());
    if (m) {
      res.set(Number(m[1]), {
        padre: Number(m[2]),
        creado: m[3] ? m[3] : null,
        nombre: m[4]!.trim(),
      });
    }
  }
  return res;
}

/** Hijos directos de cada PID según la tabla (sin los que se declaran padres de sí mismos). */
export function hijosPorPadre(tabla: Map<number, ProcesoTabla>): Map<number, number[]> {
  const hijos = new Map<number, number[]>();
  for (const [pid, p] of tabla) {
    if (pid === p.padre) continue;
    const l = hijos.get(p.padre) ?? [];
    l.push(pid);
    hijos.set(p.padre, l);
  }
  return hijos;
}

/** Todos los descendientes (hijos, nietos…) de cada PID pedido a partir de sus hijos; sin ciclos. */
export function descendientesDeHijos(
  hijos: ReadonlyMap<number, readonly number[]>,
  pids: number[],
): Map<number, number[]> {
  const res = new Map<number, number[]>();
  for (const raiz of pids) {
    const vistos = new Set<number>([raiz]);
    const lista: number[] = [];
    const pendientes = [raiz];
    while (pendientes.length > 0) {
      for (const h of hijos.get(pendientes.pop()!) ?? []) {
        if (vistos.has(h)) continue;
        vistos.add(h);
        lista.push(h);
        pendientes.push(h);
      }
    }
    res.set(raiz, lista);
  }
  return res;
}

/** Descendientes de cada PID según la tabla de procesos. */
export const descendientesEnTabla = (
  tabla: Map<number, ProcesoTabla>,
  pids: number[],
): Map<number, number[]> => descendientesDeHijos(hijosPorPadre(tabla), pids);

/** Descendientes de cada PID a partir de la salida de `SCRIPT_TABLA` (Get-CimInstance Win32_Process). */
export const interpretarDescendientes = (salida: string, pids: number[]): Map<number, number[]> =>
  descendientesEnTabla(interpretarTablaProcesos(salida), pids);

/**
 * Una sola consulta CIM para toda la tabla. La hora de creación es la misma expresión que
 * `PlataformaWindows.inicioProceso` (`CreationDate.ToFileTimeUtc()`), así se comparan por igualdad.
 */
export const SCRIPT_TABLA =
  "Get-CimInstance Win32_Process | ForEach-Object { $c = if ($_.CreationDate) { $_.CreationDate.ToFileTimeUtc() } else { '' }; '{0}|{1}|{2}|{3}' -f $_.ProcessId,$_.ParentProcessId,$c,$_.Name }";

/**
 * Consultas de procesos y puertos de Windows con los ejecutables de System32 por ruta absoluta:
 * netstat, tasklist, taskkill y la tabla de procesos por PowerShell.
 */
export class ProcesosWindows {
  constructor(
    private readonly ejecutar: Ejecutor,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  /** PID → padre, hora de creación y nombre en una sola consulta; null si no se pudo leer. */
  async tabla(): Promise<Map<number, ProcesoTabla> | null> {
    try {
      const r = await this.ejecutar(
        rutaPowerShell(this.env),
        ['-NoProfile', '-NonInteractive', '-Command', SCRIPT_TABLA],
        { timeoutMs: 20000 },
      );
      if (r.codigo !== 0) return null;
      const t = interpretarTablaProcesos(r.stdout);
      return t.size > 0 ? t : null;
    } catch {
      return null;
    }
  }

  /** Salida de `netstat -ano` (TCP y UDP); falla si no se pudo leer nada. */
  async netstat(): Promise<string> {
    const r = await this.ejecutar(rutaSistema32(this.env, 'NETSTAT.EXE'), ['-ano'], {
      timeoutMs: 15000,
    });
    if (r.codigo !== 0 && r.stdout.trim() === '') {
      throw new Error(
        `No se pudieron leer los puertos en uso${r.stderr ? `: ${r.stderr.trim()}` : '.'}`,
      );
    }
    return r.stdout;
  }

  /** PID → nombre de todos los procesos (tasklist). */
  async nombres(): Promise<Map<number, string>> {
    const t = await this.ejecutar(rutaSistema32(this.env, 'tasklist.exe'), ['/FO', 'CSV', '/NH'], {
      timeoutMs: 15000,
    });
    return interpretarTasklistTodos(t.stdout);
  }

  /** Nombre actual del proceso (tasklist), o null si no existe. */
  async nombreDe(pid: number): Promise<string | null> {
    const t = await this.ejecutar(
      rutaSistema32(this.env, 'tasklist.exe'),
      ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'],
      { timeoutMs: 15000 },
    );
    const p = interpretarTasklist(t.stdout);
    return p && p.pid === pid ? p.nombre : null;
  }

  /** `taskkill /F` de un solo PID (sin su árbol). */
  finalizar(pid: number): Promise<{ codigo: number; stdout: string; stderr: string }> {
    return this.ejecutar(rutaSistema32(this.env, 'taskkill.exe'), ['/PID', String(pid), '/F'], {
      timeoutMs: 15000,
    });
  }
}
