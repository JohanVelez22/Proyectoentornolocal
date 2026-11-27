import type { UnidadDisco } from '../../shared/api';

const GB = 1024 ** 3;
/** Ámbar: queda menos del 15 % libre Y menos de 30 GB (un disco enorme con 14 % libre no apura). */
export const UMBRAL_DISCO_AVISO = 0.15;
export const UMBRAL_DISCO_AVISO_BYTES = 30 * GB;
/** Rojo: queda menos del 5 % libre O menos de 5 GB. */
export const UMBRAL_DISCO_CRITICO = 0.05;
export const UMBRAL_DISCO_CRITICO_BYTES = 5 * GB;

export type NivelDisco = 'ok' | 'aviso' | 'critico';

/**
 * Nivel según el espacio libre (en bytes): rojo con menos del 5 % o menos de 5 GB; ámbar con menos
 * del 15 % y menos de 30 GB. Sin total conocido: ok.
 */
export function nivelDisco(libre: number, total: number): NivelDisco {
  if (!Number.isFinite(libre) || !Number.isFinite(total) || total <= 0) return 'ok';
  const bytes = Math.max(0, libre);
  const fraccion = bytes / total;
  if (fraccion < UMBRAL_DISCO_CRITICO || bytes < UMBRAL_DISCO_CRITICO_BYTES) return 'critico';
  if (fraccion < UMBRAL_DISCO_AVISO && bytes < UMBRAL_DISCO_AVISO_BYTES) return 'aviso';
  return 'ok';
}

/**
 * Porcentaje entero de una fracción, hacia abajo: así el número y el color coinciden en el límite
 * (14,9 % se ve «14 %» y en ámbar, no «15 %» en verde). El margen evita que 0,29 · 100 dé 28.
 */
export function porcentajeDe(fraccion: number): number {
  return Math.floor(fraccion * 100 + 1e-9);
}

export interface EntradaDisco {
  /** `sistema` (C:), `datos` (unidad de la carpeta de datos) o `ambos` si son la misma. */
  rol: 'sistema' | 'datos' | 'ambos';
  /** Letra de unidad con dos puntos ("C:"); vacía si solo se conoce la muestra de rendimiento. */
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
  } else if (muestra) {
    // Sin letra de unidad (no se pudo leer la carpeta de datos o no es de Windows) pero con la
    // muestra de rendimiento: se enseña igual, salvo que sea la misma unidad que el sistema.
    const igualQueSistema =
      conTamano(sistema) &&
      Math.abs(sistema.total - muestra.total) <= muestra.total * 0.01 &&
      Math.abs(sistema.libre - muestra.libre) <= muestra.total * 0.01;
    if (!igualQueSistema) salida.push(crear('datos', '', muestra.libre, muestra.total));
  }
  return salida;
}

/** El nivel más grave de una lista de entradas (para la insignia global). */
export function peorNivel(entradas: readonly EntradaDisco[]): NivelDisco {
  if (entradas.some((e) => e.nivel === 'critico')) return 'critico';
  if (entradas.some((e) => e.nivel === 'aviso')) return 'aviso';
  return 'ok';
}
