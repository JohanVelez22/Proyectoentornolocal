/**
 * Reparto de los eventos del núcleo en el preload: un único `ipcRenderer.on` por canal para
 * todas las suscripciones (uno por suscripción supera el límite de 10 oyentes de Electron y
 * llena la consola de `MaxListenersExceededWarning`). El oyente real se pone con la primera
 * suscripción y se quita con la última baja.
 */
export interface EmisorIpc {
  on(canal: string, oyente: (evento: unknown, mensaje: unknown) => void): unknown;
  removeListener(canal: string, oyente: (evento: unknown, mensaje: unknown) => void): unknown;
}

export interface BusEventos {
  /** Suscribe `fn` a `nombre`; devuelve la baja (solo quita a este suscriptor). */
  on(nombre: string, fn: (dato: never) => void): () => void;
}

export function crearBusEventos(
  ipc: EmisorIpc,
  canal: string,
  permitidos: readonly string[],
): BusEventos {
  // Cada suscripción es un objeto propio: la misma función puede suscribirse más de una vez.
  const suscriptores = new Map<string, Set<{ fn: (dato: never) => void }>>();
  let total = 0;

  const oyente = (_e: unknown, mensaje: unknown): void => {
    if (mensaje === null || typeof mensaje !== 'object') return;
    const { nombre, dato } = mensaje as { nombre?: unknown; dato?: unknown };
    if (typeof nombre !== 'string') return;
    const grupo = suscriptores.get(nombre);
    if (!grupo) return;
    for (const s of [...grupo]) {
      try {
        s.fn(dato as never);
      } catch {
        // Un suscriptor que falla no debe cortar el reparto a los demás.
      }
    }
  };

  return {
    on(nombre, fn) {
      if (!permitidos.includes(nombre)) return () => undefined;
      const s = { fn };
      let grupo = suscriptores.get(nombre);
      if (!grupo) suscriptores.set(nombre, (grupo = new Set()));
      grupo.add(s);
      if (++total === 1) ipc.on(canal, oyente);
      let activa = true;
      return () => {
        if (!activa) return;
        activa = false;
        grupo.delete(s);
        if (grupo.size === 0) suscriptores.delete(nombre);
        if (--total === 0) ipc.removeListener(canal, oyente);
      };
    },
  };
}
