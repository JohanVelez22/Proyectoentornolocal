import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router';
import { describe, expect, it } from 'vitest';
import {
  ACCESOS_NAV,
  GRUPOS_NAV,
  SECCIONES_AVANZADAS,
  SECCIONES_NAV,
  gruposVisibles,
} from '../src/renderer/navegacion';
import { PANTALLAS, REDIRECCIONES, RUTA_DESCONOCIDA } from '../src/renderer/rutas';
import { diccionarios } from '../src/renderer/i18n';

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');

/** El router real (la misma tabla de rutas) con vistas vacías y sin navegador. */
function crearRouter() {
  const vacia = { render: () => null };
  const rutas: RouteRecordRaw[] = [
    ...PANTALLAS.map((p): RouteRecordRaw => ({
      path: p.path,
      name: p.name,
      component: vacia,
      meta: { seccion: p.seccion },
    })),
    ...REDIRECCIONES,
    RUTA_DESCONOCIDA,
  ];
  return createRouter({ history: createMemoryHistory(), routes: rutas });
}

async function ir(destino: Parameters<ReturnType<typeof crearRouter>['push']>[0]) {
  const r = crearRouter();
  await r.push(destino);
  return r.currentRoute.value;
}

describe('redirecciones de rutas viejas (D38a)', () => {
  it('/sitios → /proyectos', async () => {
    const ruta = await ir('/sitios');
    expect(ruta.name).toBe('proyectos');
    expect(ruta.fullPath).toBe('/proyectos');
  });

  it('/php → Servicios › PHP, con sus parámetros', async () => {
    const ruta = await ir('/php?foco=algo');
    expect(ruta.name).toBe('servicios.php');
    expect(ruta.path).toBe('/servicios/php');
    expect(ruta.query).toEqual({ foco: 'algo' });
    expect(ruta.meta.seccion).toBe('servicios');
  });

  it('/agentes → IA › Agentes, y conserva ?sitio=', async () => {
    const ruta = await ir('/agentes?sitio=mi-proyecto');
    expect(ruta.name).toBe('ia');
    expect(ruta.params['pestana']).toBe('agentes');
    expect(ruta.path).toBe('/ia/agentes');
    expect(ruta.query).toEqual({ sitio: 'mi-proyecto' });
    expect(ruta.meta.seccion).toBe('ia');
  });

  it('/ia-local → IA › Modelos locales', async () => {
    const ruta = await ir('/ia-local');
    expect(ruta.name).toBe('ia');
    expect(ruta.params['pestana']).toBe('local');
  });

  it('una ruta desconocida lleva a Inicio', async () => {
    expect((await ir('/no-existe/nada')).name).toBe('inicio');
  });

  it('cada redirección apunta a una ruta que existe', () => {
    const r = crearRouter();
    for (const rd of REDIRECCIONES) {
      const resuelta = r.resolve(rd.path);
      expect(resuelta.matched.length, rd.path).toBeGreaterThan(0);
      expect(r.currentRoute.value).toBeDefined();
    }
  });
});

describe('pantallas que siguen siendo rutas', () => {
  it('/contenedores sigue funcionando aunque la barra lateral la oculte', async () => {
    const ruta = await ir('/contenedores');
    expect(ruta.name).toBe('contenedores');
    expect(ruta.meta.seccion).toBe('contenedores');
  });

  it('/ia sin pestaña y las tres pestañas de IA', async () => {
    expect((await ir('/ia')).name).toBe('ia');
    for (const p of ['agentes', 'nube', 'local']) {
      const ruta = await ir({ name: 'ia', params: { pestana: p } });
      expect(ruta.path).toBe(`/ia/${p}`);
    }
    // Una pestaña inventada no es de IA: cae en Inicio.
    expect((await ir('/ia/otra')).name).toBe('inicio');
  });

  it('Versiones de Servicios mantiene su parámetro y el foco', async () => {
    const ruta = await ir('/servicios/versiones/php?foco=version:php:8.4.1');
    expect(ruta.name).toBe('servicios.versiones');
    expect(ruta.params['servicio']).toBe('php');
    expect(ruta.query['foco']).toBe('version:php:8.4.1');
  });
});

describe('barra lateral (D38a)', () => {
  it('por defecto tiene 11 entradas: Contenedores, PHP y Agentes no están', () => {
    const visibles = gruposVisibles(false).flatMap((g) => g.secciones);
    expect(visibles).toEqual([
      'inicio',
      'proyectos',
      'servicios',
      'basesDeDatos',
      'correo',
      'ia',
      'tuneles',
      'herramientas',
      'depuracion',
      'doctor',
      'registros',
    ]);
    expect(visibles).toHaveLength(11);
  });

  it('con «Mostrar secciones avanzadas» aparece Contenedores', () => {
    const visibles = gruposVisibles(true).flatMap((g) => g.secciones);
    expect(visibles).toContain('contenedores');
    expect(visibles).toHaveLength(12);
    expect(SECCIONES_AVANZADAS).toEqual(['contenedores']);
  });

  it('la paleta sigue llegando a Contenedores, PHP y Agentes', () => {
    expect(SECCIONES_NAV).toContain('contenedores');
    expect(SECCIONES_NAV).toContain('ajustes');
    const r = crearRouter();
    for (const a of ACCESOS_NAV) {
      expect(r.resolve(a.destino).matched.length, a.id).toBeGreaterThan(0);
    }
    expect(ACCESOS_NAV.map((a) => a.id)).toEqual(['php', 'agentes']);
    expect(r.resolve(ACCESOS_NAV[0]!.destino).path).toBe('/servicios/php');
    expect(r.resolve(ACCESOS_NAV[1]!.destino).path).toBe('/ia/agentes');
  });

  it('toda pantalla de la barra lateral tiene ruta con su nombre', () => {
    const nombres = new Set(PANTALLAS.map((p) => p.name));
    for (const s of SECCIONES_NAV) expect(nombres.has(s), s).toBe(true);
    for (const g of GRUPOS_NAV) expect(g.secciones.length).toBeGreaterThan(0);
  });

  it('el Marco arma la barra con el ajuste y la paleta suma los accesos', () => {
    expect(fuente('componentes', 'Marco.vue')).toContain(
      'gruposVisibles(preferencias.seccionesAvanzadas)',
    );
    expect(fuente('componentes', 'PaletaComandos.vue')).toContain('ACCESOS_NAV');
  });

  it('los textos de las pestañas de IA existen en los 4 idiomas', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      for (const k of ['agentes', 'nube', 'local'] as const) {
        expect(d.ia.pestanas[k], `${id}:${k}`).toBeTruthy();
      }
      expect(d.preferencias.avanzadas, id).toBeTruthy();
    }
  });
});
