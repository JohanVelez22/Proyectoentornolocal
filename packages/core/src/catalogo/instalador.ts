import { createHash, randomBytes } from 'node:crypto';
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
} from 'node:fs/promises';
import path from 'node:path';
import { extraerZip } from './zip';
import type { Eventos, EventosNucleo } from '../eventos';
import type { Rutas } from '../rutas';
import type { ProgresoInstalacion } from '../tipos';
import { urlOficial, type ServicioInstalable, type VersionDisponible } from './catalogo';

const EJECUTABLE: Record<ServicioInstalable, string> = {
  nginx: 'nginx.exe',
  php: 'php-cgi.exe',
  cloudflared: 'cloudflared.exe',
};
export interface OpcionesInstalador {
  /** Corta la descarga si no llegan bytes durante este tiempo. Por defecto 60000. */
  tiempoSinDatosMs?: number;
  /** Inyectable para pruebas. */
  renombrar?: (de: string, a: string) => Promise<void>;
}

const MARCA = '.pel-version';
/** Clave de carpeta: "8.4", "1.28.0", "2026.10.1"… nunca separadores ni "..". */
const CLAVE_VALIDA = /^\d+\.\d+(\.[\w.-]+)?$/;

/** Rechaza versiones que no vienen del catálogo oficial o que escaparían de bin/<servicio>. */
export function validarVersion(v: VersionDisponible, clave: string): void {
  if (!Object.hasOwn(EJECUTABLE, v.servicio)) {
    throw new Error(`Servicio no instalable: ${String(v.servicio)}`);
  }
  if (typeof v.url !== 'string' || !urlOficial(v.url)) {
    throw new Error('La descarga debe ser https y de un sitio oficial');
  }
  if (typeof clave !== 'string' || !CLAVE_VALIDA.test(clave) || clave.includes('..')) {
    throw new Error(`Versión no válida: ${String(clave)}`);
  }
}
const MSG_HASH = 'La descarga no coincide con la huella publicada';

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
    const exe = EJECUTABLE[servicio as ServicioInstalable];
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

  async instalar(v: VersionDisponible): Promise<void> {
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
    if (!v.sha256) {
      const msg = 'No hay huella publicada para verificar la descarga';
      this.emitir(v, 'error', 0, msg);
      throw new Error(msg);
    }

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
      const hash = await this.descargar(v, archivo);
      this.emitir(v, 'verificando', 100);
      if (hash !== v.sha256.toLowerCase()) throw new Error(MSG_HASH);

      this.emitir(v, 'extrayendo', 100);
      await mkdir(stage, { recursive: true });
      let origen = stage;
      if (v.formato === 'zip') {
        await extraerZip(archivo, stage);
        if (v.subcarpeta) origen = path.join(stage, v.subcarpeta);
      } else {
        await copyFile(archivo, path.join(stage, EJECUTABLE[v.servicio]));
      }
      if (!(await stat(origen).catch(() => null))?.isDirectory()) {
        throw new Error('El paquete descargado no tiene la estructura esperada');
      }
      if (!existsSync(path.join(origen, EJECUTABLE[v.servicio]))) {
        throw new Error(`El paquete descargado no contiene ${EJECUTABLE[v.servicio]}`);
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

  /** Descarga en streaming a `archivo` y devuelve el sha256 calculado. */
  private async descargar(v: VersionDisponible, archivo: string): Promise<string> {
    const limite = this.opciones.tiempoSinDatosMs ?? 60000;
    const ctl = new AbortController();
    let temporizador: NodeJS.Timeout | undefined;
    const conLimite = <T>(p: Promise<T>): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        temporizador = setTimeout(() => {
          const e = new Error(
            `La descarga se detuvo: sin datos durante ${Math.round(limite / 1000)} s`,
          );
          ctl.abort(e);
          reject(e);
        }, limite);
        p.then(resolve, reject).finally(() => clearTimeout(temporizador));
      });

    const res = await conLimite(this.f(v.url, { signal: ctl.signal }));
    if (!res.ok || !res.body) {
      throw new Error(`No se pudo descargar ${v.servicio} ${v.version} (HTTP ${res.status})`);
    }
    const total = Number(res.headers.get('content-length') ?? 0);
    const hash = createHash('sha256');
    const fh = await open(archivo, 'w');
    const lector = res.body.getReader();
    let recibido = 0;
    let ultimo = 0;
    try {
      this.emitir(v, 'descargando', 0);
      for (;;) {
        const { done, value: trozo } = await conLimite(lector.read());
        if (done) break;
        hash.update(trozo);
        let desde = 0;
        while (desde < trozo.length) {
          const { bytesWritten } = await fh.write(trozo, desde, trozo.length - desde);
          desde += bytesWritten;
        }
        recibido += trozo.length;
        if (total > 0) {
          const pct = Math.min(99, Math.floor((recibido / total) * 100));
          if (pct > ultimo) {
            ultimo = pct;
            this.emitir(v, 'descargando', pct);
          }
        }
      }
    } finally {
      await lector.cancel().catch(() => undefined);
      await fh.close();
    }
    return hash.digest('hex');
  }
}
