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
  ejecutorPorDefecto,
  ErrorWolf,
  Nucleo,
  rutaBasePorDefecto,
  rutaCsc,
  VARIABLE_DATOS,
  type IdiomaUi,
  type PreferenciasUi,
  type Rutas,
  type TemaUi,
} from '@pel/core';
import type { ApiSistema } from '../shared/api';
import { Notificador } from './notificaciones';
import { textoAviso } from '../shared/textosAvisos';
import { crearBandeja, menuBandeja, type AccionesBandeja, type WorkspaceBandeja } from './bandeja';
import { crearConfirmarCli } from './confirmarCli';
import { idiomaDeLocale, textosMain } from './textos';
import { programarDoctorAlIniciar } from './doctorInicio';
import { ControlMetricas, registrarIpc } from './ipc';
import { AlmacenSecretos } from './secretos';
import { crearOrdenes, ordenDeArgs } from './ordenes';
import { crearSalida } from './salida';
import {
  carpetaDatosDeEntorno,
  registrarFinDeSesion,
  topeCierre,
  usarCarpetaDatos,
} from './sesion';
import { carpetaExistente, urlAbrible, urlHttp } from './validacion';
import { imprimirHtmlAPdf } from './conversorPdf';

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
/** Workspaces del menú de la bandeja (se rearma al cambiar el estado o al editarlos). */
let workspacesBandeja: WorkspaceBandeja[] = [];

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
    menuBandeja(bandeja, accionesBandeja, textosMain(idioma), workspacesBandeja);
}

let temporizadorBandeja: ReturnType<typeof setTimeout> | null = null;

/** Rearma el menú de la bandeja con los workspaces y su estado (agrupa cambios seguidos). */
function programarMenuBandeja(): void {
  if (temporizadorBandeja) return;
  temporizadorBandeja = setTimeout(() => {
    temporizadorBandeja = null;
    void refrescarMenuBandeja();
  }, 400);
}

async function refrescarMenuBandeja(): Promise<void> {
  const n = nucleo;
  if (!n || !bandeja || !accionesBandeja || saliendo) return;
  try {
    const [lista, estados] = await Promise.all([n.workspaces.lista(), n.workspaces.estados()]);
    workspacesBandeja = lista.map((w) => ({
      id: w.id,
      nombre: w.nombre,
      estado: estados[w.id] ?? 'apagado',
    }));
  } catch (e) {
    console.error('No se pudieron leer los workspaces para la bandeja:', e);
  }
  if (bandeja && !bandeja.isDestroyed() && accionesBandeja) {
    menuBandeja(bandeja, accionesBandeja, textosMain(idioma), workspacesBandeja);
  }
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

// WOLFCORE_DATOS (D26): otra carpeta de datos ("PC nuevo", pruebas manuales). Se valida y se fija
// el userData de Electron dentro de ella ANTES del candado de instancia única: la carpeta real no se
// lee ni se escribe. Lo que se usa queda en el registro y en el título de la ventana.
let carpetaDatos: string | null = null;
let errorCarpetaDatos: string | null = null;
try {
  carpetaDatos = carpetaDatosDeEntorno(process.env, rutaBasePorDefecto());
  if (carpetaDatos) {
    const userData = usarCarpetaDatos(app, carpetaDatos);
    console.info(
      `WolfCore Dev usa la carpeta de datos ${carpetaDatos} (${VARIABLE_DATOS}); Electron, ${userData}. La carpeta real no se toca y no se escriben el hosts, el PATH, las variables del usuario ni el almacén de certificados.`,
    );
  }
} catch (e) {
  errorCarpetaDatos = e instanceof Error ? e.message : String(e);
}

if (errorCarpetaDatos !== null) {
  // Aún no hay preferencias: el idioma del sistema.
  const t = textosMain(idiomaDeLocale(Intl.DateTimeFormat().resolvedOptions().locale));
  console.error(errorCarpetaDatos);
  dialog.showErrorBox('WolfCore Dev', t.carpetaDatosInvalida);
  app.exit(1);
} else if (!app.requestSingleInstanceLock()) {
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
      // El servidor de órdenes de la CLI `wolf` (D31): 127.0.0.1, puerto y token propios de esta
      // carpeta de datos (run/cli.json). `abrirUrl` solo recibe la dirección de un sitio (http/https).
      nucleo = await Nucleo.crear({
        ...(carpetaDatos ? { base: carpetaDatos, aislado: true } : {}),
        // md → pdf y html → pdf del conversor (D34): Chromium sin red ni JavaScript.
        imprimirPdf: imprimirHtmlAPdf,
        servidorCli: {
          version: app.getVersion(),
          // El cliente `wolf` compilado (out/cli/wolf.cjs, dentro del paquete) y el ejecutable que lo
          // corre como Node. Sin empaquetar, `wolf.cmd` también recibe la carpeta de la app (`--abrir`).
          cliente: {
            exe: process.execPath,
            script: join(app.getAppPath(), 'out', 'cli', 'wolf.cjs'),
            ...(app.isPackaged ? {} : { carpetaApp: app.getAppPath() }),
          },
          // wolf.exe: el lanzador que PowerShell y cmd prefieren a wolf.cmd (un .cmd deja que cmd.exe
          // interprete `&` y `|` de los argumentos). Se compila con el csc de .NET Framework de Windows.
          ...(process.platform === 'win32'
            ? { lanzadorExe: { ejecutar: ejecutorPorDefecto, csc: rutaCsc() } }
            : {}),
          abrirUrl: (url) => shell.openExternal(urlHttp(url)),
          // Publicar un sitio o cambiar el PHP global lo decide esta ventana, nunca la terminal.
          confirmar: crearConfirmarCli({
            mostrar: (o) => dialog.showMessageBox(o),
            textos: () => textosMain(idioma),
          }),
        },
      });
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
    if (carpetaDatos) {
      // Que se vea siempre con qué carpeta corre esta ventana.
      const titulo = `WolfCore Dev — ${textosMain(idioma).carpetaDatosAislada}: ${carpetaDatos}`;
      v.on('page-title-updated', (e) => e.preventDefault());
      v.setTitle(titulo);
    }
    // Token de GitHub y claves de IA: cifrados en etc/secretos/ (solo este proceso los lee). El
    // token viejo de etc/github.token pasa solo al almacén nuevo la primera vez que se lee.
    const secretos = new AlmacenSecretos(n.rutas.secretos(), n.rutas.tokenGithub(), safeStorage);
    n.fijarProveedorTokenGithub(() => secretos.leerTokenGithub());
    // Clave del usuario propio de la base de cada proyecto (bd:<sitio>): el núcleo la pide por llamada
    // (reintentos de receta, MCP) y solo la usa en memoria.
    n.fijarProveedorClaveBd(async (sitioId) => {
      try {
        return await secretos.leer(`bd:${sitioId}`);
      } catch {
        return null;
      }
    });
    // Credenciales de los túneles con nombre (tunel:<proveedor>:<túnel>): el núcleo las lee al
    // abrir el túnel (también desde el MCP) y las guarda al crearlo; nunca van al renderer.
    n.fijarSecretosTunel(() => ({
      disponible: () => secretos.disponible(),
      leer: (id) => secretos.leer(id as `tunel:${string}`),
      guardar: (id, v) => secretos.guardar(id as `tunel:${string}`, v),
      borrar: (id) => secretos.borrar(id as `tunel:${string}`),
    }));
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
      {
        secretos,
        metricas,
        idiomaSistema: () => app.getLocale(),
        aplicarPreferencias,
        alCambiarWorkspaces: programarMenuBandeja,
      },
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
      // Encendido: se apaga; apagado o en parte: se enciende. Un fallo ya queda en los avisos.
      alternarWorkspace: (id, estado) =>
        void (estado === 'encendido' ? n.workspaces.detener(id) : n.workspaces.iniciar(id))
          .catch((e) => console.error(e))
          .finally(programarMenuBandeja),
      salir: () => void salir(),
    };
    bandeja = crearBandeja(rutaIconoBandeja, accionesBandeja, textosMain(idioma));
    n.eventos.on('servicio:estado', programarMenuBandeja);
    programarMenuBandeja();
    // Arrancada con una orden (o recibida mientras cargaba): se ejecuta ahora.
    const orden = ordenDeArgs(process.argv);
    if (orden) void ordenes.ejecutar(orden);
    void ordenes.listo();
  });
  // La app vive en la bandeja: no se cierra al ocultar la ventana.
  app.on('window-all-closed', () => undefined);
}
