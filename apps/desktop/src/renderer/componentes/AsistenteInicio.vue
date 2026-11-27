<script setup lang="ts">
import { NButton } from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';
import { usePreferencias } from '../stores/preferencias';
import { PASOS_RECORRIDO, rectaDeZona, type RectaZona } from '../utilidades/recorrido';

/**
 * Recorrido de bienvenida (la primera vez y desde Ajustes › Apariencia): 7 pasos cortos que
 * resaltan una zona de la barra lateral. No instala ni cambia nada. Es un diálogo accesible:
 * foco atrapado, Esc cierra, el texto del paso se anuncia con `aria-live` y el foco vuelve a
 * donde estaba al cerrar. Sin librerías: el resalte es un recuadro con sombra sobre la zona.
 */
const t = textos.asistenteInicio;
const router = useRouter();
const preferencias = usePreferencias();

const actual = ref(0);
const zona = ref<RectaZona | null>(null);
const tarjeta = ref<HTMLElement | null>(null);
const visible = computed(() => solicitudes.asistente);
const paso = computed(() => PASOS_RECORRIDO[actual.value]!);
const texto = computed(() => t.pasos[paso.value.id]);
const esUltimo = computed(() => actual.value === PASOS_RECORRIDO.length - 1);
const destino = computed(() => {
  const d = paso.value.irA;
  return d ? { ruta: d, nombre: textos.nav[d] } : null;
});

let foco: HTMLElement | null = null;

/** Cerrar (saltar o terminar) cuenta como visto: no vuelve a abrirse solo. */
function cerrar(): void {
  solicitudes.asistente = false;
  if (!preferencias.asistenteVisto) void preferencias.marcarAsistenteVisto().catch(() => undefined);
}

function ir(): void {
  const d = destino.value;
  cerrar();
  if (d) void router.push({ name: d.ruta });
}

function medir(): void {
  zona.value = rectaDeZona(paso.value.zona);
}

async function enfocar(): Promise<void> {
  await nextTick();
  medir();
  // El botón principal recibe el foco en cada paso: Enter avanza.
  tarjeta.value?.querySelector<HTMLElement>('[data-principal]')?.focus();
}

watch(
  visible,
  (v) => {
    if (v) {
      actual.value = 0;
      foco = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      window.addEventListener('keydown', teclado, true);
      window.addEventListener('resize', medir);
      void enfocar();
    } else {
      window.removeEventListener('keydown', teclado, true);
      window.removeEventListener('resize', medir);
      foco?.focus?.();
      foco = null;
    }
  },
  { immediate: true },
);
watch(actual, () => void enfocar());
onBeforeUnmount(() => {
  window.removeEventListener('keydown', teclado, true);
  window.removeEventListener('resize', medir);
});

/** Esc cierra y Tab no sale del diálogo. */
function teclado(e: KeyboardEvent): void {
  if (!visible.value) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cerrar();
    return;
  }
  if (e.key !== 'Tab' || !tarjeta.value) return;
  const items = [
    ...tarjeta.value.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]'),
  ].filter((el) => el.tabIndex >= 0);
  if (items.length === 0) return;
  const primero = items[0]!;
  const ultimo = items[items.length - 1]!;
  const dentro = tarjeta.value.contains(document.activeElement);
  if (!dentro || (e.shiftKey && document.activeElement === primero)) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  }
}

/** Resalte: recuadro con sombra enorme que oscurece todo menos la zona. */
const estiloZona = computed(() => {
  const z = zona.value;
  if (!z) return null;
  return {
    left: `${z.x - 6}px`,
    top: `${z.y - 6}px`,
    width: `${z.ancho + 12}px`,
    height: `${z.alto + 12}px`,
  };
});

/** La tarjeta va al lado de la zona (a su derecha si es de la barra lateral, debajo si no). */
const estiloTarjeta = computed(() => {
  const z = zona.value;
  if (!z) return null;
  const ancho = Math.min(480, window.innerWidth - 32);
  if (z.x < 320) {
    const alto = 300;
    const top = Math.max(16, Math.min(z.y - 8, window.innerHeight - alto - 16));
    return { left: `${z.x + z.ancho + 20}px`, top: `${top}px`, width: `${ancho}px` };
  }
  const left = Math.max(16, Math.min(z.x, window.innerWidth - ancho - 16));
  return { left: `${left}px`, top: `${z.y + z.alto + 20}px`, width: `${ancho}px` };
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="recorrido" data-recorrido>
      <!-- El fondo cierra con un clic; el recuadro (si hay zona) oscurece lo demás. -->
      <div class="velo" :class="{ sinZona: !estiloZona }" aria-hidden="true" @click="cerrar" />
      <div v-if="estiloZona" class="zona" :style="estiloZona" aria-hidden="true" />
      <div
        ref="tarjeta"
        class="tarjeta"
        :class="{ centrada: !estiloTarjeta }"
        :style="estiloTarjeta ?? undefined"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recorrido-titulo"
        aria-describedby="recorrido-texto"
        :aria-label="undefined"
      >
        <div class="cabecera">
          <span class="numero">{{ t.paso(actual + 1, PASOS_RECORRIDO.length) }}</span>
          <button
            type="button"
            class="cerrar"
            :aria-label="t.cerrar"
            :title="t.cerrar"
            @click="cerrar"
          >
            ×
          </button>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <h2 id="recorrido-titulo">{{ texto.titulo }}</h2>
          <p id="recorrido-texto" class="texto">{{ texto.texto }}</p>
        </div>
        <ol class="puntos" aria-hidden="true">
          <li v-for="(p, i) in PASOS_RECORRIDO" :key="p.id" :class="{ activo: i === actual }" />
        </ol>
        <div class="botones">
          <NButton quaternary size="small" @click="cerrar">{{ t.saltar }}</NButton>
          <span class="espacio" />
          <NButton v-if="destino && !esUltimo" size="small" secondary @click="ir">
            {{ t.ir(destino.nombre) }}
          </NButton>
          <NButton v-if="actual > 0" size="small" @click="actual--">{{ t.anterior }}</NButton>
          <NButton v-if="!esUltimo" type="primary" size="small" data-principal @click="actual++">
            {{ t.siguiente }}
          </NButton>
          <NButton v-else type="primary" size="small" data-principal @click="cerrar">
            {{ t.terminar }}
          </NButton>
        </div>
        <p class="pista">{{ t.reabrir }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.recorrido {
  --rec-fondo: #ffffff;
  --rec-texto: #1b1e2b;
  --rec-suave: #4a5063;
  --rec-borde: rgba(128, 128, 128, 0.3);
  position: fixed;
  inset: 0;
  z-index: 4000;
}
.velo {
  position: absolute;
  inset: 0;
}
.velo.sinZona {
  background: rgba(8, 10, 20, 0.6);
}
.zona {
  position: absolute;
  border-radius: 12px;
  box-shadow:
    0 0 0 3px var(--acento),
    0 0 0 9999px rgba(8, 10, 20, 0.6);
  pointer-events: none;
  transition:
    left var(--transicion) ease,
    top var(--transicion) ease,
    width var(--transicion) ease,
    height var(--transicion) ease;
}
.tarjeta {
  position: absolute;
  box-sizing: border-box;
  padding: 16px 18px 12px;
  border-radius: 14px;
  background: var(--rec-fondo);
  color: var(--rec-texto);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.35),
    0 0 0 1px var(--rec-borde);
}
.tarjeta.centrada {
  left: 50%;
  top: 50%;
  width: min(480px, calc(100vw - 32px));
  transform: translate(-50%, -50%);
}
.cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.numero {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--rec-suave);
}
.cerrar {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--rec-suave);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.cerrar:hover {
  background: rgba(128, 128, 128, 0.16);
}
.cerrar:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 1px;
}
h2 {
  margin: 4px 0 6px;
  font-size: 17px;
  font-weight: 650;
}
.texto {
  margin: 0 0 14px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--rec-suave);
}
.puntos {
  display: flex;
  gap: 6px;
  margin: 0 0 14px;
  padding: 0;
  list-style: none;
}
.puntos li {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(128, 128, 128, 0.4);
}
.puntos li.activo {
  width: 20px;
  border-radius: 4px;
  background: var(--acento);
}
.botones {
  display: flex;
  align-items: center;
  /* Siempre en una sola fila: «Saltar» a la izquierda y el resto agrupado a la derecha. */
  flex-wrap: nowrap;
  gap: 8px;
}
.botones :deep(.n-button) {
  flex-shrink: 0;
  white-space: nowrap;
}
.espacio {
  flex: 1;
}
.pista {
  margin: 10px 0 0;
  font-size: 11.5px;
  color: var(--rec-suave);
}
@media (prefers-reduced-motion: reduce) {
  .zona {
    transition: none;
  }
}
</style>

<!-- Sin ámbito: el recorrido va en el body (Teleport) y el tema vive en <html data-tema>. -->
<style>
:root[data-tema='oscuro'] .recorrido {
  --rec-fondo: #1c1d24;
  --rec-texto: #eceef6;
  --rec-suave: #b6bbcd;
}
</style>
