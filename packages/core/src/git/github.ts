import os from 'node:os';
import { lanzarSeparado, type LanzadorSeparado } from '../herramientas/terminal';
import { literalPowerShell } from '../plataforma/lanzarOculto';
import type { Ejecutor } from '../plataforma/tipos';
import { ejecutorPorDefecto } from '../plataforma/win';
import { Git, MENSAJE_TOKEN_INVALIDO, sinSecretos, validarToken } from './git';

export interface RepoGithub {
  nombre: string;
  /** owner/name */
  completo: string;
  privado: boolean;
  descripcion: string;
  /** Fecha ISO de la última actualización. */
  actualizado: string;
  url: string;
}

export interface OpcionesRepos {
  buscar?: string;
  /** Desde 1. */
  pagina?: number;
  /** Token de GitHub (lo guarda main); solo se usa si gh no tiene sesión. */
  token?: string;
}

export interface DepsGitHub {
  exec?: Ejecutor;
  entorno?: NodeJS.ProcessEnv;
  existe?: (ruta: string) => boolean;
  fetch?: typeof fetch;
  lanzarSeparado?: LanzadorSeparado;
}

/** Repos por página que devuelve `repos`. */
export const REPOS_POR_PAGINA = 50;
/** Tope de repos que se leen (gh o API): 10 páginas de 100. */
const MAX_REPOS = 1000;
const CAMPOS_GH = 'name,nameWithOwner,isPrivate,description,updatedAt,url';
const API = 'https://api.github.com';

const texto = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Convierte la salida de `gh repo list --json name,nameWithOwner,…`. */
export function interpretarGhRepoList(salida: string): RepoGithub[] {
  const datos: unknown = JSON.parse(salida);
  if (!Array.isArray(datos)) throw new Error('Respuesta inesperada de gh repo list');
  const res: RepoGithub[] = [];
  for (const d of datos as Record<string, unknown>[]) {
    if (typeof d?.name !== 'string' || typeof d.nameWithOwner !== 'string') continue;
    res.push({
      nombre: d.name,
      completo: d.nameWithOwner,
      privado: d.isPrivate === true,
      descripcion: texto(d.description),
      actualizado: texto(d.updatedAt),
      url: texto(d.url),
    });
  }
  return res;
}

function interpretarApi(datos: unknown): RepoGithub[] {
  if (!Array.isArray(datos)) throw new Error('Respuesta inesperada de la API de GitHub');
  const res: RepoGithub[] = [];
  for (const d of datos as Record<string, unknown>[]) {
    if (typeof d?.name !== 'string' || typeof d.full_name !== 'string') continue;
    res.push({
      nombre: d.name,
      completo: d.full_name,
      privado: d.private === true,
      descripcion: texto(d.description),
      actualizado: texto(d.updated_at),
      url: texto(d.html_url),
    });
  }
  return res;
}

function filtrarYPaginar(repos: RepoGithub[], o: OpcionesRepos): RepoGithub[] {
  const q = o.buscar?.trim().toLowerCase();
  const filtrados = q
    ? repos.filter(
        (r) => r.completo.toLowerCase().includes(q) || r.descripcion.toLowerCase().includes(q),
      )
    : repos;
  const pagina = Math.max(1, Math.floor(o.pagina ?? 1));
  return filtrados.slice((pagina - 1) * REPOS_POR_PAGINA, pagina * REPOS_POR_PAGINA);
}

export class GitHub {
  private readonly exec: Ejecutor;
  private readonly entorno: NodeJS.ProcessEnv;
  private readonly fetch: typeof fetch;
  private readonly lanzar: LanzadorSeparado;
  private readonly git: Git;

  constructor(d: DepsGitHub = {}) {
    this.exec = d.exec ?? ejecutorPorDefecto;
    this.entorno = d.entorno ?? process.env;
    this.fetch = d.fetch ?? globalThis.fetch;
    this.lanzar = d.lanzarSeparado ?? lanzarSeparado;
    this.git = new Git({ exec: this.exec, entorno: this.entorno, existe: d.existe });
  }

  /**
   * Repos del usuario: con `gh repo list` si gh tiene sesión; si no, con la API REST y el token.
   * La búsqueda (nombre o descripción) y la paginación se hacen sobre la lista completa.
   */
  async repos(o: OpcionesRepos = {}): Promise<RepoGithub[]> {
    const d = await this.git.disponible();
    if (d.gh && d.ghSesion) return filtrarYPaginar(await this.reposGh(d.gh), o);
    if (o.token) return filtrarYPaginar(await this.reposApi(o.token), o);
    throw new Error('Conecte GitHub: inicie sesión con GitHub CLI o use un token');
  }

  private async reposGh(gh: string): Promise<RepoGithub[]> {
    const r = await this.exec(
      gh,
      ['repo', 'list', '--limit', String(MAX_REPOS), '--json', CAMPOS_GH],
      { timeoutMs: 60_000, env: { GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1' } },
    );
    if (r.codigo !== 0) {
      throw new Error(`gh no pudo listar los repositorios: ${sinSecretos(r.stderr.trim())}`);
    }
    return interpretarGhRepoList(r.stdout);
  }

  private async reposApi(token: string): Promise<RepoGithub[]> {
    validarToken(token);
    const todos: RepoGithub[] = [];
    for (let pagina = 1; todos.length < MAX_REPOS; pagina++) {
      const url =
        `${API}/user/repos?per_page=100&page=${pagina}&sort=updated` +
        '&affiliation=owner,collaborator,organization_member';
      let resp: Response;
      try {
        resp = await this.fetch(url, {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'WolfCore-Dev',
          },
          signal: AbortSignal.timeout(30_000),
        });
      } catch (e) {
        throw new Error(
          `No se pudo conectar con GitHub: ${sinSecretos(String((e as Error)?.message ?? e), token)}`,
        );
      }
      if (resp.status === 401) throw new Error(`${MENSAJE_TOKEN_INVALIDO} o caducó`);
      if (!resp.ok) {
        throw new Error(`GitHub respondió ${resp.status} al listar los repositorios`);
      }
      const lote = interpretarApi(await resp.json());
      todos.push(...lote);
      if (lote.length < 100) break;
    }
    return todos;
  }

  /** Instala GitHub CLI con winget (puede tardar; Windows puede pedir permiso). */
  async instalarGh(): Promise<void> {
    const r = await this.exec(
      'winget',
      [
        'install',
        '--id',
        'GitHub.cli',
        '-e',
        '--source',
        'winget',
        '--accept-source-agreements',
        '--accept-package-agreements',
        '--disable-interactivity',
      ],
      { timeoutMs: 15 * 60_000 },
    );
    if (r.codigo !== 0) {
      const salida = sinSecretos(
        `${r.stdout}\n${r.stderr}`.trim().split(/\r?\n/).slice(-3).join(' | '),
      );
      throw new Error(`No se pudo instalar GitHub CLI: ${salida || `código ${r.codigo}`}`);
    }
  }

  /** Abre `gh auth login --web` en una terminal visible: el inicio de sesión es interactivo. */
  async iniciarSesionGh(): Promise<void> {
    const gh = this.git.buscar('gh');
    if (!gh) throw new Error('GitHub CLI (gh) no está instalado: instálelo primero');
    const cwd = this.entorno.USERPROFILE || os.homedir();
    await this.lanzar(
      'powershell.exe',
      [
        '-NoExit',
        '-Command',
        `& ${literalPowerShell(gh)} auth login --web --hostname github.com --git-protocol https`,
      ],
      { cwd, env: { ...this.entorno } },
    );
  }
}
