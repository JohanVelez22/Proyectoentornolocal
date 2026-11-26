import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ErrorWolf } from '../errores';
import { matarArbol } from '../plataforma/lanzar';

/**
 * Conversiones que solo LibreOffice hace bien (odt, pptx, doc; D34). WolfCore Dev NO lo instala
 * ni lo descarga: solo lo usa si `Plataforma.libreOffice()` lo encuentra ya instalado, y la
 * interfaz avisa antes de usarlo.
 *
 * El documento es una entrada no confiable y LibreOffice es un programa grande: se le da una
 * COPIA de los bytes ya revisados con un nombre fijo (`entrada.<ext>`: ningún nombre del
 * usuario llega a la línea de órdenes), con un perfil propio y temporal (no toca el del usuario)
 * y sin shell. Corre con plazo; al vencer se mata solo el árbol de ese proceso, por su PID.
 */

export type Lanzar = (
  ejecutable: string,
  args: string[],
  o: { plazoMs: number; senal?: AbortSignal },
) => Promise<{ codigo: number | null; vencio: boolean }>;

/** Filtro de exportación de LibreOffice por formato de destino. */
const FILTROS: Record<string, string> = {
  docx: 'docx:MS Word 2007 XML',
  doc: 'doc:MS Word 97',
  odt: 'odt',
  pdf: 'pdf',
  txt: 'txt:Text',
  html: 'html',
};

export const lanzarLibreOffice: Lanzar = (ejecutable, args, o) =>
  new Promise((resolve, reject) => {
    const hijo = spawn(ejecutable, args, { windowsHide: true, stdio: 'ignore' });
    let vencio = false;
    let salio = false;
    const matar = (): void => matarArbol(hijo, { salio });
    const reloj = setTimeout(() => {
      vencio = true;
      matar();
    }, o.plazoMs);
    const alAbortar = (): void => {
      vencio = true;
      matar();
    };
    o.senal?.addEventListener('abort', alAbortar, { once: true });
    hijo.once('error', (e) => {
      clearTimeout(reloj);
      o.senal?.removeEventListener('abort', alAbortar);
      reject(e);
    });
    hijo.once('close', (codigo) => {
      salio = true;
      clearTimeout(reloj);
      o.senal?.removeEventListener('abort', alAbortar);
      resolve({ codigo, vencio });
    });
  });

/**
 * Configuración del perfil temporal de LibreOffice: sin macros, sin vínculos remotos y sin
 * actualizar vínculos al abrir (Writer y Calc: 2 = nunca). El documento es no confiable y
 * LibreOffice resuelve por su cuenta macros, enlaces a archivos y "referers" remotos.
 */
export const CONFIGURACION_PERFIL = `<?xml version="1.0" encoding="UTF-8"?>
<oor:items xmlns:oor="http://openoffice.org/2001/registry" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="DisableMacrosExecution" oor:op="fuse"><value>true</value></prop></item>
<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item>
<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="BlockUntrustedRefererLinks" oor:op="fuse"><value>true</value></prop></item>
<item oor:path="/org.openoffice.Office.Writer/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>2</value></prop></item>
<item oor:path="/org.openoffice.Office.Calc/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>2</value></prop></item>
</oor:items>
`;

export interface OpcionesLibreOffice {
  soffice: string;
  datos: Uint8Array;
  de: string;
  a: string;
  plazoMs: number;
  /** Tope de bytes del resultado. */
  maxSalida: number;
  senal?: AbortSignal;
  lanzar?: Lanzar;
}

/** Convierte con LibreOffice y devuelve los bytes del resultado. */
export async function convertirConLibreOffice(o: OpcionesLibreOffice): Promise<Uint8Array> {
  const filtro = FILTROS[o.a];
  if (!filtro) throw new ErrorWolf('conversor.formato', 'Esa conversión no está disponible.');
  const trabajo = await mkdtemp(path.join(os.tmpdir(), 'wolfcore-conv-'));
  try {
    const entrada = path.join(trabajo, `entrada.${o.de}`);
    const salida = path.join(trabajo, 'salida');
    const perfil = path.join(trabajo, 'perfil');
    await writeFile(entrada, o.datos);
    await mkdir(path.join(perfil, 'user'), { recursive: true });
    await writeFile(path.join(perfil, 'user', 'registrymodifications.xcu'), CONFIGURACION_PERFIL);
    const args = [
      `-env:UserInstallation=${pathToFileURL(perfil).href}`,
      '--headless',
      '--norestore',
      '--nolockcheck',
      '--nodefault',
      '--nologo',
      '--convert-to',
      filtro,
      '--outdir',
      salida,
      entrada,
    ];
    let r;
    try {
      r = await (o.lanzar ?? lanzarLibreOffice)(o.soffice, args, {
        plazoMs: o.plazoMs,
        ...(o.senal ? { senal: o.senal } : {}),
      });
    } catch {
      throw new ErrorWolf('conversor.libreoffice_fallo', 'LibreOffice no pudo convertir.');
    }
    if (o.senal?.aborted) throw new ErrorWolf('conversor.cancelado', 'Conversión cancelada.');
    if (r.vencio) {
      throw new ErrorWolf('conversor.plazo', 'La conversión tardó demasiado y se canceló.', {
        segundos: Math.max(1, Math.round(o.plazoMs / 1000)),
      });
    }
    const resultado = path.join(salida, `entrada.${o.a}`);
    let tam: number;
    try {
      tam = (await stat(resultado)).size;
    } catch {
      throw new ErrorWolf('conversor.libreoffice_fallo', 'LibreOffice no pudo convertir.');
    }
    if (r.codigo !== 0 && tam === 0) {
      throw new ErrorWolf('conversor.libreoffice_fallo', 'LibreOffice no pudo convertir.');
    }
    if (tam > o.maxSalida) {
      throw new ErrorWolf('conversor.archivo_grande', 'El resultado pesa demasiado.', {
        maximo: `${Math.round(o.maxSalida / (1024 * 1024))} MB`,
      });
    }
    return new Uint8Array(await readFile(resultado));
  } finally {
    // Tras matar el árbol por el plazo, Windows puede tardar en soltar los archivos: se reintenta.
    await rm(trabajo, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(
      () => undefined,
    );
  }
}
