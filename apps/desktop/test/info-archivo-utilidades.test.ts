import { describe, expect, it } from 'vitest';
import { esRaizDeUnidad } from '../src/renderer/utilidades/infoArchivo';

describe('esRaizDeUnidad', () => {
  it('reconoce la raíz de una unidad de Windows y la raíz de POSIX', () => {
    for (const r of ['C:\\', 'd:/', 'X:', 'E:\\\\', '/']) expect(esRaizDeUnidad(r), r).toBe(true);
  });
  it('una carpeta o un archivo dentro de la unidad no es una raíz', () => {
    for (const r of ['C:\\Users', 'D:\\a\\b.txt', '/home', '/home/u', 'C:\\a\\']) {
      expect(esRaizDeUnidad(r), r).toBe(false);
    }
  });
});
