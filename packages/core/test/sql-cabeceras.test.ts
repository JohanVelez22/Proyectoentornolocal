import { describe, expect, it } from 'vitest';
import {
  definerMysql,
  nombreDuenoMysql,
  revisarSql,
  type OpcionesRevisarSql,
} from '../src/bd/sqlPermitido';

const definer = definerMysql(nombreDuenoMysql('tienda'));
const importada: OpcionesRevisarSql = { origen: 'importada' as const, definer };
const propia: OpcionesRevisarSql = { origen: 'propia' as const, definer };
const una = (sql: string, o: OpcionesRevisarSql = importada): string =>
  revisarSql(sql, 'mysql', o)[0]!.texto;
const rechaza = (sql: string, o: OpcionesRevisarSql = importada): void =>
  expect(() => revisarSql(sql, 'mysql', o)).toThrowError(
    expect.objectContaining({ codigo: 'bd.sql_no_permitido' }),
  );

describe('cabeceras de vistas, rutinas y disparadores (MySQL)', () => {
  it('el DEFINER es la cuenta bloqueada de la base, también en una base propia', () => {
    for (const o of [importada, propia]) {
      expect(una('CREATE DEFINER=`root`@`localhost` VIEW v AS select 1', o)).toContain(
        `DEFINER = ${definer}`,
      );
      expect(una('CREATE DEFINER=CURRENT_USER FUNCTION f() RETURNS int RETURN 1', o)).toContain(
        `DEFINER = ${definer}`,
      );
    }
    expect(una('CREATE TRIGGER t BEFORE INSERT ON x FOR EACH ROW SET NEW.a = 1', propia)).toMatch(
      /^CREATE DEFINER = \S+ TRIGGER t/,
    );
    expect(nombreDuenoMysql('tienda').length).toBeLessThanOrEqual(32);
    expect(nombreDuenoMysql('A')).toBe(nombreDuenoMysql('a'));
  });

  it('la frase SQL SECURITY dentro de una cadena, un comentario o un alias no cuenta', () => {
    for (const cuerpo of [
      "select 'SQL SECURITY INVOKER' AS x",
      'select 1 AS `SQL SECURITY INVOKER`',
      'select 1 /* SQL SECURITY INVOKER */',
      "select 'SQL SECURITY INVOKER VIEW'",
    ]) {
      const t = una(`CREATE SQL SECURITY DEFINER VIEW v AS ${cuerpo}`);
      expect(
        t.startsWith(`CREATE OR REPLACE DEFINER = ${definer} SQL SECURITY INVOKER VIEW v AS`),
      ).toBe(true);
      // Sin la frase en la cabecera tampoco: se inserta.
      expect(una(`CREATE VIEW v AS ${cuerpo}`)).toContain('SQL SECURITY INVOKER VIEW v AS');
    }
    const f = una(
      'CREATE FUNCTION f() RETURNS int DETERMINISTIC RETURN (select 1 AS `SQL SECURITY INVOKER`)',
    );
    expect(f).toMatch(
      /^CREATE DEFINER = \S+ FUNCTION f\(\) RETURNS int SQL SECURITY INVOKER DETERMINISTIC/,
    );
    expect(una("CREATE FUNCTION f() RETURNS int SQL SECURITY DEFINER RETURN 'x'")).toContain(
      'SQL SECURITY INVOKER RETURN',
    );
  });

  it('un nombre con base delante se rechaza (otra.v, otra.f, otra.p, CREATE OR REPLACE sobre otra base)', () => {
    for (const sql of [
      'CREATE VIEW otra.v AS select 1',
      'CREATE VIEW `otra`.`v` AS select 1',
      'CREATE OR REPLACE VIEW otra.v AS select 1',
      'CREATE VIEW otra . v AS select 1',
      'CREATE VIEW /* c */ otra.v AS select 1',
      'CREATE FUNCTION otra.f() RETURNS int RETURN 1',
      'CREATE OR REPLACE FUNCTION `otra`.`f`() RETURNS int RETURN 1',
      'CREATE PROCEDURE otra.p() SELECT 1',
      'CREATE TRIGGER otra.t BEFORE INSERT ON x FOR EACH ROW SET NEW.a = 1',
      'CREATE TRIGGER t BEFORE INSERT ON otra.x FOR EACH ROW SET NEW.a = 1',
    ]) {
      rechaza(sql, propia);
    }
    // Los nombres sin base, aunque entre comillas o con puntos dentro de las comillas, pasan.
    expect(una('CREATE VIEW `a.b` AS select 1')).toContain('VIEW `a.b` AS');
  });

  it('una cabecera que no se reconoce se rechaza en vez de dejarla pasar', () => {
    rechaza('CREATE ALGORITHM = MERGE ALGORITHM = TEMPTABLE VIEW v AS select 1');
  });
});
