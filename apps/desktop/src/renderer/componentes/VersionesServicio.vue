<script setup lang="ts">
import { CloudOffline, Refresh, TrashOutline } from '@vicons/ionicons5';
import {
  NButton,
  NCheckbox,
  NEmpty,
  NIcon,
  NSkeleton,
  NTag,
  NTooltip,
  useDialog,
  useNotification,
} from 'naive-ui';
import Desplegable from './Desplegable.vue';
import { computed, ref, watch } from 'vue';
import type { IdServicioDatos, RespaldoDatos, ServicioVersiones } from '../../shared/api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { formatearTamano } from '../utilidades/bd';
import {
  origenCatalogo,
  SERVICIOS_CON_VERSIONES,
  servicioDelDialogo,
  useVersiones,
  type FilaVersion,
} from '../stores/versiones';
import DialogoActualizar from './DialogoActualizar.vue';
import DialogoDesbloquear from './DialogoDesbloquear.vue';
import DialogoDesinstalar from './DialogoDesinstalar.vue';
import DialogoSinHuella from './DialogoSinHuella.vue';
import GrupoRama from './GrupoRama.vue';

/**
 * Pestaña "Versiones" de un servicio (como FlyEnv o ServBay): la lista en línea agrupada por
 * rama, con su origen ("en línea", "caché de hace 3 h", "lista sin conexión"), filtro de rama y
 * "Mostrar todas"; por fila instalar, desinstalar, encender y predeterminada.
 */
const props = defineProps<{ servicio: ServicioVersiones }>();
const emit = defineEmits<{ elegir: [servicio: ServicioVersiones] }>();

const t = textos.versiones;
const v = useVersiones();
const dialog = useDialog();
const notification = useNotification();
const { ejecutar, ocupado } = useAccion();

const nombre = computed(() => t.servicios[props.servicio]);
/** Nombre del servicio del diálogo abierto (no el de la pestaña, que puede cambiar). */
const nombreDialogo = computed(() => t.servicios[servicioDelDialogo(v.dialogo, props.servicio)]);
const opcionesServicio = computed(() =>
  SERVICIOS_CON_VERSIONES.map((s) => ({ value: s, label: t.servicios[s] })),
);
const opcionesRama = computed(() => [
  { value: '', label: t.todasRamas },
  ...(v.tabla?.ramas ?? []).map((r) => ({ value: r.rama, label: t.rama(r.rama) })),
]);

const origen = computed(() => (v.tabla ? origenCatalogo(v.tabla) : null));
const textoOrigen = computed(() => {
  const o = origen.value;
  if (!o) return '';
  return o.tipo === 'vivo'
    ? t.origen.vivo
    : o.tipo === 'cache'
      ? t.origen.cache(o.horas)
      : t.origen.fija;
});

function cargar(refrescar = false): void {
  void ejecutar('cargar', () => v.cargar({ refrescar }), { tituloError: t.errorCarga });
}

watch(
  () => props.servicio,
  (s) => {
    if (v.servicio !== s || !v.tabla) {
      v.elegirServicio(s);
      cargar();
    }
  },
  { immediate: true },
);

function cambiarRama(r: string): void {
  v.rama = r || null;
  cargar();
}
function cambiarTodas(x: boolean): void {
  v.todas = x;
  cargar();
}

const ocupada = computed(() => ocupado('fila') || ocupado('cargar'));

function accion(fn: () => Promise<unknown>, exito?: string): void {
  void ejecutar('fila', fn, exito ? { exito } : {});
}

function instalar(version: string): void {
  accion(() => v.pedirInstalar(version));
}
function encender(version: string, valor: boolean): void {
  accion(() => v.encender(version, valor));
}
function predeterminar(version: string): void {
  accion(() => v.predeterminar(version), t.predeterminadaHecha(`${nombre.value} ${version}`));
}
function actualizar(f: FilaVersion): void {
  if (f.actualizacion) accion(() => v.abrirActualizar(f.actualizacion!, f.instancia));
}
function usar(version: string): void {
  const rama = v.tabla?.ramas.find((r) => r.versiones.some((x) => x.version === version));
  const inst = rama?.versiones.find((x) => x.instancia)?.instancia ?? null;
  if (inst) accion(() => v.abrirActualizar(version, inst));
}
function puerto(f: FilaVersion, p: number): void {
  const id = f.instancia;
  if (!id) return;
  void ejecutar('fila', () => v.cambiarPuerto(id, p), { exito: t.puertoCambiado(p) }).then(
    (proyectos) => {
      if (proyectos?.length) {
        notification.warning({
          title: t.puertoProyectosTitulo,
          content: t.puertoProyectos(f.puerto ?? 0, p, proyectos.join(', ')),
          duration: 15000,
          keepAliveOnHover: true,
        });
      }
    },
  );
}
function resolver(f: FilaVersion): void {
  if (f.instancia) accion(() => v.abrirDesbloquear(f.instancia!));
}

// ---- Diálogos (cada uno se abre desde el store; nada se actualiza sin ellos) ----
const dlg = computed(() => v.dialogo);
const abierto = computed({
  get: () => !!v.dialogo,
  set: (x: boolean) => {
    if (!x) v.cerrarDialogo();
  },
});
const dlgActualizar = computed(() =>
  dlg.value?.tipo === 'actualizar' || dlg.value?.tipo === 'nuevaRama' ? dlg.value : null,
);
const dlgSinHuella = computed(() => (dlg.value?.tipo === 'sinHuella' ? dlg.value : null));
const dlgDesinstalar = computed(() => (dlg.value?.tipo === 'desinstalar' ? dlg.value : null));
const dlgDesbloquear = computed(() => (dlg.value?.tipo === 'desbloquear' ? dlg.value : null));

// ---- Respaldos de las actualizaciones (servicios de datos) ----
const borrando = ref<string | null>(null);
function claveRespaldo(r: RespaldoDatos): string {
  return `${r.clave}.${r.tipo}-${r.sello}`;
}
function pedirBorrarRespaldo(r: RespaldoDatos): void {
  dialog.warning({
    title: t.respaldos.confirmarTitulo,
    content: t.respaldos.confirmar(claveRespaldo(r), formatearTamano(r.bytes)),
    positiveText: t.respaldos.borrar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: async () => {
      borrando.value = claveRespaldo(r);
      await ejecutar(
        'respaldo',
        () =>
          v.borrarRespaldo({
            servicio: r.servicio as IdServicioDatos,
            clave: r.clave,
            tipo: r.tipo,
            sello: r.sello,
          }),
        { exito: t.respaldos.borrado },
      );
      borrando.value = null;
    },
  });
}
</script>

<template>
  <div class="versiones">
    <div class="barra">
      <Desplegable
        size="small"
        class="servicio"
        :value="servicio"
        :options="opcionesServicio"
        :aria-label="t.elegirServicio"
        @update:value="(s: ServicioVersiones) => emit('elegir', s)"
      />
      <Desplegable
        size="small"
        class="filtro-serie"
        :value="v.rama ?? ''"
        :options="opcionesRama"
        :aria-label="t.filtroRama"
        @update:value="cambiarRama"
      />
      <NCheckbox :checked="v.todas" @update:checked="cambiarTodas">{{ t.mostrarTodas }}</NCheckbox>
      <div class="derecha">
        <NTag
          v-if="origen"
          size="small"
          :bordered="false"
          :type="origen.tipo === 'fija' ? 'warning' : 'default'"
        >
          <template v-if="origen.tipo === 'fija'" #icon
            ><NIcon><CloudOffline /></NIcon
          ></template>
          {{ textoOrigen }}
        </NTag>
        <NButton size="small" secondary :loading="ocupado('cargar')" @click="cargar(true)">
          <template #icon
            ><NIcon><Refresh /></NIcon
          ></template>
          {{ t.actualizarLista }}
        </NButton>
      </div>
    </div>
    <p class="descripcion">{{ t.ayuda[v.tabla?.interruptor ?? 'ninguno'] }}</p>

    <div v-if="!v.tabla && ocupado('cargar')" aria-busy="true">
      <NSkeleton v-for="n in 2" :key="n" :height="120" :sharp="false" class="esqueleto" />
    </div>
    <NEmpty v-else-if="!v.tabla || !v.tabla.ramas.length" :description="t.vacio" />
    <template v-else>
      <GrupoRama
        v-for="r in v.tabla.ramas"
        :key="r.rama"
        :tabla="v.tabla"
        :rama="r"
        :resaltada="v.resaltada"
        :ocupada="ocupada"
        @instalar="instalar"
        @desinstalar="(x) => v.pedirDesinstalar(x)"
        @encender="encender"
        @predeterminar="predeterminar"
        @actualizar="actualizar"
        @usar="usar"
        @puerto="puerto"
        @resolver="resolver"
      />
    </template>

    <section v-if="v.conInstancias" class="respaldos" aria-labelledby="titulo-respaldos">
      <h3 id="titulo-respaldos">{{ t.respaldos.titulo }}</h3>
      <p class="descripcion">{{ t.respaldos.descripcion }}</p>
      <p v-if="!v.respaldos.length" class="vacio">{{ t.respaldos.vacio }}</p>
      <ul v-else class="lista">
        <li v-for="r in v.respaldos" :key="claveRespaldo(r)">
          <span class="tipo">{{ t.respaldos.tipos[r.tipo] }}</span>
          <code>{{ claveRespaldo(r) }}</code>
          <span class="tam"
            >{{ formatearTamano(r.bytes) }} · {{ t.respaldos.archivos(r.archivos) }}</span
          >
          <NTooltip>
            <template #trigger>
              <NButton
                size="tiny"
                quaternary
                circle
                :loading="borrando === claveRespaldo(r)"
                :aria-label="t.respaldos.borrarDe(claveRespaldo(r))"
                @click="pedirBorrarRespaldo(r)"
              >
                <template #icon
                  ><NIcon><TrashOutline /></NIcon
                ></template>
              </NButton>
            </template>
            {{ t.respaldos.borrar }}
          </NTooltip>
        </li>
      </ul>
    </section>

    <DialogoActualizar
      v-if="dlgActualizar"
      v-model:show="abierto"
      :dialogo="dlgActualizar"
      :nombre="nombreDialogo"
    />
    <DialogoSinHuella
      v-if="dlgSinHuella"
      v-model:show="abierto"
      :nombre="nombreDialogo"
      :version="dlgSinHuella.version"
      :alternativa="dlgSinHuella.alternativa"
    />
    <DialogoDesinstalar
      v-if="dlgDesinstalar"
      v-model:show="abierto"
      :nombre="nombreDialogo"
      :fila="dlgDesinstalar.fila"
      :datos="v.conInstancias"
      :unica="v.tabla?.interruptor === 'unica' && dlgDesinstalar.fila.predeterminada"
    />
    <DialogoDesbloquear
      v-if="dlgDesbloquear"
      v-model:show="abierto"
      :instancia="dlgDesbloquear.instancia"
      :respaldos="dlgDesbloquear.respaldos"
      :versiones="dlgDesbloquear.versiones"
    />
  </div>
</template>

<style scoped>
.barra {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}
.servicio {
  width: 170px;
}
.filtro-serie {
  width: 150px;
}
.derecha {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.descripcion {
  margin: 0 0 12px;
  font-size: 13px;
  opacity: 0.65;
}
.esqueleto {
  margin-bottom: 12px;
  border-radius: 12px;
}
.respaldos {
  margin-top: 22px;
}
.respaldos h3 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
}
.vacio {
  font-size: 13px;
  opacity: 0.6;
}
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
}
.lista li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 0;
  border-top: 1px solid rgba(128, 128, 128, 0.16);
  font-size: 13px;
}
.tipo {
  min-width: 170px;
  opacity: 0.8;
}
.tam {
  margin-left: auto;
  opacity: 0.7;
}
</style>
