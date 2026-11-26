import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PREFERENCIAS_IMPRESION, permitirSolicitud } from '../src/main/conversorPdfConfig';

describe('impresión a PDF del conversor', () => {
  it('la ventana no tiene Node, ni JavaScript, y va aislada y en una sesión temporal', () => {
    expect(PREFERENCIAS_IMPRESION.nodeIntegration).toBe(false);
    expect(PREFERENCIAS_IMPRESION.javascript).toBe(false);
    expect(PREFERENCIAS_IMPRESION.sandbox).toBe(true);
    expect(PREFERENCIAS_IMPRESION.contextIsolation).toBe(true);
    expect(PREFERENCIAS_IMPRESION.webSecurity).toBe(true);
    expect(PREFERENCIAS_IMPRESION.partition.startsWith('persist:')).toBe(false);
  });

  it('solo se deja cargar el archivo temporal y data:', () => {
    const f = 'file:///tmp/x/documento.html';
    expect(permitirSolicitud(f, f)).toBe(true);
    expect(permitirSolicitud('data:image/png;base64,AAAA', f)).toBe(true);
    for (const u of [
      'https://ejemplo.test/a.png',
      'http://127.0.0.1:3000/',
      'file:///etc/passwd',
      'ftp://x/y',
      'file:///tmp/x/otro.html',
    ]) {
      expect(permitirSolicitud(u, f), u).toBe(false);
    }
  });

  it('el conversor no hace peticiones de red (ni fetch ni sockets en su código)', () => {
    const dir = path.join(__dirname, '..', '..', '..', 'packages', 'core', 'src', 'conversor');
    for (const n of readdirSync(dir)) {
      const t = readFileSync(path.join(dir, n), 'utf8');
      expect(t, n).not.toMatch(/\bfetch\s*\(|node:(https?|net|dgram|tls)|XMLHttpRequest|WebSocket/);
    }
  });
});
