import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  Busquedas,
  buscar,
  CADUCIDAD_RESULTADOS_MS,
  type FinBusqueda,
  type OpcionesBusqueda,
  type ResultadoBusqueda,
} from '../src/herramientas/buscar';

/** D44: Buscar pulido (grupos, contexto, topes, enlaces, binarios, veto, resultados registrados). */
let raiz: string;

beforeEach(async () => {
  raiz = await realpath(await mkdtemp(path.join(tmpdir(), 'wolf-buscar44-')));
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
  consulta: 'aguja',
  modo: 'ambos',
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

describe('Buscar (D44): grupos y vista previa', () => {
  it('separa por nombre y por contenido, con su tipo y los totales de cada grupo', async () => {
    await escribir('aguja.txt', 'nada');
    await escribir('otro.txt', 'una aguja aquí');
    await escribir('carpeta-aguja/x.txt', 'vacío');
    const { res, resumen } = await correr({});
    const nombres = res.filter((r) => r.tipo === 'nombre');
    const contenidos = res.filter((r) => r.tipo === 'contenido');
    expect(nombres.map(rel).sort()).toEqual(['aguja.txt', 'carpeta-aguja']);
    expect(nombres.find((r) => rel(r) === 'carpeta-aguja')?.esCarpeta).toBe(true);
    expect(nombres.find((r) => rel(r) === 'aguja.txt')?.esCarpeta).toBe(false);
    expect(contenidos.map(rel)).toEqual(['otro.txt']);
    expect(resumen).toMatchObject({ nombres: 2, contenidos: 1, coincidencias: 3 });
    // Cada resultado lleva un número propio dentro de la búsqueda.
    expect(new Set(res.map((r) => r.id)).size).toBe(3);
  });

  it('da la línea con contexto antes y después y marca dónde está la coincidencia', async () => {
    await escribir('f.txt', ['uno', 'dos', 'tres', 'una AGUJA aquí', 'cinco', 'seis', 'siete'].join('\r\n'));
    const { res } = await correr({ modo: 'contenido', contexto: 2 });
    expect(res).toHaveLength(1);
    const r = res[0]!;
    expect(r).toMatchObject({ linea: 4, extracto: 'una AGUJA aquí', antes: ['dos', 'tres'] });
    expect(r.despues).toEqual(['cinco', 'seis']);
    expect(r.extracto.slice(r.inicio, r.inicio + r.largo)).toBe('AGUJA');
  });

  it('el contexto en el borde del archivo es más corto y 0 lo quita', async () => {
    await escribir('f.txt', 'aguja\nsegunda\n');
    const c2 = await correr({ modo: 'contenido', contexto: 3 });
    expect(c2.res[0]).toMatchObject({ antes: [], despues: ['segunda'] });
    const c0 = await correr({ modo: 'contenido', contexto: 0 });
    expect(c0.res[0]).toMatchObject({ antes: [], despues: [] });
  });

  it('el contexto sobrevive al corte entre trozos de lectura (archivo mayor de 64 KB)', async () => {
    const relleno = Array.from({ length: 6000 }, (_, i) => `linea ${i}`);
    relleno[3000] = 'aquí la aguja';
    await escribir('grande.txt', relleno.join('\n'));
    const { res } = await correr({ modo: 'contenido', contexto: 2 });
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      linea: 3001,
      antes: ['linea 2998', 'linea 2999'],
      despues: ['linea 3001', 'linea 3002'],
    });
  });

  it('acota el largo de la línea y del contexto', async () => {
    const larga = 'x'.repeat(5000);
    await escribir('f.txt', `${larga}\nlínea con aguja ${larga}\n${larga}`);
    const { res } = await correr({ modo: 'contenido', contexto: 1 });
    const r = res[0]!;
    expect(r.extracto.length).toBeLessThanOrEqual(240);
    expect(r.antes[0]!.length).toBeLessThanOrEqual(200);
    expect(r.despues[0]!.length).toBeLessThanOrEqual(200);
    expect(r.extracto.slice(r.inicio, r.inicio + r.largo)).toBe('aguja');
  });

  it('un contexto fuera de 0 a 5 se rechaza con código', async () => {
    await escribir('f.txt', 'aguja');
    await expect(correr({ contexto: 6 })).rejects.toMatchObject({ codigo: 'buscar.consulta_invalida' });
    await expect(correr({ contexto: -1 })).rejects.toMatchObject({ codigo: 'buscar.consulta_invalida' });
  });
});

describe('Buscar (D44): qué se ignora', () => {
  it('ignora por defecto node_modules, vendor y .git aunque la ventana no lo pida; incluirPesadas lo cambia', async () => {
    await escribir('node_modules/m/i.js', 'aguja');
    await escribir('vendor/v.php', 'aguja');
    await escribir('.git/config', 'aguja');
    await escribir('src/ok.js', 'aguja');
    const normal = await correr({ modo: 'contenido' });
    expect(normal.res.map(rel)).toEqual(['src/ok.js']);
    const todo = await correr({ modo: 'contenido', incluirPesadas: true });
    expect(todo.res.map(rel).sort()).toEqual([
      '.git/config',
      'node_modules/m/i.js',
      'src/ok.js',
      'vendor/v.php',
    ]);
  });

  it('ignora binarios por bytes NUL y por extensión (sin abrirlos), pero los encuentra por nombre', async () => {
    await escribir('aguja.bin', Buffer.concat([Buffer.from('aguja'), Buffer.from([0, 1, 2])]));
    await escribir('foto-aguja.png', 'texto aguja que no es png');
    await escribir('ok.txt', 'aguja');
    const c = await correr({ modo: 'contenido' });
    expect(c.res.map(rel)).toEqual(['ok.txt']);
    expect(c.resumen.omitidos).toBe(2);
    const n = await correr({ modo: 'nombre' });
    expect(n.res.map(rel).sort()).toEqual(['aguja.bin', 'foto-aguja.png']);
  });

  it('no sigue enlaces simbólicos ni uniones, a archivos ni a carpetas', async () => {
    const fuera = await realpath(await mkdtemp(path.join(tmpdir(), 'wolf-buscar44-fuera-')));
    await writeFile(path.join(fuera, 'secreto.txt'), 'aguja');
    try {
      await escribir('real/dato.txt', 'aguja');
      try {
        await symlink(fuera, path.join(raiz, 'salida'), 'junction');
        await symlink(path.join(fuera, 'secreto.txt'), path.join(raiz, 'enlace.txt'), 'file');
      } catch {
        return; // sin permiso para crear enlaces (Windows sin modo desarrollador)
      }
      const { res } = await correr({ modo: 'contenido' });
      expect(res.map(rel)).toEqual(['real/dato.txt']);
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });

  it('rechaza una raíz UNC y no entra en la carpeta de datos de WolfCore', async () => {
    await expect(correr({ raiz: '\\\\localhost\\C$\\x' })).rejects.toMatchObject({
      codigo: 'buscar.raiz_invalida',
    });
    await expect(correr({ raiz: '//servidor/recurso' })).rejects.toMatchObject({
      codigo: 'buscar.raiz_invalida',
    });
    await escribir('datos/data/sitios.json', 'aguja');
    await escribir('proyecto/a.txt', 'aguja');
    // Desde dentro de la carpeta de datos: se rechaza.
    await expect(
      correr({ raiz: path.join(raiz, 'datos', 'data'), vetadas: [path.join(raiz, 'datos')] }),
    ).rejects.toMatchObject({ codigo: 'buscar.ruta_vetada' });
    // Desde una carpeta que la contiene: se salta.
    const { res } = await correr({ modo: 'contenido', vetadas: [path.join(raiz, 'datos')] });
    expect(res.map(rel)).toEqual(['proyecto/a.txt']);
    // Tampoco por nombre.
    const n = await correr({ consulta: 'datos', modo: 'nombre', vetadas: [path.join(raiz, 'datos')] });
    expect(n.res).toHaveLength(0);
  });
});

describe('Buscar (D44): topes y cancelación', () => {
  it('corta al llegar al tope de archivos examinados, de resultados y de bytes leídos', async () => {
    for (let i = 0; i < 10; i++) await escribir(`d${i}.txt`, 'aguja\n'.repeat(5));
    const porArchivos = await correr({}, { limites: { archivosExaminados: 3 } });
    expect(porArchivos.resumen).toMatchObject({ truncado: true, examinados: 3 });
    const porResultados = await correr({}, { limites: { coincidencias: 4 } });
    expect(porResultados.resumen).toMatchObject({ truncado: true, coincidencias: 4 });
    const porBytes = await correr({ modo: 'contenido' }, { limites: { bytesTotales: 40 } });
    expect(porBytes.resumen.truncado).toBe(true);
    expect(porBytes.res.length).toBeLessThan(50);
  });

  it('corta por tiempo y por tamaño de archivo, y se salta lo que pasa de la profundidad', async () => {
    await escribir('a/b/c/d.txt', 'aguja');
    await escribir('grande.txt', 'aguja'.repeat(100));
    const prof = await correr({ modo: 'contenido' }, { limites: { profundidad: 1 } });
    expect(prof.res.map(rel)).toContain('grande.txt');
    expect(prof.res.map(rel)).not.toContain('a/b/c/d.txt');
    const tam = await correr({ modo: 'contenido' }, { limites: { bytesPorArchivo: 100 } });
    expect(tam.res.map(rel)).not.toContain('grande.txt');
    let t = 0;
    const reloj = { ahora: () => (t += 1000), limites: { plazoMs: 2500 } };
    const tiempo = await correr({}, reloj);
    expect(tiempo.resumen.truncado).toBe(true);
  });

  it('se puede cancelar a media búsqueda', async () => {
    for (let i = 0; i < 30; i++) await escribir(`d${i}.txt`, 'aguja');
    const control = new AbortController();
    const res: ResultadoBusqueda[] = [];
    const resumen = await buscar(
      base({}),
      (r) => {
        res.push(r);
        if (res.length === 3) control.abort();
      },
      control.signal,
    );
    expect(resumen.cancelado).toBe(true);
    expect(res.length).toBeLessThan(30);
  });
});

describe('Busquedas (D44): resultados que registra el núcleo', () => {
  const esperarFin = (fines: FinBusqueda[]): Promise<void> =>
    new Promise((resolve) => {
      const t = setInterval(() => {
        if (fines.length >= 1) {
          clearInterval(t);
          resolve();
        }
      }, 5);
    });

  async function buscarYEsperar(reloj?: () => number) {
    const lotes: ResultadoBusqueda[] = [];
    const fines: FinBusqueda[] = [];
    const b = new Busquedas(
      { resultado: (l) => lotes.push(...l.resultados), fin: (f) => fines.push(f) },
      reloj ? { ahora: reloj } : {},
    );
    const id = b.iniciar(base({ modo: 'ambos' }));
    await esperarFin(fines);
    return { b, id, lotes };
  }

  it('devuelve la ruta de un resultado del propio núcleo, y nada más', async () => {
    await escribir('src/a.txt', 'aguja');
    await escribir('carpeta-aguja/x.txt', 'vacío');
    const { b, id, lotes } = await buscarYEsperar();
    const archivo = lotes.find((r) => r.tipo === 'contenido')!;
    expect(await b.rutaDeResultado(id, archivo.id)).toBe(archivo.archivo);
    // Una carpeta no se abre en el editor.
    const carpeta = lotes.find((r) => r.esCarpeta)!;
    await expect(b.rutaDeResultado(id, carpeta.id)).rejects.toMatchObject({
      codigo: 'buscar.resultado_invalido',
    });
    // Ni un número que no es de esta búsqueda, ni una búsqueda que no existe.
    await expect(b.rutaDeResultado(id, 999)).rejects.toMatchObject({
      codigo: 'buscar.resultado_invalido',
    });
    await expect(b.rutaDeResultado('b-inventada', archivo.id)).rejects.toMatchObject({
      codigo: 'buscar.resultado_caducado',
    });
    // Una ruta en lugar del id no sirve.
    await expect(
      b.rutaDeResultado(id, path.join(raiz, 'src', 'a.txt') as unknown as number),
    ).rejects.toMatchObject({ codigo: 'buscar.resultado_invalido' });
  });

  it('un resultado caduca a los 15 minutos y también si el archivo desaparece', async () => {
    await escribir('a.txt', 'aguja');
    await escribir('b.txt', 'aguja');
    let ahora = 1_000_000;
    const { b, id, lotes } = await buscarYEsperar(() => ahora);
    const [uno, dos] = lotes.filter((r) => r.tipo === 'contenido');
    await rm(dos!.archivo);
    await expect(b.rutaDeResultado(id, dos!.id)).rejects.toMatchObject({
      codigo: 'buscar.resultado_caducado',
    });
    expect(await b.rutaDeResultado(id, uno!.id)).toBe(uno!.archivo);
    ahora += CADUCIDAD_RESULTADOS_MS + 1;
    await expect(b.rutaDeResultado(id, uno!.id)).rejects.toMatchObject({
      codigo: 'buscar.resultado_caducado',
    });
  });
});
