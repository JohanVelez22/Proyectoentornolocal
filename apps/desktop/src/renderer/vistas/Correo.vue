<script setup lang="ts">
import { Copy, Mail, MailUnread, Open, Power, Refresh } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NSkeleton, NTooltip } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import EstadoPunto from '../componentes/EstadoPunto.vue';
import { useAccion } from '../composables/useAccion';
import { useNoLeidos } from '../composables/useNoLeidos';
import { es } from '../i18n/es';
import { useServicios } from '../stores/servicios';
import {
  PUERTO_BUZON,
  PUERTO_SMTP_POR_DEFECTO,
  URL_BUZON,
  bloqueEnvCorreo,
} from '../utilidades/correo';

const t = es.correo;
const router = useRouter();
const servicios = useServicios();
const { ejecutar, ocupado } = useAccion();
const { noLeidos, error, cargando, encendido, actualizar } = useNoLeidos();

const instaladosListos = ref(false);
const servicio = computed(() => servicios.porId['mailpit']);
/** Sin estado en el núcleo y sin versiones instaladas: no está instalado. */
const sinInstalar = computed(
  () =>
    instaladosListos.value &&
    !servicio.value &&
    (servicios.instalados['mailpit']?.length ?? 0) === 0,
);
const puertoSmtp = computed(() => servicio.value?.puertos[0] ?? PUERTO_SMTP_POR_DEFECTO);
const bloque = computed(() => bloqueEnvCorreo(puertoSmtp.value));

onMounted(() => {
  void servicios
    .cargarInstalados('mailpit')
    .catch(() => undefined)
    .finally(() => (instaladosListos.value = true));
});

function encender(): void {
  if (ocupado('encender')) return;
  void ejecutar('encender', () => api().servicios.iniciar('mailpit'));
}
function abrirBuzon(): void {
  void ejecutar('buzon', () => api().sistema.abrirUrl(URL_BUZON));
}
function copiar(texto: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(texto), { exito: es.acciones.copiado });
}
function irAServicios(): void {
  void router.push({ name: 'servicios' });
}
</script>

<template>
  <div class="correo">
    <p class="descripcion">{{ t.descripcion }}</p>

    <NSkeleton v-if="!instaladosListos && !servicio" height="120px" class="esqueleto" />

    <!-- Sin instalar -->
    <div v-else-if="sinInstalar" class="vacio">
      <NEmpty size="large">
        <template #icon
          ><NIcon><Mail /></NIcon
        ></template>
        <template #default>
          <strong class="vacio-titulo">{{ t.sinInstalarTitulo }}</strong>
          <span class="vacio-texto">{{ t.sinInstalar }}</span>
        </template>
        <template #extra>
          <NButton type="primary" @click="irAServicios">{{ t.irAServicios }}</NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Apagado, encendiéndose o con error -->
    <div v-else-if="!encendido" class="apagado">
      <span class="apagado-icono"
        ><NIcon :size="22"><Power /></NIcon
      ></span>
      <div class="apagado-texto">
        <strong>
          {{
            servicio?.estado === 'iniciando'
              ? t.iniciando
              : servicio?.estado === 'error'
                ? t.errorTitulo
                : t.apagadoTitulo
          }}
        </strong>
        <span v-if="servicio?.estado === 'error' && servicio.mensaje" class="apagado-mensaje">
          {{ servicio.mensaje }}
        </span>
        <span v-else>{{ t.apagado }}</span>
      </div>
      <div class="apagado-botones">
        <NButton
          size="small"
          type="primary"
          :loading="ocupado('encender') || servicio?.estado === 'iniciando'"
          :disabled="servicio?.estado === 'iniciando'"
          @click="encender"
        >
          <template #icon
            ><NIcon><Power /></NIcon
          ></template>
          {{ t.encender }}
        </NButton>
        <NButton size="small" quaternary @click="irAServicios">{{ t.verServicios }}</NButton>
      </div>
    </div>

    <!-- Encendido -->
    <section v-else class="panel">
      <div class="contador" :aria-busy="cargando">
        <span class="contador-icono"
          ><NIcon :size="22"><MailUnread /></NIcon
        ></span>
        <div class="contador-texto">
          <span class="contador-etiqueta">{{ t.noLeidos }}</span>
          <strong class="contador-valor" aria-live="polite">
            {{ noLeidos === null ? es.inicioExtra.sinDato : noLeidos }}
          </strong>
          <span v-if="error" class="error" role="alert">{{ t.noLeidosError }}: {{ error }}</span>
          <span v-else-if="noLeidos !== null" class="sr-only">{{ t.noLeidosValor(noLeidos) }}</span>
          <small class="tenue">{{ t.actualizaSolo }}</small>
        </div>
        <NTooltip>
          <template #trigger>
            <NButton
              quaternary
              circle
              size="small"
              :aria-label="t.actualizar"
              :loading="cargando"
              @click="actualizar"
            >
              <template #icon
                ><NIcon><Refresh /></NIcon
              ></template>
            </NButton>
          </template>
          {{ t.actualizar }}
        </NTooltip>
      </div>

      <dl class="datos">
        <div class="dato">
          <dt>{{ t.estado }}</dt>
          <dd><EstadoPunto :estado="servicio?.estado ?? 'apagado'" /></dd>
        </div>
        <div class="dato">
          <dt>{{ t.smtp }}</dt>
          <dd>
            <code>127.0.0.1:{{ puertoSmtp }}</code>
          </dd>
        </div>
        <div class="dato">
          <dt>{{ t.buzon }}</dt>
          <dd>
            <code>127.0.0.1:{{ PUERTO_BUZON }}</code>
          </dd>
        </div>
      </dl>

      <NButton type="primary" :loading="ocupado('buzon')" class="abrir" @click="abrirBuzon">
        <template #icon
          ><NIcon><Open /></NIcon
        ></template>
        {{ t.abrirBuzon }}
      </NButton>
    </section>

    <!-- Bloque .env: útil aunque Mailpit esté apagado -->
    <section v-if="!sinInstalar" class="env">
      <div class="env-cabeza">
        <span>{{ t.env }}</span>
        <NButton size="tiny" secondary @click="copiar(bloque)">
          <template #icon
            ><NIcon><Copy /></NIcon
          ></template>
          {{ t.copiarEnv }}
        </NButton>
      </div>
      <pre class="bloque">{{ bloque }}</pre>
      <small class="tenue">{{ t.envAyuda }}</small>
    </section>
  </div>
</template>

<style scoped>
.descripcion {
  margin: 0 0 18px;
  opacity: 0.65;
}
.esqueleto {
  border-radius: 12px;
}
.vacio {
  padding: 48px 0 40px;
  border: 1px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
}
.vacio-titulo {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  text-align: center;
}
.vacio-texto {
  display: block;
  max-width: 380px;
  margin: 0 auto;
  text-align: center;
}
.apagado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  border: 1px dashed rgba(128, 128, 128, 0.35);
  margin-bottom: 16px;
}
.apagado-icono {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(128, 128, 128, 0.1);
  flex: none;
}
.apagado-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 220px;
  font-size: 13px;
}
.apagado-texto strong {
  font-size: 14.5px;
}
.apagado-texto span {
  opacity: 0.7;
}
.apagado-mensaje {
  color: #dc2626;
  opacity: 1 !important;
  white-space: pre-wrap;
}
.apagado-botones {
  display: flex;
  gap: 6px;
}
.panel {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 1.4fr);
  align-items: center;
  gap: 16px 24px;
  padding: 18px 20px;
  margin-bottom: 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.04);
}
.contador {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.contador-icono {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: #6470e0;
  background: rgba(79, 91, 213, 0.12);
  flex: none;
}
.contador-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.contador-etiqueta {
  font-size: 12.5px;
  opacity: 0.7;
}
.contador-valor {
  font-size: 30px;
  font-weight: 650;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.error {
  color: #dc2626;
  font-size: 12.5px;
}
.datos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 0;
}
.dato dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.dato dd {
  margin: 4px 0 0;
}
.dato code {
  font-family: var(--fuente-mono);
  font-size: 13px;
}
.abrir {
  justify-self: start;
}
.env {
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
}
.env-cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}
.bloque {
  margin: 0 0 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
}
.tenue {
  font-size: 12px;
  opacity: 0.6;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
@media (max-width: 900px) {
  .panel {
    grid-template-columns: 1fr;
  }
}
</style>
