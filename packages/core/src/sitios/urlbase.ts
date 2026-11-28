import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { chmod, copyFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Ejecutor } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { Sitio } from '../tipos';
import { nombreEjecutable } from '../plataforma/sistema';

function escaparRegex(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patronLinea(nombre: string): RegExp {
  return new RegExp(
    `^((?:\\xEF\\xBB\\xBF)?\\s*(?:export\\s+)?${escaparRegex(nombre)}\\s*=\\s*)(.*)$`,
  );
}

function separar(linea: string): { cuerpo: string; fin: string } {
  const m = /(\r?\n)$/.exec(linea);
  return m ? { cuerpo: linea.slice(0, -m[1]!.length), fin: m[1]! } : { cuerpo: linea, fin: '' };
}

function finDeLinea(contenido: string): string {
  return contenido.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Pone, reemplaza o elimina (valor null) una variable de un .env conservando
 * saltos de línea, comillas de la línea existente, posición y el resto del archivo.
 */
export function ponerVariableEnv(contenido: string, nombre: string, valor: string | null): string {
  const re = patronLinea(nombre);
  const lineas = contenido.length === 0 ? [] : contenido.split(/(?<=\n)/);
  let encontrada = false;
  const salida: string[] = [];
  for (const linea of lineas) {
    const { cuerpo, fin } = separar(linea);
    const m = re.exec(cuerpo);
    if (!m) {
      salida.push(linea);
      continue;
    }
    if (valor === null) {
      encontrada = true;
      continue;
    }
    if (encontrada) {
      salida.push(linea);
      continue;
    }
    encontrada = true;
    const resto = m[2]!;
    const comilla = resto[0] === '"' || resto[0] === "'" ? resto[0] : '';
    let cola = '';
    if (comilla) {
      const cierre = resto.indexOf(comilla, 1);
      if (cierre !== -1) cola = resto.slice(cierre + 1);
    } else {
      const c = /\s+#.*$/.exec(resto);
      if (c) cola = c[0];
    }
    salida.push(`${m[1]}${comilla}${valor}${comilla}${cola}${fin}`);
  }
  if (!encontrada && valor !== null) {
    const eol = finDeLinea(contenido);
    if (salida.length > 0 && !/\n$/.test(salida[salida.length - 1]!)) {
      salida[salida.length - 1] += eol;
    }
    salida.push(`${nombre}=${valor}${eol}`);
  }
  return salida.join('');
}

/** Reemplaza la primera línea de la variable por el texto exacto; si falta, lo agrega. */
function restaurarLinea(contenido: string, nombre: string, exacta: string): string {
  const re = patronLinea(nombre);
  const lineas = contenido.length === 0 ? [] : contenido.split(/(?<=\n)/);
  let hecho = false;
  const salida = lineas.map((linea) => {
    const { cuerpo, fin } = separar(linea);
    if (!hecho && re.test(cuerpo)) {
      hecho = true;
      return exacta + fin;
    }
    return linea;
  });
  if (!hecho) {
    const eol = finDeLinea(contenido);
    if (salida.length > 0 && !/\n$/.test(salida[salida.length - 1]!)) {
      salida[salida.length - 1] += eol;
    }
    salida.push(exacta + eol);
  }
  return salida.join('');
}

interface DatosSitioPrevio {
  carpeta: string;
  urlBaseVar: string;
  tipo: Sitio['tipo'];
  php: string | null;
}

interface EstadoPrevio {
  existia: boolean;
  valor: string | null;
  lineaOriginal: string | null;
  /** sha256 del .env tal como lo dejó aplicar (para saber si el usuario lo editó). */
  hashAplicado?: string;
  /** Datos del sitio al aplicar: se restaura con ellos aunque el sitio se haya editado o borrado. */
  sitio?: DatosSitioPrevio;
}

const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');

/** Nombre del respaldo antiguo (versiones previas lo dejaban en la carpeta del proyecto). */
export const RESPALDO_ANTIGUO = '.env.pel-respaldo';

const archivoEstadoDe = (rutas: Rutas, id: string): string =>
  path.join(rutas.base, 'run', `urlbase-${id}.json`);

/** El respaldo del .env vive en la carpeta de datos del programa, nunca en el proyecto. */
export const archivoRespaldoDe = (rutas: Rutas, id: string): string =>
  path.join(rutas.base, 'run', `urlbase-${id}.respaldo`);

const sufijoFecha = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const REINTENTOS = 5;
const esBloqueo = (e: unknown): boolean => {
  const c = (e as { code?: string } | null)?.code;
  return c === 'EPERM' || c === 'EBUSY' || c === 'EACCES';
};

export interface OpcionesEscritura {
  /** Inyectable para pruebas. */
  renombrar?: (de: string, a: string) => Promise<void>;
}

/** Escribe el archivo por medio de un temporal en la misma carpeta y un rename (atómico). */
export async function escribirAtomico(
  destino: string,
  datos: Buffer,
  o: OpcionesEscritura = {},
): Promise<void> {
  const renombrar = o.renombrar ?? rename;
  const tmp = `${destino}.pel-tmp-${randomBytes(4).toString('hex')}`;
  try {
    // El archivo nuevo conserva los permisos del que reemplaza (p. ej. 0600 en una configuración
    // con claves). Solo si el dueño puede escribirlo: un original de solo lectura (en Windows, el
    // único bit que existe) no se copia, así el temporal sigue siendo escribible y renombrable.
    const modo = await stat(destino).then(
      (i) => ((i.mode & 0o200) !== 0 ? i.mode & 0o777 : undefined),
      () => undefined,
    );
    await writeFile(tmp, datos, modo === undefined ? undefined : { mode: modo });
    if (modo !== undefined) await chmod(tmp, modo);
    for (let i = 0; ; i++) {
      try {
        await renombrar(tmp, destino);
        return;
      } catch (e) {
        if (!esBloqueo(e) || i >= REINTENTOS) throw e;
        await new Promise((r) => setTimeout(r, 40 * (i + 1)));
      }
    }
  } finally {
    await rm(tmp, { force: true }).catch(() => undefined);
  }
}

const esperaSincrona = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

/** Variante síncrona de escribirAtomico (para el cierre de sesión de Windows). */
export function escribirAtomicoSincrono(destino: string, datos: Buffer): void {
  const tmp = `${destino}.pel-tmp-${randomBytes(4).toString('hex')}`;
  try {
    writeFileSync(tmp, datos);
    for (let i = 0; ; i++) {
      try {
        renameSync(tmp, destino);
        return;
      } catch (e) {
        if (!esBloqueo(e) || i >= REINTENTOS) throw e;
        esperaSincrona(40 * (i + 1));
      }
    }
  } finally {
    try {
      rmSync(tmp, { force: true });
    } catch {
      // nada que limpiar
    }
  }
}

/**
 * Decide el contenido restaurado del .env. Si nadie lo editó desde aplicar (mismo hash) y hay
 * respaldo, se devuelven sus bytes exactos; si no, se restaura solo la línea de la variable.
 */
function calcularRestauracion(
  actual: Buffer,
  previo: EstadoPrevio,
  nombre: string,
  respaldo: Buffer | null,
): { contenido: Buffer; porLinea: boolean } {
  if (previo.hashAplicado && sha(actual) === previo.hashAplicado && respaldo) {
    return { contenido: respaldo, porLinea: false };
  }
  const texto = actual.toString('latin1');
  let nuevo: string;
  if (previo.existia && previo.lineaOriginal !== null) {
    nuevo = restaurarLinea(texto, nombre, previo.lineaOriginal);
  } else {
    nuevo = ponerVariableEnv(texto, nombre, null);
    if (respaldo) {
      const orig = respaldo.toString('latin1');
      if (nuevo.replace(/\r?\n$/, '') === orig.replace(/\r?\n$/, '') && nuevo !== orig) {
        nuevo = orig;
      }
    }
  }
  return { contenido: Buffer.from(nuevo, 'latin1'), porLinea: true };
}

/** Datos guardados al aplicar; si faltan (formato antiguo) se usan los del sitio actual. */
function datosDe(previo: EstadoPrevio, s?: Sitio): DatosSitioPrevio | null {
  if (previo.sitio?.urlBaseVar && previo.sitio.carpeta) return previo.sitio;
  if (s?.urlBaseVar) {
    return { carpeta: s.carpeta, urlBaseVar: s.urlBaseVar, tipo: s.tipo, php: s.php };
  }
  return null;
}

const avisoConservado = (env: string, nombre: string, copia: string): string =>
  `El .env (${env}) cambió mientras el túnel estaba abierto: se restauró solo la variable ${nombre}. ` +
  `Copia del .env original en ${copia}.`;

const avisoSinEnv = (env: string, copia: string): string =>
  `No se encontró ${env} al restaurar la URL base. Copia del .env original en ${copia}.`;

interface Rastro {
  estado: string;
  datos: DatosSitioPrevio;
  env: string;
  respaldoNuevo: string;
  respaldoAntiguo: string;
}

function rastroDe(rutas: Rutas, id: string, datos: DatosSitioPrevio): Rastro {
  return {
    estado: archivoEstadoDe(rutas, id),
    datos,
    env: path.join(datos.carpeta, '.env'),
    respaldoNuevo: archivoRespaldoDe(rutas, id),
    respaldoAntiguo: path.join(datos.carpeta, RESPALDO_ANTIGUO),
  };
}

/**
 * Restaura de forma SÍNCRONA cada .env con un run/urlbase-<id>.json pendiente. Pensada para el
 * cierre de sesión de Windows, donde no hay tiempo para promesas. Devuelve los avisos.
 * La caché de configuración de Laravel se borra quitando bootstrap/cache/config.php
 * (es lo único que hace `php artisan config:clear`).
 */
export function restaurarUrlBaseSincrono(rutas: Rutas): string[] {
  const avisos: string[] = [];
  let archivos: string[];
  try {
    archivos = readdirSync(path.join(rutas.base, 'run'));
  } catch {
    return avisos;
  }
  for (const f of archivos) {
    const m = /^urlbase-(.+)\.json$/.exec(f);
    if (!m) continue;
    try {
      const aviso = restaurarUnoSincrono(rutas, m[1]!);
      if (aviso) avisos.push(aviso);
    } catch (e) {
      avisos.push(
        `No se pudo restaurar la URL base de ${m[1]}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  return avisos;
}

function restaurarUnoSincrono(rutas: Rutas, id: string): string | null {
  const previo = JSON.parse(readFileSync(archivoEstadoDe(rutas, id), 'utf8')) as EstadoPrevio;
  const datos = datosDe(previo);
  if (!datos) return null;
  const r = rastroDe(rutas, id, datos);
  const rutaRespaldo = existsSync(r.respaldoNuevo)
    ? r.respaldoNuevo
    : existsSync(r.respaldoAntiguo)
      ? r.respaldoAntiguo
      : null;
  const respaldo = rutaRespaldo ? readFileSync(rutaRespaldo) : null;
  const hayEnv = existsSync(r.env);
  let conservar = !hayEnv;
  if (hayEnv) {
    const c = calcularRestauracion(readFileSync(r.env), previo, datos.urlBaseVar, respaldo);
    escribirAtomicoSincrono(r.env, c.contenido);
    conservar = c.porLinea;
  }
  let aviso: string | null = null;
  if (conservar && respaldo) {
    const copia = `${r.respaldoNuevo}-${sufijoFecha()}`;
    writeFileSync(copia, respaldo);
    aviso = hayEnv ? avisoConservado(r.env, datos.urlBaseVar, copia) : avisoSinEnv(r.env, copia);
  }
  rmSync(r.estado, { force: true });
  rmSync(r.respaldoNuevo, { force: true });
  rmSync(r.respaldoAntiguo, { force: true });
  if (datos.tipo === 'laravel') {
    rmSync(path.join(datos.carpeta, 'bootstrap', 'cache', 'config.php'), { force: true });
  }
  return aviso;
}

export interface DepsUrlBase {
  rutas: Rutas;
  ejecutor: Ejecutor;
  /** Inyectable para pruebas (rename del .env). */
  renombrar?: (de: string, a: string) => Promise<void>;
}

export class UrlBase {
  private readonly cadenas = new Map<string, Promise<unknown>>();

  constructor(private readonly d: DepsUrlBase) {}

  private escribir(destino: string, datos: Buffer): Promise<void> {
    return escribirAtomico(destino, datos, this.d.renombrar ? { renombrar: this.d.renombrar } : {});
  }

  /** Serializa aplicar/restaurar por sitio para que nunca se crucen. */
  private serializar<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const previa = this.cadenas.get(id) ?? Promise.resolve();
    const p = previa.then(fn, fn);
    const cola = p.catch(() => undefined);
    this.cadenas.set(id, cola);
    void cola.then(() => {
      if (this.cadenas.get(id) === cola) this.cadenas.delete(id);
    });
    return p;
  }

  /** Devuelve un mensaje informativo (o de fallo parcial); null si todo fue bien. */
  aplicar(s: Sitio, url: string): Promise<string | null> {
    return this.serializar(s.id, () => this.aplicarInterno(s, url));
  }

  /**
   * Restaura el .env con los datos guardados al aplicar (carpeta, variable, tipo y PHP);
   * `s` solo se usa si el estado guardado no los trae (formato antiguo).
   */
  restaurar(s: Sitio): Promise<string | null> {
    return this.serializar(s.id, () => this.restaurarInterno(s.id, s));
  }

  /** Restaura desde run/urlbase-<id>.json aunque el sitio ya no exista en la configuración. */
  restaurarPorId(id: string): Promise<string | null> {
    return this.serializar(id, () => this.restaurarInterno(id));
  }

  private async aplicarInterno(s: Sitio, url: string): Promise<string | null> {
    const nombre = s.urlBaseVar;
    if (!nombre) return null;
    const estado = archivoEstadoDe(this.d.rutas, s.id);
    let previo: EstadoPrevio | null = null;
    if (existsSync(estado)) {
      previo = JSON.parse(await readFile(estado, 'utf8')) as EstadoPrevio;
      const d = previo.sitio;
      if (d && (d.carpeta !== s.carpeta || d.urlBaseVar !== nombre)) {
        // El sitio cambió desde la aplicación anterior: primero se devuelve el .env viejo.
        await this.restaurarInterno(s.id);
        previo = null;
      }
    }
    const env = path.join(s.carpeta, '.env');
    if (!existsSync(env)) return 'El sitio no tiene .env';
    const bytes = await readFile(env);
    // latin1 conserva cualquier byte al volver a escribir.
    const original = bytes.toString('latin1');
    if (!previo) {
      let existia = false;
      let valor: string | null = null;
      let lineaOriginal: string | null = null;
      const re = patronLinea(nombre);
      for (const linea of original.split(/(?<=\n)/)) {
        const { cuerpo } = separar(linea);
        const m = re.exec(cuerpo);
        if (m) {
          existia = true;
          lineaOriginal = cuerpo;
          valor = m[2]!.replace(/^(["'])(.*)\1.*$/, '$2');
          break;
        }
      }
      await mkdir(path.dirname(estado), { recursive: true });
      await copyFile(env, archivoRespaldoDe(this.d.rutas, s.id));
      previo = {
        existia,
        valor,
        lineaOriginal,
        sitio: { carpeta: s.carpeta, urlBaseVar: nombre, tipo: s.tipo, php: s.php },
      };
      await writeFile(estado, JSON.stringify(previo, null, 2), 'utf8');
    }
    const nuevo = Buffer.from(ponerVariableEnv(original, nombre, url), 'latin1');
    await this.escribir(env, nuevo);
    previo.hashAplicado = sha(nuevo);
    await writeFile(estado, JSON.stringify(previo, null, 2), 'utf8');
    return this.limpiarCache(datosDe(previo, s)!);
  }

  private async restaurarInterno(id: string, s?: Sitio): Promise<string | null> {
    const estado = archivoEstadoDe(this.d.rutas, id);
    if (!existsSync(estado)) return null;
    const previo = JSON.parse(await readFile(estado, 'utf8')) as EstadoPrevio;
    const datos = datosDe(previo, s);
    if (!datos) return null;
    const r = rastroDe(this.d.rutas, id, datos);
    const rutaRespaldo = existsSync(r.respaldoNuevo)
      ? r.respaldoNuevo
      : existsSync(r.respaldoAntiguo)
        ? r.respaldoAntiguo
        : null;
    const respaldo = rutaRespaldo ? await readFile(rutaRespaldo) : null;
    const hayEnv = existsSync(r.env);
    let conservar = !hayEnv;
    if (hayEnv) {
      const c = calcularRestauracion(await readFile(r.env), previo, datos.urlBaseVar, respaldo);
      await this.escribir(r.env, c.contenido);
      conservar = c.porLinea;
    }
    const avisos: string[] = [];
    if (conservar && respaldo) {
      // Se usó la restauración por línea (o falta el .env): se guarda el original por si acaso.
      const copia = `${r.respaldoNuevo}-${sufijoFecha()}`;
      await writeFile(copia, respaldo);
      avisos.push(
        hayEnv ? avisoConservado(r.env, datos.urlBaseVar, copia) : avisoSinEnv(r.env, copia),
      );
    }
    await rm(r.estado, { force: true });
    await rm(r.respaldoNuevo, { force: true });
    await rm(r.respaldoAntiguo, { force: true });
    const cache = await this.limpiarCache(datos);
    if (cache) avisos.push(cache);
    return avisos.length ? avisos.join('\n') : null;
  }

  private async limpiarCache(s: DatosSitioPrevio): Promise<string | null> {
    if (s.tipo !== 'laravel' || !s.php) return null;
    if (!existsSync(path.join(s.carpeta, 'bootstrap', 'cache', 'config.php'))) return null;
    const php = path.join(this.d.rutas.bin('php', s.php), nombreEjecutable('php'));
    try {
      const r = await this.d.ejecutor(php, ['artisan', 'config:clear'], {
        timeoutMs: 30_000,
        cwd: s.carpeta,
      });
      return r.codigo === 0
        ? null
        : `No se pudo limpiar la caché de configuración: ${r.stderr || r.stdout}`.trim();
    } catch (e) {
      return `No se pudo limpiar la caché de configuración: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
