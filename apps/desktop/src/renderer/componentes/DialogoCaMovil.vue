<script setup lang="ts">
import { NAlert, NButton, NModal, NTabPane, NTabs } from 'naive-ui';
import QRCode from 'qrcode';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { CaMovilAbierta } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';

/**
 * "Instalar la CA en el móvil": abre el servidor temporal de `ca.crt` (solo ese archivo, en la
 * IP de la red local y un máximo de 10 minutos) mientras el diálogo está abierto y lo cierra al
 * cerrarlo. El QR lleva la dirección con su token aleatorio.
 */
const props = defineProps<{ show: boolean; ip: string }>();
const emit = defineEmits<{ 'update:show': [valor: boolean] }>();

const t = textos.caMovil;
const comando = ref('');
const { ejecutar } = useAccion();
const abierta = ref<CaMovilAbierta | null>(null);
const imagen = ref<string | null>(null);
const ahora = ref(Date.now());
let reloj: ReturnType<typeof setInterval> | null = null;
let turno = 0;

const minutos = computed(() =>
  abierta.value ? Math.max(0, Math.ceil((abierta.value.expira - ahora.value) / 60_000)) : 0,
);
const vencida = computed(() => abierta.value !== null && abierta.value.expira <= ahora.value);

function pararReloj(): void {
  if (reloj) clearInterval(reloj);
  reloj = null;
}

async function abrir(): Promise<void> {
  const mio = ++turno;
  const r = await ejecutar(
    'ca-movil-abrir',
    () => api().lan.abrirCaMovil(props.ip === '' ? undefined : props.ip),
    { tituloError: t.tituloError },
  );
  if (mio !== turno) {
    // El diálogo se cerró mientras abría: no debe quedar nada escuchando.
    if (r) void api().lan.cerrarCaMovil();
    return;
  }
  if (!r) {
    emit('update:show', false);
    return;
  }
  abierta.value = r;
  // El comando del cortafuegos solo para este puerto (la propia app lo escucha: nunca se invita a
  // permitir el programa entero).
  comando.value =
    (await ejecutar('ca-movil-comando', () => api().lan.comandoFirewall(r.puerto, 'ca'))) ?? '';
  ahora.value = Date.now();
  pararReloj();
  reloj = setInterval(() => {
    ahora.value = Date.now();
    if (abierta.value && abierta.value.expira <= ahora.value) pararReloj();
  }, 1000);
  try {
    const url = await QRCode.toDataURL(r.url, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
    if (mio === turno) imagen.value = url;
  } catch {
    imagen.value = null;
  }
}

function copiar(): void {
  void ejecutar('ca-movil-copiar', () => api().sistema.copiar(comando.value), {
    exito: textos.acciones.copiado,
  });
}

async function cerrar(): Promise<void> {
  turno++;
  pararReloj();
  abierta.value = null;
  imagen.value = null;
  comando.value = '';
  await api()
    .lan.cerrarCaMovil()
    .catch(() => undefined);
}

watch(
  () => props.show,
  (visible) => {
    if (visible) void abrir();
    else void cerrar();
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  if (props.show) void cerrar();
  else pararReloj();
});
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t.titulo"
    :style="{ width: 'min(520px, 94vw)' }"
    :segmented="{ content: true }"
    @update:show="emit('update:show', $event)"
  >
    <div class="contenido">
      <p class="tenue">{{ t.intro }}</p>
      <div class="qr-zona">
        <img
          v-if="imagen && !vencida"
          :src="imagen"
          :alt="abierta?.url ?? ''"
          width="220"
          height="220"
          class="qr"
        />
        <p v-else-if="vencida" class="tenue" role="status">{{ t.expirado }}</p>
        <p v-else class="tenue" role="status">{{ t.abriendo }}</p>
        <code v-if="abierta && !vencida" class="texto">{{ abierta.url }}</code>
        <p v-if="abierta && !vencida" class="tenue">{{ t.expira(minutos) }}</p>
        <NButton v-if="vencida" size="small" @click="abrir">{{ t.reabrir }}</NButton>
      </div>
      <div v-if="abierta && !vencida" class="huellas">
        <strong>{{ t.huellas }}</strong>
        <div>
          <span class="tenue">SHA-256</span> <code>{{ abierta.huellas.sha256 }}</code>
        </div>
        <div>
          <span class="tenue">SHA-1</span> <code>{{ abierta.huellas.sha1 }}</code>
        </div>
      </div>
      <NTabs type="segment" size="small" animated>
        <NTabPane name="android" :tab="t.android">
          <ol class="pasos">
            <li v-for="paso in t.pasosAndroid" :key="paso">{{ paso }}</li>
          </ol>
        </NTabPane>
        <NTabPane name="ios" :tab="t.ios">
          <ol class="pasos">
            <li v-for="paso in t.pasosIos" :key="paso">{{ paso }}</li>
          </ol>
        </NTabPane>
      </NTabs>
      <NAlert type="warning" :show-icon="false">{{ t.aviso }}</NAlert>
      <div v-if="abierta && !vencida" class="firewall">
        <p class="tenue">{{ t.firewallAviso(abierta.puerto) }}</p>
        <div class="comando">
          <code>{{ comando }}</code>
          <NButton size="tiny" secondary :disabled="!comando" @click="copiar">
            {{ textos.lan.copiarComando }}
          </NButton>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="pie">
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
  gap: 12px;
}
.contenido p {
  margin: 0;
}
.qr-zona {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.qr {
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  image-rendering: pixelated;
}
.texto {
  font-family: var(--fuente-mono);
  font-size: 12px;
  word-break: break-all;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.7;
}
.pasos {
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.huellas {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
.huellas code {
  font-family: var(--fuente-mono);
  word-break: break-all;
}
.comando {
  display: flex;
  align-items: center;
  gap: 8px;
}
.comando code {
  font-family: var(--fuente-mono);
  font-size: 12px;
  word-break: break-all;
  flex: 1;
}
.pie {
  display: flex;
  justify-content: flex-end;
}
</style>
