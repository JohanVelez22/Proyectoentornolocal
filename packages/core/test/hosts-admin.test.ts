import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import {
  codificarComando,
  PREFIJO_TEMPORAL_HOSTS,
  SALIDA_COPIA,
  scriptCopiaHosts,
  sha256,
} from '../src/plataforma/hostsAdmin';
import type { Ejecutor } from '../src/plataforma/tipos';
import { PlataformaWindows } from '../src/plataforma/win';

const scriptDe = (args: string[]): string => {
  const b64 = /'-EncodedCommand','([A-Za-z0-9+/=]+)'/.exec(args.join(' '))?.[1] ?? '';
  return Buffer.from(b64, 'base64').toString('utf16le');
};

describe('escritura elevada de hosts: el script se verifica a sí mismo (seguridad)', () => {
  it('incrusta el límite UTC, la huella del temporal y la del hosts leído', async () => {
    const dir = await carpetaTemporal('pel-adm-');
    const destino = join(dir, 'hosts');
    await writeFile(destino, 'viejo');
    let script = '';
    const p = new PlataformaWindows(
      async (_c, args) => {
        script = scriptDe(args);
        return { codigo: SALIDA_COPIA.hostsCambiado, stdout: '', stderr: '' };
      },
      undefined,
      { carpetaTemporal: dir },
    );
    const antes = Date.now();
    const r = await p.escribirComoAdmin(destino, 'nuevo', {
      tiempoLimiteMs: 60_000,
      hashPrevio: sha256('viejo'),
    });
    expect(r).toMatchObject({ ok: false, motivo: 'error', detalle: /hosts cambió/ });
    const limite = Number(/ToUnixTimeMilliseconds\(\) -gt (\d+)/.exec(script)?.[1]);
    expect(limite).toBeGreaterThanOrEqual(antes + 60_000);
    expect(limite).toBeLessThan(antes + 70_000);
    expect(script).toContain(`'${sha256('nuevo')}'`);
    expect(script).toContain(`'${sha256('viejo')}'`);
    expect(await readFile(destino, 'utf8')).toBe('viejo');
  });

  it('cada código de salida tiene su motivo', async () => {
    const dir = await carpetaTemporal('pel-adm-');
    const destino = join(dir, 'hosts');
    await writeFile(destino, 'viejo');
    const con = (codigo: number) =>
      new PlataformaWindows(async () => ({ codigo, stdout: '', stderr: '' }), undefined, {
        carpetaTemporal: dir,
      }).escribirComoAdmin(destino, 'nuevo');
    expect(await con(SALIDA_COPIA.vencido)).toEqual({ ok: false, motivo: 'tiempo' });
    expect(await con(SALIDA_COPIA.sinTemporal)).toMatchObject({ motivo: 'error' });
    expect(await con(SALIDA_COPIA.temporalAlterado)).toMatchObject({
      motivo: 'error',
      detalle: /temporal cambió/,
    });
  });

  it('cancelarEscriturasAdmin corta la PowerShell que espera el UAC', async () => {
    const dir = await carpetaTemporal('pel-adm-');
    const destino = join(dir, 'hosts');
    await writeFile(destino, 'viejo');
    const ejecutor: Ejecutor = (_c, _a, o) =>
      new Promise((resolve) => {
        o?.senal?.addEventListener('abort', () =>
          resolve({ codigo: 1, stdout: '', stderr: 'abortado' }),
        );
      });
    const p = new PlataformaWindows(ejecutor, undefined, { carpetaTemporal: dir });
    const escritura = p.escribirComoAdmin(destino, 'nuevo', { tiempoLimiteMs: 60_000 });
    await new Promise((r) => setTimeout(r, 10));
    p.cancelarEscriturasAdmin();
    expect(await escritura).toEqual({ ok: false, motivo: 'tiempo' });
    expect(await readFile(destino, 'utf8')).toBe('viejo');
    expect((await readdir(dir)).filter((n) => n.startsWith(PREFIJO_TEMPORAL_HOSTS))).toEqual([]);
  });

  it('limpiarTemporalesAdmin borra los temporales de otras ejecuciones, no los propios', async () => {
    const dir = await carpetaTemporal('pel-adm-');
    const viejo = join(dir, `${PREFIJO_TEMPORAL_HOSTS}999999-1-abcd1234.txt`);
    const propio = join(dir, `${PREFIJO_TEMPORAL_HOSTS}${process.pid}-1-abcd1234.txt`);
    const ajeno = join(dir, 'otra-cosa.txt');
    for (const f of [viejo, propio, ajeno]) await writeFile(f, 'x');
    await new PlataformaWindows(undefined, undefined, {
      carpetaTemporal: dir,
    }).limpiarTemporalesAdmin();
    expect(existsSync(viejo)).toBe(false);
    expect(existsSync(propio)).toBe(true);
    expect(existsSync(ajeno)).toBe(true);
  });
});

/** El script real, corrido SIN elevar sobre archivos temporales (nunca el hosts real). */
describe.skipIf(process.platform !== 'win32')('scriptCopiaHosts real (solo Windows)', () => {
  const correr = (script: string): number => {
    const r = spawnSync(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', codificarComando(script)],
      { windowsHide: true, encoding: 'utf8', timeout: 60_000 },
    );
    return r.status ?? -1;
  };
  const preparar = async () => {
    const dir = await carpetaTemporal('pel-script-');
    const temporal = join(dir, "pel-hosts-1-1-a'b.txt");
    const destino = join(dir, 'hosts');
    await writeFile(temporal, 'nuevo');
    await writeFile(destino, 'viejo');
    return {
      temporal,
      destino,
      base: {
        temporal,
        destino,
        limiteUnixMs: Date.now() + 60_000,
        hashTemporal: sha256('nuevo'),
        hashPrevio: sha256('viejo'),
      },
    };
  };

  it('copia si todo cuadra', async () => {
    const { destino, base } = await preparar();
    expect(correr(scriptCopiaHosts(base))).toBe(SALIDA_COPIA.ok);
    expect(await readFile(destino, 'utf8')).toBe('nuevo');
  }, 60_000);

  it('aceptado tarde con el temporal todavía ahí (no se pudo borrar): no copia', async () => {
    const { destino, temporal, base } = await preparar();
    const codigo = correr(scriptCopiaHosts({ ...base, limiteUnixMs: Date.now() - 1 }));
    expect(codigo).toBe(SALIDA_COPIA.vencido);
    expect(existsSync(temporal)).toBe(true);
    expect(await readFile(destino, 'utf8')).toBe('viejo');
  }, 60_000);

  it('temporal alterado o hosts cambiado: no copia', async () => {
    const a = await preparar();
    await writeFile(a.temporal, 'otra cosa');
    expect(correr(scriptCopiaHosts(a.base))).toBe(SALIDA_COPIA.temporalAlterado);
    expect(await readFile(a.destino, 'utf8')).toBe('viejo');

    const b = await preparar();
    await writeFile(b.destino, 'lo cambió otro programa');
    expect(correr(scriptCopiaHosts(b.base))).toBe(SALIDA_COPIA.hostsCambiado);
    expect(await readFile(b.destino, 'utf8')).toBe('lo cambió otro programa');
  }, 60_000);
});
