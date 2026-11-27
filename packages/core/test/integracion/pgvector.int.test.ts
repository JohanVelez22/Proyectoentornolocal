/**
 * Prueba real de pgvector (`npm run test:win:pgvector`). SOLO con permiso del usuario: si faltan,
 * instala Visual Studio Build Tools con winget (Windows pide permiso de administrador y ocupa
 * ~6 GB; quedan instaladas en el equipo). Compila pgvector desde su código oficial contra un
 * PostgreSQL 17 en una carpeta temporal y prueba `CREATE EXTENSION vector` y una distancia.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Nucleo } from '../../src/nucleo';
import {
  esWindows,
  esperar,
  fetchConCache,
  limpiarBase,
  plataformaSegura,
  procesosDeBase,
} from './comun';

const PUERTO_PG = 15432;
const MIN = 60_000;

const base = path.join(os.tmpdir(), `pel-pgvector-${randomBytes(4).toString('hex')}`);
const hostsCopia = path.join(base, 'hosts-copia');
const documentos = path.join(base, 'Documentos');
const log = (...a: unknown[]): void => console.log('[pgvector]', ...a);

let nucleo: Nucleo | null = null;
const n = (): Nucleo => {
  if (!nucleo) throw new Error('El núcleo no está creado');
  return nucleo;
};

describe.skipIf(!esWindows)('pgvector real en Windows', () => {
  beforeAll(async () => {
    mkdirSync(documentos, { recursive: true });
    writeFileSync(hostsCopia, '127.0.0.1 localhost\r\n');
    log('base temporal:', base);
    nucleo = await Nucleo.crear({
      barrerHuerfanos: false,
      base,
      plataforma: plataformaSegura(hostsCopia, documentos),
      fetch: fetchConCache(log),
    });
    await n().cambiarPuertoServicio('postgresql', PUERTO_PG);
  });

  afterAll(async () => {
    if (nucleo) {
      await nucleo.cerrar({ detenerServicios: true }).catch((e: unknown) => log('cerrar:', e));
      nucleo = null;
    }
    if (esWindows && process.env.PEL_INT_CONSERVAR !== '1') limpiarBase(base, log);
  });

  it(
    'instala y enciende PostgreSQL 17',
    async () => {
      const x = n();
      const v = (await x.listarVersiones('postgresql'))[0]!;
      await x.instalador.instalar(v);
      await x.servicios.iniciar('postgresql');
      await esperar(
        'postgresql encendido',
        async () => {
          const e = (await x.estadoGeneral()).servicios.find((s) => s.id === 'postgresql');
          if (e?.estado === 'error') throw new Error(e.mensaje ?? 'error');
          return e?.estado === 'encendido' ? e : null;
        },
        60_000,
      );
      log('PostgreSQL', v.version, 'encendido en', PUERTO_PG);
    },
    30 * MIN,
  );

  it(
    'tiene (o instala con winget) las Build Tools de Visual Studio',
    async () => {
      const x = n();
      const antes = await x.estadoPgvector();
      log('estado antes:', JSON.stringify(antes));
      if (!antes.buildTools) {
        log('instalando Build Tools con winget: acepte el aviso de Windows (UAC)…');
        const quitar = x.eventos.on('instalacion:progreso', (p) => {
          if (p.mensaje) log('winget:', p.fase, p.mensaje);
        });
        const t = Date.now();
        const r = await x.instalarBuildTools();
        quitar();
        log(
          `instalarBuildTools → ${JSON.stringify(r)} en ${Math.round((Date.now() - t) / 1000)} s`,
        );
        expect(r).toEqual({ ok: true });
      }
      expect((await x.estadoPgvector()).buildTools).toBe(true);
    },
    120 * MIN,
  );

  it(
    'compila pgvector, crea la extensión y calcula una distancia',
    async () => {
      const x = n();
      const t = Date.now();
      const r = await x.compilarPgvector();
      log(`compilarPgvector → ${JSON.stringify(r)} en ${Math.round((Date.now() - t) / 1000)} s`);
      const estado = await x.estadoPgvector();
      log('estado después:', JSON.stringify(estado));
      expect(estado).toMatchObject({ instalado: true, version: r.version });
      // compilar detiene y vuelve a encender PostgreSQL (vector.dll queda libre al copiar).
      await esperar(
        'postgresql encendido tras compilar',
        async () => {
          const e = (await x.estadoGeneral()).servicios.find((s) => s.id === 'postgresql');
          return e?.estado === 'encendido' ? e : null;
        },
        60_000,
      );

      await x.crearBase('postgresql', 'vectores');
      await x.activarVector('vectores');
      const clave = (await x.credenciales('postgresql'))!.clave;
      const c = new pg.Client({
        host: '127.0.0.1',
        port: PUERTO_PG,
        user: 'postgres',
        password: clave,
        database: 'vectores',
      });
      c.on('error', () => undefined);
      await c.connect();
      try {
        const ext = await c.query("SELECT extversion FROM pg_extension WHERE extname = 'vector'");
        log('extversion:', ext.rows[0]?.extversion);
        expect(ext.rows[0]?.extversion).toBe(r.version);
        const d = await c.query("SELECT '[1,2,3]'::vector <-> '[1,2,4]' AS d");
        log("'[1,2,3]'::vector <-> '[1,2,4]' =", d.rows[0].d);
        expect(Number(d.rows[0].d)).toBe(1);
        await c.query('CREATE TABLE items (id serial PRIMARY KEY, v vector(3))');
        await c.query("INSERT INTO items (v) VALUES ('[1,2,3]'), ('[4,5,6]'), ('[1,2,4]')");
        await c.query('CREATE INDEX ON items USING hnsw (v vector_l2_ops)');
        const cerca = await c.query(
          "SELECT id, v::text FROM items ORDER BY v <-> '[1,2,3.4]' LIMIT 2",
        );
        log('vecinos de [1,2,3.4]:', JSON.stringify(cerca.rows));
        expect(cerca.rows.map((f: { v: string }) => f.v)).toEqual(['[1,2,3]', '[1,2,4]']);
      } finally {
        await c.end();
      }
      const dll = path.join(
        x.rutas.bin('postgresql', (await x.instalador.instalados('postgresql'))[0]!),
        'pgsql',
        'lib',
        'vector.dll',
      );
      expect(existsSync(dll)).toBe(true);
    },
    30 * MIN,
  );

  it(
    'apaga sin dejar procesos',
    async () => {
      await n().detenerTodo();
      await n().cerrar({ detenerServicios: false });
      nucleo = null;
      const restantes = await esperar(
        'que terminen los procesos',
        async () => (procesosDeBase(base).length === 0 ? [] : null),
        30_000,
      );
      expect(restantes).toEqual([]);
    },
    5 * MIN,
  );
});
