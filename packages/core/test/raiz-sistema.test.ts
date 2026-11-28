import { describe, expect, it } from 'vitest';
import { interpreteComandos } from '../src/plataforma/win';
import { rutaPowerShell, rutaSistema32 } from '../src/plataforma/procesosWin';
import { powershellDelSistema } from '../src/plataforma/terminalWin';
import { RAIZ_RESPALDO, raizSistema } from '../src/plataforma/raizSistema';

/** D54b: un único criterio para la carpeta de Windows (ni UNC, ni relativa, ni `..`, ni inexistente). */
const SOLO_C = (raiz: string): boolean => raiz.toUpperCase().startsWith('C:');

describe('raizSistema: un único criterio', () => {
  const hostiles = [
    '\\\\servidor\\recurso\\Windows',
    'Windows',
    '..\\Windows',
    'C:\\Windows\\..\\..\\Temp',
    'C:Windows',
    '/windows',
    'C:\\Win"dows',
    '',
  ];

  it.each(hostiles)('SystemRoot hostil %j: se usa el respaldo', (valor) => {
    expect(raizSistema({ SystemRoot: valor }, SOLO_C)).toBe(RAIZ_RESPALDO);
    expect(rutaSistema32({ SystemRoot: valor }, 'cmd.exe')).toBe('C:\\Windows\\System32\\cmd.exe');
    expect(rutaPowerShell({ SystemRoot: valor })).toBe(powershellDelSistema({ SystemRoot: valor }));
  });

  it('pasa a la siguiente variable válida cuando la primera no vale', () => {
    expect(
      raizSistema({ SystemRoot: '\\\\x\\y', SYSTEMROOT: 'C:\\W', windir: 'D:\\Z' }, SOLO_C),
    ).toBe('C:\\W');
    expect(raizSistema({ SystemRoot: 'Z:\\Win', windir: 'C:\\Windows' }, SOLO_C)).toBe(
      'C:\\Windows',
    );
  });

  it('con una unidad inexistente cae al respaldo', () => {
    expect(raizSistema({ SystemRoot: 'Z:\\Win' }, SOLO_C)).toBe(RAIZ_RESPALDO);
  });

  it('sin comprobar la existencia (entorno ajeno) solo exige la forma de la ruta', () => {
    expect(raizSistema({ SystemRoot: 'D:\\Win' })).toBe('D:\\Win');
  });

  it('el entorno del proceso exige un Windows de verdad: kernel32.dll en System32', () => {
    const antes = process.env.SystemRoot;
    try {
      const real = raizSistema(process.env);
      process.env.SystemRoot = 'Z:\\NoExiste';
      expect(raizSistema(process.env).toLowerCase()).not.toBe('z:\\noexiste');
      expect(raizSistema(process.env)).toMatch(/^[A-Za-z]:\\/);
      process.env.SystemRoot = real;
      expect(raizSistema(process.env)).toBe(real);
    } finally {
      if (antes === undefined) delete process.env.SystemRoot;
      else process.env.SystemRoot = antes;
    }
  });
});

describe('interpreteComandos', () => {
  it('es siempre cmd.exe de la raíz validada; un ComSpec distinto se ignora', () => {
    const antes = process.env.ComSpec;
    try {
      const esperado = rutaSistema32(process.env, 'cmd.exe');
      process.env.ComSpec = 'C:\\Users\\x\\Descargas\\cmd.exe';
      expect(interpreteComandos()).toBe(esperado);
      process.env.ComSpec = '\\\\servidor\\recurso\\cmd.exe';
      expect(interpreteComandos()).toBe(esperado);
      process.env.ComSpec = esperado.toUpperCase();
      expect(interpreteComandos()).toBe(esperado);
      delete process.env.ComSpec;
      expect(interpreteComandos()).toBe(esperado);
    } finally {
      if (antes === undefined) delete process.env.ComSpec;
      else process.env.ComSpec = antes;
    }
  });
});
