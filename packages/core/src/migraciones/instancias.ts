import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AlmacenCredenciales } from '../almacen';
import type { RangoPuertos } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { selloFecha } from '../servicios/actualizar';
import { MARCA_INICIALIZADO, puertosFijos, type DefServicio } from '../servicios/definicion';
import { claveDe, idInstancia, multiInstancia, puertosConfigurados } from '../servicios/instancias';
import { compararVersiones } from '../servicios/nginx';
import {
  claveInstanciaValida,
  ConfigSchema,
  type ArchivoCredenciales,
  type Config,
  type IdInstancia,
  type InstanciaConfig,
} from '../tipos';

export interface DepsMigracionInstancias {
  rutas: Rutas;
  credenciales: Pick<AlmacenCredenciales, 'todas' | 'importar'>;
  /** Renombra el registro del proceso vivo (`mysql` → `mysql@8.4`) para readoptarlo. */
  supervisor: { renombrarRegistro(viejo: string, nuevo: string): void };
  definiciones: () => readonly DefServicio[];
  /** Versiones instaladas de un servicio (bin/<servicio>/<versión>). */
  instalados: (servicio: string) => Promise<string[]>;
  /** Rangos reservados por el sistema (los puertos de las instancias nuevas los evitan). */
  rangosReservados?: () => Promise<RangoPuertos[]>;
  ahora?: () => Date;
}

type Plan = {
  servicio: DefServicio['id'];
  instancias: Record<string, InstanciaConfig>;
  predeterminada: string | null;
  /** Proceso vivo que pasa a llamarse como la instancia predeterminada. */
  renombrar: { viejo: string; nuevo: string } | null;
};

const esObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/** Carpetas `data/<servicio>/<clave>` inicializadas por WolfCore Dev. */
async function carpetasInicializadas(rutas: Rutas, servicio: string): Promise<string[]> {
  const base = path.join(rutas.base, 'data', servicio);
  let nombres: string[];
  try {
    nombres = (await readdir(base, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
  return nombres
    .filter((n) => claveInstanciaValida(n))
    .filter((n) => existsSync(path.join(base, n, MARCA_INICIALIZADO)))
    .sort(compararVersiones);
}

async function escribirAtomico(destino: string, texto: string): Promise<void> {
  await mkdir(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.migrando.tmp`;
  try {
    await writeFile(tmp, texto, 'utf8');
    await rename(tmp, destino);
  } catch (e) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
}

/**
 * Pasa los servicios de datos de la forma de una sola instancia a instancias
 * (`<servicio>@<clave>`). Idempotente y sin perder nada:
 * - un servicio que ya tiene `instancias` en config.json no se toca (la segunda vez no escribe
 *   nada ni hace copias);
 * - por servicio con versión activa crea `<servicio>@<claveDatos(versión)>` con **el mismo
 *   puerto**, el mismo `autoIniciar` y la misma carpeta de datos, como predeterminada;
 * - las carpetas `data/<servicio>/<clave>` inicializadas que no tengan instancia quedan como
 *   instancias apagadas (puerto libre);
 * - cada instancia nueva recibe una copia de la credencial vieja (`mysql` → `mysql@8.4`); la
 *   vieja se conserva tal cual;
 * - el registro del supervisor `mysql` pasa a `mysql@8.4` para readoptar el proceso vivo.
 * Antes de escribir copia config.json, credenciales.json y run/estado.json en
 * `etc/respaldos/pre-instancias-<fecha>/`. Edita config.json en crudo: los campos que no
 * conoce (de una versión futura) se conservan. Si algo falla al escribir, devuelve las copias
 * y lanza. **Nunca mueve, renombra ni borra carpetas de datos.**
 */
export async function migrarInstancias(
  d: DepsMigracionInstancias,
): Promise<{ migradas: IdInstancia[] }> {
  const archivoConfig = d.rutas.config();
  let texto: string;
  try {
    texto = await readFile(archivoConfig, 'utf8');
  } catch {
    return { migradas: [] }; // sin config.json no hay nada que migrar
  }
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto.replace(/^\uFEFF/, ''));
  } catch {
    return { migradas: [] }; // un config ilegible lo trata el almacén (lo aparta como corrupto)
  }
  const validado = ConfigSchema.safeParse(crudo);
  if (!esObjeto(crudo) || !validado.success) return { migradas: [] };
  const cfg: Config = validado.data;
  const datosCrudos = esObjeto(crudo['servicios']) ? crudo['servicios']['datos'] : undefined;

  // 1. Plan (sin escribir nada).
  const planes: Plan[] = [];
  const asignados = new Set<number>();
  const reservados = (await d.rangosReservados?.().catch(() => [])) ?? [];
  for (const def of d.definiciones()) {
    if (!multiInstancia(def)) continue;
    const previo = esObjeto(datosCrudos) ? datosCrudos[def.id] : undefined;
    const yaMigrado = esObjeto(previo) && 'instancias' in previo;
    // Con instancias ya no se toca; con la lista vacía (no había nada instalado) solo si ahora hay.
    if (
      yaMigrado &&
      esObjeto(previo['instancias']) &&
      Object.keys(previo['instancias']).length > 0
    ) {
      continue;
    }
    const c = cfg.servicios.datos[def.id];
    const instaladas = await d.instalados(def.id);
    const activa =
      c.version && instaladas.includes(c.version)
        ? c.version
        : ([...instaladas].sort(compararVersiones).at(-1) ?? null);
    const instancias: Record<string, InstanciaConfig> = {};
    let predeterminada: string | null = null;
    let renombrar: Plan['renombrar'] = null;
    if (activa) {
      const clave = claveDe(def, activa);
      if (claveInstanciaValida(clave)) {
        instancias[clave] = { version: activa, puerto: c.puerto, autoIniciar: c.autoIniciar };
        predeterminada = clave;
        renombrar = { viejo: def.id, nuevo: idInstancia(def.id, clave) };
      }
    }
    const carpetas = await carpetasInicializadas(d.rutas, def.id);
    if (!activa && c.version) {
      // Sin binarios pero con la versión elegida y su carpeta: esa sigue siendo la predeterminada.
      const clave = claveDe(def, c.version);
      if (carpetas.includes(clave)) {
        instancias[clave] = { version: c.version, puerto: c.puerto, autoIniciar: c.autoIniciar };
        predeterminada = clave;
        renombrar = { viejo: def.id, nuevo: idInstancia(def.id, clave) };
      }
    }
    for (const clave of carpetas) {
      if (Object.hasOwn(instancias, clave)) continue;
      const version =
        instaladas
          .filter((v) => claveDe(def, v) === clave)
          .sort(compararVersiones)
          .at(-1) ?? clave;
      instancias[clave] = { version, puerto: 0, autoIniciar: false };
    }
    if (yaMigrado && Object.keys(instancias).length === 0) continue;
    planes.push({ servicio: def.id, instancias, predeterminada, renombrar });
  }
  if (planes.length === 0) return { migradas: [] };

  // Puertos libres para las instancias que vienen de carpetas sueltas.
  const simulado = structuredClone(cfg);
  for (const p of planes) {
    const s = simulado.servicios.datos[p.servicio];
    s.instancias = Object.fromEntries(
      Object.entries(p.instancias).filter(([, i]) => i.puerto !== 0),
    );
    // Un servicio sin nada instalado conserva su puerto reservado (como hasta ahora).
    if (Object.keys(s.instancias).length === 0) delete s.instancias;
  }
  for (const x of puertosConfigurados(simulado)) asignados.add(x.puerto);
  asignados.add(cfg.servicios.nginx.puerto);
  const fijos = puertosFijos(cfg);
  const libre = (desde: number): number => {
    for (let p = desde; p <= 65535; p++) {
      if (asignados.has(p)) continue;
      if (fijos.some((f) => p >= f.desde && p <= f.hasta)) continue;
      if (reservados.some((r) => p >= r.desde && p <= r.hasta)) continue;
      return p;
    }
    throw new Error('No se encontró un puerto libre para una instancia.');
  };
  for (const p of planes) {
    const def = d.definiciones().find((x) => x.id === p.servicio)!;
    for (const i of Object.values(p.instancias)) {
      if (i.puerto !== 0) continue;
      i.puerto = libre(def.puertoPorDefecto);
      asignados.add(i.puerto);
    }
  }

  // Credenciales: cada instancia nueva con la del servicio (la única que existía).
  const credenciales = await d.credenciales.todas();
  const nuevas: ArchivoCredenciales = {};
  for (const p of planes) {
    const vieja = credenciales[p.servicio];
    if (!vieja) continue;
    for (const clave of Object.keys(p.instancias)) {
      const id = idInstancia(p.servicio, clave);
      if (!credenciales[id]) nuevas[id] = { ...vieja };
    }
  }

  // 2. Copias previas.
  const respaldos = path.join(d.rutas.base, 'etc', 'respaldos');
  let carpeta = path.join(respaldos, `pre-instancias-${selloFecha(d.ahora?.() ?? new Date())}`);
  for (let n = 2; existsSync(carpeta); n++) carpeta = `${carpeta.replace(/-\d+$/, '')}-${n}`;
  await mkdir(carpeta, { recursive: true });
  const credencialesExistia = existsSync(d.rutas.credenciales());
  const copias: { original: string; copia: string }[] = [];
  for (const original of [archivoConfig, d.rutas.credenciales(), d.rutas.estado()]) {
    if (!existsSync(original)) continue;
    const copia = path.join(carpeta, path.basename(original));
    await copyFile(original, copia);
    copias.push({ original, copia });
  }

  // 3. Escritura (credenciales primero: solo agrega claves; luego config.json en crudo).
  const servicios = esObjeto(crudo['servicios']) ? crudo['servicios'] : {};
  const datos = esObjeto(servicios['datos']) ? servicios['datos'] : {};
  for (const p of planes) {
    const actual = datos[p.servicio];
    const previo: Record<string, unknown> = esObjeto(actual) ? actual : {};
    const pred = p.predeterminada ? p.instancias[p.predeterminada] : undefined;
    datos[p.servicio] = {
      ...previo,
      ...(pred
        ? { version: pred.version, puerto: pred.puerto, autoIniciar: pred.autoIniciar }
        : {}),
      predeterminada: p.predeterminada,
      instancias: p.instancias,
    };
  }
  servicios['datos'] = datos;
  crudo['servicios'] = servicios;
  try {
    if (Object.keys(nuevas).length > 0) await d.credenciales.importar(nuevas);
    // Antes de escribir se comprueba que el resultado se sigue leyendo bien.
    const final = ConfigSchema.parse(crudo);
    for (const p of planes) {
      if (
        Object.keys(final.servicios.datos[p.servicio].instancias ?? {}).length !==
        Object.keys(p.instancias).length
      ) {
        throw new Error(`Las instancias de ${p.servicio} no se leen igual tras migrar.`);
      }
    }
    await escribirAtomico(archivoConfig, JSON.stringify(crudo, null, 2) + '\n');
  } catch (e) {
    for (const c of copias) {
      if (c.original === d.rutas.estado()) continue;
      await copyFile(c.copia, c.original).catch(() => undefined);
    }
    if (!credencialesExistia)
      await rm(d.rutas.credenciales(), { force: true }).catch(() => undefined);
    throw new Error(
      `No se pudo pasar los servicios de datos a instancias; se dejó todo como estaba (${e instanceof Error ? e.message : String(e)}).`,
      { cause: e },
    );
  }
  for (const p of planes) {
    if (p.renombrar) d.supervisor.renombrarRegistro(p.renombrar.viejo, p.renombrar.nuevo);
  }
  return {
    migradas: planes.flatMap((p) =>
      Object.keys(p.instancias).map((clave) => idInstancia(p.servicio, clave)),
    ),
  };
}
