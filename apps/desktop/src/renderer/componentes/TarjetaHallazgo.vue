<script setup lang="ts">
import { Copy, ShieldCheckmark } from '@vicons/ionicons5';
import { NAlert, NButton, NIcon, NSpace, NTag } from 'naive-ui';
import { computed } from 'vue';
import type { Hallazgo } from '../../shared/api';
import { textos } from '../i18n';
import type { EstadoReparacion } from '../stores/doctor';
import { textoReparacion } from '../utilidades/doctor';
import { traducirError } from '../utilidades/errores';

/**
 * Un hallazgo del Doctor: qué pasa, lo que se vio (evidencia: solo en esta pantalla) y su
 * reparación. El botón no repara: pide a la pantalla el diálogo que muestra qué se hará.
 */
const props = defineProps<{ hallazgo: Hallazgo; reparacion?: EstadoReparacion }>();
const emit = defineEmits<{
  pedir: [alternativa: boolean];
  copiar: [comando: string];
}>();

const t = textos.doctor;
const TONO = { error: 'error', aviso: 'warning', info: 'info' } as const;

const titulo = computed(() =>
  traducirError({ codigo: props.hallazgo.codigo, datos: props.hallazgo.datos }),
);
const rep = computed(() => props.hallazgo.reparacion);
/** `doctor.reparaciones.<clave>` del núcleo → texto de lo que hará la reparación. */
const queHara = computed(() => textoReparacion(rep.value?.codigo));
const aplicando = computed(() => props.reparacion?.estado === 'aplicando');
const resultado = computed(() => {
  const r = props.reparacion;
  if (!r || r.estado === 'aplicando') return null;
  const codigo = r.estado === 'hecha' ? (r.aviso ?? r.codigo) : r.codigo;
  return {
    tipo: r.estado === 'hecha' ? ('success' as const) : ('error' as const),
    texto: codigo
      ? traducirError({ codigo })
      : r.estado === 'hecha'
        ? t.estados.hecha
        : t.estados.fallida,
  };
});
</script>

<template>
  <article class="hallazgo" :class="hallazgo.gravedad">
    <header class="cabeza">
      <NTag size="small" :type="TONO[hallazgo.gravedad]" :bordered="false">
        {{ t.revisiones[hallazgo.revision] }}
      </NTag>
      <strong>{{ titulo }}</strong>
    </header>
    <p class="evidencia">
      <span class="etiqueta">{{ t.evidencia }}:</span> <code>{{ hallazgo.evidencia }}</code>
    </p>
    <div v-if="rep" class="reparacion">
      <p>{{ queHara }}</p>
      <template v-if="rep.comandoManual">
        <p class="etiqueta">{{ t.comandoManual }}</p>
        <pre class="comando">{{ rep.comandoManual }}</pre>
      </template>
      <NSpace size="small" align="center">
        <NButton
          v-if="!rep.soloInforma"
          type="primary"
          size="small"
          :loading="aplicando"
          @click="emit('pedir', false)"
        >
          <template v-if="rep.requiereAdmin" #icon
            ><NIcon><ShieldCheckmark /></NIcon
          ></template>
          {{ t.reparar }}
        </NButton>
        <NButton
          v-if="hallazgo.alternativa && !hallazgo.alternativa.soloInforma"
          secondary
          size="small"
          :disabled="aplicando"
          @click="emit('pedir', true)"
        >
          {{ t.alternativa }}
        </NButton>
        <NButton
          v-if="rep.comandoManual"
          quaternary
          size="small"
          @click="emit('copiar', rep.comandoManual)"
        >
          <template #icon
            ><NIcon><Copy /></NIcon
          ></template>
          {{ t.copiar }}
        </NButton>
        <span v-if="rep.soloInforma" class="nota">{{ t.soloInforma }}</span>
        <span v-else-if="rep.requiereAdmin" class="nota">{{ t.requiereAdmin }}</span>
      </NSpace>
    </div>
    <NAlert v-if="resultado" :type="resultado.tipo" :show-icon="false" class="resultado">
      {{ resultado.texto }}
    </NAlert>
  </article>
</template>

<style scoped>
.hallazgo {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-left-width: 4px;
}
.hallazgo.error {
  border-left-color: #dc2626;
}
.hallazgo.aviso {
  border-left-color: #d97706;
}
.hallazgo.info {
  border-left-color: #2563eb;
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.evidencia {
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.8;
  overflow-wrap: anywhere;
}
.etiqueta {
  opacity: 0.7;
  font-size: 12px;
}
.reparacion p {
  margin: 10px 0 8px;
  line-height: 1.5;
}
.comando {
  margin: 0 0 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.nota {
  font-size: 12px;
  opacity: 0.65;
}
.resultado {
  margin-top: 10px;
}
</style>
