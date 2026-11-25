import { realpath } from 'node:fs/promises';
import path from 'node:path';
import type { Plantilla } from '../proyectos/plantillas';
import type { Rutas } from '../rutas';
import { TIPOS_RUNTIME, type TipoRuntime } from '../runtimes/runtimes';
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
  /** Versiones de runtime con las que corre un proyecto (el mismo resolutor de Terminal). */
  runtimesDe: (sitio: Sitio) => Promise<Partial<Record<TipoRuntime, string | undefined>>>;
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

export async function calcularUsos(d: DepsUsoVersiones): Promise<UsosVersiones> {
  const usos: UsosVersiones = new Map();
  const instaladasCache = new Map<string, string[]>();
  const instaladas = async (s: ServicioVersiones): Promise<string[]> => {
    if (!instaladasCache.has(s)) instaladasCache.set(s, await d.instaladas(s).catch(() => []));
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
    for (const s of sitios) {
      const motivo: MotivoBloqueo = (s.tareas ?? []).length > 0 ? 'tarea' : 'runtime';
      await paso(RUNTIMES_LIMPIABLES, async () => {
        const res = await d.runtimesDe(s);
        for (const tipo of RUNTIMES_LIMPIABLES) {
          marcar(tipo, res[tipo], motivo);
          marcar(tipo, s.runtimes?.[tipo], motivo);
        }
      });
    }

    // Plantillas: la rama de PHP y los runtimes que fijan.
    await paso(['php', ...RUNTIMES_LIMPIABLES], async () => {
      for (const p of await d.plantillas()) {
        marcar('php', p.php, 'plantilla');
        for (const tipo of RUNTIMES_LIMPIABLES) marcar(tipo, p.runtimes?.[tipo], 'plantilla');
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
      const real = await realpath(ruta).catch(() => ruta);
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
