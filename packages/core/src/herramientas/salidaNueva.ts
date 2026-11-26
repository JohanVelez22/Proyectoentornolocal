import { open, type FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';

/** Cuántos nombres alternativos se prueban antes de rendirse. */
const MAX_INTENTOS = 1000;

/**
 * Abre para escribir un archivo NUEVO: si `destino` ya existe prueba `nombre (1).ext`,
 * `nombre (2).ext`… La apertura es exclusiva (`wx`), así que nunca pisa nada, ni siquiera si el
 * archivo aparece entre la comprobación y la escritura. El destino sale de un diálogo "Guardar
 * como" (el llamador ya lo validó); aquí solo se garantiza que no se sobrescribe.
 */
export async function abrirNuevo(destino: string): Promise<{ ruta: string; handle: FileHandle }> {
  const { dir, name, ext } = path.parse(destino);
  for (let n = 0; n < MAX_INTENTOS; n++) {
    const ruta = n === 0 ? destino : path.join(dir, `${name} (${n})${ext}`);
    try {
      return { ruta, handle: await open(ruta, 'wx') };
    } catch (e) {
      if ((e as { code?: string }).code !== 'EEXIST') throw e;
    }
  }
  throw new ErrorWolf(
    'herramientas.salida_ocupada',
    'No se encontró un nombre libre para el archivo.',
  );
}
