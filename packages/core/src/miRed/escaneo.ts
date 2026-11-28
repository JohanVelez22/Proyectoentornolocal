import { ipsDelRango, ipv4ANumero, type RangoEscaneo } from './rfc1918';

/**
 * Descubrimiento de equipos por ping (D53): solo ICMP, nunca puertos. Concurrencia limitada,
 * plazo corto por equipo y cancelable. Quien llama ya validó el rango (`rangoDeEscaneo`); aun así
 * aquí solo se recorren las IP de ese rango.
 */

/** Pings simultáneos como máximo: no se satura la red ni el equipo. */
export const CONCURRENCIA_ESCANEO = 32;
/** Plazo por equipo (ms): una red local responde en milisegundos. */
export const PLAZO_PING_ESCANEO_MS = 800;

export interface OpcionesEscaneo {
  rango: RangoEscaneo;
  /** Ping de un solo paquete: tiempo en ms si respondió, null si no. */
  ping: (ip: string, senal: AbortSignal) => Promise<number | null>;
  /** Cuántos a la vez (1 a 32); por defecto 32. */
  concurrencia?: number;
  senal?: AbortSignal;
  /** Cada vez que termina un equipo. */
  alAvanzar?: (revisados: number, total: number) => void;
  /** Pausa (ms) de cada trabajador entre un ping y el siguiente, para ir con calma. */
  pausaMs?: number;
}

export interface EquipoVivo {
  ip: string;
  ms: number;
}

export interface ResultadoEscaneo {
  vivos: EquipoVivo[];
  revisados: number;
  total: number;
  cancelado: boolean;
}

const dormir = (ms: number, senal: AbortSignal): Promise<void> =>
  new Promise((resolver) => {
    if (ms <= 0 || senal.aborted) return resolver();
    const t = setTimeout(done, ms);
    function done(): void {
      clearTimeout(t);
      senal.removeEventListener('abort', done);
      resolver();
    }
    senal.addEventListener('abort', done, { once: true });
  });

/**
 * Hace ping a cada IP del rango (menos la del propio equipo) con un tope de trabajadores. Al
 * cancelar no se lanzan más pings y se espera a los que ya iban; el resultado trae lo encontrado
 * hasta entonces con `cancelado: true`. Un ping que falla cuenta como «sin respuesta».
 */
export async function escanearRango(o: OpcionesEscaneo): Promise<ResultadoEscaneo> {
  const ips = ipsDelRango(o.rango);
  const trabajadores = Math.max(
    1,
    Math.min(CONCURRENCIA_ESCANEO, Math.trunc(o.concurrencia ?? CONCURRENCIA_ESCANEO)),
  );
  const interna = new AbortController();
  const alCancelar = (): void => interna.abort();
  if (o.senal?.aborted) interna.abort();
  else o.senal?.addEventListener('abort', alCancelar, { once: true });

  const vivos: EquipoVivo[] = [];
  let siguiente = 0;
  let revisados = 0;

  async function trabajar(): Promise<void> {
    while (!interna.signal.aborted && siguiente < ips.length) {
      const ip = ips[siguiente++]!;
      let ms: number | null = null;
      try {
        ms = await o.ping(ip, interna.signal);
      } catch {
        ms = null;
      }
      // Lo que respondió justo al cancelar se descarta: el escaneo dice «cancelado», no «completo».
      if (interna.signal.aborted) break;
      revisados++;
      if (ms !== null) vivos.push({ ip, ms });
      o.alAvanzar?.(revisados, ips.length);
      await dormir(o.pausaMs ?? 0, interna.signal);
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(trabajadores, ips.length) }, trabajar));
  } finally {
    o.senal?.removeEventListener('abort', alCancelar);
  }
  vivos.sort((a, b) => (ipv4ANumero(a.ip) ?? 0) - (ipv4ANumero(b.ip) ?? 0));
  return { vivos, revisados, total: ips.length, cancelado: interna.signal.aborted };
}
