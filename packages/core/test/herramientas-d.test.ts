import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import yauzl from 'yauzl';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { esErrorWolf } from '../src/errores';
import {
  dimensionesImagen,
  guardarImagen,
  leerImagen,
  LIMITES_IMAGEN,
} from '../src/herramientas/imagenes';
import { optimizarPdf } from '../src/herramientas/pdf';
import { abrirNuevo } from '../src/herramientas/salidaNueva';
import { comprimirZip } from '../src/herramientas/zip';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-herr-d-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const sha = (ruta: string): string => createHash('sha256').update(readFileSync(ruta)).digest('hex');

async function codigoDe(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (esErrorWolf(e)) return e.codigo;
    throw e;
  }
  return 'sin-error';
}

function nombresZip(archivo: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    yauzl.open(archivo, { lazyEntries: true }, (err, zip) => {
      if (err || !zip) return reject(err);
      const nombres: string[] = [];
      zip.on('entry', (e: yauzl.Entry) => {
        nombres.push(e.fileName);
        zip.readEntry();
      });
      zip.on('end', () => resolve(nombres));
      zip.on('error', reject);
      zip.readEntry();
    });
  });
}

/** PNG mínimo válido en la cabecera (solo se mira IHDR); no hace falta que se decodifique. */
function pngConCabecera(ancho: number, alto: number): Buffer {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(ancho, 16);
  b.writeUInt32BE(alto, 20);
  return b;
}

describe('abrirNuevo (salida que nunca pisa)', () => {
  it('si el nombre existe, usa "nombre (1)" y deja intacto el existente', async () => {
    const destino = path.join(dir, 'a.zip');
    writeFileSync(destino, 'original');
    const { ruta, handle } = await abrirNuevo(destino);
    await handle.writeFile('nuevo');
    await handle.close();
    expect(path.basename(ruta)).toBe('a (1).zip');
    expect(readFileSync(destino, 'utf8')).toBe('original');
    const otra = await abrirNuevo(destino);
    await otra.handle.close();
    expect(path.basename(otra.ruta)).toBe('a (2).zip');
  });
});

describe('comprimirZip', () => {
  it('comprime carpeta y archivos, y devuelve el peso antes y después', async () => {
    const carpeta = path.join(dir, 'proyecto');
    mkdirSync(path.join(carpeta, 'sub'), { recursive: true });
    writeFileSync(path.join(carpeta, 'a.txt'), 'a'.repeat(5000));
    writeFileSync(path.join(carpeta, 'sub', 'b.txt'), 'b'.repeat(5000));
    const suelto = path.join(dir, 'suelto.txt');
    writeFileSync(suelto, 'c'.repeat(1000));
    const destino = path.join(dir, 'salida.zip');
    const r = await comprimirZip({ origenes: [carpeta, suelto], destino });
    expect(r.antes).toBe(11_000);
    expect(r.despues).toBeGreaterThan(0);
    expect(r.despues).toBeLessThan(r.antes);
    expect(r.archivos).toBe(3);
    expect(r.archivo).toBe(destino);
    expect((await nombresZip(destino)).sort()).toEqual([
      'proyecto/a.txt',
      'proyecto/sub/b.txt',
      'suelto.txt',
    ]);
  });

  it('no sobrescribe un ZIP existente: escribe "nombre (1).zip"', async () => {
    const origen = path.join(dir, 'x.txt');
    writeFileSync(origen, 'x'.repeat(100));
    const destino = path.join(dir, 'x.zip');
    writeFileSync(destino, 'no soy un zip de verdad');
    const hash = sha(destino);
    const r = await comprimirZip({ origenes: [origen], destino });
    expect(path.basename(r.archivo)).toBe('x (1).zip');
    expect(sha(destino)).toBe(hash);
    expect(await nombresZip(r.archivo)).toEqual(['x.txt']);
  });

  it('no sigue enlaces: ni uniones de carpeta ni enlaces a archivos', async () => {
    const carpeta = path.join(dir, 'p');
    mkdirSync(carpeta);
    writeFileSync(path.join(carpeta, 'real.txt'), 'real');
    const fuera = path.join(dir, 'fuera');
    mkdirSync(fuera);
    writeFileSync(path.join(fuera, 'secreto.txt'), 'no debe entrar');
    symlinkSync(fuera, path.join(carpeta, 'enlace'), 'junction');
    let archivoEnlazado = false;
    try {
      symlinkSync(path.join(fuera, 'secreto.txt'), path.join(carpeta, 'otro.txt'), 'file');
      archivoEnlazado = true;
    } catch {
      // Sin permiso para enlaces de archivo (Windows sin modo desarrollador): se prueba la unión.
    }
    const r = await comprimirZip({ origenes: [carpeta], destino: path.join(dir, 'p.zip') });
    expect(await nombresZip(r.archivo)).toEqual(['p/real.txt']);
    expect(r.omitidos).toBeGreaterThanOrEqual(archivoEnlazado ? 2 : 1);
  });

  it('un origen que es un enlace se rechaza (no se sigue)', async () => {
    const fuera = path.join(dir, 'fuera');
    mkdirSync(fuera);
    writeFileSync(path.join(fuera, 's.txt'), 's');
    const enlace = path.join(dir, 'enlace');
    symlinkSync(fuera, enlace, 'junction');
    expect(
      await codigoDe(comprimirZip({ origenes: [enlace], destino: path.join(dir, 'e.zip') })),
    ).toBe('herramientas.zip_sin_archivos');
    expect(existsSync(path.join(dir, 'e.zip'))).toBe(false);
  });

  it('no mete el propio ZIP de destino si está dentro de lo que se comprime', async () => {
    const carpeta = path.join(dir, 'p');
    mkdirSync(carpeta);
    writeFileSync(path.join(carpeta, 'a.txt'), 'a');
    const destino = path.join(carpeta, 'p.zip');
    writeFileSync(destino, 'viejo');
    const r = await comprimirZip({ origenes: [carpeta], destino });
    expect(await nombresZip(r.archivo)).toEqual(['p/a.txt']);
  });

  it('respeta los topes de archivos y de tamaño con un código, sin dejar archivo', async () => {
    const carpeta = path.join(dir, 'm');
    mkdirSync(carpeta);
    for (let i = 0; i < 5; i++) writeFileSync(path.join(carpeta, `f${i}.txt`), 'x'.repeat(10));
    const destino = path.join(dir, 'm.zip');
    expect(
      await codigoDe(comprimirZip({ origenes: [carpeta], destino, limites: { archivos: 3 } })),
    ).toBe('herramientas.zip_demasiados');
    expect(
      await codigoDe(comprimirZip({ origenes: [carpeta], destino, limites: { bytes: 20 } })),
    ).toBe('herramientas.zip_grande');
    expect(existsSync(destino)).toBe(false);
  });

  it('un origen inexistente da un código y no cuelga', async () => {
    expect(
      await codigoDe(
        comprimirZip({ origenes: [path.join(dir, 'no-existe')], destino: path.join(dir, 'z.zip') }),
      ),
    ).toBe('herramientas.zip_sin_archivos');
  });

  it('dos orígenes con el mismo nombre no se pisan dentro del ZIP', async () => {
    mkdirSync(path.join(dir, 'a'));
    mkdirSync(path.join(dir, 'b'));
    writeFileSync(path.join(dir, 'a', 'n.txt'), '1');
    writeFileSync(path.join(dir, 'b', 'n.txt'), '2');
    const r = await comprimirZip({
      origenes: [path.join(dir, 'a', 'n.txt'), path.join(dir, 'b', 'n.txt')],
      destino: path.join(dir, 'd.zip'),
    });
    expect((await nombresZip(r.archivo)).sort()).toEqual(['n (2).txt', 'n.txt']);
  });
});

describe('optimizarPdf', () => {
  async function pdfDeMuestra(ruta: string, objectStreams: boolean): Promise<void> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 40; i++) {
      const p = doc.addPage();
      p.drawText(`Página ${i} de prueba`, { x: 50, y: 700 });
    }
    writeFileSync(ruta, await doc.save({ useObjectStreams: objectStreams }));
  }

  it('deja un PDF válido más liviano y no toca el original', async () => {
    const origen = path.join(dir, 'm.pdf');
    await pdfDeMuestra(origen, false);
    const hash = sha(origen);
    const destino = path.join(dir, 'm-optimizado.pdf');
    const r = await optimizarPdf(origen, destino);
    expect(r.mejoro).toBe(true);
    expect(r.antes).toBe(statSync(origen).size);
    expect(r.despues).toBeLessThan(r.antes);
    expect(r.archivo).toBe(destino);
    expect(statSync(destino).size).toBe(r.despues);
    const reabierto = await PDFDocument.load(readFileSync(destino));
    expect(reabierto.getPageCount()).toBe(40);
    expect(sha(origen)).toBe(hash);
  });

  it('si no mejora, lo dice y no deja archivo', async () => {
    const origen = path.join(dir, 'ya.pdf');
    // Ya está guardado como lo guarda el optimizador (flujos de objetos): no hay qué ganar.
    const doc = await PDFDocument.create();
    doc.addPage().drawText('Hola', { x: 50, y: 700 });
    const optimizado = await (
      await PDFDocument.load(await doc.save({ useObjectStreams: true }))
    ).save({ useObjectStreams: true, addDefaultPage: false });
    writeFileSync(origen, optimizado);
    const destino = path.join(dir, 'ya-opt.pdf');
    const r = await optimizarPdf(origen, destino);
    expect(r.mejoro).toBe(false);
    expect(r.archivo).toBeNull();
    expect(r.despues).toBeGreaterThanOrEqual(r.antes);
    expect(existsSync(destino)).toBe(false);
  });

  it('no sobrescribe el destino', async () => {
    const origen = path.join(dir, 'm.pdf');
    await pdfDeMuestra(origen, false);
    const destino = path.join(dir, 'salida.pdf');
    writeFileSync(destino, 'otro');
    const r = await optimizarPdf(origen, destino);
    expect(r.archivo && path.basename(r.archivo)).toBe('salida (1).pdf');
    expect(readFileSync(destino, 'utf8')).toBe('otro');
  });

  it('un PDF malformado o que no lo es da un código y no deja archivo', async () => {
    const roto = path.join(dir, 'roto.pdf');
    writeFileSync(roto, '%PDF-1.7\nesto no es un pdf de verdad');
    const noPdf = path.join(dir, 'texto.pdf');
    writeFileSync(noPdf, 'hola');
    const destino = path.join(dir, 'o.pdf');
    expect(await codigoDe(optimizarPdf(roto, destino))).toBe('herramientas.pdf_invalido');
    expect(await codigoDe(optimizarPdf(noPdf, destino))).toBe('herramientas.pdf_invalido');
    expect(existsSync(destino)).toBe(false);
  });

  it('respeta el tope de tamaño de entrada', async () => {
    const origen = path.join(dir, 'g.pdf');
    writeFileSync(origen, Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(2000)]));
    expect(await codigoDe(optimizarPdf(origen, path.join(dir, 'g2.pdf'), { maxBytes: 1000 }))).toBe(
      'herramientas.pdf_grande',
    );
  });

  it('un trabajo que no termina se corta por plazo, sin colgar', async () => {
    const origen = path.join(dir, 'm.pdf');
    await pdfDeMuestra(origen, false);
    const colgado = path.join(dir, 'colgado.cjs');
    writeFileSync(colgado, 'exports.PDFDocument = { load() { for (;;) {} } };');
    const t0 = Date.now();
    expect(
      await codigoDe(
        optimizarPdf(origen, path.join(dir, 'p.pdf'), { modulo: colgado, plazoMs: 500 }),
      ),
    ).toBe('herramientas.pdf_plazo');
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(existsSync(path.join(dir, 'p.pdf'))).toBe(false);
  });

  it('un hilo que no se puede crear da un código', async () => {
    const origen = path.join(dir, 'm.pdf');
    await pdfDeMuestra(origen, false);
    expect(
      await codigoDe(
        optimizarPdf(origen, path.join(dir, 'p.pdf'), { modulo: path.join(dir, 'no-existe.cjs') }),
      ),
    ).toBe('herramientas.pdf_invalido');
  });
});

describe('imágenes', () => {
  it('lee las dimensiones de la cabecera sin decodificar (PNG, GIF, BMP, JPEG, WebP, ICO)', () => {
    expect(dimensionesImagen(pngConCabecera(640, 480))).toEqual({
      tipo: 'png',
      ancho: 640,
      alto: 480,
    });
    const gif = Buffer.alloc(13);
    gif.write('GIF89a', 0, 'latin1');
    gif.writeUInt16LE(30, 6);
    gif.writeUInt16LE(20, 8);
    expect(dimensionesImagen(gif)).toEqual({ tipo: 'gif', ancho: 30, alto: 20 });
    const bmp = Buffer.alloc(30);
    bmp.write('BM', 0, 'latin1');
    bmp.writeUInt32LE(40, 14);
    bmp.writeInt32LE(50, 18);
    bmp.writeInt32LE(-60, 22);
    expect(dimensionesImagen(bmp)).toEqual({ tipo: 'bmp', ancho: 50, alto: 60 });
    const jpg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x64,
      0x00, 0xc8, 0x03,
    ]);
    expect(dimensionesImagen(jpg)).toEqual({ tipo: 'jpeg', ancho: 200, alto: 100 });
    const webp = Buffer.alloc(30);
    webp.write('RIFF', 0, 'latin1');
    webp.write('WEBP', 8, 'latin1');
    webp.write('VP8X', 12, 'latin1');
    webp.writeUIntLE(99, 24, 3);
    webp.writeUIntLE(49, 27, 3);
    expect(dimensionesImagen(webp)).toEqual({ tipo: 'webp', ancho: 100, alto: 50 });
    const ico = Buffer.alloc(22);
    ico.writeUInt16LE(1, 2);
    ico.writeUInt16LE(1, 4);
    ico[6] = 0; // 0 = 256
    ico[7] = 32;
    expect(dimensionesImagen(ico)).toEqual({ tipo: 'ico', ancho: 256, alto: 32 });
    expect(dimensionesImagen(Buffer.from('<svg></svg>'))).toBeNull();
    expect(dimensionesImagen(Buffer.alloc(0))).toBeNull();
  });

  it('rechaza una bomba de descompresión (PNG de 50000×50000) sin decodificarla', async () => {
    const bomba = path.join(dir, 'bomba.png');
    writeFileSync(bomba, pngConCabecera(50_000, 50_000));
    expect(await codigoDe(leerImagen(bomba))).toBe('herramientas.imagen_dimensiones');
    const ancha = path.join(dir, 'ancha.png');
    writeFileSync(ancha, pngConCabecera(LIMITES_IMAGEN.ladoMax + 1, 10));
    expect(await codigoDe(leerImagen(ancha))).toBe('herramientas.imagen_dimensiones');
    const grande = path.join(dir, 'grande.png');
    writeFileSync(grande, pngConCabecera(10_000, 10_000));
    expect(await codigoDe(leerImagen(grande))).toBe('herramientas.imagen_pixeles');
  });

  it('lee una imagen normal y rechaza lo que no es imagen o pesa de más', async () => {
    const ok = path.join(dir, 'ok.png');
    writeFileSync(ok, pngConCabecera(16, 16));
    const r = await leerImagen(ok);
    expect(r).toMatchObject({ nombre: 'ok.png', tipo: 'png', ancho: 16, alto: 16 });
    expect(r.bytes.byteLength).toBe(33);
    const falsa = path.join(dir, 'falsa.png');
    writeFileSync(falsa, 'no soy una imagen');
    expect(await codigoDe(leerImagen(falsa))).toBe('herramientas.imagen_tipo');
    const pesada = path.join(dir, 'pesada.png');
    writeFileSync(pesada, Buffer.concat([pngConCabecera(8, 8), Buffer.alloc(2000)]));
    expect(await codigoDe(leerImagen(pesada, { maxBytes: 1000 }))).toBe(
      'herramientas.imagen_grande',
    );
    expect(await codigoDe(leerImagen(dir))).toBe('herramientas.imagen_tipo');
    expect(await codigoDe(leerImagen(path.join(dir, 'no-existe.png')))).toBe(
      'herramientas.imagen_tipo',
    );
  });

  it('guarda solo si el contenido coincide con la extensión y nunca pisa', async () => {
    const png = pngConCabecera(16, 16);
    const destino = path.join(dir, 'salida.png');
    const r = await guardarImagen(destino, png);
    expect(r).toEqual({ archivo: destino, bytes: 33 });
    const r2 = await guardarImagen(destino, png);
    expect(path.basename(r2.archivo)).toBe('salida (1).png');
    expect(await codigoDe(guardarImagen(path.join(dir, 'x.ico'), png))).toBe(
      'herramientas.imagen_tipo',
    );
    expect(await codigoDe(guardarImagen(path.join(dir, 'x.exe'), png))).toBe(
      'herramientas.imagen_tipo',
    );
    expect(await codigoDe(guardarImagen(path.join(dir, 'x.png'), Buffer.from('MZ')))).toBe(
      'herramientas.imagen_tipo',
    );
    expect(await codigoDe(guardarImagen(path.join(dir, 'g.png'), png, { maxBytes: 10 }))).toBe(
      'herramientas.imagen_grande',
    );
    expect(readdirSync(dir).filter((n) => n.startsWith('g'))).toEqual([]);
  });
});
