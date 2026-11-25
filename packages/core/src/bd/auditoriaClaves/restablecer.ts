import { randomBytes } from 'node:crypto';
import { chmod, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../../errores';
import type { Rutas } from '../../rutas';
import type { ObjetivoBd } from '../basesDeDatos';
import type { CerrojoBases } from '../cerrojoBases';
import { exigirBaseDeUsuario, type ModoConsulta } from './auditar';
import { formatoDe, hashearNueva, type FormatoHash } from './hashes';
import { TablasSql, texto, type ConsultaSql, type TablaResuelta } from './tablas';

/** Contraseña nueva: tope razonable (mucho más que lo que cualquier formato usa). */
const MAX_CLAVE = 1024;
/** Tope de cada valor guardado en la copia de la fila. */
const MAX_VALOR_COPIA = 1024;
/** Cuánto se conservan las copias de fila. */
export const DIAS_COPIAS = 30;
const PLAZO_MS = 30_000;
const NOMBRE_COPIA = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-[0-9a-f]{6}\.json$/;

export interface OpcionesRestablecer {
  instancia: ObjetivoBd;
  base: string;
  tabla: string;
  columnaUsuario: string;
  columnaHash: string;
  usuario: string;
  /** PostgreSQL: esquema de la tabla (por omisión `public`). */
  esquema?: string;
}

export interface VistaPreviaRestablecer {
  /** El `UPDATE` con `?` en lugar de los valores: la clave nueva y el hash no salen aquí. */
  sentencia: string;
  /** Formato del hash actual. */
  formato: FormatoHash;
  /** Formato del hash nuevo (md5 y sha1 conservan el suyo salvo que se pase a bcrypt). */
  formatoNuevo: FormatoHash;
  cambiaFormato: boolean;
  /** La base es de un sitio marcado con datos reales: restablecer pide una confirmación reforzada. */
  datosReales: boolean;
}

export interface OpcionesRestablecerClave extends OpcionesRestablecer {
  claveNueva: string;
  confirmado: true;
  /** md5 y sha1 sin sal: pasar a bcrypt (la aplicación debe usar `password_verify` o similar). */
  aBcrypt?: boolean;
  /** Confirmación reforzada: la base es de un sitio con datos reales. */
  confirmarDatosReales?: boolean;
}

export interface ResultadoRestablecer {
  /** Archivo con la identificación de la fila y su hash anterior (solo el usuario puede leerlo). */
  copiaFila: string;
  /** false: el sistema no pudo limitar la copia al usuario; la interfaz lo avisa. */
  copiaRestringida: boolean;
  /** Id de la instantánea de la base tomada antes de escribir. */
  instantanea: string;
}

export interface DepsRestablecer {
  rutas: Rutas;
  abrir(
    instancia: ObjetivoBd,
    base: string,
    modo: ModoConsulta,
    plazoMs: number,
  ): Promise<ConsultaSql>;
  instantaneas: {
    tomar(instancia: ObjetivoBd, base: string, nota: string): Promise<{ id: string }>;
  };
  cerrojo: CerrojoBases;
  /** ¿La base pertenece a un sitio con datos reales? Ante la duda, true. */
  esDatosReales: (instancia: ObjetivoBd, base: string) => Promise<boolean>;
  restringir?: (ruta: string) => Promise<boolean>;
  reloj?: () => Date;
}

const unaFila = (n: number): ErrorWolf =>
  n === 0
    ? new ErrorWolf('auditoria.usuario_no_encontrado', 'No hay ninguna cuenta con ese usuario.')
    : new ErrorWolf(
        'auditoria.usuario_repetido',
        'Hay más de una cuenta con ese usuario: no se restablece, para no tocar la que no es.',
      );

/** Valores de una fila aptos para JSON (binarios en base64, bigint en texto, topes de tamaño). */
function aJson(_k: string, v: unknown): unknown {
  // JSON.stringify ya llamó a toJSON de los Buffer: llegan como { type: 'Buffer', data: [...] }.
  if (v !== null && typeof v === 'object' && (v as { type?: unknown }).type === 'Buffer') {
    const datos = (v as { data?: unknown }).data;
    if (Array.isArray(datos)) {
      return {
        base64: Buffer.from(datos.slice(0, MAX_VALOR_COPIA) as number[]).toString('base64'),
      };
    }
  }
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string' && v.length > MAX_VALOR_COPIA) return v.slice(0, MAX_VALOR_COPIA);
  return v;
}

async function conTablas<T>(
  d: DepsRestablecer,
  o: OpcionesRestablecer,
  modo: ModoConsulta,
  fn: (t: TablasSql, r: TablaResuelta) => Promise<T>,
): Promise<T> {
  const q = await d.abrir(o.instancia, o.base, modo, PLAZO_MS);
  try {
    const t = new TablasSql(q, o.base, o.esquema);
    const r = await t.resolver(o.tabla, o.columnaUsuario, o.columnaHash);
    return await fn(t, r);
  } finally {
    await q.cerrar().catch(() => undefined);
  }
}

function usuarioValido(v: unknown): string {
  if (typeof v !== 'string' || v === '' || v.length > 256) {
    throw new ErrorWolf(
      'auditoria.usuario_invalido',
      'El usuario debe tener entre 1 y 256 caracteres.',
    );
  }
  return v;
}

/** Hash de la fila (texto) o error si no es de un formato reproducible. */
function hashDe(fila: Record<string, unknown>, columna: string): string {
  const h = texto(fila[columna]) ?? '';
  if (formatoDe(h) === 'desconocido') {
    throw new ErrorWolf(
      'auditoria.formato_no_soportado',
      'El formato del hash actual no se puede reproducir: no se restablece.',
    );
  }
  return h;
}

/** Lo que se va a hacer, sin escribir nada y sin mostrar la clave ni el hash. */
export async function vistaPreviaRestablecer(
  d: DepsRestablecer,
  o: OpcionesRestablecer,
  aBcrypt = false,
): Promise<VistaPreviaRestablecer> {
  exigirBaseDeUsuario(o.instancia, o.base);
  const usuario = usuarioValido(o.usuario);
  const datosReales = await d.esDatosReales(o.instancia, o.base).catch(() => true);
  return conTablas(d, o, 'lectura', async (t, r) => {
    const filas = await t.filasDe(r, usuario);
    if (filas.length !== 1) throw unaFila(filas.length);
    const formato = formatoDe(hashDe(filas[0]!, r.hash));
    const legado = formato === 'md5' || formato === 'sha1';
    const pasa = legado && aBcrypt;
    return {
      sentencia: t.sentencia(r, 'signo'),
      formato,
      formatoNuevo: pasa ? 'bcrypt' : formato,
      cambiaFormato: pasa,
      datosReales,
    };
  });
}

/**
 * Restablece la contraseña de UNA cuenta (nunca la recupera). Orden fijo; cualquier fallo antes
 * del `UPDATE` deja la base como estaba:
 * 1. exige `confirmado` (y la confirmación reforzada si la base tiene datos reales) y valida la
 *    clave nueva;
 * 2. lee la fila (debe ser única), calcula el hash nuevo con el mismo formato y costo y comprueba
 *    que cabe en la columna;
 * 3. toma una instantánea de la base (D19). No puede ir dentro del cerrojo (la instantánea toma el
 *    mismo y no es reentrante); lo que ocurra entre ambas lo cubre el `UPDATE` condicionado al hash
 *    copiado;
 * 4. dentro del cerrojo de la base: guarda la identificación de la fila y su hash anterior en
 *    `respaldos/auditoria/`, y cambia el hash en una transacción que bloquea la fila, exige que
 *    siga siendo la misma y comprueba lo escrito antes de confirmar.
 * La clave nueva y el hash nuevo no llegan a ningún registro ni al resultado.
 */
export async function restablecer(
  d: DepsRestablecer,
  o: OpcionesRestablecerClave,
): Promise<ResultadoRestablecer> {
  if (o.confirmado !== true) {
    throw new ErrorWolf(
      'auditoria.sin_confirmar',
      'Confirme que quiere restablecer esta contraseña.',
    );
  }
  exigirBaseDeUsuario(o.instancia, o.base);
  const usuario = usuarioValido(o.usuario);
  if (typeof o.claveNueva !== 'string' || o.claveNueva === '' || o.claveNueva.length > MAX_CLAVE) {
    throw new ErrorWolf('auditoria.clave_invalida', 'La contraseña nueva no es válida.');
  }
  if (
    (await d.esDatosReales(o.instancia, o.base).catch(() => true)) &&
    o.confirmarDatosReales !== true
  ) {
    throw new ErrorWolf(
      'auditoria.datos_reales_sin_confirmar',
      'Esta base tiene datos reales de clientes: restablecer una contraseña exige la confirmación reforzada.',
    );
  }
  const { hashViejo, hashNuevo, pk } = await conTablas(d, o, 'lectura', async (t, r) => {
    const filas = await t.filasDe(r, usuario);
    if (filas.length !== 1) throw unaFila(filas.length);
    const f = filas[0]!;
    const viejo = hashDe(f, r.hash);
    const nuevo = await hashearNueva(viejo, o.claveNueva, { aBcrypt: o.aBcrypt === true });
    if (r.largoHash !== null && nuevo.hash.length > r.largoHash) {
      throw new ErrorWolf(
        'auditoria.columna_corta',
        'La columna del hash es demasiado corta para el hash nuevo: no se cambió nada.',
        { largo: r.largoHash, necesario: nuevo.hash.length },
      );
    }
    return {
      hashViejo: viejo,
      hashNuevo: nuevo.hash,
      pk: Object.fromEntries(r.pk.map((c) => [c, f[c] ?? null])),
    };
  });

  let instantanea: string;
  try {
    instantanea = (
      await d.instantaneas.tomar(o.instancia, o.base, 'Antes de restablecer una contraseña')
    ).id;
  } catch (e) {
    if (e instanceof ErrorWolf && e.codigo.startsWith('instantaneas.')) throw e;
    throw new ErrorWolf(
      'auditoria.respaldo_previo_fallo',
      'No se pudo guardar una copia de la base antes de restablecer: no se cambió nada.',
    );
  }

  return d.cerrojo.con(String(o.instancia), o.base, async () => {
    const copia = await guardarCopia(d, o, usuario, pk, hashViejo);
    await conTablas(d, o, 'escritura', (t, r) => t.reemplazar(r, usuario, hashViejo, hashNuevo));
    return { copiaFila: copia.archivo, copiaRestringida: copia.restringida, instantanea };
  });
}

/** Borra las copias de más de `DIAS_COPIAS` días (por la fecha de su nombre). */
async function purgarCopias(carpeta: string, ahora: Date): Promise<void> {
  const limite = ahora.getTime() - DIAS_COPIAS * 24 * 60 * 60 * 1000;
  let nombres: string[];
  try {
    nombres = await readdir(carpeta);
  } catch {
    return;
  }
  for (const n of nombres) {
    const m = NOMBRE_COPIA.exec(n);
    if (!m) continue;
    const t = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!);
    if (t < limite) await rm(path.join(carpeta, n), { force: true }).catch(() => undefined);
  }
}

/** Deja la ruta legible solo por el usuario; false si el sistema no pudo. */
async function limitar(d: DepsRestablecer, ruta: string): Promise<boolean> {
  if (!d.restringir) return true;
  return (await d.restringir(ruta).catch(() => false)) === true;
}

async function guardarCopia(
  d: DepsRestablecer,
  o: OpcionesRestablecer,
  usuario: string,
  pk: Record<string, unknown>,
  hashAnterior: string,
): Promise<{ archivo: string; restringida: boolean }> {
  const ahora = d.reloj?.() ?? new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  const sello =
    `${ahora.getUTCFullYear()}${p(ahora.getUTCMonth() + 1)}${p(ahora.getUTCDate())}-` +
    `${p(ahora.getUTCHours())}${p(ahora.getUTCMinutes())}${p(ahora.getUTCSeconds())}`;
  const carpeta = d.rutas.respaldosAuditoria();
  const archivo = path.join(carpeta, `${sello}-${randomBytes(3).toString('hex')}.json`);
  // Solo lo necesario para deshacer: qué fila (clave primaria y usuario) y su hash anterior.
  const cuerpo = JSON.stringify(
    {
      version: 2,
      fecha: ahora.toISOString(),
      instancia: String(o.instancia),
      base: o.base,
      esquema: o.esquema ?? null,
      tabla: o.tabla,
      columnaUsuario: o.columnaUsuario,
      columnaHash: o.columnaHash,
      usuario,
      pk,
      hashAnterior,
    },
    aJson,
    2,
  );
  let restringida = true;
  try {
    const nueva = await mkdir(carpeta, { recursive: true });
    if (nueva !== undefined && !(await limitar(d, carpeta))) restringida = false;
    await writeFile(archivo, `${cuerpo}\n`, { flag: 'wx', mode: 0o600 });
    await chmod(archivo, 0o600).catch(() => undefined);
    if (!(await limitar(d, archivo))) restringida = false;
  } catch {
    throw new ErrorWolf(
      'auditoria.copia_fallo',
      'No se pudo guardar la copia de la fila: no se cambió nada.',
    );
  }
  await purgarCopias(carpeta, ahora);
  return { archivo, restringida };
}
