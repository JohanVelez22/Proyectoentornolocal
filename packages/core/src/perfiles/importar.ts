import { createHash, randomBytes } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { cp, lstat, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Transform, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';
import { leerBaseDelProyecto } from '../bd/baseProyecto';
import { generarClaveBd, usuarioDeProyecto } from '../bd/usuarioProyecto';
import { huellaDeFila } from '../catalogo/tablaVersiones';
import type { HuellaFila } from '../catalogo/tablaVersiones';
import { ErrorWolf, esErrorWolf } from '../errores';
import { esRutaLocalAbsoluta, esRutaProtegida } from '../importar/comun';
import { enmascararSecretos } from '../patronesSecretos';
import { idSitioSeguro } from '../tuneles/proveedor';
import type { Config, IdServicioDatos, Sitio } from '../tipos';
import { descifrarConFrase } from './cifrado';
import { sha256Archivo } from './exportar';
import {
  configImportada,
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
  type VolcadosBase,
} from './tipos';

const danado = (detalle?: string): ErrorWolf =>
  new ErrorWolf(
    'perfiles.danado',
    `El perfil está dañado o fue modificado${detalle ? `: ${detalle}` : ''}.`,
  );

const MOTORES_SQL: readonly IdServicioDatos[] = ['mysql', 'mariadb', 'postgresql'];

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

/** Un perfil abierto: lo de la lista blanca ya extraído y verificado contra sus huellas. */
export interface PerfilAbierto {
  dir: string;
  manifiesto: ManifiestoPerfil;
  ignoradas: number;
  /** SHA-256 del archivo `.wolfperfil` entero. */
  huellaArchivo: string;
}

/**
 * Abre un `.wolfperfil` en `dir` (temporal): recorre todas las entradas y **rechaza el perfil
 * entero** si alguna es peligrosa (zip-slip, ruta absoluta, unidad, `:`, controles, nombre
 * reservado) o si pasa los topes; extrae **solo** las de la lista blanca (lo demás —`etc/`,
 * `instantaneas/`, `run/`…— se cuenta y se ignora sin escribirlo), con un tope real de bytes por
 * archivo; y comprueba cada una contra la huella del manifiesto. Lo que el manifiesto no declara
 * no se usa.
 */
export async function abrirPerfil(
  archivo: string,
  dir: string,
  limites: LimitesPerfil = LIMITES_PERFIL,
): Promise<PerfilAbierto> {
  const info = await lstat(archivo).catch(() => null);
  if (!info?.isFile())
    throw new ErrorWolf('perfiles.no_existe', 'El archivo del perfil no existe.');
  if (info.size > limites.maxBytesPerfil) {
    throw new ErrorWolf('perfiles.demasiado_grande', 'El perfil es demasiado grande.', {
      maximo: Math.floor(limites.maxBytesPerfil / (1024 * 1024)),
    });
  }
  await mkdir(dir, { recursive: true });
  const zip = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.open(archivo, { lazyEntries: true, autoClose: false }, (e, z) =>
      e || !z ? reject(e ?? new Error('zip')) : resolve(z),
    );
  }).catch(() => {
    throw danado('no es un archivo de perfil');
  });
  let ignoradas = 0;
  const extraidas = new Set<string>();
  try {
    await new Promise<void>((resolve, reject) => {
      let entradas = 0;
      let bytes = 0;
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
          if (extraidas.has(nombre)) throw danado('trae un archivo repetido');
          const tope =
            nombre === 'manifiesto.json'
              ? limites.maxBytesManifiesto
              : nombre === 'ca.cifrada'
                ? limites.maxBytesCa
                : limites.maxBytesArchivo;
          bytes += e.uncompressedSize;
          if (e.uncompressedSize > tope || bytes > limites.maxBytes) {
            throw new ErrorWolf('perfiles.demasiado_grande', 'El perfil es demasiado grande.', {
              maximo: Math.floor(limites.maxBytes / (1024 * 1024)),
            });
          }
          const destino = path.join(dir, ...nombre.split('/'));
          // Doble comprobación de zip-slip sobre la ruta ya resuelta.
          const rel = path.relative(dir, destino);
          if (rel.startsWith('..') || path.isAbsolute(rel)) throw danado('ruta fuera');
          await mkdir(path.dirname(destino), { recursive: true });
          const lectura = await new Promise<NodeJS.ReadableStream>((res, rej) => {
            zip.openReadStream(e, (err, s) => (err || !s ? rej(err ?? new Error('x')) : res(s)));
          });
          await pipeline(lectura, new Tope(tope), createWriteStream(destino));
          extraidas.add(nombre);
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
  if (!extraidas.has('manifiesto.json')) throw danado('falta el manifiesto');
  let bruto: unknown;
  try {
    bruto = JSON.parse(
      (await readFile(path.join(dir, 'manifiesto.json'), 'utf8')).replace(
        new RegExp(`^${String.fromCharCode(0xfeff)}`),
        '',
      ),
    );
  } catch {
    throw danado('el manifiesto no es válido');
  }
  const manifiesto = leerManifiesto(bruto);
  // Cada archivo declarado debe estar y coincidir; lo que no se declara se borra sin usarlo.
  for (const [rel, huella] of Object.entries(manifiesto.archivos)) {
    if (!extraidas.has(rel)) throw danado('falta un archivo');
    if ((await sha256Archivo(path.join(dir, ...rel.split('/')))) !== huella) {
      throw danado('un archivo no coincide con su huella');
    }
  }
  for (const rel of extraidas) {
    if (rel !== 'manifiesto.json' && !(rel in manifiesto.archivos)) {
      await rm(path.join(dir, ...rel.split('/')), { force: true });
      ignoradas++;
    }
  }
  return { dir, manifiesto, ignoradas, huellaArchivo: await sha256Archivo(archivo) };
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

async function planificar(
  d: DepsPerfiles,
  p: PerfilAbierto,
  o: Pick<OpcionesImportarPerfil, 'rutas' | 'prefijos'>,
): Promise<Plan> {
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
    const porPrefijo = !elegida && s.carpeta !== validos[i]!.sitio.carpeta;
    let omitido: string | null = null;
    if (vistos.has(s.id)) omitido = 'sitio_repetido';
    else if (
      !esRutaLocalAbsoluta(s.carpeta) ||
      !restoSeguro(s.carpeta) ||
      // Una ruta que sale del perfil (no la eligió el usuario) nunca puede ser del sistema.
      (!elegida && !porPrefijo && esRutaProtegida(s.carpeta))
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

  // Instancias: las que ya existen se conservan; las nuevas, con un puerto libre.
  const usados = puertosDeConfig(actual);
  const instancias: PlanInstancia[] = [];
  const ocupados: number[] = [];
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

  private async conPerfil<T>(archivo: string, fn: (p: PerfilAbierto) => Promise<T>): Promise<T> {
    const tmp = this.d.rutas.tmp();
    await mkdir(tmp, { recursive: true });
    const dir = path.join(tmp, `perfil-abierto-${randomBytes(6).toString('hex')}`);
    try {
      return await fn(await abrirPerfil(archivo, dir, this.limites));
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(
        () => undefined,
      );
    }
  }

  /** Lo que haría `importar` en esta carpeta de datos, sin escribir nada. */
  vistaPrevia(archivo: string, o: OpcionesVista = { rutas: {} }): Promise<VistaPreviaPerfil> {
    return this.conPerfil(archivo, async (p) => {
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
    return this.conPerfil(archivo, (p) => this.aplicar(p, o));
  }

  private async aplicar(
    p: PerfilAbierto,
    o: OpcionesImportarPerfil,
  ): Promise<ResultadoImportarPerfil> {
    const d = this.d;
    const m = p.manifiesto;
    const plan = await planificar(d, p, o);
    if (o.huella !== huellaVista(p, plan, o)) {
      throw new ErrorWolf(
        'perfiles.vista_previa_vieja',
        'La carpeta de datos o el perfil cambiaron desde la vista previa: revísela otra vez.',
      );
    }
    const avisos: string[] = [];

    // 1. La CA primero: una frase equivocada no debe dejar nada a medias.
    let caDescifrada: CaPerfil | null = null;
    if (m.incluye.ca && 'ca.cifrada' in m.archivos) {
      if (typeof o.frase === 'string' && o.frase !== '') {
        const plano = await descifrarConFrase(
          await readFile(path.join(p.dir, 'ca.cifrada')),
          o.frase,
        );
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
          caDescifrada = { ca: j.ca, certificados: j.certificados ?? {} };
        } catch {
          throw danado('la CA no es válida');
        } finally {
          plano.fill(0);
        }
      } else {
        avisos.push('El perfil trae la CA, pero no se dio su frase: se usa una CA nueva.');
      }
    }

    // 2. Copia de lo que se reemplaza.
    const fecha = (d.reloj?.() ?? new Date()).toISOString().replace(/[:.]/g, '-');
    let respaldo: string | null = null;
    const copiar = async (origen: string, rel: string): Promise<void> => {
      if (!existsSync(origen)) return;
      respaldo ??= path.join(d.rutas.base, 'respaldos', `pre-perfil-${fecha}`);
      await mkdir(path.join(respaldo, path.dirname(rel)), { recursive: true });
      await cp(origen, path.join(respaldo, rel), {
        recursive: true,
        force: false,
        errorOnExist: true,
        dereference: false,
      });
    };
    if (plan.config) await copiar(d.rutas.config(), 'config.json');
    for (const id of plan.plantillasExistentes) {
      await copiar(path.join(d.rutas.plantillas(), id), path.join('plantillas', id));
    }
    if (caDescifrada) {
      await copiar(path.dirname(d.rutas.caCrt()), 'ca');
      await copiar(path.dirname(d.rutas.certCrt('x')), 'certs');
    }

    // 3. Versiones: con huella fuerte o firma desde el catálogo; las demás quedan pendientes.
    const versiones: ResultadoImportarPerfil['versiones'] = [];
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

    // 4. Configuración: la del perfil (importada) con los sitios y las instancias fusionados.
    const cfg = configImportada(m.config);
    const actual = plan.config;
    if (actual) {
      // Lo que ya es de este equipo se conserva: sus instancias (con sus datos) y su interfaz.
      cfg.ui = actual.ui;
      for (const id of Object.keys(cfg.servicios.datos) as IdServicioDatos[]) {
        const previas = actual.servicios.datos[id].instancias;
        if (previas) cfg.servicios.datos[id].instancias = { ...previas };
        if (actual.servicios.datos[id].predeterminada) {
          cfg.servicios.datos[id].predeterminada = actual.servicios.datos[id].predeterminada;
        }
      }
    }
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

    // 5. Plantillas: copiadas como importadas (nunca entran al registro de propias).
    const plantillas: ResultadoImportarPerfil['plantillas'] = [];
    for (const id of m.plantillas) {
      const origen = path.join(p.dir, 'plantillas', id);
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
        plantillas.push({ id, estado: 'error', motivo: motivoDe(e) });
      }
    }

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
      avisos.push('La CA del perfil no queda instalada en el sistema: instálela desde HTTPS.');
    } else if (!existsSync(d.rutas.caCrt())) {
      ca = 'nueva';
    }
    try {
      await d.regenerarCertificados();
    } catch (e) {
      avisos.push(`No se pudieron preparar los certificados: ${motivoDe(e)}`);
    }

    // 7. Bases: por el camino acotado, con instantánea previa si la base ya estaba.
    const bases: ResultadoImportarPerfil['bases'] = [];
    for (const b of m.bases) {
      const inst = plan.instancias.find((x) => x.id === b.instancia);
      const fila = (
        estado: ResultadoImportarPerfil['bases'][number]['estado'],
        motivo: string | null,
      ) => bases.push({ instancia: b.instancia, base: b.base, estado, motivo });
      if (!inst || inst.sinPuerto) {
        fila('pendiente', 'instancia_pendiente');
        continue;
      }
      if (!MOTORES_SQL.includes(inst.servicio)) {
        fila('omitido', 'motor_no_soportado');
        continue;
      }
      if (!versionLista(inst.servicio, inst.version)) {
        fila('pendiente', 'version_pendiente');
        continue;
      }
      const archivos = volcadosDe(p.dir, m, b.instancia, b.base);
      if (!archivos) {
        fila('error', 'danada');
        continue;
      }
      try {
        await d.prepararInstancia(b.instancia);
      } catch (e) {
        fila('pendiente', `instancia_apagada: ${motivoDe(e)}`);
        continue;
      }
      let existe = false;
      try {
        existe = (await d.basesDe(b.instancia)).some(
          (x) => x.toLowerCase() === b.base.toLowerCase(),
        );
      } catch (e) {
        fila('pendiente', `instancia_apagada: ${motivoDe(e)}`);
        continue;
      }
      if (existe) {
        try {
          await d.instantaneaPrevia(b.instancia, b.base);
        } catch (e) {
          // Sin copia previa no se reemplaza nada (la misma garantía que Instantaneas.volver).
          fila('error', `sin_copia_previa: ${motivoDe(e)}`);
          continue;
        }
      }
      try {
        await d.restaurarBase(b.instancia, archivos, b.base, { existe });
        fila('importado', null);
      } catch (e) {
        fila('error', motivoDe(e));
      }
    }

    // 8. .env de los proyectos marcados: usuario propio nuevo con una clave nueva.
    const env: ResultadoImportarPerfil['env'] = [];
    const marcados = new Set(o.envProyectos ?? []);
    const baseDe = d.baseDelProyecto ?? leerBaseDelProyecto;
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
        const clave = (d.generarClave ?? generarClaveBd)();
        await d.guardarClaveBd(s.id, clave);
        await d.crearUsuarioBd(inst.id, b.base, usuario, clave);
        const r = await d.ponerUsuarioEnv(
          s.id,
          usuario,
          clave,
          b.puerto !== null && inst.puerto !== b.puerto ? inst.puerto : null,
        );
        env.push({ sitioId: s.id, estado: 'reescrito', motivo: null, copia: r.copia });
      } catch (e) {
        env.push({ sitioId: s.id, estado: 'error', motivo: motivoDe(e), copia: null });
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

function motivoDe(e: unknown): string {
  if (esErrorWolf(e)) return e.codigo;
  return enmascararSecretos(e instanceof Error ? e.message : String(e)).slice(0, 200);
}

function volcadosDe(
  dir: string,
  m: ManifiestoPerfil,
  instancia: string,
  base: string,
): VolcadosBase | null {
  const raiz = `bases/${instancia}/${base}`;
  const ruta = (n: string): string => path.join(dir, ...raiz.split('/'), n);
  if (`${raiz}/volcado.dump` in m.archivos) return { volcado: ruta('volcado.dump') };
  if (`${raiz}/esquema.sql` in m.archivos && `${raiz}/datos.sql` in m.archivos) {
    return { esquema: ruta('esquema.sql'), datos: ruta('datos.sql') };
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
