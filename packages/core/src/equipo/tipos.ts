/**
 * Lo que WolfCore Dev sabe del equipo (D55). Todo campo que no se pudo leer queda en `null` (la
 * interfaz lo muestra como «desconocido»): ninguna lectura bloquea ni falla. NUNCA hay números de
 * serie, UUID, identificadores de hardware ni nombre del equipo o del usuario: solo modelos y
 * tamaños, para que el resumen se pueda pegar en un ticket de soporte.
 */

export type TipoDisco = 'ssd' | 'hdd';

export interface GpuEquipo {
  nombre: string;
  /** Memoria de vídeo dedicada; null si no se pudo saber con fiabilidad. */
  vramBytes: number | null;
  /** De dónde salió la VRAM: `nvidia-smi`, el registro del adaptador o WMI (solo si < 4 GB). */
  origenVram: 'nvidia-smi' | 'registro' | 'wmi' | null;
  /** GPU integrada (comparte la RAM): su «VRAM» no cuenta como memoria de vídeo. */
  integrada?: boolean;
}

export interface DiscoEquipo {
  /** Unidad, p. ej. `C:`. */
  unidad: string;
  totalBytes: number | null;
  libreBytes: number | null;
  /** Solo si el sistema lo declara sin ambigüedad (SSD o HDD); si no, null. */
  tipo: TipoDisco | null;
}

export interface InfoEquipo {
  so: { nombre: string | null; version: string | null; compilacion: string | null };
  cpu: { modelo: string | null; nucleos: number | null; hilos: number | null };
  ram: { totalBytes: number | null; libreBytes: number | null };
  gpus: GpuEquipo[];
  discos: DiscoEquipo[];
  placa: { fabricante: string | null; modelo: string | null };
}

/** Un equipo sin ningún dato: lo que se devuelve cuando la lectura falla o no existe. */
export function equipoDesconocido(): InfoEquipo {
  return {
    so: { nombre: null, version: null, compilacion: null },
    cpu: { modelo: null, nucleos: null, hilos: null },
    ram: { totalBytes: null, libreBytes: null },
    gpus: [],
    discos: [],
    placa: { fabricante: null, modelo: null },
  };
}
