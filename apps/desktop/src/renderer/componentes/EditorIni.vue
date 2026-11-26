<script setup lang="ts">
import { NButton, NCard, NEmpty, NFormItem, NInput, NModal, useDialog, useMessage } from 'naive-ui';
import { computed, reactive, ref, watch } from 'vue';
import type { ClaveRapida, RespaldoIni } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import VistaDiff from './VistaDiff.vue';

/**
 * Editor del php.ini de una rama: valores rápidos (se aplican al borrador), texto completo, diff
 * contra lo guardado antes de aplicar y copias con fecha para restaurar. Guardar lo hace el
 * núcleo: prueba con php -v, copia previa, reinicio del pool y vuelta atrás si no arranca.
 */
const props = defineProps<{ rama: string; recarga: number }>();
const emit = defineEmits<{ cambio: [] }>();

const t = textos.php;
const message = useMessage();
const dialog = useDialog();
const { ejecutar, ocupado } = useAccion();

const CLAVES = Object.keys(t.rapidos) as ClaveRapida[];

const guardado = ref('');
const borrador = ref('');
const cargado = ref(false);
const valores = ref<Partial<Record<ClaveRapida, string | null>>>({});
const rapidos = reactive<Partial<Record<ClaveRapida, string>>>({});
const respaldos = ref<RespaldoIni[]>([]);
/** Diff en revisión (null = diálogo cerrado). */
const diff = ref<string | null>(null);

const cambiado = computed(() => borrador.value !== guardado.value);

async function cargar(): Promise<void> {
  const rama = props.rama;
  const [texto, v, r] = await Promise.all([
    api().php.iniLeer(rama),
    api().php.iniValores(rama),
    api().php.iniRespaldos(rama),
  ]);
  if (rama !== props.rama) return;
  guardado.value = texto;
  borrador.value = texto;
  valores.value = v;
  respaldos.value = r;
  for (const k of CLAVES) rapidos[k] = v[k] ?? '';
  cargado.value = true;
}

watch(
  () => [props.rama, props.recarga] as const,
  () => {
    cargado.value = false;
    void ejecutar('cargar', cargar);
  },
  { immediate: true },
);

/** Solo los valores que cambiaron respecto del archivo guardado. */
const cambiosRapidos = computed(() => {
  const res: Partial<Record<ClaveRapida, string>> = {};
  for (const k of CLAVES) {
    const v = (rapidos[k] ?? '').trim();
    if (v !== '' && v !== (valores.value[k] ?? '')) res[k] = v;
  }
  return res;
});

function aplicarRapidos(): void {
  void ejecutar('rapidos', async () => {
    borrador.value = await api().php.iniConValores(
      props.rama,
      cambiosRapidos.value,
      borrador.value,
    );
  });
}

function revisar(): void {
  void ejecutar('diff', async () => {
    const d = await api().php.iniDiff(props.rama, borrador.value);
    if (d === '') message.info(t.sinCambios);
    else diff.value = d;
  });
}

function guardar(): void {
  void ejecutar('guardar', async () => {
    const r = await api().php.iniGuardar(props.rama, borrador.value);
    diff.value = null;
    message.success(t.guardado(r.respaldo), { duration: 8000 });
    // La vista sube `recarga`: las dos pestañas vuelven a leer.
    emit('cambio');
  });
}

function pedirRestaurar(nombre: string): void {
  dialog.warning({
    title: t.restaurar,
    content: t.confirmarRestaurar(nombre),
    positiveText: t.restaurar,
    negativeText: t.cancelar,
    onPositiveClick: () => {
      void ejecutar(`restaurar:${nombre}`, async () => {
        await api().php.iniRestaurar(props.rama, nombre);
        message.success(t.restaurado);
        emit('cambio');
      });
    },
  });
}

const fecha = (iso: string): string => new Date(iso).toLocaleString();
</script>

<template>
  <div class="editor-ini">
    <NCard size="small" :title="t.rapidosTitulo">
      <p class="tenue">{{ t.rapidosAyuda }}</p>
      <div class="rapidos">
        <NFormItem v-for="k in CLAVES" :key="k" :label="t.rapidos[k]" :show-feedback="false">
          <NInput
            v-model:value="rapidos[k]"
            :placeholder="valores[k] ?? t.sinValor"
            :disabled="!cargado"
            class="mono"
          />
        </NFormItem>
      </div>
      <NButton
        class="aplicar"
        secondary
        :disabled="!cargado || Object.keys(cambiosRapidos).length === 0"
        :loading="ocupado('rapidos')"
        @click="aplicarRapidos"
      >
        {{ t.aplicarRapidos }}
      </NButton>
    </NCard>

    <NCard size="small" :title="t.editorTitulo">
      <template #header-extra>
        <span class="tenue">{{ t.editorAyuda }}</span>
      </template>
      <NInput
        v-model:value="borrador"
        type="textarea"
        class="mono texto"
        :disabled="!cargado"
        :autosize="{ minRows: 14, maxRows: 28 }"
        :input-props="{ spellcheck: false }"
      />
      <div class="acciones">
        <NButton :disabled="!cambiado" @click="borrador = guardado">{{ t.descartar }}</NButton>
        <NButton
          type="primary"
          :disabled="!cargado || !cambiado"
          :loading="ocupado('diff')"
          @click="revisar"
        >
          {{ t.revisar }}
        </NButton>
      </div>
    </NCard>

    <NCard size="small" :title="t.respaldosTitulo">
      <NEmpty v-if="respaldos.length === 0" :description="t.sinRespaldos" size="small" />
      <ul v-else class="respaldos">
        <li v-for="r in respaldos" :key="r.nombre">
          <span class="mono">{{ r.nombre }}</span>
          <span class="tenue">{{ fecha(r.fecha) }}</span>
          <NButton
            size="small"
            secondary
            :loading="ocupado(`restaurar:${r.nombre}`)"
            @click="pedirRestaurar(r.nombre)"
          >
            {{ t.restaurar }}
          </NButton>
        </li>
      </ul>
    </NCard>

    <NModal
      :show="diff !== null"
      preset="card"
      :title="t.diffTitulo(rama)"
      class="modal-diff"
      :mask-closable="!ocupado('guardar')"
      @update:show="(v: boolean) => !v && !ocupado('guardar') && (diff = null)"
    >
      <p class="tenue">{{ t.diffAyuda }}</p>
      <VistaDiff :diff="diff ?? ''" />
      <template #footer>
        <div class="acciones">
          <NButton :disabled="ocupado('guardar')" @click="diff = null">{{ t.cancelar }}</NButton>
          <NButton type="primary" :loading="ocupado('guardar')" @click="guardar">
            {{ t.guardar }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.editor-ini {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rapidos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px 16px;
}
.aplicar {
  margin-top: 12px;
}
.mono :deep(input),
.mono :deep(textarea),
.mono {
  font-family: var(--fuente-mono);
}
.texto :deep(textarea) {
  font-size: 12.5px;
  white-space: pre;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
.respaldos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.respaldos li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.respaldos li .mono {
  flex: 1;
  font-size: 12.5px;
  word-break: break-all;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.76;
  margin: 0 0 8px;
}
:global(.modal-diff) {
  width: min(960px, 92vw);
}
</style>
