/** Comandos de la paleta (Ctrl+K) y su búsqueda difusa simple. */

export type GrupoComando =
  'navegacion' | 'servicios' | 'proyectos' | 'herramientas' | 'github' | 'general';

export interface Comando {
  id: string;
  grupo: GrupoComando;
  titulo: string;
  /** Texto secundario (dominio, descripción); también se busca en él. */
  detalle?: string;
  /** Palabras extra que también encuentran el comando (p. ej. el id de la pantalla). */
  claves?: string;
  ejecutar: () => void | Promise<void>;
}

/** Minúsculas y sin tildes: "Túneles" y "tuneles" son lo mismo. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * Puntaje de `palabra` dentro de `texto` (ambos normalizados), o null si no aparece ni como
 * subsecuencia. Gana lo contiguo, y más aún al comienzo de una palabra.
 */
function puntajePalabra(texto: string, palabra: string): number | null {
  const i = texto.indexOf(palabra);
  if (i >= 0) {
    const inicio = i === 0 || !/[a-z0-9]/.test(texto[i - 1]!);
    return 100 + palabra.length * 4 + (inicio ? 50 : 0) - Math.min(i, 30);
  }
  // Subsecuencia: cada letra en orden; los huecos restan.
  let pos = -1;
  let huecos = 0;
  for (const c of palabra) {
    const sig = texto.indexOf(c, pos + 1);
    if (sig < 0) return null;
    if (pos >= 0) huecos += sig - pos - 1;
    pos = sig;
  }
  return Math.max(1, 40 + palabra.length * 2 - huecos);
}

/** Puntaje de la consulta (varias palabras, todas deben aparecer); null si no coincide. */
export function puntuar(c: Pick<Comando, 'titulo' | 'detalle' | 'claves'>, consulta: string) {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (!palabras.length) return 0;
  const titulo = normalizar(c.titulo);
  const resto = normalizar(`${c.detalle ?? ''} ${c.claves ?? ''}`);
  let total = 0;
  for (const p of palabras) {
    const enTitulo = puntajePalabra(titulo, p);
    const enResto = puntajePalabra(resto, p);
    // El título pesa más que el detalle.
    const mejor = Math.max(enTitulo ?? -1, enResto === null ? -1 : enResto * 0.6);
    if (mejor < 0) return null;
    total += mejor;
  }
  return total;
}

/** Comandos que coinciden, del mejor al peor (a igual puntaje, en el orden original). */
export function filtrarComandos<T extends Comando>(
  comandos: readonly T[],
  consulta: string,
  max = 60,
): T[] {
  if (!consulta.trim()) return comandos.slice(0, max);
  return comandos
    .map((c, i) => ({ c, i, p: puntuar(c, consulta) }))
    .filter((x): x is { c: T; i: number; p: number } => x.p !== null)
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .slice(0, max)
    .map((x) => x.c);
}

/** Índice siguiente con las flechas, dando la vuelta. */
export function moverSeleccion(actual: number, total: number, paso: 1 | -1): number {
  if (total <= 0) return 0;
  return (actual + paso + total) % total;
}
