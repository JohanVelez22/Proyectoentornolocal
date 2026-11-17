import { join } from 'node:path';
import { BrowserWindow, app, clipboard, dialog, ipcMain, shell, type Tray } from 'electron';
import { Nucleo } from '@pel/core';
import type { ApiSistema } from '../shared/api';
import { crearBandeja } from './bandeja';
import { registrarIpc } from './ipc';

let ventana: BrowserWindow | null = null;
let bandeja: Tray | null = null;
let nucleo: Nucleo | null = null;
let saliendo = false;

const rutaIcono = join(__dirname, '../../resources/icono.png');

const sistema: ApiSistema = {
  async elegirCarpeta() {
    const r = ventana
      ? await dialog.showOpenDialog(ventana, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return r.canceled || !r.filePaths[0] ? null : r.filePaths[0];
  },
  async abrirUrl(url) {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      throw new Error('La dirección no es válida');
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error('Solo se pueden abrir direcciones http o https');
    }
    await shell.openExternal(u.toString());
  },
  async abrirCarpeta(ruta) {
    const error = await shell.openPath(ruta);
    if (error) throw new Error(error);
  },
  async copiar(texto) {
    clipboard.writeText(texto);
  },
  async version() {
    return app.getVersion();
  },
};

function mostrarVentana(): void {
  if (!ventana) return;
  if (ventana.isMinimized()) ventana.restore();
  ventana.show();
  ventana.focus();
}

function crearVentana(): BrowserWindow {
  const v = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'Entorno Local',
    icon: rutaIcono,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  v.setMenuBarVisibility(false);
  v.once('ready-to-show', () => v.show());
  v.on('close', (e) => {
    if (saliendo) return;
    e.preventDefault();
    v.hide();
  });
  const dev = process.env['ELECTRON_RENDERER_URL'];
  if (dev) void v.loadURL(dev);
  else void v.loadFile(join(__dirname, '../renderer/index.html'));
  return v;
}

async function salir(): Promise<void> {
  const opciones = {
    type: 'question' as const,
    title: 'Entorno Local',
    message: '¿Apagar los servicios?',
    buttons: ['Sí, apagar', 'No, dejarlos encendidos', 'Cancelar'],
    defaultId: 0,
    cancelId: 2,
  };
  const r = ventana
    ? await dialog.showMessageBox(ventana, opciones)
    : await dialog.showMessageBox(opciones);
  if (r.response === 2) return;
  saliendo = true;
  try {
    await nucleo?.cerrar({ detenerServicios: r.response === 0 });
  } catch (e) {
    console.error('Error al cerrar el núcleo:', e);
  }
  bandeja?.destroy();
  app.exit();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', mostrarVentana);
  void app.whenReady().then(async () => {
    nucleo = await Nucleo.crear();
    ventana = crearVentana();
    registrarIpc(nucleo, ipcMain, ventana, sistema);
    nucleo.iniciarSondeo();
    const n = nucleo;
    bandeja = crearBandeja(rutaIcono, {
      abrir: mostrarVentana,
      iniciarTodo: () => void n.servicios.iniciarTodo().catch((e) => console.error(e)),
      detenerTodo: () => void n.servicios.detenerTodo().catch((e) => console.error(e)),
      salir: () => void salir(),
    });
  });
  // La app vive en la bandeja: no se cierra al ocultar la ventana.
  app.on('window-all-closed', () => undefined);
}
