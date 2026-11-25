import { createHash, randomBytes } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import {
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  statfs,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { Transform, Writable, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';
import { leerBaseDelProyecto } from '../bd/baseProyecto';
import { generarClaveBd, usuarioDeProyecto } from '../bd/usuarioProyecto';
import { huellaDeFila } from '../catalogo/tablaVersiones';
import { huellaSha1, huellaSha256, restriccionesDeCa } from '../https/ca';
import type { HuellaFila } from '../catalogo/tablaVersiones';
import { ErrorWolf, esErrorWolf } from '../errores';
import { esRutaLocalAbsoluta, esRutaProtegida } from '../importar/comun';
import { enmascararSecretos } from '../patronesSecretos';
import { idSitioSeguro } from '../tuneles/proveedor';
import type { Config, IdServicioDatos, Sitio } from '../tipos';
import { cifrarConFrase, descifrarConFrase, LlaveFrase } from './cifrado';
import { sha256Archivo } from './exportar';
import {
  fusionarConfig,
  entradaPeligrosa,
  leerManifiesto,
  parsearInstanciaPerfil,
  rutaPermitidaEnPerfil,
  sitioImportado,
  type ManifiestoPerfil,
} from './manifiesto';
import { reasignarRutas, restoSeguro } from './reasignar';
import {
  LIMITES_PERFIL,
  type DepsPerfiles,
  type LimitesPerfil,
  type OpcionesImportarPerfil,
  type ResultadoImportarPerfil,
  type VistaPreviaPerfil,
  type AvisoPerfil,
  type VolcadosBase,
} from './tipos';

const danado = (detalle?: string): ErrorWolf =>
  new ErrorWolf(
    'perfiles.danado',
    `El perfil está dañado o fue modificado${detalle ? `: ${detalle}` : ''}.`,
  );

const MOTORES_SQL: readonly IdServicioDatos[] = ['mysql', 'mariadb', 'postgresql'];

/** Versiones que una importación descarga como máximo (la vista previa dice cuántas serían). */
export const MAX_INSTALAR_POR_PERFIL = 6;

/** Corta un flujo que trae más bytes de los que se permiten (un ZIP que miente en su cabecera). */
class Tope extends Transform {
  private n = 0;
  constructor(private readonly max: number) {
    super();
  }
  override _transform(trozo: Buffer, _c: BufferEncoding, cb: TransformCallback): void {
    this.n += trozo.length;
    if (this.n > this.max) cb(danado('un archivo es más grande de lo que dice'));
    else cb(null, trozo);
  }
}

/** Un perfil abierto: manifiesto validado y huellas comprobadas (y, si se extrajo, en `dir`). */
export interface PerfilAbierto {
  /** Carpeta con lo extraído, o null si solo se verificó (vista previa: nada en disco). */
  dir: string | null;
  manifiesto: ManifiestoPerfil;
  ignoradas: number;
  /** SHA-256 del archivo `.wolfperfil` entero. */
  huellaArchivo: string;
  /** Bytes (descomprimidos) de lo que se extrae. */
  bytes: number;
}

/**
 * Proporción máxima entre lo descomprimido y lo comprimido de una entrada de más de 1 MiB: todo
 * lo grande de un perfil va cifrado (no se comprime) o ya comprimido; una proporción alta delata
 * una bomba de descompresión.
 */
export const MAX_PROPORCION_ZIP = 100;

/**
 * Recorre un `.wolfperfil`: **rechaza el perfil entero** si alguna entrada es peligrosa
 * (zip-slip, ruta absoluta, unidad, `:`, controles, nombre reservado), pasa los topes o se infla
 * demasiado; lo que no es de la lista blanca (`etc/`, `instantaneas/`, `run/`…) se cuenta y se
 * ignora sin leerlo. Del resto calcula la huella **en flujo** (con un tope real de bytes). Con
 * `dir` además lo escribe allí; sin `dir` no escribe nada. Devuelve el manifiesto (leído en
 * memoria) y las huellas.
 */
async function recorrerPerfil(
  archivo: string,
  dir: string | null,
  limites: LimitesPerfil,
): Promise<{
  manifiesto: Buffer | null;
  huellas: Map<string, string>;
  ignoradas: number;
  bytes: number;
}> {
  const zip = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.open(archivo, { lazyEntries: true, autoClose: false }, (e, z) =>
      e || !z ? reject(e ?? new Error('zip')) : resolve(z),
    );
  }).catch(() => {
    throw danado('no es un archivo de perfil');
  });
  let ignoradas = 0;
  let manifiesto: Buffer | null = null;
  const huellas = new Map<string, string>();
  let bytes = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      let entradas = 0;
      let fallo = false;
      const abortar = (e: unknown): void => {
        if (fallo) return;
        fallo = true;
        reject(e);
      };
      zip.on('error', () => abortar(danado('el archivo comprimido no es válido')));
      zip.on('end', () => {
        if (!fallo) resolve();
      });
      zip.on('entry', (e: yauzl.Entry) => {
        void (async () => {
          entradas++;
          if (entradas > limites.maxEntradas) throw danado('trae demasiados archivos');
          if (entradaPeligrosa(e.fileName)) throw danado('trae una ruta que no corresponde');
          const nombre = e.fileName.replace(/\\/g, '/');
          if (nombre.endsWith('/')) {
            zip.readEntry();
            return;
          }
          if (!rutaPermitidaEnPerfil(nombre)) {
            ignoradas++;
            zip.readEntry();
            return;
          }
          if (huellas.has(nombre) || (nombre === 'manifiesto.json' && manifiesto)) {
            throw danado('trae un archivo repetido');
          }
          const tope =
            nombre === 'manifiesto.json'
              ? limites.maxBytesManifiesto
              : nombre === 'ca.cifrada'
                ? limites.maxBytesCa
                : limites.maxBytesArchivo;
          bytes += e.uncompressedSize;
          if (e.uncompressedSize > tope || bytes > limites.maxBytes) {
            throw new ErrorWolf('perfiles.demasiado_grande', 'El perfil es demasiado grande.', {
              maximo: tamanoLegible(Math.min(tope, limites.maxBytes)),
            });
          }
          if (
            e.uncompressedSize > 1024 * 1024 &&
            e.uncompressedSize > MAX_PROPORCION_ZIP * Math.max(1, e.compressedSize)
          ) {
            throw danado('un archivo se infla demasiado al descomprimirlo');
          }
          const lectura = await new Promise<NodeJS.ReadableStream>((res, rej) => {
            zip.openReadStream(e, (err, s) => (err || !s ? rej(err ?? new Error('x')) : res(s)));
          });
          if (nombre === 'manifiesto.json') {
            const partes: Buffer[] = [];
            await pipeline(
              lectura,
              new Tope(tope),
              new Writable({
                write(trozo: Buffer, _c, cb) {
                  partes.push(trozo);
                  cb();
                },
              }),
            );
            manifiesto = Buffer.concat(partes);
          } else {
            const h = createHash('sha256');
            const pasos: NodeJS.WritableStream[] = [];
            const hash = new Transform({
              transform(trozo: Buffer, _c, cb) {
                h.update(trozo);
                cb(null, trozo);
              },
            });
            if (dir) {
              const destino = path.join(dir, ...nombre.split('/'));
              // Doble comprobación de zip-slip sobre la ruta ya resuelta.
              const rel = path.relative(dir, destino);
              if (rel.startsWith('..') || path.isAbsolute(rel)) throw danado('ruta fuera');
              await mkdir(path.dirname(destino), { recursive: true });
              pasos.push(createWriteStream(destino, { flags: 'wx' }));
              await pipeline(lectura, new Tope(tope), hash, pasos[0]!);
            } else {
              await pipeline(
                lectura,
                new Tope(tope),
                hash,
                new Writable({
                  write(_t: Buffer, _c, cb) {
                    cb();
                  },
                }),
              );
            }
            huellas.set(nombre, h.digest('hex'));
          }
          if (!fallo) zip.readEntry();
        })().catch((err: unknown) =>
          abortar(esErrorWolf(err) ? err : danado('no se pudo leer un archivo')),
        );
      });
      zip.readEntry();
    });
  } finally {
    zip.close();
  }
  return { manifiesto, huellas, ignoradas, bytes };
}

/** "64 GB", "512 MB": para los mensajes de tamaño. */
export function tamanoLegible(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${Math.floor(mb / 1024)} GB` : `${Math.max(1, Math.floor(mb))} MB`;
}

/**
 * Abre un `.wolfperfil`. Sin `dir` (vista previa) solo lee el manifiesto y verifica las huellas en
 * flujo, sin escribir nada; con `dir` (importar) antes comprueba el espacio libre y luego extrae
 * lo de la lista blanca. Cada archivo debe coincidir con la huella del manifiesto; lo que el
 * manifiesto no declara no se usa.
 */
export async function abrirPerfil(
  archivo: string,
  dir: string | null,
  limites: LimitesPerfil = LIMITES_PERFIL,
  espacioLibre?: (ruta: string) => Promise<number | null>,
): Promise<PerfilAbierto> {
  const info = await lstat(archivo).catch(() => null);
  if (!info?.isFile())
    throw new ErrorWolf('perfiles.no_existe', 'El archivo del perfil no existe.');
  if (info.size > limites.maxBytesPerfil) {
    throw new ErrorWolf('perfiles.demasiado_grande', 'El perfil es demasiado grande.', {
      maximo: tamanoLegible(limites.maxBytesPerfil),
    });
  }
  // Primero, solo verificar (nada en disco).
  const v = await recorrerPerfil(archivo, null, limites);
  if (!v.manifiesto) throw danado('falta el manifiesto');
  let bruto: unknown;
  try {
    bruto = JSON.parse(
      v.manifiesto.toString('utf8').replace(new RegExp(`^${String.fromCharCode(0xfeff)}`), ''),
    );
  } catch {
    throw danado('el manifiesto no es válido');
  }
  const manifiesto = leerManifiesto(bruto);
  if (manifiesto.ca && huellaSha256(manifiesto.ca.certificado) !== manifiesto.ca.huella) {
    throw danado('el certificado de la CA no coincide con su huella');
  }
  const comprobar = (huellas: Map<string, string>): void => {
    for (const [rel, huella] of Object.entries(manifiesto.archivos)) {
      if (!huellas.has(rel)) throw danado('falta un archivo');
      if (huellas.get(rel) !== huella) throw danado('un archivo no coincide con su huella');
    }
  };
  comprobar(v.huellas);
  let ignoradas =
    v.ignoradas + [...v.huellas.keys()].filter((r) => !(r in manifiesto.archivos)).length;
  if (dir) {
    await mkdir(dir, { recursive: true });
    // Lo extraído y, con bases, su versión descifrada: el doble más un margen.
    const necesarios = v.bytes * 2 + 64 * 1024 * 1024;
    const libres = await (espacioLibre ?? espacioLibreDe)(dir).catch(() => null);
    if (libres !== null && libres < necesarios) {
      throw new ErrorWolf(
        'perfiles.sin_espacio',
        'No hay espacio libre suficiente para importar el perfil.',
        {
          necesarios: tamanoLegible(necesarios),
          libres: tamanoLegible(libres),
        },
      );
    }
    const x = await recorrerPerfil(archivo, dir, limites);
    // Lo escrito es lo verificado (el archivo pudo cambiar entre las dos lecturas).
    comprobar(x.huellas);
    for (const rel of x.huellas.keys()) {
      if (!(rel in manifiesto.archivos))
        await rm(path.join(dir, ...rel.split('/')), { force: true });
    }
    ignoradas =
      x.ignoradas + [...x.huellas.keys()].filter((r) => !(r in manifiesto.archivos)).length;
  }
  return {
    dir,
    manifiesto,
    ignoradas,
    huellaArchivo: await sha256Archivo(archivo),
    bytes: v.bytes,
  };
}

async function espacioLibreDe(ruta: string): Promise<number | null> {
  try {
    const s = await statfs(ruta);
    return Number(s.bavail) * Number(s.bsize);
  } catch {
    return null;
  }
}

/* ───────────── Planificación (lo que ve la vista previa y aplica la importación) ───────────── */

interface PlanSitio {
  sitio: Sitio;
  existe: boolean;
  omitido: string | null;
  motivos: string[];
}

interface PlanInstancia {
  id: string;
  servicio: IdServicioDatos;
  clave: string;
  version: string;
  puertoOriginal: number;
  puerto: number;
  existente: boolean;
  reasignado: boolean;
  sinPuerto: boolean;
}

interface Plan {
  config: Config | null;
  /** Configuración fusionada (sin sitios ni instancias nuevas) y lo que se le quitó. */
  fusion: { config: Config; quitados: string[] };
  sitios: PlanSitio[];
  instancias: PlanInstancia[];
  versiones: VistaPreviaPerfil['versiones'];
  reemplaza: string[];
  plantillasExistentes: Set<string>;
  puertosOcupados: number[];
}

async function leerConfigExistente(d: DepsPerfiles): Promise<Config | null> {
  if (!existsSync(d.rutas.config())) return null;
  return d.leerConfig();
}

/** Puertos que ya usa la configuración (instancias y servicios propios). */
function puertosDeConfig(c: Config | null): Set<number> {
  const s = new Set<number>();
  if (!c) return s;
  s.add(c.servicios.nginx.puerto);
  s.add(c.https.puerto);
  s.add(c.mcp.puerto);
  s.add(c.ftp.puerto);
  s.add(c.depuracion.puerto);
  s.add(c.correo.puertoSmtp);
  for (const d of Object.values(c.servicios.datos)) {
    for (const i of Object.values(d.instancias ?? {})) s.add(i.puerto);
  }
  return s;
}

/** ¿`hija` es `padre` o está dentro (sin distinguir mayúsculas ni separadores)? */
function dentroDe(padre: string, hija: string): boolean {
  const n = (x: string): string =>
    x
      .replace(/[\\/]+/g, '/')
      .replace(/\/+$/, '')
      .toLowerCase();
  return n(hija) === n(padre) || n(hija).startsWith(`${n(padre)}/`);
}

async function planificar(
  d: DepsPerfiles,
  p: PerfilAbierto,
  o: Pick<OpcionesImportarPerfil, 'rutas' | 'prefijos'>,
): Promise<Plan> {
  const protegida = d.rutaProtegida ?? esRutaProtegida;
  const m = p.manifiesto;
  const actual = await leerConfigExistente(d);
  const reemplaza: string[] = [];
  if (actual) reemplaza.push('config.json');

  // Sitios: validados como importados, con las rutas reasignadas.
  const validos: { sitio: Sitio; motivos: string[] }[] = [];
  const omitidosAntes: PlanSitio[] = [];
  for (const bruto of m.sitios) {
    const r = sitioImportado(bruto);
    if (r.sitio) validos.push({ sitio: r.sitio, motivos: r.motivos });
    else {
      const b = (bruto ?? {}) as Partial<Sitio>;
      omitidosAntes.push({
        sitio: {
          id: typeof b.id === 'string' ? b.id.slice(0, 80) : '?',
          nombre: typeof b.nombre === 'string' ? b.nombre.slice(0, 80) : '',
          carpeta: '',
        } as Sitio,
        existe: false,
        omitido: r.motivos[0] ?? 'sitio_invalido',
        motivos: r.motivos,
      });
    }
  }
  const mapa = o.rutas ?? {};
  const reasignados = reasignarRutas(
    validos.map((v) => v.sitio),
    mapa,
    o.prefijos ?? [],
  );
  const sitios: PlanSitio[] = [...omitidosAntes];
  const vistos = new Set<string>();
  const otros = (actual?.sitios ?? []).filter((s) => !validos.some((v) => v.sitio.id === s.id));
  for (let i = 0; i < reasignados.length; i++) {
    const s = reasignados[i]!;
    const motivos = [...validos[i]!.motivos];
    const elegida = Object.prototype.hasOwnProperty.call(mapa, s.id);
    let omitido: string | null = null;
    // Ruta real (sin enlaces ni uniones) de lo que existe; si no existe, la ruta tal cual.
    const real =
      esRutaLocalAbsoluta(s.carpeta) && restoSeguro(s.carpeta)
        ? await realpath(s.carpeta).catch(() => s.carpeta)
        : s.carpeta;
    if (vistos.has(s.id)) omitido = 'sitio_repetido';
    else if (
      !esRutaLocalAbsoluta(s.carpeta) ||
      !restoSeguro(s.carpeta) ||
      // Nunca la carpeta de datos (ni una que la contenga o esté dentro).
      [s.carpeta, real].some((c) => dentroDe(d.rutas.base, c) || dentroDe(c, d.rutas.base)) ||
      // Lo que no eligió el usuario en un diálogo (lo del perfil, también tras cambiar el prefijo)
      // nunca puede ser del sistema, ni por su ruta real.
      (!elegida && (protegida(s.carpeta) || protegida(real)))
    ) {
      omitido = 'ruta_protegida';
    } else if (
      [s.dominio, ...s.alias].some((dom) =>
        otros.some((x) => x.dominio === dom || x.alias.includes(dom)),
      )
    ) {
      omitido = 'dominio_en_uso';
    }
    vistos.add(s.id);
    let existe = false;
    if (!omitido) {
      const info = await stat(s.carpeta).catch(() => null);
      existe = !!info?.isDirectory();
      if (actual?.sitios.some((x) => x.id === s.id)) reemplaza.push(`sitio:${s.id}`);
    }
    sitios.push({ sitio: s, existe, omitido, motivos });
  }

  const fusion = fusionarConfig(m.config, actual);
  const ocupados: number[] = [];
  // Carpeta limpia: los puertos globales del perfil deben estar libres (se listan si no).
  if (!actual) {
    const f = fusion.config;
    for (const p of [
      f.servicios.nginx.puerto,
      f.https.puerto,
      f.mcp.puerto,
      f.ftp.puerto,
      f.depuracion.puerto,
      f.correo.puertoSmtp,
    ]) {
      if (!(await d.puertoLibre(p))) ocupados.push(p);
    }
  }

  // Instancias: las que ya existen se conservan; las nuevas, con un puerto libre.
  const usados = puertosDeConfig(fusion.config);
  if (actual) for (const p of puertosDeConfig(actual)) usados.add(p);
  const instancias: PlanInstancia[] = [];
  for (const i of m.instancias) {
    const id = parsearInstanciaPerfil(i.id);
    if (!id) continue;
    const existenteCfg = actual?.servicios.datos[id.servicio].instancias?.[id.clave];
    if (existenteCfg) {
      instancias.push({
        id: i.id,
        ...id,
        version: existenteCfg.version,
        puertoOriginal: i.puerto,
        puerto: existenteCfg.puerto,
        existente: true,
        reasignado: false,
        sinPuerto: false,
      });
      continue;
    }
    let puerto = i.puerto;
    let reasignado = false;
    let sinPuerto = false;
    if (usados.has(puerto) || !(await d.puertoLibre(puerto))) {
      ocupados.push(i.puerto);
      reasignado = true;
      let nuevo: number | null = null;
      for (let c = Math.max(1024, i.puerto + 1), n = 0; c <= 65535 && n < 300; c++, n++) {
        if (!usados.has(c) && (await d.puertoLibre(c))) {
          nuevo = c;
          break;
        }
      }
      if (nuevo === null) sinPuerto = true;
      else puerto = nuevo;
    }
    usados.add(puerto);
    instancias.push({
      id: i.id,
      ...id,
      version: i.version,
      puertoOriginal: i.puerto,
      puerto,
      existente: false,
      reasignado,
      sinPuerto,
    });
  }

  // Versiones: del catálogo de este equipo (nunca la huella que dice el perfil).
  const versiones: VistaPreviaPerfil['versiones'] = [];
  for (const v of m.versiones) {
    const instalada = await d.versionInstalada(v.servicio, v.version).catch(() => false);
    const disp = await d.buscarVersion(v.servicio, v.version).catch(() => null);
    versiones.push({
      servicio: v.servicio,
      version: v.version,
      disponible: disp !== null,
      instalada,
      huella: disp ? huellaDeFila(disp) : 'ninguna',
    });
  }

  const plantillasExistentes = new Set<string>();
  for (const id of m.plantillas) {
    if (existsSync(path.join(d.rutas.plantillas(), id))) {
      plantillasExistentes.add(id);
      reemplaza.push(`plantilla:${id}`);
    }
  }
  for (const b of m.bases) {
    const inst = instancias.find((x) => x.id === b.instancia);
    if (inst?.existente) {
      const existentes = await d.basesDe(b.instancia).catch(() => [] as string[]);
      if (existentes.some((x) => x.toLowerCase() === b.base.toLowerCase())) {
        reemplaza.push(`base:${b.instancia}/${b.base}`);
      }
    }
  }
  if (m.incluye.ca && existsSync(d.rutas.caCrt())) reemplaza.push('ca');

  return {
    config: actual,
    fusion,
    sitios,
    instancias,
    versiones,
    reemplaza,
    plantillasExistentes,
    puertosOcupados: [...new Set(ocupados)].sort((a, b) => a - b),
  };
}

function huellaVista(p: PerfilAbierto, plan: Plan, o: OpcionesVista): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        archivo: p.huellaArchivo,
        reemplaza: plan.reemplaza,
        sitios: plan.sitios.map((s) => [s.sitio.id, s.sitio.carpeta, s.existe, s.omitido]),
        instancias: plan.instancias.map((i) => [i.id, i.puerto]),
        rutas: o.rutas ?? {},
        prefijos: o.prefijos ?? [],
      }),
    )
    .digest('hex');
}

interface CaPerfil {
  ca: { crt: string; key: string };
  certificados: Record<string, { crt: string; key: string }>;
}

type OpcionesVista = Pick<OpcionesImportarPerfil, 'rutas' | 'prefijos'>;

export class Perfiles {
  constructor(private readonly d: DepsPerfiles) {}

  private get limites(): LimitesPerfil {
    return { ...LIMITES_PERFIL, ...this.d.limites };
  }

  /** Con `extraer`, en una carpeta temporal que se borra al final; sin él, nada en disco. */
  private async conPerfil<T>(
    archivo: string,
    extraer: boolean,
    fn: (p: PerfilAbierto) => Promise<T>,
  ): Promise<T> {
    if (!extraer) return fn(await abrirPerfil(archivo, null, this.limites));
    const tmp = this.d.rutas.tmp();
    await mkdir(tmp, { recursive: true });
    const dir = path.join(tmp, `perfil-abierto-${randomBytes(6).toString('hex')}`);
    try {
      return await fn(await abrirPerfil(archivo, dir, this.limites, this.d.espacioLibre));
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(
        () => undefined,
      );
    }
  }

  /** Lo que haría `importar` en esta carpeta de datos, sin escribir nada. */
  vistaPrevia(archivo: string, o: OpcionesVista = { rutas: {} }): Promise<VistaPreviaPerfil> {
    return this.conPerfil(archivo, false, async (p) => {
      const plan = await planificar(this.d, p, o);
      const m = p.manifiesto;
      return {
        creado: m.creado,
        origen: m.origen,
        incluye: m.incluye,
        sitios: plan.sitios.map((s) => ({
          id: s.sitio.id,
          nombre: s.sitio.nombre,
          carpeta: s.sitio.carpeta,
          existe: s.existe,
          omitido: s.omitido,
        })),
        versiones: plan.versiones,
        instancias: plan.instancias.map((i) => ({
          id: i.id,
          puerto: i.puertoOriginal,
          puertoNuevo: i.reasignado ? (i.sinPuerto ? null : i.puerto) : null,
          existente: i.existente,
        })),
        bases: m.bases.map((b) => ({ instancia: b.instancia, base: b.base })),
        plantillas: m.plantillas.map((id) => ({ id, existe: plan.plantillasExistentes.has(id) })),
        reemplaza: plan.reemplaza,
        puertosOcupados: plan.puertosOcupados,
        ignoradas: p.ignoradas,
        carpetaConDatos: plan.config !== null,
        descargas: Math.min(
          MAX_INSTALAR_POR_PERFIL,
          plan.versiones.filter(
            (v) =>
              !v.instalada && v.disponible && (v.huella === 'fuerte' || v.huella === 'firmada'),
          ).length,
        ),
        requiereFrase: m.bases.length > 0 || m.incluye.ca,
        ca:
          m.ca && m.incluye.ca
            ? {
                huella: m.ca.huella,
                reemplazaLocal: existsSync(this.d.rutas.caCrt()),
                ...estadoCaVista(m.ca.certificado),
              }
            : null,
        configQuitada: plan.fusion.quitados,
        huella: huellaVista(p, plan, o),
      };
    });
  }

  /**
   * Importa el perfil en esta carpeta de datos. Exige `confirmado` y la huella de la vista previa
   * que vio el usuario. Antes de reemplazar nada lo copia en `respaldos/pre-perfil-<fecha>/` (y
   * toma una instantánea de cada base que reemplaza); nunca borra `data/<servicio>`. Todo lo que
   * trae es **importado**: sitios sin confiar, plantillas `importada`, bases por el camino acotado
   * de origen ajeno, usuarios `wolf_u_` con una clave nueva. Lo que no se puede (carpeta que no
   * existe, versión fuera del catálogo o sin huella fuerte, puerto ocupado, instancia apagada)
   * se reasigna o se marca y se sigue con el resto: cada cosa vuelve con su estado.
   */
  async importar(archivo: string, o: OpcionesImportarPerfil): Promise<ResultadoImportarPerfil> {
    if (o?.confirmado !== true) {
      throw new ErrorWolf('perfiles.sin_confirmar', 'Confirme que quiere importar el perfil.');
    }
    return this.conPerfil(archivo, true, (p) => this.aplicar(p, o));
  }

  private async aplicar(
    p: PerfilAbierto,
    o: OpcionesImportarPerfil,
  ): Promise<ResultadoImportarPerfil> {
    const d = this.d;
    const m = p.manifiesto;
    const dir = p.dir;
    if (!dir) throw new Error('El perfil no se extrajo.');
    const plan = await planificar(d, p, o);
    if (o.huella !== huellaVista(p, plan, o)) {
      throw new ErrorWolf(
        'perfiles.vista_previa_vieja',
        'La carpeta de datos o el perfil cambiaron desde la vista previa: revísela otra vez.',
      );
    }
    const avisos: AvisoPerfil[] = [];

    // 1. La CA primero: una frase equivocada no debe dejar nada a medias. Una CA ajena firma lo que
    // quiera: reemplazar la de este equipo exige una confirmación aparte.
    let caDescifrada: CaPerfil | null = null;
    // SHA-1 de la CA de este equipo que la del perfil reemplaza (para ofrecer quitarla de la confianza).
    let caAnterior: string | null = null;
    const frase = typeof o.frase === 'string' && o.frase !== '' ? o.frase : null;
    const conBases = m.bases.length > 0 && o.omitirBases !== true;
    if ((conBases || o.importarCa === true) && !frase) {
      throw new ErrorWolf(
        'perfiles.frase_requerida',
        'Escriba la frase del perfil (o importe sin sus bases).',
      );
    }
    if (m.incluye.ca && 'ca.cifrada' in m.archivos) {
      if (o.importarCa === true && frase) {
        // Una CA con restricciones de nombre que no son las nuestras: nunca. Una sin ninguna (las
        // anteriores a D26) firma cualquier sitio: solo con una confirmación aparte.
        const r = m.ca ? restriccionesDeCa(m.ca.certificado) : 'ilegible';
        if (r === 'ajenas' || r === 'ilegible') {
          throw new ErrorWolf(
            'perfiles.ca_restricciones_ajenas',
            'La CA del perfil tiene restricciones de nombre que no son las de WolfCore Dev: no se importa.',
          );
        }
        if (r === 'ninguna' && o.aceptarCaSinRestricciones !== true) {
          throw new ErrorWolf(
            'perfiles.ca_sin_restricciones',
            'Esta CA puede firmar cualquier sitio web: impórtela solo si es la suya (compare la huella) y confírmelo aparte.',
          );
        }
        if (existsSync(d.rutas.caCrt()) && o.reemplazarCa !== true) {
          throw new ErrorWolf(
            'perfiles.confirmar_reemplazar_ca',
            'El perfil trae una CA y este equipo ya tiene la suya: confirme aparte que quiere reemplazarla.',
          );
        }
        const plano = await descifrarConFrase(await readFile(path.join(dir, 'ca.cifrada')), frase);
        try {
          const j = JSON.parse(plano.toString('utf8')) as Partial<CaPerfil> | null;
          if (
            !j ||
            typeof j.ca?.crt !== 'string' ||
            typeof j.ca?.key !== 'string' ||
            !j.ca.crt.includes('BEGIN CERTIFICATE') ||
            !/BEGIN (RSA |EC )?PRIVATE KEY/.test(j.ca.key)
          ) {
            throw new Error('forma');
          }
          // La que se descifró debe ser la que mostró la vista previa.
          if (
            !m.ca ||
            huellaSha256(j.ca.crt) !== m.ca.huella ||
            huellaSha256(m.ca.certificado) !== m.ca.huella
          ) {
            throw new Error('huella');
          }
          caDescifrada = { ca: j.ca, certificados: j.certificados ?? {} };
        } catch {
          throw danado('la CA no es válida');
        } finally {
          plano.fill(0);
        }
      } else {
        avisos.push({ codigo: 'ca_no_importada' });
      }
    }

    // Los volcados de las bases se descifran antes de tocar nada: una frase equivocada (o un
    // volcado cambiado) no deja nada a medias.
    const claros = new Map<string, VolcadosBase>();
    if (conBases && frase) {
      const llave = new LlaveFrase(frase);
      try {
        for (const b of m.bases) {
          const v = volcadosDe(dir, m, b.instancia, b.base);
          if (!v) continue;
          const claro = async (cifrado: string): Promise<string> => {
            const destino = cifrado.replace(/\.cifrado$/, '');
            await llave.descifrarArchivo(cifrado, destino, this.limites.maxBytesArchivo);
            await rm(cifrado, { force: true });
            return destino;
          };
          claros.set(
            `${b.instancia}/${b.base}`,
            'volcado' in v
              ? { volcado: await claro(v.volcado) }
              : { esquema: await claro(v.esquema), datos: await claro(v.datos) },
          );
        }
      } finally {
        llave.olvidar();
      }
    }

    // La instantánea del entorno, ya con todo validado y antes de escribir nada: sin ella no se
    // importa (la misma garantía que la instantánea previa de una base).
    await d.instantaneaEntorno();

    d.progreso?.({ fase: 'copia', paso: 1, de: 7 });
    // 2. Copia de lo que se reemplaza.
    const fecha = (d.reloj?.() ?? new Date()).toISOString().replace(/[:.]/g, '-');
    let respaldo: string | null = null;
    // La carpeta del respaldo: solo para el usuario desde antes del primer archivo (hereda el permiso).
    const abrirRespaldo = async (): Promise<string> => {
      if (respaldo) return respaldo;
      const raiz = path.join(d.rutas.base, 'respaldos');
      await mkdir(raiz, { recursive: true, mode: 0o700 });
      await limpiarPrePerfil(d, raiz);
      const carpeta = path.join(raiz, `pre-perfil-${fecha}`);
      await mkdir(carpeta, { recursive: true, mode: 0o700 });
      if ((await d.restringir?.(carpeta).catch(() => false)) !== true && d.restringir) {
        console.warn('No se pudo restringir al usuario la copia previa a importar el perfil.');
      }
      respaldo = carpeta;
      return carpeta;
    };
    const copiar = async (origen: string, rel: string): Promise<void> => {
      if (!existsSync(origen)) return;
      const raiz = await abrirRespaldo();
      await mkdir(path.join(raiz, path.dirname(rel)), { recursive: true });
      await cp(origen, path.join(raiz, rel), {
        recursive: true,
        force: false,
        errorOnExist: true,
        dereference: false,
      });
    };
    // Una carpeta con claves privadas (la CA y los certificados): lo público se copia tal cual y las
    // claves (`.key`, `.pem`) van juntas y cifradas con la frase del perfil, nunca en claro.
    const copiarCifrandoClaves = async (origen: string, rel: string): Promise<void> => {
      if (!existsSync(origen)) return;
      const raiz = await abrirRespaldo();
      const esClave = (n: string): boolean => /\.(?:key|pem)$/i.test(n);
      await cp(origen, path.join(raiz, rel), {
        recursive: true,
        force: false,
        errorOnExist: true,
        dereference: false,
        filter: (src) => !esClave(src),
      });
      const claves: Record<string, string> = {};
      const recorrer = async (dir: string, pre: string): Promise<void> => {
        for (const e of await readdir(dir, { withFileTypes: true })) {
          const ruta = path.join(dir, e.name);
          if (e.isDirectory()) await recorrer(ruta, `${pre}${e.name}/`);
          else if (e.isFile() && esClave(e.name)) {
            claves[`${pre}${e.name}`] = (await readFile(ruta)).toString('base64');
          }
        }
      };
      await recorrer(origen, '');
      if (Object.keys(claves).length === 0 || !frase) return;
      await mkdir(path.join(raiz, rel), { recursive: true });
      await writeFile(
        path.join(raiz, rel, 'claves.cifrado'),
        await cifrarConFrase(Buffer.from(JSON.stringify(claves)), frase),
        { flag: 'wx' },
      );
    };
    if (plan.config) await copiar(d.rutas.config(), 'config.json');
    for (const id of plan.plantillasExistentes) {
      await copiar(path.join(d.rutas.plantillas(), id), path.join('plantillas', id));
    }
    if (caDescifrada) {
      await copiarCifrandoClaves(path.dirname(d.rutas.caCrt()), 'ca');
      await copiarCifrandoClaves(path.dirname(d.rutas.certCrt('x')), 'certs');
      if (existsSync(d.rutas.caCrt())) {
        try {
          caAnterior = huellaSha1(await readFile(d.rutas.caCrt(), 'utf8'));
        } catch {
          // una CA anterior ilegible no se puede identificar para quitarla: no se ofrece
        }
      }
    }

    d.progreso?.({ fase: 'versiones', paso: 2, de: 7 });
    // 3. Versiones: con huella fuerte o firma desde el catálogo; las demás quedan pendientes.
    const versiones: ResultadoImportarPerfil['versiones'] = [];
    let instaladasAhora = 0;
    for (const v of plan.versiones) {
      if (v.instalada) {
        versiones.push({
          servicio: v.servicio,
          version: v.version,
          estado: 'ya_instalada',
          motivo: null,
        });
        continue;
      }
      if (!v.disponible) {
        versiones.push({
          servicio: v.servicio,
          version: v.version,
          estado: 'pendiente',
          motivo: 'no_disponible',
        });
        continue;
      }
      if (v.huella !== 'fuerte' && v.huella !== 'firmada') {
        versiones.push({
          servicio: v.servicio,
          version: v.version,
          estado: 'pendiente',
          motivo: 'huella_debil',
        });
        continue;
      }
      // Tope de descargas por importación: el resto queda pendiente (se instala desde Versiones).
      if (instaladasAhora >= MAX_INSTALAR_POR_PERFIL) {
        versiones.push({
          servicio: v.servicio,
          version: v.version,
          estado: 'pendiente',
          motivo: 'tope_descargas',
        });
        continue;
      }
      instaladasAhora++;
      try {
        const disp = await d.buscarVersion(v.servicio, v.version);
        if (!disp || !aceptable(huellaDeFila(disp))) throw new Error('huella');
        await d.instalarVersion(disp);
        versiones.push({
          servicio: v.servicio,
          version: v.version,
          estado: 'instalada',
          motivo: null,
        });
      } catch (e) {
        versiones.push({
          servicio: v.servicio,
          version: v.version,
          estado: 'error',
          motivo: motivoDe(e),
          detalle: detalleDe(e),
        });
      }
    }
    const versionLista = (servicio: string, version: string): boolean =>
      versiones.some(
        (v) =>
          v.servicio === servicio &&
          v.version === version &&
          (v.estado === 'instalada' || v.estado === 'ya_instalada'),
      );

    d.progreso?.({ fase: 'configuracion', paso: 3, de: 7 });
    // 4. Configuración: la del perfil (importada) con los sitios y las instancias fusionados.
    // Fusión: con datos, la configuración de este equipo; limpia, la del perfil saneada.
    const cfg = structuredClone(plan.fusion.config);
    const actual = plan.config;
    const instancias: ResultadoImportarPerfil['instancias'] = [];
    for (const i of plan.instancias) {
      if (i.existente) {
        instancias.push({
          id: i.id,
          estado: 'existente',
          puerto: i.puerto,
          puertoOriginal: i.puertoOriginal,
        });
        continue;
      }
      if (i.sinPuerto) {
        instancias.push({
          id: i.id,
          estado: 'pendiente',
          puerto: i.puertoOriginal,
          puertoOriginal: i.puertoOriginal,
        });
        continue;
      }
      const datos = cfg.servicios.datos[i.servicio];
      datos.instancias = {
        ...(datos.instancias ?? {}),
        [i.clave]: { version: i.version, puerto: i.puerto, autoIniciar: false },
      };
      if (!datos.predeterminada || !datos.instancias[datos.predeterminada]) {
        datos.predeterminada = i.clave;
      }
      instancias.push({
        id: i.id,
        estado: i.reasignado ? 'puerto_reasignado' : 'creada',
        puerto: i.puerto,
        puertoOriginal: i.puertoOriginal,
      });
    }
    // La predeterminada de cada servicio debe ser una instancia que existe; los campos de una sola
    // instancia reflejan la predeterminada (como tras la migración de instancias).
    for (const id of Object.keys(cfg.servicios.datos) as IdServicioDatos[]) {
      const datos = cfg.servicios.datos[id];
      const claves = Object.keys(datos.instancias ?? {});
      if (claves.length === 0) {
        delete datos.instancias;
        datos.predeterminada = null;
        continue;
      }
      if (!datos.predeterminada || !claves.includes(datos.predeterminada)) {
        datos.predeterminada = claves[0]!;
      }
      const pred = datos.instancias![datos.predeterminada]!;
      datos.version = pred.version;
      datos.puerto = pred.puerto;
    }
    const sitiosResultado: ResultadoImportarPerfil['sitios'] = [];
    const importados: Sitio[] = [];
    const proveedores = new Set(cfg.correo.proveedores.map((x) => x.id));
    for (const s of plan.sitios) {
      if (s.omitido) {
        sitiosResultado.push({
          id: s.sitio.id,
          estado: 'omitido',
          carpeta: s.sitio.carpeta,
          motivos: [s.omitido],
        });
        continue;
      }
      const sitio: Sitio = { ...s.sitio };
      const motivos = [...s.motivos];
      if (sitio.correo?.modo === 'smtp' && !proveedores.has(sitio.correo.proveedor)) {
        delete sitio.correo;
        motivos.push('correo_sin_proveedor');
      }
      if (!s.existe) {
        sitio.pendiente = 'carpeta';
        motivos.push('carpeta_no_existe');
      }
      importados.push(sitio);
      sitiosResultado.push({
        id: sitio.id,
        estado: s.existe ? 'importado' : 'pendiente',
        carpeta: sitio.carpeta,
        motivos,
      });
    }
    const ids = new Set(importados.map((s) => s.id));
    cfg.sitios = [...(actual?.sitios ?? []).filter((s) => !ids.has(s.id)), ...importados];
    await d.guardarConfig(cfg);

    d.progreso?.({ fase: 'plantillas', paso: 4, de: 7 });
    // 5. Plantillas: copiadas como importadas (nunca entran al registro de propias).
    const plantillas: ResultadoImportarPerfil['plantillas'] = [];
    for (const id of m.plantillas) {
      const origen = path.join(dir, 'plantillas', id);
      if (!existsSync(path.join(origen, 'plantilla.json'))) {
        plantillas.push({ id, estado: 'error', motivo: 'danada' });
        continue;
      }
      const raiz = d.rutas.plantillas();
      const final = path.join(raiz, id);
      const parcial = path.join(raiz, `.tmp-${randomBytes(6).toString('hex')}`);
      try {
        await mkdir(raiz, { recursive: true });
        await cp(origen, parcial, { recursive: true, dereference: false });
        // Del registro antes que nada: ni un instante la plantilla nueva cuenta como propia.
        await d.plantillas.marcarImportada(id);
        if (existsSync(final)) await rm(final, { recursive: true, force: true });
        await rename(parcial, final);
        const cargada = await d.plantillas.cargar(id);
        if (cargada.origen !== 'importada') await d.plantillas.marcarImportada(id);
        plantillas.push({ id, estado: 'importado', motivo: null });
      } catch (e) {
        await rm(parcial, { recursive: true, force: true }).catch(() => undefined);
        // La que llegó no sirve: fuera. La que había vuelve desde su copia (sin el registro de
        // propia: si lo era, el usuario la puede guardar de nuevo desde su proyecto).
        await rm(final, { recursive: true, force: true }).catch(() => undefined);
        const copia = respaldo ? path.join(respaldo, 'plantillas', id) : null;
        if (plan.plantillasExistentes.has(id) && copia && existsSync(copia)) {
          await cp(copia, final, { recursive: true, dereference: false }).catch(() => undefined);
        }
        plantillas.push({ id, estado: 'error', motivo: motivoDe(e), detalle: detalleDe(e) });
      }
    }

    d.progreso?.({ fase: 'ca', paso: 5, de: 7 });
    // 6. CA y certificados.
    let ca: ResultadoImportarPerfil['ca'] = 'sin_cambios';
    if (caDescifrada) {
      await escribirPrivado(d.rutas.caCrt(), caDescifrada.ca.crt);
      await escribirPrivado(d.rutas.caKey(), caDescifrada.ca.key);
      for (const [id, c] of Object.entries(caDescifrada.certificados)) {
        if (!idSitioSeguro(id) || !ids.has(id)) continue;
        if (typeof c?.crt !== 'string' || typeof c?.key !== 'string') continue;
        await escribirPrivado(d.rutas.certCrt(id), c.crt);
        await escribirPrivado(d.rutas.certKey(id), c.key);
      }
      ca = 'importada';
      if (caAnterior && !d.aislado) {
        avisos.push({ codigo: 'ca_reemplazada', datos: { huella: caAnterior } });
      }
    } else if (!existsSync(d.rutas.caCrt())) {
      ca = 'nueva';
    }
    try {
      await d.regenerarCertificados();
    } catch (e) {
      avisos.push({ codigo: 'certificados', datos: { detalle: detalleDe(e) } });
    }

    d.progreso?.({ fase: 'bases', paso: 6, de: 7 });
    // 7. Bases: por el camino acotado, con instantánea previa si la base ya estaba.
    const bases: ResultadoImportarPerfil['bases'] = [];
    for (const b of m.bases) {
      const inst = plan.instancias.find((x) => x.id === b.instancia);
      const fila = (
        estado: ResultadoImportarPerfil['bases'][number]['estado'],
        motivo: string | null,
        e?: unknown,
      ) =>
        bases.push({
          instancia: b.instancia,
          base: b.base,
          estado,
          motivo,
          ...(e === undefined ? {} : { detalle: detalleDe(e) }),
        });
      if (!inst || inst.sinPuerto) {
        fila('pendiente', 'instancia_pendiente');
        continue;
      }
      if (!MOTORES_SQL.includes(inst.servicio)) {
        fila('omitido', 'motor_no_soportado');
        continue;
      }
      // Una instancia que ya existe usa sus binarios: basta que estén instalados aquí.
      const lista = inst.existente
        ? await d.versionInstalada(inst.servicio, inst.version).catch(() => false)
        : versionLista(inst.servicio, inst.version);
      if (!lista) {
        fila('pendiente', 'version_pendiente');
        continue;
      }
      if (!conBases) {
        fila('omitido', 'bases_omitidas');
        continue;
      }
      const archivos = claros.get(`${b.instancia}/${b.base}`);
      if (!archivos) {
        fila('error', 'danada');
        continue;
      }
      try {
        await d.prepararInstancia(b.instancia);
      } catch (e) {
        fila('pendiente', 'instancia_apagada', e);
        continue;
      }
      let existe = false;
      try {
        existe = (await d.basesDe(b.instancia)).some(
          (x) => x.toLowerCase() === b.base.toLowerCase(),
        );
      } catch (e) {
        fila('pendiente', 'instancia_apagada', e);
        continue;
      }
      if (existe) {
        try {
          await d.instantaneaPrevia(b.instancia, b.base);
        } catch (e) {
          // Sin copia previa no se reemplaza nada (la misma garantía que Instantaneas.volver).
          fila('error', 'sin_copia_previa', e);
          continue;
        }
      }
      try {
        await d.restaurarBase(b.instancia, archivos, b.base, { existe });
        fila('importado', null);
      } catch (e) {
        fila('error', motivoDe(e), e);
      }
    }

    d.progreso?.({ fase: 'env', paso: 7, de: 7 });
    // 8. .env de los proyectos marcados: usuario propio nuevo con una clave nueva.
    const env: ResultadoImportarPerfil['env'] = [];
    const marcados = new Set(o.envProyectos ?? []);
    const baseDe = d.baseDelProyecto ?? leerBaseDelProyecto;
    const claves = new Map<string, string>();
    const creados = new Set<string>();
    for (const s of importados) {
      if (s.pendiente) {
        if (marcados.has(s.id))
          env.push({ sitioId: s.id, estado: 'error', motivo: 'carpeta_no_existe', copia: null });
        continue;
      }
      const b = await baseDe(s.carpeta).catch(() => null);
      if (!b || (b.host && !/^(127\.0\.0\.1|localhost|\[?::1\]?)$/i.test(b.host))) {
        if (marcados.has(s.id))
          env.push({ sitioId: s.id, estado: 'error', motivo: 'sin_base', copia: null });
        continue;
      }
      if (!marcados.has(s.id)) {
        env.push({ sitioId: s.id, estado: 'sin_marcar', motivo: null, copia: null });
        continue;
      }
      const familia: IdServicioDatos[] =
        b.motor === 'postgresql' ? ['postgresql'] : ['mysql', 'mariadb'];
      const inst =
        plan.instancias.find(
          (i) => familia.includes(i.servicio) && b.puerto !== null && i.puertoOriginal === b.puerto,
        ) ??
        (b.puerto === null
          ? plan.instancias.find(
              (i) =>
                i.servicio === b.motor &&
                cfg.servicios.datos[i.servicio].predeterminada === i.clave,
            )
          : undefined);
      if (!inst || inst.sinPuerto) {
        env.push({ sitioId: s.id, estado: 'error', motivo: 'base_no_resuelta', copia: null });
        continue;
      }
      try {
        const usuario = usuarioDeProyecto(b.base);
        const clave_lote = `${inst.id}/${b.base.toLowerCase()}`;
        // Una sola clave por base en toda la importación; si otro proyecto del equipo ya usa ese
        // usuario, su clave (nunca se cambia: lo dejaría sin conexión). Como en D16.
        let clave = claves.get(clave_lote) ?? null;
        let reutilizada = clave !== null;
        if (clave === null) {
          clave = await d.claveCompartida(usuario, [...ids]);
          reutilizada = clave !== null;
        }
        const final = clave ?? (d.generarClave ?? generarClaveBd)();
        const crear = !creados.has(clave_lote);
        const r = await d.ponerUsuarioEnv(
          s.id,
          usuario,
          final,
          b.puerto !== null && inst.puerto !== b.puerto ? inst.puerto : null,
          // Con el .env listo para escribirse: primero la clave, luego el usuario.
          async () => {
            await d.guardarClaveBd(s.id, final);
            if (crear) {
              await d.crearUsuarioBd(inst.id, b.base, usuario, final, {
                cambiarClave: !reutilizada,
              });
            }
          },
        );
        claves.set(clave_lote, final);
        creados.add(clave_lote);
        env.push({ sitioId: s.id, estado: 'reescrito', motivo: null, copia: r.copia });
      } catch (e) {
        env.push({
          sitioId: s.id,
          estado: 'error',
          motivo: motivoDe(e),
          detalle: detalleDe(e),
          copia: null,
        });
      }
    }

    return {
      respaldo,
      sitios: sitiosResultado,
      versiones,
      instancias,
      bases,
      plantillas,
      env,
      ca,
      avisos,
    };
  }
}

const aceptable = (h: HuellaFila): boolean => h === 'fuerte' || h === 'firmada';

/** Código del motivo: el de `ErrorWolf` o `error_inesperado` (el texto va en `detalleDe`). */
function motivoDe(e: unknown): string {
  return esErrorWolf(e) ? e.codigo : 'error_inesperado';
}

/** Mensaje de un error, sin secretos y acotado. */
function detalleDe(e: unknown): string {
  return enmascararSecretos(e instanceof Error ? e.message : String(e)).slice(0, 200);
}

/** Volcados (cifrados) de una base, según el motor de su instancia. */
function volcadosDe(
  dir: string,
  m: ManifiestoPerfil,
  instancia: string,
  base: string,
): VolcadosBase | null {
  const raiz = `bases/${instancia}/${base}`;
  const ruta = (n: string): string => path.join(dir, ...raiz.split('/'), n);
  if (instancia.startsWith('postgresql@')) {
    return `${raiz}/volcado.dump.cifrado` in m.archivos
      ? { volcado: ruta('volcado.dump.cifrado') }
      : null;
  }
  if (!/^(mysql|mariadb)@/.test(instancia)) return null;
  if (`${raiz}/esquema.sql.cifrado` in m.archivos && `${raiz}/datos.sql.cifrado` in m.archivos) {
    return { esquema: ruta('esquema.sql.cifrado'), datos: ruta('datos.sql.cifrado') };
  }
  return null;
}

/** Escribe un archivo de la CA o de un certificado (atómico; 0600 donde aplica). */
async function escribirPrivado(destino: string, contenido: string): Promise<void> {
  await mkdir(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.${randomBytes(4).toString('hex')}.tmp`;
  await writeFile(tmp, contenido, { encoding: 'utf8', mode: 0o600 });
  await rename(tmp, destino);
}

/** Cuánto se conservan las copias `pre-perfil-*` (días). */
export const DIAS_PRE_PERFIL = 30;

/** Borra las copias `pre-perfil-<fecha>` de más de 30 días (solo carpetas con ese nombre, nunca enlaces). */
async function limpiarPrePerfil(d: DepsPerfiles, raiz: string): Promise<void> {
  const ahora = (d.reloj?.() ?? new Date()).getTime();
  for (const e of await readdir(raiz, { withFileTypes: true }).catch(() => [])) {
    const m = /^pre-perfil-(\d{4}-\d{2}-\d{2})T/.exec(e.name);
    if (!m || !e.isDirectory()) continue;
    const t = Date.parse(`${m[1]}T00:00:00Z`);
    if (Number.isNaN(t) || ahora - t < DIAS_PRE_PERFIL * 86_400_000) continue;
    const ruta = path.join(raiz, e.name);
    const s = await lstat(ruta).catch(() => null);
    if (s?.isDirectory() && !s.isSymbolicLink()) {
      await rm(ruta, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

/**
 * Lo que la vista previa dice de las restricciones de la CA: `restringida` si lleva exactamente las
 * de WolfCore Dev; `restriccionesAjenas` si lleva otras **o no se puede leer** (nunca se ofrece).
 */
export function estadoCaVista(certificado: string): {
  restringida: boolean;
  restriccionesAjenas: boolean;
} {
  const r = restriccionesDeCa(certificado);
  return { restringida: r === 'nuestras', restriccionesAjenas: r === 'ajenas' || r === 'ilegible' };
}
