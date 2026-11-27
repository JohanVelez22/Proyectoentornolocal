<script setup lang="ts">
import {
  NButton,
  NCheckbox,
  NForm,
  NFormItem,
  NInput,
  NModal,
  useDialog,
  useNotification,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { MotorBd, OpcionesCrearBase } from '../../shared/api';
import { api } from '../api';
import { useBd } from '../stores/bd';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { problemaNombre } from '../utilidades/bd';

/** Crear una base vacía, opcionalmente con un usuario propio. */
const props = defineProps<{ motor: MotorBd }>();
const mostrar = defineModel<boolean>('show', { required: true });
const bd = useBd();
const emit = defineEmits<{ creada: [nombre: string] }>();

const t = textos.bd.dialogoNueva;
const notification = useNotification();
const dialog = useDialog();
const { ejecutar, ocupado } = useAccion();

const nombre = ref('');
const conUsuario = ref(false);
const usuario = ref('');
const clave = ref('');

const nombreMotor = computed(() => textos.bd.motores[props.motor] ?? props.motor);
const esMongo = computed(() => props.motor === 'mongodb');

function texto(p: ReturnType<typeof problemaNombre>): string {
  if (!p) return '';
  if (p === 'caracteres') return textos.bd.nombre.caracteres[props.motor] ?? '';
  return textos.bd.nombre[p];
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

/** Pide confirmación explícita para cambiar la clave de un usuario que ya existe. */
function confirmarCambioClave(u: string): Promise<boolean> {
  return new Promise((resolver) => {
    dialog.warning({
      title: t.cambiarClaveTitulo(u),
      content: t.cambiarClaveTexto(u),
      positiveText: t.cambiarClave,
      negativeText: textos.acciones.cancelar,
      onPositiveClick: () => resolver(true),
      onNegativeClick: () => resolver(false),
      onClose: () => resolver(false),
      onMaskClick: () => resolver(false),
      onEsc: () => resolver(false),
    });
  });
}

async function crear(): Promise<void> {
  if (!valido.value || ocupado('crear')) return;
  const n = nombre.value;
  const opciones: OpcionesCrearBase | undefined =
    conUsuario.value && !esMongo.value ? { usuario: usuario.value, clave: clave.value } : undefined;
  const r = await ejecutar(
    'crear',
    async () => {
      try {
        return await api().bd.crear(bd.objetivo(props.motor), n, opciones);
      } catch (e) {
        // Usuario existente con otra clave: solo se cambia si el usuario lo confirma.
        const codigo = (e as { codigo?: unknown } | null)?.codigo;
        if (codigo !== 'bd.usuario_clave_distinta' || !opciones) throw e;
        if (!(await confirmarCambioClave(opciones.usuario ?? ''))) throw e;
        return api().bd.crear(bd.objetivo(props.motor), n, { ...opciones, cambiarClave: true });
      }
    },
    { exito: t.creada(n) },
  );
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
        :label="textos.bd.nombre.etiqueta"
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
          {{ textos.acciones.cancelar }}
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
  opacity: 0.72;
}
.tenue {
  margin: 4px 0 10px;
  font-size: 12px;
  opacity: 0.72;
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
