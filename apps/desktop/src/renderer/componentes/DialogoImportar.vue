<script setup lang="ts">
import { EyeOutline, InformationCircle } from '@vicons/ionicons5';
import { NButton, NForm, NFormItem, NIcon, NInput, NInputNumber, NModal, NSpin } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { IdInstancia, MotorSql, OrigenImportar } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { LIMITE_LINEAS, useBd } from '../stores/bd';
import { useServicios } from '../stores/servicios';
import {
  confirmacionValida,
  nombreDesdeArchivo,
  opcionesRestaurar,
  origenSugerido,
  problemaNombre,
} from '../utilidades/bd';
import ConfirmarReemplazo from './ConfirmarReemplazo.vue';
import PanelProgreso from './PanelProgreso.vue';
import ResultadoOperacion from './ResultadoOperacion.vue';

/**
 * Copia una base de otro servidor (p. ej. el MySQL de FlyEnv) a una base local. La clave vive
 * solo en este diálogo: se borra al lanzar la copia y al cerrar, y nunca pasa al store.
 */
const props = defineProps<{ motor: MotorSql }>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.bd.dialogoImportar;
const bd = useBd();
const servicios = useServicios();
const { ejecutar, ocupado } = useAccion();

type Paso = 'datos' | 'confirmar' | 'operacion';
const paso = ref<Paso>('datos');
const host = ref('127.0.0.1');
const puerto = ref<number | null>(null);
const usuario = ref('');
const clave = ref('');
const baseOrigen = ref('');
const destino = ref('');
const destinoTocado = ref(false);
const escrito = ref('');
const detectado = ref<number | null>(null);

const nombreMotor = computed(() => textos.bd.motores[props.motor] ?? props.motor);
const corriendo = computed(() => paso.value === 'operacion' && bd.enCurso);
const operacion = computed(() => (paso.value === 'operacion' ? bd.operacion : null));

const problemaDestino = computed(() => problemaNombre(props.motor, destino.value));
const textoProblema = computed(() => {
  const p = problemaDestino.value;
  if (!p) return '';
  if (p === 'caracteres') return textos.bd.nombre.caracteres[props.motor] ?? '';
  return textos.bd.nombre[p];
});
const puertoValido = computed(
  () => puerto.value !== null && puerto.value >= 1 && puerto.value <= 65535,
);
const completo = computed(
  () =>
    host.value.trim() !== '' &&
    puertoValido.value &&
    usuario.value.trim() !== '' &&
    baseOrigen.value.trim() !== '' &&
    !problemaDestino.value,
);

function olvidarClave(): void {
  clave.value = '';
}

watch(mostrar, (v) => {
  olvidarClave();
  if (!v) return;
  const s = origenSugerido(props.motor, servicios.visibles);
  paso.value = 'datos';
  host.value = s.host;
  puerto.value = s.puerto;
  detectado.value = s.puerto;
  usuario.value = s.usuario;
  baseOrigen.value = '';
  destino.value = '';
  destinoTocado.value = false;
  escrito.value = '';
});

// El destino sigue a la base de origen (saneada) hasta que el usuario lo cambia a mano.
watch(baseOrigen, (b) => {
  if (!destinoTocado.value) destino.value = b.trim() ? nombreDesdeArchivo(b, props.motor) : '';
});

async function continuar(): Promise<void> {
  if (!completo.value || bd.enCurso || ocupado('revisar')) return;
  const tablas = await ejecutar('revisar', () =>
    api().bd.tieneTablas(bd.objetivo(props.motor) as MotorSql | IdInstancia, destino.value),
  );
  if (tablas === undefined) return;
  if (opcionesRestaurar(tablas, false) === null) {
    escrito.value = '';
    paso.value = 'confirmar';
    return;
  }
  await lanzar(false);
}

async function confirmarReemplazo(): Promise<void> {
  if (!confirmacionValida(destino.value, escrito.value)) return;
  await lanzar(true);
}

async function lanzar(confirmado: boolean): Promise<void> {
  if (bd.enCurso || puerto.value === null) return;
  const origen: OrigenImportar = {
    host: host.value.trim(),
    puerto: puerto.value,
    usuario: usuario.value.trim(),
    clave: clave.value,
    base: baseOrigen.value.trim(),
  };
  olvidarClave();
  paso.value = 'operacion';
  await bd.importar(props.motor, origen, destino.value, confirmado);
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
  olvidarClave();
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
    :style="{ width: '560px', maxWidth: 'calc(100vw - 32px)' }"
    :closable="!corriendo"
    :mask-closable="!corriendo"
    :close-on-esc="!corriendo"
    @update:show="alCambiar"
  >
    <div class="solo-lectura" role="note">
      <NIcon :size="18"><EyeOutline /></NIcon>
      <span>{{ t.soloLectura }}</span>
    </div>

    <NForm
      v-if="paso === 'datos'"
      :show-feedback="true"
      autocomplete="off"
      @submit.prevent="continuar"
    >
      <p v-if="detectado !== null" class="detectado">
        <NIcon :size="16"><InformationCircle /></NIcon>
        <span>{{ t.detectado(detectado) }}</span>
      </p>
      <fieldset class="grupo">
        <legend>{{ t.origen }}</legend>
        <div class="fila">
          <NFormItem
            :label="t.host"
            class="crece"
            :validation-status="host.trim() ? undefined : 'error'"
            :feedback="host.trim() ? '' : t.faltaHost"
          >
            <NInput
              v-model:value="host"
              placeholder=""
              :input-props="{ spellcheck: false, autocomplete: 'off' }"
              class="mono"
            />
          </NFormItem>
          <NFormItem
            :label="t.puerto"
            class="puerto"
            :validation-status="puertoValido ? undefined : 'error'"
            :feedback="puertoValido ? '' : t.faltaPuerto"
          >
            <NInputNumber
              v-model:value="puerto"
              :min="1"
              :max="65535"
              :show-button="false"
              class="mono"
            />
          </NFormItem>
        </div>
        <div class="fila">
          <NFormItem :label="t.usuario" class="crece">
            <NInput
              v-model:value="usuario"
              placeholder=""
              :input-props="{ spellcheck: false, autocomplete: 'off' }"
              class="mono"
            />
          </NFormItem>
          <NFormItem :label="t.clave" class="crece" :feedback="t.claveAyuda">
            <NInput
              v-model:value="clave"
              placeholder=""
              type="password"
              show-password-on="click"
              :input-props="{ autocomplete: 'new-password' }"
            />
          </NFormItem>
        </div>
        <NFormItem :label="t.baseOrigen">
          <NInput
            v-model:value="baseOrigen"
            placeholder=""
            :input-props="{ spellcheck: false, autocomplete: 'off' }"
            class="mono"
          />
        </NFormItem>
      </fieldset>

      <NFormItem
        :label="t.destino"
        :validation-status="destino && problemaDestino ? 'error' : undefined"
        :feedback="destino && problemaDestino ? textoProblema : t.destinoAyuda"
      >
        <NInput
          v-model:value="destino"
          placeholder=""
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
          class="mono"
          @update:value="destinoTocado = true"
        />
      </NFormItem>
    </NForm>

    <NForm v-else-if="paso === 'confirmar'" @submit.prevent="confirmarReemplazo">
      <ConfirmarReemplazo v-model="escrito" :base="destino" />
    </NForm>

    <div v-else class="operacion">
      <p v-if="corriendo" class="corriendo">
        <NSpin :size="16" />
        <span>{{ textos.bd.progreso.corriendo.importar?.(destino) }}</span>
      </p>
      <p v-if="corriendo" class="tenue">{{ textos.bd.progreso.noCierre }}</p>
      <PanelProgreso :lineas="bd.lineas" :limite="LIMITE_LINEAS" />
      <ResultadoOperacion
        v-if="operacion && operacion.estado !== 'corriendo'"
        :operacion="operacion"
      />
    </div>

    <template #action>
      <div class="acciones">
        <template v-if="paso === 'datos'">
          <NButton size="small" @click="cerrar">{{ textos.acciones.cancelar }}</NButton>
          <NButton
            size="small"
            type="primary"
            :disabled="!completo || bd.enCurso"
            :loading="ocupado('revisar')"
            @click="continuar"
          >
            {{ t.importar }}
          </NButton>
        </template>
        <template v-else-if="paso === 'confirmar'">
          <NButton size="small" @click="paso = 'datos'">{{ textos.bd.reemplazo.volver }}</NButton>
          <NButton
            size="small"
            type="error"
            :disabled="!confirmacionValida(destino, escrito) || bd.enCurso"
            @click="confirmarReemplazo"
          >
            {{ textos.bd.reemplazo.confirmar }}
          </NButton>
        </template>
        <template v-else>
          <NButton
            v-if="operacion?.estado === 'error' && !operacion.trasReemplazo"
            size="small"
            @click="volverADatos"
          >
            {{ textos.acciones.reintentar }}
          </NButton>
          <NButton size="small" type="primary" :disabled="corriendo" @click="cerrar">
            {{ textos.acciones.cerrar }}
          </NButton>
        </template>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.solo-lectura {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--acento-rgb), 0.3);
  background: rgba(var(--acento-rgb), 0.08);
  font-size: 12.5px;
  line-height: 1.45;
}
.solo-lectura .n-icon {
  color: #5b67e6;
  flex: none;
  margin-top: 1px;
}
.detectado {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 12.5px;
  opacity: 0.8;
}
.grupo {
  margin: 0 0 6px;
  padding: 8px 12px 0;
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 10px;
}
.grupo legend {
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.75;
}
.fila {
  display: flex;
  gap: 12px;
}
.crece {
  flex: 1;
  min-width: 0;
}
.puerto {
  width: 120px;
  flex: none;
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
  opacity: 0.72;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
