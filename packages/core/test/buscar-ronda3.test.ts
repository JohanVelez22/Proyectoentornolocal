import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buscar, type LimitesBusqueda, type ResultadoBusqueda } from '../src/herramientas/buscar';
import { carpetaTemporal } from './temporales';

/** D44, tercera ronda: memoria acotada con muchas coincidencias y errores que no se tapan. */
async function escenario() {
  const raiz = realpathSync.native(await carpetaTemporal('pel-buscar3-'));
  mkdirSync(raiz, { recursive: true });
  const poner = (rel: string, contenido: string): void =>
    writeFileSync(path.join(raiz, rel), contenido);
  const correr = async (
    consulta: string,
    o: { regex?: boolean; contexto?: number; limites?: Partial<LimitesBusqueda> } = {},
  ) => {
    const res: ResultadoBusqueda[] = [];
    const resumen = await buscar(
      {
        raiz,
        consulta,
        modo: 'contenido',
        regex: o.regex ?? false,
        mayusculas: false,
        incluir: [],
        excluir: [],
        ...(o.contexto === undefined ? {} : { contexto: o.contexto }),
      },
      (r) => res.push(r),
      new AbortController().signal,
      o.limites ? { limites: o.limites } : {},
    );
    return { res, resumen };
  };
  return { poner, correr };
}

describe('N-1: un archivo con millones de coincidencias no dispara la memoria', () => {
  it('2,5 millones de líneas «a» con contexto 5: tope de 2 000, truncado y heap acotado', async () => {
    const e = await escenario();
    e.poner('muchas.txt', 'a\n'.repeat(2_500_000));
    globalThis.gc?.();
    const base = process.memoryUsage().heapUsed;
    let pico = base;
    const reloj = setInterval(() => {
      pico = Math.max(pico, process.memoryUsage().heapUsed);
    }, 2);
    try {
      const { res, resumen } = await e.correr('a', { contexto: 5 });
      pico = Math.max(pico, process.memoryUsage().heapUsed);
      expect(res).toHaveLength(2000);
      expect(resumen).toMatchObject({ truncado: true, coincidencias: 2000 });
      expect(res[1999]!.antes).toHaveLength(5);
    } finally {
      clearInterval(reloj);
    }
    // Antes del arreglo acumulaba millones de objetos (cientos de MB o más). Margen holgado.
    expect((pico - base) / (1024 * 1024)).toBeLessThan(250);
  }, 60_000);

  it('el cupo que queda se respeta entre archivos: el segundo solo aporta lo que falta', async () => {
    const e = await escenario();
    e.poner('a.txt', 'x\n'.repeat(30));
    e.poner('b.txt', 'x\n'.repeat(30));
    const { res, resumen } = await e.correr('x', { limites: { coincidencias: 40 } });
    expect(res).toHaveLength(40);
    expect(res.filter((r) => path.basename(r.archivo) === 'a.txt')).toHaveLength(30);
    expect(resumen.truncado).toBe(true);
  });
});

describe('N-3: un error del archivo no lo tapa el volcado de pendientes', () => {
  it('regex_lenta con coincidencias ya pendientes y el cupo justo sale como error, no como truncado', async () => {
    const e = await escenario();
    // Cinco coincidencias en el primer trozo y, más allá de 64 KB, una línea que agota la pila.
    const relleno = 'xx'.repeat(40_000);
    e.poner('a.txt', `aguja\naguja\naguja\naguja\naguja\n${relleno}\n${'ab'.repeat(2_400_000)}\n`);
    await expect(
      e.correr('aguja|^(a|b)*c', { regex: true, limites: { coincidencias: 5 } }),
    ).rejects.toMatchObject({ codigo: 'buscar.regex_lenta' });
    // Con cupo de sobra también es un error (nada se vuelca a medias).
    await expect(e.correr('aguja|^(a|b)*c', { regex: true })).rejects.toMatchObject({
      codigo: 'buscar.regex_lenta',
    });
  }, 60_000);
});
