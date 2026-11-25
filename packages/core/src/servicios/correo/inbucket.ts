import path from 'node:path';
import { nombreEjecutable } from '../../plataforma/sistema';
import { DIRECCION_LOCAL, type DefCaptador } from './tipos';

/** Puerto POP3 de Inbucket (siempre abierto; aquí solo en loopback y fuera del rango de PHP). */
export const PUERTO_POP3_INBUCKET = 11100;

/**
 * Inbucket (inbucket/inbucket 3.x): se configura con variables `INBUCKET_*`. El almacenamiento
 * en archivos usa una ruta RELATIVA (`path:mail`, con la carpeta de datos como directorio de
 * trabajo): la opción es un mapa `clave:valor` y la unidad de una ruta de Windows (`C:\…`) la
 * rompe. No trae filtro de Host: su web acepta cualquier cabecera (se documenta en el informe).
 */
export const DEF_INBUCKET: DefCaptador = {
  id: 'inbucket',
  nombre: 'Inbucket',
  opcional: true,
  avisoMantenimiento: false,
  puertoSmtp: 2500,
  puertoWeb: 8027,
  puertosExtra: [PUERTO_POP3_INBUCKET],
  ejecutable: nombreEjecutable('inbucket'),
  args: () => [],
  cwd: ({ datos }) => datos,
  env: (o) => ({
    INBUCKET_SMTP_ADDR: `${DIRECCION_LOCAL}:${o.smtp}`,
    INBUCKET_WEB_ADDR: `${DIRECCION_LOCAL}:${o.web}`,
    INBUCKET_POP3_ADDR: `${DIRECCION_LOCAL}:${PUERTO_POP3_INBUCKET}`,
    INBUCKET_STORAGE_TYPE: 'file',
    INBUCKET_STORAGE_PARAMS: 'path:mail',
    INBUCKET_WEB_UIDIR: path.join(o.bin, 'ui', 'dist'),
    INBUCKET_WEB_GREETINGFILE: path.join(o.bin, 'ui', 'greeting.html'),
  }),
};
