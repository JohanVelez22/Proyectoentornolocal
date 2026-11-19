import { describe, expect, it } from 'vitest';
import { comandoManualPara } from '../src/hosts/hosts';
import { interpretarAntivirus } from '../src/plataforma/diagnosticoWin';
import { SALIDA_COPIA, SALIDA_SERVICIO } from '../src/plataforma/hostsAdmin';
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
    ).toEqual({ activo: true, excluida: true });
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

  it('detenerServicioSistema: ServiceController elevado, espera STOPPED con plazo; nombres raros no', async () => {
    const { llamadas, ejecutor } = grabar(0);
    const p = new PlataformaWindows(ejecutor);
    expect(await p.detenerServicioSistema('W3SVC')).toEqual({ ok: true });
    const s = elevado(llamadas[0]!.args);
    expect(s).toContain("[ServiceProcess.ServiceController]::new('W3SVC')");
    expect(s).toMatch(
      /WaitForStatus\(\[ServiceProcess\.ServiceControllerStatus\]::Stopped, \[TimeSpan\]::FromSeconds\(\d+\)\)/,
    );
    expect(s).toContain(`exit ${SALIDA_SERVICIO.plazo}`);
    expect(llamadas[0]!.args.join(' ')).toContain("$i.Verb = 'runas'");
    await expect(p.detenerServicioSistema("W3SVC'; rm x")).rejects.toThrow(/no válido/);
    expect(llamadas).toHaveLength(1);
  });

  it('códigos propios: UAC rechazado = cancelado; plazo y fallo del servicio = error con detalle', async () => {
    const con = (c: number) =>
      new PlataformaWindows(grabar(c).ejecutor).detenerServicioSistema('W3SVC');
    expect(await con(SALIDA_COPIA.cancelado)).toEqual({ ok: false, motivo: 'cancelado' });
    expect(await con(SALIDA_SERVICIO.plazo)).toMatchObject({
      ok: false,
      motivo: 'error',
      detalle: /a tiempo/,
    });
    expect(await con(SALIDA_SERVICIO.fallo)).toMatchObject({
      ok: false,
      motivo: 'error',
      detalle: /no se pudo detener/,
    });
    expect(await con(1)).toMatchObject({ ok: false, motivo: 'error' });
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

  it('las elevaciones van de a una (un solo UAC a la vez entre hosts y servicios)', async () => {
    let soltar: () => void = () => undefined;
    let abiertas = 0;
    let maximo = 0;
    const ejecutor: Ejecutor = async () => {
      abiertas++;
      maximo = Math.max(maximo, abiertas);
      await new Promise<void>((r) => (soltar = r));
      abiertas--;
      return { codigo: 0, stdout: '', stderr: '' };
    };
    const p = new PlataformaWindows(ejecutor);
    const a = p.detenerServicioSistema('W3SVC');
    const b = p.quitarSoloLecturaHosts();
    for (let i = 0; i < 2; i++) {
      await new Promise((r) => setTimeout(r, 20));
      soltar();
    }
    await Promise.all([a, b]);
    expect(maximo).toBe(1);
  });

  it('instalarVcRedist: prefiere el winget de WindowsApps, con --source winget; sin winget, error claro', async () => {
    const { llamadas, ejecutor } = grabar(0);
    const apps = 'C:\\Users\\Ana\\AppData\\Local\\Microsoft\\WindowsApps\\winget.exe';
    const p = new PlataformaWindows(ejecutor, undefined, {
      entorno: { PATH: 'C:\\falso', LOCALAPPDATA: 'C:\\Users\\Ana\\AppData\\Local' },
      existeRuta: (r) => [apps, 'C:\\falso\\winget.exe'].includes(r),
    });
    expect(await p.instalarVcRedist()).toEqual({ ok: true });
    expect(llamadas[0]!.cmd).toBe(apps);
    expect(llamadas[0]!.args).toEqual(
      expect.arrayContaining(['install', '--id', 'Microsoft.VCRedist.2015+.x64', '--exact']),
    );
    expect(llamadas[0]!.args.join(' ')).toContain('--source winget');
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

  it('comandoManual: textos para la consola de administrador, con comillas seguras', () => {
    const p = new PlataformaWindows(grabar().ejecutor);
    expect(p.comandoManual({ tipo: 'liberar-rangos' })).toMatch(/net stop winnat/);
    expect(p.comandoManual({ tipo: 'exclusion-antivirus', carpeta: "C:\\a'b‘c’d" })).toBe(
      "Add-MpPreference -ExclusionPath 'C:\\a''b‘‘c’’d'",
    );
    const sl = p.comandoManual({ tipo: 'quitar-solo-lectura-hosts' });
    expect(sl).toMatch(/attrib -R/);
    expect(sl).toContain('[Environment]::SystemDirectory');
    const iis = p.comandoManual({ tipo: 'detener-servicio', nombre: 'W3SVC' });
    expect(iis).toBe("Stop-Service -Name 'W3SVC'");
    expect(() => p.comandoManual({ tipo: 'detener-servicio', nombre: "x'; rm" })).toThrow(
      /no válido/,
    );
    expect(p.comandoManual({ tipo: 'instalar-vcredist' })).toMatch(
      /winget install --id Microsoft\.VCRedist\.2015\+\.x64 --exact --source winget/,
    );
  });

  it('comando manual de hosts: la ruta va con comillas seguras (también las tipográficas)', () => {
    const c = comandoManualPara('C:\\x‘y\\hosts', 'a');
    expect(c).toContain("$r = 'C:\\x‘‘y\\hosts'");
  });
});
