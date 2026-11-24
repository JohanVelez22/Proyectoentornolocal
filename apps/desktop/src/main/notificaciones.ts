import type { Aviso } from '@pel/core';
import type { TextoAviso } from '../shared/textosAvisos';

/** Lo que se usa de `Notification` de Electron (se sustituye en las pruebas). */
export interface NotificacionNativa {
  show(): void;
  on(evento: 'click' | 'close' | 'action', fn: () => void): unknown;
}

/** Botón de acción del toast (Electron lo muestra donde el sistema lo admite; si no, se ignora). */
export interface AccionNotificacion {
  type: 'button';
  text: string;
}

export interface DepsNotificador {
  /** `Notification.isSupported()`. */
  soportada: () => boolean;
  crear: (opciones: {
    title: string;
    body: string;
    silent: boolean;
    actions?: AccionNotificacion[];
  }) => NotificacionNativa;
  /** ¿La ventana está visible y con el foco? Con foco no se notifica: el aviso ya se ve en la app. */
  ventanaConFoco: () => boolean;
  /** Preferencias del usuario: notificaciones nativas activadas y tipo activado. */
  permitida: (a: Aviso) => boolean;
  /** Clic en la notificación: enfoca la ventana y navega a la acción del aviso. */
  alClic: (a: Aviso) => void;
  ahora?: () => number;
}

/** ¿El aviso ofrece el atajo "Actualizar"? (versión nueva con huella fuerte, Task 17). */
function conAtajoActualizar(a: Aviso): boolean {
  if (a.tipo !== 'version-nueva') return false;
  const x = Array.isArray(a.accion?.args) ? (a.accion.args[0] as { actualizar?: unknown }) : null;
  return x?.actualizar === true;
}

/** Máximo una notificación por tipo y fuente en esta ventana. */
export const VENTANA_NOTIFICACION_MS = 5 * 60_000;
/** Claves recordadas como máximo (evita crecer sin límite). */
const MAX_CLAVES = 500;

/**
 * Notificaciones nativas del sistema para los avisos. El texto lo arma quien llama (sin rutas ni
 * secretos); aquí solo se decide si se muestra y se limita la frecuencia.
 */
export class Notificador {
  private readonly ultima = new Map<string, number>();
  /** Referencias vivas: una notificación sin referencia puede recogerla el GC y perder el clic. */
  private readonly vivas = new Set<NotificacionNativa>();

  constructor(private readonly d: DepsNotificador) {}

  /** Devuelve true si se mostró una notificación. */
  mostrar(a: Aviso, texto: TextoAviso): boolean {
    if (!this.d.soportada() || !this.d.permitida(a) || this.d.ventanaConFoco()) return false;
    const ahora = (this.d.ahora ?? Date.now)();
    const clave = `${a.tipo}|${String(a.datos['fuente'] ?? '')}`;
    const previa = this.ultima.get(clave);
    if (previa !== undefined && ahora - previa < VENTANA_NOTIFICACION_MS) return false;
    this.ultima.delete(clave);
    this.ultima.set(clave, ahora);
    if (this.ultima.size > MAX_CLAVES) {
      const primera = this.ultima.keys().next().value;
      if (primera !== undefined) this.ultima.delete(primera);
    }
    let n: NotificacionNativa;
    // "Actualizar" solo en un aviso de versión nueva que lo ofrece (con huella fuerte); abre el
    // diálogo igual que el clic: nunca actualiza por sí mismo.
    const boton = texto.accion && conAtajoActualizar(a) ? texto.accion : null;
    try {
      n = this.d.crear({
        title: texto.titulo,
        body: texto.cuerpo,
        silent: a.nivel !== 'error',
        ...(boton ? { actions: [{ type: 'button' as const, text: boton }] } : {}),
      });
    } catch (e) {
      console.error('No se pudo crear la notificación:', e);
      return false;
    }
    this.vivas.add(n);
    const abrir = (): void => {
      this.vivas.delete(n);
      this.d.alClic(a);
    };
    n.on('click', abrir);
    if (boton) n.on('action', abrir);
    n.on('close', () => void this.vivas.delete(n));
    n.show();
    return true;
  }
}
