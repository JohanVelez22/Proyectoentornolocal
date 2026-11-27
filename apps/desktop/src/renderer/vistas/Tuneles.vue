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
import { computed, h, onMounted, type Component, type HTMLAttributes } from 'vue';
import { useRouter } from 'vue-router';
import { solicitudes } from '../composables/solicitudes';
import type { EstadoTunel, Sitio } from '../../shared/api';
import EstadoPunto from '../componentes/EstadoPunto.vue';
import { useFoco } from '../composables/useFoco';
import { useTunel } from '../composables/useTunel';
import IlustracionVacia from '../componentes/IlustracionVacia.vue';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import { useTuneles } from '../stores/tuneles';
import { motivoTunelBloqueado, usaCloudflared } from '../utilidades/sitios';

const t = textos.tuneles;
const tt = textos.tunel;
const router = useRouter();
const sitios = useSitios();
const tuneles = useTuneles();
const servicios = useServicios();
const { cerrar, renovar, abrirUrl, copiar, ocupado, trabajando } = useTunel();
useFoco();

interface Fila extends EstadoTunel {
  nombre: string;
  dominio: string;
  datosReales: boolean;
  tunel: Sitio['tunel'];
}

/** «Compartir carpeta o archivo» vive en Herramientas › Red. */
function irACompartir(): void {
  solicitudes.herramienta = 'compartir';
  void router.push({ name: 'herramientas' });
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
        tunel: sitio?.tunel,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
);

/** Reintentar un túnel con error necesita Nginx encendido y cloudflared instalado. */
const bloqueo = (f: Fila): string | null => {
  const v = servicios.instalados['cloudflared'];
  return motivoTunelBloqueado({
    nginx: servicios.porId['nginx']?.estado,
    cloudflaredInstalado: v === undefined || !usaCloudflared(f.tunel) ? undefined : v.length > 0,
    tunel: f.estado,
  });
};

onMounted(() => {
  // Para saber si un túnel con error se puede reintentar.
  void servicios.cargarInstalados('cloudflared').catch(() => undefined);
});

const claveFila = (f: Fila): string => f.sitioId;

/** El aviso de un túnel (`sitio:<id>`) resalta su fila. */
const propsFila = (f: Fila): HTMLAttributes =>
  ({ 'data-foco': `sitio:${f.sitioId}` }) as HTMLAttributes;

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
          alPulsar: () =>
            void renovar({
              id: f.sitioId,
              datosReales: f.datosReales,
              dominio: f.dominio,
              tunel: f.tunel,
            }),
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

    <p class="compartir-enlace">
      <NButton text type="primary" data-testid="tuneles-compartir" @click="irACompartir">{{
        t.compartir.enlace
      }}</NButton>
      <span class="compartir-ayuda">{{ t.compartir.ayuda }}</span>
    </p>

    <NAlert type="info" :show-icon="true" class="explicacion">
      <template #icon
        ><NIcon><InformationCircle /></NIcon
      ></template>
      {{ t.explicacion }}
    </NAlert>

    <div v-if="!filas.length" class="vacio">
      <NEmpty size="large">
        <template #icon><IlustracionVacia :icono="SwapHorizontal" /></template>
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
      :row-props="propsFila"
      :bordered="false"
      size="small"
      class="tabla"
    />
  </div>
</template>

<style scoped>
.compartir-enlace {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin: 0 0 12px;
}
.compartir-ayuda {
  font-size: 12px;
  opacity: 0.72;
}
.descripcion {
  margin: 0 0 16px;
  opacity: 0.75;
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
  opacity: 0.72;
}
.tabla :deep(.url) {
  font-family: var(--fuente-mono);
  font-size: 12px;
  color: var(--texto-ok);
  text-decoration: none;
}
.tabla :deep(.url:hover) {
  text-decoration: underline;
}
.tabla :deep(.error) {
  color: var(--texto-error);
  font-size: 12.5px;
}
.tabla :deep(.tenue) {
  opacity: 0.72;
  font-size: 12.5px;
}
.tabla :deep(.celda-acciones) {
  display: inline-flex;
  gap: 2px;
}
</style>
