<script setup lang="ts">
import { NCheckbox, NTag } from 'naive-ui';
import { computed } from 'vue';
import type { FilaImportar } from '../../shared/api';
import { textos } from '../i18n';
import { estadoFila } from '../utilidades/importar';

/**
 * Una fila de la vista previa: el sitio de otro programa con su carpeta, dominio, PHP y base, y
 * lo que pasaría con él. Si su base ya existe en el destino, ofrece reemplazarla (con copia).
 */
const props = defineProps<{ fila: FilaImportar; conBases: boolean; reemplaza: boolean }>();
const elegido = defineModel<boolean>('elegido', { required: true });
const emit = defineEmits<{ reemplazar: [valor: boolean] }>();

const t = textos.importar;
const estado = computed(() => estadoFila(props.fila));
const bloqueada = computed(() => estado.value !== 'importable');
const dominio = computed(() =>
  props.fila.dominio !== null
    ? t.sitios.dominio(props.fila.dominio)
    : t.sitios.dominioPropuesto(props.fila.dominioFinal),
);
const php = computed(() => {
  const f = props.fila;
  if (f.php === null) return f.phpFinal ? t.sitios.php(f.phpFinal) : t.sitios.sinPhp;
  if (f.phpFinal === null) return t.sitios.php(f.php);
  return f.php.startsWith(f.phpFinal)
    ? t.sitios.php(f.phpFinal)
    : t.sitios.phpSe(f.php, f.phpFinal);
});
const avisos = computed(() =>
  props.fila.avisos.map((a) => t.avisos[a as keyof typeof t.avisos]).filter(Boolean),
);
</script>

<template>
  <li class="fila" :class="{ bloqueada }">
    <NCheckbox v-model:checked="elegido" :disabled="bloqueada" :aria-label="fila.nombre" />
    <div class="cuerpo">
      <div class="linea">
        <strong>{{ fila.nombre }}</strong>
        <NTag size="small" :bordered="false">{{ textos.importar.programas[fila.programa] }}</NTag>
        <NTag v-if="estado === 'yaVinculado'" size="small" type="warning" :bordered="false">{{
          t.sitios.yaVinculado
        }}</NTag>
        <NTag v-else-if="estado === 'dominioEnUso'" size="small" type="warning" :bordered="false">{{
          t.sitios.dominioEnUso
        }}</NTag>
      </div>
      <code class="carpeta" :title="fila.carpeta">{{ fila.carpeta }}</code>
      <div class="datos">
        <span>{{ dominio }}</span>
        <span>{{ php }}</span>
        <span v-if="fila.base">{{ t.sitios.base(fila.base.nombre, fila.base.motor) }}</span>
      </div>
      <p v-for="a in avisos" :key="a" class="aviso">{{ a }}</p>
      <div v-if="conBases && fila.base && fila.baseExiste === true" class="existe">
        <span>{{ t.bases.existe }}.</span>
        <NCheckbox
          size="small"
          :checked="reemplaza"
          :disabled="bloqueada || !elegido"
          @update:checked="(v: boolean) => emit('reemplazar', v)"
        >
          {{ t.bases.reemplazar }}
        </NCheckbox>
        <small v-if="!reemplaza">{{ t.bases.noSeToca }}</small>
      </div>
    </div>
  </li>
</template>

<style scoped>
.fila {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  list-style: none;
}
.fila.bloqueada {
  opacity: 0.6;
}
.cuerpo {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.linea {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.carpeta {
  font-family: var(--fuente-mono);
  font-size: 12px;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.datos {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12.5px;
}
.aviso {
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
}
.existe {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--texto-error);
}
.existe small {
  opacity: 0.75;
  color: inherit;
}
</style>
