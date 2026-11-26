import { createHash } from 'node:crypto';
import { mkdir, open } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../../errores';
import type { Rutas } from '../../rutas';
import type { IdInstancia, IdServicioDatos } from '../../tipos';
import type { ObjetivoBd } from '../basesDeDatos';
import { motorDe } from '../basesDeDatos';
import {
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
  /** SQL con los literales cambiados por `?`. Es lo único que se entrega por defecto. */
  sqlNormalizado: string;
  /** Se puede pedir el SQL tal cual (la base es conocida y no tiene datos reales). */
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
 * normalizado (sin literales); el literal solo se entrega si la base es conocida y no pertenece a
 * un sitio con `datosReales`. Nada de esto va a logs, ni a la CLI ni al MCP.
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
      if (motor !== 'postgresql') await mkdir(path.dirname(archivo), { recursive: true });
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
    return this.estado(o);
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

  /** ¿Se puede mostrar el literal de una entrada? Base conocida y sin datos reales. */
  private async literalPermitido(
    o: ObjetivoBd,
    e: EntradaLentaCruda,
    conocidas: Set<string>,
    memo: Map<string, boolean>,
  ): Promise<boolean> {
    if (e.base === null || !conocidas.has(e.base.toLowerCase())) return false;
    const k = e.base.toLowerCase();
    let v = memo.get(k);
    if (v === undefined) {
      v = !(await this.d.esDatosReales(o, e.base).catch(() => true));
      memo.set(k, v);
    }
    return v;
  }

  private async basesConocidas(o: ObjetivoBd): Promise<Set<string>> {
    try {
      return new Set((await this.d.bd.listar(o)).map((b) => b.nombre.toLowerCase()));
    } catch {
      return new Set();
    }
  }

  /** Las más lentas primero, con el SQL normalizado. */
  async leer(o: ObjetivoBd): Promise<ConsultasLentasLeidas> {
    const motor = this.soloSql(o);
    const dialecto = motor === 'postgresql' ? 'postgresql' : 'mysql';
    const { entradas, recortado, sinArchivo } = await this.cruda(o);
    const orden = [...entradas].sort((x, y) => y.duracionMs - x.duracionMs);
    const tope = orden.slice(0, MAX_ENTRADAS_LENTAS);
    const conocidas = await this.basesConocidas(o);
    const memo = new Map<string, boolean>();
    const salida: EntradaLenta[] = [];
    for (const e of tope) {
      salida.push({
        id: huella(e),
        duracionMs: e.duracionMs,
        filasExaminadas: e.filasExaminadas,
        base: e.base,
        fecha: e.fecha,
        sqlNormalizado: normalizarSql(e.sql, dialecto),
        literalPermitido: await this.literalPermitido(o, e, conocidas, memo),
      });
    }
    return { entradas: salida, truncado: recortado || orden.length > tope.length, sinArchivo };
  }

  /**
   * El SQL tal cual de una entrada. Se rechaza (con un error del catálogo) si la base es de un
   * sitio con `datosReales` o si la entrada no se puede atribuir a una base conocida.
   */
  async literal(o: ObjetivoBd, id: string): Promise<string> {
    this.soloSql(o);
    const { entradas } = await this.cruda(o);
    const e = entradas.find((x) => huella(x) === id);
    if (!e) {
      throw new ErrorWolf('bd.lentas_entrada_no_existe', 'Esa consulta ya no está en el registro.');
    }
    const permitido = await this.literalPermitido(
      o,
      e,
      await this.basesConocidas(o),
      new Map<string, boolean>(),
    );
    if (!permitido) {
      throw new ErrorWolf(
        'bd.lentas_literal_no_permitido',
        'No se muestra el SQL con sus valores: la base tiene datos reales o no se puede atribuir.',
      );
    }
    return e.sql;
  }
}
