<script setup lang="ts">
import {
  EllipsisHorizontal,
  KeyOutline,
  Power,
  SwapHorizontal,
  TrashOutline,
  Warning,
} from '@vicons/ionicons5';
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSwitch,
  useDialog,
  useNotification,
  type DropdownOption,
} from 'naive-ui';
import DialogoConexion from './DialogoConexion.vue';
import MenuDesplegable from './MenuDesplegable.vue';
import { computed, h, ref, type Component } from 'vue';
import { solicitudes } from '../composables/solicitudes';
import type { EstadoServicio } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { nombreServicio } from '../utilidades/nombreServicio';
import { esServicioDatos, puertoAlternativo, useServicios } from '../stores/servicios';
import { iconoDeServicio } from '../utilidades/iconosServicio';
import EstadoPunto from './EstadoPunto.vue';
import { formatearTamano } from '../utilidades/bd';
import { destinoVersion } from '../utilidades/foco';
import { esNumeroVersion } from '../utilidades/version';
import { useRouter } from 'vue-router';
import { esServicioConVersiones } from '../stores/versiones';

const props = defineProps<{ servicio: EstadoServicio }>();

const t = textos.servicios;
/** El supervisor marca con este mensaje al proceso sin reinicio que salió con código 0. */
const MENSAJE_TERMINADO = 'terminado';
const servicios = useServicios();
const dialog = useDialog();
const notification = useNotification();
const { ejecutar, ocupado } = useAccion();
const router = useRouter();

/** Servicio de la pestaña "Versiones" de esta tarjeta (las ramas de PHP van todas a PHP). */
const servicioVersiones = computed(() => {
  const id = props.servicio.id.startsWith('php-') ? 'php' : props.servicio.id;
  return esServicioConVersiones(id) ? id : null;
});
function abrirVersiones(): void {
  if (servicioVersiones.value) {
    // Cae sobre la tarjeta de la versión que usa este servicio (si se conoce).
    void router.push(destinoVersion(servicioVersiones.value, props.servicio.version));
  }
}
/** Con varias instancias, cuántas y cuántas encendidas. */
const resumenInstancias = computed(() => {
  const l = props.servicio.instancias ?? [];
  if (l.length < 2) return null;
  return t.instancias(l.length, l.filter((i) => i.estado === 'encendido').length);
});

const icono = computed(() => iconoDeServicio(props.servicio));

const externo = computed(() => props.servicio.estado === 'externo');
const encendido = computed(() => props.servicio.estado === 'encendido');
const iniciando = computed(() => props.servicio.estado === 'iniciando');
const trabajando = computed(() => ocupado('cambiar'));
/** Mientras corre una acción de esta tarjeta no se ofrece otra que la pise. */
const tarjetaOcupada = computed(
  () =>
    ocupado('cambiar') ||
    ocupado('puerto') ||
    ocupado('borrar') ||
    ocupado('auto') ||
    iniciando.value,
);
const esFtp = computed(() => props.servicio.id === 'ftp');
/** Servicio propio con puerto, datos y arranque automático (no los externos). */
const deDatos = computed(() => esServicioDatos(props.servicio.id) && !externo.value);
const puertoPrincipal = computed(() => props.servicio.puertos[0] ?? null);
const alternativo = computed(() =>
  deDatos.value && !encendido.value ? puertoAlternativo(props.servicio.mensaje) : null,
);

function cambiar(): void {
  const id = props.servicio.id;
  void ejecutar('cambiar', () =>
    encendido.value || iniciando.value ? api().servicios.detener(id) : api().servicios.iniciar(id),
  );
}

const estiloDialogo = { width: '420px', maxWidth: 'calc(100vw - 32px)' };

// ---- Puerto ----
const dialogoPuerto = ref(false);
const puertoNuevo = ref<number | null>(null);
const puertoValido = computed(
  () => puertoNuevo.value !== null && puertoNuevo.value >= 1024 && puertoNuevo.value <= 65535,
);
const puertoIgual = computed(() => puertoNuevo.value === puertoPrincipal.value);

function abrirDialogoPuerto(): void {
  puertoNuevo.value = alternativo.value ?? puertoPrincipal.value;
  dialogoPuerto.value = true;
}

async function aplicarPuerto(puerto: number): Promise<boolean> {
  const id = props.servicio.id;
  if (!esServicioDatos(id)) return false;
  const anterior = puertoPrincipal.value;
  const r = await ejecutar('puerto', () => api().servicios.cambiarPuerto(id, puerto), {
    exito: t.puertoCambiado(nombreServicio(props.servicio.nombre), puerto),
  });
  // Proyectos cuyo .env todavía usa el puerto anterior (no se cambian solos).
  if (r?.proyectos.length) {
    notification.warning({
      title: textos.versiones.puertoProyectosTitulo,
      content: textos.versiones.puertoProyectos(anterior ?? 0, puerto, r.proyectos.join(', ')),
      duration: 15000,
      keepAliveOnHover: true,
    });
  }
  return r !== undefined;
}

async function guardarPuerto(): Promise<void> {
  if (!puertoValido.value || puertoIgual.value || puertoNuevo.value === null) return;
  if (await aplicarPuerto(puertoNuevo.value)) dialogoPuerto.value = false;
}

function usarAlternativo(): void {
  if (alternativo.value !== null) void aplicarPuerto(alternativo.value);
}

// ---- Borrar datos ----
const dialogoBorrar = ref(false);
const confirmacion = ref('');
const confirmado = computed(() => confirmacion.value === props.servicio.id);

async function borrarDatos(): Promise<void> {
  const id = props.servicio.id;
  if (!confirmado.value || !esServicioDatos(id)) return;
  const ok = await ejecutar(
    'borrar',
    async () => {
      await api().servicios.borrarDatos(id, confirmacion.value);
      return true;
    },
    { exito: t.borrarDatos.hecho(nombreServicio(props.servicio.nombre)) },
  );
  if (ok) dialogoBorrar.value = false;
}

// ---- Datos de conexión (Meilisearch) ----
const dialogoConexion = ref(false);

// ---- Menú ⋯ ----
const iconoMenu = (c: Component) => () => h(NIcon, null, { default: () => h(c) });
const opciones = computed<DropdownOption[]>(() => [
  ...(props.servicio.id === 'meilisearch'
    ? [{ key: 'conexion', label: t.datosConexion, icon: iconoMenu(KeyOutline) }]
    : []),
  {
    key: 'puerto',
    label: t.cambiarPuerto,
    icon: iconoMenu(SwapHorizontal),
    disabled: tarjetaOcupada.value,
  },
  { type: 'divider', key: 'd1' },
  {
    key: 'borrar',
    label: t.borrarDatos.opcion,
    icon: iconoMenu(TrashOutline),
    disabled: tarjetaOcupada.value,
    props: { style: 'color: var(--texto-error)' },
  },
]);

const textoBorrar = computed(() =>
  t.borrarDatos.texto(
    t.borrarDatos.que[props.servicio.id] ??
      t.borrarDatos.generico(nombreServicio(props.servicio.nombre)),
  ),
);

function elegir(clave: string): void {
  if (tarjetaOcupada.value) return;
  if (clave === 'conexion') dialogoConexion.value = true;
  if (clave === 'puerto') abrirDialogoPuerto();
  if (clave === 'borrar') {
    confirmacion.value = '';
    copiasABorrar.value = null;
    dialogoBorrar.value = true;
    const id = props.servicio.id;
    if (esServicioDatos(id)) {
      void api()
        .servicios.respaldosDatos(id)
        .then(
          (l) => (copiasABorrar.value = { n: l.length, bytes: l.reduce((a, r) => a + r.bytes, 0) }),
        )
        .catch(() => undefined);
    }
  }
}

/** Copias de las actualizaciones que también se borrarían con data/<servicio>. */
const copiasABorrar = ref<{ n: number; bytes: number } | null>(null);

// ---- Arranque automático ----
const autoIniciar = computed(() =>
  esServicioDatos(props.servicio.id)
    ? (servicios.autoIniciar?.[props.servicio.id] ?? false)
    : false,
);

function cambiarAutoIniciar(valor: boolean): void {
  const id = props.servicio.id;
  if (!esServicioDatos(id)) return;
  void ejecutar('auto', () => servicios.cambiarAutoIniciar(id, valor), {
    exito: valor
      ? t.autoIniciarActivado(nombreServicio(props.servicio.nombre))
      : t.autoIniciarDesactivado(nombreServicio(props.servicio.nombre)),
  });
}

// ---- FTP ----
/** El FTP no se comparte por túnel; para internet, «Compartir carpeta o archivo» (HTTP). */
function irACompartir(): void {
  solicitudes.herramienta = 'compartir';
  void router.push({ name: 'herramientas' });
}

function cambiarRedLocal(valor: boolean): void {
  const aplicar = (): Promise<unknown> =>
    ejecutar('redLocal', () => servicios.cambiarRedLocal(valor), {
      exito: valor ? t.ftp.redLocalActivada : t.ftp.redLocalDesactivada,
    });
  if (!valor) {
    void aplicar();
    return;
  }
  dialog.warning({
    title: t.ftp.avisoTitulo,
    content: t.ftp.avisoTexto,
    positiveText: t.ftp.avisoConfirmar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: () => {
      void aplicar();
    },
  });
}
</script>

<template>
  <article
    class="tarjeta"
    :class="`estado-${servicio.estado}`"
    :data-foco="`servicio:${servicio.id}`"
  >
    <header class="cabeza">
      <span class="icono"
        ><NIcon :size="18"><component :is="icono" /></NIcon
      ></span>
      <div class="titulo">
        <h3>{{ nombreServicio(servicio.nombre) }}</h3>
        <span class="version" :class="{ numero: esNumeroVersion(servicio.version) }">{{
          servicio.version ?? t.sinVersion
        }}</span>
      </div>
      <EstadoPunto :estado="servicio.estado" />
      <NButton
        v-if="servicioVersiones"
        text
        size="tiny"
        type="primary"
        :aria-label="t.versionesDe(nombreServicio(servicio.nombre))"
        @click="abrirVersiones"
      >
        {{ textos.versiones.pestana }}
      </NButton>
      <MenuDesplegable
        v-if="deDatos"
        trigger="click"
        :options="opciones"
        alinear-fin
        @select="elegir"
      >
        <NButton
          size="tiny"
          quaternary
          circle
          :aria-label="`${textos.acciones.masAcciones}: ${nombreServicio(servicio.nombre)}`"
          :title="textos.acciones.masAcciones"
          :disabled="tarjetaOcupada"
        >
          <template #icon
            ><NIcon><EllipsisHorizontal /></NIcon
          ></template>
        </NButton>
      </MenuDesplegable>
    </header>

    <p v-if="resumenInstancias" class="instancias">{{ resumenInstancias }}</p>
    <dl class="datos">
      <div>
        <dt>{{ servicio.puertos.length > 1 ? t.puertos : t.puerto }}</dt>
        <dd class="puerto">
          <span>{{ servicio.puertos.length ? servicio.puertos.join(', ') : t.sinPuertos }}</span>
          <NButton
            v-if="deDatos"
            text
            size="tiny"
            type="primary"
            class="enlace"
            :aria-label="t.cambiarPuertoDe(nombreServicio(servicio.nombre))"
            :disabled="tarjetaOcupada"
            @click="abrirDialogoPuerto"
          >
            {{ t.cambiarPuerto }}
          </NButton>
        </dd>
      </div>
      <div>
        <dt>{{ t.pid }}</dt>
        <dd>{{ servicio.pid ?? t.sinPuertos }}</dd>
      </div>
    </dl>

    <div v-if="alternativo !== null" class="conflicto" role="alert">
      <NIcon :size="16" class="conflicto-icono"><Warning /></NIcon>
      <div class="conflicto-cuerpo">
        <strong>{{ t.conflicto }}</strong>
        <span>{{ servicio.mensaje }}</span>
        <NButton
          size="tiny"
          type="warning"
          secondary
          :loading="ocupado('puerto')"
          :disabled="!ocupado('puerto') && tarjetaOcupada"
          class="conflicto-boton"
          @click="usarAlternativo"
        >
          {{ t.usarPuerto(alternativo) }}
        </NButton>
      </div>
    </div>
    <NCollapse v-else-if="servicio.estado === 'error' && servicio.mensaje" class="detalle-error">
      <NCollapseItem :title="t.verDetalle" name="error">
        <pre>{{ servicio.mensaje }}</pre>
      </NCollapseItem>
    </NCollapse>
    <p v-else-if="servicio.mensaje" class="mensaje">
      {{ servicio.mensaje === MENSAJE_TERMINADO ? t.terminado : servicio.mensaje }}
    </p>

    <label v-if="deDatos" class="opcion">
      <NSwitch
        size="small"
        :value="autoIniciar"
        :loading="ocupado('auto')"
        :disabled="servicios.autoIniciar === null"
        :aria-label="`${t.autoIniciar}: ${nombreServicio(servicio.nombre)}`"
        @update:value="cambiarAutoIniciar"
      />
      <span>{{ t.autoIniciar }}</span>
    </label>

    <div v-if="esFtp" class="opcion-bloque">
      <label class="opcion">
        <NSwitch
          size="small"
          :value="servicios.redLocalFtp ?? false"
          :loading="ocupado('redLocal')"
          :disabled="servicios.redLocalFtp === null"
          :aria-label="t.ftp.redLocal"
          @update:value="cambiarRedLocal"
        />
        <span>{{ t.ftp.redLocal }}</span>
      </label>
      <small class="ayuda">{{ t.ftp.redLocalAyuda }}</small>
      <small class="ayuda">{{ t.ftp.compartir.ayuda }}</small>
      <NButton
        text
        type="primary"
        size="small"
        class="ftp-compartir"
        data-testid="ftp-compartir"
        @click="irACompartir"
        >{{ t.ftp.compartir.enlace }}</NButton
      >
    </div>

    <footer class="pie">
      <span v-if="externo" class="externo">{{ t.externo }}</span>
      <label v-else-if="esFtp" class="opcion">
        <span>{{ t.ftp.interruptor }}</span>
        <NSwitch
          :value="encendido || iniciando"
          :loading="trabajando || iniciando"
          :aria-label="t.ftp.interruptor"
          @update:value="cambiar"
        />
      </label>
      <NButton
        v-else
        size="small"
        :type="encendido ? 'default' : 'primary'"
        :secondary="encendido"
        :disabled="iniciando"
        :loading="trabajando || iniciando"
        @click="cambiar"
      >
        <template #icon
          ><NIcon><Power /></NIcon
        ></template>
        {{ encendido ? textos.acciones.apagar : textos.acciones.encender }}
      </NButton>
    </footer>

    <NModal
      v-model:show="dialogoPuerto"
      preset="card"
      :title="t.dialogoPuerto.titulo(nombreServicio(servicio.nombre))"
      size="small"
      :bordered="false"
      :style="estiloDialogo"
      :mask-closable="!ocupado('puerto')"
    >
      <NForm :show-feedback="true" @submit.prevent="guardarPuerto">
        <NFormItem
          :label="t.dialogoPuerto.etiqueta"
          :validation-status="puertoValido ? undefined : 'error'"
          :feedback="
            !puertoValido ? t.dialogoPuerto.rango : puertoIgual ? t.dialogoPuerto.igual : ''
          "
        >
          <NInputNumber
            v-model:value="puertoNuevo"
            :min="1024"
            :max="65535"
            :show-button="false"
            class="campo-puerto"
            autofocus
          />
        </NFormItem>
      </NForm>
      <p class="ayuda">{{ t.dialogoPuerto.ayuda }}</p>
      <template #action>
        <div class="acciones-dialogo">
          <NButton size="small" @click="dialogoPuerto = false">{{
            textos.acciones.cancelar
          }}</NButton>
          <NButton
            size="small"
            type="primary"
            :disabled="!puertoValido || puertoIgual"
            :loading="ocupado('puerto')"
            @click="guardarPuerto"
          >
            {{ t.dialogoPuerto.guardar }}
          </NButton>
        </div>
      </template>
    </NModal>

    <NModal
      v-model:show="dialogoBorrar"
      preset="card"
      :title="t.borrarDatos.titulo(nombreServicio(servicio.nombre))"
      size="small"
      :bordered="false"
      :style="estiloDialogo"
      :mask-closable="!ocupado('borrar')"
    >
      <p class="advertencia">
        <NIcon :size="18"><Warning /></NIcon>
        <span>{{ textoBorrar }}</span>
      </p>
      <p v-if="copiasABorrar && copiasABorrar.n > 0" class="advertencia">
        <NIcon :size="18"><Warning /></NIcon>
        <span>{{
          t.borrarDatos.copias(copiasABorrar.n, formatearTamano(copiasABorrar.bytes))
        }}</span>
      </p>
      <NForm :show-feedback="false" @submit.prevent="borrarDatos">
        <NFormItem :label="t.borrarDatos.pedir(servicio.id)">
          <NInput
            v-model:value="confirmacion"
            :placeholder="servicio.id"
            :input-props="{ spellcheck: false, autocomplete: 'off' }"
            class="campo-confirmar"
          />
        </NFormItem>
      </NForm>
      <template #action>
        <div class="acciones-dialogo">
          <NButton size="small" @click="dialogoBorrar = false">{{
            textos.acciones.cancelar
          }}</NButton>
          <NButton
            size="small"
            type="error"
            :disabled="!confirmado"
            :loading="ocupado('borrar')"
            @click="borrarDatos"
          >
            <template #icon
              ><NIcon><TrashOutline /></NIcon
            ></template>
            {{ t.borrarDatos.boton }}
          </NButton>
        </div>
      </template>
    </NModal>
    <DialogoConexion
      v-if="servicio.id === 'meilisearch'"
      v-model:show="dialogoConexion"
      servicio="meilisearch"
    />
  </article>
</template>

<style scoped>
.instancias {
  margin: 0 0 6px;
  font-size: 12px;
  opacity: 0.76;
}
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.045);
  transition: border-color 0.2s ease;
}
.tarjeta.estado-encendido {
  border-color: rgba(22, 163, 74, 0.4);
}
.tarjeta.estado-error {
  border-color: rgba(220, 38, 38, 0.5);
}
.cabeza {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
.icono {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(var(--acento-rgb), 0.12);
  color: var(--texto-enlace);
  flex: none;
}
.titulo {
  flex: 1 1 96px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.titulo h3 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
}
.version {
  font-size: 12px;
  opacity: 0.72;
}
.version.numero {
  font-family: var(--fuente-mono);
}
.datos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0;
}
.datos dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.72;
}
.datos dd {
  margin: 2px 0 0;
  font-family: var(--fuente-mono);
  font-size: 13px;
}
.puerto {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 8px;
}
.enlace {
  font-family: var(--fuente);
  font-size: 12px;
}
.conflicto {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(217, 119, 6, 0.1);
  border: 1px solid rgba(217, 119, 6, 0.3);
  font-size: 12px;
}
.conflicto-icono {
  color: var(--texto-aviso);
  flex: none;
  margin-top: 1px;
}
.conflicto-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.conflicto-boton {
  align-self: flex-start;
  margin-top: 4px;
}
.detalle-error pre {
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.08);
  font-family: var(--fuente-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
.mensaje {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 12px;
  opacity: 0.76;
}
.opcion {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  cursor: pointer;
}
.opcion-bloque {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ftp-compartir {
  align-self: flex-start;
}
.ayuda {
  margin: 0;
  font-size: 12px;
  opacity: 0.72;
}
.pie {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  min-height: 28px;
  align-items: center;
}
.externo {
  font-size: 12px;
  opacity: 0.76;
}
.campo-puerto {
  width: 160px;
}
.campo-puerto :deep(input),
.campo-confirmar :deep(input) {
  font-family: var(--fuente-mono);
}
.advertencia {
  display: flex;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 13px;
}
.advertencia .n-icon {
  color: var(--texto-error);
  flex: none;
}
.acciones-dialogo {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
