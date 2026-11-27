import { z } from 'zod';
import { ErrorWolf } from '../../errores';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { VersionDisponible } from '../catalogo';
import { claveValida, compararVersionesDesc, urlIndice } from '../comun';
import { pedirConSaltos } from '../red';
import {
  encabezadosCondicionales,
  IndiceMalformado,
  PLAZO_INDICE_MS,
  ramaMayorMenor,
  SinCambios,
  validadoresDe,
  type FuenteVersiones,
} from './tipos';

export const FULL_JSON_MONGODB = 'https://downloads.mongodb.org/full.json';
/** `full.json` pesa unos 50 MB: se lee en flujo y se corta si pasa de 80 MB. */
export const MAX_FULL_JSON_BYTES = 80 * 1024 * 1024;
/** Tamaño máximo de una sola versión dentro de `full.json`. */
const MAX_VERSION_BYTES = 4 * 1024 * 1024;
/** `full.json` tarda en llegar entero: más plazo que un índice normal. */
const PLAZO_FULL_JSON_MS = 4 * PLAZO_INDICE_MS;

const Descarga = z.object({
  arch: z.string().optional(),
  edition: z.string().optional(),
  target: z.string().optional(),
  archive: z.object({ url: z.string(), sha256: z.string().optional() }).optional(),
});
const VersionMongo = z.object({
  version: z.string(),
  production_release: z.boolean().optional(),
  development_release: z.boolean().optional(),
  downloads: z.array(Descarga),
});

/** Lo que se guarda de cada versión: solo la descarga de Windows x86_64 de la comunidad. */
export interface VersionMongoWindows {
  version: string;
  produccion: boolean;
  url: string;
  sha256: string | null;
}

const urlComunidad = (v: string): string =>
  `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${v}.zip`;

function windowsDe(crudo: unknown): VersionMongoWindows | null {
  const r = VersionMongo.safeParse(crudo);
  if (!r.success) return null;
  const v = r.data;
  if (!claveValida(v.version)) return null;
  const d = v.downloads.find(
    (x) =>
      x.target === 'windows' &&
      x.arch === 'x86_64' &&
      x.edition !== 'enterprise' &&
      x.archive?.url === urlComunidad(v.version),
  );
  if (!d?.archive) return null;
  return {
    version: v.version,
    // Producción y no de desarrollo: lo demás (rc, alpha, ramas de desarrollo) es preview.
    produccion: v.production_release === true && v.development_release !== true,
    url: d.archive.url,
    sha256: d.archive.sha256 ?? null,
  };
}

/**
 * Lee `{"versions": [ {...}, ... ]}` en flujo: cada elemento de `versions` se interpreta suelto
 * (como mucho 4 MB) y se queda solo su descarga de Windows; el resto del archivo nunca se guarda
 * entero. Más de `maxBytes` en total corta con `catalogo.respuesta_grande`.
 */
export async function versionesDeFullJson(
  res: Response,
  maxBytes = MAX_FULL_JSON_BYTES,
): Promise<VersionMongoWindows[]> {
  const grande = (): ErrorWolf =>
    new ErrorWolf(
      'catalogo.respuesta_grande',
      `La respuesta pasa del máximo de ${Math.round(maxBytes / 1024)} KB`,
      { maximo: maxBytes },
    );
  if (Number(res.headers.get('content-length') ?? 0) > maxBytes) {
    await res.body?.cancel().catch(() => undefined);
    throw grande();
  }
  if (!res.body) throw new IndiceMalformado('full.json vacío');
  const salida: VersionMongoWindows[] = [];
  const decodificador = new TextDecoder('utf-8');
  // Estado del lector: profundidad, dentro de una cadena, escape, última clave a profundidad 1.
  let profundidad = 0;
  let enCadena = false;
  let escape = false;
  let cadena: string[] | null = null;
  let ultimaClave = '';
  let enVersiones = false;
  let vistoVersiones = false;
  let captura: string[] | null = null;
  let largoCaptura = 0;
  let total = 0;
  const lector = res.body.getReader();
  try {
    for (;;) {
      const { done, value } = await lector.read();
      const texto = done ? decodificador.decode() : decodificador.decode(value, { stream: true });
      if (!done) {
        total += value.length;
        if (total > maxBytes) throw grande();
      }
      let inicio = 0;
      for (let i = 0; i < texto.length; i++) {
        const c = texto.charCodeAt(i);
        if (enCadena) {
          if (escape) escape = false;
          else if (c === 0x5c) escape = true;
          else if (c === 0x22) {
            enCadena = false;
            if (cadena) {
              cadena.push(texto.slice(inicio, i));
              ultimaClave = cadena.join('');
              cadena = null;
            }
          }
          continue;
        }
        if (c === 0x22) {
          enCadena = true;
          // Solo interesan las claves del objeto raíz (cortas).
          if (profundidad === 1) {
            cadena = [];
            inicio = i + 1;
          }
        } else if (c === 0x7b || c === 0x5b) {
          if (profundidad === 1 && c === 0x5b && ultimaClave === 'versions') {
            enVersiones = true;
            vistoVersiones = true;
          }
          if (enVersiones && profundidad === 2 && c === 0x7b) {
            captura = [];
            largoCaptura = 0;
            inicio = i;
          }
          profundidad++;
        } else if (c === 0x7d || c === 0x5d) {
          profundidad--;
          if (profundidad < 0) throw new IndiceMalformado('full.json mal formado');
          if (captura && profundidad === 2) {
            captura.push(texto.slice(inicio, i + 1));
            let crudo: unknown;
            try {
              crudo = JSON.parse(captura.join(''));
            } catch {
              throw new IndiceMalformado('Versión de full.json mal formada');
            }
            captura = null;
            const w = windowsDe(crudo);
            if (w) salida.push(w);
          }
          if (profundidad === 1) enVersiones = false;
        }
      }
      if (cadena) cadena.push(texto.slice(inicio));
      if (captura) {
        const resto = texto.slice(inicio);
        largoCaptura += resto.length;
        if (largoCaptura > MAX_VERSION_BYTES) throw grande();
        captura.push(resto);
      }
      // En el siguiente trozo, lo pendiente sigue desde su principio.
      inicio = 0;
      if (done) break;
    }
  } finally {
    await lector.cancel().catch(() => undefined);
  }
  if (!vistoVersiones || profundidad !== 0 || enCadena) {
    throw new IndiceMalformado('full.json incompleto o sin "versions"');
  }
  return salida;
}

/**
 * MongoDB: `downloads.mongodb.org/full.json` leído en flujo con tope de 80 MB; se guarda solo la
 * descarga de Windows x86_64 de la edición comunidad (`fastdl.mongodb.org`) con su
 * `archive.sha256`. Producción → `actual`; desarrollo, rc y alfas → `preview`.
 */
export const fuenteMongodb: FuenteVersiones = {
  servicio: 'mongodb',
  hostsIndice: ['downloads.mongodb.org'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const senales = [AbortSignal.timeout(PLAZO_FULL_JSON_MS), ...(ctx.senal ? [ctx.senal] : [])];
    const res = await pedirConSaltos(
      ctx.f,
      FULL_JSON_MONGODB,
      {
        signal: AbortSignal.any(senales),
        // Con la caché a mano se pide condicional: un 304 ahorra los ~50 MB.
        headers: { 'user-agent': 'WolfCoreDev', ...encabezadosCondicionales(ctx.validadores) },
      },
      urlIndice,
    );
    if (res.status === 304) {
      await res.body?.cancel().catch(() => undefined);
      throw new SinCambios();
    }
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      throw new Error(`HTTP ${res.status} en downloads.mongodb.org`);
    }
    if (ctx.guardar) ctx.guardar.validadores = validadoresDe(res);
    const vistas = new Map<string, VersionDisponible>();
    for (const w of await versionesDeFullJson(res)) {
      if (vistas.has(w.version)) continue;
      const rama = ramaMayorMenor(w.version);
      if (!rama) continue;
      vistas.set(w.version, {
        servicio: 'mongodb',
        version: w.version,
        rama,
        url: w.url,
        // Se deja tal cual (en minúsculas): la validación rechaza una huella mal formada.
        sha256: w.sha256?.toLowerCase() ?? null,
        huella: w.sha256 ? { algoritmo: 'sha256', valor: w.sha256.toLowerCase() } : null,
        formato: 'zip',
        subcarpeta: `mongodb-win32-x86_64-windows-${w.version}`,
        ejecutable: `bin/${nombreEjecutable('mongod')}`,
        soporte: w.produccion ? 'actual' : 'preview',
        finSoporte: null,
        origen: 'vivo',
      });
    }
    return [...vistas.values()].sort((a, b) => compararVersionesDesc(a.version, b.version));
  },
};
