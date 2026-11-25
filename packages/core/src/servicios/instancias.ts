import { ErrorWolf } from '../errores';
import { claveMayorMenor } from '../rutas';
import {
  claveInstanciaValida,
  IDS_SERVICIO_DATOS,
  type Config,
  type EstadoInstancia,
  type IdInstancia,
  type IdServicioDatos,
} from '../tipos';
import type { DefServicio } from './definicion';

export type { EstadoInstancia, IdInstancia } from '../tipos';

/** `<servicio>@<clave>` (la clave sigue `CLAVE_INSTANCIA`). */
export const ID_INSTANCIA =
  /^(mysql|mariadb|postgresql|redis|mongodb|mailpit|ollama)@([0-9a-z][0-9a-z.]{0,15})$/;

/** ¿Es un id de instancia bien formado? (no dice si existe). */
export function esIdInstancia(id: unknown): id is IdInstancia {
  if (typeof id !== 'string') return false;
  const m = ID_INSTANCIA.exec(id);
  return m !== null && claveInstanciaValida(m[2]);
}

/** Servicio y clave de un id de instancia; un id mal formado es `instancias.id_invalido`. */
export function parsearInstancia(id: string): { servicio: IdServicioDatos; clave: string } {
  if (!esIdInstancia(id)) {
    throw new ErrorWolf('instancias.id_invalido', 'El identificador de la instancia no es válido.');
  }
  const i = id.indexOf('@');
  return { servicio: id.slice(0, i) as IdServicioDatos, clave: id.slice(i + 1) };
}

export function idInstancia(servicio: IdServicioDatos, clave: string): IdInstancia {
  return `${servicio}@${clave}`;
}

/** Clave de la carpeta de datos de `version` según la definición ("8.4", "17", "actual"). */
export function claveDe(def: DefServicio, version: string): string {
  return def.claveDatos ? def.claveDatos.call(def, version) : claveMayorMenor(version);
}

/** ¿El servicio admite varias instancias? (Mailpit y Ollama no). */
export function multiInstancia(def: DefServicio): boolean {
  return def.multiInstancia !== false;
}

/** ¿El servicio ya tiene instancias en la configuración? (si no, es la única implícita). */
export function conInstancias(cfg: Config, servicio: IdServicioDatos): boolean {
  const i = cfg.servicios.datos[servicio].instancias;
  return i !== undefined && Object.keys(i).length > 0;
}

/** Servicios cuyo puerto es el SMTP común de los captadores (`Config.correo.puertoSmtp`). */
const CAPTADORES: readonly string[] = ['mailpit', 'smtp4dev', 'inbucket', 'papercut'];

/** Puerto de la instancia implícita: el común si es un captador; si no, el propio. */
export function puertoImplicito(cfg: Config, servicio: IdServicioDatos): number {
  return CAPTADORES.includes(servicio)
    ? cfg.correo.puertoSmtp
    : cfg.servicios.datos[servicio].puerto;
}

/**
 * Puertos que la configuración asigna a los servicios de datos: los de todas sus instancias o,
 * sin instancias, el de la única implícita.
 */
export function puertosConfigurados(
  cfg: Config,
): { servicio: IdServicioDatos; clave: string | null; puerto: number }[] {
  const res: { servicio: IdServicioDatos; clave: string | null; puerto: number }[] = [];
  for (const servicio of IDS_SERVICIO_DATOS) {
    const c = cfg.servicios.datos[servicio];
    if (conInstancias(cfg, servicio)) {
      for (const [clave, i] of Object.entries(c.instancias!)) {
        res.push({ servicio, clave, puerto: i.puerto });
      }
    } else {
      res.push({ servicio, clave: null, puerto: puertoImplicito(cfg, servicio) });
    }
  }
  return res;
}

/**
 * Deja reflejada la predeterminada en `version`/`puerto`/`autoIniciar` del servicio (lo que
 * siguen leyendo Adminer, la interfaz y las versiones anteriores de la app).
 */
export function reflejarPredeterminada(cfg: Config, servicio: IdServicioDatos): void {
  const c = cfg.servicios.datos[servicio];
  const clave = c.predeterminada;
  const p = clave ? c.instancias?.[clave] : undefined;
  if (!p) return;
  c.version = p.version;
  c.puerto = p.puerto;
  c.autoIniciar = p.autoIniciar;
}

/**
 * Instancias de los servicios de datos (`<servicio>@<clave>`): cada rama con su carpeta
 * `data/<servicio>/<clave>`, su puerto y sus credenciales. Envuelve a `ServiciosDatos`, que es
 * quien hace el trabajo (y serializa por servicio).
 */
export interface Instancias {
  lista(servicio?: IdServicioDatos): Promise<EstadoInstancia[]>;
  crear(servicio: IdServicioDatos, version: string): Promise<IdInstancia>;
  iniciar(id: IdInstancia): Promise<void>;
  detener(id: IdInstancia): Promise<void>;
  cambiarPuerto(id: IdInstancia, puerto: number): Promise<void>;
  predeterminar(id: IdInstancia): Promise<void>;
  autoIniciar(id: IdInstancia, valor: boolean): Promise<void>;
  /** La saca de la configuración; sus datos quedan en disco. */
  quitar(id: IdInstancia): Promise<void>;
  /** Borra solo `data/<servicio>/<clave>`; exige `confirmacion === id`. */
  borrarDatos(id: IdInstancia, confirmacion: string): Promise<void>;
  /**
   * Resuelve el bloqueo tras una devolución fallida (`confirmacion === id`): con `respaldo` (su
   * sello) devuelve esa copia; sin él acepta la carpeta actual si está inicializada.
   */
  desbloquear(
    id: IdInstancia,
    o: { confirmacion: string; respaldo?: string; version?: string },
  ): Promise<void>;
}
