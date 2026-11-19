<script setup lang="ts">
import { NCard, NSkeleton, NSwitch, useNotification } from 'naive-ui';
import { onMounted, ref } from 'vue';
import type { Config } from '../../shared/api';
import { api } from '../api';
import { mensajeDeError } from '../composables/useAccion';
import { textos } from '../i18n';

/** Ajustes → Avisos: notificaciones nativas de Windows y qué tipos de aviso se publican. */
type ConfigAvisos = Config['avisos'];
type TipoAviso = keyof ConfigAvisos['tipos'];

const t = textos.ajustes.avisos;
const notification = useNotification();
const avisos = ref<ConfigAvisos | null>(null);
const guardando = ref(false);

onMounted(async () => {
  try {
    avisos.value = (await api().config.leer()).avisos;
  } catch (e) {
    notification.error({ title: t.errorGuardar, content: mensajeDeError(e), duration: 6000 });
  }
});

const tipos = (): TipoAviso[] => Object.keys(avisos.value?.tipos ?? {}) as TipoAviso[];

async function guardar(cambios: Parameters<ReturnType<typeof api>['avisos']['configurar']>[0]) {
  if (!avisos.value) return;
  const previo = avisos.value;
  // Se ve el cambio al instante; si falla, vuelve a lo guardado.
  avisos.value = {
    nativas: cambios.nativas ?? previo.nativas,
    tipos: { ...previo.tipos, ...cambios.tipos },
  };
  guardando.value = true;
  try {
    avisos.value = await api().avisos.configurar(cambios);
  } catch (e) {
    avisos.value = previo;
    notification.error({ title: t.errorGuardar, content: mensajeDeError(e), duration: 6000 });
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <NCard :title="t.titulo" size="small" class="tarjeta">
    <p class="ayuda-tarjeta">{{ t.descripcion }}</p>
    <NSkeleton v-if="!avisos" text :repeat="3" />
    <template v-else>
      <label class="fila">
        <span>
          <span class="nombre">{{ t.nativas }}</span>
          <small class="ayuda">{{ t.nativasAyuda }}</small>
        </span>
        <NSwitch
          :value="avisos.nativas"
          :disabled="guardando"
          :aria-label="t.nativas"
          @update:value="(v: boolean) => guardar({ nativas: v })"
        />
      </label>
      <p class="subtitulo">{{ t.tiposTitulo }}</p>
      <label v-for="tipo in tipos()" :key="tipo" class="fila">
        <span class="nombre">{{ t.tipos[tipo] ?? tipo }}</span>
        <NSwitch
          :value="avisos.tipos[tipo]"
          :disabled="guardando"
          :aria-label="t.tipos[tipo] ?? tipo"
          @update:value="(v: boolean) => guardar({ tipos: { [tipo]: v } })"
        />
      </label>
    </template>
  </NCard>
</template>

<style scoped>
.ayuda-tarjeta {
  margin: -4px 0 14px;
  font-size: 12.5px;
  opacity: 0.65;
}
.fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 7px 0;
}
.nombre {
  display: block;
}
.ayuda {
  display: block;
  font-size: 12px;
  opacity: 0.65;
}
.subtitulo {
  margin: 14px 0 4px;
  font-size: 12.5px;
  font-weight: 600;
  opacity: 0.8;
}
</style>
