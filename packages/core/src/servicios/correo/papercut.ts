import path from 'node:path';
import { nombreEjecutable } from '../../plataforma/sistema';
import { DIRECCION_LOCAL, type DefCaptador } from './tipos';

/**
 * Papercut SMTP Service (ChangemakerStudios/Papercut-SMTP, zip `Papercut.Smtp.Service.*-win-x64`):
 * consola con web integrada. Se configura con variables de entorno de .NET (`SmtpServer__IP`,
 * `SmtpServer__Port`, `Urls`, `AllowedHosts`), verificadas arrancando la 8.1.0. Además abre un
 * canal interno con la aplicación de escritorio en 127.0.0.1:37403 (solo local).
 */
export const DEF_PAPERCUT: DefCaptador = {
  id: 'papercut',
  nombre: 'Papercut SMTP',
  opcional: true,
  avisoMantenimiento: false,
  puertoSmtp: 2525,
  puertoWeb: 8028,
  ejecutable: nombreEjecutable('Papercut.Service'),
  args: () => [],
  env: (o) => ({
    SmtpServer__IP: DIRECCION_LOCAL,
    SmtpServer__Port: String(o.smtp),
    SmtpServer__MessagePath: path.join(o.datos, 'Incoming'),
    SmtpServer__LoggingPath: path.join(o.datos, 'Logs'),
    Urls: `http://${DIRECCION_LOCAL}:${o.web}`,
    AllowedHosts: `${DIRECCION_LOCAL};localhost`,
  }),
};
