import { z } from 'zod';
import { ErrorWolf } from '../errores';
import type { IdCatalogo } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { CacheIndice } from './cacheIndice';
import {
  catalogo,
  ejecutableDe,
  huellaDeEntrada,
  type OrigenCatalogo,
  type ServicioInstalable,
  type SoporteVersion,
  type VersionDisponible,
} from './catalogo';
import {
  claveValida,
  compararVersionesDesc,
  RAMA_VALIDA,
  rutaRelativaSegura,
  urlOficial,
} from './comun';
import { fuenteBun } from './fuentes/bun';
import { fuenteComposer } from './fuentes/composer';
import { fuenteDart } from './fuentes/dart';
import { fuenteDeno } from './fuentes/deno';
import { fuenteDotnet } from './fuentes/dotnet';
import { fuenteGo } from './fuentes/go';
import { fuenteJava } from './fuentes/java';
import { fuenteKotlin } from './fuentes/kotlin';
import { fuenteRuby } from './fuentes/ruby';
import { fuenteRust } from './fuentes/rust';
import { fuenteZig } from './fuentes/zig';
import {
  fuenteCloudflared,
  fuenteMailpit,
  fuenteSmtp4dev,
  fuenteInbucket,
  fuentePapercut,
  fuenteMongosh,
  fuenteOllama,
  fuenteMeilisearch,
  fuenteRedis,
} from './fuentes/github';
import { fuenteMariadb } from './fuentes/mariadb';
import { fuenteMongodb } from './fuentes/mongodb';
import { fuenteMysql } from './fuentes/mysql';
import { fuenteNginx } from './fuentes/nginx';
import { fuenteNgrok } from './fuentes/ngrok';
import { fuenteNode } from './fuentes/node';
import { fuentePhp } from './fuentes/php';
import { fuentePostgresql } from './fuentes/postgresql';
import { fuentePython } from './fuentes/python';
import {
  IndiceMalformado,
  SinCambios,
  type ContextoFuente,
  type FuenteVersiones,
  type Validadores,
} from './fuentes/tipos';
import { HuellaSchema, huellaFuerte, type Huella } from './huellas';

/** Fuentes oficiales en vivo. Los servicios sin fuente salen siempre de la lista fija. */
export const FUENTES_VERSIONES: Partial<Record<ServicioInstalable, FuenteVersiones>> = {
  php: fuentePhp,
  node: fuenteNode,
  python: fuentePython,
  java: fuenteJava,
  dotnet: fuenteDotnet,
  go: fuenteGo,
  rust: fuenteRust,
  bun: fuenteBun,
  deno: fuenteDeno,
  zig: fuenteZig,
  kotlin: fuenteKotlin,
  dart: fuenteDart,
  ruby: fuenteRuby,
  composer: fuenteComposer,
  mailpit: fuenteMailpit,
  smtp4dev: fuenteSmtp4dev,
  inbucket: fuenteInbucket,
  papercut: fuentePapercut,
  ollama: fuenteOllama,
  meilisearch: fuenteMeilisearch,
  cloudflared: fuenteCloudflared,
  ngrok: fuenteNgrok,
  redis: fuenteRedis,
  mongosh: fuenteMongosh,
  mysql: fuenteMysql,
  mariadb: fuenteMariadb,
  postgresql: fuentePostgresql,
  mongodb: fuenteMongodb,
  nginx: fuenteNginx,
};

export const TTL_CATALOGO_MS = 6 * 60 * 60 * 1000;
/**
 * Vigencia propia de algunos servicios: el índice de MongoDB pesa ~50 MB (además se pide
 * condicional con ETag/Last-Modified).
 */
export const TTL_POR_SERVICIO: Partial<Record<ServicioInstalable, number>> = {
  mongodb: 48 * 60 * 60 * 1000,
};
/** Desfase de reloj que se tolera en la fecha de una caché. */
export const MARGEN_RELOJ_MS = 5 * 60 * 1000;

const SOPORTES = ['lts', 'actual', 'fin', 'preview'] as const;

function esquemaVersion(servicio: ServicioInstalable) {
  return (
    z
      .object({
        servicio: z.literal(servicio),
        version: z.string().refine(claveValida, 'Versión no válida'),
        rama: z.string().regex(RAMA_VALIDA),
        url: z.string().refine(urlOficial, 'La URL debe ser https y de un host oficial'),
        sha256: z
          .string()
          .regex(/^[0-9a-f]{64}$/)
          .nullable(),
        huella: HuellaSchema.nullable(),
        formato: z.enum(['zip', 'exe', 'archivo', '7z']),
        subcarpeta: z.string().refine(rutaRelativaSegura, 'Subcarpeta no válida').optional(),
        ejecutable: z.string().refine(rutaRelativaSegura, 'Ejecutable no válido').optional(),
        soporte: z.enum(SOPORTES).optional(),
        finSoporte: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .optional(),
        origen: z.enum(['vivo', 'cache', 'fija']),
        huellaDiferida: z.literal(true).optional(),
        publicacion: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .strict()
      .refine(
        (v) => (v.huella?.algoritmo === 'sha256' ? v.sha256 === v.huella.valor : v.sha256 === null),
        'sha256 debe ser la huella SHA-256',
      )
      .refine((v) => !v.huellaDiferida || v.huella === null, 'Huella diferida con huella')
      // En PHP la rama es además la carpeta de instalación.
      .refine(
        (v) => servicio !== 'php' || claveValida(v.rama),
        'Versión principal de PHP no válida',
      )
  );
}

/**
 * Valida un índice entero con un esquema estricto. Una sola entrada inválida (URL no oficial,
 * huella mal formada, versión o rama raras, ejecutable inseguro, campo de más) lanza
 * `catalogo.indice_invalido` y se descarta todo: nunca se usa un índice a medias.
 */
export function validarIndice(
  servicio: ServicioInstalable,
  versiones: unknown,
): VersionDisponible[] {
  if (ejecutableDe(servicio) === undefined) {
    throw new ErrorWolf('catalogo.indice_invalido', `Servicio no instalable: ${String(servicio)}`);
  }
  const r = z.array(esquemaVersion(servicio)).safeParse(versiones);
  if (!r.success) {
    const detalle = r.error.issues[0];
    throw new ErrorWolf(
      'catalogo.indice_invalido',
      `El índice de versiones de ${servicio} no es válido (${detalle?.path.join('.') ?? ''}: ${detalle?.message ?? ''})`,
      { servicio },
    );
  }
  const vistas = new Set<string>();
  for (const v of r.data as VersionDisponible[]) {
    if (vistas.has(v.version)) {
      throw new ErrorWolf(
        'catalogo.indice_invalido',
        `El índice de versiones de ${servicio} repite la versión ${v.version}`,
        { servicio },
      );
    }
    vistas.add(v.version);
  }
  return r.data as VersionDisponible[];
}

/** Rama de una versión de la lista fija ("22" en Node, "17" en PostgreSQL; "mayor.menor" en el resto). */
export function ramaFija(servicio: ServicioInstalable, version: string): string {
  const [mayor = '0', menor = '0'] = version.split('.');
  return servicio === 'node' || servicio === 'postgresql' || servicio === 'java'
    ? String(Number(mayor))
    : `${Number(mayor)}.${Number(menor)}`;
}

type EntradaFija = Omit<VersionDisponible, 'servicio' | 'sha256' | 'huella'> & {
  sha256?: string;
  sha512?: string;
};

/** Lista fija (`catalogo.json`): respaldo sin conexión, con su SHA-256 calculado al armarla. */
export function listaFija(servicio: ServicioInstalable): VersionDisponible[] {
  const tabla = catalogo as unknown as Record<string, EntradaFija[] | undefined>;
  const entradas = Object.hasOwn(tabla, servicio) ? tabla[servicio] : undefined;
  return (entradas ?? []).map((e) => {
    const { sha512, ...resto } = e;
    void sha512;
    const huella = huellaDeEntrada(e);
    return {
      servicio,
      ...resto,
      sha256: huella.algoritmo === 'sha256' ? huella.valor : null,
      rama: ramaFija(servicio, e.version),
      huella,
      origen: 'fija',
    };
  });
}

/**
 * La lista fija manda sobre el índice en vivo para las versiones que ya fijó con huella fuerte. La
 * entrada fija se busca solo por versión (un tag sin `v` u otro espejo no la esquiva):
 * - misma URL y mismo algoritmo con otro valor: el binario publicado cambió, se descarta el índice
 *   entero (`IndiceMalformado`: caché o lista fija);
 * - otra URL u otro algoritmo (NuGet publica SHA-512 y se fijó SHA-256): no hay con qué comparar,
 *   así que la entrada se queda con la URL y la huella fijadas. Nunca se instala con una huella
 *   nueva sin que nadie lo note.
 */
export function aplicarListaFija(
  servicio: ServicioInstalable,
  versiones: readonly VersionDisponible[],
): VersionDisponible[] {
  const fija = listaFija(servicio);
  return versiones.map((v) => {
    const f = fija.find((x) => x.version === v.version);
    if (!f || !huellaFuerte(f.huella)) return v;
    const mismaUrl = v.url === f.url;
    if (mismaUrl && !huellaFuerte(v.huella)) return v; // `conHuellaFija` la completa
    if (mismaUrl && v.huella!.algoritmo === f.huella!.algoritmo) {
      if (v.huella!.valor.toLowerCase() !== f.huella!.valor.toLowerCase()) {
        throw new IndiceMalformado(
          `La huella en vivo de ${servicio} ${v.version} no coincide con la fijada en el catálogo`,
        );
      }
      return v;
    }
    const resto = { ...v };
    delete resto.huellaDiferida;
    delete resto.subcarpeta;
    return {
      ...resto,
      url: f.url,
      sha256: f.sha256,
      huella: f.huella ?? null,
      formato: f.formato,
      ...(f.subcarpeta ? { subcarpeta: f.subcarpeta } : {}),
      ...(f.ejecutable ? { ejecutable: f.ejecutable } : {}),
    };
  });
}

export interface FiltroVersiones {
  rama?: string;
  /** Muestra también previews y ramas sin soporte. */
  todas?: boolean;
  /** Ignora la caché vigente y consulta la fuente. */
  refrescar?: boolean;
}

export interface ListadoVersiones {
  versiones: VersionDisponible[];
  origen: OrigenCatalogo;
  /** Cuándo se consultó el índice (null en la lista fija). */
  fecha: string | null;
}

export interface RamaCatalogo {
  rama: string;
  soporte: SoporteVersion | null;
  finSoporte: string | null;
}

export interface OpcionesCatalogoVivo {
  ttlMs?: number;
  ahora?: () => Date;
  /** Para pruebas: reemplaza fuentes. */
  fuentes?: Partial<Record<ServicioInstalable, FuenteVersiones>>;
}

/**
 * Catálogo en vivo: cada servicio con fuente oficial se consulta en línea (como mucho cada 6 h);
 * si la consulta falla o el índice no pasa la validación se usa la caché (aunque esté vencida) y,
 * sin caché, la lista fija de `catalogo.json`.
 */
export class CatalogoVivo {
  private readonly cache: CacheIndice;
  private readonly enCurso = new Map<ServicioInstalable, Promise<ListadoVersiones>>();

  constructor(
    rutas: Rutas,
    private readonly plataforma: { idCatalogo(): IdCatalogo },
    private readonly f: typeof fetch = fetch,
    private readonly o: OpcionesCatalogoVivo = {},
  ) {
    this.cache = new CacheIndice(rutas);
  }

  private get ahora(): Date {
    return this.o.ahora?.() ?? new Date();
  }

  private fuente(servicio: ServicioInstalable): FuenteVersiones | undefined {
    const propias = this.o.fuentes ?? FUENTES_VERSIONES;
    return Object.hasOwn(propias, servicio) ? propias[servicio] : undefined;
  }

  private contexto(previas?: readonly VersionDisponible[]): ContextoFuente {
    return {
      f: this.f,
      idCatalogo: this.plataforma.idCatalogo(),
      ahora: this.ahora,
      ...(previas ? { previas } : {}),
    };
  }

  /** Caché del servicio ya validada; null si falta o no pasa la validación. */
  private async leerCache(servicio: ServicioInstalable): Promise<{
    fecha: string;
    versiones: VersionDisponible[];
    validadores?: Validadores;
    notas?: Record<string, string>;
  } | null> {
    const g = await this.cache.leer(servicio);
    if (!g) return null;
    // Una fecha adelantada (reloj tocado o archivo alterado) la dejaría vigente para siempre.
    if (Date.parse(g.fecha) - this.ahora.getTime() > MARGEN_RELOJ_MS) return null;
    try {
      const versiones = validarIndice(servicio, g.versiones).map((v) => ({
        ...v,
        origen: 'cache' as const,
      }));
      if (versiones.length === 0) return null;
      return {
        fecha: g.fecha,
        versiones,
        ...(g.validadores ? { validadores: g.validadores } : {}),
        ...(g.notas ? { notas: g.notas } : {}),
      };
    } catch {
      return null;
    }
  }

  /** Índice completo del servicio (sin filtrar), con su origen. */
  private indice(servicio: ServicioInstalable, refrescar: boolean): Promise<ListadoVersiones> {
    const previo = this.enCurso.get(servicio);
    if (previo && !refrescar) return previo;
    const p = this.consultar(servicio, refrescar).finally(() => {
      if (this.enCurso.get(servicio) === p) this.enCurso.delete(servicio);
    });
    this.enCurso.set(servicio, p);
    return p;
  }

  private async consultar(
    servicio: ServicioInstalable,
    refrescar: boolean,
  ): Promise<ListadoVersiones> {
    const fija = (): ListadoVersiones => ({
      versiones: listaFija(servicio),
      origen: 'fija',
      fecha: null,
    });
    const fuente = this.fuente(servicio);
    if (!fuente) return fija();
    const cache = await this.leerCache(servicio);
    const conCache = (c: NonNullable<typeof cache>): ListadoVersiones => ({
      versiones: this.conHuellaFija(servicio, c.versiones),
      origen: 'cache',
      fecha: c.fecha,
    });
    const ttl = this.ttl(servicio);
    if (cache && !refrescar && this.ahora.getTime() - Date.parse(cache.fecha) < ttl) {
      return conCache(cache);
    }
    const guardar: NonNullable<ContextoFuente['guardar']> = {};
    try {
      const previas = [...(cache?.versiones ?? []), ...listaFija(servicio)];
      const ctx: ContextoFuente = {
        ...this.contexto(previas),
        ttlMs: ttl,
        guardar,
        ...(cache?.validadores ? { validadores: cache.validadores } : {}),
        ...(cache?.notas ? { notas: cache.notas } : {}),
      };
      const versiones = aplicarListaFija(
        servicio,
        validarIndice(servicio, await fuente.listar(ctx)),
      );
      if (versiones.length === 0) throw new Error('El índice no trae versiones');
      const fecha = this.ahora.toISOString();
      await this.cache.guardar(servicio, fecha, versiones, guardar).catch(() => undefined);
      return { versiones: this.conHuellaFija(servicio, versiones), origen: 'vivo', fecha };
    } catch (e) {
      if (e instanceof SinCambios && cache) {
        // 304: la fuente confirma que la caché sigue al día; se renueva su fecha.
        const fecha = this.ahora.toISOString();
        const versiones = cache.versiones.map((v) => ({ ...v, origen: 'vivo' as const }));
        const extra = {
          ...(cache.validadores ? { validadores: cache.validadores } : {}),
          ...(cache.notas ? { notas: cache.notas } : {}),
        };
        await this.cache.guardar(servicio, fecha, versiones, extra).catch(() => undefined);
        return { versiones: this.conHuellaFija(servicio, versiones), origen: 'vivo', fecha };
      }
      // Sin red, índice malformado o manipulado: caché (aunque esté vencida) o lista fija.
      const motivo = (e instanceof Error ? e.message : String(e)).slice(0, 200);
      console.warn(
        `Catálogo de ${servicio}: se usa ${cache ? 'la caché' : 'la lista fija'} (${motivo})`,
      );
      return cache ? conCache(cache) : fija();
    }
  }

  private ttl(servicio: ServicioInstalable): number {
    return this.o.ttlMs ?? TTL_POR_SERVICIO[servicio] ?? TTL_CATALOGO_MS;
  }

  /**
   * Una versión del índice sin huella fuerte que está en la lista fija con la misma URL toma
   * el SHA-256 de la lista (calculado al armar el catálogo): no hace falta confirmar. Las
   * versiones de la lista fija que el índice ya no trae (Nginx y PostgreSQL solo publican el
   * último parche) se suman con su SHA-256 y origen "fija", con el soporte de su rama.
   */
  private conHuellaFija(
    servicio: ServicioInstalable,
    versiones: VersionDisponible[],
  ): VersionDisponible[] {
    const fija = listaFija(servicio);
    const conHuella = versiones.map((v) => {
      if (huellaFuerte(v.huella)) return v;
      const f = fija.find((x) => x.version === v.version && x.url === v.url);
      if (!f) return v;
      const resto = { ...v };
      delete resto.huellaDiferida;
      return { ...resto, huella: f.huella ?? null, sha256: f.sha256 };
    });
    const extra = fija
      .filter((f) => !versiones.some((v) => v.version === f.version))
      .map((f) => {
        const misma = versiones.find((v) => v.rama === f.rama);
        return misma
          ? { ...f, soporte: misma.soporte ?? 'actual', finSoporte: misma.finSoporte ?? null }
          : f;
      });
    return [...conHuella, ...extra];
  }

  async listar(servicio: ServicioInstalable, o: FiltroVersiones = {}): Promise<ListadoVersiones> {
    const base = await this.indice(servicio, o.refrescar === true);
    const versiones = base.versiones
      .filter((v) => o.rama === undefined || v.rama === o.rama)
      .filter((v) => o.todas === true || (v.soporte !== 'preview' && v.soporte !== 'fin'))
      .sort((a, b) => compararVersionesDesc(a.version, b.version));
    return { ...base, versiones };
  }

  async ramas(servicio: ServicioInstalable): Promise<RamaCatalogo[]> {
    const { versiones } = await this.listar(servicio, { todas: true });
    const vistas = new Map<string, RamaCatalogo>();
    for (const v of versiones) {
      const rama = v.rama ?? v.version;
      if (vistas.has(rama)) continue;
      vistas.set(rama, { rama, soporte: v.soporte ?? null, finSoporte: v.finSoporte ?? null });
    }
    return [...vistas.values()];
  }

  /**
   * Una versión concreta para instalar (lo único que manda el renderer es servicio y versión).
   * Si se listó sin huella (`huellaDiferida`), se pide ahora a la fuente:
   * - si la fuente no responde (red, HTTP, formato), `catalogo.huella_no_disponible`: se puede
   *   reintentar, pero nunca se cae a "confirmar sin huella";
   * - solo si la fuente responde y no publica huella para esa versión queda sin huella y el
   *   instalador exigirá la confirmación.
   */
  async buscar(servicio: ServicioInstalable, version: string): Promise<VersionDisponible | null> {
    if (ejecutableDe(servicio) === undefined || typeof version !== 'string') return null;
    const { versiones } = await this.indice(servicio, false);
    const v =
      versiones.find((x) => x.version === version) ??
      listaFija(servicio).find((x) => x.version === version);
    if (!v) return null;
    const fuente = this.fuente(servicio);
    if (!v.huellaDiferida || huellaFuerte(v.huella) || !fuente?.completar) return v;
    let h: Huella | null;
    try {
      h = await fuente.completar(v, this.contexto());
    } catch (e) {
      throw new ErrorWolf(
        'catalogo.huella_no_disponible',
        `No se pudo obtener la huella de ${servicio} ${version}; vuelva a intentarlo (${e instanceof Error ? e.message.slice(0, 120) : 'sin detalle'})`,
        { servicio, version },
      );
    }
    const resto = { ...v };
    delete resto.huellaDiferida;
    if (h === null) return { ...resto, huella: null, sha256: null };
    const r = HuellaSchema.safeParse(h);
    if (!r.success) {
      // Una huella publicada pero mal formada delata una fuente alterada: tampoco se ofrece instalar sin ella.
      throw new ErrorWolf(
        'catalogo.huella_no_disponible',
        `La huella publicada de ${servicio} ${version} no es válida`,
        { servicio, version },
      );
    }
    const huella = r.data;
    return { ...resto, huella, sha256: huella.algoritmo === 'sha256' ? huella.valor : null };
  }
}
