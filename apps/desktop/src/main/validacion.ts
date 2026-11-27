import { stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { MODOS_CAPTURA, type ModoCaptura } from '../shared/captura';
import {
  CLAVES_RAPIDAS,
  LIMITE_MANUAL,
  LIMITE_REGLAS,
  textoVhostValido,
  type CambioVhost,
  type ClaveRapida,
  MAX_BYTES_INI,
  NOMBRE_EXTENSION_PHP,
  ErrorWolf,
  MAX_BYTES_EDITOR,
  type OpcionesAbrirArchivo,
  type OpcionesGuardarArchivo,
  tokenTunelValido,
  IDS_PROVEEDOR_TUNEL,
  dominioPublicoValido,
  nombreTunelValido,
  type IdProveedorTunel,
  HERRAMIENTAS_BD,
  IDS_AGENTE,
  IDS_EDITOR,
  IDS_TERMINAL,
  MAX_MENSAJE_COMMIT,
  type HerramientaBd,
  type IdEditor,
  type IdTerminal,
  type IdAgente,
  ID_PROVEEDOR_IA,
  ID_PROVEEDOR_SMTP,
  destinatarioValido,
  IDS_CAPTADOR,
  ID_WORKSPACE,
  ID_TAREA,
  IDS_SERVICIO_DATOS,
  TIPOS_PROVEEDOR_IA,
  validarModeloIa,
  type ConfigProveedorIa,
  type OpcionesEnvIa,
  type PedidoEnv,
  type TipoProveedorIa,
  NOMBRE_BD_MONGO,
  NOMBRE_BD_MYSQL,
  NOMBRE_BD_PG,
  NOMBRE_MODELO_OLLAMA,
  TIPOS_SITIO,
  TIPOS_GENERADOR,
  type PedidoProyecto,
  type IdCaptador,
  type IdServicioDatos,
  type MotorBd,
  type ServicioInstalable,
  type TipoRuntime,
  type TipoSitio,
  esIdInstancia,
  esTipoRuntime,
  esServicioVersiones,
  parsearInstancia,
  type IdInstancia,
  type ServicioVersiones,
  type TipoRespaldoDatos,
  type OpcionesExportarPerfil,
  type OpcionesImportarPerfil,
  type PrefijoRuta,
} from '@pel/core';

/** Terminal elegida: un id conocido; `undefined` o null = la predeterminada. */
export function idTerminal(v: unknown): IdTerminal | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string' || !(IDS_TERMINAL as readonly string[]).includes(v)) {
    throw new ErrorWolf('terminal.invalida', 'Terminal no válida.');
  }
  return v as IdTerminal;
}

/** Herramienta de base de datos: Adminer o phpMyAdmin (nada más). */
export function herramientaBd(v: unknown): HerramientaBd {
  if (typeof v !== 'string' || !(HERRAMIENTAS_BD as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: herramienta');
  }
  return v as HerramientaBd;
}

/** Id de una instantánea de base: el que dio el núcleo (fecha y azar), nunca una ruta. */
export function idInstantanea(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{8}-\d{6}-[0-9a-f]{6}$/.test(v)) {
    throw new Error('Argumento no válido: instantánea');
  }
  return v;
}

/**
 * Volver a una instantánea solo si quien llama escribió el nombre exacto de la base: la
 * confirmación se comprueba aquí, en el proceso principal, no en la interfaz.
 */
export function confirmadoVolver(escrito: unknown, base: string): true {
  if (typeof escrito !== 'string' || escrito !== base) {
    throw new Error('Argumento no válido: confirmación');
  }
  return true;
}

/**
 * Opciones de volver. `sinGuardarEstado` (volver sin guardar el estado actual) solo se acepta con
 * el vale que emitió el núcleo al fallar el respaldo previo y con una segunda confirmación
 * (el nombre de la base escrito de nuevo); cualquier otra clave se rechaza.
 */
export function opcionesVolver(
  v: unknown,
  base: string,
): { sinGuardarEstado?: boolean; vale?: string } {
  if (v === undefined || v === null) return {};
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  for (const k of Object.keys(o)) {
    if (k !== 'sinGuardarEstado' && k !== 'vale' && k !== 'confirmacion') {
      throw new Error('Argumento no válido: opciones');
    }
  }
  if (o.sinGuardarEstado === undefined || !booleano(o.sinGuardarEstado, 'sinGuardarEstado')) {
    return {};
  }
  if (typeof o.vale !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(o.vale)) {
    throw new Error('Argumento no válido: vale');
  }
  if (o.confirmacion !== base) throw new Error('Argumento no válido: confirmación');
  return { sinGuardarEstado: true, vale: o.vale };
}

/** Editor elegido: un id conocido; `undefined` o null = el predeterminado. */
export function idEditor(v: unknown): IdEditor | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string' || !(IDS_EDITOR as readonly string[]).includes(v)) {
    throw new ErrorWolf('herramientas.editor_invalido', 'Editor no válido.');
  }
  return v as IdEditor;
}

export function texto(v: unknown, nombre = 'valor'): string {
  if (typeof v !== 'string') throw new Error(`Argumento no válido: ${nombre}`);
  return v;
}

/** Id de un workspace: minúsculas, dígitos, guion y guion bajo (el mismo patrón que el núcleo). */
export function idWorkspace(v: unknown): string {
  if (typeof v !== 'string' || !ID_WORKSPACE.test(v)) {
    throw new Error('Argumento no válido: workspace');
  }
  return v;
}

/** Id de un proyecto en las rutas de tareas programadas (nunca una ruta). */
export function idSitioTarea(v: unknown): string {
  if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(v)) {
    throw new Error('Argumento no válido: proyecto');
  }
  return v;
}

/** Id de una tarea programada (el mismo patrón que el núcleo). */
export function idTarea(v: unknown): string {
  if (typeof v !== 'string' || !ID_TAREA.test(v)) throw new Error('Argumento no válido: tarea');
  return v;
}

/** Huella (SHA-256 en hexadecimal) del comando que el usuario vio al confirmar una tarea. */
export function huellaDeTarea(v: unknown): string {
  if (typeof v !== 'string' || !/^[0-9a-f]{64}$/.test(v)) {
    throw new Error('Argumento no válido: huella');
  }
  return v;
}

export function idNoVacio(v: unknown, nombre = 'id'): string {
  if (typeof v !== 'string' || v.trim() === '') throw new Error(`Argumento no válido: ${nombre}`);
  return v;
}

/** Modo de captura de pantalla (D35): solo uno de los tres. */
export function modoCaptura(v: unknown): ModoCaptura {
  if (typeof v !== 'string' || !(MODOS_CAPTURA as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: modo');
  }
  return v as ModoCaptura;
}

export function objetoPlano<T extends object>(v: unknown, nombre = 'objeto'): T {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  const proto = Object.getPrototypeOf(v) as unknown;
  if (proto !== Object.prototype && proto !== null) {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  return v as T;
}

/** Entero dentro de [min, max]. */
export function enteroEn(v: unknown, min: number, max: number, nombre = 'valor'): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    throw new Error(`Argumento no válido: ${nombre} (entre ${min} y ${max})`);
  }
  return v;
}

const INSTALABLES = [
  'nginx',
  'php',
  'cloudflared',
  'mysql',
  'mariadb',
  'postgresql',
  'redis',
  'mongodb',
  'mongosh',
  'mailpit',
  'smtp4dev',
  'inbucket',
  'papercut',
  'ollama',
  'meilisearch',
  'node',
  'python',
  'java',
  'dotnet',
  'go',
  'rust',
  'bun',
  'deno',
  'zig',
  'kotlin',
  'dart',
  'ruby',
  'maven',
  'gradle',
] as const;

/** Todo lo que el catálogo puede dejar en bin/ (también herramientas): para `instalados`. */
const DEL_CATALOGO = [
  ...INSTALABLES,
  'composer',
  'adminer',
  'phpmyadmin',
  'pgvector-src',
] as const satisfies readonly ServicioInstalable[];

/** Un servicio o herramienta del catálogo; nada de rutas ni nombres arbitrarios. */
export function servicioDelCatalogo(v: unknown): ServicioInstalable {
  if (typeof v !== 'string' || !(DEL_CATALOGO as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: servicio');
  }
  return v as ServicioInstalable;
}

/**
 * Filtro del listado de versiones: rama ("8.4", "22"), mostrar todas y refrescar. Nada más pasa.
 */
export function filtroVersiones(v: unknown): {
  rama?: string;
  todas?: boolean;
  refrescar?: boolean;
} {
  if (v === undefined || v === null) return {};
  const o = objetoPlano<Record<string, unknown>>(v, 'filtro');
  const salida: { rama?: string; todas?: boolean; refrescar?: boolean } = {};
  for (const k of Object.keys(o)) {
    if (k !== 'rama' && k !== 'todas' && k !== 'refrescar') {
      throw new Error('Argumento no válido: filtro');
    }
  }
  if (o['rama'] !== undefined) {
    if (typeof o['rama'] !== 'string' || !/^\d{1,4}(\.\d{1,4})?$/.test(o['rama'])) {
      throw new Error('Argumento no válido: versión principal');
    }
    salida.rama = o['rama'];
  }
  for (const k of ['todas', 'refrescar'] as const) {
    if (o[k] === undefined) continue;
    if (typeof o[k] !== 'boolean') throw new Error(`Argumento no válido: ${k}`);
    salida[k] = o[k];
  }
  return salida;
}

export function servicioInstalable(v: unknown): (typeof INSTALABLES)[number] {
  if (typeof v !== 'string' || !(INSTALABLES as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: servicio');
  }
  return v as (typeof INSTALABLES)[number];
}

/** Solo direcciones http/https. */
export function urlHttp(v: unknown): string {
  const t = texto(v, 'url');
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    throw new Error('La dirección no es válida');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Solo se pueden abrir direcciones http o https');
  }
  return u.toString();
}

const OCTETO = String.raw`(?:25[0-5]|2[0-4]\d|1?\d?\d)`;
const FTP_SEGURA = new RegExp(
  String.raw`^ftp://([A-Za-z0-9._~%!$&'()*+,;=-]{1,100})@(${OCTETO}(?:\.${OCTETO}){3}):(\d{1,5})/$`,
);
// Un usuario decodificado no puede llevar controles ni barras (@ y : sí, van codificados).
// eslint-disable-next-line no-control-regex
const USUARIO_PROHIBIDO = /[\u0000-\u001f\u007f/\\]/;

/**
 * Solo la forma exacta `ftp://usuario@ip:puerto/`: sin contraseña, sin ruta, consulta ni
 * fragmento, y con el host como IPv4 (127.0.0.1 o la IP local).
 */
export function urlFtpSegura(v: unknown): string {
  const t = texto(v, 'url');
  const m = FTP_SEGURA.exec(t);
  const puerto = m ? Number(m[3]) : 0;
  let usuario = '';
  try {
    usuario = m ? decodeURIComponent(m[1] ?? '') : '';
  } catch {
    usuario = '';
  }
  if (!m || puerto < 1 || puerto > 65535 || !usuario || USUARIO_PROHIBIDO.test(usuario)) {
    throw new Error('La dirección FTP no es válida');
  }
  return t;
}

/** Uno de los valores permitidos (nunca otro texto). */
export function unoDe<T extends string>(v: unknown, permitidos: readonly T[], nombre = 'valor'): T {
  const t = texto(v, nombre);
  const r = permitidos.find((p) => p === t);
  if (r === undefined) throw new Error(`El valor de ${nombre} no es válido`);
  return r;
}

const IPV4 = new RegExp(String.raw`^${OCTETO}(?:\.${OCTETO}){3}$`);

/** Una dirección IPv4 con cuatro octetos (el núcleo comprueba que sea de la red local). */
export function ipv4(v: unknown, nombre = 'ip'): string {
  const t = texto(v, nombre);
  if (!IPV4.test(t)) throw new Error(`La dirección ${nombre} no es válida`);
  return t;
}

/** Direcciones que la app puede abrir con el sistema: http, https o la URL FTP segura. */
export function urlAbrible(v: unknown): string {
  if (typeof v === 'string' && v.startsWith('ftp:')) return urlFtpSegura(v);
  return urlHttp(v);
}

/** Devuelve la ruta absoluta si existe y es una carpeta. */
export async function carpetaExistente(v: unknown): Promise<string> {
  const ruta = resolve(texto(v, 'ruta'));
  try {
    if ((await stat(ruta)).isDirectory()) return ruta;
  } catch {
    // cae al error común
  }
  throw new Error('La ruta no es una carpeta');
}

/** Devuelve la ruta absoluta si existe y es un archivo (no una carpeta). */
export async function archivoExistente(v: unknown): Promise<string> {
  const ruta = resolve(texto(v, 'archivo'));
  try {
    if ((await stat(ruta)).isFile()) return ruta;
  } catch {
    // cae al error común
  }
  throw new Error('El archivo no existe');
}

export function booleano(v: unknown, nombre = 'valor'): boolean {
  if (typeof v !== 'boolean') throw new Error(`Argumento no válido: ${nombre}`);
  return v;
}

const tieneControl = (t: string): boolean => [...t].some((c) => c.charCodeAt(0) < 0x20);

/**
 * Texto de largo acotado y sin caracteres de control. El mensaje de error nunca repite el valor
 * (puede ser una clave).
 */
export function textoAcotado(v: unknown, min: number, max: number, nombre = 'valor'): string {
  if (typeof v !== 'string' || v.length < min || v.length > max || tieneControl(v)) {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  return v;
}

/** Puerto elegido por el usuario para un servicio propio. */
export function puertoUsuario(v: unknown): number {
  return enteroEn(v, 1024, 65535, 'puerto');
}

/** Puerto HTTPS: 443 o uno de usuario. */
export function puertoHttps(v: unknown): number {
  if (typeof v === 'number' && Number.isInteger(v) && (v === 443 || (v >= 1024 && v <= 65535))) {
    return v;
  }
  throw new Error('Argumento no válido: puerto (443 o entre 1024 y 65535)');
}

const MOTORES = ['mysql', 'mariadb', 'postgresql', 'mongodb'] as const;

export function motorBd(v: unknown): MotorBd {
  if (typeof v !== 'string' || !(MOTORES as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: motor');
  }
  return v as MotorBd;
}

/** Motores con respaldo, restauración e importación (no MongoDB). */
export function motorSql(v: unknown): Exclude<MotorBd, 'mongodb'> {
  const m = motorBd(v);
  if (m === 'mongodb') throw new Error('Argumento no válido: motor');
  return m;
}

const NOMBRE_POR_MOTOR: Record<MotorBd, RegExp> = {
  mysql: NOMBRE_BD_MYSQL,
  mariadb: NOMBRE_BD_MYSQL,
  postgresql: NOMBRE_BD_PG,
  mongodb: NOMBRE_BD_MONGO,
};

/** Nombre de base (o de usuario) con la misma regla que aplica el núcleo para ese motor. */
export function nombreBase(motor: MotorBd, v: unknown, nombre = 'nombre de la base'): string {
  if (typeof v !== 'string' || !NOMBRE_POR_MOTOR[motor].test(v)) {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  return v;
}

export function nombreModelo(v: unknown): string {
  if (typeof v !== 'string' || !NOMBRE_MODELO_OLLAMA.test(v)) {
    throw new Error('Argumento no válido: modelo');
  }
  return v;
}

/** Hasta 16 nombres de modelo de Ollama (la comprobación de «qué cabe en su equipo»). */
export function nombresModelo(v: unknown): string[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > 16) {
    throw new Error('Argumento no válido: modelos');
  }
  return v.map(nombreModelo);
}

export function idServicioDatos(v: unknown): IdServicioDatos {
  if (typeof v !== 'string' || !(IDS_SERVICIO_DATOS as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: servicio');
  }
  return v as IdServicioDatos;
}

/** Id de un captador de correo local (D21). */
export function idCaptador(v: unknown): IdCaptador {
  if (typeof v !== 'string' || !(IDS_CAPTADOR as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: captador');
  }
  return v as IdCaptador;
}

export function tipoProyecto(v: unknown): TipoSitio | 'generico' {
  if (v === 'generico') return v;
  if (typeof v !== 'string' || !(TIPOS_SITIO as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: tipo de proyecto');
  }
  return v as TipoSitio;
}

/** Rama de PHP ("8.4") o null (el más reciente instalado). */
export function ramaPhp(v: unknown): string | null {
  if (v === null) return null;
  if (typeof v !== 'string' || !/^\d+\.\d+$/.test(v))
    throw new Error('Argumento no válido: versión principal');
  return v;
}

/** Para qué se eligió una ruta: `abrir` (leer, diálogo de abrir) o `guardar` (destino). */
export type PropositoRuta = 'abrir' | 'guardar' | 'editor' | 'compartir';

/**
 * Rutas que el usuario eligió en los diálogos de esta sesión. Las rutas que leen o escriben
 * archivos (restaurar, formato, carpeta de respaldo) solo aceptan rutas de aquí: el renderer no
 * puede inventar una ruta.
 */
export class RutasElegidas {
  /** Clave de la ruta → para qué se eligió: leer (diálogo de abrir) o escribir (guardar como). */
  private readonly rutas = new Map<string, Set<PropositoRuta>>();

  /** Misma ruta aunque cambien mayúsculas, separadores o la barra final (Windows). */
  private clave(ruta: string): string {
    return resolve(ruta).replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
  }

  registrar(ruta: string | null, proposito: PropositoRuta = 'abrir'): string | null {
    if (ruta) {
      const k = this.clave(ruta);
      const p = this.rutas.get(k) ?? new Set<PropositoRuta>();
      p.add(proposito);
      this.rutas.set(k, p);
    }
    return ruta;
  }

  /** ¿Se eligió esta ruta en un diálogo con ese propósito? */
  tiene(ruta: string, proposito: PropositoRuta = 'abrir'): boolean {
    return this.rutas.get(this.clave(ruta))?.has(proposito) === true;
  }

  exigir(v: unknown, tipo: 'archivo' | 'carpeta', proposito: PropositoRuta = 'abrir'): string {
    const t = texto(v, tipo);
    if (!this.tiene(t, proposito)) {
      throw new Error(
        tipo === 'archivo'
          ? 'Elija el archivo desde el diálogo'
          : 'Elija la carpeta desde el diálogo',
      );
    }
    return t;
  }
}

/** Como textoAcotado, pero admite tabulador y saltos de línea (texto escrito por el usuario). */
export function textoLibre(v: unknown, min: number, max: number, nombre = 'valor'): string {
  if (
    typeof v !== 'string' ||
    v.length < min ||
    v.length > max ||
    [...v].some((c) => c.charCodeAt(0) < 0x20 && !'\t\r\n'.includes(c))
  ) {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  return v;
}

/* ───────────── Etapa B ───────────── */

/** Id de sitio, de paso, de proceso o de fuente de registro: texto corto y sin controles. */
export function idCorto(v: unknown, nombre = 'id', max = 128): string {
  const t = textoAcotado(v, 1, max, nombre);
  if (t.trim() === '') throw new Error(`Argumento no válido: ${nombre}`);
  return t;
}

/** Ruta absoluta (aún puede no existir), sin controles y de largo razonable. */
export function rutaAbsoluta(v: unknown, nombre = 'ruta'): string {
  const t = textoAcotado(v, 3, 260, nombre);
  if (!isAbsolute(t) || t.startsWith('\\\\')) throw new Error(`Argumento no válido: ${nombre}`);
  return resolve(t);
}

export function tipoRuntime(v: unknown): TipoRuntime {
  if (!esTipoRuntime(v)) throw new Error('Argumento no válido: runtime');
  return v;
}

/** PID de un proceso (los del sistema los rechaza el núcleo con su propio mensaje). */
export function pid(v: unknown): number {
  return enteroEn(v, 1, 0xffffffff, 'pid');
}

/** Lista de textos con largo y cantidad acotados. */
export function listaTextos(
  v: unknown,
  maxElementos: number,
  maxLargo: number,
  nombre = 'lista',
): string[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > maxElementos) {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  return v.map((x) => textoAcotado(x, 1, maxLargo, nombre));
}

/** Bytes que manda la interfaz (una imagen): `Uint8Array` no vacío y con tope. */
export function bytesAcotados(v: unknown, max: number, nombre = 'datos'): Uint8Array {
  if (!(v instanceof Uint8Array) || v.byteLength === 0 || v.byteLength > max) {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  return v;
}

/** Tamaño máximo (JSON) de una receta o de un wolfcore.yml que manda la interfaz. */
export const MAX_BYTES_RECETA = 64 * 1024;
/** Pasos como máximo en una receta que manda la interfaz. */
export const MAX_PASOS_RECETA = 50;

/** Objeto (o arreglo) serializable que no pasa de `max` caracteres en JSON. */
export function acotadoJson<T>(v: unknown, max: number, nombre: string): T {
  let largo: number;
  try {
    largo = JSON.stringify(v)?.length ?? 0;
  } catch {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  if (largo === 0 || largo > max)
    throw new Error(`Argumento no válido: ${nombre} (demasiado grande)`);
  return v as T;
}

/* ───────────── Etapa C: IA en la nube ───────────── */

/** Error de argumento de las rutas de IA, con código (la interfaz lo traduce). */
function argumentoIa(campo: string): ErrorWolf {
  return new ErrorWolf('ia.argumento_invalido', `Argumento no válido: ${campo}`, { campo });
}

/** Id de un proveedor de IA (`ID_PROVEEDOR_IA`): sirve de nombre de archivo del secreto. */
export function idProveedorIa(v: unknown): string {
  if (typeof v !== 'string' || !ID_PROVEEDOR_IA.test(v)) throw argumentoIa('proveedor');
  return v;
}

/** Id de un sitio para las rutas de IA (el núcleo busca la carpeta por él). */
export function idSitioIa(v: unknown): string {
  if (typeof v !== 'string' || v.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v)) {
    throw argumentoIa('sitio');
  }
  return v;
}

const CAMPOS_PROVEEDOR_IA = new Set(['id', 'tipo', 'nombre', 'urlBase', 'modelo']);
/** Largo máximo de una URL base (como `ConfigProveedorIaSchema`). */
export const MAX_URL_BASE_IA = 500;

/**
 * Configuración NO secreta de un proveedor. Solo los campos conocidos: una clave pegada aquí
 * (o cualquier otro campo) se rechaza. La URL y el modelo los vuelve a validar el núcleo.
 */
export function configProveedorIa(v: unknown): ConfigProveedorIa {
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'proveedor');
  } catch {
    throw argumentoIa('proveedor');
  }
  for (const k of Object.keys(o)) if (!CAMPOS_PROVEEDOR_IA.has(k)) throw argumentoIa('proveedor');
  const tipo = o['tipo'];
  // Ollama tiene su propia sección (IA local): el diálogo de proveedores en la nube no lo manda.
  if (
    typeof tipo !== 'string' ||
    tipo === 'ollama' ||
    !(TIPOS_PROVEEDOR_IA as readonly string[]).includes(tipo)
  ) {
    throw argumentoIa('tipo');
  }
  const nombre = o['nombre'];
  if (
    typeof nombre !== 'string' ||
    nombre.trim() === '' ||
    nombre.length > 60 ||
    tieneControl(nombre)
  ) {
    throw argumentoIa('nombre');
  }
  const urlBase = o['urlBase'] ?? null;
  if (
    urlBase !== null &&
    (typeof urlBase !== 'string' || urlBase.length > MAX_URL_BASE_IA || tieneControl(urlBase))
  ) {
    throw argumentoIa('urlBase');
  }
  const modelo = o['modelo'] ?? null;
  if (modelo !== null && (typeof modelo !== 'string' || modelo.length > 200)) {
    throw argumentoIa('modelo');
  }
  return {
    id: idProveedorIa(o['id']),
    tipo: tipo as TipoProveedorIa,
    nombre: nombre.trim(),
    urlBase: urlBase === null || urlBase.trim() === '' ? null : urlBase.trim(),
    modelo: modelo === null || modelo.trim() === '' ? null : modelo.trim(),
  };
}

/** Clave de un proveedor: ASCII visible sin espacios, 1–4096. El error nunca la repite. */
export function claveIa(v: unknown): string {
  const t = typeof v === 'string' ? v.trim() : '';
  if (!/^[\x21-\x7e]{1,4096}$/.test(t)) {
    throw new ErrorWolf(
      'ia.clave_mal_formada',
      'La clave no tiene un formato válido: sin espacios ni saltos de línea y de hasta 4096 caracteres.',
    );
  }
  return t;
}

/** Nombre de modelo de un proveedor (el núcleo lo vuelve a validar). */
export function modeloIa(v: unknown): string {
  if (typeof v !== 'string' || v.length > 200) {
    throw new ErrorWolf('ia.modelo_invalido', 'El nombre del modelo no es válido.');
  }
  validarModeloIa(v);
  return v;
}

/** Objeto plano solo con las claves permitidas (si no, error de argumento con `campo`). */
function opcionesIa(v: unknown, campo: string, permitidas: readonly string[]) {
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, campo);
  } catch {
    throw argumentoIa(campo);
  }
  for (const k of Object.keys(o)) if (!permitidas.includes(k)) throw argumentoIa(campo);
  return o;
}

/** Confirmación aparte opcional: solo cuenta si es exactamente `true` (otro tipo = error). */
function confirmacionOpcional(v: unknown, campo: string): boolean {
  if (v === undefined) return false;
  if (typeof v !== 'boolean') throw argumentoIa(campo);
  return v;
}

/** `{limpiarRespaldos?}` al borrar una clave o un proveedor. */
export function opcionesBorrarClaveIa(v: unknown): { limpiarRespaldos: boolean } {
  if (v === undefined) return { limpiarRespaldos: false };
  const o = opcionesIa(v, 'opciones', ['limpiarRespaldos']);
  return { limpiarRespaldos: confirmacionOpcional(o['limpiarRespaldos'], 'limpiarRespaldos') };
}

/**
 * Opciones de `ia.escribirEnv`. `confirmado` debe ser exactamente `true` (si no,
 * `ia.env_sin_confirmar`); `agregarGitignore` es obligatorio; las confirmaciones aparte solo
 * se pasan al núcleo cuando son `true`.
 */
export function opcionesEnvIa(v: unknown): OpcionesEnvIa {
  const sinConfirmar = (): ErrorWolf =>
    new ErrorWolf(
      'ia.env_sin_confirmar',
      'Confirme que quiere escribir la clave en el .env (queda en texto plano).',
    );
  if (v === undefined || v === null) throw sinConfirmar();
  const o = opcionesIa(v, 'opciones', [
    'modelo',
    'confirmado',
    'agregarGitignore',
    'aceptarVersionado',
    'reemplazarAjenas',
  ]);
  if (o['confirmado'] !== true) throw sinConfirmar();
  if (typeof o['agregarGitignore'] !== 'boolean') throw argumentoIa('agregarGitignore');
  const salida: OpcionesEnvIa = { confirmado: true, agregarGitignore: o['agregarGitignore'] };
  if (o['modelo'] !== undefined) salida.modelo = modeloIa(o['modelo']);
  if (confirmacionOpcional(o['aceptarVersionado'], 'aceptarVersionado')) {
    salida.aceptarVersionado = true;
  }
  if (confirmacionOpcional(o['reemplazarAjenas'], 'reemplazarAjenas')) {
    salida.reemplazarAjenas = true;
  }
  return salida;
}

/* ───────────── Etapa C: agentes y commit sugerido ───────────── */

/** Agente soportado (`IDS_AGENTE`); otro valor es `agentes.no_existe`. */
export function idAgente(v: unknown): IdAgente {
  if (typeof v !== 'string' || !(IDS_AGENTE as readonly string[]).includes(v)) {
    throw new ErrorWolf('agentes.no_existe', 'Ese agente no está soportado.');
  }
  return v as IdAgente;
}

/** Confirmación del diálogo: exactamente `true` (si no, `agentes.sin_confirmar`). */
export function confirmadoAgente(v: unknown): true {
  if (v !== true) {
    throw new ErrorWolf(
      'agentes.sin_confirmar',
      'Confirme la acción en el diálogo antes de continuar.',
    );
  }
  return true;
}

/** Id de un sitio para las rutas de agentes y del commit (nunca una ruta). */
export function idSitioAgente(v: unknown): string {
  if (typeof v !== 'string' || v.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v)) {
    throw new ErrorWolf('agentes.argumento_invalido', 'Argumento no válido: sitio', {
      campo: 'sitio',
    });
  }
  return v;
}

/** Mensaje de "Hacer commit": texto no vacío, sin NUL, de hasta `MAX_MENSAJE_COMMIT`. */
export function mensajeCommit(v: unknown): string {
  if (
    typeof v !== 'string' ||
    v.trim() === '' ||
    v.length > MAX_MENSAJE_COMMIT ||
    v.includes('\0')
  ) {
    throw new ErrorWolf('git.mensaje_invalido', 'El mensaje de commit está vacío o no es válido.');
  }
  return v;
}

// ---- PHP: php.ini por rama y extensiones ----

function argumentoPhp(campo: string): ErrorWolf {
  return new ErrorWolf('php.argumento_invalido', `Argumento no válido: ${campo}`, { campo });
}

/** Rama de PHP ("8.4"); que esté instalada lo comprueba el núcleo. */
export function ramaPhpIni(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{1,2}\.\d{1,2}$/.test(v)) throw argumentoPhp('rama');
  return v;
}

/** Texto completo de un php.ini: sin NUL y de hasta `MAX_BYTES_INI`. */
export function textoIni(v: unknown): string {
  if (typeof v !== 'string' || v.includes('\0') || Buffer.byteLength(v, 'utf8') > MAX_BYTES_INI) {
    throw argumentoPhp('php.ini');
  }
  return v;
}

/** Valores rápidos: solo claves de `CLAVES_RAPIDAS` con texto corto (el núcleo los valida). */
export function valoresRapidos(v: unknown): Partial<Record<ClaveRapida, string>> {
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'valores');
  } catch {
    throw argumentoPhp('valores');
  }
  const res: Partial<Record<ClaveRapida, string>> = {};
  for (const [k, valor] of Object.entries(o)) {
    if (!(CLAVES_RAPIDAS as readonly string[]).includes(k)) throw argumentoPhp('valores');
    if (typeof valor !== 'string' || valor.length > 200) throw argumentoPhp(k);
    res[k as ClaveRapida] = valor;
  }
  return res;
}

/** Nombre de una copia del php.ini (`php.ini-<fecha>.txt`): nunca una ruta. */
export function respaldoIni(v: unknown): string {
  if (typeof v !== 'string' || !/^php\.ini-[0-9TZ-]{10,40}\.txt$/.test(v)) {
    throw argumentoPhp('respaldo');
  }
  return v;
}

export function nombreExtensionPhp(v: unknown): string {
  if (typeof v !== 'string' || !NOMBRE_EXTENSION_PHP.test(v)) throw argumentoPhp('extensión');
  return v;
}

export function activaExtension(v: unknown): boolean {
  if (typeof v !== 'boolean') throw argumentoPhp('activa');
  return v;
}

// ---- PHP por sitio: ajustes propios y Xdebug (el núcleo valida claves, valores y modos) ----

/** Id de un sitio (nunca una ruta). */
export function idSitioPhp(v: unknown): string {
  if (typeof v !== 'string' || v.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v)) {
    throw argumentoPhp('sitio');
  }
  return v;
}

/** Ajustes propios: objeto plano de hasta 40 pares texto → texto corto. */
export function ajustesPhpSitio(v: unknown): Record<string, string> {
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'phpIni');
  } catch {
    throw argumentoPhp('phpIni');
  }
  const entradas = Object.entries(o);
  if (entradas.length > 40) throw argumentoPhp('phpIni');
  const res: Record<string, string> = {};
  for (const [k, valor] of entradas) {
    if (k.length > 128 || typeof valor !== 'string' || valor.length > 256) {
      throw argumentoPhp('phpIni');
    }
    res[k] = valor;
  }
  return res;
}

/** Xdebug del sitio: null (quitarlo) o un objeto plano (el núcleo valida cada campo). */
export function xdebugSitio(v: unknown): Record<string, unknown> | null {
  if (v === null) return null;
  try {
    return objetoPlano<Record<string, unknown>>(v, 'xdebug');
  } catch {
    throw argumentoPhp('xdebug');
  }
}

// ---- Editor de vhost de Nginx: id del sitio, texto acotado y nombre de versión (nunca rutas) ----

function argumentoNginx(campo: string): ErrorWolf {
  return new ErrorWolf('nginx.argumento_invalido', `Argumento no válido: ${campo}`, { campo });
}

/** Id de un sitio (nunca una ruta). */
export function idSitioNginx(v: unknown): string {
  if (typeof v !== 'string' || v.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v)) {
    throw argumentoNginx('sitio');
  }
  return v;
}

/**
 * Cambio del editor: `{reglas?: texto}` y/o `{manual?: texto | null}`, nada más. Texto acotado y
 * sin NUL ni controles; las directivas las revisa el núcleo.
 */
export function cambioVhost(v: unknown): CambioVhost {
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'cambio');
  } catch {
    throw argumentoNginx('cambio');
  }
  const claves = Object.keys(o);
  if (claves.length === 0 || claves.some((k) => k !== 'reglas' && k !== 'manual')) {
    throw argumentoNginx('cambio');
  }
  const res: CambioVhost = {};
  if ('reglas' in o) {
    if (!textoVhostValido(o['reglas'], LIMITE_REGLAS)) throw argumentoNginx('reglas');
    res.reglas = o['reglas'];
  }
  if ('manual' in o) {
    const m = o['manual'];
    if (m !== null && !textoVhostValido(m, LIMITE_MANUAL)) throw argumentoNginx('manual');
    res.manual = m;
  }
  return res;
}

/** Nombre de una versión del historial (`vhost-<fecha>.txt`). */
export function versionVhost(v: unknown): string {
  if (typeof v !== 'string' || !/^vhost-[0-9TZ-]{10,40}\.txt$/.test(v)) {
    throw argumentoNginx('version');
  }
  return v;
}

// ---- Captura de dumps: ids de sitio y de volcado, filtro y confirmación; nunca rutas ----

function argumentoDepuracion(campo: string): ErrorWolf {
  return new ErrorWolf('depuracion.argumento_invalido', `Argumento no válido: ${campo}`, {
    campo,
  });
}

const ID_SITIO = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Id de un sitio (nunca una ruta). */
export function idSitioDepuracion(v: unknown): string {
  if (typeof v !== 'string' || v.length > 128 || !ID_SITIO.test(v)) {
    throw argumentoDepuracion('sitio');
  }
  return v;
}

/** Id de un volcado del receptor (`d<base36>-<n>`). */
export function idDump(v: unknown): string {
  if (typeof v !== 'string' || v.length > 64 || !/^d[0-9a-z]+-\d+$/.test(v)) {
    throw argumentoDepuracion('id');
  }
  return v;
}

export function activaDepuracion(v: unknown): boolean {
  if (typeof v !== 'boolean') throw argumentoDepuracion('activa');
  return v;
}

/** Confirmación del diálogo al encender la captura de un sitio: exactamente `true` o nada. */
export function confirmacionDepuracion(v: unknown): true | undefined {
  if (v === undefined) return undefined;
  if (v !== true) throw argumentoDepuracion('confirmacion');
  return true;
}

/** Filtro del visor de errores: sitio y fecha ISO; nada más. */
export function filtroErrores(v: unknown): { sitioId?: string; desde?: string } | undefined {
  if (v === undefined) return undefined;
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'filtro');
  } catch {
    throw argumentoDepuracion('filtro');
  }
  const res: { sitioId?: string; desde?: string } = {};
  for (const [k, x] of Object.entries(o)) {
    if (x === undefined) continue;
    if (k === 'sitioId') res.sitioId = idSitioDepuracion(x);
    else if (k === 'desde') {
      if (
        typeof x !== 'string' ||
        x.length > 40 ||
        !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(x) ||
        Number.isNaN(Date.parse(x))
      ) {
        throw argumentoDepuracion('desde');
      }
      res.desde = new Date(x).toISOString();
    } else throw argumentoDepuracion('filtro');
  }
  return res;
}

/** Huella de un error agrupado: 16 hexadecimales en minúsculas. */
export function huellaErrorIpc(v: unknown): string {
  if (typeof v !== 'string' || !/^[0-9a-f]{16}$/.test(v)) throw argumentoDepuracion('huella');
  return v;
}

/**
 * Archivo de una entrada de error para abrir en el editor: texto corto de una línea. El núcleo
 * comprueba (con rutas reales) que sea un archivo dentro de la carpeta del sitio.
 */
export function archivoEditor(v: unknown): string {
  if (typeof v !== 'string' || v === '' || v.length > 1024 || tieneControl(v)) {
    throw argumentoDepuracion('archivo');
  }
  return v;
}

export function lineaEditor(v: unknown): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 10_000_000) {
    throw argumentoDepuracion('linea');
  }
  return v;
}

/** Filtro de la lista: sitio, origen y texto (corto, sin controles); nada más. */
export function filtroDumps(
  v: unknown,
): { sitioId?: string; origen?: 'php' | 'python'; texto?: string } | undefined {
  if (v === undefined) return undefined;
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'filtro');
  } catch {
    throw argumentoDepuracion('filtro');
  }
  const res: { sitioId?: string; origen?: 'php' | 'python'; texto?: string } = {};
  for (const [k, x] of Object.entries(o)) {
    if (x === undefined) continue;
    if (k === 'sitioId') res.sitioId = idSitioDepuracion(x);
    else if (k === 'origen') {
      if (x !== 'php' && x !== 'python') throw argumentoDepuracion('origen');
      res.origen = x;
    } else if (k === 'texto') {
      if (typeof x !== 'string' || x.length > 200 || tieneControl(x)) {
        throw argumentoDepuracion('texto');
      }
      res.texto = x;
    } else throw argumentoDepuracion('filtro');
  }
  return res;
}

// ---- Versiones e instancias (Task 19) ----

/** Uno de los 13 servicios con pestaña "Versiones". */
export function servicioVersiones(v: unknown): ServicioVersiones {
  if (!esServicioVersiones(v)) throw new Error('Argumento no válido: servicio');
  return v;
}

/** Versión tal como la publica el catálogo ("8.4.15", "8.4.27-1", "22.11.0"); nunca una ruta. */
export function versionCatalogo(v: unknown, nombre = 'versión'): string {
  if (typeof v !== 'string' || !/^[0-9a-z][0-9a-z.+-]{0,39}$/.test(v) || v.includes('..')) {
    throw new Error(`Argumento no válido: ${nombre}`);
  }
  return v;
}

/**
 * Selección de la limpieza de versiones (D30): servicio de la lista de versiones y carpeta de
 * `bin/<servicio>/` (nunca una ruta). El núcleo la vuelve a validar antes de tocar nada.
 */
export function seleccionLimpieza(
  v: unknown,
): { servicio: string; version: string; incluirContenidoAjeno?: boolean }[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > 200) {
    throw new Error('Argumento no válido: selección');
  }
  return v.map((x) => {
    const o = objetoPlano<{
      servicio?: unknown;
      version?: unknown;
      incluirContenidoAjeno?: unknown;
    }>(x, 'selección');
    const servicio = servicioVersiones(o.servicio);
    if (
      typeof o.version !== 'string' ||
      !/^[\w.-]{1,64}$/.test(o.version) ||
      o.version.includes('..')
    ) {
      throw new Error('Argumento no válido: versión');
    }
    if (o.incluirContenidoAjeno !== undefined && typeof o.incluirContenidoAjeno !== 'boolean') {
      throw new Error('Argumento no válido: incluirContenidoAjeno');
    }
    return {
      servicio,
      version: o.version,
      ...(o.incluirContenidoAjeno === true ? { incluirContenidoAjeno: true } : {}),
    };
  });
}

/** Versión de la papelera de limpieza (`<servicio>__<versión>__<fecha>-<hex>`). */
export function idPapeleraVersion(v: unknown): string {
  if (
    typeof v !== 'string' ||
    v.includes('..') ||
    !/^[a-z0-9-]{1,40}__[\w.-]{1,64}__\d{8}-\d{6}-[0-9a-f]{6}$/.test(v)
  ) {
    throw new Error('Argumento no válido: versión de la papelera');
  }
  return v;
}

/** Destino de la limpieza de versiones: la papelera o el borrado definitivo. */
export function destinoLimpieza(v: unknown): 'papelera' | 'definitivo' {
  if (v !== 'papelera' && v !== 'definitivo') throw new Error('Argumento no válido: destino');
  return v;
}

/** Instancia de un servicio de datos (`mysql@8.4`). */
export function idInstanciaIpc(v: unknown, nombre = 'instancia'): IdInstancia {
  if (!esIdInstancia(v)) throw new Error(`Argumento no válido: ${nombre}`);
  return v;
}

/** Motor o instancia de un motor (`mysql` o `mysql@8.0`): lo que reciben las rutas `bd.*`. */
export function objetivoBd(v: unknown): { objetivo: MotorBd | IdInstancia; motor: MotorBd } {
  if (esIdInstancia(v)) {
    const { servicio } = parsearInstancia(v);
    return { objetivo: v, motor: motorBd(servicio) };
  }
  const m = motorBd(v);
  return { objetivo: m, motor: m };
}

/**
 * Servicio con "Datos de conexión" propios: solo Meilisearch o una de sus instancias. No se mezcla
 * con `objetivoBd` (que son motores de base de datos con respaldo, usuarios y bases).
 */
export function objetivoConexionServicio(v: unknown): 'meilisearch' | IdInstancia {
  if (v === 'meilisearch') return v;
  if (esIdInstancia(v) && parsearInstancia(v).servicio === 'meilisearch') return v;
  throw new Error('Argumento no válido: servicio');
}

/** Como `objetivoBd`, sin MongoDB (respaldar, restaurar, importar). */
export function objetivoSql(v: unknown): {
  objetivo: Exclude<MotorBd, 'mongodb'> | IdInstancia;
  motor: Exclude<MotorBd, 'mongodb'>;
} {
  const o = objetivoBd(v);
  if (o.motor === 'mongodb') throw new Error('Argumento no válido: motor');
  return o as {
    objetivo: Exclude<MotorBd, 'mongodb'> | IdInstancia;
    motor: Exclude<MotorBd, 'mongodb'>;
  };
}

/** Pedido de activar o desactivar las consultas lentas (D45b): el núcleo exige `confirmado === true`. */
export function pedidoLentas(v: unknown): {
  activo: boolean;
  segundos?: number;
  confirmado: boolean;
} {
  const o = objetoPlano<Record<string, unknown>>(v, 'consultas lentas');
  soloClaves(o, ['activo', 'segundos', 'confirmado'], 'consultas lentas');
  const segundos = o['segundos'];
  if (segundos !== undefined && (typeof segundos !== 'number' || !Number.isFinite(segundos))) {
    throw new Error('Argumento no válido: segundos');
  }
  return {
    activo: booleano(o['activo'], 'activo'),
    ...(segundos === undefined ? {} : { segundos }),
    confirmado: o['confirmado'] === true,
  };
}

/** Solo claves conocidas; cualquier otra hace fallar la llamada. */
function soloClaves(
  o: Record<string, unknown>,
  permitidas: readonly string[],
  nombre: string,
): void {
  for (const k of Object.keys(o)) {
    if (!permitidas.includes(k)) throw new Error(`Argumento no válido: ${nombre}`);
  }
}

/**
 * `confirmarSinHuella` solo pasa si es exactamente `true` (lo marca el usuario en el diálogo que
 * explica el riesgo); cualquier otro valor hace fallar la llamada.
 */
function sinHuella(o: Record<string, unknown>): { confirmarSinHuella?: true } {
  const c = o['confirmarSinHuella'];
  if (c === undefined) return {};
  if (c !== true) throw new Error('Argumento no válido: confirmarSinHuella');
  return { confirmarSinHuella: true };
}

export function opcionesActualizar(v: unknown): { confirmarSinHuella?: true } {
  if (v === undefined) return {};
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  soloClaves(o, ['confirmarSinHuella'], 'opciones');
  return sinHuella(o);
}

export function opcionesNuevaRama(
  servicio: IdServicioDatos,
  v: unknown,
): { copiarDesde?: IdInstancia; confirmarSinHuella?: true } {
  if (v === undefined) return {};
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  soloClaves(o, ['copiarDesde', 'confirmarSinHuella'], 'opciones');
  const res: { copiarDesde?: IdInstancia; confirmarSinHuella?: true } = sinHuella(o);
  if (o['copiarDesde'] !== undefined) {
    const id = idInstanciaIpc(o['copiarDesde'], 'copiarDesde');
    if (parsearInstancia(id).servicio !== servicio) {
      throw new Error('Argumento no válido: copiarDesde');
    }
    res.copiarDesde = id;
  }
  return res;
}

/** Resolver el bloqueo: confirmación escrita y, opcionalmente, el sello del respaldo a devolver. */
export function opcionesDesbloquear(v: unknown): {
  confirmacion: string;
  respaldo?: string;
  version?: string;
} {
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  soloClaves(o, ['confirmacion', 'respaldo', 'version'], 'opciones');
  const res: { confirmacion: string; respaldo?: string; version?: string } = {
    confirmacion: textoAcotado(o['confirmacion'], 0, 64, 'confirmación'),
  };
  if (o['respaldo'] !== undefined) {
    if (typeof o['respaldo'] !== 'string' || !/^\d{8}-\d{6}$/.test(o['respaldo'])) {
      throw new Error('Argumento no válido: respaldo');
    }
    res.respaldo = o['respaldo'];
  }
  if (o['version'] !== undefined) res.version = versionCatalogo(o['version']);
  return res;
}

const TIPOS_RESPALDO_DATOS = ['respaldo', 'volcados', 'fallida', 'restaurando', 'copia'] as const;

/** Copia de `data/<servicio>/` por sus ids (servicio, clave, tipo y sello); nunca una ruta. */
export function refRespaldoDatos(v: unknown): {
  servicio: IdServicioDatos;
  clave: string;
  tipo: TipoRespaldoDatos;
  sello: string;
} {
  const o = objetoPlano<Record<string, unknown>>(v, 'copia');
  soloClaves(o, ['servicio', 'clave', 'tipo', 'sello'], 'copia');
  const servicio = idServicioDatos(o['servicio']);
  const clave = o['clave'];
  if (
    typeof clave !== 'string' ||
    !/^[0-9a-z][0-9a-z.]{0,15}$/.test(clave) ||
    clave.includes('..')
  ) {
    throw new Error('Argumento no válido: clave');
  }
  const tipo = o['tipo'];
  if (typeof tipo !== 'string' || !(TIPOS_RESPALDO_DATOS as readonly string[]).includes(tipo)) {
    throw new Error('Argumento no válido: tipo');
  }
  const sello = o['sello'];
  if (typeof sello !== 'string' || !/^\d{8}-\d{6}$/.test(sello)) {
    throw new Error('Argumento no válido: sello');
  }
  return { servicio, clave, tipo: tipo as TipoRespaldoDatos, sello };
}

/** Confirmación de un borrado desde un diálogo: solo `true` exacto. */
export function confirmadoBorrar(v: unknown): true {
  if (v !== true) throw new Error('Argumento no válido: confirmar');
  return true;
}

const MOTORES_PEDIDO = ['mysql', 'mariadb', 'postgresql', 'mongodb'];
const CLAVES_PEDIDO = [
  'tipo',
  'nombre',
  'carpetaPadre',
  'php',
  'python',
  'base',
  'opciones',
  'plantilla',
];

/**
 * Pedido de "Nuevo proyecto" que manda el renderer. La carpeta padre solo vale si salió de un
 * diálogo (`RutasElegidas`); la carpeta del proyecto la arma este proceso con el nombre, así el
 * renderer nunca manda una ruta libre. El detalle (nombre, versiones, opciones, base) lo vuelve
 * a validar el núcleo con códigos de error traducibles.
 */
export function validarPedidoProyecto(v: unknown, elegidas: RutasElegidas): PedidoProyecto {
  const o = objetoPlano<Record<string, unknown>>(v, 'proyecto');
  for (const k of Object.keys(o)) {
    if (!CLAVES_PEDIDO.includes(k)) throw new Error('Argumento no válido: proyecto');
  }
  if (
    typeof o['tipo'] !== 'string' ||
    !(TIPOS_GENERADOR as readonly string[]).includes(o['tipo'])
  ) {
    throw new Error('Argumento no válido: tipo');
  }
  const nombre = textoAcotado(o['nombre'], 1, 64, 'nombre');
  // Nada de separadores ni de `:`: el nombre es un solo componente de ruta.
  if (/[\\/:]/.test(nombre) || nombre.includes('..'))
    throw new Error('Argumento no válido: nombre');
  const padre = elegidas.exigir(o['carpetaPadre'], 'carpeta');
  const pedido: Record<string, unknown> = {
    tipo: o['tipo'],
    nombre,
    carpeta: join(padre, nombre),
    base: null,
    opciones: {},
  };
  for (const k of ['php', 'python'] as const) {
    if (o[k] !== undefined) pedido[k] = textoAcotado(o[k], 1, 16, k);
  }
  // Desde una plantilla propia: solo su id (el núcleo la lee y la valida entera).
  if (o['plantilla'] !== undefined) pedido['plantilla'] = idPlantilla(o['plantilla']);
  if (o['base'] !== undefined && o['base'] !== null) {
    const b = objetoPlano<Record<string, unknown>>(o['base'], 'base');
    for (const k of Object.keys(b)) {
      if (!['instancia', 'nombre', 'motor'].includes(k))
        throw new Error('Argumento no válido: base');
    }
    const motor = b['motor'];
    if (motor !== undefined && (typeof motor !== 'string' || !MOTORES_PEDIDO.includes(motor))) {
      throw new Error('Argumento no válido: motor');
    }
    pedido['base'] = {
      instancia: b['instancia'] === null ? null : textoAcotado(b['instancia'], 1, 32, 'instancia'),
      nombre: textoAcotado(b['nombre'], 1, 64, 'base'),
      ...(motor !== undefined ? { motor } : {}),
    };
  }
  if (o['opciones'] !== undefined) {
    pedido['opciones'] = acotadoJson(objetoPlano(o['opciones'], 'opciones'), 2048, 'opciones');
  }
  return pedido as unknown as PedidoProyecto;
}

/** Id de una plantilla de proyecto: minúsculas, números y guiones (nunca una ruta). */
export function idPlantilla(v: unknown): string {
  const t = textoAcotado(v, 1, 80, 'plantilla');
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(t)) throw new Error('Argumento no válido: plantilla');
  return t;
}

/** Ids de sitios detectados en Laragon, XAMPP o Herd (`laragon-0123456789ab`): nunca una ruta. */
export function idsImportar(v: unknown): string[] {
  if (!Array.isArray(v) || v.length < 1 || v.length > 200) {
    throw new Error('Argumento no válido: sitios a importar');
  }
  return v.map((x) => {
    const t = textoAcotado(x, 1, 40, 'sitio a importar');
    if (!/^(?:laragon|xampp|herd)-[0-9a-f]{12}$/.test(t)) {
      throw new Error('Argumento no válido: sitio a importar');
    }
    return t;
  });
}

/**
 * Opciones de la importación desde otros programas: el servidor de origen (siempre 127.0.0.1; la
 * clave solo viaja en esta llamada), el servidor local de destino y las bases que el usuario
 * confirmó reemplazar. Cualquier otra clave hace fallar la llamada.
 */
export function opcionesImportar(v: unknown): {
  origenBd?: { host: '127.0.0.1'; puerto: number; usuario: string; clave: string };
  instancia?: ReturnType<typeof objetivoSql>['objetivo'];
  reemplazar?: string[];
} {
  const o = objetoPlano<Record<string, unknown>>(v ?? {}, 'importar');
  soloClaves(o, ['origenBd', 'instancia', 'reemplazar'], 'importar');
  const salida: ReturnType<typeof opcionesImportar> = {};
  if (o['instancia'] !== undefined) salida.instancia = objetivoSql(o['instancia']).objetivo;
  if (o['origenBd'] !== undefined) {
    const b = objetoPlano<Record<string, unknown>>(o['origenBd'], 'origen');
    soloClaves(b, ['host', 'puerto', 'usuario', 'clave'], 'origen');
    if (b['host'] !== '127.0.0.1') throw new Error('Argumento no válido: servidor de origen');
    salida.origenBd = {
      host: '127.0.0.1',
      puerto: enteroEn(b['puerto'], 1, 65535, 'puerto de origen'),
      usuario: textoAcotado(b['usuario'], 1, 64, 'usuario de origen'),
      clave: textoAcotado(b['clave'], 0, 256, 'clave de origen'),
    };
  }
  const re = o['reemplazar'];
  if (re !== undefined) {
    if (!Array.isArray(re) || re.length > 200) throw new Error('Argumento no válido: reemplazar');
    salida.reemplazar = re.map((x) => nombreBase('mysql', x, 'base a reemplazar'));
  }
  return salida;
}

/**
 * Opciones para guardar (o previsualizar) una plantilla. Con `conNombre` el nombre es obligatorio.
 * Las exclusiones extra son texto corto; el núcleo las vuelve a validar y nunca puede quitar las
 * obligatorias (.env, vendor, node_modules, .git, claves…).
 */
export function opcionesPlantilla(
  v: unknown,
  conNombre: boolean,
): { nombre: string; conArchivos: boolean; excluirExtra: string[]; incluir: string[] } {
  const o = objetoPlano<Record<string, unknown>>(v, 'plantilla');
  for (const k of Object.keys(o)) {
    if (!['nombre', 'conArchivos', 'excluirExtra', 'incluir'].includes(k)) {
      throw new Error('Argumento no válido: plantilla');
    }
  }
  if (o['conArchivos'] !== undefined && typeof o['conArchivos'] !== 'boolean') {
    throw new Error('Argumento no válido: conArchivos');
  }
  const extra = o['excluirExtra'];
  if (extra !== undefined && (!Array.isArray(extra) || extra.length > 50)) {
    throw new Error('Argumento no válido: excluirExtra');
  }
  const incluir = o['incluir'];
  if (incluir !== undefined && (!Array.isArray(incluir) || incluir.length > 200)) {
    throw new Error('Argumento no válido: incluir');
  }
  return {
    nombre: conNombre ? textoAcotado(o['nombre'], 1, 60, 'nombre') : '',
    conArchivos: o['conArchivos'] === true,
    incluir: ((incluir as unknown[] | undefined) ?? []).map((x) =>
      textoAcotado(x, 1, 300, 'incluir'),
    ),
    excluirExtra: ((extra as unknown[] | undefined) ?? []).map((x) =>
      textoAcotado(x, 1, 120, 'excluirExtra'),
    ),
  };
}

/** Versión de WordPress para pedir su huella: `7.1.5` (nada más). */
export function versionWordpress(v: unknown): string {
  const t = textoAcotado(v, 3, 12, 'versión');
  if (!/^\d{1,2}\.\d{1,2}(\.\d{1,2})?$/.test(t)) throw new Error('Argumento no válido: versión');
  return t;
}

/* ───────────── Gestor de .env (D16) ───────────── */

const CLAVE_ENV = /^[A-Za-z_][A-Za-z0-9_.]{0,127}$/;
const BLOQUES_ENV_IPC = ['bd', 'correo', 'ia', 'redis', 'meilisearch'] as const;

/** Nombre de una variable del .env. Los mensajes de error nunca repiten el valor recibido. */
export function claveEnv(v: unknown): string {
  if (typeof v !== 'string' || !CLAVE_ENV.test(v)) throw new Error('Argumento no válido: variable');
  return v;
}

/**
 * Lo que se quiere cambiar en un .env: variables (valor de texto de una línea, o null para
 * quitarla), claves cuyo valor se toma del ejemplo y bloques de plantilla. El núcleo valida cada
 * valor otra vez; aquí solo la forma y el tamaño. Nunca se repite un valor en un error.
 */
export function pedidoEnv(v: unknown): PedidoEnv {
  const malo = (): never => {
    throw new Error('Argumento no válido: cambios del .env');
  };
  const o = objetoPlano<Record<string, unknown>>(v, 'cambios del .env');
  for (const k of Object.keys(o)) {
    if (!['cambios', 'desdeEjemplo', 'bloques'].includes(k)) malo();
  }
  const pedido: PedidoEnv = {};
  if (o['cambios'] !== undefined) {
    const c = objetoPlano<Record<string, unknown>>(o['cambios'], 'cambios del .env');
    const entradas = Object.entries(c);
    if (entradas.length > 200) malo();
    const cambios: Record<string, string | null> = {};
    for (const [k, valor] of entradas) {
      claveEnv(k);
      if (valor !== null && (typeof valor !== 'string' || valor.length > 4096)) malo();
      cambios[k] = valor as string | null;
    }
    pedido.cambios = cambios;
  }
  if (o['desdeEjemplo'] !== undefined) {
    const d = o['desdeEjemplo'];
    if (!Array.isArray(d) || d.length > 200) malo();
    pedido.desdeEjemplo = (d as unknown[]).map(claveEnv);
  }
  if (o['bloques'] !== undefined) {
    const b = o['bloques'];
    if (
      !Array.isArray(b) ||
      b.length > 5 ||
      !(b as unknown[]).every((x) => (BLOQUES_ENV_IPC as readonly unknown[]).includes(x))
    ) {
      malo();
    }
    pedido.bloques = b as PedidoEnv['bloques'];
  }
  return pedido;
}

/**
 * Opciones de guardar o de "Usar usuario propio": `confirmado` debe ser exactamente `true` (solo
 * lo pone el diálogo de confirmación) y las demás son banderas.
 */
export function opcionesEnv(
  v: unknown,
  permitidas: readonly string[],
): { aceptarVersionado?: boolean; agregarGitignore?: boolean; compartirUsuario?: boolean } {
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones del .env');
  for (const k of Object.keys(o)) {
    if (k !== 'confirmado' && !permitidas.includes(k)) {
      throw new Error('Argumento no válido: opciones del .env');
    }
  }
  if (o['confirmado'] !== true) {
    throw new ErrorWolf('env.sin_confirmar', 'Falta confirmar el cambio del .env.');
  }
  const salida: {
    aceptarVersionado?: boolean;
    agregarGitignore?: boolean;
    compartirUsuario?: boolean;
  } = {};
  for (const k of permitidas) {
    if (k === 'huella') continue;
    if (o[k] !== undefined) {
      (salida as Record<string, boolean>)[k] = booleano(o[k], k);
    }
  }
  return salida;
}

/**
 * Huella del `.env` que la vista previa mostró (`env.vistaPrevia`): obligatoria para guardar, así
 * un cambio hecho por fuera entretanto no se pisa.
 */
export function huellaEnvPedida(v: unknown): string {
  const h = (v as Record<string, unknown> | null)?.['huella'];
  if (typeof h !== 'string' || !/^[0-9a-f]{64}$/.test(h)) {
    throw new Error('Argumento no válido: huella del .env');
  }
  return h;
}

/** Nombre de una copia del .env (el núcleo comprueba que sea de ese sitio). */
export function nombreCopiaEnv(v: unknown): string {
  return textoAcotado(v, 1, 120, 'copia');
}

/**
 * Tabla y columnas que elige quien audita contraseñas (D20): solo texto corto y sin controles; el
 * núcleo los busca en el catálogo de la base y nunca los pega en el SQL tal cual.
 */
export function seleccionAuditoria(v: unknown): {
  tabla: string;
  columnaUsuario: string;
  columnaHash: string;
  esquema?: string;
} {
  const o = objetoPlano<Record<string, unknown>>(v, 'selección');
  soloClaves(o, ['tabla', 'columnaUsuario', 'columnaHash', 'esquema'], 'selección');
  return {
    ...(o['esquema'] === undefined
      ? {}
      : { esquema: textoAcotado(o['esquema'], 1, 128, 'esquema') }),
    tabla: textoAcotado(o['tabla'], 1, 128, 'tabla'),
    columnaUsuario: textoAcotado(o['columnaUsuario'], 1, 128, 'columna del usuario'),
    columnaHash: textoAcotado(o['columnaHash'], 1, 128, 'columna del hash'),
  };
}

/** Usuario (valor de la columna de usuario) cuya contraseña se restablece. */
export function usuarioAuditoria(v: unknown): string {
  if (typeof v !== 'string' || v.length < 1 || v.length > 256) {
    throw new Error('Argumento no válido: usuario');
  }
  return v;
}

/** Contraseña nueva: cualquier texto de 1 a 1024 caracteres (el mensaje nunca la repite). */
export function claveNuevaAuditoria(v: unknown): string {
  if (typeof v !== 'string' || v.length < 1 || v.length > 1024) {
    throw new Error('Argumento no válido: contraseña nueva');
  }
  return v;
}

/**
 * Restablecer solo si quien llama escribió el usuario exacto: la confirmación se comprueba aquí,
 * en el proceso principal, no en la interfaz.
 */
export function confirmadoRestablecer(escrito: unknown, usuario: string): true {
  if (typeof escrito !== 'string' || escrito !== usuario) {
    throw new Error('Argumento no válido: confirmación');
  }
  return true;
}

// ---- Correo: proveedores SMTP remotos (D22) ----

function argumentoCorreo(campo: string): ErrorWolf {
  return new ErrorWolf('correo.argumento_invalido', `Argumento no válido: ${campo}`, { campo });
}

/** Id de un proveedor SMTP (`ID_PROVEEDOR_SMTP`): sirve de nombre de archivo del secreto. */
export function idProveedorSmtp(v: unknown): string {
  if (typeof v !== 'string' || !ID_PROVEEDOR_SMTP.test(v)) throw argumentoCorreo('proveedor');
  return v;
}

const CAMPOS_PROVEEDOR_SMTP = new Set([
  'id',
  'nombre',
  'host',
  'puerto',
  'seguridad',
  'usuario',
  'remitente',
]);

/**
 * Clave de un proveedor SMTP: ASCII imprimible de 1 a 4096 caracteres; admite espacios internos
 * (se quitan los de los extremos). Código propio; el error nunca la repite.
 */
export function claveSmtp(v: unknown): string {
  const t = typeof v === 'string' ? v.trim() : '';
  if (!/^[\x21-\x7e]([\x20-\x7e]{0,4094}[\x21-\x7e])?$/.test(t)) {
    throw new ErrorWolf(
      'correo.clave_mal_formada',
      'La clave no tiene un formato válido: solo caracteres imprimibles, sin saltos de línea y de hasta 4096 caracteres.',
    );
  }
  return t;
}

/**
 * Datos de un proveedor SMTP: solo los campos de la lista (nunca `redLocal`, que lo da la
 * confirmación aparte, ni una clave). El núcleo vuelve a validar cada campo.
 */
export function datosProveedorSmtp(v: unknown): Record<string, unknown> {
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'proveedor');
  } catch {
    throw argumentoCorreo('proveedor');
  }
  for (const k of Object.keys(o))
    if (!CAMPOS_PROVEEDOR_SMTP.has(k)) throw argumentoCorreo('proveedor');
  return { ...o };
}

/** `{confirmarRedLocal?, confirmarCambio?}`: solo valen si son exactamente `true`. */
export function opcionesGuardarSmtp(v: unknown): {
  confirmarRedLocal?: true;
  confirmarCambio?: true;
} {
  if (v === undefined) return {};
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  } catch {
    throw argumentoCorreo('opciones');
  }
  const salida: { confirmarRedLocal?: true; confirmarCambio?: true } = {};
  for (const [k, valor] of Object.entries(o)) {
    if (k !== 'confirmarRedLocal' && k !== 'confirmarCambio') throw argumentoCorreo('opciones');
    if (valor === undefined) continue;
    if (valor !== true) throw argumentoCorreo(k);
    salida[k] = true;
  }
  return salida;
}

/** Dirección a la que se manda la prueba: la escribe el usuario, una sola. */
export function destinatarioPrueba(v: unknown): string {
  if (!destinatarioValido(v)) {
    throw new ErrorWolf('correo.destinatario_invalido', 'La dirección de destino no es válida.');
  }
  return v;
}

/** A dónde envía correo un proyecto. */
export function modoCorreoSitio(
  v: unknown,
): { modo: 'captador' } | { modo: 'smtp'; proveedor: string } {
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'modo');
  } catch {
    throw argumentoCorreo('modo');
  }
  const claves = Object.keys(o);
  if (o['modo'] === 'captador' && claves.length === 1) return { modo: 'captador' };
  if (o['modo'] === 'smtp' && claves.length === 2) {
    return { modo: 'smtp', proveedor: idProveedorSmtp(o['proveedor']) };
  }
  throw argumentoCorreo('modo');
}

export interface OpcionesEnvSmtp {
  incluirClave: boolean;
  huella: string;
  aceptarVersionado?: boolean;
  agregarGitignore?: boolean;
}

/**
 * Opciones de `correo.escribirEnv`. `confirmado` debe ser exactamente `true` (el aviso de que la
 * clave, si se incluye, queda en texto plano); `incluirClave` es obligatorio.
 */
export function opcionesEnvSmtp(v: unknown): OpcionesEnvSmtp {
  const sinConfirmar = (): ErrorWolf =>
    new ErrorWolf(
      'correo.env_sin_confirmar',
      'Confirme que quiere escribir las variables de correo en el .env.',
    );
  if (v === undefined || v === null) throw sinConfirmar();
  let o: Record<string, unknown>;
  try {
    o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  } catch {
    throw argumentoCorreo('opciones');
  }
  for (const k of Object.keys(o)) {
    if (
      !['confirmado', 'incluirClave', 'huella', 'aceptarVersionado', 'agregarGitignore'].includes(k)
    ) {
      throw argumentoCorreo('opciones');
    }
  }
  if (o['confirmado'] !== true) throw sinConfirmar();
  if (typeof o['incluirClave'] !== 'boolean') throw argumentoCorreo('incluirClave');
  const salida: OpcionesEnvSmtp = {
    incluirClave: o['incluirClave'],
    huella: huellaEnvPedida(o),
  };
  for (const k of ['aceptarVersionado', 'agregarGitignore'] as const) {
    const x = o[k];
    if (x === undefined) continue;
    if (typeof x !== 'boolean') throw argumentoCorreo(k);
    if (x) salida[k] = true;
  }
  return salida;
}

/** Proveedores de túnel que usan un token guardado (Tailscale usa la sesión del propio equipo). */
export const PROVEEDORES_TUNEL_CON_TOKEN = ['ngrok', 'expose'] as const;
export type ProveedorTunelConToken = (typeof PROVEEDORES_TUNEL_CON_TOKEN)[number];

export function proveedorTunelConToken(v: unknown): ProveedorTunelConToken {
  if (typeof v === 'string' && (PROVEEDORES_TUNEL_CON_TOKEN as readonly string[]).includes(v)) {
    return v as ProveedorTunelConToken;
  }
  throw new Error('Argumento no válido: proveedor');
}

/**
 * Token de ngrok o Expose (letras, números y `_ . -`, de 8 a 200). Código propio; el error nunca lo
 * repite.
 */
export function tokenTunel(v: unknown): string {
  const t = typeof v === 'string' ? v.trim() : '';
  if (!tokenTunelValido(t)) {
    throw new ErrorWolf(
      'tuneles.token_invalido',
      'El token no tiene un formato válido: solo letras, números y _ . - (de 8 a 200 caracteres).',
    );
  }
  return t;
}

/** Proveedor y modo que `tuneles.usarProveedor` acepta (cloudflare tiene sus propios caminos). */
export function eleccionTunel(
  proveedor: unknown,
  modo: unknown,
): { proveedor: 'ngrok' | 'expose' | 'tailscale'; modo?: 'serve' | 'funnel' } {
  if (proveedor !== 'ngrok' && proveedor !== 'expose' && proveedor !== 'tailscale') {
    throw new Error('Argumento no válido: proveedor');
  }
  if (modo === undefined) return { proveedor };
  if (proveedor !== 'tailscale' || (modo !== 'serve' && modo !== 'funnel')) {
    throw new Error('Argumento no válido: modo');
  }
  return { proveedor, modo };
}

/**
 * Lo que la ventana mostró al confirmar (o nada): solo esos campos y con las reglas del núcleo. Lo
 * que no encaja se rechaza (nunca se ajusta), para que la confirmación sea exactamente lo mostrado.
 */
export function tunelConfirmado(
  v: unknown,
):
  | { proveedor: IdProveedorTunel; nombre?: string; dominio?: string; modo?: 'serve' | 'funnel' }
  | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'object' || Array.isArray(v)) throw new Error('Argumento no válido: túnel');
  const o = v as Record<string, unknown>;
  const permitidas = new Set(['proveedor', 'nombre', 'dominio', 'modo']);
  if (Object.keys(o).some((k) => !permitidas.has(k))) throw new Error('Argumento no válido: túnel');
  const proveedor = (IDS_PROVEEDOR_TUNEL as readonly unknown[]).includes(o['proveedor'])
    ? (o['proveedor'] as IdProveedorTunel)
    : null;
  if (!proveedor) throw new Error('Argumento no válido: proveedor');
  if (o['nombre'] !== undefined && !nombreTunelValido(o['nombre'])) {
    throw new Error('Argumento no válido: nombre');
  }
  if (o['dominio'] !== undefined && !dominioPublicoValido(o['dominio'])) {
    throw new Error('Argumento no válido: dominio');
  }
  if (o['modo'] !== undefined && o['modo'] !== 'serve' && o['modo'] !== 'funnel') {
    throw new Error('Argumento no válido: modo');
  }
  if (o['modo'] !== undefined && proveedor !== 'tailscale') {
    throw new Error('Argumento no válido: modo');
  }
  return {
    proveedor,
    ...(o['nombre'] !== undefined ? { nombre: o['nombre'] as string } : {}),
    ...(o['dominio'] !== undefined ? { dominio: o['dominio'] as string } : {}),
    ...(o['modo'] !== undefined ? { modo: o['modo'] as 'serve' | 'funnel' } : {}),
  };
}

/* ───────────── Perfiles del entorno (D27) ───────────── */

/** Frase de un perfil: texto de hasta 1024 caracteres, sin controles. Nunca se repite en un error. */
const FRASE_PERFIL_MAX = 1024;
const ID_SITIO_PERFIL = /^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/;

/**
 * Exportar un perfil: el destino sale de un diálogo de "guardar" y las casillas son booleanos de
 * verdad; la frase (o null) nunca aparece en un mensaje de error.
 */
export function validarExportarPerfil(v: unknown, elegidas: RutasElegidas): OpcionesExportarPerfil {
  const o = objetoPlano<Record<string, unknown>>(v, 'perfil');
  soloClaves(o, ['destino', 'bases', 'certificados', 'ca', 'frase'], 'perfil');
  const destino = elegidas.exigir(o['destino'], 'archivo', 'guardar');
  const frase =
    o['frase'] === null || o['frase'] === undefined
      ? null
      : textoAcotado(o['frase'], 1, FRASE_PERFIL_MAX, 'frase');
  return {
    destino,
    bases: booleano(o['bases'], 'bases'),
    certificados: booleano(o['certificados'], 'certificados'),
    ca: booleano(o['ca'], 'ca'),
    frase,
  };
}

/** Las carpetas de la reasignación de rutas: cada una sale de un diálogo; ids y topes acotados. */
function rutasDePerfil(
  v: unknown,
  elegidas: RutasElegidas,
): { rutas: Record<string, string>; prefijos: PrefijoRuta[] } {
  const o = objetoPlano<Record<string, unknown>>(v ?? {}, 'rutas');
  const crudas = objetoPlano<Record<string, unknown>>(o['rutas'] ?? {}, 'rutas');
  const ids = Object.keys(crudas);
  if (ids.length > 2000) throw new Error('Argumento no válido: rutas');
  const rutas: Record<string, string> = {};
  for (const id of ids) {
    if (!ID_SITIO_PERFIL.test(id)) throw new Error('Argumento no válido: sitio');
    rutas[id] = elegidas.exigir(crudas[id], 'carpeta');
  }
  const brutos = o['prefijos'] ?? [];
  if (!Array.isArray(brutos) || brutos.length > 50)
    throw new Error('Argumento no válido: prefijos');
  const prefijos = brutos.map((p): PrefijoRuta => {
    const x = objetoPlano<Record<string, unknown>>(p, 'prefijo');
    soloClaves(x, ['viejo', 'nuevo'], 'prefijo');
    return {
      viejo: textoAcotado(x['viejo'], 1, 260, 'prefijo'),
      nuevo: elegidas.exigir(x['nuevo'], 'carpeta'),
    };
  });
  return { rutas, prefijos };
}

/** Vista previa de un perfil: el archivo y las carpetas de los sitios salen de diálogos. */
export function validarVistaPreviaPerfil(
  archivo: unknown,
  opciones: unknown,
  elegidas: RutasElegidas,
): { archivo: string; rutas: Record<string, string>; prefijos: PrefijoRuta[] } {
  const ruta = elegidas.exigir(archivo, 'archivo');
  return { archivo: ruta, ...rutasDePerfil(opciones, elegidas) };
}

const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Importar un perfil: `confirmado: true` y la huella de la vista previa son obligatorios; las
 * confirmaciones aparte (CA, sin restricciones, sin bases) solo valen como `true`; `guardarClave`
 * nunca viene del renderer (la pone el proceso principal).
 */
export function validarImportarPerfil(
  archivo: unknown,
  opciones: unknown,
  elegidas: RutasElegidas,
): { archivo: string; opciones: Omit<OpcionesImportarPerfil, never> } {
  const ruta = elegidas.exigir(archivo, 'archivo');
  const o = objetoPlano<Record<string, unknown>>(opciones, 'importar');
  soloClaves(
    o,
    [
      'rutas',
      'prefijos',
      'frase',
      'importarCa',
      'omitirBases',
      'envProyectos',
      'reemplazarCa',
      'aceptarCaSinRestricciones',
      'huella',
      'confirmado',
    ],
    'importar',
  );
  if (o['confirmado'] !== true) throw new Error('Argumento no válido: confirmado');
  if (typeof o['huella'] !== 'string' || !HEX64.test(o['huella'])) {
    throw new Error('Argumento no válido: huella');
  }
  const { rutas, prefijos } = rutasDePerfil(
    { rutas: o['rutas'], prefijos: o['prefijos'] },
    elegidas,
  );
  const verdadero = (clave: string): true | undefined => {
    if (o[clave] === undefined) return undefined;
    if (o[clave] !== true) throw new Error(`Argumento no válido: ${clave}`);
    return true;
  };
  const importarCa = verdadero('importarCa');
  const omitirBases = verdadero('omitirBases');
  const reemplazarCa = verdadero('reemplazarCa');
  const aceptarCaSinRestricciones = verdadero('aceptarCaSinRestricciones');
  const envProyectos =
    o['envProyectos'] === undefined
      ? undefined
      : (() => {
          const l = o['envProyectos'];
          if (!Array.isArray(l) || l.length > 2000)
            throw new Error('Argumento no válido: proyectos');
          return l.map((id) => {
            if (typeof id !== 'string' || !ID_SITIO_PERFIL.test(id)) {
              throw new Error('Argumento no válido: sitio');
            }
            return id;
          });
        })();
  return {
    archivo: ruta,
    opciones: {
      rutas,
      ...(prefijos.length > 0 ? { prefijos } : {}),
      ...(o['frase'] !== undefined
        ? { frase: textoAcotado(o['frase'], 1, FRASE_PERFIL_MAX, 'frase') }
        : {}),
      ...(importarCa ? { importarCa } : {}),
      ...(omitirBases ? { omitirBases } : {}),
      ...(reemplazarCa ? { reemplazarCa } : {}),
      ...(aceptarCaSinRestricciones ? { aceptarCaSinRestricciones } : {}),
      ...(envProyectos ? { envProyectos } : {}),
      huella: o['huella'],
      confirmado: true,
    },
  };
}

/* ───────────── Editor de código (D43) ───────────── */

/** Abrir en el editor: la ruta sale de un diálogo; solo `confirmadoRiesgo` como opción. */
export function validarAbrirEditor(
  ruta: unknown,
  opciones: unknown,
  elegidas: RutasElegidas,
): { ruta: string; opciones: OpcionesAbrirArchivo } {
  const r = elegidas.exigir(ruta, 'archivo', 'editor');
  const o = objetoPlano<Record<string, unknown>>(opciones ?? {}, 'editor');
  soloClaves(o, ['confirmadoRiesgo'], 'editor');
  return {
    ruta: r,
    opciones:
      o['confirmadoRiesgo'] === undefined
        ? {}
        : { confirmadoRiesgo: booleano(o['confirmadoRiesgo'], 'confirmadoRiesgo') },
  };
}

/**
 * Guardar desde el editor: la ruta sale de un diálogo y el texto, la huella y las banderas se
 * acotan aquí. `confirmado` pasa tal cual: el núcleo exige `true` exacto (`editor.sin_confirmar`).
 */
export function validarGuardarEditor(
  ruta: unknown,
  opciones: unknown,
  elegidas: RutasElegidas,
): { ruta: string; opciones: OpcionesGuardarArchivo } {
  const r = elegidas.exigir(ruta, 'archivo', 'editor');
  const o = objetoPlano<Record<string, unknown>>(opciones, 'editor');
  soloClaves(
    o,
    [
      'contenido',
      'huella',
      'eol',
      'bom',
      'confirmado',
      'confirmadoRiesgo',
      'sobrescribir',
      'aceptarNormalizar',
    ],
    'editor',
  );
  const contenido = o['contenido'];
  if (typeof contenido !== 'string' || contenido.length > MAX_BYTES_EDITOR) {
    throw new Error('Argumento no válido: contenido');
  }
  const h = objetoPlano<Record<string, unknown>>(o['huella'], 'huella');
  soloClaves(h, ['tamano', 'mtimeMs', 'hash'], 'huella');
  const mtimeMs = h['mtimeMs'];
  if (typeof mtimeMs !== 'number' || !Number.isFinite(mtimeMs)) {
    throw new Error('Argumento no válido: huella');
  }
  const hash = textoAcotado(h['hash'], 64, 64, 'huella');
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error('Argumento no válido: huella');
  const eol = o['eol'];
  if (eol !== 'lf' && eol !== 'crlf' && eol !== 'mixto')
    throw new Error('Argumento no válido: eol');
  return {
    ruta: r,
    opciones: {
      contenido,
      huella: { tamano: enteroEn(h['tamano'], 0, MAX_BYTES_EDITOR, 'huella'), mtimeMs, hash },
      eol,
      bom: booleano(o['bom'], 'bom'),
      confirmado: o['confirmado'] as true,
      ...(o['confirmadoRiesgo'] === undefined
        ? {}
        : { confirmadoRiesgo: booleano(o['confirmadoRiesgo'], 'confirmadoRiesgo') }),
      ...(o['sobrescribir'] === undefined
        ? {}
        : { sobrescribir: booleano(o['sobrescribir'], 'sobrescribir') }),
      ...(o['aceptarNormalizar'] === undefined
        ? {}
        : { aceptarNormalizar: booleano(o['aceptarNormalizar'], 'aceptarNormalizar') }),
    },
  };
}
