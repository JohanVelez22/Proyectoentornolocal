import type { EntradaAviso } from '../avisos/avisos';
import { ErrorWolf, type CodigoError } from '../errores';
import { enmascararSecretos } from '../patronesSecretos';
import {
  MAX_WORKSPACES,
  WorkspaceSchema,
  type Config,
  type ElementoWorkspace,
  type Workspace,
} from '../tipos';

export type { ElementoWorkspace, Workspace };

export type EstadoWorkspace = 'apagado' | 'parcial' | 'encendido';

/**
 * Resultado de un elemento al encender o apagar un workspace. `encendido` dice cómo quedó el
 * elemento al terminar (así la interfaz y la bandeja saben qué quedó encendido y qué no).
 */
export interface ResultadoWorkspace {
  /** Clave del elemento (`instancia:<id>`, `servicio:<id>`, `proceso:<sitio>/<proceso>`). */
  elemento: string;
  ok: boolean;
  encendido: boolean;
  /** Presente si falló: el código del error de origen o `workspaces.elemento_fallo`. */
  codigo?: CodigoError;
  /**
   * Lo que pasó sin ser un error: `no_existe` (el elemento ya no existe y se ignoró),
   * `ya_encendido`, `ya_apagado`, `compartido` (lo usa otro workspace encendido y no se apagó) o
   * `reemplaza:<elemento>` (un captador de correo del mismo grupo exclusivo se apagó).
   */
  aviso?: string;
  /** Mensaje del error, sin secretos y acotado. */
  detalle?: string;
}

/** Lo que el workspace necesita del resto del núcleo (en las pruebas, uno falso). */
export interface PuertoWorkspaces {
  /** ¿Sigue existiendo (la instancia en la configuración, el servicio instalado, el proceso)? */
  existe(e: ElementoWorkspace): Promise<boolean>;
  encendido(e: ElementoWorkspace): Promise<boolean>;
  /** Servicios encendidos del mismo grupo exclusivo que `e` (los captadores de correo). */
  encendidosExclusivos(e: ElementoWorkspace): Promise<ElementoWorkspace[]>;
  /**
   * Enciende el elemento con las mismas puertas que el resto de la aplicación (espera la salud de
   * los datos, un proceso de un sitio sin confianza no arranca, nunca abre túneles ni comparte en
   * la red local). Lanza si no pudo.
   */
  iniciar(e: ElementoWorkspace): Promise<void>;
  detener(e: ElementoWorkspace): Promise<void>;
}

export interface DepsWorkspaces {
  leerConfig: () => Promise<Config>;
  /** Lee, modifica y guarda la configuración en la cola común. */
  modificarConfig: (fn: (c: Config) => void) => Promise<void>;
  puerto: PuertoWorkspaces;
  avisar?: (a: EntradaAviso) => unknown;
}

/** Clave textual y estable de un elemento. */
export function claveElemento(e: ElementoWorkspace): string {
  if (e.tipo === 'proceso') return `proceso:${e.sitioId}/${e.procesoId}`;
  return `${e.tipo}:${e.id}`;
}

const CAPTADORES = ['mailpit', 'smtp4dev', 'inbucket', 'papercut'];

/** Servicio de datos al que se refiere un elemento (`mysql`, `mailpit`…), si es de datos. */
function servicioDatosDe(e: ElementoWorkspace): string | null {
  if (e.tipo === 'instancia') return e.id.split('@')[0] ?? null;
  if (e.tipo === 'servicio' && e.id !== 'nginx' && e.id !== 'php') return e.id;
  return null;
}

/** ¿Es un captador de correo (del grupo exclusivo)? */
export const esCaptador = (e: ElementoWorkspace): boolean => {
  const s = servicioDatosDe(e);
  return s !== null && CAPTADORES.includes(s);
};

/**
 * Orden de arranque: 0 datos (instancias, Ollama, captadores), 1 PHP, 2 Nginx, 3 procesos de
 * proyecto. Al apagar se recorre al revés.
 */
function rango(e: ElementoWorkspace): number {
  if (e.tipo === 'proceso') return 3;
  if (e.tipo === 'servicio' && e.id === 'nginx') return 2;
  if (e.tipo === 'servicio' && e.id === 'php') return 1;
  return 0;
}

/** Estable: a igual rango se conserva el orden del usuario. */
const ordenados = (elementos: readonly ElementoWorkspace[]): ElementoWorkspace[] =>
  elementos
    .map((e, i) => ({ e, i }))
    .sort((a, b) => rango(a.e) - rango(b.e) || a.i - b.i)
    .map((x) => x.e);

/** Elementos unidos en un texto de a lo sumo 60 caracteres y sin `/`. */
function nombresCortos(claves: string[]): string {
  const t = claves.map((k) => k.replaceAll('/', ':')).join(', ');
  return t.length > 60 ? `${t.slice(0, 57)}...` : t;
}

const detalleDe = (e: unknown): string =>
  enmascararSecretos(e instanceof Error ? e.message : String(e)).slice(0, 200);

const codigoDe = (e: unknown): CodigoError =>
  e instanceof ErrorWolf ? e.codigo : 'workspaces.elemento_fallo';

/**
 * Workspaces de arranque: conjuntos con nombre de instancias, servicios y procesos de proyecto que
 * se encienden y apagan juntos ("Bot FastAPI": PostgreSQL + Redis + Ollama + uvicorn). Solo guardan
 * **referencias**: encender y apagar pasan por las mismas puertas del resto de la aplicación
 * (`PuertoWorkspaces`). Un fallo nunca corta el resto: el resultado dice qué quedó encendido.
 */
export class Workspaces {
  /** Una operación a la vez: dos workspaces con elementos en común no se pisan. */
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsWorkspaces) {}

  async lista(): Promise<Workspace[]> {
    return (await this.d.leerConfig()).workspaces;
  }

  /** Crea o reemplaza (por id) un workspace. Valida la forma, quita repetidos y exige un solo captador. */
  async guardar(w: Workspace): Promise<Workspace> {
    const r = WorkspaceSchema.safeParse(w);
    if (!r.success) {
      throw new ErrorWolf('workspaces.invalido', 'El workspace no es válido.');
    }
    const vistos = new Set<string>();
    const elementos = r.data.elementos.filter((e) => {
      const k = claveElemento(e);
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
    // Dos captadores de correo no pueden estar encendidos a la vez (grupo exclusivo).
    if (elementos.filter(esCaptador).length > 1) {
      throw new ErrorWolf(
        'workspaces.captadores_exclusivos',
        'Un workspace no puede llevar dos captadores de correo: solo uno corre a la vez.',
      );
    }
    const limpio: Workspace = { ...r.data, elementos };
    await this.d.modificarConfig((c) => {
      const i = c.workspaces.findIndex((x) => x.id === limpio.id);
      if (i >= 0) c.workspaces[i] = limpio;
      else if (c.workspaces.length >= MAX_WORKSPACES) {
        throw new ErrorWolf('workspaces.invalido', 'Hay demasiados workspaces.');
      } else c.workspaces.push(limpio);
    });
    return limpio;
  }

  /** Borra el workspace (nunca apaga lo que enciende). Borrar uno que no existe no hace nada. */
  async borrar(id: string): Promise<void> {
    await this.d.modificarConfig((c) => {
      c.workspaces = c.workspaces.filter((x) => x.id !== id);
    });
  }

  async estado(id: string): Promise<EstadoWorkspace> {
    return this.estadoDe(await this.buscar(id));
  }

  /** Estado de todos los workspaces por id. */
  async estados(): Promise<Record<string, EstadoWorkspace>> {
    const res: Record<string, EstadoWorkspace> = {};
    for (const w of await this.lista()) res[w.id] = await this.estadoDe(w);
    return res;
  }

  /**
   * Enciende: datos primero (esperando su salud), luego PHP y Nginx, al final los procesos. Un
   * fallo no corta el resto; si algo falla se publica un aviso con lo que no arrancó.
   */
  iniciar(id: string): Promise<ResultadoWorkspace[]> {
    return this.enCola(async () => {
      const w = await this.buscar(id);
      const protegidos = await this.protegidosPorOtros(w);
      const res: ResultadoWorkspace[] = [];
      for (const e of ordenados(w.elementos)) {
        res.push(await this.iniciarUno(e, protegidos));
      }
      this.avisarFallos(w, res, 'avisos.workspace_fallos');
      return res;
    });
  }

  /**
   * Apaga al revés (procesos, Nginx y PHP, datos). Lo que otro workspace encendido también lleva
   * se deja encendido (`compartido`). Un fallo no corta el resto.
   */
  detener(id: string): Promise<ResultadoWorkspace[]> {
    return this.enCola(async () => {
      const w = await this.buscar(id);
      const protegidos = await this.protegidosPorOtros(w);
      const res: ResultadoWorkspace[] = [];
      for (const e of ordenados(w.elementos).reverse()) {
        res.push(await this.detenerUno(e, protegidos));
      }
      this.avisarFallos(w, res, 'avisos.workspace_fallos_detener');
      return res;
    });
  }

  /* ───────────── Internos ───────────── */

  private enCola<T>(fn: () => Promise<T>): Promise<T> {
    const r = this.cola.then(fn, fn);
    this.cola = r.catch(() => undefined);
    return r;
  }

  private async buscar(id: string): Promise<Workspace> {
    const w = (await this.lista()).find((x) => x.id === id);
    if (!w) throw new ErrorWolf('workspaces.no_existe', `No existe el workspace ${id}.`);
    return w;
  }

  private async estadoDe(w: Workspace): Promise<EstadoWorkspace> {
    let existentes = 0;
    let encendidos = 0;
    for (const e of w.elementos) {
      if (!(await this.d.puerto.existe(e))) continue;
      existentes++;
      if (await this.d.puerto.encendido(e)) encendidos++;
    }
    if (existentes === 0 || encendidos === 0) return 'apagado';
    return encendidos === existentes ? 'encendido' : 'parcial';
  }

  /** Claves de los elementos de los demás workspaces que están **encendidos** del todo. */
  private async protegidosPorOtros(w: Workspace): Promise<Set<string>> {
    const res = new Set<string>();
    for (const otro of await this.lista()) {
      if (otro.id === w.id) continue;
      if ((await this.estadoDe(otro)) !== 'encendido') continue;
      for (const e of otro.elementos) res.add(claveElemento(e));
    }
    return res;
  }

  private falloDe(elemento: string, e: unknown, encendido: boolean): ResultadoWorkspace {
    return {
      elemento,
      ok: false,
      encendido,
      codigo: codigoDe(e),
      detalle: detalleDe(e),
    };
  }

  private async iniciarUno(
    e: ElementoWorkspace,
    protegidos: ReadonlySet<string>,
  ): Promise<ResultadoWorkspace> {
    const elemento = claveElemento(e);
    const p = this.d.puerto;
    try {
      if (!(await p.existe(e))) return { elemento, ok: true, encendido: false, aviso: 'no_existe' };
      if (await p.encendido(e))
        return { elemento, ok: true, encendido: true, aviso: 'ya_encendido' };
      // Grupo exclusivo: se apaga el captador que nadie usa; el de otro workspace encendido, no.
      const otros = await p.encendidosExclusivos(e);
      if (otros.some((o) => protegidos.has(claveElemento(o)))) {
        return {
          elemento,
          ok: false,
          encendido: false,
          codigo: 'workspaces.captadores_exclusivos',
          detalle: 'Otro workspace encendido usa el otro captador de correo.',
        };
      }
      await p.iniciar(e);
      const reemplaza = otros[0];
      return {
        elemento,
        ok: true,
        encendido: true,
        ...(reemplaza ? { aviso: `reemplaza:${claveElemento(reemplaza)}` } : {}),
      };
    } catch (err) {
      return this.falloDe(elemento, err, await this.sigueEncendido(e));
    }
  }

  private async detenerUno(
    e: ElementoWorkspace,
    protegidos: ReadonlySet<string>,
  ): Promise<ResultadoWorkspace> {
    const elemento = claveElemento(e);
    const p = this.d.puerto;
    try {
      if (!(await p.existe(e))) return { elemento, ok: true, encendido: false, aviso: 'no_existe' };
      if (!(await p.encendido(e)))
        return { elemento, ok: true, encendido: false, aviso: 'ya_apagado' };
      if (protegidos.has(elemento)) {
        return { elemento, ok: true, encendido: true, aviso: 'compartido' };
      }
      await p.detener(e);
      return { elemento, ok: true, encendido: false };
    } catch (err) {
      return this.falloDe(elemento, err, await this.sigueEncendido(e));
    }
  }

  private async sigueEncendido(e: ElementoWorkspace): Promise<boolean> {
    try {
      return await this.d.puerto.encendido(e);
    } catch {
      return false;
    }
  }

  private avisarFallos(w: Workspace, res: ResultadoWorkspace[], codigo: string): void {
    const fallos = res.filter((r) => !r.ok);
    if (fallos.length === 0) return;
    try {
      this.d.avisar?.({
        nivel: 'error',
        tipo: 'servicio-caido',
        codigo,
        datos: {
          nombre: w.nombre.slice(0, 60),
          // Texto corto y sin separadores de ruta (el aviso nunca lleva rutas).
          nombres: nombresCortos(fallos.map((f) => f.elemento)),
        },
        accion: { ruta: 'inicio' },
      });
    } catch {
      // Un aviso que no se pudo publicar no cambia el resultado.
    }
  }
}
