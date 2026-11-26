import type { CapturaConfig, EstadoCaptura, FormatoCaptura, IdiomaUi } from '@pel/core';

/** Cómo se elige lo que se captura (D35). */
export const MODOS_CAPTURA = ['region', 'ventana', 'pantalla'] as const;
export type ModoCaptura = (typeof MODOS_CAPTURA)[number];

/** Una imagen ya codificada (PNG) con su tamaño en píxeles reales. */
export interface ImagenCaptura {
  png: Uint8Array;
  ancho: number;
  alto: number;
}

export interface VentanaCapturable extends ImagenCaptura {
  id: string;
  nombre: string;
}

/** Lo que recibe la ventana de captura al abrirse: todo en memoria, nunca un archivo temporal. */
export interface DatosCaptura {
  modo: ModoCaptura;
  formato: FormatoCaptura;
  idioma: IdiomaUi;
  /** La pantalla bajo el cursor (modos `region` y `pantalla`). */
  pantalla: ImagenCaptura | null;
  /** Las ventanas abiertas con su vista (modo `ventana`). */
  ventanas: VentanaCapturable[];
}

/** Resultado de pedir una captura: o se abrió la ventana o dice por qué no. */
export interface ResultadoIniciarCaptura {
  ok: boolean;
  codigo?: 'captura.no_disponible' | 'captura.permiso_denegado' | 'captura.ocupada';
}

export interface ResultadoAtajo {
  ok: boolean;
  codigo?: 'captura.atajo_ocupado';
}

/** Lo que ve Ajustes: configuración, estado del sistema y del atajo. */
export interface EstadoCapturaUi {
  config: CapturaConfig;
  sistema: EstadoCaptura;
  /** El atajo está registrado ahora mismo. */
  atajoActivo: boolean;
  /** Se pidió un atajo pero otro programa lo tenía: no se registró. */
  atajoOcupado: boolean;
}

export interface ImagenPendiente {
  bytes: Uint8Array;
  ancho: number;
  alto: number;
}

/** Puente de la ventana de captura (`preload/captura.ts`); es otro contexto que la ventana principal. */
export interface ApiVentanaCaptura {
  datos(): Promise<DatosCaptura | null>;
  copiar(bytes: Uint8Array): Promise<void>;
  /** Abre "Guardar como"; null si se canceló. Nunca pisa un archivo existente. */
  guardar(bytes: Uint8Array, formato: FormatoCaptura): Promise<{ archivo: string } | null>;
  alConversor(bytes: Uint8Array): Promise<void>;
  cerrar(): Promise<void>;
}

/** Canales IPC de la ventana de captura (distintos de `entorno:*`, solo para ella). */
export const CANALES_CAPTURA = {
  datos: 'captura:datos',
  copiar: 'captura:copiar',
  guardar: 'captura:guardar',
  alConversor: 'captura:al-conversor',
  cerrar: 'captura:cerrar',
} as const;
