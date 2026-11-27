import { generadorCodeigniter3, generadorCodeigniter4 } from './codeigniter';
import type { Generador, TipoGenerador } from './comun';
import { generadorEstatico } from './estatico';
import { generadorFastapi } from './fastapi';
import { generadorLaravel } from './laravel';
import { generadorSymfony } from './symfony';
import { generadorWordpress } from './wordpress';

export { generadorBaseDe, generadorDePlantilla, pasosOmitidosDePlantilla } from './plantilla';
export {
  TIPOS_GENERADOR,
  VERSION_WORDPRESS,
  type Generador,
  type PedidoProyecto,
  type TipoGenerador,
} from './comun';

const GENERADORES: Record<TipoGenerador, Generador> = {
  laravel: generadorLaravel,
  codeigniter4: generadorCodeigniter4,
  codeigniter3: generadorCodeigniter3,
  symfony: generadorSymfony,
  fastapi: generadorFastapi,
  wordpress: generadorWordpress,
  estatico: generadorEstatico,
};

/** El generador de un tipo de proyecto nuevo. */
export function generador(tipo: TipoGenerador): Generador {
  return GENERADORES[tipo];
}
