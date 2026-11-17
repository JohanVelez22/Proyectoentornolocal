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
import extract from 'extract-zip';
import type { Eventos, EventosNucleo } from '../eventos';
import type { Rutas } from '../rutas';
import type { ProgresoInstalacion } from '../tipos';
import type { ServicioInstalable, VersionDisponible } from './catalogo';

const EJECUTABLE: Record<ServicioInstalable, string> = {
  nginx: 'nginx.exe',
  php: 'php-cgi.exe',
  cloudflared: 'cloudflared.exe',
};
const MARCA = '.pel-version';
const MSG_HASH = 'La descarga no coincide con la huella publicada';

export class Instalador {
  constructor(
    private readonly rutas: Rutas,
    private readonly eventos: Eventos<EventosNucleo>,
    private readonly f: typeof fetch = fetch,
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
    try {
      await mkdir(tmp, { recursive: true });
      const hash = await this.descargar(v, archivo);
      this.emitir(v, 'verificando', 100);
      if (hash !== v.sha256.toLowerCase()) throw new Error(MSG_HASH);

      this.emitir(v, 'extrayendo', 100);
      await mkdir(stage, { recursive: true });
      let origen = stage;
      if (v.formato === 'zip') {
        await extract(archivo, { dir: stage });
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
        await rename(destino, previo);
        reemplazado = true;
      }
      try {
        await rename(origen, destino);
      } catch (e) {
        if (reemplazado) await rename(previo, destino).catch(() => undefined);
        reemplazado = false;
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
      if (reemplazado) await rm(previo, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  /** Descarga en streaming a `archivo` y devuelve el sha256 calculado. */
  private async descargar(v: VersionDisponible, archivo: string): Promise<string> {
    const res = await this.f(v.url);
    if (!res.ok || !res.body) {
      throw new Error(`No se pudo descargar ${v.servicio} ${v.version} (HTTP ${res.status})`);
    }
    const total = Number(res.headers.get('content-length') ?? 0);
    const hash = createHash('sha256');
    const fh = await open(archivo, 'w');
    let recibido = 0;
    let ultimo = 0;
    try {
      this.emitir(v, 'descargando', 0);
      for await (const trozo of res.body as unknown as AsyncIterable<Uint8Array>) {
        hash.update(trozo);
        await fh.write(trozo);
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
      await fh.close();
    }
    return hash.digest('hex');
  }
}
