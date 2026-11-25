import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { Ejecutor } from '../src/plataforma/tipos';
import {
  ErrorDetenidoAlIniciar,
  type DefProceso,
  type EstadoProceso,
} from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import { UrlBase } from '../src/sitios/urlbase';
import { SitioSchema, type EstadoTunel, type Sitio } from '../src/tipos';
import { Tuneles } from '../src/tuneles/tuneles';

const BANNER = [
  '2026-11-17T10:00:01Z INF POST https://api.trycloudflare.com/tunnel',
  '2026-11-17T10:00:02Z INF |  https://lucky-words-here.trycloudflare.com  |',
].join('\n');

/** Toda apertura exige la confirmación del usuario. */
const SI = { confirmado: true };

let base: string;
let carpeta: string;
let rutas: Rutas;
let eventos: Eventos<EventosNucleo>;
let emitidos: EstadoTunel[];
let iniciados: DefProceso[];
let detenidos: string[];
let estados: Map<string, EstadoProceso>;
let pids: Map<string, number>;
let salidas: Array<(id: string, c: number | null) => void>;
let escribirBanner: boolean;
let destino: 'log' | 'salida';
let fallaIniciar: boolean;
let gateIniciar: Promise<void> | null;
let detenerAlSoltar = false;
let gateDetener: Promise<void> | null;
let instalados: string[];
let sitios: Sitio[];
let ejecutorLlamadas: string[][];
let entradasIniciar: number;
let entradasDetener: number;
let alDetener: (() => void) | null;

const sitio = (extra: Partial<Sitio> = {}): Sitio =>
  SitioSchema.parse({
    id: 'wolf',
    nombre: 'Wolf',
    dominio: 'wolf.test',
    carpeta,
    tipo: 'estatico',
    urlBaseVar: 'APP_URL',
    ...extra,
  });

const supervisor = () =>
  ({
    iniciar: async (d: DefProceso) => {
      entradasIniciar++;
      if (gateIniciar) {
        await gateIniciar;
        if (detenerAlSoltar) throw new ErrorDetenidoAlIniciar(d.id);
      }
      if (fallaIniciar) throw new Error('No se pudo iniciar');
      iniciados.push(d);
      estados.set(d.id, 'iniciando');
      pids.set(d.id, 4242);
      if (escribirBanner) {
        const li = d.args.indexOf('--logfile');
        const archivo = destino === 'log' ? d.args[li + 1]! : d.log;
        mkdirSync(path.dirname(archivo), { recursive: true });
        writeFileSync(archivo, BANNER);
      }
    },
    detener: async (id: string) => {
      entradasDetener++;
      alDetener?.();
      if (gateDetener) await gateDetener;
      detenidos.push(id);
      estados.delete(id);
      pids.delete(id);
    },
    estado: (id: string) => estados.get(id) ?? 'apagado',
    pid: (id: string) => pids.get(id) ?? null,
    ids: () => [...estados.keys()],
    alSalir: (fn: (id: string, c: number | null) => void) => salidas.push(fn),
  }) as never;

const exec: Ejecutor = async (cmd, args) => {
  ejecutorLlamadas.push([cmd, ...args]);
  return { codigo: 0, stdout: '', stderr: '' };
};

let ubReal: UrlBase;
function crear(
  opts = { esperaMs: 300, intervaloMs: 10 },
  envolver?: (ub: UrlBase) => Pick<UrlBase, 'aplicar' | 'restaurar' | 'restaurarPorId'>,
) {
  ubReal = new UrlBase({ rutas, ejecutor: exec });
  const urlBase = envolver ? envolver(ubReal) : ubReal;
  return new Tuneles({
    supervisor: supervisor(),
    sitios: { listar: async () => sitios },
    almacen: {
      leer: async () => ({ servicios: { nginx: { puerto: 8080 } } }),
    } as never,
    instalador: { instalados: async () => instalados } as never,
    rutas,
    urlBase,
    eventos,
    opts,
  });
}

const env = () => path.join(carpeta, '.env');

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-tun-'));
  carpeta = path.join(base, 'Wolf Core ñ');
  mkdirSync(carpeta, { recursive: true });
  rutas = new Rutas(path.join(base, 'datos'));
  eventos = new Eventos<EventosNucleo>();
  emitidos = [];
  eventos.on('tunel:estado', (e) => emitidos.push(e));
  iniciados = [];
  detenidos = [];
  estados = new Map();
  pids = new Map();
  salidas = [];
  escribirBanner = true;
  destino = 'log';
  fallaIniciar = false;
  gateIniciar = null;
  detenerAlSoltar = false;
  gateDetener = null;
  instalados = ['2025.1.0', '2026.3.0', '2026.10.1'];
  sitios = [sitio()];
  ejecutorLlamadas = [];
  entradasIniciar = 0;
  entradasDetener = 0;
  alDetener = null;
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('Tuneles.abrir', () => {
  it.each([false, true])(
    'ningún sitio se publica sin confirmación (abrir ni renovar), con datos reales=%s',
    async (datosReales) => {
      sitios = [sitio({ datosReales })];
      const t = crear();
      for (const o of [undefined, {}, { confirmado: false }]) {
        await expect(t.abrir('wolf', o)).rejects.toMatchObject({
          codigo: 'tuneles.confirmacion_requerida',
        });
        await expect(t.renovar('wolf', o)).rejects.toMatchObject({
          codigo: 'tuneles.confirmacion_requerida',
        });
      }
      expect(iniciados).toEqual([]);
      await expect(t.abrir('wolf', SI)).resolves.toMatchObject({ estado: 'activo' });
      // Renovar sin confirmar tampoco cierra el que ya está abierto.
      await expect(t.renovar('wolf')).rejects.toMatchObject({
        codigo: 'tuneles.confirmacion_requerida',
      });
      expect(detenidos).toEqual([]);
    },
  );

  it('si el túnel confirmado ya no es el del sitio (MCP), no se abre', async () => {
    const t = crear();
    await expect(
      t.abrir('wolf', { confirmado: true, tunelConfirmado: { proveedor: 'cloudflare-nombre' } }),
    ).rejects.toMatchObject({ codigo: 'tuneles.confirmacion_obsoleta' });
    expect(iniciados).toEqual([]);
    await expect(
      t.abrir('wolf', { confirmado: true, tunelConfirmado: { proveedor: 'cloudflare-rapido' } }),
    ).resolves.toMatchObject({ estado: 'activo' });
  });

  it('lanza cloudflared con los argumentos exactos y devuelve la URL', async () => {
    const t = crear();
    const e = await t.abrir('wolf', SI);
    expect(e).toMatchObject({
      sitioId: 'wolf',
      estado: 'activo',
      url: 'https://lucky-words-here.trycloudflare.com',
    });
    const d = iniciados[0]!;
    expect(d.id).toBe('tunel-wolf');
    expect(d.comando).toBe(path.join(rutas.bin('cloudflared', '2026.10.1'), 'cloudflared.exe'));
    expect(d.reiniciar).toBe(false);
    expect(d.puerto).toBeUndefined();
    expect(d.args).toEqual([
      'tunnel',
      '--no-autoupdate',
      '--url',
      'http://127.0.0.1:8080',
      '--http-host-header',
      'wolf.test',
      '--logfile',
      rutas.logs('tuneles', 'tunel-wolf.log'),
    ]);
    expect(d.log).toBe(rutas.logs('tuneles', 'tunel-wolf.salida.log'));
    expect(t.estados()).toEqual([expect.objectContaining({ sitioId: 'wolf', estado: 'activo' })]);
    expect(emitidos.map((x) => x.estado)).toEqual(['iniciando', 'activo']);
  });

  it('también lee la URL del log de salida del supervisor (stderr)', async () => {
    destino = 'salida';
    const e = await crear().abrir('wolf', SI);
    expect(e.url).toBe('https://lucky-words-here.trycloudflare.com');
  });

  it('no lee URLs viejas: borra el log anterior antes de lanzar', async () => {
    mkdirSync(rutas.logs('tuneles'), { recursive: true });
    writeFileSync(
      rutas.logs('tuneles', 'tunel-wolf.log'),
      '|  https://viejo-viejo.trycloudflare.com  |',
    );
    escribirBanner = false;
    const e = await crear({ esperaMs: 80, intervaloMs: 10 }).abrir('wolf', SI);
    expect(e.estado).toBe('error');
    expect(e.url).toBeNull();
  });

  it('sin URL a tiempo: mata el proceso y deja error', async () => {
    escribirBanner = false;
    writeFileSync(env(), 'APP_URL=http://wolf.test\n');
    const t = crear({ esperaMs: 80, intervaloMs: 10 });
    const e = await t.abrir('wolf', SI);
    expect(e.estado).toBe('error');
    expect(e.mensaje).toBeTruthy();
    expect(detenidos).toContain('tunel-wolf');
    expect(readFileSync(env(), 'utf8')).toBe('APP_URL=http://wolf.test\n');
    expect(t.estados()[0]!.estado).toBe('error');
  });

  it('sitio inexistente', async () => {
    await expect(crear().abrir('nada', SI)).rejects.toThrow('Sitio no encontrado');
  });

  it('cloudflared no instalado', async () => {
    instalados = [];
    await expect(crear().abrir('wolf', SI)).rejects.toThrow(
      'cloudflared no está instalado. Instálelo desde Servicios.',
    );
  });

  it('si el supervisor no puede iniciar, estado error y se propaga', async () => {
    fallaIniciar = true;
    const t = crear();
    await expect(t.abrir('wolf', SI)).rejects.toThrow('No se pudo iniciar');
    expect(t.estados()[0]!.estado).toBe('error');
  });

  it('abrir dos veces no duplica el proceso', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    await t.abrir('wolf', SI);
    expect(iniciados).toHaveLength(1);
  });

  it('el proceso muere mientras se espera la URL: error enseguida', async () => {
    escribirBanner = false;
    const t = crear({ esperaMs: 5000, intervaloMs: 10 });
    const p = t.abrir('wolf', SI);
    await vi.waitFor(() => expect(iniciados).toHaveLength(1));
    estados.set('tunel-wolf', 'error');
    salidas.forEach((f) => f('tunel-wolf', 1));
    const e = await p;
    expect(e.estado).toBe('error');
    expect(e.mensaje).toBe('El túnel se cerró. Use Renovar.');
  });
});

describe('Tuneles y URL base (Review Focus 5)', () => {
  it('.env sin la variable: abrir la agrega y cerrar deja el .env idéntico', async () => {
    const original = 'APP_NAME=Wolf\r\nAPP_KEY=abc\r\n';
    writeFileSync(env(), original);
    const t = crear();
    await t.abrir('wolf', SI);
    expect(readFileSync(env(), 'utf8')).toBe(
      `${original}APP_URL=https://lucky-words-here.trycloudflare.com/\r\n`,
    );
    await t.cerrar('wolf');
    expect(readFileSync(env(), 'utf8')).toBe(original);
    expect(detenidos).toContain('tunel-wolf');
    expect(t.estados()).toEqual([]);
    expect(emitidos[emitidos.length - 1]).toMatchObject({ sitioId: 'wolf', estado: 'apagado' });
  });

  it('.env con la variable: se restaura el valor exacto', async () => {
    const original = 'APP_URL="http://wolf.test"\nB=2';
    writeFileSync(env(), original);
    const t = crear();
    await t.abrir('wolf', SI);
    expect(readFileSync(env(), 'utf8')).toContain(
      'APP_URL="https://lucky-words-here.trycloudflare.com/"',
    );
    await t.cerrar('wolf');
    expect(readFileSync(env(), 'utf8')).toBe(original);
  });

  it('sitio sin urlBaseVar no toca el .env', async () => {
    sitios = [sitio({ urlBaseVar: null })];
    writeFileSync(env(), 'A=1\n');
    const t = crear();
    await t.abrir('wolf', SI);
    expect(readFileSync(env(), 'utf8')).toBe('A=1\n');
    expect(existsSync(path.join(carpeta, '.env.pel-respaldo'))).toBe(false);
  });

  it('fallo de urlBase no mata el túnel: queda activo con mensaje', async () => {
    const t = crear();
    const e = await t.abrir('wolf', SI); // sin .env
    expect(e.estado).toBe('activo');
    expect(e.mensaje).toBe('El sitio no tiene .env');
  });
});

describe('Tuneles cierre inesperado, renovar y restauración', () => {
  it('si el proceso sale solo: error "Use Renovar" y se restaura el .env', async () => {
    const original = 'A=1\n';
    writeFileSync(env(), original);
    const t = crear();
    await t.abrir('wolf', SI);
    estados.set('tunel-wolf', 'error');
    salidas.forEach((f) => f('tunel-wolf', 1));
    await vi.waitFor(() => expect(readFileSync(env(), 'utf8')).toBe(original));
    expect(t.estados()[0]).toMatchObject({
      estado: 'error',
      mensaje: 'El túnel se cerró. Use Renovar.',
    });
  });

  it('ignora salidas de procesos que no son túneles', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    salidas.forEach((f) => f('nginx', 1));
    expect(t.estados()[0]!.estado).toBe('activo');
  });

  it('renovar cierra y abre de nuevo', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    const e = await t.renovar('wolf', SI);
    expect(e.estado).toBe('activo');
    expect(iniciados).toHaveLength(2);
    expect(detenidos).toEqual(['tunel-wolf']);
  });

  it('persiste en run/tuneles.json y restaura tras reiniciar la app', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    const guardado = JSON.parse(readFileSync(path.join(rutas.base, 'run', 'tuneles.json'), 'utf8'));
    expect(guardado).toEqual([
      { sitioId: 'wolf', url: 'https://lucky-words-here.trycloudflare.com', pid: 4242 },
    ]);
    const t2 = crear();
    await t2.restaurar();
    expect(t2.estados()).toEqual([
      expect.objectContaining({
        sitioId: 'wolf',
        estado: 'activo',
        url: 'https://lucky-words-here.trycloudflare.com',
      }),
    ]);
    await t2.cerrar('wolf');
    expect(JSON.parse(readFileSync(path.join(rutas.base, 'run', 'tuneles.json'), 'utf8'))).toEqual(
      [],
    );
  });

  it('restaurar descarta túneles cuyo proceso ya no vive y devuelve el .env', async () => {
    const original = 'A=1\n';
    writeFileSync(env(), original);
    const t = crear();
    await t.abrir('wolf', SI);
    estados.clear();
    pids.clear();
    const t2 = crear();
    await t2.restaurar();
    expect(t2.estados()).toEqual([]);
    expect(readFileSync(env(), 'utf8')).toBe(original);
    expect(JSON.parse(readFileSync(path.join(rutas.base, 'run', 'tuneles.json'), 'utf8'))).toEqual(
      [],
    );
  });
});

describe('Tuneles carreras y barrido (fix ronda 1)', () => {
  it('cerrar() durante aplicar: el .env vuelve a su original', async () => {
    const original = 'APP_NAME=Wolf\nAPP_URL=http://wolf.test\n';
    writeFileSync(env(), original);
    let soltar!: () => void;
    const puerta = new Promise<void>((r) => (soltar = r));
    let entro!: () => void;
    const dentro = new Promise<void>((r) => (entro = r));
    const t = crear({ esperaMs: 300, intervaloMs: 10 }, (ub) => ({
      aplicar: async (s, u) => {
        entro();
        await puerta;
        return ub.aplicar(s, u);
      },
      restaurar: (s) => ub.restaurar(s),
      restaurarPorId: (id) => ub.restaurarPorId(id),
    }));
    const abrir = t.abrir('wolf', SI);
    await dentro;
    await t.cerrar('wolf');
    soltar();
    await abrir;
    expect(readFileSync(env(), 'utf8')).toBe(original);
    expect(existsSync(path.join(rutas.base, 'run', 'urlbase-wolf.json'))).toBe(false);
  });

  it('barrido: un urlbase-<id>.json huérfano se restaura en restaurar()', async () => {
    const original = 'A=1\nAPP_URL=http://wolf.test\n';
    writeFileSync(env(), original);
    const t0 = crear();
    await ubReal.aplicar(sitio(), 'https://x.trycloudflare.com/');
    expect(readFileSync(env(), 'utf8')).not.toBe(original);
    await t0.restaurar();
    expect(readFileSync(env(), 'utf8')).toBe(original);
    expect(existsSync(path.join(rutas.base, 'run', 'urlbase-wolf.json'))).toBe(false);
  });

  it('cerrar() durante un abrir() en curso: el siguiente abrir() empieza de cero', async () => {
    escribirBanner = false;
    const t = crear({ esperaMs: 2000, intervaloMs: 10 });
    const primero = t.abrir('wolf', SI);
    await vi.waitFor(() => expect(iniciados).toHaveLength(1));
    await t.cerrar('wolf');
    escribirBanner = true;
    const e = await t.abrir('wolf', SI);
    expect(e.estado).toBe('activo');
    expect(iniciados).toHaveLength(2);
    expect((await primero).estado).toBe('apagado');
  });

  it('no se puede limpiar el log anterior: estado error con mensaje, sin lanzar', async () => {
    const log = rutas.logs('tuneles', 'tunel-wolf.log');
    mkdirSync(path.join(log, 'dentro'), { recursive: true });
    const e = await crear().abrir('wolf', SI);
    expect(e.estado).toBe('error');
    expect(e.mensaje).toContain('log anterior');
    expect(iniciados).toHaveLength(0);
  });
});

describe('Tuneles guardas de generación (fix ronda 2)', () => {
  it('cerrar() mientras iniciar() lanza ErrorDetenidoAlIniciar: apagado, sin error', async () => {
    let soltar!: () => void;
    gateIniciar = new Promise<void>((r) => (soltar = r));
    detenerAlSoltar = true;
    const t = crear({ esperaMs: 300, intervaloMs: 10 });
    const abrir = t.abrir('wolf', SI);
    await vi.waitFor(() => expect(entradasIniciar).toBe(1));
    await t.cerrar('wolf');
    soltar();
    const e = await abrir;
    expect(e.estado).toBe('apagado');
    expect(e.mensaje).toBeUndefined();
    expect(t.estados()).toEqual([]);
  });

  it('cerrar() mientras iniciar() está en curso: el proceso lanzado se detiene', async () => {
    let soltar!: () => void;
    gateIniciar = new Promise<void>((r) => (soltar = r));
    const t = crear({ esperaMs: 300, intervaloMs: 10 });
    const abrir = t.abrir('wolf', SI);
    await vi.waitFor(() => expect(entradasIniciar).toBe(1));
    await t.cerrar('wolf');
    soltar();
    const e = await abrir;
    expect(e.estado).toBe('apagado');
    expect(pids.has('tunel-wolf')).toBe(false);
    expect(estados.has('tunel-wolf')).toBe(false);
    expect(detenidos.length).toBeGreaterThanOrEqual(2);
    expect(t.estados()).toEqual([]);
  });

  it('abrir() espera a que termine un cerrar() en curso del mismo sitio', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    let soltar!: () => void;
    gateDetener = new Promise<void>((r) => (soltar = r));
    const cerrar = t.cerrar('wolf');
    const nuevo = t.abrir('wolf', SI);
    await vi.waitFor(() => expect(entradasDetener).toBe(1));
    // Unas vueltas del bucle de eventos: el abrir() sigue esperando al cierre.
    for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r));
    expect(iniciados).toHaveLength(1);
    gateDetener = null;
    soltar();
    await cerrar;
    const e = await nuevo;
    expect(iniciados).toHaveLength(2);
    expect(e.estado).toBe('activo');
  });

  it('barrido: restaura por la ruta guardada aunque el sitio ya no exista', async () => {
    const original = 'A=1\nAPP_URL=http://wolf.test\n';
    writeFileSync(env(), original);
    const t0 = crear();
    await ubReal.aplicar(sitio(), 'https://x.trycloudflare.com/');
    sitios = [];
    await t0.restaurar();
    expect(readFileSync(env(), 'utf8')).toBe(original);
    expect(existsSync(path.join(rutas.base, 'run', 'urlbase-wolf.json'))).toBe(false);
  });
});

describe('Tuneles huérfanos y cierre total (ola final)', () => {
  it('restaurar() detiene un cloudflared readoptado que no figura en tuneles.json', async () => {
    estados.set('tunel-viejo', 'encendido');
    pids.set('tunel-viejo', 99);
    estados.set('nginx', 'encendido');
    const t = crear();
    await t.restaurar();
    expect(detenidos).toEqual(['tunel-viejo']);
    expect(t.estados()).toEqual([]);
  });

  it('restaurar() detiene un túnel readoptado cuyo PID no coincide con el registro', async () => {
    const t0 = crear();
    await t0.abrir('wolf', SI);
    pids.set('tunel-wolf', 555);
    const t = crear();
    await t.restaurar();
    expect(detenidos).toEqual(['tunel-wolf']);
    expect(t.estados()).toEqual([]);
  });

  it('cerrarTodos() devuelve el .env antes de detener cloudflared', async () => {
    const original = 'A=1\n';
    writeFileSync(env(), original);
    const t = crear();
    await t.abrir('wolf', SI);
    let envAlDetener: string | null = null;
    alDetener = () => {
      envAlDetener = readFileSync(env(), 'utf8');
    };
    expect(await t.cerrarTodos()).toEqual([]);
    expect(envAlDetener).toBe(original);
    expect(detenidos).toEqual(['tunel-wolf']);
    expect(t.estados()).toEqual([]);
  });
});
