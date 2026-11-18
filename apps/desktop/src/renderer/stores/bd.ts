import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  BaseListada,
  EstadoPgvector,
  MotorBd,
  MotorSql,
  OrigenImportar,
  ProgresoBd,
  ProgresoInstalacion,
  ResultadoBuildTools,
  ResultadoRestaurar,
} from '../../shared/api';
import { api, plano } from '../api';
import { es } from '../i18n/es';
import { esErrorTrasReemplazo, recortarLineas, respaldoEnMensaje } from '../utilidades/bd';

/** Mensaje claro del núcleo (sin depender de naive-ui, para poder probar el store). */
function mensajeDeError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'string' && e) return e;
  return es.errores.desconocido;
}

/** Líneas que se conservan en cada registro de progreso (las más recientes). */
export const LIMITE_LINEAS = 500;

/** Progreso de instalación que pertenece a la sección pgvector. */
const SERVICIOS_PGVECTOR = new Set(['pgvector', 'pgvector-src', 'buildtools']);

export interface LineaRegistro {
  /** Correlativo (clave estable para la lista). */
  n: number;
  texto: string;
}

export type TipoOperacion = ProgresoBd['operacion'];

/** Una operación larga sobre una base. Nunca guarda la clave del servidor de origen. */
export interface OperacionBd {
  tipo: TipoOperacion;
  motor: MotorSql;
  base: string;
  estado: 'corriendo' | 'ok' | 'error';
  /** Restaurar e importar. */
  resultado?: ResultadoRestaurar;
  /** Respaldar: archivo creado. */
  archivo?: string;
  error?: string;
  /** Falló después de reemplazar la base: el mensaje nombra la copia de seguridad. */
  trasReemplazo?: boolean;
  respaldoPrevio?: string | null;
}

export type TareaPgvector = 'buildtools' | 'compilar';

export const useBd = defineStore('bd', () => {
  const bases = ref<Partial<Record<MotorBd, BaseListada[]>>>({});
  const cargando = ref<Partial<Record<MotorBd, boolean>>>({});
  const errorCarga = ref<Partial<Record<MotorBd, string>>>({});
  const lineas = ref<LineaRegistro[]>([]);
  const operacion = ref<OperacionBd | null>(null);
  const pgvector = ref<EstadoPgvector | null>(null);
  const lineasPgvector = ref<LineaRegistro[]>([]);
  const tareaPgvector = ref<TareaPgvector | null>(null);
  let contador = 0;
  let bajas: (() => void)[] = [];

  const enCurso = computed(() => operacion.value?.estado === 'corriendo');

  function agregarLinea(texto: string): void {
    lineas.value = recortarLineas(lineas.value, [{ n: ++contador, texto }], LIMITE_LINEAS);
  }

  function agregarLineaPgvector(texto: string): void {
    lineasPgvector.value = recortarLineas(
      lineasPgvector.value,
      [{ n: ++contador, texto }],
      LIMITE_LINEAS,
    );
  }

  function limpiarLineas(): void {
    lineas.value = [];
  }

  function aplicarProgreso(p: ProgresoBd): void {
    agregarLinea(p.linea);
  }

  function aplicarProgresoInstalacion(p: ProgresoInstalacion): void {
    if (!SERVICIOS_PGVECTOR.has(p.servicio)) return;
    if (p.mensaje) agregarLineaPgvector(p.mensaje);
  }

  async function cargarBases(motor: MotorBd): Promise<void> {
    cargando.value = { ...cargando.value, [motor]: true };
    try {
      const lista = await api().bd.listar(motor);
      bases.value = { ...bases.value, [motor]: lista };
      const errores = { ...errorCarga.value };
      delete errores[motor];
      errorCarga.value = errores;
    } catch (e) {
      errorCarga.value = { ...errorCarga.value, [motor]: mensajeDeError(e) };
      const copia = { ...bases.value };
      delete copia[motor];
      bases.value = copia;
    } finally {
      cargando.value = { ...cargando.value, [motor]: false };
    }
  }

  function empezar(tipo: TipoOperacion, motor: MotorSql, base: string): void {
    if (enCurso.value) throw new Error('Ya hay una operación en curso; espere a que termine.');
    limpiarLineas();
    operacion.value = { tipo, motor, base, estado: 'corriendo' };
  }

  function fallar(e: unknown): void {
    if (!operacion.value) return;
    const mensaje = mensajeDeError(e);
    const tras = esErrorTrasReemplazo(e);
    operacion.value = {
      ...operacion.value,
      estado: 'error',
      error: mensaje,
      trasReemplazo: tras,
      respaldoPrevio: tras ? respaldoEnMensaje(mensaje) : null,
    };
  }

  /** Restaura un respaldo; el resultado (o el error) queda en `operacion`. Nunca lanza. */
  async function restaurar(
    motor: MotorSql,
    archivo: string,
    base: string,
    confirmarSobrescribir: boolean,
  ): Promise<OperacionBd> {
    empezar('restaurar', motor, base);
    try {
      const r = await api().bd.restaurar(
        motor,
        archivo,
        base,
        confirmarSobrescribir ? { confirmarSobrescribir: true } : {},
      );
      operacion.value = { ...operacion.value!, estado: 'ok', resultado: r };
    } catch (e) {
      fallar(e);
    }
    void cargarBases(motor);
    return operacion.value!;
  }

  /**
   * Copia una base de otro servidor. `origen` (con su clave) solo se pasa al núcleo: no se guarda
   * en el estado, ni siquiera si falla.
   */
  async function importar(
    motor: MotorSql,
    origen: OrigenImportar,
    destino: string,
    confirmarSobrescribir: boolean,
  ): Promise<OperacionBd> {
    empezar('importar', motor, destino);
    try {
      const r = await api().bd.importar(
        motor,
        plano(origen),
        destino,
        confirmarSobrescribir ? { confirmarSobrescribir: true } : {},
      );
      operacion.value = { ...operacion.value!, estado: 'ok', resultado: r };
    } catch (e) {
      fallar(e);
    }
    void cargarBases(motor);
    return operacion.value!;
  }

  async function respaldar(
    motor: MotorSql,
    base: string,
    carpeta: string | null,
  ): Promise<OperacionBd> {
    empezar('respaldar', motor, base);
    try {
      const r = await api().bd.respaldar(motor, base, carpeta ?? undefined);
      operacion.value = { ...operacion.value!, estado: 'ok', archivo: r.archivo };
    } catch (e) {
      fallar(e);
    }
    return operacion.value!;
  }

  /** Olvida una operación terminada (la que está en curso no se puede descartar). */
  function descartarOperacion(): void {
    if (enCurso.value) return;
    operacion.value = null;
  }

  async function cargarPgvector(): Promise<void> {
    pgvector.value = await api().pgvector.estado();
  }

  async function conTareaPgvector<T>(tarea: TareaPgvector, fn: () => Promise<T>): Promise<T> {
    if (tareaPgvector.value) throw new Error('Ya hay una instalación de pgvector en curso.');
    tareaPgvector.value = tarea;
    lineasPgvector.value = [];
    try {
      return await fn();
    } finally {
      tareaPgvector.value = null;
      await cargarPgvector().catch(() => undefined);
    }
  }

  function instalarBuildTools(): Promise<ResultadoBuildTools> {
    return conTareaPgvector('buildtools', () => api().pgvector.instalarBuildTools());
  }

  function compilarPgvector(): Promise<{ version: string }> {
    return conTareaPgvector('compilar', () => api().pgvector.compilarEInstalar());
  }

  /** Se suscribe una sola vez (desde el arranque) para no perder líneas al cambiar de pantalla. */
  function iniciar(): void {
    if (bajas.length) return;
    bajas = [
      api().on('bd:progreso', aplicarProgreso),
      api().on('instalacion:progreso', aplicarProgresoInstalacion),
    ];
  }

  function detener(): void {
    bajas.forEach((b) => b());
    bajas = [];
  }

  return {
    bases,
    cargando,
    errorCarga,
    lineas,
    operacion,
    pgvector,
    lineasPgvector,
    tareaPgvector,
    enCurso,
    agregarLinea,
    limpiarLineas,
    cargarBases,
    restaurar,
    importar,
    respaldar,
    descartarOperacion,
    cargarPgvector,
    instalarBuildTools,
    compilarPgvector,
    iniciar,
    detener,
  };
});
