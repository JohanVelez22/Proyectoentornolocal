import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { AGENTES, type EstadoAgente, type IdAgente } from '../agentes/agentes';
import {
  NOMBRE_ENTRADA_MCP,
  VARIABLE_TOKEN_MCP,
  calcularEdicion,
  editarConfigAgente,
  editarEntradaMcp,
  entradaMcp,
  exigirSinEnlaces,
  interpretarConfig,
  leerConfigAgente,
  mezclaFinales,
  type FormatoConfig,
  type MotivoIlegible,
  type ValorEntradaMcp,
} from '../agentes/configArchivo';
import { ErrorWolf, esErrorWolf } from '../errores';
import type { PlataformaCompleta } from '../plataforma/tipos';
import { diffLineas, enmascararLinea, type LineaDiff } from './diff';

/**
 * «Conectar asistentes»: escribe (o quita) la entrada `wolfcore` del MCP de WolfCore Dev en la
 * configuración de otros programas. Nada se escribe sin una vista previa confirmada, el token
 * nunca queda en esos archivos (va por la variable `WOLFCORE_MCP_TOKEN`) y el servidor MCP sigue
 * escuchando solo en 127.0.0.1.
 */
export type IdAsistente =
  | 'claude-code'
  | 'codex'
  | 'opencode'
  | 'copilot-cli'
  | 'hermes'
  | 'gemini-cli'
  | 'qwen-code'
  | 'cursor'
  | 'claude-desktop';

export const IDS_ASISTENTE: readonly IdAsistente[] = [
  'claude-code',
  'codex',
  'opencode',
  'copilot-cli',
  'hermes',
  'gemini-cli',
  'qwen-code',
  'cursor',
  'claude-desktop',
];

export type AccionAsistente = 'conectar' | 'quitar';
/**
 * «conectado» solo dice que la entrada está en su configuración, no que funcione: el token existe
 * únicamente en los procesos que abre WolfCore Dev. «ilegible»: su configuración no se pudo leer.
 */
export type EstadoConexion = 'conectado' | 'instalado' | 'no-instalado' | 'ilegible';
export type AvisoVistaPrevia = 'comentarios_perdidos' | 'finales_mezclados';

/**
 * Motivo por el que un cliente no se puede conectar todavía: solo admite servidores locales (su
 * archivo obligaría a guardar el token en claro) o es una aplicación gráfica que IA › Agentes no
 * sabe abrir con el token.
 */
export type MotivoIncompatible = 'solo_servidores_locales' | 'app_grafica';

export interface EstadoAsistente {
  id: IdAsistente;
  nombre: string;
  estado: EstadoConexion;
  /** Hay una entrada que escribirle (falso: no admite una entrada sin guardar el token). */
  compatible: boolean;
  /** «Conectar» está permitido (falso con un `motivo`; «Quitar» siempre lo está). */
  conectable: boolean;
  motivo?: MotivoIncompatible;
  /** Con `estado: 'ilegible'`: por qué no se pudo leer. */
  motivoIlegible?: MotivoIlegible;
  /**
   * Archivo de configuración que se tocaría (se muestra; la interfaz nunca lo recibe de vuelta).
   * Si la entrada está en un archivo alterno (`opencode.jsonc`), ese.
   */
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
  /**
   * El archivo traía el token escrito: la copia lo lleva enmascarado (`***`) y el archivo ya no
   * lo tiene.
   */
  tokenEscrito?: boolean;
  /**
   * El token sigue escrito en otra parte del archivo (p. ej. `projects…`): ahí no se toca y hay
   * que borrarlo a mano. Indica dónde, nunca el token.
   */
  tokenSigueEn?: string;
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
  /** Carpeta desde la que no se admite ningún enlace hasta el archivo (por omisión, el inicio). */
  raiz?(d: DepsAsistentes['plataforma']): string;
  /**
   * Sección de la V2 (`mcp.servers` de opencode): si la tabla existe, la entrada va ahí. La
   * clásica (`mcp`) sigue valiendo si la V2 no está.
   */
  seccionAlterna?: string;
  /**
   * La huella de la vista previa cubre solo la entrada `wolfcore` (Claude Code reescribe su
   * archivo a menudo): lo ajeno que cambie no provoca una vista desfasada, pero se comprueba que
   * lo ajeno no se altere al escribir.
   */
  huellaSoloEntrada?: boolean;
  /** null: no se puede conectar todavía. */
  entrada(url: string): ValorEntradaMcp | null;
  /** Presente: «Conectar» queda desactivado por ese motivo. */
  motivo?: MotivoIncompatible;
  /** Ejecutables que delatan la instalación (además de la carpeta de configuración). */
  ejecutables?: string[];
}

function deAgente(
  id: IdAgente,
  carpeta: (inicio: string) => string,
): Pick<
  DefAsistente,
  'agente' | 'formato' | 'seccion' | 'seccionAlterna' | 'archivo' | 'extras' | 'entrada' | 'carpeta'
> {
  const def = AGENTES[id];
  return {
    agente: id,
    formato: def.formato,
    seccion: def.seccion,
    ...(def.seccionAlterna ? { seccionAlterna: def.seccionAlterna } : {}),
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
    // `~/.claude.json` lo reescribe Claude Code con frecuencia (historial, proyectos): la huella
    // cubre solo la entrada `wolfcore` y su vista previa; que lo ajeno no se altere lo
    // comprueba `editarEntradaMcp`. Su carpeta real es `~`, no `~/.claude`.
    huellaSoloEntrada: true,
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
    // V2: si el archivo trae `mcp.servers`, la entrada va en `mcp.servers.wolfcore`; si no, en
    // `mcp.wolfcore` (V1, la del paquete `opencode-ai` actual). Ver `OPENCODE.seccionAlterna`.
  },
  'copilot-cli': {
    id: 'copilot-cli',
    nombre: 'GitHub Copilot CLI',
    ...deAgente('copilot-cli', (i) => path.join(i, '.copilot')),
  },
  hermes: {
    id: 'hermes',
    nombre: 'Hermes Agent',
    ...deAgente('hermes', (i) => path.join(i, '.hermes')),
  },
  'gemini-cli': {
    id: 'gemini-cli',
    nombre: 'Gemini CLI',
    ...deAgente('gemini-cli', (i) => path.join(i, '.gemini')),
  },
  'qwen-code': {
    id: 'qwen-code',
    nombre: 'Qwen Code',
    ...deAgente('qwen-code', (i) => path.join(i, '.qwen')),
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
    // Aplicación gráfica: el token solo existe en lo que abre WolfCore Dev y IA › Agentes no sabe
    // abrir Cursor con él, así que conectarlo no serviría de nada. «Quitar» sigue permitido.
    motivo: 'app_grafica',
  },
  'claude-desktop': {
    id: 'claude-desktop',
    nombre: 'Claude Desktop',
    formato: 'json',
    seccion: 'mcpServers',
    archivo: (p) => path.join(p.carpetaConfigApps(), 'Claude', 'claude_desktop_config.json'),
    carpeta: (p) => path.join(p.carpetaConfigApps(), 'Claude'),
    raiz: (p) => p.carpetaConfigApps(),
    // Su archivo solo admite servidores locales (`command`): sin una variable de entorno para
    // cabeceras ni un lanzador propio de WolfCore Dev, no hay forma de conectarlo sin escribir
    // el token en claro (prohibido).
    entrada: () => null,
    motivo: 'solo_servidores_locales',
  },
};

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

/** Motivo de un archivo que no se pudo leer, a partir del error. */
function motivoIlegible(e: unknown): MotivoIlegible {
  if (esErrorWolf(e) && e.codigo === 'agentes.config_ilegible') {
    return e.datos?.['motivo'] === 'demasiado_grande' ? 'demasiado_grande' : 'invalido';
  }
  return 'sin_acceso';
}

/**
 * Dónde está el token dentro del archivo (sin mostrarlo): la primera clave de la ruta, con «…» si
 * hay más niveles (`projects…`). Si el archivo no se puede recorrer, una indicación general.
 */
function dondeEstaElToken(
  formato: FormatoConfig,
  texto: string,
  ruta: string,
  token: string,
): string {
  const buscar = (v: unknown, camino: string[]): string[] | null => {
    if (typeof v === 'string') return v.includes(token) ? camino : null;
    if (v === null || typeof v !== 'object') return null;
    const pares = Array.isArray(v)
      ? v.map((x, i) => [String(i), x] as const)
      : Object.entries(v as Record<string, unknown>);
    for (const [k, x] of pares) {
      if (k.includes(token)) return camino;
      const r = buscar(x, [...camino, k]);
      if (r) return r;
    }
    return null;
  };
  try {
    const camino = buscar(interpretarConfig(formato, texto, ruta), []);
    if (!camino || camino.length === 0) return '…';
    return camino.length > 1 ? `${camino[0]!}…` : camino[0]!;
  } catch {
    return '…';
  }
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

  /**
   * Dónde está el registro: el primer archivo (el principal o uno alterno, como
   * `opencode.jsonc`) con una entrada `wolfcore`. Si no hay ninguna, el principal. Solo el
   * principal puede dejar el estado «ilegible»: un alterno que no se entiende no cuenta.
   */
  private async localizar(
    def: DefAsistente,
  ): Promise<{ archivo: string; conectado: boolean; ilegible?: MotivoIlegible }> {
    const p = this.d.plataforma;
    const principal = def.archivo(p);
    let ilegible: MotivoIlegible | undefined;
    for (const ruta of [principal, ...(def.extras?.(p) ?? [])]) {
      try {
        const obj = interpretarConfig(def.formato, await leerConfigAgente(ruta), ruta);
        const esta =
          entradaMcp(obj, def.seccion) !== undefined ||
          (def.seccionAlterna !== undefined && entradaMcp(obj, def.seccionAlterna) !== undefined);
        if (esta) return { archivo: ruta, conectado: true };
      } catch (e) {
        if (ruta === principal) ilegible = motivoIlegible(e);
      }
    }
    return { archivo: principal, conectado: false, ...(ilegible ? { ilegible } : {}) };
  }

  async estado(): Promise<EstadoAsistente[]> {
    const deAgentes = await this.instaladosPorAgentes();
    return Promise.all(
      IDS_ASISTENTE.map(async (id) => {
        const def = DEFS[id];
        const instalado = await this.instalado(def, deAgentes);
        const loc = await this.localizar(def);
        const estado: EstadoConexion = !instalado
          ? 'no-instalado'
          : loc.conectado
            ? 'conectado'
            : loc.ilegible
              ? 'ilegible'
              : 'instalado';
        const compatible = def.entrada('') !== null;
        return {
          id,
          nombre: def.nombre,
          estado,
          compatible,
          conectable: compatible && def.motivo === undefined,
          ...(def.motivo ? { motivo: def.motivo } : {}),
          ...(estado === 'ilegible' && loc.ilegible ? { motivoIlegible: loc.ilegible } : {}),
          archivoConfig: loc.archivo,
          formato: def.formato,
          variable: compatible ? VARIABLE_TOKEN_MCP : null,
        };
      }),
    );
  }

  /**
   * Se rechazan enlaces simbólicos y uniones en cada componente desde la carpeta de inicio (o la
   * de configuración de apps) hasta el archivo, también en las carpetas intermedias.
   */
  private async sinEnlaces(def: DefAsistente, archivo: string): Promise<void> {
    const raiz = def.raiz ? def.raiz(this.d.plataforma) : this.d.plataforma.carpetaInicio();
    await exigirSinEnlaces(raiz, archivo);
  }

  /** Lo común de la vista previa y de aplicar: el texto nuevo, calculado en memoria. */
  private async calcular(id: string, accion: AccionAsistente) {
    const def = this.def(id);
    const url = await this.d.mcp.url();
    const valor = def.entrada(url);
    if (accion === 'conectar' && (valor === null || def.motivo !== undefined)) {
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
    const { archivo } = await this.localizar(def);
    await this.sinEnlaces(def, archivo);
    const crudo = await leerConfigAgente(archivo, { rechazarEnlaces: true });
    const opciones = {
      ...(def.seccionAlterna ? { seccionAlterna: def.seccionAlterna } : {}),
      ...(def.huellaSoloEntrada ? { huellaSoloEntrada: true } : {}),
    };
    const calculo = calcularEdicion(
      def.formato,
      crudo,
      def.seccion,
      accion === 'conectar' ? (valor ?? undefined) : undefined,
      archivo,
      opciones,
    );
    const nuevo = calculo.nuevo;
    const antes = crudo ?? '';
    const token = await this.d.mcp.token();
    const oculto = (t: string): string => (token.length >= 8 ? t.split(token).join('***') : t);
    const perdidos = comentarios(antes).filter((c) => !comentarios(nuevo).includes(c));
    return { def, archivo, crudo, antes, nuevo, oculto, perdidos, token, calculo, opciones };
  }

  async vistaPrevia(id: IdAsistente, accion: AccionAsistente): Promise<VistaPrevia> {
    const c = await this.calcular(id, accion);
    const avisos: AvisoVistaPrevia[] = [];
    if (c.perdidos.length > 0) avisos.push('comentarios_perdidos');
    // YAML se reserializa entero: unos finales de línea mezclados quedarían todos iguales.
    if (c.def.formato === 'yaml' && mezclaFinales(c.antes)) avisos.push('finales_mezclados');
    return {
      accion,
      archivoConfig: c.archivo,
      existeArchivo: c.crudo !== null,
      sinCambios: c.crudo === null ? accion === 'quitar' : c.antes === c.nuevo,
      // Se compara el texto real y se enmascara lo que se muestra: nada sensible llega a la
      // pantalla, ni el token de WolfCore Dev ni los secretos de otros servidores del archivo.
      lineas: diffLineas(c.oculto(c.antes), c.oculto(c.nuevo)).map((l) =>
        l.tipo === 'omitido' ? l : { ...l, texto: enmascararLinea(l.texto) },
      ),
      avisos,
      variable: c.def.entrada('x') === null ? null : VARIABLE_TOKEN_MCP,
      huella: c.calculo.huella,
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
    if (c.calculo.huella !== huella) {
      throw new ErrorWolf(
        'asistentes.vista_desfasada',
        'El archivo cambió desde la vista previa: revísela de nuevo.',
      );
    }
    const secreto = c.token.length >= 8 && c.antes.includes(c.token) ? c.token : undefined;
    const valor =
      accion === 'conectar' ? (c.def.entrada(await this.d.mcp.url()) ?? undefined) : undefined;
    const raiz = c.def.raiz ? c.def.raiz(this.d.plataforma) : this.d.plataforma.carpetaInicio();
    const r = await editarConfigAgente(
      c.archivo,
      c.def.formato,
      c.def.seccion,
      valor,
      this.d.ahora?.(),
      {},
      secreto,
      { ...c.opciones, rechazarEnlaces: true, raizSinEnlaces: raiz, huellaEsperada: huella },
    );
    if (secreto === undefined) return r;
    // Solo se avisa de «ya no lo tiene» si es verdad: el token puede seguir en otra parte del
    // archivo (p. ej. en el historial de un proyecto), donde no se toca.
    const despues = await leerConfigAgente(c.archivo).catch(() => null);
    if (despues !== null && despues.includes(secreto)) {
      return {
        ...r,
        tokenSigueEn: dondeEstaElToken(c.def.formato, despues, c.archivo, secreto),
      };
    }
    return { ...r, tokenEscrito: true };
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
