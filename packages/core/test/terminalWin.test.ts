import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  citarArgWindows,
  comandoConsolaVisible,
  decodificarComando,
  existeEntrada,
  invocacionConsolaNueva,
  powershellDelSistema,
} from '../src/plataforma/terminalWin';
import { carpetaTemporal } from './temporales';

describe('citarArgWindows (reglas de CommandLineToArgvW)', () => {
  it.each([
    ['simple', 'simple'],
    ['', '""'],
    ['C:\\Proyectos\\WolfCore System', '"C:\\Proyectos\\WolfCore System"'],
    ['--cd=C:\\a b\\', '"--cd=C:\\a b\\\\"'],
    ['dijo "hola"', '"dijo \\"hola\\""'],
    ['a\\"b c', '"a\\\\\\"b c"'],
    ['C:\\sin\\espacios\\', 'C:\\sin\\espacios\\'],
  ])('%s → %s', (a, esperado) => {
    expect(citarArgWindows(a)).toBe(esperado);
  });
});

describe('invocacionConsolaNueva', () => {
  it('PowerShell oculto con Start-Process: sin carpeta en la línea (va como cwd) ni variables', () => {
    const env = { SystemRoot: 'C:\\Windows', CLAVE: 'secreta-de-prueba' };
    const inv = invocacionConsolaNueva(
      'C:\\Program Files\\Git\\git-bash.exe',
      ["--cd=C:\\Proyectos\\O'Brien System"],
      env,
    );
    expect(inv.cmd).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    expect(inv.args.slice(0, -1)).toEqual([
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-EncodedCommand',
    ]);
    const script = decodificarComando(inv.args.at(-1)!);
    expect(script).toBe(
      [
        "$ErrorActionPreference = 'Stop'",
        "Start-Process -FilePath 'C:\\Program Files\\Git\\git-bash.exe' -ArgumentList '\"--cd=C:\\Proyectos\\O''Brien System\"'",
      ].join('\n'),
    );
    // Las variables viajan en el entorno del proceso, nunca en la línea de órdenes.
    expect(inv.args.join(' ')).not.toContain('secreta-de-prueba');
    expect(script).not.toContain('secreta-de-prueba');
  });

  it('sin argumentos no pasa -ArgumentList (Start-Process lo rechaza vacío)', () => {
    const inv = invocacionConsolaNueva('C:\\Windows\\System32\\cmd.exe', [], {});
    expect(inv.cmd).toBe('powershell.exe');
    expect(decodificarComando(inv.args.at(-1)!)).not.toContain('-ArgumentList');
  });

  it('powershellDelSistema: SystemRoot, SYSTEMROOT o windir; si no, por el PATH', () => {
    expect(powershellDelSistema({ windir: 'D:\\Win' })).toBe(
      'D:\\Win\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    );
    expect(powershellDelSistema({})).toBe('powershell.exe');
  });

  it('comandoConsolaVisible codifica la línea (ninguna comilla pasa por otro analizador)', () => {
    const c = comandoConsolaVisible('C:\\Program Files\\GitHub CLI\\gh.exe', ['auth', 'x y']);
    expect(c.args.slice(0, 2)).toEqual(['-NoExit', '-EncodedCommand']);
    expect(decodificarComando(c.args[2]!)).toBe(
      "& 'C:\\Program Files\\GitHub CLI\\gh.exe' auth 'x y'",
    );
  });
});

describe('existeEntrada', () => {
  it('ve archivos (y alias de la Tienda, que existsSync no ve); no lo que falta', async () => {
    const dir = await carpetaTemporal('pel-terminal-');
    const f = path.join(dir, 'wt.exe');
    writeFileSync(f, '');
    expect(existeEntrada(f)).toBe(true);
    expect(existeEntrada(path.join(dir, 'nada.exe'))).toBe(false);
  });
});
