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
import { lanzadorOcultoPara } from '../plataforma/index';
import { pidExiste } from '../plataforma/win';
import {
  avisoSinLanzadorOculto,
  LanzadorNoDisponible,
  type LanzadorOculto,
} from '../plataforma/lanzarOculto';
import { nombreArchivoDeRuta, rutaDentroDe } from '../plataforma/sistema';
import { puertoResponde } from './sonda';
import { decodificarLinea } from '../monitor/decodificar';

export interface DefProceso {
  /** 'nginx', 'php-8.4-0', 'tunel-<sitio>' */
  id: string;
  /** Nombre legible para los mensajes (por defecto, el id). */
  nombre?: string;
  comando: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  puerto?: number;
  log: string;
  reiniciar: boolean;
  /**
   * Al readoptar exige, además del PID y el ejecutable, la misma hora de creación
   * (`Plataforma.inicioProceso`). Para ejecutables comunes (node.exe, python.exe) cuyo PID puede
   * haber pasado a otro programa: si no coincide o no se puede leer, se olvida sin matar nada.
   */
  exigirInicio?: boolean;
  /** Puerto que se muestra en el estado (`puertos`) sin usarse como sonda de salud. */
  puertoInformativo?: number;
}

/** Mensaje de un proceso sin reinicio que terminó bien (código 0); la interfaz lo traduce. */
export const MENSAJE_TERMINADO = 'terminado';

export type EstadoProceso = 'apagado' | 'iniciando' | 'encendido' | 'error';

/** iniciar() no terminó: el proceso se detuvo (o se cerró la app) mientras arrancaba. */
export class ErrorDetenidoAlIniciar extends Error {
  readonly codigo = 'detenido-al-iniciar';
  constructor(
    readonly id: string,
    nombre?: string,
  ) {
    super(`${nombre ?? id} se detuvo mientras arrancaba: no quedó encendido.`);
  }
}

export interface OpcionesSupervisor {
  intervaloMs?: number;
  spawn?: typeof childProcess.spawn;
  sonda?: (puerto: number) => Promise<boolean>;
  /**
   * Arranque sin ventanas: devuelve el PID real del servidor. Por defecto, sin `spawn` inyectado,
   * el de la plataforma (`lanzadorOcultoPara`); null fuerza el `spawn` desacoplado clásico.
   */
  lanzarOculto?: LanzadorOculto | null;
  /** ¿Sigue vivo el PID? (por defecto `pidExiste`, sin lanzar procesos). */
  existePid?: (pid: number) => boolean;
}

/** Opciones de `renombrarRegistro`. */
export interface OpcionesRenombrar {
  /** Solo se renombra si el registro viejo cumple esto (su ejecutable, argumentos y cwd). */
  coincide?: (r: { ejecutable: string; args: readonly string[]; cwd?: string }) => boolean;
  /** Si el id nuevo ya existe pero su PID no está vivo, se reemplaza por el viejo. */
  reemplazarMuerto?: boolean;
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
  exigirInicio?: boolean;
  puertoInformativo?: number;
  /** Hora de creación del proceso (solo con exigirInicio). */
  creado?: string | null;
}

interface Entrada {
  def: DefProceso;
  estado: EstadoProceso;
  pid: number | null;
  /** Marca de tiempo del último arranque (para el límite de 15 s). */
  inicio: number;
  encendidoDesde: number | null;
  intentos: number;
  /** Hora de creación del proceso actual (solo con `def.exigirInicio`). */
  creado: string | null;
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
  private readonly oyentesTermino: Array<(id: string, codigo: number | null) => void> = [];
  private readonly spawnFn: typeof childProcess.spawn;
  /** Se pasa a null si el lanzador no está disponible en este equipo (se usa el spawn clásico). */
  private lanzarOculto: LanzadorOculto | null;
  private readonly sonda: (puerto: number) => Promise<boolean>;
  private readonly existePid: (pid: number) => boolean;
  private readonly intervaloMs: number;
  private bucle: ReturnType<typeof setInterval> | null = null;
  private evaluando = false;
  private cerrado = false;

  constructor(
    private readonly rutas: Rutas,
    private readonly plataforma: Plataforma,
    readonly eventos: Eventos<EventosNucleo>,
    opts: OpcionesSupervisor = {},
  ) {
    this.intervaloMs = opts.intervaloMs ?? 3000;
    this.spawnFn = opts.spawn ?? childProcess.spawn;
    this.lanzarOculto =
      opts.lanzarOculto !== undefined
        ? opts.lanzarOculto
        : !opts.spawn
          ? lanzadorOcultoPara(plataforma, rutas.tmp())
          : null;
    this.sonda = opts.sonda ?? ((p) => puertoResponde(p));
    this.existePid = opts.existePid ?? pidExiste;
  }

  /** ¿El proceso con ese PID es el ejecutable de `comando`? (sin nombre conocido, se acepta). */
  private esNuestro(info: { vivo: boolean; ejecutable?: string }, comando: string): boolean {
    if (!info.vivo) return false;
    if (info.ejecutable === undefined) return true;
    return info.ejecutable.toLowerCase() === nombreArchivoDeRuta(comando).toLowerCase();
  }

  /** Mata el árbol solo si el PID sigue siendo nuestro: un PID reutilizado es de otro programa. */
  private async matarSiEsNuestro(pid: number, comando: string): Promise<void> {
    if (!this.esNuestro(await this.plataforma.procesoVivo(pid), comando)) return;
    await this.plataforma.matarArbol(pid);
  }

  estado(id: string): EstadoProceso {
    return this.entradas.get(id)?.estado ?? 'apagado';
  }

  /** Ids de todos los procesos que el supervisor conoce (lanzados o readoptados). */
  ids(): string[] {
    return [...this.entradas.keys()];
  }

  pid(id: string): number | null {
    return this.entradas.get(id)?.pid ?? null;
  }

  /** Último mensaje del proceso (p. ej. la cola del log tras un error). */
  mensaje(id: string): string | undefined {
    return this.entradas.get(id)?.mensaje;
  }

  /** Reinicios seguidos tras caídas (vuelve a 0 tras 60 s encendido). */
  reinicios(id: string): number {
    return this.entradas.get(id)?.intentos ?? 0;
  }

  /**
   * Antes de un apagado limpio: la salida que venga no cuenta como caída (no se reinicia).
   * La entrada se conserva hasta `detener`.
   */
  marcarDeteniendo(id: string): void {
    const entrada = this.entradas.get(id);
    if (!entrada) return;
    entrada.detenido = true;
    if (entrada.temporizador) clearTimeout(entrada.temporizador);
    entrada.temporizador = null;
  }

  /**
   * Cambia el id de un proceso (p. ej. `mysql` → `mysql@8.4` al pasar a instancias) sin tocar el
   * proceso: si está en memoria se re-registra con el id nuevo; si no (antes de `readoptar`),
   * se renombra su registro en run/estado.json para que se readopte con el id nuevo. No hace
   * nada si el id nuevo ya existe (salvo `reemplazarMuerto` con su PID muerto) ni si el registro
   * viejo no cumple `coincide`.
   */
  renombrarRegistro(viejo: string, nuevo: string, o: OpcionesRenombrar = {}): void {
    if (viejo === nuevo) return;
    const ocupado = (pid: unknown): boolean =>
      !o.reemplazarMuerto || (typeof pid === 'number' && this.existePid(pid));
    const entrada = this.entradas.get(viejo);
    if (entrada) {
      if (
        o.coincide &&
        !o.coincide({
          ejecutable: entrada.def.comando,
          args: entrada.def.args,
          cwd: entrada.def.cwd,
        })
      ) {
        return;
      }
      const otra = this.entradas.get(nuevo);
      if (otra) {
        if (ocupado(otra.pid)) return;
        if (otra.temporizador) clearTimeout(otra.temporizador);
        this.entradas.delete(nuevo);
        this.hijos.delete(nuevo);
      }
      this.entradas.delete(viejo);
      entrada.def = { ...entrada.def, id: nuevo };
      this.entradas.set(nuevo, entrada);
      const hijo = this.hijos.get(viejo);
      if (hijo) {
        this.hijos.delete(viejo);
        this.hijos.set(nuevo, hijo);
      }
      this.guardarEstado();
      this.emitir(entrada);
      return;
    }
    let registros: unknown;
    try {
      registros = JSON.parse(readFileSync(this.rutas.estado(), 'utf8'));
    } catch {
      return;
    }
    if (!Array.isArray(registros)) return;
    let lista = registros as Partial<Record<keyof RegistroEstado, unknown>>[];
    const r = lista.find((x) => x?.id === viejo);
    if (!r) return;
    if (o.coincide) {
      const args = Array.isArray(r.args) ? r.args.filter((a) => typeof a === 'string') : [];
      const ok = o.coincide({
        ejecutable: typeof r.ejecutable === 'string' ? r.ejecutable : '',
        args,
        ...(typeof r.cwd === 'string' ? { cwd: r.cwd } : {}),
      });
      if (!ok) return;
    }
    const otra = lista.find((x) => x?.id === nuevo);
    if (otra) {
      if (ocupado(otra.pid)) return;
      lista = lista.filter((x) => x !== otra);
    }
    r.id = nuevo;
    const destino = this.rutas.estado();
    const tmp = `${destino}.tmp`;
    try {
      writeFileSync(tmp, JSON.stringify(lista, null, 2));
      renameSync(tmp, destino);
    } catch (e) {
      console.error('No se pudo renombrar el registro en estado.json:', e);
    }
  }

  alSalir(fn: (id: string, codigo: number | null) => void): void {
    this.oyentesSalida.push(fn);
  }

  /**
   * Salida definitiva: el proceso terminó y no se reinicia (sin `reiniciar` o con los intentos
   * agotados). Se llama con el estado ya fijado (`apagado` con código 0, `error` si no) y antes de
   * emitirlo.
   */
  alTerminar(fn: (id: string, codigo: number | null) => void): void {
    this.oyentesTermino.push(fn);
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
          await this.matarSiEsNuestro(viejo, actual.def.comando);
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
      creado: null,
      detenido: false,
      temporizador: null,
      ultimoEmitido: '',
    };
    this.entradas.set(def.id, entrada);
    const fallo = await this.lanzar(entrada, true);
    this.guardarEstado();
    if (fallo !== null) throw new Error(`No se pudo iniciar ${def.id}: ${fallo}`);
    if (entrada.detenido || this.cerrado || this.entradas.get(def.id) !== entrada) {
      // Se detuvo (o se cerró el supervisor) mientras arrancaba: no quedó nada encendido.
      throw new ErrorDetenidoAlIniciar(def.id, def.nombre);
    }
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
      if (pid !== null) await this.matarSiEsNuestro(pid, entrada.def.comando);
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
    /** Registros de pools de PHP o de proyecto que no se pudieron adoptar por la hora. */
    const sinAdoptar: RegistroEstado[] = [];
    for (const r of registros) {
      if (!r || typeof r.id !== 'string' || typeof r.pid !== 'number') continue;
      if (this.entradas.has(r.id)) continue;
      // Procesos de proyecto guardados por versiones previas: misma regla que los nuevos (hora de
      // creación obligatoria y el puerto solo informativo).
      if (r.id.startsWith('proy-')) {
        r.exigirInicio = true;
        if (r.puerto !== undefined) {
          r.puertoInformativo ??= r.puerto;
          delete r.puerto;
        }
      }
      // Pools de PHP (de rama y de sitio): php-cgi.exe es común (Laragon, XAMPP, Herd) y su PID
      // se reutiliza; sin la misma hora de creación no se adoptan (ni se matan después).
      if (r.id.startsWith('php-')) r.exigirInicio = true;
      const info = await this.plataforma.procesoVivo(r.pid);
      const esperado = path.basename(String(r.ejecutable)).toLowerCase();
      if (!info.vivo || info.ejecutable?.toLowerCase() !== esperado) continue;
      // PID reutilizado por otro proceso del mismo ejecutable: se olvida, sin matarlo.
      if (r.exigirInicio && (!r.creado || (await this.horaCreacion(r.pid)) !== r.creado)) {
        sinAdoptar.push(r);
        continue;
      }
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
          ...(r.exigirInicio ? { exigirInicio: true } : {}),
          ...(r.puertoInformativo === undefined ? {} : { puertoInformativo: r.puertoInformativo }),
        },
        estado: 'iniciando',
        pid: r.pid,
        inicio: Date.now(),
        encendidoDesde: null,
        intentos: 0,
        creado: r.creado ?? null,
        detenido: false,
        temporizador: null,
        ultimoEmitido: '',
      };
      this.entradas.set(r.id, entrada);
      this.emitir(entrada);
    }
    await this.cerrarHuerfanosPropios(sinAdoptar);
    this.guardarEstado();
    if (this.entradas.size > 0) this.arrancarBucle();
  }

  /**
   * Procesos que dejó una versión anterior de la app sin hora de creación (o con otra): no se
   * readoptan, pero seguirían ocupando sus puertos. Se cierran solo si son con certeza nuestros:
   * la ruta completa de su ejecutable está dentro de `bin/` de la carpeta de datos (pools de PHP)
   * o de la carpeta de datos (procesos de proyecto con nuestros runtimes), y su PID no quedó
   * adoptado. Nunca por el nombre: un php-cgi o node de otro programa no se toca.
   */
  private async cerrarHuerfanosPropios(registros: RegistroEstado[]): Promise<void> {
    if (!this.plataforma.rutaProceso || registros.length === 0) return;
    const adoptados = new Set<number>();
    for (const e of this.entradas.values()) if (e.pid !== null) adoptados.add(e.pid);
    const cerrados = new Set<number>();
    for (const r of registros) {
      const raiz = r.id.startsWith('php-')
        ? path.join(this.rutas.base, 'bin')
        : r.id.startsWith('proy-')
          ? this.rutas.base
          : null;
      if (raiz === null || !Number.isInteger(r.pid) || r.pid <= 0) continue;
      if (adoptados.has(r.pid) || cerrados.has(r.pid)) continue;
      try {
        const ruta = await this.plataforma.rutaProceso(r.pid);
        if (ruta === null || !rutaDentroDe(raiz, ruta)) continue;
        // Se vuelve a mirar que el PID siga siendo el mismo ejecutable justo antes de cerrarlo.
        const info = await this.plataforma.procesoVivo(r.pid);
        if (
          !info.vivo ||
          info.ejecutable?.toLowerCase() !== nombreArchivoDeRuta(ruta).toLowerCase()
        ) {
          continue;
        }
        // Y tiene que ser él quien escucha su puerto: sin puerto conocido o con otro dueño, se deja.
        const puerto = r.puerto ?? r.puertoInformativo;
        if (puerto === undefined || !this.plataforma.quienUsaPuerto) continue;
        const dueno = await this.plataforma.quienUsaPuerto(puerto);
        if (dueno?.pid !== r.pid) continue;
        // Con su árbol: los hijos de un proceso de proyecto (esbuild de Vite…) son suyos y si no
        // quedarían huérfanos; el PID ya está verificado por ruta, ejecutable y puerto.
        await this.plataforma.matarArbol(r.pid);
        cerrados.add(r.pid);
        console.warn(
          `Se cerró ${r.id} (PID ${r.pid}, ${ruta}): lo dejó una versión anterior sin datos para readoptarlo y seguía escuchando el puerto ${puerto} (verificado: ejecutable dentro de la carpeta de datos y dueño del puerto).`,
        );
      } catch (e) {
        console.error(`No se pudo cerrar el proceso huérfano ${r.id} (PID ${r.pid}):`, e);
      }
    }
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
  private async lanzar(entrada: Entrada, inicial = false): Promise<string | null> {
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
      let pidOculto: number | null = null;
      if (this.lanzarOculto) {
        try {
          pidOculto = await this.lanzarOculto(def, fd);
        } catch (e) {
          if (!(e instanceof LanzadorNoDisponible)) throw e;
          this.lanzarOculto = null;
          console.warn(avisoSinLanzadorOculto(e.message));
        }
      }
      if (pidOculto !== null) {
        // Sin manejador del hijo: su muerte la detecta el sondeo (procesoVivo), como al readoptar.
        const pid = pidOculto;
        if (entrada.detenido || this.cerrado || this.entradas.get(def.id) !== entrada) {
          // Se detuvo mientras arrancaba: no se deja un proceso sin seguimiento.
          await this.plataforma.matarArbol(pid).catch(() => undefined);
          return null;
        }
        entrada.pid = pid;
        await this.anotarCreacion(entrada, pid);
        this.emitir(entrada);
        return null;
      }
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
      if (entrada.pid !== null) await this.anotarCreacion(entrada, entrada.pid);
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
    if (entrada.detenido && pid !== null && entrada.pid === pid) {
      // Salida esperada tras marcarDeteniendo: se libera el PID sin reiniciar.
      entrada.pid = null;
      this.hijos.delete(entrada.def.id);
      return;
    }
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
        void this.lanzar(entrada).then(() => this.guardarEstado());
      }, espera);
      return;
    }
    if (codigo === 0 && !def.reiniciar) {
      // Terminó bien por sí mismo (un script, una migración, un build): no es una caída.
      entrada.estado = 'apagado';
      entrada.mensaje = MENSAJE_TERMINADO;
    } else {
      entrada.estado = 'error';
      entrada.mensaje = this.colaLog(def.log) || motivo || 'El proceso terminó de forma inesperada';
    }
    for (const fn of this.oyentesTermino) {
      try {
        fn(def.id, codigo);
      } catch (e) {
        console.error('Error en oyente de término:', e);
      }
    }
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
        // Un PID que ahora es de otro ejecutable (reutilizado) cuenta como muerto: nunca se toca.
        if (!this.esNuestro(info, entrada.def.comando)) {
          this.alMorir(entrada, pid, null);
          continue;
        }
        // No se pudo leer la hora de creación al lanzar: se reintenta mientras viva.
        if (entrada.def.exigirInicio && entrada.creado === null) {
          const creado = await this.horaCreacion(pid);
          if (entrada.pid !== pid || entrada.detenido) continue;
          if (creado !== null) {
            entrada.creado = creado;
            this.guardarEstado();
          }
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
      puertos:
        entrada.def.puerto !== undefined
          ? [entrada.def.puerto]
          : entrada.def.puertoInformativo !== undefined
            ? [entrada.def.puertoInformativo]
            : [],
      pid: entrada.pid,
      ...(entrada.mensaje === undefined ? {} : { mensaje: entrada.mensaje }),
    };
    const clave = JSON.stringify([estado.estado, estado.pid, estado.mensaje ?? null]);
    if (clave === entrada.ultimoEmitido) return;
    entrada.ultimoEmitido = clave;
    this.eventos.emit('servicio:estado', estado);
  }

  /** Hora de creación del PID, o null si no se puede leer. */
  private async horaCreacion(pid: number): Promise<string | null> {
    if (!this.plataforma.inicioProceso) return null;
    try {
      return await this.plataforma.inicioProceso(pid);
    } catch {
      return null;
    }
  }

  /** Con `exigirInicio`, guarda la hora de creación del proceso recién lanzado. */
  private async anotarCreacion(entrada: Entrada, pid: number): Promise<void> {
    entrada.creado = null;
    if (!entrada.def.exigirInicio) return;
    const creado = await this.horaCreacion(pid);
    if (entrada.pid === pid) entrada.creado = creado;
  }

  private colaLog(archivo: string): string {
    try {
      // Línea a línea: una en cp1252 (Python sin UTF-8) no rompe las demás.
      const lineas = readFileSync(archivo)
        .toString('latin1')
        .split(/\r?\n/)
        .map((l) => decodificarLinea(Buffer.from(l, 'latin1')));
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
        ...(e.def.exigirInicio ? { exigirInicio: true, creado: e.creado } : {}),
        ...(e.def.puertoInformativo === undefined
          ? {}
          : { puertoInformativo: e.def.puertoInformativo }),
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
