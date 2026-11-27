import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { carpetaTemporal } from './temporales';

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: true }).catch(() => undefined);
  nucleo = null;
});

describe('Nucleo: Uso del disco (D51)', () => {
  it('analiza una carpeta temporal, avisa del progreso y lista las unidades de la plataforma', async () => {
    const raiz = realpathSync.native(await carpetaTemporal('pel-d51-nucleo-'));
    const base = path.join(raiz, 'datos');
    mkdirSync(base, { recursive: true });
    const falsa = new PlataformaFalsa({ carpetaDatos: base });
    falsa.unidades = [{ ruta: 'C:\\', etiqueta: 'Windows', tipo: 'fijo', total: 10, libre: 5 }];
    nucleo = await Nucleo.crear({
      base,
      aislado: true,
      plataforma: falsa,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
    });
    const datos = path.join(raiz, 'a');
    mkdirSync(datos);
    writeFileSync(path.join(datos, 'x.bin'), Buffer.alloc(1234));
    const avisos: number[] = [];
    nucleo.eventos.on('disco:progreso', (p) => avisos.push(p.bytes));
    const r = await nucleo.usoDisco.analizar(datos);
    expect(r.total).toBe(1234);
    expect(avisos[avisos.length - 1]).toBe(1234);
    expect(await nucleo.usoDisco.unidades()).toEqual([
      { ruta: 'C:\\', etiqueta: 'Windows', tipo: 'fijo', total: 10, libre: 5 },
    ]);
    // La carpeta de datos de WolfCore SÍ se puede analizar: es solo tamaño.
    const propia = await nucleo.usoDisco.analizar(base);
    expect(propia.total).toBeGreaterThanOrEqual(0);
  });
});
