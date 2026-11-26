import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDS_REVISION, type Hallazgo } from '@pel/core';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { programarDoctorAlIniciar } from '../src/main/doctorInicio';
import { RUTAS_IPC } from '../src/shared/api';
import { useDoctor } from '../src/renderer/stores/doctor';
import { textoAviso } from '../src/shared/textosAvisos';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

const hallazgo = (o: Partial<Hallazgo> & { id: string }): Hallazgo => ({
  revision: 'puertos',
  gravedad: 'error',
  codigo: 'doctor.puerto_iis',
  datos: { puerto: 80, servicio: 'nginx', programa: 'IIS' },
  evidencia: { codigo: 'puerto_dueno', datos: { puerto: 80, proceso: 'System', pid: 4 } },
  reparacion: {
    id: 'detener-w3svc',
    codigo: 'doctor.reparaciones.detener_iis',
    requiereAdmin: true,
    soloInforma: false,
  },
  ...o,
});

function montarIpc() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const nucleo = {
    eventos: { on: () => () => undefined },
    doctor: {
      revisar: vi.fn(async () => []),
      reparar: vi.fn(async () => ({ ok: true })),
      ultimo: vi.fn(() => []),
    },
    estadoConfianza: vi.fn(async () => ({})),
    cambiarNodeGlobal: vi.fn(async () => ({})),
    cambiarFirefoxConfianza: vi.fn(async () => []),
  };
  registrarIpc(
    nucleo as unknown as NucleoIpc,
    ipcMain,
    { isDestroyed: () => false, webContents: { send: () => undefined } },
    {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
      abrirGrabadora: vi.fn(),
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(),
      guardarArchivo: vi.fn(),
      elegirArchivos: vi.fn(),
    },
  );
  const llamar = (ruta: string, ...a: unknown[]) =>
    canales.get(`entorno:${ruta}`)!({}, ...a) as Promise<{ ok: boolean }>;
  return { nucleo, llamar };
}

describe('IPC del Doctor y de la confianza', () => {
  it('las rutas existen', () => {
    for (const r of [
      'doctor.revisar',
      'doctor.reparar',
      'doctor.ultimo',
      'confianza.estado',
      'confianza.nodeGlobal',
      'confianza.firefox',
    ]) {
      expect(RUTAS_IPC).toContain(r);
    }
  });

  it('revisar: solo ids de IDS_REVISION', async () => {
    const { nucleo, llamar } = montarIpc();
    expect(await llamar('doctor.revisar')).toMatchObject({ ok: true });
    expect(nucleo.doctor.revisar).toHaveBeenLastCalledWith(undefined);
    expect(await llamar('doctor.revisar', ['hosts', 'confianza'])).toMatchObject({ ok: true });
    expect(nucleo.doctor.revisar).toHaveBeenLastCalledWith(['hosts', 'confianza']);
    for (const malo of [
      ['registro'],
      'hosts',
      [1],
      new Array(IDS_REVISION.length + 1).fill('ca'),
    ]) {
      expect(await llamar('doctor.revisar', malo)).toMatchObject({ ok: false });
    }
    expect(nucleo.doctor.revisar).toHaveBeenCalledTimes(2);
  });

  it('reparar: exige confirmacion === true y solo la alternativa cambiar-puerto', async () => {
    const { nucleo, llamar } = montarIpc();
    for (const conf of [undefined, false, 'true', 1]) {
      expect(await llamar('doctor.reparar', 'puertos:80', conf)).toMatchObject({ ok: false });
    }
    expect(await llamar('doctor.reparar', 'puertos:80', true, 'detener-todo')).toMatchObject({
      ok: false,
    });
    expect(await llamar('doctor.reparar', 'x'.repeat(300), true)).toMatchObject({ ok: false });
    expect(nucleo.doctor.reparar).not.toHaveBeenCalled();
    expect(await llamar('doctor.reparar', 'puertos:80', true)).toMatchObject({ ok: true });
    expect(nucleo.doctor.reparar).toHaveBeenLastCalledWith('puertos:80', true, undefined);
    await llamar('doctor.reparar', 'puertos:80', true, 'cambiar-puerto');
    expect(nucleo.doctor.reparar).toHaveBeenLastCalledWith('puertos:80', true, 'cambiar-puerto');
  });

  it('reparar: la selección de reglas (D46) es una lista de textos acotados', async () => {
    const { nucleo, llamar } = montarIpc();
    for (const mala of ['{A-1}', [1], [''], ['x'.repeat(401)], new Array(201).fill('a'), {}]) {
      expect(await llamar('doctor.reparar', 'firewall:x', true, undefined, mala)).toMatchObject({
        ok: false,
      });
    }
    // Sin confirmación no pasa nada aunque lleve selección.
    expect(await llamar('doctor.reparar', 'firewall:x', false, undefined, ['a'])).toMatchObject({
      ok: false,
    });
    expect(nucleo.doctor.reparar).not.toHaveBeenCalled();
    await llamar('doctor.reparar', 'firewall:x', true, undefined, ['{A-1}', '{B-2}']);
    expect(nucleo.doctor.reparar).toHaveBeenLastCalledWith('firewall:x', true, undefined, [
      '{A-1}',
      '{B-2}',
    ]);
    await llamar('doctor.reparar', 'firewall:x', true, undefined, []);
    expect(nucleo.doctor.reparar).toHaveBeenLastCalledWith('firewall:x', true, undefined, []);
  });

  it('Node global y Firefox exigen confirmación explícita', async () => {
    const { nucleo, llamar } = montarIpc();
    expect(await llamar('confianza.nodeGlobal', true)).toMatchObject({ ok: false });
    expect(await llamar('confianza.firefox', true, false)).toMatchObject({ ok: false });
    expect(nucleo.cambiarNodeGlobal).not.toHaveBeenCalled();
    expect(nucleo.cambiarFirefoxConfianza).not.toHaveBeenCalled();
    expect(await llamar('confianza.nodeGlobal', true, true)).toMatchObject({ ok: true });
    expect(await llamar('confianza.firefox', false, true)).toMatchObject({ ok: true });
    expect(nucleo.cambiarNodeGlobal).toHaveBeenCalledWith(true);
    expect(nucleo.cambiarFirefoxConfianza).toHaveBeenCalledWith(false, false);
  });

  it('perfiles fuera de la carpeta de Firefox: solo con una segunda confirmación === true', async () => {
    const { nucleo, llamar } = montarIpc();
    for (const malo of [false, 'true', 1]) {
      expect(await llamar('confianza.firefox', true, true, malo)).toMatchObject({ ok: false });
    }
    expect(nucleo.cambiarFirefoxConfianza).not.toHaveBeenCalled();
    expect(await llamar('confianza.firefox', true, true, true)).toMatchObject({ ok: true });
    expect(nucleo.cambiarFirefoxConfianza).toHaveBeenLastCalledWith(true, true);
  });
});

describe('Doctor al iniciar', () => {
  afterEach(() => vi.useRealTimers());

  it('corre en segundo plano tras un retraso y un fallo no se propaga', async () => {
    vi.useFakeTimers();
    const revisar = vi.fn(async () => {
      throw new Error('roto');
    });
    const cancelar = programarDoctorAlIniciar({ doctor: { revisar } }, 5000);
    expect(revisar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    expect(revisar).toHaveBeenCalledTimes(1);
    cancelar();
  });

  it('cancelado antes de tiempo, no corre', async () => {
    vi.useFakeTimers();
    const revisar = vi.fn(async () => []);
    programarDoctorAlIniciar({ doctor: { revisar } }, 5000)();
    await vi.advanceTimersByTimeAsync(6000);
    expect(revisar).not.toHaveBeenCalled();
  });

  it('el aviso doctor.hallazgos tiene texto propio, sin evidencia ni rutas', () => {
    const a = {
      id: '1',
      nivel: 'error' as const,
      tipo: 'doctor' as const,
      codigo: 'doctor.hallazgos',
      datos: { fuente: 'doctor', errores: 2 },
      fecha: new Date().toISOString(),
      leido: false,
    };
    const t = textoAviso('es', a);
    expect(t.cuerpo).toContain('2');
    expect(textoAviso('en', a).cuerpo).toContain('2');
    expect(t.titulo).not.toBe(textoAviso('es', { ...a, codigo: 'otro' }).titulo);
  });
});

describe('store del Doctor', () => {
  let api: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let soltar: (v: unknown) => void;

  beforeEach(() => {
    setActivePinia(createPinia());
    api = {
      doctor: {
        ultimo: vi.fn(async () => [hallazgo({ id: 'puertos:80' })]),
        revisar: vi.fn(async () => [
          hallazgo({ id: 'puertos:80' }),
          hallazgo({ id: 'hosts:x', revision: 'hosts', gravedad: 'aviso' }),
          hallazgo({ id: 'antivirus:x', revision: 'antivirus', gravedad: 'info' }),
        ]),
        reparar: vi.fn(() => new Promise((r) => (soltar = r))),
      },
      confianza: {
        estado: vi.fn(async () => ({ caCreada: true })),
        nodeGlobal: vi.fn(async () => ({ caCreada: true, node: { global: true } })),
        firefox: vi.fn(async () => [{ perfil: 'a', ok: false, codigo: 'firefox.abierto' }]),
      },
    };
    (globalThis as unknown as { window: unknown }).window = { entorno: api };
  });

  it('revisar agrupa por gravedad (errores primero)', async () => {
    const d = useDoctor();
    await d.revisar();
    expect(d.porGravedad.map((g) => [g.gravedad, g.hallazgos.length])).toEqual([
      ['error', 1],
      ['aviso', 1],
      ['info', 1],
    ]);
    expect(d.revisando).toBe(false);
  });

  it('reparación: aplicando → hecha, y vuelve a leer el último resultado', async () => {
    const d = useDoctor();
    await d.cargar();
    const p = d.reparar('puertos:80', true);
    expect(d.reparaciones['puertos:80']).toEqual({ estado: 'aplicando' });
    // Un segundo pedido mientras corre no vuelve a llamar.
    void d.reparar('puertos:80', true);
    expect(api.doctor!.reparar).toHaveBeenCalledTimes(1);
    expect(api.doctor!.reparar).toHaveBeenCalledWith('puertos:80', true, undefined);
    soltar({ ok: true, aviso: 'doctor.ca_vieja_sin_quitar' });
    await p;
    expect(d.reparaciones['puertos:80']).toEqual({
      estado: 'hecha',
      aviso: 'doctor.ca_vieja_sin_quitar',
    });
    expect(api.doctor!.ultimo).toHaveBeenCalledTimes(2);
  });

  it('reparación fallida o con error de IPC queda con su código', async () => {
    const d = useDoctor();
    const p = d.reparar('puertos:80', true, 'cambiar-puerto');
    soltar({ ok: false, codigo: 'doctor.reparacion_cancelada' });
    await p;
    expect(d.reparaciones['puertos:80']).toEqual({
      estado: 'fallida',
      codigo: 'doctor.reparacion_cancelada',
    });
    api.doctor!.reparar!.mockRejectedValueOnce(
      Object.assign(new Error('x'), { codigo: 'doctor.hallazgo_desconocido' }),
    );
    await d.reparar('hosts:x', true);
    expect(d.reparaciones['hosts:x']).toEqual({
      estado: 'fallida',
      codigo: 'doctor.hallazgo_desconocido',
    });
  });

  it('confianza: estado, Node y Firefox (resultados por perfil)', async () => {
    const d = useDoctor();
    await d.cargarConfianza();
    expect(d.confianza).toEqual({ caCreada: true });
    await d.cambiarNode(true, true);
    expect(api.confianza!.nodeGlobal).toHaveBeenCalledWith(true, true);
    const r = await d.cambiarFirefox(true, true);
    expect(r).toEqual([{ perfil: 'a', ok: false, codigo: 'firefox.abierto' }]);
    expect(api.confianza!.firefox).toHaveBeenLastCalledWith(true, true, undefined);
    await d.cambiarFirefox(true, true, true);
    expect(api.confianza!.firefox).toHaveBeenLastCalledWith(true, true, true);
    expect(api.confianza!.estado).toHaveBeenCalledTimes(3);
  });
});

describe('textos del Doctor', () => {
  it('cada reparación del núcleo tiene texto en es y en', () => {
    const codigos = [
      'cambiar_puerto',
      'puerto_manual',
      'detener_iis',
      'regenerar_ca',
      'regenerar_certificados',
      'hosts_reescribir',
      'hosts_solo_lectura',
      'path_duplicados',
      'path_ajeno',
      'instalar_vcredist',
      'antivirus',
      'reintentar_servicio',
      'firefox_confianza',
    ];
    for (const c of codigos) {
      expect(es.doctor.reparaciones[c as keyof typeof es.doctor.reparaciones], c).toBeTruthy();
      expect(en.doctor.reparaciones[c as keyof typeof en.doctor.reparaciones], c).toBeTruthy();
    }
    for (const r of IDS_REVISION) {
      expect(es.doctor.revisiones[r], r).toBeTruthy();
      expect(en.doctor.revisiones[r], r).toBeTruthy();
    }
  });
});
