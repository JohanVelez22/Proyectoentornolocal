import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Plantilla } from '../proyectos/plantillas';
import type { Rutas } from '../rutas';
import {
  elegirJava,
  elegirVersion,
  pistaEntendida,
  TIPOS_RUNTIME,
  type TipoRuntime,
} from '../runtimes/runtimes';
import {
  IDS_SERVICIO_DATOS,
  type Config,
  type EstadoServicio,
  type IdInstancia,
  type Sitio,
} from '../tipos';
import {
  claveVersion,
  MOTIVOS_BLOQUEO,
  SERVICIOS_LIMPIABLES,
  versionDeEjecutable,
  type MotivoBloqueo,
  type UsosVersiones,
} from './limpieza';
import { compararVersionesDesc } from './comun';
import type { ServicioVersiones } from './tablaVersiones';

/**
 * Quién usa cada versión instalada (D30). Una versión cuenta como en uso si la usa un sitio (PHP
 * por sitio y pools), una instancia (aunque esté apagada), la predeterminada, un runtime de
 * proyecto, una plantilla, un workspace o una tarea, o si hay un proceso propio en ejecución cuyo
 * ejecutable real está dentro de ella. Cualquier lectura que falle marca como `duda` todo lo que
 * esa lectura habría protegido: ante la duda, no se borra.
 */
export interface DepsUsoVersiones {
  rutas: Rutas;
  config: () => Promise<Config>;
  sitios: () => Promise<Sitio[]>;
  plantillas: () => Promise<Plantilla[]>;
  estados: () => Promise<EstadoServicio[]>;
  instaladas: (servicio: ServicioVersiones) => Promise<string[]>;
  /**
   * Versiones de runtime con las que corre un proyecto (el mismo resolutor de Terminal).
   * `lecturaFallida`: no se pudo leer su `wolfcore.yml` u otra pista, así que lo resuelto puede no
   * ser lo que el proyecto pide.
   */
  runtimesDe: (
    sitio: Sitio,
  ) => Promise<Partial<Record<TipoRuntime, string | undefined>> & { lecturaFallida?: boolean }>;
  /** Carpeta `data/<servicio>/<clave>` que abre esta versión (null si el servicio no guarda datos). */
  carpetaDatos?: (servicio: string, version: string) => string | null;
  /** Ramas de PHP que usan phpMyAdmin y Adminer. */
  ramasHerramientas?: () => Promise<string[]>;
  /** Rama de PHP que usan los proyectos nuevos y las herramientas (null si no hay). */
  phpPorDefecto: () => Promise<string | null>;
  nginxActiva: () => Promise<string | null>;
  /** Versión efectiva de un runtime, Composer o cloudflared (la elegida o la más nueva). */
  versionPreferida: (servicio: ServicioVersiones, instaladas: string[]) => Promise<string | null>;
  /** Instancia que usa los binarios `bin/<servicio>/<versión>` (o null). */
  versionEnUso: (servicio: string, version: string) => Promise<IdInstancia | null>;
  /** PIDs raíz de WolfCore Dev (servicios y procesos de proyecto supervisados). */
  pidsPropios: () => number[];
  descendientes?: (pids: number[]) => Promise<Map<number, number[]>>;
  /** Ruta real del ejecutable de un proceso (null: no se pudo leer). */
  rutaProceso: (pid: number) => Promise<string | null>;
  procesoVivo: (pid: number) => Promise<boolean>;
}

const RUNTIMES_LIMPIABLES = TIPOS_RUNTIME.filter((t) => t !== 'rust');
const DATOS = IDS_SERVICIO_DATOS as readonly string[];
const encendido = (e: string | undefined): boolean => e === 'encendido' || e === 'iniciando';

/**
 * Ruta real (sin enlaces ni uniones) de la parte que existe más el resto tal cual: un `home` con
 * una subcarpeta que no está (`…\Scripts`) se compara igual que si existiera, y en macOS `/var`
 * resuelve a `/private/var`.
 */
async function rutaRealAprox(ruta: string): Promise<string> {
  let actual = ruta;
  const resto: string[] = [];
  for (let i = 0; i < 32; i++) {
    try {
      return path.join(await realpath(actual), ...resto.reverse());
    } catch {
      const padre = path.dirname(actual);
      if (padre === actual) return ruta;
      resto.push(path.basename(actual));
      actual = padre;
    }
  }
  return ruta;
}

export async function calcularUsos(d: DepsUsoVersiones): Promise<UsosVersiones> {
  const usos: UsosVersiones = new Map();
  const instaladasCache = new Map<string, string[]>();
  const instaladas = async (s: ServicioVersiones): Promise<string[]> => {
    if (!instaladasCache.has(s)) {
      try {
        instaladasCache.set(s, await d.instaladas(s));
      } catch {
        // No se pudo ni listar lo instalado: ninguna versión de este servicio se toca.
        usos.set(`${s}/*`, 'duda');
        instaladasCache.set(s, []);
      }
    }
    return instaladasCache.get(s)!;
  };
  const prioridad = (m: MotivoBloqueo): number => MOTIVOS_BLOQUEO.indexOf(m);
  const marcar = (servicio: string, version: string | null | undefined, m: MotivoBloqueo): void => {
    if (!version) return;
    const k = claveVersion(servicio, version);
    const previo = usos.get(k);
    if (previo === undefined || prioridad(m) < prioridad(previo)) usos.set(k, m);
  };
  /** Marca todas las instaladas de estos servicios (lo que no se pudo comprobar). */
  const dudar = async (servicios: readonly ServicioVersiones[]): Promise<void> => {
    for (const s of servicios) for (const v of await instaladas(s)) marcar(s, v, 'duda');
  };
  /** Ejecuta una comprobación; si falla, lo que protegía queda como `duda`. */
  const paso = async (
    servicios: readonly ServicioVersiones[],
    fn: () => Promise<void>,
  ): Promise<void> => {
    try {
      await fn();
    } catch {
      await dudar(servicios);
    }
  };
  const lim = (s: string): s is ServicioVersiones =>
    (SERVICIOS_LIMPIABLES as readonly string[]).includes(s);

  let cfg: Config | null = null;
  let estados: EstadoServicio[] = [];
  let sitios: Sitio[] = [];
  try {
    cfg = await d.config();
    estados = await d.estados();
    sitios = await d.sitios();
  } catch {
    // Sin poder leer lo básico, todo queda como duda.
    await dudar(SERVICIOS_LIMPIABLES);
    cfg = null;
  }

  if (cfg !== null) {
    const c = cfg;
    // PHP: la predeterminada, la de la terminal y las herramientas, los pools y los sitios.
    await paso(['php'], async () => {
      marcar('php', await d.phpPorDefecto(), 'predeterminada');
      marcar('php', c.herramientas.phpPorDefecto, 'predeterminada');
      for (const e of estados) {
        const m = /^php-(\d+\.\d+)$/.exec(e.id);
        if (m && encendido(e.estado)) marcar('php', m[1], 'encendida');
      }
      for (const rama of c.servicios.php.versiones) marcar('php', rama, 'sitio');
      for (const s of sitios) marcar('php', s.php, 'sitio');
      // phpMyAdmin y Adminer corren con una rama de PHP aunque ningún sitio la use.
      for (const rama of (await d.ramasHerramientas?.()) ?? []) marcar('php', rama, 'herramienta');
    });

    // Nginx: la activa (encendida o no) es la predeterminada.
    await paso(['nginx'], async () => {
      const activa = await d.nginxActiva();
      const e = estados.find((x) => x.id === 'nginx')?.estado;
      marcar('nginx', activa, encendido(e) ? 'encendida' : 'predeterminada');
      marcar('nginx', c.servicios.nginx.version, 'predeterminada');
    });

    // Servicios de datos (y captadores y Ollama): la instancia que usa cada versión.
    const instancias = new Map<string, { predeterminada: boolean; encendida: boolean }>();
    for (const e of estados) {
      for (const i of e.instancias ?? []) {
        instancias.set(i.id, { predeterminada: i.predeterminada, encendida: encendido(i.estado) });
      }
    }
    for (const servicio of DATOS) {
      if (!lim(servicio)) continue;
      await paso([servicio], async () => {
        for (const v of await instaladas(servicio)) {
          const id = await d.versionEnUso(servicio, v);
          if (id === null) continue;
          const i = instancias.get(id);
          marcar(
            servicio,
            v,
            i?.encendida ? 'encendida' : i?.predeterminada ? 'predeterminada' : 'instancia',
          );
        }
        marcar(
          servicio,
          c.servicios.datos[servicio as keyof Config['servicios']['datos']]?.version,
          'instancia',
        );
      });
    }

    // Datos en data/: la versión más nueva de cada carpeta con datos es la única que sabe abrirlos
    // (con otra rama no se podrían abrir), aunque ninguna instancia la use ahora.
    if (d.carpetaDatos) {
      for (const servicio of DATOS) {
        if (!lim(servicio)) continue;
        await paso([servicio], async () => {
          const grupos = new Map<string, string[]>();
          for (const v of await instaladas(servicio)) {
            const dir = d.carpetaDatos!(servicio, v);
            if (dir) grupos.set(dir, [...(grupos.get(dir) ?? []), v]);
          }
          for (const [dir, versiones] of grupos) {
            let entradas: string[];
            try {
              entradas = await readdir(dir);
            } catch (e) {
              if ((e as { code?: string }).code === 'ENOENT') continue;
              throw e;
            }
            if (entradas.length === 0) continue;
            marcar(servicio, [...versiones].sort(compararVersionesDesc)[0], 'datos');
          }
        });
      }
    }

    // Runtimes (Node, Python, Java…), Composer y cloudflared: la predeterminada efectiva.
    for (const servicio of [...RUNTIMES_LIMPIABLES, 'composer', 'cloudflared'] as const) {
      await paso([servicio], async () => {
        marcar(
          servicio,
          await d.versionPreferida(servicio, await instaladas(servicio)),
          'predeterminada',
        );
      });
    }
    marcar('cloudflared', c.servicios.cloudflared.version, 'predeterminada');

    // Runtimes de cada proyecto (y de sus tareas programadas).
    const binReal = await realpath(path.join(d.rutas.base, 'bin')).catch(() => null);
    /** Marca la versión que cumple una pista; una pista que no se entiende deja el runtime en duda. */
    const marcarPista = async (
      tipo: (typeof RUNTIMES_LIMPIABLES)[number],
      pista: string | null | undefined,
      motivo: MotivoBloqueo,
    ): Promise<void> => {
      if (!pista) return;
      if (!pistaEntendida(pista)) {
        await dudar([tipo]);
        return;
      }
      const inst = await instaladas(tipo);
      marcar(tipo, (tipo === 'java' ? elegirJava : elegirVersion)(inst, pista), motivo);
    };
    for (const s of sitios) {
      const motivo: MotivoBloqueo = (s.tareas ?? []).length > 0 ? 'tarea' : 'runtime';
      await paso(RUNTIMES_LIMPIABLES, async () => {
        // Una carpeta que no está (disco sin montar) o que no se puede leer: no se sabe qué pide.
        if (!(await stat(s.carpeta)).isDirectory()) throw new Error('no es una carpeta');
        const res = await d.runtimesDe(s);
        if (res.lecturaFallida) throw new Error('no se pudo leer la configuración del proyecto');
        for (const tipo of RUNTIMES_LIMPIABLES) {
          marcar(tipo, res[tipo], motivo);
          await marcarPista(tipo, s.runtimes?.[tipo], motivo);
        }
      });
      // Entornos virtuales de Python del proyecto: su `pyvenv.cfg` dice con qué Python se crearon.
      await paso(['python'], async () => {
        const carpetas = new Set<string>([s.carpeta]);
        for (const p of s.procesos) {
          if (p.cwd !== 'raiz') {
            carpetas.add(path.resolve(s.carpeta, p.cwd.replace(/[\\/]/g, path.sep)));
          }
        }
        for (const carpeta of carpetas) {
          for (const nombre of ['.venv', 'venv']) {
            let texto: string;
            try {
              texto = await readFile(path.join(carpeta, nombre, 'pyvenv.cfg'), 'utf8');
            } catch (e) {
              const c = (e as { code?: string }).code;
              if (c === 'ENOENT' || c === 'ENOTDIR') continue;
              throw e;
            }
            const valores = [...texto.matchAll(/^\s*(home|executable)\s*=\s*(.+?)\s*$/gim)].map(
              (m) => m[2]!,
            );
            if (valores.length === 0) throw new Error('pyvenv.cfg sin home');
            for (const valor of valores) {
              const real = await rutaRealAprox(valor);
              for (const ruta of [`${real}/x`, real]) {
                const v = binReal ? versionDeEjecutable(ruta, binReal) : null;
                if (v?.servicio === 'python') {
                  const par = (await instaladas('python')).find(
                    (x) => x.toLowerCase() === v.version,
                  );
                  marcar('python', par ?? v.version, motivo);
                }
              }
            }
          }
        }
      });
    }

    // Plantillas: la rama de PHP y los runtimes que fijan (resueltos como un proyecto).
    await paso(['php', ...RUNTIMES_LIMPIABLES], async () => {
      for (const p of await d.plantillas()) {
        marcar('php', p.php, 'plantilla');
        for (const tipo of RUNTIMES_LIMPIABLES) {
          await marcarPista(tipo, p.runtimes?.[tipo], 'plantilla');
        }
      }
    });

    // Workspaces: lo que enciende cada elemento.
    await paso(SERVICIOS_LIMPIABLES, async () => {
      for (const w of c.workspaces) {
        for (const el of w.elementos) {
          if (el.tipo === 'instancia') {
            const servicio = el.id.split('@')[0]!;
            if (!lim(servicio)) continue;
            for (const v of await instaladas(servicio)) {
              if ((await d.versionEnUso(servicio, v)) === el.id) marcar(servicio, v, 'workspace');
            }
          } else if (el.tipo === 'servicio') {
            if (el.id === 'nginx') marcar('nginx', await d.nginxActiva(), 'workspace');
            else if (el.id === 'php') {
              marcar('php', await d.phpPorDefecto(), 'workspace');
              for (const s of sitios) marcar('php', s.php, 'workspace');
            } else if (lim(el.id)) {
              for (const v of await instaladas(el.id)) {
                if ((await d.versionEnUso(el.id, v)) !== null) marcar(el.id, v, 'workspace');
              }
            }
          }
          // Un proceso de proyecto usa los runtimes del proyecto: ya cuentan arriba.
        }
      }
    });
  }

  // Procesos propios en ejecución: por la ruta real de su ejecutable, nunca por el nombre.
  await paso(SERVICIOS_LIMPIABLES, async () => {
    const raices = [...new Set(d.pidsPropios())];
    if (raices.length === 0) return;
    const todos = new Set<number>(raices);
    if (d.descendientes) {
      for (const hijos of (await d.descendientes(raices)).values()) {
        for (const h of hijos) todos.add(h);
      }
    }
    const bin = await realpath(path.join(d.rutas.base, 'bin')).catch(() => null);
    if (bin === null) return;
    // Mayúsculas y minúsculas no distinguen: se busca por clave en minúsculas.
    const porClave = new Map<string, [ServicioVersiones, string]>();
    for (const s of SERVICIOS_LIMPIABLES) {
      for (const v of await instaladas(s)) porClave.set(claveVersion(s, v).toLowerCase(), [s, v]);
    }
    for (const pid of todos) {
      const ruta = await d.rutaProceso(pid);
      if (ruta === null) {
        // Un proceso que ya salió no cuenta; uno vivo cuya ruta no se lee es una duda.
        if (await d.procesoVivo(pid)) throw new Error(`no se pudo leer la ruta del PID ${pid}`);
        continue;
      }
      const real = await rutaRealAprox(ruta);
      for (const candidata of [real, ruta]) {
        const v =
          versionDeEjecutable(candidata, bin) ??
          versionDeEjecutable(candidata, d.rutas.base + '/bin');
        const par = v ? porClave.get(claveVersion(v.servicio, v.version).toLowerCase()) : undefined;
        if (par) marcar(par[0], par[1], 'encendida');
      }
    }
  });

  return usos;
}
