import claveComposer from '../claves/composer.asc?raw';
import claveNginx from '../claves/nginx.asc?raw';
import claveNode from '../claves/node.asc?raw';
import type { FuenteFirma } from '../huellas';
import {
  leerClave,
  leerFirma,
  leerPaquetes,
  type ClavePublica,
  type ClaveV4,
  type FirmaV4,
} from './paquetes';

export type { FuenteFirma } from '../huellas';

/** Indicador "puede firmar datos" (subpaquete 27, RFC 9580 §5.2.3.29). */
const PUEDE_FIRMAR = 0x02;

interface Componente {
  clave: ClaveV4;
  autofirmas: FirmaV4[];
  revocada: boolean;
}

/** ¿La firma es de la primaria? (por huella si la trae, si no por id). */
function dePrimaria(f: FirmaV4, primaria: ClaveV4): boolean {
  if (f.emisorHuella) return f.emisorHuella === primaria.huella;
  return f.emisorId === primaria.idClave;
}

/** La autofirma más reciente (a igual fecha, la última del archivo), como hace GnuPG. */
function vigente(firmas: FirmaV4[]): FirmaV4 | null {
  let r: FirmaV4 | null = null;
  for (const f of firmas) if (!r || f.creacion >= r.creacion) r = f;
  return r;
}

/**
 * Claves de un anillo fijado (uno o más bloques `PUBLIC KEY BLOCK`, o binario). Por cada clave
 * primaria y subclave RSA/Ed25519 v4 devuelve una `ClavePublica` con su vencimiento, si puede
 * firmar y si está revocada, según su autofirma más reciente (certificación 0x10–0x13 o directa
 * 0x1F para la primaria; vinculación 0x18 para la subclave; revocaciones 0x20 y 0x28).
 *
 * **Decisión:** las autofirmas no se verifican criptográficamente. El anillo es un archivo de la
 * app, revisado al actualizarlo con `scripts/actualizar-claves-pgp.mjs` (muestra las huellas),
 * y muchas autofirmas antiguas usan SHA-1, que el verificador rechaza a propósito. Las claves
 * con versión o algoritmo no soportados se saltan (no entran al anillo); las firmas de terceros
 * se ignoran.
 */
export function leerAnillo(datos: Uint8Array | string): ClavePublica[] {
  const entrada = typeof datos === 'string' ? Buffer.from(datos, 'latin1') : datos;
  const paquetes = leerPaquetes(entrada);
  const res: ClavePublica[] = [];

  let primaria: Componente | null = null;
  let usuarios: string[] = [];
  let subclaves: Componente[] = [];
  let actual: 'primaria' | 'usuario' | 'subclave' | 'otro' = 'otro';
  let subclave: Componente | null = null;

  const cerrar = (): void => {
    if (!primaria) return;
    const p = primaria;
    const auto = vigente(p.autofirmas);
    const venceP = auto?.vigenciaClave ? p.clave.creacion + auto.vigenciaClave : null;
    const flagsP = auto?.indicadores ?? null;
    res.push({
      ...p.clave,
      huellaPrimaria: p.clave.huella,
      expiracion: venceP,
      firma: auto !== null && (flagsP === null || (flagsP & PUEDE_FIRMAR) !== 0),
      revocada: p.revocada,
      usuarios,
    });
    for (const s of subclaves) {
      const v = vigente(s.autofirmas);
      const vence = v?.vigenciaClave ? s.clave.creacion + v.vigenciaClave : null;
      // Una subclave vence a más tardar con su primaria.
      const expiracion =
        venceP === null ? vence : vence === null ? venceP : Math.min(vence, venceP);
      res.push({
        ...s.clave,
        huellaPrimaria: p.clave.huella,
        expiracion,
        // Una subclave solo firma si su vinculación lo dice expresamente.
        firma: v !== null && v.indicadores !== null && (v.indicadores & PUEDE_FIRMAR) !== 0,
        revocada: p.revocada || s.revocada,
        usuarios,
      });
    }
  };

  for (const { tag, cuerpo } of paquetes) {
    if (tag === 6) {
      cerrar();
      primaria = null;
      usuarios = [];
      subclaves = [];
      subclave = null;
      actual = 'otro';
      try {
        primaria = { clave: leerClave(cuerpo), autofirmas: [], revocada: false };
        actual = 'primaria';
      } catch {
        // Versión o algoritmo no soportado: se salta la clave con sus subclaves.
      }
    } else if (!primaria) {
      continue;
    } else if (tag === 13 || tag === 17) {
      actual = 'usuario';
      if (tag === 13) usuarios.push(Buffer.from(cuerpo).toString('utf8').slice(0, 200));
    } else if (tag === 14) {
      subclave = null;
      actual = 'otro';
      try {
        subclave = { clave: leerClave(cuerpo), autofirmas: [], revocada: false };
        subclaves.push(subclave);
        actual = 'subclave';
      } catch {
        // Subclave no soportada (p. ej. ECDH de cifrado): se ignora.
      }
    } else if (tag === 2) {
      let f: FirmaV4;
      try {
        f = leerFirma(cuerpo);
      } catch {
        continue; // firma v3, de otro algoritmo o rara: no es una autofirma que se use
      }
      if (!dePrimaria(f, primaria.clave)) continue;
      if (actual === 'primaria' && f.tipo === 0x1f) primaria.autofirmas.push(f);
      else if (actual === 'primaria' && f.tipo === 0x20) primaria.revocada = true;
      else if (actual === 'usuario' && f.tipo >= 0x10 && f.tipo <= 0x13) {
        primaria.autofirmas.push(f);
      } else if (actual === 'subclave' && subclave) {
        if (f.tipo === 0x18) subclave.autofirmas.push(f);
        else if (f.tipo === 0x28) subclave.revocada = true;
      }
    }
  }
  cerrar();
  return res;
}

const ARMADURAS: Record<FuenteFirma, string> = {
  node: claveNode,
  composer: claveComposer,
  nginx: claveNginx,
};
const cache = new Map<FuenteFirma, readonly ClavePublica[]>();

/** Anillo fijado de una fuente (`catalogo/claves/<fuente>.asc`, empaquetado con la app). */
export function anillo(fuente: FuenteFirma): readonly ClavePublica[] {
  let a = cache.get(fuente);
  if (!a) {
    a = Object.freeze(leerAnillo(ARMADURAS[fuente]));
    cache.set(fuente, a);
  }
  return a;
}
