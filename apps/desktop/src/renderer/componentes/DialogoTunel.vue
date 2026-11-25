<script setup lang="ts">
import { NAlert, NButton, NFormItem, NInput, NModal, NRadio, NRadioGroup } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Sitio } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';

const props = defineProps<{ show: boolean; sitio: Sitio }>();
const emit = defineEmits<{ 'update:show': [valor: boolean] }>();

const t = textos.tunel;
const { ejecutar, ocupado } = useAccion();

type Elegido = 'cloudflare-rapido' | 'cloudflare-nombre';
const elegido = ref<Elegido>('cloudflare-rapido');
const nombre = ref('');
const dominio = ref('');
const cuenta = ref<{ disponible: boolean; conectada: boolean }>({
  disponible: false,
  conectada: false,
});
const aviso = ref<string | null>(null);

/** Mismas reglas que valida el núcleo (que vuelve a validar al crear). */
const NOMBRE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const DOMINIO =
  /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;

const nombreOk = computed(() => NOMBRE.test(nombre.value));
const dominioOk = computed(() => DOMINIO.test(dominio.value));

async function leerCuenta(): Promise<void> {
  try {
    cuenta.value = await api().tuneles.cuentaCloudflare();
  } catch {
    cuenta.value = { disponible: false, conectada: false };
  }
}

watch(
  () => props.show,
  (visible) => {
    if (!visible) return;
    aviso.value = null;
    elegido.value =
      props.sitio.tunel?.proveedor === 'cloudflare-nombre'
        ? 'cloudflare-nombre'
        : 'cloudflare-rapido';
    nombre.value = props.sitio.tunel?.nombre ?? '';
    dominio.value = props.sitio.tunel?.dominio ?? '';
    void leerCuenta();
  },
  { immediate: true },
);

/** La URL de autorización llega en cuanto cloudflared la muestra. */
const urlAutorizacion = ref<string | null>(null);
let bajaAutorizacion: (() => void) | null = null;
onMounted(() => {
  bajaAutorizacion = api().on('tunel:autorizacion', (e) => {
    urlAutorizacion.value = e.url;
  });
});
onBeforeUnmount(() => bajaAutorizacion?.());

async function conectar(): Promise<void> {
  urlAutorizacion.value = null;
  await ejecutar('tunel-conectar', () => api().tuneles.conectarCloudflare(), {
    tituloError: t.opciones,
  });
  urlAutorizacion.value = null;
  await leerCuenta();
}

async function cancelarConexion(): Promise<void> {
  await ejecutar('tunel-cancelar', () => api().tuneles.cancelarConexionCloudflare());
}

function abrirAutorizacion(): void {
  if (urlAutorizacion.value)
    void ejecutar('tunel-url', () => api().sistema.abrirUrl(urlAutorizacion.value!));
}

function copiarAutorizacion(): void {
  if (urlAutorizacion.value) {
    void ejecutar('tunel-copiar', () => api().sistema.copiar(urlAutorizacion.value!), {
      exito: textos.acciones.copiado,
    });
  }
}

async function desconectar(): Promise<void> {
  await ejecutar('tunel-desconectar', () => api().tuneles.desconectarCloudflare(), {
    tituloError: t.opciones,
  });
  await leerCuenta();
}

async function crear(): Promise<void> {
  const ok = await ejecutar(
    'tunel-crear',
    async () => {
      await api().tuneles.configurarCloudflare(props.sitio.id, nombre.value, dominio.value);
      return true;
    },
    { tituloError: t.opciones },
  );
  if (ok) aviso.value = t.guardadoNombre;
}

async function usarRapido(): Promise<void> {
  const ok = await ejecutar(
    'tunel-rapido',
    async () => {
      await api().tuneles.usarTunelRapido(props.sitio.id);
      return true;
    },
    { tituloError: t.opciones },
  );
  if (ok) aviso.value = t.guardadoRapido;
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t.opcionesDe(sitio.dominio)"
    :style="{ width: 'min(520px, 94vw)' }"
    :segmented="{ content: true }"
    @update:show="emit('update:show', $event)"
  >
    <NFormItem :label="t.proveedor">
      <NRadioGroup v-model:value="elegido" name="proveedor-tunel">
        <div class="opciones">
          <NRadio value="cloudflare-rapido">
            <strong>{{ t.proveedorRapido }}</strong>
            <span class="ayuda">{{ t.proveedorRapidoAyuda }}</span>
          </NRadio>
          <NRadio value="cloudflare-nombre" :disabled="!cuenta.disponible">
            <strong>{{ t.proveedorNombre }}</strong>
            <span class="ayuda">{{ t.proveedorNombreAyuda }}</span>
          </NRadio>
        </div>
      </NRadioGroup>
    </NFormItem>

    <template v-if="elegido === 'cloudflare-nombre'">
      <p class="estado" role="status">
        {{ cuenta.conectada ? t.cuentaConectada : t.cuentaSinConectar }}
      </p>
      <div class="fila">
        <NButton
          v-if="!cuenta.conectada"
          type="primary"
          :loading="ocupado('tunel-conectar')"
          @click="conectar"
        >
          {{ t.conectar }}
        </NButton>
        <NButton v-else secondary :loading="ocupado('tunel-desconectar')" @click="desconectar">
          {{ t.desconectar }}
        </NButton>
      </div>
      <p v-if="!cuenta.conectada" class="ayuda">
        {{ ocupado('tunel-conectar') ? t.conectando : t.conectarAyuda }}
      </p>
      <div v-if="ocupado('tunel-conectar')" class="fila" role="group" :aria-label="t.autorizacion">
        <template v-if="urlAutorizacion">
          <NButton size="small" @click="abrirAutorizacion">{{ t.abrirAutorizacion }}</NButton>
          <NButton size="small" secondary @click="copiarAutorizacion">{{
            t.copiarAutorizacion
          }}</NButton>
        </template>
        <NButton size="small" quaternary type="error" @click="cancelarConexion">{{
          t.cancelarConexion
        }}</NButton>
      </div>

      <template v-if="cuenta.conectada">
        <NFormItem
          :label="t.nombreTunel"
          :feedback="t.nombreTunelAyuda"
          :validation-status="nombre && !nombreOk ? 'error' : undefined"
        >
          <NInput v-model:value="nombre" placeholder="wolf-dev" :maxlength="63" />
        </NFormItem>
        <NFormItem
          :label="t.dominioPublico"
          :feedback="t.dominioPublicoAyuda"
          :validation-status="dominio && !dominioOk ? 'error' : undefined"
        >
          <NInput v-model:value="dominio" placeholder="demo.midominio.com" :maxlength="253" />
        </NFormItem>
        <NButton
          type="primary"
          :disabled="!nombreOk || !dominioOk"
          :loading="ocupado('tunel-crear')"
          @click="crear"
        >
          {{ t.crear }}
        </NButton>
      </template>
    </template>

    <template v-else>
      <NButton
        v-if="sitio.tunel?.proveedor === 'cloudflare-nombre'"
        secondary
        :loading="ocupado('tunel-rapido')"
        @click="usarRapido"
      >
        {{ t.usarRapido }}
      </NButton>
    </template>

    <NAlert type="info" :show-icon="false" class="aviso">{{ t.cambiarCierra }}</NAlert>
    <p v-if="aviso" class="estado" role="status">{{ aviso }}</p>

    <template #footer>
      <div class="pie">
        <NButton type="primary" @click="emit('update:show', false)">
          {{ textos.acciones.cerrar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.opciones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ayuda {
  display: block;
  font-size: 12px;
  opacity: 0.65;
}
.estado {
  margin: 8px 0;
  font-size: 13px;
}
.fila {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.aviso {
  margin-top: 14px;
}
.pie {
  display: flex;
  justify-content: flex-end;
}
</style>
