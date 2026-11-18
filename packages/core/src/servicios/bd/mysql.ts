import { mkdir, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { DefProceso } from '../../procesos/supervisor';
import { registrarDefinicion } from '../datos';
import type { CtxServicio, DefServicio } from '../definicion';

export type VarianteMysql = 'mysql' | 'mariadb';

const exe = (c: CtxServicio, nombre: string): string => path.join(c.bin, 'bin', nombre);
const adelante = (p: string): string => p.replaceAll('\\', '/');

/** Contenido del my.ini; las rutas llevan "/" porque MySQL trata "\" como escape. */
export function contenidoIni(v: VarianteMysql, datadir: string, puerto: number): string {
  const lineas = [
    '[mysqld]',
    `datadir=${adelante(datadir)}`,
    `port=${puerto}`,
    'bind-address=127.0.0.1',
    'character-set-server=utf8mb4',
  ];
  if (v === 'mysql') lineas.push('mysqlx=OFF');
  return lineas.join('\n') + '\n';
}

/** El my.ini va junto a los datos (no dentro: `--initialize` exige la carpeta vacía). */
function rutaIni(c: CtxServicio, v: VarianteMysql): string {
  return path.join(c.rutas.base, 'etc', v, path.basename(c.datos), 'my.ini');
}

async function escribirIni(c: CtxServicio, v: VarianteMysql): Promise<string> {
  const ini = rutaIni(c, v);
  await mkdir(path.dirname(ini), { recursive: true });
  await writeFile(ini, contenidoIni(v, c.datos, c.puerto), 'utf8');
  return ini;
}

const sinClave = (texto: string, clave: string): string =>
  clave ? texto.split(clave).join('***') : texto;

function falla(nombre: string, c: CtxServicio, salida: string): Error {
  const detalle = sinClave(salida, c.credenciales.clave).trim().split(/\r?\n/).slice(-3).join(' ');
  return new Error(`No se pudo inicializar ${nombre}${detalle ? `: ${detalle}` : '.'}`);
}

export function defMysql(v: VarianteMysql): DefServicio {
  const mysql = v === 'mysql';
  const nombre = mysql ? 'MySQL' : 'MariaDB';
  const servidor = mysql ? 'mysqld.exe' : 'mariadbd.exe';
  const admin = mysql ? 'mysqladmin.exe' : 'mariadb-admin.exe';

  const def: DefServicio = {
    id: v,
    nombre,
    categoria: 'bd',
    puertoPorDefecto: mysql ? 3306 : 3307,
    puertoAlternativo: mysql ? 3308 : 3309,

    async inicializar(c) {
      if (mysql) {
        const ini = await escribirIni(c, v);
        // La clave viaja en un archivo temporal (nunca en args): MySQL ejecuta el
        // init-file durante --initialize, cuando el usuario root ya existe.
        await mkdir(c.rutas.tmp(), { recursive: true });
        const sql = path.join(c.rutas.tmp(), `init-${randomUUID()}.sql`);
        const clave = c.credenciales.clave.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
        try {
          await writeFile(sql, `ALTER USER 'root'@'localhost' IDENTIFIED BY '${clave}';\n`, 'utf8');
          const r = await c.exec(exe(c, servidor), [
            `--defaults-file=${ini}`,
            '--initialize-insecure',
            `--init-file=${sql}`,
          ]);
          if (r.codigo !== 0) throw falla(nombre, c, r.stderr || r.stdout);
        } finally {
          await rm(sql, { force: true });
        }
        return;
      }
      await escribirIni(c, v);
      await mkdir(path.dirname(c.datos), { recursive: true });
      const r = await c.exec(exe(c, 'mariadb-install-db.exe'), [
        `--datadir=${c.datos}`,
        `--password=${c.credenciales.clave}`,
      ]);
      if (r.codigo !== 0) throw falla(nombre, c, r.stderr || r.stdout);
    },

    async proceso(c): Promise<DefProceso> {
      // Se regenera en cada arranque: el puerto puede haber cambiado.
      const ini = await escribirIni(c, v);
      return {
        id: v,
        comando: exe(c, servidor),
        args: [`--defaults-file=${ini}`, '--console'],
        cwd: c.bin,
        puerto: c.puerto,
        log: c.rutas.logs(`${v}.log`),
        reiniciar: false,
      };
    },

    async detenerLimpio(c: CtxServicio): Promise<void> {
      // La clave va en un archivo temporal de credenciales del cliente, no en args.
      await mkdir(c.rutas.tmp(), { recursive: true });
      const cred = path.join(c.rutas.tmp(), `cli-${randomUUID()}.cnf`);
      const clave = c.credenciales.clave.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
      try {
        await writeFile(cred, `[client]\nuser=root\npassword="${clave}"\n`, 'utf8');
        const r = await c.exec(exe(c, admin), [
          `--defaults-extra-file=${cred}`,
          '--host=127.0.0.1',
          `--port=${c.puerto}`,
          'shutdown',
        ]);
        if (r.codigo !== 0) throw new Error(`No se pudo apagar ${nombre} de forma limpia.`);
      } finally {
        await rm(cred, { force: true });
      }
    },
  };
  return def;
}

registrarDefinicion(defMysql('mysql'));
registrarDefinicion(defMysql('mariadb'));
