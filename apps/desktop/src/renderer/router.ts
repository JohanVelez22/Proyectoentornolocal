import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import Inicio from './vistas/Inicio.vue';
import { PANTALLAS, REDIRECCIONES, RUTA_DESCONOCIDA, type SeccionNav } from './rutas';

export type { SeccionNav } from './rutas';

declare module 'vue-router' {
  interface RouteMeta {
    seccion?: SeccionNav;
  }
}

/** Vista de cada pantalla (se cargan al visitarlas, salvo Inicio). */
const VISTAS: Record<string, RouteRecordRaw['component']> = {
  inicio: Inicio,
  proyectos: () => import('./vistas/Proyectos.vue'),
  servicios: () => import('./vistas/Servicios.vue'),
  'servicios.versiones': () => import('./vistas/Servicios.vue'),
  'servicios.php': () => import('./vistas/Servicios.vue'),
  basesDeDatos: () => import('./vistas/BasesDeDatos.vue'),
  correo: () => import('./vistas/Correo.vue'),
  ia: () => import('./vistas/Ia.vue'),
  tuneles: () => import('./vistas/Tuneles.vue'),
  contenedores: () => import('./vistas/Contenedores.vue'),
  herramientas: () => import('./vistas/Herramientas.vue'),
  depuracion: () => import('./vistas/Depuracion.vue'),
  doctor: () => import('./vistas/Doctor.vue'),
  registros: () => import('./vistas/Registros.vue'),
  ajustes: () => import('./vistas/Ajustes.vue'),
};

const rutas: RouteRecordRaw[] = [
  ...PANTALLAS.map((p): RouteRecordRaw => ({
    path: p.path,
    name: p.name,
    component: VISTAS[p.name]!,
    meta: { seccion: p.seccion },
  })),
  ...REDIRECCIONES,
  RUTA_DESCONOCIDA,
];

/** Historial con hash: en producción la ventana carga un archivo local (file://). */
export const router = createRouter({ history: createWebHashHistory(), routes: rutas });
