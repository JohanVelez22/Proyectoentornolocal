import { describe, expect, it, vi } from 'vitest';
import { esErrorWolf } from '../src/errores';
import { crearPreparadorInstancias } from '../src/perfiles/prepararInstancia';

/** Reloj falso: dormir adelanta el tiempo sin esperar de verdad. */
function montar(estados: (llamada: number) => string | undefined) {
  let t = 0;
  let consultas = 0;
  const iniciar = vi.fn(async () => undefined);
  const progreso = vi.fn();
  const preparar = crearPreparadorInstancias({
    estadoDe: async () => {
      const e = estados(consultas++);
      return e === undefined ? undefined : { estado: e };
    },
    iniciar,
    progreso,
    ahora: () => t,
    dormir: async (ms) => {
      t += ms;
    },
  });
  return { preparar, iniciar, progreso, consultas: () => consultas, tiempo: () => t };
}

describe('prepararInstancia (D39, I1 e I2)', () => {
  it('una instancia ya encendida no se inicia', async () => {
    const m = montar(() => 'encendido');
    await m.preparar('mysql-1');
    expect(m.iniciar).not.toHaveBeenCalled();
  });

  it('espera hasta que enciende', async () => {
    const m = montar((n) => (n < 4 ? 'iniciando' : 'encendido'));
    await m.preparar('mysql-1');
    expect(m.iniciar).toHaveBeenCalledTimes(1);
  });

  it('15 bases de una instancia que nunca enciende esperan una sola vez', async () => {
    const m = montar(() => 'iniciando');
    const resultados: unknown[] = [];
    for (let i = 0; i < 15; i++) {
      resultados.push(await m.preparar('mysql-1').catch((e: unknown) => e));
    }
    expect(m.iniciar).toHaveBeenCalledTimes(1);
    expect(m.tiempo()).toBeLessThanOrEqual(91_000);
    for (const r of resultados) {
      expect(esErrorWolf(r) && r.codigo).toBe('servicios.no_encendio');
    }
  });

  it('un fallo recordado no se repite aunque la instancia cambie después', async () => {
    let fase = 0;
    const m = montar(() => (fase === 0 ? 'error' : 'encendido'));
    await expect(m.preparar('mysql-1')).rejects.toMatchObject({ codigo: 'servicios.no_encendio' });
    fase = 1;
    await expect(m.preparar('mysql-1')).rejects.toMatchObject({ codigo: 'servicios.no_encendio' });
    expect(m.iniciar).toHaveBeenCalledTimes(1);
  });

  it('cada instancia espera por separado', async () => {
    const m = montar(() => 'error');
    await m.preparar('a').catch(() => undefined);
    await m.preparar('b').catch(() => undefined);
    expect(m.iniciar).toHaveBeenCalledTimes(2);
  });

  it('corta enseguida si la instancia desaparece de la lista', async () => {
    const m = montar((n) => (n < 2 ? 'iniciando' : undefined));
    await expect(m.preparar('mysql-1')).rejects.toMatchObject({ codigo: 'servicios.no_encendio' });
    expect(m.tiempo()).toBeLessThan(5_000);
  });

  it('corta si pasa a apagado después de haberse visto iniciando', async () => {
    const m = montar((n) => (n < 2 ? 'iniciando' : 'apagado'));
    await expect(m.preparar('mysql-1')).rejects.toMatchObject({ codigo: 'servicios.no_encendio' });
    expect(m.tiempo()).toBeLessThan(5_000);
  });

  it('apagado sin haberse visto iniciando no corta: el arranque aún no se refleja', async () => {
    const m = montar((n) => (n < 2 ? 'apagado' : 'encendido'));
    await m.preparar('mysql-1');
    expect(m.iniciar).toHaveBeenCalledTimes(1);
  });

  it('emite progreso mientras espera', async () => {
    const m = montar((n) => (n < 12 ? 'iniciando' : 'encendido'));
    await m.preparar('mysql-1');
    expect(m.progreso).toHaveBeenCalled();
  });

  it('una instancia que no existe da servicios.desconocido', async () => {
    const m = montar(() => undefined);
    await expect(m.preparar('nada')).rejects.toMatchObject({ codigo: 'servicios.desconocido' });
    expect(m.iniciar).not.toHaveBeenCalled();
  });
});
