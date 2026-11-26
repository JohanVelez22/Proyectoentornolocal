import type { Dirent, Stats } from 'node:fs';
import { lstat, mkdir, readdir, realpath, rmdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { abrirNuevo } from '../herramientas/salidaNueva';
import { normalizarRuta } from '../plataforma/limpiezaWin';
import type {
  CategoriaLimpieza,
  NavegadorLimpieza,
  PlataformaCompleta,
  RutasCategoriaLimpieza,
} from '../plataforma/tipos';

/**
 * Limpieza de disco (D37). Reglas que no se negocian:
 *
 * - Solo se toca lo que devuelve `Plataforma.rutasLimpieza()`. Una raíz que es un enlace o una
 *   unión, o cuya ruta real no es la de su padre real más su nombre (ella o su padre redirigen a
 *   otro sitio), se rechaza. Todo lo que se borra es descendiente de la raíz real, comprobado
 *   otra vez justo antes de borrar, junto con la ruta real de la carpeta que lo contiene.
 * - No se siguen enlaces simbólicos, uniones ni ningún punto de reanálisis: con `lstat`, y un
 *   directorio solo se baja si su ruta real es la que se esperaba. Lo que no cuadra se salta.
 * - Rutas vetadas (datos y respaldos de WolfCore, proyectos de los sitios, `<unidad>:\Proyectos`
 *   y `\\servidor\recurso\Proyectos`, lo que contenga FlyEnv o PhpWebStudy, y cualquier `.env`):
 *   si una raíz las contiene o está dentro de una, la categoría se aborta con
 *   `limpieza.ruta_vetada`. Antes de empezar a borrar, eso aborta la ejecución entera; si aparece
 *   a mitad, se marca esa categoría y se sigue con las demás. Un `.env` o un FlyEnv suelto dentro
 *   de una raíz válida no se toca y se cuenta como saltado.
 * - Con el navegador abierto su caché queda bloqueada; se comprueba otra vez antes de cada raíz.
 *   Si no se puede saber, se trata como abierto.
 * - Nada ocurre solo: `analizar` solo lee y `limpiar` exige `confirmado === true` y un análisis
 *   previo reciente de cada categoría. Solo se borra lo que ya cumplía la regla de edad en el
 *   momento del análisis.
 * - Archivos en uso (EBUSY, EPERM, EACCES): se saltan y se cuentan. Hay un tope de archivos por
 *   ejecución y se puede cancelar.
 * - Cada ejecución deja un registro de texto en la carpeta de registros de WolfCore Dev, escrito
 *   a medida que se borra; si no se puede escribir, se deja de borrar.
 */

export const CATEGORIAS_LIMPIEZA = [
  'temp',
  'cache-chrome',
  'cache-edge',
  'cache-brave',
  'cache-firefox',
  'wolfcore-descargas',
  'wolfcore-registros',
  'prefetch',
] as const satisfies readonly CategoriaLimpieza[];

export type BloqueoLimpieza =
  'navegador-abierto' | 'requiere-admin' | 'ruta-vetada' | 'temp-no-seguro';

export type MotivoSaltoLimpieza =
  'en-uso' | 'enlace' | 'protegido' | 'cambio' | 'sin-papelera' | 'ilegible' | 'error';

export const HORA_MS = 3_600_000;
export const EDAD_TEMP_MS = 24 * HORA_MS;
export const EDAD_REGISTROS_MS = 30 * 24 * HORA_MS;
/** Los registros de la propia limpieza (`logs/limpieza`) con más edad que esto se purgan solos. */
export const EDAD_PURGA_REGISTROS_LIMPIEZA_MS = 90 * 24 * HORA_MS;
/** Tope de archivos que borra una ejecución; el resto queda para la siguiente. */
export const MAX_ARCHIVOS_LIMPIEZA = 50_000;
/** Tope de archivos que cuenta un análisis. */
export const MAX_ARCHIVOS_ANALISIS = 200_000;
/** Un análisis vale para limpiar durante este tiempo. */
export const VIGENCIA_ANALISIS_MS = 30 * 60_000;
/** Líneas de rutas que lleva el registro; después, solo el total. */
export const MAX_RUTAS_REGISTRO = 5000;
/** Cada cuántas rutas borradas se escriben en el registro (y al terminar cada categoría). */
export const LOTE_REGISTRO = 200;

/** Únicas carpetas de un perfil de navegador que se limpian. */
const CARPETAS_CACHE = new Set(['cache', 'code cache', 'gpucache', 'cache2']);

interface Regla {
  recursiva: boolean;
  /** Solo archivos con más edad que esto. */
  edadMs: number | null;
  /**
   * `mtime`: por la fecha de modificación. `reciente`: por la más reciente de modificación,
   * creación y cambio (en TEMP, un archivo copiado o extraído conserva una fecha de
   * modificación antigua aunque acabe de llegar).
   */
  edadPor: 'mtime' | 'reciente';
  nombre?: RegExp;
  /** `papelera`: a la papelera del sistema (pocos archivos); si no, se borra definitivamente. */
  borrado: 'papelera' | 'definitivo';
  /** Marcada por defecto: solo lo claramente regenerable. */
  marcada: boolean;
  /** Quitar las carpetas que queden vacías por haber borrado (nunca la raíz). */
  carpetasVacias: boolean;
}

const REGLAS: Readonly<Record<CategoriaLimpieza, Regla>> = {
  temp: {
    recursiva: true,
    edadMs: EDAD_TEMP_MS,
    edadPor: 'reciente',
    borrado: 'definitivo',
    marcada: true,
    carpetasVacias: true,
  },
  'cache-chrome': cache(),
  'cache-edge': cache(),
  'cache-brave': cache(),
  'cache-firefox': cache(),
  // Descargas en caché: solo los archivos comprimidos sueltos de `tmp` (no las carpetas de
  // trabajo de una instalación ni nada de las sesiones), y no los recién llegados.
  'wolfcore-descargas': {
    recursiva: false,
    edadMs: HORA_MS,
    edadPor: 'mtime',
    nombre: /\.(?:zip|7z|tar|gz|tgz|xz|bz2|parcial)$/i,
    borrado: 'papelera',
    marcada: false,
    carpetasVacias: false,
  },
  'wolfcore-registros': {
    recursiva: true,
    edadMs: EDAD_REGISTROS_MS,
    edadPor: 'mtime',
    borrado: 'papelera',
    marcada: false,
    carpetasVacias: false,
  },
  prefetch: {
    recursiva: false,
    edadMs: null,
    edadPor: 'mtime',
    nombre: /\.pf$/i,
    borrado: 'definitivo',
    marcada: false,
    carpetasVacias: false,
  },
};

function cache(): Regla {
  return {
    recursiva: true,
    edadMs: null,
    edadPor: 'mtime',
    borrado: 'definitivo',
    marcada: true,
    carpetasVacias: true,
  };
}

export interface CarpetaAnalizada {
  ruta: string;
  archivos: number;
  bytes: number;
}

export interface ResumenCategoria {
  categoria: CategoriaLimpieza;
  archivos: number;
  bytes: number;
  bloqueada: BloqueoLimpieza | null;
  /** Viene marcada por defecto (solo lo claramente regenerable). */
  marcada: boolean;
  /** `papelera` (registros y descargas de WolfCore) o `definitivo` (se regenera sola). */
  borrado: 'papelera' | 'definitivo';
  /** Tamaño por carpeta (una por cada ruta aceptada de la categoría). */
  carpetas: CarpetaAnalizada[];
  /** true si el análisis se cortó en el tope de archivos. */
  truncado: boolean;
}

export interface ResultadoCategoriaLimpieza {
  categoria: CategoriaLimpieza;
  archivos: number;
  bytes: number;
  saltados: number;
  motivos: Partial<Record<MotivoSaltoLimpieza, number>>;
  bloqueada: BloqueoLimpieza | null;
}

export interface ResultadoLimpiezaDisco {
  /** Bytes que dejaron de estar donde estaban (borrados y enviados a la papelera). */
  liberados: number;
  /** De ellos, los que fueron a la papelera (el espacio no vuelve hasta vaciarla). */
  enPapelera: number;
  archivos: number;
  saltados: number;
  categorias: ResultadoCategoriaLimpieza[];
  cancelado: boolean;
  /** true si se llegó al tope de archivos de la ejecución. */
  truncado: boolean;
  /** Ruta del registro de lo borrado. */
  registro: string;
  /** true si el registro dejó de poder escribirse: la limpieza se paró ahí. */
  registroFallido: boolean;
}

/** Registro abierto de una ejecución: se escribe por partes, a medida que se borra. */
export interface RegistroLimpieza {
  ruta: string;
  escribir(texto: string): Promise<void>;
  cerrar(): Promise<void>;
}

export interface DepsLimpiezaDisco {
  plataforma: Pick<
    PlataformaCompleta,
    'rutasLimpieza' | 'navegadoresAbiertos' | 'esAdministrador' | 'aPapelera'
  >;
  /** Carpeta de datos activa (la de `WOLFCORE_DATOS` o la de siempre). */
  carpetaDatos: () => string;
  /**
   * Rutas que nunca se tocan ni pueden quedar dentro de una raíz: `data`, `respaldos`, `run`…
   * de WolfCore, las raíces de los proyectos de los sitios y la carpeta de datos real.
   */
  rutasVetadas: () => Promise<string[]>;
  /** Carpeta donde se escribe el registro de cada ejecución (dentro de `logs`). */
  carpetaRegistro: () => string;
  ahora?: () => number;
  /** Tope de archivos por ejecución (por defecto `MAX_ARCHIVOS_LIMPIEZA`; lo cambian las pruebas). */
  topeArchivos?: number;
  /** Cómo se borra un archivo (por defecto `unlink`; las pruebas simulan archivos en uso). */
  borrar?: (ruta: string) => Promise<void>;
  /** Cómo se abre el registro (por defecto, un archivo nuevo; las pruebas simulan fallos). */
  abrirRegistro?: (destino: string) => Promise<RegistroLimpieza>;
  /** Se llama justo antes de comprobar y borrar cada archivo (solo lo usan las pruebas). */
  antesDeBorrar?: (ruta: string) => Promise<void> | void;
}

/** Siempre vetado, sin depender de quien configure el núcleo (y `Proyectos` en cualquier unidad). */
const VETADAS_FIJAS = ['C:/Proyectos'];

const normalizar = normalizarRuta;

function dentroDe(padre: string, hija: string): boolean {
  const p = normalizar(padre);
  const h = normalizar(hija);
  return h === p || h.startsWith(`${p}/`);
}

/**
 * `<X>:\Proyectos` en cualquier unidad y `\\servidor\recurso\Proyectos` (también
 * `\\localhost\C$\Proyectos`): ¿la ruta está dentro o la contiene?
 */
function tocaProyectos(ruta: string): boolean {
  const n = normalizar(ruta);
  const m = /^([a-z]:)(?:\/|$)/.exec(n) ?? /^(\/\/[^/]+\/[^/]+)(?:\/|$)/.exec(n);
  if (m === null) return false;
  const v = `${m[1]}/proyectos`;
  return dentroDe(v, n) || dentroDe(n, v);
}

const esEnv = (nombre: string): boolean => /^\.env/i.test(nombre) || /\.env$/i.test(nombre);
const esAjeno = (ruta: string): boolean => /flyenv|phpwebstudy/i.test(ruta);

const MOTIVOS_EN_USO = new Set(['EBUSY', 'EPERM', 'EACCES', 'ETXTBSY']);

interface Candidato {
  ruta: string;
  bytes: number;
}

type Saltar = (m: MotivoSaltoLimpieza, n?: number) => void;

class Cancelada extends Error {}

const ultimoComponente = (r: string): string =>
  r
    .split(/[\\/]+/)
    .filter((t) => t !== '')
    .pop() ?? '';

async function registroEnArchivo(destino: string): Promise<RegistroLimpieza> {
  const { ruta, handle } = await abrirNuevo(destino);
  return {
    ruta,
    // `writeFile` sobre el handle escribe desde la posición actual: cada llamada añade.
    escribir: (texto) => handle.writeFile(texto, 'utf8'),
    cerrar: () => handle.close(),
  };
}

export class LimpiezaDisco {
  private ocupada = false;
  private control: AbortController | null = null;
  /** Hora del último análisis de cada categoría (la referencia de edad al limpiar). */
  private readonly analizadas = new Map<CategoriaLimpieza, number>();

  constructor(private readonly d: DepsLimpiezaDisco) {}

  private ahora(): number {
    return (this.d.ahora ?? Date.now)();
  }

  /** Corta el análisis o la limpieza en curso (si la hay). */
  cancelar(): void {
    this.control?.abort();
  }

  private validarCategorias(categorias: readonly string[]): CategoriaLimpieza[] {
    const res: CategoriaLimpieza[] = [];
    for (const c of categorias) {
      if (!(CATEGORIAS_LIMPIEZA as readonly string[]).includes(c)) {
        throw new ErrorWolf('disco.categoria_invalida', 'Esa categoría de limpieza no existe.');
      }
      if (!res.includes(c as CategoriaLimpieza)) res.push(c as CategoriaLimpieza);
    }
    return res;
  }

  private async vetos(): Promise<string[]> {
    const lista = [...VETADAS_FIJAS, ...(await this.d.rutasVetadas())];
    const res = new Set<string>();
    for (const v of lista) {
      if (v === '') continue;
      res.add(normalizar(v));
      res.add(normalizar(await realpath(v).catch(() => v)));
    }
    return [...res];
  }

  /** La ruta está vetada, dentro de algo vetado o contiene algo vetado. */
  private vetada(ruta: string, vetos: readonly string[]): boolean {
    return (
      esAjeno(ruta) ||
      tocaProyectos(ruta) ||
      vetos.some((v) => dentroDe(v, ruta) || dentroDe(ruta, v))
    );
  }

  private async rutasDe(categoria: CategoriaLimpieza): Promise<RutasCategoriaLimpieza | null> {
    const todas = await this.d.plataforma.rutasLimpieza(this.d.carpetaDatos());
    return todas.find((c) => c.categoria === categoria) ?? null;
  }

  /**
   * Ruta real de `r` si ni ella ni su padre son un enlace o una unión: la real de `r` tiene que
   * ser la real de su padre más su nombre, y lo mismo el padre con el abuelo. Se compara con el
   * padre ya resuelto para que un nombre corto 8.3 (`RUNNER~1`) o `/var` → `/private/var` más
   * arriba no rechace una raíz legítima. null si no cuadra.
   */
  private async realSinRedirigir(r: string): Promise<string | null> {
    const real = await realpath(r).catch(() => null);
    if (real === null) return null;
    const padre = path.dirname(r);
    if (padre === r) return real;
    const lp = await lstat(padre).catch(() => null);
    if (lp === null || lp.isSymbolicLink() || !lp.isDirectory()) return null;
    const realPadre = await realpath(padre).catch(() => null);
    if (realPadre === null) return null;
    if (normalizar(real) !== normalizar(path.join(realPadre, path.basename(r)))) return null;
    const abuelo = path.dirname(padre);
    if (abuelo !== padre) {
      const realAbuelo = await realpath(abuelo).catch(() => null);
      if (
        realAbuelo === null ||
        normalizar(realPadre) !== normalizar(path.join(realAbuelo, path.basename(padre)))
      ) {
        return null;
      }
    }
    return real;
  }

  /**
   * Comprueba cada raíz de la categoría y devuelve las reales (las que existen y no redirigen).
   * Una raíz que es un enlace, una unión o no es una carpeta se rechaza (motivo `enlace`). Si
   * alguna está vetada o contiene algo vetado, lanza `disco.ruta_vetada` (la categoría entera).
   */
  private async raicesSeguras(
    categoria: CategoriaLimpieza,
    ruta: RutasCategoriaLimpieza,
    vetos: string[],
  ): Promise<{ raices: string[]; saltados: Partial<Record<MotivoSaltoLimpieza, number>> }> {
    const vetada = (): ErrorWolf =>
      new ErrorWolf('disco.ruta_vetada', 'La categoría toca una ruta protegida; no se limpia.', {
        categoria,
      });
    const raices: string[] = [];
    const saltados: Partial<Record<MotivoSaltoLimpieza, number>> = {};
    const saltar = (m: MotivoSaltoLimpieza): void => {
      saltados[m] = (saltados[m] ?? 0) + 1;
    };
    const esCache = (r: string): boolean => CARPETAS_CACHE.has(ultimoComponente(r).toLowerCase());
    for (const r of ruta.rutas) {
      if (!path.isAbsolute(r) && !/^[A-Za-z]:[\\/]/.test(r)) throw vetada();
      if (this.vetada(r, vetos)) throw vetada();
      if (ruta.navegador !== undefined && !esCache(r)) throw vetada();
      const lr = await lstat(r).catch((e: unknown) =>
        (e as { code?: string }).code === 'ENOENT' ? ('ausente' as const) : null,
      );
      if (lr === 'ausente') continue;
      if (lr === null) {
        saltar('ilegible');
        continue;
      }
      if (lr.isSymbolicLink() || !lr.isDirectory()) {
        saltar('enlace');
        continue;
      }
      const real = await this.realSinRedirigir(r);
      if (real === null) {
        saltar('enlace');
        continue;
      }
      if (this.vetada(real, vetos)) throw vetada();
      if (ruta.navegador !== undefined && !esCache(real)) {
        saltar('enlace');
        continue;
      }
      if (!raices.some((x) => normalizar(x) === normalizar(real))) raices.push(real);
    }
    return { raices, saltados };
  }

  private async bloqueo(ruta: RutasCategoriaLimpieza): Promise<BloqueoLimpieza | null> {
    if (ruta.bloqueo !== undefined) return ruta.bloqueo;
    if (ruta.navegador !== undefined && (await this.navegadorAbierto(ruta.navegador))) {
      return 'navegador-abierto';
    }
    if (ruta.requiereAdmin && !(await this.d.plataforma.esAdministrador().catch(() => false))) {
      return 'requiere-admin';
    }
    return null;
  }

  /** true si está abierto o si no se puede saber (nunca se limpia a ciegas). */
  private async navegadorAbierto(n: NavegadorLimpieza): Promise<boolean> {
    try {
      return (await this.d.plataforma.navegadoresAbiertos()).includes(n);
    } catch {
      return true;
    }
  }

  /** ¿El archivo cumple la regla? La edad se mide respecto a `referencia` (hora del análisis). */
  private aceptaArchivo(r: Regla, nombre: string, st: Stats, referencia: number): boolean {
    if (r.nombre && !r.nombre.test(nombre)) return false;
    if (r.edadMs === null) return true;
    const marca =
      r.edadPor === 'reciente' ? Math.max(st.mtimeMs, st.birthtimeMs || 0, st.ctimeMs) : st.mtimeMs;
    return referencia - marca > r.edadMs;
  }

  /**
   * Recorre una raíz real sin seguir enlaces, carpeta a carpeta: por cada una llama a
   * `porCarpeta` con sus archivos que pasan la regla ANTES de bajar a las subcarpetas, así que
   * la limpieza borra a medida que recorre (no hay una lista vieja de todo el árbol). Si
   * `porCarpeta` devuelve false, se para. Una subcarpeta vetada lanza `disco.ruta_vetada`.
   * `excluir`: rutas (normalizadas) que nunca se listan (el registro de esta ejecución).
   */
  private async recorrer(
    raiz: string,
    regla: Regla,
    vetos: string[],
    referencia: number,
    excluir: ReadonlySet<string>,
    senal: AbortSignal,
    saltar: Saltar,
    porCarpeta: (dir: string, archivos: Candidato[]) => Promise<boolean>,
  ): Promise<void> {
    const pila = [raiz];
    while (pila.length > 0) {
      if (senal.aborted) throw new Cancelada();
      const dir = pila.pop()!;
      let entradas: Dirent[];
      try {
        entradas = await readdir(dir, { withFileTypes: true });
      } catch {
        saltar('ilegible');
        continue;
      }
      const archivos: Candidato[] = [];
      const subcarpetas: string[] = [];
      for (const e of entradas) {
        const completa = path.join(dir, e.name);
        if (esEnv(e.name) || esAjeno(completa)) {
          saltar('protegido');
          continue;
        }
        const st = await lstat(completa).catch(() => null);
        if (st === null) continue;
        if (st.isSymbolicLink()) {
          saltar('enlace');
          continue;
        }
        if (st.isDirectory()) {
          if (!regla.recursiva) continue;
          const real = await realpath(completa).catch(() => null);
          if (real === null || normalizar(real) !== normalizar(completa)) {
            saltar('enlace');
            continue;
          }
          if (this.vetada(real, vetos)) {
            throw new ErrorWolf('disco.ruta_vetada', 'La categoría toca una ruta protegida.', {
              categoria: 'desconocida',
            });
          }
          subcarpetas.push(completa);
        } else if (st.isFile()) {
          if (excluir.has(normalizar(completa))) continue;
          if (!this.aceptaArchivo(regla, e.name, st, referencia)) continue;
          archivos.push({ ruta: completa, bytes: st.size });
        } else {
          saltar('enlace');
        }
      }
      if (!(await porCarpeta(dir, archivos))) return;
      for (let i = subcarpetas.length - 1; i >= 0; i--) pila.push(subcarpetas[i]!);
    }
  }

  private entrar(): AbortSignal {
    if (this.ocupada) {
      throw new ErrorWolf('disco.ocupada', 'Ya hay una limpieza o un análisis en curso.');
    }
    this.ocupada = true;
    this.control = new AbortController();
    return this.control.signal;
  }

  private salir(): void {
    this.ocupada = false;
    this.control = null;
  }

  /** Lista qué se limpiaría y cuánto pesa. Solo lee: no borra ni cambia nada. */
  async analizar(categorias: readonly string[] = []): Promise<ResumenCategoria[]> {
    const pedidas = this.validarCategorias(
      categorias.length === 0 ? CATEGORIAS_LIMPIEZA : categorias,
    );
    const senal = this.entrar();
    try {
      const vetos = await this.vetos();
      const res: ResumenCategoria[] = [];
      for (const categoria of pedidas) {
        if (senal.aborted) break;
        const regla = REGLAS[categoria];
        const hora = this.ahora();
        const base: ResumenCategoria = {
          categoria,
          archivos: 0,
          bytes: 0,
          bloqueada: null,
          marcada: regla.marcada,
          borrado: regla.borrado,
          carpetas: [],
          truncado: false,
        };
        const ruta = await this.rutasDe(categoria);
        if (ruta === null) {
          res.push(base);
          continue;
        }
        base.bloqueada = await this.bloqueo(ruta);
        let raices: string[];
        try {
          raices = (await this.raicesSeguras(categoria, ruta, vetos)).raices;
        } catch (e) {
          if (!(e instanceof ErrorWolf)) throw e;
          base.bloqueada = 'ruta-vetada';
          res.push(base);
          continue;
        }
        try {
          for (const raiz of raices) {
            const carpeta: CarpetaAnalizada = { ruta: raiz, archivos: 0, bytes: 0 };
            await this.recorrer(
              raiz,
              regla,
              vetos,
              hora,
              new Set(),
              senal,
              () => undefined,
              async (_dir, archivos) => {
                const cabe = MAX_ARCHIVOS_ANALISIS - base.archivos;
                const tomados = archivos.length > cabe ? archivos.slice(0, cabe) : archivos;
                for (const a of tomados) {
                  carpeta.archivos++;
                  carpeta.bytes += a.bytes;
                  base.archivos++;
                  base.bytes += a.bytes;
                }
                if (archivos.length > cabe) {
                  base.truncado = true;
                  return false;
                }
                return true;
              },
            );
            base.carpetas.push(carpeta);
            if (base.truncado) break;
          }
        } catch (e) {
          if (e instanceof Cancelada) break;
          if (e instanceof ErrorWolf) {
            base.bloqueada = 'ruta-vetada';
            base.archivos = 0;
            base.bytes = 0;
            base.carpetas = [];
            res.push(base);
            continue;
          }
          throw e;
        }
        this.analizadas.set(categoria, hora);
        res.push(base);
      }
      return res;
    } finally {
      this.salir();
    }
  }

  /**
   * Borra lo que listaría `analizar` en las categorías dadas, carpeta a carpeta. Exige
   * `confirmado === true` y que cada categoría se haya analizado hace poco; solo borra lo que ya
   * cumplía la regla de edad a la hora de ese análisis.
   */
  async limpiar(categorias: readonly string[], confirmado: true): Promise<ResultadoLimpiezaDisco> {
    if ((confirmado as unknown) !== true) {
      throw new ErrorWolf('disco.sin_confirmar', 'Falta la confirmación de la limpieza.');
    }
    const pedidas = this.validarCategorias(categorias);
    if (pedidas.length === 0) {
      throw new ErrorWolf('disco.categoria_invalida', 'No hay ninguna categoría elegida.');
    }
    const horas = new Map<CategoriaLimpieza, number>();
    for (const c of pedidas) {
      const t = this.analizadas.get(c);
      if (t === undefined || this.ahora() - t > VIGENCIA_ANALISIS_MS) {
        throw new ErrorWolf('disco.sin_analisis', 'Analiza antes de limpiar.');
      }
      horas.set(c, t);
    }
    const senal = this.entrar();
    try {
      const vetosIniciales = await this.vetos();
      // Todo se valida ANTES de borrar nada: una categoría con rutas vetadas aborta la ejecución.
      const plan: {
        categoria: CategoriaLimpieza;
        ruta: RutasCategoriaLimpieza;
        raices: string[];
        rechazadas: Partial<Record<MotivoSaltoLimpieza, number>>;
      }[] = [];
      for (const categoria of pedidas) {
        const ruta = await this.rutasDe(categoria);
        if (ruta === null) continue;
        const { raices, saltados } = await this.raicesSeguras(categoria, ruta, vetosIniciales);
        plan.push({ categoria, ruta, raices, rechazadas: saltados });
      }
      const carpetaRegistro = this.d.carpetaRegistro();
      const sello = new Date(this.ahora()).toISOString().replace(/[:.]/g, '-');
      let registro: RegistroLimpieza;
      try {
        await mkdir(carpetaRegistro, { recursive: true });
        registro = await (this.d.abrirRegistro ?? registroEnArchivo)(
          path.join(carpetaRegistro, `limpieza-${sello}.log`),
        );
      } catch (e) {
        throw new ErrorWolf(
          'disco.sin_registro',
          'No se pudo crear el registro de la limpieza; no se borró nada.',
          undefined,
          { cause: e },
        );
      }
      try {
        await registro.escribir(
          [
            `Limpieza de disco ${new Date(this.ahora()).toISOString()}`,
            `Categorias pedidas: ${plan.map((p) => p.categoria).join(', ') || '(ninguna)'}`,
            '',
            'Rutas borradas:',
            '',
          ].join('\n'),
        );
      } catch (e) {
        await registro.cerrar().catch(() => undefined);
        throw new ErrorWolf(
          'disco.sin_registro',
          'No se pudo escribir el registro de la limpieza; no se borró nada.',
          undefined,
          { cause: e },
        );
      }
      await this.purgarRegistros(carpetaRegistro, registro.ruta);
      // Se excluye por su ruta real: el recorrido trabaja con rutas reales (en macOS, /var es
      // /private/var; en Windows, sin nombres cortos).
      const excluir = new Set([
        normalizar(registro.ruta),
        normalizar(await realpath(registro.ruta).catch(() => registro.ruta)),
      ]);
      const resultado: ResultadoLimpiezaDisco = {
        liberados: 0,
        enPapelera: 0,
        archivos: 0,
        saltados: 0,
        categorias: [],
        cancelado: false,
        truncado: false,
        registro: registro.ruta,
        registroFallido: false,
      };
      // Registro incremental: las rutas se escriben por lotes; si falla, se deja de borrar.
      let pendientes: string[] = [];
      let rutasEscritas = 0;
      let totalRutas = 0;
      const volcar = async (extra: string[] = []): Promise<boolean> => {
        if (resultado.registroFallido) return false;
        const lineas = [...pendientes, ...extra];
        pendientes = [];
        if (lineas.length === 0) return true;
        try {
          await registro.escribir(`${lineas.join('\n')}\n`);
          return true;
        } catch {
          resultado.registroFallido = true;
          return false;
        }
      };
      const anotar = async (linea: string): Promise<boolean> => {
        totalRutas++;
        if (rutasEscritas >= MAX_RUTAS_REGISTRO) return true;
        rutasEscritas++;
        pendientes.push(linea);
        return pendientes.length >= LOTE_REGISTRO ? volcar() : true;
      };
      const tope = this.d.topeArchivos ?? MAX_ARCHIVOS_LIMPIEZA;
      try {
        for (const { categoria, ruta, raices, rechazadas } of plan) {
          if (senal.aborted) {
            resultado.cancelado = true;
            break;
          }
          if (resultado.registroFallido || resultado.truncado) break;
          const regla = REGLAS[categoria];
          const referencia = horas.get(categoria)!;
          const cat: ResultadoCategoriaLimpieza = {
            categoria,
            archivos: 0,
            bytes: 0,
            saltados: 0,
            motivos: {},
            bloqueada: await this.bloqueo(ruta),
          };
          resultado.categorias.push(cat);
          const saltar: Saltar = (m, n = 1) => {
            cat.motivos[m] = (cat.motivos[m] ?? 0) + n;
            cat.saltados += n;
            resultado.saltados += n;
          };
          if (cat.bloqueada === null) {
            for (const [m, n] of Object.entries(rechazadas)) saltar(m as MotivoSaltoLimpieza, n);
            // Los vetos se vuelven a leer por categoría: un sitio pudo registrarse mientras tanto.
            const vetos = await this.vetos();
            try {
              for (const raiz of raices) {
                if (resultado.archivos >= tope) {
                  resultado.truncado = true;
                  break;
                }
                // El navegador pudo abrirse mientras tanto: se vuelve a comprobar en cada raíz.
                if (ruta.navegador !== undefined && (await this.navegadorAbierto(ruta.navegador))) {
                  cat.bloqueada = 'navegador-abierto';
                  break;
                }
                const tocadas = new Set<string>();
                try {
                  await this.recorrer(
                    raiz,
                    regla,
                    vetos,
                    referencia,
                    excluir,
                    senal,
                    saltar,
                    async (_dir, archivos) => {
                      for (const f of archivos) {
                        if (senal.aborted) {
                          resultado.cancelado = true;
                          return false;
                        }
                        if (resultado.archivos >= tope) {
                          resultado.truncado = true;
                          return false;
                        }
                        const r = await this.borrarUno(f.ruta, raiz, regla, vetos, referencia);
                        if (r.estado === 'saltado') {
                          saltar(r.motivo);
                          continue;
                        }
                        if (r.estado === 'ausente') continue;
                        cat.archivos++;
                        cat.bytes += r.bytes;
                        resultado.archivos++;
                        resultado.liberados += r.bytes;
                        if (r.estado === 'papelera') resultado.enPapelera += r.bytes;
                        if (regla.carpetasVacias) {
                          for (
                            let p = path.dirname(f.ruta);
                            dentroDe(raiz, p) && normalizar(p) !== normalizar(raiz);
                            p = path.dirname(p)
                          ) {
                            tocadas.add(p);
                          }
                        }
                        const ok = await anotar(
                          r.estado === 'papelera' ? `${f.ruta}  (papelera)` : f.ruta,
                        );
                        if (!ok) return false;
                      }
                      return true;
                    },
                  );
                } finally {
                  if (regla.carpetasVacias) await this.quitarVacias(tocadas, raiz, vetos);
                }
                if (resultado.cancelado || resultado.truncado || resultado.registroFallido) break;
              }
            } catch (err) {
              if (err instanceof Cancelada) {
                resultado.cancelado = true;
              } else if (err instanceof ErrorWolf) {
                // Una ruta vetada a mitad: esta categoría se para y se sigue con las demás.
                cat.bloqueada = 'ruta-vetada';
              } else {
                throw err;
              }
            }
          }
          await volcar([this.lineaCategoria(cat)]);
          if (resultado.cancelado) break;
        }
      } finally {
        const resumen = [
          '',
          `Archivos: ${resultado.archivos}`,
          `Bytes: ${resultado.liberados} (a la papelera: ${resultado.enPapelera})`,
          `Saltados: ${resultado.saltados}`,
          `Cancelada: ${resultado.cancelado ? 'si' : 'no'}`,
          `Tope de archivos alcanzado: ${resultado.truncado ? 'si' : 'no'}`,
          `Rutas en el registro: ${rutasEscritas} de ${totalRutas}`,
          ...(totalRutas > rutasEscritas
            ? [`... y ${totalRutas - rutasEscritas} mas (solo el total)`]
            : []),
          '',
        ];
        await volcar(resumen);
        try {
          await registro.cerrar();
        } catch {
          resultado.registroFallido = true;
        }
      }
      return resultado;
    } finally {
      this.salir();
    }
  }

  private lineaCategoria(c: ResultadoCategoriaLimpieza): string {
    const motivos = Object.entries(c.motivos)
      .map(([m, n]) => `${m}=${n}`)
      .join(' ');
    return `  ${c.categoria}: ${c.archivos} archivos, ${c.bytes} bytes, ${c.saltados} saltados${motivos ? ` (${motivos})` : ''}${c.bloqueada ? `, bloqueada: ${c.bloqueada}` : ''}`;
  }

  /**
   * La carpeta que contiene `ruta` sigue siendo la que se recorrió: su ruta real es ella misma
   * (ninguna carpeta intermedia se cambió por un enlace o una unión) y está dentro de la raíz.
   */
  private async carpetaIntacta(ruta: string, raiz: string): Promise<boolean> {
    const dir = path.dirname(ruta);
    const real = await realpath(dir).catch(() => null);
    return real !== null && normalizar(real) === normalizar(dir) && dentroDe(raiz, real);
  }

  private async borrarUno(
    ruta: string,
    raiz: string,
    regla: Regla,
    vetos: string[],
    referencia: number,
  ): Promise<
    | { estado: 'borrado' | 'papelera'; bytes: number }
    | { estado: 'ausente' }
    | { estado: 'saltado'; motivo: MotivoSaltoLimpieza }
  > {
    // Otra vez, justo antes: dentro de la raíz, no vetado y el mismo tipo de archivo.
    if (!dentroDe(raiz, ruta) || normalizar(ruta) === normalizar(raiz)) {
      return { estado: 'saltado', motivo: 'protegido' };
    }
    const nombre = path.basename(ruta);
    if (esEnv(nombre) || this.vetada(ruta, vetos)) {
      return { estado: 'saltado', motivo: 'protegido' };
    }
    await this.d.antesDeBorrar?.(ruta);
    // La carpeta del archivo no puede haberse cambiado por una unión desde que se recorrió.
    // Queda una carrera residual entre esta comprobación y el `unlink`: Node no tiene `openat`
    // ni `unlinkat` relativos a un descriptor de carpeta, así que no se puede borrar "dentro de
    // la carpeta ya comprobada". La ventana es de microsegundos y exige reemplazar una carpeta
    // del usuario a propósito justo entonces.
    if (!(await this.carpetaIntacta(ruta, raiz))) return { estado: 'saltado', motivo: 'enlace' };
    const st = await lstat(ruta).catch((e: unknown) =>
      (e as { code?: string }).code === 'ENOENT' ? 'ausente' : null,
    );
    if (st === 'ausente') return { estado: 'ausente' };
    if (st === null) return { estado: 'saltado', motivo: 'ilegible' };
    if (st.isSymbolicLink() || !st.isFile()) return { estado: 'saltado', motivo: 'enlace' };
    if (!this.aceptaArchivo(regla, nombre, st, referencia)) {
      return { estado: 'saltado', motivo: 'cambio' };
    }
    if (regla.borrado === 'papelera') {
      const ok = await this.d.plataforma.aPapelera(ruta);
      return ok
        ? { estado: 'papelera', bytes: st.size }
        : { estado: 'saltado', motivo: 'sin-papelera' };
    }
    try {
      await (this.d.borrar ?? unlink)(ruta);
      return { estado: 'borrado', bytes: st.size };
    } catch (e) {
      const codigo = (e as { code?: string }).code ?? '';
      if (codigo === 'ENOENT') return { estado: 'ausente' };
      return { estado: 'saltado', motivo: MOTIVOS_EN_USO.has(codigo) ? 'en-uso' : 'error' };
    }
  }

  /** Quita carpetas vacías (de la más honda a la más alta); `rmdir` no borra las que tienen algo. */
  private async quitarVacias(tocadas: Set<string>, raiz: string, vetos: string[]): Promise<void> {
    const orden = [...tocadas].sort((a, b) => b.length - a.length);
    for (const dir of orden) {
      if (!dentroDe(raiz, dir) || normalizar(dir) === normalizar(raiz)) continue;
      if (this.vetada(dir, vetos)) continue;
      const st = await lstat(dir).catch(() => null);
      if (st === null || st.isSymbolicLink() || !st.isDirectory()) continue;
      // Ni la carpeta ni ninguna de las que la contienen se cambió por una unión (misma carrera
      // residual que en `borrarUno`).
      const real = await realpath(dir).catch(() => null);
      if (real === null || normalizar(real) !== normalizar(dir)) continue;
      if (!(await this.carpetaIntacta(dir, raiz))) continue;
      await rmdir(dir).catch(() => undefined);
    }
  }

  /** Borra los registros de limpieza de más de 90 días (nunca el que se acaba de abrir). */
  private async purgarRegistros(carpeta: string, actual: string): Promise<void> {
    let nombres: string[];
    try {
      nombres = await readdir(carpeta);
    } catch {
      return;
    }
    for (const n of nombres) {
      if (!/^limpieza-.*\.log$/i.test(n)) continue;
      const r = path.join(carpeta, n);
      if (normalizar(r) === normalizar(actual)) continue;
      const st = await lstat(r).catch(() => null);
      if (st === null || st.isSymbolicLink() || !st.isFile()) continue;
      if (this.ahora() - st.mtimeMs <= EDAD_PURGA_REGISTROS_LIMPIEZA_MS) continue;
      await unlink(r).catch(() => undefined);
    }
  }
}
