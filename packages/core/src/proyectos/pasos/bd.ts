import { stat } from 'node:fs/promises';
import path from 'node:path';
import { NOMBRE_SERVICIO } from '../../servicios/definicion';
import type { ImplementacionPaso } from '../pasos';
import { sanear } from '../recetas';
import { argsDe, comprobarSenal, nombreBase, objetivoDe, texto, type DepsPasos } from './comun';
import { motorDe } from '../../bd/basesDeDatos';
import { ErrorWolf } from '../../errores';

/** MySQL y MariaDB distinguen mayúsculas según el sistema: se comparan sin distinguirlas. */
export const mismaBase = (motor: string, a: string, b: string): boolean =>
  motor === 'mysql' || motor === 'mariadb' ? a.toLowerCase() === b.toLowerCase() : a === b;

async function objetivoObligatorio(...a: Parameters<typeof objetivoDe>) {
  const objetivo = await objetivoDe(...a);
  if (!objetivo) {
    throw new Error('El proyecto no indica un motor de base de datos: elija uno en el paso.');
  }
  return { objetivo, motor: motorDe(objetivo) };
}

/**
 * Crea la base del proyecto (y su usuario si hay `args.usuario`); si ya existe, nada. Con
 * `args.nueva` (generadores) la base debe ser nueva: si ya existe falla con `proyectos.base_existe`
 * (el motor la crea sin `IF NOT EXISTS`, así que ni una creación simultánea la comparte) y
 * solo entonces deja la marca `base-creada`.
 */
export function pasoBdCrear(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const { objetivo, motor } = await objetivoObligatorio(ctx, d);
    const base = nombreBase(ctx.sitio, args);
    const existentes = await d.bd.listar(objetivo);
    const nueva = args.nueva === true;
    if (existentes.some((b) => mismaBase(motor, b.nombre, base))) {
      if (nueva && ctx.marcas?.includes('base-creada')) {
        // La creó este mismo proyecto en un intento anterior: se sigue con ella.
        ctx.linea(`La base ${base} la creó este proyecto antes; se sigue con ella.`);
        ctx.marcar?.('base-creada');
        return;
      }
      if (nueva) {
        throw new ErrorWolf('proyectos.base_existe', `La base ${base} ya existe.`, {
          nombre: base,
        });
      }
      ctx.linea(`La base ${base} ya existe en ${NOMBRE_SERVICIO[motor]}; no se modificó.`);
      return;
    }
    comprobarSenal(ctx);
    const usuario = texto(args.usuario);
    const clave = texto(args.clave);
    const opts = {
      ...(usuario ? { usuario, ...(clave ? { clave } : {}) } : {}),
      ...(nueva ? { nueva } : {}),
    };
    await d.bd.crear(objetivo, base, opts);
    if (nueva) ctx.marcar?.('base-creada');
    ctx.linea(
      `Se creó la base ${base} en ${NOMBRE_SERVICIO[motor]}` +
        (usuario ? ` con el usuario ${usuario}.` : '.'),
    );
  };
}

/**
 * Restaura `args.archivo` (elegido en un diálogo: la ruta la valida IPC) en la base del proyecto.
 * Si la base ya tiene tablas exige `args.confirmarSobrescribir`.
 */
export function pasoBdRestaurar(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const archivo = texto(args.archivo);
    if (!archivo || !path.isAbsolute(archivo)) {
      throw new Error('Elija el archivo de respaldo desde el diálogo.');
    }
    let info;
    try {
      info = await stat(archivo);
    } catch {
      throw new Error(`No se encontró el archivo ${archivo}.`);
    }
    if (!info.isFile()) throw new Error('Elija un archivo de respaldo, no una carpeta.');
    const { motor } = await objetivoObligatorio(ctx, d);
    const base = nombreBase(ctx.sitio, args);
    const confirmar = args.confirmarSobrescribir === true;
    if (!confirmar && motor !== 'mongodb' && (await d.bd.tieneTablas(motor, base))) {
      throw new Error(
        `La base ${base} ya tiene tablas: confirme que quiere sobrescribirla para restaurar el respaldo.`,
      );
    }
    comprobarSenal(ctx);
    ctx.linea(sanear(`Restaurando ${path.basename(archivo)} en ${base}…`));
    const r = await d.restaurar(motor, archivo, base, { confirmarSobrescribir: confirmar });
    for (const a of r.advertencias) ctx.linea(sanear(a));
    if (r.respaldoPrevio) {
      ctx.linea(sanear(`Antes se guardó una copia de la base en ${r.respaldoPrevio}.`));
    }
  };
}

/** Activa pgvector en la base del proyecto (PostgreSQL). */
export function pasoPgvectorActivar(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const base = nombreBase(ctx.sitio, argsDe(ctx));
    const objetivo = await objetivoDe(ctx, d);
    await d.bd.activarVector(
      base,
      objetivo && motorDe(objetivo) === 'postgresql' ? objetivo : undefined,
    );
    ctx.linea(`pgvector quedó activo en la base ${base}.`);
  };
}
