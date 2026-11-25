import path from 'node:path';
import { nombreEjecutable } from '../../plataforma/sistema';
import { DIRECCION_LOCAL, PUERTO_SMTP_POR_DEFECTO, type DefCaptador } from './tipos';

/**
 * Papercut SMTP Service (ChangemakerStudios/Papercut-SMTP, zip `Papercut.Smtp.Service.*-win-x64`):
 * consola con web integrada. Se configura con variables de entorno de .NET (`SmtpServer__IP`,
 * `SmtpServer__Port`, `Urls`, `AllowedHosts`), verificadas arrancando la 8.1.0. Además abre un
 * canal interno con la aplicación de escritorio en 127.0.0.1:37403 (solo local).
 */
/** Puerto del canal interno de Papercut entre el servicio y su aplicación de escritorio. */
export const PUERTO_CANAL_PAPERCUT = 37403;

export const DEF_PAPERCUT: DefCaptador = {
  id: 'papercut',
  nombre: 'Papercut SMTP',
  opcional: true,
  avisoMantenimiento: false,
  puertoSmtp: PUERTO_SMTP_POR_DEFECTO,
  puertoWeb: 8028,
  ejecutable: nombreEjecutable('Papercut.Service'),
  // El canal interno con la aplicación de escritorio (fijo, solo loopback).
  puertosExtra: [PUERTO_CANAL_PAPERCUT],
  args: () => [],
  // Sus ajustes de usuario (`Papercut.SMTP.Service.Settings.json`, junto al ejecutable) pesan más
  // que el entorno y la web los reescribe: se fijan en cada arranque para que una opción cambiada
  // desde la web no deje de escuchar solo en 127.0.0.1.
  archivos: (o) => [
    {
      nombre: 'Papercut.SMTP.Service.Settings.json',
      contenido: JSON.stringify({ IP: DIRECCION_LOCAL, Port: String(o.smtp) }, null, 2),
    },
  ],
  env: (o) => ({
    SmtpServer__IP: DIRECCION_LOCAL,
    SmtpServer__Port: String(o.smtp),
    SmtpServer__MessagePath: path.join(o.datos, 'Incoming'),
    SmtpServer__LoggingPath: path.join(o.datos, 'Logs'),
    Urls: `http://${DIRECCION_LOCAL}:${o.web}`,
    AllowedHosts: `${DIRECCION_LOCAL};localhost`,
  }),
};
