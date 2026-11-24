<script setup lang="ts">
import {
  Add,
  ChatbubbleEllipses,
  Close,
  CloudDownload,
  Copy,
  InformationCircle,
  Power,
  Refresh,
  Send,
  Sparkles,
  TrashOutline,
} from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NEmpty,
  NIcon,
  NInput,
  NProgress,
  NSkeleton,
  NSpin,
  NTooltip,
  useDialog,
  useMessage,
  type SelectOption,
} from 'naive-ui';
import Desplegable from '../componentes/Desplegable.vue';
import { computed, h, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { ModeloOllama, ProveedorIaPublico } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import DialogoEnvIa from '../componentes/DialogoEnvIa.vue';
import DialogoProveedorIa from '../componentes/DialogoProveedorIa.vue';
import IlustracionVacia from '../componentes/IlustracionVacia.vue';
import TarjetaProveedorIa from '../componentes/TarjetaProveedorIa.vue';
import { formatearFecha, textos } from '../i18n';
import { porcentaje, useIa, type DescargaIa } from '../stores/ia';
import { useServicios } from '../stores/servicios';
import { formatearTamano } from '../utilidades/bd';

/** Igual que `NOMBRE_MODELO_OLLAMA` del núcleo (que vuelve a validar). */
const NOMBRE_MODELO = /^[a-z0-9][a-z0-9._:/-]{0,127}$/i;

const t = textos.iaLocal;
const tn = textos.ia;
const td = t.descargar;
const tp = t.progreso;
const router = useRouter();
const dialog = useDialog();
const message = useMessage();
const servicios = useServicios();
const ia = useIa();
const { ejecutar, ocupado } = useAccion();

const instaladosListos = ref(false);
const servicio = computed(() => servicios.porId['ollama']);
const encendido = computed(() => servicio.value?.estado === 'encendido');
const sinInstalar = computed(
  () =>
    instaladosListos.value &&
    !servicio.value &&
    (servicios.instalados['ollama']?.length ?? 0) === 0,
);

onMounted(() => {
  void servicios
    .cargarInstalados('ollama')
    .catch(() => undefined)
    .finally(() => (instaladosListos.value = true));
  void ia.cargarSugeridos();
  void ia.cargarEspacio();
  void cargarBloque();
  void ia.cargarProveedores();
});

// ---- IA en la nube ----
const dialogoProveedor = ref(false);
const enEdicion = ref<ProveedorIaPublico | null>(null);
const dialogoEnv = ref(false);
const paraEnv = ref<ProveedorIaPublico | null>(null);

function nuevoProveedor(): void {
  enEdicion.value = null;
  dialogoProveedor.value = true;
}
function editarProveedor(p: ProveedorIaPublico): void {
  enEdicion.value = p;
  dialogoProveedor.value = true;
}
function usarEnProyecto(p: ProveedorIaPublico): void {
  paraEnv.value = p;
  dialogoEnv.value = true;
}

/** Aviso de costo: el mensaje solo sale con el clic en "Enviar el mensaje". */
function pedirMensaje(p: ProveedorIaPublico, modelo: string): void {
  dialog.warning({
    title: tn.costo.titulo,
    content: tn.costo.texto(modelo, p.nombre),
    positiveText: tn.costo.enviar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: () => {
      void ia.probarMensaje(p.id, modelo);
    },
  });
}

/**
 * Borrar la clave o el proveedor. En el mismo diálogo se ofrece borrar las copias del .env que
 * tienen esa clave en texto plano (desmarcado: borrarlas no se puede deshacer).
 */
async function pedirBorrado(p: ProveedorIaPublico, que: 'clave' | 'proveedor'): Promise<void> {
  let sitiosConCopias: string[] = [];
  if (p.clave.configurada) {
    try {
      sitiosConCopias = (await api().ia.respaldosClave(p.id)).sitios;
    } catch {
      sitiosConCopias = [];
    }
  }
  const limpiar = ref(false);
  const n = sitiosConCopias.length;
  dialog.warning({
    title: que === 'clave' ? tn.borrar.claveTitulo(p.nombre) : tn.borrar.proveedorTitulo(p.nombre),
    content: () =>
      h('div', { class: 'borrar-ia' }, [
        h('p', que === 'clave' ? tn.borrar.claveTexto : tn.borrar.proveedorTexto),
        n > 0
          ? h(
              NCheckbox,
              {
                checked: limpiar.value,
                'onUpdate:checked': (v: boolean) => (limpiar.value = v),
              },
              () => tn.borrar.respaldos(n),
            )
          : null,
        n > 0 ? h('small', { class: 'borrar-ia-ayuda' }, tn.borrar.respaldosAyuda) : null,
      ]),
    positiveText: textos.acciones.borrar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      const conCopias = limpiar.value;
      if (que === 'clave') {
        const r = await ejecutar(`borrar-clave-${p.id}`, () => ia.borrarClave(p.id, conCopias), {
          exito: tn.borrar.claveBorrada,
        });
        if (r) message.info(tn.borrar.respaldosBorrados(r));
        if (enEdicion.value?.id === p.id) {
          enEdicion.value = ia.proveedores?.find((x) => x.id === p.id) ?? null;
        }
      } else {
        await ejecutar(`borrar-${p.id}`, () => ia.borrarProveedor(p.id, conCopias), {
          exito: tn.borrar.proveedorBorrado(p.nombre),
        });
      }
    },
  });
}

// La lista se lee al entrar y cada vez que Ollama termina de encender.
watch(
  encendido,
  (v) => {
    if (v) void ia.cargarModelos();
  },
  { immediate: true },
);

function encender(): void {
  if (ocupado('encender')) return;
  void ejecutar('encender', () => api().servicios.iniciar('ollama'));
}
function irAServicios(): void {
  void router.push({ name: 'servicios' });
}
function copiar(texto: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(texto), { exito: textos.acciones.copiado });
}

// ---- Modelos ----
const modelos = computed(() => ia.modelos ?? []);
const fecha = (iso: string): string => formatearFecha(iso, { dateStyle: 'short' });
/** "llama3.2" y "llama3.2:latest" son el mismo modelo. */
const sinEtiquetaLatest = (n: string): string => n.toLowerCase().replace(/:latest$/, '');
const instalado = (nombre: string): boolean =>
  modelos.value.some((m) => sinEtiquetaLatest(m.nombre) === sinEtiquetaLatest(nombre));

function confirmarBorrar(m: ModeloOllama): void {
  if (ocupado(`borrar-${m.nombre}`)) return;
  dialog.warning({
    title: t.borrarTitulo(m.nombre),
    content: t.borrarTexto(formatearTamano(m.tamanoBytes)),
    positiveText: textos.acciones.borrar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      await ejecutar(`borrar-${m.nombre}`, () => ia.borrar(m.nombre), {
        exito: t.borrado(m.nombre),
      });
      if (modeloPrueba.value === m.nombre) modeloPrueba.value = null;
    },
  });
}

// ---- Descargar ----
const nombreNuevo = ref('');
const intentado = ref(false);
const errorNombre = computed(() => {
  const n = nombreNuevo.value.trim();
  if (!n) return null;
  if (!NOMBRE_MODELO.test(n)) return td.invalido;
  if (ia.enCurso(n)) return td.enCurso;
  if (instalado(n)) return td.yaInstalado;
  return null;
});
const puedeDescargar = computed(() => !!nombreNuevo.value.trim() && !errorNombre.value);
const descargas = computed(() => Object.values(ia.descargas));

function elegirSugerencia(n: string): void {
  nombreNuevo.value = n;
}

function pedirDescarga(): void {
  intentado.value = true;
  if (!puedeDescargar.value) return;
  const n = nombreNuevo.value.trim();
  dialog.info({
    title: td.confirmarTitulo(n),
    content: td.confirmarTexto,
    positiveText: td.confirmar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: () => {
      nombreNuevo.value = '';
      intentado.value = false;
      void ia.descargar(n).then(() => {
        const d = ia.descargas[n.toLowerCase()];
        if (d?.estado === 'listo') message.success(tp.listo(d.modelo));
      });
    },
  });
}

function cancelar(d: DescargaIa): void {
  void ejecutar(`cancelar-${d.modelo}`, () => ia.cancelar(d.modelo));
}

function textoProgreso(d: DescargaIa): string {
  const fase = tp.fases[d.fase] ?? '';
  if (d.estado === 'cancelando') return tp.cancelando;
  if (d.total > 0 && d.fase === 'descargando') {
    return `${fase} · ${tp.de(formatearTamano(d.completado), formatearTamano(d.total))}`;
  }
  return fase;
}

// ---- Probar ----
const modeloPrueba = ref<string | null>(null);
const prompt = ref('');
const respuesta = ref<string | null>(null);
const opcionesModelo = computed<SelectOption[]>(() =>
  modelos.value.map((m) => ({ value: m.nombre, label: m.nombre })),
);
watch(modelos, (lista) => {
  if (modeloPrueba.value && !lista.some((m) => m.nombre === modeloPrueba.value)) {
    modeloPrueba.value = null;
  }
  if (!modeloPrueba.value && lista[0]) modeloPrueba.value = lista[0].nombre;
});
const probando = computed(() => ocupado('probar'));
const puedeProbar = computed(
  () => !!modeloPrueba.value && !!prompt.value.trim() && !probando.value,
);

function elegirParaProbar(m: ModeloOllama): void {
  modeloPrueba.value = m.nombre;
  document.getElementById('ia-prompt')?.focus();
}

async function probar(): Promise<void> {
  const modelo = modeloPrueba.value;
  const texto = prompt.value.trim();
  if (!modelo || !texto || probando.value) return;
  respuesta.value = null;
  const r = await ejecutar('probar', () => ia.probar(modelo, texto));
  if (r !== undefined) respuesta.value = r.trim() || t.prueba.vacia;
}

// ---- Conexión ----
const bloque = ref<string | null>(null);
async function cargarBloque(): Promise<void> {
  try {
    bloque.value = await api().ia.bloqueEnv();
  } catch {
    bloque.value = null;
  }
}
/** URL base y endpoint OpenAI, leídos del mismo bloque que da el núcleo (puerto configurado). */
const valorDe = (variable: string): string | null =>
  bloque.value?.match(new RegExp(`^${variable}=(.+)$`, 'm'))?.[1]?.trim() ?? null;
const filasConexion = computed(() => [
  { clave: 'base', etiqueta: t.conexion.base, valor: valorDe('OLLAMA_BASE_URL') },
  { clave: 'openai', etiqueta: t.conexion.openai, valor: valorDe('OPENAI_BASE_URL') },
]);
</script>

<template>
  <div class="ia">
    <p class="descripcion">{{ tn.descripcion }}</p>

    <!-- IA en la nube -->
    <section class="nube" :aria-busy="ia.proveedores === null">
      <header class="cabeza">
        <h2>{{ tn.nube.titulo }}</h2>
        <NButton size="small" type="primary" secondary class="agregar" @click="nuevoProveedor">
          <template #icon
            ><NIcon><Add /></NIcon
          ></template>
          {{ tn.nube.agregar }}
        </NButton>
      </header>
      <NAlert v-if="ia.errorProveedores" type="error" :title="tn.nube.errorLista">
        {{ ia.errorProveedores }}
      </NAlert>
      <NSkeleton v-else-if="ia.proveedores === null" height="120px" class="esqueleto" />
      <p v-else-if="!ia.proveedores.length" class="sin-modelos">{{ tn.nube.vacio }}</p>
      <div v-else class="tarjetas">
        <TarjetaProveedorIa
          v-for="p in ia.proveedores"
          :key="p.id"
          :proveedor="p"
          :prueba="ia.pruebas[p.id]"
          :mensaje="ia.mensajes[p.id]"
          :modelos="ia.modelosDe(p.id)"
          @probar="ia.probarConexion(p.id)"
          @probar-mensaje="(m: string) => pedirMensaje(p, m)"
          @usar="usarEnProyecto(p)"
          @editar="editarProveedor(p)"
          @borrar="pedirBorrado(p, 'proveedor')"
        />
      </div>
    </section>
    <DialogoProveedorIa
      v-model:show="dialogoProveedor"
      :proveedor="enEdicion"
      @borrar-clave="(p: ProveedorIaPublico) => pedirBorrado(p, 'clave')"
    />
    <DialogoEnvIa v-if="paraEnv" v-model:show="dialogoEnv" :proveedor="paraEnv" />

    <h2 class="titulo-local">{{ tn.local.titulo }}</h2>
    <p class="descripcion">{{ t.descripcion }}</p>

    <NSkeleton v-if="!instaladosListos && !servicio" height="120px" class="esqueleto" />

    <!-- Sin instalar -->
    <div v-else-if="sinInstalar" class="vacio">
      <NEmpty size="large">
        <template #icon><IlustracionVacia :icono="Sparkles" /></template>
        <template #default>
          <strong class="vacio-titulo">{{ t.sinInstalarTitulo }}</strong>
          <span class="vacio-texto">{{ t.sinInstalar }}</span>
        </template>
        <template #extra>
          <NButton type="primary" @click="irAServicios">{{ t.irAServicios }}</NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Apagado, encendiéndose o con error -->
    <div v-else-if="!encendido" class="apagado">
      <span class="apagado-icono"
        ><NIcon :size="22"><Power /></NIcon
      ></span>
      <div class="apagado-texto">
        <strong>
          {{
            servicio?.estado === 'iniciando'
              ? t.iniciando
              : servicio?.estado === 'error'
                ? t.errorTitulo
                : t.apagadoTitulo
          }}
        </strong>
        <span v-if="servicio?.estado === 'error' && servicio.mensaje" class="apagado-mensaje">
          {{ servicio.mensaje }}
        </span>
        <span v-else>{{ t.apagado }}</span>
      </div>
      <div class="apagado-botones">
        <NButton
          size="small"
          type="primary"
          :loading="ocupado('encender') || servicio?.estado === 'iniciando'"
          :disabled="servicio?.estado === 'iniciando'"
          @click="encender"
        >
          <template #icon
            ><NIcon><Power /></NIcon
          ></template>
          {{ t.encender }}
        </NButton>
        <NButton size="small" quaternary @click="irAServicios">{{ t.verServicios }}</NButton>
      </div>
    </div>

    <!-- Modelos instalados -->
    <section v-if="encendido" class="bloque-ui" :aria-busy="ia.cargandoModelos">
      <header class="cabeza">
        <h2>{{ t.modelos }}</h2>
        <span class="tenue">{{ ia.modelos ? t.total(ia.modelos.length) : '' }}</span>
        <NTooltip>
          <template #trigger>
            <span class="espacio" tabindex="0">
              {{ t.espacio }}:
              <strong>{{
                ia.espacio === null ? textos.inicioExtra.sinDato : formatearTamano(ia.espacio)
              }}</strong>
            </span>
          </template>
          {{ t.espacioAyuda }}
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <NButton
              quaternary
              circle
              size="small"
              :aria-label="t.recargar"
              :loading="ia.cargandoModelos"
              @click="ia.cargarModelos()"
            >
              <template #icon
                ><NIcon><Refresh /></NIcon
              ></template>
            </NButton>
          </template>
          {{ t.recargar }}
        </NTooltip>
      </header>

      <NAlert v-if="ia.errorModelos" type="error" :title="t.errorModelos">
        {{ ia.errorModelos }}
      </NAlert>
      <NSkeleton v-else-if="!ia.modelos" text :repeat="3" />
      <p v-else-if="!ia.modelos.length" class="sin-modelos">{{ t.sinModelos }}</p>
      <ul v-else class="modelos">
        <li v-for="m in ia.modelos" :key="m.nombre">
          <span class="modelo-nombre">{{ m.nombre }}</span>
          <span class="modelo-tamano">{{ formatearTamano(m.tamanoBytes) }}</span>
          <span class="modelo-fecha tenue">{{ fecha(m.modificado) }}</span>
          <span class="modelo-acciones">
            <NTooltip>
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :aria-label="t.probarDe(m.nombre)"
                  @click="elegirParaProbar(m)"
                >
                  <template #icon
                    ><NIcon><ChatbubbleEllipses /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.probarDe(m.nombre) }}
            </NTooltip>
            <NTooltip>
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :aria-label="t.borrarDe(m.nombre)"
                  :loading="ocupado(`borrar-${m.nombre}`)"
                  @click="confirmarBorrar(m)"
                >
                  <template #icon
                    ><NIcon><TrashOutline /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.borrarDe(m.nombre) }}
            </NTooltip>
          </span>
        </li>
      </ul>
    </section>

    <!-- Descargar -->
    <section v-if="encendido || descargas.length" class="bloque-ui">
      <header class="cabeza">
        <h2>{{ td.titulo }}</h2>
      </header>
      <form v-if="encendido" class="descargar" @submit.prevent="pedirDescarga">
        <label class="campo-etiqueta" for="ia-modelo-nuevo">{{ td.campo }}</label>
        <div class="fila-campo">
          <NInput
            v-model:value="nombreNuevo"
            :input-props="{ id: 'ia-modelo-nuevo', spellcheck: false, autocomplete: 'off' }"
            :placeholder="td.placeholder"
            :status="intentado && errorNombre ? 'error' : undefined"
            class="mono"
            clearable
          />
          <NButton type="primary" attr-type="submit" :disabled="!puedeDescargar">
            <template #icon
              ><NIcon><CloudDownload /></NIcon
            ></template>
            {{ td.boton }}
          </NButton>
        </div>
        <small v-if="errorNombre" class="error-campo">{{ errorNombre }}</small>
        <small v-else class="tenue">{{ td.ayuda }}</small>
        <div v-if="ia.sugeridos.length" class="sugerencias">
          <NTooltip v-for="s in ia.sugeridos" :key="s">
            <template #trigger>
              <NButton
                size="small"
                secondary
                round
                class="mono"
                :disabled="instalado(s) || ia.enCurso(s)"
                @click="elegirSugerencia(s)"
              >
                {{ s }}
              </NButton>
            </template>
            {{ td.sugerenciaAyuda[s] ?? s }}
          </NTooltip>
        </div>
      </form>

      <ul v-if="descargas.length" class="descargas" aria-live="polite">
        <li v-for="d in descargas" :key="d.modelo" :class="`estado-${d.estado}`">
          <div class="descarga-cabeza">
            <strong class="mono">{{ d.modelo }}</strong>
            <span v-if="d.estado === 'descargando' || d.estado === 'cancelando'" class="tenue">
              {{ textoProgreso(d) }}
            </span>
            <span v-else-if="d.estado === 'listo'" class="ok">{{ tp.listo(d.modelo) }}</span>
            <span v-else-if="d.estado === 'cancelado'" class="tenue">{{
              tp.cancelado(d.modelo)
            }}</span>
            <span v-else class="error">{{ tp.error(d.modelo) }}: {{ d.error }}</span>
            <NButton
              v-if="d.estado === 'descargando' || d.estado === 'cancelando'"
              size="tiny"
              secondary
              class="accion-descarga"
              :aria-label="tp.cancelarDe(d.modelo)"
              :loading="d.estado === 'cancelando'"
              :disabled="d.estado === 'cancelando'"
              @click="cancelar(d)"
            >
              {{ textos.acciones.cancelar }}
            </NButton>
            <NTooltip v-else>
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  class="accion-descarga"
                  :aria-label="tp.descartarDe(d.modelo)"
                  @click="ia.descartar(d.modelo)"
                >
                  <template #icon
                    ><NIcon><Close /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ tp.descartar }}
            </NTooltip>
          </div>
          <NProgress
            v-if="d.estado === 'descargando' || d.estado === 'cancelando'"
            type="line"
            :percentage="porcentaje(d) ?? 0"
            :processing="porcentaje(d) === null"
            :show-indicator="porcentaje(d) !== null"
            :height="8"
            :aria-label="textoProgreso(d)"
          />
        </li>
      </ul>
    </section>

    <!-- Probar -->
    <section v-if="encendido" class="bloque-ui">
      <header class="cabeza">
        <h2>{{ t.prueba.titulo }}</h2>
      </header>
      <p v-if="ia.modelos && !ia.modelos.length" class="sin-modelos">{{ t.prueba.sinModelos }}</p>
      <form v-else class="probar" @submit.prevent="probar">
        <Desplegable
          v-model:value="modeloPrueba"
          :options="opcionesModelo"
          :placeholder="t.prueba.elegir"
          :aria-label="t.prueba.modelo"
          class="probar-modelo"
        />
        <NInput
          v-model:value="prompt"
          :input-props="{ id: 'ia-prompt', 'aria-label': t.prueba.prompt }"
          :placeholder="t.prueba.placeholder"
          :disabled="probando"
          :maxlength="4000"
          class="probar-prompt"
        />
        <NButton type="primary" attr-type="submit" :disabled="!puedeProbar" :loading="probando">
          <template #icon
            ><NIcon><Send /></NIcon
          ></template>
          {{ t.prueba.enviar }}
        </NButton>
      </form>
      <div v-if="probando || respuesta !== null" class="respuesta" aria-live="polite">
        <span class="campo-etiqueta">{{ t.prueba.respuesta }}</span>
        <NSpin v-if="probando" :size="14" :description="t.prueba.pensando" class="pensando" />
        <pre v-else class="respuesta-texto">{{ respuesta }}</pre>
      </div>
    </section>

    <!-- Conexión -->
    <section v-if="!sinInstalar" class="bloque-ui">
      <header class="cabeza">
        <h2>{{ t.conexion.titulo }}</h2>
      </header>
      <dl class="datos">
        <div v-for="f in filasConexion" :key="f.clave" class="dato">
          <dt>{{ f.etiqueta }}</dt>
          <dd>
            <code>{{ f.valor ?? textos.inicioExtra.sinDato }}</code>
            <NTooltip v-if="f.valor">
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :aria-label="t.conexion.copiarDato(f.etiqueta.toLowerCase())"
                  @click="copiar(f.valor)"
                >
                  <template #icon
                    ><NIcon><Copy /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.conexion.copiarDato(f.etiqueta.toLowerCase()) }}
            </NTooltip>
          </dd>
        </div>
      </dl>
      <div class="env-cabeza">
        <span>{{ t.conexion.env }}</span>
        <NButton size="tiny" secondary :disabled="!bloque" @click="bloque && copiar(bloque)">
          <template #icon
            ><NIcon><Copy /></NIcon
          ></template>
          {{ t.conexion.copiarEnv }}
        </NButton>
      </div>
      <pre class="bloque">{{ bloque ?? textos.inicioExtra.sinDato }}</pre>
      <small class="tenue">{{ t.conexion.envAyuda }}</small>
      <p class="etapa-b">
        <NIcon aria-hidden="true"><InformationCircle /></NIcon>
        <span>{{ t.etapaB }}</span>
      </p>
    </section>
  </div>
</template>

<style scoped>
.descripcion {
  margin: 0 0 18px;
  opacity: 0.65;
}
.nube {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}
.agregar {
  margin-left: auto;
}
.tarjetas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}
.titulo-local {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
}
:global(.borrar-ia p) {
  margin: 0 0 10px;
}
:global(.borrar-ia-ayuda) {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.65;
}
.esqueleto {
  border-radius: 12px;
}
.vacio {
  padding: 48px 0 40px;
  border: 1px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
  margin-bottom: 16px;
}
.vacio-titulo {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  text-align: center;
}
.vacio-texto {
  display: block;
  max-width: 380px;
  margin: 0 auto;
  text-align: center;
}
.apagado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  border: 1px dashed rgba(128, 128, 128, 0.35);
  margin-bottom: 16px;
}
.apagado-icono {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(128, 128, 128, 0.1);
  flex: none;
}
.apagado-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 220px;
  font-size: 13px;
}
.apagado-texto strong {
  font-size: 14.5px;
}
.apagado-texto span {
  opacity: 0.7;
}
.apagado-mensaje {
  color: var(--texto-error);
  opacity: 1 !important;
  white-space: pre-wrap;
}
.apagado-botones {
  display: flex;
  gap: 6px;
}
.bloque-ui {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px 16px;
  margin-bottom: 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.03);
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 28px;
}
.cabeza h2 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
}
.espacio {
  margin-left: auto;
  font-size: 12.5px;
  opacity: 0.8;
}
.tenue {
  font-size: 12px;
  opacity: 0.6;
}
.mono,
.mono :deep(input) {
  font-family: var(--fuente-mono);
}
.sin-modelos {
  margin: 4px 0;
  opacity: 0.65;
}
.modelos,
.descargas {
  list-style: none;
  margin: 0;
  padding: 0;
}
.modelos li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 90px 100px auto;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid rgba(128, 128, 128, 0.14);
}
.modelos li:first-child {
  border-top: 0;
}
.modelo-nombre {
  font-family: var(--fuente-mono);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.modelo-tamano {
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
  text-align: right;
}
.modelo-acciones {
  display: inline-flex;
  gap: 2px;
}
.descargar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.campo-etiqueta {
  font-size: 12.5px;
  font-weight: 500;
}
.fila-campo {
  display: flex;
  gap: 8px;
}
.fila-campo .n-input {
  max-width: 420px;
}
.error-campo {
  color: var(--texto-error);
  font-size: 12px;
}
.sugerencias {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.descargas li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 0 4px;
  border-top: 1px solid rgba(128, 128, 128, 0.14);
}
.descarga-cabeza {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 12.5px;
}
.accion-descarga {
  margin-left: auto;
}
.ok {
  color: var(--texto-ok);
}
.error {
  color: var(--texto-error);
}
.probar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.probar-modelo {
  width: 220px;
}
.probar-prompt {
  flex: 1;
  min-width: 240px;
}
.respuesta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pensando {
  align-self: flex-start;
}
.respuesta-texto {
  margin: 0;
  max-height: 320px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
}
.datos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 0;
}
.dato dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.dato dd {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 2px 0 0;
  min-width: 0;
}
.dato code {
  font-family: var(--fuente-mono);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 4px;
}
.env-cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
}
.bloque {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
}
.etapa-b {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 12.5px;
  opacity: 0.75;
}
.etapa-b .n-icon {
  margin-top: 2px;
  flex: none;
}
@media (max-width: 900px) {
  .modelos li {
    grid-template-columns: minmax(0, 1fr) 80px auto;
  }
  .modelo-fecha {
    display: none;
  }
  .datos {
    grid-template-columns: 1fr;
  }
}
</style>
