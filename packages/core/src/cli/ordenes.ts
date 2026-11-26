import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ZodType } from 'zod';
import type { Hallazgo } from '../doctor/tipos';
import { datosPermitidos, ErrorWolf, type CodigoError } from '../errores';
import { enmascararSecretos } from '../patronesSecretos';
import { rutaComparable, rutaDentroDe } from '../plataforma/sistema';
import { claveMayorMenor, esCarpetaDeSistema } from '../rutas';
import type { ResultadoAplicar } from '../sitios/sitios';
import {
  SitioSchema,
  TIPOS_CON_PHP,
  TIPOS_PROXY,
  type EstadoServicio,
  type EstadoTunel,
  type Sitio,
} from '../tipos';
import { modoTailscaleDe, proveedorDeSitio } from '../tuneles/proveedor';
import type { OpcionesAbrirTunel } from '../tuneles/tuneles';
import type { ResultadoWorkspace } from '../workspaces/workspaces';
import {
  ESQUEMAS_ORDEN,
  esOrdenCli,
  type ArgsOrden,
  type OrdenCli,
  type RespuestaCli,
} from './esquemas';

/**
 * Lo que las órdenes de la CLI necesitan del núcleo. `Nucleo` arma este objeto con sus propios
 * métodos: cada orden reutiliza **las mismas puertas** que la interfaz (confirmación de túneles,
 * validación de sitios, confianza de las recetas, instalación de versiones…). Ninguna orden salta
 * una confirmación que la interfaz pida.
 */
export interface OperacionesCli {
  /** Carpeta de datos de esta instancia (nunca se vincula ni se vigila). */
  carpetaDatos(): string;
  sitios(): Promise<Sitio[]>;
  /** Puertos web de Nginx (HTTP y HTTPS) para armar la URL de cada sitio. */
  puertosWeb(): Promise<{ http: number; https: number }>;
  idioma(): Promise<string | null>;
  estadoServicios(): Promise<EstadoServicio[]>;
  estadosTuneles(): EstadoTunel[];
  detectar(carpeta: string): Promise<{
    tipo: Sitio['tipo'];
    php: string | null;
    sugerenciaDominio: string;
    urlBaseVar: string | null;
  }>;
  guardarSitio(
    datos: Omit<Sitio, 'id'>,
    id?: string,
  ): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }>;
  cambiarCarpetaVigilada(carpeta: string | null): Promise<void>;
  sugerenciasProyectos(): Promise<unknown[]>;
  phpInstaladas(): Promise<string[]>;
  runtimesInstalados(tipo: string): Promise<string[]>;
  cambiarPhpPorDefecto(rama: string): Promise<void>;
  /** La misma puerta del túnel que la interfaz: sin `confirmado: true` el núcleo no abre nada. */
  abrirTunel(sitioId: string, o: OpcionesAbrirTunel): Promise<EstadoTunel>;
  cerrarTunel(sitioId: string): Promise<void>;
  /** Solo revisa: la CLI nunca repara. */
  revisarDoctor(): Promise<Hallazgo[]>;
  fuentesRegistro(): Promise<{ id: string }[]>;
  leerRegistro(id: string, lineas: number): Promise<string[]>;
  seguirRegistro(id: string, alLineas: (lineas: string[]) => void): Promise<() => void>;
  workspaces(): Promise<{ id: string }[]>;
  iniciarWorkspace(id: string): Promise<ResultadoWorkspace[]>;
  detenerWorkspace(id: string): Promise<ResultadoWorkspace[]>;
  iniciarServicio(id: string): Promise<void>;
  detenerServicio(id: string): Promise<void>;
  iniciarTodo(): Promise<void>;
  detenerTodo(): Promise<void>;
  /** La autoridad local está instalada en el almacén del usuario (los navegadores confían). */
  caConfiable(): Promise<boolean>;
  /** Abre la URL en el navegador del usuario (la app); sin esto solo se devuelve la URL. */
  abrirUrl?(url: string): Promise<boolean>;
}

const MAX_TEXTO = 4000;
const MAX_DETALLE = 200;
const MAX_PROFUNDIDAD = 8;
/** Claves que no salen nunca, aunque algún objeto las trajera. */
const CLAVE_SECRETA = /token|clave|secret|passw|contrase|credencial|authtoken|apikey|api_key/i;

/**
 * Limpia lo que sale por la CLI (también con `--json`): los textos pasan por `enmascararSecretos`
 * y se acotan, y ninguna clave con nombre de secreto sale. Es la red de seguridad de lo que cada
 * orden ya arma sin secretos.
 */
export function limpiarSalida(v: unknown, nivel = 0): unknown {
  if (typeof v === 'string') {
    const t = enmascararSecretos(v);
    return t.length > MAX_TEXTO ? `${t.slice(0, MAX_TEXTO - 1)}…` : t;
  }
  if (v === null || typeof v === 'number' || typeof v === 'boolean') return v;
  if (nivel >= MAX_PROFUNDIDAD) return null;
  if (Array.isArray(v)) return v.slice(0, 2000).map((x) => limpiarSalida(x, nivel + 1));
  if (typeof v === 'object') {
    const salida: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (CLAVE_SECRETA.test(k) || x === undefined || typeof x === 'function') continue;
      salida[k] = limpiarSalida(x, nivel + 1);
    }
    return salida;
  }
  return null;
}

/** Un error del núcleo como lo ve la CLI: código estable y solo los datos que el código declara. */
export function errorParaCli(e: unknown): Extract<RespuestaCli, { ok: false }>['error'] {
  if (e instanceof ErrorWolf) {
    const datos = datosPermitidos(e.codigo, e.datos);
    return { codigo: e.codigo, ...(datos ? { datos: limpiarDatos(datos) } : {}) };
  }
  const mensaje = e instanceof Error ? e.message : String(e);
  return { codigo: 'cli.error', datos: { detalle: limpiarTexto(mensaje) } };
}

function limpiarTexto(t: string): string {
  // eslint-disable-next-line no-control-regex
  const s = enmascararSecretos(t).replace(/[\u0000-\u001f\u007f]/g, ' ');
  return s.length > MAX_DETALLE ? `${s.slice(0, MAX_DETALLE - 1)}…` : s;
}

function limpiarDatos(d: Record<string, string | number>): Record<string, string | number> {
  const r: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(d)) r[k] = typeof v === 'string' ? limpiarTexto(v) : v;
  return r;
}

const falla = (codigo: CodigoError, mensaje: string, datos?: Record<string, string | number>) =>
  new ErrorWolf(codigo, mensaje, datos);

/** Valida los argumentos de una orden con su esquema (`cli.argumentos_invalidos`). */
export function validarArgs<O extends OrdenCli>(orden: O, args: unknown): ArgsOrden<O> {
  const esquema = ESQUEMAS_ORDEN[orden] as ZodType;
  const r = esquema.safeParse(args ?? {});
  if (!r.success) {
    throw falla('cli.argumentos_invalidos', 'Los argumentos de la orden no son válidos.');
  }
  return r.data as ArgsOrden<O>;
}

/**
 * Una carpeta que manda la CLI: existe, es una carpeta, su ruta real no es una carpeta del
 * sistema y no es (ni contiene, ni está dentro de) la carpeta de datos de WolfCore Dev. Se usa la
 * ruta real (sin enlaces ni uniones): un enlace nunca lleva a otro sitio sin que se vea.
 */
export async function carpetaDelUsuario(ruta: string, datos: string): Promise<string> {
  const invalida = (): ErrorWolf => falla('cli.carpeta_invalida', 'La carpeta no es válida.');
  let real: string;
  try {
    real = await realpath(ruta);
    if (!(await stat(real)).isDirectory()) throw invalida();
  } catch {
    throw invalida();
  }
  if (esCarpetaDeSistema(real)) throw invalida();
  let base = datos;
  try {
    base = await realpath(datos);
  } catch {
    // la carpeta de datos se compara tal cual
  }
  if (rutaDentroDe(base, real) || rutaDentroDe(real, base)) throw invalida();
  return real;
}

async function buscarSitio(ops: OperacionesCli, id: string): Promise<Sitio> {
  const s = (await ops.sitios()).find((x) => x.id === id);
  if (!s) throw falla('cli.sitio_no_encontrado', 'Ese sitio no existe.', { sitio: id });
  return s;
}

/** Datos del sitio sin la clave de nada: lo que la CLI muestra (y los textos de la confirmación). */
function resumenSitio(s: Sitio, puertos: { http: number; https: number }) {
  return {
    id: s.id,
    nombre: s.nombre,
    dominio: s.dominio,
    tipo: s.tipo,
    php: s.php,
    https: s.https,
    datosReales: s.datosReales,
    confiado: s.confiado,
    carpeta: s.carpeta,
    pendiente: s.pendiente ?? null,
    url: urlDelSitio(s, puertos),
    tunel: {
      proveedor: proveedorDeSitio(s),
      ...(s.tunel?.nombre ? { nombre: s.tunel.nombre } : {}),
      ...(s.tunel?.dominio ? { dominio: s.tunel.dominio } : {}),
      ...(s.tunel?.proveedor === 'tailscale' ? { modo: modoTailscaleDe(s.tunel) } : {}),
    },
  };
}

/** `http(s)://<dominio>[:puerto]`: el dominio ya pasó la validación `.test` del gestor de sitios. */
export function urlDelSitio(
  s: Pick<Sitio, 'dominio' | 'https'>,
  p: { http: number; https: number },
) {
  const puerto = s.https ? p.https : p.http;
  const omitir = s.https ? 443 : 80;
  return `${s.https ? 'https' : 'http'}://${s.dominio}${puerto === omitir ? '' : `:${puerto}`}`;
}

const resumenAplicar = (a: ResultadoAplicar) => ({
  nginx: a.nginx.ok,
  hosts: a.hosts.ok,
  httpsPendiente: a.httpsPendiente,
});

const sinId = (s: Sitio): Omit<Sitio, 'id'> => {
  const { id: _id, ...resto } = s;
  void _id;
  return resto;
};

/** El sitio cuya carpeta es `carpeta` o la contiene (el más específico). */
async function sitioDeCarpeta(ops: OperacionesCli, carpeta: string): Promise<Sitio | null> {
  let mejor: { s: Sitio; largo: number } | null = null;
  for (const s of await ops.sitios()) {
    let propia = s.carpeta;
    try {
      propia = await realpath(s.carpeta);
    } catch {
      // se compara tal cual
    }
    if (rutaDentroDe(propia, carpeta)) {
      const largo = path.resolve(propia).length;
      if (!mejor || largo > mejor.largo) mejor = { s, largo };
    }
  }
  return mejor?.s ?? null;
}

type Orden<O extends OrdenCli> = (ops: OperacionesCli, args: ArgsOrden<O>) => Promise<unknown>;

const estado: Orden<'estado'> = async (ops) => {
  const [sitios, puertos, servicios, idioma] = await Promise.all([
    ops.sitios(),
    ops.puertosWeb(),
    ops.estadoServicios(),
    ops.idioma(),
  ]);
  return {
    idioma,
    sitios: sitios.map((s) => resumenSitio(s, puertos)),
    servicios: servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      estado: s.estado,
      version: s.version,
      puertos: s.puertos,
    })),
    tuneles: ops.estadosTuneles().map((t) => ({
      sitio: t.sitioId,
      estado: t.estado,
      url: t.url,
      ...(t.mensaje ? { mensaje: t.mensaje } : {}),
    })),
  };
};

/**
 * Vincula una carpeta como sitio con lo mismo que la interfaz exige (el gestor de sitios valida
 * dominio, PHP y carpeta). Nace sin "Confío en este repositorio" y sin procesos: lo que ejecuta
 * una receta lo confía el usuario en la interfaz.
 */
const vincular: Orden<'vincular'> = async (ops, a) => {
  const real = await carpetaDelUsuario(a.carpeta, ops.carpetaDatos());
  const existente = (await ops.sitios()).find(
    (s) => rutaComparable(path.resolve(s.carpeta)) === rutaComparable(path.resolve(real)),
  );
  if (existente) {
    throw falla('cli.ya_vinculada', 'Esa carpeta ya es un sitio.', { sitio: existente.id });
  }
  const det = await ops.detectar(real);
  if ((TIPOS_PROXY as readonly string[]).includes(det.tipo)) {
    throw falla('cli.tipo_no_soportado', 'Ese tipo de proyecto se crea desde la interfaz.', {
      tipo: det.tipo,
    });
  }
  const datos = SitioSchema.omit({ id: true }).parse({
    nombre: a.nombre ?? (path.basename(real) || 'sitio'),
    dominio: a.dominio ?? det.sugerenciaDominio,
    carpeta: real,
    tipo: det.tipo,
    php: TIPOS_CON_PHP.includes(det.tipo) ? det.php : null,
    urlBaseVar: det.urlBaseVar,
    datosReales: false,
    confiado: false,
    https: false,
  });
  const { sitio, aplicar } = await ops.guardarSitio(datos);
  return { sitio: resumenSitio(sitio, await ops.puertosWeb()), aplicar: resumenAplicar(aplicar) };
};

/** `park`: la carpeta vigilada (la misma de Ajustes). Solo propone sitios: no crea ninguno. */
const vigilar: Orden<'vigilar'> = async (ops, a) => {
  const real = a.carpeta === null ? null : await carpetaDelUsuario(a.carpeta, ops.carpetaDatos());
  await ops.cambiarCarpetaVigilada(real);
  return { carpeta: real, sugerencias: (await ops.sugerenciasProyectos()).length };
};

const usar: Orden<'usar'> = async (ops, a) => {
  const rama = claveMayorMenor(a.version);
  if (a.global === true) {
    // Cambia el PHP de todas las terminales: lo mismo que pide confirmar la interfaz.
    if (a.si !== true) {
      throw falla(
        'cli.requiere_confirmacion',
        'Cambiar el PHP de todas las terminales exige confirmar.',
        {
          sitio: '',
        },
      );
    }
    if (!(await ops.phpInstaladas()).includes(rama)) {
      throw falla('cli.version_no_instalada', 'Esa versión no está instalada.', {
        servicio: 'php',
        version: rama,
      });
    }
    await ops.cambiarPhpPorDefecto(rama);
    return { servicio: 'php', version: rama, global: true };
  }
  const carpeta = await carpetaDelUsuario(a.carpeta!, ops.carpetaDatos());
  const sitio = await sitioDeCarpeta(ops, carpeta);
  if (!sitio) throw falla('cli.carpeta_sin_sitio', 'Esa carpeta no es de ningún sitio.');
  let datos = sinId(sitio);
  if (a.servicio === 'php') {
    if (!TIPOS_CON_PHP.includes(sitio.tipo)) {
      throw falla('cli.sitio_sin_php', 'Ese sitio no usa PHP.', { sitio: sitio.id });
    }
    if (!(await ops.phpInstaladas()).includes(rama)) {
      throw falla('cli.version_no_instalada', 'Esa versión no está instalada.', {
        servicio: 'php',
        version: rama,
      });
    }
    datos = { ...datos, php: rama };
  } else {
    if (!(await ops.runtimesInstalados(a.servicio)).includes(a.version)) {
      throw falla('cli.version_no_instalada', 'Esa versión no está instalada.', {
        servicio: a.servicio,
        version: a.version,
      });
    }
    datos = { ...datos, runtimes: { ...datos.runtimes, [a.servicio]: a.version } };
  }
  const { sitio: nuevo, aplicar } = await ops.guardarSitio(datos, sitio.id);
  return {
    sitio: nuevo.id,
    servicio: a.servicio,
    version: a.servicio === 'php' ? rama : a.version,
    aplicar: resumenAplicar(aplicar),
  };
};

/**
 * Pone HTTPS en el sitio con el mismo guardado que la interfaz. No instala la autoridad en el
 * almacén de confianza (eso lo confirma el usuario en la interfaz): dice si ya está.
 */
const asegurar: Orden<'asegurar'> = async (ops, a) => {
  const sitio = await buscarSitio(ops, a.sitio);
  const puertos = await ops.puertosWeb();
  if (sitio.https) {
    return { sitio: resumenSitio(sitio, puertos), ya: true, caConfiable: await ops.caConfiable() };
  }
  const { sitio: nuevo, aplicar } = await ops.guardarSitio(
    { ...sinId(sitio), https: true },
    sitio.id,
  );
  return {
    sitio: resumenSitio(nuevo, puertos),
    ya: false,
    aplicar: resumenAplicar(aplicar),
    caConfiable: await ops.caConfiable(),
  };
};

/**
 * Publicar un sitio en internet. Reutiliza la puerta del núcleo (`confirmado: true` + lo que se
 * confirmó): sin `si` no se llama al núcleo; con datos reales hace falta además que quien
 * confirma escriba el dominio del sitio (confirmación reforzada que ningún `si` cubre).
 */
const compartir: Orden<'compartir'> = async (ops, a) => {
  const sitio = await buscarSitio(ops, a.sitio);
  if (a.cerrar === true) {
    await ops.cerrarTunel(sitio.id);
    return { sitio: sitio.id, estado: 'apagado', url: null };
  }
  if (a.si !== true) {
    throw falla('cli.requiere_confirmacion', 'Publicar el sitio exige confirmarlo.', {
      sitio: sitio.id,
    });
  }
  if (sitio.datosReales && a.confirmaDatosReales !== sitio.dominio) {
    throw falla(
      'cli.requiere_confirmacion_datos_reales',
      'Este sitio tiene datos reales: confirme escribiendo su dominio.',
      { sitio: sitio.id, dominio: sitio.dominio },
    );
  }
  const proveedor = proveedorDeSitio(sitio);
  if (a.proveedor !== undefined && a.proveedor !== proveedor) {
    throw falla('cli.proveedor_distinto', 'El sitio usa otro proveedor de túnel.', { proveedor });
  }
  let estadoTunel: EstadoTunel;
  try {
    estadoTunel = await ops.abrirTunel(sitio.id, {
      confirmado: true,
      tunelConfirmado: {
        proveedor,
        ...(sitio.tunel?.nombre ? { nombre: sitio.tunel.nombre } : {}),
        ...(sitio.tunel?.dominio ? { dominio: sitio.tunel.dominio } : {}),
        ...(proveedor === 'tailscale' ? { modo: modoTailscaleDe(sitio.tunel) } : {}),
      },
    });
  } catch (e) {
    // Los errores con código ya vienen limpios del núcleo. Un error suelto de un proceso de túnel
    // puede traer un token de su línea de órdenes: no se repite su texto (está en el registro del túnel).
    if (e instanceof ErrorWolf) throw e;
    throw falla('cli.error', 'No se pudo abrir el túnel.', { detalle: 'tunel' });
  }
  return {
    sitio: sitio.id,
    estado: estadoTunel.estado,
    url: estadoTunel.url,
    ...(estadoTunel.mensaje ? { mensaje: estadoTunel.mensaje } : {}),
  };
};

const abrir: Orden<'abrir'> = async (ops, a) => {
  const sitio = await buscarSitio(ops, a.sitio);
  const url = urlDelSitio(sitio, await ops.puertosWeb());
  const abierto = ops.abrirUrl ? await ops.abrirUrl(url) : false;
  return { sitio: sitio.id, url, abierto };
};

const PREFIJO_FUENTE = {
  error: (id: string) => `sitio:${id}:error`,
  acceso: (id: string) => `sitio:${id}:acceso`,
  laravel: (id: string) => `laravel:${id}`,
  ci3: (id: string) => `ci3:${id}`,
  tunel: (id: string) => `tunel:${id}`,
} as const;

/** El id de la fuente de registro de un sitio: solo una que el núcleo ya liste (nunca una ruta). */
export async function fuenteDeSitio(
  ops: OperacionesCli,
  a: ArgsOrden<'registros'>,
): Promise<string> {
  const sitio = await buscarSitio(ops, a.sitio);
  const id = PREFIJO_FUENTE[a.fuente ?? 'error'](sitio.id);
  if (!(await ops.fuentesRegistro()).some((f) => f.id === id)) {
    throw falla('cli.fuente_no_existe', 'Ese registro todavía no existe.');
  }
  return id;
}

export const LINEAS_REGISTRO_CLI = 200;

const registros: Orden<'registros'> = async (ops, a) => {
  const id = await fuenteDeSitio(ops, a);
  const lineas = await ops.leerRegistro(id, a.lineas ?? LINEAS_REGISTRO_CLI);
  return { sitio: a.sitio, fuente: a.fuente ?? 'error', lineas };
};

const doctor: Orden<'doctor'> = async (ops) => {
  const hallazgos = await ops.revisarDoctor();
  return {
    hallazgos: hallazgos.map((h) => ({
      id: h.id,
      revision: h.revision,
      gravedad: h.gravedad,
      codigo: h.codigo,
      datos: h.datos,
      evidencia: h.evidencia.slice(0, 500),
      reparable: h.reparacion !== undefined && !h.reparacion.soloInforma,
    })),
  };
};

const resultadoWorkspace = (r: ResultadoWorkspace[]) =>
  r.map((x) => ({
    elemento: x.elemento,
    ok: x.ok,
    encendido: x.encendido,
    ...(x.codigo ? { codigo: x.codigo } : {}),
    ...(x.aviso ? { aviso: x.aviso } : {}),
    ...(x.detalle ? { detalle: x.detalle } : {}),
  }));

/** Enciende o apaga con las mismas puertas de siempre: la confianza de las recetas y de los sitios importados siguen vigentes. */
const arrancar =
  (encender: boolean): Orden<'iniciar'> =>
  async (ops, a) => {
    if (a.workspace !== undefined) {
      if (!(await ops.workspaces()).some((w) => w.id === a.workspace)) {
        throw falla('workspaces.no_existe', 'No existe ese workspace.');
      }
      const r = encender
        ? await ops.iniciarWorkspace(a.workspace)
        : await ops.detenerWorkspace(a.workspace);
      return { workspace: a.workspace, resultados: resultadoWorkspace(r) };
    }
    if (a.servicio !== undefined) {
      if (encender) await ops.iniciarServicio(a.servicio);
      else await ops.detenerServicio(a.servicio);
      const e = (await ops.estadoServicios()).find((s) => s.id === a.servicio);
      return { servicio: a.servicio, estado: e?.estado ?? null };
    }
    // Igual que "Iniciar todo" y "Detener todo" de la bandeja: nunca abre túneles.
    if (encender) await ops.iniciarTodo();
    else await ops.detenerTodo();
    return { todo: true };
  };

const ORDENES: { [O in OrdenCli]: Orden<O> } = {
  estado,
  vincular,
  vigilar,
  usar,
  asegurar,
  compartir,
  abrir,
  registros,
  doctor,
  iniciar: arrancar(true),
  detener: arrancar(false) as unknown as Orden<'detener'>,
};

/**
 * Ejecuta una orden de la lista blanca: valida los argumentos, la corre y devuelve la respuesta
 * ya limpia (sin secretos). Un error del núcleo sale con su código y solo sus datos declarados.
 */
export async function ejecutarOrden(
  ops: OperacionesCli,
  orden: unknown,
  args: unknown,
): Promise<RespuestaCli> {
  if (!esOrdenCli(orden)) {
    return { ok: false, error: { codigo: 'cli.orden_desconocida' } };
  }
  try {
    const validos = validarArgs(orden, args);
    const datos = await (ORDENES[orden] as Orden<OrdenCli>)(ops, validos as never);
    return { ok: true, datos: limpiarSalida(datos) };
  } catch (e) {
    return { ok: false, error: errorParaCli(e) };
  }
}
