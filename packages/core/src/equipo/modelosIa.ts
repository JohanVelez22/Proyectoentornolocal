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
 * - GPU: la mayor VRAM dedicada entre las tarjetas, si llega a 2 GiB (las integradas, marcadas
 *   `integrada`, comparten la RAM y no cuentan). VRAM desconocida = sin GPU.
 * - RAM: la total menos 4 GiB que se dejan al sistema y a las demás aplicaciones.
 *
 * Veredicto:
 * - `recomendado`: necesario ≤ 80 % de la VRAM; o, en la RAM (sin GPU o fuera de la VRAM), ≤ 80 %
 *   de la RAM útil Y ≤ 6 GiB (la CPU solo da un ritmo cómodo con modelos de ≈7-8B).
 * - `lento`: cabe, pero sin ese margen (justo), o no cabe en la VRAM y sí en la RAM (parte de
 *   las capas se calcula en la CPU), o cabe en la RAM pero es demasiado grande para la CPU.
 * - Tener GPU nunca empeora el veredicto frente a no tenerla: se toma el mejor de los dos.
 * - `no-cabe`: no entra en ninguna memoria, o no hay espacio en disco para descargarlo.
 * - `desconocido`: falta el tamaño del modelo o los datos del equipo.
 */
export const GIB = 1024 ** 3;
export const FACTOR_CONTEXTO = 1.1;
export const SOBRECARGA_BYTES = 0.5 * GIB;
export const MARGEN_HOLGADO = 0.8;
export const RESERVA_SISTEMA_BYTES = 4 * GIB;
export const VRAM_MINIMA_UTIL = 2 * GIB;
/**
 * Sin GPU útil el modelo corre en la CPU (≈1 token/s con un 70B): solo es «recomendado» si lo
 * necesario no pasa de esto (≈7-8B cuantizado); por encima, «puede ir lento» como máximo.
 */
export const TOPE_RECOMENDADO_CPU_BYTES = 6 * GIB;
/** Dejar libre al menos esto en el disco tras descargar el modelo. */
export const MARGEN_DISCO_BYTES = 1 * GIB;
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
    .filter((g) => g.integrada !== true)
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

  if (
    !instalado &&
    m.libreDiscoBytes != null &&
    m.tamanoBytes + MARGEN_DISCO_BYTES > m.libreDiscoBytes
  ) {
    return res('no-cabe', 'sin-disco', null, m.libreDiscoBytes);
  }
  if (vram === null && ram === null) return res('desconocido', 'equipo-desconocido', null, null);

  // Lo que daría la RAM sola (CPU): el techo de 6 GiB manda para «recomendado».
  const enRam = (): CompatibilidadModelo | null => {
    if (ram === null) return null;
    if (necesario <= Math.min(MARGEN_HOLGADO * ram, TOPE_RECOMENDADO_CPU_BYTES)) {
      return res('recomendado', 'cabe-ram', 'ram', ram);
    }
    return null;
  };

  if (vram !== null) {
    if (necesario <= MARGEN_HOLGADO * vram) return res('recomendado', 'cabe-vram', 'vram', vram);
    // La GPU nunca empeora: si en la RAM sola ya sería «recomendado», lo es también con ella.
    const r = enRam();
    if (r) return r;
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
  const r = enRam();
  if (r) return r;
  const total = ram!;
  if (necesario <= total) return res('lento', 'ram-justo', 'ram', total);
  return res('no-cabe', 'sin-memoria', 'ram', total);
}

/** Mayor tamaño «redondo» de modelo que saldría `recomendado` en este equipo. */
export function sugerirParaEquipo(equipo: InfoEquipo): SugerenciaEquipo {
  const { vram, ram } = memoriasDe(equipo);
  const miles = (util: number): number =>
    (util - SOBRECARGA_BYTES) / FACTOR_CONTEXTO / BYTES_POR_MIL_MILLONES;
  const maximo = (m: number): number | null => {
    const cabe = TAMANOS_SUGERIDOS_B.filter((b) => b <= m);
    return cabe.length ? cabe[cabe.length - 1]! : null;
  };
  if (vram === null && ram === null) {
    return { parametrosMaxB: null, memoria: null, capacidadBytes: null };
  }
  // En la RAM (CPU) el techo es el de «recomendado» sin GPU (≈7B).
  const bRam =
    ram === null ? null : maximo(miles(Math.min(MARGEN_HOLGADO * ram, TOPE_RECOMENDADO_CPU_BYTES)));
  const bVram = vram === null ? null : maximo(miles(MARGEN_HOLGADO * vram));
  // Coherente con `clasificarModelo`: con GPU se toma lo mejor de la VRAM y de la RAM.
  if (vram !== null && (bRam === null || (bVram ?? 0) >= (bRam ?? 0))) {
    return { parametrosMaxB: bVram, memoria: 'vram', capacidadBytes: vram };
  }
  return { parametrosMaxB: bRam, memoria: 'ram', capacidadBytes: ram };
}
