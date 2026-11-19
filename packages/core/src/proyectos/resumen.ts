import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import type { PasoReceta } from './config';
import { nombreArchivoDeRuta } from '../plataforma/sistema';

/** Largo máximo del comando que se muestra por paso al confirmar (el diálogo corta a 120). */
export const MAX_COMANDO_RESUMEN = 110;

/** Aviso que encabeza el resumen si la receta no es la que había al marcar "Confío…". */
export const AVISO_RECETA_CAMBIADA =
  'AVISO: la receta cambió desde que se marcó "Confío en este repositorio"';

const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

/** Un argumento como se escribiría en una consola (entre comillas si lleva espacios). */
const argumento = (a: string): string => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);

const comandoDe = (v: unknown): string | null =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string')
    ? (v as string[]).map(argumento).join(' ')
    : null;

const acotar = (t: string, max = MAX_COMANDO_RESUMEN): string =>
  t.length > max ? `${t.slice(0, max - 1)}…` : t;

/**
 * Lo que realmente hace un paso, en una línea acotada: el comando (o la acción) según su tipo y
 * sus argumentos. No usa el título: en un wolfcore.yml el título lo escribe el repositorio y
 * podría no decir la verdad.
 */
export function comandoDePaso(p: PasoReceta): string {
  const a = p.args ?? {};
  let c: string;
  switch (p.tipo) {
    case 'composer-install':
      c = 'php composer.phar install --no-interaction --prefer-dist';
      break;
    case 'env-crear':
      c =
        a.sobrescribir === true ? 'crear .env (sobrescribe el actual con respaldo)' : 'crear .env';
      break;
    case 'key-generate':
      c = 'php artisan key:generate --force';
      break;
    case 'bd-crear':
      c = `crear la base de datos${texto(a.motor) ? ` en ${String(a.motor)}` : ''}${texto(a.base) ? ` ${String(a.base)}` : ''}`;
      break;
    case 'bd-restaurar':
      c = `restaurar ${texto(a.archivo) ? nombreArchivoDeRuta(String(a.archivo)) : 'un respaldo'}${a.confirmarSobrescribir === true ? ' (sobrescribe)' : ''}`;
      break;
    case 'migrar':
      c = `php artisan migrate --force${a.semilla === true ? ' --seed' : ''} (CodeIgniter 4: php spark migrate)`;
      break;
    case 'storage-link':
      c = 'php artisan storage:link';
      break;
    case 'npm-ci':
      c = 'npm ci (o npm install sin lock)';
      break;
    case 'npm-build':
      c = 'npm run build';
      break;
    case 'python-venv':
      c = 'python -m venv .venv';
      break;
    case 'pip-install':
      c = 'python -m pip install -r requirements.txt (o -e .)';
      break;
    case 'pgvector-activar':
      c = 'CREATE EXTENSION vector';
      break;
    case 'sitio-crear': {
      const procesos = Array.isArray(a.procesos)
        ? (a.procesos as unknown[])
            .map((x) => comandoDe((x as { comando?: unknown } | null)?.comando))
            .filter((x): x is string => x !== null)
        : [];
      c = `sitio ${texto(a.dominio) ?? ''}`.trim();
      if (procesos.length) c += `; procesos: ${procesos.join(' | ')}`;
      break;
    }
    case 'comando':
      c = comandoDe(a.comando) ?? '(comando no válido)';
      break;
    default:
      c = String(p.tipo);
  }
  return acotar(`[${p.tipo}] ${c}`);
}

/** JSON con las claves ordenadas: la misma receta da siempre el mismo texto. */
function estable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(estable).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${estable(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

/**
 * Huella (SHA-256) de lo que ejecuta una receta: tipo, argumentos y si es opcional de cada paso,
 * en orden. Los títulos no cuentan (no cambian lo que se ejecuta).
 */
export function huellaReceta(receta: readonly PasoReceta[]): string {
  const datos = receta.map((p) => ({
    id: p.id,
    tipo: p.tipo,
    args: p.args ?? {},
    opcional: p.opcional ?? false,
  }));
  return createHash('sha256').update(estable(datos)).digest('hex');
}

/** ¿Se puede escuchar en 127.0.0.1:puerto ahora? */
export function puertoLibreAhora(puerto: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = createServer();
    s.once('error', () => resolve(false));
    s.listen({ host: '127.0.0.1', port: puerto, exclusive: true }, () => {
      s.close(() => resolve(true));
    });
  });
}

/** Primer puerto de la búsqueda de puertos libres para procesos de proyecto. */
export const PRIMER_PUERTO_PROYECTO = 8000;
const ULTIMO_PUERTO_PROYECTO = 8999;

/**
 * Un puerto libre para un proceso de proyecto que no esté en `reservados`: `preferido` si sigue
 * libre; si no, el primero libre de 8000–8999.
 */
export async function buscarPuertoLibre(o: {
  reservados: Iterable<number>;
  preferido?: number | null;
  probar?: (puerto: number) => Promise<boolean>;
}): Promise<number> {
  const reservados = new Set(o.reservados);
  const probar = o.probar ?? puertoLibreAhora;
  const pref = o.preferido;
  if (pref && !reservados.has(pref) && (await probar(pref))) return pref;
  for (let p = PRIMER_PUERTO_PROYECTO; p <= ULTIMO_PUERTO_PROYECTO; p++) {
    if (reservados.has(p)) continue;
    if (await probar(p)) return p;
  }
  throw new Error(
    `No hay puertos libres entre ${PRIMER_PUERTO_PROYECTO} y ${ULTIMO_PUERTO_PROYECTO} para el proceso del proyecto.`,
  );
}
