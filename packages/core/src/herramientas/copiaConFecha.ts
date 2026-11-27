import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Guarda `contenido` como `<prefijo>-<fecha>.txt` en `carpeta` (copia previa de lo que se va a
 * reescribir). Nunca pisa otra copia: si el nombre existe, agrega `-1`, `-2`…
 */
export async function copiaConFecha(
  carpeta: string,
  prefijo: string,
  contenido: string | Buffer,
  ahora: Date = new Date(),
): Promise<string> {
  await mkdir(carpeta, { recursive: true });
  const fecha = ahora.toISOString().replace(/[:.]/g, '-');
  for (let n = 0; ; n++) {
    const ruta = path.join(carpeta, `${prefijo}-${fecha}${n ? `-${n}` : ''}.txt`);
    try {
      await writeFile(ruta, contenido, { flag: 'wx' });
      return ruta;
    } catch (e) {
      if ((e as { code?: string }).code !== 'EEXIST' || n > 100) throw e;
    }
  }
}
