import claveComposer from '../claves/composer.asc?raw';
import claveNginx from '../claves/nginx.asc?raw';
import clavePhpMyAdmin from '../claves/phpmyadmin.asc?raw';
import claveNode from '../claves/node.asc?raw';
import type { FuenteFirma } from '../huellas';
import { digestDe, firmaCuadra, NOMBRE_HASH } from './cripto';
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
/**
 * Desde esta fecha una autofirma o vinculación con SHA-1 ya no cuenta (la misma fecha de corte
 * que usa GnuPG para SHA-1 en firmas de claves). Antes se acepta: muchas claves fijadas son viejas.
 */
export const CORTE_SHA1 = Date.UTC(2019, 0, 19) / 1000;
/** Hashes admitidos en autofirmas y vinculaciones (además de SHA-1 antiguo). */
const HASHES_AUTOFIRMA = new Set([8, 9, 10, 11]);

const conLargo = (prefijo: number, cuerpo: Uint8Array, bytesLargo: 2 | 4): Uint8Array => {
  const cab = Buffer.alloc(1 + bytesLargo);
  cab[0] = prefijo;
  if (bytesLargo === 2) cab.writeUInt16BE(cuerpo.length, 1);
  else cab.writeUInt32BE(cuerpo.length, 1);
  return Buffer.concat([cab, cuerpo]);
};
/** Clave (o subclave) tal como entra en el hash: 0x99, largo de 2 bytes y cuerpo. */
const hashClave = (c: ClaveV4): Uint8Array => conLargo(0x99, c.cuerpo, 2);

/** Revocaciones (0x20, 0x28, 0x30): restan confianza, así que valen con cualquier hash conocido. */
const REVOCACIONES = new Set([0x20, 0x28, 0x30]);

function hashAdmitido(f: FirmaV4): boolean {
  if (REVOCACIONES.has(f.tipo)) return NOMBRE_HASH[f.algoritmoHash] !== undefined;
  return (
    HASHES_AUTOFIRMA.has(f.algoritmoHash) || (f.algoritmoHash === 2 && f.creacion < CORTE_SHA1)
  );
}

/** ¿`f` es una firma válida de `firmante` sobre `partes`, con un hash admitido? */
function autofirmaValida(f: FirmaV4, firmante: ClaveV4, partes: Uint8Array[]): boolean {
  if (!hashAdmitido(f)) return false;
  const d = digestDe(f, partes);
  return d !== null && firmaCuadra(f, firmante, d);
}

/** Indicadores de una certificación (null = sin subpaquete 27: la primaria firma). */
const indicadoresDe = (f: FirmaV4): number => f.indicadores ?? 0xff;

/** ¿La certificación marca su id como principal (subpaquete 25 con hash, distinto de 0)? */
const esPrincipal = (f: FirmaV4): boolean =>
  f.subpaquetes.some((s) => s.tipo === 25 && s.conHash && (s.datos[0] ?? 0) !== 0);

/** ¿La firma dice venir de `clave`? (por huella si la trae, si no por id). */
function deClave(f: FirmaV4, clave: ClaveV4): boolean {
  if (f.emisorHuella) return f.emisorHuella === clave.huella;
  return f.emisorId === clave.idClave;
}

/** La autofirma más reciente (a igual fecha, la última del archivo), como hace GnuPG. */
function vigente(firmas: FirmaV4[]): FirmaV4 | null {
  let r: FirmaV4 | null = null;
  for (const f of firmas) if (!r || f.creacion >= r.creacion) r = f;
  return r;
}

/**
 * Retrofirma 0x19 (subpaquete 32, firma incrustada) de una subclave de firma: la hace la propia
 * subclave sobre la primaria y la subclave (RFC 9580 §5.2.1.9). Sin ella, cualquiera podría
 * vincular a su clave una subclave ajena.
 */
function retrofirmaValida(vinculacion: FirmaV4, primaria: ClaveV4, subclave: ClaveV4): boolean {
  for (const s of vinculacion.subpaquetes) {
    if (s.tipo !== 32) continue;
    let g: FirmaV4;
    try {
      g = leerFirma(s.datos);
    } catch {
      continue;
    }
    if (g.tipo !== 0x19) continue;
    if (g.emisorId !== null && !deClave(g, subclave)) continue;
    if (autofirmaValida(g, subclave, [hashClave(primaria), hashClave(subclave)])) return true;
  }
  return false;
}

interface Usuario {
  prefijo: Uint8Array;
  nombre: string | null;
  certificaciones: FirmaV4[];
  revocaciones: FirmaV4[];
}
interface Subclave {
  clave: ClaveV4;
  vinculaciones: FirmaV4[];
  revocada: boolean;
}

/**
 * Claves de un anillo fijado (uno o más bloques `PUBLIC KEY BLOCK`, o binario). Por cada clave
 * primaria y subclave RSA/Ed25519 v4 devuelve una `ClavePublica` con su vencimiento, si puede
 * firmar y si está revocada.
 *
 * Solo cuentan las firmas de la primaria que se **verifican** con el mismo verificador (hash
 * SHA-2, o SHA-1 anterior a `CORTE_SHA1`):
 * - certificaciones 0x10–0x13 de cada id de usuario (salvo las de un id con una revocación 0x30
 *   posterior) y la firma directa 0x1F: la más reciente da vencimiento e indicadores;
 * - vinculación 0x18 de cada subclave: la más reciente; una subclave solo firma si lleva el
 *   indicador 0x02 **y** una retrofirma 0x19 válida;
 * - revocaciones: 0x20 revoca la primaria (y sus subclaves) esté donde esté; 0x28 revoca la
 *   subclave en curso.
 * Las claves con versión o algoritmo no soportados se saltan; las firmas de terceros se ignoran.
 */
export function leerAnillo(datos: Uint8Array | string): ClavePublica[] {
  const entrada = typeof datos === 'string' ? Buffer.from(datos, 'latin1') : datos;
  const paquetes = leerPaquetes(entrada);
  const res: ClavePublica[] = [];

  let primaria: ClaveV4 | null = null;
  let directas: FirmaV4[] = [];
  let revocada = false;
  let usuarios: Usuario[] = [];
  let subclaves: Subclave[] = [];
  let actual: Usuario | Subclave | 'primaria' | null = null;

  const cerrar = (): void => {
    if (!primaria) return;
    const p = primaria;
    // Certificación vigente de cada id (la más reciente que no revoca una 0x30 posterior).
    const porUsuario = usuarios.flatMap((u) => {
      const v = vigente(
        u.certificaciones.filter((c) => !u.revocaciones.some((r) => r.creacion >= c.creacion)),
      );
      return v ? [v] : [];
    });
    // Indicadores: los del id principal (subpaquete 25); si hay empate, o ninguno está marcado,
    // la intersección de los de todos. Sin ids, los de la firma directa más reciente.
    const principales = porUsuario.filter(esPrincipal);
    const grupo = principales.length > 0 ? principales : porUsuario;
    const directa = vigente(directas);
    const auto = vigente([...directas, ...grupo]);
    const venceP = auto?.vigenciaClave ? p.creacion + auto.vigenciaClave : null;
    const flagsP =
      grupo.length > 0
        ? grupo.reduce((acc, c) => acc & indicadoresDe(c), 0xff)
        : directa
          ? indicadoresDe(directa)
          : 0;
    const nombres = usuarios.flatMap((u) => (u.nombre ? [u.nombre] : []));
    res.push({
      ...p,
      huellaPrimaria: p.huella,
      expiracion: venceP,
      firma: auto !== null && (flagsP & PUEDE_FIRMAR) !== 0,
      revocada,
      usuarios: nombres,
    });
    for (const s of subclaves) {
      const v = vigente(s.vinculaciones);
      const vence = v?.vigenciaClave ? s.clave.creacion + v.vigenciaClave : null;
      // Una subclave vence a más tardar con su primaria.
      const expiracion =
        venceP === null ? vence : vence === null ? venceP : Math.min(vence, venceP);
      res.push({
        ...s.clave,
        huellaPrimaria: p.huella,
        expiracion,
        firma:
          auto !== null &&
          v !== null &&
          v.indicadores !== null &&
          (v.indicadores & PUEDE_FIRMAR) !== 0 &&
          retrofirmaValida(v, p, s.clave),
        revocada: revocada || s.revocada,
        usuarios: nombres,
      });
    }
  };

  for (const { tag, cuerpo } of paquetes) {
    if (tag === 6) {
      cerrar();
      primaria = null;
      directas = [];
      revocada = false;
      usuarios = [];
      subclaves = [];
      actual = null;
      try {
        primaria = leerClave(cuerpo);
        actual = 'primaria';
      } catch {
        // Versión o algoritmo no soportado: se salta la clave con sus subclaves.
      }
    } else if (!primaria) {
      continue;
    } else if (tag === 13 || tag === 17) {
      const u: Usuario = {
        prefijo: conLargo(tag === 13 ? 0xb4 : 0xd1, cuerpo, 4),
        nombre: tag === 13 ? Buffer.from(cuerpo).toString('utf8').slice(0, 200) : null,
        certificaciones: [],
        revocaciones: [],
      };
      usuarios.push(u);
      actual = u;
    } else if (tag === 14) {
      actual = null;
      try {
        const s: Subclave = { clave: leerClave(cuerpo), vinculaciones: [], revocada: false };
        subclaves.push(s);
        actual = s;
      } catch {
        // Subclave no soportada (p. ej. ECDH de cifrado): se ignora con sus firmas.
      }
    } else if (tag === 2) {
      let f: FirmaV4;
      try {
        f = leerFirma(cuerpo);
      } catch {
        continue; // firma v3, de otro algoritmo o rara: no es una autofirma que se use
      }
      // Una revocación sin emisor se intenta con la primaria en curso.
      const sinEmisor = f.emisorId === null && REVOCACIONES.has(f.tipo);
      if (!sinEmisor && !deClave(f, primaria)) continue;
      const kp = hashClave(primaria);
      if (f.tipo === 0x20) {
        if (autofirmaValida(f, primaria, [kp])) revocada = true;
      } else if (actual === 'primaria') {
        if (f.tipo === 0x1f && autofirmaValida(f, primaria, [kp])) directas.push(f);
      } else if (actual && 'prefijo' in actual) {
        const valida = autofirmaValida(f, primaria, [kp, actual.prefijo]);
        if (valida && f.tipo >= 0x10 && f.tipo <= 0x13) actual.certificaciones.push(f);
        else if (valida && f.tipo === 0x30) actual.revocaciones.push(f);
      } else if (actual && 'vinculaciones' in actual) {
        const partes = [kp, hashClave(actual.clave)];
        if (f.tipo === 0x18 && autofirmaValida(f, primaria, partes)) {
          actual.vinculaciones.push(f);
        } else if (f.tipo === 0x28 && autofirmaValida(f, primaria, partes)) {
          actual.revocada = true;
        }
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
  phpmyadmin: clavePhpMyAdmin,
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
