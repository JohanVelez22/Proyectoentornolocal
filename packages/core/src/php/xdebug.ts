import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { applyEdits, modify, parse, type ParseError } from 'jsonc-parser';
import { ErrorWolf } from '../errores';
import { copiaConFecha } from '../herramientas/copiaConFecha';
import { MODOS_XDEBUG, type Sitio, type XdebugSitio } from '../tipos';
import { codificarIni, decodificarIni, diffLineas } from './ini';

export type { XdebugSitio } from '../tipos';

/** Tamaño máximo de un `.vscode/launch.json` que se acepta fusionar. */
const MAX_BYTES_LAUNCH = 1024 * 1024;

/** Nombre de la configuración de VS Code de un sitio (la fusión se hace por este nombre). */
export const NOMBRE_LAUNCH = (dominio: string): string => `WolfCore Xdebug (${dominio})`;

const argumento = (campo: string): ErrorWolf =>
  new ErrorWolf('php.argumento_invalido', `Dato de Xdebug no válido (${campo}).`, { campo });

/**
 * Ajustes de Xdebug que llegan de la interfaz: activo, modos (sin repetir), puerto del IDE
 * 1024–65535 e inicio `trigger` o `yes`. null = sin Xdebug. Cualquier otra cosa,
 * `php.argumento_invalido`.
 */
export function validarXdebug(v: unknown): XdebugSitio | null {
  if (v === null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) throw argumento('xdebug');
  const o = v as Record<string, unknown>;
  const claves = Object.keys(o).sort().join(',');
  if (claves !== 'activo,inicio,modo,puerto') throw argumento('xdebug');
  if (typeof o.activo !== 'boolean') throw argumento('activo');
  if (
    !Array.isArray(o.modo) ||
    o.modo.length === 0 ||
    o.modo.length > MODOS_XDEBUG.length ||
    !o.modo.every((m) => (MODOS_XDEBUG as readonly unknown[]).includes(m))
  ) {
    throw argumento('modo');
  }
  if (!Number.isInteger(o.puerto) || (o.puerto as number) < 1024 || (o.puerto as number) > 65535) {
    throw argumento('puerto');
  }
  if (o.inicio !== 'trigger' && o.inicio !== 'yes') throw argumento('inicio');
  return {
    activo: o.activo,
    modo: [...new Set(o.modo as XdebugSitio['modo'])],
    puerto: o.puerto as number,
    inicio: o.inicio,
  };
}

/**
 * Líneas de php.ini de Xdebug para un pool propio: la DLL por ruta (si `rutaDll`; null cuando el
 * ini de la rama ya la carga), modos, cliente solo en 127.0.0.1, puerto e inicio. '' si está
 * apagado.
 */
export function xdebugIni(x: XdebugSitio, rutaDll: string | null): string {
  if (!x.activo) return '';
  return [
    ...(rutaDll ? [`zend_extension="${rutaDll.replace(/\\/g, '/')}"`] : []),
    `xdebug.mode=${x.modo.join(',')}`,
    'xdebug.client_host=127.0.0.1',
    `xdebug.client_port=${x.puerto}`,
    `xdebug.start_with_request=${x.inicio}`,
  ].join('\n');
}

/** Configuración de VS Code (extensión PHP Debug) del sitio: escucha solo en 127.0.0.1. */
function configuracionVsCode(s: Sitio): Record<string, unknown> {
  return {
    name: NOMBRE_LAUNCH(s.dominio),
    type: 'php',
    request: 'launch',
    port: s.xdebug?.puerto ?? 9003,
    hostname: '127.0.0.1',
  };
}

const invalido = (): ErrorWolf =>
  new ErrorWolf(
    'xdebug.launch_invalido',
    'El .vscode/launch.json del proyecto no se puede interpretar; no se cambió nada.',
  );

const eolDe = (t: string): string => (t.includes('\r\n') ? '\r\n' : '\n');

/**
 * `launch.json` con la configuración del sitio: nuevo si `existente` es null; si no, se fusiona
 * por `name` con jsonc-parser (se reemplaza solo la suya; las demás y los comentarios quedan).
 * Un archivo que no se puede interpretar lanza `xdebug.launch_invalido`.
 */
export function launchJson(s: Sitio, existente: string | null): string {
  const config = configuracionVsCode(s);
  if (existente === null) {
    return `${JSON.stringify({ version: '0.2.0', configurations: [config] }, null, 2)}\n`;
  }
  const errores: ParseError[] = [];
  const v = parse(existente, errores, {
    allowTrailingComma: true,
    disallowComments: false,
  }) as Record<string, unknown> | null;
  if (errores.length > 0 || v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw invalido();
  }
  const opciones = {
    formattingOptions: { insertSpaces: true, tabSize: 2, eol: eolDe(existente) },
  };
  if (v.configurations === undefined) {
    return applyEdits(existente, modify(existente, ['configurations'], [config], opciones));
  }
  if (!Array.isArray(v.configurations)) throw invalido();
  const i = v.configurations.findIndex(
    (c) => c !== null && typeof c === 'object' && (c as { name?: unknown }).name === config.name,
  );
  if (i >= 0 && JSON.stringify(v.configurations[i]) === JSON.stringify(config)) return existente;
  const ruta = ['configurations', i >= 0 ? i : v.configurations.length];
  return applyEdits(
    existente,
    modify(existente, ruta, config, { ...opciones, ...(i >= 0 ? {} : { isArrayInsertion: true }) }),
  );
}

/** Ruta de `.vscode/launch.json` del proyecto; lanza si `.vscode` o el archivo son enlaces. */
async function rutaLaunch(s: Sitio): Promise<{ carpeta: string; archivo: string }> {
  const carpeta = path.join(s.carpeta, '.vscode');
  const archivo = path.join(carpeta, 'launch.json');
  for (const r of [carpeta, archivo]) {
    const st = await lstat(r).catch(() => null);
    if (st && (st.isSymbolicLink() || (r === carpeta ? !st.isDirectory() : !st.isFile()))) {
      throw new ErrorWolf(
        'xdebug.launch_no_seguro',
        'La carpeta .vscode o su launch.json son un enlace u otra cosa: no se escribe ahí.',
      );
    }
  }
  return { carpeta, archivo };
}

/**
 * Bytes y texto del launch.json: UTF-8 sin el BOM (se vuelve a poner al escribir) o, si no es
 * UTF-8, byte a byte (un comentario en cp1252 no se pierde). null si no existe.
 */
async function leerExistente(archivo: string): Promise<{ bytes: Buffer; texto: string } | null> {
  let b: Buffer;
  try {
    b = await readFile(archivo);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
  if (b.length > MAX_BYTES_LAUNCH) throw invalido();
  return { bytes: b, texto: decodificarIni(b) };
}

function exigirXdebug(s: Sitio): void {
  if (!s.xdebug) {
    throw new ErrorWolf(
      'xdebug.sin_configurar',
      'Configure Xdebug en el sitio antes de generar el launch.json.',
    );
  }
}

/** Lo que se escribiría en `.vscode/launch.json` (para confirmarlo antes): contenido y diff. */
export async function vistaLaunchJson(
  s: Sitio,
): Promise<{ existe: boolean; contenido: string; diff: string }> {
  exigirXdebug(s);
  const { archivo } = await rutaLaunch(s);
  const existente = await leerExistente(archivo);
  const contenido = launchJson(s, existente?.texto ?? null);
  return {
    existe: existente !== null,
    contenido,
    diff: diffLineas(existente?.texto ?? '', contenido),
  };
}

/**
 * Escribe `.vscode/launch.json` del proyecto con la configuración del sitio (fusionada con la que
 * haya). Antes copia la anterior con fecha en `carpetaRespaldos` (fuera del proyecto); escribe en
 * un temporal al lado y renombra. Nunca sigue enlaces.
 */
export async function escribirLaunchJson(
  s: Sitio,
  carpetaRespaldos: string,
  ahora: Date = new Date(),
): Promise<{ creado: boolean; respaldo: string | null }> {
  exigirXdebug(s);
  const { carpeta, archivo } = await rutaLaunch(s);
  const existente = await leerExistente(archivo);
  const contenido = launchJson(s, existente?.texto ?? null);
  if (existente && contenido === existente.texto) return { creado: false, respaldo: null };
  // Copia de los bytes originales (BOM y codificación incluidos).
  const respaldo =
    existente === null
      ? null
      : path.basename(await copiaConFecha(carpetaRespaldos, 'launch.json', existente.bytes, ahora));
  const bytes = existente
    ? codificarIni(contenido, existente.bytes)
    : Buffer.from(contenido, 'utf8');
  await mkdir(carpeta, { recursive: true });
  const tmp = path.join(carpeta, `.launch.json.wolfcore-${randomBytes(4).toString('hex')}`);
  await writeFile(tmp, bytes);
  try {
    await rename(tmp, archivo);
  } catch (e) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
  return { creado: existente === null, respaldo };
}

/** Qué configurar en PhpStorm para depurar el sitio (se muestra para copiar). */
export function configPhpStorm(s: Sitio): string {
  const puerto = s.xdebug?.puerto ?? 9003;
  return [
    `Settings > PHP > Debug > Xdebug > Debug port: ${puerto}`,
    `Settings > PHP > Servers > Name: ${s.dominio}`,
    `Settings > PHP > Servers > Host: ${s.dominio}  Port: ${s.https ? 443 : 80}  Debugger: Xdebug`,
    'Run > Start Listening for PHP Debug Connections',
  ].join('\n');
}
