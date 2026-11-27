<script setup lang="ts">
import { WarningOutline } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NFormItem,
  NIcon,
  NModal,
  NSkeleton,
  useDialog,
  useMessage,
  type SelectOption,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { ProveedorSmtpPublico } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useSitios } from '../stores/sitios';
import Desplegable from './Desplegable.vue';
import VistaDiff from './VistaDiff.vue';

/**
 * "Usar en un proyecto": vista previa (con la clave enmascarada) del bloque `MAIL_*` y escritura en
 * el `.env`. La clave solo pasa al `.env` si se marca expresamente y se confirma el aviso de texto
 * plano; sin marcar, el bloque no lleva `MAIL_PASSWORD`.
 */
const props = defineProps<{ proveedor: ProveedorSmtpPublico }>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.correo.proveedores.env;
const dialog = useDialog();
const message = useMessage();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

const sitioId = ref<string | null>(null);
const incluirClave = ref(false);
const vista = ref<{ diff: string; huella: string } | null>(null);
const agregarGitignore = ref(false);
const aceptarVersionado = ref(false);
/** El núcleo dijo que git sigue el .env (true) o que no pudo comprobarlo (null). */
const versionado = ref<boolean | null | undefined>(undefined);

const opcionesSitio = computed<SelectOption[]>(() =>
  [...sitios.lista]
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((s) => ({ value: s.id, label: `${s.nombre} · ${s.dominio}` })),
);
const sitio = computed(() => sitios.lista.find((s) => s.id === sitioId.value) ?? null);
const usaSmtp = computed(() => sitio.value?.correo?.modo === 'smtp');
const pideAceptar = computed(() => versionado.value !== undefined);
const puedeEscribir = computed(
  () =>
    !!sitio.value &&
    !!vista.value &&
    (!pideAceptar.value || aceptarVersionado.value) &&
    !ocupado('escribir'),
);

function reiniciar(): void {
  vista.value = null;
  incluirClave.value = false;
  agregarGitignore.value = false;
  aceptarVersionado.value = false;
  versionado.value = undefined;
}

watch(
  mostrar,
  (v) => {
    reiniciar();
    if (!v) return;
    if (!sitios.lista.some((s) => s.id === sitioId.value)) {
      sitioId.value = sitios.lista[0]?.id ?? null;
    }
    void cargar();
  },
  { immediate: true },
);
watch([sitioId, incluirClave], () => {
  if (!mostrar.value) return;
  vista.value = null;
  versionado.value = undefined;
  aceptarVersionado.value = false;
  void cargar();
});

async function cargar(): Promise<void> {
  const id = sitioId.value;
  const incluir = incluirClave.value;
  if (!id) return;
  const v = await ejecutar('vista', () =>
    api().correo.vistaPreviaEnv(id, props.proveedor.id, incluir),
  );
  // Si se cambió de proyecto o de opción mientras tanto, esta vista ya no vale.
  if (!mostrar.value || id !== sitioId.value || incluir !== incluirClave.value) return;
  vista.value = v ?? null;
}

function confirmar(o: {
  titulo: string;
  texto: string;
  boton: string;
  tipo?: 'warning' | 'error';
}): Promise<boolean> {
  return new Promise((resolver) => {
    dialog[o.tipo ?? 'warning']({
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

async function cambiarClave(v: boolean): Promise<void> {
  if (!v) {
    incluirClave.value = false;
    return;
  }
  incluirClave.value = await confirmar({
    titulo: t.claveTitulo,
    texto: t.claveTexto,
    boton: t.claveConfirmar,
    tipo: 'error',
  });
}

async function cambiarGitignore(v: boolean): Promise<void> {
  if (!v) {
    agregarGitignore.value = false;
    return;
  }
  agregarGitignore.value = await confirmar({
    titulo: t.gitignoreTitulo,
    texto: t.gitignoreTexto,
    boton: t.gitignoreConfirmar,
  });
}

async function cambiarAceptar(v: boolean): Promise<void> {
  if (!v) {
    aceptarVersionado.value = false;
    return;
  }
  aceptarVersionado.value = await confirmar({
    titulo: t.aceptarTitulo,
    texto: t.aceptarTexto,
    boton: t.aceptarConfirmar,
    tipo: 'error',
  });
}

async function escribir(): Promise<void> {
  const s = sitio.value;
  const v = vista.value;
  if (!s || !v || !puedeEscribir.value) return;
  const ruta = `${s.carpeta}${s.carpeta.includes('/') ? '/' : '\\'}.env`;
  const ok = await confirmar({
    titulo: t.confirmarTitulo,
    texto: incluirClave.value ? t.confirmarTextoClave(ruta) : t.confirmarTexto(ruta),
    boton: t.confirmar,
  });
  if (!ok) return;
  const r = await ejecutar('escribir', async () => {
    try {
      return await api().correo.escribirEnv(s.id, props.proveedor.id, {
        confirmado: true,
        incluirClave: incluirClave.value,
        huella: v.huella,
        ...(agregarGitignore.value ? { agregarGitignore: true } : {}),
        ...(aceptarVersionado.value ? { aceptarVersionado: true } : {}),
      });
    } catch (e) {
      const codigo = (e as { codigo?: unknown }).codigo;
      // Estos dos se resuelven en el mismo diálogo, con su confirmación aparte.
      if (codigo === 'env.versionado' || codigo === 'env.versionado_desconocido') {
        versionado.value = codigo === 'env.versionado' ? true : null;
        aceptarVersionado.value = false;
        return null;
      }
      throw e;
    }
  });
  if (r) {
    message.success(t.escrito(s.nombre));
    mostrar.value = false;
  }
}

async function volverAlCaptador(): Promise<void> {
  const s = sitio.value;
  if (!s) return;
  const ok = await ejecutar('captador', async () => {
    await api().correo.usarEnSitio(s.id, { modo: 'captador' });
    return true;
  });
  if (ok) message.success(t.volvio(s.nombre));
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo(proveedor.nombre)"
    size="small"
    :bordered="false"
    :mask-closable="!ocupado('escribir')"
    :style="{ width: '620px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <p v-if="!sitios.lista.length" class="tenue">{{ t.sinProyectos }}</p>
    <template v-else>
      <NFormItem :label="t.proyecto">
        <Desplegable v-model:value="sitioId" :options="opcionesSitio" filterable />
      </NFormItem>
      <p v-if="usaSmtp" class="tenue">
        {{ t.yaUsaSmtp }}
        <NButton size="tiny" quaternary :loading="ocupado('captador')" @click="volverAlCaptador">
          {{ t.volverCaptador }}
        </NButton>
      </p>

      <NCheckbox
        :checked="incluirClave"
        :disabled="!proveedor.clave.configurada"
        @update:checked="cambiarClave"
      >
        {{ t.incluirClave }}
      </NCheckbox>
      <p class="tenue">
        {{ proveedor.clave.configurada ? t.incluirClaveAyuda : t.sinClaveGuardada }}
      </p>

      <span class="etiqueta">{{ t.vista }}</span>
      <NSkeleton v-if="ocupado('vista') && !vista" text :repeat="3" />
      <VistaDiff v-else-if="vista" :diff="vista.diff" :aria-busy="ocupado('vista')" />

      <template v-if="vista">
        <NAlert v-if="incluirClave" type="warning" class="aviso">
          <template #icon
            ><NIcon><WarningOutline /></NIcon
          ></template>
          {{ t.textoPlano }}
        </NAlert>
        <div class="fila">
          <NCheckbox :checked="agregarGitignore" @update:checked="cambiarGitignore">
            {{ t.agregarGitignore }}
          </NCheckbox>
        </div>
        <NAlert
          v-if="pideAceptar"
          :type="versionado ? 'error' : 'warning'"
          :title="versionado ? t.versionadoTitulo : t.desconocidoTitulo"
          class="aviso"
        >
          <p class="alerta-texto">{{ versionado ? t.versionadoTexto : t.desconocidoTexto }}</p>
          <NCheckbox :checked="aceptarVersionado" @update:checked="cambiarAceptar">
            {{ t.aceptarVersionado }}
          </NCheckbox>
        </NAlert>
      </template>
    </template>
    <template #footer>
      <div class="pie">
        <NButton :disabled="ocupado('escribir')" @click="mostrar = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton
          type="primary"
          :disabled="!puedeEscribir"
          :loading="ocupado('escribir')"
          @click="escribir"
        >
          {{ t.escribir }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.etiqueta {
  display: block;
  font-size: 12.5px;
  font-weight: 500;
  margin: 12px 0 6px;
}
.aviso {
  margin-top: 10px;
}
.alerta-texto {
  margin: 0 0 6px;
}
.fila {
  margin-top: 10px;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.76;
  margin: 4px 0 0;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
