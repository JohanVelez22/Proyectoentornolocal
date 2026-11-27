<script setup lang="ts">
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Key,
  Open,
  Power,
  QrCode,
  Warning,
} from '@vicons/ionicons5';
import { NButton, NIcon, NSkeleton, NSwitch, NTooltip, useDialog } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Credenciales, Sitio } from '../../shared/api';
import { api } from '../api';
import { solicitudes } from '../composables/solicitudes';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import DialogoQr from './DialogoQr.vue';

const props = defineProps<{ sitio: Sitio }>();

const t = textos.ftpSitio;
const HOST = '127.0.0.1';
const PUERTO_FTP_POR_DEFECTO = 2121;

const router = useRouter();
const servicios = useServicios();
const sitios = useSitios();
const dialog = useDialog();
const { ejecutar, ocupado } = useAccion();

const activo = computed(() => props.sitio.ftp?.activo === true);
const soloLectura = computed(() => props.sitio.ftp?.soloLectura === true);
const servidor = computed(() => servicios.porId['ftp']);
const puerto = computed(() => servidor.value?.puertos[0] ?? PUERTO_FTP_POR_DEFECTO);
const servidorEncendido = computed(() => servidor.value?.estado === 'encendido');
const redLocal = computed(() => servicios.redLocalFtp === true);
const cambiando = computed(() => ocupado('activar') || ocupado('desactivar'));
const idPanel = computed(() => `ftp-${props.sitio.id}`);

/** La clave solo está en memoria mientras la sección está desplegada. */
const abierto = ref(false);
const credenciales = ref<Credenciales | null>(null);
const verClave = ref(false);

watch(abierto, async (v) => {
  verClave.value = false;
  if (!v) {
    credenciales.value = null;
    return;
  }
  if (credenciales.value) return;
  const c = await ejecutar('credenciales', () => api().ftp.credenciales(props.sitio.id));
  // Si se plegó mientras llegaba, no se guarda.
  if (abierto.value) credenciales.value = c ?? null;
});

// Si el acceso se quita (aquí o desde otro lado), la sección se pliega y olvida la clave.
watch(activo, (v) => {
  if (!v) abierto.value = false;
});

/** El núcleo no emite `sitio:cambio` al tocar el FTP: se vuelve a leer la lista. */
async function refrescarSitios(): Promise<void> {
  sitios.aplicar(await api().sitios.listar());
}

function cambiar(valor: boolean): void {
  if (cambiando.value) return;
  if (valor) void activar();
  else confirmarDesactivar();
}

async function activar(): Promise<void> {
  const c = await ejecutar(
    'activar',
    async () => {
      const cred = await api().ftp.activar(props.sitio.id);
      await refrescarSitios();
      return cred;
    },
    { exito: t.activado },
  );
  if (!c) return;
  credenciales.value = c;
  abierto.value = true;
}

function confirmarDesactivar(): void {
  dialog.warning({
    title: t.desactivarTitulo,
    content: t.desactivarTexto,
    positiveText: t.desactivar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      await ejecutar(
        'desactivar',
        async () => {
          await api().ftp.desactivar(props.sitio.id);
          await refrescarSitios();
        },
        { exito: t.desactivado },
      );
    },
  });
}

function confirmarRegenerar(): void {
  if (ocupado('regenerar')) return;
  dialog.warning({
    title: t.regenerarTitulo,
    content: t.regenerarTexto,
    positiveText: t.regenerar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: async () => {
      const clave = await ejecutar('regenerar', () => api().ftp.regenerarClave(props.sitio.id), {
        exito: t.regenerada,
      });
      if (clave && credenciales.value && abierto.value) {
        credenciales.value = { ...credenciales.value, clave };
      }
    },
  });
}

async function cambiarSoloLectura(valor: boolean): Promise<void> {
  if (ocupado('soloLectura')) return;
  await ejecutar(
    'soloLectura',
    async () => {
      await api().ftp.soloLectura(props.sitio.id, valor);
      await refrescarSitios();
    },
    { exito: valor ? t.soloLecturaActivado : t.soloLecturaDesactivado },
  );
}

function encenderServidor(): void {
  if (ocupado('encender')) return;
  void ejecutar('encender', () => api().servicios.iniciar('ftp'));
}

/** Dirección `ftp://usuario@host:puerto/` del sitio; nunca lleva la clave. */
const urlFtp = ref<string | null>(null);
const verQr = ref(false);

watch(
  [abierto, redLocal, puerto, () => props.sitio.ftp?.usuario],
  async ([v]) => {
    if (!v) {
      urlFtp.value = null;
      verQr.value = false;
      return;
    }
    const u = await ejecutar('url', () => api().ftp.url(props.sitio.id));
    if (abierto.value) urlFtp.value = u ?? null;
  },
  { immediate: true },
);

/** FTP no se comparte por túnel: la alternativa es Herramientas › Compartir carpeta o archivo. */
function irACompartir(): void {
  solicitudes.herramienta = 'compartir';
  void router.push({ name: 'herramientas' });
}

function abrirCliente(): void {
  const u = urlFtp.value;
  if (!u) return;
  void ejecutar('abrirUrl', () => api().sistema.abrirUrl(u), { tituloError: t.abrirUrl });
}

function copiar(texto: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(texto), { exito: textos.acciones.copiado });
}

const filas = computed(() => {
  const c = credenciales.value;
  if (!c) return [];
  return [
    { clave: 'host', etiqueta: t.host, valor: HOST, secreto: false },
    { clave: 'puerto', etiqueta: t.puerto, valor: String(puerto.value), secreto: false },
    { clave: 'usuario', etiqueta: t.usuario, valor: c.usuario, secreto: false },
    { clave: 'clave', etiqueta: t.clave, valor: c.clave, secreto: true },
  ];
});
</script>

<template>
  <div class="ftp">
    <div class="cabeza">
      <span class="interruptor">
        <NSwitch
          size="small"
          :value="activo"
          :loading="cambiando"
          :disabled="cambiando"
          :aria-label="t.interruptor(sitio.dominio)"
          @update:value="cambiar"
        />
        <span class="etiqueta">{{ t.etiqueta }}</span>
      </span>
      <div class="detalle">
        <template v-if="activo">
          <span class="tenue">
            {{ t.activoAyuda }}
            <template v-if="soloLectura"> · {{ t.soloLecturaEtiqueta }}</template>
          </span>
          <NButton
            text
            size="tiny"
            type="primary"
            class="desplegar"
            :aria-expanded="abierto"
            :aria-controls="idPanel"
            @click="abierto = !abierto"
          >
            {{ abierto ? t.ocultarDatos : t.mostrarDatos }}
            <NIcon class="chevron" :class="{ girado: abierto }" aria-hidden="true"
              ><ChevronDown
            /></NIcon>
          </NButton>
        </template>
        <span v-else class="tenue">{{ t.apagadoAyuda }}</span>
      </div>
    </div>

    <div class="compartir-nota">
      <small class="tenue">{{ t.compartirNota }}</small>
      <NButton size="tiny" text type="primary" data-testid="ftp-ir-compartir" @click="irACompartir">
        {{ t.compartirIr }}
      </NButton>
    </div>

    <div v-if="activo && abierto" :id="idPanel" class="panel">
      <div v-if="!servidorEncendido" class="aviso" role="status">
        <NIcon class="aviso-icono" aria-hidden="true"><Power /></NIcon>
        <span>{{ t.servidorApagado }}</span>
        <NButton
          size="tiny"
          type="primary"
          secondary
          :loading="ocupado('encender') || servidor?.estado === 'iniciando'"
          :disabled="servidor?.estado === 'iniciando'"
          @click="encenderServidor"
        >
          {{ t.encender }}
        </NButton>
      </div>

      <div v-if="ocupado('credenciales')" :aria-label="t.cargando" aria-busy="true">
        <NSkeleton text :repeat="2" />
      </div>
      <dl v-else-if="credenciales" class="datos">
        <div v-for="f in filas" :key="f.clave" class="dato">
          <dt>{{ f.etiqueta }}</dt>
          <dd>
            <code>{{ f.secreto && !verClave ? '••••••••••••' : f.valor }}</code>
            <NTooltip v-if="f.secreto">
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :aria-label="verClave ? t.ocultarClave : t.mostrarClave"
                  @click="verClave = !verClave"
                >
                  <template #icon>
                    <NIcon><EyeOff v-if="verClave" /><Eye v-else /></NIcon>
                  </template>
                </NButton>
              </template>
              {{ verClave ? t.ocultarClave : t.mostrarClave }}
            </NTooltip>
            <NTooltip>
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :aria-label="t.copiarDato(f.etiqueta.toLowerCase())"
                  @click="copiar(f.valor)"
                >
                  <template #icon
                    ><NIcon><Copy /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.copiarDato(f.etiqueta.toLowerCase()) }}
            </NTooltip>
          </dd>
          <small v-if="f.clave === 'host' && redLocal" class="tenue">{{ t.redLocalHost }}</small>
        </div>
      </dl>

      <div v-if="urlFtp" class="url-fila">
        <span class="url-etiqueta">{{ t.urlEtiqueta }}</span>
        <code class="url">{{ urlFtp }}</code>
        <NTooltip>
          <template #trigger>
            <NButton size="tiny" quaternary circle :aria-label="t.abrirUrl" @click="abrirCliente">
              <template #icon
                ><NIcon><Open /></NIcon
              ></template>
            </NButton>
          </template>
          {{ t.abrirUrl }}
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <NButton
              size="tiny"
              quaternary
              circle
              :aria-label="t.copiarUrl"
              @click="copiar(urlFtp)"
            >
              <template #icon
                ><NIcon><Copy /></NIcon
              ></template>
            </NButton>
          </template>
          {{ t.copiarUrl }}
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <NButton size="tiny" quaternary circle :aria-label="t.verQr" @click="verQr = true">
              <template #icon
                ><NIcon><QrCode /></NIcon
              ></template>
            </NButton>
          </template>
          {{ t.verQr }}
        </NTooltip>
        <small class="tenue url-ayuda">{{ t.urlAyuda }}</small>
      </div>
      <DialogoQr
        v-if="urlFtp"
        v-model:show="verQr"
        :texto="urlFtp"
        :titulo="t.qrTitulo"
        :aviso="t.qrAviso"
      />

      <div v-if="redLocal" class="aviso alerta" role="note">
        <NIcon class="aviso-icono" aria-hidden="true"><Warning /></NIcon>
        <span>{{ t.redLocalAviso }}</span>
      </div>

      <div class="acciones">
        <NButton
          size="small"
          secondary
          :loading="ocupado('regenerar')"
          :disabled="!credenciales"
          @click="confirmarRegenerar"
        >
          <template #icon
            ><NIcon><Key /></NIcon
          ></template>
          {{ t.regenerar }}
        </NButton>
        <div class="solo-lectura">
          <NSwitch
            size="small"
            :value="soloLectura"
            :loading="ocupado('soloLectura')"
            :disabled="ocupado('soloLectura')"
            :aria-label="t.soloLectura"
            @update:value="cambiarSoloLectura"
          />
          <span>
            <strong>{{ t.soloLectura }}</strong>
            <small class="tenue">{{ t.soloLecturaAyuda }}</small>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ftp {
  font-size: 12.5px;
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 28px;
}
.interruptor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.etiqueta {
  font-weight: 500;
  opacity: 0.75;
}
.detalle {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  min-width: 0;
  flex: 1;
}
.tenue {
  opacity: 0.72;
}
.compartir-nota small {
  font-size: 12px;
}
.compartir-nota {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 10px;
  margin-top: 2px;
}
.desplegar {
  font-size: 12px;
}
.chevron {
  margin-left: 2px;
  transition: transform 0.15s ease;
}
.chevron.girado {
  transform: rotate(180deg);
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(128, 128, 128, 0.06);
}
.aviso {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.aviso-icono {
  opacity: 0.76;
}
.aviso.alerta {
  color: var(--texto-aviso);
}
.aviso.alerta .aviso-icono {
  opacity: 1;
}
.datos {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 16px;
  margin: 0;
}
.dato dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.72;
}
.dato dd {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 2px 0 0;
  min-width: 0;
}
.dato code {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 4px;
}
.url-fila {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
}
.url-etiqueta {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.72;
  margin-right: 4px;
}
.url {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.url-ayuda {
  flex-basis: 100%;
}
.acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 20px;
}
.solo-lectura {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.solo-lectura span {
  display: flex;
  flex-direction: column;
}
.solo-lectura strong {
  font-weight: 500;
}
@media (max-width: 900px) {
  .datos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>
