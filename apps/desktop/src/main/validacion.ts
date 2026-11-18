import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  IDS_SERVICIO_DATOS,
  NOMBRE_BD_MONGO,
  NOMBRE_BD_MYSQL,
  NOMBRE_BD_PG,
  NOMBRE_MODELO_OLLAMA,
  TIPOS_SITIO,
  type IdServicioDatos,
  type MotorBd,
  type TipoSitio,
} from '@pel/core';

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
] as const;

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

/**
 * Rutas que el usuario eligió en los diálogos de esta sesión. Las rutas que leen o escriben
 * archivos (restaurar, formato, carpeta de respaldo) solo aceptan rutas de aquí: el renderer no
 * puede inventar una ruta.
 */
export class RutasElegidas {
  private readonly rutas = new Set<string>();

  /** Misma ruta aunque cambien mayúsculas, separadores o la barra final (Windows). */
  private clave(ruta: string): string {
    return resolve(ruta).replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
  }

  registrar(ruta: string | null): string | null {
    if (ruta) this.rutas.add(this.clave(ruta));
    return ruta;
  }

  exigir(v: unknown, tipo: 'archivo' | 'carpeta'): string {
    const t = texto(v, tipo);
    if (!this.rutas.has(this.clave(t))) {
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
