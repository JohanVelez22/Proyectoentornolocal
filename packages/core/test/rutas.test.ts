import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Rutas, rutaBasePorDefecto } from '../src/rutas';
import { raizDeSitio, type Sitio } from '../src/tipos';

const sitio = (o: Partial<Sitio>): Sitio => ({
  id: 'a',
  nombre: 'A',
  dominio: 'a.test',
  alias: [],
  carpeta: 'C:/Proyectos/A',
  tipo: 'laravel',
  php: '8.4',
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: null,
  datosReales: false,
  https: false,
  redirigirHttps: false,
  nota: '',
  ...o,
});

describe('rutas', () => {
  it('ruta base en Windows', () => {
    expect(rutaBasePorDefecto({ LOCALAPPDATA: String.raw`C:\X` }, 'win32')).toBe(
      String.raw`C:\X\WolfCoreDev`,
    );
  });
  it('raizDeSitio', () => {
    expect(raizDeSitio(sitio({}))).toMatch(/A[\\/]public$/);
    expect(raizDeSitio(sitio({ tipo: 'estatico' }))).toBe('C:/Proyectos/A');
    expect(raizDeSitio(sitio({ tipo: 'proxy' }))).toBe('C:/Proyectos/A');
  });
});

describe('purgarTemporales', () => {
  it('borra importar-*, restaurar-* y lanzar-*.pid de tmp/ y deja lo demás', async () => {
    const base = mkdtempSync(path.join(os.tmpdir(), 'pel-rutas-'));
    try {
      const r = new Rutas(base);
      await r.asegurar();
      const t = (...p: string[]): string => path.join(r.tmp(), ...p);
      mkdirSync(t('importar-abc', 'sub'), { recursive: true });
      writeFileSync(t('importar-abc', 'sub', 'origen.dump'), 'x');
      mkdirSync(t('restaurar-def'));
      writeFileSync(t('lanzar-123.pid'), '42');
      writeFileSync(t('lanzar-123.txt'), 'otro');
      mkdirSync(t('otra-carpeta'));
      await r.purgarTemporales();
      expect(readdirSync(r.tmp()).sort()).toEqual(['lanzar-123.txt', 'otra-carpeta']);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('sin tmp/ no falla', async () => {
    await expect(
      new Rutas(path.join(os.tmpdir(), 'pel-no-existe-xyz')).purgarTemporales(),
    ).resolves.toBeUndefined();
  });
});
