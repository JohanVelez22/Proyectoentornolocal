import { describe, expect, it } from 'vitest';
import {
  enRango,
  esPrivadaRfc1918,
  ipsDelRango,
  ipv4ANumero,
  numeroAIpv4,
  rangoDeEscaneo,
} from '../src/miRed/rfc1918';
import {
  nombreDeRecursoValido,
  rutaUncRecurso,
  validarIpPrivada,
  validarNombreRecurso,
  validarRutaRecursoRed,
} from '../src/miRed/validacion';

const rechaza = (fn: () => unknown, codigo: string): void =>
  expect(fn).toThrowError(expect.objectContaining({ codigo }));

/** D53: solo se explora y se consulta lo privado, con IP estrictas y rangos de un /24 como mucho. */
describe('IPv4 y RFC 1918 (D53)', () => {
  it('acepta solo IPv4 decimales estrictas', () => {
    expect(ipv4ANumero('192.168.1.10')).toBe(3232235786);
    expect(numeroAIpv4(3232235786)).toBe('192.168.1.10');
    for (const mala of [
      '',
      '1.2.3',
      '1.2.3.4.5',
      '256.1.1.1',
      '010.0.0.1',
      '192.168.001.1',
      '0x0a.0.0.1',
      ' 10.0.0.1',
      '10.0.0.1 ',
      '10.0.0.1\n',
      '10.0.0.-1',
      '::1',
      'fe80::1',
      'localhost',
      '2130706433',
      null,
      undefined,
      10,
    ]) {
      expect(ipv4ANumero(mala), String(mala)).toBeNull();
    }
  });

  it('privadas: 10/8, 172.16/12 y 192.168/16, y nada más', () => {
    for (const ok of [
      '10.0.0.1',
      '10.255.255.254',
      '172.16.0.1',
      '172.31.255.254',
      '192.168.0.1',
    ]) {
      expect(esPrivadaRfc1918(ok), ok).toBe(true);
    }
    for (const no of [
      '8.8.8.8',
      '1.1.1.1',
      '172.15.255.255',
      '172.32.0.1',
      '192.169.0.1',
      '192.167.255.255',
      '11.0.0.1',
      '127.0.0.1',
      '169.254.1.1',
      '100.64.0.1',
      '224.0.0.1',
      '255.255.255.255',
      '0.0.0.0',
      '10.0.0',
      '10.0.0.256',
    ]) {
      expect(esPrivadaRfc1918(no), no).toBe(false);
    }
  });
});

describe('rango de escaneo (D53)', () => {
  it('un /24 se explora entero, sin la red, la difusión ni la propia IP', () => {
    const r = rangoDeEscaneo('192.168.1.20', 24);
    expect(r).toMatchObject({ red: '192.168.1.0', prefijo: 24, propia: '192.168.1.20' });
    const ips = ipsDelRango(r);
    expect(ips).toHaveLength(253);
    expect(ips[0]).toBe('192.168.1.1');
    expect(ips.at(-1)).toBe('192.168.1.254');
    expect(ips).not.toContain('192.168.1.20');
    expect(ips).not.toContain('192.168.1.0');
    expect(ips).not.toContain('192.168.1.255');
    expect(enRango(r, '192.168.1.99')).toBe(true);
    expect(enRango(r, '192.168.2.99')).toBe(false);
  });

  it('una red mayor (/8, /12, /16) se recorta al /24 de la IP del equipo', () => {
    for (const [ip, prefijo, red] of [
      ['10.20.30.40', 8, '10.20.30.0'],
      ['172.20.5.9', 12, '172.20.5.0'],
      ['192.168.77.3', 16, '192.168.77.0'],
      ['192.168.77.3', 23, '192.168.77.0'],
    ] as const) {
      const r = rangoDeEscaneo(ip, prefijo);
      expect(r.red).toBe(red);
      expect(r.prefijo).toBe(24);
      expect(ipsDelRango(r).length).toBeLessThanOrEqual(254);
    }
  });

  it('una red menor se respeta (un /28 son 14 equipos, 13 sin el propio)', () => {
    const r = rangoDeEscaneo('10.0.0.5', 28);
    expect(r.prefijo).toBe(28);
    expect(ipsDelRango(r)).toHaveLength(13);
    expect(ipsDelRango(r).every((ip) => esPrivadaRfc1918(ip))).toBe(true);
  });

  it('pedir un máximo mayor que /24 no lo amplía', () => {
    expect(rangoDeEscaneo('192.168.1.20', 16, 8).prefijo).toBe(24);
  });

  it('rechaza IP públicas, raras o sin equipos, aunque lleguen por IPC', () => {
    for (const ip of [
      '8.8.8.8',
      '1.1.1.1',
      '172.32.0.1',
      '100.64.0.1',
      '169.254.3.3',
      '127.0.0.1',
      'x',
      '',
      null,
      5,
    ]) {
      rechaza(() => rangoDeEscaneo(ip, 24), 'red.rango_no_permitido');
    }
    for (const prefijo of [0, 7, 31, 32, -1, 24.5, NaN, '24', null]) {
      rechaza(() => rangoDeEscaneo('192.168.1.1', prefijo), 'red.rango_no_permitido');
    }
  });
});

describe('validación de equipos y recursos (D53)', () => {
  it('validarIpPrivada solo deja IPv4 privadas', () => {
    expect(validarIpPrivada('192.168.1.5')).toBe('192.168.1.5');
    for (const mala of [
      '8.8.8.8',
      'pc-sala',
      '192.168.1.5 & calc',
      '192.168.1.5;ls',
      '-n 100',
      '192.168.1.5\\x',
      '::1',
      '',
    ]) {
      rechaza(() => validarIpPrivada(mala), 'red.equipo_no_valido');
    }
  });

  it('el nombre del recurso rechaza caracteres prohibidos, controles, extremos con espacio y administrativos', () => {
    for (const ok of [
      'Documentos',
      'Mis fotos',
      'Música 2024',
      'a',
      'R&D',
      "O'Brien",
      'x'.repeat(80),
    ]) {
      expect(nombreDeRecursoValido(ok), ok).toBe(true);
    }
    for (const malo of [
      '',
      'x'.repeat(81),
      'a/b',
      'a\\b',
      '..',
      '.',
      '.oculto',
      'fin.',
      ' espacio',
      'espacio ',
      'a\nb',
      'a\u0000b',
      'a:b',
      'a|b',
      'a<b>',
      'a*b',
      'a?b',
      '"a"',
      '%TEMP%',
      'C$',
      'ADMIN$',
      'IPC$',
      'print$',
      'oculta$',
      // Caracteres de formato invisibles (bidi, ancho cero, marca de orden de bytes).
      'Fotos' + String.fromCodePoint(0x202e) + 'fdp.exe',
      'Fo' + String.fromCodePoint(0x200b) + 'tos',
      String.fromCodePoint(0x2066) + 'Fotos',
      'Fotos' + String.fromCodePoint(0xfeff),
      null,
      7,
    ]) {
      expect(nombreDeRecursoValido(malo), String(malo)).toBe(false);
    }
    rechaza(() => validarNombreRecurso('C$'), 'red.recurso_no_valido');
  });

  it('la ruta UNC es exactamente \\\\IP\\recurso, y se vuelve a validar al abrir', () => {
    expect(rutaUncRecurso('192.168.1.5', 'Docs')).toBe('\\\\192.168.1.5\\Docs');
    expect(validarRutaRecursoRed('\\\\10.0.0.2\\Música 2024')).toBe('\\\\10.0.0.2\\Música 2024');
    for (const mala of [
      '\\\\8.8.8.8\\Docs',
      '\\\\pc-sala\\Docs',
      '\\\\192.168.1.5\\C$',
      '\\\\192.168.1.5\\Docs\\sub',
      '\\\\192.168.1.5',
      '\\\\192.168.1.5\\',
      '//192.168.1.5/Docs',
      'C:\\Windows\\System32\\calc.exe',
      'smb://192.168.1.5/Docs',
      '\\\\?\\C:\\x',
      '\\\\192.168.1.5\\Docs\u0000',
      '',
      null,
    ]) {
      rechaza(() => validarRutaRecursoRed(mala), 'red.recurso_no_valido');
    }
  });
});
