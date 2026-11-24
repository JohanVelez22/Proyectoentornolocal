import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  ConfigProveedorIa,
  EstadoClaveIa,
  ModeloIa,
  ModeloOllama,
  ProgresoIa,
  ProveedorIaPublico,
} from '../../shared/api';
import { api } from '../api';
import { mensajeDeError, traducirError } from '../utilidades/errores';

const esCancelacion = (e: unknown): boolean =>
  (e as { codigo?: unknown } | null)?.codigo === 'cancelado';

export type FaseIa = 'preparando' | 'descargando' | 'verificando' | 'guardando' | 'listo';

/** Traduce el `status` en inglés que manda Ollama a una fase que la interfaz sabe nombrar. */
export function faseDe(estado: string): FaseIa {
  const e = estado.toLowerCase();
  if (e === 'success') return 'listo';
  if (e.startsWith('pulling manifest')) return 'preparando';
  if (e.startsWith('verifying')) return 'verificando';
  if (e.startsWith('writing') || e.startsWith('removing')) return 'guardando';
  return 'descargando';
}

/** 0–100, o null mientras Ollama no informa el total. */
export function porcentaje(p: { completado: number; total: number }): number | null {
  if (!(p.total > 0)) return null;
  return Math.min(100, Math.round((p.completado / p.total) * 100));
}

export type EstadoDescarga = 'descargando' | 'cancelando' | 'listo' | 'cancelado' | 'error';

export interface DescargaIa {
  /** Nombre tal como lo escribió el usuario. */
  modelo: string;
  estado: EstadoDescarga;
  fase: FaseIa;
  completado: number;
  total: number;
  error?: string;
}

/** Resultado de "Probar conexión" de un proveedor en la nube. */
export type EstadoPruebaIa =
  | { estado: 'probando' }
  | { estado: 'ok'; latenciaMs: number; modelos: ModeloIa[]; modelosGratis: string[] }
  | { estado: 'error'; error: string; codigo?: string; latenciaMs?: number };

/** Resultado de "Probar un mensaje" (16 tokens como mucho). */
export type EstadoMensajeIa =
  | { estado: 'enviando' }
  | {
      estado: 'ok';
      texto: string;
      latenciaMs: number;
      tokens?: { entrada: number; salida: number };
    }
  | { estado: 'error'; error: string; codigo?: string };

const codigoDe = (e: unknown): string | undefined => {
  const c = (e as { codigo?: unknown } | null)?.codigo;
  return typeof c === 'string' ? c : undefined;
};

const EN_CURSO: readonly EstadoDescarga[] = ['descargando', 'cancelando'];
const clave = (nombre: string): string => nombre.trim().toLowerCase();

export const useIa = defineStore('ia', () => {
  const modelos = ref<ModeloOllama[] | null>(null);
  const cargandoModelos = ref(false);
  const errorModelos = ref<string | null>(null);
  const espacio = ref<number | null>(null);
  const sugeridos = ref<string[]>([]);
  /** Descargas por nombre de modelo en minúsculas (las terminadas quedan hasta descartarlas). */
  const descargas = ref<Record<string, DescargaIa>>({});
  let baja: (() => void) | null = null;

  // ---- IA en la nube: la clave nunca se guarda aquí (va directo al proceso principal) ----
  const proveedores = ref<ProveedorIaPublico[] | null>(null);
  const errorProveedores = ref<string | null>(null);
  const pruebas = ref<Record<string, EstadoPruebaIa>>({});
  const mensajes = ref<Record<string, EstadoMensajeIa>>({});
  /** Turno de la última prueba y del último mensaje por proveedor (lo viejo no pisa lo nuevo). */
  const turnos = new Map<string, number>();
  const turno = (k: string): number => {
    const n = (turnos.get(k) ?? 0) + 1;
    turnos.set(k, n);
    return n;
  };
  const vigente = (k: string, n: number): boolean => turnos.get(k) === n;

  const activas = computed(() =>
    Object.values(descargas.value).filter((d) => EN_CURSO.includes(d.estado)),
  );

  function enCurso(nombre: string): boolean {
    const d = descargas.value[clave(nombre)];
    return !!d && EN_CURSO.includes(d.estado);
  }

  function poner(nombre: string, cambios: Partial<DescargaIa>): void {
    const k = clave(nombre);
    const previa = descargas.value[k];
    const base: DescargaIa = previa ?? {
      modelo: nombre.trim(),
      estado: 'descargando',
      fase: 'preparando',
      completado: 0,
      total: 0,
    };
    descargas.value = { ...descargas.value, [k]: { ...base, ...cambios } };
  }

  /** Avance de `ia:progreso`. Un evento tardío no revive una descarga ya terminada o cancelada. */
  function aplicarProgreso(p: ProgresoIa): void {
    const previa = descargas.value[clave(p.modelo)];
    if (previa && !EN_CURSO.includes(previa.estado)) return;
    poner(p.modelo, {
      fase: faseDe(p.estado),
      // Ollama manda una capa a la vez; con total 0 se conserva lo último conocido.
      ...(p.total > 0 ? { completado: p.completado, total: p.total } : {}),
    });
  }

  async function cargarModelos(): Promise<void> {
    cargandoModelos.value = true;
    try {
      modelos.value = await api().ia.modelos();
      errorModelos.value = null;
    } catch (e) {
      modelos.value = null;
      errorModelos.value = mensajeDeError(e);
    } finally {
      cargandoModelos.value = false;
    }
  }

  async function cargarEspacio(): Promise<void> {
    try {
      espacio.value = await api().ia.espacioUsado();
    } catch {
      espacio.value = null;
    }
  }

  async function cargarSugeridos(): Promise<void> {
    if (sugeridos.value.length) return;
    try {
      sugeridos.value = await api().ia.sugeridos();
    } catch {
      sugeridos.value = [];
    }
  }

  /**
   * Descarga un modelo. Nunca lanza: el resultado queda en `descargas` (listo, cancelado o error).
   * Una segunda llamada con el mismo modelo en curso no hace nada.
   */
  async function descargar(nombre: string): Promise<void> {
    const n = nombre.trim();
    if (!n || enCurso(n)) return;
    descargas.value = {
      ...descargas.value,
      [clave(n)]: { modelo: n, estado: 'descargando', fase: 'preparando', completado: 0, total: 0 },
    };
    try {
      await api().ia.descargar(n);
      poner(n, { estado: 'listo', fase: 'listo' });
      await Promise.all([cargarModelos(), cargarEspacio()]);
    } catch (e) {
      const cancelando = descargas.value[clave(n)]?.estado === 'cancelando';
      if (cancelando || esCancelacion(e)) {
        const { error: _sinError, ...resto } = descargas.value[clave(n)] ?? {
          modelo: n,
          fase: 'preparando' as const,
          completado: 0,
          total: 0,
        };
        void _sinError;
        descargas.value = { ...descargas.value, [clave(n)]: { ...resto, estado: 'cancelado' } };
      } else {
        poner(n, { estado: 'error', error: mensajeDeError(e) });
      }
      // Lo descargado a medias también ocupa disco.
      void cargarEspacio();
    }
  }

  /** Pide cancelar; la descarga termina como "cancelada" cuando el núcleo la corta. */
  async function cancelar(nombre: string): Promise<void> {
    const d = descargas.value[clave(nombre)];
    if (!d || d.estado !== 'descargando') return;
    poner(nombre, { estado: 'cancelando' });
    try {
      const habia = await api().ia.cancelar(d.modelo);
      // El núcleo ya no la tenía (terminó justo antes): se resuelve por su propia promesa.
      if (!habia && descargas.value[clave(nombre)]?.estado === 'cancelando') {
        poner(nombre, { estado: 'descargando' });
      }
    } catch (e) {
      if (descargas.value[clave(nombre)]?.estado === 'cancelando') {
        poner(nombre, { estado: 'descargando' });
      }
      throw e;
    }
  }

  /** Quita el aviso de una descarga terminada (lista, cancelada o con error). */
  function descartar(nombre: string): void {
    const k = clave(nombre);
    const d = descargas.value[k];
    if (!d || EN_CURSO.includes(d.estado)) return;
    const copia = { ...descargas.value };
    delete copia[k];
    descargas.value = copia;
  }

  async function borrar(nombre: string): Promise<void> {
    await api().ia.borrar(nombre);
    await Promise.all([cargarModelos(), cargarEspacio()]);
  }

  function probar(nombre: string, texto: string): Promise<string> {
    return api().ia.probar(nombre, texto);
  }

  async function cargarProveedores(): Promise<void> {
    try {
      proveedores.value = await api().ia.proveedores();
      errorProveedores.value = null;
    } catch (e) {
      errorProveedores.value = mensajeDeError(e);
    }
  }

  function olvidarResultados(id: string): void {
    turno(`p:${id}`);
    turno(`m:${id}`);
    const { [id]: _p, ...restoP } = pruebas.value;
    const { [id]: _m, ...restoM } = mensajes.value;
    void _p;
    void _m;
    pruebas.value = restoP;
    mensajes.value = restoM;
  }

  /** Lanza el error del IPC (p. ej. `ia.url_cambia_con_clave`: la vista pide confirmación). */
  async function guardarProveedor(c: ConfigProveedorIa, confirmarCambioUrl?: true): Promise<void> {
    const previo = proveedores.value?.find((p) => p.id === c.id);
    proveedores.value = await api().ia.guardarProveedor(c, confirmarCambioUrl);
    if (previo && (previo.urlBase !== c.urlBase || previo.tipo !== c.tipo)) {
      olvidarResultados(c.id);
    }
  }

  async function borrarProveedor(id: string, limpiarRespaldos: boolean): Promise<void> {
    await api().ia.borrarProveedor(id, limpiarRespaldos ? { limpiarRespaldos: true } : undefined);
    olvidarResultados(id);
    await cargarProveedores();
  }

  function ponerClave(id: string, clave: EstadoClaveIa): void {
    if (!proveedores.value) return;
    proveedores.value = proveedores.value.map((p) => (p.id === id ? { ...p, clave } : p));
  }

  /** La clave pasa directo al IPC; aquí solo queda `{configurada, final}`. */
  async function guardarClave(id: string, clave: string): Promise<EstadoClaveIa> {
    const estado = await api().ia.guardarClave(id, clave);
    ponerClave(id, estado);
    olvidarResultados(id);
    return estado;
  }

  /** Devuelve cuántos sitios quedaron sin copias del .env con la clave. */
  async function borrarClave(id: string, limpiarRespaldos: boolean): Promise<number> {
    const r = await api().ia.borrarClave(
      id,
      limpiarRespaldos ? { limpiarRespaldos: true } : undefined,
    );
    ponerClave(id, { configurada: false, final: null });
    olvidarResultados(id);
    return r.sitiosLimpios;
  }

  /** Lista los modelos del proveedor (gratis). Nunca lanza: el resultado queda en `pruebas`. */
  async function probarConexion(id: string): Promise<void> {
    const n = turno(`p:${id}`);
    pruebas.value = { ...pruebas.value, [id]: { estado: 'probando' } };
    let r: EstadoPruebaIa;
    try {
      const x = await api().ia.probarConexion(id);
      r = x.ok
        ? {
            estado: 'ok',
            latenciaMs: x.latenciaMs,
            modelos: x.modelos,
            modelosGratis: x.modelosGratis ?? [],
          }
        : {
            estado: 'error',
            latenciaMs: x.latenciaMs,
            error: traducirError({
              codigo: x.error?.codigo ?? 'ia.respuesta_rara',
              ...(x.error?.datos ? { datos: x.error.datos } : {}),
            }),
            codigo: x.error?.codigo ?? 'ia.respuesta_rara',
          };
    } catch (e) {
      const codigo = codigoDe(e);
      r = { estado: 'error', error: mensajeDeError(e), ...(codigo ? { codigo } : {}) };
    }
    if (vigente(`p:${id}`, n)) pruebas.value = { ...pruebas.value, [id]: r };
  }

  /**
   * Mensaje de prueba (gasta tokens). Solo se llama tras el diálogo de costo: manda la
   * confirmación explícita que exige el proceso principal. Nunca lanza.
   */
  async function probarMensaje(id: string, modelo: string): Promise<void> {
    const n = turno(`m:${id}`);
    mensajes.value = { ...mensajes.value, [id]: { estado: 'enviando' } };
    let r: EstadoMensajeIa;
    try {
      const x = await api().ia.probarMensaje(id, modelo, true);
      r = {
        estado: 'ok',
        texto: x.texto,
        latenciaMs: x.latenciaMs,
        ...(x.tokens ? { tokens: x.tokens } : {}),
      };
    } catch (e) {
      const codigo = codigoDe(e);
      r = { estado: 'error', error: mensajeDeError(e), ...(codigo ? { codigo } : {}) };
    }
    if (vigente(`m:${id}`, n)) mensajes.value = { ...mensajes.value, [id]: r };
  }

  /** Ids de los modelos que listó la última prueba correcta. */
  function modelosDe(id: string): string[] {
    const p = pruebas.value[id];
    return p?.estado === 'ok' ? p.modelos.map((m) => m.id) : [];
  }

  /** Ids de los modelos gratuitos de la última prueba correcta. */
  function modelosGratisDe(id: string): string[] {
    const p = pruebas.value[id];
    return p?.estado === 'ok' ? p.modelosGratis : [];
  }

  /** Se suscribe una sola vez: el progreso sigue llegando aunque se cambie de pantalla. */
  function iniciar(): void {
    if (baja) return;
    baja = api().on('ia:progreso', aplicarProgreso);
  }

  function detener(): void {
    baja?.();
    baja = null;
  }

  return {
    modelos,
    cargandoModelos,
    errorModelos,
    espacio,
    sugeridos,
    descargas,
    activas,
    enCurso,
    aplicarProgreso,
    cargarModelos,
    cargarEspacio,
    cargarSugeridos,
    descargar,
    cancelar,
    descartar,
    borrar,
    probar,
    iniciar,
    detener,
    proveedores,
    errorProveedores,
    pruebas,
    mensajes,
    cargarProveedores,
    guardarProveedor,
    borrarProveedor,
    guardarClave,
    borrarClave,
    probarConexion,
    probarMensaje,
    modelosDe,
    modelosGratisDe,
  };
});
