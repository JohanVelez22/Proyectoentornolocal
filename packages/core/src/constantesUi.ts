/**
 * Constantes de la interfaz que la ventana (renderer) usa como valor. Viven aparte de `tipos.ts`
 * porque éste importa los esquemas de todo el núcleo (SMTP con `node:net`, etc.) y la ventana no
 * puede cargar módulos de Node. Aquí no se importa nada.
 */

/** Idiomas de la interfaz. */
export const IDIOMAS_UI = ['es', 'en', 'pt', 'fr'] as const;
export type IdiomaUi = (typeof IDIOMAS_UI)[number];

/**
 * Atajo global que se propone al activar la captura (no se registra hasta que el usuario lo
 * activa). Ctrl+Alt+Mayús+S: tres modificadores, no choca con nada común y es válido.
 */
export const ATAJO_CAPTURA_POR_DEFECTO = 'Ctrl+Alt+Shift+S';
