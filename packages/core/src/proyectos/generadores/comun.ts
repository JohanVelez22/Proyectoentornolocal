import type { MotorBd } from '../../bd/env';
import type { IdInstancia, TipoSitio } from '../../tipos';
import type { PasoReceta, TipoPaso } from '../config';

export const TIPOS_GENERADOR = [
  'laravel',
  'codeigniter4',
  'codeigniter3',
  'symfony',
  'fastapi',
  'wordpress',
  'estatico',
] as const;
export type TipoGenerador = (typeof TIPOS_GENERADOR)[number];

export interface PedidoProyecto {
  tipo: TipoGenerador;
  /** Nombre del proyecto: minúsculas, dígitos y guiones. Da el dominio (`<nombre>.test`). */
  nombre: string;
  /** Carpeta del proyecto nuevo (la elige el usuario en un diálogo y termina en el nombre). */
  carpeta: string;
  /**
   * Id de una plantilla propia (D14): el proyecto se crea desde ella en vez de desde un generador
   * (`tipo` se ignora: manda el de la plantilla).
   */
  plantilla?: string;
  /** Identificador de esta creación (lo pone `crearProyecto`): ata los pasos a su copia de la plantilla. */
  uso?: string;
  php?: string;
  python?: string;
  /** Instancia (o, sin ella, el motor predeterminado) y nombre de la base; null = sin base. */
  base: {
    instancia: IdInstancia | null;
    nombre: string;
    /** Motor cuando no hay instancia (por defecto el del tipo de proyecto). */
    motor?: MotorBd;
  } | null;
  opciones: {
    starterKit?: 'ninguno' | 'react' | 'vue' | 'livewire';
    symfonyWebapp?: boolean;
    pgvector?: boolean;
    /** El usuario acepta que WordPress solo publica una huella SHA-1 (débil). */
    confirmarHuellaDebil?: true;
    /** El usuario confirma restaurar un esquema de MySQL en MariaDB (o al revés). */
    confirmarMotorDistinto?: true;
    /** Versión de WordPress; por defecto `VERSION_WORDPRESS`. */
    versionWordpress?: string;
  };
}

export interface Generador {
  pasos(p: PedidoProyecto): PasoReceta[];
  dominio(nombre: string): string;
  /** Tipo de sitio que se crea. */
  tipoSitio: TipoSitio;
  /** Motor de base de datos por defecto (null: este tipo no usa base). */
  motorPorDefecto(p: PedidoProyecto): MotorBd | null;
}

/** WordPress que se descarga por defecto. */
export const VERSION_WORDPRESS = '7.1.5';

export const dominioDe = (nombre: string): string => `${nombre}.test`;

export function paso(tipo: TipoPaso, titulo: string, args?: Record<string, unknown>): PasoReceta {
  return { id: tipo, tipo, titulo, ...(args ? { args } : {}) };
}

/** Argumentos que dicen a los pasos de base de datos dónde crearla. */
export function argsBase(p: PedidoProyecto, motor: MotorBd | null): Record<string, unknown> {
  if (!p.base || !motor) return {};
  return {
    ...(p.base.instancia ? { instancia: p.base.instancia } : { motor }),
    base: p.base.nombre,
  };
}

/** Motor efectivo de la base del pedido: el de su instancia, o `base.motor`, o el del tipo. */
export function motorDelPedido(p: PedidoProyecto, porDefecto: MotorBd | null): MotorBd | null {
  if (!p.base) return null;
  if (p.base.instancia) return p.base.instancia.split('@')[0] as MotorBd;
  return p.base.motor ?? porDefecto;
}

export function pasoSitio(
  p: PedidoProyecto,
  g: Pick<Generador, 'tipoSitio'>,
  extra = {},
): PasoReceta {
  return paso('sitio-crear', `Crear el sitio ${dominioDe(p.nombre)}`, {
    tipo: g.tipoSitio,
    dominio: dominioDe(p.nombre),
    ...(p.php ? { php: p.php } : {}),
    https: true,
    ...extra,
  });
}
