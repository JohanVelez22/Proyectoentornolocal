const UTF8_ESTRICTO = new TextDecoder('utf-8', { fatal: true });
const CP1252 = new TextDecoder('windows-1252');

/**
 * Texto de una línea de log: UTF-8 y, si no es UTF-8 válido (un proceso de Windows que escribe
 * en la página de códigos ANSI, como Python sin PYTHONUTF8), Windows-1252. Así "migración" no
 * sale como "migraci\uFFFDn".
 */
export function decodificarLinea(b: Uint8Array): string {
  try {
    return UTF8_ESTRICTO.decode(b);
  } catch {
    return CP1252.decode(b);
  }
}
