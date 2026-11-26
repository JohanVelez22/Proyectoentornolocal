<script setup lang="ts">
import { Add, Albums, DownloadOutline, Search, Sparkles } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NInput } from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import type { ResultadoAplicar, Sitio } from '../../shared/api';
import AgregarProyecto from '../componentes/AgregarProyecto.vue';
import AsistenteImportar from '../componentes/AsistenteImportar.vue';
import AsistenteNuevoProyecto from '../componentes/AsistenteNuevoProyecto.vue';
import AsistenteReceta from '../componentes/AsistenteReceta.vue';
import AvisoHosts from '../componentes/AvisoHosts.vue';
import FormSitio from '../componentes/FormSitio.vue';
import RegistrosProyecto from '../componentes/RegistrosProyecto.vue';
import SugerenciasProyectos from '../componentes/SugerenciasProyectos.vue';
import DialogoGuardarPlantilla from '../componentes/DialogoGuardarPlantilla.vue';
import EditorEnv from '../componentes/EditorEnv.vue';
import TarjetaProyecto from '../componentes/TarjetaProyecto.vue';
import { useAccion } from '../composables/useAccion';
import { useFoco } from '../composables/useFoco';
import { solicitudes } from '../composables/solicitudes';
import IlustracionVacia from '../componentes/IlustracionVacia.vue';
import { textos } from '../i18n';
import { useHttps } from '../stores/https';
import { useProyectos } from '../stores/proyectos';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import {
  datosParaDuplicar,
  falloHostsDe,
  filtrarSitios,
  ordenarSitios,
  type FalloHosts,
  type ObjetivoForm,
} from '../utilidades/sitios';
import type { ObjetivoAsistente } from '../utilidades/proyectos';

const t = textos.sitios;
const tp = textos.proyectos;
const sitios = useSitios();
const proyectos = useProyectos();
const servicios = useServicios();
const https = useHttps();
const { ejecutar } = useAccion();
useFoco();

/** El buscador solo aparece cuando la lista ya no se abarca de un vistazo. */
const UMBRAL_BUSCADOR = 5;

const busqueda = ref('');
const objetivo = ref<ObjetivoForm | null>(null);
const falloHosts = ref<FalloHosts | null>(null);
const agregando = ref(false);
const creandoProyecto = ref(false);
const importando = ref(false);
const asistente = ref<ObjetivoAsistente | null>(null);
const registros = ref<Sitio | null>(null);
/** Proyecto que se guarda como plantilla (null: el diálogo está cerrado). */
const plantillaDe = ref<Sitio | null>(null);
/** Proyecto cuyo .env se está viendo (null: el gestor está cerrado). */
const envDe = ref<Sitio | null>(null);

const ordenados = computed(() => ordenarSitios(sitios.lista));
const conBuscador = computed(() => sitios.lista.length > UMBRAL_BUSCADOR);
const visibles = computed(() =>
  conBuscador.value ? filtrarSitios(ordenados.value, busqueda.value) : ordenados.value,
);

function nuevo(): void {
  agregando.value = true;
}
/** "Agregar sin receta": el formulario de siempre. */
function manual(): void {
  agregando.value = false;
  objetivo.value = { modo: 'nuevo' };
}
/** Tras clonar o elegir una carpeta se abre el asistente de receta. */
function preparar(d: { carpeta: string; remoto: string | null }): void {
  agregando.value = false;
  asistente.value = { modo: 'nuevo', carpeta: d.carpeta, remoto: d.remoto };
}
function verPreparacion(s: Sitio): void {
  asistente.value = { modo: 'ver', sitioId: s.id };
}
function revisarReceta(s: Sitio): void {
  asistente.value = { modo: 'revisar', sitioId: s.id };
}
function editar(sitio: Sitio): void {
  objetivo.value = { modo: 'editar', sitio };
}
function duplicar(sitio: Sitio): void {
  objetivo.value = { modo: 'duplicar', datos: datosParaDuplicar(sitio, sitios.lista) };
}

/** Si hosts no se pudo escribir, el aviso queda fijo arriba con "Reintentar" e instrucciones. */
function alAplicar(r: ResultadoAplicar): void {
  falloHosts.value = falloHostsDe(r);
  // El estado de HTTPS (autoridad, puerto ocupado) puede haber cambiado al guardar.
  void https.cargar();
}

// "Clonar desde GitHub" o "Agregar un proyecto" desde la paleta de comandos.
watch(
  () => solicitudes.agregarProyecto,
  (v) => {
    if (!v) return;
    solicitudes.agregarProyecto = false;
    agregando.value = true;
  },
  { immediate: true },
);

// "Nuevo proyecto" desde la paleta de comandos o Inicio.
watch(
  () => solicitudes.nuevoProyecto,
  (v) => {
    if (!v) return;
    solicitudes.nuevoProyecto = false;
    creandoProyecto.value = true;
  },
  { immediate: true },
);

// Si Nginx cambia de estado, el puerto HTTPS puede haber quedado libre u ocupado.
watch(
  () => servicios.porId['nginx']?.estado,
  () => void https.cargar(),
);

onMounted(() => {
  // Para el selector de PHP y para saber si el túnel se puede abrir.
  void ejecutar('instalados', () =>
    Promise.all([servicios.cargarInstalados('php'), servicios.cargarInstalados('cloudflared')]),
  );
  // Para los avisos de HTTPS pendiente y el aviso de red local del FTP.
  void https.cargar();
  if (servicios.redLocalFtp === null) void servicios.cargarPreferencias().catch(() => undefined);
  void proyectos.cargarSugerencias().catch(() => undefined);
});
</script>

<template>
  <div class="proyectos">
    <div class="barra">
      <p class="descripcion">{{ tp.descripcion }}</p>
      <div class="acciones-barra">
        <NButton size="small" secondary @click="creandoProyecto = true">
          <template #icon
            ><NIcon><Sparkles /></NIcon
          ></template>
          {{ textos.nuevoProyecto.boton }}
        </NButton>
        <NButton size="small" secondary @click="importando = true">
          <template #icon
            ><NIcon><DownloadOutline /></NIcon
          ></template>
          {{ textos.importar.boton }}
        </NButton>
        <NButton v-if="sitios.lista.length" type="primary" size="small" @click="nuevo">
          <template #icon
            ><NIcon><Add /></NIcon
          ></template>
          {{ tp.agregar }}
        </NButton>
      </div>
    </div>

    <AvisoHosts v-model:fallo="falloHosts" />
    <SugerenciasProyectos @preparar="preparar" />

    <div v-if="!sitios.lista.length" class="vacio">
      <NEmpty size="large">
        <template #icon><IlustracionVacia :icono="Albums" /></template>
        <template #default>
          <strong class="vacio-titulo">{{ tp.vacioTitulo }}</strong>
          <span class="vacio-texto">{{ tp.vacio }}</span>
        </template>
        <template #extra>
          <NButton type="primary" size="large" @click="creandoProyecto = true">
            <template #icon
              ><NIcon><Sparkles /></NIcon
            ></template>
            {{ textos.nuevoProyecto.boton }}
          </NButton>
          <NButton size="large" @click="nuevo">
            <template #icon
              ><NIcon><Add /></NIcon
            ></template>
            {{ tp.agregar }}
          </NButton>
        </template>
      </NEmpty>
    </div>

    <template v-else>
      <div v-if="conBuscador" class="buscador">
        <NInput v-model:value="busqueda" clearable :placeholder="t.buscar" :aria-label="t.buscar">
          <template #prefix
            ><NIcon><Search /></NIcon
          ></template>
        </NInput>
        <span class="total">{{ t.total(visibles.length) }}</span>
      </div>

      <section class="lista" aria-live="polite">
        <TransitionGroup name="fila">
          <TarjetaProyecto
            v-for="s in visibles"
            :key="s.id"
            :sitio="s"
            @editar="editar"
            @duplicar="duplicar"
            @aplicado="alAplicar"
            @ver-preparacion="verPreparacion"
            @revisar-receta="revisarReceta"
            @ver-registros="(x: Sitio) => (registros = x)"
            @guardar-plantilla="(x: Sitio) => (plantillaDe = x)"
            @ver-env="(x: Sitio) => (envDe = x)"
          />
        </TransitionGroup>
        <p v-if="!visibles.length" class="sin-resultados">{{ t.sinResultados(busqueda.trim()) }}</p>
      </section>
    </template>

    <FormSitio :objetivo="objetivo" @cerrar="objetivo = null" @aplicado="alAplicar" />
    <AgregarProyecto
      :show="agregando"
      @cerrar="agregando = false"
      @preparar="preparar"
      @manual="manual"
    />
    <AsistenteNuevoProyecto :show="creandoProyecto" @cerrar="creandoProyecto = false" />
    <AsistenteImportar :show="importando" @cerrar="importando = false" />
    <DialogoGuardarPlantilla :sitio="plantillaDe" @cerrar="plantillaDe = null" />
    <EditorEnv :sitio="envDe" @cerrar="envDe = null" />
    <AsistenteReceta :objetivo="asistente" @cerrar="asistente = null" @aplicado="alAplicar" />
    <RegistrosProyecto :sitio="registros" @cerrar="registros = null" />
  </div>
</template>

<style scoped>
.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  min-height: 28px;
}
.acciones-barra {
  display: flex;
  gap: 8px;
}
.descripcion {
  margin: 0;
  opacity: 0.75;
}
.vacio {
  padding: 56px 0 48px;
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
.buscador {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.buscador .n-input {
  max-width: 340px;
}
.total {
  font-size: 12.5px;
  opacity: 0.72;
}
.lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sin-resultados {
  margin: 12px 0;
  opacity: 0.72;
}
.fila-enter-active,
.fila-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.fila-enter-from,
.fila-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
@media (prefers-reduced-motion: reduce) {
  .fila-enter-active,
  .fila-leave-active {
    transition: none;
  }
}
</style>
