import type { IdEditor, ResultadoAbrirEditor } from '../../shared/api';
import { textos } from '../i18n';

/** Nombres de marca de los editores (no se traducen). */
export const NOMBRES_EDITOR: Record<IdEditor, string> = {
  vscode: 'Visual Studio Code',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  phpstorm: 'PhpStorm',
  sublime: 'Sublime Text',
  zed: 'Zed',
  notepadpp: 'Notepad++',
};

/** Aviso cuando el predeterminado ya no estaba instalado y se abrió con otro; null si no hubo. */
export function avisoEditorSustituido(r: ResultadoAbrirEditor | null | undefined): string | null {
  if (!r?.sustituyo) return null;
  return textos.editorSitio.sustituido(NOMBRES_EDITOR[r.sustituyo], r.editor.nombre);
}
