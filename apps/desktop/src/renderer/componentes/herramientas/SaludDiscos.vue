<script setup lang="ts">
import { Refresh, ShieldCheckmark } from '@vicons/ionicons5';
import { NButton, NCollapse, NCollapseItem, NIcon, NSpin, NTag } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { UMBRALES_DISCO } from '@pel/core';
import type { DiscoSalud, ResultadoSalud } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { formatearFecha, textos } from '../../i18n';
import { rellenar } from '../../utilidades/equipo';
import {
  TONO_VEREDICTO,
  type FilaContador,
  etiquetasDisco,
  filasContadores,
  hayDatosDeAdministrador,
  nombreDisco,
  textoMotivo,
  textoUnidades,
} from '../../utilidades/saludDiscos';

/**
 * «Salud de los discos» (D57): solo lectura y sin instalar nada. La lectura con permisos de
 * administrador (UAC) es opcional y SOLO ocurre al pulsar su botón.
 */
const t = textos.herramientas.entorno.discos;
const { ejecutar, ocupado } = useAccion();

const resultado = ref<ResultadoSalud | null>(null);

const criterios = computed(() => {
  const n = {
    desgaste: UMBRALES_DISCO.desgasteAtencion,
    ssd: UMBRALES_DISCO.temperaturaSsdAtencion,
    hdd: UMBRALES_DISCO.temperaturaHddAtencion,
  };
  return [
    t.criterios.critico,
    rellenar(t.criterios.atencion, n),
    t.criterios.bien,
    t.criterios.noDisponible,
  ];
});

const discos = computed(() =>
  (resultado.value?.discos ?? []).map((d) => ({
    d,
    nombre: nombreDisco(d, t),
    etiquetas: etiquetasDisco(d, t),
    unidades: textoUnidades(d, t),
    motivos: d.motivos.map((m) => textoMotivo(d, m, t)),
    ...resumirFilas(d),
  })),
);

/**
 * Sin ningún contador (USB, RAID o falta de permisos) no se repite ocho veces el mismo «No
 * disponible»: va una sola línea con el motivo y, aparte, la predicción de fallo.
 */
function resumirFilas(d: DiscoSalud): { sinContadores: string | null; filas: FilaContador[] } {
  const todas = filasContadores(d, resultado.value?.prediccion ?? 'no_disponible', t);
  if (d.contadores !== null) return { sinContadores: null, filas: todas };
  return { sinContadores: todas[0]?.valor ?? t.noDisponible, filas: todas.slice(-1) };
}

const pideAdmin = computed(
  () =>
    !!resultado.value &&
    !resultado.value.conAdmin &&
    hayDatosDeAdministrador(resultado.value.discos),
);

async function cargar(): Promise<void> {
  const r = await ejecutar('discos', () => api().herramientas.saludDiscos());
  if (r) resultado.value = r;
}

/** Pide el UAC de Windows: solo por este clic, nunca por su cuenta. */
async function leerAdmin(): Promise<void> {
  const r = await ejecutar('discosAdmin', () => api().herramientas.saludDiscosAdmin());
  if (r) resultado.value = r;
}

onMounted(() => void cargar());
</script>

<template>
  <div data-testid="salud-discos">
    <h3 class="titulo">{{ t.titulo }}</h3>
    <p class="herr-tenue intro">{{ t.intro }}</p>
    <div class="herr-fila acciones">
      <NButton
        secondary
        size="small"
        :loading="ocupado('discos')"
        data-testid="discos-actualizar"
        @click="cargar"
      >
        <template #icon
          ><NIcon><Refresh /></NIcon
        ></template>
        {{ t.actualizar }}
      </NButton>
      <NButton
        secondary
        size="small"
        :loading="ocupado('discosAdmin')"
        :disabled="ocupado('discos')"
        data-testid="discos-admin"
        @click="leerAdmin"
      >
        <template #icon
          ><NIcon><ShieldCheckmark /></NIcon
        ></template>
        {{ t.leerAdmin }}
      </NButton>
    </div>
    <p class="herr-tenue">{{ t.leerAdminAyuda }}</p>

    <NSpin v-if="!resultado && ocupado('discos')" :size="18" />
    <p v-else-if="resultado && discos.length === 0" class="herr-tenue">{{ t.sinDiscos }}</p>

    <ul v-if="discos.length" class="lista" data-testid="discos-lista">
      <li v-for="x in discos" :key="x.d.clave" class="disco" :data-veredicto="x.d.veredicto">
        <div class="cabecera">
          <strong class="nombre">{{ x.nombre }}</strong>
          <NTag size="small" :type="TONO_VEREDICTO[x.d.veredicto]" :bordered="false" round>
            {{ t.veredictos[x.d.veredicto] }}
          </NTag>
        </div>
        <div class="herr-fila etiquetas">
          <NTag v-for="e in x.etiquetas" :key="e" size="small" :bordered="false">{{ e }}</NTag>
          <NTag v-if="x.d.contieneDatos" size="small" type="info" :bordered="false">
            {{ t.datosWolf }}
          </NTag>
          <NTag v-if="x.d.contieneProyectos" size="small" type="info" :bordered="false">
            {{ t.proyectos }}
          </NTag>
        </div>
        <p class="herr-tenue">{{ x.unidades }}</p>
        <ul v-if="x.motivos.length" class="motivos">
          <li v-for="(m, i) in x.motivos" :key="i">{{ m }}</li>
        </ul>
        <p v-if="x.sinContadores" class="herr-tenue sin-contadores" data-testid="sin-contadores">
          {{ x.sinContadores }}
        </p>
        <dl class="herr-datos contadores">
          <template v-for="f in x.filas" :key="f.clave">
            <dt>{{ f.etiqueta }}</dt>
            <dd :class="{ sin: !f.disponible }">{{ f.valor }}</dd>
          </template>
        </dl>
      </li>
    </ul>

    <p v-if="pideAdmin" class="herr-tenue" data-testid="discos-pide-admin">
      {{ t.requiereAdminAviso }}
    </p>
    <p v-if="resultado?.conAdmin" class="herr-tenue">{{ t.leidoAdmin }}</p>
    <p v-if="resultado" class="herr-tenue">
      {{ formatearFecha(resultado.leidoEn, { dateStyle: 'short', timeStyle: 'short' }) }}
    </p>

    <NCollapse class="criterios">
      <NCollapseItem :title="t.criterios.titulo" name="criterios">
        <ul class="motivos">
          <li v-for="(c, i) in criterios" :key="i">{{ c }}</li>
        </ul>
      </NCollapseItem>
    </NCollapse>
    <p class="herr-tenue">{{ t.nota }}</p>
    <p class="herr-tenue">{{ t.privacidad }}</p>
  </div>
</template>

<style scoped>
.titulo {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}
.intro {
  margin-bottom: 8px;
}
.acciones {
  margin-bottom: 6px;
}
.lista {
  list-style: none;
  margin: 12px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.disco {
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-left-width: 4px;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.disco[data-veredicto='bien'] {
  border-left-color: var(--texto-ok, #18a058);
}
.disco[data-veredicto='atencion'] {
  border-left-color: #f0a020;
}
.disco[data-veredicto='critico'] {
  border-left-color: var(--texto-error, #d03050);
}
.cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.nombre {
  font-size: 14px;
  word-break: break-word;
}
.motivos {
  margin: 0;
  padding-left: 18px;
  font-size: 12.5px;
}
.contadores {
  font-size: 12.5px;
}
.contadores dd {
  font-family: inherit;
  word-break: normal;
  overflow-wrap: break-word;
}
.contadores dd.sin {
  opacity: 0.7;
  font-style: italic;
}
.sin-contadores {
  font-style: italic;
}
.criterios {
  margin-top: 4px;
}
</style>
