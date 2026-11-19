import { join } from 'node:path';
import {
  BrowserWindow,
  app,
  clipboard,
  dialog,
  Notification,
  ipcMain,
  nativeTheme,
  safeStorage,
  shell,
  type Tray,
} from 'electron';
import { Nucleo, type IdiomaUi, type PreferenciasUi, type Rutas, type TemaUi } from '@pel/core';
import type { ApiSistema } from '../shared/api';
import { Notificador } from './notificaciones';
import { textoAviso } from '../shared/textosAvisos';
import { crearBandeja, menuBandeja, type AccionesBandeja } from './bandeja';
import { textosMain } from './textos';
import { programarDoctorAlIniciar } from './doctorInicio';
import { ControlMetricas, registrarIpc } from './ipc';
import { SecretosGithub } from './secretos';
import { registrarFinDeSesion, topeCierre } from './sesion';
import { carpetaExistente, urlHttp } from './validacion';

let ventana: BrowserWindow | null = null;
let bandeja: Tray | null = null;
let nucleo: Nucleo | null = null;
let saliendo = false;
let preguntandoSalida = false;
let cierreSistema: Promise<void> | null = null;
let idioma: IdiomaUi | null = null;
let accionesBandeja: AccionesBandeja | null = null;

// Empaquetado, el icono va en resources/ (extraResources); en desarrollo, junto al código.
const carpetaRecursos = app.isPackaged ? process.resourcesPath : join(__dirname, '../../resources');
// En Windows el .ico multitamaño da la ventana y la bandeja nítidas en cualquier escala.
const rutaIcono = join(carpetaRecursos, process.platform === 'win32' ? 'icono.ico' : 'icono.png');
const rutaIconoBandeja = join(
  carpetaRecursos,
  process.platform === 'win32' ? 'icono.ico' : 'icono-bandeja.png',
);

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
  async guardarArchivo(nombreSugerido) {
    const opciones = nombreSugerido ? { defaultPath: nombreSugerido } : {};
    const r = ventana
      ? await dialog.showSaveDialog(ventana, opciones)
      : await dialog.showSaveDialog(opciones);
    return r.canceled || !r.filePath ? null : r.filePath;
  },
  async elegirArchivos() {
    const r = ventana
      ? await dialog.showOpenDialog(ventana, { properties: ['openFile', 'multiSelections'] })
      : await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
    return r.canceled ? [] : r.filePaths;
  },
};

/** Tema de la ventana (barra de título, diálogos nativos y `prefers-color-scheme`). */
function aplicarTema(tema: TemaUi): void {
  nativeTheme.themeSource = tema === 'claro' ? 'light' : tema === 'oscuro' ? 'dark' : 'system';
}

/** Tema e idioma elegidos en la interfaz: ventana, bandeja y diálogos nativos. */
function aplicarPreferencias(p: PreferenciasUi): void {
  aplicarTema(p.tema);
  const cambio = p.idioma !== idioma;
  idioma = p.idioma;
  if (cambio && bandeja && accionesBandeja)
    menuBandeja(bandeja, accionesBandeja, textosMain(idioma));
}

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
      message: textosMain(idioma).preguntaApagar,
      buttons: [
        textosMain(idioma).siApagar,
        textosMain(idioma).noApagar,
        textosMain(idioma).cancelar,
      ],
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
    // El tema guardado se aplica antes de crear la ventana (sin destello del tema contrario).
    try {
      const p = await n.preferenciasUi();
      aplicarTema(p.tema);
      idioma = p.idioma;
    } catch {
      // sin preferencias legibles: tema del sistema
    }
    const v = crearVentana(n.rutas);
    ventana = v;
    // El token de GitHub vive cifrado en etc/github.token: solo este proceso lo lee.
    const secretos = new SecretosGithub(n.rutas.tokenGithub(), safeStorage);
    n.fijarProveedorTokenGithub(() => secretos.leerTokenGithub());
    // Métricas solo con la ventana visible (oculta en la bandeja o minimizada: en pausa).
    const metricas = new ControlMetricas(n);
    const visible = (): void => metricas.visibilidad(v.isVisible() && !v.isMinimized());
    v.on('show', visible);
    v.on('hide', visible);
    v.on('minimize', visible);
    v.on('restore', visible);
    visible();
    // Notificaciones nativas de los avisos (solo con la ventana sin foco, con límite por tipo y fuente).
    if (process.platform === 'win32') app.setAppUserModelId('com.johanvelez.wolfcoredev');
    const notificador = new Notificador({
      soportada: () => Notification.isSupported(),
      crear: (o) => new Notification(o),
      ventanaConFoco: () => !v.isDestroyed() && v.isVisible() && !v.isMinimized() && v.isFocused(),
      permitida: (a) => n.avisos.nativaPermitida(a.tipo),
      alClic: (a) => {
        mostrarVentana();
        n.avisos.marcarLeidos([a.id]);
        n.eventos.emit('aviso:abrir', a);
      },
    });
    n.eventos.on('aviso:nuevo', (a) => void notificador.mostrar(a, textoAviso(idioma, a)));
    // Una acción destructiva pedida por un cliente MCP trae la ventana al frente.
    n.eventos.on('mcp:confirmar', () => mostrarVentana());
    registrarIpc(
      n,
      ipcMain,
      v,
      sistema,
      (e) => (e as { senderFrame?: unknown } | null)?.senderFrame === v.webContents.mainFrame,
      undefined,
      { secretos, metricas, idiomaSistema: () => app.getLocale(), aplicarPreferencias },
    );
    n.iniciarSondeo();
    // El Doctor revisa una vez en segundo plano (nunca si la app ya se está cerrando) y, si hay
    // errores, publica su aviso.
    programarDoctorAlIniciar({
      doctor: { revisar: () => (saliendo ? Promise.resolve([]) : n.doctor.revisar()) },
    });
    accionesBandeja = {
      abrir: mostrarVentana,
      iniciarTodo: () => void n.servicios.iniciarTodo().catch((e) => console.error(e)),
      detenerTodo: () => void n.detenerTodo().catch((e) => console.error(e)),
      salir: () => void salir(),
    };
    bandeja = crearBandeja(rutaIconoBandeja, accionesBandeja, textosMain(idioma));
  });
  // La app vive en la bandeja: no se cierra al ocultar la ventana.
  app.on('window-all-closed', () => undefined);
}
