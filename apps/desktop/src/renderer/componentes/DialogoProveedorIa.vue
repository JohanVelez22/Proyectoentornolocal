<script setup lang="ts">
import { KeyOutline, TrashOutline } from '@vicons/ionicons5';
import {
  NButton,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  useDialog,
  useMessage,
  type SelectOption,
} from 'naive-ui';
import Desplegable from './Desplegable.vue';
import { computed, ref, watch } from 'vue';
import type { ConfigProveedorIa, ProveedorIaPublico } from '../../shared/api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useIa } from '../stores/ia';
import {
  claveEnmascarada,
  idDeNombre,
  PRESETS_COMPATIBLES,
  TIPOS_CON_CLAVE,
  TIPOS_NUBE,
  URL_POR_DEFECTO,
  urlEfectiva,
  type TipoNube,
} from '../utilidades/ia';

/**
 * Alta y edición de un proveedor en la nube. La clave se escribe en un campo de contraseña y
 * va directo al proceso principal al guardar; el campo se vacía siempre y nunca se rellena.
 */
const props = defineProps<{ proveedor: ProveedorIaPublico | null }>();
const mostrar = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ borrarClave: [proveedor: ProveedorIaPublico] }>();

const t = textos.ia.dialogo;
const dialog = useDialog();
const message = useMessage();
const ia = useIa();
const { ejecutar, ocupado } = useAccion();

const tipo = ref<TipoNube>('openai');
const preset = ref<string | null>(null);
const nombre = ref('');
const urlBase = ref('');
const modelo = ref('');
/** Solo vive mientras el diálogo está abierto; se vacía al guardar o cerrar. */
const clave = ref('');
const intentado = ref(false);

const editando = computed(() => props.proveedor !== null);
const opcionesTipo = computed<SelectOption[]>(() =>
  TIPOS_NUBE.map((v) => ({ value: v, label: textos.ia.tipos[v] ?? v })),
);
const opcionesPreset = computed<SelectOption[]>(() => [
  ...PRESETS_COMPATIBLES.map((p) => ({ value: p.nombre, label: p.nombre })),
  { value: '', label: t.presetOtro },
]);
const enmascarada = computed(() => (props.proveedor ? claveEnmascarada(props.proveedor) : null));
const errorUrl = computed(() =>
  tipo.value === 'compatible' && !urlBase.value.trim() ? t.urlObligatoria : null,
);
const errorNombre = computed(() => (nombre.value.trim() ? null : t.nombre));
const placeholderUrl = computed(() => URL_POR_DEFECTO[tipo.value] ?? 'https://');
const valido = computed(() => !errorUrl.value && !errorNombre.value);

watch(mostrar, (v) => {
  clave.value = '';
  intentado.value = false;
  if (!v) return;
  const p = props.proveedor;
  tipo.value = p && p.tipo !== 'ollama' ? p.tipo : 'openai';
  nombre.value = p?.nombre ?? textos.ia.tipos['openai'] ?? 'OpenAI';
  urlBase.value = p?.urlBase ?? '';
  modelo.value = p?.modelo ?? '';
  preset.value = null;
});

// Un tipo nuevo cambia el nombre sugerido solo si seguía el del tipo anterior.
watch(tipo, (nuevo, viejo) => {
  if (editando.value) return;
  if (!nombre.value.trim() || nombre.value === textos.ia.tipos[viejo]) {
    nombre.value = textos.ia.tipos[nuevo] ?? nuevo;
  }
  if (nuevo !== 'compatible') preset.value = null;
});

watch(preset, (p) => {
  const elegido = PRESETS_COMPATIBLES.find((x) => x.nombre === p);
  if (!elegido) return;
  nombre.value = elegido.nombre;
  urlBase.value = elegido.urlBase;
});

function datos(): ConfigProveedorIa {
  const existentes = (ia.proveedores ?? []).map((p) => p.id);
  return {
    id: props.proveedor?.id ?? idDeNombre(nombre.value, tipo.value, existentes),
    tipo: tipo.value,
    nombre: nombre.value.trim(),
    urlBase: urlBase.value.trim() || null,
    modelo: modelo.value.trim() || null,
  };
}

/** Diálogo aparte: la clave guardada se mandaría a otro servidor. */
function confirmarCambioUrl(url: string): Promise<boolean> {
  return new Promise((resolver) => {
    dialog.warning({
      title: t.urlCambiaTitulo,
      content: t.urlCambiaTexto(url),
      positiveText: t.urlCambiaConfirmar,
      negativeText: textos.acciones.cancelar,
      autoFocus: false,
      onPositiveClick: () => resolver(true),
      onNegativeClick: () => resolver(false),
      onClose: () => resolver(false),
      onMaskClick: () => resolver(false),
    });
  });
}

async function guardarConfig(c: ConfigProveedorIa): Promise<boolean> {
  const previo = props.proveedor;
  let confirmado = false;
  if (previo?.clave.configurada && urlEfectiva(previo) !== urlEfectiva(c)) {
    if (!(await confirmarCambioUrl(urlEfectiva(c) ?? ''))) return false;
    confirmado = true;
  }
  try {
    await ia.guardarProveedor(c, confirmado ? true : undefined);
    return true;
  } catch (e) {
    // El proceso principal también lo comprueba (p. ej. la lista estaba vieja).
    if ((e as { codigo?: unknown }).codigo !== 'ia.url_cambia_con_clave' || confirmado) throw e;
    if (!(await confirmarCambioUrl(urlEfectiva(c) ?? ''))) return false;
    await ia.guardarProveedor(c, true);
    return true;
  }
}

async function guardar(): Promise<void> {
  intentado.value = true;
  if (!valido.value || ocupado('guardar')) return;
  const c = datos();
  // La clave sale del campo ya mismo: aunque algo falle, no queda en la pantalla.
  const nueva = clave.value.trim();
  clave.value = '';
  const ok = await ejecutar('guardar', async () => {
    if (!(await guardarConfig(c))) return false;
    if (nueva) await ia.guardarClave(c.id, nueva);
    return true;
  });
  if (ok) {
    message.success(t.guardado(c.nombre));
    mostrar.value = false;
  }
}

function borrarClave(): void {
  if (props.proveedor) emit('borrarClave', props.proveedor);
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="proveedor ? t.editar(proveedor.nombre) : t.nuevo"
    size="small"
    :bordered="false"
    :mask-closable="!ocupado('guardar')"
    :style="{ width: '520px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <NForm label-placement="top" :show-require-mark="false" @submit.prevent="guardar">
      <NFormItem :label="t.tipo">
        <Desplegable v-model:value="tipo" :options="opcionesTipo" :disabled="editando" />
      </NFormItem>
      <NFormItem
        v-if="tipo === 'compatible' && !editando"
        :label="t.preset"
        :feedback="t.presetAyuda"
      >
        <Desplegable v-model:value="preset" :options="opcionesPreset" clearable />
      </NFormItem>
      <NFormItem
        :label="t.nombre"
        :validation-status="intentado && errorNombre ? 'error' : undefined"
      >
        <NInput v-model:value="nombre" :maxlength="60" />
      </NFormItem>
      <NFormItem
        :label="t.urlBase"
        :feedback="intentado && errorUrl ? errorUrl : t.urlAyuda"
        :validation-status="intentado && errorUrl ? 'error' : undefined"
      >
        <NInput
          v-model:value="urlBase"
          :maxlength="500"
          :placeholder="placeholderUrl"
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
          class="mono"
        />
      </NFormItem>
      <NFormItem :label="t.modelo" :feedback="t.modeloAyuda">
        <NInput
          v-model:value="modelo"
          :maxlength="200"
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
          class="mono"
        />
      </NFormItem>
      <NFormItem
        :label="t.clave"
        :feedback="
          enmascarada
            ? t.claveGuardada(enmascarada)
            : TIPOS_CON_CLAVE.has(tipo)
              ? t.claveAyuda
              : t.claveOpcional
        "
      >
        <NInput
          v-model:value="clave"
          type="password"
          :maxlength="4096"
          :placeholder="t.claveNueva"
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
          class="mono"
        >
          <template #prefix
            ><NIcon><KeyOutline /></NIcon
          ></template>
        </NInput>
      </NFormItem>
      <p v-if="enmascarada" class="ayuda">{{ t.claveAyuda }}</p>
      <button type="submit" hidden />
    </NForm>
    <template #footer>
      <div class="pie">
        <NButton v-if="enmascarada" quaternary type="error" size="small" @click="borrarClave">
          <template #icon
            ><NIcon><TrashOutline /></NIcon
          ></template>
          {{ t.borrarClave }}
        </NButton>
        <span class="separador" />
        <NButton :disabled="ocupado('guardar')" @click="mostrar = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton type="primary" :loading="ocupado('guardar')" @click="guardar">
          {{ t.guardar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.mono :deep(input) {
  font-family: var(--fuente-mono);
}
.ayuda {
  margin: -6px 0 0;
  font-size: 12px;
  opacity: 0.65;
}
.pie {
  display: flex;
  align-items: center;
  gap: 8px;
}
.separador {
  flex: 1;
}
</style>
