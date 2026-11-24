import { describe, expect, it, vi } from 'vitest';

const llamadas = vi.hoisted(() => [] as { cmd: string; opts: Record<string, unknown> }[]);

vi.mock('node:child_process', async (original) => {
  const real = await original<typeof import('node:child_process')>();
  return {
    ...real,
    spawn: ((cmd: string, args: string[], opts: Record<string, unknown>) => {
      llamadas.push({ cmd, opts });
      return real.spawn(cmd, args, opts as never);
    }) as typeof real.spawn,
  };
});

describe('lanzador de los pasos de receta (Composer, npm, pip…)', () => {
  it('lanza sin shell y con la ventana oculta', async () => {
    const { lanzadorPorDefecto } = await import('../src/plataforma/lanzar');
    const r = await lanzadorPorDefecto(process.execPath, ['-e', 'process.exit(0)']);
    expect(r.codigo).toBe(0);
    const l = llamadas.find((x) => x.cmd === process.execPath);
    expect(l?.opts.windowsHide).toBe(true);
    expect(l?.opts.shell).toBeFalsy();
  });
});
