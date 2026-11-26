import type { Dirent } from 'node:fs';
import { lstat, mkdir, readdir, realpath, rmdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { abrirNuevo } from '../herramientas/salidaNueva';
import type {
  CategoriaLimpieza,
  NavegadorLimpieza,
  PlataformaCompleta,
  RutasCategoriaLimpieza,
} from '../plataforma/tipos';

/**
 * Limpieza de disco (D37). Reglas que no se negocian:
 *
 * - Solo se toca lo que devuelve `Plataforma.rutasLimpieza()`. Cada raíz se canoniza y todo lo que
 *   se borra es descendiente de ella, comprobado otra vez justo antes de borrar.
 * - No se siguen enlaces simbólicos, uniones ni ningún punto de reanálisis: con `lstat`, y un
 *   directorio solo se baja si su ruta real es la que se esperaba. Lo que no cuadra se salta.
 * - Rutas vetadas (datos y respaldos de WolfCore, proyectos de los sitios, `C:\\Proyectos`, lo que
 *   contenga FlyEnv o PhpWebStudy, y cualquier `.env`): si una raíz las contiene o está dentro de
 *   una, TODA la categoría se aborta con `limpieza.ruta_vetada` y no se borra nada. Un `.env` o un
 *   FlyEnv suelto dentro de una raíz válida no se toca y se cuenta como saltado.
 * - Con el navegador abierto su caché queda bloqueada; se comprueba otra vez antes de borrar. Si
 *   no se puede saber, se trata como abierto.
 * - Nada ocurre solo: `analizar` solo lee y `limpiar` exige `confirmado === true` y un análisis
 *   previo reciente de cada categoría.
 * - Archivos en uso (EBUSY, EPERM, EACCES): se saltan y se cuentan. Hay un tope de archivos por
 *   ejecución y se puede cancelar.
 * - Cada ejecución deja un registro de texto en la carpeta de registros de WolfCore Dev.
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

export type BloqueoLimpieza = 'navegador-abierto' | 'requiere-admin' | 'ruta-vetada';

export type MotivoSaltoLimpieza =
  'en-uso' | 'enlace' | 'protegido' | 'cambio' | 'sin-papelera' | 'ilegible' | 'error';

export const HORA_MS = 3_600_000;
export const EDAD_TEMP_MS = 24 * HORA_MS;
export const EDAD_REGISTROS_MS = 30 * 24 * HORA_MS;
/** Tope de archivos que borra una ejecución; el resto queda para la siguiente. */
export const MAX_ARCHIVOS_LIMPIEZA = 50_000;
/** Tope de archivos que cuenta un análisis. */
export const MAX_ARCHIVOS_ANALISIS = 200_000;
/** Un análisis vale para limpiar durante este tiempo. */
export const VIGENCIA_ANALISIS_MS = 30 * 60_000;
/** Líneas de rutas que lleva el registro; después, solo el total. */
export const MAX_RUTAS_REGISTRO = 5000;

/** Únicas carpetas de un perfil de navegador que se limpian. */
const CARPETAS_CACHE = new Set(['cache', 'code cache', 'gpucache', 'cache2']);

interface Regla {
  recursiva: boolean;
  /** Solo archivos con más edad que esto (por fecha de modificación). */
  edadMs: number | null;
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
    nombre: /\.(?:zip|7z|tar|gz|tgz|xz|bz2|parcial)$/i,
    borrado: 'papelera',
    marcada: false,
    carpetasVacias: false,
  },
  'wolfcore-registros': {
    recursiva: true,
    edadMs: EDAD_REGISTROS_MS,
    borrado: 'papelera',
    marcada: false,
    carpetasVacias: false,
  },
  prefetch: {
    recursiva: false,
    edadMs: null,
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
  /** Tamaño por carpeta (una por cada ruta de la categoría). */
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
}

/** Siempre vetado, sin depender de quien configure el núcleo. */
const VETADAS_FIJAS = ['C:/Proyectos'];

const normalizar = (r: string): string => r.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

function dentroDe(padre: string, hija: string): boolean {
  const p = normalizar(padre);
  const h = normalizar(hija);
  return h === p || h.startsWith(`${p}/`);
}

const esEnv = (nombre: string): boolean => /^\.env(?:\..*)?$/i.test(nombre);
const esAjeno = (ruta: string): boolean => /flyenv|phpwebstudy/i.test(ruta);

const MOTIVOS_EN_USO = new Set(['EBUSY', 'EPERM', 'EACCES', 'ETXTBSY']);

interface Candidato {
  ruta: string;
  bytes: number;
}

interface Escaneo {
  archivos: Candidato[];
  bytes: number;
  directorios: string[];
  saltados: Partial<Record<MotivoSaltoLimpieza, number>>;
  truncado: boolean;
}

class Cancelada extends Error {}

export class LimpiezaDisco {
  private ocupada = false;
  private control: AbortController | null = null;
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

  private async rutasDe(categoria: CategoriaLimpieza): Promise<RutasCategoriaLimpieza | null> {
    const todas = await this.d.plataforma.rutasLimpieza(this.d.carpetaDatos());
    return todas.find((c) => c.categoria === categoria) ?? null;
  }

  /**
   * Comprueba cada raíz de la categoría y devuelve las canónicas (las que existen). Si alguna
   * está vetada o contiene algo vetado, aborta la categoría completa.
   */
  private async raicesSeguras(
    categoria: CategoriaLimpieza,
    ruta: RutasCategoriaLimpieza,
    vetos: string[],
  ): Promise<string[]> {
    const vetada = (): ErrorWolf =>
      new ErrorWolf('disco.ruta_vetada', 'La categoría toca una ruta protegida; no se limpia.', {
        categoria,
      });
    const res: string[] = [];
    for (const r of ruta.rutas) {
      if (!path.isAbsolute(r) && !/^[A-Za-z]:[\\/]/.test(r)) throw vetada();
      const crudas = [normalizar(r)];
      let canonica: string | null = null;
      try {
        canonica = await realpath(r);
        crudas.push(normalizar(canonica));
      } catch {
        canonica = null;
      }
      for (const n of crudas) {
        if (esAjeno(n)) throw vetada();
        if (vetos.some((v) => dentroDe(v, n) || dentroDe(n, v))) throw vetada();
      }
      if (ruta.navegador !== undefined) {
        const ultimo =
          r
            .split(/[\\/]+/)
            .filter((t) => t !== '')
            .pop() ?? '';
        if (!CARPETAS_CACHE.has(ultimo.toLowerCase())) throw vetada();
      }
      if (canonica !== null) res.push(canonica);
    }
    return res;
  }

  private async bloqueo(ruta: RutasCategoriaLimpieza): Promise<BloqueoLimpieza | null> {
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

  private aceptaArchivo(r: Regla, nombre: string, mtimeMs: number): boolean {
    if (r.nombre && !r.nombre.test(nombre)) return false;
    if (r.edadMs !== null && !(this.ahora() - mtimeMs > r.edadMs)) return false;
    return true;
  }

  /**
   * Recorre una raíz canónica sin seguir enlaces. Los archivos que pasan la regla van a la lista.
   * `excluir`: rutas (normalizadas) que nunca se listan (el registro de esta ejecución).
   */
  private async escanear(
    raiz: string,
    regla: Regla,
    vetos: string[],
    tope: number,
    excluir: ReadonlySet<string>,
    senal: AbortSignal,
  ): Promise<Escaneo> {
    const res: Escaneo = { archivos: [], bytes: 0, directorios: [], saltados: {}, truncado: false };
    const saltar = (m: MotivoSaltoLimpieza): void => {
      res.saltados[m] = (res.saltados[m] ?? 0) + 1;
    };
    const lr = await lstat(raiz).catch(() => null);
    if (lr === null || lr.isSymbolicLink() || !lr.isDirectory()) {
      if (lr !== null) saltar('enlace');
      return res;
    }
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
          if (vetos.some((v) => dentroDe(v, real) || dentroDe(real, v))) {
            throw new ErrorWolf('disco.ruta_vetada', 'La categoría toca una ruta protegida.', {
              categoria: 'desconocida',
            });
          }
          res.directorios.push(completa);
          pila.push(completa);
        } else if (st.isFile()) {
          if (excluir.has(normalizar(completa))) continue;
          if (!this.aceptaArchivo(regla, e.name, st.mtimeMs)) continue;
          if (res.archivos.length >= tope) {
            res.truncado = true;
            return res;
          }
          res.archivos.push({ ruta: completa, bytes: st.size });
          res.bytes += st.size;
        } else {
          saltar('enlace');
        }
      }
    }
    return res;
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
          raices = await this.raicesSeguras(categoria, ruta, vetos);
        } catch (e) {
          if (!(e instanceof ErrorWolf)) throw e;
          base.bloqueada = 'ruta-vetada';
          res.push(base);
          continue;
        }
        try {
          for (const raiz of raices) {
            const e = await this.escanear(
              raiz,
              regla,
              vetos,
              MAX_ARCHIVOS_ANALISIS - base.archivos,
              new Set(),
              senal,
            );
            base.archivos += e.archivos.length;
            base.bytes += e.bytes;
            base.truncado ||= e.truncado;
            base.carpetas.push({ ruta: raiz, archivos: e.archivos.length, bytes: e.bytes });
            if (e.truncado) break;
          }
        } catch (e) {
          if (e instanceof Cancelada) break;
          if (e instanceof ErrorWolf) {
            base.bloqueada = 'ruta-vetada';
            res.push(base);
            continue;
          }
          throw e;
        }
        this.analizadas.set(categoria, this.ahora());
        res.push(base);
      }
      return res;
    } finally {
      this.salir();
    }
  }

  /**
   * Borra lo listado por `analizar` en las categorías dadas. Exige `confirmado === true` y que
   * cada categoría se haya analizado hace poco.
   */
  async limpiar(categorias: readonly string[], confirmado: true): Promise<ResultadoLimpiezaDisco> {
    if ((confirmado as unknown) !== true) {
      throw new ErrorWolf('disco.sin_confirmar', 'Falta la confirmación de la limpieza.');
    }
    const pedidas = this.validarCategorias(categorias);
    if (pedidas.length === 0) {
      throw new ErrorWolf('disco.categoria_invalida', 'No hay ninguna categoría elegida.');
    }
    for (const c of pedidas) {
      const t = this.analizadas.get(c);
      if (t === undefined || this.ahora() - t > VIGENCIA_ANALISIS_MS) {
        throw new ErrorWolf('disco.sin_analisis', 'Analiza antes de limpiar.');
      }
    }
    const senal = this.entrar();
    try {
      const vetos = await this.vetos();
      // Todo se valida ANTES de borrar nada: una categoría con rutas vetadas aborta la ejecución.
      const plan: {
        categoria: CategoriaLimpieza;
        ruta: RutasCategoriaLimpieza;
        raices: string[];
      }[] = [];
      for (const categoria of pedidas) {
        const ruta = await this.rutasDe(categoria);
        if (ruta === null) continue;
        plan.push({ categoria, ruta, raices: await this.raicesSeguras(categoria, ruta, vetos) });
      }
      const carpetaRegistro = this.d.carpetaRegistro();
      const sello = new Date(this.ahora()).toISOString().replace(/[:.]/g, '-');
      let registro: Awaited<ReturnType<typeof abrirNuevo>>;
      try {
        await mkdir(carpetaRegistro, { recursive: true });
        registro = await abrirNuevo(path.join(carpetaRegistro, `limpieza-${sello}.log`));
      } catch {
        throw new ErrorWolf(
          'disco.sin_registro',
          'No se pudo crear el registro de la limpieza; no se borró nada.',
        );
      }
      const excluir = new Set([normalizar(registro.ruta)]);
      const rutasBorradas: string[] = [];
      let totalRutas = 0;
      const resultado: ResultadoLimpiezaDisco = {
        liberados: 0,
        enPapelera: 0,
        archivos: 0,
        saltados: 0,
        categorias: [],
        cancelado: false,
        truncado: false,
        registro: registro.ruta,
      };
      try {
        for (const { categoria, ruta, raices } of plan) {
          if (senal.aborted) {
            resultado.cancelado = true;
            break;
          }
          const regla = REGLAS[categoria];
          const cat: ResultadoCategoriaLimpieza = {
            categoria,
            archivos: 0,
            bytes: 0,
            saltados: 0,
            motivos: {},
            bloqueada: await this.bloqueo(ruta),
          };
          resultado.categorias.push(cat);
          if (cat.bloqueada !== null) continue;
          const saltar = (m: MotivoSaltoLimpieza, n = 1): void => {
            cat.motivos[m] = (cat.motivos[m] ?? 0) + n;
            cat.saltados += n;
            resultado.saltados += n;
          };
          for (const raiz of raices) {
            const restante = (this.d.topeArchivos ?? MAX_ARCHIVOS_LIMPIEZA) - resultado.archivos;
            if (restante <= 0) {
              resultado.truncado = true;
              break;
            }
            let e: Escaneo;
            try {
              e = await this.escanear(raiz, regla, vetos, restante, excluir, senal);
            } catch (err) {
              if (err instanceof Cancelada) {
                resultado.cancelado = true;
                break;
              }
              throw err;
            }
            for (const [m, n] of Object.entries(e.saltados)) {
              saltar(m as MotivoSaltoLimpieza, n);
            }
            if (e.truncado) resultado.truncado = true;
            // El navegador pudo abrirse mientras se escaneaba: se vuelve a comprobar ya.
            if (ruta.navegador !== undefined && (await this.navegadorAbierto(ruta.navegador))) {
              cat.bloqueada = 'navegador-abierto';
              break;
            }
            const tocadas = new Set<string>();
            for (const f of e.archivos) {
              if (senal.aborted) {
                resultado.cancelado = true;
                break;
              }
              const r = await this.borrarUno(f.ruta, raiz, regla, vetos);
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
              totalRutas++;
              if (rutasBorradas.length < MAX_RUTAS_REGISTRO) {
                rutasBorradas.push(r.estado === 'papelera' ? `${f.ruta}  (papelera)` : f.ruta);
              }
              if (regla.carpetasVacias) {
                for (
                  let p = path.dirname(f.ruta);
                  dentroDe(raiz, p) && normalizar(p) !== normalizar(raiz);
                  p = path.dirname(p)
                ) {
                  tocadas.add(p);
                }
              }
            }
            if (regla.carpetasVacias) await this.quitarVacias(tocadas, raiz, vetos);
            if (resultado.cancelado) break;
          }
        }
      } finally {
        await this.escribirRegistro(registro.handle, resultado, rutasBorradas, totalRutas).catch(
          () => undefined,
        );
      }
      return resultado;
    } finally {
      this.salir();
    }
  }

  private async borrarUno(
    ruta: string,
    raiz: string,
    regla: Regla,
    vetos: string[],
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
    if (esEnv(nombre) || esAjeno(ruta) || vetos.some((v) => dentroDe(v, ruta))) {
      return { estado: 'saltado', motivo: 'protegido' };
    }
    const st = await lstat(ruta).catch((e: unknown) =>
      (e as { code?: string }).code === 'ENOENT' ? 'ausente' : null,
    );
    if (st === 'ausente') return { estado: 'ausente' };
    if (st === null) return { estado: 'saltado', motivo: 'ilegible' };
    if (st.isSymbolicLink() || !st.isFile()) return { estado: 'saltado', motivo: 'enlace' };
    if (!this.aceptaArchivo(regla, nombre, st.mtimeMs))
      return { estado: 'saltado', motivo: 'cambio' };
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
      if (vetos.some((v) => dentroDe(v, dir) || dentroDe(dir, v)) || esAjeno(dir)) continue;
      const st = await lstat(dir).catch(() => null);
      if (st === null || st.isSymbolicLink() || !st.isDirectory()) continue;
      await rmdir(dir).catch(() => undefined);
    }
  }

  private async escribirRegistro(
    handle: Awaited<ReturnType<typeof abrirNuevo>>['handle'],
    r: ResultadoLimpiezaDisco,
    rutas: string[],
    total: number,
  ): Promise<void> {
    const lineas = [
      `Limpieza de disco ${new Date(this.ahora()).toISOString()}`,
      `Categorias: ${r.categorias.map((c) => c.categoria).join(', ') || '(ninguna)'}`,
      `Archivos: ${r.archivos}`,
      `Bytes: ${r.liberados} (a la papelera: ${r.enPapelera})`,
      `Saltados: ${r.saltados}`,
      `Cancelada: ${r.cancelado ? 'si' : 'no'}`,
      `Tope de archivos alcanzado: ${r.truncado ? 'si' : 'no'}`,
      '',
      'Por categoria:',
      ...r.categorias.map((c) => {
        const motivos = Object.entries(c.motivos)
          .map(([m, n]) => `${m}=${n}`)
          .join(' ');
        return `  ${c.categoria}: ${c.archivos} archivos, ${c.bytes} bytes, ${c.saltados} saltados${motivos ? ` (${motivos})` : ''}${c.bloqueada ? `, bloqueada: ${c.bloqueada}` : ''}`;
      }),
      '',
      `Rutas borradas (${Math.min(rutas.length, total)} de ${total}):`,
      ...rutas,
      ...(total > rutas.length ? [`... y ${total - rutas.length} mas (solo el total)`] : []),
      '',
    ];
    try {
      await handle.writeFile(lineas.join('\n'), 'utf8');
    } finally {
      await handle.close();
    }
  }
}
