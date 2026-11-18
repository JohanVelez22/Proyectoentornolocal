import { join } from 'node:path';
import { BrowserWindow, app, clipboard, dialog, ipcMain, shell, type Tray } from 'electron';
import { Nucleo, type Rutas } from '@pel/core';
import type { ApiSistema } from '../shared/api';
import { crearBandeja } from './bandeja';
import { registrarIpc } from './ipc';
import { registrarFinDeSesion, topeCierre } from './sesion';
import { carpetaExistente, urlHttp } from './validacion';

let ventana: BrowserWindow | null = null;
let bandeja: Tray | null = null;
let nucleo: Nucleo | null = null;
let saliendo = false;
let preguntandoSalida = false;
let cierreSistema: Promise<void> | null = null;

// Empaquetado, el icono va en resources/ (extraResources); en desarrollo, junto al código.
const rutaIcono = app.isPackaged
  ? join(process.resourcesPath, 'icono.png')
  : join(__dirname, '../../resources/icono.png');

const sistema: ApiSistema = {
  async elegirCarpeta() {
    const r = ventana
      ? await dialog.showOpenDialog(ventana, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return r.canceled || !r.filePaths[0] ? null : r.filePaths[0];
  },
  async elegirArchivo() {
    const r = ventana
      ? await dialog.showOpenDialog(ventana, { properties: ['openFile'] })
      : await dialog.showOpenDialog({ properties: ['openFile'] });
    return r.canceled || !r.filePaths[0] ? null : r.filePaths[0];
  },
  async abrirUrl(url) {
    await shell.openExternal(urlHttp(url));
  },
  async abrirCarpeta(ruta) {
    const error = await shell.openPath(await carpetaExistente(ruta));
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
  if (!ventana || ventana.isDestroyed()) return;
  if (ventana.isMinimized()) ventana.restore();
  ventana.show();
  ventana.focus();
}

function urlPropia(url: string): boolean {
  const dev = process.env['ELECTRON_RENDERER_URL'];
  try {
    const u = new URL(url);
    if (dev) return u.origin === new URL(dev).origin;
    return u.protocol === 'file:';
  } catch {
    return false;
  }
}

/** `rutas` son las del Nucleo ya creado: si la migración volvió a la carpeta vieja, es esa. */
function crearVentana(rutas: Rutas): BrowserWindow {
  const v = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'WolfCore Dev',
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
  // Logout/apagado de Windows: .env restaurados de forma síncrona y luego cierre sin diálogo.
  registrarFinDeSesion(
    v,
    () => rutas,
    () => void cerrarPorSistema(topeCierre(true)),
  );

  v.webContents.setWindowOpenHandler(({ url }) => {
    try {
      void shell.openExternal(urlHttp(url));
    } catch {
      // enlace no permitido: se ignora
    }
    return { action: 'deny' };
  });
  v.webContents.on('will-navigate', (e, url) => {
    if (!urlPropia(url)) e.preventDefault();
  });

  const dev = process.env['ELECTRON_RENDERER_URL'];
  if (dev) void v.loadURL(dev);
  else void v.loadFile(join(__dirname, '../renderer/index.html'));
  return v;
}

/**
 * Cierre sin diálogo (before-quit / session-end): apaga todo con un tope (5 s en fin de sesión,
 * más margen si no) y sale.
 */
function cerrarPorSistema(topeMs: number): Promise<void> {
  if (cierreSistema) return cierreSistema;
  saliendo = true;
  cierreSistema = (async () => {
    try {
      await Promise.race([
        nucleo?.cerrar({ detenerServicios: true }),
        new Promise<void>((r) => setTimeout(r, topeMs)),
      ]);
    } catch (e) {
      console.error('Error al cerrar el núcleo:', e);
    }
    bandeja?.destroy();
    app.exit();
  })();
  return cierreSistema;
}

async function salir(): Promise<void> {
  if (preguntandoSalida || saliendo) return;
  preguntandoSalida = true;
  try {
    const opciones = {
      type: 'question' as const,
      title: 'WolfCore Dev',
      message: '¿Apagar los servicios?',
      buttons: ['Sí, apagar', 'No, dejarlos encendidos', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
    };
    // Con la ventana oculta (salir desde la bandeja) el diálogo va sin padre: si no, quedaría
    // pegado a una ventana invisible.
    const padre = ventana && !ventana.isDestroyed() && ventana.isVisible() ? ventana : null;
    const r = padre
      ? await dialog.showMessageBox(padre, opciones)
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
  } finally {
    preguntandoSalida = false;
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', mostrarVentana);
  // Cierre iniciado por el sistema u otra vía (no por nuestro diálogo): se apaga todo.
  app.on('before-quit', (e) => {
    if (saliendo) return;
    e.preventDefault();
    void cerrarPorSistema(topeCierre(false));
  });
  void app.whenReady().then(async () => {
    try {
      nucleo = await Nucleo.crear();
    } catch (e) {
      const detalle = e instanceof Error ? e.message : String(e);
      dialog.showErrorBox('WolfCore Dev', `No se pudo iniciar el núcleo: ${detalle}`);
      app.exit(1);
      return;
    }
    const n = nucleo;
    const v = crearVentana(n.rutas);
    ventana = v;
    registrarIpc(
      n,
      ipcMain,
      v,
      sistema,
      (e) => (e as { senderFrame?: unknown } | null)?.senderFrame === v.webContents.mainFrame,
    );
    n.iniciarSondeo();
    bandeja = crearBandeja(rutaIcono, {
      abrir: mostrarVentana,
      iniciarTodo: () => void n.servicios.iniciarTodo().catch((e) => console.error(e)),
      detenerTodo: () => void n.detenerTodo().catch((e) => console.error(e)),
      salir: () => void salir(),
    });
  });
  // La app vive en la bandeja: no se cierra al ocultar la ventana.
  app.on('window-all-closed', () => undefined);
}
