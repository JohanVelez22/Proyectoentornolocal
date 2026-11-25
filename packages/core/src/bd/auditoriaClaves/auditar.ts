import { setImmediate as ceder } from 'node:timers/promises';
import { ErrorWolf } from '../../errores';
import type { ObjetivoBd } from '../basesDeDatos';
import { CONTRASENAS_COMUNES } from './comunes';
import { coincide as coincideHash, esFormatoDebil, formatoDe } from './hashes';
import { TablasSql, type ConsultaSql } from './tablas';

/** Filas que se revisan como máximo por auditoría. */
export const MAX_FILAS_AUDITORIA = 10_000;
/** Tiempo máximo de una auditoría (consulta incluida). */
export const PLAZO_AUDITORIA_MS = 60_000;

export type ModoConsulta = 'lectura' | 'escritura';

export interface OpcionesAuditar {
  instancia: ObjetivoBd;
  base: string;
  tabla: string;
  columnaUsuario: string;
  columnaHash: string;
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
  /** Quedaron cuentas sin revisar: más de 10 000 filas o se agotó el tiempo. */
  truncado: boolean;
}

export interface DepsAuditar {
  /** Abre una conexión a la base (en MySQL, con un usuario temporal limitado). */
  abrir(
    instancia: ObjetivoBd,
    base: string,
    modo: ModoConsulta,
    plazoMs: number,
  ): Promise<ConsultaSql>;
  /** Pruebas: reloj y comparador propios. */
  ahora?: () => number;
  coincide?: (hash: string, clave: string) => Promise<boolean>;
  plazoMs?: number;
  maxFilas?: number;
}

/**
 * Revisa los hashes de una tabla de usuarios contra la lista corta de contraseñas comunes.
 * Solo lee (`SELECT` con tope de filas y de tiempo) y solo devuelve "débil o no": jamás cuál de
 * las contraseñas coincidió, ni siquiera de forma indirecta. El resultado y los errores no
 * llevan ninguna contraseña ni hash.
 */
export async function auditar(
  d: DepsAuditar,
  o: OpcionesAuditar,
  senal?: AbortSignal,
): Promise<ResultadoAuditoria> {
  const ahora = d.ahora ?? Date.now;
  const comparar = d.coincide ?? coincideHash;
  const plazo = d.plazoMs ?? PLAZO_AUDITORIA_MS;
  const tope = d.maxFilas ?? MAX_FILAS_AUDITORIA;
  const limite = ahora() + plazo;
  const q = await d.abrir(o.instancia, o.base, 'lectura', plazo);
  try {
    const tablas = new TablasSql(q, o.base);
    const r = await tablas.resolver(o.tabla, o.columnaUsuario, o.columnaHash);
    const filas = await tablas.leer(r, tope);
    let truncado = filas.length > tope;
    const revisables = filas.slice(0, tope);

    const debiles: CuentaDebil[] = [];
    let revisadas = 0;
    let noRevisables = 0;
    // Mismo hash, mismo resultado: una cuenta duplicada no repite el trabajo.
    const vistos = new Map<string, boolean>();
    let ultimoTurno = ahora();

    for (const f of revisables) {
      if (senal?.aborted) {
        throw new ErrorWolf('auditoria.cancelada', 'Auditoría cancelada.');
      }
      const hash = f.hash ?? '';
      const formato = formatoDe(hash);
      if (formato === 'desconocido') {
        noRevisables++;
        continue;
      }
      if (ahora() > limite) {
        truncado = true;
        break;
      }
      let comun = vistos.get(hash);
      if (comun === undefined) {
        comun = false;
        let completa = true;
        for (const c of CONTRASENAS_COMUNES) {
          if (await comparar(hash, c)) {
            comun = true;
            break;
          }
          // Cede el control al menos cada 20 ms (bcrypt y PBKDF2 son lentos a propósito).
          if (ahora() - ultimoTurno > 20) {
            await ceder();
            ultimoTurno = ahora();
          }
          if (ahora() > limite) {
            completa = false;
            break;
          }
        }
        if (!completa) {
          truncado = true;
          break;
        }
        vistos.set(hash, comun);
      }
      revisadas++;
      if (comun) debiles.push({ usuario: f.usuario, motivo: 'comun' });
      else if (esFormatoDebil(formato))
        debiles.push({ usuario: f.usuario, motivo: 'formato_debil' });
    }
    return { revisadas, debiles, noRevisables, truncado };
  } finally {
    await q.cerrar().catch(() => undefined);
  }
}
