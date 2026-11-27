<script setup lang="ts">
import { NButton, NInput, useMessage } from 'naive-ui';
import { ref } from 'vue';
import { api } from '../../../api';
import { textos } from '../../../i18n';
import { mensajeDeError } from '../../../utilidades/errores';

/**
 * Valor secreto de un campo: lo que se escribe viaja una sola vez al proceso principal, que lo
 * guarda cifrado; aquí solo queda la referencia (`ref`). «Mostrar» lo pide aparte (revelar).
 */
const valor = defineModel<string>('valor', { required: true });
const referencia = defineModel<string | undefined>('referencia', { default: undefined });
defineProps<{ etiqueta?: string }>();

const t = textos.herramientas.clienteHttp.secreto;
const message = useMessage();
const revelado = ref<string | null>(null);

async function mostrar(): Promise<void> {
  if (!referencia.value) return;
  try {
    revelado.value = (await api().clienteHttp.revelar(referencia.value)) ?? '';
  } catch (e) {
    message.error(mensajeDeError(e));
  }
}

function quitar(): void {
  referencia.value = undefined;
  valor.value = '';
  revelado.value = null;
}
</script>

<template>
  <div class="secreto">
    <NInput
      v-model:value="valor"
      type="password"
      show-password-on="click"
      size="small"
      class="herr-mono"
      autocomplete="off"
      :placeholder="referencia ? t.guardado : ''"
      :aria-label="etiqueta ?? t.valor"
    />
    <template v-if="referencia && !valor">
      <NButton v-if="revelado === null" size="small" quaternary @click="mostrar">{{
        t.mostrar
      }}</NButton>
      <NButton v-else size="small" quaternary @click="revelado = null">{{ t.ocultar }}</NButton>
      <NButton size="small" quaternary @click="quitar">{{ t.quitar }}</NButton>
    </template>
  </div>
  <code v-if="revelado !== null" class="revelado">{{ revelado }}</code>
</template>

<style scoped>
.secreto {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.secreto :deep(.n-input) {
  flex: 1;
  min-width: 0;
}
.revelado {
  display: block;
  margin-top: 4px;
  font-family: var(--fuente-mono);
  font-size: 12px;
  word-break: break-all;
  opacity: 0.85;
}
</style>
