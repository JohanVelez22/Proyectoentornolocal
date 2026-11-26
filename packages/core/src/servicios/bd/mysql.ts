import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { DefProceso } from '../../procesos/supervisor';
import { registrarDefinicion } from '../datos';
import type { CtxServicio, DefServicio } from '../definicion';
import { nombreEjecutable } from '../../plataforma/sistema';
import { leerAjuste, rutaAjuste, rutaLogLento } from '../../bd/consultasLentas/ajustes';

export type VarianteMysql = 'mysql' | 'mariadb';

const exe = (c: CtxServicio, nombre: string): string => path.join(c.bin, 'bin', nombre);
/** Primer ejecutable que exista en bin/ (el nombre mariadb-* gana al heredado mysql_*). */
const elegir = (c: CtxServicio, candidatos: string[]): string =>
  exe(c, candidatos.find((n) => existsSync(exe(c, n))) ?? candidatos[0]!);
const adelante = (p: string): string => p.replaceAll('\\', '/');

/** Contenido del my.ini; las rutas llevan "/" porque MySQL trata "\" como escape. */
export function contenidoIni(
  v: VarianteMysql,
  datadir: string,
  puerto: number,
  lentas?: { segundos: number; archivo: string },
): string {
  const lineas = [
    '[mysqld]',
    `datadir="${adelante(datadir)}"`,
    `port=${puerto}`,
    'bind-address=127.0.0.1',
    'character-set-server=utf8mb4',
  ];
  if (v === 'mysql') lineas.push('mysqlx=OFF');
  // Consultas lentas (D45b): solo si el usuario las activó; el archivo va en la carpeta de registros.
  if (lentas) {
    lineas.push(
      'slow_query_log=1',
      `long_query_time=${lentas.segundos}`,
      `slow_query_log_file="${adelante(lentas.archivo)}"`,
    );
  }
  return lineas.join('\n') + '\n';
}

/** El my.ini va junto a los datos (no dentro: `--initialize` exige la carpeta vacía). */
function rutaIni(c: CtxServicio, v: VarianteMysql): string {
  return path.join(c.rutas.base, 'etc', v, path.basename(c.datos), 'my.ini');
}

async function escribirIni(c: CtxServicio, v: VarianteMysql): Promise<string> {
  const ini = rutaIni(c, v);
  await mkdir(path.dirname(ini), { recursive: true });
  const clave = path.basename(c.datos);
  const ajuste = await leerAjuste(rutaAjuste(c.rutas, v, clave));
  const lentas = ajuste?.activo
    ? { segundos: ajuste.segundos, archivo: rutaLogLento(c.rutas, v, clave) }
    : undefined;
  await writeFile(ini, contenidoIni(v, c.datos, c.puerto, lentas), 'utf8');
  return ini;
}

const sinClave = (texto: string, clave: string): string =>
  clave ? texto.split(clave).join('***') : texto;

function falla(nombre: string, c: CtxServicio, salida: string): Error {
  const detalle = sinClave(salida, c.credenciales.clave).trim().split(/\r?\n/).slice(-3).join(' ');
  return new Error(`No se pudo inicializar ${nombre}${detalle ? `: ${detalle}` : '.'}`);
}

/** root por socket/localhost y también por TCP a 127.0.0.1, sin depender de la resolución de nombres. */
function sqlRoot(clave: string): string {
  return [
    `ALTER USER 'root'@'localhost' IDENTIFIED BY '${clave}';`,
    `CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '${clave}';`,
    `ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY '${clave}';`,
    "GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;",
    '',
  ].join('\n');
}

export function defMysql(v: VarianteMysql): DefServicio {
  const mysql = v === 'mysql';
  const nombre = mysql ? 'MySQL' : 'MariaDB';
  const servidor = mysql ? nombreEjecutable('mysqld') : nombreEjecutable('mariadbd');

  const def: DefServicio = {
    id: v,
    nombre,
    categoria: 'bd',
    puertoPorDefecto: mysql ? 3306 : 3307,
    puertoAlternativo: mysql ? 3308 : 3309,

    async inicializar(c) {
      const ini = await escribirIni(c, v);
      await mkdir(c.rutas.tmp(), { recursive: true });
      const clave = c.credenciales.clave.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
      if (mysql) {
        // La clave viaja en un archivo temporal (nunca en args): MySQL ejecuta el
        // init-file durante --initialize, cuando el usuario root ya existe.
        const sql = path.join(c.rutas.tmp(), `init-${randomUUID()}.sql`);
        try {
          await writeFile(sql, sqlRoot(clave), 'utf8');
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
      await mkdir(path.dirname(c.datos), { recursive: true });
      const instalar = await c.exec(
        elegir(c, [nombreEjecutable('mariadb-install-db'), nombreEjecutable('mysql_install_db')]),
        [`--datadir=${c.datos}`],
      );
      if (instalar.codigo !== 0) throw falla(nombre, c, instalar.stderr || instalar.stdout);
      // La clave entra por la entrada estándar del servidor en modo bootstrap.
      const r = await c.exec(
        exe(c, servidor),
        [`--defaults-file=${ini}`, '--bootstrap', '--console'],
        { entrada: 'FLUSH PRIVILEGES;\n' + sqlRoot(clave) },
      );
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
      // La clave va por la variable de entorno del cliente: no aparece en args ni en disco.
      const r = await c.exec(
        elegir(
          c,
          mysql
            ? [nombreEjecutable('mysqladmin')]
            : [nombreEjecutable('mariadb-admin'), nombreEjecutable('mysqladmin')],
        ),
        ['--user=root', '--host=127.0.0.1', `--port=${c.puerto}`, 'shutdown'],
        { env: { MYSQL_PWD: c.credenciales.clave } },
      );
      if (r.codigo !== 0) throw new Error(`No se pudo apagar ${nombre} de forma limpia.`);
    },
  };
  return def;
}

registrarDefinicion(defMysql('mysql'));
registrarDefinicion(defMysql('mariadb'));
