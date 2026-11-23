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
    if (!actual || !actual.equals(dll)) {
      await mkdir(this.carpetaExt(rama), { recursive: true });
      const tmp = `${destino}.nuevo-${randomBytes(4).toString('hex')}`;
      await writeFile(tmp, dll);
      try {
        await rename(tmp, destino);
      } catch (err) {
        await rm(tmp, { force: true }).catch(() => undefined);
        throw err;
      }
    }
    await this.activar(rama, n, true);
  }

  /** Descarga con redirecciones manuales (cada salto, a un host permitido) y verifica el hash. */
  private async descargar(e: ExtensionPhpCatalogo): Promise<Buffer> {
    const f = this.d.fetch ?? fetch;
    let url = e.url;
    let res: Response | null = null;
    for (let salto = 0; salto <= MAX_REDIRECCIONES; salto++) {
      if (!urlOficial(url)) throw fallo('redirección a un host no permitido');
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

function fallo(detalle: string): ErrorWolf {
  return new ErrorWolf('php.descarga_fallida', `No se pudo descargar la extensión: ${detalle}`, {
    detalle: detalle.slice(0, 200),
  });
}
