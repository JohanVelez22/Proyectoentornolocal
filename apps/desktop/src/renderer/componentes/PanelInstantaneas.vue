<script setup lang="ts">
import { ArrowUndo, Camera, TrashOutline } from '@vicons/ionicons5';
import EstadoVacio from './EstadoVacio.vue';
import { NButton, NIcon, NInput, NModal, NPopconfirm, NSkeleton, NTag, NTooltip } from 'naive-ui';
import { ref, watch } from 'vue';
import type { Instantanea, InstantaneaBorrada } from '@pel/core';
import type { ObjetivoSqlIpc } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { formatearFecha, textos } from '../i18n';
import { formatearTamano } from '../utilidades/bd';
import DialogoVolverInstantanea from './DialogoVolverInstantanea.vue';

/**
 * Instantáneas de una base: tomar una con nota, volver a una (con vista previa), borrarla a la
 * papelera y recuperarla desde ella. Sirve también para una base que ya no existe.
 */
const props = defineProps<{ objetivo: ObjetivoSqlIpc; base: string }>();
const mostrar = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ cambio: [] }>();

const t = textos.instantaneas;
const { ejecutar, ocupado } = useAccion();

const lista = ref<Instantanea[] | null>(null);
const papelera = ref<InstantaneaBorrada[]>([]);
const nota = ref('');
const dlgVolver = ref(false);
const idVolver = ref('');

const fecha = (iso: string): string =>
  formatearFecha(iso, { dateStyle: 'medium', timeStyle: 'short' });

/** La nota de una automática se arma aquí, en el idioma y la hora de este equipo. */
function textoNota(i: Instantanea): string {
  if (!i.automatica) return i.nota || t.sinNota;
  const origen = i.origen ? lista.value?.find((x) => x.id === i.origen) : undefined;
  return origen ? t.notaAutomatica(fecha(origen.fecha)) : t.notaAutomaticaSinOrigen;
}

async function cargar(): Promise<void> {
  const l = await ejecutar('lista', () => api().instantaneas.lista(props.objetivo, props.base));
  lista.value = l ?? [];
  const p = await ejecutar('papelera', () =>
    api().instantaneas.papelera(props.objetivo, props.base),
  );
  papelera.value = p ?? [];
}

watch(mostrar, (v) => {
  if (!v) return;
  lista.value = null;
  papelera.value = [];
  nota.value = '';
  void cargar();
});

async function tomar(): Promise<void> {
  const i = await ejecutar(
    'tomar',
    () => api().instantaneas.tomar(props.objetivo, props.base, nota.value.trim()),
    { exito: t.tomada },
  );
  if (!i) return;
  nota.value = '';
  await cargar();
  emit('cambio');
}

function pedirVolver(id: string): void {
  idVolver.value = id;
  dlgVolver.value = true;
}

async function borrar(id: string): Promise<void> {
  const ok = await ejecutar(
    `borrar:${id}`,
    async () => {
      await api().instantaneas.borrar(props.objetivo, props.base, id);
      return true;
    },
    { exito: t.borrada },
  );
  if (ok) await cargar();
}

async function recuperar(id: string): Promise<void> {
  const ok = await ejecutar(
    `recuperar:${id}`,
    async () => {
      await api().instantaneas.recuperar(props.objetivo, props.base, id);
      return true;
    },
    { exito: t.recuperada },
  );
  if (ok) {
    await cargar();
    emit('cambio');
  }
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo(base)"
    size="small"
    :bordered="false"
    :style="{ width: '620px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <p class="ayuda">{{ t.ayuda }}</p>

    <form class="tomar" @submit.prevent="tomar">
      <label class="etiqueta" for="nota-instantanea">{{ t.notaEtiqueta }}</label>
      <div class="fila-tomar">
        <NInput
          id="nota-instantanea"
          v-model:value="nota"
          :placeholder="t.notaMarcador"
          :maxlength="200"
          :disabled="ocupado('tomar')"
          :input-props="{ autocomplete: 'off' }"
        />
        <NButton type="primary" attr-type="submit" :loading="ocupado('tomar')">
          <template #icon
            ><NIcon><Camera /></NIcon
          ></template>
          {{ t.tomar }}
        </NButton>
      </div>
    </form>

    <div v-if="!lista" aria-busy="true">
      <p class="vacio">{{ t.cargando }}</p>
      <NSkeleton text :repeat="3" />
    </div>
    <EstadoVacio
      v-else-if="!lista.length"
      pequena
      :icono="Camera"
      :titulo="textos.estadosVacios.instantaneas.titulo"
      :texto="textos.estadosVacios.instantaneas.texto"
    />
    <ul v-else class="lista">
      <li v-for="i in lista" :key="i.id" class="fila">
        <div class="datos">
          <div class="linea">
            <strong>{{ fecha(i.fecha) }}</strong>
            <NTag v-if="i.automatica" size="small" :bordered="false">{{ t.automatica }}</NTag>
          </div>
          <span class="nota">{{ textoNota(i) }}</span>
          <span class="detalle">{{ t.detalle(i.tablas, formatearTamano(i.bytes)) }}</span>
          <span v-if="i.extensionesNoPermitidas.length" class="detalle aviso">
            {{ t.extensionesAviso(i.extensionesNoPermitidas.join(', ')) }}
          </span>
        </div>
        <div class="acciones">
          <NTooltip>
            <template #trigger>
              <NButton
                size="small"
                quaternary
                circle
                :aria-label="`${t.volver}: ${fecha(i.fecha)}`"
                @click="pedirVolver(i.id)"
              >
                <template #icon
                  ><NIcon><ArrowUndo /></NIcon
                ></template>
              </NButton>
            </template>
            {{ t.volver }}
          </NTooltip>
          <NPopconfirm
            :positive-text="t.borrarSi"
            :negative-text="textos.acciones.cancelar"
            @positive-click="borrar(i.id)"
          >
            <template #trigger>
              <NButton
                size="small"
                quaternary
                circle
                :aria-label="`${t.borrar}: ${fecha(i.fecha)}`"
                :loading="ocupado(`borrar:${i.id}`)"
              >
                <template #icon
                  ><NIcon><TrashOutline /></NIcon
                ></template>
              </NButton>
            </template>
            {{ t.borrarPregunta }}
          </NPopconfirm>
        </div>
      </li>
    </ul>

    <section v-if="papelera.length" class="papelera" :aria-label="t.papeleraTitulo">
      <h3>{{ t.papeleraTitulo }}</h3>
      <ul class="lista">
        <li v-for="i in papelera" :key="i.id" class="fila">
          <div class="datos">
            <strong>{{ fecha(i.fecha) }}</strong>
            <span class="nota">{{ textoNota(i) }}</span>
            <span class="detalle">{{ t.borradaEl(fecha(i.borrada)) }}</span>
          </div>
          <NButton
            size="small"
            secondary
            :loading="ocupado(`recuperar:${i.id}`)"
            @click="recuperar(i.id)"
          >
            {{ t.recuperar }}
          </NButton>
        </li>
      </ul>
    </section>

    <p class="pie">{{ t.ubicacion }} {{ t.papelera }}</p>
    <p class="pie">{{ t.limites }}</p>

    <DialogoVolverInstantanea
      :id="idVolver"
      v-model:show="dlgVolver"
      :objetivo="objetivo"
      :base="base"
      @hecho="cargar().then(() => emit('cambio'))"
    />
  </NModal>
</template>

<style scoped>
.ayuda {
  margin: 0 0 12px;
  font-size: 12.5px;
  line-height: 1.45;
  opacity: 0.75;
}
.tomar {
  margin-bottom: 14px;
}
.etiqueta {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  opacity: 0.75;
}
.fila-tomar {
  display: flex;
  gap: 8px;
}
.vacio {
  margin: 8px 0;
  opacity: 0.76;
}
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 280px;
  overflow: auto;
}
.fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}
.datos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.linea {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nota {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.detalle {
  font-size: 12px;
  opacity: 0.75;
}
.detalle.aviso {
  opacity: 0.9;
}
.acciones {
  display: flex;
  flex: none;
  gap: 2px;
}
.papelera {
  margin-top: 14px;
}
.papelera h3 {
  margin: 0 0 4px;
  font-size: 13px;
}
.pie {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.45;
  opacity: 0.75;
}
</style>
