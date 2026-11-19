import type { Aviso } from '@pel/core';
import type { TextoAviso } from '../shared/textosAvisos';

/** Lo que se usa de `Notification` de Electron (se sustituye en las pruebas). */
export interface NotificacionNativa {
  show(): void;
  on(evento: 'click' | 'close', fn: () => void): unknown;
}

export interface DepsNotificador {
  /** `Notification.isSupported()`. */
  soportada: () => boolean;
  crear: (opciones: { title: string; body: string; silent: boolean }) => NotificacionNativa;
  /** ¿La ventana está visible y con el foco? Con foco no se notifica: el aviso ya se ve en la app. */
  ventanaConFoco: () => boolean;
  /** Preferencias del usuario: notificaciones nativas activadas y tipo activado. */
  permitida: (a: Aviso) => boolean;
  /** Clic en la notificación: enfoca la ventana y navega a la acción del aviso. */
  alClic: (a: Aviso) => void;
  ahora?: () => number;
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
    try {
      n = this.d.crear({ title: texto.titulo, body: texto.cuerpo, silent: a.nivel !== 'error' });
    } catch (e) {
      console.error('No se pudo crear la notificación:', e);
      return false;
    }
    this.vivas.add(n);
    n.on('click', () => {
      this.vivas.delete(n);
      this.d.alClic(a);
    });
    n.on('close', () => void this.vivas.delete(n));
    n.show();
    return true;
  }
}
