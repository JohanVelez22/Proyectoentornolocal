import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { extraerZip } from '../src/catalogo/zip';

/** Zip con entradas comprimidas (deflate, método 8), como los de nginx.org y windows.php.net. */
function zipDeflate(archivos: Record<string, Buffer | string>): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const n = Buffer.from(nombre);
    const d = Buffer.isBuffer(contenido) ? contenido : Buffer.from(contenido);
    const dir = nombre.endsWith('/');
    const c0 = dir ? Buffer.alloc(0) : deflateRawSync(d);
    const metodo = dir ? 0 : 8;
    const crc = dir ? 0 : crc32(d);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0);
    l.writeUInt16LE(20, 4);
    l.writeUInt16LE(0x800, 6); // nombres en UTF-8
    l.writeUInt16LE(metodo, 8);
    l.writeUInt32LE(crc, 14);
    l.writeUInt32LE(c0.length, 18);
    l.writeUInt32LE(dir ? 0 : d.length, 22);
    l.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(0x800, 8);
    c.writeUInt16LE(metodo, 10);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(c0.length, 20);
    c.writeUInt32LE(dir ? 0 : d.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    locales.push(l, n, c0);
    centrales.push(c, n);
    offset += 30 + n.length + c0.length;
  }
  const cd = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  const total = Object.keys(archivos).length;
  fin.writeUInt16LE(total, 8);
  fin.writeUInt16LE(total, 10);
  fin.writeUInt32LE(cd.length, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, cd, fin]);
}

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-zip-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const aleatorio = (n: number): Buffer => {
  const b = Buffer.alloc(n);
  let x = 12345;
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    b[i] = x & 0xff;
  }
  return b;
};

describe('extraerZip', () => {
  it('extrae un zip real con carpetas y archivos comprimidos grandes', async () => {
    const grande = aleatorio(3 * 1024 * 1024);
    const archivos: Record<string, Buffer | string> = {
      'nginx-1.30.6/': '',
      'nginx-1.30.6/conf/': '',
      'nginx-1.30.6/conf/mime.types': 'types {}\n'.repeat(500),
      'nginx-1.30.6/nginx.exe': grande,
    };
    for (let i = 0; i < 40; i++)
      archivos[`nginx-1.30.6/html/p${i}.html`] = `pagina ${i}`.repeat(200);
    const archivo = path.join(dir, 'a.zip');
    writeFileSync(archivo, zipDeflate(archivos));
    const destino = path.join(dir, 'salida con espacio Ñ');
    await extraerZip(archivo, destino);
    expect(readFileSync(path.join(destino, 'nginx-1.30.6', 'nginx.exe')).equals(grande)).toBe(true);
    expect(readFileSync(path.join(destino, 'nginx-1.30.6', 'html', 'p39.html'), 'utf8')).toBe(
      'pagina 39'.repeat(200),
    );
    expect(existsSync(path.join(destino, 'nginx-1.30.6', 'conf', 'mime.types'))).toBe(true);
  }, 20_000);

  it('rechaza entradas que escapan de la carpeta destino (zip-slip)', async () => {
    const archivo = path.join(dir, 'malo.zip');
    writeFileSync(archivo, zipDeflate({ 'ok.txt': 'bien', '../fuera.txt': 'mal' }));
    await expect(extraerZip(archivo, path.join(dir, 'salida'))).rejects.toThrow();
    expect(existsSync(path.join(dir, 'fuera.txt'))).toBe(false);
  });

  it('rechaza rutas absolutas dentro del zip', async () => {
    const archivo = path.join(dir, 'abs.zip');
    writeFileSync(archivo, zipDeflate({ 'C:/Windows/x.txt': 'mal' }));
    await expect(extraerZip(archivo, path.join(dir, 'salida'))).rejects.toThrow();
  });

  it('falla con un archivo que no es zip', async () => {
    const archivo = path.join(dir, 'roto.zip');
    writeFileSync(archivo, 'esto no es un zip');
    await expect(extraerZip(archivo, path.join(dir, 'salida'))).rejects.toThrow();
  });
});
