<script setup lang="ts">
import type {
  EstadoLaboratorio,
  IdArchivoLaboratorio,
  OrdenLaboratorio,
  ResultadoOrdenLaboratorio,
} from '@pel/core';
import { GitBranch } from '@vicons/ionicons5';
import { NAlert, NButton, NInput, NSpin, useMessage } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { api } from '../../api';
import { textos } from '../../i18n';
import {
  ejecutarPaso,
  PASOS_CONFLICTO,
  PASO_ELEGIR,
  PASO_MERGE,
  type Eleccion,
} from '../../utilidades/conflictoGuiado';
import { mensajeDeError } from '../../utilidades/errores';
import EstadoVacio from '../EstadoVacio.vue';

/**
 * Laboratorio de Git (D50): repositorio de práctica y remoto local en una carpeta propia de
 * WolfCore Dev. Cada botón es una orden de la lista cerrada del núcleo; aquí no hay shell ni rutas.
 */
const t = textos.guias.git.lab;
const message = useMessage();

const estado = ref<EstadoLaboratorio | null>(null);
const cargando = ref(true);
const ocupado = ref(false);
const resultado = ref<ResultadoOrdenLaboratorio | null>(null);
const grafo = ref('');

const mensaje = ref(t.mensajePorDefecto);
const rama = ref('rama-a');
const etiqueta = ref('v1.0');
const archivo = ref<IdArchivoLaboratorio>('notas.txt');
const texto = ref('');

const archivos = computed(() => estado.value?.archivos ?? []);

function cargarTexto(): void {
  texto.value = archivos.value.find((a) => a.id === archivo.value)?.contenido ?? '';
}

async function refrescar(): Promise<void> {
  estado.value = await api().laboratorioGit.estado();
  cargarTexto();
}

onMounted(async () => {
  try {
    await refrescar();
  } catch (e) {
    message.error(mensajeDeError(e));
  } finally {
    cargando.value = false;
  }
});

/** Hace algo con el laboratorio de una en una y muestra el error si lo hay. */
async function hacer(fn: () => Promise<void>): Promise<void> {
  if (ocupado.value) return;
  ocupado.value = true;
  try {
    await fn();
  } catch (e) {
    message.error(mensajeDeError(e));
  } finally {
    ocupado.value = false;
  }
}

function mostrar(r: ResultadoOrdenLaboratorio | null): void {
  if (!r) return;
  resultado.value = r;
  grafo.value = r.grafo;
}

function correr(o: OrdenLaboratorio): Promise<void> {
  return hacer(async () => {
    mostrar(await api().laboratorioGit.ejecutar(o));
    await refrescar();
  });
}

function guardar(): Promise<void> {
  return hacer(async () => {
    await api().laboratorioGit.escribirArchivo(archivo.value, texto.value);
    await refrescar();
    message.success(t.archivos.guardado);
  });
}

function reiniciar(): Promise<void> {
  return hacer(async () => {
    estado.value = await api().laboratorioGit.reiniciar();
    resultado.value = null;
    grafo.value = '';
    pasoHecho.value = -1;
    cargarTexto();
    message.success(t.reiniciado);
  });
}

function elegirArchivo(id: IdArchivoLaboratorio): void {
  archivo.value = id;
  cargarTexto();
}

interface Boton {
  etiqueta: string;
  orden: () => OrdenLaboratorio;
  id: string;
}
interface Grupo {
  id: 'basico' | 'ramas' | 'guardar' | 'remoto';
  botones: Boton[];
}

const grupos = computed<Grupo[]>(() => [
  {
    id: 'basico',
    botones: [
      { id: 'init', etiqueta: 'git init', orden: () => ({ cmd: 'init' }) },
      { id: 'status', etiqueta: 'git status', orden: () => ({ cmd: 'status' }) },
      {
        id: 'add',
        etiqueta: `git add ${archivo.value}`,
        orden: () => ({ cmd: 'add', archivo: archivo.value }),
      },
      { id: 'add-todo', etiqueta: 'git add .', orden: () => ({ cmd: 'add', archivo: 'todo' }) },
      {
        id: 'commit',
        etiqueta: 'git commit -m',
        orden: () => ({ cmd: 'commit', mensaje: mensaje.value }),
      },
      {
        id: 'log',
        etiqueta: 'git log --oneline --graph --all --decorate',
        orden: () => ({ cmd: 'log' }),
      },
      { id: 'diff', etiqueta: 'git diff', orden: () => ({ cmd: 'diff' }) },
      {
        id: 'diff-staged',
        etiqueta: 'git diff --staged',
        orden: () => ({ cmd: 'diff', preparado: true }),
      },
    ],
  },
  {
    id: 'ramas',
    botones: [
      { id: 'branch', etiqueta: 'git branch', orden: () => ({ cmd: 'branch' }) },
      {
        id: 'branch-n',
        etiqueta: `git branch ${rama.value}`,
        orden: () => ({ cmd: 'branch', nombre: rama.value }),
      },
      {
        id: 'switch',
        etiqueta: `git switch ${rama.value}`,
        orden: () => ({ cmd: 'switch', nombre: rama.value }),
      },
      {
        id: 'switch-c',
        etiqueta: `git switch -c ${rama.value}`,
        orden: () => ({ cmd: 'switch', nombre: rama.value, crear: true }),
      },
      {
        id: 'merge',
        etiqueta: `git merge ${rama.value}`,
        orden: () => ({ cmd: 'merge', nombre: rama.value }),
      },
      {
        id: 'merge-abort',
        etiqueta: 'git merge --abort',
        orden: () => ({ cmd: 'merge', abortar: true }),
      },
    ],
  },
  {
    id: 'guardar',
    botones: [
      { id: 'stash', etiqueta: 'git stash push', orden: () => ({ cmd: 'stash', accion: 'push' }) },
      {
        id: 'stash-list',
        etiqueta: 'git stash list',
        orden: () => ({ cmd: 'stash', accion: 'list' }),
      },
      {
        id: 'stash-pop',
        etiqueta: 'git stash pop',
        orden: () => ({ cmd: 'stash', accion: 'pop' }),
      },
      {
        id: 'restore',
        etiqueta: `git restore ${archivo.value}`,
        orden: () => ({ cmd: 'restore', archivo: archivo.value }),
      },
      {
        id: 'restore-staged',
        etiqueta: `git restore --staged ${archivo.value}`,
        orden: () => ({ cmd: 'restore', archivo: archivo.value, preparado: true }),
      },
      {
        id: 'reset-soft',
        etiqueta: 'git reset --soft HEAD~1',
        orden: () => ({ cmd: 'reset-soft' }),
      },
      { id: 'revert', etiqueta: 'git revert HEAD', orden: () => ({ cmd: 'revert' }) },
    ],
  },
  {
    id: 'remoto',
    botones: [
      {
        id: 'remote-add',
        etiqueta: 'git remote add origin',
        orden: () => ({ cmd: 'remote', accion: 'add' }),
      },
      {
        id: 'remote-v',
        etiqueta: 'git remote -v',
        orden: () => ({ cmd: 'remote', accion: 'ver' }),
      },
      { id: 'fetch', etiqueta: 'git fetch', orden: () => ({ cmd: 'fetch' }) },
      { id: 'pull', etiqueta: 'git pull', orden: () => ({ cmd: 'pull' }) },
      { id: 'push', etiqueta: 'git push -u origin HEAD', orden: () => ({ cmd: 'push' }) },
      {
        id: 'push-tags',
        etiqueta: 'git push origin --tags',
        orden: () => ({ cmd: 'push', etiquetas: true }),
      },
      { id: 'tag', etiqueta: 'git tag', orden: () => ({ cmd: 'tag' }) },
      {
        id: 'tag-n',
        etiqueta: `git tag ${etiqueta.value}`,
        orden: () => ({ cmd: 'tag', nombre: etiqueta.value }),
      },
    ],
  },
]);

// ---- Ejercicio guiado: un conflicto ----
const pasoHecho = ref(-1);
const eleccion = ref<Eleccion | null>(null);
const fallo = ref(false);
const siguiente = computed(() => pasoHecho.value + 1);
const textoConflicto = computed(
  () => archivos.value.find((a) => a.id === 'colores.txt')?.contenido ?? '',
);

function correrPaso(): Promise<void> {
  const paso = siguiente.value;
  if (paso === PASO_ELEGIR && !eleccion.value) return Promise.resolve();
  return hacer(async () => {
    const r = await ejecutarPaso(api().laboratorioGit, paso, eleccion.value ?? undefined);
    mostrar(r.ultimo);
    await refrescar();
    fallo.value = r.fallo;
    if (!r.fallo) pasoHecho.value = paso;
    if (paso === 0) archivo.value = 'colores.txt';
    cargarTexto();
  });
}

function reempezar(): Promise<void> {
  eleccion.value = null;
  fallo.value = false;
  pasoHecho.value = -1;
  return reiniciar();
}

const ELECCIONES: Eleccion[] = ['mia', 'otra', 'ambas'];
</script>

<template>
  <div class="lab">
    <p class="herr-tenue">{{ t.intro }}</p>

    <div v-if="cargando" class="centro"><NSpin size="small" /> {{ t.cargando }}</div>

    <EstadoVacio
      v-else-if="!estado?.disponible"
      :icono="GitBranch"
      :titulo="t.sinGit.titulo"
      :texto="t.sinGit.texto"
      data-testid="lab-sin-git"
    />

    <template v-else>
      <div class="herr-fila">
        <NButton
          size="small"
          secondary
          :disabled="ocupado"
          :title="t.reiniciarAyuda"
          data-testid="lab-reiniciar"
          @click="reiniciar"
        >
          {{ t.reiniciar }}
        </NButton>
        <span v-if="estado.version" class="herr-tenue">{{ t.version(estado.version) }}</span>
      </div>

      <div class="cuadricula">
        <section class="columna" :aria-label="t.ordenes">
          <div class="campos">
            <label
              >{{ t.mensaje }}<NInput v-model:value="mensaje" size="small" maxlength="200"
            /></label>
            <label>{{ t.rama }}<NInput v-model:value="rama" size="small" maxlength="61" /></label>
            <label
              >{{ t.etiqueta }}<NInput v-model:value="etiqueta" size="small" maxlength="30"
            /></label>
          </div>
          <div v-for="g in grupos" :key="g.id" class="grupo">
            <strong>{{ t.grupos[g.id] }}</strong>
            <div class="botones">
              <NButton
                v-for="b in g.botones"
                :key="b.id"
                size="tiny"
                secondary
                :disabled="ocupado"
                :data-testid="`lab-${b.id}`"
                @click="correr(b.orden())"
              >
                <code>{{ b.etiqueta }}</code>
              </NButton>
            </div>
          </div>

          <div class="grupo">
            <strong>{{ t.archivos.titulo }}</strong>
            <span class="herr-tenue">{{ t.archivos.ayuda }}</span>
            <div class="botones">
              <NButton
                v-for="a in archivos"
                :key="a.id"
                size="tiny"
                :type="archivo === a.id ? 'primary' : 'default'"
                :secondary="archivo === a.id"
                :aria-pressed="archivo === a.id"
                @click="elegirArchivo(a.id)"
              >
                <code>{{ a.id }}</code>
              </NButton>
            </div>
            <textarea
              v-model="texto"
              class="area"
              rows="5"
              maxlength="2000"
              spellcheck="false"
              :aria-label="t.archivos.areaTexto(archivo)"
              data-testid="lab-archivo"
            />
            <div>
              <NButton
                size="small"
                type="primary"
                secondary
                :disabled="ocupado"
                data-testid="lab-guardar"
                @click="guardar"
              >
                {{ t.archivos.guardar }}
              </NButton>
            </div>
          </div>
        </section>

        <section class="columna">
          <div class="grupo">
            <strong>{{ t.salida }}</strong>
            <div class="bloque" data-testid="lab-salida">
              <pre v-if="resultado"><span class="cmd">$ {{ resultado.orden }}</span>
{{ resultado.salida }}</pre>
              <pre v-else class="vacio">{{ t.salidaVacia }}</pre>
            </div>
            <span v-if="resultado" class="herr-tenue">
              {{ t.codigo(resultado.codigo)
              }}<template v-if="resultado.truncada"> · {{ t.truncada }}</template>
            </span>
          </div>
          <div class="grupo">
            <strong>{{ t.historial }}</strong>
            <div class="bloque" data-testid="lab-historial">
              <pre v-if="grafo">{{ grafo }}</pre>
              <pre v-else class="vacio">{{ t.historialVacio }}</pre>
            </div>
          </div>
        </section>
      </div>

      <section class="conflicto" data-testid="lab-conflicto">
        <h4>{{ t.conflicto.titulo }}</h4>
        <p class="herr-tenue">{{ t.conflicto.intro }}</p>
        <ol class="pasos">
          <li
            v-for="(p, i) in t.conflicto.pasos"
            :key="i"
            :class="{ hecho: i <= pasoHecho, actual: i === siguiente }"
            :aria-current="i === siguiente ? 'step' : undefined"
          >
            <div class="paso-cab">
              <strong>{{ t.conflicto.paso(i + 1, PASOS_CONFLICTO) }} · {{ p.titulo }}</strong>
              <span v-if="i <= pasoHecho" class="ok">{{ t.conflicto.hecho }}</span>
            </div>
            <p>{{ p.texto }}</p>
            <template v-if="i === siguiente && i === PASO_ELEGIR">
              <pre v-if="textoConflicto" class="marcas">{{ textoConflicto }}</pre>
              <div class="botones">
                <NButton
                  v-for="e in ELECCIONES"
                  :key="e"
                  size="small"
                  :type="eleccion === e ? 'primary' : 'default'"
                  :secondary="eleccion === e"
                  :aria-pressed="eleccion === e"
                  :data-testid="`lab-elegir-${e}`"
                  @click="eleccion = e"
                >
                  {{ t.conflicto.elegir[e] }}
                </NButton>
              </div>
            </template>
            <NButton
              v-if="i === siguiente"
              size="small"
              type="primary"
              :disabled="ocupado || (i === PASO_ELEGIR && !eleccion)"
              :data-testid="`lab-paso-${i}`"
              @click="correrPaso"
            >
              {{ t.conflicto.ejecutar }}
            </NButton>
            <p v-if="i === PASO_MERGE && i <= pasoHecho" class="herr-tenue">
              {{ t.conflicto.esperado }}
            </p>
          </li>
        </ol>
        <NAlert v-if="siguiente >= PASOS_CONFLICTO" type="success" :show-icon="false">{{
          t.conflicto.final
        }}</NAlert>
        <NButton
          v-if="pasoHecho >= 0"
          size="small"
          quaternary
          :disabled="ocupado"
          @click="reempezar"
        >
          {{ t.conflicto.reempezar }}
        </NButton>
      </section>
    </template>
  </div>
</template>

<style scoped>
.lab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.centro {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cuadricula {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
@media (max-width: 900px) {
  .cuadricula {
    grid-template-columns: minmax(0, 1fr);
  }
}
.columna {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.campos {
  display: grid;
  /* Sin recortar el mensaje del commit en una ventana estrecha: pasa a dos filas. */
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}
.campos label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}
.grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.botones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.botones code {
  font-family: var(--fuente-mono);
  font-size: 11.5px;
}
.area {
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  resize: vertical;
}
.bloque pre {
  margin: 0;
  padding: 10px 12px;
  min-height: 60px;
  max-height: 260px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: pre;
}
.bloque .vacio {
  opacity: 0.65;
  white-space: pre-wrap;
}
.cmd {
  font-weight: 700;
}
.conflicto {
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.conflicto h4 {
  margin: 0;
}
.pasos {
  margin: 0;
  padding-left: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pasos li {
  opacity: 0.7;
}
.pasos li.actual,
.pasos li.hecho {
  opacity: 1;
}
.pasos p {
  margin: 2px 0 6px;
  font-size: 13px;
}
.paso-cab {
  display: flex;
  gap: 8px;
  align-items: center;
}
.ok {
  color: var(--n-success-color, #18a058);
  font-size: 12px;
}
.marcas {
  margin: 0 0 6px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
</style>
