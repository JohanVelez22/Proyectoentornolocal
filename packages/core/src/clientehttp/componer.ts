import { randomBytes } from 'node:crypto';
import { ErrorWolf } from '../errores';
import { MARCA_SECRETO, esNombreSecreto, esSoloVariables, splitConsulta } from './sensibles';
import { MAX_CUERPO_PETICION, type MetodoHttp, type ParHttp, type PeticionHttp } from './tipos';
import { NOMBRE_CABECERA } from './validar';
import { sustituir } from './variables';

/**
 * Una petición que se guardó o se escribió pasa a tener la consulta de la URL en `params`: así las
 * claves sensibles (`?token=…`) se tratan como cualquier otro valor secreto. Sin fragmento (`#…`).
 */
export function normalizar(p: PeticionHttp): PeticionHttp {
  const [base, q] = splitConsulta(p.url);
  const sinFragmento = base.includes('#') ? base.slice(0, base.indexOf('#')) : base;
  if (q === null) return { ...p, url: sinFragmento };
  const decodificar = (s: string): string => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const deUrl: ParHttp[] = q.consulta
    .split('&')
    .filter((x) => x.length > 0)
    .map((x) => {
      const i = x.indexOf('=');
      return {
        clave: decodificar(i < 0 ? x : x.slice(0, i)),
        valor: i < 0 ? '' : decodificar(x.slice(i + 1)),
        activo: true,
      };
    });
  return { ...p, url: sinFragmento, params: [...deUrl, ...p.params] };
}

export type CuerpoResuelto =
  | { tipo: 'ninguno' }
  | { tipo: 'texto'; texto: string; tipoContenido: string | null }
  | { tipo: 'form'; campos: [string, string][] }
  | { tipo: 'multipart'; campos: [string, string][] };

export interface PeticionResuelta {
  metodo: MetodoHttp;
  /** URL completa, con la consulta ya codificada. */
  url: string;
  cabeceras: [string, string][];
  cuerpo: CuerpoResuelto;
  plazoMs: number;
  ignorarCertificado: boolean;
  /** Valores secretos usados (para quitarlos de cualquier texto que se devuelva). */
  secretos: string[];
}

export interface ContextoComponer {
  /** Variables del entorno ya resueltas (las secretas, con su valor o con la marca). */
  variables: ReadonlyMap<string, string>;
  leerSecreto(ref: string): Promise<string | null>;
  /** false: los valores secretos salen como `<secreto>` (copiar como curl sin credenciales). */
  incluirSecretos: boolean;
}

const VALOR_CABECERA = /^[\t\x20-\x7e\x80-\xff]*$/;
/** Las pone el cliente: las del usuario se descartan. */
const PROPIAS = new Set(['content-length', 'transfer-encoding', 'connection']);

function errorSecretoFaltante(): ErrorWolf {
  return new ErrorWolf(
    'clientehttp.secreto_faltante',
    'Falta un valor secreto: vuelva a escribirlo y guárdelo.',
  );
}

async function valorDe(
  v: string,
  ref: string | undefined,
  sensible: boolean,
  ctx: ContextoComponer,
  secretos: string[],
): Promise<string> {
  let valor = v;
  let secreto = false;
  if (valor === '' && ref) {
    secreto = true;
    if (ctx.incluirSecretos) {
      const s = await ctx.leerSecreto(ref);
      if (s === null) throw errorSecretoFaltante();
      valor = s;
    }
  } else if (valor !== '' && (ref || (sensible && !esSoloVariables(valor)))) {
    secreto = true;
  }
  if (!secreto) return sustituir(valor, ctx.variables);
  if (!ctx.incluirSecretos) return MARCA_SECRETO;
  const final = sustituir(valor, ctx.variables);
  secretos.push(final);
  return final;
}

async function lista(
  filas: ParHttp[],
  ctx: ContextoComponer,
  secretos: string[],
): Promise<[string, string][]> {
  const r: [string, string][] = [];
  for (const f of filas) {
    if (!f.activo || f.clave.trim() === '') continue;
    if (f.faltante && f.valor === '' && !f.ref && ctx.incluirSecretos) throw errorSecretoFaltante();
    const clave = sustituir(f.clave, ctx.variables);
    r.push([clave, await valorDe(f.valor, f.ref, esNombreSecreto(clave), ctx, secretos)]);
  }
  return r;
}

const codificar = (s: string): string => encodeURIComponent(s);

function urlCompleta(base: string, consulta: [string, string][]): string {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new ErrorWolf('clientehttp.url_invalida', 'La URL no es válida.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ErrorWolf('clientehttp.protocolo', 'Solo se admiten URL http:// y https://.');
  }
  if (url.username || url.password) {
    throw new ErrorWolf(
      'clientehttp.url_con_credenciales',
      'La URL no puede llevar usuario ni clave: use la pestaña de autenticación.',
    );
  }
  url.hash = '';
  const extra = consulta.map(([k, v]) => `${codificar(k)}=${codificar(v)}`).join('&');
  if (extra) url.search = url.search ? `${url.search}&${extra}` : `?${extra}`;
  return url.toString();
}

/**
 * Arma la petición lista para enviar: sustituye `{{variables}}`, inserta los secretos (solo si
 * `incluirSecretos`), aplica la autenticación y valida URL y cabeceras. Se llama en el proceso
 * principal: el renderer nunca recibe ni el resultado ni un secreto.
 */
export async function componer(
  entrada: PeticionHttp,
  ctx: ContextoComponer,
): Promise<PeticionResuelta> {
  const p = normalizar(entrada);
  const secretos: string[] = [];
  const base = sustituir(p.url.trim(), ctx.variables);
  const consulta = await lista(p.params, ctx, secretos);
  const cabeceras = await lista(p.cabeceras, ctx, secretos);

  const a = p.auth;
  if (a.tipo !== 'ninguna') {
    if (ctx.incluirSecretos && a.valor === undefined && !a.ref) throw errorSecretoFaltante();
    const secreto = await valorDe(a.valor ?? '', a.ref, true, ctx, secretos);
    if (a.tipo === 'bearer') {
      quitar(cabeceras, 'authorization');
      cabeceras.push(['Authorization', `Bearer ${secreto}`]);
    } else if (a.tipo === 'basic') {
      quitar(cabeceras, 'authorization');
      const usuario = sustituir(a.usuario, ctx.variables);
      if (ctx.incluirSecretos) {
        const credencial = Buffer.from(`${usuario}:${secreto}`, 'utf8').toString('base64');
        secretos.push(credencial);
        cabeceras.push(['Authorization', `Basic ${credencial}`]);
      } else {
        cabeceras.push(['Authorization', `Basic ${usuario}:${MARCA_SECRETO}`]);
      }
    } else {
      const nombre = sustituir(a.nombre, ctx.variables);
      if (!nombre)
        throw new ErrorWolf('clientehttp.peticion_invalida', 'Dato no válido: auth', {
          campo: 'auth',
        });
      if (a.en === 'cabecera') {
        quitar(cabeceras, nombre.toLowerCase());
        cabeceras.push([nombre, secreto]);
      } else {
        consulta.push([nombre, secreto]);
      }
    }
  }

  const finales: [string, string][] = [];
  for (const [n, v] of cabeceras) {
    const nombre = n.trim();
    if (!NOMBRE_CABECERA.test(nombre) || !VALOR_CABECERA.test(v)) {
      throw new ErrorWolf('clientehttp.cabecera_invalida', 'Una cabecera no es válida.', {
        nombre: nombre.slice(0, 60),
      });
    }
    if (PROPIAS.has(nombre.toLowerCase())) continue;
    finales.push([nombre, v]);
  }

  let cuerpo: CuerpoResuelto = { tipo: 'ninguno' };
  const c = p.cuerpo;
  if (c.tipo === 'json') {
    cuerpo = {
      tipo: 'texto',
      texto: sustituir(c.texto, ctx.variables),
      tipoContenido: 'application/json',
    };
  } else if (c.tipo === 'raw') {
    cuerpo = {
      tipo: 'texto',
      texto: sustituir(c.texto, ctx.variables),
      tipoContenido: c.tipoContenido ? sustituir(c.tipoContenido, ctx.variables) : 'text/plain',
    };
  } else if (c.tipo === 'form' || c.tipo === 'multipart') {
    cuerpo = { tipo: c.tipo, campos: await lista(c.campos, ctx, secretos) };
  }
  if (cuerpo.tipo === 'texto' && cuerpo.texto === '') cuerpo = { tipo: 'ninguno' };

  const resuelta: PeticionResuelta = {
    metodo: p.metodo,
    url: urlCompleta(base, consulta),
    cabeceras: finales,
    cuerpo,
    plazoMs: p.plazoSeg * 1000,
    ignorarCertificado: p.ignorarCertificado,
    secretos,
  };
  construirCuerpo(cuerpo); // valida el tamaño antes de salir
  return resuelta;
}

function quitar(cabeceras: [string, string][], minuscula: string): void {
  for (let i = cabeceras.length - 1; i >= 0; i--) {
    if (cabeceras[i]![0].toLowerCase() === minuscula) cabeceras.splice(i, 1);
  }
}

/** Bytes y `Content-Type` del cuerpo (multipart solo con texto, sin archivos del disco). */
export function construirCuerpo(
  c: CuerpoResuelto,
): { datos: Buffer; tipoContenido: string | null } | null {
  let r: { datos: Buffer; tipoContenido: string | null };
  switch (c.tipo) {
    case 'ninguno':
      return null;
    case 'texto':
      r = { datos: Buffer.from(c.texto, 'utf8'), tipoContenido: c.tipoContenido };
      break;
    case 'form':
      r = {
        datos: Buffer.from(c.campos.map(([k, v]) => `${codificar(k)}=${codificar(v)}`).join('&')),
        tipoContenido: 'application/x-www-form-urlencoded',
      };
      break;
    case 'multipart': {
      const limite = `----WolfCoreDev${randomBytes(12).toString('hex')}`;
      const nombre = (n: string): string =>
        n.replace(/"/g, '%22').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
      const partes = c.campos.map(
        ([k, v]) =>
          `--${limite}\r\nContent-Disposition: form-data; name="${nombre(k)}"\r\n\r\n${v}\r\n`,
      );
      r = {
        datos: Buffer.from(`${partes.join('')}--${limite}--\r\n`, 'utf8'),
        tipoContenido: `multipart/form-data; boundary=${limite}`,
      };
      break;
    }
  }
  if (r.datos.length > MAX_CUERPO_PETICION) {
    throw new ErrorWolf(
      'clientehttp.cuerpo_grande',
      'El cuerpo de la petición es demasiado grande.',
    );
  }
  return r;
}
