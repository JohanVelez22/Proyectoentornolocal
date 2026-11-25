import { NOMBRE_VARIABLE_SECRETA, PATRONES_SECRETOS } from '../../patronesSecretos';

/**
 * Una línea de un `.env`. `crudo` es la línea tal como estaba, con su fin de línea: unir los
 * `crudo` devuelve el archivo idéntico (comentarios, orden, comillas, CRLF y sin salto final).
 */
export interface LineaEnv {
  tipo: 'variable' | 'comentario' | 'vacia';
  clave?: string;
  /** Valor sin comillas (con las comillas y barras escapadas ya resueltas si iba entre comillas dobles). */
  valor?: string;
  comillas?: '"' | "'" | null;
  /** Texto que sigue al valor (` # nota`), tal cual. */
  resto?: string;
  /** `export ` y sangría que precedían a la clave, tal cual. */
  prefijo?: string;
  /** Texto entre la clave y el valor (` = `, `=`), tal cual. */
  igual?: string;
  crudo: string;
}

const VARIABLE = /^([ \t]*(?:export[ \t]+)?)([A-Za-z_][A-Za-z0-9_.]*)([ \t]*=[ \t]*)(.*)$/;

/** Separa el valor de lo que le sigue (comentario) y quita sus comillas. */
function valorDe(texto: string): {
  valor: string;
  comillas: '"' | "'" | null;
  resto: string;
} {
  const q = texto[0];
  if (q === '"' || q === "'") {
    let i = 1;
    let fin = -1;
    while (i < texto.length) {
      if (q === '"' && texto[i] === '\\') {
        i += 2;
        continue;
      }
      if (texto[i] === q) {
        fin = i;
        break;
      }
      i++;
    }
    if (fin > 0) {
      const dentro = texto.slice(1, fin);
      return {
        valor: q === '"' ? dentro.replace(/\\(["\\])/g, '$1') : dentro,
        comillas: q,
        resto: texto.slice(fin + 1),
      };
    }
  }
  const c = /\s+#/.exec(texto);
  if (c) return { valor: texto.slice(0, c.index), comillas: null, resto: texto.slice(c.index) };
  return {
    valor: texto.replace(/\s+$/, ''),
    comillas: null,
    resto: texto.slice(texto.replace(/\s+$/, '').length),
  };
}

/** Lee el texto de un `.env` línea por línea sin perder nada (ver `LineaEnv`). */
export function leerEnv(texto: string): LineaEnv[] {
  const bom = texto.charCodeAt(0) === 0xfeff;
  const cuerpo = bom ? texto.slice(1) : texto;
  const lineas = cuerpo === '' ? [] : cuerpo.split(/(?<=\n)/);
  const salida: LineaEnv[] = lineas.map((crudo) => {
    const sinFin = crudo.replace(/\r?\n$/, '');
    if (sinFin.trim() === '') return { tipo: 'vacia', crudo };
    if (/^[ \t]*#/.test(sinFin)) return { tipo: 'comentario', crudo };
    const m = VARIABLE.exec(sinFin);
    if (!m) return { tipo: 'comentario', crudo };
    const v = valorDe(m[4]!);
    return {
      tipo: 'variable',
      clave: m[2]!,
      valor: v.valor,
      comillas: v.comillas,
      resto: v.resto,
      prefijo: m[1]!,
      igual: m[3]!,
      crudo,
    };
  });
  // El BOM viaja pegado a la primera línea para que la ida y vuelta sea exacta.
  if (bom) {
    if (salida.length === 0) salida.push({ tipo: 'vacia', crudo: '\ufeff' });
    else salida[0] = { ...salida[0]!, crudo: `\ufeff${salida[0]!.crudo}` };
  }
  return salida;
}

/** Une las líneas: `escribirEnv(leerEnv(t)) === t`. */
export function escribirEnv(lineas: readonly LineaEnv[]): string {
  return lineas.map((l) => l.crudo).join('');
}

/**
 * ¿Es un valor secreto? Por el nombre (`*_KEY`, `*_SECRET`, `*_PASSWORD`, `*_PASS`, `*_TOKEN`,
 * `*_PWD`, `APP_KEY`, `database.default.password`…) o porque el valor tiene la forma de un secreto
 * (`PATRONES_SECRETOS`: URL con usuario y clave, tokens de GitHub, claves de IA…).
 */
export function esSecreta(clave: string, valor: string): boolean {
  if (NOMBRE_VARIABLE_SECRETA.test(clave)) return true;
  return PATRONES_SECRETOS.some(([patron]) => {
    patron.lastIndex = 0;
    const r = patron.test(valor);
    patron.lastIndex = 0;
    return r;
  });
}

/** `••••` y los 4 últimos caracteres (solo si el valor tiene al menos 12; si no, solo los puntos). */
export function enmascarar(valor: string): string {
  if (valor === '') return '';
  return valor.length >= 12 ? `••••${valor.slice(-4)}` : '••••';
}
