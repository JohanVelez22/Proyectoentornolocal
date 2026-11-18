<script setup lang="ts">
import { NButton, NCheckbox, NForm, NFormItem, NInput, NModal, useNotification } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { MotorBd, OpcionesCrearBase } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { problemaNombre } from '../utilidades/bd';

/** Crear una base vacía, opcionalmente con un usuario propio. */
const props = defineProps<{ motor: MotorBd }>();
const mostrar = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ creada: [nombre: string] }>();

const t = es.bd.dialogoNueva;
const notification = useNotification();
const { ejecutar, ocupado } = useAccion();

const nombre = ref('');
const conUsuario = ref(false);
const usuario = ref('');
const clave = ref('');

const nombreMotor = computed(() => es.bd.motores[props.motor] ?? props.motor);
const esMongo = computed(() => props.motor === 'mongodb');

function texto(p: ReturnType<typeof problemaNombre>): string {
  if (!p) return '';
  if (p === 'caracteres') return es.bd.nombre.caracteres[props.motor] ?? '';
  return es.bd.nombre[p];
}
const problema = computed(() => problemaNombre(props.motor, nombre.value));
const problemaUsuario = computed(() =>
  conUsuario.value ? problemaNombre(props.motor, usuario.value) : null,
);
const valido = computed(
  () =>
    !problema.value && (!conUsuario.value || (!problemaUsuario.value && clave.value.length > 0)),
);

watch(mostrar, () => {
  nombre.value = '';
  conUsuario.value = false;
  usuario.value = '';
  clave.value = '';
});

async function crear(): Promise<void> {
  if (!valido.value || ocupado('crear')) return;
  const n = nombre.value;
  const opciones: OpcionesCrearBase | undefined =
    conUsuario.value && !esMongo.value ? { usuario: usuario.value, clave: clave.value } : undefined;
  const r = await ejecutar('crear', () => api().bd.crear(props.motor, n, opciones), {
    exito: t.creada(n),
  });
  clave.value = '';
  if (!r) return;
  if (r.aviso) notification.warning({ title: t.creada(n), content: r.aviso, duration: 8000 });
  emit('creada', n);
  mostrar.value = false;
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo(nombreMotor)"
    size="small"
    :bordered="false"
    :style="{ width: '460px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="!ocupado('crear')"
    :closable="!ocupado('crear')"
  >
    <NForm autocomplete="off" @submit.prevent="crear">
      <NFormItem
        :label="es.bd.nombre.etiqueta"
        :validation-status="nombre && problema ? 'error' : undefined"
        :feedback="nombre ? texto(problema) : ''"
      >
        <NInput
          v-model:value="nombre"
          placeholder=""
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
          class="mono"
          autofocus
        />
      </NFormItem>
      <p class="codificacion">
        <span>{{ t.codificacion }}:</span> {{ t.codificacionValor[motor] }}
      </p>
      <p v-if="esMongo" class="tenue">{{ t.mongo }}</p>

      <template v-else>
        <NCheckbox v-model:checked="conUsuario">{{ t.usuarioPropio }}</NCheckbox>
        <p class="tenue">{{ t.usuarioPropioAyuda }}</p>
        <div v-if="conUsuario" class="fila">
          <NFormItem
            :label="t.usuario"
            class="crece"
            :validation-status="usuario && problemaUsuario ? 'error' : undefined"
            :feedback="usuario ? texto(problemaUsuario) : ''"
          >
            <NInput
              v-model:value="usuario"
              placeholder=""
              :input-props="{ spellcheck: false, autocomplete: 'off' }"
              class="mono"
            />
          </NFormItem>
          <NFormItem :label="t.clave" class="crece" :feedback="clave ? '' : t.faltaClave">
            <NInput
              v-model:value="clave"
              placeholder=""
              type="password"
              show-password-on="click"
              :input-props="{ autocomplete: 'new-password' }"
            />
          </NFormItem>
        </div>
      </template>
    </NForm>
    <template #action>
      <div class="acciones">
        <NButton size="small" :disabled="ocupado('crear')" @click="mostrar = false">
          {{ es.acciones.cancelar }}
        </NButton>
        <NButton
          size="small"
          type="primary"
          :disabled="!valido"
          :loading="ocupado('crear')"
          @click="crear"
        >
          {{ t.crear }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.mono :deep(input) {
  font-family: var(--fuente-mono);
}
.codificacion {
  margin: 0 0 12px;
  font-size: 12.5px;
}
.codificacion span {
  opacity: 0.6;
}
.tenue {
  margin: 4px 0 10px;
  font-size: 12px;
  opacity: 0.6;
}
.fila {
  display: flex;
  gap: 12px;
}
.crece {
  flex: 1;
  min-width: 0;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
