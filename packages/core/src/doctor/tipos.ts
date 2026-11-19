import type { EntradaAviso } from '../avisos/avisos';
import type { CodigoError } from '../errores';
import type { GestorHosts } from '../hosts/hosts';
import type { PlataformaCompleta } from '../plataforma/tipos';
import type { EstadoServicio } from '../tipos';

export const IDS_REVISION = [
  'puertos',
  'rangos-reservados',
  'ca',
  'certificados',
  'hosts',
  'path',
  'vcredist',
  'antivirus',
  'servicios',
] as const;
export type IdRevision = (typeof IDS_REVISION)[number];

export type GravedadHallazgo = 'info' | 'aviso' | 'error';

/** Datos de un hallazgo: texto corto y números (se traducen con el código en la interfaz). */
export type DatosHallazgo = Record<string, string | number>;

export interface Reparacion {
  /** Qué se hará: `cambiar-puerto`, `detener-w3svc`, `hosts-reescribir`… */
  id: string;
  /** Clave de texto de la interfaz que describe la reparación (`doctor.reparaciones.<…>`). */
  codigo: string;
  requiereAdmin: boolean;
  /** No hay nada que WolfCore Dev haga por su cuenta: solo se muestra `comandoManual`. */
  soloInforma: boolean;
  /** Comando para que el usuario lo corra él mismo en una consola de administrador. */
  comandoManual?: string;
}

export interface Hallazgo {
  /** Estable entre revisiones: `<revisión>:<clave>`. */
  id: string;
  revision: IdRevision;
  gravedad: GravedadHallazgo;
  codigo: CodigoError;
  datos: DatosHallazgo;
  /** Lo que se vio (proceso, línea del archivo, final del log…), tal cual para mostrar. */
  evidencia: string;
  reparacion?: Reparacion;
  /** Otra reparación posible (p. ej. con IIS: mover el puerto propio en vez de detenerlo). */
  alternativa?: Reparacion;
}

export interface ResultadoReparacion {
  ok: boolean;
  /** Error, o `doctor.ya_resuelto` con `ok: true` si al reparar el problema ya no estaba. */
  codigo?: CodigoError;
  /** Salió bien, pero con algo que el usuario debe saber. */
  aviso?: CodigoError;
}

/** Hallazgo con su reparación ejecutable (solo dentro del Doctor; nunca sale por IPC). */
export interface HallazgoInterno extends Hallazgo {
  aplicar?: () => Promise<ResultadoReparacion>;
  aplicarAlternativa?: () => Promise<ResultadoReparacion>;
}

export interface VencimientoCertificado {
  /** `ca` para la autoridad; el id del sitio para los demás. */
  id: string;
  dias: number;
  /** Dominio principal del sitio (lo que se muestra). */
  nombre?: string;
}

export interface DepsDoctor {
  plataforma: PlataformaCompleta;
  /** Carpeta de datos de WolfCore Dev (entradas propias del PATH, exclusión del antivirus). */
  carpetaDatos: string;
  /** Copias con fecha de lo que se reescribe (hosts, PATH). */
  carpetaRespaldos: string;
  /** Estado de los servicios (versión null = no instalado). */
  servicios(): Promise<EstadoServicio[]>;
  puertoHttps(): Promise<number>;
  /** Puertos que WolfCore Dev ya asignó (servicios, sitios, FTP…): no sirven de alternativa. */
  puertosPropios(): Promise<number[]>;
  /** ¿Está libre ahora? (se puede escuchar en él). */
  probarPuerto(puerto: number): Promise<boolean>;
  /** ¿Se puede cambiar el puerto de este servicio desde WolfCore Dev? */
  puertoCambiable(servicio: string): boolean;
  cambiarPuerto(servicio: string, puerto: number): Promise<void>;
  /** Dominios que deben estar en el bloque de hosts. */
  dominios(): Promise<string[]>;
  hosts: Pick<GestorHosts, 'reparar'>;
  https: {
    vencimientos(): Promise<VencimientoCertificado[]>;
    regenerarCertificados(): Promise<ResultadoReparacion>;
    regenerarCA(): Promise<ResultadoReparacion>;
  };
  reintentarServicio(id: string): Promise<void>;
  avisos?: { publicar(a: EntradaAviso): unknown };
  /** Archivo con el PATH original (por defecto, `etc/path-usuario.respaldo.txt`). */
  respaldoPath?: string;
  /** Variables para expandir `%VAR%` en el PATH (por defecto, las del proceso). */
  entorno?: Record<string, string | undefined>;
  ahora?: () => Date;
}

/** Lo que recibe cada revisión. */
export type Revision = (d: DepsDoctor) => Promise<HallazgoInterno[]>;
