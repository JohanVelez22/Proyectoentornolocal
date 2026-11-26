import { join } from 'node:path';
import {
  BrowserWindow,
  ClipboardItem,
  Notification,
  clipboard,
  desktopCapturer,
  dialog,
  screen,
  shell,
  systemPreferences,
  type DesktopCapturerSource,
} from 'electron';
import type { IdiomaUi, Nucleo } from '@pel/core';
import type { ImagenCaptura, ModoCaptura, VentanaCapturable } from '../shared/captura';
import {
  denegarPermisos,
  opcionesVentanaCaptura,
  vigilarVentana,
  type DepsCaptura,
  type FuentesCaptura,
  type VentanaCaptura,
} from './captura';
import type { TextosMain } from './textos';

/**
 * La parte de la captura que toca Electron (`desktopCapturer`, ventanas, portapapeles, diálogos).
 * No tiene pruebas unitarias —necesitaría la pantalla real—; todo lo que decide algo está en
 * `captura.ts`, que sí las tiene con una Plataforma falsa y una imagen fija.
 */

/** Ventanas que se ofrecen como máximo en el modo `ventana`. */
const MAX_VENTANAS = 40;
/** Lado mínimo (px) de una ventana que vale la pena ofrecer. */
const LADO_MINIMO = 48;
/** Tamaño de las miniaturas de la lista del modo ventana (la captura real se pide al elegir). */
const MINIATURA_VENTANA = { width: 640, height: 400 } as const;
/** Espera tras ocultar la ventana de la app para que el sistema repinte antes de capturar. */
const ESPERA_OCULTAR_MS = 220;

export interface OpcionesCapturaElectron {
  nucleo: () => Nucleo;
  ventanaPrincipal: () => BrowserWindow | null;
  idioma: () => IdiomaUi | null;
  textos: () => TextosMain;
  /** Carpeta del preload compilado (`out/preload`). */
  carpetaPreload: string;
  /** Carpeta del renderer compilado (`out/renderer`). */
  carpetaRenderer: string;
  /** Trae la ventana principal al frente y avisa de la captura (`captura:imagen`). */
  alConversor: (info: { ancho: number; alto: number }) => void;
  registrarError: (e: unknown) => void;
}

function aImagen(src: DesktopCapturerSource): ImagenCaptura | null {
  const miniatura = src.thumbnail;
  if (miniatura.isEmpty()) return null;
  const { width, height } = miniatura.getSize();
  if (width < LADO_MINIMO || height < LADO_MINIMO) return null;
  return { png: new Uint8Array(miniatura.toPNG()), ancho: width, alto: height };
}

const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export function crearDepsElectron(o: OpcionesCapturaElectron): Omit<DepsCaptura, 'atajos'> {
  /** La pantalla que se capturó: la ventana de captura se abre justo encima. */
  let zona = screen.getPrimaryDisplay().bounds;
  /** Tamaño en píxeles de esa pantalla: tope para capturar una ventana a tamaño real. */
  let pixelesZona = { width: 1920, height: 1080 };

  /** Ventanas de esta app (nunca se ofrecen ni se capturan). */
  const propias = (): Set<string> =>
    new Set(BrowserWindow.getAllWindows().map((w) => w.getMediaSourceId()));

  return {
    estado: () => o.nucleo().capturaDisponible(),
    // En macOS el permiso de grabar la pantalla lo da el usuario en Ajustes del Sistema.
    permisoSistema() {
      if (process.platform !== 'darwin') return null;
      switch (systemPreferences.getMediaAccessStatus('screen')) {
        case 'granted':
          return 'concedido';
        case 'denied':
        case 'restricted':
          return 'denegado';
        case 'not-determined':
          return 'pendiente';
        default:
          return null;
      }
    },
    async ocultarPropias() {
      const v = o.ventanaPrincipal();
      if (!v || v.isDestroyed() || !v.isVisible() || v.isMinimized()) return () => undefined;
      // Se recuerda si estaba maximizada para devolverla tal cual estaba.
      const maximizada = v.isMaximized();
      v.hide();
      await esperar(ESPERA_OCULTAR_MS);
      return () => {
        if (v.isDestroyed()) return;
        v.showInactive();
        if (maximizada && !v.isMaximized()) v.maximize();
      };
    },
    async fuentes(modo: ModoCaptura): Promise<FuentesCaptura> {
      const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      zona = display.bounds;
      const ancho = Math.round(display.size.width * display.scaleFactor);
      const alto = Math.round(display.size.height * display.scaleFactor);
      pixelesZona = { width: ancho, height: alto };
      if (modo === 'ventana') {
        // Solo la lista, con miniaturas pequeñas: la pantalla entera no se pide ni se envía.
        const fuentes = await desktopCapturer.getSources({
          types: ['window'],
          thumbnailSize: MINIATURA_VENTANA,
          fetchWindowIcons: false,
        });
        const ventanas: VentanaCapturable[] = [];
        // Nunca se ofrecen las ventanas de esta app (ya están ocultas o cerradas).
        const mias = propias();
        for (const s of fuentes) {
          if (!s.id.startsWith('window:') || mias.has(s.id) || s.name.trim() === '') continue;
          const img = aImagen(s);
          if (img) ventanas.push({ ...img, id: s.id, nombre: s.name.slice(0, 120) });
          if (ventanas.length >= MAX_VENTANAS) break;
        }
        return { pantalla: null, ventanas };
      }
      const fuentes = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: ancho, height: alto },
        fetchWindowIcons: false,
      });
      const pantallas = fuentes.filter((s) => s.id.startsWith('screen:'));
      const pantalla =
        pantallas.find((s) => s.display_id === String(display.id)) ?? pantallas[0] ?? null;
      return { pantalla: pantalla ? aImagen(pantalla) : null, ventanas: [] };
    },
    async capturarVentana(id: string) {
      if (!id.startsWith('window:') || propias().has(id)) return null;
      const fuentes = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: pixelesZona,
        fetchWindowIcons: false,
      });
      const s = fuentes.find((x) => x.id === id);
      return s ? aImagen(s) : null;
    },
    crearVentana(): VentanaCaptura {
      const v = new BrowserWindow(
        opcionesVentanaCaptura({ preload: join(o.carpetaPreload, 'captura.cjs'), zona }),
      );
      // La ventana de captura no sale en capturas de pantalla ni grabaciones de otros programas.
      v.setContentProtection(true);
      v.setMenuBarVisibility(false);
      v.setAlwaysOnTop(true, 'screen-saver');
      v.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      v.webContents.on('will-navigate', (e) => e.preventDefault());
      // Sin ningún permiso (cámara, ubicación, notificaciones...) en su sesión, que es solo de memoria.
      denegarPermisos(v.webContents.session);
      v.once('ready-to-show', () => {
        v.show();
        v.focus();
      });
      // Si no carga, muere o se cuelga, se destruye: no puede quedar una ventana encima de todo.
      vigilarVentana({
        alListaParaMostrar: (fn) => v.once('ready-to-show', fn),
        alFallar: (fn) => {
          v.webContents.on('did-fail-load', (_e, codigo, _descripcion, _url, principal) => {
            // -3 = carga abortada (una navegación bloqueada a propósito), no un fallo.
            if (principal && codigo !== -3) fn();
          });
          v.webContents.on('render-process-gone', () => fn());
          v.on('unresponsive', () => fn());
        },
        alCerrar: (fn) => v.once('closed', fn),
        destruir: () => {
          if (!v.isDestroyed()) v.destroy();
        },
      });
      const dev = process.env['ELECTRON_RENDERER_URL'];
      if (dev) void v.loadURL(`${dev}/captura/index.html`);
      else void v.loadFile(join(o.carpetaRenderer, 'captura', 'index.html'));
      const id = v.webContents.id;
      return {
        esDe: (emisor) => (emisor as { id?: number } | null)?.id === id,
        cerrar: () => {
          if (!v.isDestroyed()) v.destroy();
        },
        alCerrar: (fn) => v.once('closed', fn),
      };
    },
    // El portapapeles de Electron 45 es asíncrono y por tipos MIME (como `navigator.clipboard`).
    async copiarImagen(bytes) {
      const blob = new Blob([bytes as BlobPart], { type: 'image/png' });
      await clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    },
    async pedirDestino(sugerido, formato, ventana) {
      const v = BrowserWindow.getAllWindows().find((w) => ventana.esDe(w.webContents));
      const opciones = {
        defaultPath: sugerido,
        filters: [{ name: formato.toUpperCase(), extensions: [formato] }],
      };
      const r = v
        ? await dialog.showSaveDialog(v, opciones)
        : await dialog.showSaveDialog(opciones);
      return r.canceled || !r.filePath ? null : r.filePath;
    },
    guardarImagen: (destino, bytes) => o.nucleo().guardarImagen(destino, bytes),
    alConversor: o.alConversor,
    async explicarPermiso() {
      const t = o.textos();
      const r = await dialog.showMessageBox({
        type: 'info',
        title: t.capturaPermisoTitulo,
        message: t.capturaPermisoTexto,
        buttons: [t.capturaAbrirPreferencias, t.cancelar],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      });
      if (r.response === 0 && process.platform === 'darwin') {
        await shell.openExternal(
          'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
        );
      }
    },
    avisarAtajoOcupado(atajo) {
      if (!Notification.isSupported()) return;
      new Notification({
        title: 'WolfCore Dev',
        body: o.textos().capturaAtajoOcupado.replace('{atajo}', atajo),
      }).show();
    },
    config: () => o.nucleo().capturaConfig(),
    idioma: () => o.idioma() ?? 'es',
    registrarError: o.registrarError,
  };
}
