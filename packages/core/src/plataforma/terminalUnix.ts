import path from 'node:path';
import type { IdTerminal, TerminalDisponible } from './tipos';

/**
 * Terminales de Linux y macOS. Las usará la plataforma de esos sistemas (Etapa E); hasta entonces
 * son funciones puras con sus pruebas: qué buscar y con qué orden abrir cada una.
 */

interface DefTerminalUnix {
  id: IdTerminal;
  nombre: string;
  rutas: string[];
  /**
   * ¿El programa que se abre hereda el entorno de quien lo lanza? `open -a` (macOS) lo pide a
   * launchd y la ventana NO recibe nuestras variables: con variables hay que usar otra.
   */
  heredaEntorno: boolean;
  orden: (ruta: string, cwd: string) => { cmd: string; args: string[] };
}

const LINUX: DefTerminalUnix[] = [
  {
    id: 'sistema',
    nombre: 'Terminal del sistema',
    rutas: ['/usr/bin/x-terminal-emulator'],
    heredaEntorno: true,
    // La carpeta va como directorio de trabajo del proceso.
    orden: (ruta) => ({ cmd: ruta, args: [] }),
  },
  {
    id: 'gnome-terminal',
    nombre: 'GNOME Terminal',
    rutas: ['/usr/bin/gnome-terminal'],
    heredaEntorno: true,
    orden: (ruta, cwd) => ({ cmd: ruta, args: [`--working-directory=${cwd}`] }),
  },
  {
    id: 'konsole',
    nombre: 'Konsole',
    rutas: ['/usr/bin/konsole'],
    heredaEntorno: true,
    orden: (ruta, cwd) => ({ cmd: ruta, args: ['--workdir', cwd] }),
  },
];

const MACOS: DefTerminalUnix[] = [
  {
    id: 'sistema',
    nombre: 'Terminal',
    rutas: ['/System/Applications/Utilities/Terminal.app', '/Applications/Utilities/Terminal.app'],
    heredaEntorno: false,
    orden: (_ruta, cwd) => ({ cmd: '/usr/bin/open', args: ['-a', 'Terminal', cwd] }),
  },
  {
    id: 'iterm',
    nombre: 'iTerm2',
    rutas: ['/Applications/iTerm.app'],
    heredaEntorno: false,
    orden: (_ruta, cwd) => ({ cmd: '/usr/bin/open', args: ['-a', 'iTerm', cwd] }),
  },
];

const definiciones = (sistema: NodeJS.Platform): DefTerminalUnix[] =>
  sistema === 'darwin' ? MACOS : sistema === 'linux' ? LINUX : [];

/** Terminales de Linux o macOS instaladas (solo mira archivos). */
export function terminalesUnix(
  sistema: NodeJS.Platform,
  existe: (ruta: string) => boolean,
): TerminalDisponible[] {
  const res: TerminalDisponible[] = [];
  for (const d of definiciones(sistema)) {
    const ruta = d.rutas.find((r) => existe(r));
    if (ruta) res.push({ id: d.id, nombre: d.nombre, ruta });
  }
  return res;
}

/**
 * Orden para abrir `id` en `cwd` y si la ventana recibe el entorno de quien la lanza. null si esa
 * terminal no es de este sistema.
 */
export function ordenTerminalUnix(
  sistema: NodeJS.Platform,
  t: TerminalDisponible,
  cwd: string,
): { cmd: string; args: string[]; heredaEntorno: boolean } | null {
  const d = definiciones(sistema).find((x) => x.id === t.id);
  if (!d) return null;
  return { ...d.orden(t.ruta, path.posix.normalize(cwd)), heredaEntorno: d.heredaEntorno };
}
