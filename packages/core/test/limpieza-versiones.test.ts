import { existsSync } from 'node:fs';
import { mkdir, readdir, rename, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ejecutableDe } from '../src/catalogo/catalogo';
import {
  claveVersion,
  Limpieza,
  versionDeEjecutable,
  type MotivoBloqueo,
  type UsosVersiones,
} from '../src/catalogo/limpieza';
import { calcularUsos } from '../src/catalogo/usoVersiones';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { Rutas } from '../src/rutas';
import { ConfigSchema, SitioSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

async function entorno() {
  const base = path.join(await carpetaTemporal('pel-limpieza-'), 'datos');
  await mkdir(base, { recursive: true });
  const rutas = new Rutas(base);
  const usos: UsosVersiones = new Map();
  const llamadas: string[] = [];
  const instaladasDe = async (servicio: string): Promise<string[]> =>
    readdir(path.dirname(rutas.bin(servicio, '_'))).catch(() => [] as string[]);
  let ahora = new Date('2026-11-25T12:00:00Z');
  const opciones: {
    instantanea: () => Promise<string>;
    renombrar?: (a: string, b: string) => Promise<void>;
  } = {
    instantanea: async () => {
      llamadas.push('instantanea');
      return path.join(base, 'respaldos', 'entorno', 'x');
    },
  };
  const l = new Limpieza({
    rutas,
    instaladas: (s) => instaladasDe(s),
    usos: async () => {
      llamadas.push('usos');
      return new Map(usos);
    },
    instantanea: () => opciones.instantanea(),
    ahora: () => ahora,
    renombrar: (a, b) => (opciones.renombrar ?? rename)(a, b),
  });
  return {
    base,
    rutas,
    usos,
    llamadas,
    l,
    opciones,
    avanzar: (ms: number) => (ahora = new Date(ahora.getTime() + ms)),
  };
}

/** Una versión instalada con dos archivos de tamaño conocido. */
async function instalar(rutas: Rutas, servicio: string, version: string, bytes = 100) {
  const dir = rutas.bin(servicio, version);
  await mkdir(path.join(dir, 'lib'), { recursive: true });
  await writeFile(path.join(dir, `${servicio}.exe`), Buffer.alloc(bytes));
  await writeFile(path.join(dir, 'lib', 'a.dll'), Buffer.alloc(bytes));
  return dir;
}

describe('limpieza de versiones (D30)', () => {
  it('lista tamaño y motivo; las bloqueadas se listan pero no se limpian', async () => {
    const e = await entorno();
    await instalar(e.rutas, 'node', '22.1.0', 100);
    await instalar(e.rutas, 'node', '20.5.0', 300);
    e.usos.set(claveVersion('node', '22.1.0'), 'predeterminada' satisfies MotivoBloqueo);
    const lista = await e.l.versionesSinUso();
    expect(lista).toEqual([
      { servicio: 'node', version: '20.5.0', bytes: 600, motivoBloqueo: null },
      { servicio: 'node', version: '22.1.0', bytes: 200, motivoBloqueo: 'predeterminada' },
    ]);
    const r = await e.l.limpiar(
      [
        { servicio: 'node', version: '22.1.0' },
        { servicio: 'node', version: '20.5.0' },
      ],
      true,
      { destino: 'definitivo' },
    );
    expect(r.fallidos).toEqual([
      { servicio: 'node', version: '22.1.0', codigo: 'limpieza.en_uso' },
    ]);
    expect(r.liberados).toBe(600);
    expect(existsSync(e.rutas.bin('node', '22.1.0'))).toBe(true);
    expect(existsSync(e.rutas.bin('node', '20.5.0'))).toBe(false);
  });

  it('una versión que pasó a usarse entre la lista y el borrado no se borra', async () => {
    const e = await entorno();
    await instalar(e.rutas, 'php', '8.3');
    expect((await e.l.versionesSinUso())[0]!.motivoBloqueo).toBeNull();
    // El usuario enciende un sitio con PHP 8.3 mientras mira la vista previa.
    e.usos.set(claveVersion('php', '8.3'), 'sitio');
    const r = await e.l.limpiar([{ servicio: 'php', version: '8.3' }], true);
    expect(r.fallidos).toEqual([{ servicio: 'php', version: '8.3', codigo: 'limpieza.en_uso' }]);
    expect(existsSync(e.rutas.bin('php', '8.3'))).toBe(true);
    // Sin nada que borrar, ni siquiera se toma la instantánea.
    expect(e.llamadas).not.toContain('instantanea');
  });

  it('el uso que aparece después de la instantánea también se respeta', async () => {
    const e = await entorno();
    await instalar(e.rutas, 'go', '1.24.1');
    e.opciones.instantanea = async () => {
      e.usos.set(claveVersion('go', '1.24.1'), 'encendida');
      return '';
    };
    const r = await e.l.limpiar([{ servicio: 'go', version: '1.24.1' }], true);
    expect(r.fallidos[0]).toMatchObject({ codigo: 'limpieza.en_uso' });
    expect(existsSync(e.rutas.bin('go', '1.24.1'))).toBe(true);
  });

  it('sin confirmación (o con una selección rara) no hace nada', async () => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'node', '20.5.0');
    await expect(
      e.l.limpiar([{ servicio: 'node', version: '20.5.0' }], false as never),
    ).rejects.toMatchObject({ codigo: 'limpieza.sin_confirmar' });
    for (const mala of [
      { servicio: 'node', version: '..' },
      { servicio: 'node', version: '..\\..\\data' },
      { servicio: 'node', version: '20/5' },
      { servicio: 'rust', version: '1.80.0' },
      { servicio: '../data', version: '1.0.0' },
    ]) {
      await expect(e.l.limpiar([mala], true)).rejects.toMatchObject({
        codigo: 'limpieza.seleccion_invalida',
      });
    }
    await expect(e.l.limpiar([], true)).rejects.toMatchObject({
      codigo: 'limpieza.seleccion_invalida',
    });
    expect(existsSync(dir)).toBe(true);
  });

  it('nunca toca data/ ni carpetas de proyectos (archivos centinela)', async () => {
    const e = await entorno();
    await instalar(e.rutas, 'mysql', '8.4.3');
    const centinelas = [
      path.join(e.base, 'data', 'mysql', '8.4', 'ibdata1'),
      path.join(e.base, 'data', 'mysql', '8.4.3', 'ibdata1'),
      path.join(e.base, 'data', 'php', '8.3', 'x'),
      path.join(e.base, 'proyectos', 'mi-sitio', 'index.php'),
      path.join(e.base, 'respaldos', 'r.sql'),
    ];
    for (const c of centinelas) {
      await mkdir(path.dirname(c), { recursive: true });
      await writeFile(c, 'datos que no se pierden');
    }
    for (const destino of ['papelera', 'definitivo'] as const) {
      await instalar(e.rutas, 'mysql', '8.4.3');
      const r = await e.l.limpiar([{ servicio: 'mysql', version: '8.4.3' }], true, { destino });
      expect(r.fallidos).toEqual([]);
      for (const c of centinelas) expect(existsSync(c)).toBe(true);
    }
  });

  it('un enlace dentro de bin/<servicio>/<v> que apunta fuera no se sigue', async () => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'node', '20.5.0');
    const fuera = path.join(path.dirname(e.base), 'fuera');
    await mkdir(path.join(fuera, 'sub'), { recursive: true });
    await writeFile(path.join(fuera, 'sub', 'importante.txt'), 'no se toca');
    await symlink(fuera, path.join(dir, 'enlace'), 'junction');
    // El enlace no suma al tamaño (no se sigue).
    expect((await e.l.versionesSinUso())[0]!.bytes).toBe(200);
    for (const destino of ['papelera', 'definitivo'] as const) {
      const r = await e.l.limpiar([{ servicio: 'node', version: '20.5.0' }], true, { destino });
      expect(r.fallidos).toEqual([]);
      expect(existsSync(dir)).toBe(false);
      expect(existsSync(path.join(fuera, 'sub', 'importante.txt'))).toBe(true);
      await instalar(e.rutas, 'node', '20.5.0');
      await symlink(fuera, path.join(dir, 'enlace'), 'junction');
    }
  });

  it('si la carpeta de la versión es un enlace a otro sitio, no se toca ni se sigue', async () => {
    const e = await entorno();
    const fuera = path.join(path.dirname(e.base), 'otra-cosa');
    await mkdir(fuera, { recursive: true });
    await writeFile(path.join(fuera, 'node.exe'), 'x');
    await mkdir(path.dirname(e.rutas.bin('node', '_')), { recursive: true });
    await symlink(fuera, e.rutas.bin('node', '20.5.0'), 'junction');
    const lista = await e.l.versionesSinUso();
    expect(lista[0]).toMatchObject({ version: '20.5.0', motivoBloqueo: 'duda' });
    const r = await e.l.limpiar([{ servicio: 'node', version: '20.5.0' }], true, {
      destino: 'definitivo',
    });
    expect(r.fallidos).toEqual([
      { servicio: 'node', version: '20.5.0', codigo: 'limpieza.ruta_insegura' },
    ]);
    expect(existsSync(path.join(fuera, 'node.exe'))).toBe(true);
  });

  it('si bin/<servicio> es un enlace a otra carpeta, tampoco se borra nada de allí', async () => {
    const e = await entorno();
    const fuera = path.join(path.dirname(e.base), 'servicio-ajeno');
    await mkdir(path.join(fuera, '20.5.0'), { recursive: true });
    await writeFile(path.join(fuera, '20.5.0', 'node.exe'), 'x');
    await mkdir(path.join(e.base, 'bin'), { recursive: true });
    await symlink(fuera, path.join(e.base, 'bin', 'node'), 'junction');
    const r = await e.l.limpiar([{ servicio: 'node', version: '20.5.0' }], true, {
      destino: 'definitivo',
    });
    expect(r.fallidos).toMatchObject([{ codigo: 'limpieza.ruta_insegura' }]);
    expect(existsSync(path.join(fuera, '20.5.0', 'node.exe'))).toBe(true);
  });

  it('la instantánea va antes del borrado; si falla, no se borra nada', async () => {
    const e = await entorno();
    const dir = await instalar(e.rutas, 'bun', '1.2.0');
    e.opciones.instantanea = async () => {
      // En este momento la versión todavía está en su sitio.
      expect(existsSync(dir)).toBe(true);
      e.llamadas.push('instantanea');
      return '';
    };
    await e.l.limpiar([{ servicio: 'bun', version: '1.2.0' }], true);
    expect(e.llamadas.indexOf('instantanea')).toBeGreaterThan(-1);
    expect(existsSync(dir)).toBe(false);

    const dir2 = await instalar(e.rutas, 'bun', '1.3.0');
    e.opciones.instantanea = async () => {
      throw new Error('sin espacio');
    };
    await expect(e.l.limpiar([{ servicio: 'bun', version: '1.3.0' }], true)).rejects.toThrow(
      'sin espacio',
    );
    expect(existsSync(dir2)).toBe(true);
  });

  it('un archivo bloqueado salta esa versión entera y sigue con las demás', async () => {
    const e = await entorno();
    const bloqueada = await instalar(e.rutas, 'deno', '2.1.0');
    const libre = await instalar(e.rutas, 'deno', '2.2.0');
    e.opciones.renombrar = async (a, b) => {
      if (a === bloqueada) throw Object.assign(new Error('EBUSY'), { code: 'EBUSY' });
      await rename(a, b);
    };
    const r = await e.l.limpiar(
      [
        { servicio: 'deno', version: '2.1.0' },
        { servicio: 'deno', version: '2.2.0' },
      ],
      true,
      { destino: 'definitivo' },
    );
    expect(r.fallidos).toEqual([
      { servicio: 'deno', version: '2.1.0', codigo: 'limpieza.version_bloqueada' },
    ]);
    // Entera y sin tocar, no a medias.
    expect(await readdir(bloqueada)).toEqual(['deno.exe', 'lib']);
    expect(existsSync(libre)).toBe(false);
    expect(r.liberados).toBe(200);
  });

  it('la papelera conserva la versión 7 días con su marca de fecha y luego la purga', async () => {
    const e = await entorno();
    await instalar(e.rutas, 'zig', '0.14.0');
    const r = await e.l.limpiar([{ servicio: 'zig', version: '0.14.0' }], true);
    expect(r).toMatchObject({ fallidos: [], liberados: 0, enPapelera: 200 });
    expect(existsSync(e.rutas.bin('zig', '0.14.0'))).toBe(false);
    const pap = path.join(e.base, 'papelera', 'versiones');
    const antes = await readdir(pap);
    expect(antes).toHaveLength(2);
    expect(antes.some((n) => n.endsWith('.borrado'))).toBe(true);
    e.avanzar(6 * 24 * 3600 * 1000);
    expect(await e.l.purgarPapelera()).toBe(0);
    expect(await readdir(pap)).toHaveLength(2);
    e.avanzar(2 * 24 * 3600 * 1000);
    expect(await e.l.purgarPapelera()).toBe(1);
    expect(await readdir(pap)).toEqual([]);
  });

  it('el borrado definitivo no deja restos en tmp ni en la papelera', async () => {
    const e = await entorno();
    await instalar(e.rutas, 'kotlin', '2.1.0');
    await e.l.limpiar([{ servicio: 'kotlin', version: '2.1.0' }], true, { destino: 'definitivo' });
    expect(await readdir(path.join(e.base, 'tmp', 'limpieza-versiones'))).toEqual([]);
    expect(existsSync(path.join(e.base, 'papelera'))).toBe(false);
  });

  it('versionDeEjecutable reconoce lo que está dentro de bin/<servicio>/<versión>', () => {
    const bin = 'C:/Datos/WolfCoreDev/bin';
    expect(versionDeEjecutable('C:\\Datos\\WolfCoreDev\\bin\\php\\8.4\\php-cgi.exe', bin)).toEqual({
      servicio: 'php',
      version: '8.4',
    });
    expect(versionDeEjecutable('C:/datos/wolfcoredev/BIN/node/22.1.0/node.exe', bin)).toEqual({
      servicio: 'node',
      version: '22.1.0',
    });
    expect(
      versionDeEjecutable('\\\\?\\C:\\Datos\\WolfCoreDev\\bin\\go\\1.24.1\\bin\\go.exe', bin),
    ).toEqual({ servicio: 'go', version: '1.24.1' });
    expect(versionDeEjecutable('C:/Windows/System32/cmd.exe', bin)).toBeNull();
    expect(versionDeEjecutable('C:/Datos/WolfCoreDev/binario/php/8.4/php.exe', bin)).toBeNull();
    expect(versionDeEjecutable('C:/Datos/WolfCoreDev/bin/php', bin)).toBeNull();
  });
});

/* ───────────── Quién usa cada versión ───────────── */

describe('uso de versiones (D30): calcularUsos con dependencias falsas', () => {
  type Deps = Parameters<typeof calcularUsos>[0];

  async function montar(instaladas: Record<string, string[]>, extra: Partial<Deps> = {}) {
    const base = path.join(await carpetaTemporal('pel-usos-'), 'datos');
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
      carpeta: 'C:/p/s1',
      tipo: 'estatico',
      ...o,
    });

  it('PHP: el sitio, los pools y la predeterminada bloquean su rama', async () => {
    const { deps, cfg } = await montar(
      { php: ['8.2', '8.3', '8.4', '8.5'] },
      { sitios: async () => [sitio({ php: '8.2' })], phpPorDefecto: async () => '8.5' },
    );
    cfg.servicios.php.versiones = ['8.3'];
    const u = await calcularUsos(deps);
    expect(u.get('php/8.2')).toBe('sitio');
    expect(u.get('php/8.3')).toBe('sitio');
    expect(u.get('php/8.5')).toBe('predeterminada');
    expect(u.has('php/8.4')).toBe(false);
  });

  it('una instancia apagada también usa su versión; la encendida cuenta como encendida', async () => {
    const inst = (id: string, clave: string, version: string, estado: string, pred: boolean) => ({
      id,
      servicio: 'mysql',
      clave,
      version,
      puerto: 3306,
      estado,
      pid: null,
      predeterminada: pred,
      autoIniciar: false,
      tieneDatos: true,
    });
    const { deps } = await montar(
      { mysql: ['8.0.40', '8.4.3', '9.1.0'] },
      {
        versionEnUso: async (s, v) =>
          s === 'mysql' && v === '8.0.40'
            ? 'mysql@8.0'
            : s === 'mysql' && v === '8.4.3'
              ? 'mysql@8.4'
              : null,
        estados: async () =>
          [
            {
              id: 'mysql',
              nombre: 'MySQL',
              version: '8.4.3',
              estado: 'encendido',
              puertos: [3306],
              pid: 1,
              instancias: [
                inst('mysql@8.0', '8.0', '8.0.40', 'apagado', false),
                inst('mysql@8.4', '8.4', '8.4.3', 'encendido', true),
              ],
            },
          ] as never,
      },
    );
    const u = await calcularUsos(deps);
    expect(u.get('mysql/8.0.40')).toBe('instancia');
    expect(u.get('mysql/8.4.3')).toBe('encendida');
    expect(u.has('mysql/9.1.0')).toBe(false);
  });

  it('runtimes: el del proyecto, el fijado, el de la plantilla y la predeterminada; una tarea lo marca', async () => {
    const { deps } = await montar(
      {
        node: ['18.0.0', '20.1.0', '22.5.0', '24.0.0'],
        python: ['3.11.0', '3.12.1'],
        go: ['1.23.0', '1.24.1'],
      },
      {
        sitios: async () => [
          sitio({ id: 'a', runtimes: { go: '1.23.0' } }),
          sitio({
            id: 'b',
            tareas: [
              {
                id: 't1',
                nombre: 'T',
                cron: '* * * * *',
                comando: ['node', 'x.js'],
                activa: false,
              },
            ],
          }),
        ],
        runtimesDe: async (s) => (s.id === 'b' ? { node: '20.1.0' } : { python: '3.11.0' }),
        plantillas: async () => [{ php: null, runtimes: { node: '18.0.0' } } as never],
        versionPreferida: async (s, inst) => (s === 'node' ? '24.0.0' : (inst.at(-1) ?? null)),
      },
    );
    const u = await calcularUsos(deps);
    expect(u.get('node/20.1.0')).toBe('tarea');
    expect(u.get('node/18.0.0')).toBe('plantilla');
    expect(u.get('node/24.0.0')).toBe('predeterminada');
    expect(u.has('node/22.5.0')).toBe(false);
    expect(u.get('python/3.11.0')).toBe('runtime');
    expect(u.get('go/1.23.0')).toBe('runtime');
    expect(u.get('go/1.24.1')).toBe('predeterminada');
  });

  it('un workspace que enciende una instancia la deja bloqueada aunque esté apagada', async () => {
    const { deps, cfg } = await montar(
      { redis: ['7.2.5', '8.0.1'] },
      { versionEnUso: async (s, v) => (s === 'redis' && v === '7.2.5' ? 'redis@7' : null) },
    );
    cfg.workspaces = [
      { id: 'dia', nombre: 'Día', elementos: [{ tipo: 'instancia', id: 'redis@7' }] },
    ];
    const u = await calcularUsos(deps);
    // También la usa una instancia; el motivo más fuerte manda.
    expect(u.get('redis/7.2.5')).toBe('instancia');
    expect(u.has('redis/8.0.1')).toBe(false);
  });

  it('un proceso propio en ejecución cuyo ejecutable real está en la versión la bloquea', async () => {
    const { base, deps } = await montar({ node: ['20.1.0', '22.5.0'], php: ['8.4'] });
    const exe = path.join(base, 'bin', 'node', '22.5.0', 'x.exe');
    const php = path.join(base, 'bin', 'PHP', '8.4', 'x.exe');
    const u = await calcularUsos({
      ...deps,
      pidsPropios: () => [10],
      descendientes: async () => new Map([[10, [11]]]),
      rutaProceso: async (pid) => (pid === 10 ? exe : pid === 11 ? php : null),
    });
    expect(u.get('node/22.5.0')).toBe('encendida');
    expect(u.get('php/8.4')).toBe('encendida');
    expect(u.has('node/20.1.0')).toBe(false);
  });

  it('un proceso por un enlace a la versión también la bloquea (ruta real, no la aparente)', async () => {
    const { base, deps } = await montar({ node: ['20.1.0'] });
    const atajo = path.join(path.dirname(base), 'atajo');
    await symlink(path.join(base, 'bin', 'node', '20.1.0'), atajo, 'junction');
    const u = await calcularUsos({
      ...deps,
      pidsPropios: () => [10],
      rutaProceso: async () => path.join(atajo, 'x.exe'),
    });
    expect(u.get('node/20.1.0')).toBe('encendida');
  });

  it('un proceso vivo sin ruta legible, o una lectura que falla: todo queda en duda', async () => {
    const a = await montar({ node: ['20.1.0'], php: ['8.4'] });
    const u1 = await calcularUsos({
      ...a.deps,
      pidsPropios: () => [10],
      rutaProceso: async () => null,
      procesoVivo: async () => true,
    });
    expect(u1.get('node/20.1.0')).toBe('duda');
    expect(u1.get('php/8.4')).toBe('duda');
    // Un proceso que ya salió no es una duda.
    const u2 = await calcularUsos({
      ...a.deps,
      pidsPropios: () => [10],
      rutaProceso: async () => null,
      procesoVivo: async () => false,
    });
    expect(u2.size).toBe(0);
    // Resolver los runtimes de un proyecto falla: ningún runtime se borra.
    const b = await montar(
      { node: ['20.1.0'], php: ['8.4'] },
      {
        sitios: async () => [sitio()],
        runtimesDe: async () => {
          throw new Error('wolfcore.yml ilegible');
        },
      },
    );
    const u3 = await calcularUsos(b.deps);
    expect(u3.get('node/20.1.0')).toBe('duda');
    expect(u3.has('php/8.4')).toBe(false);
    // No se puede leer la configuración: nada se borra.
    const c = await montar(
      { node: ['20.1.0'], php: ['8.4'] },
      {
        config: async () => {
          throw new Error('config corrupta');
        },
      },
    );
    const u4 = await calcularUsos(c.deps);
    expect(u4.get('node/20.1.0')).toBe('duda');
    expect(u4.get('php/8.4')).toBe('duda');
  });
});

describe('Nucleo: limpieza de versiones (D30)', () => {
  let nucleo: Nucleo | null = null;
  afterEach(async () => {
    await nucleo?.cerrar({ detenerServicios: false }).catch(() => undefined);
    nucleo = null;
  });

  async function crear(sitios: unknown[] = []) {
    const dir = await carpetaTemporal('pel-limpieza-nuc-');
    const base = path.join(dir, 'datos');
    await mkdir(base, { recursive: true });
    await writeFile(
      path.join(base, 'config.json'),
      JSON.stringify(ConfigSchema.parse({ sitios }), null, 2),
    );
    nucleo = await Nucleo.crear({
      base,
      plataforma: new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir }),
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      retrasoNovedadesMs: 60_000,
    });
    return { n: nucleo, base, dir };
  }

  async function instalar(base: string, servicio: string, version: string) {
    const exe = ejecutableDe(servicio)!;
    const f = path.join(base, 'bin', servicio, version, exe);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, Buffer.alloc(50));
  }

  it('lista con motivos reales, limpia lo libre, toma la instantánea y no toca data/', async () => {
    const dir0 = await carpetaTemporal('pel-limpieza-carpeta-');
    const { n, base } = await crear([
      {
        id: 'tienda',
        nombre: 'Tienda',
        dominio: 'tienda.test',
        carpeta: dir0,
        tipo: 'laravel',
        php: '8.2',
      },
    ]);
    await instalar(base, 'php', '8.3');
    await instalar(base, 'php', '8.2');
    await instalar(base, 'php', '8.1');
    await instalar(base, 'node', '20.1.0');
    await instalar(base, 'node', '22.5.0');
    await instalar(base, 'go', '1.23.0');
    const centinela = path.join(base, 'data', 'mysql', '8.4', 'ibdata1');
    await mkdir(path.dirname(centinela), { recursive: true });
    await writeFile(centinela, 'no se pierde');
    await writeFile(path.join(dir0, 'index.php'), 'proyecto');

    const lista = await n.versionesSinUso();
    const motivo = (s: string, v: string) =>
      lista.find((x) => x.servicio === s && x.version === v)?.motivoBloqueo;
    expect(motivo('php', '8.2')).toBe('sitio');
    expect(motivo('php', '8.3')).toBe('predeterminada');
    expect(motivo('php', '8.1')).toBeNull();
    // Node: la más nueva es la predeterminada efectiva; la otra queda libre.
    expect(motivo('node', '22.5.0')).toBe('predeterminada');
    expect(motivo('node', '20.1.0')).toBeNull();
    expect(motivo('go', '1.23.0')).toBe('predeterminada');

    const r = await n.limpiarVersiones(
      lista
        .filter((x) => x.motivoBloqueo === null)
        .map((x) => ({ servicio: x.servicio, version: x.version })),
      true,
      'definitivo',
    );
    expect(r.fallidos).toEqual([]);
    expect(r.liberados).toBeGreaterThan(0);
    expect(existsSync(path.join(base, 'bin', 'php', '8.1'))).toBe(false);
    expect(existsSync(path.join(base, 'bin', 'node', '20.1.0'))).toBe(false);
    expect(existsSync(path.join(base, 'bin', 'php', '8.2'))).toBe(true);
    expect(existsSync(path.join(base, 'bin', 'node', '22.5.0'))).toBe(true);
    expect(existsSync(centinela)).toBe(true);
    expect(existsSync(path.join(dir0, 'index.php'))).toBe(true);
    expect(await n.instantaneasEntorno()).toMatchObject([{ motivo: 'limpiar-versiones' }]);
    // Sin confirmación, no hace nada.
    await expect(
      n.limpiarVersiones([{ servicio: 'php', version: '8.2' }], false as never),
    ).rejects.toMatchObject({ codigo: 'limpieza.sin_confirmar' });
    // Una versión en uso no se limpia aunque el renderer la mande.
    const r2 = await n.limpiarVersiones([{ servicio: 'php', version: '8.2' }], true);
    expect(r2.fallidos).toMatchObject([{ codigo: 'limpieza.en_uso' }]);
    expect(existsSync(path.join(base, 'bin', 'php', '8.2'))).toBe(true);
  });

  it('un runtime fijado en el sitio bloquea aunque no sea la predeterminada', async () => {
    const dir0 = await carpetaTemporal('pel-limpieza-carpeta-');
    const { n, base } = await crear([
      {
        id: 'api',
        nombre: 'API',
        dominio: 'api.test',
        carpeta: dir0,
        tipo: 'estatico',
        runtimes: { node: '20.1.0' },
      },
    ]);
    await instalar(base, 'node', '20.1.0');
    await instalar(base, 'node', '22.5.0');
    await instalar(base, 'node', '18.0.0');
    const lista = await n.versionesSinUso();
    const motivo = (v: string) => lista.find((x) => x.version === v)?.motivoBloqueo;
    expect(motivo('20.1.0')).toBe('runtime');
    expect(motivo('22.5.0')).toBe('predeterminada');
    expect(motivo('18.0.0')).toBeNull();
  });
});
