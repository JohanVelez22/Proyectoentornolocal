import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import { STATUS_CODES } from 'node:http';
import { ErrorWolf } from '../errores';
import { construirCuerpo, type PeticionResuelta } from './componer';
import { cabeceraDeCredencial, urlSinSecretos } from './sensibles';
import {
  MAX_REDIRECCIONES_HTTP,
  MAX_RESPUESTA_HTTP,
  type RespuestaHttp,
  type SaltoHttp,
} from './tipos';

export interface OpcionesRed {
  /** Raíces para este host (sistema + CA de WolfCore), o undefined para las de siempre. */
  caPara?: (host: string) => string[] | undefined;
  senal?: AbortSignal;
  maxCuerpo?: number;
  maxSaltos?: number;
}

const REDIRECCIONES = new Set([301, 302, 303, 307, 308]);

/** Raíces del sistema (si Node las ofrece) más la CA de WolfCore, para un agente por petición. */
export function raicesConCa(caWolf: string): string[] {
  let base: string[];
  try {
    base = tls.getCACertificates('system');
  } catch {
    base = [];
  }
  if (base.length === 0) base = [...tls.rootCertificates];
  return [...base, caWolf];
}

/** `*.test` y los dominios de sitios de WolfCore: lo único donde se confía en la CA de WolfCore. */
export function hostConCaWolf(host: string, dominios: readonly string[]): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  return h === 'test' || h.endsWith('.test') || dominios.some((d) => d.toLowerCase() === h);
}

const origen = (u: URL): string => `${u.protocol}//${u.host}`;

function errorDeRed(
  e: unknown,
  plazoMs: number,
  porPlazo: boolean,
  senal?: AbortSignal,
): ErrorWolf {
  if (e instanceof ErrorWolf) return e;
  if (porPlazo) {
    return new ErrorWolf('clientehttp.plazo', 'La petición superó el plazo.', {
      segundos: Math.max(1, Math.round(plazoMs / 1000)),
    });
  }
  if (senal?.aborted) return new ErrorWolf('clientehttp.cancelado', 'Petición cancelada.');
  const codigo = String((e as { code?: unknown } | null)?.code ?? '');
  if (
    /^(CERT_|UNABLE_TO_|DEPTH_ZERO_|SELF_SIGNED|ERR_TLS_CERT|HOSTNAME_MISMATCH|ERR_SSL_)/.test(
      codigo,
    ) ||
    codigo === 'ERR_TLS_CERT_ALTNAME_INVALID'
  ) {
    return new ErrorWolf('clientehttp.certificado', 'No se pudo verificar el certificado.', {
      motivo: codigo.slice(0, 60),
    });
  }
  return new ErrorWolf('clientehttp.sin_conexion', 'No se pudo conectar.', {
    motivo: /^[A-Z0-9_]{3,40}$/.test(codigo) ? codigo : 'ERROR',
  });
}

interface Salto {
  estado: number;
  mensaje: string;
  cabeceras: [string, string][];
  cuerpo: Buffer;
  truncada: boolean;
}

function pedirUna(
  url: URL,
  metodo: string,
  cabeceras: Record<string, string>,
  cuerpo: Buffer | null,
  ctl: AbortController,
  ignorar: boolean,
  ca: string[] | undefined,
  maxCuerpo: number,
): Promise<Salto> {
  return new Promise((resolver, rechazar) => {
    const esHttps = url.protocol === 'https:';
    const host = url.hostname.startsWith('[') ? url.hostname.slice(1, -1) : url.hostname;
    const opciones: https.RequestOptions = {
      method: metodo,
      hostname: host,
      port: url.port || (esHttps ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      headers: cabeceras,
      // Sin agente compartido: ni conexiones reutilizadas ni proxy del sistema.
      agent: false,
      signal: ctl.signal,
      ...(esHttps
        ? { ...(ca ? { ca } : {}), ...(ignorar ? { rejectUnauthorized: false } : {}) }
        : {}),
    };
    const req = (esHttps ? https : http).request(opciones, (res) => {
      const trozos: Buffer[] = [];
      let total = 0;
      let truncada = false;
      const fin = (): void =>
        resolver({
          estado: res.statusCode ?? 0,
          mensaje: res.statusMessage || STATUS_CODES[res.statusCode ?? 0] || '',
          cabeceras: pares(res.rawHeaders),
          cuerpo: Buffer.concat(trozos),
          truncada,
        });
      res.on('data', (d: Buffer) => {
        if (truncada) return;
        const resto = maxCuerpo - total;
        if (d.length > resto) {
          trozos.push(d.subarray(0, resto));
          total += resto;
          truncada = true;
          res.destroy();
          fin();
          return;
        }
        trozos.push(d);
        total += d.length;
      });
      res.on('end', () => {
        if (!truncada) fin();
      });
      res.on('error', (e) => {
        if (!truncada) rechazar(e);
      });
      res.on('close', () => {
        if (!truncada && !res.complete) rechazar(new Error('cerrada'));
      });
    });
    req.on('error', rechazar);
    req.end(cuerpo ?? undefined);
  });
}

function pares(raw: string[]): [string, string][] {
  const r: [string, string][] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) r.push([raw[i]!, raw[i + 1]!]);
  return r;
}

function esTexto(tipo: string, bytes: Buffer): string | null {
  if (bytes.includes(0)) return null;
  if (/charset\s*=\s*"?(?!utf-?8)[\w-]+/i.test(tipo)) return null;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** JSON con formato, o null si no lo es (o es demasiado grande para reformatearlo). */
export function jsonConFormato(tipo: string, texto: string): string | null {
  if (!/json/i.test(tipo) || texto.length > 2 * 1024 * 1024) return null;
  try {
    return JSON.stringify(JSON.parse(texto), null, 2);
  } catch {
    return null;
  }
}

/**
 * Envía la petición desde este proceso: plazo total, tope de respuesta, redirecciones a mano (cada
 * salto queda en la respuesta; al cambiar de origen se quitan `Authorization`, `Cookie` y las
 * cabeceras de credenciales), sin cookies persistentes y sin proxy. TLS siempre verificado; solo
 * `ignorarCertificado` lo relaja, y solo para el host de la petición.
 */
export async function ejecutar(req: PeticionResuelta, o: OpcionesRed = {}): Promise<RespuestaHttp> {
  const inicio = Date.now();
  const ctl = new AbortController();
  let porPlazo = false;
  const plazo = setTimeout(() => {
    porPlazo = true;
    ctl.abort();
  }, req.plazoMs);
  const cancelar = (): void => ctl.abort();
  if (o.senal?.aborted) ctl.abort();
  o.senal?.addEventListener('abort', cancelar, { once: true });
  const maxCuerpo = o.maxCuerpo ?? MAX_RESPUESTA_HTTP;
  const maxSaltos = o.maxSaltos ?? MAX_REDIRECCIONES_HTTP;
  try {
    let url = new URL(req.url);
    const hostInicial = url.hostname;
    let metodo: string = req.metodo;
    let cuerpo = construirCuerpo(req.cuerpo);
    const cabeceras = new Map<string, [string, string]>();
    for (const [k, v] of req.cabeceras) cabeceras.set(k.toLowerCase(), [k, v]);
    const poner = (k: string, v: string): void => {
      if (!cabeceras.has(k)) cabeceras.set(k, [k, v]);
    };
    poner('user-agent', 'WolfCoreDev');
    poner('accept', '*/*');
    poner('accept-encoding', 'identity');
    if (cuerpo?.tipoContenido) {
      // El límite del multipart es el nuestro: el del usuario no serviría.
      if (req.cuerpo.tipo === 'multipart')
        cabeceras.set('content-type', ['Content-Type', cuerpo.tipoContenido]);
      else poner('content-type', cuerpo.tipoContenido);
    }
    const saltos: SaltoHttp[] = [];
    let caWolf = false;

    for (let n = 0; ; n++) {
      const enviar: Record<string, string> = {};
      for (const [k, v] of cabeceras.values()) enviar[k] = v;
      if (cuerpo) enviar['content-length'] = String(cuerpo.datos.length);
      else if (metodo !== 'GET' && metodo !== 'HEAD' && metodo !== 'OPTIONS') {
        enviar['content-length'] = '0';
      }
      const ca = url.protocol === 'https:' ? o.caPara?.(url.hostname) : undefined;
      if (ca) caWolf = true;
      let r: Salto;
      try {
        r = await pedirUna(
          url,
          metodo,
          enviar,
          cuerpo?.datos ?? null,
          ctl,
          req.ignorarCertificado && url.hostname === hostInicial,
          ca,
          maxCuerpo,
        );
      } catch (e) {
        throw errorDeRed(e, req.plazoMs, porPlazo, o.senal);
      }
      const ubicacion = r.cabeceras.find(([k]) => k.toLowerCase() === 'location')?.[1];
      if (!REDIRECCIONES.has(r.estado) || !ubicacion) {
        const tipoContenido =
          r.cabeceras.find(([k]) => k.toLowerCase() === 'content-type')?.[1] ?? '';
        const texto = esTexto(tipoContenido, r.cuerpo);
        return {
          estado: r.estado,
          mensajeEstado: r.mensaje,
          tiempoMs: Date.now() - inicio,
          tamano: r.cuerpo.length,
          cabeceras: r.cabeceras,
          tipoContenido,
          cuerpo:
            texto === null
              ? { tipo: 'binario' }
              : {
                  tipo: 'texto',
                  texto,
                  json: r.truncada ? null : jsonConFormato(tipoContenido, texto),
                },
          truncada: r.truncada,
          saltos,
          urlFinal: urlSinSecretos(url.toString()),
          certificadoIgnorado: req.ignorarCertificado && url.protocol === 'https:',
          caWolf,
        };
      }
      if (n >= maxSaltos) {
        throw new ErrorWolf('clientehttp.demasiadas_redirecciones', 'Demasiadas redirecciones.', {
          max: maxSaltos,
        });
      }
      let siguiente: URL;
      try {
        siguiente = new URL(ubicacion, url);
      } catch {
        throw new ErrorWolf('clientehttp.url_invalida', 'La redirección lleva una URL no válida.');
      }
      if (siguiente.protocol !== 'http:' && siguiente.protocol !== 'https:') {
        throw new ErrorWolf('clientehttp.protocolo', 'Solo se admiten URL http:// y https://.');
      }
      if (siguiente.username || siguiente.password) {
        throw new ErrorWolf(
          'clientehttp.url_con_credenciales',
          'La URL no puede llevar usuario ni clave.',
        );
      }
      saltos.push({
        url: urlSinSecretos(url.toString()),
        estado: r.estado,
        ubicacion: urlSinSecretos(siguiente.toString()),
      });
      if (origen(siguiente) !== origen(url)) {
        for (const k of [...cabeceras.keys()]) if (cabeceraDeCredencial(k)) cabeceras.delete(k);
      }
      const aGet =
        r.estado === 303
          ? metodo !== 'HEAD'
          : (r.estado === 301 || r.estado === 302) && metodo === 'POST';
      if (aGet) {
        metodo = 'GET';
        cuerpo = null;
        cabeceras.delete('content-type');
      }
      url = siguiente;
    }
  } finally {
    clearTimeout(plazo);
    o.senal?.removeEventListener('abort', cancelar);
  }
}
