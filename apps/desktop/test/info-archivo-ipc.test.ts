import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calcularHashesRuta, leerInfoRuta, PlataformaFalsa } from '@pel/core';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { RutasElegidas } from '../src/main/validacion';
import { RUTAS_IPC } from '../src/shared/api';

/**
 * D55: «Info de archivo». Soltar o elegir un archivo es una elección explícita (se registra con el
 * propósito 'info'); el resto de las llamadas siguen exigiendo una ruta ya registrada, y el
 * propósito 'info' no abre ninguna otra puerta.
 */
type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Resultado = { ok: boolean; valor?: unknown; error?: { mensaje: string; codigo?: string } };

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'info-ipc-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function montar() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const plataforma = new PlataformaFalsa({ carpetaDatos: dir });
  const nucleo = {
    eventos: { on: () => () => undefined },
    infoRuta: (r: string) => leerInfoRuta(r, { plataforma }),
    hashesRuta: (r: string) => calcularHashesRuta(r),
    usoDisco: { analizar: vi.fn(async (r: string) => ({ raiz: r, total: 1 })) },
    leerImagen: vi.fn(async () => ({})),
  };
  const elegidas = new RutasElegidas();
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
    () => true,
    elegidas,
  );
  const llamar = async (ruta: string, ...a: unknown[]) =>
    (await canales.get(`entorno:${ruta}`)!({}, ...a)) as Resultado;
  return { nucleo, llamar, canales, elegidas };
}

describe('IPC de Info de archivo', () => {
  it('los canales existen', () => {
    const { canales } = montar();
    for (const r of ['infoArchivo.registrar', 'infoArchivo.hashes', 'infoArchivo.carpeta']) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
  });

  it('registrar: valida la forma de la ruta antes de tocar el disco', async () => {
    const { llamar, elegidas } = montar();
    for (const mala of [
      'relativa.txt',
      '\\\\?\\C:\\Windows\\win.ini',
      '\\\\servidor\\recurso\\a.txt',
      'C:\\a\\..\\b.txt',
      'C:\\a.txt:flujo',
      42,
      null,
    ]) {
      const r = await llamar('infoArchivo.registrar', mala);
      expect(r.ok, String(mala)).toBe(false);
      expect(r.error?.codigo, String(mala)).toBe('info.ruta_invalida');
    }
    expect(elegidas.tiene('C:\\a.txt', 'info')).toBe(false);
  });

  it('registrar: lo que no existe se rechaza y no se registra', async () => {
    const { llamar, elegidas } = montar();
    const falta = path.join(dir, 'no-existe.txt');
    const r = await llamar('infoArchivo.registrar', falta);
    expect(r.error?.codigo).toBe('info.no_existe');
    expect(elegidas.tiene(falta, 'info')).toBe(false);
  });

  it('registrar un archivo y una carpeta existentes: devuelve los metadatos y los registra', async () => {
    const { llamar, elegidas } = montar();
    const f = path.join(dir, 'a.txt');
    writeFileSync(f, 'abc');
    const c = path.join(dir, 'sub');
    mkdirSync(c);
    const a = await llamar('infoArchivo.registrar', f);
    expect(a.ok).toBe(true);
    expect(a.valor).toMatchObject({ nombre: 'a.txt', tipo: 'archivo', tamano: 3 });
    const b = await llamar('infoArchivo.registrar', c);
    expect(b.valor).toMatchObject({ tipo: 'carpeta', tamano: null });
    expect(elegidas.tiene(f, 'info')).toBe(true);
    expect(elegidas.tiene(c, 'info')).toBe(true);
  });

  it('hashes y carpeta exigen una ruta ya registrada', async () => {
    const { llamar, nucleo } = montar();
    const f = path.join(dir, 'a.txt');
    writeFileSync(f, 'abc');
    expect((await llamar('infoArchivo.hashes', f)).ok).toBe(false);
    expect((await llamar('infoArchivo.carpeta', dir)).ok).toBe(false);
    expect(nucleo.usoDisco.analizar).not.toHaveBeenCalled();

    await llamar('infoArchivo.registrar', f);
    const h = await llamar('infoArchivo.hashes', f);
    expect(h.valor).toMatchObject({ md5: '900150983cd24fb0d6963f7d28e17f72' });

    await llamar('infoArchivo.registrar', dir);
    expect((await llamar('infoArchivo.carpeta', dir)).ok).toBe(true);
    expect(nucleo.usoDisco.analizar).toHaveBeenCalledWith(dir);
  });

  it('el propósito «info» no abre otras puertas: leer imágenes sigue exigiendo el diálogo', async () => {
    const { llamar, nucleo } = montar();
    const f = path.join(dir, 'foto.png');
    writeFileSync(f, 'x');
    await llamar('infoArchivo.registrar', f);
    const r = await llamar('herramientas.leerImagen', f);
    expect(r.ok).toBe(false);
    expect(nucleo.leerImagen).not.toHaveBeenCalled();
  });

  it('Uso del disco acepta una carpeta soltada pero no una cualquiera', async () => {
    const { llamar, nucleo } = montar();
    expect((await llamar('discoUso.analizar', dir)).ok).toBe(false);
    await llamar('infoArchivo.registrar', dir);
    expect((await llamar('discoUso.analizar', dir)).ok).toBe(true);
    expect(nucleo.usoDisco.analizar).toHaveBeenCalledTimes(1);
  });
});
