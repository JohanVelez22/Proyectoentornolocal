import { ErrorWolf } from '../errores';
import { construirCuerpo, type PeticionResuelta } from './componer';
import {
  MAX_CURL,
  METODOS_HTTP,
  PLAZO_HTTP_DEFECTO_SEG,
  PLAZO_HTTP_MAX_SEG,
  type AvisoCurl,
  type MetodoHttp,
  type ParHttp,
  type PeticionHttp,
} from './tipos';
import { NOMBRE_CABECERA } from './validar';

const MAX_TOKENS = 2000;
/** Avisos que llegan a la interfaz (sin repetidos). */
export const MAX_AVISOS_CURL = 50;

export interface Tokens {
  tokens: string[];
  /** Había algo detrás de `|`, `;`, `&&`, `>`… que se descartó. */
  cortado: boolean;
  /** Algún token lleva `$(…)`, `` `…` `` o `$VAR` que NO se evalúa. */
  sinEvaluar: boolean;
}

const ESCAPES_ANSI: Record<string, string> = {
  n: '\n',
  r: '\r',
  t: '\t',
  '\\': '\\',
  "'": "'",
  '"': '"',
};

/**
 * Tokenizador propio de una línea de `curl` al estilo de un shell POSIX: comillas simples y
 * dobles, `$'…'`, `\` y continuaciones de línea. No ejecuta ni expande nada: `$(…)`, las comillas
 * invertidas y `$VAR` quedan como texto. Un operador sin comillas (`|`, `;`, `&`, `>`, `<`) termina
 * el comando.
 */
export function tokenizar(entrada: string): Tokens {
  if (entrada.length > MAX_CURL) {
    throw new ErrorWolf('clientehttp.curl_grande', 'El texto de curl es demasiado grande.');
  }
  const t = entrada.replace(/\r\n?/g, '\n');
  const tokens: string[] = [];
  let actual = '';
  let hay = false;
  let cortado = false;
  let sinEvaluar = false;
  let i = 0;
  const cerrar = (): void => {
    if (hay) tokens.push(actual);
    actual = '';
    hay = false;
    if (tokens.length > MAX_TOKENS) {
      throw new ErrorWolf('clientehttp.curl_grande', 'El texto de curl es demasiado grande.');
    }
  };
  const marcar = (resto: string): void => {
    if (/^\$[({A-Za-z_]|^`/.test(resto)) sinEvaluar = true;
  };
  while (i < t.length) {
    const c = t[i]!;
    if (c === '\\' && t[i + 1] === '\n') {
      i += 2;
      continue;
    }
    if (c === '\\') {
      actual += t[i + 1] ?? '';
      hay = true;
      i += 2;
      continue;
    }
    if (c === "'") {
      const fin = t.indexOf("'", i + 1);
      if (fin < 0) throw new ErrorWolf('clientehttp.curl_invalido', 'Comillas sin cerrar.');
      actual += t.slice(i + 1, fin);
      hay = true;
      i = fin + 1;
      continue;
    }
    if (c === '$' && t[i + 1] === "'") {
      i += 2;
      hay = true;
      for (;;) {
        if (i >= t.length) throw new ErrorWolf('clientehttp.curl_invalido', 'Comillas sin cerrar.');
        const d = t[i]!;
        if (d === "'") {
          i++;
          break;
        }
        if (d === '\\') {
          const e = t[i + 1] ?? '';
          const hex = /^x([0-9a-fA-F]{2})/.exec(t.slice(i + 1, i + 4));
          if (hex) {
            actual += String.fromCharCode(parseInt(hex[1]!, 16));
            i += 4;
          } else {
            actual += ESCAPES_ANSI[e] ?? `\\${e}`;
            i += 2;
          }
          continue;
        }
        actual += d;
        i++;
      }
      continue;
    }
    if (c === '"') {
      i++;
      hay = true;
      for (;;) {
        if (i >= t.length) throw new ErrorWolf('clientehttp.curl_invalido', 'Comillas sin cerrar.');
        const d = t[i]!;
        if (d === '"') {
          i++;
          break;
        }
        if (d === '\\' && /["\\$`\n]/.test(t[i + 1] ?? '')) {
          if (t[i + 1] !== '\n') actual += t[i + 1];
          i += 2;
          continue;
        }
        if (d === '$' || d === '`') marcar(t.slice(i));
        actual += d;
        i++;
      }
      continue;
    }
    if (c === ' ' || c === '\t') {
      cerrar();
      i++;
      continue;
    }
    if (c === '\n' || c === ';' || c === '|' || c === '&' || c === '>' || c === '<') {
      cerrar();
      if (t.slice(i).replace(/[\s;|&<>]/g, '').length > 0) cortado = true;
      break;
    }
    if (c === '$' || c === '`') marcar(t.slice(i));
    actual += c;
    hay = true;
    i++;
  }
  cerrar();
  return { tokens, cortado, sinEvaluar };
}

/** Opciones de curl que llevan un valor aparte y que no se usan (se salta su valor). */
const CON_VALOR_IGNORADAS = new Set([
  '-o',
  '--output',
  '-x',
  '--proxy',
  '-E',
  '--cert',
  '--key',
  '--cacert',
  '--capath',
  '--connect-timeout',
  '--retry',
  '--retry-delay',
  '--resolve',
  '-w',
  '--write-out',
  '-T',
  '--upload-file',
  '--max-redirs',
  '--limit-rate',
  '-c',
  '--cookie-jar',
  '-K',
  '--config',
  '--interface',
  '--dns-servers',
  '--proto',
  '--tlsv1.3',
  '--cert-type',
  '--pass',
  '--oauth2-bearer',
  '-y',
  '--speed-time',
  '-Y',
  '--speed-limit',
  '--noproxy',
  '--proxy-user',
  '-U',
  '-z',
  '--time-cond',
  '--unix-socket',
  '-r',
  '--range',
  '-C',
  '--continue-at',
  '--url-query',
  '--data-urlencode-file',
  '-D',
  '--dump-header',
  '-P',
  '--ftp-port',
  '--keepalive-time',
  '--local-port',
  '--happy-eyeballs-timeout-ms',
]);
const SIN_VALOR_SILENCIADAS = new Set([
  '-L',
  '--location',
  '-s',
  '--silent',
  '-S',
  '--show-error',
  '-v',
  '--verbose',
  '-i',
  '--include',
  '--compressed',
  '-f',
  '--fail',
  '-#',
  '--progress-bar',
  '-N',
  '--no-buffer',
  '--http1.1',
  '--http2',
  '-g',
  '--globoff',
  '-O',
  '--remote-name',
  '-j',
  '--junk-session-cookies',
  '--no-keepalive',
]);

const corto = (s: string): string => s.slice(0, 40);

/**
 * Un dato de `-G` para la consulta: se codifica lo que se perdería o rompería la URL (`#`, espacios,
 * comillas, no ASCII) y se respeta lo que ya viene codificado (`%20`).
 */
function codificarDato(dato: string): string {
  return dato
    .replace(/%(?![0-9a-fA-F]{2})/g, '%25')
    .replace(/[^\x21-\x7e]+|[#"<>\\^`{|}]/g, (m) => {
      try {
        return encodeURIComponent(m);
      } catch {
        return '';
      }
    });
}

/** Opciones cortas que llevan valor: en un grupo (`-sX POST`), lo que sigue es su valor. */
const CORTAS_CON_VALOR = 'XHduFbAemTExoKcDPwrCyYzU';

/** `-sSL` → `-s -S -L`; `-sXPOST` → `-s -XPOST`; `-XPOST` y `-H'A: b'` se dejan como están. */
function expandirCorta(t: string): string[] {
  if (t.startsWith('--') || t.length <= 2 || !/^-[A-Za-z]/.test(t)) return [t];
  const r: string[] = [];
  for (let k = 1; k < t.length; k++) {
    const c = t[k]!;
    if (CORTAS_CON_VALOR.includes(c)) {
      r.push(`-${c}${t.slice(k + 1)}`);
      break;
    }
    r.push(`-${c}`);
  }
  return r;
}

/** ¿Lo que sigue a una opción desconocida es una opción o una URL (y no su valor)? */
const pareceOpcionOUrl = (v: string): boolean =>
  v.startsWith('-') ||
  /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ||
  /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/\S*)?$/i.test(v);

function decodificarForm(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

export interface ImportacionCurl {
  /** Con los secretos EN LÍNEA (`valor`): quien guarda la petición los pasa a `AlmacenSecretos`. */
  peticion: PeticionHttp;
  avisos: AvisoCurl[];
}

/**
 * Entrada no confiable: se tokeniza y se interpretan unas pocas opciones. Lo desconocido se ignora
 * y se avisa. Nada se ejecuta, no se leen archivos (`-d @archivo`) y `-k` no se aplica.
 */
export function importarCurl(texto: string): ImportacionCurl {
  const { tokens, cortado, sinEvaluar } = tokenizar(texto);
  const avisos: AvisoCurl[] = [];
  if (cortado) avisos.push({ codigo: 'comando_cortado' });
  if (sinEvaluar) avisos.push({ codigo: 'sin_evaluar' });
  if (tokens.length === 0 || !/^curl(\.exe)?$/i.test(tokens[0]!)) {
    throw new ErrorWolf('clientehttp.curl_invalido', 'El texto no empieza por «curl».');
  }
  let metodo: string | null = null;
  let url: string | null = null;
  const cabeceras: ParHttp[] = [];
  const datos: string[] = [];
  const campos: ParHttp[] = [];
  let auth: PeticionHttp['auth'] = { tipo: 'ninguna' };
  let plazoSeg = PLAZO_HTTP_DEFECTO_SEG;
  let cabeza = false;
  let json = false;
  let get = false;

  const aCabecera = (linea: string): void => {
    if (/[\r\n\0]/.test(linea)) {
      avisos.push({ codigo: 'cabecera_invalida', dato: corto(linea.split(/[\r\n\0]/)[0] ?? '') });
      return;
    }
    const i = linea.indexOf(':');
    const nombre = (i < 0 ? linea : linea.slice(0, i)).trim();
    const valor = i < 0 ? '' : linea.slice(i + 1).trim();
    if (i < 0 || !NOMBRE_CABECERA.test(nombre)) {
      avisos.push({ codigo: 'cabecera_invalida', dato: corto(nombre) });
      return;
    }
    if (nombre.toLowerCase() === 'authorization') {
      const m = /^(Bearer|Basic)\s+(\S.*)$/i.exec(valor);
      if (m && m[1]!.toLowerCase() === 'bearer') {
        auth = { tipo: 'bearer', valor: m[2]! };
        return;
      }
      if (m) {
        const dec = Buffer.from(m[2]!, 'base64').toString('utf8');
        const j = dec.indexOf(':');
        if (j > 0 && !dec.includes('�')) {
          auth = { tipo: 'basic', usuario: dec.slice(0, j), valor: dec.slice(j + 1) };
          return;
        }
      }
    }
    cabeceras.push({ clave: nombre, valor, activo: true });
  };

  const valorDe = (i: number): string | null => tokens[i + 1] ?? null;

  for (let i = 1; i < tokens.length; i++) {
    const grupo = expandirCorta(tokens[i]!);
    if (grupo.length !== 1 || grupo[0] !== tokens[i]) tokens.splice(i, 1, ...grupo);
    const t = tokens[i]!;
    let opcion = t;
    let adjunto: string | null = null;
    if (t.startsWith('--')) {
      const e = t.indexOf('=');
      if (e > 0) {
        opcion = t.slice(0, e);
        adjunto = t.slice(e + 1);
      }
    } else if (/^-[A-Za-z]./.test(t) && CORTAS_CON_VALOR.includes(t[1]!)) {
      opcion = t.slice(0, 2);
      adjunto = t.slice(2);
    }
    const tomar = (): string | null => {
      if (adjunto !== null) return adjunto;
      const v = valorDe(i);
      if (v !== null) i++;
      return v;
    };
    switch (opcion) {
      case '-X':
      case '--request':
        metodo = (tomar() ?? '').toUpperCase();
        break;
      case '-H':
      case '--header':
        aCabecera(tomar() ?? '');
        break;
      case '-d':
      case '--data':
      case '--data-raw':
      case '--data-binary':
      case '--data-ascii':
      case '--data-urlencode': {
        const v = tomar() ?? '';
        if (v.startsWith('@') && opcion !== '--data-raw')
          avisos.push({ codigo: 'archivo_ignorado', dato: corto(v) });
        else if (opcion === '--data-urlencode') {
          const e = v.indexOf('=');
          datos.push(
            e < 0
              ? encodeURIComponent(v)
              : `${v.slice(0, e)}=${encodeURIComponent(v.slice(e + 1))}`,
          );
        } else datos.push(v);
        break;
      }
      case '--json': {
        const v = tomar() ?? '';
        if (v.startsWith('@')) avisos.push({ codigo: 'archivo_ignorado', dato: corto(v) });
        else {
          datos.push(v);
          json = true;
        }
        break;
      }
      case '-F':
      case '--form':
      case '--form-string': {
        const v = tomar() ?? '';
        const e = v.indexOf('=');
        if (e < 0) break;
        const valor = v.slice(e + 1);
        if (opcion !== '--form-string' && /^[@<]/.test(valor)) {
          avisos.push({ codigo: 'archivo_ignorado', dato: corto(valor) });
        } else campos.push({ clave: v.slice(0, e), valor, activo: true });
        break;
      }
      case '-u':
      case '--user': {
        const v = tomar() ?? '';
        const e = v.indexOf(':');
        auth =
          e < 0
            ? { tipo: 'basic', usuario: v, valor: '' }
            : { tipo: 'basic', usuario: v.slice(0, e), valor: v.slice(e + 1) };
        if (auth.tipo === 'basic' && auth.valor === '') delete auth.valor;
        break;
      }
      case '-b':
      case '--cookie': {
        const v = tomar() ?? '';
        if (v.includes('=')) cabeceras.push({ clave: 'Cookie', valor: v, activo: true });
        else avisos.push({ codigo: 'archivo_ignorado', dato: corto(v) });
        break;
      }
      case '-A':
      case '--user-agent':
        cabeceras.push({ clave: 'User-Agent', valor: tomar() ?? '', activo: true });
        break;
      case '-e':
      case '--referer':
        cabeceras.push({ clave: 'Referer', valor: tomar() ?? '', activo: true });
        break;
      case '-m':
      case '--max-time': {
        const n = Number(tomar());
        if (Number.isFinite(n) && n > 0) plazoSeg = Math.min(PLAZO_HTTP_MAX_SEG, Math.ceil(n));
        break;
      }
      case '-I':
      case '--head':
        cabeza = true;
        break;
      case '-G':
      case '--get':
        get = true;
        break;
      case '--url': {
        const v = tomar() ?? '';
        if (url === null) url = v;
        else avisos.push({ codigo: 'varias_urls', dato: corto(v) });
        break;
      }
      case '-k':
      case '--insecure':
        avisos.push({ codigo: 'inseguro_ignorado' });
        break;
      default:
        if (SIN_VALOR_SILENCIADAS.has(opcion)) break;
        if (opcion.startsWith('-') && opcion.length > 1) {
          avisos.push({ codigo: 'opcion_ignorada', dato: corto(opcion) });
          if (CON_VALOR_IGNORADAS.has(opcion)) tomar();
          else if (opcion.startsWith('--') && adjunto === null) {
            // Una opción larga desconocida se come su valor si no parece otra opción ni una URL.
            const v = valorDe(i);
            if (v !== null && !pareceOpcionOUrl(v)) i++;
          }
        } else if (url === null && /^[^\s]+$/.test(opcion)) {
          url = opcion;
        } else {
          avisos.push({ codigo: 'varias_urls', dato: corto(opcion) });
        }
    }
  }

  if (url === null || url === '') {
    throw new ErrorWolf('clientehttp.curl_invalido', 'El texto de curl no tiene una URL.');
  }
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    avisos.push({ codigo: 'url_sin_esquema' });
    url = `http://${url}`;
  }

  // -G: los datos van a la consulta y la petición es un GET.
  if (get && datos.length > 0) {
    const consulta = datos.map(codificarDato).join('&');
    const h = url.indexOf('#');
    const [antes, frag] = h < 0 ? [url, ''] : [url.slice(0, h), url.slice(h)];
    url = `${antes}${antes.includes('?') ? '&' : '?'}${consulta}${frag}`;
    datos.length = 0;
  }

  // Cuerpo según el Content-Type (que el cliente pone solo).
  const iTipo = cabeceras.findIndex((c) => c.clave.toLowerCase() === 'content-type');
  const tipo = iTipo >= 0 ? cabeceras[iTipo]!.valor : null;
  let cuerpo: PeticionHttp['cuerpo'] = { tipo: 'ninguno' };
  if (campos.length > 0) {
    cuerpo = { tipo: 'multipart', campos };
    if (iTipo >= 0) cabeceras.splice(iTipo, 1);
  } else if (datos.length > 0) {
    const crudo = datos.join('&');
    if (json || (tipo && /json/i.test(tipo))) {
      cuerpo = { tipo: 'json', texto: crudo };
      if (iTipo >= 0 && /^application\/json\s*(;.*)?$/i.test(tipo ?? ''))
        cabeceras.splice(iTipo, 1);
      else if (iTipo >= 0) cuerpo = { tipo: 'raw', texto: crudo, tipoContenido: tipo ?? '' };
      if (json && !cabeceras.some((c) => c.clave.toLowerCase() === 'accept')) {
        cabeceras.push({ clave: 'Accept', valor: 'application/json', activo: true });
      }
    } else if (!tipo || /x-www-form-urlencoded/i.test(tipo)) {
      cuerpo = {
        tipo: 'form',
        campos: crudo
          .split('&')
          .filter((x) => x)
          .map((x) => {
            const e = x.indexOf('=');
            return {
              clave: decodificarForm(e < 0 ? x : x.slice(0, e)),
              valor: e < 0 ? '' : decodificarForm(x.slice(e + 1)),
              activo: true,
            };
          }),
      };
      if (iTipo >= 0) cabeceras.splice(iTipo, 1);
    } else {
      cuerpo = { tipo: 'raw', texto: crudo, tipoContenido: tipo };
      cabeceras.splice(iTipo, 1);
    }
  }

  let m = metodo ?? (cabeza ? 'HEAD' : datos.length > 0 || campos.length > 0 ? 'POST' : 'GET');
  if (!(METODOS_HTTP as readonly string[]).includes(m)) {
    avisos.push({ codigo: 'opcion_ignorada', dato: corto(`-X ${m}`) });
    m = datos.length > 0 || campos.length > 0 ? 'POST' : 'GET';
  }
  // Sin repetidos y con tope: un `-qqqq…` de 60 KB no inunda la interfaz.
  const vistos = new Set<string>();
  const unicos = avisos.filter((a) => {
    const k = `${a.codigo}:${a.dato ?? ''}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  return {
    peticion: {
      id: '',
      nombre: '',
      metodo: m as MetodoHttp,
      url,
      params: [],
      cabeceras,
      cuerpo,
      auth,
      plazoSeg,
      ignorarCertificado: false,
    },
    avisos: unicos.slice(0, MAX_AVISOS_CURL),
  };
}

const comillas = (s: string): string => `'${s.replace(/'/g, `'\\''`)}'`;

/**
 * Comando curl (para shells POSIX) de una petición ya compuesta. Con los secretos como
 * `<secreto>` salvo que el usuario pida incluirlos.
 */
export function aCurl(r: PeticionResuelta): string {
  const partes: string[] = ['curl'];
  if (r.metodo === 'HEAD') partes.push('-I');
  else if (r.metodo !== 'GET' || r.cuerpo.tipo !== 'ninguno') partes.push('-X', r.metodo);
  partes.push(comillas(r.url.replaceAll('%3Csecreto%3E', '<secreto>')));
  for (const [k, v] of r.cabeceras) {
    if (k.toLowerCase() === 'authorization' && /^Basic [^\s:]*:/.test(v)) {
      partes.push('-u', comillas(v.slice(6)));
    } else partes.push('-H', comillas(`${k}: ${v}`));
  }
  const c = r.cuerpo;
  if (c.tipo === 'multipart') {
    for (const [k, v] of c.campos) partes.push('--form-string', comillas(`${k}=${v}`));
  } else if (c.tipo === 'form') {
    for (const [k, v] of c.campos) partes.push('--data-urlencode', comillas(`${k}=${v}`));
  } else if (c.tipo === 'texto') {
    const cuerpo = construirCuerpo(c);
    if (cuerpo?.tipoContenido) partes.push('-H', comillas(`Content-Type: ${cuerpo.tipoContenido}`));
    partes.push('--data-raw', comillas(c.texto));
  }
  return partes.join(' ');
}
