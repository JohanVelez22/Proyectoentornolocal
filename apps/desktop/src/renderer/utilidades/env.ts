import type { PedidoEnv, VistaEnv } from '../../shared/api';

/** Nombre de variable válido para agregar (el núcleo lo valida otra vez). */
export const NOMBRE_VARIABLE = /^[A-Za-z_][A-Za-z0-9_.]{0,127}$/;

/** Segundos que un valor secreto queda a la vista después de pulsar «Mostrar». */
export const SEGUNDOS_REVELADO = 30;

/** `env-<sitio>-AAAAMMDD-HHmmss-mmm-xxxxxx.respaldo` → «AAAA-MM-DD HH:mm:ss» (o el nombre tal cual). */
export function etiquetaCopia(nombre: string): string {
  const m = /-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-\d{3}-[0-9a-f]{6}\.respaldo$/.exec(
    nombre,
  );
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}` : nombre;
}

/** ¿Se puede agregar esta variable? Nombre válido y que el .env aún no la tenga. */
export function nombreNuevoValido(nombre: string, filas: VistaEnv['filas']): boolean {
  return NOMBRE_VARIABLE.test(nombre) && !filas.some((f) => f.clave === nombre);
}

/** Pedido al núcleo con solo lo que hay: sin campos vacíos. */
export function armarPedido(
  cambios: Readonly<Record<string, string | null>>,
  desdeEjemplo: readonly string[],
  bloques: readonly NonNullable<PedidoEnv['bloques']>[number][],
): PedidoEnv {
  return {
    ...(Object.keys(cambios).length > 0 ? { cambios: { ...cambios } } : {}),
    ...(desdeEjemplo.length > 0 ? { desdeEjemplo: [...desdeEjemplo] } : {}),
    ...(bloques.length > 0 ? { bloques: [...bloques] } : {}),
  };
}

/** Cuántas cosas hay sin guardar. */
export function contarPendientes(pedido: PedidoEnv): number {
  return (
    Object.keys(pedido.cambios ?? {}).length +
    (pedido.desdeEjemplo?.length ?? 0) +
    (pedido.bloques?.length ?? 0)
  );
}

/**
 * ¿Hay que pedir la confirmación aparte de git? Cuando git ya sigue el .env o no se pudo saber:
 * guardar subiría los valores en el próximo commit.
 */
export function exigeAceptarVersionado(gitignore: VistaEnv['gitignore'] | undefined): boolean {
  return gitignore !== undefined && gitignore.envVersionado !== false;
}

/** El valor que se pinta en una fila: nunca más que lo que el núcleo mandó (o lo que se escribe). */
export function valorDeFila(
  fila: VistaEnv['filas'][number],
  cambio: string | null | undefined,
  revelado: string | null,
): string {
  if (cambio === null) return '';
  if (typeof cambio === 'string') return cambio;
  return fila.secreta && revelado !== null ? revelado : fila.valorVisible;
}
