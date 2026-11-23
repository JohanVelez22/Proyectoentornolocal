import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { catalogo, type VersionDisponible } from '../src/catalogo/catalogo';
import { Instalador } from '../src/catalogo/instalador';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Rutas } from '../src/rutas';
import { fetchFalso, type Ruta } from './catalogo-falso';
import { carpetaTemporal } from './temporales';

let rutas: Rutas;
const eventos = new Eventos<EventosNucleo>();

beforeEach(async () => {
  rutas = new Rutas(await carpetaTemporal('pel-huellas-'));
  await rutas.asegurar();
});

const EXE = Buffer.from('binario de cloudflared');
const URL_CF = 'https://github.com/cloudflare/cloudflared/releases/download/2026.11.2/cf.exe';
const ASSET = 'https://release-assets.githubusercontent.com/github-production-release-asset/1';
const h = (alg: string, b: Buffer = EXE) => createHash(alg).update(b).digest('hex');

const vCf = (o: Partial<VersionDisponible> = {}): VersionDisponible => ({
  servicio: 'cloudflared',
  version: '2026.11.2',
  rama: '2026.11',
  url: URL_CF,
  sha256: null,
  huella: null,
  formato: 'exe',
  ejecutable: 'cloudflared.exe',
  origen: 'vivo',
  ...o,
});

function instalador(rutasHttp: Record<string, Ruta>) {
  const ff = fetchFalso(rutasHttp);
  return { inst: new Instalador(rutas, eventos, ff.f, { esperasReintentoMs: [] }), ff };
}

const instalado = () => path.join(rutas.bin('cloudflared', '2026.11.2'), 'cloudflared.exe');

describe('Instalador: huellas', () => {
  it('SHA-512 correcto instala; incorrecto no deja nada', async () => {
    const bien = instalador({ [URL_CF]: EXE });
    await bien.inst.instalar(vCf({ huella: { algoritmo: 'sha512', valor: h('sha512') } }));
    expect(await readFile(instalado())).toEqual(EXE);

    rutas = new Rutas(await carpetaTemporal('pel-huellas-'));
    const mal = instalador({ [URL_CF]: EXE });
    await expect(
      mal.inst.instalar(vCf({ huella: { algoritmo: 'sha512', valor: 'f'.repeat(128) } })),
    ).rejects.toMatchObject({
      codigo: 'catalogo.huella_no_coincide',
      message: 'La descarga no coincide con la huella publicada',
    });
    expect(existsSync(instalado())).toBe(false);
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('sin huella y sin confirmar no descarga nada; confirmado instala', async () => {
    const { inst, ff } = instalador({ [URL_CF]: EXE });
    await expect(inst.instalar(vCf())).rejects.toMatchObject({
      codigo: 'catalogo.sin_huella',
      datos: { servicio: 'cloudflared', version: '2026.11.2' },
    });
    expect(ff.pedidas).toEqual([]);
    await inst.instalar(vCf(), { confirmarSinHuella: true });
    expect(await readFile(instalado())).toEqual(EXE);
  });

  it('MD5 pide confirmación; confirmado se verifica igual', async () => {
    const { inst, ff } = instalador({ [URL_CF]: EXE });
    const md5 = vCf({ huella: { algoritmo: 'md5', valor: h('md5') } });
    await expect(inst.instalar(md5)).rejects.toMatchObject({ codigo: 'catalogo.huella_debil' });
    expect(ff.pedidas).toEqual([]);
    await expect(
      inst.instalar(vCf({ huella: { algoritmo: 'md5', valor: '0'.repeat(32) } }), {
        confirmarSinHuella: true,
      }),
    ).rejects.toMatchObject({ codigo: 'catalogo.huella_no_coincide' });
    await inst.instalar(md5, { confirmarSinHuella: true });
    expect(existsSync(instalado())).toBe(true);
  });

  it('sigue la redirección de GitHub a release-assets.githubusercontent.com', async () => {
    const { inst, ff } = instalador({ [URL_CF]: { ir: ASSET }, [ASSET]: EXE });
    await inst.instalar(
      vCf({ sha256: h('sha256'), huella: { algoritmo: 'sha256', valor: h('sha256') } }),
    );
    expect(ff.pedidas).toEqual([URL_CF, ASSET]);
    expect(ff.inits.every((i) => i?.redirect === 'manual')).toBe(true);
    expect(await readFile(instalado())).toEqual(EXE);
  });

  it('una redirección a un host ajeno (o a http) se corta antes de pedirlo', async () => {
    for (const destino of [
      'https://evil.example/cf.exe',
      'http://release-assets.githubusercontent.com/x',
      'https://release-assets.githubusercontent.com.evil.example/x',
    ]) {
      const { inst, ff } = instalador({
        [URL_CF]: { ir: ASSET },
        [ASSET]: { ir: destino, estado: 307 },
        [destino]: EXE,
      });
      await expect(
        inst.instalar(
          vCf({ huella: { algoritmo: 'sha256', valor: h('sha256') }, sha256: h('sha256') }),
        ),
      ).rejects.toMatchObject({ codigo: 'catalogo.redireccion_ajena' });
      expect(ff.pedidas).toEqual([URL_CF, ASSET]);
      expect(existsSync(instalado())).toBe(false);
    }
  });

  it('más de 5 redirecciones se cortan', async () => {
    const saltos: Record<string, Ruta> = {};
    for (let i = 0; i < 7; i++) saltos[`${ASSET}${i}`] = { ir: `${ASSET}${i + 1}` };
    saltos[URL_CF] = { ir: `${ASSET}0` };
    const { inst } = instalador(saltos);
    await expect(
      inst.instalar(
        vCf({ huella: { algoritmo: 'sha256', valor: h('sha256') }, sha256: h('sha256') }),
      ),
    ).rejects.toMatchObject({ codigo: 'catalogo.demasiadas_redirecciones' });
  });

  it('una versión de la lista fija (misma URL) usa su SHA-256 y no pide confirmar', async () => {
    const fija = catalogo.cloudflared[0]!;
    const { inst, ff } = instalador({ [fija.url]: EXE });
    // Llega sin huella, pero la lista fija la tiene: se descarga y se compara con la fija
    // (estos bytes no son el binario real, así que no coincide; nunca pide confirmar).
    await expect(
      inst.instalar({ ...vCf(), version: fija.version, url: fija.url }),
    ).rejects.toMatchObject({ codigo: 'catalogo.huella_no_coincide' });
    expect(ff.pedidas).toEqual([fija.url]);
  });
});
