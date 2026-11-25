import { ErrorWolf } from '../../errores';
import {
  auditar,
  type DepsAuditar,
  type OpcionesAuditar,
  type ProgresoAuditoria,
  type ResultadoAuditoria,
} from './auditar';
import {
  restablecer,
  vistaPreviaRestablecer,
  type DepsRestablecer,
  type OpcionesRestablecer,
  type OpcionesRestablecerClave,
  type ResultadoRestablecer,
  type VistaPreviaRestablecer,
} from './restablecer';

export type { FormatoHash } from './hashes';
export type {
  CuentaDebil,
  ModoConsulta,
  OpcionesAuditar,
  ProgresoAuditoria,
  ResultadoAuditoria,
} from './auditar';
export type {
  OpcionesRestablecer,
  OpcionesRestablecerClave,
  ResultadoRestablecer,
  VistaPreviaRestablecer,
} from './restablecer';
export type { ConsultaSql } from './tablas';
export { MAX_FILAS_AUDITORIA, PLAZO_AUDITORIA_MS } from './auditar';

/**
 * Auditoría de contraseñas de las bases propias (D20): revisa hashes contra una lista corta de
 * contraseñas muy comunes (sin decir cuál coincidió) y restablece una contraseña olvidada, con
 * instantánea y copia de la fila antes. No es un ataque: no hay fuerza bruta ni listas grandes.
 * Solo corre una auditoría a la vez.
 */
export class AuditoriaClaves {
  private actual: { control: AbortController; progreso: ProgresoAuditoria } | null = null;

  constructor(private readonly d: DepsAuditar & DepsRestablecer) {}

  async auditar(o: OpcionesAuditar, senal?: AbortSignal): Promise<ResultadoAuditoria> {
    if (this.actual) {
      throw new ErrorWolf(
        'auditoria.en_curso',
        'Ya hay una auditoría en curso: espere a que termine.',
      );
    }
    const control = new AbortController();
    const estado = { control, progreso: { revisadas: 0, total: 0 } };
    this.actual = estado;
    const alAbortar = (): void => control.abort();
    if (senal?.aborted) control.abort();
    else senal?.addEventListener('abort', alAbortar, { once: true });
    try {
      return await auditar(this.d, o, control.signal, (p) => {
        estado.progreso = p;
      });
    } finally {
      senal?.removeEventListener('abort', alAbortar);
      this.actual = null;
    }
  }

  /** Avance de la auditoría en curso, o null si no hay ninguna. */
  progreso(): ProgresoAuditoria | null {
    return this.actual ? { ...this.actual.progreso } : null;
  }

  /** Cancela la auditoría en curso; false si no había ninguna. */
  cancelar(): boolean {
    if (!this.actual) return false;
    this.actual.control.abort();
    return true;
  }

  vistaPreviaRestablecer(o: OpcionesRestablecer, aBcrypt = false): Promise<VistaPreviaRestablecer> {
    return vistaPreviaRestablecer(this.d, o, aBcrypt);
  }

  restablecer(o: OpcionesRestablecerClave): Promise<ResultadoRestablecer> {
    return restablecer(this.d, o);
  }
}
