import { spawnSync } from 'node:child_process';
import { closeSync, openSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SALIDA_FIREWALL,
  TOPE_CUERPO_ELEVADO,
  scriptCargador,
  sha256Hex,
} from '../src/plataforma/firewallCambiosWin';
import { codificarComando } from '../src/plataforma/hostsAdmin';
import { hayPowerShell, rutaPowerShellWindows } from './soporte/parserPowerShell';
import { carpetaTemporal } from './temporales';

// D54b (segunda revisión de D57, M1): el cargador elevado no lee un cuerpo que sea un enlace
// (ReparsePoint) ni uno que pese más que el tope, y lo comprueba ANTES de leerlo.

describe('el cargador elevado rechaza enlaces y cuerpos desmesurados antes de leerlos', () => {
  const s = scriptCargador('C:\\Temp\\pel-fw-1.txt', 'a'.repeat(64));

  it('comprueba ReparsePoint y lee con UN FileStream (FileShare.Read): su Length y, como mucho, tope + 1', () => {
    expect(s).toContain('[IO.File]::GetAttributes($t)');
    expect(s).toContain('[IO.FileAttributes]::ReparsePoint');
    expect(s).toContain('[IO.FileShare]::Read');
    expect(s.split('[IO.FileStream]::new').length - 1).toBe(1);
    expect(s).toContain('$fs.Length -gt 1048576');
    expect(s).toContain('byte[] (1048576 + 1)');
    expect(s).not.toContain('ReadAllBytes');
    expect(s).not.toContain('FileInfo');
    expect(s).toContain(`exit ${SALIDA_FIREWALL.temporalEnlace}`);
    expect(s).toContain(`exit ${SALIDA_FIREWALL.temporalGrande}`);
    const leer = s.indexOf('$fs.Read(');
    expect(s.indexOf('ReparsePoint')).toBeLessThan(s.indexOf('FileStream'));
    expect(s.indexOf('$fs.Length -gt')).toBeLessThan(leer);
    expect(leer).toBeLessThan(s.indexOf('Get-HuellaWolf $b'));
    expect(s.indexOf('Get-HuellaWolf $b')).toBeLessThan(s.indexOf('[scriptblock]::Create'));
  });

  it('los códigos de salida nuevos no chocan con los demás', () => {
    const valores = Object.values(SALIDA_FIREWALL);
    expect(new Set(valores).size).toBe(valores.length);
  });

  describe.skipIf(process.platform !== 'win32' || !hayPowerShell())(
    'con PowerShell real, sin elevar',
    () => {
      const correr = (cargador: string) =>
        spawnSync(
          rutaPowerShellWindows(),
          ['-NoProfile', '-NonInteractive', '-EncodedCommand', codificarComando(cargador)],
          { encoding: 'utf8', windowsHide: true, timeout: 120_000 },
        );

      it('un cuerpo normal con su huella se ejecuta; con otra huella, no', async () => {
        const dir = await carpetaTemporal('pel-cargador-');
        const archivo = join(dir, 'cuerpo.txt');
        const cuerpo = 'exit 7';
        writeFileSync(archivo, cuerpo, 'utf8');
        expect(correr(scriptCargador(archivo, sha256Hex(cuerpo))).status).toBe(7);
        expect(correr(scriptCargador(archivo, 'f'.repeat(64))).status).toBe(
          SALIDA_FIREWALL.temporalAlterado,
        );
      });

      it('un cuerpo por encima del tope sale sin ejecutarse', async () => {
        const dir = await carpetaTemporal('pel-cargador-');
        const archivo = join(dir, 'grande.txt');
        const cuerpo = `exit 7\n#${'x'.repeat(TOPE_CUERPO_ELEVADO + 10)}`;
        writeFileSync(archivo, cuerpo, 'utf8');
        expect(correr(scriptCargador(archivo, sha256Hex(cuerpo))).status).toBe(
          SALIDA_FIREWALL.temporalGrande,
        );
      });

      it('un cuerpo justo en el tope se ejecuta y uno de un byte más, no', async () => {
        const dir = await carpetaTemporal('pel-cargador-');
        const relleno = (n: number): string => `exit 7
#${'x'.repeat(n - 8)}`;
        const justo = join(dir, 'justo.txt');
        writeFileSync(justo, relleno(TOPE_CUERPO_ELEVADO), 'utf8');
        expect(correr(scriptCargador(justo, sha256Hex(relleno(TOPE_CUERPO_ELEVADO)))).status).toBe(
          7,
        );
        const pasado = join(dir, 'pasado.txt');
        writeFileSync(pasado, relleno(TOPE_CUERPO_ELEVADO + 1), 'utf8');
        expect(
          correr(scriptCargador(pasado, sha256Hex(relleno(TOPE_CUERPO_ELEVADO + 1)))).status,
        ).toBe(SALIDA_FIREWALL.temporalGrande);
      });

      it('un archivo que otro proceso tiene abierto para escribir sale sin ejecutarse (FileShare.Read)', async () => {
        const dir = await carpetaTemporal('pel-cargador-');
        const archivo = join(dir, 'abierto.txt');
        writeFileSync(archivo, 'exit 7', 'utf8');
        const fd = openSync(archivo, 'r+');
        try {
          expect(correr(scriptCargador(archivo, sha256Hex('exit 7'))).status).toBe(
            SALIDA_FIREWALL.sinTemporal,
          );
        } finally {
          closeSync(fd);
        }
      });

      it('un enlace simbólico al cuerpo sale sin ejecutarse (se omite si no se puede crear)', async (ctx) => {
        const dir = await carpetaTemporal('pel-cargador-');
        const real = join(dir, 'real.txt');
        const enlace = join(dir, 'enlace.txt');
        const cuerpo = 'exit 7';
        writeFileSync(real, cuerpo, 'utf8');
        try {
          symlinkSync(real, enlace, 'file');
        } catch {
          // Sin privilegio para crear enlaces simbólicos en este equipo: se omite de forma explícita.
          ctx.skip();
          return;
        }
        expect(correr(scriptCargador(enlace, sha256Hex(cuerpo))).status).toBe(
          SALIDA_FIREWALL.temporalEnlace,
        );
      });
    },
  );
});
