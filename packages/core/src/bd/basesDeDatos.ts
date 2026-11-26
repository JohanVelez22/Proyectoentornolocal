import { existsSync, readdirSync } from 'node:fs';
import { ErrorWolf } from '../errores';
import path from 'node:path';
import type { Ejecutor } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { compararVersiones } from '../servicios/nginx';
import { NOMBRE_SERVICIO } from '../servicios/definicion';
import { esIdInstancia, parsearInstancia } from '../servicios/instancias';
import type {
  ClaveCredencial,
  Credenciales,
  EstadoInstancia,
  EstadoServicio,
  IdInstancia,
  TipoSitio,
} from '../tipos';
import type { ConsultaSql } from './auditoriaClaves/tablas';
import {
  ClienteMysql,
  validarNombreBd,
  type FabricaConexion,
  type ResultadoCrearBase,
} from './clienteMysql';
import {
  ClientePostgres,
  validarNombrePg,
  type FabricaConexionPg,
  type ResultadoCrearBasePg,
} from './clientePostgres';
import { bloqueEnv, type DatosConexion, type MotorBd } from './env';
import { nombreEjecutable } from '../plataforma/sistema';

export {
  bloqueEnv,
  MASCARA_CLAVE,
  vistaConexion,
  type DatosConexion,
  type DatosConexionVista,
  type MotorBd,
} from './env';

export interface BaseListada {
  nombre: string;
  tamanoBytes: number;
}

export interface OpcionesCrearBase {
  usuario?: string;
  clave?: string;
  /**
   * Si el usuario ya existe, cambiar su clave a `clave`. Solo tras una confirmación explícita:
   * sin esto, un usuario existente conserva su clave y una distinta da `bd.usuario_clave_distinta`.
   */
  cambiarClave?: boolean;
  /** La base debe ser nueva: si ya existe falla con `proyectos.base_existe`. */
  nueva?: boolean;
  /** Justo después de crear la base (no si ya existía); ver `OpcionesCrearBaseMotor`. */
  alCrearBase?: () => void;
  /** PostgreSQL: cerrar a PUBLIC una base que ya existía porque la creó este proyecto. */
  aislar?: boolean;
}

export type ResultadoCrear = ResultadoCrearBase | ResultadoCrearBasePg;

/** Un motor (su instancia predeterminada) o una instancia concreta (`mysql@8.0`). */
export type ObjetivoBd = MotorBd | IdInstancia;

const MOTORES: readonly string[] = ['mysql', 'mariadb', 'postgresql', 'mongodb'];

/** Motor de un objetivo; una instancia de un servicio que no es base de datos se rechaza. */
export function motorDe(objetivo: ObjetivoBd): MotorBd {
  const m = esIdInstancia(objetivo) ? parsearInstancia(objetivo).servicio : objetivo;
  if (!MOTORES.includes(m)) {
    throw new ErrorWolf('instancias.id_invalido', 'El identificador de la instancia no es válido.');
  }
  return m as MotorBd;
}

export interface DepsBasesDeDatos {
  servicios: {
    estados(): Promise<EstadoServicio[]>;
    /** Instancias de un servicio (con las implícitas); sin esto, solo motores. */
    instancias?(servicio: MotorBd): Promise<EstadoInstancia[]>;
  };
  credenciales: { leer(id: ClaveCredencial): Promise<Credenciales | null> };
  rutas: Rutas;
  exec: Ejecutor;
  fabricas?: { mysql?: FabricaConexion; postgres?: FabricaConexionPg };
}

/** Nombres de base válidos en MongoDB. */
export const NOMBRE_BD_MONGO = /^[A-Za-z0-9_-]{1,63}$/;
const NOMBRE_MONGO = NOMBRE_BD_MONGO;
const SISTEMA_MONGO = ['admin', 'local', 'config'];
const USUARIO: Record<MotorBd, string> = {
  mysql: 'root',
  mariadb: 'root',
  postgresql: 'postgres',
  mongodb: '',
};

function validarMongo(nombre: string): void {
  if (!NOMBRE_MONGO.test(nombre)) {
    throw new Error(
      `El nombre "${nombre}" no es válido: use solo letras, números, guion y guion bajo (hasta 63 caracteres).`,
    );
  }
}

function noSistemaMongo(nombre: string, verbo: 'borrar' | 'crear'): void {
  if (SISTEMA_MONGO.includes(nombre.toLowerCase())) {
    throw new Error(`No se puede ${verbo} la base del sistema ${nombre}.`);
  }
}

/** mongosh más reciente instalado (es un paquete aparte), o null. */
function buscarMongosh(rutas: Rutas): string | null {
  const carpeta = path.dirname(rutas.bin('mongosh', '0'));
  if (!existsSync(carpeta)) return null;
  for (const v of readdirSync(carpeta).sort(compararVersiones).reverse()) {
    const ruta = path.join(rutas.bin('mongosh', v), 'bin', nombreEjecutable('mongosh'));
    if (existsSync(ruta)) return ruta;
  }
  return null;
}

/** Listar, crear y borrar bases de los cuatro motores y armar sus datos de conexión. */
export class BasesDeDatos {
  constructor(private readonly d: DepsBasesDeDatos) {}

  /**
   * Puerto y credencial de un objetivo encendido. Un motor = su predeterminada; una instancia,
   * la suya (con la forma de una sola instancia, la credencial del servicio).
   */
  private async estado(objetivo: ObjetivoBd): Promise<{
    motor: MotorBd;
    puerto: number;
    instancia?: IdInstancia;
    credencial: ClaveCredencial;
  }> {
    const motor = motorDe(objetivo);
    const nombre = esIdInstancia(objetivo) ? objetivo : NOMBRE_SERVICIO[motor];
    const apagado = (): ErrorWolf =>
      new ErrorWolf('bd.encender_servicio', `Encienda ${nombre} para administrar sus bases`, {
        nombre,
      });
    const e = (await this.d.servicios.estados()).find((x) => x.id === motor);
    if (!esIdInstancia(objetivo)) {
      if (!e || e.estado !== 'encendido' || e.puertos[0] === undefined) throw apagado();
      const pred = e.instancias?.find((i) => i.predeterminada);
      return pred
        ? { motor, puerto: e.puertos[0], instancia: pred.id, credencial: pred.id }
        : { motor, puerto: e.puertos[0], credencial: motor };
    }
    const lista = (await this.d.servicios.instancias?.(motor)) ?? [];
    const i = lista.find((x) => x.id === objetivo);
    if (!i) {
      throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${objetivo}.`, {
        id: objetivo,
      });
    }
    if (i.estado !== 'encendido') throw apagado();
    // Sin instancias configuradas (la única, implícita), la credencial es la del servicio.
    const implicita = e !== undefined && e.instancias === undefined;
    return {
      motor,
      puerto: i.puerto,
      ...(implicita ? {} : { instancia: i.id }),
      credencial: implicita ? motor : i.id,
    };
  }

  /** Datos para conectar a un motor o instancia encendidos (la clave sale de credenciales.json). */
  async conexion(objetivo: ObjetivoBd): Promise<DatosConexion> {
    const { motor, puerto, instancia, credencial } = await this.estado(objetivo);
    const extra = instancia ? { instancia } : {};
    if (motor === 'mongodb') {
      return { host: '127.0.0.1', puerto, usuario: '', clave: null, ...extra };
    }
    const cred = await this.d.credenciales.leer(credencial);
    if (!cred) {
      throw new ErrorWolf(
        'bd.sin_credenciales',
        `No hay credenciales guardadas de ${NOMBRE_SERVICIO[motor]}.`,
        { nombre: NOMBRE_SERVICIO[motor] },
      );
    }
    return { host: '127.0.0.1', puerto, usuario: USUARIO[motor], clave: cred.clave, ...extra };
  }

  async bloqueEnv(
    objetivo: ObjetivoBd,
    base: string,
    tipoProyecto: TipoSitio | 'generico',
    envActual?: string,
    enmascarar = false,
  ): Promise<string> {
    const x = await this.conexion(objetivo);
    return bloqueEnv(motorDe(objetivo), base, tipoProyecto, x, envActual, enmascarar);
  }

  private async conMysql<T>(objetivo: ObjetivoBd, fn: (c: ClienteMysql) => Promise<T>): Promise<T> {
    const x = await this.conexion(objetivo);
    const c = new ClienteMysql(this.d.fabricas?.mysql);
    await c.conectar({ host: x.host, puerto: x.puerto, usuario: x.usuario, clave: x.clave ?? '' });
    try {
      return await fn(c);
    } finally {
      await c.cerrar();
    }
  }

  private async conPostgres<T>(
    fn: (c: ClientePostgres) => Promise<T>,
    objetivo: ObjetivoBd = 'postgresql',
  ): Promise<T> {
    const x = await this.conexion(objetivo);
    const c = new ClientePostgres(this.d.fabricas?.postgres);
    await c.conectar({ host: x.host, puerto: x.puerto, usuario: x.usuario, clave: x.clave ?? '' });
    try {
      return await fn(c);
    } finally {
      await c.cerrar();
    }
  }

  private async mongosh(js: string, objetivo: ObjetivoBd = 'mongodb'): Promise<unknown> {
    const x = await this.conexion(objetivo);
    const sh = buscarMongosh(this.d.rutas);
    if (!sh)
      throw new ErrorWolf(
        'bd.mongosh_faltante',
        'Falta mongosh: instálelo desde Servicios para administrar MongoDB.',
      );
    const r = await this.d.exec(
      sh,
      ['--quiet', '--host', x.host, '--port', String(x.puerto), '--eval', js],
      { timeoutMs: 30_000 },
    );
    if (r.codigo !== 0) throw new Error('MongoDB rechazó la operación.');
    const texto = r.stdout.trim();
    if (!texto) return null;
    try {
      return JSON.parse(texto.split(/\r?\n/).at(-1)!);
    } catch {
      throw new Error('MongoDB devolvió una respuesta que no se entiende.');
    }
  }

  async listar(objetivo: ObjetivoBd): Promise<BaseListada[]> {
    const motor = motorDe(objetivo);
    let bases: BaseListada[];
    if (motor === 'mongodb') {
      const r = await this.mongosh(
        "EJSON.stringify(db.getSiblingDB('admin').adminCommand({listDatabases:1}).databases" +
          '.map(d=>({nombre:d.name,tamanoBytes:d.sizeOnDisk})))',
        objetivo,
      );
      if (!Array.isArray(r)) throw new Error('MongoDB devolvió una respuesta que no se entiende.');
      bases = (r as BaseListada[])
        .filter((b) => b && typeof b.nombre === 'string' && b.nombre !== '')
        .filter((b) => !SISTEMA_MONGO.includes(b.nombre))
        .map((b) => ({ nombre: String(b.nombre), tamanoBytes: Number(b.tamanoBytes) || 0 }));
    } else if (motor === 'postgresql') {
      bases = await this.conPostgres((c) => c.listarBases(), objetivo);
    } else {
      bases = await this.conMysql(objetivo, (c) => c.listarBases());
    }
    return [...bases].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async crear(
    objetivo: ObjetivoBd,
    nombre: string,
    opts: OpcionesCrearBase = {},
  ): Promise<ResultadoCrear> {
    const motor = motorDe(objetivo);
    if (motor === 'mongodb') {
      await this.estado(objetivo);
      validarMongo(nombre);
      noSistemaMongo(nombre, 'crear');
      if (opts.nueva && (await this.listar(objetivo)).some((x) => x.nombre === nombre)) {
        throw new ErrorWolf('proyectos.base_existe', `La base ${nombre} ya existe.`, { nombre });
      }
      // En MongoDB una base existe solo si tiene una colección.
      await this.mongosh(
        `EJSON.stringify(db.getSiblingDB('${nombre}').createCollection('_pel_init'))`,
        objetivo,
      );
      return { usuarioActualizado: false };
    }
    if (motor === 'postgresql') {
      return this.conPostgres((c) => c.crearBase(nombre, opts), objetivo);
    }
    return this.conMysql(objetivo, (c) => c.crearBase(nombre, opts));
  }

  /** true si la base existe y tiene alguna tabla (false si no existe). */
  async tieneTablas(objetivo: ObjetivoBd, nombre: string): Promise<boolean> {
    const motor = motorDe(objetivo);
    if (motor === 'mongodb') throw new Error('MongoDB no se revisa por tablas.');
    if (motor === 'postgresql') {
      return this.conPostgres(async (c) => {
        // Conectar a una base que no existe fallaría: se mira antes la lista.
        const hay = await c.listarBases();
        return hay.some((b) => b.nombre === nombre) && c.tieneTablas(nombre);
      }, objetivo);
    }
    return this.conMysql(objetivo, (c) => c.tieneTablas(nombre));
  }

  /** Tablas y bytes de una base que existe (solo lectura; para las instantáneas). */
  async estadoBase(
    objetivo: ObjetivoBd,
    nombre: string,
  ): Promise<{ tablas: number; bytes: number }> {
    const motor = motorDe(objetivo);
    if (motor === 'mongodb') throw new Error('MongoDB no se revisa por tablas.');
    const base = (await this.listar(objetivo)).find((b) => b.nombre === nombre);
    if (!base) return { tablas: 0, bytes: 0 };
    const bytes = base.tamanoBytes;
    const tablas =
      motor === 'postgresql'
        ? await this.conPostgres((c) => c.contarTablas(nombre), objetivo)
        : await this.conMysql(objetivo, (c) => c.contarTablas(nombre));
    return { tablas, bytes };
  }

  /**
   * Usuario (MySQL, MariaDB) o rol (PostgreSQL) temporal, limitado a `base`, para ejecutar SQL de
   * confianza dudosa. `retirar` lo borra (en PostgreSQL devuelve antes la base al administrador).
   */
  async usuarioTemporal(
    objetivo: ObjetivoBd,
    base: string,
    privilegios: 'todos' | 'datos' | 'lectura' | 'escritura' = 'todos',
  ): Promise<{ usuario: string; clave: string; retirar: () => Promise<void> }> {
    const motor = motorDe(objetivo);
    if (motor === 'mongodb') throw new Error('MongoDB no usa usuarios temporales de SQL.');
    if (motor === 'postgresql') {
      if (privilegios === 'lectura' || privilegios === 'escritura') {
        throw new Error('PostgreSQL no usa roles temporales de lectura: ver abrirConsulta.');
      }
      const r = await this.conPostgres((c) => c.crearRolTemporal(base), objetivo);
      return {
        ...r,
        retirar: () => this.conPostgres((c) => c.retirarRolTemporal(r.usuario, base), objetivo),
      };
    }
    const r = await this.conMysql(objetivo, (c) => c.crearUsuarioTemporal(base, privilegios));
    return {
      ...r,
      retirar: () => this.conMysql(objetivo, (c) => c.borrarUsuarioTemporal(r.usuario)),
    };
  }

  /**
   * Conexión a UNA base para la auditoría de contraseñas (D20), con el menor poder viable:
   * - MySQL y MariaDB: un usuario temporal limitado a la base con solo SELECT (`lectura`) o
   *   SELECT y UPDATE (`escritura`); se borra al cerrar.
   * - PostgreSQL: un rol temporal `wolf_tmp_*` (LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT,
   *   que no es dueño de nada) con CONNECT en la base, USAGE en el esquema, SELECT en la tabla y,
   *   solo para restablecer, UPDATE de la columna del hash. El administrador solo lee el catálogo.
   * Los nombres de tabla y de columna los valida `TablasSql` contra el catálogo antes de usarlos.
   */
  async abrirConsulta(
    objetivo: ObjetivoBd,
    base: string,
    modo: 'lectura' | 'escritura',
    plazoMs: number,
  ): Promise<ConsultaSql> {
    const motor = motorDe(objetivo);
    if (motor === 'mongodb') {
      throw new ErrorWolf(
        'auditoria.motor_no_soportado',
        'La auditoría de contraseñas es para MySQL, MariaDB y PostgreSQL.',
      );
    }
    const x = await this.conexion(objetivo);
    if (motor === 'postgresql') {
      validarNombrePg(base);
      const fab = this.d.fabricas?.postgres;
      /** Conexión a la base con el `search_path` del catálogo: ningún esquema ajeno tapa un operador. */
      const conectar = async (usuario: string, clave: string): Promise<ClientePostgres> => {
        const c = new ClientePostgres(fab);
        await c.conectar({ host: x.host, puerto: x.puerto, usuario, clave, base });
        try {
          await c.consultar('SET search_path = pg_catalog, pg_temp');
          await c.consultar(`SET statement_timeout = ${Math.max(1000, Math.floor(plazoMs))}`);
        } catch (e) {
          await c.cerrar();
          throw e;
        }
        return c;
      };
      // El administrador solo lee el catálogo (sesión en solo lectura) para validar la tabla;
      // luego `limitar` crea el rol temporal y todo lo demás va con él.
      const admin = await conectar(x.usuario, x.clave ?? '');
      let activo = admin;
      let rol: { usuario: string; clave: string } | null = null;
      let conRol: ClientePostgres | null = null;
      let destino: { esquema: string; tabla: string } | null = null;
      try {
        await admin.consultar('SET default_transaction_read_only = on');
      } catch (e) {
        await admin.cerrar();
        throw e;
      }
      return {
        motor,
        consultar: (s, p) => activo.consultar(s, p),
        async limitar(o) {
          const gestor = await conectar(x.usuario, x.clave ?? '');
          try {
            rol = await gestor.crearRolAuditoria({
              base,
              esquema: o.esquema,
              tabla: o.tabla,
              columnaHash: o.columnaHash,
              escritura: modo === 'escritura',
            });
          } finally {
            await gestor.cerrar();
          }
          destino = { esquema: o.esquema, tabla: o.tabla };
          conRol = await conectar(rol.usuario, rol.clave);
          if (modo === 'lectura') await conRol.consultar('SET default_transaction_read_only = on');
          activo = conRol;
        },
        async cerrar() {
          await (conRol as ClientePostgres | null)?.cerrar();
          await admin.cerrar();
          const r = rol as { usuario: string; clave: string } | null;
          const dest = destino as { esquema: string; tabla: string } | null;
          if (r && dest) {
            // REVOKE, DROP OWNED y DROP ROLE; si algo falla, `limpiarTemporales` lo recoge al vencer.
            const gestor = await conectar(x.usuario, x.clave ?? '').catch(() => null);
            if (gestor) {
              await gestor
                .retirarRolAuditoria({ usuario: r.usuario, base, ...dest })
                .catch(() => undefined);
              await gestor.cerrar();
            }
          }
        },
      };
    }
    validarNombreBd(base);
    const temporal = await this.usuarioTemporal(objetivo, base, modo);
    const c = new ClienteMysql(this.d.fabricas?.mysql, { limiteMs: plazoMs });
    try {
      await c.conectar({
        host: x.host,
        puerto: x.puerto,
        usuario: temporal.usuario,
        clave: temporal.clave,
      });
    } catch (e) {
      await temporal.retirar().catch(() => undefined);
      throw e;
    }
    if (modo === 'escritura') {
      // Nada de recortes ni conversiones silenciosas: si el hash no cabe, falla.
      await c
        .consultar(
          "SET SESSION sql_mode = CONCAT_WS(',', NULLIF(@@SESSION.sql_mode, ''), 'STRICT_ALL_TABLES')",
        )
        .catch(async (e) => {
          await c.cerrar();
          await temporal.retirar().catch(() => undefined);
          throw e;
        });
    }
    return {
      motor,
      consultar: (s, p) => c.consultar(s, p),
      cerrar: async () => {
        await c.cerrar();
        await temporal.retirar().catch(() => undefined);
      },
    };
  }

  /**
   * Después de restaurar un esquema en una base con usuario propio: en PostgreSQL pasa la base y
   * sus objetos a ese usuario (en MySQL y MariaDB sus permisos ya cubren toda la base).
   */
  async entregarBase(objetivo: ObjetivoBd, base: string, usuario: string): Promise<void> {
    if (motorDe(objetivo) !== 'postgresql') return;
    await this.conPostgres((c) => c.entregarBase(base, usuario), objetivo);
  }

  /** Deja la base vacía: vuelta atrás de una restauración de esquema fallida. */
  async reiniciarBase(objetivo: ObjetivoBd, base: string): Promise<void> {
    if (motorDe(objetivo) === 'mongodb') throw new Error('MongoDB no se reinicia por SQL.');
    if (motorDe(objetivo) === 'postgresql') {
      await this.conPostgres((c) => c.reiniciarBase(base), objetivo);
      return;
    }
    await this.conMysql(objetivo, (c) => c.reiniciarBase(base));
  }

  /** Revisa el catálogo de una base de PostgreSQL ya restaurada; devuelve lo que no debería estar. */
  async auditarEsquema(
    objetivo: ObjetivoBd,
    base: string,
    o: { permitidas: readonly string[]; importada: boolean },
  ): Promise<string[]> {
    return this.conPostgres((c) => c.auditarCatalogo(base, o), objetivo);
  }

  /** Borra los usuarios y roles temporales vencidos de un servidor encendido. */
  async limpiarTemporales(objetivo: ObjetivoBd): Promise<number> {
    const motor = motorDe(objetivo);
    if (motor === 'mongodb') return 0;
    if (motor === 'postgresql') return this.conPostgres((c) => c.limpiarTemporales(), objetivo);
    return this.conMysql(objetivo, (c) => c.limpiarTemporales());
  }

  /** Crea una extensión de PostgreSQL en la base (como administrador). */
  async crearExtension(base: string, nombre: string, objetivo?: ObjetivoBd): Promise<void> {
    await this.conPostgres((c) => c.crearExtension(base, nombre), objetivo);
  }

  /** Activa pgvector en una base de PostgreSQL (la extensión es por base). */
  async activarVector(base: string, objetivo?: ObjetivoBd): Promise<void> {
    await this.conPostgres((c) => c.activarVector(base), objetivo);
  }

  async borrar(objetivo: ObjetivoBd, nombre: string, confirmacion: string): Promise<void> {
    const motor = motorDe(objetivo);
    await this.estado(objetivo);
    if (confirmacion !== nombre) {
      throw new ErrorWolf(
        'bd.confirmacion_borrado',
        `Para borrar la base ${nombre} escriba su nombre exacto.`,
        { nombre },
      );
    }
    if (motor === 'mongodb') {
      validarMongo(nombre);
      noSistemaMongo(nombre, 'borrar');
      await this.mongosh(`EJSON.stringify(db.getSiblingDB('${nombre}').dropDatabase())`, objetivo);
      return;
    }
    if (motor === 'postgresql') return this.conPostgres((c) => c.borrarBase(nombre), objetivo);
    return this.conMysql(objetivo, async (c) => {
      await c.borrarBase(nombre);
      // La cuenta bloqueada que figuraba como DEFINER de sus objetos (si la importó WolfCore Dev).
      await c.borrarDuenoObjetos(nombre);
    });
  }
}
