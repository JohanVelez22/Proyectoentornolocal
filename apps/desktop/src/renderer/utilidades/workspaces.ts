import type {
  ElementoWorkspace,
  EstadoInstancia,
  EstadoWorkspace,
  ResultadoWorkspace,
  Sitio,
} from '../../shared/api';

/** Captadores de correo: un workspace lleva a lo sumo uno (nunca corren dos a la vez). */
const CAPTADORES = ['mailpit', 'smtp4dev', 'inbucket', 'papercut'];
type IdServicio = Extract<ElementoWorkspace, { tipo: 'servicio' }>['id'];
/** Servicios que un workspace puede llevar como "servicio" (los demás van como instancia). */
export const SERVICIOS_WORKSPACE: readonly IdServicio[] = [
  'nginx',
  'php',
  'ollama',
  'mailpit',
  'smtp4dev',
  'inbucket',
  'papercut',
];
/** Motores con instancias propias (Ollama y los captadores van como servicio). */
const MOTORES_INSTANCIA = ['mysql', 'mariadb', 'postgresql', 'redis', 'mongodb'];

/** Clave estable de un elemento (la misma que usa el núcleo en los resultados). */
export function claveElemento(e: ElementoWorkspace): string {
  return e.tipo === 'proceso' ? `proceso:${e.sitioId}/${e.procesoId}` : `${e.tipo}:${e.id}`;
}

export const esCaptador = (e: ElementoWorkspace): boolean =>
  e.tipo === 'servicio' && CAPTADORES.includes(e.id);

/**
 * Agrega o quita un elemento de la selección. Al agregar un captador de correo se quita el que
 * hubiera (dos no pueden ir juntos).
 */
export function alternarElemento(
  seleccion: readonly ElementoWorkspace[],
  e: ElementoWorkspace,
): ElementoWorkspace[] {
  const k = claveElemento(e);
  if (seleccion.some((x) => claveElemento(x) === k)) {
    return seleccion.filter((x) => claveElemento(x) !== k);
  }
  const base = esCaptador(e) ? seleccion.filter((x) => !esCaptador(x)) : [...seleccion];
  return [...base, e];
}

export interface OpcionesElementos {
  instancias: { elemento: ElementoWorkspace; etiqueta: string }[];
  servicios: { elemento: ElementoWorkspace; etiqueta: string }[];
  procesos: { elemento: ElementoWorkspace; etiqueta: string; sitio: string }[];
}

/**
 * Lo que se puede poner en un workspace con lo que hay instalado y configurado: instancias de las
 * bases de datos, los servicios de la lista (PHP si hay alguna rama; los captadores e Ollama si
 * están instalados) y los procesos de los proyectos.
 */
export function opcionesElementos(
  instancias: readonly Pick<EstadoInstancia, 'id' | 'servicio' | 'version'>[],
  idsServicios: readonly string[],
  sitios: readonly Pick<Sitio, 'id' | 'nombre' | 'dominio' | 'procesos'>[],
): OpcionesElementos {
  const ids = new Set(idsServicios);
  return {
    instancias: instancias
      .filter((i) => MOTORES_INSTANCIA.includes(i.servicio))
      .map((i) => ({
        elemento: { tipo: 'instancia', id: i.id } as ElementoWorkspace,
        etiqueta: `${i.servicio} ${i.version}`,
      })),
    servicios: SERVICIOS_WORKSPACE.filter((s) =>
      s === 'php' ? [...ids].some((i) => i.startsWith('php-')) : ids.has(s),
    ).map((s) => ({ elemento: { tipo: 'servicio', id: s } as ElementoWorkspace, etiqueta: s })),
    procesos: sitios.flatMap((s) =>
      s.procesos.map((p) => ({
        elemento: { tipo: 'proceso', sitioId: s.id, procesoId: p.id } as ElementoWorkspace,
        etiqueta: p.nombre || p.id,
        sitio: s.nombre || s.dominio,
      })),
    ),
  };
}

/** Id del workspace a partir del nombre: minúsculas, sin tildes, con guiones; único en la lista. */
export function idDesdeNombre(nombre: string, existentes: readonly string[]): string {
  const base =
    nombre
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'workspace';
  if (!existentes.includes(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const c = `${base}-${i}`;
    if (!existentes.includes(c)) return c;
  }
  return `${base}-${Date.now() % 100000}`;
}

/** Lo que hace el botón principal: encender (apagado o en parte) o apagar (encendido). */
export const accionPrincipal = (estado: EstadoWorkspace): 'iniciar' | 'detener' =>
  estado === 'encendido' ? 'detener' : 'iniciar';

export interface ResumenResultado {
  /** Elementos que quedaron encendidos. */
  encendidos: string[];
  /** Elementos que no quedaron como se pidió (fallaron). */
  fallidos: ResultadoWorkspace[];
  /** Elementos que ya no existen: se ignoraron. */
  ignorados: string[];
  /** Elementos que no se apagaron porque otro workspace encendido los usa. */
  compartidos: string[];
}

/** Agrupa el resultado de encender o apagar: qué quedó encendido y qué no. */
export function resumirResultado(items: readonly ResultadoWorkspace[]): ResumenResultado {
  return {
    encendidos: items.filter((r) => r.ok && r.encendido).map((r) => r.elemento),
    fallidos: items.filter((r) => !r.ok),
    ignorados: items.filter((r) => r.aviso === 'no_existe').map((r) => r.elemento),
    compartidos: items.filter((r) => r.aviso === 'compartido').map((r) => r.elemento),
  };
}

/** Partes de una clave de elemento (`instancia:mysql@8.4`, `servicio:nginx`, `proceso:a/b`). */
export function partesClave(clave: string): { tipo: string; id: string } {
  const i = clave.indexOf(':');
  return { tipo: clave.slice(0, i), id: clave.slice(i + 1) };
}

/** El elemento reemplazado por un captador nuevo: de `reemplaza:servicio:smtp4dev`. */
export function elementoReemplazado(aviso: string | undefined): string | null {
  return aviso?.startsWith('reemplaza:') ? aviso.slice('reemplaza:'.length) : null;
}

const NOMBRES_SERVICIO: Record<string, string> = {
  nginx: 'Nginx',
  php: 'PHP',
  ollama: 'Ollama',
  mailpit: 'Mailpit',
  smtp4dev: 'smtp4dev',
  inbucket: 'Inbucket',
  papercut: 'Papercut',
};

/** Nombre legible de una clave de elemento: `mysql 8.4`, `Nginx`, `sitio · proceso`. */
export function nombreElemento(clave: string): string {
  const { tipo, id } = partesClave(clave);
  if (tipo === 'servicio') return NOMBRES_SERVICIO[id] ?? id;
  if (tipo === 'instancia') return id.replace('@', ' ');
  return id.replace('/', ' · ');
}

/** Textos de un resultado (los de `textos.workspaces.resultado` que usa `textoItem`). */
export interface TextosResultado {
  encendido: string;
  apagado: string;
  yaEncendido: string;
  yaApagado: string;
  noExiste: string;
  compartido: string;
  reemplaza: (otro: string) => string;
  fallo: string;
  falloApagar: string;
}

/** Lo que pasó con un elemento, en una frase (sin el motivo del error: va aparte). */
export function textoItem(
  r: ResultadoWorkspace,
  accion: 'iniciar' | 'detener',
  t: TextosResultado,
): string {
  if (!r.ok) return accion === 'iniciar' ? t.fallo : t.falloApagar;
  const otro = elementoReemplazado(r.aviso);
  if (otro !== null) return t.reemplaza(nombreElemento(otro));
  switch (r.aviso) {
    case 'no_existe':
      return t.noExiste;
    case 'compartido':
      return t.compartido;
    case 'ya_encendido':
      return t.yaEncendido;
    case 'ya_apagado':
      return t.yaApagado;
    default:
      return r.encendido ? t.encendido : t.apagado;
  }
}
