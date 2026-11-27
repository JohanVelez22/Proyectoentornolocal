import { ErrorWolf } from '../errores';
import type { Ejecutor } from '../plataforma/tipos';
import { MAX_BYTES_ZIP, MAX_ENTRADAS_ZIP } from './zip';

/** Plazo de cada llamada a tar (el `.7z` de Ruby ronda los 100 MB descomprimidos). */
const PLAZO_TAR_MS = 10 * 60 * 1000;

const rechazo = (detalle: string): ErrorWolf =>
  new ErrorWolf('catalogo.paquete_invalido', `El archivo .7z descargado no es seguro: ${detalle}`);

const fallo = (que: string, stderr: string): ErrorWolf =>
  new ErrorWolf('catalogo.extraccion_fallo', `${que}: ${stderr.trim().slice(0, 200)}`);

/** Ruta que sale de la carpeta de destino o que es absoluta (unidad, UNC o raíz). */
function rutaPeligrosa(nombre: string): boolean {
  return (
    nombre.includes('\0') ||
    /^([a-zA-Z]:|[\\/])/.test(nombre) ||
    nombre.split(/[\\/]/).some((t) => t === '..')
  );
}

/** Una línea de `tar -tvf`: permisos, enlaces, dueño, grupo, tamaño y el resto (fecha y nombre). */
const LINEA_DETALLE = /^(\S)\S*\s+\d+\s+\S+\s+\S+\s+(\d+)\s/;

/**
 * Extrae un `.7z` con el bsdtar del sistema (`rutaTar`), sin shell. Antes de extraer lo lista dos
 * veces y rechaza (`catalogo.paquete_invalido`) rutas absolutas o con `..`, enlaces simbólicos o
 * duros, demasiadas entradas o más bytes de los permitidos: la misma defensa que `extraerZip`.
 * Falla cerrado: si el listado detallado no se puede interpretar entero (alguna línea no encaja
 * o no hay tantas líneas como nombres), no se extrae. Nunca ejecuta nada de lo que hay dentro.
 */
export async function extraer7z(
  exec: Ejecutor,
  rutaTar: string,
  archivo: string,
  destino: string,
): Promise<void> {
  const nombres = await exec(rutaTar, ['-tf', archivo], { timeoutMs: PLAZO_TAR_MS });
  if (nombres.codigo !== 0) throw fallo('No se pudo leer el paquete .7z', nombres.stderr);
  const lista = nombres.stdout.split(/\r?\n/).filter((l) => l !== '');
  if (lista.length === 0) throw rechazo('está vacío');
  if (lista.length > MAX_ENTRADAS_ZIP) throw rechazo('tiene demasiadas entradas');
  const mala = lista.find(rutaPeligrosa);
  if (mala !== undefined) throw rechazo(`la ruta "${mala.slice(0, 80)}" sale de la carpeta`);

  const detalle = await exec(rutaTar, ['-tvf', archivo], { timeoutMs: PLAZO_TAR_MS });
  if (detalle.codigo !== 0) throw fallo('No se pudo leer el paquete .7z', detalle.stderr);
  const lineas = detalle.stdout.split(/\r?\n/).filter((l) => l !== '');
  let bytes = 0;
  for (const l of lineas) {
    const m = LINEA_DETALLE.exec(l);
    // Una línea que no se entiende podría esconder un enlace o un tamaño: no se extrae.
    if (!m) throw rechazo('no se pudo interpretar su listado');
    // `l` enlace simbólico, `h` enlace duro: el paquete de un runtime no los necesita.
    if (m[1] === 'l' || m[1] === 'h') throw rechazo('trae enlaces');
    bytes += Number(m[2]);
  }
  if (lineas.length !== lista.length) throw rechazo('su listado no coincide con sus nombres');
  if (bytes > MAX_BYTES_ZIP) throw rechazo('descomprimido pesa demasiado');

  const r = await exec(rutaTar, ['-xf', archivo, '-C', destino], { timeoutMs: PLAZO_TAR_MS });
  if (r.codigo !== 0) throw fallo('No se pudo extraer el paquete .7z', r.stderr);
}
