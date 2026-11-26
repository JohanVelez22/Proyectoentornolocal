import { createHash } from 'node:crypto';
import type { FileHandle } from 'node:fs/promises';
import { lstat, mkdir, open, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { rutaDentroDe } from '../plataforma/sistema';
import { llevaSecreto } from '../proyectos/plantillas';
import { esNombreArchivoEnv } from '../proyectos/env/leer';
import { escribirAtomico, type OpcionesEscritura } from '../sitios/urlbase';

/**
 * Editor de código (D43): abre y guarda archivos de texto elegidos por el usuario. Reglas que no
 * se negocian:
 *
 * - La ruta ya viene de un diálogo nativo (lo exige el proceso principal). Aquí se resuelve con
 *   `realpath` y se comprueba la ruta REAL: nunca se abre ni se guarda algo dentro de la carpeta
 *   de datos de WolfCore (`data`, `respaldos`, `etc`, …), aunque se llegue por un enlace o una
 *   unión; se guarda sobre la ruta real, así un enlace sigue siendo un enlace.
 * - Nunca un `.env` (ni `.env.*`, ni `*.env`): van al gestor de variables (D16), con su flujo de
 *   secretos. Se mira el nombre pedido y el nombre real.
 * - Tope de tamaño y nada de binarios (bytes NUL o UTF-8 inválido).
 * - Un archivo con forma de secreto (clave privada, token, credenciales…) o de un sitio con
 *   `datosReales` exige una confirmación reforzada, al abrir y otra vez al guardar.
 * - Guardar exige `confirmado === true`, compara la huella (tamaño, fecha y hash) del archivo al
 *   abrirlo con la actual (si cambió por fuera, `editor.archivo_cambiado`; sobrescribir es una
 *   confirmación aparte), deja una copia previa en la carpeta de datos de WolfCore (con tope y
 *   rotación) y escribe con un temporal más `rename`. Si la copia falla, no se escribe.
 */

/** Tope de tamaño de un archivo que se abre o se guarda. */
export const MAX_BYTES_EDITOR = 2 * 1024 * 1024;
/** Copias previas que se guardan por archivo; al pasar este número se borran las más viejas. */
export const MAX_COPIAS_POR_ARCHIVO = 5;
/** Archivos distintos con copias; al pasar este número se borran los de copias más viejas. */
export const MAX_ARCHIVOS_CON_COPIAS = 200;

export type RiesgoEditor = 'secreto' | 'datos-reales';

/** Lo que tenía el archivo al leerlo: si algo de esto cambia, alguien lo tocó por fuera. */
export interface HuellaArchivo {
  tamano: number;
  mtimeMs: number;
  /** SHA-256 del contenido, en hexadecimal. */
  hash: string;
}

export interface ArchivoEditor {
  /** Ruta real (sin enlaces) sobre la que se guardará. */
  ruta: string;
  nombre: string;
  /** Texto con saltos `\n` (el original se restaura al guardar según `eol`). */
  contenido: string;
  huella: HuellaArchivo;
  eol: 'lf' | 'crlf';
  bom: boolean;
  /** Lo que se confirmó con refuerzo al abrir (vacío si nada). */
  riesgos: RiesgoEditor[];
}

export type ResultadoAbrirArchivo =
  | { estado: 'abierto'; archivo: ArchivoEditor }
  /** Hay riesgos y no se confirmó: no se devuelve contenido. */
  | { estado: 'confirmar'; nombre: string; riesgos: RiesgoEditor[] };

export interface OpcionesAbrirArchivo {
  /** Confirmación reforzada de abrir un archivo con forma de secreto o de un sitio con datos reales. */
  confirmadoRiesgo?: boolean;
}

export interface OpcionesGuardarArchivo extends OpcionesAbrirArchivo {
  contenido: string;
  /** Huella que devolvió `abrir` (o el último `guardar`). */
  huella: HuellaArchivo;
  eol: 'lf' | 'crlf';
  bom: boolean;
  /** Debe ser `true`: guardar es una acción confirmada por el usuario. */
  confirmado: true;
  /** Confirmación aparte: guardar aunque el archivo haya cambiado por fuera. */
  sobrescribir?: boolean;
}

export interface ResultadoGuardarArchivo {
  huella: HuellaArchivo;
  /** Ruta de la copia previa (en la carpeta de datos de WolfCore). */
  copia: string;
}

export interface DepsEditorCodigo {
  /** Carpeta de las copias previas (`Rutas.editorCopias()`). */
  carpetaCopias: () => string;
  /** Carpetas de datos de WolfCore: nada de lo que hay dentro se abre ni se guarda. */
  carpetasPropias: () => readonly string[];
  /** Sitios registrados (su carpeta y si tienen datos reales). */
  sitios: () => Promise<readonly { carpeta: string; datosReales: boolean }[]>;
  ahora?: () => number;
  /** Inyectable para pruebas. */
  renombrar?: OpcionesEscritura['renombrar'];
}

/** Nombres de archivo que casi siempre guardan un secreto. */
const NOMBRE_SECRETO =
  /^(?:id_(?:rsa|dsa|ecdsa|ed25519)|credentials?(?:\..*)?|\.netrc|_netrc|\.npmrc|\.pgpass|\.htpasswd|\.git-credentials|auth\.json|secrets?(?:\..*)?|.*\.(?:pem|key|p12|pfx|ppk|jks|keystore|kdbx|asc|gpg))$/i;

const tieneControles = (t: string): boolean => [...t].some((c) => c.charCodeAt(0) < 0x20);

function errorFs(
  codigo: 'editor.lectura_fallo' | 'editor.escritura_fallo' | 'editor.copia_fallo',
  e: unknown,
): ErrorWolf {
  if (e instanceof ErrorWolf) return e;
  const cod = String((e as NodeJS.ErrnoException | undefined)?.code ?? 'desconocido').slice(0, 20);
  const mensajes = {
    'editor.lectura_fallo': `No se pudo leer el archivo (${cod}).`,
    'editor.escritura_fallo': `No se pudo guardar el archivo (${cod}).`,
    'editor.copia_fallo': `No se pudo hacer la copia previa (${cod}); no se guardó nada.`,
  } as const;
  return new ErrorWolf(codigo, mensajes[codigo], { codigo: cod }, { cause: e });
}

const hashDe = (datos: Buffer): string => createHash('sha256').update(datos).digest('hex');

async function mejorRealpath(ruta: string): Promise<string> {
  try {
    return await realpath(ruta);
  } catch {
    return path.resolve(ruta);
  }
}

async function leerHasta(fh: FileHandle, tope: number): Promise<Buffer> {
  const buf = Buffer.alloc(tope + 1);
  let leidos = 0;
  while (leidos < buf.length) {
    const { bytesRead } = await fh.read(buf, leidos, buf.length - leidos, leidos);
    if (bytesRead === 0) break;
    leidos += bytesRead;
  }
  return buf.subarray(0, leidos);
}

const demasiadoGrande = (): ErrorWolf =>
  new ErrorWolf('editor.demasiado_grande', 'El archivo es demasiado grande para el editor.', {
    maximo: '2 MB',
  });

export class EditorCodigo {
  constructor(private readonly deps: DepsEditorCodigo) {}

  /** Abre el archivo. Con riesgos sin confirmar devuelve `confirmar` y NO el contenido. */
  async abrir(ruta: string, o: OpcionesAbrirArchivo = {}): Promise<ResultadoAbrirArchivo> {
    const { real, sitio } = await this.resolver(ruta);
    const { datos, huella } = await this.leer(real);
    const riesgos = this.riesgos(real, sitio, [datos]);
    if (riesgos.length > 0 && o.confirmadoRiesgo !== true) {
      return { estado: 'confirmar', nombre: path.basename(real), riesgos };
    }
    if (datos.includes(0)) throw this.binario();
    let texto: string;
    try {
      texto = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(datos);
    } catch {
      throw this.binario();
    }
    const bom = texto.startsWith('﻿');
    if (bom) texto = texto.slice(1);
    const crlf = (texto.match(/\r\n/g) ?? []).length;
    const lf = (texto.match(/(?<!\r)\n/g) ?? []).length;
    return {
      estado: 'abierto',
      archivo: {
        ruta: real,
        nombre: path.basename(real),
        contenido: texto.replace(/\r\n?/g, '\n'),
        huella,
        eol: crlf > lf ? 'crlf' : 'lf',
        bom,
        riesgos,
      },
    };
  }

  async guardar(ruta: string, o: OpcionesGuardarArchivo): Promise<ResultadoGuardarArchivo> {
    if (o.confirmado !== true) {
      throw new ErrorWolf('editor.sin_confirmar', 'Confirme el guardado antes de continuar.');
    }
    const h = o.huella as Partial<HuellaArchivo> | null | undefined;
    if (
      h === null ||
      typeof h !== 'object' ||
      !Number.isSafeInteger(h.tamano) ||
      typeof h.mtimeMs !== 'number' ||
      !Number.isFinite(h.mtimeMs) ||
      typeof h.hash !== 'string' ||
      !/^[0-9a-f]{64}$/.test(h.hash)
    ) {
      throw new ErrorWolf('editor.huella_invalida', 'Falta la huella del archivo abierto.');
    }
    if (
      typeof o.contenido !== 'string' ||
      Buffer.from(o.contenido, 'utf8').toString('utf8') !== o.contenido ||
      (o.eol !== 'lf' && o.eol !== 'crlf') ||
      typeof o.bom !== 'boolean'
    ) {
      throw new ErrorWolf('editor.contenido_invalido', 'El contenido no es texto válido.');
    }
    if (o.contenido.includes('\0')) throw this.binario();
    const normal = o.contenido.replace(/\r\n?/g, '\n');
    const texto = (o.bom ? '﻿' : '') + (o.eol === 'crlf' ? normal.replace(/\n/g, '\r\n') : normal);
    const datos = Buffer.from(texto, 'utf8');
    if (datos.length > MAX_BYTES_EDITOR) throw demasiadoGrande();

    const { real, sitio } = await this.resolver(ruta);
    const actual = await this.leer(real);
    const riesgos = this.riesgos(real, sitio, [actual.datos, datos]);
    if (riesgos.length > 0 && o.confirmadoRiesgo !== true) {
      throw new ErrorWolf(
        'editor.confirmacion_reforzada',
        'Este archivo parece guardar secretos o es de un sitio con datos reales: confirme con refuerzo para guardarlo.',
      );
    }
    const igual = (a: HuellaArchivo): boolean =>
      a.tamano === h.tamano && a.mtimeMs === h.mtimeMs && a.hash === h.hash;
    if (o.sobrescribir !== true && !igual(actual.huella)) {
      throw this.cambiado();
    }

    // Copia previa del contenido que hay AHORA en disco; si falla, no se escribe nada.
    const copia = await this.copiar(real, actual.datos).catch((e: unknown) => {
      throw errorFs('editor.copia_fallo', e);
    });

    // Justo antes de escribir, una última mirada: lo único que queda abierto es el instante del rename.
    if (o.sobrescribir !== true) {
      const ahora = await this.leer(real);
      if (!igual(ahora.huella)) throw this.cambiado();
    }
    try {
      await escribirAtomico(
        real,
        datos,
        this.deps.renombrar ? { renombrar: this.deps.renombrar } : {},
      );
    } catch (e) {
      throw errorFs('editor.escritura_fallo', e);
    }
    const info = await stat(real).catch(() => null);
    await this.rotar(path.dirname(copia)).catch(() => undefined);
    return {
      huella: { tamano: datos.length, mtimeMs: info?.mtimeMs ?? 0, hash: hashDe(datos) },
      copia,
    };
  }

  private cambiado(): ErrorWolf {
    return new ErrorWolf(
      'editor.archivo_cambiado',
      'El archivo cambió fuera del editor desde que se abrió. Recárguelo o confirme sobrescribirlo.',
    );
  }

  private binario(): ErrorWolf {
    return new ErrorWolf(
      'editor.binario',
      'El archivo no es de texto (binario): no se edita aquí.',
    );
  }

  /** Ruta real validada y el sitio al que pertenece, si alguno. */
  private async resolver(
    ruta: string,
  ): Promise<{ real: string; sitio: { carpeta: string; datosReales: boolean } | null }> {
    const invalida = (): ErrorWolf =>
      new ErrorWolf('editor.ruta_invalida', 'La ruta del archivo no es válida.');
    if (
      typeof ruta !== 'string' ||
      ruta.length === 0 ||
      ruta.length > 1024 ||
      tieneControles(ruta) ||
      !path.isAbsolute(ruta) ||
      /^[\\/]{2}[.?][\\/]/.test(ruta) ||
      // Flujos alternativos de NTFS (`archivo:flujo`): nada de dos puntos fuera de la unidad.
      ruta.slice(/^[A-Za-z]:/.test(ruta) ? 2 : 0).includes(':')
    ) {
      throw invalida();
    }
    let real: string;
    try {
      real = await realpath(ruta);
    } catch (e) {
      const c = (e as NodeJS.ErrnoException).code;
      if (c === 'ENOENT' || c === 'ENOTDIR') {
        throw new ErrorWolf('editor.no_existe', 'El archivo no existe.');
      }
      throw errorFs('editor.lectura_fallo', e);
    }
    const nombres = [path.basename(ruta), path.basename(real)];
    const sitios = await this.deps.sitios().catch(() => []);
    let sitio: { carpeta: string; datosReales: boolean } | null = null;
    for (const s of sitios) {
      const carpeta = await mejorRealpath(s.carpeta);
      if (
        rutaDentroDe(carpeta, real) &&
        (sitio === null || carpeta.length > sitio.carpeta.length)
      ) {
        sitio = { carpeta, datosReales: s.datosReales };
      }
      // `env` (CodeIgniter 4) en la raíz del sitio es el `.env` de ese sitio.
      if (path.dirname(real).toLowerCase() === carpeta.toLowerCase()) {
        if (nombres.some((n) => n.toLowerCase() === 'env')) nombres.push('.env');
      }
    }
    if (nombres.some(esNombreArchivoEnv)) {
      throw new ErrorWolf(
        'editor.archivo_env',
        'Los archivos .env se gestionan desde las variables del proyecto, no desde el editor.',
      );
    }
    for (const propia of this.deps.carpetasPropias()) {
      const propias = [propia, await mejorRealpath(propia)];
      if (propias.some((p) => rutaDentroDe(p, real) || rutaDentroDe(p, path.resolve(ruta)))) {
        throw new ErrorWolf(
          'editor.ruta_vetada',
          'Ese archivo está en la carpeta de datos de WolfCore Dev: no se abre ni se guarda desde el editor.',
        );
      }
    }
    const info = await lstat(real).catch((e: unknown) => {
      throw errorFs('editor.lectura_fallo', e);
    });
    if (!info.isFile()) {
      throw new ErrorWolf('editor.no_regular', 'Solo se editan archivos normales.');
    }
    return { real, sitio };
  }

  private async leer(real: string): Promise<{ datos: Buffer; huella: HuellaArchivo }> {
    let fh: FileHandle | undefined;
    try {
      fh = await open(real, 'r');
      const info = await fh.stat();
      if (!info.isFile())
        throw new ErrorWolf('editor.no_regular', 'Solo se editan archivos normales.');
      if (info.size > MAX_BYTES_EDITOR) throw demasiadoGrande();
      const datos = await leerHasta(fh, MAX_BYTES_EDITOR);
      if (datos.length > MAX_BYTES_EDITOR) throw demasiadoGrande();
      return {
        datos,
        huella: { tamano: datos.length, mtimeMs: info.mtimeMs, hash: hashDe(datos) },
      };
    } catch (e) {
      throw errorFs('editor.lectura_fallo', e);
    } finally {
      await fh?.close().catch(() => undefined);
    }
  }

  private riesgos(
    real: string,
    sitio: { datosReales: boolean } | null,
    contenidos: readonly Buffer[],
  ): RiesgoEditor[] {
    const res: RiesgoEditor[] = [];
    if (NOMBRE_SECRETO.test(path.basename(real)) || contenidos.some((c) => llevaSecreto(c))) {
      res.push('secreto');
    }
    if (sitio?.datosReales === true) res.push('datos-reales');
    return res;
  }

  /** Guarda `datos` como copia previa de `real` y devuelve su ruta. Nunca junto al archivo del usuario. */
  private async copiar(real: string, datos: Buffer): Promise<string> {
    const ahora = new Date((this.deps.ahora ?? Date.now)());
    const marca = ahora
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .replace(/\.(\d{3})Z$/, '-$1');
    const clave = createHash('sha1').update(real.toLowerCase()).digest('hex').slice(0, 12);
    const carpeta = path.join(this.deps.carpetaCopias(), clave);
    await mkdir(carpeta, { recursive: true });
    const nombre = path
      .basename(real)
      .replace(/[^\w.-]+/g, '_')
      .slice(0, 80);
    const destino = path.join(carpeta, `${marca}-${nombre}`);
    await writeFile(destino, datos, { flag: 'wx' });
    return destino;
  }

  /** Deja solo las últimas copias de este archivo y, en total, las de los archivos más recientes. */
  private async rotar(carpeta: string): Promise<void> {
    const copias = (await readdir(carpeta)).sort();
    for (const vieja of copias.slice(0, Math.max(0, copias.length - MAX_COPIAS_POR_ARCHIVO))) {
      await rm(path.join(carpeta, vieja), { force: true });
    }
    const raiz = this.deps.carpetaCopias();
    const archivos = await readdir(raiz, { withFileTypes: true });
    const dirs = await Promise.all(
      archivos
        .filter((d) => d.isDirectory())
        .map(async (d) => ({
          ruta: path.join(raiz, d.name),
          t: (await stat(path.join(raiz, d.name))).mtimeMs,
        })),
    );
    dirs.sort((a, b) => a.t - b.t);
    for (const d of dirs.slice(0, Math.max(0, dirs.length - MAX_ARCHIVOS_CON_COPIAS))) {
      if (d.ruta !== carpeta) await rm(d.ruta, { recursive: true, force: true });
    }
  }
}
