import { randomBytes } from 'node:crypto';
import { mkdir, lstat, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf, type CodigoError } from '../errores';
import type { Rutas } from '../rutas';
import { CerrojosServicio } from './cerrojo';
import { claveValida } from './comun';
import { SERVICIOS_VERSIONES, type ServicioVersiones } from './tablaVersiones';

/**
 * Limpieza de versiones sin uso (D30). Quita solo binarios de `bin/<servicio>/<versión>`; nunca
 * toca `data/` ni nada fuera de `bin/`. Cada versión se mueve de un golpe (un solo `rename`, que no
 * deja una versión a medias) a la papelera o a una carpeta temporal y solo entonces se borra.
 */

/** Rust no vive en `bin/rust/<versión>` sino en la carpeta común de rustup: no se limpia aquí. */
export const SERVICIOS_LIMPIABLES: readonly ServicioVersiones[] = SERVICIOS_VERSIONES.filter(
  (s) => s !== 'rust',
);

/**
 * Por qué una versión no se puede marcar. Orden de prioridad cuando hay varios. `duda` = no se
 * pudo comprobar algo (una lectura falló, una ruta resuelve fuera de `bin/`): ante la duda, no
 * se borra. `datos` = hay datos en `data/` que solo esta versión (la más nueva de su rama) puede
 * abrir; `herramienta` = la usa phpMyAdmin o Adminer.
 */
export const MOTIVOS_BLOQUEO = [
  'predeterminada',
  'encendida',
  'sitio',
  'instancia',
  'datos',
  'herramienta',
  'plantilla',
  'workspace',
  'runtime',
  'tarea',
  'duda',
] as const;
export type MotivoBloqueo = (typeof MOTIVOS_BLOQUEO)[number];

export interface VersionSinUso {
  servicio: ServicioVersiones;
  /** La carpeta de `bin/<servicio>/` (en PHP, la rama). */
  version: string;
  bytes: number;
  motivoBloqueo: MotivoBloqueo | null;
  /**
   * Lo que el usuario instaló dentro de esta versión (paquetes globales de npm, de pip…), en una
   * lista corta. Con algo aquí, quitarla pierde eso: hay que marcarlo aparte.
   */
  contenidoAjeno: string[];
  /** La versión ya no está en el catálogo: si se quita, no se podrá volver a descargar. */
  sinCatalogo: boolean;
}

export type DestinoLimpieza = 'papelera' | 'definitivo';

export interface SeleccionLimpieza {
  servicio: string;
  version: string;
  /** Acepta perder lo que el usuario instaló dentro de la versión (`contenidoAjeno`). */
  incluirContenidoAjeno?: boolean;
}

export interface FallidoLimpieza {
  servicio: string;
  version: string;
  codigo: CodigoError;
}

export interface ResultadoLimpieza {
  /** Bytes que dejaron de ocupar disco (borrado definitivo terminado). */
  liberados: number;
  /** Bytes que pasaron a la papelera (siguen ocupando disco hasta que se purgue). */
  enPapelera: number;
  fallidos: FallidoLimpieza[];
  /** Versiones ya fuera de `bin/` cuyos restos no se pudieron borrar aún (se reintenta al arrancar). */
  pendientes: number;
  /** Carpeta de la instantánea del entorno (solo en el borrado definitivo; `''` si no hubo). */
  instantanea: string;
}

/** Una versión en la papelera, lista para recuperar. */
export interface VersionEnPapelera {
  id: string;
  servicio: string;
  version: string;
  /** ISO 8601. */
  borrada: string;
  bytes: number;
}

/**
 * Quién usa qué: `servicio/versión` → motivo. Una clave ausente = sin uso; `servicio/*` aplica a
 * todas las versiones del servicio (no se pudo ni listar lo instalado).
 */
export type UsosVersiones = Map<string, MotivoBloqueo>;

export const claveVersion = (servicio: string, version: string): string => `${servicio}/${version}`;

/** Motivo que bloquea `servicio/versión` (el suyo o el de todo el servicio), o undefined. */
export function bloqueoDe(
  usos: UsosVersiones,
  servicio: string,
  version: string,
): MotivoBloqueo | undefined {
  return usos.get(claveVersion(servicio, version)) ?? usos.get(`${servicio}/*`);
}

export interface DepsLimpieza {
  rutas: Rutas;
  /** Carpetas instaladas de un servicio (en PHP, las ramas). */
  instaladas: (servicio: ServicioVersiones) => Promise<string[]>;
  /** Uso actual (sitios, instancias, procesos…): se vuelve a pedir justo antes de borrar. */
  usos: () => Promise<UsosVersiones>;
  /** Instantánea del entorno (D27). Si lanza, no se borra nada. */
  instantanea: () => Promise<string>;
  /** Cerrojo por servicio compartido con el instalador y los servicios de datos. */
  cerrojos?: CerrojosServicio;
  /**
   * ¿Sigue la versión en el catálogo (se puede volver a descargar)? null = no se sabe. Solo para
   * avisar en la vista previa.
   */
  enCatalogo?: (servicio: ServicioVersiones, carpeta: string) => Promise<boolean | null>;
  ahora?: () => Date;
  /** Para las pruebas (simular un archivo bloqueado). Por defecto `fs.rename`. */
  renombrar?: (origen: string, destino: string) => Promise<void>;
}

/** Días que una versión sigue en la papelera. */
export const DIAS_PAPELERA_VERSIONES = 7;
const MAX_SELECCION = 200;
const VERSION_SEGURA = /^[\w.-]{1,64}$/;
const DE_PAPELERA = /^[a-z0-9-]{1,40}__[\w.-]{1,64}__\d{8}-\d{6}-[0-9a-f]{6}$/;
const MAX_CONTENIDO_AJENO = 10;

const normal = (r: string): string => r.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
const mismaRuta = (a: string, b: string): boolean => normal(a) === normal(b);
const dentroDe = (padre: string, hija: string): boolean => {
  const p = normal(padre);
  const h = normal(hija);
  return h === p || h.startsWith(`${p}/`);
};

function sello(d: Date): string {
  const p = (n: number, l = 2): string => String(n).padStart(l, '0');
  return `${p(d.getUTCFullYear(), 4)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

/** Bytes de un árbol sin seguir enlaces ni uniones (un enlace cuenta como 0). */
export async function tamanoSinEnlaces(raiz: string): Promise<number> {
  let total = 0;
  const pendientes = [raiz];
  while (pendientes.length > 0) {
    const dir = pendientes.pop()!;
    let entradas;
    try {
      entradas = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entradas) {
      const ruta = path.join(dir, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) pendientes.push(ruta);
      else if (e.isFile()) {
        try {
          total += (await lstat(ruta)).size;
        } catch {
          // desapareció mientras se contaba
        }
      }
    }
  }
  return total;
}

/** Lo que trae de fábrica `node_modules` (npm y corepack) y `site-packages` (pip y setuptools). */
const DE_FABRICA_NODE = new Set(['npm', 'corepack']);
const DE_FABRICA_PYTHON =
  /^(?:(?:pip|setuptools|pkg_resources|_distutils_hack|wheel)(?:-[\w.+]+\.dist-info)?|__pycache__|readme\.txt|distutils-precedence\.pth)$/i;
const PROFUNDIDAD_BUSQUEDA = 4;

/**
 * Lo que alguien (el usuario, `npm i -g`, `pip install`) añadió dentro de una versión: en
 * `node_modules`, todo lo que no sea `npm` ni `corepack`; en `site-packages`, todo lo que no sea
 * `pip` ni `setuptools` (y sus archivos propios). No sigue enlaces. Una carpeta que no se puede
 * leer cuenta como contenido ajeno (ante la duda, se avisa). Solo Node y Python.
 */
export async function contenidoAjeno(raiz: string, servicio: string): Promise<string[]> {
  if (servicio !== 'node' && servicio !== 'python') return [];
  const buscada = servicio === 'node' ? 'node_modules' : 'site-packages';
  const hallado: string[] = [];
  const pendientes: { dir: string; rel: string; prof: number }[] = [
    { dir: raiz, rel: '', prof: 0 },
  ];
  while (pendientes.length > 0 && hallado.length <= MAX_CONTENIDO_AJENO) {
    const { dir, rel, prof } = pendientes.pop()!;
    let entradas;
    try {
      entradas = await readdir(dir, { withFileTypes: true });
    } catch {
      hallado.push(`${rel || '.'} (?)`);
      continue;
    }
    for (const e of entradas) {
      if (e.isSymbolicLink() || !e.isDirectory()) continue;
      const hija = path.join(dir, e.name);
      const relHija = rel === '' ? e.name : `${rel}/${e.name}`;
      if (e.name === buscada) {
        let dentro;
        try {
          dentro = await readdir(hija, { withFileTypes: true });
        } catch {
          hallado.push(`${relHija} (?)`);
          continue;
        }
        for (const x of dentro) {
          if (
            servicio === 'node'
              ? x.name.startsWith('.') || DE_FABRICA_NODE.has(x.name)
              : DE_FABRICA_PYTHON.test(x.name)
          ) {
            continue;
          }
          hallado.push(`${relHija}/${x.name}`);
        }
      } else if (prof + 1 < PROFUNDIDAD_BUSQUEDA) {
        pendientes.push({ dir: hija, rel: relHija, prof: prof + 1 });
      }
    }
  }
  return hallado.sort().slice(0, MAX_CONTENIDO_AJENO);
}

/**
 * Versión de `bin/` a la que pertenece un ejecutable (su ruta real ya resuelta), o null si no
 * está en `bin/<servicio>/<versión>/`. `rutaRealBin` es la ruta real de `bin/`.
 */
export function versionDeEjecutable(
  ejecutable: string,
  rutaRealBin: string,
): { servicio: string; version: string } | null {
  // Windows a veces da la ruta con el prefijo de rutas largas.
  const sinPrefijo = (r: string): string => (r.startsWith('\\\\?\\') ? r.slice(4) : r);
  const e = normal(sinPrefijo(ejecutable));
  const b = normal(sinPrefijo(rutaRealBin));
  if (!e.startsWith(`${b}/`)) return null;
  const [servicio, version, ...resto] = e.slice(b.length + 1).split('/');
  if (!servicio || !version || resto.length === 0) return null;
  return { servicio, version };
}

/** Código de error de un `rename` fallido: otro volumen, ya no existe o bloqueado (el resto). */
function codigoDeRename(e: unknown): CodigoError {
  const c = (e as { code?: unknown } | null)?.code;
  if (c === 'EXDEV') return 'limpieza.otro_volumen';
  if (c === 'ENOENT') return 'limpieza.no_existe';
  if (c === 'DESTINO_FUERA') return 'limpieza.ruta_insegura';
  return 'limpieza.version_bloqueada';
}

export class Limpieza {
  private ocupado = false;
  private readonly cerrojos: CerrojosServicio;

  constructor(private readonly d: DepsLimpieza) {
    this.cerrojos = d.cerrojos ?? new CerrojosServicio();
  }

  private ahora(): Date {
    return this.d.ahora?.() ?? new Date();
  }

  private raizBin(): string {
    return path.join(this.d.rutas.base, 'bin');
  }

  private dirPapelera(): string {
    return path.join(this.d.rutas.papelera(), 'versiones');
  }

  private dirResiduos(): string {
    return path.join(this.d.rutas.tmp(), 'limpieza-versiones');
  }

  /**
   * La ruta de `bin/<servicio>/<versión>` con todas las comprobaciones: derivada (nunca recibida),
   * carpeta real (no un enlace ni una unión) y cuya ruta real sigue dentro de `bin/`.
   */
  private async rutaSegura(servicio: string, version: string): Promise<string> {
    const insegura = (): ErrorWolf =>
      new ErrorWolf(
        'limpieza.ruta_insegura',
        `La carpeta de ${servicio} ${version} no es segura.`,
        {
          servicio,
          version,
        },
      );
    if (!(SERVICIOS_LIMPIABLES as readonly string[]).includes(servicio)) throw insegura();
    if (!VERSION_SEGURA.test(version) || version.includes('..')) throw insegura();
    const ruta = this.d.rutas.bin(servicio, version);
    try {
      const info = await lstat(ruta);
      if (!info.isDirectory() || info.isSymbolicLink()) throw insegura();
      const bin = await realpath(this.raizBin());
      const delServicio = await realpath(path.dirname(ruta));
      const real = await realpath(ruta);
      if (!mismaRuta(delServicio, path.join(bin, servicio))) throw insegura();
      if (!mismaRuta(real, path.join(delServicio, version))) throw insegura();
      if (!dentroDe(bin, real)) throw insegura();
    } catch (e) {
      throw e instanceof ErrorWolf ? e : insegura();
    }
    return ruta;
  }

  /** Todas las versiones instaladas, con su tamaño y por qué no se pueden marcar (si es el caso). */
  async versionesSinUso(): Promise<VersionSinUso[]> {
    const usos = await this.d.usos();
    const salida: VersionSinUso[] = [];
    for (const servicio of SERVICIOS_LIMPIABLES) {
      let carpetas: string[];
      try {
        carpetas = [...new Set(await this.d.instaladas(servicio))].sort();
      } catch {
        continue;
      }
      for (const version of carpetas) {
        if (!claveValida(version)) continue;
        let motivo: MotivoBloqueo | null = bloqueoDe(usos, servicio, version) ?? null;
        let bytes = 0;
        let ajeno: string[] = [];
        try {
          const ruta = await this.rutaSegura(servicio, version);
          bytes = await tamanoSinEnlaces(ruta);
          ajeno = await contenidoAjeno(ruta, servicio);
        } catch {
          motivo ??= 'duda';
        }
        const enCatalogo = await this.d.enCatalogo?.(servicio, version).catch(() => null);
        salida.push({
          servicio,
          version,
          bytes,
          motivoBloqueo: motivo,
          contenidoAjeno: ajeno,
          sinCatalogo: enCatalogo === false,
        });
      }
    }
    return salida;
  }

  /**
   * Quita las versiones elegidas. Sin `confirmado: true` falla. Cada una se vuelve a comprobar
   * dentro del cerrojo de su servicio, justo antes de moverla; una que pasó a usarse, no existe,
   * no es segura, trae contenido ajeno sin aceptarlo o tiene un archivo bloqueado se salta y se
   * informa (nunca queda a medias: o se mueve entera o no se toca). La instantánea del entorno
   * solo se toma en el borrado definitivo: la papelera se puede recuperar.
   */
  async limpiar(
    seleccion: SeleccionLimpieza[],
    confirmado: true,
    o: { destino?: DestinoLimpieza } = {},
  ): Promise<ResultadoLimpieza> {
    if (confirmado !== true) {
      throw new ErrorWolf(
        'limpieza.sin_confirmar',
        'Falta la confirmación para limpiar versiones.',
      );
    }
    const destino: DestinoLimpieza = o.destino ?? 'papelera';
    if (destino !== 'papelera' && destino !== 'definitivo') {
      throw new ErrorWolf('limpieza.seleccion_invalida', 'Destino de limpieza no válido.');
    }
    if (!Array.isArray(seleccion) || seleccion.length === 0 || seleccion.length > MAX_SELECCION) {
      throw new ErrorWolf('limpieza.seleccion_invalida', 'Selección de versiones no válida.');
    }
    const elegidas = new Map<
      string,
      { servicio: ServicioVersiones; version: string; incluir: boolean }
    >();
    for (const s of seleccion) {
      const servicio = (SERVICIOS_LIMPIABLES as readonly string[]).includes(s?.servicio)
        ? (s.servicio as ServicioVersiones)
        : null;
      if (
        servicio === null ||
        typeof s.version !== 'string' ||
        !VERSION_SEGURA.test(s.version) ||
        s.version.includes('..')
      ) {
        throw new ErrorWolf('limpieza.seleccion_invalida', 'Selección de versiones no válida.');
      }
      elegidas.set(claveVersion(servicio, s.version), {
        servicio,
        version: s.version,
        incluir: s.incluirContenidoAjeno === true,
      });
    }
    if (this.ocupado) {
      throw new ErrorWolf('limpieza.en_curso', 'Ya hay una limpieza en curso.');
    }
    this.ocupado = true;
    try {
      return await this.ejecutar([...elegidas.values()], destino);
    } finally {
      this.ocupado = false;
    }
  }

  private async ejecutar(
    elegidas: { servicio: ServicioVersiones; version: string; incluir: boolean }[],
    destino: DestinoLimpieza,
  ): Promise<ResultadoLimpieza> {
    const res: ResultadoLimpieza = {
      liberados: 0,
      enPapelera: 0,
      fallidos: [],
      pendientes: 0,
      instantanea: '',
    };
    const fallar = (v: { servicio: string; version: string }, codigo: CodigoError): void => {
      res.fallidos.push({ servicio: v.servicio, version: v.version, codigo });
    };
    // Primera pasada (barata): lo que ya se ve en uso o ausente no justifica ni la instantánea.
    const instaladas = new Map<string, Set<string>>();
    const existe = async (s: ServicioVersiones, v: string): Promise<boolean> => {
      if (!instaladas.has(s)) {
        instaladas.set(s, new Set(await this.d.instaladas(s).catch(() => [] as string[])));
      }
      return instaladas.get(s)!.has(v);
    };
    const usos = await this.d.usos();
    const candidatas: typeof elegidas = [];
    for (const v of elegidas) {
      if (!(await existe(v.servicio, v.version))) fallar(v, 'limpieza.no_existe');
      else if (bloqueoDe(usos, v.servicio, v.version)) fallar(v, 'limpieza.en_uso');
      else candidatas.push(v);
    }
    if (candidatas.length === 0) return res;

    // El borrado definitivo no se puede deshacer: antes, la instantánea del entorno (si falla, no
    // se borra nada). La papelera se recupera, así que no gasta una de las instantáneas.
    if (destino === 'definitivo') res.instantanea = await this.d.instantanea();

    // Se mide antes de comprobar el uso: lo lento va fuera del cerrojo y de la comprobación.
    const medidas: { v: (typeof candidatas)[number]; bytes: number }[] = [];
    for (const v of candidatas) {
      try {
        const ruta = await this.rutaSegura(v.servicio, v.version);
        medidas.push({ v, bytes: await tamanoSinEnlaces(ruta) });
      } catch {
        fallar(v, 'limpieza.ruta_insegura');
      }
    }

    const movidas: { dir: string; bytes: number }[] = [];
    for (const { v, bytes } of medidas) {
      // Cada versión, con el cerrojo de su servicio: el uso se vuelve a mirar justo antes del
      // rename (otra versión de esta misma limpieza, o un arranque, pudo cambiarlo).
      const r = await this.cerrojos.con(v.servicio, async (): Promise<string | CodigoError> => {
        const u = await this.d.usos();
        if (bloqueoDe(u, v.servicio, v.version)) return 'limpieza.en_uso';
        if (
          !(await this.d.instaladas(v.servicio).catch(() => [] as string[])).includes(v.version)
        ) {
          return 'limpieza.no_existe';
        }
        let ruta: string;
        try {
          ruta = await this.rutaSegura(v.servicio, v.version);
        } catch {
          return 'limpieza.ruta_insegura';
        }
        if (!v.incluir && (await contenidoAjeno(ruta, v.servicio)).length > 0) {
          return 'limpieza.contenido_ajeno';
        }
        try {
          return await this.mover(ruta, v, destino);
        } catch (e) {
          return codigoDeRename(e);
        }
      });
      if (r.includes('.') && r.startsWith('limpieza.')) {
        fallar(v, r as CodigoError);
        continue;
      }
      if (destino === 'papelera') res.enPapelera += bytes;
      else movidas.push({ dir: r, bytes });
    }
    // Borrado definitivo: ya está fuera de bin/, así que un fallo aquí no deja una versión a medias.
    for (const m of movidas) {
      try {
        await rm(m.dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
        res.liberados += m.bytes;
      } catch {
        res.pendientes++;
      }
    }
    if (destino === 'papelera') await this.purgarPapelera().catch(() => 0);
    return res;
  }

  /** Mueve la carpeta entera a su destino; devuelve dónde quedó. Lanza si no se pudo (sin tocar nada). */
  private async mover(
    ruta: string,
    v: { servicio: string; version: string },
    destino: DestinoLimpieza,
  ): Promise<string> {
    const dir = destino === 'papelera' ? this.dirPapelera() : this.dirResiduos();
    await mkdir(dir, { recursive: true });
    // Nunca sale de la carpeta de datos: si la de destino resuelve fuera, no se mueve nada.
    const base = await realpath(this.d.rutas.base);
    if (!dentroDe(base, await realpath(dir))) {
      throw Object.assign(new Error('destino fuera de la carpeta de datos'), {
        code: 'DESTINO_FUERA',
      });
    }
    const nombre = `${v.servicio}__${v.version}__${sello(this.ahora())}-${randomBytes(3).toString('hex')}`;
    const final = path.join(dir, nombre);
    const marca = `${final}.borrado`;
    if (destino === 'papelera') {
      // La fecha de borrado va en un archivo propio; sin ella, nada se purga.
      await writeFile(marca, `${this.ahora().toISOString()}\n`, { flag: 'wx' });
    }
    try {
      await (this.d.renombrar ?? rename)(ruta, final);
    } catch (e) {
      if (destino === 'papelera') await rm(marca, { force: true }).catch(() => undefined);
      throw e;
    }
    return final;
  }

  /** Las versiones que hay en la papelera (de la más nueva a la más vieja). */
  async listarPapelera(): Promise<VersionEnPapelera[]> {
    const dir = this.dirPapelera();
    let nombres: string[];
    try {
      nombres = await readdir(dir);
    } catch {
      return [];
    }
    const salida: VersionEnPapelera[] = [];
    for (const n of nombres) {
      if (!n.endsWith('.borrado')) continue;
      const id = n.slice(0, -'.borrado'.length);
      if (!DE_PAPELERA.test(id)) continue;
      const [servicio, version] = id.split('__') as [string, string];
      const info = await lstat(path.join(dir, id)).catch(() => null);
      if (!info?.isDirectory() || info.isSymbolicLink()) continue;
      const t = Date.parse((await readFile(path.join(dir, n), 'utf8').catch(() => '')).trim());
      salida.push({
        id,
        servicio,
        version,
        borrada: Number.isNaN(t) ? '' : new Date(t).toISOString(),
        bytes: await tamanoSinEnlaces(path.join(dir, id)),
      });
    }
    return salida.sort((a, b) => b.borrada.localeCompare(a.borrada));
  }

  /**
   * Devuelve una versión de la papelera a `bin/<servicio>/<versión>`. Falla si esa carpeta ya
   * existe (se instaló otra vez) o si la papelera no la tiene; nunca sobrescribe nada.
   */
  async recuperar(id: string): Promise<void> {
    if (typeof id !== 'string' || !DE_PAPELERA.test(id)) {
      throw new ErrorWolf('limpieza.seleccion_invalida', 'Versión de la papelera no válida.');
    }
    const [servicio, version] = id.split('__') as [string, string];
    if (
      !(SERVICIOS_LIMPIABLES as readonly string[]).includes(servicio) ||
      !VERSION_SEGURA.test(version) ||
      version.includes('..')
    ) {
      throw new ErrorWolf('limpieza.seleccion_invalida', 'Versión de la papelera no válida.');
    }
    const datos = { servicio, version };
    const carpeta = path.join(this.dirPapelera(), id);
    await this.cerrojos.con(servicio, async () => {
      const info = await lstat(carpeta).catch(() => null);
      if (!info?.isDirectory() || info.isSymbolicLink()) {
        throw new ErrorWolf('limpieza.no_existe', 'Esa versión ya no está en la papelera.', datos);
      }
      const base = await realpath(this.d.rutas.base);
      if (!dentroDe(base, await realpath(carpeta))) {
        throw new ErrorWolf('limpieza.ruta_insegura', 'La carpeta no es segura.', datos);
      }
      const destino = this.d.rutas.bin(servicio, version);
      if ((await lstat(destino).catch(() => null)) !== null) {
        throw new ErrorWolf(
          'limpieza.destino_ocupado',
          `Ya hay una carpeta de ${servicio} ${version} en bin.`,
          datos,
        );
      }
      await mkdir(path.dirname(destino), { recursive: true });
      // El padre (bin/<servicio>) tiene que ser real y estar dentro de bin/.
      const bin = await realpath(this.raizBin());
      if (!mismaRuta(await realpath(path.dirname(destino)), path.join(bin, servicio))) {
        throw new ErrorWolf('limpieza.ruta_insegura', 'La carpeta no es segura.', datos);
      }
      try {
        await (this.d.renombrar ?? rename)(carpeta, destino);
      } catch (e) {
        throw new ErrorWolf(
          codigoDeRename(e),
          `No se pudo recuperar ${servicio} ${version}.`,
          datos,
        );
      }
      await rm(`${carpeta}.borrado`, { force: true }).catch(() => undefined);
    });
  }

  /** Quita de la papelera lo que lleva más de 7 días. Devuelve cuántas versiones quitó. */
  async purgarPapelera(): Promise<number> {
    const dir = this.dirPapelera();
    let nombres: string[];
    try {
      nombres = await readdir(dir);
    } catch {
      return 0;
    }
    const limite = this.ahora().getTime() - DIAS_PAPELERA_VERSIONES * 24 * 60 * 60 * 1000;
    let cuantas = 0;
    for (const n of nombres) {
      if (!n.endsWith('.borrado')) continue;
      const nombre = n.slice(0, -'.borrado'.length);
      if (!DE_PAPELERA.test(nombre)) continue;
      const t = Date.parse((await readFile(path.join(dir, n), 'utf8').catch(() => '')).trim());
      if (Number.isNaN(t) || t >= limite) continue;
      const carpeta = path.join(dir, nombre);
      try {
        const info = await lstat(carpeta).catch(() => null);
        // Solo carpetas reales que escribió esta función; nunca enlaces.
        if (info !== null && info.isDirectory() && !info.isSymbolicLink()) {
          await rm(carpeta, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
          cuantas++;
        }
        if ((await lstat(carpeta).catch(() => null)) === null) {
          await rm(path.join(dir, n), { force: true });
        }
      } catch {
        // se intenta de nuevo la próxima vez
      }
    }
    return cuantas;
  }

  /** Al arrancar: restos de un borrado definitivo que no terminó (ya estaban fuera de `bin/`). */
  async limpiarResiduos(): Promise<number> {
    const dir = this.dirResiduos();
    let nombres: string[];
    try {
      nombres = await readdir(dir);
    } catch {
      return 0;
    }
    let n = 0;
    for (const nombre of nombres) {
      if (!DE_PAPELERA.test(nombre)) continue;
      const ruta = path.join(dir, nombre);
      try {
        const info = await lstat(ruta);
        if (!info.isDirectory() || info.isSymbolicLink()) continue;
        await rm(ruta, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
        n++;
      } catch {
        // la próxima vez
      }
    }
    return n;
  }
}
