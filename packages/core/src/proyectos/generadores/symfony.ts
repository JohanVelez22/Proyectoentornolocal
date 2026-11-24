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
 * Symfony: `symfony/skeleton` (con `webapp` si se pide). El sitio usa el vhost de tipo `laravel`:
 * raíz en `public/`, solo `index.php` ejecuta PHP y los archivos ocultos se niegan, que es lo que
 * Symfony necesita; el tipo `personalizado` serviría la carpeta entera (config, src, var).
 * La conexión va en `.env.local`: el `.env` de Symfony se versiona y no debe llevar claves.
 */
export const generadorSymfony: Generador = {
  tipoSitio: 'laravel',
  dominio: dominioDe,
  motorPorDefecto: () => 'mysql',
  pasos(p: PedidoProyecto): PasoReceta[] {
    const base = argsBase(p, motorDelPedido(p, 'mysql'));
    return [
      paso('crear-desde-composer', 'Crear el proyecto Symfony (composer)', {
        paquete: 'symfony/skeleton',
        ...(p.opciones.symfonyWebapp ? { requerir: ['symfony/webapp-pack'] } : {}),
      }),
      ...(p.base
        ? [
            paso('env-crear', 'Crear .env.local con la conexión', {
              ...base,
              destino: '.env.local',
            }),
            paso('bd-crear', 'Crear la base de datos', base),
          ]
        : []),
      pasoSitio(p, generadorSymfony),
    ];
  },
};
