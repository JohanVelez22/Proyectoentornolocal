import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import yauzl from 'yauzl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { carpetaTemporal } from './temporales';
import { ErrorWolf } from '../src/errores';
import { crearProyecto, type DepsCrearProyecto } from '../src/proyectos/crear';
import type { PedidoProyecto } from '../src/proyectos/generadores';
import { Rutas } from '../src/rutas';
import {
  compilarExclusiones,
  EXCLUSIONES_PLANTILLA,
  Plantillas,
  sinSecretosPlantilla,
  type Plantilla,
  type DepsPlantillas,
} from '../src/proyectos/plantillas';
import type { PasoReceta } from '../src/proyectos/config';
import type { Sitio } from '../src/tipos';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

const CENTINELA = 'centinela-secreta-d';
const FILA = 'centinela-fila-d';

let dir: string;
let rutas: Rutas;
let proyecto: string;
let llamadasRespaldo: { motor: string; base: string; opciones: unknown }[];
let receta: PasoReceta[];

const sitioBase = (extra: Partial<Sitio> = {}): Sitio => ({
  id: 'tienda',
  nombre: 'tienda',
  dominio: 'tienda.test',
  alias: [],
  carpeta: proyecto,
  tipo: 'laravel',
  php: '8.4',
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: null,
  datosReales: false,
  nota: '',
  https: true,
  redirigirHttps: false,
  confiado: true,
  git: null,
  procesos: [],
  runtimes: {},
  ...extra,
});

let sitio: Sitio;

function armar(extra: Partial<DepsPlantillas> = {}): Plantillas {
  return new Plantillas({
    rutas,
    sitio: async () => sitio,
    receta: async () => receta,
    respaldar: async (motor, base, carpeta, opciones) => {
      llamadasRespaldo.push({ motor, base, opciones });
      await mkdir(carpeta, { recursive: true });
      const archivo = path.join(carpeta, `${base}.sql`);
      // El volcado falso trae filas solo si no se le pidió únicamente la estructura.
      await writeFile(
        archivo,
        `CREATE TABLE usuarios (id int);\n${opciones.soloEsquema ? '' : `INSERT INTO usuarios VALUES ('${FILA}');\n`}`,
      );
      return { archivo };
    },
    extensionesActivas: async () => ['mbstring', 'pdo_mysql', 'openssl'],
    baseDe: async () => ({ motor: 'mysql', base: 'tienda', usuario: 'root' }),
    ...extra,
  });
}

async function escribir(rel: string, texto: string | Buffer): Promise<void> {
  const ruta = path.join(proyecto, ...rel.split('/'));
  await mkdir(path.dirname(ruta), { recursive: true });
  await writeFile(ruta, texto);
}

/** Entradas de un zip: nombre → contenido. */
async function leerZip(archivo: string): Promise<Map<string, string>> {
  const z = await new Promise<yauzl.ZipFile>((res, rej) =>
    yauzl.open(archivo, { lazyEntries: true }, (e, v) => (e || !v ? rej(e) : res(v))),
  );
  const salida = new Map<string, string>();
  await new Promise<void>((resolve, reject) => {
    z.on('error', reject);
    z.on('end', resolve);
    z.on('entry', (e: yauzl.Entry) => {
      if (e.fileName.endsWith('/')) return z.readEntry();
      z.openReadStream(e, (err, s) => {
        if (err || !s) return reject(err);
        const partes: Buffer[] = [];
        s.on('data', (c: Buffer) => partes.push(c));
        s.on('end', () => {
          salida.set(e.fileName, Buffer.concat(partes).toString('utf8'));
          z.readEntry();
        });
      });
    });
    z.readEntry();
  });
  return salida;
}

/** Todo el texto que hay en una carpeta de plantilla, incluido lo que está dentro del zip. */
async function textoDe(carpeta: string): Promise<string> {
  const partes: string[] = [];
  for (const n of await readdir(carpeta, { withFileTypes: true })) {
    const ruta = path.join(carpeta, n.name);
    if (n.isDirectory()) partes.push(await textoDe(ruta));
    else if (n.name.endsWith('.zip')) {
      for (const [k, v] of await leerZip(ruta)) partes.push(k, v);
    } else partes.push(await readFile(ruta, 'utf8'));
  }
  return partes.join('\n');
}

/** Un zip con las entradas dadas (nombres sin ninguna validación, como lo haría un atacante). */
function zipCrudo(archivos: Record<string, string>): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;
  for (const [nombre, texto] of Object.entries(archivos)) {
    const n = Buffer.from(nombre);
    const d = Buffer.from(texto);
    const c0 = deflateRawSync(d);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0);
    l.writeUInt16LE(20, 4);
    l.writeUInt16LE(8, 8);
    l.writeUInt32LE(crc32(d), 14);
    l.writeUInt32LE(c0.length, 18);
    l.writeUInt32LE(d.length, 22);
    l.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(8, 10);
    c.writeUInt32LE(crc32(d), 16);
    c.writeUInt32LE(c0.length, 20);
    c.writeUInt32LE(d.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    locales.push(l, n, c0);
    centrales.push(c, n);
    offset += 30 + n.length + c0.length;
  }
  const cd = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  const total = Object.keys(archivos).length;
  fin.writeUInt16LE(total, 8);
  fin.writeUInt16LE(total, 10);
  fin.writeUInt32LE(cd.length, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, cd, fin]);
}

beforeEach(async () => {
  dir = await carpetaTemporal('pel-plant-');
  rutas = new Rutas(path.join(dir, 'datos'));
  proyecto = path.join(dir, 'tienda');
  await mkdir(proyecto);
  llamadasRespaldo = [];
  receta = [
    { id: 'composer-install', tipo: 'composer-install', titulo: 'Composer' },
    {
      id: 'env-crear',
      tipo: 'env-crear',
      titulo: 'Crear .env',
      args: { valores: { APP_NAME: 'Tienda', STRIPE_API_KEY: CENTINELA } },
    },
    { id: 'key-generate', tipo: 'key-generate', titulo: 'Clave' },
    { id: 'bd-crear', tipo: 'bd-crear', titulo: 'Base', args: { motor: 'mysql' } },
    { id: 'migrar', tipo: 'migrar', titulo: 'Migrar' },
    { id: 'sitio-crear', tipo: 'sitio-crear', titulo: 'Sitio', args: { tipo: 'laravel' } },
  ];
  sitio = sitioBase({
    phpIni: { memory_limit: '512M', 'mail.password': CENTINELA },
    reglasExtra: `location /api { add_header X-Token "Bearer ${CENTINELA}abc"; }`,
  });
  await escribir('composer.json', '{"name":"acme/tienda"}');
  await escribir('app/Modelo.php', '<?php // modelo');
  await escribir('public/index.php', '<?php // entrada');
  await escribir(
    '.env',
    `APP_KEY=base64:xyz\nDB_PASSWORD=${CENTINELA}\nSTRIPE_API_KEY=${CENTINELA}\n`,
  );
  await escribir('.env.local', `SECRET=${CENTINELA}`);
  await escribir('.env.example', 'APP_NAME=x');
  await escribir('vendor/autoload.php', '<?php');
  await escribir('node_modules/a/index.js', 'x');
  await escribir('.git/config', '[core]');
  await escribir('storage/logs/laravel.log', 'log');
  await escribir('storage/framework/cache/a', 'c');
  await escribir('respaldo.sql', `INSERT INTO usuarios VALUES ('${FILA}');`);
  await escribir('datos.dump', 'x');
  await escribir(
    'certs/sitio.pem',
    `-----BEGIN PRIVATE KEY-----\n${CENTINELA}\n-----END PRIVATE KEY-----`,
  );
  await escribir('certs/sitio.key', CENTINELA);
  await escribir('certs/sitio.crt', CENTINELA);
  await escribir('wolfcore.yml', `env:\n  TOKEN: ${CENTINELA}\n`);
  await escribir('config/cache.php', `<?php // DB_PASSWORD=${CENTINELA}`);
});

const opciones = { nombre: 'Mi tienda', conArchivos: true, excluirExtra: [] as string[] };

describe('Plantillas.guardar: qué entra', () => {
  it('nunca lleva .env, vendor, node_modules, .git, volcados, claves ni certificados', async () => {
    const p = await armar().guardar('tienda', opciones);
    const dirP = path.join(rutas.plantillas(), p.id);
    const zip = await leerZip(path.join(dirP, 'archivos.zip'));
    expect([...zip.keys()].sort()).toEqual(['app/Modelo.php', 'composer.json', 'public/index.php']);
    for (const prohibido of [
      '.env',
      '.env.local',
      '.env.example',
      'vendor',
      'node_modules',
      '.git',
      'wolfcore.yml',
    ]) {
      expect([...zip.keys()].some((k) => k === prohibido || k.startsWith(`${prohibido}/`))).toBe(
        false,
      );
    }
  });

  it('la clave centinela de .env, de la receta y de la configuración no aparece en la plantilla', async () => {
    const p = await armar().guardar('tienda', opciones);
    const todo = await textoDe(path.join(rutas.plantillas(), p.id));
    expect(todo).not.toContain(CENTINELA);
    // Lo que no es secreto sí se conserva.
    expect(p.phpIni).toEqual({ memory_limit: '512M' });
    expect(p.receta.find((x) => x.tipo === 'env-crear')?.args).toEqual({
      valores: { APP_NAME: 'Tienda' },
    });
    expect(p.reglasNginx).toContain('location /api');
  });

  it('un archivo con un secreto adentro se deja fuera y se lista en la vista previa', async () => {
    const v = await armar().vistaPrevia('tienda', {});
    expect(v.excluidos).toContain('config/cache.php (secreto)');
    expect(v.archivos).toBe(3);
  });

  it('las exclusiones obligatorias no se pueden quitar: solo sumar', async () => {
    for (const malo of ['!.env', '../fuera', '/abs', 'C:\\x', 'a:b', '']) {
      await expect(
        armar().guardar('tienda', { ...opciones, excluirExtra: [malo] }),
      ).rejects.toMatchObject({ codigo: 'plantillas.exclusion_invalida' });
    }
    expect(() => compilarExclusiones('no es lista')).toThrow();
    const p = await armar().guardar('tienda', { ...opciones, excluirExtra: ['app'] });
    const zip = await leerZip(path.join(rutas.plantillas(), p.id, 'archivos.zip'));
    expect([...zip.keys()].sort()).toEqual(['composer.json', 'public/index.php']);
    expect(EXCLUSIONES_PLANTILLA).toEqual(
      expect.arrayContaining(['.env', '.env.*', 'vendor', 'node_modules', '.git']),
    );
  });

  it('sin archivos solo guarda receta y ajustes', async () => {
    const p = await armar().guardar('tienda', { ...opciones, conArchivos: false });
    expect(p.conArchivos).toBe(false);
    expect((await readdir(path.join(rutas.plantillas(), p.id))).sort()).toEqual([
      'esquema.sql',
      'plantilla.json',
    ]);
  });

  it('la receta guardada no lleva los pasos de base ni sitio-crear', async () => {
    const p = await armar().guardar('tienda', opciones);
    expect(p.receta.map((x) => x.tipo)).toEqual([
      'composer-install',
      'env-crear',
      'key-generate',
      'migrar',
    ]);
    expect(p.tipo).toBe('laravel');
    expect(p.php).toBe('8.4');
    expect(p.extensiones).toEqual(['mbstring', 'openssl', 'pdo_mysql']);
    expect(p.motorBase).toBe('mysql');
  });

  it('no sigue enlaces: lo que cuelga de una unión no entra', async () => {
    const fuera = path.join(dir, 'fuera');
    await mkdir(fuera);
    await writeFile(path.join(fuera, 'ajeno.txt'), 'AJENO');
    try {
      await symlink(fuera, path.join(proyecto, 'enlace'), 'junction');
    } catch {
      return; // sin permiso para crear enlaces en este equipo
    }
    const p = await armar().guardar('tienda', opciones);
    const zip = await leerZip(path.join(rutas.plantillas(), p.id, 'archivos.zip'));
    expect([...zip.keys()].some((k) => k.includes('ajeno') || k.startsWith('enlace'))).toBe(false);
    const v = await armar().vistaPrevia('tienda', {});
    expect(v.excluidos).toContain('enlace (enlace)');
  });

  it('topes: demasiados archivos o bytes dan plantillas.demasiado_grande y no dejan nada', async () => {
    await expect(
      armar({ limites: { maxArchivos: 2 } }).guardar('tienda', opciones),
    ).rejects.toMatchObject({ codigo: 'plantillas.demasiado_grande' });
    await expect(
      armar({ limites: { maxBytes: 10 } }).guardar('tienda', opciones),
    ).rejects.toMatchObject({ codigo: 'plantillas.demasiado_grande' });
    expect(await readdir(rutas.plantillas()).catch(() => [])).toEqual([]);
  });

  it('un archivo más grande que el tope por archivo se deja fuera y se avisa', async () => {
    await escribir('public/enorme.bin', Buffer.alloc(2048, 1));
    const v = await armar({ limites: { maxBytesArchivo: 1024 } }).vistaPrevia('tienda', {});
    expect(v.excluidos).toContain('public/enorme.bin (muy grande)');
  });

  it('nombre inválido y sitio inexistente', async () => {
    await expect(armar().guardar('tienda', { ...opciones, nombre: '  ' })).rejects.toMatchObject({
      codigo: 'plantillas.nombre_invalido',
    });
    await expect(
      armar({ sitio: async () => Promise.reject(new Error('no existe')) }).guardar('x', opciones),
    ).rejects.toThrow();
    expect(await readdir(rutas.plantillas()).catch(() => [])).toEqual([]);
  });

  it('la vista previa no escribe nada', async () => {
    await armar().vistaPrevia('tienda', {});
    expect(await readdir(rutas.plantillas()).catch(() => [])).toEqual([]);
  });
});

describe('Plantillas.guardar: esquema sin datos', () => {
  it('pide solo la estructura y el volcado no trae filas', async () => {
    const p = await armar().guardar('tienda', opciones);
    expect(llamadasRespaldo).toEqual([
      { motor: 'mysql', base: 'tienda', opciones: { soloEsquema: true } },
    ]);
    const esquema = await readFile(path.join(rutas.plantillas(), p.id, 'esquema.sql'), 'utf8');
    expect(esquema).toContain('CREATE TABLE usuarios');
    expect(esquema).not.toContain('INSERT');
    expect(esquema).not.toContain(FILA);
    expect(await textoDe(path.join(rutas.plantillas(), p.id))).not.toContain(FILA);
  });

  it('PostgreSQL guarda esquema.dump', async () => {
    const p = await armar({
      baseDe: async () => ({ motor: 'postgresql', base: 'api', usuario: 'postgres' }),
    }).guardar('tienda', opciones);
    expect(p.archivoEsquema).toBe('esquema.dump');
    expect(p.motorBase).toBe('postgresql');
  });

  it('sin base declarada no hay esquema', async () => {
    const p = await armar({ baseDe: async () => null }).guardar('tienda', opciones);
    expect(p.archivoEsquema).toBeNull();
    expect(p.motorBase).toBeNull();
    expect(llamadasRespaldo).toEqual([]);
  });

  it('si el volcado falla no queda una plantilla a medias', async () => {
    await expect(
      armar({
        respaldar: async () => {
          throw new Error(`mysqldump falló con password=${CENTINELA}`);
        },
      }).guardar('tienda', opciones),
    ).rejects.toMatchObject({ codigo: 'plantillas.esquema_fallo' });
    expect(await readdir(rutas.plantillas())).toEqual([]);
  });
});

describe('Plantillas: lista, ids y borrado', () => {
  it('lista las válidas y borrar una no toca los proyectos', async () => {
    const pl = armar();
    const a = await pl.guardar('tienda', opciones);
    expect((await pl.lista()).map((x) => x.id)).toEqual([a.id]);
    await pl.borrar(a.id);
    expect(await pl.lista()).toEqual([]);
    expect((await stat(path.join(proyecto, 'composer.json'))).isFile()).toBe(true);
    expect((await stat(path.join(proyecto, '.env'))).isFile()).toBe(true);
  });

  it('un id con .. o separadores se rechaza sin tocar el disco', async () => {
    const pl = armar();
    for (const id of ['..', '../datos', 'a/b', 'a\\b', 'C:\\x', '', '.tmp-1', 'A']) {
      await expect(pl.borrar(id)).rejects.toMatchObject({ codigo: 'plantillas.id_invalido' });
      await expect(pl.cargar(id)).rejects.toMatchObject({ codigo: 'plantillas.id_invalido' });
      await expect(pl.restaurarArchivos(id, dir)).rejects.toMatchObject({
        codigo: 'plantillas.id_invalido',
      });
    }
    expect((await stat(dir)).isDirectory()).toBe(true);
  });

  it('una plantilla que no existe da plantillas.no_existe', async () => {
    await expect(armar().cargar('nada-aaaaaa')).rejects.toMatchObject({
      codigo: 'plantillas.no_existe',
    });
    await expect(armar().borrar('nada-aaaaaa')).rejects.toMatchObject({
      codigo: 'plantillas.no_existe',
    });
  });
});

describe('Plantillas: restaurar archivos y plantillas dañadas', () => {
  let destino: string;
  beforeEach(async () => {
    destino = path.join(dir, 'nuevo');
    await mkdir(destino);
  });

  it('copia los archivos a una carpeta vacía', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    const r = await pl.restaurarArchivos(p.id, destino);
    expect(r.archivos).toBe(3);
    expect(await readFile(path.join(destino, 'app', 'Modelo.php'), 'utf8')).toBe('<?php // modelo');
    expect((await readdir(destino)).sort()).toEqual(['app', 'composer.json', 'public']);
  });

  it('no pisa una carpeta con archivos', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    await writeFile(path.join(destino, 'mio.txt'), 'MIO');
    await expect(pl.restaurarArchivos(p.id, destino)).rejects.toMatchObject({
      codigo: 'proyectos.carpeta_no_vacia',
    });
    expect(await readFile(path.join(destino, 'mio.txt'), 'utf8')).toBe('MIO');
  });

  it('plantilla.json roto o con campos de más da plantillas.danada', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    const json = path.join(rutas.plantillas(), p.id, 'plantilla.json');
    await writeFile(json, '{ no es json');
    await expect(pl.cargar(p.id)).rejects.toMatchObject({ codigo: 'plantillas.danada' });
    await writeFile(json, JSON.stringify({ ...p, ruta: 'C:\\Windows' }));
    await expect(pl.cargar(p.id)).rejects.toMatchObject({ codigo: 'plantillas.danada' });
    await writeFile(json, JSON.stringify({ ...p, id: 'otra-aaaaaa' }));
    await expect(pl.cargar(p.id)).rejects.toMatchObject({ codigo: 'plantillas.danada' });
    // Una plantilla dañada no sale en la lista, pero se puede borrar.
    expect(await pl.lista()).toEqual([]);
    await pl.borrar(p.id);
    expect(await readdir(rutas.plantillas())).toEqual([]);
  });

  it('archivos.zip con otro contenido (otra huella) da plantillas.danada y no escribe', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    const zip = path.join(rutas.plantillas(), p.id, 'archivos.zip');
    await writeFile(zip, zipCrudo({ 'app/otro.php': 'x' }));
    await expect(pl.restaurarArchivos(p.id, destino)).rejects.toMatchObject({
      codigo: 'plantillas.danada',
    });
    expect(await readdir(destino)).toEqual([]);
  });

  it.each([
    ['../escape.txt'],
    ['..\\escape.txt'],
    ['a/../../escape.txt'],
    ['/abs/escape.txt'],
    ['C:/escape.txt'],
    ['a.txt:flujo'],
    ['app/nul.txt'],
    ['app/com1'],
    ['app/x. '],
    ['app/ok.php\u0000.txt'],
  ])(
    'zip-slip (%s): aunque la huella coincida, error con código y nada fuera de la carpeta',
    async (entrada) => {
      const pl = armar();
      const p = await pl.guardar('tienda', opciones);
      const dirP = path.join(rutas.plantillas(), p.id);
      // El atacante reemplaza el zip y recalcula la huella del json.
      const malo = zipCrudo({ 'app/ok.php': 'ok', [entrada]: 'PWNED' });
      await writeFile(path.join(dirP, 'archivos.zip'), malo);
      const json = JSON.parse(await readFile(path.join(dirP, 'plantilla.json'), 'utf8'));
      json.sha256.archivos = createHash('sha256').update(malo).digest('hex');
      await writeFile(path.join(dirP, 'plantilla.json'), JSON.stringify(json));

      await expect(pl.restaurarArchivos(p.id, destino)).rejects.toMatchObject({
        codigo: 'plantillas.danada',
      });
      expect(await readdir(destino)).toEqual([]);
      for (const sospechoso of [
        path.join(dir, 'escape.txt'),
        path.join(dir, 'datos', 'escape.txt'),
        path.join(destino, '..', 'escape.txt'),
        path.resolve(path.parse(dir).root, 'abs', 'escape.txt'),
        path.resolve(path.parse(dir).root, 'escape.txt'),
      ]) {
        await expect(stat(sospechoso)).rejects.toThrow();
      }
      // Nada se queda a medias en tmp.
      expect(await readdir(rutas.tmp()).catch(() => [])).toEqual([]);
    },
  );

  it('un zip con demasiadas entradas se rechaza antes de extraer', async () => {
    const pl = armar({ limites: { maxArchivos: 1 } });
    const p = await armar().guardar('tienda', opciones);
    const dirP = path.join(rutas.plantillas(), p.id);
    const muchos: Record<string, string> = {};
    for (let i = 0; i < 1100; i++) muchos[`a/${i}.txt`] = 'x';
    const malo = zipCrudo(muchos);
    await writeFile(path.join(dirP, 'archivos.zip'), malo);
    const json = JSON.parse(await readFile(path.join(dirP, 'plantilla.json'), 'utf8'));
    json.sha256.archivos = createHash('sha256').update(malo).digest('hex');
    await writeFile(path.join(dirP, 'plantilla.json'), JSON.stringify(json));
    await expect(pl.restaurarArchivos(p.id, destino)).rejects.toMatchObject({
      codigo: 'plantillas.danada',
    });
    expect(await readdir(destino)).toEqual([]);
  });

  it('esquema modificado: rutaEsquema da plantillas.danada', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    const esquema = await pl.rutaEsquema(p.id);
    expect(esquema.motor).toBe('mysql');
    await writeFile(esquema.ruta, 'DROP DATABASE mysql;');
    await expect(pl.rutaEsquema(p.id)).rejects.toMatchObject({ codigo: 'plantillas.danada' });
  });

  it('sin esquema, rutaEsquema da plantillas.sin_esquema', async () => {
    const pl = armar({ baseDe: async () => null });
    const p = await pl.guardar('tienda', opciones);
    await expect(pl.rutaEsquema(p.id)).rejects.toMatchObject({ codigo: 'plantillas.sin_esquema' });
  });
});

describe('sinSecretosPlantilla', () => {
  it('quita las claves con nombre de secreto y enmascara lo que lo parezca', () => {
    expect(
      sinSecretosPlantilla({
        a: 1,
        DB_PASSWORD: 'x',
        anidado: { api_key: 'y', ok: 'sk-prueba-falsa-0000', lista: [{ token: 'z', v: 'w' }] },
      }),
    ).toEqual({ a: 1, anidado: { ok: 'sk-***', lista: [{ v: 'w' }] } });
  });
});

describe('crearProyecto desde una plantilla (mismas validaciones que D12)', () => {
  let carpeta: string;
  let creados: Omit<Sitio, 'id'>[];
  let recetas: PasoReceta[][];
  let ajustes: { id: string; phpIni: Record<string, string>; reglasNginx: string | null }[];
  let bases: string[];
  let plantilla: Plantilla;

  const base = (): Plantilla => ({
    id: 'tienda-a1b2c3',
    nombre: 'Tienda',
    creada: '2026-11-24T00:00:00.000Z',
    tipo: 'laravel',
    receta: [
      { id: 'composer-install', tipo: 'composer-install', titulo: 'Composer' },
      {
        id: 'env-crear',
        tipo: 'env-crear',
        titulo: 'Crear .env',
        args: { valores: { APP_NAME: 'T' } },
      },
      { id: 'key-generate', tipo: 'key-generate', titulo: 'Clave' },
      { id: 'migrar', tipo: 'migrar', titulo: 'Migrar' },
      { id: 'comando', tipo: 'comando', titulo: 'Raro', args: { comando: ['calc.exe'] } },
    ],
    php: '8.3',
    phpIni: { memory_limit: '512M' },
    extensiones: ['mbstring', 'gd'],
    runtimes: { node: '22.1.0' },
    reglasNginx: 'client_max_body_size 50m;',
    motorBase: 'mysql',
    moduloAsgi: null,
    conArchivos: true,
    archivoEsquema: 'esquema.sql',
    sha256: { archivos: 'a'.repeat(64), esquema: 'b'.repeat(64) },
  });

  const pedido = (extra: Partial<PedidoProyecto> = {}): PedidoProyecto => ({
    tipo: 'laravel',
    plantilla: 'tienda-a1b2c3',
    nombre: 'nueva',
    carpeta,
    base: { instancia: null, nombre: 'nueva' },
    opciones: {},
    ...extra,
  });

  const deps = (extra: Partial<DepsCrearProyecto> = {}): DepsCrearProyecto => ({
    rutas: { base: path.join(dir, 'datos') },
    crearSitio: async (d) => {
      creados.push(d);
      return { sitio: { ...d, id: 'nueva' } as Sitio };
    },
    ejecutarReceta: async (_id, receta) => {
      recetas.push(receta);
      return { estado: 'lista' };
    },
    estadoReceta: () => ({ pasos: [] }),
    sitios: async () => [],
    basesDe: async () => bases,
    phpInstaladas: async () => ['8.3', '8.4'],
    pythonInstaladas: async () => ['3.12.10'],
    confiar: async () => undefined,
    plantillas: { cargar: async () => plantilla },
    extensionesActivas: async () => ['mbstring'],
    aplicarAjustes: async (id, a) => {
      ajustes.push({ id, ...a });
      return [];
    },
    ...extra,
  });

  beforeEach(() => {
    carpeta = path.join(dir, 'nueva');
    creados = [];
    recetas = [];
    ajustes = [];
    bases = [];
    plantilla = base();
  });

  it('copia archivos, crea la base nueva, repite lo permitido y restaura el esquema', async () => {
    const r = await crearProyecto(deps(), pedido());
    expect(recetas[0]!.map((p) => p.tipo)).toEqual([
      'restaurar-plantilla-archivos',
      'bd-crear',
      'composer-install',
      'env-crear',
      'key-generate',
      'restaurar-esquema-plantilla',
      'sitio-crear',
    ]);
    const bd = recetas[0]!.find((p) => p.tipo === 'bd-crear')!;
    expect(bd.args).toMatchObject({ motor: 'mysql', base: 'nueva', nueva: true });
    expect(recetas[0]!.find((p) => p.tipo === 'env-crear')!.args).toMatchObject({
      valores: { APP_NAME: 'T' },
      base: 'nueva',
    });
    // PHP de la plantilla (instalado) y runtimes que ella fijaba.
    expect(creados[0]!.php).toBe('8.3');
    expect(creados[0]!.runtimes).toEqual({ node: '22.1.0' });
    expect(creados[0]!.confiado).toBe(true);
    expect(r.creado.carpeta).toBe(true);
  });

  it('los comandos propios de la plantilla no se vuelven a correr y se avisa', async () => {
    const r = await crearProyecto(deps(), pedido());
    expect(recetas[0]!.some((p) => p.tipo === 'comando')).toBe(false);
    expect(r.avisos.join('\n')).toMatch(/omitieron 1 pasos.*comando/);
  });

  it('aplica php.ini y reglas de Nginx al terminar y avisa de extensiones que faltan', async () => {
    const r = await crearProyecto(deps(), pedido());
    expect(ajustes).toEqual([
      { id: 'nueva', phpIni: { memory_limit: '512M' }, reglasNginx: 'client_max_body_size 50m;' },
    ]);
    expect(r.avisos.join('\n')).toMatch(/gd/);
    expect(r.avisos.join('\n')).not.toMatch(/mbstring/);
  });

  it('si la receta falla no aplica ajustes', async () => {
    await crearProyecto(
      deps({ ejecutarReceta: async () => ({ estado: 'error', mensaje: 'falló' }) }),
      pedido(),
    );
    expect(ajustes).toEqual([]);
  });

  it('sin base: no hay bd-crear, esquema ni migraciones y Laravel usa archivos', async () => {
    await crearProyecto(deps(), pedido({ base: null }));
    expect(recetas[0]!.map((p) => p.tipo)).toEqual([
      'restaurar-plantilla-archivos',
      'composer-install',
      'env-crear',
      'key-generate',
      'sitio-crear',
    ]);
    expect(recetas[0]!.find((p) => p.tipo === 'env-crear')!.args).toMatchObject({
      valores: { APP_NAME: 'T', SESSION_DRIVER: 'file' },
    });
  });

  it('con una base sin esquema se migra', async () => {
    plantilla = {
      ...base(),
      archivoEsquema: null,
      sha256: { archivos: 'a'.repeat(64), esquema: null },
    };
    await crearProyecto(deps(), pedido());
    expect(recetas[0]!.map((p) => p.tipo)).toContain('migrar');
    expect(recetas[0]!.map((p) => p.tipo)).not.toContain('restaurar-esquema-plantilla');
  });

  it('una carpeta con archivos no se toca: carpeta_no_vacia y no se crea nada', async () => {
    await mkdir(carpeta);
    await writeFile(path.join(carpeta, 'mio.txt'), 'MIO');
    await expect(crearProyecto(deps(), pedido())).rejects.toMatchObject({
      codigo: 'proyectos.carpeta_no_vacia',
    });
    expect(creados).toEqual([]);
    expect(recetas).toEqual([]);
    expect(await readFile(path.join(carpeta, 'mio.txt'), 'utf8')).toBe('MIO');
  });

  it('una base que ya existe nunca se reutiliza', async () => {
    bases = ['nueva'];
    await expect(crearProyecto(deps(), pedido())).rejects.toMatchObject({
      codigo: 'proyectos.base_existe',
    });
    expect(creados).toEqual([]);
  });

  it('un esquema de otro motor, un id raro, una plantilla ausente y opciones ajenas se rechazan', async () => {
    plantilla = { ...base(), motorBase: 'postgresql', archivoEsquema: 'esquema.dump' };
    await expect(
      crearProyecto(deps(), pedido({ base: { instancia: null, nombre: 'nueva', motor: 'mysql' } })),
    ).rejects.toMatchObject({ codigo: 'proyectos.argumento_invalido' });
    plantilla = base();
    await expect(crearProyecto(deps(), pedido({ plantilla: '../../x' }))).rejects.toMatchObject({
      codigo: 'plantillas.id_invalido',
    });
    await expect(
      crearProyecto(
        deps({
          plantillas: {
            cargar: async () => {
              throw new ErrorWolf('plantillas.no_existe', 'no');
            },
          },
        }),
        pedido(),
      ),
    ).rejects.toMatchObject({ codigo: 'plantillas.no_existe' });
    await expect(
      crearProyecto(deps(), pedido({ opciones: { starterKit: 'vue' } })),
    ).rejects.toMatchObject({ codigo: 'proyectos.argumento_invalido' });
    expect(creados).toEqual([]);
  });

  it('el nombre y el dominio siguen validándose igual', async () => {
    await expect(crearProyecto(deps(), pedido({ nombre: 'Mala Mayuscula' }))).rejects.toMatchObject(
      { codigo: 'proyectos.nombre_invalido' },
    );
    await expect(
      crearProyecto(
        deps({
          sitios: async () => [
            { ...sitioBase(), dominio: 'nueva.test', carpeta: path.join(dir, 'otra') },
          ],
        }),
        pedido(),
      ),
    ).rejects.toMatchObject({ codigo: 'proyectos.dominio_existe' });
  });

  it('FastAPI: el proceso uvicorn sale del módulo guardado, no de los procesos de la plantilla', async () => {
    plantilla = {
      ...base(),
      tipo: 'fastapi',
      php: null,
      motorBase: 'postgresql',
      archivoEsquema: 'esquema.dump',
      moduloAsgi: 'app.main:app',
      receta: [],
    };
    await crearProyecto(
      deps(),
      pedido({ base: { instancia: null, nombre: 'nueva', motor: 'postgresql' } }),
    );
    const sitioPaso = recetas[0]!.find((p) => p.tipo === 'sitio-crear')!;
    const procesos = sitioPaso.args!.procesos as { comando: string[] }[];
    expect(procesos).toHaveLength(1);
    expect(procesos[0]!.comando).toContain('app.main:app');
  });
});

describe('C1: secretos que no deben escaparse', () => {
  const LISTA_DIRS = [
    'bootstrap/cache/config.php',
    'storage/framework/sessions/x',
    'storage/app/privado.txt',
    'writable/session/x',
    'var/cache/prod/x.php',
    'wp-content/uploads/2026/x.txt',
    '.aws/credentials',
    '.ssh/config',
    '.docker/config.json',
    'app/etc/env.php',
    'web/sites/default/settings.php',
    'web/sites/default/settings.local.php',
    'a/b.decrypt.private.php',
    '.envrc',
    '.pgpass',
    '.my.cnf',
    '.git-credentials',
    'sftp.json',
    '.yarnrc.yml',
    'claves.kdbx',
  ];

  it('las carpetas y archivos nuevos se dejan fuera aunque lleven la centinela', async () => {
    for (const rel of LISTA_DIRS) await escribir(rel, `x ${CENTINELA}`);
    const p = await armar().guardar('tienda', opciones);
    const zip = await leerZip(path.join(rutas.plantillas(), p.id, 'archivos.zip'));
    expect([...zip.keys()].sort()).toEqual(['app/Modelo.php', 'composer.json', 'public/index.php']);
    expect(await textoDe(path.join(rutas.plantillas(), p.id))).not.toContain(CENTINELA);
  });

  it.each([
    [
      'docker-compose.yml',
      `services:\n  db:\n    environment:\n      MYSQL_ROOT_PASSWORD: ${CENTINELA}\n`,
    ],
    ['config/servicio.json', `{ "api_key": "${CENTINELA}" }`],
    ['phpunit.xml', `<phpunit><php><env name="DB_PASSWORD" value="${CENTINELA}"/></php></phpunit>`],
    ['config/a.php', `<?php return ['password' => '${CENTINELA}'];`],
    ['config/b.php', `<?php return ["DB_pwd"=>"${CENTINELA}"];`],
    ['config/c.ini', `mysqli.default_pw = ${CENTINELA}`],
    ['config/d.env', `app_key=${CENTINELA}`],
    ['config/e.yml', `dsn: ${CENTINELA}`],
  ])('escaneo de contenido: %s se deja fuera', async (rel, texto) => {
    await escribir(rel, texto);
    const v = await armar().vistaPrevia('tienda', {});
    expect(v.excluidos).toContain(`${rel} (secreto)`);
    const p = await armar().guardar('tienda', opciones);
    expect(await textoDe(path.join(rutas.plantillas(), p.id))).not.toContain(CENTINELA);
  });

  it('UTF-16 con BOM (LE y BE) también se escanea', async () => {
    const le = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from(`DB_PASSWORD=${CENTINELA}`, 'utf16le'),
    ]);
    const be = Buffer.from(le);
    be.subarray(2).swap16();
    be[0] = 0xfe;
    be[1] = 0xff;
    await escribir('config/le.txt', le);
    await escribir('config/be.txt', be);
    const v = await armar().vistaPrevia('tienda', {});
    expect(v.excluidos).toEqual(
      expect.arrayContaining(['config/le.txt (secreto)', 'config/be.txt (secreto)']),
    );
  });

  it('valores vacíos y referencias (env(), ${VAR}, $VAR) no se toman por secretos', async () => {
    await escribir('config/vacio.env', 'DB_PASSWORD=\nAPI_KEY=""\n');
    await escribir(
      'config/ref.php',
      "<?php return ['password' => env('DB_PASSWORD'), 'key' => 1];",
    );
    await escribir(
      'docker-compose.yml',
      'environment:\n  DB_PASSWORD: ${DB_PASSWORD}\n  TOKEN: $TOKEN\n',
    );
    await escribir('config/primary.php', "<?php return ['primary_key' => 'identificador'];");
    const v = await armar().vistaPrevia('tienda', {});
    expect(v.excluidos.filter((x) => x.endsWith('(secreto)'))).toEqual([
      'config/cache.php (secreto)',
    ]);
  });
});
