import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { FIRMAS, lineasDuenoProceso } from '../src/plataforma/pinvokeWin';
import { scriptProcesosUsuario } from '../src/plataforma/procesosUsuarioWin';
import { scriptVaciarWorkingSets } from '../src/plataforma/memoriaWin';
import { codificarPowerShell } from '../src/plataforma/pathUsuarioWin';
import {
  analizarPowerShell,
  hayPowerShell,
  rutaPowerShellWindows,
} from './soporte/parserPowerShell';

// El dueño de un proceso se lee del token (D54b): sin CIM por proceso (0,7 s cada uno), sin
// administrador y sin compilar.

const cuerpoPrueba = (pids: number[]): string =>
  [
    ...lineasDuenoProceso(),
    '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
    `foreach ($id in @(${pids.join(',')})) {`,
    '  $d = Get-DuenoWolf $id',
    '  if ($d) { [Console]::Out.WriteLine("$id|PROPIO=$($d.Sid -eq $yo)|SID=$($d.Sid)|E=$($d.Elevado)|S=$($d.Sesion)") } else { [Console]::Out.WriteLine("$id|NO_PROPIO") }',
    '}',
  ].join('\n');

describe('el dueño se lee del token, sin CIM por proceso', () => {
  const scripts = {
    listado: scriptProcesosUsuario(1),
    vaciado: scriptVaciarWorkingSets([{ pid: 1234, inicio: '1' }]),
    cuerpo: cuerpoPrueba([1]),
  };

  it.each(Object.entries(scripts))(
    '%s: ni Add-Type, ni csc, ni GetOwner, ni Invoke-CimMethod',
    (_n, s) => {
      expect(s).not.toMatch(/Add-Type|csc\.exe|\bcsc\b|GetOwner|Invoke-CimMethod/i);
    },
  );

  it('el listado y el vaciado usan OpenProcessToken por Reflection.Emit', () => {
    for (const s of [scripts.listado, scripts.vaciado]) {
      expect(s).toContain('Get-DuenoWolf');
      expect(s).toContain('OpenProcessToken');
      expect(s).toContain('DefinePInvokeMethod');
    }
  });

  it('abre el proceso solo con PROCESS_QUERY_LIMITED_INFORMATION y el token solo con TOKEN_QUERY', () => {
    const c = lineasDuenoProceso().join('\n');
    expect(c).toContain('OpenProcess(0x1000,');
    expect(c).toContain('OpenProcessToken($h, 8,');
    expect(c).toContain('GetTokenInformation($t, 1,'); // TokenUser
    expect(c).toContain('GetTokenInformation($t, 20,'); // TokenElevation
    expect(c).toContain('ConvertSidToStringSidW');
    expect(c).toContain('ProcessIdToSessionId');
    expect(c).not.toMatch(/TOKEN_ALL|0x2000000|0xF01FF|AdjustTokenPrivileges/i);
  });

  it('las firmas del dueño no declaran estructuras ni SetLastError', () => {
    for (const f of FIRMAS.dueno) {
      for (const p of [f.retorno, ...f.parametros]) expect(p).not.toMatch(/struct/);
    }
  });

  it('un proceso cuyo token no se puede abrir se excluye (nunca se trata como del usuario)', () => {
    const c = lineasDuenoProceso().join('\n');
    // Cada fallo (proceso, token, información, SID, sesión) devuelve $null, nunca un objeto parcial.
    expect(c.match(/return \$null/g)!.length).toBeGreaterThanOrEqual(6);
    expect(c).toContain('} catch { return $null }');
    // Y el listado y el vaciado solo siguen si hay dueño y es el usuario actual.
    expect(scripts.listado).toMatch(/\$d -and \$d\.Sid -eq \$yo/);
    expect(scripts.vaciado).toMatch(/-not \$d -or \$d\.Sid -ne \$yo/);
  });

  it('si falla GetTokenInformation(20) (elevación) el proceso se excluye, no se asume no elevado', () => {
    const c = lineasDuenoProceso().join('\n');
    expect(c).toContain(
      'if (-not $Dw::GetTokenInformation($t, 20, $e, 4, [ref]$k)) { return $null }',
    );
    expect(c).not.toContain('$el = 0');
  });

  it('el vaciado lee el token del MISMO handle que vacía (sin reabrir el proceso por PID)', () => {
    const s = scripts.vaciado;
    expect(s).toContain('Get-DuenoWolf $pid_ $h');
    expect(s.indexOf('$Ws::OpenProcess(0x1100')).toBeLessThan(s.indexOf('Get-DuenoWolf $pid_ $h'));
    expect(s.indexOf('Get-DuenoWolf $pid_ $h')).toBeLessThan(s.indexOf('$Ws::EmptyWorkingSet($h)'));
    // Con un handle ajeno, Get-DuenoWolf no lo cierra.
    const c = lineasDuenoProceso().join('\n');
    expect(c).toContain('if ($propio) { $null = $Dw::CloseHandle($h) }');
  });

  it.skipIf(!hayPowerShell())('los scripts son PowerShell válido', () => {
    const a = analizarPowerShell(Object.values(scripts));
    for (const x of a) expect(x.errores).toEqual([]);
  });

  describe.skipIf(process.platform !== 'win32')('con PowerShell real, sin elevar', () => {
    const correr = (pids: number[]): string[] => {
      const r = spawnSync(rutaPowerShellWindows(), codificarPowerShell(cuerpoPrueba(pids)), {
        encoding: 'utf8',
        timeout: 60_000,
        windowsHide: true,
      });
      expect(r.status, r.stderr).toBe(0);
      return r.stdout.split(/\r?\n/).filter((l) => l.trim() !== '');
    };

    it('el propio proceso de prueba sale con el SID del usuario actual; el 4 (System) y un PID inexistente quedan fuera', () => {
      const yo = spawnSync(
        rutaPowerShellWindows(),
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          '[Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
        ],
        { encoding: 'utf8', timeout: 60_000, windowsHide: true },
      ).stdout.trim();
      expect(yo).toMatch(/^S-1-5-/);
      const l = correr([process.pid, 4, 99999999]);
      expect(l[0]).toContain(`${process.pid}|PROPIO=True|SID=${yo}|E=`);
      expect(l[0]).toMatch(/\|S=\d+$/);
      expect(l[1]).toBe('4|NO_PROPIO');
      expect(l[2]).toBe('99999999|NO_PROPIO');
    });
  });
});
