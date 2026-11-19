<script setup lang="ts">
import {
  Copy,
  Globe,
  MailUnread,
  Open,
  Server,
  ShieldCheckmark,
  Sparkles,
  SwapHorizontal,
  Warning,
} from '@vicons/ionicons5';
import { NAlert, NButton, NCard, NIcon, NSpace, NTag } from 'naive-ui';
import { computed, watch, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import AvisoHosts from '../componentes/AvisoHosts.vue';
import EstadoPunto from '../componentes/EstadoPunto.vue';
import PanelRendimiento from '../componentes/PanelRendimiento.vue';
import { useAccion } from '../composables/useAccion';
import { useNoLeidos } from '../composables/useNoLeidos';
import { textos } from '../i18n';
import { useHosts } from '../stores/hosts';
import { useIa } from '../stores/ia';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import { useTuneles } from '../stores/tuneles';

const t = textos.inicio;
const router = useRouter();
const servicios = useServicios();
const sitios = useSitios();
const tuneles = useTuneles();
const hosts = useHosts();
const { ejecutar } = useAccion();
const ia = useIa();
const correo = useNoLeidos();
const ti = textos.inicioExtra;

const mailpit = computed(() => servicios.porId['mailpit']);
const ollama = computed(() => servicios.porId['ollama']);
const ollamaEncendido = computed(() => ollama.value?.estado === 'encendido');
// Los modelos se cuentan cuando Ollama está encendido (al entrar o al terminar de encender).
watch(
  ollamaEncendido,
  (v) => {
    if (v) void ia.cargarModelos();
  },
  { immediate: true },
);

/** Mosaico de correos: número si se pudo leer; si no, por qué no hay número. */
const tileCorreo = computed(() => {
  if (!mailpit.value) return { valor: ti.sinDato, detalle: ti.correoSinInstalar };
  if (!correo.encendido.value) return { valor: ti.sinDato, detalle: ti.correoApagado };
  if (correo.noLeidos.value === null) {
    return { valor: ti.sinDato, detalle: correo.error.value ? ti.sinLeer : '' };
  }
  return { valor: correo.noLeidos.value, detalle: '' };
});
const tileIa = computed(() => {
  if (!ollama.value) return { valor: ti.sinDato, detalle: ti.iaSinInstalar };
  if (!ollamaEncendido.value) return { valor: ti.sinDato, detalle: ti.iaApagada };
  if (!ia.modelos) return { valor: ti.sinDato, detalle: ia.errorModelos ? ti.sinLeer : '' };
  return { valor: ia.modelos.length, detalle: '' };
});

interface Tile {
  clave: string;
  etiqueta: string;
  valor: number | string;
  detalle: string;
  icono: Component;
  tono: 'neutro' | 'ok' | 'aviso';
  destino?: string;
}

const tiles = computed<Tile[]>(() => [
  {
    clave: 'servicios',
    etiqueta: t.tiles.servicios,
    valor: servicios.encendidos,
    detalle: t.tiles.serviciosDe(servicios.lista.length),
    icono: Server,
    tono: servicios.encendidos > 0 ? 'ok' : 'neutro',
    destino: 'servicios',
  },
  {
    clave: 'sitios',
    etiqueta: t.tiles.sitios,
    valor: sitios.lista.length,
    detalle: '',
    icono: Globe,
    tono: 'neutro',
    destino: 'proyectos',
  },
  {
    clave: 'tuneles',
    etiqueta: t.tiles.tuneles,
    valor: tuneles.activos.length,
    detalle: '',
    icono: SwapHorizontal,
    tono: tuneles.activos.length > 0 ? 'ok' : 'neutro',
    destino: 'tuneles',
  },
  {
    clave: 'hosts',
    etiqueta: t.tiles.hosts,
    valor: hosts.pendientes.length,
    detalle: hosts.pendientes.length ? t.tiles.hostsFaltan : t.tiles.hostsOk,
    icono: hosts.pendientes.length ? Warning : ShieldCheckmark,
    tono: hosts.pendientes.length ? 'aviso' : 'ok',
  },
  {
    clave: 'correo',
    etiqueta: ti.correo,
    ...tileCorreo.value,
    icono: MailUnread,
    tono:
      typeof tileCorreo.value.valor === 'number' && tileCorreo.value.valor > 0 ? 'ok' : 'neutro',
    destino: 'correo',
  },
  {
    clave: 'ia',
    etiqueta: ti.modelos,
    ...tileIa.value,
    icono: Sparkles,
    tono: typeof tileIa.value.valor === 'number' && tileIa.value.valor > 0 ? 'ok' : 'neutro',
    destino: 'iaLocal',
  },
]);

const listaTuneles = computed(() =>
  tuneles.activos.map((tun) => {
    const sitio = sitios.porId(tun.sitioId);
    return {
      sitioId: tun.sitioId,
      url: tun.url ?? '',
      nombre: sitio?.nombre || sitio?.dominio || t.tuneles.sitioDesconocido,
      dominio: sitio?.dominio ?? '',
    };
  }),
);

function copiar(texto: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(texto), { exito: textos.acciones.copiado });
}
function abrir(url: string): void {
  void ejecutar(`abrir-${url}`, () => api().sistema.abrirUrl(url));
}
</script>

<template>
  <div class="inicio">
    <p class="bienvenida">{{ t.bienvenida }}</p>

    <section class="tiles">
      <component
        :is="tile.destino ? 'button' : 'div'"
        v-for="tile in tiles"
        :key="tile.clave"
        class="tile"
        :class="[`tono-${tile.tono}`, { clicable: !!tile.destino }]"
        :type="tile.destino ? 'button' : undefined"
        @click="tile.destino && router.push({ name: tile.destino })"
      >
        <span class="tile-icono"
          ><NIcon :size="18"><component :is="tile.icono" /></NIcon
        ></span>
        <span class="tile-valor">
          {{ tile.valor }}
          <small v-if="tile.detalle">{{ tile.detalle }}</small>
        </span>
        <span class="tile-etiqueta">{{ tile.etiqueta }}</span>
      </component>
    </section>

    <AvisoHosts />

    <NAlert v-if="hosts.duplicadosFuera.length" type="info" class="aviso-hosts" :show-icon="true">
      {{ t.hosts.duplicados }}
      <NSpace size="small" class="dominios">
        <NTag v-for="d in hosts.duplicadosFuera" :key="d" size="small" :bordered="false">
          {{ d }}
        </NTag>
      </NSpace>
    </NAlert>

    <PanelRendimiento />

    <div class="columnas">
      <NCard :title="t.servicios.titulo" size="small" class="tarjeta">
        <template #header-extra>
          <NButton text type="primary" @click="router.push({ name: 'servicios' })">
            {{ t.servicios.ver }}
          </NButton>
        </template>
        <ul v-if="servicios.lista.length" class="lista">
          <li v-for="s in servicios.lista" :key="s.id">
            <span class="nombre">{{ s.nombre }}</span>
            <span class="meta">{{ s.puertos.join(' · ') }}</span>
            <EstadoPunto :estado="s.estado" />
          </li>
        </ul>
        <p v-else class="vacio">{{ t.servicios.vacio }}</p>
      </NCard>

      <NCard :title="t.tuneles.titulo" size="small" class="tarjeta">
        <ul v-if="listaTuneles.length" class="lista">
          <li v-for="tun in listaTuneles" :key="tun.sitioId">
            <span class="nombre">
              {{ tun.nombre }}
              <a class="url" href="#" @click.prevent="abrir(tun.url)">{{ tun.url }}</a>
            </span>
            <NSpace size="small" :wrap="false">
              <NButton size="tiny" secondary @click="abrir(tun.url)">
                <template #icon
                  ><NIcon><Open /></NIcon
                ></template>
                {{ textos.acciones.abrir }}
              </NButton>
              <NButton size="tiny" secondary @click="copiar(tun.url)">
                <template #icon
                  ><NIcon><Copy /></NIcon
                ></template>
                {{ textos.acciones.copiar }}
              </NButton>
            </NSpace>
          </li>
        </ul>
        <p v-else class="vacio">{{ t.tuneles.vacio }}</p>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.bienvenida {
  margin: 0 0 18px;
  opacity: 0.65;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.05);
  color: inherit;
  font: inherit;
  text-align: left;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}
.tile.clicable {
  cursor: pointer;
}
.tile.clicable:hover {
  border-color: rgba(79, 91, 213, 0.55);
}
.tile.clicable:focus-visible {
  outline: 2px solid #6470e0;
  outline-offset: 2px;
}
.tile-icono {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
}
.tono-ok .tile-icono {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.12);
}
.tono-aviso .tile-icono {
  color: #d97706;
  background: rgba(217, 119, 6, 0.14);
}
.tono-aviso {
  border-color: rgba(217, 119, 6, 0.45);
}
.tile-valor {
  font-size: 28px;
  font-weight: 650;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.tile-valor small {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.6;
  letter-spacing: 0;
  margin-left: 4px;
}
.tile-etiqueta {
  font-size: 12.5px;
  opacity: 0.7;
}
.aviso-hosts {
  margin-bottom: 18px;
}
.dominios {
  margin: 8px 0 12px;
}
.columnas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.tarjeta {
  border-radius: 12px;
}
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
}
.lista li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  border-top: 1px solid rgba(128, 128, 128, 0.14);
}
.lista li:first-child {
  border-top: 0;
}
.nombre {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-weight: 500;
}
.meta {
  font-family: var(--fuente-mono);
  font-size: 12px;
  opacity: 0.6;
}
.url {
  font-size: 12px;
  font-weight: 400;
  color: inherit;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vacio {
  margin: 6px 0;
  opacity: 0.6;
}
@media (max-width: 1080px) {
  .tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .columnas {
    grid-template-columns: 1fr;
  }
}
</style>
