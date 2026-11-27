import { lineaTexto, type DepsDoctor, type HallazgoInterno } from '../tipos';
import { fallo } from './comun';

/** Servicios en error, con el final de su registro como evidencia. */
export async function revisarServicios(d: DepsDoctor): Promise<HallazgoInterno[]> {
  return (await d.servicios())
    .filter((s) => s.estado === 'error')
    .map((s): HallazgoInterno => ({
      id: `servicios:${s.id}`,
      revision: 'servicios',
      gravedad: 'error',
      codigo: 'doctor.servicio_en_error',
      datos: { servicio: s.nombre, id: s.id },
      evidencia: lineaTexto(s.mensaje ?? ''),
      reparacion: {
        id: 'reintentar-servicio',
        codigo: 'doctor.reparaciones.reintentar_servicio',
        requiereAdmin: false,
        soloInforma: false,
      },
      aplicar: async () => {
        try {
          await d.reintentarServicio(s.id);
          return { ok: true };
        } catch (e) {
          return fallo(e);
        }
      },
    }));
}
