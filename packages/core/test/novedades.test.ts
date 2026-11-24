import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CentroAvisos, type Aviso } from '../src/avisos/avisos';
import type { ServicioInstalable, VersionDisponible } from '../src/catalogo/catalogo';
import { Novedades, type DepsNovedades } from '../src/catalogo/novedades';
import type { FiltroVersiones, ListadoVersiones } from '../src/catalogo/vivo';
import { ErrorWolf } from '../src/errores';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { nombreEjecutable } from '../src/plataforma/sistema';
import { fetchFalso, rutasBd } from './catalogo-falso';
import { carpetaTemporal } from './temporales';

let ahora: Date;
let centro: CentroAvisos;
let instalados: Partial<Record<ServicioInstalable, string[]>>;
let indices: Partial<Record<ServicioInstalable, ListadoVersiones | Error>>;
let config: { activo: boolean; silenciados: string[] };
let consultas: ServicioInstalable[];

const v = (
  servicio: ServicioInstalable,
  version: string,
  rama: string,
  o: Partial<VersionDisponible> = {},
): VersionDisponible => ({
  servicio,
  version,
  rama,
  url: `https://nginx.org/download/x-${version}.zip`,
  sha256: 'a'.repeat(64),
  huella: { algoritmo: 'sha256', valor: 'a'.repeat(64) },
  formato: 'zip',
  soporte: 'actual',
  origen: 'vivo',
  ...o,
});

const vivo = (versiones: VersionDisponible[]): ListadoVersiones => ({
  versiones,
  origen: 'vivo',
  fecha: ahora.toISOString(),
});

beforeEach(async () => {
  const dir = await carpetaTemporal('pel-novedades-');
  ahora = new Date('2026-11-23T12:00:00Z');
  centro = new CentroAvisos({
    archivo: path.join(dir, 'run', 'avisos.json'),
    emitir: () => undefined,
    ahora: () => ahora,
  });
  instalados = {};
  indices = {};
  config = { activo: true, silenciados: [] };
  consultas = [];
});

// El historial se guarda en segundo plano: se espera antes de borrar la carpeta.
afterEach(() => centro.guardado());

function novedades(): Novedades {
  const deps: DepsNovedades = {
    catalogo: {
      listar: async (s: ServicioInstalable, f?: FiltroVersiones) => {
        // Se mira todo el índice (también ramas sin soporte) para los parches de lo instalado.
        expect(f?.todas).toBe(true);
        consultas.push(s);
        const r = indices[s];
        if (r instanceof Error) throw r;
        return r ?? { versiones: [], origen: 'fija', fecha: null };
      },
    },
    instalados: async (s) => (instalados[s] ?? []).map((version) => ({ version })),
    centro,
    config: async () => config,
    ahora: () => ahora,
  };
  return new Novedades(deps);
}

const deVersiones = (): Aviso[] => centro.lista().filter((a) => a.tipo === 'version-nueva');

describe('Novedades.revisar', () => {
  it('parche nuevo de una rama instalada (con su instancia en los servicios de datos)', async () => {
    instalados.mysql = ['8.4.13'];
    indices.mysql = vivo([
      v('mysql', '8.4.15', '8.4', { huella: null, sha256: null }),
      v('mysql', '8.4.13', '8.4'),
      v('mysql', '8.0.46', '8.0', { soporte: 'fin' }),
    ]);
    expect(await novedades().revisar()).toEqual([
      {
        servicio: 'mysql',
        instancia: 'mysql@8.4',
        actual: '8.4.13',
        nueva: '8.4.15',
        tipo: 'parche',
        huellaFuerte: false,
      },
    ]);
  });

  it('rama nueva estable más nueva que la mayor instalada (las previews no cuentan)', async () => {
    instalados.postgresql = ['16.10', '17.12'];
    indices.postgresql = vivo([
      v('postgresql', '20.0', '20', { soporte: 'preview' }),
      v('postgresql', '19.0', '19'),
      v('postgresql', '17.12', '17'),
      v('postgresql', '16.10', '16'),
    ]);
    expect(await novedades().revisar()).toEqual([
      {
        servicio: 'postgresql',
        instancia: null,
        actual: '17.12',
        nueva: '19.0',
        tipo: 'rama',
        huellaFuerte: true,
      },
    ]);
  });

  it('nada nuevo: sin novedades; un servicio no instalado no se consulta', async () => {
    instalados.nginx = ['1.30.8'];
    indices.nginx = vivo([v('nginx', '1.30.8', '1.30', { soporte: 'lts' })]);
    expect(await novedades().revisar()).toEqual([]);
    expect(consultas).toEqual(['nginx']);
  });

  it('una rama nueva sin soporte ("fin") no se ofrece; la huella diferida cuenta como fuerte', async () => {
    instalados.node = ['22.1.0'];
    indices.node = vivo([
      v('node', '25.9.0', '25', { soporte: 'fin' }),
      v('node', '22.2.0', '22', { huella: null, sha256: null, huellaDiferida: true }),
    ]);
    expect(await novedades().revisar()).toEqual([
      {
        servicio: 'node',
        instancia: null,
        actual: '22.1.0',
        nueva: '22.2.0',
        tipo: 'parche',
        huellaFuerte: true,
      },
    ]);
  });

  it('servicio silenciado: ni se consulta', async () => {
    instalados.mysql = ['8.4.13'];
    indices.mysql = vivo([v('mysql', '8.4.15', '8.4')]);
    config.silenciados = ['mysql'];
    expect(await novedades().revisar()).toEqual([]);
    expect(consultas).toEqual([]);
  });

  it('sin red (o solo la lista fija) no hay novedades ni lanza', async () => {
    instalados.mysql = ['8.4.13'];
    instalados.nginx = ['1.28.0'];
    indices.mysql = new TypeError('fetch failed');
    indices.nginx = { versiones: [v('nginx', '1.30.6', '1.30')], origen: 'fija', fecha: null };
    const n = novedades();
    expect(await n.revisar()).toEqual([]);
    expect(await n.revisarYPublicar()).toEqual([]);
    expect(deVersiones()).toEqual([]);
  });
});

describe('Novedades.publicar', () => {
  const parche = {
    servicio: 'mysql' as const,
    instancia: 'mysql@8.4',
    actual: '8.4.13',
    nueva: '8.4.15',
    tipo: 'parche' as const,
    huellaFuerte: true,
  };

  it('publica un aviso version-nueva con la acción de actualizar (nunca instala)', async () => {
    const publicados = await novedades().publicar([parche]);
    expect(publicados).toHaveLength(1);
    expect(deVersiones()[0]).toMatchObject({
      tipo: 'version-nueva',
      nivel: 'info',
      codigo: 'avisos.version_nueva',
      datos: { servicio: 'mysql', actual: '8.4.13', nueva: '8.4.15' },
      accion: {
        ruta: 'servicios.versiones',
        args: [{ servicio: 'mysql', version: '8.4.15', instancia: 'mysql@8.4', actualizar: true }],
      },
    });
    await novedades().publicar([{ ...parche, servicio: 'postgresql', tipo: 'rama' }]);
    expect(deVersiones()[0]?.codigo).toBe('avisos.rama_nueva');
  });

  it('sin huella fuerte: dice "sin huella publicada" y no ofrece el atajo de actualizar (T17-M1)', async () => {
    await novedades().publicar([{ ...parche, huellaFuerte: false }]);
    expect(deVersiones()[0]).toMatchObject({
      codigo: 'avisos.version_nueva_sin_huella',
      datos: { servicio: 'mysql', nueva: '8.4.15', huella: 'sin' },
      accion: {
        ruta: 'servicios.versiones',
        args: [{ servicio: 'mysql', version: '8.4.15', instancia: 'mysql@8.4', actualizar: false }],
      },
    });
    await novedades().publicar([
      { ...parche, servicio: 'postgresql', tipo: 'rama', huellaFuerte: false },
    ]);
    expect(deVersiones()[0]?.codigo).toBe('avisos.rama_nueva_sin_huella');
  });

  it('como mucho un aviso por servicio y día; otro servicio sí avisa', async () => {
    const n = novedades();
    await n.publicar([parche, { ...parche, nueva: '8.4.16' }]);
    expect(deVersiones()).toHaveLength(1);
    ahora = new Date(ahora.getTime() + 6 * 60 * 60_000);
    await n.publicar([{ ...parche, nueva: '8.4.16' }]);
    expect(deVersiones()).toHaveLength(1);
    await n.publicar([{ ...parche, servicio: 'mariadb', instancia: 'mariadb@11.4' }]);
    expect(deVersiones()).toHaveLength(2);
    // Al día siguiente avisa de una versión nueva, pero no repite la ya avisada.
    ahora = new Date(ahora.getTime() + 25 * 60 * 60_000);
    expect(await novedades().publicar([parche])).toHaveLength(0);
    expect(await novedades().publicar([{ ...parche, nueva: '8.4.16' }])).toHaveLength(1);
  });

  it('respeta el tipo desactivado en Config.avisos y los silenciados', async () => {
    config.activo = false;
    expect(await novedades().publicar([parche])).toEqual([]);
    config = { activo: true, silenciados: ['mysql'] };
    expect(await novedades().publicar([parche])).toEqual([]);
    expect(deVersiones()).toEqual([]);
  });
});

describe('Nucleo: revisión de versiones nuevas', () => {
  const instalarMysql = async (base: string, version: string): Promise<void> => {
    const dir = path.join(base, 'bin', 'mysql', version);
    await mkdir(path.join(dir, 'bin'), { recursive: true });
    await writeFile(path.join(dir, 'bin', nombreEjecutable('mysqld')), '');
    await writeFile(path.join(dir, '.pel-version'), version);
  };

  const crearNucleo = async (base: string, f: typeof fetch): Promise<Nucleo> =>
    Nucleo.crear({
      base,
      plataforma: new PlataformaFalsa({ carpetaDatos: base, carpetaInicio: base }),
      sonda: async () => false,
      fetch: f,
      retrasoNovedadesMs: 0,
    });

  const esperarA = async (cond: () => boolean, ms = 5000): Promise<void> => {
    const fin = Date.now() + ms;
    while (!cond() && Date.now() < fin) await new Promise((r) => setTimeout(r, 20));
  };

  it('al iniciar avisa en segundo plano del parche nuevo de lo instalado, sin instalar nada', async () => {
    const base = await carpetaTemporal('pel-nov-nucleo-');
    await instalarMysql(base, '8.4.13');
    const ff = fetchFalso(rutasBd());
    const n = await crearNucleo(base, ff.f);
    try {
      await esperarA(() => n.avisos.lista().some((a) => a.tipo === 'version-nueva'));
      const a = n.avisos.lista().find((x) => x.tipo === 'version-nueva');
      // MySQL no publica huella fuerte (la página de descargas no responde): el aviso lo dice.
      expect(a).toMatchObject({
        codigo: 'avisos.version_nueva_sin_huella',
        datos: { servicio: 'mysql', actual: '8.4.13', nueva: '8.4.15', huella: 'sin' },
      });
      // Solo sondeos HEAD e índices: ninguna descarga de un binario.
      const descargas = ff.pedidas.filter((u, i) => {
        const m = ff.inits[i]?.method ?? 'GET';
        return m !== 'HEAD' && /\.zip$/.test(u);
      });
      expect(descargas).toEqual([]);
      expect(await n.instalador.instalados('mysql')).toEqual(['8.4.13']);
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });

  it('versionesServicio: tabla por rama con lo instalado, la actualización y la instancia (T19)', async () => {
    const base = await carpetaTemporal('pel-nov-tabla-');
    await instalarMysql(base, '8.4.13');
    const ff = fetchFalso(rutasBd());
    const n = await crearNucleo(base, ff.f);
    try {
      const t = await n.versionesServicio('mysql');
      expect(t.interruptor).toBe('instancias');
      const filas = t.ramas.flatMap((r) => r.versiones);
      expect(filas.find((f) => f.version === '8.4.13')).toMatchObject({
        instalada: true,
        actualizacion: '8.4.15',
        predeterminada: true,
        instancia: 'mysql@8.4',
        puerto: 3306,
        encendida: false,
      });
      expect(filas.find((f) => f.version === '8.4.15')).toMatchObject({
        instalada: false,
        huella: 'ninguna',
      });
      // La versión activa de Nginx (encendida o no) no se desinstala; otra sí.
      for (const v of ['1.30.6', '1.30.8']) {
        const dir = path.join(base, 'bin', 'nginx', v);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, nombreEjecutable('nginx')), '');
      }
      await expect(n.desinstalarVersion('nginx', '1.30.8')).rejects.toMatchObject({
        codigo: 'instalador.version_en_uso',
      });
      await n.desinstalarVersion('nginx', '1.30.6');
      expect(await n.instalador.instalados('nginx')).toEqual(['1.30.8']);
      // Predeterminar una versión no instalada se rechaza; Node sin instalar tampoco.
      await expect(n.predeterminarVersion('node', '22.1.0')).rejects.toMatchObject({
        codigo: 'servicios.no_instalado',
      });
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  }, 20_000);

  it('sin red no publica nada y el arranque no falla', async () => {
    const base = await carpetaTemporal('pel-nov-sinred-');
    await instalarMysql(base, '8.4.13');
    let pedidos = 0;
    const f = (async () => {
      pedidos++;
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    const n = await crearNucleo(base, f);
    try {
      await esperarA(() => pedidos > 0);
      await new Promise((r) => setTimeout(r, 100));
      expect(n.avisos.lista().filter((a) => a.tipo === 'version-nueva')).toEqual([]);
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });

  it('silenciarVersiones guarda Config.catalogo.silenciados; un servicio desconocido se rechaza', async () => {
    const base = await carpetaTemporal('pel-nov-silencio-');
    const n = await crearNucleo(base, fetchFalso({}).f);
    try {
      expect(await n.silenciarVersiones('mysql', true)).toEqual(['mysql']);
      expect(await n.silenciarVersiones('nginx', true)).toEqual(['mysql', 'nginx']);
      expect(await n.silenciarVersiones('mysql', false)).toEqual(['nginx']);
      await expect(n.silenciarVersiones('../x', true)).rejects.toBeInstanceOf(ErrorWolf);
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });
});

describe('Novedades: edad de la caché (menores de la Task 17)', () => {
  const horas = (h: number): string => new Date(ahora.getTime() - h * 3600_000).toISOString();

  it('no avisa desde una caché de más de 7 días', async () => {
    instalados.mysql = ['8.4.13'];
    indices.mysql = {
      versiones: [v('mysql', '8.4.15', '8.4', { origen: 'cache' })],
      origen: 'cache',
      fecha: horas(8 * 24),
    };
    expect(await novedades().revisar()).toEqual([]);
    indices.mysql = { ...indices.mysql, fecha: horas(6 * 24) };
    expect(await novedades().revisar()).toHaveLength(1);
  });

  it('MongoDB se salta si su caché tiene menos de 24 h; otro servicio no', async () => {
    instalados.mongodb = ['8.0.10'];
    instalados.redis = ['8.2.1'];
    const versiones = [v('mongodb', '8.0.38', '8.0', { origen: 'cache' })];
    indices.mongodb = { versiones, origen: 'cache', fecha: horas(2) };
    indices.redis = {
      versiones: [v('redis', '8.2.3', '8.2', { origen: 'cache' })],
      origen: 'cache',
      fecha: horas(2),
    };
    expect((await novedades().revisar()).map((n) => n.servicio)).toEqual(['redis']);
    indices.mongodb = { versiones, origen: 'cache', fecha: horas(30) };
    expect((await novedades().revisar()).map((n) => n.servicio)).toEqual(['redis', 'mongodb']);
    // Recién consultado en vivo (o renovado con 304) sí se revisa.
    indices.mongodb = { versiones, origen: 'vivo', fecha: horas(0) };
    expect((await novedades().revisar()).map((n) => n.servicio)).toContain('mongodb');
  });
});
