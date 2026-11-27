import type {
  EstadoLaboratorio,
  IdArchivoLaboratorio,
  OrdenLaboratorio,
  ResultadoOrdenLaboratorio,
} from '@pel/core';

/**
 * Ejercicio guiado del laboratorio de Git (D50): dos ramas cambian la misma línea, el merge deja un
 * conflicto, el usuario elige una versión y lo confirma. Son datos fijos: cada paso es una lista de
 * órdenes de la lista cerrada y escrituras de los archivos de práctica; no hay texto libre.
 */
export type Eleccion = 'mia' | 'otra' | 'ambas';

export const ARCHIVO_CONFLICTO: IdArchivoLaboratorio = 'colores.txt';
export const VERSIONES: Record<Eleccion, string> = {
  mia: 'color: verde\n',
  otra: 'color: rojo\n',
  ambas: 'color: verde\ncolor: rojo\n',
};

export type AccionPaso = { reiniciar: true } | { orden: OrdenLaboratorio } | { escribir: string };

/** Número de pasos del ejercicio. */
export const PASOS_CONFLICTO = 6;
/** Paso en el que el conflicto es lo esperado (el merge sale con error). */
export const PASO_MERGE = 3;
/** Paso en el que el usuario elige una versión. */
export const PASO_ELEGIR = 4;

export function accionesDelPaso(paso: number, eleccion?: Eleccion): AccionPaso[] {
  const colores = ARCHIVO_CONFLICTO;
  switch (paso) {
    case 0:
      return [
        { reiniciar: true },
        { orden: { cmd: 'init' } },
        { orden: { cmd: 'add', archivo: 'todo' } },
        { orden: { cmd: 'commit', mensaje: 'Base: color azul' } },
      ];
    case 1:
      return [
        { orden: { cmd: 'switch', nombre: 'rama-a', crear: true } },
        { escribir: VERSIONES.otra },
        { orden: { cmd: 'add', archivo: colores } },
        { orden: { cmd: 'commit', mensaje: 'Rojo en rama-a' } },
      ];
    case 2:
      return [
        { orden: { cmd: 'switch', nombre: 'main' } },
        { escribir: VERSIONES.mia },
        { orden: { cmd: 'add', archivo: colores } },
        { orden: { cmd: 'commit', mensaje: 'Verde en main' } },
      ];
    case PASO_MERGE:
      return [{ orden: { cmd: 'merge', nombre: 'rama-a' } }];
    case PASO_ELEGIR:
      return eleccion ? [{ escribir: VERSIONES[eleccion] }] : [];
    case 5:
      return [
        { orden: { cmd: 'add', archivo: colores } },
        { orden: { cmd: 'commit', mensaje: 'Resolver el conflicto' } },
      ];
    default:
      return [];
  }
}

export interface ApiLaboratorio {
  ejecutar(o: OrdenLaboratorio): Promise<ResultadoOrdenLaboratorio>;
  escribirArchivo(id: IdArchivoLaboratorio, contenido: string): Promise<void>;
  reiniciar(): Promise<EstadoLaboratorio>;
}

export interface ResultadoPaso {
  /** Última orden ejecutada (para mostrar su salida). */
  ultimo: ResultadoOrdenLaboratorio | null;
  /** Una orden salió con error (salvo el merge del paso del conflicto, donde se espera). */
  fallo: boolean;
}

/** Ejecuta un paso del ejercicio; se detiene en la primera orden que falla de forma inesperada. */
export async function ejecutarPaso(
  api: ApiLaboratorio,
  paso: number,
  eleccion?: Eleccion,
): Promise<ResultadoPaso> {
  let ultimo: ResultadoOrdenLaboratorio | null = null;
  for (const a of accionesDelPaso(paso, eleccion)) {
    if ('reiniciar' in a) {
      await api.reiniciar();
    } else if ('escribir' in a) {
      await api.escribirArchivo(ARCHIVO_CONFLICTO, a.escribir);
    } else {
      ultimo = await api.ejecutar(a.orden);
      if (ultimo.codigo !== 0 && paso !== PASO_MERGE) return { ultimo, fallo: true };
    }
  }
  return { ultimo, fallo: false };
}
