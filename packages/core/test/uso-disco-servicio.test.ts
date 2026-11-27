import {
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ejecutarUsoDiscoEnProceso,
  type EjecutorUsoDisco,
  type ProgresoUsoDisco,
  type RespuestaUsoDisco,
} from '../src/herramientas/usoDisco';
import {
  CADUCIDAD_USO_DISCO_MS,
  UsoDisco,
  type NodoUsoUi,
} from '../src/herramientas/usoDiscoServicio';
import type { UnidadDisco } from '../src/plataforma/tipos';
import { carpetaTemporal } from './temporales';

/** D51: servicio de «Uso del disco» en el proceso principal (valida, numera y guarda; no lee carpetas). */
async function escenario(
  unidades: UnidadDisco[] = [],
  ejecutor: EjecutorUsoDisco = ejecutarUsoDiscoEnProceso,
) {
  const raiz = realpathSync.native(await carpetaTemporal('pel-disco-srv-'));
  const poner = (rel: string, bytes: number): void => {
    const d = path.join(raiz, ...rel.split('/'));
    mkdirSync(path.dirname(d), { recursive: true });
    writeFileSync(d, Buffer.alloc(bytes, 98));
  };
  const progresos: ProgresoUsoDisco[] = [];
  let reloj = 1_000;
  const servicio = new UsoDisco({
    ejecutor,
    unidades: async () => unidades,
    progreso: (p) => progresos.push(p),
    ahora: () => reloj,
  });
  return { raiz, poner, servicio, progresos, avanzar: (ms: number) => (reloj += ms) };
}

const aplanar = (n: NodoUsoUi): NodoUsoUi[] => [n, ...(n.hijos ?? []).flatMap(aplanar)];

async function puedeEnlazar(): Promise<boolean> {
  const { raiz, poner } = await escenario();
  poner('x/a.txt', 1);
  try {
    symlinkSync(path.join(raiz, 'x'), path.join(raiz, 'u'), 'junction');
    return true;
  } catch {
    return false;
  }
}
const hayEnlaces = await puedeEnlazar();

describe('UsoDisco (servicio)', () => {
  it('analiza una carpeta, numera cada fila y da la ruta de cada nodo', async () => {
    const e = await escenario();
    e.poner('a/uno.bin', 4000);
    e.poner('a/b/dos.bin', 2000);
    e.poner('c/tres.bin', 1000);
    const r = await e.servicio.analizar(e.raiz);
    expect(r.total).toBe(7000);
    expect(r.id).toMatch(/^d/);
    const nodos = aplanar(r.arbol);
    expect(new Set(nodos.map((n) => n.id)).size).toBe(nodos.length);
    const a = r.arbol.hijos!.find((n) => n.nombre === 'a')!;
    expect(a.ruta).toBe(path.join(e.raiz, 'a'));
    expect(r.archivosTop[0]).toMatchObject({
      tamano: 4000,
      ruta: path.join(e.raiz, 'a', 'uno.bin'),
    });
    expect(typeof r.archivosTop[0]!.id).toBe('number');
    expect(r.carpetasTop.length).toBeGreaterThan(0);
  });

  it('reenvía el progreso', async () => {
    const e = await escenario([], async (m, o) => {
      o.alProgreso?.({ archivos: 1, carpetas: 0, bytes: 5, actual: 'x' });
      return ejecutarUsoDiscoEnProceso(m, o);
    });
    e.poner('a.bin', 5);
    await e.servicio.analizar(e.raiz);
    expect(e.progresos[0]).toEqual({ archivos: 1, carpetas: 0, bytes: 5, actual: 'x' });
  });

  it('rechaza rutas que no son una carpeta local normal', async () => {
    const e = await escenario();
    e.poner('f.txt', 1);
    for (const mala of [
      '',
      'relativa/ruta',
      '\\\\servidor\\recurso',
      '//servidor/recurso',
      path.join(e.raiz, 'no-existe'),
      path.join(e.raiz, 'f.txt'),
      `${e.raiz}${String.fromCharCode(0)}x`,
      'C:',
    ]) {
      await expect(e.servicio.analizar(mala), mala).rejects.toMatchObject({
        codigo: 'disco.raiz_invalida',
      });
    }
    await expect(e.servicio.analizar(5 as unknown as string)).rejects.toMatchObject({
      codigo: 'disco.raiz_invalida',
    });
  });

  it.skipIf(!hayEnlaces)('rechaza una raíz que es un enlace o una unión', async () => {
    const e = await escenario();
    e.poner('real/a.txt', 1);
    symlinkSync(path.join(e.raiz, 'real'), path.join(e.raiz, 'union'), 'junction');
    await expect(e.servicio.analizar(path.join(e.raiz, 'union'))).rejects.toMatchObject({
      codigo: 'disco.raiz_invalida',
    });
  });

  it('una unidad solo se analiza si está en la lista de unidades', async () => {
    const sinListar = await escenario([]);
    await expect(sinListar.servicio.analizarUnidad(sinListar.raiz)).rejects.toMatchObject({
      codigo: 'disco.raiz_invalida',
    });
    const conLista = await escenario();
    conLista.poner('a.bin', 10);
    const s = new UsoDisco({
      ejecutor: ejecutarUsoDiscoEnProceso,
      unidades: async () => [
        { ruta: conLista.raiz, etiqueta: '', tipo: 'fijo', total: 100, libre: 40 },
      ],
      progreso: () => undefined,
    });
    const r = await s.analizarUnidad(conLista.raiz);
    expect(r.total).toBe(10);
    expect(r.unidad).toEqual({ total: 100, libre: 40 });
    expect(await s.unidades()).toHaveLength(1);
    // Una subcarpeta de la unidad no es la unidad.
    await expect(s.analizarUnidad(path.join(conLista.raiz, 'x'))).rejects.toMatchObject({
      codigo: 'disco.raiz_invalida',
    });
  });

  it('solo corre un análisis a la vez, y se puede cancelar', async () => {
    let senal: AbortSignal | undefined;
    const e = await escenario([], (_m, o) => {
      senal = o.senal;
      return new Promise<RespuestaUsoDisco>((_resolver, rechazar) => {
        o.senal?.addEventListener('abort', () => rechazar(new Error('abortado')));
      });
    });
    const primero = e.servicio.analizar(e.raiz);
    // El segundo espera a que el primero haya tomado su turno.
    await new Promise((r) => setTimeout(r, 30));
    await expect(e.servicio.analizar(e.raiz)).rejects.toMatchObject({ codigo: 'disco.ocupado' });
    expect(e.servicio.cancelar()).toBe(true);
    expect(senal?.aborted).toBe(true);
    await expect(primero).rejects.toMatchObject({ codigo: 'disco.cancelado' });
    expect(e.servicio.cancelar()).toBe(false);
    // Libre otra vez.
    const otro = await escenario();
    otro.poner('x', 1);
    await expect(otro.servicio.analizar(otro.raiz)).resolves.toBeTruthy();
  });

  it('un error del trabajador sale con su código del catálogo; lo desconocido, como fallo', async () => {
    const e = await escenario([], async () => ({
      ok: false,
      codigo: 'disco.plazo',
      datos: { minutos: 30 },
    }));
    await expect(e.servicio.analizar(e.raiz)).rejects.toMatchObject({
      codigo: 'disco.plazo',
      datos: { minutos: 30 },
    });
    const raro = await escenario([], async () => ({ ok: false, codigo: 'servicios.x' }));
    await expect(raro.servicio.analizar(raro.raiz)).rejects.toMatchObject({
      codigo: 'disco.fallo',
    });
  });

  it('abrir sale del análisis guardado, nunca de una ruta de la ventana', async () => {
    const e = await escenario();
    e.poner('carpeta/archivo.bin', 3000);
    const r = await e.servicio.analizar(e.raiz);
    const carpeta = r.arbol.hijos!.find((n) => n.nombre === 'carpeta')!;
    const archivo = carpeta.hijos!.find((n) => n.nombre === 'archivo.bin')!;
    expect(await e.servicio.carpetaDe(r.id, carpeta.id)).toBe(path.join(e.raiz, 'carpeta'));
    // De un archivo se abre la carpeta que lo contiene.
    expect(await e.servicio.carpetaDe(r.id, archivo.id)).toBe(path.join(e.raiz, 'carpeta'));
    expect(await e.servicio.carpetaDe(r.id, r.archivosTop[0]!.id)).toBe(
      path.join(e.raiz, 'carpeta'),
    );
    await expect(e.servicio.carpetaDe(r.id, 99_999)).rejects.toMatchObject({
      codigo: 'disco.entrada_invalida',
    });
    await expect(e.servicio.carpetaDe(r.id, 1.5)).rejects.toMatchObject({
      codigo: 'disco.entrada_invalida',
    });
    await expect(e.servicio.carpetaDe('d-inventado', 1)).rejects.toMatchObject({
      codigo: 'disco.caducado',
    });
  });

  it('el análisis caduca y solo se guardan los últimos', async () => {
    const e = await escenario();
    e.poner('a', 1);
    const r = await e.servicio.analizar(e.raiz);
    expect(await e.servicio.carpetaDe(r.id, r.arbol.id)).toBe(e.raiz);
    e.avanzar(CADUCIDAD_USO_DISCO_MS + 1);
    await expect(e.servicio.carpetaDe(r.id, r.arbol.id)).rejects.toMatchObject({
      codigo: 'disco.caducado',
    });
    const a1 = await e.servicio.analizar(e.raiz);
    await e.servicio.analizar(e.raiz);
    await e.servicio.analizar(e.raiz);
    await expect(e.servicio.carpetaDe(a1.id, a1.arbol.id)).rejects.toMatchObject({
      codigo: 'disco.caducado',
    });
  });

  it('una carpeta que ya no existe no se abre', async () => {
    const e = await escenario();
    e.poner('x/a.bin', 1000);
    const r = await e.servicio.analizar(e.raiz);
    const x = r.arbol.hijos!.find((n) => n.nombre === 'x')!;
    await rm(path.join(e.raiz, 'x'), { recursive: true });
    await expect(e.servicio.carpetaDe(r.id, x.id)).rejects.toMatchObject({
      codigo: 'disco.entrada_invalida',
    });
  });
});

describe('Uso del disco: solo lectura y alcance', () => {
  it('el módulo que lee las carpetas no importa ni usa nada que escriba, borre o abra archivos', () => {
    const fuente = readFileSync(
      path.join(__dirname, '..', 'src', 'herramientas', 'usoDisco.ts'),
      'utf8',
    );
    const imports = fuente
      .split('\n')
      .filter((l) => /^import /.test(l))
      .join('\n');
    expect(imports).toContain("import { lstat, opendir } from 'node:fs/promises';");
    expect(imports).not.toMatch(/node:fs['"]|node:child_process|node:net|node:http/);
    expect(fuente).not.toMatch(
      /\b(writeFile|appendFile|createWriteStream|createReadStream|readFile|open|unlink|rm|rmdir|rename|mkdir|copyFile|truncate|chmod|utimes|symlink|link)\s*\(/,
    );
    // Ni la plataforma ni el sistema operativo: eso lo ve la lista de unidades, no el escáner.
    expect(fuente).not.toMatch(/process\.platform|path\.win32/);
  });

  it('ni el servidor MCP ni la CLI lo exponen', () => {
    const lee = (...p: string[]): string =>
      readFileSync(path.join(__dirname, '..', 'src', ...p), 'utf8');
    for (const f of [lee('mcp', 'servidor.ts'), lee('cli', 'ordenes.ts')]) {
      expect(f).not.toMatch(/usoDisco|UsoDisco|disco\.analizar/);
    }
  });

  it('el análisis no cambia nada en la carpeta', async () => {
    const e = await escenario();
    e.poner('a/x.bin', 10);
    e.poner('b/y.bin', 20);
    const lista = (d: string): string[] =>
      readdirSync(d, { recursive: true, withFileTypes: false }).map(String).sort();
    const antes = lista(e.raiz);
    await e.servicio.analizar(e.raiz);
    expect(lista(e.raiz)).toEqual(antes);
  });
});
