import { createHash } from 'node:crypto';
import { mkdir, open, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../../errores';
import type { Rutas } from '../../rutas';
import type { IdInstancia, IdServicioDatos } from '../../tipos';
import type { ObjetivoBd } from '../basesDeDatos';
import { motorDe } from '../basesDeDatos';
import {
  carpetaLogLento,
  guardarAjuste,
  rutaAjuste,
  rutaLogLento,
  SEGUNDOS_DEFECTO,
  validarSegundos,
} from './ajustes';
import { normalizarSql } from './normalizar';
import { parsearMysql, parsearPostgres, type EntradaLentaCruda } from './parseo';

/** Solo se lee la cola del archivo: los últimos 5 MB. */
export const MAX_BYTES_LENTAS = 5 * 1024 * 1024;
/** Entradas como mucho que se entregan (las más lentas). */
export const MAX_ENTRADAS_LENTAS = 500;

export interface EntradaLenta {
  /** Id opaco de la entrada (huella): sirve para pedir su SQL literal. */
  id: string;
  duracionMs: number;
  filasExaminadas: number | null;
  base: string | null;
  fecha: string | null;
  /**
   * SQL con los literales cambiados por `?`. Es lo único que se entrega por defecto. `null` si no
   * se puede garantizar que no lleve datos («SQL oculto»).
   */
  sqlNormalizado: string | null;
  /**
   * Se puede pedir el SQL tal cual: solo si NINGUNA base del servidor es de un sitio con
   * `datosReales`, la entrada se atribuye a una base que existe y el parser no dudó de ella.
   */
  literalPermitido: boolean;
}

export interface ConsultasLentasLeidas {
  entradas: EntradaLenta[];
  /** Había más entradas que el tope, o el archivo era más grande que lo que se lee. */
  truncado: boolean;
  /** El archivo todavía no existe (no se ha registrado nada). */
  sinArchivo: boolean;
}

export interface EstadoConsultasLentas {
  motor: 'mysql' | 'mariadb' | 'postgresql';
  /** Instancia propia de WolfCore (la única donde se puede cambiar el registro). */
  gestionada: boolean;
  /** Registro activo en el servidor (false si la instancia no es gestionada). */
  activo: boolean;
  segundos: number | null;
}

export interface UbicacionInstancia {
  servicio: IdServicioDatos;
  claveDatos: string;
  log: string;
}

export interface DepsConsultasLentas {
  rutas: Rutas;
  bd: {
    lentasEstado(o: ObjetivoBd): Promise<{ activo: boolean; segundos: number | null }>;
    lentasAplicar(
      o: ObjetivoBd,
      a: { activo: boolean; segundos: number; archivo: string },
    ): Promise<void>;
    listar(o: ObjetivoBd): Promise<{ nombre: string }[]>;
  };
  /** Datos y registro de una instancia propia; falla si no existe o es un motor externo. */
  ubicacion(o: IdInstancia | IdServicioDatos): Promise<UbicacionInstancia>;
  /** ¿La base es la de un sitio con `datosReales`? (ante la duda, true). */
  esDatosReales(o: ObjetivoBd, base: string): Promise<boolean>;
  /** Deja un archivo o carpeta legible solo por el usuario (`Plataforma.restringirAlUsuario`). */
  restringir: (ruta: string, o?: { carpeta?: boolean }) => Promise<boolean>;
  /** Cola del archivo (para pruebas). Por defecto lee los últimos `maxBytes` de la ruta. */
  leerCola?: (
    ruta: string,
    maxBytes: number,
  ) => Promise<{ texto: string; recortado: boolean } | null>;
}

/** Lee la cola de un archivo (null si no existe). Se descarta la primera línea si quedó cortada. */
async function colaDeArchivo(
  ruta: string,
  maxBytes: number,
): Promise<{ texto: string; recortado: boolean } | null> {
  let f;
  try {
    f = await open(ruta, 'r');
  } catch (e) {
    const c = (e as NodeJS.ErrnoException).code;
    if (c === 'ENOENT' || c === 'ENOTDIR') return null;
    throw e;
  }
  try {
    const { size } = await f.stat();
    const inicio = Math.max(0, size - maxBytes);
    const largo = size - inicio;
    const b = Buffer.alloc(largo);
    let leidos = 0;
    while (leidos < largo) {
      const { bytesRead } = await f.read(b, leidos, largo - leidos, inicio + leidos);
      if (bytesRead === 0) break;
      leidos += bytesRead;
    }
    let texto = b.subarray(0, leidos).toString('utf8');
    if (inicio > 0) {
      const nl = texto.indexOf('\n');
      texto = nl < 0 ? '' : texto.slice(nl + 1);
    }
    return { texto, recortado: inicio > 0 };
  } finally {
    await f.close();
  }
}

const huella = (e: EntradaLentaCruda): string =>
  createHash('sha256')
    .update(`${e.fecha ?? ''}\u0000${e.duracionMs}\u0000${e.base ?? ''}\u0000${e.sql}`)
    .digest('hex')
    .slice(0, 16);

/**
 * Consultas lentas de MySQL, MariaDB y PostgreSQL (D45b). Activar o desactivar es un cambio GLOBAL
 * del servidor: exige `confirmado === true` y solo se hace en instancias de WolfCore. El SQL sale
 * normalizado (sin literales; en modo estricto, o «oculto», si el servidor tiene bases de un sitio
 * con `datosReales`); el literal solo se entrega si ninguna base del servidor lo es. Nada de esto va a logs, ni a la CLI ni al MCP.
 */
export class ConsultasLentas {
  constructor(private readonly d: DepsConsultasLentas) {}

  private soloSql(o: ObjetivoBd): 'mysql' | 'mariadb' | 'postgresql' {
    const m = motorDe(o);
    if (m === 'mongodb') {
      throw new ErrorWolf(
        'bd.lentas_motor_no_soportado',
        'Las consultas lentas son para MySQL, MariaDB y PostgreSQL.',
      );
    }
    return m;
  }

  private async ubicacion(o: ObjetivoBd): Promise<UbicacionInstancia | null> {
    try {
      return await this.d.ubicacion(o);
    } catch {
      return null;
    }
  }

  async estado(o: ObjetivoBd): Promise<EstadoConsultasLentas> {
    const motor = this.soloSql(o);
    if (!(await this.ubicacion(o))) {
      return { motor, gestionada: false, activo: false, segundos: null };
    }
    try {
      const e = await this.d.bd.lentasEstado(o);
      return { motor, gestionada: true, ...e };
    } catch (e) {
      // Servidor apagado: se dice que no está activo; el resto se informa con el catálogo.
      if (e instanceof ErrorWolf) throw e;
      throw new ErrorWolf('bd.lentas_fallo', 'No se pudo leer el estado de las consultas lentas.');
    }
  }

  /** Activa o desactiva el registro (cambio global, con confirmación y solo en instancias propias). */
  async cambiar(
    o: ObjetivoBd,
    a: { activo: boolean; segundos?: number; confirmado: boolean },
  ): Promise<EstadoConsultasLentas> {
    if (a.confirmado !== true) {
      throw new ErrorWolf(
        'bd.lentas_confirmar',
        'Cambiar el registro de consultas lentas afecta a todo el servidor: hay que confirmarlo.',
      );
    }
    const motor = this.soloSql(o);
    const segundos = a.segundos === undefined ? SEGUNDOS_DEFECTO : validarSegundos(a.segundos);
    const u = await this.ubicacion(o);
    if (!u) {
      throw new ErrorWolf(
        'bd.lentas_motor_no_soportado',
        'Solo se puede cambiar en una instancia gestionada por WolfCore Dev.',
      );
    }
    const archivo = rutaLogLento(this.d.rutas, u.servicio, u.claveDatos);
    const ajuste = rutaAjuste(this.d.rutas, u.servicio, u.claveDatos);
    try {
      if (motor !== 'postgresql') {
        // El slow log lleva SQL con sus literales: carpeta propia, solo del usuario.
        await mkdir(path.dirname(archivo), { recursive: true });
        await this.d
          .restringir(carpetaLogLento(this.d.rutas), { carpeta: true })
          .catch(() => false);
      }
      const antes = await this.d.bd.lentasEstado(o);
      await this.d.bd.lentasAplicar(o, { activo: a.activo, segundos, archivo });
      if (motor !== 'postgresql') {
        try {
          await guardarAjuste(ajuste, { activo: a.activo, segundos });
        } catch {
          // Sin persistir, el cambio se perdería al reiniciar: se deja como estaba.
          await this.d.bd
            .lentasAplicar(o, {
              activo: antes.activo,
              segundos: antes.segundos ?? SEGUNDOS_DEFECTO,
              archivo,
            })
            .catch(() => undefined);
          throw new Error('no se pudo guardar');
        }
      }
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      throw new ErrorWolf('bd.lentas_fallo', 'No se pudo cambiar el registro de consultas lentas.');
    }
    if (motor !== 'postgresql') {
      await this.d.restringir(archivo).catch(() => false);
      await this.borrarLogsAntiguos();
    }
    return this.estado(o);
  }

  /** Los `logs/lentas-*.log` de la ubicación antigua (visibles como fuente): es un log, se borra. */
  private async borrarLogsAntiguos(): Promise<void> {
    const carpeta = this.d.rutas.logs();
    let nombres: string[];
    try {
      nombres = await readdir(carpeta);
    } catch {
      return;
    }
    for (const n of nombres) {
      if (/^lentas-.*\.log$/i.test(n))
        await rm(path.join(carpeta, n), { force: true }).catch(() => undefined);
    }
  }

  private async cruda(
    o: ObjetivoBd,
  ): Promise<{ entradas: EntradaLentaCruda[]; recortado: boolean; sinArchivo: boolean }> {
    const motor = this.soloSql(o);
    const u = await this.d.ubicacion(o).catch(() => null);
    if (!u) return { entradas: [], recortado: false, sinArchivo: true };
    const ruta =
      motor === 'postgresql' ? u.log : rutaLogLento(this.d.rutas, u.servicio, u.claveDatos);
    const cola = await (this.d.leerCola ?? colaDeArchivo)(ruta, MAX_BYTES_LENTAS);
    if (!cola) return { entradas: [], recortado: false, sinArchivo: true };
    const entradas =
      motor === 'postgresql' ? parsearPostgres(cola.texto) : parsearMysql(cola.texto);
    return { entradas, recortado: cola.recortado, sinArchivo: false };
  }

  /**
   * Contexto de seguridad del servidor: ¿alguna de sus bases es la de un sitio con `datosReales`?
   * Ante la duda (no se pueden listar las bases, o no se puede saber de una), sí. Con `real`, nada
   * del servidor se muestra con sus valores, sea cual sea la base a la que el registro atribuya la
   * consulta. `bases` son las que existen hoy (en minúsculas).
   */
  private async contexto(o: ObjetivoBd): Promise<{ real: boolean; bases: Set<string> }> {
    let lista: { nombre: string }[];
    try {
      lista = await this.d.bd.listar(o);
    } catch {
      return { real: true, bases: new Set() };
    }
    for (const b of lista) {
      if (await this.d.esDatosReales(o, b.nombre).catch(() => true)) {
        return { real: true, bases: new Set() };
      }
    }
    return { real: false, bases: new Set(lista.map((b) => b.nombre.toLowerCase())) };
  }

  /**
   * Ante la duda, ocultar. Una entrada solo tiene literal (y se normaliza con el modo laxo) si el
   * servidor no tiene datos reales, el registro la atribuye a una base que existe y el parser no
   * dudó de ella.
   */
  private fiable(ctx: { real: boolean; bases: Set<string> }, e: EntradaLentaCruda): boolean {
    return !ctx.real && e.base !== null && ctx.bases.has(e.base.toLowerCase()) && e.dudosa !== true;
  }

  /** Las más lentas primero, con el SQL normalizado. */
  async leer(o: ObjetivoBd): Promise<ConsultasLentasLeidas> {
    const motor = this.soloSql(o);
    const dialecto = motor === 'postgresql' ? 'postgresql' : 'mysql';
    const { entradas, recortado, sinArchivo } = await this.cruda(o);
    const orden = [...entradas].sort((x, y) => y.duracionMs - x.duracionMs);
    const tope = orden.slice(0, MAX_ENTRADAS_LENTAS);
    const ctx = await this.contexto(o);
    const salida: EntradaLenta[] = [];
    for (const e of tope) {
      // Modo estricto salvo en una entrada fiable: ante cualquier anomalía (o si el parser dudó),
      // el SQL no se enseña.
      const fiable = this.fiable(ctx, e);
      const sqlNormalizado =
        e.dudosa === true ? null : normalizarSql(e.sql, dialecto, { estricto: !fiable });
      salida.push({
        id: huella(e),
        duracionMs: e.duracionMs,
        filasExaminadas: e.filasExaminadas,
        base: e.base,
        fecha: e.fecha,
        sqlNormalizado,
        literalPermitido: fiable,
      });
    }
    return { entradas: salida, truncado: recortado || orden.length > tope.length, sinArchivo };
  }

  /**
   * El SQL tal cual de una entrada. Se rechaza (con un error del catálogo) si alguna base del
   * servidor es de un sitio con `datosReales`, si la entrada no se atribuye a una base que existe
   * o si el parser dudó de ella.
   */
  async literal(o: ObjetivoBd, id: string): Promise<string> {
    this.soloSql(o);
    const ctx = await this.contexto(o);
    if (ctx.real) {
      throw new ErrorWolf(
        'bd.lentas_literal_no_permitido',
        'No se muestra el SQL con sus valores: el servidor tiene bases con datos reales.',
      );
    }
    const { entradas } = await this.cruda(o);
    const e = entradas.find((x) => huella(x) === id);
    if (!e) {
      throw new ErrorWolf('bd.lentas_entrada_no_existe', 'Esa consulta ya no está en el registro.');
    }
    if (!this.fiable(ctx, e)) {
      throw new ErrorWolf(
        'bd.lentas_literal_no_permitido',
        'No se muestra el SQL con sus valores: no se puede atribuir con seguridad a una base.',
      );
    }
    return e.sql;
  }
}
