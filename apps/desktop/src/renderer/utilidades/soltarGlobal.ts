/**
 * Soltar un archivo o una carpeta en cualquier parte de la aplicación abre «Info de archivo» (D55).
 *
 * El manejador es global (en `document`, fase de burbuja) y solo actúa si nadie más gestionó el
 * arrastre:
 * - el evento ya se canceló (`defaultPrevented`): una zona de arrastre propia lo atendió;
 * - el destino está dentro de un elemento con `data-zona-arrastre` (una zona que se declara así,
 *   p. ej. el editor de código, que lee los archivos de texto soltados);
 * - el destino es (o está dentro de) un `<input type="file">`, que ya acepta archivos soltados.
 * En esos casos solo se evita que la ventana navegue al archivo; no se abre nada.
 *
 * Solo se mira lo que lleva archivos (`Files`): arrastrar texto o seleccionar y mover una línea del
 * editor no se toca. Nada de esto lee el archivo: la ruta la saca el preload del propio `File` y la
 * valida el proceso principal.
 */

/** Atributo con el que una zona de arrastre propia se declara dueña de lo que se suelta en ella. */
export const ATRIBUTO_ZONA = 'data-zona-arrastre';

interface DatosArrastre {
  types?: ArrayLike<string>;
  files?: ArrayLike<File>;
  dropEffect?: string;
}

/** Evento de arrastre reducido a lo que se usa (así se prueba sin navegador). */
export interface EventoArrastre {
  type?: string;
  defaultPrevented: boolean;
  target: unknown;
  relatedTarget?: unknown;
  dataTransfer: DatosArrastre | null;
  preventDefault(): void;
}

/** ¿El arrastre lleva archivos o carpetas del sistema (y no solo texto)? */
export function llevaArchivos(dt: DatosArrastre | null | undefined): boolean {
  return !!dt?.types && Array.from(dt.types).includes('Files');
}

interface ConBusqueda {
  closest?: (selector: string) => unknown;
}

/** ¿Otro elemento de la ventana es el dueño de este arrastre? */
export function gestionadoPorOtro(e: Pick<EventoArrastre, 'defaultPrevented' | 'target'>): boolean {
  if (e.defaultPrevented) return true;
  const t = e.target as ConBusqueda | null;
  if (!t || typeof t.closest !== 'function') return false;
  return t.closest(`[${ATRIBUTO_ZONA}], input[type="file"]`) !== null;
}

export interface EscuchasArrastre {
  addEventListener(tipo: string, fn: (e: EventoArrastre) => void): void;
  removeEventListener(tipo: string, fn: (e: EventoArrastre) => void): void;
}

export interface OpcionesSoltarGlobal {
  /** El archivo o la carpeta soltado (solo el primero si se sueltan varios). */
  alSoltar(archivo: File): void;
  /** Hay un arrastre de archivos encima de la ventana que este manejador va a atender. */
  alCambiar?(activo: boolean): void;
}

/** Instala el manejador global; devuelve la función que lo quita. */
export function instalarSoltarGlobal(
  destino: EscuchasArrastre,
  o: OpcionesSoltarGlobal,
): () => void {
  const sobre = (e: EventoArrastre): void => {
    if (!llevaArchivos(e.dataTransfer)) return;
    if (gestionadoPorOtro(e)) {
      o.alCambiar?.(false);
      return;
    }
    // Sin cancelar el evento el navegador no permitiría soltar y navegaría al archivo.
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    o.alCambiar?.(true);
  };
  const salir = (e: EventoArrastre): void => {
    // Al salir de la ventana el destino nuevo es null; entre elementos de la página, no.
    if (e.relatedTarget === null || e.relatedTarget === undefined) o.alCambiar?.(false);
  };
  const soltar = (e: EventoArrastre): void => {
    o.alCambiar?.(false);
    if (!llevaArchivos(e.dataTransfer)) return;
    // Siempre se evita la navegación al archivo; solo se abre Info si nadie más lo atendió.
    const ajeno = gestionadoPorOtro(e);
    if (!e.defaultPrevented) e.preventDefault();
    if (ajeno) return;
    const archivo = e.dataTransfer?.files?.[0];
    if (archivo) o.alSoltar(archivo);
  };
  const pares: [string, (e: EventoArrastre) => void][] = [
    ['dragenter', sobre],
    ['dragover', sobre],
    ['dragleave', salir],
    ['drop', soltar],
  ];
  for (const [t, fn] of pares) destino.addEventListener(t, fn);
  return () => {
    for (const [t, fn] of pares) destino.removeEventListener(t, fn);
  };
}
