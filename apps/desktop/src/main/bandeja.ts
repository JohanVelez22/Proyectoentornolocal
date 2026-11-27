import { Menu, Tray, nativeImage } from 'electron';
import { plantillaBandeja, type AccionesBandeja, type WorkspaceBandeja } from './bandejaPlantilla';
import type { TextosMain } from './textos';

export type { AccionesBandeja, WorkspaceBandeja };

/** Menú de la bandeja en el idioma dado (se vuelve a armar al cambiar de idioma o de workspaces). */
export function menuBandeja(
  tray: Tray,
  a: AccionesBandeja,
  t: TextosMain,
  workspaces: readonly WorkspaceBandeja[] = [],
): void {
  tray.setContextMenu(Menu.buildFromTemplate(plantillaBandeja(a, t, workspaces)));
}

export function crearBandeja(
  rutaIcono: string,
  a: AccionesBandeja,
  t: TextosMain,
  workspaces: readonly WorkspaceBandeja[] = [],
): Tray {
  const original = nativeImage.createFromPath(rutaIcono);
  // El .ico ya trae 16/24/32 px y Windows elige según la escala; un PNG grande se reduce.
  const icono = rutaIcono.endsWith('.ico') ? original : original.resize({ width: 16, height: 16 });
  const tray = new Tray(icono);
  tray.setToolTip('WolfCore Dev');
  menuBandeja(tray, a, t, workspaces);
  tray.on('click', a.abrir);
  return tray;
}
