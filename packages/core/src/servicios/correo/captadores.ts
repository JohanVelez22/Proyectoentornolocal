import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { DefProceso } from '../../procesos/supervisor';
import type { Config } from '../../tipos';
import type { DefServicio } from '../definicion';
import { registrarDefinicion } from '../datos';
import { DEF_INBUCKET } from './inbucket';
import { DEF_PAPERCUT } from './papercut';
import { DEF_SMTP4DEV } from './smtp4dev';
import {
  DIRECCION_LOCAL,
  GRUPO_CORREO,
  IDS_CAPTADOR,
  type CaptadorDescartado,
  type DefCaptador,
  type IdCaptador,
} from './tipos';

export * from './tipos';

/** Mailpit, la base: SMTP y web con `127.0.0.1` explícito y base en la carpeta de datos. */
export const DEF_MAILPIT: DefCaptador = {
  id: 'mailpit',
  nombre: 'Mailpit',
  opcional: false,
  avisoMantenimiento: false,
  puertoSmtp: 1025,
  puertoWeb: 8025,
  ejecutable: nombreEjecutable('mailpit'),
  args: (o) => [
    '--smtp',
    `${DIRECCION_LOCAL}:${o.smtp}`,
    '--listen',
    `${DIRECCION_LOCAL}:${o.web}`,
    '--database',
    path.join(o.datos, 'mailpit.db'),
  ],
};

export const CAPTADORES: Record<IdCaptador, DefCaptador> = {
  mailpit: DEF_MAILPIT,
  smtp4dev: DEF_SMTP4DEV,
  inbucket: DEF_INBUCKET,
  papercut: DEF_PAPERCUT,
};

/**
 * Captadores estudiados que no entran. Sin binario oficial de Windows con huella fuerte no se
 * descarga nada: la huella es lo único que une lo descargado con lo que publicó el autor.
 */
export const CAPTADORES_DESCARTADOS: readonly CaptadorDescartado[] = [
  {
    id: 'mailhog',
    nombre: 'MailHog',
    motivo:
      'Su última versión (1.0.1, 2020) publica los .exe sin huella: el asset no trae digest y la release no incluye archivo de sumas ni firma. Sin huella fuerte no se descarga; además casi no tiene mantenimiento.',
    fuente: 'https://github.com/mailhog/MailHog/releases',
  },
  {
    id: 'maildev',
    nombre: 'MailDev',
    motivo:
      'Solo se distribuye por npm, sin binario de Windows: instalarlo exigiría ejecutar npm y confiar en un grafo de dependencias sin una huella única que WolfCore Dev pueda fijar.',
    fuente: 'https://www.npmjs.com/package/maildev',
  },
  {
    id: 'mailcatcher',
    nombre: 'MailCatcher',
    motivo: 'Es una gema de Ruby: sin binario de Windows ni huella; exigiría instalar Ruby.',
    fuente: 'https://github.com/sj26/mailcatcher',
  },
];

export function esIdCaptador(id: unknown): id is IdCaptador {
  return typeof id === 'string' && (IDS_CAPTADOR as readonly string[]).includes(id);
}

/** Captador que reciben los proyectos (Mailpit si la configuración trae otra cosa). */
export function captadorElegido(cfg: Pick<Config, 'correo'>): IdCaptador {
  return esIdCaptador(cfg.correo?.captador) ? cfg.correo.captador : 'mailpit';
}

/** Puerto SMTP del captador elegido: el que escribe el bloque `MAIL_*` de los proyectos. */
export function puertoSmtpElegido(cfg: Pick<Config, 'correo' | 'servicios'>): number {
  return cfg.servicios.datos[captadorElegido(cfg)].puerto;
}

/** Todos los puertos propios de los captadores (web y extra), que ningún proyecto puede tomar. */
export function puertosFijosCaptadores(): number[] {
  return IDS_CAPTADOR.flatMap((id) => [
    CAPTADORES[id].puertoWeb,
    ...(CAPTADORES[id].puertosExtra ?? []),
  ]);
}

/** `DefServicio` de un captador: puerto SMTP configurable, web fija y solo local. */
export function defServicioCaptador(id: IdCaptador): DefServicio {
  const c = CAPTADORES[id];
  return {
    id,
    nombre: c.nombre,
    categoria: 'herramienta',
    puertoPorDefecto: c.puertoSmtp,
    puertosExtra: [c.puertoWeb, ...(c.puertosExtra ?? [])],
    grupoExclusivo: GRUPO_CORREO,
    claveDatos: () => 'actual',
    multiInstancia: false,

    async inicializar(ctx) {
      await mkdir(ctx.datos, { recursive: true });
      for (const carpeta of c.carpetas?.(ctx.datos) ?? [])
        await mkdir(carpeta, { recursive: true });
    },

    async proceso(ctx): Promise<DefProceso> {
      const o = { smtp: ctx.puerto, web: c.puertoWeb, datos: ctx.datos };
      const env = c.env?.({ ...o, bin: ctx.bin });
      return {
        id,
        comando: path.join(ctx.bin, c.ejecutable),
        args: c.args(o),
        cwd: c.cwd ? c.cwd({ bin: ctx.bin, datos: ctx.datos }) : ctx.bin,
        ...(env ? { env } : {}),
        // La sonda usa la interfaz web.
        puerto: c.puertoWeb,
        log: ctx.rutas.logs(`${id}.log`),
        reiniciar: false,
      };
    },
  };
}

for (const id of ['smtp4dev', 'inbucket', 'papercut'] as const) {
  registrarDefinicion(defServicioCaptador(id));
}
