import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  Busquedas,
  buscar,
  type FinBusqueda,
  EXCLUIR_POR_DEFECTO,
  LIMITES_BUSQUEDA,
  type OpcionesBusqueda,
  type ResultadoBusqueda,
} from '../src/herramientas/buscar';

let raiz: string;

beforeEach(async () => {
  raiz = await mkdtemp(path.join(tmpdir(), 'wolf-buscar-'));
});
afterEach(async () => {
  await rm(raiz, { recursive: true, force: true });
});

const escribir = async (rel: string, contenido: string | Buffer): Promise<void> => {
  const destino = path.join(raiz, rel);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, contenido);
};

const base = (o: Partial<OpcionesBusqueda>): OpcionesBusqueda => ({
  raiz,
  consulta: 'x',
  modo: 'contenido',
  regex: false,
  mayusculas: false,
  incluir: [],
  excluir: [],
  ...o,
});

async function correr(
  o: Partial<OpcionesBusqueda>,
  deps: Parameters<typeof buscar>[3] = {},
  senal: AbortSignal = new AbortController().signal,
) {
  const res: ResultadoBusqueda[] = [];
  const resumen = await buscar(base(o), (r) => res.push(r), senal, deps);
  return { res, resumen };
}

const rel = (r: ResultadoBusqueda): string => path.relative(raiz, r.archivo).replace(/\\/g, '/');

describe('buscar', () => {
  it('encuentra por contenido con línea y columna, y por nombre', async () => {
    await escribir('a/uno.txt', 'hola\nmundo aguja aquí\n');
    await escribir('aguja.md', 'sin nada');
    const c = await correr({ consulta: 'aguja', modo: 'contenido' });
    expect(c.res).toHaveLength(1);
    expect(rel(c.res[0]!)).toBe('a/uno.txt');
    expect(c.res[0]).toMatchObject({ linea: 2, columna: 7 });
    expect(c.res[0]!.extracto).toContain('mundo aguja');
    const n = await correr({ consulta: 'aguja', modo: 'nombre' });
    expect(n.res.map(rel)).toEqual(['aguja.md']);
    expect(n.res[0]).toMatchObject({ linea: null, columna: null });
    const ambos = await correr({ consulta: 'aguja', modo: 'ambos' });
    expect(ambos.res.map(rel).sort()).toEqual(['a/uno.txt', 'aguja.md']);
    expect(ambos.resumen).toMatchObject({ archivos: 2, coincidencias: 2, truncado: false });
  });

  it('busca dentro de un archivo suelto y acepta CRLF y BOM', async () => {
    await escribir('f.txt', '﻿primera\r\nsegunda AGUJA\r\n');
    const { res } = await correr({ raiz: path.join(raiz, 'f.txt'), consulta: 'aguja' });
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ linea: 2, columna: 9 });
    expect(res[0]!.extracto).not.toContain('\r');
  });

  it('respeta mayúsculas, regex e incluir/excluir', async () => {
    await escribir('a.js', 'Foo foo FOO');
    await escribir('b.txt', 'foo');
    await escribir('sub/c.js', 'foo');
    const sens = await correr({ consulta: 'Foo', mayusculas: true, incluir: ['*.js'] });
    expect(sens.res).toHaveLength(1);
    expect(sens.res[0]!.columna).toBe(1);
    const ins = await correr({ consulta: 'foo', incluir: ['*.js'] });
    expect(ins.res.map((r) => `${rel(r)}:${r.columna}`).sort()).toEqual([
      'a.js:1',
      'a.js:5',
      'a.js:9',
      'sub/c.js:1',
    ]);
    const re = await correr({ consulta: 'f(o+)\\b', regex: true, mayusculas: true });
    expect(re.res.map((r) => `${rel(r)}:${r.columna}`).sort()).toEqual([
      'a.js:5',
      'b.txt:1',
      'sub/c.js:1',
    ]);
    const exc = await correr({ consulta: 'foo', excluir: ['sub', '*.txt'] });
    expect(new Set(exc.res.map(rel))).toEqual(new Set(['a.js']));
    // Un literal no es una expresión: los metacaracteres no se interpretan.
    await escribir('p.txt', 'a.c abc');
    const lit = await correr({ consulta: 'a.c', incluir: ['p.txt'] });
    expect(lit.res).toHaveLength(1);
  });

  it('rechaza una expresión inválida con código', async () => {
    await expect(correr({ consulta: '(', regex: true })).rejects.toMatchObject({
      codigo: 'buscar.regex_invalida',
    });
    await expect(correr({ consulta: '' })).rejects.toMatchObject({
      codigo: 'buscar.consulta_invalida',
    });
    await expect(correr({ raiz: path.join(raiz, 'no-existe') })).rejects.toMatchObject({
      codigo: 'buscar.raiz_invalida',
    });
  });

  it('salta node_modules (por defecto) y binarios', async () => {
    await escribir('node_modules/m/i.js', 'x aguja');
    await escribir('vendor/v.php', 'x aguja');
    await escribir('bin.dat', Buffer.concat([Buffer.from('aguja'), Buffer.from([0, 1, 2])]));
    await escribir('ok.txt', 'aguja');
    const { res } = await correr({ consulta: 'aguja', excluir: [...EXCLUIR_POR_DEFECTO] });
    expect(res.map(rel)).toEqual(['ok.txt']);
  });

  it('no sigue un enlace en bucle ni uno que sale de la carpeta', async () => {
    await escribir('real/dato.txt', 'aguja');
    const fuera = await mkdtemp(path.join(tmpdir(), 'wolf-buscar-fuera-'));
    await writeFile(path.join(fuera, 'secreto.txt'), 'aguja');
    try {
      await symlink(raiz, path.join(raiz, 'real', 'bucle'), 'junction');
      await symlink(fuera, path.join(raiz, 'salida'), 'junction');
    } catch {
      await rm(fuera, { recursive: true, force: true });
      return; // sin permiso para crear enlaces: se omite
    }
    try {
      const { res, resumen } = await correr({ consulta: 'aguja' });
      expect(res.map(rel)).toEqual(['real/dato.txt']);
      expect(resumen.truncado).toBe(false);
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });

  it('corta en el límite y marca truncado', async () => {
    for (let i = 0; i < 6; i++) await escribir(`d${i}.txt`, 'aguja\naguja\naguja\n');
    const porCoincidencias = await correr({ consulta: 'aguja' }, { limites: { coincidencias: 4 } });
    expect(porCoincidencias.res).toHaveLength(4);
    expect(porCoincidencias.resumen.truncado).toBe(true);
    const porArchivos = await correr(
      { consulta: 'aguja' },
      { limites: { archivosConResultado: 2 } },
    );
    expect(new Set(porArchivos.res.map(rel)).size).toBe(2);
    expect(porArchivos.resumen.truncado).toBe(true);
    const porExaminados = await correr(
      { consulta: 'aguja' },
      { limites: { archivosExaminados: 3 } },
    );
    expect(porExaminados.resumen.truncado).toBe(true);
  });

  it('respeta el tamaño por archivo y la profundidad', async () => {
    await escribir('grande.txt', 'aguja ' + 'a'.repeat(200));
    await escribir('n1/n2/n3/hondo.txt', 'aguja');
    const t = await correr(
      { consulta: 'aguja' },
      { limites: { bytesPorArchivo: 100, profundidad: 2 } },
    );
    expect(t.res).toEqual([]);
    const ok = await correr({ consulta: 'aguja' }, { limites: { profundidad: 5 } });
    expect(ok.res.map(rel).sort()).toEqual(['grande.txt', 'n1/n2/n3/hondo.txt']);
  });

  it('el plazo total corta y marca truncado', async () => {
    for (let i = 0; i < 20; i++) await escribir(`d${i}.txt`, 'aguja');
    let t = 0;
    const { resumen } = await correr(
      { consulta: 'aguja' },
      { ahora: () => (t += 1000), limites: { plazoMs: 3500 } },
    );
    expect(resumen.truncado).toBe(true);
  });

  it('cancelar detiene y marca cancelado', async () => {
    for (let i = 0; i < 30; i++) await escribir(`d${i}.txt`, 'aguja');
    const ac = new AbortController();
    let n = 0;
    const res: ResultadoBusqueda[] = [];
    const resumen = await buscar(
      base({ consulta: 'aguja' }),
      (r) => {
        res.push(r);
        if (++n === 3) ac.abort();
      },
      ac.signal,
    );
    expect(resumen.cancelado).toBe(true);
    expect(res.length).toBeLessThan(30);
    const ya = new AbortController();
    ya.abort();
    expect((await correr({ consulta: 'aguja' }, {}, ya.signal)).resumen.cancelado).toBe(true);
  });

  it('una regex catastrófica termina con buscar.regex_lenta', async () => {
    await escribir('trampa.txt', `${'a'.repeat(60)}b\n`);
    const t0 = Date.now();
    await expect(
      correr({ consulta: '(a+)+$', regex: true }, { plazoRegexMs: 200 }),
    ).rejects.toMatchObject({ codigo: 'buscar.regex_lenta' });
    expect(Date.now() - t0).toBeLessThan(5000);
  });

  it('una regex normal funciona por el mismo camino acotado', async () => {
    await escribir('r.txt', 'uno 123\ndos 45\n');
    const { res } = await correr({ consulta: '\\d+', regex: true });
    expect(res.map((r) => [r.linea, r.columna])).toEqual([
      [1, 5],
      [2, 5],
    ]);
  });

  it('un extracto muy largo se recorta', async () => {
    await escribir('l.txt', `${'z'.repeat(5000)} aguja ${'z'.repeat(5000)}`);
    const { res } = await correr({ consulta: 'aguja' });
    expect(res[0]!.extracto.length).toBeLessThanOrEqual(300);
    expect(res[0]!.extracto).toContain('aguja');
  });

  it('los límites públicos son los del plan', () => {
    expect(LIMITES_BUSQUEDA).toMatchObject({
      archivosConResultado: 10_000,
      coincidencias: 2_000,
      bytesPorArchivo: 5 * 1024 * 1024,
      profundidad: 40,
    });
    expect(EXCLUIR_POR_DEFECTO).toEqual([
      'node_modules',
      'vendor',
      '.git',
      '.venv',
      '__pycache__',
      'storage/framework',
    ]);
  });

  describe('Busquedas en segundo plano', () => {
    const esperarFin = (fines: FinBusqueda[], n = 1): Promise<void> =>
      new Promise((resolve) => {
        const t = setInterval(() => {
          if (fines.length >= n) {
            clearInterval(t);
            resolve();
          }
        }, 5);
      });

    it('devuelve el id enseguida y emite lotes y un fin', async () => {
      for (let i = 0; i < 5; i++) await escribir(`d${i}.txt`, 'aguja');
      const lotes: ResultadoBusqueda[] = [];
      const fines: FinBusqueda[] = [];
      const b = new Busquedas({
        resultado: (l) => lotes.push(...l.resultados),
        fin: (f) => fines.push(f),
      });
      const id = b.iniciar(base({ consulta: 'aguja' }));
      expect(id).toMatch(/^b/);
      expect(lotes).toHaveLength(0); // nada corre de forma síncrona
      await esperarFin(fines);
      expect(lotes).toHaveLength(5);
      expect(fines[0]).toMatchObject({ id, error: null, resumen: { coincidencias: 5 } });
    });

    it('cancelar por id cierra con cancelado y un error llega como fin con código', async () => {
      for (let i = 0; i < 50; i++) await escribir(`d${i}.txt`, 'aguja');
      const fines: FinBusqueda[] = [];
      const b = new Busquedas({ resultado: () => undefined, fin: (f) => fines.push(f) });
      const id = b.iniciar(base({ consulta: 'aguja' }));
      expect(b.cancelar(id)).toBe(true);
      expect(b.cancelar('no-existe')).toBe(false);
      await esperarFin(fines);
      expect(fines[0]!.resumen?.cancelado).toBe(true);
      b.iniciar(base({ consulta: '(', regex: true }));
      await esperarFin(fines, 2);
      expect(fines[1]).toMatchObject({ resumen: null, error: { codigo: 'buscar.regex_invalida' } });
    });

    it('limita las búsquedas simultáneas', async () => {
      await escribir('a.txt', 'x');
      const b = new Busquedas({ resultado: () => undefined, fin: () => undefined });
      const ids = [1, 2, 3].map(() => b.iniciar(base({ consulta: 'x' })));
      expect(() => b.iniciar(base({ consulta: 'x' }))).toThrowError(
        expect.objectContaining({ codigo: 'buscar.demasiadas' }),
      );
      ids.forEach((i) => b.cancelar(i));
      await new Promise((r) => setTimeout(r, 100));
    });
  });
});
