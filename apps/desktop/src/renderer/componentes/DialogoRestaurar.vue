<script setup lang="ts">
import { DocumentAttach, ShieldCheckmark, Warning } from '@vicons/ionicons5';
import { NButton, NForm, NFormItem, NIcon, NInput, NModal, NSpin, NTag } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { FormatoRespaldo, MotorSql } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { LIMITE_LINEAS, useBd } from '../stores/bd';
import {
  confirmacionValida,
  formatoIncompatible,
  nombreDesdeArchivo,
  opcionesRestaurar,
  problemaNombre,
} from '../utilidades/bd';
import ConfirmarReemplazo from './ConfirmarReemplazo.vue';
import PanelProgreso from './PanelProgreso.vue';
import ResultadoOperacion from './ResultadoOperacion.vue';

/** Restaurar un respaldo en una base nueva, vacía o (con confirmación) reemplazando la actual. */
const props = defineProps<{ motor: MotorSql; baseFija?: string | null }>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = es.bd.dialogoRestaurar;
const bd = useBd();
const { ejecutar, ocupado } = useAccion();

type Paso = 'datos' | 'confirmar' | 'operacion';
const paso = ref<Paso>('datos');
const archivo = ref<string | null>(null);
const formato = ref<FormatoRespaldo | null>(null);
const base = ref('');
const escrito = ref('');

const nombreMotor = computed(() => es.bd.motores[props.motor] ?? props.motor);
const nombreArchivo = computed(() => archivo.value?.split(/[\\/]/).pop() ?? '');
const corriendo = computed(() => paso.value === 'operacion' && bd.enCurso);
const operacion = computed(() => (paso.value === 'operacion' ? bd.operacion : null));

const problema = computed(() => problemaNombre(props.motor, base.value));
const textoProblema = computed(() => {
  const p = problema.value;
  if (!p) return '';
  if (p === 'caracteres') return es.bd.nombre.caracteres[props.motor] ?? '';
  return es.bd.nombre[p];
});
const avisoFormato = computed(() => {
  if (formato.value === 'desconocido') return es.bd.formatoDesconocido;
  if (formatoIncompatible(formato.value, props.motor)) return es.bd.formatoIncompatible;
  return null;
});
const puedeRestaurar = computed(
  () =>
    !!archivo.value &&
    formato.value !== null &&
    !avisoFormato.value &&
    !problema.value &&
    !ocupado('formato') &&
    !ocupado('revisar') &&
    !bd.enCurso,
);

watch(mostrar, (v) => {
  if (!v) return;
  paso.value = 'datos';
  archivo.value = null;
  formato.value = null;
  base.value = props.baseFija ?? '';
  escrito.value = '';
});

async function elegirArchivo(): Promise<void> {
  const ruta = await ejecutar('elegir', () => api().sistema.elegirArchivo());
  if (!ruta) return;
  archivo.value = ruta;
  formato.value = null;
  if (!props.baseFija) base.value = nombreDesdeArchivo(ruta, props.motor);
  const f = await ejecutar('formato', () => api().bd.formato(ruta));
  // Si el usuario eligió otro archivo mientras tanto, este resultado ya no vale.
  if (archivo.value === ruta) formato.value = f ?? null;
}

async function continuar(): Promise<void> {
  if (!puedeRestaurar.value) return;
  const tablas = await ejecutar('revisar', () => api().bd.tieneTablas(props.motor, base.value));
  if (tablas === undefined) return;
  const opciones = opcionesRestaurar(tablas, false);
  if (opciones === null) {
    escrito.value = '';
    paso.value = 'confirmar';
    return;
  }
  await lanzar(false);
}

async function confirmarReemplazo(): Promise<void> {
  if (!confirmacionValida(base.value, escrito.value)) return;
  await lanzar(true);
}

async function lanzar(confirmado: boolean): Promise<void> {
  if (!archivo.value || bd.enCurso) return;
  paso.value = 'operacion';
  await bd.restaurar(props.motor, archivo.value, base.value, confirmado);
}

function volverADatos(): void {
  bd.descartarOperacion();
  escrito.value = '';
  paso.value = 'datos';
}

function alCambiar(v: boolean): void {
  if (!v) cerrar();
}

function cerrar(): void {
  if (corriendo.value) return;
  if (paso.value === 'operacion') bd.descartarOperacion();
  mostrar.value = false;
}
</script>

<template>
  <NModal
    :show="mostrar"
    preset="card"
    :title="t.titulo(nombreMotor)"
    size="small"
    :bordered="false"
    class="dialogo-bd"
    :style="{ width: '560px', maxWidth: 'calc(100vw - 32px)' }"
    :closable="!corriendo"
    :mask-closable="!corriendo"
    :close-on-esc="!corriendo"
    @update:show="alCambiar"
  >
    <div class="confianza" role="note">
      <NIcon :size="18"><ShieldCheckmark /></NIcon>
      <span>{{ t.confianza }}</span>
    </div>

    <NForm v-if="paso === 'datos'" :show-feedback="true" @submit.prevent="continuar">
      <NFormItem :label="t.archivo" :show-feedback="false">
        <div class="archivo">
          <NIcon :size="18" class="archivo-icono"><DocumentAttach /></NIcon>
          <span v-if="archivo" class="archivo-nombre" :title="archivo">{{ nombreArchivo }}</span>
          <span v-else class="archivo-vacio">{{ t.sinArchivo }}</span>
          <NButton size="small" :loading="ocupado('elegir')" @click="elegirArchivo">
            {{ archivo ? t.cambiar : t.elegir }}
          </NButton>
        </div>
      </NFormItem>

      <div v-if="archivo" class="formato">
        <span class="formato-etiqueta">{{ t.formato }}</span>
        <NSpin v-if="ocupado('formato')" :size="14" />
        <span v-if="ocupado('formato')" class="tenue">{{ t.detectando }}</span>
        <NTag
          v-else-if="formato"
          size="small"
          :bordered="false"
          :type="avisoFormato ? 'warning' : 'info'"
        >
          {{ es.bd.formatos[formato] ?? formato }}
        </NTag>
      </div>
      <p v-if="avisoFormato" class="aviso-formato" role="alert">
        <NIcon :size="16"><Warning /></NIcon>
        <span>{{ avisoFormato }}</span>
      </p>

      <NFormItem
        :label="t.destino"
        :validation-status="archivo && problema ? 'error' : undefined"
        :feedback="archivo && problema ? textoProblema : t.destinoAyuda"
        class="destino"
      >
        <NInput
          v-model:value="base"
          :disabled="!!baseFija"
          :placeholder="es.bd.nombre.etiqueta"
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
          class="mono"
        />
      </NFormItem>
    </NForm>

    <NForm v-else-if="paso === 'confirmar'" @submit.prevent="confirmarReemplazo">
      <ConfirmarReemplazo v-model="escrito" :base="base" />
    </NForm>

    <div v-else class="operacion">
      <p v-if="corriendo" class="corriendo">
        <NSpin :size="16" />
        <span>{{ es.bd.progreso.corriendo.restaurar?.(base) }}</span>
      </p>
      <p v-if="corriendo" class="tenue">{{ es.bd.progreso.noCierre }}</p>
      <PanelProgreso :lineas="bd.lineas" :limite="LIMITE_LINEAS" />
      <ResultadoOperacion
        v-if="operacion && operacion.estado !== 'corriendo'"
        :operacion="operacion"
      />
    </div>

    <template #action>
      <div class="acciones">
        <template v-if="paso === 'datos'">
          <NButton size="small" @click="cerrar">{{ es.acciones.cancelar }}</NButton>
          <NButton
            size="small"
            type="primary"
            :disabled="!puedeRestaurar"
            :loading="ocupado('revisar')"
            @click="continuar"
          >
            {{ t.restaurar }}
          </NButton>
        </template>
        <template v-else-if="paso === 'confirmar'">
          <NButton size="small" @click="paso = 'datos'">{{ es.bd.reemplazo.volver }}</NButton>
          <NButton
            size="small"
            type="error"
            :disabled="!confirmacionValida(base, escrito) || bd.enCurso"
            @click="confirmarReemplazo"
          >
            {{ es.bd.reemplazo.confirmar }}
          </NButton>
        </template>
        <template v-else>
          <NButton
            v-if="operacion?.estado === 'error' && !operacion.trasReemplazo"
            size="small"
            @click="volverADatos"
          >
            {{ es.acciones.reintentar }}
          </NButton>
          <NButton size="small" type="primary" :disabled="corriendo" @click="cerrar">
            {{ es.acciones.cerrar }}
          </NButton>
        </template>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.confianza {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(217, 119, 6, 0.35);
  background: rgba(217, 119, 6, 0.09);
  font-size: 12.5px;
  line-height: 1.45;
}
.confianza .n-icon {
  color: #d97706;
  flex: none;
  margin-top: 1px;
}
.archivo {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px dashed rgba(128, 128, 128, 0.35);
}
.archivo-icono {
  opacity: 0.6;
  flex: none;
}
.archivo-nombre {
  flex: 1;
  min-width: 0;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.archivo-vacio {
  flex: 1;
  font-size: 13px;
  opacity: 0.55;
}
.formato {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 4px;
  font-size: 12.5px;
}
.formato-etiqueta {
  opacity: 0.65;
}
.aviso-formato {
  display: flex;
  gap: 6px;
  margin: 6px 0 0;
  font-size: 12.5px;
  color: #d97706;
}
.aviso-formato .n-icon {
  flex: none;
  margin-top: 1px;
}
.destino {
  margin-top: 12px;
}
.mono :deep(input) {
  font-family: var(--fuente-mono);
}
.operacion {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.corriendo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 600;
}
.tenue {
  margin: 0;
  font-size: 12px;
  opacity: 0.6;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
