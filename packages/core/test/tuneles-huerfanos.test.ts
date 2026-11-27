import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { Rutas } from '../src/rutas';
import { Tuneles } from '../src/tuneles/tuneles';
import { nombreEjecutable } from '../src/plataforma/sistema';

let base: string;
let rutas: Rutas;
let plat: PlataformaFalsa;
let propios: Record<string, number>;

const exe = nombreEjecutable('cloudflared');
const proceso = (pid: number, ruta: string, inicio = `t${pid}`) => ({
  pid,
  nombre: path.basename(ruta),
  ruta,
  inicio,
  memoria: 1,
  ventana: false,
  sesion: 1,
  usuario: 'u',
});

const crear = (): Tuneles =>
  new Tuneles({
    supervisor: {
      ids: () => Object.keys(propios),
      pid: (id: string) => propios[id] ?? null,
      alSalir: () => undefined,
      estado: () => 'apagado',
    } as never,
    sitios: { listar: async () => [] },
    almacen: { leer: async () => ({}) } as never,
    instalador: { instalados: async () => [] } as never,
    rutas,
    urlBase: { restaurarPorId: async () => undefined } as never,
    eventos: new Eventos<EventosNucleo>(),
    plataforma: plat as never,
  });

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-tunhuer-'));
  rutas = new Rutas(path.join(base, 'datos'));
  plat = new PlataformaFalsa();
  propios = {};
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('Tuneles.restaurar: cloudflared huérfanos', () => {
  it('cierra por PID los de su carpeta que el supervisor no controla', async () => {
    const mio = path.join(rutas.bin('cloudflared', '2026.3.0'), exe);
    const ajeno = path.join(base, 'otro', 'bin', 'cloudflared', '1', exe);
    const otroNombre = path.join(rutas.base, 'bin', 'cloudflared', '2026.3.0', 'node.exe');
    plat.procesosUsuario = [
      proceso(10, mio),
      proceso(11, mio),
      proceso(12, ajeno),
      proceso(13, otroNombre),
      proceso(14, path.join(base, 'cloudflared.exe')),
    ];
    propios = { 'tunel-wolf': 11 };
    const t = crear();
    await t.restaurar();
    await t.esperarBarrido();
    expect(plat.matados).toEqual([10]);
  });

  it('no cierra si la hora de creación ya no coincide (PID reutilizado)', async () => {
    const mio = path.join(rutas.bin('cloudflared', '2026.3.0'), exe);
    plat.procesosUsuario = [proceso(10, mio, 'a')];
    const original = plat.inicioDeProceso.bind(plat);
    plat.inicioDeProceso = async (pid) => {
      void (await original(pid));
      return 'otra';
    };
    const t = crear();
    await t.restaurar();
    await t.esperarBarrido();
    expect(plat.matados).toEqual([]);
  });

  it('si no se puede listar, arranca igual', async () => {
    plat.fallaListado = true;
    const t = crear();
    await expect(t.restaurar()).resolves.toBeUndefined();
    await t.esperarBarrido();
    expect(plat.matados).toEqual([]);
  });

  it('restaurar no espera al barrido (aunque el listado de procesos no responda)', async () => {
    plat.procesosDelUsuario = () => new Promise(() => undefined);
    await expect(crear().restaurar()).resolves.toBeUndefined();
  });

  it('con barrerHuerfanos: false no consulta los procesos', async () => {
    const t = new Tuneles({
      supervisor: {
        ids: () => [],
        pid: () => null,
        estado: () => 'apagado',
        alSalir: () => undefined,
      } as never,
      sitios: { listar: async () => [] },
      almacen: { leer: async () => ({}) } as never,
      instalador: { instalados: async () => [] } as never,
      rutas,
      urlBase: { restaurarPorId: async () => undefined } as never,
      eventos: new Eventos<EventosNucleo>(),
      plataforma: plat as never,
      barrerHuerfanos: false,
    });
    await t.restaurar();
    await t.esperarBarrido();
    expect(plat.listados).toBe(0);
  });
});
