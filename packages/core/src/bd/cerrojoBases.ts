/**
 * Una operación a la vez por base (instancia + nombre): las instantáneas, "Restaurar aquí",
 * importar y borrar base comparten el mismo cerrojo para no pisarse.
 */
export class CerrojoBases {
  private readonly colas = new Map<string, Promise<unknown>>();

  async con<T>(instancia: string, base: string, fn: () => Promise<T>): Promise<T> {
    const clave = `${instancia}\u0000${base.toLowerCase()}`;
    const previa = this.colas.get(clave) ?? Promise.resolve();
    const esta = previa.then(fn, fn);
    const cola = esta.catch(() => undefined);
    this.colas.set(clave, cola);
    try {
      return await esta;
    } finally {
      if (this.colas.get(clave) === cola) this.colas.delete(clave);
    }
  }
}
