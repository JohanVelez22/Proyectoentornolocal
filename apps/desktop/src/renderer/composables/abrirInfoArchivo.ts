import type { InfoRuta } from '@pel/core';
import { api } from '../api';
import { router } from '../router';
import { solicitudes } from './solicitudes';

/**
 * Abre «Info de archivo» con un archivo o una carpeta soltado en la ventana o elegido con el
 * selector (D55). El `File` solo se entrega al preload, que saca su ruta con
 * `webUtils.getPathForFile`; el proceso principal la valida y la registra. Aquí no hay ninguna
 * ruta escrita por la interfaz. Solo lectura.
 */
export async function abrirInfoArchivo(archivo: unknown): Promise<InfoRuta> {
  const info = await api().infoArchivo.elegir(archivo);
  solicitudes.archivoInfo = info;
  solicitudes.herramienta = 'infoArchivo';
  void router.push({ name: 'herramientas' });
  return info;
}
