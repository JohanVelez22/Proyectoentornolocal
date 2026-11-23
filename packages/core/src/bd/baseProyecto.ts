import { readFile } from 'node:fs/promises';
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
  const base = decodeURIComponent(u.pathname.replace(/^\//, ''));
  const usuario = decodeURIComponent(u.username);
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

/** Lee el `.env` de la carpeta del proyecto; null si no existe o no declara una base SQL. */
export async function baseDelProyecto(carpeta: string): Promise<BaseProyecto | null> {
  let texto: string;
  try {
    texto = await readFile(path.join(carpeta, '.env'), 'utf8');
  } catch {
    return null;
  }
  return baseDeVariables(leerVariablesEnv(texto));
}
