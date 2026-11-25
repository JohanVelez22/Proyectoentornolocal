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
  ) {}

  async noLeidos(): Promise<number> {
    let r;
    try {
      r = await this.peticion(`http://127.0.0.1:${this.puertoWeb}/api/v1/messages?limit=1`);
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
