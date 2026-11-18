import http from 'node:http';
import net from 'node:net';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HERRAMIENTAS_MCP,
  ServidorMcp,
  type OperacionesMcp,
  type SolicitudConfirmacion,
} from '../src/mcp/servidor';
import { Nucleo } from '../src/nucleo';
import type { Plataforma } from '../src/plataforma/tipos';
import { ArchivoCredencialesSchema, ConfigSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const TOKEN = 'a'.repeat(64);

const servidores: ServidorMcp[] = [];
const clientes: Client[] = [];

afterEach(async () => {
  for (const c of clientes.splice(0)) await c.close().catch(() => undefined);
  for (const s of servidores.splice(0)) await s.detener();
});

/** Operaciones falsas: cada una es un vi.fn con un resultado fijo. */
function operacionesFalsas(carpeta = 'C:/no-existe'): OperacionesMcp {
  return {
    estadoGeneral: vi.fn(async () => ({ servicios: [], sitios: [], tuneles: [] })),
    listarProyectos: vi.fn(async () => [{ id: 'demo', nombre: 'Demo' }]),
    estadoServicios: vi.fn(async () => [{ id: 'nginx', estado: 'encendido' }]),
    iniciarServicio: vi.fn(async () => undefined),
    detenerServicio: vi.fn(async () => undefined),
    listarBases: vi.fn(async () => [{ nombre: 'tienda', tablas: 3 }]),
    crearBase: vi.fn(async () => ({ base: 'nueva' })),
    respaldarBase: vi.fn(async () => ({ archivo: 'x.sql.gz' })),
    restaurarBase: vi.fn(async () => ({ advertencias: [] })),
    borrarBase: vi.fn(async () => undefined),
    carpetaRespaldos: vi.fn(async () => carpeta),
    abrirTunel: vi.fn(async () => ({ estado: 'activo', url: 'https://x.trycloudflare.com' })),
    cerrarTunel: vi.fn(async () => undefined),
    ejecutarReceta: vi.fn(async () => ({ estado: 'listo' })),
    traerCambios: vi.fn(async () => ({ actualizado: true })),
    leerRegistro: vi.fn(async (_id: string, n: number) =>
      Array.from({ length: n }, (_, i) => `l${i}`),
    ),
    finalizarProceso: vi.fn(async (pid: number) => ({ pid, nombre: 'node.exe' })),
  };
}

interface Montaje {
  servidor: ServidorMcp;
  ops: OperacionesMcp;
  puerto: number;
  url: string;
  confirmaciones: SolicitudConfirmacion[];
}

async function montar(
  o: { ops?: OperacionesMcp; plazoConfirmacionMs?: number } = {},
): Promise<Montaje> {
  const ops = o.ops ?? operacionesFalsas();
  const confirmaciones: SolicitudConfirmacion[] = [];
  const servidor = new ServidorMcp({
    operaciones: ops,
    token: async () => TOKEN,
    puerto: async () => 0,
    emitirConfirmacion: (s) => confirmaciones.push(s),
    ...(o.plazoConfirmacionMs !== undefined ? { plazoConfirmacionMs: o.plazoConfirmacionMs } : {}),
  });
  servidores.push(servidor);
  await servidor.iniciar();
  const puerto = servidor.estado().puerto!;
  return { servidor, ops, puerto, url: `http://127.0.0.1:${puerto}/mcp`, confirmaciones };
}

async function conectar(url: string, token = TOKEN): Promise<Client> {
  const cliente = new Client({ name: 'prueba', version: '1.0.0' });
  const transporte = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  await cliente.connect(transporte);
  clientes.push(cliente);
  return cliente;
}

const INICIALIZAR = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'crudo', version: '1' },
  },
});

/** POST crudo con node:http (permite fijar Host y Origin). */
function postCrudo(
  puerto: number,
  cabeceras: Record<string, string>,
  cuerpo: string | Buffer = INICIALIZAR,
): Promise<{ codigo: number; texto: string; cabeceras: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: puerto,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          ...cabeceras,
        },
      },
      (res) => {
        let texto = '';
        res.setEncoding('utf8');
        res.on('data', (d: string) => (texto += d));
        res.on('end', () =>
          resolve({ codigo: res.statusCode ?? 0, texto, cabeceras: res.headers }),
        );
      },
    );
    req.on('error', reject);
    req.end(cuerpo);
  });
}

const textoDe = (r: unknown): string =>
  ((r as { content: { type: string; text: string }[] }).content[0]?.text ?? '') as string;

/** Espera a que llegue la primera solicitud de confirmación. */
async function esperarConfirmacion(m: Montaje): Promise<SolicitudConfirmacion> {
  for (let i = 0; i < 200; i++) {
    if (m.confirmaciones.length > 0) return m.confirmaciones[0]!;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('No llegó la solicitud de confirmación');
}

describe('configuración y credenciales', () => {
  it('Config.mcp tiene valores por defecto (un config.json viejo sigue cargando)', () => {
    expect(ConfigSchema.parse({}).mcp).toEqual({ activo: false, puerto: 7790 });
    expect(ConfigSchema.parse({ version: 1, sitios: [] }).mcp.puerto).toBe(7790);
  });

  it('credenciales.json admite la clave "mcp"', () => {
    const r = ArchivoCredencialesSchema.parse({ mcp: { usuario: 'mcp', clave: TOKEN } });
    expect(r.mcp?.clave).toBe(TOKEN);
  });
});

describe('ServidorMcp: seguridad HTTP', () => {
  it('escucha solo en 127.0.0.1', async () => {
    const m = await montar();
    expect(m.servidor.estado()).toMatchObject({ activo: true, direccion: '127.0.0.1' });
  });

  it('sin token devuelve 401', async () => {
    const m = await montar();
    const r = await postCrudo(m.puerto, { Host: `127.0.0.1:${m.puerto}` });
    expect(r.codigo).toBe(401);
    expect(r.cabeceras['www-authenticate']).toMatch(/^Bearer/);
  });

  it('con un token equivocado devuelve 401', async () => {
    const m = await montar();
    const r = await postCrudo(m.puerto, {
      Host: `127.0.0.1:${m.puerto}`,
      Authorization: `Bearer ${'b'.repeat(64)}`,
    });
    expect(r.codigo).toBe(401);
    const corto = await postCrudo(m.puerto, {
      Host: `127.0.0.1:${m.puerto}`,
      Authorization: 'Bearer x',
    });
    expect(corto.codigo).toBe(401);
  });

  it('el cliente del SDK sin token no puede conectarse', async () => {
    const m = await montar();
    await expect(conectar(m.url, 'malo')).rejects.toThrow();
  });

  it('rechaza un Host ajeno (DNS rebinding)', async () => {
    const m = await montar();
    const r = await postCrudo(m.puerto, {
      Host: `malicioso.example:${m.puerto}`,
      Authorization: `Bearer ${TOKEN}`,
    });
    expect(r.codigo).toBe(403);
    const otroPuerto = await postCrudo(m.puerto, {
      Host: `127.0.0.1:${m.puerto + 1}`,
      Authorization: `Bearer ${TOKEN}`,
    });
    expect(otroPuerto.codigo).toBe(403);
  });

  it('acepta Host localhost:<puerto>', async () => {
    const m = await montar();
    const r = await postCrudo(m.puerto, {
      Host: `localhost:${m.puerto}`,
      Authorization: `Bearer ${TOKEN}`,
    });
    expect(r.codigo).toBe(200);
  });

  it('rechaza cualquier cabecera Origin (los navegadores no deben llegar)', async () => {
    const m = await montar();
    for (const origen of ['http://malicioso.example', `http://127.0.0.1:${m.puerto}`, 'null']) {
      const r = await postCrudo(m.puerto, {
        Host: `127.0.0.1:${m.puerto}`,
        Origin: origen,
        Authorization: `Bearer ${TOKEN}`,
      });
      expect(r.codigo).toBe(403);
    }
  });

  it('rechaza un cuerpo demasiado grande con 413', async () => {
    const m = await montar();
    const r = await postCrudo(
      m.puerto,
      { Host: `127.0.0.1:${m.puerto}`, Authorization: `Bearer ${TOKEN}` },
      Buffer.alloc(2 * 1024 * 1024, 0x20),
    );
    expect(r.codigo).toBe(413);
  });

  it('una ruta distinta de /mcp da 404', async () => {
    const m = await montar();
    const r = await new Promise<number>((resolve, reject) => {
      http
        .get(
          {
            host: '127.0.0.1',
            port: m.puerto,
            path: '/otra',
            headers: { Authorization: `Bearer ${TOKEN}` },
          },
          (res) => {
            res.resume();
            resolve(res.statusCode ?? 0);
          },
        )
        .on('error', reject);
    });
    expect(r).toBe(404);
  });

  it('el token nunca aparece en el estado', async () => {
    const m = await montar();
    expect(JSON.stringify(m.servidor.estado())).not.toContain(TOKEN);
  });
});

describe('ServidorMcp: ciclo de vida', () => {
  it('iniciar dos veces no crea otro servidor', async () => {
    const m = await montar();
    await m.servidor.iniciar();
    expect(m.servidor.estado().puerto).toBe(m.puerto);
  });

  it('puerto ocupado: error en español, sin caerse', async () => {
    const ocupante = net.createServer();
    await new Promise<void>((r) => ocupante.listen(0, '127.0.0.1', r));
    const puerto = (ocupante.address() as net.AddressInfo).port;
    try {
      const s = new ServidorMcp({
        operaciones: operacionesFalsas(),
        token: async () => TOKEN,
        puerto: async () => puerto,
        emitirConfirmacion: () => undefined,
      });
      servidores.push(s);
      await expect(s.iniciar()).rejects.toThrow(/puerto .*en uso/i);
      expect(s.estado().activo).toBe(false);
    } finally {
      await new Promise((r) => ocupante.close(r));
    }
  });

  it('detener cierra las conexiones y libera el puerto', async () => {
    const m = await montar();
    await conectar(m.url);
    await m.servidor.detener();
    expect(m.servidor.estado()).toMatchObject({ activo: false, puerto: null });
    // El puerto queda libre.
    const s = net.createServer();
    await new Promise<void>((r, j) => {
      s.once('error', j);
      s.listen(m.puerto, '127.0.0.1', r);
    });
    await new Promise((r) => s.close(r));
  });

  it('configuracionClaude da el comando y el .mcp.json', async () => {
    const m = await montar();
    const c = JSON.parse(await m.servidor.configuracionClaude()) as {
      comando: string;
      mcpJson: { mcpServers: { wolfcore: { type: string; url: string; headers: object } } };
    };
    expect(c.comando).toBe(
      `claude mcp add --transport http wolfcore http://127.0.0.1:${m.puerto}/mcp --header "Authorization: Bearer ${TOKEN}"`,
    );
    expect(c.mcpJson.mcpServers.wolfcore).toEqual({
      type: 'http',
      url: `http://127.0.0.1:${m.puerto}/mcp`,
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });
});

describe('ServidorMcp: herramientas', () => {
  it('lista todas las herramientas', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    const { tools } = await c.listTools();
    const nombres = tools.map((t) => t.name).sort();
    expect(nombres).toEqual([...HERRAMIENTAS_MCP].sort());
    for (const n of [
      'estado_general',
      'listar_proyectos',
      'estado_servicios',
      'iniciar_servicio',
      'detener_servicio',
      'listar_bases',
      'crear_base',
      'respaldar_base',
      'restaurar_base',
      'borrar_base',
      'abrir_tunel',
      'cerrar_tunel',
      'ejecutar_receta',
      'traer_cambios',
      'leer_registro',
      'finalizar_proceso',
    ]) {
      expect(nombres).toContain(n);
    }
  });

  it('una llamada simple devuelve JSON', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    const r = await c.callTool({ name: 'estado_servicios', arguments: {} });
    expect(r.isError).toBeFalsy();
    expect(JSON.parse(textoDe(r))).toEqual([{ id: 'nginx', estado: 'encendido' }]);
  });

  it('pasa los argumentos validados', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    await c.callTool({ name: 'crear_base', arguments: { motor: 'mysql', nombre: 'nueva' } });
    expect(m.ops.crearBase).toHaveBeenCalledWith('mysql', 'nueva');
    await c.callTool({ name: 'iniciar_servicio', arguments: { id: 'php-8.4' } });
    expect(m.ops.iniciarServicio).toHaveBeenCalledWith('php-8.4');
  });

  it('argumentos inválidos dan un error de herramienta', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    const r = await c.callTool({ name: 'crear_base', arguments: { motor: 'oracle', nombre: 'x' } });
    expect(r.isError).toBe(true);
    expect(m.ops.crearBase).not.toHaveBeenCalled();
  });

  it('un fallo de la operación vuelve como error de herramienta en español', async () => {
    const ops = operacionesFalsas();
    ops.detenerServicio = vi.fn(async () => {
      throw new Error('El servicio no existe.');
    });
    const m = await montar({ ops });
    const c = await conectar(m.url);
    const r = await c.callTool({ name: 'detener_servicio', arguments: { id: 'nginx' } });
    expect(r.isError).toBe(true);
    expect(textoDe(r)).toBe('El servicio no existe.');
  });

  it('leer_registro limita las líneas', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    const r = await c.callTool({ name: 'leer_registro', arguments: { id: 'nginx', lineas: 50 } });
    expect(JSON.parse(textoDe(r))).toHaveLength(50);
    const grande = await c.callTool({
      name: 'leer_registro',
      arguments: { id: 'nginx', lineas: 100000 },
    });
    expect(grande.isError).toBe(true);
    const porDefecto = await c.callTool({ name: 'leer_registro', arguments: { id: 'nginx' } });
    expect(JSON.parse(textoDe(porDefecto))).toHaveLength(200);
  });

  it('una operación que el núcleo aún no ofrece da un error claro', async () => {
    const ops = operacionesFalsas();
    delete ops.traerCambios;
    const m = await montar({ ops });
    const c = await conectar(m.url);
    const r = await c.callTool({ name: 'traer_cambios', arguments: { sitioId: 'demo' } });
    expect(r.isError).toBe(true);
    expect(textoDe(r)).toMatch(/no está disponible/);
  });
});

describe('ServidorMcp: acciones destructivas', () => {
  it('borrar_base espera la confirmación y, aprobada, borra', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    const llamada = c.callTool({
      name: 'borrar_base',
      arguments: { motor: 'mysql', nombre: 'tienda' },
    });
    const sol = await esperarConfirmacion(m);
    expect(sol).toMatchObject({ herramienta: 'borrar_base' });
    expect(sol.resumen).toContain('tienda');
    expect(m.ops.borrarBase).not.toHaveBeenCalled();
    expect(m.servidor.responderConfirmacion(sol.id, true)).toBe(true);
    const r = await llamada;
    expect(r.isError).toBeFalsy();
    expect(m.ops.borrarBase).toHaveBeenCalledWith('mysql', 'tienda', 'tienda');
  });

  it('rechazada, no borra y devuelve un error', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    const llamada = c.callTool({
      name: 'borrar_base',
      arguments: { motor: 'mysql', nombre: 'tienda' },
    });
    const sol = await esperarConfirmacion(m);
    m.servidor.responderConfirmacion(sol.id, false);
    const r = await llamada;
    expect(r.isError).toBe(true);
    expect(textoDe(r)).toMatch(/rechaz/i);
    expect(m.ops.borrarBase).not.toHaveBeenCalled();
  });

  it('sin respuesta en el plazo, rechaza', async () => {
    const m = await montar({ plazoConfirmacionMs: 100 });
    const c = await conectar(m.url);
    const r = await c.callTool({
      name: 'finalizar_proceso',
      arguments: { pid: 4321, nombre: 'node.exe' },
    });
    expect(r.isError).toBe(true);
    expect(textoDe(r)).toMatch(/tiempo/i);
    expect(m.ops.finalizarProceso).not.toHaveBeenCalled();
    // Una respuesta tardía (id vencido) se ignora.
    expect(m.servidor.responderConfirmacion(m.confirmaciones[0]!.id, true)).toBe(false);
    expect(m.ops.finalizarProceso).not.toHaveBeenCalled();
  });

  it('una respuesta con un id desconocido se ignora', async () => {
    const m = await montar();
    expect(m.servidor.responderConfirmacion('no-existe', true)).toBe(false);
  });

  it('finalizar_proceso aprobado pasa el nombre como confirmación', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    const llamada = c.callTool({
      name: 'finalizar_proceso',
      arguments: { pid: 4321, nombre: 'node.exe' },
    });
    const sol = await esperarConfirmacion(m);
    expect(sol.resumen).toContain('4321');
    m.servidor.responderConfirmacion(sol.id, true);
    await llamada;
    expect(m.ops.finalizarProceso).toHaveBeenCalledWith(4321, 'node.exe');
  });

  it('detener rechaza las confirmaciones pendientes', async () => {
    const m = await montar();
    const c = await conectar(m.url);
    const llamada = c.callTool({
      name: 'borrar_base',
      arguments: { motor: 'mysql', nombre: 'tienda' },
    });
    const sol = await esperarConfirmacion(m);
    const detencion = m.servidor.detener();
    // La conexión se corta: la llamada falla o vuelve como error de herramienta.
    const r = await llamada.catch(() => null);
    if (r) expect(r.isError).toBe(true);
    await detencion;
    expect(m.servidor.responderConfirmacion(sol.id, true)).toBe(false);
    expect(m.ops.borrarBase).not.toHaveBeenCalled();
  });

  describe('restaurar_base', () => {
    async function conRespaldos(): Promise<{ m: Montaje; carpeta: string; archivo: string }> {
      const raiz = await carpetaTemporal('pel-mcp-');
      const carpeta = path.join(raiz, 'respaldos');
      await mkdir(carpeta);
      const archivo = path.join(carpeta, 'tienda.sql.gz');
      await writeFile(archivo, 'x');
      await writeFile(path.join(raiz, 'fuera.sql'), 'x');
      const m = await montar({ ops: operacionesFalsas(carpeta) });
      return { m, carpeta, archivo };
    }

    it('solo admite archivos dentro de la carpeta de respaldos', async () => {
      const { m, carpeta } = await conRespaldos();
      const c = await conectar(m.url);
      for (const archivo of [
        path.join(carpeta, '..', 'fuera.sql'),
        '../fuera.sql',
        path.join(carpeta, 'no-existe.sql'),
        carpeta,
      ]) {
        const r = await c.callTool({
          name: 'restaurar_base',
          arguments: { motor: 'mysql', archivo, base: 'tienda' },
        });
        expect(r.isError).toBe(true);
      }
      expect(m.confirmaciones).toHaveLength(0);
      expect(m.ops.restaurarBase).not.toHaveBeenCalled();
    });

    it('con un nombre relativo a la carpeta y aprobado, restaura', async () => {
      const { m, archivo } = await conRespaldos();
      const c = await conectar(m.url);
      const llamada = c.callTool({
        name: 'restaurar_base',
        arguments: {
          motor: 'mysql',
          archivo: 'tienda.sql.gz',
          base: 'tienda',
          sobrescribir: true,
        },
      });
      const sol = await esperarConfirmacion(m);
      expect(sol.resumen).toContain('tienda.sql.gz');
      m.servidor.responderConfirmacion(sol.id, true);
      const r = await llamada;
      expect(r.isError).toBeFalsy();
      const [, ruta, base, opts] = vi.mocked(m.ops.restaurarBase).mock.calls[0]!;
      expect(await realpath(ruta)).toBe(await realpath(archivo));
      expect(base).toBe('tienda');
      expect(opts).toEqual({ confirmarSobrescribir: true });
      expect(await readFile(ruta, 'utf8')).toBe('x');
    });
  });
});

describe('Nucleo: servidor MCP', () => {
  async function puertoLibre(): Promise<number> {
    const s = net.createServer();
    await new Promise<void>((r) => s.listen(0, '127.0.0.1', r));
    const p = (s.address() as net.AddressInfo).port;
    await new Promise((r) => s.close(r));
    return p;
  }

  async function crearNucleo(base: string): Promise<Nucleo> {
    const hosts = path.join(base, 'hosts');
    await writeFile(hosts, '');
    const plataforma: Plataforma = {
      rutaHosts: () => hosts,
      escribirComoAdmin: async () => ({ ok: true }),
      quienUsaPuerto: async () => null,
      duenosDePuertos: async () => new Map(),
      instalarCertificadoUsuario: async () => ({ ok: true as const }),
      quitarCertificadoUsuario: async () => ({ ok: true as const }),
      certificadoInstalado: async () => false,
      procesoVivo: async () => ({ vivo: false }),
      matarArbol: async () => undefined,
      abrirUrl: async () => undefined,
      ejecutable: (n) => `${n}.exe`,
      carpetaDocumentos: async () => base,
    };
    return Nucleo.crear({
      base,
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
    });
  }

  it('guarda el token en credenciales.json (nunca en config.json) y pide confirmación por evento', async () => {
    const base = await carpetaTemporal('pel-mcp-nucleo-');
    const puerto = await puertoLibre();
    await writeFile(
      path.join(base, 'config.json'),
      JSON.stringify({ version: 1, mcp: { puerto } }),
    );
    const n = await crearNucleo(base);
    try {
      expect(n.estadoMcp().activo).toBe(false);
      const solicitudes: SolicitudConfirmacion[] = [];
      n.eventos.on('mcp:confirmar', (s) => solicitudes.push(s));
      expect(await n.iniciarMcp()).toMatchObject({ activo: true, puerto });

      const cred = JSON.parse(await readFile(path.join(base, 'etc', 'credenciales.json'), 'utf8'));
      const token = cred.mcp.clave as string;
      expect(Buffer.from(token, 'base64url').length).toBeGreaterThanOrEqual(32);
      const config = await readFile(path.join(base, 'config.json'), 'utf8');
      expect(config).not.toContain(token);
      expect(JSON.parse(config).mcp).toEqual({ activo: true, puerto });
      expect(await n.configuracionMcp()).toContain(token);

      const c = await conectar(`http://127.0.0.1:${puerto}/mcp`, token);
      const r = await c.callTool({ name: 'listar_proyectos', arguments: {} });
      expect(JSON.parse(textoDe(r))).toEqual([]);
      const desconocido = await c.callTool({
        name: 'iniciar_servicio',
        arguments: { id: 'php-no-instalado' },
      });
      expect(desconocido.isError).toBe(true);

      const borrar = c.callTool({
        name: 'borrar_base',
        arguments: { motor: 'mysql', nombre: 'x' },
      });
      for (let i = 0; i < 200 && solicitudes.length === 0; i++) {
        await new Promise((res) => setTimeout(res, 10));
      }
      expect(solicitudes[0]).toMatchObject({ herramienta: 'borrar_base' });
      expect(JSON.stringify(solicitudes)).not.toContain(token);
      expect(n.responderConfirmacionMcp(solicitudes[0]!.id, false)).toBe(true);
      expect((await borrar).isError).toBe(true);

      await n.detenerMcp();
      expect(n.estadoMcp().activo).toBe(false);
      expect(JSON.parse(await readFile(path.join(base, 'config.json'), 'utf8')).mcp.activo).toBe(
        false,
      );
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });

  it('con mcp.activo arranca solo; el puerto ocupado queda como aviso', async () => {
    const base = await carpetaTemporal('pel-mcp-nucleo-');
    const ocupante = net.createServer();
    await new Promise<void>((r) => ocupante.listen(0, '127.0.0.1', r));
    const puerto = (ocupante.address() as net.AddressInfo).port;
    await writeFile(
      path.join(base, 'config.json'),
      JSON.stringify({ version: 1, mcp: { activo: true, puerto } }),
    );
    try {
      const n = await crearNucleo(base);
      try {
        expect(n.estadoMcp().activo).toBe(false);
        expect(n.tomarAvisoInicio()).toMatch(/servidor MCP.*en uso/);
      } finally {
        await n.cerrar({ detenerServicios: false });
      }
    } finally {
      await new Promise((r) => ocupante.close(r));
    }
  });
});
