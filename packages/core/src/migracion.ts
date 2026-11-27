import { rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { sistemaActual } from './plataforma/sistema';
import { NOMBRE_CARPETA_ANTERIOR, rutaBasePorDefecto } from './rutas';

export interface ResultadoMigracion {
  resultado: 'migrada' | 'sin-cambios' | 'omitida' | 'fallida';
  /** Carpeta de datos que se debe usar en esta ejecución. */
  base: string;
  aviso?: string;
}

export interface FsMigracion {
  rename: (de: string, a: string) => Promise<void>;
  stat: (p: string) => Promise<unknown>;
}

const fsReal: FsMigracion = { rename, stat };

const codigo = (e: unknown): string => (e as NodeJS.ErrnoException | undefined)?.code ?? 'error';

/** true/false; solo ENOENT cuenta como "no existe", cualquier otro error se propaga. */
async function existe(fs: FsMigracion, p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch (e) {
    if (codigo(e) === 'ENOENT') return false;
    throw e;
  }
}

/**
 * Pasa la carpeta de datos del nombre anterior (Proyectoentornolocal) a WolfCoreDev.
 * Nunca lanza: si no puede renombrar, devuelve la carpeta anterior para seguir funcionando.
 */
export async function migrarCarpetaDatos(
  env: NodeJS.ProcessEnv = process.env,
  plataforma: NodeJS.Platform = sistemaActual(),
  fs: FsMigracion = fsReal,
): Promise<ResultadoMigracion> {
  const nueva = rutaBasePorDefecto(env, plataforma);
  const vieja = path.join(path.dirname(nueva), NOMBRE_CARPETA_ANTERIOR);
  let hayVieja: boolean;
  let hayNueva: boolean;
  try {
    hayVieja = await existe(fs, vieja);
    hayNueva = hayVieja ? await existe(fs, nueva) : false;
  } catch (e) {
    return {
      resultado: 'fallida',
      base: nueva,
      aviso: `No se pudo revisar la carpeta de datos (${codigo(e)}). Se reintentará en el próximo inicio.`,
    };
  }
  if (!hayVieja) return { resultado: 'sin-cambios', base: nueva };
  if (hayNueva) {
    return {
      resultado: 'omitida',
      base: nueva,
      aviso: `Existen las carpetas ${NOMBRE_CARPETA_ANTERIOR} y WolfCoreDev. Se usa WolfCoreDev; si faltan sitios o programas, copie lo que necesite desde la carpeta anterior.`,
    };
  }
  try {
    await fs.rename(vieja, nueva);
    return { resultado: 'migrada', base: nueva };
  } catch (e) {
    return {
      resultado: 'fallida',
      base: vieja,
      aviso: `No se pudo renombrar la carpeta de datos a WolfCoreDev (${codigo(e)}). Se usará la carpeta anterior y se reintentará en el próximo inicio. Cierre los servicios que sigan encendidos.`,
    };
  }
}
