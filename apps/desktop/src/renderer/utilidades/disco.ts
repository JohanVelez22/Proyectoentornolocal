import type { UnidadDisco } from '../../shared/api';

/** Por debajo de esta fracción libre la unidad se marca en ámbar. */
export const UMBRAL_DISCO_AVISO = 0.15;
/** Por debajo de esta fracción libre la unidad se marca en rojo. */
export const UMBRAL_DISCO_CRITICO = 0.05;

export type NivelDisco = 'ok' | 'aviso' | 'critico';

/** Nivel según el espacio libre: ámbar bajo el 15 % y rojo bajo el 5 % (sin total conocido: ok). */
export function nivelDisco(libre: number, total: number): NivelDisco {
  if (!Number.isFinite(libre) || !Number.isFinite(total) || total <= 0) return 'ok';
  const fraccion = Math.max(0, libre) / total;
  if (fraccion < UMBRAL_DISCO_CRITICO) return 'critico';
  if (fraccion < UMBRAL_DISCO_AVISO) return 'aviso';
  return 'ok';
}

export interface EntradaDisco {
  /** `sistema` (C:), `datos` (unidad de la carpeta de datos) o `ambos` si son la misma. */
  rol: 'sistema' | 'datos' | 'ambos';
  /** Letra de unidad con dos puntos ("C:"). */
  unidad: string;
  libre: number;
  total: number;
  /** Fracción libre (0–1). */
  fraccionLibre: number;
  nivel: NivelDisco;
}

type ConTamano = UnidadDisco & { libre: number; total: number };

const letraDe = (ruta: string | null | undefined): string | null => {
  const m = ruta ? /^([A-Za-z]):/.exec(ruta.trim()) : null;
  return m ? `${m[1]!.toUpperCase()}:` : null;
};

const conTamano = (u: UnidadDisco | undefined): u is ConTamano =>
  !!u && u.libre !== null && u.total !== null && u.total > 0;

function crear(
  rol: EntradaDisco['rol'],
  unidad: string,
  libre: number,
  total: number,
): EntradaDisco {
  return {
    rol,
    unidad,
    libre,
    total,
    fraccionLibre: total > 0 ? Math.min(1, Math.max(0, libre / total)) : 1,
    nivel: nivelDisco(libre, total),
  };
}

/**
 * Lo que enseña la insignia de disco: el espacio libre de C: y el de la unidad de la carpeta de
 * datos de WolfCore Dev; si es la misma, una sola entrada. `discoDatos` (la última muestra de
 * rendimiento) solo se usa cuando la unidad de datos no está en la lista de unidades.
 */
export function entradasDisco(d: {
  unidades: readonly UnidadDisco[];
  carpetaDatos: string | null;
  discoDatos: { usado: number; libre: number } | null;
}): EntradaDisco[] {
  const porLetra = (l: string): UnidadDisco | undefined =>
    d.unidades.find((u) => letraDe(u.ruta) === l);
  const sistema = porLetra('C:');
  const letraDatos = letraDe(d.carpetaDatos);
  const datos = letraDatos ? porLetra(letraDatos) : undefined;
  const muestra =
    d.discoDatos && d.discoDatos.usado + d.discoDatos.libre > 0
      ? { libre: d.discoDatos.libre, total: d.discoDatos.usado + d.discoDatos.libre }
      : null;

  if (letraDatos === 'C:') {
    if (conTamano(sistema)) return [crear('ambos', 'C:', sistema.libre, sistema.total)];
    return muestra ? [crear('ambos', 'C:', muestra.libre, muestra.total)] : [];
  }
  const salida: EntradaDisco[] = [];
  if (conTamano(sistema)) salida.push(crear('sistema', 'C:', sistema.libre, sistema.total));
  if (letraDatos) {
    if (conTamano(datos)) salida.push(crear('datos', letraDatos, datos.libre, datos.total));
    else if (muestra) salida.push(crear('datos', letraDatos, muestra.libre, muestra.total));
  }
  return salida;
}

/** El nivel más grave de una lista de entradas (para la insignia global). */
export function peorNivel(entradas: readonly EntradaDisco[]): NivelDisco {
  if (entradas.some((e) => e.nivel === 'critico')) return 'critico';
  if (entradas.some((e) => e.nivel === 'aviso')) return 'aviso';
  return 'ok';
}
