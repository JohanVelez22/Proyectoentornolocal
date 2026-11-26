import { describe, expect, it } from 'vitest';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
  esReglaAcotada,
  interpretarPerfilRed,
  interpretarReglasEntrada,
  SCRIPT_REGLAS_ENTRADA,
  scriptPerfilRed,
} from '../src/plataforma/firewallWin';

describe('lecturas del cortafuegos y del perfil de red (solo lectura)', () => {
  it('el script de reglas solo lee: nada de New-, Set-, Remove- ni Disable-', () => {
    expect(SCRIPT_REGLAS_ENTRADA).toContain('Get-NetFirewallApplicationFilter');
    expect(SCRIPT_REGLAS_ENTRADA).toContain('Get-NetFirewallRule');
    expect(SCRIPT_REGLAS_ENTRADA).not.toMatch(/\b(New|Set|Remove|Disable|Enable|Add)-/);
    for (const p of ['nginx', 'php-cgi', 'php', 'mysqld', 'postgres']) {
      expect(SCRIPT_REGLAS_ENTRADA).toContain(p);
    }
  });

  it('interpreta una regla por línea y descarta lo que no encaja', () => {
    const salida = [
      '{AAAA-1}\tnginx.exe\tPublic, Private\tC:/x/nginx.exe',
      '{BBBB-2}\tpostgres\tPrivate\tC:/x/postgres.exe',
      'linea rara',
      "x'; calc\tmal\tAny\tC:/x/php.exe",
      '',
    ].join('\r\n');
    expect(interpretarReglasEntrada(salida)).toEqual([
      {
        nombre: '{AAAA-1}',
        nombreVisible: 'nginx.exe',
        perfil: 'Public, Private',
        programa: 'C:/x/nginx.exe',
      },
      {
        nombre: '{BBBB-2}',
        nombreVisible: 'postgres',
        perfil: 'Private',
        programa: 'C:/x/postgres.exe',
      },
    ]);
  });

  it('el script del perfil solo acepta una IPv4 y solo lee', () => {
    expect(scriptPerfilRed('192.168.1.50')).toContain('Get-NetConnectionProfile');
    expect(scriptPerfilRed('192.168.1.50')).not.toMatch(/\b(Set|New|Remove)-/);
    for (const mala of ["1.2.3.4'; calc", '::1', '', '1.2.3']) {
      expect(() => scriptPerfilRed(mala), mala).toThrow();
    }
  });

  it('interpreta la categoría de la red', () => {
    expect(interpretarPerfilRed('Private\r\n')).toBe('privado');
    expect(interpretarPerfilRed('Public')).toBe('publico');
    expect(interpretarPerfilRed('DomainAuthenticated')).toBe('dominio');
    expect(interpretarPerfilRed('')).toBeNull();
    expect(interpretarPerfilRed('otra')).toBeNull();
  });

  it('la plataforma falsa devuelve lo configurado (copias, nunca el estado interno)', async () => {
    const p = new PlataformaFalsa();
    expect(await p.perfilRedDe('10.0.0.1')).toBeNull();
    p.perfiles.set('10.0.0.1', 'publico');
    expect(await p.perfilRedDe('10.0.0.1')).toBe('publico');
    p.reglasEntrada = {
      ok: true,
      reglas: [{ nombre: 'a', nombreVisible: 'a', perfil: 'Any', programa: 'C:/nginx.exe' }],
    };
    const r = await p.reglasEntradaPermitidas();
    r.reglas[0]!.programa = 'cambiado';
    expect((await p.reglasEntradaPermitidas()).reglas[0]!.programa).toBe('C:/nginx.exe');
  });
});

describe('reglas acotadas a la red local (I1)', () => {
  const linea = (...c: string[]): string => c.join(String.fromCharCode(9));
  const leer = (s: string) => interpretarReglasEntrada(s)[0]!;

  it('lee protocolo, puertos locales y direcciones remotas', () => {
    const r = leer(
      linea('{A}', 'nginx', 'Private', 'C:/w/nginx.exe', 'TCP', '8100', 'LocalSubnet'),
    );
    expect(r).toMatchObject({
      protocolo: 'TCP',
      puertoLocal: '8100',
      direccionRemota: 'LocalSubnet',
    });
    expect(esReglaAcotada(r)).toBe(true);
  });

  it('con una línea antigua (sin esas columnas) no se da por acotada', () => {
    const r = leer(linea('{A}', 'nginx', 'Private', 'C:/w/nginx.exe'));
    expect(r.protocolo).toBeUndefined();
    expect(esReglaAcotada(r)).toBe(false);
  });

  it('cualquier cosa más abierta no es acotada', () => {
    const base = ['{A}', 'nginx', 'Private', 'C:/w/nginx.exe', 'TCP', '8100', 'LocalSubnet'];
    const con = (i: number, v: string): string[] => base.map((x, j) => (j === i ? v : x));
    for (const [i, v] of [
      [2, 'Private, Public'],
      [2, 'Any'],
      [4, 'Any'],
      [5, 'Any'],
      [5, '80,Any'],
      [6, 'Any'],
      [6, 'LocalSubnet,10.0.0.1'],
      [6, ''],
    ] as const) {
      expect(esReglaAcotada(leer(linea(...con(i, v)))), `${i}=${v}`).toBe(false);
    }
  });

  it('los nombres que crea Windows (con barras y dos puntos) se leen', () => {
    const n = 'TCP Query User{88DB9641-6D7E-41E6-8660-45595C147EA6}C:/users/x/app/nginx.exe';
    expect(leer(linea(n, 'nginx.exe', 'Private', 'C:/users/x/app/nginx.exe')).nombre).toBe(n);
  });
});
