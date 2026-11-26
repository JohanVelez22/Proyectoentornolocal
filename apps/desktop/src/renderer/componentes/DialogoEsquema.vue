<script setup lang="ts">
import { Grid, Warning } from '@vicons/ionicons5';
import { NButton, NInput, NModal, NSkeleton } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type {
  EsquemaBase,
  MotorSql,
  ObjetivoSqlIpc,
  RefTabla,
  TablaEsquema,
} from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import EstadoVacio from './EstadoVacio.vue';

/**
 * Visor de esquema (D45d), solo lectura: tablas, columnas, claves, índices y relaciones de una base.
 * Solo se leen metadatos; los valores por defecto de las columnas sí se muestran (son esquema).
 */
const props = defineProps<{
  motor: MotorSql;
  objetivo: ObjetivoSqlIpc;
  base: string;
}>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.esquemaBd;
const { ejecutar, ocupado } = useAccion();

const esquema = ref<EsquemaBase | null>(null);
const error = ref(false);
const busqueda = ref('');
const elegida = ref<string | null>(null);

const clave = (e: string, n: string): string => `${e}\u0000${n}`;
/** En PostgreSQL el esquema `public` no se repite; en MySQL y MariaDB la base ya es el esquema. */
function etiqueta(r: RefTabla): string {
  return props.motor === 'postgresql' && r.esquema !== 'public'
    ? `${r.esquema}.${r.tabla}`
    : r.tabla;
}

async function cargar(): Promise<void> {
  error.value = false;
  const r = await ejecutar('esquema', () => api().bd.esquema(props.objetivo, props.base));
  if (!r) {
    error.value = true;
    return;
  }
  esquema.value = r;
  elegida.value = null;
}

watch(mostrar, (v) => {
  if (v) {
    esquema.value = null;
    busqueda.value = '';
    elegida.value = null;
    void cargar();
  }
});

const tablas = computed<TablaEsquema[]>(() => esquema.value?.tablas ?? []);
const filtradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  if (!q) return tablas.value;
  return tablas.value.filter((x) =>
    etiqueta({ esquema: x.esquema, tabla: x.nombre }).toLowerCase().includes(q),
  );
});
const tabla = computed(
  () => tablas.value.find((x) => clave(x.esquema, x.nombre) === elegida.value) ?? null,
);

function elegir(r: RefTabla): void {
  const k = clave(r.esquema, r.tabla);
  if (tablas.value.some((x) => clave(x.esquema, x.nombre) === k)) {
    elegida.value = k;
    // Si el buscador esconde la tabla a la que se salta, se limpia.
    if (!filtradas.value.some((x) => clave(x.esquema, x.nombre) === k)) busqueda.value = '';
  }
}
const existe = (r: RefTabla): boolean =>
  tablas.value.some((x) => x.esquema === r.esquema && x.nombre === r.tabla);
const lista = (c: string[]): string => c.join(', ');
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo(base)"
    size="small"
    :bordered="false"
    :style="{ width: '1100px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <p class="intro">{{ t.descripcion }}</p>

    <div v-if="ocupado('esquema')" aria-busy="true" :aria-label="t.cargando">
      <NSkeleton text :repeat="5" />
    </div>

    <div v-else-if="error" class="error" role="alert">
      <Warning class="icono-error" />
      <span>{{ t.error }}</span>
      <NButton size="small" @click="cargar">{{ t.reintentar }}</NButton>
    </div>

    <EstadoVacio
      v-else-if="esquema && !tablas.length"
      pequena
      :icono="Grid"
      :titulo="t.vacioTitulo"
      :texto="t.vacioTexto"
    />

    <div v-else-if="esquema" class="visor">
      <nav class="lista" :aria-label="t.tablas(tablas.length)">
        <NInput
          v-model:value="busqueda"
          size="small"
          clearable
          :placeholder="t.buscar"
          :aria-label="t.buscar"
        />
        <p class="total">{{ t.tablas(filtradas.length) }}</p>
        <p v-if="esquema.truncado" class="nota" role="note">{{ t.truncado(tablas.length) }}</p>
        <ul v-if="filtradas.length">
          <li v-for="x in filtradas" :key="clave(x.esquema, x.nombre)">
            <button
              type="button"
              class="fila-tabla"
              :class="{ activa: elegida === clave(x.esquema, x.nombre) }"
              :aria-current="elegida === clave(x.esquema, x.nombre) ? 'true' : undefined"
              @click="elegida = clave(x.esquema, x.nombre)"
            >
              <span class="nombre-tabla">{{
                etiqueta({ esquema: x.esquema, tabla: x.nombre })
              }}</span>
              <span v-if="x.tipo === 'vista'" class="chip">{{ t.vista }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="sin-resultados">{{ t.sinResultados }}</p>
      </nav>

      <section
        class="detalle"
        :aria-label="tabla ? etiqueta({ esquema: tabla.esquema, tabla: tabla.nombre }) : t.elegir"
      >
        <p v-if="!tabla" class="elegir">{{ t.elegir }}</p>
        <template v-else>
          <h3>{{ etiqueta({ esquema: tabla.esquema, tabla: tabla.nombre }) }}</h3>

          <h4>{{ t.columnas }}</h4>
          <div class="caja">
            <table class="tabla">
              <thead>
                <tr>
                  <th scope="col">{{ t.col.nombre }}</th>
                  <th scope="col">{{ t.col.tipo }}</th>
                  <th scope="col">{{ t.col.nulo }}</th>
                  <th scope="col">{{ t.col.defecto }}</th>
                  <th scope="col">{{ t.col.clave }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in tabla.columnas" :key="c.nombre">
                  <td class="mono">{{ c.nombre }}</td>
                  <td class="mono">{{ c.tipo }}</td>
                  <td>{{ c.nulo ? t.si : t.no }}</td>
                  <td class="mono">{{ c.porDefecto ?? '—' }}</td>
                  <td>
                    <span v-if="c.primaria" class="chip">{{ t.pk }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4>{{ t.indices }}</h4>
          <p v-if="!tabla.indices.length" class="vacio-seccion">{{ t.sinIndices }}</p>
          <ul v-else class="simple">
            <li v-for="i in tabla.indices" :key="i.nombre">
              <span class="mono">{{ i.nombre }}</span>
              <span v-if="i.primario" class="chip">{{ t.pk }}</span>
              <span v-else-if="i.unico" class="chip">{{ t.unico }}</span>
              <span class="mono tenue">({{ lista(i.columnas) }})</span>
            </li>
          </ul>

          <h4>{{ t.relaciones }}</h4>
          <p
            v-if="!tabla.clavesForaneas.length && !tabla.clavesEntrantes.length"
            class="vacio-seccion"
          >
            {{ t.sinRelaciones }}
          </p>
          <template v-else>
            <p v-if="tabla.clavesForaneas.length" class="sub">{{ t.salientes }}</p>
            <ul class="simple">
              <li v-for="f in tabla.clavesForaneas" :key="'s' + f.nombre">
                <span class="mono">{{ lista(f.columnas) }}</span>
                <span aria-hidden="true">→</span>
                <NButton
                  v-if="existe(f.destino)"
                  size="tiny"
                  text
                  type="primary"
                  :aria-label="t.irA(etiqueta(f.destino))"
                  @click="elegir(f.destino)"
                >
                  <span class="mono">{{ etiqueta(f.destino) }}</span>
                </NButton>
                <span v-else class="mono">{{ etiqueta(f.destino) }}</span>
                <span class="mono tenue">({{ lista(f.columnasDestino) }})</span>
                <span v-if="f.alBorrar" class="tenue">· {{ t.alBorrar }} {{ f.alBorrar }}</span>
                <span v-if="f.alActualizar" class="tenue"
                  >· {{ t.alActualizar }} {{ f.alActualizar }}</span
                >
              </li>
            </ul>
            <p v-if="tabla.clavesEntrantes.length" class="sub">{{ t.entrantes }}</p>
            <ul class="simple">
              <li v-for="f in tabla.clavesEntrantes" :key="'e' + f.nombre + f.origen.tabla">
                <NButton
                  size="tiny"
                  text
                  type="primary"
                  :aria-label="t.irA(etiqueta(f.origen))"
                  @click="elegir(f.origen)"
                >
                  <span class="mono">{{ etiqueta(f.origen) }}</span>
                </NButton>
                <span class="mono tenue">({{ lista(f.columnasOrigen) }})</span>
                <span aria-hidden="true">→</span>
                <span class="mono">{{ lista(f.columnas) }}</span>
              </li>
            </ul>
          </template>
        </template>
      </section>
    </div>
  </NModal>
</template>

<style scoped>
.intro {
  margin: 0 0 12px;
  font-size: 13px;
  opacity: 0.85;
}
.error {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.icono-error {
  width: 16px;
  height: 16px;
}
.visor {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  min-height: 360px;
}
.lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.lista ul {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 52vh;
  overflow: auto;
}
.total,
.nota,
.sin-resultados {
  margin: 0;
  font-size: 12px;
  opacity: 0.85;
}
.fila-tabla {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  padding: 5px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.fila-tabla:hover {
  background: rgba(128, 128, 128, 0.14);
}
.fila-tabla:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 1px;
}
.fila-tabla.activa {
  background: rgba(var(--acento-rgb), 0.2);
  font-weight: 600;
}
.nombre-tabla {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.detalle {
  min-width: 0;
  max-height: 58vh;
  overflow: auto;
}
.detalle h3 {
  margin: 0 0 4px;
  font-size: 15px;
  font-family: var(--fuente-mono);
}
.detalle h4 {
  margin: 14px 0 6px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.elegir,
.vacio-seccion {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}
.sub {
  margin: 6px 0 2px;
  font-size: 12px;
  font-weight: 600;
}
.caja {
  overflow-x: auto;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.tabla th {
  padding: 5px 8px;
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid rgba(128, 128, 128, 0.3);
}
.tabla td {
  padding: 5px 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.16);
  vertical-align: top;
}
.mono {
  font-family: var(--fuente-mono);
  word-break: break-word;
}
.tenue {
  opacity: 0.85;
  font-size: 12px;
}
.chip {
  display: inline-block;
  padding: 0 6px;
  margin: 0 4px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.simple {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.simple li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
</style>
