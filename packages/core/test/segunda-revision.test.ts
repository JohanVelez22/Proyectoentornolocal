import { describe, expect, it } from 'vitest';
import { validarSentenciaDatos } from '../src/bd/datosAjenos';
import { definerMysql, nombreDuenoMysql, revisarSql } from '../src/bd/sqlPermitido';

const rechaza = (sql: string): void =>
  expect(() => validarSentenciaDatos(sql), sql).toThrowError(
    expect.objectContaining({ codigo: 'bd.datos_no_permitidos' }),
  );

describe('datos: identificadores con comillas y valores literales', () => {
  it('una comilla dentro de un identificador no esconde el código que sigue', () => {
    rechaza("INSERT INTO `a'` VALUES (SLEEP(99),'')");
    rechaza("INSERT INTO `a'` VALUES (1,'') ON DUPLICATE KEY UPDATE x = SLEEP(9)");
    rechaza('INSERT INTO `a--` VALUES (BENCHMARK(99999999, MD5(1)))');
  });

  it('solo valores literales: números, NULL, textos, hex, _binary, x/b y la lista blanca', () => {
    for (const ok of [
      "INSERT INTO `t` VALUES (1,-2.5,1.5e-10,NULL,TRUE,'a',0x416E61,_binary 'x',x'41',b'01',_utf8mb4'é')",
      "INSERT INTO `t` (`a`, `b`) VALUES (1,'x'),(2,'y')",
      "INSERT INTO t VALUE (ST_GeomFromText('POINT(1 1)'), UNHEX('41'), FROM_BASE64('QQ=='))",
      "INSERT INTO `t` VALUES (1,'SLEEP(5); SELECT 1 -- /* x */')",
    ]) {
      expect(() => validarSentenciaDatos(ok), ok).not.toThrow();
    }
    for (const mal of [
      "INSERT INTO t VALUES (CONCAT('a','b'))",
      'INSERT INTO t VALUES (NOW())',
      'INSERT INTO t VALUES (@v)',
      'INSERT INTO t VALUES (1+1)',
      'INSERT INTO t VALUES (LOAD_FILE(0x41))',
      'INSERT INTO t VALUES (1) ON DUPLICATE KEY UPDATE a = 1',
      'INSERT INTO otra.t VALUES (1)',
      'INSERT INTO `otra`.`t` VALUES (1)',
      'INSERT INTO t VALUES (1) , (2) ; DROP TABLE t',
      'INSERT INTO t SET a = 1',
      'INSERT INTO t VALUES ((SELECT 1))',
    ]) {
      rechaza(mal);
    }
  });
});

describe('rutinas: SQL SECURITY solo en las características', () => {
  const o = { origen: 'importada' as const, definer: definerMysql(nombreDuenoMysql('tienda')) };
  it('la frase en el cuerpo no cuenta: la cabecera recibe INVOKER una vez', () => {
    const t = revisarSql(
      'CREATE PROCEDURE p() DETERMINISTIC BEGIN SET @a = 1 SQL SECURITY INVOKER END',
      'mysql',
      o,
    )[0]!.texto;
    expect(t).toMatch(
      /^CREATE DEFINER = \S+ PROCEDURE p\(\) SQL SECURITY INVOKER DETERMINISTIC BEGIN/,
    );
    expect(t.match(/SQL SECURITY INVOKER/g)).toHaveLength(2);
    const d = revisarSql(
      "CREATE FUNCTION f(a varchar(5) CHARSET utf8mb4) RETURNS varchar(10) CHARSET utf8mb4 SQL SECURITY DEFINER COMMENT 'SQL SECURITY DEFINER' RETURN a",
      'mysql',
      o,
    )[0]!.texto;
    expect(d).toContain(
      "CHARSET utf8mb4 SQL SECURITY INVOKER COMMENT 'SQL SECURITY DEFINER' RETURN a",
    );
  });
});
