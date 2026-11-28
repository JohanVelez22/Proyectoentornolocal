import { defineStore } from 'pinia';
import { computed } from 'vue';
import { calcularAlertas } from '../utilidades/metricas';
import { calcularProblemas } from '../utilidades/problemas';
import { useMetricas } from './metricas';
import { useServicios } from './servicios';

/**
 * Fuente única de los problemas detectados (D54c): el bloque de Inicio, la pastilla de la
 * cabecera y la campana leen de aquí, con la misma lista y la misma cuenta.
 */
export const useProblemas = defineStore('problemas', () => {
  const metricas = useMetricas();
  const servicios = useServicios();

  const alertas = computed(() =>
    calcularAlertas({
      muestra: metricas.ultima,
      puertos: metricas.puertos,
      // Servicios y procesos de proyecto (su puerto ocupado también es un problema), sin el Nginx
      // sin instalar: ese no es nada y daría un aviso falso.
      servicios: servicios.vigilados,
    }),
  );
  const lista = computed(() =>
    calcularProblemas({
      errorMuestreo: metricas.errorMuestreo,
      errorPuertos: metricas.errorPuertos,
      alertas: alertas.value,
    }),
  );
  const total = computed(() => lista.value.length);
  const hayError = computed(() => lista.value.some((p) => p.tipo === 'error'));

  return { alertas, lista, total, hayError };
});
