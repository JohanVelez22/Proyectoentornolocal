/** Ruta en minúsculas, con `/`, sin barra final ni variables sin expandir (las de Windows son sin distinguir mayúsculas). */
function normalizar(ruta: string): string {
  return ruta
    .replace(/^"|"$/g, '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .toLowerCase();
}

const bajo = (ruta: string, carpeta: string): boolean =>
  carpeta !== '' && (ruta === carpeta || ruta.startsWith(`${carpeta}/`));

/** Carpetas que dejan las pruebas de WolfCore Dev bajo la carpeta temporal. */
const RESTO_PRUEBA =
  /\/(pel-int-[^/]*|pel-etapa-[^/]*|pel-vhost-real-[^/]*|scratchpad\/ngx[^/]*)\//;

export type Origen = 'propia' | 'prueba' | 'ajena';

/**
 * De quién es una regla según la ruta del programa: `propia` si cuelga de la carpeta de datos de
 * WolfCore Dev; `prueba` si es un resto de pruebas de WolfCore bajo la carpeta temporal; `ajena`
 * el resto (FlyEnv, Laragon, XAMPP, el propio PHP o MySQL del usuario…). Solo las dos primeras
 * pueden entrar en un comando de limpieza.
 */
export function origenDeRegla(
  programa: string,
  carpetaDatos: string,
  carpetaTemporal: string,
): Origen {
  const p = normalizar(programa);
  // Una ruta con variables sin expandir o relativa nunca se atribuye a WolfCore Dev.
  if (p.includes('%') || p.includes('..') || !/^([a-z]:)?\//.test(p)) return 'ajena';
  if (bajo(p, normalizar(carpetaDatos))) return 'propia';
  const tmp = normalizar(carpetaTemporal);
  // Un resto de pruebas tiene que colgar de la carpeta temporal indicada (no vale cualquier
  // carpeta llamada `temp`).
  if (bajo(p, tmp) && RESTO_PRUEBA.test(p.slice(tmp.length))) return 'prueba';
  return 'ajena';
}

/**
 * Carpeta `pel-*` (o `scratchpad/ngx*`) de un resto de pruebas que contiene al programa, bajo la
 * carpeta temporal. Las dos rutas ya vienen resueltas (con `realpath`). null si no hay.
 */
export function raizDePrueba(programa: string, carpetaTemporal: string): string | null {
  const tmp = carpetaTemporal.replace(/[\\/]+$/, '');
  const norm = (x: string): string => x.replaceAll('\\', '/').toLowerCase();
  if (!norm(programa).startsWith(`${norm(tmp)}/`)) return null;
  const partes = programa
    .slice(tmp.length)
    .split(/[\\/]+/)
    .filter(Boolean);
  // El último trozo es el programa: la carpeta tiene que ser anterior.
  for (let i = 0; i < partes.length - 1; i++) {
    const t = partes[i]!.toLowerCase();
    const propia = /^(pel-int-|pel-etapa-|pel-vhost-real-)/.test(t);
    const scratch = i > 0 && partes[i - 1]!.toLowerCase() === 'scratchpad' && t.startsWith('ngx');
    if (propia || scratch) {
      return [tmp, ...partes.slice(0, i + 1)].join(programa.includes('\\') ? '\\' : '/');
    }
  }
  return null;
}
