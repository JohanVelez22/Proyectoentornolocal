import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { ErrorWolf } from '../errores';
import {
  leerConfigProyecto,
  escribirConfigProyecto,
  type ConfigProyecto,
  type TareaProyecto,
} from '../proyectos/config';
import {
  ID_TAREA,
  MAX_TAREAS_SITIO,
  TIEMPO_TAREA_DEFECTO_S,
  TIEMPO_TAREA_MAX_S,
  TIEMPO_TAREA_MIN_S,
  type Config,
  type Sitio,
  type TareaSitio,
} from '../tipos';
import { huellaTarea, validarComandoTarea } from './comando';
import { interpretarCron, siguiente, zonaLocal } from './cron';
import type { EjecucionTarea, Programador } from './programador';

/**
 * Altas, cambios y confirmaciones de las tareas programadas de un sitio (D29). Es lo único que
 * escribe `sitio.tareas`: ni `guardarSitio` ni un perfil importado pueden poner una tarea
 * confirmada. Una tarea se confirma cuando el usuario la guarda o la adopta desde la interfaz,
 * con la huella del comando que vio.
 */

export interface DepsGestorTareas {
  leerSitios: () => Promise<Sitio[]>;
  modificarConfig: (fn: (c: Config) => void) => Promise<void>;
  programador: Programador;
  /** Para los tests: lectura y escritura de `wolfcore.yml` (por omisión las reales). */
  leerYml?: (carpeta: string) => Promise<ConfigProyecto | null>;
  escribirYml?: (carpeta: string, c: ConfigProyecto) => Promise<void>;
}

/** Lo que la interfaz manda al guardar una tarea (el núcleo valida todo y rechaza campos de más). */
const EntradaTareaSchema = z
  .object({
    id: z.string().regex(ID_TAREA).optional(),
    nombre: z.string().trim().min(1).max(80),
    cron: z.string().max(100),
    comando: z.array(z.string()).min(1),
    activa: z.boolean(),
    tiempoMaxS: z.number().int().min(TIEMPO_TAREA_MIN_S).max(TIEMPO_TAREA_MAX_S).optional(),
  })
  .strict();
export type EntradaTarea = z.input<typeof EntradaTareaSchema>;

export interface PropuestaTarea {
  id: string;
  nombre: string;
  cron: string;
  comando: string[];
  tiempoMaxS: number;
  /** Huella del comando: la interfaz la devuelve al adoptar, para confirmar lo que se vio. */
  huella: string;
  estado: 'nueva' | 'adoptada' | 'cambiada';
  /** Código de error si el cron o el comando no valen (no se puede adoptar). */
  error?: string;
}

const invalida = (detalle: string): ErrorWolf =>
  new ErrorWolf('tareas.invalida', `La tarea no es válida: ${detalle}`, { detalle });

export class GestorTareas {
  constructor(private readonly d: DepsGestorTareas) {}

  private async sitio(sitioId: string): Promise<Sitio> {
    const s = (await this.d.leerSitios()).find((x) => x.id === sitioId);
    if (!s) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${sitioId}`);
    return s;
  }

  /** Aplica `fn` a la lista de tareas del sitio dentro de la cola de la configuración. */
  private async cambiar(
    sitioId: string,
    fn: (tareas: TareaSitio[]) => TareaSitio[],
  ): Promise<void> {
    let existe = false;
    await this.d.modificarConfig((cfg) => {
      const s = cfg.sitios.find((x) => x.id === sitioId);
      if (!s) return;
      existe = true;
      s.tareas = fn([...(s.tareas ?? [])]);
    });
    if (!existe) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${sitioId}`);
  }

  /**
   * Crea o edita una tarea (con `id`). Guardar desde el diálogo es confirmar el comando que se ve
   * ahí: queda confirmada con la huella de exactamente esos argumentos.
   */
  async guardar(sitioId: string, entrada: unknown): Promise<TareaSitio> {
    const r = EntradaTareaSchema.safeParse(entrada);
    if (!r.success) {
      throw invalida(
        r.error.issues
          .slice(0, 3)
          .map((i) => i.path.join('.') || 'raíz')
          .join(', '),
      );
    }
    const e = r.data;
    // Estas dos lanzan su propio error con código (`tareas.cron_invalida`, `tareas.comando_invalido`).
    const cron = interpretarCron(e.cron).expresion;
    validarComandoTarea(e.comando);
    let guardada!: TareaSitio;
    await this.cambiar(sitioId, (tareas) => {
      const previa = e.id ? tareas.find((t) => t.id === e.id) : undefined;
      if (e.id && !previa) throw new ErrorWolf('tareas.no_existe', 'La tarea ya no existe.');
      if (!previa && tareas.length >= MAX_TAREAS_SITIO) {
        throw new ErrorWolf('tareas.demasiadas', 'Hay demasiadas tareas en este proyecto.', {
          maximo: MAX_TAREAS_SITIO,
        });
      }
      let id = previa?.id;
      while (!id || (!previa && tareas.some((t) => t.id === id))) {
        id = `t_${randomBytes(4).toString('hex')}`;
      }
      guardada = {
        id,
        nombre: e.nombre,
        cron,
        comando: [...e.comando],
        activa: e.activa,
        confirmada: huellaTarea(e.comando),
        tiempoMaxS: e.tiempoMaxS ?? previa?.tiempoMaxS ?? TIEMPO_TAREA_DEFECTO_S,
        origen: previa?.origen ?? 'usuario',
      };
      return previa ? tareas.map((t) => (t.id === id ? guardada : t)) : [...tareas, guardada];
    });
    return guardada;
  }

  /**
   * Confirma la tarea tal como está (una que no estaba confirmada: llegó de un config.json
   * editado a mano). `huella` es la del comando que el usuario vio: si ya cambió, no se confirma.
   */
  async confirmar(sitioId: string, tareaId: string, huella: string): Promise<TareaSitio> {
    let res!: TareaSitio;
    await this.cambiar(sitioId, (tareas) => {
      const t = tareas.find((x) => x.id === tareaId);
      if (!t) throw new ErrorWolf('tareas.no_existe', 'La tarea ya no existe.');
      validarComandoTarea(t.comando);
      interpretarCron(t.cron);
      if (huellaTarea(t.comando) !== huella) throw invalida('el comando cambió');
      res = { ...t, confirmada: huella };
      return tareas.map((x) => (x.id === tareaId ? res : x));
    });
    return res;
  }

  /** Pausa o reanuda una tarea (no cambia su confirmación). */
  async activar(sitioId: string, tareaId: string, activa: boolean): Promise<TareaSitio> {
    let res!: TareaSitio;
    await this.cambiar(sitioId, (tareas) => {
      const t = tareas.find((x) => x.id === tareaId);
      if (!t) throw new ErrorWolf('tareas.no_existe', 'La tarea ya no existe.');
      res = { ...t, activa };
      return tareas.map((x) => (x.id === tareaId ? res : x));
    });
    return res;
  }

  async borrar(sitioId: string, tareaId: string): Promise<void> {
    await this.cambiar(sitioId, (tareas) => tareas.filter((t) => t.id !== tareaId));
    await this.d.programador.olvidar(sitioId, tareaId);
  }

  /* ───────────── wolfcore.yml ───────────── */

  private leerYml(carpeta: string): Promise<ConfigProyecto | null> {
    return (this.d.leerYml ?? leerConfigProyecto)(carpeta);
  }

  private async propuestaDe(
    t: TareaProyecto,
    actual: TareaSitio | undefined,
  ): Promise<PropuestaTarea> {
    const huella = huellaTarea(t.comando);
    let error: string | undefined;
    try {
      interpretarCron(t.cron);
      validarComandoTarea(t.comando);
    } catch (e) {
      error = e instanceof ErrorWolf ? e.codigo : 'tareas.invalida';
    }
    return {
      id: t.id,
      nombre: t.nombre || t.id,
      cron: t.cron,
      comando: [...t.comando],
      tiempoMaxS: t.tiempoMaxS ?? TIEMPO_TAREA_DEFECTO_S,
      huella,
      estado: !actual ? 'nueva' : actual.confirmada === huella ? 'adoptada' : 'cambiada',
      ...(error ? { error } : {}),
    };
  }

  /**
   * Las tareas que propone el `wolfcore.yml` del proyecto, con su estado frente a las del sitio.
   * Solo lee: nada se ejecuta ni se guarda.
   */
  async propuestas(sitioId: string): Promise<PropuestaTarea[]> {
    const s = await this.sitio(sitioId);
    const yml = await this.leerYml(s.carpeta);
    const res: PropuestaTarea[] = [];
    for (const t of yml?.tareas ?? []) {
      res.push(
        await this.propuestaDe(
          t,
          (s.tareas ?? []).find((x) => x.id === t.id),
        ),
      );
    }
    return res;
  }

  /**
   * El usuario revisó una propuesta de `wolfcore.yml` y la acepta: pasa a las tareas del sitio con
   * ese comando confirmado. `huella` debe ser la que vio; si el archivo cambió desde entonces, no
   * se adopta. `activar` la deja corriendo; si no, pausada.
   */
  async adoptar(
    sitioId: string,
    id: string,
    huella: string,
    activar: boolean,
  ): Promise<TareaSitio> {
    const s = await this.sitio(sitioId);
    const t = (await this.leerYml(s.carpeta))?.tareas.find((x) => x.id === id);
    if (!t) throw new ErrorWolf('tareas.no_existe', 'La tarea ya no está en wolfcore.yml.');
    // Lanzan su error con código si el cron o el comando no valen.
    interpretarCron(t.cron);
    validarComandoTarea(t.comando);
    if (huellaTarea(t.comando) !== huella) throw invalida('wolfcore.yml cambió');
    return this.guardarAdoptada(sitioId, t, activar);
  }

  private async guardarAdoptada(
    sitioId: string,
    t: TareaProyecto,
    activar: boolean,
  ): Promise<TareaSitio> {
    const cron = interpretarCron(t.cron).expresion;
    let res!: TareaSitio;
    await this.cambiar(sitioId, (tareas) => {
      const previa = tareas.find((x) => x.id === t.id);
      if (!previa && tareas.length >= MAX_TAREAS_SITIO) {
        throw new ErrorWolf('tareas.demasiadas', 'Hay demasiadas tareas en este proyecto.', {
          maximo: MAX_TAREAS_SITIO,
        });
      }
      res = {
        id: t.id,
        nombre: t.nombre || t.id,
        cron,
        comando: [...t.comando],
        activa: activar,
        confirmada: huellaTarea(t.comando),
        tiempoMaxS: t.tiempoMaxS ?? previa?.tiempoMaxS ?? TIEMPO_TAREA_DEFECTO_S,
        origen: 'wolfcore.yml',
      };
      return previa ? tareas.map((x) => (x.id === t.id ? res : x)) : [...tareas, res];
    });
    return res;
  }

  /** A pedido del usuario: escribe (o actualiza) la tarea en el `wolfcore.yml` del proyecto. */
  async aWolfcoreYml(sitioId: string, tareaId: string): Promise<void> {
    const s = await this.sitio(sitioId);
    const t = (s.tareas ?? []).find((x) => x.id === tareaId);
    if (!t) throw new ErrorWolf('tareas.no_existe', 'La tarea ya no existe.');
    const yml: ConfigProyecto = (await this.leerYml(s.carpeta)) ?? {
      version: 1,
      tipo: null,
      dominio: null,
      php: null,
      node: null,
      python: null,
      servicios: [],
      env: {},
      receta: [],
      procesos: [],
      tareas: [],
    };
    const nueva: TareaProyecto = {
      id: t.id,
      nombre: t.nombre,
      cron: t.cron,
      comando: [...t.comando],
      tiempoMaxS: t.tiempoMaxS,
    };
    const tareas = yml.tareas.some((x) => x.id === t.id)
      ? yml.tareas.map((x) => (x.id === t.id ? nueva : x))
      : [...yml.tareas, nueva];
    await (this.d.escribirYml ?? escribirConfigProyecto)(s.carpeta, { ...yml, tareas });
  }

  /* ───────────── Lectura ───────────── */

  /**
   * Las próximas ejecuciones de una expresión cron (vista previa del diálogo). Lanza
   * `tareas.cron_invalida` si no vale. No guarda ni ejecuta nada.
   */
  proximas(cron: string, cuantas = 3, desde: Date = new Date()): string[] {
    const c = interpretarCron(cron);
    const zona = zonaLocal();
    const res: string[] = [];
    let t = desde;
    for (let i = 0; i < Math.min(Math.max(cuantas, 1), 10); i++) {
      t = siguiente(c, t, zona);
      res.push(t.toISOString());
    }
    return res;
  }

  historial(sitioId: string, tareaId: string): Promise<EjecucionTarea[]> {
    return this.d.programador.historialDe(sitioId, tareaId);
  }
}
