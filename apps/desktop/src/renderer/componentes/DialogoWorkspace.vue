<script setup lang="ts">
import { NAlert, NButton, NCheckbox, NForm, NFormItem, NInput, NModal } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { ElementoWorkspace, Workspace } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import { useWorkspaces } from '../stores/workspaces';
import {
  alternarElemento,
  claveElemento,
  idDesdeNombre,
  nombreElemento,
  opcionesElementos,
  type OpcionesElementos,
} from '../utilidades/workspaces';

/**
 * Crear o editar un workspace: un nombre y qué encender (bases de datos, servicios y procesos de
 * los proyectos). Solo se guardan referencias. Un elemento que ya no existe se avisa y se quita al
 * guardar; dos captadores de correo no caben a la vez (elegir uno reemplaza al otro).
 */
const props = defineProps<{ workspace: Workspace | null }>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.workspaces.dialogo;
const ws = useWorkspaces();
const servicios = useServicios();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

const nombre = ref('');
const seleccion = ref<ElementoWorkspace[]>([]);
const opciones = ref<OpcionesElementos>({ instancias: [], servicios: [], procesos: [] });
const cargando = ref(false);

const nombreValido = computed(() => nombre.value.trim().length > 0);

const claves = computed(() => new Set(seleccion.value.map(claveElemento)));
const marcado = (e: ElementoWorkspace): boolean => claves.value.has(claveElemento(e));

/** Lo que el workspace lleva y ya no existe aquí (se quita al guardar). */
const faltantes = computed(() => {
  // Mientras se leen las opciones no se puede saber qué falta.
  if (cargando.value) return [];
  const hay = new Set<string>([
    ...opciones.value.instancias.map((o) => claveElemento(o.elemento)),
    ...opciones.value.servicios.map((o) => claveElemento(o.elemento)),
    ...opciones.value.procesos.map((o) => claveElemento(o.elemento)),
  ]);
  return seleccion.value.map(claveElemento).filter((k) => !hay.has(k));
});
const hayCaptador = computed(() =>
  opciones.value.servicios.some(
    (o) =>
      o.elemento.tipo === 'servicio' &&
      ['mailpit', 'smtp4dev', 'inbucket', 'papercut'].includes(o.elemento.id),
  ),
);

async function cargarOpciones(): Promise<void> {
  cargando.value = true;
  try {
    const instancias = await api().instancias.lista();
    opciones.value = opcionesElementos(
      instancias,
      servicios.lista.map((s) => s.id),
      sitios.lista,
    );
  } catch {
    opciones.value = opcionesElementos(
      [],
      servicios.lista.map((s) => s.id),
      sitios.lista,
    );
  } finally {
    cargando.value = false;
  }
}

watch(mostrar, (v) => {
  if (!v) return;
  nombre.value = props.workspace?.nombre ?? '';
  seleccion.value = props.workspace ? props.workspace.elementos.map((e) => ({ ...e })) : [];
  void cargarOpciones();
});

function alternar(e: ElementoWorkspace): void {
  seleccion.value = alternarElemento(seleccion.value, e);
}

async function guardar(): Promise<void> {
  if (!nombreValido.value || ocupado('guardar')) return;
  const quitar = new Set(faltantes.value);
  const w: Workspace = {
    id:
      props.workspace?.id ??
      idDesdeNombre(
        nombre.value,
        ws.lista.map((x) => x.id),
      ),
    nombre: nombre.value.trim(),
    elementos: seleccion.value.filter((e) => !quitar.has(claveElemento(e))),
  };
  let guardado = false;
  await ejecutar(
    'guardar',
    async () => {
      await ws.guardar(w);
      guardado = true;
    },
    { exito: t.guardado(w.nombre) },
  );
  if (guardado) mostrar.value = false;
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="workspace ? t.tituloEditar : t.tituloNuevo"
    size="small"
    :bordered="false"
    :style="{ width: '520px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="!ocupado('guardar')"
    :closable="!ocupado('guardar')"
  >
    <NForm autocomplete="off" @submit.prevent="guardar">
      <NFormItem
        :label="t.nombre"
        :validation-status="nombre && !nombreValido ? 'error' : undefined"
        :feedback="nombre && !nombreValido ? t.nombreVacio : ''"
      >
        <NInput
          v-model:value="nombre"
          :placeholder="t.nombrePlaceholder"
          maxlength="60"
          :disabled="ocupado('guardar')"
        />
      </NFormItem>

      <NAlert type="info" :show-icon="false" class="aviso">{{ t.aviso }}</NAlert>

      <section class="grupo">
        <h4 class="subtitulo">{{ t.secciones.instancias }}</h4>
        <ul v-if="opciones.instancias.length" class="opciones">
          <li v-for="o in opciones.instancias" :key="claveElemento(o.elemento)">
            <NCheckbox :checked="marcado(o.elemento)" @update:checked="alternar(o.elemento)">
              {{ o.etiqueta }}
            </NCheckbox>
          </li>
        </ul>
        <p v-else class="vacio">{{ cargando ? '…' : t.sinOpciones }}</p>
      </section>

      <section class="grupo">
        <h4 class="subtitulo">{{ t.secciones.servicios }}</h4>
        <ul v-if="opciones.servicios.length" class="opciones">
          <li v-for="o in opciones.servicios" :key="claveElemento(o.elemento)">
            <NCheckbox :checked="marcado(o.elemento)" @update:checked="alternar(o.elemento)">
              {{ nombreElemento(claveElemento(o.elemento)) }}
            </NCheckbox>
          </li>
        </ul>
        <p v-else class="vacio">{{ cargando ? '…' : t.sinOpciones }}</p>
        <p v-if="hayCaptador" class="ayuda">{{ t.captadorUnico }}</p>
      </section>

      <section class="grupo">
        <h4 class="subtitulo">{{ t.secciones.procesos }}</h4>
        <ul v-if="opciones.procesos.length" class="opciones">
          <li v-for="o in opciones.procesos" :key="claveElemento(o.elemento)">
            <NCheckbox :checked="marcado(o.elemento)" @update:checked="alternar(o.elemento)">
              {{ o.etiqueta }} <small class="sitio">({{ o.sitio }})</small>
            </NCheckbox>
          </li>
        </ul>
        <p v-else class="vacio">{{ cargando ? '…' : t.sinOpciones }}</p>
      </section>

      <p v-if="faltantes.length" class="ayuda faltan">
        {{ t.yaNoExisten(faltantes.map(nombreElemento).join(', ')) }}
      </p>

      <div class="botones">
        <NButton quaternary :disabled="ocupado('guardar')" @click="mostrar = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton
          type="primary"
          attr-type="submit"
          :disabled="!nombreValido || cargando"
          :loading="ocupado('guardar')"
        >
          {{ t.guardar }}
        </NButton>
      </div>
    </NForm>
  </NModal>
</template>

<style scoped>
.aviso {
  margin-bottom: 12px;
}
.grupo {
  margin-bottom: 10px;
}
.subtitulo {
  margin: 0 0 6px;
  font-size: 13px;
}
.opciones {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sitio {
  opacity: 0.72;
}
.vacio,
.ayuda {
  margin: 4px 0 0;
  font-size: 12.5px;
  opacity: 0.76;
}
.faltan {
  color: var(--texto-aviso, #d97706);
  opacity: 1;
}
.botones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
