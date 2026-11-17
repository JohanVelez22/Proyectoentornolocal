import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
import { CANAL_EVENTO, RUTAS_IPC } from '../src/shared/api';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function ipcFalso() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = {
    handle: (canal, fn) => void canales.set(canal, fn as Manejador),
  };
  return { ipcMain, canales };
}

function nucleoFalso() {
  const oyentes = new Map<string, (d: unknown) => void>();
  const crudo = {
    eventos: {
      on: (nombre: string, fn: (d: unknown) => void) => {
        oyentes.set(nombre, fn);
        return () => oyentes.delete(nombre);
      },
    },
    sitios: { listar: vi.fn(async () => [{ id: 's1' }]), aplicar: vi.fn() },
    servicios: { estados: vi.fn(), iniciar: vi.fn(), detener: vi.fn() },
    tuneles: { abrir: vi.fn(), cerrar: vi.fn(), renovar: vi.fn(), estados: vi.fn() },
    instalador: { instalar: vi.fn(), instalados: vi.fn() },
    hosts: { sincronizar: vi.fn(async () => ({ ok: true })) },
    config: { leer: vi.fn(), guardar: vi.fn() },
    estadoGeneral: vi.fn(),
    guardarSitio: vi.fn(),
    borrarSitio: vi.fn(),
    detectarProyecto: vi.fn(),
    listarVersiones: vi.fn(),
  };
  return { nucleo: crudo as unknown as NucleoIpc, crudo, oyentes };
}

const sistema = {
  elegirCarpeta: vi.fn(),
  abrirUrl: vi.fn(),
  abrirCarpeta: vi.fn(),
  copiar: vi.fn(),
  version: vi.fn(async () => '1.2.3'),
};

function ventanaFalsa(destruida = false) {
  const enviados: unknown[][] = [];
  const ventana: VentanaLike = {
    isDestroyed: () => destruida,
    webContents: { send: (...a: unknown[]) => void enviados.push(a) },
  };
  return { ventana, enviados };
}

describe('registrarIpc', () => {
  it('una llamada permitida devuelve {ok:true, valor}', async () => {
    const { ipcMain, canales } = ipcFalso();
    registrarIpc(nucleoFalso().nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const r = await canales.get('entorno:sitios.listar')!({});
    expect(r).toEqual({ ok: true, valor: [{ id: 's1' }] });
  });

  it('un error del núcleo llega como {ok:false, error:{mensaje}} sin traza', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    crudo.sitios.listar.mockRejectedValueOnce(Object.assign(new Error('fallo'), { codigo: 'X' }));
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const r = await canales.get('entorno:sitios.listar')!({});
    expect(r).toEqual({ ok: false, error: { mensaje: 'fallo', codigo: 'X' } });
    expect(JSON.stringify(r)).not.toContain('stack');
  });

  it('un error síncrono también se serializa', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    crudo.estadoGeneral.mockImplementationOnce(() => {
      throw new Error('síncrono');
    });
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    expect(await canales.get('entorno:estadoGeneral')!({})).toEqual({
      ok: false,
      error: { mensaje: 'síncrono' },
    });
  });

  it('solo registra los canales de la lista blanca', () => {
    const { ipcMain, canales } = ipcFalso();
    registrarIpc(nucleoFalso().nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    expect([...canales.keys()].sort()).toEqual(RUTAS_IPC.map((r) => `entorno:${r}`).sort());
    expect(canales.has('entorno:constructor')).toBe(false);
    expect(canales.has('entorno:sitios.crear')).toBe(false);
  });

  it('hosts.sincronizar usa todos los dominios de los sitios', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    crudo.sitios.listar.mockResolvedValueOnce([
      { dominio: 'a.test', alias: ['b.test'] },
      { dominio: 'c.test', alias: [] },
    ] as never);
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    await canales.get('entorno:hosts.sincronizar')!({});
    expect(crudo.hosts.sincronizar).toHaveBeenCalledWith(['a.test', 'b.test', 'c.test']);
  });

  it('pasa los argumentos al método del núcleo', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    await canales.get('entorno:servicios.iniciar')!({}, 'nginx');
    expect(crudo.servicios.iniciar).toHaveBeenCalledWith('nginx');
  });

  it('reenvía los eventos del núcleo a la ventana', () => {
    const { ipcMain } = ipcFalso();
    const { nucleo, oyentes } = nucleoFalso();
    const { ventana, enviados } = ventanaFalsa();
    registrarIpc(nucleo, ipcMain, ventana, sistema);
    oyentes.get('servicio:estado')!({ id: 'nginx' });
    expect(enviados).toEqual([
      [CANAL_EVENTO, { nombre: 'servicio:estado', dato: { id: 'nginx' } }],
    ]);
    expect([...oyentes.keys()].sort()).toEqual([
      'hosts:estado',
      'instalacion:progreso',
      'servicio:estado',
      'sitio:cambio',
      'tunel:estado',
    ]);
  });

  it('no envía a una ventana destruida', () => {
    const { ipcMain } = ipcFalso();
    const { nucleo, oyentes } = nucleoFalso();
    const { ventana, enviados } = ventanaFalsa(true);
    registrarIpc(nucleo, ipcMain, ventana, sistema);
    oyentes.get('tunel:estado')!({});
    expect(enviados).toEqual([]);
  });

  it('valida los argumentos en la frontera', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    for (const [ruta, args] of [
      ['servicios.iniciar', [42]],
      ['servicios.iniciar', ['']],
      ['sitios.guardar', ['no-objeto']],
      ['tuneles.abrir', [{}]],
      ['detectarProyecto', [null]],
      ['sistema.abrirUrl', ['file:///c:/a.exe']],
      ['sistema.abrirCarpeta', [123]],
    ] as [string, unknown[]][]) {
      const r = (await canales.get(`entorno:${ruta}`)!({}, ...args)) as { ok: boolean };
      expect(r.ok, ruta).toBe(false);
    }
    expect(crudo.servicios.iniciar).not.toHaveBeenCalled();
    expect(sistema.abrirUrl).not.toHaveBeenCalled();
    expect(sistema.abrirCarpeta).not.toHaveBeenCalled();
  });

  it('rechaza emisores que no son la ventana principal', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema, (e) => e === 'bueno');
    expect(await canales.get('entorno:estadoGeneral')!('malo')).toEqual({
      ok: false,
      error: { mensaje: 'Origen no permitido' },
    });
    expect(crudo.estadoGeneral).not.toHaveBeenCalled();
    await canales.get('entorno:estadoGeneral')!('bueno');
    expect(crudo.estadoGeneral).toHaveBeenCalled();
  });
});
