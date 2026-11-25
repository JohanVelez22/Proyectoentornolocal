import { createHash, generateKeyPairSync, randomBytes } from 'node:crypto';
import { ErrorWolf } from '../errores';
import { isIP } from 'node:net';
import forge from 'node-forge';

export interface ParCertificado {
  certPem: string;
  keyPem: string;
}

const DIA_MS = 86_400_000;
export const DIAS_CERTIFICADO = 825;
export const NOMBRE_CA = 'WolfCore Dev CA';

/** Las claves las genera Node (nativo, rápido); node-forge solo arma y firma los certificados. */
function nuevaClave(bits: number): {
  publica: forge.pki.rsa.PublicKey;
  privada: forge.pki.rsa.PrivateKey;
} {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: bits });
  const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }) as string;
  const privada = forge.pki.privateKeyFromPem(pem) as forge.pki.rsa.PrivateKey;
  return { privada, publica: forge.pki.setRsaPublicKey(privada.n, privada.e) };
}

/** Serie aleatoria de 16 bytes, siempre positiva (bit alto en 0) y sin ceros a la izquierda. */
function serieAleatoria(): string {
  const b = randomBytes(16);
  b[0] = (b[0]! & 0x7f) | 0x40;
  return b.toString('hex');
}

/**
 * Lo único que una CA nueva de WolfCore Dev puede firmar (extensión `nameConstraints`, crítica,
 * RFC 5280 §4.2.1.10): los dominios `.test` y `localhost`, el loopback (127.0.0.0/8 y ::1) y los
 * rangos privados de IPv4 que usa la red local (D25: 10/8, 172.16/12, 192.168/16). Si la clave de
 * la CA se filtrara, no serviría para suplantar ningún sitio real de internet.
 */
export const RESTRICCIONES_CA = {
  dns: ['test', 'localhost'],
  ipv4: [
    ['127.0.0.0', '255.0.0.0'],
    ['10.0.0.0', '255.0.0.0'],
    ['172.16.0.0', '255.240.0.0'],
    ['192.168.0.0', '255.255.0.0'],
  ],
  ipv6: ['::1'],
} as const;

const OID_NAME_CONSTRAINTS = '2.5.29.30';

function bytesIpv4(ip: string): string {
  return String.fromCharCode(...ip.split('.').map(Number));
}

/** DER de `NameConstraints { permittedSubtrees }` con `RESTRICCIONES_CA`. */
export function derRestricciones(): string {
  const A = forge.asn1;
  const subarbol = (tag: number, valor: string): forge.asn1.Asn1 =>
    A.create(A.Class.UNIVERSAL, A.Type.SEQUENCE, true, [
      A.create(A.Class.CONTEXT_SPECIFIC, tag, false, valor),
    ]);
  const lista: forge.asn1.Asn1[] = [
    ...RESTRICCIONES_CA.dns.map((d) => subarbol(2, d)),
    ...RESTRICCIONES_CA.ipv4.map(([ip, mascara]) =>
      subarbol(7, bytesIpv4(ip) + bytesIpv4(mascara)),
    ),
    // ::1/128: 15 ceros y un 1, y la máscara entera.
    ...RESTRICCIONES_CA.ipv6.map(() =>
      subarbol(
        7,
        String.fromCharCode(
          ...new Array<number>(15).fill(0),
          1,
          ...new Array<number>(16).fill(255),
        ),
      ),
    ),
  ];
  const permitidos = A.create(A.Class.CONTEXT_SPECIFIC, 0, true, lista);
  return A.toDer(A.create(A.Class.UNIVERSAL, A.Type.SEQUENCE, true, [permitidos])).getBytes();
}

/**
 * Restricciones de nombre de una CA: `nuestras` (la extensión es crítica y coincide byte a byte
 * con `derRestricciones()`), `ninguna` (no la lleva: las CA anteriores a D26) o `ajenas` (la lleva
 * con otro contenido o sin marcar como crítica). Un certificado que no se puede leer: `ilegible`.
 */
export function restriccionesDeCa(certPem: string): 'nuestras' | 'ninguna' | 'ajenas' | 'ilegible' {
  let ext: { id?: string; critical?: boolean; value?: unknown }[];
  try {
    ext = forge.pki.certificateFromPem(certPem).extensions as typeof ext;
  } catch {
    return 'ilegible';
  }
  const nc = ext.filter((e) => e.id === OID_NAME_CONSTRAINTS);
  if (nc.length === 0) return 'ninguna';
  if (nc.length > 1) return 'ajenas';
  const e = nc[0]!;
  return e.critical === true && e.value === derRestricciones() ? 'nuestras' : 'ajenas';
}

/** ¿La CA lleva exactamente nuestras restricciones de nombre (las nuevas desde D26)? */
export function caConRestricciones(certPem: string): boolean {
  return restriccionesDeCa(certPem) === 'nuestras';
}

/** ¿Un nombre o una IP cae dentro de `RESTRICCIONES_CA`? */
export function dentroDeRestriccionesCa(nombre: string): boolean {
  const n = nombre.toLowerCase().replace(/^\*\./, '');
  if (isIP(n) === 6) return n === '::1';
  if (isIP(n) === 4) {
    const v = (ip: string): number => ip.split('.').reduce((a, x) => (a << 8) + Number(x), 0) >>> 0;
    return RESTRICCIONES_CA.ipv4.some(([ip, m]) => (v(n) & v(m)) >>> 0 === v(ip));
  }
  return RESTRICCIONES_CA.dns.some((d) => n === d || n.endsWith(`.${d}`));
}

/** SHA-256 del DER de un certificado, en pares hexadecimales separados por `:` (para mostrar). */
export function huellaSha256(certPem: string): string {
  const m = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/.exec(certPem);
  const der = Buffer.from((m?.[1] ?? '').replace(/\s+/g, ''), 'base64');
  return createHash('sha256')
    .update(der)
    .digest('hex')
    .toUpperCase()
    .replace(/(..)(?!$)/g, '$1:');
}

export function generarCA(ahora: Date = new Date()): ParCertificado {
  const { publica, privada } = nuevaClave(3072);
  const cert = forge.pki.createCertificate();
  cert.publicKey = publica;
  cert.serialNumber = serieAleatoria();
  cert.validity.notBefore = new Date(ahora.getTime() - DIA_MS);
  cert.validity.notAfter = new Date(ahora.getTime() + 3652 * DIA_MS);
  const sujeto = [
    { name: 'commonName', value: NOMBRE_CA },
    { name: 'organizationName', value: 'WolfCore Dev' },
  ];
  cert.setSubject(sujeto);
  cert.setIssuer(sujeto);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true, pathLenConstraint: 0, critical: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
    { name: 'subjectKeyIdentifier' },
    { id: OID_NAME_CONSTRAINTS, critical: true, value: derRestricciones() },
  ]);
  cert.sign(privada, forge.md.sha256.create());
  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(privada),
  };
}

/** SubjectKeyIdentifier de la CA (SHA-1 de su clave pública), como lo calcula node-forge. */
function caKeyId(caCert: forge.pki.Certificate): string {
  const ski = caCert.getExtension('subjectKeyIdentifier') as {
    subjectKeyIdentifier?: string;
  } | null;
  return ski?.subjectKeyIdentifier
    ? forge.util.hexToBytes(ski.subjectKeyIdentifier)
    : (forge.pki.getPublicKeyFingerprint(caCert.publicKey as forge.pki.rsa.PublicKey, {
        type: 'RSAPublicKey',
        md: forge.md.sha1.create(),
        encoding: 'binary',
      }) as string);
}

export function emitirCertificado(
  ca: ParCertificado,
  dominios: string[],
  ahora: Date = new Date(),
): ParCertificado {
  if (dominios.length === 0)
    throw new ErrorWolf('https.sin_dominio', 'Un certificado necesita al menos un dominio');
  const caCert = forge.pki.certificateFromPem(ca.certPem);
  const caKey = forge.pki.privateKeyFromPem(ca.keyPem);
  const { publica, privada } = nuevaClave(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = publica;
  cert.serialNumber = serieAleatoria();
  cert.validity.notBefore = new Date(ahora.getTime() - DIA_MS);
  cert.validity.notAfter = new Date(ahora.getTime() + DIAS_CERTIFICADO * DIA_MS);
  // Con solo IP en el certificado, OpenSSL compara el CN como si fuera un dominio contra las
  // restricciones de la CA: un CN que no tiene forma de dominio no se compara.
  const primero = dominios[0]!;
  cert.setSubject([
    { name: 'commonName', value: isIP(primero) ? `WolfCore Dev ${primero}` : primero },
  ]);
  cert.setIssuer(caCert.subject.attributes);
  cert.setExtensions([
    { name: 'basicConstraints', cA: false, critical: true },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
    { name: 'extKeyUsage', serverAuth: true },
    {
      name: 'subjectAltName',
      // Las IP van como iPAddress (tipo 7): los navegadores no aceptan una IP en un dNSName.
      altNames: dominios.map((d) => (isIP(d) ? { type: 7, ip: d } : { type: 2, value: d })),
    },
    { name: 'subjectKeyIdentifier' },
    { name: 'authorityKeyIdentifier', keyIdentifier: caKeyId(caCert) },
  ]);
  cert.sign(caKey, forge.md.sha256.create());
  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(privada),
  };
}

/** SHA-1 del DER en hexadecimal mayúsculas: la huella con la que certutil identifica el certificado. */
export function huellaSha1(certPem: string): string {
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(forge.pki.certificateFromPem(certPem)));
  return createHash('sha1')
    .update(Buffer.from(der.getBytes(), 'binary'))
    .digest('hex')
    .toUpperCase();
}
