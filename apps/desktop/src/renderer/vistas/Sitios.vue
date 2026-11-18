<script setup lang="ts">
import { Add, Globe, Search } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NInput } from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import type { ResultadoAplicar, Sitio } from '../../shared/api';
import AvisoHosts from '../componentes/AvisoHosts.vue';
import FilaSitio from '../componentes/FilaSitio.vue';
import FormSitio from '../componentes/FormSitio.vue';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { useHttps } from '../stores/https';
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

const t = es.sitios;
const sitios = useSitios();
const servicios = useServicios();
const https = useHttps();
const { ejecutar } = useAccion();

/** El buscador solo aparece cuando la lista ya no se abarca de un vistazo. */
const UMBRAL_BUSCADOR = 5;

const busqueda = ref('');
const objetivo = ref<ObjetivoForm | null>(null);
const falloHosts = ref<FalloHosts | null>(null);

const ordenados = computed(() => ordenarSitios(sitios.lista));
const conBuscador = computed(() => sitios.lista.length > UMBRAL_BUSCADOR);
const visibles = computed(() =>
  conBuscador.value ? filtrarSitios(ordenados.value, busqueda.value) : ordenados.value,
);

function nuevo(): void {
  objetivo.value = { modo: 'nuevo' };
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
});
</script>

<template>
  <div class="sitios">
    <div class="barra">
      <p class="descripcion">{{ t.descripcion }}</p>
      <NButton v-if="sitios.lista.length" type="primary" size="small" @click="nuevo">
        <template #icon
          ><NIcon><Add /></NIcon
        ></template>
        {{ t.nuevo }}
      </NButton>
    </div>

    <AvisoHosts v-model:fallo="falloHosts" />

    <div v-if="!sitios.lista.length" class="vacio">
      <NEmpty size="large">
        <template #icon>
          <NIcon><Globe /></NIcon>
        </template>
        <template #default>
          <strong class="vacio-titulo">{{ t.vacioTitulo }}</strong>
          <span class="vacio-texto">{{ t.vacio }}</span>
        </template>
        <template #extra>
          <NButton type="primary" size="large" @click="nuevo">
            <template #icon
              ><NIcon><Add /></NIcon
            ></template>
            {{ t.agregar }}
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
          <FilaSitio
            v-for="s in visibles"
            :key="s.id"
            :sitio="s"
            @editar="editar"
            @duplicar="duplicar"
            @aplicado="alAplicar"
          />
        </TransitionGroup>
        <p v-if="!visibles.length" class="sin-resultados">{{ t.sinResultados(busqueda.trim()) }}</p>
      </section>
    </template>

    <FormSitio :objetivo="objetivo" @cerrar="objetivo = null" @aplicado="alAplicar" />
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
.descripcion {
  margin: 0;
  opacity: 0.65;
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
  opacity: 0.6;
}
.lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sin-resultados {
  margin: 12px 0;
  opacity: 0.6;
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
