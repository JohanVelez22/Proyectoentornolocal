import { describe, expect, it, vi } from 'vitest';
import {
  crearSalida,
  SALIDA_APAGAR,
  SALIDA_CANCELAR,
  SALIDA_SIN_APAGAR,
  type VentanaSalida,
} from '../src/main/salida';

function ventanaFalsa(o: { minimizada?: boolean } = {}) {
  const llamadas: string[] = [];
  const v: VentanaSalida = {
    isDestroyed: () => false,
    isMinimized: () => o.minimizada === true,
    restore: () => llamadas.push('restore'),
    show: () => llamadas.push('show'),
    focus: () => llamadas.push('focus'),
    moveTop: () => llamadas.push('moveTop'),
    setAlwaysOnTop: (f) => llamadas.push(`encima:${f}`),
  };
  return { v, llamadas };
}

describe('Salir (diálogo "¿Apagar los servicios?")', () => {
  it('trae la ventana al frente, encima de todo y con foco, y ancla el diálogo a ella', async () => {
    const { v, llamadas } = ventanaFalsa({ minimizada: true });
    const preguntar = vi.fn(async (padre: VentanaSalida) => {
      expect(padre).toBe(v);
      expect(llamadas).toEqual(['restore', 'show', 'encima:true', 'moveTop', 'focus']);
      return SALIDA_APAGAR;
    });
    const terminar = vi.fn(async () => undefined);
    await crearSalida({ ventana: () => v, saliendo: () => false, preguntar, terminar }).salir();
    expect(terminar).toHaveBeenCalledWith(true);
    // Al cerrar el diálogo deja de estar siempre encima.
    expect(llamadas.at(-1)).toBe('encima:false');
  });

  it('un segundo Salir con el diálogo abierto lo vuelve a traer al frente (no se queda colgado)', async () => {
    const { v, llamadas } = ventanaFalsa();
    let responder!: (n: number) => void;
    const preguntar = vi.fn(() => new Promise<number>((r) => (responder = r)));
    const terminar = vi.fn(async () => undefined);
    const s = crearSalida({ ventana: () => v, saliendo: () => false, preguntar, terminar });
    const primero = s.salir();
    await Promise.resolve();
    expect(s.preguntando()).toBe(true);
    llamadas.length = 0;
    await s.salir();
    expect(preguntar).toHaveBeenCalledTimes(1);
    expect(llamadas).toEqual(['show', 'encima:true', 'moveTop', 'focus']);
    responder(SALIDA_SIN_APAGAR);
    await primero;
    expect(terminar).toHaveBeenCalledWith(false);
  });

  it('Cancelar no sale; un error del diálogo tampoco deja la salida bloqueada', async () => {
    const { v } = ventanaFalsa();
    const terminar = vi.fn(async () => undefined);
    const preguntar = vi
      .fn<(p: VentanaSalida) => Promise<number>>()
      .mockResolvedValueOnce(SALIDA_CANCELAR)
      .mockRejectedValueOnce(new Error('sin diálogo'))
      .mockResolvedValueOnce(SALIDA_APAGAR);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const s = crearSalida({ ventana: () => v, saliendo: () => false, preguntar, terminar });
    await s.salir();
    await s.salir();
    expect(terminar).not.toHaveBeenCalled();
    await s.salir();
    expect(terminar).toHaveBeenCalledWith(true);
  });

  it('sin ventana sale apagando todo; si ya se está saliendo no hace nada', async () => {
    const terminar = vi.fn(async () => undefined);
    const preguntar = vi.fn(async () => SALIDA_APAGAR);
    await crearSalida({ ventana: () => null, saliendo: () => false, preguntar, terminar }).salir();
    expect(terminar).toHaveBeenCalledWith(true);
    expect(preguntar).not.toHaveBeenCalled();
    terminar.mockClear();
    const { v } = ventanaFalsa();
    await crearSalida({ ventana: () => v, saliendo: () => true, preguntar, terminar }).salir();
    expect(terminar).not.toHaveBeenCalled();
  });
});
