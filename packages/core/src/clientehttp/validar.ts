import { ErrorWolf } from '../errores';
import {
  MAX_CUERPO_PETICION,
  MAX_PARES_HTTP,
  MAX_VARIABLES_ENTORNO,
  METODOS_HTTP,
  PLAZO_HTTP_DEFECTO_SEG,
  PLAZO_HTTP_MAX_SEG,
  type AuthHttp,
  type CuerpoHttp,
  type EntornoHttp,
  type MetodoHttp,
  type ParHttp,
  type PeticionHttp,
  type VariableHttp,
} from './tipos';

/** Id de un secreto del cliente HTTP en `AlmacenSecretos`. */
export const REF_SECRETO = /^http:[a-f0-9]{16}$/;
const ID = /^[a-f0-9]{16}$/;
const NOMBRE_VARIABLE = /^[A-Za-z_][\w.-]{0,63}$/;
/** Nombre de cabecera (token de RFC 9110). */
export const NOMBRE_CABECERA = /^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,256}$/;

export function invalido(campo: string): ErrorWolf {
  return new ErrorWolf('clientehttp.peticion_invalida', `Dato no válido: ${campo}`, { campo });
}

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

function texto(v: unknown, campo: string, max: number, vacio = true): string {
  if (typeof v !== 'string' || v.length > max || (!vacio && v.length === 0)) throw invalido(campo);
  return v;
}

function ref(v: unknown, campo: string): string | undefined {
  if (v === undefined || v === '') return undefined;
  if (typeof v !== 'string' || !REF_SECRETO.test(v)) throw invalido(campo);
  return v;
}

function pares(v: unknown, campo: string): ParHttp[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > MAX_PARES_HTTP) throw invalido(campo);
  return v.map((p) => {
    if (!esObjeto(p)) throw invalido(campo);
    const r = ref(p['ref'], campo);
    return {
      clave: texto(p['clave'], campo, 256),
      valor: texto(p['valor'] ?? '', campo, MAX_CUERPO_PETICION),
      activo: p['activo'] !== false,
      ...(r ? { ref: r } : {}),
    };
  });
}

function cuerpo(v: unknown): CuerpoHttp {
  if (v === undefined) return { tipo: 'ninguno' };
  if (!esObjeto(v)) throw invalido('cuerpo');
  switch (v['tipo']) {
    case 'ninguno':
      return { tipo: 'ninguno' };
    case 'json':
      return { tipo: 'json', texto: texto(v['texto'] ?? '', 'cuerpo', MAX_CUERPO_PETICION) };
    case 'raw': {
      const tc = v['tipoContenido'];
      return {
        tipo: 'raw',
        texto: texto(v['texto'] ?? '', 'cuerpo', MAX_CUERPO_PETICION),
        ...(typeof tc === 'string' && tc.trim()
          ? { tipoContenido: texto(tc.trim(), 'cuerpo', 200) }
          : {}),
      };
    }
    case 'form':
    case 'multipart':
      return { tipo: v['tipo'], campos: pares(v['campos'], 'cuerpo') };
    default:
      throw invalido('cuerpo');
  }
}

function auth(v: unknown): AuthHttp {
  if (v === undefined) return { tipo: 'ninguna' };
  if (!esObjeto(v)) throw invalido('auth');
  const valor =
    v['valor'] === undefined || v['valor'] === '' ? undefined : texto(v['valor'], 'auth', 4096);
  const r = ref(v['ref'], 'auth');
  const secreto = { ...(valor !== undefined ? { valor } : {}), ...(r ? { ref: r } : {}) };
  switch (v['tipo']) {
    case 'ninguna':
      return { tipo: 'ninguna' };
    case 'bearer':
      return { tipo: 'bearer', ...secreto };
    case 'basic':
      return { tipo: 'basic', usuario: texto(v['usuario'] ?? '', 'auth', 256), ...secreto };
    case 'apikey': {
      const nombre = texto(v['nombre'] ?? '', 'auth', 256);
      if (nombre && !NOMBRE_CABECERA.test(nombre)) throw invalido('auth');
      if (v['en'] !== 'cabecera' && v['en'] !== 'query') throw invalido('auth');
      return { tipo: 'apikey', nombre, en: v['en'], ...secreto };
    }
    default:
      throw invalido('auth');
  }
}

/** Valida y copia una petición (solo los campos conocidos). Lanza `clientehttp.peticion_invalida`. */
export function peticionValida(v: unknown): PeticionHttp {
  if (!esObjeto(v)) throw invalido('peticion');
  const id = v['id'] === undefined || v['id'] === '' ? '' : texto(v['id'], 'id', 16);
  if (id && !ID.test(id)) throw invalido('id');
  const metodo = typeof v['metodo'] === 'string' ? v['metodo'].toUpperCase() : '';
  if (!(METODOS_HTTP as readonly string[]).includes(metodo)) throw invalido('metodo');
  const plazo = v['plazoSeg'] ?? PLAZO_HTTP_DEFECTO_SEG;
  if (typeof plazo !== 'number' || !Number.isFinite(plazo)) throw invalido('plazoSeg');
  return {
    id,
    nombre: texto(v['nombre'] ?? '', 'nombre', 120),
    metodo: metodo as MetodoHttp,
    url: texto(v['url'] ?? '', 'url', 8192),
    params: pares(v['params'], 'params'),
    cabeceras: pares(v['cabeceras'], 'cabeceras'),
    cuerpo: cuerpo(v['cuerpo']),
    auth: auth(v['auth']),
    plazoSeg: Math.min(PLAZO_HTTP_MAX_SEG, Math.max(1, Math.round(plazo))),
    ignorarCertificado: v['ignorarCertificado'] === true,
  };
}

export function entornoValido(v: unknown): EntornoHttp {
  if (!esObjeto(v)) throw invalido('entorno');
  const id = v['id'] === undefined || v['id'] === '' ? '' : texto(v['id'], 'id', 16);
  if (id && !ID.test(id)) throw invalido('id');
  const lista = v['variables'] ?? [];
  if (!Array.isArray(lista) || lista.length > MAX_VARIABLES_ENTORNO) throw invalido('variables');
  const vistas = new Set<string>();
  const variables = lista.map((x): VariableHttp => {
    if (!esObjeto(x)) throw invalido('variables');
    const nombre = texto(x['nombre'], 'variables', 64, false);
    if (!NOMBRE_VARIABLE.test(nombre) || vistas.has(nombre)) throw invalido('variables');
    vistas.add(nombre);
    const r = ref(x['ref'], 'variables');
    return {
      nombre,
      valor: texto(x['valor'] ?? '', 'variables', 8192),
      secreta: x['secreta'] === true,
      ...(r ? { ref: r } : {}),
    };
  });
  return { id, nombre: texto(v['nombre'], 'nombre', 80, false), variables };
}

export const idValido = (v: unknown, campo = 'id'): string => {
  if (typeof v !== 'string' || !ID.test(v)) throw invalido(campo);
  return v;
};

export function refValida(v: unknown): string {
  if (typeof v !== 'string' || !REF_SECRETO.test(v)) throw invalido('ref');
  return v;
}
