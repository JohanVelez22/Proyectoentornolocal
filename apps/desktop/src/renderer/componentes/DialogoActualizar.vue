<script setup lang="ts">
import { ArrowForward, Warning } from '@vicons/ionicons5';
import { NAlert, NButton, NCheckbox, NIcon, NModal, NRadio, NRadioGroup, NSpace } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { IdInstancia } from '../../shared/api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { formatearTamano } from '../utilidades/bd';
import { useVersiones, type DialogoVersiones } from '../stores/versiones';

/**
 * Confirmación de una actualización (el único camino que actualiza): versión actual y nueva, qué
 * se respalda y dónde (copia en frío y volcados), el espacio libre, y que los datos anteriores no
 * se borran. Para una rama nueva de un servicio de datos ofrece crear la instancia nueva con
 * "Copiar datos desde…". Sin huella fuerte exige marcar la casilla de riesgo.
 */
const props = defineProps<{
  dialogo: Extract<DialogoVersiones, { tipo: 'actualizar' | 'nuevaRama' }>;
  nombre: string;
}>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.versiones.dialogoActualizar;
const versiones = useVersiones();
const { ejecutar, ocupado } = useAccion();

const entiendo = ref(false);
const copiarDesde = ref<IdInstancia | 'ninguna'>('ninguna');
const resultado = ref<string | null>(null);

watch(
  () => [mostrar.value, props.dialogo] as const,
  ([v]) => {
    if (!v) return;
    entiendo.value = false;
    resultado.value = null;
    copiarDesde.value =
      props.dialogo.tipo === 'nuevaRama' ? (props.dialogo.origenes[0] ?? 'ninguna') : 'ninguna';
  },
  { immediate: true },
);

const plan = computed(() => (props.dialogo.tipo === 'actualizar' ? props.dialogo.plan : null));
const sinEspacio = computed(() => !!plan.value && plan.value.libres < plan.value.necesarios);
const puede = computed(() => (!props.dialogo.sinHuella || entiendo.value) && !sinEspacio.value);
const titulo = computed(() =>
  props.dialogo.tipo === 'nuevaRama'
    ? t.tituloRama(`${props.nombre} ${props.dialogo.nueva}`)
    : t.titulo(props.nombre),
);

async function confirmar(): Promise<void> {
  if (!puede.value) return;
  const d = props.dialogo;
  if (d.tipo === 'actualizar') {
    const ok = await ejecutar(
      'actualizar',
      async () => {
        await versiones.confirmarActualizar(entiendo.value);
        return true;
      },
      { exito: t.hecho(`${props.nombre} ${d.nueva}`), tituloError: t.fallo },
    );
    if (ok) mostrar.value = false;
    return;
  }
  const r = await ejecutar(
    'actualizar',
    () =>
      versiones.confirmarNuevaRama(
        copiarDesde.value === 'ninguna' ? null : copiarDesde.value,
        entiendo.value,
      ),
    { tituloError: t.fallo },
  );
  if (!r) return;
  // Se queda abierto para mostrar qué bases se copiaron y cuáles no.
  resultado.value = [
    t.ramaCreada(r.id),
    ...(r.restauradas.length ? [t.copiadas(r.restauradas.join(', '))] : []),
    ...r.fallidas.map((f) => t.noCopiada(f.base, f.motivo)),
    ...r.advertencias,
  ].join('\n');
}
</script>

<template>
  <NModal
    :show="mostrar"
    preset="card"
    :title="titulo"
    size="small"
    :bordered="false"
    :style="{ width: '580px', maxWidth: 'calc(100vw - 32px)' }"
    :closable="!ocupado('actualizar')"
    :mask-closable="!ocupado('actualizar')"
    @update:show="(v: boolean) => (mostrar = v)"
  >
    <pre v-if="resultado" class="resultado">{{ resultado }}</pre>
    <template v-else>
      <div class="versiones">
        <code>{{ dialogo.tipo === 'actualizar' ? (dialogo.actual ?? '—') : t.ninguna }}</code>
        <NIcon :size="16"><ArrowForward /></NIcon>
        <code class="nueva">{{ dialogo.nueva }}</code>
      </div>

      <template v-if="dialogo.tipo === 'actualizar' && dialogo.instancia">
        <p class="texto">{{ t.instancia(dialogo.instancia) }}</p>
        <ul class="pasos">
          <li>{{ t.pasoInstalar(dialogo.nueva) }}</li>
          <li v-if="plan?.volcados">{{ t.pasoVolcados }}</li>
          <li v-if="plan?.hayDatos">{{ t.pasoCopia }}</li>
          <li>{{ t.pasoArrancar }}</li>
          <li>{{ t.pasoVuelta }}</li>
        </ul>
        <div v-if="plan" class="plan">
          <div>
            <span class="etiqueta">{{ t.datos }}</span><code>{{ plan.carpeta }}</code>
            <span class="tam">{{ formatearTamano(plan.bytes) }}</span>
          </div>
          <div v-if="plan.hayDatos">
            <span class="etiqueta">{{ t.respaldo }}</span><code>{{ plan.respaldo }}</code>
          </div>
          <div>
            <span class="etiqueta">{{ t.espacio }}</span>
            <span :class="{ falta: sinEspacio }">{{
              t.espacioLibre(formatearTamano(plan.libres), formatearTamano(plan.necesarios))
            }}</span>
          </div>
        </div>
        <p class="texto nota">{{ t.datosQuedan }}</p>
        <NAlert v-if="sinEspacio" type="error" :bordered="false">{{ t.sinEspacio }}</NAlert>
      </template>

      <template v-else-if="dialogo.tipo === 'actualizar'">
        <p class="texto">{{ t.alLado(dialogo.nueva) }}</p>
      </template>

      <template v-else>
        <p class="texto">{{ t.ramaExplicacion }}</p>
        <NRadioGroup v-model:value="copiarDesde" class="origen" :aria-label="t.copiarDesdeTitulo">
          <NSpace vertical size="small">
            <NRadio v-for="o in dialogo.origenes" :key="o" :value="o">{{
              t.copiarDesde(o)
            }}</NRadio>
            <NRadio value="ninguna">{{ t.vacia }}</NRadio>
          </NSpace>
        </NRadioGroup>
        <p class="texto nota">{{ t.ramaNota }}</p>
      </template>

      <template v-if="dialogo.sinHuella">
        <NAlert type="warning" :bordered="false" class="aviso">
          <template #icon
            ><NIcon><Warning /></NIcon
          ></template>
          {{ textos.versiones.dialogoSinHuella.riesgo }}
        </NAlert>
        <NCheckbox v-model:checked="entiendo" class="casilla">{{
          textos.versiones.dialogoSinHuella.casilla
        }}</NCheckbox>
      </template>
    </template>

    <template #footer>
      <div class="pie">
        <NButton v-if="resultado" size="small" type="primary" @click="mostrar = false">
          {{ textos.acciones.cerrar }}
        </NButton>
        <template v-else>
          <NButton size="small" :disabled="ocupado('actualizar')" @click="mostrar = false">
            {{ textos.acciones.cancelar }}
          </NButton>
          <NButton
            size="small"
            type="primary"
            :disabled="!puede"
            :loading="ocupado('actualizar')"
            @click="confirmar"
          >
            {{ dialogo.tipo === 'nuevaRama' ? t.crearInstancia : t.confirmar }}
          </NButton>
        </template>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.versiones {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
}
.versiones .nueva {
  font-weight: 600;
}
.texto {
  margin: 12px 0 0;
  line-height: 1.5;
}
.nota {
  opacity: 0.75;
  font-size: 13px;
}
.pasos {
  margin: 8px 0 0;
  padding-left: 20px;
  line-height: 1.6;
}
.plan {
  margin-top: 10px;
  display: grid;
  gap: 4px;
  font-size: 13px;
}
.plan code {
  word-break: break-all;
}
.etiqueta {
  opacity: 0.75;
  margin-right: 6px;
}
.tam {
  margin-left: 6px;
  opacity: 0.75;
}
.falta {
  color: #e5484d;
  font-weight: 600;
}
.origen {
  margin-top: 10px;
}
.aviso {
  margin-top: 14px;
}
.casilla {
  margin-top: 10px;
}
.resultado {
  white-space: pre-wrap;
  font-family: var(--fuente-mono);
  font-size: 12px;
  margin: 0;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
