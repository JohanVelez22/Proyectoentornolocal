<script setup lang="ts">
import { esNombreSecreto, type EntornoHttp, type VariableHttp } from '@pel/core';
import { Add, Close, Earth } from '@vicons/ionicons5';
import { NButton, NCheckbox, NIcon, NInput, NTag, useMessage } from 'naive-ui';
import { ref, watch } from 'vue';
import { api, plano } from '../../../api';
import { textos } from '../../../i18n';
import { mensajeDeError } from '../../../utilidades/errores';
import EstadoVacio from '../../EstadoVacio.vue';
import CampoSecreto from './CampoSecreto.vue';

const props = defineProps<{ entornos: EntornoHttp[]; activo: string | null }>();
const emit = defineEmits<{ cambio: [] }>();

const t = textos.herramientas.clienteHttp.entornos;
const message = useMessage();
const edicion = ref<EntornoHttp | null>(null);

function nuevo(): void {
  edicion.value = { id: '', nombre: '', variables: [] };
}
function abrir(e: EntornoHttp): void {
  edicion.value = plano(e);
}
// Si el entorno que se edita desaparece (borrado desde otro lado), se cierra el editor.
watch(
  () => props.entornos,
  (lista) => {
    const e = edicion.value;
    if (e && e.id && !lista.some((x) => x.id === e.id)) edicion.value = null;
  },
);

const secreta = (v: VariableHttp): boolean => v.secreta || esNombreSecreto(v.nombre);

function agregar(): void {
  edicion.value?.variables.push({ nombre: '', valor: '', secreta: false });
}
function quitar(i: number): void {
  edicion.value?.variables.splice(i, 1);
}

async function guardar(): Promise<void> {
  const e = edicion.value;
  if (!e) return;
  if (!e.nombre.trim()) {
    message.warning(t.sinNombre);
    return;
  }
  try {
    edicion.value = await api().clienteHttp.guardarEntorno(plano(e));
    message.success(t.guardado);
    emit('cambio');
  } catch (err) {
    message.error(mensajeDeError(err));
  }
}

async function borrar(): Promise<void> {
  const e = edicion.value;
  if (!e?.id) {
    edicion.value = null;
    return;
  }
  try {
    await api().clienteHttp.borrarEntorno(e.id);
    edicion.value = null;
    message.success(t.borrado);
    emit('cambio');
  } catch (err) {
    message.error(mensajeDeError(err));
  }
}

async function usar(): Promise<void> {
  const e = edicion.value;
  if (!e?.id) return;
  try {
    await api().clienteHttp.activarEntorno(e.id);
    emit('cambio');
  } catch (err) {
    message.error(mensajeDeError(err));
  }
}
</script>

<template>
  <div class="entornos">
    <EstadoVacio
      v-if="!entornos.length && !edicion"
      :icono="Earth"
      :titulo="t.vacioTitulo"
      :texto="t.vacioTexto"
      pequena
      marco
    >
      <NButton type="primary" size="small" @click="nuevo">{{ t.nuevo }}</NButton>
    </EstadoVacio>
    <template v-else>
      <div class="herr-fila">
        <NButton
          v-for="e in entornos"
          :key="e.id"
          size="small"
          :secondary="edicion?.id !== e.id"
          :type="edicion?.id === e.id ? 'primary' : 'default'"
          @click="abrir(e)"
        >
          {{ e.nombre }}
          <NTag v-if="e.id === activo" size="tiny" type="success" :bordered="false" class="marca">{{
            t.activo
          }}</NTag>
        </NButton>
        <NButton size="small" quaternary @click="nuevo">
          <template #icon
            ><NIcon><Add /></NIcon
          ></template>
          {{ t.nuevo }}
        </NButton>
      </div>
      <div v-if="edicion" class="editor">
        <NInput v-model:value="edicion.nombre" size="small" :placeholder="t.nombre" />
        <div v-for="(v, i) in edicion.variables" :key="i" class="variable">
          <NInput
            v-model:value="v.nombre"
            size="small"
            class="herr-mono"
            :placeholder="t.variable"
            :aria-label="t.variable"
          />
          <div>
            <CampoSecreto
              v-if="secreta(v)"
              v-model:valor="v.valor"
              v-model:referencia="v.ref"
              :etiqueta="t.valor"
            />
            <NInput
              v-else
              v-model:value="v.valor"
              size="small"
              class="herr-mono"
              :placeholder="t.valor"
              :aria-label="t.valor"
            />
          </div>
          <NCheckbox
            :checked="secreta(v)"
            :disabled="esNombreSecreto(v.nombre)"
            @update:checked="(c: boolean) => (v.secreta = c)"
            >{{ t.secreta }}</NCheckbox
          >
          <NButton size="small" quaternary circle :aria-label="t.quitar" @click="quitar(i)">
            <template #icon
              ><NIcon><Close /></NIcon
            ></template>
          </NButton>
        </div>
        <div class="herr-fila">
          <NButton size="small" secondary @click="agregar">{{ t.agregar }}</NButton>
          <NButton size="small" type="primary" @click="guardar">{{ t.guardar }}</NButton>
          <NButton v-if="edicion.id && edicion.id !== activo" size="small" @click="usar">{{
            t.usar
          }}</NButton>
          <NButton size="small" quaternary type="error" @click="borrar">{{ t.borrar }}</NButton>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.entornos {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.variable {
  display: grid;
  grid-template-columns: minmax(90px, 0.8fr) minmax(120px, 1.4fr) auto auto;
  gap: 6px;
  align-items: start;
}
.marca {
  margin-left: 6px;
}
</style>
