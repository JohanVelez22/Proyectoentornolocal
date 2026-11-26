/**
 * D46: quitar (y recrear) las reglas de entrada Allow peligrosas de WolfCore Dev desde el Doctor.
 *
 * Nada corre solo: cada función exige `confirmado === true` (el usuario vio la lista exacta) y la
 * plataforma pide además el UAC. Antes de borrar, la regla completa se guarda en
 * `etc/cortafuegos-quitadas.json` (escritura atómica) para poder recrearla. Una regla solo se
 * toca si, justo antes, sigue siendo de entrada, Allow, con el mismo programa que vio el usuario
 * y ese programa (con uniones y nombres 8.3 resueltos, sin distinguir mayúsculas) sigue bajo la
 * carpeta de datos de WolfCore Dev o es un resto de sus pruebas. Nunca por patrón ni por nombre
 * de programa: siempre por el `Name` exacto.
 */
import { mkdir, readFile, realpath, rename } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  NOMBRE_REGLA_EXACTO,
  reglaExportadaDe,
  reglaRestaurable,
  type ReglaExportada,
} from '../plataforma/firewallCambiosWin';
import { escribirAtomico } from '../sitios/urlbase';
import { segunEscritura, YA_RESUELTO } from './revisiones/comun';
import { origenDeRegla, type Origen } from './revisiones/firewallOrigen';
import type { DepsDoctor, ResultadoReparacion } from './tipos';

/** Registro de lo quitado: `<carpeta de datos>/etc/cortafuegos-quitadas.json`. */
export const ARCHIVO_REGISTRO = 'cortafuegos-quitadas.json';

export interface EntradaRegistro {
  fecha: string;
  nombre: string;
  programa: string;
  perfil: string;
  /** La regla completa, tal como se exportó antes de quitarla. */
  regla: ReglaExportada;
}

/** Una regla que el usuario vio en la lista y que se pide quitar (o recrear). */
export interface Objetivo {
  nombre: string;
  programa: string;
}

export const rutaRegistro = (carpetaDatos: string): string =>
  path.join(carpetaDatos, 'etc', ARCHIVO_REGISTRO);

/**
 * Ruta real: uniones y enlaces resueltos y nombres 8.3 expandidos de lo que exista; lo que falte
 * al final se añade tal cual. null si no se puede resolver; en una ruta que este sistema no
 * considera absoluta (rutas de otro sistema en las pruebas) no hay nada que resolver: se
 * devuelve la misma.
 */
export async function resolverReal(ruta: string): Promise<string | null> {
  if (!path.isAbsolute(ruta)) return ruta;
  let actual = ruta;
  const resto: string[] = [];
  for (;;) {
    try {
      return path.join(await realpath(actual), ...resto);
    } catch (e) {
      const codigo = (e as NodeJS.ErrnoException).code;
      if (codigo !== 'ENOENT' && codigo !== 'ENOTDIR') return null;
      const padre = path.dirname(actual);
      if (padre === actual) return null;
      resto.unshift(path.basename(actual));
      actual = padre;
    }
  }
}

/**
 * De quién es la regla, con uniones y 8.3 resueltos. Lo que cuelga léxicamente de la carpeta de
 * datos pero por una unión sale fuera, o no se puede resolver, es `ajena`. `raiz` es la carpeta
 * bajo la que el script elevado tiene que seguir encontrando el programa.
 */
export async function clasificarReal(
  d: DepsDoctor,
  programa: string,
): Promise<{ origen: Origen; raiz: string | null }> {
  const tmp = d.carpetaTemporal ?? os.tmpdir();
  const lexico = origenDeRegla(programa, d.carpetaDatos, tmp);
  if (lexico === 'ajena') return { origen: 'ajena', raiz: null };
  const [rp, rd, rt] = await Promise.all([
    resolverReal(programa),
    resolverReal(d.carpetaDatos),
    resolverReal(tmp),
  ]);
  if (rp === null || rd === null || rt === null) return { origen: 'ajena', raiz: null };
  if (origenDeRegla(rp, rd, rt) !== lexico) return { origen: 'ajena', raiz: null };
  return { origen: lexico, raiz: lexico === 'propia' ? rd : path.dirname(rp) };
}

const mismaRuta = (a: string, b: string): boolean =>
  a.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase() ===
  b.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase();

/* ───────────── Registro de lo quitado ───────────── */

export async function leerRegistro(
  carpetaDatos: string,
): Promise<{ entradas: EntradaRegistro[]; corrupto: boolean }> {
  let texto: string;
  try {
    texto = await readFile(rutaRegistro(carpetaDatos), 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { entradas: [], corrupto: false };
    return { entradas: [], corrupto: true };
  }
  try {
    const sinBom = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
    const v = JSON.parse(sinBom) as unknown;
    const lista = (v as { reglas?: unknown } | null)?.reglas;
    if (!Array.isArray(lista)) return { entradas: [], corrupto: true };
    const entradas: EntradaRegistro[] = [];
    for (const x of lista as unknown[]) {
      const o = (x ?? {}) as Record<string, unknown>;
      const regla = reglaExportadaDe(o.regla);
      if (!regla || typeof o.fecha !== 'string') return { entradas: [], corrupto: true };
      entradas.push({
        fecha: o.fecha,
        nombre: regla.nombre,
        programa: regla.programa,
        perfil: regla.perfil,
        regla,
      });
    }
    return { entradas, corrupto: false };
  } catch {
    return { entradas: [], corrupto: true };
  }
}

async function escribirRegistro(
  d: DepsDoctor,
  entradas: EntradaRegistro[],
  corrupto: boolean,
): Promise<void> {
  const ruta = rutaRegistro(d.carpetaDatos);
  await mkdir(path.dirname(ruta), { recursive: true });
  // Un registro ilegible no se pisa: se aparta con su fecha y se empieza otro.
  if (corrupto) await rename(ruta, `${ruta}.ilegible-${(d.ahora?.() ?? new Date()).getTime()}`);
  const texto = `${JSON.stringify({ version: 1, reglas: entradas }, null, 2)}\n`;
  await escribirAtomico(ruta, Buffer.from(texto, 'utf8'));
}

/* ───────────── Quitar ───────────── */

interface Elegible {
  regla: ReglaExportada;
  raiz: string;
}

/** Cuenta lo que pasó: de lo pedido, qué se hizo, qué ya no estaba y qué se saltó. */
function resultado(o: {
  pedidas: number;
  hechas: number;
  ausentes: number;
  falloPlataforma: ResultadoReparacion | null;
}): ResultadoReparacion {
  if (o.hechas === 0 && o.ausentes === o.pedidas) return YA_RESUELTO;
  if (o.hechas + o.ausentes === o.pedidas) return { ok: true };
  if (o.hechas > 0) return { ok: true, aviso: 'doctor.firewall_parcial' };
  return o.falloPlataforma ?? { ok: false, codigo: 'doctor.firewall_sin_cambios' };
}

/**
 * Quita las reglas que el usuario vio en la lista. `objetivos` es esa lista (nombre y programa tal
 * como se mostraron). Sin `confirmado: true` no hace nada. Devuelve `doctor.reparacion_cancelada`
 * si el usuario contesta que no al UAC, y avisa (`doctor.firewall_parcial`) si alguna regla no se
 * pudo quitar o cambió desde la lista.
 */
export async function quitarReglasPeligrosas(
  d: DepsDoctor,
  objetivos: Objetivo[],
  o: { confirmado?: boolean },
): Promise<ResultadoReparacion> {
  if (o.confirmado !== true) return { ok: false, codigo: 'doctor.confirmacion_requerida' };
  const nombres = [...new Set(objetivos.map((x) => x.nombre))];
  if (nombres.length === 0) return YA_RESUELTO;
  const antes = await d.plataforma.exportarReglasFirewall(
    nombres.filter((n) => NOMBRE_REGLA_EXACTO.test(n)),
  );
  if (antes === null) return { ok: false, codigo: 'doctor.reparacion_fallida' };

  // Lo que ya no existe no hace falta; lo que cambió desde la lista se salta.
  const elegibles: Elegible[] = [];
  let ausentes = 0;
  for (const obj of objetivos) {
    const actual = antes.find((x) => x.nombre === obj.nombre);
    if (!actual) {
      if (NOMBRE_REGLA_EXACTO.test(obj.nombre)) ausentes++;
      continue;
    }
    if (
      actual.direccion.toLowerCase() !== 'inbound' ||
      actual.accion.toLowerCase() !== 'allow' ||
      !mismaRuta(actual.programa, obj.programa)
    ) {
      continue;
    }
    const c = await clasificarReal(d, actual.programa);
    if (c.origen === 'ajena' || c.raiz === null) continue;
    elegibles.push({ regla: actual, raiz: c.raiz });
  }
  if (elegibles.length === 0) {
    return resultado({ pedidas: objetivos.length, hechas: 0, ausentes, falloPlataforma: null });
  }

  // El registro se guarda ANTES de borrar: si no se puede escribir, no se toca nada.
  const previo = await leerRegistro(d.carpetaDatos);
  const fecha = (d.ahora?.() ?? new Date()).toISOString();
  const nuevas: EntradaRegistro[] = elegibles.map(({ regla }) => ({
    fecha,
    nombre: regla.nombre,
    programa: regla.programa,
    perfil: regla.perfil,
    regla,
  }));
  const nombresNuevos = new Set(nuevas.map((x) => x.nombre));
  try {
    await escribirRegistro(
      d,
      [...previo.entradas.filter((x) => !nombresNuevos.has(x.nombre)), ...nuevas],
      previo.corrupto,
    );
  } catch {
    return { ok: false, codigo: 'doctor.firewall_registro_fallido' };
  }

  const r = await d.plataforma.quitarReglasFirewall(
    elegibles.map(({ regla, raiz }) => ({ nombre: regla.nombre, programa: regla.programa, raiz })),
  );

  // Qué se quitó se comprueba leyendo, no por lo que diga el script.
  const despues = await d.plataforma.exportarReglasFirewall(elegibles.map((x) => x.regla.nombre));
  let hechas: number;
  if (despues === null) {
    hechas = r.ok ? elegibles.length : 0;
  } else {
    const siguen = new Set(despues.map((x) => x.nombre));
    hechas = elegibles.filter((x) => !siguen.has(x.regla.nombre)).length;
    // Lo que sigue en pie no se "quitó": sale del registro.
    const hecho = new Set(
      elegibles.filter((x) => !siguen.has(x.regla.nombre)).map((x) => x.regla.nombre),
    );
    const registro = [
      ...previo.entradas.filter((x) => !nombresNuevos.has(x.nombre)),
      ...nuevas.filter((x) => hecho.has(x.nombre)),
    ];
    try {
      await escribirRegistro(d, registro, false);
    } catch {
      // El registro con de más no hace daño: restaurar salta las reglas que existen.
    }
  }
  return resultado({
    pedidas: objetivos.length,
    hechas,
    ausentes,
    falloPlataforma: r.ok ? null : segunEscritura(r),
  });
}

/* ───────────── Restaurar ───────────── */

/** Las entradas del registro que se podrían recrear ahora (válidas, de WolfCore y aún ausentes). */
export async function restaurables(
  d: DepsDoctor,
): Promise<{ entrada: EntradaRegistro; raiz: string }[]> {
  const { entradas } = await leerRegistro(d.carpetaDatos);
  if (entradas.length === 0) return [];
  const existentes = await d.plataforma.exportarReglasFirewall(
    entradas.map((x) => x.nombre).filter((n) => NOMBRE_REGLA_EXACTO.test(n)),
  );
  if (existentes === null) return [];
  const hay = new Set(existentes.map((x) => x.nombre));
  const res: { entrada: EntradaRegistro; raiz: string }[] = [];
  for (const entrada of entradas) {
    if (hay.has(entrada.nombre) || !reglaRestaurable(entrada.regla)) continue;
    const c = await clasificarReal(d, entrada.regla.programa);
    if (c.origen === 'ajena' || c.raiz === null) continue;
    res.push({ entrada, raiz: c.raiz });
  }
  return res;
}

/**
 * Recrea las reglas que se quitaron (las que el usuario vio en la lista). Misma confirmación y
 * mismo UAC que al quitar. Las que ya existen se saltan; las recreadas salen del registro.
 */
export async function restaurarReglas(
  d: DepsDoctor,
  objetivos: Objetivo[],
  o: { confirmado?: boolean },
): Promise<ResultadoReparacion> {
  if (o.confirmado !== true) return { ok: false, codigo: 'doctor.confirmacion_requerida' };
  const pedidas = new Set(objetivos.map((x) => x.nombre));
  const posibles = (await restaurables(d)).filter(
    (x) =>
      pedidas.has(x.entrada.nombre) &&
      objetivos.some(
        (t) => t.nombre === x.entrada.nombre && mismaRuta(t.programa, x.entrada.programa),
      ),
  );
  if (posibles.length === 0) {
    return { ok: false, codigo: 'doctor.firewall_sin_cambios' };
  }
  const r = await d.plataforma.restaurarReglasFirewall(
    posibles.map(({ entrada, raiz }) => ({ regla: entrada.regla, raiz })),
  );
  const despues = await d.plataforma.exportarReglasFirewall(posibles.map((x) => x.entrada.nombre));
  if (despues === null) return r.ok ? { ok: true } : segunEscritura(r);
  const estan = new Set(despues.map((x) => x.nombre));
  const hechas = posibles.filter((x) => estan.has(x.entrada.nombre));
  if (hechas.length > 0) {
    const previo = await leerRegistro(d.carpetaDatos);
    const quitar = new Set(hechas.map((x) => x.entrada.nombre));
    try {
      await escribirRegistro(
        d,
        previo.entradas.filter((x) => !quitar.has(x.nombre)),
        false,
      );
    } catch {
      // seguir apareciendo en el registro no hace daño: se saltaría por existir
    }
  }
  return resultado({
    pedidas: objetivos.length,
    hechas: hechas.length,
    ausentes: 0,
    falloPlataforma: r.ok ? null : segunEscritura(r),
  });
}
