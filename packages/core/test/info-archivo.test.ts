import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { esErrorWolf } from '../src/errores';
import {
  calcularHashesRuta,
  decidirHash,
  esArchivoSensible,
  leerInfoRuta,
  mimePorExtension,
  mimePorFirma,
  TOPE_HASH_BYTES,
  validarRutaInfo,
} from '../src/herramientas/infoArchivo';
import { interpretarAtributos } from '../src/plataforma/atributosWin';
import { PlataformaFalsa } from '../src/plataforma/falsa';

/** D55: «Info de archivo». Solo lectura; la ruta es una entrada no confiable. */
const codigoDe = async (f: () => unknown): Promise<string | null> => {
  try {
    await f();
    return null;
  } catch (e) {
    return esErrorWolf(e) ? e.codigo : 'otro';
  }
};

describe('validarRutaInfo', () => {
  it('acepta rutas absolutas locales de Windows (con \\ o /) y de POSIX', () => {
    expect(validarRutaInfo('C:\\Proyectos\\app\\a.txt')).toMatch(/a\.txt$/);
    expect(validarRutaInfo('c:/Proyectos/app')).toMatch(/app$/);
    expect(validarRutaInfo('/home/u/a.txt')).toMatch(/a\.txt$/);
  });

  it.each([
    ['no es texto', 42],
    ['vacía', ''],
    ['relativa', 'carpeta\\a.txt'],
    ['relativa con unidad', 'C:a.txt'],
    ['UNC', '\\\\servidor\\recurso\\a.txt'],
    ['UNC con barras', '//servidor/recurso/a.txt'],
    ['prefijo de dispositivo', '\\\\?\\C:\\a.txt'],
    ['prefijo de dispositivo punto', '\\\\.\\PhysicalDrive0'],
    ['con ..', 'C:\\a\\..\\b.txt'],
    ['flujo alternativo', 'C:\\a.txt:oculto'],
    ['carácter de control', 'C:\\a\u0000.txt'],
    ['carácter reservado', 'C:\\a?.txt'],
    ['demasiado larga', `C:\\${'a'.repeat(1030)}`],
  ])('rechaza %s', async (_n, ruta) => {
    expect(await codigoDe(() => validarRutaInfo(ruta))).toBe('info.ruta_invalida');
  });
});

describe('decisión de hash y archivos sensibles', () => {
  it('calcula hasta el tope y no más', () => {
    expect(decidirHash(0)).toBe('calcular');
    expect(decidirHash(TOPE_HASH_BYTES)).toBe('calcular');
    expect(decidirHash(TOPE_HASH_BYTES + 1)).toBe('grande');
    expect(decidirHash(10, 5)).toBe('grande');
  });

  it.each(['.env', '.env.local', 'server.pem', 'clave.key', 'id_rsa', 'id_ed25519', 'a.pfx'])(
    '%s es sensible',
    (n) => expect(esArchivoSensible(`C:\\proyecto\\${n}`)).toBe(true),
  );
  it.each(['notas.txt', 'index.php', 'foto.png', 'keyboard.ts'])('%s no es sensible', (n) =>
    expect(esArchivoSensible(`C:\\proyecto\\${n}`)).toBe(false),
  );
});

describe('tipo por firma y por extensión', () => {
  it('reconoce firmas comunes', () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    expect(mimePorFirma(png)).toBe('image/png');
    expect(mimePorFirma(Buffer.from('%PDF-1.7'))).toBe('application/pdf');
    expect(mimePorFirma(Uint8Array.from([0x50, 0x4b, 3, 4]))).toBe('application/zip');
    expect(mimePorFirma(Buffer.from('hola'))).toBeNull();
  });
  it('usa la extensión si no hay firma', () => {
    expect(mimePorExtension('a.json')).toBe('application/json');
    expect(mimePorExtension('a.PHP')).toBe('application/x-httpd-php');
    expect(mimePorExtension('a.zzz')).toBeNull();
    expect(mimePorExtension('LEEME')).toBeNull();
  });
});

describe('atributos de attrib', () => {
  it('lee solo lectura y oculto', () => {
    expect(interpretarAtributos('A    H R                C:\\Users\\a\\x.txt\r\n')).toEqual({
      soloLectura: true,
      oculto: true,
    });
    expect(interpretarAtributos('A                    C:\\x.txt')).toEqual({
      soloLectura: false,
      oculto: false,
    });
    expect(interpretarAtributos('                     C:\\carpeta')).toEqual({
      soloLectura: false,
      oculto: false,
    });
    expect(interpretarAtributos('Formato incorrecto')).toBeNull();
  });
});

describe('leerInfoRuta con PlataformaFalsa', () => {
  let dir: string;
  let plat: PlataformaFalsa;
  beforeEach(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'info-archivo-'));
    plat = new PlataformaFalsa({ carpetaDatos: dir });
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const png = (ancho: number, alto: number): Buffer => {
    const b = Buffer.alloc(33);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
    b.writeUInt32BE(13, 8);
    b.write('IHDR', 12, 'ascii');
    b.writeUInt32BE(ancho, 16);
    b.writeUInt32BE(alto, 20);
    return b;
  };

  it('de un archivo de texto: tamaño, tipo, fechas y atributos de la plataforma', async () => {
    const f = path.join(dir, 'datos.json');
    writeFileSync(f, '{"a":1}');
    plat.atributos.set(path.resolve(f), { soloLectura: true, oculto: false });
    const i = await leerInfoRuta(f, { plataforma: plat });
    expect(i).toMatchObject({
      nombre: 'datos.json',
      tipo: 'archivo',
      tamano: 7,
      extension: 'json',
      mime: 'application/json',
      soloLectura: true,
      oculto: false,
      imagen: null,
      sensible: false,
      hash: 'calcular',
    });
    expect(i.modificado).toBeGreaterThan(0);
    expect(i.creado).toBeGreaterThan(0);
    expect(i.accedido).toBeGreaterThan(0);
  });

  it('sin respuesta de la plataforma, los atributos quedan en null', async () => {
    const f = path.join(dir, 'a.txt');
    writeFileSync(f, 'x');
    const i = await leerInfoRuta(f, { plataforma: plat });
    expect(i.soloLectura).toBeNull();
    expect(i.oculto).toBeNull();
  });

  it('de una imagen: la firma manda sobre la extensión y trae las dimensiones', async () => {
    const f = path.join(dir, 'foto.dat');
    writeFileSync(f, png(640, 480));
    const i = await leerInfoRuta(f, { plataforma: plat });
    expect(i.mime).toBe('image/png');
    expect(i.imagen).toEqual({ tipo: 'png', ancho: 640, alto: 480 });
  });

  it('de un archivo sensible: metadatos sí, cabecera no (ni siquiera una imagen se mira)', async () => {
    const f = path.join(dir, 'secreto.pem');
    writeFileSync(f, png(10, 10));
    const i = await leerInfoRuta(f, { plataforma: plat });
    expect(i.sensible).toBe(true);
    expect(i.tamano).toBe(33);
    expect(i.imagen).toBeNull();
    expect(i.mime).toBeNull();
    expect(i.hash).toBe('calcular');
  });

  it('de una carpeta: sin tamaño ni hash', async () => {
    const c = path.join(dir, 'sub');
    mkdirSync(c);
    const i = await leerInfoRuta(c, { plataforma: plat });
    expect(i).toMatchObject({ tipo: 'carpeta', tamano: null, hash: 'no_aplica', sensible: false });
  });

  it('rechaza lo que no existe y las rutas mal formadas', async () => {
    expect(await codigoDe(() => leerInfoRuta(path.join(dir, 'no.txt'), { plataforma: plat }))).toBe(
      'info.no_existe',
    );
    expect(await codigoDe(() => leerInfoRuta('relativa.txt', { plataforma: plat }))).toBe(
      'info.ruta_invalida',
    );
  });

  it('no sigue enlaces', async () => {
    const f = path.join(dir, 'real.txt');
    writeFileSync(f, 'x');
    const enlace = path.join(dir, 'enlace');
    try {
      const { symlinkSync } = await import('node:fs');
      symlinkSync(dir, enlace, 'junction');
    } catch {
      return; // sin permiso para crear la unión: no se puede probar aquí
    }
    expect(await codigoDe(() => leerInfoRuta(enlace, { plataforma: plat }))).toBe('info.enlace');
  });
});

describe('calcularHashesRuta', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'info-hash-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('MD5, SHA-1 y SHA-256 conocidos de «abc»', async () => {
    const f = path.join(dir, 'abc.txt');
    writeFileSync(f, 'abc');
    expect(await calcularHashesRuta(f)).toEqual({
      md5: '900150983cd24fb0d6963f7d28e17f72',
      sha1: 'a9993e364706816aba3e25717850c26c9cd0d89d',
      sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    });
  });

  it('un archivo sensible también se calcula si no pasa del tope; si pasa, se rechaza', async () => {
    const f = path.join(dir, '.env');
    writeFileSync(f, 'CLAVE=1234');
    expect((await calcularHashesRuta(f)).md5).toHaveLength(32);
    expect(await codigoDe(() => calcularHashesRuta(f, 5))).toBe('info.hash_grande');
  });

  it('no calcula una carpeta', async () => {
    expect(await codigoDe(() => calcularHashesRuta(dir))).toBe('info.ruta_invalida');
  });
});
