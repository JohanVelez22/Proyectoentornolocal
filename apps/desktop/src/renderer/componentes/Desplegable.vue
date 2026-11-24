<script setup lang="ts">
/**
 * Envoltorio de `NSelect` que siempre abre el menú hacia abajo.
 *
 * Naive UI no expone el volteo del menú (el `VFollower` interno lo lleva activo), así que
 * en lugar de dejarlo subir se acorta su altura al espacio que queda bajo el campo
 * (`height` del menú interno): como siempre cabe abajo, no hay volteo y el menú hace scroll.
 */
import { NSelect, type SelectProps } from 'naive-ui';
import { computed, ref } from 'vue';

defineOptions({ inheritAttrs: false });

/** Altura máxima habitual del menú de Naive (px). */
const ALTURA_MAXIMA = 272;
/** Menos que esto no se acorta: el menú seguiría siendo inútil. */
const ALTURA_MINIMA = 96;
/** Margen con el borde de la ventana (px). */
const MARGEN = 12;

const campo = ref<InstanceType<typeof NSelect> | null>(null);
const altura = ref(ALTURA_MAXIMA);

function medir(): void {
  const el = campo.value?.$el as HTMLElement | undefined;
  if (!el) return;
  const libre = window.innerHeight - el.getBoundingClientRect().bottom - MARGEN;
  altura.value = Math.max(ALTURA_MINIMA, Math.min(ALTURA_MAXIMA, Math.floor(libre)));
}

function alAbrir(abierto: boolean): void {
  if (abierto) medir();
}

const sobreescrituras = computed<NonNullable<SelectProps['themeOverrides']>>(() => ({
  peers: { InternalSelectMenu: { height: `${altura.value}px` } },
}));
</script>

<template>
  <NSelect
    ref="campo"
    v-bind="$attrs"
    placement="bottom-start"
    :theme-overrides="sobreescrituras"
    @update:show="alAbrir"
  >
    <template v-for="(_, nombre) in $slots" :key="nombre" #[nombre]="datos">
      <slot :name="nombre" v-bind="datos ?? {}" />
    </template>
  </NSelect>
</template>
