import { Menu, Tray, nativeImage } from 'electron';
import type { TextosMain } from './textos';

export interface AccionesBandeja {
  abrir(): void;
  iniciarTodo(): void;
  detenerTodo(): void;
  salir(): void;
}

/** Menú de la bandeja en el idioma dado (se vuelve a armar al cambiar de idioma). */
export function menuBandeja(tray: Tray, a: AccionesBandeja, t: TextosMain): void {
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: t.abrir, click: a.abrir },
      { label: t.iniciarTodo, click: a.iniciarTodo },
      { label: t.detenerTodo, click: a.detenerTodo },
      { type: 'separator' },
      { label: t.salir, click: a.salir },
    ]),
  );
}

export function crearBandeja(rutaIcono: string, a: AccionesBandeja, t: TextosMain): Tray {
  const original = nativeImage.createFromPath(rutaIcono);
  // El .ico ya trae 16/24/32 px y Windows elige según la escala; un PNG grande se reduce.
  const icono = rutaIcono.endsWith('.ico') ? original : original.resize({ width: 16, height: 16 });
  const tray = new Tray(icono);
  tray.setToolTip('WolfCore Dev');
  menuBandeja(tray, a, t);
  tray.on('click', a.abrir);
  return tray;
}
