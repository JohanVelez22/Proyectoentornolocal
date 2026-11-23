import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rutas } from '../rutas';
import type { ServicioInstalable, VersionDisponible } from './catalogo';
import type { Validadores } from './fuentes/tipos';

export interface IndiceGuardado {
  servicio: ServicioInstalable;
  /** ISO de cuando se consultó el índice. */
  fecha: string;
  /** Crudas: quien las lee las vuelve a validar (el archivo pudo cambiar en disco). */
  versiones: unknown;
  /** ETag y Last-Modified del índice (para pedirlo condicional). */
  validadores?: Validadores;
  /** Notas de la fuente (cadenas cortas). */
  notas?: Record<string, string>;
}

/** Solo cadenas cortas: el archivo pudo cambiar en disco. */
function cadenas(x: unknown, max: number): Record<string, string> | undefined {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return undefined;
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (typeof v === 'string' && v.length <= max && k.length <= 64) r[k] = v;
  }
  return Object.keys(r).length > 0 ? r : undefined;
}

/**
 * Caché de índices ya interpretados en `run/catalogo/<servicio>.json`. No valida: quien lee
 * (`CatalogoVivo`) pasa las versiones por `validarIndice` antes de usarlas.
 */
export class CacheIndice {
  constructor(private readonly rutas: Rutas) {}

  async leer(servicio: ServicioInstalable): Promise<IndiceGuardado | null> {
    let texto: string;
    try {
      texto = await readFile(this.rutas.cacheCatalogo(servicio), 'utf8');
    } catch {
      return null;
    }
    try {
      const d = JSON.parse(texto) as Partial<IndiceGuardado> | null;
      if (!d || d.servicio !== servicio || typeof d.fecha !== 'string') return null;
      if (Number.isNaN(Date.parse(d.fecha))) return null;
      const val = cadenas(d.validadores, 200);
      const validadores: Validadores = {};
      if (val?.['etag']) validadores.etag = val['etag'];
      if (val?.['ultimaModificacion']) validadores.ultimaModificacion = val['ultimaModificacion'];
      const notas = cadenas(d.notas, 200);
      return {
        servicio,
        fecha: d.fecha,
        versiones: d.versiones,
        ...(Object.keys(validadores).length > 0 ? { validadores } : {}),
        ...(notas ? { notas } : {}),
      };
    } catch {
      return null;
    }
  }

  async guardar(
    servicio: ServicioInstalable,
    fecha: string,
    versiones: VersionDisponible[],
    extra: { validadores?: Validadores; notas?: Record<string, string> } = {},
  ): Promise<void> {
    const destino = this.rutas.cacheCatalogo(servicio);
    await mkdir(path.dirname(destino), { recursive: true });
    const tmp = `${destino}.${randomUUID().slice(0, 8)}.tmp`;
    try {
      await writeFile(tmp, JSON.stringify({ servicio, fecha, versiones, ...extra }), 'utf8');
      await rename(tmp, destino);
    } catch (e) {
      await rm(tmp, { force: true }).catch(() => undefined);
      throw e;
    }
  }
}
