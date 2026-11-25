<script setup lang="ts">
import { NButton, NInput } from 'naive-ui';
import { ref, watch } from 'vue';
import type { VistaEnv } from '../../shared/api';
import { textos } from '../i18n';
import { valorDeFila } from '../utilidades/env';

/**
 * Una variable del .env. Un valor secreto llega enmascarado (`••••<4 últimos>`) y solo se ve
 * completo si el usuario pulsa «Mostrar»: el valor completo lo trae el padre con una llamada
 * explícita y se muestra solo en esta fila. Cambiar o quitar solo anota el cambio: no se guarda
 * nada hasta que el usuario lo confirma.
 */
const props = defineProps<{
  fila: VistaEnv['filas'][number];
  /** Valor completo traído con «Mostrar» (null: sigue oculto). */
  revelado: string | null;
  /** Cambio pendiente: texto nuevo, null si se quitará, undefined si no hay. */
  cambio: string | null | undefined;
  cargandoRevelar: boolean;
}>();
const emit = defineEmits<{
  revelar: [];
  ocultar: [];
  cambiar: [valor: string];
  quitar: [];
  deshacer: [];
}>();

const t = textos.env;
/** Para una secreta: el usuario pulsó «Cambiar» y escribe el valor nuevo. */
const editando = ref(false);
watch(
  () => props.cambio,
  (c) => {
    if (c === undefined) editando.value = false;
  },
);

const mostrado = (): string => valorDeFila(props.fila, props.cambio, props.revelado);

function alEscribir(v: string): void {
  if (!props.fila.secreta && v === props.fila.valorVisible) emit('deshacer');
  else emit('cambiar', v);
}

function empezarCambio(): void {
  editando.value = true;
  emit('cambiar', '');
}
</script>

<template>
  <div class="fila" :class="{ quitada: cambio === null, cambiada: typeof cambio === 'string' }">
    <code class="clave">
      {{ fila.clave }}
      <span v-if="fila.secreta" class="etiqueta">{{ t.secretaEtiqueta }}</span>
      <span v-if="fila.duplicada" class="etiqueta" :title="t.duplicadaAyuda">
        {{ t.duplicadaEtiqueta }}
      </span>
      <span v-if="fila.soloLectura" class="etiqueta" :title="t.soloLecturaAyuda">
        {{ t.soloLecturaEtiqueta }}
      </span>
    </code>

    <div class="valor">
      <template v-if="cambio === null">
        <span class="nota">{{ t.seQuitara }}</span>
      </template>
      <NInput
        v-else-if="fila.secreta && (editando || typeof cambio === 'string')"
        type="password"
        show-password-on="click"
        size="small"
        :value="cambio ?? ''"
        :placeholder="t.valorNuevo"
        :input-props="{
          autocomplete: 'new-password',
          spellcheck: false,
          'aria-label': t.valorNuevoDe(fila.clave),
        }"
        @update:value="(v: string) => emit('cambiar', v)"
      />
      <NInput
        v-else-if="fila.secreta"
        size="small"
        readonly
        :value="mostrado()"
        :input-props="{ spellcheck: false, 'aria-label': t.valorDe(fila.clave) }"
      />
      <NInput
        v-else
        size="small"
        :readonly="fila.soloLectura === true"
        :value="mostrado()"
        :placeholder="fila.vacia ? t.vacio : ''"
        :input-props="{ spellcheck: false, 'aria-label': t.valorDe(fila.clave) }"
        @update:value="alEscribir"
      />
    </div>

    <div class="acciones">
      <template v-if="fila.secreta && cambio === undefined">
        <NButton
          v-if="revelado === null"
          size="tiny"
          quaternary
          :loading="cargandoRevelar"
          :aria-label="t.mostrarEtiqueta(fila.clave)"
          @click="emit('revelar')"
        >
          {{ t.mostrar }}
        </NButton>
        <NButton
          v-else
          size="tiny"
          quaternary
          :aria-label="t.ocultarEtiqueta(fila.clave)"
          @click="emit('ocultar')"
        >
          {{ t.ocultar }}
        </NButton>
        <NButton v-if="!fila.soloLectura" size="tiny" quaternary @click="empezarCambio">
          {{ t.cambiar }}
        </NButton>
      </template>
      <NButton
        v-if="cambio !== undefined"
        size="tiny"
        quaternary
        :aria-label="t.deshacerEtiqueta(fila.clave)"
        @click="emit('deshacer')"
      >
        {{ t.deshacer }}
      </NButton>
      <NButton
        v-else-if="!fila.soloLectura"
        size="tiny"
        quaternary
        type="error"
        :aria-label="t.quitarEtiqueta(fila.clave)"
        @click="emit('quitar')"
      >
        {{ t.quitar }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.fila {
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(0, 1.6fr) auto;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}
.clave {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  overflow-wrap: anywhere;
}
.etiqueta {
  margin-left: 6px;
  font-family: inherit;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
}
.valor {
  min-width: 0;
}
.acciones {
  display: flex;
  gap: 2px;
}
.nota {
  font-size: 12px;
  opacity: 0.7;
}
.cambiada {
  background: rgba(46, 160, 67, 0.08);
}
.quitada {
  background: rgba(248, 81, 73, 0.08);
}
.quitada .clave {
  text-decoration: line-through;
}
</style>
