<script setup lang="ts">
import { Copy, ExtensionPuzzle, Key } from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NSkeleton,
  NSwitch,
  useDialog,
  useMessage,
} from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { EstadoMcp } from '../../shared/api';
import { api } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import EstadoPunto from './EstadoPunto.vue';

/** Ajustes del servidor MCP. El token nunca llega a la interfaz: solo se copia o se regenera. */
const t = textos.mcp;
const { ejecutar, ocupado } = useAccion();
const dialog = useDialog();
const message = useMessage();

const estado = ref<EstadoMcp | null>(null);
/** Puerto guardado en la configuración (el estado solo lo trae con el servidor activo). */
const puertoGuardado = ref<number | null>(null);
const puerto = ref<number | null>(null);

const puertoValido = computed(
  () =>
    puerto.value !== null &&
    Number.isInteger(puerto.value) &&
    puerto.value >= 1024 &&
    puerto.value <= 65535,
);
const puertoCambiado = computed(() => puerto.value !== puertoGuardado.value);
const direccion = computed(
  () => estado.value?.url ?? `http://127.0.0.1:${puertoGuardado.value ?? '—'}`,
);

/** Error al leer el estado: se muestra en la tarjeta con "Reintentar" (no solo en un aviso). */
const errorCarga = ref<string | null>(null);
const cargando = ref(false);

async function cargar(): Promise<void> {
  cargando.value = true;
  try {
    const [e, c] = await Promise.all([api().mcp.estado(), api().config.leer()]);
    errorCarga.value = null;
    aplicar(e, c.mcp.puerto);
  } catch (e) {
    errorCarga.value = t.errorCargar(mensajeDeError(e));
  } finally {
    cargando.value = false;
  }
}

onMounted(() => void cargar());

function aplicar(e: EstadoMcp, puertoConfig?: number): void {
  estado.value = e;
  const p = e.puerto ?? puertoConfig ?? puertoGuardado.value;
  puertoGuardado.value = p;
  puerto.value = p;
}

async function cambiarActivo(valor: boolean): Promise<void> {
  await ejecutar(
    'mcp-activo',
    async () => {
      if (valor) aplicar(await api().mcp.iniciar());
      else {
        await api().mcp.detener();
        aplicar(await api().mcp.estado());
      }
    },
    { exito: valor ? t.activado : t.detenido },
  );
}

async function guardarPuerto(): Promise<void> {
  const p = puerto.value;
  if (p === null || !puertoValido.value) return;
  const r = await ejecutar('mcp-puerto', () => api().mcp.cambiarPuerto(p), {
    exito: t.puertoGuardado(p),
  });
  if (r) {
    puertoGuardado.value = p;
    aplicar(r, p);
  }
}

function copiarConfiguracion(): void {
  void ejecutar('mcp-copiar', () => api().mcp.configuracion(), { exito: t.configCopiada });
}

function regenerar(): void {
  dialog.warning({
    title: t.regenerarTitulo,
    content: t.regenerarTexto,
    positiveText: t.regenerar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: async () => {
      const ok = await ejecutar('mcp-token', async () => {
        await api().mcp.regenerarToken();
        return true;
      });
      if (ok) message.success(t.regenerado);
    },
  });
}
</script>

<template>
  <NCard size="small" class="tarjeta">
    <template #header>
      <span class="titulo-tarjeta">
        <NIcon :size="16"><ExtensionPuzzle /></NIcon>
        {{ t.titulo }}
      </span>
    </template>
    <p class="ayuda texto">{{ t.descripcion }}</p>
    <NForm label-placement="top" :show-feedback="false">
      <NFormItem :label="t.estado">
        <div class="fila">
          <span v-if="errorCarga && !estado" class="ayuda error con-boton">
            {{ errorCarga }}
            <NButton size="tiny" secondary :loading="cargando" @click="cargar">
              {{ textos.acciones.reintentar }}
            </NButton>
          </span>
          <NSkeleton v-else-if="!estado" text :width="140" />
          <EstadoPunto
            v-else
            :estado="estado.activo ? 'encendido' : 'apagado'"
            :etiqueta="estado.activo ? t.activo : t.inactivo"
          />
          <NSwitch
            :value="estado?.activo ?? false"
            :disabled="!estado"
            :loading="ocupado('mcp-activo')"
            :aria-label="estado?.activo ? t.detener : t.activar"
            @update:value="cambiarActivo"
          />
        </div>
      </NFormItem>
      <div class="dos">
        <NFormItem :label="t.puerto">
          <div class="campo">
            <div class="fila">
              <NInputNumber
                v-model:value="puerto"
                :min="1024"
                :max="65535"
                :disabled="!estado"
                :status="puertoValido ? undefined : 'error'"
                class="numero"
              />
              <NButton
                size="small"
                type="primary"
                :disabled="!puertoCambiado || !puertoValido"
                :loading="ocupado('mcp-puerto')"
                @click="guardarPuerto"
              >
                {{ textos.acciones.guardar }}
              </NButton>
            </div>
            <small class="ayuda" :class="{ error: !puertoValido }">
              {{ puertoValido ? t.puertoAyuda : t.puertoRango }}
            </small>
          </div>
        </NFormItem>
        <NFormItem :label="t.direccion">
          <NInput :value="direccion" readonly class="ruta" />
        </NFormItem>
      </div>
      <NFormItem class="separado" :show-label="false">
        <div class="campo">
          <div class="botones">
            <NButton
              size="small"
              type="primary"
              secondary
              :loading="ocupado('mcp-copiar')"
              @click="copiarConfiguracion"
            >
              <template #icon
                ><NIcon><Copy /></NIcon
              ></template>
              {{ t.copiarConfig }}
            </NButton>
            <NButton size="small" secondary :loading="ocupado('mcp-token')" @click="regenerar">
              <template #icon
                ><NIcon><Key /></NIcon
              ></template>
              {{ t.regenerar }}
            </NButton>
          </div>
          <small class="ayuda">{{ t.copiarConfigAyuda }}</small>
        </div>
      </NFormItem>
    </NForm>
  </NCard>
</template>

<style scoped>
.tarjeta {
  border-radius: 12px;
  margin-bottom: 14px;
  max-width: 760px;
}
.titulo-tarjeta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.texto {
  display: block;
  margin: 0 0 12px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  width: 100%;
}
.numero {
  width: 160px;
  margin-right: auto;
}
.dos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.ruta :deep(input) {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.ayuda {
  font-size: 12px;
  opacity: 0.72;
}
.ayuda.error {
  color: var(--texto-error);
  opacity: 1;
}
.con-boton {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.botones {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.separado {
  margin-top: 16px;
}
</style>
