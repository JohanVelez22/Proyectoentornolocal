import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { motorDe } from '../../bd/basesDeDatos';
import type { MotorBd } from '../../bd/env';
import { NOMBRE_SERVICIO } from '../../servicios/definicion';
import { existe, leerTexto } from '../archivos';
import type { ContextoPaso, ImplementacionPaso } from '../pasos';
import { argsDe, comprobarSenal, nombreBase, objetivoDe, type DepsPasos } from './comun';

const CLAVES_SAL = [
  'AUTH_KEY',
  'SECURE_AUTH_KEY',
  'LOGGED_IN_KEY',
  'NONCE_KEY',
  'AUTH_SALT',
  'SECURE_AUTH_SALT',
  'LOGGED_IN_SALT',
  'NONCE_SALT',
];

/** Texto para una cadena PHP entre comillas simples (solo `\` y `'` son especiales). */
const cadenaPhp = (v: string): string => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const escapar = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Conexión validada: sin saltos de línea ni NUL (irían rotos a un archivo PHP). */
async function conexionDe(ctx: ContextoPaso, d: DepsPasos, motoresOk: readonly MotorBd[]) {
  const objetivo = await objetivoDe(ctx, d);
  const motor = objetivo ? motorDe(objetivo) : null;
  if (!objetivo || !motor || !motoresOk.includes(motor)) {
    throw new Error(
      `Este proyecto necesita una base ${motoresOk.map((m) => NOMBRE_SERVICIO[m]).join(' o ')}.`,
    );
  }
  const base = nombreBase(ctx.sitio, argsDe(ctx));
  const x = await d.bd.conexion(objetivo);
  for (const v of [base, x.usuario, x.clave ?? '']) {
    if (/[\r\n\0]/.test(v)) throw new Error('Valor no válido para el archivo de configuración.');
  }
  return { motor, base, x };
}

/** Cambia el valor de `'clave' => …` en un arreglo PHP; falla si la plantilla no lo trae. */
function ponerClavePhp(t: string, clave: string, valor: string): string {
  const re = new RegExp(`(['"]${escapar(clave)}['"]\\s*=>\\s*)(?:'[^']*'|"[^"]*"|\\d+)`);
  if (!re.test(t)) throw new Error(`La plantilla de configuración no trae ${clave}.`);
  return t.replace(re, (_m, antes: string) => `${antes}${valor}`);
}

/**
 * WordPress: crea `wp-config.php` desde `wp-config-sample.php` con la conexión a MySQL/MariaDB del
 * proyecto y claves y sales nuevas (generadas aquí, sin pedir nada a api.wordpress.org). Si ya
 * existe `wp-config.php`, no lo toca.
 */
async function wordpress(ctx: ContextoPaso, d: DepsPasos): Promise<void> {
  const destino = path.join(ctx.carpeta, 'wp-config.php');
  if (await existe(destino)) {
    ctx.linea('Ya existe wp-config.php; no se modificó.');
    return;
  }
  const plantilla = await leerTexto(path.join(ctx.carpeta, 'wp-config-sample.php'));
  if (plantilla === null) {
    throw new Error('Falta wp-config-sample.php: ejecute antes la descarga de WordPress.');
  }
  const { base, x } = await conexionDe(ctx, d, ['mysql', 'mariadb']);
  let t = plantilla;
  const define = (clave: string, valor: string): void => {
    const re = new RegExp(`(define\\(\\s*'${escapar(clave)}'\\s*,\\s*)'[^']*'`);
    if (!re.test(t)) throw new Error(`wp-config-sample.php no define ${clave}.`);
    t = t.replace(re, (_m, antes: string) => `${antes}${cadenaPhp(valor)}`);
  };
  define('DB_NAME', base);
  define('DB_USER', x.usuario);
  define('DB_PASSWORD', x.clave ?? '');
  define('DB_HOST', `${x.host}:${x.puerto}`);
  for (const clave of CLAVES_SAL) {
    // base64url: letras, dígitos, `-` y `_`; sin comillas ni barras que escapar en PHP.
    if (new RegExp(`define\\(\\s*'${clave}'`).test(t)) {
      define(clave, randomBytes(48).toString('base64url'));
    }
  }
  comprobarSenal(ctx);
  await writeFile(destino, t, { encoding: 'utf8', flag: 'wx' });
  ctx.linea(`Se creó wp-config.php con la conexión a la base ${base}.`);
}

/**
 * CodeIgniter 3: pone la conexión en el grupo `default` de `application/config/database.php`
 * (CI3 no lee `.env`: su configuración es PHP). Los valores van como cadenas PHP escapadas.
 */
async function codeigniter3(ctx: ContextoPaso, d: DepsPasos): Promise<void> {
  const ruta = path.join(ctx.carpeta, 'application', 'config', 'database.php');
  const plantilla = await leerTexto(ruta);
  if (plantilla === null) {
    throw new Error(
      'Falta application/config/database.php: ejecute antes la creación del proyecto.',
    );
  }
  const { motor, base, x } = await conexionDe(ctx, d, ['mysql', 'mariadb', 'postgresql']);
  let t = plantilla;
  t = ponerClavePhp(t, 'hostname', cadenaPhp(x.host));
  t = ponerClavePhp(t, 'username', cadenaPhp(x.usuario));
  t = ponerClavePhp(t, 'password', cadenaPhp(x.clave ?? ''));
  t = ponerClavePhp(t, 'database', cadenaPhp(base));
  t = ponerClavePhp(t, 'dbdriver', cadenaPhp(motor === 'postgresql' ? 'postgre' : 'mysqli'));
  // El puerto: CI3 lo lee de `port`; si la plantilla no lo trae se agrega tras el hostname.
  if (/['"]port['"]\s*=>/.test(t)) t = ponerClavePhp(t, 'port', String(x.puerto));
  else t = t.replace(/(['"]hostname['"]\s*=>\s*'[^']*',?)/, `$1\n\t'port' => ${x.puerto},`);
  comprobarSenal(ctx);
  await writeFile(ruta, t, 'utf8');
  ctx.linea(`Se configuró database.php con la conexión a la base ${base}.`);
}

/** Escribe el archivo de configuración con la conexión a la base (`args.marco`). */
export function pasoConfigBdCrear(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    switch (argsDe(ctx).marco) {
      case 'wordpress':
        return wordpress(ctx, d);
      case 'codeigniter3':
        return codeigniter3(ctx, d);
      default:
        throw new Error('args.marco debe ser "wordpress" o "codeigniter3".');
    }
  };
}
