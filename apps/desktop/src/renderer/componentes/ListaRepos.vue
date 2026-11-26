<script setup lang="ts">
import { LockClosed, Search } from '@vicons/ionicons5';
import { NAlert, NButton, NEmpty, NIcon, NInput, NSpin, NTag, NTooltip } from 'naive-ui';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { mensajeDeError } from '../composables/useAccion';
import { formatearFecha, textos } from '../i18n';
import { useProyectos } from '../stores/proyectos';
import type { RepoConMarca } from '../utilidades/proyectos';

/** Repos de GitHub del usuario (propios, de colaborador y de organizaciones), con buscador. */
defineProps<{ seleccionado: string | null }>();
const emit = defineEmits<{ elegir: [repo: RepoConMarca] }>();

const t = textos.proyectos.github;
const proyectos = useProyectos();
const buscar = ref(proyectos.buscarRepos);
const cargando = ref(false);
const error = ref<string | null>(null);
let reloj: ReturnType<typeof setTimeout> | undefined;

async function cargar(mas = false): Promise<void> {
  cargando.value = true;
  error.value = null;
  try {
    await proyectos.cargarRepos(buscar.value, mas);
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    cargando.value = false;
  }
}

watch(buscar, () => {
  clearTimeout(reloj);
  reloj = setTimeout(() => void cargar(), 350);
});
onMounted(() => void cargar());
onBeforeUnmount(() => clearTimeout(reloj));

const fecha = (iso: string): string => formatearFecha(iso, { dateStyle: 'medium' });
</script>

<template>
  <div class="repos">
    <NInput
      v-model:value="buscar"
      size="small"
      clearable
      :placeholder="t.buscar"
      :aria-label="t.buscar"
    >
      <template #prefix
        ><NIcon><Search /></NIcon
      ></template>
    </NInput>
    <NAlert v-if="error" type="error" :title="t.errorRepos" class="alerta">{{ error }}</NAlert>
    <NSpin :show="cargando && !proyectos.reposMarcados.length" :description="t.cargando">
      <ul class="lista" role="listbox" :aria-label="t.buscar">
        <li
          v-for="r in proyectos.reposMarcados"
          :key="r.completo"
          class="repo"
          :class="{ activo: seleccionado === r.completo }"
          role="option"
          :aria-selected="seleccionado === r.completo"
          tabindex="0"
          @click="emit('elegir', r)"
          @keydown.enter.prevent="emit('elegir', r)"
          @keydown.space.prevent="emit('elegir', r)"
        >
          <div class="linea">
            <strong class="nombre">{{ r.completo }}</strong>
            <NTag v-if="r.privado" size="tiny" :bordered="false" type="warning">
              <template #icon
                ><NIcon><LockClosed /></NIcon
              ></template>
              {{ t.privado }}
            </NTag>
            <NTooltip v-if="r.yaClonado">
              <template #trigger>
                <NTag size="tiny" :bordered="false" type="success">{{ t.yaClonado }}</NTag>
              </template>
              {{ t.yaClonadoAyuda }}
            </NTooltip>
            <span v-if="fecha(r.actualizado)" class="fecha">{{
              t.actualizado(fecha(r.actualizado))
            }}</span>
          </div>
          <p v-if="r.descripcion" class="descripcion">{{ r.descripcion }}</p>
        </li>
      </ul>
      <NEmpty
        v-if="!cargando && !error && !proyectos.reposMarcados.length"
        size="small"
        :description="t.sinRepos"
        class="vacio"
      />
    </NSpin>
    <NButton
      v-if="proyectos.hayMasRepos"
      size="small"
      quaternary
      block
      :loading="cargando"
      :disabled="cargando"
      @click="cargar(true)"
    >
      {{ t.cargarMas }}
    </NButton>
  </div>
</template>

<style scoped>
.repos {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alerta {
  margin: 0;
}
.lista {
  margin: 0;
  padding: 0;
  max-height: 260px;
  min-height: 80px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.repo {
  list-style: none;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
}
.repo:hover {
  background: rgba(128, 128, 128, 0.08);
}
.repo:focus-visible {
  outline: 2px solid #6470e0;
  outline-offset: 1px;
}
.repo.activo {
  border-color: rgba(100, 112, 224, 0.55);
  background: rgba(100, 112, 224, 0.1);
}
.linea {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.nombre {
  font-size: 13px;
  font-weight: 600;
  font-family: var(--fuente-mono);
}
.fecha {
  margin-left: auto;
  font-size: 11.5px;
  opacity: 0.72;
}
.descripcion {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.75;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vacio {
  padding: 16px 0;
}
</style>
