import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  compararArchivo,
  compararCarpetas,
  diffLineasMyers,
  ejecutarDiffEnProceso,
  LIMITES_DIFF,
  operarDiff,
  resolverSeguro,
  type LimitesDiff,
  type ResultadoArchivoDiff,
} from '../src/herramientas/diffCarpetas';
import { CADUCIDAD_DIFF_MS, DiffCarpetas } from '../src/herramientas/diffCarpetasServicio';
import { carpetaTemporal } from './temporales';

/** D44: diff de carpetas (núcleo, servicio y solo lectura). */
async function escenario() {
  const raiz = realpathSync.native(await carpetaTemporal('pel-diff-'));
  const a = path.join(raiz, 'A');
  const b = path.join(raiz, 'B');
  mkdirSync(a);
  mkdirSync(b);
  const poner = (lado: string, rel: string, contenido: string | Buffer): void => {
    const d = path.join(lado, ...rel.split('/'));
    mkdirSync(path.dirname(d), { recursive: true });
    writeFileSync(d, contenido);
  };
  return { raiz, a, b, poner };
}

const lim = (o: Partial<LimitesDiff> = {}): LimitesDiff => ({ ...LIMITES_DIFF, ...o });
const carpetas = (a: string, b: string, o: Partial<LimitesDiff> = {}, vetadas: string[] = []) =>
  compararCarpetas({ op: 'carpetas', a, b, vetadas, lim: lim(o) });
const archivo = async (a: string, b: string, rel: string, o: Partial<LimitesDiff> = {}) =>
  compararArchivo({ op: 'archivo', a, b, rel, lim: lim(o) });
const texto = (r: ResultadoArchivoDiff) => {
  if (r.tipo !== 'texto') throw new Error(`se esperaba texto y fue ${r.tipo}`);
  return r;
};

/** Lista completa de un árbol con tamaño, fecha y hash: sirve para comprobar que no cambió nada. */
function instantanea(dir: string): string[] {
  const salida: string[] = [];
  const ir = (d: string): void => {
    for (const n of readdirSync(d).sort()) {
      const p = path.join(d, n);
      const s = statSync(p);
      if (s.isDirectory()) {
        salida.push(`D ${p} ${s.mtimeMs}`);
        ir(p);
      } else {
        const h = createHash('sha256').update(readFileSync(p)).digest('hex');
        salida.push(`F ${p} ${s.size} ${s.mtimeMs} ${h}`);
      }
    }
  };
  ir(dir);
  return salida;
}

describe('compararCarpetas: los tres grupos', () => {
  it('separa solo en A, solo en B y distintos (por tamaño y por contenido) e ignora lo igual', async () => {
    const e = await escenario();
    e.poner(e.a, 'igual.txt', 'igual');
    e.poner(e.a, 'sub/igual2.txt', 'otro igual');
    e.poner(e.b, 'igual.txt', 'igual');
    e.poner(e.b, 'sub/igual2.txt', 'otro igual');
    e.poner(e.a, 'solo-a.txt', 'a');
    e.poner(e.a, 'carpeta/solo-a/x.txt', 'xx');
    e.poner(e.b, 'solo-b.txt', 'bb');
    e.poner(e.a, 'tam.txt', 'corto');
    e.poner(e.b, 'tam.txt', 'más largo');
    e.poner(e.a, 'sub/cont.txt', 'AAAA');
    e.poner(e.b, 'sub/cont.txt', 'BBBB');
    const r = await carpetas(e.a, e.b);
    expect(r.soloA.map((x) => x.ruta)).toEqual(['carpeta/solo-a/x.txt', 'solo-a.txt']);
    expect(r.soloB.map((x) => x.ruta)).toEqual(['solo-b.txt']);
    expect(r.distintos.map((x) => [x.ruta, x.motivo])).toEqual([
      ['sub/cont.txt', 'contenido'],
      ['tam.txt', 'tamano'],
    ]);
    expect(r.resumen).toMatchObject({
      iguales: 2,
      totalSoloA: 2,
      totalSoloB: 1,
      totalDistintos: 2,
      truncado: false,
      recortado: false,
    });
    expect(r.soloA[0]).toMatchObject({ tamanoA: 2, tamanoB: null });
  });

  it('carpetas idénticas no dan nada en los tres grupos', async () => {
    const e = await escenario();
    e.poner(e.a, 'x/y.txt', 'hola');
    e.poner(e.b, 'x/y.txt', 'hola');
    const r = await carpetas(e.a, e.b);
    expect([r.soloA, r.soloB, r.distintos].map((g) => g.length)).toEqual([0, 0, 0]);
    expect(r.resumen.iguales).toBe(1);
  });

  it('no sigue enlaces simbólicos ni uniones', async () => {
    const e = await escenario();
    e.poner(e.a, 'real/dato.txt', 'dato');
    e.poner(e.b, 'real/dato.txt', 'dato');
    e.poner(e.raiz, 'fuera/secreto.txt', 'secreto');
    try {
      symlinkSync(path.join(e.raiz, 'fuera'), path.join(e.a, 'salida'), 'junction');
      symlinkSync(path.join(e.raiz, 'fuera', 'secreto.txt'), path.join(e.a, 'enlace.txt'), 'file');
    } catch {
      return; // sin permiso para crear enlaces
    }
    const r = await carpetas(e.a, e.b);
    expect(r.soloA).toEqual([]);
    expect(r.resumen.omitidos).toBeGreaterThanOrEqual(2);
  });

  it('se salta la carpeta de datos de WolfCore aunque esté dentro de lo que se compara', async () => {
    const e = await escenario();
    e.poner(e.a, 'datos/data/sitios.json', '[]');
    e.poner(e.a, 'proyecto/a.txt', 'a');
    const r = await carpetas(e.a, e.b, {}, [path.join(e.a, 'datos')]);
    expect(r.soloA.map((x) => x.ruta)).toEqual(['proyecto/a.txt']);
  });
});

describe('compararCarpetas: topes y cancelación', () => {
  it('corta por archivos, profundidad y entradas por grupo, y lo dice', async () => {
    const e = await escenario();
    for (let i = 0; i < 10; i++) e.poner(e.a, `f${i}.txt`, 'a');
    const porArchivos = await carpetas(e.a, e.b, { archivosPorLado: 4 });
    expect(porArchivos.resumen.truncado).toBe(true);
    expect(porArchivos.resumen.archivosA).toBe(4);
    const porGrupo = await carpetas(e.a, e.b, { entradasPorGrupo: 3 });
    expect(porGrupo.soloA).toHaveLength(3);
    expect(porGrupo.resumen).toMatchObject({ recortado: true, totalSoloA: 10 });
    e.poner(e.a, 'a/b/c/profundo.txt', 'x');
    const porNivel = await carpetas(e.a, e.b, { profundidad: 1 });
    expect(porNivel.resumen.truncado).toBe(true);
    expect(porNivel.soloA.map((x) => x.ruta)).not.toContain('a/b/c/profundo.txt');
  });

  it('el tope de bytes corta el hash y un archivo enorme queda sin comparar', async () => {
    const e = await escenario();
    for (let i = 0; i < 5; i++) {
      e.poner(e.a, `f${i}.txt`, 'a'.repeat(100));
      e.poner(e.b, `f${i}.txt`, 'b'.repeat(100));
    }
    const corto = await carpetas(e.a, e.b, { bytesTotales: 450 });
    expect(corto.resumen.truncado).toBe(true);
    expect(corto.distintos.length).toBeLessThan(5);
    const grande = await carpetas(e.a, e.b, { bytesPorArchivo: 50 });
    expect(grande.resumen.sinComparar).toBe(5);
    expect(grande.distintos).toEqual([]);
  });

  it('la cancelación y el plazo salen con su código', async () => {
    const e = await escenario();
    e.poner(e.a, 'a.txt', 'a');
    const control = new AbortController();
    control.abort();
    const r = await operarDiff(
      { op: 'carpetas', a: e.a, b: e.b, vetadas: [], lim: lim() },
      control.signal,
    );
    expect(r).toMatchObject({ ok: false, codigo: 'diff.cancelado' });
    let t = 0;
    await expect(
      compararCarpetas(
        { op: 'carpetas', a: e.a, b: e.b, vetadas: [], lim: lim({ plazoMs: 10 }) },
        undefined,
        () => (t += 100),
      ),
    ).rejects.toMatchObject({ motivo: 'plazo' });
  });
});

describe('compararArchivo: diff de texto', () => {
  it('da las líneas quitadas y agregadas con su número y el contexto', async () => {
    const e = await escenario();
    const base = Array.from({ length: 30 }, (_, i) => `linea ${i + 1}`);
    const nuevo = [...base];
    nuevo[9] = 'linea 10 cambiada';
    nuevo.splice(20, 0, 'insertada');
    e.poner(e.a, 'f.txt', base.join('\n'));
    e.poner(e.b, 'f.txt', nuevo.join('\n'));
    const r = texto(await archivo(e.a, e.b, 'f.txt'));
    expect(r).toMatchObject({ agregadas: 2, quitadas: 1, soloSaltos: false, truncado: false });
    const quitada = r.filas.find((f) => f.tipo === 'quitada')!;
    expect(quitada).toMatchObject({ numA: 10, numB: null, texto: 'linea 10' });
    const agregadas = r.filas.filter((f) => f.tipo === 'agregada');
    expect(agregadas.map((f) => f.texto)).toEqual(['linea 10 cambiada', 'insertada']);
    expect(agregadas[1]).toMatchObject({ numA: null, numB: 21 });
    // Hay contexto y un salto que dice cuántas líneas iguales se omiten.
    expect(r.filas.some((f) => f.tipo === 'igual')).toBe(true);
    expect(r.filas.some((f) => f.tipo === 'salto')).toBe(true);
    expect(r.filas.length).toBeLessThan(25);
  });

  it('CRLF frente a LF: mismo texto es "solo cambian los saltos"; con cambios, los reporta aparte', async () => {
    const e = await escenario();
    e.poner(e.a, 'm.txt', 'uno\r\ndos\r\ntres\r\n');
    e.poner(e.b, 'm.txt', 'uno\ndos\ntres\n');
    const s = texto(await archivo(e.a, e.b, 'm.txt'));
    expect(s).toMatchObject({
      saltosA: 'crlf',
      saltosB: 'lf',
      soloSaltos: true,
      agregadas: 0,
      quitadas: 0,
    });
    // En la carpeta aparecen como distintos (el tamaño cambia).
    const c = await carpetas(e.a, e.b);
    expect(c.distintos.map((x) => x.ruta)).toEqual(['m.txt']);
    e.poner(e.a, 'n.txt', 'uno\r\ndos\r\n');
    e.poner(e.b, 'n.txt', 'uno\nDOS\n');
    const n = texto(await archivo(e.a, e.b, 'n.txt'));
    expect(n).toMatchObject({
      saltosA: 'crlf',
      saltosB: 'lf',
      soloSaltos: false,
      agregadas: 1,
      quitadas: 1,
    });
    // El texto de las filas no arrastra el \r.
    expect(n.filas.every((f) => !f.texto.includes('\r'))).toBe(true);
  });

  it('reconoce los saltos mixtos y el archivo sin saltos', async () => {
    const e = await escenario();
    e.poner(e.a, 'x.txt', 'a\r\nb\nc');
    e.poner(e.b, 'x.txt', 'sin saltos');
    const r = texto(await archivo(e.a, e.b, 'x.txt'));
    expect(r).toMatchObject({ saltosA: 'mixto', saltosB: 'ninguno' });
  });

  it('un binario o uno que pasa el tope solo se dice que es distinto', async () => {
    const e = await escenario();
    e.poner(e.a, 'b.dat', Buffer.from([1, 2, 0, 3]));
    e.poner(e.b, 'b.dat', Buffer.from([1, 2, 0, 4]));
    expect(await archivo(e.a, e.b, 'b.dat')).toEqual({ tipo: 'binario' });
    e.poner(e.a, 't.txt', 'a'.repeat(300));
    e.poner(e.b, 't.txt', 'b'.repeat(300));
    expect(await archivo(e.a, e.b, 't.txt', { bytesTexto: 200 })).toEqual({
      tipo: 'tope',
      bytesA: 300,
      bytesB: 300,
    });
    e.poner(e.a, 'i.txt', Buffer.from([0xff, 0xfe, 0x41]));
    e.poner(e.b, 'i.txt', 'texto');
    expect(await archivo(e.a, e.b, 'i.txt')).toEqual({ tipo: 'binario' });
  });

  it('demasiados cambios no cuelga: se rinde con un resultado claro', async () => {
    const e = await escenario();
    e.poner(e.a, 'g.txt', Array.from({ length: 3000 }, (_, i) => `a${i}`).join('\n'));
    e.poner(e.b, 'g.txt', Array.from({ length: 3000 }, (_, i) => `b${i}`).join('\n'));
    expect(await archivo(e.a, e.b, 'g.txt', { cambiosMaximos: 500 })).toEqual({
      tipo: 'demasiado-distinto',
    });
  });

  it('las filas entregadas tienen tope y se marca el truncado', async () => {
    const e = await escenario();
    e.poner(e.a, 'g.txt', Array.from({ length: 200 }, (_, i) => `a${i}`).join('\n'));
    e.poner(e.b, 'g.txt', Array.from({ length: 200 }, (_, i) => `b${i}`).join('\n'));
    const r = texto(await archivo(e.a, e.b, 'g.txt', { filasDiff: 50 }));
    expect(r.filas).toHaveLength(50);
    expect(r).toMatchObject({ truncado: true, agregadas: 200, quitadas: 200 });
  });

  it('rechaza una ruta relativa que se sale de la carpeta o pasa por un enlace', async () => {
    const e = await escenario();
    e.poner(e.a, 'f.txt', 'a');
    e.poner(e.b, 'f.txt', 'b');
    e.poner(e.raiz, 'secreto.txt', 's');
    for (const rel of [
      '../secreto.txt',
      '/etc/passwd',
      'a/../f.txt',
      'C:/x',
      'f.txt:flujo',
      '',
      'f\\x',
    ]) {
      await expect(resolverSeguro(e.a, rel)).rejects.toThrow();
    }
    try {
      symlinkSync(path.join(e.raiz, 'secreto.txt'), path.join(e.a, 'enlace.txt'), 'file');
      await expect(resolverSeguro(e.a, 'enlace.txt')).rejects.toThrow();
    } catch {
      /* sin permiso para crear enlaces */
    }
    const r = await operarDiff({
      op: 'archivo',
      a: e.a,
      b: e.b,
      rel: '../secreto.txt',
      lim: lim(),
    });
    expect(r.ok).toBe(false);
  });
});

describe('diffLineasMyers', () => {
  it('produce un script de edición correcto y mínimo en casos aleatorios', () => {
    let semilla = 12345;
    const azar = (n: number): number => {
      semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
      return semilla % n;
    };
    for (let ronda = 0; ronda < 200; ronda++) {
      const a = Array.from({ length: azar(12) }, () => String(azar(4)));
      const b = Array.from({ length: azar(12) }, () => String(azar(4)));
      const ops = diffLineasMyers(a, b, 100)!;
      // Reconstruir B desde A.
      const rec: string[] = [];
      ops.forEach((o) => {
        if (o.tipo !== 'quitada') rec.push(b[o.b]!);
      });
      expect(rec).toEqual(b);
      const vistasA = ops.filter((o) => o.tipo !== 'agregada').map((o) => o.a);
      expect(vistasA).toEqual(a.map((_, i) => i));
      // Mínimo: cambios = n + m − 2·LCS.
      const t = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
      for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
          t[i]![j] =
            a[i - 1] === b[j - 1] ? t[i - 1]![j - 1]! + 1 : Math.max(t[i - 1]![j]!, t[i]![j - 1]!);
      const cambios = ops.filter((o) => o.tipo !== 'igual').length;
      expect(cambios).toBe(a.length + b.length - 2 * t[a.length]![b.length]!);
    }
  });
});

describe('solo lectura', () => {
  it('comparar y pedir el diff de un archivo no cambia nada en las carpetas', async () => {
    const e = await escenario();
    e.poner(e.a, 'x/uno.txt', 'uno\r\ndos');
    e.poner(e.b, 'x/uno.txt', 'uno\ntres');
    e.poner(e.a, 'solo.txt', 'a');
    e.poner(e.b, 'bin.dat', Buffer.from([0, 1, 2]));
    const antes = [instantanea(e.a), instantanea(e.b)];
    const servicio = new DiffCarpetas({
      ejecutor: ejecutarDiffEnProceso,
      carpetasPropias: () => [],
    });
    const c = await servicio.comparar(e.a, e.b);
    await servicio.archivo(c.id, c.distintos[0]!.id);
    await servicio.rutaParaEditor(c.id, c.soloA[0]!.id, 'a');
    expect([instantanea(e.a), instantanea(e.b)]).toEqual(antes);
  });

  it('el módulo que lee las carpetas no importa ninguna función que escriba', () => {
    const fuente = readFileSync(
      path.join(__dirname, '..', 'src', 'herramientas', 'diffCarpetas.ts'),
      'utf8',
    );
    const imports = fuente
      .split('\n')
      .filter((l) => /^import .* from 'node:/.test(l) || /^import \{/.test(l))
      .join('\n');
    expect(fuente).not.toMatch(
      /\b(writeFile|appendFile|createWriteStream|unlink|rmdir|rename|mkdir|copyFile|truncate|chmod|chown|utimes|symlink|link|writeSync)\b\s*\(/,
    );
    expect(imports).not.toMatch(
      /\b(writeFile|appendFile|createWriteStream|unlink|rm|rename|mkdir|copyFile)\b/,
    );
    // Y abre los archivos solo para leer.
    expect(fuente).toContain("open(ruta, 'r')");
  });
});

describe('DiffCarpetas (servicio)', () => {
  async function servicio(extra: Partial<ConstructorParameters<typeof DiffCarpetas>[0]> = {}) {
    const e = await escenario();
    const datos = path.join(e.raiz, 'WolfCoreDatos');
    mkdirSync(path.join(datos, 'data'), { recursive: true });
    const s = new DiffCarpetas({
      ejecutor: ejecutarDiffEnProceso,
      carpetasPropias: () => [datos],
      ...extra,
    });
    return { e, s, datos };
  }
  const codigo = async (p: Promise<unknown>): Promise<string> => {
    try {
      await p;
    } catch (x) {
      expect(x).toBeInstanceOf(ErrorWolf);
      return (x as ErrorWolf).codigo;
    }
    return 'sin-error';
  };

  it('compara, numera las entradas y entrega la ruta solo de lo que guardó', async () => {
    const { e, s } = await servicio();
    e.poner(e.a, 'solo-a.txt', 'a');
    e.poner(e.b, 'solo-b.txt', 'b');
    e.poner(e.a, 'dif.txt', 'uno');
    e.poner(e.b, 'dif.txt', 'dos');
    const c = await s.comparar(e.a, e.b);
    const [sa, sb, di] = [c.soloA[0]!, c.soloB[0]!, c.distintos[0]!];
    expect(new Set([sa.id, sb.id, di.id]).size).toBe(3);
    expect(await s.rutaParaEditor(c.id, sa.id, 'a')).toBe(path.join(e.a, 'solo-a.txt'));
    expect(await s.rutaParaEditor(c.id, sb.id, 'b')).toBe(path.join(e.b, 'solo-b.txt'));
    expect(await s.rutaParaEditor(c.id, di.id, 'b')).toBe(path.join(e.b, 'dif.txt'));
    // Un archivo solo en A no existe en el lado B.
    expect(await codigo(s.rutaParaEditor(c.id, sa.id, 'b'))).toBe('diff.archivo_invalido');
    // Ids inventados, rutas en lugar de ids, lados raros, comparación inexistente.
    expect(await codigo(s.rutaParaEditor(c.id, 999, 'a'))).toBe('diff.archivo_invalido');
    expect(
      await codigo(s.rutaParaEditor(c.id, path.join(e.a, 'dif.txt') as unknown as number, 'a')),
    ).toBe('diff.archivo_invalido');
    expect(await codigo(s.rutaParaEditor(c.id, di.id, 'c' as 'a'))).toBe('diff.archivo_invalido');
    expect(await codigo(s.rutaParaEditor('c-inventada', di.id, 'a'))).toBe('diff.caducado');
    // El diff de un archivo solo vale para los distintos.
    expect(await codigo(s.archivo(c.id, sa.id))).toBe('diff.archivo_invalido');
    const r = (await s.archivo(c.id, di.id)) as ResultadoArchivoDiff;
    expect(r.tipo).toBe('texto');
  });

  it('una comparación caduca y un archivo que desaparece ya no se abre', async () => {
    let ahora = 5_000_000;
    const { e, s } = await servicio({ ahora: () => ahora });
    e.poner(e.a, 'solo.txt', 'a');
    const c = await s.comparar(e.a, e.b);
    const id = c.soloA[0]!.id;
    writeFileSync(path.join(e.a, 'solo.txt'), 'a');
    expect(await s.rutaParaEditor(c.id, id, 'a')).toBe(path.join(e.a, 'solo.txt'));
    ahora += CADUCIDAD_DIFF_MS + 1;
    expect(await codigo(s.rutaParaEditor(c.id, id, 'a'))).toBe('diff.caducado');
    expect(await codigo(s.archivo(c.id, id))).toBe('diff.caducado');
  });

  it('rechaza raíces UNC, enlaces, archivos y la carpeta de datos de WolfCore', async () => {
    const { e, s, datos } = await servicio();
    expect(await codigo(s.comparar('\\\\localhost\\C$\\x', e.b))).toBe('diff.raiz_invalida');
    expect(await codigo(s.comparar('//servidor/recurso', e.b))).toBe('diff.raiz_invalida');
    expect(await codigo(s.comparar('relativa', e.b))).toBe('diff.raiz_invalida');
    expect(await codigo(s.comparar(path.join(e.a, 'no-existe'), e.b))).toBe('diff.raiz_invalida');
    e.poner(e.a, 'f.txt', 'x');
    expect(await codigo(s.comparar(path.join(e.a, 'f.txt'), e.b))).toBe('diff.raiz_invalida');
    expect(await codigo(s.comparar(path.join(datos, 'data'), e.b))).toBe('diff.ruta_vetada');
    expect(await codigo(s.comparar(e.a, datos))).toBe('diff.ruta_vetada');
    try {
      symlinkSync(e.a, path.join(e.raiz, 'enlace'), 'junction');
      expect(await codigo(s.comparar(path.join(e.raiz, 'enlace'), e.b))).toBe('diff.raiz_invalida');
    } catch {
      /* sin permiso para crear enlaces */
    }
    // La carpeta que CONTIENE la de datos se compara, pero saltándosela.
    e.poner(e.raiz, 'WolfCoreDatos/data/otro.json', '{}');
    const c = await s.comparar(e.raiz, e.raiz);
    expect(c.soloA).toEqual([]);
  });

  it('solo una operación a la vez, y cancelar la corta con su código', async () => {
    let liberar: () => void = () => undefined;
    let vistaSenal: AbortSignal | undefined;
    const { e, s } = await servicio({
      ejecutor: (_m, o) =>
        new Promise((resolve) => {
          vistaSenal = o.senal;
          liberar = () => resolve({ ok: false, codigo: 'diff.cancelado' });
          o.senal?.addEventListener('abort', () =>
            resolve({ ok: false, codigo: 'diff.cancelado' }),
          );
        }),
    });
    const primera = s.comparar(e.a, e.b);
    await new Promise((r) => setTimeout(r, 30));
    expect(await codigo(s.comparar(e.a, e.b))).toBe('diff.ocupado');
    expect(s.cancelar()).toBe(true);
    expect(vistaSenal?.aborted).toBe(true);
    expect(await codigo(primera)).toBe('diff.cancelado');
    liberar();
    // Después de cancelar se puede volver a comparar.
    expect(s.cancelar()).toBe(false);
  });

  it('un código ajeno del proceso de trabajo se vuelve diff.fallo y el plazo conserva sus datos', async () => {
    const { e, s } = await servicio({
      ejecutor: async () => ({ ok: false, codigo: 'servicios.desconocido' }),
    });
    expect(await codigo(s.comparar(e.a, e.b))).toBe('diff.fallo');
    const { e: e2, s: s2 } = await servicio({
      ejecutor: async () => ({ ok: false, codigo: 'diff.plazo', datos: { segundos: 300 } }),
    });
    try {
      await s2.comparar(e2.a, e2.b);
    } catch (x) {
      expect((x as ErrorWolf).datos).toEqual({ segundos: 300 });
    }
  });
});
