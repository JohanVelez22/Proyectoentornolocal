import { describe, expect, it } from 'vitest';
import {
  conservarVeredicto,
  decidirAlertas,
  estadoSaludVacio,
  INTERVALO_MIN_AVISO_MS,
  VENTANA_REFERENCIA_CORREGIDOS_MS,
  leerEstadoGuardado,
} from '../src/discos/alertas';
import type { DiscoSalud, MotivoVeredicto, Veredicto } from '../src/discos/tipos';

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

const CTR = {
  temperaturaC: 40,
  temperaturaMaxC: null,
  desgastePct: 95,
  erroresLecturaCorregidos: 0,
  erroresLecturaNoCorregidos: 0,
  erroresEscrituraCorregidos: 0,
  erroresEscrituraNoCorregidos: 0,
  horasEncendido: 10,
};

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
        ultimo: null,
      },
    });
  });
});

describe('estado guardado: fechas del futuro (M3)', () => {
  const AHORA = 1_800_000_000_000;
  const base = (extra: Record<string, unknown>) => ({
    discos: {
      d0: {
        veredicto: 'atencion',
        corregidos: 5,
        corregidosEn: 1,
        avisoNivel: 1,
        avisoEn: 1,
        ...extra,
      },
    },
  });

  it('descarta avisoEn, corregidosEn y el último dato si son posteriores a ahora', () => {
    const r = leerEstadoGuardado(
      base({
        corregidosEn: AHORA + 1,
        avisoEn: AHORA + 5_000,
        ultimo: {
          veredicto: 'critico',
          motivos: ['desgaste'],
          en: AHORA + 1,
          origen: 'admin',
          contadores: CTR,
        },
      }),
      AHORA,
    ).discos['d0'];
    expect(r).toMatchObject({ corregidosEn: null, corregidos: null, avisoEn: null, ultimo: null });
  });

  it('conserva las fechas pasadas', () => {
    const r = leerEstadoGuardado(
      base({
        corregidosEn: AHORA - 1000,
        avisoEn: AHORA,
        ultimo: {
          veredicto: 'critico',
          motivos: ['desgaste', 'x'],
          en: AHORA - 5,
          origen: 'admin',
          contadores: CTR,
        },
      }),
      AHORA,
    ).discos['d0'];
    expect(r).toMatchObject({
      corregidos: 5,
      corregidosEn: AHORA - 1000,
      avisoEn: AHORA,
      ultimo: {
        veredicto: 'critico',
        motivos: ['desgaste'],
        en: AHORA - 5,
        origen: 'admin',
        contadores: CTR,
      },
    });
  });

  it('un último dato mal formado se descarta', () => {
    for (const ultimo of [
      5,
      { veredicto: 'raro', en: 1, origen: 'admin', contadores: CTR },
      { veredicto: 'bien', en: 1, origen: 'x' },
    ]) {
      expect(leerEstadoGuardado(base({ ultimo }), AHORA).discos['d0']?.ultimo).toBeNull();
    }
  });
});

describe('una lectura con menos información no rebaja el veredicto (I1)', () => {
  const T = 1_800_000_000_000;
  const ctr = {
    temperaturaC: 40,
    temperaturaMaxC: null,
    desgastePct: 95,
    erroresLecturaCorregidos: 0,
    erroresLecturaNoCorregidos: 0,
    erroresEscrituraCorregidos: 0,
    erroresEscrituraNoCorregidos: 0,
    horasEncendido: 10,
  };

  it('guarda el resultado de los contadores con su fecha y su origen', () => {
    const r = decidirAlertas(
      [disco('atencion', { contadores: ctr, motivos: ['desgaste'] })],
      estadoSaludVacio(),
      T,
      undefined,
      'admin',
    );
    expect(r.estado.discos['d0']?.ultimo).toEqual({
      veredicto: 'atencion',
      motivos: ['desgaste'],
      en: T,
      origen: 'admin',
      contadores: ctr,
    });
    // Una lectura sin contadores no borra ni cambia el último dato.
    const s = decidirAlertas([disco('bien')], r.estado, T + 1000);
    expect(s.estado.discos['d0']?.ultimo).toEqual(r.estado.discos['d0']?.ultimo);
  });

  it('conservarVeredicto: conserva el peor, con fecha y origen', () => {
    const ultimo = {
      veredicto: 'critico' as const,
      motivos: ['errores_sin_corregir' as const],
      en: T,
      origen: 'admin' as const,
      contadores: CTR,
    };
    expect(conservarVeredicto({ veredicto: 'bien', motivos: [] }, false, ultimo, T)).toEqual({
      veredicto: 'critico',
      motivos: ['errores_sin_corregir'],
      conservado: { en: new Date(T).toISOString(), origen: 'admin', contadores: CTR },
    });
    // Si lo nuevo es igual o peor, manda lo nuevo; si trae contadores, también.
    expect(
      conservarVeredicto({ veredicto: 'critico', motivos: ['estado_warning'] }, false, ultimo, T),
    ).toEqual({ veredicto: 'critico', motivos: ['estado_warning'], conservado: null });
    expect(conservarVeredicto({ veredicto: 'bien', motivos: [] }, true, ultimo, T).veredicto).toBe(
      'bien',
    );
    expect(
      conservarVeredicto({ veredicto: 'no_disponible', motivos: [] }, false, null, T).conservado,
    ).toBeNull();
  });

  it('conservarVeredicto: lo transitorio (temperatura) caduca a las 24 h; lo persistente no', () => {
    const DIA = 24 * 60 * 60 * 1000;
    const de = (motivos: MotivoVeredicto[], veredicto: 'atencion' | 'critico') => ({
      veredicto,
      motivos,
      en: T,
      origen: 'admin' as const,
      contadores: CTR,
    });
    const bien = { veredicto: 'bien' as const, motivos: [] };
    // Temperatura: vale justo hasta las 24 h; después, «Bien» y sin dato conservado.
    const temperatura = de(['temperatura'], 'atencion');
    expect(conservarVeredicto(bien, false, temperatura, T + DIA).veredicto).toBe('atencion');
    expect(conservarVeredicto(bien, false, temperatura, T + DIA + 1)).toEqual({
      veredicto: 'bien',
      motivos: [],
      conservado: null,
    });
    // Subida de errores corregidos: también es de un momento.
    const sube = de(['errores_corregidos_suben'], 'atencion');
    expect(conservarVeredicto(bien, false, sube, T + 30 * DIA).veredicto).toBe('bien');
    // Errores sin corregir y desgaste siguen hasta una nueva lectura con contadores.
    for (const [m, v] of [
      ['errores_sin_corregir', 'critico'],
      ['desgaste', 'atencion'],
    ] as const) {
      const r = conservarVeredicto(bien, false, de([m], v), T + 90 * DIA);
      expect(r.veredicto).toBe(v);
      expect(r.motivos).toEqual([m]);
      expect(r.conservado).not.toBeNull();
    }
    // Mezcla: caduca la temperatura, queda el desgaste (y el veredicto se recalcula con él).
    const mezcla = conservarVeredicto(
      bien,
      false,
      de(['desgaste', 'temperatura'], 'atencion'),
      T + 2 * DIA,
    );
    expect(mezcla.motivos).toEqual(['desgaste']);
    // Mezcla con crítico: caducan los transitorios, pero «sin corregir» sigue siendo crítico.
    const critica = conservarVeredicto(
      bien,
      false,
      de(['errores_sin_corregir', 'temperatura'], 'critico'),
      T + 2 * DIA,
    );
    expect(critica).toMatchObject({ veredicto: 'critico', motivos: ['errores_sin_corregir'] });
    // Con una lectura nueva con contadores, manda siempre lo nuevo.
    expect(conservarVeredicto(bien, true, de(['desgaste'], 'atencion'), T + DIA).veredicto).toBe(
      'bien',
    );
  });

  it('el último dato se sobrescribe con una lectura nueva con contadores (sanos incluidos)', () => {
    const a = decidirAlertas(
      [disco('atencion', { contadores: ctr, motivos: ['desgaste'] })],
      estadoSaludVacio(),
      T,
      undefined,
      'admin',
    );
    const sana = { ...ctr, desgastePct: 10 };
    const b = decidirAlertas(
      [disco('bien', { contadores: sana })],
      a.estado,
      T + 1000,
      undefined,
      'admin',
    );
    expect(b.estado.discos['d0']?.ultimo).toMatchObject({ veredicto: 'bien', en: T + 1000 });
  });
});
