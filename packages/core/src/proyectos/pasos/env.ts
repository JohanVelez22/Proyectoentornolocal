import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { bloqueEnv, valorEnv, type EstiloEnv } from '../../bd/env';
import { NOMBRE_SERVICIO } from '../../servicios/definicion';
import { TIPOS_CON_PHP, type TipoSitio } from '../../tipos';
import { existe, leerTexto } from '../archivos';
import { leerConfigProyecto } from '../config';
import type { ImplementacionPaso } from '../pasos';
import { escribirAtomico } from '../../sitios/urlbase';
import { sanear } from '../recetas';
import { motorDe as motorDeObjetivo } from '../../bd/basesDeDatos';
import {
  argsDe,
  comprobarSenal,
  nombreBase,
  objetivoDe,
  texto,
  type DatosConexion,
  type DepsPasos,
  type MotorBd,
} from './comun';

/** Archivos de ejemplo, en orden de preferencia (CodeIgniter 4 trae `env`). */
const PLANTILLAS = ['.env.example', '.env.sample', '.env.dist', 'env'];

export const MENSAJE_ENV_EXISTE = 'Ya existe .env; no se modificó';

const CI4_FORMATO = /^\s*#?\s*database\.default\.\w+\s*=/m;
const CLAVE_VALIDA = /^[A-Za-z_][A-Za-z0-9_.]*$/;
/** Claves del bloque de conexión: wolfcore.yml no las puede pisar. */
const CLAVES_BD = /^(DB_[A-Za-z0-9_]*|database\.default\..+|DATABASE_URL|MONGODB_URI)$/;

/** AAAAMMDD-HHmmss-mmm en hora local (cada respaldo del .env tiene su propio archivo). */
function sello(f: Date): string {
  const n = (v: number, l = 2): string => String(v).padStart(l, '0');
  return (
    `${f.getFullYear()}${n(f.getMonth() + 1)}${n(f.getDate())}-` +
    `${n(f.getHours())}${n(f.getMinutes())}${n(f.getSeconds())}-${n(f.getMilliseconds(), 3)}`
  );
}

const escapar = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const activa = (clave: string): RegExp =>
  new RegExp(`^[ \\t]*(?:export[ \\t]+)?${escapar(clave)}[ \\t]*=`);
const comentada = (clave: string): RegExp =>
  new RegExp(`^[ \\t]*#+[ \\t]*(?:export[ \\t]+)?${escapar(clave)}[ \\t]*=`);

/** true si el .env define la clave (sin comentar). */
export function tieneClave(texto: string, clave: string): boolean {
  const re = activa(clave);
  return texto.split(/\r?\n/).some((l) => re.test(l));
}

/**
 * Pone `linea` (ya armada: `CLAVE=valor`) en lugar de la primera línea activa de la clave; si no
 * hay, en lugar de la primera comentada (`# DB_HOST=…` de Laravel, `# database.default.…` de
 * CodeIgniter 4); si tampoco, la agrega al final. Conserva el fin de línea (CRLF o LF).
 */
export function fijarLinea(texto: string, clave: string, linea: string): string {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const lineas = texto === '' ? [] : texto.split(/(?<=\n)/);
  for (const re of [activa(clave), comentada(clave)]) {
    const i = lineas.findIndex((l) => re.test(l.replace(/\r?\n$/, '')));
    if (i >= 0) {
      const fin = /\r?\n$/.exec(lineas[i]!)?.[0] ?? '';
      lineas[i] = linea + fin;
      return lineas.join('');
    }
  }
  if (lineas.length > 0 && !lineas[lineas.length - 1]!.endsWith('\n')) {
    lineas[lineas.length - 1] += eol;
  }
  lineas.push(linea + eol);
  return lineas.join('');
}

/** Lector del .env según el tipo (ver `EstiloEnv`). */
function estiloDe(tipo: TipoSitio, t: string): EstiloEnv {
  if (tipo === 'codeigniter4') return 'ci4';
  if (tipo === 'codeigniter3') return CI4_FORMATO.test(t) ? 'ci4' : 'literal';
  return 'dotenv';
}

const NOMBRE_TIPO: Partial<Record<TipoSitio, string>> = {
  laravel: 'Laravel',
  codeigniter3: 'CodeIgniter 3',
  codeigniter4: 'CodeIgniter 4',
  fastapi: 'FastAPI',
  node: 'Node',
  wordpress: 'WordPress',
};

/** .env mínimo válido cuando el proyecto no trae ejemplo (Review Focus 2). */
function minimo(tipo: TipoSitio): string {
  switch (tipo) {
    case 'laravel':
      return [
        'APP_NAME=Laravel',
        'APP_ENV=local',
        'APP_KEY=',
        'APP_DEBUG=true',
        'APP_URL=http://localhost',
        '',
        'LOG_CHANNEL=stack',
        'LOG_LEVEL=debug',
        '',
        'SESSION_DRIVER=file',
        'CACHE_STORE=file',
        'QUEUE_CONNECTION=sync',
        '',
      ].join('\n');
    case 'codeigniter4':
      return 'CI_ENVIRONMENT = development\n';
    default:
      return '';
  }
}

/** Variable con la URL del sitio según el tipo (o la que ya usa el sitio). */
function variableUrl(tipo: TipoSitio, urlBaseVar: string | null, t: string): string | null {
  if (urlBaseVar) return urlBaseVar;
  if (tipo === 'laravel') return 'APP_URL';
  if (tipo === 'codeigniter3') return 'APP_BASE_URL';
  if (tipo === 'codeigniter4') return 'app.baseURL';
  return tieneClave(t, 'APP_URL') ? 'APP_URL' : null;
}

const ESQUEMAS: Record<MotorBd, string[]> = {
  postgresql: ['postgresql', 'postgres', 'pgsql'],
  mysql: ['mysql', 'mariadb'],
  mariadb: ['mysql', 'mariadb'],
  mongodb: ['mongodb'],
};
const ESQUEMA_POR_DEFECTO: Record<MotorBd, string> = {
  postgresql: 'postgresql',
  mysql: 'mysql+pymysql',
  mariadb: 'mysql+pymysql',
  mongodb: 'mongodb',
};
/** Doctrine (Symfony) no entiende `+pymysql`: en PHP el esquema es el del motor a secas. */
const ESQUEMA_PHP: Record<MotorBd, string> = {
  postgresql: 'postgresql',
  mysql: 'mysql',
  mariadb: 'mysql',
  mongodb: 'mongodb',
};

/** Valor de DATABASE_URL; conserva el esquema del ejemplo (`postgresql+psycopg`) si es del motor. */
function urlBd(
  motor: MotorBd,
  base: string,
  x: DatosConexion,
  previa: string | undefined,
  php = false,
): string {
  const esquema = /^([a-z][a-z0-9+]*):\/\//i.exec(previa ?? '')?.[1];
  const propio =
    esquema && ESQUEMAS[motor].includes(esquema.split('+')[0]!.toLowerCase())
      ? esquema
      : (php ? ESQUEMA_PHP : ESQUEMA_POR_DEFECTO)[motor];
  if (motor === 'mongodb') return `${propio}://${x.host}:${x.puerto}/${base}`;
  const u = encodeURIComponent(x.usuario);
  const c = encodeURIComponent(x.clave ?? '');
  return `${propio}://${u}:${c}@${x.host}:${x.puerto}/${base}`;
}

/** Valor de una clave activa (sin comillas), o undefined. */
function valorDe(t: string, clave: string): string | undefined {
  const re = new RegExp(`^[ \\t]*(?:export[ \\t]+)?${escapar(clave)}[ \\t]*=[ \\t]*(.*)$`);
  for (const l of t.split(/\r?\n/)) {
    const m = re.exec(l);
    if (!m) continue;
    const v = m[1]!.trim();
    const q = v[0];
    if ((q === '"' || q === "'") && v.indexOf(q, 1) > 0) return v.slice(1, v.indexOf(q, 1));
    return v.replace(/\s+#.*$/, '');
  }
  return undefined;
}

/**
 * Crea el .env del proyecto:
 * 1. Si ya existe no lo toca (salvo `args.sobrescribir`, que antes copia el actual a
 *    run/env-<id>-<fecha>.respaldo; la confirmación la pide la interfaz).
 * 2. Parte de .env.example (o .env.sample, .env.dist, `env` de CI4) o, sin ninguno, de un mínimo
 *    según el tipo.
 * 3. Rellena la URL y el nombre, la conexión de la BD (con el lector del tipo), Mailpit si está
 *    instalado y los valores extra de wolfcore.yml.
 * 4. Lo escribe de forma atómica. Si algo falla antes (motor apagado, valor que el lector no
 *    admite), no escribe nada. Nunca manda valores al registro.
 */
export function pasoEnvCrear(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const { sitio, carpeta } = ctx;
    // `.env.local` (Symfony): solo la conexión a la base, en el archivo que su .gitignore excluye;
    // el `.env` del proyecto se commitea y no debe llevar la clave del motor.
    const local = args.destino === '.env.local';
    const destino = path.join(carpeta, local ? '.env.local' : '.env');
    const sobrescribir = args.sobrescribir === true;
    const yaExiste = await existe(destino);
    if (yaExiste && !sobrescribir) {
      ctx.linea(local ? 'Ya existe .env.local; no se modificó' : MENSAJE_ENV_EXISTE);
      return;
    }

    let t = '';
    let origen: string | null = null;
    for (const n of local ? [] : PLANTILLAS) {
      const leido = await leerTexto(path.join(carpeta, n));
      if (leido !== null) {
        t = leido;
        origen = n;
        break;
      }
    }
    if (origen === null && !local) t = minimo(sitio.tipo);
    const estilo = estiloDe(sitio.tipo, t);
    const sep = estilo === 'ci4' ? ' = ' : '=';
    const poner = (clave: string, valor: string): void => {
      t = fijarLinea(t, clave, `${clave}${sep}${valorEnv(valor, estilo)}`);
    };

    // URL y nombre.
    // El https real del sitio guardado manda; si no se puede leer, el del paso (o https).
    const guardado = await d.leerSitio?.(sitio.id);
    const https = guardado ? guardado.https : typeof args.https === 'boolean' ? args.https : true;
    const varUrl = local ? null : variableUrl(sitio.tipo, sitio.urlBaseVar, t);
    if (varUrl) {
      const barra = sitio.tipo === 'codeigniter3' || sitio.tipo === 'codeigniter4' ? '/' : '';
      poner(varUrl, `${https ? 'https' : 'http'}://${sitio.dominio}${barra}`);
    }
    if (!local && (sitio.tipo === 'laravel' || tieneClave(t, 'APP_NAME'))) {
      poner('APP_NAME', sitio.nombre);
    }
    if (!local && sitio.tipo === 'codeigniter4') poner('CI_ENVIRONMENT', 'development');

    // Base de datos.
    const objetivo = await objetivoDe(ctx, d);
    const motor = objetivo ? motorDeObjetivo(objetivo) : null;
    let lineaBd: string | null = null;
    if (objetivo && motor) {
      const base = nombreBase(sitio, args);
      const x = { ...(await d.bd.conexion(objetivo)) };
      const usuario = texto(args.usuario);
      if (usuario) {
        const clave = texto(args.clave);
        // Nunca se mezcla un usuario propio con la clave del administrador del motor.
        if (!clave) {
          throw new Error(
            `Indique también la clave del usuario ${usuario} (args.clave) para escribirla en el .env.`,
          );
        }
        x.usuario = usuario;
        x.clave = clave;
      }
      const conUrl =
        local ||
        tieneClave(t, 'DATABASE_URL') ||
        (sitio.tipo === 'fastapi' && !tieneClave(t, 'DB_HOST'));
      const conBloque = !local && (sitio.tipo !== 'fastapi' || tieneClave(t, 'DB_HOST'));
      if (conUrl) {
        t = fijarLinea(
          t,
          'DATABASE_URL',
          `DATABASE_URL${sep}${valorEnv(urlBd(motor, base, x, valorDe(t, 'DATABASE_URL'), TIPOS_CON_PHP.includes(sitio.tipo)), estilo)}`,
        );
      }
      if (conBloque) {
        for (const l of bloqueEnv(motor, base, sitio.tipo, x, t).split('\n')) {
          const clave = /^([A-Za-z_][A-Za-z0-9_.]*)\s*=/.exec(l)?.[1];
          if (clave) t = fijarLinea(t, clave, l);
        }
      }
      lineaBd = `Se configuró la conexión a ${NOMBRE_SERVICIO[motor]} (base ${base}).`;
    }

    // Correo: Mailpit, si está instalado.
    const mailpit = local ? null : await d.mailpit();
    let lineaCorreo: string | null = null;
    if (mailpit && (sitio.tipo === 'laravel' || /^[ \t]*#*[ \t]*MAIL_HOST[ \t]*=/m.test(t))) {
      if (sitio.tipo === 'laravel' || tieneClave(t, 'MAIL_MAILER')) poner('MAIL_MAILER', 'smtp');
      poner('MAIL_HOST', '127.0.0.1');
      poner('MAIL_PORT', String(mailpit.puerto));
      lineaCorreo = `El correo sale por Mailpit (puerto ${mailpit.puerto}).`;
    }

    // Valores extra de wolfcore.yml.
    let extra: Record<string, string> = {};
    try {
      extra = local ? {} : ((await leerConfigProyecto(carpeta))?.env ?? {});
    } catch (e) {
      ctx.linea(sanear(`Aviso: ${e instanceof Error ? e.message : String(e)}`));
    }
    for (const [clave, valor] of Object.entries(extra)) {
      if (!CLAVE_VALIDA.test(clave)) {
        ctx.linea(sanear(`Aviso: se ignora la variable "${clave}" de wolfcore.yml.`));
        continue;
      }
      if (CLAVES_BD.test(clave)) {
        ctx.linea(
          sanear(
            `Aviso: se ignora ${clave} de wolfcore.yml: la conexión a la base la escribe WolfCore Dev.`,
          ),
        );
        continue;
      }
      if (/[\r\n]/.test(valor)) {
        throw new Error(`El valor de ${clave} en wolfcore.yml no puede llevar un salto de línea.`);
      }
      poner(clave, valor);
    }

    comprobarSenal(ctx);
    if (yaExiste) {
      const respaldo = path.join(
        path.dirname(d.rutas.receta(sitio.id)),
        `env-${sitio.id}-${sello(new Date())}.respaldo`,
      );
      await mkdir(path.dirname(respaldo), { recursive: true });
      await copyFile(destino, respaldo);
      ctx.linea(`Se guardó una copia del .env anterior en run/${path.basename(respaldo)}.`);
    }
    await escribirAtomico(destino, Buffer.from(t, 'utf8'));
    ctx.linea(
      local
        ? 'Se creó .env.local con la conexión a la base de datos.'
        : origen
          ? `Se creó .env a partir de ${origen}.`
          : `No hay .env.example: se creó un .env mínimo para ${NOMBRE_TIPO[sitio.tipo] ?? 'el proyecto'}.`,
    );
    if (lineaBd) ctx.linea(lineaBd);
    if (lineaCorreo) ctx.linea(lineaCorreo);
  };
}
