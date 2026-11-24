import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  EstadoInstancia,
  IdInstancia,
  IdServicioDatos,
  PlanActualizar,
  RefRespaldoDatos,
  RespaldoDatos,
  ServicioVersiones,
  TablaVersiones,
} from '../../shared/api';
import { api } from '../api';
import { textos } from '../i18n';

/** Una fila de la tabla (la forma la da el núcleo). */
export type FilaVersion = TablaVersiones['ramas'][number]['versiones'][number];

/** Los 13 servicios con pestaña "Versiones", en el orden en que se muestran. */
export const SERVICIOS_CON_VERSIONES: readonly ServicioVersiones[] = [
  'php',
  'nginx',
  'mysql',
  'mariadb',
  'postgresql',
  'redis',
  'mongodb',
  'node',
  'python',
  'composer',
  'mailpit',
  'ollama',
  'cloudflared',
];

/** Servicios de datos con instancias (varias versiones encendidas, cada una en su puerto). */
const CON_INSTANCIAS = new Set<string>(['mysql', 'mariadb', 'postgresql', 'redis', 'mongodb']);

export function esServicioConVersiones(s: unknown): s is ServicioVersiones {
  return typeof s === 'string' && (SERVICIOS_CON_VERSIONES as readonly string[]).includes(s);
}

/** Todas las filas de la tabla (en orden: ramas de la más nueva a la más vieja). */
export function filasDe(t: TablaVersiones | null): FilaVersion[] {
  return t ? t.ramas.flatMap((r) => r.versiones) : [];
}

/** Rama de una versión dentro de la tabla. */
export function ramaDe(t: TablaVersiones, version: string): string | null {
  return t.ramas.find((r) => r.versiones.some((f) => f.version === version))?.rama ?? null;
}

/** ¿La fila lleva interruptor "Encender"? Node, Python, Composer y cloudflared no. */
export function conInterruptor(t: TablaVersiones, f: FilaVersion): boolean {
  if (t.interruptor === 'ninguno' || !f.instalada) return false;
  if (t.interruptor !== 'instancias') return true;
  // Servicios de datos: la versión de una instancia, o la primera de una rama sin instancia.
  if (f.instancia) return true;
  const rama = ramaDe(t, f.version);
  return !filasDe(t).some((x) => x.instancia && ramaDe(t, x.version) === rama);
}

/** Marca una sola predeterminada (la elegida); el resto deja de serlo. */
export function marcarPredeterminada(t: TablaVersiones, version: string): TablaVersiones {
  return {
    ...t,
    ramas: t.ramas.map((r) => ({
      ...r,
      versiones: r.versiones.map((f) => ({ ...f, predeterminada: f.version === version })),
    })),
  };
}

/**
 * Enciende o apaga una fila en la tabla local. Con `unica` (Nginx, Mailpit, Ollama) encender una
 * apaga las demás; con `ninguno` no hace nada.
 */
export function marcarEncendida(
  t: TablaVersiones,
  version: string,
  valor: boolean,
): TablaVersiones {
  if (t.interruptor === 'ninguno') return t;
  return {
    ...t,
    ramas: t.ramas.map((r) => ({
      ...r,
      versiones: r.versiones.map((f) => {
        if (f.version === version) return { ...f, encendida: valor };
        if (valor && t.interruptor === 'unica') return { ...f, encendida: false };
        return f;
      }),
    })),
  };
}

/** Origen del catálogo para la cabecera: en línea, caché de hace N h o lista sin conexión. */
export function origenCatalogo(
  t: Pick<TablaVersiones, 'origen' | 'fecha'>,
  ahora = Date.now(),
): { tipo: 'vivo' | 'cache' | 'fija'; horas: number } {
  if (t.origen === 'fija') return { tipo: 'fija', horas: 0 };
  const ms = t.fecha ? ahora - Date.parse(t.fecha) : 0;
  const horas = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 3_600_000) : 0;
  return { tipo: t.origen === 'cache' ? 'cache' : 'vivo', horas };
}

/**
 * Versión verificada (huella fuerte) que se puede ofrecer en lugar de una sin huella: la más
 * nueva de la misma rama (la lista fija trae SHA-256), o null.
 */
export function alternativaVerificada(t: TablaVersiones, version: string): string | null {
  const rama = ramaDe(t, version);
  const r = t.ramas.find((x) => x.rama === rama);
  return r?.versiones.find((f) => f.version !== version && f.huella === 'fuerte')?.version ?? null;
}

/** Acción que trae un aviso `version-nueva` (Task 17). */
export interface ArgsAvisoVersion {
  servicio: ServicioVersiones;
  version: string;
  instancia: IdInstancia | null;
  /** false = sin huella fuerte: solo se abre la pestaña (sin atajo de actualizar). */
  actualizar: boolean;
}

/** Lee la acción de un aviso sin confiar en su forma. */
export function argsDeAviso(args: unknown): ArgsAvisoVersion | null {
  const a = Array.isArray(args) ? (args[0] as Record<string, unknown> | undefined) : undefined;
  if (!a || typeof a !== 'object') return null;
  const servicio = a['servicio'];
  const version = a['version'];
  const instancia = a['instancia'];
  if (!esServicioConVersiones(servicio) || typeof version !== 'string') return null;
  if (!/^[0-9a-z][0-9a-z.+-]{0,39}$/.test(version)) return null;
  const inst =
    typeof instancia === 'string' && /^[a-z]+@[0-9a-z][0-9a-z.]{0,15}$/.test(instancia)
      ? (instancia as IdInstancia)
      : null;
  return { servicio, version, instancia: inst, actualizar: a['actualizar'] === true };
}

/** Diálogos de la pestaña: nada se actualiza ni se instala sin pasar por uno de ellos. */
export type DialogoVersiones =
  | {
      tipo: 'actualizar';
      servicio: ServicioVersiones;
      /** Instancia a actualizar (servicios de datos); null en el resto (se instala al lado). */
      instancia: IdInstancia | null;
      actual: string | null;
      nueva: string;
      sinHuella: boolean;
      plan: PlanActualizar | null;
    }
  | {
      tipo: 'nuevaRama';
      servicio: IdServicioDatos;
      nueva: string;
      sinHuella: boolean;
      /** Instancias de las que se puede copiar (las otras ramas). */
      origenes: IdInstancia[];
    }
  | { tipo: 'sinHuella'; servicio: ServicioVersiones; version: string; alternativa: string | null }
  | { tipo: 'desinstalar'; servicio: ServicioVersiones; fila: FilaVersion }
  | { tipo: 'desbloquear'; instancia: EstadoInstancia; respaldos: RespaldoDatos[] };

export const useVersiones = defineStore('versiones', () => {
  const servicio = ref<ServicioVersiones>('php');
  const tabla = ref<TablaVersiones | null>(null);
  const cargando = ref(false);
  const error = ref<string | null>(null);
  const rama = ref<string | null>(null);
  const todas = ref(false);
  const dialogo = ref<DialogoVersiones | null>(null);
  /** Versión resaltada (la que trajo un aviso). */
  const resaltada = ref<string | null>(null);
  const respaldos = ref<RespaldoDatos[]>([]);

  const filas = computed(() => filasDe(tabla.value));
  const conInstancias = computed(() => CON_INSTANCIAS.has(servicio.value));

  async function cargar(o: { refrescar?: boolean } = {}): Promise<void> {
    const s = servicio.value;
    cargando.value = true;
    try {
      const t = await api().catalogo.versiones(s, {
        ...(rama.value ? { rama: rama.value } : {}),
        ...(todas.value ? { todas: true } : {}),
        ...(o.refrescar ? { refrescar: true } : {}),
      });
      if (s !== servicio.value) return; // se cambió de servicio mientras llegaba
      tabla.value = t;
      error.value = null;
      if (CON_INSTANCIAS.has(s)) {
        respaldos.value = await api()
          .servicios.respaldosDatos(s as IdServicioDatos)
          .catch(() => []);
      } else respaldos.value = [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      cargando.value = false;
    }
  }

  function elegirServicio(s: ServicioVersiones): void {
    if (s === servicio.value) return;
    servicio.value = s;
    tabla.value = null;
    rama.value = null;
    resaltada.value = null;
    respaldos.value = [];
  }

  const fila = (version: string): FilaVersion | undefined =>
    filas.value.find((f) => f.version === version);

  /** Instalar: sin huella fuerte primero pasa por `DialogoSinHuella`. */
  async function pedirInstalar(version: string): Promise<void> {
    const f = fila(version);
    if (f && f.huella !== 'fuerte') {
      dialogo.value = {
        tipo: 'sinHuella',
        servicio: servicio.value,
        version,
        alternativa: tabla.value ? alternativaVerificada(tabla.value, version) : null,
      };
      return;
    }
    await instalar(version, false);
  }

  /** Solo `DialogoSinHuella` pasa `confirmarSinHuella = true` (con la casilla marcada). */
  async function instalar(version: string, confirmarSinHuella: boolean): Promise<void> {
    await api().instalador.instalar({
      servicio: servicio.value,
      version,
      ...(confirmarSinHuella ? { confirmarSinHuella: true as const } : {}),
    });
    await cargar();
  }

  function pedirDesinstalar(version: string): void {
    const f = fila(version);
    if (f) dialogo.value = { tipo: 'desinstalar', servicio: servicio.value, fila: f };
  }

  /**
   * Desinstala solo el binario. Si una instancia (que no es la única) usa esa versión, primero
   * la saca de la lista (sus datos quedan). Nunca borra datos: eso es `borrarDatos`, aparte.
   */
  async function desinstalar(f: FilaVersion): Promise<void> {
    // `quitar` valida antes (la última instancia no se quita) y recién entonces la detiene:
    // así nunca queda apagada una instancia que no se pudo quitar.
    if (f.instancia) await api().instancias.quitar(f.instancia);
    await api().instalador.desinstalar(servicio.value, f.version);
  }

  /** Borra los datos de una instancia; la confirmación escrita la compara el núcleo con el id. */
  async function borrarDatos(id: IdInstancia, confirmacion: string): Promise<void> {
    await api().instancias.borrarDatos(id, confirmacion);
  }

  /** Enciende o apaga una fila según el tipo de interruptor del servicio. */
  async function encender(version: string, valor: boolean): Promise<void> {
    const t = tabla.value;
    const f = fila(version);
    if (!t || !f || !conInterruptor(t, f)) return;
    const s = servicio.value;
    if (t.interruptor === 'instancias') {
      let id = f.instancia;
      if (!id) {
        if (!valor) return;
        id = await api().instancias.crear(s as IdServicioDatos, version);
      }
      await (valor ? api().instancias.iniciar(id) : api().instancias.detener(id));
    } else if (t.interruptor === 'pool') {
      const r = ramaDe(t, version);
      if (!r) return;
      await (valor ? api().servicios.iniciar(`php-${r}`) : api().servicios.detener(`php-${r}`));
    } else {
      // Una sola encendida: encender otra versión la deja como activa (y reinicia si corría).
      if (valor && !f.predeterminada) await api().servicios.predeterminada(s, version);
      await (valor ? api().servicios.iniciar(s) : api().servicios.detener(s));
    }
    tabla.value = marcarEncendida(t, version, valor);
    if (valor && t.interruptor === 'unica')
      tabla.value = marcarPredeterminada(tabla.value, version);
    void cargar().catch(() => undefined);
  }

  /** Estrella: una sola predeterminada por servicio. */
  async function predeterminar(version: string): Promise<void> {
    const t = tabla.value;
    const f = fila(version);
    if (!t || !f || !f.instalada) return;
    if (t.interruptor === 'instancias') {
      if (!f.instancia) return;
      await api().instancias.predeterminar(f.instancia);
    } else {
      await api().servicios.predeterminada(servicio.value, version);
    }
    tabla.value = marcarPredeterminada(t, version);
  }

  /** Devuelve los proyectos cuyo `.env` todavía usa el puerto anterior (para avisar). */
  async function cambiarPuerto(id: IdInstancia, puerto: number): Promise<string[]> {
    const r = await api().instancias.puerto(id, puerto);
    await cargar();
    return r?.proyectos ?? [];
  }

  /**
   * Abre `DialogoActualizar` (nunca actualiza por su cuenta). En los servicios de datos, con la
   * instancia: carga el plan (tamaño de los datos y espacio libre) para mostrarlo.
   */
  async function abrirActualizar(nueva: string, instancia: IdInstancia | null): Promise<void> {
    const s = servicio.value;
    const destino = fila(nueva);
    const actual =
      (instancia
        ? tabla.value?.instancias.find((i) => i.id === instancia)?.version
        : filas.value.find((f) => f.instalada && f.actualizacion === nueva)?.version) ?? null;
    const plan = instancia
      ? await api()
          .servicios.planActualizar(instancia)
          .catch(() => null)
      : null;
    dialogo.value = {
      tipo: 'actualizar',
      servicio: s,
      instancia,
      actual,
      nueva,
      sinHuella: !!destino && destino.huella !== 'fuerte',
      plan,
    };
  }

  /** Rama nueva de un servicio de datos = instancia nueva (con copia opcional). */
  function abrirNuevaRama(nueva: string): void {
    const s = servicio.value;
    if (!CON_INSTANCIAS.has(s)) return;
    const destino = fila(nueva);
    dialogo.value = {
      tipo: 'nuevaRama',
      servicio: s as IdServicioDatos,
      nueva,
      sinHuella: !!destino && destino.huella !== 'fuerte',
      origenes: (tabla.value?.instancias ?? []).map((i) => i.id),
    };
  }

  /**
   * "Actualizar" de un aviso: abre la pestaña del servicio y, si el aviso lo ofrece, el diálogo
   * correspondiente. Nunca llama a `servicios.actualizar` (eso solo pasa al confirmar el diálogo).
   */
  async function abrirDesdeAviso(a: ArgsAvisoVersion): Promise<void> {
    elegirServicio(a.servicio);
    resaltada.value = a.version;
    await cargar().catch(() => undefined);
    if (!a.actualizar) return;
    if (CON_INSTANCIAS.has(a.servicio)) {
      if (a.instancia) await abrirActualizar(a.version, a.instancia);
      else abrirNuevaRama(a.version);
    } else {
      await abrirActualizar(a.version, null);
    }
  }

  /** Confirmación de `DialogoActualizar`: aquí, y solo aquí, se actualiza. */
  async function confirmarActualizar(confirmarSinHuella: boolean): Promise<void> {
    const d = dialogo.value;
    if (d?.tipo !== 'actualizar') return;
    if (d.sinHuella && !confirmarSinHuella)
      throw new Error(textos.versiones.dialogoSinHuella.casilla);
    const o = confirmarSinHuella ? { confirmarSinHuella: true as const } : {};
    if (d.instancia) await api().servicios.actualizar(d.instancia, d.nueva, o);
    else {
      await api().instalador.instalar({ servicio: d.servicio, version: d.nueva, ...o });
    }
    dialogo.value = null;
    await cargar();
  }

  async function confirmarNuevaRama(
    copiarDesde: IdInstancia | null,
    confirmarSinHuella: boolean,
  ): ReturnType<ReturnType<typeof api>['servicios']['nuevaRama']> {
    const d = dialogo.value;
    if (d?.tipo !== 'nuevaRama') throw new Error('No hay una rama nueva pendiente.');
    if (d.sinHuella && !confirmarSinHuella)
      throw new Error(textos.versiones.dialogoSinHuella.casilla);
    const r = await api().servicios.nuevaRama(d.servicio, d.nueva, {
      ...(copiarDesde ? { copiarDesde } : {}),
      ...(confirmarSinHuella ? { confirmarSinHuella: true as const } : {}),
    });
    dialogo.value = null;
    await cargar();
    return r;
  }

  async function abrirDesbloquear(id: IdInstancia): Promise<void> {
    const inst = tabla.value?.instancias.find((i) => i.id === id);
    if (!inst) return;
    const lista = await api()
      .servicios.respaldosDatos(inst.servicio)
      .catch(() => [] as RespaldoDatos[]);
    dialogo.value = {
      tipo: 'desbloquear',
      instancia: inst,
      respaldos: lista.filter((r) => r.clave === inst.clave && r.tipo === 'respaldo'),
    };
  }

  async function desbloquear(
    id: IdInstancia,
    o: { confirmacion: string; respaldo?: string },
  ): Promise<void> {
    await api().instancias.desbloquear(id, o);
    dialogo.value = null;
    await cargar();
  }

  /** Borra una copia de datos (respaldo, volcados, carpeta fallida): siempre tras confirmar. */
  async function borrarRespaldo(r: RefRespaldoDatos): Promise<void> {
    await api().servicios.borrarRespaldoDatos(r, true);
    respaldos.value = respaldos.value.filter(
      (x) => !(x.clave === r.clave && x.tipo === r.tipo && x.sello === r.sello),
    );
  }

  function cerrarDialogo(): void {
    dialogo.value = null;
  }

  return {
    servicio,
    tabla,
    cargando,
    error,
    rama,
    todas,
    dialogo,
    resaltada,
    respaldos,
    filas,
    conInstancias,
    cargar,
    elegirServicio,
    pedirInstalar,
    instalar,
    pedirDesinstalar,
    desinstalar,
    borrarDatos,
    encender,
    predeterminar,
    cambiarPuerto,
    abrirActualizar,
    abrirNuevaRama,
    abrirDesdeAviso,
    confirmarActualizar,
    confirmarNuevaRama,
    abrirDesbloquear,
    desbloquear,
    borrarRespaldo,
    cerrarDialogo,
  };
});
