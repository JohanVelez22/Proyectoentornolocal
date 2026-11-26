/**
 * Texto del QR de Wi-Fi (`WIFI:T:WPA;S:red;P:clave;;`). La contraseña la escribe el usuario: este
 * módulo es puro, no lee nada del sistema y no guarda ni registra lo que recibe.
 */

export type SeguridadWifi = 'WPA' | 'WEP' | 'nopass';

export interface DatosWifi {
  ssid: string;
  clave: string;
  seguridad: SeguridadWifi;
  oculta: boolean;
}

/** `\ ; , : "` llevan barra delante. La barra va primero para no escapar dos veces. */
export function escaparWifi(valor: string): string {
  return valor.replace(/[\\;,:"]/g, (c) => `\\${c}`);
}

/** Texto para el QR. Una red abierta no lleva `P:` aunque quede algo escrito en el campo. */
export function textoQrWifi(o: DatosWifi): string {
  const partes = [`T:${o.seguridad}`, `S:${escaparWifi(o.ssid)}`];
  if (o.seguridad !== 'nopass') partes.push(`P:${escaparWifi(o.clave)}`);
  if (o.oculta) partes.push('H:true');
  return `WIFI:${partes.join(';')};;`;
}

export type ErrorWifi = 'ssid' | 'clave' | 'claveWpa';

/** Qué falta o sobra antes de generar el código (null = todo bien). */
export function errorWifi(o: Pick<DatosWifi, 'ssid' | 'clave' | 'seguridad'>): ErrorWifi | null {
  if (o.ssid.length < 1 || o.ssid.length > 32) return 'ssid';
  if (o.seguridad === 'nopass') return null;
  if (o.clave.length === 0) return 'clave';
  if (o.seguridad === 'WPA' && (o.clave.length < 8 || o.clave.length > 63)) return 'claveWpa';
  return null;
}
