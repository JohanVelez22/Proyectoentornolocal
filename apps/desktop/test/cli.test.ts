import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aclEsSoloDelUsuario,
  entradasDeIcacls,
  leerArchivoCliSeguro,
  type ArchivoCli,
  type DepsLectura,
  type LecturaCli,
} from '../src/cli/archivoCli';
import { SALIDA, ejecutarCli, textoSeguro, type DepsCli } from '../src/cli/cliente';
import { carpetaDatosCli } from '../src/cli/entorno';
import { TEXTOS_CLI, idiomaDeLocale, textoDeCodigo, type Idioma } from '../src/cli/textos';

/** Clave de prueba obviamente falsa: no debe salir en ninguna salida. */
const TOKEN = 'tok-prueba-falsa-0000000000000000000000000000000';
const CLAVE = 'sk-prueba-falsa-00000000';

interface Pedido {
  metodo: string;
  url: string;
  cabeceras: http.IncomingHttpHeaders;
  cuerpo: { orden?: string; args?: Record<string, unknown> } | null;
}

type Manejador = (p: Pedido, res: http.ServerResponse) => boolean | void;

let servidor: http.Server;
let puerto = 0;
let pedidos: Pedido[] = [];
let respuestas: Record<string, unknown> = {};
let manejador: Manejador | null = null;

const ok = (datos: unknown) => ({ ok: true, datos });
const err = (codigo: string, datos?: Record<string, unknown>) => ({
  ok: false,
  error: { codigo, ...(datos ? { datos } : {}) },
});

const SITIO = {
  id: 'tienda',
  nombre: 'Tienda',
  dominio: 'tienda.test',
  tipo: 'laravel',
  php: '8.3',
  https: true,
  datosReales: false,
  carpeta: 'C:/sitios/tienda',
  url: 'https://tienda.test',
  tunel: { proveedor: 'cloudflare' },
};
const SITIO_REAL = { ...SITIO, id: 'clientes', dominio: 'clientes.test', datosReales: true };

beforeEach(async () => {
  pedidos = [];
  respuestas = {
    estado: ok({
      idioma: 'es',
      sitios: [SITIO, SITIO_REAL],
      servicios: [
        { id: 'nginx', nombre: 'Nginx', estado: 'encendido', version: '1.27', puertos: [80] },
      ],
      tuneles: [],
    }),
  };
  manejador = null;
  servidor = http.createServer((req, res) => {
    const partes: Buffer[] = [];
    req.on('data', (d: Buffer) => partes.push(d));
    req.on('end', () => {
      const texto = Buffer.concat(partes).toString('utf8');
      const p: Pedido = {
        metodo: req.method ?? '',
        url: req.url ?? '',
        cabeceras: req.headers,
        cuerpo: texto ? (JSON.parse(texto) as Pedido['cuerpo']) : null,
      };
      pedidos.push(p);
      if (manejador?.(p, res) === true) return;
      const r = p.cuerpo?.orden !== undefined ? respuestas[p.cuerpo.orden] : undefined;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(r ?? err('cli.orden_desconocida')));
    });
  });
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  puerto = (servidor.address() as AddressInfo).port;
});

afterEach(async () => {
  servidor.closeAllConnections();
  await new Promise<void>((r) => servidor.close(() => r()));
});

const archivo = (idioma: string | null = 'es'): ArchivoCli => ({
  puerto,
  token: TOKEN,
  pid: process.pid,
  version: { app: '1.0.0', idioma },
});

interface Montaje {
  deps: DepsCli;
  out: string[];
  err: string[];
  preguntas: string[];
}

function montar(
  o: Partial<DepsCli> & {
    respuestasTerminal?: (string | null)[];
    lectura?: LecturaCli;
    idiomaApp?: string | null;
  } = {},
): Montaje {
  const out: string[] = [];
  const errores: string[] = [];
  const preguntas: string[] = [];
  const cola = [...(o.respuestasTerminal ?? [])];
  const deps: DepsCli = {
    leerCliJson: async () =>
      o.lectura ?? { ok: true, archivo: archivo(o.idiomaApp === undefined ? 'es' : o.idiomaApp) },
    salida: { out: (t) => out.push(t), err: (t) => errores.push(t) },
    idioma: () => 'es',
    cwd: 'C:/sitios/tienda/app',
    tty: true,
    preguntar: async (t) => {
      preguntas.push(t);
      return cola.length > 0 ? (cola.shift() ?? null) : null;
    },
    pausaMs: 1,
    ...(o.tty !== undefined ? { tty: o.tty } : {}),
    ...(o.abrirApp ? { abrirApp: o.abrirApp } : {}),
    ...(o.esperaAbrirMs !== undefined ? { esperaAbrirMs: o.esperaAbrirMs } : {}),
    ...(o.idioma ? { idioma: o.idioma } : {}),
    ...(o.senal ? { senal: o.senal } : {}),
  };
  return { deps, out, err: errores, preguntas };
}

const ordenes = (): string[] => pedidos.map((p) => p.cuerpo?.orden ?? p.url);
const sinCompartir = (): boolean => !pedidos.some((p) => p.cuerpo?.orden === 'compartir');

describe('wolf: el cliente (D32)', () => {
  it('wolf status --json imprime JSON válido y nunca el token ni una clave', async () => {
    respuestas.estado = ok({
      idioma: 'es',
      sitios: [{ ...SITIO, nota: `usa ${TOKEN} y ${CLAVE}` }],
      servicios: [],
      tuneles: [],
      token: TOKEN,
    });
    const m = montar();
    const codigo = await ejecutarCli(['status', '--json'], m.deps);
    expect(codigo).toBe(SALIDA.BIEN);
    const texto = m.out.join('\n');
    const j = JSON.parse(texto) as { sitios: unknown[] };
    expect(j.sitios).toHaveLength(1);
    expect(texto).not.toContain(TOKEN);
    expect(texto).not.toContain(CLAVE);
    expect(m.err.join('\n')).not.toContain(TOKEN);
  });

  it('manda el token y la cabecera propia, sin Origin ni cabeceras de navegador', async () => {
    const m = montar();
    await ejecutarCli(['status'], m.deps);
    const p = pedidos[0]!;
    expect(p.metodo).toBe('POST');
    expect(p.url).toBe('/orden');
    expect(p.cabeceras.authorization).toBe(`Bearer ${TOKEN}`);
    expect(p.cabeceras['x-wolf-cli']).toBe('1');
    expect(p.cabeceras['content-type']).toBe('application/json');
    expect(p.cabeceras.host).toBe(`127.0.0.1:${puerto}`);
    expect(p.cabeceras.origin).toBeUndefined();
    expect(p.cabeceras['sec-fetch-site']).toBeUndefined();
    expect(p.cuerpo).toEqual({ orden: 'estado', args: {} });
  });

  it('status en texto es legible y no lleva secretos', async () => {
    const m = montar();
    await ejecutarCli(['status'], m.deps);
    const t = m.out.join('\n');
    expect(t).toContain('tienda.test');
    expect(t).toContain('Nginx 1.27');
    expect(t).toContain('encendido');
    expect(t).not.toContain(TOKEN);
  });

  describe('la app no está disponible', () => {
    it('app cerrada: código 3 y mensaje claro, sin llamar a nada', async () => {
      const m = montar({ lectura: { ok: false, motivo: 'ausente' } });
      expect(await ejecutarCli(['status'], m.deps)).toBe(SALIDA.APP_CERRADA);
      expect(m.err.join('\n')).toContain('no está abierto, o la CLI está apagada');
      expect(pedidos).toHaveLength(0);
    });

    it('el mensaje sale en el idioma de la app (config) y, con --json, como JSON en la salida', async () => {
      const m = montar({ lectura: { ok: false, motivo: 'ausente' }, idioma: () => 'fr' });
      expect(await ejecutarCli(['status', '--json'], m.deps)).toBe(SALIDA.APP_CERRADA);
      const j = JSON.parse(m.out.join('\n')) as {
        ok: boolean;
        error: { codigo: string; mensaje: string };
      };
      expect(j.ok).toBe(false);
      expect(j.error.codigo).toBe('wolf.app_cerrada');
      expect(j.error.mensaje).toContain('n’est pas ouvert');
    });

    it('un archivo inseguro nunca se usa ni se ofrece abrir la app', async () => {
      const abrirApp = vi.fn(async () => true);
      const m = montar({ lectura: { ok: false, motivo: 'inseguro' }, abrirApp });
      expect(await ejecutarCli(['status', '--abrir'], m.deps)).toBe(SALIDA.APP_CERRADA);
      expect(abrirApp).not.toHaveBeenCalled();
      expect(m.err.join('\n')).toContain('no es seguro');
    });

    it('pid ajeno o viejo: avisa que es de una sesión anterior', async () => {
      const m = montar({ lectura: { ok: false, motivo: 'proceso' } });
      expect(await ejecutarCli(['status'], m.deps)).toBe(SALIDA.APP_CERRADA);
      expect(m.err.join('\n')).toContain('sesión anterior');
    });

    it('--abrir lanza la app, espera a cli.json y sigue con la orden', async () => {
      let llamadas = 0;
      const abrirApp = vi.fn(async () => true);
      const m = montar({ abrirApp });
      m.deps.leerCliJson = async () =>
        ++llamadas < 3 ? { ok: false, motivo: 'ausente' } : { ok: true, archivo: archivo() };
      expect(await ejecutarCli(['status', '--abrir'], m.deps)).toBe(SALIDA.BIEN);
      expect(abrirApp).toHaveBeenCalledTimes(1);
      expect(m.err.join('\n')).toContain('Abriendo WolfCore Dev');
      expect(ordenes()).toEqual(['estado']);
    });

    it('--abrir que no ve la app a tiempo: código 3', async () => {
      const m = montar({
        lectura: { ok: false, motivo: 'ausente' },
        abrirApp: async () => true,
        esperaAbrirMs: 20,
      });
      expect(await ejecutarCli(['status', '--abrir'], m.deps)).toBe(SALIDA.APP_CERRADA);
      expect(m.err.join('\n')).toContain('no respondió a tiempo');
    });

    it('con token viejo (401) o sin servidor: código 3, no un error de la orden', async () => {
      manejador = (_p, res) => {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify(err('cli.no_autorizado')));
        return true;
      };
      const m = montar();
      expect(await ejecutarCli(['status'], m.deps)).toBe(SALIDA.APP_CERRADA);
      expect(m.err.join('\n')).toContain('rechazó el acceso');
      // puerto sin nadie
      await new Promise<void>((r) => servidor.close(() => r()));
      servidor = http.createServer();
      const m2 = montar();
      expect(await ejecutarCli(['status'], m2.deps)).toBe(SALIDA.APP_CERRADA);
      expect(m2.err.join('\n')).toContain('no responde');
    });
  });

  describe('uso incorrecto (código 2)', () => {
    it.each([
      [[]],
      [['nada']],
      [['status', '--raro']],
      [['status', 'sobra']],
      [['share']],
      [['use', 'php']],
      [['use', 'php@']],
      [['logs', 'x', '--fuente', 'otra']],
      [['logs', 'x', '-n', '0']],
      [['share', 'x', '--global']],
      [['park', 'a', '--quitar']],
      [['start', 'a', '--servicio', 'b']],
    ])('%j', async (argv) => {
      const m = montar();
      expect(await ejecutarCli(argv, m.deps)).toBe(SALIDA.USO);
      expect(pedidos).toHaveLength(0);
    });

    it('--help imprime la ayuda con código 0', async () => {
      const m = montar();
      expect(await ejecutarCli(['--help'], m.deps)).toBe(SALIDA.BIEN);
      expect(m.out.join('\n')).toContain('share <sitio>');
    });
  });

  describe('use', () => {
    it('wolf use php@8.4 manda el servicio, la versión y la carpeta actual', async () => {
      respuestas.usar = ok({ sitio: 'tienda', servicio: 'php', version: '8.4' });
      const m = montar();
      expect(await ejecutarCli(['use', 'php@8.4'], m.deps)).toBe(SALIDA.BIEN);
      expect(pedidos[0]!.cuerpo).toEqual({
        orden: 'usar',
        args: { servicio: 'php', version: '8.4', carpeta: 'C:/sitios/tienda/app' },
      });
      expect(m.out.join('\n')).toContain('tienda usa ahora php 8.4');
    });

    it('node@22 también (runtimes)', async () => {
      respuestas.usar = ok({ sitio: 'tienda', servicio: 'node', version: '22' });
      const m = montar();
      await ejecutarCli(['use', 'Node@22'], m.deps);
      expect(pedidos[0]!.cuerpo!.args).toMatchObject({ servicio: 'node', version: '22' });
    });

    it('--global pregunta en la terminal; "no" no llama; "sí" avisa de la ventana de la app', async () => {
      respuestas.usar = ok({ servicio: 'php', version: '8.4', global: true });
      const no = montar({ respuestasTerminal: ['n'] });
      expect(await ejecutarCli(['use', 'php@8.4', '--global'], no.deps)).toBe(SALIDA.ERROR);
      expect(no.preguntas[0]).toContain('TODAS las terminales');
      expect(pedidos).toHaveLength(0);

      const si = montar({ respuestasTerminal: ['s'] });
      expect(await ejecutarCli(['use', 'php@8.4', '--global'], si.deps)).toBe(SALIDA.BIEN);
      expect(pedidos[0]!.cuerpo!.args).toEqual({
        servicio: 'php',
        version: '8.4',
        global: true,
        si: true,
      });
      expect(si.err.join('\n')).toContain('confirme también en la ventana de WolfCore Dev');
    });

    it('--global sin terminal y sin --si: código 2; con --si no pregunta (la ventana confirma igual)', async () => {
      respuestas.usar = ok({ servicio: 'php', version: '8.4', global: true });
      const a = montar({ tty: false });
      expect(await ejecutarCli(['use', 'php@8.4', '--global'], a.deps)).toBe(SALIDA.USO);
      expect(pedidos).toHaveLength(0);
      const b = montar({ tty: false });
      expect(await ejecutarCli(['use', 'php@8.4', '--global', '--si'], b.deps)).toBe(SALIDA.BIEN);
      expect(b.preguntas).toHaveLength(0);
      expect(b.err.join('\n')).toContain('ventana de WolfCore Dev');
    });
  });

  describe('share', () => {
    beforeEach(() => {
      respuestas.compartir = ok({
        sitio: 'tienda',
        estado: 'activo',
        url: 'https://x.trycloudflare.com',
      });
    });

    it('sin --si pregunta en la terminal y, si se dice que no, no llama a compartir', async () => {
      const m = montar({ respuestasTerminal: [''] });
      expect(await ejecutarCli(['share', 'tienda'], m.deps)).toBe(SALIDA.ERROR);
      expect(m.preguntas[0]).toContain('publicará tienda.test en internet con cloudflare');
      expect(sinCompartir()).toBe(true);
      expect(m.err.join('\n')).toContain('no se hizo nada');
    });

    it('con la terminal cerrada (sin respuesta) tampoco publica', async () => {
      const m = montar({ respuestasTerminal: [null] });
      expect(await ejecutarCli(['share', 'tienda'], m.deps)).toBe(SALIDA.ERROR);
      expect(sinCompartir()).toBe(true);
    });

    it('sin terminal y sin --si: código 2 y no llama', async () => {
      const m = montar({ tty: false });
      expect(await ejecutarCli(['share', 'tienda'], m.deps)).toBe(SALIDA.USO);
      expect(sinCompartir()).toBe(true);
    });

    it('al confirmar manda si, el proveedor visto y avisa de la ventana de la app', async () => {
      const m = montar({ respuestasTerminal: ['sí'] });
      expect(await ejecutarCli(['share', 'tienda'], m.deps)).toBe(SALIDA.BIEN);
      const c = pedidos.find((p) => p.cuerpo?.orden === 'compartir')!;
      expect(c.cuerpo!.args).toEqual({ sitio: 'tienda', si: true, proveedor: 'cloudflare' });
      expect(m.err.join('\n')).toContain('confirme también en la ventana de WolfCore Dev');
      expect(m.out.join('\n')).toContain('Túnel activo: https://x.trycloudflare.com');
    });

    it('--si solo salta la pregunta de la terminal (sigue avisando de la ventana)', async () => {
      const m = montar();
      expect(await ejecutarCli(['share', 'tienda', '--si'], m.deps)).toBe(SALIDA.BIEN);
      expect(m.preguntas).toHaveLength(0);
      expect(m.err.join('\n')).toContain('ventana de WolfCore Dev');
    });

    it('acepta el dominio o el nombre en lugar del id', async () => {
      const m = montar();
      await ejecutarCli(['share', 'TIENDA.test', '--si'], m.deps);
      expect(pedidos.find((p) => p.cuerpo?.orden === 'compartir')!.cuerpo!.args!.sitio).toBe(
        'tienda',
      );
    });

    it('con datos reales, --si no basta: hay que escribir el dominio exacto', async () => {
      const mal = montar({ respuestasTerminal: ['clientes'] });
      expect(await ejecutarCli(['share', 'clientes', '--si'], mal.deps)).toBe(SALIDA.ERROR);
      expect(mal.preguntas[0]).toContain('DATOS REALES');
      expect(sinCompartir()).toBe(true);
      expect(mal.err.join('\n')).toContain('no coincide');

      const bien = montar({ respuestasTerminal: ['clientes.test'] });
      expect(await ejecutarCli(['share', 'clientes', '--si'], bien.deps)).toBe(SALIDA.BIEN);
      expect(pedidos.find((p) => p.cuerpo?.orden === 'compartir')!.cuerpo!.args).toEqual({
        sitio: 'clientes',
        si: true,
        proveedor: 'cloudflare',
        confirmaDatosReales: 'clientes.test',
      });
    });

    it('datos reales sin terminal: solo con --datos-reales=<dominio> exacto', async () => {
      const sin = montar({ tty: false });
      expect(await ejecutarCli(['share', 'clientes', '--si'], sin.deps)).toBe(SALIDA.USO);
      expect(sinCompartir()).toBe(true);
      const mal = montar({ tty: false });
      expect(
        await ejecutarCli(['share', 'clientes', '--si', '--datos-reales=otro.test'], mal.deps),
      ).toBe(SALIDA.ERROR);
      expect(sinCompartir()).toBe(true);
      const bien = montar({ tty: false });
      expect(
        await ejecutarCli(['share', 'clientes', '--si', '--datos-reales=clientes.test'], bien.deps),
      ).toBe(SALIDA.BIEN);
    });

    it('un proveedor distinto al del sitio se rechaza antes de preguntar', async () => {
      const m = montar();
      expect(await ejecutarCli(['share', 'tienda', '--proveedor', 'ngrok'], m.deps)).toBe(
        SALIDA.ERROR,
      );
      expect(m.preguntas).toHaveLength(0);
      expect(sinCompartir()).toBe(true);
      expect(m.err.join('\n')).toContain('cloudflare');
    });

    it('--cerrar no expone nada: no pregunta', async () => {
      respuestas.compartir = ok({ sitio: 'tienda', estado: 'apagado', url: null });
      const m = montar();
      expect(await ejecutarCli(['share', 'tienda', '--cerrar'], m.deps)).toBe(SALIDA.BIEN);
      expect(m.preguntas).toHaveLength(0);
      expect(pedidos.at(-1)!.cuerpo!.args).toEqual({ sitio: 'tienda', cerrar: true });
    });

    it('un sitio que no existe: error de la orden con su texto', async () => {
      const m = montar();
      expect(await ejecutarCli(['share', 'nada', '--si'], m.deps)).toBe(SALIDA.ERROR);
      expect(m.err.join('\n')).toContain('El sitio nada no existe.');
      expect(sinCompartir()).toBe(true);
    });
  });

  describe('errores del servidor', () => {
    it('salen traducidos al idioma de la app y con código de salida 1', async () => {
      respuestas.asegurar = err('cli.sitio_no_encontrado', { sitio: 'x' });
      for (const [idioma, trozo] of [
        ['es', 'no existe'],
        ['en', 'does not exist'],
        ['pt', 'não existe'],
        ['fr', 'n’existe pas'],
      ] as const) {
        const m = montar({ idiomaApp: idioma });
        expect(await ejecutarCli(['secure', 'tienda'], m.deps)).toBe(SALIDA.ERROR);
        expect(m.err.join('\n')).toContain(trozo);
      }
    });

    it('con --json el error va como JSON con el código estable', async () => {
      respuestas.asegurar = err('cli.requiere_confirmacion', { sitio: 'tienda' });
      const m = montar();
      expect(await ejecutarCli(['secure', 'tienda', '--json'], m.deps)).toBe(SALIDA.ERROR);
      const j = JSON.parse(m.out.join('\n')) as {
        error: { codigo: string; datos: { sitio: string } };
      };
      expect(j.error.codigo).toBe('cli.requiere_confirmacion');
      expect(j.error.datos.sitio).toBe('tienda');
    });

    it('un texto de error con un secreto sale enmascarado', async () => {
      respuestas.asegurar = err('cli.error', { detalle: `falló con --token ${CLAVE} y ${TOKEN}` });
      const m = montar();
      await ejecutarCli(['secure', 'tienda'], m.deps);
      const t = m.err.join('\n');
      expect(t).not.toContain(CLAVE);
      expect(t).not.toContain(TOKEN);
    });
  });

  describe('logs', () => {
    it('los registros salen sin secuencias de escape ni secretos', async () => {
      respuestas.registros = ok({
        sitio: 'tienda',
        fuente: 'error',
        lineas: [
          `\u001b[31mrojo\u001b[0m`,
          `\u001b]0;titulo\u0007x`,
          `API_KEY=${CLAVE}`,
          'normal\ttab',
        ],
      });
      const m = montar();
      expect(await ejecutarCli(['logs', 'tienda', '-n', '5', '--fuente', 'acceso'], m.deps)).toBe(
        SALIDA.BIEN,
      );
      const t = m.out.join('\n');
      expect(t).not.toContain('\u001b');
      expect(t).not.toContain('\u0007');
      expect(t).not.toContain(CLAVE);
      expect(t).toContain('normal\ttab');
      expect(pedidos.at(-1)!.cuerpo!.args).toEqual({
        sitio: 'tienda',
        fuente: 'acceso',
        lineas: 5,
      });
    });

    it('logs -f sigue el flujo NDJSON y termina con código 3 si la app se cierra', async () => {
      manejador = (p, res) => {
        if (!p.url.startsWith('/registros')) return false;
        res.writeHead(200, { 'content-type': 'application/x-ndjson' });
        res.write(`${JSON.stringify({ lineas: ['uno', '\u001b[2Jdos'] })}\n`);
        res.end(`${JSON.stringify({ lineas: ['tres'] })}\n`);
        return true;
      };
      const m = montar();
      let lecturas = 0;
      m.deps.leerCliJson = async () =>
        ++lecturas === 1 ? { ok: true, archivo: archivo() } : { ok: false, motivo: 'ausente' };
      expect(await ejecutarCli(['logs', 'tienda', '-f'], m.deps)).toBe(SALIDA.APP_CERRADA);
      // El ESC se quita: lo que queda ('[2J') es texto inofensivo, no una orden de la terminal.
      expect(m.out).toEqual(['uno', '[2Jdos', 'tres']);
      const g = pedidos.find((p) => p.url.startsWith('/registros'))!;
      expect(g.url).toContain('sitio=tienda');
      expect(g.url).toContain('seguir=1');
      expect(g.cabeceras.authorization).toBe(`Bearer ${TOKEN}`);
      expect(g.cabeceras['x-wolf-cli']).toBe('1');
    });

    it('logs -f con --json imprime una línea JSON por registro', async () => {
      manejador = (p, res) => {
        if (!p.url.startsWith('/registros')) return false;
        res.writeHead(200, { 'content-type': 'application/x-ndjson' });
        res.end(`${JSON.stringify({ lineas: [`k=${CLAVE}`, 'b'] })}\n`);
        return true;
      };
      const m = montar();
      let lecturas = 0;
      m.deps.leerCliJson = async () =>
        ++lecturas === 1 ? { ok: true, archivo: archivo() } : { ok: false, motivo: 'ausente' };
      await ejecutarCli(['logs', 'tienda', '-f', '--json'], m.deps);
      for (const l of m.out) expect(() => JSON.parse(l)).not.toThrow();
      expect(m.out.join('\n')).not.toContain(CLAVE);
    });

    it('logs -f: Ctrl+C (la señal) termina con código 0', async () => {
      const corte = new AbortController();
      manejador = (p, res) => {
        if (!p.url.startsWith('/registros')) return false;
        res.writeHead(200, { 'content-type': 'application/x-ndjson' });
        res.write(`${JSON.stringify({ lineas: ['a'] })}\n`);
        setTimeout(() => corte.abort(), 20);
        return true;
      };
      const m = montar({ senal: corte.signal });
      expect(await ejecutarCli(['logs', 'tienda', '-f'], m.deps)).toBe(SALIDA.BIEN);
      expect(m.out).toEqual(['a']);
    });
  });

  describe('otras órdenes', () => {
    it('link usa la carpeta dada (o la actual) y muestra el sitio', async () => {
      respuestas.vincular = ok({
        sitio: SITIO,
        aplicar: { nginx: true, hosts: true, httpsPendiente: false },
      });
      const m = montar();
      await ejecutarCli(['link', '--nombre', 'Mi tienda', '--dominio=mi.test'], m.deps);
      expect(pedidos[0]!.cuerpo!.args).toEqual({
        carpeta: path.resolve('C:/sitios/tienda/app'),
        nombre: 'Mi tienda',
        dominio: 'mi.test',
      });
      expect(m.out.join('\n')).toContain('Sitio vinculado: Tienda → https://tienda.test');
    });

    it('park --quitar deja de vigilar', async () => {
      respuestas.vigilar = ok({ carpeta: null, sugerencias: 0 });
      const m = montar();
      await ejecutarCli(['park', '--quitar'], m.deps);
      expect(pedidos[0]!.cuerpo!.args).toEqual({ carpeta: null });
    });

    it('open avisa si la app no pudo abrir el navegador', async () => {
      respuestas.abrir = ok({ sitio: 'tienda', url: 'https://tienda.test', abierto: false });
      const m = montar();
      expect(await ejecutarCli(['open', 'tienda'], m.deps)).toBe(SALIDA.BIEN);
      expect(m.out.join('\n')).toContain('https://tienda.test');
    });

    it('secure avisa si falta confiar en la autoridad', async () => {
      respuestas.asegurar = ok({ sitio: SITIO, ya: false, caConfiable: false });
      const m = montar();
      await ejecutarCli(['secure', 'tienda'], m.deps);
      expect(m.out.join('\n')).toContain('autoridad');
    });

    it('doctor muestra los hallazgos con su texto traducido', async () => {
      respuestas.doctor = ok({
        hallazgos: [
          {
            id: 'a',
            revision: 'puertos',
            gravedad: 'aviso',
            codigo: 'doctor.puerto_ocupado',
            datos: { puerto: 80, servicio: 'nginx', proceso: 'x.exe' },
          },
        ],
      });
      const m = montar();
      expect(await ejecutarCli(['doctor'], m.deps)).toBe(SALIDA.BIEN);
      expect(m.out.join('\n')).toContain('El puerto 80 de nginx lo usa otro programa (x.exe).');
    });

    it('start: sin nombre enciende todo; un workspace; un servicio con punto o @ va directo', async () => {
      respuestas.iniciar = ok({ todo: true });
      const a = montar();
      await ejecutarCli(['start'], a.deps);
      expect(pedidos.at(-1)!.cuerpo).toEqual({ orden: 'iniciar', args: {} });

      respuestas.iniciar = ok({
        workspace: 'bot',
        resultados: [{ elemento: 'redis', ok: true, encendido: true }],
      });
      await ejecutarCli(['start', 'bot'], montar().deps);
      expect(pedidos.at(-1)!.cuerpo!.args).toEqual({ workspace: 'bot' });

      respuestas.iniciar = ok({ servicio: 'php-8.4', estado: 'encendido' });
      pedidos = [];
      await ejecutarCli(['start', 'php-8.4'], montar().deps);
      expect(ordenes()).toEqual(['iniciar']);
      expect(pedidos[0]!.cuerpo!.args).toEqual({ servicio: 'php-8.4' });
    });

    it('stop: si no hay workspace con ese nombre y es un servicio conocido, lo prueba como servicio', async () => {
      respuestas.detener = err('workspaces.no_existe');
      let detener = 0;
      manejador = (p, res) => {
        if (p.cuerpo?.orden !== 'detener') return false;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify(
            ++detener === 1
              ? err('workspaces.no_existe')
              : ok({ servicio: 'nginx', estado: 'apagado' }),
          ),
        );
        return true;
      };
      const m = montar();
      expect(await ejecutarCli(['stop', 'nginx'], m.deps)).toBe(SALIDA.BIEN);
      expect(
        pedidos.filter((p) => p.cuerpo?.orden === 'detener').map((p) => p.cuerpo!.args),
      ).toEqual([{ workspace: 'nginx' }, { servicio: 'nginx' }]);
    });

    it('stop de un nombre que no es workspace ni servicio: el error es el del workspace', async () => {
      respuestas.detener = err('workspaces.no_existe');
      const m = montar();
      expect(await ejecutarCli(['stop', 'bot'], m.deps)).toBe(SALIDA.ERROR);
      expect(pedidos.filter((p) => p.cuerpo?.orden === 'detener')).toHaveLength(1);
      expect(m.err.join('\n')).toContain('workspace');
    });

    it('un elemento de workspace que falla da código 1', async () => {
      respuestas.iniciar = ok({
        workspace: 'bot',
        resultados: [
          { elemento: 'redis', ok: false, encendido: false, codigo: 'servicios.puerto_ocupado' },
        ],
      });
      expect(await ejecutarCli(['start', 'bot'], montar().deps)).toBe(SALIDA.ERROR);
    });
  });
});

describe('textos del cliente', () => {
  it('textoSeguro quita control, secretos y el token', () => {
    expect(textoSeguro(`a\u001b[31mb ${TOKEN} --token=-${CLAVE}`, TOKEN)).not.toMatch(
      new RegExp(`${TOKEN}|${CLAVE}|\u001b`),
    );
  });

  it('los cuatro idiomas tienen los mismos textos y la ayuda nombra todas las órdenes', () => {
    const claves = Object.keys(TEXTOS_CLI.es).sort();
    for (const i of ['en', 'pt', 'fr'] as Idioma[]) {
      expect(Object.keys(TEXTOS_CLI[i]).sort()).toEqual(claves);
    }
    for (const i of ['es', 'en', 'pt', 'fr'] as Idioma[]) {
      for (const o of [
        'status',
        'link',
        'park',
        'use',
        'secure',
        'share',
        'open',
        'logs',
        'doctor',
        'start',
        'stop',
      ]) {
        expect(TEXTOS_CLI[i].uso).toContain(`  ${o} `);
      }
    }
  });

  it('todos los códigos cli.* del servidor tienen texto en los cuatro idiomas', async () => {
    const { PARAMETROS_ERROR } = await import('@pel/core');
    const codigos = Object.keys(PARAMETROS_ERROR).filter((c) => c.startsWith('cli.'));
    expect(codigos.length).toBeGreaterThan(20);
    for (const i of ['es', 'en', 'pt', 'fr'] as Idioma[]) {
      for (const c of codigos) {
        expect(
          textoDeCodigo(
            c,
            {
              sitio: 'x',
              tipo: 'x',
              servicio: 'x',
              version: '1',
              proveedor: 'p',
              maximo: 1,
              detalle: 'd',
            },
            i,
          ),
          `${i} ${c}`,
        ).not.toBe(c);
      }
    }
  });

  it('idiomaDeLocale', () => {
    expect(idiomaDeLocale('pt_BR.UTF-8')).toBe('pt');
    expect(idiomaDeLocale('fr-CA')).toBe('fr');
    expect(idiomaDeLocale('en_US')).toBe('en');
    expect(idiomaDeLocale('de-DE')).toBe('es');
    expect(idiomaDeLocale(undefined)).toBe('es');
  });
});

describe('carpeta de datos del cliente', () => {
  it('WOLFCORE_DATOS manda; si no, la carpeta que contiene bin/cli; si no, la de siempre', () => {
    const base = path.resolve('/x/datos');
    expect(carpetaDatosCli({ WOLFCORE_DATOS: base }, path.join(base, 'bin', 'cli'))).toBe(base);
    expect(carpetaDatosCli({}, path.join(base, 'bin', 'cli'))).toBe(base);
    expect(carpetaDatosCli({ LOCALAPPDATA: 'C:\\L' }, path.resolve('/otro'), 'win32')).toBe(
      'C:\\L\\WolfCoreDev',
    );
    // una ruta relativa en la variable no vale
    expect(carpetaDatosCli({ WOLFCORE_DATOS: 'rel' }, path.join(base, 'bin', 'cli'))).toBe(base);
  });
});

describe('abrir la app con --abrir', () => {
  it('no hereda ELECTRON_RUN_AS_NODE y pasa --iniciar-todo (una sola vez, sin segunda instancia propia)', async () => {
    vi.resetModules();
    const spawn = vi.fn(() => ({ on: vi.fn(), unref: vi.fn() }));
    vi.doMock('node:child_process', () => ({ spawn, execFile: vi.fn() }));
    const { lanzarApp } = await import('../src/cli/entorno');
    Object.defineProperty(process.versions, 'electron', { value: '45.0.0', configurable: true });
    try {
      expect(
        lanzarApp({
          ELECTRON_RUN_AS_NODE: '1',
          WOLFCORE_APP_DIR: 'C:\\repo\\apps\\desktop',
          PATH: 'x',
        }),
      ).toBe(true);
      const llamada = spawn.mock.calls[0] as unknown as [
        string,
        string[],
        { env: Record<string, string>; detached: boolean },
      ];
      expect(llamada[1]).toEqual(['C:\\repo\\apps\\desktop', '--iniciar-todo']);
      expect(llamada[2].env.ELECTRON_RUN_AS_NODE).toBeUndefined();
      expect(llamada[2].env.WOLFCORE_APP_DIR).toBeUndefined();
      expect(llamada[2].env.PATH).toBe('x');
      expect(llamada[2].detached).toBe(true);
    } finally {
      Reflect.deleteProperty(process.versions, 'electron');
      vi.doUnmock('node:child_process');
      vi.resetModules();
    }
  });

  it('sin Electron (otro Node) no lanza nada', async () => {
    vi.resetModules();
    const spawn = vi.fn();
    vi.doMock('node:child_process', () => ({ spawn, execFile: vi.fn() }));
    const { lanzarApp } = await import('../src/cli/entorno');
    const antes = Object.getOwnPropertyDescriptor(process.versions, 'electron');
    Reflect.deleteProperty(process.versions, 'electron');
    try {
      expect(lanzarApp({})).toBe(false);
      expect(spawn).not.toHaveBeenCalled();
    } finally {
      if (antes) Object.defineProperty(process.versions, 'electron', antes);
      vi.doUnmock('node:child_process');
      vi.resetModules();
    }
  });
});

describe('leer run/cli.json con comprobaciones', () => {
  let dir = '';
  let ruta = '';
  const deps = (o: Partial<DepsLectura> = {}): DepsLectura => ({
    pidVivo: () => true,
    imagenDe: async () => 'WolfCore Dev.exe',
    imagenEsperada: 'wolfcore dev.exe',
    aclDe: async () => ['DESKTOP\\yo:(F)'],
    usuarios: ['yo', ''],
    plataforma: 'win32',
    uidActual: null,
    ...o,
  });
  const contenido = (o: Partial<ArchivoCli> = {}): string =>
    JSON.stringify({
      puerto: 4321,
      token: TOKEN,
      pid: 1234,
      version: { app: '1', idioma: 'en' },
      ...o,
    });

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'pel-wolf-'));
    await mkdir(path.join(dir, 'run'));
    ruta = path.join(dir, 'run', 'cli.json');
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('un archivo bueno se lee', async () => {
    await writeFile(ruta, contenido());
    const r = await leerArchivoCliSeguro(ruta, deps());
    expect(r).toMatchObject({ ok: true, archivo: { puerto: 4321, pid: 1234 } });
  });

  it('sin archivo: ausente', async () => {
    expect(await leerArchivoCliSeguro(ruta, deps())).toEqual({ ok: false, motivo: 'ausente' });
  });

  it('un enlace nunca se usa', async () => {
    await writeFile(path.join(dir, 'otro.json'), contenido());
    try {
      await symlink(path.join(dir, 'otro.json'), ruta);
    } catch {
      return; // sin permiso para enlaces simbólicos en este equipo
    }
    expect(await leerArchivoCliSeguro(ruta, deps())).toEqual({ ok: false, motivo: 'inseguro' });
  });

  it('una carpeta run/ que es un enlace no se usa', async () => {
    const real = path.join(dir, 'real');
    await mkdir(real);
    await writeFile(path.join(real, 'cli.json'), contenido());
    await rm(path.join(dir, 'run'), { recursive: true });
    try {
      await symlink(real, path.join(dir, 'run'), 'junction');
    } catch {
      return;
    }
    expect(await leerArchivoCliSeguro(ruta, deps())).toEqual({ ok: false, motivo: 'inseguro' });
  });

  it('un pid que no vive, o que no es WolfCore, es un archivo viejo', async () => {
    await writeFile(ruta, contenido());
    expect(await leerArchivoCliSeguro(ruta, deps({ pidVivo: () => false }))).toEqual({
      ok: false,
      motivo: 'proceso',
    });
    expect(await leerArchivoCliSeguro(ruta, deps({ imagenDe: async () => 'notepad.exe' }))).toEqual(
      { ok: false, motivo: 'proceso' },
    );
    expect(await leerArchivoCliSeguro(ruta, deps({ imagenDe: async () => null }))).toEqual({
      ok: false,
      motivo: 'proceso',
    });
  });

  it('ACL ajena, ilegible o con más de una entrada: inseguro (Windows)', async () => {
    await writeFile(ruta, contenido());
    const casos: (string[] | null)[] = [
      ['DESKTOP\\otro:(F)'],
      ['DESKTOP\\yo:(F)', 'BUILTIN\\Users:(R)'],
      ['DESKTOP\\yo:(I)(F)'],
      null,
      [],
    ];
    for (const acl of casos) {
      expect(
        await leerArchivoCliSeguro(ruta, deps({ aclDe: async () => acl })),
        JSON.stringify(acl),
      ).toEqual({
        ok: false,
        motivo: 'inseguro',
      });
    }
  });

  it('formas rotas: ilegible', async () => {
    for (const malo of [
      'no es json',
      '{}',
      contenido({ puerto: 0 }),
      contenido({ puerto: 70000 }),
      contenido({ token: 'corto' }),
      contenido({ token: `${TOKEN}\n` }),
      contenido({ pid: -1 }),
    ]) {
      await writeFile(ruta, malo);
      expect(await leerArchivoCliSeguro(ruta, deps()), malo).toEqual({
        ok: false,
        motivo: 'ilegible',
      });
    }
  });

  it('un archivo enorme no se lee', async () => {
    await writeFile(ruta, 'x'.repeat(10_000));
    expect(await leerArchivoCliSeguro(ruta, deps())).toEqual({ ok: false, motivo: 'inseguro' });
  });

  it('aclEsSoloDelUsuario y entradasDeIcacls', () => {
    expect(aclEsSoloDelUsuario(['PC\\Yo:(F)'], ['yo'])).toBe(true);
    expect(aclEsSoloDelUsuario(['PC\\Yo:(OI)(CI)(F)'], ['yo'])).toBe(true);
    expect(aclEsSoloDelUsuario(['PC\\Otro:(F)'], ['yo'])).toBe(false);
    expect(aclEsSoloDelUsuario(['PC\\Yo:(F)'], [''])).toBe(false);
    const salida = `C:\\d d\\run\\cli.json PC\\Yo:(F)\r\n\r\nSuccessfully processed 1 files; Failed processing 0 files\r\n`;
    expect(entradasDeIcacls(salida, 'C:\\d d\\run\\cli.json')).toEqual(['PC\\Yo:(F)']);
    const heredado = `C:\\x\\cli.json BUILTIN\\Administrators:(I)(F)\r\n               NT AUTHORITY\\SYSTEM:(I)(F)\r\n`;
    expect(entradasDeIcacls(heredado, 'C:\\x\\cli.json')).toHaveLength(2);
  });
});
