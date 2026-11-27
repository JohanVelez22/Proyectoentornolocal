import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { DefProceso } from '../../procesos/supervisor';
import type { Config } from '../../tipos';
import type { DefServicio } from '../definicion';
import { registrarDefinicion } from '../datos';
import { DEF_INBUCKET } from './inbucket';
import { DEF_PAPERCUT } from './papercut';
import { rutaSecretaDe, type Restringir } from './rutaSecreta';
import { DEF_SMTP4DEV } from './smtp4dev';
import {
  CONSERVAR_ENTORNO_CAPTADOR,
  DIRECCION_LOCAL,
  GRUPO_CORREO,
  IDS_CAPTADOR,
  PUERTO_SMTP_POR_DEFECTO,
  QUITAR_ENTORNO_CAPTADOR,
  type CaptadorDescartado,
  type DefCaptador,
  type EstadoCaptador,
  type IdCaptador,
} from './tipos';

export * from './tipos';
export * from './rutaSecreta';

/** Mailpit, la base: SMTP y web con `127.0.0.1` explícito y base en la carpeta de datos. */
export const DEF_MAILPIT: DefCaptador = {
  id: 'mailpit',
  nombre: 'Mailpit',
  opcional: false,
  avisoMantenimiento: false,
  puertoSmtp: PUERTO_SMTP_POR_DEFECTO,
  puertoWeb: 8025,
  // La raíz de Mailpit responde 404 con --webroot: nada delata la ruta (comprobado con la 1.34.0).
  rutaSecreta: true,
  ejecutable: nombreEjecutable('mailpit'),
  args: (o) => [
    '--smtp',
    `${DIRECCION_LOCAL}:${o.smtp}`,
    '--listen',
    `${DIRECCION_LOCAL}:${o.web}`,
    '--database',
    path.join(o.datos, 'mailpit.db'),
    '--webroot',
    o.ruta,
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

/**
 * Deja `id` como el captador elegido y como el único que arranca con la aplicación: la elección
 * sobrevive a un reinicio y dos captadores nunca se enciendan a la vez al arrancar.
 */
export function aplicarEleccionCaptador(cfg: Config, id: IdCaptador): void {
  cfg.correo.captador = id;
  for (const otro of IDS_CAPTADOR) cfg.servicios.datos[otro].autoIniciar = otro === id;
}

/** El estado de un captador para la pantalla Correo; `urlWeb` incluye la ruta secreta si la hay. */
export function estadoCaptador(
  c: DefCaptador,
  o: {
    instalado: boolean;
    /** Estado del proceso en el supervisor. */
    estado: string;
    elegido: boolean;
    puertoSmtp: number;
    ruta: string | null;
  },
): EstadoCaptador {
  return {
    id: c.id,
    nombre: c.nombre,
    opcional: c.opcional,
    avisoMantenimiento: c.avisoMantenimiento,
    instalado: o.instalado,
    encendido: o.estado === 'encendido' || o.estado === 'iniciando',
    elegido: o.elegido,
    puertoSmtp: o.puertoSmtp,
    puertoWeb: c.puertoWeb,
    urlWeb: `http://${DIRECCION_LOCAL}:${c.puertoWeb}/${o.ruta ? `${o.ruta}/` : ''}`,
  };
}

/** Puerto SMTP del captador elegido: el que escribe el bloque `MAIL_*` de los proyectos. */
export function puertoSmtpElegido(cfg: Pick<Config, 'correo' | 'servicios'>): number {
  return cfg.correo.puertoSmtp;
}

/** Todos los puertos propios de los captadores (web y extra), que ningún proyecto puede tomar. */
export function puertosFijosCaptadores(): number[] {
  return IDS_CAPTADOR.flatMap((id) => [
    CAPTADORES[id].puertoWeb,
    ...(CAPTADORES[id].puertosExtra ?? []),
  ]);
}

/** `DefServicio` de un captador: puerto SMTP configurable, web fija y solo local. */
export interface DepsCaptador {
  restringir?: Restringir;
}

export function defServicioCaptador(id: IdCaptador, deps: DepsCaptador = {}): DefServicio {
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
      const ruta = c.rutaSecreta ? await rutaSecretaDe(ctx.datos, deps.restringir) : '';
      const o = { smtp: ctx.puerto, web: c.puertoWeb, datos: ctx.datos, ruta };
      const env = c.env?.({ ...o, bin: ctx.bin });
      // Archivos que pesan más que el entorno: se reescriben en cada arranque.
      for (const f of c.archivos?.({ ...o, bin: ctx.bin }) ?? []) {
        await writeFile(path.join(ctx.bin, f.nombre), f.contenido, 'utf8');
      }
      return {
        id,
        comando: path.join(ctx.bin, c.ejecutable),
        args: c.args(o),
        cwd: c.cwd ? c.cwd({ bin: ctx.bin, datos: ctx.datos }) : ctx.bin,
        ...(env ? { env } : {}),
        quitarEntorno: QUITAR_ENTORNO_CAPTADOR,
        conservarEntorno: CONSERVAR_ENTORNO_CAPTADOR,
        // La sonda usa la interfaz web.
        puerto: c.puertoWeb,
        log: ctx.rutas.logs(`${id}.log`),
        reiniciar: false,
      };
    },
  };
}

/**
 * Registra los cuatro captadores con la restricción de permisos de la plataforma (para el archivo
 * de la ruta secreta). Sin ella, `defServicioCaptador(id)` usa los permisos de la carpeta.
 */
export function registrarCaptadores(deps: DepsCaptador = {}): void {
  for (const id of IDS_CAPTADOR) registrarDefinicion(defServicioCaptador(id, deps));
}

for (const id of ['smtp4dev', 'inbucket', 'papercut'] as const) {
  registrarDefinicion(defServicioCaptador(id));
}
