<script setup lang="ts">
import { Download } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NIcon,
  NInput,
  NRadioButton,
  NRadioGroup,
  useMessage,
} from 'naive-ui';
import QRCode from 'qrcode';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { textos } from '../../i18n';
import { errorWifi, textoQrWifi, type SeguridadWifi } from '../../utilidades/qrWifi';

const t = textos.herramientas.qrWifi;
const message = useMessage();

// La contraseña vive solo en este componente: no va a ningún almacén, ni persistente ni de sesión, ni a los
// registros, y se borra al cerrar el panel.
const ssid = ref('');
const clave = ref('');
const seguridad = ref<SeguridadWifi>('WPA');
const oculta = ref(false);
const verClave = ref(false);
const imagen = ref<string | null>(null);
const errorQr = ref(false);

const problema = computed(() =>
  errorWifi({ ssid: ssid.value, clave: clave.value, seguridad: seguridad.value }),
);
const textoError = computed(() =>
  problema.value === 'ssid'
    ? ssid.value
      ? t.errorSsid
      : null
    : problema.value === 'clave'
      ? t.errorClave
      : problema.value === 'claveWpa'
        ? t.errorClaveWpa
        : null,
);

let turno = 0;
watch(
  [ssid, clave, seguridad, oculta],
  async () => {
    const mio = ++turno;
    errorQr.value = false;
    if (problema.value) {
      imagen.value = null;
      return;
    }
    try {
      const url = await QRCode.toDataURL(
        textoQrWifi({
          ssid: ssid.value,
          clave: clave.value,
          seguridad: seguridad.value,
          oculta: oculta.value,
        }),
        { errorCorrectionLevel: 'M', margin: 2, width: 320 },
      );
      if (mio === turno) imagen.value = url;
    } catch {
      if (mio === turno) {
        imagen.value = null;
        errorQr.value = true;
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
  a.download = 'wifi-qr.png';
  a.click();
  message.success(t.descargado);
}

onBeforeUnmount(() => {
  turno++;
  clave.value = '';
  imagen.value = null;
});
</script>

<template>
  <div class="herr">
    <NAlert type="warning" :show-icon="false">{{ t.aviso }}</NAlert>
    <div>
      <div class="herr-etiqueta">{{ t.ssid }}</div>
      <NInput
        v-model:value="ssid"
        :maxlength="32"
        :input-props="{ spellcheck: false, autocomplete: 'off' }"
      />
    </div>
    <div>
      <div class="herr-etiqueta">{{ t.seguridad }}</div>
      <NRadioGroup v-model:value="seguridad">
        <NRadioButton value="WPA">{{ t.segWpa }}</NRadioButton>
        <NRadioButton value="WEP">{{ t.segWep }}</NRadioButton>
        <NRadioButton value="nopass">{{ t.segNinguna }}</NRadioButton>
      </NRadioGroup>
    </div>
    <div v-if="seguridad !== 'nopass'">
      <div class="herr-etiqueta">{{ t.clave }}</div>
      <div class="herr-fila">
        <NInput
          v-model:value="clave"
          :type="verClave ? 'text' : 'password'"
          :maxlength="64"
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
          class="campo"
        />
        <NButton secondary @click="verClave = !verClave">{{
          verClave ? t.ocultar : t.mostrar
        }}</NButton>
      </div>
      <p class="herr-tenue">{{ t.escribala }}</p>
    </div>
    <NCheckbox v-model:checked="oculta">{{ t.oculta }}</NCheckbox>
    <p v-if="textoError" class="herr-error" role="alert">{{ textoError }}</p>
    <p v-else-if="errorQr" class="herr-error" role="alert">{{ t.largo }}</p>
    <div v-if="imagen" class="qr">
      <!-- El texto alternativo no repite la red ni la contraseña. -->
      <img :src="imagen" :alt="t.alt" width="240" height="240" />
      <p class="herr-tenue">{{ t.avisoPng }}</p>
      <NButton type="primary" @click="descargar">
        <template #icon
          ><NIcon><Download /></NIcon
        ></template>
        {{ t.descargar }}
      </NButton>
    </div>
    <p v-else-if="!textoError && !errorQr" class="herr-tenue">{{ t.vacio }}</p>
  </div>
</template>

<style scoped>
.campo {
  flex: 1;
  min-width: 200px;
}
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
