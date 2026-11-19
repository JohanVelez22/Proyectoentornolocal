import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { lanzadorPorDefecto, MENSAJE_CANCELADO } from '../plataforma/lanzar';
import type { Ejecutor, Lanzador } from '../plataforma/tipos';
import { ejecutorPorDefecto } from '../plataforma/win';
import { sanear } from '../proyectos/recetas';
import { buscarEjecutableWindows } from '../plataforma/win';

export const MENSAJE_CAMBIOS_LOCALES =
  'Hay cambios sin guardar en la carpeta: guárdelos (commit) o descártelos antes de traer cambios. No se tocó nada.';
export const MENSAJE_DIVERGENCIA =
  'La rama divergió del remoto (hay commits locales y remotos distintos): resuélvalo a mano. No se tocó nada.';
export const MENSAJE_SIN_UPSTREAM =
  'La rama actual no sigue a ninguna rama remota: no hay de dónde traer cambios.';
export const MENSAJE_TOKEN_INVALIDO = 'El token de GitHub no es válido';

/** Rutas donde suelen quedar git y gh en Windows aunque no estén en el PATH. */
export const RUTAS_CONOCIDAS = {
  git: ['C:\\Program Files\\Git\\cmd'],
  gh: ['C:\\Program Files\\GitHub CLI'],
} as const;

/** Clave de configuración por URL: la cabecera solo se aplica a https://github.com/… */
const CLAVE_CABECERA = 'http.https://github.com/.extraHeader';

const OWNER_NAME = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const SCP_GIT = /^git@[A-Za-z0-9.-]+:[A-Za-z0-9._~/-]+$/;
/** Tokens de GitHub (clásicos, finos y de gh): sin espacios ni caracteres de control. */
const TOKEN_VALIDO = /^[A-Za-z0-9_.-]{1,512}$/;

export interface DisponibilidadGit {
  git: string | null;
  gh: string | null;
  ghSesion: boolean;
  usuario?: string;
}

export interface EstadoGit {
  /** Rama actual; null con el HEAD suelto. */
  rama: string | null;
  cambiosLocales: number;
  adelante: number;
  atras: number;
  /** URL de origin sin credenciales; null si no hay remoto. */
  remoto: string | null;
}

export interface CambiosTraidos {
  composerLock: boolean;
  packageLock: boolean;
  migraciones: string[];
  requirements: boolean;
}

export interface ResultadoTraer {
  actualizado: boolean;
  cambios: CambiosTraidos;
}

export interface OpcionesClonar {
  /** Token de GitHub: viaja por variables de entorno, nunca en la URL ni en los argumentos. */
  token?: string;
  /** Cada línea de progreso, ya saneada (sin tokens). */
  alProgreso?: (linea: string) => void;
  senal?: AbortSignal;
}

export interface DepsGit {
  exec?: Ejecutor;
  lanzar?: Lanzador;
  entorno?: NodeJS.ProcessEnv;
  existe?: (ruta: string) => boolean;
  /** Plazo máximo de un clon (30 min por defecto); al vencer se corta como una cancelación. */
  plazoClonMs?: number;
}

/** Plazo por defecto de un clon. */
export const PLAZO_CLON_MS = 30 * 60_000;

/** ssh sin preguntas: falla en vez de pedir clave; acepta solo hosts nuevos (no cambiados). */
export const SSH_EN_LOTE = 'ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new';

/**
 * Valida la URL de un clon: https:// (sin credenciales), git@host:ruta o owner/name (con gh).
 * Rechaza file://, ext::, http:// y todo lo que empiece con '-' (se leería como opción).
 */
export function validarUrlGit(url: string): { tipo: 'url' | 'gh' } {
  const mala = (): Error => new Error('URL de Git no válida: use https://… o git@…');
  const conControl = [...url].some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f);
  if (!url || url.startsWith('-') || /\s/.test(url) || conControl) throw mala();
  if (OWNER_NAME.test(url)) {
    if (url.split('/').some((p) => /^\.+$/.test(p))) throw mala();
    return { tipo: 'gh' };
  }
  if (url.startsWith('git@')) {
    if (!SCP_GIT.test(url) || url.includes('::')) throw mala();
    return { tipo: 'url' };
  }
  if (!url.startsWith('https://')) throw mala();
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw mala();
  }
  if (u.protocol !== 'https:' || !u.hostname) throw mala();
  if (u.username || u.password) {
    throw new Error('La URL no debe llevar usuario ni clave: use un token por separado');
  }
  return { tipo: 'url' };
}

/** Valida el token antes de ponerlo en una cabecera (evita inyectar cabeceras o filtrarlo). */
export function validarToken(token: string): void {
  if (!TOKEN_VALIDO.test(token)) throw new Error(MENSAJE_TOKEN_INVALIDO);
}

const basicDe = (token: string): string =>
  Buffer.from(`x-access-token:${token}`).toString('base64');

/** Quita el token (literal y en base64) y demás secretos de un texto antes de mostrarlo. */
export function sinSecretos(texto: string, token?: string): string {
  let t = texto;
  if (token) {
    t = t.split(token).join('***').split(basicDe(token)).join('***');
  }
  return sanear(t);
}

/** URL sin usuario ni clave (para mostrar el remoto). */
export function urlSinCredenciales(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const u = new URL(url);
    u.username = '';
    u.password = '';
    return u.toString();
  } catch {
    return sanear(url);
  }
}

const esGithubHttps = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.toLowerCase() === 'github.com';
  } catch {
    return false;
  }
};

/** Últimas líneas útiles (fatal/error/remote) de la salida de git, sin secretos. */
function resumen(texto: string, token?: string): string {
  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const utiles = lineas.filter((l) => /^(fatal|error|remote):/i.test(l));
  return sinSecretos((utiles.length ? utiles : lineas).slice(-3).join(' | '), token);
}

const vacio = (): CambiosTraidos => ({
  composerLock: false,
  packageLock: false,
  migraciones: [],
  requirements: false,
});

/** Clasifica los archivos que cambiaron en un avance (rutas con '/', como las da git). */
export function clasificarCambios(archivos: string[]): CambiosTraidos {
  const c = vacio();
  for (const a of archivos) {
    const base = a.split('/').pop() ?? a;
    if (base === 'composer.lock') c.composerLock = true;
    else if (base === 'package-lock.json') c.packageLock = true;
    else if (/^requirements.*\.txt$/i.test(base)) c.requirements = true;
    if (/(^|\/)(migrations|alembic\/versions)\//i.test(a)) c.migraciones.push(a);
  }
  return c;
}

interface StatusV2 {
  rama: string | null;
  upstream: boolean;
  adelante: number;
  atras: number;
  entradas: number;
}

function interpretarStatus(salida: string): StatusV2 {
  const r: StatusV2 = { rama: null, upstream: false, adelante: 0, atras: 0, entradas: 0 };
  for (const l of salida.split(/\r?\n/)) {
    if (!l) continue;
    if (l.startsWith('# branch.head ')) {
      const h = l.slice('# branch.head '.length).trim();
      r.rama = h === '(detached)' ? null : h;
    } else if (l.startsWith('# branch.upstream ')) r.upstream = true;
    else if (l.startsWith('# branch.ab ')) {
      const m = /\+(\d+) -(\d+)/.exec(l);
      if (m) {
        r.adelante = Number(m[1]);
        r.atras = Number(m[2]);
      }
    } else if (!l.startsWith('#')) r.entradas++;
  }
  return r;
}

export class Git {
  private readonly exec: Ejecutor;
  private readonly lanzar: Lanzador;
  private readonly entorno: NodeJS.ProcessEnv;
  private readonly existe: (ruta: string) => boolean;
  private readonly plazoClonMs: number;

  constructor(d: DepsGit = {}) {
    this.plazoClonMs = d.plazoClonMs ?? PLAZO_CLON_MS;
    this.exec = d.exec ?? ejecutorPorDefecto;
    this.lanzar = d.lanzar ?? lanzadorPorDefecto;
    this.entorno = d.entorno ?? process.env;
    this.existe = d.existe ?? existsSync;
  }

  /** Ruta de git o gh: primero el PATH, luego las rutas conocidas; null si no está. */
  buscar(nombre: 'git' | 'gh'): string | null {
    return buscarEjecutableWindows(nombre, {
      entorno: this.entorno,
      existe: this.existe,
      extras: RUTAS_CONOCIDAS[nombre],
    });
  }

  /** `git --version` / `gh --version` con plazo corto; [] si no está o no responde bien. */
  async version(nombre: 'git' | 'gh', plazoMs = 5000): Promise<string[]> {
    const ruta = this.buscar(nombre);
    if (!ruta) return [];
    const r = await this.exec(ruta, ['--version'], {
      timeoutMs: plazoMs,
      env: { GH_NO_UPDATE_NOTIFIER: '1' },
    });
    if (r.codigo !== 0) return [];
    const m = /version (\d+(?:\.\d+)+)/.exec(r.stdout);
    return m?.[1] ? [m[1]] : [];
  }

  private rutaGit(): string {
    return this.buscar('git') ?? 'git';
  }

  async disponible(): Promise<DisponibilidadGit> {
    const git = this.buscar('git');
    const gh = this.buscar('gh');
    if (!gh) return { git, gh, ghSesion: false };
    const r = await this.exec(gh, ['auth', 'status', '--hostname', 'github.com'], {
      timeoutMs: 15_000,
      env: { GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1' },
    }).catch(() => ({ codigo: 1, stdout: '', stderr: '' }));
    const ghSesion = r.codigo === 0;
    const m = /Logged in to \S+ (?:account|as) ([A-Za-z0-9-]+)/.exec(`${r.stdout}\n${r.stderr}`);
    return ghSesion && m ? { git, gh, ghSesion, usuario: m[1] } : { git, gh, ghSesion };
  }

  /**
   * Variables de entorno para git: sin preguntas (ni terminal ni askpass) ni trazas y, con token,
   * la cabecera Authorization por GIT_CONFIG_COUNT/KEY/VALUE (nunca en argumentos, URL ni
   * .git/config). La cabecera va con clave por URL (solo https://github.com/) y, si se da `url`,
   * solo se agrega cuando apunta a github.com. Para ssh (URL git@ o sin URL, como en fetch) se usa
   * ssh en modo lote, salvo que el usuario tenga su propio GIT_SSH_COMMAND o GIT_SSH.
   */
  entornoGit(token?: string, url?: string): Record<string, string> {
    const env: Record<string, string> = {
      GIT_TERMINAL_PROMPT: '0',
      GIT_ASKPASS: '',
      SSH_ASKPASS: '',
      GCM_INTERACTIVE: 'never',
      GIT_TRACE: '0',
      GIT_TRACE_CURL: '0',
      GIT_TRACE_PACKET: '0',
      // GIT_CURL_VERBOSE no se toca: git la activa con solo existir (aun con "0").
      GIT_TRACE_REDACT: '1',
    };
    const config: [string, string][] = [['core.askPass', '']];
    if (token && (url === undefined || esGithubHttps(url))) {
      validarToken(token);
      config.push(['credential.helper', '']);
      config.push([CLAVE_CABECERA, `Authorization: Basic ${basicDe(token)}`]);
    }
    env.GIT_CONFIG_COUNT = String(config.length);
    config.forEach(([k, v], i) => {
      env[`GIT_CONFIG_KEY_${i}`] = k;
      env[`GIT_CONFIG_VALUE_${i}`] = v;
    });
    const sshPropio = this.entorno.GIT_SSH_COMMAND || this.entorno.GIT_SSH;
    if (!sshPropio && (url === undefined || url.startsWith('git@'))) {
      env.GIT_SSH_COMMAND = SSH_EN_LOTE;
    }
    return env;
  }

  /**
   * Clona `url` en `destino` (que no debe existir o debe estar vacío). `owner/name` se clona con
   * `gh repo clone`. Si falla, borra solo lo que creó el clon.
   */
  async clonar(url: string, destino: string, o: OpcionesClonar = {}): Promise<void> {
    const { tipo } = validarUrlGit(url);
    const absoluto = path.resolve(destino);
    const existia = await this.verificarDestino(absoluto);
    // Carpeta más alta que no existía: es lo que hay que quitar si el clon falla.
    // mkdir devuelve la primera carpeta que creó (undefined si ya existían todas): es lo que hay
    // que quitar si el clon falla.
    const creada = existia
      ? absoluto
      : ((await mkdir(path.dirname(absoluto), { recursive: true })) ?? absoluto);

    const token = o.token;
    let cmd: string;
    let args: string[];
    let env: Record<string, string>;
    if (tipo === 'gh') {
      cmd = this.buscar('gh') ?? 'gh';
      args = ['repo', 'clone', url, absoluto, '--', '--progress'];
      env = { ...this.entornoGit(), GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1' };
      if (token) {
        validarToken(token);
        env.GH_TOKEN = token;
      }
    } else {
      cmd = this.rutaGit();
      args = ['clone', '--progress', '--', url, absoluto];
      env = this.entornoGit(token, url);
    }

    const finales: string[] = [];
    const alLinea = (l: string): void => {
      // El lanzador ya corta en \r (progreso en vivo); por si acaso, se toma el último tramo.
      const tramo = l
        .split('\r')
        .filter((x) => x.trim())
        .pop();
      if (!tramo) return;
      const limpio = sinSecretos(tramo, token);
      finales.push(limpio);
      if (finales.length > 20) finales.shift();
      o.alProgreso?.(limpio);
    };
    // Señal propia: se aborta con la del llamador o al vencer el plazo.
    const control = new AbortController();
    let vencido = false;
    const alAbortar = (): void => control.abort();
    if (o.senal?.aborted) control.abort();
    o.senal?.addEventListener('abort', alAbortar, { once: true });
    const reloj = setTimeout(() => {
      vencido = true;
      control.abort();
    }, this.plazoClonMs);
    const soltar = (): void => {
      clearTimeout(reloj);
      o.senal?.removeEventListener('abort', alAbortar);
    };
    const minutos = Math.max(1, Math.round(this.plazoClonMs / 60_000));
    const mensajePlazo = `El clon superó el plazo de ${minutos} min y se canceló`;
    let codigo: number;
    try {
      ({ codigo } = await this.lanzar(cmd, args, {
        env,
        alLinea,
        senal: control.signal,
        cortarEnRetorno: true,
      }));
    } catch (e) {
      soltar();
      await this.deshacer(existia, absoluto, creada);
      if (vencido) throw new Error(mensajePlazo);
      if ((e as { code?: unknown }).code === 'ENOENT') {
        throw new Error(
          tipo === 'gh'
            ? 'No se encontró GitHub CLI (gh): instálelo primero'
            : 'No se encontró git: instálelo primero',
        );
      }
      if (o.senal?.aborted) throw new Error(MENSAJE_CANCELADO);
      throw new Error(
        `No se pudo clonar: ${sinSecretos((e as Error).message ?? String(e), token)}`,
      );
    }
    soltar();
    if (codigo !== 0) {
      await this.deshacer(existia, absoluto, creada);
      if (vencido) throw new Error(mensajePlazo);
      if (o.senal?.aborted) throw new Error(MENSAJE_CANCELADO);
      const detalle = resumen(finales.join('\n'), token) || `código ${codigo}`;
      const credenciales =
        /could not read Username|Authentication failed|terminal prompts disabled/i;
      throw new Error(
        credenciales.test(detalle)
          ? `No se pudo clonar: GitHub rechazó el acceso (token no válido o sin permiso para el repositorio). ${detalle}`
          : `No se pudo clonar: ${detalle}`,
      );
    }
  }

  /** true si el destino ya existía (vacío); error si existe con contenido o es un archivo. */
  private async verificarDestino(destino: string): Promise<boolean> {
    const s = await stat(destino).catch(() => null);
    if (!s) return false;
    if (!s.isDirectory()) throw new Error(`El destino es un archivo: ${destino}`);
    if ((await readdir(destino)).length > 0) {
      throw new Error(`La carpeta de destino no está vacía: ${destino}`);
    }
    return true;
  }

  private async deshacer(existia: boolean, destino: string, creada: string): Promise<void> {
    if (existia) {
      for (const n of await readdir(destino).catch(() => [] as string[])) {
        await rm(path.join(destino, n), { recursive: true, force: true }).catch(() => undefined);
      }
    } else {
      await rm(creada, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async git(
    carpeta: string,
    args: string[],
    o: { token?: string; timeoutMs?: number; quotepath?: false } = {},
  ): Promise<{ codigo: number; stdout: string; stderr: string }> {
    // Sin comillas ni escapes en rutas con tildes (para leer la lista de archivos de diff).
    const pre = o.quotepath === false ? ['-c', 'core.quotepath=false'] : [];
    return this.exec(this.rutaGit(), [...pre, ...args], {
      cwd: carpeta,
      timeoutMs: o.timeoutMs ?? 30_000,
      env: this.entornoGit(o.token),
    });
  }

  private async status(carpeta: string, conNoSeguidos: boolean): Promise<StatusV2> {
    const r = await this.git(carpeta, [
      'status',
      '--porcelain=v2',
      '--branch',
      `--untracked-files=${conNoSeguidos ? 'normal' : 'no'}`,
    ]);
    if (r.codigo !== 0) {
      if (/not a git repository/i.test(r.stderr)) {
        throw new Error(`La carpeta no es un repositorio de git: ${carpeta}`);
      }
      throw new Error(`No se pudo leer el estado de git: ${resumen(r.stderr)}`);
    }
    return interpretarStatus(r.stdout);
  }

  async estado(carpeta: string): Promise<EstadoGit> {
    const s = await this.status(carpeta, true);
    const r = await this.git(carpeta, ['remote', 'get-url', 'origin']);
    const remoto = r.codigo === 0 && r.stdout.trim() ? urlSinCredenciales(r.stdout.trim()) : null;
    return {
      rama: s.rama,
      cambiosLocales: s.entradas,
      adelante: s.adelante,
      atras: s.atras,
      remoto,
    };
  }

  /**
   * `git fetch` y avance rápido (`merge --ff-only @{upstream}`, equivalente a `pull --ff-only`
   * tras el fetch). Con cambios locales en archivos seguidos, sin rama remota o con la rama
   * divergida, avisa sin tocar el árbol. Los archivos sin seguir no bloquean: si el avance los
   * pisara, git se niega sin cambiar nada.
   */
  async traerCambios(carpeta: string, o: { token?: string } = {}): Promise<ResultadoTraer> {
    const antes = await this.status(carpeta, false);
    if (antes.entradas > 0) throw new Error(MENSAJE_CAMBIOS_LOCALES);
    if (antes.rama === null) {
      throw new Error('El repositorio está en un commit suelto (sin rama): no se tocó nada.');
    }
    if (!antes.upstream) throw new Error(MENSAJE_SIN_UPSTREAM);

    const f = await this.git(carpeta, ['fetch', '--prune'], { token: o.token, timeoutMs: 300_000 });
    if (f.codigo !== 0) {
      throw new Error(`No se pudieron traer los cambios: ${resumen(f.stderr, o.token)}`);
    }
    const s = await this.status(carpeta, false);
    if (s.entradas > 0) throw new Error(MENSAJE_CAMBIOS_LOCALES);
    if (s.adelante > 0 && s.atras > 0) throw new Error(MENSAJE_DIVERGENCIA);
    if (s.atras === 0) return { actualizado: false, cambios: vacio() };

    const h = await this.git(carpeta, ['rev-parse', 'HEAD']);
    const previo = h.stdout.trim();
    if (h.codigo !== 0 || !/^[0-9a-f]{4,64}$/i.test(previo)) {
      throw new Error(`No se pudo leer el commit actual: ${resumen(h.stderr)}`);
    }
    const m = await this.git(carpeta, ['merge', '--ff-only', '@{upstream}'], {
      timeoutMs: 120_000,
    });
    if (m.codigo !== 0) {
      throw new Error(`No se pudo avanzar la rama: ${resumen(`${m.stderr}\n${m.stdout}`)}`);
    }
    // Equivale a HEAD@{1}..HEAD, sin depender del reflog.
    const d = await this.git(
      carpeta,
      ['diff', '--name-only', '--diff-filter=ACMR', previo, 'HEAD'],
      {
        quotepath: false,
      },
    );
    const archivos = d.codigo === 0 ? d.stdout.split(/\r?\n/).filter(Boolean) : [];
    return { actualizado: true, cambios: clasificarCambios(archivos) };
  }
}
