import { describe, expect, it } from 'vitest';
import { rutaBasePorDefecto } from '../src/rutas';
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
  nota: '',
  ...o,
});

describe('rutas', () => {
  it('ruta base en Windows', () => {
    expect(rutaBasePorDefecto({ LOCALAPPDATA: String.raw`C:\X` }, 'win32')).toBe(
      String.raw`C:\X\Proyectoentornolocal`,
    );
  });
  it('raizDeSitio', () => {
    expect(raizDeSitio(sitio({}))).toMatch(/A[\\/]public$/);
    expect(raizDeSitio(sitio({ tipo: 'estatico' }))).toBe('C:/Proyectos/A');
    expect(raizDeSitio(sitio({ tipo: 'proxy' }))).toBe('C:/Proyectos/A');
  });
});
