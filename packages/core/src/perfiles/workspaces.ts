import { claveElemento, esCaptador } from '../workspaces/workspaces';
import { MAX_WORKSPACES, type Config, type ElementoWorkspace, type Workspace } from '../tipos';
import { leerWorkspacesPerfil } from './manifiesto';
import type { ResultadoImportarPerfil } from './tipos';

/** ¿Existe el elemento en la configuración **ya fusionada** (instancias creadas, sitios importados)? */
function existeEn(cfg: Config, e: ElementoWorkspace): boolean {
  if (e.tipo === 'servicio') return true; // si el servicio no está instalado, se ignora al encender
  if (e.tipo === 'instancia') {
    const i = e.id.indexOf('@');
    const servicio = e.id.slice(0, i) as keyof Config['servicios']['datos'];
    return cfg.servicios.datos[servicio]?.instancias?.[e.id.slice(i + 1)] !== undefined;
  }
  // Los procesos no viajan en un perfil (los comandos son de otro equipo): una referencia a uno,
  // de un perfil manipulado, se descarta.
  return false;
}

/**
 * Importa los workspaces de un perfil en `cfg` (ya fusionado con instancias y sitios). Un workspace
 * son referencias a instancias y servicios: se validan contra lo que existe en este equipo y lo que
 * no se descarta, sin cortar el resto. Nunca reemplaza uno propio (mismo id) ni arranca nada.
 */
export function importarWorkspaces(
  cfg: Config,
  brutos: readonly unknown[],
): Pick<ResultadoImportarPerfil, 'workspaces' | 'workspacesInvalidos'> {
  const { validos, invalidos } = leerWorkspacesPerfil(brutos);
  const res: ResultadoImportarPerfil['workspaces'] = [];
  for (const { workspace: w, descartados } of validos) {
    const motivos: string[] = Array.from({ length: descartados }, () => 'elemento_invalido');
    if (cfg.workspaces.some((x) => x.id === w.id)) {
      res.push({ id: w.id, nombre: w.nombre, estado: 'existente', descartados: motivos });
      continue;
    }
    let captador = false;
    const elementos = w.elementos.filter((e) => {
      // Dos captadores de correo a la vez no se pueden (grupo exclusivo): se queda con el primero.
      const sobra = esCaptador(e) && captador;
      if (!sobra && existeEn(cfg, e)) {
        captador ||= esCaptador(e);
        return true;
      }
      motivos.push(claveElemento(e));
      return false;
    });
    // Todo lo que llevaba ya no existe aquí: un workspace vacío no sirve de nada.
    if (w.elementos.length > 0 && elementos.length === 0) {
      res.push({ id: w.id, nombre: w.nombre, estado: 'omitido', descartados: motivos });
      continue;
    }
    if (cfg.workspaces.length >= MAX_WORKSPACES) {
      res.push({ id: w.id, nombre: w.nombre, estado: 'omitido', descartados: motivos });
      continue;
    }
    const limpio: Workspace = { ...w, elementos };
    cfg.workspaces.push(limpio);
    res.push({ id: w.id, nombre: w.nombre, estado: 'importado', descartados: motivos });
  }
  return { workspaces: res, workspacesInvalidos: invalidos };
}
