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
