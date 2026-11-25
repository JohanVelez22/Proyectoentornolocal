import { randomBytes } from 'node:crypto';
import { createConnection } from 'mysql2/promise';
import { nombreDuenoMysql } from './sqlPermitido';
import { nombreTemporal, NOMBRE_TEMPORAL, temporalVencido } from './temporales';
import { ErrorWolf } from '../errores';

export interface ConexionMysql {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  /** Juego de caracteres de la conexión (la de importación fija utf8mb4). */
  charset?: string;
}

export interface BaseMysql {
  nombre: string;
  tamanoBytes: number;
}

/** Lo mínimo que se usa de una conexión mysql2 (permite inyectar una falsa en pruebas). */
export interface ConexionBaja {
  query(sql: string, params?: unknown[]): Promise<[unknown, ...unknown[]]>;
  end(): Promise<void>;
}

export type FabricaConexion = (c: ConexionMysql) => Promise<ConexionBaja>;

/** Nombres de base y de usuario válidos en MySQL y MariaDB. */
export const NOMBRE_BD_MYSQL = /^[A-Za-z0-9_]{1,64}$/;
const NOMBRE = NOMBRE_BD_MYSQL;
const SISTEMA = ['mysql', 'information_schema', 'performance_schema', 'sys'];
const USUARIOS_RESERVADOS = [
  'root',
  'mysql.sys',
  'mysql.session',
  'mysql.infoschema',
  'mariadb.sys',
];

function noSistema(nombre: string, verbo: 'borrar' | 'crear'): void {
  if (SISTEMA.includes(nombre.toLowerCase())) {
    throw new Error(`No se puede ${verbo} la base del sistema ${nombre}.`);
  }
}

/** Mensaje claro, sin el SQL ni claves, para un error de mysql2. */
function traducir(e: unknown, accion: string): Error {
  const codigo = (e as { code?: unknown } | null)?.code;
  const c = typeof codigo === 'string' ? codigo : '';
  let motivo = 'el servidor rechazó la operación';
  if (c === 'ER_DB_CREATE_EXISTS') motivo = 'la base ya existe';
  else if (c === 'ER_DB_DROP_EXISTS') motivo = 'la base no existe';
  else if (c.includes('ACCESS_DENIED') || c.includes('DBACCESS_DENIED'))
    motivo = 'permiso denegado';
  else if (c === 'ECONNREFUSED' || c === 'PROTOCOL_CONNECTION_LOST')
    motivo = 'se perdió la conexión con el servidor';
  return new Error(`No se pudo ${accion}: ${motivo}${c ? ` (${c})` : ''}.`);
}

/**
 * ¿Es una línea de `SHOW GRANTS` con privilegios globales? `GRANT USAGE ON *.*` (sin permisos) no
 * cuenta; cualquier otro permiso `ON *.*` (estático o dinámico, como SYSTEM_USER) o un PROXY sí.
 */
export function esPermisoGlobal(linea: unknown): boolean {
  if (typeof linea !== 'string') return false;
  const t = linea.trim();
  if (/^GRANT\s+PROXY\s+ON\s/i.test(t)) return true;
  const m = /^GRANT\s+(.+?)\s+ON\s+\*\.\*\s+TO\s/i.exec(t);
  if (!m) return false;
  return !/^USAGE$/i.test(m[1]!.trim()) || /WITH\s+GRANT\s+OPTION/i.test(t);
}

/** Un usuario que no se puede usar para un proyecto (el administrador, un rol del sistema…). */
export const errorUsuarioPrivilegiado = (usuario: string): ErrorWolf =>
  new ErrorWolf(
    'bd.usuario_privilegiado',
    `El usuario ${usuario} es un administrador o un rol del sistema: elija un usuario propio para el proyecto.`,
    { usuario },
  );

/** El rol existe pero no puede entrar (NOLOGIN, o pg_hba lo rechaza). */
export const errorRolSinLogin = (usuario: string): ErrorWolf =>
  new ErrorWolf(
    'bd.rol_sin_login',
    `El usuario ${usuario} existe pero no puede iniciar sesión (rol sin LOGIN o regla de acceso del servidor). No se cambió nada.`,
    { usuario },
  );

/**
 * El usuario ya existe y la clave pedida no es la suya: no se cambia (otro proyecto puede usarla).
 * Para cambiarla hay que pedirlo a propósito (`cambiarClave`).
 */
export const errorClaveDistinta = (usuario: string): ErrorWolf =>
  new ErrorWolf(
    'bd.usuario_clave_distinta',
    `El usuario ${usuario} ya existe con otra clave. Use su clave actual (no se cambia para no dejar sin conexión a otros proyectos) o elija "cambiar clave" a propósito.`,
    { usuario },
  );

/** Opciones de `crearBase`. */
export interface OpcionesCrearBaseMotor {
  usuario?: string;
  clave?: string;
  /** Solo con confirmación explícita: si el usuario ya existe, su clave pasa a ser `clave`. */
  cambiarClave?: boolean;
  /** Falla con `proyectos.base_existe` si la base ya existe (sin `IF NOT EXISTS`). */
  nueva?: boolean;
}

export interface ResultadoCrearBase {
  /** true si el usuario ya existía y su clave se cambió a la indicada. */
  usuarioActualizado: boolean;
  aviso?: string;
}

export function validarNombreBd(nombre: string): void {
  if (!NOMBRE.test(nombre)) {
    throw new Error(
      `El nombre "${nombre}" no es válido: use solo letras, números y guion bajo (hasta 64 caracteres).`,
    );
  }
}

const id = (nombre: string): string => {
  validarNombreBd(nombre);
  return `\`${nombre}\``;
};

const fabricaReal: FabricaConexion = async (c) =>
  (await createConnection({
    host: c.host,
    port: c.puerto,
    user: c.usuario,
    password: c.clave,
    connectTimeout: 10_000,
    // Una sola sentencia por consulta: un `;` de más da un error del servidor y no otra sentencia.
    multipleStatements: false,
    ...(c.charset ? { charset: c.charset } : {}),
  })) as unknown as ConexionBaja;

/** Administración básica de bases en MySQL o MariaDB. */
export class ClienteMysql {
  private con: ConexionBaja | null = null;
  private datos: ConexionMysql | null = null;

  constructor(private readonly fabrica: FabricaConexion = fabricaReal) {}

  async conectar(c: ConexionMysql): Promise<void> {
    await this.cerrar();
    try {
      this.con = await this.fabrica(c);
      this.datos = c;
    } catch (e) {
      // el mensaje de mysql2 no incluye la clave, pero se filtra por si acaso
      const m = e instanceof Error ? e.message : String(e);
      throw new Error(
        `No se pudo conectar al servidor en el puerto ${c.puerto}: ${m.split(c.clave).join('***')}`,
      );
    }
  }

  async cerrar(): Promise<void> {
    const c = this.con;
    this.con = null;
    this.datos = null;
    if (c) await c.end().catch(() => undefined);
  }

  private conexion(): ConexionBaja {
    if (!this.con) throw new Error('No hay conexión: conecte con el servidor primero.');
    return this.con;
  }

  private async filas(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
    const [r] = await this.conexion().query(sql, params);
    return Array.isArray(r) ? (r as Record<string, unknown>[]) : [];
  }

  async listarBases(): Promise<BaseMysql[]> {
    const marcas = SISTEMA.map(() => '?').join(',');
    const filas = await this.filas(
      'SELECT s.schema_name AS nombre, COALESCE(SUM(t.data_length + t.index_length), 0) AS tam ' +
        'FROM information_schema.schemata s ' +
        'LEFT JOIN information_schema.tables t ON t.table_schema = s.schema_name ' +
        `WHERE s.schema_name NOT IN (${marcas}) GROUP BY s.schema_name ORDER BY s.schema_name`,
      SISTEMA,
    );
    return filas.map((f) => ({ nombre: String(f.nombre), tamanoBytes: Number(f.tam) }));
  }

  /**
   * ¿Entra `usuario` con `clave`? Se prueba con una conexión breve. Un acceso denegado lanza
   * `bd.usuario_clave_distinta`; cualquier otro fallo, un error genérico (nunca se sigue).
   */
  private async comprobarClave(usuario: string, clave: string): Promise<void> {
    if (!this.datos) throw new Error('No hay conexión: conecte con el servidor primero.');
    let c: ConexionBaja;
    try {
      c = await this.fabrica({ ...this.datos, usuario, clave });
    } catch (e) {
      const codigo = String((e as { code?: unknown } | null)?.code ?? '');
      // Solo "acceso denegado" al autenticar es una clave distinta; cualquier otro código
      // (cuenta bloqueada, sin red…) es un error genérico.
      if (codigo === 'ER_ACCESS_DENIED_ERROR') throw errorClaveDistinta(usuario);
      throw new Error(
        `No se pudo comprobar la clave del usuario ${usuario}${codigo ? ` (${codigo})` : ''}; no se cambió nada.`,
      );
    }
    await c.end().catch(() => undefined);
  }

  async crearBase(nombre: string, opts: OpcionesCrearBaseMotor = {}): Promise<ResultadoCrearBase> {
    const bd = id(nombre);
    noSistema(nombre, 'crear');
    const { usuario, clave } = opts;
    if (usuario !== undefined) {
      validarNombreBd(usuario);
      if (USUARIOS_RESERVADOS.includes(usuario.toLowerCase())) {
        throw new Error(`El usuario "${usuario}" está reservado: elija otro nombre.`);
      }
      if (!clave) throw new Error('Indique una clave para el usuario de la base.');
      if (this.datos && usuario.toLowerCase() === this.datos.usuario.toLowerCase()) {
        throw errorUsuarioPrivilegiado(usuario);
      }
    }
    let claveCambiada = false;
    let existia = false;
    /** Cuentas (`usuario@host`) que ya tiene el usuario: los permisos van a esas. */
    let hostsExistentes: string[] = [];
    if (usuario !== undefined) {
      try {
        const f = await this.filas(
          'SELECT Host AS host, Super_priv AS super_priv, Grant_priv AS grant_priv FROM mysql.user WHERE User = ?',
          [usuario],
        );
        hostsExistentes = f
          .map((x) => x.host ?? x.Host)
          .filter((h): h is string => typeof h === 'string' && h !== '');
        existia = hostsExistentes.length > 0;
        // Como con rolsuper en PostgreSQL: la clave de una cuenta con privilegios globales
        // nunca se cambia desde aquí (podría ser la de otro administrador).
        if (existia && opts.cambiarClave) {
          if (f.some((x) => x.super_priv === 'Y' || x.grant_priv === 'Y')) {
            throw errorUsuarioPrivilegiado(usuario);
          }
          for (const host of hostsExistentes) {
            const grants = await this.filas('SHOW GRANTS FOR ?@?', [usuario, host]);
            if (grants.some((g) => Object.values(g).some(esPermisoGlobal))) {
              throw errorUsuarioPrivilegiado(usuario);
            }
          }
        }
      } catch (e) {
        if (e instanceof ErrorWolf) throw e;
        throw traducir(e, `crear la base ${nombre}`);
      }
      // Usuario existente: su clave no se toca salvo pedido explícito; antes de crear nada se
      // comprueba que la indicada sea la suya.
      if (existia && !opts.cambiarClave) await this.comprobarClave(usuario, clave!);
    }
    try {
      try {
        await this.filas(
          `CREATE DATABASE ${opts.nueva ? '' : 'IF NOT EXISTS '}${bd} CHARACTER SET utf8mb4`,
        );
      } catch (e) {
        // 1007 ER_DB_CREATE_EXISTS: otra creación simultánea (o una base que difiere en mayúsculas).
        if (
          opts.nueva &&
          /1007|database exists/i.test(`${(e as { code?: unknown }).code} ${String(e)}`)
        ) {
          throw new ErrorWolf('proyectos.base_existe', `La base ${nombre} ya existe.`, { nombre });
        }
        throw e;
      }
      if (usuario === undefined) return { usuarioActualizado: false };
      if (!existia) {
        for (const host of ['localhost', '127.0.0.1']) {
          await this.filas(`CREATE USER IF NOT EXISTS ?@'${host}' IDENTIFIED BY ?`, [
            usuario,
            clave,
          ]);
          await this.filas(`GRANT ALL PRIVILEGES ON ${bd}.* TO ?@'${host}'`, [usuario]);
        }
        return { usuarioActualizado: false };
      }
      // Usuario existente: permisos a SUS cuentas; no se crean otras (una 'app'@'localhost'
      // nueva taparía a la 'app'@'%' que ya usa el proyecto).
      for (const host of hostsExistentes) {
        await this.filas(`GRANT ALL PRIVILEGES ON ${bd}.* TO ?@?`, [usuario, host]);
      }
      if (!opts.cambiarClave) {
        return {
          usuarioActualizado: false,
          aviso: `El usuario ${usuario} ya existía: se usó su clave actual y se le dio acceso a la base ${nombre}.`,
        };
      }
      // La clave de un usuario existente se cambia al FINAL: si algo anterior falla, no se toca.
      for (const host of hostsExistentes) {
        await this.filas('ALTER USER ?@? IDENTIFIED BY ?', [usuario, host, clave]);
        claveCambiada = true;
      }
      return {
        usuarioActualizado: true,
        aviso: `El usuario ${usuario} ya existía: su clave se cambió a la nueva.`,
      };
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      const err = traducir(e, `crear la base ${nombre}`);
      if (claveCambiada) err.message += ` La clave del usuario ${usuario} ya se cambió a la nueva.`;
      throw err;
    }
  }

  /**
   * Usuario temporal con permisos solo sobre `base` (ALL PRIVILEGES en `base`.*, nunca FILE, SUPER
   * ni SET_USER_ID, que son globales y no se otorgan). Lo usa la restauración de esquemas: el SQL
   * de un tercero se ejecuta con él y se borra al terminar (`borrarUsuarioTemporal`).
   */
  async crearUsuarioTemporal(
    base: string,
    /** `datos`: solo INSERT (el usuario que carga los datos de un tercero). */
    privilegios: 'todos' | 'datos' = 'todos',
  ): Promise<{ usuario: string; clave: string }> {
    id(base);
    const escapado = `\`${base.replace(/_/g, '\\_')}\``;
    noSistema(base, 'crear');
    await this.limpiarTemporales().catch(() => undefined);
    const usuario = nombreTemporal();
    const clave = randomBytes(18).toString('hex');
    try {
      for (const host of ['localhost', '127.0.0.1']) {
        await this.filas(`CREATE USER ?@'${host}' IDENTIFIED BY ?`, [usuario, clave]);
        // `_` es un comodín en los permisos de base: se escapa para no alcanzar otras bases.
        const permisos = privilegios === 'datos' ? 'INSERT' : 'ALL PRIVILEGES';
        await this.filas(`GRANT ${permisos} ON ${escapado}.* TO ?@'${host}'`, [usuario]);
      }
    } catch (e) {
      await this.borrarUsuarioTemporal(usuario).catch(() => undefined);
      throw traducir(e, `crear un usuario temporal para ${base}`);
    }
    return { usuario, clave };
  }

  /**
   * Cuenta que figura como DEFINER de las vistas, rutinas y disparadores de una base importada:
   * bloqueada (nadie puede entrar con ella) y con permisos solo sobre `base`.*. Se conserva
   * mientras la base exista (los objetos la nombran).
   */
  async crearDuenoObjetos(base: string): Promise<string> {
    id(base);
    noSistema(base, 'crear');
    const usuario = nombreDuenoMysql(base);
    const escapado = '`' + base.replace(/_/g, '\\_') + '`';
    // Si la cuenta ya existía (de otra importación, o creada a mano con ese nombre), también se
    // bloquea: CREATE USER IF NOT EXISTS no cambia una cuenta existente.
    try {
      await this.filas("CREATE USER IF NOT EXISTS ?@'localhost' ACCOUNT LOCK", [usuario]);
      await this.filas("ALTER USER ?@'localhost' ACCOUNT LOCK", [usuario]);
    } catch {
      // Servidores sin ACCOUNT LOCK: una clave al azar que nadie conoce.
      await this.filas("CREATE USER IF NOT EXISTS ?@'localhost' IDENTIFIED BY ?", [
        usuario,
        randomBytes(24).toString('hex'),
      ]);
      await this.filas("ALTER USER ?@'localhost' IDENTIFIED BY ?", [
        usuario,
        randomBytes(24).toString('hex'),
      ]);
    }
    await this.filas(`GRANT ALL PRIVILEGES ON ${escapado}.* TO ?@'localhost'`, [usuario]);
    return usuario;
  }

  /**
   * Deja la sesión lista para cargar datos de un tercero: la base, utf8mb4 y un `sql_mode` conocido
   * (sin NO_BACKSLASH_ESCAPES ni ANSI_QUOTES: así el servidor lee las comillas como el divisor).
   */
  async prepararDatos(base: string): Promise<void> {
    await this.filas(`USE ${id(base)}`);
    await this.filas("SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO'");
    await this.filas('SET NAMES utf8mb4');
  }

  /** Una sola sentencia (el driver no admite varias en la misma consulta). */
  async ejecutarUna(sentencia: string): Promise<void> {
    await this.conexion().query(sentencia);
  }

  /** Borra un usuario creado por `crearUsuarioTemporal` (y solo esos). */
  async borrarUsuarioTemporal(usuario: string): Promise<void> {
    if (!NOMBRE_TEMPORAL.test(usuario)) {
      throw new Error('Solo se borran los usuarios temporales de WolfCore Dev.');
    }
    for (const host of ['localhost', '127.0.0.1']) {
      await this.filas(`DROP USER IF EXISTS ?@'${host}'`, [usuario]);
    }
  }

  /** Borra los usuarios `wolf_tmp_*` vencidos que dejó una restauración interrumpida. */
  async limpiarTemporales(): Promise<number> {
    const f = await this.filas(
      "SELECT DISTINCT User AS usuario FROM mysql.user WHERE User LIKE 'wolf\\_tmp\\_%'",
    );
    let n = 0;
    for (const x of f) {
      const usuario = String(x.usuario ?? x.User);
      if (!temporalVencido(usuario)) continue;
      try {
        await this.borrarUsuarioTemporal(usuario);
        n++;
      } catch {
        // Otro intento lo limpiará.
      }
    }
    return n;
  }

  /** Ejecuta las sentencias en `base`, una a una, y se detiene en la primera que falle. */
  async ejecutarSentencias(base: string, sentencias: readonly string[]): Promise<void> {
    await this.filas(`USE ${id(base)}`);
    for (const s of sentencias) await this.filas(s);
  }

  /** Deja la base vacía (la borra y la vuelve a crear): vuelta atrás de una restauración fallida. */
  async reiniciarBase(nombre: string): Promise<void> {
    const bd = id(nombre);
    noSistema(nombre, 'borrar');
    await this.filas(`DROP DATABASE IF EXISTS ${bd}`);
    await this.filas(`CREATE DATABASE ${bd} CHARACTER SET utf8mb4`);
  }

  async borrarBase(nombre: string): Promise<void> {
    const bd = id(nombre);
    noSistema(nombre, 'borrar');
    try {
      await this.filas(`DROP DATABASE ${bd}`);
    } catch (e) {
      throw traducir(e, `borrar la base ${nombre}`);
    }
  }

  /** Borra la cuenta bloqueada `wolf_dueno_*` de una base que ya no existe (si la había). */
  async borrarDuenoObjetos(base: string): Promise<void> {
    id(base);
    await this.filas("DROP USER IF EXISTS ?@'localhost'", [nombreDuenoMysql(base)]).catch(
      () => undefined,
    );
  }

  /** Versión del servidor (p. ej. "8.4.3" o "11.4.4-MariaDB"); es una consulta de solo lectura. */
  async version(): Promise<string> {
    const f = await this.filas('SELECT version() AS version');
    return String(f[0]?.version ?? '');
  }

  /** Bytes aproximados de una base (datos más índices); 0 si no se sabe. */
  async tamanoBase(nombre: string): Promise<number> {
    const f = await this.filas(
      'SELECT COALESCE(SUM(data_length + index_length), 0) AS b FROM information_schema.tables WHERE table_schema = ?',
      [nombre],
    );
    const n = Number(f[0]?.b ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  async tieneTablas(nombre: string): Promise<boolean> {
    validarNombreBd(nombre);
    const f = await this.filas(
      'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ?',
      [nombre],
    );
    return Number(f[0]?.n ?? 0) > 0;
  }
}
