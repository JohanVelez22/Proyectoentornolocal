import { createHash } from 'node:crypto';
import { ErrorWolf } from '../errores';
import { MAX_ARGS_TAREA, MAX_CARACTERES_ARG_TAREA } from '../tipos';

/**
 * Comando de una tarea programada (D29). Es una lista de argumentos que se lanza **sin shell**,
 * en la carpeta del sitio. El programa sale de una lista cerrada, la misma que `resolverPrograma`
 * entrega con el runtime del proyecto: `php`, `node`, `npm` y `python`. Quedan fuera `npx` (baja y
 * corre paquetes de la red), los `.cmd`/`.bat`, las rutas y cualquier otro programa.
 *
 * Además de eso no se admiten las opciones que ejecutan código dado en la propia línea (`php -r`,
 * `node -e`, `python -c`…), ni los modos interactivos o de servidor: lo que corre una tarea debe
 * estar en un archivo del proyecto y verse en el comando.
 */
export const PROGRAMAS_TAREA = ['php', 'node', 'npm', 'python'] as const;
export type ProgramaTarea = (typeof PROGRAMAS_TAREA)[number];

/** Módulos que `python -m` admite: herramientas de gestión y servidores de un proyecto web. Nunca `pip` ni `http.server`. */
export const MODULOS_PYTHON = ['django', 'flask', 'uvicorn', 'celery'] as const;

const invalido = (detalle: string): ErrorWolf =>
  new ErrorWolf('tareas.comando_invalido', `El comando de la tarea no es válido: ${detalle}`, {
    detalle,
  });

/** Nombre del programa sin `.exe` y en minúsculas, o null si no es un nombre simple. */
function nombreDe(programa: string): string | null {
  // Sin separadores de ruta ni unidades: solo el nombre (la ruta la resuelve el runtime del sitio).
  if (/[\\/:]/.test(programa)) return null;
  return programa.toLowerCase().replace(/\.exe$/, '');
}

/**
 * Archivo del proyecto: relativo y sin salir de la carpeta. Rechaza lo que empieza por `-` (una
 * opción), las rutas absolutas, de unidad (`C:`) o UNC (`\servidor\...`, `//servidor/...`) y
 * cualquier tramo `..`.
 */
function archivoRelativo(a: string, que: string): void {
  if (a.startsWith('-'))
    throw invalido(`${que}: se esperaba un archivo del proyecto, no una opción`);
  if (/^[\\/]/.test(a) || /^[A-Za-z]:/.test(a)) {
    throw invalido(`${que}: el archivo debe ser relativo a la carpeta del proyecto`);
  }
  if (a.split(/[\\/]+/).some((t) => t === '..')) {
    throw invalido(`${que}: el archivo no puede salir de la carpeta del proyecto`);
  }
}

/**
 * Valida el comando de una tarea por **posición** (lista blanca, no lista negra de opciones):
 *
 * - `php [-f] <archivo> [args…]`: ninguna otra opción antes del archivo (`-r`, `-d`, `-S`, `-B`…).
 * - `node <archivo> [args…]`: ninguna opción antes del archivo (`-e`, `--loader`, `--inspect`…).
 * - `python <archivo> [args…]` o `python -m <módulo> [args…]` con un módulo de `MODULOS_PYTHON`.
 * - `npm run <script> [-- args…]`: sin opciones de npm (`--prefix`, `--script-shell`…).
 *
 * Lo que va después del archivo (o de `--`) son argumentos del propio programa del proyecto.
 * Lanza `tareas.comando_invalido`. No toca el disco: solo mira la lista de argumentos.
 */
export function validarComandoTarea(comando: unknown): asserts comando is string[] {
  if (!Array.isArray(comando) || comando.length === 0) throw invalido('está vacío');
  if (comando.length > MAX_ARGS_TAREA) throw invalido(`más de ${MAX_ARGS_TAREA} argumentos`);
  for (const a of comando) {
    if (typeof a !== 'string' || a === '') throw invalido('un argumento está vacío');
    if (a.length > MAX_CARACTERES_ARG_TAREA) throw invalido('un argumento es demasiado largo');
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(a)) throw invalido('un argumento lleva caracteres de control');
  }
  const [programa, ...resto] = comando as string[];
  const nombre = programa === undefined ? null : nombreDe(programa);
  if (nombre === null || !(PROGRAMAS_TAREA as readonly string[]).includes(nombre)) {
    throw invalido(`el programa debe ser uno de: ${PROGRAMAS_TAREA.join(', ')}`);
  }
  switch (nombre as ProgramaTarea) {
    case 'php': {
      const i = resto[0] === '-f' ? 1 : 0;
      if (resto[i] === undefined) throw invalido('falta el archivo que se ejecuta');
      archivoRelativo(resto[i]!, 'php');
      return;
    }
    case 'node':
      if (resto[0] === undefined) throw invalido('falta el archivo que se ejecuta');
      archivoRelativo(resto[0], 'node');
      return;
    case 'python':
      if (resto[0] === '-m') {
        if (!(MODULOS_PYTHON as readonly string[]).includes(resto[1] ?? '')) {
          throw invalido(`python -m solo admite: ${MODULOS_PYTHON.join(', ')}`);
        }
        return;
      }
      if (resto[0] === undefined) throw invalido('falta el archivo que se ejecuta');
      archivoRelativo(resto[0], 'python');
      return;
    case 'npm': {
      if (resto[0] !== 'run' && resto[0] !== 'run-script') {
        throw invalido('npm solo admite "run <script>"');
      }
      const script = resto[1];
      if (script === undefined || !/^[A-Za-z0-9_][A-Za-z0-9:_.@/-]*$/.test(script)) {
        throw invalido('falta el nombre del script de npm, o no es válido');
      }
      // Después del script solo `-- <args>`: ninguna opción de npm.
      if (resto.length > 2 && resto[2] !== '--') {
        throw invalido('las opciones de npm no se admiten: use "-- <argumentos>"');
      }
      return;
    }
  }
}

/**
 * Huella del comando: lo que el usuario acepta en la interfaz. Cualquier cambio en un argumento,
 * su orden o el programa da otra huella (y la tarea deja de correr hasta que se vuelva a confirmar).
 */
export function huellaTarea(comando: readonly string[]): string {
  return createHash('sha256')
    .update(JSON.stringify({ v: 1, comando }))
    .digest('hex');
}
