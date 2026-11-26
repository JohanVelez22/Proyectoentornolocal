import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { Rutas } from '../src/rutas';
import { ConfigSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: false }).catch(() => undefined);
  nucleo = null;
});

async function crear(instalado: boolean): Promise<Nucleo> {
  const dir = await carpetaTemporal('pel-meili-con-');
  const base = path.join(dir, 'datos');
  await mkdir(base, { recursive: true });
  if (instalado) {
    const bin = new Rutas(base).bin('meilisearch', '1.58.0');
    await mkdir(bin, { recursive: true });
    await writeFile(path.join(bin, 'meilisearch.exe'), 'falso');
  }
  const cfg = ConfigSchema.parse({
    servicios: {
      datos: {
        meilisearch: { version: instalado ? '1.58.0' : null, puerto: 7702 },
      },
    },
  });
  await writeFile(path.join(base, 'config.json'), JSON.stringify(cfg, null, 2));
  nucleo = await Nucleo.crear({
    base,
    plataforma: new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir }),
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
    retrasoNovedadesMs: 60_000,
  });
  return nucleo;
}

describe('I1: datos de conexión de Meilisearch', () => {
  it('devuelve host local, puerto y la master key guardada (misma que usa el .env)', async () => {
    const n = await crear(true);
    const a = await n.conexionServicio('meilisearch');
    expect(a).toMatchObject({ host: '127.0.0.1', puerto: 7702, usuario: '' });
    expect(a.clave).toMatch(/^[A-Za-z0-9]{20}$/);
    // Es la misma clave en el almacén de credenciales y estable entre llamadas.
    const b = await n.conexionServicio('meilisearch');
    expect(b.clave).toBe(a.clave);
    expect((await n.credenciales('meilisearch'))?.clave).toBe(a.clave);
    if (a.instancia) expect((await n.conexionServicio(a.instancia)).clave).toBe(a.clave);
  });

  it('sin Meilisearch instalado dice que no está instalado', async () => {
    const n = await crear(false);
    await expect(n.conexionServicio('meilisearch')).rejects.toMatchObject({
      codigo: 'servicios.no_instalado',
    });
  });

  it('no sirve para otros servicios', async () => {
    const n = await crear(true);
    await expect(n.conexionServicio('redis' as never)).rejects.toThrow();
    await expect(n.conexionServicio('redis@8' as never)).rejects.toMatchObject({
      codigo: 'servicios.desconocido',
    });
  });
});
