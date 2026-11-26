<script setup lang="ts">
import { NAlert, NButton } from 'naive-ui';
import { BYTES_TEXTO_DIFF } from '@pel/core';
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import type {
  ComparacionCarpetas,
  EntradaDiffUi,
  GrupoDiff,
  ResultadoArchivoDiff,
} from '../../../shared/api';
import { api } from '../../api';
import { abrirEnEditor } from '../../composables/abrirEnEditor';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { tamanoLegible } from '../../utilidades/herramientas';

const t = textos.herramientas.diffCarpetas;
const { ejecutar, ocupado } = useAccion();

const carpetaA = ref<string | null>(null);
const carpetaB = ref<string | null>(null);
const comparando = ref(false);
const cancelada = ref(false);
const comparacion = ref<ComparacionCarpetas | null>(null);
const errorComparar = ref<string | null>(null);

/** Entrada elegida: su grupo y su número (la ventana nunca maneja rutas absolutas de la comparación). */
const elegida = ref<{ grupo: GrupoDiff; id: number } | null>(null);
const cargandoArchivo = ref(false);
const archivoDiff = ref<ResultadoArchivoDiff | null>(null);
/** Evita que una respuesta tardía pise la de un archivo elegido después. */
let turno = 0;
const raiz = ref<HTMLElement | null>(null);

const grupos = computed(() => {
  const c = comparacion.value;
  if (!c) return [];
  return [
    {
      clave: 'distintos' as const,
      titulo: t.grupoDistintos,
      lista: c.distintos,
      total: c.resumen.totalDistintos,
    },
    { clave: 'soloA' as const, titulo: t.grupoSoloA, lista: c.soloA, total: c.resumen.totalSoloA },
    { clave: 'soloB' as const, titulo: t.grupoSoloB, lista: c.soloB, total: c.resumen.totalSoloB },
  ];
});
const hayDiferencias = computed(() => grupos.value.some((g) => g.total > 0));
/** Orden de navegación con el teclado: de arriba abajo por los tres grupos. */
const orden = computed(() =>
  grupos.value.flatMap((g) => g.lista.map((e) => ({ grupo: g.clave, e }))),
);
const indiceElegido = computed(() =>
  orden.value.findIndex((x) => x.grupo === elegida.value?.grupo && x.e.id === elegida.value?.id),
);
const entradaElegida = computed<EntradaDiffUi | null>(
  () => orden.value[indiceElegido.value]?.e ?? null,
);
const puedeComparar = computed(
  () => carpetaA.value !== null && carpetaB.value !== null && !comparando.value,
);

async function elegir(lado: 'a' | 'b'): Promise<void> {
  const r = await ejecutar('elegir', () => api().sistema.elegirCarpeta());
  if (!r) return;
  if (lado === 'a') carpetaA.value = r;
  else carpetaB.value = r;
}

async function comparar(): Promise<void> {
  if (!puedeComparar.value || carpetaA.value === null || carpetaB.value === null) return;
  comparando.value = true;
  cancelada.value = false;
  errorComparar.value = null;
  comparacion.value = null;
  elegida.value = null;
  archivoDiff.value = null;
  turno++;
  try {
    const r = await api().diffCarpetas.comparar(carpetaA.value, carpetaB.value);
    comparacion.value = r;
  } catch (e) {
    if ((e as { codigo?: unknown } | null)?.codigo === 'diff.cancelado') cancelada.value = true;
    else
      await ejecutar('comparar-error', () => {
        throw e;
      });
  } finally {
    comparando.value = false;
  }
}

async function cancelar(): Promise<void> {
  turno++;
  cargandoArchivo.value = false;
  await ejecutar('cancelar', () => api().diffCarpetas.cancelar());
}

async function elegirEntrada(grupo: GrupoDiff, e: EntradaDiffUi): Promise<void> {
  elegida.value = { grupo, id: e.id };
  archivoDiff.value = null;
  const miTurno = ++turno;
  if (grupo !== 'distintos' || comparacion.value === null) {
    cargandoArchivo.value = false;
    return;
  }
  cargandoArchivo.value = true;
  const id = comparacion.value.id;
  try {
    const r = await api().diffCarpetas.archivo(id, e.id);
    if (miTurno === turno) archivoDiff.value = r;
  } catch (err) {
    if (miTurno !== turno) return;
    if ((err as { codigo?: unknown } | null)?.codigo !== 'diff.cancelado') {
      await ejecutar('archivo-error', () => {
        throw err;
      });
    }
  } finally {
    if (miTurno === turno) cargandoArchivo.value = false;
  }
}

/** Mueve la selección sin cargar el diff (eso se hace con Enter o con un clic). */
function moverA(i: number): void {
  const n = orden.value.length;
  if (n === 0) return;
  const k = Math.min(n - 1, Math.max(0, i));
  const x = orden.value[k]!;
  elegida.value = { grupo: x.grupo, id: x.e.id };
  archivoDiff.value = null;
  turno++;
  cargandoArchivo.value = false;
  void nextTick(() =>
    raiz.value
      ?.querySelector(`[data-entrada="${x.grupo}-${String(x.e.id)}"]`)
      ?.scrollIntoView({ block: 'nearest' }),
  );
}

function alTecla(ev: KeyboardEvent): void {
  switch (ev.key) {
    case 'ArrowDown':
      ev.preventDefault();
      moverA(indiceElegido.value + 1);
      break;
    case 'ArrowUp':
      ev.preventDefault();
      moverA(indiceElegido.value <= 0 ? 0 : indiceElegido.value - 1);
      break;
    case 'Home':
      ev.preventDefault();
      moverA(0);
      break;
    case 'End':
      ev.preventDefault();
      moverA(orden.value.length - 1);
      break;
    case 'Enter': {
      const x = orden.value[indiceElegido.value];
      if (x) {
        ev.preventDefault();
        void elegirEntrada(x.grupo, x.e);
      }
      break;
    }
    case 'Escape':
      // Cancela lo que esté en curso sin cerrar el cajón; sin nada en curso, deja que Esc siga su camino.
      if (comparando.value || cargandoArchivo.value) {
        ev.stopPropagation();
        void cancelar();
      }
      break;
  }
}

/** Abre un archivo de la comparación en el editor: el proceso principal registra la ruta. */
async function abrirLado(lado: 'a' | 'b'): Promise<void> {
  const c = comparacion.value;
  const e = entradaElegida.value;
  if (!c || !e) return;
  const ruta = await ejecutar('abrir', () => api().diffCarpetas.prepararEditor(c.id, e.id, lado));
  if (ruta) abrirEnEditor(ruta);
}

const hayLadoA = computed(() => elegida.value !== null && elegida.value.grupo !== 'soloB');
const hayLadoB = computed(() => elegida.value !== null && elegida.value.grupo !== 'soloA');

const motivoTexto = (e: EntradaDiffUi): string =>
  e.motivo === 'tamano' ? t.motivoTamano : e.motivo === 'contenido' ? t.motivoContenido : '';
const tamanoTexto = (e: EntradaDiffUi): string =>
  t.tamano(
    e.tamanoA === null ? '—' : tamanoLegible(e.tamanoA),
    e.tamanoB === null ? '—' : tamanoLegible(e.tamanoB),
  );

const saltosA = computed(() =>
  archivoDiff.value?.tipo === 'texto' ? t.saltos[archivoDiff.value.saltosA] : '',
);
const saltosB = computed(() =>
  archivoDiff.value?.tipo === 'texto' ? t.saltos[archivoDiff.value.saltosB] : '',
);
const saltosDifieren = computed(
  () => archivoDiff.value?.tipo === 'texto' && saltosA.value !== saltosB.value,
);
// El tope de texto sale del mismo valor que usa el núcleo (no un número suelto en la ventana).
const kbTope = Math.round(BYTES_TEXTO_DIFF / 1024);

onBeforeUnmount(() => {
  turno++;
  if (comparando.value || cargandoArchivo.value)
    void api()
      .diffCarpetas.cancelar()
      .catch(() => undefined);
});
</script>

<template>
  <div ref="raiz" class="herr">
    <NAlert type="info" :show-icon="false">{{ t.explicacion }}</NAlert>

    <div class="herr-columnas">
      <div v-for="lado in ['a', 'b'] as const" :key="lado">
        <div class="herr-etiqueta">{{ lado === 'a' ? t.carpetaA : t.carpetaB }}</div>
        <div class="herr-fila">
          <NButton
            secondary
            :loading="ocupado('elegir')"
            :disabled="comparando"
            @click="elegir(lado)"
            >{{ t.elegir }}</NButton
          >
        </div>
        <p class="herr-tenue ruta" :title="(lado === 'a' ? carpetaA : carpetaB) ?? undefined">
          {{ (lado === 'a' ? carpetaA : carpetaB) ?? t.sinElegir }}
        </p>
      </div>
    </div>

    <div class="herr-fila">
      <NButton type="primary" :disabled="!puedeComparar" :loading="comparando" @click="comparar">{{
        comparando ? t.comparando : t.comparar
      }}</NButton>
      <NButton v-if="comparando || cargandoArchivo" secondary @click="cancelar">{{
        t.cancelar
      }}</NButton>
    </div>

    <p v-if="cancelada" class="herr-tenue">{{ t.cancelada }}</p>
    <p v-if="errorComparar" class="herr-error">{{ errorComparar }}</p>

    <template v-if="comparacion">
      <p class="herr-ok">
        {{
          t.resumen(
            comparacion.resumen.archivosA,
            comparacion.resumen.archivosB,
            comparacion.resumen.iguales,
          )
        }}
      </p>
      <p v-if="!hayDiferencias && !comparacion.resumen.truncado" class="herr-ok">{{ t.iguales }}</p>
      <p v-if="comparacion.resumen.truncado" class="herr-tenue">{{ t.truncado }}</p>
      <p v-if="comparacion.resumen.recortado" class="herr-tenue">
        {{
          t.recortado(
            comparacion.soloA.length + comparacion.soloB.length + comparacion.distintos.length,
            comparacion.resumen.totalSoloA +
              comparacion.resumen.totalSoloB +
              comparacion.resumen.totalDistintos,
          )
        }}
      </p>
      <p v-if="comparacion.resumen.sinComparar" class="herr-tenue">
        {{ t.sinComparar(comparacion.resumen.sinComparar) }}
      </p>
      <p v-if="comparacion.resumen.omitidos" class="herr-tenue">
        {{ t.omitidos(comparacion.resumen.omitidos) }}
      </p>
      <p v-if="hayDiferencias" class="herr-tenue">{{ t.atajos }}</p>

      <div
        v-if="hayDiferencias"
        class="cuerpo"
        role="listbox"
        tabindex="0"
        :aria-label="t.listaAria(t.grupoDistintos)"
        :aria-activedescendant="elegida ? `ent-${elegida.grupo}-${elegida.id}` : undefined"
        @keydown="alTecla"
      >
        <section v-for="g in grupos" :key="g.clave" class="grupo">
          <h3 class="grupo-titulo">{{ t.grupo(g.titulo, g.total) }}</h3>
          <p v-if="g.lista.length === 0" class="herr-tenue">{{ t.vacio }}</p>
          <ul class="filas" role="group" :aria-label="t.listaAria(g.titulo)">
            <li
              v-for="e in g.lista"
              :id="`ent-${g.clave}-${e.id}`"
              :key="e.id"
              role="option"
              :aria-selected="elegida?.grupo === g.clave && elegida?.id === e.id"
              :data-entrada="`${g.clave}-${e.id}`"
              :class="['fila', { elegida: elegida?.grupo === g.clave && elegida?.id === e.id }]"
              @click="elegirEntrada(g.clave, e)"
            >
              <span class="ruta-entrada">{{ e.ruta }}</span>
              <span class="detalle-entrada">
                <template v-if="g.clave === 'distintos'">{{ motivoTexto(e) }} · </template
                >{{ tamanoTexto(e) }}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="elegida" class="detalle" :aria-label="t.detalleAria">
        <div class="herr-fila">
          <strong class="ruta-entrada">{{ entradaElegida?.ruta }}</strong>
          <NButton
            v-if="hayLadoA"
            quaternary
            size="small"
            :loading="ocupado('abrir')"
            @click="abrirLado('a')"
            >{{ t.abrirA }}</NButton
          >
          <NButton
            v-if="hayLadoB"
            quaternary
            size="small"
            :loading="ocupado('abrir')"
            @click="abrirLado('b')"
            >{{ t.abrirB }}</NButton
          >
        </div>
        <p v-if="elegida.grupo === 'soloA'" class="herr-tenue">{{ t.soloEnUno(t.carpetaA) }}</p>
        <p v-else-if="elegida.grupo === 'soloB'" class="herr-tenue">
          {{ t.soloEnUno(t.carpetaB) }}
        </p>
        <p v-else-if="cargandoArchivo" class="herr-tenue" role="status">{{ t.cargando }}</p>
        <template v-else-if="archivoDiff">
          <p v-if="archivoDiff.tipo === 'sensible'" class="herr-aviso">{{ t.sensible }}</p>
          <p v-else-if="archivoDiff.tipo === 'binario'" class="herr-tenue">{{ t.binario }}</p>
          <p v-else-if="archivoDiff.tipo === 'tope'" class="herr-tenue">{{ t.tope(kbTope) }}</p>
          <p v-else-if="archivoDiff.tipo === 'demasiado-distinto'" class="herr-tenue">
            {{ t.demasiadoDistinto }}
          </p>
          <template v-else>
            <p v-if="saltosDifieren" class="herr-aviso">
              {{ t.saltosDistintos(saltosA, saltosB) }}
            </p>
            <p v-if="archivoDiff.soloSaltos" class="herr-ok">{{ t.soloSaltos }}</p>
            <p v-else class="herr-tenue">
              {{ t.resumenArchivo(archivoDiff.agregadas, archivoDiff.quitadas) }}
            </p>
            <p v-if="archivoDiff.truncado" class="herr-tenue">{{ t.truncadoArchivo }}</p>
            <div
              v-if="!archivoDiff.soloSaltos"
              class="tabla"
              role="region"
              :aria-label="t.detalleAria"
            >
              <table>
                <tbody>
                  <tr v-for="(f, i) in archivoDiff.filas" :key="i" :class="f.tipo">
                    <template v-if="f.tipo === 'salto'">
                      <td colspan="4" class="salto">{{ t.lineasIguales(Number(f.texto)) }}</td>
                    </template>
                    <template v-else>
                      <td class="num">{{ f.numA ?? '' }}</td>
                      <td class="num">{{ f.numB ?? '' }}</td>
                      <td class="marca" aria-hidden="true">
                        {{ f.tipo === 'agregada' ? '+' : f.tipo === 'quitada' ? '−' : ' ' }}
                      </td>
                      <td class="texto">{{ f.texto }}</td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </template>
        <p v-else class="herr-tenue">{{ t.elegirArchivo }}</p>
      </section>
      <p v-else-if="hayDiferencias" class="herr-tenue">{{ t.elegirArchivo }}</p>
    </template>
  </div>
</template>

<style scoped>
.ruta {
  word-break: break-all;
  margin-top: 6px;
}
.cuerpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 34vh;
  overflow: auto;
  border-radius: 8px;
  outline: none;
}
.cuerpo:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 3px;
}
.grupo-titulo {
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 700;
}
.filas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fila {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 6px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
}
.fila.elegida {
  border-color: var(--acento);
  background: rgba(var(--acento-rgb), 0.1);
}
.ruta-entrada {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  word-break: break-all;
}
.detalle-entrada {
  flex: none;
  font-size: 12px;
  opacity: 0.78;
  text-align: right;
}
.detalle {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid rgba(128, 128, 128, 0.25);
  padding-top: 10px;
}
.herr-aviso {
  margin: 0;
  font-weight: 600;
}
.tabla {
  max-height: 46vh;
  overflow: auto;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
td {
  padding: 0 8px;
  vertical-align: top;
}
.num {
  width: 1%;
  min-width: 40px;
  text-align: right;
  opacity: 0.72;
  user-select: none;
}
.marca {
  width: 1%;
  text-align: center;
  user-select: none;
}
.texto {
  white-space: pre-wrap;
  word-break: break-all;
}
.agregada {
  background: rgba(46, 160, 67, 0.16);
}
.quitada {
  background: rgba(248, 81, 73, 0.16);
}
.salto {
  text-align: center;
  opacity: 0.72;
  font-style: italic;
}
</style>
