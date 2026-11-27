<script setup lang="ts">
import { Terminal } from '@vicons/ionicons5';
import { NButton, NCard, NIcon, NSkeleton, useDialog, useNotification } from 'naive-ui';
import { onMounted, ref } from 'vue';
import type { EstadoCliPath } from '../../shared/api';
import { api } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import EstadoPunto from './EstadoPunto.vue';

/**
 * El cliente `wolf` de la terminal (D32). Agregarlo al PATH copia el cliente a la carpeta de datos,
 * agrega esa carpeta al PATH del usuario (con copia del original) y enciende el servidor de órdenes
 * (127.0.0.1 con token). Quitarlo lo deshace todo. El token nunca llega a la interfaz.
 */
const t = textos.cli;
const { ejecutar, ocupado } = useAccion();
const dialog = useDialog();
const notification = useNotification();

const estado = ref<EstadoCliPath | null>(null);
const errorCarga = ref<string | null>(null);

async function cargar(): Promise<void> {
  try {
    estado.value = await api().cli.estado();
    errorCarga.value = null;
  } catch (e) {
    errorCarga.value = t.errorCargar(mensajeDeError(e));
  }
}

onMounted(() => void cargar());

function cambiar(): void {
  const e = estado.value;
  if (!e || e.aislado) return;
  const incompleta = e.enPath && !e.instalado;
  if (e.enPath && !incompleta) {
    dialog.warning({
      title: t.quitarTitulo,
      content: t.quitarTexto,
      positiveText: t.quitar,
      negativeText: textos.acciones.cancelar,
      onPositiveClick: () => void aplicar(false),
    });
    return;
  }
  // Agregar cambia el PATH del usuario y abre un servidor local: siempre se confirma.
  dialog.warning({
    title: incompleta ? t.repararTitulo : t.agregarTitulo,
    content: incompleta ? t.repararTexto : t.agregarTexto,
    positiveText: incompleta ? t.reparar : t.agregar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: () => void aplicar(true),
  });
}

async function aplicar(agregar: boolean): Promise<void> {
  const r = await ejecutar('cli-path', async () => {
    const res = await api().cli.cambiarPath(agregar);
    estado.value = await api().cli.estado();
    return res;
  });
  if (r) {
    notification.success({
      title: t.listoTitulo,
      content: t.avisoTerminalNueva,
      duration: 12000,
      keepAliveOnHover: true,
    });
  }
}
</script>

<template>
  <NCard size="small" class="tarjeta">
    <template #header>
      <span class="titulo-tarjeta">
        <NIcon :size="16"><Terminal /></NIcon>
        {{ t.titulo }}
      </span>
    </template>
    <p class="ayuda texto">{{ t.descripcion }}</p>
    <div class="fila">
      <span v-if="errorCarga && !estado" class="ayuda error con-boton">
        {{ errorCarga }}
        <NButton size="tiny" secondary @click="cargar">{{ textos.acciones.reintentar }}</NButton>
      </span>
      <NSkeleton v-else-if="!estado" text :width="140" />
      <EstadoPunto
        v-else
        :estado="estado.enPath && estado.activo ? 'encendido' : 'apagado'"
        :etiqueta="
          estado.enPath
            ? !estado.instalado
              ? t.enPathSinCliente
              : estado.activo
                ? t.activo
                : t.enPathSinServidor
            : t.inactivo
        "
      />
      <NButton
        size="small"
        :type="estado?.enPath && estado.instalado ? 'default' : 'primary'"
        :secondary="!!estado?.enPath && estado.instalado"
        :disabled="!estado || estado.aislado"
        :loading="ocupado('cli-path')"
        @click="cambiar"
      >
        {{ estado?.enPath ? (estado.instalado ? t.quitarBoton : t.reparar) : t.agregarBoton }}
      </NButton>
    </div>
    <small v-if="estado?.aislado" class="ayuda">{{ t.aislado }}</small>
    <small v-else class="ayuda">{{ t.ayuda }}</small>
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
.fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  width: 100%;
  margin-bottom: 6px;
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
</style>
