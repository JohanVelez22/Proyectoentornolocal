import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  registrarIpc,
  SeguimientosContenedores,
  type IpcMainLike,
  type NucleoIpc,
} from '../src/main/ipc';
import type { Contenedor, EstadoMotor, LineasContenedor } from '../src/shared/api';
import { EVENTOS_IPC, RUTAS_IPC } from '../src/shared/api';
import { textoAviso } from '../src/shared/textosAvisos';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { SECCIONES_NAV } from '../src/renderer/navegacion';
import {
  INTERVALO_CONTENEDORES_MS,
  MAX_LINEAS_REGISTRO,
  useContenedores,
  type DocumentoVisible,
} from '../src/renderer/stores/contenedores';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Resultado = { ok: boolean; valor?: unknown; error?: { codigo?: string; mensaje?: string } };

const ID = 'a1b2c3d4e5f6';

function montarIpc() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const dejar = vi.fn();
  const nucleo = {
    eventos: { on: () => () => undefined },
    contenedores: {
      motores: vi.fn(async () => []),
      lista: vi.fn(async () => []),
      accion: vi.fn(async () => undefined),
      seguirLogs: vi.fn(async () => dejar),
    },
  };
  const desregistrar = registrarIpc(
    nucleo as unknown as NucleoIpc,
    ipcMain,
    { isDestroyed: () => false, webContents: { send: () => undefined } },
    {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(),
      guardarArchivo: vi.fn(),
      elegirArchivos: vi.fn(),
    },
    () => true,
  );
  const llamar = async (ruta: string, ...a: unknown[]) =>
    (await canales.get(`entorno:${ruta}`)!({}, ...a)) as Resultado;
  const llamarDesde = async (emisor: unknown, ruta: string, ...a: unknown[]) =>
    (await canales.get(`entorno:${ruta}`)!({ sender: emisor }, ...a)) as Resultado;
  return { nucleo, llamar, llamarDesde, canales, dejar, desregistrar };
}

describe('IPC de contenedores', () => {
  it('las rutas y el evento existen', () => {
    const { canales } = montarIpc();
    for (const r of [
      'contenedores.motores',
      'contenedores.lista',
      'contenedores.accion',
      'contenedores.seguir',
      'contenedores.dejar',
    ]) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
    expect(EVENTOS_IPC).toContain('contenedor:lineas');
  });

  it('rechaza motores, ids y acciones inválidos sin llamar al núcleo', async () => {
    const { nucleo, llamar } = montarIpc();
    for (const motor of ['lxc', '', null, 1, { m: 'docker' }]) {
      expect((await llamar('contenedores.lista', motor)).ok).toBe(false);
    }
    for (const id of ['-f', '--all', 'a b', 'a;b', '$(x)', '', 'x'.repeat(129), 7]) {
      expect((await llamar('contenedores.accion', 'docker', id, 'iniciar')).ok).toBe(false);
      expect((await llamar('contenedores.seguir', 'docker', id)).ok).toBe(false);
    }
    for (const accion of ['borrar', 'rm', 'eliminar', '', null]) {
      expect((await llamar('contenedores.accion', 'docker', ID, accion, true)).ok).toBe(false);
    }
    expect(nucleo.contenedores.lista).not.toHaveBeenCalled();
    expect(nucleo.contenedores.accion).not.toHaveBeenCalled();
    expect(nucleo.contenedores.seguirLogs).not.toHaveBeenCalled();
  });

  it('detener y reiniciar exigen confirmacion === true', async () => {
    const { nucleo, llamar } = montarIpc();
    for (const a of ['detener', 'reiniciar']) {
      for (const conf of [undefined, false, 'true', 1, {}]) {
        const r = await llamar('contenedores.accion', 'docker', ID, a, conf);
        expect(r.ok).toBe(false);
      }
      const sin = await llamar('contenedores.accion', 'docker', ID, a);
      expect(sin.error?.codigo).toBe('contenedores.sin_confirmar');
    }
    expect(nucleo.contenedores.accion).not.toHaveBeenCalled();
    expect((await llamar('contenedores.accion', 'podman', ID, 'detener', true)).ok).toBe(true);
    expect(nucleo.contenedores.accion).toHaveBeenCalledWith('podman', ID, 'detener');
  });

  it('iniciar no necesita confirmación (pero no acepta otro valor que true)', async () => {
    const { nucleo, llamar } = montarIpc();
    expect((await llamar('contenedores.accion', 'docker', ID, 'iniciar')).ok).toBe(true);
    expect((await llamar('contenedores.accion', 'docker', ID, 'iniciar', 'si')).ok).toBe(false);
    expect(nucleo.contenedores.accion).toHaveBeenCalledTimes(1);
  });

  it('los registros se sueltan al dejar, al destruirse la ventana y al cerrar el IPC', async () => {
    const { llamarDesde, dejar, desregistrar, nucleo } = montarIpc();
    const destruir: (() => void)[] = [];
    const emisor = { once: (_e: string, fn: () => void) => void destruir.push(fn) };
    expect((await llamarDesde(emisor, 'contenedores.seguir', 'docker', ID)).ok).toBe(true);
    // Repetir no lanza otro seguimiento.
    await llamarDesde(emisor, 'contenedores.seguir', 'docker', ID);
    expect(nucleo.contenedores.seguirLogs).toHaveBeenCalledTimes(1);
    await llamarDesde(emisor, 'contenedores.dejar', 'docker', ID);
    await Promise.resolve();
    expect(dejar).toHaveBeenCalledTimes(1);

    await llamarDesde(emisor, 'contenedores.seguir', 'docker', 'otro');
    destruir.forEach((f) => f());
    await Promise.resolve();
    expect(dejar).toHaveBeenCalledTimes(2);

    await llamarDesde({}, 'contenedores.seguir', 'podman', ID);
    desregistrar();
    await Promise.resolve();
    expect(dejar).toHaveBeenCalledTimes(3);
  });

  it('dos ventanas con el mismo registro: cada una suelta solo su referencia', async () => {
    const s = new SeguimientosContenedores();
    const sueltas: ReturnType<typeof vi.fn>[] = [];
    const n = {
      contenedores: {
        seguirLogs: vi.fn(async () => {
          const f = vi.fn();
          sueltas.push(f);
          return f;
        }),
      },
    } as unknown as NucleoIpc;
    const a = {};
    const b = {};
    await s.seguir(n, a, 'docker', ID);
    await s.seguir(n, b, 'docker', ID);
    s.dejar(a, 'docker', ID);
    await Promise.resolve();
    expect(sueltas[0]).toHaveBeenCalledTimes(1);
    expect(sueltas[1]).not.toHaveBeenCalled();
    expect(s.cuantos(b)).toBe(1);
  });

  it('un seguimiento que falla no queda registrado', async () => {
    const s = new SeguimientosContenedores();
    const n = {
      contenedores: { seguirLogs: vi.fn(async () => Promise.reject(new Error('no'))) },
    } as unknown as NucleoIpc;
    await expect(s.seguir(n, {}, 'docker', ID)).rejects.toThrow('no');
    expect(s.cuantos({})).toBe(0);
  });
});

describe('textos de contenedores', () => {
  it('la pantalla está en la barra lateral y la paleta, en los dos idiomas', () => {
    expect(SECCIONES_NAV).toContain('contenedores');
    expect(es.nav.contenedores).toBeTruthy();
    expect(en.nav.contenedores).toBeTruthy();
    expect(Object.keys(en.contenedores).sort()).toEqual(Object.keys(es.contenedores).sort());
  });

  it('el aviso de contenedor detenido usa el nombre y nunca una ruta', () => {
    const a = textoAviso('es', {
      tipo: 'contenedor-detenido',
      codigo: 'avisos.contenedor_detenido',
      datos: { nombre: 'tienda-db-1', motor: 'docker', codigoSalida: 137 },
    });
    expect(a.cuerpo).toContain('tienda-db-1');
    expect(a.cuerpo).toContain('137');
    const b = textoAviso('en', {
      tipo: 'contenedor-detenido',
      codigo: 'avisos.contenedor_detenido',
      datos: { nombre: 'C:\\secreto\\x', motor: 'docker' },
    });
    expect(b.cuerpo).not.toContain('secreto');
  });
});

/* ───────────── Store ───────────── */

const DOCKER: EstadoMotor = {
  motor: 'docker',
  ruta: 'C:/PF/docker.exe',
  origen: 'conocida',
  responde: true,
  version: '27.3.1',
  hostRemotoIgnorado: false,
};
const PODMAN: EstadoMotor = {
  motor: 'podman',
  ruta: null,
  origen: null,
  responde: false,
  version: null,
  hostRemotoIgnorado: false,
};
const C1: Contenedor = {
  id: ID,
  nombre: 'web',
  imagen: 'nginx',
  estado: 'corriendo',
  detalle: 'Up',
  puertos: [],
  proyectoCompose: null,
  codigoSalida: null,
};

function documentoFalso(visible = true) {
  const oyentes = new Set<() => void>();
  const doc: DocumentoVisible & { cambiar(v: boolean): void; oyentes: Set<() => void> } = {
    visibilityState: visible ? 'visible' : 'hidden',
    addEventListener: (_t, fn) => void oyentes.add(fn),
    removeEventListener: (_t, fn) => void oyentes.delete(fn),
    cambiar(v) {
      this.visibilityState = v ? 'visible' : 'hidden';
      oyentes.forEach((f) => f());
    },
    oyentes,
  };
  return doc;
}

function apiFalsa(motores: EstadoMotor[] = [DOCKER, PODMAN]) {
  const oyentes = new Map<string, (d: unknown) => void>();
  const api = {
    contenedores: {
      motores: vi.fn(async () => motores),
      lista: vi.fn(async () => [C1]),
      accion: vi.fn(async () => undefined),
      seguir: vi.fn(async () => undefined),
      dejar: vi.fn(async () => undefined),
    },
    on: vi.fn((nombre: string, fn: (d: unknown) => void) => {
      oyentes.set(nombre, fn);
      return () => oyentes.delete(nombre);
    }),
  };
  (globalThis as unknown as { window: { entorno: unknown } }).window = { entorno: api };
  return { api, oyentes };
}

describe('store de contenedores', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('elige el motor que responde y refresca cada 5 s solo con la pantalla visible', async () => {
    const { api } = apiFalsa();
    const t = useContenedores();
    const doc = documentoFalso(true);
    await t.entrar(doc);
    expect(t.motor).toBe('docker');
    expect(t.lista).toEqual([C1]);
    expect(api.contenedores.lista).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(INTERVALO_CONTENEDORES_MS);
    expect(api.contenedores.lista).toHaveBeenCalledTimes(2);
    doc.cambiar(false);
    await vi.advanceTimersByTimeAsync(INTERVALO_CONTENEDORES_MS * 3);
    expect(api.contenedores.lista).toHaveBeenCalledTimes(2);
    await t.salir();
    expect(doc.oyentes.size).toBe(0);
    await vi.advanceTimersByTimeAsync(INTERVALO_CONTENEDORES_MS * 3);
    expect(api.contenedores.lista).toHaveBeenCalledTimes(2);
  });

  it('sin motor: no pide listas; un motor caído no lanza en el refresco automático', async () => {
    const { api } = apiFalsa([{ ...PODMAN }, { ...PODMAN, motor: 'docker' }]);
    const t = useContenedores();
    await t.entrar(documentoFalso());
    expect(t.motor).toBeNull();
    expect(t.instalados).toEqual([]);
    expect(api.contenedores.lista).not.toHaveBeenCalled();
    await t.salir();

    setActivePinia(createPinia());
    const b = apiFalsa();
    b.api.contenedores.lista.mockRejectedValue(
      Object.assign(new Error('x'), { codigo: 'contenedores.no_responde' }),
    );
    const u = useContenedores();
    await u.entrar(documentoFalso());
    b.api.contenedores.motores.mockResolvedValue([{ ...DOCKER, responde: false }, PODMAN]);
    await vi.advanceTimersByTimeAsync(INTERVALO_CONTENEDORES_MS);
    expect(u.estadoMotor?.responde).toBe(false);
    expect(u.lista).toEqual([]);
    await u.salir();
  });

  it('detener pasa la confirmación del diálogo y refresca', async () => {
    const { api } = apiFalsa();
    const t = useContenedores();
    await t.entrar(documentoFalso());
    await t.accion(C1, 'detener', true);
    expect(api.contenedores.accion).toHaveBeenCalledWith('docker', ID, 'detener', true);
    expect(api.contenedores.lista).toHaveBeenCalledTimes(2);
    await t.salir();
  });

  it('registro: recibe solo las líneas de su contenedor, con tope, y lo suelta al salir', async () => {
    const { api, oyentes } = apiFalsa();
    const t = useContenedores();
    await t.entrar(documentoFalso());
    await t.abrirRegistro(C1);
    expect(api.contenedores.seguir).toHaveBeenCalledWith('docker', ID);
    const emitir = oyentes.get('contenedor:lineas')!;
    emitir({ motor: 'docker', id: 'otro', lineas: ['no'] } satisfies LineasContenedor);
    emitir({ motor: 'docker', id: ID, lineas: ['uno', 'dos'] } satisfies LineasContenedor);
    expect(t.registro?.lineas).toEqual(['uno', 'dos']);
    emitir({
      motor: 'docker',
      id: ID,
      lineas: Array.from({ length: MAX_LINEAS_REGISTRO }, (_, i) => `l${i}`),
      fin: true,
    } satisfies LineasContenedor);
    expect(t.registro?.lineas).toHaveLength(MAX_LINEAS_REGISTRO);
    expect(t.registro?.lineas.at(-1)).toBe(`l${MAX_LINEAS_REGISTRO - 1}`);
    expect(t.registro?.fin).toBe(true);
    await t.salir();
    expect(api.contenedores.dejar).toHaveBeenCalledWith('docker', ID);
    expect(t.registro).toBeNull();
    expect(oyentes.has('contenedor:lineas')).toBe(false);
  });
});
