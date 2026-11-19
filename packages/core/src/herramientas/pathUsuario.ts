import path from 'node:path';
import { PathUsuarioWindows } from '../plataforma/pathUsuarioWin';
import type { AccesoPathUsuario, Ejecutor } from '../plataforma/tipos';
import { ejecutorPorDefecto } from '../plataforma/win';
import type { Rutas } from '../rutas';

export { scriptEscribir, scriptLeer } from '../plataforma/pathUsuarioWin';

export const AVISO_TERMINAL_NUEVA = 'Abra una terminal nueva para ver el cambio.';

export interface DepsPathUsuario {
  rutas: Rutas;
  /** Acceso al PATH del usuario (`Plataforma.pathUsuario`). */
  acceso?: AccesoPathUsuario;
  /** Sin `acceso`: el de Windows con este ejecutor (compatibilidad con las pruebas anteriores). */
  exec?: Ejecutor;
  /** Sin `acceso`: subclave de HKCU con el valor Path (por defecto "Environment"). */
  subclave?: string;
}

const normalizar = (e: string): string =>
  e.trim().replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();

/** Archivo con el valor original del PATH del usuario, antes del primer cambio. */
export const respaldoPathUsuario = (rutas: Rutas): string =>
  path.join(rutas.base, 'etc', 'path-usuario.respaldo.txt');

/**
 * Agrega o quita tools/bin del PATH del USUARIO sin tocar las demás entradas. La lectura y la
 * escritura (con respaldo del valor original) son de la plataforma.
 */
export class PathUsuario {
  private readonly acceso: AccesoPathUsuario;
  constructor(private readonly d: DepsPathUsuario) {
    this.acceso =
      d.acceso ??
      new PathUsuarioWindows({
        exec: d.exec ?? ejecutorPorDefecto,
        ...(d.subclave ? { subclave: d.subclave } : {}),
        respaldo: respaldoPathUsuario(d.rutas),
      });
  }

  private entrada(): string {
    return this.d.rutas.herramientas('bin');
  }

  /** Valor actual tal cual ('' si el usuario no tiene Path); falla si no se puede leer. */
  async leer(): Promise<{ valor: string; tipo?: string }> {
    if (this.acceso.valorCrudo) return this.acceso.valorCrudo();
    return { valor: (await this.acceso.leer()).join(';') };
  }

  async estado(): Promise<boolean> {
    const mia = normalizar(this.entrada());
    return (await this.acceso.leer()).some((p) => normalizar(p) === mia);
  }

  async agregar(): Promise<{ aviso: string }> {
    const partes = await this.acceso.leer();
    if (!partes.some((p) => normalizar(p) === normalizar(this.entrada()))) {
      await this.acceso.escribir([...partes, this.entrada()]);
    }
    return { aviso: AVISO_TERMINAL_NUEVA };
  }

  async quitar(): Promise<{ aviso: string }> {
    const partes = await this.acceso.leer();
    const resto = partes.filter((p) => normalizar(p) !== normalizar(this.entrada()));
    if (resto.length !== partes.length) await this.acceso.escribir(resto);
    return { aviso: AVISO_TERMINAL_NUEVA };
  }
}
