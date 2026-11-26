<script setup lang="ts">
import {
  ArrowForward,
  ArrowRedo,
  ArrowUndo,
  Brush,
  Close,
  CopyOutline,
  Crop,
  EyeOffOutline,
  Grid,
  ImageOutline,
  Remove,
  SaveOutline,
  SquareOutline,
  Text,
} from '@vicons/ionicons5';
import type { Component } from 'vue';
import type { FormatoCaptura } from '@pel/core';
import { textos } from '../i18n';
import { COLORES_DIBUJO, GROSORES_DIBUJO, type HerramientaCaptura } from './herramientasDibujo';

defineProps<{
  herramienta: HerramientaCaptura;
  color: string;
  grosor: number;
  formato: FormatoCaptura;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  puedeReseleccionar: boolean;
  ocupado: boolean;
}>();

defineEmits<{
  'update:herramienta': [HerramientaCaptura];
  'update:color': [string];
  'update:grosor': [number];
  'update:formato': [FormatoCaptura];
  deshacer: [];
  rehacer: [];
  copiar: [];
  guardar: [];
  alConversor: [];
  reseleccionar: [];
  cerrar: [];
}>();

const t = textos.captura;

const HERRAMIENTAS: {
  id: HerramientaCaptura;
  icono: Component;
  nombre: () => string;
  ayuda?: () => string;
}[] = [
  { id: 'recuadro', icono: SquareOutline, nombre: () => t.herramientas.recuadro },
  { id: 'flecha', icono: ArrowForward, nombre: () => t.herramientas.flecha },
  { id: 'linea', icono: Remove, nombre: () => t.herramientas.linea },
  { id: 'resaltar', icono: Brush, nombre: () => t.herramientas.resaltador },
  { id: 'texto', icono: Text, nombre: () => t.herramientas.texto },
  {
    id: 'pixelar',
    icono: Grid,
    nombre: () => t.herramientas.pixelar,
    ayuda: () => t.herramientas.pixelarAyuda,
  },
  {
    id: 'ocultar',
    icono: EyeOffOutline,
    nombre: () => t.herramientas.ocultar,
    ayuda: () => t.herramientas.ocultarAyuda,
  },
];
</script>

<template>
  <div class="barra" role="toolbar" :aria-label="t.barra" @pointerdown.stop>
    <div class="grupo">
      <button
        v-for="h in HERRAMIENTAS"
        :key="h.id"
        type="button"
        class="boton"
        :class="{ activo: herramienta === h.id }"
        :title="h.ayuda ? h.ayuda() : h.nombre()"
        :aria-label="h.nombre()"
        :aria-pressed="herramienta === h.id"
        @click="$emit('update:herramienta', h.id)"
      >
        <component :is="h.icono" />
      </button>
    </div>

    <div class="grupo" role="group" :aria-label="t.color">
      <button
        v-for="c in COLORES_DIBUJO"
        :key="c"
        type="button"
        class="color"
        :class="{ activo: color === c }"
        :style="{ background: c }"
        :aria-label="`${t.color} ${c}`"
        :aria-pressed="color === c"
        @click="$emit('update:color', c)"
      ></button>
    </div>

    <div class="grupo" role="group" :aria-label="t.grosor">
      <button
        v-for="g in GROSORES_DIBUJO"
        :key="g"
        type="button"
        class="boton grosor"
        :class="{ activo: grosor === g }"
        :title="`${t.grosor} ${g}`"
        :aria-label="`${t.grosor} ${g}`"
        :aria-pressed="grosor === g"
        @click="$emit('update:grosor', g)"
      >
        <span class="trazo" :style="{ height: `${g}px` }"></span>
      </button>
    </div>

    <div class="grupo">
      <button
        type="button"
        class="boton"
        :disabled="!puedeDeshacer"
        :title="t.deshacer"
        :aria-label="t.deshacer"
        @click="$emit('deshacer')"
      >
        <ArrowUndo />
      </button>
      <button
        type="button"
        class="boton"
        :disabled="!puedeRehacer"
        :title="t.rehacer"
        :aria-label="t.rehacer"
        @click="$emit('rehacer')"
      >
        <ArrowRedo />
      </button>
      <button
        v-if="puedeReseleccionar"
        type="button"
        class="boton"
        :title="t.nuevaSeleccion"
        :aria-label="t.nuevaSeleccion"
        @click="$emit('reseleccionar')"
      >
        <Crop />
      </button>
    </div>

    <div class="grupo" role="group" :aria-label="t.formato">
      <button
        v-for="f in ['png', 'jpg'] as const"
        :key="f"
        type="button"
        class="boton texto"
        :class="{ activo: formato === f }"
        :aria-pressed="formato === f"
        @click="$emit('update:formato', f)"
      >
        {{ f.toUpperCase() }}
      </button>
    </div>

    <div class="grupo">
      <button
        type="button"
        class="boton"
        :disabled="ocupado"
        :title="t.copiarAyuda"
        :aria-label="t.copiar"
        @click="$emit('copiar')"
      >
        <CopyOutline />
      </button>
      <button
        type="button"
        class="boton"
        :disabled="ocupado"
        :title="t.guardar"
        :aria-label="t.guardar"
        @click="$emit('guardar')"
      >
        <SaveOutline />
      </button>
      <button
        type="button"
        class="boton"
        :disabled="ocupado"
        :title="t.alConversor"
        :aria-label="t.alConversor"
        @click="$emit('alConversor')"
      >
        <ImageOutline />
      </button>
      <button
        type="button"
        class="boton"
        :title="t.cerrar"
        :aria-label="t.cerrar"
        @click="$emit('cerrar')"
      >
        <Close />
      </button>
    </div>
  </div>
</template>

<style scoped>
.barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  max-width: calc(100vw - 16px);
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(24, 24, 27, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
  color: #f4f4f5;
  font-size: 12px;
}
.grupo {
  display: flex;
  align-items: center;
  gap: 4px;
}
.grupo + .grupo {
  padding-left: 10px;
  border-left: 1px solid rgba(255, 255, 255, 0.14);
}
.boton {
  display: grid;
  place-items: center;
  min-width: 30px;
  height: 30px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 17px;
  cursor: pointer;
}
.boton.texto {
  font-size: 12px;
  font-weight: 600;
}
.boton:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}
.boton:focus-visible,
.color:focus-visible {
  outline: 2px solid #818cf8;
  outline-offset: 1px;
}
.boton.activo {
  background: rgba(129, 140, 248, 0.28);
  border-color: rgba(129, 140, 248, 0.7);
}
.boton:disabled {
  opacity: 0.35;
  cursor: default;
}
.color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  cursor: pointer;
}
.color.activo {
  border-color: #fff;
  transform: scale(1.18);
}
.grosor {
  width: 30px;
}
.trazo {
  display: block;
  width: 16px;
  border-radius: 4px;
  background: currentColor;
}
</style>
