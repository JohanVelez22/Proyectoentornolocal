<script setup lang="ts">
import {
  Add,
  Archive,
  ArrowUndo,
  CloudDownload,
  KeyOutline,
  Layers,
  OpenOutline,
  Power,
  Refresh,
  Sparkles,
  TrashOutline,
  Warning,
} from '@vicons/ionicons5';
import {
  NButton,
  NEmpty,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NSkeleton,
  NSpin,
  NTab,
  NTabs,
  NTooltip,
} from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { DisponibilidadAdminer, MotorBd, MotorSql } from '../../shared/api';
import { api } from '../api';
import IlustracionVacia from '../componentes/IlustracionVacia.vue';
import DialogoConexion from '../componentes/DialogoConexion.vue';
import DialogoImportar from '../componentes/DialogoImportar.vue';
import DialogoNuevaBase from '../componentes/DialogoNuevaBase.vue';
import DialogoRespaldar from '../componentes/DialogoRespaldar.vue';
import DialogoRestaurar from '../componentes/DialogoRestaurar.vue';
import EstadoPunto from '../componentes/EstadoPunto.vue';
import PanelProgreso from '../componentes/PanelProgreso.vue';
import ResultadoOperacion from '../componentes/ResultadoOperacion.vue';
import SeccionPgvector from '../componentes/SeccionPgvector.vue';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { LIMITE_LINEAS, useBd } from '../stores/bd';
import { useServicios } from '../stores/servicios';
import {
  confirmacionValida,
  esMotorSql,
  formatearTamano,
  MOTORES,
  USUARIO_ADMIN,
} from '../utilidades/bd';

const t = textos.bd;
const router = useRouter();
const servicios = useServicios();
const bd = useBd();
const { ejecutar, ocupado } = useAccion();

// ---- Motores y pestañas ----
const instaladosListos = ref(false);
const adminer = ref<DisponibilidadAdminer | null>(null);

/** Pestaña por motor propio instalado (un servidor externo, como el de FlyEnv, no cuenta). */
const motores = computed<MotorBd[]>(() =>
  MOTORES.filter((m) => {
    const propio = servicios.porId[m];
    return (servicios.instalados[m]?.length ?? 0) > 0 || (!!propio && propio.estado !== 'externo');
  }),
);
const activo = ref<MotorBd | null>(null);
watch(
  motores,
  (lista) => {
    if (!activo.value || !lista.includes(activo.value)) activo.value = lista[0] ?? null;
  },
  { immediate: true },
);

const nombre = (m: MotorBd): string => t.motores[m] ?? m;
const estadoDe = (m: MotorBd) => servicios.porId[m];
const servicio = computed(() => (activo.value ? estadoDe(activo.value) : undefined));
const encendido = computed(() => servicio.value?.estado === 'encendido');
const motorSql = computed<MotorSql | null>(() =>
  activo.value && esMotorSql(activo.value) ? activo.value : null,
);
const bases = computed(() => (activo.value ? (bd.bases[activo.value] ?? null) : null));
const cargandoBases = computed(() => !!(activo.value && bd.cargando[activo.value]));
const errorBases = computed(() => (activo.value ? bd.errorCarga[activo.value] : undefined));
/** Una operación larga en marcha (o la compilación de pgvector, que detiene PostgreSQL). */
const ocupadaBd = computed(
  () => bd.enCurso || (activo.value === 'postgresql' && bd.tareaPgvector === 'compilar'),
);

function cargarBases(): void {
  if (activo.value && encendido.value) void bd.cargarBases(activo.value);
}

// Se vuelve a leer la lista al cambiar de pestaña o cuando el motor termina de encender.
watch([activo, encendido], cargarBases, { immediate: true });

onMounted(() => {
  void Promise.all(MOTORES.map((m) => servicios.cargarInstalados(m).catch(() => undefined))).then(
    () => (instaladosListos.value = true),
  );
  void api()
    .adminer.disponibilidad()
    .then((d) => (adminer.value = d))
    .catch(() => undefined);
});

function encender(): void {
  const m = activo.value;
  if (m) void ejecutar('encender', () => api().servicios.iniciar(m));
}

// ---- Diálogos ----
const dlgNueva = ref(false);
const dlgRestaurar = ref(false);
const dlgImportar = ref(false);
const dlgRespaldar = ref(false);
const dlgConexion = ref(false);
const baseFija = ref<string | null>(null);
const baseElegida = ref('');

function abrirRestaurar(base: string | null): void {
  if (!motorSql.value || ocupadaBd.value) return;
  baseFija.value = base;
  dlgRestaurar.value = true;
}
function abrirRespaldar(base: string): void {
  if (ocupadaBd.value) return;
  baseElegida.value = base;
  dlgRespaldar.value = true;
}
function abrirConexion(base: string): void {
  baseElegida.value = base;
  dlgConexion.value = true;
}

/** La operación se ve en su diálogo; si se cerró o se cambió de pantalla, aquí. */
const operacionSuelta = computed(
  () => !!bd.operacion && !dlgRestaurar.value && !dlgImportar.value && !dlgRespaldar.value,
);
const textoCorriendo = computed(() => {
  const o = bd.operacion;
  return o ? (t.progreso.corriendo[o.tipo]?.(o.base) ?? '') : '';
});

// ---- Acciones de fila ----
const adminerListo = computed(() => adminer.value?.disponible === true);

function abrirAdminer(base: string): void {
  const m = motorSql.value;
  if (!m) return;
  void ejecutar('adminer', async () => {
    const url = await api().adminer.url(m, USUARIO_ADMIN[m]);
    if (!url) return;
    const u = new URL(url);
    u.searchParams.set('db', base);
    await api().sistema.abrirUrl(u.toString());
  });
}

const vectorListo = computed(() => bd.pgvector?.instalado === true);
function activarVector(base: string): void {
  void ejecutar(`vector:${base}`, () => api().pgvector.activar(base), {
    exito: t.vectorActivado(base),
  });
}

// ---- Borrar ----
const dlgBorrar = ref(false);
const aBorrar = ref('');
const escritoBorrar = ref('');
function pedirBorrar(base: string): void {
  aBorrar.value = base;
  escritoBorrar.value = '';
  dlgBorrar.value = true;
}
async function borrar(): Promise<void> {
  const m = activo.value;
  const b = aBorrar.value;
  if (!m || !confirmacionValida(b, escritoBorrar.value)) return;
  const ok = await ejecutar(
    'borrar',
    async () => {
      await api().bd.borrar(m, b, escritoBorrar.value);
      return true;
    },
    { exito: t.dialogoBorrar.hecho(b) },
  );
  if (!ok) return;
  dlgBorrar.value = false;
  void bd.cargarBases(m);
}

function irAServicios(): void {
  void router.push({ name: 'servicios' });
}
</script>

<template>
  <div class="bd">
    <div class="barra">
      <p class="descripcion">{{ t.descripcion }}</p>
    </div>

    <!-- Sin ningún motor propio instalado -->
    <div v-if="instaladosListos && servicios.cargado && !motores.length" class="vacio">
      <NEmpty :description="t.vacio" size="large">
        <template #icon><IlustracionVacia :icono="Layers" /></template>
        <template #extra>
          <NButton size="small" type="primary" @click="irAServicios">{{ t.irAServicios }}</NButton>
        </template>
      </NEmpty>
    </div>

    <div v-else-if="!activo" aria-busy="true">
      <NSkeleton text :width="280" />
      <NSkeleton :height="180" :sharp="false" class="esqueleto" />
    </div>

    <template v-else>
      <div class="cabeza">
        <NTabs
          v-model:value="activo"
          type="segment"
          size="small"
          class="pestanas"
          :aria-label="textos.nav.basesDeDatos"
        >
          <NTab v-for="m in motores" :key="m" :name="m">
            <span class="pestana">
              {{ nombre(m) }}
              <EstadoPunto v-if="estadoDe(m)" :estado="estadoDe(m)!.estado" solo-punto />
            </span>
          </NTab>
        </NTabs>

        <div class="principales">
          <NButton
            size="small"
            type="primary"
            :disabled="!encendido || ocupadaBd"
            @click="dlgNueva = true"
          >
            <template #icon
              ><NIcon><Add /></NIcon
            ></template>
            {{ t.nueva }}
          </NButton>
          <NTooltip :disabled="!!motorSql && encendido && !ocupadaBd">
            <template #trigger>
              <span>
                <NButton
                  size="small"
                  secondary
                  :disabled="!motorSql || !encendido || ocupadaBd"
                  @click="abrirRestaurar(null)"
                >
                  <template #icon
                    ><NIcon><ArrowUndo /></NIcon
                  ></template>
                  {{ t.restaurar }}
                </NButton>
              </span>
            </template>
            {{
              !motorSql
                ? t.soloSql
                : !encendido
                  ? t.encenderPrimero(nombre(activo))
                  : t.enCursoAyuda
            }}
          </NTooltip>
          <NTooltip :disabled="!!motorSql && encendido && !ocupadaBd">
            <template #trigger>
              <span>
                <NButton
                  size="small"
                  secondary
                  :disabled="!motorSql || !encendido || ocupadaBd"
                  @click="dlgImportar = true"
                >
                  <template #icon
                    ><NIcon><CloudDownload /></NIcon
                  ></template>
                  {{ t.importar }}
                </NButton>
              </span>
            </template>
            {{
              !motorSql
                ? t.soloSql
                : !encendido
                  ? t.encenderPrimero(nombre(activo))
                  : t.enCursoAyuda
            }}
          </NTooltip>
        </div>
      </div>

      <!-- Operación en curso o terminada cuyo diálogo ya no está abierto -->
      <section v-if="operacionSuelta && bd.operacion" class="operacion" aria-live="polite">
        <div class="operacion-cabeza">
          <p v-if="bd.enCurso" class="corriendo">
            <NSpin :size="16" />
            <span>{{ textoCorriendo }}</span>
          </p>
          <NButton
            v-if="!bd.enCurso"
            size="tiny"
            quaternary
            class="descartar"
            @click="bd.descartarOperacion()"
          >
            {{ t.progreso.descartar }}
          </NButton>
        </div>
        <PanelProgreso :lineas="bd.lineas" :limite="LIMITE_LINEAS" :alto="180" />
        <ResultadoOperacion v-if="!bd.enCurso" :operacion="bd.operacion" />
      </section>

      <!-- Motor apagado, encendiéndose o con error -->
      <div v-if="!encendido" class="apagado">
        <span class="apagado-icono"
          ><NIcon :size="22"><Power /></NIcon
        ></span>
        <div class="apagado-texto">
          <strong>
            {{
              servicio?.estado === 'iniciando'
                ? t.apagado.iniciando(nombre(activo))
                : servicio?.estado === 'error'
                  ? t.apagado.error(nombre(activo))
                  : t.apagado.titulo(nombre(activo))
            }}
          </strong>
          <span v-if="servicio?.estado === 'error' && servicio.mensaje" class="apagado-mensaje">
            {{ servicio.mensaje }}
          </span>
          <span v-else>{{ t.apagado.texto(nombre(activo)) }}</span>
        </div>
        <div class="apagado-botones">
          <NButton
            size="small"
            type="primary"
            :loading="ocupado('encender') || servicio?.estado === 'iniciando'"
            :disabled="servicio?.estado === 'iniciando'"
            @click="encender"
          >
            <template #icon
              ><NIcon><Power /></NIcon
            ></template>
            {{ t.apagado.encender(nombre(activo)) }}
          </NButton>
          <NButton size="small" quaternary @click="irAServicios">
            {{ t.apagado.verServicios }}
          </NButton>
        </div>
      </div>

      <!-- Lista de bases -->
      <section v-else class="tabla-bloque" :aria-busy="cargandoBases">
        <header class="tabla-cabeza">
          <span class="total">{{ bases ? t.total(bases.length) : t.cargando }}</span>
          <NTooltip>
            <template #trigger>
              <NButton
                size="tiny"
                quaternary
                circle
                :aria-label="t.recargar"
                :loading="cargandoBases"
                @click="cargarBases"
              >
                <template #icon
                  ><NIcon><Refresh /></NIcon
                ></template>
              </NButton>
            </template>
            {{ t.recargar }}
          </NTooltip>
        </header>

        <div v-if="errorBases" class="error-lista" role="alert">
          <NIcon :size="16"><Warning /></NIcon>
          <div>
            <strong>{{ t.errorLista }}</strong>
            <span>{{ errorBases }}</span>
          </div>
        </div>
        <NSkeleton v-else-if="!bases" text :repeat="3" />
        <p v-else-if="!bases.length" class="sin-bases">{{ t.sinBases }}</p>
        <table v-else class="tabla">
          <thead>
            <tr>
              <th scope="col">{{ t.columnas.nombre }}</th>
              <th scope="col" class="num">{{ t.columnas.tamano }}</th>
              <th scope="col" class="acc">
                <span class="oculto">{{ t.columnas.acciones }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bases" :key="b.nombre">
              <td class="nombre">{{ b.nombre }}</td>
              <td class="num">{{ formatearTamano(b.tamanoBytes) }}</td>
              <td class="acc">
                <div class="acciones">
                  <template v-if="motorSql">
                    <NTooltip>
                      <template #trigger>
                        <NButton
                          size="small"
                          quaternary
                          circle
                          :aria-label="t.acciones.de(t.acciones.respaldar, b.nombre)"
                          :disabled="ocupadaBd"
                          @click="abrirRespaldar(b.nombre)"
                        >
                          <template #icon
                            ><NIcon><Archive /></NIcon
                          ></template>
                        </NButton>
                      </template>
                      {{ ocupadaBd ? t.enCursoAyuda : t.acciones.respaldar }}
                    </NTooltip>
                    <NTooltip>
                      <template #trigger>
                        <NButton
                          size="small"
                          quaternary
                          circle
                          :aria-label="t.acciones.de(t.acciones.restaurarAqui, b.nombre)"
                          :disabled="ocupadaBd"
                          @click="abrirRestaurar(b.nombre)"
                        >
                          <template #icon
                            ><NIcon><ArrowUndo /></NIcon
                          ></template>
                        </NButton>
                      </template>
                      {{ ocupadaBd ? t.enCursoAyuda : t.acciones.restaurarAqui }}
                    </NTooltip>
                    <NTooltip>
                      <template #trigger>
                        <span>
                          <NButton
                            size="small"
                            quaternary
                            circle
                            :aria-label="t.acciones.de(t.acciones.adminer, b.nombre)"
                            :disabled="!adminerListo"
                            :loading="ocupado('adminer')"
                            @click="abrirAdminer(b.nombre)"
                          >
                            <template #icon
                              ><NIcon><OpenOutline /></NIcon
                            ></template>
                          </NButton>
                        </span>
                      </template>
                      {{ adminerListo ? t.acciones.adminer : t.adminerNoDisponible }}
                    </NTooltip>
                  </template>
                  <NTooltip>
                    <template #trigger>
                      <NButton
                        size="small"
                        quaternary
                        circle
                        :aria-label="t.acciones.de(t.acciones.conexion, b.nombre)"
                        @click="abrirConexion(b.nombre)"
                      >
                        <template #icon
                          ><NIcon><KeyOutline /></NIcon
                        ></template>
                      </NButton>
                    </template>
                    {{ t.acciones.conexion }}
                  </NTooltip>
                  <NTooltip v-if="activo === 'postgresql'">
                    <template #trigger>
                      <span>
                        <NButton
                          size="small"
                          quaternary
                          circle
                          :aria-label="t.acciones.de(t.acciones.vector, b.nombre)"
                          :disabled="!vectorListo || ocupadaBd"
                          :loading="ocupado(`vector:${b.nombre}`)"
                          @click="activarVector(b.nombre)"
                        >
                          <template #icon
                            ><NIcon><Sparkles /></NIcon
                          ></template>
                        </NButton>
                      </span>
                    </template>
                    {{ vectorListo ? t.acciones.vector : t.vectorSinInstalar }}
                  </NTooltip>
                  <NTooltip>
                    <template #trigger>
                      <NButton
                        size="small"
                        quaternary
                        circle
                        class="peligro"
                        :aria-label="t.acciones.de(t.acciones.borrar, b.nombre)"
                        :disabled="ocupadaBd"
                        @click="pedirBorrar(b.nombre)"
                      >
                        <template #icon
                          ><NIcon><TrashOutline /></NIcon
                        ></template>
                      </NButton>
                    </template>
                    {{ ocupadaBd ? t.enCursoAyuda : t.acciones.borrar }}
                  </NTooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <SeccionPgvector v-if="activo === 'postgresql'" />
    </template>

    <!-- Diálogos -->
    <DialogoNuevaBase v-if="activo" v-model:show="dlgNueva" :motor="activo" @creada="cargarBases" />
    <DialogoRestaurar
      v-if="motorSql"
      v-model:show="dlgRestaurar"
      :motor="motorSql"
      :base-fija="baseFija"
    />
    <DialogoImportar v-if="motorSql" v-model:show="dlgImportar" :motor="motorSql" />
    <DialogoRespaldar
      v-if="motorSql"
      v-model:show="dlgRespaldar"
      :motor="motorSql"
      :base="baseElegida"
    />
    <DialogoConexion v-if="activo" v-model:show="dlgConexion" :motor="activo" :base="baseElegida" />

    <NModal
      v-model:show="dlgBorrar"
      preset="card"
      :title="t.dialogoBorrar.titulo(aBorrar)"
      size="small"
      :bordered="false"
      :style="{ width: '440px', maxWidth: 'calc(100vw - 32px)' }"
      :mask-closable="!ocupado('borrar')"
      :closable="!ocupado('borrar')"
    >
      <p class="advertencia">
        <NIcon :size="18"><Warning /></NIcon>
        <span>{{ t.dialogoBorrar.texto(aBorrar, activo ? nombre(activo) : '') }}</span>
      </p>
      <NForm :show-feedback="false" @submit.prevent="borrar">
        <NFormItem :label="t.dialogoBorrar.pedir(aBorrar)">
          <NInput
            v-model:value="escritoBorrar"
            :placeholder="aBorrar"
            :input-props="{ spellcheck: false, autocomplete: 'off' }"
            class="mono"
            autofocus
          />
        </NFormItem>
      </NForm>
      <template #action>
        <div class="acciones-dialogo">
          <NButton size="small" :disabled="ocupado('borrar')" @click="dlgBorrar = false">
            {{ textos.acciones.cancelar }}
          </NButton>
          <NButton
            size="small"
            type="error"
            :disabled="!confirmacionValida(aBorrar, escritoBorrar)"
            :loading="ocupado('borrar')"
            @click="borrar"
          >
            <template #icon
              ><NIcon><TrashOutline /></NIcon
            ></template>
            {{ t.dialogoBorrar.boton }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.barra {
  margin-bottom: 16px;
}
.descripcion {
  margin: 0;
  opacity: 0.65;
}
.vacio {
  padding: 40px 0 32px;
  border: 1px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
}
.esqueleto {
  margin-top: 12px;
  border-radius: 12px;
}
.cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.pestanas {
  width: auto;
  min-width: 280px;
  max-width: 520px;
}
.pestana {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.principales {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.operacion {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(var(--acento-rgb), 0.3);
  background: rgba(var(--acento-rgb), 0.05);
}
.operacion-cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 22px;
}
.descartar {
  margin-left: auto;
}
.corriendo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 600;
}
.apagado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  border: 1px dashed rgba(128, 128, 128, 0.35);
}
.apagado-icono {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(128, 128, 128, 0.1);
  flex: none;
}
.apagado-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 220px;
  font-size: 13px;
}
.apagado-texto strong {
  font-size: 14.5px;
}
.apagado-texto span {
  opacity: 0.7;
}
.apagado-mensaje {
  color: #dc2626;
  opacity: 1 !important;
  white-space: pre-wrap;
}
.apagado-botones {
  display: flex;
  gap: 6px;
}
.tabla-bloque {
  padding: 6px 16px 12px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.03);
}
.tabla-cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}
.total {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.6;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.tabla th {
  padding: 8px 6px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.55;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}
.tabla td {
  padding: 6px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
.tabla tbody tr:last-child td {
  border-bottom: none;
}
.tabla tbody tr:hover td {
  background: rgba(128, 128, 128, 0.05);
}
.nombre {
  font-family: var(--fuente-mono);
  font-size: 13px;
  word-break: break-all;
}
.num {
  text-align: right !important;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: nowrap;
  width: 110px;
}
.acc {
  width: 1%;
  white-space: nowrap;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
}
.peligro:not(:disabled) :deep(.n-icon) {
  color: #dc2626;
}
.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.sin-bases {
  margin: 8px 0;
  font-size: 13px;
  opacity: 0.65;
}
.error-lista {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.08);
  font-size: 12.5px;
}
.error-lista .n-icon {
  color: #dc2626;
  flex: none;
  margin-top: 1px;
}
.error-lista div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.advertencia {
  display: flex;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 13px;
}
.advertencia .n-icon {
  color: #dc2626;
  flex: none;
}
.mono :deep(input) {
  font-family: var(--fuente-mono);
}
.acciones-dialogo {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
