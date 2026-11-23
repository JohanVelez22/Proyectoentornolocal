import type { Aviso, EntradaAviso } from '../avisos/avisos';
import { claveMayor, claveMayorMenor } from '../rutas';
import type { ServicioInstalable, VersionDisponible } from './catalogo';
import { claveValida, compararVersionesDesc } from './comun';
import { huellaFuerte } from './huellas';
import type { FiltroVersiones, ListadoVersiones } from './vivo';

/** Servicios con pestaña de versiones (spec §3.11): de estos se avisa si hay algo nuevo. */
export const SERVICIOS_NOVEDADES: readonly ServicioInstalable[] = [
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
];

/** Servicios de datos con instancias por rama y la clave de su carpeta de datos. */
const CLAVE_INSTANCIA: Partial<Record<ServicioInstalable, (v: string) => string>> = {
  mysql: claveMayorMenor,
  mariadb: claveMayorMenor,
  mongodb: claveMayorMenor,
  postgresql: claveMayor,
  redis: claveMayor,
};

/** Un día: como mucho un aviso de versiones por servicio en este plazo. */
export const PLAZO_AVISO_NOVEDAD_MS = 24 * 60 * 60 * 1000;

export interface Novedad {
  servicio: ServicioInstalable;
  /** Instancia (`<servicio>@<clave>`) a la que afecta un parche; null en una rama nueva. */
  instancia: string | null;
  actual: string;
  nueva: string;
  tipo: 'parche' | 'rama';
  /** La versión nueva tiene huella fuerte (o la tendrá al instalar: `huellaDiferida`). */
  huellaFuerte: boolean;
}

export interface DepsNovedades {
  catalogo: {
    listar(servicio: ServicioInstalable, o?: FiltroVersiones): Promise<ListadoVersiones>;
  };
  /** Versiones instaladas (en PHP, la del parche instalado, no la carpeta de la rama). */
  instalados(servicio: ServicioInstalable): Promise<{ version: string }[]>;
  centro: { publicar(a: EntradaAviso): Aviso | null; lista(): Aviso[] };
  /** `Config.avisos.tipos['version-nueva']` y `Config.catalogo.silenciados`. */
  config(): Promise<{ activo: boolean; silenciados: readonly string[] }>;
  ahora?: () => Date;
}

/** Rama de una versión cuando el índice no la trae: "22" en Node, "17" en PostgreSQL. */
function ramaPorRegla(servicio: ServicioInstalable, version: string): string {
  return servicio === 'node' || servicio === 'postgresql'
    ? claveMayor(version)
    : claveMayorMenor(version);
}

const masNueva = (a: string, b: string): boolean => compararVersionesDesc(a, b) < 0;

/**
 * Compara lo instalado con el catálogo en vivo: parche nuevo de cada rama instalada y rama
 * estable más nueva que la mayor instalada. Solo avisa en el centro de avisos (`version-nueva`)
 * con la acción "Actualizar", que abre el diálogo de la interfaz: **nunca instala ni actualiza**.
 */
export class Novedades {
  constructor(private readonly d: DepsNovedades) {}

  private get ahora(): Date {
    return this.d.ahora?.() ?? new Date();
  }

  /** Novedades de todos los servicios instalados y no silenciados. Nunca lanza. */
  async revisar(): Promise<Novedad[]> {
    const cfg = await this.d.config();
    if (!cfg.activo) return [];
    const res: Novedad[] = [];
    for (const servicio of SERVICIOS_NOVEDADES) {
      if (cfg.silenciados.includes(servicio)) continue;
      try {
        res.push(...(await this.revisarServicio(servicio)));
      } catch (e) {
        console.warn(
          `No se pudo revisar si hay versiones nuevas de ${servicio}:`,
          e instanceof Error ? e.message.slice(0, 200) : e,
        );
      }
    }
    return res;
  }

  private async revisarServicio(servicio: ServicioInstalable): Promise<Novedad[]> {
    const instaladas = (await this.d.instalados(servicio))
      .map((i) => i.version)
      .filter((v) => claveValida(v));
    if (instaladas.length === 0) return [];
    const listado = await this.d.catalogo.listar(servicio, { todas: true });
    // La lista fija no es "lo publicado hoy": sin red no se avisa de nada.
    if (listado.origen === 'fija') return [];
    const estables = listado.versiones.filter(
      (v) => v.soporte !== 'preview' && !v.version.includes('-'),
    );
    const ramaDe = (version: string): string =>
      estables.find((v) => v.version === version)?.rama ?? ramaPorRegla(servicio, version);
    const fuerte = (v: VersionDisponible): boolean =>
      huellaFuerte(v.huella) || v.huellaDiferida === true;
    const res: Novedad[] = [];
    const ramasInstaladas = new Set<string>();
    for (const actual of [...instaladas].sort(compararVersionesDesc)) {
      const rama = ramaDe(actual);
      if (ramasInstaladas.has(rama)) continue;
      ramasInstaladas.add(rama);
      const ultima = estables
        .filter((v) => v.rama === rama)
        .sort((a, b) => compararVersionesDesc(a.version, b.version))[0];
      if (!ultima || !masNueva(ultima.version, actual)) continue;
      const clave = CLAVE_INSTANCIA[servicio];
      res.push({
        servicio,
        instancia: clave ? `${servicio}@${clave(actual)}` : null,
        actual,
        nueva: ultima.version,
        tipo: 'parche',
        huellaFuerte: fuerte(ultima),
      });
    }
    const mayor = [...instaladas].sort(compararVersionesDesc)[0]!;
    const tope = estables
      .filter((v) => v.soporte !== 'fin')
      .sort((a, b) => compararVersionesDesc(a.version, b.version))[0];
    if (tope && !ramasInstaladas.has(tope.rama ?? '') && masNueva(tope.version, mayor)) {
      res.push({
        servicio,
        instancia: null,
        actual: mayor,
        nueva: tope.version,
        tipo: 'rama',
        huellaFuerte: fuerte(tope),
      });
    }
    return res;
  }

  /**
   * Publica como mucho un aviso por servicio y día (cuenta el historial del centro, que se
   * guarda en disco) y nunca repite una versión ya avisada. Respeta el tipo desactivado y los
   * servicios silenciados. Devuelve los avisos publicados.
   */
  async publicar(novedades: readonly Novedad[]): Promise<Aviso[]> {
    const cfg = await this.d.config();
    if (!cfg.activo) return [];
    const ahora = this.ahora.getTime();
    const historial = this.d.centro.lista().filter((a) => a.tipo === 'version-nueva');
    const publicados: Aviso[] = [];
    const hechos = new Set<string>();
    for (const n of novedades) {
      if (hechos.has(n.servicio) || cfg.silenciados.includes(n.servicio)) continue;
      const delServicio = historial.filter((a) => a.datos['servicio'] === n.servicio);
      const reciente = delServicio.some(
        (a) => ahora - Date.parse(a.fecha) < PLAZO_AVISO_NOVEDAD_MS,
      );
      if (reciente) {
        hechos.add(n.servicio);
        continue;
      }
      if (delServicio.some((a) => a.datos['nueva'] === n.nueva)) continue;
      const aviso = this.d.centro.publicar({
        tipo: 'version-nueva',
        nivel: 'info',
        codigo: n.tipo === 'rama' ? 'avisos.rama_nueva' : 'avisos.version_nueva',
        // `fuente` separa los servicios en la agrupación del centro (mismo tipo y fuente).
        datos: { fuente: n.servicio, servicio: n.servicio, actual: n.actual, nueva: n.nueva },
        accion: {
          ruta: 'servicios.versiones',
          args: [{ servicio: n.servicio, version: n.nueva, instancia: n.instancia }],
        },
      });
      hechos.add(n.servicio);
      if (aviso) publicados.push(aviso);
    }
    return publicados;
  }

  /** Revisa y publica; sin red o con un fallo, no publica nada y no lanza. */
  async revisarYPublicar(): Promise<Aviso[]> {
    try {
      return await this.publicar(await this.revisar());
    } catch (e) {
      console.warn('No se pudo revisar si hay versiones nuevas:', e);
      return [];
    }
  }
}
