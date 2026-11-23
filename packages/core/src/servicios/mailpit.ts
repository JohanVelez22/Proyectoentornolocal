import { mkdir } from 'node:fs/promises';
import { ErrorWolf } from '../errores';
import path from 'node:path';
import type { DefProceso } from '../procesos/supervisor';
import { registrarDefinicion } from './datos';
import type { DefServicio } from './definicion';
import { nombreEjecutable } from '../plataforma/sistema';

const PUERTO_WEB = 8025;

export function defMailpit(): DefServicio {
  return {
    id: 'mailpit',
    nombre: 'Mailpit',
    categoria: 'herramienta',
    puertoPorDefecto: 1025,
    puertosExtra: [PUERTO_WEB],
    claveDatos: () => 'actual',
    multiInstancia: false,

    async inicializar(c) {
      await mkdir(c.datos, { recursive: true });
    },

    async proceso(c): Promise<DefProceso> {
      return {
        id: 'mailpit',
        comando: path.join(c.bin, nombreEjecutable('mailpit')),
        args: [
          '--smtp',
          `127.0.0.1:${c.puerto}`,
          '--listen',
          `127.0.0.1:${PUERTO_WEB}`,
          '--database',
          path.join(c.datos, 'mailpit.db'),
        ],
        cwd: c.bin,
        // La sonda usa la interfaz web.
        puerto: PUERTO_WEB,
        log: c.rutas.logs('mailpit.log'),
        reiniciar: false,
      };
    },
  };
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
