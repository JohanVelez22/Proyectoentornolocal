import { mkdir, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const NOMBRE_CARPETA = 'WolfCoreDev';
export const NOMBRE_CARPETA_ANTERIOR = 'Proyectoentornolocal';

export function rutaBasePorDefecto(
  env: NodeJS.ProcessEnv = process.env,
  plataforma: NodeJS.Platform = process.platform,
): string {
  const nombre = NOMBRE_CARPETA;
  if (plataforma === 'win32') {
    const local =
      env.LOCALAPPDATA ?? path.win32.join(env.USERPROFILE ?? os.homedir(), 'AppData', 'Local');
    return path.win32.join(local, nombre);
  }
  if (plataforma === 'darwin') {
    return path.posix.join(os.homedir(), 'Library', 'Application Support', nombre);
  }
  const datos = env.XDG_DATA_HOME ?? path.posix.join(os.homedir(), '.local', 'share');
  return path.posix.join(datos, nombre);
}

/** "8.4.13" → "8.4"; si no tiene esa forma, la versión tal cual. */
export function claveMayorMenor(version: string): string {
  const m = /^(\d+)\.(\d+)/.exec(version);
  return m ? `${m[1]}.${m[2]}` : version;
}

/** "17.12" → "17"; si no empieza por un número, la versión tal cual. */
export function claveMayor(version: string): string {
  const m = /^(\d+)/.exec(version);
  return m ? m[1]! : version;
}

export class Rutas {
  constructor(readonly base: string) {}

  bin(servicio: string, version: string): string {
    return path.join(this.base, 'bin', servicio, version);
  }
  /**
   * Datos de un servicio: data/<servicio>/<clave>. La clave sale de `claveDatos(version)` (la
   * del DefServicio) o, por defecto, es "mayor.menor" de la versión instalada.
   */
  datos(servicio: string, version: string, claveDatos?: (version: string) => string): string {
    const clave = claveDatos ? claveDatos(version) : claveMayorMenor(version);
    if (!clave || clave === '.' || clave === '..' || /[\\/:]/.test(clave)) {
      throw new Error(`Clave de datos no válida: ${clave}`);
    }
    return path.join(this.base, 'data', servicio, clave);
  }
  /** Credenciales de los servicios propios (fuera de config.json). */
  credenciales(): string {
    return path.join(this.base, 'etc', 'credenciales.json');
  }
  nginxConf(): string {
    return path.join(this.base, 'etc', 'nginx', 'nginx.conf');
  }
  vhost(id: string): string {
    return path.join(this.base, 'etc', 'nginx', 'sites', `${id}.conf`);
  }
  caCrt(): string {
    return path.join(this.base, 'ca', 'wolfcore-dev-ca.crt');
  }
  caKey(): string {
    return path.join(this.base, 'ca', 'wolfcore-dev-ca.key');
  }
  certCrt(id: string): string {
    return path.join(this.base, 'certs', id + '.crt');
  }
  certKey(id: string): string {
    return path.join(this.base, 'certs', id + '.key');
  }
  phpIni(version: string): string {
    return path.join(this.base, 'etc', 'php', version, 'php.ini');
  }
  logs(...p: string[]): string {
    return path.join(this.base, 'logs', ...p);
  }
  estado(): string {
    return path.join(this.base, 'run', 'estado.json');
  }
  /** Estado persistido de la receta de un sitio: run/receta-<id>.json. */
  receta(sitioId: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(sitioId) || sitioId.includes('..')) {
      throw new Error(`Id de sitio no válido: ${sitioId}`);
    }
    return path.join(this.base, 'run', `receta-${sitioId}.json`);
  }
  config(): string {
    return path.join(this.base, 'config.json');
  }
  /** Herramientas propias: tools/<...>. Los shims viven en tools/bin. */
  herramientas(...p: string[]): string {
    return path.join(this.base, 'tools', ...p);
  }
  tmp(): string {
    return path.join(this.base, 'tmp');
  }

  /**
   * Borra de tmp/ lo que dejó una ejecución anterior interrumpida (cierre forzado, apagón):
   * carpetas importar-* y restaurar-* (pueden ser volcados de GB) y archivos lanzar-*.pid. Solo al
   * arrancar: la app es de instancia única, así que nada de eso está en uso.
   */
  async purgarTemporales(): Promise<void> {
    let nombres: string[];
    try {
      nombres = await readdir(this.tmp());
    } catch {
      return;
    }
    for (const n of nombres) {
      if (!/^(importar|restaurar)-/.test(n) && !/^lanzar-.*\.pid$/.test(n)) continue;
      await rm(path.join(this.tmp(), n), {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 200,
      }).catch(() => undefined);
    }
  }

  async asegurar(): Promise<void> {
    const dirs = [
      'bin',
      path.join('etc', 'nginx', 'sites'),
      path.join('etc', 'php'),
      path.join('logs', 'sitios'),
      path.join('logs', 'tuneles'),
      'run',
      'tmp',
    ];
    for (const d of dirs) await mkdir(path.join(this.base, d), { recursive: true });
  }
}
