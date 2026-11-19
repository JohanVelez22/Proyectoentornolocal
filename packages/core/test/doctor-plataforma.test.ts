import { describe, expect, it } from 'vitest';
import { interpretarAntivirus } from '../src/plataforma/diagnosticoWin';
import { SALIDA_COPIA } from '../src/plataforma/hostsAdmin';
import type { Ejecutor } from '../src/plataforma/tipos';
import { PlataformaWindows } from '../src/plataforma/win';

/** Script elevado (base64 de -EncodedCommand dentro de la PowerShell exterior). */
const elevado = (args: string[]): string => {
  const b64 = /-EncodedCommand ([A-Za-z0-9+/=]+)/.exec(args.join(' '))?.[1] ?? '';
  return Buffer.from(b64, 'base64').toString('utf16le');
};
/** Script de una PowerShell no elevada (`-EncodedCommand` como argumento propio). */
const directo = (args: string[]): string =>
  Buffer.from(args[args.indexOf('-EncodedCommand') + 1] ?? '', 'base64').toString('utf16le');

const grabar = (codigo = 0, stdout = '') => {
  const llamadas: { cmd: string; args: string[] }[] = [];
  const ejecutor: Ejecutor = async (cmd, args) => {
    llamadas.push({ cmd, args });
    return { codigo, stdout, stderr: '' };
  };
  return { llamadas, ejecutor };
};

describe('Plataforma: capacidades del Doctor', () => {
  it('interpretarAntivirus: activo, exclusión que cubre la carpeta, sin permiso para leer', () => {
    const carpeta = 'C:\\Users\\Ana\\AppData\\Local\\WolfCoreDev';
    expect(
      interpretarAntivirus('activo=1\r\nexcl=C:\\Users\\Ana\\AppData\\Local\\\r\n', carpeta),
    ).toEqual({
      activo: true,
      excluida: true,
    });
    expect(interpretarAntivirus('activo=1\nexcl=D:\\otra\n', carpeta)).toEqual({
      activo: true,
      excluida: false,
    });
    expect(interpretarAntivirus('activo=1\n', carpeta)).toEqual({ activo: true, excluida: false });
    expect(
      interpretarAntivirus(
        'activo=1\nexcl=N/A: Must be an administrator to view exclusions\n',
        carpeta,
      ),
    ).toEqual({ activo: true, excluida: null });
    expect(interpretarAntivirus('activo=0\n', carpeta)).toEqual({ activo: false, excluida: false });
    expect(interpretarAntivirus('basura', carpeta)).toBeNull();
    // Una exclusión con prefijo parecido no cubre la carpeta.
    expect(
      interpretarAntivirus('activo=1\nexcl=C:\\Users\\Ana\\AppData\\Local\\Wolf\n', carpeta),
    ).toEqual({ activo: true, excluida: false });
  });

  it('detenerServicioSistema: sc.exe stop por la API, elevado; nombres raros se rechazan', async () => {
    const { llamadas, ejecutor } = grabar(0);
    const p = new PlataformaWindows(ejecutor);
    expect(await p.detenerServicioSistema('W3SVC')).toEqual({ ok: true });
    const s = elevado(llamadas[0]!.args);
    expect(s).toContain("[IO.Path]::Combine([Environment]::SystemDirectory, 'sc.exe')");
    expect(s).toMatch(/\) stop 'W3SVC'/);
    expect(llamadas[0]!.args.join(' ')).toContain("$i.Verb = 'runas'");
    await expect(p.detenerServicioSistema("W3SVC'; rm x")).rejects.toThrow(/no válido/);
    expect(llamadas).toHaveLength(1);
  });

  it('una elevación rechazada (salida 10) es "cancelado"; otro código es error', async () => {
    const p = new PlataformaWindows(grabar(SALIDA_COPIA.cancelado).ejecutor);
    expect(await p.detenerServicioSistema('W3SVC')).toEqual({ ok: false, motivo: 'cancelado' });
    const q = new PlataformaWindows(grabar(1062).ejecutor);
    expect(await q.detenerServicioSistema('W3SVC')).toMatchObject({ ok: false, motivo: 'error' });
  });

  it('quitarSoloLecturaHosts: el script elevado ubica hosts con la API y quita solo ese atributo', async () => {
    const { llamadas, ejecutor } = grabar(0);
    expect(await new PlataformaWindows(ejecutor).quitarSoloLecturaHosts()).toEqual({ ok: true });
    const s = elevado(llamadas[0]!.args);
    expect(s).toContain(
      "[IO.Path]::Combine([Environment]::SystemDirectory, 'drivers', 'etc', 'hosts')",
    );
    expect(s).toContain('-bnot [IO.FileAttributes]::ReadOnly');
    expect(s).not.toMatch(/SystemRoot/i);
  });

  it('instalarVcRedist: winget con el id exacto; sin winget, error claro', async () => {
    const { llamadas, ejecutor } = grabar(0);
    const p = new PlataformaWindows(ejecutor, undefined, {
      entorno: { PATH: 'C:\\winget' },
      existeRuta: (r) => r.toLowerCase() === 'c:\\winget\\winget.exe',
    });
    expect(await p.instalarVcRedist()).toEqual({ ok: true });
    expect(llamadas[0]!.cmd.toLowerCase()).toBe('c:\\winget\\winget.exe');
    expect(llamadas[0]!.args).toEqual(
      expect.arrayContaining(['install', '--id', 'Microsoft.VCRedist.2015+.x64', '--exact']),
    );
    const sin = new PlataformaWindows(grabar(0).ejecutor, undefined, {
      entorno: { PATH: '' },
      existeRuta: () => false,
    });
    expect(await sin.instalarVcRedist()).toMatchObject({ ok: false, detalle: /winget/ });
  });

  it('antivirus: lee Defender por PowerShell y lo interpreta; si falla, null', async () => {
    const { llamadas, ejecutor } = grabar(0, 'activo=1\nexcl=C:\\datos\n');
    const p = new PlataformaWindows(ejecutor);
    expect(await p.antivirus('C:\\datos\\WolfCoreDev')).toEqual({ activo: true, excluida: true });
    expect(directo(llamadas[0]!.args)).toContain('Get-MpComputerStatus');
    expect(await new PlataformaWindows(grabar(1).ejecutor).antivirus('C:\\x')).toBeNull();
  });

  it('comandoManual: textos para la consola de administrador', () => {
    const p = new PlataformaWindows(grabar().ejecutor);
    expect(p.comandoManual({ tipo: 'liberar-rangos' })).toMatch(/net stop winnat/);
    expect(p.comandoManual({ tipo: 'exclusion-antivirus', carpeta: "C:\\a'b" })).toBe(
      "Add-MpPreference -ExclusionPath 'C:\\a''b'",
    );
    expect(p.comandoManual({ tipo: 'quitar-solo-lectura-hosts' })).toMatch(/attrib -R/);
    expect(p.comandoManual({ tipo: 'detener-servicio', nombre: 'W3SVC' })).toMatch(
      /Stop-Service -Name W3SVC/,
    );
    expect(p.comandoManual({ tipo: 'instalar-vcredist' })).toMatch(
      /winget install --id Microsoft\.VCRedist\.2015\+\.x64/,
    );
  });
});
