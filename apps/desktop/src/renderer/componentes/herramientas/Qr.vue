<script setup lang="ts">
import { Download } from '@vicons/ionicons5';
import { NButton, NIcon, NInput, useMessage } from 'naive-ui';
import Desplegable from '../Desplegable.vue';
import QRCode from 'qrcode';
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../../api';
import { textos } from '../../i18n';
import { useSitios } from '../../stores/sitios';
import { useTuneles } from '../../stores/tuneles';

const t = textos.herramientas.qr;
const tuneles = useTuneles();
const sitios = useSitios();
const message = useMessage();

const texto = ref('');
const tunel = ref<string | null>(null);
const imagen = ref<string | null>(null);
const error = ref<string | null>(null);

const opcionesTunel = computed(() =>
  tuneles.activos.map((x) => {
    const s = sitios.porId(x.sitioId);
    return { label: `${s?.nombre || s?.dominio || x.sitioId} · ${x.url}`, value: x.url ?? '' };
  }),
);

watch(tunel, (url) => {
  if (url) texto.value = url;
});

let turno = 0;
watch(
  texto,
  async (v) => {
    const mio = ++turno;
    error.value = null;
    if (!v) {
      imagen.value = null;
      return;
    }
    try {
      const url = await QRCode.toDataURL(v, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
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

/**
 * No hay ruta del núcleo para escribir bytes elegidos por la interfaz: se usa la descarga del
 * navegador, que en Electron abre el diálogo "Guardar como".
 */
function descargar(): void {
  if (!imagen.value) return;
  const a = document.createElement('a');
  a.href = imagen.value;
  a.download = 'qr.png';
  a.click();
  message.success(t.descargado);
}

onMounted(async () => {
  try {
    tuneles.hidratar(await api().tuneles.estados());
  } catch {
    // Sin túneles: el selector queda vacío.
  }
});
</script>

<template>
  <div class="herr">
    <div>
      <div class="herr-etiqueta">{{ t.tunel }}</div>
      <Desplegable
        v-model:value="tunel"
        :options="opcionesTunel"
        :placeholder="t.sinTuneles"
        :disabled="!opcionesTunel.length"
        clearable
      />
    </div>
    <div>
      <div class="herr-etiqueta">{{ t.texto }}</div>
      <NInput
        v-model:value="texto"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 6 }"
        :maxlength="2000"
        show-count
      />
      <p class="herr-tenue">{{ t.textoAyuda }}</p>
    </div>
    <p v-if="error" class="herr-error">{{ error }}</p>
    <div v-if="imagen" class="qr">
      <img :src="imagen" :alt="texto" width="240" height="240" />
      <NButton type="primary" @click="descargar">
        <template #icon
          ><NIcon><Download /></NIcon
        ></template>
        {{ t.descargar }}
      </NButton>
    </div>
    <p v-else-if="!error" class="herr-tenue">{{ t.vacio }}</p>
  </div>
</template>

<style scoped>
.qr {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.qr img {
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  image-rendering: pixelated;
}
</style>
