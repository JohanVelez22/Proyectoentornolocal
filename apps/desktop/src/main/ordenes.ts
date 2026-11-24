/**
 * Órdenes por línea de órdenes (base del futuro CLI `wolf`):
 *   "WolfCore Dev.exe" --iniciar-todo
 *   "WolfCore Dev.exe" --detener-todo
 * Con la app ya abierta, la orden le llega por `second-instance`; si no, la app arranca y la
 * ejecuta en cuanto el núcleo está listo. Hacen exactamente lo mismo que "Iniciar todo" y
 * "Detener todo" de la bandeja (nunca abren túneles). Solo se aceptan estas dos órdenes, sin
 * valores: cualquier otro argumento se ignora.
 */

export const ORDENES = {
  '--iniciar-todo': 'iniciar-todo',
  '--detener-todo': 'detener-todo',
} as const;
export type Orden = (typeof ORDENES)[keyof typeof ORDENES];

/** La orden de los argumentos (la primera que aparezca), o null. */
export function ordenDeArgs(argv: readonly string[]): Orden | null {
  for (const a of argv) {
    if (Object.hasOwn(ORDENES, a)) return ORDENES[a as keyof typeof ORDENES];
  }
  return null;
}

/** Lo que queda en run/ultima-orden.json para comprobar el resultado sin interfaz. */
export interface ResultadoOrden {
  orden: Orden;
  inicio: string;
  fin: string;
  ok: boolean;
  /** Mensaje del error (lista de lo que no arrancó), si falló. */
  error?: string;
}

export interface NucleoOrdenes {
  iniciarTodo(): Promise<void>;
  detenerTodo(): Promise<void>;
}

export interface DepsOrdenes {
  /** null mientras el núcleo no está listo: las órdenes esperan. */
  nucleo: () => NucleoOrdenes | null;
  registrar: (r: ResultadoOrden) => void;
  ahora?: () => Date;
}

/** Ejecuta las órdenes de una en una, en el orden en que llegan. */
export function crearOrdenes(d: DepsOrdenes): {
  ejecutar(o: Orden): Promise<void>;
  /** Llamar cuando el núcleo esté listo: ejecuta las que esperaban. */
  listo(): Promise<void>;
} {
  const ahora = d.ahora ?? (() => new Date());
  const pendientes: Orden[] = [];
  let cola: Promise<void> = Promise.resolve();

  const correr = (o: Orden, n: NucleoOrdenes): Promise<void> => {
    cola = cola.then(async () => {
      const inicio = ahora().toISOString();
      try {
        await (o === 'iniciar-todo' ? n.iniciarTodo() : n.detenerTodo());
        d.registrar({ orden: o, inicio, fin: ahora().toISOString(), ok: true });
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        console.error(`--${o} falló:`, error);
        d.registrar({ orden: o, inicio, fin: ahora().toISOString(), ok: false, error });
      }
    });
    return cola;
  };

  return {
    ejecutar(o) {
      const n = d.nucleo();
      if (!n) {
        pendientes.push(o);
        return Promise.resolve();
      }
      return correr(o, n);
    },
    async listo() {
      const n = d.nucleo();
      if (!n) return;
      for (const o of pendientes.splice(0)) await correr(o, n);
    },
  };
}
