<script setup lang="ts">
import { Search } from '@vicons/ionicons5';
import { NIcon, NInput, NModal, NTag } from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { useOperacionWorkspace } from '../composables/useOperacionWorkspace';
import { solicitudes } from '../composables/solicitudes';
import { IDIOMAS, textos } from '../i18n';
import { ACCESOS_NAV, SECCIONES_NAV } from '../navegacion';
import { usePreferencias, type TemaUi } from '../stores/preferencias';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import { useWorkspaces } from '../stores/workspaces';
import { accionPrincipal } from '../utilidades/workspaces';
import {
  comandoNuevoProyecto,
  filtrarComandos,
  moverSeleccion,
  type Comando,
} from '../utilidades/paleta';
import { destinoServicio, destinoSitio, destinoVersion } from '../utilidades/foco';
import { ordenarSitios, urlLocal } from '../utilidades/sitios';
import { SERVICIOS_CON_VERSIONES } from '../stores/versiones';

/**
 * Paleta de comandos (Ctrl+K): ir a pantallas, encender o apagar servicios, abrir sitios, traer
 * cambios, abrir herramientas y clonar desde GitHub. Un comando solo corre con Enter o un clic.
 */
const t = textos.paleta;
const router = useRouter();
const servicios = useServicios();
const sitios = useSitios();
const preferencias = usePreferencias();
const { ejecutar } = useAccion();
const workspaces = useWorkspaces();
const { operar: operarWorkspace } = useOperacionWorkspace();

const consulta = ref('');
const seleccion = ref(0);
const lista = ref<HTMLElement | null>(null);

const visible = computed({
  get: () => solicitudes.paleta,
  set: (v: boolean) => {
    solicitudes.paleta = v;
  },
});

function ir(nombre: string): void {
  void router.push({ name: nombre });
}
/** Navega a una tarjeta concreta: la pantalla se desplaza hasta ella y la resalta (D41). */
function irA(destino: RouteLocationRaw): void {
  void router.push(destino);
}

const comandos = computed<Comando[]>(() => {
  const r: Comando[] = [];
  for (const k of SECCIONES_NAV) {
    r.push({
      id: `ir-${k}`,
      grupo: 'navegacion',
      titulo: t.irA(textos.nav[k]),
      claves: k,
      ejecutar: () => ir(k),
    });
  }
  // PHP y Agentes ya no tienen entrada en la barra lateral: la paleta sigue llevando a ellos.
  for (const a of ACCESOS_NAV) {
    r.push({
      id: `ir-${a.id}`,
      grupo: 'navegacion',
      titulo: t.irA(textos.nav[a.id]),
      claves: a.id,
      ejecutar: () => irA(a.destino),
    });
  }
  for (const s of servicios.visibles) {
    if (s.estado === 'externo') continue;
    r.push({
      id: `ir-servicio-${s.id}`,
      grupo: 'servicios',
      titulo: t.irAServicio(s.nombre),
      detalle: s.version ?? undefined,
      claves: 'ir ver go',
      ejecutar: () => irA(destinoServicio(s.id)),
    });
    const vivo = s.estado === 'encendido' || s.estado === 'iniciando';
    r.push({
      id: `servicio-${s.id}`,
      grupo: 'servicios',
      titulo: vivo ? t.apagar(s.nombre) : t.encender(s.nombre),
      detalle: s.version ?? undefined,
      ejecutar: () =>
        void ejecutar(`servicio-${s.id}`, () =>
          vivo ? api().servicios.detener(s.id) : api().servicios.iniciar(s.id),
        ),
    });
  }
  r.push(
    {
      id: 'iniciar-todo',
      grupo: 'servicios',
      titulo: t.iniciarTodo,
      ejecutar: () => void ejecutar('iniciarTodo', () => api().servicios.iniciarTodo()),
    },
    {
      id: 'detener-todo',
      grupo: 'servicios',
      titulo: t.detenerTodo,
      ejecutar: () => void ejecutar('detenerTodo', () => api().servicios.detenerTodo()),
    },
  );
  // Workspaces de arranque: encender o apagar el conjunto (nunca abre túneles ni comparte en la red).
  for (const w of workspaces.lista) {
    const accion = accionPrincipal(workspaces.estadoDe(w.id));
    r.push({
      id: `workspace-${w.id}`,
      grupo: 'servicios',
      titulo: accion === 'iniciar' ? t.iniciarWorkspace(w.nombre) : t.detenerWorkspace(w.nombre),
      claves: 'workspace',
      ejecutar: () => void operarWorkspace(w, accion),
    });
  }
  // Versiones de cada servicio: cae sobre la tarjeta de la versión que usa, si se conoce.
  for (const k of SERVICIOS_CON_VERSIONES) {
    r.push({
      id: `versiones-${k}`,
      grupo: 'servicios',
      titulo: t.versionesDe(textos.versiones.servicios[k]),
      claves: 'versions versoes versions',
      ejecutar: () => irA(destinoVersion(k, servicios.porId[k]?.version ?? null)),
    });
  }
  const puertoNginx = servicios.porId['nginx']?.puertos[0];
  for (const s of ordenarSitios(sitios.lista)) {
    const nombre = s.nombre || s.dominio;
    r.push({
      id: `abrir-${s.id}`,
      grupo: 'proyectos',
      titulo: t.abrirSitio(nombre),
      detalle: s.dominio,
      ejecutar: () =>
        void ejecutar(`abrir-${s.id}`, () =>
          api().sistema.abrirUrl(urlLocal(s.dominio, puertoNginx)),
        ),
    });
    r.push({
      id: `ir-${s.id}`,
      grupo: 'proyectos',
      titulo: t.irAProyecto(nombre),
      detalle: s.dominio,
      claves: 'ir ver go',
      ejecutar: () => irA(destinoSitio(s.id)),
    });
    if (s.git) {
      r.push({
        id: `traer-${s.id}`,
        grupo: 'proyectos',
        titulo: t.traerCambios(nombre),
        detalle: s.dominio,
        claves: 'git pull',
        ejecutar: () => {
          // Lo hace la tarjeta del proyecto: así muestra los pasos sugeridos como siempre.
          solicitudes.traerCambios = s.id;
          irA(destinoSitio(s.id));
        },
      });
    }
  }
  for (const [k, h] of Object.entries(textos.herramientas.lista)) {
    r.push({
      id: `herramienta-${k}`,
      grupo: 'herramientas',
      titulo: t.abrirHerramienta(h.nombre),
      detalle: h.descripcion,
      ejecutar: () => {
        solicitudes.herramienta = k;
        ir('herramientas');
      },
    });
  }
  const agregar = (): void => {
    solicitudes.agregarProyecto = true;
    ir('proyectos');
  };
  r.push(
    { id: 'clonar', grupo: 'github', titulo: t.clonar, claves: 'git clone', ejecutar: agregar },
    { id: 'agregar', grupo: 'proyectos', titulo: t.agregarProyecto, ejecutar: agregar },
    comandoNuevoProyecto(t.nuevoProyecto, () => {
      solicitudes.nuevoProyecto = true;
      ir('proyectos');
    }),
  );
  for (const k of ['sistema', 'claro', 'oscuro'] as TemaUi[]) {
    r.push({
      id: `tema-${k}`,
      grupo: 'general',
      titulo: t.tema(textos.preferencias.temas[k]),
      claves: 'theme tema',
      ejecutar: () => void preferencias.cambiarTema(k).catch(() => undefined),
    });
  }
  for (const { id: k, nombreNativo } of IDIOMAS) {
    r.push({
      id: `idioma-${k}`,
      grupo: 'general',
      titulo: t.idioma(nombreNativo),
      claves: 'language idioma langue português français',
      ejecutar: () => void preferencias.cambiarIdioma(k).catch(() => undefined),
    });
  }
  r.push({
    id: 'asistente',
    grupo: 'general',
    titulo: t.asistente,
    ejecutar: () => {
      solicitudes.asistente = true;
    },
  });
  return r;
});

const resultados = computed(() => filtrarComandos(comandos.value, consulta.value));

watch(consulta, () => {
  seleccion.value = 0;
});
watch(visible, (v) => {
  if (v) {
    consulta.value = '';
    seleccion.value = 0;
    // Los workspaces y su estado al abrir la paleta (sin esperar a visitar Inicio).
    void workspaces.cargar().catch(() => undefined);
  }
});

function mover(paso: 1 | -1): void {
  seleccion.value = moverSeleccion(seleccion.value, resultados.value.length, paso);
  void nextTick(() => {
    lista.value
      ?.querySelector<HTMLElement>(`[data-indice="${seleccion.value}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  });
}

function correr(c: Comando | undefined): void {
  if (!c) return;
  visible.value = false;
  void c.ejecutar();
}

function teclaEnBuscador(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    mover(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    mover(-1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    correr(resultados.value[seleccion.value]);
  }
}

/** Ctrl+K (o Cmd+K) en cualquier parte de la ventana abre o cierra la paleta. */
function atajo(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    visible.value = !visible.value;
  }
}
onMounted(() => window.addEventListener('keydown', atajo));
onBeforeUnmount(() => window.removeEventListener('keydown', atajo));
</script>

<template>
  <NModal
    v-model:show="visible"
    :auto-focus="true"
    transform-origin="center"
    :aria-label="t.titulo"
    class="paleta-modal"
  >
    <div class="paleta" role="dialog" :aria-label="t.titulo">
      <NInput
        v-model:value="consulta"
        size="large"
        :placeholder="t.placeholder"
        :input-props="{
          'aria-label': t.titulo,
          'aria-controls': 'paleta-lista',
          'aria-autocomplete': 'list',
          spellcheck: false,
          autocomplete: 'off',
        }"
        class="buscador"
        @keydown="teclaEnBuscador"
      >
        <template #prefix
          ><NIcon><Search /></NIcon
        ></template>
      </NInput>
      <ul v-if="resultados.length" id="paleta-lista" ref="lista" class="lista" role="listbox">
        <li
          v-for="(c, i) in resultados"
          :key="c.id"
          role="option"
          class="item"
          :class="{ activo: i === seleccion }"
          :aria-selected="i === seleccion"
          :data-indice="i"
          @mousemove="seleccion = i"
          @click="correr(c)"
        >
          <span class="texto">
            <span class="titulo" :title="c.titulo">{{ c.titulo }}</span>
            <span v-if="c.detalle" class="detalle">{{ c.detalle }}</span>
          </span>
          <NTag size="small" :bordered="false" class="grupo">{{ t.grupos[c.grupo] }}</NTag>
        </li>
      </ul>
      <p v-else class="vacio">{{ t.sinResultados }}</p>
      <p class="ayuda">{{ t.ayuda }}</p>
    </div>
  </NModal>
</template>

<style scoped>
.paleta {
  width: min(640px, 92vw);
  /* Arriba, como en los editores: no salta al cambiar la cantidad de resultados. */
  align-self: flex-start;
  margin: 12vh auto 0;
  padding: 10px;
  border-radius: 14px;
  background: var(--paleta-fondo, #fff);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.28),
    0 0 0 1px rgba(128, 128, 128, 0.18);
}
:global([data-tema='oscuro']) .paleta {
  --paleta-fondo: #1c1d24;
}
.lista {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: min(400px, 52vh);
  overflow-y: auto;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background var(--transicion) ease;
}
.item.activo {
  background: rgba(var(--acento-rgb), 0.12);
}
.texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.titulo {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detalle {
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.grupo {
  flex: none;
  opacity: 0.8;
}
.vacio {
  margin: 18px 0 12px;
  text-align: center;
  opacity: 0.72;
}
.ayuda {
  margin: 8px 4px 0;
  font-size: 11.5px;
  opacity: 0.72;
}
@media (prefers-reduced-motion: reduce) {
  .item {
    transition: none;
  }
}
</style>
