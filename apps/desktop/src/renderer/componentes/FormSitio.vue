<script setup lang="ts">
import { CodeSlash, FolderOpen, LockClosed, Sparkles } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCollapse,
  NCollapseItem,
  NDrawer,
  NDrawerContent,
  NDynamicTags,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputGroup,
  NInputNumber,
  NSelect,
  NSpin,
  NSwitch,
  NTag,
  useMessage,
  useNotification,
  type SelectOption,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { DatosSitio, ResultadoAplicar } from '../../shared/api';
import { api, plano } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useHttps } from '../stores/https';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import {
  SUFIJO,
  TIPOS,
  armarDominio,
  baseDominio,
  elegirPhp,
  limpiarDatos,
  nombreDeCarpeta,
  normalizarAlias,
  redirigirHabilitado,
  sitioVacio,
  usaPhp,
  usaProxy,
  validarFormularioSitio,
  type CampoSitio,
  type ObjetivoForm,
} from '../utilidades/sitios';

const props = defineProps<{ objetivo: ObjetivoForm | null }>();
const emit = defineEmits<{
  cerrar: [];
  /** Se emite tras cada guardado (también si Nginx falló) para mostrar el aviso de hosts. */
  aplicado: [resultado: ResultadoAplicar];
}>();

const t = textos.formSitio;
const th = textos.formSitioHttps;
const router = useRouter();
const message = useMessage();
const notification = useNotification();
const https = useHttps();
const servicios = useServicios();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

const datos = ref<DatosSitio>(sitioVacio());
/** Id del sitio guardado: al editar, o tras un primer guardado en el que Nginx falló. */
const id = ref<string | undefined>(undefined);
const intentado = ref(false);
const guardando = ref(false);
const errorServidor = ref<string | null>(null);
const salidaNginx = ref<string | null>(null);
const detectado = ref<string | null>(null);
const avisoPhp = ref<string | null>(null);
/** Al editar, la carpeta cambió y no se volvió a detectar el proyecto. */
const carpetaCambiada = ref(false);
/** Nombre puesto automáticamente desde la carpeta (se reemplaza si cambia la carpeta). */
let nombreAuto = '';

const visible = computed(() => props.objetivo !== null);
const modo = computed(() => props.objetivo?.modo ?? 'nuevo');
const titulo = computed(() =>
  modo.value === 'editar'
    ? t.tituloEditar
    : modo.value === 'duplicar'
      ? t.tituloDuplicar
      : t.tituloNuevo,
);
const sinCarpeta = computed(() => !datos.value.carpeta);
const detectando = computed(() => ocupado('detectar') || ocupado('elegir'));

const phpInstalados = computed(() => servicios.instalados['php']);
const opcionesPhp = computed<SelectOption[]>(() => {
  const lista = [...(phpInstalados.value ?? [])].sort((a, b) =>
    b.localeCompare(a, 'es', { numeric: true }),
  );
  const actual = datos.value.php;
  if (actual && !lista.includes(actual)) lista.push(actual);
  return lista.map((v) => ({ value: v, label: textos.sitios.php(v) }));
});
const opcionesTipo: SelectOption[] = TIPOS.map((tipo) => ({
  value: tipo,
  label: textos.sitios.tipos[tipo],
}));
const opcionesUrlBase: SelectOption[] = [
  { value: 'APP_URL', label: 'APP_URL' },
  { value: 'APP_BASE_URL', label: 'APP_BASE_URL' },
];

const dominioBase = computed({
  get: () => baseDominio(datos.value.dominio),
  set: (v: string) => {
    datos.value.dominio = armarDominio(v.replace(/\s+/g, '-'));
  },
});

const otros = computed(() => sitios.lista.filter((s) => s.id !== id.value));
const errores = computed(() => validarFormularioSitio(datos.value, otros.value));
const hayErrores = computed(() => Object.keys(errores.value).length > 0);
const error = (campo: CampoSitio): string | undefined =>
  intentado.value ? errores.value[campo] : undefined;

function reiniciar(o: ObjetivoForm): void {
  intentado.value = false;
  guardando.value = false;
  errorServidor.value = null;
  salidaNginx.value = null;
  detectado.value = null;
  avisoPhp.value = null;
  carpetaCambiada.value = false;
  if (o.modo === 'editar') {
    const { id: idSitio, ...resto } = o.sitio;
    id.value = idSitio;
    datos.value = plano(resto);
  } else {
    id.value = undefined;
    datos.value = o.modo === 'duplicar' ? plano(o.datos) : sitioVacio();
  }
  nombreAuto = datos.value.nombre;
  void ejecutar('php', () => servicios.cargarInstalados('php'));
  void https.cargar();
}

watch(
  () => props.objetivo,
  (o) => {
    if (o) reiniciar(o);
  },
  { immediate: true },
);

/* Si el tipo pasa a usar PHP y no hay versión, se propone la más nueva instalada. */
watch(
  () => [datos.value.tipo, phpInstalados.value] as const,
  ([tipo, instaladas]) => {
    if (usaPhp(tipo) && !datos.value.php && instaladas?.length) {
      datos.value.php = elegirPhp(null, instaladas).php;
    }
  },
);

async function elegirCarpeta(): Promise<void> {
  const carpeta = await ejecutar('elegir', () => api().sistema.elegirCarpeta());
  if (!carpeta) return;
  datos.value.carpeta = carpeta;
  if (!datos.value.nombre || datos.value.nombre === nombreAuto) {
    nombreAuto = nombreDeCarpeta(carpeta);
    datos.value.nombre = nombreAuto;
  }
  // Al editar solo se cambia la ruta: el resto ya lo eligió el usuario.
  if (modo.value === 'editar') {
    carpetaCambiada.value = true;
    return;
  }
  const r = await ejecutar('detectar', () => api().detectarProyecto(carpeta));
  if (!r) return;
  datos.value.tipo = r.tipo;
  datos.value.urlBaseVar = r.urlBaseVar;
  if (modo.value === 'nuevo' || !datos.value.dominio) datos.value.dominio = r.sugerenciaDominio;
  detectado.value = textos.sitios.tipos[r.tipo] ?? r.tipo;
  const instaladas =
    phpInstalados.value ?? (await ejecutar('php', () => servicios.cargarInstalados('php'))) ?? [];
  const elegido = elegirPhp(r.php, instaladas);
  datos.value.php = usaPhp(r.tipo) ? elegido.php : null;
  avisoPhp.value =
    usaPhp(r.tipo) && elegido.noInstalada && elegido.php
      ? t.phpNoInstalada(elegido.noInstalada, elegido.php)
      : null;
}

/* ───── HTTPS ───── */

const puedeRedirigir = computed(() => redirigirHabilitado(datos.value));
/** Solo se ofrece instalar la autoridad cuando se pidió HTTPS y se sabe que falta. */
const faltaAutoridad = computed(
  () => datos.value.https && https.estado !== null && !https.estado.caInstalada,
);

// Sin HTTPS no hay redirección posible: el interruptor se apaga y se deshabilita.
watch(
  () => datos.value.https,
  (activo) => {
    if (!activo) datos.value.redirigirHttps = false;
    else void https.cargar();
  },
);

/** Crea (si falta) e instala la autoridad en el almacén del usuario; Windows pide confirmar. */
async function instalarCA(): Promise<void> {
  if (ocupado('ca')) return;
  const r = await ejecutar('ca', async () => {
    const res = await api().https.instalarCA();
    await https.cargar();
    return res;
  });
  if (!r) return;
  if (r.ok) message.success(th.instalada);
  else if (r.motivo === 'cancelado') message.info(th.cancelado);
  else
    notification.error({
      title: th.fallo,
      content: r.mensaje,
      duration: 10000,
      keepAliveOnHover: true,
    });
}

function crearAlias(texto: string): string {
  return normalizarAlias(texto);
}

watch(
  () => datos.value.alias,
  (alias) => {
    if (alias.some((a) => !a)) datos.value.alias = alias.filter(Boolean);
  },
);

function irAInstalarPhp(): void {
  emit('cerrar');
  void router.push({ name: 'servicios' });
}

async function guardar(): Promise<void> {
  intentado.value = true;
  errorServidor.value = null;
  if (hayErrores.value || guardando.value) return;
  guardando.value = true;
  try {
    const limpio = plano(limpiarDatos(datos.value));
    const r = await api().sitios.guardar(limpio, id.value);
    id.value = r.sitio.id;
    datos.value.nombre = r.sitio.nombre;
    emit('aplicado', r.aplicar);
    if (!r.aplicar.nginx.ok) {
      salidaNginx.value = r.aplicar.nginx.salida;
      return;
    }
    salidaNginx.value = null;
    message.success(t.guardado(r.sitio.nombre || r.sitio.dominio));
    emit('cerrar');
  } catch (e) {
    errorServidor.value = mensajeDeError(e);
  } finally {
    guardando.value = false;
  }
}

function alCambiarVisible(v: boolean): void {
  if (!v) emit('cerrar');
}
</script>

<template>
  <NDrawer
    :show="visible"
    placement="right"
    :width="520"
    :mask-closable="!guardando"
    :close-on-esc="!guardando"
    :auto-focus="false"
    @update:show="alCambiarVisible"
  >
    <NDrawerContent
      :title="titulo"
      closable
      :native-scrollbar="false"
      body-content-class="cuerpo-form"
    >
      <NAlert v-if="modo === 'duplicar' && usaProxy(datos.tipo)" type="warning" class="alerta">
        {{ t.duplicarProxy }}
      </NAlert>
      <NAlert v-if="errorServidor" type="error" :title="t.errorGuardar" class="alerta" closable>
        {{ errorServidor }}
      </NAlert>
      <NAlert v-if="salidaNginx" type="error" :title="t.nginxFallo" class="alerta">
        <p class="ayuda-alerta">{{ t.nginxFalloAyuda }}</p>
        <pre class="salida">{{ salidaNginx }}</pre>
      </NAlert>

      <!-- Paso 1: sin carpeta todavía. -->
      <div v-if="sinCarpeta" class="paso">
        <div class="paso-icono" aria-hidden="true">
          <NIcon :size="26"><FolderOpen /></NIcon>
        </div>
        <h3>{{ t.paso }}</h3>
        <p>{{ t.pasoAyuda }}</p>
        <NButton type="primary" size="large" :loading="detectando" @click="elegirCarpeta">
          <template #icon
            ><NIcon><FolderOpen /></NIcon
          ></template>
          {{ t.elegirCarpeta }}
        </NButton>
        <p v-if="error('carpeta')" class="error-campo">{{ error('carpeta') }}</p>
      </div>

      <NSpin v-else :show="ocupado('detectar')" :description="t.detectando">
        <NForm label-placement="top" :disabled="guardando" class="form" @submit.prevent="guardar">
          <NFormItem
            :label="t.carpeta"
            :feedback="error('carpeta')"
            :validation-status="error('carpeta') ? 'error' : undefined"
          >
            <div class="campo">
              <NInputGroup>
                <NInput :value="datos.carpeta" readonly class="mono" :title="datos.carpeta" />
                <NButton secondary :loading="detectando" @click="elegirCarpeta">
                  {{ t.cambiarCarpeta }}
                </NButton>
              </NInputGroup>
              <div class="pistas">
                <NTag v-if="detectado" size="small" type="success" :bordered="false">
                  <template #icon
                    ><NIcon><Sparkles /></NIcon
                  ></template>
                  {{ t.detectado(detectado) }}
                </NTag>
                <small v-if="datos.tipo === 'laravel'" class="ayuda">{{ t.raizLaravel }}</small>
                <small v-if="carpetaCambiada" class="ayuda aviso-carpeta">
                  {{ t.sinDeteccionAlEditar }}
                </small>
              </div>
            </div>
          </NFormItem>

          <div class="dos">
            <NFormItem :label="t.nombre">
              <NInput v-model:value="datos.nombre" :placeholder="nombreDeCarpeta(datos.carpeta)" />
            </NFormItem>
            <NFormItem
              :label="t.dominio"
              :feedback="error('dominio')"
              :validation-status="error('dominio') ? 'error' : undefined"
            >
              <NInput v-model:value="dominioBase" :placeholder="t.dominioPlaceholder" class="mono">
                <template #suffix>
                  <span class="sufijo">{{ SUFIJO }}</span>
                </template>
              </NInput>
            </NFormItem>
          </div>

          <NFormItem
            :label="t.alias"
            :feedback="error('alias')"
            :validation-status="error('alias') ? 'error' : undefined"
          >
            <div class="campo">
              <NDynamicTags v-model:value="datos.alias" :on-create="crearAlias" class="alias">
                <template #trigger="{ activate, disabled }">
                  <NButton size="small" dashed :disabled="disabled" @click="activate()">
                    {{ t.aliasAgregar }}
                  </NButton>
                </template>
              </NDynamicTags>
              <small class="ayuda">{{ t.aliasAyuda }}</small>
            </div>
          </NFormItem>

          <div class="dos">
            <NFormItem :label="t.tipo">
              <NSelect v-model:value="datos.tipo" :options="opcionesTipo" />
            </NFormItem>

            <NFormItem
              v-if="usaPhp(datos.tipo)"
              :label="t.php"
              :feedback="error('php')"
              :validation-status="error('php') ? 'error' : undefined"
            >
              <div class="campo">
                <NSelect
                  v-model:value="datos.php"
                  :options="opcionesPhp"
                  :placeholder="t.phpElegir"
                  :loading="ocupado('php')"
                  :disabled="!opcionesPhp.length"
                />
                <small v-if="phpInstalados && !phpInstalados.length" class="ayuda">
                  {{ t.phpNinguno }}
                  <NButton text type="primary" size="tiny" @click="irAInstalarPhp">
                    {{ t.phpInstalar }}
                  </NButton>
                </small>
              </div>
            </NFormItem>

            <NFormItem
              v-else-if="usaProxy(datos.tipo)"
              :label="t.puertoProxy"
              :feedback="error('puertoProxy')"
              :validation-status="error('puertoProxy') ? 'error' : undefined"
            >
              <NInputNumber
                v-model:value="datos.puertoProxy"
                :min="1"
                :max="65535"
                :show-button="false"
                placeholder="5173"
                class="ancho"
              />
            </NFormItem>
          </div>
          <NAlert
            v-if="avisoPhp && usaPhp(datos.tipo)"
            type="info"
            :show-icon="false"
            class="aviso-php"
          >
            {{ avisoPhp }}
          </NAlert>
          <small v-if="usaProxy(datos.tipo)" class="ayuda bloque">{{ t.puertoProxyAyuda }}</small>

          <NFormItem
            :label="t.urlBaseVar"
            :feedback="error('urlBaseVar')"
            :validation-status="error('urlBaseVar') ? 'error' : undefined"
          >
            <div class="campo">
              <NSelect
                v-model:value="datos.urlBaseVar"
                :options="opcionesUrlBase"
                :placeholder="t.urlBaseVarNinguna"
                filterable
                tag
                clearable
                class="mono"
              />
              <small class="ayuda">{{ t.urlBaseVarAyuda }}</small>
            </div>
          </NFormItem>

          <div class="interruptor-reales" :class="{ activo: datos.datosReales }">
            <div>
              <strong>{{ t.datosReales }}</strong>
              <small class="ayuda">{{ t.datosRealesAyuda }}</small>
            </div>
            <NSwitch v-model:value="datos.datosReales" :aria-label="t.datosReales" />
          </div>

          <section class="https" :class="{ activo: datos.https }" :aria-label="th.titulo">
            <div class="https-fila">
              <span class="https-icono" aria-hidden="true"
                ><NIcon :size="16"><LockClosed /></NIcon
              ></span>
              <div class="https-texto">
                <strong>{{ th.https }}</strong>
                <small class="ayuda">{{ th.httpsAyuda }}</small>
              </div>
              <NSwitch v-model:value="datos.https" :aria-label="th.https" />
            </div>
            <div class="https-fila" :class="{ deshabilitada: !puedeRedirigir }">
              <span class="https-icono vacio" aria-hidden="true" />
              <div class="https-texto">
                <strong>{{ th.redirigir }}</strong>
                <small class="ayuda">{{
                  puedeRedirigir ? th.redirigirAyuda : th.redirigirDeshabilitado
                }}</small>
              </div>
              <NSwitch
                v-model:value="datos.redirigirHttps"
                :disabled="!puedeRedirigir"
                :aria-label="th.redirigir"
              />
            </div>
            <NAlert
              v-if="faltaAutoridad"
              type="warning"
              :title="th.sinAutoridadTitulo"
              class="https-alerta"
            >
              <p class="https-alerta-texto">{{ th.sinAutoridadTexto }}</p>
              <NButton size="small" type="primary" :loading="ocupado('ca')" @click="instalarCA">
                {{ th.instalar }}
              </NButton>
            </NAlert>
          </section>

          <NFormItem :label="t.nota">
            <NInput
              v-model:value="datos.nota"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              :placeholder="t.notaPlaceholder"
            />
          </NFormItem>

          <NCollapse
            class="avanzado"
            :default-expanded-names="datos.reglasExtra ? ['avanzado'] : []"
          >
            <NCollapseItem name="avanzado">
              <template #header>
                <span class="avanzado-titulo">
                  <NIcon><CodeSlash /></NIcon>
                  {{ t.avanzado }}
                </span>
              </template>
              <NFormItem :label="t.reglasExtra" :show-feedback="false">
                <div class="campo">
                  <NInput
                    v-model:value="datos.reglasExtra"
                    type="textarea"
                    class="mono reglas"
                    :autosize="{ minRows: 5, maxRows: 14 }"
                    :placeholder="t.reglasExtraEjemplo"
                    spellcheck="false"
                  />
                  <small class="ayuda">{{ t.reglasExtraAyuda }}</small>
                </div>
              </NFormItem>
            </NCollapseItem>
          </NCollapse>
        </NForm>
      </NSpin>

      <template #footer>
        <div class="pie">
          <NButton :disabled="guardando" @click="emit('cerrar')">{{
            textos.acciones.cancelar
          }}</NButton>
          <NButton
            type="primary"
            :loading="guardando"
            :disabled="sinCarpeta || detectando || (intentado && hayErrores)"
            @click="guardar"
          >
            {{ t.guardar }}
          </NButton>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.alerta {
  margin-bottom: 16px;
}
.ayuda-alerta {
  margin: 0 0 8px;
}
.salida {
  margin: 0;
  padding: 10px 12px;
  max-height: 220px;
  overflow: auto;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.08);
  font-family: var(--fuente-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
.paso {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 48px 24px;
  border: 1px dashed rgba(128, 128, 128, 0.35);
  border-radius: 12px;
}
.paso-icono {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(var(--acento-rgb), 0.12);
  color: #6470e0;
  margin-bottom: 6px;
}
.paso h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.paso p {
  margin: 0 0 12px;
  max-width: 340px;
  font-size: 13px;
  opacity: 0.7;
}
.error-campo {
  color: #dc2626;
  font-size: 12px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.pistas {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.dos {
  display: grid;
  align-items: start;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
}
.mono :deep(input),
.mono :deep(textarea),
.mono :deep(.n-base-selection-label),
.mono :deep(.n-base-selection-input__content) {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.reglas :deep(textarea) {
  font-size: 12px;
  line-height: 1.55;
}
.sufijo {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  opacity: 0.55;
}
.ayuda {
  font-size: 12px;
  opacity: 0.65;
}
.ayuda.bloque {
  display: block;
  margin: -14px 0 18px;
}
.aviso-carpeta {
  color: #d97706;
  opacity: 1;
}
.ancho {
  width: 100%;
}
.aviso-php {
  margin: -8px 0 18px;
  font-size: 12.5px;
}
.interruptor-reales {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}
.interruptor-reales.activo {
  border-color: rgba(220, 38, 38, 0.45);
  background: rgba(220, 38, 38, 0.06);
}
.interruptor-reales > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.interruptor-reales strong {
  font-size: 13.5px;
  font-weight: 600;
}
.https {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}
.https.activo {
  border-color: rgba(22, 163, 74, 0.4);
  background: rgba(22, 163, 74, 0.05);
}
.https-fila {
  display: flex;
  align-items: center;
  gap: 12px;
}
.https-fila.deshabilitada .https-texto {
  opacity: 0.55;
}
.https-icono {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  flex: none;
}
.https.activo .https-icono:not(.vacio) {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.14);
}
.https-icono.vacio {
  background: transparent;
}
.https-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.https-texto strong {
  font-size: 13.5px;
  font-weight: 600;
}
.https-alerta-texto {
  margin: 0 0 8px;
  font-size: 12.5px;
}
.avanzado-titulo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
