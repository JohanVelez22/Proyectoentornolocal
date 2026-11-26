import type { ConexionActiva } from './tipos';

export type ProtocoloPuerto = 'TCP' | 'UDP';

/** Un socket en escucha (TCP) o abierto (UDP) según `netstat -ano`. */
export interface FilaNetstat {
  protocolo: ProtocoloPuerto;
  /** Dirección local sin corchetes (`0.0.0.0`, `::`, `127.0.0.1`, `fe80::1%12`). */
  direccion: string;
  puerto: number;
  pid: number;
}

const separarDireccion = (local: string): { direccion: string; puerto: number } | null => {
  const i = local.lastIndexOf(':');
  const texto = local.slice(i + 1);
  if (i <= 0 || !/^\d{1,5}$/.test(texto)) return null;
  const puerto = Number(texto);
  if (puerto > 65535) return null;
  return { direccion: local.slice(0, i).replace(/^\[(.*)\]$/, '$1'), puerto };
};

/**
 * Todos los TCP en escucha y los UDP abiertos de `netstat -ano`, en el orden de la salida. No
 * depende del texto (localizado) del estado: un TCP en escucha es el que no tiene destino remoto.
 */
export function interpretarNetstatTodos(salida: string): FilaNetstat[] {
  const res: FilaNetstat[] = [];
  const vistos = new Set<string>();
  for (const linea of salida.split(/\r?\n/)) {
    const c = linea.trim().split(/\s+/);
    const proto = c[0]?.toUpperCase();
    let protocolo: ProtocoloPuerto;
    if (proto === 'TCP') {
      if (c.length < 5 || !['0.0.0.0:0', '[::]:0', '*:*'].includes(c[2] ?? '')) continue;
      protocolo = 'TCP';
    } else if (proto === 'UDP') {
      if (c.length < 4 || c[2] !== '*:*') continue;
      protocolo = 'UDP';
    } else continue;
    const dir = separarDireccion(c[1] ?? '');
    const pidTexto = c[c.length - 1] ?? '';
    const pid = Number(pidTexto);
    if (!dir || !/^\d+$/.test(pidTexto) || !Number.isSafeInteger(pid)) continue;
    const clave = `${protocolo}|${dir.direccion}|${dir.puerto}|${pid}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    res.push({ protocolo, ...dir, pid });
  }
  return res;
}

/** Todas las filas "nombre","pid" de `tasklist /FO CSV /NH`. */
export function interpretarTasklistTodos(salida: string): Map<number, string> {
  const res = new Map<number, string>();
  for (const linea of salida.split(/\r?\n/)) {
    const m = /^"([^"]*)","(\d+)"/.exec(linea.trim());
    if (m) res.set(Number(m[2]), m[1] ?? '');
  }
  return res;
}

export function interpretarTasklist(salida: string): { pid: number; nombre: string } | null {
  for (const linea of salida.split(/\r?\n/)) {
    const m = /^"([^"]*)","(\d+)"/.exec(linea.trim());
    if (m) return { pid: Number(m[2]), nombre: m[1] ?? '' };
  }
  return null;
}

/** Estados TCP que ya no son una conversación en curso (los nombres en inglés no se traducen). */
const ESTADOS_INACTIVOS =
  /^(TIME_WAIT|CLOSE_WAIT|FIN_WAIT_?[12]|LAST_ACK|CLOSING|SYN_SENT|SYN_RCVD|SYN_RECEIVED|CLOSED|DELETE_TCB|BOUND)$/i;

/**
 * Conexiones TCP en curso de `netstat -ano`: las que tienen destino remoto y no están cerrándose.
 * El texto del estado sale localizado ("ESTABLECIDO"), así que por prudencia cuenta como en curso
 * cualquier estado que no sea uno de los conocidos de cierre o de espera.
 */
export function interpretarNetstatEstablecidas(salida: string): ConexionActiva[] {
  const res: ConexionActiva[] = [];
  for (const linea of salida.split(/\r?\n/)) {
    const c = linea.trim().split(/\s+/);
    if (c[0]?.toUpperCase() !== 'TCP' || c.length < 5) continue;
    const local = separarDireccion(c[1] ?? '');
    const remoto = separarDireccion(c[2] ?? '');
    const pidTexto = c[c.length - 1] ?? '';
    if (!local || !remoto || remoto.puerto === 0 || !/^\d+$/.test(pidTexto)) continue;
    if (ESTADOS_INACTIVOS.test(c[3] ?? '')) continue;
    res.push({ puertoLocal: local.puerto, puertoRemoto: remoto.puerto, pid: Number(pidTexto) });
  }
  return res;
}
