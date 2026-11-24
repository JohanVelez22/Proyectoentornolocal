<script setup lang="ts">
import { NAlert, NButton, NInput, NModal, NRadio, NRadioGroup, NSpace } from 'naive-ui';
import Desplegable from './Desplegable.vue';
import { computed, ref, watch } from 'vue';
import type { EstadoInstancia, RespaldoDatos } from '../../shared/api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { formatearTamano } from '../utilidades/bd';
import { useVersiones } from '../stores/versiones';

/**
 * Resolver una instancia bloqueada (una actualización no pudo devolver sus datos): devolver un
 * respaldo elegido (la carpeta actual se aparta, no se borra) o aceptar la carpeta actual tal
 * como está. Exige escribir el id de la instancia. Nunca la enciende ni inicializa nada.
 */
const props = defineProps<{
  instancia: EstadoInstancia;
  respaldos: RespaldoDatos[];
  /** Versiones instaladas de su rama (si la marca es ilegible hay que elegir a cuál volver). */
  versiones: string[];
}>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.versiones.dialogoDesbloquear;
const tienda = useVersiones();
const { ejecutar, ocupado } = useAccion();

const eleccion = ref<string>('actual');
const escrito = ref('');
const version = ref<string | null>(null);
const ilegible = computed(() => props.instancia.bloqueo?.ilegible === true);

watch(
  mostrar,
  (v) => {
    if (!v) return;
    // El respaldo que apunta el bloqueo (el de antes de esa actualización) va primero.
    const delBloqueo = /\.respaldo-(\d{8}-\d{6})$/.exec(
      props.instancia.bloqueo?.respaldo ?? '',
    )?.[1];
    eleccion.value =
      delBloqueo && props.respaldos.some((r) => r.sello === delBloqueo)
        ? delBloqueo
        : (props.respaldos.at(-1)?.sello ?? 'actual');
    escrito.value = '';
    version.value = null;
  },
  { immediate: true },
);

const puede = computed(
  () => escrito.value === props.instancia.id && (!ilegible.value || !!version.value),
);

async function resolver(): Promise<void> {
  if (!puede.value) return;
  const ok = await ejecutar(
    'resolver',
    async () => {
      await tienda.desbloquear(props.instancia.id, {
        confirmacion: escrito.value,
        ...(eleccion.value === 'actual' ? {} : { respaldo: eleccion.value }),
        ...(ilegible.value && version.value ? { version: version.value } : {}),
      });
      return true;
    },
    { exito: t.hecho(props.instancia.id) },
  );
  if (ok) mostrar.value = false;
}
</script>

<template>
  <NModal
    :show="mostrar"
    preset="card"
    :title="t.titulo(instancia.id)"
    size="small"
    :bordered="false"
    :style="{ width: '580px', maxWidth: 'calc(100vw - 32px)' }"
    @update:show="(v: boolean) => (mostrar = v)"
  >
    <NAlert type="error" :bordered="false">{{ t.explicacion }}</NAlert>
    <div v-if="instancia.bloqueo" class="rutas">
      <div>
        <span class="etiqueta">{{ t.fallida }}</span><code>{{ instancia.bloqueo.fallida }}</code>
      </div>
      <div>
        <span class="etiqueta">{{ t.respaldo }}</span><code>{{ instancia.bloqueo.respaldo }}</code>
      </div>
    </div>
    <NRadioGroup v-model:value="eleccion" class="opciones" :aria-label="t.opciones">
      <NSpace vertical size="small">
        <NRadio v-for="r in respaldos" :key="r.sello" :value="r.sello">
          {{ t.devolver(r.sello, formatearTamano(r.bytes)) }}
        </NRadio>
        <NRadio value="actual">{{ t.usarActual }}</NRadio>
      </NSpace>
    </NRadioGroup>
    <p class="texto">{{ eleccion === 'actual' ? t.notaActual : t.notaDevolver }}</p>
    <template v-if="ilegible">
      <p class="texto">{{ t.elegirVersion }}</p>
      <Desplegable
        v-model:value="version"
        size="small"
        class="version"
        :options="versiones.map((v) => ({ value: v, label: v }))"
        :aria-label="t.version"
      />
    </template>
    <NInput
      v-model:value="escrito"
      size="small"
      :placeholder="instancia.id"
      :aria-label="t.escriba(instancia.id)"
    />
    <template #footer>
      <div class="pie">
        <NButton size="small" :disabled="ocupado('resolver')" @click="mostrar = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton
          size="small"
          type="primary"
          :disabled="!puede"
          :loading="ocupado('resolver')"
          @click="resolver"
        >
          {{ t.confirmar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.rutas {
  margin-top: 10px;
  display: grid;
  gap: 4px;
  font-size: 13px;
}
.rutas code {
  word-break: break-all;
}
.etiqueta {
  opacity: 0.65;
  margin-right: 6px;
}
.opciones {
  margin-top: 12px;
}
.texto {
  margin: 10px 0;
  line-height: 1.5;
  opacity: 0.8;
  font-size: 13px;
}
.version {
  margin-bottom: 10px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
