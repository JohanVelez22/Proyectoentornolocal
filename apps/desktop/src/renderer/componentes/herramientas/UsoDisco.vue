<script setup lang="ts">
import { ChevronDown, ChevronForward, Copy, FolderOpenOutline, PieChart } from '@vicons/ionicons5';
import { NAlert, NButton, NIcon, NTab, NTabs } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { AnalisisDisco, NodoUsoUi, ProgresoUsoDisco, UnidadDisco } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { solicitudes } from '../../composables/solicitudes';
import { textos } from '../../i18n';
import { formatearNumero } from '../../i18n';
import { formatoBytes, formatoPorcentaje } from '../../utilidades/metricas';
import EstadoVacio from '../EstadoVacio.vue';
import TextoLargo from '../TextoLargo.vue';

/**
 * Uso del disco (D51): qué ocupa espacio en una unidad o carpeta. Solo lee tamaños: no hay ninguna
 * acción que borre, mueva o eleve. La carpeta sale de la lista de unidades o del diálogo nativo
 * (nunca de texto libre) y el recorrido corre en un proceso aparte, con progreso y cancelar.
 */
const t = textos.herramientas.usoDisco;
const { ejecutar } = useAccion();
const router = useRouter();

const unidades = ref<UnidadDisco[] | null>(null);
const analizando = ref(false);
const cancelada = ref(false);
const progreso = ref<ProgresoUsoDisco | null>(null);
const analisis = ref<AnalisisDisco | null>(null);
const vista = ref<'arbol' | 'carpetas' | 'archivos' | 'extensiones'>('arbol');
const expandidos = reactive(new Set<number>());
let baja: (() => void) | null = null;

onMounted(() => {
  baja = api().on('disco:progreso', (p) => {
    if (analizando.value) progreso.value = p;
  });
  void api()
    .discoUso.unidades()
    .then((l) => (unidades.value = l))
    .catch(() => (unidades.value = []));
  // «Abrir en Uso del disco» desde Info de archivo (D55): la carpeta ya está registrada.
  const pedida = solicitudes.carpetaDisco;
  if (pedida) {
    solicitudes.carpetaDisco = null;
    void correr(() => api().discoUso.analizar(pedida));
  }
});

onBeforeUnmount(() => {
  baja?.();
  if (analizando.value)
    void api()
      .discoUso.cancelar()
      .catch(() => undefined);
});

async function correr(hacer: () => Promise<AnalisisDisco>): Promise<void> {
  analizando.value = true;
  cancelada.value = false;
  progreso.value = null;
  analisis.value = null;
  try {
    const r = await hacer();
    analisis.value = r;
    expandidos.clear();
    expandidos.add(r.arbol.id);
    vista.value = 'arbol';
  } catch (e) {
    if ((e as { codigo?: unknown } | null)?.codigo === 'disco.cancelado') cancelada.value = true;
    else
      await ejecutar('analizar-error', () => {
        throw e;
      });
  } finally {
    analizando.value = false;
  }
}

const analizarUnidad = (u: UnidadDisco): Promise<void> =>
  correr(() => api().discoUso.analizarUnidad(u.ruta));

async function elegirCarpeta(): Promise<void> {
  const carpeta = await ejecutar('elegir', () => api().sistema.elegirCarpeta());
  if (carpeta) await correr(() => api().discoUso.analizar(carpeta));
}

const cancelar = (): Promise<unknown> => ejecutar('cancelar', () => api().discoUso.cancelar());

function alternar(n: NodoUsoUi): void {
  if (expandidos.has(n.id)) expandidos.delete(n.id);
  else expandidos.add(n.id);
}

interface FilaArbol {
  nodo: NodoUsoUi;
  nivel: number;
}
const filas = computed<FilaArbol[]>(() => {
  const a = analisis.value;
  if (!a) return [];
  const salida: FilaArbol[] = [];
  const ir = (n: NodoUsoUi, nivel: number): void => {
    salida.push({ nodo: n, nivel });
    if (expandidos.has(n.id)) for (const h of n.hijos ?? []) ir(h, nivel + 1);
  };
  ir(a.arbol, 0);
  return salida;
});

const pct = (bytes: number): number => {
  const total = analisis.value?.total ?? 0;
  return total > 0 ? (bytes / total) * 100 : 0;
};
const nombreDe = (n: NodoUsoUi): string =>
  n.tipo === 'otros' ? t.otros(formatearNumero(n.archivos ?? 0)) : n.nombre;

async function abrir(id: number): Promise<void> {
  const a = analisis.value;
  if (!a) return;
  await ejecutar('abrir', () => api().discoUso.abrirCarpeta(a.id, id));
}
async function copiar(ruta: string): Promise<void> {
  await ejecutar('copiar', () => api().sistema.copiar(ruta), {
    exito: textos.acciones.copiado,
  });
}

const extensiones = computed(() => {
  const e = analisis.value?.extensiones;
  if (!e) return [];
  return [
    ...e.lista.map((x) => ({ ...x, nombre: x.ext === '' ? t.sinExtension : `.${x.ext}` })),
    ...(e.otros.archivos > 0
      ? [{ ext: '*', nombre: t.otrasExtensiones, bytes: e.otros.bytes, archivos: e.otros.archivos }]
      : []),
  ];
});

const avisos = computed(() => {
  const a = analisis.value;
  if (!a) return [];
  const l: string[] = [];
  if (a.omitidos.enlaces > 0) l.push(t.avisos.enlaces(a.omitidos.enlaces));
  if (a.omitidos.denegados > 0) l.push(t.avisos.denegados(a.omitidos.denegados));
  if (a.omitidos.enlacesDuros > 0) l.push(t.avisos.enlacesDuros(a.omitidos.enlacesDuros));
  if (a.enlacesDurosIncompleto) l.push(t.avisos.enlacesDurosIncompleto);
  if (a.truncado) l.push(t.avisos.truncado);
  return l;
});
const vacia = computed(() => analisis.value !== null && analisis.value.archivos === 0);

function irALimpieza(): void {
  solicitudes.herramienta = 'limpiezaDisco';
}
function irAVersiones(): void {
  void router.push({ name: 'servicios.versiones' });
}
</script>

<template>
  <div class="herr uso-disco">
    <NAlert type="info" :show-icon="false">{{ t.explicacion }}</NAlert>

    <div class="herr-etiqueta">{{ t.unidades }}</div>
    <div class="herr-fila">
      <NButton
        v-for="u in unidades ?? []"
        :key="u.ruta"
        secondary
        class="unidad"
        :disabled="analizando"
        @click="analizarUnidad(u)"
      >
        <span class="unidad-texto">
          <strong>{{ t.unidad(u.ruta, u.etiqueta) }}</strong>
          <small v-if="u.libre !== null && u.total !== null">{{
            t.espacioUnidad(formatoBytes(u.libre), formatoBytes(u.total))
          }}</small>
        </span>
      </NButton>
      <NButton secondary :disabled="analizando" data-testid="disco-elegir" @click="elegirCarpeta">{{
        t.elegirCarpeta
      }}</NButton>
    </div>
    <p v-if="unidades !== null && unidades.length === 0" class="herr-tenue">
      {{ t.sinUnidades }}
    </p>

    <div v-if="analizando" class="herr-fila progreso" role="status" aria-live="polite">
      <strong>{{ t.analizando }}</strong>
      <span v-if="progreso" class="herr-tenue">{{
        t.progreso(
          formatearNumero(progreso.archivos),
          formatearNumero(progreso.carpetas),
          formatoBytes(progreso.bytes),
        )
      }}</span>
      <NButton size="small" secondary @click="cancelar">{{ t.cancelar }}</NButton>
    </div>
    <p v-if="analizando && progreso" class="herr-tenue leyendo">
      {{ t.leyendo }}: <TextoLargo :texto="progreso.actual" mono :copiable="false" />
    </p>
    <p v-if="cancelada" class="herr-tenue">{{ t.cancelado }}</p>

    <EstadoVacio
      v-if="!analizando && !analisis && !cancelada"
      pequena
      :icono="PieChart"
      :titulo="t.vacio.titulo"
      :texto="t.vacio.texto"
    />

    <template v-if="analisis && !analizando">
      <EstadoVacio
        v-if="vacia"
        pequena
        :icono="PieChart"
        :titulo="t.sinContenido.titulo"
        :texto="t.sinContenido.texto"
      />
      <template v-else>
        <p class="herr-ok resumen" data-testid="disco-resumen">
          {{
            t.resumen(
              formatoBytes(analisis.total),
              formatearNumero(analisis.archivos),
              formatearNumero(analisis.carpetas),
            )
          }}
          <span class="herr-tenue">{{
            t.duracion(formatearNumero(analisis.duracionMs / 1000, { maximumFractionDigits: 1 }))
          }}</span>
        </p>
        <TextoLargo :texto="analisis.raiz" mono :copiable="false" />
        <p
          v-if="analisis.unidad && analisis.unidad.libre !== null && analisis.unidad.total !== null"
          class="herr-tenue"
        >
          {{
            t.espacioUnidad(
              formatoBytes(analisis.unidad.libre),
              formatoBytes(analisis.unidad.total),
            )
          }}
        </p>
        <NAlert
          v-for="(a, i) in avisos"
          :key="i"
          type="warning"
          :bordered="false"
          :show-icon="false"
          >{{ a }}</NAlert
        >
        <details v-if="analisis.enlaces.length" class="enlaces">
          <summary>{{ t.avisos.verEnlaces }}</summary>
          <ul>
            <li v-for="e in analisis.enlaces" :key="e">
              <TextoLargo :texto="e" mono :copiable="false" />
            </li>
          </ul>
        </details>

        <NTabs v-model:value="vista" type="line" size="small" :aria-label="t.unidades">
          <NTab name="arbol">{{ t.vistas.arbol }}</NTab>
          <NTab name="carpetas">{{ t.vistas.carpetas }}</NTab>
          <NTab name="archivos">{{ t.vistas.archivos }}</NTab>
          <NTab name="extensiones">{{ t.vistas.extensiones }}</NTab>
        </NTabs>

        <template v-if="vista === 'arbol'">
          <p class="herr-tenue">{{ t.arbolAyuda }}</p>
          <ul class="tabla" role="tree">
            <li
              v-for="f in filas"
              :key="f.nodo.id"
              class="fila"
              role="treeitem"
              :aria-level="f.nivel + 1"
              :aria-expanded="f.nodo.hijos?.length ? expandidos.has(f.nodo.id) : undefined"
            >
              <span class="nombre" :style="{ paddingLeft: `${f.nivel * 16}px` }">
                <NButton
                  v-if="f.nodo.hijos?.length"
                  quaternary
                  circle
                  size="tiny"
                  :aria-label="
                    expandidos.has(f.nodo.id)
                      ? t.contraer(f.nodo.nombre)
                      : t.expandir(f.nodo.nombre)
                  "
                  @click="alternar(f.nodo)"
                >
                  <template #icon
                    ><NIcon
                      ><ChevronDown v-if="expandidos.has(f.nodo.id)" /><ChevronForward
                        v-else /></NIcon
                  ></template>
                </NButton>
                <span v-else class="sin-flecha" />
                <span v-if="f.nodo.tipo === 'otros'" class="herr-tenue">{{
                  nombreDe(f.nodo)
                }}</span>
                <TextoLargo
                  v-else
                  :texto="f.nivel === 0 ? f.nodo.ruta : nombreDe(f.nodo)"
                  :copiable="false"
                  :cola="18"
                />
                <em v-if="f.nodo.denegado" class="herr-tenue">{{ t.denegada }}</em>
                <small
                  v-if="f.nodo.tipo === 'carpeta' && f.nodo.archivos !== undefined"
                  class="herr-tenue"
                  >{{ formatearNumero(f.nodo.archivos) }}</small
                >
              </span>
              <span class="barra" role="img" :aria-label="formatoPorcentaje(pct(f.nodo.tamano))">
                <span class="relleno" :style="{ width: `${Math.min(100, pct(f.nodo.tamano))}%` }" />
              </span>
              <span class="num">{{ formatoPorcentaje(pct(f.nodo.tamano)) }}</span>
              <span class="num peso">{{ formatoBytes(f.nodo.tamano) }}</span>
              <span class="acciones">
                <template v-if="f.nodo.tipo !== 'otros'">
                  <NButton
                    quaternary
                    circle
                    size="tiny"
                    :aria-label="t.abrir"
                    :title="t.abrir"
                    @click="abrir(f.nodo.id)"
                  >
                    <template #icon
                      ><NIcon><FolderOpenOutline /></NIcon
                    ></template>
                  </NButton>
                  <NButton
                    quaternary
                    circle
                    size="tiny"
                    :aria-label="t.copiar"
                    :title="t.copiar"
                    @click="copiar(f.nodo.ruta)"
                  >
                    <template #icon
                      ><NIcon><Copy /></NIcon
                    ></template>
                  </NButton>
                </template>
              </span>
            </li>
          </ul>
        </template>

        <template v-else-if="vista === 'carpetas'">
          <p class="herr-tenue">{{ t.carpetasAyuda }}</p>
          <ul class="tabla">
            <li v-for="c in analisis.carpetasTop" :key="c.id" class="fila plana">
              <span class="nombre"><TextoLargo :texto="c.ruta" mono :copiable="false" /></span>
              <span class="num">{{ formatearNumero(c.archivos) }}</span>
              <span class="num peso">{{ formatoBytes(c.tamano) }}</span>
              <span class="acciones">
                <NButton
                  quaternary
                  circle
                  size="tiny"
                  :aria-label="t.abrir"
                  :title="t.abrir"
                  @click="abrir(c.id)"
                >
                  <template #icon
                    ><NIcon><FolderOpenOutline /></NIcon
                  ></template>
                </NButton>
                <NButton
                  quaternary
                  circle
                  size="tiny"
                  :aria-label="t.copiar"
                  :title="t.copiar"
                  @click="copiar(c.ruta)"
                >
                  <template #icon
                    ><NIcon><Copy /></NIcon
                  ></template>
                </NButton>
              </span>
            </li>
          </ul>
        </template>

        <template v-else-if="vista === 'archivos'">
          <p class="herr-tenue">{{ t.archivosAyuda }}</p>
          <ul class="tabla">
            <li v-for="a in analisis.archivosTop" :key="a.id" class="fila plana">
              <span class="nombre"><TextoLargo :texto="a.ruta" mono :copiable="false" /></span>
              <span class="num peso">{{ formatoBytes(a.tamano) }}</span>
              <span class="acciones">
                <NButton
                  quaternary
                  circle
                  size="tiny"
                  :aria-label="t.abrir"
                  :title="t.abrir"
                  @click="abrir(a.id)"
                >
                  <template #icon
                    ><NIcon><FolderOpenOutline /></NIcon
                  ></template>
                </NButton>
                <NButton
                  quaternary
                  circle
                  size="tiny"
                  :aria-label="t.copiar"
                  :title="t.copiar"
                  @click="copiar(a.ruta)"
                >
                  <template #icon
                    ><NIcon><Copy /></NIcon
                  ></template>
                </NButton>
              </span>
            </li>
          </ul>
        </template>

        <template v-else>
          <p class="herr-tenue">{{ t.extensionesAyuda }}</p>
          <ul class="tabla">
            <li v-for="x in extensiones" :key="x.ext" class="fila ext">
              <span class="nombre">{{ x.nombre }}</span>
              <span class="barra" role="img" :aria-label="formatoPorcentaje(pct(x.bytes))">
                <span class="relleno" :style="{ width: `${Math.min(100, pct(x.bytes))}%` }" />
              </span>
              <span class="num">{{ formatoPorcentaje(pct(x.bytes)) }}</span>
              <span class="num">{{ formatearNumero(x.archivos) }}</span>
              <span class="num peso">{{ formatoBytes(x.bytes) }}</span>
            </li>
          </ul>
        </template>

        <p class="herr-tenue">{{ t.avisos.tamanoLogico }}</p>
        <section class="limpieza">
          <strong>{{ t.limpieza.titulo }}</strong>
          <p class="herr-tenue">{{ t.limpieza.texto }}</p>
          <div class="herr-fila">
            <NButton size="small" secondary @click="irALimpieza">{{
              t.limpieza.temporales
            }}</NButton>
            <NButton size="small" secondary @click="irAVersiones">{{
              t.limpieza.versiones
            }}</NButton>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.unidad {
  height: auto;
  padding: 6px 12px;
}
.unidad-texto {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}
.unidad-texto small {
  opacity: 0.75;
}
.progreso {
  gap: 12px;
}
.leyendo {
  display: flex;
  gap: 6px;
  min-width: 0;
}
.resumen {
  font-size: 14px;
}
.enlaces ul {
  margin: 6px 0 0;
  padding-left: 18px;
}
.tabla {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 8px;
  overflow: hidden;
}
.fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 56px 76px 60px;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  font-size: 12.5px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
.fila:last-child {
  border-bottom: 0;
}
.fila.plana {
  grid-template-columns: minmax(0, 1fr) 50px 76px 60px;
}
.fila.ext {
  grid-template-columns: minmax(0, 1fr) 110px 56px 60px 76px;
}
.nombre {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.sin-flecha {
  display: inline-block;
  width: 22px;
  flex: none;
}
.barra {
  height: 8px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.18);
  overflow: hidden;
}
.relleno {
  display: block;
  height: 100%;
  background: var(--acento);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.peso {
  font-weight: 600;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
}
</style>
