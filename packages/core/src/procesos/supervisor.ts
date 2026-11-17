import * as childProcess from 'node:child_process';
import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import path from 'node:path';
import type { Eventos, EventosNucleo } from '../eventos';
import type { Plataforma } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { EstadoServicio } from '../tipos';
import { puertoResponde } from './sonda';

export interface DefProceso {
  /** 'nginx', 'php-8.4-0', 'tunel-<sitio>' */
  id: string;
  comando: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  puerto?: number;
  log: string;
  reiniciar: boolean;
}

export type EstadoProceso = 'apagado' | 'iniciando' | 'encendido' | 'error';

export interface OpcionesSupervisor {
  intervaloMs?: number;
  spawn?: typeof childProcess.spawn;
  sonda?: (puerto: number) => Promise<boolean>;
}

/** Registro persistido en run/estado.json (los campos extra permiten reiniciar tras readoptar). */
interface RegistroEstado {
  id: string;
  pid: number;
  ejecutable: string;
  args: string[];
  puerto?: number;
  log: string;
  reiniciar: boolean;
  cwd?: string;
  env?: Record<string, string>;
}

interface Entrada {
  def: DefProceso;
  estado: EstadoProceso;
  pid: number | null;
  /** Marca de tiempo del último arranque (para el límite de 15 s). */
  inicio: number;
  encendidoDesde: number | null;
  intentos: number;
  detenido: boolean;
  temporizador: ReturnType<typeof setTimeout> | null;
  mensaje?: string;
  ultimoEmitido: string;
}

const ESPERAS_REINICIO_MS = [1000, 2000, 4000, 8000, 16000];
const LIMITE_ARRANQUE_MS = 15_000;
const ESTABLE_MS = 60_000;
const LINEAS_LOG = 20;

export class Supervisor {
  private readonly entradas = new Map<string, Entrada>();
  private readonly hijos = new Map<string, childProcess.ChildProcess>();
  private readonly oyentesSalida: Array<(id: string, codigo: number | null) => void> = [];
  private readonly spawnFn: typeof childProcess.spawn;
  private readonly sonda: (puerto: number) => Promise<boolean>;
  private readonly intervaloMs: number;
  private bucle: ReturnType<typeof setInterval> | null = null;
  private evaluando = false;
  private cerrado = false;

  constructor(
    private readonly rutas: Rutas,
    private readonly plataforma: Plataforma,
    private readonly eventos: Eventos<EventosNucleo>,
    opts: OpcionesSupervisor = {},
  ) {
    this.intervaloMs = opts.intervaloMs ?? 3000;
    this.spawnFn = opts.spawn ?? childProcess.spawn;
    this.sonda = opts.sonda ?? ((p) => puertoResponde(p));
  }

  estado(id: string): EstadoProceso {
    return this.entradas.get(id)?.estado ?? 'apagado';
  }

  pid(id: string): number | null {
    return this.entradas.get(id)?.pid ?? null;
  }

  alSalir(fn: (id: string, codigo: number | null) => void): void {
    this.oyentesSalida.push(fn);
  }

  async iniciar(def: DefProceso): Promise<void> {
    const actual = this.entradas.get(def.id);
    if (actual && actual.estado !== 'error' && actual.estado !== 'apagado') return;
    if (actual) {
      actual.detenido = true;
      if (actual.temporizador) clearTimeout(actual.temporizador);
      actual.temporizador = null;
      const viejo = actual.pid;
      actual.pid = null;
      this.hijos.delete(def.id);
      if (viejo !== null) {
        try {
          await this.plataforma.matarArbol(viejo);
        } catch (e) {
          console.error('No se pudo cerrar el proceso anterior:', e);
        }
      }
    }
    const entrada: Entrada = {
      def,
      estado: 'iniciando',
      pid: null,
      inicio: Date.now(),
      encendidoDesde: null,
      intentos: 0,
      detenido: false,
      temporizador: null,
      ultimoEmitido: '',
    };
    this.entradas.set(def.id, entrada);
    const fallo = this.lanzar(entrada, true);
    this.guardarEstado();
    if (fallo !== null) throw new Error(`No se pudo iniciar ${def.id}: ${fallo}`);
    this.arrancarBucle();
  }

  async detener(id: string): Promise<void> {
    const entrada = this.entradas.get(id);
    if (!entrada) return;
    entrada.detenido = true;
    if (entrada.temporizador) clearTimeout(entrada.temporizador);
    entrada.temporizador = null;
    const pid = entrada.pid;
    entrada.pid = null;
    this.hijos.delete(id);
    try {
      if (pid !== null) await this.plataforma.matarArbol(pid);
    } finally {
      entrada.estado = 'apagado';
      entrada.mensaje = undefined;
      this.emitir(entrada);
      this.entradas.delete(id);
      this.guardarEstado();
    }
  }

  /** Adopta los procesos de estado.json cuyo PID sigue vivo y es el mismo ejecutable. */
  async readoptar(): Promise<void> {
    let registros: RegistroEstado[] = [];
    try {
      const datos: unknown = JSON.parse(readFileSync(this.rutas.estado(), 'utf8'));
      if (Array.isArray(datos)) registros = datos as RegistroEstado[];
    } catch {
      registros = [];
    }
    for (const r of registros) {
      if (!r || typeof r.id !== 'string' || typeof r.pid !== 'number') continue;
      if (this.entradas.has(r.id)) continue;
      const info = await this.plataforma.procesoVivo(r.pid);
      const esperado = path.basename(String(r.ejecutable)).toLowerCase();
      if (!info.vivo || info.ejecutable?.toLowerCase() !== esperado) continue;
      const entrada: Entrada = {
        def: {
          id: r.id,
          comando: r.ejecutable,
          args: r.args ?? [],
          cwd: r.cwd,
          env: r.env,
          puerto: r.puerto,
          log: r.log,
          reiniciar: r.reiniciar ?? false,
        },
        estado: 'iniciando',
        pid: r.pid,
        inicio: Date.now(),
        encendidoDesde: null,
        intentos: 0,
        detenido: false,
        temporizador: null,
        ultimoEmitido: '',
      };
      this.entradas.set(r.id, entrada);
      this.emitir(entrada);
    }
    this.guardarEstado();
    if (this.entradas.size > 0) this.arrancarBucle();
  }

  async cerrar(): Promise<void> {
    this.cerrado = true;
    if (this.bucle) clearInterval(this.bucle);
    this.bucle = null;
    for (const e of this.entradas.values()) {
      if (e.temporizador) clearTimeout(e.temporizador);
      e.temporizador = null;
    }
  }

  private arrancarBucle(): void {
    if (this.bucle) return;
    this.bucle = setInterval(() => {
      void this.evaluar();
    }, this.intervaloMs);
  }

  /** Devuelve null si lanzó, o el detalle del fallo. */
  private lanzar(entrada: Entrada, inicial = false): string | null {
    const { def } = entrada;
    entrada.inicio = Date.now();
    entrada.encendidoDesde = null;
    entrada.estado = 'iniciando';
    entrada.mensaje = undefined;
    let fd: number | null = null;
    let fallo: string | null = null;
    try {
      mkdirSync(path.dirname(def.log), { recursive: true });
      fd = openSync(def.log, 'a');
      writeSync(fd, `--- ${new Date().toISOString()} iniciar ${def.id} ---\n`);
      const hijo = this.spawnFn(def.comando, def.args, {
        cwd: def.cwd,
        env: { ...process.env, ...def.env },
        detached: true,
        windowsHide: true,
        stdio: ['ignore', fd, fd],
      });
      const pid = hijo.pid;
      // El listener de error va antes que cualquier otra comprobación: un spawn fallido
      // emite 'error' en el siguiente tick y, sin listener, tumbaría el proceso anfitrión.
      hijo.once('error', (err: Error) => {
        if (pid !== undefined) this.alMorir(entrada, pid, null, err.message);
      });
      hijo.unref?.();
      if (pid === undefined) {
        fallo = 'el ejecutable no se pudo lanzar';
      } else {
        entrada.pid = pid;
        this.hijos.set(def.id, hijo);
        hijo.once('exit', (codigo: number | null) => this.alMorir(entrada, pid, codigo));
      }
    } catch (e) {
      entrada.pid = null;
      fallo = e instanceof Error ? e.message : String(e);
    } finally {
      if (fd !== null) closeSync(fd);
    }
    if (fallo === null) {
      this.emitir(entrada);
      return null;
    }
    if (inicial) {
      entrada.estado = 'error';
      entrada.mensaje = `No se pudo iniciar ${def.id}: ${fallo}`;
      this.emitir(entrada);
    } else {
      this.alMorir(entrada, null, null, fallo);
    }
    return fallo;
  }

  private alMorir(
    entrada: Entrada,
    pid: number | null,
    codigo: number | null,
    motivo?: string,
  ): void {
    if (entrada.detenido || this.cerrado) return;
    if (pid !== null && entrada.pid !== pid) return; // ya gestionado
    const { def } = entrada;
    entrada.pid = null;
    entrada.encendidoDesde = null;
    this.hijos.delete(def.id);
    for (const fn of this.oyentesSalida) {
      try {
        fn(def.id, codigo);
      } catch (e) {
        console.error('Error en oyente de salida:', e);
      }
    }
    if (def.reiniciar && entrada.intentos < ESPERAS_REINICIO_MS.length) {
      const espera = ESPERAS_REINICIO_MS[entrada.intentos]!;
      entrada.intentos += 1;
      entrada.estado = 'iniciando';
      entrada.mensaje = `Reiniciando en ${espera / 1000} s`;
      this.emitir(entrada);
      this.guardarEstado();
      entrada.temporizador = setTimeout(() => {
        entrada.temporizador = null;
        if (entrada.detenido || this.cerrado) return;
        this.lanzar(entrada);
        this.guardarEstado();
      }, espera);
      return;
    }
    entrada.estado = 'error';
    entrada.mensaje = this.colaLog(def.log) || motivo || 'El proceso terminó de forma inesperada';
    this.emitir(entrada);
    this.guardarEstado();
  }

  private async evaluar(): Promise<void> {
    if (this.evaluando || this.cerrado) return;
    this.evaluando = true;
    try {
      for (const entrada of [...this.entradas.values()]) {
        const pid = entrada.pid;
        if (pid === null || entrada.detenido) continue;
        const info = await this.plataforma.procesoVivo(pid);
        if (entrada.pid !== pid || entrada.detenido) continue;
        if (!info.vivo) {
          this.alMorir(entrada, pid, null);
          continue;
        }
        const sano = entrada.def.puerto === undefined ? true : await this.sonda(entrada.def.puerto);
        if (entrada.pid !== pid || entrada.detenido) continue;
        const ahora = Date.now();
        if (sano) {
          if (entrada.estado !== 'encendido') {
            entrada.estado = 'encendido';
            entrada.mensaje = undefined;
            entrada.encendidoDesde = ahora;
          } else if (
            entrada.encendidoDesde !== null &&
            ahora - entrada.encendidoDesde >= ESTABLE_MS
          ) {
            entrada.intentos = 0;
          }
        } else if (entrada.estado === 'encendido') {
          entrada.estado = 'iniciando';
          entrada.encendidoDesde = null;
          entrada.inicio = ahora;
        } else if (entrada.estado === 'iniciando' && ahora - entrada.inicio >= LIMITE_ARRANQUE_MS) {
          // Se mata el árbol para no dejar un proceso huérfano sin seguimiento.
          entrada.detenido = true;
          entrada.pid = null;
          this.hijos.delete(entrada.def.id);
          try {
            await this.plataforma.matarArbol(pid);
          } catch (e) {
            console.error('No se pudo cerrar el proceso que no respondió:', e);
          }
          entrada.estado = 'error';
          entrada.mensaje = this.colaLog(entrada.def.log) || 'El servicio no responde';
          this.guardarEstado();
        }
        this.emitir(entrada);
      }
    } finally {
      this.evaluando = false;
    }
  }

  private emitir(entrada: Entrada): void {
    const estado: EstadoServicio = {
      id: entrada.def.id,
      nombre: entrada.def.id,
      version: null,
      estado: entrada.estado,
      puertos: entrada.def.puerto === undefined ? [] : [entrada.def.puerto],
      pid: entrada.pid,
      ...(entrada.mensaje === undefined ? {} : { mensaje: entrada.mensaje }),
    };
    const clave = JSON.stringify([estado.estado, estado.pid, estado.mensaje ?? null]);
    if (clave === entrada.ultimoEmitido) return;
    entrada.ultimoEmitido = clave;
    this.eventos.emit('servicio:estado', estado);
  }

  private colaLog(archivo: string): string {
    try {
      const lineas = readFileSync(archivo, 'utf8').split(/\r?\n/);
      while (lineas.length > 0 && lineas[lineas.length - 1] === '') lineas.pop();
      return lineas.slice(-LINEAS_LOG).join('\n');
    } catch {
      return '';
    }
  }

  private guardarEstado(): void {
    const registros: RegistroEstado[] = [];
    for (const e of this.entradas.values()) {
      if (e.pid === null) continue;
      registros.push({
        id: e.def.id,
        pid: e.pid,
        ejecutable: e.def.comando,
        args: e.def.args,
        puerto: e.def.puerto,
        log: e.def.log,
        reiniciar: e.def.reiniciar,
        cwd: e.def.cwd,
        env: e.def.env,
      });
    }
    const destino = this.rutas.estado();
    const tmp = `${destino}.tmp`;
    try {
      mkdirSync(path.dirname(destino), { recursive: true });
      writeFileSync(tmp, JSON.stringify(registros, null, 2));
      renameSync(tmp, destino);
    } catch (e) {
      console.error('No se pudo guardar estado.json:', e);
    }
  }
}
