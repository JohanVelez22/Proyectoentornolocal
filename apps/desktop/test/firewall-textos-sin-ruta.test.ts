import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * D55: la copia de las reglas quitadas del cortafuegos vive en el registro protegido
 * `HKLM\SOFTWARE\WolfCoreDev\\Cortafuegos`. Ningún texto de cara al usuario puede volver a decir
 * que se guarda en `etc/cortafuegos-quitadas.json`.
 */
const RAIZ = path.resolve(__dirname, '..');
const REPO = path.resolve(RAIZ, '..', '..');

function archivos(dir: string, ext: RegExp): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = path.join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta, ext));
    else if (ext.test(nombre)) salida.push(ruta);
  }
  return salida;
}

describe('textos del cortafuegos: sin la ruta antigua del archivo de copia', () => {
  const objetivos = [
    ...archivos(path.join(RAIZ, 'src', 'renderer', 'i18n'), /\.ts$/),
    path.join(RAIZ, 'src', 'main', 'textos.ts'),
    path.join(RAIZ, 'src', 'shared', 'textosAvisos.ts'),
    ...archivos(path.join(REPO, 'docs', 'manual'), /\.md$/),
  ];

  it('revisa los diccionarios de los 16 idiomas, los textos de main y el manual', () => {
    expect(objetivos.length).toBeGreaterThan(18);
  });

  for (const f of objetivos) {
    it(`${path.relative(REPO, f)} no menciona cortafuegos-quitadas`, () => {
      expect(readFileSync(f, 'utf8')).not.toMatch(/cortafuegos-quitadas/i);
    });
  }

  it('los 16 idiomas nombran el registro protegido (en su archivo, raíz o extra)', () => {
    const dir = path.join(RAIZ, 'src', 'renderer', 'i18n');
    // En el código fuente cada barra va doblada: «HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos».
    const clave = String.raw`WolfCoreDev\\Cortafuegos`;
    const con = archivos(dir, /\.ts$/).filter((f) => readFileSync(f, 'utf8').includes(clave));
    expect(con).toHaveLength(16);
  });
});
