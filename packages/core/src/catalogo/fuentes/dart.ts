import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { compararVersionesDesc } from '../comun';
import type { Huella } from '../huellas';
import { huellasDeUltimas } from './node';
import {
  IndiceMalformado,
  leerIndice,
  leerIndiceJson,
  ramaMayorMenor,
  sumaDe,
  type ContextoFuente,
  type FuenteVersiones,
} from './tipos';

const BUCKET = 'dart-archive';
/** Listado JSON del bucket (solo prefijos, es decir, las carpetas de versión). */
const LISTADO = `https://storage.googleapis.com/storage/v1/b/${BUCKET}/o`;
const PREFIJO = 'channels/stable/release/';
export const BASE_DART = `https://storage.googleapis.com/${BUCKET}/${PREFIJO}`;
const ARCHIVO = 'dartsdk-windows-x64-release.zip';
/** Ramas "3.N" que se ofrecen (la última versión de cada una). */
const MAX_RAMAS = 6;
/** Páginas del listado que se leen como máximo (1000 carpetas por página). */
const MAX_PAGINAS = 4;

const Pagina = z.object({
  prefixes: z.array(z.string()).default([]),
  nextPageToken: z.string().optional(),
});

/** Solo versiones "3.14.1": las carpetas numéricas viejas (revisiones) y `latest` no cuentan. */
const VERSION_DART = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

const urlZip = (version: string): string => `${BASE_DART}${version}/sdk/${ARCHIVO}`;

/** Huella SHA-256 de `<zip>.sha256sum` (`<hex> *dartsdk-windows-x64-release.zip`). */
async function huellaDart(version: string, ctx: ContextoFuente): Promise<Huella | null> {
  const texto = await leerIndice(ctx, `${urlZip(version)}.sha256sum`, { maxBytes: 4096 });
  const valor = sumaDe(texto, ARCHIVO);
  return valor ? { algoritmo: 'sha256', valor } : null;
}

async function listarVersiones(ctx: ContextoFuente): Promise<string[]> {
  const versiones = new Set<string>();
  let token: string | undefined;
  for (let i = 0; i < MAX_PAGINAS; i++) {
    const url =
      `${LISTADO}?prefix=${PREFIJO}&delimiter=/&maxResults=1000&fields=prefixes,nextPageToken` +
      (token ? `&pageToken=${encodeURIComponent(token)}` : '');
    const crudo = Pagina.safeParse(await leerIndiceJson(ctx, url));
    if (!crudo.success) throw new IndiceMalformado('Listado de Dart con forma rara');
    for (const p of crudo.data.prefixes) {
      if (!p.startsWith(PREFIJO) || !p.endsWith('/')) continue;
      const v = p.slice(PREFIJO.length, -1);
      if (VERSION_DART.test(v)) versiones.add(v);
    }
    token = crudo.data.nextPageToken;
    if (!token) return [...versiones];
  }
  // Más páginas de las esperadas: un listado raro se descarta entero.
  throw new IndiceMalformado('Listado de Dart demasiado largo');
}

/**
 * Dart: `storage.googleapis.com/dart-archive` (canal estable). Las versiones salen del listado
 * JSON del bucket con prefijo y delimitador; la huella SHA-256, de `<zip>.sha256sum`, se lee al
 * listar para la última versión de cada rama y al instalar para el resto. El zip trae
 * `dart-sdk/`. Las dos ramas más nuevas son las vigentes. Dart no publica firmas.
 */
export const fuenteDart: FuenteVersiones = {
  servicio: 'dart',
  hostsIndice: ['storage.googleapis.com'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const todas = (await listarVersiones(ctx)).sort(compararVersionesDesc);
    const porRama = new Map<string, string>();
    for (const v of todas) {
      const rama = ramaMayorMenor(v);
      if (rama && !porRama.has(rama)) porRama.set(rama, v);
      if (porRama.size >= MAX_RAMAS) break;
    }
    const versiones: VersionDisponible[] = [...porRama.entries()].map(([rama, version], i) => {
      const soporte: SoporteVersion = i < 2 ? 'actual' : 'fin';
      return {
        servicio: 'dart',
        version,
        rama,
        url: urlZip(version),
        sha256: null,
        huella: null,
        huellaDiferida: true,
        formato: 'zip',
        subcarpeta: 'dart-sdk',
        ejecutable: `bin/${nombreEjecutable('dart')}`,
        soporte,
        finSoporte: null,
        origen: 'vivo',
      };
    });
    await huellasDeUltimas(
      versiones,
      () => true,
      (v) => huellaDart(v.version, ctx),
    );
    return versiones;
  },
  completar(v, ctx) {
    return huellaDart(v.version, ctx);
  },
};
