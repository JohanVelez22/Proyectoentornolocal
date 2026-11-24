import { crc32 } from 'node:zlib';

/** Zip mínimo sin compresión (método 0). */
export function zip(archivos: Record<string, string>): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const n = Buffer.from(nombre);
    const d = Buffer.from(contenido);
    const crc = crc32(d);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0);
    l.writeUInt16LE(20, 4);
    l.writeUInt32LE(crc, 14);
    l.writeUInt32LE(d.length, 18);
    l.writeUInt32LE(d.length, 22);
    l.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(d.length, 20);
    c.writeUInt32LE(d.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    locales.push(l, n, d);
    centrales.push(c, n);
    offset += 30 + n.length + d.length;
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
