<script setup lang="ts">
import { Warning } from '@vicons/ionicons5';
import { NFormItem, NIcon, NInput } from 'naive-ui';
import { onMounted } from 'vue';
import { textos } from '../i18n';
import { useBd } from '../stores/bd';

/** Aviso de que la base destino se reemplazará, con la confirmación escrita de su nombre. */
defineProps<{ base: string }>();
const escrito = defineModel<string>({ required: true });

const t = textos.bd.reemplazo;
const bd = useBd();

// La carpeta real (Documentos puede estar en OneDrive o redirigido); el texto es el respaldo.
onMounted(() => void bd.cargarCarpetaRespaldos());
</script>

<template>
  <div class="reemplazo" role="alert">
    <div class="cabeza">
      <NIcon :size="20"><Warning /></NIcon>
      <strong>{{ t.titulo(base) }}</strong>
    </div>
    <p>{{ t.texto(base) }}</p>
    <p class="donde">
      {{ t.donde }} <code>{{ bd.carpetaRespaldos ?? t.carpetaPorDefecto }}</code>
    </p>
    <p class="otra">{{ t.otraBase }}</p>
  </div>
  <NFormItem :label="t.pedir(base)" :show-feedback="false" class="campo">
    <NInput
      v-model:value="escrito"
      :placeholder="base"
      :input-props="{ spellcheck: false, autocomplete: 'off' }"
      autofocus
    />
  </NFormItem>
</template>

<style scoped>
.reemplazo {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(220, 38, 38, 0.45);
  background: rgba(220, 38, 38, 0.08);
  font-size: 13px;
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dc2626;
}
.cabeza strong {
  font-size: 14px;
}
.reemplazo p {
  margin: 8px 0 0;
  line-height: 1.5;
}
.donde code {
  font-family: var(--fuente-mono);
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.15);
}
.otra {
  opacity: 0.75;
}
.campo {
  margin-top: 14px;
}
.campo :deep(input) {
  font-family: var(--fuente-mono);
}
</style>
