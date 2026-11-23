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
 *    otro). Un `proxy_pass` (o `fastcgi_pass`…) a un equipo que no es este solo se avisa: es un uso
 *    legítimo y no expone archivos del equipo;
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
import { esRutaAbsoluta as esAbsoluta, rutaComparable, rutaDentroDe } from '../plataforma/sistema';
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

const errorSintaxis = (linea: number, detalle: string): ErrorWolf =>
  new ErrorWolf('nginx.sintaxis', `Línea ${linea}: ${detalle}`, { linea, detalle });

const esEspacio = (c: string): boolean => c === ' ' || c === '\t' || c === '\r' || c === '\n';

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
        if (i >= n) throw errorSintaxis(inicio, 'comillas sin cerrar');
        const d = texto[i]!;
        if (d === '\\' && i + 1 < n) {
          const sig = texto[i + 1]!;
          if (sig === '\n') linea++;
          valor +=
            sig === '"' || sig === "'" || sig === '\\'
              ? sig
              : sig === 't'
                ? '\t'
                : sig === 'n'
                  ? '\n'
                  : sig === 'r'
                    ? '\r'
                    : `\\${sig}`;
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
        throw errorSintaxis(linea, `carácter inesperado tras las comillas: ${sig}`);
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
          valor += sig === '"' || sig === "'" || sig === '\\' ? sig : `\\${sig}`;
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
      if (!actual) throw errorSintaxis(t.linea, '";" inesperado');
      lista.push(actual);
      actual = null;
      continue;
    }
    if (t.tipo === '{') {
      if (!actual) throw errorSintaxis(t.linea, '"{" inesperado');
      actual.hijos = [];
      lista.push(actual);
      pila.push(actual.hijos);
      actual = null;
      continue;
    }
    if (actual) throw errorSintaxis(actual.linea, `falta ";" después de ${actual.nombre}`);
    if (pila.length === 1) throw errorSintaxis(t.linea, 'sobra una "}"');
    pila.pop();
  }
  if (actual) throw errorSintaxis(actual.linea, `falta ";" después de ${actual.nombre}`);
  if (pila.length > 1) throw errorSintaxis(ultimaLinea, 'falta una "}"');
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
  /** Puertos de Nginx (HTTP y HTTPS): únicos `listen` del modo avanzado. */
  puertos: number[];
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

const prohibidaPorNombre = (n: string): boolean =>
  PROHIBIDAS.has(n) || n.startsWith('js_') || n.startsWith('perl_') || n.includes('lua');

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
/** Parámetros de FastCGI que dicen qué archivo ejecuta PHP. */
const PARAMS_RUTA = new Set(['SCRIPT_FILENAME', 'DOCUMENT_ROOT', 'PATH_TRANSLATED']);

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

/** Host de un destino (`http://h:p/x`, `h:p`, `[::1]:p`); null si es dinámico o un socket. */
function hostDestino(destino: string): string | null {
  if (destino.includes('$')) return null;
  const sinEsquema = destino.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const autoridad = sinEsquema.split('/')[0]!.replace(/^[^@]*@/, '');
  if (autoridad.startsWith('[')) return autoridad.slice(0, autoridad.indexOf(']') + 1);
  return autoridad.split(':')[0]!.toLowerCase();
}

const esLocal = (host: string): boolean =>
  host === 'localhost' ||
  host === '[::1]' ||
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
  // Upstreams que declara nginx.conf (php84, phpsitio_<id>, adminer_php).
  /^(php\d+|phpsitio_[a-z0-9._-]+|adminer_php)$/i.test(host);

function revisarListen(d: Directiva, ctx: ContextoVhost): void {
  const direccion = d.args[0] ?? '';
  if (direccion.startsWith('unix:')) throw prohibida(d, 'listen unix:');
  const m = /(?:^|:)(\d{1,5})$/.exec(direccion);
  const puerto = m ? Number(m[1]) : NaN;
  if (!ctx.puertos.includes(puerto)) {
    throw new ErrorWolf(
      'nginx.puerto_ajeno',
      `Línea ${d.linea}: el sitio solo puede escuchar en los puertos de Nginx (${ctx.puertos.join(', ')}).`,
      { linea: d.linea },
    );
  }
  for (const op of d.args.slice(1)) {
    if (!OPCIONES_LISTEN.has(op)) throw prohibida(d, `listen ${op}`);
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
    if (PARAMS_RUTA.has(nombre)) {
      const desdeRaiz = /^\$(document_root|realpath_root)(?![A-Za-z0-9_])/.test(valor);
      const dentro = !valor.includes('$') && esAbsoluta(valor) && rutaDentroDe(ctx.carpeta, valor);
      if (!desdeRaiz && !dentro) throw rutaFuera(d);
    }
  } else if (DIRECTIVAS_DESTINO.has(n)) {
    const destino = d.args[0] ?? '';
    if (/^([a-z][a-z0-9+.-]*:\/\/)?unix:/i.test(destino)) throw rutaFuera(d);
    const host = hostDestino(destino);
    if (host === null || !esLocal(host)) {
      avisos.push({
        codigo: 'nginx.aviso_destino_externo',
        directiva: d.nombre,
        destino: destino.slice(0, 120),
        linea: d.linea,
      });
    }
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
    return { generado, reglas: s.reglasExtra, manual: s.vhostManual ?? null };
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
    const nuevo: Sitio = { ...previo, reglasExtra: reglas, vhostManual: manual };
    const { generado, contexto } = await this.d.vhostDe(nuevo, cfg);
    const avisos = [...revisarVhost(reglas, 'reglas', contexto).avisos];
    if (manual !== null) avisos.push(...revisarVhost(manual, 'manual', contexto).avisos);
    const contenido = manual ?? generado;

    const ruta = this.d.rutas.vhost(previo.id);
    const anterior = await readFile(ruta, 'utf8').catch(() => null);
    const sinCambios =
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
      if (this.d.estadoNginx() === 'encendido') await this.d.recargar();
    } catch (e) {
      salida += `\nNo se pudo dejar todo como estaba: ${mensajeDe(e)}`;
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
