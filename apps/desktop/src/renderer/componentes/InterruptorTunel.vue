<script setup lang="ts">
import { Copy, Open, Refresh } from '@vicons/ionicons5';
import { NButton, NIcon, NSpin, NSwitch, NTooltip } from 'naive-ui';
import { computed } from 'vue';
import type { EstadoTunel, Sitio } from '../../shared/api';
import { useTunel } from '../composables/useTunel';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import { useTuneles } from '../stores/tuneles';
import { motivoTunelBloqueado } from '../utilidades/sitios';

const props = defineProps<{ sitio: Sitio }>();

const t = textos.tunel;
const servicios = useServicios();
const tuneles = useTuneles();
const { abrir, cerrar, renovar, abrirUrl, copiar, ocupado, trabajando } = useTunel();

const tunel = computed<EstadoTunel>(
  () =>
    tuneles.porSitio[props.sitio.id] ?? { sitioId: props.sitio.id, estado: 'apagado', url: null },
);
const abriendo = computed(
  () =>
    tunel.value.estado === 'iniciando' ||
    ocupado(`abrir-${props.sitio.id}`) ||
    ocupado(`renovar-${props.sitio.id}`),
);
const cerrando = computed(() => ocupado(`cerrar-${props.sitio.id}`));
const fase = computed<'apagado' | 'abriendo' | 'cerrando' | 'activo' | 'error'>(() => {
  if (cerrando.value) return 'cerrando';
  if (abriendo.value) return 'abriendo';
  if (tunel.value.estado === 'activo' && tunel.value.url) return 'activo';
  if (tunel.value.estado === 'error') return 'error';
  return 'apagado';
});

const cloudflared = computed(() => {
  const v = servicios.instalados['cloudflared'];
  return v === undefined ? undefined : v.length > 0;
});
const bloqueo = computed(() =>
  motivoTunelBloqueado({
    nginx: servicios.porId['nginx']?.estado,
    cloudflaredInstalado: cloudflared.value,
    tunel: fase.value === 'apagado' ? 'apagado' : tunel.value.estado,
  }),
);

const encendido = computed(() => fase.value === 'activo' || fase.value === 'abriendo');

function cambiar(valor: boolean): void {
  if (trabajando(props.sitio.id)) return;
  if (valor) void abrir(props.sitio);
  else void cerrar(props.sitio.id);
}
</script>

<template>
  <div class="tunel" :class="`fase-${fase}`">
    <NTooltip :disabled="!bloqueo" placement="top-start">
      <template #trigger>
        <span class="interruptor">
          <NSwitch
            size="small"
            :value="encendido"
            :loading="fase === 'abriendo' || fase === 'cerrando'"
            :disabled="!!bloqueo || fase === 'cerrando'"
            :aria-label="t.interruptor(sitio.dominio)"
            @update:value="cambiar"
          />
          <span class="etiqueta">{{ t.etiqueta }}</span>
        </span>
      </template>
      {{ bloqueo }}
    </NTooltip>

    <div class="detalle" aria-live="polite">
      <template v-if="fase === 'abriendo' || fase === 'cerrando'">
        <NSpin :size="12" />
        <span class="tenue">{{ fase === 'abriendo' ? t.abriendo : t.cerrando }}</span>
      </template>

      <template v-else-if="fase === 'activo' && tunel.url">
        <a class="url" :href="tunel.url" @click.prevent="abrirUrl(tunel.url)">{{ tunel.url }}</a>
        <span class="iconos">
          <NTooltip>
            <template #trigger>
              <NButton
                quaternary
                circle
                size="tiny"
                :aria-label="t.abrirUrl"
                @click="abrirUrl(tunel.url)"
              >
                <template #icon
                  ><NIcon><Open /></NIcon
                ></template>
              </NButton>
            </template>
            {{ t.abrirUrl }}
          </NTooltip>
          <NTooltip>
            <template #trigger>
              <NButton
                quaternary
                circle
                size="tiny"
                :aria-label="t.copiarUrl"
                @click="copiar(tunel.url)"
              >
                <template #icon
                  ><NIcon><Copy /></NIcon
                ></template>
              </NButton>
            </template>
            {{ t.copiarUrl }}
          </NTooltip>
          <NTooltip>
            <template #trigger>
              <NButton
                quaternary
                circle
                size="tiny"
                :aria-label="t.renovar"
                @click="renovar(sitio)"
              >
                <template #icon
                  ><NIcon><Refresh /></NIcon
                ></template>
              </NButton>
            </template>
            {{ t.renovar }}
          </NTooltip>
        </span>
      </template>

      <template v-else-if="fase === 'error'">
        <span class="error" :title="tunel.mensaje">{{ tunel.mensaje || t.error }}</span>
        <NTooltip :disabled="!bloqueo">
          <template #trigger>
            <span>
              <NButton size="tiny" secondary :disabled="!!bloqueo" @click="renovar(sitio)">
                <template #icon
                  ><NIcon><Refresh /></NIcon
                ></template>
                {{ textos.acciones.renovar }}
              </NButton>
            </span>
          </template>
          {{ bloqueo }}
        </NTooltip>
      </template>

      <span v-else class="tenue">{{ t.apagadoAyuda }}</span>
    </div>
  </div>
</template>

<style scoped>
.tunel {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 28px;
  font-size: 12.5px;
}
.interruptor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.etiqueta {
  font-weight: 500;
  opacity: 0.75;
}
.detalle {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.tenue {
  opacity: 0.6;
}
.url {
  font-family: var(--fuente-mono);
  font-size: 12px;
  color: var(--texto-ok);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.url:hover {
  text-decoration: underline;
}
.iconos {
  display: inline-flex;
  gap: 2px;
  flex: none;
}
.error {
  color: var(--texto-error);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
</style>
