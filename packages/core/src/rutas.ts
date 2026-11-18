import { mkdir } from 'node:fs/promises';
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

export class Rutas {
  constructor(readonly base: string) {}

  bin(servicio: string, version: string): string {
    return path.join(this.base, 'bin', servicio, version);
  }
  /** Datos de un servicio: data/<servicio>/<mayor.menor> (la versión es la clave instalada). */
  datos(servicio: string, version: string): string {
    const m = /^(\d+)\.(\d+)/.exec(version);
    return path.join(this.base, 'data', servicio, m ? `${m[1]}.${m[2]}` : version);
  }
  nginxConf(): string {
    return path.join(this.base, 'etc', 'nginx', 'nginx.conf');
  }
  vhost(id: string): string {
    return path.join(this.base, 'etc', 'nginx', 'sites', `${id}.conf`);
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
  config(): string {
    return path.join(this.base, 'config.json');
  }
  tmp(): string {
    return path.join(this.base, 'tmp');
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
