import http from 'node:http';
import path from 'node:path';
// Un solo archivo del núcleo, sin dependencias: el cliente no arrastra el resto del núcleo.
import { enmascararSecretos } from '../../../../packages/core/src/patronesSecretos';
import type { ArchivoCli, LecturaCli } from './archivoCli';
import { TEXTOS_CLI, esIdioma, textoDeCodigo, type Idioma, type TextosCli } from './textos';

/** Códigos de salida estables. */
export const SALIDA = { BIEN: 0, ERROR: 1, USO: 2, APP_CERRADA: 3 } as const;

/** Espera máxima de `--abrir` a que la app deje su `cli.json`. */
export const ESPERA_ABRIR_MS = 30_000;
/** Plazo de una petición: la orden más lenta del servidor tarda 5 min (iniciar/detener). */
const PLAZO_PETICION_MS = 6 * 60_000;
const FUENTES = ['error', 'acceso', 'laravel', 'ci3', 'tunel'] as const;

export interface DepsCli {
  /** Lee `run/cli.json` con las comprobaciones de seguridad. */
  leerCliJson: () => Promise<LecturaCli>;
  salida: { out: (t: string) => void; err: (t: string) => void };
  /** Idioma cuando todavía no se sabe el de la app (config.json o el del sistema). */
  idioma: () => Idioma;
  cwd: string;
  /** Hay una terminal interactiva (stdin y stderr): se puede preguntar. */
  tty: boolean;
  /** Muestra la pregunta y devuelve lo que se escribió (null: se cerró la entrada). */
  preguntar: (texto: string) => Promise<string | null>;
  /** `--abrir`: lanza la app (con `--iniciar-todo`). Sin esto, `--abrir` no puede hacer nada. */
  abrirApp?: () => Promise<boolean>;
  /** Pruebas: espera entre lecturas de `cli.json` y plazo total de `--abrir`. */
  esperaAbrirMs?: number;
  pausaMs?: number;
  /** Corta el seguimiento de registros (Ctrl+C lo hace el sistema). */
  senal?: AbortSignal;
}

class ErrorUso extends Error {}
class ErrorConexion extends Error {
  constructor(readonly tipo: 'no-responde' | 'no-autorizado') {
    super(tipo);
  }
}

interface Banderas {
  json: boolean;
  abrir: boolean;
  si: boolean;
  seguir: boolean;
  global: boolean;
  cerrar: boolean;
  quitar: boolean;
  ayuda: boolean;
  proveedor?: string;
  datosReales?: string;
  fuente?: string;
  lineas?: number;
  nombre?: string;
  dominio?: string;
  workspace?: string;
  servicio?: string;
}

const ORDENES = [
  'status',
  'link',
  'park',
  'use',
  'secure',
  'share',
  'open',
  'logs',
  'doctor',
  'start',
  'stop',
] as const;
type Orden = (typeof ORDENES)[number];

/** Cuántos argumentos sueltos admite cada orden: [mínimo, máximo]. */
const ARIDAD: Record<Orden, [number, number]> = {
  status: [0, 0],
  link: [0, 1],
  park: [0, 1],
  use: [1, 1],
  secure: [1, 1],
  share: [1, 1],
  open: [1, 1],
  logs: [1, 1],
  doctor: [0, 0],
  start: [0, 1],
  stop: [0, 1],
};

/** Banderas con valor: `--x v` o `--x=v`. */
const CON_VALOR: Record<string, keyof Banderas> = {
  '--proveedor': 'proveedor',
  '--datos-reales': 'datosReales',
  '--fuente': 'fuente',
  '--nombre': 'nombre',
  '--dominio': 'dominio',
  '--workspace': 'workspace',
  '--servicio': 'servicio',
  '--lineas': 'lineas',
  '-n': 'lineas',
};
const BOOLEANAS: Record<string, keyof Banderas> = {
  '--json': 'json',
  '--abrir': 'abrir',
  '--si': 'si',
  '--yes': 'si',
  '--follow': 'seguir',
  '-f': 'seguir',
  '--global': 'global',
  '--cerrar': 'cerrar',
  '--quitar': 'quitar',
  '--help': 'ayuda',
  '-h': 'ayuda',
};

const ORDENES_PERMITIDAS: Record<Orden, readonly (keyof Banderas)[]> = {
  status: [],
  link: ['nombre', 'dominio'],
  park: ['quitar'],
  use: ['global', 'si'],
  secure: [],
  share: ['proveedor', 'datosReales', 'cerrar', 'si'],
  open: [],
  logs: ['seguir', 'fuente', 'lineas'],
  doctor: [],
  start: ['workspace', 'servicio'],
  stop: ['workspace', 'servicio'],
};
const GENERALES: readonly (keyof Banderas)[] = ['json', 'abrir', 'ayuda'];

function parsear(
  argv: readonly string[],
  T: TextosCli,
): { orden: Orden | null; pos: string[]; f: Banderas } {
  const f: Banderas = {
    json: false,
    abrir: false,
    si: false,
    seguir: false,
    global: false,
    cerrar: false,
    quitar: false,
    ayuda: false,
  };
  const pos: string[] = [];
  const usadas = new Set<keyof Banderas>();
  const marcar = (clave: keyof Banderas, valor: string | boolean): void => {
    usadas.add(clave);
    if (clave === 'lineas') {
      const n = typeof valor === 'string' && /^\d{1,5}$/.test(valor) ? Number(valor) : 0;
      if (n < 1 || n > 2000)
        throw new ErrorUso(T.argumentoDesconocido(`--lineas ${String(valor)}`));
      f.lineas = n;
    } else if (typeof valor === 'boolean') (f as unknown as Record<string, boolean>)[clave] = valor;
    else (f as unknown as Record<string, string>)[clave] = valor;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--') {
      pos.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('-') && a.length > 1) {
      const eq = a.startsWith('--') ? a.indexOf('=') : -1;
      const nombre = eq > 0 ? a.slice(0, eq) : a;
      if (Object.hasOwn(BOOLEANAS, nombre) && eq < 0) {
        marcar(BOOLEANAS[nombre]!, true);
        continue;
      }
      if (Object.hasOwn(CON_VALOR, nombre)) {
        let v: string | undefined;
        if (eq > 0) v = a.slice(eq + 1);
        else v = argv[++i];
        if (v === undefined || (v.startsWith('-') && eq < 0)) {
          throw new ErrorUso(T.faltaArgumento(`${nombre} <valor>`));
        }
        marcar(CON_VALOR[nombre]!, v);
        continue;
      }
      throw new ErrorUso(T.argumentoDesconocido(a));
    }
    pos.push(a);
  }
  const primero = pos.shift();
  if (primero === undefined) return { orden: null, pos, f };
  if (primero === 'help') return { orden: null, pos, f: { ...f, ayuda: true } };
  if (!(ORDENES as readonly string[]).includes(primero)) {
    throw new ErrorUso(T.argumentoDesconocido(primero));
  }
  const orden = primero as Orden;
  // Cada orden solo admite sus banderas (y las generales): una de otra orden es un error de uso.
  for (const u of usadas) {
    if (!GENERALES.includes(u) && !ORDENES_PERMITIDAS[orden].includes(u)) {
      const nombre =
        Object.entries({ ...BOOLEANAS, ...CON_VALOR }).find(([, v]) => v === u)?.[0] ?? String(u);
      throw new ErrorUso(T.argumentoDesconocido(nombre));
    }
  }
  const [min, max] = ARIDAD[orden];
  if (pos.length < min)
    throw new ErrorUso(T.faltaArgumento(orden === 'use' ? 'servicio@versión' : '<sitio>'));
  if (pos.length > max) throw new ErrorUso(T.sobraArgumento(pos[max]!));
  return { orden, pos, f };
}

/* ───────────── Texto de salida ───────────── */

/** Sin caracteres de control (un registro no puede escribir secuencias de escape en la terminal). */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;
export const sinControl = (t: string): string => t.replace(CONTROL, '');

/** Texto limpio y sin secretos: control fuera, patrones de secretos enmascarados y el token jamás. */
export function textoSeguro(t: string, token: string | null): string {
  let r = enmascararSecretos(sinControl(t));
  if (token) r = r.split(token).join('***');
  return r;
}

/** Igual para un valor JSON entero (con `--json` no sale nada que no pasaría por la terminal). */
function jsonSeguro(v: unknown, token: string | null, nivel = 0): unknown {
  if (typeof v === 'string') return textoSeguro(v, token);
  if (v === null || typeof v === 'number' || typeof v === 'boolean') return v;
  if (nivel > 8) return null;
  if (Array.isArray(v)) return v.slice(0, 5000).map((x) => jsonSeguro(x, token, nivel + 1));
  if (typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (k === 'token' || x === undefined || typeof x === 'function') continue;
      o[k] = jsonSeguro(x, token, nivel + 1);
    }
    return o;
  }
  return null;
}

/* ───────────── HTTP ───────────── */

interface RespuestaHttp {
  estado: number;
  json: unknown;
}

function pedir(
  a: ArchivoCli,
  o: { metodo: 'GET' | 'POST'; ruta: string; cuerpo?: unknown; senal?: AbortSignal },
  alLinea?: (l: string) => void,
): Promise<RespuestaHttp> {
  return new Promise((resolve, reject) => {
    const texto = o.cuerpo === undefined ? undefined : JSON.stringify(o.cuerpo);
    const req = http.request(
      {
        host: '127.0.0.1',
        port: a.puerto,
        method: o.metodo,
        path: o.ruta,
        headers: {
          authorization: `Bearer ${a.token}`,
          'x-wolf-cli': '1',
          ...(texto === undefined
            ? {}
            : { 'content-type': 'application/json', 'content-length': Buffer.byteLength(texto) }),
        },
        timeout: alLinea ? undefined : PLAZO_PETICION_MS,
        ...(o.senal ? { signal: o.senal } : {}),
      },
      (res) => {
        const partes: Buffer[] = [];
        let resto = '';
        res.setEncoding('utf8');
        res.on('data', (d: string) => {
          if (alLinea && (res.statusCode ?? 0) === 200) {
            resto += d;
            let i: number;
            while ((i = resto.indexOf('\n')) >= 0) {
              const linea = resto.slice(0, i);
              resto = resto.slice(i + 1);
              if (linea) alLinea(linea);
            }
          } else {
            partes.push(Buffer.from(d, 'utf8'));
            if (Buffer.concat(partes).length > 16 * 1024 * 1024) req.destroy();
          }
        });
        res.on('end', () => {
          if (alLinea && (res.statusCode ?? 0) === 200) {
            if (resto) alLinea(resto);
            resolve({ estado: 200, json: null });
            return;
          }
          let json: unknown = null;
          try {
            json = JSON.parse(Buffer.concat(partes).toString('utf8'));
          } catch {
            // no es JSON
          }
          resolve({ estado: res.statusCode ?? 0, json });
        });
        res.on('error', () => reject(new ErrorConexion('no-responde')));
        res.on('aborted', () => reject(new ErrorConexion('no-responde')));
      },
    );
    req.on('timeout', () => req.destroy());
    req.on('error', () => {
      if (o.senal?.aborted) resolve({ estado: 200, json: null });
      else reject(new ErrorConexion('no-responde'));
    });
    req.end(texto);
  });
}

interface ErrorServidor {
  codigo: string;
  datos?: Record<string, string | number>;
}
type ResultadoOrden =
  { ok: true; datos: Record<string, unknown> } | { ok: false; error: ErrorServidor };

function aResultado(r: RespuestaHttp): ResultadoOrden {
  if (r.estado === 401 || r.estado === 403) throw new ErrorConexion('no-autorizado');
  const j = r.json as {
    ok?: unknown;
    datos?: unknown;
    error?: { codigo?: unknown; datos?: unknown };
  } | null;
  if (j && j.ok === true && j.datos !== null && typeof j.datos === 'object') {
    return { ok: true, datos: j.datos as Record<string, unknown> };
  }
  if (j && j.ok === false && typeof j.error?.codigo === 'string') {
    const datos: Record<string, string | number> = {};
    if (j.error.datos && typeof j.error.datos === 'object') {
      for (const [k, v] of Object.entries(j.error.datos)) {
        if (typeof v === 'string' || typeof v === 'number') datos[k] = v;
      }
    }
    return { ok: false, error: { codigo: j.error.codigo, datos } };
  }
  return { ok: false, error: { codigo: 'wolf.respuesta_invalida' } };
}

/* ───────────── La orden ───────────── */

const esSi = (t: string | null, T: TextosCli): boolean =>
  t !== null && T.si.includes(t.trim().toLowerCase());

const tabla = (filas: string[][]): string[] => {
  const ancho: number[] = [];
  for (const f of filas) f.forEach((c, i) => (ancho[i] = Math.max(ancho[i] ?? 0, c.length)));
  return filas.map((f) =>
    f
      .map((c, i) => (i === f.length - 1 ? c : c.padEnd(ancho[i]!)))
      .join('  ')
      .trimEnd(),
  );
};

interface SitioResumen {
  id: string;
  nombre: string;
  dominio: string;
  tipo: string;
  php: string | null;
  https: boolean;
  datosReales: boolean;
  carpeta: string;
  url: string;
  tunel: { proveedor: string };
}

const comoTexto = (v: unknown): string =>
  typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v);

export async function ejecutarCli(argv: readonly string[], d: DepsCli): Promise<number> {
  let idioma: Idioma = d.idioma();
  let T = TEXTOS_CLI[idioma];
  let token: string | null = null;
  let json = argv.includes('--json');

  const err = (t: string): void => d.salida.err(textoSeguro(t, token));
  const out = (t: string): void => d.salida.out(textoSeguro(t, token));
  const poner = (idi: Idioma): void => {
    idioma = idi;
    T = TEXTOS_CLI[idi];
  };

  /** Error local o del servidor: en `--json` va a la salida estándar como JSON; si no, a la de errores. */
  const fallo = (
    codigo: string,
    mensaje: string,
    salida: number,
    extra?: Record<string, unknown>,
  ): number => {
    if (json) {
      out(JSON.stringify(jsonSeguro({ ok: false, error: { codigo, mensaje, ...extra } }, token)));
    } else err(mensaje);
    return salida;
  };
  const falloServidor = (e: ErrorServidor): number =>
    fallo(
      e.codigo,
      T.errorOrden(
        e.codigo === 'wolf.respuesta_invalida'
          ? T.respuestaInvalida
          : textoDeCodigo(e.codigo, e.datos, idioma),
      ),
      SALIDA.ERROR,
      e.datos && Object.keys(e.datos).length > 0 ? { datos: e.datos } : undefined,
    );

  let p: ReturnType<typeof parsear>;
  try {
    p = parsear(argv, T);
  } catch (e) {
    if (e instanceof ErrorUso) return fallo('wolf.uso', T.usoIncorrecto(e.message), SALIDA.USO);
    throw e;
  }
  json = p.f.json;
  if (p.f.ayuda) {
    d.salida.out(T.uso);
    return SALIDA.BIEN;
  }
  if (p.orden === null) return fallo('wolf.uso', T.uso, SALIDA.USO);
  const { orden, pos, f } = p;

  // Argumentos que se validan sin la app (un error de uso no necesita que esté abierta).
  let spec: { servicio: string; version: string } | null = null;
  if (orden === 'use') {
    const m = /^([A-Za-z][A-Za-z0-9]*)@([0-9][0-9A-Za-z.+_-]{0,31})$/.exec(pos[0]!);
    if (!m) return fallo('wolf.uso', T.usoIncorrecto(T.versionInvalida), SALIDA.USO);
    spec = { servicio: m[1]!.toLowerCase(), version: m[2]! };
  }
  if (
    orden === 'logs' &&
    f.fuente !== undefined &&
    !(FUENTES as readonly string[]).includes(f.fuente)
  ) {
    return fallo(
      'wolf.uso',
      T.usoIncorrecto(T.argumentoDesconocido(`--fuente ${f.fuente}`)),
      SALIDA.USO,
    );
  }

  // 1. ¿Hay app a la que hablarle?
  let lectura = await d.leerCliJson();
  if (!lectura.ok && f.abrir && d.abrirApp && lectura.motivo !== 'inseguro') {
    err(T.abriendoApp);
    const total = d.esperaAbrirMs ?? ESPERA_ABRIR_MS;
    const pausa = d.pausaMs ?? 500;
    if (await d.abrirApp().catch(() => false)) {
      const inicio = Date.now();
      while (!lectura.ok && Date.now() - inicio < total && !d.senal?.aborted) {
        await new Promise((r) => setTimeout(r, pausa));
        lectura = await d.leerCliJson();
      }
    }
    if (!lectura.ok) return fallo('wolf.app_no_abrio', T.appNoAbrio, SALIDA.APP_CERRADA);
  }
  if (!lectura.ok) {
    const m =
      lectura.motivo === 'inseguro'
        ? T.archivoInseguro
        : lectura.motivo === 'proceso'
          ? `${T.archivoViejo}\n${T.appCerradaAbrir}`
          : lectura.motivo === 'ilegible'
            ? T.archivoInseguro
            : `${T.appCerrada}\n${T.appCerradaAbrir}`;
    return fallo(
      lectura.motivo === 'inseguro' ? 'wolf.archivo_inseguro' : 'wolf.app_cerrada',
      m,
      SALIDA.APP_CERRADA,
    );
  }
  const acceso = lectura.archivo;
  token = acceso.token;
  if (esIdioma(acceso.version.idioma)) poner(acceso.version.idioma);

  const llamar = async (o: string, args: Record<string, unknown>): Promise<ResultadoOrden> =>
    aResultado(await pedir(acceso, { metodo: 'POST', ruta: '/orden', cuerpo: { orden: o, args } }));

  /** Sitio por id, dominio o nombre (sin distinguir mayúsculas), según el estado de la app. */
  const resolverSitio = async (
    dado: string,
  ): Promise<{ ok: true; sitio: SitioResumen } | { ok: false; error: ErrorServidor }> => {
    const r = await llamar('estado', {});
    if (!r.ok) return r;
    const sitios = (r.datos.sitios as SitioResumen[] | undefined) ?? [];
    const q = dado.trim().toLowerCase();
    const s =
      sitios.find((x) => x.id.toLowerCase() === q) ??
      sitios.find((x) => x.dominio.toLowerCase() === q) ??
      sitios.find((x) => x.nombre.toLowerCase() === q);
    return s
      ? { ok: true, sitio: s }
      : {
          ok: false,
          error: { codigo: 'cli.sitio_no_encontrado', datos: { sitio: dado.slice(0, 80) } },
        };
  };

  /** Pregunta en la terminal (a stderr: stdout queda limpio para `--json`). */
  const confirmarTerminal = async (pregunta: string): Promise<boolean | 'sin-terminal'> => {
    if (!d.tty) return 'sin-terminal';
    return esSi(await d.preguntar(pregunta), T);
  };

  const imprimir = (datos: unknown, lineas: string[]): void => {
    if (json) out(JSON.stringify(jsonSeguro(datos, token), null, 2));
    else for (const l of lineas) out(l);
  };

  try {
    switch (orden) {
      case 'status': {
        const r = await llamar('estado', {});
        if (!r.ok) return falloServidor(r.error);
        const sitios = (r.datos.sitios as SitioResumen[] | undefined) ?? [];
        const servicios =
          (r.datos.servicios as
            | {
                id: string;
                nombre: string;
                estado: string;
                version: string | null;
                puertos: number[];
              }[]
            | undefined) ?? [];
        const tuneles =
          (r.datos.tuneles as
            { sitio: string; estado: string; url: string | null }[] | undefined) ?? [];
        const l: string[] = [T.cabSitios];
        l.push(
          ...(sitios.length === 0
            ? [`  ${T.sinSitios}`]
            : tabla(
                sitios.map((s) => [
                  `  ${s.dominio}`,
                  s.php ? `php ${s.php}` : s.tipo,
                  s.https ? 'https' : 'http',
                  s.url,
                ]),
              )),
        );
        l.push('', T.cabServicios);
        l.push(
          ...(servicios.length === 0
            ? [`  ${T.sinServicios}`]
            : tabla(
                servicios.map((s) => [
                  `  ${s.nombre} ${s.version ?? ''}`.trimEnd(),
                  T.estados[s.estado] ?? s.estado,
                  s.puertos.length > 0 ? `:${s.puertos.join(', :')}` : '',
                ]),
              )),
        );
        l.push('', T.cabTuneles);
        l.push(
          ...(tuneles.length === 0
            ? [`  ${T.sinTuneles}`]
            : tabla(
                tuneles.map((t) => [`  ${t.sitio}`, T.estados[t.estado] ?? t.estado, t.url ?? '']),
              )),
        );
        imprimir(r.datos, l);
        return SALIDA.BIEN;
      }

      case 'link': {
        const carpeta = path.resolve(d.cwd, pos[0] ?? '.');
        const r = await llamar('vincular', {
          carpeta,
          ...(f.nombre !== undefined ? { nombre: f.nombre } : {}),
          ...(f.dominio !== undefined ? { dominio: f.dominio } : {}),
        });
        if (!r.ok) return falloServidor(r.error);
        const s = r.datos.sitio as SitioResumen;
        imprimir(r.datos, [T.vinculado(s.nombre, s.url)]);
        return SALIDA.BIEN;
      }

      case 'park': {
        const carpeta = f.quitar ? null : path.resolve(d.cwd, pos[0] ?? '.');
        if (f.quitar && pos.length > 0) {
          return fallo('wolf.uso', T.usoIncorrecto(T.sobraArgumento(pos[0]!)), SALIDA.USO);
        }
        const r = await llamar('vigilar', { carpeta });
        if (!r.ok) return falloServidor(r.error);
        imprimir(r.datos, [
          carpeta === null ? T.dejoDeVigilar : T.vigilando(comoTexto(r.datos.carpeta)),
        ]);
        return SALIDA.BIEN;
      }

      case 'use': {
        const s = spec!;
        if (f.global) {
          if (s.servicio !== 'php') {
            return fallo('wolf.uso', T.usoIncorrecto(T.versionInvalida), SALIDA.USO);
          }
          if (!f.si) {
            const c = await confirmarTerminal(T.preguntaPhpGlobal(s.version));
            if (c === 'sin-terminal')
              return fallo('wolf.necesita_terminal', T.necesitaTerminal, SALIDA.USO);
            if (!c) return fallo('wolf.cancelado', T.cancelado, SALIDA.ERROR);
          }
          err(T.confirmeEnApp);
          const r = await llamar('usar', {
            servicio: 'php',
            version: s.version,
            global: true,
            si: true,
          });
          if (!r.ok) return falloServidor(r.error);
          imprimir(r.datos, [T.phpGlobal(comoTexto(r.datos.version))]);
          return SALIDA.BIEN;
        }
        const r = await llamar('usar', {
          servicio: s.servicio,
          version: s.version,
          carpeta: d.cwd,
        });
        if (!r.ok) return falloServidor(r.error);
        imprimir(r.datos, [
          T.usando(
            comoTexto(r.datos.servicio),
            comoTexto(r.datos.version),
            comoTexto(r.datos.sitio),
          ),
        ]);
        return SALIDA.BIEN;
      }

      case 'secure': {
        const sitio = await resolverSitio(pos[0]!);
        if (!sitio.ok) return falloServidor(sitio.error);
        const r = await llamar('asegurar', { sitio: sitio.sitio.id });
        if (!r.ok) return falloServidor(r.error);
        const s = r.datos.sitio as SitioResumen;
        const l = [r.datos.ya === true ? T.yaSeguro(s.dominio) : T.asegurado(s.dominio, s.url)];
        if (r.datos.caConfiable === false) l.push(T.caNoConfiable);
        imprimir(r.datos, l);
        return SALIDA.BIEN;
      }

      case 'share': {
        const sitio = await resolverSitio(pos[0]!);
        if (!sitio.ok) return falloServidor(sitio.error);
        const s = sitio.sitio;
        if (f.cerrar) {
          const r = await llamar('compartir', { sitio: s.id, cerrar: true });
          if (!r.ok) return falloServidor(r.error);
          imprimir(r.datos, [T.tunelCerrado(s.dominio)]);
          return SALIDA.BIEN;
        }
        const proveedor = s.tunel.proveedor;
        if (f.proveedor !== undefined && f.proveedor !== proveedor) {
          return falloServidor({ codigo: 'cli.proveedor_distinto', datos: { proveedor } });
        }
        // Lo que se confirma en la terminal es lo que el usuario ve aquí: el servidor y la
        // ventana de la app vuelven a comprobarlo.
        if (!f.si) {
          const c = await confirmarTerminal(T.preguntaCompartir(s.dominio, proveedor));
          if (c === 'sin-terminal')
            return fallo('wolf.necesita_terminal', T.necesitaTerminal, SALIDA.USO);
          if (!c) return fallo('wolf.cancelado', T.cancelado, SALIDA.ERROR);
        }
        let confirmaDatosReales: string | undefined;
        if (s.datosReales) {
          // `--si` no cubre esto: con datos reales se escribe el dominio exacto.
          if (f.datosReales !== undefined) confirmaDatosReales = f.datosReales;
          else if (d.tty)
            confirmaDatosReales = (await d.preguntar(T.preguntaDatosReales(s.dominio))) ?? '';
          else return fallo('wolf.datos_reales', T.datosRealesFalta, SALIDA.USO);
          if (confirmaDatosReales.trim() !== s.dominio) {
            return fallo('wolf.cancelado', T.datosRealesNoCoincide, SALIDA.ERROR);
          }
          confirmaDatosReales = s.dominio;
        }
        err(T.confirmeEnApp);
        const r = await llamar('compartir', {
          sitio: s.id,
          si: true,
          proveedor,
          ...(confirmaDatosReales !== undefined ? { confirmaDatosReales } : {}),
        });
        if (!r.ok) return falloServidor(r.error);
        const url = r.datos.url;
        imprimir(r.datos, [
          typeof url === 'string' && url
            ? T.tunelActivo(url)
            : T.tunelEstado(T.estados[comoTexto(r.datos.estado)] ?? comoTexto(r.datos.estado)),
        ]);
        return SALIDA.BIEN;
      }

      case 'open': {
        const sitio = await resolverSitio(pos[0]!);
        if (!sitio.ok) return falloServidor(sitio.error);
        const r = await llamar('abrir', { sitio: sitio.sitio.id });
        if (!r.ok) return falloServidor(r.error);
        imprimir(r.datos, [
          r.datos.abierto === true
            ? T.abierto(comoTexto(r.datos.url))
            : T.abrirManual(comoTexto(r.datos.url)),
        ]);
        return SALIDA.BIEN;
      }

      case 'logs': {
        const sitio = await resolverSitio(pos[0]!);
        if (!sitio.ok) return falloServidor(sitio.error);
        const id = sitio.sitio.id;
        if (!f.seguir) {
          const r = await llamar('registros', {
            sitio: id,
            ...(f.fuente !== undefined ? { fuente: f.fuente } : {}),
            ...(f.lineas !== undefined ? { lineas: f.lineas } : {}),
          });
          if (!r.ok) return falloServidor(r.error);
          const lineas = (r.datos.lineas as unknown[] | undefined)?.map(comoTexto) ?? [];
          imprimir(r.datos, lineas.length > 0 ? lineas : [T.sinRegistros]);
          return SALIDA.BIEN;
        }
        return await seguirRegistros({
          d,
          acceso,
          id,
          f,
          T,
          out,
          err,
          json,
          token,
          falloServidor,
          setAcceso: (a) => (token = a.token),
        });
      }

      case 'doctor': {
        const r = await llamar('doctor', {});
        if (!r.ok) return falloServidor(r.error);
        const hallazgos =
          (r.datos.hallazgos as
            | {
                gravedad: 'error' | 'aviso' | 'info';
                codigo: string;
                datos: Record<string, string | number>;
                id: string;
              }[]
            | undefined) ?? [];
        const l =
          hallazgos.length === 0
            ? [T.doctorSinHallazgos]
            : [
                T.doctorTitulo(hallazgos.length),
                ...hallazgos.map(
                  (h) =>
                    `  [${T.gravedad[h.gravedad] ?? h.gravedad}] ${textoDeCodigo(h.codigo, h.datos, idioma)}`,
                ),
              ];
        imprimir(r.datos, l);
        return SALIDA.BIEN;
      }

      case 'start':
      case 'stop': {
        const nombre = pos[0];
        const nombreOrden = orden === 'start' ? 'iniciar' : 'detener';
        if (nombre !== undefined && (f.workspace !== undefined || f.servicio !== undefined)) {
          return fallo('wolf.uso', T.usoIncorrecto(T.sobraArgumento(nombre)), SALIDA.USO);
        }
        const ws = f.workspace ?? (f.servicio === undefined ? nombre : undefined);
        // Un id con punto o @ (php-8.4, mysql@8.4) nunca es un workspace: va directo como servicio.
        const esIdWorkspace = ws !== undefined && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(ws);
        const srv = f.servicio ?? (ws !== undefined && !esIdWorkspace ? ws : undefined);
        let r: ResultadoOrden;
        if (ws !== undefined && esIdWorkspace) {
          r = await llamar(nombreOrden, { workspace: ws });
          // Sin esa clase de workspace: puede ser un servicio (los ids con punto o @ nunca son workspace).
          if (!r.ok && r.error.codigo === 'workspaces.no_existe' && f.workspace === undefined) {
            // Solo si de verdad es un servicio conocido: si no, el error es el del workspace.
            const e = await llamar('estado', {});
            const ids = e.ok ? ((e.datos.servicios as { id: string }[] | undefined) ?? []) : [];
            if (ids.some((x) => x.id === ws)) r = await llamar(nombreOrden, { servicio: ws });
          }
        } else if (srv !== undefined) r = await llamar(nombreOrden, { servicio: srv });
        else r = await llamar(nombreOrden, {});
        if (!r.ok) return falloServidor(r.error);
        const que = comoTexto(r.datos.workspace ?? r.datos.servicio ?? '') || T.todo;
        const l = [(orden === 'start' ? T.iniciado : T.detenido)(que)];
        const res = r.datos.resultados as
          { elemento: string; ok: boolean; codigo?: string; encendido: boolean }[] | undefined;
        for (const x of res ?? []) {
          l.push(
            `  ${T.elemento(x.elemento, x.ok ? (x.encendido ? T.estados.encendido! : T.estados.apagado!) : x.codigo ? textoDeCodigo(x.codigo, undefined, idioma) : T.estados.error!)}`,
          );
        }
        imprimir(r.datos, l);
        const fallaron = (res ?? []).some((x) => !x.ok);
        return fallaron ? SALIDA.ERROR : SALIDA.BIEN;
      }
    }
  } catch (e) {
    if (e instanceof ErrorConexion) {
      return fallo(
        e.tipo === 'no-autorizado' ? 'wolf.no_autorizado' : 'wolf.no_responde',
        e.tipo === 'no-autorizado' ? T.noAutorizado : T.noResponde,
        SALIDA.APP_CERRADA,
      );
    }
    throw e;
  }
  return SALIDA.BIEN;
}

interface ParamsSeguimiento {
  d: DepsCli;
  acceso: ArchivoCli;
  id: string;
  f: Banderas;
  T: TextosCli;
  out: (t: string) => void;
  err: (t: string) => void;
  json: boolean;
  token: string | null;
  falloServidor: (e: ErrorServidor) => number;
  setAcceso: (a: ArchivoCli) => void;
}

/**
 * `logs -f`: las últimas líneas y las nuevas, hasta Ctrl+C. El servidor corta cada seguimiento a
 * la hora: se vuelve a pedir mientras la app siga ahí (con `cli.json` nuevo si se reinició).
 */
async function seguirRegistros(p: ParamsSeguimiento): Promise<number> {
  let acceso = p.acceso;
  let primera = true;
  for (;;) {
    const q = new URLSearchParams({ sitio: p.id, seguir: '1' });
    if (p.f.fuente) q.set('fuente', p.f.fuente);
    // Al volver a pedir solo hace falta la última línea (no se repite lo ya mostrado).
    q.set('lineas', String(primera ? (p.f.lineas ?? 50) : 1));
    primera = false;
    let rechazo: ResultadoOrden | null = null;
    const r = await pedir(
      acceso,
      {
        metodo: 'GET',
        ruta: `/registros?${q.toString()}`,
        ...(p.d.senal ? { senal: p.d.senal } : {}),
      },
      (linea) => {
        try {
          const o = JSON.parse(linea) as { lineas?: unknown };
          if (!Array.isArray(o.lineas)) return;
          for (const l of o.lineas) {
            if (p.json) p.out(JSON.stringify({ linea: textoSeguro(String(l), p.token) }));
            else p.out(String(l));
          }
        } catch {
          // una línea rota del flujo no corta el seguimiento
        }
      },
    );
    if (r.estado !== 200) {
      rechazo = aResultado(r);
      if (!rechazo.ok) return p.falloServidor(rechazo.error);
    }
    if (p.d.senal?.aborted) return SALIDA.BIEN;
    // El flujo terminó (límite de una hora o la app se cerró): ¿sigue ahí?
    await new Promise((res) => setTimeout(res, p.d.pausaMs ?? 1000));
    const lectura = await p.d.leerCliJson();
    if (!lectura.ok) {
      p.err(p.T.seguimientoTermina);
      return SALIDA.APP_CERRADA;
    }
    acceso = lectura.archivo;
    p.setAcceso(acceso);
  }
}
