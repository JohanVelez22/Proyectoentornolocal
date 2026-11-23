/**
 * Prueba real de "Terminal" en Windows: una consola nueva y visible que recibe el entorno y la
 * carpeta (con espacios y comilla). Abre una ventana un instante: el PowerShell de la prueba
 * escribe lo que ve y se cierra solo (sin -NoExit).
 */
import { mkdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { lanzarEnConsolaNueva, powershellDelSistema } from '../../src/plataforma/terminalWin';
import { dormir, esWindows } from './comun';

describe.skipIf(!esWindows)('Terminal en una consola nueva (Windows real)', () => {
  it('PowerShell arranca en la carpeta con espacios y recibe las variables del proyecto', async () => {
    const base = path.join(os.tmpdir(), `pel-terminal ${Date.now()}`);
    const carpeta = path.join(base, "WolfCore System O'Brien");
    mkdirSync(carpeta, { recursive: true });
    const salida = path.join(base, 'visto.txt');
    const script = `Set-Content -LiteralPath '${salida.replace(/'/g, "''")}' -Value ($env:PEL_PRUEBA_TERMINAL + '|' + (Get-Location).Path)`;
    await lanzarEnConsolaNueva(
      powershellDelSistema(process.env),
      ['-NoProfile', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
      { cwd: carpeta, env: { ...process.env, PEL_PRUEBA_TERMINAL: 'valor-de-prueba' } },
    );
    let visto = '';
    for (let i = 0; i < 100 && !visto; i++) {
      await dormir(100);
      try {
        visto = readFileSync(salida, 'utf8').trim();
      } catch {
        visto = '';
      }
    }
    expect(visto).toBe(`valor-de-prueba|${carpeta}`);
  });

  it('un programa que no existe da terminal.no_abrio (no falla en silencio)', async () => {
    await expect(
      lanzarEnConsolaNueva('C:\\no-existe\\nada.exe', [], { cwd: os.tmpdir(), env: process.env }),
    ).rejects.toMatchObject({ codigo: 'terminal.no_abrio' });
  });
});
