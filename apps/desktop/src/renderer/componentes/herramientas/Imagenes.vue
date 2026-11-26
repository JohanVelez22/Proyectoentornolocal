<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCheckbox,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
  NSlider,
  useMessage,
} from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { pngsAIco, TAMANOS_ICO } from '../../utilidades/ico';
import {
  abrirBitmapVerificado,
  bitmapAPng,
  comprimirBitmap,
  cuadradoAPng,
  porcentajeAhorro,
  type FormatoCompresion,
} from '../../utilidades/imagenCanvas';
import { formatoBytes } from '../../utilidades/metricas';

const t = textos.herramientas.imagenes;
const { ejecutar, ocupado } = useAccion();
const message = useMessage();

type Accion = 'ico' | 'png' | 'comprimir';

interface Origen {
  nombre: string;
  tipo: string;
  ancho: number;
  alto: number;
  bytes: Uint8Array;
}

const origen = ref<Origen | null>(null);
const accion = ref<Accion>('ico');
const tamanos = ref<number[]>([16, 32, 48, 256]);
const formato = ref<FormatoCompresion>('webp');
const calidad = ref(80);
const ladoMax = ref<number | null>(null);
const resultado = ref<{ bytes: Uint8Array; extension: string } | null>(null);
const guardado = ref<string | null>(null);
const error = ref<string | null>(null);
const miniatura = ref<HTMLCanvasElement | null>(null);

const nombreBase = computed(() => (origen.value?.nombre ?? 'imagen').replace(/\.[^.]*$/, ''));
const sugerido = computed(() => {
  const r = resultado.value;
  if (!r) return '';
  const sufijo =
    accion.value === 'ico' ? '' : accion.value === 'png' ? t.sufijoConvertida : t.sufijoComprimida;
  return `${nombreBase.value}${sufijo}.${r.extension}`;
});

function limpiarResultado(): void {
  resultado.value = null;
  guardado.value = null;
  error.value = null;
}

/** Dibuja una vista previa pequeña en un canvas normal (la CSP no admite blob: en las imágenes). */
async function dibujarMiniatura(o: Origen): Promise<void> {
  await nextTick();
  const lienzo = miniatura.value;
  if (!lienzo) return;
  const b = await abrirBitmapVerificado(o.bytes, o.tipo, o);
  try {
    const f = Math.min(1, 160 / Math.max(b.width, b.height));
    lienzo.width = Math.max(1, Math.round(b.width * f));
    lienzo.height = Math.max(1, Math.round(b.height * f));
    lienzo.getContext('2d')?.drawImage(b, 0, 0, lienzo.width, lienzo.height);
  } finally {
    b.close();
  }
}

async function elegir(): Promise<void> {
  const ruta = await ejecutar('elegir', () => api().sistema.elegirArchivo());
  if (!ruta) return;
  const leida = await ejecutar('elegir', () => api().herramientas.leerImagen(ruta));
  if (!leida) return;
  limpiarResultado();
  origen.value = {
    nombre: leida.nombre,
    tipo: leida.tipo,
    ancho: leida.ancho,
    alto: leida.alto,
    bytes: leida.bytes,
  };
  try {
    await dibujarMiniatura(origen.value);
  } catch {
    error.value = t.errorAbrir;
  }
}

/**
 * Una captura de pantalla enviada desde el editor (D35): llega en memoria, nunca por un archivo
 * temporal, y se entrega una sola vez.
 */
async function recogerCaptura(): Promise<void> {
  let pendiente;
  try {
    pendiente = await api().captura.tomarPendiente();
  } catch {
    return;
  }
  if (!pendiente) return;
  limpiarResultado();
  origen.value = {
    nombre: `${t.nombreCaptura}.png`,
    tipo: 'png',
    ancho: pendiente.ancho,
    alto: pendiente.alto,
    bytes: pendiente.bytes,
  };
  try {
    await dibujarMiniatura(origen.value);
  } catch {
    error.value = t.errorAbrir;
  }
}

let bajaCaptura: (() => void) | null = null;
onMounted(() => {
  void recogerCaptura();
  bajaCaptura = api().on('captura:imagen', () => void recogerCaptura());
});

async function procesar(): Promise<void> {
  const o = origen.value;
  if (!o) return;
  limpiarResultado();
  await ejecutar('procesar', async () => {
    let bitmap: ImageBitmap;
    try {
      bitmap = await abrirBitmapVerificado(o.bytes, o.tipo, o);
    } catch {
      error.value = t.errorAbrir;
      return;
    }
    try {
      if (accion.value === 'ico') {
        const lados = [...tamanos.value].sort((a, b) => a - b);
        const pngs = [];
        for (const tamano of lados)
          pngs.push({ tamano, datos: await cuadradoAPng(bitmap, tamano) });
        resultado.value = { bytes: pngsAIco(pngs), extension: 'ico' };
      } else if (accion.value === 'png') {
        resultado.value = { bytes: await bitmapAPng(bitmap, ladoMax.value), extension: 'png' };
      } else {
        resultado.value = {
          bytes: await comprimirBitmap(bitmap, {
            formato: formato.value,
            calidad: calidad.value,
            ladoMax: ladoMax.value,
          }),
          extension: formato.value === 'jpeg' ? 'jpg' : 'webp',
        };
      }
    } catch {
      error.value = t.errorProcesar;
    } finally {
      bitmap.close();
    }
  });
}

/** El destino sale del diálogo "Guardar como"; el núcleo nunca pisa un archivo existente. */
async function guardar(): Promise<void> {
  const r = resultado.value;
  if (!r) return;
  const destino = await ejecutar('guardar', () => api().sistema.guardarArchivo(sugerido.value));
  if (!destino) return;
  const g = await ejecutar('guardar', () => api().herramientas.guardarImagen(destino, r.bytes));
  if (g) {
    guardado.value = g.archivo;
    message.success(t.guardado(g.archivo));
  }
}

const sinMejora = computed(
  () =>
    accion.value === 'comprimir' &&
    resultado.value !== null &&
    origen.value !== null &&
    resultado.value.bytes.length >= origen.value.bytes.length,
);

const puedeProcesar = computed(
  () => origen.value !== null && (accion.value !== 'ico' || tamanos.value.length > 0),
);

onBeforeUnmount(() => {
  bajaCaptura?.();
  origen.value = null;
  resultado.value = null;
});
</script>

<template>
  <div class="herr">
    <p class="herr-tenue">{{ t.ayuda }}</p>
    <div class="herr-fila">
      <NButton secondary :loading="ocupado('elegir')" @click="elegir">{{ t.elegir }}</NButton>
    </div>

    <template v-if="origen">
      <div class="origen">
        <canvas ref="miniatura" class="miniatura" aria-hidden="true"></canvas>
        <dl class="herr-datos">
          <dt>{{ t.original }}</dt>
          <dd>{{ origen.nombre }}</dd>
          <dt>{{ t.dimensiones(origen.ancho, origen.alto) }}</dt>
          <dd>{{ formatoBytes(origen.bytes.length) }}</dd>
        </dl>
      </div>

      <div>
        <div class="herr-etiqueta">{{ t.accion }}</div>
        <NRadioGroup v-model:value="accion" @update:value="limpiarResultado">
          <NRadioButton value="ico">{{ t.aIco }}</NRadioButton>
          <NRadioButton value="png">{{ t.aPng }}</NRadioButton>
          <NRadioButton value="comprimir">{{ t.comprimir }}</NRadioButton>
        </NRadioGroup>
      </div>

      <div v-if="accion === 'ico'">
        <div class="herr-etiqueta">{{ t.tamanos }}</div>
        <div class="herr-fila">
          <NCheckbox
            v-for="n in TAMANOS_ICO"
            :key="n"
            :checked="tamanos.includes(n)"
            @update:checked="
              (v: boolean) => {
                tamanos = v ? [...tamanos, n] : tamanos.filter((x) => x !== n);
                limpiarResultado();
              }
            "
            >{{ n }}</NCheckbox
          >
        </div>
      </div>

      <template v-if="accion === 'comprimir'">
        <div>
          <div class="herr-etiqueta">{{ t.formato }}</div>
          <NRadioGroup v-model:value="formato" @update:value="limpiarResultado">
            <NRadioButton value="webp">WebP</NRadioButton>
            <NRadioButton value="jpeg">JPEG</NRadioButton>
          </NRadioGroup>
        </div>
        <div>
          <div class="herr-etiqueta">{{ t.calidad }}: {{ calidad }}</div>
          <NSlider
            v-model:value="calidad"
            :min="10"
            :max="100"
            :step="1"
            @update:value="limpiarResultado"
          />
        </div>
      </template>

      <div v-if="accion !== 'ico'">
        <div class="herr-etiqueta">{{ t.ladoMax }}</div>
        <NInputNumber
          v-model:value="ladoMax"
          :min="16"
          :max="12000"
          :precision="0"
          clearable
          @update:value="limpiarResultado"
        />
      </div>

      <div class="herr-fila">
        <NButton
          type="primary"
          :disabled="!puedeProcesar"
          :loading="ocupado('procesar')"
          @click="procesar"
        >
          {{ ocupado('procesar') ? t.procesando : t.procesar }}
        </NButton>
      </div>
    </template>

    <p v-if="error" class="herr-error" role="alert">{{ error }}</p>

    <template v-if="resultado && origen">
      <dl class="herr-datos">
        <dt>{{ t.antes }}</dt>
        <dd>{{ formatoBytes(origen.bytes.length) }}</dd>
        <dt>{{ t.despues }}</dt>
        <dd>
          {{ formatoBytes(resultado.bytes.length) }}
          <span v-if="accion !== 'ico'">
            ({{ t.ahorro(porcentajeAhorro(origen.bytes.length, resultado.bytes.length)) }})</span
          >
        </dd>
      </dl>
      <NAlert v-if="sinMejora" type="warning" :show-icon="false">{{ t.sinMejora }}</NAlert>
      <div class="herr-fila">
        <NButton type="primary" :loading="ocupado('guardar')" @click="guardar">{{
          t.guardar
        }}</NButton>
      </div>
      <p v-if="guardado" class="herr-ok">{{ t.guardado(guardado) }}</p>
    </template>
  </div>
</template>

<style scoped>
.origen {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.miniatura {
  max-width: 160px;
  max-height: 160px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  background: repeating-conic-gradient(rgba(128, 128, 128, 0.15) 0% 25%, transparent 0% 50%) 50% /
    16px 16px;
}
</style>
