<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { FormatoCaptura } from '@pel/core';
import type { DatosCaptura, VentanaCapturable } from '../../shared/captura';
import { cambiarIdioma, textos } from '../i18n';
import EditorCaptura from './EditorCaptura.vue';
import {
  COLORES_DIBUJO,
  GROSORES_DIBUJO,
  PilaDeshacer,
  flecha,
  linea,
  ocultar,
  pixelado,
  recuadro,
  renderizar,
  resaltar,
  texto,
  type Anotacion,
  type HerramientaCaptura,
  type Punto,
  type Rect,
} from './herramientasDibujo';

const t = textos.captura;

type Fase = 'cargando' | 'ventanas' | 'seleccion' | 'edicion' | 'error';

const fase = ref<Fase>('cargando');
const datos = ref<DatosCaptura | null>(null);
const aviso = ref<string | null>(null);
const ocupado = ref(false);
const lienzo = ref<HTMLCanvasElement | null>(null);
/** Imagen en edición (la pantalla entera o la ventana elegida), a tamaño real. */
const base = shallowRef<ImageBitmap | null>(null);
/** Zona que se queda (en píxeles de la imagen); en `pantalla` y `ventana` es toda. */
const seleccion = ref<Rect | null>(null);
const pila = new PilaDeshacer<readonly Anotacion[]>([]);
const puedeDeshacer = ref(false);
const puedeRehacer = ref(false);
const anotaciones = ref<readonly Anotacion[]>([]);
const trazo = ref<Anotacion | null>(null);
const herramienta = ref<HerramientaCaptura>('flecha');
const color = ref<string>(COLORES_DIBUJO[0]);
const grosor = ref<number>(GROSORES_DIBUJO[1]);
const formato = ref<FormatoCaptura>('png');
const vistas = ref<{ ventana: VentanaCapturable; bitmap: ImageBitmap }[]>([]);
const miniaturas = ref<HTMLCanvasElement[]>([]);
/** Campo de texto flotante: posición en la pantalla (px CSS) y en la imagen. */
const entrada = ref<{ css: Punto; imagen: Punto; valor: string } | null>(null);
const campo = ref<HTMLInputElement | null>(null);
const tam = ref({ ancho: 0, alto: 0 });
const tickResize = ref(0);

let inicio: Punto | null = null;
let temporizadorCierre: ReturnType<typeof setTimeout> | null = null;

const aBitmap = (png: Uint8Array): Promise<ImageBitmap> =>
  createImageBitmap(new Blob([png as BlobPart], { type: 'image/png' }));

const esRegion = computed(() => datos.value?.modo === 'region');
const hayImagen = computed(() => base.value !== null);

/** Escala de la vista: región = toda la pantalla; ventana y pantalla = ajustada con margen. */
const vista = computed(() => {
  void tickResize.value;
  const b = tam.value;
  if (b.ancho === 0) return { ancho: 0, alto: 0, escala: 1 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const natural = 1 / (window.devicePixelRatio || 1);
  const escala = esRegion.value
    ? Math.min(vw / b.ancho, vh / b.alto)
    : Math.min((vw * 0.94) / b.ancho, (vh * 0.78) / b.alto, natural);
  return { ancho: b.ancho * escala, alto: b.alto * escala, escala };
});

/** Esquina superior izquierda del lienzo en la pantalla (centrado). */
const origenCss = computed<Punto>(() => ({
  x: (window.innerWidth - vista.value.ancho) / 2,
  y: (window.innerHeight - vista.value.alto) / 2,
}));

/** Posición de la barra de herramientas: junto a la selección, sin salirse de la pantalla. */
const estiloBarra = computed(() => {
  const s = seleccion.value;
  if (!s) return {};
  const e = vista.value.escala;
  const o = origenCss.value;
  const derecha = o.x + (s.x + s.ancho) * e;
  const abajo = o.y + (s.y + s.alto) * e;
  const arriba = o.y + s.y * e;
  const ancho = Math.min(640, window.innerWidth - 16);
  const left = Math.max(8, Math.min(derecha - ancho, window.innerWidth - ancho - 8));
  let top = abajo + 8;
  if (top + 96 > window.innerHeight) top = arriba - 8 - 96;
  if (top < 8) top = Math.max(8, abajo - 104);
  return { left: `${left}px`, top: `${top}px` };
});

const estiloCampo = computed(() => {
  const c = entrada.value?.css;
  return c ? { left: `${c.x}px`, top: `${c.y}px` } : {};
});

/** Del puntero a píxeles de la imagen. */
function puntoDe(e: PointerEvent): Punto {
  const c = lienzo.value!;
  const r = c.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) * c.width) / r.width,
    y: ((e.clientY - r.top) * c.height) / r.height,
  };
}

const acotar = (p: Punto, r: Rect): Punto => ({
  x: Math.max(r.x, Math.min(r.x + r.ancho, p.x)),
  y: Math.max(r.y, Math.min(r.y + r.alto, p.y)),
});

/** Píxeles de la imagen por píxel CSS: grosores y texto se ven igual en cualquier pantalla. */
const factor = computed(() => 1 / (vista.value.escala || 1));

function pintar(): void {
  const c = lienzo.value;
  const b = base.value;
  if (!c || !b) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(b, 0, 0);
  renderizar(ctx, c.width, c.height, anotaciones.value);
  if (trazo.value) renderizar(ctx, c.width, c.height, [trazo.value]);
  const s = seleccion.value;
  // Lo que queda fuera de la selección se oscurece; en `pantalla` y `ventana` no hay nada fuera.
  const oscuro = fase.value === 'seleccion' || (esRegion.value && s !== null);
  if (oscuro) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    if (!s) {
      ctx.fillRect(0, 0, c.width, c.height);
    } else {
      ctx.fillRect(0, 0, c.width, s.y);
      ctx.fillRect(0, s.y + s.alto, c.width, c.height - s.y - s.alto);
      ctx.fillRect(0, s.y, s.x, s.alto);
      ctx.fillRect(s.x + s.ancho, s.y, c.width - s.x - s.ancho, s.alto);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, factor.value);
      ctx.setLineDash([6 * factor.value, 4 * factor.value]);
      ctx.strokeRect(s.x, s.y, s.ancho, s.alto);
    }
    ctx.restore();
  }
}

async function usarImagen(bitmap: ImageBitmap, region: boolean): Promise<void> {
  base.value?.close();
  base.value = bitmap;
  tam.value = { ancho: bitmap.width, alto: bitmap.height };
  trazo.value = null;
  anotaciones.value = pila.reiniciar([]);
  sincronizarPila();
  seleccion.value = region ? null : { x: 0, y: 0, ancho: bitmap.width, alto: bitmap.height };
  fase.value = region ? 'seleccion' : 'edicion';
  await nextTick();
  const c = lienzo.value;
  if (c) {
    c.width = bitmap.width;
    c.height = bitmap.height;
  }
  pintar();
}

async function cargar(): Promise<void> {
  try {
    const d = await window.captura.datos();
    if (!d) {
      fase.value = 'error';
      aviso.value = t.errorCargar;
      return;
    }
    datos.value = d;
    formato.value = d.formato;
    cambiarIdioma(d.idioma);
    if (d.modo === 'ventana') {
      const lista: { ventana: VentanaCapturable; bitmap: ImageBitmap }[] = [];
      for (const v of d.ventanas) lista.push({ ventana: v, bitmap: await aBitmap(v.png) });
      vistas.value = lista;
      fase.value = 'ventanas';
      await nextTick();
      lista.forEach((x, i) => dibujarMiniatura(x.bitmap, miniaturas.value[i]));
      return;
    }
    if (!d.pantalla) throw new Error('sin imagen');
    await usarImagen(await aBitmap(d.pantalla.png), d.modo === 'region');
  } catch {
    fase.value = 'error';
    aviso.value = t.errorCargar;
  }
}

function dibujarMiniatura(b: ImageBitmap, c: HTMLCanvasElement | undefined): void {
  if (!c) return;
  const f = Math.min(1, 320 / b.width, 200 / b.height);
  c.width = Math.max(1, Math.round(b.width * f));
  c.height = Math.max(1, Math.round(b.height * f));
  c.getContext('2d')?.drawImage(b, 0, 0, c.width, c.height);
}

/** La lista solo trae miniaturas: la ventana elegida se pide a tamaño real al proceso principal. */
async function elegirVentana(i: number): Promise<void> {
  const v = vistas.value[i];
  if (!v || ocupado.value) return;
  ocupado.value = true;
  aviso.value = null;
  try {
    const img = await window.captura.ventana(v.ventana.id);
    const bitmap = await aBitmap(img.png);
    vistas.value.forEach((x) => x.bitmap.close());
    vistas.value = [];
    await usarImagen(bitmap, false);
  } catch {
    aviso.value = t.errorVentana;
  } finally {
    ocupado.value = false;
  }
}

// ---- Ratón ----

function alPulsar(e: PointerEvent): void {
  if (!hayImagen.value || e.button !== 0 || entrada.value) return;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  const p = puntoDe(e);
  if (fase.value === 'seleccion') {
    inicio = acotar(p, { x: 0, y: 0, ancho: tam.value.ancho, alto: tam.value.alto });
    seleccion.value = { x: inicio.x, y: inicio.y, ancho: 0, alto: 0 };
    pintar();
    return;
  }
  const s = seleccion.value;
  if (fase.value !== 'edicion' || !s) return;
  const q = acotar(p, s);
  if (herramienta.value === 'texto') {
    const o = origenCss.value;
    entrada.value = {
      css: { x: o.x + q.x * vista.value.escala, y: o.y + q.y * vista.value.escala },
      imagen: q,
      valor: '',
    };
    void nextTick(() => campo.value?.focus());
    return;
  }
  inicio = q;
}

function construir(a: Punto, b: Punto): Anotacion {
  const g = grosor.value * factor.value;
  switch (herramienta.value) {
    case 'recuadro':
      return recuadro(a, b, color.value, g);
    case 'flecha':
      return flecha(a, b, color.value, g);
    case 'linea':
      return linea(a, b, color.value, g);
    case 'resaltar':
      return resaltar(a, b);
    case 'ocultar':
      return ocultar(a, b);
    default:
      return pixelado(a, b, factor.value);
  }
}

function alMover(e: PointerEvent): void {
  if (!inicio) return;
  const p = puntoDe(e);
  if (fase.value === 'seleccion') {
    const q = acotar(p, { x: 0, y: 0, ancho: tam.value.ancho, alto: tam.value.alto });
    seleccion.value = {
      x: Math.min(inicio.x, q.x),
      y: Math.min(inicio.y, q.y),
      ancho: Math.abs(inicio.x - q.x),
      alto: Math.abs(inicio.y - q.y),
    };
  } else if (seleccion.value) {
    trazo.value = construir(inicio, acotar(p, seleccion.value));
  }
  pintar();
}

function alSoltar(e: PointerEvent): void {
  if (!inicio) return;
  const a = inicio;
  inicio = null;
  const p = puntoDe(e);
  if (fase.value === 'seleccion') {
    const s = seleccion.value;
    // Un clic sin arrastrar no elige nada.
    if (!s || s.ancho < 6 || s.alto < 6) seleccion.value = null;
    else fase.value = 'edicion';
    pintar();
    return;
  }
  const s = seleccion.value;
  const nuevo = trazo.value;
  trazo.value = null;
  if (s && nuevo && Math.hypot(p.x - a.x, p.y - a.y) >= 3 * factor.value) {
    hacer([...anotaciones.value, nuevo]);
  }
  pintar();
}

/** Estado de la pila para los botones (la clase no es reactiva). */
function sincronizarPila(): void {
  puedeDeshacer.value = pila.puedeDeshacer;
  puedeRehacer.value = pila.puedeRehacer;
}

/** Una anotación nueva: entra en la pila de deshacer (límite 50). */
function hacer(nuevas: readonly Anotacion[]): void {
  anotaciones.value = pila.hacer(nuevas);
  sincronizarPila();
}

// ---- Texto ----

function confirmarTexto(): void {
  const e = entrada.value;
  entrada.value = null;
  if (!e || e.valor.trim() === '') return;
  const a = texto(e.imagen, e.valor, color.value, Math.round(18 * factor.value));
  hacer([...anotaciones.value, a]);
  pintar();
}

// ---- Acciones ----

function deshacer(): void {
  anotaciones.value = pila.deshacer();
  sincronizarPila();
  pintar();
}

function rehacer(): void {
  anotaciones.value = pila.rehacer();
  sincronizarPila();
  pintar();
}

function reseleccionar(): void {
  seleccion.value = null;
  // Las anotaciones de la selección anterior no pueden volver con "Deshacer": se vacía el historial.
  anotaciones.value = pila.reiniciar([]);
  sincronizarPila();
  trazo.value = null;
  fase.value = 'seleccion';
  pintar();
}

/** La zona elegida con las anotaciones, como PNG o JPG; nunca toca el disco. */
async function codificar(f: FormatoCaptura): Promise<Uint8Array> {
  const b = base.value;
  const s = seleccion.value;
  if (!b || !s) throw new Error('sin imagen');
  const completa = document.createElement('canvas');
  completa.width = b.width;
  completa.height = b.height;
  const cx = completa.getContext('2d');
  if (!cx) throw new Error('sin lienzo');
  cx.drawImage(b, 0, 0);
  renderizar(cx, b.width, b.height, anotaciones.value);
  const x = Math.max(0, Math.round(s.x));
  const y = Math.max(0, Math.round(s.y));
  const w = Math.max(1, Math.min(b.width - x, Math.round(s.ancho)));
  const h = Math.max(1, Math.min(b.height - y, Math.round(s.alto)));
  const salida = document.createElement('canvas');
  salida.width = w;
  salida.height = h;
  const so = salida.getContext('2d');
  if (!so) throw new Error('sin lienzo');
  if (f === 'jpg') {
    so.fillStyle = '#ffffff';
    so.fillRect(0, 0, w, h);
  }
  so.drawImage(completa, x, y, w, h, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) =>
    salida.toBlob(r, f === 'jpg' ? 'image/jpeg' : 'image/png', 0.92),
  );
  if (!blob) throw new Error('sin imagen');
  return new Uint8Array(await blob.arrayBuffer());
}

async function accion(fn: () => Promise<void>, error: string): Promise<void> {
  if (ocupado.value || !hayImagen.value || !seleccion.value) return;
  ocupado.value = true;
  aviso.value = null;
  try {
    await fn();
  } catch {
    aviso.value = error;
  } finally {
    ocupado.value = false;
  }
}

function cerrarTrasAviso(): void {
  temporizadorCierre = setTimeout(() => void window.captura.cerrar(), 1100);
}

const copiar = (): Promise<void> =>
  accion(async () => {
    await window.captura.copiar(await codificar('png'));
    aviso.value = t.copiada;
    cerrarTrasAviso();
  }, t.errorCopiar);

const guardar = (): Promise<void> =>
  accion(async () => {
    const r = await window.captura.guardar(await codificar(formato.value), formato.value);
    // null: se canceló el diálogo y se sigue editando.
    if (!r) return;
    aviso.value = t.guardada(r.archivo);
    cerrarTrasAviso();
  }, t.errorGuardar);

const alConversor = (): Promise<void> =>
  accion(async () => {
    await window.captura.alConversor(await codificar('png'));
  }, t.errorConversor);

function cerrar(): void {
  void window.captura.cerrar();
}

// ---- Teclado ----

function alTeclear(e: KeyboardEvent): void {
  if (entrada.value) return;
  const ctrl = e.ctrlKey || e.metaKey;
  if (e.key === 'Escape') {
    e.preventDefault();
    cerrar();
  } else if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault();
    deshacer();
  } else if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
    e.preventDefault();
    rehacer();
  } else if (ctrl && e.key.toLowerCase() === 'c' && fase.value === 'edicion') {
    e.preventDefault();
    void copiar();
  } else if (ctrl && e.key.toLowerCase() === 's' && fase.value === 'edicion') {
    e.preventDefault();
    void guardar();
  }
}

const alAjustar = (): void => {
  tickResize.value++;
  void nextTick(pintar);
};

onMounted(() => {
  window.addEventListener('keydown', alTeclear);
  window.addEventListener('resize', alAjustar);
  void cargar();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', alTeclear);
  window.removeEventListener('resize', alAjustar);
  if (temporizadorCierre) clearTimeout(temporizadorCierre);
  base.value?.close();
  vistas.value.forEach((v) => v.bitmap.close());
});
</script>

<template>
  <main class="captura" :class="{ centrada: !esRegion }">
    <p v-if="fase === 'cargando'" class="mensaje">{{ t.cargando }}</p>
    <p v-else-if="fase === 'error'" class="mensaje" role="alert">{{ aviso }}</p>

    <section v-else-if="fase === 'ventanas'" class="ventanas" :aria-label="t.panel.ventana">
      <p class="guia">{{ t.guiaVentana }}</p>
      <p v-if="vistas.length === 0" class="mensaje">{{ t.sinVentanas }}</p>
      <div class="rejilla">
        <button
          v-for="(v, i) in vistas"
          :key="v.ventana.id"
          type="button"
          class="ventana"
          @click="elegirVentana(i)"
        >
          <canvas
            :ref="(el) => (miniaturas[i] = el as HTMLCanvasElement)"
            class="miniatura"
            aria-hidden="true"
          ></canvas>
          <span class="nombre">{{ v.ventana.nombre }}</span>
        </button>
      </div>
    </section>

    <template v-else>
      <canvas
        ref="lienzo"
        class="lienzo"
        :class="{ dibujando: fase === 'edicion' }"
        :style="{ width: `${vista.ancho}px`, height: `${vista.alto}px` }"
        @pointerdown="alPulsar"
        @pointermove="alMover"
        @pointerup="alSoltar"
        @pointercancel="alSoltar"
      ></canvas>
      <p v-if="fase === 'seleccion'" class="guia flotante">{{ t.guiaRegion }}</p>
      <input
        v-if="entrada"
        ref="campo"
        v-model="entrada.valor"
        class="campo-texto"
        type="text"
        maxlength="200"
        :placeholder="t.textoPlaceholder"
        :aria-label="t.herramientas.texto"
        :style="{ ...estiloCampo, color }"
        @keydown.enter.prevent="confirmarTexto"
        @keydown.esc.stop.prevent="entrada = null"
        @blur="confirmarTexto"
      />
      <div v-if="fase === 'edicion'" class="barra-flotante" :style="estiloBarra">
        <EditorCaptura
          v-model:herramienta="herramienta"
          v-model:color="color"
          v-model:grosor="grosor"
          v-model:formato="formato"
          :puede-deshacer="puedeDeshacer"
          :puede-rehacer="puedeRehacer"
          :puede-reseleccionar="esRegion"
          :ocupado="ocupado"
          @deshacer="deshacer"
          @rehacer="rehacer"
          @copiar="copiar"
          @guardar="guardar"
          @al-conversor="alConversor"
          @reseleccionar="reseleccionar"
          @cerrar="cerrar"
        />
        <p v-if="seleccion" class="medida-sel">
          {{ t.dimensiones(Math.round(seleccion.ancho), Math.round(seleccion.alto)) }}
        </p>
      </div>
    </template>

    <p v-if="aviso && fase !== 'error'" class="aviso" role="status">{{ aviso }}</p>
  </main>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #000;
  font-family:
    'Segoe UI Variable Text',
    'Segoe UI',
    system-ui,
    -apple-system,
    sans-serif;
}
</style>

<style scoped>
.captura {
  position: fixed;
  inset: 0;
  color: #f4f4f5;
  user-select: none;
}
.captura.centrada {
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.78);
}
.lienzo {
  display: block;
  cursor: crosshair;
  touch-action: none;
}
.lienzo.dibujando {
  cursor: crosshair;
}
.mensaje,
.guia {
  margin: 0;
  font-size: 15px;
}
.guia.flotante {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(24, 24, 27, 0.9);
  pointer-events: none;
}
.barra-flotante {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}
.medida-sel {
  margin: 0;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(24, 24, 27, 0.9);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.campo-texto {
  position: fixed;
  min-width: 180px;
  padding: 3px 6px;
  border: 1px dashed #fff;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  font: 600 18px sans-serif;
  outline: none;
}
.aviso {
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(24, 24, 27, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 13px;
}
.ventanas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  overflow: auto;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  width: min(1200px, 100%);
}
.ventana {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.ventana:hover,
.ventana:focus-visible {
  border-color: #818cf8;
  background: rgba(129, 140, 248, 0.12);
  outline: none;
}
.miniatura {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
}
.nombre {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
</style>
