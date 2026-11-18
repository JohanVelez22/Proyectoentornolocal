import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Ejecutor } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { compararVersiones } from '../servicios/nginx';
import { NOMBRE_SERVICIO } from '../servicios/definicion';
import type { Credenciales, EstadoServicio, IdServicioDatos, TipoSitio } from '../tipos';
import { ClienteMysql, type FabricaConexion, type ResultadoCrearBase } from './clienteMysql';
import {
  ClientePostgres,
  type FabricaConexionPg,
  type ResultadoCrearBasePg,
} from './clientePostgres';
import { bloqueEnv, type DatosConexion, type MotorBd } from './env';

export { bloqueEnv, type DatosConexion, type MotorBd } from './env';

export interface BaseListada {
  nombre: string;
  tamanoBytes: number;
}

export interface OpcionesCrearBase {
  usuario?: string;
  clave?: string;
}

export type ResultadoCrear = ResultadoCrearBase | ResultadoCrearBasePg;

export interface DepsBasesDeDatos {
  servicios: { estados(): Promise<EstadoServicio[]> };
  credenciales: { leer(id: IdServicioDatos): Promise<Credenciales | null> };
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
    const ruta = path.join(rutas.bin('mongosh', v), 'bin', 'mongosh.exe');
    if (existsSync(ruta)) return ruta;
  }
  return null;
}

/** Listar, crear y borrar bases de los cuatro motores y armar sus datos de conexión. */
export class BasesDeDatos {
  constructor(private readonly d: DepsBasesDeDatos) {}

  private async estado(motor: MotorBd): Promise<EstadoServicio> {
    const nombre = NOMBRE_SERVICIO[motor];
    const e = (await this.d.servicios.estados()).find((x) => x.id === motor);
    if (!e || e.estado !== 'encendido' || e.puertos[0] === undefined) {
      throw new Error(`Encienda ${nombre} para administrar sus bases`);
    }
    return e;
  }

  /** Datos para conectar a un motor encendido (la clave sale de credenciales.json). */
  async conexion(motor: MotorBd): Promise<DatosConexion> {
    const e = await this.estado(motor);
    const puerto = e.puertos[0]!;
    if (motor === 'mongodb') return { host: '127.0.0.1', puerto, usuario: '', clave: null };
    const cred = await this.d.credenciales.leer(motor);
    if (!cred) {
      throw new Error(`No hay credenciales guardadas de ${NOMBRE_SERVICIO[motor]}.`);
    }
    return { host: '127.0.0.1', puerto, usuario: USUARIO[motor], clave: cred.clave };
  }

  async bloqueEnv(
    motor: MotorBd,
    base: string,
    tipoProyecto: TipoSitio | 'generico',
    envActual?: string,
  ): Promise<string> {
    return bloqueEnv(motor, base, tipoProyecto, await this.conexion(motor), envActual);
  }

  private async conMysql<T>(motor: MotorBd, fn: (c: ClienteMysql) => Promise<T>): Promise<T> {
    const x = await this.conexion(motor);
    const c = new ClienteMysql(this.d.fabricas?.mysql);
    await c.conectar({ host: x.host, puerto: x.puerto, usuario: x.usuario, clave: x.clave ?? '' });
    try {
      return await fn(c);
    } finally {
      await c.cerrar();
    }
  }

  private async conPostgres<T>(fn: (c: ClientePostgres) => Promise<T>): Promise<T> {
    const x = await this.conexion('postgresql');
    const c = new ClientePostgres(this.d.fabricas?.postgres);
    await c.conectar({ host: x.host, puerto: x.puerto, usuario: x.usuario, clave: x.clave ?? '' });
    try {
      return await fn(c);
    } finally {
      await c.cerrar();
    }
  }

  private async mongosh(js: string): Promise<unknown> {
    const x = await this.conexion('mongodb');
    const sh = buscarMongosh(this.d.rutas);
    if (!sh) throw new Error('Falta mongosh: instálelo desde Servicios para administrar MongoDB.');
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

  async listar(motor: MotorBd): Promise<BaseListada[]> {
    let bases: BaseListada[];
    if (motor === 'mongodb') {
      const r = await this.mongosh(
        "EJSON.stringify(db.getSiblingDB('admin').adminCommand({listDatabases:1}).databases" +
          '.map(d=>({nombre:d.name,tamanoBytes:d.sizeOnDisk})))',
      );
      if (!Array.isArray(r)) throw new Error('MongoDB devolvió una respuesta que no se entiende.');
      bases = (r as BaseListada[])
        .filter((b) => b && typeof b.nombre === 'string' && b.nombre !== '')
        .filter((b) => !SISTEMA_MONGO.includes(b.nombre))
        .map((b) => ({ nombre: String(b.nombre), tamanoBytes: Number(b.tamanoBytes) || 0 }));
    } else if (motor === 'postgresql') {
      bases = await this.conPostgres((c) => c.listarBases());
    } else {
      bases = await this.conMysql(motor, (c) => c.listarBases());
    }
    return [...bases].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async crear(
    motor: MotorBd,
    nombre: string,
    opts: OpcionesCrearBase = {},
  ): Promise<ResultadoCrear> {
    if (motor === 'mongodb') {
      await this.estado(motor);
      validarMongo(nombre);
      noSistemaMongo(nombre, 'crear');
      // En MongoDB una base existe solo si tiene una colección.
      await this.mongosh(
        `EJSON.stringify(db.getSiblingDB('${nombre}').createCollection('_pel_init'))`,
      );
      return { usuarioActualizado: false };
    }
    if (motor === 'postgresql') return this.conPostgres((c) => c.crearBase(nombre, opts));
    return this.conMysql(motor, (c) => c.crearBase(nombre, opts));
  }

  /** true si la base existe y tiene alguna tabla (false si no existe). */
  async tieneTablas(motor: MotorBd, nombre: string): Promise<boolean> {
    if (motor === 'mongodb') throw new Error('MongoDB no se revisa por tablas.');
    if (motor === 'postgresql') {
      return this.conPostgres(async (c) => {
        // Conectar a una base que no existe fallaría: se mira antes la lista.
        const hay = await c.listarBases();
        return hay.some((b) => b.nombre === nombre) && c.tieneTablas(nombre);
      });
    }
    return this.conMysql(motor, (c) => c.tieneTablas(nombre));
  }

  /** Activa pgvector en una base de PostgreSQL (la extensión es por base). */
  async activarVector(base: string): Promise<void> {
    await this.conPostgres((c) => c.activarVector(base));
  }

  async borrar(motor: MotorBd, nombre: string, confirmacion: string): Promise<void> {
    await this.estado(motor);
    if (confirmacion !== nombre) {
      throw new Error(`Para borrar la base ${nombre} escriba su nombre exacto.`);
    }
    if (motor === 'mongodb') {
      validarMongo(nombre);
      noSistemaMongo(nombre, 'borrar');
      await this.mongosh(`EJSON.stringify(db.getSiblingDB('${nombre}').dropDatabase())`);
      return;
    }
    if (motor === 'postgresql') return this.conPostgres((c) => c.borrarBase(nombre));
    return this.conMysql(motor, (c) => c.borrarBase(nombre));
  }
}
