import { useDialog } from 'naive-ui';
import type { Sitio } from '../../shared/api';
import { api } from '../api';
import { textos } from '../i18n';
import { requiereConfirmacion } from '../utilidades/sitios';
import { useAccion } from './useAccion';

/**
 * Acciones de túnel compartidas por el interruptor de cada sitio y la vista Túneles. El estado
 * llega por el evento `tunel:estado`; aquí solo se marca qué acción está en curso.
 */
export function useTunel() {
  const dialog = useDialog();
  const { ejecutar, ocupado } = useAccion();
  const t = textos.tunel;

  /** Con datos reales se pide confirmación antes de publicar. Devuelve false si se cancela. */
  function confirmarPublicar(sitio: Pick<Sitio, 'datosReales'>): Promise<boolean> {
    if (!requiereConfirmacion(sitio)) return Promise.resolve(true);
    return new Promise((resolve) => {
      let respondido = false;
      const responder = (v: boolean): void => {
        if (respondido) return;
        respondido = true;
        resolve(v);
      };
      dialog.warning({
        title: t.confirmarTitulo,
        content: t.confirmarTexto,
        positiveText: t.confirmar,
        negativeText: textos.acciones.cancelar,
        autoFocus: false,
        onPositiveClick: () => responder(true),
        onNegativeClick: () => responder(false),
        onClose: () => responder(false),
        onMaskClick: () => responder(false),
        onAfterLeave: () => responder(false),
      });
    });
  }

  async function abrir(sitio: Pick<Sitio, 'id' | 'datosReales'>): Promise<void> {
    if (!(await confirmarPublicar(sitio))) return;
    await ejecutar(`abrir-${sitio.id}`, () => api().tuneles.abrir(sitio.id), {
      tituloError: t.tituloError,
    });
  }

  async function cerrar(sitioId: string): Promise<void> {
    await ejecutar(`cerrar-${sitioId}`, () => api().tuneles.cerrar(sitioId));
  }

  /** Renovar publica un enlace nuevo: con datos reales se confirma igual que al abrir. */
  async function renovar(sitio: Pick<Sitio, 'id' | 'datosReales'>): Promise<void> {
    if (!(await confirmarPublicar(sitio))) return;
    const sitioId = sitio.id;
    await ejecutar(`renovar-${sitioId}`, () => api().tuneles.renovar(sitioId), {
      tituloError: t.tituloError,
    });
  }

  function abrirUrl(url: string): void {
    void ejecutar(`url-${url}`, () => api().sistema.abrirUrl(url));
  }

  function copiar(url: string): void {
    void ejecutar(`copiar-${url}`, () => api().sistema.copiar(url), {
      exito: textos.acciones.copiado,
    });
  }

  /** Cualquier acción en curso sobre el túnel del sitio. */
  const trabajando = (sitioId: string): boolean =>
    ocupado(`abrir-${sitioId}`) || ocupado(`cerrar-${sitioId}`) || ocupado(`renovar-${sitioId}`);

  return { abrir, cerrar, renovar, abrirUrl, copiar, ocupado, trabajando };
}
