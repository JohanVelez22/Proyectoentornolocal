import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  NOMBRE_EXTENSION_PHP,
  urlOficial,
  type ExtensionPhpCatalogo,
  type VarianteExtensionPhp,
} from '../catalogo/catalogo';
import { extraerZip } from '../catalogo/zip';
import { ErrorWolf } from '../errores';
import type { Ejecutor } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { IniPhp } from './ini';

/** Extensiones que PHP carga con `zend_extension` (las demás van con `extension`). */
const ZEND = new Set(['opcache', 'xdebug']);
/** Saltos de redirección que se siguen (cada uno validado contra los hosts permitidos). */
const MAX_REDIRECCIONES = 5;
/** Tamaño máximo de una descarga de extensión. */
const MAX_BYTES_DESCARGA = 64 * 1024 * 1024;

export type TipoLineaExtension = 'extension' | 'zend_extension';

export interface ExtensionPhp {
  nombre: string;
  activa: boolean;
  /** DLL en `ext/` (p. ej. `php_gd.dll`); null si falta (activa sin archivo o del catálogo). */
  archivo: string | null;
  origen: 'incluida' | 'catalogo';
}

/** `curl`, `php_curl.dll`, `"C:/x/ext/php_curl.dll"` → `curl`. */
function nombreDeValor(valor: string): string | null {
  let v = valor.trim();
  const comillas = /^"([^"]*)"/.exec(v);
  v = comillas ? comillas[1]! : v.replace(/\s*;.*$/, '');
  const base = v.split(/[\\/]/).pop() ?? '';
  const nombre = base
    .replace(/\.(dll|so)$/i, '')
    .replace(/^php_/i, '')
    .toLowerCase();
  return NOMBRE_EXTENSION_PHP.test(nombre) ? nombre : null;
}

const LINEA = /^\s*(zend_extension|extension)\s*=(.*)$/;
const COMENTADA = /^\s*;\s*(zend_extension|extension)\s*=(.*)$/;

/** Extensiones activas en el texto del ini y con qué directiva se cargan. */
export function extensionesActivas(texto: string): Map<string, TipoLineaExtension> {
  const res = new Map<string, TipoLineaExtension>();
  for (const l of texto.split(/\r?\n/)) {
    const m = LINEA.exec(l);
    const nombre = m ? nombreDeValor(m[2]!) : null;
    if (m && nombre) res.set(nombre, m[1] as TipoLineaExtension);
  }
  return res;
}

/**
 * Activa o desactiva una extensión sin tocar el resto: desactivar comenta TODAS sus líneas;
 * activar descomenta la primera comentada o agrega `extension=nombre` (o `zend_extension`) tras
 * la última línea de extensión. Sin cambios devuelve el mismo texto.
 */
export function cambiarExtension(
  texto: string,
  nombre: string,
  activa: boolean,
  zend: boolean,
): string {
  const salto = texto.includes('\r\n') ? '\r\n' : '\n';
  const lineas = texto.split(/\r?\n/);
  const es = (re: RegExp, l: string): boolean => {
    const m = re.exec(l);
    return m !== null && nombreDeValor(m[2]!) === nombre;
  };
  if (!activa) {
    let cambio = false;
    lineas.forEach((l, i) => {
      if (es(LINEA, l)) {
        lineas[i] = `;${l}`;
        cambio = true;
      }
    });
    return cambio ? lineas.join(salto) : texto;
  }
  if (lineas.some((l) => es(LINEA, l))) return texto;
  const i = lineas.findIndex((l) => es(COMENTADA, l));
  if (i >= 0) lineas[i] = lineas[i]!.replace(/^\s*;\s*/, '');
  else {
    let ultima = -1;
    lineas.forEach((l, j) => {
      if (LINEA.test(l) || COMENTADA.test(l)) ultima = j;
    });
    const nueva = `${zend ? 'zend_extension' : 'extension'}=${nombre}`;
    if (ultima >= 0) lineas.splice(ultima + 1, 0, nueva);
    else lineas.push(nueva);
  }
  return lineas.join(salto);
}

/** Variante de la compilación a partir de `php -i`; null si no se reconoce. */
export function varianteDeInfo(info: string): VarianteExtensionPhp | null {
  const hilos = /^\s*Thread Safety\s*=>\s*(enabled|disabled)/im.exec(info)?.[1]?.toLowerCase();
  const compilador = /^\s*Compiler\s*=>\s*.*Visual C\+\+\s*(\d{4})/im.exec(info)?.[1];
  const arquitectura = /^\s*Architecture\s*=>\s*(\S+)/im.exec(info)?.[1]?.toLowerCase();
  if (!hilos || !compilador || arquitectura !== 'x64') return null;
  const vs = compilador === '2019' ? 'vs16' : compilador === '2022' ? 'vs17' : null;
  if (!vs) return null;
  return `${hilos === 'enabled' ? 'ts' : 'nts'}-${vs}-x64` as VarianteExtensionPhp;
}

export interface DepsExtensionesPhp {
  rutas: Rutas;
  ini: IniPhp;
  exec: Ejecutor;
  phpCli(rama: string): string;
  /** Extensiones de terceros del catálogo (`catalogo.extensionesPhp`). */
  catalogo: readonly ExtensionPhpCatalogo[];
  fetch?: typeof fetch;
  /** Para pruebas: renombrar (por defecto `fs.rename`). */
  renombrar?: (de: string, a: string) => Promise<void>;
}

function validarNombre(nombre: unknown): string {
  if (typeof nombre !== 'string' || !NOMBRE_EXTENSION_PHP.test(nombre)) {
    throw new ErrorWolf('php.argumento_invalido', 'Nombre de extensión no válido.', {
      campo: 'extensión',
    });
  }
  return nombre;
}

/**
 * Extensiones de PHP de cada rama: las DLL de `ext/` (las de esa compilación), su estado en el
 * php.ini y las de terceros que trae el catálogo. Activar y desactivar pasan por
 * `IniPhp.guardar` (prueba, copia con fecha, reinicio y vuelta atrás).
 */
export class ExtensionesPhp {
  constructor(private readonly d: DepsExtensionesPhp) {}

  private carpetaExt(rama: string): string {
    return path.join(this.d.rutas.bin('php', rama), 'ext');
  }

  /** DLL de extensiones en ext/ (nombre → archivo). Las DLL de apoyo (libcrypto…) no cuentan. */
  private async dlls(rama: string): Promise<Map<string, string>> {
    const res = new Map<string, string>();
    const nombres = await readdir(this.carpetaExt(rama)).catch(() => [] as string[]);
    for (const archivo of nombres) {
      const m = /^php_([a-z0-9_]+)\.dll$/i.exec(archivo);
      if (m && NOMBRE_EXTENSION_PHP.test(m[1]!.toLowerCase())) {
        res.set(m[1]!.toLowerCase(), archivo);
      }
    }
    return res;
  }

  private delCatalogo(rama: string, nombre?: string): ExtensionPhpCatalogo[] {
    return this.d.catalogo.filter(
      (e) => e.rama === rama && (nombre === undefined || e.nombre === nombre),
    );
  }

  async listar(rama: string): Promise<ExtensionPhp[]> {
    const texto = await this.d.ini.leer(rama);
    const activas = extensionesActivas(texto);
    const dlls = await this.dlls(rama);
    const catalogo = new Set(this.delCatalogo(rama).map((e) => e.nombre));
    const nombres = new Set([...dlls.keys(), ...activas.keys(), ...catalogo]);
    return [...nombres].sort().map((nombre) => ({
      nombre,
      activa: activas.has(nombre),
      archivo: dlls.get(nombre) ?? null,
      origen: catalogo.has(nombre) ? 'catalogo' : 'incluida',
    }));
  }

  /** Activa (solo si la DLL está en ext/ de esa rama) o desactiva una extensión. */
  async activar(rama: string, nombre: string, activa: boolean): Promise<void> {
    const n = validarNombre(nombre);
    if (typeof activa !== 'boolean') {
      throw new ErrorWolf('php.argumento_invalido', 'Estado no válido.', { campo: 'activa' });
    }
    const texto = await this.d.ini.leer(rama);
    if (activa && !(await this.dlls(rama)).has(n)) {
      throw new ErrorWolf(
        'php.extension_no_existe',
        `La extensión ${n} no está en la carpeta ext de PHP ${rama}.`,
        { nombre: n },
      );
    }
    const zend = ZEND.has(n) || this.delCatalogo(rama, n).some((e) => e.zend);
    const nuevo = cambiarExtension(texto, n, activa, zend);
    if (nuevo === texto) return;
    await this.d.ini.guardar(rama, nuevo);
  }

  /** Variante de la compilación instalada (`php -n -i`: sin ini, así un ini roto no estorba). */
  async variante(rama: string): Promise<VarianteExtensionPhp> {
    const r = await this.d.exec(this.d.phpCli(rama), ['-n', '-i'], {
      timeoutMs: 20000,
      cwd: this.d.rutas.bin('php', rama),
    });
    const v = r.codigo === 0 ? varianteDeInfo(r.stdout) : null;
    if (!v) {
      throw new ErrorWolf(
        'php.variante_desconocida',
        `No se pudo saber cómo está compilado PHP ${rama}.`,
      );
    }
    return v;
  }

  /**
   * Instala una extensión de terceros del catálogo en ext/ (la variante de esta compilación, de
   * un host permitido y con su SHA-256) y la activa.
   */
  async instalar(rama: string, nombre: string): Promise<void> {
    const { n, dll, destino, actual } = await this.descargarParaRama(rama, nombre);
    if (actual?.equals(dll)) {
      await this.activar(rama, n, true);
      return;
    }
    if (await this.cambiarSiActiva(rama, n, destino, dll)) return;
    const deshacer = await this.cambiarDll(destino, dll, n, rama);
    try {
      await this.activar(rama, n, true);
    } catch (err) {
      await deshacer();
      throw err;
    }
    await this.limpiarAnteriores(destino);
  }

  /**
   * Pone la DLL del catálogo en ext/ SIN activarla en el ini de la rama (Xdebug por sitio: la
   * carga solo el pool propio del sitio). Si la rama ya la tenía activa, es una actualización
   * como en `instalar` (prueba, reinicio y vuelta atrás). `cambiada`: si la DLL es otra.
   */
  async instalarArchivo(rama: string, nombre: string): Promise<{ cambiada: boolean }> {
    const { n, dll, destino, actual } = await this.descargarParaRama(rama, nombre);
    if (actual?.equals(dll)) return { cambiada: false };
    if (await this.cambiarSiActiva(rama, n, destino, dll)) return { cambiada: true };
    await this.cambiarDll(destino, dll, n, rama);
    await this.limpiarAnteriores(destino);
    return { cambiada: true };
  }

  /** ¿Está php_<nombre>.dll en ext/ de la rama? */
  tieneDll(rama: string, nombre: string): boolean {
    return existsSync(path.join(this.carpetaExt(rama), `php_${validarNombre(nombre)}.dll`));
  }

  /** Ruta de php_<nombre>.dll en ext/ de la rama (exista o no). */
  rutaDll(rama: string, nombre: string): string {
    return path.join(this.carpetaExt(rama), `php_${validarNombre(nombre)}.dll`);
  }

  /**
   * Si la extensión ya está activa en la rama (cargada por el pool), cambia la DLL en la fila del
   * ini, la prueba con php -v, reinicia y vuelve a la anterior si no queda sano. false si no
   * estaba activa (no hace nada).
   */
  private async cambiarSiActiva(
    rama: string,
    n: string,
    destino: string,
    dll: Buffer,
  ): Promise<boolean> {
    if (!extensionesActivas(await this.d.ini.leer(rama)).has(n)) return false;
    await this.d.ini.enCola(rama, async () => {
      const deshacer = await this.cambiarDll(destino, dll, n, rama);
      try {
        await this.d.ini.probar(rama, await this.d.ini.leer(rama));
      } catch (err) {
        await deshacer();
        throw err;
      }
      await this.d.ini.aplicarEnPool(rama, deshacer);
    });
    await this.limpiarAnteriores(destino);
    return true;
  }

  /** Descarga la variante de la compilación instalada (del catálogo de la rama) y la verifica. */
  private async descargarParaRama(
    rama: string,
    nombre: string,
  ): Promise<{ n: string; dll: Buffer; destino: string; actual: Buffer | null }> {
    const n = validarNombre(nombre);
    await this.d.ini.leer(rama); // valida la rama
    const candidatas = this.delCatalogo(rama, n);
    if (candidatas.length === 0) {
      throw new ErrorWolf(
        'php.extension_no_catalogo',
        `La extensión ${n} no está en el catálogo para PHP ${rama}.`,
        { nombre: n },
      );
    }
    const variante = await this.variante(rama);
    const e = candidatas.find((c) => c.variante === variante);
    if (!e) {
      throw new ErrorWolf(
        'php.sin_variante',
        `El catálogo no tiene ${n} para la compilación ${variante} de PHP ${rama}.`,
        { nombre: n, variante },
      );
    }
    const datos = await this.descargar(e);
    const dll = e.formato === 'archivo' ? datos : await this.dllDelZip(e, datos);
    const destino = path.join(this.carpetaExt(rama), `php_${n}.dll`);
    const actual = existsSync(destino) ? await readFile(destino).catch(() => null) : null;
    return { n, dll, destino, actual };
  }

  /**
   * Pone `dll` en `destino` sin borrar la anterior: la renombra (en Windows se puede renombrar
   * una DLL cargada, no borrarla) y la nueva entra con un rename. Devuelve cómo deshacerlo. Si un
   * rename falla (la DLL bloqueada por otro proceso), lanza `php.extension_en_uso` o, si `ext/`
   * quedó sin la DLL, `php.extension_sin_dll` (la anterior queda apartada y vuelve al arrancar).
   */
  private async cambiarDll(
    destino: string,
    dll: Buffer,
    nombre: string,
    rama: string,
  ): Promise<() => Promise<void>> {
    const renombrar = this.d.renombrar ?? rename;
    await mkdir(path.dirname(destino), { recursive: true });
    const sufijo = randomBytes(4).toString('hex');
    const tmp = `${destino}.nuevo-${sufijo}`;
    const anterior = `${destino}.anterior-${sufijo}`;
    await writeFile(tmp, dll);
    const habia = existsSync(destino);
    try {
      if (habia) await renombrar(destino, anterior);
      await renombrar(tmp, destino);
    } catch (err) {
      if (habia && !existsSync(destino)) await renombrar(anterior, destino).catch(() => undefined);
      await rm(tmp, { force: true }).catch(() => undefined);
      throw dllBloqueada(nombre, rama, habia && !existsSync(destino), err);
    }
    return async () => {
      if (habia) {
        // La nueva puede estar cargada: se aparta con otro nombre antes de devolver la anterior.
        const descartada = `${destino}.descartada-${sufijo}`;
        await renombrar(destino, descartada).catch(() => undefined);
        try {
          await renombrar(anterior, destino);
        } catch (err) {
          throw dllBloqueada(nombre, rama, !existsSync(destino), err);
        }
        await rm(descartada, { force: true }).catch(() => undefined);
      } else {
        await rm(destino, { force: true }).catch(() => undefined);
      }
    };
  }

  /** Borra las DLL apartadas (`.anterior-`, `.descartada-`); las que siguen cargadas quedan. */
  private async limpiarAnteriores(destino: string): Promise<void> {
    await limpiarDllApartadas(path.dirname(destino), path.basename(destino));
  }

  /** Descarga con redirecciones manuales (cada salto, a un host permitido) y verifica el hash. */
  private async descargar(e: ExtensionPhpCatalogo): Promise<Buffer> {
    const f = this.d.fetch ?? fetch;
    let url = e.url;
    // Las redirecciones solo siguen dentro del host de la entrada (no a otro host permitido).
    const host = new URL(e.url).hostname;
    let res: Response | null = null;
    for (let salto = 0; salto <= MAX_REDIRECCIONES; salto++) {
      if (!urlOficial(url) || new URL(url).hostname !== host) {
        throw fallo('redirección a un host no permitido');
      }
      try {
        res = await f(url, { redirect: 'manual', signal: AbortSignal.timeout(120_000) });
      } catch (err) {
        throw fallo(err instanceof Error ? err.message : String(err));
      }
      if (res.status >= 300 && res.status < 400) {
        const destino = res.headers.get('location');
        await res.body?.cancel().catch(() => undefined);
        if (!destino) throw fallo(`HTTP ${res.status} sin destino`);
        url = new URL(destino, url).toString();
        res = null;
        continue;
      }
      break;
    }
    if (!res) throw fallo('demasiadas redirecciones');
    if (!res.ok || !res.body) {
      await res.body?.cancel().catch(() => undefined);
      throw fallo(`HTTP ${res.status}`);
    }
    const trozos: Buffer[] = [];
    let total = 0;
    const lector = res.body.getReader();
    try {
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        total += value.length;
        if (total > MAX_BYTES_DESCARGA) throw fallo('archivo demasiado grande');
        trozos.push(Buffer.from(value));
      }
    } finally {
      await lector.cancel().catch(() => undefined);
    }
    const datos = Buffer.concat(trozos);
    if (createHash('sha256').update(datos).digest('hex') !== e.sha256) {
      throw new ErrorWolf(
        'php.huella_distinta',
        'La descarga no coincide con la huella publicada.',
      );
    }
    return datos;
  }

  private async dllDelZip(e: ExtensionPhpCatalogo, datos: Buffer): Promise<Buffer> {
    const tmp = path.join(this.d.rutas.tmp(), `ext-${e.nombre}-${randomBytes(4).toString('hex')}`);
    await mkdir(tmp, { recursive: true });
    try {
      const zip = path.join(tmp, 'paquete.zip');
      await writeFile(zip, datos);
      const stage = path.join(tmp, 'x');
      await extraerZip(zip, stage);
      const dll = path.join(stage, ...(e.archivo ?? '').split('/'));
      if (!dll.startsWith(stage + path.sep) || !existsSync(dll)) {
        throw fallo('el paquete no trae la DLL esperada');
      }
      return await readFile(dll);
    } finally {
      await rm(tmp, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

const APARTADA = /^(php_[a-z0-9_]+\.dll)\.(anterior|descartada)-[0-9a-f]{8}$/i;

/**
 * Borra de `carpeta` (ext/ de una rama) las DLL que se apartaron al instalar o actualizar una
 * extensión (`php_x.dll.anterior-…`, `.descartada-…`); solo las de `base` si se indica. Las que
 * sigan cargadas por algún proceso no se pueden borrar y quedan para la próxima vez.
 */
export async function limpiarDllApartadas(carpeta: string, base?: string): Promise<void> {
  for (const n of await readdir(carpeta).catch(() => [] as string[])) {
    const m = APARTADA.exec(n);
    if (!m || (base !== undefined && m[1]!.toLowerCase() !== base.toLowerCase())) continue;
    const dll = path.join(carpeta, m[1]!);
    // Un cambio cortado a medias dejó ext/ sin la DLL: vuelve la anterior en vez de borrarla.
    if (m[2] === 'anterior' && !existsSync(dll)) {
      await rename(path.join(carpeta, n), dll).catch(() => undefined);
      continue;
    }
    await rm(path.join(carpeta, n), { force: true }).catch(() => undefined);
  }
}

/** Error de una DLL que no se pudo renombrar (cargada por PHP u otro programa). */
function dllBloqueada(nombre: string, rama: string, sinDll: boolean, causa: unknown): ErrorWolf {
  return sinDll
    ? new ErrorWolf(
        'php.extension_sin_dll',
        `No se pudo cambiar la DLL de ${nombre} y la carpeta ext de PHP ${rama} quedó sin ella. Detenga PHP ${rama} y vuelva a intentarlo: la anterior vuelve a su lugar al arrancar.`,
        { nombre, rama },
        { cause: causa },
      )
    : new ErrorWolf(
        'php.extension_en_uso',
        `La DLL de ${nombre} está en uso. Detenga PHP ${rama} y vuelva a intentarlo.`,
        { nombre, rama },
        { cause: causa },
      );
}

function fallo(detalle: string): ErrorWolf {
  return new ErrorWolf('php.descarga_fallida', `No se pudo descargar la extensión: ${detalle}`, {
    detalle: detalle.slice(0, 200),
  });
}
