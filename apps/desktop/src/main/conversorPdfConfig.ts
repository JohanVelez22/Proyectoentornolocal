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

/**
 * Direcciones permitidas ahora mismo: una por impresión en curso. Varias impresiones a la vez
 * comparten la sesión y un solo filtro; cada una añade su archivo y lo quita al terminar.
 */
export interface RegistroPermitidos {
  /** Permite un archivo; devuelve cómo quitarlo (idempotente). */
  permitir(url: string): () => void;
  /** ¿Se deja cargar esta dirección? */
  permitida(url: string): boolean;
}

export function crearRegistroPermitidos(): RegistroPermitidos {
  const permitidas = new Map<string, number>();
  return {
    permitir(url) {
      permitidas.set(url, (permitidas.get(url) ?? 0) + 1);
      let quitada = false;
      return () => {
        if (quitada) return;
        quitada = true;
        const n = (permitidas.get(url) ?? 1) - 1;
        if (n <= 0) permitidas.delete(url);
        else permitidas.set(url, n);
      };
    },
    permitida(url) {
      return url.startsWith('data:') || permitidas.has(url);
    },
  };
}

interface SesionConFiltro {
  webRequest: {
    onBeforeRequest(f: (d: { url: string }, cb: (r: { cancel: boolean }) => void) => void): void;
  };
}

const instaladas = new WeakSet<object>();

/**
 * Registra UNA sola vez el filtro de la sesión (volver a registrarlo en cada impresión lo
 * reemplazaría mientras otra impresión sigue cargando). Idempotente por sesión.
 */
export function instalarFiltro(ses: SesionConFiltro, registro: RegistroPermitidos): void {
  if (instaladas.has(ses)) return;
  instaladas.add(ses);
  ses.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !registro.permitida(d.url) }));
}
