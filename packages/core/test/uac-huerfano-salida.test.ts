import { describe, expect, it } from 'vitest';
import { SALIDA_COPIA } from '../src/plataforma/hostsAdmin';
import { PlataformaWindows } from '../src/plataforma/win';

describe('F7: el exterior traduce el código «huérfano» a un plazo vencido', () => {
  it('un permiso aceptado tarde (el lanzador ya no existía) se informa como tiempo, sin cambios', async () => {
    const p = new PlataformaWindows(
      async () => ({ codigo: SALIDA_COPIA.huerfano, stdout: '', stderr: '' }),
      undefined,
      { entorno: { SystemRoot: String.raw`C:\Windows` } },
    );
    expect(await p.purgarListaEspera()).toEqual({ ok: false, motivo: 'tiempo' });
    expect(await p.quitarSoloLecturaHosts()).toEqual({ ok: false, motivo: 'tiempo' });
  });
});
