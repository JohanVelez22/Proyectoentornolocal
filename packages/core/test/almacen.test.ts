import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  it('el rango pasivo de FTP por defecto es 30000-30100 y el viejo guardado se migra', async () => {
    const a = new Almacen(rutas);
    expect((await a.leer()).ftp.pasivos).toEqual([30000, 30100]);
    // Config guardado con el rango viejo por defecto: se migra al leer y queda así al guardar.
    await writeFile(
      rutas.config(),
      JSON.stringify({ version: 1, ftp: { pasivos: [50000, 50100] } }),
    );
    const migrado = await a.leer();
    expect(migrado.ftp.pasivos).toEqual([30000, 30100]);
    await a.guardar(migrado);
    expect(JSON.parse(await readFile(rutas.config(), 'utf8')).ftp.pasivos).toEqual([30000, 30100]);
    // Un rango elegido por el usuario (aunque esté cerca del viejo) se respeta.
    for (const propio of [
      [50000, 50200],
      [50001, 50100],
      [40000, 40100],
    ]) {
      await writeFile(rutas.config(), JSON.stringify({ version: 1, ftp: { pasivos: propio } }));
      expect((await a.leer()).ftp.pasivos).toEqual(propio);
    }
  });
  it('un config.json viejo sin `ui` carga con las preferencias por defecto y no es corrupto', async () => {
    const viejo = {
      version: 1,
      sitios: [],
      proyectos: { carpetaVigilada: 'C:/Proyectos' },
      servicios: { nginx: { version: '1.27.0', puerto: 8080 } },
    };
    await writeFile(rutas.config(), JSON.stringify(viejo));
    const c = await new Almacen(rutas).leer();
    expect(c.servicios.nginx.puerto).toBe(8080);
    expect(c.proyectos.carpetaVigilada).toBe('C:/Proyectos');
    expect(c.ui).toEqual({
      tema: 'sistema',
      idioma: null,
      acento: null,
      asistenteVisto: false,
      avisoCostoAgentes: false,
      seccionesAvanzadas: false,
      animacionInicio: true,
    });
    const archivos = await readdir(join(rutas.config(), '..'));
    expect(archivos.some((f) => f.startsWith('config.corrupto'))).toBe(false);
  });
  it('un `ui` con valores raros cae a los valores por defecto sin perder el resto', async () => {
    await writeFile(
      rutas.config(),
      JSON.stringify({
        servicios: { nginx: { puerto: 8081 } },
        ui: { tema: 'rosa', idioma: 'xx', acento: 'rojo', asistenteVisto: 'si' },
      }),
    );
    const c = await new Almacen(rutas).leer();
    expect(c.servicios.nginx.puerto).toBe(8081);
    expect(c.ui).toEqual({
      tema: 'sistema',
      idioma: null,
      acento: null,
      asistenteVisto: false,
      avisoCostoAgentes: false,
      seccionesAvanzadas: false,
      animacionInicio: true,
    });
    await writeFile(rutas.config(), JSON.stringify({ ui: 'texto', https: { puerto: 8443 } }));
    const d = await new Almacen(rutas).leer();
    expect(d.https.puerto).toBe(8443);
    expect(d.ui.tema).toBe('sistema');
    const archivos = await readdir(join(rutas.config(), '..'));
    expect(archivos.some((f) => f.startsWith('config.corrupto'))).toBe(false);
  });
  it('animacionInicio (D56): una `ui` anterior sin el campo la recibe activada; false se conserva y un valor raro vuelve a activada', async () => {
    await writeFile(
      rutas.config(),
      JSON.stringify({ ui: { tema: 'oscuro', asistenteVisto: true } }),
    );
    let d = await new Almacen(rutas).leer();
    expect(d.ui.animacionInicio).toBe(true);
    expect(d.ui.tema).toBe('oscuro');
    await writeFile(rutas.config(), JSON.stringify({ ui: { animacionInicio: false } }));
    d = await new Almacen(rutas).leer();
    expect(d.ui.animacionInicio).toBe(false);
    await writeFile(rutas.config(), JSON.stringify({ ui: { animacionInicio: 'no' } }));
    d = await new Almacen(rutas).leer();
    expect(d.ui.animacionInicio).toBe(true);
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

describe('AlmacenCredenciales: escritura atómica y permisos (D38c)', () => {
  const nombres = async () =>
    (await readdir(join(rutas.base, 'etc'), { withFileTypes: true }))
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort();

  it('el temporal va en la misma carpeta, se restringe vacío antes de escribir y no deja restos', async () => {
    const vistos: { ruta: string; bytes: number }[] = [];
    const restringir = vi.fn(async (ruta: string) => {
      vistos.push({ ruta, bytes: (await stat(ruta)).size });
      return true;
    });
    const alFallar = vi.fn();
    const c = new AlmacenCredenciales(rutas, undefined, {
      restringir,
      alFallarProteccion: alFallar,
    });
    await c.guardar('mysql', { usuario: 'root', clave: 'clave-de-prueba' });
    await c.guardar('mcp', { usuario: 'mcp', clave: 'otra-falsa' });
    // Dos escrituras, dos temporales distintos, cada uno vacío cuando se le puso la ACL.
    expect(vistos).toHaveLength(2);
    for (const v of vistos) {
      expect(v.bytes).toBe(0);
      expect(join(v.ruta, '..')).toBe(join(rutas.credenciales(), '..'));
      expect(v.ruta).not.toBe(rutas.credenciales());
    }
    expect(vistos[0]!.ruta).not.toBe(vistos[1]!.ruta);
    expect(alFallar).not.toHaveBeenCalled();
    expect(await nombres()).toEqual(['credenciales.json']);
    expect(JSON.parse(await readFile(rutas.credenciales(), 'utf8'))).toMatchObject({
      mysql: { clave: 'clave-de-prueba' },
      mcp: { usuario: 'mcp' },
    });
  });

  it('si la ACL falla (false o excepción) los datos se guardan igual y se informa una vez por escritura', async () => {
    for (const restringir of [
      async () => false,
      async () => {
        throw new Error('icacls no está');
      },
    ]) {
      const alFallar = vi.fn();
      const c = new AlmacenCredenciales(rutas, undefined, {
        restringir,
        alFallarProteccion: alFallar,
      });
      await c.guardar('mysql', { usuario: 'root', clave: 'clave-de-prueba' });
      expect(alFallar).toHaveBeenCalledTimes(1);
      expect(JSON.parse(await readFile(rutas.credenciales(), 'utf8')).mysql.clave).toBe(
        'clave-de-prueba',
      );
      expect(await nombres()).toEqual(['credenciales.json']);
    }
  });

  it('si el renombrado falla: no quedan restos y el archivo anterior sigue intacto', async () => {
    const buenas = new AlmacenCredenciales(rutas);
    await buenas.guardar('mysql', { usuario: 'root', clave: 'clave-de-prueba' });
    const antes = await readFile(rutas.credenciales(), 'utf8');
    const rota = new AlmacenCredenciales(rutas, undefined, {
      renombrar: async () => {
        throw Object.assign(new Error('disco lleno'), { code: 'ENOSPC' });
      },
    });
    await expect(rota.guardar('mcp', { usuario: 'mcp', clave: 'k' })).rejects.toThrow(
      'disco lleno',
    );
    expect(await readFile(rutas.credenciales(), 'utf8')).toBe(antes);
    expect(await nombres()).toEqual(['credenciales.json']);
  });

  it('preparar(): restringe el archivo que ya existía y barre temporales viejos', async () => {
    await mkdir(join(rutas.base, 'etc'), { recursive: true });
    await writeFile(rutas.credenciales(), '{}');
    await writeFile(`${rutas.credenciales()}.tmp`, 'resto de una versión anterior');
    await writeFile(join(rutas.base, 'etc', '.credenciales-1-abc.tmp'), 'resto');
    await writeFile(join(rutas.base, 'etc', 'otra-cosa.tmp'), 'no es nuestro');
    const restringir = vi.fn(async () => true);
    const c = new AlmacenCredenciales(rutas, undefined, { restringir });
    await c.preparar();
    expect(restringir).toHaveBeenCalledWith(rutas.credenciales());
    expect(await nombres()).toEqual(['credenciales.json', 'otra-cosa.tmp']);
  });

  it('preparar(): si no se puede borrar un temporal, igual restringe el archivo existente', async () => {
    await mkdir(join(rutas.base, 'etc'), { recursive: true });
    await writeFile(rutas.credenciales(), '{}');
    // Un directorio con el patrón del temporal: `rm` sin `recursive` falla (EISDIR/EPERM).
    await mkdir(join(rutas.base, 'etc', '.credenciales-1-abc.tmp'));
    const restringir = vi.fn(async () => true);
    await new AlmacenCredenciales(rutas, undefined, { restringir }).preparar();
    expect(restringir).toHaveBeenCalledWith(rutas.credenciales());
  });

  it('preparar() sin archivo no falla ni crea nada', async () => {
    const restringir = vi.fn(async () => true);
    await new AlmacenCredenciales(rutas, undefined, { restringir }).preparar();
    expect(restringir).not.toHaveBeenCalled();
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

describe('AlmacenCredenciales: claves peligrosas', () => {
  it('ignora __proto__, constructor y prototype (sin contaminar prototipos)', async () => {
    await mkdir(join(rutas.credenciales(), '..'), { recursive: true });
    await writeFile(
      rutas.credenciales(),
      '{"__proto__": {"contaminado": true}, "constructor": {"prototype": {"contaminado": true}},' +
        ' "prototype": 1, "mysql": {"usuario": "u", "clave": "c"}}',
    );
    const c = new AlmacenCredenciales(rutas);
    const todas = await c.todas();
    expect(todas.mysql).toEqual({ usuario: 'u', clave: 'c' });
    expect(Object.keys(todas)).toEqual(['mysql']);
    expect((todas as Record<string, unknown>).contaminado).toBeUndefined();
    expect(({} as Record<string, unknown>).contaminado).toBeUndefined();
    await c.guardar('mcp', { usuario: 'mcp', clave: 'k' });
    const texto = await readFile(rutas.credenciales(), 'utf8');
    expect(texto).not.toMatch(/__proto__|constructor|prototype|contaminado/);
    expect(({} as Record<string, unknown>).contaminado).toBeUndefined();
  });
});
