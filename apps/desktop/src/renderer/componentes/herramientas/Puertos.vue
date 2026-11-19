<script setup lang="ts">
import { Refresh } from '@vicons/ionicons5';
import {
  NButton,
  NDataTable,
  NIcon,
  NInput,
  NModal,
  NTag,
  NTooltip,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { computed, h, onMounted, ref } from 'vue';
import type { PuertoEnUso } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { es } from '../../i18n/es';

const t = es.herramientas.puertos;
const { ejecutar, ocupado } = useAccion();
const message = useMessage();

/**
 * Pista para la interfaz: el núcleo tiene la lista negra definitiva y la aplica siempre. Aquí
 * solo se evita ofrecer el botón.
 */
const SISTEMA = new Set([
  'system',
  'system idle process',
  'registry',
  'secure system',
  'memory compression',
  'smss',
  'csrss',
  'wininit',
  'winlogon',
  'services',
  'lsass',
  'lsaiso',
  'svchost',
  'dwm',
  'explorer',
  'spoolsv',
  'fontdrvhost',
]);

const filas = ref<PuertoEnUso[]>([]);
const filtro = ref('');
const elegido = ref<PuertoEnUso | null>(null);
const confirmacion = ref('');

const nombreBase = (n: string): string => n.toLowerCase().replace(/\.exe$/, '');
const esSistema = (f: PuertoEnUso): boolean => f.pid < 5 || SISTEMA.has(nombreBase(f.nombre));
const finalizable = (f: PuertoEnUso): boolean => !f.propio && !esSistema(f);

const visibles = computed(() => {
  const q = filtro.value.trim().toLowerCase();
  if (!q) return filas.value;
  return filas.value.filter(
    (f) =>
      String(f.puerto).includes(q) ||
      String(f.pid).includes(q) ||
      f.nombre.toLowerCase().includes(q),
  );
});

async function cargar(): Promise<void> {
  const r = await ejecutar('cargar', () => api().herramientas.puertos());
  if (r) filas.value = r;
}

function pedir(f: PuertoEnUso): void {
  elegido.value = f;
  confirmacion.value = '';
}

const confirmado = computed(
  () =>
    !!elegido.value && nombreBase(confirmacion.value.trim()) === nombreBase(elegido.value.nombre),
);

async function finalizar(): Promise<boolean> {
  const f = elegido.value;
  if (!f || !confirmado.value) return false;
  const r = await ejecutar('finalizar', () =>
    api().herramientas.finalizarProceso(f.pid, confirmacion.value.trim(), { creado: f.creado }),
  );
  if (!r) return false;
  message.success(t.finalizado(r.nombre));
  elegido.value = null;
  await cargar();
  return true;
}

const columnas: DataTableColumns<PuertoEnUso> = [
  { key: 'puerto', title: t.columnas.puerto, width: 90, sorter: (a, b) => a.puerto - b.puerto },
  { key: 'protocolo', title: t.columnas.protocolo, width: 90 },
  {
    key: 'nombre',
    title: t.columnas.proceso,
    minWidth: 160,
    render: (f) =>
      h('span', { class: 'proceso' }, [
        f.nombre,
        f.propio ? h(NTag, { size: 'small', type: 'info', bordered: false }, () => t.propio) : null,
        !f.propio && esSistema(f)
          ? h(NTag, { size: 'small', bordered: false }, () => t.sistema)
          : null,
      ]),
  },
  { key: 'pid', title: t.columnas.pid, width: 80 },
  {
    key: 'direcciones',
    title: t.columnas.direcciones,
    minWidth: 160,
    ellipsis: { tooltip: true },
    render: (f) => h('span', { class: 'mono' }, f.direcciones.join(', ')),
  },
  {
    key: 'acciones',
    title: t.columnas.acciones,
    width: 110,
    align: 'right',
    render: (f) =>
      finalizable(f)
        ? h(
            NButton,
            { size: 'small', type: 'error', secondary: true, onClick: () => pedir(f) },
            () => t.finalizar,
          )
        : h(NTooltip, null, {
            trigger: () =>
              h('span', { tabindex: 0 }, [
                h(NButton, { size: 'small', disabled: true }, () => t.finalizar),
              ]),
            default: () => t.noFinalizable,
          }),
  },
];

onMounted(() => void cargar());
</script>

<template>
  <div class="herr">
    <div class="herr-fila">
      <NInput v-model:value="filtro" clearable :placeholder="t.filtro" class="filtro" />
      <NButton secondary :loading="ocupado('cargar')" @click="cargar">
        <template #icon
          ><NIcon><Refresh /></NIcon
        ></template>
        {{ t.actualizar }}
      </NButton>
    </div>
    <NDataTable
      :columns="columnas"
      :data="visibles"
      :row-key="(f: PuertoEnUso) => `${f.protocolo}-${f.puerto}-${f.pid}`"
      :loading="ocupado('cargar')"
      :max-height="520"
      virtual-scroll
      size="small"
      :bordered="false"
    >
      <template #empty>{{ t.vacio }}</template>
    </NDataTable>

    <NModal
      :show="!!elegido"
      preset="dialog"
      type="warning"
      :title="t.confirmarTitulo"
      :positive-text="t.finalizar"
      :negative-text="es.acciones.cancelar"
      :positive-button-props="{
        type: 'error',
        disabled: !confirmado,
        loading: ocupado('finalizar'),
      }"
      @positive-click="finalizar"
      @negative-click="elegido = null"
      @close="elegido = null"
      @mask-click="elegido = null"
    >
      <template v-if="elegido">
        <p>{{ t.confirmarTexto(elegido.nombre, elegido.pid) }}</p>
        <NInput
          v-model:value="confirmacion"
          :placeholder="elegido.nombre"
          @keyup.enter="finalizar"
        />
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.filtro {
  flex: 1;
  max-width: 360px;
}
:deep(.proceso) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
:deep(.mono) {
  font-family: var(--fuente-mono);
  font-size: 12px;
}
</style>
