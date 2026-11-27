import { createHash, timingSafeEqual } from 'node:crypto';
import { open, readdir, realpath, lstat, stat, type FileHandle } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { pipeline } from 'node:stream';
import type { DetectorSensible } from '../herramientas/archivoSensible';
import { rutaDentroDe } from '../plataforma/sistema';
import {
  esCarpetaProhibida,
  leerRutaPedida,
  listadoHtml,
  nombreDescarga,
  nombreSeguro,
  sinControles,
  tipoDe,
  type EntradaListado,
} from './contenido';

/**
 * Servidor de solo lectura de «Compartir carpeta o archivo» (D52). Escucha solo en 127.0.0.1 (el
 * túnel es lo único que lo alcanza desde fuera) y todo cuelga de un token en la ruta:
 * `/<token>/…`. Sin el token, o con otro, la respuesta es un 404 vacío, igual que cualquier ruta
 * que no exista, esté fuera de lo compartido o sea sensible.
 *
 * Qué se sirve: solo GET y HEAD. Nunca `.env*`, archivos con nombre o contenido de secreto,
 * archivos con más de un enlace duro, datos reales de un sitio ni nada dentro de `.git`, `.ssh`,
 * `.aws`… La ruta pedida se decodifica una vez, cada tramo se valida y el resultado se resuelve con
 * `realpath`: debe quedar dentro de la raíz (un enlace o una unión que salga de ella da 404). El
 * archivo se abre una vez y de ese mismo descriptor salen la comprobación de enlaces, el análisis
 * del contenido y el envío por stream. No se ejecuta ni se interpreta nada.
 */

export const LIMITE_CONEXIONES = 32;
/** Se analiza entero el contenido de un archivo hasta este tamaño; de ahí en adelante, el inicio. */
export const MAX_ANALISIS_BYTES = 8 * 1024 * 1024;
const ANALISIS_INICIO_BYTES = 1024 * 1024;
/** En un listado, solo se analiza el contenido de los archivos pequeños (el resto, por nombre). */
const MAX_ANALISIS_LISTADO = 256 * 1024;
const MAX_ENTRADAS_LISTADO = 1000;

export interface AccesoCompartido {
  /** Marca de tiempo (ms desde 1970). */
  hora: number;
  /** IP del cliente (`cf-connecting-ip` si viene del túnel); solo para mostrar. */
  ip: string;
  metodo: string;
  /** Ruta relativa a lo compartido, sin el token; null si la petición no traía el token correcto. */
  ruta: string | null;
  codigo: number;
}

export interface OpcionesServidor {
  /** Carpeta o archivo compartido, ya con `realpath` y validado. */
  raiz: string;
  tipo: 'carpeta' | 'archivo';
  token: string;
  detector: DetectorSensible;
  alAcceso: (a: AccesoCompartido) => void;
  maxConexiones?: number;
  ahora?: () => number;
}

const CABECERAS_COMUNES: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex',
  'Cross-Origin-Resource-Policy': 'same-origin',
};
const CSP_LISTADO = "default-src 'none'; style-src 'unsafe-inline'";

function igualTiempoConstante(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

const IP_VISIBLE = /^[0-9a-fA-F:.]{2,45}$/;

function ipDe(req: http.IncomingMessage): string {
  const unica = (v: string | string[] | undefined): string | null => {
    const t = (Array.isArray(v) ? v[0] : v)?.split(',')[0]?.trim();
    return t && IP_VISIBLE.test(t) ? t : null;
  };
  return (
    unica(req.headers['cf-connecting-ip']) ??
    unica(req.headers['x-forwarded-for']) ??
    req.socket.remoteAddress ??
    '?'
  );
}

type Destino =
  | { tipo: 'carpeta'; real: string; relativa: string[] }
  | { tipo: 'archivo'; real: string; relativa: string[] };

export class ServidorCompartir {
  private constructor(
    private readonly o: OpcionesServidor,
    private readonly servidor: http.Server,
    readonly puerto: number,
  ) {}

  static async iniciar(o: OpcionesServidor): Promise<ServidorCompartir> {
    const raiz = o.raiz;
    const esArchivo = o.tipo === 'archivo';
    const nombreArchivo = esArchivo ? path.basename(raiz) : '';
    const ahora = o.ahora ?? Date.now;

    const manejar = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
      const metodo = (req.method ?? '').slice(0, 16);
      const ip = ipDe(req);
      let registrado = false;
      const registrar = (codigo: number, ruta: string | null): void => {
        if (registrado) return;
        registrado = true;
        o.alAcceso({
          hora: ahora(),
          ip,
          metodo: sinControles(metodo, 16),
          ruta: ruta === null ? null : sinControles(ruta, 300),
          codigo,
        });
      };
      const vacia = (codigo: number, ruta: string | null, extra: Record<string, string> = {}) => {
        registrar(codigo, ruta);
        res.writeHead(codigo, { ...CABECERAS_COMUNES, 'Content-Length': '0', ...extra });
        res.end();
      };
      const noEncontrado = (ruta: string | null) => vacia(404, ruta);

      const url = req.url ?? '';
      const q = url.indexOf('?');
      const camino = q >= 0 ? url.slice(0, q) : url;
      if (!camino.startsWith('/') || camino.startsWith('//')) return noEncontrado(null);
      const sinBarra = camino.slice(1);
      const i = sinBarra.indexOf('/');
      const segmento = i < 0 ? sinBarra : sinBarra.slice(0, i);
      const resto = i < 0 ? '' : sinBarra.slice(i);
      if (!igualTiempoConstante(segmento, o.token)) return noEncontrado(null);

      if (metodo !== 'GET' && metodo !== 'HEAD') {
        return vacia(405, '/', { Allow: 'GET, HEAD' });
      }
      if (resto === '') return vacia(302, '/', { Location: `/${o.token}/` });

      const pedida = leerRutaPedida(resto);
      if (!pedida.ok) return noEncontrado(resto);
      const { tramos, terminaEnBarra } = pedida;
      const mostrada = `/${tramos.join('/')}${terminaEnBarra && tramos.length > 0 ? '/' : ''}`;

      const destino = await resolver(tramos);
      if (!destino) return noEncontrado(mostrada);

      if (destino.tipo === 'carpeta') {
        if (!terminaEnBarra && tramos.length > 0) {
          const loc = `/${o.token}/${tramos.map(encodeURIComponent).join('/')}/`;
          return vacia(302, mostrada, { Location: loc });
        }
        const { entradas, hayMas } = await listar(destino);
        const cuerpo = Buffer.from(listadoHtml(tramos.join('/'), entradas, hayMas), 'utf8');
        registrar(200, mostrada);
        res.writeHead(200, {
          ...CABECERAS_COMUNES,
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': CSP_LISTADO,
          'Content-Length': String(cuerpo.length),
        });
        res.end(metodo === 'HEAD' ? undefined : cuerpo);
        return;
      }

      // Archivo: con `/` al final no es un archivo.
      if (terminaEnBarra) return noEncontrado(mostrada);
      const abs = path.join(raiz, ...(esArchivo ? [] : tramos));
      let fh: FileHandle | null = null;
      try {
        fh = await open(destino.real, 'r');
        const info = await fh.stat();
        if (!info.isFile()) return noEncontrado(mostrada);
        if (o.detector.porRuta(destino.real, info.nlink) || o.detector.porRuta(abs, info.nlink)) {
          return noEncontrado(mostrada);
        }
        const leer = Math.min(
          info.size,
          info.size <= MAX_ANALISIS_BYTES ? info.size : ANALISIS_INICIO_BYTES,
        );
        if (leer > 0) {
          const b = Buffer.alloc(leer);
          const { bytesRead } = await fh.read(b, 0, leer, 0);
          if (o.detector.porContenido(b.subarray(0, bytesRead))) return noEncontrado(mostrada);
        }
        const nombre = path.basename(destino.real);
        const nombrePedido = tramos[tramos.length - 1] ?? nombre;
        const { tipo, descarga } = tipoDe(nombrePedido);
        const cabeceras: Record<string, string> = {
          ...CABECERAS_COMUNES,
          'Content-Type': tipo,
          'Content-Length': String(info.size),
        };
        if (descarga) {
          cabeceras['Content-Disposition'] = nombreDescarga(nombrePedido);
          cabeceras['Content-Security-Policy'] = "default-src 'none'; sandbox";
        }
        registrar(200, mostrada);
        res.writeHead(200, cabeceras);
        if (metodo === 'HEAD' || info.size === 0) {
          res.end();
          await fh.close();
          fh = null;
          return;
        }
        const flujo = fh.createReadStream({ start: 0, autoClose: true });
        fh = null; // el stream lo cierra
        res.once('close', () => flujo.destroy());
        pipeline(flujo, res, () => undefined);
      } catch {
        if (!res.headersSent) noEncontrado(mostrada);
        else res.destroy();
      } finally {
        await fh?.close().catch(() => undefined);
      }
    };

    /** Lo pedido ya resuelto con `realpath`, o null si no existe, sale de la raíz o está prohibido. */
    async function resolver(tramos: string[]): Promise<Destino | null> {
      if (esArchivo) {
        if (tramos.length === 0) return { tipo: 'carpeta', real: path.dirname(raiz), relativa: [] };
        if (tramos.length === 1 && tramos[0]!.toLowerCase() === nombreArchivo.toLowerCase()) {
          return { tipo: 'archivo', real: raiz, relativa: tramos };
        }
        return null;
      }
      if (tramos.some(esCarpetaProhibida)) return null;
      const abs = path.join(raiz, ...tramos);
      let real: string;
      try {
        real = await realpath(abs);
      } catch {
        return null;
      }
      if (!rutaDentroDe(raiz, real)) return null;
      const rel = path.relative(raiz, real).split(path.sep).filter(Boolean);
      if (rel.some(esCarpetaProhibida)) return null;
      let info;
      try {
        info = await stat(real);
      } catch {
        return null;
      }
      if (info.isDirectory()) return { tipo: 'carpeta', real, relativa: tramos };
      if (info.isFile()) return { tipo: 'archivo', real, relativa: tramos };
      return null;
    }

    async function listar(d: {
      real: string;
    }): Promise<{ entradas: EntradaListado[]; hayMas: boolean }> {
      if (esArchivo) {
        const info = await stat(raiz).catch(() => null);
        return {
          entradas: info ? [{ nombre: nombreArchivo, carpeta: false, bytes: info.size }] : [],
          hayMas: false,
        };
      }
      const nombres = await readdir(d.real).catch(() => [] as string[]);
      const entradas: EntradaListado[] = [];
      let hayMas = false;
      for (const nombre of nombres) {
        if (!nombreSeguro(nombre) || esCarpetaProhibida(nombre)) continue;
        const abs = path.join(d.real, nombre);
        let real: string;
        try {
          real = await realpath(abs);
        } catch {
          continue;
        }
        if (!rutaDentroDe(raiz, real)) continue;
        if (path.relative(raiz, real).split(path.sep).some(esCarpetaProhibida)) continue;
        const info = await lstat(real).catch(() => null);
        if (!info) continue;
        if (info.isDirectory()) {
          entradas.push({ nombre, carpeta: true, bytes: null });
        } else if (info.isFile()) {
          if (o.detector.porRuta(abs, info.nlink) || o.detector.porRuta(real, info.nlink)) continue;
          if (info.size <= MAX_ANALISIS_LISTADO && info.size > 0) {
            const fh = await open(real, 'r').catch(() => null);
            if (!fh) continue;
            try {
              const b = Buffer.alloc(info.size);
              const { bytesRead } = await fh.read(b, 0, info.size, 0);
              if (o.detector.porContenido(b.subarray(0, bytesRead))) continue;
            } finally {
              await fh.close().catch(() => undefined);
            }
          }
          entradas.push({ nombre, carpeta: false, bytes: info.size });
        }
        if (entradas.length >= MAX_ENTRADAS_LISTADO) {
          hayMas = true;
          break;
        }
      }
      entradas.sort(
        (a, b) =>
          Number(b.carpeta) - Number(a.carpeta) ||
          a.nombre.localeCompare(b.nombre, 'en', { numeric: true }),
      );
      return { entradas, hayMas };
    }

    const servidor = http.createServer({ maxHeaderSize: 8192 }, (req, res) => {
      void manejar(req, res).catch(() => {
        if (!res.headersSent) {
          res.writeHead(404, { ...CABECERAS_COMUNES, 'Content-Length': '0' });
          res.end();
        } else res.destroy();
      });
    });
    servidor.maxConnections = o.maxConexiones ?? LIMITE_CONEXIONES;
    servidor.headersTimeout = 15_000;
    servidor.requestTimeout = 30_000;
    servidor.keepAliveTimeout = 5_000;
    servidor.on('clientError', (_e, socket) => socket.destroy());
    await new Promise<void>((ok, mal) => {
      servidor.once('error', mal);
      servidor.listen(0, '127.0.0.1', () => {
        servidor.off('error', mal);
        ok();
      });
    });
    return new ServidorCompartir(o, servidor, (servidor.address() as AddressInfo).port);
  }

  /** Cierra el servidor y corta toda conexión, incluso una descarga en curso. */
  async cerrar(): Promise<void> {
    await new Promise<void>((ok) => {
      this.servidor.close(() => ok());
      this.servidor.closeAllConnections();
    });
  }
}
