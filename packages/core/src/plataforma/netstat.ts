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
