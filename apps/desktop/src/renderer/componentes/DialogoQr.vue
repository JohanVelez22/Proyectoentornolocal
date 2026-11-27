<script setup lang="ts">
import { Download } from '@vicons/ionicons5';
import { NButton, NIcon, NModal, useMessage } from 'naive-ui';
import QRCode from 'qrcode';
import { ref, watch } from 'vue';
import { textos } from '../i18n';

const props = defineProps<{ show: boolean; texto: string; titulo: string; aviso?: string }>();
const emit = defineEmits<{ 'update:show': [valor: boolean] }>();

const t = textos.dialogoQr;
const message = useMessage();
const imagen = ref<string | null>(null);
const error = ref<string | null>(null);

let turno = 0;
watch(
  () => [props.show, props.texto] as const,
  async ([visible, texto]) => {
    const mio = ++turno;
    error.value = null;
    // La imagen solo existe mientras el diálogo está abierto.
    if (!visible || !texto) {
      imagen.value = null;
      return;
    }
    try {
      const url = await QRCode.toDataURL(texto, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
      });
      if (mio === turno) imagen.value = url;
    } catch {
      if (mio === turno) {
        imagen.value = null;
        error.value = t.largo;
      }
    }
  },
  { immediate: true },
);

/** Descarga del navegador: en Electron abre el diálogo "Guardar como". */
function descargar(): void {
  if (!imagen.value) return;
  const a = document.createElement('a');
  a.href = imagen.value;
  a.download = 'qr.png';
  a.click();
  message.success(t.descargado);
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="titulo"
    :style="{ width: 'min(420px, 92vw)' }"
    :segmented="{ content: true }"
    @update:show="emit('update:show', $event)"
  >
    <div class="contenido">
      <img v-if="imagen" :src="imagen" :alt="texto" width="240" height="240" class="qr" />
      <p v-else-if="error" class="error" role="alert">{{ error }}</p>
      <p v-else class="tenue" role="status">{{ t.generando }}</p>
      <code class="texto">{{ texto }}</code>
      <p v-if="aviso" class="tenue">{{ aviso }}</p>
    </div>
    <template #footer>
      <div class="pie">
        <NButton :disabled="!imagen" @click="descargar">
          <template #icon
            ><NIcon><Download /></NIcon
          ></template>
          {{ t.descargar }}
        </NButton>
        <NButton type="primary" @click="emit('update:show', false)">
          {{ textos.acciones.cerrar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.contenido {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}
.qr {
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  image-rendering: pixelated;
}
.texto {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  word-break: break-all;
}
.tenue {
  margin: 0;
  font-size: 12.5px;
  opacity: 0.75;
}
.error {
  margin: 0;
  color: var(--texto-error);
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
