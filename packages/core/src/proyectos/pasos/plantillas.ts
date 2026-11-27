import { lstat, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { motorDe } from '../../bd/basesDeDatos';
import { ErrorWolf } from '../../errores';
import type { ImplementacionPaso } from '../pasos';
import { USO_VALIDO, validarIdPlantilla } from '../plantillas';
import { sanear } from '../recetas';
import { argsDe, comprobarSenal, nombreBase, objetivoDe, texto, type DepsPasos } from './comun';
import { carpetaVacia } from './crearDesdeComposer';

/** Identificador de la creación que dejó la copia verificada (si ya no está, se verifica de nuevo). */
const usoDe = (ctx: Parameters<ImplementacionPaso>[0]): string | undefined => {
  const u = argsDe(ctx).uso;
  return typeof u === 'string' && USO_VALIDO.test(u) ? u : undefined;
};

function plantillasDe(d: DepsPasos): NonNullable<DepsPasos['plantillas']> {
  if (!d.plantillas) throw new Error('Las plantillas de proyecto no están disponibles.');
  return d.plantillas;
}

/**
 * Carpetas de ejecución que la plantilla deja fuera (`EXCLUSIONES_PLANTILLA`) y que el framework
 * exige que existan: sin `bootstrap/cache`, `artisan package:discover` (el `post-autoload-dump` de
 * `composer install`) falla con «must be present and writable». Solo se crean carpetas vacías, bajo
 * la del proyecto, y solo si el proyecto es de ese framework (por su archivo de arranque).
 */
const CARPETAS_DE_EJECUCION: readonly { marca: string; carpetas: readonly string[] }[] = [
  {
    marca: 'artisan',
    carpetas: [
      'bootstrap/cache',
      'storage/app/public',
      'storage/framework/cache/data',
      'storage/framework/sessions',
      'storage/framework/testing',
      'storage/framework/views',
      'storage/logs',
    ],
  },
  {
    marca: 'spark',
    carpetas: ['writable/cache', 'writable/logs', 'writable/session', 'writable/uploads'],
  },
];

/**
 * Crea `relativa` bajo `carpeta` tramo a tramo. Cada tramo que ya existe se mira con `lstat`: si no
 * es una carpeta real (un archivo, un enlace o una unión que saldría de la carpeta del proyecto) no
 * se entra ni se crea nada debajo. Devuelve el tramo problemático, o null si quedó creada.
 */
async function crearTramos(carpeta: string, relativa: string): Promise<string | null> {
  let actual = carpeta;
  let recorrido = '';
  for (const tramo of relativa.split('/')) {
    actual = path.join(actual, tramo);
    recorrido = recorrido ? `${recorrido}/${tramo}` : tramo;
    const info = await lstat(actual).catch(() => null);
    if (info) {
      if (!info.isDirectory()) return recorrido;
      continue;
    }
    try {
      await mkdir(actual);
    } catch {
      return recorrido;
    }
  }
  return null;
}

async function crearCarpetasDeEjecucion(
  carpeta: string,
  avisar: (texto: string) => void,
): Promise<void> {
  for (const { marca, carpetas } of CARPETAS_DE_EJECUCION) {
    const hay = await stat(path.join(carpeta, marca)).then(
      (s) => s.isFile(),
      () => false,
    );
    if (!hay) continue;
    for (const c of carpetas) {
      const problema = await crearTramos(carpeta, c);
      if (problema !== null) {
        avisar(
          `No se creó la carpeta ${c}: ${problema} no es una carpeta normal o no se pudo crear.`,
        );
      }
    }
  }
}

/**
 * Copia los archivos de la plantilla (`args.plantilla`, un id) a la carpeta del proyecto, que
 * debe estar vacía. Nada se sobrescribe y una plantilla dañada no escribe nada.
 */
export function pasoRestaurarPlantillaArchivos(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const id = validarIdPlantilla(argsDe(ctx).plantilla);
    if (!(await carpetaVacia(ctx.carpeta))) {
      throw new ErrorWolf(
        'proyectos.carpeta_no_vacia',
        'La carpeta ya tiene archivos: no se copia la plantilla encima.',
      );
    }
    const r = await plantillasDe(d).restaurarArchivos(id, ctx.carpeta, usoDe(ctx));
    comprobarSenal(ctx);
    await crearCarpetasDeEjecucion(ctx.carpeta, (t) => ctx.linea(sanear(t)));
    ctx.linea(`Se copiaron ${r.archivos} archivos de la plantilla.`);
  };
}

/**
 * Crea las tablas de la plantilla (solo estructura, sin filas) en la base nueva del proyecto. Nunca
 * sobre una base con tablas: la base la creó el paso `bd-crear` (nueva) unos pasos antes.
 */
export function pasoRestaurarEsquemaPlantilla(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const id = validarIdPlantilla(args.plantilla);
    const objetivo = await objetivoDe(ctx, d);
    if (!objetivo) throw new Error('El proyecto no indica una base de datos para el esquema.');
    const motor = motorDe(objetivo);
    const base = nombreBase(ctx.sitio, args);
    const esquema = await plantillasDe(d).rutaEsquema(id, usoDe(ctx));
    // Un volcado de PostgreSQL no entra en MySQL ni al revés (MySQL y MariaDB sí se entienden).
    if ((esquema.motor === 'postgresql') !== (motor === 'postgresql')) {
      throw new ErrorWolf(
        'proyectos.argumento_invalido',
        'El esquema de la plantilla es de otro motor de base de datos.',
        { campo: 'base' },
      );
    }
    if (motor !== 'mongodb' && (await d.bd.tieneTablas(objetivo, base))) {
      throw new ErrorWolf(
        'proyectos.base_existe',
        `La base ${base} ya tiene tablas: el esquema de la plantilla no se restaura encima.`,
        { nombre: base },
      );
    }
    comprobarSenal(ctx);
    if (!d.restaurarEsquema) throw new Error('La restauración de esquemas no está disponible.');
    ctx.linea(sanear(`Creando las tablas de la plantilla en ${base}…`));
    // Con los privilegios mínimos y todo o nada (usuario temporal limitado a la base).
    const r = await d.restaurarEsquema(objetivo, esquema.ruta, base, {
      // El origen lo dice Plantillas (registro del equipo), nunca los args del paso.
      origen: esquema.origen,
    });
    for (const a of r.advertencias) ctx.linea(sanear(a));
    // Con usuario propio, la base y sus tablas pasan a él (PostgreSQL las deja en un rol sin login).
    const usuario = texto(args.usuario);
    if (usuario && d.entregarBase) {
      comprobarSenal(ctx);
      await d.entregarBase(objetivo, base, usuario);
    }
  };
}
