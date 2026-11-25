import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Rutas, SitioSchema, UrlBase } from '@pel/core';
import {
  carpetaDatosDeEntorno,
  registrarFinDeSesion,
  topeCierre,
  usarCarpetaDatos,
} from '../src/main/sesion';
import { idiomaDeLocale, textosMain } from '../src/main/textos';

let base: string;
let carpeta: string;
let rutas: Rutas;

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-sesion-'));
  carpeta = path.join(base, 'Proyecto cliente');
  mkdirSync(carpeta);
  rutas = new Rutas(path.join(base, 'datos'));
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

async function tunelAbierto(original: Buffer): Promise<void> {
  writeFileSync(path.join(carpeta, '.env'), original);
  const ub = new UrlBase({
    rutas,
    ejecutor: async () => ({ codigo: 0, stdout: '', stderr: '' }),
  });
  const sitio = SitioSchema.parse({
    id: 'cli',
    nombre: 'Cliente',
    dominio: 'cli.test',
    carpeta,
    tipo: 'estatico',
    urlBaseVar: 'APP_URL',
  });
  await ub.aplicar(sitio, 'https://x.trycloudflare.com/');
}

describe('registrarFinDeSesion', () => {
  const original = Buffer.from('APP_NAME=Cliente\r\nAPP_URL="http://cli.test"\r\nSECRETO=1');

  it('query-session-end devuelve el .env de forma síncrona y no apaga los procesos', async () => {
    await tunelAbierto(original);
    const v = new EventEmitter();
    const apagar = vi.fn();
    registrarFinDeSesion(v, () => rutas, apagar);
    v.emit('query-session-end');
    // Sin await: el .env ya está restaurado al volver del emit.
    expect(readFileSync(path.join(carpeta, '.env')).equals(original)).toBe(true);
    expect(apagar).not.toHaveBeenCalled();
  });

  it('session-end restaura el .env antes de apagar', async () => {
    await tunelAbierto(original);
    const v = new EventEmitter();
    let envAlApagar: Buffer | null = null;
    registrarFinDeSesion(
      v,
      () => rutas,
      () => {
        envAlApagar = readFileSync(path.join(carpeta, '.env'));
      },
    );
    v.emit('session-end');
    expect(envAlApagar).not.toBeNull();
    expect(envAlApagar!.equals(original)).toBe(true);
  });

  it('si la restauración lanza, igual intenta apagar', () => {
    const v = new EventEmitter();
    const apagar = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    registrarFinDeSesion(
      v,
      () => rutas,
      apagar,
      () => {
        throw new Error('boom');
      },
    );
    v.emit('session-end');
    expect(apagar).toHaveBeenCalled();
  });
});

describe('topeCierre', () => {
  it('fin de sesión: 5 s; salida normal: más margen para el apagado limpio en paralelo', () => {
    expect(topeCierre(true)).toBe(5_000);
    expect(topeCierre(false)).toBeGreaterThanOrEqual(15_000);
  });
});

describe('WOLFCORE_DATOS (D26)', () => {
  // La carpeta "real" de la prueba es una temporal: nunca se mira la de %LOCALAPPDATA%.
  const real = (): string => path.join(base, 'real', 'WolfCoreDev');

  it('sin la variable, null y userData no cambia', () => {
    expect(carpetaDatosDeEntorno({}, real())).toBeNull();
    expect(carpetaDatosDeEntorno({ WOLFCORE_DATOS: '  ' }, real())).toBeNull();
  });

  it('con la variable, el núcleo recibe esa base y userData pasa a <base>/electron', () => {
    const otra = path.join(base, 'pc-nuevo');
    const elegida = carpetaDatosDeEntorno({ WOLFCORE_DATOS: otra }, real());
    expect(elegida).toBe(otra);
    const setPath = vi.fn();
    expect(usarCarpetaDatos({ setPath }, elegida!)).toBe(path.join(otra, 'electron'));
    expect(setPath).toHaveBeenCalledWith('userData', path.join(otra, 'electron'));
  });

  it('rechaza una ruta relativa, una del sistema y la carpeta real (o una que la contenga)', () => {
    for (const mala of [
      'datos-relativos',
      path.join(real()),
      path.join(real(), 'sub'),
      path.join(base, 'real'),
      String.raw`C:\Windows\Temp`,
      '/etc/wolf',
    ]) {
      expect(() => carpetaDatosDeEntorno({ WOLFCORE_DATOS: mala }, real()), mala).toThrow(
        expect.objectContaining({ codigo: 'perfiles.carpeta_datos_invalida' }),
      );
    }
  });
});

describe('textos del diálogo de WOLFCORE_DATOS', () => {
  it('en los cuatro idiomas, con el idioma del sistema', () => {
    expect(idiomaDeLocale('es-CO')).toBe('es');
    expect(idiomaDeLocale('pt-BR')).toBe('pt');
    expect(idiomaDeLocale('fr-FR')).toBe('fr');
    expect(idiomaDeLocale('de-DE')).toBe('en');
    for (const i of ['es', 'en', 'pt', 'fr'] as const) {
      expect(textosMain(i).carpetaDatosInvalida).toContain('WOLFCORE_DATOS');
      expect(textosMain(i).carpetaDatosAislada.length).toBeGreaterThan(10);
    }
  });
});
