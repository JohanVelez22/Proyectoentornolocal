import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ARG_HUMO, carpetaDeHumo } from '../src/main/carpetaHumo';

/** D51 (M3): el gancho que deja a la prueba de humo «elegir» una carpeta sin diálogo. */
const raiz = mkdtempSync(join(tmpdir(), 'pel-d51-humo-'));
afterAll(() => rmSync(raiz, { recursive: true, force: true }));
const valida = join(tmpdir(), 'wolfcore-humo-disco-prueba');
mkdirSync(valida, { recursive: true });
afterAll(() => rmSync(valida, { recursive: true, force: true }));
const fuera = join(raiz, 'otra');
mkdirSync(fuera);
const mal = join(tmpdir(), 'otro-nombre-prueba');
mkdirSync(mal, { recursive: true });
afterAll(() => rmSync(mal, { recursive: true, force: true }));

const env = (c: string | undefined, datos: string | null = 'C:\\datos') => ({
  ...(datos ? { WOLFCORE_DATOS: datos } : {}),
  ...(c ? { WOLFCORE_HUMO_CARPETA: c } : {}),
});

describe('carpetaDeHumo', () => {
  it('con las tres condiciones devuelve la carpeta', async () => {
    expect(await carpetaDeHumo(env(valida), ['x', ARG_HUMO])).toBe(valida);
  });

  it('sin WOLFCORE_DATOS, sin el argumento o sin variable no hace nada', async () => {
    expect(await carpetaDeHumo(env(valida, null), ['x', ARG_HUMO])).toBeNull();
    expect(await carpetaDeHumo(env(valida), ['x'])).toBeNull();
    expect(await carpetaDeHumo(env(undefined), ['x', ARG_HUMO])).toBeNull();
  });

  it('rechaza una carpeta fuera de la temporal o sin el prefijo de la prueba', async () => {
    expect(await carpetaDeHumo(env(fuera), ['x', ARG_HUMO])).toBeNull();
    expect(await carpetaDeHumo(env(mal), ['x', ARG_HUMO])).toBeNull();
    expect(await carpetaDeHumo(env(tmpdir()), ['x', ARG_HUMO])).toBeNull();
    expect(await carpetaDeHumo(env('C:\\Windows'), ['x', ARG_HUMO])).toBeNull();
    expect(
      await carpetaDeHumo(env(join(valida, '..', 'otro-nombre-prueba')), ['x', ARG_HUMO]),
    ).toBeNull();
  });

  it('una carpeta que no existe no se acepta', async () => {
    expect(
      await carpetaDeHumo(env(join(tmpdir(), 'wolfcore-humo-disco-no-existe')), ['x', ARG_HUMO]),
    ).toBeNull();
  });
});
