import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClienteHttp, Rutas, ServidorEjemplo, type PeticionHttp } from '@pel/core';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
import {
  peticionDeCodigo,
  peticionDeMetodo,
  tienePrueba,
} from '../src/renderer/utilidades/ejemplosHttp';

// D49: botón «Probar» de la guía HTTP. Servidor de ejemplo en 127.0.0.1 con puerto aleatorio.
type Manejador = (evento: unknown, ...args: unknown[]) => Promise<unknown>;
const RAIZ = path.join(__dirname, '../../../docs/contenido');
const contenido = JSON.parse(readFileSync(path.join(RAIZ, 'http.json'), 'utf8')) as {
  metodos: { nombre: string }[];
  codigos: { codigo: number }[];
};

let dir: string;
let canales: Map<string, Manejador>;
let servidor: ServidorEjemplo;
let cliente: ClienteHttp;

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-ejemplohttp-'));
  canales = new Map();
  servidor = new ServidorEjemplo();
  cliente = new ClienteHttp({
    carpeta: path.join(dir, 'ch'),
    secretos: {
      guardar: async () => undefined,
      leer: async () => null,
      borrar: async () => undefined,
    },
    caWolf: async () => null,
    dominiosWolf: async () => [],
  });
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const nucleo = {
    rutas: new Rutas(dir),
    eventos: { on: () => () => undefined },
    sitios: { listar: async () => [] },
  } as unknown as NucleoIpc;
  const ventana: VentanaLike = { isDestroyed: () => false, webContents: { send: vi.fn() } };
  registrarIpc(nucleo, ipcMain, ventana, { copiar: vi.fn() } as never, () => true, undefined, {
    servidorEjemplo: servidor,
    clienteHttp: cliente,
  });
});
afterEach(async () => {
  await servidor.detener();
  rmSync(dir, { recursive: true, force: true });
});

const llamar = async (
  ruta: string,
  e: unknown = {},
): Promise<{ ok: boolean; valor?: { puerto: number } }> =>
  (await canales.get(`entorno:${ruta}`)!(e)) as never;

const completa = (p: Partial<PeticionHttp>): PeticionHttp => ({
  id: '',
  nombre: '',
  metodo: 'GET',
  url: '',
  params: [],
  cabeceras: [],
  cuerpo: { tipo: 'ninguno' },
  auth: { tipo: 'ninguna' },
  plazoSeg: 10,
  ignorarCertificado: false,
  ...p,
});

describe('IPC del servidor de ejemplo', () => {
  it('iniciar devuelve un puerto y detener lo apaga; no arranca solo', async () => {
    expect(servidor.estado().activo).toBe(false);
    const r = await llamar('ejemploHttp.iniciar');
    expect(r.ok).toBe(true);
    expect(r.valor?.puerto).toBe(servidor.estado().puerto);
    expect((await llamar('ejemploHttp.detener')).ok).toBe(true);
    expect(servidor.estado().activo).toBe(false);
  });

  it('el emisor no válido se rechaza', async () => {
    const m = new Map<string, Manejador>();
    const nucleo = {
      rutas: new Rutas(dir),
      eventos: { on: () => () => undefined },
    } as unknown as NucleoIpc;
    registrarIpc(
      nucleo,
      { handle: (c, fn) => void m.set(c, fn as Manejador) },
      { isDestroyed: () => false, webContents: { send: vi.fn() } },
      { copiar: vi.fn() } as never,
      () => false,
      undefined,
      { servidorEjemplo: servidor },
    );
    const r = (await m.get('entorno:ejemploHttp.iniciar')!({})) as { ok: boolean };
    expect(r.ok).toBe(false);
    expect(servidor.estado().activo).toBe(false);
  });
});

describe('ejemplos de la guía', () => {
  it('cada código y cada método con botón dan una petición a 127.0.0.1', () => {
    for (const c of contenido.codigos) {
      const p = peticionDeCodigo(c.codigo, 4321);
      expect(p.url, `${c.codigo}`).toMatch(/^http:\/\/127\.0\.0\.1:4321\//);
      expect(p.metodo).toBeDefined();
    }
    for (const m of contenido.metodos) {
      const p = peticionDeMetodo(m.nombre, 4321);
      if (['CONNECT', 'TRACE'].includes(m.nombre)) expect(p).toBeNull();
      else {
        expect(tienePrueba(m.nombre)).toBe(true);
        expect(p!.url).toMatch(/^http:\/\/127\.0\.0\.1:4321\//);
        expect(p!.metodo).toBe(m.nombre);
      }
    }
  });

  it('enviadas con el cliente de D48, cada ejemplo recibe la respuesta esperada', async () => {
    const puerto = await servidor.iniciar();
    const simulados = [100, 101, 502];
    for (const c of contenido.codigos.map((x) => x.codigo).filter((x) => x !== 504)) {
      const r = await cliente.enviar(
        completa({ ...peticionDeCodigo(c, puerto), plazoSeg: 10 }),
        {},
      );
      const esRedireccion = [301, 302, 303, 307, 308].includes(c);
      // las redirecciones se siguen: terminan en /eco con 200
      const esperado = simulados.includes(c) || esRedireccion ? 200 : c;
      expect(r.estado, `código ${c}`).toBe(esperado);
    }
    for (const m of contenido.metodos.map((x) => x.nombre).filter(tienePrueba)) {
      const r = await cliente.enviar(completa(peticionDeMetodo(m, puerto)!), {});
      expect(r.estado, m).toBeGreaterThanOrEqual(200);
      expect(r.estado, m).toBeLessThan(300);
    }
  });

  it('un servidor que no escucha en 127.0.0.1 no recibe nada del cliente de ejemplo', async () => {
    // El puerto del servidor de ejemplo no responde a un Host ajeno
    const puerto = await servidor.iniciar();
    const estado = await new Promise<number>((ok, fallo) => {
      http
        .get(
          { host: '127.0.0.1', port: puerto, path: '/eco', headers: { host: 'otro.test' } },
          (res) => {
            res.resume();
            ok(res.statusCode ?? 0);
          },
        )
        .on('error', fallo);
    });
    expect(estado).toBe(403);
  });
});
