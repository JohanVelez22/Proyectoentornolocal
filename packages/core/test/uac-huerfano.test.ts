import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  codificarComando,
  GUARDA_LANZADOR,
  SALIDA_COPIA,
  scriptElevar,
} from '../src/plataforma/hostsAdmin';
import { analizarPowerShell, hayPowerShell } from './soporte/parserPowerShell';

describe('F7: un UAC aceptado tarde no hace nada (el lanzador ya no existe)', () => {
  it('el comando elevado empieza por la guarda del lanzador y el exterior la rellena con su PID', () => {
    const externo = scriptElevar(codificarComando('exit 0'));
    expect(externo).toContain('GetProcessById(@@PID@@)');
    expect(externo).toContain(".Replace('@@PID@@'");
    expect(GUARDA_LANZADOR).toContain(`exit ${SALIDA_COPIA.huerfano}`);
  });

  it.skipIf(!hayPowerShell())('el exterior es PowerShell válido', () => {
    const [a] = analizarPowerShell([scriptElevar(codificarComando('exit 0'))]);
    expect(a!.errores).toEqual([]);
  });

  /**
   * De verdad con PowerShell, SIN elevar: se corre la parte del exterior que arma el comando (hasta
   * `$i.Arguments`, sin `Process.Start`) y se ejecuta lo que se habría pasado al elevado.
   */
  describe.skipIf(process.platform !== 'win32')('con PowerShell real, sin elevar', () => {
    const ps = (script: string, timeout = 60_000) =>
      spawnSync(
        'powershell',
        ['-NoProfile', '-NonInteractive', '-EncodedCommand', codificarComando(script)],
        { encoding: 'utf8', windowsHide: true, timeout },
      );
    /** Lo que vale el comando elevado según el exterior: parte de `$i.Arguments`. */
    const armado = (inner: string, mostrar = true): string => {
      const externo = scriptElevar(codificarComando(inner));
      const parte = externo.slice(0, externo.indexOf('; $i.Verb')).replace(/; \$/g, '\n$');
      return mostrar ? `${parte}\n[Console]::Out.Write($i.Arguments)` : parte;
    };
    const comandoDe = (args: string): string => {
      const b64 = /-EncodedCommand (\S+)$/.exec(args)![1]!;
      return Buffer.from(b64, 'base64').toString('utf16le');
    };

    it('con el lanzador vivo el comando elevado corre; con el lanzador muerto sale con «huérfano» sin hacer nada', () => {
      // Se arma el comando desde un lanzador que ya terminó.
      const salida = ps(armado("[Console]::Out.Write('HIZO'); exit 0"));
      expect(salida.status).toBe(0);
      const comando = comandoDe(salida.stdout);
      expect(comando.startsWith('try { if ([Diagnostics.Process]::GetProcessById(')).toBe(true);
      expect(comando.endsWith("[Console]::Out.Write('HIZO'); exit 0")).toBe(true);
      expect(comando).not.toContain('@@');
      // El lanzador (esa PowerShell) ya terminó: el comando sale con «huérfano» y no hace nada.
      const tarde = ps(comando);
      expect(tarde.status).toBe(SALIDA_COPIA.huerfano);
      expect(tarde.stdout).toBe('');
    });

    it('con el lanzador vivo (mismo PID e inicio) la guarda deja pasar al resto del comando', () => {
      // Un lanzador vivo: esta misma PowerShell arma el comando y lo corre en un hijo.
      const r = ps(
        `${armado("[Console]::Out.Write('HIZO'); exit 0", false)}\n` +
          `$cmd = $i.Arguments.Substring('-NoProfile -NonInteractive -EncodedCommand '.Length)\n` +
          `$p = [Diagnostics.Process]::Start([Diagnostics.ProcessStartInfo]@{ FileName = 'powershell.exe'; Arguments = '-NoProfile -NonInteractive -EncodedCommand ' + $cmd; UseShellExecute = $false; RedirectStandardOutput = $true; CreateNoWindow = $true })\n` +
          `$o = $p.StandardOutput.ReadToEnd(); $p.WaitForExit()\n` +
          `[Console]::Out.Write(([string]$p.ExitCode) + '|' + $o)`,
      );
      expect(r.stdout).toBe('0|HIZO');
    });
  });
});
