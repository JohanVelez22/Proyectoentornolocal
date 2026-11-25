import { useMessage } from 'naive-ui';
import type { Workspace } from '../../shared/api';
import { textos } from '../i18n';
import { useWorkspaces } from '../stores/workspaces';
import { resumirResultado } from '../utilidades/workspaces';
import { useAccion } from './useAccion';

/**
 * Enciende o apaga un workspace con el mensaje de siempre: "listo" si todo salió bien; si algo
 * falló, cuántos quedaron encendidos (el detalle de cada elemento queda en su tarjeta).
 */
export function useOperacionWorkspace() {
  const ws = useWorkspaces();
  const message = useMessage();
  const { ejecutar, ocupado } = useAccion();

  async function operar(w: Pick<Workspace, 'id' | 'nombre'>, accion: 'iniciar' | 'detener') {
    const t = textos.workspaces.resultado;
    const items = await ejecutar(`workspace-${w.id}`, () =>
      accion === 'iniciar' ? ws.iniciar(w.id) : ws.detener(w.id),
    );
    if (!items) return;
    const r = resumirResultado(items);
    if (r.fallidos.length === 0) {
      message.success(t.ok(w.nombre));
    } else if (accion === 'iniciar') {
      message.warning(t.parcial(w.nombre, r.encendidos.length, items.length), { duration: 8000 });
    } else {
      message.warning(t.parcialApagar(w.nombre, r.fallidos.length), { duration: 8000 });
    }
  }

  return { operar, ocupado: (id: string): boolean => ocupado(`workspace-${id}`) };
}
