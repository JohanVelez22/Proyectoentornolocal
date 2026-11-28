import { describe, expect, it, vi } from 'vitest';
import { MiRed, PlataformaFalsa, type CarpetaCompartida } from '@pel/core';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';

/** D53: IPC de «Mi red», con el servicio real y la plataforma falsa: no toca la red ni eleva nada. */
type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Respuesta = { ok: boolean; valor?: unknown; error?: { codigo?: string } };

const carpeta = (nombre: string, extra: Partial<CarpetaCompartida> = {}): CarpetaCompartida => ({
  nombre,
  ruta: `C:\\${nombre}`,
  descripcion: '',
  tipo: 'carpeta',
  administrativa: false,
  oculta: false,
  usuarios: 0,
  ...extra,
});

function preparar() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const falsa = new PlataformaFalsa();
  falsa.adaptadoresFalsos = [
    {
      indice: 1,
      nombre: 'Wi-Fi',
      ip: '192.168.1.20',
      prefijo: 24,
      predeterminado: true,
      perfil: 'privado',
    },
  ];
  falsa.vecinosFalsos = [
    { ip: '192.168.1.1', mac: 'b8:27:eb:12:34:56', estado: 'Reachable', indice: 1 },
  ];
  falsa.carpetasCompartidasFalsas = [
    carpeta('Fotos'),
    carpeta('C$', { administrativa: true, oculta: true }),
  ];
  falsa.recursosFalsos.set('192.168.1.1', {
    ok: true,
    recursos: [{ nombre: 'Docs', tipo: 'Disk', comentario: '' }],
  });
  const medidor = vi.fn(async () => ({
    latenciaMs: 10,
    bajadaMbps: 50,
    subidaMbps: 10,
    bytesBajados: 1,
    bytesSubidos: 1,
    cancelada: false,
    incompleta: false,
  }));
  const miRed = new MiRed({ plataforma: falsa, medidor });
  const nucleo = { eventos: { on: () => () => undefined }, miRed } as unknown as NucleoIpc;
  const ventana: VentanaLike = { isDestroyed: () => false, webContents: { send: () => undefined } };
  const abrirRecursoRed = vi.fn(async () => undefined);
  const sistema = {
    elegirCarpeta: vi.fn(async () => null),
    elegirArchivo: vi.fn(async () => null),
    abrirUrl: vi.fn(),
    abrirGrabadora: vi.fn(),
    abrirCarpeta: vi.fn(),
    abrirRecursoRed,
    copiar: vi.fn(),
    version: vi.fn(async () => '1'),
    guardarArchivo: vi.fn(async () => null),
    elegirArchivos: vi.fn(async () => []),
  };
  registrarIpc(nucleo, ipcMain, ventana, sistema);
  const llamar = (c: string, ...a: unknown[]) =>
    canales.get(`entorno:${c}`)!({}, ...a) as Promise<Respuesta>;
  return { llamar, falsa, medidor, abrirRecursoRed };
}

describe('IPC de Mi red (D53)', () => {
  it('lectura y carpetas pasan al núcleo sin enviar ningún paquete', async () => {
    const t = preparar();
    expect(await t.llamar('miRed.lectura')).toMatchObject({ ok: true });
    expect(await t.llamar('miRed.carpetas')).toMatchObject({ ok: true });
    expect(t.falsa.pingsPedidos).toEqual([]);
  });

  it('escanear y medir exigen exactamente true; sin él no hay ping ni medición', async () => {
    const t = preparar();
    for (const c of [false, undefined, 'true', 1, null, {}]) {
      expect((await t.llamar('miRed.escanear', c)).ok).toBe(false);
      expect((await t.llamar('miRed.medirVelocidad', c)).ok).toBe(false);
    }
    expect(t.falsa.pingsPedidos).toEqual([]);
    expect(t.medidor).not.toHaveBeenCalled();
    expect((await t.llamar('miRed.escanear', true)).ok).toBe(true);
    expect(t.falsa.pingsPedidos.length).toBeGreaterThan(0);
    expect((await t.llamar('miRed.medirVelocidad', true)).ok).toBe(true);
    expect(t.medidor).toHaveBeenCalledOnce();
  });

  it('la ventana no puede mandar un rango: el escaneo ignora todo lo que no sea la confirmación', async () => {
    const t = preparar();
    await t.llamar('miRed.escanear', true, '8.8.8.0/24', 8);
    expect(t.falsa.pingsPedidos.every((p) => p.ip.startsWith('192.168.1.'))).toBe(true);
  });

  it('dejar de compartir exige true, un nombre acotado y una carpeta no administrativa de la lista', async () => {
    const t = preparar();
    for (const c of [false, undefined, 'true', 1, null]) {
      expect((await t.llamar('miRed.dejarDeCompartir', 'Fotos', c)).ok).toBe(false);
    }
    for (const n of ['C$', '', 'x'.repeat(81), 5, null, 'No existe', 'a\nb']) {
      expect((await t.llamar('miRed.dejarDeCompartir', n, true)).ok, String(n)).toBe(false);
    }
    expect(t.falsa.dejarDeCompartirLlamadas).toBe(0);
    expect(await t.llamar('miRed.dejarDeCompartir', 'Fotos', true)).toMatchObject({
      ok: true,
      valor: { estado: 'quitada' },
    });
    expect(t.falsa.carpetasQuitadas).toEqual(['Fotos']);
  });

  it('un UAC cancelado se devuelve como resultado, no como fallo', async () => {
    const t = preparar();
    t.falsa.uacCancelado = true;
    expect(await t.llamar('miRed.dejarDeCompartir', 'Fotos', true)).toMatchObject({
      ok: true,
      valor: { estado: 'cancelado' },
    });
  });

  it('ping y carpetas de un equipo: solo IP privadas de la lista, con textos acotados', async () => {
    const t = preparar();
    await t.llamar('miRed.lectura');
    expect(await t.llamar('miRed.ping', '192.168.1.1')).toMatchObject({ ok: true });
    for (const ip of [
      '8.8.8.8',
      '192.168.1.99',
      'pc',
      '192.168.1.1 & calc',
      '',
      7,
      null,
      'x'.repeat(50),
    ]) {
      expect((await t.llamar('miRed.ping', ip)).ok, String(ip)).toBe(false);
      expect((await t.llamar('miRed.carpetasDeEquipo', ip)).ok, String(ip)).toBe(false);
    }
    expect(t.falsa.pingsPedidos).toEqual([{ ip: '192.168.1.1', intentos: 4 }]);
    expect(t.falsa.recursosPedidos).toEqual([]);
  });

  it('abrir un recurso: solo uno que ese equipo listó, y la ruta sale del núcleo, no de la ventana', async () => {
    const t = preparar();
    await t.llamar('miRed.lectura');
    // Antes de listar no hay nada que abrir.
    expect((await t.llamar('miRed.abrirRecurso', '192.168.1.1', 'Docs')).ok).toBe(false);
    await t.llamar('miRed.carpetasDeEquipo', '192.168.1.1');
    for (const [ip, r] of [
      ['192.168.1.1', 'C$'],
      ['192.168.1.1', '..\\x'],
      ['192.168.1.1', 'Otro'],
      ['192.168.1.1', ''],
      ['8.8.8.8', 'Docs'],
      ['192.168.1.99', 'Docs'],
    ]) {
      expect((await t.llamar('miRed.abrirRecurso', ip, r)).ok, `${ip} ${r}`).toBe(false);
    }
    expect(t.abrirRecursoRed).not.toHaveBeenCalled();
    expect((await t.llamar('miRed.abrirRecurso', '192.168.1.1', 'Docs')).ok).toBe(true);
    expect(t.abrirRecursoRed).toHaveBeenCalledExactlyOnceWith('\\\\192.168.1.1\\Docs');
  });

  it('cancelar sin nada en curso devuelve false', async () => {
    const t = preparar();
    expect(await t.llamar('miRed.cancelarEscaneo')).toMatchObject({ ok: true, valor: false });
    expect(await t.llamar('miRed.cancelarVelocidad')).toMatchObject({ ok: true, valor: false });
  });
});
