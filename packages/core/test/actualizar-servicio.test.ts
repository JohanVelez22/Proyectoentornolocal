import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlmacenCredenciales } from '../src/almacen';
import { Instalador } from '../src/catalogo/instalador';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { Plataforma } from '../src/plataforma/tipos';
import type { DefProceso, EstadoProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import type { DefServicio } from '../src/servicios/definicion';
import type { OperacionesRespaldo } from '../src/servicios/actualizar';
import { Servicios } from '../src/servicios/servicios';
import { ConfigSchema, type Config, type IdInstancia } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let base: string;
let rutas: Rutas;
let cfg: Config;
let instalados: Record<string, string[]>;
let estados: Map<string, EstadoProceso>;
let iniciados: DefProceso[];
let eventos: string[];
let fallan: Set<string>;
let libre: number;
let respaldarFalla: boolean;
/** Versión viva con la que la consulta de salud (listarBases) falla. */
let listarFallaCon: string | null;
let restaurarFalla: Set<string>;
let contenidoVolcado: (base: string) => string;
let copiar: (de: string, a: string) => Promise<void>;
let reloj: Date;

const SELLO = '20261123-100000';
const datosDe = (clave: string): string => path.join(base, 'data', 'mysql', clave);

const mysql: DefServicio = {
  id: 'mysql',
  nombre: 'MySQL',
  categoria: 'bd',
  puertoPorDefecto: 3306,
  async inicializar(c) {
    await mkdir(c.datos, { recursive: true });
    await writeFile(path.join(c.datos, 'ibdata1'), `creado con ${c.version}`);
  },
  async proceso(c) {
    return {
      id: 'mysql',
      comando: path.join(c.bin, 'bin', 'mysqld.exe'),
      args: [`--datadir=${c.datos}`],
      puerto: c.puerto,
      log: c.rutas.logs('mysql.log'),
      reiniciar: false,
      env: { VERSION: c.version, DATOS: c.datos },
    };
  },
};

const respaldo = (): OperacionesRespaldo => ({
  listarBases: async (id) => {
    eventos.push(`listar:${id}`);
    if (listarFallaCon !== null && versionViva(id) === listarFallaCon) {
      throw new Error('Access denied');
    }
    return ['tienda', 'blog'];
  },
  respaldar: async (id, b, carpeta) => {
    if (respaldarFalla) throw new Error('mysqldump falló');
    const version = estados.get(id) === 'encendido' ? versionViva(id) : 'apagada';
    eventos.push(`volcado:${id}:${b}:${version}`);
    const archivo = path.join(carpeta, `${b}.sql`);
    await writeFile(archivo, contenidoVolcado(b));
    return archivo;
  },
  restaurar: async (id, archivo, b) => {
    eventos.push(`restaurar:${id}:${b}:${path.basename(archivo)}`);
    if (restaurarFalla.has(b)) throw new Error(`no se pudo restaurar ${b}`);
    return [];
  },
});

/** Versión con la que se lanzó el proceso vivo de `id`. */
function versionViva(id: string): string {
  // Lanzada como implícita (`mysql`) y renombrada al pasar a instancias (`mysql@8.4`).
  return (
    [...iniciados].reverse().find((d) => d.id === id || id.startsWith(`${d.id}@`))?.env?.[
      'VERSION'
    ] ?? '?'
  );
}

function crear(): Servicios {
  return new Servicios({
    rutas,
    plataforma: {
      quienUsaPuerto: async () => null,
      duenosDePuertos: async () => new Map(),
      rangosReservados: async () => [],
    } as unknown as Plataforma,
    supervisor: {
      iniciar: async (d: DefProceso) => {
        iniciados.push(d);
        const v = d.env?.['VERSION'] ?? '';
        eventos.push(`iniciar:${d.id}:${v}`);
        if (fallan.has(v)) {
          // La versión nueva toca los datos antes de caerse (como una actualización a medias).
          await writeFile(path.join(d.env!['DATOS']!, 'ibdata1'), `tocado por ${v}`);
          estados.set(d.id, 'error');
          return;
        }
        estados.set(d.id, 'encendido');
      },
      detener: async (id: string) => {
        eventos.push(`detener:${id}`);
        estados.delete(id);
      },
      estado: (id: string) => estados.get(id) ?? 'apagado',
      pid: (id: string) => (estados.get(id) === 'encendido' ? 77 : null),
      mensaje: () => 'el servidor se cerró',
      renombrarRegistro: (a: string, b: string) => {
        const e = estados.get(a);
        if (e) {
          estados.delete(a);
          estados.set(b, e);
        }
      },
    } as never,
    instalador: {
      instalados: async (s: string) => instalados[s] ?? [],
      instalado: async (s: string, v: string) => (instalados[s] ?? []).includes(v),
    } as never,
    leerConfig: async () => cfg,
    modificarConfig: async (fn) => {
      const copia = structuredClone(cfg);
      fn(copia);
      const antes = cfg.servicios.datos.mysql.instancias?.['8.4']?.version;
      cfg = ConfigSchema.parse(copia);
      const despues = cfg.servicios.datos.mysql.instancias?.['8.4']?.version;
      if (antes !== undefined && antes !== despues) {
        eventos.push(
          `version:${despues}:copia=${existsSync(`${datosDe('8.4')}.respaldo-${SELLO}`)}`,
        );
      }
    },
    credenciales: new AlmacenCredenciales(rutas),
    sonda: async () => true,
    definiciones: [mysql],
    existePid: () => false,
    instalarVersion: async (s, v) => {
      eventos.push(`instalar:${s}:${v}`);
      instalados[s] = [...(instalados[s] ?? []), v];
    },
    respaldo: respaldo(),
    fsCopia: {
      espacioLibre: async () => libre,
      copiar: (de, a) => copiar(de, a),
    },
    reloj: () => reloj,
    plazoSaludMs: 200,
  });
}

beforeEach(async () => {
  base = await carpetaTemporal('pel-actualizar-');
  rutas = new Rutas(base);
  cfg = ConfigSchema.parse({});
  cfg.servicios.datos.mysql.version = '8.4.13';
  instalados = { mysql: ['8.4.13'] };
  estados = new Map();
  iniciados = [];
  eventos = [];
  fallan = new Set();
  libre = 10 * 1024 ** 3;
  respaldarFalla = false;
  listarFallaCon = null;
  restaurarFalla = new Set();
  contenidoVolcado = (b) => `-- ${b}`;
  copiar = (de, a) => cp(de, a, { recursive: true, errorOnExist: true, force: false });
  reloj = new Date('2026-11-23T10:00:00');
});

/** Instancia mysql@8.4 encendida con datos de un cliente. */
async function preparar(s: Servicios): Promise<void> {
  await s.iniciar('mysql');
  await mkdir(path.join(datosDe('8.4'), 'tienda'), { recursive: true });
  await writeFile(path.join(datosDe('8.4'), 'tienda', 'clientes.ibd'), 'datos del cliente');
  eventos.length = 0;
}

describe('actualizar (parche dentro de la rama)', () => {
  it('respalda (volcado con los binarios actuales y copia en frío) antes de cambiar la versión', async () => {
    const s = crear();
    await preparar(s);
    const r = await s.datos.actualizar('mysql@8.4', '8.4.14');
    expect(r.anterior).toBe('8.4.13');
    expect(r.respaldo.carpeta).toBe(`${datosDe('8.4')}.respaldo-${SELLO}`);
    expect(r.respaldo.volcados.map((v) => path.basename(v))).toEqual(['tienda.sql', 'blog.sql']);
    expect(eventos).toEqual([
      'instalar:mysql:8.4.14',
      'listar:mysql@8.4',
      'volcado:mysql@8.4:tienda:8.4.13',
      'volcado:mysql@8.4:blog:8.4.13',
      'detener:mysql@8.4',
      'version:8.4.14:copia=true',
      'iniciar:mysql@8.4:8.4.14',
      // Salud: además del puerto, una consulta mínima.
      'listar:mysql@8.4',
    ]);
    expect(await readFile(path.join(r.respaldo.carpeta, 'tienda', 'clientes.ibd'), 'utf8')).toBe(
      'datos del cliente',
    );
    for (const v of r.respaldo.volcados) expect(existsSync(v)).toBe(true);
    // Los volcados no quedan dentro de la carpeta de datos (MySQL los vería como bases).
    expect(r.respaldo.volcados.every((v) => !v.startsWith(datosDe('8.4') + path.sep))).toBe(true);
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.version).toBe('8.4.14');
    expect(cfg.servicios.datos.mysql.version).toBe('8.4.14');
    expect(estados.get('mysql@8.4')).toBe('encendido');
    // El binario anterior sigue instalado.
    expect(instalados['mysql']).toEqual(['8.4.13', '8.4.14']);
  });

  it('si la versión nueva no arranca, vuelve a la anterior con sus datos y el respaldo queda', async () => {
    fallan.add('8.4.14');
    const s = crear();
    await preparar(s);
    const e = await s.datos.actualizar('mysql@8.4', '8.4.14').catch((x: unknown) => x);
    expect(e).toMatchObject({
      codigo: 'servicios.actualizacion_revertida',
      datos: { nombre: 'mysql@8.4', version: '8.4.14', anterior: '8.4.13' },
    });
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.version).toBe('8.4.13');
    // Los datos vuelven a ser los de antes; lo que tocó la versión nueva queda aparte.
    expect(await readFile(path.join(datosDe('8.4'), 'ibdata1'), 'utf8')).toBe('creado con 8.4.13');
    expect(await readFile(path.join(datosDe('8.4'), 'tienda', 'clientes.ibd'), 'utf8')).toBe(
      'datos del cliente',
    );
    expect(await readFile(path.join(`${datosDe('8.4')}.fallida-${SELLO}`, 'ibdata1'), 'utf8')).toBe(
      'tocado por 8.4.14',
    );
    expect(existsSync(`${datosDe('8.4')}.respaldo-${SELLO}`)).toBe(true);
    expect(eventos.at(-1)).toBe('iniciar:mysql@8.4:8.4.13');
    expect(estados.get('mysql@8.4')).toBe('encendido');
  });

  it('si el respaldo falla no actualiza nada', async () => {
    respaldarFalla = true;
    const s = crear();
    await preparar(s);
    await expect(s.datos.actualizar('mysql@8.4', '8.4.14')).rejects.toMatchObject({
      codigo: 'servicios.respaldo_fallo',
    });
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.version).toBe('8.4.13');
    expect(eventos.some((x) => x.startsWith('version:'))).toBe(false);
    expect(estados.get('mysql@8.4')).toBe('encendido');
  });

  it('sin espacio para la copia en frío no actualiza (y la vuelve a encender)', async () => {
    libre = 1024;
    const s = crear();
    await preparar(s);
    await expect(s.datos.actualizar('mysql@8.4', '8.4.14')).rejects.toMatchObject({
      codigo: 'servicios.espacio_insuficiente',
    });
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.version).toBe('8.4.13');
    expect(existsSync(`${datosDe('8.4')}.respaldo-${SELLO}`)).toBe(false);
    expect(estados.get('mysql@8.4')).toBe('encendido');
    expect(versionViva('mysql@8.4')).toBe('8.4.13');
  });

  it('otra rama no es una actualización', async () => {
    const s = crear();
    await preparar(s);
    await expect(s.datos.actualizar('mysql@8.4', '9.1.0')).rejects.toMatchObject({
      codigo: 'servicios.otra_rama',
    });
  });

  it('apagada: se enciende para el volcado y al final queda apagada', async () => {
    const s = crear();
    await preparar(s);
    await s.datos.detener('mysql@8.4' as IdInstancia);
    eventos.length = 0;
    await s.datos.actualizar('mysql@8.4', '8.4.14');
    expect(eventos[1]).toBe('iniciar:mysql@8.4:8.4.13');
    expect(eventos).toContain('volcado:mysql@8.4:tienda:8.4.13');
    expect(estados.get('mysql@8.4')).toBeUndefined();
  });
});

describe('actualizar: vuelta atrás segura y salud', () => {
  it('la versión nueva responde al puerto pero no a una consulta: se revierte', async () => {
    listarFallaCon = '8.4.14';
    const s = crear();
    await preparar(s);
    await expect(s.datos.actualizar('mysql@8.4', '8.4.14')).rejects.toMatchObject({
      codigo: 'servicios.actualizacion_revertida',
    });
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.version).toBe('8.4.13');
    expect(versionViva('mysql@8.4')).toBe('8.4.13');
  });

  it('la copia se devuelve verificada y con rename: la carpeta tocada queda aparte', async () => {
    fallan.add('8.4.14');
    const destinos: string[] = [];
    const real = copiar;
    copiar = async (de, a) => {
      destinos.push(path.basename(a));
      await real(de, a);
    };
    const s = crear();
    await preparar(s);
    await s.datos.actualizar('mysql@8.4', '8.4.14').catch(() => undefined);
    // La devolución copia primero a <clave>.restaurando-<sello> (nunca encima de la carpeta).
    expect(destinos).toEqual([`8.4.respaldo-${SELLO}`, `8.4.restaurando-${SELLO}`]);
    expect(existsSync(`${datosDe('8.4')}.restaurando-${SELLO}`)).toBe(false);
    expect(await readFile(path.join(datosDe('8.4'), 'ibdata1'), 'utf8')).toBe('creado con 8.4.13');
  });

  it('si la devolución falla, no arranca y avisa con las rutas de la carpeta tocada y del respaldo', async () => {
    fallan.add('8.4.14');
    const real = copiar;
    copiar = async (de, a) => {
      if (a.includes('.restaurando-')) throw new Error('disco lleno');
      await real(de, a);
    };
    const s = crear();
    await preparar(s);
    const e = await s.datos.actualizar('mysql@8.4', '8.4.14').catch((x: unknown) => x);
    expect(e).toMatchObject({
      codigo: 'servicios.restauracion_fallo',
      datos: {
        nombre: 'mysql@8.4',
        fallida: datosDe('8.4'),
        respaldo: `${datosDe('8.4')}.respaldo-${SELLO}`,
      },
    });
    // No se arrancó nada encima de datos dudosos.
    expect(eventos.at(-1)).not.toBe('iniciar:mysql@8.4:8.4.13');
    expect(estados.get('mysql@8.4')).not.toBe('encendido');
    // Los datos tocados siguen en su sitio (nada se borró) y el respaldo está entero.
    expect(await readFile(path.join(datosDe('8.4'), 'ibdata1'), 'utf8')).toBe('tocado por 8.4.14');
    expect(
      await readFile(path.join(`${datosDe('8.4')}.respaldo-${SELLO}`, 'ibdata1'), 'utf8'),
    ).toBe('creado con 8.4.13');
  });

  it('una devolución incompleta no aparta la carpeta ni arranca', async () => {
    fallan.add('8.4.14');
    const real = copiar;
    copiar = async (de, a) => {
      await real(de, a);
      if (a.includes('.restaurando-')) await rm(path.join(a, 'tienda'), { recursive: true });
    };
    const s = crear();
    await preparar(s);
    await expect(s.datos.actualizar('mysql@8.4', '8.4.14')).rejects.toMatchObject({
      codigo: 'servicios.restauracion_fallo',
    });
    expect(existsSync(`${datosDe('8.4')}.fallida-${SELLO}`)).toBe(false);
    expect(await readFile(path.join(datosDe('8.4'), 'ibdata1'), 'utf8')).toBe('tocado por 8.4.14');
    expect(estados.get('mysql@8.4')).not.toBe('encendido');
  });

  it('respaldosDeDatos lista respaldos, volcados y carpetas fallidas con su tamaño', async () => {
    fallan.add('8.4.14');
    const s = crear();
    await preparar(s);
    await s.datos.actualizar('mysql@8.4', '8.4.14').catch(() => undefined);
    const lista = await s.datos.respaldosDeDatos();
    expect(lista.map((r) => [r.servicio, r.clave, r.tipo, r.sello])).toEqual([
      ['mysql', '8.4', 'fallida', SELLO],
      ['mysql', '8.4', 'respaldo', SELLO],
      ['mysql', '8.4', 'volcados', SELLO],
    ]);
    const respaldo = lista.find((r) => r.tipo === 'respaldo')!;
    expect(respaldo.carpeta).toBe(`${datosDe('8.4')}.respaldo-${SELLO}`);
    // ibdata1, tienda/clientes.ibd y la marca .pel-inicializado (fecha ISO de 24 caracteres).
    expect(respaldo).toMatchObject({
      archivos: 3,
      bytes: 'creado con 8.4.13'.length + 'datos del cliente'.length + 24,
    });
    expect(lista.find((r) => r.tipo === 'volcados')!.bytes).toBe(
      '-- tienda'.length + '-- blog'.length,
    );
  });
});

describe('rama nueva', () => {
  it('crea una instancia nueva, copia las bases y no toca la vieja', async () => {
    const s = crear();
    await preparar(s);
    const r = await s.datos.nuevaRama('mysql', '8.0.44', { copiarDesde: 'mysql@8.4' });
    expect(r).toEqual({
      id: 'mysql@8.0',
      restauradas: ['tienda', 'blog'],
      fallidas: [],
      advertencias: [],
    });
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']).toEqual({
      version: '8.4.13',
      puerto: 3306,
      autoIniciar: false,
    });
    expect(cfg.servicios.datos.mysql.predeterminada).toBe('8.4');
    expect(cfg.servicios.datos.mysql.instancias?.['8.0']).toMatchObject({ version: '8.0.44' });
    expect(eventos.filter((x) => x.startsWith('restaurar:'))).toEqual([
      'restaurar:mysql@8.0:tienda:tienda.sql',
      'restaurar:mysql@8.0:blog:blog.sql',
    ]);
    expect(eventos).not.toContain('detener:mysql@8.4');
    expect(estados.get('mysql@8.4')).toBe('encendido');
    expect(await readFile(path.join(datosDe('8.4'), 'tienda', 'clientes.ibd'), 'utf8')).toBe(
      'datos del cliente',
    );
    expect(existsSync(path.join(datosDe('8.0'), 'ibdata1'))).toBe(true);
  });

  it('informa qué bases se restauraron y cuáles no (sin cortar) y avisa de DEFINER en MySQL', async () => {
    restaurarFalla.add('blog');
    contenidoVolcado = (b) =>
      b === 'tienda'
        ? '-- tienda\nCREATE DEFINER=`app`@`localhost` VIEW v AS SELECT 1;\n'
        : `-- ${b}`;
    const s = crear();
    await preparar(s);
    const r = await s.datos.nuevaRama('mysql', '8.0.44', { copiarDesde: 'mysql@8.4' });
    expect(r.restauradas).toEqual(['tienda']);
    expect(r.fallidas).toEqual([{ base: 'blog', motivo: 'no se pudo restaurar blog' }]);
    expect(r.advertencias).toEqual([expect.stringContaining('tienda')]);
    expect(r.advertencias[0]).toContain('DEFINER');
    // Se intentaron las dos.
    expect(eventos.filter((x) => x.startsWith('restaurar:'))).toHaveLength(2);
  });
});

describe('desinstalar', () => {
  async function snapshot(dir: string): Promise<string[]> {
    const res: string[] = [];
    for (const e of await readdir(dir, { withFileTypes: true, recursive: true })) {
      const ruta = path.join(e.parentPath, e.name);
      res.push(e.isFile() ? `${ruta}=${await readFile(ruta, 'utf8')}` : ruta);
    }
    return res.sort();
  }

  it('una versión en uso por una instancia se rechaza; una sin uso deja data/ igual', async () => {
    const s = crear();
    await preparar(s);
    const inst = new Instalador(rutas, new Eventos<EventosNucleo>());
    inst.fijarVerificadorEnUso((sv, v) => s.datos.versionEnUso(sv, v));
    for (const v of ['8.4.13', '8.0.44']) {
      await mkdir(path.join(rutas.bin('mysql', v), 'bin'), { recursive: true });
      await writeFile(path.join(rutas.bin('mysql', v), 'bin', 'mysqld.exe'), '');
    }
    instalados['mysql'] = ['8.0.44', '8.4.13'];
    const antes = await snapshot(path.join(base, 'data'));
    await expect(inst.desinstalar('mysql', '8.4.13')).rejects.toMatchObject({
      codigo: 'instalador.version_en_uso',
      datos: { instancia: 'mysql@8.4' },
    });
    expect(existsSync(rutas.bin('mysql', '8.4.13'))).toBe(true);
    await inst.desinstalar('mysql', '8.0.44');
    expect(existsSync(rutas.bin('mysql', '8.0.44'))).toBe(false);
    expect(await snapshot(path.join(base, 'data'))).toEqual(antes);
  });
});

describe('instancia bloqueada tras una devolución fallida (T18-N1)', () => {
  /** Devolución que falla después de apartar la carpeta: data/mysql/8.4 queda sin datos. */
  async function bloquear(s: Servicios): Promise<void> {
    fallan.add('8.4.14');
    const real = copiar;
    copiar = async (de, a) => {
      if (a.includes('.restaurando-')) throw new Error('disco lleno');
      await real(de, a);
    };
    await preparar(s);
    cfg.servicios.datos.mysql.autoIniciar = true;
    await s.datos.autoIniciar('mysql@8.4' as IdInstancia, true);
    await expect(s.datos.actualizar('mysql@8.4', '8.4.14')).rejects.toMatchObject({
      codigo: 'servicios.restauracion_fallo',
    });
    copiar = real;
    eventos.length = 0;
  }

  it('queda bloqueada, sin arranque automático, y no se puede iniciar', async () => {
    const s = crear();
    await bloquear(s);
    expect(existsSync(`${datosDe('8.4')}.bloqueada`)).toBe(true);
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.autoIniciar).toBe(false);
    const e = await s.datos.iniciar('mysql@8.4' as IdInstancia).catch((x: unknown) => x);
    expect(e).toMatchObject({
      codigo: 'servicios.instancia_bloqueada',
      datos: {
        nombre: 'mysql@8.4',
        fallida: datosDe('8.4'),
        respaldo: `${datosDe('8.4')}.respaldo-${SELLO}`,
      },
    });
    // Ni por el servicio (predeterminada) ni por el arranque automático.
    await expect(s.datos.iniciar('mysql')).rejects.toMatchObject({
      codigo: 'servicios.instancia_bloqueada',
    });
    expect(await s.datos.iniciarAutomaticos()).toEqual([]);
    expect(eventos.filter((x) => x.startsWith('iniciar:'))).toEqual([]);
    await expect(s.datos.autoIniciar('mysql@8.4' as IdInstancia, true)).rejects.toMatchObject({
      codigo: 'servicios.instancia_bloqueada',
    });
    const [inst] = await s.datos.listaInstancias('mysql');
    expect(inst!.bloqueo).toMatchObject({ respaldo: `${datosDe('8.4')}.respaldo-${SELLO}` });
  });

  it('nunca inicializa una carpeta vacía de una instancia bloqueada', async () => {
    const s = crear();
    await bloquear(s);
    // Simula el peor caso: la carpeta de datos no está (quedó apartada).
    await rm(datosDe('8.4'), { recursive: true, force: true });
    await expect(s.datos.iniciar('mysql@8.4' as IdInstancia)).rejects.toMatchObject({
      codigo: 'servicios.instancia_bloqueada',
    });
    expect(existsSync(datosDe('8.4'))).toBe(false);
  });

  it('resolver sin respaldo exige confirmación y datos inicializados en su sitio', async () => {
    const s = crear();
    await bloquear(s);
    await expect(
      s.datos.instancias.desbloquear('mysql@8.4' as IdInstancia, { confirmacion: 'mysql' }),
    ).rejects.toMatchObject({ codigo: 'instancias.confirmacion' });
    await rm(datosDe('8.4'), { recursive: true, force: true });
    await expect(
      s.datos.instancias.desbloquear('mysql@8.4' as IdInstancia, { confirmacion: 'mysql@8.4' }),
    ).rejects.toMatchObject({ codigo: 'instancias.sin_datos' });
    expect(existsSync(`${datosDe('8.4')}.bloqueada`)).toBe(true);
  });

  it('resolver con la carpeta actual la desbloquea (sin encenderla)', async () => {
    const s = crear();
    await bloquear(s);
    await s.datos.instancias.desbloquear('mysql@8.4' as IdInstancia, {
      confirmacion: 'mysql@8.4',
    });
    expect(existsSync(`${datosDe('8.4')}.bloqueada`)).toBe(false);
    expect(eventos.filter((x) => x.startsWith('iniciar:'))).toEqual([]);
    await s.datos.iniciar('mysql@8.4' as IdInstancia);
    expect(estados.get('mysql@8.4')).toBe('encendido');
  });

  it('resolver restaurando un respaldo elegido: verifica la copia y aparta la carpeta tocada', async () => {
    const s = crear();
    await bloquear(s);
    reloj = new Date('2026-11-24T08:00:00');
    await s.datos.instancias.desbloquear('mysql@8.4' as IdInstancia, {
      confirmacion: 'mysql@8.4',
      respaldo: SELLO,
    });
    expect(await readFile(path.join(datosDe('8.4'), 'ibdata1'), 'utf8')).toBe('creado con 8.4.13');
    expect(
      await readFile(path.join(`${datosDe('8.4')}.fallida-20261124-080000`, 'ibdata1'), 'utf8'),
    ).toBe('tocado por 8.4.14');
    // El respaldo sigue entero y la marca desapareció.
    expect(existsSync(`${datosDe('8.4')}.respaldo-${SELLO}`)).toBe(true);
    expect(existsSync(`${datosDe('8.4')}.bloqueada`)).toBe(false);
    // Un sello que no existe o mal formado no se usa.
    await expect(
      s.datos.instancias.desbloquear('mysql@8.4' as IdInstancia, {
        confirmacion: 'mysql@8.4',
        respaldo: '../x',
      }),
    ).rejects.toMatchObject({ codigo: 'instancias.respaldo_no_existe' });
  });
});

describe('respaldos de datos: plan y borrado confirmado', () => {
  it('planActualizar mide la carpeta y el espacio libre, y dice si habrá volcados', async () => {
    const s = crear();
    await preparar(s);
    const p = await s.datos.planActualizar('mysql@8.4' as IdInstancia);
    expect(p).toMatchObject({
      id: 'mysql@8.4',
      carpeta: datosDe('8.4'),
      archivos: 3,
      libres: libre,
      volcados: true,
      hayDatos: true,
    });
    expect(p.necesarios).toBe(p.bytes + 256 * 1024 * 1024);
  });

  it('borra solo una copia listada; nunca la carpeta actual ni la que apunta un bloqueo', async () => {
    fallan.add('8.4.14');
    const s = crear();
    await preparar(s);
    await s.datos.actualizar('mysql@8.4', '8.4.14').catch(() => undefined);
    const ref = { servicio: 'mysql' as const, clave: '8.4', sello: SELLO };
    await expect(
      s.datos.borrarRespaldoDatos({ ...ref, tipo: 'respaldo' }, false as never),
    ).rejects.toThrow();
    await s.datos.borrarRespaldoDatos({ ...ref, tipo: 'volcados' }, true);
    expect(existsSync(`${datosDe('8.4')}.respaldo-${SELLO}.volcados`)).toBe(false);
    await s.datos.borrarRespaldoDatos({ ...ref, tipo: 'fallida' }, true);
    expect(existsSync(`${datosDe('8.4')}.fallida-${SELLO}`)).toBe(false);
    // Lo que no está listado (otra clave, sello inventado, la carpeta actual) no existe para esto.
    for (const malo of [
      { ...ref, tipo: 'respaldo', sello: '20990101-000000' },
      { ...ref, clave: '../8.4', tipo: 'respaldo' },
      { ...ref, tipo: 'actual' },
    ]) {
      await expect(s.datos.borrarRespaldoDatos(malo as never, true)).rejects.toMatchObject({
        codigo: 'instancias.respaldo_no_existe',
      });
    }
    expect(existsSync(path.join(datosDe('8.4'), 'ibdata1'))).toBe(true);
    expect(existsSync(`${datosDe('8.4')}.respaldo-${SELLO}`)).toBe(true);
  });

  it('el respaldo de una instancia bloqueada no se puede borrar', async () => {
    fallan.add('8.4.14');
    const real = copiar;
    copiar = async (de, a) => {
      if (a.includes('.restaurando-')) throw new Error('disco lleno');
      await real(de, a);
    };
    const s = crear();
    await preparar(s);
    await s.datos.actualizar('mysql@8.4', '8.4.14').catch(() => undefined);
    await expect(
      s.datos.borrarRespaldoDatos(
        { servicio: 'mysql', clave: '8.4', tipo: 'respaldo', sello: SELLO },
        true,
      ),
    ).rejects.toMatchObject({ codigo: 'instancias.respaldo_en_uso' });
    expect(existsSync(`${datosDe('8.4')}.respaldo-${SELLO}`)).toBe(true);
  });
});
