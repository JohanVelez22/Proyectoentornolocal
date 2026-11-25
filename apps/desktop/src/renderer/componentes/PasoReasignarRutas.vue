<script setup lang="ts">
import { NButton, NCheckbox, NTag } from 'naive-ui';
import type { PrefijoRuta, VistaPreviaPerfil } from '../../shared/api';
import { textos } from '../i18n';

/**
 * Carpetas de los sitios de un perfil: las del otro equipo, cuáles existen aquí y dónde buscar las
 * que faltan. Las rutas nuevas salen siempre del diálogo de carpetas; un sitio sin carpeta se puede
 * importar igual como pendiente.
 */
defineProps<{
  sitios: VistaPreviaPerfil['sitios'];
  /** Carpeta elegida en un diálogo para cada sitio (id → ruta). */
  rutas: Record<string, string>;
  /** Sitios que se importan igual, sin carpeta. */
  comoPendiente: Record<string, boolean>;
  /** Cambio de prefijo deducido de la última carpeta elegida, si lo hay. */
  prefijoSugerido: PrefijoRuta | null;
  ocupado: boolean;
}>();
const emit = defineEmits<{
  elegir: [id: string];
  pendiente: [id: string, valor: boolean];
  usarPrefijo: [];
}>();

const t = textos.perfiles.reasignar;
const motivos = textos.perfiles.motivos as Record<string, string>;
</script>

<template>
  <section class="paso">
    <h3 class="titulo">{{ t.titulo }}</h3>
    <p class="texto">{{ t.texto }}</p>
    <p v-if="prefijoSugerido" class="prefijo">
      <NButton size="small" secondary :disabled="ocupado" @click="emit('usarPrefijo')">{{
        t.prefijo(prefijoSugerido.viejo, prefijoSugerido.nuevo)
      }}</NButton>
    </p>
    <ul class="lista">
      <li v-for="s in sitios" :key="s.id" class="fila" :data-sitio="s.id">
        <div class="cabecera">
          <strong>{{ s.nombre }}</strong>
          <NTag v-if="s.omitido" size="small" type="warning" :bordered="false">{{
            motivos[s.omitido] ?? t.omitido
          }}</NTag>
          <NTag v-else-if="s.existe" size="small" type="success" :bordered="false">{{
            t.existe
          }}</NTag>
          <NTag v-else size="small" type="error" :bordered="false">{{ t.noExiste }}</NTag>
        </div>
        <div class="ruta">
          <span class="etiqueta">{{ t.origen }}</span>
          <code>{{ s.carpeta }}</code>
        </div>
        <div v-if="rutas[s.id]" class="ruta">
          <span class="etiqueta">{{ t.destino }}</span>
          <code>{{ rutas[s.id] }}</code>
        </div>
        <div v-if="!s.omitido" class="acciones">
          <NButton size="small" :disabled="ocupado" @click="emit('elegir', s.id)">{{
            s.existe || rutas[s.id] ? t.cambiar : t.buscar
          }}</NButton>
          <NCheckbox
            v-if="!s.existe && !rutas[s.id]"
            :checked="comoPendiente[s.id] === true"
            @update:checked="(v: boolean) => emit('pendiente', s.id, v)"
            >{{ t.comoPendiente }}</NCheckbox
          >
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.titulo {
  margin: 0 0 4px;
  font-size: 14px;
}
.texto {
  margin: 0 0 10px;
  font-size: 12.5px;
  opacity: 0.8;
}
.prefijo {
  margin: 0 0 10px;
}
.lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 300px;
  overflow: auto;
}
.fila {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--borde, rgba(128, 128, 128, 0.25));
}
.cabecera,
.acciones {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ruta {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
.etiqueta {
  opacity: 0.6;
}
code {
  font-family: var(--fuente-mono);
  word-break: break-all;
}
</style>
