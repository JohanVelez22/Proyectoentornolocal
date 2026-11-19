import type { FuenteRegistroPublica, Sitio } from '../../shared/api';
import { textos } from '../i18n';

/** Líneas que guarda el visor por fuente (las más viejas se descartan). */
export const CAPACIDAD_REGISTROS = 5000;

/** Una línea del visor: `seq` es único y creciente (sirve de clave); el nivel se calcula al insertar. */
export interface LineaRegistro {
  seq: number;
  texto: string;
  nivel: NivelRegistro | null;
}

/**
 * Búfer circular de líneas: agregar es O(lote) aunque lleguen miles por segundo y la memoria
 * queda acotada a `capacidad`. `lista()` devuelve una copia en orden (de la más vieja a la nueva).
 */
export class BuferLineas {
  private datos: LineaRegistro[];
  private inicio = 0;
  private cantidad = 0;
  /** Total agregado desde el último `vaciar` (para saber cuántas se descartaron). */
  private agregadas = 0;
  /** No vuelve a cero al vaciar: las claves nunca se repiten. */
  private seq = 0;

  constructor(readonly capacidad = CAPACIDAD_REGISTROS) {
    if (!Number.isInteger(capacidad) || capacidad < 1)
      throw new RangeError(`capacidad: ${capacidad}`);
    this.datos = new Array<LineaRegistro>(capacidad);
  }

  get tamano(): number {
    return this.cantidad;
  }

  /** Líneas que ya no están porque el búfer se llenó. */
  get descartadas(): number {
    return this.agregadas - this.cantidad;
  }

  agregar(lineas: readonly string[]): void {
    this.agregadas += lineas.length;
    // De un lote más grande que el búfer solo sirven las últimas.
    const desde = Math.max(0, lineas.length - this.capacidad);
    this.seq += desde;
    for (let i = desde; i < lineas.length; i++) {
      const texto = lineas[i]!;
      const pos = (this.inicio + this.cantidad) % this.capacidad;
      this.datos[pos] = { seq: ++this.seq, texto, nivel: nivelDeLinea(texto) };
      if (this.cantidad < this.capacidad) this.cantidad++;
      else this.inicio = (this.inicio + 1) % this.capacidad;
    }
  }

  lista(): LineaRegistro[] {
    const fin = this.inicio + this.cantidad;
    if (fin <= this.capacidad) return this.datos.slice(this.inicio, fin);
    return [...this.datos.slice(this.inicio), ...this.datos.slice(0, fin - this.capacidad)];
  }

  textos(): string[] {
    return this.lista().map((l) => l.texto);
  }

  vaciar(): void {
    this.datos = new Array<LineaRegistro>(this.capacidad);
    this.inicio = 0;
    this.cantidad = 0;
    this.agregadas = 0;
  }
}

export type NivelRegistro = 'error' | 'warning' | 'info';
export const NIVELES_REGISTRO: readonly NivelRegistro[] = ['error', 'warning', 'info'];

const RE_ERROR = /\b(error|err|fatal|critical|crit|emerg(ency)?|alert|panic|exception|failed)\b/i;
const RE_AVISO = /\b(warn(ing)?|notice|deprecated)\b/i;
const RE_INFO = /\b(info|debug)\b/i;

/** Nivel de una línea según sus palabras clave (Nginx, PHP, Laravel, MySQL…); null si no tiene. */
export function nivelDeLinea(linea: string): NivelRegistro | null {
  if (RE_ERROR.test(linea)) return 'error';
  if (RE_AVISO.test(linea)) return 'warning';
  if (RE_INFO.test(linea)) return 'info';
  return null;
}

export interface FiltroRegistros {
  /** Texto a buscar (sin distinguir mayúsculas); vacío = todo. */
  texto: string;
  /** Niveles a mostrar; vacío o los tres = todas las líneas (también las que no tienen nivel). */
  niveles: readonly NivelRegistro[];
}

export function filtrarLineas(
  lineas: readonly LineaRegistro[],
  filtro: FiltroRegistros,
): LineaRegistro[] {
  const texto = filtro.texto.trim().toLowerCase();
  const porNivel = filtro.niveles.length > 0 && filtro.niveles.length < NIVELES_REGISTRO.length;
  if (!texto && !porNivel) return [...lineas];
  const niveles = new Set(filtro.niveles);
  return lineas.filter((l) => {
    if (porNivel && (!l.nivel || !niveles.has(l.nivel))) return false;
    if (texto && !l.texto.toLowerCase().includes(texto)) return false;
    return true;
  });
}

const tr = textos.registros;

/** Nombre visible de una fuente, armado con su grupo y su id (no con el nombre del núcleo). */
export function etiquetaFuente(
  f: FuenteRegistroPublica,
  sitioPorId: (id: string) => Pick<Sitio, 'nombre' | 'dominio' | 'procesos'> | undefined,
): string {
  const sitio = f.sitioId ? sitioPorId(f.sitioId) : undefined;
  const nombreSitio = sitio?.nombre || sitio?.dominio || f.sitioId || '';
  const partes = f.id.split(':');
  switch (f.grupo) {
    case 'nginx':
      return f.id === 'nginx:error' ? tr.fuentes.nginxError : tr.fuentes.nginxAcceso;
    case 'php':
      return tr.fuentes.php(partes[1] ?? '');
    case 'servicio':
      return tr.fuentes.servicio(f.id.slice('servicio:'.length));
    case 'sitio': {
      const dominio = sitio?.dominio || f.sitioId || '';
      return partes[2] === 'error'
        ? tr.fuentes.sitioError(dominio)
        : tr.fuentes.sitioAcceso(dominio);
    }
    case 'tunel':
      return partes[2] === 'salida'
        ? tr.fuentes.tunelSalida(nombreSitio)
        : tr.fuentes.tunel(nombreSitio);
    case 'laravel':
      return tr.fuentes.laravel(nombreSitio);
    case 'proyecto': {
      // id del supervisor: proy-<sitio>-<proceso>.
      const procesoId = f.sitioId ? f.id.slice(`proy-${f.sitioId}-`.length) : f.id;
      const proceso = sitio?.procesos.find((p) => p.id === procesoId);
      return tr.fuentes.proceso(nombreSitio, proceso?.nombre || procesoId);
    }
    default:
      return f.nombre;
  }
}

export type GrupoOpciones = {
  type: 'group';
  key: string;
  label: string;
  children: { value: string; label: string }[];
};

const ORDEN_GRUPOS = ['nginx', 'php', 'servicio', 'sitio', 'laravel', 'proyecto', 'tunel'] as const;

/** Opciones agrupadas para el selector de fuentes (grupos vacíos fuera). */
export function agruparFuentes(
  fuentes: readonly FuenteRegistroPublica[],
  sitioPorId: (id: string) => Pick<Sitio, 'nombre' | 'dominio' | 'procesos'> | undefined,
): GrupoOpciones[] {
  return ORDEN_GRUPOS.map((g) => ({
    type: 'group' as const,
    key: g,
    label: tr.grupos[g],
    children: fuentes
      .filter((f) => f.grupo === g)
      .map((f) => ({ value: f.id, label: etiquetaFuente(f, sitioPorId) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
  })).filter((g) => g.children.length > 0);
}

/** Fuente de registro de un proceso del supervisor ('nginx', 'php-8.4-0', 'proy-…', 'mysql'…). */
export function fuenteDeProceso(idSupervisor: string): string {
  if (idSupervisor === 'nginx') return 'nginx';
  if (idSupervisor.startsWith('proy-')) return idSupervisor;
  const php = /^php-(\d+\.\d+)(-\d+)?$/.exec(idSupervisor);
  if (php) return `php:${php[1]}`;
  return `servicio:${idSupervisor}`;
}
