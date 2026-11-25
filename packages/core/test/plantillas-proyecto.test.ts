import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, stat, symlink, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import yauzl from 'yauzl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { carpetaTemporal } from './temporales';
import { ErrorWolf } from '../src/errores';
import { crearProyecto, type DepsCrearProyecto } from '../src/proyectos/crear';
import { revisarRequirements } from '../src/proyectos/pasos/python';
import {
  generadorDePlantilla,
  pasosOmitidosDePlantilla,
  type PedidoProyecto,
} from '../src/proyectos/generadores';
import { leerBaseDelProyecto } from '../src/bd/baseProyecto';
import { Rutas } from '../src/rutas';
import {
  compilarExclusiones,
  EXCLUSIONES_PLANTILLA,
  argsPermitidos,
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
    ).rejects.toMatchObject({
      codigo: 'plantillas.demasiado_pesada',
    });
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
    origen: 'propia',
    generador: null,
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

  it('no vuelve a tomar la huella de la receta de la carpeta (no confía en lo que vino en archivos)', async () => {
    const confiadas: string[] = [];
    await crearProyecto(deps({ confiar: async (id) => void confiadas.push(id) }), pedido());
    expect(confiadas).toEqual([]);
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

describe('I1: un zip manipulado no puede traer lo que una plantilla nunca lleva', () => {
  it.each([
    ['wolfcore.yml'],
    ['.env'],
    ['.ENV.local'],
    ['vendor/evil/autoload.php'],
    ['node_modules/x/index.js'],
    ['.git/hooks/pre-commit'],
    ['config/id_rsa'],
    ['certs/a.PEM'],
    ['wp-config.php'],
  ])('%s en el zip da plantillas.danada y no se extrae nada', async (entrada) => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    const dirP = path.join(rutas.plantillas(), p.id);
    const malo = zipCrudo({ 'app/ok.php': 'ok', [entrada]: 'x' });
    await writeFile(path.join(dirP, 'archivos.zip'), malo);
    const json = JSON.parse(await readFile(path.join(dirP, 'plantilla.json'), 'utf8'));
    json.sha256.archivos = createHash('sha256').update(malo).digest('hex');
    await writeFile(path.join(dirP, 'plantilla.json'), JSON.stringify(json));
    const destino = path.join(dir, 'nuevo-i1');
    await mkdir(destino);
    await expect(pl.restaurarArchivos(p.id, destino)).rejects.toMatchObject({
      codigo: 'plantillas.danada',
    });
    expect(await readdir(destino)).toEqual([]);
  });
});

describe('I2: la base y el servidor correctos', () => {
  const resolver = async (
    motor: string,
    puerto: number | null,
  ): Promise<{ servidor: string; motor: string } | null> => {
    if (puerto === null || puerto === 3306) return { servidor: motor, motor };
    if (puerto === 3307) return { servidor: 'mysql@8.4', motor: 'mysql' };
    // Una instancia de MariaDB aunque el .env diga mysql.
    if (puerto === 3308) return { servidor: 'mariadb@11.4', motor: 'mariadb' };
    return null;
  };

  it('Symfony: .env.local manda sobre .env y el puerto elige la instancia', async () => {
    await escribir('.env', 'DATABASE_URL="mysql://root:x@127.0.0.1:3306/vieja"\n');
    await escribir(
      '.env.local',
      'DATABASE_URL="mysql://root:y@127.0.0.1:3307/nueva_bd?serverVersion=8.4"\n',
    );
    const pl = armar({ baseDe: leerBaseDelProyecto, resolverObjetivo: resolver as never });
    const v = await pl.vistaPrevia('tienda', {});
    expect(v.base).toEqual({ nombre: 'nueva_bd', motor: 'mysql', servidor: 'mysql@8.4' });
    const p = await pl.guardar('tienda', opciones);
    expect(llamadasRespaldo).toEqual([
      { motor: 'mysql@8.4', base: 'nueva_bd', opciones: { soloEsquema: true } },
    ]);
    expect(p.motorBase).toBe('mysql');
    // La clave de la URL no sale en ningún lado.
    expect(JSON.stringify(v)).not.toMatch(/:y@|:x@/);
  });

  it('Laravel en una instancia: DB_PORT decide el servidor', async () => {
    await escribir(
      '.env',
      'DB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3307\nDB_DATABASE=tienda\nDB_USERNAME=root\n',
    );
    const pl = armar({ baseDe: leerBaseDelProyecto, resolverObjetivo: resolver as never });
    expect((await pl.vistaPrevia('tienda', {})).base?.servidor).toBe('mysql@8.4');
  });

  it('un servidor remoto o un puerto que ninguna instancia usa no se adivina', async () => {
    await escribir('.env', 'DB_HOST=db.ejemplo.com\nDB_DATABASE=tienda\nDB_USERNAME=root\n');
    const pl = armar({ baseDe: leerBaseDelProyecto, resolverObjetivo: resolver as never });
    const v = await pl.vistaPrevia('tienda', {});
    expect(v.base).toBeNull();
    expect(v.errorBase).toMatch(/servidor local/);
    await expect(pl.guardar('tienda', opciones)).rejects.toMatchObject({
      codigo: 'plantillas.base_no_resuelta',
    });
    await escribir(
      '.env',
      'DB_HOST=127.0.0.1\nDB_PORT=3999\nDB_DATABASE=tienda\nDB_USERNAME=root\n',
    );
    await expect(pl.guardar('tienda', opciones)).rejects.toMatchObject({
      codigo: 'plantillas.base_no_resuelta',
    });
    expect(llamadasRespaldo).toEqual([]);
    expect(await readdir(rutas.plantillas()).catch(() => [])).toEqual([]);
  });

  it('avisa cuando el proyecto usa MongoDB (su esquema no se guarda)', async () => {
    expect((await armar().vistaPrevia('tienda', {})).avisoMongodb).toBe(false);
    const pl = armar({ usaMongodb: async () => true });
    expect((await pl.vistaPrevia('tienda', {})).avisoMongodb).toBe(true);
  });
});

describe('I3 / I6: plantilla importada y motor distinto', () => {
  const pl = (extra: Partial<Plantilla> = {}): Plantilla => ({
    id: 'tienda-a1b2c3',
    nombre: 'Tienda',
    creada: '2026-11-24T00:00:00.000Z',
    tipo: 'laravel',
    receta: [
      { id: 'composer-install', tipo: 'composer-install', titulo: 'Composer' },
      { id: 'env-crear', tipo: 'env-crear', titulo: 'Crear .env' },
      { id: 'key-generate', tipo: 'key-generate', titulo: 'Clave' },
      { id: 'storage-link', tipo: 'storage-link', titulo: 'Storage' },
      { id: 'npm-ci', tipo: 'npm-ci', titulo: 'npm ci' },
      { id: 'npm-build', tipo: 'npm-build', titulo: 'npm build' },
    ],
    php: '8.3',
    phpIni: {},
    extensiones: [],
    runtimes: {},
    reglasNginx: null,
    motorBase: 'mysql',
    origen: 'importada',
    generador: null,
    moduloAsgi: null,
    conArchivos: true,
    archivoEsquema: 'esquema.sql',
    sha256: { archivos: 'a'.repeat(64), esquema: 'b'.repeat(64) },
    ...extra,
  });

  it('importada: sin scripts de Composer ni npm, sin pasos que corren su código y con origen en el esquema', () => {
    const p = generadorDePlantilla(pl()).pasos({
      tipo: 'laravel',
      plantilla: 'tienda-a1b2c3',
      nombre: 'nueva',
      carpeta: 'C:\\x\\nueva',
      base: { instancia: null, nombre: 'nueva', motor: 'mysql' },
      opciones: {},
    });
    const t = p.map((x) => x.tipo);
    expect(t).not.toContain('key-generate');
    expect(t).not.toContain('storage-link');
    expect(t).not.toContain('npm-build');
    expect(p.find((x) => x.tipo === 'composer-install')!.args).toMatchObject({ sinScripts: true });
    expect(p.find((x) => x.tipo === 'npm-ci')!.args).toMatchObject({ sinScripts: true });
    expect(p.find((x) => x.tipo === 'restaurar-esquema-plantilla')!.args).not.toHaveProperty(
      'origen',
    );
    expect(pasosOmitidosDePlantilla(pl()).map((x) => x.tipo)).toEqual([
      'key-generate',
      'storage-link',
      'npm-build',
    ]);
  });

  it('propia: los pasos se repiten sin la marca de scripts', () => {
    const p = generadorDePlantilla(pl({ origen: 'propia' })).pasos({
      tipo: 'laravel',
      plantilla: 'tienda-a1b2c3',
      nombre: 'nueva',
      carpeta: 'C:\\x\\nueva',
      base: null,
      opciones: {},
    });
    expect(p.find((x) => x.tipo === 'composer-install')!.args).toBeUndefined();
    expect(p.map((x) => x.tipo)).toContain('key-generate');
  });

  it('MySQL → MariaDB pide confirmación antes de crear nada', async () => {
    const plantilla = pl({ origen: 'propia' });
    const carpeta = path.join(dir, 'nueva');
    const creados: unknown[] = [];
    const deps: DepsCrearProyecto = {
      rutas: { base: path.join(dir, 'datos') },
      crearSitio: async (d) => {
        creados.push(d);
        return { sitio: { ...d, id: 'nueva' } as Sitio };
      },
      ejecutarReceta: async () => ({ estado: 'lista' }),
      estadoReceta: () => ({ pasos: [] }),
      sitios: async () => [],
      basesDe: async () => [],
      phpInstaladas: async () => ['8.3'],
      pythonInstaladas: async () => [],
      confiar: async () => undefined,
      plantillas: { cargar: async () => plantilla },
    };
    const pedido = (opciones: PedidoProyecto['opciones']): PedidoProyecto => ({
      tipo: 'laravel',
      plantilla: 'tienda-a1b2c3',
      nombre: 'nueva',
      carpeta,
      base: { instancia: 'mariadb@11.4', nombre: 'nueva' },
      opciones,
    });
    await expect(crearProyecto(deps, pedido({}))).rejects.toMatchObject({
      codigo: 'plantillas.motor_distinto',
    });
    expect(creados).toEqual([]);
    await crearProyecto(deps, pedido({ confirmarMotorDistinto: true }));
    expect(creados).toHaveLength(1);
    // Mismo motor: sin confirmación.
    await expect(
      crearProyecto(deps, {
        ...pedido({}),
        nombre: 'otra',
        carpeta: path.join(dir, 'otra'),
        base: { instancia: 'mysql@8.4', nombre: 'otra' },
      }),
    ).resolves.toBeDefined();
  });
});

describe('I4: plantillas sin archivos y configuración que no viaja', () => {
  const pl = (extra: Partial<Plantilla> = {}): Plantilla => ({
    id: 'base-a1b2c3',
    nombre: 'Base',
    creada: '2026-11-24T00:00:00.000Z',
    tipo: 'laravel',
    receta: [{ id: 'npm-ci', tipo: 'npm-ci', titulo: 'npm' }],
    php: '8.3',
    phpIni: {},
    extensiones: [],
    runtimes: {},
    reglasNginx: null,
    motorBase: 'mysql',
    origen: 'propia',
    generador: null,
    moduloAsgi: null,
    conArchivos: false,
    archivoEsquema: 'esquema.sql',
    sha256: { archivos: null, esquema: 'b'.repeat(64) },
    ...extra,
  });
  const ped = (
    tipo: PedidoProyecto['tipo'],
    extra: Partial<PedidoProyecto> = {},
  ): PedidoProyecto => ({
    tipo,
    plantilla: 'base-a1b2c3',
    nombre: 'nueva',
    carpeta: 'C:\\x\\nueva',
    base: { instancia: null, nombre: 'nueva', motor: 'mysql' },
    opciones: {},
    ...extra,
  });
  const tipos = (p: { tipo: string }[]): string[] => p.map((x) => x.tipo);

  it('Laravel sin archivos: el generador base del tipo y el esquema en lugar de migrar', () => {
    const p = generadorDePlantilla(pl()).pasos(ped('laravel'));
    expect(tipos(p)).toEqual([
      'crear-desde-composer',
      'bd-crear',
      'env-crear',
      'key-generate',
      'restaurar-esquema-plantilla',
      'sitio-crear',
    ]);
    expect(p.find((x) => x.tipo === 'crear-desde-composer')!.args).toEqual({
      paquete: 'laravel/laravel',
    });
  });

  it('sin base no hay esquema y Laravel migra como en un proyecto nuevo', () => {
    const p = generadorDePlantilla(pl()).pasos(ped('laravel', { base: null }));
    expect(tipos(p)).not.toContain('restaurar-esquema-plantilla');
    expect(tipos(p)).not.toContain('bd-crear');
  });

  it('WordPress sin archivos descarga y crea wp-config.php; pide la huella débil', async () => {
    const p = generadorDePlantilla(pl({ tipo: 'wordpress' })).pasos(ped('wordpress'));
    expect(tipos(p)).toEqual([
      'descargar-plantilla',
      'bd-crear',
      'config-bd-crear',
      'restaurar-esquema-plantilla',
      'sitio-crear',
    ]);
    const deps = depsMinimas({ tipo: 'wordpress', conArchivos: false });
    await expect(
      crearProyecto(deps, { ...ped('wordpress'), carpeta: path.join(dir, 'nueva') }),
    ).rejects.toMatchObject({ codigo: 'catalogo.huella_debil' });
    await expect(
      crearProyecto(deps, {
        ...ped('wordpress'),
        carpeta: path.join(dir, 'nueva'),
        opciones: { confirmarHuellaDebil: true },
      }),
    ).resolves.toBeDefined();
  });

  it('WordPress y CodeIgniter 3 con archivos: wp-config.php y database.php se vuelven a crear', () => {
    const wp = generadorDePlantilla(pl({ tipo: 'wordpress', conArchivos: true, receta: [] })).pasos(
      ped('wordpress'),
    );
    expect(tipos(wp)).toEqual([
      'restaurar-plantilla-archivos',
      'bd-crear',
      'config-bd-crear',
      'restaurar-esquema-plantilla',
      'sitio-crear',
    ]);
    expect(wp.find((x) => x.tipo === 'config-bd-crear')!.args).toMatchObject({
      marco: 'wordpress',
    });
    const ci = generadorDePlantilla(
      pl({ tipo: 'codeigniter3', conArchivos: true, receta: [] }),
    ).pasos(ped('codeigniter3', { base: null }));
    expect(ci.find((x) => x.tipo === 'config-bd-crear')!.args).toMatchObject({
      marco: 'codeigniter3',
      sinBd: true,
    });
  });
});

function depsMinimas(extra: Partial<Plantilla>): DepsCrearProyecto {
  const plantilla: Plantilla = {
    id: 'base-a1b2c3',
    nombre: 'Base',
    creada: '2026-11-24T00:00:00.000Z',
    tipo: 'laravel',
    receta: [],
    php: '8.3',
    phpIni: {},
    extensiones: [],
    runtimes: {},
    reglasNginx: null,
    motorBase: 'mysql',
    origen: 'propia',
    generador: null,
    moduloAsgi: null,
    conArchivos: false,
    archivoEsquema: 'esquema.sql',
    sha256: { archivos: null, esquema: 'b'.repeat(64) },
    ...extra,
  };
  return {
    rutas: { base: path.join(dir, 'datos') },
    crearSitio: async (d) => ({ sitio: { ...d, id: 'nueva' } as Sitio }),
    ejecutarReceta: async () => ({ estado: 'lista' }),
    estadoReceta: () => ({ pasos: [] }),
    sitios: async () => [],
    basesDe: async () => [],
    phpInstaladas: async () => ['8.3'],
    pythonInstaladas: async () => [],
    confiar: async () => undefined,
    plantillas: { cargar: async () => plantilla },
  };
}

describe('I5: patrones con ruta y comodines', () => {
  it('config/secrets/* excluye lo que cuelga de esa carpeta, a cualquier profundidad', async () => {
    await escribir('config/secrets/a.txt', 'x');
    await escribir('config/secrets/sub/b.txt', 'x');
    await escribir('config/publica/c.txt', 'x');
    await escribir('config/secretsx/d.txt', 'x');
    const v = await armar().vistaPrevia('tienda', { excluirExtra: ['config/secrets/*'] });
    expect(v.excluidos).toEqual(
      expect.arrayContaining(['config/secrets/a.txt', 'config/secrets/sub']),
    );
    expect(v.excluidos).not.toContain('config/publica');
    const p = await armar().guardar('tienda', { ...opciones, excluirExtra: ['config/secrets/*'] });
    const zip = await leerZip(path.join(rutas.plantillas(), p.id, 'archivos.zip'));
    expect([...zip.keys()].filter((k) => k.startsWith('config/')).sort()).toEqual([
      'config/publica/c.txt',
      'config/secretsx/d.txt',
    ]);
  });

  it('un * en medio de la ruta vale por un tramo (app/*/cache)', async () => {
    await escribir('app/a/cache/x', 'x');
    await escribir('app/b/cache/y', 'x');
    await escribir('app/b/otra/z', 'x');
    const p = await armar().guardar('tienda', { ...opciones, excluirExtra: ['app/*/cache'] });
    const zip = await leerZip(path.join(rutas.plantillas(), p.id, 'archivos.zip'));
    expect([...zip.keys()]).toEqual(expect.arrayContaining(['app/b/otra/z']));
    expect([...zip.keys()].some((k) => k.includes('/cache/'))).toBe(false);
  });

  it('muchos comodines se rechazan y los repetidos se juntan', async () => {
    await expect(
      armar().vistaPrevia('tienda', { excluirExtra: ['a*b*c*d*e*f*g*h'] }),
    ).rejects.toMatchObject({ codigo: 'plantillas.exclusion_invalida' });
    // a***b es a*b: un solo comodín.
    expect(() => compilarExclusiones(['a***b***c'])).not.toThrow();
  });

  it('un patrón hostil (a*a*a*…b) no cuelga la comparación', () => {
    const [c] = compilarExclusiones(['a*a*a*a*a*b']).slice(-1);
    const largo = 'a'.repeat(5000);
    const t0 = Date.now();
    expect(c!(largo, largo)).toBe(false);
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});

describe('I7: argumentos de la receta', () => {
  const mala = (): Plantilla => ({
    id: 'tienda-a1b2c3',
    nombre: 'Tienda',
    creada: '2026-11-24T00:00:00.000Z',
    tipo: 'laravel',
    receta: [
      {
        id: 'env-crear',
        tipo: 'env-crear',
        titulo: 'env',
        args: {
          valores: { APP_NAME: 'T', 'MALO NOMBRE': 'x', SALTO: 'a\nb', NUM: 3 },
          usuario: 'root',
          clave: 'admin',
          sobrescribir: true,
          semilla: true,
          base: 'otra_base',
          motor: 'postgresql',
          instancia: 'mysql@9.0',
          carpeta: '..\\..',
        },
      },
      { id: 'migrar', tipo: 'migrar', titulo: 'm', args: { semilla: true, sobrescribir: true } },
      {
        id: 'pgvector-activar',
        tipo: 'pgvector-activar',
        titulo: 'pg',
        args: { base: 'otra', instancia: 'postgresql@16', usuario: 'x' },
      },
    ],
    php: '8.3',
    phpIni: {},
    extensiones: [],
    runtimes: {},
    reglasNginx: null,
    motorBase: 'mysql',
    origen: 'propia',
    generador: null,
    moduloAsgi: null,
    conArchivos: true,
    archivoEsquema: null,
    sha256: { archivos: 'a'.repeat(64), esquema: null },
  });

  it('una plantilla manipulada no manda instancia, usuario, clave, sobrescribir ni semilla', () => {
    const p = generadorDePlantilla(mala()).pasos({
      tipo: 'laravel',
      plantilla: 'tienda-a1b2c3',
      nombre: 'nueva',
      carpeta: 'C:\\x\\nueva',
      base: { instancia: 'mysql@8.4', nombre: 'nueva' },
      opciones: {},
    });
    const env = p.find((x) => x.tipo === 'env-crear')!.args!;
    expect(env).toEqual({
      valores: { APP_NAME: 'T', NUM: 3 },
      instancia: 'mysql@8.4',
      base: 'nueva',
    });
    expect(p.find((x) => x.tipo === 'migrar')!.args).toBeUndefined();
  });

  it('argsPermitidos descarta todo lo que no está en la lista del tipo', () => {
    expect(argsPermitidos('migrar', { semilla: true })).toEqual({});
    expect(argsPermitidos('comando', { comando: ['calc'] })).toEqual({});
    expect(argsPermitidos('env-crear', 'x')).toEqual({});
    expect(argsPermitidos('env-crear', { valores: [1] })).toEqual({});
    expect(argsPermitidos('env-crear', { base: 'a', clave: 'b', valores: { A: '1' } })).toEqual({
      valores: { A: '1' },
    });
  });

  it('al guardar, la receta de la plantilla ya viene filtrada', async () => {
    receta = [
      {
        id: 'env-crear',
        tipo: 'env-crear',
        titulo: 'env',
        args: { instancia: 'mysql@9.0', usuario: 'root', valores: { A: '1' } },
      },
      { id: 'migrar', tipo: 'migrar', titulo: 'm', args: { semilla: true } },
      { id: 'comando', tipo: 'comando', titulo: 'c', args: { comando: ['calc'] } },
    ];
    const p = await armar().guardar('tienda', opciones);
    expect(p.receta).toEqual([
      { id: 'env-crear', tipo: 'env-crear', titulo: 'env', args: { valores: { A: '1' } } },
      { id: 'migrar', tipo: 'migrar', titulo: 'm' },
    ]);
  });
});

describe('menores de la segunda revisión', () => {
  it('9: demasiado_grande informa el máximo de archivos y demasiado_pesada el de MiB', async () => {
    await expect(
      armar({ limites: { maxArchivos: 2 } }).guardar('tienda', opciones),
    ).rejects.toMatchObject({ codigo: 'plantillas.demasiado_grande', datos: { maximo: 2 } });
    await expect(
      armar({ limites: { maxBytes: 3 * 1024 * 1024 } }).guardar('tienda', {
        ...opciones,
        conArchivos: true,
      }),
    ).resolves.toBeDefined();
    await escribir('public/a.bin', Buffer.alloc(900 * 1024, 1));
    await escribir('public/b.bin', Buffer.alloc(900 * 1024, 2));
    await escribir('public/c.bin', Buffer.alloc(900 * 1024, 3));
    await expect(
      armar({ limites: { maxBytes: 2 * 1024 * 1024 } }).guardar('tienda', opciones),
    ).rejects.toMatchObject({ codigo: 'plantillas.demasiado_pesada', datos: { maximo: 2 } });
  });

  it('1: el esquema guardado no lleva DEFINER ni AUTO_INCREMENT', async () => {
    const pl = armar({
      respaldar: async (_o, base, carpeta) => {
        await mkdir(carpeta, { recursive: true });
        const archivo = path.join(carpeta, `${base}.sql`);
        await writeFile(
          archivo,
          'CREATE DEFINER=`root`@`localhost` PROCEDURE p() BEGIN END;\nCREATE TABLE t (id int) ENGINE=InnoDB AUTO_INCREMENT=48213 DEFAULT CHARSET=utf8mb4;\n',
        );
        return { archivo };
      },
    });
    const p = await pl.guardar('tienda', opciones);
    const sql = await readFile(path.join(rutas.plantillas(), p.id, 'esquema.sql'), 'utf8');
    expect(sql).not.toMatch(/DEFINER|AUTO_INCREMENT|48213/);
    // La huella es la del esquema ya depurado.
    expect(await pl.rutaEsquema(p.id)).toBeDefined();
  });

  it('1: un esquema con algo que parece una clave no se guarda (MySQL y PostgreSQL)', async () => {
    const con = (texto: string, motor: 'mysql' | 'postgresql') =>
      armar({
        baseDe: async () => ({ motor, base: 'tienda', usuario: 'root' }),
        respaldar: async (_o, base, carpeta) => {
          await mkdir(carpeta, { recursive: true });
          const archivo = path.join(carpeta, `${base}.dump`);
          await writeFile(archivo, texto);
          return { archivo };
        },
        leerEsquema: async () => `CREATE TABLE t (a text DEFAULT 'api_key: ${CENTINELA}');`,
      });
    await expect(
      con(`CREATE TABLE t (a text DEFAULT 'DB_PASSWORD=${CENTINELA}');`, 'mysql').guardar(
        'tienda',
        opciones,
      ),
    ).rejects.toMatchObject({ codigo: 'plantillas.esquema_fallo' });
    await expect(con('PGDMP', 'postgresql').guardar('tienda', opciones)).rejects.toMatchObject({
      codigo: 'plantillas.esquema_fallo',
    });
    expect(await readdir(rutas.plantillas())).toEqual([]);
  });

  it('3: sinSecretosPlantilla usa la misma regla que el escaneo (_KEY, APP_KEY, _PWD, _PW, DSN, default_pw)', () => {
    expect(
      sinSecretosPlantilla({
        STRIPE_KEY: 'a',
        APP_KEY: 'b',
        DB_PWD: 'c',
        SMTP_PW: 'd',
        SENTRY_DSN: 'e',
        'mysqli.default_pw': 'f',
        primary_key: 'id',
        memory_limit: '1G',
      }),
    ).toEqual({ primary_key: 'id', memory_limit: '1G' });
  });

  it('5: un nombre no portable (CON, NUL, a:b) se deja fuera con su motivo', async () => {
    if (process.platform === 'win32') return; // Windows no deja crearlos
    await escribir('public/con.txt', 'x');
    await escribir('public/a:b.txt', 'x');
    const v = await armar().vistaPrevia('tienda', {});
    expect(v.excluidos).toEqual(
      expect.arrayContaining([
        'public/con.txt (nombre no portable)',
        'public/a:b.txt (nombre no portable)',
      ]),
    );
  });

  it('7: las carpetas .tmp-* viejas se limpian y las recientes no', async () => {
    const raiz = rutas.plantillas();
    await mkdir(path.join(raiz, '.tmp-viejo'), { recursive: true });
    await mkdir(path.join(raiz, '.tmp-reciente'), { recursive: true });
    await writeFile(path.join(raiz, '.tmp-viejo', 'x'), 'x');
    const hace = new Date(Date.now() - 60 * 60 * 1000);
    await utimes(path.join(raiz, '.tmp-viejo'), hace, hace);
    await armar().lista();
    expect((await readdir(raiz)).sort()).toEqual(['.tmp-reciente']);
  });

  it('4: preparar verifica las huellas sobre una copia y de ella se extrae (no del original)', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    await pl.preparar(p.id);
    // El original cambia DESPUÉS de verificar: lo que se usa es la copia verificada.
    await writeFile(
      path.join(rutas.plantillas(), p.id, 'archivos.zip'),
      zipCrudo({ 'x.php': 'x' }),
    );
    await writeFile(path.join(rutas.plantillas(), p.id, 'esquema.sql'), 'DROP DATABASE mysql;');
    const destino = path.join(dir, 'nuevo-uso');
    await mkdir(destino);
    expect((await pl.restaurarArchivos(p.id, destino)).archivos).toBe(3);
    expect(await readFile(path.join(destino, 'app', 'Modelo.php'), 'utf8')).toBe('<?php // modelo');
    expect(await readFile((await pl.rutaEsquema(p.id)).ruta, 'utf8')).toContain('CREATE TABLE');
    await pl.liberar(p.id);
    expect(await readdir(rutas.tmp()).catch(() => [])).toEqual([]);
    // Sin copia preparada se vuelve a verificar el original: ahora está cambiado.
    await expect(pl.rutaEsquema(p.id)).rejects.toMatchObject({ codigo: 'plantillas.danada' });
  });

  it('4: una plantilla alterada se rechaza en crearProyecto antes de crear el sitio', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    await writeFile(
      path.join(rutas.plantillas(), p.id, 'archivos.zip'),
      zipCrudo({ 'x.php': 'x' }),
    );
    const creados: unknown[] = [];
    const liberadas: string[] = [];
    const deps: DepsCrearProyecto = {
      rutas: { base: path.join(dir, 'datos') },
      crearSitio: async (d) => {
        creados.push(d);
        return { sitio: { ...d, id: 'nueva' } as Sitio };
      },
      ejecutarReceta: async () => ({ estado: 'lista' }),
      estadoReceta: () => ({ pasos: [] }),
      sitios: async () => [],
      basesDe: async () => [],
      phpInstaladas: async () => ['8.4'],
      pythonInstaladas: async () => [],
      confiar: async () => undefined,
      plantillas: {
        cargar: (id) => pl.cargar(id),
        preparar: (id) => pl.preparar(id),
        liberar: async (id) => {
          liberadas.push(id);
          await pl.liberar(id);
        },
      },
    };
    await expect(
      crearProyecto(deps, {
        tipo: 'laravel',
        plantilla: p.id,
        nombre: 'nueva',
        carpeta: path.join(dir, 'nueva'),
        base: null,
        opciones: {},
      }),
    ).rejects.toMatchObject({ codigo: 'plantillas.danada' });
    expect(creados).toEqual([]);
    await expect(stat(path.join(dir, 'nueva'))).rejects.toThrow();
    expect(liberadas).toEqual([p.id]);
  });
});

describe('R3-I1: el origen no sale de plantilla.json', () => {
  it('una plantilla guardada aquí es propia; manipular el json (aunque diga propia) la vuelve importada', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    expect(p.origen).toBe('propia');
    expect((await pl.cargar(p.id)).origen).toBe('propia');
    const json = path.join(rutas.plantillas(), p.id, 'plantilla.json');
    const obj = JSON.parse(await readFile(json, 'utf8'));
    expect(obj.origen).toBeUndefined();
    // Cualquier cambio al json (aquí, el nombre) rompe la huella registrada.
    await writeFile(json, JSON.stringify({ ...obj, nombre: 'Otro', origen: 'propia' }, null, 2));
    expect((await pl.cargar(p.id)).origen).toBe('importada');
  });

  it('un json que dice propia pero no está registrado en este equipo es importada', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    // La misma carpeta copiada a otro equipo (otro registro, otra carpeta de datos).
    const otra = new Rutas(path.join(dir, 'otro-equipo'));
    await mkdir(otra.plantillas(), { recursive: true });
    await cp(path.join(rutas.plantillas(), p.id), path.join(otra.plantillas(), p.id), {
      recursive: true,
    });
    const ajena = new Plantillas({
      rutas: otra,
      sitio: async () => sitio,
      receta: async () => receta,
      respaldar: async () => ({ archivo: '' }),
    });
    const importada = await ajena.cargar(p.id);
    expect(importada.origen).toBe('importada');
    expect((await ajena.lista())[0]!.origen).toBe('importada');
  });

  it('borrar una plantilla la quita del registro', async () => {
    const pl = armar();
    const p = await pl.guardar('tienda', opciones);
    await pl.borrar(p.id);
    const registro = JSON.parse(await readFile(rutas.plantillasPropias(), 'utf8'));
    expect(registro[p.id]).toBeUndefined();
  });
});

describe('R3-I4: el esquema se revisa al guardar', () => {
  const con = (texto: string) =>
    armar({
      respaldar: async (_o, base, carpeta) => {
        await mkdir(carpeta, { recursive: true });
        const archivo = path.join(carpeta, `${base}.sql`);
        await writeFile(archivo, texto);
        return { archivo };
      },
    });

  it('un esquema con sentencias que no se podrían restaurar no se guarda', async () => {
    await expect(
      con('CREATE TABLE t (a int);\nGRANT ALL ON *.* TO x;').guardar('tienda', opciones),
    ).rejects.toMatchObject({ codigo: 'plantillas.esquema_fallo' });
    expect(await readdir(rutas.plantillas())).toEqual([]);
  });

  it('un volcado real de MariaDB (modo sandbox, condicionales, rutinas) sí se guarda', async () => {
    const sql = [
      '/*M!999999\\- enable the sandbox mode */',
      '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;',
      'DROP TABLE IF EXISTS `t`;',
      'CREATE TABLE `t` (`a` int(11) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;',
      'DELIMITER ;;',
      'CREATE DEFINER=`root`@`localhost` PROCEDURE `p`() BEGIN SELECT 1; END ;;',
      'DELIMITER ;',
    ].join('\n');
    const p = await con(sql).guardar('tienda', opciones);
    expect(p.archivoEsquema).toBe('esquema.sql');
  });
});

describe('R3-I7 / I8: servidor de la familia y generador base', () => {
  it('I7: el puerto manda en toda la familia mysql/mariadb y el motor es el del servidor hallado', async () => {
    await escribir(
      '.env',
      'DB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3308\nDB_DATABASE=tienda\nDB_USERNAME=root\n',
    );
    const resolverMaria = async (motor: string, puerto: number | null) =>
      puerto === 3308 ? { servidor: 'mariadb@11.4', motor: 'mariadb' } : { servidor: motor, motor };
    const pl = armar({ baseDe: leerBaseDelProyecto, resolverObjetivo: resolverMaria as never });
    const v = await pl.vistaPrevia('tienda', {});
    expect(v.base).toEqual({ nombre: 'tienda', motor: 'mariadb', servidor: 'mariadb@11.4' });
    const p = await pl.guardar('tienda', opciones);
    expect(p.motorBase).toBe('mariadb');
    expect(llamadasRespaldo[0]).toMatchObject({ motor: 'mariadb@11.4' });
  });

  it('I8: Symfony (que como sitio es laravel) usa su generador base; un tipo sin generador exige archivos', async () => {
    const symfony = armar({ generadorDe: async () => 'symfony' });
    const p = await symfony.guardar('tienda', { ...opciones, conArchivos: false });
    expect(p.generador).toBe('symfony');
    const pasos = generadorDePlantilla(p).pasos({
      tipo: 'symfony',
      plantilla: p.id,
      nombre: 'nueva',
      carpeta: 'C:\\x\\nueva',
      base: null,
      opciones: {},
    });
    expect(pasos.find((x) => x.tipo === 'crear-desde-composer')!.args).toMatchObject({
      paquete: 'symfony/skeleton',
    });
    sitio = sitioBase({ tipo: 'proxy' });
    await expect(
      armar().guardar('tienda', { ...opciones, conArchivos: false }),
    ).rejects.toMatchObject({ codigo: 'plantillas.sin_generador_base' });
    expect(await readdir(rutas.plantillas()).catch(() => [])).toEqual([p.id]);
    // Con archivos sí se puede.
    await expect(armar().guardar('tienda', opciones)).resolves.toBeDefined();
  });

  it('I8: una plantilla sin archivos de un tipo sin generador no se crea', async () => {
    const deps = depsMinimas({ tipo: 'proxy', conArchivos: false, archivoEsquema: null });
    await expect(
      crearProyecto(deps, {
        tipo: 'estatico',
        plantilla: 'base-a1b2c3',
        nombre: 'nueva',
        carpeta: path.join(dir, 'nueva'),
        base: null,
        opciones: {},
      }),
    ).rejects.toMatchObject({ codigo: 'plantillas.sin_generador_base' });
  });
});

describe('R3-I5: una plantilla importada ejecuta código ajeno: sin scripts, sin procesos, sin confianza', () => {
  const imp = (extra: Partial<Plantilla> = {}): Plantilla => ({
    id: 'api-a1b2c3',
    nombre: 'Api',
    creada: '2026-11-24T00:00:00.000Z',
    tipo: 'fastapi',
    receta: [
      { id: 'python-venv', tipo: 'python-venv', titulo: 'venv' },
      { id: 'pip-install', tipo: 'pip-install', titulo: 'pip' },
    ],
    php: null,
    phpIni: {},
    extensiones: [],
    runtimes: {},
    reglasNginx: null,
    motorBase: null,
    origen: 'importada',
    generador: 'fastapi',
    moduloAsgi: 'main:app',
    conArchivos: true,
    archivoEsquema: null,
    sha256: { archivos: 'a'.repeat(64), esquema: null },
    ...extra,
  });

  it('pip-install lleva sinScripts y el uvicorn no arranca solo', () => {
    const p = generadorDePlantilla(imp()).pasos({
      tipo: 'fastapi',
      plantilla: 'api-a1b2c3',
      nombre: 'nueva',
      carpeta: 'C:\\\\x\\\\nueva',
      base: null,
      opciones: {},
    });
    expect(p.find((x) => x.tipo === 'pip-install')!.args).toMatchObject({ sinScripts: true });
    const procesos = p.find((x) => x.tipo === 'sitio-crear')!.args!.procesos as {
      autoIniciar: boolean;
    }[];
    expect(procesos[0]!.autoIniciar).toBe(false);
    const propia = generadorDePlantilla(imp({ origen: 'propia' })).pasos({
      tipo: 'fastapi',
      plantilla: 'api-a1b2c3',
      nombre: 'nueva',
      carpeta: 'C:\\\\x\\\\nueva',
      base: null,
      opciones: {},
    });
    expect(
      (
        propia.find((x) => x.tipo === 'sitio-crear')!.args!.procesos as { autoIniciar: boolean }[]
      )[0]!.autoIniciar,
    ).toBe(true);
  });

  it('crearProyecto: no arranca procesos, quita la confianza y avisa', async () => {
    const quitadas: string[] = [];
    const iniciados: string[] = [];
    const deps: DepsCrearProyecto = {
      ...depsMinimas({}),
      plantillas: { cargar: async () => imp() },
      pythonInstaladas: async () => ['3.12.10'],
      iniciarProcesos: async (id) => void iniciados.push(id),
      quitarConfianza: async (id) => void quitadas.push(id),
    };
    const r = await crearProyecto(deps, {
      tipo: 'fastapi',
      plantilla: 'api-a1b2c3',
      nombre: 'nueva',
      carpeta: path.join(dir, 'nueva'),
      base: null,
      opciones: {},
    });
    expect(quitadas).toEqual(['nueva']);
    expect(iniciados).toEqual([]);
    expect(r.avisos.join('\n')).toMatch(/tercero.*sin confianza/);
  });
});

describe('R3-I5: pip con un requirements.txt ajeno', () => {
  it.each([
    ['-e .'],
    ['-r otro.txt'],
    ['--index-url https://evil.example/simple'],
    ['paquete @ https://evil.example/p.whl'],
    ['git+https://github.com/x/y.git'],
    ['./local'],
    ['C:\\\\ruta\\\\p'],
    ['paquete==1.0 --hash=sha256:abc'],
    ['https://evil.example/p.tar.gz'],
  ])('rechaza la línea %s', async (linea) => {
    const f = path.join(dir, 'requirements.txt');
    await writeFile(f, `fastapi==0.115.0\n${linea}\n`);
    await expect(revisarRequirements(f)).rejects.toThrow(/requisitos simples/);
  });

  it('acepta requisitos simples, con extras, rangos, marcadores y comentarios', async () => {
    const f = path.join(dir, 'requirements.txt');
    await writeFile(
      f,
      '# deps\nfastapi==0.115.0\nuvicorn[standard]>=0.30,<1  # servidor\npydantic~=2.7 ; python_version >= "3.10"\n\n',
    );
    await expect(revisarRequirements(f)).resolves.toBeUndefined();
  });
});
