import type { EstadoInstancia, IdInstancia } from '../tipos';
import type {
  OrigenCatalogo,
  ServicioInstalable,
  SoporteVersion,
  VersionDisponible,
} from './catalogo';
import { compararVersionesDesc } from './comun';
import { huellaFuerte } from './huellas';
import type { ListadoVersiones } from './vivo';

/** Servicios con pestaña "Versiones" (spec §3.11). */
export const SERVICIOS_VERSIONES = [
  'php',
  'mysql',
  'mariadb',
  'postgresql',
  'redis',
  'mongodb',
  'node',
  'python',
  'nginx',
  'composer',
  'mailpit',
  'ollama',
  'cloudflared',
] as const satisfies readonly ServicioInstalable[];
export type ServicioVersiones = (typeof SERVICIOS_VERSIONES)[number];

export function esServicioVersiones(s: unknown): s is ServicioVersiones {
  return typeof s === 'string' && (SERVICIOS_VERSIONES as readonly string[]).includes(s);
}

/**
 * Cómo se enciende una versión en la pestaña:
 * - `instancias`: servicios de datos con varias versiones encendidas a la vez (cada una su puerto);
 * - `pool`: PHP, un pool por rama;
 * - `unica`: Nginx, Mailpit y Ollama, una sola encendida (encender otra cambia la activa);
 * - `ninguno`: Node, Python, Composer y cloudflared (solo instalar, desinstalar y predeterminada).
 */
export type TipoInterruptor = 'instancias' | 'pool' | 'unica' | 'ninguno';

export const INTERRUPTOR: Record<ServicioVersiones, TipoInterruptor> = {
  php: 'pool',
  mysql: 'instancias',
  mariadb: 'instancias',
  postgresql: 'instancias',
  redis: 'instancias',
  mongodb: 'instancias',
  node: 'ninguno',
  python: 'ninguno',
  nginx: 'unica',
  composer: 'ninguno',
  mailpit: 'unica',
  ollama: 'unica',
  cloudflared: 'ninguno',
};

/** Huella de una fila: fuerte (SHA-256/512, o se pide al instalar), débil (MD5) o ninguna. */
export type HuellaFila = 'fuerte' | 'debil' | 'ninguna';

export interface FilaVersion {
  version: string;
  instalada: boolean;
  encendida: boolean;
  /** Versión más nueva publicada de la misma rama si esta está instalada (null si no hay). */
  actualizacion: string | null;
  /** La que usan los proyectos nuevos (una sola por servicio). */
  predeterminada: boolean;
  huella: HuellaFila;
  /** Instancia que usa esta versión (servicios de datos). */
  instancia: IdInstancia | null;
  puerto: number | null;
  /** La instancia está bloqueada tras una devolución fallida. */
  bloqueada: boolean;
}

export interface RamaVersiones {
  rama: string;
  soporte: SoporteVersion | null;
  finSoporte: string | null;
  versiones: FilaVersion[];
}

export interface TablaVersiones {
  servicio: ServicioVersiones;
  origen: OrigenCatalogo;
  fecha: string | null;
  interruptor: TipoInterruptor;
  ramas: RamaVersiones[];
  /** Instancias del servicio (servicios de datos), con su estado. */
  instancias: EstadoInstancia[];
}

export interface EntradaTabla {
  servicio: ServicioVersiones;
  listado: ListadoVersiones;
  /** Versiones instaladas (la real de cada carpeta: en PHP la carpeta es la rama). */
  instaladas: string[];
  /** Versiones encendidas (`pool`/`unica`). */
  encendidas: string[];
  instancias: EstadoInstancia[];
  /** Versión predeterminada (null = ninguna instalada). */
  predeterminada: string | null;
  /** Rama de una versión que no trae el listado (instalada pero ya no publicada). */
  ramaDe: (version: string) => string;
}

export function huellaDeFila(v: VersionDisponible): HuellaFila {
  if (huellaFuerte(v.huella) || v.huellaDiferida === true) return 'fuerte';
  if (v.huella?.algoritmo === 'md5') return 'debil';
  if (!v.huella && v.sha256) return 'fuerte';
  return 'ninguna';
}

/**
 * Arma la tabla de la pestaña "Versiones": el listado del catálogo más lo instalado que ya no se
 * publica, agrupado por rama (de la más nueva a la más vieja) y con las marcas de cada fila.
 */
export function armarTabla(e: EntradaTabla): TablaVersiones {
  const interruptor = INTERRUPTOR[e.servicio];
  const porVersion = new Map<string, VersionDisponible>();
  for (const v of e.listado.versiones) if (!porVersion.has(v.version)) porVersion.set(v.version, v);
  const ramaDe = (v: string): string => porVersion.get(v)?.rama ?? e.ramaDe(v);
  const instaladas = new Set(e.instaladas);
  const encendidas = new Set(e.encendidas);
  const todas = new Set([...porVersion.keys(), ...instaladas]);

  const ramas = new Map<string, RamaVersiones>();
  for (const version of todas) {
    const rama = ramaDe(version);
    let r = ramas.get(rama);
    if (!r) {
      r = { rama, soporte: null, finSoporte: null, versiones: [] };
      ramas.set(rama, r);
    }
    const v = porVersion.get(version);
    if (v) {
      r.soporte ??= v.soporte ?? null;
      r.finSoporte ??= v.finSoporte ?? null;
    }
    const inst =
      interruptor === 'instancias'
        ? (e.instancias.find((i) => i.version === version) ?? null)
        : null;
    const instalada = instaladas.has(version);
    r.versiones.push({
      version,
      instalada,
      encendida:
        interruptor === 'instancias'
          ? inst?.estado === 'encendido'
          : interruptor === 'ninguno'
            ? false
            : encendidas.has(version),
      actualizacion: null,
      predeterminada: version === e.predeterminada,
      huella: v ? huellaDeFila(v) : 'fuerte',
      instancia: inst?.id ?? null,
      puerto: inst?.puerto ?? null,
      bloqueada: !!inst?.bloqueo,
    });
  }
  for (const r of ramas.values()) {
    r.versiones.sort((a, b) => compararVersionesDesc(a.version, b.version));
    // La más nueva publicada de la rama (sin contar lo instalado que ya no se publica).
    const publicada = r.versiones.find((f) => porVersion.has(f.version))?.version ?? null;
    for (const f of r.versiones) {
      if (f.instalada && publicada && compararVersionesDesc(publicada, f.version) < 0) {
        f.actualizacion = publicada;
      }
    }
  }
  return {
    servicio: e.servicio,
    origen: e.listado.origen,
    fecha: e.listado.fecha,
    interruptor,
    ramas: [...ramas.values()].sort((a, b) => compararVersionesDesc(a.rama, b.rama)),
    instancias: e.instancias,
  };
}
