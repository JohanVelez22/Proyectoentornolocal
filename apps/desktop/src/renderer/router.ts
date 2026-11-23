import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import type { Textos } from './i18n';
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
    path: '/proyectos',
    name: 'proyectos',
    component: () => import('./vistas/Proyectos.vue'),
    meta: { seccion: 'proyectos' },
  },
  // La pantalla se llamaba "Sitios": los enlaces viejos siguen funcionando.
  { path: '/sitios', redirect: '/proyectos' },
  {
    path: '/agentes',
    name: 'agentes',
    component: () => import('./vistas/Agentes.vue'),
    meta: { seccion: 'agentes' },
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
    path: '/php',
    name: 'php',
    component: () => import('./vistas/Php.vue'),
    meta: { seccion: 'php' },
  },
  {
    path: '/ia',
    name: 'ia',
    component: () => import('./vistas/Ia.vue'),
    meta: { seccion: 'ia' },
  },
  // La pantalla se llamaba "IA local": los enlaces viejos siguen funcionando.
  { path: '/ia-local', redirect: '/ia' },
  {
    path: '/tuneles',
    name: 'tuneles',
    component: () => import('./vistas/Tuneles.vue'),
    meta: { seccion: 'tuneles' },
  },
  {
    path: '/contenedores',
    name: 'contenedores',
    component: () => import('./vistas/Contenedores.vue'),
    meta: { seccion: 'contenedores' },
  },
  {
    path: '/herramientas',
    name: 'herramientas',
    component: () => import('./vistas/Herramientas.vue'),
    meta: { seccion: 'herramientas' },
  },
  {
    path: '/depuracion',
    name: 'depuracion',
    component: () => import('./vistas/Depuracion.vue'),
    meta: { seccion: 'depuracion' },
  },
  {
    path: '/doctor',
    name: 'doctor',
    component: () => import('./vistas/Doctor.vue'),
    meta: { seccion: 'doctor' },
  },
  {
    path: '/registros',
    name: 'registros',
    component: () => import('./vistas/Registros.vue'),
    meta: { seccion: 'registros' },
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
