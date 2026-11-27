import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { Plataforma } from '../src/plataforma/tipos';
import { Supervisor, type DefProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import { defPostgresql } from '../src/servicios/bd/postgresql';
import { carpetaTemporal } from './temporales';

// I2 de la segunda revisión de D45b: la cola del log que acaba en `entrada.mensaje` (errores de
// arranque, MCP, CLI, estado del servicio) no lleva SQL de las consultas lentas. Valores falsos.

let dir: string;
let rutas: Rutas;
beforeEach(async () => {
  dir = await carpetaTemporal('pel-cola-log-');
  rutas = new Rutas(dir);
  mkdirSync(rutas.logs(), { recursive: true });
});

const PG = [
  '2026-11-26 10:00:00.000 CET [1] db=a LOG:  database system is ready',
  "2026-11-26 10:00:01.000 CET [2] db=a LOG:  duration: 2000.1 ms  statement: SELECT * FROM t WHERE p = 'X_REAL'",
  "\tAND q = 'Y_REAL'",
  "2026-11-26 10:00:02.000 CET [2] db=a DETAIL:  parameters: $1 = 'X_REAL'",
  '2026-11-26 10:00:03.000 CET [3] db=a FATAL:  could not bind IPv4 address',
].join('\n');

function supervisor(): Supervisor {
  return new Supervisor(rutas, {} as unknown as Plataforma, new Eventos<EventosNucleo>(), {
    intervaloMs: 1000,
    sonda: async () => true,
  });
}

const cola = (s: Supervisor, def: DefProceso): string =>
  (s as unknown as { colaLog(d: DefProceso): string }).colaLog(def);

describe('Supervisor.colaLog', () => {
  it('con el filtro de PostgreSQL no sale ningún valor y se conserva el resto', async () => {
    const log = path.join(rutas.logs(), 'postgresql.log');
    writeFileSync(log, PG + '\n');
    const def = await defPostgresql().proceso({
      rutas,
      bin: dir,
      datos: dir,
      puerto: 5432,
    } as never);
    const t = cola(supervisor(), def);
    expect(t).not.toContain('X_REAL');
    expect(t).not.toContain('Y_REAL');
    expect(t).not.toContain('parameters');
    expect(t).toContain('could not bind IPv4 address');
    expect(t).toContain('consulta lenta oculta');
  });

  it('una cola que empieza a mitad de una sentencia tampoco enseña sus continuaciones', async () => {
    const log = path.join(rutas.logs(), 'postgresql.log');
    writeFileSync(log, "\tAND q = 'Y_REAL'\n2026-11-26 10:00:03.000 CET [3] db=a LOG:  listo\n");
    const def = await defPostgresql().proceso({ rutas, bin: dir, datos: dir, puerto: 1 } as never);
    expect(cola(supervisor(), def)).not.toContain('Y_REAL');
  });

  it('un proceso sin filtro conserva su cola tal cual', () => {
    const log = path.join(rutas.logs(), 'otro.log');
    writeFileSync(log, 'linea uno\nlinea dos\n');
    const def: DefProceso = { id: 'otro', comando: 'x', args: [], log, reiniciar: false };
    expect(cola(supervisor(), def)).toBe('linea uno\nlinea dos');
  });
});

describe('definición de PostgreSQL', () => {
  it('trae filtrarLog, con estado nuevo en cada llamada', async () => {
    const def = await defPostgresql().proceso({
      rutas,
      bin: dir,
      datos: dir,
      puerto: 5432,
    } as never);
    expect(typeof def.filtrarLog).toBe('function');
    const solo = ['2026 [1] LOG:  duration: 5 ms  statement: SELECT 1'];
    expect(def.filtrarLog!(solo).join('')).toContain('consulta lenta oculta');
    // Otra llamada empieza «dentro de una sentencia»: lo sangrado del principio se oculta.
    expect(def.filtrarLog!(["\t'X_REAL'", '2026 [1] LOG:  ok'])).toEqual(['2026 [1] LOG:  ok']);
  });
});
