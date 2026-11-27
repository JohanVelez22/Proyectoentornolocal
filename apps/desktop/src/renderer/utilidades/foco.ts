import type { RouteLocationRaw } from 'vue-router';

/** Tiempo que dura el halo con movimiento. */
export const DURACION_FOCO_MS = 2500;
/** Tiempo que dura el resaltado estático con `prefers-reduced-motion`. */
export const DURACION_FOCO_ESTATICO_MS = 1500;
/** Tiempo total que se espera a que el elemento aparezca (datos que llegan después de navegar). */
export const ESPERA_ELEMENTO_MS = 2000;
export const INTERVALO_BUSQUEDA_MS = 100;

export const CLASE_FOCO = 'foco-halo';
export const CLASE_FOCO_ESTATICO = 'foco-estatico';

/** Clase y duración del resaltado según la preferencia de movimiento reducido. */
export function elegirClaseFoco(reducido: boolean): { clase: string; duracionMs: number } {
  return reducido
    ? { clase: CLASE_FOCO_ESTATICO, duracionMs: DURACION_FOCO_ESTATICO_MS }
    : { clase: CLASE_FOCO, duracionMs: DURACION_FOCO_MS };
}

/**
 * Destino de una navegación con foco: la pantalla por nombre (o por ruta si empieza por `/`) y
 * `?foco=<id>`. La query que ya hubiera se conserva.
 */
export function rutaConFoco(
  ruta: string,
  foco: string,
  query: Record<string, string> = {},
): RouteLocationRaw {
  const q = { ...query, foco };
  return ruta.startsWith('/') ? { path: ruta, query: q } : { name: ruta, query: q };
}

/** Id pedido y, si no está en pantalla, el del elemento que lo contiene (proceso → proyecto). */
export function candidatosFoco(id: string): string[] {
  const m = /^proceso:([^:]+):[^:]+$/.exec(id);
  return m ? [id, `sitio:${m[1]!}`] : [id];
}

/** Un desplegable nativo (<details>) y lo mínimo que se usa de él. */
export interface Plegable {
  open: boolean;
}
/** Elemento que sabe cuál es su desplegable plegado más cercano. */
export interface ElementoEnPlegable {
  closest(selector: string): Plegable | null;
}

/**
 * Abre los desplegables plegados (<details>) que contienen al elemento, de dentro hacia fuera, para
 * que el foco pueda desplazarse hasta él (p. ej. un parche anterior en Versiones). Devuelve
 * cuántos abrió.
 */
export function abrirPlegados(el: ElementoEnPlegable): number {
  let abiertos = 0;
  for (let d = el.closest('details:not([open])'); d; d = el.closest('details:not([open])')) {
    d.open = true;
    abiertos++;
    if (abiertos > 20) break; // sin ciclos infinitos con un documento raro
  }
  return abiertos;
}

/** Lo mínimo que se usa de un elemento del documento (en las pruebas, uno falso). */
export interface ElementoFoco {
  scrollIntoView(opciones: { block: 'center'; behavior?: 'smooth' | 'auto' }): void;
  classList: { add(c: string): void; remove(c: string): void };
}
export interface DocumentoFoco {
  buscar(id: string): ElementoFoco | null;
}

export interface OpcionesFoco {
  reducido: boolean;
  /** Para los avisos que llegan antes de que el elemento exista. */
  programar?: (f: () => void, ms: number) => unknown;
  cancelar?: (t: unknown) => void;
}

/**
 * Lleva a `[data-foco=id]` y lo resalta. Si el elemento aún no existe lo busca cada 100 ms hasta
 * 2 s (la pantalla puede estar cargando sus datos); si nunca aparece, no hace nada. Devuelve una
 * función que cancela la búsqueda y quita el resaltado.
 */
export function aplicarFoco(doc: DocumentoFoco, id: string, o: OpcionesFoco): () => void {
  const programar = o.programar ?? ((f, ms) => setTimeout(f, ms));
  const cancelar = o.cancelar ?? ((t) => clearTimeout(t as ReturnType<typeof setTimeout>));
  const { clase, duracionMs } = elegirClaseFoco(o.reducido);
  let timer: unknown = null;
  let resaltado: ElementoFoco | null = null;
  let intentos = 0;
  const maximo = Math.ceil(ESPERA_ELEMENTO_MS / INTERVALO_BUSQUEDA_MS);

  const intentar = (): void => {
    timer = null;
    let el: ElementoFoco | null = null;
    for (const c of candidatosFoco(id)) {
      el = doc.buscar(c);
      if (el) break;
    }
    if (!el) {
      if (++intentos <= maximo) timer = programar(intentar, INTERVALO_BUSQUEDA_MS);
      return;
    }
    // El desplazamiento suave se salta con movimiento reducido.
    el.scrollIntoView({ block: 'center', behavior: o.reducido ? 'auto' : 'smooth' });
    el.classList.add(clase);
    resaltado = el;
    timer = programar(() => {
      timer = null;
      el.classList.remove(clase);
      resaltado = null;
    }, duracionMs);
  };
  intentar();

  return () => {
    if (timer !== null) cancelar(timer);
    timer = null;
    resaltado?.classList.remove(clase);
    resaltado = null;
  };
}

/* ───── Ids de foco y destinos de navegación (todos los caminos usan estos) ───── */

export const focoServicio = (id: string): string => `servicio:${id}`;
export const focoSitio = (id: string): string => `sitio:${id}`;
export const focoVersion = (servicio: string, version: string): string =>
  `version:${servicio}:${version}`;
export const focoBase = (motor: string, nombre: string): string => `base:${motor}:${nombre}`;

/** Servicios → tarjeta del servicio. */
export function destinoServicio(id: string): RouteLocationRaw {
  return rutaConFoco('servicios', focoServicio(id));
}

/** Proyectos → tarjeta del proyecto. */
export function destinoSitio(id: string): RouteLocationRaw {
  return rutaConFoco('proyectos', focoSitio(id));
}

/** Túneles → fila del sitio con túnel. */
export function destinoTunel(sitioId: string): RouteLocationRaw {
  return rutaConFoco('tuneles', focoSitio(sitioId));
}

/** Servicios → pestaña Versiones del servicio, con la tarjeta de la versión si se conoce. */
export function destinoVersion(servicio: string, version?: string | null): RouteLocationRaw {
  const base = { name: 'servicios.versiones', params: { servicio } };
  return version ? { ...base, query: { foco: focoVersion(servicio, version) } } : base;
}

/** Bases de datos → fila de la base (la vista elige antes la pestaña del motor). */
export function destinoBase(motor: string, nombre: string): RouteLocationRaw {
  return rutaConFoco('basesDeDatos', focoBase(motor, nombre));
}

/** Motor de un foco `base:<motor>:<nombre>`, o null si el foco no es de una base. */
export function motorDeFocoBase(foco: unknown): string | null {
  if (typeof foco !== 'string') return null;
  const m = /^base:([^:]+):./.exec(foco);
  return m ? m[1]! : null;
}
