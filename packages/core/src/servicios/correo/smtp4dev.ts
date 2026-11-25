import { nombreEjecutable } from '../../plataforma/sistema';
import { DIRECCION_LOCAL, type DefCaptador } from './tipos';

/**
 * smtp4dev (rnwood/smtp4dev): el binario `win-x64` trae su runtime. Opciones verificadas con la
 * 3.16.1: `--bindaddress` + `--allowremoteconnections-` fijan SMTP en loopback, `--urls` la web, y
 * `--imapport=`/`--pop3port=` vacíos apagan IMAP y POP3 (por defecto escucharían en 143 y 110).
 * `AllowedHosts` (filtro de Host de ASP.NET) rechaza con 400 un `Host` ajeno: protege la web de
 * un DNS rebinding.
 */
export const DEF_SMTP4DEV: DefCaptador = {
  id: 'smtp4dev',
  nombre: 'smtp4dev',
  opcional: false,
  avisoMantenimiento: false,
  puertoSmtp: 1026,
  puertoWeb: 8026,
  ejecutable: nombreEjecutable('Rnwood.Smtp4dev'),
  args: (o) => [
    `--smtpport=${o.smtp}`,
    `--bindaddress=${DIRECCION_LOCAL}`,
    '--allowremoteconnections-',
    `--urls=http://${DIRECCION_LOCAL}:${o.web}`,
    // La base y los ajustes viven en la carpeta de datos propia, nunca en %APPDATA%.
    `--baseappdatapath=${o.datos}`,
    '--db=smtp4dev.db',
    '--imapport=',
    '--pop3port=',
    '--nousersettings',
  ],
  env: () => ({ AllowedHosts: `${DIRECCION_LOCAL};localhost` }),
};
