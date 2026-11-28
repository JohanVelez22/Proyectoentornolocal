import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { EstimacionMemoria } from '../src/shared/api';
import { useEstimacionMemoria } from '../src/renderer/composables/useEstimacionMemoria';

// La estimación de «Liberar memoria» no bloquea la interfaz (D54b): se cancela al cerrar y la
// respuesta tardía se descarta sin errores.

const est = (n: number): EstimacionMemoria =>
  ({ niveles: { liviano: { bytes: n, tipo: 'aprox' } } }) as unknown as EstimacionMemoria;

function diferido<T>() {
  let ok!: (v: T) => void;
  let mal!: (e: unknown) => void;
  const p = new Promise<T>((a, b) => {
    ok = a;
    mal = b;
  });
  return { p, ok, mal };
}

describe('useEstimacionMemoria', () => {
  it('mientras estima marca «calculando» y al llegar deja la estimación', async () => {
    const d = diferido<EstimacionMemoria>();
    const e = useEstimacionMemoria(() => d.p, vi.fn());
    const vigente = e.abrir();
    expect(e.calculando.value).toBe(true);
    d.ok(est(1));
    expect(await vigente).toBe(true);
    expect(e.calculando.value).toBe(false);
    expect(e.estimacion.value).toEqual(est(1));
  });

  it('cerrar sin esperar quita el indicador al instante y descarta la respuesta tardía', async () => {
    const d = diferido<EstimacionMemoria>();
    const e = useEstimacionMemoria(() => d.p, vi.fn());
    const vigente = e.abrir();
    e.cerrar();
    expect(e.calculando.value).toBe(false);
    d.ok(est(2));
    expect(await vigente).toBe(false);
    expect(e.estimacion.value).toBeNull();
    expect(e.calculando.value).toBe(false);
  });

  it('si falla después de cerrar, no hay error ni aviso; si falla abierta, se avisa una vez', async () => {
    const alFallar = vi.fn();
    const d = diferido<EstimacionMemoria>();
    const e = useEstimacionMemoria(() => d.p, alFallar);
    const cerrada = e.abrir();
    e.cerrar();
    d.mal(new Error('x'));
    expect(await cerrada).toBe(false);
    expect(alFallar).not.toHaveBeenCalled();

    const d2 = diferido<EstimacionMemoria>();
    const e2 = useEstimacionMemoria(() => d2.p, alFallar);
    const abierta = e2.abrir();
    d2.mal(new Error('y'));
    await abierta;
    expect(alFallar).toHaveBeenCalledTimes(1);
    expect(e2.calculando.value).toBe(false);
  });

  it('al reabrir, la respuesta de la ronda anterior no pisa a la nueva', async () => {
    const a = diferido<EstimacionMemoria>();
    const b = diferido<EstimacionMemoria>();
    const respuestas = [a.p, b.p];
    const e = useEstimacionMemoria(() => respuestas.shift()!, vi.fn());
    const r1 = e.abrir();
    e.cerrar();
    const r2 = e.abrir();
    b.ok(est(2));
    a.ok(est(1));
    expect(await r1).toBe(false);
    expect(await r2).toBe(true);
    expect(e.estimacion.value).toEqual(est(2));
  });
});

describe('BotonMemoria.vue: carga y cancelación', () => {
  const vue = readFileSync(
    path.join(__dirname, '..', 'src', 'renderer', 'componentes', 'BotonMemoria.vue'),
    'utf8',
  );
  it('cada nivel muestra un indicador de carga mientras se estima y hay un botón para cancelar', () => {
    expect(vue).toMatch(/<NSpin[^>]*v-if="calculando"[\s\S]*?data-cargando/);
    expect(vue).toContain('data-cancelar');
    expect(vue).toContain('@click="cancelarEstimacion"');
    // Al cerrar el desplegable se descarta la estimación.
    expect(vue).toMatch(/if \(!visible\) \{\s*cerrar\(\);/);
  });
});
