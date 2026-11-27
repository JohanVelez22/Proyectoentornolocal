<script setup lang="ts">
import { Copy, Search } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NInput, NTag, useMessage } from 'naive-ui';
import { computed, onBeforeUnmount, ref } from 'vue';
import { probar, servidorEjemplo, soltarEjemplo } from '../../composables/servidorEjemplo';
import { useCopiar } from '../../composables/useHerramienta';
import { idioma, textos } from '../../i18n';
import AvisoServidorEjemplo from './AvisoServidorEjemplo.vue';
import { mensajeDeError } from '../../utilidades/errores';
import { peticionDeCodigo, peticionDeMetodo, tienePrueba } from '../../utilidades/ejemplosHttp';
import {
  contenidoHttp,
  FAMILIAS,
  filtrarCodigos,
  filtrarMetodos,
  textoEn,
  type Familia,
} from '../../utilidades/guias';

/** Guía HTTP (D42): contenido estático empaquetado, buscable por número, nombre y texto. */
const t = textos.guias.http;
const copiar = useCopiar();
const message = useMessage();

/**
 * «Probar» arranca el servidor de ejemplo (127.0.0.1) y abre el cliente HTTP con la petición
 * rellena; el cliente lo apaga al cerrarse. Si la guía se cierra sin haber pasado al cliente, se apaga aquí.
 */
async function ensayar(
  crear: (puerto: number) => ReturnType<typeof peticionDeCodigo>,
): Promise<void> {
  try {
    await probar(crear);
  } catch (e) {
    message.error(mensajeDeError(e));
  }
}
onBeforeUnmount(() => soltarEjemplo('guia'));

const modo = ref<'codigos' | 'metodos'>('codigos');
const consulta = ref('');
const familia = ref<Familia | null>(null);

const codigos = computed(() =>
  filtrarCodigos(contenidoHttp.codigos, idioma.value, consulta.value, familia.value),
);
const metodos = computed(() => filtrarMetodos(contenidoHttp.metodos, idioma.value, consulta.value));
const total = computed(() =>
  modo.value === 'codigos' ? codigos.value.length : metodos.value.length,
);
</script>

<template>
  <div class="herr">
    <div class="herr-fila" role="group">
      <NButton
        size="small"
        :type="modo === 'codigos' ? 'primary' : 'default'"
        :secondary="modo === 'codigos'"
        :aria-pressed="modo === 'codigos'"
        @click="modo = 'codigos'"
      >
        {{ t.verCodigos }}
      </NButton>
      <NButton
        size="small"
        :type="modo === 'metodos' ? 'primary' : 'default'"
        :secondary="modo === 'metodos'"
        :aria-pressed="modo === 'metodos'"
        @click="modo = 'metodos'"
      >
        {{ t.verMetodos }}
      </NButton>
    </div>

    <AvisoServidorEjemplo />

    <NInput v-model:value="consulta" clearable :placeholder="t.buscar" :aria-label="t.buscar">
      <template #prefix
        ><NIcon><Search /></NIcon
      ></template>
    </NInput>

    <div v-if="modo === 'codigos'" class="herr-fila" role="group" :aria-label="t.familia">
      <NButton
        size="tiny"
        :type="familia === null ? 'primary' : 'default'"
        :secondary="familia === null"
        :aria-pressed="familia === null"
        @click="familia = null"
      >
        {{ t.todas }}
      </NButton>
      <NButton
        v-for="f in FAMILIAS"
        :key="f"
        size="tiny"
        :type="familia === f ? 'primary' : 'default'"
        :secondary="familia === f"
        :aria-pressed="familia === f"
        :title="t.familias[f]"
        @click="familia = f"
      >
        {{ f }}
      </NButton>
    </div>

    <p class="herr-tenue" aria-live="polite">{{ t.resultados(total) }}</p>

    <template v-if="modo === 'codigos'">
      <details v-for="c in codigos" :key="c.codigo" class="item">
        <summary>
          <span class="num">{{ c.codigo }}</span>
          <span class="nombre">{{ c.nombre }}</span>
          <NTag v-if="c.estandar === false" size="small" type="warning" :bordered="false">
            {{ c.broma ? t.broma : t.noEstandar }}
          </NTag>
          <span class="resumen">{{ textoEn(c, idioma).texto.resumen }}</span>
        </summary>
        <div class="cuerpo">
          <p v-if="!textoEn(c, idioma).traducido" class="herr-tenue">{{ t.sinTraduccion }}</p>
          <p>{{ textoEn(c, idioma).texto.explicacion }}</p>
          <strong>{{ t.causas }}</strong>
          <ul>
            <li v-for="(x, i) in textoEn(c, idioma).texto.causasComunes" :key="i">{{ x }}</li>
          </ul>
          <strong>{{ t.solucion }}</strong>
          <ul>
            <li v-for="(x, i) in textoEn(c, idioma).texto.comoSolucionar" :key="i">{{ x }}</li>
          </ul>
          <strong>{{ t.ejemplo }}</strong>
          <div class="bloque">
            <pre>{{ textoEn(c, idioma).texto.ejemplo }}</pre>
            <NButton
              size="tiny"
              quaternary
              class="copiar"
              :aria-label="t.copiarEjemplo"
              :title="t.copiarEjemplo"
              @click="copiar(textoEn(c, idioma).texto.ejemplo)"
            >
              <template #icon
                ><NIcon><Copy /></NIcon
              ></template>
            </NButton>
          </div>
          <div v-if="true" class="probar">
            <NButton
              size="small"
              secondary
              type="primary"
              :loading="servidorEjemplo.iniciando"
              :title="t.probarTitulo"
              :data-testid="`probar-codigo-${c.codigo}`"
              @click="ensayar((p) => peticionDeCodigo(c.codigo, p))"
            >
              {{ t.probar }}
            </NButton>
          </div>
        </div>
      </details>
    </template>

    <template v-else>
      <details v-for="m in metodos" :key="m.nombre" class="item">
        <summary>
          <span class="num">{{ m.nombre }}</span>
          <NTag size="small" :type="m.seguro ? 'success' : 'default'" :bordered="false">
            {{ m.seguro ? t.seguro : t.noSeguro }}
          </NTag>
          <NTag size="small" :type="m.idempotente ? 'success' : 'default'" :bordered="false">
            {{ m.idempotente ? t.idempotente : t.noIdempotente }}
          </NTag>
          <span class="resumen">{{ textoEn(m, idioma).texto.resumen }}</span>
        </summary>
        <div class="cuerpo">
          <p v-if="!textoEn(m, idioma).traducido" class="herr-tenue">{{ t.sinTraduccion }}</p>
          <p>{{ textoEn(m, idioma).texto.explicacion }}</p>
          <strong>{{ t.ejemplo }}</strong>
          <div class="bloque">
            <pre>{{ textoEn(m, idioma).texto.ejemplo }}</pre>
            <NButton
              size="tiny"
              quaternary
              class="copiar"
              :aria-label="t.copiarEjemplo"
              :title="t.copiarEjemplo"
              @click="copiar(textoEn(m, idioma).texto.ejemplo)"
            >
              <template #icon
                ><NIcon><Copy /></NIcon
              ></template>
            </NButton>
          </div>
          <div v-if="tienePrueba(m.nombre)" class="probar">
            <NButton
              size="small"
              secondary
              type="primary"
              :loading="servidorEjemplo.iniciando"
              :title="t.probarTitulo"
              :data-testid="`probar-metodo-${m.nombre}`"
              @click="ensayar((p) => peticionDeMetodo(m.nombre, p)!)"
            >
              {{ t.probar }}
            </NButton>
          </div>
        </div>
      </details>
    </template>

    <NEmpty v-if="total === 0" :description="t.vacio" />
  </div>
</template>

<style scoped>
.item {
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 10px;
  padding: 0 12px;
}
.item summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  cursor: pointer;
}
.item summary:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}
.num {
  font-family: var(--fuente-mono);
  font-weight: 700;
}
.nombre {
  font-weight: 600;
}
.resumen {
  flex-basis: 100%;
  font-size: 12.5px;
  opacity: 0.76;
}
.cuerpo {
  padding-bottom: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  word-break: break-word;
}
.cuerpo ul {
  margin: 4px 0 10px;
  padding-left: 20px;
}
.bloque {
  position: relative;
  margin-top: 6px;
}
.bloque pre {
  margin: 0;
  padding: 10px 44px 10px 12px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.probar {
  margin-top: 8px;
}
.copiar {
  position: absolute;
  top: 6px;
  right: 6px;
}
</style>
