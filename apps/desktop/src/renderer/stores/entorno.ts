import { api } from '../api';
import { useBd } from './bd';
import { useHosts } from './hosts';
import { useIa } from './ia';
import { useServicios } from './servicios';
import { useSitios } from './sitios';
import { useTuneles } from './tuneles';

/**
 * Arranque de la interfaz: primero se suscribe a los eventos (para no perder ninguno) y después
 * pide una sola foto con `estadoGeneral()`. A partir de ahí todo llega por eventos.
 */
export async function iniciarEntorno(): Promise<void> {
  const servicios = useServicios();
  const sitios = useSitios();
  const tuneles = useTuneles();
  const hosts = useHosts();
  servicios.iniciar();
  sitios.iniciar();
  tuneles.iniciar();
  hosts.iniciar();
  // Bases de datos: el registro de progreso sigue llegando aunque se cambie de pantalla.
  useBd().iniciar();
  // IA local: el avance de las descargas de modelos tampoco depende de la pantalla.
  useIa().iniciar();
  try {
    const general = await api().estadoGeneral();
    servicios.hidratar(general.servicios);
    sitios.hidratar(general.sitios);
    tuneles.hidratar(general.tuneles);
    hosts.hidratar(general.hosts);
  } finally {
    // Aunque falle la carga inicial, la interfaz no se queda en "Conectando…".
    servicios.marcarCargado();
  }
}

export function detenerEntorno(): void {
  useServicios().detener();
  useSitios().detener();
  useTuneles().detener();
  useHosts().detener();
  useBd().detener();
  useIa().detener();
}
