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
  if ((bajo(p, tmp) || /\/temp\//.test(p)) && RESTO_PRUEBA.test(p)) return 'prueba';
  return 'ajena';
}
