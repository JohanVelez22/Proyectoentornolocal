import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  CLAVES_RAPIDAS,
  ACCIONES_CONTENEDOR,
  esMotorContenedores,
  validarIdContenedor,
  type AccionContenedor,
  type MotorContenedores,
  datosPermitidos,
  esClaveCorta,
  type OpcionesBusqueda,
  ErrorWolf,
  IDS_REVISION,
  type IdRevision,
  TIPOS_AVISO,
  type TipoAviso,
  PasoRecetaSchema,
  generarClaveBd,
  quitarClave,
  SNIPPETS_NGINX,
  validarUrlGit,
  type CambiosCaptura,
  type CambiosPreferenciasUi,
  type Nucleo,
  type OpcionesReceta,
  type PreferenciasUi,
  PRESETS_SMTP,
  LIMITES_IMAGEN,
  FORMATOS_CONVERSOR,
  MODOS_MEMORIA,
  MAX_ACCIONES_MEMORIA,
  MAX_LARGO_ID_MEMORIA,
} from '@pel/core';
import { idiomaDeLocale } from '../shared/idiomas';
import type { ResultadoAtajo } from '../shared/captura';
import type { ServicioCaptura } from './captura';
import { SECRETOS_NO_DISPONIBLES, type AlmacenSecretos } from './secretos';
import {
  CANAL_EVENTO,
  EVENTOS_IPC,
  PREFIJO_CANAL,
  type ApiSistema,
  type DatosError,
  type ProveedorIaPublico,
  type ProveedorSmtpPublico,
  type ResultadoIpc,
  type RutaIpc,
} from '../shared/api';
import {
  archivoExistente,
  booleano,
  claveEnv,
  nombreCopiaEnv,
  opcionesEnv,
  huellaEnvPedida,
  pedidoEnv,
  carpetaExistente,
  claveIa,
  claveSmtp,
  eleccionTunel,
  tunelConfirmado,
  proveedorTunelConToken,
  tokenTunel,
  datosProveedorSmtp,
  destinatarioPrueba,
  idProveedorSmtp,
  modoCorreoSitio,
  opcionesEnvSmtp,
  opcionesGuardarSmtp,
  confirmadoAgente,
  configProveedorIa,
  idAgente,
  idSitioAgente,
  mensajeCommit,
  idProveedorIa,
  idSitioIa,
  activaExtension,
  nombreExtensionPhp,
  ajustesPhpSitio,
  idSitioPhp,
  activaDepuracion,
  confirmacionDepuracion,
  filtroDumps,
  idDump,
  idSitioDepuracion,
  filtroErrores,
  huellaErrorIpc,
  archivoEditor,
  lineaEditor,
  xdebugSitio,
  cambioVhost,
  idSitioNginx,
  versionVhost,
  ramaPhpIni,
  respaldoIni,
  textoIni,
  valoresRapidos,
  modeloIa,
  opcionesBorrarClaveIa,
  opcionesEnvIa,
  acotadoJson,
  enteroEn,
  idCorto,
  idCaptador,
  idNoVacio,
  idEditor,
  idTerminal,
  bytesAcotados,
  listaTextos,
  MAX_BYTES_RECETA,
  MAX_PASOS_RECETA,
  pid,
  rutaAbsoluta,
  tipoRuntime,
  validarPedidoProyecto,
  validarExportarPerfil,
  validarVistaPreviaPerfil,
  validarAbrirEditor,
  validarGuardarEditor,
  validarImportarPerfil,
  opcionesPlantilla,
  idPlantilla,
  idsImportar,
  opcionesImportar,
  versionWordpress,
  idServicioDatos,
  idWorkspace,
  idSitioTarea,
  idTarea,
  huellaDeTarea,
  motorBd,
  nombreBase,
  nombreModelo,
  objetoPlano,
  modoCaptura,
  puertoHttps,
  puertoUsuario,
  ramaPhp,
  RutasElegidas,
  servicioDelCatalogo,
  filtroVersiones,
  servicioInstalable,
  texto,
  textoAcotado,
  textoLibre,
  tipoProyecto,
  urlAbrible,
  herramientaBd,
  servicioVersiones,
  seleccionLimpieza,
  idPapeleraVersion,
  destinoLimpieza,
  versionCatalogo,
  idInstanciaIpc,
  objetivoBd,
  objetivoSql,
  opcionesActualizar,
  opcionesNuevaRama,
  opcionesDesbloquear,
  refRespaldoDatos,
  confirmadoBorrar,
  confirmadoVolver,
  opcionesVolver,
  idInstantanea,
  seleccionAuditoria,
  usuarioAuditoria,
  claveNuevaAuditoria,
  confirmadoRestablecer,
  ipv4,
  unoDe,
} from './validacion';

type MotorBdIpc = ReturnType<typeof motorBd>;

/** Contenido de un .env (con saltos de línea), hasta 256 KiB. */
function textoAcotadoEnv(v: unknown): string {
  const t = texto(v, 'envActual');
  if (t.length > 256 * 1024) throw new Error('Argumento no válido: envActual');
  return t;
}

/** Solo `confirmarSobrescribir` (booleano) llega al núcleo. */
function opcionesRestaurar(v: unknown): { confirmarSobrescribir?: boolean } | undefined {
  if (v === undefined) return undefined;
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  return o['confirmarSobrescribir'] === undefined
    ? {}
    : { confirmarSobrescribir: booleano(o['confirmarSobrescribir'], 'confirmarSobrescribir') };
}

/** Usuario y clave opcionales al crear una base (no aplica a MongoDB). */
function opcionesCrear(
  motor: MotorBdIpc,
  v: unknown,
): { usuario?: string; clave?: string; cambiarClave?: boolean } | undefined {
  if (v === undefined) return undefined;
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  if (
    motor === 'mongodb' &&
    (o['usuario'] !== undefined || o['clave'] !== undefined || o['cambiarClave'] !== undefined)
  ) {
    throw new Error('Argumento no válido: opciones');
  }
  if (o['cambiarClave'] !== undefined && typeof o['cambiarClave'] !== 'boolean') {
    throw new Error('Argumento no válido: cambiarClave');
  }
  return {
    ...(o['usuario'] === undefined ? {} : { usuario: nombreBase(motor, o['usuario'], 'usuario') }),
    ...(o['clave'] === undefined ? {} : { clave: textoAcotado(o['clave'], 1, 128, 'clave') }),
    ...(o['cambiarClave'] === true ? { cambiarClave: true } : {}),
  };
}

/** Servidor de origen de una importación; los errores nunca repiten la clave. */
function origenImportar(v: unknown): {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  base: string;
} {
  const o = objetoPlano<Record<string, unknown>>(v, 'origen');
  return {
    host: textoAcotado(o['host'], 1, 253, 'servidor de origen'),
    puerto: enteroEn(o['puerto'], 1, 65535, 'puerto de origen'),
    usuario: textoAcotado(o['usuario'], 1, 128, 'usuario de origen'),
    clave: textoAcotado(o['clave'], 0, 1024, 'clave de origen'),
    base: textoAcotado(o['base'], 1, 64, 'base de origen'),
  };
}

/**
 * Ejecuta `fn` y, si falla, quita `clave` del mensaje (nunca debe volver al renderer). Por
 * defecto la quita en cualquier sitio; las claves de IA usan `quitarClave` (las cortas solo
 * como palabra suelta).
 */
async function sinClave<T>(
  clave: string,
  fn: () => Promise<T>,
  quitar: (t: string, clave: string) => string = (t, c) => t.split(c).join('***'),
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    const codigo = (e as { codigo?: unknown } | null)?.codigo;
    const limpiar = (t: string): string => (clave ? quitar(t, clave) : t);
    const previo = (e as { respaldoPrevio?: unknown } | null)?.respaldoPrevio;
    if (e instanceof ErrorWolf) {
      // Sus datos ya salen por la lista blanca; se limpian igual por si llevaran la clave.
      const datos = Object.fromEntries(
        Object.entries(e.datos ?? {}).map(([k, v]) => [k, typeof v === 'string' ? limpiar(v) : v]),
      );
      throw new ErrorWolf(e.codigo, limpiar(mensaje), datos);
    }
    throw Object.assign(
      new Error(limpiar(mensaje)),
      typeof codigo === 'string' ? { codigo } : {},
      typeof previo === 'string' ? { respaldoPrevio: limpiar(previo) } : {},
    );
  }
}

export interface IpcMainLike {
  handle(canal: string, fn: (evento: unknown, ...args: unknown[]) => unknown): void;
}

export interface VentanaLike {
  isDestroyed(): boolean;
  webContents: { send(canal: string, ...args: unknown[]): void };
}

export type NucleoIpc = Nucleo;

/** Lo que usa el IPC del almacén de secretos (nunca devuelve un secreto al renderer). */
export type SecretosIpc = Pick<
  AlmacenSecretos,
  | 'guardar'
  | 'leer'
  | 'borrar'
  | 'hay'
  | 'estado'
  | 'guardarTokenGithub'
  | 'leerTokenGithub'
  | 'borrarTokenGithub'
  | 'hayTokenGithub'
  | 'disponible'
>;

/**
 * Muestreo de métricas: corre solo si la interfaz lo pidió (Inicio abierto) Y la ventana está
 * visible. Ocultar o minimizar la ventana lo pausa; mostrarla lo reanuda si seguía pedido.
 */
export class ControlMetricas {
  private pedido = false;
  private visible = true;

  constructor(private readonly m: Pick<Nucleo, 'iniciarMetricas' | 'pausarMetricas'>) {}

  iniciar(): void {
    this.pedido = true;
    this.aplicar();
  }

  pausar(): void {
    this.pedido = false;
    this.aplicar();
  }

  /** La ventana se mostró (true) u ocultó/minimizó (false). */
  visibilidad(visible: boolean): void {
    this.visible = visible;
    this.aplicar();
  }

  private aplicar(): void {
    if (this.pedido && this.visible) this.m.iniciarMetricas();
    else this.m.pausarMetricas();
  }
}

/** Fuentes que se pueden seguir a la vez por ventana. */
export const MAX_SEGUIMIENTOS = 16;

interface EmisorLike {
  once?: (evento: 'destroyed', fn: () => void) => unknown;
}

/**
 * Fuentes de registro seguidas por cada webContents. Se sueltan con `dejar`, al destruirse el
 * webContents, al borrar el sitio de la fuente y al cerrar el IPC.
 */
export class Seguimientos {
  private readonly porEmisor = new Map<
    object,
    Map<string, { dejar: Promise<() => void>; sitioId?: string }>
  >();
  /** Emisor por defecto (pruebas, o un evento sin `sender`). */
  private readonly anonimo = {};

  private clave(emisor: unknown): object {
    return typeof emisor === 'object' && emisor !== null ? emisor : this.anonimo;
  }

  async seguir(n: Nucleo, emisor: unknown, id: string): Promise<void> {
    const clave = this.clave(emisor);
    const fuente = (await n.fuentesRegistro()).find((f) => f.id === id);
    if (!fuente) throw new Error('La fuente de registro no existe.');
    // Desde aquí todo es síncrono hasta registrar la entrada: dos llamadas simultáneas ven el
    // mismo mapa, un solo oyente de 'destroyed' y el tope respetado.
    let mapa = this.porEmisor.get(clave);
    if (mapa?.has(id)) return;
    if (mapa && mapa.size >= MAX_SEGUIMIENTOS) {
      throw new Error(`Se pueden seguir como mucho ${MAX_SEGUIMIENTOS} registros a la vez.`);
    }
    if (!mapa) {
      mapa = new Map();
      this.porEmisor.set(clave, mapa);
      const once = (emisor as EmisorLike | null)?.once;
      if (typeof once === 'function') {
        once.call(emisor, 'destroyed', () => this.dejarEmisor(clave));
      }
    }
    const dejar = n.seguirRegistro(id);
    mapa.set(id, { dejar, ...(fuente.sitioId ? { sitioId: fuente.sitioId } : {}) });
    try {
      await dejar;
    } catch (e) {
      if (mapa.get(id)?.dejar === dejar) mapa.delete(id);
      throw e;
    }
  }

  private soltar(e: { dejar: Promise<() => void> }): void {
    void e.dejar.then((f) => f()).catch(() => undefined);
  }

  dejar(emisor: unknown, id: string): void {
    const mapa = this.porEmisor.get(this.clave(emisor));
    const e = mapa?.get(id);
    if (!mapa || !e) return;
    mapa.delete(id);
    this.soltar(e);
  }

  dejarEmisor(clave: object): void {
    const mapa = this.porEmisor.get(clave);
    if (!mapa) return;
    this.porEmisor.delete(clave);
    for (const e of mapa.values()) this.soltar(e);
  }

  /** Suelta las fuentes de un sitio (antes de borrarlo: libera sus archivos de log). */
  dejarSitio(sitioId: string): void {
    for (const mapa of this.porEmisor.values()) {
      for (const [id, e] of mapa) {
        if (e.sitioId !== sitioId) continue;
        mapa.delete(id);
        this.soltar(e);
      }
    }
  }

  dejarTodo(): void {
    for (const clave of [...this.porEmisor.keys()]) this.dejarEmisor(clave);
  }

  /** Cuántas fuentes sigue un emisor (para pruebas). */
  cuantas(emisor?: unknown): number {
    return this.porEmisor.get(this.clave(emisor))?.size ?? 0;
  }
}

/**
 * Registros de contenedores seguidos por cada webContents (`motor:id`). Se sueltan con `dejar`,
 * al destruirse el webContents y al cerrar el IPC. El núcleo pone además un tope global.
 */
export class SeguimientosContenedores {
  private readonly porEmisor = new Map<object, Map<string, Promise<() => void>>>();
  private readonly anonimo = {};

  private clave(emisor: unknown): object {
    return typeof emisor === 'object' && emisor !== null ? emisor : this.anonimo;
  }

  async seguir(n: NucleoIpc, emisor: unknown, motor: MotorContenedores, id: string): Promise<void> {
    const clave = this.clave(emisor);
    const k = `${motor}:${id}`;
    let mapa = this.porEmisor.get(clave);
    if (mapa?.has(k)) return;
    if (!mapa) {
      mapa = new Map();
      this.porEmisor.set(clave, mapa);
      const once = (emisor as EmisorLike | null)?.once;
      if (typeof once === 'function') {
        once.call(emisor, 'destroyed', () => this.dejarEmisor(clave));
      }
    }
    const dejar = n.contenedores.seguirLogs(motor, id);
    mapa.set(k, dejar);
    try {
      await dejar;
    } catch (e) {
      if (mapa.get(k) === dejar) mapa.delete(k);
      throw e;
    }
  }

  private soltar(p: Promise<() => void>): void {
    void p.then((f) => f()).catch(() => undefined);
  }

  dejar(emisor: unknown, motor: MotorContenedores, id: string): void {
    const mapa = this.porEmisor.get(this.clave(emisor));
    const k = `${motor}:${id}`;
    const p = mapa?.get(k);
    if (!mapa || !p) return;
    mapa.delete(k);
    this.soltar(p);
  }

  dejarEmisor(clave: object): void {
    const mapa = this.porEmisor.get(clave);
    if (!mapa) return;
    this.porEmisor.delete(clave);
    for (const p of mapa.values()) this.soltar(p);
  }

  dejarTodo(): void {
    for (const clave of [...this.porEmisor.keys()]) this.dejarEmisor(clave);
  }

  /** Cuántos registros sigue un emisor (para pruebas). */
  cuantos(emisor?: unknown): number {
    return this.porEmisor.get(this.clave(emisor))?.size ?? 0;
  }
}

/** Motor de contenedores de la lista blanca. */
function motorContenedores(v: unknown): MotorContenedores {
  if (!esMotorContenedores(v)) throw new Error('Argumento no válido: motor');
  return v;
}

function accionContenedor(v: unknown): AccionContenedor {
  if (typeof v !== 'string' || !(ACCIONES_CONTENEDOR as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: accion');
  }
  return v as AccionContenedor;
}

/**
 * Detener y reiniciar cortan lo que corre en el contenedor: exigen `confirmacion === true` (solo
 * la pasa el diálogo). Iniciar no la necesita, pero no acepta otro valor que true o nada.
 */
function confirmacionContenedor(a: AccionContenedor, v: unknown): void {
  if (v !== undefined && v !== true) throw new Error('Argumento no válido: confirmacion');
  if (a !== 'iniciar' && v !== true) {
    throw new ErrorWolf('contenedores.sin_confirmar', 'Falta confirmar la acción.');
  }
}

/** Lo que la ventana principal usa de la captura (`ServicioCaptura`, D35). */
export type CapturaIpc = Pick<
  ServicioCaptura,
  'estadoUi' | 'registrarAtajo' | 'iniciar' | 'tomarPendiente'
>;

/** Sin servicio de captura (pruebas): nada se captura y no hay atajo. */
const CAPTURA_NO_DISPONIBLE: CapturaIpc = {
  estadoUi: async () => ({
    config: { atajo: null, formato: 'png' },
    sistema: { disponible: false, permiso: 'no_aplica' },
    atajoActivo: false,
    atajoOcupado: false,
  }),
  registrarAtajo: () => ({ ok: true }),
  iniciar: async () => ({ ok: false, codigo: 'captura.no_disponible' }),
  tomarPendiente: () => null,
};

export interface OpcionesIpc {
  secretos?: SecretosIpc;
  metricas?: ControlMetricas;
  /** Captura de pantalla (D35); sin ella, la captura no está disponible. */
  captura?: CapturaIpc;
  seguimientos?: Seguimientos;
  contenedores?: SeguimientosContenedores;
  /** Carpeta de proyectos sin carpeta vigilada (`C:\\Proyectos`); se puede cambiar en pruebas. */
  carpetaProyectosPorDefecto?: string;
  /** Idioma del sistema (`app.getLocale()`), para elegir el de la interfaz la primera vez. */
  idiomaSistema?: () => string;
  /** Aplica tema e idioma al proceso principal (`nativeTheme.themeSource`, bandeja, diálogos). */
  aplicarPreferencias?: (p: PreferenciasUi) => void;
  /** Se llama tras guardar, borrar, encender o apagar un workspace (la bandeja rearma su menú). */
  alCambiarWorkspaces?: () => void;
  /** La ventana avisa si el editor de código tiene cambios sin guardar (D44, M-A). */
  alCambiarEditorSinGuardar?: (sinGuardar: boolean) => void;
}

/** Lo que ve cada manejador además del núcleo: el sistema, las rutas elegidas y el emisor. */
type Contexto = ApiSistema & {
  elegidas: RutasElegidas;
  secretos: SecretosIpc;
  metricas: ControlMetricas;
  captura: CapturaIpc;
  seguimientos: Seguimientos;
  contenedores: SeguimientosContenedores;
  /** webContents que hizo la llamada (para atar los seguimientos de registros). */
  emisor: unknown;
  carpetaProyectosPorDefecto: string;
  idiomaSistema: () => string;
  aplicarPreferencias: (p: PreferenciasUi) => void;
  alCambiarWorkspaces: () => void;
  alCambiarEditorSinGuardar: (sinGuardar: boolean) => void;
};

/** Opciones de ejecución de receta: ids acotados y receta validada (archivos de diálogos). */
async function opcionesReceta(v: unknown, elegidas: RutasElegidas): Promise<OpcionesReceta> {
  if (v === undefined) return {};
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  const r: OpcionesReceta = {};
  if (o['desde'] !== undefined) r.desde = idCorto(o['desde'], 'paso', 64);
  if (o['soloPaso'] !== undefined) r.soloPaso = idCorto(o['soloPaso'], 'paso', 64);
  if (o['receta'] !== undefined) {
    acotadoJson(o['receta'], MAX_BYTES_RECETA, 'receta');
    if (!Array.isArray(o['receta']) || o['receta'].length > MAX_PASOS_RECETA) {
      throw new Error('Argumento no válido: receta');
    }
    const p = PasoRecetaSchema.array().safeParse(o['receta']);
    if (!p.success) throw new Error('Argumento no válido: receta');
    for (const paso of p.data) {
      if (paso.id.length > 64) throw new Error('Argumento no válido: paso');
      // Un archivo (el respaldo de bd-restaurar) solo puede venir de un diálogo.
      if (paso.args && paso.args['archivo'] !== undefined) {
        paso.args['archivo'] = await archivoExistente(
          elegidas.exigir(paso.args['archivo'], 'archivo'),
        );
      }
    }
    r.receta = p.data;
  }
  for (const k of ['guardada', 'suelta'] as const) {
    if (o[k] === undefined) continue;
    if (typeof o[k] !== 'boolean') throw new Error(`Argumento no válido: ${k}`);
    if (o[k]) r[k] = true;
  }
  return r;
}

/** Receta del asistente (obligatoria): misma validación que al ejecutar. */
async function recetaObligatoria(v: unknown, elegidas: RutasElegidas) {
  if (!Array.isArray(v)) throw new Error('Argumento no válido: receta');
  return (await opcionesReceta({ receta: v }, elegidas)).receta ?? [];
}

/** Id de un sitio que existe: así nadie puede pasar una ruta en su lugar. */
async function sitioExistente(n: NucleoIpc, v: unknown): Promise<string> {
  const id = idCorto(v, 'sitio');
  if (!(await n.sitios.listar()).some((s) => s.id === id)) {
    throw new Error('El proyecto ya no existe.');
  }
  return id;
}

/** Número de resultado o de archivo (los que el núcleo numera): entero positivo y acotado. */
const enteroPositivo = (v: unknown, nombre: string): number => enteroEn(v, 1, 1_000_000, nombre);

/** Lista de patrones opcional: ausente o vacía = ninguno. */
const patrones = (v: unknown, nombre: string): string[] =>
  v === undefined || (Array.isArray(v) && v.length === 0) ? [] : listaTextos(v, 50, 200, nombre);

/** Opciones de `buscar.iniciar`: la raíz solo sale de un proyecto (id) o de un diálogo. */
async function opcionesBusqueda(
  n: NucleoIpc,
  elegidas: RutasElegidas,
  v: unknown,
): Promise<OpcionesBusqueda> {
  const o = objetoPlano<Record<string, unknown>>(v, 'búsqueda');
  const conSitio = o['sitioId'] !== undefined && o['sitioId'] !== null;
  const conRuta = o['rutaElegida'] !== undefined && o['rutaElegida'] !== null;
  if (conSitio === conRuta) throw new Error('Argumento no válido: raíz de la búsqueda');
  let raiz: string;
  if (conSitio) {
    const id = idCorto(o['sitioId'], 'sitio');
    const sitio = (await n.sitios.listar()).find((x) => x.id === id);
    if (!sitio) throw new Error('El proyecto ya no existe.');
    raiz = sitio.carpeta;
  } else {
    const ruta = texto(o['rutaElegida'], 'ruta');
    // Vale una carpeta o un archivo, pero siempre uno que el usuario eligió en un diálogo.
    if (!elegidas.tiene(ruta)) throw new Error('Elija el archivo o la carpeta desde el diálogo');
    raiz = ruta;
  }
  const modo = o['modo'];
  if (modo !== 'nombre' && modo !== 'contenido' && modo !== 'ambos') {
    throw new Error('Argumento no válido: modo');
  }
  return {
    raiz,
    consulta: textoLibre(o['consulta'], 1, 500, 'consulta'),
    modo,
    regex: booleano(o['regex'], 'regex'),
    mayusculas: booleano(o['mayusculas'], 'mayúsculas'),
    incluir: patrones(o['incluir'], 'incluir'),
    excluir: patrones(o['excluir'], 'excluir'),
    ...(o['contexto'] === undefined ? {} : { contexto: enteroEn(o['contexto'], 0, 5, 'contexto') }),
    ...(o['incluirPesadas'] === undefined
      ? {}
      : { incluirPesadas: booleano(o['incluirPesadas'], 'incluirPesadas') }),
  };
}

/** Ruta del .key junto al .crt elegido. */
function rutaClave(destino: string): string {
  const sinExt = destino.replace(/\.(crt|pem|cer)$/i, '');
  return `${sinExt}.key`;
}

/** Ejecuta con el token guardado (o sin él); ningún error puede repetirlo. */
export const AVISO_TOKEN_ILEGIBLE = 'el token guardado no se pudo leer; vuelva a guardarlo';

async function conToken<T>(s: Contexto, fn: (token: string | null) => Promise<T>): Promise<T> {
  // Un token que no se puede leer (safeStorage caído, archivo dañado) no impide los repos
  // públicos: se sigue sin token y, si algo falla, se dice por qué podría ser.
  let token: string | null = null;
  let ilegible = false;
  try {
    token = await s.secretos.leerTokenGithub();
  } catch {
    ilegible = true;
  }
  let valor: T;
  try {
    valor = await sinClave(token ?? '', () => fn(token));
  } catch (e) {
    if (!ilegible) throw e;
    const mensaje = e instanceof Error ? e.message : String(e);
    // Con un código del núcleo se perdería el aviso al traducir: se deja solo el mensaje.
    throw Object.assign(new Error(`${mensaje} (${AVISO_TOKEN_ILEGIBLE})`), {
      ...(typeof (e as { codigo?: unknown }).codigo === 'string' && !(e instanceof ErrorWolf)
        ? { codigo: (e as { codigo: string }).codigo }
        : {}),
    });
  }
  // Red de seguridad: un resultado que llevara el token no sale del proceso principal.
  if (token && JSON.stringify(valor ?? null).includes(token)) {
    throw new Error('La respuesta contenía el token de GitHub y no se envió.');
  }
  return valor;
}

/** Clave guardada de un proveedor (null si no hay). Un fallo al descifrar nunca la repite. */
async function claveIaGuardada(s: Contexto, id: string): Promise<string | null> {
  try {
    return await s.secretos.leer(`ia:${id}`);
  } catch {
    throw new ErrorWolf(
      'ia.clave_ilegible',
      'No se pudo leer la clave guardada del proveedor: bórrela y vuelva a guardarla.',
    );
  }
}

/**
 * Ejecuta con la clave del almacén (nunca la del renderer). Los errores salen sin ella y un
 * resultado que la llevara (eco del proveedor, un bloque sin enmascarar) no sale del proceso.
 */
async function conClaveIa<T>(
  s: Contexto,
  id: string,
  fn: (clave: string | null) => Promise<T>,
): Promise<T> {
  const clave = await claveIaGuardada(s, id);
  const valor = await sinClave(clave ?? '', () => fn(clave), quitarClave);
  // Una clave corta ('x', 'lm-studio') no es un secreto real y aparecería en cualquier JSON:
  // solo se bloquean por subcadena las claves largas.
  if (clave && !esClaveCorta(clave) && JSON.stringify(valor ?? null).includes(clave)) {
    throw new ErrorWolf('ia.respuesta_rara', 'La respuesta contenía la clave y no se envió.');
  }
  return valor;
}

/** Borra las copias del .env de los sitios donde alguna tiene la clave; cuántos sitios. */
async function limpiarRespaldosIa(n: NucleoIpc, s: Contexto, id: string): Promise<number> {
  return conClaveIa(s, id, async (k) => (await n.ia.limpiarRespaldosDeClave(k)).sitios);
}

/** Proveedores con lo único que el renderer ve de su clave: `{configurada, final}`. */
async function proveedoresPublicos(n: NucleoIpc, s: Contexto): Promise<ProveedorIaPublico[]> {
  const lista = await n.ia.proveedores();
  return Promise.all(
    lista.map(async (p) => ({ ...p, clave: await s.secretos.estado(`ia:${p.id}`) })),
  );
}

/** Clave guardada de un proveedor SMTP (null si no hay). Un fallo al descifrar nunca la repite. */
async function claveSmtpGuardada(s: Contexto, id: string): Promise<string | null> {
  try {
    return await s.secretos.leer(`smtp:${id}`);
  } catch {
    throw new ErrorWolf(
      'correo.clave_ilegible',
      'No se pudo leer la clave guardada del proveedor: bórrela y vuelva a guardarla.',
    );
  }
}

/**
 * Ejecuta con la clave SMTP del almacén (nunca la del renderer). Los errores salen sin ella y un
 * resultado que la llevara no sale del proceso principal.
 */
async function conClaveSmtp<T>(
  s: Contexto,
  id: string,
  fn: (clave: string) => Promise<T>,
): Promise<T> {
  const clave = await claveSmtpGuardada(s, id);
  if (clave === null) {
    throw new ErrorWolf('correo.sin_clave', 'El proveedor no tiene una clave guardada.');
  }
  const valor = await sinClave(clave, () => fn(clave), quitarClave);
  // Una clave corta no se busca como subcadena (aparecería en casi cualquier texto), pero una
  // larga, tal cual o escapada como en un JSON, nunca sale del proceso principal.
  const json = JSON.stringify(valor ?? null);
  if (
    !esClaveCorta(clave) &&
    (json.includes(clave) || json.includes(JSON.stringify(clave).slice(1, -1)))
  ) {
    throw new ErrorWolf('correo.sin_clave', 'La respuesta contenía la clave y no se envió.');
  }
  return valor;
}

/** Proveedores SMTP con lo único que el renderer ve de su clave: `{configurada, final}`. */
async function proveedoresSmtpPublicos(n: NucleoIpc, s: Contexto): Promise<ProveedorSmtpPublico[]> {
  const lista = await n.smtp.proveedores();
  return Promise.all(
    lista.map(async (p) => ({ ...p, clave: await s.secretos.estado(`smtp:${p.id}`) })),
  );
}

/** Clave guardada del usuario propio de la base de un proyecto (null si no hay o no se lee). */
async function claveBdGuardada(s: Contexto, sitioId: string): Promise<string | null> {
  try {
    return await s.secretos.leer(`bd:${sitioId}`);
  } catch {
    return null;
  }
}

/** Carpeta de proyectos por defecto si no hay carpeta vigilada (si existe). */
export const CARPETA_PROYECTOS_POR_DEFECTO = 'C:\\Proyectos';

const mismaRuta = (a: string, b: string): boolean => {
  const k = (r: string): string =>
    resolve(r)
      .replace(/[\\/]+$/, '')
      .toLowerCase();
  return k(a) === k(b);
};

/**
 * Destino de un clon: directo dentro de la carpeta de proyectos (la vigilada o, sin ella,
 * C:\\Proyectos si existe) o de una carpeta elegida en el diálogo; que no exista o esté vacío.
 */
async function destinoClon(n: NucleoIpc, s: Contexto, v: unknown): Promise<string> {
  const destino = rutaAbsoluta(v, 'destino');
  const padre = dirname(destino);
  const vigilada = (await n.config.leer())?.proyectos?.carpetaVigilada ?? null;
  const defecto = s.carpetaProyectosPorDefecto;
  // Sin carpeta vigilada, la de por defecto se crea la primera vez (solo esa ruta exacta).
  if (vigilada === null && mismaRuta(padre, defecto) && !existsSync(defecto)) {
    await mkdir(defecto, { recursive: true });
  }
  const base = vigilada ?? (existsSync(defecto) ? defecto : null);
  const permitida = (base !== null && mismaRuta(padre, base)) || s.elegidas.tiene(padre, 'abrir');
  if (!permitida) {
    throw new Error(
      'Clone dentro de la carpeta de proyectos o de una carpeta elegida con "Elegir carpeta".',
    );
  }
  await carpetaExistente(padre);
  try {
    const st = await stat(destino);
    if (!st.isDirectory() || (await readdir(destino)).length > 0) {
      throw new Error('La carpeta de destino ya existe y no está vacía.');
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  return destino;
}

/** Lo que llega del diálogo: la confirmación y, si se manda, lo que se mostró (validado). */
function opcionesTunel(
  confirmado: unknown,
  tunel: unknown,
): {
  confirmado: boolean;
  tunelConfirmado?: { proveedor: string; nombre?: string; dominio?: string; modo?: string };
} {
  const t = tunelConfirmado(tunel);
  return { confirmado: confirmado === true, ...(t ? { tunelConfirmado: t } : {}) };
}

/**
 * Lo que confirmó el usuario al compartir en la red local (la IP mostrada y HTTPS). El
 * `confirmado` viene del diálogo: aquí no se inventa; sin `true`, el núcleo no abre nada.
 */
function confirmacionLan(v: unknown): { confirmado: boolean; ip: string; https: boolean } {
  if (typeof v !== 'object' || v === null) throw new Error('Confirmación no válida');
  const o = v as Record<string, unknown>;
  return {
    confirmado: o['confirmado'] === true,
    ip: ipv4(o['ip']),
    https: booleano(o['https'], 'https'),
  };
}

/** El gestor de Cloudflare con nombre del núcleo (no existe en un núcleo sin plataforma). */
function cloudflareNombre(n: NucleoIpc): NonNullable<NucleoIpc['tuneles']['cloudflareNombre']> {
  const c = n.tuneles.cloudflareNombre;
  if (!c) {
    throw new ErrorWolf(
      'tuneles.proveedor_no_disponible',
      'Cloudflare con nombre no está disponible.',
      { proveedor: 'cloudflare-nombre' },
    );
  }
  return c;
}

type Manejador = (nucleo: NucleoIpc, sistema: Contexto, ...args: unknown[]) => unknown;

/** Tabla explícita: el renderer solo puede invocar estas rutas; cada una valida sus argumentos. */
const TABLA: Record<RutaIpc, Manejador> = {
  estadoGeneral: (n) => n.estadoGeneral(),
  carpetaDatos: (n) => n.rutas.base,
  // Perfiles del entorno (D27): las rutas salen de diálogos; la frase se limpia de cualquier error
  // y nunca se guarda ni se registra. Las claves nuevas de las bases van al almacén (bd:<sitio>).
  'perfiles.entorno': (n) => ({ aislado: n.aislado, carpeta: n.rutas.base }),
  'perfiles.exportar': async (n, s, o) => {
    const opciones = validarExportarPerfil(o, s.elegidas);
    return sinClave(opciones.frase ?? '', () => n.exportarPerfil(opciones));
  },
  'perfiles.vistaPrevia': (n, s, archivo, o) => {
    const p = validarVistaPreviaPerfil(archivo, o, s.elegidas);
    return n.vistaPreviaImportarPerfil(p.archivo, { rutas: p.rutas, prefijos: p.prefijos });
  },
  'perfiles.importar': async (n, s, archivo, o) => {
    const p = validarImportarPerfil(archivo, o, s.elegidas);
    return sinClave(p.opciones.frase ?? '', () =>
      n.importarPerfil(p.archivo, {
        ...p.opciones,
        guardarClave: (sitioId, clave) => s.secretos.guardar(`bd:${sitioId}`, clave),
      }),
    );
  },
  // Quitar de la confianza la CA que reemplazó un perfil: solo por su huella (el usuario lo confirma
  // en la interfaz); el núcleo rechaza la CA actual.
  'perfiles.quitarCaAnterior': (n, _s, huella) => {
    if (typeof huella !== 'string' || !/^[0-9A-Fa-f]{40}$/.test(huella)) {
      throw new Error('Argumento no válido: huella');
    }
    return n.quitarCaAnterior(huella);
  },
  'perfiles.instantaneas': (n) => n.instantaneasEntorno(),
  'perfiles.instantanea': (n) => n.instantaneaEntorno('manual'),
  'sitios.listar': (n) => n.sitios.listar(),
  'sitios.guardar': (n, _s, datos, id) =>
    n.guardarSitio(
      objetoPlano<Parameters<Nucleo['guardarSitio']>[0]>(datos, 'datos'),
      id === undefined ? undefined : idNoVacio(id),
    ),
  // Se dejan de seguir sus registros antes de borrarlo: el visor no debe retener sus archivos.
  'sitios.borrar': (n, s, id) => {
    const sitioId = idNoVacio(id);
    s.seguimientos.dejarSitio(sitioId);
    return n.borrarSitio(sitioId).then(async () => {
      // La clave del usuario propio de su base ya no sirve a nadie.
      await s.secretos.borrar(`bd:${sitioId}`).catch(() => undefined);
    });
  },
  'sitios.aplicar': (n) => n.sitios.aplicar(),
  // Tareas programadas (D29): el núcleo valida la forma (estricta) y rechaza todo campo de más;
  // aquí solo ids y huellas. `permitirAislado` es la confirmación del usuario en modo aislado.
  'tareas.lista': (n, _s, sitioId) => n.programador.vista(idSitioTarea(sitioId)),
  'tareas.estado': (n) => n.programador.estado(),
  'tareas.proximas': (n, _s, cron) => {
    if (typeof cron !== 'string' || cron.length > 200) throw new Error('Argumento no válido: cron');
    return n.tareas.proximas(cron, 3);
  },
  'tareas.permitirAislado': (n) => n.programador.permitirAislado(),
  'tareas.guardar': (n, _s, sitioId, t) =>
    n.tareas.guardar(idSitioTarea(sitioId), objetoPlano<object>(t, 'tarea')),
  'tareas.activar': (n, _s, sitioId, tareaId, activa) => {
    if (typeof activa !== 'boolean') throw new Error('Argumento no válido: activa');
    return n.tareas.activar(idSitioTarea(sitioId), idTarea(tareaId), activa);
  },
  'tareas.confirmar': (n, _s, sitioId, tareaId, huella) =>
    n.tareas.confirmar(idSitioTarea(sitioId), idTarea(tareaId), huellaDeTarea(huella)),
  'tareas.borrar': (n, _s, sitioId, tareaId) =>
    n.tareas.borrar(idSitioTarea(sitioId), idTarea(tareaId)),
  'tareas.ejecutarAhora': (n, _s, sitioId, tareaId) =>
    n.programador.ejecutarAhora(idSitioTarea(sitioId), idTarea(tareaId)),
  'tareas.historial': (n, _s, sitioId, tareaId) =>
    n.tareas.historial(idSitioTarea(sitioId), idTarea(tareaId)),
  'tareas.log': (n, _s, sitioId, tareaId) =>
    n.programador.leerLog(idSitioTarea(sitioId), idTarea(tareaId)),
  'tareas.propuestas': (n, _s, sitioId) => n.tareas.propuestas(idSitioTarea(sitioId)),
  'tareas.adoptar': (n, _s, sitioId, id, huella, activar) => {
    if (typeof activar !== 'boolean') throw new Error('Argumento no válido: activar');
    return n.tareas.adoptar(idSitioTarea(sitioId), idTarea(id), huellaDeTarea(huella), activar);
  },
  'tareas.aWolfcoreYml': (n, _s, sitioId, tareaId) =>
    n.tareas.aWolfcoreYml(idSitioTarea(sitioId), idTarea(tareaId)),

  // Workspaces (D28): solo referencias; el núcleo valida la forma y rechaza cualquier campo de más.
  'workspaces.lista': (n) => n.workspaces.lista(),
  'workspaces.estados': (n) => n.workspaces.estados(),
  'workspaces.guardar': async (n, s, w) => {
    const r = await n.workspaces.guardar(
      objetoPlano<Parameters<Nucleo['workspaces']['guardar']>[0]>(w, 'workspace'),
    );
    s.alCambiarWorkspaces();
    return r;
  },
  'workspaces.borrar': async (n, s, id) => {
    await n.workspaces.borrar(idWorkspace(id));
    s.alCambiarWorkspaces();
  },
  'workspaces.iniciar': async (n, s, id) => {
    try {
      return await n.workspaces.iniciar(idWorkspace(id));
    } finally {
      s.alCambiarWorkspaces();
    }
  },
  'workspaces.detener': async (n, s, id) => {
    try {
      return await n.workspaces.detener(idWorkspace(id));
    } finally {
      s.alCambiarWorkspaces();
    }
  },
  'servicios.estados': (n) => n.servicios.estados(),
  'servicios.iniciar': (n, _s, id) =>
    n.servicios.iniciar(idNoVacio(id) as Parameters<Nucleo['servicios']['iniciar']>[0]),
  'servicios.detener': (n, _s, id) =>
    n.servicios.detener(idNoVacio(id) as Parameters<Nucleo['servicios']['detener']>[0]),
  'servicios.iniciarTodo': (n) => n.iniciarTodo(),
  'servicios.detenerTodo': (n) => n.detenerTodo(),
  'servicios.cambiarPuerto': (n, _s, id, puerto) =>
    n.cambiarPuertoServicio(idServicioDatos(id), puertoUsuario(puerto)),
  'servicios.borrarDatos': (n, _s, id, confirmacion) =>
    n.borrarDatosServicio(idServicioDatos(id), textoAcotado(confirmacion, 0, 64, 'confirmación')),
  'servicios.autoIniciar': (n, _s, id, valor) =>
    n.autoIniciarServicio(idServicioDatos(id), booleano(valor, 'autoIniciar')),
  // Las rutas bd.* aceptan el motor (su instancia predeterminada) o una instancia (`mysql@8.0`).
  'bd.listar': (n, _s, motor) => n.listarBases(objetivoBd(motor).objetivo),
  'bd.crear': (n, _s, motor, nombre, opciones) => {
    const { objetivo, motor: m } = objetivoBd(motor);
    const o = opcionesCrear(m, opciones);
    return sinClave(o?.clave ?? '', () => n.crearBase(objetivo, nombreBase(m, nombre), o));
  },
  'bd.borrar': (n, _s, motor, nombre, confirmacion) => {
    const { objetivo, motor: m } = objetivoBd(motor);
    return n.borrarBase(
      objetivo,
      nombreBase(m, nombre),
      textoAcotado(confirmacion, 0, 64, 'confirmación'),
    );
  },
  // Rutas que devuelven secretos (nunca se registran): bd.conexion (clave del motor),
  // bd.crear (clave generada del usuario nuevo), ftp.activar, ftp.regenerarClave y
  // ftp.credenciales (clave FTP del sitio).
  'bd.conexion': (n, _s, motor) => n.conexionBd(objetivoBd(motor).objetivo),
  'bd.bloqueEnv': (n, _s, motor, base, tipo, envActual) => {
    const { objetivo, motor: m } = objetivoBd(motor);
    return n.bloqueEnvBd(
      objetivo,
      nombreBase(m, base),
      tipoProyecto(tipo),
      envActual === undefined ? undefined : textoAcotadoEnv(envActual),
    );
  },
  'bd.bloqueEnvSitio': (n, _s, sitioId, motor, base) => {
    const { objetivo, motor: m } = objetivoBd(motor);
    return n.bloqueEnvSitio(textoAcotado(sitioId, 1, 128, 'sitio'), objetivo, nombreBase(m, base));
  },
  'bd.carpetaRespaldos': (n) => n.carpetaRespaldos(),
  'bd.tieneTablas': (n, _s, motor, base) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.tieneTablas(objetivo, nombreBase(m, base));
  },
  'bd.formato': async (n, s, archivo) =>
    n.formatoRespaldo(await archivoExistente(s.elegidas.exigir(archivo, 'archivo'))),
  'bd.restaurar': async (n, s, motor, archivo, base, opciones) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    const b = nombreBase(m, base);
    const o = opcionesRestaurar(opciones);
    return n.restaurarBase(
      objetivo,
      await archivoExistente(s.elegidas.exigir(archivo, 'archivo')),
      b,
      o,
    );
  },
  'bd.respaldar': async (n, s, motor, base, carpeta) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    const b = nombreBase(m, base);
    return n.respaldarBase(
      objetivo,
      b,
      carpeta === undefined
        ? undefined
        : await carpetaExistente(s.elegidas.exigir(carpeta, 'carpeta')),
    );
  },
  'bd.importar': (n, _s, motor, origen, destino, opciones) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    const o = origenImportar(origen);
    const d = nombreBase(m, destino, 'base destino');
    const op = opcionesRestaurar(opciones);
    return sinClave(o.clave, () => n.importarBase(objetivo, o, d, op));
  },
  // Instantáneas (D19): el id es el que dio el núcleo (nunca una ruta) y volver exige confirmación.
  'instantaneas.lista': (n, _s, motor, base) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.instantaneas.lista(objetivo, nombreBase(m, base));
  },
  'instantaneas.tomar': (n, _s, motor, base, nota) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.instantaneas.tomar(
      objetivo,
      nombreBase(m, base),
      nota === undefined ? '' : textoAcotado(nota, 0, 200, 'nota'),
    );
  },
  'instantaneas.vistaPrevia': (n, _s, motor, base, id) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.instantaneas.vistaPrevia(objetivo, nombreBase(m, base), idInstantanea(id));
  },
  'instantaneas.volver': (n, _s, motor, base, id, escrito, opciones) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    const b = nombreBase(m, base);
    return n.instantaneas.volver(
      objetivo,
      b,
      idInstantanea(id),
      confirmadoVolver(escrito, b),
      opcionesVolver(opciones, b),
    );
  },
  'instantaneas.listaInstancia': (n, _s, motor) =>
    n.instantaneas.listaInstancia(objetivoSql(motor).objetivo),
  'instantaneas.papelera': (n, _s, motor, base) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.instantaneas.papelera(objetivo, nombreBase(m, base));
  },
  'instantaneas.recuperar': (n, _s, motor, base, id) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.instantaneas.recuperar(objetivo, nombreBase(m, base), idInstantanea(id));
  },
  'instantaneas.borrar': (n, _s, motor, base, id) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.instantaneas.borrar(objetivo, nombreBase(m, base), idInstantanea(id));
  },
  // Auditoría de contraseñas (D20): solo "débil o no"; restablecer exige escribir el usuario.
  'auditoriaClaves.auditar': (n, _s, motor, base, seleccion) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.auditoriaClaves.auditar({
      instancia: objetivo,
      base: nombreBase(m, base),
      ...seleccionAuditoria(seleccion),
    });
  },
  'auditoriaClaves.progreso': (n) => n.auditoriaClaves.progreso(),
  'auditoriaClaves.cancelar': (n) => n.auditoriaClaves.cancelar(),
  'auditoriaClaves.vistaPrevia': (n, _s, motor, base, seleccion, usuario, aBcrypt) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    return n.auditoriaClaves.vistaPreviaRestablecer(
      {
        instancia: objetivo,
        base: nombreBase(m, base),
        ...seleccionAuditoria(seleccion),
        usuario: usuarioAuditoria(usuario),
      },
      aBcrypt === undefined ? false : booleano(aBcrypt, 'aBcrypt'),
    );
  },
  'auditoriaClaves.restablecer': (
    n,
    _s,
    motor,
    base,
    seleccion,
    usuario,
    claveNueva,
    escrito,
    aBcrypt,
    confirmarDatosReales,
  ) => {
    const { objetivo, motor: m } = objetivoSql(motor);
    const u = usuarioAuditoria(usuario);
    const clave = claveNuevaAuditoria(claveNueva);
    // `quitarClave`: una clave corta no destroza el mensaje (solo se quita como palabra suelta).
    return sinClave(
      clave,
      () =>
        n.auditoriaClaves.restablecer({
          instancia: objetivo,
          base: nombreBase(m, base),
          ...seleccionAuditoria(seleccion),
          usuario: u,
          claveNueva: clave,
          confirmado: confirmadoRestablecer(escrito, u),
          ...(aBcrypt === undefined ? {} : { aBcrypt: booleano(aBcrypt, 'aBcrypt') }),
          ...(confirmarDatosReales === undefined
            ? {}
            : { confirmarDatosReales: booleano(confirmarDatosReales, 'confirmarDatosReales') }),
        }),
      quitarClave,
    );
  },
  'pgvector.estado': (n) => n.estadoPgvector(),
  'pgvector.instalarBuildTools': (n) => n.instalarBuildTools(),
  'pgvector.compilarEInstalar': (n) => n.compilarPgvector(),
  'pgvector.activar': (n, _s, base) => n.activarVector(nombreBase('postgresql', base)),
  'https.estado': (n) => n.estadoHttps(),
  'https.instalarCA': (n) => n.instalarCA(),
  'https.quitarCA': (n) => n.quitarCA(),
  'https.cambiarPuerto': (n, _s, puerto) => n.cambiarPuertoHttps(puertoHttps(puerto)),
  'composer.version': (n) => n.versionComposer(),
  'composer.instalar': (n) => n.instalarComposer(),
  'composer.actualizar': (n) => n.actualizarComposer(),
  'composer.cambiarPhpPorDefecto': (n, _s, rama) => n.cambiarPhpPorDefecto(ramaPhp(rama)),
  'terminal.abrir': (n, _s, id, terminal) => n.abrirTerminal(idNoVacio(id), idTerminal(terminal)),
  'terminal.disponibles': (n) => n.terminales(),
  'terminal.cambiarPorDefecto': (n, _s, terminal) =>
    n.cambiarTerminalPorDefecto(idTerminal(terminal)),
  'path.estado': (n) => n.estadoPathUsuario(),
  'path.cambiar': (n, _s, activar) => n.cambiarPathUsuario(booleano(activar, 'activar')),
  'cli.estado': (n) => n.estadoCliPath(),
  'cli.cambiarPath': (n, _s, agregar) => n.cambiarCliPath(booleano(agregar, 'agregar')),
  'adminer.instalar': (n) => n.instalarAdminer(),
  'adminer.disponibilidad': (n) => n.disponibilidadAdminer(),
  'adminer.proyecto': (n, _s, id) => n.adminerProyecto(idNoVacio(id)),
  'adminer.url': (n, _s, motor, usuario) => {
    const m = motorBd(motor);
    return n.urlAdminer(m, nombreBase(m === 'mongodb' ? 'mysql' : m, usuario, 'usuario'));
  },
  'phpmyadmin.instalar': (n) => n.instalarPhpMyAdmin(),
  'phpmyadmin.disponibilidad': (n) => n.disponibilidadPhpMyAdmin(),
  // El token de un solo uso va de aquí al navegador: la interfaz nunca ve la URL ni la clave.
  'accesoBd.abrir': async (n, s, id, herramienta) => {
    const r = await n.abrirBaseProyecto(idNoVacio(id), herramientaBd(herramienta));
    await s.abrirUrl(r.url);
    return { usuario: r.usuario, propio: r.propio, ...(r.motivo ? { motivo: r.motivo } : {}) };
  },
  'ftp.activar': (n, _s, id) => n.activarFtp(idNoVacio(id)),
  'ftp.desactivar': (n, _s, id) => n.desactivarFtp(idNoVacio(id)),
  'ftp.regenerarClave': (n, _s, id) => n.regenerarClaveFtp(idNoVacio(id)),
  'ftp.soloLectura': (n, _s, id, valor) =>
    n.ftpSoloLectura(idNoVacio(id), booleano(valor, 'soloLectura')),
  'ftp.credenciales': (n, _s, id) => n.credencialesFtp(idNoVacio(id)),
  'ftp.url': (n, _s, id) => n.urlFtp(idNoVacio(id)),
  'ftp.redLocal': (n, _s, valor) => n.ftpRedLocal(booleano(valor, 'redLocal')),
  // Red local (D25): compartir expone el sitio a toda la red; el núcleo exige la confirmación.
  'lan.estado': (n) => n.lan.estado(),
  'lan.activar': (n, _s, id, confirmacion) =>
    n.lan.activar(idNoVacio(id), confirmacionLan(confirmacion)),
  'lan.desactivar': (n, _s, id) => n.lan.desactivar(idNoVacio(id)),
  'lan.comandoFirewall': (n, _s, puerto, para) =>
    n.comandoFirewallLan(
      enteroEn(puerto, 1024, 65535, 'puerto'),
      para === undefined ? 'sitio' : unoDe(para, ['sitio', 'ca'] as const, 'para'),
    ),
  'lan.abrirCaMovil': (n, _s, ip) => n.caMovil.abrir(ip === undefined ? {} : { ip: ipv4(ip) }),
  'lan.cerrarCaMovil': (n) => n.caMovil.cerrar(),
  'ia.modelos': (n) => n.modelosIa(),
  'ia.descargar': (n, _s, nombre) => n.descargarModelo(nombreModelo(nombre)),
  'ia.cancelar': (n, _s, nombre) => n.cancelarDescargaModelo(nombreModelo(nombre)),
  'ia.borrar': (n, _s, nombre) => n.borrarModelo(nombreModelo(nombre)),
  'ia.probar': (n, _s, nombre, prompt) =>
    n.probarModelo(nombreModelo(nombre), textoLibre(prompt, 1, 4000, 'texto')),
  'ia.espacioUsado': (n) => n.espacioIa(),
  'ia.bloqueEnv': (n) => n.bloqueEnvIa(),
  'ia.sugeridos': (n) => n.modelosSugeridos(),

  // ---- IA en la nube: la clave entra por guardarClave y solo la lee este proceso ----
  'ia.proveedores': async (n, s) => proveedoresPublicos(n, s),
  'ia.guardarProveedor': async (n, s, datos, confirmarCambioUrl) => {
    const c = configProveedorIa(datos);
    if (confirmarCambioUrl !== undefined && confirmarCambioUrl !== true) {
      throw new ErrorWolf('ia.argumento_invalido', 'Argumento no válido: confirmacion', {
        campo: 'confirmacion',
      });
    }
    // Una clave guardada sin proveedor (quedó de un borrado a medias) nunca se reutiliza para
    // un proveedor nuevo con el mismo id: iría a una URL que el usuario no eligió con ella.
    const existe = (await n.ia.proveedores()).some((p) => p.id === c.id);
    if (!existe && s.secretos.hay(`ia:${c.id}`)) await s.secretos.borrar(`ia:${c.id}`);
    await n.ia.guardarProveedor(c, {
      tieneClave: existe && s.secretos.hay(`ia:${c.id}`),
      ...(confirmarCambioUrl === true ? { confirmarCambioUrl: true } : {}),
    });
    return proveedoresPublicos(n, s);
  },
  'ia.borrarProveedor': async (n, s, id, opciones) => {
    const p = idProveedorIa(id);
    const o = opcionesBorrarClaveIa(opciones);
    await n.ia.proveedor(p);
    if (o.limpiarRespaldos) await limpiarRespaldosIa(n, s, p);
    // Primero la clave: si falla, el proveedor sigue y no queda una clave huérfana.
    await s.secretos.borrar(`ia:${p}`);
    await n.ia.borrarProveedor(p);
  },
  'ia.guardarClave': async (n, s, id, clave) => {
    const p = idProveedorIa(id);
    const k = claveIa(clave);
    await n.ia.proveedor(p);
    await sinClave(k, () => s.secretos.guardar(`ia:${p}`, k));
    return s.secretos.estado(`ia:${p}`);
  },
  // Con `limpiarRespaldos`, antes borra las copias del .env de los sitios que tienen la clave.
  'ia.borrarClave': async (n, s, id, opciones) => {
    const p = idProveedorIa(id);
    const o = opcionesBorrarClaveIa(opciones);
    const sitiosLimpios = o.limpiarRespaldos ? await limpiarRespaldosIa(n, s, p) : 0;
    await s.secretos.borrar(`ia:${p}`);
    return { sitiosLimpios };
  },
  'ia.estadoClave': (_n, s, id) => s.secretos.estado(`ia:${idProveedorIa(id)}`),
  'ia.respaldosClave': (n, s, id) => {
    const p = idProveedorIa(id);
    return conClaveIa(s, p, async (k) => ({ sitios: await n.ia.sitiosConRespaldosDeClave(k) }));
  },
  'ia.probarConexion': (n, s, id) => {
    const p = idProveedorIa(id);
    return conClaveIa(s, p, (k) => n.ia.probarConexion(p, k));
  },
  // Gasta tokens: solo con la confirmación del diálogo de costo (exactamente `true`).
  'ia.probarMensaje': (n, s, id, modelo, confirmacion) => {
    const p = idProveedorIa(id);
    if (confirmacion !== true) {
      throw new ErrorWolf(
        'ia.mensaje_sin_confirmar',
        'Confirme el envío del mensaje de prueba (gasta tokens de su cuenta).',
      );
    }
    const m = modeloIa(modelo);
    return conClaveIa(s, p, (k) => n.ia.probarMensaje(p, k, m, true));
  },
  'ia.previsualizarEnv': (n, s, sitioId, proveedorId, modelo) => {
    const sitio = idSitioIa(sitioId);
    const p = idProveedorIa(proveedorId);
    const m = modelo === undefined ? undefined : modeloIa(modelo);
    return conClaveIa(s, p, (k) => n.ia.previsualizarEnv(sitio, p, k, m));
  },
  'ia.escribirEnv': (n, s, sitioId, proveedorId, opciones) => {
    const sitio = idSitioIa(sitioId);
    const p = idProveedorIa(proveedorId);
    const o = opcionesEnvIa(opciones);
    return conClaveIa(s, p, (k) => n.ia.escribirEnv(sitio, p, k, o));
  },
  // ---- Agentes: nunca se abren solos; lo que escribe exige la confirmación del diálogo ----
  'agentes.estado': (n) => n.agentes.estado(),
  'agentes.version': (n, _s, id) => n.agentes.version(idAgente(id)),
  'agentes.instalar': (n, _s, id, confirmado) =>
    n.agentes.instalar(idAgente(id), confirmadoAgente(confirmado)),
  'agentes.registrarMcp': (n, _s, id, confirmado) =>
    n.agentes.registrarMcp(idAgente(id), confirmadoAgente(confirmado)),
  'agentes.quitarMcp': (n, _s, id, confirmado) =>
    n.agentes.quitarMcp(idAgente(id), confirmadoAgente(confirmado)),
  // La clave del proveedor la pone este proceso: viaja solo al entorno de la terminal.
  'agentes.abrir': (n, s, id, sitioId, proveedorId) => {
    const a = idAgente(id);
    const sitio = idSitioAgente(sitioId);
    if (proveedorId === undefined || proveedorId === null) return n.agentes.abrir(a, sitio, {});
    const p = idProveedorIa(proveedorId);
    return conClaveIa(s, p, (k) =>
      n.agentes.abrir(a, sitio, { proveedorIa: p, ...(k ? { clave: k } : {}) }),
    );
  },
  'git.sugerirCommit': (n, s, sitioId, proveedorId, modelo) => {
    const sitio = idSitioAgente(sitioId);
    const p = idProveedorIa(proveedorId);
    const m = modeloIa(modelo);
    return conClaveIa(s, p, (k) => n.agentes.sugerirCommitSitio(sitio, p, k, m));
  },
  // Solo lo preparado: el núcleo hace `git commit -F -` (nunca add ni push).
  'git.commitPreparado': (n, _s, sitioId, mensaje) =>
    n.agentes.commitPreparado(idSitioAgente(sitioId), mensajeCommit(mensaje)),
  // ---- PHP: el renderer manda rama, texto o nombres; las rutas las arma el núcleo ----
  'php.iniLeer': (n, _s, rama) => n.iniPhp.leer(ramaPhpIni(rama)),
  'php.iniValores': (n, _s, rama) => n.iniPhp.valores(ramaPhpIni(rama), CLAVES_RAPIDAS),
  'php.iniConValores': (n, _s, rama, valores, base) => {
    const r = ramaPhpIni(rama);
    const v = valoresRapidos(valores);
    return base === undefined || base === null
      ? n.iniPhp.conValores(r, v)
      : n.iniPhp.conValores(r, v, textoIni(base));
  },
  'php.iniDiff': (n, _s, rama, nuevo) => n.iniPhp.diff(ramaPhpIni(rama), textoIni(nuevo)),
  'php.iniGuardar': (n, _s, rama, nuevo) => n.iniPhp.guardar(ramaPhpIni(rama), textoIni(nuevo)),
  'php.iniRespaldos': (n, _s, rama) => n.iniPhp.respaldos(ramaPhpIni(rama)),
  'php.iniRestaurar': (n, _s, rama, respaldo) =>
    n.iniPhp.restaurar(ramaPhpIni(rama), respaldoIni(respaldo)),
  'php.extensiones': (n, _s, rama) => n.extensionesPhp.listar(ramaPhpIni(rama)),
  'php.extensionActivar': (n, _s, rama, nombre, activa) => {
    const r = ramaPhpIni(rama);
    const e = nombreExtensionPhp(nombre);
    return n.extensionesPhp.activar(r, e, activaExtension(activa));
  },
  'php.extensionInstalar': (n, _s, rama, nombre) => {
    const r = ramaPhpIni(rama);
    return n.extensionesPhp.instalar(r, nombreExtensionPhp(nombre));
  },
  // ---- PHP por sitio: el renderer manda el id del sitio; carpetas y rutas las arma el núcleo ----
  'sitios.phpSitio': (n, _s, id) => n.phpSitio(idSitioPhp(id)),
  'sitios.guardarPhpIni': (n, _s, id, valores) => {
    const sitio = idSitioPhp(id);
    return n.guardarPhpIniSitio(sitio, ajustesPhpSitio(valores));
  },
  'sitios.xdebug': (n, _s, id, x) => {
    const sitio = idSitioPhp(id);
    return n.xdebugSitio(sitio, xdebugSitio(x));
  },
  'sitios.launchJsonVista': (n, _s, id) => n.vistaLaunchJsonSitio(idSitioPhp(id)),
  // La confirmación la da el diálogo de la tarjeta (con la vista previa y el diff).
  'sitios.launchJson': (n, _s, id) => n.escribirLaunchJsonSitio(idSitioPhp(id)),
  // ---- Editor de vhost: id del sitio y texto; el núcleo revisa, prueba con nginx -t y arma rutas ----
  'nginx.vista': (n, _s, id) => n.editorVhost.vista(idSitioNginx(id)),
  'nginx.aplicar': (n, _s, id, cambio) => {
    const sitio = idSitioNginx(id);
    return n.editorVhost.aplicar(sitio, cambioVhost(cambio));
  },
  'nginx.historial': (n, _s, id) => n.editorVhost.historial(idSitioNginx(id)),
  'nginx.restaurar': (n, _s, id, version) => {
    const sitio = idSitioNginx(id);
    return n.editorVhost.restaurar(sitio, versionVhost(version));
  },
  'nginx.snippets': () => SNIPPETS_NGINX,
  'mailpit.noLeidos': (n) => n.noLeidosCorreo(),
  'correo.captadores': (n) => n.captadoresCorreo(),
  'correo.elegir': (n, _s, id) => n.elegirCaptador(idCaptador(id)),

  // ---- Proveedores SMTP remotos: la clave entra por guardarClave y solo la lee este proceso ----
  'correo.presets': () => [...PRESETS_SMTP],
  'correo.proveedores': (n, s) => proveedoresSmtpPublicos(n, s),
  'correo.guardarProveedor': async (n, s, datos, opciones) => {
    const d = datosProveedorSmtp(datos);
    const o = opcionesGuardarSmtp(opciones);
    const id = idProveedorSmtp(d['id']);
    // Una clave guardada sin proveedor (quedó de un borrado a medias) nunca se reutiliza para un
    // proveedor nuevo con el mismo id: iría a un servidor que el usuario no eligió con ella.
    const existe = (await n.smtp.proveedores()).some((p) => p.id === id);
    if (!existe && s.secretos.hay(`smtp:${id}`)) await s.secretos.borrar(`smtp:${id}`);
    await n.smtp.guardar(d, { ...o, tieneClave: existe && s.secretos.hay(`smtp:${id}`) });
    return proveedoresSmtpPublicos(n, s);
  },
  'correo.borrarProveedor': async (n, s, id) => {
    const p = idProveedorSmtp(id);
    await n.smtp.proveedor(p);
    // Primero la clave: si falla, el proveedor sigue y no queda una clave huérfana.
    await s.secretos.borrar(`smtp:${p}`);
    await n.borrarProveedorSmtp(p);
  },
  'correo.guardarClave': async (n, s, id, clave) => {
    const p = idProveedorSmtp(id);
    const k = claveSmtp(clave);
    await n.smtp.proveedor(p);
    await sinClave(k, () => s.secretos.guardar(`smtp:${p}`, k));
    return s.secretos.estado(`smtp:${p}`);
  },
  'correo.borrarClave': async (n, s, id) => {
    const p = idProveedorSmtp(id);
    await n.smtp.proveedor(p);
    await s.secretos.borrar(`smtp:${p}`);
  },
  'correo.probarEnvio': (n, s, id, para) => {
    const p = idProveedorSmtp(id);
    const destino = destinatarioPrueba(para);
    return conClaveSmtp(s, p, (k) => n.smtp.probar(p, k, destino));
  },
  'correo.usarEnSitio': async (n, _s, sitioId, modo) =>
    n.usarCorreoEnSitio(await sitioExistente(n, sitioId), modoCorreoSitio(modo)),
  'correo.vistaPreviaEnv': async (n, s, sitioId, id, incluirClave) => {
    const p = idProveedorSmtp(id);
    const sitio = await sitioExistente(n, sitioId);
    if (typeof incluirClave !== 'boolean') {
      throw new ErrorWolf('correo.argumento_invalido', 'Argumento no válido: incluirClave', {
        campo: 'incluirClave',
      });
    }
    if (!incluirClave) return n.vistaPreviaEnvSmtp(sitio, p, null);
    return conClaveSmtp(s, p, (k) => n.vistaPreviaEnvSmtp(sitio, p, k));
  },
  'correo.escribirEnv': async (n, s, sitioId, id, opciones) => {
    const p = idProveedorSmtp(id);
    const o = opcionesEnvSmtp(opciones);
    const sitio = await sitioExistente(n, sitioId);
    const comunes = {
      huella: o.huella,
      ...(o.aceptarVersionado ? { aceptarVersionado: true } : {}),
      ...(o.agregarGitignore ? { agregarGitignore: true } : {}),
    };
    if (!o.incluirClave) return n.escribirEnvSmtp(sitio, p, null, comunes);
    return conClaveSmtp(s, p, (k) => n.escribirEnvSmtp(sitio, p, k, comunes));
  },
  // Se entrega una sola vez: una recarga del renderer no lo vuelve a mostrar.
  avisoInicio: (n) => n.tomarAvisoInicio(),
  'instalador.listarVersiones': (n, _s, servicio, filtro) =>
    n.listarCatalogo(servicioDelCatalogo(servicio), filtroVersiones(filtro)),
  // El renderer solo elige servicio y versión (y, desde un diálogo, que acepta instalar sin
  // huella fuerte): URL, huella y carpeta salen del catálogo oficial.
  'instalador.instalar': async (n, _s, sel) => {
    const o = objetoPlano<Record<string, unknown>>(sel, 'versión');
    const servicio = servicioInstalable(o['servicio']);
    const version = idNoVacio(o['version'], 'versión');
    const confirmar = o['confirmarSinHuella'];
    if (confirmar !== undefined && confirmar !== true) {
      throw new Error('Argumento no válido: confirmarSinHuella');
    }
    const v = await n.buscarVersion(servicio, version);
    if (!v) {
      throw new ErrorWolf(
        'catalogo.version_no_encontrada',
        `La versión ${version} de ${servicio} no está en el catálogo`,
        { servicio, version: version.slice(0, 40) },
      );
    }
    return confirmar === true
      ? n.instalador.instalar(v, { confirmarSinHuella: true })
      : n.instalador.instalar(v);
  },
  'instalador.instalados': (n, _s, servicio) =>
    n.instalador.instalados(servicioDelCatalogo(servicio)),
  // Solo los binarios: nunca llama a borrar datos (es otra ruta, con su confirmación escrita).
  'instalador.desinstalar': (n, _s, servicio, version) =>
    n.desinstalarVersion(servicioVersiones(servicio), versionCatalogo(version)),
  // Limpieza de versiones sin uso (D30): la vista previa no borra; limpiar exige `confirmado: true`
  // (lo da el diálogo que mostró la lista) y el núcleo vuelve a comprobar el uso de cada versión.
  'limpiezaVersiones.sinUso': (n) => n.versionesSinUso(),
  'limpiezaVersiones.papelera': (n) => n.versionesEnPapelera(),
  'limpiezaVersiones.recuperar': (n, _s, id) => n.recuperarVersion(idPapeleraVersion(id)),
  'limpiezaVersiones.limpiar': (n, _s, seleccion, confirmado, destino) => {
    if (confirmado !== true) throw new Error('Argumento no válido: confirmado');
    return n.limpiarVersiones(seleccionLimpieza(seleccion), true, destinoLimpieza(destino));
  },
  // ---- Pestaña "Versiones" e instancias (Task 19) ----
  'catalogo.versiones': (n, _s, servicio, filtro) =>
    n.versionesServicio(servicioVersiones(servicio), filtroVersiones(filtro)),
  'catalogo.silenciar': (n, _s, servicio, silenciar) =>
    n.silenciarVersiones(servicioVersiones(servicio), booleano(silenciar, 'silenciar')),
  'instancias.lista': (n, _s, servicio) =>
    n.listaInstancias(servicio === undefined ? undefined : idServicioDatos(servicio)),
  'instancias.crear': (n, _s, servicio, version) =>
    n.crearInstancia(idServicioDatos(servicio), versionCatalogo(version)),
  'instancias.iniciar': (n, _s, id) => n.iniciarInstancia(idInstanciaIpc(id)),
  'instancias.detener': (n, _s, id) => n.detenerInstancia(idInstanciaIpc(id)),
  'instancias.puerto': (n, _s, id, puerto) =>
    n.puertoInstancia(idInstanciaIpc(id), puertoUsuario(puerto)),
  'instancias.predeterminar': (n, _s, id) => n.predeterminarInstancia(idInstanciaIpc(id)),
  // Solo la saca de la lista: sus datos quedan (borrarlos es instancias.borrarDatos).
  'instancias.quitar': (n, _s, id) => n.quitarInstancia(idInstanciaIpc(id)),
  'instancias.borrarDatos': (n, _s, id, confirmacion) =>
    n.borrarDatosInstancia(idInstanciaIpc(id), textoAcotado(confirmacion, 0, 64, 'confirmación')),
  'instancias.desbloquear': (n, _s, id, opciones) =>
    n.desbloquearInstancia(idInstanciaIpc(id), opcionesDesbloquear(opciones)),
  'servicios.planActualizar': (n, _s, id) => n.planActualizar(idInstanciaIpc(id)),
  'servicios.actualizar': (n, _s, id, version, opciones) =>
    n.actualizarServicio(
      idInstanciaIpc(id),
      versionCatalogo(version),
      opcionesActualizar(opciones),
    ),
  'servicios.nuevaRama': (n, _s, servicio, version, opciones) => {
    const s = idServicioDatos(servicio);
    return n.nuevaRamaServicio(s, versionCatalogo(version), opcionesNuevaRama(s, opciones));
  },
  'servicios.predeterminada': (n, _s, servicio, version) =>
    n.predeterminarVersion(servicioVersiones(servicio), versionCatalogo(version)),
  'servicios.respaldosDatos': (n, _s, servicio) =>
    n.respaldosDeDatos(servicio === undefined ? undefined : idServicioDatos(servicio)),
  'servicios.borrarRespaldoDatos': (n, _s, ref, confirmar) =>
    n.borrarRespaldoDatos(refRespaldoDatos(ref), confirmadoBorrar(confirmar)),
  // `confirmado`: el usuario confirmó publicar en el diálogo de la interfaz (siempre se pide).
  'tuneles.abrir': (n, _s, id, confirmado, tunel) =>
    n.tuneles.abrir(idNoVacio(id), opcionesTunel(confirmado, tunel)),
  'tuneles.cerrar': (n, _s, id) => n.tuneles.cerrar(idNoVacio(id)),
  'tuneles.renovar': (n, _s, id, confirmado, tunel) =>
    n.tuneles.renovar(idNoVacio(id), opcionesTunel(confirmado, tunel)),
  'tuneles.estados': (n) => n.tuneles.estados(),
  // Cloudflare con nombre: la credencial del túnel la guarda el núcleo en el almacén de secretos
  // (nunca llega aquí ni al renderer); el renderer solo manda el nombre y el dominio.
  'tuneles.cuentaCloudflare': (n) => ({
    disponible: n.tuneles.cloudflareNombre !== null,
    conectada: n.tuneles.cloudflareNombre?.tieneCuenta() ?? false,
  }),
  'tuneles.conectarCloudflare': (n) => cloudflareNombre(n).conectar(),
  // Olvidar y recrear exigen `confirmado` (el núcleo lo vuelve a comprobar).
  'tuneles.olvidarCloudflare': (n, _s, nombre, confirmado, borrar) =>
    n.tuneles.olvidarTunelNombre(textoAcotado(nombre, 1, 63, 'nombre'), {
      confirmado: confirmado === true,
      borrarEnCloudflare: borrar !== false,
    }),
  'tuneles.recrearCloudflare': (n, _s, nombre, confirmado) =>
    n.tuneles.recrearTunelNombre(textoAcotado(nombre, 1, 63, 'nombre'), {
      confirmado: confirmado === true,
    }),
  'tuneles.cancelarConexionCloudflare': (n) => cloudflareNombre(n).cancelarConexion(),
  'tuneles.desconectarCloudflare': (n) => cloudflareNombre(n).desconectar(),
  'tuneles.configurarCloudflare': (n, _s, id, nombre, dominio) =>
    n.tuneles.configurarCloudflareNombre(
      idNoVacio(id),
      textoAcotado(nombre, 1, 63, 'nombre'),
      textoAcotado(dominio, 1, 253, 'dominio'),
    ),
  'tuneles.usarTunelRapido': (n, _s, id) => n.tuneles.elegirProveedor(idNoVacio(id), null),
  // ngrok, Expose y Tailscale (Serve o Funnel). Elegirlo cierra el túnel abierto del sitio y no
  // abre nada: abrirlo exige la confirmación, que dice el proveedor y hasta dónde llega.
  'tuneles.usarProveedor': (n, _s, id, proveedor, modo) => {
    const e = eleccionTunel(proveedor, modo);
    return n.tuneles.elegirProveedor(idNoVacio(id), {
      proveedor: e.proveedor,
      ...(e.modo ? { modo: e.modo } : {}),
    });
  },
  // Los tokens de ngrok y Expose viven solo en el almacén (`tunel:<proveedor>`): el renderer manda
  // el token una vez y después solo ve {configurada, final}.
  'tuneles.estadoToken': (_n, s, proveedor) =>
    s.secretos.estado(`tunel:${proveedorTunelConToken(proveedor)}`),
  'tuneles.guardarToken': async (_n, s, proveedor, token) => {
    const p = proveedorTunelConToken(proveedor);
    const t = tokenTunel(token);
    await sinClave(t, () => s.secretos.guardar(`tunel:${p}`, t));
    return s.secretos.estado(`tunel:${p}`);
  },
  'tuneles.borrarToken': async (_n, s, proveedor) => {
    await s.secretos.borrar(`tunel:${proveedorTunelConToken(proveedor)}`);
  },
  'hosts.sincronizar': async (n) => {
    const sitios = await n.sitios.listar();
    // Pedido explícito ("Aplicar hosts pendientes"): vuelve a pedir permiso aunque el último
    // UAC se haya cancelado o vencido.
    return n.hosts.sincronizar([...new Set(sitios.flatMap((s) => [s.dominio, ...s.alias]))], {
      reintentar: true,
    });
  },
  detectarProyecto: (n, _s, carpeta) => n.detectarProyecto(texto(carpeta, 'carpeta')),
  'config.leer': (n) => n.config.leer(),
  'ajustes.guardar': (n, _s, a) => {
    const o = objetoPlano<Record<string, unknown>>(a, 'ajustes');
    return n.guardarAjustes({
      puerto: enteroEn(o['puerto'], 1, 65535, 'puerto'),
      trabajadores: enteroEn(o['trabajadores'], 1, 8, 'trabajadores'),
    });
  },
  'sistema.elegirCarpeta': async (_n, s) => s.elegidas.registrar(await s.elegirCarpeta()),
  'sistema.elegirArchivo': async (_n, s) => s.elegidas.registrar(await s.elegirArchivo()),
  'sistema.abrirUrl': (_n, s, url) => s.abrirUrl(urlAbrible(url)),
  'sistema.abrirCarpeta': async (_n, s, ruta) => s.abrirCarpeta(await carpetaExistente(ruta)),
  'sistema.copiar': (_n, s, t) => s.copiar(texto(t, 'texto')),
  'sistema.version': (_n, s) => s.version(),
  'sistema.abrirEditor': async (n, _s, sitioId, editor) =>
    n.abrirEditor(await sitioExistente(n, sitioId), idEditor(editor)),
  // Solo sirve como destino (propósito 'guardar'), nunca para leer.
  'sistema.guardarArchivo': async (_n, s, nombre) =>
    s.elegidas.registrar(
      await s.guardarArchivo(
        nombre === undefined ? undefined : textoAcotado(nombre, 1, 200, 'nombre'),
      ),
      'guardar',
    ),
  'sistema.elegirArchivos': async (_n, s) => {
    const rutas = await s.elegirArchivos();
    for (const r of rutas) s.elegidas.registrar(r);
    return rutas;
  },

  // ---- Proyectos y recetas ----
  'proyectos.detectar': async (n, _s, carpeta) =>
    n.detectarCarpetaProyecto(await carpetaExistente(carpeta)),
  'proyectos.configLeer': async (n, _s, carpeta) =>
    n.leerConfigProyecto(await carpetaExistente(carpeta)),
  // Solo en la carpeta de un proyecto ya montado (la ruta sale de la configuración).
  'proyectos.configGuardar': async (n, _s, sitioId, config) => {
    const id = idCorto(sitioId, 'sitio');
    const datos = acotadoJson<unknown>(
      objetoPlano(config, 'configuración'),
      MAX_BYTES_RECETA,
      'configuración',
    );
    const sitio = (await n.sitios.listar()).find((x) => x.id === id);
    if (!sitio) throw new Error('El proyecto ya no existe.');
    return n.guardarConfigProyecto(sitio.carpeta, datos);
  },
  'proyectos.recetaPorDefecto': async (n, _s, carpeta) =>
    n.recetaPropuesta(await carpetaExistente(carpeta)),
  'proyectos.ejecutarReceta': async (n, s, sitioId, opciones) => {
    const id = idCorto(sitioId, 'sitio');
    const opts = await opcionesReceta(opciones, s.elegidas);
    // El núcleo toma la clave del usuario propio de la base por su proveedor (en memoria); aquí solo
    // se quita de cualquier error que la repitiera.
    const claveBd = await claveBdGuardada(s, id);
    return sinClave(claveBd ?? '', () => n.ejecutarReceta(id, opts));
  },
  'proyectos.omitirPaso': (n, _s, sitioId, pasoId) =>
    n.omitirPasoReceta(idCorto(sitioId, 'sitio'), idCorto(pasoId, 'paso', 64)),
  'proyectos.estadoReceta': (n, _s, sitioId) => n.estadoReceta(idCorto(sitioId, 'sitio')),
  'proyectos.cancelarReceta': (n, _s, sitioId) => n.cancelarReceta(idCorto(sitioId, 'sitio')),
  'proyectos.resumenReceta': (n, _s, sitioId) => n.resumenReceta(idCorto(sitioId, 'sitio')),
  'proyectos.crearSitio': async (n, s, datos, receta) => {
    const d = objetoPlano<Parameters<Nucleo['crearSitioProyecto']>[0]>(datos, 'datos');
    return n.crearSitioProyecto(d, await recetaObligatoria(receta, s.elegidas));
  },
  // La clave del usuario propio de la base del proyecto nueva la genera este proceso; el núcleo
  // la usa en memoria y `alCrearSitio` la guarda en el almacén (bd:<sitio>) antes de crear el usuario.
  'proyectos.crear': async (n, s, pedido) => {
    const p = validarPedidoProyecto(pedido, s.elegidas);
    // Sin cifrado no hay dónde guardar la clave: se crea sin usuario propio (conexión del
    // administrador, como antes) y la respuesta lo avisa. Se mira antes de crear el sitio.
    if (!s.secretos.disponible()) return n.crearProyecto(p, { sinUsuarioPropio: true });
    const claveBd = generarClaveBd();
    const r = await sinClave(claveBd, () =>
      n.crearProyecto(p, {
        secretos: { claveBd },
        alCrearSitio: (id) => s.secretos.guardar(`bd:${id}`, claveBd),
      }),
    );
    if (JSON.stringify(r ?? null).includes(claveBd)) {
      throw new ErrorWolf(
        'proyectos.clave_bd_falta',
        'La respuesta contenía la clave y no se envió.',
      );
    }
    return r;
  },
  'proyectos.huellaWordpress': (n, _s, version) =>
    n.huellaWordpress(version === undefined ? undefined : versionWordpress(version)),
  'proyectos.confiar': (n, _s, sitioId) => n.confiarReceta(idCorto(sitioId, 'sitio')),

  // ---- Gestor de .env: solo `revelar` devuelve un valor secreto completo (una clave, por clic) ----
  'env.ver': (n, _s, sitioId) => n.env.ver(idCorto(sitioId, 'sitio')),
  // Es la única ruta que devuelve un valor secreto: el usuario la pide con el botón Mostrar de una
  // variable. No se registra ni emite eventos.
  'env.revelar': (n, _s, sitioId, clave) =>
    n.env.revelar(idCorto(sitioId, 'sitio'), claveEnv(clave)),
  'env.vistaPrevia': (n, _s, sitioId, pedido) =>
    n.env.vistaPrevia(idCorto(sitioId, 'sitio'), pedidoEnv(pedido)),
  'env.guardar': (n, _s, sitioId, pedido, opciones) =>
    n.env.guardar(idCorto(sitioId, 'sitio'), pedidoEnv(pedido), true, {
      ...opcionesEnv(opciones, ['aceptarVersionado', 'agregarGitignore', 'huella']),
      huella: huellaEnvPedida(opciones),
    }),
  'env.copias': (n, _s, sitioId) => n.env.copias(idCorto(sitioId, 'sitio')),
  'env.restaurarCopia': (n, _s, sitioId, nombre, opciones) => {
    opcionesEnv(opciones, []);
    return n.env.restaurarCopia(idCorto(sitioId, 'sitio'), nombreCopiaEnv(nombre), true);
  },
  // La clave del usuario nuevo la genera este proceso y la guarda en el almacén (bd:<sitio>) antes
  // de que el núcleo cree el usuario; nunca viaja al renderer.
  'env.usarUsuarioPropio': async (n, s, sitioId, opciones) => {
    const id = idCorto(sitioId, 'sitio');
    const o = opcionesEnv(opciones, ['aceptarVersionado', 'compartirUsuario']);
    if (!s.secretos.disponible()) {
      throw new ErrorWolf(
        'secretos.sin_cifrado',
        'El cifrado del sistema no está disponible: no se puede guardar la clave del usuario propio. No se cambió nada.',
      );
    }
    const claveBd = generarClaveBd();
    return sinClave(claveBd, () =>
      n.usarUsuarioPropio(
        id,
        {
          claveBd,
          // La que el núcleo decida usar: la nueva o la de otro proyecto con el mismo usuario.
          guardarClave: (clave) => s.secretos.guardar(`bd:${id}`, clave),
          ...(o.aceptarVersionado ? { aceptarVersionado: true } : {}),
          ...(o.compartirUsuario ? { compartirUsuario: true } : {}),
        },
        true,
      ),
    );
  },

  // ---- Plantillas de proyecto: el id sale de la lista y nunca es una ruta ----
  'plantillas.lista': (n) => n.plantillas.lista(),
  'plantillas.vistaPrevia': async (n, _s, sitioId, opciones) =>
    n.plantillas.vistaPrevia(await sitioExistente(n, sitioId), opcionesPlantilla(opciones, false)),
  'plantillas.guardar': async (n, _s, sitioId, opciones) =>
    n.plantillas.guardar(await sitioExistente(n, sitioId), opcionesPlantilla(opciones, true)),
  'plantillas.borrar': (n, _s, id) => n.plantillas.borrar(idPlantilla(id)),
  'importar.vistaPrevia': (n, _s, instancia) =>
    n.vistaPreviaImportar(instancia === undefined ? undefined : objetivoSql(instancia).objetivo),
  'importar.cancelar': (n) => n.cancelarImportacion(),
  'importar.ejecutar': (n, _s, seleccion, opciones) => {
    const ids = idsImportar(seleccion);
    const o = opcionesImportar(opciones);
    // La clave del servidor de origen solo vive en esta llamada y se quita de cualquier error.
    return sinClave(o.origenBd?.clave ?? '', () => n.importarDeOtros(ids, o));
  },

  // ---- Git y GitHub: el token lo agrega este proceso; nunca vuelve al renderer ----
  'git.disponible': (n) => n.disponibilidadGit(),
  'git.clonar': async (n, s, url, destino) => {
    const u = textoAcotado(url, 1, 2048, 'url');
    validarUrlGit(u);
    const d = await destinoClon(n, s, destino);
    return conToken(s, (token) => n.clonarRepo(u, d, token));
  },
  'git.estado': (n, _s, sitioId) => n.estadoGit(idCorto(sitioId, 'sitio')),
  'git.traerCambios': (n, s, sitioId) => {
    const id = idCorto(sitioId, 'sitio');
    return conToken(s, (token) => n.traerCambios(id, token));
  },
  'github.repos': (n, s, opciones) => {
    const o =
      opciones === undefined ? {} : objetoPlano<Record<string, unknown>>(opciones, 'opciones');
    const buscar =
      o['buscar'] === undefined ? undefined : textoAcotado(o['buscar'], 0, 100, 'buscar');
    const pagina = o['pagina'] === undefined ? undefined : enteroEn(o['pagina'], 1, 100, 'página');
    return conToken(s, (token) =>
      n.reposGithub({
        ...(buscar ? { buscar } : {}),
        ...(pagina ? { pagina } : {}),
        ...(token ? { token } : {}),
      }),
    );
  },
  'github.guardarToken': async (_n, s, token) => {
    const t = textoAcotado(token, 1, 512, 'token');
    await sinClave(t, () => s.secretos.guardarTokenGithub(t));
  },
  'github.borrarToken': (_n, s) => s.secretos.borrarTokenGithub(),
  'github.hayToken': (_n, s) => s.secretos.hayTokenGithub() === true,
  'github.instalarGh': (n) => n.instalarGh(),
  'github.iniciarSesionGh': (n) => n.iniciarSesionGh(),

  // ---- Runtimes y procesos de proyecto ----
  'runtimes.instalados': (n, _s, tipo) => n.runtimesInstalados(tipoRuntime(tipo)),
  'runtimes.proyecto': (n, _s, sitioId) => n.runtimesProyecto(idCorto(sitioId, 'sitio')),
  'procesos.iniciar': (n, _s, sitioId, procesoId) =>
    n.iniciarProceso(idCorto(sitioId, 'sitio'), idCorto(procesoId, 'proceso', 64)),
  'procesos.detener': (n, _s, sitioId, procesoId) =>
    n.detenerProceso(idCorto(sitioId, 'sitio'), idCorto(procesoId, 'proceso', 64)),
  'procesos.estados': (n, _s, sitioId) => n.estadosProcesos(idCorto(sitioId, 'sitio')),
  'reverb.estado': (n, _s, sitioId) => n.estadoReverb(idCorto(sitioId, 'sitio')),
  // Solo `true` de verdad confirma (el núcleo responde `reverb.sin_confirmar` si no).
  'reverb.activar': (n, _s, sitioId, confirmado) =>
    n.activarReverb(idCorto(sitioId, 'sitio'), confirmado === true),
  'reverb.desactivar': (n, _s, sitioId) => n.desactivarReverb(idCorto(sitioId, 'sitio')),
  'reverb.variables': (n, _s, sitioId) => n.variablesReverb(idCorto(sitioId, 'sitio')),

  // ---- Preferencias de la interfaz ----
  'preferencias.leer': async (n, s) => {
    let p = await n.preferenciasUi();
    if (p.idioma === null) {
      p = await n.guardarPreferenciasUi({ idioma: idiomaDeLocale(s.idiomaSistema()) });
    }
    s.aplicarPreferencias(p);
    return p;
  },
  // El núcleo valida cada campo de forma estricta (claves desconocidas o valores raros: error).
  'preferencias.guardar': async (n, s, cambios) => {
    const p = await n.guardarPreferenciasUi(
      objetoPlano<CambiosPreferenciasUi>(cambios, 'preferencias'),
    );
    s.aplicarPreferencias(p);
    return p;
  },

  // ---- Carpeta vigilada ----
  'vigilar.sugerencias': (n) => n.sugerenciasProyectos(),
  'vigilar.cambiarCarpeta': async (n, s, carpeta) =>
    n.cambiarCarpetaVigilada(
      carpeta === null ? null : await carpetaExistente(s.elegidas.exigir(carpeta, 'carpeta')),
    ),

  // ---- Métricas (solo con la ventana visible) y registros (por id, nunca por ruta) ----
  'metricas.iniciar': (_n, s) => s.metricas.iniciar(),
  'metricas.pausar': (_n, s) => s.metricas.pausar(),
  'metricas.ultimos': (n, _s, min) =>
    n.ultimasMetricas(min === undefined ? 5 : enteroEn(min, 1, 5, 'minutos')),
  'registros.fuentes': (n) => n.fuentesRegistro(),
  'registros.seguir': (n, s, id) => s.seguimientos.seguir(n, s.emisor, idCorto(id, 'fuente', 300)),
  'registros.dejar': (_n, s, id) => s.seguimientos.dejar(s.emisor, idCorto(id, 'fuente', 300)),
  'registros.leerFinal': (n, _s, id, lineas) =>
    n.leerRegistro(
      idCorto(id, 'fuente', 300),
      lineas === undefined ? 500 : enteroEn(lineas, 1, 5000, 'líneas'),
    ),
  'registros.abrirCarpeta': async (n, s, id) =>
    s.abrirCarpeta(await n.carpetaRegistro(idCorto(id, 'fuente', 300))),

  // ---- Herramientas ----
  'herramientas.puertos': (n) => n.puertosEnUso(),
  'herramientas.finalizarProceso': (n, _s, p, confirmacion, opciones) => {
    const o =
      opciones === undefined ? {} : objetoPlano<Record<string, unknown>>(opciones, 'opciones');
    return n.finalizarProceso(pid(p), textoAcotado(confirmacion, 1, 260, 'confirmación'), {
      ...(o['forzar'] === undefined ? {} : { forzar: booleano(o['forzar'], 'forzar') }),
      ...(o['creado'] === undefined || o['creado'] === null
        ? {}
        : { creado: textoAcotado(o['creado'], 1, 40, 'creado') }),
    });
  },
  'herramientas.limpiarBom': async (n, s, rutas, simular) => {
    const lista = listaTextos(rutas, 1000, 260, 'rutas').map((r) =>
      s.elegidas.exigir(r, 'archivo'),
    );
    return n.limpiarBom(lista, booleano(simular, 'simular'));
  },
  'herramientas.emitirCertificado': async (n, s, dominios, destino) => {
    const lista = listaTextos(dominios, 20, 255, 'dominios');
    const crt = s.elegidas.exigir(destino, 'archivo', 'guardar');
    const key = rutaClave(crt);
    const { certPem, clavePem } = await n.emitirCertificadoLibre(lista);
    try {
      // La clave no se elige en el diálogo: nunca se pisa un archivo que ya exista.
      await writeFile(key, clavePem, { flag: 'wx', mode: 0o600 });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error(`Ya existe ${key}: elija otro nombre para el certificado.`);
      }
      throw new Error('No se pudo guardar la clave del certificado.');
    }
    try {
      await writeFile(crt, certPem);
    } catch {
      // Sin certificado, la clave sola no sirve: no se deja suelta.
      await rm(key, { force: true });
      throw new Error('No se pudo guardar el certificado.');
    }
    return { certificado: crt, clave: key };
  },
  // Sin argumentos; el núcleo ya enmascara los valores con nombre de secreto.
  'herramientas.entorno': (n) => n.entornoSistema(),
  // Imágenes, ZIP y PDF (D33): toda ruta sale de un diálogo (lectura = abrir; escritura = guardar)
  // y el núcleo nunca pisa un archivo existente. Los bytes de la imagen tienen tope.
  'herramientas.leerImagen': (n, s, ruta) => n.leerImagen(s.elegidas.exigir(ruta, 'archivo')),
  'herramientas.guardarImagen': (n, s, destino, datos) =>
    n.guardarImagen(
      s.elegidas.exigir(destino, 'archivo', 'guardar'),
      bytesAcotados(datos, LIMITES_IMAGEN.bytesSalida, 'imagen'),
    ),
  // ---- Captura de pantalla (D35) ----
  'captura.leer': (_n, s) => s.captura.estadoUi(),
  // El atajo se registra ANTES de guardarlo: si otro programa lo usa no se pisa ni se guarda.
  'captura.guardarConfig': async (n, s, cambios) => {
    const c = objetoPlano<CambiosCaptura>(cambios, 'captura');
    const previo = await n.capturaConfig();
    let atajo: ResultadoAtajo = { ok: true };
    if (c.atajo !== undefined) {
      atajo = s.captura.registrarAtajo(c.atajo);
      if (!atajo.ok) return { config: previo, atajo };
    }
    try {
      return { config: await n.guardarCapturaConfig(c), atajo };
    } catch (e) {
      if (c.atajo !== undefined) s.captura.registrarAtajo(previo.atajo);
      throw e;
    }
  },
  'captura.iniciar': (_n, s, modo) => s.captura.iniciar(modoCaptura(modo)),
  'captura.tomarPendiente': (_n, s) => s.captura.tomarPendiente(),
  'herramientas.comprimirZip': (n, s, origenes, destino) =>
    n.comprimirZip(
      listaTextos(origenes, 200, 1024, 'orígenes').map((r) => {
        // Archivos (elegirArchivos) o carpetas (elegirCarpeta): siempre de un diálogo.
        if (!s.elegidas.tiene(r)) throw new Error('Elija los archivos o carpetas desde el diálogo');
        return r;
      }),
      s.elegidas.exigir(destino, 'archivo', 'guardar'),
    ),
  // Conversor de documentos (D34): el origen sale de un diálogo "Abrir", el destino de uno "Guardar"
  // y el formato es de una lista fija. El núcleo no pisa nada y fuerza la extensión del formato.
  'herramientas.conversionesDocumento': (n) => n.conversionesDocumento(),
  'herramientas.convertirDocumento': (n, s, origen, a, destino) =>
    n.convertirDocumento(
      s.elegidas.exigir(origen, 'archivo'),
      unoDe(a, FORMATOS_CONVERSOR, 'formato'),
      s.elegidas.exigir(destino, 'archivo', 'guardar'),
    ),
  // ---- Optimizador de RAM (D36): la lista siempre se ve antes y se aplica solo con confirmación ----
  'memoria.plan': (n, _s, modo) => n.planMemoria(unoDe(modo, MODOS_MEMORIA, 'modo')),
  'memoria.aplicar': (n, _s, planId, ids, confirmacion) =>
    n.aplicarMemoria(
      textoAcotado(planId, 1, 100, 'plan'),
      listaTextos(ids, MAX_ACCIONES_MEMORIA, MAX_LARGO_ID_MEMORIA, 'acciones'),
      confirmado(confirmacion),
    ),
  // ---- Limpieza de disco (D37): análisis visible primero, y solo se limpia con confirmación ----
  'limpiezaDisco.analizar': (n, _s, categorias) =>
    n.analizarLimpieza(
      categorias === undefined ? [] : listaTextos(categorias, 8, 40, 'categorias'),
    ),
  'limpiezaDisco.limpiar': (n, _s, categorias, confirmacion) =>
    n.limpiarDisco(listaTextos(categorias, 8, 40, 'categorias'), confirmado(confirmacion)),
  'limpiezaDisco.cancelar': async (n) => n.cancelarLimpieza(),
  'limpiezaDisco.abrirRegistros': async (n, s) => s.abrirCarpeta(await n.carpetaRegistroLimpieza()),
  // ---- Editor de código (D43): la ruta sale de un diálogo; guardar exige confirmado === true ----
  // Su propio diálogo: la ruta queda registrada con el propósito 'editor' (nada más la abre). D44
  // registra así los resultados de Buscar: lo hace este proceso, nunca la ventana.
  'editorCodigo.elegir': async (_n, s) => s.elegidas.registrar(await s.elegirArchivo(), 'editor'),
  'editorCodigo.abrir': (n, s, ruta, opciones) => {
    const v = validarAbrirEditor(ruta, opciones, s.elegidas);
    return n.abrirArchivoEditor(v.ruta, v.opciones);
  },
  // Los dos rechazos que la ventana sabe resolver (el archivo cambió por fuera, o falta el refuerzo)
  // salen como resultado tipado: el código de un error no cruza el puente del preload.
  'editorCodigo.guardar': async (n, s, ruta, opciones) => {
    const v = validarGuardarEditor(ruta, opciones, s.elegidas);
    try {
      return { estado: 'guardado', ...(await n.guardarArchivoEditor(v.ruta, v.opciones)) };
    } catch (e) {
      if (e instanceof ErrorWolf && e.codigo === 'editor.archivo_cambiado')
        return { estado: 'cambiado' };
      if (e instanceof ErrorWolf && e.codigo === 'editor.confirmacion_reforzada') {
        const riesgos = String(e.datos?.['riesgos'] ?? '')
          .split(',')
          .filter((r) => r === 'secreto' || r === 'datos-reales' || r === 'enlace-duro');
        return { estado: 'reforzar', riesgos };
      }
      if (e instanceof ErrorWolf && e.codigo === 'editor.eol_mixto')
        return { estado: 'normalizar' };
      throw e;
    }
  },
  // La ventana avisa de los cambios sin guardar para que «Salir» de la bandeja pregunte.
  'editorCodigo.avisarCambios': (_n, s, sinGuardar) =>
    s.alCambiarEditorSinGuardar(booleano(sinGuardar, 'sinGuardar')),
  // ---- Diff de carpetas (D44): carpetas de un diálogo, resultados por número, solo lectura ----
  'diffCarpetas.comparar': (n, s, a, b) =>
    n.diffCarpetas.comparar(s.elegidas.exigir(a, 'carpeta'), s.elegidas.exigir(b, 'carpeta')),
  'diffCarpetas.cancelar': (n) => n.diffCarpetas.cancelar(),
  'diffCarpetas.archivo': (n, _s, id, idEntrada) =>
    n.diffCarpetas.archivo(idCorto(id, 'comparación', 64), enteroPositivo(idEntrada, 'archivo')),
  'diffCarpetas.prepararEditor': async (n, s, id, idEntrada, lado) => {
    if (lado !== 'a' && lado !== 'b') throw new Error('Argumento no válido: lado');
    return s.elegidas.registrar(
      await n.diffCarpetas.rutaParaEditor(
        idCorto(id, 'comparación', 64),
        enteroPositivo(idEntrada, 'archivo'),
        lado,
      ),
      'editor',
    ) as string;
  },
  'herramientas.optimizarPdf': (n, s, origen, destino) =>
    n.optimizarPdf(
      s.elegidas.exigir(origen, 'archivo'),
      s.elegidas.exigir(destino, 'archivo', 'guardar'),
    ),

  // La raíz es la carpeta de un proyecto (por id) o una ruta elegida en un diálogo; el resto son
  // textos y banderas acotados. Vuelve enseguida con el id: los resultados llegan por eventos.
  'buscar.iniciar': async (n, s, opciones) =>
    n.iniciarBusqueda(await opcionesBusqueda(n, s.elegidas, opciones)),
  'buscar.cancelar': (n, _s, id) => n.cancelarBusqueda(idCorto(id, 'búsqueda', 64)),
  // D44: la ruta de un resultado la pone el núcleo, nunca la ventana. Este proceso la registra con
  // el propósito 'editor' (el único que el editor de código acepta) y la devuelve.
  'buscar.prepararEditor': async (n, s, idBusqueda, idResultado) =>
    s.elegidas.registrar(
      await n.rutaDeResultadoBusqueda(
        idCorto(idBusqueda, 'búsqueda', 64),
        enteroPositivo(idResultado, 'resultado'),
      ),
      'editor',
    ) as string,

  // ---- Servidor MCP ----
  'mcp.estado': (n) => n.estadoMcp(),
  'mcp.iniciar': (n) => n.iniciarMcp(),
  'mcp.detener': (n) => n.detenerMcp(),
  'mcp.cambiarPuerto': (n, _s, puerto) => n.cambiarPuertoMcp(puertoUsuario(puerto)),
  // Lleva el token del MCP: va directo al portapapeles y no se devuelve.
  'mcp.configuracion': async (n, s) => {
    await s.copiar(await n.configuracionMcp());
  },
  'mcp.regenerarToken': (n) => n.regenerarTokenMcp(),
  'mcp.responderConfirmacion': (n, _s, id, aprobado) =>
    n.responderConfirmacionMcp(idCorto(id, 'confirmación', 64), booleano(aprobado, 'aprobado')),

  // ---- Captura de dumps: ids de sitio y de volcado; el núcleo arma rutas y archivos ----
  'depuracion.estado': (n) => n.estadoDepuracion(),
  'depuracion.activar': (n, _s, activa) => n.activarDepuracion(activaDepuracion(activa)),
  // La confirmación sale solo del diálogo que explica qué se define en el sitio.
  'depuracion.captura': (n, _s, id, activa, confirmacion) => {
    const sitio = idSitioDepuracion(id);
    const a = activaDepuracion(activa);
    const c = confirmacionDepuracion(confirmacion);
    return c ? n.capturaDumpsSitio(sitio, a, c) : n.capturaDumpsSitio(sitio, a);
  },
  'depuracion.lista': (n, _s, filtro) => n.listaDumps(filtroDumps(filtro)),
  'depuracion.leer': (n, _s, id) => n.leerDump(idDump(id)),
  'depuracion.limpiar': (n) => {
    n.limpiarDumps();
  },
  // Puede llevar secretos: va enmascarado y directo al portapapeles.
  'depuracion.copiar': async (n, s, id) => {
    await s.copiar(n.textoDumpParaCopiar(idDump(id)));
  },

  // ---- Visor de errores: ids, huellas y fechas; el archivo solo se abre si está en el sitio ----
  'errores.lista': (n, _s, filtro) => n.listaErrores(filtroErrores(filtro)),
  'errores.leer': (n, _s, huella) => n.leerError(huellaErrorIpc(huella)),
  'editor.abrirEn': (n, _s, sitioId, archivo, linea, editor) =>
    n.abrirEnEditor(
      idSitioDepuracion(sitioId),
      archivoEditor(archivo),
      lineaEditor(linea),
      idEditor(editor),
    ),
  'editor.disponibles': (n) => n.editores(),
  'editor.cambiarPorDefecto': (n, _s, editor) => n.cambiarEditorPredeterminado(idEditor(editor)),

  // ---- Centro de avisos ----
  // ---- Contenedores (motor de la lista blanca, id validado; nunca texto libre a la CLI) ----
  'contenedores.motores': (n) => n.contenedores.motores(),
  'contenedores.lista': (n, _s, motor) => n.contenedores.lista(motorContenedores(motor)),
  'contenedores.accion': async (n, _s, motor, id, accion, confirmacion) => {
    const m = motorContenedores(motor);
    const i = validarIdContenedor(id);
    const a = accionContenedor(accion);
    confirmacionContenedor(a, confirmacion);
    await n.contenedores.accion(m, i, a);
  },
  'contenedores.seguir': (n, s, motor, id) =>
    s.contenedores.seguir(n, s.emisor, motorContenedores(motor), validarIdContenedor(id)),
  'contenedores.dejar': (_n, s, motor, id) =>
    s.contenedores.dejar(s.emisor, motorContenedores(motor), validarIdContenedor(id)),

  'avisos.lista': (n) => n.avisos.lista(),
  // Sin ids marca todos; con ids, solo esos (lista acotada de ids cortos).
  'avisos.marcarLeidos': (n, _s, ids) => {
    n.avisos.marcarLeidos(ids === undefined ? undefined : listaTextos(ids, 200, 64, 'avisos'));
  },
  'avisos.limpiar': (n) => {
    n.avisos.limpiar();
  },
  // Preferencias: solo `nativas` (booleano) y `tipos` (tipos conocidos → booleano).
  'avisos.configurar': (n, _s, cambios) => n.configurarAvisos(cambiosAvisos(cambios)),

  // ---- Doctor y confianza de la CA ----
  'doctor.revisar': (n, _s, ids) => n.doctor.revisar(idsRevision(ids)),
  'doctor.reparar': (n, _s, id, confirmacion, reparacionId) =>
    n.doctor.reparar(
      textoAcotado(id, 1, 200, 'hallazgo'),
      confirmado(confirmacion),
      alternativaDoctor(reparacionId),
    ),
  'doctor.ultimo': (n) => n.doctor.ultimo(),
  'confianza.estado': (n) => n.estadoConfianza(),
  'confianza.nodeGlobal': (n, _s, activar, confirmacion) => {
    confirmado(confirmacion);
    return n.cambiarNodeGlobal(booleano(activar, 'activar'));
  },
  // Los perfiles fuera de la carpeta de Firefox piden una segunda confirmación, también === true.
  'confianza.firefox': (n, _s, activar, confirmacion, confirmacionFuera) => {
    confirmado(confirmacion);
    const fuera = confirmacionFuera === undefined ? false : confirmado(confirmacionFuera);
    return n.cambiarFirefoxConfianza(booleano(activar, 'activar'), fuera);
  },
};

/** Ids de revisión del renderer: solo los de `IDS_REVISION`, sin repetir de más. */
function idsRevision(v: unknown): IdRevision[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.length > IDS_REVISION.length) {
    throw new Error('Argumento no válido: revisiones');
  }
  for (const x of v) {
    if (typeof x !== 'string' || !(IDS_REVISION as readonly string[]).includes(x)) {
      throw new Error('Argumento no válido: revisiones');
    }
  }
  return v as IdRevision[];
}

/** La confirmación de un diálogo: exactamente `true` (nunca un valor por defecto). */
function confirmado(v: unknown): true {
  if (v !== true) throw new Error('Argumento no válido: confirmacion');
  return true;
}

/** Única reparación alternativa que existe: mover el puerto propio. */
function alternativaDoctor(v: unknown): 'cambiar-puerto' | undefined {
  if (v === undefined) return undefined;
  if (v !== 'cambiar-puerto') throw new Error('Argumento no válido: reparación');
  return v;
}

/** Cambios de preferencias de avisos del renderer, validados contra la lista de tipos. */
function cambiosAvisos(v: unknown): {
  nativas?: boolean;
  tipos?: Partial<Record<TipoAviso, boolean>>;
} {
  const o = objetoPlano<Record<string, unknown>>(v, 'avisos');
  for (const k of Object.keys(o)) {
    if (k !== 'nativas' && k !== 'tipos') throw new Error('Argumento no válido: avisos');
  }
  const salida: { nativas?: boolean; tipos?: Partial<Record<TipoAviso, boolean>> } = {};
  if (o['nativas'] !== undefined) salida.nativas = booleano(o['nativas'], 'nativas');
  if (o['tipos'] !== undefined) {
    const t = objetoPlano<Record<string, unknown>>(o['tipos'], 'tipos');
    const tipos: Partial<Record<TipoAviso, boolean>> = {};
    for (const [k, valor] of Object.entries(t)) {
      if (!(TIPOS_AVISO as readonly string[]).includes(k)) {
        throw new Error('Argumento no válido: tipos');
      }
      tipos[k as TipoAviso] = booleano(valor, 'tipos');
    }
    salida.tipos = tipos;
  }
  return salida;
}

/** Máximo de un dato estructurado de error (una ruta). */
const MAX_DATO_ERROR = 1024;

/**
 * Datos estructurados del error, por lista blanca: `respaldoPrevio` (texto acotado) y los
 * parámetros que el código de un `ErrorWolf` declara en el núcleo. Nunca la traza, la causa ni
 * otras propiedades del error.
 */
function datosError(e: unknown, codigo: unknown): DatosError | undefined {
  const previo = (e as { respaldoPrevio?: unknown } | null)?.respaldoPrevio;
  const propios =
    typeof codigo === 'string' && e instanceof ErrorWolf
      ? datosPermitidos(codigo, e.datos)
      : undefined;
  const conPrevio =
    typeof previo === 'string' && previo !== '' && previo.length <= MAX_DATO_ERROR
      ? { respaldoPrevio: previo }
      : undefined;
  if (!propios && !conPrevio) return undefined;
  return { ...propios, ...conPrevio };
}

function aError(e: unknown): ResultadoIpc<never> {
  const mensaje = e instanceof Error ? e.message : String(e);
  const codigo = (e as { codigo?: unknown } | null)?.codigo;
  const datos = datosError(e, codigo);
  return {
    ok: false,
    error: {
      mensaje,
      ...(typeof codigo === 'string' ? { codigo } : {}),
      ...(datos ? { datos } : {}),
    },
  };
}

/** Registra los canales `entorno:<ruta>` y reenvía los eventos del núcleo a la ventana. */
export function registrarIpc(
  nucleo: NucleoIpc,
  ipcMain: IpcMainLike,
  ventana: VentanaLike,
  sistema: ApiSistema,
  emisorValido: (evento: unknown) => boolean = () => true,
  elegidas: RutasElegidas = new RutasElegidas(),
  opciones: OpcionesIpc = {},
): () => void {
  const seguimientos = opciones.seguimientos ?? new Seguimientos();
  const contenedores = opciones.contenedores ?? new SeguimientosContenedores();
  const contexto: Omit<Contexto, 'emisor'> = {
    ...sistema,
    elegidas,
    secretos: opciones.secretos ?? SECRETOS_NO_DISPONIBLES,
    metricas: opciones.metricas ?? new ControlMetricas(nucleo),
    captura: opciones.captura ?? CAPTURA_NO_DISPONIBLE,
    seguimientos,
    contenedores,
    carpetaProyectosPorDefecto:
      opciones.carpetaProyectosPorDefecto ?? CARPETA_PROYECTOS_POR_DEFECTO,
    idiomaSistema: opciones.idiomaSistema ?? (() => 'es'),
    aplicarPreferencias: opciones.aplicarPreferencias ?? (() => undefined),
    alCambiarWorkspaces: opciones.alCambiarWorkspaces ?? (() => undefined),
    alCambiarEditorSinGuardar: opciones.alCambiarEditorSinGuardar ?? (() => undefined),
  };
  for (const [ruta, fn] of Object.entries(TABLA) as [RutaIpc, Manejador][]) {
    ipcMain.handle(`${PREFIJO_CANAL}${ruta}`, async (e, ...args) => {
      try {
        if (!emisorValido(e)) throw new Error('Origen no permitido');
        const emisor = (e as { sender?: unknown } | null)?.sender;
        const valor = await (fn as (...a: unknown[]) => unknown)(
          nucleo,
          { ...contexto, emisor },
          ...args,
        );
        return { ok: true, valor } satisfies ResultadoIpc;
      } catch (e) {
        return aError(e);
      }
    });
  }
  const bajas = EVENTOS_IPC.map((nombre) =>
    nucleo.eventos.on(nombre, (dato) => {
      if (ventana.isDestroyed()) return;
      ventana.webContents.send(CANAL_EVENTO, { nombre, dato });
    }),
  );
  return () => {
    bajas.forEach((b) => b());
    seguimientos.dejarTodo();
    contenedores.dejarTodo();
  };
}
