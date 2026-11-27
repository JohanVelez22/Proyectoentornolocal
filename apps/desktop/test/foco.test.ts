import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aplicarFoco,
  candidatosFoco,
  CLASE_FOCO,
  CLASE_FOCO_ESTATICO,
  DURACION_FOCO_ESTATICO_MS,
  DURACION_FOCO_MS,
  elegirClaseFoco,
  rutaConFoco,
  type ElementoFoco,
} from '../src/renderer/utilidades/foco';

function elementoFalso() {
  const clases = new Set<string>();
  const scroll = vi.fn<(o: { block: 'center'; behavior?: 'smooth' | 'auto' }) => void>();
  const el: ElementoFoco & { clases: Set<string>; scroll: typeof scroll } = {
    clases,
    scroll,
    scrollIntoView: (o) => scroll(o),
    classList: { add: (c) => clases.add(c), remove: (c) => clases.delete(c) },
  };
  return el;
}

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');

describe('rutaConFoco', () => {
  it('agrega ?foco= a la pantalla por nombre y conserva la query', () => {
    expect(rutaConFoco('servicios', 'servicio:mysql')).toEqual({
      name: 'servicios',
      query: { foco: 'servicio:mysql' },
    });
    expect(rutaConFoco('doctor', 'hallazgo:a', { filtro: 'x' })).toEqual({
      name: 'doctor',
      query: { filtro: 'x', foco: 'hallazgo:a' },
    });
    expect(rutaConFoco('/proyectos', 'sitio:s')).toEqual({
      path: '/proyectos',
      query: { foco: 'sitio:s' },
    });
  });
});

describe('elegirClaseFoco', () => {
  it('con movimiento: halo 2,5 s; reducido: estático 1,5 s', () => {
    expect(DURACION_FOCO_MS).toBe(2500);
    expect(elegirClaseFoco(false)).toEqual({ clase: CLASE_FOCO, duracionMs: 2500 });
    expect(elegirClaseFoco(true)).toEqual({
      clase: CLASE_FOCO_ESTATICO,
      duracionMs: DURACION_FOCO_ESTATICO_MS,
    });
    expect(DURACION_FOCO_ESTATICO_MS).toBeLessThan(DURACION_FOCO_MS);
  });
});

describe('candidatosFoco', () => {
  it('un proceso cae al proyecto que lo contiene', () => {
    expect(candidatosFoco('proceso:mi-sitio:web')).toEqual([
      'proceso:mi-sitio:web',
      'sitio:mi-sitio',
    ]);
    expect(candidatosFoco('servicio:mysql')).toEqual(['servicio:mysql']);
  });
});

describe('aplicarFoco', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('hace scroll al centro, pone el halo y lo quita a los 2,5 s', () => {
    const el = elementoFalso();
    aplicarFoco({ buscar: (id) => (id === 'servicio:mysql' ? el : null) }, 'servicio:mysql', {
      reducido: false,
    });
    expect(el.scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
    expect(el.clases.has(CLASE_FOCO)).toBe(true);
    vi.advanceTimersByTime(2499);
    expect(el.clases.has(CLASE_FOCO)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(el.clases.has(CLASE_FOCO)).toBe(false);
  });

  it('con movimiento reducido usa el resaltado estático, sin scroll suave', () => {
    const el = elementoFalso();
    aplicarFoco({ buscar: () => el }, 'sitio:a', { reducido: true });
    expect(el.scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'auto' });
    expect(el.clases.has(CLASE_FOCO_ESTATICO)).toBe(true);
    expect(el.clases.has(CLASE_FOCO)).toBe(false);
    vi.advanceTimersByTime(DURACION_FOCO_ESTATICO_MS);
    expect(el.clases.size).toBe(0);
  });

  it('espera a un elemento que aparece después (datos que cargan)', () => {
    const el = elementoFalso();
    let listo = false;
    aplicarFoco({ buscar: () => (listo ? el : null) }, 'sitio:a', { reducido: false });
    expect(el.scroll).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    listo = true;
    vi.advanceTimersByTime(100);
    expect(el.clases.has(CLASE_FOCO)).toBe(true);
  });

  it('si el elemento no existe nunca, no hace nada y deja de buscar', () => {
    const buscar = vi.fn(() => null);
    aplicarFoco({ buscar }, 'sitio:fantasma', { reducido: false });
    vi.advanceTimersByTime(10_000);
    const llamadas = buscar.mock.calls.length;
    expect(llamadas).toBeGreaterThan(1);
    vi.advanceTimersByTime(10_000);
    expect(buscar.mock.calls.length).toBe(llamadas);
  });

  it('un proceso que no está en pantalla resalta su proyecto', () => {
    const el = elementoFalso();
    aplicarFoco({ buscar: (id) => (id === 'sitio:mi-sitio' ? el : null) }, 'proceso:mi-sitio:web', {
      reducido: false,
    });
    expect(el.clases.has(CLASE_FOCO)).toBe(true);
  });

  it('cancelar quita el halo y detiene la búsqueda', () => {
    const el = elementoFalso();
    const cancelar = aplicarFoco({ buscar: () => el }, 'sitio:a', { reducido: false });
    cancelar();
    expect(el.clases.size).toBe(0);
    const buscar = vi.fn(() => null);
    const c2 = aplicarFoco({ buscar }, 'sitio:b', { reducido: false });
    c2();
    vi.advanceTimersByTime(5000);
    expect(buscar).toHaveBeenCalledTimes(1);
  });
});

describe('vistas con foco', () => {
  it.each([
    ['componentes/TarjetaServicio.vue', 'data-foco="`servicio:${servicio.id}`"'],
    ['componentes/TarjetaProyecto.vue', 'data-foco="`sitio:${sitio.id}`"'],
    ['componentes/TarjetaHallazgo.vue', 'data-foco="`hallazgo:${hallazgo.id}`"'],
    ['componentes/ProcesosProyecto.vue', 'data-foco="`proceso:${sitio.id}:${p.id}`"'],
    ['componentes/TarjetaServiciosProcesos.vue', 'data-foco="`servicio:${s.id}`"'],
    ['componentes/TablaProcesos.vue', 'data-foco="`servicio:${servicioDeProceso(f.id)}`"'],
    ['vistas/Tuneles.vue', "'data-foco': `sitio:${f.sitioId}`"],
  ])('%s declara su data-foco', (archivo, esperado) => {
    expect(fuente(...archivo.split('/'))).toContain(esperado);
  });

  it.each(['Doctor', 'Inicio', 'Proyectos', 'Servicios'])('%s llama a useFoco()', (v) => {
    const s = fuente('vistas', `${v}.vue`);
    expect(s).toContain("from '../composables/useFoco'");
    expect(s).toMatch(/^useFoco\(\);$/m);
  });

  it('abrir un aviso con foco navega con rutaConFoco', () => {
    expect(fuente('componentes', 'Marco.vue')).toContain('rutaConFoco(ruta, foco)');
  });

  it('el CSS tiene el halo y la variante de movimiento reducido', () => {
    const css = fuente('estilos.css');
    expect(css).toContain('.foco-halo');
    expect(css).toContain('.foco-estatico');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*\.foco-halo/);
    expect(css).toContain('var(--acento-rgb)');
  });
});
