import { describe, expect, it } from 'vitest';
import { entornoDelHijo } from '../src/procesos/entorno';
import { ejecutorPorDefecto } from '../src/plataforma/win';
import { lanzadorPorDefecto } from '../src/plataforma/lanzar';

const LEER = [
  '-e',
  'process.stdout.write(String(process.env.TUNNEL_TOKEN ?? "") + "|" + String(process.env.OTRA ?? ""))',
];

describe('entorno de los procesos hijos', () => {
  it('entornoDelHijo quita los prefijos, conserva lo demás y aplica env y envSecreto', () => {
    expect(
      entornoDelHijo(
        { A: '1', TUNNEL_TOKEN: 'x', tunnel_otra: 'y' },
        { env: { B: '2' }, envSecreto: { C: '3' }, quitarEntorno: ['TUNNEL_'] },
      ),
    ).toEqual({ A: '1', B: '2', C: '3' });
  });

  it('el ejecutor por defecto no hereda TUNNEL_* con quitarEntorno', async () => {
    process.env['TUNNEL_TOKEN'] = 'heredado-ajeno';
    try {
      const sin = await ejecutorPorDefecto(process.execPath, LEER, {
        quitarEntorno: ['TUNNEL_'],
        env: { OTRA: 'si' },
      });
      expect(sin.stdout).toBe('|si');
      const con = await ejecutorPorDefecto(process.execPath, LEER);
      expect(con.stdout).toBe('heredado-ajeno|');
    } finally {
      delete process.env['TUNNEL_TOKEN'];
    }
  });

  it('el lanzador por defecto tampoco', async () => {
    process.env['TUNNEL_TOKEN'] = 'heredado-ajeno';
    try {
      const lineas: string[] = [];
      await lanzadorPorDefecto(process.execPath, LEER, {
        quitarEntorno: ['TUNNEL_'],
        env: { OTRA: 'si' },
        alLinea: (l) => lineas.push(l),
      });
      expect(lineas.join('')).toBe('|si');
    } finally {
      delete process.env['TUNNEL_TOKEN'];
    }
  });
});
