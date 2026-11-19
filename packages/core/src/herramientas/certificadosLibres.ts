import { existsSync } from 'node:fs';
import { ErrorWolf } from '../errores';
import { readFile } from 'node:fs/promises';
import { isIPv4, isIPv6 } from 'node:net';
import { emitirCertificado } from '../https/ca';
import type { Rutas } from '../rutas';

export const MAX_DOMINIOS_LIBRES = 20;

export interface DepsCertificadoLibre {
  rutas: Pick<Rutas, 'caCrt' | 'caKey'>;
  ahora?: () => Date;
}

const ETIQUETA = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Nombre DNS: etiquetas válidas y la última no solo numérica (`256.1.1.1` no es un nombre). */
const esNombre = (n: string): boolean =>
  n.length <= 253 &&
  n.split('.').every((e) => ETIQUETA.test(e)) &&
  !/^\d+$/.test(n.slice(n.lastIndexOf('.') + 1));

/** Un nombre (o comodín) normalizado, o lanza con un mensaje en español. */
function validarUno(entrada: unknown): string {
  if (typeof entrada !== 'string')
    throw new ErrorWolf('herramientas.dominio_invalido', `"${String(entrada)}" no es válido.`);
  let n = entrada.trim().toLowerCase();
  if (/^\[.*\]$/.test(n)) n = n.slice(1, -1);
  // Una IPv6 con zona (`fe80::1%12`) solo vale en esa máquina: no va en un certificado.
  if (n.includes('%'))
    throw new ErrorWolf(
      'herramientas.dominio_invalido',
      `"${entrada}" no es válido: quite la zona (%…) de la IPv6.`,
    );
  if (isIPv4(n) || isIPv6(n)) return n;
  if (n.includes('*')) {
    // Solo un comodín a la izquierda, de un nivel, y sobre al menos dos etiquetas (`*.x.test`).
    const resto = n.slice(2);
    if (
      !n.startsWith('*.') ||
      resto.includes('*') ||
      resto.split('.').length < 2 ||
      !esNombre(resto)
    ) {
      throw new ErrorWolf(
        'herramientas.dominio_invalido',
        `"${entrada}" no es un comodín válido: solo se admite "*." al principio y sobre un dominio de dos o más partes (por ejemplo *.misitio.test).`,
      );
    }
    return n;
  }
  if (n === '' || !esNombre(n))
    throw new ErrorWolf(
      'herramientas.dominio_invalido',
      `"${entrada}" no es válido como dominio ni como IP.`,
    );
  return n;
}

/** Valida, normaliza (minúsculas, sin corchetes) y quita repetidos, conservando el orden. */
export function validarDominiosLibres(dominios: unknown): string[] {
  if (!Array.isArray(dominios) || dominios.length === 0) {
    throw new ErrorWolf(
      'herramientas.sin_seleccion',
      'Indique al menos un dominio o IP para el certificado.',
    );
  }
  const res: string[] = [];
  for (const d of dominios) {
    const n = validarUno(d);
    if (!res.includes(n)) res.push(n);
  }
  if (res.length > MAX_DOMINIOS_LIBRES) {
    throw new ErrorWolf(
      'herramientas.demasiados_dominios',
      `Un certificado admite como máximo ${MAX_DOMINIOS_LIBRES} dominios o IP.`,
      { maximo: MAX_DOMINIOS_LIBRES },
    );
  }
  return res;
}

/**
 * Emite un certificado para uso libre firmado por la CA de WolfCore Dev. Devuelve los PEM en
 * memoria: la interfaz los guarda con un diálogo. La clave privada nunca se escribe aquí.
 */
export async function emitirCertificadoLibre(
  dominios: string[],
  d: DepsCertificadoLibre,
): Promise<{ certPem: string; clavePem: string }> {
  const lista = validarDominiosLibres(dominios);
  if (!existsSync(d.rutas.caCrt()) || !existsSync(d.rutas.caKey())) {
    throw new ErrorWolf(
      'https.sin_autoridad',
      'No existe la autoridad de certificados de WolfCore Dev. Instale la CA desde la sección HTTPS antes de emitir certificados.',
    );
  }
  const ca = {
    certPem: await readFile(d.rutas.caCrt(), 'utf8'),
    keyPem: await readFile(d.rutas.caKey(), 'utf8'),
  };
  const par = emitirCertificado(ca, lista, d.ahora ? d.ahora() : new Date());
  return { certPem: par.certPem, clavePem: par.keyPem };
}
