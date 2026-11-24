import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { catalogo, type VersionDisponible } from '../src/catalogo/catalogo';
import { Instalador } from '../src/catalogo/instalador';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Rutas } from '../src/rutas';
import { leerAnillo } from '../src/catalogo/pgp/anillos';
import { fetchFalso, type Ruta } from './catalogo-falso';
import { armar, clavePublica, firmar, nuevaClave } from './pgp-firmante';
import { carpetaTemporal } from './temporales';
import { zip } from './zip-prueba';

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

describe('Instalador: firmas PGP (D10)', () => {
  const T0 = 1_700_000_000;
  const clave = nuevaClave('ed25519', T0);
  const ajena = nuevaClave('ed25519', T0);
  const ANILLO = leerAnillo(clavePublica(clave));
  const ahora = () => new Date((T0 + 3600) * 1000);
  const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

  function firmado(rutasHttp: Record<string, Ruta>) {
    const ff = fetchFalso(rutasHttp);
    const inst = new Instalador(rutas, eventos, ff.f, {
      esperasReintentoMs: [],
      anillos: () => ANILLO,
      ahora,
    });
    return { inst, ff };
  }

  const sinRastros = async (servicio: string, version: string) => {
    expect(existsSync(rutas.bin(servicio, version))).toBe(false);
    expect(await readdir(rutas.tmp()).catch(() => [])).toEqual([]);
  };

  // ---- Node: SHASUMS256.txt firmado
  const BASE_NODE = 'https://nodejs.org/dist/v24.0.0/';
  const ZIP_NODE = zip({ 'node-v24.0.0-win-x64/node.exe': 'NODE' });
  const URL_ZIP_NODE = `${BASE_NODE}node-v24.0.0-win-x64.zip`;
  const SUMAS = Buffer.from(
    `${'0'.repeat(64)}  node-v24.0.0-linux-x64.tar.xz\n${sha(ZIP_NODE)}  node-v24.0.0-win-x64.zip\n`,
  );
  const vNode = (o: Partial<VersionDisponible> = {}): VersionDisponible => ({
    servicio: 'node',
    version: '24.0.0',
    rama: '24',
    url: URL_ZIP_NODE,
    sha256: sha(ZIP_NODE),
    huella: { algoritmo: 'sha256', valor: sha(ZIP_NODE) },
    formato: 'zip',
    subcarpeta: 'node-v24.0.0-win-x64',
    ejecutable: 'node.exe',
    origen: 'vivo',
    ...o,
  });
  const rutasNode = (o: { sumas?: Buffer; firma?: Buffer | string | null } = {}) => {
    const r: Record<string, Ruta> = {
      [`${BASE_NODE}SHASUMS256.txt`]: o.sumas ?? SUMAS,
      [URL_ZIP_NODE]: ZIP_NODE,
    };
    if (o.firma !== null) r[`${BASE_NODE}SHASUMS256.txt.sig`] = o.firma ?? firmar(clave, SUMAS);
    return r;
  };

  it('Node: verifica SHASUMS256.txt.sig antes de bajar el zip e instala', async () => {
    const { inst, ff } = firmado(rutasNode());
    await inst.instalar(vNode());
    expect(ff.pedidas).toEqual([
      `${BASE_NODE}SHASUMS256.txt`,
      `${BASE_NODE}SHASUMS256.txt.sig`,
      URL_ZIP_NODE,
    ]);
    expect(await readFile(path.join(rutas.bin('node', '24.0.0'), 'node.exe'), 'utf8')).toBe('NODE');
  });

  it('Node sin huella listada usa la suma firmada (sin pedir confirmación)', async () => {
    const { inst } = firmado(rutasNode());
    await inst.instalar(vNode({ huella: null, sha256: null }));
    expect(existsSync(path.join(rutas.bin('node', '24.0.0'), 'node.exe'))).toBe(true);
  });

  it('Node con .sig ausente → falla sin bajar el zip ni dejar nada', async () => {
    const { inst, ff } = firmado(rutasNode({ firma: null }));
    await expect(inst.instalar(vNode())).rejects.toMatchObject({
      codigo: 'catalogo.firma_invalida',
      datos: { servicio: 'node', version: '24.0.0' },
    });
    expect(ff.pedidas).not.toContain(URL_ZIP_NODE);
    await sinRastros('node', '24.0.0');
  });

  it('Node con SHASUMS256.txt alterado, firma de otra clave o armadura rota → falla', async () => {
    const alterado = Buffer.from(SUMAS.toString().replace('linux', 'linuz'));
    const casos: [Record<string, Ruta>, string][] = [
      [rutasNode({ sumas: alterado }), 'catalogo.firma_invalida'],
      [rutasNode({ firma: firmar(ajena, SUMAS) }), 'catalogo.clave_desconocida'],
      [
        rutasNode({ firma: armar(firmar(clave, SUMAS), 'SIGNATURE', 'mal') }),
        'catalogo.firma_invalida',
      ],
    ];
    for (const [r, codigo] of casos) {
      const { inst, ff } = firmado(r);
      await expect(inst.instalar(vNode())).rejects.toMatchObject({ codigo });
      expect(ff.pedidas).not.toContain(URL_ZIP_NODE);
      await sinRastros('node', '24.0.0');
    }
  });

  it('Node: la huella listada distinta de la firmada → huella_no_coincide sin bajar el zip', async () => {
    const { inst, ff } = firmado(rutasNode());
    const otra = 'a'.repeat(64);
    await expect(
      inst.instalar(vNode({ huella: { algoritmo: 'sha256', valor: otra }, sha256: otra })),
    ).rejects.toMatchObject({ codigo: 'catalogo.huella_no_coincide' });
    expect(ff.pedidas).not.toContain(URL_ZIP_NODE);
  });

  it('Node: lista firmada sin el zip → firma_invalida', async () => {
    const otras = Buffer.from(`${'1'.repeat(64)}  node-v24.0.0-x86.zip\n`);
    const { inst } = firmado(rutasNode({ sumas: otras, firma: firmar(clave, otras) }));
    await expect(inst.instalar(vNode())).rejects.toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
  });

  // ---- Nginx: .zip.asc sobre el zip (sin suma publicada)
  const ZIP_NGINX = zip({ 'nginx-1.29.9/nginx.exe': 'NGINX' });
  const URL_NGINX = 'https://nginx.org/download/nginx-1.29.9.zip';
  const vNginx: VersionDisponible = {
    servicio: 'nginx',
    version: '1.29.9',
    rama: '1.29',
    url: URL_NGINX,
    sha256: null,
    huella: null,
    formato: 'zip',
    subcarpeta: 'nginx-1.29.9',
    ejecutable: 'nginx.exe',
    origen: 'vivo',
  };

  it('Nginx con .asc válido no pide confirmación e instala', async () => {
    const { inst, ff } = firmado({
      [`${URL_NGINX}.asc`]: armar(firmar(clave, ZIP_NGINX)),
      [URL_NGINX]: ZIP_NGINX,
    });
    await inst.instalar(vNginx);
    expect(ff.pedidas).toEqual([`${URL_NGINX}.asc`, URL_NGINX]);
    expect(await readFile(path.join(rutas.bin('nginx', '1.29.9'), 'nginx.exe'), 'utf8')).toBe(
      'NGINX',
    );
  });

  it('Nginx con .asc inválido falla sin instalar y sin dejar archivos (aunque se confirme)', async () => {
    for (const o of [{}, { confirmarSinHuella: true as const }]) {
      const { inst } = firmado({
        [`${URL_NGINX}.asc`]: armar(firmar(clave, Buffer.from('otro zip'))),
        [URL_NGINX]: ZIP_NGINX,
      });
      await expect(inst.instalar(vNginx, o)).rejects.toMatchObject({
        codigo: 'catalogo.firma_invalida',
      });
      await sinRastros('nginx', '1.29.9');
    }
  });

  it('Nginx con .asc ausente → falla antes de bajar el zip', async () => {
    const { inst, ff } = firmado({ [URL_NGINX]: ZIP_NGINX });
    await expect(inst.instalar(vNginx, { confirmarSinHuella: true })).rejects.toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
    expect(ff.pedidas).toEqual([`${URL_NGINX}.asc`]);
    await sinRastros('nginx', '1.29.9');
  });

  it('Nginx: una firma de texto canónico (0x01) sobre un zip no se admite', async () => {
    const { inst } = firmado({
      [`${URL_NGINX}.asc`]: armar(firmar(clave, ZIP_NGINX, { tipoFirma: 0x01 })),
      [URL_NGINX]: ZIP_NGINX,
    });
    await expect(inst.instalar(vNginx)).rejects.toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
    await sinRastros('nginx', '1.29.9');
  });

  it('Node: SHASUMS256.txt firmado como texto canónico (0x01) sí se admite', async () => {
    const { inst } = firmado(rutasNode({ firma: firmar(clave, SUMAS, { tipoFirma: 0x01 }) }));
    await inst.instalar(vNode());
    expect(existsSync(path.join(rutas.bin('node', '24.0.0'), 'node.exe'))).toBe(true);
  });

  it('Node: firma anterior a la publicación (menos 48 h) → firma_invalida', async () => {
    // La firma de prueba se crea en T0 + 60 (2023-11-14T22:14:20Z).
    const { inst, ff } = firmado(rutasNode());
    await expect(inst.instalar(vNode({ publicacion: '2023-11-17' }))).rejects.toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
    expect(ff.pedidas).not.toContain(URL_ZIP_NODE);
    const dentro = firmado(rutasNode());
    await dentro.inst.instalar(vNode({ publicacion: '2023-11-16' }));
    expect(existsSync(path.join(rutas.bin('node', '24.0.0'), 'node.exe'))).toBe(true);
  });

  it('Node: firma con fecha futura → reloj_atrasado (revise la fecha del equipo)', async () => {
    const futura = firmar(clave, SUMAS, { creacion: T0 + 3600 + 2 * 86400 });
    const { inst } = firmado(rutasNode({ firma: futura }));
    await expect(inst.instalar(vNode())).rejects.toMatchObject({
      codigo: 'catalogo.reloj_atrasado',
      datos: { servicio: 'node', version: '24.0.0' },
    });
  });

  // ---- Composer: composer.phar.asc desde 2.0.3
  const phar = (version: string) =>
    Buffer.from(
      `<?php // composer de prueba\nclass Composer { public const VERSION = '${version}'; }\n`,
    );
  const vComposer = (version: string, contenido = phar(version)): VersionDisponible => ({
    servicio: 'composer',
    version,
    rama: version.split('.').slice(0, 2).join('.'),
    url: `https://getcomposer.org/download/${version}/composer.phar`,
    sha256: sha(contenido),
    huella: { algoritmo: 'sha256', valor: sha(contenido) },
    formato: 'archivo',
    ejecutable: 'composer.phar',
    origen: 'vivo',
  });

  it('Composer 2.11 verifica composer.phar.asc (binaria); 2.0.2 no tiene firma y usa su suma', async () => {
    const PHAR = phar('2.11.2');
    const v = vComposer('2.11.2');
    const bien = firmado({ [`${v.url}.asc`]: firmar(clave, PHAR), [v.url]: PHAR });
    await bien.inst.instalar(v);
    expect(bien.ff.pedidas).toEqual([`${v.url}.asc`, v.url]);
    expect(existsSync(path.join(rutas.bin('composer', '2.11.2'), 'composer.phar'))).toBe(true);

    const malo = vComposer('2.11.3');
    const mal = firmado({
      [`${malo.url}.asc`]: firmar(clave, Buffer.from('x')),
      [malo.url]: phar('2.11.3'),
    });
    await expect(mal.inst.instalar(malo)).rejects.toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
    await sinRastros('composer', '2.11.3');

    const viejo = vComposer('2.0.2');
    const sinFirma = firmado({ [viejo.url]: phar('2.0.2') });
    await sinFirma.inst.instalar(viejo);
    expect(sinFirma.ff.pedidas).toEqual([viejo.url]);
  });

  it('Composer: un phar firmado de otra versión (repetición) → firma_invalida', async () => {
    // Un phar real 2.2.33, bien firmado, servido como si fuera 2.11.2.
    const viejo = phar('2.2.33');
    const v = vComposer('2.11.2', viejo);
    const { inst } = firmado({ [`${v.url}.asc`]: firmar(clave, viejo), [v.url]: viejo });
    await expect(inst.instalar(v)).rejects.toMatchObject({
      codigo: 'catalogo.firma_invalida',
      datos: { servicio: 'composer', version: '2.11.2' },
    });
    await sinRastros('composer', '2.11.2');
  });

  it('Composer 2.0.3 ya publica firma: se exige', async () => {
    const v = vComposer('2.0.3');
    const { inst, ff } = firmado({ [v.url]: phar('2.0.3') });
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.firma_invalida' });
    expect(ff.pedidas).toEqual([`${v.url}.asc`]);
  });
});
