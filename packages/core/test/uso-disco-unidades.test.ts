import { describe, expect, it } from 'vitest';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { PlataformaWindows } from '../src/plataforma/win';
import { interpretarUnidades, SCRIPT_UNIDADES } from '../src/plataforma/unidadesWin';

/** D51: lista de unidades que se pueden analizar (solo lee; nada de MFT ni de administrador). */
describe('unidadesLocales', () => {
  it('interpreta la salida: discos fijos y extraíbles, con letra, etiqueta y espacio', () => {
    const json = JSON.stringify([
      { id: 'D:', tipo: 2, etiqueta: 'USB', total: 8_000_000_000, libre: 1_000 },
      { id: 'C:', tipo: 3, etiqueta: 'Windows', total: 500_000_000_000, libre: 120_000_000_000 },
      { id: 'Z:', tipo: 4, etiqueta: 'red', total: 1, libre: 1 },
      { id: 'E:', tipo: 5, etiqueta: '', total: 0, libre: 0 },
    ]);
    expect(interpretarUnidades(json)).toEqual([
      {
        ruta: 'C:\\',
        etiqueta: 'Windows',
        tipo: 'fijo',
        total: 500_000_000_000,
        libre: 120_000_000_000,
      },
      { ruta: 'D:\\', etiqueta: 'USB', tipo: 'extraible', total: 8_000_000_000, libre: 1_000 },
    ]);
  });

  it('acepta un solo objeto, tamaños que faltan y descarta lo que no es una letra', () => {
    expect(
      interpretarUnidades(
        JSON.stringify({ id: 'C:', tipo: 3, etiqueta: null, total: null, libre: null }),
      ),
    ).toEqual([{ ruta: 'C:\\', etiqueta: '', tipo: 'fijo', total: null, libre: null }]);
    expect(
      interpretarUnidades(
        JSON.stringify([
          { id: '\\srv', tipo: 3 },
          { id: 'CC:', tipo: 3 },
        ]),
      ),
    ).toEqual([]);
  });

  it('una salida que no es JSON da una lista vacía, no un error', () => {
    expect(interpretarUnidades('')).toEqual([]);
    expect(interpretarUnidades('no es json')).toEqual([]);
    expect(interpretarUnidades('{"id":5}')).toEqual([]);
  });

  it('el script solo consulta (sin escribir, sin elevar)', () => {
    expect(SCRIPT_UNIDADES).toContain('Win32_LogicalDisk');
    expect(SCRIPT_UNIDADES).not.toMatch(/Set-|Remove-|New-Item|Start-Process|RunAs/i);
  });

  it('Windows ejecuta el script y devuelve las unidades; si falla, lista vacía', async () => {
    const llamadas: string[][] = [];
    const bien = new PlataformaWindows(
      async (_c, args) => {
        llamadas.push(args);
        return {
          codigo: 0,
          stdout: JSON.stringify([{ id: 'C:', tipo: 3, etiqueta: 'W', total: 10, libre: 4 }]),
          stderr: '',
        };
      },
      undefined,
      { entorno: {} },
    );
    expect(await bien.unidadesLocales()).toEqual([
      { ruta: 'C:\\', etiqueta: 'W', tipo: 'fijo', total: 10, libre: 4 },
    ]);
    expect(llamadas).toHaveLength(1);
    const mal = new PlataformaWindows(
      async () => ({ codigo: 1, stdout: '', stderr: 'x' }),
      undefined,
      { entorno: {} },
    );
    expect(await mal.unidadesLocales()).toEqual([]);
  });

  it('la plataforma falsa devuelve las que ponga la prueba', async () => {
    const f = new PlataformaFalsa();
    expect(await f.unidadesLocales()).toEqual([]);
    f.unidades = [{ ruta: 'C:\\', etiqueta: '', tipo: 'fijo', total: 1, libre: 1 }];
    expect(await f.unidadesLocales()).toHaveLength(1);
  });
});
