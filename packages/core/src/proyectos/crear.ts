import { lstat, mkdir, readdir, rmdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { motorDe, type ObjetivoBd } from '../bd/basesDeDatos';
import { validarNombreBd } from '../bd/clienteMysql';
import { ErrorWolf } from '../errores';
import type { Rutas } from '../rutas';
import { TIPOS_CON_PHP, type Sitio } from '../tipos';
import type { PasoReceta } from './config';
import { phpPorDefecto } from './detectar';
import { generador, TIPOS_GENERADOR, type PedidoProyecto, type TipoGenerador } from './generadores';
import { motorDelPedido } from './generadores/comun';
import type { ResultadoReceta } from './recetas';

/** Nombre del proyecto: minúsculas, dígitos y guiones; da el dominio `<nombre>.test`. */
export const NOMBRE_PROYECTO = /^[a-z0-9][a-z0-9-]{0,39}$/;
const RAMA = /^\d{1,2}\.\d{1,2}$/;
const INSTANCIA = /^(mysql|mariadb|postgresql|mongodb)@[0-9a-z][0-9a-z.]{0,15}$/;
/** Nombres que Windows reserva para dispositivos: no valen como carpeta ni como dominio. */
const RESERVADOS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/;

/** Lo que `crearProyecto` dejó hecho (también cuando un paso falló a la mitad). */
export interface CreadoProyecto {
  /** La carpeta del proyecto existe: la creó esta operación o ya existía vacía. */
  carpeta: boolean;
  /** Base de datos creada por el paso `bd-crear`; null si no hubo o no llegó a crearse. */
  base: string | null;
  /** Id del sitio creado. */
  sitio: string;
}

export interface ResultadoCrearProyecto {
  sitio: Sitio;
  receta: ResultadoReceta;
  creado: CreadoProyecto;
}

export interface DepsCrearProyecto {
  rutas: Pick<Rutas, 'base'>;
  /** Crea el sitio (confiado, con lo que trae `sitio-crear`) y aplica Nginx, hosts y HTTPS. */
  crearSitio: (
    datos: Omit<Sitio, 'id'>,
    receta: readonly PasoReceta[],
  ) => Promise<{ sitio: Sitio }>;
  ejecutarReceta: (sitioId: string, receta: PasoReceta[]) => Promise<ResultadoReceta>;
  /** Pasos de la receta con su estado (para saber qué quedó hecho). */
  estadoReceta: (sitioId: string) => { pasos: { tipo: string; estado: string }[] };
  sitios: () => Promise<Sitio[]>;
  /** Nombres de las bases que ya existen en el motor o la instancia. */
  basesDe: (objetivo: ObjetivoBd) => Promise<string[]>;
  phpInstaladas: () => Promise<string[]>;
  /** Vuelve a tomar la huella de la receta con lo que dejó la creación (no es fatal si falla). */
  confiar: (sitioId: string) => Promise<unknown>;
}

const invalido = (campo: string, texto: string): ErrorWolf =>
  new ErrorWolf('proyectos.argumento_invalido', texto, { campo });

/** Valida el nombre del proyecto; lanza `proyectos.nombre_invalido`. */
export function validarNombreProyecto(nombre: unknown): string {
  if (
    typeof nombre !== 'string' ||
    !NOMBRE_PROYECTO.test(nombre) ||
    nombre.endsWith('-') ||
    nombre.includes('--') ||
    RESERVADOS.test(nombre)
  ) {
    throw new ErrorWolf(
      'proyectos.nombre_invalido',
      'El nombre del proyecto solo puede llevar minúsculas, números y guiones (hasta 40).',
      { campo: 'nombre' },
    );
  }
  return nombre;
}

/**
 * Valida la carpeta del proyecto nuevo: ruta absoluta, sin `..`, que no sea una raíz ni esté en la
 * carpeta de datos de WolfCore Dev, que termine en el nombre del proyecto y cuya carpeta padre ya
 * exista. Devuelve si hay que crearla. Una carpeta que existe debe estar vacía y no ser un enlace.
 */
export async function validarCarpetaNueva(
  carpeta: unknown,
  nombre: string,
  datos: string,
): Promise<{ crear: boolean }> {
  const malo = (): ErrorWolf =>
    new ErrorWolf('proyectos.carpeta_invalida', 'La carpeta del proyecto no es válida.');
  if (typeof carpeta !== 'string' || carpeta === '' || /[\0]/.test(carpeta)) throw malo();
  if (!path.isAbsolute(carpeta)) throw malo();
  if (carpeta.split(/[\\/]+/).includes('..')) throw malo();
  // Rutas de red y prefijos \\?\ o \\.\: no se crean proyectos ahí.
  if (/^[\\/]{2}/.test(carpeta)) throw malo();
  const limpia = carpeta.replace(/[\\/]+$/, '');
  if (path.basename(limpia) !== nombre) throw malo();
  const padre = path.dirname(limpia);
  const dentro = (a: string, b: string): boolean => {
    const rel = path.relative(path.resolve(a), path.resolve(b));
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  };
  if (dentro(datos, limpia)) throw malo();
  try {
    if (!(await stat(padre)).isDirectory()) throw malo();
  } catch (e) {
    if (e instanceof ErrorWolf) throw e;
    throw malo();
  }
  let info;
  try {
    info = await lstat(limpia);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { crear: true };
    throw e;
  }
  if (info.isSymbolicLink() || !info.isDirectory()) throw malo();
  if ((await readdir(limpia)).length > 0) {
    throw new ErrorWolf(
      'proyectos.carpeta_no_vacia',
      'La carpeta del proyecto ya tiene archivos: elija otra o vacíela.',
    );
  }
  return { crear: false };
}

/**
 * Crea un proyecto nuevo: valida todo antes de tocar nada, crea la carpeta, el sitio (con
 * HTTPS) y corre la receta del generador. Si falla antes de la receta (el sitio no se puede
 * crear), deshace lo único que hizo: la carpeta vacía. Si un paso de la receta falla, no borra
 * nada (puede ser trabajo largo del usuario): el resultado dice qué quedó creado y la receta
 * conserva el paso fallido para reintentar o seguir desde la interfaz.
 */
export async function crearProyecto(
  d: DepsCrearProyecto,
  p: PedidoProyecto,
): Promise<ResultadoCrearProyecto> {
  if (!(TIPOS_GENERADOR as readonly string[]).includes(p?.tipo)) {
    throw invalido('tipo', 'El tipo de proyecto no existe.');
  }
  const nombre = validarNombreProyecto(p.nombre);
  const gen = generador(p.tipo as TipoGenerador);
  const dominio = gen.dominio(nombre);
  const { crear } = await validarCarpetaNueva(p.carpeta, nombre, d.rutas.base);
  const carpeta = p.carpeta.replace(/[\\/]+$/, '');

  if ((await d.sitios()).some((s) => s.dominio === dominio || s.alias.includes(dominio))) {
    throw new Error(`Ya existe un sitio con el dominio ${dominio}`);
  }

  // PHP: el pedido o la rama 8.x más nueva instalada; debe estar instalado.
  let php: string | undefined;
  if (TIPOS_CON_PHP.includes(gen.tipoSitio)) {
    const instaladas = await d.phpInstaladas();
    if (p.php !== undefined && !RAMA.test(p.php))
      throw invalido('php', 'La versión de PHP no es válida.');
    php = p.php ?? phpPorDefecto(gen.tipoSitio, null, instaladas) ?? undefined;
    if (!php || !instaladas.includes(php)) {
      throw new Error(
        php
          ? `PHP ${php} no está instalado. Instálelo desde Servicios.`
          : 'No hay PHP instalado. Instálelo desde Servicios.',
      );
    }
  }
  if (p.python !== undefined && !RAMA.test(p.python)) {
    throw invalido('python', 'La versión de Python no es válida.');
  }

  // Base: nombre válido, motor coherente y que no exista ya (nunca se reutiliza una con datos).
  let pedido = { ...p, nombre, carpeta, ...(php ? { php } : {}) };
  if (p.base) {
    if (p.base.instancia !== null && !INSTANCIA.test(p.base.instancia)) {
      throw invalido('base', 'La instancia de la base de datos no es válida.');
    }
    const motor = motorDelPedido(p, gen.motorPorDefecto(p));
    if (!motor) throw invalido('base', 'Este tipo de proyecto no usa base de datos.');
    if (typeof p.base.nombre !== 'string')
      throw invalido('base', 'El nombre de la base no es válido.');
    if (motor !== 'mongodb') {
      try {
        validarNombreBd(p.base.nombre);
      } catch (e) {
        throw invalido(
          'base',
          e instanceof Error ? e.message : 'El nombre de la base no es válido.',
        );
      }
    } else if (!/^[A-Za-z0-9_-]{1,63}$/.test(p.base.nombre)) {
      throw invalido('base', 'El nombre de la base no es válido.');
    }
    if (p.tipo === 'wordpress' && motor !== 'mysql' && motor !== 'mariadb') {
      throw invalido('base', 'WordPress necesita MySQL o MariaDB.');
    }
    if (p.opciones?.pgvector && motor !== 'postgresql') {
      throw invalido('base', 'pgvector necesita PostgreSQL.');
    }
    const objetivo: ObjetivoBd = p.base.instancia ?? motor;
    motorDe(objetivo);
    // Si el motor está apagado, esto falla aquí, antes de crear nada.
    const existentes = await d.basesDe(objetivo);
    if (existentes.includes(p.base.nombre)) {
      throw new ErrorWolf(
        'proyectos.base_existe',
        `La base ${p.base.nombre} ya existe: elija otro nombre.`,
        { nombre: p.base.nombre },
      );
    }
    pedido = { ...pedido, base: { ...p.base, motor } };
  } else if (p.opciones?.pgvector) {
    throw invalido('base', 'pgvector necesita una base de datos.');
  }

  const receta = gen.pasos({ ...pedido, opciones: { ...p.opciones } });

  let creaCarpeta = false;
  if (crear) {
    await mkdir(carpeta);
    creaCarpeta = true;
  }
  let sitio: Sitio;
  try {
    const datos: Omit<Sitio, 'id'> = {
      nombre,
      dominio,
      alias: [],
      carpeta,
      tipo: gen.tipoSitio,
      php: php ?? null,
      puertoProxy: null,
      reglasExtra: '',
      urlBaseVar: null,
      datosReales: false,
      nota: '',
      https: true,
      redirigirHttps: false,
      // El usuario pidió este proyecto y la receta es la del generador: se puede correr.
      confiado: true,
      git: null,
      procesos: [],
      runtimes: p.python ? { python: p.python } : {},
    };
    sitio = (await d.crearSitio(datos, receta)).sitio;
  } catch (e) {
    // El sitio no se creó: se quita solo la carpeta que creó esta operación y sigue vacía.
    if (creaCarpeta) await rmdir(carpeta).catch(() => undefined);
    throw e;
  }

  let resultado: ResultadoReceta;
  try {
    resultado = await d.ejecutarReceta(sitio.id, receta);
  } catch (e) {
    resultado = {
      estado: 'error',
      mensaje: e instanceof Error ? e.message : String(e),
    };
  }
  if (resultado.estado === 'lista') await d.confiar(sitio.id).catch(() => undefined);

  const pasos = d.estadoReceta(sitio.id).pasos;
  const baseCreada =
    pedido.base && pasos.some((x) => x.tipo === 'bd-crear' && x.estado === 'listo')
      ? pedido.base.nombre
      : null;
  return {
    sitio,
    receta: resultado,
    creado: { carpeta: true, base: baseCreada, sitio: sitio.id },
  };
}
