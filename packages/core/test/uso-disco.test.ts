import { linkSync, mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { opendir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  LIMITES_USO_DISCO,
  escanearUsoDisco,
  type LimitesUsoDisco,
  type NodoUso,
  type ProgresoUsoDisco,
} from '../src/herramientas/usoDisco';
import { carpetaTemporal } from './temporales';

/** D51: escáner de «Uso del disco» (la parte que corre en el proceso de trabajo). Solo carpetas temporales. */
async function escenario() {
  const raiz = realpathSync.native(await carpetaTemporal('pel-disco-'));
  const poner = (rel: string, bytes: number): string => {
    const d = path.join(raiz, ...rel.split('/'));
    mkdirSync(path.dirname(d), { recursive: true });
    writeFileSync(d, Buffer.alloc(bytes, 97));
    return d;
  };
  return { raiz, poner };
}

const lim = (o: Partial<LimitesUsoDisco> = {}): LimitesUsoDisco => ({ ...LIMITES_USO_DISCO, ...o });
const escanear = (raiz: string, o: Partial<LimitesUsoDisco> = {}) =>
  escanearUsoDisco({ op: 'escanear', raiz, lim: lim(o) });

const hijo = (n: NodoUso, nombre: string): NodoUso => {
  const h = n.hijos?.find((x) => x.nombre === nombre);
  if (!h) throw new Error(`no está ${nombre}`);
  return h;
};

/** ¿Se puede crear un enlace simbólico sin privilegios aquí? */
async function puedeEnlazar(): Promise<boolean> {
  const { raiz, poner } = await escenario();
  const destino = poner('x/a.txt', 1);
  try {
    symlinkSync(path.dirname(destino), path.join(raiz, 'prueba'), 'junction');
    return true;
  } catch {
    return false;
  }
}
const hayEnlaces = await puedeEnlazar();

describe('escanearUsoDisco', () => {
  it('suma los tamaños conocidos y cuenta archivos y carpetas', async () => {
    const { raiz, poner } = await escenario();
    poner('a/uno.txt', 1000);
    poner('a/dos.bin', 3000);
    poner('a/b/tres.txt', 500);
    poner('c/cuatro.log', 100);
    poner('suelto.txt', 7);
    const r = await escanear(raiz);
    expect(r.total).toBe(4607);
    expect(r.archivos).toBe(5);
    // Las carpetas que se recorrieron, sin contar la raíz: a, a/b y c.
    expect(r.carpetas).toBe(3);
    expect(r.arbol.tamano).toBe(4607);
    expect(r.truncado).toBe(false);
    expect(r.omitidos).toEqual({ enlaces: 0, denegados: 0, especiales: 0, enlacesDuros: 0 });
  });

  it('el árbol va ordenado por tamaño y cada carpeta suma lo suyo', async () => {
    const { raiz, poner } = await escenario();
    poner('pequena/x.txt', 100);
    poner('grande/y.bin', 5000);
    poner('grande/sub/z.bin', 3000);
    poner('media/w.bin', 800);
    const r = await escanear(raiz);
    expect(r.arbol.hijos?.map((h) => h.nombre)).toEqual(['grande', 'media', 'pequena']);
    const grande = hijo(r.arbol, 'grande');
    expect(grande.tamano).toBe(8000);
    expect(grande.tipo).toBe('carpeta');
    expect(hijo(grande, 'sub').tamano).toBe(3000);
    expect(hijo(grande, 'y.bin').tipo).toBe('archivo');
    expect(grande.archivos).toBe(2);
  });

  it('los 50 archivos y carpetas mayores salen ordenados y acotados', async () => {
    const { raiz, poner } = await escenario();
    for (let i = 1; i <= 60; i++) poner(`d${i}/f.dat`, i * 10);
    const r = await escanear(raiz, { archivosTop: 50, carpetasTop: 50 });
    expect(r.archivosTop).toHaveLength(50);
    expect(r.archivosTop[0]?.tamano).toBe(600);
    expect(r.archivosTop[49]?.tamano).toBe(110);
    expect(path.isAbsolute(r.archivosTop[0]!.ruta)).toBe(true);
    expect(r.carpetasTop).toHaveLength(50);
    expect(r.carpetasTop[0]).toMatchObject({ tamano: 600, archivos: 1 });
    expect(r.carpetasTop[0]!.ruta.endsWith('d60')).toBe(true);
    // Los porcentajes del árbol salen de aquí: el total sigue siendo el real aunque se recorte.
    expect(r.total).toBe(10 * ((60 * 61) / 2));
  });

  it('las carpetas de la lista cuentan lo que tienen directamente, sin sus subcarpetas', async () => {
    const { raiz, poner } = await escenario();
    poner('a/directo.bin', 100);
    poner('a/b/hondo.bin', 9000);
    const r = await escanear(raiz);
    const a = r.carpetasTop.find((c) => c.ruta.endsWith(`${path.sep}a`));
    expect(a?.tamano).toBe(100);
    expect(r.carpetasTop[0]?.ruta.endsWith(`${path.sep}b`)).toBe(true);
  });

  it('resume por extensión: las 20 mayores y «otros»', async () => {
    const { raiz, poner } = await escenario();
    for (let i = 1; i <= 25; i++) poner(`e/f.ext${String(i).padStart(2, '0')}`, i * 100);
    poner('e/MAYUS.TXT', 50);
    poner('e/minus.txt', 70);
    poner('e/sinext', 5);
    const r = await escanear(raiz, { extensionesTop: 20 });
    expect(r.extensiones.lista).toHaveLength(20);
    expect(r.extensiones.lista[0]).toEqual({ ext: 'ext25', bytes: 2500, archivos: 1 });
    // txt junta MAYUS.TXT y minus.txt sin distinguir mayúsculas.
    const todas = r.extensiones.lista.map((x) => x.ext);
    expect(todas).not.toContain('ext01');
    expect(r.extensiones.otros.archivos).toBe(25 + 3 - 20);
    expect(r.extensiones.otros.bytes).toBe(
      r.total - r.extensiones.lista.reduce((s, x) => s + x.bytes, 0),
    );
    const sin = await escanear((await escenarioConUno('sinext', 5)).raiz);
    expect(sin.extensiones.lista[0]?.ext).toBe('');
  });

  it('poda el árbol: lo que no llega al 0,5 % se resume en «otros»', async () => {
    const { raiz, poner } = await escenario();
    poner('enorme/x.bin', 100_000);
    for (let i = 0; i < 30; i++) poner(`migajas/m${i}.txt`, 100);
    for (let i = 0; i < 30; i++) poner(`polvo/p${i}.txt`, 1);
    const r = await escanear(raiz);
    // La carpeta pesa el 2,9 % y se queda; cada archivo (0,1 %) no llega al 0,5 % y se resume.
    const migajas = hijo(r.arbol, 'migajas');
    expect(migajas.tamano).toBe(3000);
    expect(migajas.hijos?.length).toBe(1);
    const otros = migajas.hijos?.find((h) => h.tipo === 'otros');
    expect(otros?.tamano).toBe(3000);
    expect(otros?.archivos).toBe(30);
    // «polvo» (30 bytes) no llega al umbral: la raíz lo resume en «otros» sin perder el total.
    expect(r.arbol.hijos?.some((h) => h.nombre === 'polvo')).toBe(false);
    expect(r.arbol.hijos?.reduce((s, h) => s + h.tamano, 0)).toBe(r.total);
  });

  it('nunca guarda más de N hijos por carpeta', async () => {
    const { raiz, poner } = await escenario();
    for (let i = 1; i <= 40; i++) poner(`f${String(i).padStart(2, '0')}.bin`, 1000 + i);
    const r = await escanear(raiz, { hijosPorNivel: 10 });
    const mostrados = r.arbol.hijos!.filter((h) => h.tipo !== 'otros');
    expect(mostrados).toHaveLength(10);
    expect(mostrados[0]?.tamano).toBe(1040);
    const otros = r.arbol.hijos!.find((h) => h.tipo === 'otros');
    expect(otros?.archivos).toBe(30);
    expect(r.arbol.hijos!.reduce((s, h) => s + h.tamano, 0)).toBe(r.total);
  });

  it('cuenta las carpetas y los archivos vacíos', async () => {
    const { raiz, poner } = await escenario();
    mkdirSync(path.join(raiz, 'vacia'));
    poner('cero.txt', 0);
    const r = await escanear(raiz);
    expect(r.total).toBe(0);
    expect(r.archivos).toBe(1);
    expect(r.carpetas).toBe(1);
    expect(r.arbol.hijos ?? []).toEqual([]);
  });

  it.skipIf(!hayEnlaces)('no sigue enlaces ni uniones: pesan 0 y se marcan', async () => {
    const { raiz, poner } = await escenario();
    const real = poner('real/dato.bin', 1000);
    symlinkSync(path.dirname(real), path.join(raiz, 'union'), 'junction');
    const r = await escanear(raiz);
    expect(r.total).toBe(1000);
    expect(r.archivos).toBe(1);
    expect(r.omitidos.enlaces).toBe(1);
    expect(r.enlaces).toHaveLength(1);
    expect(r.enlaces[0]!.endsWith('union')).toBe(true);
  });

  it('un enlace duro (mismo archivo, dos nombres) se cuenta una vez', async () => {
    const { raiz, poner } = await escenario();
    const original = poner('a/original.bin', 2000);
    try {
      linkSync(original, path.join(raiz, 'a', 'copia.bin'));
    } catch {
      return; // el sistema de archivos no admite enlaces duros: nada que comprobar
    }
    const r = await escanear(raiz);
    expect(r.total).toBe(2000);
    expect(r.archivos).toBe(2);
    expect(r.omitidos.enlacesDuros).toBe(1);
  });

  it('si el registro de enlaces duros se llena, sigue y avisa de que puede contar de más', async () => {
    const { raiz, poner } = await escenario();
    const o1 = poner('a/o1.bin', 100);
    const o2 = poner('a/o2.bin', 100);
    try {
      linkSync(o1, path.join(raiz, 'a', 'c1.bin'));
      linkSync(o2, path.join(raiz, 'a', 'c2.bin'));
    } catch {
      return;
    }
    const r = await escanear(raiz, { enlacesDurosMax: 1 });
    expect(r.enlacesDurosIncompleto).toBe(true);
    expect(r.total).toBeGreaterThanOrEqual(200);
  });

  it('una carpeta que no se puede leer suma al contador y el recorrido sigue', async () => {
    const { raiz, poner } = await escenario();
    poner('ok/a.bin', 300);
    poner('privada/b.bin', 999);
    const dep = {
      opendir: ((ruta: string) =>
        ruta.endsWith('privada')
          ? Promise.reject(Object.assign(new Error('EPERM'), { code: 'EPERM' }))
          : opendir(ruta)) as typeof opendir,
    };
    const r = await escanearUsoDisco({ op: 'escanear', raiz, lim: lim() }, { deps: dep });
    expect(r.total).toBe(300);
    expect(r.omitidos.denegados).toBe(1);
    expect(hijo(r.arbol, 'privada')).toMatchObject({ tamano: 0, denegado: true });
  });

  it('si la raíz no se puede leer, falla con el error del catálogo', async () => {
    const { raiz } = await escenario();
    await expect(escanear(path.join(raiz, 'no-existe'))).rejects.toMatchObject({
      codigo: 'disco.raiz_invalida',
    });
  });

  it('informa del progreso y respeta la cancelación', async () => {
    const { raiz, poner } = await escenario();
    for (let i = 0; i < 20; i++) poner(`d${i}/f.bin`, 100);
    const vistas: ProgresoUsoDisco[] = [];
    let t = 0;
    await escanearUsoDisco(
      { op: 'escanear', raiz, lim: lim({ intervaloProgresoMs: 0 }) },
      { alProgreso: (p) => vistas.push(p), ahora: () => (t += 1) },
    );
    expect(vistas.length).toBeGreaterThan(0);
    const ultima = vistas[vistas.length - 1]!;
    expect(ultima.archivos).toBe(20);
    expect(ultima.bytes).toBe(2000);
    // Solo crecen.
    for (let i = 1; i < vistas.length; i++) {
      expect(vistas[i]!.bytes).toBeGreaterThanOrEqual(vistas[i - 1]!.bytes);
    }

    const control = new AbortController();
    control.abort();
    await expect(
      escanearUsoDisco({ op: 'escanear', raiz, lim: lim() }, { senal: control.signal }),
    ).rejects.toMatchObject({ codigo: 'disco.cancelado' });
  });

  it('el plazo corta el recorrido con su error', async () => {
    const { raiz, poner } = await escenario();
    for (let i = 0; i < 10; i++) poner(`d${i}/f.bin`, 10);
    let t = 0;
    const p = escanearUsoDisco(
      { op: 'escanear', raiz, lim: lim({ plazoMs: 5 }) },
      { ahora: () => (t += 10) },
    );
    await expect(p).rejects.toBeInstanceOf(ErrorWolf);
    await expect(p).rejects.toMatchObject({ codigo: 'disco.plazo' });
  });

  it('la profundidad máxima marca el resultado como truncado', async () => {
    const { raiz, poner } = await escenario();
    poner('a/b/c/d/hondo.bin', 100);
    poner('a/alto.bin', 10);
    const r = await escanear(raiz, { profundidad: 2 });
    expect(r.truncado).toBe(true);
    expect(r.total).toBe(10);
  });

  it('no escribe ni cambia nada en la carpeta', async () => {
    const { raiz, poner } = await escenario();
    poner('a/x.txt', 5);
    const antes = JSON.stringify(await escanear(raiz).then((r) => r.arbol));
    const despues = JSON.stringify(await escanear(raiz).then((r) => r.arbol));
    expect(despues).toBe(antes);
  });
});

async function escenarioConUno(rel: string, bytes: number) {
  const e = await escenario();
  e.poner(rel, bytes);
  return e;
}
