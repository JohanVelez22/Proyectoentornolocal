import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDeflate } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { esErrorWolf } from '../src/errores';
import { dimensionesImagen, leerImagen, LIMITES_IMAGEN } from '../src/herramientas/imagenes';
import { optimizarPdf, rutaDesempaquetada } from '../src/herramientas/pdf';
import { abrirNuevo } from '../src/herramientas/salidaNueva';
import { comprimirZip } from '../src/herramientas/zip';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-herr-d-rev-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

async function codigoDe(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (esErrorWolf(e)) return e.codigo;
    throw e;
  }
  return 'sin-error';
}

/** GIF con pantalla `pw`×`ph` y un cuadro en (`izq`, `arriba`) de `w`×`h`, con una extensión antes. */
function gif(pw: number, ph: number, w: number, h: number, izq = 0, arriba = 0): Buffer {
  const partes: number[][] = [];
  const le16 = (n: number): number[] => [n & 0xff, (n >> 8) & 0xff];
  partes.push([...Buffer.from('GIF89a', 'latin1')]);
  partes.push([...le16(pw), ...le16(ph), 0x80, 0, 0]); // con tabla global de 2 colores
  partes.push([0, 0, 0, 255, 255, 255]);
  partes.push([0x21, 0xf9, 0x04, 0, 0, 0, 0, 0]); // control de gráficos
  partes.push([0x21, 0xfe, 0x03, 0x61, 0x62, 0x63, 0]); // comentario
  partes.push([0x2c, ...le16(izq), ...le16(arriba), ...le16(w), ...le16(h), 0]);
  partes.push([2, 2, 0x44, 0x01, 0]); // datos LZW
  partes.push([0x3b]);
  return Buffer.from(partes.flat());
}

describe('GIF: las dimensiones son las del cuadro, no solo las de la pantalla', () => {
  it('una pantalla de 1×1 con un cuadro de 13000×13000 no salta el tope', async () => {
    const g = gif(1, 1, 13_000, 13_000);
    expect(dimensionesImagen(g)).toEqual({ tipo: 'gif', ancho: 13_000, alto: 13_000 });
    const ruta = path.join(dir, 'bomba.gif');
    writeFileSync(ruta, g);
    expect(await codigoDe(leerImagen(ruta))).toBe('herramientas.imagen_dimensiones');
  });

  it('usa izquierda+ancho y arriba+alto del cuadro', () => {
    expect(dimensionesImagen(gif(10, 10, 20, 5, 100, 7))).toEqual({
      tipo: 'gif',
      ancho: 120,
      alto: 12,
    });
  });

  it('un GIF normal sigue dando las dimensiones de su pantalla', async () => {
    expect(dimensionesImagen(gif(30, 20, 30, 20))).toEqual({ tipo: 'gif', ancho: 30, alto: 20 });
    const ruta = path.join(dir, 'ok.gif');
    writeFileSync(ruta, gif(30, 20, 30, 20));
    expect((await leerImagen(ruta)).ancho).toBe(30);
  });

  it('un GIF truncado o con bloques raros no cuelga ni revienta', () => {
    const g = gif(5, 5, 5, 5);
    for (let n = 13; n < g.length; n++) {
      const r = dimensionesImagen(g.subarray(0, n));
      expect(r === null || r.tipo === 'gif').toBe(true);
    }
    // Un bloque de extensión que nunca termina.
    const infinito = Buffer.concat([
      g.subarray(0, 19),
      Buffer.from([0x21, 0xfe, 0xff]),
      Buffer.alloc(300, 1),
    ]);
    expect(dimensionesImagen(infinito)?.tipo).toBe('gif');
  });
});

describe('imágenes: el área se distingue del lado', () => {
  it('10000×10000 cabe por lado pero no por área: código propio', async () => {
    const b = Buffer.alloc(33);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
    b.writeUInt32BE(13, 8);
    b.write('IHDR', 12, 'latin1');
    b.writeUInt32BE(10_000, 16);
    b.writeUInt32BE(10_000, 20);
    const ruta = path.join(dir, 'area.png');
    writeFileSync(ruta, b);
    expect(await codigoDe(leerImagen(ruta))).toBe('herramientas.imagen_pixeles');
    b.writeUInt32BE(LIMITES_IMAGEN.ladoMax + 1, 16);
    b.writeUInt32BE(10, 20);
    writeFileSync(ruta, b);
    expect(await codigoDe(leerImagen(ruta))).toBe('herramientas.imagen_dimensiones');
  });
});

describe('salidaNueva: errores de escritura con código propio', () => {
  it('una carpeta que no existe o un destino imposible dan herramientas.salida_denegada', async () => {
    expect(await codigoDe(abrirNuevo(path.join(dir, 'no-existe', 'a.zip')))).toBe(
      'herramientas.salida_denegada',
    );
  });
});

describe('comprimirZip (revisión)', () => {
  it('escribe en un .parcial y no deja restos ni pisa nada al terminar', async () => {
    const origen = path.join(dir, 'x.txt');
    writeFileSync(origen, 'x'.repeat(100));
    const destino = path.join(dir, 'x.zip');
    writeFileSync(destino, 'original');
    const r = await comprimirZip({ origenes: [origen], destino });
    expect(path.basename(r.archivo)).toBe('x (1).zip');
    expect(readFileSync(destino, 'utf8')).toBe('original');
    expect(readdirSync(dir).filter((n) => n.endsWith('.parcial'))).toEqual([]);
  });

  it('si falla a mitad no deja ni .parcial ni ZIP', async () => {
    const carpeta = path.join(dir, 'p');
    mkdirSync(carpeta);
    writeFileSync(path.join(carpeta, 'a.txt'), 'a'.repeat(1000));
    const destino = path.join(dir, 'p.zip');
    const codigo = await codigoDe(
      comprimirZip({
        origenes: [carpeta],
        destino,
        antesDeAbrir: async (abs) => {
          // El archivo cambia (otro tamaño y otro inodo) entre el recorrido y la lectura.
          const otro = path.join(dir, 'otro.txt');
          writeFileSync(otro, 'distinto'.repeat(50));
          renameSync(otro, abs);
        },
      }),
    );
    expect(codigo).toBe('herramientas.zip_cambio');
    expect(existsSync(destino)).toBe(false);
    expect(readdirSync(dir).filter((n) => n.endsWith('.parcial'))).toEqual([]);
  });

  it('cuenta en omitidos el ZIP de destino que está dentro de lo comprimido', async () => {
    const carpeta = path.join(dir, 'p');
    mkdirSync(carpeta);
    writeFileSync(path.join(carpeta, 'a.txt'), 'a');
    const destino = path.join(carpeta, 'p.zip');
    writeFileSync(destino, 'viejo');
    const r = await comprimirZip({ origenes: [carpeta], destino });
    expect(r.omitidos).toBe(1);
  });

  it('tiene un tope de carpetas', async () => {
    const raiz = path.join(dir, 'r');
    for (let i = 0; i < 6; i++) mkdirSync(path.join(raiz, `d${i}`), { recursive: true });
    writeFileSync(path.join(raiz, 'd0', 'a.txt'), 'a');
    expect(
      await codigoDe(
        comprimirZip({
          origenes: [raiz],
          destino: path.join(dir, 'r.zip'),
          limites: { carpetas: 3 },
        }),
      ),
    ).toBe('herramientas.zip_demasiados');
  });

  it.skipIf(process.platform === 'win32')(
    'un nombre con barra invertida (en POSIX) se omite y no rompe el ZIP',
    async () => {
      const carpeta = path.join(dir, 'p');
      mkdirSync(carpeta);
      writeFileSync(path.join(carpeta, 'bueno.txt'), 'ok');
      writeFileSync(path.join(carpeta, 'ma\\lo.txt'), 'no');
      const r = await comprimirZip({ origenes: [carpeta], destino: path.join(dir, 'p.zip') });
      expect(r.archivos).toBe(1);
      expect(r.omitidos).toBe(1);
    },
  );
});

/** PDF de ~1 MB con un flujo de objetos (ObjStm) que se infla a `megas` MB de ceros. */
async function pdfBomba(ruta: string, megas: number): Promise<number> {
  const z = createDeflate({ level: 9 });
  const trozos: Buffer[] = [];
  z.on('data', (d: Buffer) => trozos.push(d));
  const fin = new Promise<void>((r) => z.on('end', () => r()));
  const cero = Buffer.alloc(1024 * 1024);
  for (let i = 0; i < megas; i++) {
    if (!z.write(cero)) await new Promise((r) => z.once('drain', r));
  }
  z.end();
  await fin;
  const datos = Buffer.concat(trozos);
  const pdf = Buffer.concat([
    Buffer.from('%PDF-1.5\n4 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Filter /FlateDecode /Length '),
    Buffer.from(`${datos.length} >>\nstream\n`),
    datos,
    Buffer.from('\nendstream\nendobj\ntrailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n0\n%%EOF\n'),
  ]);
  writeFileSync(ruta, pdf);
  return pdf.length;
}

describe('optimizarPdf: bomba de flujo de objetos', () => {
  it('~1 MB que se infla a 1 GB da pdf_demasiado_complejo sin pasarse del tope de memoria', async () => {
    const origen = path.join(dir, 'bomba.pdf');
    const peso = await pdfBomba(origen, 1024);
    expect(peso).toBeLessThan(3 * 1024 * 1024);
    const rss0 = process.memoryUsage().rss;
    let pico = 0;
    const m = setInterval(() => (pico = Math.max(pico, process.memoryUsage().rss - rss0)), 20);
    try {
      expect(await codigoDe(optimizarPdf(origen, path.join(dir, 'o.pdf')))).toBe(
        'herramientas.pdf_demasiado_complejo',
      );
    } finally {
      clearInterval(m);
    }
    expect(pico).toBeLessThan(900 * 1024 * 1024);
    expect(existsSync(path.join(dir, 'o.pdf'))).toBe(false);
  }, 60_000);

  it('un tope de flujo más bajo corta antes (opción de pruebas)', async () => {
    const origen = path.join(dir, 'b.pdf');
    await pdfBomba(origen, 64);
    expect(await codigoDe(optimizarPdf(origen, path.join(dir, 'o.pdf'), { topeStreamMb: 8 }))).toBe(
      'herramientas.pdf_demasiado_complejo',
    );
  }, 60_000);

  it('el vigía de memoria externa (RSS) también corta con ese código', async () => {
    const origen = path.join(dir, 'm.pdf');
    writeFileSync(origen, Buffer.from('%PDF-1.4\n' + 'x'.repeat(100)));
    const gordo = path.join(dir, 'gordo.cjs');
    writeFileSync(
      gordo,
      'exports.PDFDocument = { async load() { globalThis.__b = Buffer.alloc(400 * 1024 * 1024, 1); await new Promise((r) => setTimeout(r, 5000)); } };',
    );
    expect(
      await codigoDe(
        optimizarPdf(origen, path.join(dir, 'o.pdf'), {
          modulo: gordo,
          crecimientoMb: 100,
          plazoMs: 20_000,
        }),
      ),
    ).toBe('herramientas.pdf_demasiado_complejo');
  }, 30_000);
});

describe('pdf-lib empaquetado', () => {
  it('el hilo recibe la ruta .asar.unpacked', () => {
    expect(
      rutaDesempaquetada('C:\\App\\resources\\app.asar\\node_modules\\pdf-lib\\cjs\\index.js'),
    ).toBe('C:\\App\\resources\\app.asar.unpacked\\node_modules\\pdf-lib\\cjs\\index.js');
    expect(rutaDesempaquetada('/a/app.asar/node_modules/pdf-lib/cjs/index.js')).toBe(
      '/a/app.asar.unpacked/node_modules/pdf-lib/cjs/index.js',
    );
    expect(rutaDesempaquetada('/a/node_modules/pdf-lib/cjs/index.js')).toBe(
      '/a/node_modules/pdf-lib/cjs/index.js',
    );
  });
});
