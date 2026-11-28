<script setup lang="ts">
import { Copy, Refresh } from '@vicons/ionicons5';
import { NButton, NIcon, NSpin, NTag } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { EventoDisco } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { formatearFecha, textos } from '../../i18n';
import { rellenar } from '../../utilidades/equipo';
import {
  DIAS_EVENTOS,
  TOPE_EVENTOS,
  explicacionEvento,
  textoCopiaEventos,
  textoDiscoEvento,
} from '../../utilidades/saludDiscos';

/** «Eventos del disco» (D57): los últimos 30 días del registro System; solo lectura. */
const t = textos.herramientas.entorno.eventosDisco;
const { ejecutar, ocupado } = useAccion();

const eventos = ref<EventoDisco[] | null>(null);
const TONO = { info: 'info', aviso: 'warning', critico: 'error' } as const;

const filas = computed(() =>
  (eventos.value ?? []).map((e) => ({
    e,
    fecha: formatearFecha(e.fecha, { dateStyle: 'short', timeStyle: 'short' }),
    disco: textoDiscoEvento(e, t),
    texto: explicacionEvento(e, t),
  })),
);

async function cargar(): Promise<void> {
  const r = await ejecutar('eventos', () => api().herramientas.eventosDisco());
  if (r) eventos.value = r;
}

/** Copia un texto plano sin rutas de usuario completas ni identificadores (ya saneado). */
function copiar(): void {
  if (!eventos.value) return;
  const texto = textoCopiaEventos(eventos.value, t, (iso) =>
    formatearFecha(iso, { dateStyle: 'short', timeStyle: 'short' }),
  );
  void ejecutar('copiarEventos', () => api().sistema.copiar(texto), { exito: t.copiado });
}

onMounted(() => void cargar());
</script>

<template>
  <div data-testid="eventos-disco">
    <h3 class="titulo">{{ t.titulo }}</h3>
    <p class="herr-tenue intro">{{ rellenar(t.intro, { dias: DIAS_EVENTOS }) }}</p>
    <div class="herr-fila acciones">
      <NButton secondary size="small" :loading="ocupado('eventos')" @click="cargar">
        <template #icon
          ><NIcon><Refresh /></NIcon
        ></template>
        {{ t.actualizar }}
      </NButton>
      <NButton
        secondary
        size="small"
        :disabled="!eventos || eventos.length === 0"
        data-testid="eventos-copiar"
        @click="copiar"
      >
        <template #icon
          ><NIcon><Copy /></NIcon
        ></template>
        {{ t.copiar }}
      </NButton>
    </div>

    <NSpin v-if="!eventos && ocupado('eventos')" :size="18" />
    <p v-else-if="eventos && eventos.length === 0" class="herr-tenue">
      {{ rellenar(t.vacio, { dias: DIAS_EVENTOS }) }}
    </p>
    <ul v-else-if="eventos" class="lista" data-testid="eventos-lista">
      <li v-for="(f, i) in filas" :key="i" class="evento">
        <div class="cabecera">
          <time :datetime="f.e.fecha">{{ f.fecha }}</time>
          <span class="disco">{{ f.disco }}</span>
          <NTag size="small" :type="TONO[f.e.gravedad]" :bordered="false">
            {{ t.gravedad[f.e.gravedad] }}
          </NTag>
        </div>
        <p class="texto">{{ f.texto }}</p>
      </li>
    </ul>
    <p v-if="eventos && eventos.length >= TOPE_EVENTOS" class="herr-tenue">
      {{ rellenar(t.tope, { n: TOPE_EVENTOS }) }}
    </p>
  </div>
</template>

<style scoped>
.titulo {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}
.intro {
  margin-bottom: 8px;
}
.acciones {
  margin-bottom: 8px;
}
.lista {
  list-style: none;
  margin: 8px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 340px;
  overflow: auto;
}
.evento {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  padding: 4px 0 6px;
}
.cabecera {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12.5px;
}
.disco {
  opacity: 0.8;
}
.texto {
  margin: 2px 0 0;
  font-size: 13px;
}
</style>
