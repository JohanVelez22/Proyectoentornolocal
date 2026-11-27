<script setup lang="ts">
import type { Component } from 'vue';
import IlustracionVacia from './IlustracionVacia.vue';

/**
 * Estado vacío que guía: la ilustración, qué es esto y por qué está vacío (título y texto) y, en
 * el espacio por defecto, la acción principal (un botón). `marco` lo enmarca con borde punteado
 * (vistas enteras); `pequena` lo achica para paneles y listas.
 */
withDefaults(
  defineProps<{
    icono: Component;
    titulo: string;
    texto: string;
    pequena?: boolean;
    marco?: boolean;
  }>(),
  { pequena: false, marco: false },
);
</script>

<template>
  <div class="estado-vacio" :class="{ pequena, marco }" role="status">
    <IlustracionVacia :icono="icono" :pequena="pequena" />
    <strong class="titulo">{{ titulo }}</strong>
    <span class="texto">{{ texto }}</span>
    <div v-if="$slots.default" class="accion"><slot /></div>
  </div>
</template>

<style scoped>
.estado-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 36px 16px 32px;
  text-align: center;
}
.estado-vacio.pequena {
  padding: 18px 12px 16px;
}
.estado-vacio.marco {
  border: 1px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
}
.titulo {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
}
.pequena .titulo {
  font-size: 14px;
}
.texto {
  max-width: 400px;
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.78;
}
.accion {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}
</style>
