import type { InfoEquipo } from './tipos';

/**
 * «¿Qué modelo de IA cabe en su equipo?» (D55). Solo orienta: nunca bloquea una descarga.
 *
 * Fórmula (todo en bytes):
 *
 *   necesario = tamaño cuantizado × 1,10 + 0,5 GiB
 *
 * - `tamaño cuantizado`: lo que pesa el modelo en el registro de Ollama (ya viene a 4 bits
 *   en la mayoría). Los pesos se cargan enteros en memoria.
 * - `× 1,10`: caché del contexto (KV) con 4096 tokens; en un modelo de 7-8B ronda el 10 % de
 *   los pesos (p. ej. Llama 3 8B: 0,5 GiB de caché sobre 4,7 GB de pesos).
 * - `+ 0,5 GiB`: búferes de cálculo y del motor.
 *
 * Memoria disponible:
 * - GPU: la mayor VRAM dedicada entre las tarjetas, si llega a 2 GiB (las integradas comparten
 *   la RAM y no cuentan). VRAM desconocida = sin GPU.
 * - RAM: la total menos 4 GiB que se dejan al sistema y a las demás aplicaciones.
 *
 * Veredicto:
 * - `recomendado`: necesario ≤ 80 % de la VRAM (o, sin GPU, del 80 % de la RAM útil).
 * - `lento`: cabe, pero sin ese margen (justo), o no cabe en la VRAM y sí en la RAM (parte de
 *   las capas se calcula en la CPU).
 * - `no-cabe`: no entra en ninguna memoria, o no hay espacio en disco para descargarlo.
 * - `desconocido`: falta el tamaño del modelo o los datos del equipo.
 */
export const GIB = 1024 ** 3;
export const FACTOR_CONTEXTO = 1.1;
export const SOBRECARGA_BYTES = 0.5 * GIB;
export const MARGEN_HOLGADO = 0.8;
export const RESERVA_SISTEMA_BYTES = 4 * GIB;
export const VRAM_MINIMA_UTIL = 2 * GIB;
/** Peso aproximado de mil millones de parámetros a 4 bits (Q4_K_M), solo para la sugerencia. */
export const BYTES_POR_MIL_MILLONES = 0.65e9;
/** Tamaños «redondos» de modelo con los que se expresa la sugerencia. */
export const TAMANOS_SUGERIDOS_B = [1, 3, 7, 14, 32, 70] as const;

export type NivelCompat = 'recomendado' | 'lento' | 'no-cabe' | 'desconocido';
export type MotivoCompat =
  | 'cabe-vram'
  | 'justo-vram'
  | 'solo-ram'
  | 'cabe-ram'
  | 'ram-justo'
  | 'sin-memoria'
  | 'sin-disco'
  | 'tamano-desconocido'
  | 'equipo-desconocido';

export interface EntradaCompat {
  nombre: string;
  /** Peso cuantizado del modelo; null si no se pudo saber. */
  tamanoBytes: number | null;
  /** Espacio libre del disco de los modelos; null = no se sabe. */
  libreDiscoBytes?: number | null;
  /** Ya instalado: el disco no cuenta. */
  instalado?: boolean;
}

export interface CompatibilidadModelo {
  nombre: string;
  nivel: NivelCompat;
  motivo: MotivoCompat;
  /** Memoria contra la que se comparó. */
  memoria: 'vram' | 'ram' | null;
  necesarioBytes: number | null;
  /** VRAM o RAM útil con la que se comparó (null si no aplica). */
  disponibleBytes: number | null;
  instalado: boolean;
}

export interface SugerenciaEquipo {
  /** Mayor tamaño «redondo» (en miles de millones de parámetros) que va holgado; null si ninguno. */
  parametrosMaxB: number | null;
  memoria: 'vram' | 'ram' | null;
  /** Memoria útil sobre la que se calculó. */
  capacidadBytes: number | null;
}

export const memoriaNecesaria = (tamanoBytes: number): number =>
  Math.ceil(tamanoBytes * FACTOR_CONTEXTO + SOBRECARGA_BYTES);

interface Memorias {
  vram: number | null;
  ram: number | null;
}

function memoriasDe(e: InfoEquipo): Memorias {
  const vrams = e.gpus
    .map((g) => g.vramBytes)
    .filter((v): v is number => v !== null && v >= VRAM_MINIMA_UTIL);
  const total = e.ram.totalBytes;
  return {
    vram: vrams.length ? Math.max(...vrams) : null,
    ram: total === null ? null : Math.max(0, total - RESERVA_SISTEMA_BYTES),
  };
}

export function clasificarModelo(m: EntradaCompat, equipo: InfoEquipo): CompatibilidadModelo {
  const instalado = m.instalado === true;
  const base = { nombre: m.nombre, instalado };
  if (m.tamanoBytes === null || !(m.tamanoBytes > 0)) {
    return {
      ...base,
      nivel: 'desconocido',
      motivo: 'tamano-desconocido',
      memoria: null,
      necesarioBytes: null,
      disponibleBytes: null,
    };
  }
  const necesario = memoriaNecesaria(m.tamanoBytes);
  const { vram, ram } = memoriasDe(equipo);
  const res = (
    nivel: NivelCompat,
    motivo: MotivoCompat,
    memoria: 'vram' | 'ram' | null,
    disponible: number | null,
  ): CompatibilidadModelo => ({
    ...base,
    nivel,
    motivo,
    memoria,
    necesarioBytes: necesario,
    disponibleBytes: disponible,
  });

  if (!instalado && m.libreDiscoBytes != null && m.tamanoBytes > m.libreDiscoBytes) {
    return res('no-cabe', 'sin-disco', null, m.libreDiscoBytes);
  }
  if (vram === null && ram === null) return res('desconocido', 'equipo-desconocido', null, null);

  if (vram !== null) {
    if (necesario <= MARGEN_HOLGADO * vram) return res('recomendado', 'cabe-vram', 'vram', vram);
    if (necesario <= vram) return res('lento', 'justo-vram', 'vram', vram);
    if (ram !== null && necesario <= ram) return res('lento', 'solo-ram', 'ram', ram);
    return res(
      'no-cabe',
      'sin-memoria',
      ram !== null && ram > vram ? 'ram' : 'vram',
      Math.max(vram, ram ?? 0),
    );
  }
  // Sin GPU útil: solo RAM (aquí no es null, se descartó arriba).
  const r = ram!;
  if (necesario <= MARGEN_HOLGADO * r) return res('recomendado', 'cabe-ram', 'ram', r);
  if (necesario <= r) return res('lento', 'ram-justo', 'ram', r);
  return res('no-cabe', 'sin-memoria', 'ram', r);
}

/** Mayor tamaño «redondo» de modelo que saldría `recomendado` en este equipo. */
export function sugerirParaEquipo(equipo: InfoEquipo): SugerenciaEquipo {
  const { vram, ram } = memoriasDe(equipo);
  const memoria = vram !== null ? 'vram' : ram !== null ? 'ram' : null;
  const capacidad = vram ?? ram;
  if (memoria === null || capacidad === null) {
    return { parametrosMaxB: null, memoria: null, capacidadBytes: null };
  }
  const pesos = (MARGEN_HOLGADO * capacidad - SOBRECARGA_BYTES) / FACTOR_CONTEXTO;
  const miles = pesos / BYTES_POR_MIL_MILLONES;
  const cabe = TAMANOS_SUGERIDOS_B.filter((b) => b <= miles);
  return {
    parametrosMaxB: cabe.length ? cabe[cabe.length - 1]! : null,
    memoria,
    capacidadBytes: capacidad,
  };
}
