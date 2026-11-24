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

const PAQUETE_KIT = {
  react: 'laravel/react-starter-kit',
  vue: 'laravel/vue-starter-kit',
  livewire: 'laravel/livewire-starter-kit',
} as const;

/** Laravel: `composer create-project`, `.env`, clave, base, migraciones y el sitio. */
export const generadorLaravel: Generador = {
  tipoSitio: 'laravel',
  dominio: dominioDe,
  motorPorDefecto: () => 'mysql',
  pasos(p: PedidoProyecto): PasoReceta[] {
    const kit = p.opciones.starterKit;
    const paquete = kit && kit !== 'ninguno' ? PAQUETE_KIT[kit] : 'laravel/laravel';
    const motor = motorDelPedido(p, 'mysql');
    const base = argsBase(p, motor);
    return [
      paso('crear-desde-composer', 'Crear el proyecto Laravel (composer)', { paquete }),
      paso('env-crear', 'Crear el archivo .env', base),
      paso('key-generate', 'Generar la clave de la aplicación'),
      ...(p.base ? [paso('bd-crear', 'Crear la base de datos', base)] : []),
      ...(p.base ? [paso('migrar', 'Migrar la base de datos')] : []),
      // Los starter kits traen la interfaz (Inertia o Livewire) y hay que compilarla.
      ...(paquete !== 'laravel/laravel'
        ? [
            paso('npm-ci', 'Instalar dependencias de Node (npm ci)'),
            paso('npm-build', 'Compilar recursos (npm run build)'),
          ]
        : []),
      pasoSitio(p, generadorLaravel),
    ];
  },
};
