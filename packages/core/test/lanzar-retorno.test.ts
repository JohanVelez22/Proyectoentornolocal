import { describe, expect, it } from 'vitest';
import { lanzadorPorDefecto } from '../src/plataforma/lanzar';

// Escribe tres avances con \r (como el progreso de git), una pausa y luego una línea normal.
const SCRIPT =
  "process.stderr.write('a 1%\\ra 50%\\r');" +
  "setTimeout(() => { process.stderr.write('a 100%\\r\\nfin\\n'); }, 300);";

describe('lanzadorPorDefecto: cortarEnRetorno', () => {
  it('sin la opción, \\r no corta la línea (compatibilidad)', async () => {
    const lineas: string[] = [];
    await lanzadorPorDefecto(process.execPath, ['-e', SCRIPT], {
      alLinea: (l) => lineas.push(l),
    });
    expect(lineas).toEqual(['a 1%\ra 50%\ra 100%', 'fin']);
  });

  it('con la opción, cada tramo llega en vivo y sin líneas vacías', async () => {
    const lineas: { l: string; t: number }[] = [];
    const inicio = Date.now();
    await lanzadorPorDefecto(process.execPath, ['-e', SCRIPT], {
      cortarEnRetorno: true,
      alLinea: (l) => lineas.push({ l, t: Date.now() - inicio }),
    });
    expect(lineas.map((x) => x.l)).toEqual(['a 1%', 'a 50%', 'a 100%', 'fin']);
    // "a 50%" llega antes de la pausa, no al final del proceso
    expect(lineas[1]!.t).toBeLessThan(lineas[3]!.t - 150);
  });
});
