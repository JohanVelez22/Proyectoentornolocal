/**
 * Prueba real de la Etapa A en Windows (`npm run test:win`): instala desde las fuentes oficiales
 * MySQL, MariaDB, PostgreSQL, Redis, MongoDB (+ mongosh), Mailpit, Ollama, Nginx, PHP 8.4,
 * Composer y Adminer en una carpeta temporal, los levanta en puertos altos (FlyEnv puede estar
 * usando los estándar) y comprueba respaldos, HTTPS, FTP, correo, .env con PHP real y apagado.
 *
 * Nunca toca el almacén de certificados real, el archivo hosts, el PATH del usuario ni la
 * carpeta de datos real. Ollama no descarga modelos: solo se consulta /api/tags.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';
import { Client as ClienteFtp } from 'basic-ftp';
import mysql from 'mysql2/promise';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { valorEnv, type EstiloEnv } from '../../src/bd/env';
import type { MotorBd } from '../../src/bd/env';
import { Nucleo } from '../../src/nucleo';
import { PlataformaWindows } from '../../src/plataforma/win';
import type { IdServicioDatos, Sitio } from '../../src/tipos';
import {
  esWindows,
  esperar,
  fetchConCache,
  limpiarBase,
  plataformaSegura,
  procesosDeBase,
  ventanasDeBase,
} from './comun';

const PUERTOS = {
  nginx: 18089,
  https: 18443,
  mysql: 13306,
  mariadb: 13307,
  postgresql: 15432,
  redis: 16379,
  mongodb: 27117,
  mailpit: 11025,
  ollama: 21434,
  ftp: 12121,
} as const;
/** Fijos en el programa (no configurables): la prueba comprueba que estén libres. */
const PUERTO_MAILPIT_WEB = 8025;
const PUERTO_ADMINER = 8090;
const PASIVOS: [number, number] = [52000, 52020];

const base = path.join(os.tmpdir(), `pel-etapa-a-${randomBytes(4).toString('hex')}`);
const proyectos = path.join(base, 'proyectos');
const documentos = path.join(base, 'Documentos');
const respaldos = path.join(base, 'respaldos');
const hostsCopia = path.join(base, 'hosts-copia');
const ollamaHome = path.join(os.homedir(), '.ollama');
const ollamaHomeExistia = existsSync(ollamaHome);

const MIN = 60_000;
const log = (...a: unknown[]): void => console.log('[etapa-a]', ...a);
const t0 = Date.now();
const reloj = (): string => `${Math.round((Date.now() - t0) / 1000)} s`;

let nucleo: Nucleo | null = null;
const n = (): Nucleo => {
  if (!nucleo) throw new Error('El núcleo no está creado');
  return nucleo;
};
let sitioSeguroId = '';
let versionPg = '';

const datosSitio = (extra: Partial<Omit<Sitio, 'id'>>): Omit<Sitio, 'id'> => ({
  nombre: 'Prueba',
  dominio: 'prueba.test',
  alias: [],
  carpeta: proyectos,
  tipo: 'estatico',
  php: null,
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: null,
  datosReales: false,
  https: false,
  redirigirHttps: false,
  confiado: false,
  git: null,
  procesos: [],
  runtimes: {},
  nota: '',
  ...extra,
});

interface Respuesta {
  status: number;
  cuerpo: string;
  cabeceras: http.IncomingHttpHeaders;
}

function pedirHttp(
  puerto: number,
  dominio: string,
  ruta: string,
  extra: Record<string, string> = {},
): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: puerto,
        path: ruta,
        headers: { Host: dominio, ...extra },
        timeout: 15_000,
      },
      (res) => {
        let cuerpo = '';
        res.setEncoding('utf8');
        res.on('data', (t: string) => (cuerpo += t));
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, cuerpo, cabeceras: res.headers }),
        );
      },
    );
    req.on('timeout', () => req.destroy(new Error('tiempo agotado')));
    req.on('error', reject);
    req.end();
  });
}

function pedirHttps(dominio: string, ca: string): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: '127.0.0.1',
        port: PUERTOS.https,
        path: '/',
        servername: dominio,
        headers: { Host: dominio },
        agent: new https.Agent({ ca, keepAlive: false }),
        timeout: 15_000,
      },
      (res) => {
        let cuerpo = '';
        res.setEncoding('utf8');
        res.on('data', (t: string) => (cuerpo += t));
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, cuerpo, cabeceras: res.headers }),
        );
      },
    );
    req.on('timeout', () => req.destroy(new Error('tiempo agotado')));
    req.on('error', reject);
    req.end();
  });
}

/** Conversación TCP de texto: envía cada orden y espera la línea final de su respuesta. */
async function conversar(
  puerto: number,
  ordenes: { enviar: string | null; esperar: RegExp }[],
): Promise<string[]> {
  const s = net.connect(puerto, '127.0.0.1');
  s.setEncoding('utf8');
  let buffer = '';
  const respuestas: string[] = [];
  let avisar: (() => void) | null = null;
  s.on('data', (t: string) => {
    buffer += t;
    avisar?.();
  });
  const fallo = new Promise<never>((_, rej) => s.on('error', rej));
  try {
    for (const o of ordenes) {
      if (o.enviar !== null) s.write(o.enviar);
      await Promise.race([
        fallo,
        new Promise<void>((res, rej) => {
          const limite = setTimeout(
            () => rej(new Error(`sin respuesta a ${o.enviar ?? 'saludo'}: ${buffer}`)),
            15_000,
          );
          const revisar = (): void => {
            if (o.esperar.test(buffer)) {
              clearTimeout(limite);
              avisar = null;
              res();
            }
          };
          avisar = revisar;
          revisar();
        }),
      ]);
      respuestas.push(buffer);
      buffer = '';
    }
  } finally {
    s.destroy();
  }
  return respuestas;
}

async function credencial(id: IdServicioDatos): Promise<string> {
  const c = await n().credenciales(id);
  if (!c) throw new Error(`Sin credenciales de ${id}`);
  return c.clave;
}

const FILAS = 200;
const nombreFila = (i: number): string =>
  i === 7
    ? "O'Brien"
    : i === 8
      ? 'barra \\ invertida y \\n literal'
      : i === 9
        ? 'comillas "dobles"; punto y coma -- y #'
        : `cliente ${i} ñandú €`;

type MotorSql = Exclude<MotorBd, 'mongodb'>;

async function conMysql<T>(
  motor: 'mysql' | 'mariadb',
  bd: string | null,
  fn: (c: mysql.Connection) => Promise<T>,
): Promise<T> {
  const c = await mysql.createConnection({
    host: '127.0.0.1',
    port: PUERTOS[motor],
    user: 'root',
    password: await credencial(motor),
    ...(bd ? { database: bd } : {}),
    charset: 'utf8mb4',
  });
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

async function conPg<T>(bd: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({
    host: '127.0.0.1',
    port: PUERTOS.postgresql,
    user: 'postgres',
    password: await credencial('postgresql'),
    database: bd,
  });
  c.on('error', () => undefined);
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

async function poblar(motor: MotorSql, bd: string): Promise<void> {
  const filas = Array.from({ length: FILAS }, (_, i) => [nombreFila(i)]);
  if (motor === 'postgresql') {
    await conPg(bd, async (c) => {
      await c.query('CREATE TABLE clientes (id serial PRIMARY KEY, nombre text NOT NULL)');
      for (const [nombre] of filas) {
        await c.query('INSERT INTO clientes (nombre) VALUES ($1)', [nombre]);
      }
      await c.query(
        "CREATE FUNCTION saludo() RETURNS text LANGUAGE sql AS $$ SELECT 'O''Brien'::text $$",
      );
    });
    return;
  }
  await conMysql(motor, bd, async (c) => {
    await c.query(
      'CREATE TABLE clientes (id int AUTO_INCREMENT PRIMARY KEY, nombre varchar(200) NOT NULL) DEFAULT CHARSET=utf8mb4',
    );
    await c.query('INSERT INTO clientes (nombre) VALUES ?', [filas]);
    // Rutina con \' dentro de una cadena: mysqldump --routines la vuelca así.
    await c.query("CREATE PROCEDURE saludo() BEGIN SELECT 'O\\'Brien' AS t; END");
  });
}

/** Filas, la fila de O'Brien y la rutina de una base restaurada. */
async function revisar(
  motor: MotorSql,
  bd: string,
): Promise<{ filas: number; obrien: number; saludo: string; barra: string }> {
  if (motor === 'postgresql') {
    return conPg(bd, async (c) => {
      const filas = Number((await c.query('SELECT count(*) AS n FROM clientes')).rows[0].n);
      const obrien = Number(
        (await c.query("SELECT count(*) AS n FROM clientes WHERE nombre = 'O''Brien'")).rows[0].n,
      );
      const saludo = String((await c.query('SELECT saludo() AS t')).rows[0].t);
      const barra = String(
        (await c.query('SELECT nombre FROM clientes ORDER BY id OFFSET 8 LIMIT 1')).rows[0].nombre,
      );
      return { filas, obrien, saludo, barra };
    });
  }
  return conMysql(motor, bd, async (c) => {
    const [[f]] = (await c.query('SELECT count(*) AS n FROM clientes')) as unknown as [
      { n: number }[],
    ];
    const [[o]] = (await c.query(
      "SELECT count(*) AS n FROM clientes WHERE nombre = 'O\\'Brien'",
    )) as unknown as [{ n: number }[]];
    const [conjuntos] = (await c.query('CALL saludo()')) as unknown as [{ t: string }[][]];
    const [[b]] = (await c.query(
      'SELECT nombre FROM clientes ORDER BY id LIMIT 8, 1',
    )) as unknown as [{ nombre: string }[]];
    return {
      filas: Number(f!.n),
      obrien: Number(o!.n),
      saludo: String(conjuntos[0]![0]!.t),
      barra: b!.nombre,
    };
  });
}

async function agregarFila(motor: MotorSql, bd: string): Promise<void> {
  if (motor === 'postgresql') {
    await conPg(bd, (c) => c.query("INSERT INTO clientes (nombre) VALUES ('extra')"));
    return;
  }
  await conMysql(motor, bd, (c) => c.query("INSERT INTO clientes (nombre) VALUES ('extra')"));
}

const esperado = { filas: FILAS, obrien: 1, saludo: "O'Brien", barra: nombreFila(8) };

/** Ejecuta un .cmd (los shims) con cmd.exe; devuelve la salida o lanza con ella. */
function cmd(
  archivo: string,
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
): string {
  try {
    return execFileSync('cmd.exe', ['/d', '/c', archivo, ...args], {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, ...env },
      timeout: 10 * MIN,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    const x = e as { stdout?: string; stderr?: string };
    throw new Error(`${archivo} ${args.join(' ')} falló:\n${x.stdout ?? ''}\n${x.stderr ?? ''}`);
  }
}

describe.skipIf(!esWindows)('Etapa A: integración real en Windows', () => {
  beforeAll(async () => {
    mkdirSync(proyectos, { recursive: true });
    mkdirSync(documentos, { recursive: true });
    mkdirSync(respaldos, { recursive: true });
    writeFileSync(hostsCopia, '127.0.0.1 localhost\r\n');
    log('base temporal:', base);
    nucleo = await Nucleo.crear({
      base,
      plataforma: plataformaSegura(hostsCopia, documentos),
      fetch: fetchConCache(log),
    });
    const x = n();
    await x.guardarAjustes({ puerto: PUERTOS.nginx, trabajadores: 1 });
    await x.cambiarPuertoHttps(PUERTOS.https);
    await x.sitios.modificarConfig((c) => {
      c.ftp.puerto = PUERTOS.ftp;
      c.ftp.pasivos = PASIVOS;
    });
    for (const id of [
      'mysql',
      'mariadb',
      'postgresql',
      'redis',
      'mongodb',
      'mailpit',
      'ollama',
    ] as const) {
      await x.cambiarPuertoServicio(id, PUERTOS[id]);
    }
    const ocupados = await new PlataformaWindows().duenosDePuertos([
      PUERTO_MAILPIT_WEB,
      PUERTO_ADMINER,
      ...Object.values(PUERTOS),
    ]);
    log('puertos ocupados antes de empezar:', JSON.stringify([...ocupados]));
    expect([...ocupados.keys()]).toEqual([]);
  }, 5 * MIN);

  afterAll(async () => {
    if (nucleo) {
      await nucleo.cerrar({ detenerServicios: true }).catch((e: unknown) => log('cerrar:', e));
      nucleo = null;
    }
    if (esWindows && process.env.PEL_INT_CONSERVAR !== '1') limpiarBase(base, log);
    // Ollama crea ~/.ollama (su clave de identidad) al arrancar: se quita si no existía.
    if (!ollamaHomeExistia && existsSync(ollamaHome)) {
      rmSync(ollamaHome, { recursive: true, force: true });
      log('quitado', ollamaHome, '(lo creó Ollama durante la prueba)');
    }
  }, 5 * MIN);

  it(
    'instala todo desde las fuentes oficiales (SHA-256 verificado)',
    async () => {
      const x = n();
      const php = (await x.listarVersiones('php')).find((v) => v.rama === '8.4');
      expect(php, 'releases.json no trae PHP 8.4').toBeDefined();
      const servicios = [
        'nginx',
        'mysql',
        'mariadb',
        'postgresql',
        'redis',
        'mongodb',
        'mongosh',
        'mailpit',
        'ollama',
      ] as const;
      const versiones = [php!];
      for (const s of servicios) versiones.push((await x.listarVersiones(s))[0]!);
      for (const v of versiones) {
        const t = Date.now();
        await x.instalador.instalar(v);
        log(`instalado ${v.servicio} ${v.version} en ${Date.now() - t} ms`);
      }
      versionPg = (await x.instalador.instalados('postgresql'))[0]!;
      let t = Date.now();
      await x.instalarComposer();
      log(`instalado Composer en ${Date.now() - t} ms`);
      t = Date.now();
      await x.instalarAdminer();
      log(`instalado Adminer en ${Date.now() - t} ms`);
      for (const s of servicios) expect(await x.instalador.instalados(s)).toHaveLength(1);
      expect(existsSync(x.rutas.herramientas('bin', 'composer.cmd'))).toBe(true);
      expect(existsSync(x.rutas.herramientas('adminer', 'index.php'))).toBe(true);
      log('reloj', reloj());
    },
    120 * MIN,
  );

  it(
    'inicia MySQL, MariaDB, PostgreSQL, Redis, MongoDB y Mailpit con clave',
    async () => {
      const x = n();
      for (const id of ['mysql', 'mariadb', 'postgresql', 'redis', 'mongodb', 'mailpit'] as const) {
        const t = Date.now();
        await x.servicios.iniciar(id);
        await esperar(
          `${id} encendido`,
          async () => {
            const e = (await x.estadoGeneral()).servicios.find((s) => s.id === id);
            if (e?.estado === 'error') throw new Error(`${id} en error: ${e.mensaje ?? ''}`);
            return e?.estado === 'encendido' ? e : null;
          },
          60_000,
        );
        log(`${id} encendido en ${Date.now() - t} ms (puerto ${PUERTOS[id]})`);
      }

      // MySQL 8.4: --initialize-insecure con --init-file dejó la clave de root@127.0.0.1.
      for (const motor of ['mysql', 'mariadb'] as const) {
        const v = await conMysql(motor, null, async (c) => {
          const [[r]] = (await c.query(
            'SELECT VERSION() AS v, CURRENT_USER() AS u',
          )) as unknown as [{ v: string; u: string }[]];
          return r!;
        });
        log(`${motor}: conecta root con clave →`, JSON.stringify(v));
        expect(v.u).toMatch(/^root@/);
        // Sin clave debe rechazar: la clave quedó puesta de verdad.
        await expect(
          mysql.createConnection({ host: '127.0.0.1', port: PUERTOS[motor], user: 'root' }),
        ).rejects.toThrow(/Access denied/);
      }
      const pgv = await conPg(
        'postgres',
        async (c) => (await c.query('SELECT version() AS v')).rows[0].v,
      );
      log('postgresql: conecta con scram →', pgv);
      const malo = new pg.Client({
        host: '127.0.0.1',
        port: PUERTOS.postgresql,
        user: 'postgres',
        password: 'mala',
        database: 'postgres',
      });
      malo.on('error', () => undefined);
      await expect(malo.connect()).rejects.toThrow(/password authentication failed/);
      const hba = readFileSync(
        path.join(
          x.rutas.datos('postgresql', versionPg, () => versionPg.split('.')[0]!),
          'pg_hba.conf',
        ),
        'utf8',
      );
      expect(hba).toContain('scram-sha-256');
      expect(hba).not.toMatch(/\btrust\b/);
    },
    15 * MIN,
  );

  for (const motor of ['mysql', 'mariadb', 'postgresql'] as const) {
    it(
      `${motor}: crear, respaldar, restaurar, sobrescribir con confirmación e importar`,
      async () => {
        const x = n();
        await x.crearBase(motor, 'origen_rt');
        await poblar(motor, 'origen_rt');
        expect(await revisar(motor, 'origen_rt')).toEqual(esperado);

        let t = Date.now();
        const { archivo } = await x.respaldarBase(motor, 'origen_rt', respaldos);
        log(
          `${motor}: respaldo ${path.basename(archivo)} ${statSync(archivo).size} bytes en ${Date.now() - t} ms`,
        );
        expect(await x.formatoRespaldo(archivo)).toBeTruthy();

        t = Date.now();
        const r1 = await x.restaurarBase(motor, archivo, 'copia_rt');
        log(`${motor}: restaurado en copia_rt en ${Date.now() - t} ms`, JSON.stringify(r1));
        expect(await revisar(motor, 'copia_rt')).toEqual(esperado);

        // Base con tablas sin confirmar: se rechaza sin tocar nada.
        await agregarFila(motor, 'copia_rt');
        await expect(x.restaurarBase(motor, archivo, 'copia_rt')).rejects.toThrow(
          /ya tiene tablas/,
        );
        expect((await revisar(motor, 'copia_rt')).filas).toBe(FILAS + 1);

        // Con confirmación: respaldo previo y reemplazo (no mezcla: vuelve a 200 filas).
        const r2 = await x.restaurarBase(motor, archivo, 'copia_rt', {
          confirmarSobrescribir: true,
        });
        log(`${motor}: sobrescrito con confirmación`, JSON.stringify(r2));
        expect(r2.respaldoPrevio).toBeTruthy();
        expect(r2.respaldoPrevio!.startsWith(documentos)).toBe(true);
        expect(statSync(r2.respaldoPrevio!).size).toBeGreaterThan(0);
        expect(await revisar(motor, 'copia_rt')).toEqual(esperado);

        // "Importar desde otro servidor" (aquí el origen es el mismo servidor, otra base).
        t = Date.now();
        const r3 = await x.importarBase(
          motor,
          {
            host: '127.0.0.1',
            puerto: PUERTOS[motor],
            usuario: motor === 'postgresql' ? 'postgres' : 'root',
            clave: await credencial(motor),
            base: 'origen_rt',
          },
          'importada_rt',
        );
        log(`${motor}: importado en ${Date.now() - t} ms`, JSON.stringify(r3));
        expect(await revisar(motor, 'importada_rt')).toEqual(esperado);

        const bases = (await x.listarBases(motor)).map((b) => b.nombre);
        log(`${motor}: bases`, bases.join(', '));
        expect(bases).toEqual(expect.arrayContaining(['origen_rt', 'copia_rt', 'importada_rt']));
      },
      20 * MIN,
    );
  }

  it(
    'postgresql: restaura un pg_dump -Fc guardado como .sql y un volcado plano',
    async () => {
      const x = n();
      const bin = path.join(x.rutas.bin('postgresql', versionPg), 'pgsql', 'bin', 'pg_dump.exe');
      const env = { ...process.env, PGPASSWORD: await credencial('postgresql') };
      const comun = ['-h', '127.0.0.1', '-p', String(PUERTOS.postgresql), '-U', 'postgres'];
      const custom = path.join(respaldos, 'custom con extension.sql');
      const plano = path.join(respaldos, 'plano.sql');
      execFileSync(bin, [...comun, '-Fc', '-f', custom, 'origen_rt'], { env, windowsHide: true });
      execFileSync(bin, [...comun, '-Fp', '-f', plano, 'origen_rt'], { env, windowsHide: true });
      log('formato de custom .sql:', JSON.stringify(await x.formatoRespaldo(custom)));
      const r1 = await x.restaurarBase('postgresql', custom, 'custom_sql_rt');
      log('custom .sql restaurado', JSON.stringify(r1));
      expect(await revisar('postgresql', 'custom_sql_rt')).toEqual(esperado);
      const r2 = await x.restaurarBase('postgresql', plano, 'plano_rt');
      log('plano restaurado', JSON.stringify(r2));
      expect(await revisar('postgresql', 'plano_rt')).toEqual(esperado);
    },
    10 * MIN,
  );

  it(
    'Redis responde PONG y MongoDB inserta y lee con mongosh',
    async () => {
      const x = n();
      const [, pong, , valor] = await conversar(PUERTOS.redis, [
        { enviar: null, esperar: /^/ },
        { enviar: 'PING\r\n', esperar: /\r\n$/ },
        { enviar: 'SET pel-prueba hola\r\n', esperar: /\r\n$/ },
        { enviar: 'GET pel-prueba\r\n', esperar: /hola\r\n$/ },
      ]);
      log('redis PING →', JSON.stringify(pong), 'GET →', JSON.stringify(valor));
      expect(pong).toBe('+PONG\r\n');

      await x.crearBase('mongodb', 'prueba_mongo');
      const mongosh = path.join(
        x.rutas.bin('mongosh', (await x.instalador.instalados('mongosh'))[0]!),
        'bin',
        'mongosh.exe',
      );
      const salida = execFileSync(
        mongosh,
        [
          '--quiet',
          '--port',
          String(PUERTOS.mongodb),
          '--eval',
          "const d=db.getSiblingDB('prueba_mongo'); d.items.insertOne({n:\"O'Brien\",k:1}); print(EJSON.stringify(d.items.findOne({k:1},{_id:0})))",
        ],
        { encoding: 'utf8', windowsHide: true },
      ).trim();
      log('mongosh →', salida);
      expect(JSON.parse(salida.split(/\r?\n/).at(-1)!)).toEqual({ n: "O'Brien", k: 1 });
      expect((await x.listarBases('mongodb')).map((b) => b.nombre)).toContain('prueba_mongo');
    },
    5 * MIN,
  );

  it(
    'Mailpit recibe un correo por SMTP y lo muestra por su API',
    async () => {
      const asunto = `Prueba WolfCore ${randomBytes(3).toString('hex')}`;
      await conversar(PUERTOS.mailpit, [
        { enviar: null, esperar: /^220 /m },
        { enviar: 'EHLO prueba\r\n', esperar: /^250 /m },
        { enviar: 'MAIL FROM:<app@prueba.test>\r\n', esperar: /^250 /m },
        { enviar: 'RCPT TO:<cliente@prueba.test>\r\n', esperar: /^250 /m },
        { enviar: 'DATA\r\n', esperar: /^354 /m },
        {
          enviar: `Subject: ${asunto}\r\nFrom: app@prueba.test\r\nTo: cliente@prueba.test\r\n\r\nHola desde la prueba.\r\n.\r\n`,
          esperar: /^250 /m,
        },
        { enviar: 'QUIT\r\n', esperar: /^221 /m },
      ]);
      const lista = await esperar(
        'el correo en Mailpit',
        async () => {
          const r = await fetch(`http://127.0.0.1:${PUERTO_MAILPIT_WEB}/api/v1/messages`);
          const j = (await r.json()) as { messages: { Subject: string }[] };
          return j.messages.some((m) => m.Subject === asunto) ? j : null;
        },
        15_000,
      );
      log('mailpit API →', lista.messages.map((m) => m.Subject).join(' | '));
      expect(await n().noLeidosCorreo()).toBeGreaterThanOrEqual(1);
    },
    5 * MIN,
  );

  it(
    'HTTPS: sirve con la CA temporal y no redirige desde un túnel (Cf-Connecting-Ip)',
    async () => {
      const x = n();
      const dir = path.join(proyectos, 'seguro');
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'index.html'), 'hola-https');
      const r = await x.guardarSitio(
        datosSitio({
          nombre: 'Seguro',
          dominio: 'seguro.test',
          carpeta: dir,
          https: true,
          redirigirHttps: true,
        }),
      );
      log('aplicar sitio HTTPS:', JSON.stringify(r.aplicar));
      sitioSeguroId = r.sitio.id;
      expect(r.aplicar.httpsPendiente).toEqual([]);
      expect(existsSync(x.rutas.caCrt())).toBe(true);
      expect((await x.estadoHttps()).caInstalada).toBe(false);

      await x.servicios.iniciar('php-8.4');
      await x.servicios.iniciar('nginx');
      await esperar(
        'nginx encendido',
        async () => {
          const g = await x.estadoGeneral();
          return g.servicios.find((s) => s.id === 'nginx')?.estado === 'encendido' ? g : null;
        },
        30_000,
      );

      const ca = readFileSync(x.rutas.caCrt(), 'utf8');
      const seguro = await pedirHttps('seguro.test', ca);
      log('GET https://seguro.test:18443/ →', seguro.status, seguro.cuerpo);
      expect(seguro).toMatchObject({ status: 200, cuerpo: 'hola-https' });
      // Sin la CA temporal, la conexión no es de confianza.
      await expect(pedirHttps('seguro.test', '')).rejects.toThrow();

      const redir = await pedirHttp(PUERTOS.nginx, 'seguro.test', '/x?y=1');
      log('GET http://seguro.test/x?y=1 →', redir.status, redir.cabeceras.location);
      expect(redir.status).toBe(301);
      expect(redir.cabeceras.location).toBe(`https://seguro.test:${PUERTOS.https}/x?y=1`);
      const tunel = await pedirHttp(PUERTOS.nginx, 'seguro.test', '/', {
        'Cf-Connecting-Ip': '203.0.113.7',
      });
      log('GET http con Cf-Connecting-Ip →', tunel.status, tunel.cuerpo);
      expect(tunel).toMatchObject({ status: 200, cuerpo: 'hola-https' });
    },
    5 * MIN,
  );

  it(
    'Adminer responde 200 en su puerto',
    async () => {
      const r = await esperar(
        'Adminer',
        async () => {
          const res = await pedirHttp(PUERTO_ADMINER, '127.0.0.1', '/');
          return res.status === 200 ? res : null;
        },
        30_000,
      );
      log(`GET http://127.0.0.1:${PUERTO_ADMINER}/ →`, r.status, r.cuerpo.length, 'bytes');
      expect(r.cuerpo).toContain('Adminer');
      const fuera = await pedirHttp(PUERTO_ADMINER, '127.0.0.1', '/otro.php');
      expect(fuera.status).toBe(404);
      expect(await n().disponibilidadAdminer()).toEqual({ disponible: true, rama: '8.4' });
    },
    5 * MIN,
  );

  it(
    'FTP: sube y baja con basic-ftp y rechaza PORT',
    async () => {
      const x = n();
      const cred = await x.activarFtp(sitioSeguroId);
      await x.servicios.iniciar('ftp');
      const c = new ClienteFtp(15_000);
      try {
        await c.access({
          host: '127.0.0.1',
          port: PUERTOS.ftp,
          user: cred.usuario,
          password: cred.clave,
        });
        await c.uploadFrom(Readable.from(['contenido subido por FTP ñ']), 'subido.txt');
        expect(readFileSync(path.join(proyectos, 'seguro', 'subido.txt'), 'utf8')).toBe(
          'contenido subido por FTP ñ',
        );
        let bajado = '';
        await c.downloadTo(
          new Writable({
            write(trozo: Buffer, _cod, listo) {
              bajado += trozo.toString('utf8');
              listo();
            },
          }),
          'index.html',
        );
        log('FTP bajado index.html →', bajado);
        expect(bajado).toBe('hola-https');
        const lista = (await c.list()).map((f) => f.name);
        log('FTP lista →', lista.join(', '));
        expect(lista).toEqual(expect.arrayContaining(['index.html', 'subido.txt']));
        const port = await c.send('PORT 127,0,0,1,200,10').then(
          (r) => `aceptado ${r.code}`,
          (e: unknown) => `rechazado: ${String(e)}`,
        );
        log('FTP PORT →', port);
        expect(port).toMatch(/^rechazado/);
      } finally {
        c.close();
      }
    },
    5 * MIN,
  );

  it(
    'Composer por el shim y .env de ida y vuelta con PHP real (phpdotenv, CodeIgniter 3 y 4)',
    async () => {
      const x = n();
      const shim = x.rutas.herramientas('bin', 'composer.cmd');
      const envComposer = {
        COMPOSER_HOME: path.join(base, 'composer-home'),
        COMPOSER_NO_INTERACTION: '1',
      };
      const version = cmd(shim, ['--version'], base, envComposer);
      log('composer --version →', version.trim());
      expect(version).toMatch(/Composer version 2\.\d+\.\d+/);
      expect(await x.versionComposer()).toMatch(/^2\.\d+\.\d+$/);

      const proyecto = path.join(base, 'php-env');
      mkdirSync(proyecto, { recursive: true });
      writeFileSync(path.join(proyecto, 'composer.json'), '{"require":{}}');
      let t = Date.now();
      cmd(shim, ['require', 'vlucas/phpdotenv', '--no-progress'], proyecto, envComposer);
      log(`composer require vlucas/phpdotenv en ${Date.now() - t} ms`);
      t = Date.now();
      cmd(
        shim,
        ['require', 'codeigniter4/framework', '--no-progress', '--ignore-platform-reqs'],
        proyecto,
        envComposer,
      );
      log(`composer require codeigniter4/framework en ${Date.now() - t} ms`);
      const instaladas = JSON.parse(
        readFileSync(path.join(proyecto, 'vendor', 'composer', 'installed.json'), 'utf8'),
      ) as { packages: { name: string; version: string }[] };
      log(
        'paquetes:',
        instaladas.packages
          .filter((p) => /phpdotenv|codeigniter4/.test(p.name))
          .map((p) => `${p.name} ${p.version}`)
          .join(', '),
      );

      const valores = [
        'C:\\Program Files\\nodejs\\npm.cmd',
        'p#a ss"x$y',
        `a\\b"c'd$e#f g=h`,
        "O'Brien",
        'clave con espacios = y # comentario',
        '$HOME ${APP_NAME} \\$ fin',
        'termina en barra\\',
        'barra\\nliteral y \\\\ doble',
        'ñandú € tilde',
        '"empieza con comilla',
        "termina con comilla'",
      ];

      const php = path.join(x.rutas.bin('php', '8.4'), 'php.exe');
      const ini = await x.servicios.php.asegurarPhpIni('8.4');
      const scripts = path.join(base, 'php-scripts');
      mkdirSync(scripts, { recursive: true });
      writeFileSync(
        path.join(scripts, 'dotenv.php'),
        [
          '<?php',
          'require $argv[1] . "/vendor/autoload.php";',
          '$v = Dotenv\\Dotenv::createArrayBacked($argv[2], $argv[3])->load();',
          'echo json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);',
          '',
        ].join('\n'),
      );
      writeFileSync(
        path.join(scripts, 'ci4.php'),
        [
          '<?php',
          'require $argv[1] . "/vendor/autoload.php";',
          '$d = new CodeIgniter\\Config\\DotEnv($argv[2], $argv[3]);',
          'echo json_encode($d->parse(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);',
          '',
        ].join('\n'),
      );
      // Copia del lector de .env de index.php de WolfCore Diamantes y WolfCore Dollar
      // (CodeIgniter 3, sin escapes: solo trim de las comillas de los extremos).
      writeFileSync(
        path.join(scripts, 'ci3.php'),
        [
          '<?php',
          '$_archivo = $argv[1];',
          'foreach (file($_archivo, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $_line)',
          '{',
          '  $_line = trim($_line);',
          "  if ($_line === '' OR $_line[0] === '#' OR strpos($_line, '=') === FALSE) { continue; }",
          "  list($_key, $_value) = array_map('trim', explode('=', $_line, 2));",
          '  $_value = trim($_value, "\\"\'");',
          "  if (getenv($_key) === FALSE) { putenv($_key.'='.$_value); $_SERVER[$_key] = $_value; }",
          '}',
          '$s = [];',
          'foreach (array_slice($argv, 2) as $k) { $s[$k] = $_SERVER[$k] ?? null; }',
          'echo json_encode($s, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);',
          '',
        ].join('\n'),
      );

      const correr = (script: string, args: string[]): Record<string, string | null> => {
        const salida = execFileSync(php, ['-c', ini, path.join(scripts, script), ...args], {
          encoding: 'utf8',
          windowsHide: true,
        });
        return JSON.parse(salida) as Record<string, string | null>;
      };

      const resumen: string[] = [];
      for (const estilo of ['dotenv', 'ci4', 'literal'] as EstiloEnv[]) {
        const lineas: string[] = [];
        const claves: string[] = [];
        const esperados: Record<string, string> = {};
        valores.forEach((v, i) => {
          let texto: string;
          try {
            texto = valorEnv(v, estilo);
          } catch (e) {
            resumen.push(`${estilo} V${i}: no representable (${(e as Error).message})`);
            // Solo los casos documentados: comillas en un extremo (CI3) o ${…} (CI4).
            if (estilo === 'ci4') expect(v).toMatch(/\$\{\w+\}/);
            else expect(estilo).toBe('literal');
            return;
          }
          lineas.push(`V${i}=${texto}`);
          claves.push(`V${i}`);
          esperados[`V${i}`] = v;
        });
        const archivo = `${estilo}.env`;
        writeFileSync(path.join(proyecto, archivo), lineas.join('\n') + '\n');
        log(`.env (${estilo}):\n${lineas.join('\n')}`);
        const leido =
          estilo === 'dotenv'
            ? correr('dotenv.php', [proyecto, proyecto, archivo])
            : estilo === 'ci4'
              ? correr('ci4.php', [proyecto, proyecto, archivo])
              : correr('ci3.php', [path.join(proyecto, archivo), ...claves]);
        for (const k of claves) {
          const ok = leido[k] === esperados[k];
          resumen.push(`${estilo} ${k}: ${ok ? 'OK' : `DISTINTO ${JSON.stringify(leido[k])}`}`);
        }
        const recortado = Object.fromEntries(claves.map((k) => [k, leido[k]]));
        expect(recortado, `lector ${estilo}`).toEqual(esperados);
      }
      log('ida y vuelta .env:\n' + resumen.join('\n'));

      // El .env real del QA: una ruta con barras en Laravel no rompe phpdotenv.
      await copyFile(path.join(proyecto, 'dotenv.env'), path.join(proyecto, '.env'));
      expect(correr('dotenv.php', [proyecto, proyecto, '.env'])['V0']).toBe(valores[0]);
    },
    20 * MIN,
  );

  it(
    'Ollama: instala, enciende y responde /api/tags (sin descargar modelos)',
    async () => {
      const x = n();
      const t = Date.now();
      await x.servicios.iniciar('ollama');
      await esperar(
        'ollama encendido',
        async () => {
          const e = (await x.estadoGeneral()).servicios.find((s) => s.id === 'ollama');
          if (e?.estado === 'error') throw new Error(`ollama en error: ${e.mensaje ?? ''}`);
          return e?.estado === 'encendido' ? e : null;
        },
        60_000,
      );
      log(`ollama encendido en ${Date.now() - t} ms`);
      const r = await fetch(`http://127.0.0.1:${PUERTOS.ollama}/api/tags`);
      const cuerpo = await r.text();
      log('GET /api/tags →', r.status, cuerpo);
      expect(r.status).toBe(200);
      expect(await x.modelosIa()).toEqual([]);
      const v = await fetch(`http://127.0.0.1:${PUERTOS.ollama}/api/version`);
      log('GET /api/version →', v.status, await v.text());
    },
    10 * MIN,
  );

  it(
    'ningún servicio abre ventanas de consola (tampoco las conexiones de PostgreSQL)',
    async () => {
      const x = n();
      log(
        'procesos en marcha:',
        procesosDeBase(base)
          .map((p) => p.nombre)
          .join(', '),
      );
      // Cada conexión de PostgreSQL crea un proceso hijo del servidor: es el caso que abría ventanas.
      const clave = await credencial('postgresql');
      const clientes = Array.from({ length: 5 }, () => {
        const c = new pg.Client({
          host: '127.0.0.1',
          port: PUERTOS.postgresql,
          user: 'postgres',
          password: clave,
          database: 'postgres',
        });
        c.on('error', () => undefined);
        return c;
      });
      await Promise.all(clientes.map((c) => c.connect()));
      try {
        await Promise.all(clientes.map((c) => c.query('SELECT pg_sleep(0.2)')));
        // MySQL, MariaDB, Redis y Mongo también reciben trabajo mientras se mira.
        await conMysql('mysql', null, (c) => c.query('SELECT 1'));
        await conMysql('mariadb', null, (c) => c.query('SELECT 1'));
        const ventanas: string[] = [];
        for (let i = 0; i < 3; i++) {
          ventanas.push(...ventanasDeBase(base));
          await new Promise((r) => setTimeout(r, 500));
        }
        log('ventanas visibles de la carpeta temporal:', JSON.stringify(ventanas));
        expect(ventanas).toEqual([]);
      } finally {
        await Promise.all(clientes.map((c) => c.end().catch(() => undefined)));
      }
      void x;
    },
    5 * MIN,
  );

  it(
    'apaga todo sin dejar procesos de la carpeta temporal',
    async () => {
      const x = n();
      log('procesos antes de apagar:', JSON.stringify(procesosDeBase(base)));
      const estados = (await x.estadoGeneral()).servicios;
      log(
        'estados antes de apagar:',
        estados.map((s) => `${s.id}=${s.estado}/${s.pid ?? '-'}`).join(' '),
      );
      const t = Date.now();
      await x.detenerTodo();
      log(`detenerTodo en ${Date.now() - t} ms:`, JSON.stringify(procesosDeBase(base)));
      await x.cerrar({ detenerServicios: false });
      nucleo = null;
      let restantes: { pid: number; nombre: string }[] = [];
      try {
        restantes = await esperar(
          'que terminen los procesos',
          async () => {
            const p = procesosDeBase(base);
            return p.length === 0 ? p : null;
          },
          30_000,
        );
      } catch {
        restantes = procesosDeBase(base);
        for (const id of ['mysql', 'mariadb', 'postgresql']) {
          const archivo = x.rutas.logs(`${id}.log`);
          if (existsSync(archivo))
            log(`cola de ${id}.log:
${readFileSync(archivo, 'utf8').slice(-2500)}`);
        }
      }
      log('procesos después de apagar:', JSON.stringify(restantes), 'reloj', reloj());
      expect(restantes).toEqual([]);
    },
    5 * MIN,
  );
});
