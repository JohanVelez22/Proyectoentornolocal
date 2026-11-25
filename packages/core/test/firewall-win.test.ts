import { describe, expect, it } from 'vitest';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
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
