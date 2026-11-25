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
const USUARIO_TMP = 'wolf_tmp_0123456789abcdef';

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
  "INSERT INTO `usuarios` VALUES (1,'Ana; DROP DATABASE x;'),(2,'linea\\nnueva -- no es comentario');",
  '/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;',
].join('\n');

let dir: string;
let rutas: Rutas;
let esquema: string;
let datos: string;
let eventos: string[];
let privilegios: string[];
let consultas: { puerto: number; usuario: string; sql: string; charset?: string }[];
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
let fallaConsulta: RegExp | null;
let alConsulta: ((sql: string) => void) | null;
let tamanoOrigen: number;
/** Cómo responde el volcado: por omisión escribe el archivo y termina. */
let comportamientoVolcado: (
  destino: string,
  args: string[],
  senal: AbortSignal | undefined,
) => Promise<void> | void;

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

function volcadoNormal(destino: string, args: string[]): void {
  if (args.includes('--no-data')) writeFileSync(destino, esquema);
  else if (args.includes('--no-create-info')) writeFileSync(destino, datos);
  else {
    // Respaldo de seguridad de la base local que se reemplaza.
    respaldosHechos++;
    writeFileSync(destino, '-- MySQL dump\nCREATE TABLE previa (id int);\n');
  }
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
      await comportamientoVolcado(r.slice('--result-file='.length), args, opts?.senal);
      return { codigo: 0 };
    }
    // El cliente `mysql` solo se usa para volver a poner el respaldo previo.
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
      usuarioTemporal: async (_o: string, base: string, p?: string) => {
        eventos.push(`usuario:${base}`);
        privilegios.push(p ?? 'todos');
        return {
          usuario: USUARIO_TMP,
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
      mysql: (async (c: { puerto: number; usuario: string; charset?: string }) => {
        if (c.puerto === PUERTO_ORIGEN && origenApagado) throw new Error('connect ECONNREFUSED');
        return {
          query: async (sql: string) => {
            consultas.push({
              puerto: c.puerto,
              usuario: c.usuario,
              sql,
              ...(c.charset ? { charset: c.charset } : {}),
            });
            if (/^DROP DATABASE/.test(sql)) eventos.push('borrar-base');
            alConsulta?.(sql);
            if (fallaConsulta?.test(sql)) throw new Error(`ERROR 1064 con ${TEMPORAL}`);
            return [[{ v: versionOrigen, version: versionOrigen, b: tamanoOrigen }]];
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

const delUsuarioDeDatos = (): string[] =>
  consultas.filter((c) => c.usuario === USUARIO_TMP && c.charset === 'utf8mb4').map((c) => c.sql);

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
  privilegios = [];
  consultas = [];
  lanzados = [];
  tablas = false;
  codigoCliente = 0;
  versionOrigen = '8.0.30';
  origenApagado = false;
  respaldosHechos = 0;
  fallaConsulta = null;
  alConsulta = null;
  tamanoOrigen = 0;
  comportamientoVolcado = volcadoNormal;
});

describe('Respaldos.importarAjeno', () => {
  it('estructura revisada y datos con un usuario que solo inserta, una sentencia por consulta', async () => {
    const r = await armar().importarAjeno('mysql', origen, 'tienda');
    expect(r.advertencias).toEqual([]);
    const [dEsquema, dDatos] = lanzados;
    expect(dEsquema!.args).toEqual(expect.arrayContaining(['--no-data', '--single-transaction']));
    expect(dEsquema!.env.MYSQL_PWD).toBe(ORIGEN);
    expect(dDatos!.args).toEqual(
      expect.arrayContaining([
        '--no-create-info',
        '--skip-triggers',
        '--hex-blob',
        '--skip-add-locks',
        '--skip-disable-keys',
      ]),
    );
    expect(dDatos!.args).not.toContain('--routines');
    // Los datos ya no pasan por el cliente de línea de comandos.
    expect(lanzados).toHaveLength(2);
    // El usuario de datos solo puede INSERT (y el de estructura, lo suyo).
    expect(privilegios).toEqual(['todos', 'datos']);
    const datosEnviados = delUsuarioDeDatos();
    expect(datosEnviados).toEqual(
      expect.arrayContaining([
        'USE `tienda`',
        "SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO'",
        'SET NAMES utf8mb4',
      ]),
    );
    const inserts = datosEnviados.filter((s) => s.startsWith('INSERT'));
    expect(inserts).toEqual([
      "INSERT INTO `usuarios` VALUES (1,'Ana; DROP DATABASE x;'),(2,'linea\\nnueva -- no es comentario')",
    ]);
    // Cada consulta lleva una sola sentencia (un `;` fuera de cadenas no llega al servidor).
    for (const c of consultas)
      expect(c.sql.replace(/'(?:[^'\\]|\\.)*'/g, '').includes(';')).toBe(false);
    expect(JSON.stringify(consultas.filter((c) => c.usuario === USUARIO_TMP))).not.toContain(ADMIN);
    // Vistas y rutinas: DEFINER de la cuenta bloqueada, nunca root.
    const vistas = consultas.filter((c) => /CREATE.*VIEW/i.test(c.sql));
    expect(vistas).toHaveLength(2);
    for (const v of vistas) {
      expect(v.usuario).toBe('root');
      expect(v.sql).toMatch(
        /DEFINER = `wolf_dueno_[0-9a-f]{12}`@`localhost` SQL SECURITY INVOKER VIEW/,
      );
    }
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
  });

  it('un SQL de estructura fuera de la lista se rechaza antes de crear la base', async () => {
    esquema = "CREATE TABLE t (a int);\nGRANT ALL ON *.* TO 'x'@'%';";
    await expect(armar().importarAjeno('mysql', origen, 'tienda')).rejects.toMatchObject({
      codigo: 'bd.sql_no_permitido',
    });
    expect(eventos).toEqual([]);
  });

  describe('los datos solo pueden ser datos (se validan enteros antes de tocar nada)', () => {
    const insert = "INSERT INTO `usuarios` VALUES (1,'a')";
    const casos: [string, string][] = [
      ['GRANT', "GRANT ALL ON *.* TO 'x'@'%';"],
      ['CREATE USER', "CREATE USER 'x'@'%';"],
      ['LOAD DATA', "LOAD DATA INFILE 'x' INTO TABLE usuarios;"],
      ['SELECT INTO OUTFILE', "SELECT 'x' INTO OUTFILE 'C:/x.txt';"],
      ['DELIMITER', 'DELIMITER ;;'],
      ['LOCK TABLES (el usuario de datos no lo tiene)', 'LOCK TABLES `usuarios` WRITE;'],
      ['ALTER TABLE', 'ALTER TABLE `usuarios` DISABLE KEYS;'],
      ['REPLACE', "REPLACE INTO `usuarios` VALUES (1,'a');"],
      ['SET GLOBAL', 'SET GLOBAL local_infile = 1;'],
      ['SET SQL_LOG_BIN', 'SET @@SESSION.SQL_LOG_BIN= 0;'],
      ['SET autocommit', 'SET autocommit = 0;'],
      ['SET sql_mode con una variable', 'SET sql_mode=@m;'],
      ['SET sql_mode NO_BACKSLASH_ESCAPES', "SET sql_mode='NO_BACKSLASH_ESCAPES';"],
      ['SET sql_mode ANSI_QUOTES', "SET SQL_MODE = 'ANSI_QUOTES,STRICT_ALL_TABLES';"],
      ['SET NAMES gbk', 'SET NAMES gbk;'],
      ['SET character_set_client', 'SET character_set_client = gbk;'],
      [
        'SET character_set_client desde otra variable',
        'SET @OLD_CHARACTER_SET_CLIENT=@@character_set_server;',
      ],
      [
        'SET STATEMENT … FOR CREATE TRIGGER',
        'SET STATEMENT max_statement_time=1 FOR CREATE TRIGGER t BEFORE INSERT ON usuarios FOR EACH ROW SET NEW.id=1;',
      ],
      ['SET en un comentario ejecutable con otra cosa', '/*!40101 SET NAMES gbk */;'],
      ['comando del cliente \\C', '\\C gbk'],
      ['comando del cliente \\!', '\\! calc'],
      ['otra sentencia en la misma línea', `${insert}; DROP TABLE usuarios;`],
      ['otra sentencia sin ; final', `${insert}; DROP TABLE usuarios`],
      ['comentario que esconde la sentencia', '/* x */ DROP TABLE usuarios;'],
      [
        'sentencia tras el cierre de un INSERT de varias líneas',
        "INSERT INTO `usuarios` VALUES (1,\n'a'); DROP TABLE usuarios;",
      ],
      ['SLEEP en el código', "INSERT INTO `usuarios` VALUES (SLEEP(9999),'a');"],
      ['BENCHMARK en el código', 'INSERT INTO `usuarios` VALUES (BENCHMARK(99999999, MD5(1)),1);'],
      ['GET_LOCK en el código', "INSERT INTO `usuarios` VALUES (GET_LOCK('x', 9999),1);"],
      ['INSERT … SELECT', 'INSERT INTO `usuarios` SELECT * FROM otra.t;'],
      // gbk: `\xbf\'` se come la barra y deja la comilla libre; aquí no hay gbk posible (utf8mb4
      // fijo y NAMES solo utf8mb4), así que el texto se lee como UTF-8 y la comilla queda cerrada.
    ];
    it.each(casos)('rechaza %s', async (_n, sql) => {
      datos = `${DATOS}\n${sql}\n`;
      await expect(armar().importarAjeno('mysql', origen, 'tienda')).rejects.toMatchObject({
        codigo: 'bd.datos_no_permitidos',
      });
      // Nada se creó, respaldó ni borró, y ningún dato llegó al servidor.
      expect(eventos).toEqual([]);
      expect(delUsuarioDeDatos()).toEqual([]);
    });

    it('el truco del gbk (barra + comilla tras un byte alto) no abre una sentencia nueva', async () => {
      // Con utf8mb4 el byte 0xBF no se funde con la barra: la comilla queda escapada y la cadena
      // sigue; la sentencia siguiente es otra, validada por su cuenta.
      datos = `${DATOS}\nINSERT INTO \`usuarios\` VALUES (1,'\u00bf\\' OR 1=1; DROP TABLE usuarios; -- ');\n`;
      await armar().importarAjeno('mysql', origen, 'tienda');
      const inserts = delUsuarioDeDatos().filter((s) => s.startsWith('INSERT'));
      expect(inserts).toHaveLength(2);
      expect(inserts[1]).toContain('DROP TABLE usuarios');
      expect(delUsuarioDeDatos().filter((s) => /^DROP/i.test(s))).toEqual([]);
    });

    it('un cambio de base (USE, DROP DATABASE) en comentarios ya no llega al servidor', async () => {
      datos = `${DATOS}\n-- DROP DATABASE tienda;\n/* USE mysql; */\n`;
      await armar().importarAjeno('mysql', origen, 'tienda');
      expect(consultas.map((c) => c.sql).join('\n')).not.toMatch(/DROP DATABASE tienda|USE mysql/);
    });

    it('en una línea larguísima, lo que sigue al cierre del INSERT también se rechaza', async () => {
      const relleno = 'x'.repeat(3 * 1024 * 1024);
      datos = `INSERT INTO \`usuarios\` VALUES (1,'${relleno}'); DROP TABLE usuarios;\n`;
      await expect(armar().importarAjeno('mysql', origen, 'tienda')).rejects.toMatchObject({
        codigo: 'bd.datos_no_permitidos',
      });
      datos = `INSERT INTO \`usuarios\` VALUES (1,'${relleno}');\n`;
      await armar().importarAjeno('mysql', origen, 'tienda');
    });

    it('acepta cadenas con ; saltos de línea y palabras de SQL dentro de los datos', async () => {
      datos = [
        "INSERT INTO `usuarios` VALUES (1,'DROP DATABASE x; SELECT SLEEP(9)'),",
        "(2,'cinco\nlineas -- ; /* \nmas');",
      ].join('\n');
      await armar().importarAjeno('mysql', origen, 'tienda');
      expect(eventos).not.toContain('reiniciar:tienda');
      expect(delUsuarioDeDatos().filter((s) => s.startsWith('INSERT'))).toHaveLength(1);
    });

    it('acepta el encabezado y el pie reales de mysqldump y de MariaDB, también con fin de línea de Windows', async () => {
      datos = [
        '/*M!999999\\- enable the sandbox mode */ ',
        '-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)',
        '--',
        '-- Host: 127.0.0.1    Database: tienda',
        '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;',
        '/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;',
        '/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;',
        '/*!40101 SET NAMES utf8mb4 */;',
        '/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;',
        "/*!40103 SET TIME_ZONE='+00:00' */;",
        '/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;',
        '/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;',
        "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;",
        '/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;',
        'INSERT INTO `usuarios` VALUES (1,0x416E61);',
        '/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;',
        '/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;',
        '/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;',
        '/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;',
        '/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;',
        '/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;',
        '/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;',
        '/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;',
        '-- Dump completed on 2026-11-24 21:00:00',
      ].join('\r\n');
      await armar().importarAjeno('mysql', origen, 'tienda');
      expect(eventos).not.toContain('reiniciar:tienda');
    });
  });

  it('un error del servidor al cargar reinicia la base (todo o nada) sin mostrar claves', async () => {
    fallaConsulta = /^INSERT/;
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
    fallaConsulta = /^INSERT/;
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

  it('con confirmación: respaldo previo y, si falla, la base original se restaura sola', async () => {
    tablas = true;
    fallaConsulta = /^INSERT/;
    const e = await armar()
      .importarAjeno('mysql', origen, 'tienda', { confirmarSobrescribir: true })
      .catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErrorTrasReemplazo);
    expect((e as ErrorTrasReemplazo).restaurada).toBe(true);
    expect(respaldosHechos).toBe(1);
    // El respaldo previo es un volcado completo de la base local; después se vuelve a poner.
    const previo = lanzados.find(
      (l) =>
        l.cmd.includes('dump') &&
        !l.args.includes('--no-data') &&
        !l.args.includes('--no-create-info'),
    );
    expect(previo!.args).toContain('--port=3306');
    expect(previo!.args).toContain('tienda');
    const cliente = lanzados.find((l) => !l.cmd.includes('dump'));
    expect(cliente!.entrada).toContain('CREATE TABLE previa');
    expect(eventos.indexOf('reiniciar:tienda')).toBeLessThan(eventos.indexOf('cliente'));
  });

  it('si ni el respaldo se puede volver a poner, el error nombra el respaldo', async () => {
    tablas = true;
    fallaConsulta = /^INSERT/;
    codigoCliente = 1;
    const e = await armar()
      .importarAjeno('mysql', origen, 'tienda', { confirmarSobrescribir: true })
      .catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErrorTrasReemplazo);
    expect((e as ErrorTrasReemplazo).restaurada).toBe(false);
    expect((e as Error).message).toContain((e as ErrorTrasReemplazo).respaldoPrevio);
  });

  it('una base que existe sin tablas también se respalda antes de reemplazarla', async () => {
    tablas = false;
    await armar().importarAjeno('mysql', origen, 'tienda', {
      confirmarSobrescribir: true,
      baseExistente: true,
    });
    expect(respaldosHechos).toBe(1);
    await expect(
      armar().importarAjeno('mysql', origen, 'tienda', { baseExistente: true }),
    ).rejects.toThrow(/ya tiene tablas|sobrescribirla/);
  });

  it('los datos que no pasan la validación no llegan a respaldar ni a borrar la base existente', async () => {
    tablas = true;
    datos = `${DATOS}\nDROP DATABASE tienda;\nGRANT ALL ON *.* TO x;\n`;
    await expect(
      armar().importarAjeno('mysql', origen, 'tienda', { confirmarSobrescribir: true }),
    ).rejects.toMatchObject({ codigo: 'bd.datos_no_permitidos' });
    expect(respaldosHechos).toBe(0);
    expect(eventos).toEqual([]);
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

  it('un volcado que falla da un error con código propio y sin la clave', async () => {
    comportamientoVolcado = () => {
      throw new Error(`mysqldump: Got error: 2013 (${ORIGEN})`);
    };
    const e = await armar()
      .importarAjeno('mysql', origen, 'tienda')
      .catch((x: unknown) => x);
    expect(e).toMatchObject({ codigo: 'importar.origen_fallo' });
    expect(String((e as Error).message)).not.toContain(ORIGEN);
  });

  it('una clave con caracteres que no son ASCII se rechaza con un error claro', async () => {
    await expect(
      armar().importarAjeno('mysql', { ...origen, clave: 'contraseña' }, 'tienda'),
    ).rejects.toMatchObject({ codigo: 'importar.clave_no_ascii' });
    expect(eventos).toEqual([]);
  });

  it('un origen que no es local se rechaza', async () => {
    await expect(
      armar().importarAjeno('mysql', { ...origen, host: '10.0.0.5' }, 'tienda'),
    ).rejects.toMatchObject({ codigo: 'importar.origen_no_local' });
    expect(lanzados).toEqual([]);
  });

  describe('vigilancia del volcado', () => {
    const esperarAborto = (senal: AbortSignal | undefined): Promise<never> =>
      new Promise((_r, rechazar) => {
        const a = (): void => rechazar(senal!.reason);
        if (senal!.aborted) a();
        else senal!.addEventListener('abort', a, { once: true });
      });

    it('un volcado que pasa del tope mientras se escribe se corta', async () => {
      comportamientoVolcado = async (destino, args, senal) => {
        if (!args.includes('--no-create-info')) return volcadoNormal(destino, args);
        writeFileSync(destino, 'x'.repeat(1000));
        await esperarAborto(senal);
      };
      await expect(
        armar({
          maxBytesDatosAjenos: 100,
          vigilancia: { intervaloMs: 5, estancamientoMs: 60_000 },
        }).importarAjeno('mysql', origen, 'tienda'),
      ).rejects.toMatchObject({ codigo: 'importar.volcado_enorme' });
      expect(eventos).toEqual([]);
    });

    it('un volcado que no avanza (origen que no responde) se corta', async () => {
      comportamientoVolcado = async (_d, _a, senal) => esperarAborto(senal);
      await expect(
        armar({ vigilancia: { intervaloMs: 5, estancamientoMs: 40 } }).importarAjeno(
          'mysql',
          origen,
          'tienda',
        ),
      ).rejects.toMatchObject({ codigo: 'importar.origen_estancado' });
      expect(eventos).toEqual([]);
    });

    it('cancelar corta el volcado y deja todo como estaba', async () => {
      const ac = new AbortController();
      comportamientoVolcado = async (_d, _a, senal) => {
        setTimeout(() => ac.abort(), 10);
        await esperarAborto(senal);
      };
      await expect(
        armar().importarAjeno('mysql', origen, 'tienda', { senal: ac.signal }),
      ).rejects.toMatchObject({ codigo: 'importar.cancelado' });
      expect(eventos).toEqual([]);
      expect(readdirSync(rutas.tmp())).toEqual([]);
    });

    it('cancelar durante la carga de datos reinicia la base', async () => {
      const ac = new AbortController();
      alConsulta = (sql) => {
        if (sql.startsWith('INSERT')) ac.abort();
      };
      await expect(
        armar().importarAjeno('mysql', origen, 'tienda', { senal: ac.signal }),
      ).rejects.toMatchObject({ codigo: 'importar.cancelado' });
      expect(eventos).toContain('reiniciar:tienda');
      sinUsuariosPendientes();
    });
  });

  it('un volcado de datos mayor que el tope se rechaza antes de tocar nada', async () => {
    await expect(
      armar({ maxBytesDatosAjenos: 10 }).importarAjeno('mysql', origen, 'tienda'),
    ).rejects.toMatchObject({ codigo: 'importar.volcado_enorme' });
    expect(eventos).toEqual([]);
  });

  it('si el origen dice que la base pesa más que el tope, ni se empieza a volcar', async () => {
    tamanoOrigen = 5 * 1024 * 1024;
    await expect(
      armar({ maxBytesDatosAjenos: 1024 * 1024 }).importarAjeno('mysql', origen, 'tienda'),
    ).rejects.toMatchObject({ codigo: 'importar.volcado_enorme' });
    expect(lanzados).toEqual([]);
  });

  it('sin espacio libre suficiente no se empieza (el doble si hay que respaldar)', async () => {
    tamanoOrigen = 500 * 1024 * 1024;
    await expect(
      armar({ espacioLibre: async () => 100 * 1024 * 1024 }).importarAjeno(
        'mysql',
        origen,
        'tienda',
      ),
    ).rejects.toMatchObject({ codigo: 'importar.sin_espacio' });
    expect(lanzados).toEqual([]);
    // Con espacio de sobra sigue.
    await armar({ espacioLibre: async () => 10 * 1024 * 1024 * 1024 }).importarAjeno(
      'mysql',
      origen,
      'tienda',
    );
  });

  it('el temporal de la importación se borra siempre', async () => {
    fallaConsulta = /^INSERT/;
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
