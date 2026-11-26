<script setup lang="ts">
import { Checkmark, RocketOutline } from '@vicons/ionicons5';
import { NButton, NCard, NForm, NFormItem, NIcon, useNotification } from 'naive-ui';
import { computed } from 'vue';
import { mensajeDeError } from '../composables/useAccion';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';
import { usePreferencias } from '../stores/preferencias';
import { ACENTOS, acentoDe } from '../tema';
import SelectorIdioma from './SelectorIdioma.vue';
import SelectorTema from './SelectorTema.vue';

/** Ajustes → Apariencia e idioma: tema, idioma, acento y el asistente de primer uso. */
const t = textos.preferencias;
const preferencias = usePreferencias();
const notification = useNotification();

/** Acento elegido: el de la tabla, o null si es un color propio puesto a mano. */
const actual = computed(() => acentoDe(preferencias.acento));

async function elegirAcento(claro: string): Promise<void> {
  try {
    // El índigo es el predeterminado: se guarda como null.
    await preferencias.cambiarAcento(claro === ACENTOS[0].claro ? null : claro);
  } catch (e) {
    notification.error({ title: t.errorGuardar, content: mensajeDeError(e), duration: 6000 });
  }
}
</script>

<template>
  <NCard :title="t.titulo" size="small" class="tarjeta">
    <p class="ayuda-tarjeta">{{ t.descripcion }}</p>
    <NForm label-placement="top" :show-feedback="false">
      <div class="dos">
        <NFormItem :label="t.tema">
          <SelectorTema />
        </NFormItem>
        <NFormItem :label="t.idioma">
          <SelectorIdioma />
        </NFormItem>
      </div>
      <NFormItem :label="t.acento" class="separado">
        <div class="acentos" role="radiogroup" :aria-label="t.acento">
          <button
            v-for="a in ACENTOS"
            :key="a.id"
            type="button"
            role="radio"
            class="acento"
            :class="{ activo: actual?.id === a.id }"
            :aria-checked="actual?.id === a.id"
            :aria-label="t.acentos[a.id]"
            :title="t.acentos[a.id]"
            :style="{ '--muestra': a.claro }"
            @click="elegirAcento(a.claro)"
          >
            <NIcon v-if="actual?.id === a.id" :size="14"><Checkmark /></NIcon>
          </button>
          <span v-if="!actual && preferencias.acento" class="propio">
            {{ t.acentoPropio(preferencias.acento) }}
          </span>
        </div>
      </NFormItem>
    </NForm>
    <div class="asistente">
      <div>
        <strong>{{ t.asistente }}</strong>
        <small class="ayuda">{{ t.asistenteAyuda }}</small>
      </div>
      <NButton secondary size="small" @click="solicitudes.asistente = true">
        <template #icon
          ><NIcon><RocketOutline /></NIcon
        ></template>
        {{ t.asistenteAbrir }}
      </NButton>
    </div>
  </NCard>
</template>

<style scoped>
.ayuda-tarjeta {
  margin: -4px 0 14px;
  font-size: 12.5px;
  opacity: 0.75;
}
.dos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.separado {
  margin-top: 16px;
}
.acentos {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.acento {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: var(--muestra);
  color: #fff;
  cursor: pointer;
  outline-offset: 2px;
  transition:
    transform var(--transicion) ease,
    box-shadow var(--transicion) ease;
}
.acento:hover {
  transform: scale(1.08);
}
.acento.activo {
  box-shadow:
    0 0 0 2px var(--n-color, transparent),
    0 0 0 4px var(--muestra);
}
.acento:focus-visible {
  outline: 2px solid var(--muestra);
}
.propio {
  font-size: 12.5px;
  opacity: 0.76;
}
.asistente {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(128, 128, 128, 0.18);
}
.asistente > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ayuda {
  font-size: 12px;
  opacity: 0.72;
}
@media (prefers-reduced-motion: reduce) {
  .acento {
    transition: none;
  }
}
</style>
