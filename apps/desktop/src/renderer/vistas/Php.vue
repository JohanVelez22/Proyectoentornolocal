<script setup lang="ts">
import { NButton, NEmpty, NFormItem, NSkeleton, NTabPane, NTabs } from 'naive-ui';
import Desplegable from '../componentes/Desplegable.vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import EditorIni from '../componentes/EditorIni.vue';
import ListaExtensiones from '../componentes/ListaExtensiones.vue';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';

/** PHP por versión instalada: php.ini (editor con diff y copias) y extensiones. */
const t = textos.php;
const router = useRouter();
const { ejecutar } = useAccion();

const ramas = ref<string[] | null>(null);
const rama = ref<string | null>(null);
const pestana = ref<'ini' | 'extensiones'>('ini');
/** Sube cuando una pestaña cambia el php.ini: la otra vuelve a leerlo. */
const recarga = ref(0);

const opciones = computed(() => (ramas.value ?? []).map((r) => ({ value: r, label: `PHP ${r}` })));

onMounted(() => {
  void ejecutar('ramas', async () => {
    const lista = [...(await api().instalador.instalados('php'))].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    );
    ramas.value = lista;
    rama.value = lista[0] ?? null;
  });
});
</script>

<template>
  <div class="php">
    <p class="descripcion">{{ t.descripcion }}</p>
    <NSkeleton v-if="ramas === null" height="120px" :sharp="false" />
    <NEmpty v-else-if="ramas.length === 0" :description="t.sinPhp">
      <template #extra>
        <NButton @click="router.push('/servicios')">{{ t.irServicios }}</NButton>
      </template>
    </NEmpty>
    <template v-else-if="rama">
      <NFormItem :label="t.rama" label-placement="left" :show-feedback="false" class="rama">
        <Desplegable v-model:value="rama" :options="opciones" />
      </NFormItem>
      <NTabs v-model:value="pestana" type="line" animated>
        <NTabPane name="ini" :tab="t.pestanas.ini">
          <EditorIni :rama="rama" :recarga="recarga" @cambio="recarga++" />
        </NTabPane>
        <NTabPane name="extensiones" :tab="t.pestanas.extensiones">
          <ListaExtensiones :rama="rama" :recarga="recarga" @cambio="recarga++" />
        </NTabPane>
      </NTabs>
    </template>
  </div>
</template>

<style scoped>
.php {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.descripcion {
  margin: 0;
  opacity: 0.75;
  max-width: 80ch;
}
.rama {
  max-width: 280px;
}
</style>
