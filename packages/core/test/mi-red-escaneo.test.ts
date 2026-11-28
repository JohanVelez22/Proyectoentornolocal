import { describe, expect, it } from 'vitest';
import { CONCURRENCIA_ESCANEO, escanearRango } from '../src/miRed/escaneo';
import { fabricantePorMac, esMacAleatoria, PREFIJOS_CONOCIDOS } from '../src/miRed/fabricante';
import { esPrivadaRfc1918, rangoDeEscaneo } from '../src/miRed/rfc1918';

/** D53: el escaneo respeta la concurrencia, el rango y la cancelación (todo con pings simulados). */
describe('escaneo por ping (D53)', () => {
  it('recorre el rango entero con 32 pings a la vez como máximo y devuelve los que respondieron', async () => {
    const rango = rangoDeEscaneo('192.168.1.20', 24);
    let activos = 0;
    let maximo = 0;
    const pedidos: string[] = [];
    const avances: number[] = [];
    const r = await escanearRango({
      rango,
      ping: async (ip) => {
        pedidos.push(ip);
        activos++;
        maximo = Math.max(maximo, activos);
        await new Promise((res) => setTimeout(res, 2));
        activos--;
        return ip === '192.168.1.1' || ip === '192.168.1.77' ? 3 : null;
      },
      alAvanzar: (hechos) => avances.push(hechos),
    });
    expect(maximo).toBeLessThanOrEqual(CONCURRENCIA_ESCANEO);
    expect(maximo).toBeGreaterThan(1);
    expect(pedidos).toHaveLength(253);
    expect(new Set(pedidos).size).toBe(253);
    expect(pedidos).not.toContain('192.168.1.20');
    // Nunca sale de su /24 ni toca una IP pública.
    expect(pedidos.every((ip) => ip.startsWith('192.168.1.') && esPrivadaRfc1918(ip))).toBe(true);
    expect(r).toMatchObject({ revisados: 253, total: 253, cancelado: false });
    expect(r.vivos.map((v) => v.ip)).toEqual(['192.168.1.1', '192.168.1.77']);
    expect(avances.at(-1)).toBe(253);
  });

  it('pedir más de 32 a la vez no pasa de 32, y 1 va de uno en uno', async () => {
    const rango = rangoDeEscaneo('10.0.0.5', 26);
    for (const [pedida, tope] of [
      [500, CONCURRENCIA_ESCANEO],
      [1, 1],
      [0, 1],
    ] as const) {
      let activos = 0;
      let maximo = 0;
      await escanearRango({
        rango,
        concurrencia: pedida,
        ping: async () => {
          activos++;
          maximo = Math.max(maximo, activos);
          await new Promise((res) => setTimeout(res, 1));
          activos--;
          return null;
        },
      });
      expect(maximo).toBeLessThanOrEqual(tope);
    }
  });

  it('cancelar detiene los pings nuevos y devuelve lo hallado con cancelado', async () => {
    const rango = rangoDeEscaneo('192.168.1.20', 24);
    const ctl = new AbortController();
    let lanzados = 0;
    const r = await escanearRango({
      rango,
      concurrencia: 4,
      senal: ctl.signal,
      ping: async (ip, senal) => {
        lanzados++;
        if (lanzados === 12) ctl.abort();
        await new Promise((res) => setTimeout(res, 3));
        expect(senal).toBeInstanceOf(AbortSignal);
        return ip.endsWith('.2') ? 1 : null;
      },
    });
    expect(r.cancelado).toBe(true);
    expect(lanzados).toBeLessThan(40);
    expect(r.revisados).toBeLessThan(253);
  });

  it('con la señal ya cancelada no lanza ningún ping', async () => {
    const ctl = new AbortController();
    ctl.abort();
    let lanzados = 0;
    const r = await escanearRango({
      rango: rangoDeEscaneo('172.16.4.4', 24),
      senal: ctl.signal,
      ping: async () => {
        lanzados++;
        return null;
      },
    });
    expect(lanzados).toBe(0);
    expect(r).toMatchObject({ cancelado: true, revisados: 0, vivos: [] });
  });

  it('un ping que falla cuenta como sin respuesta y no detiene el escaneo', async () => {
    const r = await escanearRango({
      rango: rangoDeEscaneo('10.1.1.9', 28),
      ping: async (ip) => {
        if (ip.endsWith('.3')) throw new Error('boom');
        return ip.endsWith('.4') ? 2 : null;
      },
    });
    expect(r.cancelado).toBe(false);
    expect(r.vivos.map((v) => v.ip)).toEqual(['10.1.1.4']);
    expect(r.revisados).toBe(r.total);
  });
});

describe('fabricante por OUI (D53)', () => {
  it('conoce prefijos comunes con cualquier separador y mayúsculas', () => {
    expect(fabricantePorMac('b8:27:eb:12:34:56')).toBe('Raspberry Pi');
    expect(fabricantePorMac('B8-27-EB-12-34-56')).toBe('Raspberry Pi');
    expect(fabricantePorMac('00:50:56:aa:bb:cc')).toBe('VMware');
    expect(fabricantePorMac('50c7bf000001')).toBe('TP-Link');
  });

  it('sin fabricante si el prefijo no está o la MAC es aleatoria o no es una MAC', () => {
    expect(fabricantePorMac('12:34:56:78:9a:bc')).toBeNull();
    // Bit de «administrada localmente» (típico de los teléfonos con dirección privada).
    expect(esMacAleatoria('da:a1:19:00:00:01')).toBe(true);
    expect(fabricantePorMac('da:a1:19:00:00:01')).toBeNull();
    expect(fabricantePorMac('')).toBeNull();
    expect(fabricantePorMac('00:50:56')).toBeNull();
  });

  it('la tabla es pequeña, con prefijos de 6 dígitos hexadecimales y sin repetirse', () => {
    expect(PREFIJOS_CONOCIDOS.length).toBeLessThan(200);
    for (const p of PREFIJOS_CONOCIDOS) expect(p).toMatch(/^[0-9A-F]{6}$/);
    expect(new Set(PREFIJOS_CONOCIDOS).size).toBe(PREFIJOS_CONOCIDOS.length);
    for (const p of PREFIJOS_CONOCIDOS) expect(esMacAleatoria(`${p}000000`), p).toBe(false);
  });
});
