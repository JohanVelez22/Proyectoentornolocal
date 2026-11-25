<script setup lang="ts">
import { computed } from 'vue';
import { textos } from '../../i18n';
import { evaluarFortaleza } from '../../utilidades/fortaleza';

/**
 * Barra de fortaleza de una contraseña escrita. Se calcula aquí, en el renderer (zxcvbn-ts): la
 * contraseña no sale del equipo, no se guarda y no se manda a ninguna ruta.
 */
const props = defineProps<{ clave: string; avisos?: boolean }>();

const t = textos.herramientas.contrasenas.fortaleza;

const r = computed(() => evaluarFortaleza(props.clave));
const nivel = computed(() => t.niveles[r.value.puntaje] ?? '');
const consejos = computed(() =>
  r.value.avisos
    .map((a) => (t.avisos as Record<string, string>)[a])
    .filter((x): x is string => typeof x === 'string'),
);
</script>

<template>
  <div v-if="clave" class="medidor">
    <div
      class="barra"
      role="meter"
      aria-valuemin="0"
      aria-valuemax="4"
      :aria-valuenow="r.puntaje"
      :aria-valuetext="nivel"
      :aria-label="t.etiqueta"
    >
      <span
        v-for="i in 5"
        :key="i"
        class="tramo"
        :class="{ activo: i - 1 <= r.puntaje, [`n${r.puntaje}`]: true }"
      />
    </div>
    <p class="nivel" :class="`n${r.puntaje}`">{{ nivel }}</p>
    <template v-if="avisos !== false">
      <ul v-if="consejos.length" class="consejos">
        <li v-for="c in consejos" :key="c">{{ c }}</li>
      </ul>
      <p v-else class="nota">{{ t.sinAvisos }}</p>
      <p class="nota">{{ t.estimacion }}</p>
    </template>
  </div>
</template>

<style scoped>
.medidor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.barra {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.tramo {
  height: 6px;
  border-radius: 3px;
  background: rgba(128, 128, 128, 0.25);
}
.tramo.activo.n0 {
  background: #dc2626;
}
.tramo.activo.n1 {
  background: #ea580c;
}
.tramo.activo.n2 {
  background: #ca8a04;
}
.tramo.activo.n3 {
  background: #65a30d;
}
.tramo.activo.n4 {
  background: #16a34a;
}
.nivel {
  margin: 0;
  font-weight: 600;
  font-size: 13px;
}
.nivel.n0 {
  color: #dc2626;
}
.nivel.n1 {
  color: #ea580c;
}
.nivel.n2 {
  color: #ca8a04;
}
.nivel.n3 {
  color: #65a30d;
}
.nivel.n4 {
  color: #16a34a;
}
.consejos {
  margin: 0;
  padding-left: 18px;
  font-size: 12.5px;
  opacity: 0.85;
}
.nota {
  margin: 0;
  font-size: 12px;
  opacity: 0.65;
}
</style>
