/**
 * «Grabar pantalla» (D38a): no hay grabadora propia; se abre la nativa del sistema.
 *
 * En Windows es la Herramienta Recortes en modo grabación, con el protocolo `ms-screenclip` que
 * documenta Microsoft (Launch Snipping Tool): `capture/video` abre la superposición de grabación
 * (siempre en modo rectángulo). El URI es fijo y se abre solo desde el proceso principal: la
 * ventana no puede pedir otro. Sin `redirect-uri` Recortes no devuelve nada a la aplicación (no se
 * necesita: el video queda en la carpeta de Recortes del usuario). `user-agent` solo identifica
 * a la aplicación para los registros de Microsoft; no lleva datos del usuario.
 *
 * En macOS (Cmd+Shift+5) y en Linux no hay un URI equivalente: la ventana muestra una guía.
 */

import type { ResultadoGrabadora } from '../shared/api';

/** URI fijo y validado de la grabación de Recortes (Windows 11 con Recortes actualizado). */
export const URI_GRABACION_RECORTES =
  'ms-screenclip://capture/video?user-agent=WolfCoreDev&api-version=1.2';

/**
 * Abre la grabadora nativa. `abrir` es `shell.openExternal` (se inyecta para probarlo); solo se
 * llama con `URI_GRABACION_RECORTES` y solo en Windows. Cualquier fallo devuelve `abierta: false`.
 */
export async function abrirGrabadora(
  plataforma: string,
  abrir: (uri: string) => Promise<void>,
): Promise<ResultadoGrabadora> {
  if (plataforma !== 'win32') return { abierta: false };
  try {
    await abrir(URI_GRABACION_RECORTES);
    return { abierta: true };
  } catch {
    return { abierta: false };
  }
}
