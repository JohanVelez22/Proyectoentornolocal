import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import type { Rutas } from '../rutas';

/** Id de un vhost auxiliar: letras, números, `_` y `-` (nombra su archivo). */
export const ID_VHOST_AUX = /^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$/;
/** Host que se reenvía: nombre DNS sencillo (nunca algo que cierre comillas o la directiva). */
const HOST_REENVIADO = /^[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/;

export interface OpcionesVhostProxy {
  /** Dirección de escucha: `127.0.0.1` (túneles) o la IP local elegida (red local, D25); nunca `0.0.0.0`. */
  escucha: string;
  puerto: number;
  /** Puerto de Nginx al que se reenvía (donde viven los sitios por `server_name`). */
  destino: number;
  /** `Host` con el que se reenvía: el dominio del sitio, para que Nginx elija su vhost. */
  host: string;
  /** Escuchar con TLS (red local con HTTPS): certificado y clave del sitio para la IP. */
  ssl?: { crt: string; key: string };
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
  // Rutas de los certificados: nunca algo que cierre las comillas o la directiva.
  const barras = (r: string): string => r.replaceAll('\\', '/');
  if (o.ssl && [o.ssl.crt, o.ssl.key].some((r) => /["\r\n;{}]/.test(barras(r)))) {
    throw new Error('Ruta del certificado del vhost auxiliar no válida');
  }
  return (
    [
      'server {',
      `    listen ${o.escucha}:${o.puerto}${o.ssl ? ' ssl' : ''};`,
      ...(o.ssl
        ? [
            `    ssl_certificate "${barras(o.ssl.crt)}";`,
            `    ssl_certificate_key "${barras(o.ssl.key)}";`,
            '    ssl_protocols TLSv1.2 TLSv1.3;',
          ]
        : []),
      '    server_name _;',
      '    client_max_body_size 64m;',
      '    location / {',
      `        proxy_pass http://127.0.0.1:${o.destino};`,
      `        proxy_set_header Host "${o.host}";`,
      '        proxy_set_header X-Forwarded-Host $http_host;',
      '        proxy_set_header X-Forwarded-For $remote_addr;',
      // Con TLS propio el sitio ve https (y no redirige en bucle); sin él, lo que ya traiga.
      o.ssl
        ? '        proxy_set_header X-Forwarded-Proto https;'
        : '        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;',
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

  /**
   * Escribe el vhost y recarga Nginx. Si Nginx lo rechaza vuelve a lo que había (el contenido
   * anterior, o nada si era nuevo) y el error sube.
   */
  agregar(id: string, contenido: string): Promise<void> {
    return this.serializar(async () => {
      const f = this.archivo(id);
      await mkdir(path.dirname(f), { recursive: true });
      const previo = await readFile(f, 'utf8').catch(() => null);
      await writeFile(f, contenido, 'utf8');
      try {
        await this.d.recargar();
      } catch (e) {
        if (previo === null) await rm(f, { force: true });
        else await writeFile(f, previo, 'utf8');
        throw e;
      }
    });
  }

  /**
   * Lo quita (idempotente) y, si existía, recarga Nginx. Un fallo al recargar no impide quitarlo.
   * Los de la red local (`lan-`) recargan siempre: un `server` que Nginx tenga cargado de una
   * sesión anterior quedaría abierto aunque el archivo ya no esté.
   */
  quitar(id: string): Promise<void> {
    return this.serializar(async () => {
      const f = this.archivo(id);
      const habia = (await this.ids()).includes(id);
      await rm(f, { force: true });
      if (habia || id.startsWith('lan-')) await this.d.recargar().catch(() => undefined);
    });
  }

  /**
   * Lo quita sin recargar ni pasar por la cola: para quien ya está dentro de una recarga o
   * generación de la configuración (quitar un `server` cuya IP ya no existe antes de probarla).
   */
  async quitarSinRecargar(id: string): Promise<void> {
    await rm(this.archivo(id), { force: true });
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
