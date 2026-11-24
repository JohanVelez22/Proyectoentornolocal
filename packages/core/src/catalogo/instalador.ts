import { createHash, randomBytes, type Hash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import {
  copyFile,
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
  type FileHandle,
} from 'node:fs/promises';
import path from 'node:path';
import { extraerZip } from './zip';
import type { Eventos, EventosNucleo } from '../eventos';
import type { Rutas } from '../rutas';
import type { ProgresoInstalacion } from '../tipos';
import { ErrorWolf } from '../errores';
import { ejecutorPorDefecto } from '../plataforma/win';
import { renombrarConReintentos } from '../https/confianza';
import { catalogo, ejecutableDe, huellaDeEntrada, type VersionDisponible } from './catalogo';
import { claveValida, rutaRelativaSegura, urlOficial } from './comun';
import {
  fuenteFirmaDe,
  huellaDe,
  huellaFuerte,
  type AlgoritmoHuella,
  type FuenteFirma,
  type Huella,
} from './huellas';
import { sumaDe } from './fuentes/tipos';
import { anillo as anilloFijado } from './pgp/anillos';
import type { ClavePublica } from './pgp/paquetes';
import {
  esResultado,
  iniciarVerificacion,
  verificarFirmaSeparada,
  type FalloFirma,
} from './pgp/verificar';
import { leerAcotadoBytes, pedirConSaltos } from './red';
import { InstaladorRust } from '../runtimes/rust';
import type { Ejecutor, PlataformaCompleta } from '../plataforma/tipos';

/** Intentos al mover la carpeta extraída a `bin/` (≈ 30 s con la espera creciente). */
const INTENTOS_RENOMBRAR = 150;

export interface OpcionesInstalador {
  /** Corta la descarga si no llegan bytes durante este tiempo. Por defecto 60000. */
  tiempoSinDatosMs?: number;
  /** Esperas entre reintentos de descarga (ms); su largo es el número de reintentos. */
  esperasReintentoMs?: number[];
  /** Inyectable para pruebas. */
  renombrar?: (de: string, a: string) => Promise<void>;
  /** Ejecuta rustup (Rust se instala con él, no con un zip). Por defecto, el de Windows. */
  exec?: Ejecutor;
  /** Para limpiar la entrada de desinstalación que deja rustup-init (solo Rust). */
  plataforma?: Pick<PlataformaCompleta, 'limpiarEntradaRustup'>;
  /** Aviso al usuario (código de `avisos.*`) por algo que el instalador no tocó. */
  alAvisar?: (codigo: 'avisos.rustup_entrada_ajena') => void;
  /** Anillos PGP (solo pruebas). Por defecto, los fijados en la app (`catalogo/claves`). */
  anillos?: (fuente: FuenteFirma) => readonly ClavePublica[];
  /** Reloj para el vencimiento de firmas y claves (solo pruebas). */
  ahora?: () => Date;
}

/** Tamaño máximo de una firma separada (una real pesa menos de 1 KB). */
const MAX_FIRMA_BYTES = 64 * 1024;
/** Tamaño máximo de `SHASUMS256.txt` (el de Node pesa unos 4 KB). */
const MAX_SUMAS_BYTES = 512 * 1024;
/** Plazo para bajar una firma o una lista de sumas. */
const PLAZO_FIRMA_MS = 30_000;
/** Respuestas de "no existe": la fuente no publicó la firma. */
const NO_PUBLICADO = new Set([403, 404, 410]);

const MENSAJE_FIRMA: Record<FalloFirma['codigo'], string> = {
  'catalogo.firma_invalida': 'La firma PGP de la descarga no es válida',
  'catalogo.firma_no_soportada': 'La firma PGP de la descarga usa un formato no soportado',
  'catalogo.clave_desconocida': 'La firma PGP es de una clave que no está en el anillo fijado',
  'catalogo.firma_vencida': 'La firma PGP o su clave están vencidas',
};

/** Error con código de una firma que no pasó (con servicio y versión para el texto). */
function errorFirma(v: VersionDisponible, r: FalloFirma): ErrorWolf {
  return new ErrorWolf(
    r.codigo,
    `${MENSAJE_FIRMA[r.codigo]} (${v.servicio} ${v.version}): ${r.detalle.slice(0, 160)}`,
    { servicio: v.servicio, version: v.version },
  );
}

export interface OpcionesInstalar {
  /**
   * El usuario confirmó en un diálogo instalar sin huella fuerte (sin huella o solo MD5). Nunca
   * lo pasa un camino automático.
   */
  confirmarSinHuella?: true;
  /** Cancela la instalación (hoy solo la de Rust la usa para cortar rustup). */
  senal?: AbortSignal;
}

const MARCA = '.pel-version';

/** Rechaza versiones que no vienen del catálogo oficial o que escaparían de bin/<servicio>. */
export function validarVersion(v: VersionDisponible, clave: string): void {
  if (ejecutableDe(v.servicio) === undefined) {
    throw new Error(`Servicio no instalable: ${String(v.servicio)}`);
  }
  if (v.ejecutable !== undefined && !rutaRelativaSegura(v.ejecutable)) {
    throw new Error(`Ejecutable no válido: ${String(v.ejecutable)}`);
  }
  if (typeof v.url !== 'string' || !urlOficial(v.url)) {
    throw new Error('La descarga debe ser https y de un sitio oficial');
  }
  if (!claveValida(clave)) {
    throw new Error(`Versión no válida: ${String(clave)}`);
  }
}
const MSG_HASH = 'La descarga no coincide con la huella publicada';

/**
 * Huella con la que se verifica la descarga: la publicada; si no es fuerte y la lista fija tiene
 * esa misma versión con la misma URL, su SHA-256.
 */
function huellaParaInstalar(v: VersionDisponible): Huella | null {
  const propia = huellaDe(v);
  if (huellaFuerte(propia)) return propia;
  const tabla = catalogo as unknown as Record<
    string,
    { version: string; url: string; sha256?: string; sha512?: string }[] | undefined
  >;
  const fija = (Object.hasOwn(tabla, v.servicio) ? tabla[v.servicio] : undefined)?.find(
    (e) => e.version === v.version && e.url === v.url,
  );
  return fija ? huellaDeEntrada(fija) : propia;
}

export class Instalador {
  constructor(
    private readonly rutas: Rutas,
    private readonly eventos: Eventos<EventosNucleo>,
    private readonly f: typeof fetch = fetch,
    private readonly opciones: OpcionesInstalador = {},
  ) {}

  /** Carpeta de instalación: PHP usa la rama, el resto la versión completa. */
  private clave(v: Pick<VersionDisponible, 'servicio' | 'version' | 'rama'>): string {
    return v.servicio === 'php' ? (v.rama ?? v.version) : v.version;
  }

  private instaladorRust: InstaladorRust | null = null;

  /** Rust no es un zip: lo instala rustup dentro de la carpeta de datos (ver `InstaladorRust`). */
  private get rust(): InstaladorRust {
    this.instaladorRust ??= new InstaladorRust(
      this.rutas,
      this.eventos,
      this.opciones.exec ?? ejecutorPorDefecto,
      {
        f: this.f,
        ...(this.opciones.plataforma ? { plataforma: this.opciones.plataforma } : {}),
        ...(this.opciones.alAvisar ? { alAvisar: this.opciones.alAvisar } : {}),
      },
    );
    return this.instaladorRust;
  }

  async instalado(servicio: string, version: string): Promise<boolean> {
    if (servicio === 'rust') return (await this.rust.instalados()).includes(version);
    const exe = ejecutableDe(servicio);
    if (!exe) return false;
    return existsSync(path.join(this.rutas.bin(servicio, version), exe));
  }

  async instalados(servicio: string): Promise<string[]> {
    if (servicio === 'rust') return this.rust.instalados();
    const dir = path.dirname(this.rutas.bin(servicio, '_'));
    let nombres: string[];
    try {
      nombres = await readdir(dir);
    } catch {
      return [];
    }
    const res: string[] = [];
    for (const n of nombres) if (await this.instalado(servicio, n)) res.push(n);
    return res.sort();
  }

  /**
   * Versión instalada en `bin/<servicio>/<clave>`: la de la marca que deja la instalación (en PHP
   * la carpeta es la rama y la marca, el parche); sin marca, la clave.
   */
  async versionInstalada(servicio: string, clave: string): Promise<string> {
    if (!ejecutableDe(servicio) || !claveValida(clave)) return clave;
    const marca = await readFile(path.join(this.rutas.bin(servicio, clave), MARCA), 'utf8').catch(
      () => null,
    );
    const v = marca?.trim() ?? '';
    return claveValida(v) ? v : clave;
  }

  private enUso: ((servicio: string, version: string) => Promise<string | null>) | null = null;

  /**
   * Quién usa una versión de un servicio de datos (la instancia, o null). Lo conecta el núcleo
   * con `ServiciosDatos.versionEnUso`.
   */
  fijarVerificadorEnUso(fn: (servicio: string, version: string) => Promise<string | null>): void {
    this.enUso = fn;
  }

  private antesDeInstalar: ((servicio: string) => Promise<void>) | null = null;

  /**
   * Se llama antes de instalar una versión nueva (no si ya estaba instalada). El núcleo lo
   * conecta con `ServiciosDatos.prepararInstalacion`: un servicio de datos con su instancia
   * implícita la fija en config.json antes de que la versión nueva cambie cuál es "la activa".
   */
  fijarAntesDeInstalar(fn: (servicio: string) => Promise<void>): void {
    this.antesDeInstalar = fn;
  }

  /**
   * Quita solo los binarios de bin/<servicio>/<version>: nunca toca `data/`. Una versión que usa
   * alguna instancia se rechaza (`instalador.version_en_uso`).
   */
  async desinstalar(servicio: string, version: string): Promise<void> {
    if (!/^[\w.-]{1,64}$/.test(version) || version.includes('..')) {
      throw new ErrorWolf('catalogo.version_no_encontrada', `Versión no válida: ${version}`, {
        servicio,
        version,
      });
    }
    if (servicio === 'rust') {
      await this.rust.desinstalar(version);
      return;
    }
    const instancia = this.enUso ? await this.enUso(servicio, version) : null;
    if (instancia) {
      throw new ErrorWolf(
        'instalador.version_en_uso',
        `No se puede desinstalar ${servicio} ${version}: la usa la instancia ${instancia}.`,
        { servicio, version, instancia },
      );
    }
    await rm(this.rutas.bin(servicio, version), { recursive: true, force: true });
  }

  private emitir(
    v: VersionDisponible,
    fase: ProgresoInstalacion['fase'],
    porcentaje: number,
    mensaje?: string,
  ): void {
    this.eventos.emit('instalacion:progreso', {
      servicio: v.servicio,
      version: v.version,
      fase,
      porcentaje,
      ...(mensaje ? { mensaje } : {}),
    });
  }

  async instalar(v: VersionDisponible, o: OpcionesInstalar = {}): Promise<void> {
    const clave = this.clave(v);
    validarVersion(v, clave);
    if (v.servicio === 'rust')
      return this.rust.instalar(v.version, {
        ...(o.confirmarSinHuella ? { confirmarSinHuella: true as const } : {}),
        ...(o.senal ? { senal: o.senal } : {}),
      });
    const destino = this.rutas.bin(v.servicio, clave);
    if (await this.instalado(v.servicio, clave)) {
      // Idempotente, salvo que PHP traiga un parche distinto al instalado.
      const actual = await readFile(path.join(destino, MARCA), 'utf8').catch(() => null);
      if (v.servicio !== 'php' || actual === null || actual === v.version) {
        this.emitir(v, 'listo', 100);
        return;
      }
    }
    // Firma PGP (D10): si la fuente la publica, se baja y se comprueba lo que se pueda **antes**
    // de descargar el paquete. Falla cerrado: sin firma, o con una que no valida, no se instala
    // (la confirmación "sin huella" no lo salta).
    let huella = huellaParaInstalar(v);
    const fuenteFirma = fuenteFirmaDe(v);
    let firma: Uint8Array | null = null;
    if (fuenteFirma) {
      try {
        if (fuenteFirma === 'node') {
          huella = await this.huellaFirmadaNode(v, huella);
        } else {
          firma = await this.bajarPequeno(v, `${v.url}.asc`, MAX_FIRMA_BYTES, 'la firma');
          const previa = iniciarVerificacion({
            firma,
            anillo: this.anilloDe(fuenteFirma),
            ahora: this.ahora(),
          });
          if (esResultado(previa)) throw errorFirma(v, previa);
        }
      } catch (e) {
        this.emitir(v, 'error', 0, e instanceof Error ? e.message : String(e));
        throw e;
      }
    }
    // Antes de descargar nada: sin huella fuerte ni firma, solo con la confirmación del usuario.
    const verificable = huellaFuerte(huella) || firma !== null;
    if (verificable || o.confirmarSinHuella === true) {
      await this.antesDeInstalar?.(v.servicio);
    }
    if (!verificable && o.confirmarSinHuella !== true) {
      const e = huella
        ? new ErrorWolf(
            'catalogo.huella_debil',
            `${v.servicio} ${v.version} solo tiene una huella ${huella.algoritmo.toUpperCase()} (débil): hay que confirmar la instalación`,
            { servicio: v.servicio, version: v.version },
          )
        : new ErrorWolf(
            'catalogo.sin_huella',
            'No hay huella publicada para verificar la descarga',
            { servicio: v.servicio, version: v.version },
          );
      this.emitir(v, 'error', 0, e.message);
      throw e;
    }

    const exe = v.ejecutable ?? (ejecutableDe(v.servicio) as string);
    const id = `${v.servicio}-${v.version}-${randomBytes(4).toString('hex')}`;
    const tmp = this.rutas.tmp();
    const archivo = path.join(tmp, `${id}.${v.formato}`);
    const stage = path.join(tmp, id);
    const previo = path.join(tmp, `${id}-previo`);
    let reemplazado = false;
    let conservarPrevio = false;
    // Un antivirus suele tener abiertos un rato los archivos recién extraídos (EPERM/EBUSY al
    // mover la carpeta): se reintenta con espera creciente durante unos 30 s.
    const renombrarUna = this.opciones.renombrar ?? rename;
    const renombrar = (de: string, a: string): Promise<void> =>
      renombrarConReintentos(de, a, renombrarUna, INTENTOS_RENOMBRAR);
    try {
      await mkdir(tmp, { recursive: true });
      const hash = await this.descargar(v, archivo, huella?.algoritmo ?? 'sha256');
      this.emitir(v, 'verificando', 100);
      // Sin huella (confirmado por el usuario) no hay con qué comparar; con MD5 se compara igual.
      if (huella && hash !== huella.valor.toLowerCase()) {
        throw new ErrorWolf('catalogo.huella_no_coincide', MSG_HASH);
      }
      if (firma && fuenteFirma) await this.verificarArchivo(v, fuenteFirma, firma, archivo);

      this.emitir(v, 'extrayendo', 100);
      await mkdir(stage, { recursive: true });
      let origen = stage;
      if (v.formato === 'zip') {
        await extraerZip(archivo, stage);
        if (v.subcarpeta) origen = path.join(stage, v.subcarpeta);
      } else {
        // 'exe' y 'archivo': el archivo se copia tal cual con el nombre de `ejecutable`.
        await mkdir(path.dirname(path.join(stage, exe)), { recursive: true });
        await copyFile(archivo, path.join(stage, exe));
      }
      if (!(await stat(origen).catch(() => null))?.isDirectory()) {
        throw new Error('El paquete descargado no tiene la estructura esperada');
      }
      if (!existsSync(path.join(origen, exe))) {
        throw new Error(`El paquete descargado no contiene ${exe}`);
      }
      await writeFile(path.join(origen, MARCA), v.version);

      await mkdir(path.dirname(destino), { recursive: true });
      if (existsSync(destino)) {
        await renombrar(destino, previo);
        reemplazado = true;
      }
      try {
        await renombrar(origen, destino);
      } catch (e) {
        if (reemplazado) {
          const restaurado = await renombrar(previo, destino).then(
            () => true,
            () => false,
          );
          if (restaurado) reemplazado = false;
          else conservarPrevio = true;
          const detalle = e instanceof Error ? e.message : String(e);
          throw new Error(
            restaurado
              ? `No se pudo reemplazar ${v.servicio} ${clave}; se restauró la versión anterior: ${detalle}`
              : `No se pudo reemplazar ${v.servicio} ${clave} y tampoco restaurar la anterior (copia en ${previo}): ${detalle}`,
          );
        }
        if (await this.instalado(v.servicio, clave)) {
          this.emitir(v, 'listo', 100);
          return; // una instalación concurrente ganó
        }
        throw e;
      }
      this.emitir(v, 'listo', 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emitir(v, 'error', 0, msg);
      throw e;
    } finally {
      await rm(archivo, { force: true }).catch(() => undefined);
      await rm(stage, { recursive: true, force: true }).catch(() => undefined);
      if (reemplazado && !conservarPrevio)
        await rm(previo, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private anilloDe(fuente: FuenteFirma): readonly ClavePublica[] {
    return this.opciones.anillos ? this.opciones.anillos(fuente) : anilloFijado(fuente);
  }

  private ahora(): Date {
    return this.opciones.ahora ? this.opciones.ahora() : new Date();
  }

  /**
   * Baja un archivo pequeño de la fuente (firma o lista de sumas), con plazo, tamaño acotado y
   * cada redirección dentro de `HOSTS_PERMITIDOS`. Si la fuente responde que no existe, la firma
   * no está publicada: `catalogo.firma_invalida`.
   */
  private async bajarPequeno(
    v: VersionDisponible,
    url: string,
    maxBytes: number,
    que: string,
  ): Promise<Uint8Array> {
    const res = await pedirConSaltos(
      this.f,
      url,
      { signal: AbortSignal.timeout(PLAZO_FIRMA_MS) },
      urlOficial,
    );
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      if (NO_PUBLICADO.has(res.status)) {
        throw new ErrorWolf(
          'catalogo.firma_invalida',
          `La fuente no publicó ${que} de ${v.servicio} ${v.version}: no se instala sin verificarla`,
          { servicio: v.servicio, version: v.version },
        );
      }
      throw new Error(`No se pudo bajar ${que} de ${v.servicio} ${v.version} (HTTP ${res.status})`);
    }
    return leerAcotadoBytes(res, maxBytes);
  }

  /**
   * Node: `SHASUMS256.txt` firmado con `SHASUMS256.txt.sig`. La suma del zip sale de la lista
   * **después** de verificar la firma; si el catálogo traía otra, la descarga se rechaza.
   */
  private async huellaFirmadaNode(v: VersionDisponible, listada: Huella | null): Promise<Huella> {
    const base = new URL('.', v.url).toString();
    const sumas = await this.bajarPequeno(
      v,
      `${base}SHASUMS256.txt`,
      MAX_SUMAS_BYTES,
      'SHASUMS256.txt',
    );
    const firma = await this.bajarPequeno(
      v,
      `${base}SHASUMS256.txt.sig`,
      MAX_FIRMA_BYTES,
      'la firma',
    );
    const r = verificarFirmaSeparada({
      datos: sumas,
      firma,
      anillo: this.anilloDe('node'),
      ahora: this.ahora(),
    });
    if (!r.ok) throw errorFirma(v, r);
    const archivo = decodeURIComponent(new URL(v.url).pathname.split('/').pop() ?? '');
    const valor = sumaDe(Buffer.from(sumas).toString('utf8'), archivo);
    if (!valor) {
      throw new ErrorWolf(
        'catalogo.firma_invalida',
        `La lista firmada de ${v.servicio} ${v.version} no incluye ${archivo}`,
        { servicio: v.servicio, version: v.version },
      );
    }
    if (listada?.algoritmo === 'sha256' && listada.valor.toLowerCase() !== valor) {
      throw new ErrorWolf('catalogo.huella_no_coincide', MSG_HASH);
    }
    return { algoritmo: 'sha256', valor };
  }

  /** Verifica la firma separada sobre el archivo descargado, leyéndolo en trozos. */
  private async verificarArchivo(
    v: VersionDisponible,
    fuente: FuenteFirma,
    firma: Uint8Array,
    archivo: string,
  ): Promise<void> {
    const ver = iniciarVerificacion({ firma, anillo: this.anilloDe(fuente), ahora: this.ahora() });
    if (esResultado(ver)) throw errorFirma(v, ver);
    for await (const trozo of createReadStream(archivo)) ver.actualizar(trozo as Buffer);
    const r = ver.terminar();
    if (!r.ok) throw errorFirma(v, r);
  }

  /**
   * Descarga en streaming a `archivo` y devuelve la huella calculada con `algoritmo`. Los fallos pasajeros (red
   * cortada, sin datos, HTTP 408/429/5xx) se reintentan con espera creciente: si ya llegaron
   * bytes se pide el resto con `Range` y, si el servidor responde 206 desde ese byte, se sigue
   * (el hash continúa); si responde 200 se empieza de nuevo. La huella se verifica siempre al
   * final sobre el archivo completo.
   */
  private async descargar(
    v: VersionDisponible,
    archivo: string,
    algoritmo: AlgoritmoHuella,
  ): Promise<string> {
    const esperas = this.opciones.esperasReintentoMs ?? ESPERAS_REINTENTO_MS;
    const estado: EstadoDescarga = {
      algoritmo,
      hash: createHash(algoritmo),
      recibido: 0,
      total: 0,
      ultimo: 0,
    };
    const fh = await open(archivo, 'w');
    try {
      this.emitir(v, 'descargando', 0);
      for (let intento = 0; ; intento++) {
        try {
          await this.descargarIntento(v, fh, estado);
          return estado.hash.digest('hex');
        } catch (e) {
          if (!esPasajero(e) || intento >= esperas.length) throw e;
          await new Promise((r) => setTimeout(r, esperas[intento]));
        }
      }
    } finally {
      await fh.close();
    }
  }

  /** Un intento: desde cero o, si ya hay bytes, desde `estado.recibido` con `Range`. */
  private async descargarIntento(
    v: VersionDisponible,
    fh: FileHandle,
    estado: EstadoDescarga,
  ): Promise<void> {
    const limite = this.opciones.tiempoSinDatosMs ?? 60000;
    const ctl = new AbortController();
    // Un temporizador por llamada: uno compartido lo limpiaría el `finally` de la anterior.
    const conLimite = <T>(p: Promise<T>): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const temporizador = setTimeout(() => {
          const e = new ErrorPasajero(
            `La descarga se detuvo: sin datos durante ${Math.round(limite / 1000)} s`,
          );
          ctl.abort(e);
          reject(e);
        }, limite);
        p.then(resolve, reject).finally(() => clearTimeout(temporizador));
      });

    const desde = estado.recibido;
    // Redirecciones a mano: cada salto https y en HOSTS_PERMITIDOS, o se corta antes de pedirlo.
    const res = await conLimite(
      pedirConSaltos(
        this.f,
        v.url,
        {
          signal: ctl.signal,
          ...(desde > 0 ? { headers: { Range: `bytes=${desde}-` } } : {}),
        },
        urlOficial,
      ),
    );
    if (!res.ok || !res.body) {
      const msg = `No se pudo descargar ${v.servicio} ${v.version} (HTTP ${res.status})`;
      await res.body?.cancel().catch(() => undefined);
      throw ESTADOS_PASAJEROS.has(res.status) ? new ErrorPasajero(msg) : new Error(msg);
    }
    const inicioRango = /^bytes\s+(\d+)-/i.exec(res.headers.get('content-range') ?? '')?.[1];
    if (desde > 0 && !(res.status === 206 && Number(inicioRango) === desde)) {
      // El servidor no reanuda (o reanuda desde otro byte): se empieza de nuevo.
      estado.hash = createHash(estado.algoritmo);
      estado.recibido = 0;
      estado.ultimo = 0;
      await fh.truncate(0);
    }
    const largo = Number(res.headers.get('content-length') ?? 0);
    const totalRango = Number(/\/(\d+)\s*$/.exec(res.headers.get('content-range') ?? '')?.[1]);
    if (totalRango > 0) estado.total = totalRango;
    else if (largo > 0) estado.total = estado.recibido + largo;

    const lector = res.body.getReader();
    try {
      for (;;) {
        const { done, value: trozo } = await conLimite(lector.read());
        if (done) break;
        let escrito = 0;
        while (escrito < trozo.length) {
          const { bytesWritten } = await fh.write(
            trozo,
            escrito,
            trozo.length - escrito,
            estado.recibido + escrito,
          );
          escrito += bytesWritten;
        }
        estado.hash.update(trozo);
        estado.recibido += trozo.length;
        if (estado.total > 0) {
          const pct = Math.min(99, Math.floor((estado.recibido / estado.total) * 100));
          if (pct > estado.ultimo) {
            estado.ultimo = pct;
            this.emitir(v, 'descargando', pct);
          }
        }
      }
    } finally {
      await lector.cancel().catch(() => undefined);
    }
    if (estado.total > 0 && estado.recibido < estado.total) {
      throw new ErrorPasajero(
        `La descarga terminó incompleta (${estado.recibido} de ${estado.total} bytes)`,
      );
    }
  }
}

/** Esperas entre intentos (ms): 3 reintentos tras el primer intento. */
const ESPERAS_REINTENTO_MS = [2000, 5000, 15000];
/** Respuestas HTTP que vale la pena reintentar. */
const ESTADOS_PASAJEROS = new Set([408, 425, 429, 500, 502, 503, 504]);

class ErrorPasajero extends Error {}

interface EstadoDescarga {
  algoritmo: AlgoritmoHuella;
  hash: Hash;
  recibido: number;
  total: number;
  ultimo: number;
}

/** Fallos de red o de servidor que pueden pasar solos; la huella, una ruta o un 404, no. */
function esPasajero(e: unknown): boolean {
  if (e instanceof ErrorPasajero) return true;
  if (e instanceof TypeError) return true; // fetch failed, terminated (undici)
  const codigo = String((e as { code?: unknown; cause?: { code?: unknown } } | null)?.code ?? '');
  const causa = String((e as { cause?: { code?: unknown } } | null)?.cause?.code ?? '');
  return /^(ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|EAI_AGAIN|ENOTFOUND|UND_ERR_\w+)$/.test(
    codigo || causa,
  );
}
