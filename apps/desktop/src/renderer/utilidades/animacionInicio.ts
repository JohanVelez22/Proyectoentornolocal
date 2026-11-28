/**
 * Animación de inicio (D56): el logo se dibuja con un trazo de neón sobre la app mientras carga.
 * Aquí vive la lógica (cuándo se muestra y cuánto dura); el dibujo es CSS puro en
 * `AnimacionInicio.vue`. Nada de esto retrasa el arranque: la capa se pinta encima, no se espera
 * y desaparece sola.
 */
import { PARAMETRO_SIN_ANIMACION } from '../../shared/animacion';

export type ModoAnimacion = 'completa' | 'reducida' | 'ninguna';
export type FaseAnimacion = 'animando' | 'saliendo' | 'terminada';

/** Tope absoluto: a los 2,5 s la capa ya no existe, esté o no lista la app. */
export const DURACION_MAX_MS = 2500;
/** Con movimiento reducido: solo un fundido corto, sin dibujo. */
export const FUNDIDO_REDUCIDO_MS = 250;
/** Fundido al saltarla con un clic o Esc. */
export const FUNDIDO_SALTO_MS = 150;

export interface EntornoAnimacion {
  /** Preferencia «Animación de inicio» (Ajustes › Apariencia). */
  activada: boolean;
  /** Prueba de humo o capturas automáticas: nunca se anima. */
  humo: boolean;
  /** `prefers-reduced-motion: reduce`. */
  movimientoReducido: boolean;
}

export function modoAnimacion(e: EntornoAnimacion): ModoAnimacion {
  if (e.humo || !e.activada) return 'ninguna';
  return e.movimientoReducido ? 'reducida' : 'completa';
}

/** Lee del navegador si es la prueba de humo y si el sistema pide menos movimiento. */
export function entornoDelNavegador(activada: boolean): EntornoAnimacion {
  let humo = false;
  let movimientoReducido = false;
  try {
    humo = new URLSearchParams(window.location.search).has(PARAMETRO_SIN_ANIMACION);
    movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    // sin ventana (pruebas) o sin matchMedia: valores por defecto
  }
  return { activada, humo, movimientoReducido };
}

export interface ControlAnimacion {
  fase(): FaseAnimacion;
  /** Fundido corto y fin (un clic o Esc). No hace nada si ya está saliendo o terminó. */
  saltar(): void;
  /** Quita oyentes y temporizadores sin más cambios de fase (al desmontar la capa). */
  detener(): void;
}

export interface OpcionesAnimacion {
  modo: Exclude<ModoAnimacion, 'ninguna'>;
  /** Normalmente `window`. */
  objetivo: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  alCambiar(fase: FaseAnimacion): void;
}

/**
 * Arranca la cuenta atrás de la capa y escucha clic y Esc. Es síncrona y no espera nada. Los
 * eventos se oyen en la fase de captura sin detenerlos: la capa nunca atrapa un clic ni una tecla.
 */
export function iniciarAnimacion(o: OpcionesAnimacion): ControlAnimacion {
  let fase: FaseAnimacion = 'animando';
  let temporizador: ReturnType<typeof setTimeout> | null = null;
  const alPuntero = (): void => saltar();
  const alTeclado = (e: Event): void => {
    if ((e as KeyboardEvent).key === 'Escape') saltar();
  };
  const limpiar = (): void => {
    if (temporizador !== null) clearTimeout(temporizador);
    temporizador = null;
    o.objetivo.removeEventListener('pointerdown', alPuntero, true);
    o.objetivo.removeEventListener('keydown', alTeclado, true);
  };
  const cambiar = (f: FaseAnimacion): void => {
    fase = f;
    o.alCambiar(f);
  };
  const terminar = (): void => {
    limpiar();
    cambiar('terminada');
  };
  function saltar(): void {
    if (fase !== 'animando') return;
    if (temporizador !== null) clearTimeout(temporizador);
    cambiar('saliendo');
    temporizador = setTimeout(terminar, FUNDIDO_SALTO_MS);
  }

  o.objetivo.addEventListener('pointerdown', alPuntero, true);
  o.objetivo.addEventListener('keydown', alTeclado, true);
  temporizador = setTimeout(
    terminar,
    o.modo === 'reducida' ? FUNDIDO_REDUCIDO_MS : DURACION_MAX_MS,
  );
  o.alCambiar('animando');
  return {
    fase: () => fase,
    saltar,
    detener: limpiar,
  };
}
