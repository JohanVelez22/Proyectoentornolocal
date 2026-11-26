import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ORDENES_CLI } from '../src/cli/esquemas';
import { enmascararSecretos } from '../src/patronesSecretos';
import type { OperacionesCli } from '../src/cli/ordenes';
import { ServidorCli, type ArchivoCli } from '../src/cli/servidor';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { Rutas } from '../src/rutas';
import { ConfigSchema, ProcesoProyectoSchema, SitioSchema, type Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

/** Clave de prueba obviamente falsa: no debe salir en ninguna respuesta. */
const CENTINELA = 'centinela-secreta-d';

const servidores: ServidorCli[] = [];
const nucleos: Nucleo[] = [];
afterEach(async () => {
  for (const s of servidores.splice(0)) await s.detener();
  for (const n of nucleos.splice(0))
    await n.cerrar({ detenerServicios: false }).catch(() => undefined);
});

interface Respuesta {
  estado: number;
  cabeceras: http.IncomingHttpHeaders;
  texto: string;
  json: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Petición cruda (fetch no deja cambiar `Host`). */
function pedir(
  puerto: number,
  o: {
    metodo?: string;
    ruta?: string;
    cabeceras?: Record<string, string | undefined>;
    cuerpo?: string | Buffer;
  } = {},
): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    const cab: Record<string, string> = {};
    for (const [k, v] of Object.entries(o.cabeceras ?? {})) if (v !== undefined) cab[k] = v;
    const req = http.request(
      {
        host: '127.0.0.1',
        port: puerto,
        method: o.metodo ?? 'GET',
        path: o.ruta ?? '/',
        headers: cab,
      },
      (res) => {
        const partes: Buffer[] = [];
        res.on('data', (d: Buffer) => partes.push(d));
        res.on('end', () => {
          const texto = Buffer.concat(partes).toString('utf8');
          let json: Record<string, unknown> = {};
          try {
            json = JSON.parse(texto) as Record<string, unknown>;
          } catch {
            // no es JSON (flujo)
          }
          resolve({ estado: res.statusCode ?? 0, cabeceras: res.headers, texto, json });
        });
      },
    );
    req.on('error', reject);
    req.end(o.cuerpo);
  });
}

const SITIO = SitioSchema.parse({
  id: 'tienda',
  nombre: 'Tienda',
  dominio: 'tienda.test',
  carpeta: 'C:/no-importa',
  tipo: 'estatico',
});
const SITIO_REAL = SitioSchema.parse({
  ...SITIO,
  id: 'clientes',
  dominio: 'clientes.test',
  datosReales: true,
});

function operacionesFalsas(sitios: Sitio[] = [SITIO, SITIO_REAL]): OperacionesCli {
  return {
    carpetaDatos: () => 'C:/datos-wolf',
    sitios: vi.fn(async () => sitios),
    puertosWeb: vi.fn(async () => ({ http: 80, https: 443 })),
    idioma: vi.fn(async () => 'es'),
    estadoServicios: vi.fn(async () => []),
    estadosTuneles: vi.fn(() => []),
    detectar: vi.fn(async () => ({
      tipo: 'estatico' as const,
      php: null,
      sugerenciaDominio: 'nuevo.test',
      urlBaseVar: null,
    })),
    guardarSitio: vi.fn(),
    cambiarCarpetaVigilada: vi.fn(async () => undefined),
    sugerenciasProyectos: vi.fn(async () => []),
    phpInstaladas: vi.fn(async () => ['8.3', '8.4']),
    runtimesInstalados: vi.fn(async () => []),
    cambiarPhpPorDefecto: vi.fn(async () => undefined),
    abrirTunel: vi.fn(async (id) => ({
      sitioId: id,
      estado: 'activo' as const,
      url: 'https://x.trycloudflare.com',
    })),
    cerrarTunel: vi.fn(async () => undefined),
    revisarDoctor: vi.fn(async () => []),
    fuentesRegistro: vi.fn(async () => [{ id: 'sitio:tienda:error' }]),
    leerRegistro: vi.fn(async () => ['linea 1', 'linea 2']),
    seguirRegistro: vi.fn(async () => () => undefined),
    workspaces: vi.fn(async () => []),
    iniciarWorkspace: vi.fn(async () => []),
    detenerWorkspace: vi.fn(async () => []),
    iniciarServicio: vi.fn(async () => undefined),
    detenerServicio: vi.fn(async () => undefined),
    iniciarTodo: vi.fn(async () => undefined),
    detenerTodo: vi.fn(async () => undefined),
    caConfiable: vi.fn(async () => true),
  };
}

interface Montado {
  s: ServidorCli;
  rutas: Rutas;
  ops: OperacionesCli;
  puerto: number;
  token: string;
  restringir: ReturnType<typeof vi.fn>;
  /** Llama a `POST /orden` con todas las cabeceras buenas. */
  orden: (
    orden: string,
    args?: unknown,
    extra?: Record<string, string | undefined>,
  ) => Promise<Respuesta>;
  cabeceras: Record<string, string>;
}

async function montar(
  o: { ops?: OperacionesCli; plazos?: Partial<Record<(typeof ORDENES_CLI)[number], number>> } = {},
): Promise<Montado> {
  const dir = await carpetaTemporal('pel-cli-');
  const rutas = new Rutas(path.join(dir, 'datos'));
  const ops = o.ops ?? operacionesFalsas();
  const restringir = vi.fn(async () => true);
  const s = new ServidorCli({
    rutas,
    operaciones: ops,
    restringir,
    version: async () => ({ app: '1.2.3', idioma: 'es' }),
    ...(o.plazos ? { plazos: o.plazos } : {}),
  });
  servidores.push(s);
  await s.iniciar();
  const a = JSON.parse(await readFile(rutas.cliJson(), 'utf8')) as ArchivoCli;
  const cabeceras = {
    host: `127.0.0.1:${a.puerto}`,
    authorization: `Bearer ${a.token}`,
    'x-wolf-cli': '1',
    'content-type': 'application/json',
  };
  return {
    s,
    rutas,
    ops,
    puerto: a.puerto,
    token: a.token,
    restringir,
    cabeceras,
    orden: (orden, args, extra) =>
      pedir(a.puerto, {
        metodo: 'POST',
        ruta: '/orden',
        cabeceras: { ...cabeceras, ...extra },
        cuerpo: JSON.stringify({ orden, ...(args === undefined ? {} : { args }) }),
      }),
  };
}

describe('servidor de órdenes de la CLI (D31): acceso', () => {
  it('sin token o con uno viejo responde 401 sin detalle (el mismo cuerpo)', async () => {
    const m = await montar();
    const sin = await pedir(m.puerto, {
      metodo: 'POST',
      ruta: '/orden',
      cabeceras: { ...m.cabeceras, authorization: undefined },
      cuerpo: '{"orden":"estado"}',
    });
    const viejo = await pedir(m.puerto, {
      metodo: 'POST',
      ruta: '/orden',
      cabeceras: { ...m.cabeceras, authorization: 'Bearer ' + 'a'.repeat(43) },
      cuerpo: '{"orden":"estado"}',
    });
    expect(sin.estado).toBe(401);
    expect(viejo.estado).toBe(401);
    expect(sin.texto).toBe(viejo.texto);
    expect(sin.json).toEqual({ ok: false, error: { codigo: 'cli.no_autorizado' } });
    expect(m.ops.sitios).not.toHaveBeenCalled();
  });

  it('un token de otro largo (muy corto o enorme) también es 401, nunca un error interno', async () => {
    const m = await montar();
    for (const t of ['x', 'x'.repeat(300), '', 'a b']) {
      const r = await pedir(m.puerto, {
        metodo: 'POST',
        ruta: '/orden',
        cabeceras: { ...m.cabeceras, authorization: `Bearer ${t}` },
        cuerpo: '{"orden":"estado"}',
      });
      expect(r.estado).toBe(401);
    }
  });

  it('escucha solo en 127.0.0.1', async () => {
    const m = await montar();
    expect(m.s.estado()).toEqual({ activo: true, direccion: '127.0.0.1', puerto: m.puerto });
    // Por cualquier otra dirección propia del equipo, nadie escucha.
    const externa = Object.values(os.networkInterfaces())
      .flat()
      .find((i) => i && i.family === 'IPv4' && !i.internal);
    if (externa) {
      const error = await new Promise<string>((resolve) => {
        const c = net.connect({ host: externa.address, port: m.puerto });
        c.once('connect', () => {
          c.destroy();
          resolve('conectó');
        });
        c.once('error', (e: NodeJS.ErrnoException) => resolve(e.code ?? 'error'));
      });
      expect(error).not.toBe('conectó');
    }
  });

  it('rechaza un Host ajeno (DNS rebinding), un Origin y los encabezados de un navegador', async () => {
    const m = await montar();
    const casos: Record<string, string>[] = [
      { host: 'evil.example:' + m.puerto },
      { host: 'localhost:' + m.puerto },
      { host: '127.0.0.1' },
      { origin: 'http://evil.example' },
      { origin: 'null' },
      { 'sec-fetch-site': 'cross-site' },
    ];
    for (const extra of casos) {
      const r = await m.orden('estado', undefined, extra);
      expect(r.estado, JSON.stringify(extra)).toBe(403);
      expect(r.json.error.codigo).toBe('cli.no_autorizado');
    }
    expect(m.ops.sitios).not.toHaveBeenCalled();
  });

  it('exige la cabecera propia y el tipo JSON; no responde CORS ni OPTIONS', async () => {
    const m = await montar();
    expect((await m.orden('estado', undefined, { 'x-wolf-cli': undefined })).estado).toBe(403);
    expect((await m.orden('estado', undefined, { 'x-wolf-cli': '0' })).estado).toBe(403);
    expect((await m.orden('estado', undefined, { 'content-type': 'text/plain' })).estado).toBe(415);
    expect(
      (await m.orden('estado', undefined, { 'content-type': 'application/x-www-form-urlencoded' }))
        .estado,
    ).toBe(415);
    const opciones = await pedir(m.puerto, {
      metodo: 'OPTIONS',
      ruta: '/orden',
      cabeceras: { host: m.cabeceras.host!, authorization: m.cabeceras.authorization! },
    });
    expect(opciones.estado).toBe(405);
    const get = await pedir(m.puerto, { metodo: 'GET', ruta: '/orden', cabeceras: m.cabeceras });
    expect(get.estado).toBe(405);
    for (const r of [opciones, get]) {
      expect(Object.keys(r.cabeceras).filter((k) => k.startsWith('access-control'))).toEqual([]);
    }
    expect((await m.orden('estado')).cabeceras['access-control-allow-origin']).toBeUndefined();
    expect((await pedir(m.puerto, { cabeceras: m.cabeceras, ruta: '/otra' })).estado).toBe(404);
  });

  it('un cuerpo de más de 64 KB da 413', async () => {
    const m = await montar();
    const r = await pedir(m.puerto, {
      metodo: 'POST',
      ruta: '/orden',
      cabeceras: m.cabeceras,
      cuerpo: JSON.stringify({ orden: 'estado', args: { x: 'a'.repeat(70 * 1024) } }),
    });
    expect(r.estado).toBe(413);
    expect(r.json.error.codigo).toBe('cli.solicitud_grande');
    expect(m.ops.sitios).not.toHaveBeenCalled();
  });

  it('orden desconocida, JSON roto o argumentos de más se rechazan antes de tocar el núcleo', async () => {
    const m = await montar();
    const desconocida = await m.orden('formatear-disco');
    expect(desconocida.estado).toBe(400);
    expect(desconocida.json.error.codigo).toBe('cli.orden_desconocida');
    // Nombres que existen en Object.prototype tampoco son órdenes.
    expect((await m.orden('constructor')).json.error.codigo).toBe('cli.orden_desconocida');
    expect((await m.orden('__proto__')).json.error.codigo).toBe('cli.orden_desconocida');
    const roto = await pedir(m.puerto, {
      metodo: 'POST',
      ruta: '/orden',
      cabeceras: m.cabeceras,
      cuerpo: '{no json',
    });
    expect(roto.estado).toBe(400);
    const demas = await m.orden('abrir', { sitio: 'tienda', extra: 1 });
    expect(demas.estado).toBe(400);
    expect(demas.json.error.codigo).toBe('cli.argumentos_invalidos');
    // Rutas que no son absolutas, con control o UNC.
    for (const carpeta of ['relativa/x', 'C:/a\u0000b', '\\\\servidor\\recurso', '']) {
      const r = await m.orden('vincular', { carpeta });
      expect(r.json.error.codigo, carpeta).toBe('cli.argumentos_invalidos');
    }
    expect(m.ops.guardarSitio).not.toHaveBeenCalled();
  });

  it('una orden que no termina responde cli.plazo y no frena a las demás', async () => {
    const ops = operacionesFalsas();
    ops.cambiarPhpPorDefecto = vi.fn(() => new Promise<void>(() => undefined));
    const m = await montar({ ops, plazos: { usar: 50, asegurar: 5000 } });
    const lenta = await m.orden('usar', {
      servicio: 'php',
      version: '8.4',
      global: true,
      si: true,
    });
    expect(lenta.estado).toBe(504);
    expect(lenta.json.error.codigo).toBe('cli.plazo');
    const siguiente = await m.orden('estado');
    expect(siguiente.estado).toBe(200);
  });

  it('las órdenes que cambian algo van de una en una', async () => {
    const ops = operacionesFalsas();
    let activas = 0;
    let maximo = 0;
    ops.cambiarPhpPorDefecto = vi.fn(async () => {
      activas++;
      maximo = Math.max(maximo, activas);
      await new Promise((r) => setTimeout(r, 30));
      activas--;
    });
    const m = await montar({ ops });
    const args = { servicio: 'php', version: '8.4', global: true, si: true };
    const r = await Promise.all([1, 2, 3].map(() => m.orden('usar', args)));
    expect(r.map((x) => x.estado)).toEqual([200, 200, 200]);
    expect(maximo).toBe(1);
  });
});

describe('servidor de órdenes de la CLI (D31): run/cli.json', () => {
  it('tiene puerto, token fuerte, pid y versión; se restringe antes de escribir el token', async () => {
    const dir = await carpetaTemporal('pel-cli-json-');
    const rutas = new Rutas(path.join(dir, 'datos'));
    let contenidoAlRestringir: string | null = null;
    const restringir = vi.fn(async (ruta: string) => {
      contenidoAlRestringir = await readFile(ruta, 'utf8');
      return true;
    });
    const s = new ServidorCli({
      rutas,
      operaciones: operacionesFalsas(),
      restringir,
      version: async () => ({ app: '9.9.9', idioma: 'fr' }),
    });
    servidores.push(s);
    await s.iniciar();
    const a = JSON.parse(await readFile(rutas.cliJson(), 'utf8')) as ArchivoCli;
    expect(a.puerto).toBeGreaterThan(1023);
    expect(a.pid).toBe(process.pid);
    expect(a.version).toEqual({ app: '9.9.9', idioma: 'fr' });
    // 32 bytes aleatorios en base64url (43 caracteres).
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(restringir).toHaveBeenCalledTimes(1);
    // El token todavía no estaba en el archivo cuando se le quitaron los permisos a los demás.
    expect(contenidoAlRestringir).toBe('');
    expect(restringir.mock.calls[0]![0]).not.toBe(rutas.cliJson());
    expect(await readFile(rutas.cliJson(), 'utf8')).not.toBe('');
  });

  it('se regenera en cada arranque y se borra al cerrar', async () => {
    const m = await montar();
    const antes = m.token;
    await m.s.detener();
    await expect(stat(m.rutas.cliJson())).rejects.toThrow();
    await m.s.iniciar();
    const a = JSON.parse(await readFile(m.rutas.cliJson(), 'utf8')) as ArchivoCli;
    expect(a.token).not.toBe(antes);
    // El token viejo ya no sirve.
    const r = await pedir(a.puerto, {
      metodo: 'POST',
      ruta: '/orden',
      cabeceras: { ...m.cabeceras, host: `127.0.0.1:${a.puerto}` },
      cuerpo: '{"orden":"estado"}',
    });
    expect(r.estado).toBe(401);
    await m.s.detener();
    await expect(stat(m.rutas.cliJson())).rejects.toThrow();
    expect(m.s.estado().activo).toBe(false);
  });

  it('un archivo de una sesión que se cortó no sobrevive al arranque', async () => {
    const dir = await carpetaTemporal('pel-cli-viejo-');
    const rutas = new Rutas(path.join(dir, 'datos'));
    await mkdir(path.dirname(rutas.cliJson()), { recursive: true });
    await writeFile(rutas.cliJson(), JSON.stringify({ puerto: 1, token: 'viejo', pid: 1 }));
    const s = new ServidorCli({
      rutas,
      operaciones: operacionesFalsas(),
      restringir: async () => true,
      version: async () => ({ app: '1', idioma: null }),
    });
    servidores.push(s);
    await s.iniciar();
    expect((JSON.parse(await readFile(rutas.cliJson(), 'utf8')) as ArchivoCli).token).not.toBe(
      'viejo',
    );
  });

  it('si no se puede restringir al usuario, no se activa y no deja ni archivo ni puerto', async () => {
    const dir = await carpetaTemporal('pel-cli-sin-acl-');
    const rutas = new Rutas(path.join(dir, 'datos'));
    const s = new ServidorCli({
      rutas,
      operaciones: operacionesFalsas(),
      restringir: async () => false,
      version: async () => ({ app: '1', idioma: null }),
    });
    servidores.push(s);
    await expect(s.iniciar()).rejects.toMatchObject({ codigo: 'cli.token_no_protegido' });
    await expect(stat(rutas.cliJson())).rejects.toThrow();
    expect(s.estado().activo).toBe(false);
  });

  it('cada carpeta de datos tiene su propio puerto y su propio token', async () => {
    const a = await montar();
    const b = await montar();
    expect(a.puerto).not.toBe(b.puerto);
    expect(a.token).not.toBe(b.token);
    // El token de una no sirve en la otra.
    const r = await pedir(b.puerto, {
      metodo: 'POST',
      ruta: '/orden',
      cabeceras: { ...b.cabeceras, authorization: `Bearer ${a.token}` },
      cuerpo: '{"orden":"estado"}',
    });
    expect(r.estado).toBe(401);
  });
});

describe('servidor de órdenes de la CLI (D31): compartir (túnel) y sus confirmaciones', () => {
  it('sin `si` no llama al núcleo y pide confirmar', async () => {
    const m = await montar();
    const r = await m.orden('compartir', { sitio: 'tienda' });
    expect(r.estado).toBe(422);
    expect(r.json.error).toEqual({
      codigo: 'cli.requiere_confirmacion',
      datos: { sitio: 'tienda' },
    });
    expect(m.ops.abrirTunel).not.toHaveBeenCalled();
  });

  it('`si` distinto de true (texto, número) no vale', async () => {
    const m = await montar();
    for (const si of ['true', 1, 'si', null]) {
      const r = await m.orden('compartir', { sitio: 'tienda', si });
      expect(r.json.error.codigo).toBe('cli.argumentos_invalidos');
    }
    expect(m.ops.abrirTunel).not.toHaveBeenCalled();
  });

  it('con `si` pasa por la puerta del núcleo con `confirmado` y lo que se confirmó', async () => {
    const m = await montar();
    const r = await m.orden('compartir', { sitio: 'tienda', si: true });
    expect(r.estado).toBe(200);
    expect(r.json.datos).toMatchObject({ sitio: 'tienda', estado: 'activo' });
    expect(m.ops.abrirTunel).toHaveBeenCalledWith('tienda', {
      confirmado: true,
      tunelConfirmado: { proveedor: 'cloudflare-rapido' },
    });
  });

  it('con datos reales exige además escribir el dominio: un `si` solo no basta', async () => {
    const m = await montar();
    const sin = await m.orden('compartir', { sitio: 'clientes', si: true });
    expect(sin.json.error).toEqual({
      codigo: 'cli.requiere_confirmacion_datos_reales',
      datos: { sitio: 'clientes', dominio: 'clientes.test' },
    });
    for (const confirmaDatosReales of [
      '',
      'true',
      'tienda.test',
      'CLIENTES.TEST',
      ' clientes.test',
    ]) {
      const r = await m.orden('compartir', { sitio: 'clientes', si: true, confirmaDatosReales });
      expect(r.json.error.codigo, confirmaDatosReales).toBe(
        'cli.requiere_confirmacion_datos_reales',
      );
    }
    // Un flag global de "sí a todo" no existe: ni `yes` ni `todo` se aceptan.
    for (const extra of [{ yes: true }, { todo: true }, { forzar: true }]) {
      const r = await m.orden('compartir', { sitio: 'clientes', si: true, ...extra });
      expect(r.json.error.codigo).toBe('cli.argumentos_invalidos');
    }
    expect(m.ops.abrirTunel).not.toHaveBeenCalled();
    const ok = await m.orden('compartir', {
      sitio: 'clientes',
      si: true,
      confirmaDatosReales: 'clientes.test',
    });
    expect(ok.estado).toBe(200);
    expect(m.ops.abrirTunel).toHaveBeenCalledTimes(1);
    // La confirmación reforzada sola, sin `si`, tampoco abre nada.
    const solo = await m.orden('compartir', {
      sitio: 'clientes',
      confirmaDatosReales: 'clientes.test',
    });
    expect(solo.json.error.codigo).toBe('cli.requiere_confirmacion');
    expect(m.ops.abrirTunel).toHaveBeenCalledTimes(1);
  });

  it('si el sitio usa otro proveedor que el que se confirmó, no se abre', async () => {
    const ngrok = SitioSchema.parse({
      ...SITIO,
      id: 'ng',
      dominio: 'ng.test',
      tunel: { proveedor: 'ngrok' },
    });
    const m = await montar({ ops: operacionesFalsas([SITIO, ngrok]) });
    const r = await m.orden('compartir', { sitio: 'ng', si: true, proveedor: 'cloudflare-rapido' });
    expect(r.json.error).toEqual({
      codigo: 'cli.proveedor_distinto',
      datos: { proveedor: 'ngrok' },
    });
    expect(m.ops.abrirTunel).not.toHaveBeenCalled();
    await m.orden('compartir', { sitio: 'ng', si: true, proveedor: 'ngrok' });
    expect(m.ops.abrirTunel).toHaveBeenCalledWith('ng', {
      confirmado: true,
      tunelConfirmado: { proveedor: 'ngrok' },
    });
  });

  it('un sitio que no existe no llega al núcleo y cerrar no pide confirmación', async () => {
    const m = await montar();
    const r = await m.orden('compartir', { sitio: 'fantasma', si: true });
    expect(r.json.error.codigo).toBe('cli.sitio_no_encontrado');
    const cierre = await m.orden('compartir', { sitio: 'tienda', cerrar: true });
    expect(cierre.estado).toBe(200);
    expect(m.ops.cerrarTunel).toHaveBeenCalledWith('tienda');
    expect(m.ops.abrirTunel).not.toHaveBeenCalled();
  });

  it('cambiar el PHP de todas las terminales exige `si`', async () => {
    const m = await montar();
    const sin = await m.orden('usar', { servicio: 'php', version: '8.4', global: true });
    expect(sin.json.error.codigo).toBe('cli.requiere_confirmacion');
    expect(m.ops.cambiarPhpPorDefecto).not.toHaveBeenCalled();
    const con = await m.orden('usar', {
      servicio: 'php',
      version: '8.4.13',
      global: true,
      si: true,
    });
    expect(con.estado).toBe(200);
    expect(m.ops.cambiarPhpPorDefecto).toHaveBeenCalledWith('8.4');
  });
});

describe('servidor de órdenes de la CLI (D31): nada de secretos en la salida', () => {
  it('ninguna respuesta (ni los errores) lleva la centinela', async () => {
    const ops = operacionesFalsas([
      { ...SITIO, nombre: `Tienda DB_PASSWORD=${CENTINELA}` },
      SITIO_REAL,
    ]);
    ops.estadosTuneles = vi.fn(() => [
      {
        sitioId: 'tienda',
        estado: 'error' as const,
        url: null,
        mensaje: `falló con Authorization: Bearer ${CENTINELA}`,
      },
    ]);
    ops.estadoServicios = vi.fn(async () => [
      {
        id: 'nginx',
        nombre: 'Nginx',
        version: '1',
        estado: 'encendido' as const,
        puertos: [80],
        pid: 1,
        // Algo que ningún servicio trae, pero que no debe salir si alguien lo agregara.
        token: CENTINELA,
        mensaje: `TOKEN=${CENTINELA}`,
      } as never,
    ]);
    ops.leerRegistro = vi.fn(async () => [
      `DB_PASSWORD=${CENTINELA}`,
      `API_KEY=${CENTINELA}`,
      'mysql://root:' + CENTINELA + '@localhost/x',
    ]);
    ops.abrirTunel = vi.fn(async () => {
      throw new Error(
        `cloudflared falló con ${CENTINELA} y --token ${CENTINELA} password=${CENTINELA}`,
      );
    });
    ops.revisarDoctor = vi.fn(async () => [
      {
        id: 'hosts:x',
        revision: 'hosts' as const,
        gravedad: 'aviso' as const,
        codigo: 'doctor.hosts_sin_bloque' as never,
        datos: { clave: CENTINELA },
        evidencia: `línea: SECRET=${CENTINELA}`,
      },
    ]);
    const m = await montar({ ops });
    const salidas: string[] = [];
    for (const [orden, args] of [
      ['estado', {}],
      ['doctor', {}],
      ['registros', { sitio: 'tienda' }],
      ['compartir', { sitio: 'tienda', si: true }],
      ['abrir', { sitio: 'tienda' }],
      ['vincular', { carpeta: 'relativa' }],
    ] as const) {
      const r = await m.orden(orden, args);
      salidas.push(r.texto);
    }
    const flujo = await pedir(m.puerto, {
      ruta: '/registros?sitio=tienda',
      cabeceras: m.cabeceras,
    });
    salidas.push(flujo.texto);
    const todo = salidas.join('\n');
    expect(todo).not.toContain(CENTINELA);
    // Y las respuestas siguen siendo útiles (no se vació todo).
    expect(salidas[0]).toContain('tienda.test');
    expect(flujo.estado).toBe(200);
    // El error del túnel llega con código, no con el texto del proceso.
    expect(JSON.parse(salidas[3]!).error.codigo).toBe('cli.error');
  });
});

describe('enmascarado de banderas de línea de órdenes', () => {
  it('oculta el valor de --token, --authtoken y compañía (con espacio o =)', () => {
    expect(enmascararSecretos(`ngrok --authtoken ${CENTINELA} http 80`)).not.toContain(CENTINELA);
    expect(enmascararSecretos(`x --token=${CENTINELA}`)).not.toContain(CENTINELA);
    expect(enmascararSecretos(`x --api-key "${CENTINELA}"`)).not.toContain(CENTINELA);
    // Lo que no es un secreto se queda.
    expect(enmascararSecretos('php artisan serve --port 8000 --password-stdin')).toBe(
      'php artisan serve --port 8000 --password-stdin',
    );
  });
});

describe('servidor de órdenes de la CLI (D31): registros en flujo', () => {
  it('sin `seguir` devuelve las últimas líneas; una fuente que no existe es un error', async () => {
    const m = await montar();
    const r = await pedir(m.puerto, {
      ruta: '/registros?sitio=tienda&lineas=2',
      cabeceras: m.cabeceras,
    });
    expect(r.json.datos.lineas).toEqual(['linea 1', 'linea 2']);
    expect(m.ops.leerRegistro).toHaveBeenCalledWith('sitio:tienda:error', 2);
    const sin = await pedir(m.puerto, {
      ruta: '/registros?sitio=tienda&fuente=laravel',
      cabeceras: m.cabeceras,
    });
    expect(sin.json.error.codigo).toBe('cli.fuente_no_existe');
    // Nunca una ruta: solo el id de un sitio.
    const ruta = await pedir(m.puerto, {
      ruta: '/registros?sitio=' + encodeURIComponent('../../etc/passwd'),
      cabeceras: m.cabeceras,
    });
    expect(ruta.estado).toBe(400);
    const sinToken = await pedir(m.puerto, {
      ruta: '/registros?sitio=tienda',
      cabeceras: { ...m.cabeceras, authorization: undefined },
    });
    expect(sinToken.estado).toBe(401);
  });

  it('con `seguir=1` manda lo que llega y deja de seguir cuando el cliente corta', async () => {
    const ops = operacionesFalsas();
    let alLineas: (l: string[]) => void = () => undefined;
    const dejar = vi.fn();
    ops.seguirRegistro = vi.fn(async (_id, f) => {
      alLineas = f;
      return dejar;
    });
    const m = await montar({ ops });
    const recibido: string[] = [];
    const cierre = new Promise<void>((resolve) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port: m.puerto,
          path: '/registros?sitio=tienda&seguir=1',
          headers: m.cabeceras,
        },
        (res) => {
          expect(res.headers['content-type']).toContain('application/x-ndjson');
          res.on('data', (d: Buffer) => {
            recibido.push(d.toString('utf8'));
            if (recibido.join('').includes('nueva')) {
              req.destroy();
              resolve();
            }
          });
        },
      );
      req.on('error', () => undefined);
      req.end();
      // Cuando ya se está siguiendo, llega una línea con una clave.
      const espera = setInterval(() => {
        if ((ops.seguirRegistro as ReturnType<typeof vi.fn>).mock.calls.length > 0) {
          clearInterval(espera);
          alLineas([`nueva API_KEY=${CENTINELA}`]);
        }
      }, 10);
    });
    await cierre;
    await vi.waitFor(() => expect(dejar).toHaveBeenCalledTimes(1));
    const texto = recibido.join('');
    expect(texto).toContain('linea 1');
    expect(texto).toContain('nueva');
    expect(texto).not.toContain(CENTINELA);
  });

  it('un seguimiento se corta solo al cumplir su duración máxima y al detener el servidor', async () => {
    const dir = await carpetaTemporal('pel-cli-seguir-');
    const rutas = new Rutas(path.join(dir, 'datos'));
    const ops = operacionesFalsas();
    const dejar = vi.fn();
    ops.seguirRegistro = vi.fn(async () => dejar);
    const s = new ServidorCli({
      rutas,
      operaciones: ops,
      restringir: async () => true,
      version: async () => ({ app: '1', idioma: null }),
      duracionSeguimientoMs: 80,
    });
    servidores.push(s);
    await s.iniciar();
    const a = JSON.parse(await readFile(rutas.cliJson(), 'utf8')) as ArchivoCli;
    const r = await pedir(a.puerto, {
      ruta: '/registros?sitio=tienda&seguir=1',
      cabeceras: {
        host: `127.0.0.1:${a.puerto}`,
        authorization: `Bearer ${a.token}`,
        'x-wolf-cli': '1',
      },
    });
    // La respuesta terminó por sí sola (el plazo) y dejó de seguir.
    expect(r.estado).toBe(200);
    expect(dejar).toHaveBeenCalledTimes(1);
  });
});

/* ───────────── Con el núcleo de verdad (PlataformaFalsa, carpeta temporal) ───────────── */

async function crearNucleo(
  config: unknown,
  extra: {
    aPreparar?: (base: string, dir: string) => Promise<void>;
    spawn?: ReturnType<typeof vi.fn>;
  } = {},
): Promise<{
  n: Nucleo;
  dir: string;
  base: string;
  cli: ArchivoCli;
  cabeceras: Record<string, string>;
}> {
  const dir = await carpetaTemporal('pel-cli-nuc-');
  const base = path.join(dir, 'datos');
  await mkdir(base, { recursive: true });
  await writeFile(path.join(base, 'config.json'), JSON.stringify(config, null, 2));
  await extra.aPreparar?.(base, dir);
  const n = await Nucleo.crear({
    base,
    plataforma: new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir }),
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
    retrasoNovedadesMs: 60_000,
    aislado: true,
    servidorCli: { version: '0.0.1' },
    ...(extra.spawn ? { spawn: extra.spawn as never } : {}),
  });
  nucleos.push(n);
  const cli = JSON.parse(await readFile(path.join(base, 'run', 'cli.json'), 'utf8')) as ArchivoCli;
  return {
    n,
    dir,
    base,
    cli,
    cabeceras: {
      host: `127.0.0.1:${cli.puerto}`,
      authorization: `Bearer ${cli.token}`,
      'x-wolf-cli': '1',
      'content-type': 'application/json',
    },
  };
}

const llamar = (
  c: { cli: ArchivoCli; cabeceras: Record<string, string> },
  orden: string,
  args: unknown = {},
): Promise<Respuesta> =>
  pedir(c.cli.puerto, {
    metodo: 'POST',
    ruta: '/orden',
    cabeceras: c.cabeceras,
    cuerpo: JSON.stringify({ orden, args }),
  });

async function phpFalso(base: string, ...ramas: string[]): Promise<void> {
  for (const r of ramas) {
    await mkdir(path.join(base, 'bin', 'php', r), { recursive: true });
    await writeFile(path.join(base, 'bin', 'php', r, 'php-cgi.exe'), 'x');
  }
}

describe('servidor de órdenes de la CLI (D31): con el núcleo', () => {
  it('`usar php@8.4` en una carpeta vinculada cambia el PHP del sitio (y solo ese)', async () => {
    const dir = await carpetaTemporal('pel-cli-usar-');
    const carpeta = path.join(dir, 'tienda');
    const otra = path.join(dir, 'blog');
    await mkdir(path.join(carpeta, 'app', 'sub'), { recursive: true });
    await mkdir(otra, { recursive: true });
    const cfg = ConfigSchema.parse({
      sitios: [
        SitioSchema.parse({
          id: 'tienda',
          nombre: 'Tienda',
          dominio: 'tienda.test',
          carpeta,
          tipo: 'laravel',
          php: '8.3',
        }),
        SitioSchema.parse({
          id: 'blog',
          nombre: 'Blog',
          dominio: 'blog.test',
          carpeta: otra,
          tipo: 'laravel',
          php: '8.3',
        }),
      ],
    });
    const c = await crearNucleo(cfg, { aPreparar: (base) => phpFalso(base, '8.3', '8.4') });
    // Desde una subcarpeta del proyecto, como la terminal.
    const r = await llamar(c, 'usar', {
      servicio: 'php',
      version: '8.4',
      carpeta: path.join(carpeta, 'app', 'sub'),
    });
    expect(r.json, r.texto).toMatchObject({ ok: true, datos: { sitio: 'tienda', version: '8.4' } });
    const sitios = (await c.n.config.leer()).sitios;
    expect(sitios.find((s) => s.id === 'tienda')?.php).toBe('8.4');
    expect(sitios.find((s) => s.id === 'blog')?.php).toBe('8.3');
    // Lo que no está instalado no se pone; una carpeta sin sitio tampoco.
    const noHay = await llamar(c, 'usar', { servicio: 'php', version: '7.4', carpeta });
    expect(noHay.json.error.codigo).toBe('cli.version_no_instalada');
    const sinSitio = await llamar(c, 'usar', { servicio: 'php', version: '8.4', carpeta: dir });
    expect(sinSitio.json.error.codigo).toBe('cli.carpeta_sin_sitio');
  });

  it('`vincular` crea el sitio sin confianza y sin procesos; no vincula carpetas del sistema ni la de datos', async () => {
    const dir = await carpetaTemporal('pel-cli-vincular-');
    const proyecto = path.join(dir, 'mi-proyecto');
    await mkdir(proyecto, { recursive: true });
    // Una receta que, de confiarse, ejecutaría comandos: la CLI no la toca.
    await writeFile(
      path.join(proyecto, 'wolfcore.yml'),
      'procesos:\n  - id: malo\n    comando: [node, malo.js]\n',
    );
    const c = await crearNucleo(ConfigSchema.parse({}));
    const r = await llamar(c, 'vincular', { carpeta: proyecto, dominio: 'mi-proyecto.test' });
    expect(r.json, r.texto).toMatchObject({
      ok: true,
      datos: { sitio: { dominio: 'mi-proyecto.test' } },
    });
    const sitio = (await c.n.config.leer()).sitios[0]!;
    expect(sitio).toMatchObject({
      confiado: false,
      datosReales: false,
      https: false,
      procesos: [],
    });
    expect(sitio.origen).toBeUndefined();
    // Otra vez la misma carpeta.
    const repetida = await llamar(c, 'vincular', { carpeta: proyecto, dominio: 'otro.test' });
    expect(repetida.json.error.codigo).toBe('cli.ya_vinculada');
    // La carpeta de datos de WolfCore Dev, una subcarpeta suya y su padre.
    for (const mala of [c.base, path.join(c.base, 'bin'), path.dirname(c.base)]) {
      const x = await llamar(c, 'vincular', { carpeta: mala });
      expect(x.json.error?.codigo, mala).toBe('cli.carpeta_invalida');
    }
    // Una carpeta que no existe.
    const no = await llamar(c, 'vincular', { carpeta: path.join(dir, 'no-existe') });
    expect(no.json.error.codigo).toBe('cli.carpeta_invalida');
    // Un dominio que no es .test lo rechaza el mismo gestor de sitios de la interfaz.
    const otro = path.join(dir, 'otro');
    await mkdir(otro);
    const malo = await llamar(c, 'vincular', { carpeta: otro, dominio: 'otro.com' });
    expect(malo.json.error.codigo).toBe('cli.argumentos_invalidos');
  });

  it('`vigilar` y `asegurar` usan las mismas operaciones que la interfaz', async () => {
    const dir = await carpetaTemporal('pel-cli-asegurar-');
    const carpeta = path.join(dir, 'web');
    const proyectos = path.join(dir, 'proyectos');
    await mkdir(carpeta, { recursive: true });
    await mkdir(proyectos, { recursive: true });
    const cfg = ConfigSchema.parse({
      sitios: [
        SitioSchema.parse({
          id: 'web',
          nombre: 'Web',
          dominio: 'web.test',
          carpeta,
          tipo: 'estatico',
        }),
      ],
    });
    const c = await crearNucleo(cfg);
    const v = await llamar(c, 'vigilar', { carpeta: proyectos });
    expect(v.json, v.texto).toMatchObject({ ok: true });
    expect((await c.n.config.leer()).proyectos.carpetaVigilada).toBe(await realpath(proyectos));
    expect((await llamar(c, 'vigilar', { carpeta: null })).json.ok).toBe(true);
    expect((await c.n.config.leer()).proyectos.carpetaVigilada).toBeNull();
    const a = await llamar(c, 'asegurar', { sitio: 'web' });
    expect(a.json, a.texto).toMatchObject({ ok: true, datos: { ya: false } });
    expect((await c.n.config.leer()).sitios[0]!.https).toBe(true);
    // Sin la autoridad instalada lo dice: instalarla es una confirmación de la interfaz.
    expect(a.json.datos.caConfiable).toBe(false);
    expect((await llamar(c, 'asegurar', { sitio: 'web' })).json.datos.ya).toBe(true);
    expect((await llamar(c, 'asegurar', { sitio: 'no-hay' })).json.error.codigo).toBe(
      'cli.sitio_no_encontrado',
    );
  }, 60_000);

  it('`compartir`: el núcleo sigue exigiendo confirmación y no se abre ningún túnel real', async () => {
    const dir = await carpetaTemporal('pel-cli-tunel-');
    const cfg = ConfigSchema.parse({
      sitios: [
        SitioSchema.parse({
          id: 'tienda',
          nombre: 'Tienda',
          dominio: 'tienda.test',
          carpeta: dir,
          tipo: 'estatico',
        }),
        SitioSchema.parse({
          id: 'clientes',
          nombre: 'Clientes',
          dominio: 'clientes.test',
          carpeta: dir,
          tipo: 'estatico',
          datosReales: true,
        }),
      ],
    });
    const spawn = vi.fn();
    const c = await crearNucleo(cfg, { spawn });
    const secretos = {
      disponible: () => true,
      leer: async () => CENTINELA,
      guardar: async () => undefined,
      borrar: async () => undefined,
    };
    c.n.fijarSecretosTunel(() => secretos);
    // Sin `si`: ni llega al núcleo.
    expect((await llamar(c, 'compartir', { sitio: 'tienda' })).json.error.codigo).toBe(
      'cli.requiere_confirmacion',
    );
    // Datos reales con `si` pero sin el dominio.
    expect((await llamar(c, 'compartir', { sitio: 'clientes', si: true })).json.error.codigo).toBe(
      'cli.requiere_confirmacion_datos_reales',
    );
    // Con todo confirmado llega al núcleo (que no tiene cloudflared aquí): falla sin abrir nada.
    const r = await llamar(c, 'compartir', { sitio: 'tienda', si: true });
    expect(r.json.ok).toBe(false);
    expect(r.texto).not.toContain(CENTINELA);
    expect(spawn).not.toHaveBeenCalled();
    expect(c.n.tuneles.estados().filter((t) => t.estado === 'activo')).toEqual([]);
    // El estado general tampoco lleva la centinela.
    const e = await llamar(c, 'estado');
    expect(e.json.ok).toBe(true);
    expect(e.texto).not.toContain(CENTINELA);
    expect(e.json.datos.sitios.map((s: { id: string }) => s.id).sort()).toEqual([
      'clientes',
      'tienda',
    ]);
  });

  it('`iniciar` un workspace respeta la confianza de los sitios importados de un perfil', async () => {
    const dir = await carpetaTemporal('pel-cli-ws-');
    const cfg = ConfigSchema.parse({
      sitios: [
        SitioSchema.parse({
          id: 'bot',
          nombre: 'Bot',
          dominio: 'bot.test',
          carpeta: dir,
          tipo: 'fastapi',
          origen: 'perfil',
          procesos: [
            ProcesoProyectoSchema.parse({
              id: 'uvicorn',
              comando: ['uvicorn', 'a:a'],
              puerto: 8000,
              proxy: true,
            }),
          ],
        }),
      ],
      workspaces: [
        {
          id: 'bot',
          nombre: 'Bot',
          elementos: [{ tipo: 'proceso', sitioId: 'bot', procesoId: 'uvicorn' }],
        },
      ],
    });
    const spawn = vi.fn();
    const c = await crearNucleo(cfg, { spawn });
    const r = await llamar(c, 'iniciar', { workspace: 'bot' });
    expect(r.json, r.texto).toMatchObject({
      ok: true,
      datos: {
        resultados: [
          {
            elemento: 'proceso:bot/uvicorn',
            ok: false,
            encendido: false,
            codigo: 'proyectos.no_confiado',
          },
        ],
      },
    });
    expect(spawn).not.toHaveBeenCalled();
    expect((await c.n.procesos.estados('bot'))[0]!.estado).toBe('apagado');
    expect(c.n.tuneles.estados()).toEqual([]);
    expect((await llamar(c, 'iniciar', { workspace: 'no-hay' })).json.error.codigo).toBe(
      'workspaces.no_existe',
    );
  });

  it('dos carpetas de datos aisladas a la vez no chocan y cada una cierra la suya', async () => {
    const a = await crearNucleo(ConfigSchema.parse({}));
    const b = await crearNucleo(ConfigSchema.parse({}));
    expect(a.cli.puerto).not.toBe(b.cli.puerto);
    expect(a.cli.token).not.toBe(b.cli.token);
    expect((await llamar(a, 'estado')).estado).toBe(200);
    expect((await llamar(b, 'estado')).estado).toBe(200);
    await a.n.cerrar({ detenerServicios: false });
    await expect(stat(path.join(a.base, 'run', 'cli.json'))).rejects.toThrow();
    expect((await stat(path.join(b.base, 'run', 'cli.json'))).isFile()).toBe(true);
    expect((await llamar(b, 'estado')).estado).toBe(200);
  });

  it('sin la opción `servidorCli` el núcleo no abre ningún puerto ni escribe cli.json', async () => {
    const dir = await carpetaTemporal('pel-cli-off-');
    const base = path.join(dir, 'datos');
    await mkdir(base, { recursive: true });
    const n = await Nucleo.crear({
      base,
      plataforma: new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir }),
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      retrasoNovedadesMs: 60_000,
    });
    nucleos.push(n);
    expect(n.cli.estado().activo).toBe(false);
    await expect(stat(path.join(base, 'run', 'cli.json'))).rejects.toThrow();
  });
});

describe('lista blanca de órdenes', () => {
  it('son exactamente las del plan', () => {
    expect([...ORDENES_CLI]).toEqual([
      'estado',
      'vincular',
      'vigilar',
      'usar',
      'asegurar',
      'compartir',
      'abrir',
      'registros',
      'doctor',
      'iniciar',
      'detener',
    ]);
  });
});
