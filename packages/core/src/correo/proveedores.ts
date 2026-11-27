import { BlockList, isIP } from 'node:net';
import { z } from 'zod';

/** Cómo se protege la conexión: TLS desde el primer byte (465) o STARTTLS obligatorio (587). */
export const SEGURIDADES_SMTP = ['tls', 'starttls'] as const;
export type SeguridadSmtp = (typeof SEGURIDADES_SMTP)[number];

/**
 * Un proveedor SMTP remoto que se ofrece ya relleno. Cada host y puerto salió de la documentación
 * oficial del proveedor (campo `fuente`, consultada en D22); no se agrega ninguno sin esa fuente.
 */
export interface PresetSmtp {
  id: string;
  nombre: string;
  /** Con `{region}` si el proveedor tiene un servidor por región (Amazon SES). */
  host: string;
  puerto: number;
  seguridad: SeguridadSmtp;
  /** El usuario es siempre este (Resend, SendGrid, Mailtrap): el formulario ya viene relleno. */
  usuarioFijo?: string;
  /** Regiones válidas si `host` lleva `{region}`. */
  regiones?: readonly string[];
  /** Página oficial donde se confirmaron el host y el puerto. */
  fuente: string;
}

/** Regiones de Amazon SES con endpoint SMTP (AWS General Reference, "SMTP endpoints"). */
export const REGIONES_SES = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'sa-east-1',
] as const;

export const PRESETS_SMTP: readonly PresetSmtp[] = [
  {
    id: 'mailtrap',
    nombre: 'Mailtrap (envío)',
    host: 'live.smtp.mailtrap.io',
    puerto: 587,
    seguridad: 'starttls',
    usuarioFijo: 'api',
    fuente: 'https://docs.mailtrap.io/email-live-sending/setup/smtp-integration',
  },
  {
    id: 'resend',
    nombre: 'Resend',
    host: 'smtp.resend.com',
    puerto: 465,
    seguridad: 'tls',
    usuarioFijo: 'resend',
    fuente: 'https://resend.com/docs/send-with-smtp',
  },
  {
    id: 'brevo',
    nombre: 'Brevo',
    host: 'smtp-relay.brevo.com',
    puerto: 587,
    seguridad: 'starttls',
    fuente: 'https://developers.brevo.com/docs/node-smtp-relay-example',
  },
  {
    id: 'mailgun',
    nombre: 'Mailgun',
    host: 'smtp.mailgun.org',
    puerto: 587,
    seguridad: 'starttls',
    fuente: 'https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-smtp',
  },
  {
    id: 'sendgrid',
    nombre: 'SendGrid',
    host: 'smtp.sendgrid.net',
    puerto: 587,
    seguridad: 'starttls',
    usuarioFijo: 'apikey',
    fuente:
      'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/integrating-with-the-smtp-api',
  },
  {
    id: 'postmark',
    nombre: 'Postmark',
    host: 'smtp.postmarkapp.com',
    puerto: 587,
    seguridad: 'starttls',
    fuente: 'https://postmarkapp.com/developer/user-guide/send-email-with-smtp',
  },
  {
    id: 'ses',
    nombre: 'Amazon SES',
    host: 'email-smtp.{region}.amazonaws.com',
    puerto: 587,
    seguridad: 'starttls',
    regiones: REGIONES_SES,
    fuente: 'https://docs.aws.amazon.com/general/latest/gr/ses.html',
  },
  {
    id: 'smtp2go',
    nombre: 'SMTP2GO',
    host: 'mail.smtp2go.com',
    puerto: 587,
    seguridad: 'starttls',
    fuente: 'https://www.smtp2go.com/setup/',
  },
  {
    id: 'gmail',
    nombre: 'Gmail',
    host: 'smtp.gmail.com',
    puerto: 465,
    seguridad: 'tls',
    fuente:
      'https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app',
  },
];

/** Host de un preset ya resuelto (con la región en SES); null si falta o no es válida. */
export function hostDePreset(p: PresetSmtp, region?: string): string | null {
  if (!p.host.includes('{region}')) return p.host;
  if (!region || !p.regiones?.includes(region)) return null;
  return p.host.replace('{region}', region);
}

const ETIQUETA_DNS = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i;

/** Hosts que nunca son un proveedor remoto: el propio equipo o la red local por nombre. */
const SUFIJOS_LOCALES = ['.localhost', '.local', '.internal', '.lan', '.home', '.localdomain'];

/**
 * Se arma al primer uso, no al cargar el módulo: el renderer importa `@pel/core` y `node:net` no
 * existe allí (`new BlockList()` al importar dejaba la ventana en blanco).
 */
let redesNoPublicas: BlockList | null = null;
function redesNoPublicasLista(): BlockList {
  if (redesNoPublicas) return redesNoPublicas;
  const l = new BlockList();
  for (const [red, bits] of [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
  ] as const) {
    l.addSubnet(red, bits, 'ipv4');
  }
  for (const [red, bits] of [
    ['::', 128],
    ['::1', 128],
    ['fc00::', 7],
    ['fe80::', 10],
    ['ff00::', 8],
  ] as const) {
    l.addSubnet(red, bits, 'ipv6');
  }
  redesNoPublicas = l;
  return l;
}

/** Los 16 bytes de una IPv6 (admite `::` y un final con IPv4 punteada), o null si no es válida. */
function bytesIpv6(ip: string): number[] | null {
  if (isIP(ip) !== 6) return null;
  let t = ip.toLowerCase();
  const v4 = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(t);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number) as [number, number, number, number];
    t = t.slice(0, v4.index) + ((a << 8) | b).toString(16) + ':' + ((c << 8) | d).toString(16);
  }
  const [cabeza = '', cola] = t.split('::');
  const g = (x: string): number[] => (x === '' ? [] : x.split(':').map((h) => parseInt(h, 16)));
  const ini = g(cabeza);
  const fin = cola === undefined ? [] : g(cola);
  const medio = cola === undefined ? [] : new Array<number>(8 - ini.length - fin.length).fill(0);
  const grupos = [...ini, ...medio, ...fin];
  if (grupos.length !== 8) return null;
  return grupos.flatMap((x) => [x >> 8, x & 255]);
}

/**
 * La IPv4 que lleva dentro una IPv6 de transición: IPv4-mapeada (`::ffff:0:0/96`), compatible
 * (`::/96`), NAT64 (`64:ff9b::/96`) y 6to4 (`2002::/16`). null si no es de ninguna.
 */
function ipv4Embebida(b: number[]): string | null {
  const cero = (desde: number, hasta: number): boolean =>
    b.slice(desde, hasta).every((x) => x === 0);
  const cuatro = (i: number): string => b.slice(i, i + 4).join('.');
  if (cero(0, 10) && b[10] === 0xff && b[11] === 0xff) return cuatro(12);
  if (cero(0, 12)) return cuatro(12);
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b && cero(4, 12)) {
    return cuatro(12);
  }
  if (b[0] === 0x20 && b[1] === 0x02) return cuatro(2);
  return null;
}

/**
 * ¿La dirección IP es de este equipo o de una red no pública? Una IPv6 de transición (mapeada,
 * compatible, NAT64 o 6to4) vale lo que valga la IPv4 que lleva dentro.
 */
export function esDireccionNoPublica(ip: string): boolean {
  const limpia = ip.replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  const v = isIP(limpia);
  if (v === 0) return false;
  if (v === 6) {
    const bytes = bytesIpv6(limpia);
    const interna = bytes ? ipv4Embebida(bytes) : null;
    if (interna !== null) return esDireccionNoPublica(interna);
  }
  return redesNoPublicasLista().check(limpia, v === 4 ? 'ipv4' : 'ipv6');
}

/** Un host con forma válida: nombre DNS o IP, sin esquema, puerto, ruta ni credenciales. */
export function hostSmtpValido(host: unknown): host is string {
  if (typeof host !== 'string' || host.length === 0 || host.length > 253) return false;
  if (isIP(host) !== 0) return true;
  const etiquetas = host.split('.');
  return etiquetas.every((e) => ETIQUETA_DNS.test(e));
}

/**
 * ¿El host apunta (por su forma, sin consultar el DNS) a este equipo o a la red local? Una IP
 * privada o de loopback, `localhost`, nombres de una sola etiqueta y sufijos como `.local`.
 */
export function hostEsLocal(host: string): boolean {
  const h = host.toLowerCase();
  if (isIP(h) !== 0) return esDireccionNoPublica(h);
  if (h === 'localhost' || !h.includes('.')) return true;
  return SUFIJOS_LOCALES.some((s) => h.endsWith(s));
}

// eslint-disable-next-line no-control-regex
const TEXTO_SIN_CONTROL = /^[^\u0000-\u001f\u007f]+$/;

/** Dirección de correo sencilla (una sola, sin espacios, saltos ni separadores). */
const CORREO = /^[^\s@<>(),;:"\\]{1,64}@[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/;

export function destinatarioValido(v: unknown): v is string {
  return (
    typeof v === 'string' && v.length <= 254 && CORREO.test(v) && v.includes('.', v.indexOf('@'))
  );
}

export const ID_PROVEEDOR_SMTP = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * Configuración NO secreta de un proveedor SMTP (va en config.json). La clave vive solo en el
 * almacén de secretos del proceso principal, con el id `smtp:<id>`.
 */
export const ProveedorSmtpSchema = z.object({
  id: z.string().regex(ID_PROVEEDOR_SMTP),
  nombre: z.string().trim().min(1).max(60).regex(TEXTO_SIN_CONTROL),
  host: z
    .string()
    .trim()
    .refine((h) => hostSmtpValido(h)),
  puerto: z.number().int().min(1).max(65535),
  seguridad: z.enum(SEGURIDADES_SMTP),
  usuario: z.string().min(1).max(256).regex(TEXTO_SIN_CONTROL),
  /**
   * Dirección que figura como remitente del correo de prueba (muchos proveedores solo aceptan
   * un remitente o dominio verificado). Sin ella, el remitente es el propio destinatario.
   */
  remitente: z
    .string()
    .trim()
    .refine((r) => destinatarioValido(r))
    .optional(),
  /**
   * El usuario confirmó que este host es de su equipo o de su red local (p. ej. un relé propio).
   * Sin esto, un host que apunte a una red no pública nunca se contacta.
   */
  redLocal: z.literal(true).optional(),
});
export type ProveedorSmtp = z.infer<typeof ProveedorSmtpSchema>;

/** `Config.correo.proveedores`: lo ilegible o repetido se descarta sin tumbar el resto. */
export const ListaProveedoresSmtpSchema = z
  .array(z.unknown())
  .catch([])
  .default([])
  .transform((lista) => {
    const vistos = new Set<string>();
    const salida: ProveedorSmtp[] = [];
    for (const x of lista) {
      const r = ProveedorSmtpSchema.safeParse(x);
      if (r.success && !vistos.has(r.data.id)) {
        vistos.add(r.data.id);
        salida.push(r.data);
      }
    }
    return salida;
  });

/** Texto de `MAIL_ENCRYPTION` que entiende Laravel: `ssl` = TLS directo, `tls` = STARTTLS. */
export function cifradoEnv(s: SeguridadSmtp): 'ssl' | 'tls' {
  return s === 'tls' ? 'ssl' : 'tls';
}

/** Host para un `.env`: una IPv6 va entre corchetes. */
function hostEnv(host: string): string {
  return isIP(host) === 6 ? `[${host}]` : host;
}

/**
 * Variables `MAIL_*` hacia el proveedor. `MAIL_PASSWORD` lleva la clave solo si se pasa (tras la
 * confirmación explícita del usuario); si no, se escribe VACÍA, para que la clave que dejó otro
 * proveedor en ese `.env` nunca viaje al servidor nuevo. `MAIL_SCHEME` es para Laravel 11 o más
 * nuevo (`smtps` = TLS directo) y `MAIL_ENCRYPTION` para los anteriores.
 */
export function bloqueEnvSmtp(p: ProveedorSmtp, clave: string | null): Record<string, string> {
  return {
    MAIL_MAILER: 'smtp',
    MAIL_SCHEME: p.seguridad === 'tls' ? 'smtps' : 'smtp',
    MAIL_HOST: hostEnv(p.host),
    MAIL_PORT: String(p.puerto),
    MAIL_USERNAME: p.usuario,
    MAIL_PASSWORD: clave ?? '',
    MAIL_ENCRYPTION: cifradoEnv(p.seguridad),
  };
}
