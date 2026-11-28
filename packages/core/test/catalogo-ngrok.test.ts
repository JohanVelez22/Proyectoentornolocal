import { describe, expect, it } from 'vitest';
import { catalogo, ejecutableDe, urlIndice, urlOficial } from '../src/catalogo/catalogo';
import { INDICE_NGROK, fuenteNgrok, interpretarArchivoNgrok } from '../src/catalogo/fuentes/ngrok';
import { IndiceMalformado, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import { huellaFuerte } from '../src/catalogo/huellas';
import { esServicioVersiones, INTERRUPTOR } from '../src/catalogo/tablaVersiones';
import { FUENTES_VERSIONES } from '../src/catalogo/vivo';
import { fetchFalso, fixture, HOY } from './catalogo-falso';

// ngrok en el catálogo (D54b): versión estable, zip versionado de bin.equinox.io y el SHA-256 del
// archivo oficial de descargas de ngrok (https://dl.equinox.io/ngrok/ngrok-v3/stable/archive), que
// su FAQ cita como la fuente de las huellas. Sin red: el fixture es un recorte real del archivo.

const ctx = (cuerpo: string | undefined): ContextoFuente & { pedidas: string[] } => {
  const ff = fetchFalso(cuerpo === undefined ? {} : { [INDICE_NGROK]: cuerpo });
  return { f: ff.f, idCatalogo: 'win-x64', ahora: HOY, pedidas: ff.pedidas };
};

describe('fuente de ngrok', () => {
  it('lee versión, URL oficial y SHA-256 de Windows x64 (ignora ARM64), de la más nueva a la más vieja', async () => {
    const c = ctx(fixture('ngrok-archivo.html'));
    const v = await fuenteNgrok.listar(c);
    expect(c.pedidas).toEqual([INDICE_NGROK]);
    expect(v.map((x) => x.version)).toEqual(['3.39.13', '3.39.12', '3.39.11']);
    expect(v[0]).toMatchObject({
      servicio: 'ngrok',
      version: '3.39.13',
      rama: '3.39',
      url: 'https://bin.equinox.io/a/VUnfuMhAnU/ngrok-v3-3.39.13-windows-amd64.zip',
      sha256: '438bad3dbefd7e244be9dfae3889dcf99073b515845b66ab5617e4887bc24636',
      huella: {
        algoritmo: 'sha256',
        valor: '438bad3dbefd7e244be9dfae3889dcf99073b515845b66ab5617e4887bc24636',
      },
      formato: 'zip',
      ejecutable: 'ngrok.exe',
      origen: 'vivo',
    });
    expect(huellaFuerte(v[0]!.huella ?? null)).toBe(true);
    for (const x of v) {
      expect(urlOficial(x.url)).toBe(true);
      expect(x.url).not.toContain('arm64');
    }
  });

  it('para otro sistema devuelve una lista vacía sin pedir nada', async () => {
    const c = { ...ctx(fixture('ngrok-archivo.html')), idCatalogo: 'win-arm64' as never };
    expect(await fuenteNgrok.listar(c)).toEqual([]);
    expect(c.pedidas).toEqual([]);
  });

  it('un archivo sin versiones, sin red o con la misma versión y dos sumas se descarta', async () => {
    await expect(fuenteNgrok.listar(ctx('<html>nada</html>'))).rejects.toBeInstanceOf(
      IndiceMalformado,
    );
    await expect(fuenteNgrok.listar(ctx(undefined))).rejects.toThrow();
    const html = fixture('ngrok-archivo.html');
    const doble = `${html}\n${html.replace(/value="438bad3d[0-9a-f]{56}"/, `value="${'a'.repeat(64)}"`)}`;
    expect(() => interpretarArchivoNgrok(doble)).toThrow(/dos sumas/);
  });

  it('ignora enlaces de otro host o de otro producto y sumas mal formadas', () => {
    const falso = (url: string, suma: string): string =>
      `<div class="link"><a href="${url}" class="btn"></a><div><input type="text" readonly value="${suma}"></div></div>`;
    for (const html of [
      falso('https://evil.example.com/a/x/ngrok-v3-3.39.13-windows-amd64.zip', 'a'.repeat(64)),
      falso('https://bin.equinox.io/a/x/otro-3.39.13-windows-amd64.zip', 'a'.repeat(64)),
      falso('https://bin.equinox.io/a/x/ngrok-v3-3.39.13-windows-amd64.zip', 'a'.repeat(63)),
      falso('https://bin.equinox.io/a/x/ngrok-v3-3.39.13-windows-amd64.zip', 'A'.repeat(64)),
    ]) {
      expect(() => interpretarArchivoNgrok(html)).toThrow(IndiceMalformado);
    }
  });

  it('un bloque de Windows x64 sin su suma descarta el índice entero (no se presta la del vecino)', () => {
    const html = fixture('ngrok-archivo.html');
    // Se quita la suma del bloque x64 de la 3.39.12: la del bloque siguiente NO la sustituye.
    const sinSuma = html.replace(/value="05181f79[0-9a-f]{56}"/, 'value="pendiente"');
    expect(sinSuma).not.toBe(html);
    expect(() => interpretarArchivoNgrok(sinSuma)).toThrow(/sin SHA-256/);
    // Una suma en un bloque ARM64 no cuenta para el bloque x64 de al lado.
    const bloque = (url: string, suma: string | null): string =>
      `<div class="link"><a href="${url}" class="btn"></a>${suma ? `<input readonly value="${suma}">` : ''}</div>`;
    const x64 = 'https://bin.equinox.io/a/x/ngrok-v3-3.39.13-windows-amd64.zip';
    const arm = 'https://bin.equinox.io/a/y/ngrok-v3-3.39.13-windows-arm64.zip';
    expect(() => interpretarArchivoNgrok(bloque(x64, null) + bloque(arm, 'b'.repeat(64)))).toThrow(
      IndiceMalformado,
    );
    expect(
      interpretarArchivoNgrok(bloque(arm, 'b'.repeat(64)) + bloque(x64, 'c'.repeat(64)))[0],
    ).toMatchObject({
      sha256: 'c'.repeat(64),
    });
  });

  it('solo se ofrecen las versiones más nuevas y se ordenan por número, no por texto', () => {
    const bloque = (v: string, n: number): string =>
      `<div class="link"><a href="https://bin.equinox.io/a/id${n}/ngrok-v3-${v}-windows-amd64.zip" class="btn"></a>` +
      `<input type="text" readonly value="${n.toString(16).padStart(64, '0')}"></div>`;
    const versiones = ['3.9.0', '3.10.0', '3.2.1', '3.39.13', '3.39.2', '3.20.0', '3.1.0'];
    const v = interpretarArchivoNgrok(versiones.map(bloque).join('\n'));
    expect(v.map((x) => x.version)).toEqual(['3.39.13', '3.39.2', '3.20.0', '3.10.0', '3.9.0']);
  });
});

describe('ngrok en el catálogo', () => {
  it('la lista fija trae la versión con su SHA-256 verificado y una URL oficial', () => {
    expect(catalogo.ngrok).toEqual([
      {
        version: '3.39.13',
        url: 'https://bin.equinox.io/a/VUnfuMhAnU/ngrok-v3-3.39.13-windows-amd64.zip',
        sha256: '438bad3dbefd7e244be9dfae3889dcf99073b515845b66ab5617e4887bc24636',
        formato: 'zip',
        ejecutable: 'ngrok.exe',
      },
    ]);
    expect(ejecutableDe('ngrok')).toBe('ngrok.exe');
  });

  it('está en la fuente en vivo, en Versiones (solo instalar y predeterminada) y con hosts acotados', () => {
    expect(FUENTES_VERSIONES.ngrok).toBe(fuenteNgrok);
    expect(esServicioVersiones('ngrok')).toBe(true);
    expect(INTERRUPTOR.ngrok).toBe('ninguno');
    expect(urlIndice(INDICE_NGROK)).toBe(true);
    // Los hosts de Equinox sirven a otras apps: solo la ruta de ngrok.
    expect(urlIndice('https://dl.equinox.io/otra/app/stable/archive')).toBe(false);
    expect(
      urlOficial('https://bin.equinox.io/a/VUnfuMhAnU/ngrok-v3-3.39.13-windows-amd64.zip'),
    ).toBe(true);
    expect(urlOficial('https://bin.equinox.io/b/x/ngrok.zip')).toBe(false);
    // bin.equinox.io solo sirve el zip de ngrok para Windows x64, con ese nombre exacto (sin el
    // prefijo /c/…, que otras apps de Equinox también usan).
    for (const mala of [
      'https://bin.equinox.io/a/x/ngrok.zip',
      'https://bin.equinox.io/a/x/otra-app-1.2.3-windows-amd64.zip',
      'https://bin.equinox.io/a/x/ngrok-v3-3.39.13-windows-arm64.zip',
      'https://bin.equinox.io/a/x/ngrok-v3-3.39.13-windows-amd64.zip.exe',
      'https://bin.equinox.io/a/x/ngrok-v3-3.39-windows-amd64.zip',
      'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-3.39.13-windows-amd64.zip',
    ]) {
      expect(urlOficial(mala), mala).toBe(false);
    }
    expect(urlOficial('http://bin.equinox.io/a/x/ngrok.zip')).toBe(false);
    expect(urlOficial('https://bin.equinox.io/a/x%2f..%2fy/ngrok.zip')).toBe(false);
    expect(urlOficial('https://evil.equinox.io/a/x/ngrok.zip')).toBe(false);
  });
});
