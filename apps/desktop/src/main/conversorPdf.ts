import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BrowserWindow, session } from 'electron';
import { ErrorWolf, type ImprimirPdf } from '@pel/core';
import {
  PREFERENCIAS_IMPRESION,
  crearRegistroPermitidos,
  instalarFiltro,
} from './conversorPdfConfig';

/**
 * Imprime un HTML ya saneado a PDF con el Chromium de Electron (md → pdf y html → pdf). La
 * ventana nunca se muestra, no ejecuta JavaScript, no tiene Node y su sesión bloquea toda
 * solicitud de red: solo carga el archivo temporal con el HTML. Si se aborta la señal (plazo o
 * cancelación) la ventana se destruye. Puede haber varias impresiones a la vez: comparten un
 * único filtro de sesión (registrado una vez) con las direcciones permitidas de cada una.
 */
const registro = crearRegistroPermitidos();

export const imprimirHtmlAPdf: ImprimirPdf = async (html, senal) => {
  const carpeta = await mkdtemp(path.join(os.tmpdir(), 'wolfcore-pdf-'));
  const archivo = path.join(carpeta, 'documento.html');
  let ventana: BrowserWindow | null = null;
  let quitar: (() => void) | null = null;
  try {
    await writeFile(archivo, html, 'utf8');
    const permitido = pathToFileURL(archivo).href;
    const ses = session.fromPartition(PREFERENCIAS_IMPRESION.partition);
    instalarFiltro(ses, registro);
    ses.setPermissionRequestHandler((_w, _p, cb) => cb(false));
    quitar = registro.permitir(permitido);
    ventana = new BrowserWindow({ show: false, webPreferences: { ...PREFERENCIAS_IMPRESION } });
    const w = ventana;
    w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    w.webContents.on('will-navigate', (e) => e.preventDefault());
    const cortar = (): void => {
      if (!w.isDestroyed()) w.destroy();
    };
    senal?.addEventListener('abort', cortar, { once: true });
    try {
      await w.loadURL(permitido);
      const pdf = await w.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
      return new Uint8Array(pdf);
    } catch {
      throw new ErrorWolf('conversor.archivo_invalido', 'No se pudo imprimir el documento.');
    } finally {
      senal?.removeEventListener('abort', cortar);
    }
  } finally {
    quitar?.();
    if (ventana && !ventana.isDestroyed()) ventana.destroy();
    await rm(carpeta, { recursive: true, force: true }).catch(() => undefined);
  }
};
