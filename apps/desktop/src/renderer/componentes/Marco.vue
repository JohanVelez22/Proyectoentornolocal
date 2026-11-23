<script setup lang="ts">
import logo from '../assets/logo.png';
import {
  Albums as IconoProyectos,
  Chatbubbles as IconoAgentes,
  CodeSlash as IconoPhp,
  Construct as IconoHerramientas,
  DocumentText as IconoRegistros,
  Home as IconoInicio,
  Layers as IconoBases,
  Mail as IconoCorreo,
  Medkit as IconoDoctor,
  Server as IconoServicios,
  Settings as IconoAjustes,
  Sparkles as IconoIa,
  Search as IconoBuscar,
  SwapHorizontal as IconoTuneles,
} from '@vicons/ionicons5';
import {
  NButton,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  useNotification,
  type MenuOption,
} from 'naive-ui';
import type { Aviso } from '../../shared/api';
import { computed, h, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { solicitudes } from '../composables/solicitudes';
import AsistenteInicio from './AsistenteInicio.vue';
import CampanaAvisos from './CampanaAvisos.vue';
import ConfirmacionMcp from './ConfirmacionMcp.vue';
import PanelAvisos from './PanelAvisos.vue';
import PaletaComandos from './PaletaComandos.vue';
import SelectorIdioma from './SelectorIdioma.vue';
import SelectorTema from './SelectorTema.vue';
import { idioma, textos } from '../i18n';
import { GRUPOS_NAV } from '../navegacion';
import { usePreferencias } from '../stores/preferencias';
import { useSitios } from '../stores/sitios';
import type { SeccionNav } from '../router';
import { detenerEntorno, iniciarEntorno } from '../stores/entorno';
import { resumenPastilla } from '../utilidades/pastilla';
import { useAvisos } from '../stores/avisos';
import { useServicios } from '../stores/servicios';
import { useTuneles } from '../stores/tuneles';

const route = useRoute();
const router = useRouter();
const servicios = useServicios();
const tuneles = useTuneles();
const { ejecutar } = useAccion();
const notification = useNotification();

const avisos = useAvisos();
const panelAvisos = ref(false);
const contraido = ref(false);
const falloArranque = ref(false);

const preferencias = usePreferencias();
const sitios = useSitios();

const icono = (c: Component) => () => h(NIcon, null, { default: () => h(c) });
const ICONOS: Record<SeccionNav, Component> = {
  inicio: IconoInicio,
  proyectos: IconoProyectos,
  agentes: IconoAgentes,
  servicios: IconoServicios,
  php: IconoPhp,
  basesDeDatos: IconoBases,
  correo: IconoCorreo,
  ia: IconoIa,
  tuneles: IconoTuneles,
  herramientas: IconoHerramientas,
  doctor: IconoDoctor,
  registros: IconoRegistros,
  ajustes: IconoAjustes,
};
const item = (k: SeccionNav): MenuOption => ({
  key: k,
  label: textos.nav[k],
  icon: icono(ICONOS[k]),
});
/** Barra lateral agrupada (se rearma al cambiar de idioma). */
const opciones = computed<MenuOption[]>(() => [
  ...GRUPOS_NAV.map((g) => ({
    type: 'group' as const,
    key: `grupo-${g.grupo}`,
    label: textos.navGrupos[g.grupo],
    children: g.secciones.map(item),
  })),
  { type: 'divider' as const, key: 'division' },
  item('ajustes'),
]);

const seccion = computed<SeccionNav>(() => route.meta.seccion ?? 'inicio');
const titulo = computed(() => textos.nav[seccion.value]);

const pastilla = computed(() =>
  resumenPastilla({
    cargado: servicios.cargado,
    fallo: falloArranque.value,
    encendidos: servicios.encendidos,
    tuneles: tuneles.activos.length,
    hayError: servicios.lista.some((s) => s.estado === 'error'),
  }),
);

function navegar(clave: string): void {
  void router.push({ name: clave });
}

/** Lleva a la pantalla de la acción de un aviso (si su ruta existe en la aplicación). */
function abrirAviso(a: Aviso): void {
  panelAvisos.value = false;
  const ruta = a.accion?.ruta;
  if (ruta && router.hasRoute(ruta)) void router.push({ name: ruta });
}

// Primer uso: el asistente se abre solo una vez, con el entorno ya leído y sin proyectos.
let asistenteRevisado = false;
watch(
  () => [preferencias.cargado, servicios.cargado, preferencias.asistenteVisto] as const,
  ([prefs, entorno, visto]) => {
    if (asistenteRevisado || !prefs || !entorno) return;
    asistenteRevisado = true;
    if (!visto && sitios.lista.length === 0) solicitudes.asistente = true;
  },
  { immediate: true },
);

let bajaAviso: (() => void) | null = null;

onMounted(() => {
  // El historial no es imprescindible: si no carga, la campana queda en cero.
  void avisos.cargar().catch(() => undefined);
  avisos.iniciar(abrirAviso);
  void ejecutar(
    'arranque',
    async () => {
      await iniciarEntorno();
      return true;
    },
    { tituloError: textos.errores.arranque },
  ).then((ok) => {
    falloArranque.value = !ok;
    if (ok) void mostrarAvisoInicio();
  });
  // Avisos que llegan después (p. ej. un servicio automático que no encendió).
  bajaAviso = api().on('aviso:inicio', () => void mostrarAvisoInicio());
});

/** Aviso del arranque (p. ej. la migración de la carpeta de datos): queda hasta que se cierra. */
async function mostrarAvisoInicio(): Promise<void> {
  let aviso: string | null = null;
  try {
    aviso = await api().avisoInicio();
  } catch {
    return; // no es imprescindible: el resto de la interfaz ya funciona
  }
  if (!aviso) return;
  notification.info({ title: textos.avisoInicio.titulo, content: aviso, closable: true });
}
onBeforeUnmount(() => {
  bajaAviso?.();
  avisos.detener();
  detenerEntorno();
});
</script>

<template>
  <NLayout has-sider class="marco">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="216"
      :collapsed="contraido"
      show-trigger="bar"
      :native-scrollbar="false"
      @collapse="contraido = true"
      @expand="contraido = false"
    >
      <div class="marca" :class="{ contraida: contraido }">
        <img class="logo" :src="logo" alt="" aria-hidden="true" width="32" height="32" />
        <div v-if="!contraido" class="marca-texto">
          <strong>{{ textos.app.nombre }}</strong>
          <span>{{ textos.app.lema }}</span>
        </div>
      </div>
      <NMenu
        :value="seccion"
        :options="opciones"
        :collapsed="contraido"
        :collapsed-width="64"
        :collapsed-icon-size="20"
        :icon-size="18"
        :indent="20"
        @update:value="navegar"
      />
    </NLayoutSider>

    <NLayout class="principal">
      <NLayoutHeader class="cabecera">
        <h1>{{ titulo }}</h1>
        <div class="cabecera-acciones">
          <NButton
            size="small"
            secondary
            class="boton-paleta"
            :aria-label="textos.barra.paleta"
            :title="textos.barra.paleta"
            @click="solicitudes.paleta = true"
          >
            <template #icon
              ><NIcon><IconoBuscar /></NIcon
            ></template>
            <kbd>{{ textos.barra.atajoPaleta }}</kbd>
          </NButton>
          <CampanaAvisos @abrir="panelAvisos = true" />
          <SelectorIdioma compacto />
          <SelectorTema compacto />
          <div
            class="pastilla"
            :class="{ viva: pastilla.tono === 'viva', alerta: pastilla.tono === 'alerta' }"
            role="status"
          >
            <span class="pastilla-punto" aria-hidden="true" />
            {{ pastilla.texto }}
          </div>
        </div>
      </NLayoutHeader>
      <NLayoutContent class="contenido" :native-scrollbar="false" content-class="contenido-interno">
        <RouterView v-slot="{ Component: vista }">
          <Transition name="vista" mode="out-in">
            <!-- Al cambiar de idioma la vista se vuelve a montar: ningún texto queda copiado viejo. -->
            <component :is="vista" :key="`${route.name?.toString()}-${idioma}`" />
          </Transition>
        </RouterView>
      </NLayoutContent>
    </NLayout>
    <!-- Confirmaciones del servidor MCP: una sola instancia para toda la ventana. -->
    <PanelAvisos v-model:visible="panelAvisos" @abrir="abrirAviso" />
    <ConfirmacionMcp />
    <PaletaComandos />
    <AsistenteInicio />
  </NLayout>
</template>

<style scoped>
.marco {
  height: 100vh;
}
.marca {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 14px;
  min-height: 40px;
}
.marca.contraida {
  justify-content: center;
  padding-inline: 0;
}
.logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex: none;
}
.marca-texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.marca-texto strong {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.marca-texto span {
  font-size: 11px;
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.principal {
  height: 100vh;
}
.cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 60px;
  padding: 0 28px;
}
.cabecera h1 {
  margin: 0;
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -0.015em;
}
.cabecera-acciones {
  display: flex;
  align-items: center;
  gap: 6px;
}
.boton-paleta {
  margin-right: 4px;
}
.boton-paleta kbd {
  font-family: var(--fuente);
  font-size: 11px;
  opacity: 0.7;
}
.pastilla {
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  background: rgba(128, 128, 128, 0.07);
}
.pastilla-punto {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8a8f98;
}
.pastilla.viva .pastilla-punto {
  background: #16a34a;
}
.pastilla.alerta .pastilla-punto {
  background: #dc2626;
}
.contenido {
  height: calc(100vh - 60px);
}
:deep(.contenido-interno) {
  padding: 4px 28px 32px;
  max-width: 1180px;
}
.vista-enter-active,
.vista-leave-active {
  transition:
    opacity var(--transicion) ease,
    transform var(--transicion) ease;
}
.vista-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.vista-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .vista-enter-active,
  .vista-leave-active {
    transition: none;
  }
}
</style>
