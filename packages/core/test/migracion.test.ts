import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrarCarpetaDatos } from '../src/migracion';

let tmp: string;
const env = () => ({ XDG_DATA_HOME: tmp }) as NodeJS.ProcessEnv;
const vieja = () => path.join(tmp, 'Proyectoentornolocal');
const nueva = () => path.join(tmp, 'WolfCoreDev');
const existe = (p: string) =>
  stat(p).then(
    () => true,
    () => false,
  );

beforeEach(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'wcd-mig-'));
});
afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

describe('migrarCarpetaDatos', () => {
  it('renombra la carpeta vieja a la nueva si la nueva no existe', async () => {
    await mkdir(vieja());
    await writeFile(path.join(vieja(), 'config.json'), '{"a":1}');
    expect((await migrarCarpetaDatos(env(), 'linux')).resultado).toBe('migrada');
    expect(await existe(vieja())).toBe(false);
    expect(await readFile(path.join(nueva(), 'config.json'), 'utf8')).toBe('{"a":1}');
  });

  it('no hace nada si solo existe la nueva', async () => {
    await mkdir(nueva());
    expect((await migrarCarpetaDatos(env(), 'linux')).resultado).toBe('sin-cambios');
    expect(await existe(nueva())).toBe(true);
  });

  it('no hace nada si no existe ninguna', async () => {
    expect((await migrarCarpetaDatos(env(), 'linux')).resultado).toBe('sin-cambios');
    expect(await existe(nueva())).toBe(false);
  });

  it('omite la migración si existen las dos y no toca ninguna', async () => {
    await mkdir(vieja());
    await mkdir(nueva());
    await writeFile(path.join(vieja(), 'v.txt'), 'v');
    const r = await migrarCarpetaDatos(env(), 'linux');
    expect(r.resultado).toBe('omitida');
    expect(path.normalize(r.base)).toBe(nueva());
    expect(r.aviso).toMatch(/Existen las carpetas/);
    expect(await existe(path.join(vieja(), 'v.txt'))).toBe(true);
    expect(await existe(path.join(nueva(), 'v.txt'))).toBe(false);
  });

  it('si rename falla con EBUSY devuelve la carpeta vieja y no crea la nueva', async () => {
    await mkdir(vieja());
    const fs = {
      stat: (p: string) => stat(p),
      rename: () => Promise.reject(Object.assign(new Error('busy'), { code: 'EBUSY' })),
    };
    const r = await migrarCarpetaDatos(env(), 'linux', fs);
    expect(r.resultado).toBe('fallida');
    expect(path.normalize(r.base)).toBe(vieja());
    expect(r.aviso).toContain('EBUSY');
    expect(r.aviso).toContain('Cierre los servicios');
    expect(await existe(nueva())).toBe(false);
  });

  it('un error de stat distinto de ENOENT es fallida y no lanza', async () => {
    const fs = {
      stat: () => Promise.reject(Object.assign(new Error('x'), { code: 'EPERM' })),
      rename: () => Promise.resolve(),
    };
    const r = await migrarCarpetaDatos(env(), 'linux', fs);
    expect(r.resultado).toBe('fallida');
    expect(r.aviso).toContain('EPERM');
  });
});
