import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  DisponibilidadGit,
  EstadoReceta,
  OpcionesRecetaIpc,
  PasoReceta,
  ProgresoReceta,
  RepoGithub,
  ResultadoReceta,
  SugerenciaProyecto,
} from '../../shared/api';
import { api, plano } from '../api';
import {
  aplicarProgreso,
  claveRuta,
  conexionGithub,
  marcarClonados,
  recetaVacia,
  sugerenciasVisibles,
  unirRepos,
} from '../utilidades/proyectos';
import { useSitios } from './sitios';

/** Máximo de líneas de progreso de un clon que se guardan. */
const MAX_LINEAS_CLON = 200;
/** Repos por página que devuelve el núcleo. */
export const REPOS_POR_PAGINA = 50;

/**
 * Proyectos: recetas en curso (por eventos `receta:progreso`), progreso de clones, conexión con
 * GitHub y sugerencias de la carpeta vigilada. El token de GitHub nunca pasa por aquí: el
 * componente lo envía directo a `github.guardarToken` y lo olvida.
 */
export const useProyectos = defineStore('proyectos', () => {
  const sitios = useSitios();

  /* ───── Recetas ───── */

  const recetas = ref<Record<string, EstadoReceta>>({});
  const refrescos = new Map<string, Promise<void>>();

  function receta(sitioId: string): EstadoReceta {
    return recetas.value[sitioId] ?? recetaVacia(sitioId);
  }

  async function cargarReceta(sitioId: string): Promise<EstadoReceta> {
    const e = await api().proyectos.estadoReceta(sitioId);
    recetas.value = { ...recetas.value, [sitioId]: e };
    return e;
  }

  /** Pide el estado completo una sola vez aunque lleguen varios eventos seguidos. */
  function refrescar(sitioId: string): void {
    if (refrescos.has(sitioId)) return;
    const p = cargarReceta(sitioId)
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => refrescos.delete(sitioId));
    refrescos.set(sitioId, p);
  }

  function alProgreso(p: ProgresoReceta): void {
    if (p.suelta) {
      const previa = sueltas.value[p.sitioId];
      if (!previa) return;
      const r = aplicarProgreso(previa, p);
      if (!r.desconocido) sueltas.value = { ...sueltas.value, [p.sitioId]: r.estado };
      return;
    }
    const r = aplicarProgreso(receta(p.sitioId), p);
    if (r.desconocido) {
      refrescar(p.sitioId);
      return;
    }
    recetas.value = { ...recetas.value, [p.sitioId]: r.estado };
  }

  function marcarCorriendo(sitioId: string): void {
    recetas.value = { ...recetas.value, [sitioId]: { ...receta(sitioId), estado: 'corriendo' } };
  }

  /** Al terminar se toma el estado del núcleo (el que quedó guardado). */
  async function terminar(sitioId: string, r: Promise<ResultadoReceta>) {
    try {
      return await r;
    } finally {
      await cargarReceta(sitioId).catch(() => undefined);
    }
  }

  /** Ejecuta la receta (con la editada en el asistente, si se pasa). */
  function ejecutar(sitioId: string, opciones?: OpcionesRecetaIpc): Promise<ResultadoReceta> {
    marcarCorriendo(sitioId);
    const o = opciones ? plano(opciones) : undefined;
    return terminar(sitioId, api().proyectos.ejecutarReceta(sitioId, o));
  }

  /** "Reinstalar dependencias": repite la receta guardada (sin restaurar respaldos). */
  function reinstalar(sitioId: string): Promise<ResultadoReceta> {
    return ejecutar(sitioId, { guardada: true });
  }

  /* ───── Corridas sueltas (pasos sugeridos tras traer cambios) ───── */

  const sueltas = ref<Record<string, EstadoReceta>>({});
  const suelta = (sitioId: string): EstadoReceta | undefined => sueltas.value[sitioId];

  /** Corre pasos sin reemplazar la receta guardada; su progreso queda aparte. */
  async function ejecutarSuelta(sitioId: string, pasos: PasoReceta[]): Promise<ResultadoReceta> {
    const receta = plano(pasos);
    sueltas.value = {
      ...sueltas.value,
      [sitioId]: {
        sitioId,
        estado: 'corriendo',
        actualizado: null,
        pasos: receta.map((p) => ({ ...p, estado: 'pendiente' as const, log: [] })),
      },
    };
    const fijar = (estado: EstadoReceta['estado']): void => {
      const e = sueltas.value[sitioId];
      if (e) sueltas.value = { ...sueltas.value, [sitioId]: { ...e, estado } };
    };
    try {
      const r = await api().proyectos.ejecutarReceta(sitioId, { receta, suelta: true });
      fijar(r.estado);
      return r;
    } catch (e) {
      fijar('error');
      throw e;
    }
  }

  /** Reintentar: sigue desde el paso que falló con la receta guardada de la última corrida. */
  function reintentar(sitioId: string, pasoId: string): Promise<ResultadoReceta> {
    marcarCorriendo(sitioId);
    return terminar(sitioId, api().proyectos.ejecutarReceta(sitioId, { desde: pasoId }));
  }

  /** Corre solo ese paso (los demás conservan su estado). */
  function correrPaso(sitioId: string, pasoId: string): Promise<ResultadoReceta> {
    marcarCorriendo(sitioId);
    return terminar(sitioId, api().proyectos.ejecutarReceta(sitioId, { soloPaso: pasoId }));
  }

  function omitir(sitioId: string, pasoId: string): Promise<ResultadoReceta> {
    marcarCorriendo(sitioId);
    return terminar(sitioId, api().proyectos.omitirPaso(sitioId, pasoId));
  }

  function cancelar(sitioId: string): Promise<boolean> {
    return api().proyectos.cancelarReceta(sitioId);
  }

  /* ───── Clones ───── */

  const clones = ref<Record<string, string[]>>({});

  function alProgresoGit(d: { destino: string; linea: string }): void {
    const k = claveRuta(d.destino);
    const lineas = [...(clones.value[k] ?? []), d.linea].slice(-MAX_LINEAS_CLON);
    clones.value = { ...clones.value, [k]: lineas };
  }

  const lineasClon = (destino: string): string[] => clones.value[claveRuta(destino)] ?? [];

  function olvidarClon(destino: string): void {
    const copia = { ...clones.value };
    delete copia[claveRuta(destino)];
    clones.value = copia;
  }

  /* ───── GitHub ───── */

  const disponibilidad = ref<DisponibilidadGit | null>(null);
  const hayToken = ref(false);
  const conexion = computed(() =>
    conexionGithub({
      ghSesion: disponibilidad.value?.ghSesion === true,
      hayToken: hayToken.value,
    }),
  );

  async function cargarConexion(): Promise<void> {
    const [d, t] = await Promise.all([api().git.disponible(), api().github.hayToken()]);
    disponibilidad.value = d;
    hayToken.value = t;
  }

  const repos = ref<RepoGithub[]>([]);
  const paginaRepos = ref(0);
  const hayMasRepos = ref(false);
  const buscarRepos = ref('');

  /** Primera página (o la siguiente con `mas`) de la búsqueda actual. */
  async function cargarRepos(buscar = buscarRepos.value, mas = false): Promise<void> {
    if (!mas) buscarRepos.value = buscar;
    const pagina = mas ? paginaRepos.value + 1 : 1;
    const q = buscar.trim();
    const lista = await api().github.repos({ ...(q ? { buscar: q } : {}), pagina });
    // Si mientras tanto cambió la búsqueda, esta respuesta ya no sirve.
    if (buscar !== buscarRepos.value) return;
    repos.value = mas ? unirRepos(repos.value, lista) : lista;
    paginaRepos.value = pagina;
    hayMasRepos.value = lista.length >= REPOS_POR_PAGINA;
  }

  /** Carpeta donde se clonan por defecto (la vigilada, si hay). */
  const carpetaProyectos = ref<string | null>(null);

  async function cargarCarpeta(): Promise<void> {
    const c = await api().config.leer();
    carpetaProyectos.value = c.proyectos.carpetaVigilada ?? null;
  }

  const reposMarcados = computed(() =>
    marcarClonados(repos.value, sitios.lista, carpetaProyectos.value),
  );

  /* ───── Sugerencias de la carpeta vigilada ───── */

  const sugerencias = ref<SugerenciaProyecto[]>([]);
  const descartadas = ref<Set<string>>(new Set());

  const sugerenciasPendientes = computed(() =>
    sugerenciasVisibles(sugerencias.value, sitios.lista, descartadas.value),
  );

  async function cargarSugerencias(): Promise<void> {
    sugerencias.value = await api().vigilar.sugerencias();
  }

  function descartar(carpeta: string): void {
    descartadas.value = new Set([...descartadas.value, claveRuta(carpeta)]);
  }

  async function cambiarCarpetaVigilada(carpeta: string | null): Promise<void> {
    await api().vigilar.cambiarCarpeta(carpeta);
    carpetaProyectos.value = carpeta;
    if (carpeta === null) sugerencias.value = [];
    else await cargarSugerencias().catch(() => undefined);
  }

  /* ───── Eventos ───── */

  let bajas: (() => void)[] = [];

  function iniciar(): void {
    if (bajas.length) return;
    bajas = [
      api().on('receta:progreso', alProgreso),
      api().on('git:progreso', alProgresoGit),
      api().on('proyectos:sugerencias', (l) => {
        sugerencias.value = l;
      }),
    ];
  }

  function detener(): void {
    bajas.forEach((b) => b());
    bajas = [];
  }

  return {
    recetas,
    receta,
    cargarReceta,
    alProgreso,
    ejecutar,
    reinstalar,
    suelta,
    ejecutarSuelta,
    reintentar,
    correrPaso,
    omitir,
    cancelar,
    clones,
    lineasClon,
    olvidarClon,
    alProgresoGit,
    disponibilidad,
    hayToken,
    conexion,
    cargarConexion,
    repos,
    reposMarcados,
    hayMasRepos,
    buscarRepos,
    cargarRepos,
    carpetaProyectos,
    cargarCarpeta,
    sugerencias,
    sugerenciasPendientes,
    cargarSugerencias,
    descartar,
    cambiarCarpetaVigilada,
    iniciar,
    detener,
  };
});
