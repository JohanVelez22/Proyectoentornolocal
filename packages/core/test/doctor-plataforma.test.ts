import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
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

  it('N1: una escritura en cola cuyo vencimiento ya pasó no abre UAC y da "tiempo"', async () => {
    const dir = await carpetaTemporal('pel-n1-');
    let soltar: () => void = () => undefined;
    const llamadas: string[][] = [];
    const ejecutor: Ejecutor = async (_c, args) => {
      llamadas.push(args);
      if (llamadas.length === 1) await new Promise<void>((r) => (soltar = r));
      return { codigo: 0, stdout: '', stderr: '' };
    };
    const p = new PlataformaWindows(ejecutor, undefined, { carpetaTemporal: dir });
    const a = p.detenerServicioSistema('W3SVC');
    const b = p.escribirComoAdmin(join(dir, 'hosts'), 'nuevo', {
      tiempoLimiteMs: 60_000,
      vencimientoUnixMs: Date.now() + 30,
    });
    await new Promise((r) => setTimeout(r, 80));
    soltar();
    await a;
    expect(await b).toEqual({ ok: false, motivo: 'tiempo' });
    expect(llamadas).toHaveLength(1);
  });

  it('N1: el plazo del UAC en cola no pasa del vencimiento pedido (se calcula al empezar)', async () => {
    const dir = await carpetaTemporal('pel-n1-');
    const plazos: (number | undefined)[] = [];
    let script = '';
    const ejecutor: Ejecutor = async (_c, args, o) => {
      plazos.push(o?.timeoutMs);
      script = elevado(args);
      return { codigo: SALIDA_COPIA.vencido, stdout: '', stderr: '' };
    };
    const p = new PlataformaWindows(ejecutor, undefined, { carpetaTemporal: dir });
    const antes = Date.now();
    await p.escribirComoAdmin(join(dir, 'hosts'), 'nuevo', {
      tiempoLimiteMs: 60_000,
      vencimientoUnixMs: antes + 5_000,
    });
    expect(plazos[0]).toBeLessThanOrEqual(5_000);
    expect(plazos[0]).toBeGreaterThan(0);
    const limite = Number(/ToUnixTimeMilliseconds\(\) -gt (\d+)/.exec(script)?.[1]);
    expect(limite).toBeLessThanOrEqual(antes + 5_000);
  });

  it('N3: detener un servicio con dependientes en marcha sale con 32 y un motivo claro (no los detiene)', async () => {
    const { llamadas, ejecutor } = grabar(0);
    await new PlataformaWindows(ejecutor).detenerServicioSistema('W3SVC');
    const s = elevado(llamadas[0]!.args);
    expect(s).toContain('DependentServices');
    const iDep = s.indexOf('DependentServices');
    expect(iDep).toBeGreaterThan(-1);
    expect(iDep).toBeLessThan(s.indexOf('.Stop()'));
    expect(s).toContain(`exit ${SALIDA_SERVICIO.dependientes}`);
    const r = await new PlataformaWindows(
      grabar(SALIDA_SERVICIO.dependientes).ejecutor,
    ).detenerServicioSistema('W3SVC');
    expect(r).toMatchObject({ ok: false, motivo: 'error', detalle: /dependen/ });
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
    expect(p.comandoManual({ tipo: 'instalar-build-tools' })).toBe(
      'winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --source winget --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"',
    );
    // Regla de la red local: un solo puerto, solo redes privadas, y nunca un puerto raro.
    expect(p.comandoManual({ tipo: 'regla-firewall-lan', puerto: 8100 })).toBe(
      "New-NetFirewallRule -DisplayName 'WolfCore Dev red local 8100' -Direction Inbound -Protocol TCP -LocalPort 8100 -Action Allow -Profile Private",
    );
    expect(() => p.comandoManual({ tipo: 'regla-firewall-lan', puerto: 0 })).toThrow(/no válido/);
    expect(() =>
      p.comandoManual({ tipo: 'regla-firewall-lan', puerto: '80; calc' as unknown as number }),
    ).toThrow(/no válido/);
  });

  it('raicesSistema: exporta las raíces de confianza por .NET (sin módulos) y devuelve solo PEM', async () => {
    const pem = '-----BEGIN CERTIFICATE-----\r\nQUJD\r\n-----END CERTIFICATE-----\r\n';
    const { llamadas, ejecutor } = grabar(0, `basura\r\n${pem}${pem.replace('QUJD', 'REVG')}`);
    const r = await new PlataformaWindows(ejecutor).raicesSistema();
    const s = directo(llamadas[0]!.args);
    expect(s).toContain('X509Store');
    expect(s).toContain("'Root'");
    expect(s).not.toMatch(/Get-ChildItem|Cert:/);
    expect(r).toBe(
      '-----BEGIN CERTIFICATE-----\nQUJD\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nREVG\n-----END CERTIFICATE-----\n',
    );
    await expect(new PlataformaWindows(grabar(1).ejecutor).raicesSistema()).rejects.toThrow();
  });

  it('firefoxEnUso: sin parent.lock o con uno que se puede abrir (cierre brusco), no está en uso', async () => {
    const dir = await carpetaTemporal('pel-ff-');
    const p = new PlataformaWindows(grabar().ejecutor);
    expect(await p.firefoxEnUso(dir)).toBe(false);
    await writeFile(join(dir, 'parent.lock'), '');
    expect(await p.firefoxEnUso(dir)).toBe(false);
  });

  it('comando manual de hosts: la ruta va con comillas seguras (también las tipográficas)', () => {
    const c = comandoManualPara('C:\\x‘y\\hosts', 'a');
    expect(c).toContain("$r = 'C:\\x‘‘y\\hosts'");
  });
});

describe('Plataforma D5: enlazador MSVC', () => {
  const entorno = { 'ProgramFiles(x86)': 'C:\\PF86' };

  it('con vswhere y las herramientas de C++ para x64: true', async () => {
    const { llamadas, ejecutor } = grabar(0, 'C:\\BuildTools\r\n');
    const p = new PlataformaWindows(ejecutor, undefined, { entorno, existeRuta: () => true });
    expect(await p.enlazadorMsvc()).toBe(true);
    expect(llamadas[0]!.cmd).toBe('C:\\PF86\\Microsoft Visual Studio\\Installer\\vswhere.exe');
    expect(llamadas[0]!.args).toContain('Microsoft.VisualStudio.Component.VC.Tools.x86.x64');
  });

  it('sin vswhere, sin salida o con error: false (y sin ejecutar nada si falta vswhere)', async () => {
    const a = grabar(0, '');
    expect(
      await new PlataformaWindows(a.ejecutor, undefined, {
        entorno,
        existeRuta: () => true,
      }).enlazadorMsvc(),
    ).toBe(false);
    const b = grabar(1, 'C:\\x');
    expect(
      await new PlataformaWindows(b.ejecutor, undefined, {
        entorno,
        existeRuta: () => true,
      }).enlazadorMsvc(),
    ).toBe(false);
    const c = grabar(0, 'C:\\x');
    expect(
      await new PlataformaWindows(c.ejecutor, undefined, {
        entorno,
        existeRuta: () => false,
      }).enlazadorMsvc(),
    ).toBe(false);
    expect(c.llamadas).toEqual([]);
    const roto: Ejecutor = async () => {
      throw new Error('no arranca');
    };
    expect(
      await new PlataformaWindows(roto, undefined, {
        entorno,
        existeRuta: () => true,
      }).enlazadorMsvc(),
    ).toBe(false);
  });
});

describe('Plataforma D5: entrada de desinstalación de rustup', () => {
  const datos = 'C:\\Users\\ana\\AppData\\Local\\WolfCoreDev';

  it('ausente: lee y no borra nada', async () => {
    const { llamadas, ejecutor } = grabar(0, 'AUSENTE');
    expect(await new PlataformaWindows(ejecutor).limpiarEntradaRustup(datos)).toBe('ausente');
    expect(llamadas).toHaveLength(1);
  });

  it('ajena: no ejecuta el borrado', async () => {
    const { llamadas, ejecutor } = grabar(
      0,
      'U:"C:\\Users\\ana\\.cargo\\bin\\rustup.exe" self uninstall',
    );
    expect(await new PlataformaWindows(ejecutor).limpiarEntradaRustup(datos)).toBe('ajena');
    expect(llamadas).toHaveLength(1);
  });

  it('nuestra: borra solo la clave de Rustup del usuario', async () => {
    const { llamadas, ejecutor } = grabar(
      0,
      `U:"${datos}\\bin\\rust\\cargo\\bin\\rustup.exe" self uninstall`,
    );
    expect(await new PlataformaWindows(ejecutor).limpiarEntradaRustup(datos)).toBe('quitada');
    expect(llamadas).toHaveLength(2);
    expect(directo(llamadas[0]!.args)).toContain(
      'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Rustup',
    );
    const borrar = directo(llamadas[1]!.args);
    expect(borrar).toContain('Remove-Item');
    expect(borrar).toContain('\\Uninstall\\Rustup');
  });
});
