import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { DefProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import { Tuneles } from '../src/tuneles/tuneles';

/** Túnel hacia un puerto cualquiera (Compartir, D52), con un supervisor simulado: no abre nada real. */

const BANNER = '2026-11-17T10:00:02Z INF |  https://lucky-words-here.trycloudflare.com  |';

let base: string;
let rutas: Rutas;
let eventos: Eventos<EventosNucleo>;
let iniciados: DefProceso[];
let detenidos: string[];
let salidas: Array<(id: string, c: number | null) => void>;
let escribir: boolean;
let instalados: string[];
let emitidos: unknown[];

const crear = (): Tuneles =>
  new Tuneles({
    supervisor: {
      iniciar: async (d: DefProceso) => {
        iniciados.push(d);
        if (escribir) {
          const archivo = d.args[d.args.indexOf('--logfile') + 1]!;
          mkdirSync(path.dirname(archivo), { recursive: true });
          writeFileSync(archivo, BANNER);
        }
      },
      detener: async (id: string) => {
        detenidos.push(id);
      },
      estado: () => 'apagado',
      pid: () => 4242,
      ids: () => [],
      alSalir: (fn: (id: string, c: number | null) => void) => salidas.push(fn),
    } as never,
    sitios: { listar: async () => [] },
    almacen: { leer: async () => ({ servicios: { nginx: { puerto: 8080 } } }) } as never,
    instalador: { instalados: async () => instalados } as never,
    rutas,
    urlBase: {} as never,
    eventos,
    opts: { esperaMs: 150, intervaloMs: 10 },
  });

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-tunpuerto-'));
  rutas = new Rutas(path.join(base, 'datos'));
  eventos = new Eventos<EventosNucleo>();
  emitidos = [];
  eventos.on('tunel:estado', (e) => emitidos.push(e));
  iniciados = [];
  detenidos = [];
  salidas = [];
  escribir = true;
  instalados = ['2026.3.0'];
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('Tuneles.abrirPuerto', () => {
  it('abre cloudflared hacia 127.0.0.1:puerto y devuelve la URL, sin tocar sitios', async () => {
    const t = crear();
    const r = await t.abrirPuerto(54321, 'cloudflare-rapido', () => undefined);
    expect(r.url).toBe('https://lucky-words-here.trycloudflare.com');
    expect(iniciados).toHaveLength(1);
    expect(iniciados[0]!.id).toBe('tunel-compartir_efimero');
    expect(iniciados[0]!.args).toContain('http://127.0.0.1:54321');
    expect(iniciados[0]!.reiniciar).toBe(false);
    expect(t.estados()).toEqual([]);
    expect(emitidos).toEqual([]);
  });

  it('cerrar detiene el proceso y es idempotente; después se puede abrir otro', async () => {
    const t = crear();
    const r = await t.abrirPuerto(1111, 'cloudflare-rapido', () => undefined);
    await r.cerrar();
    await r.cerrar();
    expect(detenidos).toEqual(['tunel-compartir_efimero', 'tunel-compartir_efimero']);
    await expect(t.abrirPuerto(2222, 'cloudflare-rapido', () => undefined)).resolves.toBeTruthy();
  });

  it('avisa si el proceso muere solo, pero no cuando se cierra a propósito', async () => {
    const t = crear();
    let cayo = 0;
    const r = await t.abrirPuerto(1111, 'cloudflare-rapido', () => cayo++);
    for (const f of salidas) f('tunel-compartir_efimero', 1);
    expect(cayo).toBe(1);
    // ya no hay túnel vivo: otro puede abrirse y su cierre no avisa
    const r2 = await t.abrirPuerto(2222, 'cloudflare-rapido', () => cayo++);
    const antes = cayo;
    const cierre = r2.cerrar();
    for (const f of salidas) f('tunel-compartir_efimero', 0);
    await cierre;
    expect(cayo).toBe(antes);
    await r.cerrar();
  });

  it('solo uno a la vez', async () => {
    const t = crear();
    await t.abrirPuerto(1111, 'cloudflare-rapido', () => undefined);
    await expect(t.abrirPuerto(2222, 'cloudflare-rapido', () => undefined)).rejects.toMatchObject({
      codigo: 'compartir.ocupado',
    });
    expect(iniciados).toHaveLength(1);
  });

  it('sin URL en el plazo, lo detiene y da el error', async () => {
    escribir = false;
    const t = crear();
    await expect(t.abrirPuerto(1111, 'cloudflare-rapido', () => undefined)).rejects.toMatchObject({
      codigo: 'compartir.tunel_sin_url',
    });
    expect(detenidos).toEqual(['tunel-compartir_efimero']);
    // quedó libre
    escribir = true;
    await expect(t.abrirPuerto(1111, 'cloudflare-rapido', () => undefined)).resolves.toBeTruthy();
  });

  it('sin cloudflared instalado, el error de siempre y no lanza nada', async () => {
    instalados = [];
    await expect(
      crear().abrirPuerto(1111, 'cloudflare-rapido', () => undefined),
    ).rejects.toMatchObject({ codigo: 'tuneles.cloudflared_no_instalado' });
    expect(iniciados).toEqual([]);
  });

  it('ngrok sin plataforma no está disponible; un puerto absurdo se rechaza', async () => {
    const t = crear();
    await expect(t.abrirPuerto(1111, 'ngrok', () => undefined)).rejects.toMatchObject({
      codigo: 'tuneles.proveedor_no_disponible',
    });
    for (const p of [0, -1, 70000, 1.5, NaN]) {
      await expect(t.abrirPuerto(p, 'cloudflare-rapido', () => undefined)).rejects.toBeTruthy();
    }
    expect(iniciados).toEqual([]);
  });

  it('una señal abortada mientras espera la URL corta la espera y detiene el proceso por su id', async () => {
    escribir = false;
    const t = crear();
    const control = new AbortController();
    const p = t.abrirPuerto(1111, 'cloudflare-rapido', () => undefined, control.signal);
    await new Promise((r) => setTimeout(r, 30));
    control.abort();
    await expect(p).rejects.toMatchObject({ codigo: 'compartir.tunel_cerrado' });
    expect(detenidos).toContain('tunel-compartir_efimero');
    // quedó libre
    escribir = true;
    await expect(t.abrirPuerto(2222, 'cloudflare-rapido', () => undefined)).resolves.toBeTruthy();
  });

  it('con la señal ya abortada ni lanza el proceso', async () => {
    const control = new AbortController();
    control.abort();
    await expect(
      crear().abrirPuerto(1111, 'cloudflare-rapido', () => undefined, control.signal),
    ).rejects.toMatchObject({ codigo: 'compartir.tunel_cerrado' });
    expect(iniciados).toEqual([]);
  });
});
