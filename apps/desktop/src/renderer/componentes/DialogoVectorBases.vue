<script setup lang="ts">
import { NAlert, NButton, NCheckbox, NModal, NSkeleton, NTag, useDialog } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type {
  EstadoVectorBases,
  IdInstancia,
  MotorBd,
  ResultadoBaseVector,
} from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { basesConAviso, contarListas, elegibles } from '../utilidades/vectorBases';

/**
 * «Activar en varias bases»: se eligen las bases de la instancia, se confirma y se muestra un
 * informe por base. Las de datos reales no se tocan hasta un aviso adicional.
 */
const props = defineProps<{ show: boolean; objetivo: MotorBd | IdInstancia }>();
const emit = defineEmits<{ 'update:show': [boolean]; cambio: [] }>();

const t = textos.bd.pgvector;
const dialog = useDialog();
const { ejecutar, ocupado } = useAccion();

const estado = ref<EstadoVectorBases | null>(null);
const elegidas = ref<string[]>([]);
const informe = ref<ResultadoBaseVector[] | null>(null);

const trabajando = computed(() => ocupado('vectorBases') || ocupado('vectorReales'));
const posibles = computed(() => (estado.value ? elegibles(estado.value.bases) : []));
const conAviso = computed(() => (informe.value ? basesConAviso(informe.value) : []));

async function cargar(): Promise<void> {
  estado.value = null;
  const r = await ejecutar('vectorEstado', () => api().pgvector.estadoBases(props.objetivo), {
    tituloError: t.errorBases,
  });
  if (r) estado.value = r;
}

watch(
  () => props.show,
  (abierto) => {
    if (!abierto) return;
    elegidas.value = [];
    informe.value = null;
    void cargar();
  },
);

function alternar(base: string, marcada: boolean): void {
  elegidas.value = marcada
    ? [...new Set([...elegidas.value, base])]
    : elegidas.value.filter((b) => b !== base);
}
function todas(): void {
  elegidas.value = elegidas.value.length === posibles.value.length ? [] : [...posibles.value];
}

async function activar(bases: string[], reales: string[]): Promise<void> {
  const r = await ejecutar(
    reales.length ? 'vectorReales' : 'vectorBases',
    () =>
      api().pgvector.activarEnBases(props.objetivo, {
        bases,
        confirmado: true,
        ...(reales.length ? { datosRealesConfirmadas: reales } : {}),
      }),
    { tituloError: t.variasTitulo },
  );
  if (!r) return;
  // Un segundo envío (datos reales) reemplaza solo las filas de esas bases.
  informe.value = reales.length
    ? [...(informe.value ?? []).filter((x) => !reales.includes(x.base)), ...r]
    : r;
  elegidas.value = [];
  emit('cambio');
  await cargar();
}

function pedirConfirmacion(): void {
  const bases = [...elegidas.value];
  if (!bases.length || trabajando.value) return;
  dialog.warning({
    title: t.variasConfirmarTitulo,
    content: t.variasConfirmarTexto(bases.length),
    positiveText: t.variasActivar(bases.length),
    negativeText: textos.acciones.cancelar,
    onPositiveClick: () => {
      void activar(bases, []);
    },
  });
}

function pedirDatosReales(): void {
  const bases = [...conAviso.value];
  if (!bases.length || trabajando.value) return;
  dialog.warning({
    title: t.datosReales,
    content: `${t.realesTexto(bases.length)} (${bases.join(', ')})`,
    positiveText: t.realesBoton,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: () => {
      void activar(bases, bases);
    },
  });
}

const tipoEstado = (e: ResultadoBaseVector['estado']): 'success' | 'info' | 'error' | 'warning' =>
  e === 'activada' || e === 'quitada'
    ? 'success'
    : e === 'ya-estaba'
      ? 'info'
      : e === 'error'
        ? 'error'
        : 'warning';
const textoEstado = (e: ResultadoBaseVector['estado']): string =>
  ({
    activada: t.estados.activada,
    quitada: t.estados.quitada,
    'ya-estaba': t.estados.yaEstaba,
    error: t.estados.error,
    'requiere-aviso': t.estados.requiereAviso,
  })[e];
const textoMotivo = (m: ResultadoBaseVector['motivo']): string =>
  m === undefined
    ? ''
    : {
        'sin-pgvector': t.motivos.sinPgvector,
        'no-existe': t.motivos.noExiste,
        permiso: t.motivos.permiso,
        conexion: t.motivos.conexion,
        'en-uso': t.motivos.enUso,
        otro: t.motivos.otro,
      }[m];
const todasMarcadas = computed(
  () => posibles.value.length > 0 && elegidas.value.length === posibles.value.length,
);
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t.variasTitulo"
    size="small"
    :bordered="false"
    :style="{ width: '560px', maxWidth: 'calc(100vw - 32px)' }"
    :closable="!trabajando"
    :mask-closable="!trabajando"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <p class="texto">{{ t.variasTexto }}</p>
    <p class="texto tenue">{{ t.ayuda }}</p>

    <NSkeleton v-if="!estado" text :repeat="3" />
    <p v-else-if="estado.bases.length === 0" class="texto tenue">{{ t.variasVacio }}</p>
    <template v-else>
      <div class="barra">
        <NButton size="tiny" text type="primary" :disabled="trabajando" @click="todas">
          {{ todasMarcadas ? t.quitarSeleccion : t.seleccionarTodas }}
        </NButton>
      </div>
      <ul class="bases" role="group" :aria-label="t.variasTitulo">
        <li v-for="b in estado.bases" :key="b.base" class="base">
          <NCheckbox
            :checked="elegidas.includes(b.base)"
            :disabled="b.activo || trabajando"
            @update:checked="(v: boolean) => alternar(b.base, v)"
          >
            <span class="nombre">{{ b.base }}</span>
          </NCheckbox>
          <span class="etiquetas">
            <NTag v-if="b.activo" size="small" :bordered="false" type="success">{{
              t.yaLaTiene
            }}</NTag>
            <NTag v-if="b.datosReales" size="small" :bordered="false" type="warning">{{
              t.datosReales
            }}</NTag>
          </span>
        </li>
      </ul>
    </template>

    <section v-if="informe" class="informe" aria-live="polite">
      <h4>{{ t.informeTitulo }}</h4>
      <ul class="bases">
        <li v-for="r in informe" :key="r.base" class="base">
          <span class="nombre">{{ r.base }}</span>
          <span class="etiquetas">
            <NTag size="small" :bordered="false" :type="tipoEstado(r.estado)">
              {{ textoEstado(r.estado) }}
            </NTag>
            <small v-if="r.motivo" class="motivo">{{ textoMotivo(r.motivo) }}</small>
          </span>
        </li>
      </ul>
      <NAlert v-if="conAviso.length" type="warning" :show-icon="false" class="aviso">
        {{ t.realesTexto(conAviso.length) }}
        <div class="aviso-accion">
          <NButton
            size="small"
            :disabled="trabajando"
            :loading="ocupado('vectorReales')"
            @click="pedirDatosReales"
          >
            {{ t.realesBoton }}
          </NButton>
        </div>
      </NAlert>
      <p v-else class="texto tenue">{{ contarListas(informe) }} / {{ informe.length }}</p>
    </section>

    <template #action>
      <div class="acciones">
        <NButton size="small" :disabled="trabajando" @click="emit('update:show', false)">
          {{ t.cerrar }}
        </NButton>
        <NButton
          size="small"
          type="primary"
          :disabled="!elegidas.length || trabajando"
          :loading="ocupado('vectorBases')"
          @click="pedirConfirmacion"
        >
          {{ t.variasActivar(elegidas.length) }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.texto {
  margin: 0 0 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.76;
}
.barra {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}
.bases {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  margin: 0 0 12px;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}
.base {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
  min-height: 32px;
  padding: 2px 8px;
  border-radius: 6px;
}
.base:hover {
  background: rgba(128, 128, 128, 0.08);
}
.nombre {
  font-family: var(--fuente-mono);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.etiquetas {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.motivo {
  font-size: 12px;
  opacity: 0.76;
}
.informe h4 {
  margin: 4px 0 6px;
  font-size: 13px;
  font-weight: 600;
}
.aviso-accion {
  margin-top: 8px;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
