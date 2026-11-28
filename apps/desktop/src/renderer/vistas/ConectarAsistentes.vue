<script setup lang="ts">
import {
  CopyOutline,
  FolderOpenOutline,
  InformationCircleOutline,
  Refresh,
} from '@vicons/ionicons5';
import { NAlert, NButton, NIcon, NModal, NSkeleton, NSpin, NTag, useMessage } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { EstadoAsistente, VistaPreviaAsistente } from '../../shared/api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useAsistentes } from '../stores/asistentes';

/**
 * Conectar asistentes: una fila por cliente de MCP. Escribir en su configuración siempre pasa por
 * una vista previa con las líneas que cambian y la confirmación del diálogo.
 */
const t = textos.asistentes;
const asistentes = useAsistentes();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

onMounted(() => void ejecutar('cargar', () => asistentes.cargar()));

interface Pedido {
  asistente: EstadoAsistente;
  accion: 'conectar' | 'quitar';
  vista: VistaPreviaAsistente | null;
}
const pedido = ref<Pedido | null>(null);

const titulo = computed(() => {
  const p = pedido.value;
  if (!p) return '';
  return p.accion === 'conectar'
    ? t.titulo(p.asistente.nombre)
    : t.tituloQuitar(p.asistente.nombre);
});

async function pedir(a: EstadoAsistente, accion: 'conectar' | 'quitar'): Promise<void> {
  pedido.value = { asistente: a, accion, vista: null };
  const vista = await ejecutar(`vista:${a.id}`, () => asistentes.vistaPrevia(a.id, accion));
  if (!pedido.value || pedido.value.asistente.id !== a.id) return;
  if (!vista) pedido.value = null;
  else pedido.value = { ...pedido.value, vista };
}

/** Única vía a escribir: el botón del diálogo, con la huella mostrada y `true` explícito. */
function confirmar(): void {
  const p = pedido.value;
  if (!p?.vista) return;
  pedido.value = null;
  const { id, nombre } = p.asistente;
  const huella = p.vista.huella;
  void ejecutar(`aplicar:${id}`, async () => {
    const r = await asistentes.aplicar(id, p.accion, huella, true);
    if (!r.cambiado) message.info(t.hSinCambios);
    else message.success(p.accion === 'conectar' ? t.hConectado(nombre) : t.hQuitado(nombre));
    if (r.respaldo) message.info(t.hCopia(r.respaldo), { duration: 8000 });
    if (r.tokenEscrito) message.warning(t.hTokenEscrito, { duration: 10000 });
  });
}

function copiar(a: EstadoAsistente): void {
  void ejecutar(`copiar:${a.id}`, async () => {
    await asistentes.copiarConfiguracion(a.id);
    message.success(t.hCopiada);
  });
}

const tipoEstado = (a: EstadoAsistente): 'success' | 'warning' | 'default' =>
  a.estado === 'conectado' ? 'success' : a.estado === 'instalado' ? 'warning' : 'default';
const textoEstado = (a: EstadoAsistente): string =>
  a.estado === 'conectado' ? t.conectado : a.estado === 'instalado' ? t.instalado : t.noInstalado;

const sinCambios = computed(() => pedido.value?.vista?.sinCambios === true);
const marca = (tipo: 'igual' | 'mas' | 'menos'): string =>
  tipo === 'mas' ? '+' : tipo === 'menos' ? '−' : ' ';
const claseLinea = (tipo: 'igual' | 'mas' | 'menos'): string =>
  tipo === 'mas' ? 'mas' : tipo === 'menos' ? 'menos' : 'igual';
</script>

<template>
  <div class="asistentes">
    <div class="cabecera">
      <div class="explicacion">
        <p>{{ t.explicacion }}</p>
        <p class="tenue">{{ t.alcance }}</p>
      </div>
      <NButton
        secondary
        :loading="asistentes.cargando"
        @click="ejecutar('cargar', () => asistentes.cargar())"
      >
        <template #icon
          ><NIcon><Refresh /></NIcon
        ></template>
        {{ t.recargar }}
      </NButton>
    </div>

    <NAlert type="info" :show-icon="true">
      <template #icon
        ><NIcon><InformationCircleOutline /></NIcon
      ></template>
      {{ t.notaVariable }}
    </NAlert>

    <div v-if="!asistentes.cargado" class="lista">
      <NSkeleton v-for="i in 6" :key="i" height="72px" :sharp="false" />
    </div>
    <ul v-else class="lista" :aria-label="t.pestana">
      <li v-for="a in asistentes.estados" :key="a.id" class="fila" :data-estado="a.estado">
        <div class="nombre">
          <strong>{{ a.nombre }}</strong>
          <span class="tenue mono" :title="t.archivo">{{ a.archivoConfig }}</span>
          <span v-if="!a.compatible" class="tenue">{{ t.motivoLocales }}</span>
        </div>
        <div class="estado">
          <NTag size="small" :bordered="false" :type="tipoEstado(a)">{{ textoEstado(a) }}</NTag>
          <NTag v-if="!a.compatible" size="small" :bordered="false">{{ t.noCompatible }}</NTag>
        </div>
        <div class="acciones">
          <NButton
            v-if="a.estado !== 'conectado'"
            type="primary"
            size="small"
            :disabled="a.estado === 'no-instalado' || !a.compatible"
            :loading="ocupado(`aplicar:${a.id}`)"
            @click="pedir(a, 'conectar')"
          >
            {{ t.conectar }}
          </NButton>
          <NButton
            v-else
            size="small"
            secondary
            type="error"
            :loading="ocupado(`aplicar:${a.id}`)"
            @click="pedir(a, 'quitar')"
          >
            {{ t.quitar }}
          </NButton>
          <NButton size="small" quaternary :disabled="!a.compatible" @click="copiar(a)">
            <template #icon
              ><NIcon><CopyOutline /></NIcon
            ></template>
            {{ t.copiar }}
          </NButton>
          <NButton
            size="small"
            quaternary
            :disabled="a.estado === 'no-instalado'"
            @click="ejecutar(`carpeta:${a.id}`, () => asistentes.abrirCarpeta(a.id))"
          >
            <template #icon
              ><NIcon><FolderOpenOutline /></NIcon
            ></template>
            {{ t.carpeta }}
          </NButton>
        </div>
      </li>
    </ul>

    <!-- Vista previa: qué archivo se toca y las líneas que cambian; escribe solo al aceptar. -->
    <NModal
      :show="pedido !== null"
      preset="dialog"
      :title="titulo"
      :positive-text="pedido?.accion === 'quitar' ? t.aceptarQuitar : t.aceptarConectar"
      :negative-text="textos.acciones.cancelar"
      :positive-button-props="{
        type: pedido?.accion === 'quitar' ? 'error' : 'primary',
        disabled: !pedido?.vista || sinCambios,
      }"
      :auto-focus="false"
      style="width: min(720px, 92vw)"
      @positive-click="confirmar"
      @negative-click="pedido = null"
      @update:show="(v: boolean) => !v && (pedido = null)"
    >
      <div v-if="!pedido?.vista" class="preparando">
        <NSpin size="small" /> <span>{{ t.preparando }}</span>
      </div>
      <template v-else>
        <p class="etiqueta">{{ t.archivo }}</p>
        <code class="archivo">{{ pedido.vista.archivoConfig }}</code>
        <p v-if="!pedido.vista.existeArchivo" class="tenue">{{ t.archivoNuevo }}</p>
        <p v-if="sinCambios" class="tenue">{{ t.sinCambios }}</p>
        <template v-else>
          <p class="etiqueta">{{ t.cambios }}</p>
          <div class="diff" tabindex="0">
            <div
              v-for="(l, i) in pedido.vista.lineas"
              :key="i"
              :class="['linea', claseLinea(l.tipo)]"
            >
              <span class="marca" aria-hidden="true">{{ marca(l.tipo) }}</span>{{ l.texto }}
            </div>
          </div>
        </template>
        <NAlert
          v-if="pedido.vista.avisos.includes('comentarios_perdidos')"
          type="warning"
          :show-icon="false"
        >
          {{ t.comentarios }}
        </NAlert>
        <p class="tenue">{{ t.copiaPrevia }}</p>
        <p v-if="pedido.accion === 'conectar'" class="tenue">{{ t.notaVariable }}</p>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.asistentes {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.explicacion p {
  margin: 0 0 6px;
  max-width: 76ch;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.76;
}
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'nombre estado'
    'acciones acciones';
  gap: 8px 16px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.28);
  border-radius: 12px;
}
.nombre {
  grid-area: nombre;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.estado {
  grid-area: estado;
  display: flex;
  gap: 6px;
}
.acciones {
  grid-area: acciones;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.mono {
  font-family: var(--fuente-mono);
  word-break: break-all;
}
.etiqueta {
  margin: 10px 0 4px;
  font-weight: 600;
}
.archivo {
  display: block;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12px;
  word-break: break-all;
}
.diff {
  padding: 8px 0;
  max-height: 280px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12px;
  line-height: 1.5;
}
.linea {
  padding: 0 10px;
  white-space: pre-wrap;
  word-break: break-all;
}
.marca {
  display: inline-block;
  width: 1.4em;
  font-weight: 700;
}
.mas {
  background: rgba(24, 160, 88, 0.18);
}
.menos {
  background: rgba(208, 48, 80, 0.18);
}
.preparando {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
