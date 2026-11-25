import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { interpretarCron, siguiente } from '../src/tareas/cron';

const utc = (s: string): Date => new Date(s);
const sig = (expr: string, desde: string, zona = 'UTC'): string =>
  siguiente(interpretarCron(expr), utc(desde), zona).toISOString();

describe('interpretarCron: sintaxis', () => {
  it('acepta comodines, listas, rangos, pasos y nombres', () => {
    for (const e of [
      '* * * * *',
      '*/15 9-17 * * 1-5',
      '0 3 * * *',
      '0,30 * * * *',
      '0-10/5 * * * *',
      '0 0 1 JAN,jul *',
      '0 0 * * MON-FRI',
      '0 0 * * sun',
      '0 0 * * 7',
      '  5   4  *  *  *  ',
    ]) {
      expect(() => interpretarCron(e), e).not.toThrow();
    }
  });

  it('rechaza lo inválido con tareas.cron_invalida', () => {
    for (const e of [
      '',
      '* * * *',
      '* * * * * *',
      '60 * * * *',
      '* 24 * * *',
      '* * 0 * *',
      '* * 32 * *',
      '* * * 13 *',
      '* * * * 8',
      '*/0 * * * *',
      '*/-1 * * * *',
      '5-1 * * * *',
      'a * * * *',
      '1,,2 * * * *',
      '1- * * * *',
      '-1 * * * *',
      '*/ * * * *',
      '*/2/3 * * * *',
      '1/5 * * * *',
      '@hourly',
      '0 0 31 2 *',
      '0 0 30 2 *',
      '0 0 * * FOO',
      '0 0 * FOO *',
      '1.5 * * * *',
      '0x10 * * * *',
      '1e1 * * * *',
      '*\n* * * *',
    ]) {
      try {
        interpretarCron(e);
        throw new Error(`debía rechazar: ${JSON.stringify(e)}`);
      } catch (err) {
        expect(err, e).toBeInstanceOf(ErrorWolf);
        expect((err as ErrorWolf).codigo, e).toBe('tareas.cron_invalida');
      }
    }
  });

  it('rechaza expresiones enormes sin colgarse (sin ReDoS)', () => {
    const t0 = Date.now();
    for (const e of [
      `${'1,'.repeat(50_000)}1 * * * *`,
      `${'*/'.repeat(50_000)} * * * *`,
      `${'1-'.repeat(50_000)}1 * * * *`,
      `${'a'.repeat(100_000)} * * * *`,
      `${' '.repeat(100_000)}* * * * *`,
      `* * * * *${' '.repeat(100_000)}x`,
    ]) {
      expect(() => interpretarCron(e)).toThrow(ErrorWolf);
    }
    expect(Date.now() - t0).toBeLessThan(500);
  });

  it('un tipo que no es texto se rechaza', () => {
    expect(() => interpretarCron(5 as unknown as string)).toThrow(ErrorWolf);
    expect(() => interpretarCron(null as unknown as string)).toThrow(ErrorWolf);
  });
});

describe('siguiente', () => {
  it('* * * * * es el minuto siguiente, nunca el mismo instante', () => {
    expect(sig('* * * * *', '2026-05-10T10:00:00Z')).toBe('2026-05-10T10:01:00.000Z');
    expect(sig('* * * * *', '2026-05-10T10:00:30Z')).toBe('2026-05-10T10:01:00.000Z');
    expect(sig('* * * * *', '2026-05-10T10:00:59.999Z')).toBe('2026-05-10T10:01:00.000Z');
  });

  it('*/15 9-17 * * 1-5 respeta horas y días de semana', () => {
    // 2026-05-08 es viernes; 17:45 es la última del día.
    expect(sig('*/15 9-17 * * 1-5', '2026-05-08T17:45:00Z')).toBe('2026-05-11T09:00:00.000Z');
    expect(sig('*/15 9-17 * * 1-5', '2026-05-08T08:59:00Z')).toBe('2026-05-08T09:00:00.000Z');
    expect(sig('*/15 9-17 * * 1-5', '2026-05-08T09:00:00Z')).toBe('2026-05-08T09:15:00.000Z');
  });

  it('0 3 * * * es todos los días a las 3:00', () => {
    expect(sig('0 3 * * *', '2026-05-10T03:00:00Z')).toBe('2026-05-11T03:00:00.000Z');
    expect(sig('0 3 * * *', '2026-05-10T02:59:59Z')).toBe('2026-05-10T03:00:00.000Z');
  });

  it('0 0 29 2 * salta hasta el próximo año bisiesto', () => {
    expect(sig('0 0 29 2 *', '2026-03-01T00:00:00Z')).toBe('2028-02-29T00:00:00.000Z');
    expect(sig('0 0 29 2 *', '2096-03-01T00:00:00Z')).toBe('2104-02-29T00:00:00.000Z');
  });

  it('día del mes y de la semana juntos: vale cualquiera de los dos', () => {
    // El 1 o los lunes.
    expect(sig('0 0 1 * 1', '2026-05-02T00:00:00Z')).toBe('2026-05-04T00:00:00.000Z');
    expect(sig('0 0 1 * 1', '2026-05-31T00:00:00Z')).toBe('2026-06-01T00:00:00.000Z');
  });

  it('el domingo vale 0 y 7', () => {
    expect(sig('0 0 * * 7', '2026-05-08T00:00:00Z')).toBe('2026-05-10T00:00:00.000Z');
    expect(sig('0 0 * * 0', '2026-05-08T00:00:00Z')).toBe('2026-05-10T00:00:00.000Z');
  });

  it('pasos con rango y nombres', () => {
    expect(sig('0-30/10 5 * * *', '2026-05-10T05:10:00Z')).toBe('2026-05-10T05:20:00.000Z');
    expect(sig('0 0 1 JUL *', '2026-05-10T00:00:00Z')).toBe('2026-07-01T00:00:00.000Z');
  });

  it('pasa de año', () => {
    expect(sig('0 0 1 1 *', '2026-05-10T00:00:00Z')).toBe('2027-01-01T00:00:00.000Z');
  });

  describe('horario de verano (zona fija America/New_York)', () => {
    const zona = 'America/New_York';
    it('la hora que no existe (2:30 del 8-mar-2026) se salta ese día', () => {
      // 2026-03-08 07:00Z = 02:00 EST... justo antes del salto: 06:59Z = 01:59 EST.
      expect(sig('30 2 * * *', '2026-03-08T00:00:00Z', zona)).toBe('2026-03-09T06:30:00.000Z');
    });
    it('una tarea de las 3:00 corre normal el día del salto (EDT = UTC-4)', () => {
      expect(sig('0 3 * * *', '2026-03-08T00:00:00Z', zona)).toBe('2026-03-08T07:00:00.000Z');
    });
    it('la hora repetida (1:30 del 1-nov-2026) corre una sola vez, la primera', () => {
      const primera = '2026-11-01T05:30:00.000Z'; // 1:30 EDT
      expect(sig('30 1 * * *', '2026-11-01T00:00:00Z', zona)).toBe(primera);
      // Desde la primera ocurrencia, la siguiente es al día siguiente (1:30 EST = 06:30Z).
      expect(sig('30 1 * * *', primera, zona)).toBe('2026-11-02T06:30:00.000Z');
    });
    it('cada hora (hora comodín) también corre en la hora repetida: ni se repite ni se pierde', () => {
      let t = utc('2026-11-01T04:00:00Z');
      const horas: string[] = [];
      for (let i = 0; i < 4; i++) {
        t = siguiente(interpretarCron('0 * * * *'), t, zona);
        horas.push(t.toISOString());
      }
      // 1:00 EDT, 1:00 EST, 2:00 EST, 3:00 EST: una hora de diferencia entre cada una.
      expect(horas).toEqual([
        '2026-11-01T05:00:00.000Z',
        '2026-11-01T06:00:00.000Z',
        '2026-11-01T07:00:00.000Z',
        '2026-11-01T08:00:00.000Z',
      ]);
    });
    it('con hora fija, la segunda vuelta de la hora repetida no cuenta aunque se pida desde ella', () => {
      // Desde las 1:10 EST (segunda vuelta) la próxima de 1:30 es la de mañana.
      expect(sig('30 1 * * *', '2026-11-01T06:10:00Z', zona)).toBe('2026-11-02T06:30:00.000Z');
    });
  });

  it('una zona que no existe cae en UTC sin lanzar', () => {
    expect(sig('0 3 * * *', '2026-05-10T00:00:00Z', 'No/Existe')).toBe('2026-05-10T03:00:00.000Z');
  });
});
