import { createHash } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { Plataforma } from '../plataforma/tipos';
import type { DefProceso, EstadoProceso } from '../procesos/supervisor';
import type { Rutas } from '../rutas';
import type { ResultadoAplicar } from '../sitios/sitios';
import { TIPOS_CON_PHP, type Sitio } from '../tipos';
import type { UpstreamPhp } from '../servicios/nginx';
import { extensionesActivas } from './extensiones';
import {
  codificarIni,
  decodificarIni,
  escribirIniAtomico,
  valoresDe,
  VALORES_RAPIDOS,
} from './ini';
import { validarXdebug, xdebugIni, type XdebugSitio } from './xdebug';

/**
 * Puertos de los pools propios de los sitios: fuera del rango de los pools de rama (9000 + rama)
 * y de los servicios. Todo el rango cuenta como reservado para los procesos de proyecto.
 */
export const RANGO_POOLS_SITIO = { desde: 19000, hasta: 19299 } as const;

/** Ajustes propios que se aceptan por sitio. */
const MAX_AJUSTES = 40;
const CLAVE_INI = /^[a-z][a-z0-9_]{0,40}(\.[a-z0-9_]{1,40}){0,3}$/i;
/** Lo que carga código o lo administra WolfCore Dev: nunca como ajuste propio. */
const CLAVES_PROHIBIDAS = /^(extension|zend_extension|extension_dir|xdebug\..*)$/i;
const CLAVES_PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * ¿El sitio corre en su propio pool de php-cgi? (tiene PHP y ajustes propios, Xdebug activo o la
 * captura de dumps: el `auto_prepend_file` va solo en su ini, nunca en el de la rama)
 */
export function necesitaPoolPropio(s: Sitio): boolean {
  if (!TIPOS_CON_PHP.includes(s.tipo) || !s.php) return false;
  return Object.keys(s.phpIni ?? {}).length > 0 || s.xdebug?.activo === true || capturaPhp(s);
}

/** ¿Lleva el pool del sitio el prepend de la captura de dumps? */
export function capturaPhp(s: Sitio): boolean {
  return s.capturaDumps === true && TIPOS_CON_PHP.includes(s.tipo) && !!s.php;
}

/** Ruta para el ini: barras normales (como zend_extension) y entre comillas. */
const rutaEnIni = (r: string): string => `"${r.replace(/\\/g, '/')}"`;

/** Trabajadores del pool del sitio: 2 con Xdebug (uno detenido en un punto no frena el resto). */
export function trabajadoresPool(s: Sitio): number {
  return s.xdebug?.activo ? 2 : 1;
}

/** Nombre del upstream de Nginx del pool de un sitio. */
export function nombreUpstreamSitio(id: string): string {
  return `phpsitio_${id.replace(/[^A-Za-z0-9]/g, '_')}`;
}

/** Id del supervisor de cada trabajador del pool de un sitio. */
export const idPoolSitio = (id: string, i: number): string => `php-sitio-${id}-${i}`;
const ID_POOL = /^php-sitio-(.+)-(\d+)$/;

/**
 * Puertos de cada pool propio. Los que ya tenía un sitio (`previos`) se conservan si siguen
 * libres y alcanzan; los demás sitios, en orden de id, toman los siguientes libres del rango.
 * Igual entrada → igual salida (nginx y los pools ven lo mismo). Los que no caben quedan fuera
 * del resultado y se anotan en `sinLugar` (van al upstream de su rama): nunca se lanza.
 */
export function asignarPuertosPools(
  sitios: readonly Sitio[],
  ocupados: Iterable<number>,
  previos: ReadonlyMap<string, number[]> = new Map(),
  sinLugar: string[] = [],
): Map<string, number[]> {
  const usados = new Set(ocupados);
  const con = [...sitios].filter(necesitaPoolPropio).sort((a, b) => a.id.localeCompare(b.id));
  const res = new Map<string, number[]>();
  for (const s of con) {
    const p = previos.get(s.id);
    if (p && p.length === trabajadoresPool(s) && p.every((x) => !usados.has(x))) {
      res.set(s.id, p);
      p.forEach((x) => usados.add(x));
    }
  }
  let siguiente: number = RANGO_POOLS_SITIO.desde;
  for (const s of con) {
    if (res.has(s.id)) continue;
    const puertos: number[] = [];
    while (puertos.length < trabajadoresPool(s)) {
      while (siguiente <= RANGO_POOLS_SITIO.hasta && usados.has(siguiente)) siguiente++;
      if (siguiente > RANGO_POOLS_SITIO.hasta) break;
      puertos.push(siguiente);
      usados.add(siguiente);
    }
    if (puertos.length === trabajadoresPool(s)) res.set(s.id, puertos);
    else sinLugar.push(s.id);
  }
  // Orden de los sitios para que la salida no dependa de qué puertos venían de antes.
  return new Map([...res].sort(([a], [b]) => a.localeCompare(b)));
}

const saltoDe = (t: string): string => (t.includes('\r\n') ? '\r\n' : '\n');

/**
 * Ajustes guardados del sitio que siguen siendo válidos (un config.json editado a mano no cuela
 * nada en el ini): los que no pasan `validarPhpIni` se anotan en `descartados`.
 */
export function ajustesValidos(
  phpIni: Record<string, string> | undefined,
  descartados: string[] = [],
): Record<string, string> {
  const res: Record<string, string> = {};
  for (const [k, v] of Object.entries(phpIni ?? {})) {
    if (Object.keys(res).length >= MAX_AJUSTES) {
      descartados.push(k);
      continue;
    }
    try {
      Object.assign(res, validarPhpIni({ [k]: v }));
    } catch {
      descartados.push(k);
    }
  }
  return res;
}

/**
 * php.ini del pool de un sitio: el de la rama tal cual y, al final (la última línea vale), una
 * sección `[PHP]` (el ini de la rama puede terminar en `[PATH=…]`) con los ajustes válidos del
 * sitio y Xdebug. La DLL de Xdebug no se repite si la rama ya la carga.
 */
export function iniSitio(
  s: Sitio,
  iniRama: string,
  rutaDllXdebug: string | null = null,
  descartados: string[] = [],
  rutaPrepend: string | null = null,
): string {
  const salto = saltoDe(iniRama);
  const lineas = ['[PHP]', `; ---- WolfCore Dev: ajustes propios del sitio ${s.dominio} ----`];
  const ajustes = ajustesValidos(s.phpIni, descartados);
  for (const [k, v] of Object.entries(ajustes)) {
    lineas.push(`${k} = ${v}`);
  }
  if (s.xdebug?.activo) {
    const cargada = extensionesActivas(iniRama).has('xdebug');
    lineas.push(...xdebugIni(s.xdebug, cargada ? null : rutaDllXdebug).split('\n'));
  }
  if (rutaPrepend && capturaPhp(s)) {
    // El prepend propio (del sitio o de la rama) no se pierde: el nuestro lo carga al final.
    const previo =
      ajustes['auto_prepend_file'] ??
      valoresDe(iniRama, ['auto_prepend_file'])['auto_prepend_file'] ??
      '';
    lineas.push('; ---- WolfCore Dev: captura de dump() ----', `wolfcore.sitio = "${s.id}"`);
    if (previo.trim() !== '' && !/^none$/i.test(previo.trim())) {
      lineas.push(`wolfcore.prepend_previo = ${rutaEnIni(previo.trim())}`);
    }
    lineas.push(`auto_prepend_file = ${rutaEnIni(rutaPrepend)}`);
  }
  const base = iniRama.endsWith('\n') || iniRama === '' ? iniRama : `${iniRama}${salto}`;
  return `${base}${lineas.join(salto)}${salto}`;
}

const valorInvalido = (clave: string): ErrorWolf =>
  new ErrorWolf('php.valor_invalido', `Valor no válido para ${clave}.`, {
    clave: clave.slice(0, 64),
  });

/**
 * Ajustes propios de un sitio que llegan de la interfaz. Claves de ini simples (nunca las que
 * cargan extensiones ni las de Xdebug), valores de una línea sin `;`, comillas ni `${…}`; las
 * claves con validador de valores rápidos usan ese validador.
 */
export function validarPhpIni(v: unknown): Record<string, string> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw new ErrorWolf('php.argumento_invalido', 'Ajustes de php.ini no válidos.', {
      campo: 'phpIni',
    });
  }
  if (Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) {
    throw new ErrorWolf('php.argumento_invalido', 'Ajustes de php.ini no válidos.', {
      campo: 'phpIni',
    });
  }
  const entradas = Object.entries(v as Record<string, unknown>);
  if (entradas.length > MAX_AJUSTES) {
    throw new ErrorWolf('php.argumento_invalido', 'Demasiados ajustes de php.ini.', {
      campo: 'phpIni',
    });
  }
  const res: Record<string, string> = {};
  for (const [clave, valor] of entradas) {
    if (CLAVES_PELIGROSAS.has(clave) || !CLAVE_INI.test(clave) || CLAVES_PROHIBIDAS.test(clave)) {
      throw valorInvalido(clave);
    }
    if (
      typeof valor !== 'string' ||
      valor.trim() === '' ||
      valor.length > 256 ||
      /[;"\r\n\0]/.test(valor) ||
      valor.includes('${') ||
      [...valor].some((c) => c.charCodeAt(0) < 0x20)
    ) {
      throw valorInvalido(clave);
    }
    const rapido = (VALORES_RAPIDOS as Record<string, (x: string) => boolean>)[clave];
    if (Object.hasOwn(VALORES_RAPIDOS, clave) && rapido && !rapido(valor.trim())) {
      throw valorInvalido(clave);
    }
    res[clave] = valor.trim();
  }
  return res;
}

// ---------------------------------------------------------------- pools

/**
 * ¿El fallo de un pool de sitio es ajeno al ini (puerto ocupado por otro programa, sin puertos
 * libres)? Esos no deben hacer volver atrás el php.ini de la rama.
 */
export function esFalloAjenoAlIni(e: unknown): boolean {
  const codigo = (e as { codigo?: unknown } | null)?.codigo;
  return codigo === 'servicios.puerto_ocupado' || codigo === 'php.sin_puertos_sitio';
}

/** Aviso sobre el PHP propio de un sitio (lo publica el núcleo en el centro de avisos). */
export interface AvisoPoolSitio {
  tipo: 'fallo' | 'sin_puertos' | 'descartados';
  /** Dominio del sitio. */
  sitio: string;
  /** Directivas descartadas (`descartados`). */
  claves?: string[];
}

/** Errores de una sincronización, por id de sitio. */
export type ErroresPools = Map<string, unknown>;

type SupervisorPools = {
  iniciar(def: DefProceso): Promise<void>;
  detener(id: string): Promise<void>;
  estado(id: string): EstadoProceso;
  pid(id: string): number | null;
  ids(): string[];
};

export interface DepsPoolsSitio {
  rutas: Rutas;
  plataforma: Pick<Plataforma, 'ejecutable' | 'quienUsaPuerto'>;
  supervisor: SupervisorPools;
  leerSitios(): Promise<Sitio[]>;
  ramasInstaladas(): Promise<string[]>;
  /** ¿Está encendido el pool compartido de la rama? (los pools propios viven con él) */
  ramaEncendida(rama: string): boolean;
  /** Bytes del php.ini de la rama (lo genera si falta). */
  leerIniRama(rama: string): Promise<Buffer>;
  /** Ruta de php_xdebug.dll de la rama (exista o no). */
  rutaDllXdebug(rama: string): string;
  /** Puertos que los pools no pueden tomar (servicios, pools de rama, rangos del sistema). */
  ocupados(): Promise<number[]>;
  /** Puertos del pool compartido de la rama (destino de los sitios sin puertos propios). */
  puertosRama(rama: string): Promise<number[]>;
  avisar?(a: AvisoPoolSitio): void;
  sonda(puerto: number): Promise<boolean>;
  /** Deja al día el prepend de la captura de dumps y devuelve su ruta. */
  rutaPrepend?(): Promise<string>;
  /** Espera máxima a que un pool responda. */
  plazoSanoMs?: number;
}

interface PoolEnMarcha {
  rama: string;
  puertos: number[];
  huella: string;
}

/**
 * Pools de php-cgi propios de los sitios con ajustes o Xdebug (`php-sitio-<id>-<i>`). Cada uno
 * usa el php-cgi de la rama del sitio con su propio ini (`etc/php-sitios/<id>/php.ini`) y vive
 * mientras el pool compartido de su rama esté encendido.
 */
export class PoolsSitio {
  private asignados = new Map<string, number[]>();
  private sinLugar: string[] = [];
  private readonly enMarcha = new Map<string, PoolEnMarcha>();
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsPoolsSitio) {}

  private enCola<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.cola.then(fn, fn);
    this.cola = p.catch(() => undefined);
    return p;
  }

  rutaIni(id: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id) || id.includes('..')) {
      throw new Error(`Id de sitio no válido: ${id}`);
    }
    return path.join(this.d.rutas.base, 'etc', 'php-sitios', id, 'php.ini');
  }

  upstreamDe(s: Sitio): string {
    return nombreUpstreamSitio(s.id);
  }

  /** Puertos de cada pool propio (pegados a los que ya tenían). */
  private async asignacion(sitios: Sitio[]): Promise<Map<string, number[]>> {
    const sinLugar: string[] = [];
    this.asignados = asignarPuertosPools(sitios, await this.d.ocupados(), this.asignados, sinLugar);
    this.sinLugar = sinLugar;
    return this.asignados;
  }

  /** Upstreams de Nginx de los pools propios (de ramas instaladas), por nombre. */
  async upstreams(sitios?: Sitio[]): Promise<UpstreamPhp[]> {
    const lista = sitios ?? (await this.d.leerSitios());
    const instaladas = await this.d.ramasInstaladas();
    const asignacion = await this.asignacion(lista);
    const res: UpstreamPhp[] = [];
    for (const s of lista) {
      if (!necesitaPoolPropio(s) || !instaladas.includes(s.php!)) continue;
      // Sin puertos propios: su upstream apunta al pool de la rama (el vhost sigue siendo válido).
      const puertos = asignacion.get(s.id) ?? (await this.d.puertosRama(s.php!));
      res.push({ version: s.php!, nombre: nombreUpstreamSitio(s.id), puertos });
    }
    return res.sort((a, b) => a.nombre!.localeCompare(b.nombre!));
  }

  /**
   * Deja los pools como piden los sitios: arranca (o reinicia si cambió su ini o sus puertos)
   * los de sitios con ajustes cuya rama está encendida y apaga los demás (también los que quedaron
   * de una sesión anterior). `rama` limita a esa rama; `forzar` reinicia aunque nada cambie (la
   * DLL o el ini de la rama cambiaron). Un pool que no arranca no frena a los demás: devuelve los
   * errores por id de sitio (y los avisa); nunca lanza por un sitio.
   */
  sincronizar(
    o: { rama?: string; forzar?: boolean; sitios?: Sitio[] } = {},
  ): Promise<ErroresPools> {
    return this.enCola(() => this.sincronizarEnCola(o));
  }

  private async sincronizarEnCola(o: {
    rama?: string;
    forzar?: boolean;
    sitios?: Sitio[];
  }): Promise<ErroresPools> {
    const sitios = o.sitios ?? (await this.d.leerSitios());
    const instaladas = await this.d.ramasInstaladas();
    const asignacion = await this.asignacion(sitios);
    const errores: ErroresPools = new Map();
    for (const id of this.sinLugar) {
      const s = sitios.find((x) => x.id === id);
      if (!s || (o.rama !== undefined && s.php !== o.rama)) continue;
      errores.set(
        id,
        new ErrorWolf(
          'php.sin_puertos_sitio',
          'No quedan puertos libres para los PHP propios de los sitios.',
        ),
      );
      this.d.avisar?.({ tipo: 'sin_puertos', sitio: s.dominio });
    }
    const deseados = new Set<string>();
    for (const s of sitios) {
      const puertos = asignacion.get(s.id);
      if (!puertos || !instaladas.includes(s.php!) || !this.d.ramaEncendida(s.php!)) continue;
      deseados.add(s.id);
      if (o.rama !== undefined && s.php !== o.rama) continue;
      try {
        await this.asegurar(s, puertos, o.forzar === true);
      } catch (e) {
        errores.set(s.id, e);
        this.d.avisar?.({ tipo: 'fallo', sitio: s.dominio });
      }
    }
    // Apagar lo que sobra: sitios sin ajustes, borrados, ramas apagadas o restos readoptados.
    const sobrantes = new Set<string>();
    for (const id of this.d.supervisor.ids()) {
      const m = ID_POOL.exec(id);
      if (m && !deseados.has(m[1]!)) sobrantes.add(m[1]!);
    }
    for (const id of this.enMarcha.keys()) if (!deseados.has(id)) sobrantes.add(id);
    for (const id of sobrantes) {
      try {
        await this.apagar(id);
        if (!sitios.some((s) => s.id === id && necesitaPoolPropio(s))) {
          await rm(path.dirname(this.rutaIni(id)), { recursive: true, force: true });
        }
      } catch (e) {
        errores.set(id, e);
      }
    }
    return errores;
  }

  /** Escribe el ini del sitio y arranca su pool si no está, o si cambió algo (o `forzar`). */
  private async asegurar(s: Sitio, puertos: number[], forzar: boolean): Promise<void> {
    const rama = s.php!;
    const bytesRama = await this.d.leerIniRama(rama);
    const descartados: string[] = [];
    // El prepend se escribe antes que el ini: un auto_prepend_file que falta tumba el sitio.
    const prepend = capturaPhp(s) && this.d.rutaPrepend ? await this.d.rutaPrepend() : null;
    const texto = iniSitio(
      s,
      decodificarIni(bytesRama),
      this.d.rutaDllXdebug(rama),
      descartados,
      prepend,
    );
    if (descartados.length > 0) {
      this.d.avisar?.({ tipo: 'descartados', sitio: s.dominio, claves: descartados });
    }
    const bytes = codificarIni(texto, bytesRama);
    const huella = createHash('sha256')
      .update(bytes)
      .update(`|${rama}|${puertos.join(',')}`)
      .digest('hex');
    const actual = this.enMarcha.get(s.id);
    const vivos = puertos.every((_, i) => {
      const e = this.d.supervisor.estado(idPoolSitio(s.id, i));
      return e === 'encendido' || e === 'iniciando';
    });
    if (!forzar && actual?.huella === huella && vivos) return;
    await this.apagar(s.id);
    const ini = this.rutaIni(s.id);
    await mkdir(path.dirname(ini), { recursive: true });
    await escribirIniAtomico(ini, bytes);
    const bin = this.d.rutas.bin('php', rama);
    for (const [i, puerto] of puertos.entries()) {
      const id = idPoolSitio(s.id, i);
      const uso = await this.d.plataforma.quienUsaPuerto(puerto);
      if (uso && this.d.supervisor.pid(id) !== uso.pid) {
        throw new ErrorWolf(
          'servicios.puerto_ocupado',
          `El puerto ${puerto} lo usa ${uso.nombre} (PID ${uso.pid}).`,
          { puerto, pid: uso.pid, nombre: uso.nombre },
        );
      }
      await this.d.supervisor.iniciar({
        id,
        nombre: `PHP ${rama} (${s.dominio})`,
        comando: path.join(bin, this.d.plataforma.ejecutable('php-cgi')),
        args: ['-c', ini, '-b', `127.0.0.1:${puerto}`],
        cwd: bin,
        env: { PHP_FCGI_MAX_REQUESTS: '0' },
        puerto,
        log: this.d.rutas.logs(`php-sitio-${s.id}.log`),
        reiniciar: true,
        // Al readoptar, PID + ejecutable no bastan: otro php-cgi (Laragon, XAMPP) puede tener el PID.
        exigirInicio: true,
      });
    }
    this.enMarcha.set(s.id, { rama, puertos, huella });
  }

  /** Detiene todos los trabajadores del pool de un sitio. */
  private async apagar(id: string): Promise<void> {
    const ids = new Set(this.d.supervisor.ids().filter((x) => ID_POOL.exec(x)?.[1] === id));
    for (let i = 0; i < 2; i++) ids.add(idPoolSitio(id, i));
    for (const x of ids) {
      if (this.d.supervisor.estado(x) !== 'apagado') await this.d.supervisor.detener(x);
    }
    this.enMarcha.delete(id);
  }

  /** Reinicia los pools de los sitios de la rama (su ini o su DLL de Xdebug cambiaron). */
  reiniciarRama(rama: string): Promise<ErroresPools> {
    return this.sincronizar({ rama, forzar: true });
  }

  /** Apaga los pools de los sitios de la rama (antes de apagar la rama). */
  detenerRama(rama: string): Promise<void> {
    return this.enCola(async () => {
      for (const [id, p] of [...this.enMarcha]) if (p.rama === rama) await this.apagar(id);
      for (const s of await this.d.leerSitios()) {
        if (s.php === rama) await this.apagar(s.id);
      }
    });
  }

  /** ¿Responde el pool del sitio? true si no tiene pool en marcha (nada que comprobar). */
  async sanoSitio(id: string): Promise<boolean> {
    const p = this.enMarcha.get(id);
    if (!p) return true;
    const limite = Date.now() + (this.d.plazoSanoMs ?? 15_000);
    for (;;) {
      if ((await Promise.all(p.puertos.map((x) => this.d.sonda(x)))).every(Boolean)) return true;
      const enError = p.puertos.some(
        (_, i) => this.d.supervisor.estado(idPoolSitio(id, i)) === 'error',
      );
      if (enError || Date.now() >= limite) return false;
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  /** ¿Responden todos los pools de la rama? */
  async sanaRama(rama: string): Promise<boolean> {
    for (const [id, p] of this.enMarcha) {
      if (p.rama === rama && !(await this.sanoSitio(id))) return false;
    }
    return true;
  }

  /** Ids de los sitios con pool en marcha (para el estado). */
  enMarchaIds(): string[] {
    return [...this.enMarcha.keys()];
  }
}

// ---------------------------------------------------------------- guardar con vuelta atrás

export interface CamposPhpSitio {
  phpIni: Record<string, string>;
  xdebug: XdebugSitio | null;
  /** Captura de dumps (prepend en el pool propio). */
  capturaDumps: boolean;
}

export interface DepsAjustesPhpSitio {
  leerSitio(id: string): Promise<Sitio | undefined>;
  /** Guarda solo phpIni y xdebug del sitio en la configuración. */
  guardar(id: string, campos: CamposPhpSitio): Promise<void>;
  /** Bytes del ini que tendría el pool del sitio (ini de la rama + ajustes). */
  iniPrueba(s: Sitio): Promise<Buffer>;
  /** `php -c <ini> -v` con el CLI de la rama (lanza `php.ini_invalido`). */
  probarIni(rama: string, texto: Buffer): Promise<void>;
  /** ¿Está php_xdebug.dll en ext/ de la rama? */
  dllXdebug(rama: string): boolean;
  /** Instala php_xdebug.dll del catálogo SIN activarla en el ini de la rama. */
  instalarXdebug(rama: string): Promise<void>;
  /** Sincroniza los pools; errores por id de sitio. */
  sincronizar(): Promise<ErroresPools>;
  sanoSitio(id: string): Promise<boolean>;
  aplicar(): Promise<ResultadoAplicar>;
  /** Puertos de PHP y de servicios (para avisar si el de Xdebug choca con alguno). */
  puertosOcupados(): Promise<number[]>;
}

export interface ResultadoPhpSitio {
  aplicar: ResultadoAplicar;
  /** Puerto de Xdebug que ya usa un PHP u otro servicio (el editor no podrá escucharlo). */
  avisoPuerto: number | null;
}

/**
 * Cambios de `phpIni` y Xdebug de un sitio: prueba el ini con `php -v`, guarda, arranca o
 * reinicia su pool, comprueba que responde y solo entonces cambia Nginx. Si algo falla, vuelve a
 * lo anterior (configuración, pool y Nginx) como en el php.ini de la rama.
 */
export class AjustesPhpSitio {
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsAjustesPhpSitio) {}

  async guardarPhpIni(id: string, valores: unknown): Promise<ResultadoPhpSitio> {
    const phpIni = validarPhpIni(valores);
    return this.cambiar(id, (s) => ({
      phpIni,
      xdebug: s.xdebug ?? null,
      capturaDumps: s.capturaDumps === true,
    }));
  }

  async xdebug(id: string, x: unknown): Promise<ResultadoPhpSitio> {
    const xdebug = validarXdebug(x);
    return this.cambiar(id, (s) => ({
      phpIni: s.phpIni ?? {},
      xdebug,
      capturaDumps: s.capturaDumps === true,
    }));
  }

  /**
   * Captura de dumps del sitio: con ella su pool propio carga el prepend (`auto_prepend_file`);
   * sin ella el ini del sitio no lo lleva. Misma prueba, salud y vuelta atrás que los ajustes.
   */
  captura(id: string, activa: boolean): Promise<ResultadoPhpSitio> {
    return this.cambiar(id, (s) => ({
      phpIni: s.phpIni ?? {},
      xdebug: s.xdebug ?? null,
      capturaDumps: activa,
    }));
  }

  private cambiar(id: string, nuevos: (s: Sitio) => CamposPhpSitio): Promise<ResultadoPhpSitio> {
    const p = this.cola.then(
      () => this.cambiarEnCola(id, nuevos),
      () => this.cambiarEnCola(id, nuevos),
    );
    this.cola = p.catch(() => undefined);
    return p;
  }

  private async cambiarEnCola(
    id: string,
    nuevos: (s: Sitio) => CamposPhpSitio,
  ): Promise<ResultadoPhpSitio> {
    const previo = await this.d.leerSitio(id);
    if (!previo || !TIPOS_CON_PHP.includes(previo.tipo) || !previo.php) {
      throw new ErrorWolf('php.sitio_sin_php', 'Ese sitio no usa PHP.');
    }
    const rama = previo.php;
    const campos = nuevos(previo);
    const anteriores: CamposPhpSitio = {
      phpIni: previo.phpIni ?? {},
      xdebug: previo.xdebug ?? null,
      capturaDumps: previo.capturaDumps === true,
    };
    const nuevo: Sitio = { ...previo, ...campos };
    const propio = necesitaPoolPropio(nuevo);
    if (nuevo.xdebug?.activo && !this.d.dllXdebug(rama)) await this.d.instalarXdebug(rama);
    if (propio) await this.d.probarIni(rama, await this.d.iniPrueba(nuevo));

    await this.d.guardar(id, campos);
    const volver = async (): Promise<void> => {
      await this.d.guardar(id, anteriores);
      await this.d.sincronizar().catch(() => undefined);
    };
    if (propio) {
      // El pool nuevo primero; Nginx cambia de upstream solo si responde.
      let sano = false;
      try {
        // Solo cuenta el error de este sitio: el de otro (su puerto ocupado) no lo frena.
        const errores = await this.d.sincronizar();
        if (errores.has(id)) throw errores.get(id);
        sano = await this.d.sanoSitio(id);
      } catch (e) {
        await volver();
        throw e;
      }
      if (!sano) {
        await volver();
        throw new ErrorWolf(
          'php.sitio_no_arranco',
          `El PHP propio de ${previo.dominio} no respondió con el cambio; se volvió a lo anterior.`,
          { sitio: previo.dominio },
        );
      }
    }
    const aplicar = await this.d.aplicar();
    if (!aplicar.nginx.ok) {
      await volver();
      await this.d.aplicar().catch(() => undefined);
      return { aplicar, avisoPuerto: null };
    }
    // Sin pool propio: Nginx ya apunta al compartido; ahora se apaga el del sitio.
    if (!propio) await this.d.sincronizar();
    const puerto = nuevo.xdebug?.activo ? nuevo.xdebug.puerto : null;
    const choca = puerto !== null && (await this.d.puertosOcupados()).includes(puerto);
    return { aplicar, avisoPuerto: choca ? puerto : null };
  }
}
