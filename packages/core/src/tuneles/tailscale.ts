import { ErrorWolf } from '../errores';
import type { Ejecutor, PlataformaCompleta } from '../plataforma/tipos';
import type { Sitio } from '../tipos';
import { urlHttps } from './ngrok';
import {
  modoTailscaleDe,
  sinAnsi,
  type ContextoTunel,
  type LanzamientoTunel,
  type ProveedorTunel,
} from './proveedor';

/** Puerto HTTPS propio de WolfCore Dev (Funnel solo admite 443, 8443 y 10000): no pisa el 443 del usuario. */
export const PUERTO_TAILSCALE = 8443;

export interface DepsTailscale {
  plataforma: Pick<PlataformaCompleta, 'tailscale'>;
  ejecutor: Ejecutor;
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
  const r = o as { TCP?: unknown; Web?: unknown };
  const tcp = typeof r.TCP === 'object' && r.TCP !== null ? Object.keys(r.TCP) : [];
  const web = typeof r.Web === 'object' && r.Web !== null ? Object.keys(r.Web) : [];
  return tcp.includes(String(puerto)) || web.some((k) => k.endsWith(`:${puerto}`));
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

  async disponible(): Promise<{ ok: boolean; codigo?: string }> {
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
    if (estado.codigo === 0 && puertoEnUso(estado.stdout, PUERTO_TAILSCALE)) {
      throw new ErrorWolf(
        'tuneles.tailscale_puerto_ocupado',
        `Tailscale ya publica algo en el puerto ${PUERTO_TAILSCALE}.`,
        { puerto: PUERTO_TAILSCALE },
      );
    }
    return {
      comando: t.ruta,
      args: [modo, `--https=${PUERTO_TAILSCALE}`, `http://127.0.0.1:${c.puertoNginx}`],
      quitarEntorno: ['TS_', 'TAILSCALE_'],
    };
  }

  /** `https://<equipo>.<tailnet>.ts.net:8443` de la salida de `serve`/`funnel`. */
  url(_sitio: Sitio, texto: string): string | null {
    const m = /https:\/\/[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.ts\.net(?::\d+)?/.exec(sinAnsi(texto));
    return m ? urlHttps(m[0]) : null;
  }

  /** En primer plano: al terminar el proceso, Tailscale retira la publicación. Nada que borrar. */
  async cerrar(): Promise<void> {
    // Nada que borrar.
  }
}
