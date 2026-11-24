import { motorDe } from '../../bd/basesDeDatos';
import { ErrorWolf } from '../../errores';
import type { ImplementacionPaso } from '../pasos';
import { validarIdPlantilla } from '../plantillas';
import { sanear } from '../recetas';
import { argsDe, comprobarSenal, nombreBase, objetivoDe, type DepsPasos } from './comun';
import { carpetaVacia } from './crearDesdeComposer';

function plantillasDe(d: DepsPasos): NonNullable<DepsPasos['plantillas']> {
  if (!d.plantillas) throw new Error('Las plantillas de proyecto no están disponibles.');
  return d.plantillas;
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
    const r = await plantillasDe(d).restaurarArchivos(id, ctx.carpeta);
    comprobarSenal(ctx);
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
    const esquema = await plantillasDe(d).rutaEsquema(id);
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
    ctx.linea(sanear(`Creando las tablas de la plantilla en ${base}…`));
    const r = await d.restaurar(objetivo, esquema.ruta, base, { confirmarSobrescribir: false });
    for (const a of r.advertencias) ctx.linea(sanear(a));
  };
}
