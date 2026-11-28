export interface LineaDiff {
  tipo: 'igual' | 'mas' | 'menos';
  texto: string;
}

/** Líneas de contexto que se muestran antes y después de lo que cambia. */
const CONTEXTO = 2;
/** Tope del cuadro de comparación de la parte que cambia (si pasa, se muestra entera sin alinear). */
const MAX_CELDAS = 4_000_000;

/**
 * Diferencia por líneas entre dos textos: recorta el comienzo y el final iguales, alinea lo que
 * queda (LCS) y devuelve solo lo que cambia con unas líneas de contexto. Pensada para ediciones
 * localizadas (una entrada de una configuración), no para comparar archivos enteros distintos.
 */
export function diffLineas(antes: string, despues: string): LineaDiff[] {
  const a = antes === '' ? [] : antes.split(/\r?\n/);
  const b = despues === '' ? [] : despues.split(/\r?\n/);
  let ini = 0;
  while (ini < a.length && ini < b.length && a[ini] === b[ini]) ini++;
  let fin = 0;
  while (
    fin < a.length - ini &&
    fin < b.length - ini &&
    a[a.length - 1 - fin] === b[b.length - 1 - fin]
  ) {
    fin++;
  }
  const ma = a.slice(ini, a.length - fin);
  const mb = b.slice(ini, b.length - fin);
  const medio: LineaDiff[] = [];
  if (ma.length * mb.length > MAX_CELDAS) {
    for (const t of ma) medio.push({ tipo: 'menos', texto: t });
    for (const t of mb) medio.push({ tipo: 'mas', texto: t });
  } else {
    const w = mb.length + 1;
    const tabla = new Uint32Array((ma.length + 1) * w);
    for (let i = ma.length - 1; i >= 0; i--) {
      for (let j = mb.length - 1; j >= 0; j--) {
        tabla[i * w + j] =
          ma[i] === mb[j]
            ? tabla[(i + 1) * w + j + 1]! + 1
            : Math.max(tabla[(i + 1) * w + j]!, tabla[i * w + j + 1]!);
      }
    }
    let i = 0;
    let j = 0;
    while (i < ma.length && j < mb.length) {
      if (ma[i] === mb[j]) {
        medio.push({ tipo: 'igual', texto: ma[i]! });
        i++;
        j++;
      } else if (tabla[(i + 1) * w + j]! >= tabla[i * w + j + 1]!) {
        medio.push({ tipo: 'menos', texto: ma[i++]! });
      } else {
        medio.push({ tipo: 'mas', texto: mb[j++]! });
      }
    }
    while (i < ma.length) medio.push({ tipo: 'menos', texto: ma[i++]! });
    while (j < mb.length) medio.push({ tipo: 'mas', texto: mb[j++]! });
  }
  if (!medio.some((l) => l.tipo !== 'igual')) return [];
  const antesCtx = a
    .slice(Math.max(0, ini - CONTEXTO), ini)
    .map((t) => ({ tipo: 'igual' as const, texto: t }));
  const despuesCtx = a
    .slice(a.length - fin, a.length - fin + CONTEXTO)
    .map((t) => ({ tipo: 'igual' as const, texto: t }));
  return [...antesCtx, ...medio, ...despuesCtx];
}
