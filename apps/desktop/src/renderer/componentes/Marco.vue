<script setup lang="ts">
import logo from '../assets/logo.png';
import {
  Albums as IconoProyectos,
  Bug as IconoDepuracion,
  Chatbubbles as IconoAgentes,
  CodeSlash as IconoPhp,
  Construct as IconoHerramientas,
  Cube as IconoContenedores,
  DocumentText as IconoRegistros,
  Home as IconoInicio,
  Mail as IconoCorreo,
  Medkit as IconoDoctor,
  Server as IconoBases,
  Settings as IconoAjustes,
  Sparkles as IconoIa,
  Search as IconoBuscar,
  SwapHorizontal as IconoTuneles,
  Toggle as IconoServicios,
} from '@vicons/ionicons5';
import {
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  NTooltip,
  useNotification,
  type MenuOption,
} from 'naive-ui';
import type { Aviso } from '../../shared/api';
import { computed, h, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { argsDeAviso, useVersiones } from '../stores/versiones';
import { destinoServicio, destinoVersion, rutaConFoco } from '../utilidades/foco';
import { solicitudes } from '../composables/solicitudes';
import AsistenteInicio from './AsistenteInicio.vue';
import BotonMemoria from './BotonMemoria.vue';
import CampanaAvisos from './CampanaAvisos.vue';
import ConfirmacionMcp from './ConfirmacionMcp.vue';
import PanelAvisos from './PanelAvisos.vue';
import PaletaComandos from './PaletaComandos.vue';
import SoltarArchivos from './SoltarArchivos.vue';
import SelectorIdioma from './SelectorIdioma.vue';
import SelectorTema from './SelectorTema.vue';
import { idioma, textos } from '../i18n';
import { gruposVisibles } from '../navegacion';
import { usePreferencias } from '../stores/preferencias';
import { useSitios } from '../stores/sitios';
import type { SeccionNav } from '../router';
import { detenerEntorno, iniciarEntorno } from '../stores/entorno';
import { resumenPastilla } from '../utilidades/pastilla';
import { useAvisos } from '../stores/avisos';
import { useMetricas, INTERVALO_PUERTOS_MS } from '../stores/metricas';
import { useProblemas } from '../stores/problemas';
import { useServicios } from '../stores/servicios';
import { useTuneles } from '../stores/tuneles';

const route = useRoute();
const router = useRouter();
const versiones = useVersiones();
const servicios = useServicios();
const tuneles = useTuneles();
const { ejecutar } = useAccion();
const notification = useNotification();

const avisos = useAvisos();
const problemas = useProblemas();
const metricas = useMetricas();
const panelAvisos = ref(false);
/** Ventana estrecha (p. ej. escala de Windows alta): el menú lateral empieza plegado. */
const ANCHO_PLEGAR = 900;
const contraido = ref(typeof window !== 'undefined' && window.innerWidth < ANCHO_PLEGAR);
const falloArranque = ref(false);

const preferencias = usePreferencias();
const sitios = useSitios();

/**
 * Icono de una entrada del menú. Plegado, el carril solo muestra iconos: cada uno lleva un globo
 * con el nombre de la pantalla (el de Naive UI no sale en las entradas dentro de un grupo) y el
 * globo cubre toda la entrada, no solo el dibujo.
 */
const icono = (c: Component, clave: SeccionNav) => () => {
  const dibujo = h(NIcon, null, { default: () => h(c) });
  if (!contraido.value) return dibujo;
  return h(
    NTooltip,
    { placement: 'right' },
    {
      trigger: () => h('span', { class: 'icono-plegado' }, [dibujo]),
      default: () => textos.nav[clave],
    },
  );
};
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
  contenedores: IconoContenedores,
  herramientas: IconoHerramientas,
  depuracion: IconoDepuracion,
  doctor: IconoDoctor,
  registros: IconoRegistros,
  ajustes: IconoAjustes,
};
const item = (k: SeccionNav): MenuOption => ({
  key: k,
  // El recorrido de bienvenida resalta la entrada por el atributo data-nav de su texto.
  label: () => h('span', { 'data-nav': k }, textos.nav[k]),
  icon: icono(ICONOS[k], k),
});
/** Barra lateral agrupada (se rearma al cambiar de idioma). */
const opciones = computed<MenuOption[]>(() => [
  ...gruposVisibles(preferencias.seccionesAvanzadas).map((g) => ({
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
    // La misma cuenta que Servicios e Inicio (`servicios.resumen`, sobre los servicios visibles).
    encendidos: servicios.resumen.encendidos,
    tuneles: tuneles.activos.length,
    // Con los procesos de proyecto: uno en error también pone la pastilla en alerta.
    hayError: servicios.resumen.conErrorVigilados > 0,
    conError: servicios.resumen.conErrorVigilados,
    errores: servicios.vigilados
      .filter((s) => s.estado === 'error')
      .map((s) => ({ id: s.id, nombre: s.nombre, mensaje: s.mensaje })),
    // La misma cuenta que la campana y el bloque «Problemas detectados» de Inicio.
    problemas: problemas.total,
  }),
);

/** Con un servicio en error, la pastilla lleva a su tarjeta (con foco); si no, a Servicios. */
function abrirPastilla(): void {
  const id = pastilla.value.destinoId;
  if (id) void router.push(destinoServicio(id));
  else navegar('servicios');
}

/** Plegado, el menú solo muestra iconos: cada entrada lleva su nombre para lectores de pantalla. */
function propsEntrada(o: MenuOption): Record<string, string> {
  const clave = typeof o.key === 'string' ? o.key : '';
  return clave in ICONOS ? { 'aria-label': textos.nav[clave as SeccionNav] } : {};
}

function navegar(clave: string): void {
  void router.push({ name: clave });
}

/** Lleva a la pantalla de la acción de un aviso (si su ruta existe en la aplicación). */
function abrirAviso(a: Aviso): void {
  panelAvisos.value = false;
  const ruta = a.accion?.ruta;
  // Versión nueva: Servicios → Versiones del servicio y, si el aviso lo ofrece, el diálogo de
  // actualización (que es el único que actualiza).
  if (ruta === 'servicios.versiones') {
    const args = argsDeAviso(a.accion?.args);
    if (!args) {
      const foco = a.accion?.foco;
      void router.push(foco ? rutaConFoco(ruta, foco) : { name: ruta });
      return;
    }
    // La pestaña se desplaza hasta la tarjeta de la versión nueva y la resalta (D41).
    void router
      .push(destinoVersion(args.servicio, args.version))
      .then(() => versiones.abrirDesdeAviso(args))
      .catch(() => undefined);
    return;
  }
  if (!ruta || !router.hasRoute(ruta)) return;
  const foco = a.accion?.foco;
  void router.push(foco ? rutaConFoco(ruta, foco) : { name: ruta });
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
let bajaCaptura: (() => void) | null = null;
let vigilaPuertos: ReturnType<typeof setInterval> | null = null;

/** Al cruzar el umbral se pliega o despliega solo; el usuario puede cambiarlo después. */
let consultaAncho: MediaQueryList | null = null;
function alCambiarAncho(e: MediaQueryListEvent): void {
  contraido.value = e.matches;
}
onMounted(() => {
  consultaAncho = window.matchMedia(`(max-width: ${ANCHO_PLEGAR - 1}px)`);
  consultaAncho.addEventListener('change', alCambiarAncho);
  // Los puertos ocupados cuentan como problema en la pastilla y la campana desde cualquier
  // pantalla, no solo desde Inicio (la misma lectura que usa el bloque de Inicio).
  void metricas.cargarPuertos();
  vigilaPuertos = setInterval(() => {
    if (!document.hidden) void metricas.cargarPuertos();
  }, INTERVALO_PUERTOS_MS);
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
  // Una captura de pantalla pasó al conversor de imágenes (D35): se abre esa herramienta.
  bajaCaptura = api().on('captura:imagen', () => {
    solicitudes.herramienta = 'imagenes';
    void router.push({ name: 'herramientas' });
  });
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
  consultaAncho?.removeEventListener('change', alCambiarAncho);
  bajaAviso?.();
  bajaCaptura?.();
  if (vigilaPuertos) clearInterval(vigilaPuertos);
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
        :node-props="propsEntrada"
        @update:value="navegar"
      />
    </NLayoutSider>

    <NLayout class="principal">
      <NLayoutHeader class="cabecera">
        <div class="fila-cabecera">
          <h1>{{ titulo }}</h1>
          <!-- Buscador general (Ctrl+K) centrado en la barra; en ventanas estrechas queda como icono. -->
          <div class="cabecera-centro">
            <button
              type="button"
              class="buscador"
              :aria-label="textos.barra.paleta"
              :title="textos.barra.paleta"
              @click="solicitudes.paleta = true"
            >
              <NIcon :size="16" aria-hidden="true"><IconoBuscar /></NIcon>
              <span class="buscador-texto">{{ textos.barra.paleta }}</span>
              <kbd>{{ textos.barra.atajoPaleta }}</kbd>
            </button>
          </div>
          <div class="cabecera-acciones">
            <BotonMemoria />
            <CampanaAvisos @abrir="panelAvisos = true" />
            <SelectorIdioma compacto />
            <SelectorTema compacto />
            <!-- Estado del entorno siempre con texto corto; al pulsarla lleva a Servicios. -->
            <button
              type="button"
              class="pastilla"
              :class="{ viva: pastilla.tono === 'viva', alerta: pastilla.tono === 'alerta' }"
              :title="pastilla.title"
              :aria-label="pastilla.title"
              @click="abrirPastilla"
            >
              <span class="pastilla-punto" aria-hidden="true" />
              <span class="pastilla-texto pastilla-largo" role="status">{{ pastilla.largo }}</span>
              <span class="pastilla-texto pastilla-corto" aria-hidden="true">{{
                pastilla.corto
              }}</span>
            </button>
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
    <SoltarArchivos />
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
  opacity: 0.72;
  /* El lema entero, en dos líneas si hace falta: nunca con puntos suspensivos. */
  line-height: 1.25;
  /* Sin cortes a mitad de palabra en zh y ja; el respaldo parte solo si no cabe. */
  word-break: keep-all;
  overflow-wrap: anywhere;
}
.principal {
  height: 100vh;
}
/*
 * Menú plegado: los títulos de grupo no caben en el carril de 64 px y se verían cortados; un
 * filete fino separa los grupos en su lugar.
 */
:deep(.n-menu.n-menu--collapsed .n-menu-item-group-title) {
  display: none;
}
:deep(.n-menu.n-menu--collapsed .n-menu-item-group + .n-menu-item-group) {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(128, 128, 128, 0.22);
}
/* El logotipo es oscuro: sobre el fondo del tema oscuro se aclara para que se distinga. */
:global(:root[data-tema='oscuro'] .logo) {
  filter: brightness(1.7) saturate(1.15);
}
/* La raya para plegar el menú solo se ve al pasar el ratón por la barra lateral o al enfocarla. */
:deep(.n-layout-toggle-bar) {
  opacity: 0;
  transition: opacity var(--transicion) ease;
}
:deep(.n-layout-sider:hover .n-layout-toggle-bar),
:deep(.n-layout-toggle-bar:hover),
:deep(.n-layout-toggle-bar:focus-visible),
:deep(.n-layout-sider:focus-within .n-layout-toggle-bar) {
  opacity: 1;
}
/* El globo del menú plegado cubre la entrada entera. */
:deep(.icono-plegado) {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
/*
 * Título a la izquierda, buscador centrado y controles a la derecha. Las dos columnas de los lados
 * reparten el sitio por igual (1fr), así el buscador queda en el centro de la barra salvo que los
 * controles necesiten más.
 */
.cabecera {
  height: 60px;
  padding: 0 28px;
  container-type: inline-size;
  /* La barra arrastra la ventana; el buscador y los controles no (ver más abajo). */
  -webkit-app-region: drag;
}
.fila-cabecera {
  display: grid;
  /*
   * Los controles de la derecha nunca se encogen (min-content): su ancho depende del idioma y de
   * la pastilla de estado. El título (mínimo 110 px, luego puntos suspensivos) y el buscador
   * (fracción de 2, topado a 520 px en su botón) se reparten el resto, así nada se solapa a ningún
   * ancho. Las tres columnas son fracciones: una columna con tope fijo (p. ej. 520 px) se llevaría
   * el sitio antes que el título.
   */
  grid-template-columns: minmax(110px, 1fr) minmax(34px, 2fr) minmax(min-content, 1fr);
  align-items: center;
  column-gap: 16px;
  height: 100%;
}
.cabecera h1 {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -0.015em;
}
.cabecera-centro {
  display: flex;
  justify-content: center;
  min-width: 0;
}
.cabecera-acciones {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  -webkit-app-region: no-drag;
}
.buscador {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 520px;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(128, 128, 128, 0.28);
  border-radius: 999px;
  background: rgba(128, 128, 128, 0.07);
  color: inherit;
  font: inherit;
  font-size: 13px;
  cursor: text;
  -webkit-app-region: no-drag;
}
.buscador:hover {
  border-color: rgba(var(--acento-rgb), 0.6);
}
.buscador:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}
.buscador-texto {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
}
.buscador kbd {
  flex: none;
  font-family: var(--fuente);
  font-size: 11px;
  opacity: 0.76;
}
.pastilla-texto {
  white-space: nowrap;
}
.pastilla-largo {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pastilla-corto {
  display: none;
}
/* Sitio justo: el buscador conserva el texto y cede el atajo, que no es imprescindible. */
@container (max-width: 1240px) {
  .buscador kbd {
    display: none;
  }
}
/* Ventana estrecha: el buscador pasa a un icono y deja su sitio al título y a los controles. */
@container (max-width: 900px) {
  .fila-cabecera {
    grid-template-columns: minmax(110px, 1fr) 34px minmax(min-content, 1fr);
  }
  .buscador {
    width: 34px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
  }
  .buscador-texto,
  .buscador kbd {
    display: none;
  }
  /*
   * Por debajo de 900 px la pastilla en reposo se queda en el punto (el texto sigue en su título);
   * en alerta enseña «N con error» y no solo el punto: el color solo no basta (D54c).
   */
  .pastilla-texto {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .pastilla {
    padding: 8px;
  }
  .pastilla.alerta {
    padding: 0 10px;
  }
  .pastilla.alerta .pastilla-largo {
    display: none;
  }
  .pastilla.alerta .pastilla-corto {
    display: inline;
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip-path: none;
  }
}
.pastilla {
  margin-left: var(--wc-esp-2);
  display: inline-flex;
  align-items: center;
  gap: var(--wc-esp-2);
  height: 28px;
  padding: 0 10px;
  border-radius: var(--wc-radio-completo);
  font: inherit;
  font-size: var(--wc-texto-xs);
  color: inherit;
  cursor: pointer;
  border: 1px solid rgba(128, 128, 128, 0.22);
  background: rgba(128, 128, 128, 0.07);
}
.pastilla:hover {
  border-color: rgba(var(--acento-rgb), 0.6);
}
.pastilla:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
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
/* Estado de alerta: borde, fondo y texto en rojo (más claro sobre el tema oscuro). */
.pastilla.alerta {
  border-color: rgba(220, 38, 38, 0.45);
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
}
:global(:root[data-tema='oscuro'] .pastilla.alerta) {
  color: #fca5a5;
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
