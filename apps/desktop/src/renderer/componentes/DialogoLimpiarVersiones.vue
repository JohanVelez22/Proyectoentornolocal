<script setup lang="ts">
import { Warning } from '@vicons/ionicons5';
import { NAlert, NButton, NCheckbox, NIcon, NModal, NRadio, NRadioGroup, NSpin } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { DestinoLimpieza, ResultadoLimpieza, VersionSinUso } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { formatearTamano } from '../utilidades/bd';
import { mensajeDeError } from '../utilidades/errores';

/**
 * Limpieza de versiones sin uso (D30). Muestra todas las versiones instaladas con su tamaño y,
 * las que algo usa, el motivo (no se pueden marcar). Lo marcado se quita de `bin/` a la papelera
 * (7 días) o de forma definitiva, tras la instantánea del entorno; los datos de las bases y los
 * proyectos nunca se tocan. El borrado definitivo pide una casilla aparte.
 */
const mostrar = defineModel<boolean>('show', { required: true });
const t = textos.versiones.limpieza;
const { ejecutar, ocupado } = useAccion();

const lista = ref<VersionSinUso[] | null>(null);
const errorLista = ref<string | null>(null);
const marcadas = ref(new Set<string>());
const destino = ref<DestinoLimpieza>('papelera');
const entiendo = ref(false);
const resultado = ref<ResultadoLimpieza | null>(null);

const clave = (v: { servicio: string; version: string }): string => `${v.servicio}/${v.version}`;
const nombre = (v: { servicio: string; version: string }): string =>
  `${(textos.versiones.servicios as Record<string, string>)[v.servicio] ?? v.servicio} ${v.version}`;
const motivo = (m: VersionSinUso['motivoBloqueo']): string =>
  m === null ? '' : (t.motivos[m] ?? t.bloqueada);

const libres = computed(() => (lista.value ?? []).filter((v) => v.motivoBloqueo === null));
const elegidas = computed(() => libres.value.filter((v) => marcadas.value.has(clave(v))));
const bytesElegidos = computed(() => elegidas.value.reduce((s, v) => s + v.bytes, 0));
const puede = computed(
  () => elegidas.value.length > 0 && (destino.value === 'papelera' || entiendo.value),
);

async function cargar(): Promise<void> {
  lista.value = null;
  errorLista.value = null;
  try {
    lista.value = await api().limpiezaVersiones.sinUso();
  } catch (e) {
    errorLista.value = mensajeDeError(e);
  }
  marcadas.value = new Set();
}

watch(
  mostrar,
  (v) => {
    if (!v) return;
    resultado.value = null;
    entiendo.value = false;
    destino.value = 'papelera';
    void cargar();
  },
  { immediate: true },
);

function alternar(v: VersionSinUso, on: boolean): void {
  if (v.motivoBloqueo !== null) return;
  const s = new Set(marcadas.value);
  if (on) s.add(clave(v));
  else s.delete(clave(v));
  marcadas.value = s;
}

async function confirmar(): Promise<void> {
  if (!puede.value) return;
  const seleccion = elegidas.value.map((v) => ({ servicio: v.servicio, version: v.version }));
  const r = await ejecutar(
    'limpiarVersiones',
    () => api().limpiezaVersiones.limpiar(seleccion, true, destino.value),
    { tituloError: t.fallo },
  );
  if (!r) return;
  resultado.value = r;
  await cargar();
}

/** Lo que no se quitó, con el motivo traducido por su código. */
const saltadas = computed(() =>
  (resultado.value?.fallidos ?? []).map((f) =>
    t.saltada(
      nombre(f),
      mensajeDeError({
        codigo: f.codigo,
        datos: {
          servicio:
            textos.versiones.servicios[f.servicio as keyof typeof textos.versiones.servicios] ??
            f.servicio,
          version: f.version,
        },
      }),
    ),
  ),
);
</script>

<template>
  <NModal
    :show="mostrar"
    preset="card"
    :title="t.titulo"
    size="small"
    :bordered="false"
    :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
    :closable="!ocupado('limpiarVersiones')"
    :mask-closable="!ocupado('limpiarVersiones')"
    @update:show="(v: boolean) => (mostrar = v)"
  >
    <p class="texto">{{ t.intro }}</p>

    <div v-if="resultado" class="resultado" role="status">
      <strong>{{ t.resultadoTitulo }}</strong>
      <ul>
        <li v-if="resultado.liberados > 0">
          {{ t.liberadas(formatearTamano(resultado.liberados)) }}
        </li>
        <li v-if="resultado.enPapelera > 0">
          {{ t.enPapelera(formatearTamano(resultado.enPapelera)) }}
        </li>
        <li v-if="resultado.instantanea">{{ t.instantaneaGuardada }}</li>
        <li v-if="resultado.pendientes > 0">{{ t.pendientes(resultado.pendientes) }}</li>
        <li v-for="s in saltadas" :key="s" class="saltada">{{ s }}</li>
      </ul>
    </div>

    <div v-if="lista === null && errorLista === null" class="cargando">
      <NSpin size="small" /> {{ t.cargando }}
    </div>
    <NAlert v-else-if="errorLista" type="error" :bordered="false">
      {{ t.fallaLista }}: {{ errorLista }}
    </NAlert>
    <p v-else-if="lista !== null && lista.length === 0" class="texto nota">{{ t.vacia }}</p>
    <template v-else-if="lista !== null">
      <p v-if="libres.length === 0" class="texto nota">{{ t.sinLibres }}</p>
      <ul class="filas" role="list">
        <li
          v-for="v in lista"
          :key="clave(v)"
          class="fila"
          :class="{ bloqueada: v.motivoBloqueo !== null }"
        >
          <NCheckbox
            :checked="marcadas.has(clave(v))"
            :disabled="v.motivoBloqueo !== null || ocupado('limpiarVersiones')"
            :aria-label="nombre(v)"
            @update:checked="(on: boolean) => alternar(v, on)"
          >
            <span class="nombre">{{ nombre(v) }}</span>
          </NCheckbox>
          <span class="tam">{{ formatearTamano(v.bytes) }}</span>
          <span v-if="v.motivoBloqueo !== null" class="motivo">{{ motivo(v.motivoBloqueo) }}</span>
        </li>
      </ul>

      <template v-if="libres.length > 0">
        <p class="subtitulo">{{ t.destinoTitulo }}</p>
        <NRadioGroup v-model:value="destino" :aria-label="t.destinoTitulo">
          <div class="opciones">
            <NRadio value="papelera">{{ t.papelera }}</NRadio>
            <NRadio value="definitivo">{{ t.definitivo }}</NRadio>
          </div>
        </NRadioGroup>
        <template v-if="destino === 'definitivo'">
          <NAlert type="warning" :bordered="false" class="aviso">
            <template #icon
              ><NIcon><Warning /></NIcon
            ></template>
            {{ t.avisoDefinitivo }}
          </NAlert>
          <NCheckbox v-model:checked="entiendo" class="casilla">{{ t.entiendo }}</NCheckbox>
        </template>
        <p class="texto nota">{{ t.instantanea }}</p>
      </template>
    </template>

    <template #footer>
      <div class="pie">
        <span v-if="elegidas.length > 0" class="resumen">{{
          t.marcadas(elegidas.length, formatearTamano(bytesElegidos))
        }}</span>
        <NButton size="small" :disabled="ocupado('limpiarVersiones')" @click="mostrar = false">
          {{ textos.acciones.cerrar }}
        </NButton>
        <NButton
          size="small"
          type="primary"
          :disabled="!puede"
          :loading="ocupado('limpiarVersiones')"
          @click="confirmar"
        >
          {{ t.confirmar(elegidas.length) }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.texto {
  margin: 0 0 12px;
  line-height: 1.5;
}
.nota {
  opacity: 0.75;
  font-size: 13px;
}
.cargando {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filas {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow: auto;
  display: grid;
  gap: 2px;
}
.fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 12px;
  align-items: center;
  padding: 4px 6px;
  border-radius: 6px;
}
.fila.bloqueada {
  opacity: 0.7;
}
.nombre {
  font-weight: 500;
}
.tam {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
  font-size: 13px;
}
.motivo {
  grid-column: 1 / -1;
  font-size: 12px;
  opacity: 0.8;
  padding-left: 24px;
}
.subtitulo {
  margin: 14px 0 6px;
  font-weight: 600;
}
.opciones {
  display: grid;
  gap: 6px;
}
.aviso {
  margin-top: 10px;
}
.casilla {
  margin-top: 8px;
}
.resultado {
  margin-bottom: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  background: color-mix(in srgb, currentColor 6%, transparent);
  font-size: 13px;
}
.resultado ul {
  margin: 4px 0 0;
  padding-left: 18px;
}
.saltada {
  color: #b45309;
}
.pie {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.resumen {
  margin-right: auto;
  font-size: 13px;
  opacity: 0.8;
}
</style>
