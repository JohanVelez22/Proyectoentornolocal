<script setup lang="ts">
import { NTag } from 'naive-ui';
import { computed } from 'vue';
import type { TablaVersiones } from '../../shared/api';
import { textos } from '../i18n';
import { conInterruptor, type FilaVersion as Fila } from '../stores/versiones';
import { partirRama } from '../utilidades/versionesCompactas';
import FilaVersion from './FilaVersion.vue';

/**
 * Una versión menor (8.4, 22…) en la pestaña "Versiones": cabecera con su soporte y fin de soporte,
 * el último parche en una cuadrícula compacta y, plegados en un desplegable, los parches anteriores.
 */
const props = defineProps<{
  tabla: TablaVersiones;
  rama: TablaVersiones['ramas'][number];
  resaltada: string | null;
  ocupada: boolean;
}>();
const emit = defineEmits<{
  instalar: [version: string];
  desinstalar: [version: string];
  encender: [version: string, valor: boolean];
  predeterminar: [version: string];
  actualizar: [fila: Fila];
  usar: [version: string];
  puerto: [fila: Fila, puerto: number];
  resolver: [fila: Fila];
}>();

const t = textos.versiones;

const tipoSoporte = computed(() => {
  switch (props.rama.soporte) {
    case 'lts':
      return 'success';
    case 'actual':
      return 'info';
    case 'preview':
      return 'warning';
    default:
      return 'default';
  }
});

const cabecera = computed(() => t.cabecera(t.servicios[props.tabla.servicio], props.rama.rama));

const finTexto = computed(() => {
  const f = props.rama.finSoporte;
  if (!f) return null;
  return Date.parse(f) < Date.now() ? t.finSoportePasado(f) : t.finSoporte(f);
});

/** Instancia que ya usa otra versión de esta serie (servicios de datos). */
const instanciaDeRama = computed(
  () => props.rama.versiones.find((f) => f.instancia)?.instancia ?? null,
);

const partes = computed(() => partirRama(props.rama.versiones));
/** El desplegable nace abierto si la versión resaltada (la de un aviso) está dentro. */
const abrirAnteriores = computed(
  () => !!props.resaltada && partes.value.anteriores.some((f) => f.version === props.resaltada),
);

function argumentos(f: Fila) {
  return {
    fila: f,
    servicio: props.tabla.servicio,
    interruptor: props.tabla.interruptor,
    conInterruptor: conInterruptor(props.tabla, f),
    instanciaDeRama: props.tabla.interruptor === 'instancias' ? instanciaDeRama.value : null,
    resaltada: props.resaltada === f.version,
    ocupada: props.ocupada,
  };
}
</script>

<template>
  <section class="rama" :aria-labelledby="`rama-${rama.rama}`">
    <header class="cabeza">
      <h3 :id="`rama-${rama.rama}`">{{ cabecera }}</h3>
      <NTag v-if="rama.soporte" size="small" :bordered="false" :type="tipoSoporte">
        {{ t.soporte[rama.soporte] }}
      </NTag>
      <small v-if="finTexto">{{ finTexto }}</small>
    </header>
    <div class="cuadricula" role="list" :aria-label="cabecera">
      <FilaVersion
        v-for="f in partes.visibles"
        :key="f.version"
        v-bind="argumentos(f)"
        @instalar="emit('instalar', f.version)"
        @desinstalar="emit('desinstalar', f.version)"
        @encender="(v) => emit('encender', f.version, v)"
        @predeterminar="emit('predeterminar', f.version)"
        @actualizar="emit('actualizar', f)"
        @usar="emit('usar', f.version)"
        @puerto="(p) => emit('puerto', f, p)"
        @resolver="emit('resolver', f)"
      />
    </div>
    <details v-if="partes.anteriores.length" class="anteriores" :open="abrirAnteriores">
      <summary>{{ t.anteriores(partes.anteriores.length) }}</summary>
      <div class="cuadricula" role="list" :aria-label="t.anteriores(partes.anteriores.length)">
        <FilaVersion
          v-for="f in partes.anteriores"
          :key="f.version"
          v-bind="argumentos(f)"
          @instalar="emit('instalar', f.version)"
          @desinstalar="emit('desinstalar', f.version)"
          @encender="(v) => emit('encender', f.version, v)"
          @predeterminar="emit('predeterminar', f.version)"
          @actualizar="emit('actualizar', f)"
          @usar="emit('usar', f.version)"
          @puerto="(p) => emit('puerto', f, p)"
          @resolver="emit('resolver', f)"
        />
      </div>
    </details>
  </section>
</template>

<style scoped>
.rama {
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
}
.rama {
  min-width: 0;
}
.cabeza {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}
.cabeza h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.cabeza small {
  font-size: 12px;
  opacity: 0.72;
}
/* Dentro de un grupo (unos 280 px) cada parche ocupa su línea: versión, firma e Instalar. */
.cuadricula {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  align-items: stretch;
}
.anteriores {
  margin-top: 8px;
}
.anteriores > summary {
  width: fit-content;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--texto-enlace);
  cursor: pointer;
}
.anteriores > summary:hover {
  background: rgba(var(--acento-rgb), 0.1);
}
.anteriores > summary:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}
.anteriores[open] > summary {
  margin-bottom: 8px;
}
</style>
