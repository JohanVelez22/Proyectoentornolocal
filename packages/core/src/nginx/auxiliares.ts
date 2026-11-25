import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import type { Rutas } from '../rutas';

/** Id de un vhost auxiliar: letras, números, `_` y `-` (nombra su archivo). */
export const ID_VHOST_AUX = /^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$/;
/** Host que se reenvía: nombre DNS sencillo (nunca algo que cierre comillas o la directiva). */
const HOST_REENVIADO = /^[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/;

export interface OpcionesVhostProxy {
  /** Dirección de escucha: `127.0.0.1` (túneles) o `0.0.0.0` (red local, D25). */
  escucha: string;
  puerto: number;
  /** Puerto de Nginx al que se reenvía (donde viven los sitios por `server_name`). */
  destino: number;
  /** `Host` con el que se reenvía: el dominio del sitio, para que Nginx elija su vhost. */
  host: string;
}

/** Un puerto libre de 127.0.0.1 (el sistema elige; otro programa podría tomarlo antes: raro). */
export function puertoLibreLocal(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const a = s.address();
      const puerto = typeof a === 'object' && a ? a.port : 0;
      s.close(() => (puerto ? resolve(puerto) : reject(new Error('Sin puerto libre'))));
    });
  });
}

const entero = (n: number): boolean => Number.isInteger(n) && n >= 1 && n <= 65535;

/**
 * Un `server` propio que atiende cualquier `Host` en su puerto (`server_name _`) y reenvía a
 * Nginx con el `Host` del sitio. Sirve a quien no puede reescribir el `Host` (Tailscale) o llega
 * con otro nombre (la red local con IP): no toca el vhost del sitio.
 */
export function generarVhostProxy(o: OpcionesVhostProxy): string {
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(o.escucha) || !entero(o.puerto) || !entero(o.destino)) {
    throw new Error('Vhost auxiliar no válido');
  }
  if (!HOST_REENVIADO.test(o.host)) throw new Error('Host del vhost auxiliar no válido');
  return (
    [
      'server {',
      `    listen ${o.escucha}:${o.puerto};`,
      '    server_name _;',
      '    client_max_body_size 64m;',
      '    location / {',
      `        proxy_pass http://127.0.0.1:${o.destino};`,
      `        proxy_set_header Host "${o.host}";`,
      '        proxy_set_header X-Forwarded-Host $http_host;',
      '        proxy_set_header X-Forwarded-For $remote_addr;',
      '        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;',
      '        proxy_http_version 1.1;',
      '        proxy_set_header Upgrade $http_upgrade;',
      '        proxy_set_header Connection "upgrade";',
      '    }',
      '}',
    ].join('\n') + '\n'
  );
}

export interface DepsVhostsAuxiliares {
  rutas: Rutas;
  /** Valida y recarga Nginx (no hace nada si está apagado); lanza si la configuración no vale. */
  recargar: () => Promise<void>;
}

/**
 * Vhosts propios de una función (túneles, red local) en `etc/nginx/extras/<id>.conf`, incluidos por
 * `nginx.conf` aparte de los de los sitios: guardar o aplicar sitios nunca los borra y, al estar
 * en disco, sobreviven a reiniciar la app (y a readoptar Nginx) hasta que quien los creó los quite.
 */
export class VhostsAuxiliares {
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsVhostsAuxiliares) {}

  private archivo(id: string): string {
    if (!ID_VHOST_AUX.test(id)) throw new Error('Id de vhost auxiliar no válido');
    return this.d.rutas.vhostAux(id);
  }

  private serializar<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.cola.then(fn, fn);
    this.cola = p.catch(() => undefined);
    return p;
  }

  /** Escribe el vhost y recarga Nginx; si Nginx lo rechaza, no queda nada y el error sube. */
  agregar(id: string, contenido: string): Promise<void> {
    return this.serializar(async () => {
      const f = this.archivo(id);
      await mkdir(path.dirname(f), { recursive: true });
      await writeFile(f, contenido, 'utf8');
      try {
        await this.d.recargar();
      } catch (e) {
        await rm(f, { force: true });
        throw e;
      }
    });
  }

  /** Lo quita (idempotente) y, si existía, recarga Nginx. Un fallo al recargar no impide quitarlo. */
  quitar(id: string): Promise<void> {
    return this.serializar(async () => {
      const f = this.archivo(id);
      const habia = (await this.ids()).includes(id);
      await rm(f, { force: true });
      if (habia) await this.d.recargar().catch(() => undefined);
    });
  }

  /** Ids presentes (con `prefijo` si se da). */
  async ids(prefijo = ''): Promise<string[]> {
    let n: string[];
    try {
      n = await readdir(path.dirname(this.d.rutas.vhostAux('x')));
    } catch {
      return [];
    }
    return n
      .filter((x) => x.endsWith('.conf'))
      .map((x) => x.slice(0, -5))
      .filter((x) => x.startsWith(prefijo) && ID_VHOST_AUX.test(x));
  }

  /** Quita los de `prefijo` que no estén en `conservar` (los que dejó una caída). */
  async barrer(prefijo: string, conservar: ReadonlySet<string>): Promise<void> {
    for (const id of await this.ids(prefijo)) {
      if (!conservar.has(id)) await this.quitar(id);
    }
  }
}
