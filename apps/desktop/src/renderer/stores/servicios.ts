import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { EstadoServicio, ProgresoInstalacion, VersionDisponible } from '../../shared/api';
import { api } from '../api';

/** La interfaz solo ofrece estos hasta que se sumen los servicios nuevos de la Etapa A. */
export type ServicioInstalable = Extract<
  VersionDisponible['servicio'],
  'nginx' | 'php' | 'cloudflared'
>;

const claveProgreso = (p: Pick<ProgresoInstalacion, 'servicio' | 'version'>): string =>
  `${p.servicio}@${p.version}`;

/** nginx primero, luego PHP de la rama más nueva a la más vieja y el resto por nombre. */
function orden(a: EstadoServicio, b: EstadoServicio): number {
  const peso = (s: EstadoServicio): number =>
    s.id === 'nginx' ? 0 : s.id.startsWith('php-') ? 1 : 2;
  const d = peso(a) - peso(b);
  if (d !== 0) return d;
  return peso(a) === 1
    ? b.id.localeCompare(a.id, 'es', { numeric: true })
    : a.nombre.localeCompare(b.nombre, 'es');
}

export const useServicios = defineStore('servicios', () => {
  const porId = ref<Record<string, EstadoServicio>>({});
  const progreso = ref<Record<string, ProgresoInstalacion>>({});
  const instalados = ref<Record<string, string[]>>({});
  const cargado = ref(false);
  let bajas: (() => void)[] = [];

  const lista = computed(() => Object.values(porId.value).sort(orden));
  const encendidos = computed(() => lista.value.filter((s) => s.estado === 'encendido').length);

  function aplicar(estado: EstadoServicio): void {
    porId.value[estado.id] = estado;
  }

  /** Carga inicial: lo que ya llegó por evento es más nuevo y no se pisa. */
  function hidratar(estados: EstadoServicio[]): void {
    for (const s of estados) if (!porId.value[s.id]) porId.value[s.id] = s;
    cargado.value = true;
  }

  function marcarCargado(): void {
    cargado.value = true;
  }

  function aplicarProgreso(p: ProgresoInstalacion): void {
    progreso.value[claveProgreso(p)] = p;
    if (p.fase === 'listo') void cargarInstalados(p.servicio).catch(() => undefined);
  }

  function progresoDe(servicio: string): ProgresoInstalacion[] {
    return Object.values(progreso.value).filter((p) => p.servicio === servicio);
  }

  function olvidarProgreso(p: Pick<ProgresoInstalacion, 'servicio' | 'version'>): void {
    const copia = { ...progreso.value };
    delete copia[claveProgreso(p)];
    progreso.value = copia;
  }

  async function cargarInstalados(servicio: string): Promise<string[]> {
    const v = await api().instalador.instalados(servicio);
    instalados.value[servicio] = v;
    return v;
  }

  /** Se suscribe a los eventos una sola vez; nunca se pide refresco manual. */
  function iniciar(): void {
    if (bajas.length) return;
    bajas = [
      api().on('servicio:estado', aplicar),
      api().on('instalacion:progreso', aplicarProgreso),
    ];
  }

  function detener(): void {
    bajas.forEach((b) => b());
    bajas = [];
  }

  return {
    porId,
    progreso,
    instalados,
    cargado,
    lista,
    encendidos,
    aplicar,
    hidratar,
    marcarCargado,
    aplicarProgreso,
    progresoDe,
    olvidarProgreso,
    cargarInstalados,
    iniciar,
    detener,
  };
});
