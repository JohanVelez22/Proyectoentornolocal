import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  AccionContenedor,
  Contenedor,
  EstadoMotor,
  LineasContenedor,
  MotorContenedores,
} from '../../shared/api';
import { api } from '../api';

/** Refresco de la lista mientras la pantalla está a la vista. */
export const INTERVALO_CONTENEDORES_MS = 5000;
/** Líneas que se guardan del registro abierto (las más viejas se descartan). */
export const MAX_LINEAS_REGISTRO = 2000;

/** Lo mínimo del `document` que hace falta (las pruebas pasan uno falso). */
export interface DocumentoVisible {
  visibilityState: string;
  addEventListener(tipo: 'visibilitychange', fn: () => void): void;
  removeEventListener(tipo: 'visibilitychange', fn: () => void): void;
}

export interface RegistroAbierto {
  motor: MotorContenedores;
  id: string;
  nombre: string;
  lineas: string[];
  fin: boolean;
}

/**
 * Pantalla Contenedores: motores detectados, lista del motor elegido (refresco cada 5 s solo con
 * la pantalla visible) y el registro abierto. Los fallos del refresco automático no muestran
 * errores: el estado del motor ya lo explica en la pantalla.
 */
export const useContenedores = defineStore('contenedores', () => {
  const motores = ref<EstadoMotor[] | null>(null);
  const motor = ref<MotorContenedores | null>(null);
  const lista = ref<Contenedor[]>([]);
  const registro = ref<RegistroAbierto | null>(null);
  let temporizador: ReturnType<typeof setInterval> | null = null;
  let documento: DocumentoVisible | null = null;
  let alVisibilidad: (() => void) | null = null;
  let baja: (() => void) | null = null;
  let pedido = 0;
  let enCurso = false;

  const instalados = computed(() => motores.value?.filter((m) => m.ruta !== null) ?? []);
  const estadoMotor = computed(() => motores.value?.find((m) => m.motor === motor.value) ?? null);

  /** Detecta los motores y elige uno: el actual si sigue instalado, si no el que responda. */
  async function detectar(): Promise<void> {
    const m = await api().contenedores.motores();
    motores.value = m;
    const conRuta = m.filter((x) => x.ruta !== null);
    if (!conRuta.some((x) => x.motor === motor.value)) {
      motor.value = (conRuta.find((x) => x.responde) ?? conRuta[0])?.motor ?? null;
    }
    if (!estadoMotor.value?.responde) lista.value = [];
  }

  /** Pide la lista del motor elegido; una respuesta vieja no pisa a una nueva. */
  async function refrescar(): Promise<void> {
    const m = motor.value;
    if (!m || !estadoMotor.value?.responde) {
      lista.value = [];
      return;
    }
    const n = ++pedido;
    try {
      const l = await api().contenedores.lista(m);
      if (n === pedido && m === motor.value) lista.value = l;
    } catch (e) {
      // El motor se apagó: se vuelve a detectar (el estado lo explica en pantalla).
      await detectar().catch(() => undefined);
      throw e;
    }
  }

  async function elegirMotor(m: MotorContenedores): Promise<void> {
    if (motor.value === m) return;
    motor.value = m;
    lista.value = [];
    await refrescar();
  }

  /** Detener y reiniciar llevan la confirmación del diálogo; iniciar no la necesita. */
  async function accion(c: Contenedor, a: AccionContenedor, confirmacion?: true): Promise<void> {
    const m = motor.value;
    if (!m) return;
    await api().contenedores.accion(m, c.id, a, confirmacion);
    await refrescar().catch(() => undefined);
  }

  async function cerrarRegistro(): Promise<void> {
    const r = registro.value;
    registro.value = null;
    if (r) await api().contenedores.dejar(r.motor, r.id);
  }

  async function abrirRegistro(c: Contenedor): Promise<void> {
    const m = motor.value;
    if (!m) return;
    if (registro.value?.motor === m && registro.value.id === c.id) return;
    await cerrarRegistro().catch(() => undefined);
    registro.value = { motor: m, id: c.id, nombre: c.nombre || c.id, lineas: [], fin: false };
    try {
      await api().contenedores.seguir(m, c.id);
    } catch (e) {
      if (registro.value?.id === c.id) registro.value = null;
      throw e;
    }
  }

  function recibir(d: LineasContenedor): void {
    const r = registro.value;
    if (!r || r.motor !== d.motor || r.id !== d.id) return;
    if (d.lineas.length) {
      const todas = r.lineas.concat(d.lineas);
      r.lineas = todas.length > MAX_LINEAS_REGISTRO ? todas.slice(-MAX_LINEAS_REGISTRO) : todas;
    }
    if (d.fin) r.fin = true;
  }

  /** Un refresco automático: nunca lanza (sin avisos repetidos cada 5 s). */
  async function tick(): Promise<void> {
    if (enCurso || documento?.visibilityState !== 'visible') return;
    enCurso = true;
    try {
      if (estadoMotor.value?.responde) await refrescar();
      else await detectar();
    } catch {
      // el estado del motor ya lo explica
    } finally {
      enCurso = false;
    }
  }

  /** Al entrar en la pantalla: detecta, escucha los registros y refresca cada 5 s si se ve. */
  async function entrar(doc: DocumentoVisible = document): Promise<void> {
    if (temporizador) return;
    documento = doc;
    baja = api().on('contenedor:lineas', recibir);
    temporizador = setInterval(() => void tick(), INTERVALO_CONTENEDORES_MS);
    alVisibilidad = () => void tick();
    doc.addEventListener('visibilitychange', alVisibilidad);
    await detectar();
    await refrescar().catch(() => undefined);
  }

  /** Al salir: deja de refrescar y suelta el registro abierto. */
  async function salir(): Promise<void> {
    if (temporizador) clearInterval(temporizador);
    temporizador = null;
    if (documento && alVisibilidad)
      documento.removeEventListener('visibilitychange', alVisibilidad);
    documento = null;
    alVisibilidad = null;
    baja?.();
    baja = null;
    await cerrarRegistro().catch(() => undefined);
  }

  return {
    motores,
    motor,
    lista,
    registro,
    instalados,
    estadoMotor,
    detectar,
    refrescar,
    elegirMotor,
    accion,
    abrirRegistro,
    cerrarRegistro,
    recibir,
    entrar,
    salir,
  };
});
