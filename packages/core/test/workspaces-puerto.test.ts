import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import type { EstadoProceso } from '../src/procesos/supervisor';
import { crearPuertoWorkspaces, type DepsPuertoWorkspaces } from '../src/workspaces/puerto';
import {
  ConfigSchema,
  ProcesoProyectoSchema,
  SitioSchema,
  type EstadoInstancia,
  type ElementoWorkspace,
  type Sitio,
} from '../src/tipos';

/* El puerto solo conoce servicios, procesos de proyecto y el supervisor: aquí no hay (ni puede
   haber) nada de túneles ni de la red local. Se comprueba qué llama y con qué orden. */

const inst = (id: string, estado: EstadoProceso, predeterminada = true): EstadoInstancia =>
  ({
    id,
    servicio: id.split('@')[0],
    clave: id.split('@')[1],
    version: '1',
    puerto: 1,
    estado,
    pid: null,
    predeterminada,
    autoIniciar: false,
    tieneDatos: true,
  }) as EstadoInstancia;

let llamadas: string[];
let estados: Map<string, EstadoProceso>;
let instancias: EstadoInstancia[];
let ramas: string[];
let sitios: Sitio[];
let motivoBase: string | null;
let falla: Map<string, unknown>;

const sitio = (extra: Partial<Sitio> = {}): Sitio =>
  SitioSchema.parse({
    id: 'bot',
    nombre: 'Bot',
    dominio: 'bot.test',
    carpeta: 'C:\\proy\\bot',
    tipo: 'fastapi',
    procesos: [ProcesoProyectoSchema.parse({ id: 'uvicorn', comando: ['uvicorn', 'app:app'] })],
    ...extra,
  });

function armar(): ReturnType<typeof crearPuertoWorkspaces> {
  const deps: DepsPuertoWorkspaces = {
    servicios: {
      iniciar: async (id: string) => {
        llamadas.push(`servicios.iniciar:${id}`);
        if (falla.has(id)) throw falla.get(id);
      },
      detener: async (id: string) => {
        llamadas.push(`servicios.detener:${id}`);
      },
      ramasPhpEnUso: async () => ramas,
      esperarSaludDe: async (ref: string) => {
        llamadas.push(`salud:${ref}`);
      },
      baseSinResponderDe: async () => motivoBase,
      datos: {
        listaInstancias: async (s?: string) =>
          instancias.filter((i) => s === undefined || i.servicio === s),
      },
      php: { idTrabajador: (v: string, i: number) => `php-${v}-${i}` },
    } as unknown as DepsPuertoWorkspaces['servicios'],
    supervisor: { estado: (id: string) => estados.get(id) ?? 'apagado' },
    procesos: {
      iniciar: async (s: string, p: string) => {
        llamadas.push(`procesos.iniciar:${s}/${p}`);
        if (falla.has(`${s}/${p}`)) throw falla.get(`${s}/${p}`);
      },
      detener: async (s: string, p: string) => {
        llamadas.push(`procesos.detener:${s}/${p}`);
      },
    },
    leerSitios: async () => sitios,
    leerConfig: async () => ConfigSchema.parse({ servicios: { php: { trabajadores: 2 } } }),
    nginxInstalado: async () => true,
  };
  return crearPuertoWorkspaces(deps);
}

const pg: ElementoWorkspace = { tipo: 'instancia', id: 'postgresql@17' };
const ollama: ElementoWorkspace = { tipo: 'servicio', id: 'ollama' };
const proc: ElementoWorkspace = { tipo: 'proceso', sitioId: 'bot', procesoId: 'uvicorn' };

beforeEach(() => {
  llamadas = [];
  estados = new Map();
  instancias = [inst('postgresql@17', 'apagado'), inst('ollama@actual', 'apagado')];
  ramas = ['8.4'];
  sitios = [sitio()];
  motivoBase = null;
  falla = new Map();
});

describe('puerto de workspaces', () => {
  it('existe: instancias y servicios instalados, procesos del sitio, PHP en uso', async () => {
    const p = armar();
    expect(await p.existe(pg)).toBe(true);
    expect(await p.existe({ tipo: 'instancia', id: 'mysql@8.4' })).toBe(false);
    expect(await p.existe(ollama)).toBe(true);
    expect(await p.existe({ tipo: 'servicio', id: 'mailpit' })).toBe(false);
    expect(await p.existe(proc)).toBe(true);
    expect(await p.existe({ tipo: 'proceso', sitioId: 'bot', procesoId: 'otro' })).toBe(false);
    expect(await p.existe({ tipo: 'proceso', sitioId: 'nada', procesoId: 'uvicorn' })).toBe(false);
    expect(await p.existe({ tipo: 'servicio', id: 'nginx' })).toBe(true);
    expect(await p.existe({ tipo: 'servicio', id: 'php' })).toBe(true);
    ramas = [];
    expect(await p.existe({ tipo: 'servicio', id: 'php' })).toBe(false);
  });

  it('encendido: lee el estado de la instancia, del supervisor y de los trabajadores de PHP', async () => {
    const p = armar();
    expect(await p.encendido(pg)).toBe(false);
    instancias[0] = inst('postgresql@17', 'encendido');
    expect(await p.encendido(pg)).toBe(true);
    estados.set('proy-bot-uvicorn', 'iniciando');
    expect(await p.encendido(proc)).toBe(true);
    estados.set('nginx', 'encendido');
    expect(await p.encendido({ tipo: 'servicio', id: 'nginx' })).toBe(true);
    expect(await p.encendido({ tipo: 'servicio', id: 'php' })).toBe(false);
    estados.set('php-8.4-1', 'encendido');
    expect(await p.encendido({ tipo: 'servicio', id: 'php' })).toBe(true);
  });

  it('iniciar un dato lo enciende y espera su salud antes de seguir', async () => {
    await armar().iniciar(pg);
    expect(llamadas).toEqual(['servicios.iniciar:postgresql@17', 'salud:postgresql@17']);
    llamadas = [];
    await armar().iniciar(ollama);
    expect(llamadas).toEqual(['servicios.iniciar:ollama', 'salud:ollama']);
  });

  it('iniciar PHP enciende cada rama en uso instalada', async () => {
    ramas = ['8.3', '8.4'];
    await armar().iniciar({ tipo: 'servicio', id: 'php' });
    expect(llamadas).toEqual(['servicios.iniciar:php-8.3', 'servicios.iniciar:php-8.4']);
  });

  it('un proceso no arranca si la base que usa no responde (y lo dice con código)', async () => {
    motivoBase = 'no se inició porque PostgreSQL (puerto 5432) no responde';
    await expect(armar().iniciar(proc)).rejects.toMatchObject({
      codigo: 'workspaces.base_no_responde',
    });
    expect(llamadas).toEqual([]);
  });

  it('un proceso pasa por ProcesosProyecto.iniciar, que exige la confianza del sitio', async () => {
    falla.set('bot/uvicorn', new ErrorWolf('proyectos.no_confiado', 'sin confianza'));
    await expect(armar().iniciar(proc)).rejects.toMatchObject({ codigo: 'proyectos.no_confiado' });
    expect(llamadas).toEqual(['procesos.iniciar:bot/uvicorn']);
  });

  it('detener usa los mismos caminos', async () => {
    const p = armar();
    await p.detener(proc);
    await p.detener({ tipo: 'servicio', id: 'nginx' });
    await p.detener(pg);
    expect(llamadas).toEqual([
      'procesos.detener:bot/uvicorn',
      'servicios.detener:nginx',
      'servicios.detener:postgresql@17',
    ]);
  });

  it('encendidosExclusivos: los otros captadores de correo que corren', async () => {
    instancias.push(
      inst('mailpit@actual', 'apagado'),
      inst('smtp4dev@actual', 'encendido'),
      inst('inbucket@actual', 'apagado'),
    );
    const p = armar();
    expect(await p.encendidosExclusivos({ tipo: 'servicio', id: 'mailpit' })).toEqual([
      { tipo: 'servicio', id: 'smtp4dev' },
    ]);
    expect(await p.encendidosExclusivos({ tipo: 'servicio', id: 'smtp4dev' })).toEqual([]);
    expect(await p.encendidosExclusivos(pg)).toEqual([]);
  });
});
