import type {
  DatosSitio,
  EstadoHttps,
  EstadoServicio,
  EstadoTunel,
  ResultadoAplicar,
  Sitio,
} from '../../shared/api';
import { es } from '../i18n/es';

/** Lógica pura de la sección Sitios: sin Vue ni IPC, para poder probarla sola. */

export type TipoSitio = Sitio['tipo'];
export type EstadoNginx = EstadoServicio['estado'] | undefined;

export const TIPOS: readonly TipoSitio[] = [
  'laravel',
  'codeigniter3',
  'estatico',
  'proxy',
  'personalizado',
];

/** Tipos que necesitan una versión de PHP (igual que el núcleo). */
export const usaPhp = (tipo: TipoSitio): boolean =>
  tipo === 'laravel' || tipo === 'codeigniter3' || tipo === 'personalizado';

export const SUFIJO = '.test';

/** "WolfCore.test " → "wolfcore". Lo que el usuario escribe antes del sufijo fijo. */
export function baseDominio(dominio: string): string {
  const d = dominio.trim().toLowerCase();
  return d.endsWith(SUFIJO) ? d.slice(0, -SUFIJO.length) : d;
}

export function armarDominio(base: string): string {
  const b = baseDominio(base).replace(/\.+$/, '');
  return b ? `${b}${SUFIJO}` : '';
}

/** Alias escrito a mano: minúsculas, sin espacios y con `.test` si falta. */
export function normalizarAlias(alias: string): string {
  const a = alias.trim().toLowerCase().replace(/\s+/g, '');
  if (!a) return '';
  return a.endsWith(SUFIJO) ? a : `${a.replace(/\.+$/, '')}${SUFIJO}`;
}

/** Nombre de la carpeta final de una ruta (Windows o POSIX). */
export function nombreDeCarpeta(ruta: string): string {
  return (
    ruta
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() ?? ''
  );
}

export function urlLocal(dominio: string, puerto?: number | null): string {
  return puerto && puerto !== 80 ? `http://${dominio}:${puerto}` : `http://${dominio}`;
}

/* ───────────── HTTPS ───────────── */

/** URL https del dominio; lleva el puerto solo si no es el estándar 443. */
export function urlHttps(dominio: string, puerto: number): string {
  return puerto === 443 ? `https://${dominio}` : `https://${dominio}:${puerto}`;
}

/** "Redirigir a HTTPS" solo tiene sentido (y solo se habilita) con HTTPS activo. */
export function redirigirHabilitado(d: Pick<DatosSitio, 'https'>): boolean {
  return d.https;
}

export interface EstadoHttpsSitio {
  /** "HTTPS pendiente: …" si el sitio pidió HTTPS pero Nginx lo sirve solo por HTTP. */
  pendiente: string | null;
  /** HTTPS funciona, pero el navegador no confía todavía (autoridad sin instalar). */
  sinConfianza: boolean;
}

/**
 * Por qué un sitio con HTTPS no lo tiene todavía (puerto ocupado por otro programa o sin
 * autoridad), igual que decide el núcleo al generar los vhosts. Sin estado conocido no se avisa.
 */
export function estadoHttpsSitio(
  sitio: Pick<Sitio, 'https'>,
  estado: EstadoHttps | null,
): EstadoHttpsSitio {
  const t = es.sitioHttps;
  if (!sitio.https || !estado) return { pendiente: null, sinConfianza: false };
  if (estado.ocupadoPor) {
    const { nombre, pid } = estado.ocupadoPor;
    return { pendiente: t.pendiente(t.ocupado(estado.puerto, nombre, pid)), sinConfianza: false };
  }
  if (!estado.caCreada) return { pendiente: t.pendiente(t.sinAutoridad), sinConfianza: false };
  return { pendiente: null, sinConfianza: !estado.caInstalada };
}

/** Qué abre el formulario de sitio: uno nuevo, uno existente o una copia. */
export type ObjetivoForm =
  { modo: 'nuevo' } | { modo: 'editar'; sitio: Sitio } | { modo: 'duplicar'; datos: DatosSitio };

/** Fallo al escribir hosts, para el aviso persistente con instrucciones manuales. */
export interface FalloHosts {
  motivo: string;
  comandoManual: string;
}

export function falloHostsDe(r: ResultadoAplicar): FalloHosts | null {
  return r.hosts.ok
    ? null
    : { motivo: r.hosts.motivo ?? 'denegado', comandoManual: r.hosts.comandoManual ?? '' };
}

/* ───────────── Estado visible de un sitio ───────────── */

export type PuntoSitio = 'encendido' | 'apagado' | 'iniciando' | 'error' | 'externo' | 'aviso';

export interface EstadoSitio {
  punto: PuntoSitio;
  etiqueta: string;
  /** Dominios del sitio (principal y alias) que todavía no están en hosts. */
  faltanEnHosts: string[];
}

/**
 * Combina el estado de Nginx con los dominios pendientes en hosts: un sitio solo está "en línea"
 * si Nginx está encendido y todos sus dominios apuntan al equipo.
 */
export function derivarEstadoSitio(
  sitio: Pick<Sitio, 'dominio' | 'alias'>,
  nginx: EstadoNginx,
  pendientes: readonly string[],
): EstadoSitio {
  const t = es.sitios.estado;
  const faltanEnHosts = [sitio.dominio, ...sitio.alias].filter((d) => pendientes.includes(d));
  switch (nginx) {
    case 'encendido':
      return faltanEnHosts.length
        ? { punto: 'aviso', etiqueta: t.faltaHosts, faltanEnHosts }
        : { punto: 'encendido', etiqueta: t.enLinea, faltanEnHosts };
    case 'iniciando':
      return { punto: 'iniciando', etiqueta: t.iniciando, faltanEnHosts };
    case 'error':
      return { punto: 'error', etiqueta: t.errorNginx, faltanEnHosts };
    case 'externo':
      return { punto: 'externo', etiqueta: t.nginxExterno, faltanEnHosts };
    default:
      return { punto: 'apagado', etiqueta: t.nginxApagado, faltanEnHosts };
  }
}

/* ───────────── Túnel ───────────── */

/**
 * Publicar (abrir o renovar) un túnel de un sitio con datos reales exige confirmación.
 */
export function requiereConfirmacion(sitio: Pick<Sitio, 'datosReales'> | undefined): boolean {
  return sitio?.datosReales === true;
}

/**
 * Motivo por el que no se puede abrir (o reintentar tras un error) un túnel, o null si se puede.
 * Un túnel activo o abriéndose nunca se bloquea: siempre se puede cerrar.
 */
export function motivoTunelBloqueado(o: {
  nginx: EstadoNginx;
  /** undefined mientras no se sabe (no se bloquea: el núcleo igual lo explica). */
  cloudflaredInstalado: boolean | undefined;
  tunel: EstadoTunel['estado'];
}): string | null {
  // Activo o abriéndose siempre se puede cerrar; apagado o con error se va a (re)abrir.
  if (o.tunel === 'activo' || o.tunel === 'iniciando') return null;
  if (o.cloudflaredInstalado === false) return es.tunel.sinCloudflared;
  if (o.nginx !== 'encendido') return es.tunel.sinNginx;
  return null;
}

/* ───────────── Búsqueda ───────────── */

const sinTildes = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

export function filtrarSitios<T extends Pick<Sitio, 'nombre' | 'dominio' | 'alias'>>(
  sitios: readonly T[],
  texto: string,
): T[] {
  const q = sinTildes(texto.trim());
  if (!q) return [...sitios];
  return sitios.filter((s) =>
    [s.nombre, s.dominio, ...s.alias].some((campo) => sinTildes(campo).includes(q)),
  );
}

export function ordenarSitios<T extends Pick<Sitio, 'nombre' | 'dominio'>>(
  sitios: readonly T[],
): T[] {
  return [...sitios].sort((a, b) =>
    (a.nombre || a.dominio).localeCompare(b.nombre || b.dominio, 'es', { sensitivity: 'base' }),
  );
}

/* ───────────── Formulario ───────────── */

export function sitioVacio(): DatosSitio {
  return {
    nombre: '',
    dominio: '',
    alias: [],
    carpeta: '',
    tipo: 'laravel',
    php: null,
    puertoProxy: null,
    reglasExtra: '',
    urlBaseVar: null,
    datosReales: false,
    https: false,
    redirigirHttps: false,
    nota: '',
  };
}

/** Copia para "Duplicar": mismo proyecto y ajustes, dominio nuevo y sin alias (chocarían). */
export function datosParaDuplicar(sitio: Sitio, existentes: readonly Sitio[]): DatosSitio {
  const { id: _id, ...datos } = sitio;
  void _id;
  const usados = new Set(existentes.flatMap((s) => [s.dominio, ...s.alias]));
  const base = baseDominio(sitio.dominio);
  let dominio = `${base}-copia${SUFIJO}`;
  for (let n = 2; usados.has(dominio); n++) dominio = `${base}-copia-${n}${SUFIJO}`;
  return {
    ...datos,
    alias: [],
    dominio,
    nombre: es.formSitio.nombreCopia(sitio.nombre || sitio.dominio),
  };
}

/** Deja los datos listos para el núcleo: dominios limpios y sin campos que el tipo no usa. */
export function limpiarDatos(d: DatosSitio): DatosSitio {
  return {
    ...d,
    nombre: d.nombre.trim() || nombreDeCarpeta(d.carpeta),
    dominio: d.dominio.trim().toLowerCase(),
    alias: d.alias.map((a) => a.trim().toLowerCase()).filter(Boolean),
    php: usaPhp(d.tipo) ? d.php : null,
    puertoProxy: d.tipo === 'proxy' ? d.puertoProxy : null,
    urlBaseVar: d.urlBaseVar?.trim() || null,
    redirigirHttps: d.https && d.redirigirHttps,
    nota: d.nota.trim(),
  };
}

export type CampoSitio = 'carpeta' | 'dominio' | 'alias' | 'php' | 'puertoProxy' | 'urlBaseVar';
export type ErroresSitio = Partial<Record<CampoSitio, string>>;

const ETIQUETA = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const dominioValido = (d: string): boolean =>
  d.endsWith(SUFIJO) &&
  d.length > SUFIJO.length &&
  d
    .slice(0, -SUFIJO.length)
    .split('.')
    .every((p) => ETIQUETA.test(p));

/**
 * Validación en el cliente, con los mismos mensajes que el núcleo. El núcleo vuelve a validar
 * (carpeta existente, PHP instalado), así que esto solo adelanta los errores obvios.
 */
export function validarFormularioSitio(
  datos: DatosSitio,
  otros: readonly Pick<Sitio, 'dominio' | 'alias'>[],
): ErroresSitio {
  const t = es.formSitio.errores;
  const d = limpiarDatos(datos);
  const errores: ErroresSitio = {};

  if (!d.carpeta) errores.carpeta = t.carpeta;

  if (!d.dominio.endsWith(SUFIJO) || d.dominio === SUFIJO) errores.dominio = t.sufijo;
  else if (!dominioValido(d.dominio)) errores.dominio = t.caracteres;

  const aliasMal = d.alias.find((a) => !dominioValido(a));
  const repetido = d.alias.find((a, i) => d.alias.indexOf(a) !== i);
  if (aliasMal) errores.alias = aliasMal.endsWith(SUFIJO) ? t.caracteres : t.sufijo;
  else if (d.alias.includes(d.dominio)) errores.alias = t.aliasIgualDominio(d.dominio);
  else if (repetido) errores.alias = t.aliasRepetido(repetido);

  if (!errores.dominio || !errores.alias) {
    const ocupados = new Set(otros.flatMap((o) => [o.dominio, ...o.alias]));
    if (!errores.dominio && ocupados.has(d.dominio)) errores.dominio = t.ocupado(d.dominio);
    const aliasOcupado = d.alias.find((a) => ocupados.has(a));
    if (!errores.alias && aliasOcupado) errores.alias = t.ocupado(aliasOcupado);
  }

  if (d.tipo === 'proxy') {
    const p = d.puertoProxy;
    if (p === null) errores.puertoProxy = t.puertoFalta;
    else if (!Number.isInteger(p) || p < 1 || p > 65535) errores.puertoProxy = t.puertoRango;
  } else if (usaPhp(d.tipo) && !d.php) {
    errores.php = t.php;
  }

  if (d.urlBaseVar && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(d.urlBaseVar)) {
    errores.urlBaseVar = t.urlBaseVar;
  }
  return errores;
}

/**
 * Versión de PHP a preseleccionar: la que pide el proyecto si está instalada; si no, la más
 * nueva instalada. `pedida` queda para avisar al usuario cuando no coincide.
 */
export function elegirPhp(
  pedida: string | null,
  instaladas: readonly string[],
): { php: string | null; noInstalada: string | null } {
  if (pedida && instaladas.includes(pedida)) return { php: pedida, noInstalada: null };
  const ordenadas = [...instaladas].sort((a, b) => b.localeCompare(a, 'es', { numeric: true }));
  return { php: ordenadas[0] ?? null, noInstalada: pedida };
}
