import { appendFileSync } from 'node:fs';
import { appendFile, mkdir, rename, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { ServidorMcp, type OperacionesMcp } from '../src/mcp/servidor';
import { Registros } from '../src/monitor/registros';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

// C1 de la revisión de D45b: ni el visor de registros ni el MCP `leer_registro` ven SQL crudo de
// las consultas lentas. Valores falsos a propósito.

const PG = [
  '2026-11-26 10:00:00.000 CET [1] db=a LOG:  listening on IPv4 address "127.0.0.1", port 5432',
  '2026-11-26 10:00:01.000 CET [2] db=a LOG:  duration: 2000.1 ms  statement: SELECT * FROM t',
  "\tWHERE p = 'X_REAL'",
  "\t AND q = 'Y_REAL'",
  '2026-11-26 10:00:02.000 CET [2] db=a LOG:  duration: 5.0 ms  execute <unnamed>: SELECT $1',
  "2026-11-26 10:00:02.000 CET [2] db=a DETAIL:  parameters: $1 = 'X_REAL'",
  '2026-11-26 10:00:03.000 CET [3] db=a LOG:  checkpoint starting: time',
  '2026-11-26 10:00:04.000 CET [3] db=a ERROR:  falla',
  "2026-11-26 10:00:04.000 CET [3] db=a STATEMENT:  SELECT 'X_REAL'",
].join('\n');

let rutas: Rutas;
let eventos: Eventos<EventosNucleo>;
let registros: Registros;
let recibidas: { id: string; lineas: string[] }[];

beforeEach(async () => {
  const base = await carpetaTemporal('pel-reg-lentas-');
  rutas = new Rutas(base);
  await rutas.asegurar();
  eventos = new Eventos<EventosNucleo>();
  recibidas = [];
  eventos.on('registro:lineas', (r) => recibidas.push(r));
  registros = new Registros({
    rutas,
    eventos,
    leerSitios: async () => [],
    rutaLogProceso: () => 'x',
    intervaloMs: 25,
  });
});
afterEach(() => registros.cerrar());

describe('fuentes(): el slow log de MySQL/MariaDB no es una fuente', () => {
  it('ni logs/lentas/ ni un logs/lentas-*.log antiguo se listan', async () => {
    await mkdir(rutas.logs('lentas'), { recursive: true });
    await writeFile(rutas.logs('lentas', 'mysql-8.4.log'), "SELECT 'X_REAL';");
    await writeFile(rutas.logs('lentas-mysql-8.4.log'), "SELECT 'X_REAL';");
    await writeFile(rutas.logs('lentas.log'), "SELECT 'X_REAL';");
    await writeFile(rutas.logs('mysql.log'), 'ok');
    const ids = (await registros.fuentes()).map((f) => f.id);
    expect(ids).toContain('servicio:mysql');
    expect(ids.filter((i) => i.includes('lentas'))).toEqual([]);
    await expect(registros.leerFinal('servicio:lentas-mysql-8.4')).rejects.toThrow(/no existe/i);
  });
});

describe('PostgreSQL: leerFinal oculta las consultas lentas', () => {
  it('no devuelve ningún literal y marca el lugar; el resto del log sigue', async () => {
    await writeFile(rutas.logs('postgresql.log'), PG + '\n');
    const lineas = await registros.leerFinal('servicio:postgresql');
    const t = lineas.join('\n');
    expect(t).not.toContain('X_REAL');
    expect(t).not.toContain('Y_REAL');
    expect(t).not.toContain('parameters');
    expect(t).toContain('[consulta lenta oculta: véase Bases de datos › Consultas lentas]');
    expect(t).toContain('checkpoint starting');
    expect(t).toContain('listening on IPv4');
  });

  it('una lectura que empieza a mitad de la sentencia tampoco enseña las continuaciones', async () => {
    await writeFile(rutas.logs('postgresql.log'), PG + '\n');
    const lineas = await registros.leerFinal('servicio:postgresql', 9);
    expect(lineas.join('\n')).not.toContain('Y_REAL');
  });

  it('otros servicios no se tocan', async () => {
    await writeFile(rutas.logs('redis.log'), 'duration: 5 ms statement: SELECT 1\n');
    expect(await registros.leerFinal('servicio:redis')).toEqual([
      'duration: 5 ms statement: SELECT 1',
    ]);
  });
});

describe('PostgreSQL: seguir oculta las consultas lentas', () => {
  it('las líneas nuevas salen sin literales', async () => {
    const ruta = rutas.logs('postgresql.log');
    await writeFile(ruta, '');
    const dejar = await registros.seguir('servicio:postgresql');
    await appendFile(ruta, PG + '\n');
    await vi.waitFor(() =>
      expect(recibidas.flatMap((r) => r.lineas).join('\n')).toContain('checkpoint starting'),
    );
    const t = recibidas.flatMap((r) => r.lineas).join('\n');
    expect(t).not.toContain('X_REAL');
    expect(t).not.toContain('Y_REAL');
    expect(t).toContain('consulta lenta oculta');
    dejar();
  });
});

describe('PostgreSQL: seguir no filtra distinto cuando la cola parte o salta líneas', () => {
  const H = '2026-11-26 10:00:01.000 CET [2] db=a LOG:  duration: 2000.1 ms  statement: ';
  const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function seguido() {
    const ruta = rutas.logs('postgresql.log');
    await writeFile(ruta, '2026 [1] LOG:  ready\n');
    const dejar = await registros.seguir('servicio:postgresql');
    // Una línea normal ya vista: el filtro sale del estado inicial de duda.
    await appendFile(ruta, '2026 [1] LOG:  checkpoint starting: time' + String.fromCharCode(10));
    await vi.waitFor(() => expect(recibidas.length).toBeGreaterThan(0), { timeout: 5000 });
    const todo = (): string => recibidas.flatMap((r) => r.lineas).join('\n');
    // Cierra con una línea normal y espera a verla: ya llegó todo lo anterior.
    const cerrar = async (): Promise<string> => {
      await appendFile(ruta, '2026 [1] LOG:  fin-de-prueba\n');
      await vi.waitFor(() => expect(todo()).toContain('fin-de-prueba'), { timeout: 5000 });
      dejar();
      return todo();
    };
    return { ruta, cerrar };
  }

  it('A: una línea de más de 64 KB escrita en dos tiempos no suelta el resto', async () => {
    const { ruta, cerrar } = await seguido();
    await appendFile(ruta, H + "INSERT INTO t VALUES ('" + 'a'.repeat(70000));
    await espera(150);
    await appendFile(ruta, "SECRETO_LARGO de Ana')\n");
    const t = await cerrar();
    expect(t).not.toContain('SECRETO_LARGO');
    expect(t).toContain('consulta lenta oculta');
  });

  it('A: una línea de 200 KB escrita de una vez', async () => {
    const { ruta, cerrar } = await seguido();
    await appendFile(
      ruta,
      H + "INSERT INTO t VALUES ('" + 'a'.repeat(200000) + " SECRETO_200K')\n",
    );
    const t = await cerrar();
    expect(t).not.toContain('SECRETO_200K');
  });

  it('B: una ráfaga de más de 5000 continuaciones no deja pasar ninguna', async () => {
    const { ruta, cerrar } = await seguido();
    const cont = Array.from({ length: 6000 }, (_v, i) => `\t, ('fila${i}', 'SECRETO_RAFAGA')`);
    appendFileSync(ruta, H + 'INSERT INTO t VALUES\n' + cont.join('\n') + '\n');
    const t = await cerrar();
    expect(t).not.toContain('SECRETO_RAFAGA');
  });

  it('C: un salto de más de 1 MB entre dos revisiones no deja pasar continuaciones', async () => {
    const { ruta, cerrar } = await seguido();
    const cont = Array.from({ length: 40000 }, (_v, i) => `\t, ('f${i}', 'SECRETO_SALTO')`);
    appendFileSync(ruta, H + 'INSERT INTO t VALUES\n' + cont.join('\n') + '\n');
    const t = await cerrar();
    expect(t).not.toContain('SECRETO_SALTO');
  });

  it('un error con STATEMENT y DETAIL Key tampoco enseña los valores', async () => {
    const { ruta, cerrar } = await seguido();
    await appendFile(
      ruta,
      '2026 [2] db=a ERROR:  duplicate key value violates unique constraint "u"\n' +
        '2026 [2] db=a DETAIL:  Key (email)=(SECRETO_DETAIL@x) already exists.\n' +
        "2026 [2] db=a STATEMENT:  INSERT INTO u VALUES ('SECRETO_ST')\n\t, ('SECRETO_ST2')\n",
    );
    const t = await cerrar();
    expect(t).not.toContain('SECRETO_');
    expect(t).toContain('duplicate key value');
  });
});

describe('MCP leer_registro', () => {
  const servidores: ServidorMcp[] = [];
  const clientes: Client[] = [];
  afterEach(async () => {
    for (const c of clientes.splice(0)) await c.close().catch(() => undefined);
    for (const s of servidores.splice(0)) await s.detener();
  });

  it('con los ids de PostgreSQL no sale el literal', async () => {
    await writeFile(rutas.logs('postgresql.log'), PG + '\n');
    const token = 'b'.repeat(64);
    const ops = {
      leerRegistro: (id: string, n: number) => registros.leerFinal(id, n),
    } as unknown as OperacionesMcp;
    const s = new ServidorMcp({
      operaciones: ops,
      token: async () => token,
      puerto: async () => 0,
      emitirConfirmacion: () => undefined,
      emitirCierre: () => undefined,
    });
    servidores.push(s);
    await s.iniciar();
    const c = new Client({ name: 'prueba', version: '1.0.0' });
    await c.connect(
      new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${s.estado().puerto}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${token}` } },
      }),
    );
    clientes.push(c);
    const r = await c.callTool({
      name: 'leer_registro',
      arguments: { id: 'servicio:postgresql', lineas: 200 },
    });
    const texto = JSON.stringify(r);
    expect(r.isError).toBeFalsy();
    expect(texto).toContain('checkpoint starting');
    expect(texto).not.toContain('X_REAL');
    expect(texto).not.toContain('Y_REAL');
    // el slow log de MySQL ni siquiera es una fuente
    await mkdir(rutas.logs('lentas'), { recursive: true });
    await writeFile(rutas.logs('lentas', 'mysql-8.4.log'), "SELECT 'X_REAL';");
    const m = await c.callTool({
      name: 'leer_registro',
      arguments: { id: 'servicio:lentas-mysql-8.4' },
    });
    expect(m.isError).toBe(true);
    expect(JSON.stringify(m)).not.toContain('X_REAL');
  });
});

describe('PostgreSQL: seguir al arrancar a mitad de línea o tras truncado/rotación', () => {
  const H = '2026-11-26 10:00:01.000 CET [2] db=a LOG:  duration: 2000.1 ms  statement: ';
  const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const todo = (): string => recibidas.flatMap((r) => r.lineas).join('\n');

  async function hastaFin(ruta: string): Promise<string> {
    await appendFile(ruta, '2026 [1] LOG:  fin-de-prueba\n');
    await vi.waitFor(() => expect(todo()).toContain('fin-de-prueba'), { timeout: 5000 });
    return todo();
  }

  it('H: el visor se abre mientras PostgreSQL escribe una sentencia: el resto no se ve', async () => {
    const ruta = rutas.logs('postgresql.log');
    await writeFile(ruta, '2026 [1] LOG:  ready\n' + H + "SELECT * FROM c WHERE dni = 'X");
    const dejar = await registros.seguir('servicio:postgresql');
    await espera(100);
    await appendFile(ruta, "SECRETO_ARRANQUE de Ana'\n");
    const t = await hastaFin(ruta);
    dejar();
    expect(t).not.toContain('SECRETO_ARRANQUE');
  });

  it('K: un truncado durante seguir no hereda el estado: una continuación inicial se oculta', async () => {
    const ruta = rutas.logs('postgresql.log');
    await writeFile(ruta, '2026 [1] LOG:  ready\n');
    const dejar = await registros.seguir('servicio:postgresql');
    await appendFile(ruta, '2026 [1] LOG:  checkpoint\n');
    await vi.waitFor(() => expect(todo()).toContain('checkpoint'), { timeout: 5000 });
    await writeFile(ruta, "\tAND x='SECRETO_TRUNC'\n");
    await espera(150);
    const t = await hastaFin(ruta);
    dejar();
    expect(t).not.toContain('SECRETO_TRUNC');
  });

  it('L: una rotación cuyo archivo nuevo empieza a medias no enseña ese resto', async () => {
    const ruta = rutas.logs('postgresql.log');
    await writeFile(ruta, '2026 [1] LOG:  ready\n');
    const dejar = await registros.seguir('servicio:postgresql');
    await appendFile(ruta, '2026 [1] LOG:  checkpoint\n');
    await vi.waitFor(() => expect(todo()).toContain('checkpoint'), { timeout: 5000 });
    await rename(ruta, ruta + '.1');
    await writeFile(ruta, "SECRETO_ROT') -- resto\n\tAND y='SECRETO_ROT2'\n");
    await espera(150);
    const t = await hastaFin(ruta);
    dejar();
    expect(t).not.toContain('SECRETO_ROT');
  });
});
