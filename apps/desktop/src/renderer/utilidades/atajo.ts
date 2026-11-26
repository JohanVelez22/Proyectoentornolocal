/**
 * Convierte una pulsación de teclas en un atajo global de Electron (`Ctrl+Alt+Shift+S`) para el
 * selector de Ajustes. Devuelve null si falta un modificador o la tecla no sirve (solo letras,
 * dígitos y F1-F24); el núcleo valida el resultado (exige Ctrl o Super, rechaza AltGr y los atajos comunes).
 */
export interface PulsacionTeclado {
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export function atajoDePulsacion(p: PulsacionTeclado): string | null {
  const tecla =
    /^Key([A-Z])$/.exec(p.code)?.[1] ??
    /^Digit([0-9])$/.exec(p.code)?.[1] ??
    /^(F(?:[1-9]|1[0-9]|2[0-4]))$/.exec(p.code)?.[1];
  if (!tecla) return null;
  const mods = [
    p.ctrlKey && 'Ctrl',
    p.altKey && 'Alt',
    p.shiftKey && 'Shift',
    p.metaKey && 'Super',
  ].filter((m): m is string => typeof m === 'string');
  return mods.length === 0 ? null : [...mods, tecla].join('+');
}
