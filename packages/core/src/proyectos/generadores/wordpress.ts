import type { PasoReceta } from '../config';
import {
  argsBase,
  dominioDe,
  motorDelPedido,
  paso,
  pasoSitio,
  VERSION_WORDPRESS,
  type Generador,
  type PedidoProyecto,
} from './comun';

/**
 * WordPress básico: `wordpress.org/wordpress-<v>.zip` con su `.sha1` (débil: pide la
 * confirmación de C), la base MySQL/MariaDB y `wp-config.php` con la conexión y sales nuevas.
 */
export const generadorWordpress: Generador = {
  tipoSitio: 'wordpress',
  dominio: dominioDe,
  motorPorDefecto: () => 'mysql',
  pasos(p: PedidoProyecto): PasoReceta[] {
    const base = argsBase(p, motorDelPedido(p, 'mysql'));
    return [
      paso('descargar-plantilla', 'Descargar WordPress', {
        servicio: 'wordpress',
        version: p.opciones.versionWordpress ?? VERSION_WORDPRESS,
        ...(p.opciones.confirmarHuellaDebil ? { confirmarHuellaDebil: true } : {}),
      }),
      ...(p.base
        ? [
            paso('bd-crear', 'Crear la base de datos', { ...base, nueva: true }),
            paso('config-bd-crear', 'Crear wp-config.php', { ...base, marco: 'wordpress' }),
          ]
        : []),
      pasoSitio(p, generadorWordpress),
    ];
  },
};
