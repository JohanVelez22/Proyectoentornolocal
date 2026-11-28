import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMetricas } from '../src/renderer/stores/metricas';
import { useProblemas } from '../src/renderer/stores/problemas';
import { useServicios } from '../src/renderer/stores/servicios';
import { textos } from '../src/renderer/i18n';
import { calcularAlertas } from '../src/renderer/utilidades/metricas';
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
});

/**
 * Copia FIJA de la lógica en línea de PanelRendimiento.vue (D54a) tal como estaba en D54b. Mientras
 * Inicio no lea el almacén (Etapa F), esta prueba garantiza que `calcularProblemas` da la misma
 * lista que el panel.
 */
function problemasDelPanel(m: ReturnType<typeof useMetricas>, sv: ReturnType<typeof useServicios>) {
  const t = textos.panel;
  const alertas = calcularAlertas({
    muestra: m.ultima,
    puertos: m.puertos,
    servicios: sv.vigilados,
  });
  return [
    ...(m.errorMuestreo
      ? [{ clave: 'muestreo', texto: t.errorMuestreo(m.errorMuestreo), tipo: 'error' as const }]
      : []),
    ...alertas
      .filter((a) => a.tipo !== 'ramAlta')
      .map((a) => ({ clave: a.clave, texto: a.texto, tipo: 'error' as const, alerta: a })),
    ...(m.errorPuertos
      ? [{ clave: 'puertos', texto: t.alertas.errorPuertos, tipo: 'info' as const }]
      : []),
  ];
}

describe('calcularProblemas reproduce el cálculo de PanelRendimiento (D54c)', () => {
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
  const casos: Record<string, (m: ReturnType<typeof useMetricas>) => void> = {
    'sin nada': () => undefined,
    'error de muestreo': (m) => {
      m.errorMuestreo = 'sin permiso';
    },
    'puerto ajeno y php-cgi huérfano': (m) => {
      m.puertos = [
        { puerto: 80, pid: 7, nombre: 'httpd.exe', propio: false },
        { puerto: 9000, pid: 8, nombre: 'php-cgi.exe', propio: false },
      ] as never;
    },
    'memoria alta (no cuenta) y fallo de puertos': (m) => {
      m.serie = [
        { ramTotal: 100, ramUsada: 99, cpu: 1, red: { rxBps: 0, txBps: 0 }, procesos: [] },
      ] as never;
      m.errorPuertos = true;
    },
    'todo junto': (m) => {
      m.errorMuestreo = 'x';
      m.errorPuertos = true;
      m.puertos = [{ puerto: 80, pid: 7, nombre: 'httpd.exe', propio: false }] as never;
    },
  };
  for (const [nombre, preparar] of Object.entries(casos)) {
    it(nombre, () => {
      const m = useMetricas();
      const sv = useServicios();
      sv.porId = { nginx } as never;
      preparar(m);
      const p = useProblemas();
      expect(p.lista).toEqual(problemasDelPanel(m, sv));
      expect(p.total).toBe(problemasDelPanel(m, sv).length);
    });
  }
});
