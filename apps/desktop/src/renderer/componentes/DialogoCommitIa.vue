<script setup lang="ts">
import { GitCommitOutline, Sparkles } from '@vicons/ionicons5';
import { NAlert, NButton, NFormItem, NIcon, NInput, NModal, type SelectOption } from 'naive-ui';
import Desplegable from './Desplegable.vue';
import { computed, ref, watch } from 'vue';
import type { Sitio } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useIa } from '../stores/ia';
import { TIPOS_CON_CLAVE } from '../utilidades/ia';

/**
 * "Sugerir commit": el proveedor elegido propone un mensaje para lo preparado (`git diff
 * --cached` filtrado en el núcleo), el usuario lo edita y "Hacer commit" hace commit SOLO de lo
 * preparado. La clave nunca pasa por aquí: la pone el proceso principal.
 */
const props = defineProps<{ sitio: Sitio }>();
const mostrar = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ hecho: [] }>();

const t = textos.proyectos.git.commitIa;
const ia = useIa();
const { ejecutar, ocupado } = useAccion();

const proveedorId = ref<string | null>(null);
const modelo = ref<string | null>(null);
const mensaje = ref('');

/** Proveedores usables: con clave guardada, o de un tipo que no la necesita. */
const usables = computed(() =>
  (ia.proveedores ?? []).filter((p) => p.clave.configurada || !TIPOS_CON_CLAVE.has(p.tipo)),
);
const opcionesProveedor = computed<SelectOption[]>(() =>
  usables.value.map((p) => ({ value: p.id, label: p.nombre })),
);
const proveedor = computed(() => usables.value.find((p) => p.id === proveedorId.value) ?? null);
const opcionesModelo = computed<SelectOption[]>(() => {
  const lista = new Set(proveedorId.value ? ia.modelosDe(proveedorId.value) : []);
  if (proveedor.value?.modelo) lista.add(proveedor.value.modelo);
  return [...lista].sort().map((m) => ({ value: m, label: m }));
});
const puedeSugerir = computed(
  () => !!proveedor.value && !!modelo.value?.trim() && !ocupado('sugerir') && !ocupado('commit'),
);
const puedeHacerCommit = computed(
  () => mensaje.value.trim() !== '' && !ocupado('commit') && !ocupado('sugerir'),
);

watch(
  mostrar,
  (v) => {
    if (!v) return;
    mensaje.value = '';
    void ia.cargarProveedores().then(() => {
      if (!usables.value.some((p) => p.id === proveedorId.value)) {
        proveedorId.value = usables.value[0]?.id ?? null;
      }
      modelo.value = proveedor.value?.modelo ?? modelo.value;
    });
  },
  { immediate: true },
);
watch(proveedorId, () => {
  modelo.value = proveedor.value?.modelo ?? null;
});

async function sugerir(): Promise<void> {
  const p = proveedorId.value;
  const m = modelo.value?.trim();
  if (!p || !m) return;
  const r = await ejecutar('sugerir', () => api().git.sugerirCommit(props.sitio.id, p, m));
  if (r !== undefined) mensaje.value = r;
}

async function hacerCommit(): Promise<void> {
  const texto = mensaje.value;
  if (!texto.trim()) return;
  const ok = await ejecutar(
    'commit',
    async () => {
      await api().git.commitPreparado(props.sitio.id, texto);
      return true;
    },
    { exito: t.hecho },
  );
  if (ok) {
    mostrar.value = false;
    emit('hecho');
  }
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo"
    :style="{ width: '620px', maxWidth: 'calc(100vw - 32px)' }"
    :auto-focus="false"
  >
    <NAlert v-if="usables.length === 0" type="warning" :show-icon="false">
      {{ t.sinProveedores }}
    </NAlert>
    <template v-else>
      <div class="fila">
        <NFormItem :label="t.proveedor" :show-feedback="false" class="campo">
          <Desplegable v-model:value="proveedorId" :options="opcionesProveedor" />
        </NFormItem>
        <NFormItem :label="t.modelo" :show-feedback="false" class="campo">
          <Desplegable v-model:value="modelo" :options="opcionesModelo" filterable tag />
        </NFormItem>
      </div>
      <p class="tenue">{{ t.privacidad }}</p>
      <NButton secondary :loading="ocupado('sugerir')" :disabled="!puedeSugerir" @click="sugerir">
        <template #icon
          ><NIcon><Sparkles /></NIcon
        ></template>
        {{ t.sugerir }}
      </NButton>
    </template>
    <NFormItem :label="t.mensaje" :show-feedback="false" class="mensaje">
      <NInput
        v-model:value="mensaje"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 12 }"
        :maxlength="10000"
        class="mono"
      />
    </NFormItem>
    <template #footer>
      <div class="pie">
        <span class="tenue">{{ t.commitAyuda }}</span>
        <NButton @click="mostrar = false">{{ textos.acciones.cancelar }}</NButton>
        <NButton
          type="primary"
          :loading="ocupado('commit')"
          :disabled="!puedeHacerCommit"
          @click="hacerCommit"
        >
          <template #icon
            ><NIcon><GitCommitOutline /></NIcon
          ></template>
          {{ t.commit }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.fila {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.campo {
  flex: 1;
  min-width: 200px;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.7;
}
.mensaje {
  margin-top: 12px;
}
.mono :deep(textarea) {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.pie {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}
.pie .tenue {
  flex: 1;
}
</style>
