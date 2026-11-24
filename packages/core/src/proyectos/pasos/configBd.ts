import { randomBytes } from 'node:crypto';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { motorDe } from '../../bd/basesDeDatos';
import type { MotorBd } from '../../bd/env';
import { NOMBRE_SERVICIO } from '../../servicios/definicion';
import { existe, leerTexto } from '../archivos';
import type { ContextoPaso, ImplementacionPaso } from '../pasos';
import { argsDe, comprobarSenal, nombreBase, objetivoDe, type DepsPasos } from './comun';
import { sello } from './env';

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

const VALOR_PHP = String.raw`(?:'[^']*'|"[^"]*"|\d+)`;

/**
 * Reemplaza valores de un archivo PHP en UNA sola pasada, línea por línea y solo donde la línea
 * empieza con la clave: lo que se escribe nunca se vuelve a leer (una clave que contuviera
 * `'database' => 1` no puede desviar un reemplazo posterior). Cada clave se cambia una vez (la
 * primera aparición) y todas deben existir. `despues` agrega líneas tras la de una clave.
 */
export function reemplazarClavesPhp(
  texto: string,
  reglas: Record<string, string>,
  patron: (clave: string) => RegExp,
  despues: Record<string, string> = {},
): string {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const pendientes = new Set(Object.keys(reglas));
  const salida: string[] = [];
  for (const linea of texto.split(/(?<=\n)/)) {
    let nueva = linea;
    let extra = '';
    for (const clave of pendientes) {
      const m = patron(clave).exec(linea);
      if (!m) continue;
      nueva = linea.slice(0, m.index) + m[1] + reglas[clave] + linea.slice(m.index + m[0].length);
      if (despues[clave]) extra = despues[clave] + eol;
      pendientes.delete(clave);
      break;
    }
    salida.push(nueva);
    if (extra) {
      if (!nueva.endsWith('\n')) salida[salida.length - 1] += eol;
      salida.push(extra);
    }
  }
  if (pendientes.size > 0) {
    throw new Error(`La plantilla de configuración no trae: ${[...pendientes].join(', ')}.`);
  }
  return salida.join('');
}

const escapar = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const arregloPhp = (clave: string): RegExp =>
  new RegExp(`^(\\s*['"]${escapar(clave)}['"]\\s*=>\\s*)${VALOR_PHP}`);
const definePhp = (clave: string): RegExp =>
  new RegExp(`^(\\s*define\\(\\s*'${escapar(clave)}'\\s*,\\s*)'[^']*'`);

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
  const reglas: Record<string, string> = {
    DB_NAME: cadenaPhp(base),
    DB_USER: cadenaPhp(x.usuario),
    DB_PASSWORD: cadenaPhp(x.clave ?? ''),
    DB_HOST: cadenaPhp(`${x.host}:${x.puerto}`),
  };
  // base64url: letras, dígitos, `-` y `_`; sin comillas ni barras que escapar en PHP.
  for (const clave of CLAVES_SAL) {
    if (new RegExp(`^\\s*define\\(\\s*'${clave}'`, 'm').test(plantilla)) {
      reglas[clave] = cadenaPhp(randomBytes(48).toString('base64url'));
    }
  }
  const t = reemplazarClavesPhp(plantilla, reglas, definePhp);
  comprobarSenal(ctx);
  await writeFile(destino, t, { encoding: 'utf8', flag: 'wx' });
  ctx.linea(`Se creó wp-config.php con la conexión a la base ${base}.`);
}

/**
 * CodeIgniter 3: pone la conexión en el grupo `default` de `application/config/database.php`
 * (CI3 no lee `.env`: su configuración es PHP), el `base_url` con el dominio https del sitio y
 * el entorno por defecto en `production` (en `development` CI3 muestra los avisos de
 * deprecación de PHP 8 en cada página; los errores quedan en `application/logs`). Si
 * `database.php` ya no es la plantilla original (tiene usuario, clave o base) exige
 * `args.sobrescribir` y antes guarda una copia en la carpeta de datos.
 */
async function codeigniter3(ctx: ContextoPaso, d: DepsPasos): Promise<void> {
  const ruta = path.join(ctx.carpeta, 'application', 'config', 'database.php');
  const plantilla = await leerTexto(ruta);
  if (plantilla === null) {
    throw new Error(
      'Falta application/config/database.php: ejecute antes la creación del proyecto.',
    );
  }
  const personalizada = ['username', 'password', 'database'].some((k) =>
    new RegExp(`^\\s*['"]${k}['"]\\s*=>\\s*(?:'[^']+'|"[^"]+")`, 'm').test(plantilla),
  );
  if (personalizada) {
    if (argsDe(ctx).sobrescribir !== true) {
      throw new Error(
        'database.php ya tiene una conexión configurada: confirme que quiere sobrescribirla.',
      );
    }
    const respaldo = path.join(
      path.dirname(d.rutas.receta(ctx.sitio.id)),
      `database-${ctx.sitio.id}-${sello(new Date())}.respaldo`,
    );
    await mkdir(path.dirname(respaldo), { recursive: true });
    await copyFile(ruta, respaldo);
    ctx.linea(`Se guardó una copia de database.php en run/${path.basename(respaldo)}.`);
  }
  const { motor, base, x } = await conexionDe(ctx, d, ['mysql', 'mariadb', 'postgresql']);
  const hayPuerto = /^\s*['"]port['"]\s*=>/m.test(plantilla);
  const t = reemplazarClavesPhp(
    plantilla,
    {
      hostname: cadenaPhp(x.host),
      username: cadenaPhp(x.usuario),
      password: cadenaPhp(x.clave ?? ''),
      database: cadenaPhp(base),
      dbdriver: cadenaPhp(motor === 'postgresql' ? 'postgre' : 'mysqli'),
      ...(hayPuerto ? { port: String(x.puerto) } : {}),
    },
    arregloPhp,
    hayPuerto ? {} : { hostname: `\t'port' => ${x.puerto},` },
  );
  comprobarSenal(ctx);
  await writeFile(ruta, t, 'utf8');
  ctx.linea(`Se configuró database.php con la conexión a la base ${base}.`);

  // base_url y entorno: solo si los archivos son los originales (si no, no se tocan).
  const https = argsDe(ctx).https !== false;
  const url = `${https ? 'https' : 'http'}://${ctx.sitio.dominio}/`;
  const rutaConfig = path.join(ctx.carpeta, 'application', 'config', 'config.php');
  const config = await leerTexto(rutaConfig);
  const baseUrl = /^(\s*\$config\['base_url'\]\s*=\s*)'';/m;
  if (config !== null && baseUrl.test(config)) {
    await writeFile(
      rutaConfig,
      config.replace(baseUrl, (_m, a: string) => `${a}'${url}';`),
      'utf8',
    );
    ctx.linea(`base_url quedó en ${url}`);
  }
  const rutaIndex = path.join(ctx.carpeta, 'index.php');
  const index = await leerTexto(rutaIndex);
  const entorno = /(define\('ENVIRONMENT',[^;\n]*:\s*)'development'\)/;
  if (index !== null && entorno.test(index)) {
    await writeFile(
      rutaIndex,
      index.replace(entorno, (_m, a: string) => `${a}'production')`),
      'utf8',
    );
    ctx.linea('El entorno por defecto quedó en production (los errores van a application/logs).');
  }
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
