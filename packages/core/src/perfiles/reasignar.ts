import type { Sitio } from '../tipos';

/** Cambio de prefijo de las carpetas de proyecto: `C:\Users\viejo\` → `D:\dev\`. */
export interface PrefijoRuta {
  viejo: string;
  nuevo: string;
}

/** Tramos de una ruta (sin separadores vacíos), con la unidad o la raíz como primer tramo. */
const tramos = (ruta: string): string[] => ruta.split(/[\\/]+/).filter((t) => t !== '');

/** Las rutas con letra de unidad (o UNC) no distinguen mayúsculas. */
const sinMayusculas = (ruta: string): boolean => /^[A-Za-z]:|^[\\/]{2}/.test(ruta);

/** ¿`ruta` empieza por los tramos de `prefijo`? Devuelve los tramos que sobran, o null. */
function resto(ruta: string, prefijo: string): string[] | null {
  const r = tramos(ruta);
  const p = tramos(prefijo);
  if (p.length === 0 || p.length > r.length) return null;
  // La raíz POSIX ("/") no deja tramos: una ruta absoluta POSIX solo casa con otra absoluta.
  if (ruta.startsWith('/') !== prefijo.startsWith('/')) return null;
  const igual = sinMayusculas(ruta)
    ? (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
    : (a: string, b: string) => a === b;
  for (let i = 0; i < p.length; i++) if (!igual(r[i]!, p[i]!)) return null;
  return r.slice(p.length);
}

/** Une `base` con los tramos de `resto` usando el separador que ya usa `base`. */
function unir(base: string, extra: string[]): string {
  const sep = base.includes('\\') || /^[A-Za-z]:$/.test(base) ? '\\' : '/';
  const limpia = base.replace(/[\\/]+$/, '');
  if (extra.length === 0) return limpia === '' ? sep : limpia;
  return `${limpia}${sep}${extra.join(sep)}`;
}

/**
 * Carpeta nueva de cada sitio al importar un perfil en otro equipo (otra unidad, otro usuario):
 * 1. la que el usuario eligió para ese sitio (`mapa[id]`, de un diálogo);
 * 2. si no, la del prefijo más largo de `prefijos` que case (`C:\Users\viejo\x` → `D:\dev\x`);
 * 3. si no, la misma.
 * No mira el disco: quien llama comprueba después si la carpeta existe.
 */
export function reasignarRutas(
  sitios: readonly Sitio[],
  mapa: Readonly<Record<string, string>>,
  prefijos: readonly PrefijoRuta[] = [],
): Sitio[] {
  const ordenados = [...prefijos].sort((a, b) => tramos(b.viejo).length - tramos(a.viejo).length);
  return sitios.map((s) => {
    const elegida = Object.prototype.hasOwnProperty.call(mapa, s.id) ? mapa[s.id] : undefined;
    if (typeof elegida === 'string' && elegida !== '') return { ...s, carpeta: elegida };
    for (const p of ordenados) {
      const r = resto(s.carpeta, p.viejo);
      if (r) return { ...s, carpeta: unir(p.nuevo, r) };
    }
    return { ...s };
  });
}

/**
 * ¿La carpeta reasignada viene de un prefijo elegido por el usuario? (Un tramo con `..` o con
 * caracteres de control nunca: el resto sale del perfil, que es de origen ajeno.)
 */
export function restoSeguro(ruta: string): boolean {
  return (
    !tramos(ruta).some((t) => t === '..' || t === '.') &&
    ![...ruta].some((c) => c.charCodeAt(0) < 0x20)
  );
}
