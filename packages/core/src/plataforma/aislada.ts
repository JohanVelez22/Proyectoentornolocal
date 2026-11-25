import type { AccesoPathUsuario, ResultadoEscritura } from './tipos';

/** Lo que se bloquea con una carpeta de datos de prueba (`WOLFCORE_DATOS`). */
export const BLOQUEOS_AISLADO = [
  'escribirComoAdmin',
  'quitarSoloLecturaHosts',
  'instalarCertificadoUsuario',
  'quitarCertificadoUsuario',
  'variableUsuario',
  'pathUsuario.escribir',
  'detenerServicioSistema',
  'instalarVcRedist',
  'limpiarEntradaRustup',
] as const;

/**
 * Plataforma para una carpeta de datos de prueba (D26, `WOLFCORE_DATOS`): lee lo que quiera,
 * pero nunca escribe lo que es del equipo y no de esa carpeta: el archivo `hosts` (y cualquier
 * escritura elevada), el almacén de certificados, las variables y el PATH del usuario, los
 * servicios del sistema ni el registro de rustup. Cada intento devuelve `denegado` con un
 * detalle (o lanza, en el PATH) y se anota con `avisar`.
 */
export function aislarPlataforma<T extends object>(
  p: T,
  avisar: (que: string) => void = () => {},
): T {
  const negado = (que: string) => async (): Promise<ResultadoEscritura> => {
    avisar(que);
    return {
      ok: false,
      motivo: 'denegado',
      detalle: 'carpeta de datos de prueba (WOLFCORE_DATOS)',
    };
  };
  const reemplazos: Record<string, unknown> = {
    escribirComoAdmin: negado('escribirComoAdmin'),
    quitarSoloLecturaHosts: negado('quitarSoloLecturaHosts'),
    instalarCertificadoUsuario: negado('instalarCertificadoUsuario'),
    quitarCertificadoUsuario: negado('quitarCertificadoUsuario'),
    variableUsuario: negado('variableUsuario'),
    detenerServicioSistema: negado('detenerServicioSistema'),
    instalarVcRedist: negado('instalarVcRedist'),
    limpiarEntradaRustup: async (): Promise<'ausente'> => {
      avisar('limpiarEntradaRustup');
      return 'ausente';
    },
  };
  const original = (p as { pathUsuario?: (o?: { respaldo?: string }) => AccesoPathUsuario })
    .pathUsuario;
  if (typeof original === 'function') {
    reemplazos.pathUsuario = (o?: { respaldo?: string }): AccesoPathUsuario => {
      const acceso = original.call(p, o);
      return {
        leer: () => acceso.leer(),
        escribir: async () => {
          avisar('pathUsuario.escribir');
          throw new Error(
            'Con una carpeta de datos de prueba (WOLFCORE_DATOS) no se cambia el PATH del usuario.',
          );
        },
      };
    };
  }
  return new Proxy(p, {
    get(objetivo, clave) {
      if (typeof clave === 'string' && clave in reemplazos) {
        // Solo lo que la plataforma de verdad tiene (una parcial de pruebas sigue igual).
        if (clave === 'pathUsuario' || clave in objetivo) return reemplazos[clave];
      }
      const v = Reflect.get(objetivo, clave, objetivo) as unknown;
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(objetivo) : v;
    },
    has(objetivo, clave) {
      return Reflect.has(objetivo, clave);
    },
  });
}
