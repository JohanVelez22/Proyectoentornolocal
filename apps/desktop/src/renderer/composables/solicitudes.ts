import { reactive } from 'vue';

/**
 * Pedidos entre pantallas (la paleta de comandos, Inicio o Ajustes piden algo que hace otra
 * vista). Quien atiende el pedido lo vuelve a dejar en null/false; así funciona aunque la vista
 * se monte después de navegar.
 */
export const solicitudes = reactive({
  /** Herramienta que debe abrir la pantalla Herramientas (p. ej. 'puertos'). */
  herramienta: null as string | null,
  /** Abrir "Agregar proyecto" (en la pestaña de GitHub) en Proyectos. */
  agregarProyecto: false,
  /** Proyecto en el que "Traer cambios" debe correr (con sus pasos sugeridos). */
  traerCambios: null as string | null,
  /** Mostrar el asistente de primer uso. */
  asistente: false,
  /** Mostrar la paleta de comandos. */
  paleta: false,
});
