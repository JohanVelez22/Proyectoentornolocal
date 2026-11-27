import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { equipoDesconocido } from '../src/equipo/tipos';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';

const GIB = 1024 ** 3;
let base: string;
let nucleo: Nucleo | null = null;

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-equipo-'));
});
afterEach(async () => {
  if (nucleo) await nucleo.cerrar({ detenerServicios: false });
  nucleo = null;
  rmSync(base, { recursive: true, force: true });
});

async function crear(
  plataforma: PlataformaFalsa,
  fetchFalso: (u: string) => Promise<Response>,
): Promise<Nucleo> {
  nucleo = await Nucleo.crear({
    barrerHuerfanos: false,
    base,
    plataforma,
    sonda: async () => false,
    fetch: fetchFalso as typeof fetch,
  });
  return nucleo;
}

const manifiesto = (bytes: number): Response =>
  new Response(JSON.stringify({ config: { size: 100 }, layers: [{ size: bytes }] }));

describe('Nucleo: equipo y compatibilidad de modelos (D55)', () => {
  it('infoEquipo lee una vez por la plataforma y guarda el resultado', async () => {
    const p = new PlataformaFalsa();
    p.equipo = { ...equipoDesconocido(), ram: { totalBytes: 16 * GIB, libreBytes: 4 * GIB } };
    let lecturas = 0;
    const original = p.infoEquipo.bind(p);
    p.infoEquipo = async () => {
      lecturas++;
      return original();
    };
    const n = await crear(p, async () => new Response('{}'));
    await n.infoEquipo();
    await n.infoEquipo();
    expect(lecturas).toBe(1);
    await n.infoEquipo(true);
    expect(lecturas).toBe(2);
  });

  it('clasifica modelos del registro y los instalados, y sugiere un tamaño', async () => {
    const p = new PlataformaFalsa();
    p.equipo = {
      ...equipoDesconocido(),
      ram: { totalBytes: 32 * GIB, libreBytes: 20 * GIB },
      gpus: [{ nombre: 'GPU', vramBytes: 8 * GIB, origenVram: 'registro' }],
    };
    const n = await crear(p, async (u) => {
      if (u.endsWith('/api/tags')) {
        return new Response(JSON.stringify({ models: [{ name: 'llama3.2:latest', size: 2e9 }] }));
      }
      if (u.includes('/library/mistral/manifests/')) return manifiesto(4.1e9);
      if (u.includes('/library/gigante/manifests/')) return manifiesto(80e9);
      return new Response('no', { status: 404 });
    });
    const r = await n.compatibilidadModelos(['llama3.2', 'mistral', 'gigante', 'desconocido']);
    expect(r.sugerencia).toMatchObject({ parametrosMaxB: 7, memoria: 'vram' });
    const por = Object.fromEntries(r.modelos.map((m) => [m.nombre, m]));
    expect(por['llama3.2']).toMatchObject({ nivel: 'recomendado', instalado: true });
    expect(por['mistral']).toMatchObject({ nivel: 'recomendado', motivo: 'cabe-vram' });
    expect(por['gigante']).toMatchObject({ nivel: 'no-cabe' });
    expect(por['desconocido']).toMatchObject({
      nivel: 'desconocido',
      motivo: 'tamano-desconocido',
    });
  });

  it('sin red ni Ollama, un modelo sugerido usa su tamaño conocido (y el resto sigue «desconocido»)', async () => {
    const p = new PlataformaFalsa();
    p.equipo = { ...equipoDesconocido(), ram: { totalBytes: 16 * GIB, libreBytes: 8 * GIB } };
    const n = await crear(p, async () => {
      throw new Error('sin red');
    });
    const r = await n.compatibilidadModelos(['llama3.2', 'otro']);
    expect(r.modelos[0]).toMatchObject({ nivel: 'recomendado', motivo: 'cabe-ram' });
    expect(r.modelos[1]).toMatchObject({ nivel: 'desconocido', motivo: 'tamano-desconocido' });
    expect(r.sugerencia.parametrosMaxB).toBe(7);
  });

  it('con Ollama apagado y sin red no falla: todo «desconocido»', async () => {
    const p = new PlataformaFalsa();
    const n = await crear(p, async () => {
      throw new Error('sin red');
    });
    const r = await n.compatibilidadModelos(['llama3.2']);
    expect(r.modelos[0]!.nivel).toBe('desconocido');
    expect(r.sugerencia.parametrosMaxB).toBeNull();
  });
});
