import { open } from 'node:fs/promises';
import path from 'node:path';
import { leerVariablesEnv } from '../proyectos/detectar';

/** Motores que Adminer abre (MongoDB no). */
export type MotorAdminer = 'mysql' | 'mariadb' | 'postgresql';

/**
 * Base de datos de un proyecto según su `.env`: motor, nombre y usuario. La clave NUNCA se lee
 * aquí: Adminer la pide al entrar (así no viaja en la URL ni queda en registros).
 */
export interface BaseProyecto {
  motor: MotorAdminer;
  base: string;
  usuario: string;
}

const motorDe = (v: string | undefined): MotorAdminer | null => {
  const t = (v ?? '').trim().toLowerCase();
  if (/^(mysql|mysqli)$/.test(t)) return 'mysql';
  if (t === 'mariadb') return 'mariadb';
  if (/^(pgsql|postgres|postgresql|postgre)$/.test(t)) return 'postgresql';
  return null;
};

/** Nombres de base y usuario razonables (sin controles ni rarezas que rompan la URL). */
const VALIDO = /^[^\s/\\?#&]{1,128}$/;
const valido = (v: string): boolean =>
  VALIDO.test(v) && [...v].every((c) => c.charCodeAt(0) >= 0x20);

/** URL de conexión (`postgresql://usuario:clave@host:puerto/base`): solo motor, usuario y base. */
function desdeUrl(url: string | undefined): BaseProyecto | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const motor = motorDe(u.protocol.replace(/:$/, '').split('+')[0]);
  let base: string;
  let usuario: string;
  try {
    base = decodeURIComponent(u.pathname.replace(/^\//, ''));
    usuario = decodeURIComponent(u.username);
  } catch {
    // Un % suelto o una secuencia que no es UTF-8: la URL no sirve.
    return null;
  }
  return motor && base && usuario ? { motor, base, usuario } : null;
}

/**
 * Base del proyecto a partir de las variables de su `.env` (Laravel y genérico `DB_*`,
 * CodeIgniter 4 `database.default.*`, o `DATABASE_URL`). null si no hay datos completos o el
 * motor no es SQL.
 */
export function baseDeVariables(vars: Map<string, string>): BaseProyecto | null {
  const ci4 = vars.get('database.default.database');
  let r: BaseProyecto | null = null;
  if (ci4) {
    const motor = motorDe(vars.get('database.default.DBDriver') ?? 'mysqli');
    const usuario = vars.get('database.default.username');
    if (motor && usuario) r = { motor, base: ci4, usuario };
  } else if (vars.get('DB_DATABASE') || vars.get('DB_NAME')) {
    const puerto = (vars.get('DB_PORT') ?? '').trim();
    const declarado = vars.get('DB_CONNECTION') ?? vars.get('DB_DRIVER');
    // Un driver declarado que no es SQL (mongodb, sqlite) no se abre en Adminer.
    const motor = declarado ? motorDe(declarado) : puerto === '5432' ? 'postgresql' : 'mysql';
    const usuario = vars.get('DB_USERNAME') ?? vars.get('DB_USER');
    const base = (vars.get('DB_DATABASE') ?? vars.get('DB_NAME'))!;
    if (motor && usuario) r = { motor, base, usuario };
  } else {
    r = desdeUrl(vars.get('DATABASE_URL'));
  }
  return r && valido(r.base) && valido(r.usuario) ? r : null;
}

/** Máximo que se lee del `.env` de un proyecto para detectar sus variables. */
export const LIMITE_ENV_BYTES = 256 * 1024;

/** Primeros `LIMITE_ENV_BYTES` del archivo como texto; null si no existe o no se puede leer. */
export async function leerEnvAcotado(ruta: string): Promise<string | null> {
  let f: Awaited<ReturnType<typeof open>> | null = null;
  try {
    f = await open(ruta, 'r');
    const buf = Buffer.alloc(LIMITE_ENV_BYTES);
    const { bytesRead } = await f.read(buf, 0, LIMITE_ENV_BYTES, 0);
    return buf.subarray(0, bytesRead).toString('utf8');
  } catch {
    return null;
  } finally {
    await f?.close().catch(() => undefined);
  }
}

/** Lee el `.env` de la carpeta del proyecto; null si no existe o no declara una base SQL. */
export async function baseDelProyecto(carpeta: string): Promise<BaseProyecto | null> {
  const texto = await leerEnvAcotado(path.join(carpeta, '.env'));
  return texto === null ? null : baseDeVariables(leerVariablesEnv(texto));
}

/** Base del proyecto más el servidor al que apunta (para elegir la instancia correcta). */
export interface BaseConServidor extends BaseProyecto {
  host: string | null;
  puerto: number | null;
}

/**
 * Base de un proyecto con `.env.local` por encima de `.env` (como Symfony y Laravel), con el host
 * y el puerto declarados. La clave no se lee. null si no hay datos completos o no es SQL.
 */
export async function leerBaseDelProyecto(carpeta: string): Promise<BaseConServidor | null> {
  const variables = new Map<string, string>();
  for (const nombre of ['.env', '.env.local']) {
    const texto = await leerEnvAcotado(path.join(carpeta, nombre));
    if (texto !== null) for (const [k, v] of leerVariablesEnv(texto)) variables.set(k, v);
  }
  const base = baseDeVariables(variables);
  if (!base) return null;
  let host = (variables.get('database.default.hostname') ?? variables.get('DB_HOST') ?? '').trim();
  let puerto = Number.parseInt(
    (variables.get('database.default.port') ?? variables.get('DB_PORT') ?? '').trim(),
    10,
  );
  const url = variables.get('DATABASE_URL');
  if (url && !host) {
    try {
      const u = new URL(url.trim());
      host = u.hostname;
      if (u.port) puerto = Number.parseInt(u.port, 10);
    } catch {
      // URL ilegible: sin servidor declarado.
    }
  }
  return { ...base, host: host || null, puerto: Number.isInteger(puerto) ? puerto : null };
}
