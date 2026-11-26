import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { procesoReverb } from '../src/proyectos/reverb';
import { ConfigSchema, SitioSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: false }).catch(() => undefined);
  nucleo = null;
});

async function crear(): Promise<Nucleo> {
  const dir = await carpetaTemporal('pel-reverb-nuc-');
  const base = path.join(dir, 'datos');
  const carpeta = path.join(dir, 'tienda');
  await mkdir(path.join(carpeta, 'vendor', 'laravel', 'reverb'), { recursive: true });
  await writeFile(path.join(carpeta, 'vendor', 'laravel', 'reverb', 'composer.json'), '{}');
  await mkdir(base, { recursive: true });
  const cfg = ConfigSchema.parse({
    sitios: [
      SitioSchema.parse({
        id: 'tienda',
        nombre: 'Tienda',
        dominio: 'tienda.test',
        carpeta,
        tipo: 'laravel',
        php: '8.4',
        procesos: [procesoReverb(8085)],
      }),
    ],
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

describe('M3: Reverb y la confianza del sitio', () => {
  it('al perder la confianza se quita el proceso reverb y el sitio deja de ofrecerlo', async () => {
    const n = await crear();
    await n.confiarReceta('tienda');
    expect((await n.estadoReverb('tienda')).disponible).toBe(true);
    expect((await n.config.leer()).sitios[0]!.procesos.map((p) => p.id)).toEqual(['reverb']);

    const { id, ...datos } = (await n.config.leer()).sitios[0]!;
    await n.guardarSitio({ ...datos, confiado: false }, id);

    const sitio = (await n.config.leer()).sitios[0]!;
    expect(sitio.procesos.map((p) => p.id)).toEqual([]);
    const e = await n.estadoReverb('tienda');
    expect(e).toMatchObject({ disponible: false, motivo: 'reverb.no_confiado', activo: false });
  });

  it('con la confianza intacta, guardar el sitio conserva el proceso', async () => {
    const n = await crear();
    await n.confiarReceta('tienda');
    const { id, ...datos } = (await n.config.leer()).sitios[0]!;
    await n.guardarSitio({ ...datos, nota: 'x' }, id);
    expect((await n.config.leer()).sitios[0]!.procesos.map((p) => p.id)).toEqual(['reverb']);
  });
});
