import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorTrasReemplazo, Respaldos, type DepsRespaldos } from '../src/bd/respaldos';
import { revisarSql } from '../src/bd/sqlPermitido';
import type { Ejecutor, Lanzador } from '../src/plataforma/tipos';
import { nombreEjecutable } from '../src/plataforma/sistema';
import { Rutas } from '../src/rutas';
import type { EstadoServicio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const ADMIN = 'ClaveAdmin#1';
const TEMPORAL = 'ClaveTmp#2';
const ORIGEN = 'centinela-origen-d15';
const PUERTO_ORIGEN = 3399;

const ESQUEMA = [
  '-- MySQL dump 10.13',
  '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;',
  '/*!50503 SET NAMES utf8mb4 */;',
  'DROP TABLE IF EXISTS `usuarios`;',
  'CREATE TABLE `usuarios` (`id` int NOT NULL AUTO_INCREMENT, `nombre` varchar(40), PRIMARY KEY (`id`));',
  'DROP TEMPORARY TABLE IF EXISTS `v_usuarios`;',
  '/*!50001 DROP VIEW IF EXISTS `v_usuarios`*/;',
  '/*!50001 CREATE VIEW `v_usuarios` AS SELECT 1 AS `id`*/;',
  '/*!50001 DROP VIEW IF EXISTS `v_usuarios`*/;',
  '/*!50001 CREATE ALGORITHM=UNDEFINED */ /*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */ /*!50001 VIEW `v_usuarios` AS select `usuarios`.`id` AS `id` from `usuarios` */;',
].join('\n');

const DATOS = [
  '-- MySQL dump 10.13',
  "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;",
  '/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;',
  'LOCK TABLES `usuarios` WRITE;',
  "INSERT INTO `usuarios` VALUES (1,'Ana; DROP DATABASE x;'),(2,'linea\\nnueva -- no es comentario');",
  'UNLOCK TABLES;',
  '/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;',
].join('\n');

let dir: string;
let rutas: Rutas;
let esquema: string;
let datos: string;
let eventos: string[];
let consultas: { puerto: number; usuario: string; sql: string }[];
let lanzados: {
  cmd: string;
  args: string[];
  env: Record<string, string>;
  entrada: string | null;
}[];
let tablas: boolean;
let codigoCliente: number;
let versionOrigen: string;
let origenApagado: boolean;
let respaldosHechos: number;

const estado = (id: string, version: string, puerto: number): EstadoServicio =>
  ({ id, nombre: id, version, estado: 'encendido', puertos: [puerto], pid: 1 }) as EstadoServicio;

function crearArchivo(rel: string): void {
  const p = path.join(rutas.base, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, '');
}

async function leer(s: Readable): Promise<string> {
  const partes: Buffer[] = [];
  for await (const p of s) partes.push(Buffer.from(p as Buffer));
  return Buffer.concat(partes).toString('utf8');
}

function armar(extra: Partial<DepsRespaldos> = {}): Respaldos {
  const exec: Ejecutor = async (_cmd, args) => ({
    codigo: 0,
    stdout: args.includes('--version')
      ? 'mysqldump  Ver 8.4.3 for Win64 on x86_64 (MySQL Community Server - GPL)'
      : '',
    stderr: '',
  });
  const lanzar: Lanzador = async (cmd, args, opts) => {
    const entrada = opts?.entrada ? await leer(opts.entrada as Readable) : null;
    lanzados.push({ cmd, args, env: (opts?.env ?? {}) as Record<string, string>, entrada });
    const r = args.find((a) => a.startsWith('--result-file='));
    if (cmd.includes('dump') && r) {
      const destino = r.slice('--result-file='.length);
      if (args.includes('--no-data')) writeFileSync(destino, esquema);
      else if (args.includes('--no-create-info')) writeFileSync(destino, datos);
      else {
        // Respaldo de seguridad de la base local que se reemplaza.
        respaldosHechos++;
        writeFileSync(destino, '-- MySQL dump\nCREATE TABLE previa (id int);\n');
      }
      return { codigo: 0 };
    }
    eventos.push('cliente');
    return { codigo: codigoCliente };
  };
  const deps: DepsRespaldos = {
    bd: {
      conexion: async () => ({
        host: '127.0.0.1' as const,
        puerto: 3306,
        usuario: 'root',
        clave: ADMIN,
      }),
      crear: async (_m: string, base: string) => {
        eventos.push(`crear:${base}`);
        tablas = false;
        return { usuarioActualizado: false };
      },
      tieneTablas: async () => tablas,
      usuarioTemporal: async (_o: string, base: string) => {
        eventos.push(`usuario:${base}`);
        return {
          usuario: 'wolf_tmp_0123456789abcdef',
          clave: TEMPORAL,
          retirar: async () => void eventos.push('retirar'),
        };
      },
      reiniciarBase: async (_o: string, base: string) => void eventos.push(`reiniciar:${base}`),
    } as never,
    servicios: { estados: async () => [estado('mysql', '8.4.3', 3306)] },
    rutas,
    exec,
    lanzar,
    plataforma: { carpetaDocumentos: async () => dir },
    fabricas: {
      mysql: (async (c: { puerto: number; usuario: string }) => {
        if (c.puerto === PUERTO_ORIGEN && origenApagado) throw new Error('connect ECONNREFUSED');
        return {
          query: async (sql: string) => {
            consultas.push({ puerto: c.puerto, usuario: c.usuario, sql });
            if (/^DROP DATABASE/.test(sql)) eventos.push('borrar-base');
            return [[{ v: versionOrigen, version: versionOrigen }]];
          },
          end: async () => undefined,
        };
      }) as never,
    },
    ...extra,
  };
  return new Respaldos(deps);
}

/** Cada usuario temporal que se creó se retiró. */
function sinUsuariosPendientes(): void {
  const creados = eventos.filter((e) => e.startsWith('usuario:')).length;
  expect(creados).toBeGreaterThan(0);
  expect(eventos.filter((e) => e === 'retirar')).toHaveLength(creados);
}

const origen = {
  host: '127.0.0.1',
  puerto: PUERTO_ORIGEN,
  usuario: 'root',
  clave: ORIGEN,
  base: 'Tienda',
};

beforeEach(async () => {
  dir = await carpetaTemporal('pel-impajeno-');
  rutas = new Rutas(path.join(dir, 'base'));
  crearArchivo(`bin/mysql/8.4.3/bin/${nombreEjecutable('mysql')}`);
  crearArchivo(`bin/mysql/8.4.3/bin/${nombreEjecutable('mysqldump')}`);
  esquema = ESQUEMA;
  datos = DATOS;
  eventos = [];
  consultas = [];
  lanzados = [];
  tablas = false;
  codigoCliente = 0;
  versionOrigen = '8.0.30';
  origenApagado = false;
  respaldosHechos = 0;
});

describe('Respaldos.importarAjeno', () => {
  it('estructura con la lista de SQL permitido y datos con el usuario limitado, sin la clave del administrador', async () => {
    const r = await armar().importarAjeno('mysql', origen, 'tienda');
    expect(r.advertencias).toEqual([]);
    const [dEsquema, dDatos, cliente] = lanzados;
    expect(dEsquema!.args).toEqual(expect.arrayContaining(['--no-data', '--single-transaction']));
    expect(dEsquema!.env.MYSQL_PWD).toBe(ORIGEN);
    expect(dDatos!.args).toEqual(
      expect.arrayContaining(['--no-create-info', '--skip-triggers', '--hex-blob']),
    );
    expect(dDatos!.args).not.toContain('--routines');
    // Los datos entran con el usuario temporal (no el administrador) y sin --force.
    expect(cliente!.args).toEqual(
      expect.arrayContaining([
        '--user=wolf_tmp_0123456789abcdef',
        '--binary-mode',
        '--local-infile=0',
      ]),
    );
    expect(cliente!.args).not.toContain('--force');
    expect(cliente!.args.at(-1)).toBe('tienda');
    expect(cliente!.env.MYSQL_PWD).toBe(TEMPORAL);
    expect(cliente!.entrada).toContain("INSERT INTO `usuarios` VALUES (1,'Ana; DROP DATABASE x;')");
    expect(JSON.stringify(cliente)).not.toContain(ADMIN);
    expect(JSON.stringify(cliente)).not.toContain(ORIGEN);
    // La estructura va por consultas del usuario temporal; las vistas, con el administrador.
    const delTemporal = consultas.filter((c) => c.usuario === 'wolf_tmp_0123456789abcdef');
    expect(delTemporal.some((c) => c.sql.startsWith('CREATE TABLE `usuarios`'))).toBe(true);
    expect(delTemporal.some((c) => /CREATE.*VIEW/i.test(c.sql))).toBe(false);
    const vistas = consultas.filter((c) => /CREATE.*VIEW/i.test(c.sql) && c.usuario === 'root');
    expect(vistas.length).toBe(2);
    expect(
      vistas.every((c) => /OR REPLACE/i.test(c.sql) && /SQL SECURITY INVOKER/i.test(c.sql)),
    ).toBe(true);
    expect(eventos.at(-1)).toBe('retirar');
  });

  it('un disparador en el origen no se aplica: nada se crea ni se toca', async () => {
    esquema = [
      'CREATE TABLE `t` (`id` int);',
      'DELIMITER ;;',
      '/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg` BEFORE INSERT ON `t` FOR EACH ROW SET NEW.id = 1 */;;',
      'DELIMITER ;',
    ].join('\n');
    await expect(armar().importarAjeno('mysql', origen, 'tienda')).rejects.toMatchObject({
      codigo: 'bd.sql_no_permitido',
    });
    expect(eventos).toEqual([]);
    expect(lanzados.filter((l) => !l.cmd.includes('dump'))).toEqual([]);
  });

  it('un SQL de estructura fuera de la lista se rechaza antes de crear la base', async () => {
    esquema = "CREATE TABLE t (a int);\nGRANT ALL ON *.* TO 'x'@'%';";
    await expect(armar().importarAjeno('mysql', origen, 'tienda')).rejects.toMatchObject({
      codigo: 'bd.sql_no_permitido',
    });
    expect(eventos).toEqual([]);
  });

  describe('los datos solo pueden ser datos', () => {
    const casos: [string, string][] = [
      ['GRANT', "GRANT ALL ON *.* TO 'x'@'%';"],
      ['CREATE USER', "CREATE USER 'x'@'%';"],
      ['LOAD DATA', "LOAD DATA INFILE 'x' INTO TABLE usuarios;"],
      ['SELECT INTO OUTFILE', "SELECT 'x' INTO OUTFILE 'C:/x.txt';"],
      ['DELIMITER', 'DELIMITER ;;'],
      ['SET GLOBAL', 'SET GLOBAL local_infile = 1;'],
      ['SET SQL_LOG_BIN', 'SET @@SESSION.SQL_LOG_BIN= 0;'],
      ['DROP TABLE', 'DROP TABLE usuarios;'],
      [
        'otra sentencia en la misma línea',
        "INSERT INTO `usuarios` VALUES (1,'a'); DROP TABLE usuarios;",
      ],
      ['otra sentencia sin ; final', "INSERT INTO `usuarios` VALUES (1,'a'); DROP TABLE usuarios"],
      ['comentario que esconde la sentencia', '/* x */ DROP TABLE usuarios;'],
      [
        'sentencia tras el cierre de un INSERT de varias líneas',
        "INSERT INTO `usuarios` VALUES (1,\n'a'); DROP TABLE usuarios;",
      ],
    ];
    it.each(casos)('rechaza %s, deja la base vacía y retira el usuario', async (_n, sql) => {
      datos = `${DATOS}\n${sql}\n`;
      await expect(armar().importarAjeno('mysql', origen, 'tienda')).rejects.toMatchObject({
        codigo: 'bd.datos_no_permitidos',
      });
      expect(eventos).toContain('reiniciar:tienda');
      sinUsuariosPendientes();
    });

    it('un cambio de base (USE, DROP DATABASE) queda comentado, no se ejecuta, y se avisa', async () => {
      datos = `${DATOS}
DROP DATABASE tienda;
USE mysql;
`;
      const r = await armar().importarAjeno('mysql', origen, 'tienda');
      expect(lanzados.at(-1)!.entrada).toContain('-- DROP DATABASE tienda;');
      expect(lanzados.at(-1)!.entrada).toContain('-- USE mysql;');
      expect(r.advertencias.length).toBeGreaterThan(0);
    });

    it('en una línea larguísima, lo que sigue al cierre del INSERT también se rechaza', async () => {
      const relleno = 'x'.repeat(3 * 1024 * 1024);
      datos = `INSERT INTO \`usuarios\` VALUES (1,'${relleno}'); DROP TABLE usuarios;
`;
      await expect(armar().importarAjeno('mysql', origen, 'tienda')).rejects.toMatchObject({
        codigo: 'bd.datos_no_permitidos',
      });
      datos = `INSERT INTO \`usuarios\` VALUES (1,'${relleno}');
`;
      await armar().importarAjeno('mysql', origen, 'tienda');
    });

    it('acepta cadenas con ; saltos de línea y palabras de SQL dentro de los datos', async () => {
      datos = [
        'LOCK TABLES `usuarios` WRITE;',
        "INSERT INTO `usuarios` VALUES (1,'DROP DATABASE x; SELECT SLEEP(9)'),",
        "(2,'cinco\nlineas -- ; /* \nmas');",
        'UNLOCK TABLES;',
      ].join('\n');
      await armar().importarAjeno('mysql', origen, 'tienda');
      expect(eventos).not.toContain('reiniciar:tienda');
    });
  });

  it('un fallo del cliente reinicia la base (todo o nada) sin mostrar claves', async () => {
    codigoCliente = 1;
    const e = await armar()
      .importarAjeno('mysql', origen, 'tienda')
      .catch((x: unknown) => x);
    expect(e).toMatchObject({ codigo: 'bd.datos_fallo' });
    expect(String((e as Error).message)).not.toContain(ADMIN);
    expect(String((e as Error).message)).not.toContain(TEMPORAL);
    expect(eventos).toContain('reiniciar:tienda');
    sinUsuariosPendientes();
  });

  it('baseNueva: si falla, la base que se creó se borra en vez de quedar vacía', async () => {
    codigoCliente = 1;
    await expect(
      armar().importarAjeno('mysql', origen, 'tienda', { baseNueva: true }),
    ).rejects.toMatchObject({ codigo: 'bd.datos_fallo' });
    expect(eventos).toContain('borrar-base');
    expect(eventos).not.toContain('reiniciar:tienda');
  });

  it('base con tablas sin confirmar: no toca nada y no contacta al origen', async () => {
    tablas = true;
    await expect(armar().importarAjeno('mysql', origen, 'tienda')).rejects.toThrow(
      /ya tiene tablas/,
    );
    expect(consultas).toEqual([]);
    expect(lanzados).toEqual([]);
  });

  it('con confirmación: respaldo previo verificado y, si falla, el error nombra el respaldo', async () => {
    tablas = true;
    codigoCliente = 1;
    const p = armar().importarAjeno('mysql', origen, 'tienda', { confirmarSobrescribir: true });
    await expect(p).rejects.toBeInstanceOf(ErrorTrasReemplazo);
    expect(respaldosHechos).toBe(1);
    // El respaldo previo es un volcado completo de la base local que se reemplaza.
    const previo = lanzados.find(
      (l) =>
        !l.args.includes('--no-data') &&
        !l.args.includes('--no-create-info') &&
        l.cmd.includes('dump'),
    );
    expect(previo!.args).toContain('--port=3306');
    expect(previo!.args).toContain('tienda');
  });

  it('origen apagado: error con código, sin la clave, y nada se toca', async () => {
    origenApagado = true;
    const e = await armar()
      .importarAjeno('mysql', origen, 'tienda')
      .catch((x: unknown) => x);
    expect(e).toMatchObject({ codigo: 'importar.origen_apagado' });
    expect(String((e as Error).message)).not.toContain(ORIGEN);
    expect(eventos).toEqual([]);
  });

  it('un origen que no es local se rechaza', async () => {
    await expect(
      armar().importarAjeno('mysql', { ...origen, host: '10.0.0.5' }, 'tienda'),
    ).rejects.toMatchObject({ codigo: 'importar.origen_no_local' });
    expect(lanzados).toEqual([]);
  });

  it('un volcado de datos mayor que el tope se rechaza antes de tocar nada', async () => {
    await expect(
      armar({ maxBytesDatosAjenos: 10 }).importarAjeno('mysql', origen, 'tienda'),
    ).rejects.toMatchObject({ codigo: 'importar.volcado_enorme' });
    expect(eventos).toEqual([]);
  });

  it('el temporal de la importación se borra siempre', async () => {
    codigoCliente = 1;
    await armar()
      .importarAjeno('mysql', origen, 'tienda')
      .catch(() => undefined);
    expect(readdirSync(rutas.tmp())).toEqual([]);
  });
});

describe('sqlPermitido con vistas de mysqldump', () => {
  it('acepta DROP TEMPORARY TABLE IF EXISTS (marcador de las vistas)', () => {
    expect(revisarSql('DROP TEMPORARY TABLE IF EXISTS `v`;', 'mysql')).toHaveLength(1);
  });
});
