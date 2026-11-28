import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import type { MuestraSistema, PuertoEnUso, UnidadDisco } from '../../shared/api';
import { mensajeDeError } from '../utilidades/errores';
import { api } from '../api';
import {
  agregarMuestra,
  crearMuestreo,
  type ControlMuestreo,
  type DocumentoVisible,
} from '../utilidades/metricas';

/** Cada cuánto se revisan los puertos en uso mientras el panel está abierto y visible. */
export const INTERVALO_PUERTOS_MS = 30_000;

/** Las unidades se piden con una consulta al sistema: se conservan 5 minutos. */
export const CADUCIDAD_UNIDADES_MS = 5 * 60_000;

/**
 * Métricas del panel de Inicio. El muestreo corre solo mientras la pantalla está abierta y la
 * ventana visible (`entrar`/`salir`); el proceso principal además lo pausa con la ventana oculta.
 */
export const useMetricas = defineStore('metricas', () => {
  const serie = shallowRef<MuestraSistema[]>([]);
  const puertos = shallowRef<PuertoEnUso[]>([]);
  const errorPuertos = ref(false);
  const muestreando = ref(false);
  /** Por qué no se pudo empezar o pausar el muestreo (se borra al lograrlo). */
  const errorMuestreo = ref<string | null>(null);
  const ultima = computed(() => serie.value[serie.value.length - 1] ?? null);

  /** Unidades de disco y carpeta de datos: caché del almacén, con su caducidad (D54d). */
  const unidades = shallowRef<UnidadDisco[]>([]);
  const carpetaDatos = ref<string | null>(null);
  const unidadesLeidas = ref(false);
  let unidadesAl = 0;
  let unidadesEnCurso: Promise<void> | null = null;

  let control: ControlMuestreo | null = null;
  let baja: (() => void) | null = null;
  let temporizador: ReturnType<typeof setInterval> | null = null;
  let documento: DocumentoVisible | null = null;
  let alVisibilidad: (() => void) | null = null;

  function recibir(m: MuestraSistema): void {
    serie.value = agregarMuestra(serie.value, m);
  }

  async function cargarPuertos(): Promise<void> {
    try {
      puertos.value = await api().herramientas.puertos();
      errorPuertos.value = false;
    } catch {
      errorPuertos.value = true;
    }
  }

  /**
   * Lee las unidades y la carpeta de datos una sola vez para quien las pida: una consulta en curso
   * se comparte y una lectura fresca (menos de 5 min) se reutiliza. `forzar` la salta. Cada lectura
   * por su lado: si una falla, la otra sigue valiendo y no se da el fallo por bueno (se reintenta).
   */
  function cargarUnidades(opciones: { forzar?: boolean } = {}): Promise<void> {
    if (unidadesEnCurso) return unidadesEnCurso;
    if (!opciones.forzar && unidadesAl && Date.now() - unidadesAl < CADUCIDAD_UNIDADES_MS)
      return Promise.resolve();
    unidadesEnCurso = (async () => {
      try {
        const [u, c] = await Promise.allSettled([api().discoUso.unidades(), api().carpetaDatos()]);
        if (u.status === 'fulfilled') unidades.value = u.value;
        if (c.status === 'fulfilled') carpetaDatos.value = c.value;
        unidadesAl = u.status === 'fulfilled' && c.status === 'fulfilled' ? Date.now() : 0;
      } finally {
        unidadesLeidas.value = true;
        unidadesEnCurso = null;
      }
    })();
    return unidadesEnCurso;
  }

  function programarPuertos(): void {
    const visible = !!documento && !documento.hidden && !!control;
    if (visible && !temporizador) {
      void cargarPuertos();
      temporizador = setInterval(() => void cargarPuertos(), INTERVALO_PUERTOS_MS);
    } else if (!visible && temporizador) {
      clearInterval(temporizador);
      temporizador = null;
    }
  }

  /** Al entrar en Inicio: historial de 5 minutos, eventos y muestreo. */
  function entrar(doc: DocumentoVisible = document): void {
    if (control) return;
    documento = doc;
    baja = api().on('metricas:muestra', recibir);
    control = crearMuestreo({
      iniciar: async () => {
        await api().metricas.iniciar();
        errorMuestreo.value = null;
      },
      pausar: () => api().metricas.pausar(),
      documento: doc,
      alError: (e) => {
        errorMuestreo.value = mensajeDeError(e);
      },
    });
    alVisibilidad = () => {
      muestreando.value = control?.activo ?? false;
      programarPuertos();
    };
    control.entrar();
    doc.addEventListener('visibilitychange', alVisibilidad);
    alVisibilidad();
    void api()
      .metricas.ultimos(5)
      .then((ms) => {
        // Las que llegaron por evento mientras tanto son más nuevas: se suman detrás.
        let s: MuestraSistema[] = [];
        for (const m of [...ms, ...serie.value]) s = agregarMuestra(s, m);
        serie.value = s;
      })
      .catch(() => undefined);
  }

  /** Al salir de Inicio: pausa el muestreo y suelta los oyentes. */
  function salir(): void {
    if (!control) return;
    control.salir();
    control = null;
    if (documento && alVisibilidad)
      documento.removeEventListener('visibilitychange', alVisibilidad);
    alVisibilidad = null;
    programarPuertos();
    documento = null;
    baja?.();
    baja = null;
    muestreando.value = false;
  }

  return {
    serie,
    ultima,
    puertos,
    errorPuertos,
    muestreando,
    errorMuestreo,
    unidades,
    carpetaDatos,
    unidadesLeidas,
    cargarUnidades,
    entrar,
    salir,
    cargarPuertos,
    recibir,
  };
});
