import {
  linkSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearDetectorSensible } from '../src/herramientas/archivoSensible';
import { detectorCompartir, firmaCoincide } from '../src/compartir/contenido';
import { execFileSync } from 'node:child_process';
import { ServidorCompartir, type AccesoCompartido } from '../src/compartir/servidor';

const TOKEN = 'Tok3n_de-prueba_0123456789abc';
let base: string;
let raiz: string;
let fuera: string;
let servidores: ServidorCompartir[];
let accesos: AccesoCompartido[];

const PEM = '-----BEGIN RSA PRIVATE KEY-----\nMIIEfake\n-----END RSA PRIVATE KEY-----\n';

interface Resp {
  codigo: number;
  cabeceras: http.IncomingHttpHeaders;
  cuerpo: Buffer;
}

function pedir(
  puerto: number,
  ruta: string,
  o: { metodo?: string; cabeceras?: Record<string, string> } = {},
): Promise<Resp> {
  return new Promise((ok, mal) => {
    const r = http.request(
      {
        host: '127.0.0.1',
        port: puerto,
        path: ruta,
        method: o.metodo ?? 'GET',
        headers: o.cabeceras,
      },
      (res) => {
        const trozos: Buffer[] = [];
        res.on('data', (t: Buffer) => trozos.push(t));
        res.on('end', () =>
          ok({
            codigo: res.statusCode ?? 0,
            cabeceras: res.headers,
            cuerpo: Buffer.concat(trozos),
          }),
        );
      },
    );
    r.on('error', mal);
    r.end();
  });
}

async function iniciar(
  o: Partial<{
    raiz: string;
    tipo: 'carpeta' | 'archivo';
    sitios: { carpeta: string; datosReales: boolean }[];
    maxConexiones: number;
    proveedor: 'cloudflare-rapido' | 'ngrok' | null;
    plazoMs: number;
  }> = {},
): Promise<ServidorCompartir> {
  const s = await ServidorCompartir.iniciar({
    raiz: o.raiz ?? raiz,
    tipo: o.tipo ?? 'carpeta',
    token: TOKEN,
    detector: detectorCompartir(crearDetectorSensible(o.sitios ?? [])),
    alAcceso: (a) => accesos.push(a),
    ...(o.maxConexiones ? { maxConexiones: o.maxConexiones } : {}),
    ...(o.proveedor !== undefined ? { proveedor: o.proveedor } : {}),
    ...(o.plazoMs ? { plazoMs: o.plazoMs } : {}),
  });
  servidores.push(s);
  return s;
}

beforeEach(() => {
  base = realpathSync.native(mkdtempSync(path.join(os.tmpdir(), 'wc-compartir-')));
  raiz = path.join(base, 'compartido');
  fuera = path.join(base, 'fuera');
  mkdirSync(path.join(raiz, 'sub', '.git'), { recursive: true });
  mkdirSync(fuera);
  writeFileSync(path.join(raiz, 'a.txt'), 'hola');
  writeFileSync(path.join(raiz, 'sub', 'b.txt'), 'bbb');
  writeFileSync(path.join(raiz, 'sub', '.git', 'config'), 'x');
  writeFileSync(path.join(raiz, '.env'), 'APP_KEY=base64:abc');
  writeFileSync(path.join(raiz, '.env.local'), 'X=1');
  writeFileSync(path.join(raiz, 'llave.pem'), 'x');
  writeFileSync(path.join(raiz, 'notas.txt'), PEM);
  writeFileSync(path.join(raiz, 'pagina.html'), '<script>alert(1)</script>');
  writeFileSync(path.join(raiz, 'dibujo.svg'), '<svg onload="alert(1)"/>');
  writeFileSync(path.join(raiz, 'raro.xyz'), 'datos');
  writeFileSync(path.join(fuera, 'secreto-ajeno.txt'), 'AJENO');
  servidores = [];
  accesos = [];
});

afterEach(async () => {
  await Promise.all(servidores.map((s) => s.cerrar()));
  rmSync(base, { recursive: true, force: true });
});

describe('token', () => {
  it('sin token o con otro token, 404 vacío', async () => {
    const s = await iniciar();
    for (const r of [
      '/',
      '/a.txt',
      `/${TOKEN}x/a.txt`,
      '/otro/a.txt',
      `/${TOKEN.slice(1)}/a.txt`,
      '//a.txt',
    ]) {
      const x = await pedir(s.puerto, r);
      expect(x.codigo, r).toBe(404);
      expect(x.cuerpo.length).toBe(0);
    }
  });

  it('con el token, sirve el archivo', async () => {
    const s = await iniciar();
    const x = await pedir(s.puerto, `/${TOKEN}/a.txt`);
    expect(x.codigo).toBe(200);
    expect(x.cuerpo.toString()).toBe('hola');
  });

  it('/<token> sin barra redirige a /<token>/', async () => {
    const s = await iniciar();
    const x = await pedir(s.puerto, `/${TOKEN}`);
    expect(x.codigo).toBe(302);
    expect(x.cabeceras.location).toBe(`/${TOKEN}/`);
  });

  it('escucha solo en 127.0.0.1', async () => {
    const s = await iniciar();
    const c = net.connect({ host: '127.0.0.1', port: s.puerto });
    await new Promise<void>((ok, mal) => {
      c.once('connect', ok);
      c.once('error', mal);
    });
    c.destroy();
  });
});

describe('métodos', () => {
  it.each(['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])('%s da 405 con token', async (m) => {
    const s = await iniciar();
    const x = await pedir(s.puerto, `/${TOKEN}/a.txt`, { metodo: m });
    expect(x.codigo).toBe(405);
    expect(x.cabeceras.allow).toBe('GET, HEAD');
  });
  it('sin token, POST da 404 (no revela nada)', async () => {
    const s = await iniciar();
    expect((await pedir(s.puerto, '/a.txt', { metodo: 'POST' })).codigo).toBe(404);
  });
  it('HEAD da las cabeceras sin cuerpo', async () => {
    const s = await iniciar();
    const x = await pedir(s.puerto, `/${TOKEN}/a.txt`, { metodo: 'HEAD' });
    expect(x.codigo).toBe(200);
    expect(x.cabeceras['content-length']).toBe('4');
    expect(x.cuerpo.length).toBe(0);
  });
});

describe('listado', () => {
  it('lista lo servible y oculta lo sensible', async () => {
    const s = await iniciar();
    const x = await pedir(s.puerto, `/${TOKEN}/`);
    expect(x.codigo).toBe(200);
    const h = x.cuerpo.toString();
    expect(h).toContain('a.txt');
    expect(h).toContain('href="sub/"');
    for (const oculto of ['.env', 'llave.pem', 'notas.txt', '.git']) {
      expect(h, oculto).not.toContain(`>${oculto}`);
    }
    expect(h).not.toContain(TOKEN);
    expect(x.cabeceras['content-security-policy']).toBe(
      "default-src 'none'; style-src 'unsafe-inline'",
    );
    expect(x.cabeceras['content-type']).toBe('text/html; charset=utf-8');
  });

  it('el nombre con HTML sale escapado', async () => {
    const s = await iniciar();
    writeFileSync(path.join(raiz, 'a&b.txt'), 'x');
    const h = (await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString();
    expect(h).toContain('a&amp;b.txt');
    expect(h).toContain('href="a%26b.txt"');
  });

  it('una subcarpeta sin barra final redirige; con barra se lista', async () => {
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/sub`)).codigo).toBe(302);
    const x = await pedir(s.puerto, `/${TOKEN}/sub/`);
    expect(x.codigo).toBe(200);
    expect(x.cuerpo.toString()).toContain('b.txt');
    expect(x.cuerpo.toString()).not.toContain('>.git');
  });
});

describe('lo que nunca se sirve', () => {
  it.each([
    '.env',
    '.env.local',
    'llave.pem',
    'notas.txt',
    'sub/.git/config',
    'sub/.git/',
    'sub/.git',
  ])('%s da 404', async (r) => {
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/${r}`)).codigo).toBe(404);
  });

  it('un archivo con más de un enlace duro da 404 y no se lista', async () => {
    const s = await iniciar();
    linkSync(path.join(raiz, 'a.txt'), path.join(raiz, 'enlace.txt'));
    expect((await pedir(s.puerto, `/${TOKEN}/enlace.txt`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/a.txt`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString()).not.toContain('enlace.txt');
  });

  it('archivos de un sitio con datos reales', async () => {
    const sitio = path.join(raiz, 'sub');
    const s = await iniciar({ sitios: [{ carpeta: sitio, datosReales: true }] });
    expect((await pedir(s.puerto, `/${TOKEN}/sub/b.txt`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/a.txt`)).codigo).toBe(200);
  });

  it('rutas con trucos dan 404', async () => {
    const s = await iniciar();
    for (const r of [
      '/../fuera/secreto-ajeno.txt',
      '/%2e%2e/fuera/secreto-ajeno.txt',
      '/%2E%2E%2Ffuera%2Fsecreto-ajeno.txt',
      '/sub/../a.txt',
      '/a.txt::$DATA',
      '/a.txt:flujo',
      '/a.txt%3A%3A%24DATA',
      '/sub%5C..%5Ca.txt',
      '/sub\\b.txt',
      '/CON',
      '/nul.txt',
      '/%252e%252e/a.txt',
      '/a.txt.',
      '/a.txt%20',
      '//a.txt',
      '/%00a.txt',
      '/%C0%AE%C0%AE/a.txt',
    ]) {
      const x = await pedir(s.puerto, `/${TOKEN}${r}`);
      expect(x.codigo, r).toBe(404);
      expect(x.cuerpo.length).toBe(0);
    }
  });

  it('una unión hacia fuera de la raíz no se sigue', async () => {
    const s = await iniciar();
    symlinkSync(fuera, path.join(raiz, 'salida'), 'junction');
    expect((await pedir(s.puerto, `/${TOKEN}/salida/secreto-ajeno.txt`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/salida/`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString()).not.toContain('salida');
  });

  it('una unión hacia dentro de la raíz funciona, pero no hacia .git', async () => {
    const s = await iniciar();
    symlinkSync(path.join(raiz, 'sub'), path.join(raiz, 'atajo'), 'junction');
    symlinkSync(path.join(raiz, 'sub', '.git'), path.join(raiz, 'tras'), 'junction');
    expect((await pedir(s.puerto, `/${TOKEN}/atajo/b.txt`)).codigo).toBe(200);
    expect((await pedir(s.puerto, `/${TOKEN}/tras/config`)).codigo).toBe(404);
  });

  it('una unión hacia un .env tampoco', async () => {
    const s = await iniciar();
    try {
      symlinkSync(path.join(raiz, '.env'), path.join(raiz, 'inocente.txt'), 'file');
    } catch {
      return; // sin permiso para enlaces simbólicos de archivo en esta máquina
    }
    expect((await pedir(s.puerto, `/${TOKEN}/inocente.txt`)).codigo).toBe(404);
  });
});

describe('cabeceras', () => {
  it('las comunes van en todas las respuestas', async () => {
    const s = await iniciar();
    for (const r of ['/a.txt', '/', '/nada', '/.env']) {
      const x = await pedir(s.puerto, `/${TOKEN}${r}`);
      expect(x.cabeceras['x-content-type-options'], r).toBe('nosniff');
      expect(x.cabeceras['referrer-policy']).toBe('no-referrer');
      expect(x.cabeceras['cache-control']).toBe('no-store');
      expect(x.cabeceras['x-robots-tag']).toBe('noindex');
    }
    const sin = await pedir(s.puerto, '/x');
    expect(sin.cabeceras['x-content-type-options']).toBe('nosniff');
  });

  it('HTML y SVG se descargan, nunca se muestran', async () => {
    const s = await iniciar();
    for (const n of ['pagina.html', 'dibujo.svg']) {
      const x = await pedir(s.puerto, `/${TOKEN}/${n}`);
      expect(x.codigo).toBe(200);
      expect(x.cabeceras['content-disposition']).toMatch(/^attachment;/);
    }
  });

  it('un tipo desconocido es octet-stream y se descarga', async () => {
    const s = await iniciar();
    const x = await pedir(s.puerto, `/${TOKEN}/raro.xyz`);
    expect(x.cabeceras['content-type']).toBe('application/octet-stream');
    expect(x.cabeceras['content-disposition']).toMatch(/^attachment;/);
  });

  it('un texto se muestra en línea', async () => {
    const s = await iniciar();
    const x = await pedir(s.puerto, `/${TOKEN}/a.txt`);
    expect(x.cabeceras['content-type']).toBe('text/plain; charset=utf-8');
    expect(x.cabeceras['content-disposition']).toBeUndefined();
  });
});

describe('vencimiento', () => {
  it('pasado el vencimiento todo da 404 y se puede fijar después de iniciar', async () => {
    let ahora = 1000;
    const s = await ServidorCompartir.iniciar({
      raiz,
      tipo: 'carpeta',
      token: TOKEN,
      detector: crearDetectorSensible([]),
      alAcceso: (a) => accesos.push(a),
      ahora: () => ahora,
    });
    servidores.push(s);
    expect((await pedir(s.puerto, `/${TOKEN}/a.txt`)).codigo).toBe(200);
    s.fijarExpira(2000);
    expect((await pedir(s.puerto, `/${TOKEN}/a.txt`)).codigo).toBe(200);
    ahora = 2000;
    expect((await pedir(s.puerto, `/${TOKEN}/a.txt`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/`)).codigo).toBe(404);
  });
});

describe('carpetas de un sitio con datos reales dentro de lo compartido', () => {
  it('ni se listan ni se abren', async () => {
    const sitio = path.join(raiz, 'sub');
    const s = await iniciar({ sitios: [{ carpeta: sitio, datosReales: true }] });
    expect((await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString()).not.toContain('href="sub/"');
    expect((await pedir(s.puerto, `/${TOKEN}/sub/`)).codigo).toBe(404);
  });
});

describe('un solo archivo', () => {
  it('se sirve por su nombre y nada más', async () => {
    const s = await iniciar({ raiz: path.join(raiz, 'a.txt'), tipo: 'archivo' });
    expect((await pedir(s.puerto, `/${TOKEN}/a.txt`)).cuerpo.toString()).toBe('hola');
    expect((await pedir(s.puerto, `/${TOKEN}/sub/b.txt`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/pagina.html`)).codigo).toBe(404);
    const l = (await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString();
    expect(l).toContain('a.txt');
    expect(l).not.toContain('pagina.html');
  });
});

describe('registro de accesos', () => {
  it('anota ruta relativa y código, sin el token', async () => {
    const s = await iniciar();
    await pedir(s.puerto, `/${TOKEN}/a.txt`);
    await pedir(s.puerto, `/${TOKEN}/nada`);
    await pedir(s.puerto, `/${TOKEN}/a.txt`, { metodo: 'POST' });
    await pedir(s.puerto, '/adivinando/a.txt');
    expect(accesos.map((a) => [a.metodo, a.ruta, a.codigo])).toEqual([
      ['GET', '/a.txt', 200],
      ['GET', '/nada', 404],
      ['POST', '/', 405],
      ['GET', null, 404],
    ]);
    expect(JSON.stringify(accesos)).not.toContain(TOKEN);
    expect(JSON.stringify(accesos)).not.toContain('adivinando');
  });

  it('usa cf-connecting-ip si viene del túnel, solo si parece una IP', async () => {
    const s = await iniciar({ proveedor: 'cloudflare-rapido' });
    await pedir(s.puerto, `/${TOKEN}/a.txt`, { cabeceras: { 'cf-connecting-ip': '203.0.113.9' } });
    await pedir(s.puerto, `/${TOKEN}/a.txt`, { cabeceras: { 'cf-connecting-ip': '<script>' } });
    expect(accesos[0]!.ip).toBe('203.0.113.9');
    expect(accesos[1]!.ip).toBe('127.0.0.1');
  });

  it('limpia controles de una ruta pedida', async () => {
    const s = await iniciar();
    await pedir(s.puerto, `/${TOKEN}/a%0d%0ab`);
    expect(accesos[0]!.ruta).not.toMatch(/[\r\n]/);
  });
});

describe('límites', () => {
  it('corta las conexiones por encima del tope', async () => {
    const s = await iniciar({ maxConexiones: 3 });
    const abiertas: net.Socket[] = [];
    for (let i = 0; i < 3; i++) {
      const c = net.connect({ host: '127.0.0.1', port: s.puerto });
      await new Promise<void>((ok) => c.once('connect', () => ok()));
      abiertas.push(c);
    }
    const extra = net.connect({ host: '127.0.0.1', port: s.puerto });
    const cerro = await new Promise<boolean>((ok) => {
      extra.once('close', () => ok(true));
      extra.once('error', () => ok(true));
      setTimeout(() => ok(false), 2000);
    });
    expect(cerro).toBe(true);
    for (const c of abiertas) c.destroy();
  });

  it('cerrar corta una descarga en curso y libera el puerto', async () => {
    const s = await iniciar();
    writeFileSync(path.join(raiz, 'grande.mp4'), medio('mp4', 30 * 1024 * 1024));
    const antes = s.puerto;
    const parte = await new Promise<number>((ok) => {
      http.get({ host: '127.0.0.1', port: antes, path: `/${TOKEN}/grande.mp4` }, (res) => {
        res.once('data', (d: Buffer) => {
          res.pause();
          ok(d.length);
        });
        res.on('error', () => undefined);
      });
    });
    expect(parte).toBeGreaterThan(0);
    await s.cerrar();
    await expect(pedir(antes, `/${TOKEN}/a.txt`)).rejects.toBeTruthy();
  });

  it('un archivo grande llega entero por stream', async () => {
    const s = await iniciar();
    const buf = Buffer.alloc(5 * 1024 * 1024 + 7, 65);
    writeFileSync(path.join(raiz, 'medio.bin'), buf);
    const x = await pedir(s.puerto, `/${TOKEN}/medio.bin`);
    expect(x.cuerpo.length).toBe(buf.length);
  });
});

describe('IP del registro según el proveedor (solo la cabecera del proveedor activo)', () => {
  it('Cloudflare: solo cf-connecting-ip; x-forwarded-for se ignora', async () => {
    const s = await iniciar({ proveedor: 'cloudflare-rapido' });
    await pedir(s.puerto, `/${TOKEN}/a.txt`, {
      cabeceras: { 'x-forwarded-for': '10.9.9.9', 'cf-connecting-ip': '203.0.113.9' },
    });
    await pedir(s.puerto, `/${TOKEN}/a.txt`, { cabeceras: { 'x-forwarded-for': '10.9.9.9' } });
    expect(accesos.map((a) => a.ip)).toEqual(['203.0.113.9', '127.0.0.1']);
  });
  it('ngrok: el último salto de x-forwarded-for; cf-connecting-ip no vale', async () => {
    const s = await iniciar({ proveedor: 'ngrok' });
    await pedir(s.puerto, `/${TOKEN}/a.txt`, {
      cabeceras: { 'x-forwarded-for': '10.1.1.1, 198.51.100.4', 'cf-connecting-ip': '203.0.113.9' },
    });
    expect(accesos[0]!.ip).toBe('198.51.100.4');
  });
  it('sin túnel: la del socket, sea lo que sea lo que diga la petición', async () => {
    const s = await iniciar({ proveedor: null });
    await pedir(s.puerto, `/${TOKEN}/a.txt`, {
      cabeceras: { 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '10.1.1.1' },
    });
    expect(accesos[0]!.ip).toBe('127.0.0.1');
  });
});

describe('datos de otros programas dentro de lo compartido (valores falsos)', () => {
  it.each([
    'cookies.sqlite',
    'key4.db',
    'logins.json',
    'Login Data',
    'Cookies',
    'Web Data',
    'sitemanager.xml',
    'recentservers.xml',
    'state.vscdb',
    '.pypirc',
    '.npmrc',
    '.netrc',
    '_netrc',
    '.git-credentials',
    'claves.kdbx',
    'cert.pfx',
    'cert.p12',
    'id_ed25519',
    'putty.ppk',
  ])('%s da 404 y no se lista', async (n) => {
    writeFileSync(path.join(raiz, n), 'contenido falso inocente');
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/${encodeURIComponent(n)}`)).codigo).toBe(404);
    const l = (await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString();
    expect(l).not.toContain(`>${n}<`);
  });

  it('un archivo normal vecino sí se sirve (no se esconde de más)', async () => {
    writeFileSync(path.join(raiz, 'cookies.sqlite'), 'x');
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/a.txt`)).codigo).toBe(200);
  });

  it.each([
    'AppData',
    '.claude',
    '.codex',
    '.config',
    '.npm',
    '.m2',
    '.gradle',
    '.cargo',
    '.nuget',
    '.vscode',
    '.idea',
    '.mozilla',
  ])('la carpeta %s dentro de lo compartido no se abre ni se lista', async (n) => {
    mkdirSync(path.join(raiz, n), { recursive: true });
    writeFileSync(path.join(raiz, n, 'dentro.txt'), 'x');
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/${n}/dentro.txt`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/${n}/`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString()).not.toContain(`>${n}/`);
  });
});

describe('archivos de más de 8 MB', () => {
  const GRANDE = 8 * 1024 * 1024 + 1024;
  it('un texto o tipo desconocido no se sirve y el listado lo marca; un medio o paquete sí', async () => {
    writeFileSync(path.join(raiz, 'volcado.txt'), Buffer.alloc(GRANDE, 65));
    writeFileSync(path.join(raiz, 'datos.bin'), Buffer.alloc(GRANDE, 65));
    writeFileSync(path.join(raiz, 'copia.zip'), medio('zip', GRANDE));
    writeFileSync(path.join(raiz, 'video.mp4'), medio('mp4', GRANDE));
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/volcado.txt`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/datos.bin`)).codigo).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/copia.zip`)).cuerpo.length).toBe(GRANDE);
    expect((await pedir(s.puerto, `/${TOKEN}/video.mp4`, { metodo: 'HEAD' })).codigo).toBe(200);
    const l = (await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString();
    expect(l).toMatch(/volcado\.txt <em>\(too large to review\)<\/em>/);
    expect(l).not.toContain('href="volcado.txt"');
    expect(l).toContain('href="copia.zip"');
  });
  it('de 8 MB o menos, un texto sí se sirve', async () => {
    writeFileSync(path.join(raiz, 'justo.txt'), Buffer.alloc(8 * 1024 * 1024, 65));
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/justo.txt`)).codigo).toBe(200);
  });
  it('un PDF se descarga (attachment)', async () => {
    writeFileSync(path.join(raiz, 'doc.pdf'), 'x');
    const s = await iniciar();
    const x = await pedir(s.puerto, `/${TOKEN}/doc.pdf`);
    expect(x.cabeceras['content-disposition']).toMatch(/^attachment;/);
  });
});

describe('lentitud', () => {
  it('un lector que no lee una descarga grande pierde la conexión', async () => {
    writeFileSync(path.join(raiz, 'enorme.mp4'), medio('mp4', 60 * 1024 * 1024));
    const s = await iniciar({ plazoMs: 400 });
    const c = net.connect({ host: '127.0.0.1', port: s.puerto });
    c.pause();
    c.write(`GET /${TOKEN}/enorme.mp4 HTTP/1.1\r\nHost: x\r\n\r\n`);
    // El lector no lee durante un rato (más que el plazo); al volver a leer, el servidor ya cortó.
    await new Promise((r) => setTimeout(r, 1500));
    let recibido = 0;
    c.on('data', (d: Buffer) => (recibido += d.length));
    c.resume();
    const cerro = await new Promise<boolean>((ok) => {
      c.once('close', () => ok(true));
      setTimeout(() => ok(false), 6000);
    });
    c.destroy();
    expect(cerro).toBe(true);
    expect(recibido).toBeLessThan(60 * 1024 * 1024);
  }, 15_000);

  it('quien abre la conexión y no manda la petición completa la pierde', async () => {
    const s = await iniciar({ plazoMs: 400 });
    const c = net.connect({ host: '127.0.0.1', port: s.puerto });
    c.write('GET /x HTTP/1.1\r\nHost: x\r\n');
    const cerro = await new Promise<boolean>((ok) => {
      c.once('close', () => ok(true));
      setTimeout(() => ok(false), 6000);
    });
    c.destroy();
    expect(cerro).toBe(true);
  }, 15_000);
});

describe('segunda revisión: nombres, perfiles de navegador, 8.3 y firmas (valores falsos)', () => {
  it.each([
    'Cookies-journal',
    'cookies.sqlite-shm',
    'logins-backup.json',
    'signons.sqlite',
    'recovery.jsonlz4',
    'recovery.baklz4',
    'sessionstore.jsonlz4',
    'sessionstore-backups',
    'WinSCP.ini',
    'credentials.xml',
    'id_rsa_github',
  ])('%s da 404', async (n) => {
    writeFileSync(path.join(raiz, n), 'contenido falso inocente');
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/${encodeURIComponent(n)}`)).codigo).toBe(404);
  });

  it.each(['monkey', 'hotkey', 'turkey.txt', 'id_proyecto', 'id_card.png', 'keyXdb'])(
    '%s ya no se bloquea de más',
    async (n) => {
      writeFileSync(path.join(raiz, n), 'contenido falso inocente');
      const s = await iniciar();
      expect((await pedir(s.puerto, `/${TOKEN}/${encodeURIComponent(n)}`)).codigo).toBe(200);
    },
  );

  it('perfiles de navegador copiados: carpeta Profiles de Firefox, User Data y un Default de Chrome', async () => {
    const w = (p: string, c = 'falso') => {
      mkdirSync(path.dirname(path.join(raiz, p)), { recursive: true });
      writeFileSync(path.join(raiz, p), c);
    };
    w('Firefox/Profiles/abcd.default/sessionstore-backups/recovery.jsonlz4');
    w('Firefox/Profiles/abcd.default/notas.txt');
    w('copia-firefox/prefs.js');
    w('copia-firefox/places.sqlite');
    w('copia-firefox/otro.txt');
    w('Chrome/User Data/Default/Network/Cookies-journal');
    w('Default/Login Data');
    w('Default/Preferences');
    mkdirSync(path.join(raiz, 'Default', 'Network'), { recursive: true });
    w('Default/Network/Cookies');
    w('Default/leeme.txt');
    const s = await iniciar();
    for (const r of [
      'Firefox/Profiles/abcd.default/sessionstore-backups/recovery.jsonlz4',
      'Firefox/Profiles/abcd.default/notas.txt',
      'Firefox/Profiles/',
      'copia-firefox/otro.txt',
      'copia-firefox/',
      'Chrome/User%20Data/Default/Network/Cookies-journal',
      'Default/leeme.txt',
      'Default/',
    ]) {
      expect((await pedir(s.puerto, `/${TOKEN}/${r}`)).codigo, r).toBe(404);
    }
    const l = (await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString();
    for (const oculto of ['Firefox/', 'copia-firefox/', 'Chrome/', 'Default/']) {
      if (oculto === 'Firefox/' || oculto === 'Chrome/') continue; // padres sin perfil a la vista: se listan
      expect(l, oculto).not.toContain(`>${oculto}<`);
    }
    expect((await pedir(s.puerto, `/${TOKEN}/a.txt`)).codigo).toBe(200);
  });

  it('un nombre corto 8.3 no esquiva el corte de 8 MB (si el volumen genera nombres cortos)', async () => {
    const largo = path.join(raiz, 'volcado-con-nombre-largo.txt');
    writeFileSync(largo, Buffer.alloc(8 * 1024 * 1024 + 1024, 65));
    let corto = '';
    try {
      corto = execFileSync('cmd.exe', ['/d', '/c', `for %I in ("${largo}") do @echo %~sI`], {
        encoding: 'utf8',
      }).trim();
    } catch {
      return; // no es Windows
    }
    if (!corto || corto.toLowerCase() === largo.toLowerCase()) return; // sin nombres 8.3 en este volumen
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/${path.basename(corto)}`)).codigo).toBe(404);
  });

  it('un texto con nombre de medio o paquete (sin firma) de más de 8 MB no se sirve; con firma, sí', async () => {
    const G = 8 * 1024 * 1024 + 1024;
    const falsoZip = Buffer.alloc(G, 65); // texto con nombre .zip
    writeFileSync(path.join(raiz, 'falso.zip'), falsoZip);
    writeFileSync(path.join(raiz, 'falso.png'), Buffer.alloc(G, 65));
    writeFileSync(path.join(raiz, 'falso.pdf'), Buffer.alloc(G, 65));
    writeFileSync(path.join(raiz, 'falso.mp3'), Buffer.alloc(G, 65));
    writeFileSync(path.join(raiz, 'disco.iso'), medio('iso', G));
    writeFileSync(path.join(raiz, 'cinta.tar'), medio('tar', G));
    writeFileSync(path.join(raiz, 'bueno.zip'), medio('zip', G));
    writeFileSync(path.join(raiz, 'bueno.pdf'), medio('pdf', G));
    const s = await iniciar();
    for (const n of [
      'falso.zip',
      'falso.png',
      'falso.pdf',
      'falso.mp3',
      'disco.iso',
      'cinta.tar',
    ]) {
      expect((await pedir(s.puerto, `/${TOKEN}/${n}`, { metodo: 'HEAD' })).codigo, n).toBe(404);
    }
    for (const n of ['bueno.zip', 'bueno.pdf']) {
      expect((await pedir(s.puerto, `/${TOKEN}/${n}`, { metodo: 'HEAD' })).codigo, n).toBe(200);
    }
    const l = (await pedir(s.puerto, `/${TOKEN}/`)).cuerpo.toString();
    expect(l).toMatch(/falso\.zip <em>\(too large to review\)/);
    expect(l).toMatch(/disco\.iso <em>\(too large to review\)/);
    expect(l).toContain('href="bueno.zip"');
  });
});

describe('firmaCoincide', () => {
  it.each([
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'wav',
    'bmp',
    'ico',
    'avif',
    'mp4',
    'mov',
    'webm',
    'mkv',
    'mp3',
    'ogg',
    'flac',
    'zip',
    'gz',
    '7z',
    'pdf',
  ])('%s: acepta su firma y rechaza un texto', (ext) => {
    expect(firmaCoincide(`x.${ext}`, medio(ext, 64))).toBe(true);
    expect(firmaCoincide(`x.${ext}`, Buffer.from('hola, esto es texto plano de relleno'))).toBe(
      false,
    );
  });
  it('tar, iso y desconocidos no tienen firma de lista blanca', () => {
    expect(firmaCoincide('x.tar', medio('tar', 70000))).toBe(false);
    expect(firmaCoincide('x.iso', medio('iso', 70000))).toBe(false);
    expect(firmaCoincide('x.exe', Buffer.from('MZ'))).toBe(false);
  });
});

/** Un archivo de `n` bytes que empieza con la firma de `ext` (el resto, relleno). */
function medio(ext: string, n: number): Buffer {
  const b = Buffer.alloc(n, 65);
  const poner = (desde: number, v: number[] | string) =>
    (typeof v === 'string' ? Buffer.from(v, 'latin1') : Buffer.from(v)).copy(b, desde);
  switch (ext) {
    case 'png':
      poner(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      break;
    case 'jpg':
    case 'jpeg':
      poner(0, [0xff, 0xd8, 0xff, 0xe0]);
      break;
    case 'gif':
      poner(0, 'GIF89a');
      break;
    case 'webp':
      poner(0, 'RIFF');
      poner(8, 'WEBP');
      break;
    case 'wav':
      poner(0, 'RIFF');
      poner(8, 'WAVE');
      break;
    case 'bmp':
      poner(0, 'BM');
      break;
    case 'ico':
      poner(0, [0, 0, 1, 0]);
      break;
    case 'avif':
    case 'mp4':
    case 'mov':
      poner(4, 'ftyp');
      break;
    case 'webm':
    case 'mkv':
      poner(0, [0x1a, 0x45, 0xdf, 0xa3]);
      break;
    case 'mp3':
      poner(0, 'ID3');
      break;
    case 'ogg':
      poner(0, 'OggS');
      break;
    case 'flac':
      poner(0, 'fLaC');
      break;
    case 'zip':
      poner(0, [0x50, 0x4b, 0x03, 0x04]);
      break;
    case 'gz':
      poner(0, [0x1f, 0x8b, 0x08]);
      break;
    case '7z':
      poner(0, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]);
      break;
    case 'pdf':
      poner(0, '%PDF-1.7');
      break;
    case 'tar':
      poner(257, 'ustar');
      break;
    case 'iso':
      poner(0x8001, 'CD001');
      break;
  }
  return b;
}

describe('tercera revisión: sesiones, identidades, AppData normalizado y perfiles', () => {
  it.each([
    'webappsstore.sqlite',
    'formhistory.sqlite',
    'identity',
    'identity.bak',
    'identity.old',
  ])('%s da 404', async (n) => {
    writeFileSync(path.join(raiz, n), 'falso');
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/${n}`)).codigo).toBe(404);
  });

  it('identity.pub (la clave pública) sí se sirve', async () => {
    writeFileSync(path.join(raiz, 'identity.pub'), 'ssh-ed25519 AAAAfalsa');
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/identity.pub`)).codigo).toBe(200);
  });

  it.each([
    'Local Storage',
    'Session Storage',
    'IndexedDB',
    'sessions',
    'ImapMail',
    'App Data',
    'appdata.old',
    'AppData.bak',
  ])('la carpeta %s no se abre ni se lista, a ningún nivel', async (n) => {
    mkdirSync(path.join(raiz, 'sub', n), { recursive: true });
    writeFileSync(path.join(raiz, 'sub', n, 'dentro.txt'), 'falso');
    const s = await iniciar();
    expect(
      (await pedir(s.puerto, `/${TOKEN}/sub/${encodeURIComponent(n)}/dentro.txt`)).codigo,
    ).toBe(404);
    expect((await pedir(s.puerto, `/${TOKEN}/sub/`)).cuerpo.toString()).not.toContain(`>${n}/`);
  });

  it.each(['Thunderbird', 'Waterfox', 'LibreWolf', 'Mozilla', 'Firefox'])(
    'Profiles bajo %s no se abre',
    async (padre) => {
      mkdirSync(path.join(raiz, padre, 'Profiles', 'abcd'), { recursive: true });
      writeFileSync(path.join(raiz, padre, 'Profiles', 'abcd', 'notas.txt'), 'falso');
      const s = await iniciar();
      expect((await pedir(s.puerto, `/${TOKEN}/${padre}/Profiles/abcd/notas.txt`)).codigo).toBe(
        404,
      );
    },
  );

  it('un prefs.js suelto en un proyecto no marca la carpeta; con times.json o compatibility.ini, sí', async () => {
    mkdirSync(path.join(raiz, 'proyecto'));
    writeFileSync(path.join(raiz, 'proyecto', 'prefs.js'), 'module.exports = {}');
    writeFileSync(path.join(raiz, 'proyecto', 'index.txt'), 'hola');
    for (const extra of ['times.json', 'compatibility.ini']) {
      const d = path.join(raiz, `perfil-${extra}`);
      mkdirSync(d);
      writeFileSync(path.join(d, 'prefs.js'), 'user_pref("a", 1);');
      writeFileSync(path.join(d, extra), 'falso');
      writeFileSync(path.join(d, 'otro.txt'), 'falso');
    }
    const s = await iniciar();
    expect((await pedir(s.puerto, `/${TOKEN}/proyecto/index.txt`)).codigo).toBe(200);
    expect((await pedir(s.puerto, `/${TOKEN}/proyecto/prefs.js`)).codigo).toBe(200);
    for (const extra of ['times.json', 'compatibility.ini']) {
      expect((await pedir(s.puerto, `/${TOKEN}/perfil-${extra}/otro.txt`)).codigo, extra).toBe(404);
    }
  });
});
