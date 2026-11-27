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

  it('admite UTF-8 sin saltos de línea, sin recortar y hasta 16 KB; los demás espacios no cambian', async () => {
    const a = nuevo();
    const id = 'http:0123456789abcdef' as const;
    await a.guardar(id, 'a='.concat('x'.repeat(5000)));
    expect((await a.leer(id))?.length).toBe(5002);
    await a.guardar(id, 'contraseña');
    expect(await a.leer(id)).toBe('contraseña');
    await a.guardar(id, '  con espacios  ');
    expect(await a.leer(id)).toBe('  con espacios  ');
    await a.guardar(id, 'ñ'.repeat(8192)); // 16 KB exactos
    await expect(a.guardar(id, 'x'.repeat(16385))).rejects.toThrowError();
    for (const malo of ['a\nb', 'a\rb', 'a\0b', '', '\ud800']) {
      await expect(a.guardar(id, malo)).rejects.toThrowError();
    }
    // Las reglas de otros espacios no se tocan.
    await expect(a.guardar('ia:openai', 'contraseña')).rejects.toThrowError();
    await expect(a.guardar('ia:openai', 'x'.repeat(5000))).rejects.toThrowError();
    await expect(a.guardar('smtp:gmail', 'x'.repeat(5000))).rejects.toThrowError();
  });

  it('rechaza ids que no son 16 hexadecimales (nada de rutas)', async () => {
    const a = nuevo();
    for (const id of ['http:', 'http:../x', 'http:ABCDEF0123456789', 'http:0123']) {
      await expect(a.guardar(id as `http:${string}`, 'x')).rejects.toThrowError();
    }
  });
});

describe('cliente HTTP: referencias y historial en la interfaz (revisión D48)', () => {
  const base = {
    id: 'a1b2c3d4e5f60718',
    nombre: 'p',
    metodo: 'GET',
    url: 'http://127.0.0.1:1/',
    params: [],
    cabeceras: [
      { clave: 'Authorization', valor: '', activo: true, ref: 'http:0123456789abcdef' },
      { clave: 'X-Nota', valor: 'visible', activo: true },
    ],
    cuerpo: { tipo: 'ninguno' },
    auth: { tipo: 'bearer', ref: 'http:fedcba9876543210' },
    plazoSeg: 5,
    ignorarCertificado: false,
  } as const;

  it('sinReferencias quita id y refs y marca «falta el secreto» (abrirConPeticion, petición borrada)', async () => {
    const { sinReferencias } = await import('../src/renderer/utilidades/clienteHttp');
    const r = sinReferencias(structuredClone(base) as never);
    expect(r.id).toBe('');
    expect(r.cabeceras[0]).toEqual({
      clave: 'Authorization',
      valor: '',
      activo: true,
      faltante: true,
    });
    expect(r.cabeceras[1]).toEqual({ clave: 'X-Nota', valor: 'visible', activo: true });
    expect(r.auth).toEqual({ tipo: 'bearer' });
  });

  it('desdeHistorial pasa los *** a filas vacías «falta el secreto»', async () => {
    const { desdeHistorial } = await import('../src/renderer/utilidades/clienteHttp');
    const r = desdeHistorial({
      ...structuredClone(base),
      cabeceras: [
        { clave: 'Authorization', valor: '***', activo: true },
        { clave: 'Cookie', valor: '***', activo: true },
        { clave: 'X-Nota', valor: '***', activo: true },
      ],
      auth: { tipo: 'basic', usuario: 'yo' },
    } as never);
    expect(r.id).toBe('');
    expect(r.cabeceras[0]).toEqual({
      clave: 'Authorization',
      valor: '',
      activo: true,
      faltante: true,
    });
    expect(r.cabeceras[1]).toMatchObject({ valor: '', faltante: true });
    // Un nombre que no es secreto conserva su valor literal.
    expect(r.cabeceras[2]).toMatchObject({ valor: '***' });
  });
});
