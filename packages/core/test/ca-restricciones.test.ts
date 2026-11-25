import type { AddressInfo } from 'node:net';
import tls from 'node:tls';
import { describe, expect, it } from 'vitest';
import {
  caConRestricciones,
  dentroDeRestriccionesCa,
  emitirCertificado,
  generarCA,
  huellaSha256,
  type ParCertificado,
} from '../src/https/ca';

/**
 * Handshake TLS real (OpenSSL de Node): la cadena se verifica con las restricciones de nombre de
 * la CA, igual que haría un navegador o un cliente HTTP.
 */
async function conecta(ca: ParCertificado, hoja: ParCertificado): Promise<string | null> {
  const servidor = tls.createServer({ cert: hoja.certPem, key: hoja.keyPem }, (s) => s.end());
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  const { port } = servidor.address() as AddressInfo;
  try {
    return await new Promise<string | null>((resolve) => {
      const c = tls.connect({
        host: '127.0.0.1',
        port,
        ca: [ca.certPem],
        // Solo la cadena: el nombre del servidor no importa aquí.
        checkServerIdentity: () => undefined,
      });
      c.once('secureConnect', () => {
        c.end();
        resolve(null);
      });
      c.once('error', (e: NodeJS.ErrnoException) => resolve(e.code ?? e.message));
    });
  } finally {
    await new Promise<void>((r) => servidor.close(() => r()));
  }
}

describe('CA nueva con nameConstraints (D26)', () => {
  const ca = generarCA();

  it('la CA nueva lleva las restricciones', () => {
    expect(caConRestricciones(ca.certPem)).toBe(true);
    expect(huellaSha256(ca.certPem)).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  });

  it('valen los certificados de los sitios .test, localhost, loopback y la red local por IP (D25)', async () => {
    for (const dominios of [
      ['tienda.test', 'www.tienda.test'],
      ['localhost'],
      ['127.0.0.1'],
      ['192.168.1.20'],
      ['10.0.0.5'],
      ['172.20.3.4'],
    ]) {
      expect({ dominios, error: await conecta(ca, emitirCertificado(ca, dominios)) }).toEqual({
        dominios,
        error: null,
      });
    }
  }, 60_000);

  it('un certificado para un dominio o una IP pública no vale con esa CA', async () => {
    for (const dominios of [['banco.com'], ['8.8.8.8'], ['tienda.test', 'evil.com']]) {
      expect(await conecta(ca, emitirCertificado(ca, dominios))).not.toBeNull();
    }
  }, 60_000);

  it('dentroDeRestriccionesCa', () => {
    expect(dentroDeRestriccionesCa('x.test')).toBe(true);
    expect(dentroDeRestriccionesCa('*.x.test')).toBe(true);
    expect(dentroDeRestriccionesCa('localhost')).toBe(true);
    expect(dentroDeRestriccionesCa('192.168.0.9')).toBe(true);
    expect(dentroDeRestriccionesCa('172.32.0.1')).toBe(false);
    expect(dentroDeRestriccionesCa('::1')).toBe(true);
    expect(dentroDeRestriccionesCa('ejemplo.com')).toBe(false);
    expect(dentroDeRestriccionesCa('test.com')).toBe(false);
  });
});
