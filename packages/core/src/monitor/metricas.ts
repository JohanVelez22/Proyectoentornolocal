import { statfs } from 'node:fs/promises';
import os from 'node:os';
import type { Eventos, EventosNucleo } from '../eventos';
import type { MuestraPlataforma } from '../plataforma/tipos';
import type { Supervisor } from '../procesos/supervisor';
import { separarIdSupervisor } from '../proyectos/procesos';

/** Uso de un proceso supervisado en una muestra. */
export interface ProcesoMuestra {
  /** Id del supervisor ('nginx', 'php-8.4-0', 'proy-<sitio>-<proceso>'…). */
  id: string;
  pid: number;
  /** Porcentaje del total del equipo (0–100), normalizado por los núcleos lógicos. */
  cpu: number;
  ramBytes: number;
  uptimeS: number;
  /** Solo en los procesos de proyecto (`proy-…`). */
  sitioId?: string;
  procesoId?: string;
}

export interface MuestraSistema {
  /** Momento de la muestra (ms desde la época). */
  marca: number;
  /** CPU del equipo (0–100). */
  cpu: number;
  ramUsada: number;
  ramTotal: number;
  /** Disco donde viven los datos de WolfCore Dev. */
  discoDatos: { usado: number; libre: number };
  red: { rxBps: number; txBps: number };
  procesos: ProcesoMuestra[];
}

interface TiemposCpu {
  user: number;
  nice: number;
  sys: number;
  idle: number;
  irq: number;
}

/** Lo que se lee del sistema operativo (en las pruebas, valores fijos). */
export interface SistemaMetricas {
  cpus: () => { times: TiemposCpu }[];
  totalmem: () => number;
  freemem: () => number;
  statfs: (ruta: string) => Promise<{
    bsize: number;
    blocks: number;
    bfree: number;
    bavail: number;
  }>;
}

export interface DepsMetricas {
  eventos: Eventos<EventosNucleo>;
  /** Los PIDs que conoce el supervisor: solo esos se consultan. */
  supervisor: Pick<Supervisor, 'ids' | 'pid'>;
  /** Una sola consulta al sistema por muestra (en Windows, `muestraSistemaWindows`). */
  consultar: (pids: number[]) => Promise<MuestraPlataforma>;
  /** Carpeta de datos de WolfCore Dev (para el disco). */
  rutaDatos: string;
  sistema?: SistemaMetricas;
  ahora?: () => number;
  intervaloMs?: number;
}

export const INTERVALO_METRICAS_MS = 3000;
/** Ventana que guarda el búfer circular. */
export const VENTANA_METRICAS_MS = 5 * 60_000;

const sistemaReal: SistemaMetricas = {
  cpus: () => os.cpus(),
  totalmem: () => os.totalmem(),
  freemem: () => os.freemem(),
  statfs: (ruta) => statfs(ruta),
};

const acotar = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/**
 * Métricas del equipo y de los procesos supervisados. Con `iniciar()` muestrea cada 3 s (solo
 * mientras la interfaz lo pide; `pausar()` lo detiene) y guarda los últimos 5 minutos. Nunca hay
 * dos muestras a la vez: un tic que llega con una muestra en curso se salta.
 */
export class Metricas {
  private readonly sistema: SistemaMetricas;
  private readonly ahora: () => number;
  private readonly intervaloMs: number;
  private bufer: MuestraSistema[] = [];
  private temporizador: ReturnType<typeof setInterval> | null = null;
  private enCurso: Promise<MuestraSistema> | null = null;
  private cpuAnterior: { ocupado: number; total: number } | null = null;
  private redAnterior: { rx: number; tx: number; marca: number } | null = null;

  constructor(private readonly d: DepsMetricas) {
    this.sistema = d.sistema ?? sistemaReal;
    this.ahora = d.ahora ?? Date.now;
    this.intervaloMs = d.intervaloMs ?? INTERVALO_METRICAS_MS;
  }

  /** Empieza a muestrear cada 3 s (la primera muestra, enseguida). Idempotente. */
  iniciar(): void {
    if (this.temporizador) return;
    this.temporizador = setInterval(() => this.tic(), this.intervaloMs);
    this.tic();
  }

  pausar(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
  }

  activo(): boolean {
    return this.temporizador !== null;
  }

  /** Muestras de los últimos `min` minutos (como mucho, los 5 que se guardan). */
  ultimos(min = 5): MuestraSistema[] {
    const desde = this.ahora() - acotar(min, 0, 5) * 60_000;
    return this.bufer.filter((m) => m.marca >= desde);
  }

  /** Toma una muestra (o devuelve la que ya está en curso), la guarda y la emite. No lanza. */
  muestrear(): Promise<MuestraSistema> {
    if (this.enCurso) return this.enCurso;
    const p = this.tomar().finally(() => {
      this.enCurso = null;
    });
    this.enCurso = p;
    return p;
  }

  private tic(): void {
    if (this.enCurso) return;
    this.muestrear().catch((e: unknown) => console.error('No se pudo tomar la muestra:', e));
  }

  private async tomar(): Promise<MuestraSistema> {
    const conocidos: { id: string; pid: number }[] = [];
    for (const id of this.d.supervisor.ids()) {
      const pid = this.d.supervisor.pid(id);
      if (pid !== null) conocidos.push({ id, pid });
    }
    let externa: MuestraPlataforma = { procesos: [], red: null };
    try {
      externa = await this.d.consultar(conocidos.map((c) => c.pid));
    } catch {
      // Sin PowerShell la muestra sale igual con lo que da `os`.
    }
    const marca = this.ahora();
    const nucleos = Math.max(1, this.sistema.cpus().length);
    const porPid = new Map(externa.procesos.map((p) => [p.pid, p]));
    const procesos: ProcesoMuestra[] = [];
    for (const c of conocidos) {
      const u = porPid.get(c.pid);
      if (!u) continue;
      const proy = separarIdSupervisor(c.id);
      procesos.push({
        id: c.id,
        pid: c.pid,
        cpu: acotar(u.cpu / nucleos, 0, 100),
        ramBytes: u.ramBytes,
        uptimeS: u.uptimeS,
        ...(proy ? { sitioId: proy.sitioId, procesoId: proy.procesoId } : {}),
      });
    }
    const ramTotal = this.sistema.totalmem();
    const muestra: MuestraSistema = {
      marca,
      cpu: this.cpuSistema(),
      ramUsada: Math.max(0, ramTotal - this.sistema.freemem()),
      ramTotal,
      discoDatos: await this.disco(),
      red: this.red(externa.red, marca),
      procesos,
    };
    this.guardar(muestra);
    this.d.eventos.emit('metricas:muestra', muestra);
    return muestra;
  }

  /** CPU del equipo por diferencia con la muestra anterior (la primera, desde el arranque). */
  private cpuSistema(): number {
    let ocupado = 0;
    let total = 0;
    for (const c of this.sistema.cpus()) {
      const t = c.times;
      const suma = t.user + t.nice + t.sys + t.idle + t.irq;
      total += suma;
      ocupado += suma - t.idle;
    }
    const antes = this.cpuAnterior ?? { ocupado: 0, total: 0 };
    this.cpuAnterior = { ocupado, total };
    const dTotal = total - antes.total;
    if (dTotal <= 0) return 0;
    return acotar(((ocupado - antes.ocupado) / dTotal) * 100, 0, 100);
  }

  private async disco(): Promise<{ usado: number; libre: number }> {
    try {
      const s = await this.sistema.statfs(this.d.rutaDatos);
      return {
        usado: Math.max(0, (s.blocks - s.bfree) * s.bsize),
        libre: Math.max(0, s.bavail * s.bsize),
      };
    } catch {
      return { usado: 0, libre: 0 };
    }
  }

  private red(actual: MuestraPlataforma['red'], marca: number): MuestraSistema['red'] {
    const antes = this.redAnterior;
    if (!actual) return { rxBps: 0, txBps: 0 };
    this.redAnterior = { ...actual, marca };
    if (!antes) return { rxBps: 0, txBps: 0 };
    const seg = (marca - antes.marca) / 1000;
    if (seg <= 0) return { rxBps: 0, txBps: 0 };
    // Un contador que baja (adaptador reiniciado o que desapareció) no da un valor negativo.
    return {
      rxBps: Math.max(0, (actual.rx - antes.rx) / seg),
      txBps: Math.max(0, (actual.tx - antes.tx) / seg),
    };
  }

  private guardar(m: MuestraSistema): void {
    this.bufer.push(m);
    const desde = m.marca - VENTANA_METRICAS_MS;
    let i = 0;
    while (i < this.bufer.length && this.bufer[i]!.marca < desde) i++;
    if (i > 0) this.bufer.splice(0, i);
  }
}
