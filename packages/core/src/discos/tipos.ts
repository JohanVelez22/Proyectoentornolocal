/**
 * Salud de los discos (D57). Solo lectura y sin instalar nada: `Get-PhysicalDisk`, los contadores
 * de fiabilidad de Windows y, si responde sin administrador, la predicción de fallo del disco.
 * NUNCA hay números de serie ni identificadores únicos: solo modelo, tipo, tamaño y estado.
 *
 * Lo que no se pudo leer es `null` («No disponible» con su motivo en la interfaz): jamás se
 * inventa un valor ni se pone 0 por no saberlo.
 */

/** Cómo informa Windows la salud de un disco físico (`HealthStatus`). */
export type SaludReportada = 'healthy' | 'warning' | 'unhealthy';

export type MedioDisco = 'ssd' | 'hdd';

export type BusDisco = 'nvme' | 'sata' | 'ata' | 'sas' | 'scsi' | 'usb' | 'raid' | 'otro';

/** Veredicto de tres niveles (más «No disponible» si no hay datos suficientes). */
export type Veredicto = 'bien' | 'atencion' | 'critico' | 'no_disponible';

/** Por qué un veredicto no es «Bien» (la interfaz lo traduce y rellena con los números). */
export type MotivoVeredicto =
  | 'estado_warning'
  | 'estado_unhealthy'
  | 'estado_operacional'
  | 'errores_sin_corregir'
  | 'prediccion_fallo'
  | 'desgaste'
  | 'temperatura'
  | 'errores_corregidos_suben';

/** Por qué faltan los contadores de un disco. */
export type MotivoSinContadores =
  /** Windows los reserva a un proceso con permisos de administrador. */
  | 'admin'
  /** USB, RAID o similar: el controlador no los expone. */
  | 'bus'
  /** El controlador o el disco no los admite (p. ej. NVMe sin ese contador). */
  | 'no_soportado'
  /** Se leyó la consulta pero vino sin valores o falló por otra causa. */
  | 'no_leidos';

export interface ContadoresDisco {
  temperaturaC: number | null;
  /** Temperatura máxima que declara el fabricante (null si no la da). */
  temperaturaMaxC: number | null;
  /** Desgaste en %, de 0 a 255 (SSD; en NVMe puede pasar de 100); null en un HDD o si no se informa. */
  desgastePct: number | null;
  erroresLecturaCorregidos: number | null;
  erroresLecturaNoCorregidos: number | null;
  erroresEscrituraCorregidos: number | null;
  erroresEscrituraNoCorregidos: number | null;
  horasEncendido: number | null;
}

/** Un disco tal como lo leyó el sistema, sin veredicto. */
export interface DiscoLeido {
  /** Número de disco de Windows (el de «Administración de discos»): no es un identificador único. */
  numero: number;
  modelo: string | null;
  medio: MedioDisco | null;
  bus: BusDisco | null;
  tamanoBytes: number | null;
  salud: SaludReportada | null;
  /** `OperationalStatus` en inglés tal como lo da Windows (`OK`, `Predictive Failure`…). */
  operacional: string[];
  contadores: ContadoresDisco | null;
  motivoSinContadores: MotivoSinContadores | null;
  /** Predicción de fallo del disco (SMART por WMI); null si no se pudo leer. */
  prediccionFallo: boolean | null;
  /** Letras de unidad de sus particiones (`C:`). */
  unidades: string[];
}

export type EstadoPrediccion = 'ok' | 'sin_acceso' | 'no_disponible';

export interface LecturaDiscos {
  discos: DiscoLeido[];
  /** Si la predicción de fallo (WMI) respondió sin administrador. */
  prediccion: EstadoPrediccion;
}

/** Dato conservado de una lectura anterior con contadores (la actual no los trajo). */
export interface DatoConservado {
  /** ISO. */
  en: string;
  origen: 'admin' | 'sondeo';
}

export interface DiscoSalud extends DiscoLeido {
  /** Clave estable de este disco entre lecturas (modelo, tamaño y número); no es un número de serie. */
  clave: string;
  veredicto: Veredicto;
  motivos: MotivoVeredicto[];
  /**
   * Si el veredicto sigue siendo el de una lectura anterior con contadores (la de ahora no los
   * trajo): de cuándo es y de dónde vino. La interfaz lo muestra como «Último dato con permisos
   * de administrador: <fecha>».
   */
  datoConservado?: DatoConservado | null;
  /** En este disco están los datos de WolfCore Dev. */
  contieneDatos: boolean;
  /** En este disco están las carpetas de los proyectos. */
  contieneProyectos: boolean;
}

export interface ResultadoSalud {
  discos: DiscoSalud[];
  prediccion: EstadoPrediccion;
  /** La lectura se hizo con permisos de administrador (a petición de la persona). */
  conAdmin: boolean;
  /** ISO. */
  leidoEn: string;
}

export type GravedadEvento = 'info' | 'aviso' | 'critico';

/** Evento del registro System que apunta al disco, ya interpretado. */
export interface EventoDisco {
  /** ISO (UTC). */
  fecha: string;
  id: number;
  proveedor: string;
  /** Clave de la explicación traducida (`disco_<id>`). */
  codigo: string;
  gravedad: GravedadEvento;
  /** `Disco 1`/`C:` según lo que diga el evento; null si no lo dice. */
  disco: { tipo: 'disco' | 'unidad'; valor: string } | null;
  /** Texto del sistema, saneado (sin rutas de usuario) y acotado; solo para copiar o exportar. */
  detalle: string;
}

export type MotivoLecturaAdmin = 'cancelado' | 'tiempo' | 'error' | 'denegado';

export type ResultadoLecturaAdmin =
  | { ok: true; lectura: LecturaDiscos }
  | { ok: false; motivo: MotivoLecturaAdmin; detalle?: string };
