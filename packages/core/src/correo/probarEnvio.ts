import { lookup } from 'node:dns/promises';
import net, { isIP } from 'node:net';
import nodemailer from 'nodemailer';
import { ErrorWolf } from '../errores';
import {
  destinatarioValido,
  esDireccionNoPublica,
  hostSmtpValido,
  type ProveedorSmtp,
} from './proveedores';

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
  const comando = typeof x?.command === 'string' ? x.command : '';
  const msg = typeof x?.message === 'string' ? x.message : '';
  const respuesta = typeof x?.responseCode === 'number' ? x.responseCode : 0;
  // Primero lo que dicen el código y el comando: el texto lo escribe el servidor.
  if (code === 'EAUTH' || comando === 'AUTH PLAIN' || comando === 'AUTH LOGIN') {
    return 'correo.auth';
  }
  if (code === 'ETIMEDOUT' || code === 'ETIMEOUT') return 'correo.plazo';
  if (
    code === 'ESTARTTLS' ||
    code === 'ETLS' ||
    comando === 'STARTTLS' ||
    code.startsWith('ERR_TLS') ||
    code.startsWith('ERR_SSL') ||
    code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
    code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
    code === 'CERT_HAS_EXPIRED' ||
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
    code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'
  ) {
    return 'correo.tls';
  }
  if (code === 'EENVELOPE' || code === 'EMESSAGE' || respuesta >= 500) return 'correo.rechazado';
  // Sin código útil (errores de socket y de TLS de Node): se mira el texto.
  if (
    /certificate|self[- ]signed|STARTTLS|\bTLS\b|\bSSL\b|handshake|altname|wrong version number/i.test(
      msg,
    )
  ) {
    return 'correo.tls';
  }
  if (/timed? ?out|timeout/i.test(msg)) return 'correo.plazo';
  return 'correo.conexion';
}

/**
 * Envía UN correo de prueba al destinatario que escribió el usuario.
 *
 * - Exige TLS válido: certificado verificado contra el nombre del host (nunca
 *   `rejectUnauthorized: false`), TLS 1.2 como mínimo, y con STARTTLS no se degrada a texto plano
 *   (`requireTLS`).
 * - Resuelve el host una sola vez y se conecta solo a esas direcciones (hasta 4, en orden): si es del equipo o de la red
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
  // Solo se intentan las direcciones ya validadas, en orden y con un único plazo total.
  const candidatas = direcciones.slice(0, 4);
  let socketActual: net.Socket | undefined;
  let vencida = false;
  let temporizador: NodeJS.Timeout | undefined;
  const vencido = new Promise<'plazo'>((resolver) => {
    temporizador = setTimeout(() => {
      vencida = true;
      // Corta la conexión en curso de verdad (no basta con cerrar el transporte).
      socketActual?.destroy();
      resolver('plazo');
    }, plazo);
  });
  const intentar = async (ip: string): Promise<ResultadoEnvio> => {
    socketActual = new net.Socket();
    const transporte = nodemailer.createTransport({
      host: ip,
      port: p.puerto,
      socket: socketActual,
      name: 'localhost',
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
    try {
      const info = await transporte.sendMail({
        from: p.remitente ?? para,
        to: para,
        subject: 'Prueba de WolfCore Dev',
        text: 'Este mensaje confirma que WolfCore Dev puede enviar correo con este proveedor.',
      });
      return { ok: true, idMensaje: String(info.messageId) };
    } catch (e) {
      return { ok: false, codigo: clasificarFalloSmtp(e) };
    } finally {
      transporte.close();
      socketActual.destroy();
    }
  };
  try {
    const todas = (async (): Promise<ResultadoEnvio> => {
      let r: ResultadoEnvio = { ok: false, codigo: 'correo.conexion' };
      for (const ip of candidatas) {
        if (vencida) break;
        r = await intentar(ip);
        // Solo se pasa a la siguiente dirección si no se pudo ni conectar.
        if (r.ok || r.codigo !== 'correo.conexion') break;
      }
      return r;
    })();
    const r = await Promise.race([todas, vencido]);
    return r === 'plazo' ? { ok: false, codigo: 'correo.plazo' } : r;
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}
