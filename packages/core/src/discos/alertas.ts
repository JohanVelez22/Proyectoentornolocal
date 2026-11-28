import { GRAVEDAD_VEREDICTO } from './veredicto';
import type { DiscoSalud, Veredicto } from './tipos';

/** Mínimo entre dos avisos del mismo disco, salvo que empeore a un nivel más grave que el último avisado. */
export const INTERVALO_MIN_AVISO_MS = 6 * 60 * 60 * 1000;

/**
 * Los errores corregidos «suben» respecto de la lectura guardada hace como mucho esta ventana: la
 * referencia se renueva una vez al día, así un aumento no se «consume» con la primera lectura.
 */
export const VENTANA_REFERENCIA_CORREGIDOS_MS = 24 * 60 * 60 * 1000;

/** Lo que se recuerda de cada disco entre revisiones (clave sin número de serie). */
export interface EstadoDiscoGuardado {
  /** Último veredicto conocido (nunca `no_disponible`: una lectura sin datos no lo cambia). */
  veredicto: Exclude<Veredicto, 'no_disponible'>;
  /** Último contador de errores de lectura corregidos visto; null si nunca se leyó. */
  corregidos: number | null;
  /** Cuándo se guardó esa referencia (ms desde 1970). */
  corregidosEn: number | null;
  /** Gravedad del último aviso publicado (0 = ninguno) y cuándo (ms desde 1970). */
  avisoNivel: number;
  avisoEn: number | null;
}

export interface EstadoSaludGuardado {
  version: 1;
  discos: Record<string, EstadoDiscoGuardado>;
}

export const estadoSaludVacio = (): EstadoSaludGuardado => ({ version: 1, discos: {} });

export interface AvisoDiscoPorPublicar {
  clave: string;
  numero: number;
  modelo: string | null;
  veredicto: 'atencion' | 'critico';
}

export interface DecisionAlertas {
  avisos: AvisoDiscoPorPublicar[];
  estado: EstadoSaludGuardado;
}

/**
 * Decide qué avisar tras una lectura. Solo avisa cuando un disco PASA a un estado peor que el
 * guardado (un disco nuevo cuenta como «Bien» antes de verse), y no más de una vez cada
 * `INTERVALO_MIN_AVISO_MS` por disco, salvo que el nuevo nivel sea más grave que el último
 * avisado. Una lectura sin datos (`no_disponible`) no cambia nada. Función pura: no escribe.
 */
export function decidirAlertas(
  actuales: readonly DiscoSalud[],
  previo: EstadoSaludGuardado,
  ahora: number,
  intervaloMs: number = INTERVALO_MIN_AVISO_MS,
): DecisionAlertas {
  const discos: Record<string, EstadoDiscoGuardado> = {};
  const avisos: AvisoDiscoPorPublicar[] = [];
  for (const d of actuales) {
    const antes = previo.discos[d.clave];
    // Referencia de errores corregidos: se renueva si no había, si bajó o si pasó la ventana.
    const actual = d.contadores?.erroresLecturaCorregidos ?? null;
    let corregidos = antes?.corregidos ?? null;
    let corregidosEn = antes?.corregidosEn ?? null;
    if (
      actual !== null &&
      (corregidos === null ||
        actual < corregidos ||
        corregidosEn === null ||
        ahora - corregidosEn >= VENTANA_REFERENCIA_CORREGIDOS_MS)
    ) {
      corregidos = actual;
      corregidosEn = ahora;
    }
    if (d.veredicto === 'no_disponible') {
      if (antes) discos[d.clave] = { ...antes, corregidos, corregidosEn };
      continue;
    }
    const nivel = GRAVEDAD_VEREDICTO[d.veredicto];
    const nivelAntes = antes ? GRAVEDAD_VEREDICTO[antes.veredicto] : 0;
    let avisoNivel = antes?.avisoNivel ?? 0;
    let avisoEn = antes?.avisoEn ?? null;
    // Recuperarse no borra el último aviso: un vaivén bien/atención no avisa antes del intervalo.
    if (nivel > nivelAntes) {
      const dentroDelIntervalo = avisoEn !== null && ahora - avisoEn < intervaloMs;
      if (!dentroDelIntervalo || nivel > avisoNivel) {
        avisos.push({
          clave: d.clave,
          numero: d.numero,
          modelo: d.modelo,
          veredicto: d.veredicto as 'atencion' | 'critico',
        });
        avisoNivel = nivel;
        avisoEn = ahora;
      }
    }
    discos[d.clave] = { veredicto: d.veredicto, corregidos, corregidosEn, avisoNivel, avisoEn };
  }
  // Los discos que no se vieron esta vez (desconectados) se conservan: si vuelven, sigue su historia.
  for (const [k, v] of Object.entries(previo.discos)) if (!(k in discos)) discos[k] = v;
  return { avisos, estado: { version: 1, discos } };
}

const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Lee el estado guardado; algo editado a mano o dañado vuelve al estado vacío, sin lanzar. */
export function leerEstadoGuardado(crudo: unknown): EstadoSaludGuardado {
  const res = estadoSaludVacio();
  if (typeof crudo !== 'object' || crudo === null) return res;
  const discos = (crudo as { discos?: unknown }).discos;
  if (typeof discos !== 'object' || discos === null || Array.isArray(discos)) return res;
  for (const [k, v] of Object.entries(discos)) {
    if (k.length > 200 || typeof v !== 'object' || v === null) continue;
    const o = v as Record<string, unknown>;
    if (
      o['veredicto'] !== 'bien' &&
      o['veredicto'] !== 'atencion' &&
      o['veredicto'] !== 'critico'
    ) {
      continue;
    }
    res.discos[k] = {
      veredicto: o['veredicto'],
      corregidos: esNumero(o['corregidos']) && o['corregidos'] >= 0 ? o['corregidos'] : null,
      corregidosEn: esNumero(o['corregidosEn']) ? o['corregidosEn'] : null,
      avisoNivel: o['avisoNivel'] === 1 || o['avisoNivel'] === 2 ? o['avisoNivel'] : 0,
      avisoEn: esNumero(o['avisoEn']) ? o['avisoEn'] : null,
    };
  }
  return res;
}
