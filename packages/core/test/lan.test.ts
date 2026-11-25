import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VhostsAuxiliares } from '../src/nginx/auxiliares';
import { GestorLan, ipsLocales, puertoLan } from '../src/red/lan';
import { ServidorCa } from '../src/red/servidorCa';
import { Rutas } from '../src/rutas';
import { SitioSchema, type Sitio } from '../src/tipos';

type Ifaces = NodeJS.Dict<os.NetworkInterfaceInfo[]>;
const info = (address: string, extra: Partial<os.NetworkInterfaceInfo> = {}) =>
  ({
    address,
    netmask: '255.255.255.0',
    family: 'IPv4',
    mac: '00:11:22:33:44:55',
    internal: false,
    cidr: `${address}/24`,
    ...extra,
  }) as os.NetworkInterfaceInfo;

describe('ipsLocales', () => {
  it('ignora loopback, 169.254, direcciones públicas, IPv6 y adaptadores virtuales', () => {
    const f: Ifaces = {
      Loopback: [info('127.0.0.1', { internal: true })],
      Ethernet: [
        info('169.254.10.2'),
        info('8.8.8.8'),
        { ...info('fe80::1'), family: 'IPv6' } as os.NetworkInterfaceInfo,
      ],
      'vEthernet (WSL)': [info('172.20.0.1')],
      Tailscale: [info('100.101.102.103')],
      'Wi-Fi': [info('192.168.1.50')],
      Docker: [info('10.0.75.1')],
    };
    expect(ipsLocales(f)).toEqual(['192.168.1.50']);
  });

  it('acepta los tres rangos privados y devuelve vacío sin red', () => {
    expect(ipsLocales({ eth0: [info('10.1.2.3')], eth1: [info('172.16.5.5')] })).toEqual([
      '10.1.2.3',
      '172.16.5.5',
    ]);
    expect(ipsLocales({ eth0: [info('172.32.0.1')] })).toEqual([]);
    expect(ipsLocales({})).toEqual([]);
  });
});

describe('puertoLan', () => {
  it('empieza en 8100 y salta los ocupados, los reservados y los que no se pueden abrir', async () => {
    const probar = vi.fn(async (p: number) => p !== 8102);
    const p = await puertoLan({ ocupados: [8100, 8101], probar });
    expect(p).toBe(8103);
  });

  it('usa el preferido si sigue libre y no está reservado', async () => {
    expect(await puertoLan({ ocupados: [], preferido: 8150, probar: async () => true })).toBe(8150);
    expect(await puertoLan({ ocupados: [8150], preferido: 8150, probar: async () => true })).toBe(
      8100,
    );
  });

  it('falla con código si no queda ninguno', async () => {
    await expect(puertoLan({ ocupados: [], probar: async () => false })).rejects.toMatchObject({
      codigo: 'lan.sin_puertos',
    });
  });
});

let base: string;
let rutas: Rutas;
let sitios: Sitio[];
let recargas: number;
let ifaces: Ifaces;
let probados: Array<[string, number]>;
let reservados: number[];
let lan: GestorLan;

const sitio = (id: string, extra: Partial<Sitio> = {}): Sitio =>
  SitioSchema.parse({
    id,
    nombre: id,
    dominio: `${id}.test`,
    carpeta: base,
    tipo: 'estatico',
    ...extra,
  });

const OK = { confirmado: true as const, ip: '192.168.1.50', https: false };

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-lan-'));
  rutas = new Rutas(base);
  sitios = [
    sitio('demo'),
    sitio('clientes', { datosReales: true }),
    sitio('seguro', { redirigirHttps: true }),
  ];
  recargas = 0;
  probados = [];
  reservados = [];
  ifaces = { 'Wi-Fi': [info('192.168.1.50')] };
  lan = new GestorLan({
    sitios: {
      listar: async () => sitios,
      editar: async (id, cambios) => {
        const i = sitios.findIndex((s) => s.id === id);
        if (i < 0) throw new Error('no existe');
        sitios[i] = SitioSchema.parse({ ...sitios[i], ...cambios, id });
        return sitios[i]!;
      },
    },
    vhosts: new VhostsAuxiliares({
      rutas,
      recargar: async () => {
        recargas++;
      },
    }),
    certificado: async (s) => {
      const crt = rutas.certCrt(s.id);
      const key = rutas.certKey(s.id);
      mkdirSync(path.dirname(crt), { recursive: true });
      writeFileSync(crt, `CRT ${s.dominio}`);
      writeFileSync(key, 'KEY');
      return { crt, key };
    },
    puertoNginx: async () => 80,
    interfaces: () => ifaces,
    reservados: async () => reservados,
    probar: async (ip, p) => {
      probados.push([ip, p]);
      return true;
    },
  });
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

const vhost = (id: string): string => readFileSync(rutas.vhostAux(`lan-${id}`), 'utf8');

describe('GestorLan.activar', () => {
  it('escribe un vhost lan-<sitio> en la IP elegida, con su puerto y el Host del sitio', async () => {
    const r = await lan.activar('demo', OK);
    expect(r).toMatchObject({ url: 'http://192.168.1.50:8100', ip: '192.168.1.50', puerto: 8100 });
    const c = vhost('demo');
    expect(c).toContain('listen 192.168.1.50:8100;');
    expect(c).not.toContain('0.0.0.0');
    expect(c).toContain('proxy_set_header Host "demo.test";');
    expect(sitios[0]!.lan).toEqual({ activo: true, puerto: 8100, https: false });
    expect(probados).toContainEqual(['192.168.1.50', 8100]);
    expect(recargas).toBe(1);
  });

  it('cada sitio recibe su propio puerto', async () => {
    const a = await lan.activar('demo', OK);
    const b = await lan.activar('clientes', { ...OK, confirmadoDatosReales: true });
    expect(b.puerto).not.toBe(a.puerto);
    expect(vhost('clientes')).toContain(`listen 192.168.1.50:${b.puerto};`);
  });

  it('sin confirmación no toca nada', async () => {
    await expect(lan.activar('demo', { ...OK, confirmado: false as never })).rejects.toMatchObject({
      codigo: 'lan.confirmacion_requerida',
    });
    expect(existsSync(rutas.vhostAux('lan-demo'))).toBe(false);
    expect(recargas).toBe(0);
    expect(sitios[0]!.lan).toBeUndefined();
  });

  it('con datos reales exige la confirmación reforzada', async () => {
    await expect(lan.activar('clientes', OK)).rejects.toMatchObject({
      codigo: 'lan.confirmacion_datos_reales',
    });
    expect(existsSync(rutas.vhostAux('lan-clientes'))).toBe(false);
    await expect(
      lan.activar('clientes', { ...OK, confirmadoDatosReales: true }),
    ).resolves.toBeDefined();
  });

  it('la IP confirmada debe seguir siendo una de la red local', async () => {
    await expect(lan.activar('demo', { ...OK, ip: '192.168.1.99' })).rejects.toMatchObject({
      codigo: 'lan.ip_no_valida',
    });
    await expect(lan.activar('demo', { ...OK, ip: '0.0.0.0' })).rejects.toMatchObject({
      codigo: 'lan.ip_no_valida',
    });
    ifaces = {};
    await expect(lan.activar('demo', OK)).rejects.toMatchObject({ codigo: 'lan.sin_red' });
    expect(existsSync(rutas.vhostAux('lan-demo'))).toBe(false);
  });

  it('salta los puertos reservados y los de otros sitios compartidos', async () => {
    reservados = [8100];
    const a = await lan.activar('demo', OK);
    expect(a.puerto).toBe(8101);
    const b = await lan.activar('clientes', { ...OK, confirmadoDatosReales: true });
    expect(b.puerto).toBe(8102);
  });

  it('un sitio que redirige a HTTPS solo se comparte con HTTPS', async () => {
    await expect(lan.activar('seguro', OK)).rejects.toMatchObject({
      codigo: 'lan.requiere_https',
    });
    const r = await lan.activar('seguro', { ...OK, https: true });
    expect(r.url).toBe('https://192.168.1.50:8100');
  });

  it('con HTTPS el vhost escucha con ssl y el certificado lleva la IP', async () => {
    await lan.activar('demo', { ...OK, https: true });
    const c = vhost('demo');
    expect(c).toContain('listen 192.168.1.50:8100 ssl;');
    expect(c).toContain(`ssl_certificate "${rutas.certCrt('lan-demo').replace(/\\/g, '/')}";`);
    expect(readFileSync(rutas.certCrt('lan-demo'), 'utf8')).toBe('CRT 192.168.1.50');
    expect(sitios[0]!.lan?.https).toBe(true);
  });

  it('un sitio que no existe da error con código', async () => {
    await expect(lan.activar('nada', OK)).rejects.toMatchObject({
      codigo: 'lan.sitio_no_encontrado',
    });
  });
});

describe('GestorLan.desactivar y apagado', () => {
  it('desactivar quita el vhost, marca el sitio y es idempotente', async () => {
    await lan.activar('demo', OK);
    await lan.desactivar('demo');
    expect(existsSync(rutas.vhostAux('lan-demo'))).toBe(false);
    expect(sitios[0]!.lan?.activo).toBe(false);
    await expect(lan.desactivar('demo')).resolves.toBeUndefined();
  });

  it('al cerrar el núcleo ningún sitio queda compartido y se recarga Nginx', async () => {
    await lan.activar('demo', OK);
    await lan.activar('clientes', { ...OK, confirmadoDatosReales: true });
    const antes = recargas;
    await lan.apagarTodo();
    expect(await new VhostsAuxiliares({ rutas, recargar: async () => {} }).ids('lan-')).toEqual([]);
    expect(sitios.every((s) => !s.lan?.activo)).toBe(true);
    expect(recargas).toBeGreaterThan(antes);
  });

  it('restaurar barre los vhost de una caída aunque la configuración no los recuerde', async () => {
    mkdirSync(path.dirname(rutas.vhostAux('lan-x')), { recursive: true });
    writeFileSync(rutas.vhostAux('lan-x'), 'server {}');
    writeFileSync(rutas.vhostAux('tunel-demo'), 'server {}');
    sitios[0] = sitio('demo', { lan: { activo: true, puerto: 8100, https: false } });
    await lan.restaurar();
    expect(existsSync(rutas.vhostAux('lan-x'))).toBe(false);
    // Los de los túneles no se tocan.
    expect(existsSync(rutas.vhostAux('tunel-demo'))).toBe(true);
    expect(sitios[0]!.lan?.activo).toBe(false);
  });

  it('el estado lista los sitios compartidos y las IP disponibles', async () => {
    await lan.activar('demo', OK);
    const e = await lan.estado();
    expect(e.ips).toEqual(['192.168.1.50']);
    expect(e.sitios).toEqual([
      {
        sitioId: 'demo',
        url: 'http://192.168.1.50:8100',
        ip: '192.168.1.50',
        puerto: 8100,
        https: false,
      },
    ]);
  });
});

describe('ServidorCa', () => {
  let ca: string;
  let srv: ServidorCa;
  const PEM = '-----BEGIN CERTIFICATE-----\nMIIBfake\n-----END CERTIFICATE-----\n';

  beforeEach(() => {
    mkdirSync(path.dirname(rutas.caCrt()), { recursive: true });
    ca = rutas.caCrt();
    writeFileSync(ca, PEM);
    writeFileSync(
      rutas.caKey(),
      '-----BEGIN PRIVATE KEY-----\nSECRETA\n-----END PRIVATE KEY-----\n',
    );
    srv = new ServidorCa({
      rutaCa: () => ca,
      asegurarCa: async () => {},
      interfaces: () => ({ lo: [info('127.0.0.1', { internal: true })] }),
      // Las pruebas escuchan en 127.0.0.1: nunca exponen nada a la red.
      permitirIp: (ip) => ip === '127.0.0.1',
    });
  });
  afterEach(async () => {
    await srv.cerrar();
    vi.useRealTimers();
  });

  function pedir(
    url: string,
    o: http.RequestOptions = {},
  ): Promise<{ estado: number; cuerpo: string; cab: http.IncomingHttpHeaders }> {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const r = http.request(
        {
          host: u.hostname,
          port: u.port,
          path: o.path ?? u.pathname,
          method: o.method ?? 'GET',
          headers: o.headers,
        },
        (res) => {
          let t = '';
          res.on('data', (d) => (t += d));
          res.on('end', () =>
            resolve({ estado: res.statusCode ?? 0, cuerpo: t, cab: res.headers }),
          );
        },
      );
      r.on('error', reject);
      r.end();
    });
  }

  it('entrega solo ca.crt, con su tipo, bajo un token aleatorio', async () => {
    const { url } = await srv.abrir({ ip: '127.0.0.1' });
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/[0-9a-f]{32}\/ca\.crt$/);
    const r = await pedir(url);
    expect(r.estado).toBe(200);
    expect(r.cuerpo).toBe(PEM);
    expect(r.cab['content-type']).toBe('application/x-x509-ca-cert');
    expect(r.cuerpo).not.toContain('PRIVATE');
  });

  it('cualquier otra ruta es 404: sin token, ca.key, recorrido de rutas', async () => {
    const { url } = await srv.abrir({ ip: '127.0.0.1' });
    const u = new URL(url);
    const token = u.pathname.split('/')[1]!;
    const malas = [
      '/',
      '/ca.crt',
      '/ca.key',
      `/${token}/ca.key`,
      `/${token}/`,
      `/${token}/../ca.key`,
      `/${token}/..%2fca.key`,
      `/${token}/%2e%2e/wolfcore-dev-ca.key`,
      `/${'0'.repeat(32)}/ca.crt`,
      `/${token}/ca.crt/extra`,
      `/${token}/ca.crt?x=1`.replace('?x=1', '/..'),
    ];
    for (const p of malas) {
      const r = await pedir(url, { path: p });
      expect(r.estado, p).toBe(404);
      expect(r.cuerpo, p).not.toContain('PRIVATE');
      expect(r.cuerpo, p).not.toContain('BEGIN');
    }
    const post = await pedir(url, { method: 'POST' });
    expect(post.estado).toBe(404);
  });

  it('el token cambia en cada apertura y abrir dos veces devuelve la misma URL', async () => {
    const a = await srv.abrir({ ip: '127.0.0.1' });
    const b = await srv.abrir({ ip: '127.0.0.1' });
    expect(b.url).toBe(a.url);
    await srv.cerrar();
    const c = await srv.abrir({ ip: '127.0.0.1' });
    expect(c.url).not.toBe(a.url);
  });

  it('cerrar libera el puerto y la URL deja de responder', async () => {
    const { url } = await srv.abrir({ ip: '127.0.0.1' });
    expect(srv.abierto()).toBe(true);
    await srv.cerrar();
    expect(srv.abierto()).toBe(false);
    await expect(pedir(url)).rejects.toBeDefined();
  });

  it('se cierra solo a los 10 minutos', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { url, expira } = await srv.abrir({ ip: '127.0.0.1' });
    expect(expira - Date.now()).toBe(10 * 60_000);
    await vi.advanceTimersByTimeAsync(10 * 60_000 - 1);
    expect(srv.abierto()).toBe(true);
    await vi.advanceTimersByTimeAsync(2);
    expect(srv.abierto()).toBe(false);
    vi.useRealTimers();
    await expect(pedir(url)).rejects.toBeDefined();
  });

  it('rechaza una IP que no es de la red local (nunca 0.0.0.0) y avisa si no hay red', async () => {
    const real = new ServidorCa({
      rutaCa: () => ca,
      asegurarCa: async () => {},
      interfaces: () => ({ 'Wi-Fi': [info('192.168.1.50')] }),
    });
    await expect(real.abrir({ ip: '0.0.0.0' })).rejects.toMatchObject({
      codigo: 'lan.ip_no_valida',
    });
    await expect(real.abrir({ ip: '10.9.9.9' })).rejects.toMatchObject({
      codigo: 'lan.ip_no_valida',
    });
    const sin = new ServidorCa({
      rutaCa: () => ca,
      asegurarCa: async () => {},
      interfaces: () => ({}),
    });
    await expect(sin.abrir()).rejects.toMatchObject({ codigo: 'lan.sin_red' });
  });

  it('no entrega nada si el archivo de la CA llevara una clave privada', async () => {
    writeFileSync(ca, PEM + '-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----\n');
    const { url } = await srv.abrir({ ip: '127.0.0.1' });
    const r = await pedir(url);
    expect(r.estado).toBe(404);
    expect(r.cuerpo).not.toContain('PRIVATE');
  });

  it('el puerto es el que el sistema eligió en la IP dada', async () => {
    const { url } = await srv.abrir({ ip: '127.0.0.1' });
    expect(Number(new URL(url).port)).toBeGreaterThan(0);
  });
});
