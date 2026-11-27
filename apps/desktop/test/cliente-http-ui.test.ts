import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { abrirConPeticion } from '../src/renderer/composables/clienteHttp';
import { solicitudes } from '../src/renderer/composables/solicitudes';
import { AlmacenSecretos, type CifradoSeguro } from '../src/main/secretos';

const RAIZ = path.join(__dirname, '..', '..', '..');

function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? fuentes(p) : /\.(ts|vue)$/.test(n) ? [p] : [];
  });
}

describe('cliente HTTP: la interfaz', () => {
  it('nunca interpreta la respuesta: sin v-html ni innerHTML en sus componentes', () => {
    const archivos = [
      path.join(
        __dirname,
        '..',
        'src',
        'renderer',
        'componentes',
        'herramientas',
        'ClienteHttp.vue',
      ),
      ...fuentes(
        path.join(__dirname, '..', 'src', 'renderer', 'componentes', 'herramientas', 'clientehttp'),
      ),
    ];
    for (const f of archivos) expect(readFileSync(f, 'utf8'), f).not.toMatch(/v-html|innerHTML/);
  });

  it('abrirConPeticion deja la petición precargada y pide la herramienta (D49)', () => {
    abrirConPeticion({ metodo: 'POST', url: 'http://127.0.0.1:1/eco' });
    expect(solicitudes.herramienta).toBe('clienteHttp');
    expect(solicitudes.peticionHttp).toEqual({ metodo: 'POST', url: 'http://127.0.0.1:1/eco' });
    solicitudes.herramienta = null;
    solicitudes.peticionHttp = null;
  });

  it('ni el MCP ni la CLI exponen el cliente HTTP', () => {
    const carpetas = [
      path.join(RAIZ, 'packages', 'core', 'src', 'mcp'),
      path.join(RAIZ, 'packages', 'core', 'src', 'cli'),
      path.join(RAIZ, 'apps', 'desktop', 'src', 'cli'),
    ];
    for (const c of carpetas) {
      for (const f of fuentes(c)) {
        expect(readFileSync(f, 'utf8'), f).not.toMatch(/clientehttp|ClienteHttp|clienteHttp/);
      }
    }
  });
});

describe('AlmacenSecretos: valores del cliente HTTP (http:<id>)', () => {
  const cifrado: CifradoSeguro = {
    isEncryptionAvailable: () => true,
    encryptString: (t) => Buffer.from(t, 'utf8').reverse(),
    decryptString: (b) => Buffer.from(b).reverse().toString('utf8'),
  };
  let dir = '';
  afterEach(() => rmSync(dir, { recursive: true, force: true }));
  const nuevo = (): AlmacenSecretos => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'pel-secretos-http-'));
    return new AlmacenSecretos(path.join(dir, 'secretos'), null, cifrado);
  };

  it('guarda, lee y borra con un id de 16 hex; admite espacios internos', async () => {
    const a = nuevo();
    await a.guardar('http:0123456789abcdef', 'a=1; b=http-prueba-falsa-0000');
    expect(await a.leer('http:0123456789abcdef')).toBe('a=1; b=http-prueba-falsa-0000');
    expect(readdirSync(path.join(dir, 'secretos'))).toEqual(['http-0123456789abcdef.bin']);
    expect(await a.estado('http:0123456789abcdef')).toMatchObject({ configurada: true });
    await a.borrar('http:0123456789abcdef');
    expect(a.hay('http:0123456789abcdef')).toBe(false);
  });

  it('rechaza ids que no son 16 hexadecimales (nada de rutas)', async () => {
    const a = nuevo();
    for (const id of ['http:', 'http:../x', 'http:ABCDEF0123456789', 'http:0123']) {
      await expect(a.guardar(id as `http:${string}`, 'x')).rejects.toThrowError();
    }
  });
});
