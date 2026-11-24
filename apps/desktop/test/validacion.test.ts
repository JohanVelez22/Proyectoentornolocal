import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  carpetaExistente,
  idNoVacio,
  objetoPlano,
  servicioDelCatalogo,
  texto,
  tipoRuntime,
  urlAbrible,
  urlFtpSegura,
  urlHttp,
} from '../src/main/validacion';

const dir = mkdtempSync(join(tmpdir(), 'pel-val-'));
const archivo = join(dir, 'a.exe');
writeFileSync(archivo, 'x');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('urlHttp', () => {
  it('acepta http y https', () => {
    expect(urlHttp('https://a.trycloudflare.com/x')).toBe('https://a.trycloudflare.com/x');
    expect(urlHttp('http://localhost')).toBe('http://localhost/');
  });
  it.each(['file:///c:/a.exe', 'javascript:alert(1)', 'ms-msdt:/x', 'nada', '', 5, null])(
    'rechaza %s',
    (v) => {
      expect(() => urlHttp(v)).toThrow();
    },
  );
});

describe('carpetaExistente', () => {
  it('acepta una carpeta', async () => {
    expect(await carpetaExistente(dir)).toBe(dir);
  });
  it('rechaza archivos, inexistentes y no-cadenas', async () => {
    await expect(carpetaExistente(archivo)).rejects.toThrow('La ruta no es una carpeta');
    await expect(carpetaExistente(join(dir, 'no'))).rejects.toThrow('La ruta no es una carpeta');
    await expect(carpetaExistente(42)).rejects.toThrow();
  });
});

describe('tipos básicos', () => {
  it('texto, id y objeto', () => {
    expect(texto('a')).toBe('a');
    expect(() => texto(1)).toThrow();
    expect(() => idNoVacio('  ')).toThrow();
    expect(idNoVacio('x')).toBe('x');
    expect(objetoPlano({ a: 1 })).toEqual({ a: 1 });
    for (const v of [null, [], 'x', new Date(), new Map()]) {
      expect(() => objetoPlano(v)).toThrow();
    }
  });
});

describe('D5: runtimes de Java, .NET, Go y Rust', () => {
  it('tipoRuntime acepta los seis y servicioDelCatalogo los cuatro instalables nuevos', () => {
    for (const t of ['node', 'python', 'java', 'dotnet', 'go', 'rust']) {
      expect(tipoRuntime(t)).toBe(t);
      expect(servicioDelCatalogo(t)).toBe(t);
    }
    for (const mal of ['ruby', '', 'GO', 5, null, '../go']) {
      expect(() => tipoRuntime(mal)).toThrow('runtime');
    }
    expect(() => servicioDelCatalogo('ruby')).toThrow('servicio');
  });
});

describe('D7: urlFtpSegura', () => {
  it('acepta la forma exacta ftp://usuario@ip:puerto/', () => {
    expect(urlFtpSegura('ftp://u@127.0.0.1:2121/')).toBe('ftp://u@127.0.0.1:2121/');
    expect(urlFtpSegura('ftp://a%40b@192.168.1.5:21/')).toBe('ftp://a%40b@192.168.1.5:21/');
  });
  it.each([
    'ftp://u:p@127.0.0.1:2121/',
    'ftp://u:@127.0.0.1:2121/',
    'file:///c:/a.exe',
    'ftp://127.0.0.1:2121/../x',
    'ftp://u@127.0.0.1:2121/../x',
    'ftp://u@127.0.0.1:2121/carpeta',
    'ftp://u@127.0.0.1:2121/?a=1',
    'ftp://u@127.0.0.1:2121/#x',
    'ftp://u@evil.example.com:2121/',
    'ftp://u@127.0.0.1/',
    'ftp://u@999.0.0.1:2121/',
    'ftp://u@127.0.0.1:99999/',
    'ftp://@127.0.0.1:2121/',
    'http://u@127.0.0.1:2121/',
    5,
    null,
  ])('rechaza %s', (v) => {
    expect(() => urlFtpSegura(v)).toThrow();
  });
});

describe('D7: urlAbrible', () => {
  it('admite http, https y ftp seguro; nada más', () => {
    expect(urlAbrible('https://a.test/x')).toBe('https://a.test/x');
    expect(urlAbrible('ftp://u@127.0.0.1:2121/')).toBe('ftp://u@127.0.0.1:2121/');
    expect(() => urlAbrible('ftp://u:p@127.0.0.1:2121/')).toThrow();
    expect(() => urlAbrible('file:///c:/a.exe')).toThrow();
  });
});
