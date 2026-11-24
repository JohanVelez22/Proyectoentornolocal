import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TablaVersiones } from '../src/shared/api';
import {
  alternativaVerificada,
  argsDeAviso,
  conInterruptor,
  filasDe,
  marcarEncendida,
  marcarPredeterminada,
  origenCatalogo,
  useVersiones,
  type FilaVersion,
} from '../src/renderer/stores/versiones';

const fila = (version: string, o: Partial<FilaVersion> = {}): FilaVersion => ({
  version,
  instalada: false,
  encendida: false,
  actualizacion: null,
  predeterminada: false,
  huella: 'fuerte',
  instancia: null,
  puerto: null,
  bloqueada: false,
  ...o,
});

function tablaMysql(): TablaVersiones {
  return {
    servicio: 'mysql',
    origen: 'cache',
    fecha: '2026-11-23T07:00:00.000Z',
    interruptor: 'instancias',
    ramas: [
      {
        rama: '8.4',
        soporte: 'lts',
        finSoporte: '2032-04-30',
        versiones: [
          fila('8.4.15', { huella: 'ninguna' }),
          fila('8.4.14'),
          fila('8.4.13', {
            instalada: true,
            encendida: true,
            actualizacion: '8.4.15',
            predeterminada: true,
            instancia: 'mysql@8.4',
            puerto: 3306,
          }),
        ],
      },
      {
        rama: '8.0',
        soporte: 'fin',
        finSoporte: '2026-04-30',
        versiones: [fila('8.0.46', { instalada: true })],
      },
    ],
    instancias: [
      {
        id: 'mysql@8.4',
        servicio: 'mysql',
        clave: '8.4',
        version: '8.4.13',
        puerto: 3306,
        estado: 'encendido',
        pid: 1,
        predeterminada: true,
        autoIniciar: false,
        tieneDatos: true,
        bloqueo: null,
      },
    ],
  };
}

function tablaNginx(): TablaVersiones {
  return {
    servicio: 'nginx',
    origen: 'vivo',
    fecha: null,
    interruptor: 'unica',
    ramas: [
      {
        rama: '1.30',
        soporte: 'lts',
        finSoporte: null,
        versiones: [
          fila('1.30.8', { instalada: true }),
          fila('1.30.6', { instalada: true, encendida: true, predeterminada: true }),
        ],
      },
    ],
    instancias: [],
  };
}

function apiFalsa(tabla: () => TablaVersiones) {
  const api = {
    catalogo: { versiones: vi.fn(async () => tabla()), silenciar: vi.fn() },
    instalador: {
      instalar: vi.fn(async () => undefined),
      desinstalar: vi.fn(async () => undefined),
    },
    instancias: {
      lista: vi.fn(),
      crear: vi.fn(async (s: string, v: string) => `${s}@${v.split('.').slice(0, 2).join('.')}`),
      iniciar: vi.fn(async () => undefined),
      detener: vi.fn(async () => undefined),
      puerto: vi.fn(async () => undefined),
      predeterminar: vi.fn(async () => undefined),
      quitar: vi.fn(async () => undefined),
      borrarDatos: vi.fn(async () => undefined),
      desbloquear: vi.fn(async () => undefined),
    },
    servicios: {
      iniciar: vi.fn(async () => undefined),
      detener: vi.fn(async () => undefined),
      predeterminada: vi.fn(async () => undefined),
      actualizar: vi.fn(async () => ({ anterior: '', respaldo: { carpeta: '', volcados: [] } })),
      nuevaRama: vi.fn(async () => ({
        id: 'mysql@9.1',
        restauradas: [],
        fallidas: [],
        advertencias: [],
      })),
      planActualizar: vi.fn(async () => ({
        id: 'mysql@8.4',
        version: '8.4.13',
        carpeta: 'C:/d/data/mysql/8.4',
        respaldo: 'C:/d/data/mysql/8.4.respaldo-x',
        hayDatos: true,
        bytes: 1024,
        archivos: 3,
        libres: 10 * 1024 ** 3,
        necesarios: 1024 + 256 * 1024 ** 2,
        volcados: true,
      })),
      respaldosDatos: vi.fn(async () => []),
      borrarRespaldoDatos: vi.fn(async () => undefined),
    },
  };
  (globalThis as unknown as { window: unknown }).window = { entorno: api };
  return api;
}

beforeEach(() => setActivePinia(createPinia()));
afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('tabla de versiones (funciones puras)', () => {
  it('agrupa por rama y marca una sola predeterminada', () => {
    const t = tablaMysql();
    expect(t.ramas.map((r) => r.rama)).toEqual(['8.4', '8.0']);
    expect(filasDe(t).map((f) => f.version)).toEqual(['8.4.15', '8.4.14', '8.4.13', '8.0.46']);
    const otra = marcarPredeterminada(t, '8.0.46');
    expect(
      filasDe(otra)
        .filter((f) => f.predeterminada)
        .map((f) => f.version),
    ).toEqual(['8.0.46']);
  });

  it('Nginx: una sola encendida; runtimes sin interruptor', () => {
    const t = marcarEncendida(tablaNginx(), '1.30.8', true);
    expect(
      filasDe(t)
        .filter((f) => f.encendida)
        .map((f) => f.version),
    ).toEqual(['1.30.8']);
    const node: TablaVersiones = { ...tablaNginx(), servicio: 'node', interruptor: 'ninguno' };
    expect(filasDe(node).some((f) => conInterruptor(node, f))).toBe(false);
    expect(marcarEncendida(node, '1.30.8', true)).toBe(node);
  });

  it('servicios de datos: interruptor en la versión de la instancia o en una rama sin instancia', () => {
    const t = tablaMysql();
    const f = (v: string) => filasDe(t).find((x) => x.version === v)!;
    expect(conInterruptor(t, f('8.4.13'))).toBe(true);
    expect(conInterruptor(t, f('8.0.46'))).toBe(true); // rama sin instancia: crea y enciende
    expect(conInterruptor(t, f('8.4.15'))).toBe(false); // no instalada
    // Otras versiones de varias encendidas a la vez: no se apagan entre sí.
    const dos = marcarEncendida(t, '8.0.46', true);
    expect(filasDe(dos).filter((x) => x.encendida)).toHaveLength(2);
  });

  it('origen: en línea, caché de hace N horas o lista sin conexión', () => {
    const ahora = Date.parse('2026-11-23T10:30:00.000Z');
    expect(origenCatalogo(tablaMysql(), ahora)).toEqual({ tipo: 'cache', horas: 3 });
    expect(origenCatalogo({ origen: 'fija', fecha: null })).toEqual({ tipo: 'fija', horas: 0 });
  });

  it('alternativa verificada de la misma rama para una versión sin huella', () => {
    expect(alternativaVerificada(tablaMysql(), '8.4.15')).toBe('8.4.14');
  });

  it('acción de un aviso: solo servicio, versión e instancia bien formados', () => {
    expect(
      argsDeAviso([
        { servicio: 'mysql', version: '8.4.15', instancia: 'mysql@8.4', actualizar: true },
      ]),
    ).toEqual({ servicio: 'mysql', version: '8.4.15', instancia: 'mysql@8.4', actualizar: true });
    expect(argsDeAviso([{ servicio: 'x', version: '1' }])).toBeNull();
    expect(argsDeAviso([{ servicio: 'mysql', version: '../1' }])).toBeNull();
    expect(argsDeAviso(null)).toBeNull();
  });
});

describe('store de versiones', () => {
  it('clic en "Actualizar" de un aviso abre el diálogo y no llama a servicios.actualizar', async () => {
    const api = apiFalsa(tablaMysql);
    const v = useVersiones();
    await v.abrirDesdeAviso({
      servicio: 'mysql',
      version: '8.4.15',
      instancia: 'mysql@8.4',
      actualizar: true,
    });
    expect(v.servicio).toBe('mysql');
    expect(v.dialogo).toMatchObject({
      tipo: 'actualizar',
      instancia: 'mysql@8.4',
      actual: '8.4.13',
      nueva: '8.4.15',
      sinHuella: true,
      plan: { volcados: true },
    });
    expect(api.servicios.actualizar).not.toHaveBeenCalled();
    expect(api.instalador.instalar).not.toHaveBeenCalled();
    // Sin huella, confirmar sin la casilla no actualiza.
    await expect(v.confirmarActualizar(false)).rejects.toThrow();
    expect(api.servicios.actualizar).not.toHaveBeenCalled();
    await v.confirmarActualizar(true);
    expect(api.servicios.actualizar).toHaveBeenCalledWith('mysql@8.4', '8.4.15', {
      confirmarSinHuella: true,
    });
  });

  it('un aviso sin atajo (sin huella fuerte) solo abre la pestaña', async () => {
    const api = apiFalsa(tablaMysql);
    const v = useVersiones();
    await v.abrirDesdeAviso({
      servicio: 'mysql',
      version: '8.4.15',
      instancia: 'mysql@8.4',
      actualizar: false,
    });
    expect(v.dialogo).toBeNull();
    expect(v.resaltada).toBe('8.4.15');
    expect(api.servicios.planActualizar).not.toHaveBeenCalled();
  });

  it('instalar sin huella pasa por el diálogo; solo él confirma', async () => {
    const api = apiFalsa(tablaMysql);
    const v = useVersiones();
    v.elegirServicio('mysql');
    await v.cargar();
    await v.pedirInstalar('8.4.15');
    expect(v.dialogo).toMatchObject({
      tipo: 'sinHuella',
      version: '8.4.15',
      alternativa: '8.4.14',
    });
    expect(api.instalador.instalar).not.toHaveBeenCalled();
    await v.instalar('8.4.15', true);
    expect(api.instalador.instalar).toHaveBeenCalledWith({
      servicio: 'mysql',
      version: '8.4.15',
      confirmarSinHuella: true,
    });
    await v.pedirInstalar('8.4.14');
    expect(api.instalador.instalar).toHaveBeenLastCalledWith({
      servicio: 'mysql',
      version: '8.4.14',
    });
  });

  it('desinstalar nunca llama a borrarDatos', async () => {
    const api = apiFalsa(tablaMysql);
    const v = useVersiones();
    v.elegirServicio('mysql');
    await v.cargar();
    await v.desinstalar(v.filas.find((f) => f.version === '8.0.46')!);
    await v.desinstalar(v.filas.find((f) => f.version === '8.4.13')!);
    expect(api.instalador.desinstalar).toHaveBeenCalledTimes(2);
    expect(api.instancias.quitar).toHaveBeenCalledWith('mysql@8.4');
    expect(api.instancias.borrarDatos).not.toHaveBeenCalled();
  });

  it('Nginx: encender otra versión la deja activa (predeterminada) y apaga las demás', async () => {
    const api = apiFalsa(tablaNginx);
    const v = useVersiones();
    v.elegirServicio('nginx');
    await v.cargar();
    api.catalogo.versiones.mockImplementation(async () => v.tabla!);
    await v.encender('1.30.8', true);
    expect(api.servicios.predeterminada).toHaveBeenCalledWith('nginx', '1.30.8');
    expect(api.servicios.iniciar).toHaveBeenCalledWith('nginx');
    expect(v.filas.filter((f) => f.encendida).map((f) => f.version)).toEqual(['1.30.8']);
    expect(v.filas.filter((f) => f.predeterminada).map((f) => f.version)).toEqual(['1.30.8']);
  });

  it('una rama sin instancia se enciende creando su instancia', async () => {
    const api = apiFalsa(tablaMysql);
    const v = useVersiones();
    v.elegirServicio('mysql');
    await v.cargar();
    await v.encender('8.0.46', true);
    expect(api.instancias.crear).toHaveBeenCalledWith('mysql', '8.0.46');
    expect(api.instancias.iniciar).toHaveBeenCalledWith('mysql@8.0');
  });

  it('predeterminada única: datos por instancia, el resto por versión', async () => {
    const api = apiFalsa(tablaNginx);
    const v = useVersiones();
    v.elegirServicio('nginx');
    await v.cargar();
    await v.predeterminar('1.30.8');
    expect(api.servicios.predeterminada).toHaveBeenCalledWith('nginx', '1.30.8');
    expect(v.filas.filter((f) => f.predeterminada)).toHaveLength(1);
  });
});
