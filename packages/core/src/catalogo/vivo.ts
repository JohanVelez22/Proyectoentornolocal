import { z } from 'zod';
import { ErrorWolf } from '../errores';
import type { IdCatalogo } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { CacheIndice } from './cacheIndice';
import {
  catalogo,
  ejecutableDe,
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
import { fuenteComposer } from './fuentes/composer';
import {
  fuenteCloudflared,
  fuenteMailpit,
  fuenteMongosh,
  fuenteOllama,
  fuenteRedis,
} from './fuentes/github';
import { fuenteNode } from './fuentes/node';
import { fuentePhp } from './fuentes/php';
import { fuentePython } from './fuentes/python';
import type { ContextoFuente, FuenteVersiones } from './fuentes/tipos';
import { HuellaSchema, huellaFuerte, type Huella } from './huellas';

/** Fuentes oficiales en vivo. Los servicios sin fuente salen siempre de la lista fija. */
export const FUENTES_VERSIONES: Partial<Record<ServicioInstalable, FuenteVersiones>> = {
  php: fuentePhp,
  node: fuenteNode,
  python: fuentePython,
  composer: fuenteComposer,
  mailpit: fuenteMailpit,
  ollama: fuenteOllama,
  cloudflared: fuenteCloudflared,
  redis: fuenteRedis,
  mongosh: fuenteMongosh,
};

export const TTL_CATALOGO_MS = 6 * 60 * 60 * 1000;

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
        formato: z.enum(['zip', 'exe', 'archivo']),
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
      })
      .strict()
      .refine(
        (v) => (v.huella?.algoritmo === 'sha256' ? v.sha256 === v.huella.valor : v.sha256 === null),
        'sha256 debe ser la huella SHA-256',
      )
      .refine((v) => !v.huellaDiferida || v.huella === null, 'Huella diferida con huella')
      // En PHP la rama es además la carpeta de instalación.
      .refine((v) => servicio !== 'php' || claveValida(v.rama), 'Rama de PHP no válida')
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
  return r.data as VersionDisponible[];
}

/** Rama de una versión de la lista fija ("22" en Node; "mayor.menor" en el resto). */
function ramaFija(servicio: ServicioInstalable, version: string): string {
  const [mayor = '0', menor = '0'] = version.split('.');
  return servicio === 'node' ? String(Number(mayor)) : `${Number(mayor)}.${Number(menor)}`;
}

/** Lista fija (`catalogo.json`): respaldo sin conexión, con su SHA-256 calculado al armarla. */
export function listaFija(servicio: ServicioInstalable): VersionDisponible[] {
  const tabla = catalogo as unknown as Record<string, typeof catalogo.nginx | undefined>;
  const entradas = Object.hasOwn(tabla, servicio) ? tabla[servicio] : undefined;
  return (entradas ?? []).map((e) => ({
    servicio,
    ...e,
    rama: ramaFija(servicio, e.version),
    huella: { algoritmo: 'sha256', valor: e.sha256 },
    origen: 'fija',
  }));
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

  private contexto(): ContextoFuente {
    return { f: this.f, idCatalogo: this.plataforma.idCatalogo(), ahora: this.ahora };
  }

  /** Caché del servicio ya validada; null si falta o no pasa la validación. */
  private async leerCache(
    servicio: ServicioInstalable,
  ): Promise<{ fecha: string; versiones: VersionDisponible[] } | null> {
    const g = await this.cache.leer(servicio);
    if (!g) return null;
    try {
      const versiones = validarIndice(servicio, g.versiones).map((v) => ({
        ...v,
        origen: 'cache' as const,
      }));
      return versiones.length > 0 ? { fecha: g.fecha, versiones } : null;
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
    if (cache && !refrescar && this.ahora.getTime() - Date.parse(cache.fecha) < this.ttl) {
      return conCache(cache);
    }
    try {
      const versiones = validarIndice(servicio, await fuente.listar(this.contexto()));
      if (versiones.length === 0) throw new Error('El índice no trae versiones');
      const fecha = this.ahora.toISOString();
      await this.cache.guardar(servicio, fecha, versiones).catch(() => undefined);
      return { versiones: this.conHuellaFija(servicio, versiones), origen: 'vivo', fecha };
    } catch {
      // Sin red, índice malformado o manipulado: caché (aunque esté vencida) o lista fija.
      return cache ? conCache(cache) : fija();
    }
  }

  private get ttl(): number {
    return this.o.ttlMs ?? TTL_CATALOGO_MS;
  }

  /**
   * Una versión del índice sin huella fuerte que está en la lista fija con la misma URL toma
   * el SHA-256 de la lista (calculado al armar el catálogo): no hace falta confirmar.
   */
  private conHuellaFija(
    servicio: ServicioInstalable,
    versiones: VersionDisponible[],
  ): VersionDisponible[] {
    const fija = listaFija(servicio);
    return versiones.map((v) => {
      if (huellaFuerte(v.huella)) return v;
      const f = fija.find((x) => x.version === v.version && x.url === v.url);
      if (!f) return v;
      const resto = { ...v };
      delete resto.huellaDiferida;
      return { ...resto, huella: f.huella ?? null, sha256: f.sha256 };
    });
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
