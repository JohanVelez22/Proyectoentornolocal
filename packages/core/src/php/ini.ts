import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { copiaConFecha } from '../herramientas/copiaConFecha';
import { renombrarConReintentos } from '../https/confianza';
import type { Ejecutor } from '../plataforma/tipos';
import type { Rutas } from '../rutas';

/** Tamaño máximo de un php.ini que se acepta para guardar. */
export const MAX_BYTES_INI = 1024 * 1024;
/** Largo máximo de la salida de PHP que viaja en un error (lista blanca de `ErrorWolf`). */
const MAX_SALIDA = 200;

const escapar = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------- codificación

/** ¿Los bytes son UTF-8 válido? */
export function esUtf8(b: Buffer): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(b);
    return true;
  } catch {
    return false;
  }
}

/** Texto de un ini: UTF-8 (sin BOM) si lo es; si no (cp1252 de un editor viejo), byte a byte. */
export function decodificarIni(b: Buffer): string {
  return esUtf8(b) ? b.toString('utf8').replace(/^\uFEFF/, '') : b.toString('latin1');
}

/**
 * Vuelve a bytes con la codificación de `original`: UTF-8 (con su BOM si lo tenía) o byte a byte
 * (así lo que no se tocó queda idéntico). Un ini que no era UTF-8 pasa entero a UTF-8 si el texto
 * trae caracteres que cp1252 no tiene o si `utf8` lo pide (p. ej. una ruta con tildes: PHP lee
 * las rutas en UTF-8). Quien llama ya guardó la copia con fecha de los bytes originales.
 */
export function codificarIni(texto: string, original: Buffer, o: { utf8?: boolean } = {}): Buffer {
  if (esUtf8(original)) {
    const bom = original[0] === 0xef && original[1] === 0xbb && original[2] === 0xbf;
    return Buffer.from((bom ? '\uFEFF' : '') + texto, 'utf8');
  }
  if (o.utf8 || [...texto].some((c) => c.codePointAt(0)! > 0xff)) {
    return Buffer.from(texto, 'utf8');
  }
  return Buffer.from(texto, 'latin1');
}

/** ¿Solo ASCII imprimible? (una ruta que se escribe igual en cualquier codificación) */
export const soloAscii = (t: string): boolean => /^[\x20-\x7e]*$/.test(t);

// ---------------------------------------------------------------- valores rápidos

const TAMANO = /^\d{1,7}[KMG]?$/i;
const interruptor = (v: string): boolean => /^(on|off|0|1|true|false|yes|no)$/i.test(v);

function zonaHoraria(v: string): boolean {
  if (v === 'UTC') return true;
  if (!/^[A-Za-z]+(\/[A-Za-z0-9_+-]+){1,2}$/.test(v)) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: v });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ajustes que la pantalla de PHP ofrece como "valores rápidos", con el validador de cada uno.
 * Ningún validador acepta `;`, comillas ni saltos de línea: un valor nunca puede colar otra
 * directiva en el archivo.
 */
export const VALORES_RAPIDOS = {
  memory_limit: (v: string) => v === '-1' || TAMANO.test(v),
  upload_max_filesize: (v: string) => TAMANO.test(v),
  post_max_size: (v: string) => TAMANO.test(v),
  max_execution_time: (v: string) => /^\d{1,5}$/.test(v) && Number(v) <= 86400,
  display_errors: (v: string) => interruptor(v) || /^(stderr|stdout)$/i.test(v),
  error_reporting: (v: string) =>
    /^-?\d{1,6}$/.test(v) ||
    (/^[A-Z_~&|^() ]+$/.test(v) && /\bE_[A-Z_]+\b/.test(v) && v.length <= 200),
  'date.timezone': zonaHoraria,
  'opcache.enable': interruptor,
} as const satisfies Record<string, (v: string) => boolean>;

export type ClaveRapida = keyof typeof VALORES_RAPIDOS;
export const CLAVES_RAPIDAS = Object.keys(VALORES_RAPIDOS) as ClaveRapida[];

function esClaveRapida(k: string): k is ClaveRapida {
  return Object.hasOwn(VALORES_RAPIDOS, k);
}

/** Salto de línea que usa el texto (se conserva al editar). */
function saltoDe(texto: string): string {
  return texto.includes('\r\n') ? '\r\n' : '\n';
}

/** Valor de una línea `clave = valor` sin comillas ni comentario final. */
function valorDeLinea(resto: string): string {
  const t = resto.trim();
  const comillas = /^"([^"]*)"/.exec(t);
  if (comillas) return comillas[1]!;
  return t.replace(/\s*;.*$/, '').trim();
}

/** Valor activo de cada clave (la última línea activa es la que vale en PHP); null si no está. */
export function valoresDe(texto: string, claves: readonly string[]): Record<string, string | null> {
  const lineas = texto.split(/\r?\n/);
  const res: Record<string, string | null> = {};
  for (const clave of claves) {
    const re = new RegExp(`^\\s*${escapar(clave)}\\s*=(.*)$`);
    let valor: string | null = null;
    for (const l of lineas) {
      const m = re.exec(l);
      if (m) valor = valorDeLinea(m[1]!);
    }
    res[clave] = valor;
  }
  return res;
}

/**
 * Fija `clave = valor` sin tocar comentarios: cambia la última línea activa; si no hay, agrega la
 * línea justo después del último ejemplo comentado (`;clave = …`); si tampoco, al final.
 */
function fijarValor(lineas: string[], clave: string, valor: string): void {
  const k = escapar(clave);
  const activa = new RegExp(`^\\s*${k}\\s*=`);
  const comentada = new RegExp(`^\\s*;\\s*${k}\\s*=`);
  const linea = `${clave} = ${valor}`;
  let ultimaActiva = -1;
  let ultimaComentada = -1;
  lineas.forEach((l, i) => {
    if (activa.test(l)) ultimaActiva = i;
    else if (comentada.test(l)) ultimaComentada = i;
  });
  if (ultimaActiva >= 0) {
    if (valorDeLinea(lineas[ultimaActiva]!.replace(activa, '')) !== valor) {
      lineas[ultimaActiva] = linea;
    }
  } else if (ultimaComentada >= 0) lineas.splice(ultimaComentada + 1, 0, linea);
  else {
    // Antes de las líneas vacías del final, para no dejar el valor tras un salto suelto.
    let i = lineas.length;
    while (i > 0 && lineas[i - 1]!.trim() === '') i--;
    lineas.splice(i, 0, linea);
  }
}

/** Aplica valores rápidos validados al texto; lanza `php.valor_invalido` con la primera clave mala. */
export function conValores(texto: string, cambios: Record<string, string>): string {
  const lineas = texto.split(/\r?\n/);
  for (const [clave, valor] of Object.entries(cambios)) {
    if (!esClaveRapida(clave) || typeof valor !== 'string' || !VALORES_RAPIDOS[clave](valor)) {
      throw new ErrorWolf('php.valor_invalido', `Valor no válido para ${clave}.`, { clave });
    }
    fijarValor(lineas, clave, valor);
  }
  return lineas.join(saltoDe(texto));
}

// ---------------------------------------------------------------- diff

/** Producto máximo de líneas distintas para el diff fino; por encima, reemplazo completo. */
const MAX_CELDAS_DIFF = 4_000_000;

type Op = { t: ' ' | '-' | '+'; linea: string; a: number; b: number };

function operaciones(a: string[], b: string[]): Op[] {
  let ini = 0;
  while (ini < a.length && ini < b.length && a[ini] === b[ini]) ini++;
  let finA = a.length;
  let finB = b.length;
  while (finA > ini && finB > ini && a[finA - 1] === b[finB - 1]) {
    finA--;
    finB--;
  }
  const ops: Op[] = [];
  for (let i = 0; i < ini; i++) ops.push({ t: ' ', linea: a[i]!, a: i, b: i });
  const ma = a.slice(ini, finA);
  const mb = b.slice(ini, finB);
  const n = ma.length;
  const m = mb.length;
  if (n * m > MAX_CELDAS_DIFF) {
    ma.forEach((l, i) => ops.push({ t: '-', linea: l, a: ini + i, b: ini }));
    mb.forEach((l, j) => ops.push({ t: '+', linea: l, a: finA, b: ini + j }));
  } else {
    // LCS clásico sobre la parte que cambia (prefijo y sufijo comunes ya quitados).
    const lcs = new Uint32Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        lcs[i * (m + 1) + j] =
          ma[i] === mb[j]
            ? lcs[(i + 1) * (m + 1) + j + 1]! + 1
            : Math.max(lcs[(i + 1) * (m + 1) + j]!, lcs[i * (m + 1) + j + 1]!);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && ma[i] === mb[j]) {
        ops.push({ t: ' ', linea: ma[i]!, a: ini + i, b: ini + j });
        i++;
        j++;
      } else if (j < m && (i >= n || lcs[i * (m + 1) + j + 1]! >= lcs[(i + 1) * (m + 1) + j]!)) {
        ops.push({ t: '+', linea: mb[j]!, a: ini + i, b: ini + j });
        j++;
      } else {
        ops.push({ t: '-', linea: ma[i]!, a: ini + i, b: ini + j });
        i++;
      }
    }
  }
  for (let k = 0; k < a.length - finA; k++) {
    ops.push({ t: ' ', linea: a[finA + k]!, a: finA + k, b: finB + k });
  }
  return ops;
}

/**
 * Diff unificado por líneas (`@@ -a,n +b,m @@`, líneas con ` `, `-` o `+`) con `contexto` líneas
 * alrededor de cada cambio. Texto vacío si no hay diferencias.
 */
export function diffLineas(antes: string, despues: string, contexto = 3): string {
  const ops = operaciones(antes.split(/\r?\n/), despues.split(/\r?\n/));
  const cambios = ops.flatMap((o, i) => (o.t === ' ' ? [] : [i]));
  if (cambios.length === 0) return '';
  const salida: string[] = [];
  let k = 0;
  while (k < cambios.length) {
    const desde = Math.max(0, cambios[k]! - contexto);
    let hasta = Math.min(ops.length - 1, cambios[k]! + contexto);
    while (k + 1 < cambios.length && cambios[k + 1]! - contexto <= hasta + 1) {
      k++;
      hasta = Math.min(ops.length - 1, cambios[k]! + contexto);
    }
    const tramo = ops.slice(desde, hasta + 1);
    const enA = tramo.filter((o) => o.t !== '+').length;
    const enB = tramo.filter((o) => o.t !== '-').length;
    salida.push(`@@ -${tramo[0]!.a + 1},${enA} +${tramo[0]!.b + 1},${enB} @@`);
    for (const o of tramo) salida.push(`${o.t}${o.linea}`);
    k++;
  }
  return salida.join('\n');
}

// ---------------------------------------------------------------- archivo por rama

/** Carpeta de copias con fecha del php.ini de una rama: etc/php/<rama>/respaldos. */
export function rutaRespaldosIni(rutas: Rutas, rama: string): string {
  return path.join(path.dirname(rutas.phpIni(rama)), 'respaldos');
}

/**
 * Marca de "php.ini editado por el usuario": con ella, arrancar PHP ya no regenera el archivo
 * desde php.ini-development (solo corrige `extension_dir` si la carpeta de datos se movió).
 */
export function rutaMarcaEditado(rutas: Rutas, rama: string): string {
  return path.join(path.dirname(rutas.phpIni(rama)), 'editado-por-usuario');
}

/**
 * Huella (SHA-256) del último php.ini que generó WolfCore Dev: si el archivo ya no coincide,
 * alguien lo editó por fuera y se trata como editado (no se regenera).
 */
export function rutaHuellaGenerado(rutas: Rutas, rama: string): string {
  return path.join(path.dirname(rutas.phpIni(rama)), 'generado.sha256');
}

/** Copias con fecha que se conservan por rama (las más viejas se borran al hacer una nueva). */
export const MAX_COPIAS_INI = 20;

const RESPALDO_VALIDO = /^php\.ini-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(-\d{1,3})?\.txt$/;

/**
 * Copia con fecha del php.ini de la rama (bytes tal cual) y rotación: quedan las
 * `MAX_COPIAS_INI` más nuevas. Solo se borran copias propias (`php.ini-<fecha>.txt`).
 */
export async function copiaIni(
  rutas: Rutas,
  rama: string,
  contenido: string | Buffer,
  ahora: Date = new Date(),
): Promise<string> {
  const carpeta = rutaRespaldosIni(rutas, rama);
  const ruta = await copiaConFecha(carpeta, 'php.ini', contenido, ahora);
  const copias = (await readdir(carpeta).catch(() => [] as string[]))
    .filter((n) => RESPALDO_VALIDO.test(n))
    .sort((a, b) => b.localeCompare(a));
  for (const vieja of copias.slice(MAX_COPIAS_INI)) {
    if (path.join(carpeta, vieja) === ruta) continue;
    await rm(path.join(carpeta, vieja), { force: true }).catch(() => undefined);
  }
  return ruta;
}

/**
 * `extension_dir` comparable: sin comentario final ni comillas, barras `/`, sin barra final y en
 * minúsculas (las rutas de Windows no distinguen mayúsculas).
 */
export function normalizarDirExt(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const v = valorDeLinea(valor).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  return v === '' ? null : v;
}

/** ¿La salida de `php -v` muestra fallos de arranque (extensiones, sintaxis, avisos)? */
export function salidaConFallos(salida: string): boolean {
  return /(^|\n)\s*(PHP\s+)?(Warning|Fatal error|Parse error|Notice|Deprecated|Core Warning)\b|syntax error|Unable to (load|start)|already loaded/i.test(
    salida,
  );
}

export interface RespaldoIni {
  nombre: string;
  /** Fecha de la copia (ISO, de la modificación del archivo). */
  fecha: string;
  bytes: number;
}

export interface DepsIniPhp {
  rutas: Rutas;
  exec: Ejecutor;
  /** Ruta del php CLI de la rama (se usa para probar el ini). */
  phpCli(rama: string): string;
  ramasInstaladas(): Promise<string[]>;
  /** Ruta del php.ini de la rama; lo genera si todavía no existe. */
  asegurarIni(rama: string): Promise<string>;
  /** ¿Están encendidos los php-cgi de la rama? */
  encendida(rama: string): boolean;
  /** Reinicia los php-cgi de la rama (y lo que dependa de su ini). */
  reiniciar(rama: string): Promise<void>;
  /** Tras reiniciar: ¿responden todos los trabajadores? */
  sano(rama: string): Promise<boolean>;
  ahora?: () => Date;
}

/**
 * Ajustes que se fuerzan al probar un ini (van después de `-c`, así pisan lo del archivo): los
 * fallos de arranque salen por stderr aunque el ini apague display_errors o los mande a un log.
 */
export const ARGS_PRUEBA_INI = [
  '-d',
  'display_errors=stderr',
  '-d',
  'display_startup_errors=1',
  '-d',
  'log_errors=0',
  '-d',
  'error_log=',
] as const;

/** Extra al probar el ini de un sitio: con Xdebug cargado, `php -v` no intenta depurar. */
export const ARGS_PRUEBA_INI_SITIO = ['-d', 'xdebug.start_with_request=no'] as const;

/**
 * php.ini de cada rama: lectura, diff, guardado con copia con fecha, prueba con `php -c <ini>
 * -v` antes de tocar el archivo y vuelta atrás si el pool no vuelve a arrancar.
 */
export class IniPhp {
  /** Una operación de escritura a la vez por rama. */
  private readonly colas = new Map<string, Promise<unknown>>();

  constructor(private readonly d: DepsIniPhp) {}

  private async rama(rama: unknown): Promise<string> {
    if (
      typeof rama !== 'string' ||
      !/^\d+\.\d+$/.test(rama) ||
      !(await this.d.ramasInstaladas()).includes(rama)
    ) {
      throw new ErrorWolf('php.rama_no_instalada', `PHP ${String(rama)} no está instalado.`, {
        rama: String(rama).slice(0, 20),
      });
    }
    return rama;
  }

  /** Ejecuta `fn` en la fila de la rama (los guardados nunca se cruzan). */
  enCola<T>(rama: string, fn: () => Promise<T>): Promise<T> {
    const previo = this.colas.get(rama) ?? Promise.resolve();
    const p = previo.then(fn, fn);
    this.colas.set(
      rama,
      p.catch(() => undefined),
    );
    return p;
  }

  /** Texto del php.ini de la rama (UTF-8 o cp1252, como esté el archivo). */
  async leer(rama: string): Promise<string> {
    const r = await this.rama(rama);
    return decodificarIni(await readFile(await this.d.asegurarIni(r)));
  }

  async valores(rama: string, claves: readonly string[]): Promise<Record<string, string | null>> {
    return valoresDe(await this.leer(rama), claves);
  }

  /**
   * Texto del ini con los valores rápidos aplicados (no escribe nada). `base` es el borrador del
   * editor; sin él, lo guardado.
   */
  async conValores(rama: string, cambios: Record<string, string>, base?: string): Promise<string> {
    if (base === undefined) return conValores(await this.leer(rama), cambios);
    await this.rama(rama);
    validarTexto(base);
    return conValores(base, cambios);
  }

  async diff(rama: string, nuevo: string): Promise<string> {
    validarTexto(nuevo);
    return diffLineas(await this.leer(rama), nuevo);
  }

  /**
   * Prueba `texto` con el php CLI de la rama sin tocar el php.ini: lo escribe en un temporal al
   * lado (mismas rutas relativas) y corre `php -c <temporal> -d … -v` con los fallos de arranque
   * forzados a stderr (`ARGS_PRUEBA_INI`). Lanza `php.ini_invalido`.
   */
  async probar(rama: string, texto: string | Buffer, extra: readonly string[] = []): Promise<void> {
    const r = await this.rama(rama);
    validarTexto(texto);
    const carpeta = path.dirname(this.d.rutas.phpIni(r));
    await mkdir(carpeta, { recursive: true });
    const tmp = path.join(carpeta, `php.ini.prueba-${randomBytes(4).toString('hex')}`);
    await writeFile(tmp, texto);
    try {
      const res = await this.d.exec(
        this.d.phpCli(r),
        ['-c', tmp, ...ARGS_PRUEBA_INI, ...extra, '-v'],
        {
          timeoutMs: 20000,
          cwd: this.d.rutas.bin('php', r),
        },
      );
      const salida = `${res.stderr}\n${res.stdout}`.split(tmp).join('php.ini').trim();
      if (res.codigo !== 0 || salidaConFallos(salida) || !/^PHP \d+\.\d+/m.test(res.stdout)) {
        // Primero las líneas con el fallo: son las que caben en los 200 caracteres del error.
        const lineas = salida.split(/\r?\n/).filter((l) => l.trim() !== '');
        const fallos = lineas.filter((l) => salidaConFallos(l));
        const resumen =
          [...fallos, ...lineas.filter((l) => !fallos.includes(l))].join('\n') ||
          `código ${res.codigo}`;
        throw new ErrorWolf('php.ini_invalido', `PHP ${r} no arranca con ese php.ini: ${resumen}`, {
          salida: recortarSalida(resumen),
        });
      }
    } finally {
      await rm(tmp, { force: true }).catch(() => undefined);
    }
  }

  /**
   * Guarda el php.ini de la rama: prueba el texto nuevo, hace la copia con fecha del actual (bytes
   * tal cual), escribe y, si la rama está encendida, reinicia su pool y comprueba que responde.
   * Si no responde, vuelve a escribir los bytes anteriores (y quita la marca si no estaba),
   * reinicia otra vez y lanza `php.no_arranco` (o `php.caido_tras_restaurar` si tampoco vuelve).
   */
  async guardar(rama: string, nuevo: string): Promise<{ respaldo: string }> {
    const r = await this.rama(rama);
    validarTexto(nuevo);
    return this.enCola(r, () => this.guardarEnCola(r, nuevo));
  }

  private async guardarEnCola(r: string, texto: string | Buffer): Promise<{ respaldo: string }> {
    const ini = await this.d.asegurarIni(r);
    const actual = await readFile(ini);
    // Con la misma codificación que el archivo: un ini en cp1252 no se corrompe al guardarlo.
    const nuevo = Buffer.isBuffer(texto) ? texto : codificarIni(texto, actual);
    validarTexto(nuevo);
    await this.limpiarPruebas(r);
    await this.probar(r, nuevo);
    const respaldo = await copiaIni(this.d.rutas, r, actual, this.d.ahora?.() ?? new Date());
    const marca = rutaMarcaEditado(this.d.rutas, r);
    const habiaMarca = existsSync(marca);
    // La marca va antes que el archivo: un arranque en medio nunca regenera el ini nuevo.
    await writeFile(marca, '', 'utf8');
    const deshacer = async (): Promise<void> => {
      await escribirIniAtomico(ini, actual);
      if (!habiaMarca) await rm(marca, { force: true }).catch(() => undefined);
    };
    try {
      await escribirIniAtomico(ini, nuevo);
    } catch (e) {
      await deshacer().catch(() => undefined);
      throw e;
    }
    await this.aplicarEnPool(r, deshacer);
    return { respaldo: path.basename(respaldo) };
  }

  /**
   * Si la rama está encendida, reinicia su pool y comprueba que responde. Si no, corre `deshacer`
   * (devolver lo anterior), reinicia otra vez, vuelve a comprobar y lanza `php.no_arranco` (el
   * pool quedó sirviendo como antes) o `php.caido_tras_restaurar` (sigue sin responder). Debe
   * llamarse dentro de la fila de la rama (`enCola`).
   */
  async aplicarEnPool(r: string, deshacer: () => Promise<void>): Promise<void> {
    if (!this.d.encendida(r)) return;
    if (await this.reiniciarYComprobar(r)) return;
    await deshacer();
    if (await this.reiniciarYComprobar(r)) {
      throw new ErrorWolf(
        'php.no_arranco',
        `PHP ${r} no volvió a arrancar con el cambio; se restauró lo anterior y responde.`,
        { rama: r },
      );
    }
    throw new ErrorWolf(
      'php.caido_tras_restaurar',
      `PHP ${r} no volvió a arrancar; se restauró lo anterior, pero sigue sin responder.`,
      { rama: r },
    );
  }

  private async reiniciarYComprobar(r: string): Promise<boolean> {
    try {
      await this.d.reiniciar(r);
      return await this.d.sano(r);
    } catch {
      return false;
    }
  }

  /** Copias con fecha del php.ini de la rama, de la más nueva a la más vieja. */
  async respaldos(rama: string): Promise<RespaldoIni[]> {
    const r = await this.rama(rama);
    const carpeta = rutaRespaldosIni(this.d.rutas, r);
    let nombres: string[];
    try {
      nombres = await readdir(carpeta);
    } catch {
      return [];
    }
    const res: RespaldoIni[] = [];
    for (const nombre of nombres.filter((n) => RESPALDO_VALIDO.test(n))) {
      const s = await stat(path.join(carpeta, nombre)).catch(() => null);
      if (s?.isFile()) res.push({ nombre, fecha: s.mtime.toISOString(), bytes: s.size });
    }
    return res.sort((a, b) => b.nombre.localeCompare(a.nombre));
  }

  /** Vuelve a aplicar una copia (con la misma prueba, copia previa y vuelta atrás). */
  async restaurar(rama: string, respaldo: string): Promise<{ respaldo: string }> {
    const r = await this.rama(rama);
    const lista = await this.respaldos(r);
    if (typeof respaldo !== 'string' || !lista.some((x) => x.nombre === respaldo)) {
      throw new ErrorWolf('php.respaldo_no_existe', 'Esa copia del php.ini no existe.');
    }
    // Bytes tal cual: una copia en cp1252 vuelve idéntica.
    const bytes = await readFile(path.join(rutaRespaldosIni(this.d.rutas, r), respaldo));
    validarTexto(bytes);
    return this.enCola(r, () => this.guardarEnCola(r, bytes));
  }

  /** Borra temporales de prueba que haya dejado un cierre brusco. */
  private async limpiarPruebas(r: string): Promise<void> {
    const carpeta = path.dirname(this.d.rutas.phpIni(r));
    const nombres = await readdir(carpeta).catch(() => [] as string[]);
    for (const n of nombres) {
      if (/^php\.ini\.(prueba|nuevo)-[0-9a-f]{8}$/.test(n)) {
        await rm(path.join(carpeta, n), { force: true }).catch(() => undefined);
      }
    }
  }
}

function validarTexto(texto: unknown): asserts texto is string | Buffer {
  const valido = Buffer.isBuffer(texto)
    ? texto.length <= MAX_BYTES_INI && !texto.includes(0)
    : typeof texto === 'string' &&
      !texto.includes('\0') &&
      Buffer.byteLength(texto, 'utf8') <= MAX_BYTES_INI;
  if (!valido) {
    throw new ErrorWolf('php.argumento_invalido', 'El php.ini no es un texto válido.', {
      campo: 'php.ini',
    });
  }
}

function recortarSalida(s: string): string {
  const limpio = s.replace(/\s+/g, ' ').trim();
  return limpio.length > MAX_SALIDA ? `${limpio.slice(0, MAX_SALIDA - 1)}…` : limpio;
}

/** Escribe en un temporal al lado y lo renombra: nunca queda un php.ini a medias. */
export async function escribirIniAtomico(
  destino: string,
  contenido: string | Buffer,
): Promise<void> {
  const tmp = `${path.dirname(destino)}${path.sep}php.ini.nuevo-${randomBytes(4).toString('hex')}`;
  await writeFile(tmp, contenido);
  try {
    // Un antivirus o un lector pueden tener php.ini abierto un instante (EPERM/EBUSY).
    await renombrarConReintentos(tmp, destino);
  } catch (e) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
}

/** ¿El usuario editó el php.ini de la rama desde WolfCore Dev? */
export function iniEditado(rutas: Rutas, rama: string): boolean {
  return existsSync(rutaMarcaEditado(rutas, rama));
}
