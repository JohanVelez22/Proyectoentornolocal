import { evidenciaPlana } from './evidencia-plana';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { Doctor, type DepsDoctor, type Hallazgo } from '../src/doctor/doctor';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
  cuerpoQuitarReglas,
  cuerpoRestaurarReglas,
  idRegistro,
  interpretarAlmacen,
  interpretarReglasExportadas,
  scriptCargador,
  scriptExportarReglas,
  SCRIPT_LEER_ALMACEN,
  sha256Hex,
  type ReglaExportada,
} from '../src/plataforma/firewallCambiosWin';
import { interpretarReglasEntrada, SCRIPT_REGLAS_ENTRADA } from '../src/plataforma/firewallWin';

/** Ronda 4 de D46 (N6 a N10). Todo con texto de scripts y cortafuegos simulado: nada real. */

const UTF8 = '[Console]::OutputEncoding = [Text.Encoding]::UTF8';
const base = {
  id: idRegistro('{A-1}'),
  nombre: '{A-1}',
  programa: 'C:\\Datos\\bin\\nginx.exe',
  raiz: 'C:\\Datos',
  tipo: 'propia' as const,
  temporal: 'C:\\Temp',
};
const restaurar = {
  id: base.id,
  sha256: 'a'.repeat(64),
  raiz: base.raiz,
  tipo: 'propia' as const,
  temporal: base.temporal,
};

describe('N6: la salida de los scripts se fija en UTF-8 (la página OEM 850 rompía acentos y €)', () => {
  it('la línea está al principio de todos los scripts que devuelven texto a Node', () => {
    const scripts: Record<string, string> = {
      'lectura de la copia': SCRIPT_LEER_ALMACEN,
      'exportar reglas': scriptExportarReglas(['{A-1}']),
      'listado de reglas': SCRIPT_REGLAS_ENTRADA,
      quitar: cuerpoQuitarReglas([base], null),
      restaurar: cuerpoRestaurarReglas([restaurar], null),
      cargador: scriptCargador('C:\\Temp\\x.txt', 'a'.repeat(64)),
    };
    for (const [nombre, s] of Object.entries(scripts)) {
      const i = s.indexOf(UTF8);
      expect(i, nombre).toBeGreaterThanOrEqual(0);
      // Antes de la primera salida de texto.
      const salida = s.indexOf('WriteLine');
      if (salida >= 0) expect(i, nombre).toBeLessThan(salida);
    }
  });

  const hostil = 'Aplicación José €';
  const programa = 'C:/Users/José/Aplicación €/bin/nginx.exe';

  it('«José» y «Aplicación €» llegan intactos por la lectura de la copia protegida', () => {
    const regla: ReglaExportada = {
      nombre: `{J-1} ${hostil}`,
      nombreVisible: hostil,
      descripcion: `Descripción: ${hostil}`,
      habilitada: true,
      perfil: 'Private',
      direccion: 'Inbound',
      accion: 'Allow',
      programa,
      protocolo: 'TCP',
      puertoLocal: ['80'],
      puertoRemoto: ['Any'],
      direccionLocal: ['Any'],
      direccionRemota: ['LocalSubnet'],
    };
    const texto = JSON.stringify(regla);
    const [r] = interpretarAlmacen(`${idRegistro(regla.nombre)} ${texto}`);
    expect(r!.regla).toEqual(regla);
    // La huella es la del texto UTF-8, la misma que calcula el script elevado.
    expect(r!.sha256).toBe(sha256Hex(Buffer.from(texto, 'utf8')));
    expect(interpretarReglasExportadas(texto)[0]!.programa).toBe(programa);
  });

  it('«José» y «Aplicación €» llegan intactos por el listado de reglas', () => {
    const [r] = interpretarReglasEntrada(
      JSON.stringify({
        nombre: `{J-2} ${hostil}`,
        nombreVisible: hostil,
        perfil: 'Public, Private',
        programa,
        protocolo: 'Any',
        puertoLocal: ['Any'],
        direccionRemota: ['Any'],
      }),
    );
    expect(r).toMatchObject({ nombre: `{J-2} ${hostil}`, nombreVisible: hostil, programa });
  });
});

describe('N6: quitar y restaurar con una ruta y un nombre con acentos (cortafuegos simulado)', () => {
  let dir: string;
  let datos: string;
  let plat: PlataformaFalsa;
  const deps = (): DepsDoctor =>
    ({
      plataforma: plat,
      carpetaDatos: datos,
      carpetaRespaldos: join(datos, 'etc', 'respaldos'),
      carpetaTemporal: join(dir, 'tmp'),
    }) as unknown as DepsDoctor;

  beforeEach(async () => {
    dir = await carpetaTemporal('pel-d46-r4-');
    datos = join(dir, 'José', 'Aplicación €');
    await mkdir(join(dir, 'tmp'), { recursive: true });
    plat = new PlataformaFalsa();
  });

  it('la regla se ofrece, se quita y se restaura sin que la huella falle', async () => {
    const programa = join(datos, 'bin', 'nginx', 'nginx.exe');
    plat.reglasEntrada = {
      ok: true,
      reglas: [
        { nombre: '{J-1} Aplicación €', nombreVisible: 'José', perfil: 'Private', programa },
      ],
    };
    plat.reglasFirewallDetalle.set('{J-1} Aplicación €', { descripcion: 'Descripción: José €' });
    const d = new Doctor(deps());
    const h = (await d.revisar(['firewall'])).find((x) => x.id === 'firewall:reglas-entrada')!;
    expect(evidenciaPlana(h.evidencia)).toContain('José');
    expect(await d.reparar(h.id, true)).toEqual({ ok: true });
    const q = d.ultimo().find((x: Hallazgo) => x.id === 'firewall:quitadas')!;
    expect(evidenciaPlana(q.evidencia)).toContain('Aplicación €');
    expect(await d.reparar(q.id, true)).toEqual({ ok: true });
    expect(plat.reglasEntrada.reglas.map((r) => r.nombre)).toEqual(['{J-1} Aplicación €']);
  });
});

describe('N7: los bits genéricos cuentan como derechos peligrosos', () => {
  it('GENERIC_ALL (0x10000000) y GENERIC_WRITE (0x40000000) entran, como entero', () => {
    for (const s of [cuerpoQuitarReglas([base], null), cuerpoRestaurarReglas([restaurar], null)]) {
      expect(s).toContain("TakeOwnership' -bor 0x50000000");
      // Como entero: un enum de PowerShell no admite esos bits sin nombre.
      expect(s).toContain('$derechosPeligrosos = [int][Security.AccessControl.RegistryRights]');
      expect(s).toContain('[int]$r.RegistryRights -band $derechosPeligrosos');
      // Si la máscara no se calculó, nada es de confianza.
      expect(s).toContain('if ($derechosPeligrosos -eq 0) { return $false }');
    }
  });
});

describe('N8: la clave se crea con su seguridad en una sola llamada', () => {
  it('CreateSubKey(ruta, permiso, seguridad) con la seguridad ya armada, y sin reescribir la ACL después', () => {
    const s = cuerpoQuitarReglas([base], null);
    const armar = s.indexOf('$seg = [Security.AccessControl.RegistrySecurity]::new()');
    const protegida = s.indexOf('$seg.SetAccessRuleProtection($true, $false)');
    const usuarios = s.indexOf('$sidUsuarios), [Security.AccessControl.RegistryRights]::ReadKey');
    const crear = s.indexOf(
      '$hklm.CreateSubKey($rutaClave, [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, $seg)',
    );
    expect(armar).toBeGreaterThan(0);
    expect(protegida).toBeGreaterThan(armar);
    expect(usuarios).toBeGreaterThan(protegida);
    expect(crear).toBeGreaterThan(usuarios);
    // Ya no se crea con la ACL heredada para cambiarla después.
    expect(s).not.toContain('$k.SetAccessControl');
    expect(s).not.toContain('$hklm.CreateSubKey($rutaClave).Dispose()');
  });

  it('también cuentan las ACE que solo se heredan (no hay excepción por InheritOnly)', () => {
    for (const s of [cuerpoQuitarReglas([base], null), cuerpoRestaurarReglas([restaurar], null)]) {
      expect(s).not.toContain('InheritOnly');
    }
  });

  it('la clave superior se comprueba igual que la propia', () => {
    const s = cuerpoQuitarReglas([base], null);
    expect(s).toContain('$baseBien = Test-ClaveWolf $base');
    expect(s).toContain('(-not $baseBien) -or (-not (Test-ClaveWolf $k))');
  });
});

describe('N9: siempre la vista de 64 bits del registro', () => {
  it('la lectura y los dos scripts elevados usan OpenBaseKey(LocalMachine, Registry64)', () => {
    const vista =
      '[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64)';
    for (const s of [
      SCRIPT_LEER_ALMACEN,
      cuerpoQuitarReglas([base], null),
      cuerpoRestaurarReglas([restaurar], null),
    ]) {
      expect(s).toContain(vista);
      expect(s).not.toContain('[Microsoft.Win32.Registry]::LocalMachine');
    }
  });
});

describe('N10: restaurar sin la clave es «sin cambios», no «almacén inseguro»', () => {
  it('el script sale con 41 (nada que hacer) antes de intentar abrir la clave como de confianza', () => {
    const s = cuerpoRestaurarReglas([restaurar], null);
    const falta = s.indexOf('if ($null -eq $existe) { exit 41 }');
    const abrir = s.indexOf('Open-ClaveWolf $false');
    const inseguro = s.indexOf('exit 21');
    expect(falta).toBeGreaterThan(0);
    expect(abrir).toBeGreaterThan(falta);
    expect(inseguro).toBeGreaterThan(abrir);
  });

  it('si la copia ya no está al aplicar, el resultado es «sin cambios» y no se crea nada', async () => {
    const dir = await carpetaTemporal('pel-d46-r4-');
    const datos = join(dir, 'WolfCoreDev');
    await mkdir(join(dir, 'tmp'), { recursive: true });
    const plat = new PlataformaFalsa();
    const nginx = join(datos, 'bin', 'nginx', 'nginx.exe');
    plat.reglasEntrada = {
      ok: true,
      reglas: [
        { nombre: '{A-1}', nombreVisible: 'nginx', perfil: 'Public, Private', programa: nginx },
      ],
    };
    const d = new Doctor({
      plataforma: plat,
      carpetaDatos: datos,
      carpetaRespaldos: join(datos, 'etc', 'respaldos'),
      carpetaTemporal: join(dir, 'tmp'),
    } as unknown as DepsDoctor);
    const hs = await d.revisar(['firewall']);
    await d.reparar(hs.find((x) => x.id === 'firewall:reglas-entrada')!.id, true);
    const q = d.ultimo().find((x) => x.id === 'firewall:quitadas')!;
    // Alguien borra la clave entre la revisión y la aplicación.
    plat.almacenProtegido.clear();
    expect(await d.reparar(q.id, true)).toEqual({
      ok: false,
      codigo: 'doctor.firewall_sin_cambios',
    });
    expect(plat.pedidosRestaurarReglas).toEqual([]);
    expect(plat.reglasEntrada.reglas).toEqual([]);
  });
});
