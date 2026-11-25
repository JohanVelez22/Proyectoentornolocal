import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import nodemailer from 'nodemailer';
import { ErrorWolf } from '../errores';
import { esDireccionNoPublica, hostSmtpValido, type ProveedorSmtp } from './proveedores';

/** Plazo total de una prueba de envío. */
export const PLAZO_PRUEBA_SMTP_MS = 20_000;

export type CodigoFalloEnvio =
  'correo.auth' | 'correo.conexion' | 'correo.tls' | 'correo.rechazado' | 'correo.plazo';

export type ResultadoEnvio =
  { ok: true; idMensaje: string } | { ok: false; codigo: CodigoFalloEnvio };

export interface OpcionesProbarEnvio {
  /** Plazo total en ms (por defecto 20 s). */
  plazoMs?: number;
  /**
   * Autoridad de certificación adicional en las que confiar (PEM). Solo para pruebas con un
   * servidor propio: agrega una raíz, nunca desactiva la verificación del certificado.
   */
  ca?: string;
  /** Direcciones del host (pruebas); por defecto el DNS del sistema. */
  resolver?: (host: string) => Promise<string[]>;
}

/** Dirección de correo sencilla (una sola, sin espacios, saltos ni separadores). */
const CORREO = /^[^\s@<>(),;:"\\]{1,64}@[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/;

export function destinatarioValido(v: unknown): v is string {
  return (
    typeof v === 'string' && v.length <= 254 && CORREO.test(v) && v.includes('.', v.indexOf('@'))
  );
}

async function resolverDns(host: string): Promise<string[]> {
  return (await lookup(host, { all: true, verbatim: true })).map((a) => a.address);
}

/**
 * Convierte el error de nodemailer en un código fijo. Nunca se devuelve el texto del error: el
 * servidor o la biblioteca podrían repetir el usuario o la clave.
 */
export function clasificarFalloSmtp(e: unknown): CodigoFalloEnvio {
  const x = e as { code?: unknown; command?: unknown; message?: unknown; responseCode?: unknown };
  const code = typeof x?.code === 'string' ? x.code : '';
  const msg = typeof x?.message === 'string' ? x.message : '';
  if (code === 'EAUTH') return 'correo.auth';
  if (code === 'ETIMEDOUT' || code === 'ETIMEOUT') return 'correo.plazo';
  if (
    code === 'ESTARTTLS' ||
    code.startsWith('ERR_TLS') ||
    code.startsWith('ERR_SSL') ||
    code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
    code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
    code === 'CERT_HAS_EXPIRED' ||
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
    code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' ||
    /certificate|self[- ]signed|STARTTLS|\bTLS\b|\bSSL\b|handshake|altname|wrong version number/i.test(
      msg,
    )
  ) {
    return 'correo.tls';
  }
  if (code === 'EENVELOPE' || code === 'EMESSAGE') return 'correo.rechazado';
  if (typeof x?.responseCode === 'number' && x.responseCode >= 500) return 'correo.rechazado';
  if (/timed? ?out|timeout/i.test(msg)) return 'correo.plazo';
  return 'correo.conexion';
}

/**
 * Envía UN correo de prueba al destinatario que escribió el usuario.
 *
 * - Exige TLS válido: certificado verificado contra el nombre del host (nunca
 *   `rejectUnauthorized: false`), TLS 1.2 como mínimo, y con STARTTLS no se degrada a texto plano
 *   (`requireTLS`).
 * - Resuelve el host una sola vez y se conecta a esa dirección: si es del equipo o de la red
 *   local y el usuario no lo confirmó (`redLocal`), no se contacta (evita usar la app como
 *   puente hacia servicios internos, también con un nombre que cambia de dirección).
 * - Plazos de conexión, saludo, inactividad y uno total.
 * - El resultado solo lleva códigos fijos: nunca el texto del error ni la clave.
 */
export async function probarEnvio(
  p: ProveedorSmtp,
  clave: string,
  para: string,
  o: OpcionesProbarEnvio = {},
): Promise<ResultadoEnvio> {
  if (!hostSmtpValido(p.host)) {
    throw new ErrorWolf(
      'correo.host_invalido',
      'El servidor SMTP no es un nombre ni una IP válidos.',
    );
  }
  if (!destinatarioValido(para)) {
    throw new ErrorWolf('correo.destinatario_invalido', 'La dirección de destino no es válida.');
  }
  if (typeof clave !== 'string' || clave === '') {
    throw new ErrorWolf('correo.sin_clave', 'El proveedor no tiene una clave guardada.');
  }
  const plazo = o.plazoMs ?? PLAZO_PRUEBA_SMTP_MS;

  let direcciones: string[];
  if (isIP(p.host) !== 0) direcciones = [p.host];
  else {
    try {
      direcciones = await (o.resolver ?? resolverDns)(p.host);
    } catch {
      return { ok: false, codigo: 'correo.conexion' };
    }
  }
  if (direcciones.length === 0) return { ok: false, codigo: 'correo.conexion' };
  if (p.redLocal !== true && direcciones.some((d) => esDireccionNoPublica(d))) {
    throw new ErrorWolf(
      'correo.host_local',
      'El servidor SMTP apunta a este equipo o a la red local: confírmelo en el proveedor para usarlo.',
    );
  }

  const aMilis = Math.max(200, Math.floor(plazo / 2));
  const transporte = nodemailer.createTransport({
    host: direcciones[0]!,
    port: p.puerto,
    secure: p.seguridad === 'tls',
    requireTLS: p.seguridad === 'starttls',
    auth: { user: p.usuario, pass: clave },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      ...(isIP(p.host) === 0 ? { servername: p.host } : {}),
      ...(o.ca ? { ca: o.ca } : {}),
    },
    connectionTimeout: aMilis,
    greetingTimeout: aMilis,
    socketTimeout: plazo,
    dnsTimeout: aMilis,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });

  let temporizador: NodeJS.Timeout | undefined;
  const vencido = new Promise<'plazo'>((resolver) => {
    temporizador = setTimeout(() => resolver('plazo'), plazo);
  });
  try {
    const envio = transporte
      .sendMail({
        // El remitente es el mismo destinatario: es la dirección del propio usuario.
        from: para,
        to: para,
        subject: 'Prueba de WolfCore Dev',
        text: 'Este mensaje confirma que WolfCore Dev puede enviar correo con este proveedor.',
      })
      .then(
        (info) => ({ ok: true as const, idMensaje: String(info.messageId) }),
        (e: unknown) => ({ ok: false as const, codigo: clasificarFalloSmtp(e) }),
      );
    const r = await Promise.race([envio, vencido]);
    if (r === 'plazo') return { ok: false, codigo: 'correo.plazo' };
    return r;
  } finally {
    if (temporizador) clearTimeout(temporizador);
    transporte.close();
  }
}
