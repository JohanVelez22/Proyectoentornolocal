// Sin importaciones: tipos.ts (la configuración) lo usa y no debe formar un ciclo.

/** Tipos de aviso; cada uno se puede activar o desactivar en `Config.avisos.tipos`. */
export const TIPOS_AVISO = [
  'servicio-caido',
  'puerto-ocupado',
  'certificado-por-vencer',
  'tunel-caido',
  'proceso-error',
  'proceso-terminado',
  'receta-terminada',
  'doctor',
  'contenedor-detenido',
  'version-nueva',
  'salud-disco',
] as const;
export type TipoAviso = (typeof TIPOS_AVISO)[number];
