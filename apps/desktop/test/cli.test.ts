import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aclEsDelUsuarioPorSid,
  appAbierta,
  argumentosPowerShell,
  scriptAclUsuario,
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

describe('revisión D32', () => {
  it('--json: una línea con password=... sigue siendo JSON válido (no se vuelve a enmascarar el texto)', async () => {
    respuestas.estado = ok({
      idioma: 'es',
      sitios: [{ ...SITIO, nota: `DB_PASSWORD=${CLAVE} y password=otra-falsa` }],
      servicios: [],
      tuneles: [],
    });
    const m = montar();
    expect(await ejecutarCli(['status', '--json'], m.deps)).toBe(SALIDA.BIEN);
    const j = JSON.parse(m.out.join('\n')) as { sitios: { nota: string }[] };
    expect(j.sitios[0]!.nota).not.toContain(CLAVE);
    expect(j.sitios[0]!.nota).toContain('password=***');

    // También el error en JSON
    respuestas.asegurar = err('cli.error', { detalle: 'falló password=otra-falsa' });
    const e = montar();
    await ejecutarCli(['secure', 'tienda', '--json'], e.deps);
    const je = JSON.parse(e.out.join('\n')) as { error: { datos: { detalle: string } } };
    expect(je.error.datos.detalle).toContain('password=***');
  });

  it('logs -f --json: cada línea es JSON aunque lleve password=', async () => {
    manejador = (p, res) => {
      if (!p.url.startsWith('/registros')) return false;
      res.writeHead(200, { 'content-type': 'application/x-ndjson' });
      res.end(`${JSON.stringify({ lineas: ['conexion password=clave-falsa-1', 'b'] })}\n`);
      return true;
    };
    const m = montar();
    let n = 0;
    m.deps.leerCliJson = async () =>
      ++n === 1 ? { ok: true, archivo: archivo() } : { ok: false, motivo: 'ausente' };
    await ejecutarCli(['logs', 'tienda', '-f', '--json'], m.deps);
    const lineas = m.out.map((l) => JSON.parse(l) as { linea: string });
    expect(lineas[0]!.linea).toBe('conexion password=***');
    expect(lineas).toHaveLength(2);
  });

  it('--token -x (con espacio y un valor que empieza por guion) no se enmascara a propósito', () => {
    expect(textoSeguro('wolf --token -x', null)).toBe('wolf --token -x');
    expect(textoSeguro('wolf --token=-x', null)).toBe('wolf --token=***');
  });

  describe('--abrir con la app abierta pero la CLI apagada', () => {
    it('avisa de activar wolf en Ajustes y NO lanza la app (ni --iniciar-todo)', async () => {
      const abrirApp = vi.fn(async () => true);
      const m = montar({ lectura: { ok: false, motivo: 'ausente' }, abrirApp });
      m.deps.appAbierta = async () => true;
      expect(await ejecutarCli(['status', '--abrir'], m.deps)).toBe(SALIDA.APP_CERRADA);
      expect(abrirApp).not.toHaveBeenCalled();
      expect(m.err.join('\n')).toContain('la CLI está apagada. Active wolf en Ajustes');
    });

    it('sin app abierta sí la lanza', async () => {
      const abrirApp = vi.fn(async () => true);
      const m = montar({ lectura: { ok: false, motivo: 'ausente' }, abrirApp, esperaAbrirMs: 10 });
      m.deps.appAbierta = async () => false;
      await ejecutarCli(['status', '--abrir'], m.deps);
      expect(abrirApp).toHaveBeenCalledTimes(1);
    });

    it('sin --abrir también da el mensaje preciso', async () => {
      const m = montar({ lectura: { ok: false, motivo: 'ausente' } });
      m.deps.appAbierta = async () => true;
      expect(await ejecutarCli(['status'], m.deps)).toBe(SALIDA.APP_CERRADA);
      expect(m.err.join('\n')).toContain('Active wolf en Ajustes');
    });
  });

  it('logs -f no repite la última línea al reconectar', async () => {
    let conexion = 0;
    manejador = (p, res) => {
      if (!p.url.startsWith('/registros')) return false;
      conexion++;
      const lineas = conexion === 1 ? ['a', 'b'] : ['b', 'c'];
      res.writeHead(200, { 'content-type': 'application/x-ndjson' });
      res.end(`${JSON.stringify({ lineas })}\n`);
      return true;
    };
    const m = montar();
    let n = 0;
    m.deps.leerCliJson = async () =>
      ++n <= 2 ? { ok: true, archivo: archivo() } : { ok: false, motivo: 'ausente' };
    await ejecutarCli(['logs', 'tienda', '-f'], m.deps);
    expect(m.out).toEqual(['a', 'b', 'c']);
    // al reconectar pide solo la última línea
    const pedidosLogs = pedidos.filter((p) => p.url.startsWith('/registros'));
    expect(pedidosLogs[1]!.url).toContain('lineas=1');
  });

  it('una respuesta gigante se corta (contador de bytes) y sale como app que no responde', async () => {
    manejador = (_p, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.write('x'.repeat(1024 * 1024));
      const timer = setInterval(() => {
        if (res.destroyed) return clearInterval(timer);
        res.write('x'.repeat(4 * 1024 * 1024));
      }, 1);
      res.on('close', () => clearInterval(timer));
      return true;
    };
    const m = montar();
    expect(await ejecutarCli(['status'], m.deps)).toBe(SALIDA.APP_CERRADA);
    expect(m.err.join('\n')).toContain('no responde');
  });

  it('una línea de registro sin salto de línea de más de 1 MB corta el seguimiento', async () => {
    manejador = (p, res) => {
      if (!p.url.startsWith('/registros')) return false;
      res.writeHead(200, { 'content-type': 'application/x-ndjson' });
      const timer = setInterval(() => {
        if (res.destroyed) return clearInterval(timer);
        res.write('y'.repeat(600 * 1024));
      }, 1);
      res.on('close', () => clearInterval(timer));
      return true;
    };
    const m = montar();
    expect(await ejecutarCli(['logs', 'tienda', '-f'], m.deps)).toBe(SALIDA.APP_CERRADA);
  });

  it('electron-builder.yml no apaga el fuse RunAsNode (wolf.cmd lo necesita) y lo documenta', async () => {
    const { readFile } = await import('node:fs/promises');
    const yml = await readFile(path.join(__dirname, '..', 'electron-builder.yml'), 'utf8');
    expect(yml).toMatch(/RunAsNode/);
    // Ninguna configuración de fuses que lo desactive
    expect(yml).not.toMatch(/^\s*(electronFuses|runAsNode)\s*:/im);
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
  }, 30_000);

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
    aclEsDelUsuario: async () => true,
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

  it('ACL que no es solo del usuario (por SID), o que falla, es inseguro (Windows)', async () => {
    await writeFile(ruta, contenido());
    for (const aclEsDelUsuario of [
      async () => false,
      async () => {
        throw new Error('powershell no respondio');
      },
    ]) {
      expect(await leerArchivoCliSeguro(ruta, deps({ aclEsDelUsuario }))).toEqual({
        ok: false,
        motivo: 'inseguro',
      });
    }
    // Sin la comprobación disponible tampoco se usa (falla cerrado)
    const { aclEsDelUsuario: _a, ...sin } = deps();
    void _a;
    expect(await leerArchivoCliSeguro(ruta, sin)).toEqual({ ok: false, motivo: 'inseguro' });
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

  it('EPERM al señalar el pid significa que el proceso está vivo', async () => {
    const { depsLecturaReales } = await import('../src/cli/archivoCli');
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('x'), { code: 'EPERM' });
    });
    expect(depsLecturaReales().pidVivo(4242)).toBe(true);
    kill.mockImplementation(() => {
      throw Object.assign(new Error('x'), { code: 'ESRCH' });
    });
    expect(depsLecturaReales().pidVivo(4242)).toBe(false);
    kill.mockRestore();
  });

  it('appAbierta: run/app.pid de un proceso vivo de WolfCore (y nada más)', async () => {
    const pid = path.join(dir, 'run', 'app.pid');
    await writeFile(pid, '1234');
    expect(await appAbierta(pid, deps())).toBe(true);
    expect(await appAbierta(pid, deps({ pidVivo: () => false }))).toBe(false);
    expect(await appAbierta(pid, deps({ imagenDe: async () => 'chrome.exe' }))).toBe(false);
    await writeFile(pid, 'no-numero');
    expect(await appAbierta(pid, deps())).toBe(false);
    expect(await appAbierta(path.join(dir, 'run', 'nada.pid'), deps())).toBe(false);
  });
});

describe('ACL por SID con PowerShell -EncodedCommand (I1)', () => {
  const SISTEMA = 'C:\\Windows\\System32';

  it('el script compara dueño y regla con el SID actual y no menciona ningún nombre de cuenta', () => {
    const sc = scriptAclUsuario('C:\\datos\\run\\cli.json');
    expect(sc).toContain('WindowsIdentity]::GetCurrent().User.Value');
    expect(sc).toContain('GetOwner([System.Security.Principal.SecurityIdentifier])');
    expect(sc).toContain('$r.Count -eq 1');
    expect(sc).toContain('-not $r[0].IsInherited');
    expect(sc).toContain('Translate([System.Security.Principal.SecurityIdentifier])');
    expect(sc).not.toMatch(/USERNAME|USERDOMAIN|whoami/i);
    expect(sc).toContain("Get-Acl -LiteralPath 'C:\\datos\\run\\cli.json'");
  });

  it('una ruta con comillas tipográficas o apóstrofos queda dentro del literal (sin inyección)', () => {
    const sc = scriptAclUsuario("C:\\O’x’; Write-Output INYECTADO; ‘y\\a‚b‛c'd\\cli.json");
    expect(sc).toContain(
      "Get-Acl -LiteralPath 'C:\\O’’x’’; Write-Output INYECTADO; ‘‘y\\a‚‚b‛‛c''d\\cli.json'",
    );
  });

  it('un usuario con caracteres no ASCII: la ruta viaja intacta en Base64 y la salida es ASCII', async () => {
    const ruta = "C:\\Usuarios\\José Peña\\O'Brien\\run\\cli.json";
    const vistos: { cmd: string; args: string[] }[] = [];
    const ok = await aclEsDelUsuarioPorSid(
      ruta,
      async (cmd, args) => {
        vistos.push({ cmd, args });
        return 'SI';
      },
      SISTEMA,
    );
    expect(ok).toBe(true);
    const { cmd, args } = vistos[0]!;
    expect(cmd).toBe(SISTEMA + '\\WindowsPowerShell\\v1.0\\powershell.exe');
    expect(args.slice(0, 5)).toEqual([
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-EncodedCommand',
    ]);
    // Los argumentos son ASCII puro (nada se corrompe por la página de códigos)
    for (const a of args) expect(a).toMatch(/^[\x20-\x7e]+$/);
    const script = Buffer.from(args[5]!, 'base64').toString('utf16le');
    expect(script).toContain("'C:\\Usuarios\\José Peña\\O''Brien\\run\\cli.json'");
    expect(argumentosPowerShell('é')[5]).toBe(Buffer.from('é', 'utf16le').toString('base64'));
  });

  it('solo SI vale: NO, vacío, error o salida rara son false', async () => {
    for (const salida of ['NO', '', null, 'SI\nNO', 'Error']) {
      expect(
        await aclEsDelUsuarioPorSid('C:\\x', async () => salida, SISTEMA),
        String(salida),
      ).toBe(false);
    }
    expect(await aclEsDelUsuarioPorSid('C:\\x', async () => ' SI\r\n', SISTEMA)).toBe(true);
  });
});
