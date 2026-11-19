import { ErrorWolf } from '../errores';

export const MARCA_INICIO = '# >>> WolfCore Dev (no editar a mano)';
export const MARCA_FIN = '# <<< WolfCore Dev';

function saltoPredominante(contenido: string): string {
  const crlf = (contenido.match(/\r\n/g) ?? []).length;
  const lf = (contenido.match(/\n/g) ?? []).length - crlf;
  if (crlf === 0 && lf === 0) return '\r\n';
  return crlf >= lf ? '\r\n' : '\n';
}

/** Posiciones [inicio, fin) del bloque (incluye el salto final de la marca de cierre). */
function ubicarBloque(contenido: string): [number, number] | null {
  const ini =
    /^(\uFEFF)?[ \t]*# >>> (?:WolfCore Dev|Proyectoentornolocal)[^\r\n]*(?:\r?\n|$)/m.exec(
      contenido,
    );
  if (!ini) return null;
  const desde = ini.index + (ini[1] ? 1 : 0);
  const finIni = ini.index + ini[0].length;
  const fin = /^[ \t]*# <<< (?:WolfCore Dev|Proyectoentornolocal)[^\r\n]*(?:\r?\n|$)/m.exec(
    contenido.slice(finIni),
  );
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
    if (!DOMINIO_VALIDO.test(d))
      throw new ErrorWolf('hosts.dominio_invalido', `Dominio inválido: ${bruto}`);
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
  if (pos) {
    let resto = contenido.slice(pos[1]);
    // Si quedan bloques duplicados (viejo y nuevo), se eliminan: no debe quedar ninguno.
    for (let otro = ubicarBloque(resto); otro; otro = ubicarBloque(resto)) {
      resto = resto.slice(0, otro[0]) + resto.slice(otro[1]);
    }
    return contenido.slice(0, pos[0]) + bloque + resto;
  }
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
    if (/^# >>> (?:WolfCore Dev|Proyectoentornolocal)/.test(t)) {
      dentro = true;
      continue;
    }
    if (/^# <<< (?:WolfCore Dev|Proyectoentornolocal)/.test(t)) {
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

const ES_INICIO = /^\uFEFF?[ \t]*# >>> (?:WolfCore Dev|Proyectoentornolocal)/;
const ES_FIN = /^[ \t]*# <<< (?:WolfCore Dev|Proyectoentornolocal)/;
/** Línea con el formato exacto que escribe WolfCore Dev dentro del bloque. */
const LINEA_PROPIA = /^(?:127\.0\.0\.1|::1) {2}\S+$/;

export type CodificacionHosts = 'utf8' | 'utf16le' | 'utf16be';

/** Texto del hosts y su codificación (UTF-16 con BOM, o sin BOM si la mitad de los bytes es 0). */
export function decodificarHosts(b: Buffer): { texto: string; codificacion: CodificacionHosts } {
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
    return { texto: b.subarray(2).toString('utf16le'), codificacion: 'utf16le' };
  }
  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
    const le = Buffer.from(b.subarray(2));
    le.swap16();
    return { texto: le.toString('utf16le'), codificacion: 'utf16be' };
  }
  if (b.length >= 4 && b.length % 2 === 0) {
    let pares = 0;
    let impares = 0;
    for (let i = 0; i < b.length; i++)
      if (b[i] === 0) {
        if (i % 2 === 0) pares++;
        else impares++;
      }
    const mitad = b.length / 2;
    if (impares > mitad * 0.4 && pares === 0) {
      return { texto: b.toString('utf16le'), codificacion: 'utf16le' };
    }
  }
  return { texto: b.toString('utf8'), codificacion: 'utf8' };
}

/** Cuántos bloques de WolfCore Dev hay y si alguno quedó sin cierre (o hay un cierre suelto). */
export function diagnosticarBloques(texto: string): { bloques: number; sinCierre: boolean } {
  let bloques = 0;
  let abierto = false;
  let sinCierre = false;
  for (const linea of texto.split(/\r?\n/)) {
    if (ES_INICIO.test(linea)) {
      bloques++;
      if (abierto) sinCierre = true;
      abierto = true;
    } else if (ES_FIN.test(linea)) {
      if (!abierto) sinCierre = true;
      abierto = false;
    }
  }
  return { bloques, sinCierre: sinCierre || abierto };
}

/**
 * Quita las marcas rotas: un inicio sin su cierre (con las líneas con el formato propio que le
 * siguen) y un cierre suelto. Los bloques bien formados quedan; `aplicarBloque` deja uno solo.
 */
export function quitarMarcasRotas(texto: string): string {
  const salto = saltoPredominante(texto);
  const lineas = texto.split(/\r?\n/);
  const quitar = new Set<number>();
  let abierto: number | null = null;
  const quitarColgado = (desde: number, hasta: number): void => {
    quitar.add(desde);
    for (let i = desde + 1; i < hasta && LINEA_PROPIA.test(lineas[i]!.trim()); i++) quitar.add(i);
  };
  lineas.forEach((linea, i) => {
    if (ES_INICIO.test(linea)) {
      if (abierto !== null) quitarColgado(abierto, i);
      abierto = i;
    } else if (ES_FIN.test(linea)) {
      if (abierto === null) quitar.add(i);
      abierto = null;
    }
  });
  if (abierto !== null) quitarColgado(abierto, lineas.length);
  return lineas.filter((_, i) => !quitar.has(i)).join(salto);
}
