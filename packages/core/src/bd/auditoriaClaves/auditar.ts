import { ErrorWolf } from '../../errores';
import { motorDe, type ObjetivoBd } from '../basesDeDatos';
import { CONTRASENAS_COMUNES } from './comunes';
import {
  barajar,
  coincideAlguna,
  esFormatoDebil,
  formatoDe,
  tipoNoRevisable,
  type FormatoHash,
} from './hashes';
import { crearPool, type PoolBcrypt } from './poolBcrypt';
import { esBaseDelSistema, TablasSql, type ConsultaSql } from './tablas';

/** Filas que se revisan como máximo por auditoría. */
export const MAX_FILAS_AUDITORIA = 10_000;
/** Tiempo máximo de una auditoría (consulta incluida). */
export const PLAZO_AUDITORIA_MS = 60_000;
/** Pruebas a la vez de PBKDF2 y Argon2 (el pool de libuv tiene 4 hilos por omisión). */
const PARALELO_LIBUV = 4;

export type ModoConsulta = 'lectura' | 'escritura';

export interface OpcionesAuditar {
  instancia: ObjetivoBd;
  base: string;
  tabla: string;
  columnaUsuario: string;
  columnaHash: string;
  /** PostgreSQL: esquema de la tabla (por omisión `public`). */
  esquema?: string;
}

export interface CuentaDebil {
  usuario: string;
  /** `comun`: coincide con una contraseña muy común (cuál, nunca se dice). `formato_debil`: md5 o sha1 sin sal. */
  motivo: 'comun' | 'formato_debil';
}

export interface ResultadoAuditoria {
  revisadas: number;
  debiles: CuentaDebil[];
  /** Cuentas con un hash vacío o de un formato que no se revisa. */
  noRevisables: number;
  /** Cuántas hay de cada tipo no revisable (`vacio`, `md5crypt`, `sha512crypt`, `otro`…). */
  tiposNoRevisables: { tipo: string; cantidad: number }[];
  /** PostgreSQL: la tabla tiene seguridad por filas (RLS): puede que no se vean todas las cuentas. */
  rlsActiva: boolean;
  /** Quedaron cuentas sin revisar: más de 10 000 filas o se agotó el tiempo. */
  truncado: boolean;
}

export interface ProgresoAuditoria {
  revisadas: number;
  total: number;
}

export interface DepsAuditar {
  /** Abre una conexión a la base (en MySQL y PostgreSQL, con un usuario temporal limitado). */
  abrir(
    instancia: ObjetivoBd,
    base: string,
    modo: ModoConsulta,
    plazoMs: number,
  ): Promise<ConsultaSql>;
  /** Pruebas: reloj, comparador, pool y topes propios. */
  ahora?: () => number;
  coincide?: (hash: string, claves: readonly string[]) => Promise<boolean>;
  crearPool?: () => PoolBcrypt | null | Promise<PoolBcrypt | null>;
  plazoMs?: number;
  maxFilas?: number;
}

/** Orden de revisión: primero lo barato. */
const ORDEN: Record<FormatoHash, number> = {
  md5: 0,
  sha1: 0,
  phpass: 1,
  'django-pbkdf2': 2,
  argon2: 3,
  bcrypt: 4,
  desconocido: 5,
};

/** Cola con tope de tareas a la vez. */
function limitador(n: number): <T>(f: () => Promise<T>) => Promise<T> {
  let activas = 0;
  const espera: (() => void)[] = [];
  return async <T>(f: () => Promise<T>): Promise<T> => {
    if (activas >= n) await new Promise<void>((ok) => espera.push(ok));
    activas++;
    try {
      return await f();
    } finally {
      activas--;
      espera.shift()?.();
    }
  };
}

/** No se audita una base del sistema. */
export function exigirBaseDeUsuario(instancia: ObjetivoBd, base: string): void {
  if (esBaseDelSistema(motorDe(instancia) as ConsultaSql['motor'], base)) {
    throw new ErrorWolf(
      'auditoria.base_sistema',
      'No se audita una base del sistema: elija una base de un proyecto.',
    );
  }
}

/**
 * Revisa los hashes de una tabla de usuarios contra la lista corta de contraseñas comunes.
 * Solo lee y solo devuelve "débil o no": jamás cuál de las contraseñas coincidió, ni de forma
 * indirecta. La lista se mezcla de nuevo para cada hash (el orden y el tiempo no dicen nada).
 * El resultado y los errores no llevan ninguna contraseña ni hash.
 */
export async function auditar(
  d: DepsAuditar,
  o: OpcionesAuditar,
  senal?: AbortSignal,
  alProgreso?: (p: ProgresoAuditoria) => void,
): Promise<ResultadoAuditoria> {
  exigirBaseDeUsuario(o.instancia, o.base);
  const ahora = d.ahora ?? Date.now;
  const plazo = d.plazoMs ?? PLAZO_AUDITORIA_MS;
  const tope = d.maxFilas ?? MAX_FILAS_AUDITORIA;
  const limite = ahora() + plazo;
  let corte = false;
  const cancelado = (): boolean => senal?.aborted === true;
  const hayCorte = (): boolean => corte || ahora() > limite;
  const parar = (): boolean => cancelado() || hayCorte();
  const q = await d.abrir(o.instancia, o.base, 'lectura', plazo);
  let pool: PoolBcrypt | null = null;
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  try {
    const tablas = new TablasSql(q, o.base, o.esquema);
    const r = await tablas.resolver(o.tabla, o.columnaUsuario, o.columnaHash);
    const filas = await tablas.leer(r, tope);
    let truncado = filas.length > tope;
    const revisables = filas.slice(0, tope);

    // Cuentas que no se pueden revisar, por tipo.
    const tipos = new Map<string, number>();
    const trabajo: { idx: number; usuario: string; hash: string; formato: FormatoHash }[] = [];
    for (const [idx, f] of revisables.entries()) {
      const formato = formatoDe(f.hash ?? '');
      if (formato === 'desconocido') {
        const t = tipoNoRevisable(f.hash);
        tipos.set(t, (tipos.get(t) ?? 0) + 1);
      } else {
        trabajo.push({ idx, usuario: f.usuario, hash: f.hash!, formato });
      }
    }
    trabajo.sort((a, b) => ORDEN[a.formato] - ORDEN[b.formato] || a.idx - b.idx);
    const noRevisables = [...tipos.values()].reduce((s, n) => s + n, 0);
    alProgreso?.({ revisadas: 0, total: trabajo.length });

    const comparar =
      d.coincide ??
      ((hash: string, claves: readonly string[]) =>
        coincideAlguna(hash, claves, { pool, corte: parar }));
    if (!d.coincide && trabajo.some((t) => t.formato === 'bcrypt')) {
      pool = await (d.crearPool ?? crearPool)();
    }
    // Una prueba de bcrypt puede durar más que lo que queda de plazo: el temporizador real corta.
    temporizador = setTimeout(() => {
      corte = true;
      void pool?.cerrar();
    }, plazo);
    temporizador.unref?.();

    const enLibuv = limitador(PARALELO_LIBUV);
    const enPool = limitador(pool?.tamano ?? 1);
    const enHilo = limitador(1);
    const porHash = new Map<string, Promise<boolean | null>>();
    const resultado: (boolean | null)[] = Array.from({ length: trabajo.length }, () => null);
    let hechas = 0;

    const probar = (hash: string, formato: FormatoHash): Promise<boolean | null> => {
      let p = porHash.get(hash);
      if (!p) {
        const limitar =
          formato === 'bcrypt'
            ? enPool
            : formato === 'django-pbkdf2' || formato === 'argon2'
              ? enLibuv
              : enHilo;
        p = limitar(async () => {
          if (parar()) return null;
          try {
            return await comparar(hash, barajar(CONTRASENAS_COMUNES));
          } catch (e) {
            if (cancelado()) throw e;
            // Cortado por el plazo o por un fallo de un hilo: la cuenta queda sin revisar.
            return null;
          }
        });
        porHash.set(hash, p);
      }
      return p;
    };

    await Promise.all(
      trabajo.map(async (t, i) => {
        const v = await probar(t.hash, t.formato);
        resultado[i] = v;
        if (v !== null) alProgreso?.({ revisadas: ++hechas, total: trabajo.length });
      }),
    );
    if (cancelado()) throw new ErrorWolf('auditoria.cancelada', 'Auditoría cancelada.');

    const marcadas: (CuentaDebil & { idx: number })[] = [];
    let revisadas = 0;
    trabajo.forEach((t, i) => {
      const comun = resultado[i];
      if (comun === null || comun === undefined) {
        truncado = true;
        return;
      }
      revisadas++;
      if (comun) marcadas.push({ idx: t.idx, usuario: t.usuario, motivo: 'comun' });
      else if (esFormatoDebil(t.formato))
        marcadas.push({ idx: t.idx, usuario: t.usuario, motivo: 'formato_debil' });
    });
    // El orden de salida es el de la tabla, no el de revisión.
    const debiles: CuentaDebil[] = marcadas
      .sort((a, b) => a.idx - b.idx)
      .map(({ usuario, motivo }) => ({ usuario, motivo }));
    return {
      revisadas,
      debiles,
      noRevisables,
      tiposNoRevisables: [...tipos].map(([tipo, cantidad]) => ({ tipo, cantidad })),
      rlsActiva: r.rls,
      truncado,
    };
  } finally {
    if (temporizador) clearTimeout(temporizador);
    await pool?.cerrar().catch(() => undefined);
    await q.cerrar().catch(() => undefined);
  }
}
