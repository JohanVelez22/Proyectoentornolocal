import { IDS_EDITOR, type IdEditor } from '../plataforma/tipos';

export { IDS_EDITOR } from '../plataforma/tipos';
export type { EditorDisponible, IdEditor } from '../plataforma/tipos';

export function esIdEditor(v: unknown): v is IdEditor {
  return typeof v === 'string' && (IDS_EDITOR as readonly string[]).includes(v);
}

/**
 * Argumentos (en lista, nunca por shell) para abrir `carpeta` o un archivo en una línea:
 * VS Code, Cursor y Windsurf `carpeta -g archivo:línea`; PhpStorm `--line n archivo`; Sublime y
 * Zed `archivo:línea`; Notepad++ `-n<línea> archivo`. Sin archivo se abre la carpeta (Notepad++
 * no abre carpetas: se lanza vacío, con la carpeta como directorio de trabajo).
 */
export function argsAbrir(
  id: IdEditor,
  carpeta: string,
  archivo?: { ruta: string; linea: number },
): string[] {
  switch (id) {
    case 'vscode':
    case 'cursor':
    case 'windsurf':
      return archivo ? [carpeta, '-g', `${archivo.ruta}:${archivo.linea}`] : [carpeta];
    case 'phpstorm':
      return archivo ? ['--line', String(archivo.linea), archivo.ruta] : [carpeta];
    case 'sublime':
    case 'zed':
      return [archivo ? `${archivo.ruta}:${archivo.linea}` : carpeta];
    case 'notepadpp':
      return archivo ? [`-n${archivo.linea}`, archivo.ruta] : [];
  }
}
