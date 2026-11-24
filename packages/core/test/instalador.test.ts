import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Instalador } from '../src/catalogo/instalador';
import type { VersionDisponible } from '../src/catalogo/catalogo';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Rutas } from '../src/rutas';
import type { ProgresoInstalacion } from '../src/tipos';
import { zip } from './zip-prueba';

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

function fetchDe(cuerpo: Buffer, conLongitud = true, partes = 4): typeof fetch {
  return (() => {
    const trozo = Math.ceil(cuerpo.length / partes);
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (let i = 0; i < cuerpo.length; i += trozo) c.enqueue(cuerpo.subarray(i, i + trozo));
        c.close();
      },
    });
    const headers: Record<string, string> = conLongitud
      ? { 'content-length': String(cuerpo.length) }
      : {};
    return Promise.resolve(new Response(stream, { headers }));
  }) as unknown as typeof fetch;
}

let base: string;
let rutas: Rutas;
let eventos: Eventos<EventosNucleo>;
let progreso: ProgresoInstalacion[];

beforeEach(async () => {
  base = await mkdtemp(path.join(os.tmpdir(), 'pel-inst-'));
  rutas = new Rutas(base);
  await rutas.asegurar();
  eventos = new Eventos<EventosNucleo>();
  progreso = [];
  eventos.on('instalacion:progreso', (p) => progreso.push(p));
});
afterEach(() => rm(base, { recursive: true, force: true }));

const zipGenerico = zip({
  'mailpit-x/mailpit.exe': 'EXE',
  'mailpit-x/LICENSE': 'conf',
});

const vGenerico = (zipBuf: Buffer, sha256 = sha(zipBuf)): VersionDisponible => ({
  servicio: 'mailpit',
  version: '1.28.0',
  url: 'https://github.com/axllent/mailpit/releases/download/v1.28.0/mailpit-windows-amd64.zip',
  sha256,
  formato: 'zip',
  subcarpeta: 'mailpit-x',
});

describe('Instalador', () => {
  it('instala mailpit en bin/mailpit/<v> y emite las fases en orden', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico));
    await inst.instalar(vGenerico(zipGenerico));
    expect(await readFile(path.join(rutas.bin('mailpit', '1.28.0'), 'mailpit.exe'), 'utf8')).toBe(
      'EXE',
    );
    expect(await inst.instalado('mailpit', '1.28.0')).toBe(true);
    expect(await inst.instalados('mailpit')).toEqual(['1.28.0']);
    const fases = [...new Set(progreso.map((p) => p.fase))];
    expect(fases).toEqual(['descargando', 'verificando', 'extrayendo', 'listo']);
    expect(progreso.at(-1)?.porcentaje).toBe(100);
    const pcts = progreso.filter((p) => p.fase === 'descargando').map((p) => p.porcentaje);
    expect(pcts).toEqual([...pcts].sort((a, b) => a - b));
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('rechaza servicio desconocido, URL no oficial y claves de carpeta peligrosas sin descargar', async () => {
    const f = vi.fn(fetchDe(zipGenerico));
    const inst = new Instalador(rutas, eventos, f as unknown as typeof fetch);
    const base = vGenerico(zipGenerico);
    await expect(
      inst.instalar({ ...base, servicio: 'xyz' as VersionDisponible['servicio'] }),
    ).rejects.toThrow('Servicio no instalable');
    await expect(inst.instalar({ ...base, url: 'https://malo.example/nginx.zip' })).rejects.toThrow(
      'sitio oficial',
    );
    await expect(inst.instalar({ ...base, url: 'http://nginx.org/nginx.zip' })).rejects.toThrow(
      'sitio oficial',
    );
    for (const version of ['..', '../../x', '1.2/../../x', '1.2\\..\\x', '1.2..3', 'x', '']) {
      await expect(inst.instalar({ ...base, version })).rejects.toThrow('Versión no válida');
    }
    await expect(
      inst.instalar({ ...base, servicio: 'php', version: '8.4.1', rama: '../8.4' }),
    ).rejects.toThrow('Versión no válida');
    expect(f).not.toHaveBeenCalled();
    expect(await readdir(path.join(rutas.base, 'bin')).catch(() => [])).toEqual([]);
  });

  it('con hash incorrecto no deja nada en bin/ y lanza', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico));
    await expect(inst.instalar(vGenerico(zipGenerico, 'f'.repeat(64)))).rejects.toThrow(
      'La descarga no coincide con la huella publicada',
    );
    expect(existsSync(rutas.bin('mailpit', '1.28.0'))).toBe(false);
    expect(await inst.instalados('mailpit')).toEqual([]);
    expect(progreso.at(-1)).toMatchObject({
      fase: 'error',
      mensaje: 'La descarga no coincide con la huella publicada',
    });
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('sin content-length no falla y llega a 100', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico, false));
    await inst.instalar(vGenerico(zipGenerico));
    expect(progreso.filter((p) => p.fase === 'descargando').every((p) => p.porcentaje === 0)).toBe(
      true,
    );
    expect(progreso.at(-1)?.porcentaje).toBe(100);
  });

  it('es idempotente: si ya está instalado no descarga', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico));
    await inst.instalar(vGenerico(zipGenerico));
    const f = (() => {
      throw new Error('no debía descargar');
    }) as unknown as typeof fetch;
    await new Instalador(rutas, eventos, f).instalar(vGenerico(zipGenerico));
  });

  it('instalado exige el ejecutable, no solo la carpeta', async () => {
    await mkdir(rutas.bin('mailpit', 'y'), { recursive: true });
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico));
    expect(await inst.instalado('mailpit', 'y')).toBe(false);
    expect(await inst.instalados('mailpit')).toEqual([]);
  });

  it('cloudflared (exe) se copia a bin/cloudflared/<v>/cloudflared.exe', async () => {
    const exe = Buffer.from('MZ-cloudflared');
    const inst = new Instalador(rutas, eventos, fetchDe(exe));
    await inst.instalar({
      servicio: 'cloudflared',
      version: '1.0',
      url: 'https://github.com/cloudflare/cloudflared/releases/download/1.0/cf.exe',
      sha256: sha(exe),
      formato: 'exe',
    });
    expect(
      await readFile(path.join(rutas.bin('cloudflared', '1.0'), 'cloudflared.exe'), 'utf8'),
    ).toBe('MZ-cloudflared');
    expect(await inst.instalado('cloudflared', '1.0')).toBe(true);
  });

  it("formato 'archivo' copia composer.phar a bin/composer/<v>/composer.phar", async () => {
    const phar = Buffer.from('#!/usr/bin/env php composer');
    const inst = new Instalador(rutas, eventos, fetchDe(phar));
    await inst.instalar({
      servicio: 'composer',
      version: '2.0.14',
      url: 'https://getcomposer.org/download/2.0.14/composer.phar',
      sha256: sha(phar),
      formato: 'archivo',
      ejecutable: 'composer.phar',
    });
    expect(
      await readFile(path.join(rutas.bin('composer', '2.0.14'), 'composer.phar'), 'utf8'),
    ).toBe('#!/usr/bin/env php composer');
    expect(await inst.instalado('composer', '2.0.14')).toBe(true);
    expect(await inst.instalados('composer')).toEqual(['2.0.14']);
  });

  it('instalado(postgresql) comprueba pgsql/bin/postgres.exe', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico));
    const dir = rutas.bin('postgresql', '17.12');
    await mkdir(path.join(dir, 'pgsql', 'bin'), { recursive: true });
    expect(await inst.instalado('postgresql', '17.12')).toBe(false);
    await writeFile(path.join(dir, 'pgsql', 'bin', 'postgres.exe'), 'x');
    expect(await inst.instalado('postgresql', '17.12')).toBe(true);
  });

  it('instala un zip con ejecutable anidado y sin subcarpeta (mysql)', async () => {
    const z = zip({
      'mysql-8.4.13-winx64/bin/mysqld.exe': 'MYSQLD',
      'mysql-8.4.13-winx64/README': 'r',
    });
    const inst = new Instalador(rutas, eventos, fetchDe(z));
    await inst.instalar({
      servicio: 'mysql',
      version: '8.4.13',
      url: 'https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.13-winx64.zip',
      sha256: sha(z),
      formato: 'zip',
      subcarpeta: 'mysql-8.4.13-winx64',
      ejecutable: 'bin/mysqld.exe',
    });
    expect(await inst.instalado('mysql', '8.4.13')).toBe(true);
  });

  it('rechaza un ejecutable que escapa de la carpeta', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico));
    for (const ejecutable of ['../x.exe', '/abs.exe', 'C:/x.exe', 'a\\..\\b.exe']) {
      await expect(inst.instalar({ ...vGenerico(zipGenerico), ejecutable })).rejects.toThrow(
        'Ejecutable no válido',
      );
    }
  });

  it('php se instala en la rama y un parche nuevo reemplaza al anterior', async () => {
    const z1 = zip({ 'php-cgi.exe': 'v1', 'php.ini-development': 'ini' });
    const z2 = zip({ 'php-cgi.exe': 'v2', 'php.ini-development': 'ini' });
    const v = (z: Buffer, version: string): VersionDisponible => ({
      servicio: 'php',
      version,
      rama: '8.4',
      url: 'https://windows.php.net/downloads/releases/php.zip',
      sha256: sha(z),
      formato: 'zip',
    });
    await new Instalador(rutas, eventos, fetchDe(z1)).instalar(v(z1, '8.4.26'));
    expect(await readFile(path.join(rutas.bin('php', '8.4'), 'php-cgi.exe'), 'utf8')).toBe('v1');
    const inst = new Instalador(rutas, eventos, fetchDe(z2));
    await inst.instalar(v(z2, '8.4.27-1'));
    expect(await readFile(path.join(rutas.bin('php', '8.4'), 'php-cgi.exe'), 'utf8')).toBe('v2');
    expect(await inst.instalados('php')).toEqual(['8.4']);
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('desinstalar borra la carpeta y tolera inexistentes', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico));
    await inst.instalar(vGenerico(zipGenerico));
    await inst.desinstalar('mailpit', '1.28.0');
    expect(await inst.instalado('mailpit', '1.28.0')).toBe(false);
    await inst.desinstalar('mailpit', 'no-existe');
  });

  it('si el cambio de PHP falla restaura lo anterior y reporta error', async () => {
    const z1 = zip({ 'php-cgi.exe': 'v1' });
    const z2 = zip({ 'php-cgi.exe': 'v2' });
    const v = (z: Buffer, version: string): VersionDisponible => ({
      servicio: 'php',
      version,
      rama: '8.4',
      url: 'https://windows.php.net/downloads/releases/php.zip',
      sha256: sha(z),
      formato: 'zip',
    });
    await new Instalador(rutas, eventos, fetchDe(z1)).instalar(v(z1, '8.4.26'));
    progreso.length = 0;
    const { rename } = await import('node:fs/promises');
    let n = 0;
    const inst = new Instalador(rutas, eventos, fetchDe(z2), {
      renombrar: async (de, a) => {
        n++;
        if (n === 2) throw new Error('bloqueado');
        await rename(de, a);
      },
    });
    await expect(inst.instalar(v(z2, '8.4.27-1'))).rejects.toThrow(
      /se restauró la versión anterior/,
    );
    expect(await readFile(path.join(rutas.bin('php', '8.4'), 'php-cgi.exe'), 'utf8')).toBe('v1');
    expect(progreso.some((p) => p.fase === 'listo')).toBe(false);
    expect(progreso.at(-1)?.fase).toBe('error');
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('si un antivirus bloquea un momento la carpeta extraída (EPERM), reintenta y la instala', async () => {
    const { rename } = await import('node:fs/promises');
    let fallos = 0;
    const inst = new Instalador(rutas, eventos, fetchDe(zipGenerico), {
      renombrar: async (de, a) => {
        if (fallos < 3) {
          fallos++;
          throw Object.assign(new Error('EPERM: operation not permitted, rename'), {
            code: 'EPERM',
          });
        }
        await rename(de, a);
      },
    });
    await inst.instalar(vGenerico(zipGenerico));
    expect(fallos).toBe(3);
    expect(await inst.instalado('mailpit', '1.28.0')).toBe(true);
    expect(progreso.at(-1)?.fase).toBe('listo');
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('corta la descarga si no llegan datos', async () => {
    const colgado = (() =>
      Promise.resolve(
        new Response(new ReadableStream<Uint8Array>({ start() {} }), {
          headers: { 'content-length': '10' },
        }),
      )) as unknown as typeof fetch;
    const inst = new Instalador(rutas, eventos, colgado, {
      tiempoSinDatosMs: 50,
      esperasReintentoMs: [],
    });
    await expect(inst.instalar(vGenerico(zipGenerico))).rejects.toThrow(
      'La descarga se detuvo: sin datos durante 0 s',
    );
    expect(progreso.at(-1)).toMatchObject({ fase: 'error' });
    expect(await readdir(rutas.tmp())).toEqual([]);
  });
});

describe('Instalador: reintentos de descarga (QA 7)', () => {
  const grande = zip({
    'mailpit-x/mailpit.exe': 'EXE'.repeat(5000),
    'mailpit-x/LICENSE': 'conf',
  });
  const mitad = Math.floor(grande.length / 2);
  /** Respuesta que entrega `datos` y después se corta (como "terminated" de undici). */
  const cortada = (datos: Buffer, total: number): Response =>
    new Response(
      new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(datos);
          setTimeout(() => c.error(new TypeError('terminated')), 5);
        },
      }),
      { headers: { 'content-length': String(total) } },
    );
  const opciones = { esperasReintentoMs: [1, 1, 1] };

  it('se corta a la mitad y reanuda con Range (206)', async () => {
    const pedidos: (string | null)[] = [];
    const f = (async (_u: string, init?: RequestInit) => {
      const rango = new Headers(init?.headers).get('range');
      pedidos.push(rango);
      if (pedidos.length === 1) return cortada(grande.subarray(0, mitad), grande.length);
      const desde = Number(/bytes=(\d+)-/.exec(rango ?? '')?.[1]);
      return new Response(grande.subarray(desde), {
        status: 206,
        headers: {
          'content-length': String(grande.length - desde),
          'content-range': `bytes ${desde}-${grande.length - 1}/${grande.length}`,
        },
      });
    }) as unknown as typeof fetch;
    const inst = new Instalador(rutas, eventos, f, opciones);
    await inst.instalar(vGenerico(grande));
    expect(pedidos).toEqual([null, `bytes=${mitad}-`]);
    expect(await inst.instalado('mailpit', '1.28.0')).toBe(true);
    expect(progreso.at(-1)?.fase).toBe('listo');
  });

  it('si el servidor ignora Range (200), empieza de nuevo y la huella sigue verificándose', async () => {
    let n = 0;
    const f = (async () => {
      n++;
      if (n === 1) return cortada(grande.subarray(0, mitad), grande.length);
      return new Response(grande, { headers: { 'content-length': String(grande.length) } });
    }) as unknown as typeof fetch;
    const inst = new Instalador(rutas, eventos, f, opciones);
    await inst.instalar(vGenerico(grande));
    expect(n).toBe(2);
    expect(await inst.instalado('mailpit', '1.28.0')).toBe(true);
  });

  it('HTTP 503 y error de red se reintentan; 404 no', async () => {
    let n = 0;
    const f = (async () => {
      n++;
      if (n === 1) return new Response('ocupado', { status: 503 });
      if (n === 2) throw new TypeError('fetch failed');
      return new Response(grande, { headers: { 'content-length': String(grande.length) } });
    }) as unknown as typeof fetch;
    await new Instalador(rutas, eventos, f, opciones).instalar(vGenerico(grande));
    expect(n).toBe(3);

    let m = 0;
    const no = (async () => {
      m++;
      return new Response('no', { status: 404 });
    }) as unknown as typeof fetch;
    await expect(
      new Instalador(rutas, eventos, no, opciones).instalar({
        ...vGenerico(grande),
        version: '1.28.1',
      }),
    ).rejects.toThrow(/HTTP 404/);
    expect(m).toBe(1);
  });

  it('tras agotar los reintentos falla con el último error y no deja temporales', async () => {
    let n = 0;
    const f = (async () => {
      n++;
      return cortada(grande.subarray(0, 10), grande.length);
    }) as unknown as typeof fetch;
    await expect(
      new Instalador(rutas, eventos, f, opciones).instalar(vGenerico(grande)),
    ).rejects.toThrow(/terminated/);
    expect(n).toBe(4);
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('una reanudación con datos alterados no pasa la verificación de huella', async () => {
    let n = 0;
    const f = (async (_u: string, init?: RequestInit) => {
      n++;
      if (n === 1) return cortada(grande.subarray(0, mitad), grande.length);
      const desde = Number(/bytes=(\d+)-/.exec(new Headers(init?.headers).get('range') ?? '')?.[1]);
      const resto = Buffer.from(grande.subarray(desde));
      resto[0] = resto[0]! ^ 0xff;
      return new Response(resto, {
        status: 206,
        headers: { 'content-range': `bytes ${desde}-${grande.length - 1}/${grande.length}` },
      });
    }) as unknown as typeof fetch;
    await expect(
      new Instalador(rutas, eventos, f, opciones).instalar(vGenerico(grande)),
    ).rejects.toThrow('La descarga no coincide con la huella publicada');
  });
});
