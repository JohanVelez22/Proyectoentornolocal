import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  BaseListada,
  EstadoPgvector,
  IdInstancia,
  MotorBd,
  MotorSql,
  OrigenImportar,
  ProgresoBd,
  ProgresoInstalacion,
  ResultadoBuildTools,
  ResultadoRestaurar,
} from '../../shared/api';
import { api, plano } from '../api';
import { textos } from '../i18n';
import { mensajeDeError } from '../utilidades/errores';
import { esErrorTrasReemplazo, recortarLineas, respaldoEnMensaje } from '../utilidades/bd';
import { useServicios } from './servicios';

/** Clave (en este equipo) de la última instancia elegida por motor. */
export const CLAVE_INSTANCIAS_BD = 'wolfcore.bd.instancias';

/**
 * A qué apuntan las rutas `bd.*`: la instancia elegida si sigue existiendo; si no (o sin
 * instancias configuradas), el motor, que es su instancia predeterminada.
 */
export function objetivoDe(
  motor: MotorBd,
  elegida: IdInstancia | undefined,
  instancias: readonly { id: string }[] | undefined,
): MotorBd | IdInstancia {
  if (elegida && elegida.startsWith(`${motor}@`) && instancias?.some((i) => i.id === elegida)) {
    return elegida;
  }
  return motor;
}

function leerRecordadas(): Partial<Record<MotorBd, IdInstancia>> {
  try {
    const t = globalThis.localStorage?.getItem(CLAVE_INSTANCIAS_BD);
    const o = t ? (JSON.parse(t) as unknown) : null;
    if (!o || typeof o !== 'object') return {};
    const res: Partial<Record<MotorBd, IdInstancia>> = {};
    for (const [m, id] of Object.entries(o as Record<string, unknown>)) {
      if (typeof id === 'string' && id.startsWith(`${m}@`)) res[m as MotorBd] = id as IdInstancia;
    }
    return res;
  } catch {
    return {};
  }
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
  const carpetaRespaldos = ref<string | null>(null);
  /** Instancia elegida por motor (se recuerda en este equipo). */
  const instancias = ref<Partial<Record<MotorBd, IdInstancia>>>(leerRecordadas());
  let contador = 0;

  /** Instancias configuradas del motor (vacío = la única, implícita). */
  function instanciasDe(motor: MotorBd) {
    return useServicios().porId[motor]?.instancias ?? [];
  }

  /** Lo que se manda a `bd.*` para el motor: su instancia elegida o el motor. */
  function objetivo(motor: MotorBd): MotorBd | IdInstancia {
    return objetivoDe(motor, instancias.value[motor], instanciasDe(motor));
  }

  function elegirInstancia(motor: MotorBd, id: IdInstancia | null): void {
    const copia = { ...instancias.value };
    if (id) copia[motor] = id;
    else delete copia[motor];
    instancias.value = copia;
    try {
      globalThis.localStorage?.setItem(CLAVE_INSTANCIAS_BD, JSON.stringify(copia));
    } catch {
      // sin almacenamiento local: se recuerda solo mientras la app está abierta
    }
    const b = { ...bases.value };
    delete b[motor];
    bases.value = b;
  }
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

  /** Solo mientras corre una operación: líneas sueltas no ensucian un resultado ya mostrado. */
  function aplicarProgreso(p: ProgresoBd): void {
    if (enCurso.value) agregarLinea(p.linea);
  }

  function aplicarProgresoInstalacion(p: ProgresoInstalacion): void {
    if (!SERVICIOS_PGVECTOR.has(p.servicio)) return;
    if (p.mensaje) agregarLineaPgvector(p.mensaje);
  }

  async function cargarBases(motor: MotorBd): Promise<void> {
    cargando.value = { ...cargando.value, [motor]: true };
    try {
      const lista = await api().bd.listar(objetivo(motor));
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

  /** Error de una operación: el respaldo previo llega estructurado; el mensaje es el respaldo. */
  function conError(o: OperacionBd, e: unknown): OperacionBd {
    const mensaje = mensajeDeError(e);
    const tras = esErrorTrasReemplazo(e);
    const datos = (e as { datos?: { respaldoPrevio?: unknown } } | null)?.datos;
    const previo =
      typeof datos?.respaldoPrevio === 'string' ? datos.respaldoPrevio : respaldoEnMensaje(mensaje);
    return {
      ...o,
      estado: 'error',
      error: mensaje,
      trasReemplazo: tras,
      respaldoPrevio: tras ? previo : null,
    };
  }

  /**
   * Corre una operación larga y deja su resultado (o error) en `operacion`. Nunca lanza: si ya
   * hay otra en curso, devuelve un error sin tocar la que corre.
   */
  async function correr(
    tipo: TipoOperacion,
    motor: MotorSql,
    base: string,
    fn: () => Promise<Partial<OperacionBd>>,
  ): Promise<OperacionBd> {
    let o: OperacionBd = { tipo, motor, base, estado: 'corriendo' };
    if (enCurso.value) return { ...o, estado: 'error', error: textos.bd.progreso.otraEnCurso };
    try {
      limpiarLineas();
      operacion.value = o;
      o = { ...o, ...(await fn()), estado: 'ok' };
    } catch (e) {
      o = conError(o, e);
    }
    operacion.value = o;
    return o;
  }

  const opciones = (confirmar: boolean) => (confirmar ? { confirmarSobrescribir: true } : {});

  /** Restaura un respaldo; el resultado (o el error) queda en `operacion`. Nunca lanza. */
  async function restaurar(
    motor: MotorSql,
    archivo: string,
    base: string,
    confirmarSobrescribir: boolean,
  ): Promise<OperacionBd> {
    const o = await correr('restaurar', motor, base, async () => ({
      resultado: await api().bd.restaurar(
        objetivo(motor) as MotorSql | IdInstancia,
        archivo,
        base,
        opciones(confirmarSobrescribir),
      ),
    }));
    if (o === operacion.value) void cargarBases(motor);
    return o;
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
    const o = await correr('importar', motor, destino, async () => ({
      resultado: await api().bd.importar(
        objetivo(motor) as MotorSql | IdInstancia,
        plano(origen),
        destino,
        opciones(confirmarSobrescribir),
      ),
    }));
    if (o === operacion.value) void cargarBases(motor);
    return o;
  }

  function respaldar(motor: MotorSql, base: string, carpeta: string | null): Promise<OperacionBd> {
    return correr('respaldar', motor, base, async () => ({
      archivo: (
        await api().bd.respaldar(
          objetivo(motor) as MotorSql | IdInstancia,
          base,
          carpeta ?? undefined,
        )
      ).archivo,
    }));
  }

  /** Carpeta real de respaldos (Documentos puede estar en OneDrive o redirigido). */
  async function cargarCarpetaRespaldos(): Promise<void> {
    if (carpetaRespaldos.value) return;
    try {
      carpetaRespaldos.value = await api().bd.carpetaRespaldos();
    } catch {
      // Se muestra la ruta por defecto como texto.
    }
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
    if (tareaPgvector.value) throw new Error(textos.bd.pgvector.enCurso);
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
    carpetaRespaldos,
    instancias,
    objetivo,
    elegirInstancia,
    enCurso,
    agregarLinea,
    limpiarLineas,
    cargarBases,
    restaurar,
    importar,
    respaldar,
    cargarCarpetaRespaldos,
    descartarOperacion,
    cargarPgvector,
    instalarBuildTools,
    compilarPgvector,
    iniciar,
    detener,
  };
});
