import { describe, expect, it } from 'vitest';
import { PARAMETROS_ERROR } from '../src/errores';
import { segunEscritura } from '../src/doctor/revisiones/comun';

// Menor 8 (D54b): un permiso de administrador sin contestar a tiempo no se convierte siempre en el
// mensaje del archivo hosts: cada operación cuenta lo suyo.

describe('segunEscritura: el plazo vencido usa el mensaje de la operación', () => {
  it('por defecto es el genérico de una reparación (no habla del archivo hosts)', () => {
    expect(segunEscritura({ ok: false, motivo: 'tiempo' })).toEqual({
      ok: false,
      codigo: 'doctor.reparacion_tiempo',
    });
    expect(PARAMETROS_ERROR['doctor.reparacion_tiempo']).toEqual([]);
  });

  it('las operaciones sobre el archivo hosts piden su propio mensaje', () => {
    expect(segunEscritura({ ok: false, motivo: 'tiempo' }, 'hosts.tiempo_agotado')).toEqual({
      ok: false,
      codigo: 'hosts.tiempo_agotado',
    });
  });

  it('los demás motivos no cambian y el éxito sigue siendo éxito', () => {
    expect(segunEscritura({ ok: true })).toEqual({ ok: true });
    expect(segunEscritura({ ok: false, motivo: 'cancelado' })).toEqual({
      ok: false,
      codigo: 'doctor.reparacion_cancelada',
    });
    expect(segunEscritura({ ok: false, motivo: 'denegado' }, 'hosts.tiempo_agotado')).toEqual({
      ok: false,
      codigo: 'doctor.reparacion_denegada',
    });
    expect(segunEscritura({ ok: false, motivo: 'error' })).toEqual({
      ok: false,
      codigo: 'doctor.reparacion_fallida',
    });
  });
});
