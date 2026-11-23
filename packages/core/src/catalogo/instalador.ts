import { createHash, randomBytes, type Hash } from 'node:crypto';
import { existsSync } from 'node:fs';
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
import { catalogo, ejecutableDe, type VersionDisponible } from './catalogo';
import { claveValida, rutaRelativaSegura, urlOficial } from './comun';
import { huellaDe, huellaFuerte, type AlgoritmoHuella, type Huella } from './huellas';
import { pedirConSaltos } from './red';

export interface OpcionesInstalador {
  /** Corta la descarga si no llegan bytes durante este tiempo. Por defecto 60000. */
  tiempoSinDatosMs?: number;
  /** Esperas entre reintentos de descarga (ms); su largo es el número de reintentos. */
  esperasReintentoMs?: number[];
  /** Inyectable para pruebas. */
  renombrar?: (de: string, a: string) => Promise<void>;
}

export interface OpcionesInstalar {
  /**
   * El usuario confirmó en un diálogo instalar sin huella fuerte (sin huella o solo MD5). Nunca
   * lo pasa un camino automático.
   */
  confirmarSinHuella?: true;
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
  const tabla = catalogo as unknown as Record<string, typeof catalogo.nginx | undefined>;
  const fija = (Object.hasOwn(tabla, v.servicio) ? tabla[v.servicio] : undefined)?.find(
    (e) => e.version === v.version && e.url === v.url,
  );
  return fija ? { algoritmo: 'sha256', valor: fija.sha256 } : propia;
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

  async instalado(servicio: string, version: string): Promise<boolean> {
    const exe = ejecutableDe(servicio);
    if (!exe) return false;
    return existsSync(path.join(this.rutas.bin(servicio, version), exe));
  }

  async instalados(servicio: string): Promise<string[]> {
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

  async desinstalar(servicio: string, version: string): Promise<void> {
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
    const destino = this.rutas.bin(v.servicio, clave);
    if (await this.instalado(v.servicio, clave)) {
      // Idempotente, salvo que PHP traiga un parche distinto al instalado.
      const actual = await readFile(path.join(destino, MARCA), 'utf8').catch(() => null);
      if (v.servicio !== 'php' || actual === null || actual === v.version) {
        this.emitir(v, 'listo', 100);
        return;
      }
    }
    // Antes de descargar nada: sin huella fuerte, solo con la confirmación del usuario.
    const huella = huellaParaInstalar(v);
    if (!huellaFuerte(huella) && o.confirmarSinHuella !== true) {
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
    const renombrar = this.opciones.renombrar ?? rename;
    try {
      await mkdir(tmp, { recursive: true });
      const hash = await this.descargar(v, archivo, huella?.algoritmo ?? 'sha256');
      this.emitir(v, 'verificando', 100);
      // Sin huella (confirmado por el usuario) no hay con qué comparar; con MD5 se compara igual.
      if (huella && hash !== huella.valor.toLowerCase()) {
        throw new ErrorWolf('catalogo.huella_no_coincide', MSG_HASH);
      }

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
