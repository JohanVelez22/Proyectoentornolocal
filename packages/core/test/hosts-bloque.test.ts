import { describe, expect, it } from 'vitest';
import { analizarHosts, aplicarBloque } from '../src/hosts/bloque';

const INI = '# >>> WolfCore Dev (no editar a mano)';
const FIN = '# <<< WolfCore Dev';

describe('aplicarBloque', () => {
  it('crea el bloque en un hosts sin él y conserva lo demás', () => {
    const base = '# comentario\r\n127.0.0.1  localhost\r\n';
    const r = aplicarBloque(base, ['b.test', 'a.test']);
    expect(r).toBe(
      `${base}${INI}\r\n127.0.0.1  a.test\r\n::1  a.test\r\n127.0.0.1  b.test\r\n::1  b.test\r\n${FIN}\r\n`,
    );
  });

  it('agrega salto si el archivo no termina en salto', () => {
    const r = aplicarBloque('127.0.0.1 localhost', ['a.test']);
    expect(r.startsWith('127.0.0.1 localhost\r\n' + INI)).toBe(true);
  });

  it('reemplaza un bloque existente sin tocar el resto', () => {
    const antes = '1.1.1.1 x\r\n';
    const despues = '2.2.2.2 y\r\n';
    const viejo = `${INI}\r\n127.0.0.1  viejo.test\r\n::1  viejo.test\r\n${FIN}\r\n`;
    const r = aplicarBloque(antes + viejo + despues, ['nuevo.test']);
    expect(r).toBe(
      `${antes}${INI}\r\n127.0.0.1  nuevo.test\r\n::1  nuevo.test\r\n${FIN}\r\n${despues}`,
    );
  });

  it('usa LF si el archivo es LF', () => {
    const r = aplicarBloque('127.0.0.1 localhost\n', ['a.test']);
    expect(r).not.toContain('\r');
    expect(r.endsWith(`${FIN}\n`)).toBe(true);
  });

  it('con BOM al inicio lo conserva y analizarHosts no se confunde', () => {
    const base = '\uFEFF127.0.0.1 localhost\r\n';
    const r = aplicarBloque(base, ['a.test']);
    expect(r.startsWith('\uFEFF127.0.0.1 localhost')).toBe(true);
    const a = analizarHosts(r);
    expect(a.enBloque).toEqual(['a.test']);
    expect(a.fuera).toEqual(['localhost']);
  });

  it('BOM seguido directamente del bloque se reemplaza conservando la BOM', () => {
    const r = aplicarBloque(`\uFEFF${INI}\r\n127.0.0.1  a.test\r\n${FIN}\r\n`, ['b.test']);
    expect(r.startsWith(`\uFEFF${INI}`)).toBe(true);
    expect(analizarHosts(r).enBloque).toEqual(['b.test']);
  });

  it('un dominio ya presente fuera del bloque sigue fuera y aparece en fuera', () => {
    const base = '127.0.0.1  app.test\r\n';
    const r = aplicarBloque(base, ['app.test']);
    expect(r.startsWith(base)).toBe(true);
    const a = analizarHosts(r);
    expect(a.fuera).toContain('app.test');
    expect(a.enBloque).toEqual(['app.test']);
  });

  it('lista vacía elimina el bloque', () => {
    const base = '127.0.0.1 localhost\r\n';
    const con = aplicarBloque(base, ['a.test']);
    expect(aplicarBloque(con, [])).toBe(base);
  });

  it('lista vacía sin bloque no cambia nada', () => {
    expect(aplicarBloque('x\n', [])).toBe('x\n');
  });

  it('es idempotente', () => {
    const una = aplicarBloque('127.0.0.1 localhost\r\n', ['a.test', 'b.test']);
    expect(aplicarBloque(una, ['b.test', 'a.test'])).toBe(una);
  });
});

describe('bloque con el nombre anterior', () => {
  const VIEJO_INI = '# >>> Proyectoentornolocal (no editar a mano)';
  const VIEJO_FIN = '# <<< Proyectoentornolocal';
  const viejo = `${VIEJO_INI}\r\n127.0.0.1  a.test\r\n::1  a.test\r\n${VIEJO_FIN}\r\n`;
  it('lo reemplaza por el nuevo sin duplicar y conserva las líneas de afuera', () => {
    const antes = '1.1.1.1 x\r\n';
    const despues = '2.2.2.2 y\r\n';
    const r = aplicarBloque(antes + viejo + despues, ['nuevo.test']);
    expect(r).toBe(
      `${antes}${INI}\r\n127.0.0.1  nuevo.test\r\n::1  nuevo.test\r\n${FIN}\r\n${despues}`,
    );
    expect(r).not.toContain('Proyectoentornolocal');
  });
  it('si conviven el viejo y el nuevo, no queda ninguno de los viejos', () => {
    const nuevo = `${INI}\r\n127.0.0.1  b.test\r\n${FIN}\r\n`;
    const r = aplicarBloque(`x\r\n${viejo}${nuevo}`, ['c.test']);
    expect(r).not.toContain('Proyectoentornolocal');
    expect(r.split(INI).length - 1).toBe(1);
    expect(analizarHosts(r).enBloque).toEqual(['c.test']);
  });
  it('lista vacía elimina el bloque viejo', () => {
    expect(aplicarBloque(`x\r\n${viejo}`, [])).toBe('x\r\n');
  });
  it('analizarHosts reconoce el bloque viejo', () => {
    expect(analizarHosts(viejo).enBloque).toEqual(['a.test']);
  });
});

describe('dominios inválidos', () => {
  it('rechaza espacios, saltos de línea y marcadores', () => {
    for (const d of ['a.test\n1.1.1.1 x', 'a b', '', '# <<< WolfCore Dev', '-a.test', 'a..test']) {
      expect(() => aplicarBloque('x\n', [d])).toThrow(/Dominio inválido/);
    }
  });
  it('normaliza espacios y mayúsculas', () => {
    expect(aplicarBloque('', [' A.Test '])).toContain('127.0.0.1  a.test');
  });
});

describe('analizarHosts', () => {
  it('ignora comentarios y comentarios en línea', () => {
    const a = analizarHosts('# 1.1.1.1 no.test\r\n127.0.0.1 uno.test dos.test # nota\r\n');
    expect(a.fuera).toEqual(['uno.test', 'dos.test']);
    expect(a.enBloque).toEqual([]);
  });
});
