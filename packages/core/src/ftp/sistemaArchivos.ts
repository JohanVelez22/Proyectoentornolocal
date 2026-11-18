import { createReadStream, createWriteStream, type Stats } from 'node:fs';
import {
  lstat,
  mkdir,
  readdir,
  realpath,
  rename,
  rmdir,
  stat,
  unlink,
  chmod,
} from 'node:fs/promises';
import path from 'node:path';
import ftpSrv from 'ftp-srv';

/**
 * `ftp-srv` es CommonJS: el import por defecto es `module.exports`, que además trae
 * `FileSystem` y `ftpErrors` (los tipos de la librería no declaran `ftpErrors`).
 */
interface BibliotecaFtp {
  FileSystem: new (connection: unknown, opciones: { root: string; cwd?: string }) => ClaseBase;
  ftpErrors: { FileSystemError: new (mensaje: string, codigo?: number) => Error };
}
const biblioteca = ((ftpSrv as unknown as { default?: unknown }).default ??
  ftpSrv) as unknown as BibliotecaFtp;

interface ClaseBase {
  cwd: string;
  root: string;
  connection: unknown;
}

const BaseFileSystem = biblioteca.FileSystem as unknown as new (
  connection: unknown,
  opciones: { root: string; cwd?: string },
) => ClaseBase;

export const ACCESO_DENEGADO = 'Acceso denegado';

const errorFs = (mensaje: string, codigo = 550): Error =>
  new biblioteca.ftpErrors.FileSystemError(mensaje, codigo);

const NOMBRES_RESERVADOS = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])\s*(\..*)?$/i;

/** Resultado de interpretar una ruta del cliente dentro del espacio virtual del sitio. */
export interface RutaVirtual {
  /** Segmentos desde la raíz del sitio (vacío = la raíz). */
  segmentos: string[];
  /** Ruta que ve el cliente, con "/" y empezando por "/". */
  cliente: string;
}

const segmentosDe = (ruta: string): string[] => ruta.split('/').filter((s) => s !== '');

/**
 * Resuelve `entrada` (relativa a `cwd` o absoluta respecto a la raíz del sitio) sin tocar el
 * disco. Lanza "Acceso denegado" ante `..` que salga de la raíz (salvo `ajustar`, que se queda
 * en la raíz), letras de unidad, UNC, flujos alternos de datos (`:`), nombres de dispositivo de
 * Windows, comodines y segmentos que Windows normalizaría (`..` con puntos o espacios al final).
 */
export function resolverRutaVirtual(
  cwd: string,
  entrada: string | undefined,
  ajustar = false,
): RutaVirtual {
  const texto = entrada === undefined || entrada === '' ? '.' : entrada;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(texto)) throw errorFs(ACCESO_DENEGADO);
  const p = texto.replace(/\\/g, '/');
  if (p.startsWith('//')) throw errorFs(ACCESO_DENEGADO); // UNC (\\servidor\recurso)
  const pila = p.startsWith('/') ? [] : segmentosDe(cwd.replace(/\\/g, '/'));
  for (const seg of segmentosDe(p)) {
    if (seg === '.') continue;
    if (seg === '..') {
      if (pila.length > 0) pila.pop();
      else if (!ajustar) throw errorFs(ACCESO_DENEGADO);
      continue;
    }
    if (
      seg.includes(':') || // C:, flujos alternos (a.txt:x)
      /[<>"|?*]/.test(seg) ||
      /[. ]$/.test(seg) || // "..  " o "..." se normalizan a ".." en Windows
      NOMBRES_RESERVADOS.test(seg)
    ) {
      throw errorFs(ACCESO_DENEGADO);
    }
    pila.push(seg);
  }
  return { segmentos: pila, cliente: '/' + pila.join('/') };
}

const dentro = (raiz: string, destino: string): boolean => {
  const rel = path.relative(raiz, destino);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel));
};

const codigoDe = (e: unknown): string | undefined => (e as NodeJS.ErrnoException)?.code;

/** Traduce un error del sistema a un mensaje sin rutas locales. */
function traducir(e: unknown): Error {
  if (e instanceof biblioteca.ftpErrors.FileSystemError) return e as Error;
  switch (codigoDe(e)) {
    case 'ENOENT':
    case 'ENOTDIR':
      return errorFs('No existe el archivo o la carpeta');
    case 'EACCES':
    case 'EPERM':
    case 'EROFS':
      return errorFs(ACCESO_DENEGADO);
    case 'EEXIST':
      return errorFs('Ya existe');
    case 'ENOTEMPTY':
      return errorFs('La carpeta no está vacía');
    case 'EISDIR':
      return errorFs('Es una carpeta');
    default:
      return errorFs('No se pudo completar la operación');
  }
}

export interface OpcionesFs {
  root: string;
  /** Se consulta en cada operación: cambiarla afecta a las sesiones ya abiertas. */
  soloLectura: () => boolean;
}

/**
 * Sistema de archivos de un usuario FTP encerrado en la carpeta de su sitio. Ninguna ruta del
 * cliente llega al disco sin pasar por `resolverRutaVirtual` y por la comprobación de que su
 * ruta real (siguiendo enlaces simbólicos y uniones) sigue dentro de la carpeta.
 *
 * Límite conocido: entre la comprobación y el uso otro proceso local podría cambiar un enlace
 * (TOCTOU); el servidor solo expone carpetas del propio usuario, que ya las controla.
 */
export class SistemaArchivosEncerrado extends BaseFileSystem {
  private readonly soloLecturaAhora: () => boolean;
  private raizReal: string | null = null;

  constructor(connection: unknown, opciones: OpcionesFs) {
    super(connection, { root: opciones.root });
    this.soloLecturaAhora = opciones.soloLectura;
  }

  currentDirectory(): string {
    return this.cwd;
  }

  private exigirEscritura(): void {
    if (this.soloLecturaAhora()) throw errorFs(ACCESO_DENEGADO);
  }

  private async raiz(): Promise<string> {
    this.raizReal ??= await realpath(this.root).catch(() => {
      throw errorFs('La carpeta del sitio no existe');
    });
    return this.raizReal;
  }

  /** Ruta en disco de `ruta`, comprobando que ni ella ni sus enlaces salen de la carpeta. */
  private async ubicar(
    ruta: string | undefined,
    ajustar = false,
  ): Promise<{ disco: string; virtual: RutaVirtual }> {
    const virtual = resolverRutaVirtual(this.cwd, ruta, ajustar);
    const raiz = await this.raiz();
    const disco = path.join(this.root, ...virtual.segmentos);
    let objetivo = disco;
    for (;;) {
      try {
        const real = await realpath(objetivo);
        if (!dentro(raiz, real)) throw errorFs(ACCESO_DENEGADO);
        break;
      } catch (e) {
        if (e instanceof biblioteca.ftpErrors.FileSystemError) throw e;
        if (codigoDe(e) !== 'ENOENT' && codigoDe(e) !== 'ENOTDIR') throw errorFs(ACCESO_DENEGADO);
        // Un enlace roto sí existe (lstat), pero apunta a algo que no se puede comprobar.
        const esEnlaceRoto = await lstat(objetivo).then(
          () => true,
          () => false,
        );
        if (esEnlaceRoto) throw errorFs(ACCESO_DENEGADO);
        const padre = path.dirname(objetivo);
        if (padre === objetivo) throw errorFs(ACCESO_DENEGADO);
        objetivo = padre;
      }
    }
    return { disco, virtual };
  }

  async get(nombre: string): Promise<Stats & { name: string }> {
    try {
      const { disco } = await this.ubicar(nombre);
      return Object.assign(await stat(disco), { name: nombre });
    } catch (e) {
      throw traducir(e);
    }
  }

  async list(ruta = '.'): Promise<(Stats & { name: string })[]> {
    try {
      const { disco } = await this.ubicar(ruta);
      const raiz = await this.raiz();
      const salida: (Stats & { name: string })[] = [];
      for (const nombre of await readdir(disco)) {
        try {
          const hijo = path.join(disco, nombre);
          // Lo que apunte fuera de la carpeta no se lista.
          if (!dentro(raiz, await realpath(hijo))) continue;
          salida.push(Object.assign(await stat(hijo), { name: nombre }));
        } catch {
          // entrada que desapareció o no se puede leer: se omite
        }
      }
      return salida;
    } catch (e) {
      throw traducir(e);
    }
  }

  async chdir(ruta = '.'): Promise<string> {
    try {
      // `cd ..` en la raíz se queda en la raíz.
      const { disco, virtual } = await this.ubicar(ruta, true);
      if (!(await stat(disco)).isDirectory()) throw errorFs('No es una carpeta válida');
      this.cwd = virtual.cliente;
      return this.cwd;
    } catch (e) {
      throw traducir(e);
    }
  }

  async write(
    nombre: string,
    { append = false, start = undefined }: { append?: boolean; start?: number } = {},
  ): Promise<{ stream: NodeJS.WritableStream; clientPath: string }> {
    try {
      this.exigirEscritura();
      const { disco, virtual } = await this.ubicar(nombre);
      if (virtual.segmentos.length === 0) throw errorFs(ACCESO_DENEGADO);
      const stream = createWriteStream(disco, { flags: append ? 'a+' : 'w+', start });
      stream.once('error', (e) => {
        e.message = traducir(e).message; // sin rutas locales en la respuesta 550/551
      });
      stream.once('close', () => stream.end());
      return { stream, clientPath: virtual.cliente };
    } catch (e) {
      throw traducir(e);
    }
  }

  async read(
    nombre: string,
    { start = undefined }: { start?: number } = {},
  ): Promise<{ stream: NodeJS.ReadableStream; clientPath: string }> {
    try {
      const { disco, virtual } = await this.ubicar(nombre);
      if ((await stat(disco)).isDirectory()) throw errorFs('No se puede leer una carpeta');
      const stream = createReadStream(disco, { flags: 'r', start });
      stream.once('error', (e) => {
        e.message = traducir(e).message;
      });
      return { stream, clientPath: virtual.cliente };
    } catch (e) {
      throw traducir(e);
    }
  }

  async delete(ruta: string): Promise<void> {
    try {
      this.exigirEscritura();
      const { disco, virtual } = await this.ubicar(ruta);
      if (virtual.segmentos.length === 0) throw errorFs(ACCESO_DENEGADO);
      if ((await stat(disco)).isDirectory()) await rmdir(disco);
      else await unlink(disco);
    } catch (e) {
      throw traducir(e);
    }
  }

  /** Devuelve la ruta del cliente (no la del disco) para no revelar dónde está el sitio. */
  async mkdir(ruta: string): Promise<string> {
    try {
      this.exigirEscritura();
      const { disco, virtual } = await this.ubicar(ruta);
      if (virtual.segmentos.length === 0) throw errorFs(ACCESO_DENEGADO);
      await mkdir(disco, { recursive: true });
      return virtual.cliente;
    } catch (e) {
      throw traducir(e);
    }
  }

  async rename(desde: string, hasta: string): Promise<void> {
    try {
      this.exigirEscritura();
      const a = await this.ubicar(desde);
      const b = await this.ubicar(hasta);
      if (a.virtual.segmentos.length === 0 || b.virtual.segmentos.length === 0) {
        throw errorFs(ACCESO_DENEGADO);
      }
      await rename(a.disco, b.disco);
    } catch (e) {
      throw traducir(e);
    }
  }

  async chmod(ruta: string, modo: number): Promise<void> {
    try {
      this.exigirEscritura();
      const { disco } = await this.ubicar(ruta);
      await chmod(disco, modo);
    } catch (e) {
      throw traducir(e);
    }
  }
}
