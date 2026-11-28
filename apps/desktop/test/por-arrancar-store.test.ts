import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiEntorno, EstadoServicio, PendienteArranque } from '../src/shared/api';
import { RETARDO_PENDIENTES_MS, useServicios } from '../src/renderer/stores/servicios';

const redis: EstadoServicio = {
  id: 'redis',
  nombre: 'Redis',
  categoria: 'bd',
  version: '7',
  estado: 'apagado',
  puertos: [6379],
  pid: null,
};

describe('«Iniciar todo» cuenta lo que dice el núcleo (D54d)', () => {
  let porArrancar: ReturnType<typeof vi.fn<() => Promise<PendienteArranque[]>>>;
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    porArrancar = vi.fn(async () => [{ id: 'mailpit', nombre: 'Mailpit', tipo: 'datos' as const }]);
    vi.stubGlobal('window', {
      entorno: { servicios: { porArrancar } } as unknown as ApiEntorno,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('los cambios de estado seguidos piden una sola vez, con retardo', async () => {
    const s = useServicios();
    s.aplicar(redis);
    s.aplicar({ ...redis, estado: 'iniciando' });
    s.aplicar({ ...redis, estado: 'encendido' });
    expect(porArrancar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(RETARDO_PENDIENTES_MS);
    expect(porArrancar).toHaveBeenCalledTimes(1);
    // Incluye una herramienta con autoIniciar (Mailpit), como el núcleo.
    expect(s.porArrancar.map((p) => p.id)).toEqual(['mailpit']);
    expect(s.resumen.porArrancar).toBe(1);
  });

  it('la carga inicial lo pide y, si el núcleo no responde, conserva la última lista', async () => {
    const s = useServicios();
    s.hidratar([redis]);
    await vi.advanceTimersByTimeAsync(0);
    expect(s.resumen.porArrancar).toBe(1);
    porArrancar.mockRejectedValueOnce(new Error('sin núcleo'));
    await s.cargarPendientes();
    expect(s.resumen.porArrancar).toBe(1);
  });

  it('el store ya no filtra por su cuenta: no hay criterio local de herramientas ni FTP', () => {
    const f = readFileSync(
      join(__dirname, '..', 'src', 'renderer', 'stores', 'servicios.ts'),
      'utf8',
    );
    expect(f).toContain('servicios.porArrancar()');
    expect(f).not.toContain("s.categoria !== 'herramienta'");
  });
});
