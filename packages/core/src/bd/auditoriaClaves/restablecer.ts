import { randomBytes } from 'node:crypto';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../../errores';
import type { Rutas } from '../../rutas';
import type { ObjetivoBd } from '../basesDeDatos';
import type { CerrojoBases } from '../cerrojoBases';
import type { ModoConsulta } from './auditar';
import { formatoDe, hashearNueva, type FormatoHash } from './hashes';
import { TablasSql, type ConsultaSql, type TablaResuelta } from './tablas';

/** Contraseña nueva: tope razonable (mucho más que lo que cualquier formato usa). */
const MAX_CLAVE = 1024;
/** Tope de cada valor de la copia de la fila (un texto enorme no llena el disco). */
const MAX_VALOR_COPIA = 4096;
const PLAZO_MS = 30_000;

export interface OpcionesRestablecer {
  instancia: ObjetivoBd;
  base: string;
  tabla: string;
  columnaUsuario: string;
  columnaHash: string;
  usuario: string;
}

export interface VistaPreviaRestablecer {
  /** El `UPDATE` con `?` en lugar de los valores: la clave nueva y el hash no salen aquí. */
  sentencia: string;
  /** Formato del hash actual. */
  formato: FormatoHash;
  /** Formato del hash nuevo (md5 o sha1 pasan a bcrypt salvo que se pida mantenerlos). */
  formatoNuevo: FormatoHash;
  cambiaFormato: boolean;
}

export interface OpcionesRestablecerClave extends OpcionesRestablecer {
  claveNueva: string;
  confirmado: true;
  /** md5 y sha1 sin sal: seguir con el mismo formato en lugar de pasar a bcrypt. */
  mantenerFormato?: boolean;
}

export interface ResultadoRestablecer {
  /** Archivo con la fila tal como estaba (solo el usuario puede leerlo). */
  copiaFila: string;
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
    const t = new TablasSql(q, o.base);
    const r = await t.resolver(o.tabla, o.columnaUsuario, o.columnaHash);
    return await fn(t, r);
  } finally {
    await q.cerrar().catch(() => undefined);
  }
}

function usuarioValido(v: unknown): string {
  if (typeof v !== 'string' || v === '' || v.length > 256) {
    throw unaFila(0);
  }
  return v;
}

/** Hash de la fila (texto) o error si no es de un formato reproducible. */
function hashDe(fila: Record<string, unknown>, columna: string): string {
  const v = fila[columna];
  const h = Buffer.isBuffer(v) ? v.toString('utf8') : typeof v === 'string' ? v : '';
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
  mantenerFormato = false,
): Promise<VistaPreviaRestablecer> {
  const usuario = usuarioValido(o.usuario);
  return conTablas(d, o, 'lectura', async (t, r) => {
    const filas = await t.filasDe(r, usuario);
    if (filas.length !== 1) throw unaFila(filas.length);
    const formato = formatoDe(hashDe(filas[0]!, r.hash));
    const pasaABcrypt = (formato === 'md5' || formato === 'sha1') && !mantenerFormato;
    return {
      sentencia: t.sentencia(r, 'signo'),
      formato,
      formatoNuevo: pasaABcrypt ? 'bcrypt' : formato,
      cambiaFormato: pasaABcrypt,
    };
  });
}

/**
 * Restablece la contraseña de UNA cuenta (nunca la recupera). Orden fijo; cualquier fallo antes
 * del `UPDATE` deja la base como estaba:
 * 1. exige `confirmado` y valida la clave nueva;
 * 2. lee la fila (debe ser única) y calcula el hash nuevo con el mismo formato y costo;
 * 3. toma una instantánea de la base (D19);
 * 4. guarda la fila tal como estaba en `respaldos/auditoria/`;
 * 5. cambia el hash en una transacción que bloquea la fila y comprueba que sea una sola.
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
  const usuario = usuarioValido(o.usuario);
  if (typeof o.claveNueva !== 'string' || o.claveNueva === '' || o.claveNueva.length > MAX_CLAVE) {
    throw new ErrorWolf('auditoria.clave_invalida', 'La contraseña nueva no es válida.');
  }
  const { fila, hashNuevo } = await conTablas(d, o, 'lectura', async (t, r) => {
    const filas = await t.filasDe(r, usuario);
    if (filas.length !== 1) throw unaFila(filas.length);
    const f = filas[0]!;
    const nuevo = await hashearNueva(hashDe(f, r.hash), o.claveNueva, {
      mantenerFormato: o.mantenerFormato === true,
    });
    return { fila: f, hashNuevo: nuevo.hash };
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

  const copiaFila = await guardarCopia(d, o, usuario, fila);

  await d.cerrojo.con(String(o.instancia), o.base, () =>
    conTablas(d, o, 'escritura', async (t, r) => {
      const n = await t.reemplazar(r, usuario, hashNuevo);
      if (n !== 1) throw unaFila(n);
    }),
  );
  return { copiaFila, instantanea };
}

async function guardarCopia(
  d: DepsRestablecer,
  o: OpcionesRestablecer,
  usuario: string,
  fila: Record<string, unknown>,
): Promise<string> {
  const ahora = d.reloj?.() ?? new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  const sello =
    `${ahora.getUTCFullYear()}${p(ahora.getUTCMonth() + 1)}${p(ahora.getUTCDate())}-` +
    `${p(ahora.getUTCHours())}${p(ahora.getUTCMinutes())}${p(ahora.getUTCSeconds())}`;
  const carpeta = d.rutas.respaldosAuditoria();
  const archivo = path.join(carpeta, `${sello}-${randomBytes(3).toString('hex')}.json`);
  const cuerpo = JSON.stringify(
    {
      version: 1,
      fecha: ahora.toISOString(),
      instancia: String(o.instancia),
      base: o.base,
      tabla: o.tabla,
      columnaUsuario: o.columnaUsuario,
      columnaHash: o.columnaHash,
      usuario,
      fila,
    },
    aJson,
    2,
  );
  try {
    const nueva = await mkdir(carpeta, { recursive: true });
    if (nueva !== undefined) await d.restringir?.(carpeta).catch(() => false);
    await writeFile(archivo, `${cuerpo}\n`, { flag: 'wx', mode: 0o600 });
    await chmod(archivo, 0o600).catch(() => undefined);
    await d.restringir?.(archivo).catch(() => false);
  } catch {
    throw new ErrorWolf(
      'auditoria.copia_fallo',
      'No se pudo guardar la copia de la fila: no se cambió nada.',
    );
  }
  return archivo;
}
