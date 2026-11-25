import { ErrorWolf } from '../errores';
import type { Ejecutor, PlataformaCompleta } from '../plataforma/tipos';
import type { Sitio } from '../tipos';
import { generarVhostProxy, type VhostsAuxiliares } from '../nginx/auxiliares';
import { urlHttps } from './ngrok';
import {
  modoTailscaleDe,
  sinAnsi,
  type ContextoTunel,
  type LanzamientoTunel,
  type ProblemaTunel,
  type ProveedorTunel,
  type ResultadoDisponible,
} from './proveedor';

/** Puerto HTTPS propio de WolfCore Dev (Funnel solo admite 443, 8443 y 10000): no pisa el 443 del usuario. */
export const PUERTO_TAILSCALE = 8443;

export interface DepsTailscale {
  plataforma: Pick<PlataformaCompleta, 'tailscale'>;
  ejecutor: Ejecutor;
  /** Los vhosts propios de Nginx (el del túnel: un puerto que atiende cualquier Host). */
  vhosts: VhostsAuxiliares;
  puertoLibre: () => Promise<number>;
}

/** Id del vhost del túnel de un sitio (los de otras funciones, como la red local, no empiezan así). */
export const PREFIJO_VHOST_TUNEL = 'tunel-';
export const idVhostTunel = (sitioId: string): string => `${PREFIJO_VHOST_TUNEL}${sitioId}`;

/** Solo la página de habilitación de Tailscale (https, `login.tailscale.com`). */
export function enlaceHabilitar(texto: string): string | null {
  for (const m of sinAnsi(texto).matchAll(/https:\/\/[^\s"'<>]{1,500}/g)) {
    try {
      const u = new URL(m[0]);
      if (u.protocol === 'https:' && u.hostname === 'login.tailscale.com' && !u.username) {
        return u.toString();
      }
    } catch {
      // no es una URL
    }
  }
  return null;
}

/** ¿La configuración de Serve/Funnel que ya tiene el usuario usa ese puerto HTTPS? */
export function puertoEnUso(json: string, puerto: number): boolean {
  if (json.trim() === '') return false;
  let o: unknown;
  try {
    o = JSON.parse(json);
  } catch {
    // No se entiende lo que hay: ante la duda no se pisa.
    return true;
  }
  if (typeof o !== 'object' || o === null) return true;
  const claves = (v: unknown): string[] =>
    typeof v === 'object' && v !== null ? Object.keys(v) : [];
  const usa = (c: { TCP?: unknown; Web?: unknown }): boolean =>
    claves(c.TCP).includes(String(puerto)) || claves(c.Web).some((k) => k.endsWith(`:${puerto}`));
  const r = o as { TCP?: unknown; Web?: unknown; Foreground?: unknown };
  if (usa(r)) return true;
  // Lo publicado en primer plano (`serve` sin --bg) vive en `Foreground.<sesión>`.
  const fg = r.Foreground;
  if (typeof fg === 'object' && fg !== null) {
    for (const v of Object.values(fg)) {
      if (typeof v === 'object' && v !== null && usa(v as { TCP?: unknown; Web?: unknown })) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Tailscale Serve (solo la tailnet) y Funnel (internet).
 *
 * - **Instalación**: WolfCore Dev no instala Tailscale (es un servicio del sistema). Sin él,
 *   `tuneles.tailscale_no_instalado`; sin sesión iniciada, `tuneles.tailscale_sin_sesion`.
 * - **Credenciales**: ninguna en la app. Tailscale usa la sesión del propio equipo; no hay token
 *   que guardar ni pasar. Se quitan del entorno las variables `TS_*` y `TAILSCALE_*` heredadas
 *   (p. ej. `TS_SOCKET`, `TS_AUTHKEY`).
 * - **Sin tocar su configuración**: se lanza en primer plano (sin `--bg`): la configuración dura
 *   lo que dura el proceso (la documentación de `tailscale serve` dice que sin `--bg` hay que
 *   reiniciarla a mano tras reiniciar y que se cierra con Ctrl+C). Va en el puerto HTTPS 8443; si
 *   el usuario ya tiene algo ahí no se abre (nunca se usa `reset`, `off` ni `--yes`).
 * - **Serve ≠ Funnel**: Serve es solo para los equipos de la tailnet; Funnel, para todo internet.
 *   La confirmación lo dice. Por defecto, Serve.
 * - Tailscale reenvía el `Host` del nombre `.ts.net` (no tiene reescritura): Nginx atiende ese
 *   nombre con su sitio por defecto.
 */
export class Tailscale implements ProveedorTunel {
  readonly id = 'tailscale' as const;
  readonly sinCloudflared = true;

  constructor(private readonly d: DepsTailscale) {}

  async disponible(): Promise<ResultadoDisponible> {
    const t = await this.d.plataforma.tailscale();
    if (!t.ruta) return { ok: false, codigo: 'tuneles.tailscale_no_instalado' };
    if (!t.sesion) return { ok: false, codigo: 'tuneles.tailscale_sin_sesion' };
    return { ok: true };
  }

  async abrir(sitio: Sitio, c: ContextoTunel): Promise<LanzamientoTunel> {
    const t = await this.d.plataforma.tailscale();
    if (!t.ruta) {
      throw new ErrorWolf('tuneles.tailscale_no_instalado', 'Tailscale no está instalado.');
    }
    if (!t.sesion) {
      throw new ErrorWolf('tuneles.tailscale_sin_sesion', 'Inicie sesión en Tailscale.');
    }
    const modo = modoTailscaleDe(sitio.tunel);
    // Solo lectura: lo que el usuario ya publica con Tailscale no se toca.
    const estado = await this.d.ejecutor(t.ruta, ['serve', 'status', '--json'], {
      timeoutMs: 10_000,
      quitarEntorno: ['TS_', 'TAILSCALE_'],
    });
    // Sin poder leer lo que ya publica el usuario no se arriesga a pisarlo: falla cerrado.
    if (estado.codigo !== 0) {
      throw new ErrorWolf(
        'tuneles.tailscale_estado_ilegible',
        'No se pudo leer lo que Tailscale ya publica; no se abre nada.',
      );
    }
    if (puertoEnUso(estado.stdout, PUERTO_TAILSCALE)) {
      throw new ErrorWolf(
        'tuneles.tailscale_puerto_ocupado',
        `Tailscale ya publica algo en el puerto ${PUERTO_TAILSCALE}.`,
        { puerto: PUERTO_TAILSCALE },
      );
    }
    // El `Host` que llega por Tailscale es el `.ts.net` (no se puede reescribir) y caería en el
    // default_server de Nginx: un server propio del túnel atiende cualquier Host y reenvía a Nginx
    // con el del sitio.
    const puerto = await this.d.puertoLibre();
    await this.d.vhosts.agregar(
      idVhostTunel(sitio.id),
      generarVhostProxy({
        escucha: '127.0.0.1',
        puerto,
        destino: c.puertoNginx,
        host: sitio.dominio,
      }),
    );
    return {
      comando: t.ruta,
      args: [modo, `--https=${PUERTO_TAILSCALE}`, `http://127.0.0.1:${puerto}`],
      quitarEntorno: ['TS_', 'TAILSCALE_'],
    };
  }

  /** Funnel o Serve sin habilitar en la tailnet: Tailscale pide visitar su página y espera. */
  problema(_sitio: Sitio, texto: string): ProblemaTunel | null {
    const enlace = enlaceHabilitar(texto);
    return enlace && /not enabled|enable/i.test(texto)
      ? { codigo: 'tuneles.tailscale_no_habilitado', datos: { enlace } }
      : null;
  }

  /** `https://<equipo>.<tailnet>.ts.net:8443` de la salida de `serve`/`funnel`. */
  url(_sitio: Sitio, texto: string): string | null {
    const m = /https:\/\/[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.ts\.net(?::\d+)?/.exec(sinAnsi(texto));
    return m ? urlHttps(m[0]) : null;
  }

  /**
   * En primer plano, al terminar el proceso Tailscale retira la publicación; lo único propio que
   * queda es el server de Nginx, que se quita (y Nginx se recarga si existía).
   */
  async cerrar(sitioId: string): Promise<void> {
    await this.d.vhosts.quitar(idVhostTunel(sitioId));
  }

  /** Al arrancar: quita los servers de túnel que no tienen un túnel vivo (los de otras funciones no). */
  async barrerTemporales(vivos: ReadonlySet<string>): Promise<void> {
    await this.d.vhosts.barrer(PREFIJO_VHOST_TUNEL, new Set([...vivos].map(idVhostTunel)));
  }
}
