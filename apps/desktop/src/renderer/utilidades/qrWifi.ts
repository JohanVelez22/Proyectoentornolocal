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
  // Un nombre que parece hexadecimal se confundiría con una clave en hexadecimal: va entre comillas.
  const ssid = /^[0-9a-fA-F]+$/.test(o.ssid) ? `"${o.ssid}"` : escaparWifi(o.ssid);
  const partes = [`T:${o.seguridad}`, `S:${ssid}`];
  if (o.seguridad !== 'nopass') partes.push(`P:${escaparWifi(o.clave)}`);
  if (o.oculta) partes.push('H:true');
  return `WIFI:${partes.join(';')};;`;
}

export type ErrorWifi = 'ssid' | 'clave' | 'claveWpa';

/** Qué falta o sobra antes de generar el código (null = todo bien). */
export function errorWifi(o: Pick<DatosWifi, 'ssid' | 'clave' | 'seguridad'>): ErrorWifi | null {
  // El SSID mide hasta 32 BYTES (no caracteres): una letra con tilde ocupa 2 en UTF-8.
  const bytesSsid = new TextEncoder().encode(o.ssid).length;
  if (bytesSsid < 1 || bytesSsid > 32) return 'ssid';
  if (o.seguridad === 'nopass') return null;
  if (o.clave.length === 0) return 'clave';
  // WPA: frase de 8 a 63 caracteres, o la clave precompartida (PSK) de 64 hexadecimales.
  if (o.seguridad === 'WPA') {
    const psk = o.clave.length === 64 && /^[0-9a-fA-F]{64}$/.test(o.clave);
    if (!psk && (o.clave.length < 8 || o.clave.length > 63)) return 'claveWpa';
  }
  return null;
}
