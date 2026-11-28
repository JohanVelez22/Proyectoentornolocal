export interface LineaDiff {
  tipo: 'igual' | 'mas' | 'menos' | 'omitido';
  texto: string;
  /** Solo en `omitido`: cuántas líneas iguales se saltaron. */
  omitidas?: number;
}

/** Líneas de contexto que se muestran antes y después de lo que cambia. */
const CONTEXTO = 2;
/** Tope del cuadro de comparación de la parte que cambia (si pasa, se muestra entera sin alinear). */
const MAX_CELDAS = 4_000_000;

/** Claves cuyo valor no se muestra nunca en una vista previa (sin distinguir mayúsculas). */
const CLAVE_SECRETA = /authorization|token|key|secret|pass/i;
/** Nombra una variable de entorno (no es un secreto): `Bearer ${VAR}`, `${env:VAR}`, `{env:VAR}`. */
const REFERENCIA_ENTORNO =
  /^(?:Bearer\s+)?(?:\$\{(?:env:)?[A-Za-z_][A-Za-z0-9_]*\}|\{env:[A-Za-z_][A-Za-z0-9_]*\})$/;
/** `clave: valor`, `clave = valor` o `"clave": "valor"` en JSON, TOML (también en línea) y YAML. */
const PAR =
  /(["']?)([\w.-]+)\1(\s*[:=]\s*)("(?:[^"\\]|\\.)*"|'[^']*'|(?![\s{[])(?:\$\{[^}\r\n]*\}|[^,}\]\r\n"'])*)/g;
/** Argumentos de línea de órdenes con el valor pegado: `--api-key=abc`. */
const ARGUMENTO = /(--[\w-]*(?:token|key|secret|pass)[\w-]*=)[^\s"',\]]+/gi;

/**
 * Oculta los valores sensibles de una línea (`Authorization` y claves con token, key, secret,
 * password o pass) para que una vista previa no enseñe secretos de otros servidores del archivo.
 */
export function enmascararLinea(linea: string): string {
  const conPares = linea.replace(
    PAR,
    (entero: string, comilla: string, clave: string, sep: string, valor: string) => {
      if (!CLAVE_SECRETA.test(clave) || /env_var$/i.test(clave)) return entero;
      const recortado = valor.trim();
      const limpio = recortado.replace(/^["']|["']$/g, '');
      if (limpio === '' || REFERENCIA_ENTORNO.test(limpio)) return entero;
      const q = recortado.startsWith('"') || recortado.startsWith("'") ? recortado[0]! : '';
      return `${comilla}${clave}${comilla}${sep}${q}***${q}`;
    },
  );
  return conPares.replace(ARGUMENTO, '$1***');
}

/** Líneas de un texto; el salto de línea final no cuenta como una línea vacía más. */
function lineasDe(t: string): string[] {
  if (t === '') return [];
  const l = t.split(/\r?\n/);
  if (l[l.length - 1] === '') l.pop();
  return l;
}

/** Sustituye los tramos iguales de más de 2·CONTEXTO líneas por un marcador. */
function colapsar(lineas: LineaDiff[]): LineaDiff[] {
  const salida: LineaDiff[] = [];
  let i = 0;
  while (i < lineas.length) {
    if (lineas[i]!.tipo !== 'igual') {
      salida.push(lineas[i++]!);
      continue;
    }
    let j = i;
    while (j < lineas.length && lineas[j]!.tipo === 'igual') j++;
    const n = j - i;
    if (n > 2 * CONTEXTO) {
      salida.push(...lineas.slice(i, i + CONTEXTO));
      const omitidas = n - 2 * CONTEXTO;
      salida.push({ tipo: 'omitido', texto: `… ${omitidas} líneas sin cambios …`, omitidas });
      salida.push(...lineas.slice(j - CONTEXTO, j));
    } else {
      salida.push(...lineas.slice(i, j));
    }
    i = j;
  }
  return salida;
}

/**
 * Diferencia por líneas entre dos textos: recorta el comienzo y el final iguales, alinea lo que
 * queda (LCS) y devuelve solo lo que cambia con unas líneas de contexto. Los tramos iguales
 * largos del medio se colapsan. Pensada para ediciones localizadas (una entrada de una
 * configuración), no para comparar archivos enteros distintos.
 */
export function diffLineas(antes: string, despues: string): LineaDiff[] {
  const a = lineasDe(antes);
  const b = lineasDe(despues);
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
  return colapsar([...antesCtx, ...medio, ...despuesCtx]);
}
