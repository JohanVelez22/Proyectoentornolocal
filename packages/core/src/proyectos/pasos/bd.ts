import { stat } from 'node:fs/promises';
import path from 'node:path';
import { NOMBRE_SERVICIO } from '../../servicios/definicion';
import type { ImplementacionPaso } from '../pasos';
import { sanear } from '../recetas';
import { argsDe, comprobarSenal, motorDe, nombreBase, texto, type DepsPasos } from './comun';

async function motorObligatorio(...a: Parameters<typeof motorDe>) {
  const motor = await motorDe(...a);
  if (!motor) {
    throw new Error('El proyecto no indica un motor de base de datos: elija uno en el paso.');
  }
  return motor;
}

/** Crea la base del proyecto (y su usuario si hay `args.usuario`); si ya existe, nada. */
export function pasoBdCrear(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const motor = await motorObligatorio(ctx, d);
    const base = nombreBase(ctx.sitio, args);
    const existentes = await d.bd.listar(motor);
    if (existentes.some((b) => b.nombre === base)) {
      ctx.linea(`La base ${base} ya existe en ${NOMBRE_SERVICIO[motor]}; no se modificó.`);
      return;
    }
    comprobarSenal(ctx);
    const usuario = texto(args.usuario);
    const clave = texto(args.clave);
    const opts = usuario ? { usuario, ...(clave ? { clave } : {}) } : {};
    await d.bd.crear(motor, base, opts);
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
    const motor = await motorObligatorio(ctx, d);
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
    await d.bd.activarVector(base);
    ctx.linea(`pgvector quedó activo en la base ${base}.`);
  };
}
