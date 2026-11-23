<script setup lang="ts">
import { NAlert, NButton, NEmpty, NInput, NSkeleton, NSwitch, NTag, useMessage } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { ExtensionPhp } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';

/**
 * Extensiones de una rama de PHP: interruptor para las que trae su ext/ e "Instalar" para las de
 * terceros del catálogo. Cada cambio pasa por el guardado del php.ini (prueba y vuelta atrás).
 */
const props = defineProps<{ rama: string; recarga: number }>();
const emit = defineEmits<{ cambio: [] }>();

const t = textos.php.extensiones;
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const lista = ref<ExtensionPhp[] | null>(null);
const buscar = ref('');

async function cargar(): Promise<void> {
  const rama = props.rama;
  const l = await api().php.extensiones(rama);
  if (rama === props.rama) lista.value = l;
}

watch(
  () => [props.rama, props.recarga] as const,
  () => {
    lista.value = null;
    void ejecutar('cargar', cargar);
  },
  { immediate: true },
);

const visibles = computed(() => {
  const q = buscar.value.trim().toLowerCase();
  return (lista.value ?? []).filter((e) => q === '' || e.nombre.includes(q));
});

const ocupadoAlguno = computed(() => (lista.value ?? []).some((e) => ocupado(`ext:${e.nombre}`)));

function cambiar(e: ExtensionPhp, activa: boolean): void {
  void ejecutar(`ext:${e.nombre}`, async () => {
    await api().php.extensionActivar(props.rama, e.nombre, activa);
    message.success(t.cambiada(e.nombre, activa));
    // La vista sube `recarga`: las dos pestañas vuelven a leer.
    emit('cambio');
  });
}

function instalar(e: ExtensionPhp): void {
  void ejecutar(`ext:${e.nombre}`, async () => {
    await api().php.extensionInstalar(props.rama, e.nombre);
    message.success(t.instalada(e.nombre));
    // La vista sube `recarga`: las dos pestañas vuelven a leer.
    emit('cambio');
  });
}
</script>

<template>
  <div class="extensiones">
    <NAlert type="info" :show-icon="false">{{ t.ayuda }}</NAlert>
    <NInput v-model:value="buscar" clearable :placeholder="t.buscar" class="buscar" />
    <div v-if="lista === null" class="filas">
      <NSkeleton v-for="i in 6" :key="i" height="38px" :sharp="false" />
    </div>
    <NEmpty v-else-if="visibles.length === 0" :description="t.vacio" size="small" />
    <ul v-else class="filas">
      <li v-for="e in visibles" :key="e.nombre" class="fila">
        <span class="nombre">{{ e.nombre }}</span>
        <NTag v-if="e.origen === 'catalogo'" size="small" :bordered="false" type="info">
          {{ t.catalogo }}
        </NTag>
        <NTag v-if="e.activa && !e.archivo" size="small" :bordered="false" type="warning">
          {{ t.falta }}
        </NTag>
        <span class="tenue">{{ e.activa ? t.activa : t.inactiva }}</span>
        <NButton
          v-if="!e.archivo && e.origen === 'catalogo'"
          size="small"
          type="primary"
          secondary
          :loading="ocupado(`ext:${e.nombre}`)"
          :disabled="ocupadoAlguno && !ocupado(`ext:${e.nombre}`)"
          @click="instalar(e)"
        >
          {{ t.instalar }}
        </NButton>
        <NSwitch
          :value="e.activa"
          :loading="ocupado(`ext:${e.nombre}`)"
          :disabled="(!e.archivo && !e.activa) || (ocupadoAlguno && !ocupado(`ext:${e.nombre}`))"
          :aria-label="e.nombre"
          @update:value="(v: boolean) => cambiar(e, v)"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.extensiones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.buscar {
  max-width: 320px;
}
.filas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 8px;
}
.fila {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
}
.nombre {
  flex: 1;
  font-family: var(--fuente-mono);
  font-size: 13px;
}
.tenue {
  font-size: 12px;
  opacity: 0.7;
}
</style>
