import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { CerrojosServicio } from '../src/catalogo/cerrojo';
import {
  claveVersion,
  Limpieza,
  contenidoAjeno,
  type UsosVersiones,
} from '../src/catalogo/limpieza';
import { calcularUsos } from '../src/catalogo/usoVersiones';
import { Rutas } from '../src/rutas';
import { ConfigSchema, SitioSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

/* Revisión opus de D30: venv, pistas de plantillas, sitios ilegibles, datos, contenido ajeno, cerrojo. */

type Deps = Parameters<typeof calcularUsos>[0];

let carpetaSitio = '';
beforeEach(async () => {
  carpetaSitio = await carpetaTemporal('pel-sitio-rev-');
});

async function montar(instaladas: Record<string, string[]>, extra: Partial<Deps> = {}) {
  const base = path.join(await carpetaTemporal('pel-usos-rev-'), 'datos');
  for (const [s, vs] of Object.entries(instaladas)) {
    for (const v of vs) {
      await mkdir(path.join(base, 'bin', s, v), { recursive: true });
      await writeFile(path.join(base, 'bin', s, v, 'x.exe'), 'x');
    }
  }
  const rutas = new Rutas(base);
  const cfg = ConfigSchema.parse({});
  const deps: Deps = {
    rutas,
    config: async () => cfg,
    sitios: async () => [],
    plantillas: async () => [],
    estados: async () => [],
    instaladas: async (s) => instaladas[s] ?? [],
    runtimesDe: async () => ({}),
    phpPorDefecto: async () => null,
    nginxActiva: async () => null,
    versionPreferida: async () => null,
    versionEnUso: async () => null,
    pidsPropios: () => [],
    rutaProceso: async () => null,
    procesoVivo: async () => false,
    ...extra,
  };
  return { base, rutas, deps, cfg };
}

const sitio = (o: Record<string, unknown> = {}) =>
  SitioSchema.parse({
    id: 's1',
    nombre: 'S1',
    dominio: 's1.test',
    carpeta: carpetaSitio,
    tipo: 'estatico',
    ...o,
  });

describe('D30 revisión: .venv del proyecto', () => {
  it('pyvenv.cfg (home) marca el Python con el que se creó, en la carpeta del sitio', async () => {
    const m = await montar({ python: ['3.11.9', '3.12.1'] }, { sitios: async () => [sitio()] });
    await mkdir(path.join(carpetaSitio, '.venv'), { recursive: true });
    await writeFile(
      path.join(carpetaSitio, '.venv', 'pyvenv.cfg'),
      `home = ${path.join(m.base, 'bin', 'python', '3.12.1')}\ninclude-system-site-packages = false\nversion = 3.12.1\n`,
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('python/3.12.1')).toBe('runtime');
    expect(u.has('python/3.11.9')).toBe(false);
  });

  it('también en la carpeta de trabajo de sus procesos y con un home que pasa por un enlace', async () => {
    const m = await montar(
      { python: ['3.11.9', '3.12.1'] },
      {
        sitios: async () => [
          sitio({
            procesos: [{ id: 'api', comando: ['python', 'x.py'], cwd: 'backend' }],
          }),
        ],
      },
    );
    const venv = path.join(carpetaSitio, 'backend', '.venv');
    await mkdir(venv, { recursive: true });
    await writeFile(
      path.join(venv, 'pyvenv.cfg'),
      `home=${path.join(m.base, 'bin', 'python', '3.11.9')}\\Scripts\n`,
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('python/3.11.9')).toBe('runtime');
  });

  it('un pyvenv.cfg ilegible o sin home deja todo Python en duda; sin .venv, nada', async () => {
    const m = await montar({ python: ['3.11.9', '3.12.1'] }, { sitios: async () => [sitio()] });
    expect((await calcularUsos(m.deps)).has('python/3.12.1')).toBe(false);
    await mkdir(path.join(carpetaSitio, '.venv'), { recursive: true });
    await writeFile(path.join(carpetaSitio, '.venv', 'pyvenv.cfg'), 'version = 3.12.1\n');
    const u = await calcularUsos(m.deps);
    expect(u.get('python/3.11.9')).toBe('duda');
    expect(u.get('python/3.12.1')).toBe('duda');
  });
});

describe('D30 revisión: pistas de las plantillas', () => {
  it('"3.12" se resuelve contra lo instalado como un proyecto (la más nueva de la serie)', async () => {
    const m = await montar(
      { python: ['3.11.9', '3.12.1', '3.12.9', '3.13.0'] },
      { plantillas: async () => [{ php: null, runtimes: { python: '3.12' } } as never] },
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('python/3.12.9')).toBe('plantilla');
    expect(u.has('python/3.12.1')).toBe(false);
    expect(u.has('python/3.13.0')).toBe(false);
  });

  it('una pista que no se entiende deja ese runtime en duda', async () => {
    const m = await montar(
      { node: ['20.1.0', '22.5.0'], python: ['3.12.1'] },
      { plantillas: async () => [{ php: null, runtimes: { node: '¿¿lo que sea??' } } as never] },
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('node/20.1.0')).toBe('duda');
    expect(u.get('node/22.5.0')).toBe('duda');
    expect(u.has('python/3.12.1')).toBe(false);
  });

  it('Java usa su propia regla (la LTS que cumple)', async () => {
    const m = await montar(
      { java: ['17.0.9', '21.0.2', '22.0.1'] },
      { plantillas: async () => [{ php: null, runtimes: { java: '>=17' } } as never] },
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('java/17.0.9')).toBe('plantilla');
  });
});

describe('D30 revisión: sitio no montado o ilegible', () => {
  it('una carpeta que no existe deja en duda todos los runtimes', async () => {
    const m = await montar(
      { node: ['20.1.0'], python: ['3.12.1'], php: ['8.4'] },
      { sitios: async () => [sitio({ carpeta: path.join(carpetaSitio, 'sin-montar') })] },
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('node/20.1.0')).toBe('duda');
    expect(u.get('python/3.12.1')).toBe('duda');
    // PHP no depende de la carpeta del sitio.
    expect(u.has('php/8.4')).toBe(false);
  });

  it('un wolfcore.yml que no se pudo leer (lecturaFallida) también lo deja en duda', async () => {
    const m = await montar(
      { node: ['20.1.0'] },
      {
        sitios: async () => [sitio()],
        runtimesDe: async () => ({ lecturaFallida: true }),
      },
    );
    expect((await calcularUsos(m.deps)).get('node/20.1.0')).toBe('duda');
  });
});

describe('D30 revisión: datos de la versión, herramientas y lecturas que fallan', () => {
  it('data/ con contenido y sin instancia bloquea la versión más nueva de su rama (motivo datos)', async () => {
    const m = await montar({ mysql: ['8.4.3', '8.4.5', '9.1.0'] });
    const datos = path.join(m.base, 'data', 'mysql');
    await mkdir(path.join(datos, '8.4'), { recursive: true });
    await writeFile(path.join(datos, '8.4', 'ibdata1'), 'x');
    await mkdir(path.join(datos, '9.1'), { recursive: true }); // vacía: no bloquea
    const u = await calcularUsos({
      ...m.deps,
      carpetaDatos: (s, v) =>
        s === 'mysql' ? path.join(datos, v.split('.').slice(0, 2).join('.')) : null,
    });
    expect(u.get('mysql/8.4.5')).toBe('datos');
    // Con otra versión de la rama que abra los datos, la vieja sí se puede quitar.
    expect(u.has('mysql/8.4.3')).toBe(false);
    expect(u.has('mysql/9.1.0')).toBe(false);
  });

  it('la única versión de una rama con datos queda bloqueada', async () => {
    const m = await montar({ postgresql: ['16.4'] });
    const datos = path.join(m.base, 'data', 'postgresql', '16');
    await mkdir(datos, { recursive: true });
    await writeFile(path.join(datos, 'PG_VERSION'), '16');
    const u = await calcularUsos({ ...m.deps, carpetaDatos: () => datos });
    expect(u.get('postgresql/16.4')).toBe('datos');
  });

  it('la rama de PHP de phpMyAdmin o Adminer se protege como herramienta', async () => {
    const m = await montar(
      { php: ['8.2', '8.3', '8.4'] },
      { ramasHerramientas: async () => ['8.3'] },
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('php/8.3')).toBe('herramienta');
    expect(u.has('php/8.2')).toBe(false);
  });

  it('si no se puede saber cuál es la versión activa de Nginx, ninguna se toca', async () => {
    const m = await montar(
      { nginx: ['1.28.0', '1.30.0'] },
      {
        nginxActiva: async () => {
          throw new Error('config ilegible');
        },
      },
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('nginx/1.28.0')).toBe('duda');
    expect(u.get('nginx/1.30.0')).toBe('duda');
  });

  it('si no se puede listar lo instalado de un servicio, todo ese servicio queda en duda', async () => {
    const m = await montar(
      { node: ['20.1.0'], go: ['1.24.1'] },
      {
        instaladas: async (s) => {
          if (s === 'node') throw new Error('EACCES');
          return s === 'go' ? ['1.24.1'] : [];
        },
      },
    );
    const u = await calcularUsos(m.deps);
    expect(u.get('node/*')).toBe('duda');
    expect(u.has('go/*')).toBe(false);
    // Y la limpieza lo respeta aunque la versión exista en disco.
    const l = new Limpieza({
      rutas: m.rutas,
      instaladas: async () => ['20.1.0'],
      usos: async () => u,
      instantanea: async () => '',
    });
    const r = await l.limpiar([{ servicio: 'node', version: '20.1.0' }], true);
    expect(r.fallidos).toEqual([
      { servicio: 'node', version: '20.1.0', codigo: 'limpieza.en_uso' },
    ]);
    expect((await l.versionesSinUso()).find((v) => v.servicio === 'node')?.motivoBloqueo).toBe(
      'duda',
    );
  });
});

/* ───────────── Limpieza: contenido ajeno, rename, papelera y cerrojo ───────────── */

async function entorno() {
  const base = path.join(await carpetaTemporal('pel-limpieza-rev-'), 'datos');
  await mkdir(base, { recursive: true });
  const rutas = new Rutas(base);
  const usos: UsosVersiones = new Map();
  const cerrojos = new CerrojosServicio();
  const hooks: { usos: () => void; renombrar?: (a: string, b: string) => Promise<void> } = {
    usos: () => undefined,
  };
  const { rename } = await import('node:fs/promises');
  const l = new Limpieza({
    rutas,
    cerrojos,
    instaladas: async (s) => readdir(path.dirname(rutas.bin(s, '_'))).catch(() => [] as string[]),
    usos: async () => {
      hooks.usos();
      return new Map(usos);
    },
    instantanea: async () => '',
    enCatalogo: async (_s, v) => v !== '1.0.0',
    renombrar: (a, b) => (hooks.renombrar ?? rename)(a, b),
  });
  return { base, rutas, usos, l, cerrojos, hooks };
}

async function instalar(rutas: Rutas, servicio: string, version: string) {
  const dir = rutas.bin(servicio, version);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${servicio}.exe`), 'x');
  return dir;
}

describe('D30 revisión: contenido que el usuario instaló dentro de bin', () => {
  it('node_modules: lo que no es npm ni corepack es contenido ajeno', async () => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'node', '22.1.0');
    await mkdir(path.join(dir, 'node_modules', 'npm'), { recursive: true });
    await mkdir(path.join(dir, 'node_modules', 'corepack'), { recursive: true });
    expect(await contenidoAjeno(dir, 'node')).toEqual([]);
    await mkdir(path.join(dir, 'node_modules', 'typescript'), { recursive: true });
    await mkdir(path.join(dir, 'node_modules', '@angular'), { recursive: true });
    expect(await contenidoAjeno(dir, 'node')).toEqual([
      'node_modules/@angular',
      'node_modules/typescript',
    ]);
  });

  it('site-packages: lo que no es pip ni setuptools es contenido ajeno', async () => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'python', '3.12.1');
    const sp = path.join(dir, 'Lib', 'site-packages');
    for (const n of ['pip', 'pip-24.0.dist-info', 'setuptools', '__pycache__']) {
      await mkdir(path.join(sp, n), { recursive: true });
    }
    expect(await contenidoAjeno(dir, 'python')).toEqual([]);
    await mkdir(path.join(sp, 'requests'), { recursive: true });
    expect(await contenidoAjeno(dir, 'python')).toEqual(['Lib/site-packages/requests']);
    // Otros servicios no se miran.
    expect(await contenidoAjeno(dir, 'go')).toEqual([]);
  });

  it('se avisa en la vista previa y quitarla exige aceptarlo aparte', async () => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'node', '22.1.0');
    await mkdir(path.join(dir, 'node_modules', 'typescript'), { recursive: true });
    const lista = await e.l.versionesSinUso();
    expect(lista[0]).toMatchObject({
      version: '22.1.0',
      contenidoAjeno: ['node_modules/typescript'],
    });
    const sin = await e.l.limpiar([{ servicio: 'node', version: '22.1.0' }], true);
    expect(sin.fallidos).toEqual([
      { servicio: 'node', version: '22.1.0', codigo: 'limpieza.contenido_ajeno' },
    ]);
    expect(existsSync(dir)).toBe(true);
    const con = await e.l.limpiar(
      [{ servicio: 'node', version: '22.1.0', incluirContenidoAjeno: true }],
      true,
    );
    expect(con.fallidos).toEqual([]);
    expect(existsSync(dir)).toBe(false);
  });

  it('avisa de las versiones que ya no están en el catálogo', async () => {
    const e = await entorno();
    await instalar(e.rutas, 'bun', '1.0.0');
    await instalar(e.rutas, 'bun', '1.2.0');
    const lista = await e.l.versionesSinUso();
    expect(lista.map((v) => [v.version, v.sinCatalogo])).toEqual([
      ['1.0.0', true],
      ['1.2.0', false],
    ]);
  });
});

describe('D30 revisión: errores de rename', () => {
  it.each([
    ['EXDEV', 'limpieza.otro_volumen'],
    ['ENOENT', 'limpieza.no_existe'],
    ['EBUSY', 'limpieza.version_bloqueada'],
    ['EPERM', 'limpieza.version_bloqueada'],
    ['EACCES', 'limpieza.version_bloqueada'],
  ])('%s se informa como %s y la versión queda intacta', async (code, esperado) => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'deno', '2.1.0');
    e.hooks.renombrar = async () => {
      throw Object.assign(new Error(code), { code });
    };
    const r = await e.l.limpiar([{ servicio: 'deno', version: '2.1.0' }], true);
    expect(r.fallidos).toEqual([{ servicio: 'deno', version: '2.1.0', codigo: esperado }]);
    expect(existsSync(dir)).toBe(true);
    // Ni marca de papelera huérfana.
    const pap = path.join(e.base, 'papelera', 'versiones');
    expect(existsSync(pap) ? await readdir(pap) : []).toEqual([]);
  });
});

describe('D30 revisión: uso entre dos versiones de la misma limpieza y cerrojo', () => {
  it('un uso que aparece mientras se mueve la primera bloquea la segunda', async () => {
    const e = await entorno();
    const a = await instalar(e.rutas, 'go', '1.23.0');
    const b = await instalar(e.rutas, 'go', '1.24.1');
    let llamadas = 0;
    e.hooks.usos = () => {
      llamadas++;
      // 1.ª: pasada barata · 2.ª: antes de mover la primera · 3.ª: antes de mover la segunda.
      if (llamadas === 3) e.usos.set(claveVersion('go', '1.24.1'), 'encendida');
    };
    const r = await e.l.limpiar(
      [
        { servicio: 'go', version: '1.23.0' },
        { servicio: 'go', version: '1.24.1' },
      ],
      true,
      { destino: 'definitivo' },
    );
    expect(existsSync(a)).toBe(false);
    expect(existsSync(b)).toBe(true);
    expect(r.fallidos).toEqual([{ servicio: 'go', version: '1.24.1', codigo: 'limpieza.en_uso' }]);
  });

  it('el cerrojo del servicio retiene el rename mientras otra operación lo tiene', async () => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'zig', '0.14.0');
    let suelto!: () => void;
    const retenido = new Promise<void>((r) => (suelto = r));
    const orden: string[] = [];
    const otra = e.cerrojos.con('zig', async () => {
      orden.push('otra:empieza');
      await retenido;
      orden.push('otra:termina');
    });
    const limpieza = e.l
      .limpiar([{ servicio: 'zig', version: '0.14.0' }], true, { destino: 'definitivo' })
      .then(() => orden.push('limpieza:termina'));
    await new Promise((r) => setTimeout(r, 80));
    // Mientras la otra tiene el cerrojo, la versión sigue en su sitio.
    expect(existsSync(dir)).toBe(true);
    suelto();
    await Promise.all([otra, limpieza]);
    expect(orden).toEqual(['otra:empieza', 'otra:termina', 'limpieza:termina']);
    expect(existsSync(dir)).toBe(false);
  });

  it('CerrojosServicio: en orden por servicio, en paralelo entre servicios y reentrante', async () => {
    const c = new CerrojosServicio();
    const orden: string[] = [];
    const lento = c.con('a', async () => {
      await new Promise((r) => setTimeout(r, 40));
      orden.push('a1');
    });
    const siguiente = c.con('a', async () => void orden.push('a2'));
    const otro = c.con('b', async () => void orden.push('b'));
    await Promise.all([lento, siguiente, otro]);
    expect(orden).toEqual(['b', 'a1', 'a2']);
    // Reentrante: pedirlo dentro de sí mismo no se bloquea.
    const r = await c.con('a', () => c.con('a', async () => 'dentro'));
    expect(r).toBe('dentro');
    // Un fallo no deja el cerrojo tomado.
    await expect(c.con('a', async () => Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(await c.con('a', async () => 'libre')).toBe('libre');
    // Los grupos comparten cerrojo.
    c.fijarNormalizador((s) => (['mailpit', 'papercut'].includes(s) ? 'grupo:correo' : s));
    expect(c.clave('papercut')).toBe(c.clave('mailpit'));
  });
});

describe('D30 revisión: papelera de versiones (recuperar)', () => {
  it('lista lo que hay y recupera la versión a bin/, sin sobrescribir nada', async () => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'bun', '1.2.0');
    await e.l.limpiar([{ servicio: 'bun', version: '1.2.0' }], true);
    expect(existsSync(dir)).toBe(false);
    const lista = await e.l.listarPapelera();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ servicio: 'bun', version: '1.2.0', bytes: 1 });
    expect(Date.parse(lista[0]!.borrada)).toBeGreaterThan(0);

    // Si se instaló otra vez mientras tanto, no se pisa.
    await instalar(e.rutas, 'bun', '1.2.0');
    await expect(e.l.recuperar(lista[0]!.id)).rejects.toMatchObject({
      codigo: 'limpieza.destino_ocupado',
    });
    await e.l.limpiar([{ servicio: 'bun', version: '1.2.0' }], true, { destino: 'definitivo' });

    await e.l.recuperar(lista[0]!.id);
    expect(existsSync(path.join(dir, 'bun.exe'))).toBe(true);
    // La papelera queda vacía y sin marca huérfana (el segundo borrado fue definitivo).
    expect(await e.l.listarPapelera()).toEqual([]);
    expect(await readdir(path.join(e.base, 'papelera', 'versiones'))).toEqual([]);
  });

  it('rechaza ids que no son de la papelera (rutas, otros servicios, ..)', async () => {
    const e = await entorno();
    for (const id of [
      '../data',
      'bun__1.2.0',
      'rust__1.80.0__20260101-000000-abcdef',
      'bun__..__20260101-000000-abcdef',
      '..\\..\\x',
      42 as never,
    ]) {
      await expect(e.l.recuperar(id)).rejects.toMatchObject({
        codigo: 'limpieza.seleccion_invalida',
      });
    }
    await expect(e.l.recuperar('bun__1.2.0__20260101-000000-abcdef')).rejects.toMatchObject({
      codigo: 'limpieza.no_existe',
    });
  });
});
