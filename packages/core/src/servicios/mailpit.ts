import { ErrorWolf } from '../errores';
import { registrarDefinicion } from './datos';
import type { DefServicio } from './definicion';
import { defServicioCaptador } from './correo/captadores';

const PUERTO_WEB = 8025;

export function defMailpit(): DefServicio {
  return defServicioCaptador('mailpit');
}

type Fetch = (url: string) => Promise<{ ok: boolean; status?: number; json(): Promise<unknown> }>;

/** Cliente mínimo de la API web de Mailpit. */
export class Mailpit {
  constructor(
    private readonly puertoWeb = PUERTO_WEB,
    private readonly peticion: Fetch = (u) => fetch(u),
    /** Ruta base secreta de la web (`--webroot`); null si no hay y la API cuelga de la raíz. */
    private readonly rutaBase: () => Promise<string | null> = async () => null,
  ) {}

  async noLeidos(): Promise<number> {
    let r;
    try {
      const ruta = await this.rutaBase();
      const base = `http://127.0.0.1:${this.puertoWeb}${ruta ? `/${ruta}` : ''}`;
      r = await this.peticion(`${base}/api/v1/messages?limit=1`);
    } catch {
      throw new ErrorWolf(
        'servicios.mailpit_no_responde',
        'Mailpit no responde. Inícielo desde Servicios.',
      );
    }
    if (!r.ok) throw new Error(`Mailpit respondió con un error (${r.status ?? 'desconocido'}).`);
    const datos = (await r.json()) as { unread?: unknown };
    return typeof datos.unread === 'number' ? datos.unread : 0;
  }
}

registrarDefinicion(defMailpit());
