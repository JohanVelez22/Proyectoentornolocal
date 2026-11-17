import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Rutas, SitioSchema, UrlBase } from '@pel/core';
import { registrarFinDeSesion } from '../src/main/sesion';

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
