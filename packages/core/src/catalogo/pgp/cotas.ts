import vigenciaFijada from '../claves/vigencia.json' with { type: 'json' };
import { compararVersionesDesc } from '../comun';
import type { FuenteFirma } from '../huellas';

/**
 * Cota de fecha de las firmas, fijada en la app junto con los anillos (D10, segunda revisión).
 *
 * El problema: una clave vencida (o robada después de vencer) puede firmar con una fecha de
 * creación retrasada, de cuando aún era vigente, y la regla "vigente al firmar" la aceptaría. La
 * fecha de publicación de `index.json` no basta: la controla el mismo servidor.
 *
 * La solución: `actualizar-claves-pgp.mjs` guarda en `claves/vigencia.json` la fecha en que se
 * fijaron los anillos (`fecha`, FECHA_ANILLO) y, por rama, la versión más nueva publicada ese día.
 * Una versión **más nueva** que la fijada de su rama (o de una rama desconocida) salió después de
 * FECHA_ANILLO, así que su firma debe ser de FECHA_ANILLO − 48 h o posterior; las versiones
 * conocidas no tienen esta cota. La publicación de la fuente (Node) se suma como cota extra, y una
 * versión más nueva de Node sin publicación se rechaza.
 */
export interface VigenciaAnillo {
  /** FECHA_ANILLO (AAAA-MM-DD). */
  fecha: string;
  /** Versión más nueva conocida por rama (Node: mayor; Composer y Nginx: mayor.menor). */
  node: Readonly<Record<string, string>>;
  composer: Readonly<Record<string, string>>;
  nginx: Readonly<Record<string, string>>;
  phpmyadmin: Readonly<Record<string, string>>;
}

export const VIGENCIA_FIJADA: VigenciaAnillo = vigenciaFijada;

/** Margen de las cotas (relojes, firmas preparadas antes de publicar). */
export const MARGEN_COTA_MS = 48 * 60 * 60 * 1000;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Rama con la que se compara: Node por mayor; Composer y Nginx por mayor.menor. */
export function ramaDeFirma(fuente: FuenteFirma, version: string): string | null {
  const m = /^(\d+)\.(\d+)/.exec(version);
  if (!m) return null;
  return fuente === 'node' ? String(Number(m[1])) : `${Number(m[1])}.${Number(m[2])}`;
}

export type CotaFirma = { ok: true; noAntesDe?: Date } | { ok: false; detalle: string };

/** Fecha mínima de creación de la firma de una versión, o un rechazo (falla cerrado). */
export function cotaFirma(
  fuente: FuenteFirma,
  v: { version: string; publicacion?: string },
  vigencia: VigenciaAnillo = VIGENCIA_FIJADA,
): CotaFirma {
  const cotas: number[] = [];
  const publicacion =
    v.publicacion && FECHA.test(v.publicacion) ? Date.parse(`${v.publicacion}T00:00:00Z`) : NaN;
  if (Number.isFinite(publicacion)) cotas.push(publicacion - MARGEN_COTA_MS);

  const rama = ramaDeFirma(fuente, v.version);
  const tabla = vigencia[fuente];
  const fijada = rama !== null && Object.hasOwn(tabla, rama) ? tabla[rama] : undefined;
  const masNueva = fijada === undefined || compararVersionesDesc(v.version, fijada) < 0;
  if (masNueva) {
    if (fuente === 'node' && !Number.isFinite(publicacion)) {
      return {
        ok: false,
        detalle: `${v.version} es posterior a las claves fijadas y la fuente no da su fecha de publicación`,
      };
    }
    const fecha = FECHA.test(vigencia.fecha) ? Date.parse(`${vigencia.fecha}T00:00:00Z`) : NaN;
    if (!Number.isFinite(fecha)) return { ok: false, detalle: 'Fecha de los anillos no válida' };
    cotas.push(fecha - MARGEN_COTA_MS);
  }
  return cotas.length > 0 ? { ok: true, noAntesDe: new Date(Math.max(...cotas)) } : { ok: true };
}
