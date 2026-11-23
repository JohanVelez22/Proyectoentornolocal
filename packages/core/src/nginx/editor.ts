/**
 * Editor del vhost de Nginx de un sitio: reglas propias (dentro de su bloque `server`) o, en modo
 * avanzado, el vhost completo (`Sitio.vhostManual`, que WolfCore Dev ya no regenera).
 *
 * Modelo de amenaza (como el editor de `php.ini`): el texto llega del renderer y Nginx lo carga con
 * los permisos del usuario, escuchando en todas las interfaces (y en Internet si hay un túnel).
 * La defensa principal es el aislamiento del renderer (`contextIsolation`, `sandbox`, sin
 * `nodeIntegration`, CSP sin orígenes remotos, IPC solo de la ventana principal y con argumentos
 * validados). Además, el núcleo:
 *  - acepta solo el id del sitio y texto acotado (sin NUL ni controles); las rutas las arma él;
 *  - interpreta el texto como lo hace Nginx y rechaza lo que saldría del sitio: cargar código o
 *    módulos (`load_module`, perl, njs, lua), `include` de cualquier archivo que no sea uno estándar
 *    de la carpeta de Nginx, `root`/`alias`/`auth_basic_user_file` fuera de la carpeta del proyecto
 *    o con variables, un `SCRIPT_FILENAME` de FastCGI que no salga de la raíz del sitio (haría que
 *    PHP ejecute otro archivo del disco, como Adminer), `PHP_VALUE`, registros, temporales, cachés y `*_store`/WebDAV que escribirían en otras
 *    carpetas, certificados ajenos, directivas globales, otros bloques `server` en las reglas y,
 *    en el modo avanzado, dominios o puertos que no son del sitio (así no le quita el tráfico a
 *    otro; `listen` sin dirección y con `ssl`/`http2` solo en el puerto HTTPS, porque las opciones
 *    son del socket). Un `proxy_pass` (o `fastcgi_pass`…) a un servicio interno de WolfCore Dev
 *    (Adminer, Mailpit, MCP, bases de datos, PHP de otras ramas o sitios) se prohíbe: lo expondría
 *    en la red y el túnel. A un equipo que no es este solo se avisa: es un uso legítimo;
 *  - prueba el vhost con `nginx -t` sobre una copia temporal de toda la configuración antes de
 *    tocar nada, guarda una copia con fecha (historial de 10 por sitio), escribe de forma atómica,
 *    recarga, comprueba que Nginx siga respondiendo y, si no, vuelve a lo anterior solo.
 *
 * Límite conocido: una carpeta del proyecto que sea un enlace o junction hacia otro lugar se sirve
 * igual (Nginx en Windows no tiene `disable_symlinks`); el contenido del proyecto es del usuario.
 */
import { readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Almacen } from '../almacen';
import { ErrorWolf } from '../errores';
import { copiaConFecha } from '../herramientas/copiaConFecha';
import {
  esRutaAbsolutaDelSistema as esAbsoluta,
  rutaComparable,
  rutaDentroDe,
} from '../plataforma/sistema';
import type { Rutas } from '../rutas';
import type { Config, Sitio } from '../tipos';

/** Tope de las reglas propias y del vhost manual (en caracteres). */
export const LIMITE_REGLAS = 64 * 1024;
export const LIMITE_MANUAL = 256 * 1024;
/** Versiones anteriores que se conservan por sitio. */
export const MAX_VERSIONES_VHOST = 10;

export type ModoVhost = 'reglas' | 'manual';

// ---------------------------------------------------------------------------------------------
// Analizador (sigue a ngx_conf_read_token: así las llaves se cuentan igual que en Nginx)
// ---------------------------------------------------------------------------------------------

export interface Directiva {
  nombre: string;
  args: string[];
  linea: number;
  /** Contenido del bloque; null si la directiva termina en `;`. */
  hijos: Directiva[] | null;
}

type Token =
  { tipo: 'palabra'; valor: string; linea: number } | { tipo: ';' | '{' | '}'; linea: number };

/** Detalle de `nginx.sintaxis`: va como código (la interfaz lo traduce) y aquí en español. */
export const DETALLES_SINTAXIS = {
  'sintaxis.comillas_sin_cerrar': 'comillas sin cerrar',
  'sintaxis.tras_comillas': 'falta un espacio o ";" después de las comillas',
  'sintaxis.punto_y_coma_inesperado': '";" sin directiva',
  'sintaxis.llave_inesperada': '"{" sin directiva',
  'sintaxis.falta_punto_y_coma': 'falta ";" al final de la directiva',
  'sintaxis.sobra_llave': 'sobra una "}"',
  'sintaxis.falta_llave': 'falta una "}"',
} as const;

const errorSintaxis = (linea: number, detalle: keyof typeof DETALLES_SINTAXIS): ErrorWolf =>
  new ErrorWolf('nginx.sintaxis', `Línea ${linea}: ${DETALLES_SINTAXIS[detalle]}`, {
    linea,
    detalle,
  });

const esEspacio = (c: string): boolean => c === ' ' || c === '\t' || c === '\r' || c === '\n';

/** `\x` como lo copia Nginx (dentro y fuera de comillas): \" \' \\ \t \n \r; el resto, tal cual. */
const escape = (sig: string): string =>
  sig === '"' || sig === "'" || sig === '\\'
    ? sig
    : sig === 't'
      ? '\t'
      : sig === 'n'
        ? '\n'
        : sig === 'r'
          ? '\r'
          : `\\${sig}`;

function tokens(texto: string): Token[] {
  const res: Token[] = [];
  let i = 0;
  let linea = 1;
  const n = texto.length;
  while (i < n) {
    const c = texto[i]!;
    if (c === '\n') {
      linea++;
      i++;
      continue;
    }
    if (esEspacio(c)) {
      i++;
      continue;
    }
    if (c === '#') {
      while (i < n && texto[i] !== '\n') i++;
      continue;
    }
    if (c === ';' || c === '{' || c === '}') {
      res.push({ tipo: c, linea });
      i++;
      continue;
    }
    const inicio = linea;
    let valor = '';
    if (c === '"' || c === "'") {
      i++;
      for (;;) {
        if (i >= n) throw errorSintaxis(inicio, 'sintaxis.comillas_sin_cerrar');
        const d = texto[i]!;
        if (d === '\\' && i + 1 < n) {
          const sig = texto[i + 1]!;
          if (sig === '\n') linea++;
          valor += escape(sig);
          i += 2;
          continue;
        }
        if (d === c) {
          i++;
          break;
        }
        if (d === '\n') linea++;
        valor += d;
        i++;
      }
      // Nginx exige un separador tras las comillas.
      const sig = texto[i];
      if (sig !== undefined && !esEspacio(sig) && sig !== ';' && sig !== '{' && sig !== ')') {
        throw errorSintaxis(linea, 'sintaxis.tras_comillas');
      }
    } else {
      let variable = false;
      while (i < n) {
        const d = texto[i]!;
        // `${var}`: la llave es parte de la variable, no abre un bloque.
        if (d === '{' && variable) {
          valor += d;
          variable = false;
          i++;
          continue;
        }
        variable = false;
        if (d === '\\' && i + 1 < n) {
          const sig = texto[i + 1]!;
          if (sig === '\n') linea++;
          valor += escape(sig);
          i += 2;
          continue;
        }
        if (d === '$') {
          variable = true;
          valor += d;
          i++;
          continue;
        }
        if (esEspacio(d) || d === ';' || d === '{') break;
        valor += d;
        i++;
      }
    }
    res.push({ tipo: 'palabra', valor, linea: inicio });
  }
  return res;
}

/** Árbol de directivas del texto; lanza `nginx.sintaxis` si las llaves o los `;` no cuadran. */
export function analizarNginx(texto: string): Directiva[] {
  const raiz: Directiva[] = [];
  const pila: Directiva[][] = [raiz];
  let actual: Directiva | null = null;
  let ultimaLinea = 1;
  for (const t of tokens(texto)) {
    ultimaLinea = t.linea;
    const lista = pila[pila.length - 1]!;
    if (t.tipo === 'palabra') {
      if (actual) actual.args.push(t.valor);
      else actual = { nombre: t.valor, args: [], linea: t.linea, hijos: null };
      continue;
    }
    if (t.tipo === ';') {
      if (!actual) throw errorSintaxis(t.linea, 'sintaxis.punto_y_coma_inesperado');
      lista.push(actual);
      actual = null;
      continue;
    }
    if (t.tipo === '{') {
      if (!actual) throw errorSintaxis(t.linea, 'sintaxis.llave_inesperada');
      actual.hijos = [];
      lista.push(actual);
      pila.push(actual.hijos);
      actual = null;
      continue;
    }
    if (actual) throw errorSintaxis(actual.linea, 'sintaxis.falta_punto_y_coma');
    if (pila.length === 1) throw errorSintaxis(t.linea, 'sintaxis.sobra_llave');
    pila.pop();
  }
  if (actual) throw errorSintaxis(actual.linea, 'sintaxis.falta_punto_y_coma');
  if (pila.length > 1) throw errorSintaxis(ultimaLinea, 'sintaxis.falta_llave');
  return raiz;
}

// ---------------------------------------------------------------------------------------------
// Revisión: lo que no se permite porque saldría del sitio
// ---------------------------------------------------------------------------------------------

/** Lo que el texto puede tocar sin salir del sitio. */
export interface ContextoVhost {
  /** Carpeta del proyecto: `root`, `alias` y `auth_basic_user_file` deben quedar dentro. */
  carpeta: string;
  /** Dominio y alias del sitio (únicos `server_name` del modo avanzado). */
  dominios: string[];
  /** Puertos de Nginx: únicos `listen` del modo avanzado (`ssl`/`http2` solo en el HTTPS). */
  puertoHttp: number;
  puertoHttps: number;
  /**
   * Puertos de los servicios propios de WolfCore Dev (Adminer, Mailpit, MCP, bases de datos, PHP
   * de las ramas y pools de los sitios…): un proxy a ellos los expondría en la red y el túnel.
   */
  puertosInternos: number[];
  /** Upstreams de nginx.conf que son de este sitio (`php84` de su rama, `phpsitio_<id>`). */
  upstreamsPropios: string[];
  /** Registros del sitio (únicos `access_log`/`error_log` además de `off`). */
  logs: string[];
  /** Certificado y clave del sitio. */
  certificados: string[];
}

export interface AvisoVhost {
  codigo: 'nginx.aviso_destino_externo';
  directiva: string;
  destino: string;
  linea: number;
}

/** Directivas que cargan código, escriben fuera del sitio o son globales: nunca. */
const PROHIBIDAS = new Set([
  'load_module',
  'env',
  'user',
  'daemon',
  'master_process',
  'pid',
  'lock_file',
  'working_directory',
  'worker_processes',
  'worker_rlimit_nofile',
  'worker_rlimit_core',
  'worker_priority',
  'worker_cpu_affinity',
  'worker_shutdown_timeout',
  'thread_pool',
  'timer_resolution',
  'pcre_jit',
  'debug_points',
  'ssl_engine',
  'http',
  'events',
  'stream',
  'mail',
  'upstream',
  'map',
  'geo',
  'split_clients',
  'limit_req_zone',
  'limit_conn_zone',
  'dav_methods',
  'dav_access',
  'create_full_put_path',
  'min_delete_depth',
  'client_body_temp_path',
  'proxy_temp_path',
  'fastcgi_temp_path',
  'uwsgi_temp_path',
  'scgi_temp_path',
  'proxy_cache_path',
  'fastcgi_cache_path',
  'uwsgi_cache_path',
  'scgi_cache_path',
  'proxy_store',
  'proxy_store_access',
  'fastcgi_store',
  'fastcgi_store_access',
  'uwsgi_store',
  'uwsgi_store_access',
  'scgi_store',
  'scgi_store_access',
  'ssl_password_file',
  'ssl_trusted_certificate',
  'ssl_client_certificate',
  'ssl_crl',
  'ssl_dhparam',
  'ssl_stapling_file',
  'ssl_session_ticket_key',
  'ssl_certificate_cache',
  'xslt_stylesheet',
  'xml_entities',
  'perl',
  'perl_modules',
  'perl_require',
  'perl_set',
]);

/** Directivas `proxy_ssl_*` que leen archivos o pasan órdenes a OpenSSL. */
const PROXY_SSL_PROHIBIDAS = new Set([
  'proxy_ssl_certificate',
  'proxy_ssl_certificate_key',
  'proxy_ssl_trusted_certificate',
  'proxy_ssl_password_file',
  'proxy_ssl_crl',
  'proxy_ssl_conf_command',
  'ssl_conf_command',
]);

const prohibidaPorNombre = (n: string): boolean =>
  PROHIBIDAS.has(n) ||
  PROXY_SSL_PROHIBIDAS.has(n) ||
  n.startsWith('grpc_ssl_') ||
  n.startsWith('uwsgi_ssl_') ||
  n.startsWith('js_') ||
  n.startsWith('perl_') ||
  n.includes('lua');

/** `include` solo de los archivos estándar que WolfCore Dev copia junto a nginx.conf. */
export const INCLUDES_PERMITIDOS = [
  'fastcgi_params',
  'fastcgi.conf',
  'mime.types',
  'uwsgi_params',
  'scgi_params',
];

const DIRECTIVAS_RUTA = new Set(['root', 'alias', 'auth_basic_user_file']);
const DIRECTIVAS_LOG = new Set(['access_log', 'error_log']);
const DIRECTIVAS_CERT = new Set(['ssl_certificate', 'ssl_certificate_key']);
const DIRECTIVAS_DESTINO = new Set([
  'proxy_pass',
  'fastcgi_pass',
  'uwsgi_pass',
  'scgi_pass',
  'grpc_pass',
  'memcached_pass',
]);
const OPCIONES_LISTEN = new Set(['ssl', 'http2']);
/**
 * Parámetros de FastCGI que dicen qué archivo ejecuta PHP: solo la raíz del sitio más el script
 * de la petición (que Nginx ya normalizó); nada de `..` ni otras variables detrás.
 */
const PARAMS_RUTA: Record<string, RegExp> = {
  SCRIPT_FILENAME: /^\$(document_root|realpath_root)\$fastcgi_script_name(\$fastcgi_path_info)?$/,
  PATH_TRANSLATED: /^\$(document_root|realpath_root)\$fastcgi_path_info$/,
  DOCUMENT_ROOT: /^\$(document_root|realpath_root)$/,
};

const mismaRuta = (a: string, b: string): boolean =>
  rutaComparable(path.resolve(a)) === rutaComparable(path.resolve(b));

const prohibida = (d: Directiva, detalle = d.nombre): ErrorWolf =>
  new ErrorWolf(
    'nginx.directiva_prohibida',
    `Línea ${d.linea}: "${detalle}" no se permite en el vhost de un sitio.`,
    { directiva: detalle.slice(0, 80), linea: d.linea },
  );

const rutaFuera = (d: Directiva): ErrorWolf =>
  new ErrorWolf(
    'nginx.ruta_fuera',
    `Línea ${d.linea}: "${d.nombre}" apunta fuera de lo que le corresponde al sitio.`,
    { directiva: d.nombre, linea: d.linea },
  );

/** Host y puerto de un destino (`http://h:p/x`, `h:p`, `[::1]:p`); puerto null si no lo lleva. */
function partesDestino(destino: string): { host: string; puerto: string | null } {
  const sinEsquema = destino.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  // `$request_uri` y `$uri` empiezan por "/": pertenecen a la ruta, no al host ni al puerto.
  const autoridad = sinEsquema
    .split(/\/|\$(?:request_uri|uri)(?![A-Za-z0-9_])/)[0]!
    .replace(/^[^@]*@/, '');
  if (autoridad.startsWith('[')) {
    const fin = autoridad.indexOf(']');
    const resto = autoridad.slice(fin + 1);
    return {
      host: autoridad.slice(0, fin + 1).toLowerCase(),
      puerto: resto.startsWith(':') ? resto.slice(1) : null,
    };
  }
  const [host, puerto] = autoridad.split(':');
  return { host: (host ?? '').toLowerCase(), puerto: puerto ?? null };
}

/** Direcciones de este equipo (y las literales que no son un nombre de dominio). */
const esEsteEquipo = (host: string): boolean =>
  host === 'localhost' ||
  host === '[::1]' ||
  host === '[::]' ||
  host === '0.0.0.0' ||
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

/**
 * Variables que pueden ir en la ruta de un URI interno: las que salen de la URI ya normalizada
 * por Nginx (o del host validado). Las de la petición en crudo (`$arg_*`, `$args`, `$http_*`,
 * `$request_uri`, `$cookie_*`…) pueden traer `..`: con ellas `$uri` sale de la raíz.
 */
const VARIABLES_RUTA = new Set([
  'uri',
  'document_uri',
  'fastcgi_script_name',
  'fastcgi_path_info',
  'host',
  'server_name',
]);

/** Parte de ruta de un URI interno (hasta `?` o `$is_args`, donde empieza la consulta). */
const rutaDeUri = (u: string): string => u.split(/\?|\$is_args(?![A-Za-z0-9_])|\$\{is_args\}/)[0]!;

/** ¿El URI interno puede salir de la raíz? (`..` o variables de la petición en la ruta). */
function uriInternaInsegura(u: string): boolean {
  if (u.includes('..')) return true;
  for (const m of rutaDeUri(u).matchAll(/\$\{?([A-Za-z_][A-Za-z0-9_]*|\d)\}?/g)) {
    const nombre = m[1]!;
    if (!/^\d$/.test(nombre) && !VARIABLES_RUTA.has(nombre)) return true;
  }
  return false;
}

/** Redirección al navegador (no es un URI interno): `http(s)://…` o `$scheme://…`. */
const esRedireccion = (u: string): boolean =>
  /^(https?:\/\/|\$scheme:\/\/|\$\{scheme\}:\/\/)/i.test(u);

/**
 * `rewrite`, `try_files`, `error_page`, `index`, `return`, `auth_request` y `mirror` llevan URIs
 * internos: comprobado con Nginx 1.30 en Windows, `try_files /../x` sirve un archivo fuera de la
 * raíz y tras `rewrite ^ /../x.php` (o `/$arg_f`) `$uri` queda con `..` (llegaría así a
 * `$fastcgi_script_name`). Se rechaza `..` en todos y, en los internos, variables de la petición.
 */
function revisarUris(d: Directiva, n: string): void {
  let internas: string[] = [];
  let todas: string[] = [];
  if (n === 'rewrite') {
    const destino = d.args[1] ?? '';
    const flag = d.args[2] ?? '';
    todas = [destino];
    if (!esRedireccion(destino) && flag !== 'redirect' && flag !== 'permanent')
      internas = [destino];
  } else if (n === 'try_files') {
    todas = internas = d.args.filter((a) => !a.startsWith('@') && !/^=\d+$/.test(a));
  } else if (n === 'error_page') {
    const destino = d.args.at(-1) ?? '';
    todas = [destino];
    if (!destino.startsWith('@') && !esRedireccion(destino)) internas = [destino];
  } else if (n === 'index' || n === 'auth_request' || n === 'mirror') {
    todas = internas = d.args.filter((a) => a !== 'off');
  } else if (n === 'return') {
    todas = d.args.slice(1);
  }
  if (todas.some((u) => u.includes('..')) || internas.some(uriInternaInsegura)) {
    throw rutaFuera(d);
  }
}

const DIRECTIVAS_URI = new Set([
  'rewrite',
  'try_files',
  'error_page',
  'index',
  'return',
  'auth_request',
  'mirror',
]);

/** Nombres de upstream que declara nginx.conf (ramas de PHP, pools de sitio y Adminer). */
const UPSTREAM_PROPIO = /^(php\d+|phpsitio_[a-z0-9._-]+|adminer_php)$/i;

const destinoInterno = (d: Directiva): ErrorWolf =>
  new ErrorWolf(
    'nginx.destino_interno',
    `Línea ${d.linea}: "${d.nombre}" apunta a un servicio interno de WolfCore Dev; lo expondría en la red.`,
    { directiva: d.nombre, linea: d.linea },
  );

function revisarDestino(d: Directiva, ctx: ContextoVhost, avisos: AvisoVhost[]): void {
  const destino = d.args[0] ?? '';
  if (/^([a-z][a-z0-9+.-]*:\/\/)?unix:/i.test(destino)) throw rutaFuera(d);
  const { host, puerto } = partesDestino(destino);
  // Host o puerto con variables: podrían llevar a cualquier servicio interno.
  if (host.includes('$') || (puerto !== null && puerto.includes('$'))) throw destinoInterno(d);
  if (UPSTREAM_PROPIO.test(host)) {
    if (!ctx.upstreamsPropios.map((u) => u.toLowerCase()).includes(host)) throw destinoInterno(d);
    return;
  }
  const numero = puerto !== null && /^\d{1,5}$/.test(puerto) ? Number(puerto) : null;
  // Sea cual sea el host: muchos nombres resuelven a este equipo (los .test de la app, lvh.me,
  // 127.1, 2130706433, 0x7f000001…) y no se pueden enumerar.
  if (numero !== null && ctx.puertosInternos.includes(numero)) throw destinoInterno(d);
  if (!esEsteEquipo(host)) {
    avisos.push({
      codigo: 'nginx.aviso_destino_externo',
      directiva: d.nombre,
      destino: destino.slice(0, 120),
      linea: d.linea,
    });
  }
}

/**
 * Modo avanzado: `listen <puerto>` o `*:<puerto>` y nada más. Una dirección concreta
 * (`127.0.0.1:80`, `[::]:80`) haría del sitio el servidor por defecto de esa dirección, y las
 * opciones son del socket (las de un sitio cambiarían a todos): `ssl` es obligatoria en el
 * puerto HTTPS y `http2` solo va ahí; en el HTTP, ninguna.
 */
function revisarListen(d: Directiva, ctx: ContextoVhost): void {
  const m = /^(?:\*:)?(\d{1,5})$/.exec(d.args[0] ?? '');
  const puerto = m ? Number(m[1]) : NaN;
  if (puerto !== ctx.puertoHttp && puerto !== ctx.puertoHttps) {
    throw new ErrorWolf(
      'nginx.puerto_ajeno',
      `Línea ${d.linea}: el sitio solo puede escuchar en los puertos de Nginx (${ctx.puertoHttp} y ${ctx.puertoHttps}), sin dirección.`,
      { linea: d.linea },
    );
  }
  const opciones = d.args.slice(1);
  if (puerto === ctx.puertoHttps) {
    for (const op of opciones) {
      if (!OPCIONES_LISTEN.has(op)) throw prohibida(d, `listen ${op}`);
    }
    if (!opciones.includes('ssl')) throw prohibida(d, `listen ${puerto} sin ssl`);
  } else if (opciones.length > 0) {
    throw prohibida(d, `listen ${puerto} ${opciones.join(' ')}`);
  }
}

function revisarServerName(d: Directiva, ctx: ContextoVhost): void {
  const propios = ctx.dominios.map((x) => x.toLowerCase());
  for (const nombre of d.args) {
    if (!propios.includes(nombre.toLowerCase())) {
      throw new ErrorWolf(
        'nginx.dominio_ajeno',
        `Línea ${d.linea}: "${nombre}" no es un dominio de este sitio.`,
        { nombre: nombre.slice(0, 120), linea: d.linea },
      );
    }
  }
}

function revisarDirectiva(
  d: Directiva,
  modo: ModoVhost,
  ctx: ContextoVhost,
  nivel: number,
  avisos: AvisoVhost[],
): void {
  const n = d.nombre.toLowerCase();
  if (n === 'server') {
    // Reglas: viven dentro del server del sitio. Avanzado: solo bloques server de primer nivel.
    if (modo === 'reglas' || nivel > 0 || d.hijos === null) throw prohibida(d);
  } else if (modo === 'manual' && nivel === 0) {
    throw new ErrorWolf(
      'nginx.fuera_de_server',
      `Línea ${d.linea}: el vhost solo puede tener bloques "server"; "${d.nombre}" queda fuera.`,
      { directiva: d.nombre.slice(0, 80), linea: d.linea },
    );
  }
  if (prohibidaPorNombre(n)) throw prohibida(d);
  if (n === 'include') {
    if (d.args.length !== 1 || !INCLUDES_PERMITIDOS.includes(d.args[0]!)) {
      throw prohibida(d, `include ${d.args.join(' ')}`);
    }
  } else if (n === 'listen') {
    if (modo === 'reglas') throw prohibida(d);
    revisarListen(d, ctx);
  } else if (n === 'server_name') {
    if (modo === 'reglas') throw prohibida(d);
    revisarServerName(d, ctx);
  } else if (DIRECTIVAS_RUTA.has(n)) {
    const r = d.args[0] ?? '';
    if (d.args.length !== 1 || r.includes('$') || !esAbsoluta(r) || !rutaDentroDe(ctx.carpeta, r)) {
      throw rutaFuera(d);
    }
  } else if (DIRECTIVAS_LOG.has(n)) {
    const r = d.args[0] ?? '';
    if (r !== 'off' && !ctx.logs.some((l) => esAbsoluta(r) && mismaRuta(l, r))) throw rutaFuera(d);
  } else if (DIRECTIVAS_CERT.has(n)) {
    const r = d.args[0] ?? '';
    if (d.args.length !== 1 || !esAbsoluta(r) || !ctx.certificados.some((c) => mismaRuta(c, r))) {
      throw rutaFuera(d);
    }
  } else if (n === 'fastcgi_param' || n === 'uwsgi_param' || n === 'scgi_param') {
    // El script que ejecuta PHP sale de aquí: solo de la raíz del sitio (o de su carpeta).
    const nombre = (d.args[0] ?? '').toUpperCase();
    const valor = d.args[1] ?? '';
    if (nombre === 'PHP_VALUE' || nombre === 'PHP_ADMIN_VALUE')
      throw prohibida(d, `${n} ${nombre}`);
    const patron = PARAMS_RUTA[nombre];
    if (patron && !patron.test(valor)) {
      // DOCUMENT_ROOT también puede ser una carpeta fija del proyecto.
      const carpetaFija =
        nombre === 'DOCUMENT_ROOT' &&
        !valor.includes('$') &&
        esAbsoluta(valor) &&
        rutaDentroDe(ctx.carpeta, valor);
      if (!carpetaFija) throw rutaFuera(d);
    }
  } else if (DIRECTIVAS_DESTINO.has(n)) {
    revisarDestino(d, ctx, avisos);
  } else if (DIRECTIVAS_URI.has(n)) {
    revisarUris(d, n);
  }
  for (const h of d.hijos ?? []) revisarDirectiva(h, modo, ctx, nivel + 1, avisos);
}

/**
 * Revisa las reglas propias (`reglas`, van dentro del server del sitio) o un vhost completo
 * (`manual`). Lanza `ErrorWolf` con la primera directiva que no se permite; devuelve los avisos.
 */
export function revisarVhost(
  texto: string,
  modo: ModoVhost,
  ctx: ContextoVhost,
): { avisos: AvisoVhost[] } {
  const avisos: AvisoVhost[] = [];
  const arbol = analizarNginx(texto);
  if (modo === 'manual' && !arbol.some((d) => d.nombre === 'server')) {
    throw new ErrorWolf('nginx.fuera_de_server', 'El vhost necesita al menos un bloque "server".', {
      directiva: 'server',
      linea: 1,
    });
  }
  for (const d of arbol) revisarDirectiva(d, modo, ctx, 0, avisos);
  return { avisos };
}

/** Texto aceptable: acotado y sin NUL ni caracteres de control (salvo tab y saltos de línea). */
export function textoVhostValido(texto: unknown, limite: number): texto is string {
  return (
    typeof texto === 'string' &&
    texto.length <= limite &&
    // eslint-disable-next-line no-control-regex
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(texto)
  );
}

// ---------------------------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------------------------

export interface VistaVhost {
  /** Vhost que genera WolfCore Dev (con las reglas propias actuales). */
  generado: string;
  reglas: string;
  /** Vhost completo del modo avanzado; null si se usa el generado. */
  manual: string | null;
  /** Lo que Nginx rechazó al aplicar los sitios y quedó fuera hasta aplicarlo otra vez. */
  desactivado: ModoVhost | null;
}

export interface VersionVhost {
  /** Nombre de la copia (es lo que se pasa a `restaurar`). */
  version: string;
  fecha: string;
  modo: ModoVhost;
}

export type ResultadoEditorVhost =
  { ok: true; avisos: AvisoVhost[]; respaldo: string | null } | { ok: false; salida: string };

export interface CambioVhost {
  reglas?: string;
  manual?: string | null;
}

export interface DepsEditorVhost {
  rutas: Rutas;
  almacen: Pick<Almacen, 'leer' | 'guardar'>;
  /** Cola de configuración de los sitios (la misma que guardar y aplicar). */
  enCola<T>(fn: () => Promise<T>): Promise<T>;
  /** Vhost generado (sin el manual) y lo que el sitio puede tocar. */
  vhostDe(s: Sitio, cfg: Config): Promise<{ generado: string; contexto: ContextoVhost }>;
  /** `nginx -t` sobre una copia temporal de toda la configuración con este vhost. */
  probar(id: string, contenido: string): Promise<{ ok: boolean; salida: string }>;
  estadoNginx(): 'apagado' | 'iniciando' | 'encendido' | 'error';
  recargar(): Promise<void>;
  /** ¿Nginx sigue respondiendo tras recargar? */
  sano(): Promise<boolean>;
  emitir?(sitios: Sitio[]): void;
  ahora?(): Date;
}

const VERSION_VALIDA = /^vhost-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(-\d{1,3})?\.txt$/;

interface CopiaVhost {
  modo: ModoVhost;
  reglas: string;
  manual: string | null;
  /** El archivo .conf tal como estaba (null si no existía). */
  contenido: string | null;
}

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const conSalto = (t: string): string => (t.endsWith('\n') ? t : `${t}\n`);

async function escribirAtomico(ruta: string, contenido: string): Promise<void> {
  const tmp = `${ruta}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, contenido, 'utf8');
  try {
    await rename(tmp, ruta);
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  }
}

export class EditorVhost {
  constructor(private readonly d: DepsEditorVhost) {}

  private carpetaVersiones(id: string): string {
    return path.join(this.d.rutas.base, 'etc', 'respaldos', 'vhost', id);
  }

  private async sitio(cfg: Config, id: string): Promise<{ s: Sitio; i: number }> {
    const i = cfg.sitios.findIndex((x) => x.id === id);
    if (i < 0) throw new ErrorWolf('nginx.sitio_no_existe', `No existe el sitio ${id}`);
    return { s: cfg.sitios[i]!, i };
  }

  async vista(sitioId: string): Promise<VistaVhost> {
    const cfg = await this.d.almacen.leer();
    const { s } = await this.sitio(cfg, sitioId);
    const { generado } = await this.d.vhostDe(s, cfg);
    return {
      generado,
      reglas: s.reglasExtra,
      manual: s.vhostManual ?? null,
      desactivado: s.vhostDesactivado ?? null,
    };
  }

  /**
   * Aplica reglas propias y/o el vhost manual (null = volver al generado): revisa, prueba con
   * `nginx -t` sobre una copia temporal, guarda copia con fecha, escribe y recarga. Si Nginx no
   * acepta la recarga o deja de responder, todo vuelve a lo anterior.
   */
  async aplicar(sitioId: string, cambio: CambioVhost): Promise<ResultadoEditorVhost> {
    if (cambio.reglas !== undefined && !textoVhostValido(cambio.reglas, LIMITE_REGLAS)) {
      throw new ErrorWolf('nginx.texto_invalido', 'Las reglas no son un texto válido.');
    }
    if (
      cambio.manual !== undefined &&
      cambio.manual !== null &&
      (!textoVhostValido(cambio.manual, LIMITE_MANUAL) || cambio.manual.trim() === '')
    ) {
      throw new ErrorWolf('nginx.texto_invalido', 'El vhost no es un texto válido.');
    }
    return this.d.enCola(() => this.aplicarEnCola(sitioId, cambio));
  }

  private async aplicarEnCola(sitioId: string, cambio: CambioVhost): Promise<ResultadoEditorVhost> {
    const cfg = await this.d.almacen.leer();
    const { s: previo, i } = await this.sitio(cfg, sitioId);
    const reglas = (cambio.reglas ?? previo.reglasExtra).replace(/\r\n/g, '\n');
    const manualPedido = cambio.manual === undefined ? (previo.vhostManual ?? null) : cambio.manual;
    const manual = manualPedido === null ? null : conSalto(manualPedido.replace(/\r\n/g, '\n'));
    // Aplicarlo desde el editor lo reactiva si nginx -t lo había desactivado.
    const nuevo: Sitio = {
      ...previo,
      reglasExtra: reglas,
      vhostManual: manual,
      vhostDesactivado: null,
    };
    const { generado, contexto } = await this.d.vhostDe(nuevo, cfg);
    const avisos = [...revisarVhost(reglas, 'reglas', contexto).avisos];
    if (manual !== null) avisos.push(...revisarVhost(manual, 'manual', contexto).avisos);
    const contenido = manual ?? generado;

    const ruta = this.d.rutas.vhost(previo.id);
    const anterior = await readFile(ruta, 'utf8').catch(() => null);
    const sinCambios =
      !previo.vhostDesactivado &&
      reglas === previo.reglasExtra &&
      manual === (previo.vhostManual ?? null) &&
      anterior === contenido;
    if (sinCambios) return { ok: true, avisos, respaldo: null };

    const prueba = await this.d.probar(previo.id, contenido);
    if (!prueba.ok) return { ok: false, salida: prueba.salida };

    const respaldo = await this.guardarVersion(previo, anterior);
    cfg.sitios[i] = nuevo;
    await this.d.almacen.guardar(cfg);
    await escribirAtomico(ruta, contenido);

    if (this.d.estadoNginx() === 'encendido') {
      let fallo: string | null = null;
      try {
        await this.d.recargar();
        if (!(await this.d.sano())) fallo = 'Nginx dejó de responder después de recargar.';
      } catch (e) {
        fallo = mensajeDe(e);
      }
      if (fallo !== null) {
        return { ok: false, salida: await this.volverAtras(previo, ruta, anterior, fallo) };
      }
    }
    this.d.emitir?.(cfg.sitios);
    return { ok: true, avisos, respaldo: path.basename(respaldo) };
  }

  /** Devuelve la configuración y el archivo anteriores y recarga; da el mensaje para la interfaz. */
  private async volverAtras(
    previo: Sitio,
    ruta: string,
    anterior: string | null,
    fallo: string,
  ): Promise<string> {
    let salida = `${fallo}\nSe volvió a la versión anterior del vhost.`;
    try {
      const cfg = await this.d.almacen.leer();
      const j = cfg.sitios.findIndex((x) => x.id === previo.id);
      if (j >= 0) {
        cfg.sitios[j] = previo;
        await this.d.almacen.guardar(cfg);
      }
      if (anterior === null) await rm(ruta, { force: true });
      else await escribirAtomico(ruta, anterior);
      // Nginx estaba encendido: se recarga con lo anterior (no hace nada si quedó apagado).
      await this.d.recargar();
    } catch (e) {
      salida += `\nNo se pudo dejar todo como estaba: ${mensajeDe(e)}`;
    }
    // Lo anterior tiene que volver a responder; si no, no es un fallo más del cambio.
    if (!(await this.d.sano().catch(() => false))) {
      throw new ErrorWolf(
        'nginx.caido_tras_restaurar',
        `Nginx no volvió a responder; se restauró el vhost anterior, pero sigue sin responder. Revise Servicios y el registro de Nginx.\n${salida}`,
        { salida: salida.slice(0, 200) },
      );
    }
    return salida;
  }

  /** Copia con fecha del estado anterior (reglas, manual y el .conf) y rotación a 10. */
  private async guardarVersion(previo: Sitio, contenido: string | null): Promise<string> {
    const carpeta = this.carpetaVersiones(previo.id);
    const copia: CopiaVhost = {
      modo: previo.vhostManual ? 'manual' : 'reglas',
      reglas: previo.reglasExtra,
      manual: previo.vhostManual ?? null,
      contenido,
    };
    const ruta = await copiaConFecha(
      carpeta,
      'vhost',
      JSON.stringify(copia, null, 2),
      this.d.ahora?.() ?? new Date(),
    );
    const copias = (await readdir(carpeta).catch(() => [] as string[]))
      .filter((n) => VERSION_VALIDA.test(n))
      .sort((a, b) => b.localeCompare(a));
    for (const vieja of copias.slice(MAX_VERSIONES_VHOST)) {
      if (path.join(carpeta, vieja) === ruta) continue;
      await rm(path.join(carpeta, vieja), { force: true }).catch(() => undefined);
    }
    return ruta;
  }

  private async leerCopia(id: string, version: string): Promise<CopiaVhost | null> {
    try {
      const datos: unknown = JSON.parse(
        await readFile(path.join(this.carpetaVersiones(id), version), 'utf8'),
      );
      const o = datos as Partial<CopiaVhost>;
      if (
        typeof o !== 'object' ||
        o === null ||
        typeof o.reglas !== 'string' ||
        (o.manual !== null && typeof o.manual !== 'string')
      ) {
        return null;
      }
      return {
        modo: o.manual ? 'manual' : 'reglas',
        reglas: o.reglas,
        manual: o.manual ?? null,
        contenido: typeof o.contenido === 'string' ? o.contenido : null,
      };
    } catch {
      return null;
    }
  }

  /** Versiones anteriores del vhost del sitio, la más nueva primero (hasta 10). */
  async historial(sitioId: string): Promise<VersionVhost[]> {
    const cfg = await this.d.almacen.leer();
    const { s } = await this.sitio(cfg, sitioId);
    const carpeta = this.carpetaVersiones(s.id);
    const nombres = (await readdir(carpeta).catch(() => [] as string[]))
      .filter((n) => VERSION_VALIDA.test(n))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, MAX_VERSIONES_VHOST);
    const res: VersionVhost[] = [];
    for (const version of nombres) {
      const copia = await this.leerCopia(s.id, version);
      if (!copia) continue;
      const fecha = await stat(path.join(carpeta, version))
        .then((x) => x.mtime.toISOString())
        .catch(() => '');
      res.push({ version, fecha, modo: copia.modo });
    }
    return res;
  }

  /** Vuelve a una versión del historial (con la misma prueba y vuelta atrás que aplicar). */
  async restaurar(sitioId: string, version: string): Promise<ResultadoEditorVhost> {
    const lista = await this.historial(sitioId);
    if (typeof version !== 'string' || !lista.some((v) => v.version === version)) {
      throw new ErrorWolf('nginx.version_no_existe', 'Esa versión del vhost no existe.');
    }
    const copia = await this.leerCopia(sitioId, version);
    if (!copia) throw new ErrorWolf('nginx.version_no_existe', 'Esa versión del vhost no existe.');
    return this.aplicar(sitioId, { reglas: copia.reglas, manual: copia.manual });
  }
}
