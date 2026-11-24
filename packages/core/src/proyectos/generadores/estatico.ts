import type { PasoReceta } from '../config';
import { dominioDe, paso, pasoSitio, type Generador, type PedidoProyecto } from './comun';

/** Sitio estático: dos archivos de una plantilla interna y el sitio. No crea base. */
export const generadorEstatico: Generador = {
  tipoSitio: 'estatico',
  dominio: dominioDe,
  motorPorDefecto: () => null,
  pasos(p: PedidoProyecto): PasoReceta[] {
    return [
      paso('copiar-plantilla-interna', 'Crear los archivos del sitio', {
        plantilla: 'estatico',
        nombre: p.nombre,
      }),
      pasoSitio(p, generadorEstatico),
    ];
  },
};
