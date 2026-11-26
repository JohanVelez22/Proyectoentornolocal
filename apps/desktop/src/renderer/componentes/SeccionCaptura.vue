<script setup lang="ts">
import { Camera } from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NIcon,
  NRadioButton,
  NRadioGroup,
  NSkeleton,
  NSwitch,
  useMessage,
} from 'naive-ui';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ATAJO_CAPTURA_POR_DEFECTO, type FormatoCaptura } from '@pel/core';
import type { EstadoCapturaUi } from '../../shared/api';
import { api } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { atajoDePulsacion } from '../utilidades/atajo';

/**
 * Captura de pantalla (D35). El atajo global NO se registra hasta que el usuario lo activa aquí:
 * si otro programa ya lo usa, no se pisa y se avisa. El permiso de grabación de pantalla de
 * macOS se pide la primera vez que se captura.
 */
const t = textos.captura.ajustes;
const { ejecutar } = useAccion();
const message = useMessage();

const estado = ref<EstadoCapturaUi | null>(null);
const errorCarga = ref<string | null>(null);
const grabando = ref(false);
const aviso = ref<string | null>(null);

async function cargar(): Promise<void> {
  try {
    estado.value = await api().captura.leer();
    errorCarga.value = null;
    aviso.value = estado.value.atajoOcupado ? t.ocupadoInicio : null;
  } catch (e) {
    errorCarga.value = mensajeDeError(e);
  }
}

/** Guarda un cambio; si el atajo está ocupado no se guarda nada y se explica. */
async function guardar(cambios: {
  atajo?: string | null;
  formato?: FormatoCaptura;
}): Promise<void> {
  const r = await ejecutar('captura', () => api().captura.guardarConfig(cambios));
  if (!r) return;
  if (!r.atajo.ok) {
    aviso.value = t.ocupado(cambios.atajo ?? '');
    return;
  }
  aviso.value = null;
  if (cambios.atajo !== undefined) {
    message.success(cambios.atajo ? t.activado(cambios.atajo) : t.desactivado);
  } else {
    message.success(t.formatoGuardado);
  }
  await cargar();
}

function alternar(activo: boolean): void {
  grabando.value = false;
  void guardar({ atajo: activo ? ATAJO_CAPTURA_POR_DEFECTO : null });
}

function alPulsar(e: KeyboardEvent): void {
  if (!grabando.value) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') {
    grabando.value = false;
    return;
  }
  const atajo = atajoDePulsacion(e);
  if (!atajo) return;
  grabando.value = false;
  void guardar({ atajo });
}

onMounted(() => {
  void cargar();
  window.addEventListener('keydown', alPulsar, true);
});
onBeforeUnmount(() => window.removeEventListener('keydown', alPulsar, true));
</script>

<template>
  <NCard size="small" class="tarjeta">
    <template #header>
      <span class="titulo-tarjeta">
        <NIcon :size="16"><Camera /></NIcon>
        {{ t.titulo }}
      </span>
    </template>
    <p class="ayuda texto">{{ t.descripcion }}</p>
    <span v-if="errorCarga && !estado" class="ayuda error">{{ errorCarga }}</span>
    <NSkeleton v-else-if="!estado" text :width="200" />
    <template v-else>
      <div class="fila">
        <span class="etiqueta">{{ t.activar }}</span>
        <NSwitch
          :value="estado.config.atajo !== null"
          :aria-label="t.activar"
          :disabled="!estado.sistema.disponible"
          @update:value="alternar"
        />
      </div>
      <small class="ayuda">{{ t.activarAyuda }}</small>
      <div v-if="estado.config.atajo !== null" class="fila">
        <span class="etiqueta">{{ t.atajo }}</span>
        <span class="atajo">
          <kbd>{{ grabando ? t.grabando : estado.config.atajo }}</kbd>
          <NButton size="small" secondary @click="grabando = !grabando">
            {{ t.grabar }}
          </NButton>
        </span>
      </div>
      <small v-if="grabando" class="ayuda">{{ t.grabandoAyuda }}</small>
      <div class="fila">
        <span class="etiqueta">{{ t.formato }}</span>
        <NRadioGroup
          :value="estado.config.formato"
          size="small"
          @update:value="(f: FormatoCaptura) => void guardar({ formato: f })"
        >
          <NRadioButton value="png">PNG</NRadioButton>
          <NRadioButton value="jpg">JPG</NRadioButton>
        </NRadioGroup>
      </div>
      <p v-if="aviso" class="ayuda error" role="alert">{{ aviso }}</p>
      <small v-if="estado.sistema.permiso !== 'no_aplica'" class="ayuda">{{ t.sinPermiso }}</small>
    </template>
  </NCard>
</template>

<style scoped>
.tarjeta {
  border-radius: 12px;
  margin-bottom: 14px;
  max-width: 760px;
}
.titulo-tarjeta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.texto {
  display: block;
  margin: 0 0 12px;
}
.fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  width: 100%;
  margin-top: 6px;
}
.ayuda {
  display: block;
  font-size: 12px;
  opacity: 0.6;
}
.ayuda.error {
  color: var(--texto-error);
  opacity: 1;
}
.atajo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
kbd {
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  background: rgba(128, 128, 128, 0.12);
  font: 12px var(--fuente-mono);
}
</style>
