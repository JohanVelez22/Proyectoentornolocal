import path from 'node:path';

/**
 * Entrada de desinstalación que rustup-init puede dejar en
 * `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Rustup`.
 */
export const CLAVE_DESINSTALAR_RUSTUP =
  'Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Rustup';

/**
 * ¿El `UninstallString` apunta a un programa dentro de `carpeta` (nuestra carpeta de datos)?
 * Acepta `"C:\ruta\rustup.exe" self uninstall` o la ruta sin comillas. Una ruta relativa, vacía o
 * que sale de la carpeta (`..`, otra unidad) no cuenta.
 */
export function desinstalarEnCarpeta(uninstall: string, carpeta: string): boolean {
  const t = uninstall.trim();
  const exe = (t.startsWith('"') ? /^"([^"]+)"/.exec(t)?.[1] : /^(.+?\.exe)\b/i.exec(t)?.[1]) ?? '';
  if (exe === '' || !path.win32.isAbsolute(exe) || exe.includes('..')) return false;
  const rel = path.win32.relative(path.win32.resolve(carpeta), path.win32.resolve(exe));
  return rel !== '' && !rel.startsWith('..') && !path.win32.isAbsolute(rel);
}
