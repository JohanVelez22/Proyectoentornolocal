import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rutas } from './rutas';
import { ConfigSchema, type Config } from './tipos';

export function configPorDefecto(): Config {
  return ConfigSchema.parse({});
}

export class Almacen {
  constructor(private readonly rutas: Rutas) {}

  async leer(): Promise<Config> {
    const archivo = this.rutas.config();
    let texto: string;
    try {
      texto = await readFile(archivo, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return configPorDefecto();
      throw e;
    }
    try {
      return ConfigSchema.parse(JSON.parse(texto.replace(/^\uFEFF/, '')));
    } catch {
      const fecha = new Date().toISOString().replace(/[:.]/g, '-');
      await rename(archivo, path.join(path.dirname(archivo), `config.corrupto-${fecha}.json`));
      return configPorDefecto();
    }
  }

  async guardar(c: Config): Promise<void> {
    const valido = ConfigSchema.parse(c);
    const archivo = this.rutas.config();
    await mkdir(path.dirname(archivo), { recursive: true });
    const tmp = `${archivo}.tmp`;
    await writeFile(tmp, JSON.stringify(valido, null, 2) + '\n', 'utf8');
    await rename(tmp, archivo);
  }
}
