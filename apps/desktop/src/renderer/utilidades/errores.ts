/** Traducción de los errores del núcleo en la interfaz (por código estable). */
import { textos, type Textos } from '../i18n';

/** Lo que llega del preload: un `Error` con `codigo` y `datos` opcionales. */
export interface ErrorIpc {
  message?: string;
  mensaje?: string;
  codigo?: string;
  datos?: Record<string, string | number>;
}

/**
 * Texto del error en el idioma activo. Con un código que la interfaz conoce se traduce y se
 * rellenan los `{parámetros}`; si el código es desconocido (o falta), se muestra el mensaje en
 * español del núcleo, que siempre acompaña al error.
 */
/**
 * Códigos de un permiso de administrador (UAC) que nadie contestó a tiempo: la ventana de Windows
 * puede seguir abierta (no se puede cerrar desde aquí) y, si se acepta más tarde, ya no hace nada.
 */
const CODIGOS_UAC_VENCIDO = new Set(['hosts.tiempo_agotado', 'discos.admin_tiempo']);

export function traducirError(e: ErrorIpc, t: Textos = textos): string {
  const texto = traducirErrorBase(e, t);
  return e.codigo !== undefined && CODIGOS_UAC_VENCIDO.has(e.codigo)
    ? `${texto} ${t.errores.uacHuerfano}`
    : texto;
}

function traducirErrorBase(e: ErrorIpc, t: Textos): string {
  const codigos = t.errores.codigos as Record<string, string | undefined>;
  const plantilla =
    e.codigo !== undefined && Object.hasOwn(codigos, e.codigo) ? codigos[e.codigo] : undefined;
  if (plantilla) {
    const detalles = t.errores.detalles as Record<string, string | undefined>;
    return plantilla.replace(/\{(\w+)\}/g, (marca, k: string) => {
      const v = e.datos?.[k];
      if (v === undefined) return marca;
      // Algunos detalles llegan como código (p. ej. `sintaxis.sobra_llave`): se traducen.
      const texto = String(v);
      return Object.hasOwn(detalles, texto) ? (detalles[texto] ?? texto) : texto;
    });
  }
  return e.message || e.mensaje || t.errores.desconocido;
}

/** Texto claro de cualquier cosa que se haya lanzado (nunca una traza). */
export function mensajeDeError(e: unknown, t: Textos = textos): string {
  if (typeof e === 'string' && e) return e;
  if (e !== null && typeof e === 'object') return traducirError(e as ErrorIpc, t);
  return t.errores.desconocido;
}
