import { realpathSync } from 'node:fs';
import { nombreDeRuta } from '../rutas/nombreDeRuta';
import type { ProcesoUsuario } from '../plataforma/tipos';

/**
 * Qué procesos están protegidos al liberar memoria (D36, reutilizado en D54b). Reglas que no se
 * negocian: lo protegido nunca entra en una selección, ante cualquier duda (ruta ilegible, otro
 * usuario, otra sesión, servicio, elevado) se protege, y aquí no hay forma de terminar un proceso.
 * `liberarMemoria.ts` elige por PID y propietario; los nombres de aquí son una barrera adicional.
 */

/** Nombres (sin extensión, en minúsculas) que nunca se proponen: sistema, shell y seguridad. */
export const NOMBRES_PROTEGIDOS: readonly string[] = [
  'explorer',
  'dwm',
  'csrss',
  'winlogon',
  'svchost',
  'system',
  'idle',
  'registry',
  'smss',
  'wininit',
  'services',
  'lsass',
  'lsaiso',
  'fontdrvhost',
  'sihost',
  'taskhostw',
  'ctfmon',
  'runtimebroker',
  'searchhost',
  'searchindexer',
  'startmenuexperiencehost',
  'shellexperiencehost',
  'textinputhost',
  'applicationframehost',
  'securityhealthsystray',
  'securityhealthservice',
  'msmpeng',
  'nissrv',
  'memcompression',
  'audiodg',
  'spoolsv',
  'conhost',
  'wolfcore dev',
  'wolfcore-dev',
  'wolfcoredev',
];

/** Fragmentos que, en cualquier parte de la ruta o del nombre, dejan el proceso protegido. */
const FRAGMENTOS_PROTEGIDOS: readonly string[] = ['flyenv', 'phpwebstudy', 'windows defender'];

/** Ruta en minúsculas y con `/`, sin prefijos de ruta larga ni barra final: para comparar rutas. */
function normalizar(ruta: string): string {
  return ruta
    .replace(/^\\\\\?\\UNC\\/i, '\\\\')
    .replace(/^\\\\\?\\/, '')
    .replace(/^\\\?\?\\/, '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function dentroDe(ruta: string, carpeta: string): boolean {
  const r = normalizar(ruta);
  const c = normalizar(carpeta);
  return c !== '' && (r === c || r.startsWith(`${c}/`));
}

/** Cada carpeta y, si existe, su ruta real (enlaces y uniones resueltos): se protegen ambas. */
export function conReales(rutas: string[]): string[] {
  const res = new Set<string>();
  for (const r of rutas) {
    if (r === '') continue;
    res.add(r);
    try {
      res.add(realpathSync.native(r));
    } catch {
      // No existe (o no se puede resolver): queda la ruta tal cual.
    }
  }
  return [...res];
}

function nombreBase(nombre: string): string {
  return nombre.toLowerCase().replace(/\.[a-z0-9]{1,4}$/, '');
}

/** FlyEnv y PhpWebStudy: por su nombre o su ruta. Son raíces cuyo árbol también se protege. */
export function esFlyEnv(p: ProcesoUsuario): boolean {
  const ruta = (p.ruta ?? '').toLowerCase();
  const nombre = p.nombre.toLowerCase();
  return ['flyenv', 'phpwebstudy'].some((f) => ruta.includes(f) || nombre.includes(f));
}

/** Lo que hace falta saber para decidir si un proceso está protegido. */
export interface ContextoProteccion {
  usuario: string;
  sesion: number;
  rutasSistema: string[];
  rutasPropias: string[];
  /** PIDs de WolfCore Dev y de todos sus descendientes. */
  pidsPropios: ReadonlySet<number>;
  /** PIDs de FlyEnv / PhpWebStudy y de todos sus descendientes. */
  pidsFlyEnv?: ReadonlySet<number>;
}

/**
 * Motivo por el que un proceso está protegido, o null si se puede proponer. Ante cualquier duda
 * (ruta ilegible, otro usuario, otra sesión, servicio, elevado) se protege.
 */
export function motivoProtegido(p: ProcesoUsuario, c: ContextoProteccion): string | null {
  if (!Number.isInteger(p.pid) || p.pid <= 4) return 'sistema';
  if (c.pidsPropios.has(p.pid)) return 'wolfcore';
  if (c.pidsFlyEnv?.has(p.pid)) return 'protegido';
  if (p.usuario !== c.usuario) return 'otro-usuario';
  if (p.sesion !== c.sesion) return 'otra-sesion';
  if (p.servicio === true) return 'servicio';
  if (p.elevado === true) return 'elevado';
  if (p.ruta === null || p.ruta === '') return 'sin-ruta';
  if (NOMBRES_PROTEGIDOS.includes(nombreBase(p.nombre))) return 'sistema';
  const rutaMin = p.ruta.toLowerCase();
  const nombreMin = p.nombre.toLowerCase();
  for (const f of FRAGMENTOS_PROTEGIDOS) {
    if (rutaMin.includes(f) || nombreMin.includes(f)) return 'protegido';
  }
  if (NOMBRES_PROTEGIDOS.includes(nombreBase(nombreDeRuta(p.ruta)))) {
    return 'sistema';
  }
  for (const s of c.rutasSistema) if (dentroDe(p.ruta, s)) return 'sistema';
  for (const s of c.rutasPropias) if (dentroDe(p.ruta, s)) return 'wolfcore';
  return null;
}
