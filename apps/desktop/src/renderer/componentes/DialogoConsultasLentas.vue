<script setup lang="ts">
import { Copy, Eye, EyeOff, Refresh, Timer, Warning } from '@vicons/ionicons5';
import { NButton, NIcon, NInputNumber, NModal, NSkeleton, NTooltip, useMessage } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type {
  ConsultasLentasLeidas,
  EstadoConsultasLentas,
  MotorSql,
  ObjetivoSqlIpc,
} from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { localeIntl, textos } from '../i18n';
import EstadoVacio from './EstadoVacio.vue';

/**
 * Consultas lentas de una instancia de MySQL, MariaDB o PostgreSQL (D45b). El SQL llega con los
 * valores cambiados por «?»: «Ver literal» pide el SQL tal cual al núcleo, que lo rechaza si alguna base
 * del servidor tiene datos reales; en ese caso el SQL con anomalías llega como null («SQL oculto»). Activar o desactivar es un cambio de todo el servidor y pide confirmación.
 */
const props = defineProps<{
  motor: MotorSql;
  objetivo: ObjetivoSqlIpc;
  nombre: string;
}>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.consultasLentas;
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const estado = ref<EstadoConsultasLentas | null>(null);
const leidas = ref<ConsultasLentasLeidas | null>(null);
const segundos = ref<number>(1);
const confirmando = ref<'activar' | 'desactivar' | null>(null);
/** SQL tal cual, solo de las entradas cuyo «Ver literal» se pidió (se borra al cerrar). */
const literales = ref<Record<string, string>>({});

const nf = computed(
  () =>
    new Intl.NumberFormat(localeIntl.value, { maximumFractionDigits: 2, minimumFractionDigits: 0 }),
);
const duracion = (ms: number): string =>
  ms >= 1000 ? `${nf.value.format(ms / 1000)} s` : `${nf.value.format(ms)} ms`;
const fecha = (f: string | null): string =>
  f
    ? f
        .replace('T', ' ')
        .replace(/\.\d+Z?$/, '')
        .replace(/Z$/, '')
    : '—';

async function cargar(): Promise<void> {
  const r = await ejecutar('cargar', async () => {
    const e = await api().bd.lentasEstado(props.objetivo);
    const l = await api().bd.lentasLeer(props.objetivo);
    return { e, l };
  });
  if (!r) return;
  estado.value = r.e;
  leidas.value = r.l;
  if (r.e.activo && r.e.segundos !== null) segundos.value = r.e.segundos;
}

watch(mostrar, (v) => {
  if (v) {
    literales.value = {};
    estado.value = null;
    leidas.value = null;
    confirmando.value = null;
    void cargar();
  } else {
    // Los valores solo viven mientras el diálogo está abierto.
    literales.value = {};
    leidas.value = null;
  }
});

function pedirCambio(que: 'activar' | 'desactivar'): void {
  confirmando.value = que;
}

async function confirmarCambio(): Promise<void> {
  const que = confirmando.value;
  if (!que) return;
  const r = await ejecutar(
    'cambiar',
    () =>
      api().bd.lentasCambiar(props.objetivo, {
        activo: que === 'activar',
        ...(que === 'activar' ? { segundos: segundos.value } : {}),
        confirmado: true,
      }),
    { exito: que === 'activar' ? t.activado : t.desactivado },
  );
  confirmando.value = null;
  if (r) {
    estado.value = r;
    void cargar();
  }
}

async function verLiteral(id: string): Promise<void> {
  const sql = await ejecutar(`literal:${id}`, () => api().bd.lentasLiteral(props.objetivo, id));
  if (sql !== undefined) literales.value = { ...literales.value, [id]: sql };
}
function ocultarLiteral(id: string): void {
  const resto = { ...literales.value };
  delete resto[id];
  literales.value = resto;
}

function copiar(id: string, normalizado: string | null): void {
  const texto = literales.value[id] ?? normalizado;
  if (texto === null) return;
  void ejecutar('copiar', async () => {
    await api().sistema.copiar(texto);
    message.success(t.copiado);
  });
}

const gestionada = computed(() => estado.value?.gestionada === true);
const hayEntradas = computed(() => (leidas.value?.entradas.length ?? 0) > 0);
const MAX = 500;
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo(nombre)"
    size="small"
    :bordered="false"
    :style="{ width: '1000px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <p class="intro">{{ t.descripcion }}</p>

    <div v-if="!estado && ocupado('cargar')" aria-busy="true" :aria-label="t.cargando">
      <NSkeleton text :repeat="3" />
    </div>

    <template v-else-if="estado">
      <section class="control" :aria-label="t.estadoTitulo">
        <p class="estado" role="status">
          <strong>{{
            estado.activo ? t.estadoActivo(nf.format(estado.segundos ?? 0)) : t.estadoApagado
          }}</strong>
        </p>
        <p v-if="!gestionada" class="aviso" role="note">
          <NIcon :size="15"><Warning /></NIcon>
          <span>{{ t.noGestionada }}</span>
        </p>
        <div v-else class="acciones-control">
          <label class="umbral">
            <span>{{ t.umbral }}</span>
            <NInputNumber
              v-model:value="segundos"
              size="small"
              :min="0.1"
              :max="60"
              :step="0.1"
              :precision="1"
              :disabled="ocupado('cambiar')"
              :aria-label="t.umbral"
              style="width: 110px"
            />
          </label>
          <NButton
            size="small"
            type="primary"
            :disabled="ocupado('cambiar') || segundos === null"
            @click="pedirCambio('activar')"
          >
            {{ estado.activo ? t.aplicarUmbral : t.activar }}
          </NButton>
          <NButton
            v-if="estado.activo"
            size="small"
            secondary
            :disabled="ocupado('cambiar')"
            @click="pedirCambio('desactivar')"
          >
            {{ t.desactivar }}
          </NButton>
          <NTooltip>
            <template #trigger>
              <NButton
                size="small"
                quaternary
                circle
                :aria-label="t.actualizar"
                :loading="ocupado('cargar')"
                @click="cargar"
              >
                <template #icon
                  ><NIcon><Refresh /></NIcon
                ></template>
              </NButton>
            </template>
            {{ t.actualizar }}
          </NTooltip>
        </div>

        <div
          v-if="confirmando"
          class="confirmar"
          role="alertdialog"
          :aria-label="t.confirmarTitulo"
        >
          <strong>{{ t.confirmarTitulo }}</strong>
          <p>
            {{
              confirmando === 'activar'
                ? t.confirmarActivar(nombre, nf.format(segundos))
                : t.confirmarDesactivar(nombre)
            }}
          </p>
          <div class="confirmar-botones">
            <NButton
              size="small"
              type="primary"
              :loading="ocupado('cambiar')"
              @click="confirmarCambio"
            >
              {{ t.confirmarBoton }}
            </NButton>
            <NButton
              size="small"
              quaternary
              :disabled="ocupado('cambiar')"
              @click="confirmando = null"
            >
              {{ t.cancelar }}
            </NButton>
          </div>
        </div>
      </section>

      <p class="privacidad">{{ t.privacidad }}</p>

      <EstadoVacio
        v-if="leidas && !hayEntradas"
        pequena
        :icono="Timer"
        :titulo="t.vacioTitulo"
        :texto="estado.activo ? t.vacioTextoActivo : t.vacioTextoApagado"
      />

      <div v-else-if="leidas" class="tabla-caja">
        <p v-if="leidas.truncado" class="nota" role="note">{{ t.truncado(MAX) }}</p>
        <table class="tabla">
          <thead>
            <tr>
              <th scope="col" class="num">{{ t.columnas.duracion }}</th>
              <th scope="col" class="num">{{ t.columnas.filas }}</th>
              <th scope="col">{{ t.columnas.base }}</th>
              <th scope="col">{{ t.columnas.fecha }}</th>
              <th scope="col">{{ t.columnas.sql }}</th>
              <th scope="col" class="acc">
                <span class="oculto">{{ t.columnas.acciones }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in leidas.entradas" :key="e.id">
              <td class="num">{{ duracion(e.duracionMs) }}</td>
              <td class="num">
                {{ e.filasExaminadas === null ? '—' : nf.format(e.filasExaminadas) }}
              </td>
              <td>{{ e.base ?? t.sinBase }}</td>
              <td class="fecha">{{ fecha(e.fecha) }}</td>
              <td class="sql-celda">
                <NTooltip v-if="literales[e.id] === undefined && e.sqlNormalizado === null">
                  <template #trigger>
                    <code class="sql oculto-sql">{{ t.sqlOculto }}</code>
                  </template>
                  {{ t.sqlOcultoAyuda }}
                </NTooltip>
                <code v-else class="sql" :class="{ literal: literales[e.id] !== undefined }">{{
                  literales[e.id] ?? e.sqlNormalizado
                }}</code>
                <span v-if="literales[e.id] !== undefined" class="etiqueta-literal">{{
                  t.literalAviso
                }}</span>
              </td>
              <td class="acc">
                <div class="acciones">
                  <NButton
                    v-if="e.literalPermitido && literales[e.id] === undefined"
                    size="tiny"
                    quaternary
                    :loading="ocupado(`literal:${e.id}`)"
                    @click="verLiteral(e.id)"
                  >
                    <template #icon
                      ><NIcon><Eye /></NIcon
                    ></template>
                    {{ t.verLiteral }}
                  </NButton>
                  <NButton
                    v-else-if="literales[e.id] !== undefined"
                    size="tiny"
                    quaternary
                    @click="ocultarLiteral(e.id)"
                  >
                    <template #icon
                      ><NIcon><EyeOff /></NIcon
                    ></template>
                    {{ t.ocultarLiteral }}
                  </NButton>
                  <NTooltip>
                    <template #trigger>
                      <NButton
                        size="tiny"
                        quaternary
                        circle
                        :aria-label="t.copiar"
                        :disabled="e.sqlNormalizado === null && literales[e.id] === undefined"
                        @click="copiar(e.id, e.sqlNormalizado)"
                      >
                        <template #icon
                          ><NIcon><Copy /></NIcon
                        ></template>
                      </NButton>
                    </template>
                    {{ t.copiar }}
                  </NTooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.intro {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.85;
}
.control {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(128, 128, 128, 0.1);
}
.estado {
  margin: 0;
  font-size: 14px;
}
.aviso {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
}
.acciones-control {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}
.umbral {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
.confirmar {
  padding: 10px 12px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 8px;
  font-size: 13px;
}
.confirmar p {
  margin: 6px 0 10px;
  line-height: 1.5;
}
.confirmar-botones {
  display: flex;
  gap: 8px;
}
.privacidad,
.nota {
  margin: 12px 0 8px;
  font-size: 12.5px;
  line-height: 1.5;
  opacity: 0.85;
}
.tabla-caja {
  max-height: 46vh;
  overflow: auto;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.tabla th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 6px 8px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--n-color, Canvas);
  border-bottom: 1px solid rgba(128, 128, 128, 0.3);
}
.tabla td {
  padding: 8px;
  vertical-align: top;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}
.num {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.fecha {
  white-space: nowrap;
  font-size: 12px;
}
.sql-celda {
  min-width: 260px;
  max-width: 440px;
}
.oculto-sql {
  font-style: italic;
  opacity: 0.8;
}
.sql {
  display: block;
  max-height: 120px;
  overflow: auto;
  font-family: var(--fuente-mono);
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
}
.etiqueta-literal {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
}
.acc {
  width: 1%;
  white-space: nowrap;
}
.acciones {
  display: flex;
  align-items: center;
  gap: 2px;
}
.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
