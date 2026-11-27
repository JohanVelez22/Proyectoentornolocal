import { stat } from 'node:fs/promises';
import path from 'node:path';
import { NOMBRE_SERVICIO } from '../../servicios/definicion';
import type { ImplementacionPaso } from '../pasos';
import { sanear } from '../recetas';
import {
  argsDe,
  comprobarSenal,
  nombreBase,
  objetivoDe,
  texto,
  usuarioDelPaso,
  type DepsPasos,
} from './comun';
import { usuarioDeProyecto } from '../../bd/usuarioProyecto';
import { errorUsuarioEnUso } from '../../bd/clienteMysql';
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
 * Opciones del usuario propio para `crear`: con su clave y, solo si es el `wolf_u_` de ESTA base,
 * permiso para cambiar la de un usuario que quedó de un proyecto anterior. Si otro proyecto ya
 * lo usa, nunca se cambia su clave: falla con `bd.usuario_en_uso`.
 */
async function opcionesUsuario(
  ctx: Parameters<ImplementacionPaso>[0],
  d: DepsPasos,
  base: string,
  propio: { usuario: string; clave: string } | null,
) {
  if (!propio) return {};
  if (await (d.usuarioBdEnUso?.(propio.usuario, ctx.sitio.id) ?? false)) {
    throw errorUsuarioEnUso(propio.usuario);
  }
  return {
    usuario: propio.usuario,
    clave: propio.clave,
    ...(propio.usuario === usuarioDeProyecto(base) ? { cambiarClave: true } : {}),
  };
}

/**
 * Crea la base del proyecto (y su usuario si hay `args.usuario`). Con `args.nueva` (generadores)
 * la base debe ser nueva: si ya existe falla con `proyectos.base_existe` (el motor la crea sin
 * `IF NOT EXISTS`, así que ni una creación simultánea la comparte). La marca `base-creada` queda
 * justo después del `CREATE DATABASE`: si luego falla el usuario o sus permisos, el reintento
 * retoma la base y completa el usuario. Una base que ya existía (sin `nueva`) no se modifica,
 * salvo dar acceso al usuario propio que el `.env` va a usar.
 */
export function pasoBdCrear(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const { objetivo, motor } = await objetivoObligatorio(ctx, d);
    const base = nombreBase(ctx.sitio, args);
    const propio = usuarioDelPaso(ctx);
    const existentes = await d.bd.listar(objetivo);
    const nueva = args.nueva === true;
    const servidor = NOMBRE_SERVICIO[motor];
    if (existentes.some((b) => mismaBase(motor, b.nombre, base))) {
      const propia = nueva && ctx.marcas?.includes('base-creada') === true;
      if (nueva && !propia) {
        throw new ErrorWolf('proyectos.base_existe', `La base ${base} ya existe.`, {
          nombre: base,
        });
      }
      if (propia) ctx.marcar?.('base-creada');
      if (!propio) {
        ctx.linea(
          propia
            ? `La base ${base} la creó este proyecto antes; se sigue con ella.`
            : `La base ${base} ya existe en ${servidor}; no se modificó.`,
        );
        return;
      }
      // La base ya está (la creó un intento anterior o ya existía): el usuario que va a usar el
      // .env tiene que existir y tener sus permisos, o el proyecto quedaría sin conexión.
      comprobarSenal(ctx);
      await d.bd.crear(objetivo, base, {
        ...(await opcionesUsuario(ctx, d, base, propio)),
        // La creó este proyecto: se cierra a PUBLIC como si naciera ahora (si ya existía, no).
        ...(propia ? { aislar: true } : {}),
      });
      ctx.linea(
        `La base ${base} ya existía en ${servidor}; se le dio acceso al usuario ${propio.usuario}.`,
      );
      return;
    }
    comprobarSenal(ctx);
    const opts = {
      ...(await opcionesUsuario(ctx, d, base, propio)),
      ...(nueva ? { nueva, alCrearBase: () => ctx.marcar?.('base-creada') } : {}),
    };
    await d.bd.crear(objetivo, base, opts);
    if (nueva) ctx.marcar?.('base-creada');
    ctx.linea(
      `Se creó la base ${base} en ${servidor}` +
        (propio ? ` con el usuario ${propio.usuario}.` : '.'),
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
