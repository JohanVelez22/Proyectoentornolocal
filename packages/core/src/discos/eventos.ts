import { sanearTextoSistema } from './privacidad';
import type { EventoDisco, GravedadEvento } from './tipos';

/** Registro, proveedores e identificadores que se leen (D57). Solo lectura del registro System. */
export const PROVEEDORES_EVENTO_DISCO = ['disk', 'Ntfs', 'stornvme', 'storahci', 'volmgr'] as const;
export const IDS_EVENTO_DISCO = [7, 11, 51, 52, 55, 129, 153, 157] as const;
export const DIAS_EVENTOS_DISCO = 30;
export const MAX_EVENTOS_DISCO = 200;

/** Qué significa cada identificador y cuánto pesa. La explicación traducida vive en la interfaz. */
export const GRAVEDAD_EVENTO: Record<number, GravedadEvento> = {
  7: 'critico',
  11: 'aviso',
  51: 'aviso',
  52: 'critico',
  55: 'critico',
  129: 'aviso',
  153: 'info',
  157: 'aviso',
};

const MAX_DETALLE = 300;

/**
 * Fecha de un evento a ISO (UTC). Acepta lo que emite el script (ISO) y, por si el sistema lo
 * entregara de otra forma, `/Date(ms)/` (JSON de Windows PowerShell) y `dd.mm.aaaa hh:mm:ss`. Una
 * fecha con barras (`27/11/2026`) es ambigua entre idiomas y se descarta antes que adivinarla.
 */
export function fechaDeEvento(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof v !== 'string') return null;
  const t = v.trim();
  const ms = /^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/.exec(t);
  if (ms) return fechaDeEvento(Number(ms[1]));
  if (/^\d{4}-\d{2}-\d{2}T/.test(t)) {
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const punto = /^(\d{1,2})\.(\d{1,2})\.(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (punto) {
    const [, d, m, a, h, mi, s] = punto;
    const f = new Date(Date.UTC(+a!, +m! - 1, +d!, +h!, +mi!, s ? +s : 0));
    return Number.isNaN(f.getTime()) ? null : f.toISOString();
  }
  return null;
}

/** De qué disco o unidad habla el evento, solo si lo dice con claridad. */
export function discoDelEvento(mensaje: string): EventoDisco['disco'] {
  const disco = /\\Device\\Harddisk(\d{1,3})\\DR\d+/i.exec(mensaje);
  if (disco) return { tipo: 'disco', valor: disco[1]! };
  const unidad = /(?:^|[^A-Za-z0-9\\])([A-Za-z]):(?![\\/A-Za-z0-9])/.exec(mensaje);
  if (unidad) return { tipo: 'unidad', valor: `${unidad[1]!.toUpperCase()}:` };
  return null;
}

const entero = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isInteger(n) ? n : null;
};

/**
 * Interpreta la salida JSON del script de eventos (`[{ f, id, p, m }]`). Lo que no se entiende se
 * descarta; los más recientes primero y como mucho `max`. Nunca lanza.
 */
export function interpretarEventosDisco(stdout: string, max = MAX_EVENTOS_DISCO): EventoDisco[] {
  let crudo: unknown;
  try {
    crudo = JSON.parse(stdout.trim());
  } catch {
    return [];
  }
  const lista = Array.isArray(crudo) ? crudo : crudo && typeof crudo === 'object' ? [crudo] : [];
  const res: EventoDisco[] = [];
  for (const x of lista) {
    if (typeof x !== 'object' || x === null) continue;
    const o = x as Record<string, unknown>;
    const id = entero(o['id']);
    const fecha = fechaDeEvento(o['f']);
    if (id === null || fecha === null || !(id in GRAVEDAD_EVENTO)) continue;
    const proveedor = typeof o['p'] === 'string' ? o['p'].trim() : '';
    if (
      !(PROVEEDORES_EVENTO_DISCO as readonly string[]).some(
        (p) => p.toLowerCase() === proveedor.toLowerCase(),
      )
    ) {
      continue;
    }
    const mensaje = typeof o['m'] === 'string' ? o['m'] : '';
    res.push({
      fecha,
      id,
      proveedor: PROVEEDORES_EVENTO_DISCO.find((p) => p.toLowerCase() === proveedor.toLowerCase())!,
      codigo: `disco_${id}`,
      gravedad: GRAVEDAD_EVENTO[id]!,
      disco: discoDelEvento(mensaje),
      detalle: sanearTextoSistema(mensaje, MAX_DETALLE),
    });
  }
  res.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  return res.slice(0, max);
}
