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
  it('PowerShell oculto con Process.Start: carpeta literal (con [ ]) y sin variables en la línea', () => {
    const env = { SystemRoot: 'C:\\Windows', CLAVE: 'secreta-de-prueba' };
    const inv = invocacionConsolaNueva(
      'C:\\Program Files\\Git\\git-bash.exe',
      ["--cd=C:\\Proyectos\\O'Brien System"],
      'C:\\Proyectos\\WolfCore System [x]',
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
        '$i = New-Object System.Diagnostics.ProcessStartInfo',
        "$i.FileName = 'C:\\Program Files\\Git\\git-bash.exe'",
        "$i.Arguments = '\"--cd=C:\\Proyectos\\O''Brien System\"'",
        // Literal: Start-Process -WorkingDirectory trataría los [ ] como comodines y, sin él,
        // arrancaría en la carpeta de PowerShell.
        "$i.WorkingDirectory = 'C:\\Proyectos\\WolfCore System [x]'",
        '$i.UseShellExecute = $true',
        '[void][System.Diagnostics.Process]::Start($i)',
      ].join('\n'),
    );
    // Las variables viajan en el entorno del proceso, nunca en la línea de órdenes.
    expect(inv.args.join(' ')).not.toContain('secreta-de-prueba');
    expect(script).not.toContain('secreta-de-prueba');
  });

  it('sin argumentos deja Arguments vacío; sin SystemRoot, PowerShell por el PATH', () => {
    const inv = invocacionConsolaNueva('C:\\Windows\\System32\\cmd.exe', [], 'C:\\P', {});
    expect(inv.cmd).toBe('powershell.exe');
    expect(decodificarComando(inv.args.at(-1)!)).toContain("$i.Arguments = ''");
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
