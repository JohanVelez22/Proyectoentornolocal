import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import type { FuenteRegistroPublica } from '../../shared/api';
import { api } from '../api';
import {
  BuferLineas,
  CAPACIDAD_REGISTROS,
  filtrarLineas,
  NIVELES_REGISTRO,
  type LineaRegistro,
  type NivelRegistro,
} from '../utilidades/registros';

/** Los lotes que llegan seguidos se pintan juntos, como mucho una vez cada este tiempo. */
export const ESPERA_REFRESCO_MS = 150;
/** Líneas que se pintan al principio (las más nuevas); "Mostrar más" suma este mismo número. */
export const LIMITE_INICIAL_REGISTROS = 1500;

/**
 * Visor de registros: una fuente seguida a la vez, con un búfer circular de 5000 líneas.
 * `entrar`/`salir` atan los oyentes a la pantalla: al salir se deja de seguir la fuente.
 */
export const useRegistros = defineStore('registros', () => {
  const fuentes = shallowRef<FuenteRegistroPublica[]>([]);
  const actual = ref<string | null>(null);
  const texto = ref('');
  const niveles = ref<NivelRegistro[]>([...NIVELES_REGISTRO]);
  const pausado = ref(false);
  /** Líneas recibidas durante la pausa (se ven al reanudar). */
  const nuevasEnPausa = ref(0);
  const cargando = ref(false);
  const limite = ref(LIMITE_INICIAL_REGISTROS);

  const bufer = new BuferLineas(CAPACIDAD_REGISTROS);
  /** Copia de lo que hay en el búfer; solo cambia al refrescar (el búfer no es reactivo). */
  const lineas = shallowRef<LineaRegistro[]>([]);
  const descartadas = ref(0);
  const visibles = computed(() =>
    filtrarLineas(lineas.value, { texto: texto.value, niveles: niveles.value }),
  );
  /** Las últimas `limite` líneas visibles: es lo que se pinta. */
  const mostradas = computed(() =>
    visibles.value.length > limite.value ? visibles.value.slice(-limite.value) : visibles.value,
  );
  const ocultas = computed(() => visibles.value.length - mostradas.value.length);

  let baja: (() => void) | null = null;
  /** Evita que una respuesta de una fuente anterior se mezcle con la elegida después. */
  let turno = 0;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  /** Recalcula ya lo visible (y descarta un refresco pendiente). */
  function refrescar(): void {
    if (temporizador) clearTimeout(temporizador);
    temporizador = null;
    lineas.value = bufer.lista();
    descartadas.value = bufer.descartadas;
  }

  /** Agrupa los lotes de una ráfaga en un solo recálculo. */
  function programarRefresco(): void {
    if (temporizador) return;
    temporizador = setTimeout(refrescar, ESPERA_REFRESCO_MS);
  }

  function recibir(dato: { id: string; lineas: string[] }): void {
    if (dato.id !== actual.value || !dato.lineas.length) return;
    bufer.agregar(dato.lineas);
    if (pausado.value) nuevasEnPausa.value += dato.lineas.length;
    else programarRefresco();
  }

  async function cargarFuentes(): Promise<void> {
    fuentes.value = await api().registros.fuentes();
  }

  async function dejar(id: string | null): Promise<void> {
    if (id)
      await api()
        .registros.dejar(id)
        .catch(() => undefined);
  }

  function reiniciarVista(): void {
    bufer.vaciar();
    nuevasEnPausa.value = 0;
    limite.value = LIMITE_INICIAL_REGISTROS;
    refrescar();
  }

  /** Cambia la fuente: deja la anterior, lee el final de la nueva y empieza a seguirla. */
  async function elegir(id: string | null): Promise<void> {
    if (id === actual.value) return;
    const mio = ++turno;
    const anterior = actual.value;
    actual.value = id;
    reiniciarVista();
    await dejar(anterior);
    if (!id || mio !== turno) return;
    cargando.value = true;
    try {
      const final = await api().registros.leerFinal(id, CAPACIDAD_REGISTROS);
      if (mio !== turno) return;
      bufer.agregar(final);
      refrescar();
      await api().registros.seguir(id);
      // Si mientras tanto se eligió otra o se salió de la pantalla, no se queda siguiendo.
      if (mio !== turno || actual.value !== id) await dejar(id);
    } finally {
      if (mio === turno) cargando.value = false;
    }
  }

  function pausar(): void {
    pausado.value = true;
  }
  function reanudar(): void {
    pausado.value = false;
    nuevasEnPausa.value = 0;
    refrescar();
  }
  function limpiar(): void {
    bufer.vaciar();
    nuevasEnPausa.value = 0;
    refrescar();
  }
  function mostrarMas(): void {
    limite.value = Math.min(CAPACIDAD_REGISTROS, limite.value + LIMITE_INICIAL_REGISTROS);
  }

  function entrar(): void {
    if (!baja) baja = api().on('registro:lineas', recibir);
  }

  /** Al salir de la pantalla: deja de seguir la fuente y suelta el oyente. */
  async function salir(): Promise<void> {
    const mio = ++turno;
    baja?.();
    baja = null;
    const id = actual.value;
    actual.value = null;
    await dejar(id);
    // Si se volvió a entrar mientras se esperaba, lo nuevo no se toca.
    if (mio !== turno) return;
    pausado.value = false;
    cargando.value = false;
    reiniciarVista();
  }

  return {
    fuentes,
    actual,
    texto,
    niveles,
    pausado,
    nuevasEnPausa,
    cargando,
    lineas,
    visibles,
    mostradas,
    ocultas,
    descartadas,
    cargarFuentes,
    elegir,
    pausar,
    reanudar,
    limpiar,
    mostrarMas,
    entrar,
    salir,
    recibir,
  };
});
