import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { esErrorWolf } from '../../errores';
import type { RangoPuertos } from '../../plataforma/tipos';
import type { DepsDoctor, ResultadoReparacion } from '../tipos';

/** Un puerto que usa (o usará al encenderse) un servicio instalado de WolfCore Dev. */
export interface PuertoServicio {
  /** Id del servicio (`nginx`, `mysql`…) o `https` para el puerto HTTPS de Nginx. */
  servicio: string;
  puerto: number;
}

/** Puertos de los servicios instalados (y el HTTPS si Nginx está instalado). */
export async function puertosDeServicios(d: DepsDoctor): Promise<PuertoServicio[]> {
  const res: PuertoServicio[] = [];
  const vistos = new Set<number>();
  const agregar = (servicio: string, puerto: number): void => {
    if (vistos.has(puerto)) return;
    vistos.add(puerto);
    res.push({ servicio, puerto });
  };
  for (const s of await d.servicios()) {
    if (s.version === null) continue;
    for (const p of s.puertos) agregar(s.id, p);
    if (s.id === 'nginx') agregar('https', await d.puertoHttps());
  }
  return res;
}

/** PIDs de WolfCore Dev: la app, los servicios supervisados y todos sus descendientes. */
export async function pidsPropios(d: DepsDoctor): Promise<Set<number>> {
  const raiz = (await d.servicios()).map((s) => s.pid).filter((p): p is number => p !== null);
  const res = new Set<number>([process.pid, ...raiz]);
  try {
    for (const hijos of (await d.plataforma.descendientes(raiz)).values()) {
      for (const h of hijos) res.add(h);
    }
  } catch {
    // sin árbol de procesos: solo cuentan los PID directos
  }
  return res;
}

export const enRango = (puerto: number, rangos: RangoPuertos[]): RangoPuertos | undefined =>
  rangos.find((r) => puerto >= r.desde && puerto <= r.hasta);

/**
 * Primer puerto libre para mover un servicio: 80 → 8080…, 443 → 8443…, el resto desde el
 * siguiente. Evita los rangos reservados, los puertos ya asignados y los ocupados.
 */
export async function puertoAlternativo(
  d: DepsDoctor,
  actual: number,
  o: { rangos: RangoPuertos[]; evitar: Iterable<number> },
): Promise<number | null> {
  const evitar = new Set([...o.evitar, ...(await d.puertosPropios())]);
  const desde = actual === 80 ? 8080 : actual === 443 ? 8443 : actual + 1;
  for (let p = Math.max(1024, desde); p <= Math.min(65535, desde + 1000); p++) {
    if (p === actual || evitar.has(p) || enRango(p, o.rangos)) continue;
    if (await d.probarPuerto(p)) return p;
  }
  return null;
}

/** Código del error que ya trae código (ErrorWolf), o el genérico de reparación fallida. */
export const fallo = (e: unknown): ResultadoReparacion => ({
  ok: false,
  codigo: esErrorWolf(e) ? e.codigo : 'doctor.reparacion_fallida',
});

/** Traduce el resultado de una escritura de la plataforma. */
export function segunEscritura(
  r: { ok: true } | { ok: false; motivo: string },
): ResultadoReparacion {
  if (r.ok) return { ok: true };
  if (r.motivo === 'cancelado') return { ok: false, codigo: 'doctor.reparacion_cancelada' };
  if (r.motivo === 'tiempo') return { ok: false, codigo: 'hosts.tiempo_agotado' };
  if (r.motivo === 'denegado') return { ok: false, codigo: 'doctor.reparacion_denegada' };
  return { ok: false, codigo: 'doctor.reparacion_fallida' };
}

/** Guarda `contenido` como `<prefijo>-<fecha>.txt` en la carpeta de respaldos (nunca pisa otra). */
export async function copiaConFecha(
  d: DepsDoctor,
  prefijo: string,
  contenido: string | Buffer,
): Promise<string> {
  await mkdir(d.carpetaRespaldos, { recursive: true });
  const fecha = (d.ahora?.() ?? new Date()).toISOString().replace(/[:.]/g, '-');
  for (let n = 0; ; n++) {
    const ruta = path.join(d.carpetaRespaldos, `${prefijo}-${fecha}${n ? `-${n}` : ''}.txt`);
    try {
      await writeFile(ruta, contenido, { flag: 'wx' });
      return ruta;
    } catch (e) {
      if ((e as { code?: string }).code !== 'EEXIST' || n > 100) throw e;
    }
  }
}
