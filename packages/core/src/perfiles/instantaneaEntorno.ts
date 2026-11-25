import { lstat, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { Rutas } from '../rutas';
import { selloFecha } from '../servicios/actualizar';
import type { Config } from '../tipos';
import { enmascararSecretos } from '../patronesSecretos';
import { esSecreta } from '../proyectos/env/leer';
import { llevaSecreto } from '../proyectos/plantillas';
import { enmascararComando, enmascararNginx, enmascararPhpIni } from './secretos';

/**
 * Instantánea automática del entorno (D27): una copia pequeña de lo que decide cómo se comporta
 * el entorno (la configuración, Nginx y los php.ini), que se toma antes de actualizar PHP o
 * Nginx, antes de importar un perfil o cuando el usuario la pide.
 *
 * Es una **lista blanca**, como un perfil: `config.json` (la completa y validada, para poder volver
 * atrás, sin lo que `esSecreta` reconozca), `etc/nginx/nginx.conf`, `etc/nginx/sites/*.conf` (sin el valor de lo
 * que tenga nombre de secreto) y `etc/php/<rama>/php.ini`. Nunca `etc/secretos/`, las
 * credenciales, `etc/respaldos/`, `etc/acceso-bd/`, `etc/cloudflared/`, `etc/nginx/extras/` (red
 * local y túneles), `instantaneas/`, `papelera/`, `respaldos/`, `tmp/`, `run/`, `ca/`, `certs/`
 * ni `data/`. Va en `<datos>/respaldos/entorno/`, restringida al usuario, con las 10 últimas.
 */

export const MOTIVOS_INSTANTANEA_ENTORNO = ['actualizar', 'importar-perfil', 'manual'] as const;
export type MotivoInstantaneaEntorno = (typeof MOTIVOS_INSTANTANEA_ENTORNO)[number];

/** Cuántas se conservan. */
export const MAX_INSTANTANEAS_ENTORNO = 10;

/** Un archivo más grande que esto no se copia (un vhost o un php.ini no llegan ni cerca). */
const MAX_BYTES_ARCHIVO = 4 * 1024 * 1024;
const MAX_VHOSTS = 2000;

const NOMBRE_VHOST = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.conf$/;
const RAMA_PHP = /^\d{1,2}\.\d{1,2}$/;
const NOMBRE_INSTANTANEA = /^(\d{8}-\d{6})-(actualizar|importar-perfil|manual)(?:-(\d{1,3}))?$/;

export interface DepsInstantaneaEntorno {
  rutas: Pick<Rutas, 'base' | 'config' | 'nginxConf' | 'vhost' | 'phpIni'>;
  /** La configuración ya validada (con sus valores por omisión). */
  leerConfig(): Promise<Config>;
  /** Deja la carpeta solo para el usuario (`Plataforma.restringirAlUsuario`). */
  restringir?: (ruta: string) => Promise<boolean>;
  reloj?: () => Date;
  /** Para pruebas: cuántas se conservan. */
  maximo?: number;
}

export interface InstantaneaEntorno {
  /** Nombre de la carpeta (`AAAAMMDD-HHmmss-<motivo>`). */
  nombre: string;
  motivo: MotivoInstantaneaEntorno;
  /** Fecha y hora de la copia (ISO). */
  creado: string;
}

function carpetaEntorno(d: DepsInstantaneaEntorno): string {
  return path.join(d.rutas.base, 'respaldos', 'entorno');
}

function fallo(motivo: string, causa?: unknown): ErrorWolf {
  return new ErrorWolf(
    'perfiles.instantanea_fallo',
    `No se pudo tomar la instantánea del entorno (${motivo}).`,
    undefined,
    causa === undefined ? undefined : { cause: causa },
  );
}

/** Carpeta de verdad (no un enlace ni una unión): lo que cuelga de ella no sale de `etc/`. */
async function esCarpetaReal(ruta: string): Promise<boolean> {
  const s = await lstat(ruta).catch(() => null);
  return s !== null && s.isDirectory() && !s.isSymbolicLink();
}

/** Quita de un valor de configuración lo que `esSecreta` reconoce (por nombre o por forma). */
function sinSecretos(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(sinSecretos);
  if (valor !== null && typeof valor === 'object') {
    const salida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if ((typeof v === 'string' || typeof v === 'number') && esSecreta(k, String(v))) continue;
      salida[k] = sinSecretos(v);
    }
    return salida;
  }
  return valor;
}

/** La configuración completa (validada), sin secretos: comandos, reglas de Nginx y notas incluidos. */
function configSinSecretos(c: Config): unknown {
  const copia = sinSecretos(c) as Record<string, unknown>;
  const sitios = (copia['sitios'] as Record<string, unknown>[] | undefined) ?? [];
  copia['sitios'] = sitios.map((s) => {
    const x = { ...s };
    if (typeof x['reglasExtra'] === 'string') x['reglasExtra'] = enmascararNginx(x['reglasExtra']);
    if (typeof x['vhostManual'] === 'string') x['vhostManual'] = enmascararNginx(x['vhostManual']);
    if (
      typeof x['nota'] === 'string' &&
      (llevaSecreto(x['nota']) || enmascararSecretos(x['nota']) !== x['nota'])
    )
      x['nota'] = '';
    if (Array.isArray(x['procesos'])) {
      x['procesos'] = (x['procesos'] as Record<string, unknown>[]).map((p) =>
        Array.isArray(p['comando'])
          ? { ...p, comando: enmascararComando(p['comando'] as string[]) }
          : p,
      );
    }
    return x;
  });
  return copia;
}

/** Texto de un archivo normal (nunca un enlace) de tamaño razonable, o null. */
async function leerTexto(ruta: string): Promise<string | null> {
  const s = await lstat(ruta).catch(() => null);
  if (!s || !s.isFile() || s.size > MAX_BYTES_ARCHIVO) return null;
  return readFile(ruta, 'utf8');
}

function interpretar(
  nombre: string,
): { sello: string; motivo: MotivoInstantaneaEntorno; n: number } | null {
  const m = NOMBRE_INSTANTANEA.exec(nombre);
  if (!m) return null;
  return { sello: m[1]!, motivo: m[2] as MotivoInstantaneaEntorno, n: m[3] ? Number(m[3]) : 0 };
}

function aIso(sello: string): string {
  const n = (a: number, b: number): number => Number(sello.slice(a, b));
  return new Date(n(0, 4), n(4, 6) - 1, n(6, 8), n(9, 11), n(11, 13), n(13, 15)).toISOString();
}

/** Las instantáneas que hay, de la más nueva a la más vieja. */
export async function listarInstantaneasEntorno(
  d: DepsInstantaneaEntorno,
): Promise<InstantaneaEntorno[]> {
  const raiz = carpetaEntorno(d);
  const nombres = await readdir(raiz, { withFileTypes: true }).catch(() => []);
  const lista: (InstantaneaEntorno & { sello: string; n: number })[] = [];
  for (const e of nombres) {
    const i = e.isDirectory() ? interpretar(e.name) : null;
    if (!i) continue;
    lista.push({ nombre: e.name, motivo: i.motivo, creado: aIso(i.sello), sello: i.sello, n: i.n });
  }
  lista.sort(
    (a, b) => b.sello.localeCompare(a.sello) || b.n - a.n || b.motivo.localeCompare(a.motivo),
  );
  return lista.map(({ nombre, motivo, creado }) => ({ nombre, motivo, creado }));
}

/** Escribe lo que hay que copiar en `destino`; devuelve cuántos archivos puso. */
async function copiarEntorno(d: DepsInstantaneaEntorno, destino: string): Promise<number> {
  let n = 0;
  const poner = async (rel: string, texto: string): Promise<void> => {
    const ruta = path.join(destino, ...rel.split('/'));
    await mkdir(path.dirname(ruta), { recursive: true });
    await writeFile(ruta, texto, { flag: 'wx' });
    n += 1;
  };

  // Configuración: la misma forma que un perfil (sin secretos, sin red local, FTP ni túnel con
  // nombre). Un `config.json` ilegible o inválido no se copia a ciegas.
  const config = await d.leerConfig().catch((e: unknown) => {
    throw fallo('config.json', e);
  });
  const hayConfig = (await lstat(d.rutas.config()).catch(() => null))?.isFile() === true;
  if (hayConfig) {
    await poner('config.json', JSON.stringify(configSinSecretos(config), null, 2));
  }

  const nginx = await leerTexto(d.rutas.nginxConf());
  if (nginx !== null) await poner('nginx/nginx.conf', enmascararNginx(nginx));

  const carpetaVhosts = path.dirname(d.rutas.vhost('x'));
  const vhosts = (
    (await esCarpetaReal(carpetaVhosts))
      ? await readdir(carpetaVhosts, { withFileTypes: true }).catch(() => [])
      : []
  )
    .filter((e) => e.isFile() && NOMBRE_VHOST.test(e.name))
    .map((e) => e.name)
    .sort()
    .slice(0, MAX_VHOSTS);
  for (const nombre of vhosts) {
    const texto = await leerTexto(path.join(carpetaVhosts, nombre));
    if (texto !== null) await poner(`nginx/sites/${nombre}`, enmascararNginx(texto));
  }

  const carpetaPhp = path.dirname(path.dirname(d.rutas.phpIni('0.0')));
  const ramas = (
    (await esCarpetaReal(carpetaPhp))
      ? await readdir(carpetaPhp, { withFileTypes: true }).catch(() => [])
      : []
  )
    .filter((e) => e.isDirectory() && RAMA_PHP.test(e.name))
    .map((e) => e.name)
    .sort();
  for (const rama of ramas) {
    if (!(await esCarpetaReal(path.dirname(d.rutas.phpIni(rama))))) continue;
    const texto = await leerTexto(d.rutas.phpIni(rama));
    if (texto !== null) await poner(`php/${rama}/php.ini`, enmascararPhpIni(texto));
  }
  return n;
}

/** Borra las más viejas hasta dejar `maximo` (solo carpetas con el nombre de una instantánea). */
async function aplicarRetencion(d: DepsInstantaneaEntorno, nueva: string): Promise<void> {
  const raiz = carpetaEntorno(d);
  // La recién tomada nunca se borra (aunque el reloj haya retrocedido y parezca la más vieja).
  const lista = (await listarInstantaneasEntorno(d)).filter((x) => x.nombre !== nueva);
  for (const x of lista.slice((d.maximo ?? MAX_INSTANTANEAS_ENTORNO) - 1)) {
    const ruta = path.join(raiz, x.nombre);
    // Nunca se sigue un enlace: `rm` quita el enlace, no su destino, y aun así se comprueba.
    const s = await lstat(ruta).catch(() => null);
    if (s?.isDirectory() && !s.isSymbolicLink()) {
      await rm(ruta, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

/**
 * Toma la instantánea y devuelve su carpeta (o `''` si no había nada que copiar). Si falla,
 * lanza `perfiles.instantanea_fallo` y no deja una carpeta a medias: quien llama no debe seguir
 * con el cambio que iba a proteger.
 */
export async function tomarInstantaneaEntorno(
  d: DepsInstantaneaEntorno,
  motivo: MotivoInstantaneaEntorno,
): Promise<string> {
  if (!(MOTIVOS_INSTANTANEA_ENTORNO as readonly string[]).includes(motivo)) {
    throw fallo('motivo');
  }
  const raiz = carpetaEntorno(d);
  const sello = selloFecha(d.reloj?.() ?? new Date());
  const parcial = path.join(raiz, `.${sello}-${motivo}.${process.pid}.parcial`);
  let creada = false;
  try {
    await mkdir(raiz, { recursive: true, mode: 0o700 });
    // Restringida antes de escribir: lo que se cree dentro hereda el permiso.
    await restringir(d, raiz);
    await rm(parcial, { recursive: true, force: true });
    await mkdir(parcial, { mode: 0o700 });
    creada = true;
    const n = await copiarEntorno(d, parcial);
    if (n === 0) {
      await rm(parcial, { recursive: true, force: true });
      await limpiarSiVacia(raiz);
      return '';
    }
    let nombre = `${sello}-${motivo}`;
    let final = path.join(raiz, nombre);
    for (let i = 2; await existe(final); i++) {
      if (i > 999) throw fallo('nombre');
      nombre = `${sello}-${motivo}-${i}`;
      final = path.join(raiz, nombre);
    }
    await rename(parcial, final);
    creada = false;
    await restringir(d, final);
    await aplicarRetencion(d, nombre);
    return final;
  } catch (e) {
    if (creada) await rm(parcial, { recursive: true, force: true }).catch(() => undefined);
    await limpiarSiVacia(raiz);
    throw e instanceof ErrorWolf ? e : fallo('copia', e);
  }
}

async function existe(ruta: string): Promise<boolean> {
  return (await lstat(ruta).catch(() => null)) !== null;
}

/** Una carpeta de instantáneas recién creada y sin nada dentro no se deja. */
async function limpiarSiVacia(raiz: string): Promise<void> {
  const dentro = await readdir(raiz).catch(() => null);
  if (dentro && dentro.length === 0)
    await rm(raiz, { recursive: true, force: true }).catch(() => undefined);
}

/**
 * Restringe al usuario; si el sistema no puede, la copia sigue (no lleva secretos) y queda en el
 * registro.
 */
async function restringir(d: DepsInstantaneaEntorno, ruta: string): Promise<void> {
  const ok = (await d.restringir?.(ruta).catch(() => false)) === true;
  if (d.restringir && !ok) {
    console.warn(
      `No se pudo restringir al usuario la instantánea del entorno (${path.basename(ruta)}).`,
    );
  }
}
