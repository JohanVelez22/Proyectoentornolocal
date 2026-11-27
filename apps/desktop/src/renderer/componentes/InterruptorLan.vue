<script setup lang="ts">
import { Copy, Open, PhonePortrait, QrCode } from '@vicons/ionicons5';
import { NAlert, NButton, NCheckbox, NIcon, NModal, NSpin, NSwitch, NTooltip } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { EstadoLan, Sitio, SitioCompartidoLan } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import Desplegable from './Desplegable.vue';
import DialogoCaMovil from './DialogoCaMovil.vue';
import DialogoQr from './DialogoQr.vue';

const props = defineProps<{ sitio: Sitio }>();

const t = textos.lan;
const servicios = useServicios();
const { ejecutar, ocupado } = useAccion();

const estado = ref<EstadoLan>({ ips: [], sitios: [], perfiles: {}, redCambio: [] });
const compartido = computed<SitioCompartidoLan | null>(
  () => estado.value.sitios.find((s) => s.sitioId === props.sitio.id) ?? null,
);
const activo = computed(() => props.sitio.lan?.activo === true);
const trabajando = computed(
  () => ocupado(`lan-activar-${props.sitio.id}`) || ocupado(`lan-desactivar-${props.sitio.id}`),
);
// Con datos reales no se comparte en la red (ni con confirmación); el núcleo también lo rechaza.
const bloqueo = computed(() => {
  if (activo.value) return null;
  if (props.sitio.datosReales) return t.datosRealesBloqueado(props.sitio.dominio);
  return servicios.porId['nginx']?.estado !== 'encendido' ? t.sinNginx : null;
});

async function refrescar(): Promise<void> {
  try {
    estado.value = await api().lan.estado();
  } catch {
    estado.value = { ips: [], sitios: [], perfiles: {}, redCambio: [] };
  }
}
watch(() => props.sitio.lan?.activo, refrescar, { immediate: true });

/* ───────────── Confirmación: a quién se expone ───────────── */

const confirmando = ref(false);
const ip = ref('');
const https = ref(false);
const httpsObligatorio = computed(() => props.sitio.redirigirHttps === true);
const puedeConfirmar = computed(() => ip.value !== '' && !props.sitio.datosReales);
// Una red pública: el cortafuegos de Windows la bloquea y la regla solo abre las privadas.
const redPublica = computed(() => estado.value.perfiles[ip.value] === 'publico');
const opcionesIp = computed(() => estado.value.ips.map((x) => ({ label: x, value: x })));

async function pedirConfirmacion(): Promise<void> {
  await refrescar();
  if (estado.value.ips.length === 0) {
    await ejecutar(`lan-activar-${props.sitio.id}`, () => Promise.reject(new Error(t.sinRed)), {
      tituloError: t.tituloError,
    });
    return;
  }
  ip.value = estado.value.ips[0]!;
  https.value = httpsObligatorio.value;
  confirmando.value = true;
}

async function compartir(): Promise<void> {
  if (!puedeConfirmar.value) return;
  confirmando.value = false;
  await ejecutar(
    `lan-activar-${props.sitio.id}`,
    () =>
      api().lan.activar(props.sitio.id, {
        ip: ip.value,
        https: https.value || httpsObligatorio.value,
        confirmado: true,
      }),
    { tituloError: t.tituloError },
  );
  await refrescar();
}

async function dejarDeCompartir(): Promise<void> {
  await ejecutar(`lan-desactivar-${props.sitio.id}`, () => api().lan.desactivar(props.sitio.id));
  await refrescar();
}

function cambiar(valor: boolean): void {
  if (trabajando.value) return;
  if (valor) void pedirConfirmacion();
  else void dejarDeCompartir();
}

/* ───────────── Acciones sobre la dirección ───────────── */

const verQr = ref(false);
const verCa = ref(false);
const verFirewall = ref(false);
const comando = ref('');

function abrirUrl(url: string): void {
  void ejecutar(`lan-url-${url}`, () => api().sistema.abrirUrl(url));
}
function copiar(texto: string, mensaje = textos.acciones.copiado): void {
  void ejecutar(`lan-copiar`, () => api().sistema.copiar(texto), { exito: mensaje });
}
async function alternarFirewall(): Promise<void> {
  verFirewall.value = !verFirewall.value;
  if (verFirewall.value && compartido.value) {
    comando.value =
      (await ejecutar('lan-firewall', () =>
        api().lan.comandoFirewall(compartido.value!.puerto, 'sitio'),
      )) ?? '';
  }
}
</script>

<template>
  <div class="lan">
    <div class="fila">
      <NTooltip :disabled="!bloqueo" placement="top-start">
        <template #trigger>
          <span class="interruptor">
            <NSwitch
              size="small"
              :value="activo"
              :loading="trabajando"
              :disabled="!!bloqueo || trabajando"
              :aria-label="t.interruptor(sitio.dominio)"
              @update:value="cambiar"
            />
            <span class="etiqueta">{{ t.etiqueta }}</span>
          </span>
        </template>
        {{ bloqueo }}
      </NTooltip>

      <div class="detalle" aria-live="polite">
        <template v-if="trabajando">
          <NSpin :size="12" />
          <span class="tenue">{{ activo ? t.cerrando : t.abriendo }}</span>
        </template>

        <template v-else-if="activo && compartido">
          <a class="url" :href="compartido.url" @click.prevent="abrirUrl(compartido.url)">{{
            compartido.url
          }}</a>
          <span class="iconos">
            <NTooltip>
              <template #trigger>
                <NButton
                  quaternary
                  circle
                  size="tiny"
                  :aria-label="t.abrirUrl"
                  @click="abrirUrl(compartido.url)"
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
                  @click="copiar(compartido.url)"
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
                <NButton quaternary circle size="tiny" :aria-label="t.verQr" @click="verQr = true">
                  <template #icon
                    ><NIcon><QrCode /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.verQr }}
            </NTooltip>
            <NTooltip>
              <template #trigger>
                <NButton
                  quaternary
                  circle
                  size="tiny"
                  :aria-label="t.caBoton"
                  @click="verCa = true"
                >
                  <template #icon
                    ><NIcon><PhonePortrait /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.caBoton }}
            </NTooltip>
          </span>
          <NButton text size="tiny" class="ayuda" @click="alternarFirewall">
            {{ t.firewallTitulo }}
          </NButton>
        </template>

        <span v-else class="tenue">{{ t.apagadoAyuda }}</span>
      </div>
    </div>

    <div v-if="activo && compartido && verFirewall" class="firewall" role="note">
      <p>{{ t.firewallTexto }}</p>
      <div class="comando">
        <code>{{ comando }}</code>
        <NButton size="tiny" secondary :disabled="!comando" @click="copiar(comando)">
          {{ t.copiarComando }}
        </NButton>
      </div>
    </div>

    <DialogoQr
      v-if="compartido"
      v-model:show="verQr"
      :texto="compartido.url"
      :titulo="t.qrTitulo(sitio.dominio)"
      :aviso="t.qrAviso"
    />
    <DialogoCaMovil v-model:show="verCa" :ip="compartido?.ip ?? ''" />

    <NModal
      v-model:show="confirmando"
      preset="card"
      role="alertdialog"
      :title="t.confirmarTitulo"
      :style="{ width: 'min(480px, 92vw)' }"
      :segmented="{ content: true }"
    >
      <div class="confirmar">
        <label v-if="opcionesIp.length > 1" class="campo">
          <span class="tenue">{{ t.ipEtiqueta }}</span>
          <Desplegable v-model:value="ip" :options="opcionesIp" size="small" />
        </label>
        <p>{{ t.confirmarTexto(sitio.dominio, ip) }}</p>
        <NAlert v-if="redPublica" type="warning" :show-icon="false">{{ t.redPublica }}</NAlert>
        <div class="campo">
          <NCheckbox v-model:checked="https" :disabled="httpsObligatorio">
            {{ t.https }}
          </NCheckbox>
          <span class="tenue">{{ httpsObligatorio ? t.httpsObligatorio : t.httpsAyuda }}</span>
        </div>
      </div>
      <template #footer>
        <div class="pie">
          <NButton @click="confirmando = false">{{ textos.acciones.cancelar }}</NButton>
          <NButton type="warning" :disabled="!puedeConfirmar" @click="compartir">
            {{ t.compartir }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.lan {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
}
.fila {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 28px;
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
  opacity: 0.72;
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
.ayuda {
  flex: none;
  opacity: 0.75;
}
.firewall {
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  padding: 8px 10px;
}
.firewall p {
  margin: 0 0 6px;
  opacity: 0.8;
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
.confirmar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.confirmar p {
  margin: 0;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
