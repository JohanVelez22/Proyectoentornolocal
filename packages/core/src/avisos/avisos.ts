import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Eventos, EventosNucleo } from '../eventos';
import { separarIdSupervisor } from '../proyectos/procesos';
import { sanear } from '../proyectos/recetas';

import { TIPOS_AVISO, type TipoAviso } from './tipos';

export { TIPOS_AVISO, type TipoAviso };

export type NivelAviso = 'info' | 'aviso' | 'error';

/** Datos de un aviso: solo texto corto y números (nunca rutas, secretos ni salidas de logs). */
export type DatosAviso = Record<string, string | number>;

export interface AccionAviso {
  /** Nombre de la pantalla (o acción dotada, p. ej. `servicios.versiones`) a la que lleva el aviso. */
  ruta: string;
  args?: unknown[];
  /** Elemento al que la pantalla hace scroll y resalta (`servicio:<id>`, `sitio:<id>`…). */
  foco?: string;
}

export interface Aviso {
  id: string;
  nivel: NivelAviso;
  tipo: TipoAviso;
  /** Código traducible en la interfaz (`avisos.<código>`); sin texto en el núcleo. */
  codigo: string;
  datos: DatosAviso;
  fecha: string;
  leido: boolean;
  accion?: AccionAviso;
}

export type EntradaAviso = Omit<Aviso, 'id' | 'fecha' | 'leido'>;

/** Parte de `Config.avisos` que usa el centro (sin importar `tipos.ts`: evita un ciclo). */
export interface ConfigAvisos {
  nativas: boolean;
  tipos: Record<TipoAviso, boolean>;
}

const MAX_HISTORIAL = 200;
/** Mismo tipo y fuente: un solo aviso en esta ventana. */
const VENTANA_AGRUPAR_MS = 5 * 60_000;
const MAX_TEXTO = 200;
/** Días de antelación con los que se avisa del vencimiento de la CA y de los certificados. */
export const DIAS_AVISO_VENCIMIENTO = 30;

export interface DepsCentroAvisos {
  /** `run/avisos.json`. */
  archivo: string;
  /** Se llama con cada aviso publicado (el núcleo lo emite como `aviso:nuevo`). */
  emitir: (a: Aviso) => void;
  ahora?: () => Date;
}

const NIVELES: readonly NivelAviso[] = ['info', 'aviso', 'error'];

function datosSeguros(d: unknown): DatosAviso {
  const res: DatosAviso = {};
  if (typeof d !== 'object' || d === null) return res;
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === 'number' && Number.isFinite(v)) res[k] = v;
    else if (typeof v === 'string') {
      const t = sanear(v);
      res[k] = t.length > MAX_TEXTO ? t.slice(0, MAX_TEXTO) + '…' : t;
    }
  }
  return res;
}

/** Foco de un proceso de proyecto (`proceso:<sitio>:<proceso>`); sin proceso reconocible, el sitio. */
function focoProceso(idSupervisor: string, sitioId: string): string {
  const p = separarIdSupervisor(idSupervisor);
  return p ? `proceso:${p.sitioId}:${p.procesoId}` : `sitio:${sitioId}`;
}

/** Foco de un servicio que cae: el servicio del sistema o el proceso del proyecto. */
function focoDe(id: string, proyecto: boolean): string {
  const p = proyecto ? separarIdSupervisor(id) : null;
  return p ? `proceso:${p.sitioId}:${p.procesoId}` : `servicio:${id}`;
}

/** Entrada válida del archivo, o null (un archivo editado a mano no debe romper el arranque). */
function leerAviso(x: unknown): Aviso | null {
  if (typeof x !== 'object' || x === null) return null;
  const o = x as Record<string, unknown>;
  if (typeof o['id'] !== 'string' || typeof o['fecha'] !== 'string') return null;
  if (typeof o['codigo'] !== 'string' || typeof o['leido'] !== 'boolean') return null;
  if (!NIVELES.includes(o['nivel'] as NivelAviso)) return null;
  if (!TIPOS_AVISO.includes(o['tipo'] as TipoAviso)) return null;
  const a = o['accion'] as { ruta?: unknown; args?: unknown; foco?: unknown } | undefined;
  return {
    id: o['id'],
    nivel: o['nivel'] as NivelAviso,
    tipo: o['tipo'] as TipoAviso,
    codigo: o['codigo'],
    datos: datosSeguros(o['datos']),
    fecha: o['fecha'],
    leido: o['leido'],
    ...(a && typeof a.ruta === 'string'
      ? {
          accion: {
            ruta: a.ruta,
            ...(Array.isArray(a.args) ? { args: a.args } : {}),
            ...(typeof a.foco === 'string' && a.foco.length <= MAX_TEXTO ? { foco: a.foco } : {}),
          },
        }
      : {}),
  };
}

/** Centro de avisos: historial de 200 en `run/avisos.json`, con agrupación por tipo y fuente. */
export class CentroAvisos {
  private avisos: Aviso[] = [];
  private readonly ultimoPorClave = new Map<string, number>();
  private config: ConfigAvisos | null = null;
  private cola: Promise<void> = Promise.resolve();

  constructor(private readonly d: DepsCentroAvisos) {
    try {
      const crudo = JSON.parse(readFileSync(d.archivo, 'utf8')) as unknown;
      if (Array.isArray(crudo)) {
        this.avisos = crudo
          .map(leerAviso)
          .filter((a): a is Aviso => a !== null)
          .slice(0, MAX_HISTORIAL);
      }
    } catch {
      // sin archivo o dañado: historial vacío
    }
  }

  private get ahora(): Date {
    return this.d.ahora ? this.d.ahora() : new Date();
  }

  /** Preferencias de `Config.avisos` (el núcleo las vuelve a fijar al cambiarlas). */
  fijarConfig(c: ConfigAvisos): void {
    this.config = c;
  }

  /** ¿Se debe mostrar una notificación nativa para este tipo? */
  nativaPermitida(tipo: TipoAviso): boolean {
    return this.config === null || (this.config.nativas && this.config.tipos[tipo] !== false);
  }

  /**
   * Agrega un aviso. Devuelve null si no se publica: el tipo está desactivado o el mismo tipo y
   * fuente (`datos.fuente`) ya avisaron hace menos de 5 minutos.
   */
  publicar(a: EntradaAviso): Aviso | null {
    if (this.config && this.config.tipos[a.tipo] === false) return null;
    const ahora = this.ahora.getTime();
    const clave = `${a.tipo}|${String(a.datos['fuente'] ?? '')}`;
    const previo = this.ultimoPorClave.get(clave);
    if (previo !== undefined && ahora - previo < VENTANA_AGRUPAR_MS) return null;
    this.ultimoPorClave.set(clave, ahora);
    const aviso: Aviso = {
      id: randomUUID(),
      nivel: a.nivel,
      tipo: a.tipo,
      codigo: a.codigo,
      datos: datosSeguros(a.datos),
      fecha: this.ahora.toISOString(),
      leido: false,
      ...(a.accion ? { accion: a.accion } : {}),
    };
    this.avisos.unshift(aviso);
    if (this.avisos.length > MAX_HISTORIAL) this.avisos.length = MAX_HISTORIAL;
    this.guardar();
    try {
      this.d.emitir({ ...aviso });
    } catch (e) {
      console.error('Error al emitir un aviso:', e);
    }
    return aviso;
  }

  /** Los más nuevos primero. */
  lista(): Aviso[] {
    return this.avisos.map((a) => ({ ...a }));
  }

  /** Sin ids marca todos. */
  marcarLeidos(ids?: string[]): void {
    const set = ids ? new Set(ids) : null;
    let cambio = false;
    for (const a of this.avisos) {
      if (!a.leido && (!set || set.has(a.id))) {
        a.leido = true;
        cambio = true;
      }
    }
    if (cambio) this.guardar();
  }

  limpiar(): void {
    this.avisos = [];
    this.guardar();
  }

  /** Resuelve cuando lo pendiente ya está escrito en disco. */
  guardado(): Promise<void> {
    return this.cola;
  }

  private guardar(): void {
    const texto = JSON.stringify(this.avisos);
    this.cola = this.cola
      .then(async () => {
        await mkdir(path.dirname(this.d.archivo), { recursive: true });
        const tmp = `${this.d.archivo}.tmp`;
        await writeFile(tmp, texto, 'utf8');
        await rename(tmp, this.d.archivo);
      })
      .catch((e: unknown) => {
        console.error('No se pudo guardar el historial de avisos:', e);
      });
  }
}

/** Lo mínimo que las fuentes necesitan del centro. */
export interface PublicadorAvisos {
  publicar(a: EntradaAviso): unknown;
}

/**
 * Convierte los eventos del núcleo en avisos: servicio o proceso de proyecto que pasa a error, y
 * túnel que se cae. Nunca incluye el `mensaje` del estado (puede traer el final de un log).
 * Devuelve la función que deja de escuchar.
 */
export function conectarFuentesAvisos(
  eventos: Eventos<EventosNucleo>,
  centro: PublicadorAvisos,
): () => void {
  const servicios = new Map<string, string>();
  const tuneles = new Map<string, string>();
  /** Nombre legible de cada proceso de proyecto, tal como llegó en su último estado. */
  const nombres = new Map<string, string>();
  /** Procesos cuya salida ya se avisó: el estado `error` que sigue no se repite. */
  const avisados = new Set<string>();
  const bajas = [
    eventos.on('servicio:estado', (e) => {
      const previo = servicios.get(e.id);
      servicios.set(e.id, e.estado);
      const proyecto = e.categoria === 'proyecto' || e.id.startsWith('proy-');
      if (proyecto) nombres.set(e.id, e.nombre);
      if (e.estado !== 'error') avisados.delete(e.id);
      // Sin estado previo es lo que ya había al abrir la aplicación: no es una caída nueva.
      if (e.estado !== 'error' || previo === undefined || previo === 'error') return;
      if (proyecto && avisados.delete(e.id)) return;
      centro.publicar({
        nivel: 'error',
        tipo: proyecto ? 'proceso-error' : 'servicio-caido',
        codigo: proyecto ? 'avisos.proceso_error' : 'avisos.servicio_caido',
        datos: { fuente: e.id, nombre: e.nombre },
        accion: { ruta: proyecto ? 'proyectos' : 'servicios', foco: focoDe(e.id, proyecto) },
      });
    }),
    // Un proceso de proyecto que termina sin reinicio: código 0 = terminó bien, otro = falló.
    eventos.on('proceso:terminado', (e) => {
      const nombre = nombres.get(e.id);
      const base = { fuente: e.id, ...(nombre === undefined ? {} : { nombre }) };
      avisados.add(e.id);
      if (e.codigo === 0) {
        centro.publicar({
          nivel: 'info',
          tipo: 'proceso-terminado',
          codigo: 'avisos.proceso_terminado',
          datos: base,
          accion: { ruta: 'proyectos', foco: focoProceso(e.id, e.sitioId) },
        });
        return;
      }
      centro.publicar({
        nivel: 'error',
        tipo: 'proceso-error',
        codigo: 'avisos.proceso_fallo',
        datos: { ...base, ...(e.codigo === null ? {} : { codigoSalida: e.codigo }) },
        accion: { ruta: 'proyectos', foco: focoProceso(e.id, e.sitioId) },
      });
    }),
    // Una receta que llegó al final: lista o con un paso en error (cancelar no avisa).
    eventos.on('receta:terminada', (e) => {
      const bien = e.estado === 'lista';
      centro.publicar({
        nivel: bien ? 'info' : 'error',
        tipo: 'receta-terminada',
        codigo: bien ? 'avisos.receta_terminada' : 'avisos.receta_fallo',
        // Éxito y fallo no se agrupan entre sí: reintentar y que salga bien debe avisar.
        datos: { fuente: `${e.sitioId}#${e.estado}`, sitio: e.sitioId },
        accion: { ruta: 'proyectos', foco: `sitio:${e.sitioId}` },
      });
    }),
    eventos.on('tunel:estado', (e) => {
      const previo = tuneles.get(e.sitioId);
      tuneles.set(e.sitioId, e.estado);
      if (e.estado !== 'error' || (previo !== 'activo' && previo !== 'iniciando')) return;
      centro.publicar({
        nivel: 'aviso',
        tipo: 'tunel-caido',
        codigo: 'avisos.tunel_caido',
        datos: { fuente: e.sitioId },
        accion: { ruta: 'tuneles', foco: `sitio:${e.sitioId}` },
      });
    }),
  ];
  return () => bajas.forEach((b) => b());
}

/** Lo que `revisarVencimientos` pide al gestor de HTTPS. */
export interface FuenteVencimientos {
  /** `id` es `ca` o el id del certificado; `dias` es el tiempo que le queda (negativo: vencido). */
  vencimientos(): Promise<{ id: string; dias: number }[]>;
}

/**
 * Avisa de la CA y de los certificados que vencen en menos de 30 días (o ya vencieron). No repite
 * un aviso igual que sigue sin leer, para no volver a avisar en cada arranque.
 */
export async function revisarVencimientos(
  https: FuenteVencimientos,
  centro: PublicadorAvisos & { lista(): Aviso[] },
): Promise<void> {
  const pendientes = centro.lista().filter((a) => !a.leido);
  for (const v of await https.vencimientos()) {
    if (v.dias >= DIAS_AVISO_VENCIMIENTO) continue;
    const codigo =
      v.dias <= 0
        ? 'avisos.certificado_vencido'
        : v.id === 'ca'
          ? 'avisos.ca_por_vencer'
          : 'avisos.certificado_por_vencer';
    const repetido = pendientes.some(
      (a) =>
        a.tipo === 'certificado-por-vencer' && a.codigo === codigo && a.datos['fuente'] === v.id,
    );
    if (repetido) continue;
    centro.publicar({
      nivel: v.dias <= 0 ? 'error' : 'aviso',
      tipo: 'certificado-por-vencer',
      codigo,
      datos: { fuente: v.id, dias: v.dias },
      accion: { ruta: 'ajustes' },
    });
  }
}
