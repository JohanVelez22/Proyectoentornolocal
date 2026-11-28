import { describe, expect, it } from 'vitest';
import {
  decidirAlertas,
  estadoSaludVacio,
  INTERVALO_MIN_AVISO_MS,
  VENTANA_REFERENCIA_CORREGIDOS_MS,
  leerEstadoGuardado,
} from '../src/discos/alertas';
import type { DiscoSalud, Veredicto } from '../src/discos/tipos';

const disco = (veredicto: Veredicto, extra: Partial<DiscoSalud> = {}): DiscoSalud => ({
  clave: 'd0',
  numero: 0,
  modelo: 'Disco de prueba',
  medio: 'ssd',
  bus: 'nvme',
  tamanoBytes: 1e12,
  salud: 'healthy',
  operacional: ['OK'],
  contadores: null,
  motivoSinContadores: 'admin',
  prediccionFallo: null,
  unidades: ['C:'],
  veredicto,
  motivos: [],
  contieneDatos: false,
  contieneProyectos: false,
  ...extra,
});

const T0 = 1_000_000_000_000;

describe('decidirAlertas', () => {
  it('un disco que está bien no avisa y se recuerda', () => {
    const r = decidirAlertas([disco('bien')], estadoSaludVacio(), T0);
    expect(r.avisos).toEqual([]);
    expect(r.estado.discos['d0']?.veredicto).toBe('bien');
  });

  it('pasa de bien a atención: avisa una vez', () => {
    const a = decidirAlertas([disco('bien')], estadoSaludVacio(), T0);
    const b = decidirAlertas([disco('atencion')], a.estado, T0 + 1000);
    expect(b.avisos).toHaveLength(1);
    expect(b.avisos[0]).toMatchObject({ veredicto: 'atencion', numero: 0 });
  });

  it('no repite el aviso en la revisión siguiente mientras siga igual', () => {
    const b = decidirAlertas(
      [disco('atencion')],
      decidirAlertas([disco('bien')], estadoSaludVacio(), T0).estado,
      T0 + 1,
    );
    const c = decidirAlertas([disco('atencion')], b.estado, T0 + 30 * 60_000);
    expect(c.avisos).toEqual([]);
    const d = decidirAlertas([disco('atencion')], c.estado, T0 + 24 * 3_600_000);
    expect(d.avisos).toEqual([]);
  });

  it('de atención a crítico avisa aunque sea pronto (nivel más grave)', () => {
    const a = decidirAlertas([disco('atencion')], estadoSaludVacio(), T0);
    expect(a.avisos).toHaveLength(1);
    const b = decidirAlertas([disco('critico')], a.estado, T0 + 60_000);
    expect(b.avisos).toHaveLength(1);
    expect(b.avisos[0]?.veredicto).toBe('critico');
  });

  it('un disco visto por primera vez ya en crítico avisa', () => {
    expect(decidirAlertas([disco('critico')], estadoSaludVacio(), T0).avisos).toHaveLength(1);
  });

  it('mejorar no avisa; volver a empeorar dentro del intervalo mínimo, tampoco', () => {
    const a = decidirAlertas([disco('atencion')], estadoSaludVacio(), T0);
    const mejor = decidirAlertas([disco('bien')], a.estado, T0 + 60_000);
    expect(mejor.avisos).toEqual([]);
    const otraVez = decidirAlertas([disco('atencion')], mejor.estado, T0 + 120_000);
    expect(otraVez.avisos).toEqual([]);
    const pasadoElIntervalo = decidirAlertas(
      [disco('atencion')],
      decidirAlertas([disco('bien')], otraVez.estado, T0 + INTERVALO_MIN_AVISO_MS).estado,
      T0 + INTERVALO_MIN_AVISO_MS + 60_000,
    );
    expect(pasadoElIntervalo.avisos).toHaveLength(1);
  });

  it('una lectura sin datos no cambia el estado ni avisa', () => {
    const a = decidirAlertas([disco('atencion')], estadoSaludVacio(), T0);
    const b = decidirAlertas([disco('no_disponible')], a.estado, T0 + 1000);
    expect(b.avisos).toEqual([]);
    expect(b.estado.discos['d0']?.veredicto).toBe('atencion');
    const c = decidirAlertas([disco('atencion')], b.estado, T0 + 2000);
    expect(c.avisos).toEqual([]);
  });

  it('recuerda los errores corregidos aunque la lectura siguiente no los traiga', () => {
    const contadores = {
      temperaturaC: null,
      temperaturaMaxC: null,
      desgastePct: null,
      erroresLecturaCorregidos: 7,
      erroresLecturaNoCorregidos: null,
      erroresEscrituraCorregidos: null,
      erroresEscrituraNoCorregidos: null,
      horasEncendido: null,
    };
    const a = decidirAlertas([disco('bien', { contadores })], estadoSaludVacio(), T0);
    expect(a.estado.discos['d0']?.corregidos).toBe(7);
    const b = decidirAlertas([disco('bien')], a.estado, T0 + 1000);
    expect(b.estado.discos['d0']?.corregidos).toBe(7);
  });

  it('la referencia de errores corregidos se renueva solo pasada la ventana, o si baja', () => {
    const c = (n: number) => ({
      temperaturaC: null,
      temperaturaMaxC: null,
      desgastePct: null,
      erroresLecturaCorregidos: n,
      erroresLecturaNoCorregidos: null,
      erroresEscrituraCorregidos: null,
      erroresEscrituraNoCorregidos: null,
      horasEncendido: null,
    });
    const a = decidirAlertas([disco('bien', { contadores: c(5) })], estadoSaludVacio(), T0);
    const b = decidirAlertas([disco('bien', { contadores: c(9) })], a.estado, T0 + 60_000);
    expect(b.estado.discos['d0']?.corregidos).toBe(5);
    const d = decidirAlertas(
      [disco('bien', { contadores: c(9) })],
      b.estado,
      T0 + VENTANA_REFERENCIA_CORREGIDOS_MS,
    );
    expect(d.estado.discos['d0']?.corregidos).toBe(9);
    const e = decidirAlertas([disco('bien', { contadores: c(2) })], d.estado, T0 + 1);
    expect(e.estado.discos['d0']?.corregidos).toBe(2);
  });

  it('conserva los discos que no se vieron esta vez', () => {
    const a = decidirAlertas([disco('bien')], estadoSaludVacio(), T0);
    const b = decidirAlertas([], a.estado, T0 + 1);
    expect(Object.keys(b.estado.discos)).toEqual(['d0']);
  });
});

describe('leerEstadoGuardado', () => {
  it('lo dañado o editado a mano vuelve a vacío sin lanzar', () => {
    for (const malo of [null, 3, 'x', [], { discos: 5 }, { discos: [] }]) {
      expect(leerEstadoGuardado(malo)).toEqual(estadoSaludVacio());
    }
  });

  it('descarta entradas con un veredicto desconocido y sanea los números', () => {
    const r = leerEstadoGuardado({
      discos: {
        a: { veredicto: 'critico', corregidos: -4, avisoNivel: 9, avisoEn: 'x' },
        b: { veredicto: 'raro' },
      },
    });
    expect(r.discos).toEqual({
      a: {
        veredicto: 'critico',
        corregidos: null,
        corregidosEn: null,
        avisoNivel: 0,
        avisoEn: null,
      },
    });
  });
});
