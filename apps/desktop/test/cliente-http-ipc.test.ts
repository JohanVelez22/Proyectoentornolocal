import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Rutas, type PeticionHttp } from '@pel/core';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
import { AlmacenSecretos, type CifradoSeguro } from '../src/main/secretos';
import { RUTAS_IPC } from '../src/shared/api';

// Servidor local en 127.0.0.1 con puerto aleatorio; los secretos son obviamente falsos.
const FALSO = 'http-prueba-falsa-0000';
/** Respuesta del IPC, sin tipos: las pruebas miran su forma. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dato = any;
type Manejador = (evento: unknown, ...args: unknown[]) => Promise<unknown>;

const cifrado: CifradoSeguro = {
  isEncryptionAvailable: () => true,
  encryptString: (t) => Buffer.from(t, 'utf8').reverse(),
  decryptString: (b) => Buffer.from(b).reverse().toString('utf8'),
};

let dir: string;
let servidor: http.Server;
let puerto: number;
let canales: Map<string, Manejador>;
let secretos: AlmacenSecretos;

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-clientehttp-ipc-'));
  secretos = new AlmacenSecretos(path.join(dir, 'etc', 'secretos'), null, cifrado);
  servidor = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ auth: req.headers['authorization'] ?? null }));
  });
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  puerto = (servidor.address() as AddressInfo).port;
  canales = new Map();
  const ipcMain: IpcMainLike = {
    handle: (canal, fn) => void canales.set(canal, fn as Manejador),
  };
  const nucleo = {
    rutas: new Rutas(dir),
    eventos: { on: () => () => undefined },
    sitios: { listar: async () => [] },
  } as unknown as NucleoIpc;
  const ventana: VentanaLike = { isDestroyed: () => false, webContents: { send: vi.fn() } };
  registrarIpc(nucleo, ipcMain, ventana, { copiar: vi.fn() } as never, () => true, undefined, {
    secretos,
  });
});
afterEach(async () => {
  servidor.closeAllConnections();
  await new Promise<void>((ok) => servidor.close(() => ok()));
  rmSync(dir, { recursive: true, force: true });
});

const llamar = async (
  ruta: string,
  ...args: unknown[]
): Promise<{ ok: boolean; valor?: Dato; error?: Dato }> =>
  (await canales.get(`entorno:${ruta}`)!({}, ...args)) as never;

const peticion = (extra: Partial<PeticionHttp> = {}): PeticionHttp => ({
  id: '',
  nombre: 'prueba',
  metodo: 'GET',
  url: `http://127.0.0.1:${puerto}/`,
  params: [],
  cabeceras: [],
  cuerpo: { tipo: 'ninguno' },
  auth: { tipo: 'ninguna' },
  plazoSeg: 5,
  ignorarCertificado: false,
  ...extra,
});

describe('cliente HTTP por IPC (D48)', () => {
  it('todas sus rutas están registradas y en la lista del renderer', () => {
    const rutas = RUTAS_IPC.filter((r) => r.startsWith('clienteHttp.'));
    expect(rutas).toHaveLength(12);
    for (const r of rutas) expect(canales.has(`entorno:${r}`), r).toBe(true);
  });

  it('el secreto entra por el IPC, va a AlmacenSecretos y el renderer solo recibe la referencia', async () => {
    const g = await llamar(
      'clienteHttp.guardarPeticion',
      peticion({ auth: { tipo: 'bearer', valor: FALSO } }),
    );
    expect(g.ok).toBe(true);
    const guardada = g.valor as PeticionHttp;
    expect(JSON.stringify(guardada)).not.toContain(FALSO);
    const ref = (guardada.auth as { ref: string }).ref;
    expect(await secretos.leer(ref as `http:${string}`)).toBe(FALSO);
    // Nada en la carpeta de datos tiene el valor en claro (ni cifrado trivial invertido a mano).
    const archivos = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? archivos(path.join(d, e.name)) : [path.join(d, e.name)],
      );
    for (const f of archivos(dir)) expect(readFileSync(f, 'utf8'), f).not.toContain(FALSO);
    // Estado y envío: lo que sale es la respuesta, y el servidor recibió el valor real.
    const e = await llamar('clienteHttp.estado');
    expect(JSON.stringify(e.valor)).not.toContain(FALSO);
    const r = await llamar('clienteHttp.enviar', guardada);
    expect(r.ok).toBe(true);
    expect(JSON.parse(r.valor.cuerpo.texto)).toEqual({ auth: `Bearer ${FALSO}` });
    expect((await llamar('clienteHttp.estado')).valor.historial[0].peticion.auth).toEqual({
      tipo: 'bearer',
    });
    // «Mostrar» es la única vía para verlo.
    expect((await llamar('clienteHttp.revelar', ref)).valor).toBe(FALSO);
    // Borrar la petición borra su secreto.
    await llamar('clienteHttp.borrarPeticion', guardada.id);
    expect(secretos.hay(ref as `http:${string}`)).toBe(false);
  });

  it('un valor con espacios internos (Cookie) se guarda; uno inválido falla sin repetirlo', async () => {
    const ok = await llamar(
      'clienteHttp.guardarPeticion',
      peticion({ cabeceras: [{ clave: 'Cookie', valor: `a=1; b=${FALSO}`, activo: true }] }),
    );
    expect(ok.ok).toBe(true);
    const mal = await llamar(
      'clienteHttp.guardarPeticion',
      peticion({ cabeceras: [{ clave: 'Cookie', valor: `ñ-${FALSO}\n`, activo: true }] }),
    );
    expect(mal.ok).toBe(false);
    expect(mal.error.codigo).toBe('clientehttp.secreto_no_guardado');
    expect(JSON.stringify(mal)).not.toContain(FALSO);
  });

  it('valida los argumentos: nada raro llega al núcleo', async () => {
    for (const malo of [null, 'x', 5, [], { metodo: 'TRACE', url: 'http://h.test' }]) {
      const r = await llamar('clienteHttp.enviar', malo);
      expect(r.ok, JSON.stringify(malo)).toBe(false);
      expect(r.error.codigo).toBe('clientehttp.peticion_invalida');
    }
    expect((await llamar('clienteHttp.revelar', 'ia:openai')).ok).toBe(false);
    expect((await llamar('clienteHttp.borrarEntorno', '../x')).ok).toBe(false);
    expect((await llamar('clienteHttp.importarCurl', 5)).ok).toBe(false);
  });

  it('importar curl guarda en la colección y las credenciales al almacén', async () => {
    const r = await llamar('clienteHttp.importarCurl', `curl http://h.test/a -u yo:${FALSO}`);
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r.valor)).not.toContain(FALSO);
    expect(secretos.hay(r.valor.peticion.auth.ref)).toBe(true);
  });
});
