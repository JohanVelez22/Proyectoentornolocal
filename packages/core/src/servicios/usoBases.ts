import path from 'node:path';
import { leerEnvAcotado } from '../bd/baseProyecto';
import { motorBdDe } from '../proyectos/config';
import { leerVariablesEnv, serviciosDeEnv } from '../proyectos/detectar';
import type { IdServicioDatos } from '../tipos';

/** Servicio de datos que usa un proyecto según su `.env`: motor y puerto local. */
export interface UsoBase {
  servicio: Extract<IdServicioDatos, 'mysql' | 'mariadb' | 'postgresql' | 'mongodb' | 'redis'>;
  puerto: number;
}

/** Bases de datos que usa cada sitio (para "Iniciar todo" y el orden de sus procesos). */
export interface UsoSitio {
  sitioId: string;
  usos: UsoBase[];
}

const PUERTO_POR_DEFECTO: Record<UsoBase['servicio'], number> = {
  mysql: 3306,
  mariadb: 3306,
  postgresql: 5432,
  mongodb: 27017,
  redis: 6379,
};

/** Solo cuentan las conexiones a este equipo: una base remota no la enciende WolfCore Dev. */
const LOCALES = new Set(['', 'localhost', '127.0.0.1', '::1', '[::1]']);

function puertoValido(v: string | undefined): number | null {
  const t = (v ?? '').trim();
  if (!/^\d{1,5}$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= 65535 ? n : null;
}

/** Host y puerto de una URL de conexión (`postgresql://u:c@127.0.0.1:5433/base`). */
function desdeUrl(url: string | undefined): { host: string; puerto: number | null } | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    return { host: u.hostname.toLowerCase(), puerto: puertoValido(u.port) };
  } catch {
    return null;
  }
}

function uso(
  servicio: UsoBase['servicio'],
  host: string | undefined,
  puerto: number | null,
): UsoBase | null {
  if (!LOCALES.has((host ?? '').trim().toLowerCase())) return null;
  return { servicio, puerto: puerto ?? PUERTO_POR_DEFECTO[servicio] };
}

/**
 * Bases de datos locales que pide un `.env`: el motor (Laravel `DB_*`, CodeIgniter 4
 * `database.default.*`, `DATABASE_URL`, `MONGODB_URI`) y Redis, con su puerto (el estándar si
 * no se declara). Nunca lee ni devuelve claves.
 */
export function usosDeEnv(vars: Map<string, string>): UsoBase[] {
  const res: UsoBase[] = [];
  const servicios = serviciosDeEnv(vars);
  const motor = motorBdDe(servicios);
  if (motor) {
    let u: UsoBase | null;
    if (vars.has('database.default.hostname') || vars.has('database.default.port')) {
      u = uso(
        motor,
        vars.get('database.default.hostname'),
        puertoValido(vars.get('database.default.port')),
      );
    } else if (vars.has('DB_HOST') || vars.has('DB_PORT')) {
      u = uso(motor, vars.get('DB_HOST'), puertoValido(vars.get('DB_PORT')));
    } else {
      const url = desdeUrl(vars.get('DATABASE_URL') ?? vars.get('MONGODB_URI'));
      u = url ? uso(motor, url.host, url.puerto) : uso(motor, '', null);
    }
    if (u) res.push(u);
  }
  if (servicios.includes('redis')) {
    const url = desdeUrl(vars.get('REDIS_URL'));
    const u = vars.has('REDIS_HOST')
      ? uso('redis', vars.get('REDIS_HOST'), puertoValido(vars.get('REDIS_PORT')))
      : uso('redis', url?.host, url?.puerto ?? null);
    if (u) res.push(u);
  }
  return res;
}

/** Usos de la carpeta de un proyecto (solo su `.env`; sin `.env`, ninguno). */
export async function usosDeCarpeta(carpeta: string): Promise<UsoBase[]> {
  const texto = await leerEnvAcotado(path.join(carpeta, '.env'));
  return texto === null ? [] : usosDeEnv(leerVariablesEnv(texto));
}

/** ¿El uso apunta a este servicio? MySQL y MariaDB hablan el mismo protocolo. */
export function usoCompatible(uso: UsoBase, servicio: IdServicioDatos): boolean {
  if (uso.servicio === servicio) return true;
  const familia = (s: string) => (s === 'mariadb' ? 'mysql' : s);
  return familia(uso.servicio) === familia(servicio);
}
