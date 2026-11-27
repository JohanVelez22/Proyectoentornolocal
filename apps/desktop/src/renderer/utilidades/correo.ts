/** Lógica pura de la pantalla Correo (Mailpit): sin Vue ni IPC, para poder probarla sola. */

/** Puerto fijo del buzón web de Mailpit (igual que en el núcleo). */
export const PUERTO_BUZON = 8025;
export const URL_BUZON = `http://127.0.0.1:${PUERTO_BUZON}`;
export const PUERTO_SMTP_POR_DEFECTO = 1025;

/** Cada cuánto se cuentan los correos sin leer mientras la pantalla está visible. */
export const INTERVALO_NO_LEIDOS_MS = 15_000;

/** Bloque de correo para el .env de Laravel: SMTP local de Mailpit, sin usuario ni cifrado. */
export function bloqueEnvCorreo(puerto: number = PUERTO_SMTP_POR_DEFECTO): string {
  return [
    'MAIL_MAILER=smtp',
    'MAIL_HOST=127.0.0.1',
    `MAIL_PORT=${puerto}`,
    'MAIL_USERNAME=null',
    'MAIL_PASSWORD=null',
    'MAIL_ENCRYPTION=null',
  ].join('\n');
}
