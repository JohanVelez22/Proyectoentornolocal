import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ApiEntorno,
  EstadoGeneral,
  EstadoServicio,
  EventosNucleo,
  ProgresoInstalacion,
} from '../src/shared/api';
import { iniciarEntorno } from '../src/renderer/stores/entorno';
import { useHosts } from '../src/renderer/stores/hosts';
import { useServicios } from '../src/renderer/stores/servicios';
import { useSitios } from '../src/renderer/stores/sitios';
import { useTuneles } from '../src/renderer/stores/tuneles';

type Oyente = (dato: unknown) => void;

const nginx: EstadoServicio = {
  id: 'nginx',
  nombre: 'Nginx',
  version: '1.28.0',
  estado: 'apagado',
  puertos: [80],
  pid: null,
};
const php: EstadoServicio = {
  id: 'php-8.4',
  nombre: 'PHP 8.4',
  version: '8.4.27',
  estado: 'apagado',
  puertos: [9840, 9841],
  pid: null,
};

function apiFalsa(general: Partial<EstadoGeneral> = {}) {
  const oyentes = new Map<string, Set<Oyente>>();
  const api = {
    estadoGeneral: vi.fn(async (): Promise<EstadoGeneral> => ({
      servicios: [nginx, php],
      sitios: [],
      tuneles: [],
      hosts: { pendientes: [], duplicadosFuera: [] },
      ...general,
    })),
    servicios: {
      estados: vi.fn(async () => [nginx, php]),
      iniciar: vi.fn(),
      detener: vi.fn(),
      iniciarTodo: vi.fn(),
      detenerTodo: vi.fn(),
    },
    instalador: {
      listarVersiones: vi.fn(async () => []),
      instalar: vi.fn(),
      instalados: vi.fn(async (s: string) => (s === 'php' ? ['8.3', '8.4'] : [])),
    },
    on: vi.fn((nombre: string, fn: Oyente) => {
      const set = oyentes.get(nombre) ?? new Set<Oyente>();
      set.add(fn);
      oyentes.set(nombre, set);
      return () => void set.delete(fn);
    }),
  };
  const emitir = <K extends keyof EventosNucleo>(nombre: K, dato: EventosNucleo[K]): void => {
    for (const fn of oyentes.get(nombre) ?? []) fn(dato);
  };
  const cuantos = (nombre: string): number => oyentes.get(nombre)?.size ?? 0;
  return { api, emitir, cuantos };
}

describe('stores de la interfaz', () => {
  let falsa: ReturnType<typeof apiFalsa>;

  beforeEach(() => {
    setActivePinia(createPinia());
    falsa = apiFalsa();
    vi.stubGlobal('window', { entorno: falsa.api as unknown as ApiEntorno });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('un evento servicio:estado actualiza la tarjeta sin llamar a estados()', async () => {
    await iniciarEntorno();
    const servicios = useServicios();
    expect(servicios.porId['php-8.4']?.estado).toBe('apagado');

    falsa.emitir('servicio:estado', { ...php, estado: 'encendido', pid: 4321 });

    expect(servicios.porId['php-8.4']?.estado).toBe('encendido');
    expect(servicios.porId['php-8.4']?.pid).toBe(4321);
    expect(servicios.porId['nginx']?.estado).toBe('apagado');
    expect(servicios.encendidos).toBe(1);
    expect(falsa.api.servicios.estados).not.toHaveBeenCalled();
    expect(falsa.api.estadoGeneral).toHaveBeenCalledTimes(1);
  });

  it('un servicio nuevo que llega por evento aparece en la lista', async () => {
    await iniciarEntorno();
    const servicios = useServicios();
    falsa.emitir('servicio:estado', {
      id: 'mysql',
      nombre: 'MySQL',
      version: null,
      estado: 'externo',
      puertos: [3306],
      pid: 99,
    });
    expect(servicios.lista.map((s) => s.id)).toEqual(['nginx', 'php-8.4', 'mysql']);
  });

  it('un evento recibido antes de la carga inicial no se pisa con datos viejos', async () => {
    const servicios = useServicios();
    servicios.iniciar();
    falsa.emitir('servicio:estado', { ...nginx, estado: 'encendido', pid: 10 });
    servicios.hidratar([nginx, php]);
    expect(servicios.porId['nginx']?.estado).toBe('encendido');
    expect(servicios.porId['php-8.4']?.estado).toBe('apagado');
  });

  it('si la carga inicial falla, servicios queda cargado (no "Conectando…" para siempre)', async () => {
    falsa.api.estadoGeneral.mockRejectedValueOnce(new Error('sin núcleo'));
    await expect(iniciarEntorno()).rejects.toThrow('sin núcleo');
    expect(useServicios().cargado).toBe(true);
  });

  it('se suscribe una sola vez aunque iniciar se llame dos veces', async () => {
    await iniciarEntorno();
    await iniciarEntorno();
    expect(falsa.cuantos('servicio:estado')).toBe(1);
    expect(falsa.cuantos('instalacion:progreso')).toBe(1);
    expect(falsa.cuantos('sitio:cambio')).toBe(1);
    expect(falsa.cuantos('tunel:estado')).toBe(1);
    expect(falsa.cuantos('hosts:estado')).toBe(1);
  });

  it('el progreso de instalación se guarda por servicio y versión', async () => {
    await iniciarEntorno();
    const servicios = useServicios();
    const p: ProgresoInstalacion = {
      servicio: 'php',
      version: '8.4.27',
      fase: 'descargando',
      porcentaje: 42,
    };
    falsa.emitir('instalacion:progreso', p);
    falsa.emitir('instalacion:progreso', { ...p, version: '8.3.30', porcentaje: 5 });

    expect(servicios.progreso['php@8.4.27']?.porcentaje).toBe(42);
    expect(servicios.progreso['php@8.3.30']?.porcentaje).toBe(5);
    expect(servicios.progresoDe('php')).toHaveLength(2);
    expect(servicios.progresoDe('nginx')).toHaveLength(0);

    falsa.emitir('instalacion:progreso', { ...p, porcentaje: 80, fase: 'extrayendo' });
    expect(servicios.progreso['php@8.4.27']).toMatchObject({ fase: 'extrayendo', porcentaje: 80 });
  });

  it('al terminar una instalación se recargan los instalados de ese servicio', async () => {
    await iniciarEntorno();
    const servicios = useServicios();
    falsa.emitir('instalacion:progreso', {
      servicio: 'php',
      version: '8.4.27',
      fase: 'listo',
      porcentaje: 100,
    });
    await vi.waitFor(() => expect(servicios.instalados['php']).toEqual(['8.3', '8.4']));
    expect(falsa.api.instalador.instalados).toHaveBeenCalledWith('php');
  });

  it('sitios, túneles y hosts se hidratan y siguen sus eventos', async () => {
    falsa = apiFalsa({
      hosts: { pendientes: ['a.test'], duplicadosFuera: [] },
      tuneles: [{ sitioId: 's1', estado: 'apagado', url: null }],
    });
    vi.stubGlobal('window', { entorno: falsa.api as unknown as ApiEntorno });
    await iniciarEntorno();
    const sitios = useSitios();
    const tuneles = useTuneles();
    const hosts = useHosts();
    expect(hosts.pendientes).toEqual(['a.test']);
    expect(tuneles.activos).toHaveLength(0);

    falsa.emitir('tunel:estado', {
      sitioId: 's1',
      estado: 'activo',
      url: 'https://abc.trycloudflare.com',
    });
    falsa.emitir('hosts:estado', { pendientes: [], duplicadosFuera: [] });
    falsa.emitir('sitio:cambio', [
      {
        id: 's1',
        nombre: 'Uno',
        dominio: 'uno.test',
        alias: [],
        carpeta: 'C:/x',
        tipo: 'estatico',
        php: null,
        puertoProxy: null,
        reglasExtra: '',
        urlBaseVar: null,
        datosReales: false,
        https: false,
        redirigirHttps: false,
        nota: '',
      },
    ]);

    expect(tuneles.activos.map((t) => t.url)).toEqual(['https://abc.trycloudflare.com']);
    expect(hosts.pendientes).toEqual([]);
    expect(sitios.lista.map((s) => s.dominio)).toEqual(['uno.test']);
  });
});
