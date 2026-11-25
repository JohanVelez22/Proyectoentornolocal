import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  EstadoServicio,
  IdServicioDatos,
  ProgresoInstalacion,
  VersionDisponible,
} from '../../shared/api';
import { api } from '../api';

/** Todo lo que la interfaz sabe instalar (Composer y Adminer tienen su propia tarjeta). */
export type ServicioInstalable = Exclude<VersionDisponible['servicio'], 'pgvector-src'>;

/** Los que se instalan eligiendo una versión del catálogo (sección "Instalar"). */
export const INSTALABLES_CATALOGO = [
  'nginx',
  'php',
  'cloudflared',
  'mysql',
  'mariadb',
  'postgresql',
  'redis',
  'mongodb',
  'mongosh',
  'mailpit',
  'smtp4dev',
  'inbucket',
  'papercut',
  'ollama',
] as const satisfies readonly ServicioInstalable[];
export type InstalableCatalogo = (typeof INSTALABLES_CATALOGO)[number];

/** Progreso que no es de esta pantalla (las Build Tools de pgvector van en Bases de datos). */
const PROGRESO_AJENO = new Set(['buildtools']);

/** Servicios propios con puerto configurable, datos y arranque automático. */
export const IDS_DATOS: readonly IdServicioDatos[] = [
  'mysql',
  'mariadb',
  'postgresql',
  'redis',
  'mongodb',
  'mailpit',
  'smtp4dev',
  'inbucket',
  'papercut',
  'ollama',
];

/** Captadores de correo locales (D21): se agrupan en Correo y nunca corren dos a la vez. */
export const CAPTADORES_CORREO: ReadonlySet<string> = new Set([
  'mailpit',
  'smtp4dev',
  'inbucket',
  'papercut',
]);

export function esServicioDatos(id: string): id is IdServicioDatos {
  return (IDS_DATOS as readonly string[]).includes(id);
}

/** Grupos de la pantalla Servicios, en el orden en que se muestran. */
export const CATEGORIAS = ['web', 'php', 'bd', 'correo', 'ia', 'herramientas'] as const;
export type CategoriaUi = (typeof CATEGORIAS)[number];

export function categoriaDe(s: Pick<EstadoServicio, 'id' | 'categoria'>): CategoriaUi {
  if (CAPTADORES_CORREO.has(s.id)) return 'correo';
  switch (s.categoria) {
    case 'web':
    case 'php':
    case 'bd':
    case 'ia':
      return s.categoria;
    case 'herramienta':
      return 'herramientas';
    default:
      return s.id === 'nginx' ? 'web' : s.id.startsWith('php-') ? 'php' : 'herramientas';
  }
}

/**
 * Puerto alternativo que propone el núcleo cuando el puerto está ocupado por otro programa
 * ("El puerto 3306 lo usa mysqld.exe (PID 42). Use el puerto 3308.").
 */
export function puertoAlternativo(mensaje: string | undefined): number | null {
  const m = mensaje?.match(/Use el puerto (\d{2,5})\./);
  if (!m) return null;
  const p = Number(m[1]);
  return p >= 1024 && p <= 65535 ? p : null;
}

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

export interface GrupoServicios {
  categoria: CategoriaUi;
  servicios: EstadoServicio[];
}

export const useServicios = defineStore('servicios', () => {
  const porId = ref<Record<string, EstadoServicio>>({});
  const progreso = ref<Record<string, ProgresoInstalacion>>({});
  const instalados = ref<Record<string, string[]>>({});
  const cargado = ref(false);
  /** Preferencias leídas de la configuración (null hasta cargarlas). */
  const autoIniciar = ref<Partial<Record<IdServicioDatos, boolean>> | null>(null);
  const redLocalFtp = ref<boolean | null>(null);
  let bajas: (() => void)[] = [];

  const lista = computed(() => Object.values(porId.value).sort(orden));
  const encendidos = computed(() => lista.value.filter((s) => s.estado === 'encendido').length);

  /** Solo los grupos con servicios, en el orden de `CATEGORIAS`. */
  /**
   * Nginx aparece siempre en los estados del núcleo, aunque no esté instalado: en ese caso (y si
   * no está en marcha por fuera) se oculta. El resto solo llega si está instalado (o es externo).
   */
  const nginxSinInstalar = computed(() => instalados.value['nginx']?.length === 0);
  // Los procesos de proyecto (categoría 'proyecto') llegan por el mismo evento, pero se muestran
  // en su proyecto y en Inicio, no en la pantalla Servicios.
  const visibles = computed(() =>
    lista.value.filter(
      (s) =>
        s.categoria !== 'proyecto' &&
        !(s.id === 'nginx' && nginxSinInstalar.value && s.estado === 'apagado'),
    ),
  );
  /** Ningún servicio propio instalado (los externos y el FTP integrado no cuentan). */
  const nadaInstalado = computed(
    () =>
      nginxSinInstalar.value &&
      !visibles.value.some((s) => s.estado !== 'externo' && s.id !== 'ftp'),
  );

  const grupos = computed<GrupoServicios[]>(() =>
    CATEGORIAS.map((categoria) => ({
      categoria,
      servicios: visibles.value.filter((s) => categoriaDe(s) === categoria),
    })).filter((g) => g.servicios.length > 0),
  );

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
    if (PROGRESO_AJENO.has(p.servicio)) return;
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

  /** Lee de la configuración el arranque automático de cada servicio y la red local del FTP. */
  async function cargarPreferencias(): Promise<void> {
    const c = await api().config.leer();
    autoIniciar.value = Object.fromEntries(
      IDS_DATOS.map((id) => [id, c.servicios.datos[id].autoIniciar]),
    );
    redLocalFtp.value = c.ftp.redLocal;
  }

  /** Cambio optimista: si el núcleo lo rechaza se vuelve al valor anterior y se relanza. */
  async function cambiarAutoIniciar(id: IdServicioDatos, valor: boolean): Promise<void> {
    const antes = autoIniciar.value?.[id] ?? false;
    autoIniciar.value = { ...autoIniciar.value, [id]: valor };
    try {
      await api().servicios.autoIniciar(id, valor);
    } catch (e) {
      autoIniciar.value = { ...autoIniciar.value, [id]: antes };
      throw e;
    }
  }

  async function cambiarRedLocal(valor: boolean): Promise<void> {
    const antes = redLocalFtp.value;
    redLocalFtp.value = valor;
    try {
      await api().ftp.redLocal(valor);
    } catch (e) {
      redLocalFtp.value = antes;
      throw e;
    }
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
    autoIniciar,
    redLocalFtp,
    lista,
    visibles,
    nadaInstalado,
    grupos,
    encendidos,
    aplicar,
    hidratar,
    marcarCargado,
    aplicarProgreso,
    progresoDe,
    olvidarProgreso,
    cargarInstalados,
    cargarPreferencias,
    cambiarAutoIniciar,
    cambiarRedLocal,
    iniciar,
    detener,
  };
});
