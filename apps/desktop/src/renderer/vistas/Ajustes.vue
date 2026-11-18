<script setup lang="ts">
import { FolderOpen, InformationCircle, LockClosed, Terminal } from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputGroup,
  NInputNumber,
  NSelect,
  NSkeleton,
  useDialog,
  useMessage,
  useNotification,
  type SelectOption,
} from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { PUERTO_ADMINER, type Config, type ResultadoCA } from '../../shared/api';
import { api } from '../api';
import EstadoPunto from '../componentes/EstadoPunto.vue';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';

const t = es.ajustes;
const th = t.https;
const tt = t.herramientas;
const { ejecutar, ocupado } = useAccion();
const message = useMessage();
const notification = useNotification();
const dialog = useDialog();

const config = ref<Config | null>(null);
const carpeta = ref('');
const version = ref('');
const puerto = ref<number | null>(80);
const trabajadores = ref<number | null>(2);

const cambiado = computed(
  () =>
    !!config.value &&
    (puerto.value !== config.value.servicios.nginx.puerto ||
      trabajadores.value !== config.value.servicios.php.trabajadores),
);
const valido = computed(
  () =>
    puerto.value !== null &&
    puerto.value >= 1 &&
    puerto.value <= 65535 &&
    trabajadores.value !== null &&
    trabajadores.value >= 1 &&
    trabajadores.value <= 8,
);

// ---- HTTPS ----
const ca = ref<{ caCreada: boolean; caInstalada: boolean } | null>(null);
const puertoHttps = ref<number | null>(443);
const puertoHttpsValido = computed(
  () =>
    puertoHttps.value === 443 ||
    (puertoHttps.value !== null && puertoHttps.value >= 1024 && puertoHttps.value <= 65535),
);
const puertoHttpsCambiado = computed(
  () => !!config.value && puertoHttps.value !== config.value.https.puerto,
);

// ---- PHP por defecto y PATH ----
const ramasPhp = ref<string[] | null>(null);
/** '' representa "la más reciente instalada" (null en la configuración). */
const phpPorDefecto = ref<string>('');
const opcionesPhp = computed<SelectOption[]>(() => [
  { value: '', label: tt.phpMasReciente },
  ...(ramasPhp.value ?? []).map((r) => ({ value: r, label: `PHP ${r}` })),
]);
const enPath = ref<boolean | null>(null);
/** Error al leer cada sección: uno no deja en blanco a los demás. */
const errores = ref<{ ca?: string; php?: string; path?: string }>({});

onMounted(() => {
  void ejecutar('cargar', async () => {
    const [c, ruta, v] = await Promise.all([
      api().config.leer(),
      api().carpetaDatos(),
      api().sistema.version(),
    ]);
    config.value = c;
    carpeta.value = ruta;
    version.value = v;
    puerto.value = c.servicios.nginx.puerto;
    trabajadores.value = c.servicios.php.trabajadores;
    puertoHttps.value = c.https.puerto;
    phpPorDefecto.value = c.herramientas.phpPorDefecto ?? '';
  });
  void cargarExtra();
});

async function cargarExtra(): Promise<void> {
  const [estadoCa, ramas, path] = await Promise.allSettled([
    api().https.estado(),
    api().instalador.instalados('php'),
    api().path.estado(),
  ]);
  const error = (r: PromiseRejectedResult): string => t.errorSeccion(mensajeDeError(r.reason));
  errores.value = {
    ...(estadoCa.status === 'rejected' ? { ca: error(estadoCa) } : {}),
    ...(ramas.status === 'rejected' ? { php: error(ramas) } : {}),
    ...(path.status === 'rejected' ? { path: error(path) } : {}),
  };
  if (estadoCa.status === 'fulfilled') ca.value = estadoCa.value;
  if (ramas.status === 'fulfilled') ramasPhp.value = ramas.value;
  else ramasPhp.value = [];
  if (path.status === 'fulfilled') enPath.value = path.value;
}

async function guardar(): Promise<void> {
  if (!config.value || !valido.value) return;
  // Solo viajan puerto y trabajadores: el núcleo los guarda en su cola y los aplica.
  const r = await ejecutar('guardar', async () => {
    const res = await api().ajustes.guardar({
      puerto: puerto.value ?? 80,
      trabajadores: trabajadores.value ?? 2,
    });
    return { res, config: await api().config.leer() };
  });
  if (!r) return;
  config.value = r.config;
  const fallos = [
    ...(r.res.aplicar.nginx.ok ? [] : [r.res.aplicar.nginx.salida]),
    ...r.res.errores,
  ];
  if (fallos.length) {
    notification.warning({
      title: t.errorAplicar,
      content: fallos.join('\n'),
      duration: 10000,
      keepAliveOnHover: true,
    });
  } else {
    message.success(t.guardado(r.res.reiniciados));
  }
}

function abrirCarpeta(): void {
  void ejecutar('abrir', () => api().sistema.abrirCarpeta(carpeta.value));
}

function avisarCA(r: ResultadoCA | undefined, exito: string): void {
  if (!r) return;
  if (r.ok) message.success(exito);
  else if (r.motivo === 'cancelado') message.info(th.cancelado);
  else
    notification.error({
      title: th.fallo,
      content: r.mensaje,
      duration: 10000,
      keepAliveOnHover: true,
    });
}

/** Instala (o reinstala) la autoridad en el almacén del usuario; Windows pide confirmar. */
async function instalarCA(): Promise<void> {
  const r = await ejecutar('ca', async () => {
    const res = await api().https.instalarCA();
    ca.value = await api().https.estado();
    return res;
  });
  avisarCA(r, th.instaladaOk);
}

function quitarCA(): void {
  dialog.warning({
    title: th.quitarTitulo,
    content: th.quitarTexto,
    positiveText: th.quitar,
    negativeText: es.acciones.cancelar,
    onPositiveClick: async () => {
      const r = await ejecutar('ca', async () => {
        const res = await api().https.quitarCA();
        ca.value = await api().https.estado();
        return res;
      });
      avisarCA(r, th.quitadaOk);
    },
  });
}

async function guardarPuertoHttps(): Promise<void> {
  const p = puertoHttps.value;
  if (p === null || !puertoHttpsValido.value) return;
  const r = await ejecutar('https', async () => {
    const res = await api().https.cambiarPuerto(p);
    return { res, config: await api().config.leer() };
  });
  if (!r) return;
  config.value = r.config;
  if (r.res.nginx.ok) {
    message.success(th.puertoGuardado(p));
  } else {
    notification.warning({
      title: th.puertoAplicarFallo,
      content: r.res.nginx.salida,
      duration: 10000,
      keepAliveOnHover: true,
    });
  }
}

async function cambiarPhp(valor: string): Promise<void> {
  const antes = phpPorDefecto.value;
  phpPorDefecto.value = valor;
  const ok = await ejecutar(
    'php',
    async () => {
      await api().composer.cambiarPhpPorDefecto(valor === '' ? null : valor);
      return true;
    },
    { exito: tt.phpGuardado },
  );
  if (!ok) phpPorDefecto.value = antes;
}

function cambiarPath(): void {
  if (enPath.value === null) return;
  if (!enPath.value) {
    void aplicarPath(true);
    return;
  }
  dialog.warning({
    title: tt.pathQuitarTitulo,
    content: tt.pathQuitarTexto,
    positiveText: tt.pathQuitar,
    negativeText: es.acciones.cancelar,
    onPositiveClick: () => {
      void aplicarPath(false);
    },
  });
}

async function aplicarPath(activar: boolean): Promise<void> {
  const r = await ejecutar('path', async () => {
    const res = await api().path.cambiar(activar);
    enPath.value = await api().path.estado();
    return res;
  });
  // "Abra una terminal nueva…": las terminales abiertas no ven el PATH nuevo.
  if (r) {
    notification.success({
      title: tt.pathTitulo,
      content: r.aviso,
      duration: 12000,
      keepAliveOnHover: true,
    });
  }
}
</script>

<template>
  <div class="ajustes">
    <p class="descripcion">{{ t.descripcion }}</p>

    <NCard :title="t.general" size="small" class="tarjeta">
      <NForm label-placement="top" :show-feedback="false">
        <NFormItem :label="t.carpetaDatos">
          <div class="campo">
            <NSkeleton v-if="!carpeta" text :height="34" />
            <NInputGroup v-else>
              <NInput :value="carpeta" readonly class="ruta" />
              <NButton secondary :loading="ocupado('abrir')" @click="abrirCarpeta">
                <template #icon
                  ><NIcon><FolderOpen /></NIcon
                ></template>
                {{ es.acciones.abrirCarpeta }}
              </NButton>
            </NInputGroup>
            <small class="ayuda">{{ t.carpetaDatosAyuda }}</small>
          </div>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :title="t.servicios" size="small" class="tarjeta">
      <NForm label-placement="top" :show-feedback="false" :disabled="!config">
        <div class="dos">
          <NFormItem :label="t.puertoNginx">
            <div class="campo">
              <NInputNumber v-model:value="puerto" :min="1" :max="65535" />
              <small class="ayuda">{{ t.puertoNginxAyuda }}</small>
            </div>
          </NFormItem>
          <NFormItem :label="t.trabajadores">
            <div class="campo">
              <NInputNumber v-model:value="trabajadores" :min="1" :max="8" />
              <small class="ayuda">{{ t.trabajadoresAyuda }}</small>
            </div>
          </NFormItem>
        </div>
      </NForm>
      <template #action>
        <div class="pie">
          <span class="nota">
            <NIcon :size="16"><InformationCircle /></NIcon>
            {{ t.nota }}
          </span>
          <NButton
            type="primary"
            size="small"
            :disabled="!cambiado || !valido"
            :loading="ocupado('guardar')"
            @click="guardar"
          >
            {{ es.acciones.guardar }}
          </NButton>
        </div>
      </template>
    </NCard>

    <NCard size="small" class="tarjeta">
      <template #header>
        <span class="titulo-tarjeta">
          <NIcon :size="16"><LockClosed /></NIcon>
          {{ th.titulo }}
        </span>
      </template>
      <NForm label-placement="top" :show-feedback="false">
        <NFormItem :label="th.autoridad">
          <div class="campo">
            <div class="fila-estado">
              <span v-if="errores.ca && !ca" class="ayuda error">{{ errores.ca }}</span>
              <NSkeleton v-else-if="!ca" text :width="140" />
              <EstadoPunto
                v-else
                :estado="ca.caInstalada ? 'encendido' : 'apagado'"
                :etiqueta="ca.caInstalada ? th.instalada : th.noInstalada"
              />
              <div class="botones">
                <NButton
                  v-if="!ca?.caInstalada"
                  size="small"
                  type="primary"
                  :disabled="!ca"
                  :loading="ocupado('ca')"
                  @click="instalarCA"
                >
                  {{ th.instalar }}
                </NButton>
                <template v-else>
                  <NButton size="small" secondary :loading="ocupado('ca')" @click="instalarCA">
                    {{ th.reinstalar }}
                  </NButton>
                  <NButton
                    size="small"
                    secondary
                    type="error"
                    :disabled="ocupado('ca')"
                    @click="quitarCA"
                  >
                    {{ th.quitar }}
                  </NButton>
                </template>
              </div>
            </div>
            <small class="ayuda">{{ th.autoridadAyuda }}</small>
          </div>
        </NFormItem>
        <NFormItem :label="th.puerto" class="separado">
          <div class="campo">
            <div class="fila-estado">
              <NInputNumber
                v-model:value="puertoHttps"
                :min="1"
                :max="65535"
                :disabled="!config"
                :status="puertoHttpsValido ? undefined : 'error'"
                class="numero"
              />
              <NButton
                size="small"
                type="primary"
                :disabled="!puertoHttpsCambiado || !puertoHttpsValido"
                :loading="ocupado('https')"
                @click="guardarPuertoHttps"
              >
                {{ es.acciones.guardar }}
              </NButton>
            </div>
            <small class="ayuda" :class="{ error: !puertoHttpsValido }">
              {{ puertoHttpsValido ? th.puertoAyuda : th.puertoRango }}
            </small>
          </div>
        </NFormItem>
      </NForm>
      <template #action>
        <span class="nota">
          <NIcon :size="16"><InformationCircle /></NIcon>
          <span>
            {{ th.firefox }}
            <code>security.enterprise_roots.enabled</code>.
          </span>
        </span>
      </template>
    </NCard>

    <NCard size="small" class="tarjeta">
      <template #header>
        <span class="titulo-tarjeta">
          <NIcon :size="16"><Terminal /></NIcon>
          {{ tt.titulo }}
        </span>
      </template>
      <NForm label-placement="top" :show-feedback="false">
        <div class="dos">
          <NFormItem :label="tt.phpPorDefecto">
            <div class="campo">
              <NSelect
                :value="phpPorDefecto"
                :options="opcionesPhp"
                :loading="ramasPhp === null || ocupado('php')"
                :disabled="!config || !ramasPhp?.length"
                @update:value="cambiarPhp"
              />
              <small v-if="errores.php" class="ayuda error">{{ errores.php }}</small>
              <small v-else class="ayuda">
                {{ ramasPhp && !ramasPhp.length ? tt.phpSinInstalar : tt.phpPorDefectoAyuda }}
              </small>
            </div>
          </NFormItem>
          <NFormItem :label="tt.adminer">
            <div class="campo">
              <NInput :value="`127.0.0.1:${PUERTO_ADMINER}`" readonly class="ruta" />
              <small class="ayuda">{{ tt.adminerAyuda }}</small>
            </div>
          </NFormItem>
        </div>
        <NFormItem :label="tt.path" class="separado">
          <div class="campo">
            <div class="fila-estado">
              <span v-if="errores.path" class="ayuda error">{{ errores.path }}</span>
              <NSkeleton v-else-if="enPath === null" text :width="140" />
              <EstadoPunto
                v-else
                :estado="enPath ? 'encendido' : 'apagado'"
                :etiqueta="enPath ? tt.pathActivo : tt.pathInactivo"
              />
              <NButton
                size="small"
                :type="enPath ? 'default' : 'primary'"
                :secondary="!!enPath"
                :disabled="enPath === null"
                :loading="ocupado('path')"
                @click="cambiarPath"
              >
                {{ enPath ? tt.pathQuitar : tt.pathAgregar }}
              </NButton>
            </div>
            <small class="ayuda">{{ tt.pathAyuda }}</small>
          </div>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :title="t.acerca" size="small" class="tarjeta">
      <dl class="acerca">
        <dt>{{ es.app.nombre }}</dt>
        <dd>
          {{ t.versionPrograma }} <code>{{ version || '…' }}</code>
        </dd>
      </dl>
    </NCard>
  </div>
</template>

<style scoped>
.descripcion {
  margin: 0 0 18px;
  opacity: 0.65;
}
.tarjeta {
  border-radius: 12px;
  margin-bottom: 14px;
  max-width: 760px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.ruta :deep(input) {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.ayuda {
  font-size: 12px;
  opacity: 0.6;
}
.ayuda.error {
  color: #dc2626;
  opacity: 1;
}
.dos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.nota {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  opacity: 0.75;
}
.nota code {
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.titulo-tarjeta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.fila-estado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
}
.fila-estado .numero {
  width: 160px;
  margin-right: auto;
}
.botones {
  display: flex;
  gap: 8px;
}
.separado {
  margin-top: 16px;
}
.acerca {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
}
.acerca dt {
  font-weight: 600;
}
.acerca dd {
  margin: 0;
  opacity: 0.75;
}
.acerca code {
  font-family: var(--fuente-mono);
}
</style>
