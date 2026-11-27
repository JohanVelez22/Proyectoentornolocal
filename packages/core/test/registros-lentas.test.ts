import { appendFile, mkdir, writeFile } from 'node:fs/promises';
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
