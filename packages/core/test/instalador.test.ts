import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { crc32 } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Instalador } from '../src/catalogo/instalador';
import type { VersionDisponible } from '../src/catalogo/catalogo';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Rutas } from '../src/rutas';
import type { ProgresoInstalacion } from '../src/tipos';

/** Zip mínimo sin compresión (método 0). */
function zip(archivos: Record<string, string>): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const n = Buffer.from(nombre);
    const d = Buffer.from(contenido);
    const crc = crc32(d);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0);
    l.writeUInt16LE(20, 4);
    l.writeUInt32LE(crc, 14);
    l.writeUInt32LE(d.length, 18);
    l.writeUInt32LE(d.length, 22);
    l.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(d.length, 20);
    c.writeUInt32LE(d.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    locales.push(l, n, d);
    centrales.push(c, n);
    offset += 30 + n.length + d.length;
  }
  const cd = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  const total = Object.keys(archivos).length;
  fin.writeUInt16LE(total, 8);
  fin.writeUInt16LE(total, 10);
  fin.writeUInt32LE(cd.length, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, cd, fin]);
}

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

const nginxZip = zip({
  'nginx-x/nginx.exe': 'EXE',
  'nginx-x/conf/nginx.conf': 'conf',
});

const vNginx = (zipBuf: Buffer, sha256 = sha(zipBuf)): VersionDisponible => ({
  servicio: 'nginx',
  version: '1.28.0',
  url: 'https://nginx.org/download/nginx-1.28.0.zip',
  sha256,
  formato: 'zip',
  subcarpeta: 'nginx-x',
});

describe('Instalador', () => {
  it('instala nginx en bin/nginx/x y emite las fases en orden', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(nginxZip));
    await inst.instalar(vNginx(nginxZip));
    expect(await readFile(path.join(rutas.bin('nginx', '1.28.0'), 'nginx.exe'), 'utf8')).toBe(
      'EXE',
    );
    expect(await inst.instalado('nginx', '1.28.0')).toBe(true);
    expect(await inst.instalados('nginx')).toEqual(['1.28.0']);
    const fases = [...new Set(progreso.map((p) => p.fase))];
    expect(fases).toEqual(['descargando', 'verificando', 'extrayendo', 'listo']);
    expect(progreso.at(-1)?.porcentaje).toBe(100);
    const pcts = progreso.filter((p) => p.fase === 'descargando').map((p) => p.porcentaje);
    expect(pcts).toEqual([...pcts].sort((a, b) => a - b));
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('rechaza servicio desconocido, URL no oficial y claves de carpeta peligrosas sin descargar', async () => {
    const f = vi.fn(fetchDe(nginxZip));
    const inst = new Instalador(rutas, eventos, f as unknown as typeof fetch);
    const base = vNginx(nginxZip);
    await expect(
      inst.instalar({ ...base, servicio: 'mysql' as VersionDisponible['servicio'] }),
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
    const inst = new Instalador(rutas, eventos, fetchDe(nginxZip));
    await expect(inst.instalar(vNginx(nginxZip, 'f'.repeat(64)))).rejects.toThrow(
      'La descarga no coincide con la huella publicada',
    );
    expect(existsSync(rutas.bin('nginx', '1.28.0'))).toBe(false);
    expect(await inst.instalados('nginx')).toEqual([]);
    expect(progreso.at(-1)).toMatchObject({
      fase: 'error',
      mensaje: 'La descarga no coincide con la huella publicada',
    });
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('sin content-length no falla y llega a 100', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(nginxZip, false));
    await inst.instalar(vNginx(nginxZip));
    expect(progreso.filter((p) => p.fase === 'descargando').every((p) => p.porcentaje === 0)).toBe(
      true,
    );
    expect(progreso.at(-1)?.porcentaje).toBe(100);
  });

  it('es idempotente: si ya está instalado no descarga', async () => {
    const inst = new Instalador(rutas, eventos, fetchDe(nginxZip));
    await inst.instalar(vNginx(nginxZip));
    const f = (() => {
      throw new Error('no debía descargar');
    }) as unknown as typeof fetch;
    await new Instalador(rutas, eventos, f).instalar(vNginx(nginxZip));
  });

  it('instalado exige el ejecutable, no solo la carpeta', async () => {
    await mkdir(rutas.bin('nginx', 'y'), { recursive: true });
    const inst = new Instalador(rutas, eventos, fetchDe(nginxZip));
    expect(await inst.instalado('nginx', 'y')).toBe(false);
    expect(await inst.instalados('nginx')).toEqual([]);
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
    const inst = new Instalador(rutas, eventos, fetchDe(nginxZip));
    await inst.instalar(vNginx(nginxZip));
    await inst.desinstalar('nginx', '1.28.0');
    expect(await inst.instalado('nginx', '1.28.0')).toBe(false);
    await inst.desinstalar('nginx', 'no-existe');
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

  it('corta la descarga si no llegan datos', async () => {
    const colgado = (() =>
      Promise.resolve(
        new Response(new ReadableStream<Uint8Array>({ start() {} }), {
          headers: { 'content-length': '10' },
        }),
      )) as unknown as typeof fetch;
    const inst = new Instalador(rutas, eventos, colgado, { tiempoSinDatosMs: 50 });
    await expect(inst.instalar(vNginx(nginxZip))).rejects.toThrow(
      'La descarga se detuvo: sin datos durante 0 s',
    );
    expect(progreso.at(-1)).toMatchObject({ fase: 'error' });
    expect(await readdir(rutas.tmp())).toEqual([]);
  });
});
