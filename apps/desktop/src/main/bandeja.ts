import { Menu, Tray, nativeImage } from 'electron';

export interface AccionesBandeja {
  abrir(): void;
  iniciarTodo(): void;
  detenerTodo(): void;
  salir(): void;
}

export function crearBandeja(rutaIcono: string, a: AccionesBandeja): Tray {
  const icono = nativeImage.createFromPath(rutaIcono).resize({ width: 16, height: 16 });
  const tray = new Tray(icono);
  tray.setToolTip('WolfCore Dev');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir', click: a.abrir },
      { label: 'Iniciar todo', click: a.iniciarTodo },
      { label: 'Detener todo', click: a.detenerTodo },
      { type: 'separator' },
      { label: 'Salir', click: a.salir },
    ]),
  );
  tray.on('click', a.abrir);
  return tray;
}
