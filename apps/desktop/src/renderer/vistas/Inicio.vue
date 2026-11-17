<script setup lang="ts">
import {
  Copy,
  Globe,
  Open,
  Server,
  ShieldCheckmark,
  SwapHorizontal,
  Warning,
} from '@vicons/ionicons5';
import { NAlert, NButton, NCard, NIcon, NModal, NSpace, NTag, useMessage } from 'naive-ui';
import { computed, ref, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import EstadoPunto from '../componentes/EstadoPunto.vue';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { useHosts } from '../stores/hosts';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import { useTuneles } from '../stores/tuneles';

const t = es.inicio;
const router = useRouter();
const servicios = useServicios();
const sitios = useSitios();
const tuneles = useTuneles();
const hosts = useHosts();
const { ejecutar, ocupado } = useAccion();
const message = useMessage();

interface Tile {
  clave: string;
  etiqueta: string;
  valor: number;
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
    destino: 'sitios',
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

/* Corregir hosts */
const fallo = ref<{ motivo: string; comandoManual: string } | null>(null);
const verInstrucciones = ref(false);
const textoMotivo = computed(() =>
  fallo.value ? (t.hosts.motivos[fallo.value.motivo] ?? fallo.value.motivo) : '',
);

async function corregirHosts(): Promise<void> {
  const r = await ejecutar('hosts', () => hosts.sincronizar(), { tituloError: t.hosts.fallo });
  if (!r) return;
  if (r.ok) {
    fallo.value = null;
    message.success(t.hosts.corregido);
  } else {
    fallo.value = { motivo: r.motivo, comandoManual: r.comandoManual };
  }
}

function copiar(texto: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(texto), { exito: es.acciones.copiado });
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

    <NAlert
      v-if="hosts.pendientes.length"
      type="warning"
      :title="t.hosts.titulo"
      class="aviso-hosts"
    >
      <p class="aviso-texto">{{ t.hosts.texto }}</p>
      <NSpace size="small" class="dominios">
        <NTag v-for="d in hosts.pendientes" :key="d" size="small" :bordered="false">{{ d }}</NTag>
      </NSpace>
      <NAlert v-if="fallo" type="error" :show-icon="false" class="fallo">
        {{ textoMotivo }}
      </NAlert>
      <NSpace size="small">
        <NButton type="warning" :loading="ocupado('hosts')" @click="corregirHosts">
          {{ t.hosts.corregir }}
        </NButton>
        <NButton v-if="fallo" secondary @click="verInstrucciones = true">
          {{ t.hosts.verInstrucciones }}
        </NButton>
      </NSpace>
    </NAlert>

    <NAlert v-if="hosts.duplicadosFuera.length" type="info" class="aviso-hosts" :show-icon="true">
      {{ t.hosts.duplicados }}
      <NSpace size="small" class="dominios">
        <NTag v-for="d in hosts.duplicadosFuera" :key="d" size="small" :bordered="false">
          {{ d }}
        </NTag>
      </NSpace>
    </NAlert>

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
                {{ es.acciones.abrir }}
              </NButton>
              <NButton size="tiny" secondary @click="copiar(tun.url)">
                <template #icon
                  ><NIcon><Copy /></NIcon
                ></template>
                {{ es.acciones.copiar }}
              </NButton>
            </NSpace>
          </li>
        </ul>
        <p v-else class="vacio">{{ t.tuneles.vacio }}</p>
      </NCard>
    </div>

    <NModal
      v-model:show="verInstrucciones"
      preset="card"
      :title="t.hosts.modalTitulo"
      class="modal-hosts"
      :style="{ width: '640px', maxWidth: '92vw' }"
    >
      <p class="aviso-texto">{{ t.hosts.modalTexto }}</p>
      <pre class="comando">{{ fallo?.comandoManual }}</pre>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="verInstrucciones = false">{{ es.acciones.cerrar }}</NButton>
          <NButton type="primary" @click="fallo && copiar(fallo.comandoManual)">
            <template #icon
              ><NIcon><Copy /></NIcon
            ></template>
            {{ es.acciones.copiar }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.bienvenida {
  margin: 0 0 18px;
  opacity: 0.65;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
.aviso-texto {
  margin: 0 0 10px;
}
.dominios {
  margin: 8px 0 12px;
}
.fallo {
  margin-bottom: 12px;
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
.comando {
  margin: 0;
  padding: 12px 14px;
  max-height: 220px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: all;
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
