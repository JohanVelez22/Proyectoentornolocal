/**
 * Configuración de la ventana oculta que imprime a PDF (D34). Va aparte, sin importar Electron,
 * para poder comprobarla en las pruebas: el HTML que se imprime es de un documento no confiable.
 */

/** Sin Node, sin JavaScript, con aislamiento y en una sesión propia que solo vive en memoria. */
export const PREFERENCIAS_IMPRESION = {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  javascript: false,
  webSecurity: true,
  allowRunningInsecureContent: false,
  // Sin `persist:` la sesión es temporal: no deja cookies ni caché.
  partition: 'wolfcore-conversor-pdf',
  spellcheck: false,
} as const;

/** ¿Se deja cargar esta dirección? Solo el archivo temporal que se imprime y `data:`. */
export function permitirSolicitud(url: string, archivoPermitido: string): boolean {
  return url === archivoPermitido || url.startsWith('data:');
}
