<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCheckbox,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSwitch,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { PropuestaTarea, TareaSitio, VistaTarea } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { localeIntl, textos } from '../i18n';
import { mensajeDeError } from '../utilidades/errores';
import {
  analizarHora,
  comandoATexto,
  comandoSeRepresenta,
  cronDePreset,
  presetDeCron,
  textoAComando,
  textoHora,
  TIPOS_PRESET,
  type ModoTarea,
  type PresetCron,
  type TipoPreset,
} from '../utilidades/tareas';
import Desplegable from './Desplegable.vue';

/**
 * Crear o editar una tarea, revisar una de wolfcore.yml para adoptarla, o confirmar una tarea que
 * llegó sin confirmar. Guardar, adoptar o confirmar es lo que autoriza ese comando exacto: el
 * diálogo lo muestra argumento por argumento (se ejecuta sin shell) antes de aceptar. En los modos
 * `adoptar` y `confirmar` el comando no se puede cambiar aquí.
 */
const props = defineProps<{
  sitioId: string;
  modo: ModoTarea;
  tarea?: VistaTarea | null;
  propuesta?: PropuestaTarea | null;
}>();
const emit = defineEmits<{ guardado: [] }>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.tareas.dialogo;
const { ejecutar, ocupado } = useAccion();

const nombre = ref('');
const tipoPreset = ref<TipoPreset>('diaria');
const cadaMinutos = ref<5 | 10 | 15 | 30>(15);
const horaTexto = ref('03:00');
const expresion = ref('');
const comandoTexto = ref('');
const tiempoMin = ref(5);
const activa = ref(true);
/** Casilla de "he revisado este comando" de los modos que aceptan un comando que no se escribió aquí. */
const revisado = ref(false);

const soloLectura = computed(() => props.modo === 'adoptar' || props.modo === 'confirmar');
/** Un comando con argumentos que no se pueden escribir como texto se muestra y se conserva tal cual (sin editar). */
const comandoFijo = ref(false);

/** Lo que el usuario ve y acepta: la tarea o propuesta con su comando y su huella. */
const origen = computed<{
  nombre: string;
  cron: string;
  comando: string[];
  tiempoMaxS: number;
  activa: boolean;
  huella: string | null;
} | null>(() => {
  if (props.propuesta) {
    const p = props.propuesta;
    return { ...p, activa: false, huella: p.huella };
  }
  const v = props.tarea;
  if (!v) return null;
  const x: TareaSitio = v.tarea;
  return {
    nombre: x.nombre,
    cron: x.cron,
    comando: x.comando,
    tiempoMaxS: x.tiempoMaxS,
    activa: x.activa,
    huella: v.huella,
  };
});

watch(mostrar, (v) => {
  if (!v) return;
  const o = origen.value;
  nombre.value = o?.nombre ?? '';
  expresion.value = o?.cron ?? '';
  const p = presetDeCron(o?.cron ?? '0 3 * * *');
  tipoPreset.value = p.tipo;
  if (p.tipo === 'cadaN') cadaMinutos.value = p.minutos;
  if (p.tipo === 'diaria' || p.tipo === 'laborables') {
    horaTexto.value = textoHora(p.hora, p.minuto);
  } else {
    horaTexto.value = '03:00';
  }
  if (p.tipo === 'personalizada') expresion.value = p.expr;
  comandoFijo.value = o ? !comandoSeRepresenta(o.comando) : false;
  comandoTexto.value = o ? comandoATexto(o.comando) : '';
  tiempoMin.value = Math.max(1, Math.round((o?.tiempoMaxS ?? 300) / 60));
  activa.value = props.modo === 'nueva' ? true : (o?.activa ?? true);
  revisado.value = false;
  proximas.value = [];
  errorCron.value = null;
  void previsualizar();
});

const hora = computed(() => analizarHora(horaTexto.value));
const necesitaHora = computed(
  () => tipoPreset.value === 'diaria' || tipoPreset.value === 'laborables',
);

const cron = computed<string>(() => {
  const h = hora.value;
  const p: PresetCron =
    tipoPreset.value === 'cadaMinuto'
      ? { tipo: 'cadaMinuto' }
      : tipoPreset.value === 'cadaN'
        ? { tipo: 'cadaN', minutos: cadaMinutos.value }
        : tipoPreset.value === 'cadaHora'
          ? { tipo: 'cadaHora' }
          : tipoPreset.value === 'diaria'
            ? { tipo: 'diaria', hora: h?.hora ?? 0, minuto: h?.minuto ?? 0 }
            : tipoPreset.value === 'laborables'
              ? { tipo: 'laborables', hora: h?.hora ?? 0, minuto: h?.minuto ?? 0 }
              : { tipo: 'personalizada', expr: expresion.value };
  return cronDePreset(p);
});

const opcionesPreset = computed(() => TIPOS_PRESET.map((p) => ({ value: p, label: t.preset[p] })));
const opcionesCadaN = computed(() =>
  ([5, 10, 15, 30] as const).map((n) => ({ value: n, label: t.cadaNOpcion(n) })),
);

/* ───────────── Vista previa del horario ───────────── */

const proximas = ref<string[]>([]);
const errorCron = ref<string | null>(null);
let pedido = 0;

async function previsualizar(): Promise<void> {
  const mio = ++pedido;
  if (necesitaHora.value && !hora.value) {
    proximas.value = [];
    errorCron.value = null;
    return;
  }
  try {
    const r = await api().tareas.proximas(cron.value);
    if (mio !== pedido) return;
    proximas.value = r;
    errorCron.value = null;
  } catch (e) {
    if (mio !== pedido) return;
    proximas.value = [];
    errorCron.value = mensajeDeError(e);
  }
}
watch([cron, mostrar], () => {
  if (mostrar.value) void previsualizar();
});

const formatoFecha = (iso: string): string =>
  new Date(iso).toLocaleString(localeIntl.value, { dateStyle: 'medium', timeStyle: 'short' });

/* ───────────── Comando ───────────── */

const argumentos = computed(() =>
  comandoFijo.value && origen.value ? origen.value.comando : textoAComando(comandoTexto.value),
);
const comillasSinCerrar = computed(
  () => comandoTexto.value.trim() !== '' && argumentos.value === null,
);

const valido = computed(() => {
  if (nombre.value.trim() === '') return false;
  if (necesitaHora.value && !hora.value) return false;
  if (errorCron.value !== null) return false;
  if (soloLectura.value) return revisado.value;
  return (argumentos.value?.length ?? 0) > 0 && cron.value !== '';
});

const titulo = computed(() =>
  props.modo === 'nueva'
    ? t.tituloNueva
    : props.modo === 'editar'
      ? t.tituloEditar
      : props.modo === 'adoptar'
        ? t.tituloAdoptar
        : t.tituloConfirmar,
);
const textoBoton = computed(() =>
  props.modo === 'adoptar' ? t.adoptar : props.modo === 'confirmar' ? t.confirmar : t.guardar,
);

async function aceptar(): Promise<void> {
  if (!valido.value || ocupado('guardar')) return;
  const sitioId = props.sitioId;
  let ok = false;
  await ejecutar(
    'guardar',
    async () => {
      if (props.modo === 'adoptar' && props.propuesta) {
        await api().tareas.adoptar(
          sitioId,
          props.propuesta.id,
          props.propuesta.huella,
          activa.value,
        );
      } else if (props.modo === 'confirmar' && props.tarea) {
        await api().tareas.confirmar(sitioId, props.tarea.tarea.id, props.tarea.huella);
      } else {
        await api().tareas.guardar(sitioId, {
          ...(props.modo === 'editar' && props.tarea ? { id: props.tarea.tarea.id } : {}),
          nombre: nombre.value.trim(),
          cron: cron.value,
          comando: argumentos.value ?? [],
          activa: activa.value,
          tiempoMaxS: Math.min(3600, Math.max(5, Math.round(tiempoMin.value * 60))),
        });
      }
      ok = true;
    },
    {
      exito:
        props.modo === 'adoptar'
          ? t.adoptada
          : props.modo === 'confirmar'
            ? t.confirmada
            : t.guardada,
    },
  );
  if (ok) {
    mostrar.value = false;
    emit('guardado');
  }
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="titulo"
    size="small"
    :bordered="false"
    :style="{ width: '600px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="!ocupado('guardar')"
    :closable="!ocupado('guardar')"
  >
    <NForm autocomplete="off" @submit.prevent="aceptar">
      <NFormItem :label="t.nombre">
        <NInput
          v-model:value="nombre"
          :placeholder="t.nombrePlaceholder"
          maxlength="80"
          :disabled="soloLectura || ocupado('guardar')"
        />
      </NFormItem>

      <NFormItem :label="t.horario">
        <div class="horario">
          <Desplegable
            v-model:value="tipoPreset"
            :options="opcionesPreset"
            :disabled="soloLectura || ocupado('guardar')"
            :aria-label="t.horario"
            class="preset"
          />
          <Desplegable
            v-if="tipoPreset === 'cadaN'"
            v-model:value="cadaMinutos"
            :options="opcionesCadaN"
            :disabled="soloLectura || ocupado('guardar')"
            class="cada"
          />
          <NInput
            v-if="necesitaHora"
            v-model:value="horaTexto"
            :placeholder="t.horaPlaceholder"
            maxlength="5"
            :status="hora ? undefined : 'error'"
            :disabled="soloLectura || ocupado('guardar')"
            :aria-label="t.hora"
            class="hora"
          />
          <NInput
            v-if="tipoPreset === 'personalizada'"
            v-model:value="expresion"
            placeholder="*/15 9-17 * * 1-5"
            maxlength="100"
            :status="errorCron ? 'error' : undefined"
            :disabled="soloLectura || ocupado('guardar')"
            :aria-label="t.expresion"
            class="expresion"
          />
        </div>
      </NFormItem>
      <p class="ayuda">
        {{ t.cronEquivale }} <code>{{ cron }}</code>
        <template v-if="tipoPreset === 'personalizada'"> · {{ t.expresionAyuda }}</template>
      </p>
      <p v-if="necesitaHora && !hora" class="error" role="alert">{{ t.horaInvalida }}</p>
      <p v-else-if="errorCron" class="error" role="alert">{{ errorCron }}</p>
      <p v-else-if="proximas.length" class="ayuda">
        {{ t.proximas }} {{ proximas.map(formatoFecha).join(' · ') }}
      </p>

      <NFormItem :label="t.comando" class="comando">
        <NInput
          v-model:value="comandoTexto"
          :placeholder="t.comandoPlaceholder"
          maxlength="2000"
          :status="comillasSinCerrar ? 'error' : undefined"
          :disabled="soloLectura || comandoFijo || ocupado('guardar')"
          :aria-label="t.comando"
          class="mono"
        />
      </NFormItem>
      <p class="ayuda">{{ t.comandoAyuda }}</p>
      <p v-if="comandoFijo" class="ayuda">{{ t.comandoFijo }}</p>
      <p v-if="comillasSinCerrar" class="error" role="alert">{{ t.comillasSinCerrar }}</p>
      <div v-else-if="argumentos && argumentos.length" class="argumentos">
        <span class="etiqueta">{{ t.argumentos }}</span>
        <code v-for="(a, i) in argumentos" :key="i" class="arg">{{ a }}</code>
      </div>

      <NFormItem v-if="!soloLectura" :label="t.tiempo" class="tiempo">
        <NInputNumber
          v-model:value="tiempoMin"
          :min="1"
          :max="60"
          :step="1"
          :precision="0"
          :disabled="ocupado('guardar')"
          :aria-label="t.tiempo"
          class="numero"
        />
        <span class="unidad">{{ t.minutos }}</span>
      </NFormItem>
      <p v-if="!soloLectura" class="ayuda">{{ t.tiempoAyuda }}</p>

      <div v-if="props.modo !== 'confirmar'" class="activa">
        <NSwitch v-model:value="activa" size="small" :disabled="ocupado('guardar')" />
        <span>{{ t.activa }}</span>
      </div>

      <NAlert type="warning" :show-icon="false" class="advertencia">{{ t.advertencia }}</NAlert>
      <NAlert type="info" :show-icon="false" class="advertencia">{{
        textos.tareas.repoEjecuta
      }}</NAlert>
      <NCheckbox v-if="soloLectura" v-model:checked="revisado" class="revisado">
        {{ t.revise }}
      </NCheckbox>

      <div class="botones">
        <NButton quaternary :disabled="ocupado('guardar')" @click="mostrar = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton
          type="primary"
          attr-type="submit"
          :disabled="!valido"
          :loading="ocupado('guardar')"
        >
          {{ textoBoton }}
        </NButton>
      </div>
    </NForm>
  </NModal>
</template>

<style scoped>
.horario {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
.preset {
  flex: 1 1 200px;
  min-width: 160px;
}
.cada {
  flex: 0 0 160px;
}
.hora {
  flex: 0 0 90px;
}
.expresion {
  flex: 1 1 100%;
  font-family: var(--fuente-mono, ui-monospace, monospace);
}
.ayuda,
.error {
  margin: 2px 0 10px;
  font-size: 12.5px;
  opacity: 0.75;
}
.error {
  color: var(--texto-error, #d03050);
  opacity: 1;
}
.mono :deep(input) {
  font-family: var(--fuente-mono, ui-monospace, monospace);
}
.argumentos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  margin: 0 0 10px;
  font-size: 12.5px;
}
.etiqueta {
  opacity: 0.76;
}
.arg {
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.16);
}
.tiempo :deep(.n-form-item-blank) {
  gap: 8px;
}
.numero {
  width: 110px;
}
.unidad {
  opacity: 0.75;
}
.activa {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 12px;
}
.advertencia {
  margin: 4px 0 10px;
}
.revisado {
  margin-bottom: 4px;
}
.botones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
