import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { URI_GRABACION_RECORTES, abrirGrabadora } from '../src/main/grabadora';
import { RUTAS_IPC } from '../src/shared/api';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

describe('Grabar pantalla: URI y apertura (D38a)', () => {
  it('el URI es el de Recortes en modo grabación que documenta Microsoft, sin datos del usuario', () => {
    const u = new URL(URI_GRABACION_RECORTES);
    expect(u.protocol).toBe('ms-screenclip:');
    expect(u.host).toBe('capture');
    expect(u.pathname).toBe('/video');
    expect([...u.searchParams.keys()].sort()).toEqual(['api-version', 'user-agent']);
    expect(u.searchParams.get('user-agent')).toBe('WolfCoreDev');
    // Nada de redirect-uri (solo sirve a una app empaquetada) ni de rutas o nombres de equipo.
    expect(URI_GRABACION_RECORTES).not.toMatch(/redirect|users|\\/i);
  });

  it('en Windows abre ese URI fijo y dice que se abrió', async () => {
    const abrir = vi.fn(async () => undefined);
    expect(await abrirGrabadora('win32', abrir)).toEqual({ abierta: true });
    expect(abrir).toHaveBeenCalledOnce();
    expect(abrir).toHaveBeenCalledWith(URI_GRABACION_RECORTES);
  });

  it('si Windows rechaza el URI no propaga el error: pide mostrar la guía', async () => {
    const abrir = vi.fn(async () => {
      throw new Error('sin aplicación asociada');
    });
    expect(await abrirGrabadora('win32', abrir)).toEqual({ abierta: false });
  });

  it('en macOS y Linux no abre nada: hay guía', async () => {
    for (const p of ['darwin', 'linux', 'freebsd']) {
      const abrir = vi.fn(async () => undefined);
      expect(await abrirGrabadora(p, abrir), p).toEqual({ abierta: false });
      expect(abrir).not.toHaveBeenCalled();
    }
  });
});

describe('Grabar pantalla: canal IPC', () => {
  function montar() {
    const canales = new Map<string, Manejador>();
    const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
    const abrirGrabadora = vi.fn(async () => ({ abierta: true }));
    const sistema = {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
      abrirGrabadora,
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(),
      guardarArchivo: vi.fn(),
      elegirArchivos: vi.fn(),
    };
    registrarIpc(
      { eventos: { on: () => () => undefined } } as unknown as NucleoIpc,
      ipcMain,
      { isDestroyed: () => false, webContents: { send: () => undefined } },
      sistema,
      () => true,
    );
    return { canales, abrirGrabadora };
  }

  it('el canal está en la lista blanca y en el preload', () => {
    expect(RUTAS_IPC).toContain('sistema.abrirGrabadora');
    const preload = readFileSync(path.join(__dirname, '..', 'src', 'preload', 'index.ts'), 'utf8');
    expect(preload).toContain("abrirGrabadora: () => invocar('sistema.abrirGrabadora')");
  });

  it('abre la grabadora sin aceptar ningún argumento de la ventana', async () => {
    const { canales, abrirGrabadora } = montar();
    const r = await canales.get('entorno:sistema.abrirGrabadora')!({}, 'ms-screenclip://otro', {
      uri: 'file:///c:/a.exe',
    });
    expect(r).toEqual({ ok: true, valor: { abierta: true } });
    expect(abrirGrabadora).toHaveBeenCalledOnce();
    expect(abrirGrabadora).toHaveBeenCalledWith();
  });
});
