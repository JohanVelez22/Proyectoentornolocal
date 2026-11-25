<script setup lang="ts">
import { KeyOutline, TrashOutline } from '@vicons/ionicons5';
import {
  NButton,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  useDialog,
  useMessage,
  type SelectOption,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { PresetSmtp, ProveedorSmtpPublico } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import Desplegable from './Desplegable.vue';

/**
 * Alta y edición de un proveedor SMTP. La clave se escribe en un campo de contraseña y va directo
 * al proceso principal al guardar; el campo se vacía siempre y nunca se rellena.
 */
const props = defineProps<{
  proveedor: ProveedorSmtpPublico | null;
  presets: PresetSmtp[];
  existentes: string[];
}>();
const mostrar = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{
  guardado: [lista: ProveedorSmtpPublico[]];
  borrarClave: [proveedor: ProveedorSmtpPublico];
}>();

const t = textos.correo.proveedores.dialogo;
const dialog = useDialog();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const OTRO = '__otro__';
const preset = ref<string>(OTRO);
const region = ref<string | null>(null);
const nombre = ref('');
const host = ref('');
const puerto = ref<number | null>(587);
const seguridad = ref<'tls' | 'starttls'>('starttls');
const usuario = ref('');
/** Solo vive mientras el diálogo está abierto; se vacía al guardar o cerrar. */
const clave = ref('');
const intentado = ref(false);

const editando = computed(() => props.proveedor !== null);
const presetActual = computed(() => props.presets.find((p) => p.id === preset.value) ?? null);
const conRegion = computed(() => !!presetActual.value?.regiones);
const usuarioFijo = computed(() => presetActual.value?.usuarioFijo ?? null);
const opcionesPreset = computed<SelectOption[]>(() => [
  ...props.presets.map((p) => ({ value: p.id, label: p.nombre })),
  { value: OTRO, label: t.presetOtro },
]);
const opcionesRegion = computed<SelectOption[]>(() =>
  (presetActual.value?.regiones ?? []).map((r) => ({ value: r, label: r })),
);
const opcionesSeguridad = computed<SelectOption[]>(() => [
  { value: 'starttls', label: t.starttls },
  { value: 'tls', label: t.tls },
]);
const enmascarada = computed(() => props.proveedor?.clave.final ?? null);
const errorNombre = computed(() => (nombre.value.trim() ? null : t.nombreObligatorio));
const errorHost = computed(() => (host.value.trim() ? null : t.hostObligatorio));
const errorUsuario = computed(() => (usuario.value.trim() ? null : t.usuarioObligatorio));
const valido = computed(
  () => !errorNombre.value && !errorHost.value && !errorUsuario.value && puerto.value !== null,
);

function idDeNombre(): string {
  const base =
    nombre.value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'smtp';
  let id = base;
  for (let i = 2; props.existentes.includes(id); i++) id = `${base}-${i}`;
  return id;
}

watch(mostrar, (v) => {
  clave.value = '';
  intentado.value = false;
  if (!v) return;
  const p = props.proveedor;
  preset.value = OTRO;
  region.value = null;
  nombre.value = p?.nombre ?? '';
  host.value = p?.host ?? '';
  puerto.value = p?.puerto ?? 587;
  seguridad.value = p?.seguridad ?? 'starttls';
  usuario.value = p?.usuario ?? '';
});

watch(preset, (id) => {
  const p = props.presets.find((x) => x.id === id);
  if (!p || editando.value) return;
  nombre.value = p.nombre;
  puerto.value = p.puerto;
  seguridad.value = p.seguridad;
  usuario.value = p.usuarioFijo ?? '';
  region.value = p.regiones ? (p.regiones[0] ?? null) : null;
  host.value = p.regiones ? '' : p.host;
});

watch(region, (r) => {
  const p = presetActual.value;
  if (p?.regiones && r) host.value = p.host.replace('{region}', r);
});

watch(seguridad, (s, antes) => {
  // Los puertos de siempre: 465 con TLS directo y 587 con STARTTLS.
  if (editando.value || presetActual.value) return;
  if (s === 'tls' && puerto.value === 587) puerto.value = 465;
  if (s === 'starttls' && puerto.value === 465 && antes === 'tls') puerto.value = 587;
});

function confirmar(o: { titulo: string; texto: string; boton: string }): Promise<boolean> {
  return new Promise((resolver) => {
    dialog.warning({
      title: o.titulo,
      content: o.texto,
      positiveText: o.boton,
      negativeText: textos.acciones.cancelar,
      autoFocus: false,
      onPositiveClick: () => resolver(true),
      onNegativeClick: () => resolver(false),
      onClose: () => resolver(false),
      onMaskClick: () => resolver(false),
    });
  });
}

async function guardarConfig(): Promise<ProveedorSmtpPublico[] | null> {
  const datos = {
    id: props.proveedor?.id ?? idDeNombre(),
    nombre: nombre.value.trim(),
    host: host.value.trim().toLowerCase(),
    puerto: puerto.value ?? 587,
    seguridad: seguridad.value,
    usuario: usuario.value.trim(),
  };
  const opciones: { confirmarRedLocal?: true; confirmarCambio?: true } = {};
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    try {
      return await api().correo.guardarProveedor(datos, opciones);
    } catch (e) {
      const codigo = (e as { codigo?: unknown }).codigo;
      if (codigo === 'correo.host_local' && !opciones.confirmarRedLocal) {
        const ok = await confirmar({
          titulo: t.redLocalTitulo,
          texto: t.redLocalTexto(datos.host),
          boton: t.redLocalConfirmar,
        });
        if (!ok) return null;
        opciones.confirmarRedLocal = true;
      } else if (codigo === 'correo.cambia_con_clave' && !opciones.confirmarCambio) {
        const ok = await confirmar({
          titulo: t.cambiaTitulo,
          texto: t.cambiaTexto(datos.host),
          boton: t.cambiaConfirmar,
        });
        if (!ok) return null;
        opciones.confirmarCambio = true;
      } else throw e;
    }
  }
  return null;
}

async function guardar(): Promise<void> {
  intentado.value = true;
  if (!valido.value || ocupado('guardar')) return;
  // La clave sale del campo ya mismo: aunque algo falle, no queda en la pantalla.
  const nueva = clave.value.trim();
  clave.value = '';
  const nombreGuardado = nombre.value.trim();
  const id = props.proveedor?.id ?? idDeNombre();
  const lista = await ejecutar('guardar', async () => {
    const l = await guardarConfig();
    if (!l) return null;
    if (nueva) {
      const estado = await api().correo.guardarClave(id, nueva);
      return l.map((p) => (p.id === id ? { ...p, clave: estado } : p));
    }
    return l;
  });
  if (lista) {
    emit('guardado', lista);
    message.success(t.guardado(nombreGuardado));
    mostrar.value = false;
  }
}

function abrirDocumentacion(): void {
  const u = presetActual.value?.fuente;
  if (u) void ejecutar('documentacion', () => api().sistema.abrirUrl(u));
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
    :style="{ width: '540px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <NForm label-placement="top" :show-require-mark="false" @submit.prevent="guardar">
      <NFormItem v-if="!editando" :label="t.preset" :feedback="t.presetAyuda">
        <Desplegable v-model:value="preset" :options="opcionesPreset" />
        <a
          v-if="presetActual"
          class="doc"
          :href="presetActual.fuente"
          @click.prevent="abrirDocumentacion"
          >{{ t.documentacion }}</a
        >
      </NFormItem>
      <NFormItem v-if="conRegion && !editando" :label="t.region">
        <Desplegable v-model:value="region" :options="opcionesRegion" />
      </NFormItem>
      <NFormItem
        :label="t.nombre"
        :validation-status="intentado && errorNombre ? 'error' : undefined"
        :feedback="intentado && errorNombre ? errorNombre : undefined"
      >
        <NInput v-model:value="nombre" :maxlength="60" />
      </NFormItem>
      <div class="par">
        <NFormItem
          :label="t.host"
          class="host"
          :feedback="intentado && errorHost ? errorHost : t.hostAyuda"
          :validation-status="intentado && errorHost ? 'error' : undefined"
        >
          <NInput
            v-model:value="host"
            :maxlength="253"
            placeholder="smtp.ejemplo.com"
            :input-props="{ spellcheck: false, autocomplete: 'off' }"
            class="mono"
          />
        </NFormItem>
        <NFormItem :label="t.puerto" class="puerto">
          <NInputNumber v-model:value="puerto" :min="1" :max="65535" :show-button="false" />
        </NFormItem>
      </div>
      <NFormItem :label="t.seguridad" :feedback="t.seguridadAyuda">
        <Desplegable v-model:value="seguridad" :options="opcionesSeguridad" />
      </NFormItem>
      <NFormItem
        :label="t.usuario"
        :feedback="usuarioFijo ? t.usuarioFijoAyuda : undefined"
        :validation-status="intentado && errorUsuario ? 'error' : undefined"
      >
        <NInput
          v-model:value="usuario"
          :maxlength="256"
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
          class="mono"
        />
      </NFormItem>
      <NFormItem
        :label="t.clave"
        :feedback="enmascarada ? t.claveGuardada(enmascarada) : t.claveAyuda"
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
      <p class="ayuda">{{ t.claveSinEspacios }}</p>
      <button type="submit" hidden />
    </NForm>
    <template #footer>
      <div class="pie">
        <NButton
          v-if="proveedor?.clave.configurada"
          quaternary
          type="error"
          size="small"
          @click="emit('borrarClave', proveedor)"
        >
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
.par {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px;
  gap: 0 12px;
}
.doc {
  margin-left: 12px;
  font-size: 12px;
  white-space: nowrap;
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
