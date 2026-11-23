import { stat } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import {
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
  type IdServicioDatos,
  type MotorBd,
  type ServicioInstalable,
  type TipoSitio,
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

export function tipoRuntime(v: unknown): 'node' | 'python' {
  if (v !== 'node' && v !== 'python') throw new Error('Argumento no válido: runtime');
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
