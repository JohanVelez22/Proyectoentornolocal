import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import {
  BASE_VELOCIDAD,
  BYTES_BAJADA,
  BYTES_SUBIDA,
  MARGEN_BAJADA,
  PLAN_VELOCIDAD,
  medirVelocidad,
  type FaseVelocidad,
} from '../src/miRed/velocidad';

/** D53: la prueba de velocidad se prueba SIEMPRE contra un servidor falso local, nunca contra internet. */
interface Peticion {
  metodo: string;
  url: string;
  cabeceras: IncomingHttpHeaders;
  recibidos: number;
}

let servidor: Server | null = null;
afterEach(async () => {
  const s = servidor;
  servidor = null;
  if (!s) return;
  s.closeAllConnections();
  await new Promise<void>((r) => s.close(() => r()));
});

async function iniciar(modo: 'normal' | 'lento' | 'error' | 'infinito' = 'normal') {
  const peticiones: Peticion[] = [];
  servidor = createServer((req, res) => {
    const p: Peticion = {
      metodo: req.method ?? '',
      url: req.url ?? '',
      cabeceras: req.headers,
      recibidos: 0,
    };
    peticiones.push(p);
    if (modo === 'error') {
      res.statusCode = 503;
      res.end('no');
      return;
    }
    const url = new URL(req.url ?? '/', 'http://x');
    if (url.pathname === '/__down') {
      const n = Number(url.searchParams.get('bytes'));
      res.setHeader('content-type', 'application/octet-stream');
      if (modo === 'lento' && n > 0) {
        // Manda un poco y se queda esperando: para el plazo y la cancelación.
        res.write(Buffer.alloc(4096));
        return;
      }
      if (modo === 'infinito' && n > 0) {
        // Un servidor que no respeta el tamaño pedido: sigue mandando hasta que se corte.
        const trozo = Buffer.alloc(16 * 1024);
        const mandar = (): void => {
          while (!res.destroyed && res.write(trozo)) {
            // sigue mientras haya sitio en el búfer
          }
          if (!res.destroyed) res.once('drain', mandar);
        };
        mandar();
        return;
      }
      res.end(Buffer.alloc(n));
    } else if (url.pathname === '/__up') {
      req.on('data', (d: Buffer) => (p.recibidos += d.length));
      req.on('end', () => {
        res.end('{}');
      });
      if (modo === 'lento') req.pause();
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((r) => servidor!.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  return { base, peticiones };
}

describe('prueba de velocidad (D53)', () => {
  it('usa los endpoints oficiales y tamaños moderados', () => {
    expect(BASE_VELOCIDAD).toBe('https://speed.cloudflare.com');
    expect(BYTES_BAJADA).toBe(25_000_000);
    expect(BYTES_SUBIDA).toBe(10_000_000);
    expect(PLAN_VELOCIDAD.bajadaMb).toBe(25);
    expect(PLAN_VELOCIDAD.subidaMb).toBe(10);
    expect(PLAN_VELOCIDAD.totalMb).toBeGreaterThanOrEqual(
      PLAN_VELOCIDAD.bajadaMb + PLAN_VELOCIDAD.subidaMb,
    );
  });

  it('mide latencia, bajada y subida contra un servidor falso, por las fases en orden', async () => {
    const { base, peticiones } = await iniciar();
    const fases: FaseVelocidad[] = [];
    const r = await medirVelocidad({
      base,
      bytesBajada: 2_000_000,
      bytesSubida: 1_000_000,
      alFase: (f) => fases.push(f),
    });
    expect(fases).toEqual(['latencia', 'bajada', 'subida']);
    expect(r.cancelada).toBe(false);
    expect(r.incompleta).toBe(false);
    expect(r.latenciaMs).not.toBeNull();
    expect(r.bajadaMbps).toBeGreaterThan(0);
    expect(r.subidaMbps).toBeGreaterThan(0);
    expect(r.bytesBajados).toBe(2_000_000);
    expect(r.bytesSubidos).toBe(1_000_000);
    const subida = peticiones.find((p) => p.url === '/__up');
    expect(subida).toMatchObject({ metodo: 'POST', recibidos: 1_000_000 });
    expect(peticiones.filter((p) => p.url === '/__down?bytes=0')).toHaveLength(6);
    expect(peticiones.some((p) => p.url === '/__down?bytes=2000000')).toBe(true);
  });

  it('no envía ningún dato de la persona: sin cookies, credenciales, referencia ni parámetros extra', async () => {
    const { base, peticiones } = await iniciar();
    await medirVelocidad({ base, bytesBajada: 10_000, bytesSubida: 10_000 });
    expect(peticiones.length).toBeGreaterThan(0);
    for (const p of peticiones) {
      expect(p.url).toMatch(/^\/(__down\?bytes=\d+|__up)$/);
      expect(p.cabeceras.cookie).toBeUndefined();
      expect(p.cabeceras.authorization).toBeUndefined();
      expect(p.cabeceras.referer).toBeUndefined();
      expect(p.cabeceras.origin).toBeUndefined();
    }
  });

  it('un error del servidor es un error, no un resultado a medias', async () => {
    const { base } = await iniciar('error');
    await expect(medirVelocidad({ base, bytesBajada: 1000, bytesSubida: 1000 })).rejects.toThrow();
  });

  it('cancelar a mitad de la bajada devuelve lo medido con cancelada y no sube nada', async () => {
    const { base, peticiones } = await iniciar('lento');
    // La latencia (bytes=0) responde normal; la bajada se queda a medias.
    const ctl = new AbortController();
    const fases: FaseVelocidad[] = [];
    const prueba = medirVelocidad({
      base,
      senal: ctl.signal,
      bytesBajada: 1_000_000,
      alFase: (f) => {
        fases.push(f);
        if (f === 'bajada') setTimeout(() => ctl.abort(), 150);
      },
    });
    const r = await prueba;
    expect(r.cancelada).toBe(true);
    expect(fases).not.toContain('subida');
    expect(peticiones.some((p) => p.url === '/__up')).toBe(false);
  });

  it('un servidor que manda de más no hace bajar más de lo pedido (más un margen) y el resultado es completo', async () => {
    const { base } = await iniciar('infinito');
    const pedidos = 1_000_000;
    const r = await medirVelocidad({
      base,
      bytesBajada: pedidos,
      bytesSubida: 100_000,
      plazoBajadaMs: 10_000,
    });
    expect(r.bytesBajados).toBeGreaterThanOrEqual(pedidos);
    expect(r.bytesBajados).toBeLessThanOrEqual(pedidos + MARGEN_BAJADA + 64 * 1024);
    expect(r.bajadaMbps).toBeGreaterThan(0);
    expect(r.cancelada).toBe(false);
  });

  it('un plazo vencido en la bajada calcula con lo recibido y lo marca incompleta', async () => {
    const { base } = await iniciar('lento');
    const r = await medirVelocidad({
      base,
      bytesBajada: 1_000_000,
      bytesSubida: 100_000,
      plazoBajadaMs: 200,
      plazoSubidaMs: 200,
    });
    expect(r.incompleta).toBe(true);
    expect(r.cancelada).toBe(false);
    expect(r.bytesBajados).toBeGreaterThan(0);
    expect(r.bytesBajados).toBeLessThan(1_000_000);
  });

  it('con la señal ya cancelada no hace ninguna petición', async () => {
    const { base, peticiones } = await iniciar();
    const ctl = new AbortController();
    ctl.abort();
    const r = await medirVelocidad({ base, senal: ctl.signal });
    expect(r.cancelada).toBe(true);
    expect(peticiones).toHaveLength(0);
  });
});
