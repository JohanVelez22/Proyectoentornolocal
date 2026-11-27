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

const crear = (extra: Record<string, unknown> = {}): Tuneles =>
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
    ...extra,
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

  it('no cierra un proceso que aparece en el listado mientras el supervisor lo arranca', async () => {
    const mio = path.join(rutas.bin('cloudflared', '2026.3.0'), exe);
    plat.procesosUsuario = [proceso(10, mio), proceso(11, mio)];
    // El supervisor adopta el PID 11 justo después de listar (antes de que le toque el turno).
    const original = plat.inicioDeProceso.bind(plat);
    plat.inicioDeProceso = async (pid) => {
      if (pid === 11) propios['tunel-nuevo'] = 11;
      return original(pid);
    };
    const t = crear();
    await t.restaurar();
    await t.esperarBarrido();
    expect(plat.matados).toEqual([10]);
  });

  it('no cierra un proceso creado después del arranque de este núcleo', async () => {
    const mio = path.join(rutas.bin('cloudflared', '2026.3.0'), exe);
    plat.procesosUsuario = [proceso(10, mio, '500'), proceso(11, mio, '5000')];
    const t = crear({ ahora: () => 1000 });
    await t.restaurar();
    await t.esperarBarrido();
    expect(plat.matados).toEqual([10]);
  });

  it('sin poder comprobar la hora de inicio no cierra nada', async () => {
    const mio = path.join(rutas.bin('cloudflared', '2026.3.0'), exe);
    plat.procesosUsuario = [proceso(10, mio)];
    const sinInicio = {
      procesosDelUsuario: plat.procesosDelUsuario.bind(plat),
      matarArbol: plat.matarArbol.bind(plat),
      inicioAnteriorA: plat.inicioAnteriorA.bind(plat),
      restringirAlUsuario: plat.restringirAlUsuario.bind(plat),
    };
    const t = crear({ plataforma: sinInicio });
    await t.restaurar();
    await t.esperarBarrido();
    expect(plat.matados).toEqual([]);
  });

  it('abrir un túnel espera a que termine el barrido en curso', async () => {
    let soltar: () => void = () => undefined;
    plat.procesosDelUsuario = () =>
      new Promise((r) => {
        soltar = () => r([]);
      });
    const t = crear();
    await t.restaurar();
    let resuelto = false;
    const p = t.abrirPuerto(8080, 'ngrok', () => undefined).catch((e: unknown) => {
      resuelto = true;
      return e;
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(resuelto).toBe(false);
    soltar();
    const e = (await p) as { codigo?: string; code?: string };
    expect(resuelto).toBe(true);
    expect(JSON.stringify(e)).toContain('ngrok_no_instalado');
  });
});
