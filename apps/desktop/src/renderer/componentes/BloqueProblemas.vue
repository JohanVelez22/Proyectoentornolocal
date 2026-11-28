<script setup lang="ts">
import { EllipsisHorizontal, Warning } from '@vicons/ionicons5';
import { NButton, NIcon, useDialog } from 'naive-ui';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';
import { useMetricas } from '../stores/metricas';
import { useProblemas } from '../stores/problemas';
import { agruparAvisos } from '../utilidades/avisosInicio';
import type { AlertaPanel } from '../utilidades/metricas';
import MenuDesplegable from './MenuDesplegable.vue';

/**
 * «Problemas detectados» de Inicio, en su propio bloque bajo las métricas y antes de Rendimiento
 * (D54c). La lista sale del almacén compartido con la pastilla y la campana.
 */
const t = textos.panel;
const metricas = useMetricas();
const problemas = useProblemas();
const dialog = useDialog();
const { ejecutar } = useAccion();
const router = useRouter();

/** Abre Herramientas → Puertos en uso (para ver quién ocupa un puerto). */
function verPuertos(): void {
  solicitudes.herramienta = 'puertos';
  void router.push({ name: 'herramientas' });
}

const desplegado = ref(false);
const grupo = computed(() => agruparAvisos(problemas.lista, desplegado.value));
/** «Finalizar proceso» ya no es un botón rojo suelto: queda en un menú secundario. */
const opcionesFila = [{ label: t.alertas.finalizar, key: 'finalizar' }];

function finalizar(a: AlertaPanel): void {
  const p = a.proceso;
  if (!p) return;
  dialog.warning({
    title: t.alertas.finalizarTitulo,
    content: t.alertas.finalizarTexto(p.nombre, p.pid),
    positiveText: t.alertas.finalizar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: async () => {
      const r = await ejecutar(
        `finalizar-${p.pid}`,
        () => api().herramientas.finalizarProceso(p.pid, p.nombre, { creado: p.creado }),
        { exito: t.alertas.finalizado(p.nombre) },
      );
      if (r) await metricas.cargarPuertos();
    },
  });
}
</script>

<template>
  <section
    v-if="problemas.total"
    class="problemas"
    :class="{ 'con-error': problemas.hayError }"
    :aria-label="t.alertas.grupo(grupo.total)"
  >
    <header class="problemas-cabeza">
      <NIcon :size="18" aria-hidden="true"><Warning /></NIcon>
      <h3>{{ t.alertas.grupo(grupo.total) }}</h3>
      <NButton
        v-if="grupo.plegable"
        size="small"
        text
        type="primary"
        :aria-expanded="desplegado"
        @click="desplegado = !desplegado"
      >
        {{ desplegado ? t.alertas.verMenos : t.alertas.verTodos(grupo.total) }}
      </NButton>
    </header>
    <ul class="problemas-lista">
      <li v-for="p in grupo.visibles" :key="p.clave" class="problema">
        <span class="problema-texto">{{ p.texto }}</span>
        <span class="alerta-botones">
          <NButton v-if="p.alerta" size="small" quaternary @click="verPuertos">
            {{ t.alertas.verPuertos }}
          </NButton>
          <MenuDesplegable
            v-if="p.alerta?.proceso"
            alinear-fin
            trigger="click"
            :options="opcionesFila"
            @select="() => p.alerta && finalizar(p.alerta)"
          >
            <NButton size="small" quaternary :aria-label="t.alertas.masAcciones">
              <template #icon
                ><NIcon><EllipsisHorizontal /></NIcon
              ></template>
            </NButton>
          </MenuDesplegable>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.problemas {
  margin-bottom: var(--wc-esp-4);
  padding: var(--wc-esp-2) var(--wc-esp-4);
  border-radius: var(--wc-radio-md);
  border-left: 3px solid var(--acento);
  background: rgba(var(--acento-rgb), 0.08);
}
.problemas.con-error {
  border-left-color: var(--texto-error);
  background: rgba(220, 38, 38, 0.08);
}
.problemas-cabeza {
  display: flex;
  align-items: center;
  gap: var(--wc-esp-2);
  min-height: 36px;
}
.problemas-cabeza h3 {
  flex: 1;
  margin: 0;
  font-size: var(--wc-texto-sm);
  font-weight: 600;
}
.problemas-lista {
  list-style: none;
  margin: 0;
  padding: 0;
}
.problema {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wc-esp-3);
  min-height: 40px;
  border-top: 1px solid rgba(128, 128, 128, 0.16);
  font-size: var(--wc-texto-sm);
}
.problema-texto {
  flex: 1;
  min-width: 0;
}
.alerta-botones {
  display: inline-flex;
  gap: 6px;
  flex: none;
}
</style>
