import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generarVhostProxy, puertoLibreLocal, VhostsAuxiliares } from '../src/nginx/auxiliares';
import { Rutas } from '../src/rutas';

let base: string;
let rutas: Rutas;
let recargas: number;
let falla: boolean;
let v: VhostsAuxiliares;

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-aux-'));
  rutas = new Rutas(base);
  recargas = 0;
  falla = false;
  v = new VhostsAuxiliares({
    rutas,
    recargar: async () => {
      recargas++;
      if (falla) throw new Error('nginx -t falló');
    },
  });
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('generarVhostProxy', () => {
  it('atiende cualquier Host en su puerto y reenvía a Nginx con el Host del sitio', () => {
    const c = generarVhostProxy({
      escucha: '127.0.0.1',
      puerto: 41000,
      destino: 8080,
      host: 'wolf.test',
    });
    expect(c).toContain('listen 127.0.0.1:41000;');
    expect(c).toContain('server_name _;');
    expect(c).toContain('proxy_pass http://127.0.0.1:8080;');
    expect(c).toContain('proxy_set_header Host "wolf.test";');
    expect(c).not.toContain('default_server');
  });

  it('con ssl escucha con TLS, usa el certificado dado y reenvía como https', () => {
    const c = generarVhostProxy({
      escucha: '192.168.1.50',
      puerto: 8100,
      destino: 80,
      host: 'wolf.test',
      ssl: { crt: 'C:\\datos\\certs\\lan-wolf.crt', key: 'C:\\datos\\certs\\lan-wolf.key' },
    });
    expect(c).toContain('listen 192.168.1.50:8100 ssl;');
    expect(c).toContain('ssl_certificate "C:/datos/certs/lan-wolf.crt";');
    expect(c).toContain('ssl_certificate_key "C:/datos/certs/lan-wolf.key";');
    expect(c).toContain('proxy_set_header X-Forwarded-Proto https;');
    expect(() =>
      generarVhostProxy({
        escucha: '192.168.1.50',
        puerto: 8100,
        destino: 80,
        host: 'wolf.test',
        ssl: { crt: 'a";}\nserver{', key: 'k' },
      }),
    ).toThrow();
  });

  it('rechaza lo que rompería la directiva', () => {
    const ok = { escucha: '127.0.0.1', puerto: 41000, destino: 8080, host: 'wolf.test' };
    for (const mal of [
      { host: 'a";}\nserver{' },
      { host: 'con espacio.test' },
      { host: '' },
      { escucha: 'localhost' },
      { puerto: 0 },
      { puerto: 70000 },
      { destino: 1.5 },
    ]) {
      expect(() => generarVhostProxy({ ...ok, ...mal })).toThrow();
    }
  });
});

describe('VhostsAuxiliares', () => {
  it('agregar escribe en etc/nginx/extras y recarga; quitar lo borra y recarga solo si existía', async () => {
    await v.agregar('tunel-wolf', 'server {}');
    expect(readFileSync(rutas.vhostAux('tunel-wolf'), 'utf8')).toBe('server {}');
    expect(rutas.vhostAux('tunel-wolf')).toContain(path.join('etc', 'nginx', 'extras'));
    expect(recargas).toBe(1);
    await v.quitar('tunel-wolf');
    expect(existsSync(rutas.vhostAux('tunel-wolf'))).toBe(false);
    expect(recargas).toBe(2);
    await v.quitar('tunel-wolf');
    expect(recargas).toBe(2);
  });

  it('si Nginx rechaza el vhost no queda nada y el error sube', async () => {
    falla = true;
    await expect(v.agregar('tunel-wolf', 'server {')).rejects.toThrow(/nginx -t/);
    expect(existsSync(rutas.vhostAux('tunel-wolf'))).toBe(false);
  });

  it('si Nginx rechaza un vhost que reemplaza a otro, vuelve el contenido anterior', async () => {
    await v.agregar('lan-wolf', 'server { listen 1; }');
    falla = true;
    await expect(v.agregar('lan-wolf', 'server {')).rejects.toThrow(/nginx -t/);
    expect(readFileSync(rutas.vhostAux('lan-wolf'), 'utf8')).toBe('server { listen 1; }');
  });

  it('quitar uno de la red local (lan-) recarga siempre; uno de túnel, solo si existía', async () => {
    await v.quitar('lan-nada');
    expect(recargas).toBe(1);
    await v.quitar('tunel-nada');
    expect(recargas).toBe(1);
  });

  it('quitarSinRecargar borra el archivo sin recargar ni esperar la cola', async () => {
    await v.agregar('lan-a', 'x');
    const antes = recargas;
    await v.quitarSinRecargar('lan-a');
    expect(existsSync(rutas.vhostAux('lan-a'))).toBe(false);
    expect(recargas).toBe(antes);
    await expect(v.quitarSinRecargar('../x')).rejects.toThrow();
  });

  it('quitar borra aunque no se pueda recargar', async () => {
    await v.agregar('tunel-wolf', 'server {}');
    falla = true;
    await v.quitar('tunel-wolf');
    expect(existsSync(rutas.vhostAux('tunel-wolf'))).toBe(false);
  });

  it('un id con ruta nunca sale de la carpeta', async () => {
    for (const id of ['../x', 'a/b', 'a\b', '', '.conf', 'a b']) {
      await expect(v.agregar(id, 'x')).rejects.toThrow();
      await expect(v.quitar(id)).rejects.toThrow();
    }
    expect(recargas).toBe(0);
  });

  it('barrer quita solo los del prefijo que no se conservan', async () => {
    await v.agregar('tunel-a', 'x');
    await v.agregar('tunel-b', 'x');
    await v.agregar('lan-c', 'x');
    mkdirSync(path.dirname(rutas.vhostAux('x')), { recursive: true });
    writeFileSync(path.join(path.dirname(rutas.vhostAux('x')), 'notas.txt'), 'no es un vhost');
    await v.barrer('tunel-', new Set(['tunel-a']));
    expect(await v.ids()).toEqual(['lan-c', 'tunel-a']);
    expect(await v.ids('tunel-')).toEqual(['tunel-a']);
  });

  it('puertoLibreLocal da un puerto de usuario', async () => {
    const p = await puertoLibreLocal();
    expect(p).toBeGreaterThan(1023);
    expect(p).toBeLessThanOrEqual(65535);
  });
});
