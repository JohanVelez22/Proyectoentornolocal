<script setup lang="ts">
import { Copy, MailUnread, Refresh } from '@vicons/ionicons5';
import { NButton, NIcon, NTooltip } from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { EstadoCaptador, IdCaptador } from '../../shared/api';
import { api } from '../api';
import SeccionCaptadores from '../componentes/SeccionCaptadores.vue';
import SeccionProveedoresSmtp from '../componentes/SeccionProveedoresSmtp.vue';
import { useAccion, mensajeDeError } from '../composables/useAccion';
import { useNoLeidos } from '../composables/useNoLeidos';
import { textos } from '../i18n';
import { CAPTADORES_CORREO, useServicios } from '../stores/servicios';
import { bloqueEnvCorreo } from '../utilidades/correo';

const t = textos.correo;
const router = useRouter();
const servicios = useServicios();
const { ejecutar } = useAccion();
const { noLeidos, error, cargando, actualizar } = useNoLeidos();

const captadores = ref<EstadoCaptador[] | null>(null);
const errorLista = ref<string | null>(null);
const ocupado = ref<IdCaptador | null>(null);

async function recargar(): Promise<void> {
  try {
    captadores.value = await api().correo.captadores();
    errorLista.value = null;
  } catch (e) {
    errorLista.value = mensajeDeError(e);
  }
}

/** El captador que reciben los proyectos y su puerto SMTP (para el bloque del .env). */
const elegido = computed(() => captadores.value?.find((c) => c.elegido) ?? null);
const bloque = computed(() => bloqueEnvCorreo(elegido.value?.puertoSmtp));
const mostrarNoLeidos = computed(() => elegido.value?.id === 'mailpit' && elegido.value.encendido);

onMounted(() => void recargar());
// Los estados llegan por eventos: la lista se lee de nuevo cuando cambia el de algún captador.
watch(
  () => [...CAPTADORES_CORREO].map((id) => servicios.porId[id]?.estado ?? '').join('|'),
  () => void recargar(),
);

async function usar(id: IdCaptador): Promise<void> {
  ocupado.value = id;
  try {
    await ejecutar('usar', () => api().correo.elegir(id));
  } finally {
    ocupado.value = null;
    await recargar();
  }
}
async function apagar(id: IdCaptador): Promise<void> {
  ocupado.value = id;
  try {
    await ejecutar('apagar', () => api().servicios.detener(id));
  } finally {
    ocupado.value = null;
    await recargar();
  }
}
function abrir(c: EstadoCaptador): void {
  void ejecutar('buzon', () => api().sistema.abrirUrl(c.urlWeb));
}
function instalar(id: IdCaptador): void {
  void router.push({ name: 'servicios.versiones', params: { servicio: id } });
}
function copiar(texto: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(texto), { exito: textos.acciones.copiado });
}
</script>

<template>
  <div class="correo">
    <p class="descripcion">{{ t.descripcion }}</p>

    <SeccionCaptadores
      :captadores="captadores"
      :ocupado="ocupado"
      :error="errorLista"
      @usar="usar"
      @apagar="apagar"
      @abrir="abrir"
      @instalar="instalar"
    />

    <!-- Solo Mailpit expone el conteo de correos sin leer -->
    <section v-if="mostrarNoLeidos" class="panel">
      <div class="contador" :aria-busy="cargando">
        <span class="contador-icono"
          ><NIcon :size="22"><MailUnread /></NIcon
        ></span>
        <div class="contador-texto">
          <span class="contador-etiqueta">{{ t.noLeidos }}</span>
          <strong class="contador-valor" aria-live="polite">
            {{ noLeidos === null ? textos.inicioExtra.sinDato : noLeidos }}
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
    </section>

    <!-- Bloque .env del captador elegido: útil aunque esté apagado -->
    <section v-if="elegido?.instalado" class="env">
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
      <small class="tenue">{{ t.envAyuda(elegido.nombre) }}</small>
    </section>

    <SeccionProveedoresSmtp />
  </div>
</template>

<style scoped>
.descripcion {
  margin: 0 0 18px;
  opacity: 0.75;
}
.panel {
  display: grid;
  grid-template-columns: minmax(260px, 1fr);
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
  color: var(--texto-enlace);
  background: rgba(var(--acento-rgb), 0.12);
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
  opacity: 0.76;
}
.contador-valor {
  font-size: 30px;
  font-weight: 650;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.error {
  color: var(--texto-error);
  font-size: 12.5px;
}
.env {
  padding: 16px 18px;
  margin-bottom: 20px;
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
  opacity: 0.72;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
