<script setup lang="ts">
import {
  Globe as IconoSitios,
  Home as IconoInicio,
  Server as IconoServicios,
  Settings as IconoAjustes,
  SwapHorizontal as IconoTuneles,
} from '@vicons/ionicons5';
import {
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  type MenuOption,
} from 'naive-ui';
import { computed, h, onBeforeUnmount, onMounted, ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import type { SeccionNav } from '../router';
import { detenerEntorno, iniciarEntorno } from '../stores/entorno';
import { useServicios } from '../stores/servicios';
import { useTuneles } from '../stores/tuneles';

const route = useRoute();
const router = useRouter();
const servicios = useServicios();
const tuneles = useTuneles();
const { ejecutar } = useAccion();

const contraido = ref(false);

const icono = (c: Component) => () => h(NIcon, null, { default: () => h(c) });
const opciones: MenuOption[] = (
  [
    ['inicio', IconoInicio],
    ['sitios', IconoSitios],
    ['servicios', IconoServicios],
    ['tuneles', IconoTuneles],
    ['ajustes', IconoAjustes],
  ] as const
).map(([clave, c]) => ({ key: clave, label: es.nav[clave], icon: icono(c) }));

const seccion = computed<SeccionNav>(() => route.meta.seccion ?? 'inicio');
const titulo = computed(() => es.nav[seccion.value]);

const resumen = computed(() =>
  servicios.cargado
    ? `${es.resumenGlobal.servicios(servicios.encendidos)} · ${es.resumenGlobal.tuneles(tuneles.activos.length)}`
    : es.resumenGlobal.cargando,
);
const hayError = computed(() => servicios.lista.some((s) => s.estado === 'error'));

function navegar(clave: string): void {
  void router.push({ name: clave });
}

onMounted(() => {
  void ejecutar('arranque', iniciarEntorno, { tituloError: es.errores.arranque });
});
onBeforeUnmount(detenerEntorno);
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
        <div class="logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path
              d="M12 12 4.5 7.8M12 12l7.5-4.2M12 12v8.5"
              stroke="currentColor"
              stroke-width="1.8"
            />
          </svg>
        </div>
        <div v-if="!contraido" class="marca-texto">
          <strong>{{ es.app.nombre }}</strong>
          <span>{{ es.app.lema }}</span>
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
        <div class="pastilla" :class="{ viva: servicios.encendidos > 0, alerta: hayError }">
          <span class="pastilla-punto" aria-hidden="true" />
          {{ resumen }}
        </div>
      </NLayoutHeader>
      <NLayoutContent class="contenido" :native-scrollbar="false" content-class="contenido-interno">
        <RouterView v-slot="{ Component: vista }">
          <Transition name="vista" mode="out-in">
            <component :is="vista" />
          </Transition>
        </RouterView>
      </NLayoutContent>
    </NLayout>
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
  border-radius: 9px;
  color: #fff;
  background: linear-gradient(135deg, #5b67e6, #3f49b8);
  box-shadow: 0 2px 8px rgba(79, 91, 213, 0.35);
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
.pastilla {
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
    opacity 0.14s ease,
    transform 0.14s ease;
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
