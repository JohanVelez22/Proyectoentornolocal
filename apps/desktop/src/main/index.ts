import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net';
import { mkdirSync, writeFileSync } from 'node:fs';
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
import {
  ErrorWolf,
  Nucleo,
  type IdiomaUi,
  type PreferenciasUi,
  type Rutas,
  type TemaUi,
} from '@pel/core';
import type { ApiSistema } from '../shared/api';
import { Notificador } from './notificaciones';
import { textoAviso } from '../shared/textosAvisos';
import { crearBandeja, menuBandeja, type AccionesBandeja } from './bandeja';
import { textosMain } from './textos';
import { programarDoctorAlIniciar } from './doctorInicio';
import { ControlMetricas, registrarIpc } from './ipc';
import { AlmacenSecretos } from './secretos';
import { crearOrdenes, ordenDeArgs } from './ordenes';
import { crearSalida } from './salida';
import { registrarFinDeSesion, topeCierre } from './sesion';
import { carpetaExistente, urlAbrible, urlHttp } from './validacion';

// El Node de Electron prueba cada dirección (IPv6 e IPv4) solo 250 ms antes de pasar a la
// siguiente: con conexiones lentas ninguna llega a tiempo y `fetch` falla con
// UND_ERR_CONNECT_TIMEOUT (el catálogo caía a la lista fija). Con 1 s por intento conecta.
setDefaultAutoSelectFamilyAttemptTimeout(1000);

let ventana: BrowserWindow | null = null;
let bandeja: Tray | null = null;
let nucleo: Nucleo | null = null;
let saliendo = false;
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
    const segura = urlAbrible(url);
    try {
      await shell.openExternal(segura);
    } catch (e) {
      // Sin cliente asociado al esquema ftp:// el sistema rechaza la apertura.
      if (segura.startsWith('ftp:')) {
        throw new ErrorWolf(
          'sistema.sin_cliente_ftp',
          'No hay un cliente FTP asociado en este equipo. Instale uno (por ejemplo FileZilla) o copie la dirección.',
          undefined,
          { cause: e },
        );
      }
      throw e;
    }
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

const salida = crearSalida({
  ventana: () => ventana,
  saliendo: () => saliendo,
  preguntar: async (padre) => {
    const t = textosMain(idioma);
    // Modal de la ventana (traída al frente y encima de todo por `crearSalida`): no puede quedar
    // escondido detrás de otra ventana.
    const r = await dialog.showMessageBox(padre as BrowserWindow, {
      type: 'question',
      title: 'WolfCore Dev',
      message: t.preguntaApagar,
      buttons: [t.siApagar, t.noApagar, t.cancelar],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
    });
    return r.response;
  },
  terminar: async (detenerServicios) => {
    saliendo = true;
    try {
      await nucleo?.cerrar({ detenerServicios });
    } catch (e) {
      console.error('Error al cerrar el núcleo:', e);
    }
    bandeja?.destroy();
    app.exit();
  },
});

function salir(): Promise<void> {
  return salida.salir();
}

// --iniciar-todo / --detener-todo (ver ordenes.ts): el mismo flujo que la bandeja.
const ordenes = crearOrdenes({
  nucleo: () => (nucleo && accionesBandeja ? nucleo : null),
  registrar: (r) => {
    if (!nucleo) return;
    try {
      const run = join(nucleo.rutas.base, 'run');
      mkdirSync(run, { recursive: true });
      writeFileSync(join(run, 'ultima-orden.json'), JSON.stringify(r, null, 2));
    } catch (e) {
      console.error('No se pudo guardar el resultado de la orden:', e);
    }
  },
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Otra instancia: con --iniciar-todo/--detener-todo ejecuta la orden aquí; si no, muestra la
  // ventana.
  app.on('second-instance', (_e, argv) => {
    const orden = ordenDeArgs(argv);
    if (orden) void ordenes.ejecutar(orden);
    else mostrarVentana();
  });
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
    // Token de GitHub y claves de IA: cifrados en etc/secretos/ (solo este proceso los lee). El
    // token viejo de etc/github.token pasa solo al almacén nuevo la primera vez que se lee.
    const secretos = new AlmacenSecretos(n.rutas.secretos(), n.rutas.tokenGithub(), safeStorage);
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
      iniciarTodo: () => void n.iniciarTodo().catch((e) => console.error(e)),
      detenerTodo: () => void n.detenerTodo().catch((e) => console.error(e)),
      salir: () => void salir(),
    };
    bandeja = crearBandeja(rutaIconoBandeja, accionesBandeja, textosMain(idioma));
    // Arrancada con una orden (o recibida mientras cargaba): se ejecuta ahora.
    const orden = ordenDeArgs(process.argv);
    if (orden) void ordenes.ejecutar(orden);
    void ordenes.listo();
  });
  // La app vive en la bandeja: no se cierra al ocultar la ventana.
  app.on('window-all-closed', () => undefined);
}
