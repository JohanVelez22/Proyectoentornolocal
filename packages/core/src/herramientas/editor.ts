import { buscarVsCode } from '../plataforma/vscodeWin';
import { lanzarSeparado, type LanzadorSeparado } from '../plataforma/terminalWin';

export { buscarVsCode } from '../plataforma/vscodeWin';

export const MENSAJE_SIN_VSCODE =
  'No se encontró Visual Studio Code. Instálelo (code.visualstudio.com) o agregue "code" al PATH.';

export interface DepsEditor {
  entorno?: NodeJS.ProcessEnv;
  existe?: (ruta: string) => boolean;
  lanzar?: LanzadorSeparado;
}

/**
 * Abre la carpeta en VS Code, con ventana propia (como "Terminal aquí") y la carpeta como un
 * argumento (sin shell). Quita ELECTRON_RUN_AS_NODE: con esa variable Code.exe correría como
 * Node en vez de abrir el editor.
 */
export async function abrirEnVsCode(carpeta: string, d: DepsEditor = {}): Promise<void> {
  const exe = buscarVsCode(d);
  if (!exe) throw new Error(MENSAJE_SIN_VSCODE);
  const env: NodeJS.ProcessEnv = { ...(d.entorno ?? process.env) };
  for (const k of Object.keys(env)) {
    if (k.toUpperCase() === 'ELECTRON_RUN_AS_NODE') delete env[k];
  }
  await (d.lanzar ?? lanzarSeparado)(exe, [carpeta], { cwd: carpeta, env });
}
