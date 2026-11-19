import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { Client } from 'basic-ftp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Almacen, AlmacenCredenciales } from '../src/almacen';
import { ServidorFtp } from '../src/ftp/servidorFtp';
import { SistemaArchivosEncerrado } from '../src/ftp/sistemaArchivos';
import { Rutas } from '../src/rutas';
import type { Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let base: string;
let sitio: string;
let fuera: string;
let almacen: Almacen;
let credenciales: AlmacenCredenciales;
let servidor: ServidorFtp;
let puerto: number;
const clientes: Client[] = [];

const puertoLibre = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(p));
    });
  });

const escuchaEn = (p: number): Promise<net.Server | null> =>
  new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(null));
    s.listen(p, '127.0.0.1', () => resolve(s));
  });

/**
 * Primer puerto de un bloque de `n` puertos libres en 127.0.0.1, fuera del rango efímero
 * (Windows 49152+, Linux 32768+). Windows reparte los efímeros en orden: un rango pasivo sacado
 * de `listen(0)` coincide con los siguientes puertos que el sistema da a otros sockets, y si
 * ftp-srv no puede abrir el suyo la orden PASV/EPSV se queda colgada.
 */
const rangoPasivoLibre = async (n: number): Promise<number> => {
  for (let intento = 0; intento < 50; intento++) {
    const desde = 20000 + Math.floor(Math.random() * (32000 - 20000 - n));
    const abiertos: net.Server[] = [];
    for (let p = desde; p < desde + n; p++) {
      const s = await escuchaEn(p);
      if (!s) break;
      abiertos.push(s);
    }
    await Promise.all(abiertos.map((s) => new Promise((r) => s.close(r))));
    if (abiertos.length === n) return desde;
  }
  throw new Error('No hay un bloque de puertos libres para el modo pasivo');
};

const sitioBase = (carpeta: string): Sitio => ({
  id: 'demo',
  nombre: 'Demo',
  dominio: 'demo.test',
  alias: [],
  carpeta,
  tipo: 'estatico',
  php: null,
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: null,
  datosReales: false,
  nota: '',
  https: false,
  redirigirHttps: false,
  confiado: false,
  git: null,
  procesos: [],
  runtimes: {},
});

const nuevoCliente = (): Client => {
  const c = new Client(5000);
  clientes.push(c);
  return c;
};

const conectar = async (usuario: string, clave: string): Promise<Client> => {
  const c = nuevoCliente();
  await c.access({ host: '127.0.0.1', port: puerto, user: usuario, password: clave });
  return c;
};

const conClave = async (): Promise<Client> => {
  const cred = await servidor.credencialesFtp('demo');
  return conectar('demo', cred!.clave);
};

const archivoLocal = (nombre = 'o.txt'): string => {
  const f = path.join(base, nombre);
  writeFileSync(f, 'x');
  return f;
};

beforeEach(async () => {
  base = await carpetaTemporal('pel-ftp-');
  sitio = path.join(base, 'sitio');
  fuera = path.join(base, 'fuera');
  mkdirSync(sitio);
  mkdirSync(fuera);
  writeFileSync(path.join(base, 'secreto.txt'), 'no debe salir');
  writeFileSync(path.join(fuera, 'secreto.txt'), 'no debe salir');
  writeFileSync(path.join(sitio, 'index.html'), 'hola');
  const rutas = new Rutas(base);
  await rutas.asegurar();
  almacen = new Almacen(rutas);
  credenciales = new AlmacenCredenciales(rutas);
  puerto = await puertoLibre();
  const pasivo = await rangoPasivoLibre(21);
  const cfg = await almacen.leer();
  cfg.sitios.push(sitioBase(sitio));
  cfg.ftp = { puerto, redLocal: false, pasivos: [pasivo, pasivo + 20] };
  await almacen.guardar(cfg);
  servidor = new ServidorFtp({
    leerConfig: () => almacen.leer(),
    modificarConfig: async (fn) => {
      const c = await almacen.leer();
      fn(c);
      await almacen.guardar(c);
    },
    credenciales,
  });
  await servidor.activarSitio('demo');
  await servidor.iniciar();
});

afterEach(async () => {
  for (const c of clientes.splice(0)) c.close();
  await servidor.detener();
});

describe('ServidorFtp', () => {
  it('estado: servicio "ftp" de la categoría herramienta con su puerto', async () => {
    expect(await servidor.estado()).toMatchObject({
      id: 'ftp',
      categoria: 'herramienta',
      estado: 'encendido',
      puertos: [puerto],
    });
    await servidor.detener();
    expect((await servidor.estado()).estado).toBe('apagado');
  });

  it('activarSitio crea el usuario con una clave de 16 caracteres, fuera de config.json', async () => {
    const c = await servidor.credencialesFtp('demo');
    expect(c?.usuario).toBe('demo');
    expect(c?.clave).toMatch(/^[A-Za-z0-9]{16}$/);
    const cfg = readFileSync(new Rutas(base).config(), 'utf8');
    expect(cfg).not.toContain(c!.clave);
    expect(JSON.parse(cfg).sitios[0].ftp).toEqual({
      activo: true,
      usuario: 'demo',
      soloLectura: false,
    });
    expect(readFileSync(new Rutas(base).credenciales(), 'utf8')).toContain('ftp:demo');
  });

  it('sube y baja un archivo', { timeout: 20000 }, async () => {
    const c = await conClave();
    await c.uploadFrom(archivoLocal('origen.txt'), 'nuevo.txt');
    expect(readFileSync(path.join(sitio, 'nuevo.txt'), 'utf8')).toBe('x');
    const destino = path.join(base, 'bajado.txt');
    await c.downloadTo(destino, 'index.html');
    expect(readFileSync(destino, 'utf8')).toBe('hola');
  });

  it('cd .. en la raíz se queda en la raíz', async () => {
    const c = await conClave();
    await c.cd('..');
    expect(await c.pwd()).toBe('/');
    await c.cd('../..');
    expect(await c.pwd()).toBe('/');
  });

  it('get ../../secreto.txt es denegado', async () => {
    const c = await conClave();
    const destino = path.join(base, 'robado.txt');
    await expect(c.downloadTo(destino, '../../secreto.txt')).rejects.toThrow();
    await expect(c.downloadTo(destino, '../secreto.txt')).rejects.toThrow();
    await expect(c.downloadTo(destino, '..\\..\\secreto.txt')).rejects.toThrow();
    expect(existsSync(destino) ? readFileSync(destino, 'utf8') : '').not.toBe('no debe salir');
  });

  it.each([
    'C:\\Windows',
    'C:/Windows',
    '/C:/Windows',
    'c:',
    '\\\\servidor\\recurso',
    '//servidor/recurso',
    'index.html:flujo',
    'a.txt:x',
    '..  /x',
    'nul',
    'nul .txt',
    'COM1 .log',
  ])('rechaza la ruta %j', { timeout: 20000 }, async (ruta) => {
    const c = await conClave();
    await expect(c.cd(ruta)).rejects.toThrow();
    await expect(c.list(ruta)).rejects.toThrow();
    await expect(c.uploadFrom(archivoLocal(), ruta)).rejects.toThrow();
    await expect(c.downloadTo(path.join(base, 'd.txt'), ruta)).rejects.toThrow();
  });

  it('un error al abrir el flujo (STOR sobre una carpeta) no revela rutas locales', async () => {
    mkdirSync(path.join(sitio, 'carpeta'));
    const fs = new SistemaArchivosEncerrado({}, { root: sitio, soloLectura: () => false });
    const { stream } = await fs.write('carpeta');
    const e = await new Promise<Error>((resolve) => stream.once('error', resolve));
    expect(e.message).not.toContain(base);
    expect(e.message).not.toMatch(/[A-Za-z]:\|pel-ftp/);
    const lectura = await fs.read('index.html');
    rmSync(path.join(sitio, 'index.html'));
    const e2 = await new Promise<Error | null>((resolve) => {
      lectura.stream.once('error', resolve);
      lectura.stream.once('end', () => resolve(null));
      lectura.stream.resume();
    });
    if (e2) expect(e2.message).not.toContain(base);
  });

  it('PORT y EPRT (modo activo) se rechazan', async () => {
    const c = await conClave();
    await expect(c.send('PORT 127,0,0,1,200,10')).rejects.toThrow(/502/);
    await expect(c.send('EPRT |1|127.0.0.1|51210|')).rejects.toThrow(/502/);
  });

  it('renombrar hacia fuera del sitio se deniega', async () => {
    const c = await conClave();
    await expect(c.rename('index.html', '../../x')).rejects.toThrow(/Acceso denegado/);
    await expect(c.rename('index.html', 'C:\\x')).rejects.toThrow(/Acceso denegado/);
    expect(existsSync(path.join(sitio, 'index.html'))).toBe(true);
  });

  it('cortarSesiones cierra las sesiones abiertas del sitio', async () => {
    const c = await conClave();
    await servidor.cortarSesiones('demo');
    await expect(c.list()).rejects.toThrow();
  });

  it('el rechazo de una ruta fuera del sitio dice "Acceso denegado"', async () => {
    const c = await conClave();
    await expect(c.cd('C:\\Windows')).rejects.toThrow(/Acceso denegado/);
    await expect(c.downloadTo(path.join(base, 'd.txt'), '../../secreto.txt')).rejects.toThrow(
      /Acceso denegado/,
    );
  });

  it('rechaza un flujo alterno de datos al subir (a.txt:x) y no crea nada', async () => {
    const c = await conClave();
    await expect(c.uploadFrom(archivoLocal(), 'a.txt:x')).rejects.toThrow(/Acceso denegado/);
    await expect(c.uploadFrom(archivoLocal(), 'index.html:x')).rejects.toThrow(/Acceso denegado/);
    expect(readFileSync(path.join(sitio, 'index.html'), 'utf8')).toBe('hola');
  });

  it('una unión de directorios (junction) que apunta fuera no deja salir', async (ctx) => {
    try {
      symlinkSync(fuera, path.join(sitio, 'enlace'), 'junction');
    } catch {
      ctx.skip();
    }
    const c = await conClave();
    await expect(c.downloadTo(path.join(base, 'j.txt'), 'enlace/secreto.txt')).rejects.toThrow();
    await expect(c.cd('enlace')).rejects.toThrow(/Acceso denegado/);
    await expect(c.uploadFrom(archivoLocal(), 'enlace/nuevo.txt')).rejects.toThrow();
    expect(existsSync(path.join(fuera, 'nuevo.txt'))).toBe(false);
  });

  it('un enlace simbólico a un archivo de fuera tampoco deja salir', async (ctx) => {
    try {
      symlinkSync(path.join(fuera, 'secreto.txt'), path.join(sitio, 'sec.txt'), 'file');
    } catch {
      ctx.skip();
    }
    const c = await conClave();
    await expect(c.downloadTo(path.join(base, 'j.txt'), 'sec.txt')).rejects.toThrow();
  });

  it('en solo lectura falla put, mkdir, borrar y renombrar, pero se puede leer', async () => {
    await servidor.soloLectura('demo', true);
    const c = await conClave();
    await expect(c.uploadFrom(archivoLocal(), 'nuevo.txt')).rejects.toThrow();
    await expect(c.send('MKD carpeta')).rejects.toThrow();
    await expect(c.remove('index.html')).rejects.toThrow();
    await expect(c.rename('index.html', 'otro.html')).rejects.toThrow();
    expect(existsSync(path.join(sitio, 'nuevo.txt'))).toBe(false);
    expect(existsSync(path.join(sitio, 'carpeta'))).toBe(false);
    expect(existsSync(path.join(sitio, 'index.html'))).toBe(true);
    const destino = path.join(base, 'b.txt');
    await c.downloadTo(destino, 'index.html');
    expect(readFileSync(destino, 'utf8')).toBe('hola');
  });

  it('soloLectura(false) vuelve a permitir escribir en una sesión ya abierta', async () => {
    await servidor.soloLectura('demo', true);
    const c = await conClave();
    await expect(c.uploadFrom(archivoLocal(), 'a.txt')).rejects.toThrow();
    await servidor.soloLectura('demo', false);
    await c.uploadFrom(archivoLocal(), 'a.txt');
    expect(existsSync(path.join(sitio, 'a.txt'))).toBe(true);
  });

  it('una clave mala o un usuario desconocido fallan con el mismo mensaje; un sitio desactivado también', async () => {
    const e1 = await nuevoCliente()
      .access({ host: '127.0.0.1', port: puerto, user: 'demo', password: 'mala' })
      .catch((e: Error) => e);
    const e2 = await nuevoCliente()
      .access({ host: '127.0.0.1', port: puerto, user: 'nadie', password: 'mala' })
      .catch((e: Error) => e);
    expect(e1).toBeInstanceOf(Error);
    expect((e1 as Error).message).toBe((e2 as Error).message);
    expect((e1 as Error).message).toMatch(/530/);

    const { clave } = (await servidor.credencialesFtp('demo'))!;
    await servidor.desactivarSitio('demo');
    await expect(
      nuevoCliente().access({ host: '127.0.0.1', port: puerto, user: 'demo', password: clave }),
    ).rejects.toThrow(/530/);
  });

  it('desactivar el sitio corta la sesión abierta y borra la clave', async () => {
    const c = await conClave();
    await servidor.desactivarSitio('demo');
    await expect(c.list()).rejects.toThrow();
    expect(await servidor.credencialesFtp('demo')).toBeNull();
    expect((await almacen.leer()).sitios[0]?.ftp?.activo).toBe(false);
  });

  it('regenerarClave invalida la anterior y corta las sesiones', async () => {
    const vieja = (await servidor.credencialesFtp('demo'))!.clave;
    const c = await conClave();
    const nueva = await servidor.regenerarClave('demo');
    expect(nueva).toMatch(/^[A-Za-z0-9]{16}$/);
    expect(nueva).not.toBe(vieja);
    await expect(c.list()).rejects.toThrow();
    await expect(
      nuevoCliente().access({ host: '127.0.0.1', port: puerto, user: 'demo', password: vieja }),
    ).rejects.toThrow(/530/);
    await (await conectar('demo', nueva)).list();
  });

  it('escucha solo en 127.0.0.1 por defecto', async () => {
    expect(servidor.direccion()).toBe('127.0.0.1');
    const externa = Object.values(os.networkInterfaces())
      .flat()
      .find((i) => i && i.family === 'IPv4' && !i.internal);
    if (!externa) return; // sin red no hay con qué comprobarlo
    const conecta = await new Promise<boolean>((resolve) => {
      const s = net.connect({ host: externa.address, port: puerto, timeout: 2000 });
      s.once('connect', () => {
        s.destroy();
        resolve(true);
      });
      s.once('error', () => resolve(false));
      s.once('timeout', () => {
        s.destroy();
        resolve(false);
      });
    });
    expect(conecta).toBe(false);
  });

  it('con "red local" escucha en todas las interfaces', async () => {
    await servidor.detener();
    const cfg = await almacen.leer();
    cfg.ftp.redLocal = true;
    await almacen.guardar(cfg);
    await servidor.iniciar();
    expect(servidor.direccion()).toBe('0.0.0.0');
  });

  it('un puerto ocupado da un error claro y queda en error', async () => {
    await servidor.detener();
    const ocupante = net.createServer();
    await new Promise<void>((r) => ocupante.listen(puerto, '127.0.0.1', r));
    try {
      await expect(servidor.iniciar()).rejects.toThrow(new RegExp(`puerto ${puerto}`));
      expect((await servidor.estado()).estado).toBe('error');
    } finally {
      await new Promise((r) => ocupante.close(r));
    }
  });
});
