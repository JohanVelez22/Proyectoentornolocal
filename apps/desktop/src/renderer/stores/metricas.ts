import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import type { MuestraSistema, PuertoEnUso } from '../../shared/api';
import { api } from '../api';
import {
  agregarMuestra,
  crearMuestreo,
  type ControlMuestreo,
  type DocumentoVisible,
} from '../utilidades/metricas';

/** Cada cuánto se revisan los puertos en uso mientras el panel está abierto y visible. */
export const INTERVALO_PUERTOS_MS = 30_000;

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
        errorMuestreo.value = e instanceof Error && e.message ? e.message : String(e);
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
    entrar,
    salir,
    cargarPuertos,
    recibir,
  };
});
