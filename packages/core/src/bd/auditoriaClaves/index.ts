import {
  auditar,
  type DepsAuditar,
  type OpcionesAuditar,
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
export type { CuentaDebil, ModoConsulta, OpcionesAuditar, ResultadoAuditoria } from './auditar';
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
 */
export class AuditoriaClaves {
  constructor(private readonly d: DepsAuditar & DepsRestablecer) {}

  auditar(o: OpcionesAuditar, senal?: AbortSignal): Promise<ResultadoAuditoria> {
    return auditar(this.d, o, senal);
  }

  vistaPreviaRestablecer(
    o: OpcionesRestablecer,
    mantenerFormato = false,
  ): Promise<VistaPreviaRestablecer> {
    return vistaPreviaRestablecer(this.d, o, mantenerFormato);
  }

  restablecer(o: OpcionesRestablecerClave): Promise<ResultadoRestablecer> {
    return restablecer(this.d, o);
  }
}
