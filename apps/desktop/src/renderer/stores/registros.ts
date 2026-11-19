import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import type { FuenteRegistroPublica } from '../../shared/api';
import { api } from '../api';
import {
  BuferLineas,
  CAPACIDAD_REGISTROS,
  filtrarLineas,
  NIVELES_REGISTRO,
  type NivelRegistro,
} from '../utilidades/registros';

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

  const bufer = new BuferLineas(CAPACIDAD_REGISTROS);
  /** Cambia cuando lo visible debe recalcularse (el búfer no es reactivo a propósito). */
  const version = ref(0);

  const lineas = computed(() => {
    void version.value;
    return bufer.lista();
  });
  const visibles = computed(() =>
    filtrarLineas(lineas.value, { texto: texto.value, niveles: niveles.value }),
  );
  const descartadas = computed(() => {
    void version.value;
    return bufer.descartadas;
  });

  let baja: (() => void) | null = null;
  /** Evita que una respuesta de una fuente anterior se mezcle con la elegida después. */
  let turno = 0;

  function refrescar(): void {
    version.value++;
  }

  function recibir(dato: { id: string; lineas: string[] }): void {
    if (dato.id !== actual.value || !dato.lineas.length) return;
    bufer.agregar(dato.lineas);
    if (pausado.value) nuevasEnPausa.value += dato.lineas.length;
    else refrescar();
  }

  async function cargarFuentes(): Promise<void> {
    fuentes.value = await api().registros.fuentes();
  }

  async function soltar(): Promise<void> {
    const id = actual.value;
    if (id)
      await api()
        .registros.dejar(id)
        .catch(() => undefined);
  }

  /** Cambia la fuente: deja la anterior, lee el final de la nueva y empieza a seguirla. */
  async function elegir(id: string | null): Promise<void> {
    if (id === actual.value) return;
    const mio = ++turno;
    await soltar();
    actual.value = id;
    bufer.vaciar();
    nuevasEnPausa.value = 0;
    refrescar();
    if (!id) return;
    cargando.value = true;
    try {
      const final = await api().registros.leerFinal(id, CAPACIDAD_REGISTROS);
      if (mio !== turno) return;
      bufer.agregar(final);
      refrescar();
      await api().registros.seguir(id);
      // Si mientras tanto se eligió otra o se salió de la pantalla, no se queda siguiendo.
      if (mio !== turno || actual.value !== id) await api().registros.dejar(id);
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

  function entrar(): void {
    if (!baja) baja = api().on('registro:lineas', recibir);
  }

  /** Al salir de la pantalla: deja de seguir la fuente y suelta el oyente. */
  async function salir(): Promise<void> {
    turno++;
    baja?.();
    baja = null;
    await soltar();
    actual.value = null;
    bufer.vaciar();
    pausado.value = false;
    nuevasEnPausa.value = 0;
    cargando.value = false;
    refrescar();
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
    descartadas,
    cargarFuentes,
    elegir,
    pausar,
    reanudar,
    limpiar,
    entrar,
    salir,
    recibir,
  };
});
