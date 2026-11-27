<script setup lang="ts">
import { LanguageOutline } from '@vicons/ionicons5';
import { NButton, NIcon, useNotification } from 'naive-ui';
import { computed, h } from 'vue';
import { mensajeDeError } from '../composables/useAccion';
import { IDIOMAS, diccionarios, esIdiomaBase, idioma, textos, type Idioma } from '../i18n';
import { usePreferencias } from '../stores/preferencias';
import MenuDesplegable from './MenuDesplegable.vue';

/**
 * Idioma de la interfaz (registro IDIOMAS): botón con menú (barra superior) o lista (Ajustes).
 * Cada idioma va con su nombre nativo; los que no son es, en, pt ni fr llevan además el aviso
 * «Traducción automática revisada» en el idioma activo y, al pasar el cursor, en el propio.
 */
defineProps<{ compacto?: boolean }>();

const t = textos.preferencias;
const preferencias = usePreferencias();
const notification = useNotification();

/** Aviso de un idioma automático, en el idioma activo; '' en los cuatro idiomas base. */
const avisoDe = (i: Idioma): string => (esIdiomaBase(i) ? '' : t.traduccionAutomatica);
/** El mismo aviso escrito en el propio idioma (para el `title`). */
const avisoPropio = (i: Idioma): string =>
  esIdiomaBase(i) ? '' : diccionarios[i].preferencias.traduccionAutomatica;

const opciones = computed(() =>
  IDIOMAS.map((i) => ({
    key: i.id,
    // `lang` hace que el sistema elija la fuente correcta (chino y japonés comparten caracteres).
    props: { lang: i.id, title: avisoPropio(i.id) || undefined },
    label: () => [
      h('span', { class: 'idioma-nombre' }, i.nombreNativo),
      avisoDe(i.id)
        ? h('span', { class: 'idioma-aviso', lang: idioma.value }, avisoDe(i.id))
        : null,
    ],
  })),
);

async function elegir(i: Idioma): Promise<void> {
  if (i === idioma.value) return;
  try {
    await preferencias.cambiarIdioma(i);
  } catch (e) {
    notification.error({ title: t.errorGuardar, content: mensajeDeError(e), duration: 6000 });
  }
}
</script>

<template>
  <MenuDesplegable
    v-if="compacto"
    trigger="click"
    :options="opciones"
    :value="idioma"
    @select="(k: Idioma) => elegir(k)"
  >
    <NButton quaternary size="small" :aria-label="textos.barra.idioma" :title="textos.barra.idioma">
      <template #icon>
        <NIcon><LanguageOutline /></NIcon>
      </template>
      <span class="codigo">{{ idioma.toUpperCase() }}</span>
    </NButton>
  </MenuDesplegable>
  <div v-else class="lista" role="radiogroup" :aria-label="t.idioma">
    <button
      v-for="i in IDIOMAS"
      :key="i.id"
      type="button"
      role="radio"
      class="opcion"
      :class="{ activo: i.id === idioma }"
      :aria-checked="i.id === idioma"
      :lang="i.id"
      :title="avisoPropio(i.id) || undefined"
      :data-testid="`idioma-${i.id}`"
      @click="elegir(i.id)"
    >
      <span class="nombre">{{ i.nombreNativo }}</span>
      <span v-if="avisoDe(i.id)" class="aviso" :lang="idioma">{{ avisoDe(i.id) }}</span>
    </button>
  </div>
</template>

<style scoped>
.codigo {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  width: 100%;
}

.opcion {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 44px;
  padding: 6px 12px;
  text-align: start;
  color: inherit;
  font: inherit;
  background: transparent;
  border: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.35));
  border-radius: 6px;
  cursor: pointer;
}

.opcion:hover {
  background: rgba(var(--acento-rgb, 99, 102, 241), 0.08);
}

.opcion.activo {
  border-color: var(--acento);
  background: rgba(var(--acento-rgb, 99, 102, 241), 0.14);
}

.opcion:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}

.nombre {
  font-weight: 600;
}

.aviso {
  font-size: 11px;
  line-height: 1.3;
  opacity: 0.75;
}
</style>

<style>
/* Las etiquetas del menú las pinta Naive fuera de este componente: sin `scoped`. */
.idioma-nombre {
  font-weight: 600;
}

.idioma-aviso {
  display: block;
  font-size: 11px;
  line-height: 1.3;
  opacity: 0.75;
}
</style>
