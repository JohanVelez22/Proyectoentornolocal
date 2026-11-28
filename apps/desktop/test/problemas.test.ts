import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMetricas } from '../src/renderer/stores/metricas';
import { useProblemas } from '../src/renderer/stores/problemas';
import { useServicios } from '../src/renderer/stores/servicios';
import { cuentaCampana } from '../src/renderer/utilidades/problemas';

const fuente = (...r: string[]): string =>
  readFileSync(join(__dirname, '..', 'src', 'renderer', ...r), 'utf8');

describe('problemas detectados: una sola fuente (D54c)', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('sin nada que avisar no hay problemas', () => {
    const p = useProblemas();
    expect(p.total).toBe(0);
    expect(p.hayError).toBe(false);
  });

  it('un puerto ocupado por otro programa y un fallo de puertos suman dos', () => {
    const metricas = useMetricas();
    const servicios = useServicios();
    servicios.porId = {
      nginx: {
        id: 'nginx',
        nombre: 'Nginx',
        categoria: 'web',
        version: '1',
        estado: 'apagado',
        puertos: [80],
        pid: null,
      },
    };
    metricas.puertos = [{ puerto: 80, pid: 7, nombre: 'httpd.exe', propio: false }] as never;
    metricas.errorPuertos = true;
    const p = useProblemas();
    expect(p.total).toBe(2);
    expect(p.hayError).toBe(true);
    expect(p.lista.map((x) => x.tipo)).toEqual(['error', 'info']);
  });

  it('la campana suma los avisos sin leer y los problemas, con una sola cuenta', () => {
    expect(cuentaCampana(2, 3)).toBe(5);
    expect(cuentaCampana(0, 0)).toBe(0);
  });

  it('la pastilla y la campana leen del almacén y no recalculan los problemas', () => {
    expect(fuente('componentes', 'Marco.vue')).toContain('useProblemas');
    expect(fuente('componentes', 'CampanaAvisos.vue')).toContain('useProblemas');
    expect(fuente('componentes', 'PanelAvisos.vue')).toContain('useProblemas');
    for (const f of ['CampanaAvisos.vue', 'PanelAvisos.vue', 'Marco.vue'])
      expect(fuente('componentes', f)).not.toContain('calcularProblemas');
  });

  it('Inicio, la pastilla y la campana leen del MISMO almacén y ninguna recalcula (D54d)', () => {
    // Inicio: el bloque de problemas y el panel de rendimiento (memoria) leen de useProblemas.
    expect(fuente('vistas', 'Inicio.vue')).toContain('BloqueProblemas');
    for (const f of [
      'BloqueProblemas.vue',
      'PanelRendimiento.vue',
      'Marco.vue',
      'CampanaAvisos.vue',
    ])
      expect(fuente('componentes', f)).toContain("from '../stores/problemas'");
    for (const f of ['BloqueProblemas.vue', 'PanelRendimiento.vue'])
      expect(fuente('componentes', f)).not.toContain('calcularAlertas');
    // Una sola instancia: el mismo almacén da la misma cuenta a todos.
    const metricas = useMetricas();
    metricas.errorPuertos = true;
    expect(useProblemas()).toBe(useProblemas());
    expect(useProblemas().total).toBe(1);
  });
});

describe('el almacén reproduce el cálculo que tenía PanelRendimiento (D54d)', () => {
  beforeEach(() => setActivePinia(createPinia()));
  const nginx = {
    id: 'nginx',
    nombre: 'Nginx',
    categoria: 'web',
    version: '1',
    estado: 'apagado',
    puertos: [80],
    pid: null,
  };
  const casos: Record<string, [(m: ReturnType<typeof useMetricas>) => void, string[]]> = {
    'sin nada': [() => undefined, []],
    'error de muestreo': [
      (m) => {
        m.errorMuestreo = 'sin permiso';
      },
      ['muestreo'],
    ],
    'memoria alta (no cuenta) y fallo de puertos': [
      (m) => {
        m.serie = [
          { ramTotal: 100, ramUsada: 99, cpu: 1, red: { rxBps: 0, txBps: 0 }, procesos: [] },
        ] as never;
        m.errorPuertos = true;
      },
      ['puertos'],
    ],
  };
  for (const [nombre, [preparar, claves]] of Object.entries(casos)) {
    it(nombre, () => {
      const m = useMetricas();
      const sv = useServicios();
      sv.porId = { nginx } as never;
      preparar(m);
      const p = useProblemas();
      expect(p.lista.map((x) => x.clave)).toEqual(claves);
      expect(p.total).toBe(claves.length);
    });
  }

  it('un puerto ajeno y un php-cgi huérfano salen del almacén como alertas con su proceso', () => {
    const m = useMetricas();
    const sv = useServicios();
    sv.porId = { nginx } as never;
    m.puertos = [
      { puerto: 80, pid: 7, nombre: 'httpd.exe', propio: false },
      { puerto: 9000, pid: 8, nombre: 'php-cgi.exe', propio: false },
    ] as never;
    const p = useProblemas();
    expect(p.lista.length).toBeGreaterThan(0);
    expect(p.lista.every((x) => x.tipo === 'error')).toBe(true);
    expect(p.lista.map((x) => x.clave)).toEqual(
      p.alertas.filter((a) => a.tipo !== 'ramAlta').map((a) => a.clave),
    );
  });
});
