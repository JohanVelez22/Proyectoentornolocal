<script setup lang="ts">
import { CloudDownloadOutline, LinkOutline, OpenOutline, Play, Terminal } from '@vicons/ionicons5';
import { NButton, NIcon, NTag, NTooltip } from 'naive-ui';
import { computed } from 'vue';
import type { EstadoAgente } from '../../shared/api';
import { textos } from '../i18n';
import TextoLargo from './TextoLargo.vue';

/**
 * Un agente: si está instalado (y de dónde sale), su versión, si tiene el MCP registrado y sus
 * acciones. La tarjeta solo emite: los diálogos de confirmación y las llamadas son de la vista.
 */
const props = defineProps<{
  agente: EstadoAgente;
  instalando: boolean;
  ocupadoVersion: boolean;
}>();
const emit = defineEmits<{
  instalar: [];
  guia: [];
  version: [];
  conectar: [];
  abrir: [];
}>();

const t = textos.agentes;
const a = computed(() => props.agente);
/** Un ejecutable suelto no se ejecuta solo para saber su versión. */
const versionDesconocida = computed(() => a.value.instalado && a.value.version === null);
</script>

<template>
  <article class="tarjeta" :aria-label="a.nombre">
    <header class="cabeza">
      <span class="icono"
        ><NIcon :size="18"><Terminal /></NIcon
      ></span>
      <div class="titulo">
        <strong>{{ a.nombre }}</strong>
        <span v-if="a.paquete" class="tenue mono">{{ a.paquete }}</span>
      </div>
      <NTag size="small" :bordered="false" :type="a.instalado ? 'success' : 'default'">
        {{ a.instalado ? t.instalado : t.noInstalado }}
      </NTag>
    </header>

    <dl class="datos">
      <template v-if="a.instalado">
        <div>
          <dt>{{ textos.app.version }}</dt>
          <dd>
            <span v-if="!versionDesconocida" class="mono">{{ t.version(a.version!) }}</span>
            <template v-else>
              <span class="tenue">{{ t.versionDesconocida }}</span>
              <NTooltip>
                <template #trigger>
                  <NButton
                    size="tiny"
                    quaternary
                    :loading="ocupadoVersion"
                    class="ver-version"
                    @click="emit('version')"
                  >
                    {{ t.verVersion }}
                  </NButton>
                </template>
                {{ t.verVersionAyuda }}
              </NTooltip>
            </template>
          </dd>
        </div>
        <div v-if="a.origen">
          <dt>&nbsp;</dt>
          <dd class="tenue">{{ t.origen[a.origen] }}</dd>
        </div>
        <div class="ancho">
          <dd class="tenue ruta"><TextoLargo :texto="a.ruta ?? ''" mono /></dd>
        </div>
      </template>
      <p v-else-if="!a.instalable" class="nota">{{ t.soloGuia }}</p>
      <p v-if="!a.mcpSoportado" class="nota">{{ t.mcpNoSoportado }}</p>
    </dl>

    <div class="mcp">
      <NTag
        size="small"
        :bordered="false"
        :type="a.mcpRegistrado ? 'info' : 'default'"
        :title="a.mcpSoportado ? undefined : t.mcpNoSoportado"
      >
        {{ a.mcpRegistrado ? t.mcpRegistrado : t.mcpSinRegistrar }}
      </NTag>
      <span class="tenue ruta"><TextoLargo :texto="a.archivoConfig" mono /></span>
    </div>

    <footer class="acciones" role="group" :aria-label="a.nombre">
      <NButton v-if="a.instalado" size="small" type="primary" secondary @click="emit('abrir')">
        <template #icon
          ><NIcon><Play /></NIcon
        ></template>
        {{ t.abrir }}
      </NButton>
      <NButton
        v-else-if="a.instalable"
        size="small"
        type="primary"
        secondary
        :loading="instalando"
        @click="emit('instalar')"
      >
        <template #icon
          ><NIcon><CloudDownloadOutline /></NIcon
        ></template>
        {{ instalando ? t.instalando : t.instalar }}
      </NButton>
      <NButton v-else size="small" secondary @click="emit('guia')">
        <template #icon
          ><NIcon><OpenOutline /></NIcon
        ></template>
        {{ t.guia }}
      </NButton>
      <span class="separador" />
      <!-- Un solo camino de escritura: «Conectar asistentes» (vista previa y confirmación). -->
      <NButton v-if="a.mcpSoportado" size="small" quaternary @click="emit('conectar')">
        <template #icon
          ><NIcon><LinkOutline /></NIcon
        ></template>
        {{ t.conectarEn }}
      </NButton>
    </footer>
  </article>
</template>

<style scoped>
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.03);
  min-width: 0;
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icono {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(128, 128, 128, 0.1);
  flex: none;
}
.titulo {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.titulo strong {
  font-size: 14px;
}
.tenue {
  font-size: 12px;
  opacity: 0.72;
}
.mono {
  font-family: var(--fuente-mono);
}
.datos {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 6px 14px;
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
  font-size: 12.5px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
  min-width: 0;
}
.ancho {
  grid-column: 1 / -1;
}
.datos dd.ruta,
.ruta {
  /* El recorte por el centro lo hace TextoLargo; aquí solo se le da el ancho disponible. */
  display: block;
  min-width: 0;
  flex: 1;
}
.nota {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 12.5px;
  opacity: 0.75;
}
.mcp {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.separador {
  flex: 1;
}
</style>
