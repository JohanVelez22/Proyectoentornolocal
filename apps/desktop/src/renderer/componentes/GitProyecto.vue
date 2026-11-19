<script setup lang="ts">
import { CloudDownload, GitBranch, LogoGithub } from '@vicons/ionicons5';
import { NButton, NCheckbox, NIcon, NModal, NTag, NTooltip, useMessage } from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import type { EstadoGit, PasoReceta as DefPaso, ResultadoTraer, Sitio } from '../../shared/api';
import { api } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useProyectos } from '../stores/proyectos';
import { etiquetaPaso, pasosSugeridos, urlWebRemoto } from '../utilidades/proyectos';
import PasoReceta from './PasoReceta.vue';

/** Rama, cambios locales, "Traer cambios" (con los pasos sugeridos) y el enlace al remoto. */
const props = defineProps<{ sitio: Sitio }>();

const t = textos.proyectos.git;
const tt = textos.proyectos.tarjeta;
const proyectos = useProyectos();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const estado = ref<EstadoGit | null>(null);
const sugeridos = ref<{ paso: DefPaso; activo: boolean }[] | null>(null);
/** Muestra el avance de la corrida suelta de los pasos sugeridos. */
const verCorrida = ref(false);
const corrida = computed(() => proyectos.suelta(props.sitio.id));
const traido = ref<ResultadoTraer | null>(null);

async function cargar(): Promise<void> {
  try {
    estado.value = await api().git.estado(props.sitio.id);
  } catch {
    // La carpeta no es un repositorio de Git (o git no está): no se muestra nada.
    estado.value = null;
  }
}
onMounted(() => void cargar());
watch(
  () => props.sitio.carpeta,
  () => void cargar(),
);

const remotoWeb = computed(() => urlWebRemoto(estado.value?.remoto ?? props.sitio.git?.remoto));

async function traer(): Promise<void> {
  const r = await ejecutar('traer', () => api().git.traerCambios(props.sitio.id));
  await cargar();
  if (!r) return;
  if (!r.actualizado) {
    message.info(t.alDia);
    return;
  }
  const guardada = await proyectos
    .cargarReceta(props.sitio.id)
    .then((e) => e.pasos as DefPaso[])
    .catch(() => [] as DefPaso[]);
  traido.value = r;
  sugeridos.value = pasosSugeridos(r, guardada).map((paso) => ({ paso, activo: true }));
}

function ejecutarSugeridos(): void {
  const receta = (sugeridos.value ?? []).filter((p) => p.activo).map((p) => p.paso);
  sugeridos.value = null;
  if (!receta.length) return;
  // Corrida suelta: no reemplaza la receta guardada (Reintentar y Reinstalar siguen igual).
  verCorrida.value = true;
  proyectos.ejecutarSuelta(props.sitio.id, receta).catch((e: unknown) => {
    message.error(mensajeDeError(e));
  });
}

function abrirRemoto(): void {
  const u = remotoWeb.value;
  if (u) void ejecutar('remoto', () => api().sistema.abrirUrl(u));
}
</script>

<template>
  <div v-if="estado" class="git">
    <NTag size="small" :bordered="false" class="rama">
      <template #icon
        ><NIcon><GitBranch /></NIcon
      ></template>
      {{ estado.rama ? t.rama(estado.rama) : t.sinRama }}
    </NTag>
    <span class="dato" :class="{ aviso: estado.cambiosLocales > 0 }">
      {{ estado.cambiosLocales ? t.cambios(estado.cambiosLocales) : t.limpio }}
    </span>
    <span v-if="estado.atras" class="dato">· {{ t.atras(estado.atras) }}</span>
    <span v-if="estado.adelante" class="dato">· {{ t.adelante(estado.adelante) }}</span>
    <span class="espacio" />
    <NTooltip>
      <template #trigger>
        <NButton size="tiny" secondary :loading="ocupado('traer')" @click="traer">
          <template #icon
            ><NIcon><CloudDownload /></NIcon
          ></template>
          {{ t.traer }}
        </NButton>
      </template>
      {{ t.traerAyuda }}
    </NTooltip>
    <NTooltip v-if="remotoWeb">
      <template #trigger>
        <NButton
          size="tiny"
          quaternary
          :aria-label="tt.abrirRemoto(remotoWeb)"
          @click="abrirRemoto"
        >
          <template #icon
            ><NIcon><LogoGithub /></NIcon
          ></template>
          {{ tt.github }}
        </NButton>
      </template>
      {{ remotoWeb }}
    </NTooltip>

    <NModal
      :show="sugeridos !== null"
      preset="dialog"
      :title="t.sugeridosTitulo"
      :positive-text="sugeridos?.length ? t.ejecutarSugeridos : textos.acciones.cerrar"
      :negative-text="sugeridos?.length ? t.ahoraNo : undefined"
      :positive-button-props="{ disabled: !!sugeridos?.length && !sitio.confiado }"
      :auto-focus="false"
      @positive-click="ejecutarSugeridos"
      @negative-click="sugeridos = null"
      @update:show="(v: boolean) => !v && (sugeridos = null)"
    >
      <p v-if="traido?.cambios.migraciones.length" class="nota">
        {{ t.migracionesNuevas(traido.cambios.migraciones.length) }}
      </p>
      <template v-if="sugeridos?.length">
        <p class="nota">{{ t.sugeridosTexto }}</p>
        <p v-if="!sitio.confiado" class="nota aviso">{{ tt.sinConfianza }}</p>
        <div class="sugeridos">
          <NCheckbox
            v-for="(s, i) in sugeridos"
            :key="s.paso.id"
            :checked="s.activo"
            @update:checked="(v: boolean) => sugeridos && (sugeridos[i]!.activo = v)"
          >
            {{ etiquetaPaso(s.paso) }}
          </NCheckbox>
        </div>
      </template>
      <p v-else class="nota">{{ t.sugeridosNinguno }}</p>
    </NModal>

    <NModal
      :show="verCorrida && !!corrida"
      preset="card"
      :title="t.corridaTitulo"
      :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
      :auto-focus="false"
      @update:show="(v: boolean) => !v && (verCorrida = false)"
    >
      <p class="nota">
        {{ textos.proyectos.estadoReceta[corrida?.estado ?? 'corriendo'] }} · {{ t.corridaAyuda }}
      </p>
      <ol class="corrida">
        <PasoReceta v-for="p in corrida?.pasos ?? []" :key="p.id" :paso="p" />
      </ol>
      <template #footer>
        <div class="pie">
          <NButton @click="verCorrida = false">{{ textos.acciones.cerrar }}</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.git {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  font-size: 12.5px;
}
.rama {
  font-family: var(--fuente-mono);
}
.dato {
  opacity: 0.65;
}
.dato.aviso {
  color: #b45309;
  opacity: 1;
}
.espacio {
  flex: 1;
}
.nota {
  margin: 4px 0 8px;
  font-size: 12.5px;
  opacity: 0.8;
}
.nota.aviso {
  color: #b45309;
}
.corrida {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pie {
  display: flex;
  justify-content: flex-end;
}
.sugeridos {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
