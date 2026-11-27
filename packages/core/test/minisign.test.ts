import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vitest';
import type { VersionDisponible } from '../src/catalogo/catalogo';
import { fuenteZig } from '../src/catalogo/fuentes/zig';
import { Instalador } from '../src/catalogo/instalador';
import {
  archivoDelComentario,
  CLAVE_MINISIGN_ZIG,
  claveMinisignDe,
  leerMinisig,
  MAX_MINISIG_BYTES,
  verificarMinisign,
  type FirmaMinisign,
} from '../src/catalogo/minisign';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Rutas } from '../src/rutas';
import { fetchFalso, fixture, HOY, zipDe } from './catalogo-falso';
import { carpetaTemporal } from './temporales';

/** Par de claves de prueba en formato minisign (clave pública de 42 bytes y firma de 74). */
function nuevaClave(): { publica: string; firmar: (digest: Buffer, comentario: string) => string } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(12);
  const id = Buffer.from('0123456789abcdef', 'hex').subarray(0, 8);
  const publica = Buffer.concat([Buffer.from('Ed'), id, raw]).toString('base64');
  return {
    publica,
    firmar(digest, comentario) {
      const firma = sign(null, digest, privateKey);
      const global = sign(null, Buffer.concat([firma, Buffer.from(comentario)]), privateKey);
      return [
        'untrusted comment: signature from minisign secret key',
        Buffer.concat([Buffer.from('ED'), id, firma]).toString('base64'),
        `trusted comment: ${comentario}`,
        global.toString('base64'),
        '',
      ].join('\n');
    },
  };
}

const blake = (b: Buffer | string): Buffer => createHash('blake2b512').update(b).digest();
const COMENTARIO = (archivo: string): string => `timestamp:1793729674\tfile:${archivo}\thashed`;

const ok = (r: unknown): FirmaMinisign => {
  expect(r).not.toHaveProperty('ok');
  return r as FirmaMinisign;
};

describe('D11: minisign', () => {
  it('la clave de Zig es la publicada en ziglang.org/download y solo Zig la usa', () => {
    expect(CLAVE_MINISIGN_ZIG).toBe('RWSGOq2NVecA2UPNdBUZykf1CCb147pkmdtYxgb3Ti+JO/wCYvhbAb/U');
    expect(claveMinisignDe({ servicio: 'zig' })).toBe(CLAVE_MINISIGN_ZIG);
    for (const s of ['bun', 'deno', 'kotlin', 'dart', 'node']) {
      expect(claveMinisignDe({ servicio: s })).toBeNull();
    }
  });

  it('una firma real de Zig 0.17.1 se interpreta y su comentario nombra el archivo', () => {
    const f = ok(leerMinisig(Buffer.from(fixture('zig-src-0.17.1.minisig'))));
    expect(f.idClave.toString('hex')).toBe('863aad8d55e700d9');
    expect(archivoDelComentario(f.comentarioConfiable)).toBe('zig-0.17.1.tar.xz');
  });

  // El BLAKE2b-512 es el de zig-0.17.1.tar.xz (descargado una vez, fuera de las pruebas).
  it('una firma real de Zig valida con la clave fijada y el BLAKE2b-512 del archivo real', () => {
    const f = ok(leerMinisig(Buffer.from(fixture('zig-src-0.17.1.minisig'))));
    const digest = Buffer.from(fixture('zig-src-0.17.1.blake2b').trim(), 'hex');
    const base = {
      clave: CLAVE_MINISIGN_ZIG,
      firma: f,
      digest,
      nombreArchivo: 'zig-0.17.1.tar.xz',
    };
    expect(verificarMinisign(base)).toEqual({ ok: true });
    // Un byte cambiado en el resumen, otro nombre o un comentario distinto no valen.
    const malo = Buffer.from(digest);
    malo[0] = malo[0]! ^ 1;
    expect(verificarMinisign({ ...base, digest: malo })).toMatchObject({ ok: false });
    expect(verificarMinisign({ ...base, nombreArchivo: 'zig-0.17.0.tar.xz' })).toMatchObject({
      ok: false,
    });
    expect(
      verificarMinisign({
        ...base,
        firma: { ...f, comentarioConfiable: f.comentarioConfiable.replace('1793655741', '1') },
      }),
    ).toMatchObject({ ok: false, detalle: expect.stringContaining('global') });
  });

  it('con una clave propia: firma válida, resumen alterado, otra clave y otro archivo', () => {
    const k = nuevaClave();
    const digest = blake('contenido');
    const f = ok(leerMinisig(Buffer.from(k.firmar(digest, COMENTARIO('a.zip')))));
    const base = { clave: k.publica, firma: f, digest, nombreArchivo: 'a.zip' };
    expect(verificarMinisign(base)).toEqual({ ok: true });
    expect(verificarMinisign({ ...base, digest: blake('otro') })).toMatchObject({ ok: false });
    expect(verificarMinisign({ ...base, nombreArchivo: 'b.zip' })).toMatchObject({ ok: false });
    expect(verificarMinisign({ ...base, clave: nuevaClave().publica })).toMatchObject({
      ok: false,
    });
    expect(verificarMinisign({ ...base, clave: CLAVE_MINISIGN_ZIG })).toMatchObject({ ok: false });
    expect(verificarMinisign({ ...base, digest: Buffer.alloc(32) })).toMatchObject({ ok: false });
    expect(verificarMinisign({ ...base, clave: 'basura' })).toMatchObject({ ok: false });
  });

  it('formatos raros: sin líneas, prehash antiguo, base64 corrupto, demasiado grande', () => {
    const k = nuevaClave();
    const buena = k.firmar(blake('x'), COMENTARIO('a.zip'));
    const lineas = buena.trimEnd().split('\n');
    const rotos: [string, Buffer][] = [
      ['vacía', Buffer.alloc(0)],
      ['tres líneas', Buffer.from(lineas.slice(0, 3).join('\n'))],
      ['cinco líneas', Buffer.from(`${lineas.join('\n')}\nextra\n`)],
      ['sin comentario no confiable', Buffer.from(['x', ...lineas.slice(1)].join('\n'))],
      ['sin comentario confiable', Buffer.from([lineas[0], lineas[1], 'x', lineas[3]].join('\n'))],
      [
        'firma con base64 inválido',
        Buffer.from([lineas[0], '!!!!', lineas[2], lineas[3]].join('\n')),
      ],
      ['firma global corta', Buffer.from([lineas[0], lineas[1], lineas[2], 'AAAA'].join('\n'))],
      ['bytes al azar', Buffer.from(Array.from({ length: 300 }, (_, i) => (i * 37) % 256))],
      ['demasiado grande', Buffer.alloc(MAX_MINISIG_BYTES + 1, 65)],
    ];
    for (const [nombre, bytes] of rotos) {
      expect(leerMinisig(bytes), nombre).toMatchObject({ ok: false });
    }
    // Prehash antiguo ("Ed" en vez de "ED"): se rechaza, no se interpreta como el nuevo.
    const sig = Buffer.from(lineas[1]!, 'base64');
    sig.write('Ed', 0, 'latin1');
    expect(
      leerMinisig(
        Buffer.from([lineas[0], sig.toString('base64'), lineas[2], lineas[3]].join('\n')),
      ),
    ).toMatchObject({ ok: false, detalle: expect.stringContaining('prehash') });
    // CRLF y una línea final vacía sí valen.
    expect(leerMinisig(Buffer.from(buena.replaceAll('\n', '\r\n')))).not.toHaveProperty('ok');
  });

  it('500 mutaciones de una firma nunca lanzan ni validan', () => {
    const k = nuevaClave();
    const digest = blake('x');
    const buena = Buffer.from(k.firmar(digest, COMENTARIO('a.zip')));
    let semilla = 12345;
    const azar = (n: number): number => {
      semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
      return semilla % n;
    };
    for (let i = 0; i < 500; i++) {
      const m = Buffer.from(buena);
      m[azar(m.length)] = azar(256);
      const f = leerMinisig(m);
      if ('ok' in f) continue;
      const r = verificarMinisign({ clave: k.publica, firma: f, digest, nombreArchivo: 'a.zip' });
      // Cambiar solo el texto del comentario no confiable no altera lo firmado.
      if (r.ok)
        expect(m.toString().split('\n').slice(1).join('\n')).toBe(
          buena.toString().split('\n').slice(1).join('\n'),
        );
    }
  });
});

/* ───────────── Instalar Zig con firma minisign ───────────── */

const temporales: string[] = [];
afterEach(async () => {
  for (const t of temporales.splice(0)) await rm(t, { recursive: true, force: true });
});
async function rutasTemp(): Promise<Rutas> {
  const base = await carpetaTemporal('pel-mini-');
  temporales.push(base);
  const r = new Rutas(base);
  await r.asegurar();
  return r;
}

describe('D11: instalar Zig verifica la firma minisign antes y después de descargar', () => {
  const ARCHIVO = 'zig-x86_64-windows-0.17.1.zip';
  const ZIP = { 'zig-x86_64-windows-0.17.1/zig.exe': 'EXE' };
  const preparar = async (zip: Buffer): Promise<VersionDisponible> => {
    const ff = fetchFalso({ 'https://ziglang.org/download/index.json': fixture('zig-index.json') });
    const v = (await fuenteZig.listar({ f: ff.f, idCatalogo: 'win-x64', ahora: HOY })).find(
      (x) => x.version === '0.17.1',
    )!;
    const h = createHash('sha256').update(zip).digest('hex');
    return { ...v, sha256: h, huella: { algoritmo: 'sha256', valor: h } };
  };

  it('con la firma válida se instala', async () => {
    const k = nuevaClave();
    const zip = zipDe(ZIP);
    const v = await preparar(zip);
    const ff = fetchFalso({
      [v.url]: zip,
      [`${v.url}.minisig`]: k.firmar(blake(zip), COMENTARIO(ARCHIVO)),
    });
    const r = await rutasTemp();
    const inst = new Instalador(r, new Eventos<EventosNucleo>(), ff.f, {
      claveMinisign: () => k.publica,
    });
    await inst.instalar(v);
    expect(await inst.instalados('zig')).toEqual(['0.17.1']);
    expect(ff.pedidas).toEqual([`${v.url}.minisig`, v.url]);
  });

  it('sin .minisig publicado no se descarga el zip ni se instala', async () => {
    const zip = zipDe(ZIP);
    const v = await preparar(zip);
    const ff = fetchFalso({ [v.url]: zip });
    const r = await rutasTemp();
    const inst = new Instalador(r, new Eventos<EventosNucleo>(), ff.f);
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.firma_invalida' });
    expect(ff.pedidas).toEqual([`${v.url}.minisig`]);
    expect(existsSync(r.bin('zig', '0.17.1'))).toBe(false);
  });

  it('un zip con la suma correcta pero firmado por otra clave se rechaza y no deja nada', async () => {
    const zip = zipDe(ZIP);
    const v = await preparar(zip);
    const ajena = nuevaClave();
    const ff = fetchFalso({
      [v.url]: zip,
      [`${v.url}.minisig`]: ajena.firmar(blake(zip), COMENTARIO(ARCHIVO)),
    });
    const r = await rutasTemp();
    // Con la clave fijada de Zig (la real), una firma de otra clave nunca sirve.
    const inst = new Instalador(r, new Eventos<EventosNucleo>(), ff.f);
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.firma_invalida' });
    expect(existsSync(r.bin('zig', '0.17.1'))).toBe(false);
  });

  it('un zip distinto del firmado (aunque su suma cuadre con el catálogo) se rechaza', async () => {
    const k = nuevaClave();
    const original = zipDe(ZIP);
    const cambiado = zipDe({ ...ZIP, 'zig-x86_64-windows-0.17.1/malo.dll': 'MALO' });
    const v = await preparar(cambiado);
    const ff = fetchFalso({
      [v.url]: cambiado,
      [`${v.url}.minisig`]: k.firmar(blake(original), COMENTARIO(ARCHIVO)),
    });
    const r = await rutasTemp();
    const inst = new Instalador(r, new Eventos<EventosNucleo>(), ff.f, {
      claveMinisign: () => k.publica,
    });
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.firma_invalida' });
    expect(existsSync(r.bin('zig', '0.17.1'))).toBe(false);
  });

  it('una firma de otro archivo (replay) se rechaza', async () => {
    const k = nuevaClave();
    const zip = zipDe(ZIP);
    const v = await preparar(zip);
    const ff = fetchFalso({
      [v.url]: zip,
      [`${v.url}.minisig`]: k.firmar(blake(zip), COMENTARIO('zig-x86_64-windows-0.16.0.zip')),
    });
    const inst = new Instalador(await rutasTemp(), new Eventos<EventosNucleo>(), ff.f, {
      claveMinisign: () => k.publica,
    });
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.firma_invalida' });
  });

  it('una firma ilegible se rechaza antes de descargar', async () => {
    const zip = zipDe(ZIP);
    const v = await preparar(zip);
    const ff = fetchFalso({ [v.url]: zip, [`${v.url}.minisig`]: 'no es una firma' });
    const inst = new Instalador(await rutasTemp(), new Eventos<EventosNucleo>(), ff.f);
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.firma_invalida' });
    expect(ff.pedidas).toEqual([`${v.url}.minisig`]);
  });

  it('el .minisig que redirige a un host ajeno se corta', async () => {
    const zip = zipDe(ZIP);
    const v = await preparar(zip);
    const ff = fetchFalso({ [`${v.url}.minisig`]: { ir: 'https://evil.example/f.minisig' } });
    const inst = new Instalador(await rutasTemp(), new Eventos<EventosNucleo>(), ff.f);
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.redireccion_ajena' });
    expect(ff.pedidas.some((u) => u.includes('evil.example'))).toBe(false);
  });

  it('las demás fuentes (Deno, Bun…) no piden .minisig', async () => {
    const zip = zipDe({ 'deno.exe': 'EXE' });
    const h = createHash('sha256').update(zip).digest('hex');
    const v: VersionDisponible = {
      servicio: 'deno',
      version: '2.9.8',
      rama: '2.9',
      url: 'https://github.com/denoland/deno/releases/download/v2.9.8/deno-x86_64-pc-windows-msvc.zip',
      sha256: h,
      huella: { algoritmo: 'sha256', valor: h },
      formato: 'zip',
      ejecutable: 'deno.exe',
      origen: 'vivo',
    };
    const ff = fetchFalso({ [v.url]: zip });
    const inst = new Instalador(await rutasTemp(), new Eventos<EventosNucleo>(), ff.f);
    await inst.instalar(v);
    expect(ff.pedidas).toEqual([v.url]);
  });
});
