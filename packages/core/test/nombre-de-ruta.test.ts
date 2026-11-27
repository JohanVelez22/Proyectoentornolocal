import { describe, expect, it } from 'vitest';
import { nombreDeRuta, segmentosDeRuta } from '../src/index';

describe('nombreDeRuta', () => {
  it.each([
    ['C:\\x\\.env', '.env'],
    ['/home/u/.env', '.env'],
    ['C:\\a/b\\c.env', 'c.env'],
    ['/a\\b/c.pem', 'c.pem'],
    ['\\\\srv\\share\\a.txt', 'a.txt'],
    ['//srv/share/a.txt', 'a.txt'],
    ['solo.txt', 'solo.txt'],
    ['', ''],
  ])('%j -> %j', (ruta, esperado) => expect(nombreDeRuta(ruta)).toBe(esperado));

  it('ignora las barras finales', () => {
    expect(nombreDeRuta('C:\\x\\carpeta\\')).toBe('carpeta');
    expect(nombreDeRuta('/x/carpeta/')).toBe('carpeta');
    expect(nombreDeRuta('C:\\x\\carpeta\\\\/')).toBe('carpeta');
  });

  it('raíces: la unidad sin barra, la raíz POSIX vacía y el recurso UNC por su nombre', () => {
    expect(nombreDeRuta('C:\\')).toBe('C:');
    expect(nombreDeRuta('C:')).toBe('C:');
    expect(nombreDeRuta('/')).toBe('');
    expect(nombreDeRuta('\\\\srv\\share\\')).toBe('share');
  });
});

describe('segmentosDeRuta', () => {
  it('separa por \\ y / y descarta los vacíos', () => {
    expect(segmentosDeRuta('C:\\Users\\u\\AppData\\Local')).toEqual([
      'C:',
      'Users',
      'u',
      'AppData',
      'Local',
    ]);
    expect(segmentosDeRuta('/home/u//x/')).toEqual(['home', 'u', 'x']);
    expect(segmentosDeRuta('C:\\a/b\\c')).toEqual(['C:', 'a', 'b', 'c']);
    expect(segmentosDeRuta('\\\\srv\\share\\a')).toEqual(['srv', 'share', 'a']);
    expect(segmentosDeRuta('')).toEqual([]);
  });
});
