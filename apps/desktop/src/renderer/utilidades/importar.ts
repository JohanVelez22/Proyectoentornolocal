import type {
  EstadoServicio,
  FilaImportar,
  OpcionesImportar,
  ObjetivoSqlIpc,
  ResultadoImportar,
} from '../../shared/api';
import { opcionesBase } from './nuevoProyecto';

/** Servidores locales donde se puede restaurar una base de Laragon, XAMPP o Herd (MySQL y MariaDB). */
export interface DestinoBd {
  value: ObjetivoSqlIpc;
  label: string;
  apagada: boolean;
}

export function destinosBd(
  servicios: readonly Pick<EstadoServicio, 'id' | 'nombre' | 'instancias'>[],
): DestinoBd[] {
  // Las mismas opciones que WordPress en "Nuevo proyecto": MySQL y MariaDB, por instancia.
  return opcionesBase('wordpress', false, servicios).map((o) => ({
    value: o.value as ObjetivoSqlIpc,
    label: o.label,
    apagada: o.apagada,
  }));
}

/** Primero uno encendido (la importación necesita el servidor local en marcha), si no el primero. */
export function destinoSugerido(destinos: readonly DestinoBd[]): ObjetivoSqlIpc | null {
  return (destinos.find((d) => !d.apagada) ?? destinos[0])?.value ?? null;
}

export type EstadoFila = 'importable' | 'yaVinculado' | 'dominioEnUso';

export function estadoFila(f: Pick<FilaImportar, 'yaVinculado' | 'dominioEnUso'>): EstadoFila {
  return f.yaVinculado ? 'yaVinculado' : f.dominioEnUso ? 'dominioEnUso' : 'importable';
}

/** Lo que se marca de entrada: todo lo que se puede importar. */
export function idsImportables(filas: readonly FilaImportar[]): string[] {
  return filas.filter((f) => estadoFila(f) === 'importable').map((f) => f.id);
}

export interface BaseElegida {
  nombre: string;
  motor: 'mysql' | 'mariadb';
  /** Ya existe en el servidor de destino (null: no se sabe). */
  existe: boolean | null;
}

/** Bases de los sitios marcados, sin repetir (MySQL y MariaDB no distinguen mayúsculas). */
export function basesDeLaSeleccion(
  filas: readonly FilaImportar[],
  seleccion: readonly string[],
): BaseElegida[] {
  const vistas = new Map<string, BaseElegida>();
  for (const f of filas) {
    if (!seleccion.includes(f.id) || !f.base) continue;
    const k = f.base.nombre.toLowerCase();
    if (!vistas.has(k)) {
      vistas.set(k, { nombre: f.base.nombre, motor: f.base.motor, existe: f.baseExiste });
    }
  }
  return [...vistas.values()];
}

export interface FormOrigen {
  puerto: string;
  usuario: string;
  clave: string;
}

/** Puerto y usuario válidos del servidor de origen, o null. La clave puede ir vacía. */
export function origenValido(f: FormOrigen): { puerto: number; usuario: string } | null {
  const puerto = /^\d{1,5}$/.test(f.puerto.trim()) ? Number(f.puerto.trim()) : NaN;
  const usuario = f.usuario.trim();
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) return null;
  if (usuario === '' || usuario.length > 64) return null;
  return { puerto, usuario };
}

/**
 * Lo que se manda al proceso principal. Sin bases, no hay datos de origen ni servidor de destino.
 * Solo se reemplazan las bases marcadas que existen (y que siguen entre las elegidas).
 */
export function opcionesDeEjecucion(o: {
  conBases: boolean;
  destino: ObjetivoSqlIpc | null;
  origen: FormOrigen;
  reemplazar: readonly string[];
  bases: readonly BaseElegida[];
}): Omit<OpcionesImportar, 'instancia'> & { instancia?: ObjetivoSqlIpc } {
  const origen = origenValido(o.origen);
  if (!o.conBases || o.bases.length === 0 || !o.destino || !origen) return {};
  const marcadas = new Set(o.reemplazar.map((n) => n.toLowerCase()));
  return {
    instancia: o.destino,
    origenBd: {
      host: '127.0.0.1',
      puerto: origen.puerto,
      usuario: origen.usuario,
      clave: o.origen.clave,
    },
    reemplazar: o.bases
      .filter((b) => b.existe === true && marcadas.has(b.nombre.toLowerCase()))
      .map((b) => b.nombre),
  };
}

export function resumenResultado(r: ResultadoImportar): {
  sitios: number;
  sitiosFallo: number;
  bases: number;
  basesFallo: number;
} {
  return {
    sitios: r.sitios.filter((s) => s.ok).length,
    sitiosFallo: r.sitios.filter((s) => !s.ok).length,
    bases: r.bases.filter((b) => b.ok).length,
    basesFallo: r.bases.filter((b) => !b.ok).length,
  };
}
