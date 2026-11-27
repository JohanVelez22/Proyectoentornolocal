import { detectarProyecto } from '../proyectos/detectar';
import type { TipoSitio } from '../tipos';

/** Lo que usa el formulario de sitios (la detección completa es `detectarProyecto`). */
export interface ProyectoDetectado {
  tipo: TipoSitio;
  php: string | null;
  sugerenciaDominio: string;
  urlBaseVar: string | null;
}

/** Detección para el formulario de sitios: reusa `detectarProyecto` y deja solo esos campos. */
export async function detectarSitio(carpeta: string): Promise<ProyectoDetectado> {
  const d = await detectarProyecto(carpeta);
  return {
    tipo: d.tipo,
    php: d.php,
    sugerenciaDominio: d.dominioSugerido,
    urlBaseVar: d.urlBaseVar,
  };
}
