import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PREFERENCIAS_IMPRESION,
  crearRegistroPermitidos,
  instalarFiltro,
  permitirSolicitud,
} from '../src/main/conversorPdfConfig';

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

  it('dos impresiones a la vez: un solo filtro de sesión y cada una solo carga lo suyo', () => {
    const registro = crearRegistroPermitidos();
    let filtro: ((d: { url: string }, cb: (r: { cancel: boolean }) => void) => void) | null = null;
    let registros = 0;
    const ses = {
      webRequest: {
        onBeforeRequest(f: NonNullable<typeof filtro>) {
          registros++;
          filtro = f;
        },
      },
    };
    const cancela = (url: string): boolean => {
      let cancel = false;
      filtro!({ url }, (r) => (cancel = r.cancel));
      return cancel;
    };
    const a = 'file:///tmp/a/documento.html';
    const b = 'file:///tmp/b/documento.html';
    // Impresión A empieza; B empieza mientras A sigue cargando.
    instalarFiltro(ses, registro);
    const quitarA = registro.permitir(a);
    instalarFiltro(ses, registro);
    const quitarB = registro.permitir(b);
    expect(registros).toBe(1); // no se vuelve a registrar (reemplazaría el de la otra)
    expect(cancela(a)).toBe(false);
    expect(cancela(b)).toBe(false);
    expect(cancela('data:image/png;base64,AAAA')).toBe(false);
    expect(cancela('https://ejemplo.test/x.png')).toBe(true);
    expect(cancela('file:///etc/passwd')).toBe(true);
    // A termina: B sigue permitida y A ya no.
    quitarA();
    quitarA(); // idempotente
    expect(cancela(a)).toBe(true);
    expect(cancela(b)).toBe(false);
    quitarB();
    expect(cancela(b)).toBe(true);
  });
});
