import { spawn } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { PlataformaWindows } from '../src/plataforma/index';

/** Consultas reales de Windows: solo leen, no cambian nada del equipo. */
describe.skipIf(process.platform !== 'win32')('PlataformaWindows real (solo Windows)', () => {
  const hijos: { kill(): boolean }[] = [];
  afterEach(() => {
    for (const h of hijos.splice(0)) h.kill();
  });

  it('buscarEjecutable encuentra cmd en el PATH', async () => {
    const r = await new PlataformaWindows().buscarEjecutable('cmd');
    expect(r?.toLowerCase()).toMatch(/\\system32\\cmd\.exe$/);
  });

  it('descendientes ve un hijo de este proceso', async () => {
    const hijo = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], {
      windowsHide: true,
      stdio: 'ignore',
    });
    hijos.push(hijo);
    await new Promise((r) => hijo.once('spawn', r));
    const d = await new PlataformaWindows().descendientes([process.pid]);
    expect(d.get(process.pid)).toContain(hijo.pid);
  }, 30_000);

  it('rangosReservados devuelve rangos válidos (o ninguno)', async () => {
    const r = await new PlataformaWindows().rangosReservados('tcp');
    for (const x of r) {
      expect(x.desde).toBeGreaterThan(0);
      expect(x.hasta).toBeGreaterThanOrEqual(x.desde);
      expect(x.hasta).toBeLessThanOrEqual(65535);
    }
  }, 30_000);
});
