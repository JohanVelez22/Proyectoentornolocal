import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  rmdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';

/**
 * Laboratorio de práctica de Git (D50). Un repositorio de juguete y un remoto «bare» local, los dos
 * dentro de una carpeta propia de WolfCore (`<datos>/tmp/laboratorio-git/`). Sin red, sin GitHub y
 * sin tocar jamás un repositorio real ni la configuración de git del usuario:
 * - Solo se ejecutan subcomandos de una lista cerrada (`Orden`), con `execFile` (sin shell) y la
 *   ruta de git ya resuelta. Los argumentos son fijos o están validados (`validarOrden`).
 * - El entorno de cada ejecución se arma de cero (lista blanca mínima) y apunta HOME, USERPROFILE y
 *   GIT_CONFIG_GLOBAL a la carpeta del laboratorio; sin configuración del sistema, sin hooks, sin
 *   asistentes de credenciales y con `protocol.allow=never` salvo `file` (el remoto local).
 * - El usuario solo edita un puñado de archivos de prueba predefinidos.
 */

export const NOMBRE_LABORATORIO = 'laboratorio-git';
const MARCA = '.wolfcore-laboratorio';

/** Archivos de prueba que el usuario puede editar (no hay rutas libres). */
export const ARCHIVOS_LABORATORIO = [
  'notas.txt',
  'colores.txt',
  'lista.txt',
  'registro.log',
  '.gitignore',
] as const;
export type IdArchivoLaboratorio = (typeof ARCHIVOS_LABORATORIO)[number];

const CONTENIDO_INICIAL: Record<IdArchivoLaboratorio, string> = {
  'notas.txt': 'Notas de práctica\nPrimera línea\n',
  'colores.txt': 'color: azul\n',
  'lista.txt': 'uno\ndos\ntres\n',
  'registro.log': 'Este archivo lo ignora .gitignore\n',
  '.gitignore': 'registro.log\n',
};

export const MAX_CONTENIDO_ARCHIVO = 2000;
export const MAX_MENSAJE_LABORATORIO = 200;
/** Salida que se devuelve de cada orden (el resto se recorta). */
export const MAX_SALIDA_LABORATORIO = 8000;
const MAX_LINEAS_GRAFO = 60;
const PLAZO_MS = 20_000;

export type Orden =
  | { cmd: 'init' }
  | { cmd: 'status' }
  | { cmd: 'add'; archivo: IdArchivoLaboratorio | 'todo' }
  | { cmd: 'commit'; mensaje: string }
  | { cmd: 'log' }
  | { cmd: 'diff'; preparado?: boolean }
  | { cmd: 'branch'; nombre?: string }
  | { cmd: 'switch'; nombre: string; crear?: boolean }
  | { cmd: 'merge'; nombre: string }
  | { cmd: 'merge'; abortar: true }
  | { cmd: 'stash'; accion: 'push' | 'pop' | 'list' }
  | { cmd: 'restore'; archivo: IdArchivoLaboratorio; preparado?: boolean }
  | { cmd: 'reset-soft' }
  | { cmd: 'revert' }
  | { cmd: 'remote'; accion: 'add' | 'ver' }
  | { cmd: 'fetch' }
  | { cmd: 'pull' }
  | { cmd: 'push'; etiquetas?: boolean }
  | { cmd: 'tag'; nombre?: string };

export interface ResultadoOrden {
  /** La orden tal como se ejecutó (sin las opciones de aislamiento), para mostrarla. */
  orden: string;
  codigo: number;
  /** Salida de la orden (stdout y stderr), sin colores y recortada. */
  salida: string;
  truncada: boolean;
  /** `log --oneline --graph --all --decorate` del repositorio ('' si aún no hay commits). */
  grafo: string;
}

export interface EstadoLaboratorio {
  /** Hay un git en el sistema. Sin él, el laboratorio no existe. */
  disponible: boolean;
  version: string | null;
  /** La carpeta del laboratorio está preparada. */
  existe: boolean;
  /** La carpeta de trabajo ya es un repositorio (se hizo `init`). */
  hayRepo: boolean;
  archivos: { id: IdArchivoLaboratorio; contenido: string }[];
}

export type EjecutarGit = (
  cmd: string,
  args: string[],
  opts: { cwd?: string; env: Record<string, string>; timeoutMs: number },
) => Promise<{ codigo: number; stdout: string; stderr: string }>;

/** `execFile` sin shell y con el entorno EXACTO que se le da (no hereda nada más). */
export const ejecutarGitPorDefecto: EjecutarGit = (cmd, args, o) =>
  new Promise((resolve) => {
    const hijo = execFile(
      cmd,
      args,
      {
        cwd: o.cwd,
        env: o.env,
        timeout: o.timeoutMs,
        windowsHide: true,
        encoding: 'utf8',
        maxBuffer: 4 * 1024 * 1024,
        shell: false,
      },
      (err, stdout, stderr) => {
        const e = err as (Error & { code?: unknown; killed?: boolean }) | null;
        const codigo = e === null ? 0 : typeof e.code === 'number' ? e.code : 1;
        resolve({
          codigo,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? '') || (e ? (e.killed ? 'Se agotó el plazo.' : e.message) : ''),
        });
      },
    );
    hijo.stdin?.on('error', () => undefined);
    hijo.stdin?.end();
  });

export interface OpcionesLaboratorio {
  /** Carpeta del laboratorio; su nombre debe ser `laboratorio-git`. */
  raiz: string;
  /** Ruta de git ya resuelta (null si no hay). */
  buscarGit: () => string | null;
  ejecutar?: EjecutarGit;
  /** Entorno del que se toma la lista blanca mínima (por defecto, el del proceso). */
  entorno?: NodeJS.ProcessEnv;
}

const invalida = (): ErrorWolf =>
  new ErrorWolf('laboratoriogit.orden_invalida', 'La orden del laboratorio no es válida.');

const NOMBRE_RAMA = /^[A-Za-z0-9][A-Za-z0-9_-]{0,29}(?:\/[A-Za-z0-9][A-Za-z0-9_-]{0,29})?$/;
const NOMBRE_TAG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,29}$/;

function nombreValido(v: unknown, tag: boolean): string {
  if (typeof v !== 'string') throw invalida();
  const ok = tag
    ? NOMBRE_TAG.test(v) && !v.includes('..') && !/(?:\.|\.lock)$/.test(v)
    : NOMBRE_RAMA.test(v);
  if (!ok) {
    throw new ErrorWolf(
      'laboratoriogit.nombre_invalido',
      'El nombre solo puede llevar letras, números, guion y guion bajo (hasta 30 caracteres).',
    );
  }
  return v;
}

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/;

function mensajeValido(v: unknown): string {
  if (typeof v !== 'string') throw invalida();
  const m = v.trim();
  if (!m || m.length > MAX_MENSAJE_LABORATORIO || m.startsWith('-') || CONTROL.test(m)) {
    throw new ErrorWolf(
      'laboratoriogit.mensaje_invalido',
      'El mensaje debe tener una línea, hasta 200 caracteres y no empezar por «-».',
    );
  }
  return m;
}

function archivoValido(v: unknown): IdArchivoLaboratorio {
  if (typeof v === 'string' && (ARCHIVOS_LABORATORIO as readonly string[]).includes(v)) {
    return v as IdArchivoLaboratorio;
  }
  throw new ErrorWolf('laboratoriogit.archivo_invalido', 'Ese archivo no es de práctica.');
}

const CLAVES: Record<string, readonly string[]> = {
  init: [],
  status: [],
  add: ['archivo'],
  commit: ['mensaje'],
  log: [],
  diff: ['preparado'],
  branch: ['nombre'],
  switch: ['nombre', 'crear'],
  merge: ['nombre', 'abortar'],
  stash: ['accion'],
  restore: ['archivo', 'preparado'],
  'reset-soft': [],
  revert: [],
  remote: ['accion'],
  fetch: [],
  pull: [],
  push: ['etiquetas'],
  tag: ['nombre'],
};

function booleano(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== 'boolean') throw invalida();
  return v;
}

/** Valida (desde `unknown`, como llega por IPC) y normaliza una orden de la lista cerrada. */
export function validarOrden(o: unknown): Orden {
  if (typeof o !== 'object' || o === null || Array.isArray(o)) throw invalida();
  const r = o as Record<string, unknown>;
  const cmd = r.cmd;
  if (typeof cmd !== 'string' || !Object.hasOwn(CLAVES, cmd)) throw invalida();
  if (Object.keys(r).some((k) => k !== 'cmd' && !CLAVES[cmd]!.includes(k))) throw invalida();
  switch (cmd) {
    case 'add': {
      if (r.archivo === 'todo') return { cmd, archivo: 'todo' };
      return { cmd, archivo: archivoValido(r.archivo) };
    }
    case 'commit':
      return { cmd, mensaje: mensajeValido(r.mensaje) };
    case 'diff':
      return { cmd, preparado: booleano(r.preparado) ?? false };
    case 'branch':
    case 'tag':
      return r.nombre === undefined
        ? { cmd }
        : { cmd, nombre: nombreValido(r.nombre, cmd === 'tag') };
    case 'switch':
      return { cmd, nombre: nombreValido(r.nombre, false), crear: booleano(r.crear) ?? false };
    case 'merge': {
      const abortar = booleano(r.abortar);
      if (abortar) {
        if (r.nombre !== undefined) throw invalida();
        return { cmd, abortar: true };
      }
      return { cmd, nombre: nombreValido(r.nombre, false) };
    }
    case 'stash':
      if (r.accion !== 'push' && r.accion !== 'pop' && r.accion !== 'list') throw invalida();
      return { cmd, accion: r.accion };
    case 'restore':
      return { cmd, archivo: archivoValido(r.archivo), preparado: booleano(r.preparado) ?? false };
    case 'remote':
      if (r.accion !== 'add' && r.accion !== 'ver') throw invalida();
      return { cmd, accion: r.accion };
    case 'push':
      return { cmd, etiquetas: booleano(r.etiquetas) ?? false };
    default:
      return { cmd } as Orden;
  }
}

/** Variables heredadas (lista blanca mínima): solo lo que git necesita para arrancar y encontrar sus programas. */
const HEREDADAS = new Set([
  'PATH',
  'PATHEXT',
  'SYSTEMROOT',
  'WINDIR',
  'COMSPEC',
  'TEMP',
  'TMP',
  'TMPDIR',
]);

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b(?:\[[0-9;?]*[ -/]*[@-~]|\][^\u0007\u001b]*(?:\u0007|\u001b\\)|[@-Z\\-_])/g;

function limpiar(texto: string): { texto: string; truncada: boolean } {
  const limpio = texto.replace(ANSI, '').replace(/\r\n?/g, '\n').trimEnd();
  if (limpio.length <= MAX_SALIDA_LABORATORIO) return { texto: limpio, truncada: false };
  return { texto: `${limpio.slice(0, MAX_SALIDA_LABORATORIO)}\n…`, truncada: true };
}

const entre = (s: string): string => (/[\s"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);

export class LaboratorioGit {
  private readonly ejecutarGit: EjecutarGit;
  private readonly entorno: NodeJS.ProcessEnv;
  private cola: Promise<unknown> = Promise.resolve();
  private version: string | null = null;

  constructor(private readonly o: OpcionesLaboratorio) {
    this.ejecutarGit = o.ejecutar ?? ejecutarGitPorDefecto;
    this.entorno = o.entorno ?? process.env;
  }

  private get raiz(): string {
    return path.resolve(this.o.raiz);
  }
  private sub(n: string): string {
    return path.join(this.raiz, n);
  }
  private get trabajo(): string {
    return this.sub('trabajo');
  }
  private get remoto(): string {
    return this.sub('remoto.git');
  }

  /** Las operaciones se hacen de una en una. */
  private serie<T>(fn: () => Promise<T>): Promise<T> {
    const r = this.cola.then(fn, fn);
    this.cola = r.catch(() => undefined);
    return r;
  }

  private insegura(): ErrorWolf {
    return new ErrorWolf(
      'laboratoriogit.ruta_insegura',
      'La carpeta del laboratorio no es la esperada: no se toca.',
    );
  }

  /**
   * Comprueba que la raíz es la del laboratorio: nombre propio, carpeta real (no enlace ni unión),
   * con la marca que escribe este módulo y sin enlaces en sus carpetas. Devuelve false si no existe.
   */
  private async verificarRaiz(): Promise<boolean> {
    if (path.basename(this.raiz) !== NOMBRE_LABORATORIO) throw this.insegura();
    const info = await lstat(this.raiz).catch(() => null);
    if (info === null) return false;
    if (info.isSymbolicLink() || !info.isDirectory()) throw this.insegura();
    const padre = await realpath(path.dirname(this.raiz));
    const real = await realpath(this.raiz);
    const igual = (a: string, b: string): boolean =>
      path.sep === '\\' ? a.toLowerCase() === b.toLowerCase() : a === b;
    if (!igual(real, path.join(padre, NOMBRE_LABORATORIO))) throw this.insegura();
    const marca = await lstat(path.join(this.raiz, MARCA)).catch(() => null);
    if (!marca?.isFile() || marca.isSymbolicLink()) throw this.insegura();
    for (const n of ['trabajo', 'remoto.git', 'home', 'hooks-vacios', 'plantilla-vacia']) {
      const i = await lstat(this.sub(n)).catch(() => null);
      if (i !== null && (i.isSymbolicLink() || !i.isDirectory())) throw this.insegura();
    }
    return true;
  }

  private entornoGit(): Record<string, string> {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(this.entorno)) {
      if (v !== undefined && HEREDADAS.has(k.toUpperCase())) env[k] = v;
    }
    const home = this.sub('home');
    return {
      ...env,
      HOME: home,
      USERPROFILE: home,
      APPDATA: path.join(home, 'AppData'),
      LOCALAPPDATA: path.join(home, 'AppData', 'Local'),
      XDG_CONFIG_HOME: path.join(home, '.config'),
      GIT_CONFIG_GLOBAL: this.sub('gitconfig-global'),
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_TERMINAL_PROMPT: '0',
      GIT_ASKPASS: '',
      SSH_ASKPASS: '',
      GCM_INTERACTIVE: 'never',
      GIT_EDITOR: ':',
      GIT_MERGE_AUTOEDIT: 'no',
      GIT_OPTIONAL_LOCKS: '0',
      // Nunca se sube a buscar un repositorio por encima de la carpeta del laboratorio.
      GIT_CEILING_DIRECTORIES: this.raiz,
    };
  }

  private argsBase(): string[] {
    const hooks = this.sub('hooks-vacios');
    const config = [
      'user.name=Practica',
      'user.email=practica@ejemplo.invalid',
      `core.hooksPath=${hooks}`,
      `init.templateDir=${this.sub('plantilla-vacia')}`,
      'protocol.allow=never',
      'protocol.file.allow=always',
      'core.fsmonitor=false',
      'credential.helper=',
      'core.askPass=',
      'core.autocrlf=false',
      'core.editor=:',
      'core.pager=cat',
      'color.ui=never',
      'init.defaultBranch=main',
      'commit.gpgsign=false',
      'tag.gpgsign=false',
      'gc.auto=0',
      'maintenance.auto=false',
      'advice.detachedHead=false',
    ];
    return ['--no-pager', ...config.flatMap((c) => ['-c', c])];
  }

  private correr(args: string[], cwd: string) {
    const ruta = this.o.buscarGit();
    if (!ruta) {
      throw new ErrorWolf('laboratoriogit.sin_git', 'No hay git instalado en este equipo.');
    }
    return this.ejecutarGit(ruta, [...this.argsBase(), ...args], {
      cwd,
      env: this.entornoGit(),
      timeoutMs: PLAZO_MS,
    });
  }

  /** Crea el laboratorio si no existe (carpetas, configuración vacía, archivos de práctica y remoto). */
  private async preparar(): Promise<void> {
    if (!this.o.buscarGit()) {
      throw new ErrorWolf('laboratoriogit.sin_git', 'No hay git instalado en este equipo.');
    }
    if (!(await this.verificarRaiz())) {
      const existente = await lstat(this.raiz).catch(() => null);
      if (existente !== null) throw this.insegura();
      await mkdir(this.raiz, { recursive: true });
      await writeFile(path.join(this.raiz, MARCA), NOMBRE_LABORATORIO, 'utf8');
    }
    for (const n of ['trabajo', 'home', 'hooks-vacios', 'plantilla-vacia']) {
      await mkdir(this.sub(n), { recursive: true });
    }
    await this.verificarRaiz();
    const config = this.sub('gitconfig-global');
    if (!existsSync(config)) await writeFile(config, '', 'utf8');
    for (const id of ARCHIVOS_LABORATORIO) {
      const ruta = path.join(this.trabajo, id);
      if (!existsSync(ruta)) await writeFile(ruta, CONTENIDO_INICIAL[id], 'utf8');
    }
    if (!existsSync(this.remoto)) {
      await mkdir(this.remoto, { recursive: true });
      await this.correr(['init', '--bare', '--', this.remoto], this.raiz);
    }
  }

  private async leerVersion(): Promise<string | null> {
    if (this.version) return this.version;
    const ruta = this.o.buscarGit();
    if (!ruta) return null;
    const r = await this.ejecutarGit(ruta, ['--version'], {
      cwd: this.raiz,
      env: this.entornoGit(),
      timeoutMs: 5000,
    }).catch(() => null);
    const m = r && r.codigo === 0 ? /version (\d+(?:\.\d+)+)/.exec(r.stdout) : null;
    return (this.version = m?.[1] ?? null);
  }

  /** Estado del laboratorio; lo prepara al abrirlo. Sin git en el sistema no crea nada. */
  estado(): Promise<EstadoLaboratorio> {
    return this.serie(async () => {
      if (!this.o.buscarGit()) {
        return { disponible: false, version: null, existe: false, hayRepo: false, archivos: [] };
      }
      await this.preparar();
      return this.leerEstado();
    });
  }

  private async leerEstado(): Promise<EstadoLaboratorio> {
    const archivos: EstadoLaboratorio['archivos'] = [];
    for (const id of ARCHIVOS_LABORATORIO) {
      archivos.push({ id, contenido: await this.contenido(id) });
    }
    return {
      disponible: true,
      version: await this.leerVersion(),
      existe: true,
      hayRepo: existsSync(path.join(this.trabajo, '.git')),
      archivos,
    };
  }

  private async contenido(id: IdArchivoLaboratorio): Promise<string> {
    const ruta = path.join(this.trabajo, id);
    const info = await lstat(ruta).catch(() => null);
    if (info === null) return '';
    if (!info.isFile() || info.isSymbolicLink()) throw this.insegura();
    return readFile(ruta, 'utf8');
  }

  async leerArchivo(id: unknown): Promise<{ id: IdArchivoLaboratorio; contenido: string }> {
    const a = archivoValido(id);
    return this.serie(async () => {
      await this.preparar();
      return { id: a, contenido: await this.contenido(a) };
    });
  }

  /** Escribe uno de los archivos de práctica (texto, hasta 2000 caracteres). */
  async escribirArchivo(id: unknown, contenido: unknown): Promise<void> {
    const a = archivoValido(id);
    if (
      typeof contenido !== 'string' ||
      contenido.length > MAX_CONTENIDO_ARCHIVO ||
      contenido.includes('\0')
    ) {
      throw new ErrorWolf(
        'laboratoriogit.contenido_invalido',
        'El contenido debe ser texto de hasta 2000 caracteres.',
      );
    }
    return this.serie(async () => {
      await this.preparar();
      await this.contenido(a); // rechaza que el archivo sea un enlace
      await writeFile(path.join(this.trabajo, a), contenido, 'utf8');
    });
  }

  private argsDe(o: Orden): string[] {
    switch (o.cmd) {
      case 'init':
        return ['init'];
      case 'status':
        return ['status'];
      case 'add':
        return o.archivo === 'todo' ? ['add', '--', '.'] : ['add', '--', o.archivo];
      case 'commit':
        return ['commit', '-m', o.mensaje];
      case 'log':
        return ['log', '--oneline', '--graph', '--all', '--decorate'];
      case 'diff':
        return o.preparado ? ['diff', '--staged', '--'] : ['diff', '--'];
      case 'branch':
        return o.nombre ? ['branch', o.nombre] : ['branch', '--list'];
      case 'switch':
        return o.crear ? ['switch', '-c', o.nombre] : ['switch', o.nombre];
      case 'merge':
        return 'abortar' in o ? ['merge', '--abort'] : ['merge', '--no-edit', o.nombre];
      case 'stash':
        return o.accion === 'push' ? ['stash', 'push', '-m', 'practica'] : ['stash', o.accion];
      case 'restore':
        return o.preparado
          ? ['restore', '--staged', '--', o.archivo]
          : ['restore', '--', o.archivo];
      case 'reset-soft':
        return ['reset', '--soft', 'HEAD~1'];
      case 'revert':
        return ['revert', '--no-edit', 'HEAD'];
      case 'remote':
        return o.accion === 'add' ? ['remote', 'add', 'origin', this.remoto] : ['remote', '-v'];
      case 'fetch':
        return ['fetch', 'origin'];
      case 'pull':
        return ['pull', '--no-rebase', '--no-edit'];
      case 'push':
        return o.etiquetas
          ? ['push', 'origin', '--tags']
          : ['push', '--set-upstream', 'origin', 'HEAD'];
      case 'tag':
        return o.nombre ? ['tag', o.nombre] : ['tag', '--list'];
    }
  }

  /** Ejecuta una orden de la lista cerrada dentro del laboratorio y devuelve su salida y el historial. */
  async ejecutar(orden: unknown): Promise<ResultadoOrden> {
    const o = validarOrden(orden);
    return this.serie(async () => {
      await this.preparar();
      const cwd = await realpath(this.trabajo);
      const args = this.argsDe(o);
      const r = await this.correr(args, cwd);
      const { texto, truncada } = limpiar([r.stdout, r.stderr].filter(Boolean).join('\n'));
      let grafo = '';
      if (existsSync(path.join(this.trabajo, '.git'))) {
        const g = await this.correr(
          ['log', '--oneline', '--graph', '--all', '--decorate', `--max-count=${MAX_LINEAS_GRAFO}`],
          cwd,
        ).catch(() => null);
        if (g && g.codigo === 0) grafo = limpiar(g.stdout).texto;
      }
      return {
        orden: `git ${args.map(entre).join(' ')}`,
        codigo: r.codigo,
        salida: texto,
        truncada,
        grafo,
      };
    });
  }

  /** Borra SOLO la carpeta del laboratorio (tras comprobarla) y la prepara de nuevo. */
  reiniciar(): Promise<EstadoLaboratorio> {
    return this.serie(async () => {
      if (!this.o.buscarGit()) {
        throw new ErrorWolf('laboratoriogit.sin_git', 'No hay git instalado en este equipo.');
      }
      if (await this.verificarRaiz()) {
        await quitarEnlaces(this.raiz);
        await rm(this.raiz, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      } else if ((await lstat(this.raiz).catch(() => null)) !== null) {
        throw this.insegura();
      }
      await this.preparar();
      return this.leerEstado();
    });
  }
}

/** Quita los enlaces y uniones de un árbol sin seguirlos, para que el borrado nunca llegue a su destino. */
async function quitarEnlaces(dir: string, restantes = { n: 50_000 }): Promise<void> {
  const entradas = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entradas) {
    if (restantes.n-- <= 0) return;
    const ruta = path.join(dir, e.name);
    if (e.isSymbolicLink()) {
      await unlink(ruta).catch(() => rmdir(ruta).catch(() => undefined));
    } else if (e.isDirectory()) {
      await quitarEnlaces(ruta, restantes);
    }
  }
}
