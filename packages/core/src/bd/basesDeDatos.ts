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
import { ClienteMysql, type FabricaConexion, type ResultadoCrearBase } from './clienteMysql';
import {
  ClientePostgres,
  type FabricaConexionPg,
  type ResultadoCrearBasePg,
} from './clientePostgres';
import { bloqueEnv, type DatosConexion, type MotorBd } from './env';
import { nombreEjecutable } from '../plataforma/sistema';

export { bloqueEnv, type DatosConexion, type MotorBd } from './env';

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
  ): Promise<string> {
    const x = await this.conexion(objetivo);
    return bloqueEnv(motorDe(objetivo), base, tipoProyecto, x, envActual);
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
    return this.conMysql(objetivo, (c) => c.borrarBase(nombre));
  }
}
