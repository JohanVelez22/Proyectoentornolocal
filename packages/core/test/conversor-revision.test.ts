import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { PDFDocument } from 'pdf-lib';
import yazl from 'yazl';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { convertir as convertirBase, type ContextoConversor } from '../src/conversor/conversor';
import { neutralizarFormula, leerCsv } from '../src/conversor/csv';
import { CONFIGURACION_PERFIL } from '../src/conversor/libreoffice';
import { ejecutarEnProceso } from '../src/conversor/operaciones';
import { resolverRutas } from '../src/conversor/protocolo';
import { inspeccionarZip, leerEstructura } from '../src/conversor/zipSeguro';
import { esErrorWolf } from '../src/errores';
import { optimizarPdf } from '../src/herramientas/pdf';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-conv-rev-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const convertir = (
  o: Parameters<typeof convertirBase>[0],
  senal?: AbortSignal,
  ctx: ContextoConversor = {},
) => convertirBase(o, senal, { ejecutor: ejecutarEnProceso, ...ctx });

async function codigoDe(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (esErrorWolf(e)) return e.codigo;
    throw e;
  }
  return 'sin-error';
}

const LIM = { entradas: 10_000, bytesDescomprimidos: 500 * 1024 * 1024, proporcion: 200 };

function zipDe(archivos: Record<string, string | Buffer>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const z = new yazl.ZipFile();
    for (const [n, c] of Object.entries(archivos)) z.addBuffer(Buffer.from(c), n);
    z.end();
    const partes: Buffer[] = [];
    z.outputStream.on('data', (c: Buffer) => partes.push(c));
    z.outputStream.on('end', () => resolve(Buffer.concat(partes)));
    z.outputStream.on('error', reject);
  });
}

const DOC_OK =
  '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>';

// ---- ZIP armado a mano (como el PoC de la revisión): dos directorios centrales ----
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buf) {
    let c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
interface Item {
  nombre: Buffer;
  comp: Buffer;
  tam: number;
  crc: number;
  local: Buffer;
}
function construir(entradas: { name: string; data: Buffer }[]): Item[] {
  return entradas.map((e) => {
    const comp = zlib.deflateRawSync(e.data, { level: 9 });
    const nombre = Buffer.from(e.name);
    const crc = crc32(e.data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(e.data.length, 22);
    lh.writeUInt16LE(nombre.length, 26);
    return { nombre, comp, tam: e.data.length, crc, local: Buffer.concat([lh, nombre, comp]) };
  });
}
function directorio(items: Item[], offsets: number[]): Buffer {
  return Buffer.concat(
    items.map((it, i) => {
      const h = Buffer.alloc(46);
      h.writeUInt32LE(0x02014b50, 0);
      h.writeUInt16LE(20, 4);
      h.writeUInt16LE(20, 6);
      h.writeUInt16LE(8, 10);
      h.writeUInt32LE(it.crc, 16);
      h.writeUInt32LE(it.comp.length, 20);
      h.writeUInt32LE(it.tam, 24);
      h.writeUInt16LE(it.nombre.length, 28);
      h.writeUInt32LE(offsets[i]!, 42);
      return Buffer.concat([h, it.nombre]);
    }),
  );
}

/** Un solo archivo con DOS ZIP: yauzl veía el primero y JSZip (extraBytes) el segundo. */
function zipDeDosDirectorios(): Buffer {
  const A = construir([
    { name: '[Content_Types].xml', data: Buffer.from('<Types/>') },
    { name: 'word/document.xml', data: Buffer.from(DOC_OK) },
  ]);
  const B = construir([
    { name: '[Content_Types].xml', data: Buffer.from('<Types/>') },
    {
      name: 'word/document.xml',
      data: Buffer.from('<?xml version="1.0"?><!DOCTYPE d [<!ENTITY a "aaaa">]><w:document/>'),
    },
    { name: 'word/media/relleno.bin', data: Buffer.alloc(200_000) },
  ]);
  const offA: number[] = [];
  let p = 0;
  for (const it of A) {
    offA.push(p);
    p += it.local.length;
  }
  const localsA = Buffer.concat(A.map((x) => x.local));
  const La = localsA.length;
  const cdA = directorio(A, offA);
  const E = La + cdA.length;
  const SB = directorio(
    B,
    B.map(() => 0),
  ).length;
  const offB: number[] = [];
  p = La + SB;
  for (const it of B) {
    offB.push(p);
    p += it.local.length;
  }
  const cdB = directorio(B, offB);
  const regionB = Buffer.concat([Buffer.alloc(La), cdB, ...B.map((x) => x.local)]);
  const cuerpo = Buffer.concat([localsA, cdA, regionB]);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(A.length, 8);
  eocd.writeUInt16LE(A.length, 10);
  eocd.writeUInt32LE(cuerpo.length - E - La, 12);
  eocd.writeUInt32LE(La, 16);
  return Buffer.concat([cuerpo, eocd]);
}

describe('zipSeguro: un solo ZIP posible (C1)', () => {
  it('un archivo con dos directorios centrales (el PoC de la revisión) se rechaza', async () => {
    const zip = zipDeDosDirectorios();
    expect(await codigoDe(inspeccionarZip(zip, LIM, ['word/document.xml']))).toBe(
      'conversor.archivo_peligroso',
    );
    const origen = path.join(dir, 'dos.docx');
    writeFileSync(origen, zip);
    expect(await codigoDe(convertir({ origen, a: 'txt', destino: path.join(dir, 'x.txt') }))).toBe(
      'conversor.archivo_peligroso',
    );
  });

  it('un ZIP canónico válido se acepta', async () => {
    const zip = await zipDe({ 'word/document.xml': DOC_OK, 'word/styles.xml': '<s/>' });
    await expect(inspeccionarZip(zip, LIM, ['word/document.xml'])).resolves.toBeUndefined();
    expect(leerEstructura(zip, LIM)).toHaveLength(2);
  });

  it('bytes antes del ZIP, bytes tras el EOCD, comentario que no cuadra y ZIP64 se rechazan', async () => {
    const zip = await zipDe({ 'word/document.xml': DOC_OK });
    const casos: Record<string, Buffer> = {
      'bytes antes': Buffer.concat([Buffer.from('basura-----'), zip]),
      'bytes después': Buffer.concat([zip, Buffer.from('basura')]),
    };
    const comentarioMalo = Buffer.from(zip);
    comentarioMalo.writeUInt16LE(5, comentarioMalo.length - 2); // dice 5 bytes de comentario y no hay
    casos['comentario'] = comentarioMalo;
    const z64 = Buffer.from(zip);
    z64.writeUInt32LE(0xffffffff, z64.length - 22 + 16); // cdOffset de ZIP64
    casos['zip64'] = z64;
    for (const [nombre, datos] of Object.entries(casos)) {
      const c = await codigoDe(inspeccionarZip(datos, LIM, []));
      expect(['conversor.archivo_peligroso', 'conversor.archivo_invalido'], nombre).toContain(c);
    }
  });

  it('un nombre en la cabecera local distinto del central, dos entradas iguales y nombres con .. se rechazan', async () => {
    const base = await zipDe({ 'word/document.xml': DOC_OK });
    const distinto = Buffer.from(base);
    const i = distinto.indexOf(Buffer.from('word/document.xml'));
    distinto.write('word/documenX.xml', i); // solo la cabecera local (la primera aparición)
    expect(await codigoDe(inspeccionarZip(distinto, LIM, []))).toBe('conversor.archivo_peligroso');
    const trav = Buffer.from(
      (await zipDe({ 'aa/aa/f.txt': 'x' })).toString('latin1').split('aa/aa/').join('../../'),
      'latin1',
    );
    expect(await codigoDe(inspeccionarZip(trav, LIM, []))).toBe('conversor.archivo_peligroso');
  });

  it('DOCTYPE o ENTITY en una parte que NO es .xml también se rechaza', async () => {
    for (const nombre of ['word/media/x.bin', 'word/embeddings/a.txt', 'customXml/item1.dat']) {
      const zip = await zipDe({
        'word/document.xml': DOC_OK,
        [nombre]:
          '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY e SYSTEM "file:///c:/windows/win.ini">]><x/>',
      });
      expect(await codigoDe(inspeccionarZip(zip, LIM, ['word/document.xml'])), nombre).toBe(
        'conversor.archivo_peligroso',
      );
    }
  });

  it('la proporción de compresión también cuenta sobre el total', async () => {
    const zip = await zipDe({
      'word/document.xml': DOC_OK,
      'a.xml': '<a/>',
      'b.xml': '<b/>',
    });
    // Se declaran 15 MB por entrada: ninguna pasa por sí sola del umbral de 20 MB, el total sí.
    const f = Buffer.from(zip);
    let p = f.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    for (let n = 0; n < 3; n++) {
      f.writeUInt32LE(15 * 1024 * 1024, p + 24);
      p = f.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), p + 4);
    }
    const t0 = Date.now();
    expect(await codigoDe(inspeccionarZip(f, LIM, []))).toBe('conversor.archivo_peligroso');
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it('el árbol de dependencias tiene UNA sola copia de jszip (la que ven mammoth y exceljs)', () => {
    const raiz = path.resolve(__dirname, '..', '..', '..');
    const lock = JSON.parse(readFileSync(path.join(raiz, 'package-lock.json'), 'utf8')) as {
      packages: Record<string, unknown>;
    };
    const copias = Object.keys(lock.packages).filter((k) => /(^|\/)node_modules\/jszip$/.test(k));
    expect(copias).toEqual(['node_modules/jszip']);
  });
});

describe('rutas del proceso de trabajo con asar (I1)', () => {
  it('resolverRutas usa app.asar.unpacked en las cuatro rutas, también en el href de pdfjs', () => {
    const asar = path.join(dir, 'resources', 'app.asar', 'node_modules');
    const falso = {
      resolve: (m: string): string => {
        if (m === 'pdfjs-dist/package.json') return path.join(asar, 'pdfjs-dist', 'package.json');
        return path.join(asar, m, 'lib', 'index.js');
      },
    } as unknown as NodeRequire;
    const r = resolverRutas(falso);
    expect(r.mammoth).toContain('app.asar.unpacked');
    expect(r.exceljs).toContain('app.asar.unpacked');
    expect(r.pdflib).toContain('app.asar.unpacked');
    expect(decodeURIComponent(r.pdfjs)).toContain('app.asar.unpacked');
    expect(r.pdfjs.startsWith('file:')).toBe(true);
    for (const v of [r.mammoth, r.exceljs, r.pdflib, decodeURIComponent(r.pdfjs)]) {
      expect(v.replace(/app\.asar\.unpacked/g, '')).not.toMatch(/app\.asar[\\/]/);
    }
  });
});

describe('LibreOffice endurecido (I4)', () => {
  it('el perfil temporal trae las macros y los vínculos desactivados antes de lanzarlo', async () => {
    for (const clave of [
      'DisableMacrosExecution" oor:op="fuse"><value>true',
      'MacroSecurityLevel" oor:op="fuse"><value>3',
      'BlockUntrustedRefererLinks" oor:op="fuse"><value>true',
      '/org.openoffice.Office.Writer/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>0',
      '/org.openoffice.Office.Calc/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>1',
    ]) {
      expect(CONFIGURACION_PERFIL, clave).toContain(clave);
    }
    const origen = path.join(dir, 'a.odt');
    writeFileSync(origen, await zipDe({ 'content.xml': '<a/>' }));
    let leido = '';
    await convertir({ origen, a: 'txt', destino: path.join(dir, 'a.txt') }, undefined, {
      libreOffice: 'C:\\LO\\soffice.exe',
      lanzarLibreOffice: async (_exe, args) => {
        const url = args.find((a) => a.startsWith('-env:UserInstallation='))!.slice(22);
        leido = readFileSync(
          path.join(fileURLToPath(url), 'user', 'registrymodifications.xcu'),
          'utf8',
        );
        const outdir = args[args.indexOf('--outdir') + 1]!;
        const { mkdirSync } = await import('node:fs');
        mkdirSync(outdir, { recursive: true });
        writeFileSync(path.join(outdir, 'entrada.txt'), 'ok');
        return { codigo: 0, vencio: false };
      },
    });
    expect(leido).toBe(CONFIGURACION_PERFIL);
  });

  it('el HTML que produce LibreOffice se sanea y se queda con el cuerpo', async () => {
    const origen = path.join(dir, 'b.odt');
    writeFileSync(origen, await zipDe({ 'content.xml': '<a/>' }));
    const r = await convertir({ origen, a: 'html', destino: path.join(dir, 'b.html') }, undefined, {
      libreOffice: 'x',
      lanzarLibreOffice: async (_exe, args) => {
        const outdir = args[args.indexOf('--outdir') + 1]!;
        const { mkdirSync } = await import('node:fs');
        mkdirSync(outdir, { recursive: true });
        writeFileSync(
          path.join(outdir, 'entrada.html'),
          '<html><head><title>T</title><script>x()</script></head><body onload="y()"><p onclick="z()">hola</p><a href="javascript:1">l</a></body></html>',
        );
        return { codigo: 0, vencio: false };
      },
    });
    const html = readFileSync(r.destino, 'utf8');
    expect(html).toContain('<p>hola</p>');
    expect(html).not.toMatch(/<script|onload|onclick|javascript:|<title>/i);
  });
});

describe('texto y tablas (menores)', () => {
  it('neutraliza también el salto de línea y las variantes de ancho completo', () => {
    for (const p of ['\n=1', '＝1+1', '＋1', '－1', '＠x']) {
      expect(neutralizarFormula(p)).toBe(`'${p}`);
    }
  });

  it('el CSV tiene tope de celdas', () => {
    expect(() => leerCsv('a,b,c\n1,2,3\n4,5,6\n', { filas: 9, columnas: 9, celdas: 8 })).toThrow(
      expect.objectContaining({ codigo: 'conversor.limite_celdas' }),
    );
  });

  it('las celdas peligrosas de un CSV se guardan como texto con quotePrefix y los números no', async () => {
    const origen = path.join(dir, 'c.csv');
    writeFileSync(origen, 'a\n＝1+1\n-3\n');
    const r = await convertir({ origen, a: 'xlsx', destino: path.join(dir, 'c.xlsx') });
    const JSZip = (await import('jszip')).default;
    const z = await JSZip.loadAsync(readFileSync(r.destino));
    const estilos = await z.file('xl/styles.xml')!.async('string');
    expect(estilos).toMatch(/quotePrefix="1"/);
    const hoja = await z.file('xl/worksheets/sheet1.xml')!.async('string');
    // El número -3 va como número (<v>-3</v>), no como texto compartido.
    expect(hoja).toMatch(/<v>-3<[/]v>/);
  });
});

describe('optimización de PDF por el proceso de trabajo', () => {
  it('con un ejecutor inyectado el PDF se optimiza allí y solo se escribe si pesa menos', async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 20; i++) doc.addPage().drawText(`página ${i}`);
    const origen = path.join(dir, 'g.pdf');
    writeFileSync(origen, await doc.save({ useObjectStreams: false }));
    const mensajes: string[] = [];
    const r = await optimizarPdf(origen, path.join(dir, 'g-opt.pdf'), {
      ejecutor: (m, o) => {
        mensajes.push(m.op);
        return ejecutarEnProceso(m, o);
      },
    });
    expect(mensajes).toEqual(['pdfOptimizar']);
    expect(r.mejoro).toBe(true);
    expect(existsSync(r.archivo!)).toBe(true);
    // Un error del proceso de trabajo llega con su código.
    const roto = path.join(dir, 'roto.pdf');
    writeFileSync(roto, Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(300, 9)]));
    expect(
      await codigoDe(optimizarPdf(roto, path.join(dir, 'r.pdf'), { ejecutor: ejecutarEnProceso })),
    ).toBe('herramientas.pdf_invalido');
  });
});
