import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rutas } from '../rutas';
import type { ServicioInstalable, VersionDisponible } from './catalogo';

export interface IndiceGuardado {
  servicio: ServicioInstalable;
  /** ISO de cuando se consultó el índice. */
  fecha: string;
  /** Crudas: quien las lee las vuelve a validar (el archivo pudo cambiar en disco). */
  versiones: unknown;
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
      return { servicio, fecha: d.fecha, versiones: d.versiones };
    } catch {
      return null;
    }
  }

  async guardar(
    servicio: ServicioInstalable,
    fecha: string,
    versiones: VersionDisponible[],
  ): Promise<void> {
    const destino = this.rutas.cacheCatalogo(servicio);
    await mkdir(path.dirname(destino), { recursive: true });
    const tmp = `${destino}.${randomUUID().slice(0, 8)}.tmp`;
    try {
      await writeFile(tmp, JSON.stringify({ servicio, fecha, versiones }), 'utf8');
      await rename(tmp, destino);
    } catch (e) {
      await rm(tmp, { force: true }).catch(() => undefined);
      throw e;
    }
  }
}
