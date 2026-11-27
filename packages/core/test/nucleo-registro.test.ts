import { describe, expect, it } from 'vitest';
import { DEFINICIONES } from '../src/servicios/datos';
import { Nucleo } from '../src/nucleo';
import { IDS_SERVICIO_DATOS } from '../src/tipos';

describe('Nucleo registra los servicios de datos', () => {
  it('importar solo nucleo.ts basta para tener las siete definiciones', () => {
    expect(Nucleo).toBeDefined();
    expect(DEFINICIONES.map((d) => d.id).sort()).toEqual([...IDS_SERVICIO_DATOS].sort());
  });
});
