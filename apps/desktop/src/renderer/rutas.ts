import type { RouteRecordRaw, RouteRecordRedirectOption } from 'vue-router';
import type { Textos } from './i18n';

/** Pantallas de la barra lateral (y de la paleta de comandos). */
export type SeccionNav = Exclude<keyof Textos['nav'], 'contraer' | 'expandir'>;

/** Pestañas de la pantalla IA (la ruta `/ia/:pestana?`). */
export const PESTANAS_IA = ['agentes', 'conectar', 'nube', 'local'] as const;
export type PestanaIa = (typeof PESTANAS_IA)[number];

export interface PantallaRuta {
  path: string;
  name: string;
  seccion: SeccionNav;
}

/**
 * Pantallas reales de la aplicación. El router les pone su vista; las pruebas las usan con vistas
 * vacías, así que lo que se prueba es la misma tabla de rutas.
 */
export const PANTALLAS: readonly PantallaRuta[] = [
  { path: '/', name: 'inicio', seccion: 'inicio' },
  { path: '/proyectos', name: 'proyectos', seccion: 'proyectos' },
  { path: '/servicios', name: 'servicios', seccion: 'servicios' },
  // Pestaña "Versiones" de un servicio (el nombre coincide con la acción de los avisos).
  { path: '/servicios/versiones/:servicio?', name: 'servicios.versiones', seccion: 'servicios' },
  // Pestaña "PHP" de Servicios (era la pantalla PHP de la barra lateral).
  { path: '/servicios/php', name: 'servicios.php', seccion: 'servicios' },
  { path: '/bases-de-datos', name: 'basesDeDatos', seccion: 'basesDeDatos' },
  { path: '/correo', name: 'correo', seccion: 'correo' },
  // IA con cuatro pestañas: Agentes, Conectar asistentes, Nube y Modelos locales (sin pestaña, la primera).
  { path: `/ia/:pestana(${PESTANAS_IA.join('|')})?`, name: 'ia', seccion: 'ia' },
  { path: '/tuneles', name: 'tuneles', seccion: 'tuneles' },
  // Oculta en la barra lateral salvo con «Mostrar secciones avanzadas»; la ruta y la paleta siguen.
  { path: '/contenedores', name: 'contenedores', seccion: 'contenedores' },
  { path: '/herramientas', name: 'herramientas', seccion: 'herramientas' },
  { path: '/depuracion', name: 'depuracion', seccion: 'depuracion' },
  { path: '/doctor', name: 'doctor', seccion: 'doctor' },
  { path: '/registros', name: 'registros', seccion: 'registros' },
  { path: '/ajustes', name: 'ajustes', seccion: 'ajustes' },
];

/** Destino fijo que conserva los parámetros de consulta (`?foco=`, `?sitio=`) y el ancla. */
function conservando(
  destino: { path: string } | { name: string; params?: Record<string, string> },
): RouteRecordRedirectOption {
  return (to) => ({ ...destino, query: to.query, hash: to.hash });
}

/** Destino de la pantalla IA, con su pestaña. */
export const destinoIa = (pestana?: PestanaIa): { name: 'ia'; params?: { pestana: PestanaIa } } =>
  pestana ? { name: 'ia', params: { pestana } } : { name: 'ia' };

/** Rutas que ya no existen como pantalla: los enlaces viejos siguen funcionando. */
export const REDIRECCIONES: RouteRecordRaw[] = [
  // La pantalla se llamaba "Sitios".
  { path: '/sitios', redirect: conservando({ path: '/proyectos' }) },
  // PHP pasó a ser una pestaña de Servicios.
  { path: '/php', redirect: conservando({ name: 'servicios.php' }) },
  // Agentes se fusionó dentro de IA.
  { path: '/agentes', redirect: conservando(destinoIa('agentes')) },
  // La pantalla se llamaba "IA local".
  { path: '/ia-local', redirect: conservando(destinoIa('local')) },
];

/** Cualquier otra ruta lleva a Inicio. */
export const RUTA_DESCONOCIDA: RouteRecordRaw = { path: '/:resto(.*)*', redirect: '/' };
