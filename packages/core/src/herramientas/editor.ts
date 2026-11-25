import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { argsAbrir } from './editores';
import type { EditorDisponible, IdEditor } from '../plataforma/tipos';
import { rutaDentroDe } from '../plataforma/sistema';
import { ErrorWolf } from '../errores';
import { lanzarSeparado, type LanzadorSeparado } from '../plataforma/terminalWin';

export const MENSAJE_SIN_EDITOR =
  'No se encontró ningún editor de código (VS Code, Cursor, PhpStorm, Sublime Text…). Instale uno.';

export interface DepsEditor {
  /** Editores instalados (`Plataforma.editoresInstalados`). */
  editores: () => Promise<EditorDisponible[]>;
  entorno?: NodeJS.ProcessEnv;
  lanzar?: LanzadorSeparado;
}

export interface OpcionesAbrirEditor {
  /** Editor pedido: si no está instalado es un error. */
  editor?: IdEditor;
  /** Predeterminado de Ajustes: si no está instalado se usa el primero detectado. */
  predeterminado?: IdEditor | null;
  archivo?: { ruta: string; linea: number };
}

export interface ResultadoAbrirEditor {
  editor: { id: IdEditor; nombre: string };
  /** El predeterminado que no estaba instalado y fue sustituido (para avisar), o null. */
  sustituyo: IdEditor | null;
}

/**
 * Abre la carpeta (o un archivo en una línea) en un editor, con ventana propia y los argumentos
 * en lista (sin shell). El ejecutable sale siempre de la detección (`Plataforma`), nunca del
 * renderer. Quita ELECTRON_RUN_AS_NODE: con esa variable Code.exe correría como Node.
 */
export async function abrirEnEditor(
  carpeta: string,
  o: OpcionesAbrirEditor,
  d: DepsEditor,
): Promise<ResultadoAbrirEditor> {
  const instalados = await d.editores();
  let elegido: EditorDisponible | undefined;
  let sustituyo: IdEditor | null = null;
  if (o.editor) {
    elegido = instalados.find((e) => e.id === o.editor);
    if (!elegido) {
      throw new ErrorWolf(
        'herramientas.editor_no_instalado',
        `El editor no está instalado: ${o.editor}`,
        {
          nombre: o.editor,
        },
      );
    }
  } else {
    elegido = o.predeterminado ? instalados.find((e) => e.id === o.predeterminado) : undefined;
    if (!elegido) {
      if (o.predeterminado) sustituyo = o.predeterminado;
      elegido = instalados[0];
    }
  }
  if (!elegido) throw new ErrorWolf('herramientas.sin_editor', MENSAJE_SIN_EDITOR);
  const env: NodeJS.ProcessEnv = { ...(d.entorno ?? process.env) };
  for (const k of Object.keys(env)) {
    if (k.toUpperCase() === 'ELECTRON_RUN_AS_NODE') delete env[k];
  }
  await (d.lanzar ?? lanzarSeparado)(elegido.ruta, argsAbrir(elegido.id, carpeta, o.archivo), {
    cwd: carpeta,
    env,
  });
  return { editor: { id: elegido.id, nombre: elegido.nombre }, sustituyo };
}

const argumentoInvalido = (campo: string): ErrorWolf =>
  new ErrorWolf('depuracion.argumento_invalido', `Argumento no válido: ${campo}`, { campo });

/**
 * Abre `archivo` en la línea `linea` con la carpeta del sitio como espacio de trabajo
 * (con los argumentos de cada editor). El archivo sale de un registro de errores, así que
 * se exige que sea un archivo real DENTRO de la carpeta del sitio (rutas reales: un enlace o
 * una unión que salga del sitio no vale); si no, `depuracion.archivo_fuera_del_sitio`.
 */
export async function abrirArchivoDelSitio(
  carpeta: string,
  archivo: string,
  linea: number,
  o: Pick<OpcionesAbrirEditor, 'editor' | 'predeterminado'>,
  d: DepsEditor,
): Promise<ResultadoAbrirEditor> {
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
  return abrirEnEditor(raiz, { ...o, archivo: { ruta: real, linea } }, d);
}
