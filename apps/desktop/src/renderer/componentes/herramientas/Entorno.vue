<script setup lang="ts">
import { LockClosed, Refresh } from '@vicons/ionicons5';
import { NButton, NCollapse, NCollapseItem, NIcon, NInput, NSpin, NTooltip } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { EntornoSistema } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';

const t = textos.herramientas.entorno;
const { ejecutar, ocupado } = useAccion();

const version = ref<string | null>(null);
const entorno = ref<EntornoSistema | null>(null);
const filtro = ref('');

/** Motores (Chrome/Electron) leídos del agente de usuario: el renderer no ve `process`. */
const motores = (navigator.userAgent.match(/(Chrome|Electron)\/[\d.]+/g) ?? []).join(' · ');

const datos: [string, string][] = [
  [t.navegador, motores || navigator.userAgent],
  [t.plataforma, navigator.platform],
  [t.idioma, navigator.language],
  [t.zona, Intl.DateTimeFormat().resolvedOptions().timeZone],
  [t.nucleos, String(navigator.hardwareConcurrency || '—')],
];

const variables = computed(() => {
  const q = filtro.value.trim().toLowerCase();
  const l = entorno.value?.variables ?? [];
  return q
    ? l.filter(
        (v) =>
          v.nombre.toLowerCase().includes(q) ||
          (!v.enmascarada && v.valor.toLowerCase().includes(q)),
      )
    : l;
});

/** Los valores con nombre de secreto ya llegan enmascarados desde el núcleo. */
async function cargar(): Promise<void> {
  const r = await ejecutar('cargar', () => api().herramientas.entorno());
  if (r) entorno.value = r;
}

onMounted(async () => {
  void cargar();
  try {
    version.value = await api().sistema.version();
  } catch {
    version.value = null;
  }
});
</script>

<template>
  <div class="herr">
    <dl class="herr-datos">
      <dt>{{ t.aplicacion }}</dt>
      <dd>{{ version ?? '—' }}</dd>
      <template v-for="[k, v] in datos" :key="k">
        <dt>{{ k }}</dt>
        <dd>{{ v }}</dd>
      </template>
    </dl>

    <div class="herr-fila">
      <NButton secondary size="small" :loading="ocupado('cargar')" @click="cargar">
        <template #icon
          ><NIcon><Refresh /></NIcon
        ></template>
        {{ t.actualizar }}
      </NButton>
    </div>

    <NSpin v-if="!entorno && ocupado('cargar')" :size="18" />
    <template v-if="entorno">
      <div>
        <div class="herr-etiqueta">{{ t.herramientas }}</div>
        <dl class="herr-datos">
          <template v-for="h in entorno.herramientas" :key="h.nombre">
            <dt>{{ h.nombre }}</dt>
            <dd v-if="h.versiones.length">{{ h.versiones.join(', ') }}</dd>
            <dd v-else class="tenue">{{ h.sinRespuesta ? t.sinRespuesta : t.noInstalada }}</dd>
          </template>
        </dl>
      </div>

      <NCollapse :default-expanded-names="['path']">
        <NCollapseItem :title="`${t.path} (${entorno.path.length})`" name="path">
          <ol v-if="entorno.path.length" class="lista">
            <li v-for="(d, i) in entorno.path" :key="i">{{ d }}</li>
          </ol>
          <p v-else class="herr-tenue">{{ t.pathVacio }}</p>
        </NCollapseItem>
        <NCollapseItem :title="`${t.variables} (${entorno.variables.length})`" name="variables">
          <NInput
            v-model:value="filtro"
            clearable
            size="small"
            :placeholder="t.filtro"
            class="filtro"
          />
          <dl class="herr-datos variables">
            <template v-for="v in variables" :key="v.nombre">
              <dt>{{ v.nombre }}</dt>
              <dd v-if="v.enmascarada" class="tenue">
                <NTooltip>
                  <template #trigger>
                    <span class="oculto"
                      ><NIcon :size="13"><LockClosed /></NIcon> {{ v.valor }}</span
                    >
                  </template>
                  {{ t.enmascarada }}
                </NTooltip>
              </dd>
              <dd v-else>{{ v.valor }}</dd>
            </template>
          </dl>
        </NCollapseItem>
      </NCollapse>
    </template>
  </div>
</template>

<style scoped>
.tenue {
  opacity: 0.72;
}
.lista {
  margin: 0;
  padding-left: 26px;
  font-family: var(--fuente-mono);
  font-size: 12px;
  word-break: break-all;
  max-height: 320px;
  overflow: auto;
}
.filtro {
  max-width: 280px;
  margin-bottom: 8px;
}
.variables {
  max-height: 420px;
  overflow: auto;
  font-size: 12px;
}
.variables dt {
  font-family: var(--fuente-mono);
  word-break: break-all;
}
.oculto {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
