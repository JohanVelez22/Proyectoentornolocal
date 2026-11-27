import { describe, expect, it } from 'vitest';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
  esReglaAcotada,
  interpretarPerfilRed,
  interpretarReglasEntrada,
  SCRIPT_REGLAS_ENTRADA,
  scriptPerfilRed,
} from '../src/plataforma/firewallWin';

const json = (o: Record<string, unknown>): string => JSON.stringify(o);

describe('lecturas del cortafuegos y del perfil de red (solo lectura)', () => {
  it('el script de reglas solo lee: nada de New-, Set-, Remove- ni Disable-', () => {
    expect(SCRIPT_REGLAS_ENTRADA).toContain('Get-NetFirewallApplicationFilter');
    expect(SCRIPT_REGLAS_ENTRADA).toContain('Get-NetFirewallRule');
    expect(SCRIPT_REGLAS_ENTRADA).not.toMatch(/\b(New|Set|Remove|Disable|Enable|Add)-/);
    for (const p of ['nginx', 'php-cgi', 'php', 'mysqld', 'postgres']) {
      expect(SCRIPT_REGLAS_ENTRADA).toContain(p);
    }
  });

  it('interpreta una regla por línea (JSON) y descarta lo que no encaja', () => {
    const salida = [
      json({
        nombre: '{AAAA-1}',
        nombreVisible: 'nginx.exe',
        perfil: 'Public, Private',
        programa: 'C:/x/nginx.exe',
      }),
      json({
        nombre: '{BBBB-2}',
        nombreVisible: 'postgres',
        perfil: 'Private',
        programa: 'C:/x/postgres.exe',
      }),
      'linea rara',
      '[1,2]',
      json({ nombre: "x'; calc", nombreVisible: 'mal', perfil: 'Any', programa: 'C:/x/php.exe' }),
      json({ nombre: '{SIN-PROGRAMA}', perfil: 'Any' }),
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

  it('N2: el listado sale como JSON, no como campos separados por tabuladores', () => {
    expect(SCRIPT_REGLAS_ENTRADA).toContain('ConvertTo-Json -Compress');
    expect(SCRIPT_REGLAS_ENTRADA).not.toContain('[char]9');
  });

  it('N2: un DisplayName con tabuladores o saltos de línea no mueve campos ni hace pasar una regla por acotada', () => {
    // Con el formato antiguo, este nombre visible habría desplazado perfil y alcance.
    const hostil = 'x\tPrivate\tC:/x/nginx.exe\tTCP\t8100\tLocalSubnet\nfalsa';
    const [r, ...resto] = interpretarReglasEntrada(
      json({
        nombre: '{H-1}',
        nombreVisible: hostil,
        perfil: 'Public, Private',
        programa: 'C:/x/nginx.exe',
        protocolo: 'Any',
        puertoLocal: ['Any'],
        direccionRemota: ['Any'],
      }),
    );
    expect(resto).toEqual([]);
    expect(r!.perfil).toBe('Public, Private');
    expect(r!.protocolo).toBe('Any');
    expect(esReglaAcotada(r!)).toBe(false);
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
  const regla = (o: Record<string, unknown> = {}): string =>
    json({
      nombre: '{A}',
      nombreVisible: 'nginx',
      perfil: 'Private',
      programa: 'C:/w/nginx.exe',
      protocolo: 'TCP',
      puertoLocal: ['8100'],
      direccionRemota: ['LocalSubnet'],
      ...o,
    });
  const leer = (l: string) => interpretarReglasEntrada(l)[0]!;

  it('lee protocolo, puertos locales y direcciones remotas', () => {
    const r = leer(regla());
    expect(r).toMatchObject({
      protocolo: 'TCP',
      puertoLocal: '8100',
      direccionRemota: 'LocalSubnet',
    });
    expect(esReglaAcotada(r)).toBe(true);
  });

  it('sin datos de alcance (o mal formados) no se da por acotada', () => {
    for (const o of [
      { protocolo: undefined },
      { puertoLocal: undefined },
      { direccionRemota: 'LocalSubnet' },
      { puertoLocal: 'Any' },
    ]) {
      const r = leer(regla(o));
      expect(esReglaAcotada(r), JSON.stringify(o)).toBe(false);
    }
  });

  it('cualquier cosa más abierta no es acotada', () => {
    for (const o of [
      { perfil: 'Private, Public' },
      { perfil: 'Any' },
      { protocolo: 'Any' },
      { puertoLocal: ['Any'] },
      { puertoLocal: ['80', 'Any'] },
      { direccionRemota: ['Any'] },
      { direccionRemota: ['LocalSubnet', '10.0.0.1'] },
      { direccionRemota: [] },
    ]) {
      expect(esReglaAcotada(leer(regla(o))), JSON.stringify(o)).toBe(false);
    }
  });

  it('N3: un rango de puertos solo cuenta si cubre como mucho 100 puertos', () => {
    for (const [p, bien] of [
      ['8100-8199', true],
      ['8100-8200', false],
      ['1-65535', false],
      ['1024-65535', false],
      ['0-10', false],
      ['9000-8000', false],
      ['8100', true],
    ] as const) {
      expect(esReglaAcotada(leer(regla({ puertoLocal: [p] }))), p).toBe(bien);
    }
  });

  it('los nombres que crea Windows (con barras y dos puntos) se leen', () => {
    const n = 'TCP Query User{88DB9641-6D7E-41E6-8660-45595C147EA6}C:/users/x/app/nginx.exe';
    expect(leer(regla({ nombre: n })).nombre).toBe(n);
  });
});
