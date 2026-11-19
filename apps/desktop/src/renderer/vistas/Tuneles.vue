<script setup lang="ts">
import { Close, Copy, InformationCircle, Open, Refresh, SwapHorizontal } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NDataTable,
  NEmpty,
  NIcon,
  NTooltip,
  type DataTableColumns,
} from 'naive-ui';
import { computed, h, onMounted, type Component } from 'vue';
import { useRouter } from 'vue-router';
import type { EstadoTunel } from '../../shared/api';
import EstadoPunto from '../componentes/EstadoPunto.vue';
import { useTunel } from '../composables/useTunel';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import { useTuneles } from '../stores/tuneles';
import { motivoTunelBloqueado } from '../utilidades/sitios';

const t = textos.tuneles;
const tt = textos.tunel;
const router = useRouter();
const sitios = useSitios();
const tuneles = useTuneles();
const servicios = useServicios();
const { cerrar, renovar, abrirUrl, copiar, ocupado, trabajando } = useTunel();

interface Fila extends EstadoTunel {
  nombre: string;
  dominio: string;
  datosReales: boolean;
}

const filas = computed<Fila[]>(() =>
  Object.values(tuneles.porSitio)
    .filter((tun) => tun.estado !== 'apagado')
    .map((tun) => {
      const sitio = sitios.porId(tun.sitioId);
      return {
        ...tun,
        nombre: sitio?.nombre || sitio?.dominio || t.sinNombre,
        dominio: sitio?.dominio ?? tun.sitioId,
        datosReales: sitio?.datosReales ?? false,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
);

/** Reintentar un túnel con error necesita Nginx encendido y cloudflared instalado. */
const bloqueo = (f: Fila): string | null => {
  const v = servicios.instalados['cloudflared'];
  return motivoTunelBloqueado({
    nginx: servicios.porId['nginx']?.estado,
    cloudflaredInstalado: v === undefined ? undefined : v.length > 0,
    tunel: f.estado,
  });
};

onMounted(() => {
  // Para saber si un túnel con error se puede reintentar.
  void servicios.cargarInstalados('cloudflared').catch(() => undefined);
});

const claveFila = (f: Fila): string => f.sitioId;

/** Botón de solo icono, con tooltip y nombre accesible. */
function botonIcono(o: {
  etiqueta: string;
  icono: Component;
  alPulsar: () => void;
  cargando?: boolean;
  deshabilitado?: boolean;
  tipo?: 'error';
}) {
  return h(NTooltip, null, {
    trigger: () =>
      h(
        NButton,
        {
          quaternary: true,
          circle: true,
          size: 'small',
          type: o.tipo,
          loading: o.cargando,
          disabled: o.deshabilitado,
          'aria-label': o.etiqueta,
          onClick: o.alPulsar,
        },
        { icon: () => h(NIcon, null, { default: () => h(o.icono) }) },
      ),
    default: () => o.etiqueta,
  });
}

const columnas: DataTableColumns<Fila> = [
  {
    key: 'sitio',
    title: t.columnas.sitio,
    minWidth: 180,
    render: (f) =>
      h('div', { class: 'celda-sitio' }, [
        h('strong', null, f.nombre),
        h('span', { class: 'dominio' }, f.dominio),
      ]),
  },
  {
    key: 'estado',
    title: t.columnas.estado,
    width: 130,
    render: (f) => h(EstadoPunto, { estado: f.estado }),
  },
  {
    key: 'url',
    title: t.columnas.url,
    minWidth: 260,
    ellipsis: { tooltip: true },
    render: (f) => {
      if (f.estado === 'activo' && f.url) {
        const url = f.url;
        return h(
          'a',
          {
            class: 'url',
            href: url,
            onClick: (e: MouseEvent) => {
              e.preventDefault();
              abrirUrl(url);
            },
          },
          url,
        );
      }
      if (f.estado === 'error') return h('span', { class: 'error' }, f.mensaje || tt.error);
      return h('span', { class: 'tenue' }, tt.abriendo);
    },
  },
  {
    key: 'acciones',
    title: t.columnas.acciones,
    width: 168,
    align: 'right',
    render: (f) => {
      const url = f.url;
      const ocupadoFila = trabajando(f.sitioId);
      return h('div', { class: 'celda-acciones' }, [
        botonIcono({
          etiqueta: tt.abrirUrl,
          icono: Open,
          deshabilitado: !url || f.estado !== 'activo',
          alPulsar: () => url && abrirUrl(url),
        }),
        botonIcono({
          etiqueta: tt.copiarUrl,
          icono: Copy,
          deshabilitado: !url || f.estado !== 'activo',
          alPulsar: () => url && copiar(url),
        }),
        botonIcono({
          etiqueta: bloqueo(f) ?? tt.renovar,
          icono: Refresh,
          cargando: ocupado(`renovar-${f.sitioId}`),
          deshabilitado: ocupadoFila || f.estado === 'iniciando' || !!bloqueo(f),
          alPulsar: () => void renovar({ id: f.sitioId, datosReales: f.datosReales }),
        }),
        botonIcono({
          etiqueta: tt.cerrar,
          icono: Close,
          tipo: 'error',
          cargando: ocupado(`cerrar-${f.sitioId}`),
          deshabilitado: ocupadoFila,
          alPulsar: () => void cerrar(f.sitioId),
        }),
      ]);
    },
  },
];
</script>

<template>
  <div class="tuneles">
    <p class="descripcion">{{ t.descripcion }}</p>

    <NAlert type="info" :show-icon="true" class="explicacion">
      <template #icon
        ><NIcon><InformationCircle /></NIcon
      ></template>
      {{ t.explicacion }}
    </NAlert>

    <div v-if="!filas.length" class="vacio">
      <NEmpty size="large">
        <template #icon>
          <NIcon><SwapHorizontal /></NIcon>
        </template>
        <template #default>
          <strong class="vacio-titulo">{{ t.vacioTitulo }}</strong>
          <span class="vacio-texto">{{ t.vacio }}</span>
        </template>
        <template #extra>
          <NButton type="primary" @click="router.push({ name: 'proyectos' })">{{
            t.irASitios
          }}</NButton>
        </template>
      </NEmpty>
    </div>

    <NDataTable
      v-else
      :columns="columnas"
      :data="filas"
      :row-key="claveFila"
      :bordered="false"
      size="small"
      class="tabla"
    />
  </div>
</template>

<style scoped>
.descripcion {
  margin: 0 0 14px;
  opacity: 0.65;
}
.explicacion {
  margin-bottom: 18px;
}
.vacio {
  padding: 48px 0 40px;
  border: 1px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
}
.vacio-titulo {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.9;
}
.vacio-titulo,
.vacio-texto {
  text-align: center;
}
.vacio-texto {
  display: block;
  max-width: 380px;
  margin: 0 auto;
}
.tabla {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(128, 128, 128, 0.2);
}
.tabla :deep(.celda-sitio) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tabla :deep(.dominio) {
  font-family: var(--fuente-mono);
  font-size: 12px;
  opacity: 0.6;
}
.tabla :deep(.url) {
  font-family: var(--fuente-mono);
  font-size: 12px;
  color: #16a34a;
  text-decoration: none;
}
.tabla :deep(.url:hover) {
  text-decoration: underline;
}
.tabla :deep(.error) {
  color: #dc2626;
  font-size: 12.5px;
}
.tabla :deep(.tenue) {
  opacity: 0.6;
  font-size: 12.5px;
}
.tabla :deep(.celda-acciones) {
  display: inline-flex;
  gap: 2px;
}
</style>
