// Genera resources/icono.png (256x256) sin dependencias externas.
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const N = 256;
const crcTabla = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (b) => {
  let c = 0xffffffff;
  for (const x of b) c = crcTabla[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const trozo = (tipo, datos) => {
  const t = Buffer.from(tipo);
  const l = Buffer.alloc(4);
  l.writeUInt32BE(datos.length);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(Buffer.concat([t, datos])));
  return Buffer.concat([l, t, datos, c]);
};
const filas = [];
for (let y = 0; y < N; y++) {
  const fila = Buffer.alloc(1 + N * 4);
  for (let x = 0; x < N; x++) {
    const dx = x - N / 2 + 0.5;
    const dy = y - N / 2 + 0.5;
    const d = Math.hypot(dx, dy);
    const dentro = d < N / 2 - 8;
    // "E" estilizada en blanco sobre círculo azul
    const letra =
      (x > 88 && x < 112 && y > 80 && y < 176) ||
      (x >= 112 &&
        x < 170 &&
        ((y > 80 && y < 100) || (y > 118 && y < 138) || (y > 156 && y < 176)));
    const o = 1 + x * 4;
    if (!dentro) fila.writeUInt32BE(0, o);
    else if (letra) fila.writeUInt32BE(0xffffffff, o);
    else fila.writeUInt32BE(0x2563ebff, o);
  }
  filas.push(fila);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0);
ihdr.writeUInt32BE(N, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  trozo('IHDR', ihdr),
  trozo('IDAT', deflateSync(Buffer.concat(filas))),
  trozo('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('../resources/icono.png', import.meta.url), png);
