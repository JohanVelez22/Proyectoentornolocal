import type { BaseConServidor } from '../bd/baseProyecto';
import type { VersionDisponible } from '../catalogo/catalogo';
import type { HuellaFila } from '../catalogo/tablaVersiones';
import type { Rutas } from '../rutas';
import type { Config } from '../tipos';
import type { PrefijoRuta } from './reasignar';

/** Volcados de una base dentro de un perfil: MySQL/MariaDB en dos partes, PostgreSQL en una. */
export type VolcadosBase = { esquema: string; datos: string } | { volcado: string };

/** Topes al leer un perfil (las pruebas los bajan). */
export const LIMITES_PERFIL = {
  /** Tamaño del `.wolfperfil` en disco. */
  maxBytesPerfil: 64 * 1024 * 1024 * 1024,
  /** Entradas del ZIP (cualquiera, también las que se ignoran). */
  maxEntradas: 20_000,
  /** Suma de los tamaños descomprimidos de lo que se extrae. */
  maxBytes: 64 * 1024 * 1024 * 1024,
  /** Un archivo extraído. */
  maxBytesArchivo: 16 * 1024 * 1024 * 1024,
  maxBytesManifiesto: 8 * 1024 * 1024,
  /** `ca.cifrada`. */
  maxBytesCa: 16 * 1024 * 1024,
};
export type LimitesPerfil = typeof LIMITES_PERFIL;

export interface DepsPerfiles {
  rutas: Pick<
    Rutas,
    'base' | 'tmp' | 'plantillas' | 'config' | 'caCrt' | 'caKey' | 'certCrt' | 'certKey'
  >;
  leerConfig(): Promise<Config>;
  guardarConfig(c: Config): Promise<void>;
  plantillas: {
    /** Las válidas (las dañadas no viajan). */
    lista(): Promise<{ id: string }[]>;
    cargar(id: string): Promise<{ id: string; origen: 'propia' | 'importada' }>;
    /** Quita la plantilla del registro de propias: lo que llega de un perfil es importado. */
    marcarImportada(id: string): Promise<void>;
  };
  versionesInstaladas(): Promise<{ servicio: string; version: string; huella: string | null }[]>;
  buscarVersion(servicio: string, version: string): Promise<VersionDisponible | null>;
  versionInstalada(servicio: string, version: string): Promise<boolean>;
  /** Instala desde el catálogo con su huella (nunca se llama con huella débil o sin huella). */
  instalarVersion(v: VersionDisponible): Promise<void>;
  /** ¿Se puede escuchar en 127.0.0.1:puerto? */
  puertoLibre(puerto: number): Promise<boolean>;
  /** Bases (no del sistema) de las instancias SQL encendidas. */
  basesParaExportar(): Promise<{ instancia: string; base: string }[]>;
  volcarBase(instancia: string, base: string, carpeta: string): Promise<VolcadosBase>;
  /** Deja la instancia lista para restaurar (creada, con sus datos iniciales y encendida). */
  prepararInstancia(instancia: string): Promise<void>;
  basesDe(instancia: string): Promise<string[]>;
  /** Instantánea automática de una base existente antes de reemplazarla (D19). */
  instantaneaPrevia(instancia: string, base: string): Promise<void>;
  /**
   * Restaura por el camino acotado de origen ajeno (D14/D15/D19): usuario limitado a la base,
   * lista de SQL permitido y todo o nada. `existe`: la base ya estaba (ya tiene su instantánea).
   */
  restaurarBase(
    instancia: string,
    archivos: VolcadosBase,
    base: string,
    o: { existe: boolean },
  ): Promise<void>;
  /**
   * Crea el usuario `wolf_u_<base>` limitado a su base; `cambiarClave` solo cuando la clave es
   * nueva (una reutilizada de otro proyecto nunca se cambia).
   */
  crearUsuarioBd(
    instancia: string,
    base: string,
    usuario: string,
    clave: string,
    o: { cambiarClave: boolean },
  ): Promise<void>;
  /**
   * Clave guardada de otro proyecto del equipo (no de `excluir`) que ya usa ese usuario, o null.
   * Si alguno lo usa sin clave guardada, lanza (no se puede compartir sin conocerla).
   */
  claveCompartida(usuario: string, excluir: string[]): Promise<string | null>;
  /** Guarda la clave en `AlmacenSecretos` como `bd:<sitio>` (el núcleo nunca la guarda). */
  guardarClaveBd(sitioId: string, clave: string): Promise<void>;
  /**
   * Pone usuario, clave (y el puerto nuevo, si cambió) en el `.env` con copia previa, por el mismo
   * camino que "Usar usuario propio" (D16): `antes` corre con el `.env` listo para escribirse.
   */
  ponerUsuarioEnv(
    sitioId: string,
    usuario: string,
    clave: string,
    puerto: number | null,
    antes: () => Promise<void>,
  ): Promise<{ copia: string | null }>;
  /** CA nueva si falta y certificados de los sitios con HTTPS. */
  regenerarCertificados(): Promise<void>;
  baseDelProyecto?: (carpeta: string) => Promise<BaseConServidor | null>;
  generarClave?: () => string;
  /** Sistema operativo e id del catálogo del equipo que exporta (solo informa). */
  sistema: string;
  idCatalogo: string;
  reloj?: () => Date;
  limites?: Partial<LimitesPerfil>;
}

export interface OpcionesExportarPerfil {
  /** Ruta del archivo (de un diálogo); debe terminar en `.wolfperfil`. */
  destino: string;
  bases: boolean;
  certificados: boolean;
  /** La CA solo viaja cifrada con una frase que elige el usuario; null = no viaja. */
  ca: { frase: string } | null;
}

export interface ResultadoExportarPerfil {
  archivo: string;
  bytes: number;
  /** Lo que no se pudo incluir (una base apagada, la CA que no existe…). */
  avisos: string[];
}

export interface OpcionesImportarPerfil {
  /** Carpeta elegida por el usuario para cada sitio (id → ruta de un diálogo). */
  rutas: Record<string, string>;
  /** Cambios de prefijo elegidos por el usuario (`C:\Users\viejo\` → `D:\dev\`). */
  prefijos?: PrefijoRuta[];
  /** Frase de la CA, si el perfil la trae y el usuario la quiere importar. */
  frase?: string;
  /** Sitios cuyo `.env` se reescribe con el usuario propio nuevo (marcados por el usuario). */
  envProyectos?: string[];
  /**
   * Confirmación aparte para reemplazar la CA de este equipo por la del perfil (que firma lo que
   * quiera y no se instala sola).
   */
  reemplazarCa?: true;
  /** La huella de la vista previa que vio el usuario: si algo cambió desde entonces, no se importa. */
  huella: string;
  confirmado: true;
}

export interface VistaPreviaPerfil {
  creado: string;
  origen: { sistema: string; idCatalogo: string };
  incluye: { bases: boolean; certificados: boolean; ca: boolean };
  sitios: {
    id: string;
    nombre: string;
    carpeta: string;
    existe: boolean;
    /** `ruta_protegida`, `dominio_en_uso`, `sitio_invalido`…: el sitio no se importará. */
    omitido: string | null;
  }[];
  versiones: {
    servicio: string;
    version: string;
    disponible: boolean;
    instalada: boolean;
    huella: HuellaFila;
  }[];
  instancias: { id: string; puerto: number; puertoNuevo: number | null; existente: boolean }[];
  bases: { instancia: string; base: string }[];
  plantillas: { id: string; existe: boolean }[];
  /** Lo que ya hay en la carpeta de datos y se reemplazaría (se copia antes). */
  reemplaza: string[];
  puertosOcupados: number[];
  /** Entradas del archivo que no son de un perfil y se ignoran (p. ej. `instantaneas/`). */
  ignoradas: number;
  /** La carpeta de datos ya tiene una configuración o sitios. */
  carpetaConDatos: boolean;
  /**
   * Lo que no se toma de la configuración del perfil (carpeta limpia): `ia:<id>` (URL propia),
   * `smtp:<id>` (host que no es de un proveedor conocido o sin usuario), `puerto:<campo>`
   * (fuera de rango), `carpeta_vigilada`.
   */
  configQuitada: string[];
  /**
   * La CA que trae el perfil (cifrada): su huella SHA-256 para compararla con la propia. Solo se
   * importa si es la del usuario; `reemplazaLocal`: este equipo ya tiene una CA.
   */
  ca: { huella: string; reemplazaLocal: boolean } | null;
  /** Huella de esta vista previa: `importarPerfil` la exige igual. */
  huella: string;
}

export type EstadoItem = 'importado' | 'pendiente' | 'omitido' | 'error';

export interface ResultadoImportarPerfil {
  /** Carpeta con la copia de lo reemplazado (`respaldos/pre-perfil-<fecha>`), o null si nada. */
  respaldo: string | null;
  sitios: { id: string; estado: EstadoItem; carpeta: string; motivos: string[] }[];
  versiones: {
    servicio: string;
    version: string;
    estado: 'instalada' | 'ya_instalada' | 'pendiente' | 'error';
    motivo: string | null;
  }[];
  instancias: {
    id: string;
    estado: 'creada' | 'existente' | 'puerto_reasignado' | 'pendiente';
    puerto: number;
    puertoOriginal: number;
  }[];
  bases: { instancia: string; base: string; estado: EstadoItem; motivo: string | null }[];
  plantillas: { id: string; estado: EstadoItem; motivo: string | null }[];
  env: {
    sitioId: string;
    estado: 'reescrito' | 'sin_marcar' | 'error';
    motivo: string | null;
    copia: string | null;
  }[];
  ca: 'importada' | 'nueva' | 'sin_cambios';
  avisos: string[];
}
