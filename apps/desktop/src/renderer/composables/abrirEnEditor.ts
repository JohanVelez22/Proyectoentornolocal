import { router } from '../router';
import { solicitudes } from './solicitudes';

/**
 * Punto de entrada del editor de código (D43) para otras pantallas, p. ej. Buscar (D44): abre la
 * herramienta Editor de código con ese archivo. La ruta tiene que haber salido de un diálogo
 * nativo (o de un resultado que el proceso principal registró como elegido): el proceso principal
 * rechaza cualquier otra, así que esta función no puede abrir rutas inventadas por el renderer.
 */
export function abrirEnEditor(ruta: string): void {
  solicitudes.archivoEditor = ruta;
  solicitudes.herramienta = 'editor';
  void router.push({ name: 'herramientas' });
}
