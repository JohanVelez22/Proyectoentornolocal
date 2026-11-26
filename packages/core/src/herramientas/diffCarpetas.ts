import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import path from 'node:path';
import { esErrorWolf, type DatosErrorWolf } from '../errores';
import { BYTES_TEXTO_DIFF } from '../constantesUi';
import { rutaDentroDe } from '../plataforma/sistema';
import { crearDetectorSensible, type SitioSensible } from './archivoSensible';

/**
 * Diff de carpetas (D44), parte que corre en el proceso de trabajo (un `utilityProcess` en la
 * aplicación). SOLO LEE: este módulo no importa ninguna función de escritura del sistema de
 * archivos (lo vigila una prueba) y nunca crea, cambia ni borra nada de las carpetas comparadas.
 *
 * Entradas no confiables: las carpetas pueden tener millones de archivos, enlaces en bucle,
 * archivos enormes o binarios. Por eso todo tiene tope (archivos, profundidad, bytes, tiempo),
 * no se sigue ningún enlace simbólico ni unión, los archivos se comparan por tamaño y después por
 * hash (SHA-256 por flujo) y el diff de texto solo se hace con archivos de texto pequeños.
 */

export interface LimitesDiff {
  /** Archivos que se listan por lado. */
  archivosPorLado: number;
  profundidad: number;
  /** Archivos más grandes que esto no se comparan por hash (si el tamaño coincide, quedan "sin comparar"). */
  bytesPorArchivo: number;
  /** Bytes que se leen en total para los hashes. */
  bytesTotales: number;
  /** Entradas que se entregan por grupo (el resto se cuenta). */
  entradasPorGrupo: number;
  /** Tope de cada archivo para el diff de texto. */
  bytesTexto: number;
  /** Filas del diff de texto que se entregan. */
  filasDiff: number;
  /** Cuántos cambios distintos admite el algoritmo antes de rendirse. */
  cambiosMaximos: number;
  /** Plazo de una operación (lo aplica el supervisor; la parte que lee también lo mira). */
  plazoMs: number;
}

export const LIMITES_DIFF: Readonly<LimitesDiff> = {
  archivosPorLado: 50_000,
  profundidad: 30,
  bytesPorArchivo: 256 * 1024 * 1024,
  bytesTotales: 4 * 1024 * 1024 * 1024,
  entradasPorGrupo: 5_000,
  bytesTexto: BYTES_TEXTO_DIFF,
  filasDiff: 5_000,
  cambiosMaximos: 2_000,
  plazoMs: 5 * 60 * 1000,
};

export type MotivoDistinto = 'tamano' | 'contenido';

/** Un archivo de la comparación; `ruta` es relativa a la carpeta, con `/`. */
export interface EntradaDiff {
  ruta: string;
  tamanoA: number | null;
  tamanoB: number | null;
  motivo?: MotivoDistinto;
}

export interface ResumenCarpetas {
  archivosA: number;
  archivosB: number;
  iguales: number;
  /** Mismo tamaño pero demasiado grandes para el hash: no se pudo decir si son iguales. */
  sinComparar: number;
  /** Enlaces, uniones y archivos especiales que se saltaron. */
  omitidos: number;
  /** Se cortó por un tope (archivos, profundidad o bytes): la lista no es completa. */
  truncado: boolean;
  /** Hubo más entradas de las que se entregan en algún grupo. */
  recortado: boolean;
  /** Totales reales de cada grupo (pueden pasar de lo entregado). */
  totalSoloA: number;
  totalSoloB: number;
  totalDistintos: number;
}

export interface ResultadoCarpetas {
  soloA: EntradaDiff[];
  soloB: EntradaDiff[];
  distintos: EntradaDiff[];
  resumen: ResumenCarpetas;
}

export type SaltosDiff = 'lf' | 'crlf' | 'mixto' | 'ninguno';

export interface FilaDiffTexto {
  tipo: 'igual' | 'quitada' | 'agregada' | 'salto';
  /** Número de línea (base 1) en A y en B. */
  numA: number | null;
  numB: number | null;
  /** Texto de la línea (recortado); en `salto`, cuántas líneas iguales se omiten. */
  texto: string;
}

export type ResultadoArchivoDiff =
  | {
      tipo: 'texto';
      filas: FilaDiffTexto[];
      agregadas: number;
      quitadas: number;
      /** Se entregaron solo las primeras filas. */
      truncado: boolean;
      saltosA: SaltosDiff;
      saltosB: SaltosDiff;
      /** El texto es el mismo línea por línea: solo cambian los saltos de línea o el BOM. */
      soloSaltos: boolean;
    }
  | { tipo: 'binario' }
  /** Archivo sensible (como en el editor): distinto, pero no se muestra nada de su contenido. */
  | { tipo: 'sensible' }
  | { tipo: 'tope'; bytesA: number; bytesB: number }
  | { tipo: 'demasiado-distinto' };

export type MensajeDiff =
  | { op: 'carpetas'; a: string; b: string; vetadas: string[]; lim: LimitesDiff }
  | {
      op: 'archivo';
      a: string;
      b: string;
      rel: string;
      /** Sitios (con su ruta y su `realpath`) para saber cuáles tienen datos reales. */
      sitios: SitioSensible[];
      lim: LimitesDiff;
    };

export type RespuestaDiff =
  | { ok: true; datos: ResultadoCarpetas | ResultadoArchivoDiff }
  | { ok: false; codigo: string; datos?: DatosErrorWolf };

export interface OpcionesEjecucionDiff {
  plazoMs: number;
  senal?: AbortSignal;
}

/** Quien ejecuta un mensaje en el proceso de trabajo (se inyecta). */
export type EjecutorDiff = (m: MensajeDiff, o: OpcionesEjecucionDiff) => Promise<RespuestaDiff>;

/** Cancelación o plazo vencido dentro de la parte que lee (el supervisor además mata el proceso). */
class Corte extends Error {
  constructor(readonly motivo: 'cancelado' | 'plazo') {
    super(motivo);
  }
}

const MAX_TEXTO_FILA = 500;

/* ───────────── Rutas ───────────── */

/**
 * Ruta absoluta de `rel` dentro de `raiz`, sin salirse de ella y sin pasar por ningún enlace
 * simbólico ni unión (cada componente se mira con `lstat`). Devuelve también el `lstat` del
 * archivo. Lanza si no es un archivo normal.
 */
export async function resolverSeguro(
  raiz: string,
  rel: string,
): Promise<{ ruta: string; tamano: number; enlaces: number }> {
  const partes = rel.split('/');
  if (
    rel === '' ||
    rel.length > 4096 ||
    path.isAbsolute(rel) ||
    rel.includes('\\') ||
    rel.includes('\0') ||
    partes.some((p) => p === '' || p === '.' || p === '..' || p.includes(':'))
  ) {
    throw new Error('ruta relativa no válida');
  }
  let actual = raiz;
  let info = await lstat(actual);
  for (const p of partes) {
    actual = path.join(actual, p);
    info = await lstat(actual);
    if (info.isSymbolicLink()) throw new Error('enlace');
  }
  if (!info.isFile()) throw new Error('no es un archivo normal');
  if (!rutaDentroDe(raiz, actual)) throw new Error('fuera de la carpeta');
  return { ruta: actual, tamano: info.size, enlaces: info.nlink };
}

/* ───────────── Carpetas ───────────── */

interface Listado {
  archivos: Map<string, number>;
  omitidos: number;
  truncado: boolean;
}

async function listar(
  raiz: string,
  vetadas: string[],
  lim: LimitesDiff,
  revisar: () => void,
): Promise<Listado> {
  const salida: Listado = { archivos: new Map(), omitidos: 0, truncado: false };
  const pila: { dir: string; rel: string; nivel: number }[] = [{ dir: raiz, rel: '', nivel: 0 }];
  while (pila.length > 0) {
    const { dir, rel, nivel } = pila.pop()!;
    revisar();
    let entradas;
    try {
      entradas = await readdir(dir, { withFileTypes: true });
    } catch {
      salida.omitidos++;
      continue;
    }
    for (const e of entradas) {
      const ruta = path.join(dir, e.name);
      const relativa = rel === '' ? e.name : `${rel}/${e.name}`;
      // Enlaces simbólicos y uniones de Windows: no se siguen ni se comparan.
      if (e.isSymbolicLink()) {
        salida.omitidos++;
        continue;
      }
      if (e.isDirectory()) {
        if (vetadas.some((v) => rutaDentroDe(v, ruta))) {
          salida.omitidos++;
          continue;
        }
        if (nivel >= lim.profundidad) {
          salida.truncado = true;
          continue;
        }
        pila.push({ dir: ruta, rel: relativa, nivel: nivel + 1 });
      } else if (e.isFile()) {
        if (salida.archivos.size >= lim.archivosPorLado) {
          salida.truncado = true;
          return salida;
        }
        try {
          const info = await lstat(ruta);
          if (info.isSymbolicLink() || !info.isFile()) {
            salida.omitidos++;
            continue;
          }
          salida.archivos.set(relativa, info.size);
        } catch {
          salida.omitidos++;
        }
      } else {
        salida.omitidos++;
      }
    }
  }
  return salida;
}

async function hashDe(ruta: string, revisar: () => void): Promise<string> {
  const h = createHash('sha256');
  const flujo = createReadStream(ruta, { highWaterMark: 256 * 1024 });
  try {
    for await (const trozo of flujo) {
      revisar();
      h.update(trozo as Buffer);
    }
  } finally {
    flujo.destroy();
  }
  return h.digest('hex');
}

const porRuta = (x: EntradaDiff, y: EntradaDiff): number =>
  x.ruta < y.ruta ? -1 : x.ruta > y.ruta ? 1 : 0;

export async function compararCarpetas(
  m: Extract<MensajeDiff, { op: 'carpetas' }>,
  senal?: AbortSignal,
  ahora: () => number = Date.now,
): Promise<ResultadoCarpetas> {
  const lim = m.lim;
  const inicio = ahora();
  const revisar = (): void => {
    if (senal?.aborted) throw new Corte('cancelado');
    if (ahora() - inicio > lim.plazoMs) throw new Corte('plazo');
  };
  const vetadas = m.vetadas.map((v) => path.resolve(v));
  const [la, lb] = [
    await listar(m.a, vetadas, lim, revisar),
    await listar(m.b, vetadas, lim, revisar),
  ];
  const soloA: EntradaDiff[] = [];
  const soloB: EntradaDiff[] = [];
  const distintos: EntradaDiff[] = [];
  let iguales = 0;
  let sinComparar = 0;
  let truncado = la.truncado || lb.truncado;
  let bytes = 0;

  for (const [ruta, tam] of la.archivos) {
    if (!lb.archivos.has(ruta)) soloA.push({ ruta, tamanoA: tam, tamanoB: null });
  }
  for (const [ruta, tam] of lb.archivos) {
    if (!la.archivos.has(ruta)) soloB.push({ ruta, tamanoA: null, tamanoB: tam });
  }
  const comunes = [...la.archivos.keys()].filter((r) => lb.archivos.has(r)).sort();
  for (const ruta of comunes) {
    revisar();
    const ta = la.archivos.get(ruta)!;
    const tb = lb.archivos.get(ruta)!;
    if (ta !== tb) {
      distintos.push({ ruta, tamanoA: ta, tamanoB: tb, motivo: 'tamano' });
      continue;
    }
    if (ta === 0) {
      iguales++;
      continue;
    }
    if (ta > lim.bytesPorArchivo) {
      sinComparar++;
      continue;
    }
    if (bytes + ta * 2 > lim.bytesTotales) {
      truncado = true;
      break;
    }
    bytes += ta * 2;
    try {
      const [ha, hb] = [
        await hashDe(path.join(m.a, ...ruta.split('/')), revisar),
        await hashDe(path.join(m.b, ...ruta.split('/')), revisar),
      ];
      if (ha === hb) iguales++;
      else distintos.push({ ruta, tamanoA: ta, tamanoB: tb, motivo: 'contenido' });
    } catch (e) {
      if (e instanceof Corte) throw e;
      // Se bloqueó o desapareció mientras se leía: no se puede decir nada de él.
      sinComparar++;
    }
  }
  soloA.sort(porRuta);
  soloB.sort(porRuta);
  distintos.sort(porRuta);
  const tope = lim.entradasPorGrupo;
  return {
    soloA: soloA.slice(0, tope),
    soloB: soloB.slice(0, tope),
    distintos: distintos.slice(0, tope),
    resumen: {
      archivosA: la.archivos.size,
      archivosB: lb.archivos.size,
      iguales,
      sinComparar,
      omitidos: la.omitidos + lb.omitidos,
      truncado,
      recortado: soloA.length > tope || soloB.length > tope || distintos.length > tope,
      totalSoloA: soloA.length,
      totalSoloB: soloB.length,
      totalDistintos: distintos.length,
    },
  };
}

/* ───────────── Texto ───────────── */

/** Saltos de línea de un texto ya decodificado. */
export function saltosDeTexto(t: string): SaltosDiff {
  const crlf = (t.match(/\r\n/g) ?? []).length;
  const lf = (t.match(/(?<!\r)\n/g) ?? []).length;
  const cr = (t.match(/\r(?!\n)/g) ?? []).length;
  if (cr > 0 || (crlf > 0 && lf > 0)) return 'mixto';
  if (crlf > 0) return 'crlf';
  return lf > 0 ? 'lf' : 'ninguno';
}

const lineasDe = (t: string): string[] => {
  if (t === '') return [];
  const l = t.split(/\r\n|\r|\n/);
  if (l[l.length - 1] === '') l.pop();
  return l;
};

interface Op {
  tipo: 'igual' | 'quitada' | 'agregada';
  a: number;
  b: number;
}

/**
 * Diff de líneas por el algoritmo de Myers (menor número de cambios). Se rinde si hacen falta más
 * de `maxD` cambios (null): el coste es O((N+M)·D) en tiempo y O(D²) en memoria.
 */
export function diffLineasMyers(a: string[], b: string[], maxD: number): Op[] | null {
  let ini = 0;
  while (ini < a.length && ini < b.length && a[ini] === b[ini]) ini++;
  let finA = a.length;
  let finB = b.length;
  while (finA > ini && finB > ini && a[finA - 1] === b[finB - 1]) {
    finA--;
    finB--;
  }
  const n = finA - ini;
  const m = finB - ini;
  const ops: Op[] = [];
  for (let i = 0; i < ini; i++) ops.push({ tipo: 'igual', a: i, b: i });
  if (n === 0 || m === 0 || (n === 0 && m === 0)) {
    for (let i = 0; i < n; i++) ops.push({ tipo: 'quitada', a: ini + i, b: -1 });
    for (let j = 0; j < m; j++) ops.push({ tipo: 'agregada', a: -1, b: ini + j });
  } else {
    const tope = Math.min(n + m, maxD);
    const desp = tope + 1;
    const v = new Int32Array(2 * tope + 3);
    const trazas: Int32Array[] = [];
    let encontrado = -1;
    for (let d = 0; d <= tope && encontrado < 0; d++) {
      for (let k = -d; k <= d; k += 2) {
        let x: number;
        if (k === -d || (k !== d && v[desp + k - 1]! < v[desp + k + 1]!)) x = v[desp + k + 1]!;
        else x = v[desp + k - 1]! + 1;
        let y = x - k;
        while (x < n && y < m && a[ini + x] === b[ini + y]) {
          x++;
          y++;
        }
        v[desp + k] = x;
        if (x >= n && y >= m) {
          encontrado = d;
          break;
        }
      }
      trazas.push(v.slice());
    }
    if (encontrado < 0) return null;
    // Se recompone el camino hacia atrás.
    const camino: Op[] = [];
    let x = n;
    let y = m;
    for (let d = encontrado; d > 0; d--) {
      const vd = trazas[d - 1]!;
      const k = x - y;
      const abajo = k === -d || (k !== d && vd[desp + k - 1]! < vd[desp + k + 1]!);
      const kPrev = abajo ? k + 1 : k - 1;
      const xPrev = vd[desp + kPrev]!;
      const yPrev = xPrev - kPrev;
      while (x > xPrev && y > yPrev) {
        x--;
        y--;
        camino.push({ tipo: 'igual', a: ini + x, b: ini + y });
      }
      if (abajo) camino.push({ tipo: 'agregada', a: -1, b: ini + yPrev });
      else camino.push({ tipo: 'quitada', a: ini + xPrev, b: -1 });
      x = xPrev;
      y = yPrev;
    }
    while (x > 0 && y > 0) {
      x--;
      y--;
      camino.push({ tipo: 'igual', a: ini + x, b: ini + y });
    }
    camino.reverse();
    // Un bucle y no `push(...camino)`: con cientos de miles de líneas el spread revienta la pila.
    for (const o of camino) ops.push(o);
  }
  for (let i = finA, j = finB; i < a.length; i++, j++) ops.push({ tipo: 'igual', a: i, b: j });
  return ops;
}

const CONTEXTO_DIFF = 3;

function filasDe(ops: Op[], a: string[], b: string[], tope: number) {
  const mostrar = new Array<boolean>(ops.length).fill(false);
  ops.forEach((o, i) => {
    if (o.tipo === 'igual') return;
    for (
      let k = Math.max(0, i - CONTEXTO_DIFF);
      k <= Math.min(ops.length - 1, i + CONTEXTO_DIFF);
      k++
    ) {
      mostrar[k] = true;
    }
  });
  const filas: FilaDiffTexto[] = [];
  let agregadas = 0;
  let quitadas = 0;
  let omitidas = 0;
  let truncado = false;
  const recorte = (s: string): string =>
    s.length > MAX_TEXTO_FILA ? s.slice(0, MAX_TEXTO_FILA) : s;
  const cerrarSalto = (): void => {
    if (omitidas > 0 && filas.length > 0) {
      filas.push({ tipo: 'salto', numA: null, numB: null, texto: String(omitidas) });
    }
    omitidas = 0;
  };
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i]!;
    if (o.tipo === 'quitada') quitadas++;
    if (o.tipo === 'agregada') agregadas++;
    if (!mostrar[i]) {
      omitidas++;
      continue;
    }
    if (truncado) continue;
    cerrarSalto();
    if (filas.length >= tope) {
      truncado = true;
      continue;
    }
    filas.push({
      tipo: o.tipo,
      numA: o.a >= 0 ? o.a + 1 : null,
      numB: o.b >= 0 ? o.b + 1 : null,
      texto: recorte(o.tipo === 'agregada' ? b[o.b]! : a[o.a]!),
    });
  }
  if (!truncado && omitidas > 0 && ops.length > 0) cerrarSalto();
  return { filas, agregadas, quitadas, truncado };
}

/** Lee un archivo de texto de hasta `tope` bytes; `null` si es más grande. */
async function leerAcotado(ruta: string, tope: number): Promise<Buffer | null> {
  const fh = await open(ruta, 'r');
  try {
    const buf = Buffer.alloc(tope + 1);
    let leidos = 0;
    while (leidos < buf.length) {
      const { bytesRead } = await fh.read(buf, leidos, buf.length - leidos, leidos);
      if (bytesRead === 0) break;
      leidos += bytesRead;
    }
    return leidos > tope ? null : buf.subarray(0, leidos);
  } finally {
    await fh.close();
  }
}

function decodificar(datos: Buffer): { texto: string; bom: boolean } | null {
  if (datos.includes(0)) return null;
  try {
    let texto = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(datos);
    const bom = texto.startsWith('﻿');
    if (bom) texto = texto.slice(1);
    return { texto, bom };
  } catch {
    return null;
  }
}

export async function compararArchivo(
  m: Extract<MensajeDiff, { op: 'archivo' }>,
  senal?: AbortSignal,
): Promise<ResultadoArchivoDiff> {
  if (senal?.aborted) throw new Corte('cancelado');
  const [fa, fb] = [await resolverSeguro(m.a, m.rel), await resolverSeguro(m.b, m.rel)];
  // Un archivo sensible (D43) es distinto, pero no se lee ni se muestra nada de él.
  const detector = crearDetectorSensible(m.sitios);
  if (detector.porRuta(fa.ruta, fa.enlaces) || detector.porRuta(fb.ruta, fb.enlaces)) {
    return { tipo: 'sensible' };
  }
  if (fa.tamano > m.lim.bytesTexto || fb.tamano > m.lim.bytesTexto) {
    return { tipo: 'tope', bytesA: fa.tamano, bytesB: fb.tamano };
  }
  const [da, db] = [
    await leerAcotado(fa.ruta, m.lim.bytesTexto),
    await leerAcotado(fb.ruta, m.lim.bytesTexto),
  ];
  if (da === null || db === null) {
    return { tipo: 'tope', bytesA: fa.tamano, bytesB: fb.tamano };
  }
  const [ta, tb] = [decodificar(da), decodificar(db)];
  if (ta === null || tb === null) return { tipo: 'binario' };
  if (detector.porContenido(ta.texto) || detector.porContenido(tb.texto)) {
    return { tipo: 'sensible' };
  }
  const [la, lb] = [lineasDe(ta.texto), lineasDe(tb.texto)];
  const ops = diffLineasMyers(la, lb, m.lim.cambiosMaximos);
  if (ops === null) return { tipo: 'demasiado-distinto' };
  const { filas, agregadas, quitadas, truncado } = filasDe(ops, la, lb, m.lim.filasDiff);
  return {
    tipo: 'texto',
    filas,
    agregadas,
    quitadas,
    truncado,
    saltosA: saltosDeTexto(ta.texto),
    saltosB: saltosDeTexto(tb.texto),
    soloSaltos: agregadas === 0 && quitadas === 0,
  };
}

/* ───────────── Entrada del proceso de trabajo ───────────── */

/** Ejecuta un mensaje y devuelve la respuesta (los errores salen con código). */
export async function operarDiff(m: MensajeDiff, senal?: AbortSignal): Promise<RespuestaDiff> {
  try {
    if (m.op === 'carpetas') return { ok: true, datos: await compararCarpetas(m, senal) };
    if (m.op === 'archivo') return { ok: true, datos: await compararArchivo(m, senal) };
    return { ok: false, codigo: 'diff.fallo' };
  } catch (e) {
    if (e instanceof Corte) {
      return e.motivo === 'cancelado'
        ? { ok: false, codigo: 'diff.cancelado' }
        : {
            ok: false,
            codigo: 'diff.plazo',
            datos: { segundos: Math.round(m.lim.plazoMs / 1000) },
          };
    }
    if (esErrorWolf(e))
      return { ok: false, codigo: e.codigo, ...(e.datos ? { datos: e.datos } : {}) };
    return { ok: false, codigo: 'diff.archivo_invalido' };
  }
}

/**
 * EjecutorDiff SIN aislamiento: corre la operación en el mismo proceso. Solo sirve como doble de
 * prueba; la aplicación inyecta el `utilityProcess` con plazo y vigilancia de memoria.
 */
export const ejecutarDiffEnProceso: EjecutorDiff = (m, o) => operarDiff(m, o.senal);
