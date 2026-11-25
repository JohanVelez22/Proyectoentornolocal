<script setup lang="ts">
import { NAlert, NButton, NCheckbox, NInput, NModal, NSpin, useMessage } from 'naive-ui';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Sitio, VistaPreviaPlantilla } from '../../shared/api';
import { api, plano } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { tamanoLegible } from '../utilidades/herramientas';

/**
 * "Guardar como plantilla": nombre, si lleva los archivos del proyecto y qué más excluir. Muestra
 * antes lo que entraría (y lo que se deja fuera). La plantilla nunca lleva secretos ni filas de
 * la base: el núcleo lo garantiza; aquí solo se explica.
 */
const props = defineProps<{ sitio: Sitio | null }>();
const emit = defineEmits<{ cerrar: [] }>();

const t = textos.plantillas.dialogo;
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const nombre = ref('');
const conArchivos = ref(true);
const extraTexto = ref('');
const vista = ref<VistaPreviaPlantilla | null>(null);
const errorVista = ref<string | null>(null);
const calculando = ref(false);

const extras = computed(() =>
  extraTexto.value
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean),
);
const puedeGuardar = computed(() => nombre.value.trim() !== '' && !calculando.value);

let temporizador: ReturnType<typeof setTimeout> | null = null;
let contador = 0;

async function calcular(): Promise<void> {
  const sitio = props.sitio;
  if (!sitio) return;
  const mio = ++contador;
  calculando.value = true;
  try {
    const r = await api().plantillas.vistaPrevia(
      sitio.id,
      plano({ conArchivos: conArchivos.value, excluirExtra: extras.value }),
    );
    if (mio !== contador) return;
    vista.value = r;
    errorVista.value = null;
  } catch (e) {
    if (mio !== contador) return;
    vista.value = null;
    errorVista.value = mensajeDeError(e);
  } finally {
    if (mio === contador) calculando.value = false;
  }
}

function programar(): void {
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(() => void calcular(), 300);
}

watch(
  () => props.sitio,
  (s) => {
    if (!s) return;
    nombre.value = s.nombre || s.dominio.replace(/\.test$/, '');
    conArchivos.value = true;
    extraTexto.value = '';
    vista.value = null;
    errorVista.value = null;
    void calcular();
  },
  { immediate: true },
);
watch(extras, programar);
onBeforeUnmount(() => {
  if (temporizador) clearTimeout(temporizador);
});

async function guardar(): Promise<void> {
  const sitio = props.sitio;
  if (!sitio || !puedeGuardar.value) return;
  const r = await ejecutar(
    'guardar',
    () =>
      api().plantillas.guardar(
        sitio.id,
        plano({
          nombre: nombre.value.trim(),
          conArchivos: conArchivos.value,
          excluirExtra: extras.value,
        }),
      ),
    { tituloError: t.errorGuardar },
  );
  if (r) {
    message.success(t.guardada(r.nombre));
    emit('cerrar');
  }
}
</script>

<template>
  <NModal
    :show="sitio !== null"
    preset="card"
    :title="sitio ? t.titulo(sitio.nombre || sitio.dominio) : ''"
    :style="{ width: '600px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="!ocupado('guardar')"
    :closable="!ocupado('guardar')"
    :auto-focus="false"
    @update:show="(v: boolean) => !v && emit('cerrar')"
  >
    <p class="intro">{{ t.intro }}</p>

    <label class="campo">
      <span>{{ t.nombre }}</span>
      <NInput
        v-model:value="nombre"
        size="small"
        maxlength="60"
        :placeholder="t.nombrePlaceholder"
        :input-props="{ autocomplete: 'off' }"
      />
    </label>

    <div class="campo">
      <NCheckbox v-model:checked="conArchivos">{{ t.conArchivos }}</NCheckbox>
      <small class="nota">{{ t.conArchivosAyuda }}</small>
    </div>

    <div class="vista" aria-live="polite">
      <NAlert v-if="vista?.errorBase" type="warning" :bordered="false">{{
        vista.errorBase
      }}</NAlert>
      <p v-else-if="vista?.base">
        {{ t.baseVolcado(vista.base.nombre, vista.base.servidor) }}
      </p>
      <p v-else-if="vista">{{ t.sinBase }}</p>
      <NAlert v-if="vista?.avisoMongodb" type="warning" :bordered="false">{{
        t.avisoMongodb
      }}</NAlert>
    </div>

    <template v-if="conArchivos">
      <div class="campo">
        <span>{{ t.siempre }}</span>
        <small class="nota">{{ t.siempreLista }}</small>
      </div>
      <label class="campo">
        <span>{{ t.extra }}</span>
        <NInput
          v-model:value="extraTexto"
          type="textarea"
          size="small"
          :autosize="{ minRows: 2, maxRows: 5 }"
          :input-props="{ spellcheck: false }"
        />
        <small class="nota">{{ t.extraAyuda }}</small>
      </label>

      <div class="vista" aria-live="polite">
        <strong>{{ t.vista }}</strong>
        <NSpin v-if="calculando" :size="14" />
        <NAlert v-else-if="errorVista" type="error" :bordered="false">{{ errorVista }}</NAlert>
        <template v-else-if="vista">
          <p>{{ t.resumen(vista.archivos, tamanoLegible(vista.bytes)) }}</p>
          <details v-if="vista.totalExcluidos > 0">
            <summary>{{ t.fuera(vista.totalExcluidos) }}</summary>
            <ul class="excluidos">
              <li v-for="x in vista.excluidos" :key="x">
                <code>{{ x }}</code>
              </li>
            </ul>
          </details>
        </template>
      </div>
    </template>
    <p v-else class="nota">{{ t.sinArchivos }}</p>

    <template #footer>
      <div class="pie">
        <NButton :disabled="ocupado('guardar')" @click="emit('cerrar')">{{ t.cancelar }}</NButton>
        <NButton
          type="primary"
          :loading="ocupado('guardar')"
          :disabled="!puedeGuardar"
          @click="guardar"
        >
          {{ t.guardar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.intro {
  margin: 0 0 12px;
  font-size: 12.5px;
  opacity: 0.8;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 12px;
}
.campo > span {
  opacity: 0.7;
}
.nota {
  font-size: 12px;
  opacity: 0.65;
}
.vista {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
}
.vista p {
  margin: 0;
}
.excluidos {
  margin: 6px 0 0;
  padding-left: 18px;
  max-height: 160px;
  overflow: auto;
  font-size: 12px;
}
code {
  font-family: var(--fuente-mono);
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
