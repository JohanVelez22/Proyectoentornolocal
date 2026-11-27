import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LaboratorioGit, Rutas } from '@pel/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';

// IPC del laboratorio de Git (D50): validado, solo para la ventana y sin red.
type Manejador = (
  e: unknown,
  ...a: unknown[]
) => Promise<{ ok: boolean; valor?: unknown; error?: unknown }>;

let dir: string;
let canales: Map<string, Manejador>;
let validar = true;

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-labipc-'));
  canales = new Map();
  validar = true;
  const lab = new LaboratorioGit({
    raiz: path.join(dir, 'laboratorio-git'),
    buscarGit: () => null,
  });
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const nucleo = {
    rutas: new Rutas(dir),
    eventos: { on: () => () => undefined },
  } as unknown as NucleoIpc;
  const ventana: VentanaLike = { isDestroyed: () => false, webContents: { send: vi.fn() } };
  registrarIpc(nucleo, ipcMain, ventana, { copiar: vi.fn() } as never, () => validar, undefined, {
    laboratorioGit: lab,
  });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const llamar = (ruta: string, ...a: unknown[]) => canales.get(`entorno:${ruta}`)!({}, ...a);

describe('IPC del laboratorio de Git', () => {
  it('sin git en el sistema, el estado es vacío y no se crea nada', async () => {
    const r = await llamar('laboratorioGit.estado');
    expect(r.ok).toBe(true);
    expect(r.valor).toMatchObject({ disponible: false, existe: false, archivos: [] });
  });

  it('una orden fuera de la lista se rechaza con un código estable', async () => {
    for (const o of [{ cmd: 'clone' }, 'status', { cmd: 'push', force: true }]) {
      const r = await llamar('laboratorioGit.ejecutar', o);
      expect(r.ok).toBe(false);
    }
  });

  it('el emisor no válido se rechaza en todas las rutas', async () => {
    validar = false;
    for (const ruta of ['estado', 'ejecutar', 'escribirArchivo', 'reiniciar']) {
      const r = await canales.get(`entorno:laboratorioGit.${ruta}`)!({}, { cmd: 'status' });
      expect(r.ok, ruta).toBe(false);
    }
  });
});

describe('el laboratorio no se expone fuera de la ventana', () => {
  it('ni el MCP ni la CLI lo mencionan', () => {
    const base = path.join(__dirname, '../../../packages/core/src');
    for (const f of ['mcp', 'cli']) {
      const dirF = path.join(base, f);
      for (const n of readdirSync(dirF)) {
        if (!n.endsWith('.ts')) continue;
        expect(readFileSync(path.join(dirF, n), 'utf8'), `${f}/${n}`).not.toMatch(
          /laboratorio(?:Git|git)|LaboratorioGit/,
        );
      }
    }
  });
});
