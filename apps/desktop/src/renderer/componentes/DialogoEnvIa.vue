<script setup lang="ts">
import { Copy, WarningOutline } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NFormItem,
  NIcon,
  NModal,
  NSkeleton,
  useDialog,
  useMessage,
  type SelectOption,
} from 'naive-ui';
import Desplegable from './Desplegable.vue';
import { computed, ref, watch } from 'vue';
import type { ProveedorIaPublico, VistaPreviaEnvIa } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useIa } from '../stores/ia';
import { useSitios } from '../stores/sitios';
import { TIPOS_CON_CLAVE } from '../utilidades/ia';

/**
 * "Usar en un proyecto": vista previa enmascarada del bloque .env de IA y escritura con todas
 * sus confirmaciones (texto plano, .gitignore, .env ya versionado o sin comprobar, variables
 * ajenas). Cada confirmación aparte tiene su propio diálogo.
 */
const props = defineProps<{ proveedor: ProveedorIaPublico }>();
const mostrar = defineModel<boolean>('show', { required: true });

const COMANDO_GIT = 'git rm --cached .env\ngit commit -m "Dejar de versionar .env"';
const COMANDO_REVISAR = 'git ls-files -- .env';

const t = textos.ia.env;
const dialog = useDialog();
const message = useMessage();
const ia = useIa();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

const sitioId = ref<string | null>(null);
const modelo = ref<string | null>(null);
const vista = ref<VistaPreviaEnvIa | null>(null);
const agregarGitignore = ref(false);
const aceptarVersionado = ref(false);
const reemplazarAjenas = ref(false);
/** Variables que el .env ya define con otro valor (llegan con `ia.env_conflicto`). */
const conflictos = ref<string | null>(null);
/** El núcleo dijo `ia.env_versionado` aunque la vista previa no lo supiera. */
const versionadoVisto = ref(false);

const opcionesSitio = computed<SelectOption[]>(() =>
  [...sitios.lista]
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((s) => ({ value: s.id, label: `${s.nombre} · ${s.dominio}` })),
);
const sitio = computed(() => sitios.lista.find((s) => s.id === sitioId.value) ?? null);
const opcionesModelo = computed<SelectOption[]>(() => {
  const lista = new Set(ia.modelosDe(props.proveedor.id));
  if (props.proveedor.modelo) lista.add(props.proveedor.modelo);
  return [...lista].sort().map((m) => ({ value: m, label: m }));
});
const sinClave = computed(
  () => TIPOS_CON_CLAVE.has(props.proveedor.tipo) && !props.proveedor.clave.configurada,
);
const versionado = computed<boolean | null>(() =>
  versionadoVisto.value ? true : (vista.value?.gitignore.envVersionado ?? false),
);
/** Con git que ya sigue el .env, o sin poder comprobarlo, hace falta la confirmación aparte. */
const pideAceptar = computed(() => vista.value !== null && versionado.value !== false);
const puedeEscribir = computed(
  () =>
    !!sitio.value &&
    !!vista.value &&
    !sinClave.value &&
    (!pideAceptar.value || aceptarVersionado.value) &&
    (!conflictos.value || reemplazarAjenas.value) &&
    !ocupado('escribir'),
);

function reiniciar(): void {
  vista.value = null;
  agregarGitignore.value = false;
  aceptarVersionado.value = false;
  reemplazarAjenas.value = false;
  conflictos.value = null;
  versionadoVisto.value = false;
}

// Inmediato: la vista lo monta ya abierto la primera vez.
watch(
  mostrar,
  (v) => {
    reiniciar();
    if (!v) return;
    const antes = [sitioId.value, modelo.value];
    modelo.value = props.proveedor.modelo;
    if (!sitios.lista.some((s) => s.id === sitioId.value)) {
      sitioId.value = sitios.lista[0]?.id ?? null;
    }
    // Si cambió el proyecto o el modelo, la carga la hace el otro observador.
    if (antes[0] === sitioId.value && antes[1] === modelo.value) void cargar();
  },
  { immediate: true },
);
watch([sitioId, modelo], () => {
  if (!mostrar.value) return;
  reiniciar();
  void cargar();
});

async function cargar(): Promise<void> {
  const id = sitioId.value;
  const m = modelo.value?.trim() || undefined;
  if (!id) return;
  const v = await ejecutar('vista', () => api().ia.previsualizarEnv(id, props.proveedor.id, m));
  // Si se cambió de proyecto o de modelo mientras tanto, esta vista ya no vale.
  if (!mostrar.value || id !== sitioId.value || m !== (modelo.value?.trim() || undefined)) return;
  vista.value = v ?? null;
  // Modificar el .gitignore se ofrece desmarcado y pide su propia confirmación al marcarlo.
  agregarGitignore.value = false;
}

/** Un diálogo de confirmación que resuelve true solo con el botón positivo. */
function confirmar(o: {
  titulo: string;
  texto: string;
  boton: string;
  tipo?: 'warning' | 'error';
}): Promise<boolean> {
  return new Promise((resolver) => {
    dialog[o.tipo ?? 'warning']({
      title: o.titulo,
      content: o.texto,
      positiveText: o.boton,
      negativeText: textos.acciones.cancelar,
      autoFocus: false,
      onPositiveClick: () => resolver(true),
      onNegativeClick: () => resolver(false),
      onClose: () => resolver(false),
      onMaskClick: () => resolver(false),
    });
  });
}

async function cambiarGitignore(v: boolean): Promise<void> {
  if (!v) {
    agregarGitignore.value = false;
    return;
  }
  agregarGitignore.value = await confirmar({
    titulo: t.gitignoreTitulo,
    texto: t.gitignoreTexto,
    boton: t.gitignoreConfirmar,
  });
}

async function cambiarAceptar(v: boolean): Promise<void> {
  if (!v) {
    aceptarVersionado.value = false;
    return;
  }
  aceptarVersionado.value = await confirmar({
    titulo: t.aceptarTitulo,
    texto: t.aceptarTexto,
    boton: t.aceptarConfirmar,
    tipo: 'error',
  });
}

async function cambiarReemplazo(v: boolean): Promise<void> {
  if (!v || !conflictos.value) {
    reemplazarAjenas.value = false;
    return;
  }
  reemplazarAjenas.value = await confirmar({
    titulo: t.reemplazarTitulo,
    texto: t.reemplazarTexto(conflictos.value),
    boton: t.reemplazarConfirmar,
  });
}

function copiar(texto: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(texto), { exito: textos.acciones.copiado });
}

async function escribir(): Promise<void> {
  const s = sitio.value;
  if (!s || !puedeEscribir.value) return;
  const ok = await confirmar({
    titulo: t.confirmarTitulo,
    texto: t.confirmarTexto(`${s.carpeta}${s.carpeta.includes('/') ? '/' : '\\'}.env`),
    boton: t.confirmar,
  });
  if (!ok) return;
  const m = modelo.value?.trim() || undefined;
  const r = await ejecutar('escribir', async () => {
    try {
      return await api().ia.escribirEnv(s.id, props.proveedor.id, {
        confirmado: true,
        agregarGitignore: agregarGitignore.value,
        ...(m ? { modelo: m } : {}),
        ...(aceptarVersionado.value ? { aceptarVersionado: true } : {}),
        ...(reemplazarAjenas.value ? { reemplazarAjenas: true } : {}),
      });
    } catch (e) {
      const x = e as { codigo?: unknown; datos?: Record<string, unknown> };
      // Estos tres se resuelven en el mismo diálogo, con su confirmación aparte.
      if (x.codigo === 'ia.env_conflicto') {
        conflictos.value = String(x.datos?.['claves'] ?? '');
        reemplazarAjenas.value = false;
        return null;
      }
      if (x.codigo === 'ia.env_versionado') {
        versionadoVisto.value = true;
        aceptarVersionado.value = false;
        return null;
      }
      if (x.codigo === 'ia.env_versionado_desconocido' && vista.value) {
        vista.value = {
          ...vista.value,
          gitignore: { ...vista.value.gitignore, envVersionado: null },
        };
        aceptarVersionado.value = false;
        return null;
      }
      throw e;
    }
  });
  if (r) {
    message.success(t.escrito(s.nombre));
    mostrar.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo(proveedor.nombre)"
    size="small"
    :bordered="false"
    :mask-closable="!ocupado('escribir')"
    :style="{ width: '600px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <p v-if="!sitios.lista.length" class="tenue">{{ t.sinProyectos }}</p>
    <template v-else>
      <NAlert v-if="sinClave" type="warning" class="aviso">{{ t.sinClave }}</NAlert>
      <div class="campos">
        <NFormItem :label="t.proyecto" class="campo">
          <Desplegable v-model:value="sitioId" :options="opcionesSitio" filterable />
        </NFormItem>
        <NFormItem :label="t.modelo" :feedback="t.modeloAyuda" class="campo">
          <Desplegable
            v-model:value="modelo"
            :options="opcionesModelo"
            filterable
            tag
            clearable
            class="mono"
          />
        </NFormItem>
      </div>

      <span class="etiqueta">{{ t.vista }}</span>
      <NSkeleton v-if="ocupado('vista') && !vista" text :repeat="3" />
      <pre v-else class="bloque" :aria-busy="ocupado('vista')">{{ vista?.bloque ?? '' }}</pre>

      <template v-if="vista">
        <NAlert type="warning" class="aviso" :show-icon="true">
          <template #icon
            ><NIcon><WarningOutline /></NIcon
          ></template>
          {{ t.textoPlano }}
          <template v-if="vista.existeEnv"> {{ t.copiaPrevia }}</template>
        </NAlert>

        <!-- .gitignore -->
        <div v-if="!vista.gitignore.ignoraEnv" class="fila">
          <span class="tenue">{{
            vista.gitignore.existe ? t.gitignoreFalta : t.gitignoreNoExiste
          }}</span>
          <NCheckbox :checked="agregarGitignore" @update:checked="cambiarGitignore">
            {{ t.agregarGitignore }}
          </NCheckbox>
        </div>
        <p v-else class="tenue">{{ t.gitignoreOk }}</p>

        <!-- .env ya versionado (o sin poder comprobarlo) -->
        <NAlert
          v-if="versionado !== false"
          :type="versionado ? 'error' : 'warning'"
          :title="versionado ? t.versionadoTitulo : t.desconocidoTitulo"
          class="aviso"
        >
          <p class="alerta-texto">{{ versionado ? t.versionadoTexto : t.desconocidoTexto }}</p>
          <div class="comando">
            <pre class="mono">{{ versionado ? COMANDO_GIT : COMANDO_REVISAR }}</pre>
            <NButton
              size="tiny"
              secondary
              @click="copiar(versionado ? COMANDO_GIT : COMANDO_REVISAR)"
            >
              <template #icon
                ><NIcon><Copy /></NIcon
              ></template>
              {{ t.copiarComando }}
            </NButton>
          </div>
          <NCheckbox :checked="aceptarVersionado" @update:checked="cambiarAceptar">
            {{ t.aceptarVersionado }}
          </NCheckbox>
        </NAlert>

        <!-- Variables que el .env ya tenía con otro valor -->
        <NAlert v-if="conflictos" type="warning" :title="t.conflictoTitulo" class="aviso">
          <code class="mono">{{ conflictos }}</code>
          <NCheckbox
            :checked="reemplazarAjenas"
            class="reemplazar"
            @update:checked="cambiarReemplazo"
          >
            {{ t.reemplazar(conflictos) }}
          </NCheckbox>
        </NAlert>
      </template>
    </template>
    <template #footer>
      <div class="pie">
        <NButton :disabled="ocupado('escribir')" @click="mostrar = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton
          type="primary"
          :disabled="!puedeEscribir"
          :loading="ocupado('escribir')"
          @click="escribir"
        >
          {{ t.escribir }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.campos {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0 12px;
}
.etiqueta {
  display: block;
  font-size: 12.5px;
  font-weight: 500;
  margin-bottom: 6px;
}
.bloque {
  margin: 0 0 12px;
  padding: 10px 12px;
  min-height: 60px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
}
.aviso {
  margin-bottom: 10px;
}
.alerta-texto {
  margin: 0 0 6px;
}
.comando {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.comando pre {
  flex: 1;
  margin: 0;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.12);
  font-size: 12px;
  white-space: pre-wrap;
  user-select: text;
}
.reemplazar {
  display: flex;
  margin-top: 6px;
}
.fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
  margin-bottom: 10px;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.7;
}
.mono,
.mono :deep(input) {
  font-family: var(--fuente-mono);
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@media (max-width: 640px) {
  .campos {
    grid-template-columns: 1fr;
  }
}
</style>
