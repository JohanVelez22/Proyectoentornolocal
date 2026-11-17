<script setup lang="ts">
import { Copy } from '@vicons/ionicons5';
import { NAlert, NButton, NIcon, NModal, NSpace, NTag, useMessage } from 'naive-ui';
import { computed, ref } from 'vue';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { useHosts } from '../stores/hosts';
import type { FalloHosts } from '../utilidades/sitios';

/**
 * Aviso persistente de dominios que faltan en el archivo hosts, con "Corregir"/"Reintentar con
 * permiso" y las instrucciones para hacerlo a mano. El fallo puede venir de fuera (al guardar un
 * sitio) con `v-model:fallo`; sin enlazarlo, el componente lo guarda por su cuenta.
 */
const fallo = defineModel<FalloHosts | null>('fallo', { default: null });

const t = es.inicio.hosts;
const hosts = useHosts();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const verInstrucciones = ref(false);
const visible = computed(() => hosts.pendientes.length > 0 || !!fallo.value);
const textoMotivo = computed(() =>
  fallo.value ? (t.motivos[fallo.value.motivo] ?? fallo.value.motivo) : '',
);

async function corregir(): Promise<void> {
  const r = await ejecutar('hosts', () => hosts.sincronizar(), { tituloError: t.fallo });
  if (!r) return;
  if (r.ok) {
    fallo.value = null;
    message.success(t.corregido);
  } else {
    fallo.value = { motivo: r.motivo, comandoManual: r.comandoManual };
  }
}

function copiar(): void {
  const comando = fallo.value?.comandoManual;
  if (!comando) return;
  void ejecutar('copiar', () => api().sistema.copiar(comando), { exito: es.acciones.copiado });
}
</script>

<template>
  <NAlert v-if="visible" type="warning" :title="t.titulo" class="aviso-hosts">
    <p class="aviso-texto">{{ t.texto }}</p>
    <NSpace v-if="hosts.pendientes.length" size="small" class="dominios">
      <NTag v-for="d in hosts.pendientes" :key="d" size="small" :bordered="false">{{ d }}</NTag>
    </NSpace>
    <NAlert v-if="fallo" type="error" :show-icon="false" class="fallo">
      {{ textoMotivo }}
    </NAlert>
    <NSpace size="small">
      <NButton type="warning" :loading="ocupado('hosts')" @click="corregir">
        {{ fallo ? t.reintentarPermiso : t.corregir }}
      </NButton>
      <NButton v-if="fallo?.comandoManual" secondary @click="verInstrucciones = true">
        {{ t.verInstrucciones }}
      </NButton>
    </NSpace>

    <NModal
      v-model:show="verInstrucciones"
      preset="card"
      :title="t.modalTitulo"
      :style="{ width: '640px', maxWidth: '92vw' }"
    >
      <p class="aviso-texto">{{ t.modalTexto }}</p>
      <pre class="comando">{{ fallo?.comandoManual }}</pre>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="verInstrucciones = false">{{ es.acciones.cerrar }}</NButton>
          <NButton type="primary" :loading="ocupado('copiar')" @click="copiar">
            <template #icon
              ><NIcon><Copy /></NIcon
            ></template>
            {{ es.acciones.copiar }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NAlert>
</template>

<style scoped>
.aviso-hosts {
  margin-bottom: 18px;
}
.aviso-texto {
  margin: 0 0 10px;
}
.dominios {
  margin: 8px 0 12px;
}
.fallo {
  margin-bottom: 12px;
}
.comando {
  margin: 0;
  padding: 12px 14px;
  max-height: 220px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: all;
}
</style>
