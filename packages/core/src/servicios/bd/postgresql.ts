import { appendFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { DefProceso } from '../../procesos/supervisor';
import { claveMayor } from '../../rutas';
import { registrarDefinicion } from '../datos';
import type { CtxServicio, DefServicio } from '../definicion';

// El zip de EDB trae todo bajo pgsql/ (ver `ejecutable` del catálogo).
const exe = (c: CtxServicio, nombre: string): string => path.join(c.bin, 'pgsql', 'bin', nombre);

const sinClave = (texto: string, clave: string): string =>
  clave ? texto.split(clave).join('***') : texto;

function falla(c: CtxServicio, salida: string): Error {
  const detalle = sinClave(salida, c.credenciales.clave).trim().split(/\r?\n/).slice(-3).join(' ');
  return new Error(`No se pudo inicializar PostgreSQL${detalle ? `: ${detalle}` : '.'}`);
}

/** Líneas que se agregan a postgresql.conf (el último valor de cada parámetro gana). */
export function parcheConf(puerto: number): string {
  return [
    '',
    '# WolfCore Dev',
    `port = ${puerto}`,
    "listen_addresses = '127.0.0.1'",
    "unix_socket_directories = ''",
    '',
  ].join('\n');
}

/** Solo TCP por loopback y siempre con clave. */
export const PG_HBA = [
  'host all all 127.0.0.1/32 scram-sha-256',
  'host all all ::1/128 scram-sha-256',
  '',
].join('\n');

export function defPostgresql(): DefServicio {
  return {
    id: 'postgresql',
    nombre: 'PostgreSQL',
    categoria: 'bd',
    puertoPorDefecto: 5432,
    puertoAlternativo: 5433,
    // Un parche (17.12 → 17.13) conserva los datos; una versión mayor exige migrar.
    claveDatos: claveMayor,

    async inicializar(c) {
      await mkdir(c.rutas.tmp(), { recursive: true });
      await mkdir(path.dirname(c.datos), { recursive: true });
      // La clave viaja en un archivo temporal (nunca en args) y se borra siempre.
      const pwfile = path.join(c.rutas.tmp(), `pg-${randomUUID()}.pw`);
      try {
        await writeFile(pwfile, c.credenciales.clave + '\n', 'utf8');
        const r = await c.exec(exe(c, 'initdb.exe'), [
          '-D',
          c.datos,
          '-U',
          'postgres',
          '-E',
          'UTF8',
          '--locale=C',
          '--auth-local=scram-sha-256',
          '--auth-host=scram-sha-256',
          `--pwfile=${pwfile}`,
        ]);
        if (r.codigo !== 0) throw falla(c, r.stderr || r.stdout);
      } finally {
        await rm(pwfile, { force: true });
      }
      await appendFile(path.join(c.datos, 'postgresql.conf'), parcheConf(c.puerto), 'utf8');
      await writeFile(path.join(c.datos, 'pg_hba.conf'), PG_HBA, 'utf8');
    },

    async proceso(c): Promise<DefProceso> {
      // El puerto se pasa en cada arranque: puede haber cambiado desde initdb.
      return {
        id: 'postgresql',
        comando: exe(c, 'postgres.exe'),
        args: ['-D', c.datos, '-p', String(c.puerto), '-c', 'listen_addresses=127.0.0.1'],
        cwd: c.bin,
        puerto: c.puerto,
        log: c.rutas.logs('postgresql.log'),
        reiniciar: false,
      };
    },

    async detenerLimpio(c) {
      // pg_ctl actúa sobre el directorio de datos: no necesita clave.
      const r = await c.exec(exe(c, 'pg_ctl.exe'), [
        'stop',
        '-D',
        c.datos,
        '-m',
        'fast',
        '-w',
        '-t',
        '15',
      ]);
      if (r.codigo !== 0) {
        const detalle = (r.stderr || r.stdout).trim().split(/\r?\n/).slice(-2).join(' ');
        throw new Error(
          `No se pudo apagar PostgreSQL de forma limpia${detalle ? `: ${detalle}` : '.'}`,
        );
      }
    },
  };
}

registrarDefinicion(defPostgresql());
