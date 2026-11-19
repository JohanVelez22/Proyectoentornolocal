import { randomBytes } from 'node:crypto';
import { ErrorWolf } from '../errores';
import { readFileSync } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { EstadoPasoReceta, Eventos, EventosNucleo, ProgresoReceta } from '../eventos';
import type { Rutas } from '../rutas';
import type { ProcesoProyecto, Sitio } from '../tipos';
import {
  leerConfigProyecto,
  motorBdDe,
  PasoRecetaSchema,
  type PasoReceta,
  type TipoPaso,
} from './config';
import { detectarProyecto, type Deteccion } from './detectar';
import type { RegistroPasos } from './pasos';
import { nombreEjecutable } from '../plataforma/sistema';

export const MENSAJE_NO_CONFIADO = 'Marque "Confío en este repositorio" para ejecutar la receta';
export const MENSAJE_EN_CURSO = 'Ya hay una receta en curso para este proyecto';
const MENSAJE_INTERRUMPIDA = 'Se interrumpió al cerrar el programa';

/** Marcador del puerto libre en el comando de un proceso; lo reemplaza el paso sitio-crear. */
export const MARCADOR_PUERTO = '{puerto}';

/** Líneas de registro que se guardan por paso (las últimas). */
export const MAX_LINEAS_PASO = 500;

/** Largo máximo de una línea del registro; lo que sobra se corta con "…". */
export const MAX_BYTES_LINEA = 4096;

/** Plazo para que un paso termine tras cancelar; después se da por colgado. */
export const GRACIA_CANCELACION_MS = 10_000;
const MENSAJE_SIN_RESPUESTA = 'Cancelado: el paso no respondió';

const SECRETOS: [RegExp, string][] = [
  // Credenciales en URLs: esquema://usuario:clave@host
  [/(:\/\/)[^\s/@:]+:[^\s/@]*@/g, '$1***@'],
  // password=…, PASSWORD=…, DB_PASSWORD=…, --password=…
  [/(password\s*=\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1***'],
  // Clave pegada de mysql: -pclave
  [/(^|\s)-p(?=\S)\S+/g, '$1-p***'],
  // Tokens de GitHub
  [/\bgithub_pat_[A-Za-z0-9_]+/g, 'github_pat_***'],
  [/\b(gh[pousr])_[A-Za-z0-9]+/g, '$1_***'],
  // Claves de IA (OpenAI y compatibles, Anthropic, Google)
  [/\bsk-[A-Za-z0-9_-]{16,}/g, 'sk-***'],
  [/\bAIza[0-9A-Za-z_-]{30,}/g, 'AIza***'],
];

/**
 * Enmascara credenciales (URLs con usuario:clave, password=…, -p de mysql, tokens de GitHub) y
 * corta la línea a MAX_BYTES_LINEA caracteres con "…". Se aplica a todo lo que el motor emite y
 * guarda.
 */
export function sanear(texto: string): string {
  let t = texto;
  for (const [patron, reemplazo] of SECRETOS) t = t.replace(patron, reemplazo);
  return t.length > MAX_BYTES_LINEA ? t.slice(0, MAX_BYTES_LINEA) + '…' : t;
}

/**
 * Carpeta de trabajo de un paso: la del proyecto o, con `args.carpeta`, una subcarpeta relativa
 * (FastAPI en `admin/`). Nunca sale del proyecto: rutas absolutas o con `..` se rechazan.
 */
export function carpetaDelPaso(raiz: string, sub: unknown): string {
  if (sub === undefined || sub === null || sub === '' || sub === 'raiz') return raiz;
  const rel = typeof sub === 'string' ? sub.replace(/\\/g, '/') : '';
  const tramos = rel.split('/').filter((t) => t && t !== '.');
  if (
    !rel ||
    rel.startsWith('/') ||
    /^[a-z]:/i.test(rel) ||
    tramos.length === 0 ||
    tramos.some((t) => t === '..')
  ) {
    throw new Error(`La carpeta del paso debe estar dentro del proyecto: ${String(sub)}`);
  }
  return path.join(raiz, ...tramos);
}

/* ───────────── Receta por defecto ───────────── */

/**
 * Proceso uvicorn de un proyecto FastAPI (con el Python del .venv del proyecto). Usa el módulo
 * ASGI detectado (`app.main:app`) y, si la app está en una subcarpeta, corre ahí.
 */
function procesoUvicorn(det: Pick<Deteccion, 'moduloAsgi' | 'subcarpeta'> = {}): ProcesoProyecto {
  return {
    id: 'uvicorn',
    nombre: 'uvicorn',
    comando: [
      `.venv\\Scripts\\${nombreEjecutable('python')}`,
      '-m',
      'uvicorn',
      det.moduloAsgi ?? 'app:app',
      '--host',
      '127.0.0.1',
      '--port',
      MARCADOR_PUERTO,
    ],
    cwd: det.subcarpeta ?? 'raiz',
    autoIniciar: true,
    reiniciar: true,
    puerto: null,
    // Destino del proxy de Nginx aunque luego se agregue otro proceso con puerto (vite).
    proxy: true,
  };
}

/**
 * Receta por defecto según la detección (spec 3.1). El id de cada paso es su tipo. El sitio se
 * crea siempre con HTTPS. En FastAPI el "proceso uvicorn" va dentro de `sitio-crear`
 * (`args.procesos`): ese paso lo registra en `sitio.procesos` con un puerto libre (Task 4).
 */
export function recetaPorDefecto(det: Deteccion): PasoReceta[] {
  const receta: PasoReceta[] = [];
  const motor = motorBdDe(det.servicios);
  const paso = (
    tipo: TipoPaso,
    titulo: string,
    extra: Pick<PasoReceta, 'args' | 'opcional'> = {},
  ): void => {
    receta.push({ id: tipo, tipo, titulo, ...extra });
  };
  const composer = (): void => paso('composer-install', 'Instalar dependencias de PHP (composer)');
  // Con la app en una subcarpeta (FastAPI en admin/), los pasos de Python y el .env van ahí.
  const enApp = det.subcarpeta ? { args: { carpeta: det.subcarpeta } } : {};
  const env = (): void => paso('env-crear', 'Crear el archivo .env', enApp);
  const bdCrear = (): void => {
    if (motor) paso('bd-crear', 'Crear la base de datos', { args: { motor } });
  };
  const npm = (): void => {
    if (!det.tienePackageJson) return;
    paso('npm-ci', 'Instalar dependencias de Node (npm ci)');
    if (det.scriptsNpm.includes('build')) paso('npm-build', 'Compilar recursos (npm run build)');
  };
  const sitio = (args: Record<string, unknown> = {}): void =>
    paso('sitio-crear', `Crear el sitio ${det.dominioSugerido}`, {
      args: { tipo: det.tipo, dominio: det.dominioSugerido, php: det.php, https: true, ...args },
    });

  switch (det.tipo) {
    case 'laravel':
      composer();
      env();
      paso('key-generate', 'Generar la clave de la aplicación');
      bdCrear();
      paso('migrar', 'Migrar la base de datos');
      paso('storage-link', 'Enlazar storage (storage:link)');
      npm();
      sitio();
      break;
    case 'codeigniter3':
    case 'codeigniter4':
      if (det.tieneComposer) composer();
      env();
      bdCrear();
      // bd-restaurar no va por defecto: el asistente lo agrega si el usuario elige un respaldo.
      if (det.tipo === 'codeigniter4') {
        // El paso migrar elige `php spark migrate` por el tipo del sitio.
        paso('migrar', 'Migrar la base de datos (spark migrate)');
      }
      sitio();
      break;
    case 'fastapi':
      paso('python-venv', 'Crear el entorno virtual (.venv)', enApp);
      if (det.tieneRequirements || det.tienePyproject) {
        paso('pip-install', 'Instalar dependencias de Python (pip)', enApp);
      }
      env();
      bdCrear();
      if (det.pgvector) paso('pgvector-activar', 'Activar pgvector en la base');
      sitio({ procesos: [procesoUvicorn(det)] });
      break;
    default:
      if (det.tieneComposer) composer();
      npm();
      sitio();
  }
  return receta;
}

/**
 * Argumentos que solo puede dar el usuario desde la interfaz (confirmaciones y rutas elegidas en
 * un diálogo): un wolfcore.yml del repositorio nunca los trae.
 */
export const ARGS_SOLO_INTERFAZ = ['sobrescribir', 'confirmarSobrescribir', 'archivo'] as const;

function sinArgsDeInterfaz(p: PasoReceta): PasoReceta {
  if (!p.args) return p;
  const args = { ...p.args };
  for (const k of ARGS_SOLO_INTERFAZ) delete args[k];
  return { ...p, args };
}

/** Argumentos que no se repiten al reinstalar: `semilla` (--seed) duplicaría los datos de prueba. */
export const ARGS_SIN_REPETIR = ['semilla'] as const;

/** Un paso guardado listo para repetirse: sin argumentos de interfaz ni de una sola vez. */
function paraRepetir(p: PasoReceta): PasoReceta {
  const limpio = sinArgsDeInterfaz(p);
  if (!limpio.args) return limpio;
  const args = { ...limpio.args };
  for (const k of ARGS_SIN_REPETIR) delete args[k];
  return { ...limpio, args };
}

/**
 * Receta que se ejecuta para una carpeta: la de `wolfcore.yml` si trae pasos (sin los argumentos
 * de `ARGS_SOLO_INTERFAZ`); si no (o no hay archivo), la receta por defecto. Un wolfcore.yml no
 * válido lanza su error en español.
 */
export async function recetaEfectiva(carpeta: string, det: Deteccion): Promise<PasoReceta[]> {
  const config = await leerConfigProyecto(carpeta);
  if (config && config.receta.length > 0) return config.receta.map(sinArgsDeInterfaz);
  return recetaPorDefecto(det);
}

/* ───────────── Estado ───────────── */

export const ESTADOS_RECETA = [
  'inactiva',
  'corriendo',
  'lista',
  'error',
  'cancelada',
  'incompleta',
] as const;
/**
 * - `inactiva`: nunca se ejecutó (o su estado se perdió).
 * - `lista`: todos los pasos quedaron listos u omitidos.
 * - `incompleta`: quedan pasos pendientes (p. ej. tras reintentar uno solo con `soloPaso`).
 */
export type EstadoGeneralReceta = (typeof ESTADOS_RECETA)[number];

const ESTADOS_PASO = ['pendiente', 'corriendo', 'listo', 'error', 'omitido'] as const;

const PasoConEstadoSchema = PasoRecetaSchema.extend({
  estado: z.enum(ESTADOS_PASO),
  /** Mensaje del error, si falló. */
  mensaje: z.string().optional(),
  /** Últimas líneas del registro del paso. */
  log: z.array(z.string()).default([]),
});
export type PasoConEstado = z.infer<typeof PasoConEstadoSchema>;

const EstadoRecetaSchema = z.object({
  sitioId: z.string(),
  estado: z.enum(ESTADOS_RECETA),
  pasos: z.array(PasoConEstadoSchema),
  /** Fecha ISO del último cambio; null si nunca se ejecutó. */
  actualizado: z.string().nullable(),
});
export type EstadoReceta = z.infer<typeof EstadoRecetaSchema>;

export interface ResultadoReceta {
  estado: Exclude<EstadoGeneralReceta, 'inactiva' | 'corriendo'>;
  /** Paso que falló. */
  pasoId?: string;
  mensaje?: string;
}

export interface OpcionesReceta {
  /** Corre desde este paso hasta el final; los anteriores que no estaban listos quedan omitidos. */
  desde?: string;
  /** Corre solo este paso; los demás conservan su estado. */
  soloPaso?: string;
  /** Receta a usar (la que editó el usuario en el asistente); si falta, ver `ejecutar`. */
  receta?: PasoReceta[];
  /**
   * Repite la receta guardada de la última corrida ("Reinstalar dependencias"), sin los
   * argumentos de interfaz (`ARGS_SOLO_INTERFAZ`) y sin restaurar respaldos (esos pasos quedan
   * omitidos). Sin receta guardada usa la del proyecto.
   */
  guardada?: boolean;
  /**
   * Corrida suelta (p. ej. los pasos sugeridos tras traer cambios): corre `receta` sin tocar la
   * receta guardada ni su estado; sus eventos llevan `suelta: true`.
   */
  suelta?: boolean;
}

/** Mensaje al intentar omitir un paso que no se puede omitir. */
export const MENSAJE_NO_OMITIBLE = 'El paso "Crear el sitio" no se puede omitir.';

/** Pasos sin los que no queda proyecto: no se omiten. */
const PASOS_NO_OMITIBLES: readonly TipoPaso[] = ['sitio-crear'];

export interface DepsRecetas {
  rutas: Rutas;
  eventos: Eventos<EventosNucleo>;
  pasos: RegistroPasos;
  sitio: (id: string) => Sitio | undefined | Promise<Sitio | undefined>;
  /** Receta de un sitio. Por defecto, `recetaEfectiva` sobre la detección de su carpeta. */
  receta?: (sitio: Sitio) => Promise<PasoReceta[]>;
  /** Plazo de gracia tras cancelar (ms). Por defecto GRACIA_CANCELACION_MS. */
  graciaCancelacionMs?: number;
}

const RecetaSchema = z.array(PasoRecetaSchema).superRefine((r, ctx) => {
  const vistos = new Set<string>();
  r.forEach((p, i) => {
    if (vistos.has(p.id)) {
      ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `El id "${p.id}" está repetido` });
    }
    vistos.add(p.id);
  });
});

const mensajeError = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const inactiva = (sitioId: string): EstadoReceta => ({
  sitioId,
  estado: 'inactiva',
  pasos: [],
  actualizado: null,
});

function sinEstado(p: PasoConEstado): PasoReceta {
  const { estado: _e, mensaje: _m, log: _l, ...def } = p;
  void _e;
  void _m;
  void _l;
  return def;
}

function general(pasos: readonly PasoConEstado[]): ResultadoReceta['estado'] {
  if (pasos.some((p) => p.estado === 'error')) return 'error';
  return pasos.every((p) => p.estado === 'listo' || p.estado === 'omitido')
    ? 'lista'
    : 'incompleta';
}

async function escribirAtomico(ruta: string, texto: string): Promise<void> {
  await mkdir(path.dirname(ruta), { recursive: true });
  const tmp = `${ruta}.${randomBytes(4).toString('hex')}.tmp`;
  try {
    await writeFile(tmp, texto, 'utf8');
    for (let intento = 0; ; intento++) {
      try {
        await rename(tmp, ruta);
        break;
      } catch (e) {
        // En Windows el destino puede estar abierto un instante por un lector.
        const codigo = (e as NodeJS.ErrnoException).code;
        if (intento >= 4 || (codigo !== 'EPERM' && codigo !== 'EBUSY')) throw e;
        await new Promise((r) => setTimeout(r, 50 * (intento + 1)));
      }
    }
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  }
}

/* ───────────── Motor ───────────── */

/**
 * Ejecuta la receta de un proyecto, un paso a la vez, con su registro en vivo por el evento
 * `receta:progreso`. Si un paso falla se detiene y nada se deshace: el usuario reintenta
 * (`soloPaso` o `desde`), omite (`omitir`) o cancela. Solo una receta por proyecto a la vez y
 * solo con `sitio.confiado`. El estado se guarda en run/receta-<id>.json.
 */
export class EjecutorRecetas {
  private readonly estados = new Map<string, EstadoReceta>();
  private readonly activas = new Map<string, AbortController>();
  private readonly escrituras = new Map<string, Promise<void>>();
  /** Proyectos con una corrida suelta en curso: ni se guarda ni reemplaza su estado. */
  private readonly sueltas = new Set<string>();

  constructor(private readonly d: DepsRecetas) {}

  /**
   * Ejecuta la receta. Sin opciones corre todos los pasos con la receta actual del proyecto
   * (`opciones.receta` o la de `DepsRecetas.receta`). Con `desde`/`soloPaso` sigue con la receta
   * de la última ejecución, si la hay.
   */
  ejecutar(sitioId: string, opciones: OpcionesReceta = {}): Promise<ResultadoReceta> {
    return this.correr(sitioId, opciones, null);
  }

  /** Marca el paso como omitido y sigue desde el siguiente. */
  omitir(sitioId: string, pasoId: string): Promise<ResultadoReceta> {
    return this.correr(sitioId, {}, pasoId);
  }

  /** Cancela la receta en curso del proyecto. false si no había ninguna. */
  cancelar(sitioId: string): boolean {
    const control = this.activas.get(sitioId);
    if (!control || control.signal.aborted) return false;
    control.abort();
    return true;
  }

  /** Estado de la receta (en memoria o el guardado en run/receta-<id>.json). */
  estado(sitioId: string): EstadoReceta {
    let e = this.estados.get(sitioId);
    if (!e) {
      e = this.cargar(sitioId);
      this.estados.set(sitioId, e);
    }
    return structuredClone(e);
  }

  /** Lee el estado guardado. Un archivo dañado cuenta como "sin estado". */
  private cargar(sitioId: string): EstadoReceta {
    let datos: unknown;
    try {
      const texto = readFileSync(this.d.rutas.receta(sitioId), 'utf8');
      datos = JSON.parse(texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto);
    } catch {
      return inactiva(sitioId);
    }
    const r = EstadoRecetaSchema.safeParse(datos);
    if (!r.success) return inactiva(sitioId);
    const e = { ...r.data, sitioId };
    if (e.estado === 'corriendo' || e.pasos.some((p) => p.estado === 'corriendo')) {
      // El programa se cerró a mitad de la receta.
      for (const p of e.pasos) {
        if (p.estado === 'corriendo') {
          p.estado = 'error';
          p.mensaje = MENSAJE_INTERRUMPIDA;
        }
      }
      e.estado = general(e.pasos);
    }
    return e;
  }

  private async correr(
    sitioId: string,
    op: OpcionesReceta,
    omitirId: string | null,
  ): Promise<ResultadoReceta> {
    if (op.desde !== undefined && op.soloPaso !== undefined) {
      throw new Error('Use "desde" o "soloPaso", no ambos');
    }
    const parcial = op.desde !== undefined || op.soloPaso !== undefined || omitirId !== null;
    if (op.suelta) {
      if (!op.receta) throw new Error('Una corrida suelta necesita su receta');
      if (parcial || op.guardada) {
        throw new Error('Una corrida suelta no se combina con otras opciones');
      }
    }
    if (op.guardada && (parcial || op.receta)) {
      throw new Error('"guardada" no se combina con otras opciones');
    }
    if (this.activas.has(sitioId))
      throw new ErrorWolf('proyectos.receta_en_curso', MENSAJE_EN_CURSO);
    const control = new AbortController();
    this.activas.set(sitioId, control);
    try {
      const sitio = await this.d.sitio(sitioId);
      if (!sitio) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto "${sitioId}"`);
      if (sitio.confiado !== true)
        throw new ErrorWolf('proyectos.no_confiado', MENSAJE_NO_CONFIADO);

      const previo = this.estado(sitioId);
      const continua = parcial;
      const guardada = op.guardada === true && previo.pasos.length > 0;
      const receta = guardada
        ? previo.pasos.map((p) => paraRepetir(sinEstado(p)))
        : await this.receta(sitio, op, continua ? previo : null);
      const indice = (id: string): number => {
        const i = receta.findIndex((p) => p.id === id);
        if (i < 0) throw new Error(`El paso "${id}" no está en la receta`);
        return i;
      };

      const anteriores = new Map(previo.pasos.map((p) => [p.id, p]));
      const pasos: PasoConEstado[] = receta.map((def) => {
        const a = continua ? anteriores.get(def.id) : undefined;
        return a
          ? { ...def, estado: a.estado, mensaje: a.mensaje, log: [...a.log] }
          : { ...def, estado: 'pendiente', log: [] };
      });

      let aCorrer: number[];
      const omitidos: number[] = [];
      if (op.soloPaso !== undefined) {
        aCorrer = [indice(op.soloPaso)];
      } else if (op.desde !== undefined || omitirId !== null) {
        if (omitirId !== null && PASOS_NO_OMITIBLES.includes(receta[indice(omitirId)]!.tipo)) {
          throw new ErrorWolf('proyectos.paso_no_omitible', MENSAJE_NO_OMITIBLE);
        }
        const inicio = op.desde !== undefined ? indice(op.desde) : indice(omitirId!) + 1;
        pasos.slice(0, inicio).forEach((p, i) => {
          if (p.id === omitirId || (p.estado !== 'listo' && p.estado !== 'omitido')) {
            p.estado = 'omitido';
            p.mensaje = undefined;
            omitidos.push(i);
          }
        });
        aCorrer = pasos.map((_, i) => i).slice(inicio);
      } else if (guardada) {
        // Reinstalar no vuelve a restaurar respaldos: pisaría la base con datos viejos.
        aCorrer = [];
        pasos.forEach((p, i) => {
          if (p.tipo === 'bd-restaurar') {
            Object.assign(p, { estado: 'omitido', mensaje: undefined, log: [] });
            omitidos.push(i);
          } else aCorrer.push(i);
        });
      } else {
        aCorrer = pasos.map((_, i) => i);
      }
      for (const i of aCorrer) {
        Object.assign(pasos[i]!, { estado: 'pendiente', mensaje: undefined, log: [] });
      }

      const e: EstadoReceta = { sitioId, estado: 'corriendo', pasos, actualizado: null };
      if (op.suelta) this.sueltas.add(sitioId);
      else this.estados.set(sitioId, e);
      for (const i of omitidos) this.emitir(sitioId, pasos[i]!.id, 'omitido');
      for (const i of aCorrer) this.emitir(sitioId, pasos[i]!.id, 'pendiente');
      this.guardar(e);

      let fallo: ResultadoReceta | null = null;
      for (const i of aCorrer) {
        if (control.signal.aborted) break;
        fallo = await this.correrPaso(sitio, e, pasos[i]!, control.signal);
        if (fallo || control.signal.aborted) break;
      }

      e.estado = control.signal.aborted ? 'cancelada' : (fallo?.estado ?? general(pasos));
      this.guardar(e);
      await this.escrituras.get(sitioId);
      if (e.estado === 'error') {
        // El paso que acaba de fallar o, si no (p. ej. soloPaso), el primero que sigue en error.
        if (fallo) return fallo;
        const primero = pasos.find((p) => p.estado === 'error')!;
        return { estado: 'error', pasoId: primero.id, mensaje: primero.mensaje };
      }
      return { estado: e.estado as ResultadoReceta['estado'] };
    } finally {
      if (this.activas.get(sitioId) === control) {
        this.activas.delete(sitioId);
        this.sueltas.delete(sitioId);
      }
    }
  }

  private async receta(
    sitio: Sitio,
    op: OpcionesReceta,
    previo: EstadoReceta | null,
  ): Promise<PasoReceta[]> {
    let receta: unknown;
    if (op.receta) receta = op.receta;
    else if (previo && previo.pasos.length > 0) receta = previo.pasos.map(sinEstado);
    else if (this.d.receta) receta = await this.d.receta(sitio);
    else receta = await recetaEfectiva(sitio.carpeta, await detectarProyecto(sitio.carpeta));
    const r = RecetaSchema.safeParse(receta);
    if (!r.success) {
      throw new Error(`La receta no es válida: ${r.error.issues.map((i) => i.message).join('; ')}`);
    }
    return r.data;
  }

  /** Corre un paso. Devuelve el resultado de error si falló (no si se canceló). */
  private async correrPaso(
    sitio: Sitio,
    e: EstadoReceta,
    paso: PasoConEstado,
    senal: AbortSignal,
  ): Promise<ResultadoReceta | null> {
    const { sitioId } = e;
    paso.estado = 'corriendo';
    this.emitir(sitioId, paso.id, 'corriendo');
    this.guardar(e);

    let vivo = true;
    const agregar = (texto: string): void => {
      paso.log.push(texto);
      if (paso.log.length > MAX_LINEAS_PASO) paso.log.splice(0, paso.log.length - MAX_LINEAS_PASO);
    };
    try {
      const impl = this.d.pasos.obtener(paso.tipo);
      if (!impl) throw new Error(`No hay implementación para el paso de tipo "${paso.tipo}"`);
      const carpeta = carpetaDelPaso(sitio.carpeta, paso.args?.carpeta);
      const trabajo = Promise.resolve().then(() =>
        impl({
          sitio,
          paso: sinEstado(paso),
          carpeta,
          senal,
          linea: (texto) => {
            if (!vivo) return;
            for (const bruta of String(texto)
              .replace(/\r?\n$/, '')
              .split(/\r?\n/)) {
              const l = sanear(bruta);
              agregar(l);
              this.emitir(sitioId, paso.id, 'corriendo', l);
            }
          },
        }),
      );
      if ((await this.esperarPaso(trabajo, senal)) === 'colgado') {
        // No respondió a la cancelación: se suelta (su resultado, si llega, se ignora).
        vivo = false;
        paso.estado = 'error';
        paso.mensaje = MENSAJE_SIN_RESPUESTA;
        agregar(MENSAJE_SIN_RESPUESTA);
        this.emitir(sitioId, paso.id, 'error', MENSAJE_SIN_RESPUESTA);
        this.guardar(e);
        return null;
      }
      vivo = false;
      paso.estado = 'listo';
      this.emitir(sitioId, paso.id, 'listo');
      this.guardar(e);
      return null;
    } catch (err) {
      vivo = false;
      if (senal.aborted) {
        paso.estado = 'pendiente';
        this.emitir(sitioId, paso.id, 'pendiente');
        return null;
      }
      const mensaje = sanear(mensajeError(err));
      paso.estado = 'error';
      paso.mensaje = mensaje;
      agregar(mensaje);
      this.emitir(sitioId, paso.id, 'error', mensaje);
      this.guardar(e);
      return { estado: 'error', pasoId: paso.id, mensaje };
    }
  }

  /**
   * Espera al paso. Si se cancela y no termina dentro del plazo de gracia devuelve 'colgado';
   * si termina, 'ok' o su error.
   */
  private esperarPaso(trabajo: Promise<void>, senal: AbortSignal): Promise<'ok' | 'colgado'> {
    const gracia = this.d.graciaCancelacionMs ?? GRACIA_CANCELACION_MS;
    return new Promise((resolve, reject) => {
      let reloj: ReturnType<typeof setTimeout> | undefined;
      const alAbortar = (): void => {
        reloj = setTimeout(() => resolve('colgado'), gracia);
      };
      if (senal.aborted) alAbortar();
      else senal.addEventListener('abort', alAbortar, { once: true });
      trabajo
        .then(() => resolve('ok'), reject)
        .finally(() => {
          clearTimeout(reloj);
          senal.removeEventListener('abort', alAbortar);
        });
    });
  }

  private emitir(sitioId: string, pasoId: string, estado: EstadoPasoReceta, linea?: string): void {
    const p: ProgresoReceta =
      linea === undefined ? { sitioId, pasoId, estado } : { sitioId, pasoId, estado, linea };
    if (this.sueltas.has(sitioId)) p.suelta = true;
    this.d.eventos.emit('receta:progreso', p);
  }

  /** Encola la escritura atómica del estado (una a la vez por proyecto). Nunca lanza. */
  private guardar(e: EstadoReceta): void {
    // Una corrida suelta no reemplaza el estado guardado de la receta principal.
    if (this.sueltas.has(e.sitioId)) return;
    e.actualizado = new Date().toISOString();
    const texto = JSON.stringify(e, null, 2) + '\n';
    const anterior = this.escrituras.get(e.sitioId) ?? Promise.resolve();
    const siguiente = anterior
      .then(() => escribirAtomico(this.d.rutas.receta(e.sitioId), texto))
      .catch((err: unknown) => {
        console.error(`No se pudo guardar el estado de la receta de ${e.sitioId}:`, err);
      });
    this.escrituras.set(e.sitioId, siguiente);
  }
}
