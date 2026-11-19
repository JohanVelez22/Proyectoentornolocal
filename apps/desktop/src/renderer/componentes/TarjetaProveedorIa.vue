<script setup lang="ts">
import {
  ChatbubbleEllipses,
  CloudDone,
  CreateOutline,
  DocumentText,
  Pulse,
  TrashOutline,
} from '@vicons/ionicons5';
import { NButton, NIcon, NSelect, NSpin, NTag, NTooltip, type SelectOption } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { ProveedorIaPublico } from '../../shared/api';
import { textos } from '../i18n';
import type { EstadoMensajeIa, EstadoPruebaIa } from '../stores/ia';
import { claveEnmascarada, TIPOS_CON_CLAVE, urlEfectiva } from '../utilidades/ia';

/** Tarjeta de un proveedor en la nube: estado de la clave, pruebas y acciones. */
const props = defineProps<{
  proveedor: ProveedorIaPublico;
  prueba?: EstadoPruebaIa | undefined;
  mensaje?: EstadoMensajeIa | undefined;
  /** Modelos que listó la última prueba correcta. */
  modelos: string[];
}>();
const emit = defineEmits<{
  probar: [];
  /** La vista muestra el aviso de costo y, solo si se acepta, envía el mensaje. */
  probarMensaje: [modelo: string];
  usar: [];
  editar: [];
  borrar: [];
}>();

const t = textos.ia.tarjeta;
const clave = computed(() => claveEnmascarada(props.proveedor));
const necesitaClave = computed(
  () => TIPOS_CON_CLAVE.has(props.proveedor.tipo) && !props.proveedor.clave.configurada,
);
const url = computed(() => urlEfectiva(props.proveedor));

const modelo = ref<string | null>(props.proveedor.modelo);
const opcionesModelo = computed<SelectOption[]>(() => {
  const lista = new Set(props.modelos);
  if (props.proveedor.modelo) lista.add(props.proveedor.modelo);
  return [...lista].sort().map((m) => ({ label: m, value: m }));
});
watch(
  () => [props.proveedor.modelo, props.modelos] as const,
  ([porDefecto, lista]) => {
    if (modelo.value && (modelo.value === porDefecto || lista.includes(modelo.value))) return;
    modelo.value = porDefecto ?? lista[0] ?? null;
  },
);

const verModelos = ref(false);
const probando = computed(() => props.prueba?.estado === 'probando');
const enviando = computed(() => props.mensaje?.estado === 'enviando');

function pedirMensaje(): void {
  if (modelo.value && !enviando.value) emit('probarMensaje', modelo.value);
}
</script>

<template>
  <article class="tarjeta" :aria-busy="probando || enviando">
    <header class="cabeza">
      <span class="icono"
        ><NIcon :size="18"><CloudDone /></NIcon
      ></span>
      <div class="titulo">
        <strong>{{ proveedor.nombre }}</strong>
        <span class="tenue">{{ textos.ia.tipos[proveedor.tipo] ?? proveedor.tipo }}</span>
      </div>
      <NTag v-if="clave" size="small" :bordered="false" type="success" class="mono">
        {{ clave }}
      </NTag>
      <NTag v-else size="small" :bordered="false" :type="necesitaClave ? 'warning' : 'default'">
        {{ t.sinClave }}
      </NTag>
    </header>

    <dl class="datos">
      <div>
        <dt>{{ t.url }}</dt>
        <dd class="mono">{{ url ?? '—' }}</dd>
      </div>
      <div>
        <dt>{{ t.modeloPorDefecto }}</dt>
        <dd class="mono">{{ proveedor.modelo ?? t.ninguno }}</dd>
      </div>
    </dl>

    <!-- Resultado de la prueba de conexión -->
    <div v-if="prueba" class="resultado" aria-live="polite">
      <NSpin v-if="prueba.estado === 'probando'" :size="14" :description="t.probando" />
      <template v-else-if="prueba.estado === 'ok'">
        <span class="ok">{{ t.conectado(prueba.latenciaMs, prueba.modelos.length) }}</span>
        <NButton
          v-if="prueba.modelos.length"
          text
          size="tiny"
          :aria-expanded="verModelos"
          @click="verModelos = !verModelos"
        >
          {{ t.verModelos(prueba.modelos.length) }}
        </NButton>
        <ul v-if="verModelos" class="modelos">
          <li v-for="m in prueba.modelos" :key="m.id" class="mono">{{ m.id }}</li>
        </ul>
      </template>
      <span v-else class="error"
        >{{ t.fallo
        }}<template v-if="prueba.latenciaMs !== undefined"> ({{ prueba.latenciaMs }} ms)</template>:
        {{ prueba.error }}</span
      >
    </div>

    <!-- Mensaje de prueba (gasta tokens: siempre con el aviso de costo) -->
    <div class="mensaje">
      <NSelect
        v-model:value="modelo"
        :options="opcionesModelo"
        :placeholder="t.elegirModelo"
        :aria-label="t.elegirModelo"
        size="small"
        filterable
        tag
        class="mensaje-modelo"
      />
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            secondary
            :disabled="!modelo || necesitaClave"
            :loading="enviando"
            @click="pedirMensaje"
          >
            <template #icon
              ><NIcon><ChatbubbleEllipses /></NIcon
            ></template>
            {{ t.probarMensaje }}
          </NButton>
        </template>
        {{ modelo ? t.probarMensajeAyuda : t.sinModelo }}
      </NTooltip>
    </div>
    <div v-if="mensaje && mensaje.estado !== 'enviando'" class="resultado" aria-live="polite">
      <template v-if="mensaje.estado === 'ok'">
        <span class="tenue"
          >{{ t.respuesta(mensaje.latenciaMs)
          }}<template v-if="mensaje.tokens">
            · {{ t.tokens(mensaje.tokens.entrada, mensaje.tokens.salida) }}</template
          ></span
        >
        <pre class="respuesta">{{ mensaje.texto || '—' }}</pre>
      </template>
      <span v-else class="error">{{ mensaje.error }}</span>
    </div>

    <footer class="acciones" role="group" :aria-label="t.acciones(proveedor.nombre)">
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            type="primary"
            secondary
            :loading="probando"
            :disabled="necesitaClave"
            @click="emit('probar')"
          >
            <template #icon
              ><NIcon><Pulse /></NIcon
            ></template>
            {{ t.probarConexion }}
          </NButton>
        </template>
        {{ t.probarConexionAyuda }}
      </NTooltip>
      <NButton size="small" secondary :disabled="necesitaClave" @click="emit('usar')">
        <template #icon
          ><NIcon><DocumentText /></NIcon
        ></template>
        {{ t.usar }}
      </NButton>
      <span class="separador" />
      <NButton size="small" quaternary @click="emit('editar')">
        <template #icon
          ><NIcon><CreateOutline /></NIcon
        ></template>
        {{ t.editar }}
      </NButton>
      <NButton size="small" quaternary type="error" @click="emit('borrar')">
        <template #icon
          ><NIcon><TrashOutline /></NIcon
        ></template>
        {{ t.borrar }}
      </NButton>
    </footer>
  </article>
</template>

<style scoped>
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.03);
  min-width: 0;
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icono {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(128, 128, 128, 0.1);
  flex: none;
}
.titulo {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.titulo strong {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tenue {
  font-size: 12px;
  opacity: 0.6;
}
.mono {
  font-family: var(--fuente-mono);
}
.datos {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px 14px;
  margin: 0;
}
.datos dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.datos dd {
  margin: 2px 0 0;
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.resultado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  font-size: 12.5px;
}
.ok {
  color: #16a34a;
}
.error {
  color: #dc2626;
  white-space: pre-wrap;
}
.modelos {
  flex-basis: 100%;
  max-height: 160px;
  overflow: auto;
  margin: 0;
  padding: 6px 10px;
  list-style: none;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
  font-size: 12px;
}
.mensaje {
  display: flex;
  gap: 8px;
}
.mensaje-modelo {
  flex: 1;
  min-width: 0;
}
.respuesta {
  flex-basis: 100%;
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
}
.acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.separador {
  flex: 1;
}
</style>
