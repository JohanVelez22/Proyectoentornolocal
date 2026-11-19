<script setup lang="ts">
import { Build, Construct, Sparkles } from '@vicons/ionicons5';
import { NButton, NIcon, NSkeleton, NSpin, NTag, useDialog, useNotification } from 'naive-ui';
import { computed, onMounted } from 'vue';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { LIMITE_LINEAS, useBd } from '../stores/bd';
import PanelProgreso from './PanelProgreso.vue';

/** Estado de pgvector y su instalación (Build Tools + compilación), con su registro en vivo. */
const t = textos.bd.pgvector;
const bd = useBd();
const dialog = useDialog();
const notification = useNotification();
const { ejecutar, ocupado } = useAccion();

const estado = computed(() => bd.pgvector);
const tarea = computed(() => bd.tareaPgvector);
/** Compilar detiene PostgreSQL un momento: no se ofrece durante una restauración. */
const bloqueado = computed(() => tarea.value !== null || bd.enCurso);

onMounted(() => {
  void ejecutar('estado', () => bd.cargarPgvector(), { tituloError: t.errorEstado });
});

function pedirHerramientas(luego?: () => void): void {
  dialog.warning({
    title: t.dialogoHerramientasTitulo,
    content: t.dialogoHerramientas,
    positiveText: t.instalarHerramientas,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: () => {
      void instalarHerramientas(luego);
    },
  });
}

async function instalarHerramientas(luego?: () => void): Promise<void> {
  const r = await ejecutar('buildtools', () => bd.instalarBuildTools(), {
    tituloError: t.falloHerramientas,
  });
  if (!r) return;
  if (r.ok) {
    notification.success({ title: t.herramientasOk, duration: 5000 });
    luego?.();
    return;
  }
  notification.error({
    title: t.falloHerramientas,
    content:
      r.motivo === 'winget-ausente' ? t.sinWinget : (r.detalle ?? textos.errores.desconocido),
    duration: 0,
    closable: true,
  });
}

function pedirCompilar(): void {
  dialog.info({
    title: t.dialogoCompilarTitulo,
    content: t.dialogoCompilar,
    positiveText: t.continuar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: () => {
      void compilar();
    },
  });
}

async function compilar(): Promise<void> {
  const r = await ejecutar('compilar', () => bd.compilarPgvector());
  if (r) notification.success({ title: t.instaladoOk(r.version), content: t.activarAyuda });
}

/** "Instalar pgvector": si faltan las herramientas, primero las instala y luego compila. */
function instalar(): void {
  if (bloqueado.value) return;
  if (estado.value && !estado.value.buildTools) pedirHerramientas(pedirCompilar);
  else pedirCompilar();
}
</script>

<template>
  <section class="pgvector" aria-labelledby="titulo-pgvector">
    <header class="cabeza">
      <span class="icono"
        ><NIcon :size="18"><Sparkles /></NIcon
      ></span>
      <div class="titulo">
        <h3 id="titulo-pgvector">{{ t.titulo }}</h3>
        <small>{{ t.descripcion }}</small>
      </div>
    </header>

    <NSkeleton v-if="!estado && ocupado('estado')" text :repeat="2" />
    <template v-else-if="estado">
      <dl class="datos">
        <div>
          <dt>{{ t.titulo }}</dt>
          <dd>
            <NTag size="small" :bordered="false" :type="estado.instalado ? 'success' : 'default'">
              {{ estado.instalado ? t.instalado(estado.version) : t.noInstalado }}
            </NTag>
          </dd>
        </div>
        <div>
          <dt>{{ t.herramientas }}</dt>
          <dd>
            <NTag size="small" :bordered="false" :type="estado.buildTools ? 'success' : 'warning'">
              {{ estado.buildTools ? t.herramientasSi : t.herramientasNo }}
            </NTag>
          </dd>
        </div>
      </dl>

      <div class="botones">
        <NButton
          v-if="!estado.instalado"
          size="small"
          type="primary"
          :disabled="bloqueado"
          :loading="tarea === 'compilar'"
          @click="instalar"
        >
          <template #icon
            ><NIcon><Build /></NIcon
          ></template>
          {{ t.instalar }}
        </NButton>
        <NButton
          v-else
          size="small"
          secondary
          :disabled="bloqueado"
          :loading="tarea === 'compilar'"
          @click="instalar"
        >
          <template #icon
            ><NIcon><Build /></NIcon
          ></template>
          {{ t.reinstalar }}
        </NButton>
        <NButton
          v-if="!estado.buildTools"
          size="small"
          secondary
          :disabled="bloqueado"
          :loading="tarea === 'buildtools'"
          @click="pedirHerramientas()"
        >
          <template #icon
            ><NIcon><Construct /></NIcon
          ></template>
          {{ t.instalarHerramientas }}
        </NButton>
      </div>
      <p v-if="estado.instalado" class="tenue">{{ t.activarAyuda }}</p>
    </template>

    <div v-if="tarea || bd.lineasPgvector.length" class="progreso">
      <p v-if="tarea" class="corriendo">
        <NSpin :size="14" />
        <span>{{ tarea === 'buildtools' ? t.instalando : t.compilando }}</span>
      </p>
      <PanelProgreso
        :lineas="bd.lineasPgvector"
        :limite="LIMITE_LINEAS"
        :etiqueta="t.titulo"
        :alto="180"
      />
    </div>
  </section>
</template>

<style scoped>
.pgvector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.045);
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icono {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(124, 58, 237, 0.12);
  color: #8b5cf6;
  flex: none;
}
.titulo h3 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
}
.titulo small {
  font-size: 12px;
  opacity: 0.6;
}
.datos {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
  margin: 0;
}
.datos dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.datos dd {
  margin: 4px 0 0;
}
.botones {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tenue {
  margin: 0;
  font-size: 12px;
  opacity: 0.6;
}
.progreso {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.corriendo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
}
</style>
