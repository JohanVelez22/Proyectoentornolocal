import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { buscarVsCode } from '../plataforma/vscodeWin';
import { rutaDentroDe } from '../plataforma/sistema';
import { ErrorWolf } from '../errores';
import { lanzarSeparado, type LanzadorSeparado } from '../plataforma/terminalWin';

export { buscarVsCode } from '../plataforma/vscodeWin';

export const MENSAJE_SIN_VSCODE =
  'No se encontró Visual Studio Code. Instálelo (code.visualstudio.com) o agregue "code" al PATH.';

export interface DepsEditor {
  entorno?: NodeJS.ProcessEnv;
  existe?: (ruta: string) => boolean;
  lanzar?: LanzadorSeparado;
}

/**
 * Abre la carpeta en VS Code, con ventana propia (como "Terminal aquí") y la carpeta como un
 * argumento (sin shell). Quita ELECTRON_RUN_AS_NODE: con esa variable Code.exe correría como
 * Node en vez de abrir el editor.
 */
export async function abrirEnVsCode(carpeta: string, d: DepsEditor = {}): Promise<void> {
  const exe = buscarVsCode(d);
  if (!exe) throw new ErrorWolf('herramientas.sin_vscode', MENSAJE_SIN_VSCODE);
  const env: NodeJS.ProcessEnv = { ...(d.entorno ?? process.env) };
  for (const k of Object.keys(env)) {
    if (k.toUpperCase() === 'ELECTRON_RUN_AS_NODE') delete env[k];
  }
  await (d.lanzar ?? lanzarSeparado)(exe, [carpeta], { cwd: carpeta, env });
}

const argumentoInvalido = (campo: string): ErrorWolf =>
  new ErrorWolf('depuracion.argumento_invalido', `Argumento no válido: ${campo}`, { campo });

/**
 * Abre `archivo` en la línea `linea` con la carpeta del sitio como espacio de trabajo
 * (`code <carpeta> -g <archivo>:<línea>`). El archivo sale de un registro de errores, así que
 * se exige que sea un archivo real DENTRO de la carpeta del sitio (rutas reales: un enlace o
 * una unión que salga del sitio no vale); si no, `depuracion.archivo_fuera_del_sitio`.
 */
export async function abrirArchivoDelSitio(
  carpeta: string,
  archivo: string,
  linea: number,
  d: DepsEditor = {},
): Promise<void> {
  if (!Number.isInteger(linea) || linea < 1 || linea > 10_000_000) {
    throw argumentoInvalido('linea');
  }
  // eslint-disable-next-line no-control-regex -- se buscan justamente los caracteres de control.
  if (typeof archivo !== 'string' || archivo.length > 1024 || /[\u0000-\u001f]/.test(archivo)) {
    throw argumentoInvalido('archivo');
  }
  const fuera = (): ErrorWolf =>
    new ErrorWolf(
      'depuracion.archivo_fuera_del_sitio',
      'Ese archivo no está dentro de la carpeta del sitio.',
    );
  if (!path.isAbsolute(archivo)) throw fuera();
  let raiz: string;
  let real: string;
  try {
    raiz = await realpath(carpeta);
    real = await realpath(archivo);
  } catch {
    throw fuera();
  }
  if (real === raiz || !rutaDentroDe(raiz, real)) throw fuera();
  if (!(await stat(real)).isFile()) throw fuera();
  // Ventana conocida (TOCTOU): entre este realpath y que VS Code abra el archivo, alguien con
  // permiso de escritura en el proyecto podría cambiar un tramo por un enlace. Se pasa la ruta
  // real ya resuelta, así que haría falta reemplazar una carpeta del camino en ese instante; y
  // lo único que pasa es que el editor (del mismo usuario) abre otro archivo para leerlo. No se
  // ejecuta ni se escribe nada.
  const exe = buscarVsCode(d);
  if (!exe) throw new ErrorWolf('herramientas.sin_vscode', MENSAJE_SIN_VSCODE);
  const env: NodeJS.ProcessEnv = { ...(d.entorno ?? process.env) };
  for (const k of Object.keys(env)) {
    if (k.toUpperCase() === 'ELECTRON_RUN_AS_NODE') delete env[k];
  }
  await (d.lanzar ?? lanzarSeparado)(exe, [raiz, '-g', `${real}:${linea}`], { cwd: raiz, env });
}
