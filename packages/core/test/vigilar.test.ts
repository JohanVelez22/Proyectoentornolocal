import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { ConfigSchema, SitioSchema, type Config } from '../src/tipos';
import { VigilanteProyectos } from '../src/proyectos/vigilar';
import { carpetaTemporal } from './temporales';

async function laravel(base: string, nombre: string): Promise<string> {
  const d = join(base, nombre);
  await mkdir(d, { recursive: true });
  await writeFile(join(d, 'artisan'), '');
  return d;
}

let base: string;
let config: Config;
let eventos: Eventos<EventosNucleo>;
let vigilante: VigilanteProyectos;

beforeEach(async () => {
  base = await carpetaTemporal('pel-vig-');
  config = ConfigSchema.parse({});
  eventos = new Eventos<EventosNucleo>();
  vigilante = new VigilanteProyectos({ leerConfig: async () => config, eventos, esperaMs: 40 });
});
afterEach(() => vigilante.dispose());

describe('config', () => {
  it('un config.json antiguo sin "proyectos" sigue cargando', () => {
    expect(ConfigSchema.parse({ version: 1, sitios: [] }).proyectos.carpetaVigilada).toBeNull();
  });
});

describe('sugerencias', () => {
  it('sin carpeta vigilada no hay sugerencias', async () => {
    expect(await vigilante.sugerencias()).toEqual([]);
  });

  it('lista las subcarpetas que parecen proyecto y descarta lo demás', async () => {
    const a = await laravel(base, 'Mi Tienda ñ');
    await mkdir(join(base, 'vacia'));
    await mkdir(join(base, 'solo-html'));
    await writeFile(join(base, 'solo-html', 'index.html'), '');
    await laravel(base, '_archivo');
    await laravel(base, '.oculta');
    await laravel(base, 'node_modules');
    await laravel(base, 'vendor');
    await writeFile(join(base, 'suelto.txt'), '');
    await mkdir(join(a, 'sub'));
    await writeFile(join(a, 'sub', 'artisan'), '');
    config.proyectos.carpetaVigilada = base;
    const r = await vigilante.sugerencias();
    expect(r.map((s) => s.carpeta)).toEqual([a]);
    expect(r[0]!.deteccion.tipo).toBe('laravel');
  });

  it('excluye lo que ya es un sitio, sin importar mayúsculas ni barras', async () => {
    const a = await laravel(base, 'Uno');
    const b = await laravel(base, 'Dos');
    config.proyectos.carpetaVigilada = base;
    config.sitios.push(
      SitioSchema.parse({
        id: 'x',
        nombre: 'x',
        dominio: 'x.test',
        carpeta: a.toUpperCase().split(sep).join('/') + '/',
        tipo: 'laravel',
      }),
    );
    expect((await vigilante.sugerencias()).map((s) => s.carpeta)).toEqual([b]);
  });

  it('una carpeta inexistente da lista vacía sin lanzar', async () => {
    config.proyectos.carpetaVigilada = join(base, 'no-existe');
    expect(await vigilante.sugerencias()).toEqual([]);
  });
});

describe('vigilar', () => {
  it('emite una vez, tras la espera, cuando aparece un proyecto', async () => {
    config.proyectos.carpetaVigilada = base;
    const oyente = vi.fn();
    eventos.on('proyectos:sugerencias', oyente);
    await vigilante.vigilar(base);
    expect(oyente).not.toHaveBeenCalled();
    const a = await laravel(base, 'nuevo');
    await writeFile(join(a, 'otro'), '');
    await vi.waitFor(() => expect(oyente).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(oyente.mock.calls[0]![0].map((s: { carpeta: string }) => s.carpeta)).toEqual([a]);
  });

  it('no emite si la lista no cambió', async () => {
    await laravel(base, 'uno');
    config.proyectos.carpetaVigilada = base;
    const oyente = vi.fn();
    eventos.on('proyectos:sugerencias', oyente);
    await vigilante.vigilar(base);
    await mkdir(join(base, 'basura'));
    await new Promise((r) => setTimeout(r, 400));
    expect(oyente).not.toHaveBeenCalled();
  });

  it('vigilar(null) detiene la vigilancia', async () => {
    config.proyectos.carpetaVigilada = base;
    const oyente = vi.fn();
    eventos.on('proyectos:sugerencias', oyente);
    await vigilante.vigilar(base);
    await vigilante.vigilar(null);
    await laravel(base, 'tarde');
    await new Promise((r) => setTimeout(r, 400));
    expect(oyente).not.toHaveBeenCalled();
  });

  it('una carpeta inexistente no lanza', async () => {
    await expect(vigilante.vigilar(join(base, 'no-existe'))).resolves.toBeUndefined();
  });

  it('si la carpeta vigilada desaparece no se cae y la lista queda vacía', async () => {
    const dir = join(base, 'raiz');
    await mkdir(dir);
    await laravel(dir, 'uno');
    config.proyectos.carpetaVigilada = dir;
    const oyente = vi.fn();
    eventos.on('proyectos:sugerencias', oyente);
    await vigilante.vigilar(dir);
    await rm(dir, { recursive: true, force: true });
    await new Promise((r) => setTimeout(r, 400));
    expect(await vigilante.sugerencias()).toEqual([]);
  });
});
