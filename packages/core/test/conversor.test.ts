import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import yazl from 'yazl';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CONVERSIONES,
  conversionesDisponibles,
  convertir as convertirBase,
  type ContextoConversor,
  type Formato,
} from '../src/conversor/conversor';
import { escribirCsv, leerCsv, neutralizarFormula } from '../src/conversor/csv';
import { sanitizarHtml } from '../src/conversor/markdown';
import { esErrorWolf } from '../src/errores';
import { ejecutarEnProceso } from '../src/conversor/operaciones';
import { PlataformaFalsa } from '../src/plataforma/falsa';

/** Las pruebas del núcleo usan el ejecutor sin aislamiento (doble de prueba). */
const convertir = (
  o: Parameters<typeof convertirBase>[0],
  senal?: AbortSignal,
  ctx: ContextoConversor = {},
) => convertirBase(o, senal, { ejecutor: ejecutarEnProceso, ...ctx });

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-conv-'));
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

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function docxXml(cuerpo: string, extra: Record<string, string> = {}): Promise<Buffer> {
  return zipDe({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="javascript:alert(1)" TargetMode="External"/></Relationships>`,
    'word/styles.xml': `<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="${NS}"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>`,
    'word/numbering.xml': `<?xml version="1.0" encoding="UTF-8"?><w:numbering xmlns:w="${NS}"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${cuerpo}</w:body></w:document>`,
    ...extra,
  });
}

const CUERPO_BASICO =
  '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Título uno</w:t></w:r></w:p>' +
  '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Elemento A</w:t></w:r></w:p>' +
  '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Elemento B</w:t></w:r></w:p>';

function escribir(nombre: string, datos: string | Buffer | Uint8Array): string {
  const r = path.join(dir, nombre);
  writeFileSync(r, datos);
  return r;
}

const salida = (nombre: string): string => path.join(dir, nombre);

describe('conversor: documentos válidos', () => {
  it('docx → md con un título y una lista', async () => {
    const origen = escribir('a.docx', await docxXml(CUERPO_BASICO));
    const r = await convertir({ origen, a: 'md', destino: salida('a.md') });
    const md = readFileSync(r.destino, 'utf8');
    expect(md).toMatch(/^# Título uno/m);
    expect(md).toMatch(/^- Elemento A/m);
    expect(md).toMatch(/^- Elemento B/m);
  });

  it('docx → html: sano, con CSP, y los enlaces peligrosos del documento no sobreviven', async () => {
    const cuerpo =
      CUERPO_BASICO +
      `<w:p><w:hyperlink r:id="rId9"><w:r><w:t>pincha</w:t></w:r></w:hyperlink></w:p>`;
    const origen = escribir('b.docx', await docxXml(cuerpo));
    const r = await convertir({ origen, a: 'html', destino: salida('b.html') });
    const html = readFileSync(r.destino, 'utf8');
    expect(html).toContain('<h1>Título uno</h1>');
    expect(html).toContain('Content-Security-Policy');
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/<script/i);
  });

  it('docx → txt', async () => {
    const origen = escribir('c.docx', await docxXml(CUERPO_BASICO));
    const r = await convertir({ origen, a: 'txt', destino: salida('c.txt') });
    expect(readFileSync(r.destino, 'utf8')).toContain('Elemento A');
  });

  it('xlsx → csv y csv → xlsx ida y vuelta', async () => {
    const csv = escribir('d.csv', 'nombre,cantidad\nmanzana,3\n"pera, verde",-5\n');
    const x = await convertir({ origen: csv, a: 'xlsx', destino: salida('d.xlsx') });
    expect(x.destino.endsWith('.xlsx')).toBe(true);
    const vuelta = await convertir({ origen: x.destino, a: 'csv', destino: salida('d2.csv') });
    const filas = leerCsv(readFileSync(vuelta.destino, 'utf8').replace(/^\uFEFF/, ''), {
      filas: 100,
      columnas: 100,
      celdas: 10_000,
    });
    expect(filas).toEqual([
      ['nombre', 'cantidad'],
      ['manzana', '3'],
      ['pera, verde', '-5'],
    ]);
  });

  it('pdf → txt', async () => {
    const doc = await PDFDocument.create();
    const fuente = await doc.embedFont(StandardFonts.Helvetica);
    doc.addPage().drawText('Hola desde el PDF', { x: 50, y: 700, size: 14, font: fuente });
    const origen = escribir('e.pdf', await doc.save());
    const r = await convertir({ origen, a: 'txt', destino: salida('e.txt') });
    expect(readFileSync(r.destino, 'utf8')).toContain('Hola desde el PDF');
  });

  it('md → html sin script, sin on* y sin javascript:', async () => {
    const md = [
      '# Hola',
      '',
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '[malo](javascript:alert(1))',
      '[malo2](JaVa&#x0A;ScRiPt:alert(2))',
      '![x](data:text/html;base64,PHNjcmlwdD4=)',
      '[bueno](https://ejemplo.test/)',
    ].join('\n');
    const origen = escribir('f.md', md);
    const r = await convertir({ origen, a: 'html', destino: salida('f.html') });
    const html = readFileSync(r.destino, 'utf8');
    const cuerpo = html.slice(html.indexOf('<body>'));
    expect(cuerpo).toContain('<h1>Hola</h1>');
    expect(cuerpo).toContain('href="https://ejemplo.test/"');
    expect(cuerpo).not.toMatch(/<script/i);
    expect(cuerpo).not.toMatch(/<[^>]*\son\w+=/i);
    expect(cuerpo).not.toMatch(/(href|src)="\s*java\s*script:/i);
    expect(cuerpo).not.toMatch(/<img|href="data:/i);
  });

  it('md → pdf y html → pdf usan el motor de impresión de la aplicación, con el HTML saneado', async () => {
    const recibidos: string[] = [];
    const ctx: ContextoConversor = {
      imprimirPdf: async (html) => {
        recibidos.push(html);
        return new TextEncoder().encode('%PDF-falso');
      },
    };
    const md = escribir('g.md', '# Título\n\n<script>x()</script>');
    const html = escribir('g.html', '<h1 onclick="x()">Hola</h1><script>y()</script>');
    await convertir({ origen: md, a: 'pdf', destino: salida('g1.pdf') }, undefined, ctx);
    await convertir({ origen: html, a: 'pdf', destino: salida('g2.pdf') }, undefined, ctx);
    expect(recibidos).toHaveLength(2);
    for (const h of recibidos) {
      expect(h).not.toMatch(/<script|onclick/i);
      expect(h).toContain('img-src data:;');
    }
    expect(readFileSync(salida('g1.pdf'), 'utf8')).toBe('%PDF-falso');
  });

  it('al imprimir a PDF se descartan las imágenes con dimensiones desorbitadas o de otro origen', async () => {
    const png = (ancho: number, alto: number): string => {
      const b = Buffer.alloc(33);
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
      b.writeUInt32BE(13, 8);
      b.write('IHDR', 12, 'latin1');
      b.writeUInt32BE(ancho, 16);
      b.writeUInt32BE(alto, 20);
      return `data:image/png;base64,${b.toString('base64')}`;
    };
    let html = '';
    const ctx: ContextoConversor = {
      imprimirPdf: async (h) => {
        html = h;
        return new Uint8Array([1]);
      },
    };
    const md = escribir(
      'h.md',
      `![ok](${png(10, 10)})\n\n![enorme](${png(60000, 60000)})\n\n![remota](https://ejemplo.test/a.png)`,
    );
    await convertir({ origen: md, a: 'pdf', destino: salida('h.pdf') }, undefined, ctx);
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).not.toContain('https://ejemplo.test/a.png');
  });

  it('el destino nunca se pisa y la extensión es la del formato pedido', async () => {
    const origen = escribir('i.md', '# a');
    writeFileSync(salida('i.html'), 'EXISTENTE');
    const r = await convertir({ origen, a: 'html', destino: salida('i.html') });
    expect(readFileSync(salida('i.html'), 'utf8')).toBe('EXISTENTE');
    expect(path.basename(r.destino)).toBe('i (1).html');
    const r2 = await convertir({ origen, a: 'html', destino: salida('i.bat') });
    expect(path.basename(r2.destino)).toBe('i.bat.html');
  });
});

describe('conversor: CSV y hojas de cálculo', () => {
  it('neutraliza fórmulas al escribir xlsx y csv, pero no los números', async () => {
    for (const p of ['=1+1', '+1+1', '-1+1', '@SUMA(A1)', '\t=1', '\r=1']) {
      expect(neutralizarFormula(p)).toBe(`'${p}`);
    }
    expect(neutralizarFormula('hola')).toBe('hola');
    const csv = escribir('j.csv', 'a,b\n"=HYPERLINK(""http://x.test"",""clic"")",-5\n@cmd,+x\n');
    const x = await convertir({ origen: csv, a: 'xlsx', destino: salida('j.xlsx') });
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.readFile(x.destino);
    const hoja = libro.worksheets[0]!;
    // En xlsx el valor no cambia: la celda es texto con quotePrefix.
    expect(hoja.getCell('A2').value).toBe('=HYPERLINK("http://x.test","clic")');
    expect(hoja.getCell('A2').numFmt).toBe('@');
    expect(hoja.getCell('B2').value).toBe(-5);
    expect(hoja.getCell('B2').numFmt).not.toBe('@');
    expect(hoja.getCell('A3').value).toBe('@cmd');
    expect(hoja.getCell('A3').numFmt).toBe('@');
    // Y el estilo de texto lleva quotePrefix (no se cambia el valor con un apóstrofo).
    const JSZipT = (await import('jszip')).default;
    const z = await JSZipT.loadAsync(readFileSync(x.destino));
    expect(await z.file('xl/styles.xml')!.async('string')).toMatch(
      /<xf[^>]*numFmtId="49"[^>]*quotePrefix="1"/,
    );
    expect(hoja.getCell('B3').value).toBe('+x');
    // Y al volver a CSV, un texto peligroso del xlsx también se neutraliza.
    const peligroso = new ExcelJS.Workbook();
    peligroso.addWorksheet('H').addRow(['=2+2', 7, 'ok']);
    const ruta = salida('k.xlsx');
    await peligroso.xlsx.writeFile(ruta);
    const v = await convertir({ origen: ruta, a: 'csv', destino: salida('k.csv') });
    expect(readFileSync(v.destino, 'utf8')).toContain("'=2+2,7,ok");
  });

  it('el CSV tiene tope de filas y de columnas', async () => {
    const filas = escribir('l.csv', 'a\n1\n2\n3\n4\n');
    expect(
      await codigoDe(
        convertir({ origen: filas, a: 'xlsx', destino: salida('l.xlsx') }, undefined, {
          limites: { filas: 3 },
        }),
      ),
    ).toBe('conversor.limite_filas');
    const cols = escribir('m.csv', 'a,b,c,d,e\n');
    expect(
      await codigoDe(
        convertir({ origen: cols, a: 'xlsx', destino: salida('m.xlsx') }, undefined, {
          limites: { columnas: 4 },
        }),
      ),
    ).toBe('conversor.limite_columnas');
    expect(existsSync(salida('l.xlsx'))).toBe(false);
  });

  it('un xlsx con más columnas o filas que el tope se rechaza', async () => {
    const libro = new ExcelJS.Workbook();
    const h = libro.addWorksheet('H');
    for (let i = 0; i < 6; i++) h.addRow([1, 2, 3, 4, 5, 6]);
    const ruta = salida('n.xlsx');
    await libro.xlsx.writeFile(ruta);
    expect(
      await codigoDe(
        convertir({ origen: ruta, a: 'csv', destino: salida('n1.csv') }, undefined, {
          limites: { columnas: 3 },
        }),
      ),
    ).toBe('conversor.limite_columnas');
    expect(
      await codigoDe(
        convertir({ origen: ruta, a: 'csv', destino: salida('n2.csv') }, undefined, {
          limites: { filas: 3 },
        }),
      ),
    ).toBe('conversor.limite_filas');
  });

  it('leerCsv entiende comillas, saltos dentro de campos, punto y coma y BOM', () => {
    expect(leerCsv('a;b\n"x;y";"l1\nl2"\n', { filas: 9, columnas: 9, celdas: 100 })).toEqual([
      ['a', 'b'],
      ['x;y', 'l1\nl2'],
    ]);
    expect(escribirCsv([['a,b', 'c"d', null, 1]])).toBe('\uFEFF"a,b","c""d",,1\r\n');
  });
});

/** Cambia el tamaño descomprimido declarado de la primera entrada en el directorio central. */
function declararTamano(zip: Buffer, tam: number): Buffer {
  const c = Buffer.from(zip);
  const i = c.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  c.writeUInt32LE(tam, i + 24);
  return c;
}

describe('conversor: documentos maliciosos', () => {
  it('ZIP bomba: una entrada de 1 GB declarada se rechaza sin descomprimir', async () => {
    const buen = await docxXml(CUERPO_BASICO);
    const origen = escribir('bomba.docx', declararTamano(buen, 1024 * 1024 * 1024));
    const t0 = Date.now();
    expect(await codigoDe(convertir({ origen, a: 'txt', destino: salida('x.txt') }))).toBe(
      'conversor.archivo_peligroso',
    );
    expect(Date.now() - t0).toBeLessThan(2000);
    expect(existsSync(salida('x.txt'))).toBe(false);
  });

  it('el tamaño declarado mentiroso (más chico que el real) se descubre al descomprimir', async () => {
    const buen = await docxXml(CUERPO_BASICO);
    const origen = escribir('miente.docx', declararTamano(buen, 3));
    expect(await codigoDe(convertir({ origen, a: 'txt', destino: salida('x.txt') }))).toBe(
      'conversor.archivo_peligroso',
    );
  });

  it('demasiadas entradas, demasiado descomprimido y proporción absurda', async () => {
    const muchas: Record<string, string> = {};
    for (let i = 0; i < 30; i++) muchas[`relleno/${i}.txt`] = 'x';
    const origen = escribir('muchas.docx', await docxXml(CUERPO_BASICO, muchas));
    expect(
      await codigoDe(
        convertir({ origen, a: 'txt', destino: salida('x.txt') }, undefined, {
          limites: { entradasZip: 20 },
        }),
      ),
    ).toBe('conversor.archivo_peligroso');
    const grande = escribir(
      'grande.docx',
      await docxXml(CUERPO_BASICO, { 'relleno/a.bin': 'a'.repeat(100_000) }),
    );
    expect(
      await codigoDe(
        convertir({ origen: grande, a: 'txt', destino: salida('y.txt') }, undefined, {
          limites: { bytesDescomprimidos: 50_000 },
        }),
      ),
    ).toBe('conversor.archivo_peligroso');
  });

  it('XXE y entidades: un XML con DOCTYPE o ENTITY se rechaza antes de llegar a la biblioteca', async () => {
    const xxe =
      '<?xml version="1.0"?><!DOCTYPE d [<!ENTITY x SYSTEM "file:///etc/passwd">]>' +
      `<w:document xmlns:w="${NS}"><w:body><w:p><w:r><w:t>&x;</w:t></w:r></w:p></w:body></w:document>`;
    const buen = await docxXml(CUERPO_BASICO);
    void buen;
    const origen = escribir('xxe.docx', await docxXml('', { 'word/document.xml': xxe }));
    expect(await codigoDe(convertir({ origen, a: 'txt', destino: salida('x.txt') }))).toBe(
      'conversor.archivo_peligroso',
    );
    // También en un xlsx y escondido tras mayúsculas mezcladas.
    const bombaLaughs = zipDe({
      'xl/workbook.xml': '<?xml version="1.0"?><!DoCtYpE l [<!EnTiTy a "aaaa">]><workbook/>',
    });
    const x = escribir('laughs.xlsx', await bombaLaughs);
    expect(await codigoDe(convertir({ origen: x, a: 'csv', destino: salida('x.csv') }))).toBe(
      'conversor.archivo_peligroso',
    );
  });

  it('un nombre de entrada con .. se rechaza', async () => {
    // yazl no deja crear ese nombre: se escribe uno de igual largo y se cambia en los bytes.
    const base = await zipDe({
      'word/document.xml': '<w:document/>',
      'aa/aa/fuera.txt': 'x',
    });
    const z = Buffer.from(base.toString('latin1').split('aa/aa/').join('../../'), 'latin1');
    const origen = escribir('trav.docx', z);
    const c = await codigoDe(convertir({ origen, a: 'txt', destino: salida('x.txt') }));
    expect(['conversor.archivo_peligroso', 'conversor.archivo_invalido']).toContain(c);
  });

  it('un archivo que no es un ZIP, o es un ZIP de otro tipo, es inválido', async () => {
    const mal = escribir('mal.docx', 'esto no es un zip');
    expect(await codigoDe(convertir({ origen: mal, a: 'txt', destino: salida('x.txt') }))).toBe(
      'conversor.archivo_invalido',
    );
    const otro = escribir('otro.xlsx', await zipDe({ 'hola.txt': 'x' }));
    expect(await codigoDe(convertir({ origen: otro, a: 'csv', destino: salida('x.csv') }))).toBe(
      'conversor.archivo_invalido',
    );
  });

  it('PDF malformado: sin cabecera, con cabecera y basura, o truncado → error con código, sin colgarse', async () => {
    const sinCabecera = escribir('s.pdf', 'hola');
    expect(
      await codigoDe(convertir({ origen: sinCabecera, a: 'txt', destino: salida('s.txt') })),
    ).toBe('conversor.archivo_invalido');
    const basura = escribir(
      'b.pdf',
      Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(500, 7)]),
    );
    expect(await codigoDe(convertir({ origen: basura, a: 'txt', destino: salida('b.txt') }))).toBe(
      'conversor.archivo_invalido',
    );
    const doc = await PDFDocument.create();
    doc.addPage();
    const bien = Buffer.from(await doc.save());
    const truncado = escribir('t.pdf', bien.subarray(0, Math.floor(bien.length / 2)));
    const c = await codigoDe(convertir({ origen: truncado, a: 'txt', destino: salida('t.txt') }));
    expect(['conversor.archivo_invalido', 'sin-error']).toContain(c);
  });

  it('PDF con más páginas que el tope se rechaza', async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 4; i++) doc.addPage();
    const origen = escribir('p.pdf', await doc.save());
    expect(
      await codigoDe(
        convertir({ origen, a: 'txt', destino: salida('p.txt') }, undefined, {
          limites: { paginasPdf: 3 },
        }),
      ),
    ).toBe('conversor.limite_paginas');
  });

  it('plazo vencido → conversor.plazo y se avisa al proceso de trabajo para que lo termine', async () => {
    const origen = escribir('q.pdf', Buffer.from('%PDF-1.4 x'));
    let senal: AbortSignal | undefined;
    const colgado: ContextoConversor = {
      ejecutor: (_m, o) => {
        senal = o.senal;
        return new Promise(() => undefined);
      },
      limites: { plazoMs: 50 },
    };
    expect(
      await codigoDe(
        convertirBase({ origen, a: 'txt', destino: salida('q.txt') }, undefined, colgado),
      ),
    ).toBe('conversor.plazo');
    expect(senal?.aborted).toBe(true);
    expect(existsSync(salida('q.txt'))).toBe(false);
  });

  it('cancelar con la señal corta la conversión', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const origen = escribir('r.pdf', await doc.save());
    const ac = new AbortController();
    const p = convertir({ origen, a: 'txt', destino: salida('r.txt') }, ac.signal);
    ac.abort();
    expect(await codigoDe(p)).toBe('conversor.cancelado');
  });

  it('un archivo demasiado grande se rechaza antes de leerlo', async () => {
    const origen = escribir('g.docx', await docxXml(CUERPO_BASICO));
    expect(
      await codigoDe(
        convertir({ origen, a: 'txt', destino: salida('x.txt') }, undefined, {
          limites: { bytesEntrada: 100 },
        }),
      ),
    ).toBe('conversor.archivo_grande');
  });
});

describe('conversor: sanitizarHtml', () => {
  it('quita scripts, estilos, manejadores y esquemas peligrosos, y escapa lo demás', () => {
    const sucio =
      '<p onclick="x()">hola<script>alert(1)</script></p><a href=" jav&#x61;script:alert(1)">a</a>' +
      '<a href="https://ok.test/">b</a><img src="x" onerror="y()"><iframe src="//e"></iframe><b <i>';
    const limpio = sanitizarHtml(sucio);
    expect(limpio).toContain('<p>hola</p>');
    expect(limpio).toContain('href="https://ok.test/"');
    expect(limpio).not.toMatch(/script|onclick|onerror|iframe|javascript/i);
  });
});

describe('conversor: LibreOffice y formatos disponibles', () => {
  it('sin LibreOffice, odt/pptx/doc no aparecen y convertir lo rechaza', async () => {
    const lista = conversionesDisponibles({ libreOffice: null, imprimirPdf: true });
    expect(lista.some((c) => c.motor === 'libreoffice')).toBe(false);
    expect(lista.some((c) => c.de === 'odt')).toBe(false);
    expect(lista.some((c) => c.de === 'md' && c.a === 'pdf')).toBe(true);
    expect(conversionesDisponibles({ libreOffice: null, imprimirPdf: false })).not.toContainEqual({
      de: 'md',
      a: 'pdf',
      motor: 'interno',
    });
    const origen = escribir('o.odt', await zipDe({ 'content.xml': '<a/>' }));
    expect(await codigoDe(convertir({ origen, a: 'pdf', destino: salida('o.pdf') }))).toBe(
      'conversor.libreoffice_ausente',
    );
    expect(
      await codigoDe(
        convertir({ origen: escribir('z.md', '#'), a: 'pdf', destino: salida('z.pdf') }),
      ),
    ).toBe('conversor.pdf_no_disponible');
    expect(
      await codigoDe(
        convertir({
          origen: escribir('w.md', '#'),
          a: 'docx' as Formato,
          destino: salida('w.docx'),
        }),
      ),
    ).toBe('conversor.formato');
  });

  it('con LibreOffice instalado aparecen, y se lanza sin shell con perfil temporal y una copia', async () => {
    const lista = conversionesDisponibles({
      libreOffice: 'C:\\LO\\soffice.exe',
      imprimirPdf: false,
    });
    expect(lista.some((c) => c.de === 'odt' && c.a === 'docx')).toBe(true);
    const origen = escribir('p.odt', await zipDe({ 'content.xml': '<a/>' }));
    let llamada: { exe: string; args: string[] } | null = null;
    const r = await convertir({ origen, a: 'pdf', destino: salida('p.pdf') }, undefined, {
      libreOffice: 'C:\\LO\\soffice.exe',
      lanzarLibreOffice: async (exe, args) => {
        llamada = { exe, args };
        const outdir = args[args.indexOf('--outdir') + 1]!;
        const entrada = args[args.length - 1]!;
        const { mkdirSync, writeFileSync: w } = await import('node:fs');
        mkdirSync(outdir, { recursive: true });
        w(path.join(outdir, 'entrada.pdf'), `PDF de ${path.basename(entrada)}`);
        return { codigo: 0, vencio: false };
      },
    });
    expect(readFileSync(r.destino, 'utf8')).toBe('PDF de entrada.odt');
    expect(llamada!.exe).toBe('C:\\LO\\soffice.exe');
    expect(llamada!.args).toContain('--headless');
    expect(llamada!.args.some((a) => a.startsWith('-env:UserInstallation=file:'))).toBe(true);
    expect(llamada!.args).not.toContain(origen);
    // El temporal se borra.
    expect(existsSync(path.dirname(llamada!.args[llamada!.args.length - 1]!))).toBe(false);
  });

  it('LibreOffice que vence el plazo o falla → códigos', async () => {
    const origen = escribir('q.odt', await zipDe({ 'content.xml': '<a/>' }));
    const base = { libreOffice: 'x' };
    expect(
      await codigoDe(
        convertir({ origen, a: 'pdf', destino: salida('q1.pdf') }, undefined, {
          ...base,
          lanzarLibreOffice: async () => ({ codigo: null, vencio: true }),
        }),
      ),
    ).toBe('conversor.plazo');
    expect(
      await codigoDe(
        convertir({ origen, a: 'pdf', destino: salida('q2.pdf') }, undefined, {
          ...base,
          lanzarLibreOffice: async () => ({ codigo: 1, vencio: false }),
        }),
      ),
    ).toBe('conversor.libreoffice_fallo');
  });

  it('la plataforma falsa no tiene LibreOffice por omisión', async () => {
    const p = new PlataformaFalsa();
    expect(await p.libreOffice()).toBeNull();
    expect(CONVERSIONES.every((c) => c.de !== c.a)).toBe(true);
  });
});

describe('PlataformaWindows.libreOffice', () => {
  it('encuentra soffice en Program Files (solo mira archivos) o devuelve null', async () => {
    const { PlataformaWindows } = await import('../src/plataforma/win');
    const soffice = String.raw`C:\Program Files\LibreOffice\program\soffice.exe`;
    const con = new PlataformaWindows(undefined, undefined, {
      entorno: { ProgramFiles: String.raw`C:\Program Files` },
      existeRuta: (r) => r === soffice,
    });
    expect(await con.libreOffice()).toBe(soffice);
    const sin = new PlataformaWindows(undefined, undefined, {
      entorno: { ProgramFiles: String.raw`C:\Program Files` },
      existeRuta: () => false,
    });
    expect(await sin.libreOffice()).toBeNull();
  });
});
