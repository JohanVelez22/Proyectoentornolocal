import type { Sitio } from '../tipos';
import type { ContextoTunel, LanzamientoTunel, ProveedorTunel } from './proveedor';
import { extraerUrlTunel } from './url';

/** Túnel rápido de Cloudflare (trycloudflare.com): sin cuenta y con una URL nueva cada vez. */
export class CloudflareRapido implements ProveedorTunel {
  readonly id = 'cloudflare-rapido' as const;

  async disponible(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async abrir(sitio: Sitio, c: ContextoTunel): Promise<LanzamientoTunel> {
    return {
      comando: c.cloudflared,
      args: [
        'tunnel',
        '--no-autoupdate',
        '--url',
        `http://127.0.0.1:${c.puertoNginx}`,
        '--http-host-header',
        sitio.dominio,
        '--logfile',
        c.logCloudflared,
      ],
    };
  }

  url(_sitio: Sitio, texto: string): string | null {
    return extraerUrlTunel(texto);
  }

  async cerrar(): Promise<void> {
    // Nada temporal.
  }
}
