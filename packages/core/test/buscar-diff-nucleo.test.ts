import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { EjecutorDiff } from '../src/herramientas/diffCarpetas';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { carpetaTemporal } from './temporales';

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: true }).catch(() => undefined);
  nucleo = null;
});

async function crear(ejecutorDiff?: EjecutorDiff) {
  const raiz = realpathSync.native(await carpetaTemporal('pel-d44-nucleo-'));
  const base = path.join(raiz, 'datos');
  mkdirSync(base, { recursive: true });
  nucleo = await Nucleo.crear({
    base,
    aislado: true,
    plataforma: new PlataformaFalsa({ carpetaDatos: base }),
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
    ...(ejecutorDiff ? { ejecutorDiff } : {}),
  });
  return { n: nucleo, raiz, base };
}

describe('Nucleo: Buscar y Diff de carpetas (D44)', () => {
  it('M-4: cerrar el núcleo cancela el diff en curso y la búsqueda en curso', async () => {
    let senal: AbortSignal | undefined;
    const { n, raiz } = await crear(
      (_m, o) =>
        new Promise((resolve) => {
          senal = o.senal;
          o.senal?.addEventListener('abort', () =>
            resolve({ ok: false, codigo: 'diff.cancelado' }),
          );
        }),
    );
    const a = path.join(raiz, 'A');
    const b = path.join(raiz, 'B');
    mkdirSync(a);
    mkdirSync(b);
    const comparacion = n.diffCarpetas.comparar(a, b).then(
      () => null,
      (e: unknown) => e,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(senal?.aborted).toBe(false);
    for (let i = 0; i < 200; i++) writeFileSync(path.join(a, `f${i}.txt`), 'aguja');
    const id = n.iniciarBusqueda({
      raiz: a,
      consulta: 'aguja',
      modo: 'contenido',
      regex: false,
      mayusculas: false,
      incluir: [],
      excluir: [],
    });
    await n.cerrar({ detenerServicios: false });
    expect(senal?.aborted).toBe(true);
    expect(await comparacion).toMatchObject({ codigo: 'diff.cancelado' });
    // La búsqueda ya no está en curso: cancelarla de nuevo no encuentra nada.
    await new Promise((r) => setTimeout(r, 100));
    expect(n.cancelarBusqueda(id)).toBe(false);
  });

  it('la búsqueda y el diff no entran en la carpeta de datos del núcleo', async () => {
    const { n, raiz, base } = await crear();
    mkdirSync(path.join(base, 'data'), { recursive: true });
    writeFileSync(path.join(base, 'data', 'sitios.json'), 'aguja');
    writeFileSync(path.join(raiz, 'a.txt'), 'aguja');
    const lotes: string[] = [];
    const baja = n.eventos.on('busqueda:resultado', (l) =>
      lotes.push(...l.resultados.map((r) => r.archivo)),
    );
    const id = n.iniciarBusqueda({
      raiz,
      consulta: 'aguja',
      modo: 'contenido',
      regex: false,
      mayusculas: false,
      incluir: [],
      excluir: [],
    });
    await new Promise<void>((resolve) => {
      const off = n.eventos.on('busqueda:fin', (f) => {
        if (f.id === id) {
          off();
          resolve();
        }
      });
    });
    baja();
    expect(lotes.map((x) => path.basename(x))).toEqual(['a.txt']);
    await expect(n.diffCarpetas.comparar(path.join(base, 'data'), raiz)).rejects.toMatchObject({
      codigo: 'diff.ruta_vetada',
    });
  });
});
