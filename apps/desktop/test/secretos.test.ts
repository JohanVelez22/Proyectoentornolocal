import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MENSAJE_SIN_CIFRADO,
  MENSAJE_TOKEN_ILEGIBLE,
  SecretosGithub,
  type CifradoSeguro,
} from '../src/main/secretos';

const TOKEN = 'github_pat_FalsoDePrueba_1234567890abcdef';

/** Cifrado de juguete (invierte los bytes): basta para ver que no se escribe en claro. */
const cifrado = (disponible = true): CifradoSeguro => ({
  isEncryptionAvailable: () => disponible,
  encryptString: (t) => Buffer.from(t, 'utf8').reverse(),
  decryptString: (b) => {
    if (b.length === 0) throw new Error('vacío');
    return Buffer.from(b).reverse().toString('utf8');
  },
});

let dir: string;
let ruta: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-secretos-'));
  ruta = path.join(dir, 'etc', 'github.token');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('SecretosGithub', () => {
  it('guarda cifrado en etc/github.token y lo vuelve a leer', async () => {
    const s = new SecretosGithub(ruta, cifrado());
    expect(s.hayTokenGithub()).toBe(false);
    expect(await s.leerTokenGithub()).toBeNull();
    await s.guardarTokenGithub(`  ${TOKEN}\n`);
    expect(s.hayTokenGithub()).toBe(true);
    expect(readFileSync(ruta).toString('utf8')).not.toContain(TOKEN);
    expect(await s.leerTokenGithub()).toBe(TOKEN);
    await s.borrarTokenGithub();
    expect(existsSync(ruta)).toBe(false);
    expect(s.hayTokenGithub()).toBe(false);
  });

  it('sin safeStorage se niega con un mensaje en español y no escribe nada', async () => {
    const s = new SecretosGithub(ruta, cifrado(false));
    await expect(s.guardarTokenGithub(TOKEN)).rejects.toThrow(MENSAJE_SIN_CIFRADO);
    expect(existsSync(ruta)).toBe(false);
    writeFileSync(path.join(dir, 'x'), '');
    const conArchivo = new SecretosGithub(path.join(dir, 'x'), cifrado(false));
    await expect(conArchivo.leerTokenGithub()).rejects.toThrow(MENSAJE_SIN_CIFRADO);
  });

  it('un token no válido se rechaza sin repetirlo en el error', async () => {
    const s = new SecretosGithub(ruta, cifrado());
    const malo = 'ghp_abc def\r\nX-Inyectada: 1';
    const e = await s.guardarTokenGithub(malo).catch((x: unknown) => x as Error);
    expect(e).toBeInstanceOf(Error);
    expect((e as Error).message).not.toContain('ghp_abc');
    expect(existsSync(ruta)).toBe(false);
  });

  it('un archivo que no se puede descifrar da un mensaje claro', async () => {
    writeFileSync(path.join(dir, 'roto'), '');
    const s = new SecretosGithub(path.join(dir, 'roto'), cifrado());
    await expect(s.leerTokenGithub()).rejects.toThrow(MENSAJE_TOKEN_ILEGIBLE);
  });
});
