import type { ParHttp, PeticionHttp } from '@pel/core';

/**
 * Peticiones de ejemplo de la guía HTTP (D49) para el servidor de ejemplo local (127.0.0.1). Son
 * datos fijos: ni se interpretan los `curl` de la guía ni sale nada a internet. Los métodos y
 * códigos que el cliente HTTP no puede enviar (CONNECT, TRACE) no tienen botón.
 */

const cab = (clave: string, valor: string): ParHttp => ({ clave, valor, activo: true });
const json = (texto: string): PeticionHttp['cuerpo'] => ({ tipo: 'json', texto });

type Base = Pick<PeticionHttp, 'metodo'> & Partial<Omit<PeticionHttp, 'metodo'>> & { ruta: string };

function armar(nombre: string, puerto: number, b: Base): Partial<PeticionHttp> {
  const { ruta, ...resto } = b;
  return { nombre, url: `http://127.0.0.1:${puerto}${ruta}`, ...resto };
}

const METODOS: Record<string, Base> = {
  GET: {
    metodo: 'GET',
    ruta: '/eco',
    params: [cab('categoria', 'libros')],
    cabeceras: [cab('Accept', 'application/json')],
  },
  POST: {
    metodo: 'POST',
    ruta: '/creado',
    cuerpo: json('{"titulo":"Revisar respaldo","usuario":"demo"}'),
  },
  PUT: {
    metodo: 'PUT',
    ruta: '/eco',
    cuerpo: json('{"nombre":"demo","rol":"editor","activo":true}'),
  },
  PATCH: { metodo: 'PATCH', ruta: '/eco', cuerpo: json('{"activo":false}') },
  DELETE: { metodo: 'DELETE', ruta: '/estado/204' },
  HEAD: { metodo: 'HEAD', ruta: '/eco' },
  OPTIONS: {
    metodo: 'OPTIONS',
    ruta: '/eco',
    cabeceras: [cab('Origin', 'http://app.ejemplo.com')],
  },
};

const JSON_CAB = (): ParHttp[] => [cab('Accept', 'application/json')];

/** Ajustes de los códigos que necesitan algo más que `GET /estado/<código>`. */
const CODIGOS: Record<number, Partial<Base>> = {
  201: { metodo: 'POST', ruta: '/creado', cuerpo: json('{"texto":"Hola"}') },
  202: { metodo: 'POST' },
  204: { metodo: 'DELETE' },
  206: { cabeceras: [cab('Range', 'bytes=0-1023')] },
  301: { ruta: '/redirigir/301' },
  302: { ruta: '/redirigir/302' },
  303: {
    metodo: 'POST',
    ruta: '/redirigir/303',
    cuerpo: { tipo: 'form', campos: [cab('item', '1')] },
  },
  304: { cabeceras: [cab('If-None-Match', '"v123"')] },
  307: { metodo: 'POST', ruta: '/redirigir/307', cuerpo: json('{"nombre":"demo"}') },
  308: { metodo: 'POST', ruta: '/redirigir/308', cuerpo: json('{}') },
  400: { metodo: 'POST', cuerpo: json('{mal_json}') },
  405: { metodo: 'DELETE' },
  406: { cabeceras: [cab('Accept', 'application/xml')] },
  409: { metodo: 'POST', cuerpo: json('{"email":"demo@ejemplo.com"}') },
  413: {
    metodo: 'POST',
    cuerpo: { tipo: 'raw', texto: 'archivo-grande', tipoContenido: 'text/plain' },
  },
  415: { metodo: 'POST', cuerpo: { tipo: 'raw', texto: 'hola', tipoContenido: 'text/plain' } },
  419: { metodo: 'POST', cuerpo: { tipo: 'form', campos: [cab('mensaje', 'Hola')] } },
  422: { metodo: 'POST', cuerpo: json('{"email":"no-es-correo"}'), cabeceras: JSON_CAB() },
  425: { metodo: 'POST', cuerpo: { tipo: 'form', campos: [cab('monto', '10')] } },
  429: { ruta: '/limite' },
  504: { ruta: '/lento' },
};

/** Método de la guía → petición contra el servidor de ejemplo; null si el cliente no lo envía. */
export function peticionDeMetodo(nombre: string, puerto: number): Partial<PeticionHttp> | null {
  const b = METODOS[nombre.toUpperCase()];
  return b ? armar(`${nombre}`, puerto, b) : null;
}

/** Código de estado de la guía → petición contra `/estado/<código>` (o la ruta que lo ilustra). */
export function peticionDeCodigo(codigo: number, puerto: number): Partial<PeticionHttp> {
  const extra = CODIGOS[codigo] ?? {};
  return armar(String(codigo), puerto, {
    metodo: 'GET',
    ruta: `/estado/${codigo}`,
    ...extra,
  } as Base);
}

/** ¿Tiene botón «Probar» este método? */
export const tienePrueba = (nombre: string): boolean => nombre.toUpperCase() in METODOS;
