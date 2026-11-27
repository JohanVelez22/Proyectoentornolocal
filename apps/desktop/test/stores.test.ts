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
import { categoriaDe, puertoAlternativo, useServicios } from '../src/renderer/stores/servicios';
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
      autoIniciar: vi.fn(async () => undefined),
    },
    config: {
      leer: vi.fn(async () => ({
        ftp: { redLocal: false },
        servicios: {
          datos: Object.fromEntries(
            [
              'mysql',
              'mariadb',
              'postgresql',
              'redis',
              'mongodb',
              'mailpit',
              'smtp4dev',
              'inbucket',
              'papercut',
              'ollama',
              'meilisearch',
            ].map((id) => [id, { version: null, puerto: 1, autoIniciar: id === 'mysql' }]),
          ),
        },
      })),
    },
    ftp: { redLocal: vi.fn(async () => undefined) },
    instalador: {
      listarVersiones: vi.fn(async () => []),
      instalar: vi.fn(),
      instalados: vi.fn(async (s: string) =>
        s === 'php' ? ['8.3', '8.4'] : s === 'nginx' ? ['1.28.0'] : [],
      ),
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
    // Servicios y Bases de datos (registro de pgvector), una vez cada uno.
    expect(falsa.cuantos('instalacion:progreso')).toBe(2);
    expect(falsa.cuantos('bd:progreso')).toBe(1);
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
        confiado: false,
        git: null,
        procesos: [],
        runtimes: {},
        nota: '',
      },
    ]);

    expect(tuneles.activos.map((t) => t.url)).toEqual(['https://abc.trycloudflare.com']);
    expect(hosts.pendientes).toEqual([]);
    expect(sitios.lista.map((s) => s.dominio)).toEqual(['uno.test']);
  });
  it('agrupa por categoría en el orden Web, PHP, Bases de datos, Correo, IA, Herramientas', async () => {
    await iniciarEntorno();
    const servicios = useServicios();
    const s = (id: string, nombre: string, categoria?: EstadoServicio['categoria']) =>
      servicios.aplicar({ ...nginx, id, nombre, ...(categoria ? { categoria } : {}) });
    s('ollama', 'Ollama', 'ia');
    s('ftp', 'FTP', 'herramienta');
    s('mailpit', 'Mailpit', 'herramienta');
    s('redis', 'Redis', 'bd');
    s('mysql', 'MySQL', 'bd');

    expect(servicios.grupos.map((g) => [g.categoria, g.servicios.map((x) => x.id)])).toEqual([
      ['web', ['nginx']],
      ['php', ['php-8.4']],
      ['bd', ['mysql', 'redis']],
      ['correo', ['mailpit']],
      ['ia', ['ollama']],
      ['herramientas', ['ftp']],
    ]);
    // Sin categoría (núcleo viejo) se deduce por el id.
    expect(categoriaDe({ id: 'php-8.3' })).toBe('php');
    expect(categoriaDe({ id: 'nginx' })).toBe('web');
  });

  it('un grupo sin servicios no aparece', async () => {
    await iniciarEntorno();
    expect(useServicios().grupos.map((g) => g.categoria)).toEqual(['web', 'php']);
  });

  it('lee el puerto alternativo del conflicto que el núcleo pone en mensaje', async () => {
    expect(
      puertoAlternativo('El puerto 3306 lo usa mysqld.exe (PID 42). Use el puerto 3308.'),
    ).toBe(3308);
    expect(puertoAlternativo('El puerto 5432 lo usa postgres.exe (PID 7).')).toBeNull();
    expect(puertoAlternativo(undefined)).toBeNull();
    expect(puertoAlternativo('Use el puerto 80.')).toBeNull();

    await iniciarEntorno();
    const servicios = useServicios();
    falsa.emitir('servicio:estado', {
      id: 'mysql',
      nombre: 'MySQL',
      categoria: 'bd',
      version: '8.4.7',
      estado: 'apagado',
      puertos: [3306],
      pid: null,
      mensaje: 'El puerto 3306 lo usa mysqld.exe (PID 42). Use el puerto 3308.',
    });
    expect(puertoAlternativo(servicios.porId['mysql']?.mensaje)).toBe(3308);
  });

  it('ignora el progreso de las Build Tools (es de pgvector, no de Servicios)', async () => {
    await iniciarEntorno();
    const servicios = useServicios();
    falsa.emitir('instalacion:progreso', {
      servicio: 'buildtools',
      version: '17',
      fase: 'listo',
      porcentaje: 100,
    });
    expect(servicios.progresoDe('buildtools')).toHaveLength(0);
    expect(servicios.progreso).toEqual({});
    expect(falsa.api.instalador.instalados).not.toHaveBeenCalledWith('buildtools');
  });

  it('autoIniciar se lee de la configuración y se cambia por IPC (y vuelve atrás si falla)', async () => {
    const servicios = useServicios();
    await servicios.cargarPreferencias();
    expect(servicios.autoIniciar?.mysql).toBe(true);
    expect(servicios.autoIniciar?.postgresql).toBe(false);
    expect(servicios.redLocalFtp).toBe(false);

    await servicios.cambiarAutoIniciar('postgresql', true);
    expect(falsa.api.servicios.autoIniciar).toHaveBeenCalledWith('postgresql', true);
    expect(servicios.autoIniciar?.postgresql).toBe(true);

    falsa.api.servicios.autoIniciar.mockRejectedValueOnce(new Error('no'));
    await expect(servicios.cambiarAutoIniciar('mysql', false)).rejects.toThrow('no');
    expect(servicios.autoIniciar?.mysql).toBe(true);

    await servicios.cambiarRedLocal(true);
    expect(falsa.api.ftp.redLocal).toHaveBeenCalledWith(true);
    expect(servicios.redLocalFtp).toBe(true);
  });
  it('con solo una base de datos instalada no se muestra "nada instalado" (sin Nginx ni PHP)', async () => {
    const servicios = useServicios();
    servicios.instalados['nginx'] = [];
    servicios.instalados['php'] = [];
    servicios.hidratar([
      nginx,
      { ...nginx, id: 'ftp', nombre: 'FTP', categoria: 'herramienta', puertos: [2121] },
      { ...nginx, id: 'mysql', nombre: 'MySQL', categoria: 'bd', puertos: [3306] },
    ]);
    expect(servicios.nadaInstalado).toBe(false);
    // Nginx sin instalar y apagado no se muestra; MySQL y el FTP integrado sí.
    expect(servicios.visibles.map((s) => s.id)).toEqual(['ftp', 'mysql']);
    expect(servicios.grupos.map((g) => g.categoria)).toEqual(['bd', 'herramientas']);
  });

  it('"nada instalado" ignora los externos y el FTP integrado', async () => {
    const servicios = useServicios();
    servicios.instalados['nginx'] = [];
    servicios.instalados['php'] = [];
    servicios.hidratar([
      nginx,
      { ...nginx, id: 'ftp', nombre: 'FTP', categoria: 'herramienta', puertos: [2121] },
      {
        ...nginx,
        id: 'postgresql',
        nombre: 'PostgreSQL (externo)',
        categoria: 'bd',
        estado: 'externo',
        puertos: [5432],
      },
    ]);
    expect(servicios.nadaInstalado).toBe(true);
    expect(servicios.visibles.map((s) => s.id)).toEqual(['ftp', 'postgresql']);

    // Mientras no se sabe qué hay instalado no se afirma que no hay nada.
    servicios.instalados = {};
    expect(servicios.nadaInstalado).toBe(false);
    expect(servicios.visibles.map((s) => s.id)).toContain('nginx');

    // Con Nginx instalado deja de estar vacío.
    servicios.instalados['nginx'] = ['1.28.0'];
    expect(servicios.nadaInstalado).toBe(false);
  });
  it('una sola fuente de "instalado": Servicios, Inicio y la pastilla cuentan lo mismo (D54a)', async () => {
    const servicios = useServicios();
    servicios.instalados['nginx'] = [];
    servicios.instalados['php'] = [];
    servicios.hidratar([
      nginx,
      { ...nginx, id: 'ftp', nombre: 'FTP', categoria: 'herramienta', puertos: [2121] },
      {
        ...nginx,
        id: 'mysql',
        nombre: 'MySQL (externo)',
        categoria: 'bd',
        estado: 'externo',
        puertos: [3306],
      },
      // Un proceso de proyecto llega por el mismo evento, pero no es un servicio de la lista.
      { ...nginx, id: 'proy-a-web', nombre: 'web', categoria: 'proyecto', estado: 'encendido' },
    ]);
    // Nginx sin instalar y apagado no cuenta; el proceso de proyecto tampoco.
    expect(servicios.visibles.map((s) => s.id)).toEqual(['ftp', 'mysql']);
    expect(servicios.resumen.total).toBe(servicios.visibles.length);
    expect(servicios.resumen.encendidos).toBe(0);
    expect(servicios.encendidos).toBe(servicios.resumen.encendidos);
    expect(servicios.resumen.externos).toBe(1);
    // Los externos van en su franja y no en los grupos de tarjetas.
    expect(servicios.externos.map((s) => s.id)).toEqual(['mysql']);
    expect(servicios.grupos.flatMap((g) => g.servicios.map((s) => s.id))).toEqual(['ftp']);
    // Nada propio que arrancar: "Iniciar todo" queda desactivado.
    expect(servicios.porArrancar).toEqual([]);

    // Un servicio con error y otro encendido se cuentan igual en todas partes.
    servicios.aplicar({ ...nginx, estado: 'encendido' });
    servicios.aplicar({ ...nginx, id: 'redis', nombre: 'Redis', categoria: 'bd', estado: 'error' });
    expect(servicios.resumen).toMatchObject({ total: 4, encendidos: 1, conError: 1 });
    expect(servicios.porArrancar.map((s) => s.id)).toEqual(['redis']);
  });
});
