import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { mkdir } from 'node:fs/promises';
import { Almacen, AlmacenCredenciales } from '../src/almacen';
import { Eventos } from '../src/eventos';
import { Rutas } from '../src/rutas';

let rutas: Rutas;
beforeEach(async () => {
  rutas = new Rutas(await carpetaTemporal('pel-'));
  await rutas.asegurar();
});

describe('Almacen', () => {
  it('sin archivo devuelve la config por defecto', async () => {
    const c = await new Almacen(rutas).leer();
    expect(c.version).toBe(1);
    expect(c.sitios).toEqual([]);
    expect(c.servicios.nginx.puerto).toBe(80);
    expect(c.servicios.php.trabajadores).toBe(2);
  });
  it('guardar y leer devuelve lo mismo', async () => {
    const a = new Almacen(rutas);
    const c = await a.leer();
    c.servicios.nginx.puerto = 8080;
    c.sitios.push({
      id: 'x',
      nombre: 'X',
      dominio: 'x.test',
      alias: ['y.test'],
      carpeta: 'C:/x',
      tipo: 'laravel',
      php: '8.4',
      puertoProxy: null,
      reglasExtra: '',
      urlBaseVar: 'APP_URL',
      datosReales: true,
      https: false,
      redirigirHttps: false,
      confiado: false,
      git: null,
      procesos: [],
      runtimes: {},
      nota: 'n',
    });
    await a.guardar(c);
    expect(await a.leer()).toEqual(c);
    expect((await readdir(join(rutas.config(), '..'))).some((f) => f.endsWith('.tmp'))).toBe(false);
  });
  it('JSON corrupto se renombra y devuelve la config por defecto', async () => {
    await writeFile(rutas.config(), '{no es json');
    const c = await new Almacen(rutas).leer();
    expect(c.servicios.nginx.puerto).toBe(80);
    const archivos = await readdir(join(rutas.config(), '..'));
    expect(archivos.some((f) => /^config\.corrupto-.+\.json$/.test(f))).toBe(true);
    expect(archivos).not.toContain('config.json');
    const corrupto = archivos.find((f) => f.startsWith('config.corrupto'))!;
    expect(await readFile(join(rutas.config(), '..', corrupto), 'utf8')).toBe('{no es json');
  });
  it('archivo parcial se completa con valores por defecto', async () => {
    await writeFile(rutas.config(), JSON.stringify({ version: 1 }));
    const c = await new Almacen(rutas).leer();
    expect(c.servicios.php.trabajadores).toBe(2);
  });
});

describe('Eventos', () => {
  it('emite, desuscribe y aísla errores', () => {
    const e = new Eventos<{ a: number }>();
    const vistos: number[] = [];
    e.on('a', () => {
      throw new Error('x');
    });
    const off = e.on('a', (n) => vistos.push(n));
    e.emit('a', 1);
    off();
    e.emit('a', 2);
    expect(vistos).toEqual([1]);
  });
});

describe('AlmacenCredenciales', () => {
  it('genera una sola vez aunque se pida en paralelo y escribe de forma atómica', async () => {
    const c = new AlmacenCredenciales(rutas);
    let n = 0;
    const crear = () => ({ usuario: 'root', clave: `clave${++n}` });
    const [a, b] = await Promise.all([
      c.obtenerOCrear('mysql', crear),
      c.obtenerOCrear('mysql', crear),
    ]);
    expect(a).toEqual(b);
    expect(n).toBe(1);
    expect(JSON.parse(await readFile(rutas.credenciales(), 'utf8'))).toEqual({ mysql: a });
    expect((await readdir(join(rutas.base, 'etc'))).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('un archivo corrupto se aparta como copia y no rompe la lectura', async () => {
    await mkdir(join(rutas.base, 'etc'), { recursive: true });
    await writeFile(rutas.credenciales(), '{ roto');
    const c = new AlmacenCredenciales(rutas);
    expect(await c.leer('mysql')).toBeNull();
    const archivos = await readdir(join(rutas.base, 'etc'));
    expect(archivos.some((f) => f.startsWith('credenciales.corrupto-'))).toBe(true);
  });
});

describe('AlmacenCredenciales: claves desconocidas', () => {
  it('conserva las claves que no conoce al guardar (una versión futura no se corrompe)', async () => {
    await mkdir(join(rutas.credenciales(), '..'), { recursive: true });
    await writeFile(
      rutas.credenciales(),
      JSON.stringify({
        futuro: { algo: 1, lista: ['a'] },
        mysql: { usuario: 'u', clave: 'c' },
      }),
    );
    const c = new AlmacenCredenciales(rutas);
    await c.guardar('mcp', { usuario: 'mcp', clave: 'k' });
    const datos = JSON.parse(await readFile(rutas.credenciales(), 'utf8'));
    expect(datos.futuro).toEqual({ algo: 1, lista: ['a'] });
    expect(datos.mysql).toEqual({ usuario: 'u', clave: 'c' });
    expect(datos.mcp).toEqual({ usuario: 'mcp', clave: 'k' });
    const nombres = await readdir(join(rutas.credenciales(), '..'));
    expect(nombres.some((n) => n.includes('corrupto'))).toBe(false);
  });
});
