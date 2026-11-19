<script setup lang="ts">
import { NCollapse, NCollapseItem, NInput } from 'naive-ui';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { crearTrabajador } from '../../composables/useHerramienta';
import { es } from '../../i18n/es';
import {
  probarRegexConLimite,
  segmentosResaltado,
  type ResultadoRegex,
} from '../../utilidades/herramientas';

const t = es.herramientas.regex;
const MS_LIMITE = 1500;
const MAX_TEXTO = 200_000;

const patron = ref('(\\w+)@(\\w+)\\.com');
const banderas = ref('g');
const texto = ref('ana@ejemplo.com, luis@correo.com');
const resultado = ref<ResultadoRegex | null>(null);
const error = ref<string | null>(null);
const ocupado = ref(false);

let turno = 0;
let espera: ReturnType<typeof setTimeout> | undefined;

async function probar(): Promise<void> {
  const mio = ++turno;
  if (!patron.value) {
    resultado.value = null;
    error.value = null;
    return;
  }
  ocupado.value = true;
  const r = await probarRegexConLimite(
    { patron: patron.value, banderas: banderas.value, texto: texto.value.slice(0, MAX_TEXTO) },
    crearTrabajador,
    MS_LIMITE,
  );
  if (mio !== turno) return;
  ocupado.value = false;
  if (r.estado === 'ok') {
    error.value = r.resultado.error ?? null;
    resultado.value = r.resultado.error ? null : r.resultado;
  } else {
    resultado.value = null;
    error.value = r.estado === 'tiempo' ? t.tiempo : r.mensaje;
  }
}

watch(
  [patron, banderas, texto],
  () => {
    clearTimeout(espera);
    espera = setTimeout(() => void probar(), 300);
  },
  { immediate: true },
);
onBeforeUnmount(() => clearTimeout(espera));

const segmentos = computed(() =>
  resultado.value ? segmentosResaltado(texto.value, resultado.value.coincidencias) : [],
);
</script>

<template>
  <div class="herr">
    <div class="herr-fila">
      <div class="campo-patron">
        <div class="herr-etiqueta">{{ t.patron }}</div>
        <NInput v-model:value="patron" class="herr-mono">
          <template #prefix>/</template>
          <template #suffix>/</template>
        </NInput>
      </div>
      <div class="campo-banderas">
        <div class="herr-etiqueta">{{ t.banderas }}</div>
        <NInput v-model:value="banderas" class="herr-mono" :maxlength="8" />
      </div>
    </div>
    <div>
      <div class="herr-etiqueta">{{ t.texto }}</div>
      <NInput
        v-model:value="texto"
        type="textarea"
        class="herr-mono"
        :autosize="{ minRows: 5, maxRows: 12 }"
      />
    </div>

    <p v-if="error" class="herr-error" role="alert">{{ error }}</p>
    <template v-else-if="resultado">
      <p class="herr-tenue" aria-live="polite">
        {{
          resultado.coincidencias.length
            ? t.coincidencias(resultado.coincidencias.length, resultado.truncado)
            : t.sinCoincidencias
        }}
      </p>
      <pre class="herr-salida resaltado"><template v-for="(s, i) in segmentos" :key="i"><mark
            v-if="s.n !== null"
            :class="s.n % 2 ? 'b' : 'a'"
            >{{ s.texto }}</mark
          ><template v-else>{{ s.texto }}</template></template></pre>
      <ol v-if="resultado.coincidencias.length" class="lista">
        <li v-for="(c, i) in resultado.coincidencias.slice(0, 100)" :key="i">
          <code>{{ c.texto }}</code>
          <span class="herr-tenue"> [{{ c.indice }}–{{ c.fin }}]</span>
          <ul v-if="c.grupos.length" class="grupos">
            <li v-for="(g, j) in c.grupos" :key="j">
              {{ t.grupo(j + 1) }}: <code>{{ g ?? '—' }}</code>
            </li>
            <li v-for="(v, nombre) in c.nombrados" :key="`n-${nombre}`">
              {{ nombre }}: <code>{{ v ?? '—' }}</code>
            </li>
          </ul>
        </li>
      </ol>
    </template>

    <NCollapse>
      <NCollapseItem :title="t.referencia" name="ref">
        <table class="referencia">
          <tbody>
            <tr v-for="[sintaxis, uso] in t.tabla" :key="sintaxis">
              <td>
                <code>{{ sintaxis }}</code>
              </td>
              <td>{{ uso }}</td>
            </tr>
          </tbody>
        </table>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<style scoped>
.campo-patron {
  flex: 1;
  min-width: 240px;
}
.campo-banderas {
  width: 110px;
}
.resaltado mark {
  border-radius: 3px;
  color: inherit;
}
.resaltado mark.a {
  background: rgba(234, 179, 8, 0.35);
}
.resaltado mark.b {
  background: rgba(59, 130, 246, 0.3);
}
.lista {
  margin: 0;
  padding-left: 22px;
  font-size: 13px;
  max-height: 260px;
  overflow: auto;
}
.lista code,
.referencia code {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.grupos {
  margin: 2px 0 6px;
  padding-left: 16px;
  font-size: 12.5px;
  opacity: 0.85;
}
.referencia {
  border-collapse: collapse;
  font-size: 12.5px;
}
.referencia td {
  padding: 3px 12px 3px 0;
  vertical-align: top;
}
</style>
