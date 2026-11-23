import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
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
    return ['tienda', 'blog'];
  },
  respaldar: async (id, b, carpeta) => {
    if (respaldarFalla) throw new Error('mysqldump falló');
    const version = estados.get(id) === 'encendido' ? versionViva(id) : 'apagada';
    eventos.push(`volcado:${id}:${b}:${version}`);
    const archivo = path.join(carpeta, `${b}.sql`);
    await writeFile(archivo, `-- ${b}`);
    return archivo;
  },
  restaurar: async (id, archivo, b) => {
    eventos.push(`restaurar:${id}:${b}:${path.basename(archivo)}`);
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
      copiar: (de, a) => cp(de, a, { recursive: true, errorOnExist: true, force: false }),
    },
    reloj: () => new Date('2026-11-23T10:00:00'),
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

describe('rama nueva', () => {
  it('crea una instancia nueva, copia las bases y no toca la vieja', async () => {
    const s = crear();
    await preparar(s);
    const id = await s.datos.nuevaRama('mysql', '8.0.44', { copiarDesde: 'mysql@8.4' });
    expect(id).toBe('mysql@8.0');
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
