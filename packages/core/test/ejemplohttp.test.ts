import http from 'node:http';
import net from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { CODIGOS_EJEMPLO, ServidorEjemplo } from '../src/clientehttp/ejemplo';
import { PARAMETROS_ERROR } from '../src/errores';

// Servidor de ejemplo de la guía HTTP (D49). Todo en 127.0.0.1, puerto aleatorio, y se cierra al final.
let srv: ServidorEjemplo;
afterEach(async () => {
  await srv?.detener();
});

interface Resp {
  estado: number;
  cab: http.IncomingHttpHeaders;
  texto: string;
}
function pedir(
  puerto: number,
  ruta: string,
  o: { metodo?: string; cuerpo?: string | Buffer; cab?: Record<string, string> } = {},
): Promise<Resp> {
  return new Promise((ok, fallo) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: puerto,
        path: ruta,
        method: o.metodo ?? 'GET',
        headers: o.cab,
        agent: false,
      },
      (res) => {
        const partes: Buffer[] = [];
        res.on('data', (b: Buffer) => partes.push(b));
        res.on('end', () =>
          ok({
            estado: res.statusCode ?? 0,
            cab: res.headers,
            texto: Buffer.concat(partes).toString('utf8'),
          }),
        );
      },
    );
    req.on('error', fallo);
    req.end(o.cuerpo);
  });
}

describe('servidor de ejemplo (D49)', () => {
  it('escucha solo en 127.0.0.1, es idempotente y se detiene', async () => {
    srv = new ServidorEjemplo();
    expect(srv.estado()).toEqual({ activo: false, puerto: null });
    const [a, b] = await Promise.all([srv.iniciar(), srv.iniciar()]);
    expect(a).toBe(b);
    expect(srv.estado()).toEqual({ activo: true, puerto: a });
    await srv.detener();
    expect(srv.estado().activo).toBe(false);
    await expect(pedir(a, '/eco')).rejects.toThrow();
    await srv.detener();
  });

  it('/eco devuelve método, query, cuerpo y enmascara Authorization y Cookie', async () => {
    srv = new ServidorEjemplo();
    const p = await srv.iniciar();
    const r = await pedir(p, '/eco?a=1&a=2&b=x', {
      metodo: 'POST',
      cuerpo: '{"k":1}',
      cab: { authorization: 'Bearer secreto-falso', cookie: 'sid=falso', 'x-prueba': 'hola' },
    });
    const j = JSON.parse(r.texto);
    expect(r.estado).toBe(200);
    expect(j.metodo).toBe('POST');
    expect(j.query).toEqual({ a: ['1', '2'], b: 'x' });
    expect(j.cuerpo).toBe('{"k":1}');
    expect(j.cabeceras.authorization).toBe('***');
    expect(j.cabeceras.cookie).toBe('***');
    expect(j.cabeceras['x-prueba']).toBe('hola');
    expect(r.texto).not.toContain('secreto-falso');
    expect(r.cab['access-control-allow-origin']).toBeUndefined();
  });

  it('el eco recorta el cuerpo a 64 KB y el tope de entrada es 1 MB', async () => {
    srv = new ServidorEjemplo();
    const p = await srv.iniciar();
    const r = await pedir(p, '/eco', { metodo: 'POST', cuerpo: 'a'.repeat(200 * 1024) });
    const j = JSON.parse(r.texto);
    expect(j.truncado).toBe(true);
    expect(j.cuerpo.length).toBe(64 * 1024);
    const grande = await pedir(p, '/eco', {
      metodo: 'POST',
      cuerpo: Buffer.alloc(1024 * 1024 + 10, 97),
    }).catch(() => null);
    if (grande) expect(grande.estado).toBe(413);
    expect((await pedir(p, '/eco')).estado).toBe(200);
  });

  it('/estado/<código> solo responde los códigos de la guía', async () => {
    srv = new ServidorEjemplo();
    const p = await srv.iniciar();
    for (const c of CODIGOS_EJEMPLO.filter((x) => ![100, 101, 502].includes(x))) {
      const r = await pedir(p, `/estado/${c}`);
      expect(r.estado, `código ${c}`).toBe(c);
    }
    expect((await pedir(p, '/estado/204')).texto).toBe('');
    expect((await pedir(p, '/estado/304')).texto).toBe('');
    expect((await pedir(p, '/estado/405')).cab.allow).toBe('GET, HEAD');
    expect((await pedir(p, '/estado/206')).cab['content-range']).toMatch(/^bytes 0-\d+\/\d+$/);
    for (const mal of ['/estado/99', '/estado/600', '/estado/299', '/estado/abc', '/estado/200x']) {
      expect((await pedir(p, mal)).estado, mal).toBe(404);
    }
  });

  it('100, 101 y 502 se simulan con un 200 y un JSON explicativo', async () => {
    srv = new ServidorEjemplo();
    const p = await srv.iniciar();
    for (const c of [100, 101, 502]) {
      const r = await pedir(p, `/estado/${c}`);
      const j = JSON.parse(r.texto);
      expect(r.estado).toBe(200);
      expect(j.simulado).toBe(true);
      expect(j.codigo).toBe(c);
      expect(j.explicacion.length).toBeGreaterThan(10);
      expect(r.cab.upgrade).toBeUndefined();
    }
  });

  it('/redirigir lleva a /eco solo con 301, 302, 303, 307 y 308', async () => {
    srv = new ServidorEjemplo();
    const p = await srv.iniciar();
    for (const c of [301, 302, 303, 307, 308]) {
      const r = await pedir(p, `/redirigir/${c}`);
      expect(r.estado).toBe(c);
      expect(r.cab.location).toMatch(/^\/eco/);
    }
    expect((await pedir(p, '/redirigir/200')).estado).toBe(404);
  });

  it('/limite, /creado, OPTIONS y HEAD', async () => {
    srv = new ServidorEjemplo();
    const p = await srv.iniciar();
    const l = await pedir(p, '/limite');
    expect(l.estado).toBe(429);
    expect(l.cab['retry-after']).toBe('30');
    const c = await pedir(p, '/creado', { metodo: 'POST', cuerpo: '{}' });
    expect(c.estado).toBe(201);
    expect(c.cab.location).toBeDefined();
    expect((await pedir(p, '/creado')).estado).toBe(405);
    const o = await pedir(p, '/eco', { metodo: 'OPTIONS' });
    expect(o.estado).toBe(204);
    expect(o.cab.allow).toContain('GET');
    const h = await pedir(p, '/eco', { metodo: 'HEAD' });
    expect(h.estado).toBe(200);
    expect(h.texto).toBe('');
  });

  it('rechaza una cabecera Host ajena (DNS rebinding)', async () => {
    srv = new ServidorEjemplo();
    const p = await srv.iniciar();
    expect((await pedir(p, '/eco', { cab: { host: 'evil.example:80' } })).estado).toBe(403);
    expect((await pedir(p, '/eco', { cab: { host: `localhost:${p}` } })).estado).toBe(403);
    expect((await pedir(p, '/eco', { cab: { host: `127.0.0.1:${p + 1}` } })).estado).toBe(403);
    expect((await pedir(p, '/eco')).estado).toBe(200);
  });

  it('/lento responde 504 tras la espera y una conexión abandonada no deja temporizadores', async () => {
    srv = new ServidorEjemplo({ esperaLentoMs: 150 });
    const p = await srv.iniciar();
    const t0 = Date.now();
    const r = await pedir(p, '/lento');
    expect(r.estado).toBe(504);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(120);
    await new Promise<void>((ok) => {
      const s = net.connect(p, '127.0.0.1', () => {
        s.write(`GET /lento HTTP/1.1\r\nHost: 127.0.0.1:${p}\r\n\r\n`);
        setTimeout(() => {
          s.destroy();
          ok();
        }, 30);
      });
    });
    await new Promise((ok) => setTimeout(ok, 60));
    expect((srv as unknown as { espera: Set<unknown> }).espera.size).toBe(0);
  });

  it('se apaga solo tras la inactividad y las peticiones la renuevan', async () => {
    srv = new ServidorEjemplo({ inactividadMs: 200 });
    const p = await srv.iniciar();
    await new Promise((ok) => setTimeout(ok, 120));
    await pedir(p, '/eco');
    await new Promise((ok) => setTimeout(ok, 120));
    expect(srv.estado().activo).toBe(true);
    await new Promise((ok) => setTimeout(ok, 300));
    expect(srv.estado().activo).toBe(false);
  });

  it('el error de arranque tiene su código declarado', () => {
    expect(PARAMETROS_ERROR['ejemplohttp.no_arranca']).toEqual(['motivo']);
  });
});
