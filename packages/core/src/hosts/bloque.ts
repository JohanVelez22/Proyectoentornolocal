export const MARCA_INICIO = '# >>> Proyectoentornolocal (no editar a mano)';
export const MARCA_FIN = '# <<< Proyectoentornolocal';

function saltoPredominante(contenido: string): string {
  const crlf = (contenido.match(/\r\n/g) ?? []).length;
  const lf = (contenido.match(/\n/g) ?? []).length - crlf;
  if (crlf === 0 && lf === 0) return '\r\n';
  return crlf >= lf ? '\r\n' : '\n';
}

/** Posiciones [inicio, fin) del bloque (incluye el salto final de la marca de cierre). */
function ubicarBloque(contenido: string): [number, number] | null {
  const ini = /^(\uFEFF)?[ \t]*# >>> Proyectoentornolocal[^\r\n]*(?:\r?\n|$)/m.exec(contenido);
  if (!ini) return null;
  const desde = ini.index + (ini[1] ? 1 : 0);
  const finIni = ini.index + ini[0].length;
  const fin = /^[ \t]*# <<< Proyectoentornolocal[^\r\n]*(?:\r?\n|$)/m.exec(contenido.slice(finIni));
  if (!fin) return null;
  return [desde, finIni + fin.index + fin[0].length];
}

/** Nombre de dominio aceptable en el archivo hosts (minúsculas, sin espacios). */
export const DOMINIO_VALIDO = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

/** Normaliza (trim + minúsculas), valida, quita duplicados y ordena. Lanza si hay un dominio inválido. */
export function normalizarDominios(dominios: string[]): string[] {
  const salida = new Set<string>();
  for (const bruto of dominios) {
    const d = bruto.trim().toLowerCase();
    if (!DOMINIO_VALIDO.test(d)) throw new Error(`Dominio inválido: ${bruto}`);
    salida.add(d);
  }
  return [...salida].sort();
}

export function aplicarBloque(contenido: string, dominios: string[]): string {
  const salto = saltoPredominante(contenido);
  const unicos = normalizarDominios(dominios);
  const bloque =
    unicos.length === 0
      ? ''
      : [MARCA_INICIO, ...unicos.flatMap((d) => [`127.0.0.1  ${d}`, `::1  ${d}`]), MARCA_FIN].join(
          salto,
        ) + salto;

  const pos = ubicarBloque(contenido);
  if (pos) return contenido.slice(0, pos[0]) + bloque + contenido.slice(pos[1]);
  if (!bloque) return contenido;
  const sep = contenido.length === 0 || contenido.endsWith('\n') ? '' : salto;
  return contenido + sep + bloque;
}

export function analizarHosts(contenido: string): { enBloque: string[]; fuera: string[] } {
  const texto = contenido.replace(/^\uFEFF/, '');
  const enBloque = new Set<string>();
  const fuera = new Set<string>();
  let dentro = false;
  for (const linea of texto.split(/\r?\n/)) {
    const t = linea.trim();
    if (t.startsWith('# >>> Proyectoentornolocal')) {
      dentro = true;
      continue;
    }
    if (t.startsWith('# <<< Proyectoentornolocal')) {
      dentro = false;
      continue;
    }
    const sinComentario = t.replace(/#.*$/, '').trim();
    if (!sinComentario) continue;
    const [, ...nombres] = sinComentario.split(/\s+/);
    for (const n of nombres) (dentro ? enBloque : fuera).add(n.toLowerCase());
  }
  return { enBloque: [...enBloque], fuera: [...fuera] };
}
