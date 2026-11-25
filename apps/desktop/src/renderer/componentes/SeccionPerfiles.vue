<script setup lang="ts">
import { Archive } from '@vicons/ionicons5';
import { NAlert, NButton, NCard, NCheckbox, NIcon, NInput, NTag, useMessage } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { InstantaneaEntorno, ResultadoExportarPerfil } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { MIN_FRASE, problemaExportar, rellenar, tamanoLegible } from '../utilidades/perfiles';
import AsistenteImportarPerfil from './AsistenteImportarPerfil.vue';

/**
 * "Respaldo y perfiles" (Ajustes): exportar el entorno a un .wolfperfil, importar uno con el
 * asistente y las instantáneas automáticas del entorno. La frase solo vive en este componente y se
 * borra al terminar; con `WOLFCORE_DATOS` la sección dice que es una carpeta de prueba.
 */
const t = textos.perfiles.pantalla;
const avisos = textos.perfiles.avisos as Record<string, string>;
const { ejecutar, ocupado } = useAccion();
const message = useMessage();

const carpetaPrueba = ref<string | null>(null);
const bases = ref(false);
const ca = ref(false);
const certificados = ref(false);
const frase = ref('');
const fraseRepetida = ref('');
const resultado = ref<ResultadoExportarPerfil | null>(null);
const instantaneas = ref<InstantaneaEntorno[]>([]);
const mostrarAsistente = ref(false);

const necesitaFrase = computed(() => bases.value || ca.value);
const problema = computed(() =>
  problemaExportar({
    bases: bases.value,
    ca: ca.value,
    certificados: certificados.value,
    frase: frase.value,
    fraseRepetida: fraseRepetida.value,
  }),
);
const textoProblema = computed(() => {
  const p = problema.value;
  if (!p) return null;
  return p === 'frase_corta'
    ? t.exportar.problemas.frase_corta(MIN_FRASE)
    : t.exportar.problemas[p];
});
// Los certificados solo viajan con la CA: al quitar la CA se quitan también.
function alCambiarCa(v: boolean): void {
  ca.value = v;
  if (!v) certificados.value = false;
}

function limpiarFrase(): void {
  frase.value = '';
  fraseRepetida.value = '';
}

async function cargar(): Promise<void> {
  const [entorno, lista] = await Promise.all([
    ejecutar('entorno', () => api().perfiles.entorno()),
    ejecutar('lista', () => api().perfiles.instantaneas()),
  ]);
  carpetaPrueba.value = entorno?.aislado ? entorno.carpeta : null;
  instantaneas.value = lista ?? [];
}
onMounted(() => void cargar());

async function exportar(): Promise<void> {
  if (problema.value) return;
  const destino = await ejecutar('exportar', () =>
    api().sistema.guardarArchivo('entorno.wolfperfil'),
  );
  if (!destino) {
    // Cancelar el diálogo de guardar tampoco deja la frase en memoria.
    limpiarFrase();
    return;
  }
  const conFrase = necesitaFrase.value;
  const r = await ejecutar(
    'exportar',
    () =>
      api().perfiles.exportar({
        destino,
        bases: bases.value,
        certificados: certificados.value,
        ca: ca.value,
        frase: conFrase ? frase.value : null,
      }),
    { exito: t.exportar.listo },
  );
  // La frase se borra apenas termina, salga bien o mal.
  limpiarFrase();
  resultado.value = r ?? null;
}

async function tomarInstantanea(): Promise<void> {
  const carpeta = await ejecutar('instantanea', () => api().perfiles.instantanea());
  if (carpeta === undefined) return;
  if (carpeta === '') message.info(t.instantaneas.sinNada);
  else message.success(t.instantaneas.tomada);
  instantaneas.value = (await ejecutar('lista', () => api().perfiles.instantaneas())) ?? [];
}

function cerrarAsistente(): void {
  mostrarAsistente.value = false;
  void ejecutar('lista', () => api().perfiles.instantaneas()).then((l) => {
    instantaneas.value = l ?? [];
  });
}

const textoAviso = (codigo: string, datos?: Record<string, string>): string =>
  rellenar(avisos[codigo] ?? codigo, datos);
const motivoTexto = (m: InstantaneaEntorno['motivo']): string => t.instantaneas.motivos[m];
const fecha = (iso: string): string => new Date(iso).toLocaleString();
</script>

<template>
  <NCard size="small" class="tarjeta">
    <template #header>
      <span class="titulo-tarjeta">
        <NIcon :size="16"><Archive /></NIcon>
        {{ t.titulo }}
        <NTag v-if="carpetaPrueba" size="small" type="warning" :bordered="false">{{
          t.aislado.titulo
        }}</NTag>
      </span>
    </template>

    <NAlert
      v-if="carpetaPrueba"
      type="warning"
      :bordered="false"
      :title="t.aislado.titulo"
      class="bloque"
    >
      {{ t.aislado.texto(carpetaPrueba) }}
    </NAlert>
    <p class="descripcion">{{ t.descripcion }}</p>

    <section class="bloque">
      <h3 class="subtitulo">{{ t.exportar.titulo }}</h3>
      <p class="ayuda">{{ t.exportar.texto }}</p>
      <div class="casillas">
        <div>
          <NCheckbox v-model:checked="bases">{{ t.exportar.bases }}</NCheckbox>
          <small class="ayuda">{{ t.exportar.basesAyuda }}</small>
        </div>
        <div>
          <NCheckbox :checked="ca" @update:checked="alCambiarCa">{{ t.exportar.ca }}</NCheckbox>
          <small class="ayuda">{{ t.exportar.caAyuda }}</small>
        </div>
        <div>
          <NCheckbox v-model:checked="certificados" :disabled="!ca">{{
            t.exportar.certificados
          }}</NCheckbox>
          <small class="ayuda">{{ t.exportar.certificadosAyuda }}</small>
        </div>
      </div>
      <div v-if="necesitaFrase" class="frase">
        <NInput
          v-model:value="frase"
          type="password"
          show-password-on="click"
          :placeholder="t.exportar.frase"
          :aria-label="t.exportar.frase"
          :input-props="{ autocomplete: 'off', spellcheck: false }"
          maxlength="1024"
        />
        <NInput
          v-model:value="fraseRepetida"
          type="password"
          show-password-on="click"
          :placeholder="t.exportar.fraseRepetir"
          :aria-label="t.exportar.fraseRepetir"
          :input-props="{ autocomplete: 'off', spellcheck: false }"
          maxlength="1024"
        />
        <small class="ayuda">{{ t.exportar.fraseAyuda(MIN_FRASE) }}</small>
      </div>
      <p
        v-if="
          textoProblema &&
          (frase !== '' || fraseRepetida !== '' || problema === 'certificados_sin_ca')
        "
        class="error"
      >
        {{ textoProblema }}
      </p>
      <div class="acciones">
        <NButton
          type="primary"
          :disabled="problema !== null"
          :loading="ocupado('exportar')"
          @click="exportar"
          >{{ t.exportar.exportar }}</NButton
        >
      </div>
      <p class="ayuda">{{ t.exportar.nota }}</p>
      <NAlert v-if="resultado" type="success" :bordered="false" :title="t.exportar.listo">
        {{ t.exportar.guardado(resultado.archivo, tamanoLegible(resultado.bytes)) }}
        <ul v-if="resultado.avisos.length" class="avisos">
          <li v-for="(a, i) in resultado.avisos" :key="i">{{ textoAviso(a.codigo, a.datos) }}</li>
        </ul>
      </NAlert>
    </section>

    <section class="bloque">
      <h3 class="subtitulo">{{ t.importar.titulo }}</h3>
      <p class="ayuda">{{ t.importar.texto }}</p>
      <div class="acciones">
        <NButton @click="mostrarAsistente = true">{{ t.importar.boton }}</NButton>
      </div>
    </section>

    <section class="bloque">
      <h3 class="subtitulo">{{ t.instantaneas.titulo }}</h3>
      <p class="ayuda">{{ t.instantaneas.texto }} {{ t.instantaneas.compartidas }}</p>
      <ul v-if="instantaneas.length" class="instantaneas">
        <li v-for="i in instantaneas" :key="i.nombre">
          <strong>{{ fecha(i.creado) }}</strong>
          <span class="ayuda">{{ motivoTexto(i.motivo) }}</span>
        </li>
      </ul>
      <p v-else class="ayuda">{{ t.instantaneas.vacia }}</p>
      <div class="acciones">
        <NButton secondary :loading="ocupado('instantanea')" @click="tomarInstantanea">{{
          t.instantaneas.tomar
        }}</NButton>
      </div>
    </section>

    <AsistenteImportarPerfil
      :show="mostrarAsistente"
      :carpeta-prueba="carpetaPrueba"
      @cerrar="cerrarAsistente"
    />
  </NCard>
</template>

<style scoped>
.tarjeta {
  border-radius: 12px;
  margin-bottom: 14px;
  max-width: 760px;
}
.titulo-tarjeta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.descripcion {
  margin: 0 0 6px;
  font-size: 12.5px;
  opacity: 0.8;
}
.bloque {
  margin-top: 16px;
}
.subtitulo {
  margin: 0 0 4px;
  font-size: 14px;
}
.ayuda {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.65;
}
.casillas {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}
.casillas small {
  display: block;
  margin-left: 24px;
}
.frase {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 420px;
  margin: 8px 0;
}
.error {
  margin: 6px 0;
  font-size: 12px;
  color: var(--texto-error);
}
.acciones {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}
.avisos {
  margin: 6px 0 0;
  padding-left: 18px;
}
.instantaneas {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 6px 0;
  padding: 0;
  list-style: none;
  font-size: 12.5px;
  max-height: 180px;
  overflow: auto;
}
.instantaneas li {
  display: flex;
  gap: 10px;
}
</style>
