import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import type { Textos } from './i18n/es';
import Inicio from './vistas/Inicio.vue';

export type SeccionNav = Exclude<keyof Textos['nav'], 'contraer' | 'expandir'>;

declare module 'vue-router' {
  interface RouteMeta {
    seccion?: SeccionNav;
  }
}

const rutas: RouteRecordRaw[] = [
  { path: '/', name: 'inicio', component: Inicio, meta: { seccion: 'inicio' } },
  {
    path: '/sitios',
    name: 'sitios',
    component: () => import('./vistas/Sitios.vue'),
    meta: { seccion: 'sitios' },
  },
  {
    path: '/servicios',
    name: 'servicios',
    component: () => import('./vistas/Servicios.vue'),
    meta: { seccion: 'servicios' },
  },
  {
    path: '/bases-de-datos',
    name: 'basesDeDatos',
    component: () => import('./vistas/BasesDeDatos.vue'),
    meta: { seccion: 'basesDeDatos' },
  },
  {
    path: '/correo',
    name: 'correo',
    component: () => import('./vistas/Correo.vue'),
    meta: { seccion: 'correo' },
  },
  {
    path: '/ia-local',
    name: 'iaLocal',
    component: () => import('./vistas/IaLocal.vue'),
    meta: { seccion: 'iaLocal' },
  },
  {
    path: '/tuneles',
    name: 'tuneles',
    component: () => import('./vistas/Tuneles.vue'),
    meta: { seccion: 'tuneles' },
  },
  {
    path: '/ajustes',
    name: 'ajustes',
    component: () => import('./vistas/Ajustes.vue'),
    meta: { seccion: 'ajustes' },
  },
  { path: '/:resto(.*)*', redirect: '/' },
];

/** Historial con hash: en producción la ventana carga un archivo local (file://). */
export const router = createRouter({ history: createWebHashHistory(), routes: rutas });
