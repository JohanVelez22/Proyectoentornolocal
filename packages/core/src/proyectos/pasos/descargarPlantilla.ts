import { createHash, randomBytes } from 'node:crypto';
import { cp, mkdir, open, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { normalizarHuella } from '../../catalogo/huellas';
import { leerAcotado, pedirConSaltos } from '../../catalogo/red';
import { extraerZip } from '../../catalogo/zip';
import { ErrorWolf } from '../../errores';
import type { ImplementacionPaso } from '../pasos';
import { argsDe, comprobarSenal, type DepsPasos } from './comun';
import { carpetaVacia } from './crearDesdeComposer';

/** Tope del zip de WordPress (hoy ~28 MB): una respuesta enorme se corta sin guardarla. */
export const MAX_BYTES_PLANTILLA = 200 * 1024 * 1024;
const VERSION_WP = /^\d{1,2}\.\d{1,2}(\.\d{1,2})?$/;

/**
 * Único destino de esta descarga: https://wordpress.org, sin usuario, contraseña ni puerto. Se
 * aplica a cada salto de una redirección; no depende de la lista global de descargas.
 */
export function urlWordpress(texto: string): boolean {
  try {
    const u = new URL(texto);
    return (
      u.protocol === 'https:' &&
      u.hostname === 'wordpress.org' &&
      u.username === '' &&
      u.password === '' &&
      u.port === ''
    );
  } catch {
    return false;
  }
}

/** Plantillas oficiales que se descargan (solo WordPress en D12). */
const SERVICIOS = ['wordpress'] as const;

/**
 * Descarga la plantilla oficial (WordPress) en la carpeta del proyecto. La huella publicada es
 * SHA-1 (débil, y viene del mismo host): sin `args.confirmarHuellaDebil` falla con
 * `catalogo.huella_debil` **antes** de bajar nada. Host y redirecciones, solo `wordpress.org`.
 * Nunca pisa: si la carpeta ya tiene archivos, falla con `proyectos.carpeta_no_vacia`.
 */
export function pasoDescargarPlantilla(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const servicio = args.servicio;
    if (typeof servicio !== 'string' || !(SERVICIOS as readonly string[]).includes(servicio)) {
      throw new Error(`Plantilla no disponible: ${String(servicio).slice(0, 40)}`);
    }
    const version = args.version;
    if (typeof version !== 'string' || !VERSION_WP.test(version)) {
      throw new Error(`La versión de WordPress no es válida: ${String(version).slice(0, 20)}`);
    }
    if (!(await carpetaVacia(ctx.carpeta))) {
      throw new ErrorWolf(
        'proyectos.carpeta_no_vacia',
        'La carpeta ya tiene archivos: no se descarga la plantilla encima.',
      );
    }
    if (args.confirmarHuellaDebil !== true) {
      throw new ErrorWolf(
        'catalogo.huella_debil',
        `WordPress ${version} solo publica una huella SHA-1 (débil): hay que confirmar la descarga`,
        { servicio: 'wordpress', version },
      );
    }
    const f = d.fetch ?? fetch;
    const url = `https://wordpress.org/wordpress-${version}.zip`;
    const init = { signal: ctx.senal };

    ctx.linea(`> descargar wordpress-${version}.zip.sha1`);
    const resSuma = await pedirConSaltos(f, `${url}.sha1`, init, urlWordpress);
    if (!resSuma.ok) {
      throw new Error(`No se pudo leer la huella de WordPress ${version} (HTTP ${resSuma.status})`);
    }
    const publicada = normalizarHuella(
      'sha1',
      (await leerAcotado(resSuma, 1024)).trim().split(/\s+/)[0] ?? '',
    );
    if (!publicada) {
      throw new ErrorWolf('catalogo.huella_no_disponible', 'La huella publicada no es válida', {
        servicio: 'wordpress',
        version,
      });
    }

    const tmp = d.rutas.tmp();
    const id = `wordpress-${version}-${randomBytes(4).toString('hex')}`;
    const zip = path.join(tmp, `${id}.zip`);
    const stage = path.join(tmp, id);
    try {
      await mkdir(tmp, { recursive: true });
      ctx.linea(`> descargar wordpress-${version}.zip`);
      const res = await pedirConSaltos(f, url, init, urlWordpress);
      if (!res.ok || !res.body) {
        throw new Error(`No se pudo descargar WordPress ${version} (HTTP ${res.status})`);
      }
      const demasiado = (): ErrorWolf =>
        new ErrorWolf('catalogo.respuesta_grande', 'La descarga es demasiado grande', {
          maximo: MAX_BYTES_PLANTILLA,
        });
      if (Number(res.headers.get('content-length') ?? 0) > MAX_BYTES_PLANTILLA) {
        await res.body.cancel().catch(() => undefined);
        throw demasiado();
      }
      const hash = createHash('sha1');
      const fh = await open(zip, 'w');
      let total = 0;
      const lector = res.body.getReader();
      try {
        for (;;) {
          comprobarSenal(ctx);
          const { done, value } = await lector.read();
          if (done) break;
          total += value.length;
          if (total > MAX_BYTES_PLANTILLA) throw demasiado();
          hash.update(value);
          await fh.write(value);
        }
      } finally {
        await lector.cancel().catch(() => undefined);
        await fh.close();
      }
      if (hash.digest('hex') !== publicada.valor) {
        throw new ErrorWolf(
          'catalogo.huella_no_coincide',
          'La descarga no coincide con su huella publicada: no se usa',
        );
      }
      comprobarSenal(ctx);
      ctx.linea('Huella SHA-1 verificada. Extrayendo…');
      await extraerZip(zip, stage, { maxEntradas: 20_000, maxBytes: 600 * 1024 * 1024 });
      const raiz = path.join(stage, 'wordpress');
      const hijos = await readdir(raiz).catch(() => [] as string[]);
      if (hijos.length === 0) {
        throw new Error('El paquete de WordPress no trae la carpeta esperada.');
      }
      // El zip trae todo dentro de wordpress/: se copia su contenido a la carpeta del proyecto
      // (copia y no rename: la carpeta puede estar en otra unidad). Nada se sobrescribe.
      for (const hijo of hijos) {
        await cp(path.join(raiz, hijo), path.join(ctx.carpeta, hijo), {
          recursive: true,
          force: false,
          errorOnExist: true,
        });
      }
      ctx.linea(`WordPress ${version} quedó en la carpeta del proyecto.`);
    } finally {
      await rm(zip, { force: true }).catch(() => undefined);
      await rm(stage, { recursive: true, force: true }).catch(() => undefined);
    }
  };
}
