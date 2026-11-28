import { createHash } from 'node:crypto';
import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { AGENTES, type EstadoAgente, type IdAgente } from '../agentes/agentes';
import {
  NOMBRE_ENTRADA_MCP,
  VARIABLE_TOKEN_MCP,
  editarConfigAgente,
  editarEntradaMcp,
  entradaMcp,
  interpretarConfig,
  leerConfigAgente,
  type FormatoConfig,
  type ValorEntradaMcp,
} from '../agentes/configArchivo';
import { ErrorWolf } from '../errores';
import type { PlataformaCompleta } from '../plataforma/tipos';
import { diffLineas, type LineaDiff } from './diff';

/**
 * «Conectar asistentes»: escribe (o quita) la entrada `wolfcore` del MCP de WolfCore Dev en la
 * configuración de otros programas. Nada se escribe sin una vista previa confirmada, el token
 * nunca queda en esos archivos (va por la variable `WOLFCORE_MCP_TOKEN`) y el servidor MCP sigue
 * escuchando solo en 127.0.0.1.
 */
export type IdAsistente =
  'claude-code' | 'codex' | 'opencode' | 'copilot-cli' | 'cursor' | 'claude-desktop';

export const IDS_ASISTENTE: readonly IdAsistente[] = [
  'claude-code',
  'codex',
  'opencode',
  'copilot-cli',
  'cursor',
  'claude-desktop',
];

export type AccionAsistente = 'conectar' | 'quitar';
export type EstadoConexion = 'conectado' | 'instalado' | 'no-instalado';
export type AvisoVistaPrevia = 'comentarios_perdidos';

/** Motivo por el que un cliente no se puede conectar todavía. */
export type MotivoIncompatible = 'solo_servidores_locales';

export interface EstadoAsistente {
  id: IdAsistente;
  nombre: string;
  estado: EstadoConexion;
  compatible: boolean;
  motivo?: MotivoIncompatible;
  /** Archivo de configuración que se tocaría (se muestra; la interfaz nunca lo recibe de vuelta). */
  archivoConfig: string;
  formato: FormatoConfig;
  /** Variable de entorno de la que el cliente toma el token (null: no usa token). */
  variable: string | null;
}

export interface VistaPrevia {
  accion: AccionAsistente;
  archivoConfig: string;
  existeArchivo: boolean;
  sinCambios: boolean;
  /** Solo las líneas que cambian y su contexto. El token nunca aparece. */
  lineas: LineaDiff[];
  avisos: AvisoVistaPrevia[];
  variable: string | null;
  /** Huella del resultado: `aplicar` la exige para escribir exactamente lo que se mostró. */
  huella: string;
}

export interface ResultadoAplicarAsistente {
  respaldo: string | null;
  cambiado: boolean;
  /** El archivo traía el token escrito: la copia lo lleva enmascarado (`***`). */
  tokenEscrito?: boolean;
}

export interface DepsAsistentes {
  plataforma: Pick<
    PlataformaCompleta,
    'carpetaInicio' | 'carpetaConfigApps' | 'buscarEjecutable' | 'nombreEjecutable'
  >;
  agentes: { estado(): Promise<Pick<EstadoAgente, 'id' | 'instalado'>[]> };
  mcp: { url(): Promise<string>; token(): Promise<string> };
  ahora?: () => Date;
}

interface DefAsistente {
  id: IdAsistente;
  nombre: string;
  /** Agente de `agentes/` del que sale el detalle de su configuración. */
  agente?: IdAgente;
  formato: FormatoConfig;
  seccion: string;
  archivo(d: DepsAsistentes['plataforma']): string;
  /** Carpeta de configuración (lista blanca para «Abrir carpeta»). */
  carpeta(d: DepsAsistentes['plataforma']): string;
  /** Otros archivos donde puede estar el registro (solo lectura). */
  extras?(d: DepsAsistentes['plataforma']): string[];
  /** null: no se puede conectar todavía. */
  entrada(url: string): ValorEntradaMcp | null;
  motivo?: MotivoIncompatible;
  /** Ejecutables que delatan la instalación (además de la carpeta de configuración). */
  ejecutables?: string[];
}

function deAgente(
  id: IdAgente,
  carpeta: (inicio: string) => string,
): Pick<
  DefAsistente,
  'agente' | 'formato' | 'seccion' | 'archivo' | 'extras' | 'entrada' | 'carpeta'
> {
  const def = AGENTES[id];
  return {
    agente: id,
    formato: def.formato,
    seccion: def.seccion,
    archivo: (p) => def.archivoConfig(p.carpetaInicio()),
    ...(def.archivosConfigExtra
      ? { extras: (p: DepsAsistentes['plataforma']) => def.archivosConfigExtra!(p.carpetaInicio()) }
      : {}),
    entrada: (url) => def.entradaMcp(url),
    carpeta: (p) => carpeta(p.carpetaInicio()),
  };
}

const DEFS: Record<IdAsistente, DefAsistente> = {
  'claude-code': {
    id: 'claude-code',
    nombre: 'Claude Code',
    ...deAgente('claude-code', (i) => path.join(i, '.claude')),
  },
  codex: {
    id: 'codex',
    nombre: 'Codex',
    ...deAgente('codex', (i) => path.join(i, '.codex')),
  },
  opencode: {
    id: 'opencode',
    nombre: 'opencode',
    ...deAgente('opencode', (i) => path.join(i, '.config', 'opencode')),
  },
  'copilot-cli': {
    id: 'copilot-cli',
    nombre: 'GitHub Copilot CLI',
    ...deAgente('copilot-cli', (i) => path.join(i, '.copilot')),
  },
  cursor: {
    id: 'cursor',
    nombre: 'Cursor',
    formato: 'json',
    seccion: 'mcpServers',
    archivo: (p) => path.join(p.carpetaInicio(), '.cursor', 'mcp.json'),
    carpeta: (p) => path.join(p.carpetaInicio(), '.cursor'),
    // Cursor expande `${env:NOMBRE}` en `url` y `headers`: el token no queda escrito.
    entrada: (url) => ({
      url,
      headers: { Authorization: `Bearer \${env:${VARIABLE_TOKEN_MCP}}` },
    }),
    ejecutables: ['cursor'],
  },
  'claude-desktop': {
    id: 'claude-desktop',
    nombre: 'Claude Desktop',
    formato: 'json',
    seccion: 'mcpServers',
    archivo: (p) => path.join(p.carpetaConfigApps(), 'Claude', 'claude_desktop_config.json'),
    carpeta: (p) => path.join(p.carpetaConfigApps(), 'Claude'),
    // Su archivo solo admite servidores locales (`command`): sin una variable de entorno para
    // cabeceras ni un lanzador propio de WolfCore Dev, no hay forma de conectarlo sin escribir
    // el token en claro (prohibido).
    entrada: () => null,
    motivo: 'solo_servidores_locales',
  },
};

const sha = (t: string): string => createHash('sha256').update(t, 'utf8').digest('hex');

async function infoLstat(ruta: string) {
  return lstat(ruta).catch((e: NodeJS.ErrnoException) =>
    e.code === 'ENOENT' || e.code === 'ENOTDIR' ? null : Promise.reject(e),
  );
}

/** Líneas con comentario (`#` o `//`) de un texto, sin espacios alrededor. */
function comentarios(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('#') || l.startsWith('//'));
}

export class Asistentes {
  constructor(private readonly d: DepsAsistentes) {}

  private def(id: string): DefAsistente {
    if (!(IDS_ASISTENTE as readonly string[]).includes(id)) {
      throw new ErrorWolf('asistentes.no_existe', 'Ese asistente no está soportado.');
    }
    return DEFS[id as IdAsistente];
  }

  private async existe(ruta: string): Promise<boolean> {
    return (await infoLstat(ruta).catch(() => null)) !== null;
  }

  private async instalado(def: DefAsistente, deAgentes: Set<string>): Promise<boolean> {
    if (deAgentes.has(def.id)) return true;
    const p = this.d.plataforma;
    if ((await this.existe(def.carpeta(p))) || (await this.existe(def.archivo(p)))) return true;
    for (const exe of def.ejecutables ?? []) {
      if (await p.buscarEjecutable(exe).catch(() => null)) return true;
    }
    return false;
  }

  private async instaladosPorAgentes(): Promise<Set<string>> {
    try {
      return new Set((await this.d.agentes.estado()).filter((a) => a.instalado).map((a) => a.id));
    } catch {
      return new Set();
    }
  }

  /** Hay una entrada `wolfcore` en alguno de sus archivos (los que no se entienden no cuentan). */
  private async conectado(def: DefAsistente): Promise<boolean> {
    const p = this.d.plataforma;
    for (const ruta of [def.archivo(p), ...(def.extras?.(p) ?? [])]) {
      try {
        const obj = interpretarConfig(def.formato, await leerConfigAgente(ruta), ruta);
        if (entradaMcp(obj, def.seccion) !== undefined) return true;
      } catch {
        // no cuenta
      }
    }
    return false;
  }

  async estado(): Promise<EstadoAsistente[]> {
    const deAgentes = await this.instaladosPorAgentes();
    return Promise.all(
      IDS_ASISTENTE.map(async (id) => {
        const def = DEFS[id];
        const instalado = await this.instalado(def, deAgentes);
        const estado: EstadoConexion = !instalado
          ? 'no-instalado'
          : (await this.conectado(def))
            ? 'conectado'
            : 'instalado';
        const compatible = def.entrada('') !== null;
        return {
          id,
          nombre: def.nombre,
          estado,
          compatible,
          ...(def.motivo && !compatible ? { motivo: def.motivo } : {}),
          archivoConfig: def.archivo(this.d.plataforma),
          formato: def.formato,
          variable: compatible ? VARIABLE_TOKEN_MCP : null,
        };
      }),
    );
  }

  /** Se rechazan enlaces simbólicos y uniones en el archivo y en su carpeta de configuración. */
  private async sinEnlaces(def: DefAsistente): Promise<void> {
    const p = this.d.plataforma;
    const archivo = def.archivo(p);
    const rutas = [def.carpeta(p), archivo];
    for (const ruta of rutas) {
      const i = await infoLstat(ruta);
      if (i?.isSymbolicLink()) {
        throw new ErrorWolf(
          'asistentes.enlace_rechazado',
          `${path.basename(ruta)} es un enlace: no se modifica.`,
          { archivo: path.basename(ruta) },
        );
      }
    }
  }

  /** Lo común de la vista previa y de aplicar: el texto nuevo, calculado en memoria. */
  private async calcular(id: string, accion: AccionAsistente) {
    const def = this.def(id);
    const p = this.d.plataforma;
    const url = await this.d.mcp.url();
    const valor = def.entrada(url);
    if (accion === 'conectar' && valor === null) {
      throw new ErrorWolf(
        'asistentes.no_compatible',
        `${def.nombre} todavía no se puede conectar.`,
        { asistente: def.nombre },
      );
    }
    const deAgentes = await this.instaladosPorAgentes();
    if (!(await this.instalado(def, deAgentes))) {
      throw new ErrorWolf('asistentes.no_instalado', `${def.nombre} no está instalado.`, {
        asistente: def.nombre,
      });
    }
    await this.sinEnlaces(def);
    const archivo = def.archivo(p);
    const crudo = await leerConfigAgente(archivo);
    const nuevo = editarEntradaMcp(
      def.formato,
      crudo,
      def.seccion,
      accion === 'conectar' ? (valor ?? undefined) : undefined,
      archivo,
    );
    const antes = crudo ?? '';
    const token = await this.d.mcp.token();
    const oculto = (t: string): string => (token.length >= 8 ? t.split(token).join('***') : t);
    const perdidos = comentarios(antes).filter((c) => !comentarios(nuevo).includes(c));
    return { def, archivo, crudo, antes, nuevo, oculto, perdidos, token };
  }

  async vistaPrevia(id: IdAsistente, accion: AccionAsistente): Promise<VistaPrevia> {
    const c = await this.calcular(id, accion);
    return {
      accion,
      archivoConfig: c.archivo,
      existeArchivo: c.crudo !== null,
      sinCambios: c.crudo === null ? accion === 'quitar' : c.antes === c.nuevo,
      lineas: diffLineas(c.oculto(c.antes), c.oculto(c.nuevo)),
      avisos: c.perdidos.length > 0 ? ['comentarios_perdidos'] : [],
      variable: c.def.entrada('x') === null ? null : VARIABLE_TOKEN_MCP,
      huella: sha(c.nuevo),
    };
  }

  /** Escribe lo que mostró la vista previa (`huella`) tras la confirmación explícita. */
  async aplicar(
    id: IdAsistente,
    accion: AccionAsistente,
    huella: string,
    confirmado: true,
  ): Promise<ResultadoAplicarAsistente> {
    if (confirmado !== true) {
      throw new ErrorWolf(
        'agentes.sin_confirmar',
        'Confirme la acción en el diálogo antes de continuar.',
      );
    }
    const c = await this.calcular(id, accion);
    if (sha(c.nuevo) !== huella) {
      throw new ErrorWolf(
        'asistentes.vista_desfasada',
        'El archivo cambió desde la vista previa: revísela de nuevo.',
      );
    }
    const secreto = c.token.length >= 8 && c.antes.includes(c.token) ? c.token : undefined;
    const valor =
      accion === 'conectar' ? (c.def.entrada(await this.d.mcp.url()) ?? undefined) : undefined;
    const r = await editarConfigAgente(
      c.archivo,
      c.def.formato,
      c.def.seccion,
      valor,
      this.d.ahora?.(),
      {},
      secreto,
    );
    return { ...r, ...(secreto ? { tokenEscrito: true } : {}) };
  }

  /** Fragmento para copiar a mano: lleva la variable del token, nunca el token. */
  async configuracion(id: IdAsistente): Promise<string> {
    const def = this.def(id);
    const valor = def.entrada(await this.d.mcp.url());
    if (valor === null) {
      throw new ErrorWolf(
        'asistentes.no_compatible',
        `${def.nombre} todavía no se puede conectar.`,
        { asistente: def.nombre },
      );
    }
    const texto = editarEntradaMcp(
      def.formato,
      null,
      def.seccion,
      valor,
      def.archivo(this.d.plataforma),
    );
    return texto.endsWith('\n') ? texto : `${texto}\n`;
  }

  /** Carpeta de configuración del cliente (solo las de la lista blanca, y que existan). */
  async carpetaConfig(id: IdAsistente): Promise<string> {
    const def = this.def(id);
    const carpeta = def.carpeta(this.d.plataforma);
    const i = await infoLstat(carpeta);
    if (!i?.isDirectory() || i.isSymbolicLink()) {
      throw new ErrorWolf(
        'asistentes.sin_carpeta',
        `La carpeta de configuración de ${def.nombre} no existe.`,
        { asistente: def.nombre },
      );
    }
    return carpeta;
  }
}

export { NOMBRE_ENTRADA_MCP };
