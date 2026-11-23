import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  citarArgWindows,
  comandoConsolaVisible,
  CODIGO_CONSOLA_RESTRINGIDA,
  decodificarComando,
  errorDelLanzador,
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
        "if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') { exit 2 }",
        "$ErrorActionPreference = 'Stop'",
        'try {',
        '$i = New-Object System.Diagnostics.ProcessStartInfo',
        "$i.FileName = 'C:\\Program Files\\Git\\git-bash.exe'",
        "$i.Arguments = '\"--cd=C:\\Proyectos\\O''Brien System\"'",
        // Literal: Start-Process -WorkingDirectory trataría los [ ] como comodines y, sin él,
        // arrancaría en la carpeta de PowerShell.
        "$i.WorkingDirectory = 'C:\\Proyectos\\WolfCore System [x]'",
        '$i.UseShellExecute = $true',
        '[void][System.Diagnostics.Process]::Start($i)',
        '} catch {',
        "[Console]::Error.WriteLine('PEL_ERROR ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_.Exception.Message)))",
        'exit 1',
        '}',
      ].join('\n'),
    );
    // Las variables viajan en el entorno del proceso, nunca en la línea de órdenes.
    expect(inv.args.join(' ')).not.toContain('secreta-de-prueba');
    expect(script).not.toContain('secreta-de-prueba');
  });

  it('sin argumentos deja Arguments vacío; sin SystemRoot, el PowerShell de C:\\Windows (nunca el PATH)', () => {
    const inv = invocacionConsolaNueva('C:\\Windows\\System32\\cmd.exe', [], 'C:\\P', {});
    expect(inv.cmd).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    expect(decodificarComando(inv.args.at(-1)!)).toContain("$i.Arguments = ''");
  });

  it('el PowerShell oculto sale con un código propio en modo de lenguaje restringido y devuelve el error en Base64', () => {
    const script = decodificarComando(
      invocacionConsolaNueva('C:\\x.exe', [], 'C:\\P', { SystemRoot: 'C:\\Windows' }).args.at(-1)!,
    );
    expect(script.split('\n')[0]).toBe(
      `if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') { exit ${CODIGO_CONSOLA_RESTRINGIDA} }`,
    );
    expect(script).toContain('[Convert]::ToBase64String');
  });

  it('powershellDelSistema: SystemRoot, SYSTEMROOT o windir; si no, C:\\Windows', () => {
    expect(powershellDelSistema({ windir: 'D:\\Win' })).toBe(
      'D:\\Win\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    );
    expect(powershellDelSistema({})).toBe(
      'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    );
    // Una raíz que no es una ruta absoluta (variable manipulada) tampoco se usa.
    expect(powershellDelSistema({ SystemRoot: 'Windows' })).toBe(
      'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    );
  });

  it('comandoConsolaVisible usa el PowerShell del sistema y codifica la línea', () => {
    const c = comandoConsolaVisible('C:\\Program Files\\GitHub CLI\\gh.exe', ['auth', 'x y'], {
      SystemRoot: 'D:\\W',
    });
    expect(c.cmd).toBe('D:\\W\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    expect(c.args.slice(0, 2)).toEqual(['-NoExit', '-EncodedCommand']);
    expect(decodificarComando(c.args[2]!)).toBe(
      "& 'C:\\Program Files\\GitHub CLI\\gh.exe' auth 'x y'",
    );
  });
});

describe('errorDelLanzador', () => {
  it('sin la línea de órdenes; el detalle sale del Base64 en UTF-8 (tildes bien)', () => {
    const b64 = Buffer.from('No se encontró el archivo «x.exe»', 'utf8').toString('base64');
    const e = errorDelLanzador(
      Object.assign(new Error('Command failed: C:\\W\\powershell.exe -EncodedCommand QQBCAEMA'), {
        code: 1,
      }),
      `ruido\r\nPEL_ERROR ${b64}\r\n`,
    );
    expect(e).toMatchObject({ codigo: 'terminal.no_abrio' });
    expect(e.message).toContain('No se encontró el archivo «x.exe»');
    expect(e.message).not.toContain('EncodedCommand');
    expect(e.message).not.toContain('QQBCAEMA');
    // Sin detalle propio: solo el código de salida.
    const sin = errorDelLanzador(
      Object.assign(new Error('Command failed: a b c'), { code: 5 }),
      '',
    );
    expect(sin.message).not.toContain('Command failed');
    expect(sin.message).toContain('5');
  });

  it('modo de lenguaje restringido: mensaje propio', () => {
    const e = errorDelLanzador(
      Object.assign(new Error('Command failed: x'), { code: CODIGO_CONSOLA_RESTRINGIDA }),
      '',
    );
    expect(e).toMatchObject({ codigo: 'terminal.powershell_restringido' });
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
