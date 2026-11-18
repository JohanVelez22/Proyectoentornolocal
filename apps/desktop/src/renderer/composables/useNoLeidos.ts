import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { api } from '../api';
import { useServicios } from '../stores/servicios';
import { INTERVALO_NO_LEIDOS_MS } from '../utilidades/correo';
import { mensajeDeError } from './useAccion';

/**
 * Correos sin leer de Mailpit. Se cuentan al montar y cada 15 s, solo mientras Mailpit está
 * encendido y la ventana está visible; al desmontar el componente se deja de preguntar.
 */
export function useNoLeidos() {
  const servicios = useServicios();
  const noLeidos = ref<number | null>(null);
  const error = ref<string | null>(null);
  const cargando = ref(false);
  const encendido = computed(() => servicios.porId['mailpit']?.estado === 'encendido');
  let temporizador: ReturnType<typeof setInterval> | null = null;
  let montado = false;

  async function actualizar(): Promise<void> {
    if (!encendido.value || cargando.value) return;
    cargando.value = true;
    try {
      noLeidos.value = await api().mailpit.noLeidos();
      error.value = null;
    } catch (e) {
      error.value = mensajeDeError(e);
    } finally {
      cargando.value = false;
    }
  }

  function parar(): void {
    if (temporizador) clearInterval(temporizador);
    temporizador = null;
  }

  function programar(): void {
    parar();
    if (montado && encendido.value && document.visibilityState === 'visible') {
      temporizador = setInterval(() => void actualizar(), INTERVALO_NO_LEIDOS_MS);
    }
  }

  function alCambiarVisibilidad(): void {
    if (document.visibilityState === 'visible') void actualizar();
    programar();
  }

  watch(encendido, (v) => {
    if (!montado) return;
    if (v) void actualizar();
    else {
      noLeidos.value = null;
      error.value = null;
    }
    programar();
  });

  onMounted(() => {
    montado = true;
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    void actualizar();
    programar();
  });

  onBeforeUnmount(() => {
    montado = false;
    document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    parar();
  });

  return { noLeidos, error, cargando, encendido, actualizar };
}
