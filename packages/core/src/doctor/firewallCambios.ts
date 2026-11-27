/**
 * D46: quitar (y recrear) las reglas de entrada Allow peligrosas de WolfCore Dev desde el Doctor.
 *
 * Nada corre solo: cada función exige `confirmado === true` (el usuario vio la lista exacta y
 * marcó lo que quiere) y la plataforma pide además el UAC. Antes de borrar, la regla completa se
 * apunta en `etc/cortafuegos-quitadas.json` (escritura atómica) PARA MOSTRAR. De ahí NO se
 * recrea nada: ese archivo lo puede editar el usuario o un programa suyo. Lo que permite recrear
 * una regla es la copia que guarda el propio script elevado en una carpeta que solo escriben
 * Administradores y SYSTEM (`leerAlmacenFirewall`), y solo si su huella es la que se mostró.
 *
 * Una regla solo se toca si, justo antes, sigue siendo de entrada, Allow, con el mismo programa
 * que vio el usuario y ese programa (con uniones y nombres 8.3 resueltos, sin distinguir
 * mayúsculas) sigue bajo la carpeta de datos de WolfCore Dev o es un resto de sus pruebas.
 * Nunca por patrón ni por nombre de programa: siempre por el `Name` exacto.
 */
import { mkdir, readFile, rename } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  DETALLE_ALMACEN_INSEGURO,
  idRegistro,
  NOMBRE_REGLA_EXACTO,
  reglaExportadaDe,
  reglaRestaurable,
  type ReglaExportada,
  type RegistroProtegido,
  type TipoRaiz,
} from '../plataforma/firewallCambiosWin';
import { resolverReal } from '../plataforma/rutaReal';
import { escribirAtomico } from '../sitios/urlbase';
import { segunEscritura, YA_RESUELTO } from './revisiones/comun';
import { origenDeRegla, raizDePrueba, type Origen } from './revisiones/firewallOrigen';
import type { DepsDoctor, ResultadoReparacion } from './tipos';

/** Registro de lo quitado (solo para mostrar): `<carpeta de datos>/etc/cortafuegos-quitadas.json`. */
export const ARCHIVO_REGISTRO = 'cortafuegos-quitadas.json';

export interface EntradaRegistro {
  fecha: string;
  nombre: string;
  programa: string;
  perfil: string;
  /** La regla completa, tal como se exportó antes de quitarla. */
  regla: ReglaExportada;
}

/** Una regla que el usuario vio en la lista y que se pide quitar. */
export interface Objetivo {
  nombre: string;
  programa: string;
}

/** Una copia protegida que el usuario vio en la lista y que se pide recrear. */
export interface ObjetivoRestaurar {
  id: string;
  /** Huella de la copia tal como se mostró. */
  sha256: string;
}

export const rutaRegistro = (carpetaDatos: string): string =>
  path.join(carpetaDatos, 'etc', ARCHIVO_REGISTRO);

export interface Clasificacion {
  origen: Origen;
  raiz: string | null;
  tipo: TipoRaiz | null;
  temporal: string | null;
}

const AJENA: Clasificacion = { origen: 'ajena', raiz: null, tipo: null, temporal: null };

/**
 * De quién es la regla, con uniones y 8.3 resueltos. Lo que cuelga léxicamente de la carpeta de
 * datos pero por una unión sale fuera, o no se puede resolver, es `ajena`. `raiz` es la carpeta
 * bajo la que el script elevado tiene que seguir encontrando el programa: la carpeta de datos, o
 * la carpeta `pel-*` del resto de pruebas bajo la carpeta temporal.
 */
export async function clasificarReal(d: DepsDoctor, programa: string): Promise<Clasificacion> {
  const tmp = d.carpetaTemporal ?? os.tmpdir();
  const [rp, rd, rt] = await Promise.all([
    resolverReal(programa),
    resolverReal(d.carpetaDatos),
    resolverReal(tmp),
  ]);
  if (rp === null || rd === null || rt === null) return AJENA;
  const origen = origenDeRegla(rp, rd, rt);
  if (origen === 'propia') return { origen, raiz: rd, tipo: 'propia', temporal: rt };
  if (origen === 'prueba') {
    const raiz = raizDePrueba(rp, rt);
    return raiz === null ? AJENA : { origen, raiz, tipo: 'prueba', temporal: rt };
  }
  return AJENA;
}

const mismaRuta = (a: string, b: string): boolean =>
  a.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase() ===
  b.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase();

/* ───────────── Registro de lo quitado (solo para mostrar) ───────────── */

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

/* ───────────── Resultado ───────────── */

/** Traduce el fallo de la plataforma (UAC cancelado, plazo, carpeta protegida no fiable…). */
function fallo(r: { ok: false; motivo: string; detalle?: string }): ResultadoReparacion {
  if (r.detalle === DETALLE_ALMACEN_INSEGURO) {
    return { ok: false, codigo: 'doctor.firewall_almacen_inseguro' };
  }
  return segunEscritura(r);
}

/**
 * Cuenta lo que pasó: de lo pedido, qué se hizo, qué ya no estaba y qué se saltó. `hechas` null
 * es "no se pudo comprobar qué quedó": nunca se da por hecho.
 */
function resultado(o: {
  pedidas: number;
  hechas: number | null;
  ausentes: number;
  plataforma: { ok: true } | { ok: false; motivo: string; detalle?: string };
}): ResultadoReparacion {
  if (o.hechas === null) {
    return o.plataforma.ok ? { ok: true, aviso: 'doctor.firewall_parcial' } : fallo(o.plataforma);
  }
  if (o.hechas === 0 && o.ausentes === o.pedidas) return YA_RESUELTO;
  if (o.hechas + o.ausentes === o.pedidas) return { ok: true };
  if (o.hechas > 0) return { ok: true, aviso: 'doctor.firewall_parcial' };
  return o.plataforma.ok
    ? { ok: false, codigo: 'doctor.firewall_sin_cambios' }
    : fallo(o.plataforma);
}

/* ───────────── Quitar ───────────── */

interface Elegible {
  regla: ReglaExportada;
  c: Clasificacion;
}

/**
 * Quita las reglas que el usuario vio en la lista y dejó marcadas. `objetivos` es esa lista
 * (nombre y programa tal como se mostraron); `seleccion` son los nombres marcados (todos si no
 * se indica). Sin `confirmado: true` no hace nada. Devuelve `doctor.reparacion_cancelada` si el
 * usuario contesta que no al UAC y avisa (`doctor.firewall_parcial`) si alguna regla no se pudo
 * quitar o cambió desde la lista.
 */
export async function quitarReglasPeligrosas(
  d: DepsDoctor,
  objetivos: Objetivo[],
  o: { confirmado?: boolean; seleccion?: string[] },
): Promise<ResultadoReparacion> {
  if (o.confirmado !== true) return { ok: false, codigo: 'doctor.confirmacion_requerida' };
  const marcadas = o.seleccion === undefined ? null : new Set(o.seleccion);
  const pedidos = marcadas ? objetivos.filter((x) => marcadas.has(x.nombre)) : objetivos;
  if (pedidos.length === 0) return { ok: false, codigo: 'doctor.firewall_sin_cambios' };
  const nombres = [...new Set(pedidos.map((x) => x.nombre))];
  const antes = await d.plataforma.exportarReglasFirewall(
    nombres.filter((n) => NOMBRE_REGLA_EXACTO.test(n)),
  );
  if (antes === null) return { ok: false, codigo: 'doctor.reparacion_fallida' };

  // Lo que ya no existe no hace falta; lo que cambió desde la lista se salta.
  const elegibles: Elegible[] = [];
  let ausentes = 0;
  for (const obj of pedidos) {
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
    if (c.origen === 'ajena' || c.raiz === null || c.tipo === null || c.temporal === null) continue;
    elegibles.push({ regla: actual, c });
  }
  if (elegibles.length === 0) {
    return resultado({
      pedidas: pedidos.length,
      hechas: 0,
      ausentes,
      plataforma: { ok: true },
    });
  }

  // El registro (para mostrar) se guarda ANTES de borrar: si no se puede escribir, no se toca nada.
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
  const otras = previo.entradas.filter((x) => !nombresNuevos.has(x.nombre));
  try {
    await escribirRegistro(d, [...otras, ...nuevas], previo.corrupto);
  } catch {
    return { ok: false, codigo: 'doctor.firewall_registro_fallido' };
  }

  const r = await d.plataforma.quitarReglasFirewall(
    elegibles.map(({ regla, c }) => ({
      id: idRegistro(regla.nombre),
      nombre: regla.nombre,
      programa: regla.programa,
      raiz: c.raiz!,
      tipo: c.tipo!,
      temporal: c.temporal!,
    })),
  );

  // Qué se quitó se comprueba leyendo, no por lo que diga el script.
  const despues = await d.plataforma.exportarReglasFirewall(elegibles.map((x) => x.regla.nombre));
  let hechas: number | null = null;
  if (despues !== null) {
    const siguen = new Set(despues.map((x) => x.nombre));
    const quitadas = new Set(
      elegibles.filter((x) => !siguen.has(x.regla.nombre)).map((x) => x.regla.nombre),
    );
    hechas = quitadas.size;
    // Con el UAC cancelado, o leyendo bien lo que quedó tras un resultado correcto, el registro
    // solo guarda lo realmente quitado. Tras un plazo vencido o un error, se deja como está:
    // quitar de más del registro perdería la pista de algo que quizá sí se quitó.
    if (r.ok || (!r.ok && r.motivo === 'cancelado')) {
      try {
        await escribirRegistro(
          d,
          [...otras, ...nuevas.filter((x) => quitadas.has(x.nombre))],
          false,
        );
      } catch {
        // El registro con de más no hace daño: solo se muestra.
      }
    }
  }
  return resultado({ pedidas: pedidos.length, hechas, ausentes, plataforma: r });
}

/* ───────────── Restaurar ───────────── */

export interface Restaurable {
  registro: RegistroProtegido;
  c: Clasificacion;
}

/**
 * Las copias protegidas que se podrían recrear ahora: válidas, de WolfCore Dev (con uniones y 8.3
 * resueltos) y cuya regla ya no existe. Lo único que cuenta es la copia protegida de la
 * plataforma; el JSON de `etc/` no interviene.
 */
export async function restaurables(d: DepsDoctor): Promise<Restaurable[]> {
  const guardadas = await d.plataforma.leerAlmacenFirewall();
  if (!guardadas || guardadas.length === 0) return [];
  const existentes = await d.plataforma.exportarReglasFirewall(
    guardadas.map((x) => x.regla.nombre).filter((n) => NOMBRE_REGLA_EXACTO.test(n)),
  );
  if (existentes === null) return [];
  const hay = new Set(existentes.map((x) => x.nombre));
  const res: Restaurable[] = [];
  for (const registro of guardadas) {
    if (hay.has(registro.regla.nombre) || !reglaRestaurable(registro.regla)) continue;
    const c = await clasificarReal(d, registro.regla.programa);
    if (c.origen === 'ajena' || c.raiz === null) continue;
    res.push({ registro, c });
  }
  return res;
}

/**
 * Recrea las reglas que se quitaron y que el usuario vio (con todos sus campos) y dejó marcadas.
 * Misma confirmación y mismo UAC que al quitar. Si la copia protegida ya no es la que se mostró
 * (huella distinta), no se crea NADA.
 */
export async function restaurarReglas(
  d: DepsDoctor,
  objetivos: ObjetivoRestaurar[],
  o: { confirmado?: boolean; seleccion?: string[] },
): Promise<ResultadoReparacion> {
  if (o.confirmado !== true) return { ok: false, codigo: 'doctor.confirmacion_requerida' };
  const marcadas = o.seleccion === undefined ? null : new Set(o.seleccion);
  const pedidos = marcadas ? objetivos.filter((x) => marcadas.has(x.id)) : objetivos;
  if (pedidos.length === 0) return { ok: false, codigo: 'doctor.firewall_sin_cambios' };
  const ahora = await restaurables(d);
  const posibles: Restaurable[] = [];
  for (const obj of pedidos) {
    const actual = ahora.find((x) => x.registro.id === obj.id);
    if (!actual) continue;
    if (actual.registro.sha256 !== obj.sha256) {
      // Lo protegido ya no es lo que se mostró: no se toca nada.
      return { ok: false, codigo: 'doctor.firewall_almacen_inseguro' };
    }
    posibles.push(actual);
  }
  if (posibles.length === 0) return { ok: false, codigo: 'doctor.firewall_sin_cambios' };
  const r = await d.plataforma.restaurarReglasFirewall(
    posibles.map(({ registro, c }) => ({
      id: registro.id,
      sha256: registro.sha256,
      raiz: c.raiz!,
      tipo: c.tipo!,
      temporal: c.temporal!,
    })),
  );
  const despues = await d.plataforma.exportarReglasFirewall(
    posibles.map((x) => x.registro.regla.nombre),
  );
  let hechas: number | null = null;
  if (despues !== null) {
    const estan = new Set(despues.map((x) => x.nombre));
    const creadas = posibles.filter((x) => estan.has(x.registro.regla.nombre));
    hechas = creadas.length;
    if (creadas.length > 0) {
      // El registro de `etc/` (solo para mostrar) deja de listar lo que volvió.
      const previo = await leerRegistro(d.carpetaDatos);
      const volvieron = new Set(creadas.map((x) => x.registro.regla.nombre));
      try {
        await escribirRegistro(
          d,
          previo.entradas.filter((x) => !volvieron.has(x.nombre)),
          false,
        );
      } catch {
        // seguir apareciendo ahí no hace daño
      }
    }
  }
  return resultado({ pedidas: pedidos.length, hechas, ausentes: 0, plataforma: r });
}
