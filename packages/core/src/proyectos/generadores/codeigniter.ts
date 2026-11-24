import type { PasoReceta } from '../config';
import {
  argsBase,
  dominioDe,
  motorDelPedido,
  paso,
  pasoSitio,
  type Generador,
  type PedidoProyecto,
} from './comun';

/**
 * CodeIgniter 4: `appstarter`, su `.env` (formato `database.default.*`), la base y el sitio. El
 * appstarter no trae migraciones: no se corre `spark migrate`.
 */
export const generadorCodeigniter4: Generador = {
  tipoSitio: 'codeigniter4',
  dominio: dominioDe,
  motorPorDefecto: () => 'mysql',
  pasos(p: PedidoProyecto): PasoReceta[] {
    const base = argsBase(p, motorDelPedido(p, 'mysql'));
    return [
      paso('crear-desde-composer', 'Crear el proyecto CodeIgniter 4 (composer)', {
        paquete: 'codeigniter4/appstarter',
      }),
      ...(p.base ? [paso('bd-crear', 'Crear la base de datos', { ...base, nueva: true })] : []),
      paso('env-crear', 'Crear el archivo .env', base),
      pasoSitio(p, generadorCodeigniter4),
    ];
  },
};

/**
 * CodeIgniter 3: `codeigniter/framework`. CI3 no lee `.env`: la conexión va en
 * `application/config/database.php`, con los valores como cadenas PHP literales (sin
 * interpretar escapes ni variables).
 */
export const generadorCodeigniter3: Generador = {
  tipoSitio: 'codeigniter3',
  dominio: dominioDe,
  motorPorDefecto: () => 'mysql',
  pasos(p: PedidoProyecto): PasoReceta[] {
    const base = argsBase(p, motorDelPedido(p, 'mysql'));
    return [
      paso('crear-desde-composer', 'Crear el proyecto CodeIgniter 3 (composer)', {
        paquete: 'codeigniter/framework',
      }),
      ...(p.base ? [paso('bd-crear', 'Crear la base de datos', { ...base, nueva: true })] : []),
      // Corre siempre: además de la conexión (si hay base) pone base_url y el entorno.
      paso('config-bd-crear', p.base ? 'Configurar CodeIgniter 3' : 'Configurar base_url', {
        ...base,
        marco: 'codeigniter3',
        ...(p.base ? {} : { sinBd: true }),
      }),
      pasoSitio(p, generadorCodeigniter3),
    ];
  },
};
