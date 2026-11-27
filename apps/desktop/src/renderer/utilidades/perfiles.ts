import type {
  OpcionesImportarPerfil,
  PrefijoRuta,
  ResultadoImportarPerfil,
  VistaPreviaPerfil,
} from '../../shared/api';

/** Largo mínimo de la frase que cifra las bases y la CA (el núcleo lo exige igual). */
export const MIN_FRASE = 10;

/* ───────────── Exportar ───────────── */

export interface FormExportar {
  bases: boolean;
  certificados: boolean;
  ca: boolean;
  frase: string;
  fraseRepetida: string;
}

export type ProblemaExportar = 'frase_corta' | 'frase_distinta' | 'certificados_sin_ca';

/** La frase se pide solo si se exportan las bases o la CA; los certificados solo viajan con la CA. */
export function problemaExportar(f: FormExportar): ProblemaExportar | null {
  if (f.certificados && !f.ca) return 'certificados_sin_ca';
  if (f.bases || f.ca) {
    if ([...f.frase].length < MIN_FRASE) return 'frase_corta';
    if (f.frase !== f.fraseRepetida) return 'frase_distinta';
  }
  return null;
}

/* ───────────── Importar ───────────── */

/** Lo que el usuario fue decidiendo en el asistente (la frase vive solo aquí, nunca en un store). */
export interface EstadoImportar {
  vista: VistaPreviaPerfil;
  /** Carpeta elegida por diálogo para cada sitio (id → ruta). */
  rutas: Record<string, string>;
  prefijos: PrefijoRuta[];
  /** Sitios que se importan igual, como pendientes (sin su carpeta). */
  comoPendiente: Record<string, boolean>;
  frase: string;
  importarCa: boolean;
  reemplazarCa: boolean;
  aceptarSinRestricciones: boolean;
  omitirBases: boolean;
  envProyectos: string[];
}

/** "Confirmar" del paso de revisión: con la vista previa al día, sin error y sin leer. */
export function puedeConfirmarRevision(c: {
  cargando: boolean;
  hayVista: boolean;
  errorVista: string | null;
}): boolean {
  return !c.cargando && c.hayVista && c.errorVista === null;
}

export type BloqueoImportar =
  'sitios_sin_carpeta' | 'frase_requerida' | 'ca_ajena' | 'ca_sin_restricciones' | 'reemplazar_ca';

/** Sitios que no se omiten y todavía no tienen carpeta (ni elegida ni existente). */
export function sitiosSinCarpeta(
  vista: Pick<VistaPreviaPerfil, 'sitios'>,
  rutas: Record<string, string>,
): VistaPreviaPerfil['sitios'] {
  return vista.sitios.filter((s) => !s.existe && s.omitido === null && !rutas[s.id]);
}

/** ¿Se puede importar la CA del perfil? Nunca una con restricciones de nombre ajenas. */
export function ofreceCa(vista: Pick<VistaPreviaPerfil, 'ca'>): boolean {
  return vista.ca !== null && !vista.ca.restriccionesAjenas;
}

/** ¿Hace falta la frase? Con bases (sin omitirlas) o para importar la CA. */
export function fraseNecesaria(e: EstadoImportar): boolean {
  const conBases = e.vista.bases.length > 0 && !e.omitirBases;
  const conCa = e.importarCa && e.vista.ca !== null;
  return e.vista.requiereFrase && (conBases || conCa);
}

export function bloqueosImportar(e: EstadoImportar): BloqueoImportar[] {
  const b: BloqueoImportar[] = [];
  const pendientes = sitiosSinCarpeta(e.vista, e.rutas).filter((s) => !e.comoPendiente[s.id]);
  if (pendientes.length > 0) b.push('sitios_sin_carpeta');
  if (fraseNecesaria(e) && e.frase === '') b.push('frase_requerida');
  const ca = e.vista.ca;
  if (e.importarCa && ca) {
    if (ca.restriccionesAjenas) b.push('ca_ajena');
    else if (!ca.restringida && !e.aceptarSinRestricciones) b.push('ca_sin_restricciones');
    if (ca.reemplazaLocal && !e.reemplazarCa) b.push('reemplazar_ca');
  }
  return b;
}

export function puedeImportar(e: EstadoImportar): boolean {
  return bloqueosImportar(e).length === 0;
}

/**
 * Las opciones que se mandan al proceso principal: la frase solo si hace falta, y cada
 * confirmación solo si corresponde (una CA ajena nunca se manda).
 */
export function opcionesImportar(e: EstadoImportar): OpcionesImportarPerfil {
  const ca = e.vista.ca;
  const importaCa = e.importarCa && ca !== null && !ca.restriccionesAjenas;
  return {
    rutas: e.rutas,
    ...(e.prefijos.length > 0 ? { prefijos: e.prefijos } : {}),
    ...(fraseNecesaria(e) && e.frase !== '' ? { frase: e.frase } : {}),
    ...(importaCa ? { importarCa: true as const } : {}),
    ...(importaCa && ca.reemplazaLocal && e.reemplazarCa ? { reemplazarCa: true as const } : {}),
    ...(importaCa && !ca.restringida && e.aceptarSinRestricciones
      ? { aceptarCaSinRestricciones: true as const }
      : {}),
    ...(e.omitirBases && e.vista.bases.length > 0 ? { omitirBases: true as const } : {}),
    ...(e.envProyectos.length > 0 ? { envProyectos: e.envProyectos } : {}),
    huella: e.vista.huella,
    confirmado: true,
  };
}

/** Huella SHA-256 en mayúsculas y en grupos de 4, para compararla a simple vista. */
export function huellaEnGrupos(huella: string): string {
  return (
    huella
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join(' ') ?? ''
  );
}

const tramos = (ruta: string): string[] => ruta.split(/[\\/]+/).filter((t) => t !== '');

/**
 * Del cambio de carpeta de un sitio (`C:\Users\viejo\proyectos\tienda` → `D:\dev\proyectos\tienda`)
 * deduce el cambio de prefijo para los demás: lo que queda al quitar el final que no cambió.
 * Sin un final en común (al menos el nombre de la carpeta), o sin cambio, devuelve null.
 */
export function prefijoDesdeElegida(vieja: string, elegida: string): PrefijoRuta | null {
  const a = tramos(vieja);
  const b = tramos(elegida);
  const igual = (x: string, y: string): boolean => x.toLowerCase() === y.toLowerCase();
  let comunes = 0;
  while (
    comunes < a.length &&
    comunes < b.length &&
    igual(a[a.length - 1 - comunes]!, b[b.length - 1 - comunes]!)
  ) {
    comunes++;
  }
  // Todo igual (nada que cambiar) o ningún tramo final en común.
  if (comunes === 0 || comunes === a.length || comunes === b.length) return null;
  const sepVieja = vieja.includes('\\') ? '\\' : '/';
  const sepNueva = elegida.includes('\\') ? '\\' : '/';
  const raizVieja = /^[\\/]/.test(vieja) ? sepVieja : '';
  const raizNueva = /^[\\/]/.test(elegida) ? sepNueva : '';
  const viejo = raizVieja + a.slice(0, a.length - comunes).join(sepVieja);
  const nuevo = raizNueva + b.slice(0, b.length - comunes).join(sepNueva);
  return igual(viejo, nuevo) ? null : { viejo, nuevo };
}

export type TipoQuitado = 'ia' | 'smtp' | 'puerto' | 'carpeta_vigilada';

/** `ia:<id>`, `smtp:<id>`, `puerto:<campo>` y `carpeta_vigilada` de la vista previa. */
export function lineasConfigQuitada(lista: readonly string[]): { tipo: TipoQuitado; id: string }[] {
  const salida: { tipo: TipoQuitado; id: string }[] = [];
  for (const x of lista) {
    const [tipo, ...resto] = x.split(':');
    if (tipo === 'ia' || tipo === 'smtp' || tipo === 'puerto' || tipo === 'carpeta_vigilada') {
      salida.push({ tipo, id: resto.join(':') });
    }
  }
  return salida;
}

export interface ResumenImportacion {
  importados: number;
  pendientes: number;
  omitidos: number;
  errores: number;
}

/** Cuántas cosas quedaron importadas, pendientes, omitidas o con error (sitios, versiones y bases). */
export function resumenImportacion(r: ResultadoImportarPerfil): ResumenImportacion {
  const c: ResumenImportacion = { importados: 0, pendientes: 0, omitidos: 0, errores: 0 };
  const sumar = (estado: string): void => {
    if (estado === 'importado' || estado === 'instalada' || estado === 'ya_instalada') {
      c.importados++;
    } else if (estado === 'pendiente') c.pendientes++;
    else if (estado === 'omitido') c.omitidos++;
    else if (estado === 'error') c.errores++;
  };
  for (const s of r.sitios) sumar(s.estado);
  for (const v of r.versiones) sumar(v.estado);
  for (const b of r.bases) sumar(b.estado);
  return c;
}

/* ───────────── Texto de lo que muestra la vista previa y el resultado ───────────── */

export type FilaReemplaza =
  | { tipo: 'config' }
  | { tipo: 'ca' }
  | { tipo: 'sitio'; id: string }
  | { tipo: 'plantilla'; id: string }
  | { tipo: 'base'; instancia: string; base: string };

/** Interpreta los textos de `reemplaza` de la vista previa (`sitio:<id>`, `base:<inst>/<base>`…). */
export function filaReemplaza(x: string): FilaReemplaza | null {
  if (x === 'config.json') return { tipo: 'config' };
  if (x === 'ca') return { tipo: 'ca' };
  const i = x.indexOf(':');
  if (i < 0) return null;
  const tipo = x.slice(0, i);
  const resto = x.slice(i + 1);
  if (tipo === 'sitio' && resto) return { tipo: 'sitio', id: resto };
  if (tipo === 'plantilla' && resto) return { tipo: 'plantilla', id: resto };
  if (tipo === 'base') {
    const j = resto.indexOf('/');
    if (j > 0 && j < resto.length - 1) {
      return { tipo: 'base', instancia: resto.slice(0, j), base: resto.slice(j + 1) };
    }
  }
  return null;
}

export type EstadoVersionVista = 'instalada' | 'descargar' | 'pendienteDebil' | 'pendienteFuera';

/** Qué pasará con una versión del perfil (la huella es la del catálogo de este equipo). */
export function estadoVersion(
  v: Pick<VistaPreviaPerfil['versiones'][number], 'instalada' | 'disponible' | 'huella'>,
): EstadoVersionVista {
  if (v.instalada) return 'instalada';
  if (!v.disponible) return 'pendienteFuera';
  return v.huella === 'fuerte' || v.huella === 'firmada' ? 'descargar' : 'pendienteDebil';
}

/** Tamaño en MB o GB (un decimal). */
export function tamanoLegible(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

/** Rellena los `{parámetros}` de un texto. */
export function rellenar(plantilla: string, datos: Record<string, string> | undefined): string {
  return plantilla.replace(/\{(\w+)\}/g, (marca, k: string) => datos?.[k] ?? marca);
}
