<script setup lang="ts">
import { NButton, NModal, NTag, useMessage } from 'naive-ui';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue';
import { mensajeDeError } from '../composables/useAccion';
import { textos } from '../i18n';
import { useConfirmacionesMcp } from '../stores/mcp';

/**
 * Diálogo global de confirmación del servidor MCP. Muestra la primera solicitud de la cola; los
 * datos llegan del núcleo ya validados y se pintan SIEMPRE como texto (nunca como HTML).
 */
const t = textos.mcp.confirmacion;
const mcp = useConfirmacionesMcp();
const message = useMessage();
const enviando = ref(false);

onMounted(() => mcp.iniciar());
onBeforeUnmount(() => mcp.detener());

const solicitud = computed(() => mcp.actual);
const visible = computed(() => !!solicitud.value);
const botonRechazar = ref<ComponentPublicInstance | null>(null);

// Cada solicitud nueva pone el foco en "Rechazar" (Enter o Espacio nunca aprueban por descuido).
// Se hace al desbloquearse los botones: un botón deshabilitado no puede recibir el foco.
watch(
  () => [solicitud.value?.id, mcp.bloqueada] as const,
  async ([id, bloqueada]) => {
    if (!id || bloqueada) return;
    await nextTick();
    requestAnimationFrame(() => (botonRechazar.value?.$el as HTMLElement | undefined)?.focus());
  },
);

const ORDEN = ['proyecto', 'motor', 'base', 'archivo', 'sobrescribir', 'nombre', 'pid'];

function texto(v: unknown): string {
  if (typeof v === 'boolean') return v ? t.si : t.no;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
}

/** Campos sueltos (sin los pasos), en un orden estable; los desconocidos van al final. */
const campos = computed(() => {
  const datos = (solicitud.value?.datos ?? {}) as Record<string, unknown>;
  const claves = Object.keys(datos).filter((k) => k !== 'pasos' && datos[k] !== undefined);
  claves.sort((a, b) => {
    const ia = ORDEN.indexOf(a);
    const ib = ORDEN.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  return claves.map((k) => ({ clave: k, etiqueta: t.campos[k] ?? k, valor: texto(datos[k]) }));
});
const pasos = computed(() => {
  const p = (solicitud.value?.datos as { pasos?: unknown } | undefined)?.pasos;
  return Array.isArray(p) ? p.map(texto) : [];
});

async function responder(aprobado: boolean): Promise<void> {
  // Recién cambiada la solicitud, los botones no responden (ver ESPERA_CONFIRMACION_MS).
  if (!solicitud.value || enviando.value || mcp.bloqueada) return;
  enviando.value = true;
  try {
    const ok = await mcp.responder(aprobado);
    if (ok) message.success(aprobado ? t.aprobada : t.rechazada);
    else message.warning(t.vencida);
  } catch (e) {
    message.error(t.falloRespuesta(mensajeDeError(e)));
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    class="confirmacion-mcp"
    :title="t.titulo"
    :mask-closable="false"
    :close-on-esc="false"
    :closable="false"
    :auto-focus="false"
    role="alertdialog"
    :style="{ width: 'min(560px, calc(100vw - 32px))' }"
  >
    <template #header-extra>
      <div class="etiquetas">
        <NTag v-if="mcp.total > 1" size="small" :bordered="false">
          {{ t.pendientes(1, mcp.total) }}
        </NTag>
        <NTag v-if="mcp.descartadas" size="small" type="warning" :bordered="false">
          {{ t.descartadas(mcp.descartadas) }}
        </NTag>
      </div>
    </template>
    <template v-if="solicitud">
      <p class="resumen">{{ solicitud.resumen }}</p>
      <dl class="datos">
        <dt>{{ t.herramienta }}</dt>
        <dd class="mono">{{ solicitud.herramienta }}</dd>
        <template v-for="c in campos" :key="c.clave">
          <dt>{{ c.etiqueta }}</dt>
          <dd>{{ c.valor }}</dd>
        </template>
      </dl>
      <template v-if="pasos.length">
        <p class="subtitulo">{{ t.campos.pasos }} ({{ pasos.length }})</p>
        <ol class="pasos" tabindex="0" :aria-label="t.campos.pasos">
          <li v-for="(p, i) in pasos" :key="i">{{ p }}</li>
        </ol>
      </template>
    </template>
    <template #footer>
      <div class="pie">
        <NButton
          ref="botonRechazar"
          :disabled="enviando || mcp.bloqueada"
          @click="responder(false)"
        >
          {{ t.rechazar }}
        </NButton>
        <NButton
          type="primary"
          :disabled="mcp.bloqueada"
          :loading="enviando"
          @click="responder(true)"
        >
          {{ t.aprobar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.resumen {
  margin: 0 0 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
.datos {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 14px;
  margin: 0 0 12px;
  font-size: 13px;
}
.datos dt {
  opacity: 0.65;
}
.datos dd {
  margin: 0;
  word-break: break-word;
}
.mono {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.subtitulo {
  margin: 0 0 6px;
  font-size: 13px;
  opacity: 0.65;
}
.pasos {
  margin: 0;
  padding: 8px 12px 8px 34px;
  max-height: 240px;
  overflow: auto;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  background: rgba(128, 128, 128, 0.06);
  font-family: var(--fuente-mono);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}
.etiquetas {
  display: flex;
  gap: 6px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
