import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { RUTAS_IPC } from '../src/shared/api';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Resultado = { ok: boolean; valor?: unknown; error?: { codigo?: string } };

const HUELLA = 'a'.repeat(64);
const carpetas: string[] = [];
afterEach(() => {
  for (const c of carpetas.splice(0)) rmSync(c, { recursive: true, force: true });
});

function montar() {
  const carpeta = mkdtempSync(path.join(tmpdir(), 'pel-as-ipc-'));
  carpetas.push(carpeta);
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const asistentes = {
    estado: vi.fn(async () => []),
    vistaPrevia: vi.fn(async () => ({ huella: HUELLA })),
    aplicar: vi.fn(async () => ({ respaldo: null, cambiado: true })),
    configuracion: vi.fn(async () => '{"mcpServers":{}}'),
    carpetaConfig: vi.fn(async () => carpeta),
  };
  const sistema = {
    elegirCarpeta: vi.fn(),
    elegirArchivo: vi.fn(),
    abrirUrl: vi.fn(),
    abrirGrabadora: vi.fn(),
    abrirCarpeta: vi.fn(),
    copiar: vi.fn(),
    version: vi.fn(),
    guardarArchivo: vi.fn(),
    elegirArchivos: vi.fn(),
  };
  registrarIpc(
    { eventos: { on: () => () => undefined }, asistentes } as unknown as NucleoIpc,
    ipcMain,
    { isDestroyed: () => false, webContents: { send: () => undefined } },
    sistema,
    () => true,
  );
  const llamar = async (ruta: string, ...a: unknown[]) =>
    (await canales.get(`entorno:${ruta}`)!({}, ...a)) as Resultado;
  return { asistentes, sistema, carpeta, llamar };
}

describe('IPC de «Conectar asistentes»', () => {
  it('las rutas existen', () => {
    for (const r of [
      'asistentes.estado',
      'asistentes.vistaPrevia',
      'asistentes.aplicar',
      'asistentes.copiarConfiguracion',
      'asistentes.abrirCarpeta',
    ]) {
      expect(RUTAS_IPC).toContain(r);
    }
  });

  it('rechaza ids, acciones, huellas y confirmaciones inválidas sin llamar al núcleo', async () => {
    const { asistentes, llamar } = montar();
    const casos: [string, unknown[], string][] = [
      ['asistentes.vistaPrevia', ['../cursor', 'conectar'], 'asistentes.no_existe'],
      ['asistentes.vistaPrevia', ['C:/Users/x/.cursor', 'conectar'], 'asistentes.no_existe'],
      ['asistentes.vistaPrevia', [7, 'conectar'], 'asistentes.no_existe'],
      ['asistentes.aplicar', ['cursor', 'conectar', HUELLA, false], 'agentes.sin_confirmar'],
      ['asistentes.aplicar', ['cursor', 'conectar', HUELLA, 'true'], 'agentes.sin_confirmar'],
      ['asistentes.aplicar', ['cursor', 'conectar', HUELLA], 'agentes.sin_confirmar'],
      ['asistentes.copiarConfiguracion', ['otro'], 'asistentes.no_existe'],
      ['asistentes.abrirCarpeta', ['C:/Windows'], 'asistentes.no_existe'],
    ];
    for (const [ruta, args, codigo] of casos) {
      const r = await llamar(ruta, ...args);
      expect(r.ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
      expect(r.error?.codigo, `${ruta} ${JSON.stringify(args)}`).toBe(codigo);
    }
    for (const accion of ['x', undefined, 'quitar ']) {
      expect((await llamar('asistentes.vistaPrevia', 'cursor', accion)).ok).toBe(false);
    }
    for (const huella of ['abc', 'A'.repeat(64), 7, '../'.repeat(30)]) {
      expect((await llamar('asistentes.aplicar', 'cursor', 'conectar', huella, true)).ok).toBe(
        false,
      );
    }
    for (const [nombre, m] of Object.entries(asistentes)) expect(m, nombre).not.toHaveBeenCalled();
  });

  it('pasa al núcleo solo ids, acción, huella y la confirmación exacta', async () => {
    const { asistentes, llamar } = montar();
    expect((await llamar('asistentes.vistaPrevia', 'cursor', 'quitar')).ok).toBe(true);
    expect(asistentes.vistaPrevia).toHaveBeenCalledWith('cursor', 'quitar');
    expect((await llamar('asistentes.aplicar', 'codex', 'conectar', HUELLA, true)).ok).toBe(true);
    expect(asistentes.aplicar).toHaveBeenCalledWith('codex', 'conectar', HUELLA, true);
  });

  it('copiar manda el fragmento al portapapeles desde el proceso principal', async () => {
    const { sistema, llamar } = montar();
    expect((await llamar('asistentes.copiarConfiguracion', 'cursor')).ok).toBe(true);
    expect(sistema.copiar).toHaveBeenCalledWith('{"mcpServers":{}}');
  });

  it('abrir carpeta usa la ruta de la lista blanca del núcleo, no una del renderer', async () => {
    const { sistema, carpeta, llamar } = montar();
    expect((await llamar('asistentes.abrirCarpeta', 'cursor', 'C:/otra')).ok).toBe(true);
    expect(sistema.abrirCarpeta).toHaveBeenCalledTimes(1);
    expect(path.resolve(sistema.abrirCarpeta.mock.calls[0]![0] as string)).toBe(
      path.resolve(carpeta),
    );
  });
});
