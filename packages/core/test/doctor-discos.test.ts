import { describe, expect, it } from 'vitest';
import { IDS_REVISION } from '../src/doctor/doctor';
import { revisarDiscos } from '../src/doctor/revisiones/discos';
import type { DepsDoctor } from '../src/doctor/tipos';
import type { DiscoSalud, ResultadoSalud, Veredicto } from '../src/discos/tipos';

const disco = (n: number, veredicto: Veredicto, extra: Partial<DiscoSalud> = {}): DiscoSalud => ({
  clave: `d${n}`,
  numero: n,
  modelo: `Disco ${n}`,
  medio: 'ssd',
  bus: 'nvme',
  tamanoBytes: 5e11,
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

const deps = (r: ResultadoSalud | Error | undefined): DepsDoctor =>
  ({
    discos:
      r === undefined
        ? undefined
        : {
            leer: async () => {
              if (r instanceof Error) throw r;
              return r;
            },
          },
  }) as unknown as DepsDoctor;

const res = (discos: DiscoSalud[]): ResultadoSalud => ({
  discos,
  prediccion: 'ok',
  conAdmin: false,
  leidoEn: '2026-11-27T00:00:00.000Z',
});

describe('Doctor: salud de los discos', () => {
  it('es una de las revisiones', () => {
    expect(IDS_REVISION).toContain('discos');
  });

  it('sin la dependencia, sin lectura o con todo bien: sin hallazgos', async () => {
    expect(await revisarDiscos(deps(undefined))).toEqual([]);
    expect(await revisarDiscos(deps(new Error('x')))).toEqual([]);
    expect(await revisarDiscos(deps(res([disco(0, 'bien'), disco(1, 'no_disponible')])))).toEqual(
      [],
    );
  });

  it('atención es un aviso y crítico un error, con lo que vio y sin series', async () => {
    const h = await revisarDiscos(
      deps(
        res([
          disco(0, 'atencion', {
            motivos: ['desgaste'],
            contadores: {
              temperaturaC: 40,
              temperaturaMaxC: null,
              desgastePct: 88,
              erroresLecturaCorregidos: null,
              erroresLecturaNoCorregidos: null,
              erroresEscrituraCorregidos: null,
              erroresEscrituraNoCorregidos: null,
              horasEncendido: 100,
            },
          }),
          disco(1, 'critico', { motivos: ['estado_unhealthy', 'prediccion_fallo'] }),
        ]),
      ),
    );
    expect(h.map((x) => [x.id, x.gravedad, x.codigo])).toEqual([
      ['discos:0', 'aviso', 'doctor.disco_atencion'],
      ['discos:1', 'error', 'doctor.disco_critico'],
    ]);
    expect(h[0]!.evidencia.lineas).toEqual([
      { codigo: 'disco_desgaste', datos: { desgaste: 88, umbral: 80 } },
    ]);
    expect(h[1]!.evidencia.lineas?.map((l) => l.codigo)).toEqual([
      'disco_estado',
      'disco_prediccion',
    ]);
    expect(h[1]!.reparacion).toBeUndefined();
    expect(JSON.stringify(h)).not.toMatch(/serial|unique/i);
  });
});
