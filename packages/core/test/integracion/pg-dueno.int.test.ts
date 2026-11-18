/**
 * PostgreSQL real: tras restaurar (en una base vacía o sobrescribiendo) la base y sus objetos
 * siguen siendo del usuario del proyecto, que puede leer, escribir y usar sus secuencias.
 * Base temporal propia y puerto alto; no toca FlyEnv ni otro PostgreSQL del equipo.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Nucleo } from '../../src/nucleo';
import { esperar, esWindows, fetchConCache, limpiarBase, plataformaSegura } from './comun';

const base = path.join(os.tmpdir(), `pel-pg-dueno-${randomBytes(4).toString('hex')}`);
const PUERTO = 15532;
const MIN = 60_000;
const log = (...a: unknown[]): void => console.log('[pg-dueno]', ...a);
let nucleo: Nucleo | null = null;
const n = (): Nucleo => nucleo!;

async function como<T>(
  usuario: string,
  clave: string,
  bd: string,
  fn: (c: pg.Client) => Promise<T>,
): Promise<T> {
  const c = new pg.Client({
    host: '127.0.0.1',
    port: PUERTO,
    user: usuario,
    password: clave,
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

/** Lo que el usuario del proyecto debe poder hacer con su base restaurada. */
async function revisarComoDueno(usuario: string, clave: string, bd: string): Promise<void> {
  await como(usuario, clave, bd, async (c) => {
    expect(Number((await c.query('SELECT count(*) AS n FROM app.clientes')).rows[0].n)).toBe(3);
    expect(Number((await c.query('SELECT count(*) AS n FROM public.notas')).rows[0].n)).toBe(1);
    expect((await c.query('SELECT app.saludo() AS t')).rows[0].t).toBe('hola');
    expect(Number((await c.query('SELECT count(*) AS n FROM app.vista')).rows[0].n)).toBe(3);
    // serial e identity: insertar usa la secuencia
    await c.query("INSERT INTO app.clientes (nombre) VALUES ('nuevo')");
    await c.query("INSERT INTO public.notas (texto) VALUES ('otra')");
    await c.query('ALTER TABLE app.clientes ADD COLUMN extra int');
    const d = await c.query(
      'SELECT pg_get_userbyid(datdba) AS d FROM pg_database WHERE datname = current_database()',
    );
    expect(d.rows[0].d).toBe(usuario);
  });
}

describe.skipIf(!esWindows)('PostgreSQL: dueño tras restaurar (real)', () => {
  beforeAll(async () => {
    mkdirSync(path.join(base, 'docs'), { recursive: true });
    writeFileSync(path.join(base, 'hosts'), '127.0.0.1 localhost\r\n');
    nucleo = await Nucleo.crear({
      base,
      plataforma: plataformaSegura(path.join(base, 'hosts'), path.join(base, 'docs')),
      fetch: fetchConCache(log),
    });
    await n().cambiarPuertoServicio('postgresql', PUERTO);
    await n().instalador.instalar((await n().listarVersiones('postgresql'))[0]!);
    await n().servicios.iniciar('postgresql');
    await esperar(
      'postgresql encendido',
      async () => {
        const e = (await n().estadoGeneral()).servicios.find((s) => s.id === 'postgresql');
        if (e?.estado === 'error') throw new Error(e.mensaje ?? 'error');
        return e?.estado === 'encendido' ? e : null;
      },
      2 * MIN,
    );
  }, 10 * MIN);

  afterAll(async () => {
    await nucleo?.cerrar({ detenerServicios: true }).catch((e: unknown) => log('cerrar:', e));
    limpiarBase(base, log);
  }, 5 * MIN);

  it(
    'sobrescribir y restaurar en base vacía dejan todo a nombre del usuario del proyecto',
    async () => {
      const x = n();
      const CLAVE = 'Clave_Proyecto_1';
      await x.crearBase('postgresql', 'tienda', { usuario: 'app_tienda', clave: CLAVE });
      await como('app_tienda', CLAVE, 'tienda', async (c) => {
        await c.query('CREATE SCHEMA app');
        await c.query('CREATE TABLE app.clientes (id serial PRIMARY KEY, nombre text)');
        await c.query("INSERT INTO app.clientes (nombre) VALUES ('a'), ('b'), ('c')");
        await c.query(
          'CREATE TABLE public.notas (id int GENERATED ALWAYS AS IDENTITY, texto text)',
        );
        await c.query("INSERT INTO public.notas (texto) VALUES ('n')");
        await c.query('CREATE VIEW app.vista AS SELECT * FROM app.clientes');
        await c.query(
          "CREATE FUNCTION app.saludo() RETURNS text LANGUAGE sql AS $$ SELECT 'hola' $$",
        );
      });
      const { archivo } = await x.respaldarBase('postgresql', 'tienda');
      log('respaldo', archivo);

      // 1) Sobrescribir la misma base: conserva el dueño y le devuelve los objetos.
      await como('app_tienda', CLAVE, 'tienda', (c) => c.query('DELETE FROM app.clientes'));
      const r = await x.restaurarBase('postgresql', archivo, 'tienda', {
        confirmarSobrescribir: true,
      });
      log('sobrescribir: advertencias', r.advertencias);
      // la fila borrada volvió (sin la insertada por la revisión, que aún no corrió)
      await revisarComoDueno('app_tienda', CLAVE, 'tienda');

      // 2) Restaurar en una base vacía creada para otro usuario del proyecto.
      await x.crearBase('postgresql', 'copia', { usuario: 'app_copia', clave: CLAVE });
      await x.restaurarBase('postgresql', archivo, 'copia');
      await revisarComoDueno('app_copia', CLAVE, 'copia');
    },
    10 * MIN,
  );
});
