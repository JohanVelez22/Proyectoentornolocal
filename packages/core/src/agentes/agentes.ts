import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { REGISTRO_NPM_AGENTES } from '../catalogo/catalogo';
import { ErrorWolf } from '../errores';
import { errorIa } from '../ia/errores';
import type { FetchIa } from '../ia/http';
import {
  crearClienteIa,
  validarModeloIa,
  type ClienteIa,
  type ConfigProveedorIa,
} from '../ia/proveedores';
import { sanear } from '../proyectos/recetas';
import type { Ejecutor, PlataformaCompleta } from '../plataforma/tipos';
import type { DiffPreparado } from '../git/git';
import { CLAUDE_CODE } from './claudeCode';
import { CODEX } from './codex';
import {
  editarConfigAgente,
  entradaMcp,
  interpretarConfig,
  leerConfigAgente,
  respaldarConfigAgente,
  VARIABLE_TOKEN_MCP,
  type FormatoConfig,
  type ValorEntradaMcp,
} from './configArchivo';
import { HERMES } from './hermes';

export type IdAgente = 'claude-code' | 'codex' | 'hermes';
export const IDS_AGENTE: readonly IdAgente[] = ['claude-code', 'codex', 'hermes'];

/** Lo que define a cada agente (sus datos fijos: binario, paquete oficial, archivo, CLI). */
export interface DefAgente {
  id: IdAgente;
  nombre: string;
  /** Nombre del ejecutable sin sufijo. */
  binario: string;
  /** Paquete oficial de npm (null: WolfCore Dev no lo instala). */
  paquete: string | null;
  /** Guía oficial de instalación. */
  guia: string;
  formato: FormatoConfig;
  /** Sección de servidores MCP en su archivo. */
  seccion: string;
  archivoConfig(inicio: string): string;
  /** Carpetas donde suele quedar el ejecutable fuera del PATH. */
  carpetasConocidas(inicio: string): string[];
  /** Entrada `wolfcore` (con el token por variable, nunca escrito). */
  entradaMcp(url: string): ValorEntradaMcp;
  /** Argumentos de su CLI para registrar el MCP (si la tiene). */
  argsRegistrar?(url: string): string[];
  argsQuitar?(): string[];
  /** Variables con la clave del proveedor para ese agente; null si no lo admite. */
  variablesClave(p: ConfigProveedorIa, clave: string): Record<string, string> | null;
}

export const AGENTES: Record<IdAgente, DefAgente> = {
  'claude-code': CLAUDE_CODE,
  codex: CODEX,
  hermes: HERMES,
};

export interface EstadoAgente {
  id: IdAgente;
  instalado: boolean;
  ruta: string | null;
  version: string | null;
  mcpRegistrado: boolean;
  /** WolfCore Dev puede instalarlo (paquete oficial de npm con el Node propio). */
  instalable: boolean;
  guia?: string;
}

/** Cómo se ejecuta un agente: el programa y los argumentos que van antes de los suyos. */
interface Lanzable {
  cmd: string;
  previos: string[];
  ruta: string;
  version: string | null;
}

export interface ResultadoRegistroMcp {
  /** Copia previa del archivo del agente (null si no existía). */
  respaldo: string | null;
  metodo: 'cli' | 'archivo';
}

export interface DepsAgentes {
  plataforma: Pick<
    PlataformaCompleta,
    | 'carpetaInicio'
    | 'buscarEjecutable'
    | 'abrirTerminal'
    | 'nombreEjecutable'
    | 'carpetasNpmGlobal'
  >;
  exec: Ejecutor;
  /** Carpeta del Node propio más nuevo (con su npm), o null si no hay. */
  nodePropio(): Promise<string | null>;
  /** Prefijo de `npm install -g` de WolfCore Dev (dentro de su carpeta de datos). */
  carpetaAgentes(): string;
  mcp: { url(): Promise<string>; token(): Promise<string> };
  /** Carpeta del sitio (sale del id; `proyectos.no_existe` si no está). */
  sitio(id: string): Promise<{ carpeta: string }>;
  proveedorIa(id: string): Promise<ConfigProveedorIa>;
  diffPreparado(carpeta: string): Promise<DiffPreparado>;
  commitPreparado(carpeta: string, mensaje: string): Promise<void>;
  fetch?: FetchIa;
  ahora?: () => Date;
}

/** Plazo de `npm install -g` (los agentes traen binarios grandes). */
export const PLAZO_INSTALAR_MS = 15 * 60_000;
const PLAZO_CLI_MS = 60_000;
const PLAZO_VERSION_MS = 10_000;
/** Tope de la respuesta del mensaje de commit. */
export const MAX_TOKENS_COMMIT = 300;
const CLAVE_VALIDA = /^[\x21-\x7e]{1,4096}$/;
const SCRIPT_NODE = /\.(?:c|m)?js$/i;

export const INSTRUCCION_COMMIT =
  'Escribe un mensaje de commit para estos cambios preparados (git diff --cached). ' +
  'Primera línea de hasta 72 caracteres en modo imperativo; si hace falta, una línea en blanco ' +
  'y un cuerpo breve. Responde solo con el mensaje, sin comillas ni bloques de código.\n\n';

function confirmar(confirmado: unknown, mensaje: string): void {
  if (confirmado !== true) throw new ErrorWolf('agentes.sin_confirmar', mensaje);
}

export function defAgente(id: string): DefAgente {
  if (!(IDS_AGENTE as readonly string[]).includes(id)) {
    throw new ErrorWolf('agentes.no_existe', 'Agente no soportado.');
  }
  return AGENTES[id as IdAgente];
}

async function existeArchivo(ruta: string): Promise<boolean> {
  return lstat(ruta).then(
    (i) => i.isFile(),
    () => false,
  );
}

async function leerJson(ruta: string): Promise<Record<string, unknown> | null> {
  try {
    const v = JSON.parse(await readFile(ruta, 'utf8')) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Mensaje de commit limpio: sin bloques de código ni comillas alrededor, acotado. */
export function limpiarMensajeCommit(texto: string): string {
  let t = texto.trim();
  const bloque = /^```[\w-]*\r?\n([\s\S]*?)\r?\n?```$/.exec(t);
  if (bloque) t = bloque[1]!.trim();
  if (/^(["'`]).*\1$/s.test(t)) t = t.slice(1, -1).trim();
  return t.replace(/\0/g, '').slice(0, 2000);
}

/**
 * Agentes de programación (Claude Code, Codex CLI, Hermes Agent): detección, instalación con el
 * paquete oficial, registro del MCP de WolfCore Dev en su configuración y apertura en un
 * proyecto. Nunca se lanzan solos: cada acción la pide el usuario (y las que escriben, con
 * `confirmado`). La clave de un proveedor va solo en el entorno del proceso que se abre.
 */
export class Agentes {
  constructor(private readonly d: DepsAgentes) {}

  private inicio(): string {
    return this.d.plataforma.carpetaInicio();
  }

  /** `node` y `npm-cli.js` del Node propio (las dos distribuciones: con o sin `bin/`). */
  private async nodeYNpm(): Promise<{ node: string; npm: string } | null> {
    const dir = await this.d.nodePropio();
    if (!dir) return null;
    const nombre = this.d.plataforma.nombreEjecutable('node');
    const nodes = [path.join(dir, nombre), path.join(dir, 'bin', nombre)];
    const npms = [
      path.join(dir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      path.join(dir, 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    ];
    let node: string | null = null;
    for (const n of nodes) if (!node && (await existeArchivo(n))) node = n;
    let npm: string | null = null;
    for (const n of npms) if (!npm && (await existeArchivo(n))) npm = n;
    return node && npm ? { node, npm } : null;
  }

  /** Node para ejecutar el script de un paquete: el propio o el del PATH. */
  private async nodeParaScripts(): Promise<string | null> {
    return (await this.nodeYNpm())?.node ?? (await this.d.plataforma.buscarEjecutable('node'));
  }

  /** Paquete de npm instalado globalmente en `prefijo` → cómo se ejecuta su binario. */
  private async desdePaquete(prefijo: string, def: DefAgente): Promise<Lanzable | null> {
    if (!def.paquete) return null;
    for (const dir of [
      path.join(prefijo, 'node_modules', def.paquete),
      path.join(prefijo, 'lib', 'node_modules', def.paquete),
    ]) {
      const pj = await leerJson(path.join(dir, 'package.json'));
      if (!pj || pj['name'] !== def.paquete) continue;
      const bin = pj['bin'];
      const rel =
        typeof bin === 'string'
          ? bin
          : bin && typeof bin === 'object'
            ? (bin as Record<string, unknown>)[def.binario]
            : undefined;
      if (typeof rel !== 'string') continue;
      const ruta = path.resolve(dir, rel);
      // El binario declarado no puede salir de la carpeta del paquete.
      if (path.relative(dir, ruta).startsWith('..') || !(await existeArchivo(ruta))) continue;
      const version = typeof pj['version'] === 'string' ? pj['version'] : null;
      if (SCRIPT_NODE.test(ruta)) {
        const node = await this.nodeParaScripts();
        if (!node) continue;
        return { cmd: node, previos: [ruta], ruta, version };
      }
      return { cmd: ruta, previos: [], ruta, version };
    }
    return null;
  }

  private async versionDe(cmd: string, previos: string[]): Promise<string | null> {
    try {
      const r = await this.d.exec(cmd, [...previos, '--version'], {
        timeoutMs: PLAZO_VERSION_MS,
        cwd: this.inicio(),
      });
      if (r.codigo !== 0) return null;
      return /(\d+\.\d+\.\d+(?:[-+][\w.]+)?)/.exec(r.stdout)?.[1] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Dónde está el agente: primero lo instalado por WolfCore Dev, luego el npm global del
   * usuario y por último el ejecutable en el PATH o en sus carpetas conocidas.
   */
  private async lanzable(def: DefAgente): Promise<Lanzable | null> {
    const prefijos = [this.d.carpetaAgentes(), ...this.d.plataforma.carpetasNpmGlobal()];
    for (const p of prefijos) {
      const l = await this.desdePaquete(p, def);
      if (l) return l;
    }
    const exe = await this.d.plataforma.buscarEjecutable(
      def.binario,
      def.carpetasConocidas(this.inicio()),
    );
    if (!exe) return null;
    return { cmd: exe, previos: [], ruta: exe, version: await this.versionDe(exe, []) };
  }

  private async mcpRegistrado(def: DefAgente): Promise<boolean> {
    try {
      const ruta = def.archivoConfig(this.inicio());
      const obj = interpretarConfig(def.formato, await leerConfigAgente(ruta), ruta);
      return entradaMcp(obj, def.seccion) !== undefined;
    } catch {
      return false;
    }
  }

  async estado(): Promise<EstadoAgente[]> {
    return Promise.all(
      IDS_AGENTE.map(async (id) => {
        const def = AGENTES[id];
        const l = await this.lanzable(def);
        return {
          id,
          instalado: l !== null,
          ruta: l?.ruta ?? null,
          version: l?.version ?? null,
          mcpRegistrado: await this.mcpRegistrado(def),
          instalable: def.paquete !== null,
          guia: def.guia,
        };
      }),
    );
  }

  /**
   * `npm install -g <paquete oficial>` con el Node propio, en la carpeta de WolfCore Dev y
   * siempre contra `registry.npmjs.org` (aunque el usuario tenga otro registro configurado).
   */
  async instalar(id: IdAgente, confirmado: true): Promise<void> {
    const def = defAgente(id);
    confirmar(confirmado, `Confirme la instalación de ${def.nombre}.`);
    if (!def.paquete) {
      throw new ErrorWolf(
        'agentes.no_instalable',
        `${def.nombre} no se instala desde WolfCore Dev: siga la guía oficial.`,
        { guia: def.guia },
      );
    }
    const nn = await this.nodeYNpm();
    if (!nn) {
      throw new ErrorWolf(
        'agentes.sin_node',
        'Instale Node desde Servicios para poder instalar el agente.',
      );
    }
    const r = await this.d.exec(
      nn.node,
      [
        nn.npm,
        'install',
        '--global',
        '--prefix',
        this.d.carpetaAgentes(),
        '--registry',
        REGISTRO_NPM_AGENTES,
        '--no-fund',
        '--no-audit',
        def.paquete,
      ],
      { timeoutMs: PLAZO_INSTALAR_MS, cwd: this.d.carpetaAgentes() },
    );
    if (r.codigo !== 0) {
      throw new ErrorWolf('agentes.instalacion_fallo', `No se pudo instalar ${def.nombre}.`, {
        detalle: sanear(`${r.stderr || r.stdout}`.trim().split(/\r?\n/).slice(-3).join(' ')).slice(
          0,
          300,
        ),
      });
    }
  }

  private archivo(def: DefAgente): string {
    return def.archivoConfig(this.inicio());
  }

  /** El archivo del agente se entiende (si no, ni su CLI ni WolfCore Dev lo tocan). */
  private async comprobarArchivo(def: DefAgente): Promise<void> {
    const ruta = this.archivo(def);
    interpretarConfig(def.formato, await leerConfigAgente(ruta), ruta);
  }

  private async entradaActual(def: DefAgente): Promise<unknown> {
    const ruta = this.archivo(def);
    try {
      return entradaMcp(
        interpretarConfig(def.formato, await leerConfigAgente(ruta), ruta),
        def.seccion,
      );
    } catch {
      return undefined;
    }
  }

  private async cli(l: Lanzable, args: string[]): Promise<boolean> {
    try {
      const r = await this.d.exec(l.cmd, [...l.previos, ...args], {
        timeoutMs: PLAZO_CLI_MS,
        cwd: this.inicio(),
      });
      return r.codigo === 0;
    } catch {
      return false;
    }
  }

  /**
   * Registra el MCP de WolfCore Dev (entrada `wolfcore`). Primero con la CLI del agente; si no
   * la tiene o falla, editando su archivo (solo esa entrada). Siempre con copia previa con fecha
   * del archivo. El token va por `WOLFCORE_MCP_TOKEN`: no se escribe ni pasa por argumentos.
   */
  async registrarMcp(id: IdAgente, confirmado: true): Promise<ResultadoRegistroMcp> {
    const def = defAgente(id);
    confirmar(confirmado, `Confirme el registro del MCP en ${def.nombre}.`);
    await this.comprobarArchivo(def);
    const url = await this.d.mcp.url();
    const ahora = this.d.ahora?.() ?? new Date();
    const l = def.argsRegistrar ? await this.lanzable(def) : null;
    if (l && def.argsRegistrar) {
      const respaldo = await respaldarConfigAgente(this.archivo(def), ahora);
      if (def.argsQuitar && (await this.entradaActual(def)) !== undefined) {
        await this.cli(l, def.argsQuitar());
      }
      if (await this.cli(l, def.argsRegistrar(url))) {
        const e = await this.entradaActual(def);
        if (e && typeof e === 'object' && (e as Record<string, unknown>)['url'] === url) {
          return { respaldo, metodo: 'cli' };
        }
      }
      // La CLI no está o falló: se edita el archivo (la copia ya está hecha).
      const r = await editarConfigAgente(
        this.archivo(def),
        def.formato,
        def.seccion,
        def.entradaMcp(url),
        ahora,
      );
      return { respaldo: respaldo ?? r.respaldo, metodo: 'archivo' };
    }
    const r = await editarConfigAgente(
      this.archivo(def),
      def.formato,
      def.seccion,
      def.entradaMcp(url),
      ahora,
    );
    return { respaldo: r.respaldo, metodo: 'archivo' };
  }

  /** Quita solo la entrada `wolfcore` (CLI o archivo), con copia previa del archivo. */
  async quitarMcp(id: IdAgente, confirmado: true): Promise<ResultadoRegistroMcp> {
    const def = defAgente(id);
    confirmar(confirmado, `Confirme que quiere quitar el MCP de ${def.nombre}.`);
    await this.comprobarArchivo(def);
    const ahora = this.d.ahora?.() ?? new Date();
    if ((await this.entradaActual(def)) === undefined) return { respaldo: null, metodo: 'archivo' };
    const l = def.argsQuitar ? await this.lanzable(def) : null;
    let respaldo: string | null = null;
    if (l && def.argsQuitar) {
      respaldo = await respaldarConfigAgente(this.archivo(def), ahora);
      if ((await this.cli(l, def.argsQuitar())) && (await this.entradaActual(def)) === undefined) {
        return { respaldo, metodo: 'cli' };
      }
    }
    const r = await editarConfigAgente(
      this.archivo(def),
      def.formato,
      def.seccion,
      undefined,
      ahora,
    );
    return { respaldo: respaldo ?? r.respaldo, metodo: 'archivo' };
  }

  /**
   * Abre una terminal visible en la carpeta del proyecto con el agente. La clave del proveedor
   * (la pone el proceso principal) y el token del MCP van SOLO en el entorno de ese proceso:
   * nunca en la línea de órdenes, en archivos ni en eventos.
   */
  async abrir(
    id: IdAgente,
    sitioId: string,
    o: { proveedorIa?: string; clave?: string } = {},
  ): Promise<void> {
    const def = defAgente(id);
    const { carpeta } = await this.d.sitio(sitioId);
    const esCarpeta = await lstat(carpeta).then(
      (i) => i.isDirectory(),
      () => false,
    );
    if (!esCarpeta) {
      throw new ErrorWolf(
        'herramientas.carpeta_sitio_inexistente',
        `La carpeta del sitio no existe: ${carpeta}`,
      );
    }
    const env: Record<string, string> = {};
    if (o.proveedorIa !== undefined) {
      const p = await this.d.proveedorIa(o.proveedorIa);
      if (!o.clave) throw errorIa('ia.sin_clave');
      if (!CLAVE_VALIDA.test(o.clave)) throw errorIa('ia.clave_mal_formada');
      const vars = def.variablesClave(p, o.clave);
      if (!vars) {
        throw new ErrorWolf(
          'agentes.proveedor_incompatible',
          `${def.nombre} no puede usar ese proveedor de IA.`,
          { agente: def.nombre },
        );
      }
      Object.assign(env, vars);
    }
    const l = await this.lanzable(def);
    if (!l) {
      throw new ErrorWolf('agentes.no_instalado', `${def.nombre} no está instalado.`, {
        agente: def.nombre,
      });
    }
    env[VARIABLE_TOKEN_MCP] = await this.d.mcp.token();
    await this.d.plataforma.abrirTerminal(carpeta, { env, comando: [l.cmd, ...l.previos] });
  }

  /**
   * Propone un mensaje de commit a partir de lo preparado (`git diff --cached` filtrado: sin
   * `.env*`, claves ni binarios; como mucho 20 000 caracteres). No toca el repositorio.
   */
  async sugerirCommit(
    carpeta: string,
    cliente: ClienteIa,
    clave: string | null,
    modelo: string,
  ): Promise<string> {
    validarModeloIa(modelo);
    const d = await this.d.diffPreparado(carpeta);
    if (d.diff.trim() === '') {
      throw new ErrorWolf(
        'agentes.sin_cambios_preparados',
        'No hay cambios preparados (git add) para describir.',
      );
    }
    const r = await cliente.mensaje(clave, modelo, INSTRUCCION_COMMIT + d.diff, {
      maxTokens: MAX_TOKENS_COMMIT,
    });
    const mensaje = limpiarMensajeCommit(r.texto);
    if (!mensaje) throw errorIa('ia.respuesta_rara', { estado: '', detalle: '' });
    return mensaje;
  }

  /** `sugerirCommit` para un sitio y un proveedor por id (la clave la pone el proceso principal). */
  async sugerirCommitSitio(
    sitioId: string,
    proveedorId: string,
    clave: string | null,
    modelo: string,
  ): Promise<string> {
    const { carpeta } = await this.d.sitio(sitioId);
    const p = await this.d.proveedorIa(proveedorId);
    return this.sugerirCommit(carpeta, crearClienteIa(p, this.d.fetch), clave, modelo);
  }

  /** "Hacer commit": solo lo preparado (`git commit -F -`); nunca `add` ni `push`. */
  async commitPreparado(sitioId: string, mensaje: string): Promise<void> {
    const { carpeta } = await this.d.sitio(sitioId);
    await this.d.commitPreparado(carpeta, mensaje);
  }
}
