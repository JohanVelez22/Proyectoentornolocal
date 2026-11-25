import { lstat, mkdir, readdir, realpath, rmdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { motorDe, type ObjetivoBd } from '../bd/basesDeDatos';
import { validarNombreBd } from '../bd/clienteMysql';
import { ErrorWolf } from '../errores';
import type { Rutas } from '../rutas';
import { TIPOS_CON_PHP, type Sitio } from '../tipos';
import type { PasoReceta } from './config';
import { phpPorDefecto } from './detectar';
import {
  generador,
  generadorDePlantilla,
  pasosOmitidosDePlantilla,
  TIPOS_GENERADOR,
  type Generador,
  type PedidoProyecto,
  type TipoGenerador,
} from './generadores';
import { validarIdPlantilla, type Plantilla } from './plantillas';
import { motorDelPedido, VERSION_WORDPRESS } from './generadores/comun';
import { mismaBase } from './pasos/bd';
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
  /** Avisos que no impiden el proyecto (p. ej. el proceso no arrancó). */
  avisos: string[];
}

export interface DepsCrearProyecto {
  rutas: Pick<Rutas, 'base'>;
  /** Crea el sitio (confiado, con lo que trae `sitio-crear`) y aplica Nginx, hosts y HTTPS. */
  crearSitio: (
    datos: Omit<Sitio, 'id'>,
    receta: readonly PasoReceta[],
  ) => Promise<{ sitio: Sitio }>;
  ejecutarReceta: (sitioId: string, receta: PasoReceta[]) => Promise<ResultadoReceta>;
  /** Pasos de la receta con su estado y marcas (para saber qué quedó hecho de verdad). */
  estadoReceta: (sitioId: string) => {
    pasos: { tipo: string; estado: string; marcas?: string[] }[];
  };
  sitios: () => Promise<Sitio[]>;
  /** Nombres de las bases que ya existen en el motor o la instancia. */
  basesDe: (objetivo: ObjetivoBd) => Promise<string[]>;
  phpInstaladas: () => Promise<string[]>;
  pythonInstaladas: () => Promise<string[]>;
  /** Arranca los procesos supervisados del sitio (uvicorn). Un fallo se informa, no se lanza. */
  iniciarProcesos?: (sitioId: string) => Promise<void>;
  /** Vuelve a tomar la huella de la receta con lo que dejó la creación (no es fatal si falla). */
  confiar: (sitioId: string) => Promise<unknown>;
  /** Plantillas propias (D14): `cargar` valida el id y la plantilla; lanza con código si falla. */
  plantillas?: { cargar: (id: string) => Promise<Plantilla> };
  /** Aplica a un sitio recién creado los ajustes de la plantilla (php.ini y reglas de Nginx). */
  aplicarAjustes?: (
    sitioId: string,
    ajustes: { phpIni: Record<string, string>; reglasNginx: string | null },
  ) => Promise<string[]>;
  /** Extensiones de PHP activas en una rama (para avisar de las que pide la plantilla). */
  extensionesActivas?: (rama: string) => Promise<string[]>;
}

/** `campo` es un nombre corto y legible en cualquier idioma: tipo, php, python, base, opciones. */
const invalido = (campo: string, texto: string): ErrorWolf =>
  new ErrorWolf('proyectos.argumento_invalido', texto, { campo });

const STARTER_KITS = ['ninguno', 'react', 'vue', 'livewire'];
const VERSION_WP = /^\d{1,2}\.\d{1,2}(\.\d{1,2})?$/;

/** Opciones contra listas cerradas: lo que no se reconoce se rechaza, no se ignora. */
function validarOpciones(p: PedidoProyecto, conPlantilla = false): void {
  const o: unknown = p.opciones ?? {};
  if (typeof o !== 'object' || o === null || Array.isArray(o)) {
    throw invalido('opciones', 'Las opciones del proyecto no son válidas.');
  }
  const x = o as Record<string, unknown>;
  const conocidas = [
    'starterKit',
    'symfonyWebapp',
    'pgvector',
    'confirmarHuellaDebil',
    'versionWordpress',
  ];
  for (const k of Object.keys(x)) {
    if (!conocidas.includes(k)) throw invalido('opciones', `Opción desconocida: ${k.slice(0, 30)}`);
  }
  if (x.starterKit !== undefined && !STARTER_KITS.includes(String(x.starterKit))) {
    throw invalido('opciones', 'El starter kit no es válido.');
  }
  for (const k of ['symfonyWebapp', 'pgvector']) {
    if (x[k] !== undefined && typeof x[k] !== 'boolean') {
      throw invalido('opciones', `La opción ${k} debe ser verdadera o falsa.`);
    }
  }
  if (x.confirmarHuellaDebil !== undefined && x.confirmarHuellaDebil !== true) {
    throw invalido('opciones', 'La confirmación de la huella débil no es válida.');
  }
  if (
    x.versionWordpress !== undefined &&
    (typeof x.versionWordpress !== 'string' || !VERSION_WP.test(x.versionWordpress))
  ) {
    throw invalido('opciones', 'La versión de WordPress no es válida.');
  }
  if (conPlantilla) {
    // Desde una plantilla solo cuenta pgvector: lo demás ya lo decidió la plantilla.
    for (const k of ['starterKit', 'symfonyWebapp', 'versionWordpress', 'confirmarHuellaDebil']) {
      if (x[k] !== undefined) throw invalido('opciones', 'Esa opción no aplica a una plantilla.');
    }
  } else if (p.tipo !== 'laravel' && x.starterKit !== undefined && x.starterKit !== 'ninguno') {
    throw invalido('opciones', 'Los starter kits son solo de Laravel.');
  }
}

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
  sitios: readonly { carpeta: string; dominio: string }[] = [],
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
  // Se compara con la ruta real del padre: un enlace o una unión no esconde otra carpeta.
  let real: string;
  try {
    if (!(await stat(padre)).isDirectory()) throw malo();
    real = path.join(await realpath(padre), nombre);
  } catch (e) {
    if (e instanceof ErrorWolf) throw e;
    throw malo();
  }
  const reales = async (r: string): Promise<string> => realpath(r).catch(() => path.resolve(r));
  for (const candidato of [limpia, real]) {
    if (dentro(await reales(datos), candidato)) throw malo();
    // Ni dentro de la carpeta de un sitio que ya existe: mezclaría dos proyectos.
    for (const s of sitios) {
      if (dentro(await reales(s.carpeta), candidato)) {
        throw new ErrorWolf(
          'proyectos.carpeta_de_otro_sitio',
          `La carpeta es la de otro proyecto (${s.dominio}) o está dentro de ella.`,
          { dominio: s.dominio },
        );
      }
    }
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
  let plantilla: Plantilla | null = null;
  if (p?.plantilla !== undefined) {
    // El id sale de una lista que el núcleo mismo armó; igual se valida y se lee la plantilla
    // entera (con su esquema de datos) antes de crear nada.
    const id = validarIdPlantilla(p.plantilla);
    if (!d.plantillas) {
      throw new ErrorWolf(
        'plantillas.no_existe',
        'Las plantillas de proyecto no están disponibles.',
      );
    }
    plantilla = await d.plantillas.cargar(id);
  } else if (!(TIPOS_GENERADOR as readonly string[]).includes(p?.tipo)) {
    throw invalido('tipo', 'El tipo de proyecto no existe.');
  }
  const nombre = validarNombreProyecto(p.nombre);
  validarOpciones(p, plantilla !== null);
  const gen: Generador = plantilla
    ? generadorDePlantilla(plantilla)
    : generador(p.tipo as TipoGenerador);
  const dominio = gen.dominio(nombre);
  // WordPress solo publica SHA-1 (débil): sin la confirmación no se crea nada. (Desde una
  // plantilla no se descarga nada: sus archivos ya están en el equipo.)
  if (!plantilla && p.tipo === 'wordpress' && p.opciones?.confirmarHuellaDebil !== true) {
    throw new ErrorWolf(
      'catalogo.huella_debil',
      'WordPress solo publica una huella SHA-1 (débil): hay que confirmar la descarga',
      { servicio: 'wordpress', version: p.opciones?.versionWordpress ?? VERSION_WORDPRESS },
    );
  }
  const existentes = await d.sitios();
  const { crear } = await validarCarpetaNueva(
    p.carpeta,
    nombre,
    d.rutas.base,
    existentes.map((s) => ({ carpeta: s.carpeta, dominio: s.dominio })),
  );
  const carpeta = p.carpeta.replace(/[\\/]+$/, '');

  if (existentes.some((s) => s.dominio === dominio || s.alias.includes(dominio))) {
    throw new ErrorWolf(
      'proyectos.dominio_existe',
      `Ya existe un sitio con el dominio ${dominio}`,
      { dominio },
    );
  }

  // PHP: el pedido o la rama 8.x más nueva instalada; debe estar instalado.
  let php: string | undefined;
  if (TIPOS_CON_PHP.includes(gen.tipoSitio)) {
    const instaladas = await d.phpInstaladas();
    if (p.php !== undefined && !RAMA.test(p.php))
      throw invalido('php', 'La versión de PHP no es válida.');
    // Sin versión pedida: la de la plantilla si sigue instalada, o la 8.x más nueva.
    const dePlantilla = plantilla?.php && instaladas.includes(plantilla.php) ? plantilla.php : null;
    php = p.php ?? dePlantilla ?? phpPorDefecto(gen.tipoSitio, null, instaladas) ?? undefined;
    if (!php) {
      throw new ErrorWolf('proyectos.sin_php', 'No hay PHP instalado. Instálelo desde Servicios.');
    }
    if (!instaladas.includes(php)) {
      throw new ErrorWolf(
        'proyectos.php_no_instalado',
        `PHP ${php} no está instalado. Instálelo desde Servicios.`,
        { version: php },
      );
    }
  }
  // Python solo cuenta en FastAPI y debe estar instalado (el venv lo necesita).
  let python: string | undefined;
  if (gen.tipoSitio === 'fastapi') {
    if (p.python !== undefined && !RAMA.test(p.python)) {
      throw invalido('python', 'La versión de Python no es válida.');
    }
    const instaladas = await d.pythonInstaladas();
    if (p.python === undefined) {
      // Sin versión pedida el venv usa el Python por defecto: tiene que haber alguno.
      if (instaladas.length === 0) {
        throw new ErrorWolf(
          'proyectos.sin_python',
          'No hay Python instalado. Instálelo desde Servicios.',
        );
      }
    } else {
      if (!instaladas.some((v) => v === p.python || v.startsWith(`${p.python}.`))) {
        throw new ErrorWolf(
          'proyectos.python_no_instalado',
          `Python ${p.python} no está instalado. Instálelo desde Servicios.`,
          { version: p.python },
        );
      }
      python = p.python;
    }
  }

  // Base: nombre válido, motor coherente y que no exista ya (nunca se reutiliza una con datos).
  // PHP y Python solo viajan si el tipo los usa.
  const { php: _php, python: _py, ...sinVersiones } = p;
  void _php;
  void _py;
  let pedido: PedidoProyecto = {
    ...sinVersiones,
    nombre,
    carpeta,
    ...(php ? { php } : {}),
    ...(python ? { python } : {}),
  };
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
    if (gen.tipoSitio === 'wordpress' && motor !== 'mysql' && motor !== 'mariadb') {
      throw invalido('base', 'WordPress necesita MySQL o MariaDB.');
    }
    if (p.opciones?.pgvector && motor !== 'postgresql') {
      throw invalido('base', 'pgvector necesita PostgreSQL.');
    }
    // El esquema de una plantilla solo entra en un motor de su familia.
    if (
      plantilla?.archivoEsquema &&
      (plantilla.motorBase === 'postgresql') !== (motor === 'postgresql')
    ) {
      throw invalido('base', 'El esquema de la plantilla es de otro motor de base de datos.');
    }
    const objetivo: ObjetivoBd = p.base.instancia ?? motor;
    motorDe(objetivo);
    // Si el motor está apagado, esto falla aquí, antes de crear nada.
    const bases = await d.basesDe(objetivo);
    if (bases.some((b) => mismaBase(motor, b, p.base!.nombre))) {
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
      runtimes: { ...(plantilla?.runtimes ?? {}), ...(python ? { python } : {}) },
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
  // Desde una plantilla no se vuelve a tomar la huella con lo que haya quedado en la carpeta: la
  // receta que cuenta es la del generador y lo que venga en archivos no gana confianza solo.
  if (resultado.estado === 'lista' && !plantilla) await d.confiar(sitio.id).catch(() => undefined);

  const avisos: string[] = [];
  if (plantilla) {
    // Una plantilla no vuelve a correr comandos propios: se dice cuáles se dejaron fuera.
    const omitidos = pasosOmitidosDePlantilla(plantilla);
    if (omitidos.length > 0) {
      avisos.push(
        `Se omitieron ${omitidos.length} pasos de la plantilla que no se repiten solos: ${omitidos
          .map((x) => x.tipo)
          .join(', ')}.`,
      );
    }
    if (resultado.estado === 'lista') {
      if (php && plantilla.extensiones.length > 0 && d.extensionesActivas) {
        try {
          const activas = new Set(await d.extensionesActivas(php));
          const faltan = plantilla.extensiones.filter((x) => !activas.has(x));
          if (faltan.length > 0) {
            avisos.push(
              `Extensiones de PHP de la plantilla que no están activas: ${faltan.join(', ')}.`,
            );
          }
        } catch {
          // Solo es un aviso.
        }
      }
      const hayAjustes = Object.keys(plantilla.phpIni).length > 0 || plantilla.reglasNginx !== null;
      if (hayAjustes && d.aplicarAjustes) {
        try {
          avisos.push(
            ...(await d.aplicarAjustes(sitio.id, {
              phpIni: plantilla.phpIni,
              reglasNginx: plantilla.reglasNginx,
            })),
          );
        } catch (e) {
          avisos.push(e instanceof Error ? e.message : String(e));
        }
      }
    }
  }
  if (resultado.estado === 'lista' && gen.tipoSitio === 'fastapi' && d.iniciarProcesos) {
    try {
      await d.iniciarProcesos(sitio.id);
    } catch (e) {
      avisos.push(e instanceof Error ? e.message : String(e));
    }
  }

  // La base solo cuenta si el paso la creó de verdad (marca), no si ya existía.
  const pasos = d.estadoReceta(sitio.id).pasos;
  const baseCreada =
    pedido.base &&
    pasos.some(
      (x) => x.tipo === 'bd-crear' && x.estado === 'listo' && x.marcas?.includes('base-creada'),
    )
      ? pedido.base.nombre
      : null;
  return {
    sitio,
    receta: resultado,
    creado: { carpeta: true, base: baseCreada, sitio: sitio.id },
    avisos,
  };
}
