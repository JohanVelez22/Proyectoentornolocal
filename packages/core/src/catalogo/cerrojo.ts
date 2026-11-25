import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Cerrojo por servicio, compartido por quien toca `bin/<servicio>/…`: el instalador (mover una
 * versión a su sitio y desinstalar), el ciclo de vida de los servicios de datos (`enCola`,
 * `iniciar`…) y la limpieza de versiones. Una operación a la vez por servicio, en orden de llegada.
 *
 * Es reentrante por contexto asíncrono: una operación que ya tiene el cerrojo de un servicio y
 * vuelve a pedirlo (instalar una versión dentro de una actualización, por ejemplo) sigue de largo
 * en lugar de esperarse a sí misma.
 */
export class CerrojosServicio {
  private readonly colas = new Map<string, Promise<void>>();
  private readonly contexto = new AsyncLocalStorage<ReadonlySet<string>>();
  private normalizar: (servicio: string) => string = (s) => s;

  /**
   * Agrupa servicios que comparten cerrojo (los captadores de correo, de grupo exclusivo): lo
   * que devuelva es la clave real del cerrojo.
   */
  fijarNormalizador(fn: (servicio: string) => string): void {
    this.normalizar = fn;
  }

  /** Clave del cerrojo de un servicio. */
  clave(servicio: string): string {
    return this.normalizar(servicio);
  }

  /** Ejecuta `fn` con el cerrojo del servicio (esperando a las operaciones anteriores). */
  con<T>(servicio: string, fn: () => Promise<T>): Promise<T> {
    const clave = this.clave(servicio);
    const tenidos = this.contexto.getStore();
    if (tenidos?.has(clave)) return fn();
    const previa = this.colas.get(clave) ?? Promise.resolve();
    const nuevos = new Set([...(tenidos ?? []), clave]);
    const r = previa.then(() => this.contexto.run(nuevos, fn));
    this.colas.set(
      clave,
      r.then(
        () => undefined,
        () => undefined,
      ),
    );
    return r;
  }
}
