<script setup lang="ts">
import {
  CopyOutline,
  CreateOutline,
  EllipsisHorizontal,
  FolderOpen,
  Open,
  TrashOutline,
  Warning,
} from '@vicons/ionicons5';
import {
  NButton,
  NDropdown,
  NIcon,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
  useNotification,
  type DropdownOption,
} from 'naive-ui';
import { computed, h, type Component } from 'vue';
import type { ResultadoAplicar, Sitio } from '../../shared/api';
import { api } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { useHosts } from '../stores/hosts';
import { useServicios } from '../stores/servicios';
import { derivarEstadoSitio, urlLocal, usaPhp } from '../utilidades/sitios';
import EstadoPunto from './EstadoPunto.vue';
import InterruptorTunel from './InterruptorTunel.vue';

const props = defineProps<{ sitio: Sitio }>();
const emit = defineEmits<{
  editar: [sitio: Sitio];
  duplicar: [sitio: Sitio];
  /** Resultado de aplicar tras borrar, para que la vista muestre el aviso de hosts. */
  aplicado: [resultado: ResultadoAplicar];
}>();

const t = es.sitios;
const servicios = useServicios();
const hosts = useHosts();
const dialog = useDialog();
const message = useMessage();
const notification = useNotification();
const { ejecutar, ocupado } = useAccion();

const nginx = computed(() => servicios.porId['nginx']);
const estado = computed(() =>
  derivarEstadoSitio(props.sitio, nginx.value?.estado, hosts.pendientes),
);
const nombre = computed(() => props.sitio.nombre || props.sitio.dominio);
const url = computed(() => urlLocal(props.sitio.dominio, nginx.value?.puertos[0]));

const icono = (c: Component) => () => h(NIcon, null, { default: () => h(c) });
const opciones: DropdownOption[] = [
  { key: 'editar', label: es.acciones.editar, icon: icono(CreateOutline) },
  { key: 'duplicar', label: es.acciones.duplicar, icon: icono(CopyOutline) },
  { type: 'divider', key: 'd1' },
  {
    key: 'borrar',
    label: es.acciones.borrar,
    icon: icono(TrashOutline),
    props: { style: { color: '#dc2626' } },
  },
];

function elegir(clave: string | number): void {
  if (clave === 'editar') emit('editar', props.sitio);
  else if (clave === 'duplicar') emit('duplicar', props.sitio);
  else if (clave === 'borrar') confirmarBorrar();
}

function confirmarBorrar(): void {
  const d = dialog.warning({
    title: t.borrar.titulo(nombre.value),
    content: t.borrar.texto,
    positiveText: es.acciones.borrar,
    negativeText: es.acciones.cancelar,
    autoFocus: false,
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      d.loading = true;
      try {
        const r = await api().sitios.borrar(props.sitio.id);
        message.success(t.borrar.hecho(nombre.value));
        if (!r.nginx.ok) {
          notification.error({
            title: t.borrar.nginxFallo,
            content: r.nginx.salida,
            duration: 15000,
            keepAliveOnHover: true,
          });
        }
        emit('aplicado', r);
        return true;
      } catch (e) {
        notification.error({
          title: es.errores.titulo,
          content: mensajeDeError(e),
          duration: 10000,
          keepAliveOnHover: true,
        });
        return true;
      }
    },
  });
}

function abrirSitio(): void {
  void ejecutar('abrir', () => api().sistema.abrirUrl(url.value));
}
function abrirCarpeta(): void {
  void ejecutar('carpeta', () => api().sistema.abrirCarpeta(props.sitio.carpeta));
}
</script>

<template>
  <article class="fila" :class="{ reales: sitio.datosReales }">
    <div class="principal">
      <EstadoPunto :estado="estado.punto" :etiqueta="estado.etiqueta" solo-punto class="punto" />
      <div class="cuerpo">
        <div class="linea">
          <h3 class="nombre">{{ nombre }}</h3>
          <NTag size="small" :bordered="false" class="etiqueta">{{
            t.tiposCortos[sitio.tipo]
          }}</NTag>
          <NTag
            v-if="usaPhp(sitio.tipo) && sitio.php"
            size="small"
            :bordered="false"
            class="etiqueta mono"
          >
            {{ t.php(sitio.php) }}
          </NTag>
          <NTag
            v-if="sitio.tipo === 'proxy' && sitio.puertoProxy"
            size="small"
            :bordered="false"
            class="etiqueta mono"
          >
            {{ t.puerto(sitio.puertoProxy) }}
          </NTag>
          <NTooltip v-if="sitio.datosReales">
            <template #trigger>
              <NTag size="small" type="error" :bordered="false" class="etiqueta">
                <template #icon
                  ><NIcon><Warning /></NIcon
                ></template>
                {{ t.datosReales }}
              </NTag>
            </template>
            {{ t.datosRealesAyuda }}
          </NTooltip>
          <NTooltip v-if="estado.faltanEnHosts.length">
            <template #trigger>
              <NTag size="small" type="warning" :bordered="false" class="etiqueta">
                <template #icon
                  ><NIcon><Warning /></NIcon
                ></template>
                {{ t.faltaHosts }}
              </NTag>
            </template>
            {{ t.faltaHostsAyuda(estado.faltanEnHosts.join(', ')) }}
          </NTooltip>
        </div>
        <div class="linea secundaria">
          <a
            class="dominio"
            :href="url"
            :title="t.abrirSitio(sitio.dominio)"
            @click.prevent="abrirSitio"
          >
            {{ sitio.dominio }}
          </a>
          <NTooltip v-if="sitio.alias.length">
            <template #trigger>
              <span class="alias" tabindex="0">{{ t.alias(sitio.alias.length) }}</span>
            </template>
            {{ sitio.alias.join(', ') }}
          </NTooltip>
          <span v-if="estado.punto !== 'aviso'" class="estado-texto">· {{ estado.etiqueta }}</span>
        </div>
        <p v-if="sitio.nota" class="nota">{{ sitio.nota }}</p>
      </div>

      <div class="acciones">
        <NButton size="small" secondary :loading="ocupado('abrir')" @click="abrirSitio">
          <template #icon
            ><NIcon><Open /></NIcon
          ></template>
          {{ es.acciones.abrir }}
        </NButton>
        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              secondary
              :loading="ocupado('carpeta')"
              :aria-label="t.abrirCarpeta"
              @click="abrirCarpeta"
            >
              <template #icon
                ><NIcon><FolderOpen /></NIcon
              ></template>
              {{ t.carpeta }}
            </NButton>
          </template>
          <span class="ruta">{{ sitio.carpeta }}</span>
        </NTooltip>
        <NDropdown trigger="click" :options="opciones" placement="bottom-end" @select="elegir">
          <NButton
            size="small"
            quaternary
            :aria-label="es.acciones.masAcciones"
            :title="es.acciones.masAcciones"
          >
            <template #icon
              ><NIcon><EllipsisHorizontal /></NIcon
            ></template>
          </NButton>
        </NDropdown>
      </div>
    </div>

    <div class="pie">
      <InterruptorTunel :sitio="sitio" />
    </div>
  </article>
</template>

<style scoped>
.fila {
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.045);
  transition: border-color 0.15s ease;
}
.fila.reales {
  box-shadow: inset 3px 0 0 rgba(220, 38, 38, 0.55);
}
.fila:hover {
  border-color: rgba(128, 128, 128, 0.34);
}
.principal {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px 12px;
}
.punto {
  margin-top: 7px;
}
.cuerpo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.linea {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  min-width: 0;
}
.nombre {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.mono {
  font-family: var(--fuente-mono);
}
.secundaria {
  font-size: 12.5px;
}
.dominio {
  font-family: var(--fuente-mono);
  color: #6470e0;
  text-decoration: none;
}
.dominio:hover {
  text-decoration: underline;
}
.dominio:focus-visible,
.alias:focus-visible {
  outline: 2px solid #6470e0;
  outline-offset: 2px;
  border-radius: 4px;
}
.alias {
  font-size: 12px;
  opacity: 0.65;
  cursor: default;
}
.estado-texto {
  opacity: 0.6;
}
.nota {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.65;
}
.acciones {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}
.ruta {
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.pie {
  padding: 8px 16px 10px 38px;
  border-top: 1px solid rgba(128, 128, 128, 0.14);
}
</style>
