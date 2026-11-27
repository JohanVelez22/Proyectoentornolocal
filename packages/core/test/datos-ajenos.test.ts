import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { DivisorSentencias, validarSentenciaDatos } from '../src/bd/datosAjenos';

async function partir(texto: string, tamano: number): Promise<string[]> {
  const bytes = Buffer.from(texto, 'utf8');
  const trozos: Buffer[] = [];
  for (let i = 0; i < bytes.length; i += tamano) trozos.push(bytes.subarray(i, i + tamano));
  const salida: string[] = [];
  const d = Readable.from(trozos, { objectMode: false }).pipe(new DivisorSentencias());
  for await (const s of d as AsyncIterable<string>) salida.push(s);
  return salida;
}

const TEXTO = [
  '/*M!999999\\- enable the sandbox mode */',
  '-- comentario; con punto y coma',
  '# otro; comentario',
  "/* bloque; */ INSERT INTO `t;x` VALUES (1,'a;b\\';c',\"d;e\",'it''s;');",
  '/*!40101 SET NAMES utf8mb4 */;',
  "INSERT INTO t VALUES ('ñandú; 日本');",
  'INSERT INTO t VALUES (2)',
].join('\n');

const ESPERADO = [
  "INSERT INTO `t;x` VALUES (1,'a;b\\';c',\"d;e\",'it''s;')",
  '/*!40101 SET NAMES utf8mb4 */',
  "INSERT INTO t VALUES ('ñandú; 日本')",
  'INSERT INTO t VALUES (2)',
];

describe('DivisorSentencias', () => {
  it('parte por los ; fuera de cadenas, comentarios y comentarios ejecutables', async () => {
    expect(await partir(TEXTO, 1_000_000)).toEqual(ESPERADO);
  });

  it('da lo mismo con cualquier corte de trozos (incluso de un byte, en medio de un carácter)', async () => {
    for (const n of [1, 2, 3, 5, 7, 13])
      expect(await partir(TEXTO, n), `trozos de ${n}`).toEqual(ESPERADO);
  });

  it('un volcado que termina dentro de una cadena se rechaza', async () => {
    await expect(partir("INSERT INTO t VALUES ('abc", 4)).rejects.toMatchObject({
      codigo: 'bd.datos_no_permitidos',
    });
  });
});

describe('validarSentenciaDatos', () => {
  it('acepta INSERT y los SET de mysqldump, con o sin la envoltura condicional', () => {
    for (const ok of [
      "INSERT INTO `t` VALUES (1,'a')",
      'INSERT IGNORE INTO t VALUES (1)',
      "INSERT INTO t VALUES ('SLEEP(5) y SELECT dentro de un texto')",
      'INSERT INTO t (`sleep`, `select`) VALUES (1, 2)',
      '/*!40101 SET NAMES utf8mb4 */',
      'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
      "/*!40103 SET TIME_ZONE='+00:00' */",
      '/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */',
      "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO,STRICT_ALL_TABLES' */",
      '/*!40101 SET SQL_MODE=@OLD_SQL_MODE */',
      '/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */',
    ]) {
      expect(() => validarSentenciaDatos(ok), ok).not.toThrow();
    }
  });

  it('rechaza lo demás', () => {
    for (const mal of [
      'SET NAMES latin1',
      'SET NAMES gbk',
      'SET CHARACTER SET gbk',
      'SET character_set_client = utf8mb4',
      'SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_SERVER',
      'SET CHARACTER_SET_CLIENT=@OLD_SQL_MODE',
      'SET sql_mode=@m',
      "SET sql_mode='ANSI'",
      "SET sql_mode=CONCAT('NO_BACKSLASH', '_ESCAPES')",
      'SET autocommit=0',
      'SET STATEMENT a=1 FOR INSERT INTO t VALUES (1)',
      "SET TIME_ZONE='x; DROP TABLE t'",
      'SET @a=1',
      'SET NAMES utf8mb4; DROP TABLE t',
      '/*!50000 DROP TABLE t */',
      '/*!40101 SET NAMES utf8mb4 */ DROP TABLE t',
      'INSERT INTO t VALUES (SLEEP(1))',
      'INSERT INTO t VALUES (sleep (1))',
      'INSERT INTO t VALUES (1) ON DUPLICATE KEY UPDATE a = (SELECT 1)',
      'LOCK TABLES t WRITE',
      'UNLOCK TABLES',
      'CREATE TABLE t (a int)',
      '\\C gbk',
    ]) {
      expect(() => validarSentenciaDatos(mal), mal).toThrowError(
        expect.objectContaining({ codigo: 'bd.datos_no_permitidos' }),
      );
    }
  });
});
