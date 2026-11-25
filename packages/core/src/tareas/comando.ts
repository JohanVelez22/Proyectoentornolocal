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

/** Opciones que no se admiten, por programa (en minúsculas; también la forma `--opcion=valor`). */
const OPCIONES_PROHIBIDAS: Record<ProgramaTarea, readonly string[]> = {
  php: [
    '-r',
    '-R',
    '-B',
    '-E',
    '-F',
    '-a',
    '-S',
    '-i',
    '--run',
    '--process-begin',
    '--interactive',
  ],
  node: ['-e', '--eval', '-p', '--print', '-i', '--interactive', '-r', '--require', '--import'],
  npm: [],
  python: ['-c', '-i', '--command'],
};

/** Subcomandos de npm que se admiten: ejecutar un script del `package.json`. */
const SUBCOMANDOS_NPM = ['run', 'run-script'];

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
 * Valida el comando de una tarea. Lanza `tareas.comando_invalido` con el motivo. No toca el disco
 * ni el sistema: solo mira la lista de argumentos.
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
  const prog = nombre as ProgramaTarea;
  if (resto.length === 0 && prog === 'npm') throw invalido('npm necesita "run <script>"');
  for (const a of resto) {
    const opcion = a.split('=')[0]!;
    if (a.startsWith('-') && OPCIONES_PROHIBIDAS[prog].includes(opcion)) {
      throw invalido(`la opción ${opcion} no se admite en las tareas`);
    }
  }
  if (prog === 'npm') {
    if (!SUBCOMANDOS_NPM.includes(resto[0]!)) throw invalido('npm solo admite "run <script>"');
    if (resto.length < 2) throw invalido('falta el nombre del script de npm');
  }
  if (resto.length === 0 && prog !== 'npm') throw invalido('falta lo que se ejecuta (un archivo)');
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
