<script setup lang="ts">
import { NButton, NTag, useDialog, useMessage } from 'naive-ui';
import { computed } from 'vue';
import type { Workspace } from '../../shared/api';
import { useAccion } from '../composables/useAccion';
import { useOperacionWorkspace } from '../composables/useOperacionWorkspace';
import { textos } from '../i18n';
import { useWorkspaces } from '../stores/workspaces';
import { traducirError } from '../utilidades/errores';
import {
  accionPrincipal,
  claveElemento,
  nombreElemento,
  partesClave,
  textoItem,
} from '../utilidades/workspaces';
import EstadoPunto from './EstadoPunto.vue';

/**
 * Un workspace de arranque: su estado, los elementos que lleva y, tras encender o apagar, lo que
 * quedó encendido y lo que no (con el motivo de cada fallo). Nada queda a medias sin decirlo.
 */
const props = defineProps<{ workspace: Workspace }>();
const emit = defineEmits<{ editar: [w: Workspace] }>();

const t = textos.workspaces;
const ws = useWorkspaces();
const dialog = useDialog();
const message = useMessage();
const { ejecutar } = useAccion();
const { operar, ocupado } = useOperacionWorkspace();

const estado = computed(() => ws.estadoDe(props.workspace.id));
const ultima = computed(() => ws.ultimas[props.workspace.id]);
const accion = computed(() => accionPrincipal(estado.value));

/** Punto de estado: apagado, encendido o, en parte, el ámbar de "aviso". */
const puntoEstado = computed(() =>
  estado.value === 'encendido' ? 'encendido' : estado.value === 'parcial' ? 'aviso' : 'apagado',
);

const elementos = computed(() =>
  props.workspace.elementos.map((e) => ({
    clave: claveElemento(e),
    nombre: nombreElemento(claveElemento(e)),
  })),
);

const filas = computed(() => {
  const u = ultima.value;
  if (!u) return [];
  return u.items.map((r) => {
    const nombre = nombreElemento(r.elemento);
    const motivo = r.ok
      ? ''
      : traducirError({ codigo: r.codigo, message: r.detalle, datos: { elemento: nombre } });
    return {
      clave: r.elemento,
      nombre,
      tipo: partesClave(r.elemento).tipo,
      ok: r.ok,
      texto: textoItem(r, u.accion, t.resultado),
      motivo,
    };
  });
});

function confirmarBorrar(): void {
  dialog.warning({
    title: t.borrar.titulo(props.workspace.nombre),
    content: t.borrar.texto,
    positiveText: t.borrar.confirmar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: async () => {
      let borrado = false;
      await ejecutar(`borrar-${props.workspace.id}`, async () => {
        await ws.borrar(props.workspace.id);
        borrado = true;
      });
      if (borrado) message.success(t.borrar.hecho(props.workspace.nombre));
    },
  });
}
</script>

<template>
  <article class="workspace" :data-foco="`workspace:${workspace.id}`">
    <header class="cabecera">
      <div class="titulo">
        <strong class="nombre">{{ workspace.nombre }}</strong>
        <small class="cuenta">{{
          workspace.elementos.length ? t.elementos(workspace.elementos.length) : t.sinElementos
        }}</small>
      </div>
      <EstadoPunto :estado="puntoEstado" :etiqueta="t.estado[estado]" />
    </header>

    <ul v-if="elementos.length" class="chips">
      <li v-for="e in elementos" :key="e.clave">
        <NTag size="small" :bordered="false">{{ e.nombre }}</NTag>
      </li>
    </ul>

    <section
      v-if="ultima"
      class="resultado"
      :aria-label="t.resultado.tituloIniciar(workspace.nombre)"
    >
      <p class="resultado-titulo">
        {{
          ultima.accion === 'iniciar'
            ? t.resultado.tituloIniciar(workspace.nombre)
            : t.resultado.tituloDetener(workspace.nombre)
        }}
      </p>
      <ul class="filas">
        <li v-for="f in filas" :key="f.clave" :class="{ mal: !f.ok }">
          <span class="fila-nombre">{{ f.nombre }}</span>
          <span class="fila-texto">{{ f.texto }}</span>
          <small v-if="f.motivo" class="fila-motivo">{{ f.motivo }}</small>
        </li>
      </ul>
      <NButton text size="tiny" @click="ws.olvidarUltima(workspace.id)">
        {{ t.acciones.cerrar }}
      </NButton>
    </section>

    <footer class="acciones">
      <NButton
        size="small"
        :type="accion === 'iniciar' ? 'primary' : 'default'"
        :secondary="accion === 'detener'"
        :loading="ocupado(workspace.id)"
        :disabled="ocupado(workspace.id) || (accion === 'iniciar' && !workspace.elementos.length)"
        @click="operar(workspace, accion)"
      >
        {{ t.acciones[accion] }}
      </NButton>
      <NButton
        size="small"
        quaternary
        :disabled="ocupado(workspace.id)"
        @click="emit('editar', workspace)"
      >
        {{ t.acciones.editar }}
      </NButton>
      <NButton size="small" quaternary :disabled="ocupado(workspace.id)" @click="confirmarBorrar">
        {{ t.acciones.borrar }}
      </NButton>
    </footer>
  </article>
</template>

<style scoped>
.workspace {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px;
  background: rgba(128, 128, 128, 0.04);
}
.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.titulo {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.nombre {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cuenta {
  opacity: 0.72;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.resultado {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
}
.resultado-titulo {
  margin: 0 0 6px;
  font-size: 12.5px;
  font-weight: 600;
}
.filas {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 0 6px;
  padding: 0;
  list-style: none;
  font-size: 12.5px;
}
.filas li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 10px;
}
.filas li.mal .fila-texto {
  color: var(--texto-error, #dc2626);
  font-weight: 600;
}
.fila-nombre {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fila-motivo {
  grid-column: 1 / -1;
  opacity: 0.75;
}
.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
