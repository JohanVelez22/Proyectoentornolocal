import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'vitest';

const creadas: string[] = [];

// Cada prueba que importa este módulo borra sus carpetas temporales al terminar.
afterEach(async () => {
  for (const d of creadas.splice(0)) await rm(d, { recursive: true, force: true });
});

/** Crea una carpeta temporal `pel-…` que se borra sola tras la prueba. */
export async function carpetaTemporal(prefijo: string): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), prefijo));
  creadas.push(d);
  return d;
}
