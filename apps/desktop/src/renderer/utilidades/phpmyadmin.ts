import type { DisponibilidadPhpMyAdmin } from '../../shared/api';
import { textos } from '../i18n';

/**
 * Texto (en el idioma de la interfaz) de lo que le pasa a phpMyAdmin: falta una extensión de PHP,
 * no está instalado, no hay PHP encendido, o se usa un PHP fuera de lo que declara soportar.
 * null si está listo y sin avisos.
 */
export function textoPma(d: DisponibilidadPhpMyAdmin): string | null {
  const t = textos.servicios.phpmyadmin;
  if (d.disponible) return d.aviso === 'php_fuera_de_rango' ? t.phpFueraDeRango(d.rama) : null;
  if (d.causa === 'sin_extension')
    return t.faltaExtension((d.falta ?? []).join(', '), d.rama ?? '?');
  return d.causa === 'sin_instalar' ? t.instalarPrimero : t.encenderPhp;
}
