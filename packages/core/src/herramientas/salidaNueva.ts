import { randomBytes } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, link, open, rm, type FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';

/** Cuántos nombres alternativos se prueban antes de rendirse. */
const MAX_INTENTOS = 1000;

/** Errores del sistema que significan "ahí no se puede escribir" (permiso, carpeta o ruta). */
const NO_ESCRIBIBLE = new Set(['EPERM', 'EACCES', 'EISDIR', 'ENOENT', 'ENOTDIR', 'EROFS']);

function sinEscritura(e: unknown): ErrorWolf | null {
  const codigo = (e as { code?: string }).code;
  return codigo && NO_ESCRIBIBLE.has(codigo)
    ? new ErrorWolf(
        'herramientas.salida_denegada',
        'No se puede escribir en esa ubicación (permiso o carpeta inexistente).',
        undefined,
        { cause: e },
      )
    : null;
}

const sinNombre = (): ErrorWolf =>
  new ErrorWolf('herramientas.salida_ocupada', 'No se encontró un nombre libre para el archivo.');

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
      const codigo = (e as { code?: string }).code;
      // Un destino que es una carpeta también dice EEXIST: se sigue con el nombre siguiente.
      if (codigo !== 'EEXIST') throw sinEscritura(e) ?? e;
    }
  }
  throw sinNombre();
}

/** Archivo temporal `.parcial` junto al destino, abierto en exclusiva. */
export async function abrirParcial(
  destino: string,
): Promise<{ parcial: string; handle: FileHandle }> {
  const { dir, base } = path.parse(destino);
  const parcial = path.join(dir, `${base}.${randomBytes(4).toString('hex')}.parcial`);
  try {
    return { parcial, handle: await open(parcial, 'wx') };
  } catch (e) {
    throw sinEscritura(e) ?? e;
  }
}

/**
 * Da su nombre final al `.parcial` sin pisar nada: crea un enlace duro con el nombre libre (falla
 * si existe) y quita el temporal; si el sistema de archivos no admite enlaces duros, copia con
 * `COPYFILE_EXCL`. Devuelve la ruta final.
 */
export async function publicarSinPisar(parcial: string, destino: string): Promise<string> {
  const { dir, name, ext } = path.parse(destino);
  for (let n = 0; n < MAX_INTENTOS; n++) {
    const ruta = n === 0 ? destino : path.join(dir, `${name} (${n})${ext}`);
    try {
      try {
        await link(parcial, ruta);
      } catch (e) {
        const codigo = (e as { code?: string }).code;
        if (codigo === 'EEXIST') throw e;
        await copyFile(parcial, ruta, constants.COPYFILE_EXCL);
      }
      await rm(parcial, { force: true }).catch(() => undefined);
      return ruta;
    } catch (e) {
      if ((e as { code?: string }).code !== 'EEXIST') throw sinEscritura(e) ?? e;
    }
  }
  throw sinNombre();
}
