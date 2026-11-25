<script setup lang="ts">
import { Warning } from '@vicons/ionicons5';
import {
  NButton,
  NCheckbox,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NSkeleton,
  NSpin,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { Instantanea } from '@pel/core';
import type { ObjetivoSqlIpc } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { formatearFecha, textos } from '../i18n';
import { confirmacionValida, formatearTamano } from '../utilidades/bd';

/**
 * Volver a una instantánea: vista previa (base, fecha, tamaño, tablas), confirmación escribiendo
 * el nombre de la base y resultado. El núcleo guarda antes el estado actual y, si falla, lo vuelve
 * a poner. Si no puede guardarlo, ofrece seguir sin guardarlo con una segunda confirmación.
 */
const props = defineProps<{ objetivo: ObjetivoSqlIpc; base: string; id: string }>();
const mostrar = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ hecho: [] }>();

const t = textos.instantaneas.dialogoVolver;
const { ejecutar } = useAccion();

interface Previa {
  instantanea: Instantanea;
  estadoActual: { tablas: number; bytes: number };
}
interface Hecho {
  respaldoPrevio: Instantanea | null;
  advertencias: string[];
}

const previa = ref<Previa | null>(null);
const cargando = ref(false);
const escrito = ref('');
const trabajando = ref(false);
const hecho = ref<Hecho | null>(null);
/** No se pudo guardar el estado actual: se ofrece volver sin guardarlo. */
const faltaGuardar = ref(false);
const entiendo = ref(false);

const valido = computed(() => confirmacionValida(props.base, escrito.value));
const fecha = (iso: string): string =>
  formatearFecha(iso, { dateStyle: 'medium', timeStyle: 'short' });

watch(mostrar, (v) => {
  if (!v) return;
  previa.value = null;
  hecho.value = null;
  escrito.value = '';
  trabajando.value = false;
  faltaGuardar.value = false;
  entiendo.value = false;
  cargando.value = true;
  void ejecutar('vista-previa', () =>
    api().instantaneas.vistaPrevia(props.objetivo, props.base, props.id),
  )
    .then((p) => {
      previa.value = p ?? null;
      if (!p) mostrar.value = false;
    })
    .finally(() => (cargando.value = false));
});

async function volver(sinGuardarEstado: boolean): Promise<void> {
  if (!valido.value || trabajando.value) return;
  if (sinGuardarEstado && !entiendo.value) return;
  trabajando.value = true;
  const r = await ejecutar('volver', async () => {
    try {
      return await api().instantaneas.volver(
        props.objetivo,
        props.base,
        props.id,
        escrito.value,
        sinGuardarEstado ? { sinGuardarEstado: true } : undefined,
      );
    } catch (e) {
      // El estado actual no se pudo guardar: no se tocó nada. Se ofrece seguir sin guardarlo.
      if ((e as { codigo?: unknown } | null)?.codigo === 'instantaneas.respaldo_previo_fallo') {
        faltaGuardar.value = true;
      }
      throw e;
    }
  });
  trabajando.value = false;
  // Con o sin éxito el núcleo pudo crear la instantánea automática previa: se vuelve a leer la lista.
  emit('hecho');
  if (r) hecho.value = r;
}

function alCambiar(v: boolean): void {
  if (!v) cerrar();
}

function cerrar(): void {
  if (trabajando.value) return;
  mostrar.value = false;
}
</script>

<template>
  <NModal
    :show="mostrar"
    preset="card"
    :title="t.titulo(base)"
    size="small"
    :bordered="false"
    :style="{ width: '520px', maxWidth: 'calc(100vw - 32px)' }"
    :closable="!trabajando"
    :mask-closable="!trabajando"
    :close-on-esc="!trabajando"
    @update:show="alCambiar"
  >
    <div v-if="cargando" aria-busy="true">
      <p class="cargando">{{ t.cargando }}</p>
      <NSkeleton text :repeat="3" />
    </div>

    <template v-else-if="previa && !hecho">
      <table class="previa">
        <thead>
          <tr>
            <th scope="col">
              <span class="oculto">{{ t.base }}</span>
            </th>
            <th scope="col">{{ t.instantanea }}</th>
            <th scope="col">{{ t.ahora }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{{ t.base }}</th>
            <td colspan="2" class="mono">{{ base }}</td>
          </tr>
          <tr>
            <th scope="row">{{ t.instantanea }}</th>
            <td colspan="2">{{ fecha(previa.instantanea.fecha) }}</td>
          </tr>
          <tr v-if="previa.instantanea.nota">
            <th scope="row">{{ t.nota }}</th>
            <td colspan="2">{{ previa.instantanea.nota }}</td>
          </tr>
          <tr>
            <th scope="row">{{ t.tamano }}</th>
            <td>{{ formatearTamano(previa.instantanea.bytes) }}</td>
            <td>{{ formatearTamano(previa.estadoActual.bytes) }}</td>
          </tr>
          <tr>
            <th scope="row">{{ t.tablas }}</th>
            <td>{{ previa.instantanea.tablas }}</td>
            <td>{{ previa.estadoActual.tablas }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="previa.estadoActual.tablas === 0" class="nota-vacia">{{ t.baseVacia }}</p>
      <p v-else class="advertencia">
        <NIcon :size="18"><Warning /></NIcon>
        <span>{{ t.aviso(base) }}</span>
      </p>

      <section v-if="faltaGuardar" class="sin-guardar" role="alert">
        <strong>{{ t.sinGuardarTitulo }}</strong>
        <p>{{ t.sinGuardarTexto }}</p>
        <NCheckbox v-model:checked="entiendo" :disabled="trabajando">
          {{ t.sinGuardarConfirmar }}
        </NCheckbox>
      </section>

      <NForm :show-feedback="false" @submit.prevent="volver(false)">
        <NFormItem :label="t.pedir(base)">
          <NInput
            v-model:value="escrito"
            :placeholder="base"
            :disabled="trabajando"
            :input-props="{ spellcheck: false, autocomplete: 'off' }"
            class="mono"
          />
        </NFormItem>
      </NForm>
      <p v-if="trabajando" class="trabajando" aria-live="polite">
        <NSpin :size="16" />
        <span>{{ t.trabajando(base) }}</span>
      </p>
    </template>

    <div v-else-if="hecho" class="resultado" aria-live="polite">
      <!-- "Volvió a la instantánea" solo si la restauración terminó sin avisos. -->
      <p class="exito">
        {{ hecho.advertencias.length ? t.hechoConAvisos(base) : t.hecho(base) }}
      </p>
      <p v-if="hecho.respaldoPrevio">
        {{ t.respaldoPrevio }}
        <strong>{{ fecha(hecho.respaldoPrevio.fecha) }}</strong>
      </p>
      <template v-if="hecho.advertencias.length">
        <p>{{ t.advertencias }}</p>
        <ul class="avisos">
          <li v-for="(a, i) in hecho.advertencias" :key="i">{{ a }}</li>
        </ul>
      </template>
    </div>

    <template #action>
      <div class="acciones">
        <template v-if="hecho">
          <NButton size="small" type="primary" @click="cerrar">
            {{ textos.instantaneas.cerrar }}
          </NButton>
        </template>
        <template v-else>
          <NButton size="small" :disabled="trabajando" @click="cerrar">
            {{ textos.acciones.cancelar }}
          </NButton>
          <NButton
            v-if="faltaGuardar"
            size="small"
            type="error"
            :disabled="!previa || !valido || !entiendo || trabajando"
            :loading="trabajando"
            @click="volver(true)"
          >
            {{ t.sinGuardarBoton }}
          </NButton>
          <NButton
            v-else
            size="small"
            type="error"
            :disabled="!previa || !valido || trabajando"
            :loading="trabajando"
            @click="volver(false)"
          >
            {{ t.confirmar }}
          </NButton>
        </template>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.cargando {
  margin: 0 0 8px;
  opacity: 0.7;
}
.previa {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 14px;
  font-size: 13px;
}
.previa th,
.previa td {
  text-align: left;
  padding: 5px 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}
.previa thead th {
  font-size: 12px;
  opacity: 0.65;
}
.previa tbody th {
  width: 28%;
  font-weight: 600;
  opacity: 0.8;
}
.mono {
  font-family: var(--fuente-mono);
}
.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.advertencia {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.45;
}
.advertencia .n-icon {
  flex: none;
  margin-top: 1px;
  color: var(--n-warning, #f0a020);
}
.nota-vacia {
  margin: 0 0 12px;
  font-size: 13px;
  opacity: 0.8;
}
.sin-guardar {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(208, 48, 80, 0.1);
  font-size: 13px;
}
.sin-guardar p {
  margin: 4px 0 8px;
  line-height: 1.45;
}
.trabajando {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 0;
  font-weight: 600;
}
.exito {
  margin: 0 0 8px;
  font-weight: 600;
}
.avisos {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 12.5px;
  max-height: 140px;
  overflow: auto;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
