import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rutas } from '../rutas';

/**
 * Precarga de Node (`--require`) de WolfCore Dev: cualquier servidor de Node (Express, Nest, lo
 * que arranque `npm run start`) que escuche sin dirección, o en `0.0.0.0`, `::` o `''`, queda en
 * `127.0.0.1`. Las plantillas de Express y Nest llaman a `listen(puerto)` e ignoran `HOST`, así
 * que no basta con pasar la variable. Se envuelve `net.Server.prototype.listen` (también lo usa
 * `http`) en todas sus firmas: `(puerto)`, `(puerto, cb)`, `(puerto, host, …)`, `({ puerto, host })`.
 * Una ruta de pipe, un `fd` o un manejador ya creado se dejan tal cual; un host concreto
 * (`127.0.0.1`, `::1`, `localhost`, una IP) tampoco se toca.
 *
 * Va como texto del núcleo y se escribe en la carpeta de datos (como los archivos de depuración):
 * así funciona igual en desarrollo y empaquetado, sin depender de `asar`.
 */
export const ESCUCHA_LOCAL_CJS = `'use strict';
// WolfCore Dev: los servidores de Node de un proyecto escuchan solo en 127.0.0.1.
const net = require('node:net');
const LOCAL = '127.0.0.1';
const ABIERTOS = new net.BlockList();
ABIERTOS.addAddress('0.0.0.0');
ABIERTOS.addAddress('::', 'ipv6');
ABIERTOS.addAddress('::ffff:0.0.0.0', 'ipv6');
// Sin host o con un host "abierto" en cualquiera de sus formas ("[::]", "0:0::0", "::ffff:0.0.0.0").
// Una dirección que no se entiende se deja tal cual: la vigilancia de WolfCore Dev hace de respaldo.
function sinHost(h) {
  if (h === undefined || h === null) return true;
  let t = String(h).trim();
  if (t === '') return true;
  t = t.replace(/^\\[(.*)\\]$/, '$1');
  try {
    return ABIERTOS.check(t, net.isIPv6(t) ? 'ipv6' : 'ipv4');
  } catch {
    return false;
  }
}
const esPuerto = (p) => typeof p === 'number' || (typeof p === 'string' && /^\\d+$/.test(p.trim()));
const original = net.Server.prototype.listen;

function ajustar(args) {
  const a0 = args[0];
  // listen() y listen(cb): puerto al azar en todas las interfaces.
  if (args.length === 0 || typeof a0 === 'function') return [0, LOCAL, ...args];
  if (a0 !== null && typeof a0 === 'object') {
    // Manejador ya creado, descriptor o pipe: no es TCP por dirección.
    if (a0._handle || a0.handle || a0.fd !== undefined || a0.path !== undefined) return args;
    if (a0.port === undefined || a0.port === null) return args;
    if (!sinHost(a0.host)) return args;
    const opciones = Object.assign({}, a0, { host: LOCAL });
    delete opciones.ipv6Only;
    return [opciones, ...args.slice(1)];
  }
  if (!esPuerto(a0)) return args; // ruta de pipe
  const a1 = args[1];
  if (typeof a1 === 'string') return sinHost(a1) ? [a0, LOCAL, ...args.slice(2)] : args;
  // (puerto), (puerto, cb), (puerto, backlog), (puerto, backlog, cb): se inserta el host.
  return [a0, LOCAL, ...args.slice(1)];
}

net.Server.prototype.listen = function listen(...args) {
  let nuevos = args;
  try {
    nuevos = ajustar(args);
  } catch {
    nuevos = args;
  }
  return original.apply(this, nuevos);
};
`;

/** Escribe el archivo solo si cambió (temporal + rename). */
async function escribirSiCambia(ruta: string, contenido: string): Promise<void> {
  if ((await readFile(ruta, 'utf8').catch(() => null)) === contenido) return;
  await mkdir(path.dirname(ruta), { recursive: true });
  const tmp = `${ruta}.${process.pid}.tmp`;
  await writeFile(tmp, contenido, 'utf8');
  await rename(tmp, ruta);
}

/** Ruta absoluta de la precarga en la carpeta de datos, ya escrita y al día. */
export async function asegurarEscuchaLocal(rutas: Rutas): Promise<string> {
  const ruta = rutas.herramientas('escucha-local.cjs');
  await escribirSiCambia(ruta, ESCUCHA_LOCAL_CJS);
  return ruta;
}

/**
 * `NODE_OPTIONS` con la precarga añadida a lo que ya hubiera (las opciones del usuario se
 * conservan). La ruta va entre comillas dobles (la carpeta de datos puede tener espacios) y con
 * `/`: dentro de comillas, NODE_OPTIONS trata `\` como escape (`C:\Users` llegaba como
 * `C:Users` y Node no arrancaba). Windows entiende `/`; lo que aún pudiera estorbar se escapa.
 */
export function nodeOptionsConEscuchaLocal(previo: string | undefined, ruta: string): string {
  const segura = ruta.replace(/\\/g, '/').replace(/"/g, '\\"');
  const propia = `--require "${segura}"`;
  return previo && previo.trim() !== '' ? `${previo.trim()} ${propia}` : propia;
}
