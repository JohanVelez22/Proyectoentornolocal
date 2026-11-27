<script setup lang="ts">
import { Copy, Search } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NInput, NTag } from 'naive-ui';
import { computed, defineAsyncComponent, ref } from 'vue';
import { useCopiar } from '../../composables/useHerramienta';
import { idioma, textos } from '../../i18n';
import {
  contenidoGit,
  filtrarTemasGit,
  GRUPOS_GIT,
  textoEn,
  type GrupoGit,
} from '../../utilidades/guias';

/** Guía de Git y GitHub (D50): contenido estático empaquetado y un laboratorio para practicar. */
const LaboratorioGit = defineAsyncComponent(() => import('./LaboratorioGit.vue'));
const t = textos.guias.git;
const copiar = useCopiar();

const modo = ref<'guia' | 'laboratorio'>('guia');
const consulta = ref('');
const grupo = ref<GrupoGit | null>(null);

const temas = computed(() =>
  filtrarTemasGit(contenidoGit.temas, idioma.value, consulta.value, grupo.value),
);
</script>

<template>
  <div class="herr">
    <div class="herr-fila" role="group">
      <NButton
        size="small"
        :type="modo === 'guia' ? 'primary' : 'default'"
        :secondary="modo === 'guia'"
        :aria-pressed="modo === 'guia'"
        data-testid="git-modo-guia"
        @click="modo = 'guia'"
      >
        {{ t.verGuia }}
      </NButton>
      <NButton
        size="small"
        :type="modo === 'laboratorio' ? 'primary' : 'default'"
        :secondary="modo === 'laboratorio'"
        :aria-pressed="modo === 'laboratorio'"
        data-testid="git-modo-laboratorio"
        @click="modo = 'laboratorio'"
      >
        {{ t.verLaboratorio }}
      </NButton>
    </div>

    <LaboratorioGit v-if="modo === 'laboratorio'" />

    <template v-else>
      <NInput v-model:value="consulta" clearable :placeholder="t.buscar" :aria-label="t.buscar">
        <template #prefix
          ><NIcon><Search /></NIcon
        ></template>
      </NInput>

      <div class="herr-fila" role="group">
        <NButton
          size="tiny"
          :type="grupo === null ? 'primary' : 'default'"
          :secondary="grupo === null"
          :aria-pressed="grupo === null"
          @click="grupo = null"
        >
          {{ t.todos }}
        </NButton>
        <NButton
          v-for="g in GRUPOS_GIT"
          :key="g"
          size="tiny"
          :type="grupo === g ? 'primary' : 'default'"
          :secondary="grupo === g"
          :aria-pressed="grupo === g"
          @click="grupo = g"
        >
          {{ t.grupos[g] }}
        </NButton>
      </div>

      <p class="herr-tenue" aria-live="polite">{{ t.resultados(temas.length) }}</p>

      <details v-for="x in temas" :key="x.id" class="item" :data-testid="`git-tema-${x.id}`">
        <summary>
          <span class="num">{{ x.nombre }}</span>
          <span class="nombre">{{ textoEn(x, idioma).texto.titulo }}</span>
          <NTag v-if="x.peligroso" size="small" type="error" :bordered="false">
            {{ t.peligroso }}
          </NTag>
          <NTag v-if="x.grupo === 'github'" size="small" :bordered="false">GitHub</NTag>
          <span class="resumen">{{ textoEn(x, idioma).texto.resumen }}</span>
        </summary>
        <div class="cuerpo">
          <p v-if="!textoEn(x, idioma).traducido" class="herr-tenue">{{ t.sinTraduccion }}</p>
          <p v-if="x.grupo === 'github'" class="herr-tenue">{{ t.avisoGithub }}</p>
          <p>{{ textoEn(x, idioma).texto.explicacion }}</p>
          <strong>{{ t.ejemplo }}</strong>
          <div class="bloque">
            <pre>{{ textoEn(x, idioma).texto.ejemplo }}</pre>
            <NButton
              size="tiny"
              quaternary
              class="copiar"
              :aria-label="t.copiarEjemplo"
              :title="t.copiarEjemplo"
              @click="copiar(textoEn(x, idioma).texto.ejemplo)"
            >
              <template #icon
                ><NIcon><Copy /></NIcon
              ></template>
            </NButton>
          </div>
          <strong>{{ t.errores }}</strong>
          <ul>
            <li v-for="(e, i) in textoEn(x, idioma).texto.erroresComunes" :key="i">{{ e }}</li>
          </ul>
          <NButton v-if="x.grupo !== 'github'" size="small" secondary @click="modo = 'laboratorio'">
            {{ t.irLaboratorio }}
          </NButton>
        </div>
      </details>

      <NEmpty v-if="temas.length === 0" :description="t.vacio" />
    </template>
  </div>
</template>

<style scoped>
.item {
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 10px;
  padding: 0 12px;
}
.item summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  cursor: pointer;
}
.item summary:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}
.num {
  font-family: var(--fuente-mono);
  font-weight: 700;
}
.nombre {
  font-weight: 600;
}
.resumen {
  flex-basis: 100%;
  font-size: 12.5px;
  opacity: 0.76;
}
.cuerpo {
  padding-bottom: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  word-break: break-word;
}
.cuerpo ul {
  margin: 4px 0 10px;
  padding-left: 20px;
}
.bloque {
  position: relative;
  margin: 6px 0 10px;
}
.bloque pre {
  margin: 0;
  padding: 10px 44px 10px 12px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.copiar {
  position: absolute;
  top: 6px;
  right: 6px;
}
</style>
