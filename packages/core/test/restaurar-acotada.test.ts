import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { beforeEach, describe, expect, it } from 'vitest';
import { Respaldos, type DepsRespaldos } from '../src/bd/respaldos';
import { ErrorWolf } from '../src/errores';
import { nombreEjecutable } from '../src/plataforma/sistema';
import type { Ejecutor, Lanzador } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import type { EstadoServicio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const CLAVE_ADMIN = 'ClaveAdmin#1';
const CLAVE_TMP = 'ClaveTmp#2';
const USUARIO_TMP = 'wolf_tmp_0123456789abcdef';
const PGDMP = Buffer.concat([Buffer.from('PGDMP'), Buffer.from([1, 16, 0, 4, 8, 1, 1, 1])]);

let dir: string;
let rutas: Rutas;
let eventos: string[];
let ejecutados: { cmd: string; args: string[] }[];
let lanzados: {
  cmd: string;
  args: string[];
  env: Record<string, string>;
  lista: string | null;
  entrada: string | null;
}[];
let tablas: boolean;
let listaPg: string;
let codigoSalida: number;
let lineasError: string[];

const estado = (id: string, version: string): EstadoServicio =>
  ({ id, nombre: id, version, estado: 'encendido', puertos: [1], pid: 1 }) as EstadoServicio;

function crearArchivo(rel: string): void {
  const p = path.join(rutas.base, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, '');
}

async function leer(s: Readable): Promise<string> {
  const partes: Buffer[] = [];
  for await (const p of s) partes.push(Buffer.from(p as Buffer));
  return Buffer.concat(partes).toString('utf8');
}

function armar(): Respaldos {
  const exec: Ejecutor = async (cmd, args) => {
    ejecutados.push({ cmd, args });
    if (args.includes('-l')) return { codigo: 0, stdout: listaPg, stderr: '' };
    return { codigo: 0, stdout: '', stderr: '' };
  };
  const lanzar: Lanzador = async (cmd, args, opts) => {
    const i = args.indexOf('-L');
    lanzados.push({
      cmd,
      args,
      env: (opts?.env ?? {}) as Record<string, string>,
      lista: i >= 0 ? readFileSync(args[i + 1]!, 'utf8') : null,
      entrada: opts?.entrada ? await leer(opts.entrada as Readable) : null,
    });
    eventos.push(path.basename(cmd));
    if (codigoSalida !== 0) for (const l of lineasError) opts?.alLinea?.(l, 'stderr');
    return { codigo: codigoSalida };
  };
  const deps: DepsRespaldos = {
    bd: {
      conexion: async (m: string) => ({
        host: '127.0.0.1',
        puerto: m === 'postgresql' ? 5432 : 3306,
        usuario: m === 'postgresql' ? 'postgres' : 'root',
        clave: CLAVE_ADMIN,
      }),
      crear: async (_m: string, base: string) => {
        eventos.push(`crear:${base}`);
        return { usuarioActualizado: false };
      },
      tieneTablas: async () => tablas,
      usuarioTemporal: async (_o: string, base: string) => {
        eventos.push(`crear-usuario:${base}`);
        return {
          usuario: USUARIO_TMP,
          clave: CLAVE_TMP,
          retirar: async () => void eventos.push('retirar-usuario'),
        };
      },
      crearExtension: async (_b: string, nombre: string) =>
        void eventos.push(`extension:${nombre}`),
    } as never,
    servicios: {
      estados: async () => [estado('mysql', '8.4.3'), estado('postgresql', '17.2')],
    },
    rutas,
    exec,
    lanzar,
    plataforma: { carpetaDocumentos: async () => dir },
    fabricas: {
      mysql: (async () => ({
        query: async (sql: string) => {
          eventos.push(`sql:${sql}`);
          return [[{ version: '8.4.3' }]];
        },
        end: async () => undefined,
      })) as never,
      postgres: (async () => ({
        query: async (sql: string) => {
          eventos.push(`sql:${sql}`);
          return { rows: sql.includes('pg_get_userbyid') ? [{ dueno: 'wolf_u_tienda' }] : [] };
        },
        end: async () => undefined,
      })) as never,
    },
  };
  return new Respaldos(deps);
}

function archivo(nombre: string, contenido: string | Buffer): string {
  const p = path.join(dir, nombre);
  writeFileSync(p, contenido);
  return p;
}

beforeEach(async () => {
  dir = await carpetaTemporal('pel-acot-');
  rutas = new Rutas(path.join(dir, 'base'));
  crearArchivo(`bin/mysql/8.4.3/bin/${nombreEjecutable('mysql')}`);
  crearArchivo(`bin/postgresql/17.2/pgsql/bin/${nombreEjecutable('pg_restore')}`);
  crearArchivo(`bin/postgresql/17.2/pgsql/bin/${nombreEjecutable('psql')}`);
  eventos = [];
  ejecutados = [];
  lanzados = [];
  tablas = true;
  codigoSalida = 0;
  lineasError = ['ERROR 1227 (42000) at line 12: Access denied'];
  listaPg = [
    ';',
    '3079; 3079 16385 EXTENSION - pgcrypto',
    '4165; 0 0 COMMENT - EXTENSION pgcrypto',
    '3079; 3079 11 EXTENSION - plpgsql',
    '215; 1259 16400 TABLE public usuarios postgres',
    '216; 1259 16401 TABLE public pedidos postgres',
    '3300; 0 16400 TABLE DATA public usuarios postgres',
    '217; 1259 16402 SEQUENCE public pedidos_id_seq postgres',
  ].join('\n');
});

describe('Respaldos.restaurarAcotada: MySQL', () => {
  it('reemplaza la base y restaura con el usuario limitado, sin la clave del administrador', async () => {
    const a = archivo('t.sql', 'CREATE TABLE t (id int);\nINSERT INTO t VALUES (1);\n');
    const r = await armar().restaurarAcotada('mysql', a, 'tienda');
    expect(r.advertencias).toEqual([]);
    const l = lanzados[0]!;
    expect(l.args).toContain(`--user=${USUARIO_TMP}`);
    expect(l.args).not.toContain('--user=root');
    expect(l.env.MYSQL_PWD).toBe(CLAVE_TMP);
    expect(JSON.stringify([l.args, l.env])).not.toContain(CLAVE_ADMIN);
    // Todo o nada: sin --force, el primer error corta.
    expect(l.args).not.toContain('--force');
    expect(l.args.at(-1)).toBe('tienda');
    expect(l.entrada).toContain('INSERT INTO t VALUES (1);');
    // Orden: borra la base, la crea, crea el usuario, restaura y lo retira.
    expect(eventos.filter((e) => !e.startsWith('sql:SELECT'))).toEqual([
      'sql:DROP DATABASE `tienda`',
      'crear:tienda',
      'crear-usuario:tienda',
      expect.stringMatching(/^mysql/),
      'retirar-usuario',
    ]);
  });

  it('no deja pasar un cambio de base del archivo: se comenta y no llega a otra base', async () => {
    const a = archivo('t.sql', 'USE `mysql`;\nCREATE TABLE t (id int);\nDROP DATABASE otra;\n');
    await armar().restaurarAcotada('mysql', a, 'tienda');
    const entrada = lanzados[0]!.entrada!;
    expect(entrada).toContain('-- USE `mysql`;');
    expect(entrada).toContain('-- DROP DATABASE otra;');
  });

  it('un error de una sentencia es un fallo (no una advertencia) y el usuario se retira igual', async () => {
    codigoSalida = 1;
    const a = archivo('t.sql', 'CREATE TABLE t (id int);\n');
    await expect(armar().restaurarAcotada('mysql', a, 'tienda')).rejects.toThrow(
      /No se pudo restaurar la base tienda/,
    );
    expect(eventos.at(-1)).toBe('retirar-usuario');
  });

  it('una base sin tablas no se borra', async () => {
    tablas = false;
    await armar().restaurarAcotada(
      'mysql',
      archivo('t.sql', 'CREATE TABLE t (id int);\n'),
      'tienda',
    );
    expect(eventos.some((e) => e.includes('DROP DATABASE'))).toBe(false);
    expect(eventos).toContain('crear:tienda');
  });

  it('rechaza una base del sistema, un archivo que no existe y una carpeta', async () => {
    const r = armar();
    await expect(r.restaurarAcotada('mysql', archivo('t.sql', 'x'), 'mysql')).rejects.toThrow(
      /sistema/,
    );
    await expect(r.restaurarAcotada('mysql', path.join(dir, 'no.sql'), 'tienda')).rejects.toThrow(
      /No se encontró/,
    );
    await expect(r.restaurarAcotada('mysql', dir, 'tienda')).rejects.toThrow(/no una carpeta/);
    expect(lanzados).toEqual([]);
    expect(eventos).toEqual([]);
  });
});

describe('Respaldos.restaurarAcotada: PostgreSQL', () => {
  it('restaura con el rol limitado, una transacción y sin las entradas EXTENSION', async () => {
    const r = await armar().restaurarAcotada('postgresql', archivo('t.dump', PGDMP), 'tienda');
    expect(r.advertencias).toEqual([]);
    const l = lanzados[0]!;
    expect(l.args).toEqual(expect.arrayContaining(['--exit-on-error', '--single-transaction']));
    expect(l.args[l.args.indexOf('-U') + 1]).toBe(USUARIO_TMP);
    expect(l.env.PGPASSWORD).toBe(CLAVE_TMP);
    expect(JSON.stringify([l.args, l.env])).not.toContain(CLAVE_ADMIN);
    expect(l.lista).not.toMatch(/EXTENSION/);
    expect(l.lista).toContain('TABLE public usuarios');
    // pgcrypto la crea antes el administrador; plpgsql ya viene con la base.
    const e = eventos;
    expect(e.indexOf('extension:pgcrypto')).toBeGreaterThan(e.indexOf('crear:tienda'));
    expect(e.indexOf('extension:pgcrypto')).toBeLessThan(e.indexOf('crear-usuario:tienda'));
    expect(e).not.toContain('extension:plpgsql');
    expect(e.indexOf('retirar-usuario')).toBeGreaterThan(e.indexOf('pg_restore.exe'));
    // El dueño (usuario del proyecto) se devuelve después de retirar el rol temporal.
    const orden = e.filter((x) => x.includes('OWNER TO') || x === 'retirar-usuario');
    expect(orden[0]).toBe('retirar-usuario');
    expect(orden[1]).toContain('ALTER DATABASE');
  });

  it('una extensión que no está permitida se rechaza antes de tocar nada', async () => {
    listaPg += '\n3080; 3080 16500 EXTENSION - file_fdw';
    let error: unknown;
    try {
      await armar().restaurarAcotada('postgresql', archivo('t.dump', PGDMP), 'tienda');
    } catch (e) {
      error = e;
    }
    expect((error as ErrorWolf).codigo).toBe('bd.extension_no_permitida');
    expect(lanzados).toEqual([]);
    expect(eventos).toEqual([]);
  });

  it('con un error de pg_restore falla y retira el rol', async () => {
    codigoSalida = 1;
    lineasError = ['pg_restore: error: could not execute query: ERROR: permission denied'];
    await expect(
      armar().restaurarAcotada('postgresql', archivo('t.dump', PGDMP), 'tienda'),
    ).rejects.toThrow(/No se pudo restaurar la base tienda/);
    expect(eventos).toContain('retirar-usuario');
  });
});

describe('Respaldos.inspeccionar', () => {
  it('PostgreSQL cuenta las tablas (no los datos ni las secuencias) y lista las extensiones', async () => {
    expect(await armar().inspeccionar('postgresql', archivo('t.dump', PGDMP))).toEqual({
      tablas: 2,
      extensiones: ['pgcrypto', 'plpgsql'],
    });
  });

  it('MySQL cuenta los CREATE TABLE por trozos, también el que cae en el borde de un trozo', async () => {
    const relleno = `INSERT INTO t VALUES (${'1,'.repeat(40_000)}1);\n`;
    const sql = `-- dump\nCREATE TABLE a (id int);\n${relleno}CREATE TABLE b (id int);\n/*!50001 CREATE TABLE \`v\` (id int) */;\n`;
    expect(await armar().inspeccionar('mysql', archivo('t.sql', sql))).toEqual({
      tablas: 2,
      extensiones: [],
    });
    expect((await armar().inspeccionar('mysql', archivo('v.sql', 'SELECT 1;'))).tablas).toBe(0);
  });
});
