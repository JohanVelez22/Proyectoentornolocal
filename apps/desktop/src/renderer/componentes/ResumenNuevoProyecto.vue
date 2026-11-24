<script setup lang="ts">
import { Warning } from '@vicons/ionicons5';
import { NAlert, NCheckbox, NIcon, NSpin } from 'naive-ui';
import { computed } from 'vue';
import { textos } from '../i18n';
import { resumen, type FormProyecto } from '../utilidades/nuevoProyecto';

/**
 * Paso 3: lo que se va a crear y, en WordPress, la huella SHA-1 que publica wordpress.org con la
 * explicación de por qué es débil. La casilla es el único camino que manda `confirmarHuellaDebil`.
 */
const props = defineProps<{
  form: FormProyecto;
  /** Huella leída de wordpress.org; null mientras se lee o si no se pudo. */
  huella: string | null;
  leyendoHuella: boolean;
  deshabilitado?: boolean;
}>();
const confirmada = defineModel<boolean>('confirmada', { required: true });

const t = textos.nuevoProyecto;
const lineas = computed(() =>
  resumen(props.form).map((l) => ({
    ...l,
    etiqueta: t.resumen[l.clave],
    valor:
      l.clave === 'tipo'
        ? props.form.plantilla
          ? textos.plantillas.lista.desde(props.form.plantilla.nombre)
          : t.tipos[props.form.tipo].nombre
        : l.valor,
  })),
);
</script>

<template>
  <div>
    <h4 class="titulo">{{ t.resumen.titulo }}</h4>
    <p class="nota">{{ t.resumen.intro }}</p>
    <dl class="lista">
      <template v-for="l in lineas" :key="l.clave">
        <dt>{{ l.etiqueta }}</dt>
        <dd class="mono">{{ l.valor }}</dd>
      </template>
    </dl>

    <NAlert
      v-if="form.tipo === 'wordpress' && !form.plantilla"
      type="warning"
      :bordered="false"
      class="huella"
    >
      <template #icon
        ><NIcon><Warning /></NIcon
      ></template>
      <strong>{{ t.huella.titulo }}</strong>
      <p>{{ t.huella.riesgo }}</p>
      <p>{{ t.huella.explicacion }}</p>
      <p class="valor">
        <span>SHA-1:</span>
        <NSpin v-if="leyendoHuella" :size="12" />
        <code v-else-if="huella" data-test="huella-sha1">{{ huella }}</code>
        <em v-else>{{ t.huella.noDisponible }}</em>
      </p>
      <p class="nota">{{ t.huella.fuente }}</p>
      <NCheckbox v-model:checked="confirmada" :disabled="deshabilitado">{{
        t.huella.casilla
      }}</NCheckbox>
    </NAlert>

    <p class="nota">{{ t.resumen.nota }}</p>
  </div>
</template>

<style scoped>
.titulo {
  margin: 0 0 2px;
  font-size: 14px;
}
.nota {
  margin: 6px 0;
  font-size: 12px;
  opacity: 0.7;
}
.lista {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 14px;
  margin: 10px 0 14px;
  font-size: 13px;
}
.lista dt {
  opacity: 0.65;
}
.lista dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.mono,
code {
  font-family: var(--fuente-mono);
}
.huella p {
  margin: 6px 0;
  font-size: 12.5px;
}
.valor {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.valor code {
  overflow-wrap: anywhere;
}
</style>
