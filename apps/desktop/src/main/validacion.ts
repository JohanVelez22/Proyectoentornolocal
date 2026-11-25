import { stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
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
  IDS_AGENTE,
  IDS_TERMINAL,
  MAX_MENSAJE_COMMIT,
  type IdTerminal,
  type IdAgente,
  ID_PROVEEDOR_IA,
  IDS_SERVICIO_DATOS,
  TIPOS_PROVEEDOR_IA,
  validarModeloIa,
  type ConfigProveedorIa,
  type OpcionesEnvIa,
  type TipoProveedorIa,
  NOMBRE_BD_MONGO,
  NOMBRE_BD_MYSQL,
  NOMBRE_BD_PG,
  NOMBRE_MODELO_OLLAMA,
  TIPOS_SITIO,
  TIPOS_GENERADOR,
  type PedidoProyecto,
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
} from '@pel/core';

/** Terminal elegida: un id conocido; `undefined` o null = la predeterminada. */
export function idTerminal(v: unknown): IdTerminal | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string' || !(IDS_TERMINAL as readonly string[]).includes(v)) {
    throw new ErrorWolf('terminal.invalida', 'Terminal no válida.');
  }
  return v as IdTerminal;
}

export function texto(v: unknown, nombre = 'valor'): string {
  if (typeof v !== 'string') throw new Error(`Argumento no válido: ${nombre}`);
  return v;
}

export function idNoVacio(v: unknown, nombre = 'id'): string {
  if (typeof v !== 'string' || v.trim() === '') throw new Error(`Argumento no válido: ${nombre}`);
  return v;
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
  'ollama',
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
] as const;

/** Todo lo que el catálogo puede dejar en bin/ (también herramientas): para `instalados`. */
const DEL_CATALOGO = [
  ...INSTALABLES,
  'composer',
  'adminer',
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
      throw new Error('Argumento no válido: rama');
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

export function idServicioDatos(v: unknown): IdServicioDatos {
  if (typeof v !== 'string' || !(IDS_SERVICIO_DATOS as readonly string[]).includes(v)) {
    throw new Error('Argumento no válido: servicio');
  }
  return v as IdServicioDatos;
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
  if (typeof v !== 'string' || !/^\d+\.\d+$/.test(v)) throw new Error('Argumento no válido: rama');
  return v;
}

/** Para qué se eligió una ruta: `abrir` (leer, diálogo de abrir) o `guardar` (destino). */
export type PropositoRuta = 'abrir' | 'guardar';

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
