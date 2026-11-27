import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import type { EntradaAviso } from '../avisos/avisos';
import { ErrorWolf } from '../errores';
import { enmascararComando } from '../perfiles/secretos';
import { sanear } from '../proyectos/recetas';
import type { Rutas } from '../rutas';
import { type Sitio, type TareaSitio } from '../tipos';
import { huellaTarea, validarComandoTarea } from './comando';
import { interpretarCron, siguiente, zonaLocal, type Cron } from './cron';

/**
 * Planificador de las tareas programadas por sitio (D29). Vive **dentro de la app**: solo corre
 * mientras WolfCore Dev está abierto y no usa el Programador de tareas de Windows ni toca nada
 * del sistema. Cada ejecución:
 *
 * - solo en un sitio **confiado** cuya receta no cambió desde que se confió (misma huella);
 * - solo si el usuario **confirmó** ese comando (huella en `tarea.confirmada`: un hash sin clave,
 *   como `confiado`; protege de cambios y de lo que llega por otras vías, no de quien ya puede
 *   escribir `config.json`);
 * - sin shell, con lista de argumentos y en la carpeta del sitio (lo resuelve `deps.ejecutar`);
 * - nunca dos a la vez de la misma tarea (la que llega con la otra corriendo se salta y se anota);
 * - con un tiempo máximo, pasado el cual se mata solo el árbol de su propio proceso;
 * - con su salida enmascarada de secretos, con tope de tamaño y rotación;
 * - en carpeta de datos aislada (`WOLFCORE_DATOS`), nada corre hasta que el usuario lo permita.
 */

export const ESTADOS_EJECUCION = [
  'ok',
  'fallo',
  'tiempo',
  'cancelada',
  'omitida',
  'bloqueada',
] as const;
export type EstadoEjecucion = (typeof ESTADOS_EJECUCION)[number];

/** Motivos (códigos estables, la interfaz los traduce) por los que una tarea no se ejecuta. */
export const MOTIVOS_TAREA = [
  'aislado',
  'no_confiado',
  'receta_cambio',
  'sin_confirmar',
  'comando_invalido',
  'cron_invalida',
  'carpeta',
  'solapada',
  'retraso',
  'error',
] as const;
export type MotivoTarea = (typeof MOTIVOS_TAREA)[number];

const EjecucionTareaSchema = z.object({
  inicio: z.string().max(40),
  fin: z.string().max(40),
  estado: z.enum(ESTADOS_EJECUCION),
  codigo: z.number().int().nullable(),
  motivo: z.enum(MOTIVOS_TAREA).optional(),
  origen: z.enum(['programada', 'manual']),
  duracionMs: z.number().int().min(0),
});
export type EjecucionTarea = z.infer<typeof EjecucionTareaSchema>;

/** Ejecuciones que se conservan por tarea. */
export const MAX_HISTORIAL_TAREA = 50;
/** Una ejecución que llega con más atraso que esto (equipo dormido) no se recupera. */
const MAX_ATRASO_MS = 2 * 60_000;
/** Salida que se guarda de una ejecución (el resto se descarta y se anota). */
const MAX_BYTES_SALIDA = 256 * 1024;
/** Lo máximo que `detener()` espera a que terminen las tareas abortadas. */
const TOPE_DETENER_MS = 10_000;
const MAX_LINEA = 2000;
/** Un log pasa a `.1` al llegar a esto (así ocupa como mucho el doble). */
const MAX_BYTES_LOG = 1024 * 1024;

export interface DepsProgramador {
  rutas: Pick<Rutas, 'historialTareas' | 'logTarea'>;
  leerSitios: () => Promise<Sitio[]>;
  /**
   * Huella de la receta efectiva de la carpeta ahora mismo (`huellaReceta`); null si no se puede
   * leer (`wolfcore.yml` roto).
   */
  huellaReceta: (carpeta: string) => Promise<string | null>;
  existeCarpeta: (carpeta: string) => Promise<boolean>;
  /**
   * Lanza el comando (ya validado) del sitio: sin shell, programa resuelto por el runtime del
   * proyecto, `cwd` = carpeta del sitio, ventana oculta. `senal` mata el árbol del proceso lanzado
   * (y solo ese). Rechaza si no se pudo lanzar; resuelve con el código de salida.
   */
  ejecutar: (
    sitio: Sitio,
    comando: string[],
    o: { senal: AbortSignal; alLinea: (linea: string) => void },
  ) => Promise<{ codigo: number }>;
  avisar: (a: EntradaAviso) => void;
  emitir?: (e: { sitioId: string; tareaId: string; estado: EstadoEjecucion }) => void;
  /** `WOLFCORE_DATOS`: nada corre hasta `permitirAislado()`. */
  aislado?: () => boolean;
  ahora?: () => Date;
  zona?: string;
  /** Para pruebas: tope de espera de `detener()` (ms). */
  topeDetenerMs?: number;
}

export interface VistaTarea {
  tarea: TareaSitio;
  /** Huella del comando actual: la interfaz la devuelve al confirmar lo que se ve. */
  huella: string;
  /** Próxima ejecución programada (ISO), o null si está pausada o la expresión no es válida. */
  proxima: string | null;
  /** Por qué no correría ahora (null = puede correr). */
  bloqueo: MotivoTarea | null;
  enCurso: boolean;
  ultima: EjecucionTarea | null;
}

export interface EstadoPlanificador {
  /** El temporizador está en marcha. */
  corriendo: boolean;
  /** La carpeta de datos es de prueba (`WOLFCORE_DATOS`). */
  aislado: boolean;
  /** En modo aislado, el usuario ya permitió las tareas en esta sesión. */
  permitido: boolean;
}

const clave = (sitioId: string, tareaId: string): string => `${sitioId}/${tareaId}`;
const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export class Programador {
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private corriendo = false;
  private permitido = false;
  private ultimoTick: Date | null = null;
  /** Ejecuciones en curso, por tarea (también las lanzadas a mano). */
  private readonly enCurso = new Map<string, { control: AbortController; fin: Promise<unknown> }>();
  /** Último motivo de bloqueo anotado por tarea: no se repite cada minuto. */
  private readonly bloqueos = new Map<string, MotivoTarea>();
  private readonly crons = new Map<string, Cron>();
  private historial: Map<string, EjecucionTarea[]> | null = null;
  private cola: Promise<unknown> = Promise.resolve();
  private deteniendo = false;

  constructor(private readonly d: DepsProgramador) {}

  private ahora(): Date {
    return (this.d.ahora ?? (() => new Date()))();
  }

  private zona(): string {
    return this.d.zona ?? zonaLocal();
  }

  /* ───────────── Ciclo de vida ───────────── */

  /** Pone en marcha el temporizador (un minuto de reloj a la vez). No hace nada si ya corre. */
  iniciar(): void {
    if (this.corriendo) return;
    this.corriendo = true;
    this.deteniendo = false;
    this.ultimoTick = this.ahora();
    this.programarSiguiente();
  }

  /** Detiene el temporizador y mata lo que esté corriendo (solo los procesos de las tareas). */
  async detener(): Promise<void> {
    this.corriendo = false;
    this.deteniendo = true;
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = null;
    const activas = [...this.enCurso.values()];
    for (const a of activas) a.control.abort();
    // Con tope: si un proceso no suelta la salida, el cierre de la app no se queda esperando.
    let tope: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      Promise.allSettled(activas.map((a) => a.fin)).then(() => this.cola.catch(() => undefined)),
      new Promise<void>((r) => {
        tope = setTimeout(r, this.d.topeDetenerMs ?? TOPE_DETENER_MS);
      }),
    ]);
    if (tope) clearTimeout(tope);
  }

  estado(): EstadoPlanificador {
    return {
      corriendo: this.corriendo,
      aislado: this.d.aislado?.() === true,
      permitido: this.permitido,
    };
  }

  /** En carpeta de datos de prueba: el usuario confirma que las tareas pueden correr (esta sesión). */
  permitirAislado(): void {
    this.permitido = true;
  }

  private programarSiguiente(): void {
    if (!this.corriendo) return;
    const ahora = this.ahora().getTime();
    // Al segundo 1 del minuto siguiente: nunca antes de la hora de la tarea.
    const espera = 60_000 - (ahora % 60_000) + 1000;
    this.temporizador = setTimeout(() => {
      this.temporizador = null;
      // El siguiente minuto se agenda ANTES de lanzar: una tarea larga no congela al planificador
      // (las demás siguen su horario y la misma tarea anota `solapada`).
      this.programarSiguiente();
      void this.tick(this.ahora()).catch((e: unknown) =>
        console.error('Error en las tareas programadas:', mensajeDe(e)),
      );
    }, espera);
    this.temporizador.unref?.();
  }

  /* ───────────── Planificación ───────────── */

  private cron(expr: string): Cron {
    let c = this.crons.get(expr);
    if (!c) {
      c = interpretarCron(expr);
      if (this.crons.size > 500) this.crons.clear();
      this.crons.set(expr, c);
    }
    return c;
  }

  /**
   * Revisa qué tareas tocan desde el último minuto revisado hasta `ahora` y las lanza. Resuelve
   * cuando las ejecuciones lanzadas terminan; el temporizador no la espera (agenda el minuto
   * siguiente antes de llamarla), así que una tarea larga no frena a las demás. Una tarea que tocaba
   * hace más de 2 minutos (equipo dormido) se anota como omitida: no se recupera.
   */
  async tick(ahora: Date): Promise<void> {
    // Sin un minuto anterior de referencia (primer tick), no hay nada que recuperar.
    const desde = this.ultimoTick ?? ahora;
    this.ultimoTick = ahora;
    if (this.deteniendo) return;
    const lanzadas: Promise<unknown>[] = [];
    let sitios: Sitio[];
    try {
      sitios = await this.d.leerSitios();
    } catch (e) {
      console.error('No se pudieron leer los sitios para las tareas:', mensajeDe(e));
      return;
    }
    for (const sitio of sitios) {
      for (const tarea of sitio.tareas ?? []) {
        if (!tarea.activa) continue;
        let toca: Date;
        try {
          toca = siguiente(this.cron(tarea.cron), desde, this.zona());
        } catch {
          await this.anotarBloqueo(sitio, tarea, 'cron_invalida', ahora);
          continue;
        }
        if (toca.getTime() > ahora.getTime()) continue;
        if (ahora.getTime() - toca.getTime() > MAX_ATRASO_MS) {
          await this.registrar(sitio.id, tarea.id, {
            inicio: ahora.toISOString(),
            fin: ahora.toISOString(),
            estado: 'omitida',
            codigo: null,
            motivo: 'retraso',
            origen: 'programada',
            duracionMs: 0,
          });
          continue;
        }
        lanzadas.push(this.correrProgramada(sitio, tarea, ahora));
      }
    }
    await Promise.allSettled(lanzadas);
  }

  private async correrProgramada(sitio: Sitio, tarea: TareaSitio, ahora: Date): Promise<void> {
    const solapada = async (): Promise<void> => {
      await this.registrar(sitio.id, tarea.id, {
        inicio: ahora.toISOString(),
        fin: ahora.toISOString(),
        estado: 'omitida',
        codigo: null,
        motivo: 'solapada',
        origen: 'programada',
        duracionMs: 0,
      });
    };
    if (this.enCurso.has(clave(sitio.id, tarea.id))) return solapada();
    const motivo = await this.bloqueoDe(sitio, tarea);
    if (motivo !== null) {
      await this.anotarBloqueo(sitio, tarea, motivo, ahora);
      return;
    }
    this.bloqueos.delete(clave(sitio.id, tarea.id));
    try {
      await this.correr(sitio, tarea, 'programada');
    } catch (e) {
      // Otra ejecución (a mano) ganó mientras se comprobaban las condiciones.
      if (e instanceof ErrorWolf && e.codigo === 'tareas.en_curso') return solapada();
      throw e;
    }
  }

  /** Anota el bloqueo (y avisa) solo si cambió el motivo desde la última vez. */
  private async anotarBloqueo(
    sitio: Sitio,
    tarea: TareaSitio,
    motivo: MotivoTarea,
    ahora: Date,
  ): Promise<void> {
    const k = clave(sitio.id, tarea.id);
    if (this.bloqueos.get(k) === motivo) return;
    this.bloqueos.set(k, motivo);
    await this.registrar(sitio.id, tarea.id, {
      inicio: ahora.toISOString(),
      fin: ahora.toISOString(),
      estado: 'bloqueada',
      codigo: null,
      motivo,
      origen: 'programada',
      duracionMs: 0,
    });
    this.avisar(sitio, tarea, 'avisos.tarea_bloqueada', 'aviso', motivo);
    this.d.emitir?.({ sitioId: sitio.id, tareaId: tarea.id, estado: 'bloqueada' });
  }

  /* ───────────── Condiciones para ejecutar ───────────── */

  /**
   * Primera condición que impide ejecutar la tarea, o null. Es la única puerta: la usan el
   * planificador y "Ejecutar ahora". El orden no cambia lo que corre: todo debe cumplirse.
   */
  private async bloqueoDe(sitio: Sitio, tarea: TareaSitio): Promise<MotivoTarea | null> {
    if (this.d.aislado?.() === true && !this.permitido) return 'aislado';
    if (sitio.confiado !== true || sitio.pendiente) return 'no_confiado';
    // La receta del repositorio cambió desde que el usuario confió: hay que volver a confiar.
    const huella = await this.d.huellaReceta(sitio.carpeta).catch(() => null);
    if (!sitio.recetaConfiada || huella === null || huella !== sitio.recetaConfiada) {
      return 'receta_cambio';
    }
    // El comando que corre es el que el usuario aceptó, ni un argumento más ni uno menos.
    if (tarea.confirmada === null || tarea.confirmada !== huellaTarea(tarea.comando)) {
      return 'sin_confirmar';
    }
    try {
      validarComandoTarea(tarea.comando);
    } catch {
      return 'comando_invalido';
    }
    try {
      this.cron(tarea.cron);
    } catch {
      return 'cron_invalida';
    }
    if (!(await this.d.existeCarpeta(sitio.carpeta))) return 'carpeta';
    return null;
  }

  /** Estado de las tareas de un sitio para la interfaz. */
  async vista(sitioId: string): Promise<VistaTarea[]> {
    const sitio = (await this.d.leerSitios()).find((s) => s.id === sitioId);
    if (!sitio) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${sitioId}`);
    const ahora = this.ahora();
    const res: VistaTarea[] = [];
    for (const tarea of sitio.tareas ?? []) {
      let proxima: string | null = null;
      if (tarea.activa) {
        try {
          proxima = siguiente(this.cron(tarea.cron), ahora, this.zona()).toISOString();
        } catch {
          proxima = null;
        }
      }
      const h = await this.historialDe(sitioId, tarea.id);
      res.push({
        tarea,
        huella: huellaTarea(tarea.comando),
        proxima,
        bloqueo: await this.bloqueoDe(sitio, tarea),
        enCurso: this.enCurso.has(clave(sitioId, tarea.id)),
        ultima: h[0] ?? null,
      });
    }
    return res;
  }

  /* ───────────── Ejecución ───────────── */

  /**
   * "Ejecutar ahora": las mismas condiciones que la programada (confianza, huella de la receta,
   * confirmación del comando, modo aislado), aunque la tarea esté pausada. Si ya corre, falla con
   * `tareas.en_curso`. Un bloqueo lanza el error con su código.
   */
  async ejecutarAhora(sitioId: string, tareaId: string): Promise<EjecucionTarea> {
    if (this.deteniendo) {
      throw new ErrorWolf('tareas.en_curso', 'El planificador se está deteniendo.');
    }
    const sitio = (await this.d.leerSitios()).find((s) => s.id === sitioId);
    if (!sitio) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${sitioId}`);
    const tarea = (sitio.tareas ?? []).find((t) => t.id === tareaId);
    if (!tarea) throw new ErrorWolf('tareas.no_existe', 'La tarea ya no existe.');
    if (this.enCurso.has(clave(sitioId, tareaId))) {
      throw new ErrorWolf('tareas.en_curso', 'La tarea ya se está ejecutando.');
    }
    const motivo = await this.bloqueoDe(sitio, tarea);
    if (motivo !== null) throw errorDeBloqueo(motivo);
    return this.correr(sitio, tarea, 'manual');
  }

  private async correr(
    sitio: Sitio,
    tarea: TareaSitio,
    origen: 'programada' | 'manual',
  ): Promise<EjecucionTarea> {
    const k = clave(sitio.id, tarea.id);
    if (this.enCurso.has(k))
      throw new ErrorWolf('tareas.en_curso', 'La tarea ya se está ejecutando.');
    const control = new AbortController();
    let terminar!: () => void;
    const fin = new Promise<void>((r) => (terminar = r));
    this.enCurso.set(k, { control, fin });
    const inicio = this.ahora();
    const lineas: string[] = [];
    let bytes = 0;
    let descartadas = 0;
    let vencio = false;
    const alLinea = (l: string): void => {
      const limpia = sanear(l.length > MAX_LINEA ? `${l.slice(0, MAX_LINEA)}…` : l);
      const peso = Buffer.byteLength(limpia, 'utf8') + 50;
      if (bytes + peso > MAX_BYTES_SALIDA) {
        descartadas++;
        return;
      }
      // La línea del registro lleva además su marca de fecha (~45 caracteres).
      bytes += peso;
      lineas.push(limpia);
    };
    const reloj = setTimeout(() => {
      vencio = true;
      control.abort();
    }, tarea.tiempoMaxS * 1000);
    reloj.unref?.();
    let estado: EstadoEjecucion;
    let codigo: number | null = null;
    let motivo: MotivoTarea | undefined;
    try {
      const r = await this.d.ejecutar(sitio, [...tarea.comando], {
        senal: control.signal,
        alLinea,
      });
      codigo = r.codigo;
      if (vencio) {
        estado = 'tiempo';
      } else if (control.signal.aborted) {
        estado = 'cancelada';
      } else {
        estado = r.codigo === 0 ? 'ok' : 'fallo';
      }
    } catch (e) {
      if (vencio) estado = 'tiempo';
      else if (control.signal.aborted) estado = 'cancelada';
      else {
        estado = 'fallo';
        motivo = 'error';
        alLinea(`No se pudo ejecutar: ${mensajeDe(e)}`);
      }
    } finally {
      clearTimeout(reloj);
    }
    const fin_ = this.ahora();
    const ejecucion: EjecucionTarea = {
      inicio: inicio.toISOString(),
      fin: fin_.toISOString(),
      estado,
      codigo,
      ...(motivo ? { motivo } : {}),
      origen,
      duracionMs: Math.max(0, fin_.getTime() - inicio.getTime()),
    };
    try {
      const cabecera = `> ${enmascararComando(tarea.comando).join(' ')}`;
      const cierre =
        estado === 'tiempo'
          ? `Se superó el tiempo máximo (${tarea.tiempoMaxS} s): se detuvo la tarea.`
          : estado === 'cancelada'
            ? 'La tarea se canceló (la aplicación se cerró).'
            : `Terminó con el código ${String(codigo)}.`;
      await this.escribirLog(sitio.id, tarea.id, inicio, [
        cabecera,
        ...lineas,
        ...(descartadas > 0 ? [`(salida recortada: ${descartadas} líneas descartadas)`] : []),
        cierre,
      ]);
      await this.registrar(sitio.id, tarea.id, ejecucion);
    } finally {
      this.enCurso.delete(k);
      terminar();
    }
    if (estado === 'fallo' || estado === 'tiempo') {
      this.avisar(sitio, tarea, 'avisos.tarea_fallo', 'error', estado);
    }
    this.d.emitir?.({ sitioId: sitio.id, tareaId: tarea.id, estado });
    return ejecucion;
  }

  private avisar(
    sitio: Sitio,
    tarea: TareaSitio,
    codigo: string,
    nivel: 'aviso' | 'error',
    motivo: string,
  ): void {
    try {
      this.d.avisar({
        nivel,
        tipo: 'proceso-error',
        codigo,
        datos: {
          fuente: `tarea:${sitio.id}:${tarea.id}:${motivo}`,
          nombre: tarea.nombre.slice(0, 60),
          sitio: sitio.dominio.slice(0, 60),
          motivo,
        },
        accion: { ruta: 'proyectos', foco: `sitio:${sitio.id}` },
      });
    } catch (e) {
      console.error('No se pudo publicar el aviso de la tarea:', mensajeDe(e));
    }
  }

  /* ───────────── Registro y historial ───────────── */

  private async escribirLog(
    sitioId: string,
    tareaId: string,
    inicio: Date,
    lineas: string[],
  ): Promise<void> {
    try {
      const ruta = this.d.rutas.logTarea(sitioId, tareaId);
      await mkdir(path.dirname(ruta), { recursive: true });
      try {
        if ((await stat(ruta)).size >= MAX_BYTES_LOG) await rename(ruta, `${ruta}.1`);
      } catch {
        // sin log previo
      }
      const marca = `[WolfCore Dev] ${inicio.toISOString()}`;
      await appendFile(ruta, lineas.map((l) => `${marca} ${sanear(l)}\n`).join(''), 'utf8');
    } catch (e) {
      console.error('No se pudo escribir el registro de la tarea:', mensajeDe(e));
    }
  }

  /** Las últimas líneas del registro de la tarea (ya enmascaradas al escribirlas). */
  async leerLog(sitioId: string, tareaId: string, maxLineas = 300): Promise<string[]> {
    const ruta = this.d.rutas.logTarea(sitioId, tareaId);
    try {
      const texto = await readFile(ruta, 'utf8');
      return texto
        .split('\n')
        .filter((l) => l !== '')
        .slice(-Math.max(1, Math.min(maxLineas, 2000)))
        .map((l) => sanear(l));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw e;
    }
  }

  private async cargarHistorial(): Promise<Map<string, EjecucionTarea[]>> {
    if (this.historial) return this.historial;
    const mapa = new Map<string, EjecucionTarea[]>();
    try {
      const bruto: unknown = JSON.parse(await readFile(this.d.rutas.historialTareas(), 'utf8'));
      if (bruto && typeof bruto === 'object' && !Array.isArray(bruto)) {
        for (const [k, v] of Object.entries(bruto as Record<string, unknown>)) {
          if (!Array.isArray(v) || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_]+$/.test(k)) continue;
          const lista = v
            .map((x) => EjecucionTareaSchema.safeParse(x))
            .filter((r) => r.success)
            .map((r) => r.data)
            .slice(0, MAX_HISTORIAL_TAREA);
          if (lista.length > 0) mapa.set(k, lista);
        }
      }
    } catch {
      // sin historial o ilegible: se empieza de cero
    }
    this.historial = mapa;
    return mapa;
  }

  /** Las 50 últimas ejecuciones de la tarea, la más reciente primero. */
  async historialDe(sitioId: string, tareaId: string): Promise<EjecucionTarea[]> {
    return [...((await this.cargarHistorial()).get(clave(sitioId, tareaId)) ?? [])];
  }

  private async registrar(sitioId: string, tareaId: string, e: EjecucionTarea): Promise<void> {
    const mapa = await this.cargarHistorial();
    const k = clave(sitioId, tareaId);
    const lista = [e, ...(mapa.get(k) ?? [])].slice(0, MAX_HISTORIAL_TAREA);
    mapa.set(k, lista);
    await this.guardarHistorial();
  }

  /** Escribe el historial con archivo temporal y renombrado (nunca queda a medias). */
  private guardarHistorial(): Promise<void> {
    const copia = Object.fromEntries(this.historial ?? new Map());
    this.cola = this.cola
      .catch(() => undefined)
      .then(async () => {
        const ruta = this.d.rutas.historialTareas();
        await mkdir(path.dirname(ruta), { recursive: true });
        const tmp = `${ruta}.${randomBytes(4).toString('hex')}.tmp`;
        await writeFile(tmp, JSON.stringify(copia), 'utf8');
        await rename(tmp, ruta);
      })
      .catch((err: unknown) =>
        console.error('No se pudo guardar el historial de tareas:', mensajeDe(err)),
      );
    return this.cola as Promise<void>;
  }

  /** Borra el historial y los registros (`.log` y `.1`) de una tarea (al borrarla). */
  async olvidar(sitioId: string, tareaId: string): Promise<void> {
    const mapa = await this.cargarHistorial();
    if (mapa.delete(clave(sitioId, tareaId))) await this.guardarHistorial();
    this.bloqueos.delete(clave(sitioId, tareaId));
    try {
      const ruta = this.d.rutas.logTarea(sitioId, tareaId);
      await rm(ruta, { force: true });
      await rm(`${ruta}.1`, { force: true });
    } catch {
      // un registro que no se puede borrar no impide nada
    }
  }

  /**
   * Quita el historial y los registros de los sitios y tareas que ya no existen (al abrir la app y
   * al borrar un sitio). Un nombre de registro que no encaja con `<sitio>-<tarea>.log` no se toca.
   */
  async purgarHuerfanos(): Promise<void> {
    const sitios = await this.d.leerSitios();
    const vigentes = new Set<string>();
    for (const s of sitios) for (const t of s.tareas ?? []) vigentes.add(clave(s.id, t.id));
    const mapa = await this.cargarHistorial();
    let cambio = false;
    for (const k of [...mapa.keys()]) {
      if (!vigentes.has(k)) {
        mapa.delete(k);
        cambio = true;
      }
    }
    if (cambio) await this.guardarHistorial();
    try {
      const carpeta = path.dirname(this.d.rutas.logTarea('x', 'x'));
      for (const f of await readdir(carpeta)) {
        const m = /^([A-Za-z0-9][A-Za-z0-9_-]*)-([A-Za-z0-9][A-Za-z0-9_]*)\.log(?:\.1)?$/.exec(f);
        if (m && !vigentes.has(clave(m[1]!, m[2]!))) {
          await rm(path.join(carpeta, f), { force: true });
        }
      }
    } catch {
      // sin carpeta de registros: nada que purgar
    }
  }

  /** Aborta las ejecuciones en curso de un sitio (cambió su confianza o su carpeta, o se borró). */
  abortarSitio(sitioId: string): void {
    for (const [k, a] of this.enCurso) {
      if (k.startsWith(`${sitioId}/`)) a.control.abort();
    }
  }
}

function errorDeBloqueo(motivo: MotivoTarea): ErrorWolf {
  switch (motivo) {
    case 'aislado':
      return new ErrorWolf('tareas.aislado', MENSAJES_BLOQUEO.aislado);
    case 'no_confiado':
      return new ErrorWolf('tareas.sitio_no_confiado', MENSAJES_BLOQUEO.no_confiado);
    case 'receta_cambio':
      return new ErrorWolf('tareas.receta_cambio', MENSAJES_BLOQUEO.receta_cambio);
    case 'sin_confirmar':
      return new ErrorWolf('tareas.sin_confirmar', MENSAJES_BLOQUEO.sin_confirmar);
    case 'carpeta':
      return new ErrorWolf('tareas.carpeta', MENSAJES_BLOQUEO.carpeta);
    case 'comando_invalido':
      return new ErrorWolf('tareas.comando_invalido', 'El comando de la tarea no es válido.', {
        detalle: '',
      });
    case 'cron_invalida':
      return new ErrorWolf('tareas.cron_invalida', 'La expresión cron no es válida.', {
        detalle: '',
      });
    default:
      return new ErrorWolf('tareas.invalida', 'La tarea no se puede ejecutar ahora.', {
        detalle: motivo,
      });
  }
}

const MENSAJES_BLOQUEO = {
  aislado:
    'Esta es una carpeta de datos de prueba (WOLFCORE_DATOS): permita las tareas programadas para ejecutarlas.',
  no_confiado: 'Marque "Confío en este repositorio" en el proyecto para ejecutar sus tareas.',
  receta_cambio:
    'La receta del proyecto cambió desde que confió en él: revísela y vuelva a marcar "Confío en este repositorio".',
  sin_confirmar: 'Confirme el comando de la tarea para poder ejecutarla.',
  carpeta: 'La carpeta del proyecto no existe.',
} as const;
