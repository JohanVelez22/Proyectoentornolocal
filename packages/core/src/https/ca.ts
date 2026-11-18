import { createHash, generateKeyPairSync, randomBytes } from 'node:crypto';
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
  if (dominios.length === 0) throw new Error('Un certificado necesita al menos un dominio');
  const caCert = forge.pki.certificateFromPem(ca.certPem);
  const caKey = forge.pki.privateKeyFromPem(ca.keyPem);
  const { publica, privada } = nuevaClave(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = publica;
  cert.serialNumber = serieAleatoria();
  cert.validity.notBefore = new Date(ahora.getTime() - DIA_MS);
  cert.validity.notAfter = new Date(ahora.getTime() + DIAS_CERTIFICADO * DIA_MS);
  cert.setSubject([{ name: 'commonName', value: dominios[0]! }]);
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
