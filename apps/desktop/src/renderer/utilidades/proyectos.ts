import type {
  DatosSitio,
  Deteccion,
  EstadoReceta,
  PasoReceta,
  ProgresoReceta,
  RepoGithub,
  ResultadoTraer,
  Sitio,
  SugerenciaProyecto,
} from '../../shared/api';
import { es } from '../i18n/es';
import { nombreDeCarpeta, sitioVacio, usaPhp, usaProxy } from './sitios';

/** Proceso de proyecto tal como se guarda en el sitio. */
export type ProcesoProyectoPublico = Sitio['procesos'][number];

/** Lógica pura de la pantalla Proyectos: sin Vue ni IPC, para poder probarla sola. */

export type PasoConEstado = EstadoReceta['pasos'][number];
export type EstadoPaso = PasoConEstado['estado'];
export type TipoPaso = PasoReceta['tipo'];

/**
 * Copia profunda de datos planos. No usa structuredClone: los pasos suelen venir de un estado
 * reactivo (Proxy de Vue), que structuredClone no puede copiar.
 */
const copia = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Líneas de registro que se guardan por paso (igual que el núcleo). */
export const MAX_LINEAS_PASO = 500;

/** Carpeta donde se clonan los proyectos si no hay una carpeta vigilada. */
export const CARPETA_PROYECTOS = 'C:\\Proyectos';

/* ───────────── Rutas y remotos ───────────── */

/** Ruta comparable: barras de Windows, sin barra final y sin distinguir mayúsculas. */
export function claveRuta(ruta: string): string {
  return ruta.trim().replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
}

export const mismaRuta = (a: string, b: string): boolean => claveRuta(a) === claveRuta(b);

/**
 * Remoto comparable: `https://github.com/Owner/Repo.git`, `git@github.com:owner/repo` y
 * `owner/repo` (GitHub) quedan como `github.com/owner/repo`. Sin credenciales ni `.git`.
 */
export function claveRemoto(remoto: string): string {
  let r = remoto.trim();
  const scp = /^[^@\s]+@([^:\s]+):(.+)$/.exec(r);
  if (scp) r = `${scp[1]}/${scp[2]}`;
  else if (/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(r)) r = `github.com/${r}`;
  else r = r.replace(/^[a-z+]+:\/\//i, '').replace(/^[^@/]*@/, '');
  return r
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '')
    .toLowerCase();
}

/** URL web (https) del remoto, sin credenciales; null si no se puede armar. */
export function urlWebRemoto(remoto: string | null | undefined): string | null {
  if (!remoto) return null;
  const clave = claveRemoto(remoto);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}\/[^\s]+$/i.test(clave)) return null;
  return `https://${clave}`;
}

/** Nombre del repositorio de una URL de Git (`…/mi-repo.git` → `mi-repo`). */
export function nombreDeUrl(url: string): string {
  const limpio = url
    .trim()
    .replace(/[\\/]+$/, '')
    .replace(/\.git$/i, '');
  return limpio.split(/[\\/:]/).pop() ?? '';
}

/** Destino por defecto del clon: `<base>\<nombre>`. */
export function destinoPorDefecto(nombre: string, base: string | null = null): string {
  const b = (base?.trim() || CARPETA_PROYECTOS).replace(/[\\/]+$/, '');
  return nombre ? `${b}\\${nombre}` : '';
}

/** Remoto que se guarda con el sitio: owner/name pasa a la URL de GitHub; lo demás, tal cual. */
export function remotoDe(origen: string): string {
  const o = origen.trim();
  return /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(o) ? `https://github.com/${o}` : o;
}

/** Validación mínima en el cliente (el proceso principal vuelve a validar). */
export function urlGitValida(url: string): boolean {
  const u = url.trim();
  if (!u || u.startsWith('-') || /\s/.test(u)) return false;
  return (
    /^https:\/\/[^@\s/]+\/.+/.test(u) ||
    /^git@[A-Za-z0-9.-]+:[A-Za-z0-9._~/-]+$/.test(u) ||
    /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(u)
  );
}

export const rutaAbsolutaWindows = (ruta: string): boolean => /^[A-Za-z]:[\\/]/.test(ruta.trim());

/* ───────────── Repos de GitHub ───────────── */

export interface RepoConMarca extends RepoGithub {
  /** Ya hay un proyecto con este remoto o en su carpeta de destino por defecto. */
  yaClonado: boolean;
}

/**
 * Marca los repos que ya están clonados: un sitio con el mismo remoto o cuya carpeta es la de
 * destino por defecto (sin distinguir mayúsculas en las rutas).
 */
export function marcarClonados(
  repos: readonly RepoGithub[],
  sitios: readonly Pick<Sitio, 'carpeta' | 'git'>[],
  base: string | null = null,
): RepoConMarca[] {
  const remotos = new Set(
    sitios
      .map((s) => s.git?.remoto)
      .filter((r): r is string => !!r)
      .map(claveRemoto),
  );
  const carpetas = new Set(sitios.map((s) => claveRuta(s.carpeta)));
  return repos.map((r) => ({
    ...r,
    yaClonado:
      remotos.has(claveRemoto(r.url)) ||
      remotos.has(claveRemoto(r.completo)) ||
      carpetas.has(claveRuta(destinoPorDefecto(r.nombre, base))),
  }));
}

const sinTildes = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

export function filtrarRepos<T extends RepoGithub>(repos: readonly T[], texto: string): T[] {
  const q = sinTildes(texto.trim());
  if (!q) return [...repos];
  return repos.filter((r) =>
    [r.completo, r.descripcion].some((c) => sinTildes(c ?? '').includes(q)),
  );
}

/** Une una página nueva de repos sin repetir (por `completo`). */
export function unirRepos(previos: readonly RepoGithub[], nuevos: readonly RepoGithub[]) {
  const vistos = new Set(previos.map((r) => r.completo.toLowerCase()));
  return [...previos, ...nuevos.filter((r) => !vistos.has(r.completo.toLowerCase()))];
}

/** Qué se le pasa a `git.clonar`: owner/name con sesión de gh; si no, la URL https. */
export function urlParaClonar(repo: RepoGithub, conGh: boolean): string {
  return conGh ? repo.completo : repo.url;
}

/** Porcentaje de una línea de progreso de git ("Receiving objects:  45% (…)"), o null. */
export function porcentajeGit(linea: string): number | null {
  const m = /(\d{1,3})%/.exec(linea);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 0 && n <= 100 ? n : null;
}

/* ───────────── Conexión con GitHub ───────────── */

export type ConexionGithub = 'gh' | 'token' | 'ninguna';

export function conexionGithub(o: { ghSesion: boolean; hayToken: boolean }): ConexionGithub {
  if (o.ghSesion) return 'gh';
  if (o.hayToken) return 'token';
  return 'ninguna';
}

/* ───────────── Sugerencias de la carpeta vigilada ───────────── */

/** Sugerencias que todavía no son un proyecto ni se descartaron (rutas sin mayúsculas). */
export function sugerenciasVisibles(
  sugerencias: readonly SugerenciaProyecto[],
  sitios: readonly Pick<Sitio, 'carpeta'>[],
  descartadas: ReadonlySet<string>,
): SugerenciaProyecto[] {
  const montadas = new Set(sitios.map((s) => claveRuta(s.carpeta)));
  const vistas = new Set<string>();
  return sugerencias.filter((s) => {
    const k = claveRuta(s.carpeta);
    if (montadas.has(k) || descartadas.has(k) || vistas.has(k)) return false;
    vistas.add(k);
    return true;
  });
}

/* ───────────── Receta ───────────── */

/**
 * Título de un paso por su tipo (los títulos de un wolfcore.yml los escribe el repositorio y no
 * se muestran como si fueran de WolfCore Dev).
 */
export function etiquetaPaso(p: Pick<PasoReceta, 'tipo' | 'args'>): string {
  const t = es.proyectos.pasos;
  const a = p.args ?? {};
  const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
  switch (p.tipo) {
    case 'sitio-crear':
      return t.sitioCrear(texto(a['dominio']) ?? '');
    case 'bd-restaurar': {
      const archivo = texto(a['archivo']);
      return t.bdRestaurar(archivo ? nombreDeCarpeta(archivo) : null);
    }
    case 'migrar':
      return a['semilla'] === true ? t.migrarSemilla : t.migrar;
    case 'comando': {
      const c = a['comando'];
      const linea = Array.isArray(c) ? unirComando(c.map(String)) : '';
      return t.comando(linea);
    }
    default:
      return t.porTipo[p.tipo] ?? p.tipo;
  }
}

/** Estado general de la receta tal como se ve en la interfaz. */
export type EstadoGeneral = EstadoReceta['estado'];

export function recetaVacia(sitioId: string): EstadoReceta {
  return { sitioId, estado: 'inactiva', pasos: [], actualizado: null };
}

/**
 * Aplica un evento `receta:progreso` al estado. `desconocido` indica que el paso no estaba en
 * la lista (hay que pedir el estado completo al núcleo).
 */
export function aplicarProgreso(
  e: EstadoReceta,
  p: ProgresoReceta,
): { estado: EstadoReceta; desconocido: boolean } {
  const i = e.pasos.findIndex((x) => x.id === p.pasoId);
  if (i < 0) return { estado: e, desconocido: true };
  const previo = e.pasos[i]!;
  const paso: PasoConEstado = { ...previo, log: [...previo.log] };
  const agregar = (l: string): void => {
    paso.log.push(l);
    if (paso.log.length > MAX_LINEAS_PASO) paso.log.splice(0, paso.log.length - MAX_LINEAS_PASO);
  };
  switch (p.estado) {
    case 'pendiente':
      // Al empezar una corrida el paso vuelve a pendiente y su registro se limpia; si se
      // canceló mientras corría, se conserva lo que alcanzó a escribir.
      if (previo.estado !== 'corriendo') {
        paso.log = [];
        paso.mensaje = undefined;
      }
      break;
    case 'corriendo':
      if (previo.estado !== 'corriendo') paso.mensaje = undefined;
      if (p.linea !== undefined) agregar(p.linea);
      break;
    case 'error':
      if (p.linea !== undefined) {
        paso.mensaje = p.linea;
        if (paso.log.at(-1) !== p.linea) agregar(p.linea);
      }
      break;
    default:
      paso.mensaje = undefined;
  }
  paso.estado = p.estado;
  const pasos = [...e.pasos];
  pasos[i] = paso;
  const corre = p.estado === 'corriendo' || p.estado === 'pendiente';
  return {
    estado: { ...e, pasos, estado: corre ? 'corriendo' : e.estado },
    desconocido: false,
  };
}

/** Primer paso con error (el que se ofrece reintentar u omitir). */
export function pasoConError(e: EstadoReceta): PasoConEstado | undefined {
  return e.pasos.find((p) => p.estado === 'error');
}

/** Progreso de 0 a 100 (pasos listos u omitidos sobre el total). */
export function avanceReceta(e: EstadoReceta): number {
  if (!e.pasos.length) return 0;
  const hechos = e.pasos.filter((p) => p.estado === 'listo' || p.estado === 'omitido').length;
  return Math.round((hechos / e.pasos.length) * 100);
}

/* ───────────── Asistente ───────────── */

/** Un paso del asistente: la definición y si está activo. */
export interface PasoAsistente {
  paso: PasoReceta;
  activo: boolean;
}

/** Pasos que no se pueden desactivar (sin ellos no queda proyecto). */
export const PASOS_FIJOS: readonly TipoPaso[] = ['sitio-crear'];

export const sePuedeDesactivar = (p: PasoReceta): boolean => !PASOS_FIJOS.includes(p.tipo);
/** Solo se reordenan los pasos opcionales (los marcados así y los que agrega el asistente). */
export const sePuedeMover = (p: PasoReceta): boolean => p.opcional === true;

export function pasosAsistente(receta: readonly PasoReceta[]): PasoAsistente[] {
  return receta.map((paso) => ({ paso: copia(paso), activo: true }));
}

/** Mueve un paso opcional una posición (−1 arriba, +1 abajo). */
export function moverPaso(pasos: readonly PasoAsistente[], i: number, delta: -1 | 1) {
  const j = i + delta;
  const copia = [...pasos];
  if (!copia[i] || !copia[j] || !sePuedeMover(copia[i]!.paso)) return copia;
  [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  return copia;
}

/** La receta que se envía al núcleo: solo los pasos activos, en su orden. */
export function recetaElegida(pasos: readonly PasoAsistente[]): PasoReceta[] {
  return pasos.filter((p) => p.activo || !sePuedeDesactivar(p.paso)).map((p) => p.paso);
}

/**
 * Agrega (o reemplaza) el paso `bd-restaurar` con el archivo elegido en el diálogo, justo
 * después de `bd-crear` (o antes de `migrar`/`sitio-crear` si no hay).
 */
export function conRestaurar(
  pasos: readonly PasoAsistente[],
  archivo: string,
  sobrescribir = false,
): PasoAsistente[] {
  const sin = pasos.filter((p) => p.paso.tipo !== 'bd-restaurar');
  const paso: PasoAsistente = {
    activo: true,
    paso: {
      id: 'bd-restaurar',
      tipo: 'bd-restaurar',
      titulo: '',
      opcional: true,
      args: { archivo, ...(sobrescribir ? { confirmarSobrescribir: true } : {}) },
    },
  };
  let i = sin.findIndex((p) => p.paso.tipo === 'bd-crear');
  if (i >= 0) i += 1;
  else {
    i = sin.findIndex((p) => p.paso.tipo === 'migrar' || p.paso.tipo === 'sitio-crear');
    if (i < 0) i = sin.length;
  }
  return [...sin.slice(0, i), paso, ...sin.slice(i)];
}

export const sinRestaurar = (pasos: readonly PasoAsistente[]): PasoAsistente[] =>
  pasos.filter((p) => p.paso.tipo !== 'bd-restaurar');

/** Detección editada en el asistente. */
export interface DeteccionEditable {
  tipo: Sitio['tipo'];
  php: string | null;
  /** Versión fijada para el sitio; null = la detectada. */
  node: string | null;
  python: string | null;
  servicios: Deteccion['servicios'];
  dominio: string;
  /** Solo para el tipo proxy. */
  puertoProxy: number | null;
}

export function deteccionEditable(d: Deteccion): DeteccionEditable {
  return {
    tipo: d.tipo,
    php: d.php,
    // null = la versión que elija WolfCore Dev con las pistas del proyecto (se fija solo si el
    // usuario elige una instalada).
    node: null,
    python: null,
    servicios: [...d.servicios],
    dominio: d.dominioSugerido,
    puertoProxy: null,
  };
}

const MOTORES = ['mysql', 'mariadb', 'postgresql', 'mongodb'] as const;
const motorDe = (servicios: readonly string[]): string | null =>
  servicios.find((s) => (MOTORES as readonly string[]).includes(s)) ?? null;

/**
 * Lleva lo editado de la detección a los argumentos de la receta: tipo, dominio y PHP del paso
 * `sitio-crear` y el motor de `bd-crear`/`bd-restaurar` (sin motor, esos pasos se quitan).
 */
export function aplicarDeteccion(
  pasos: readonly PasoAsistente[],
  d: DeteccionEditable,
): PasoAsistente[] {
  const motor = motorDe(d.servicios);
  const res: PasoAsistente[] = [];
  for (const p of pasos) {
    const paso = copia(p.paso);
    if (paso.tipo === 'sitio-crear') {
      paso.args = {
        ...paso.args,
        tipo: d.tipo,
        dominio: d.dominio,
        php: usaPhp(d.tipo) ? d.php : null,
      };
    } else if (paso.tipo === 'bd-crear' || paso.tipo === 'bd-restaurar') {
      if (!motor) continue;
      paso.args = { ...paso.args, motor };
    }
    res.push({ ...p, paso });
  }
  return res;
}

/**
 * Datos del sitio que se crea antes de la receta (con "Confío…" marcado). Un tipo proxy (FastAPI
 * o Node) sin puerto todavía se crea como estático: el paso `sitio-crear` pone su tipo y puerto.
 */
export function datosSitioInicial(
  carpeta: string,
  d: DeteccionEditable,
  remoto: string | null,
): DatosSitio {
  const base = sitioVacio();
  const sinPuerto = usaProxy(d.tipo) && d.tipo !== 'proxy' && d.puertoProxy === null;
  const tipo = sinPuerto ? 'estatico' : d.tipo;
  const runtimes: DatosSitio['runtimes'] = {};
  if (d.node?.trim()) runtimes.node = d.node.trim();
  if (d.python?.trim()) runtimes.python = d.python.trim();
  return {
    ...base,
    nombre: nombreDeCarpeta(carpeta),
    dominio: d.dominio.trim().toLowerCase(),
    carpeta,
    tipo,
    php: usaPhp(tipo) ? d.php : null,
    puertoProxy: tipo === 'proxy' ? d.puertoProxy : null,
    confiado: true,
    git: remoto ? { remoto, rama: null } : null,
    runtimes,
  };
}

/* ───────────── Traer cambios ───────────── */

/** Pasos que conviene correr según lo que trajo `git pull`. */
export function pasosSugeridos(
  r: ResultadoTraer,
  guardada: readonly PasoReceta[] = [],
): PasoReceta[] {
  const res: PasoReceta[] = [];
  const agregar = (tipo: TipoPaso): void => {
    const previo = guardada.find((p) => p.tipo === tipo);
    if (!previo) {
      res.push({ id: tipo, tipo, titulo: '' });
      return;
    }
    // Solo la definición del paso (la receta guardada trae también estado y registro).
    const { id, titulo, args, opcional } = copia(previo);
    res.push({ id, tipo, titulo, ...(args ? { args } : {}), ...(opcional ? { opcional } : {}) });
  };
  if (r.cambios.composerLock) agregar('composer-install');
  if (r.cambios.packageLock) {
    agregar('npm-ci');
    if (guardada.some((p) => p.tipo === 'npm-build') || !guardada.length) agregar('npm-build');
  }
  if (r.cambios.requirements) agregar('pip-install');
  if (r.cambios.migraciones.length) agregar('migrar');
  return res;
}

/* ───────────── Procesos ───────────── */

/** Une un comando para mostrarlo (comillas si un argumento lleva espacios). */
export function unirComando(partes: readonly string[]): string {
  return partes
    .map((a) => (/[\s"]/.test(a) || a === '' ? `"${a.replace(/"/g, '\\"')}"` : a))
    .join(' ');
}

/** Parte un comando escrito en una línea (respeta comillas dobles). */
export function partirComando(linea: string): string[] {
  const res: string[] = [];
  let actual = '';
  let enComillas = false;
  let hay = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]!;
    if (c === '\\' && linea[i + 1] === '"') {
      actual += '"';
      hay = true;
      i++;
    } else if (c === '"') {
      enComillas = !enComillas;
      hay = true;
    } else if (/\s/.test(c) && !enComillas) {
      if (hay) res.push(actual);
      actual = '';
      hay = false;
    } else {
      actual += c;
      hay = true;
    }
  }
  if (hay) res.push(actual);
  return res;
}

/** Id de proceso a partir de su nombre (solo letras, números y guion bajo; sin repetir). */
export function idProceso(nombre: string, usados: readonly string[]): string {
  let base = sinTildes(nombre)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!base || !/^[a-z0-9]/.test(base)) base = `proceso${base ? `_${base}` : ''}`;
  base = base.slice(0, 40);
  let id = base;
  for (let n = 2; usados.includes(id); n++) id = `${base}_${n}`;
  return id;
}

export function procesoVacio(): ProcesoProyectoPublico {
  return {
    id: '',
    nombre: '',
    comando: [],
    cwd: 'raiz',
    autoIniciar: false,
    reiniciar: false,
    puerto: null,
    proxy: false,
  };
}

/** Cambios de un proceso en marcha que solo se aplican al reiniciarlo. */
export function requiereReinicio(
  antes: Pick<ProcesoProyectoPublico, 'comando' | 'puerto' | 'cwd'>,
  despues: Pick<ProcesoProyectoPublico, 'comando' | 'puerto' | 'cwd'>,
): boolean {
  return (
    antes.puerto !== despues.puerto ||
    antes.cwd !== despues.cwd ||
    antes.comando.length !== despues.comando.length ||
    antes.comando.some((c, i) => c !== despues.comando[i])
  );
}

/**
 * Reemplaza (o agrega) un proceso en la lista. Si queda marcado como destino del proxy, los
 * demás dejan de estarlo (solo uno puede serlo).
 */
export function conProceso(
  procesos: readonly ProcesoProyectoPublico[],
  proceso: ProcesoProyectoPublico,
  idAnterior?: string,
): ProcesoProyectoPublico[] {
  const lista = procesos.map((p) => ({ ...p, comando: [...p.comando] }));
  const i = lista.findIndex((p) => p.id === (idAnterior ?? proceso.id));
  if (i >= 0) lista[i] = proceso;
  else lista.push(proceso);
  return proceso.proxy ? lista.map((p) => (p === proceso ? p : { ...p, proxy: false })) : lista;
}

/** Errores visibles del formulario de proceso, o null si está bien. */
export function errorProceso(
  p: ProcesoProyectoPublico,
  otros: readonly ProcesoProyectoPublico[],
): string | null {
  const t = es.proyectos.procesos.errores;
  if (!p.comando.length) return t.comando;
  if (p.puerto !== null && (!Number.isInteger(p.puerto) || p.puerto < 1 || p.puerto > 65535)) {
    return t.puerto;
  }
  if (p.proxy && p.puerto === null) return t.proxySinPuerto;
  if (
    p.cwd !== 'raiz' &&
    (/^[A-Za-z]:|^[\\/]/.test(p.cwd) || p.cwd.split(/[\\/]/).includes('..'))
  ) {
    return t.cwd;
  }
  if (otros.some((o) => o.id === p.id)) return t.repetido;
  return null;
}

/** Fuente de registro de un proceso de proyecto (el id del supervisor). */
export const fuenteProceso = (sitioId: string, procesoId: string): string =>
  `proy-${sitioId}-${procesoId}`;

/* ───────────── Qué abre el asistente ───────────── */

/**
 * - `nuevo`: una carpeta recién clonada o elegida; se crea el proyecto al montar.
 * - `ver`: la preparación de un proyecto que ya existe (progreso, Reintentar, Omitir).
 * - `revisar`: volver a revisar la receta de un proyecto existente (p. ej. si cambió).
 */
export type ObjetivoAsistente =
  | { modo: 'nuevo'; carpeta: string; remoto: string | null }
  | { modo: 'ver'; sitioId: string }
  | { modo: 'revisar'; sitioId: string };

export const SERVICIOS_PROYECTO = [
  'mysql',
  'mariadb',
  'postgresql',
  'mongodb',
  'redis',
  'mailpit',
] as const satisfies readonly Deteccion['servicios'][number][];
