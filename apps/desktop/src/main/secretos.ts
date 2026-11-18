import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { validarToken } from '@pel/core';

/** Lo que se usa de `safeStorage` de Electron (en las pruebas, uno falso). */
export interface CifradoSeguro {
  isEncryptionAvailable(): boolean;
  encryptString(texto: string): Buffer;
  decryptString(cifrado: Buffer): string;
}

export const MENSAJE_SIN_CIFRADO =
  'El cifrado de Windows (safeStorage) no está disponible: no se puede guardar ni leer el token de GitHub.';
export const MENSAJE_TOKEN_ILEGIBLE =
  'No se pudo descifrar el token de GitHub guardado: bórrelo y vuelva a guardarlo.';

/**
 * Token de GitHub cifrado con safeStorage en etc/github.token. Solo lo usa el proceso principal:
 * nunca va al renderer, a config.json, a los registros ni a los eventos. Los errores nunca
 * repiten el token.
 */
export class SecretosGithub {
  constructor(
    private readonly ruta: string,
    private readonly cifrado: CifradoSeguro,
  ) {}

  private exigirCifrado(): void {
    if (!this.cifrado.isEncryptionAvailable()) throw new Error(MENSAJE_SIN_CIFRADO);
  }

  /** Valida (sin repetirlo en el error) y guarda el token cifrado, de forma atómica. */
  async guardarTokenGithub(token: string): Promise<void> {
    const t = typeof token === 'string' ? token.trim() : '';
    validarToken(t);
    this.exigirCifrado();
    const datos = this.cifrado.encryptString(t);
    await mkdir(dirname(this.ruta), { recursive: true });
    const tmp = `${this.ruta}.${randomBytes(4).toString('hex')}.tmp`;
    try {
      await writeFile(tmp, datos, { mode: 0o600 });
      await rename(tmp, this.ruta);
    } catch (e) {
      await rm(tmp, { force: true });
      throw e;
    }
  }

  /** El token descifrado, o null si no hay ninguno guardado. */
  async leerTokenGithub(): Promise<string | null> {
    let datos: Buffer;
    try {
      datos = await readFile(this.ruta);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw new Error('No se pudo leer el token de GitHub guardado.');
    }
    this.exigirCifrado();
    try {
      return this.cifrado.decryptString(datos);
    } catch {
      throw new Error(MENSAJE_TOKEN_ILEGIBLE);
    }
  }

  async borrarTokenGithub(): Promise<void> {
    await rm(this.ruta, { force: true });
  }

  /** Solo dice si hay un token guardado (nunca lo devuelve). */
  hayTokenGithub(): boolean {
    return existsSync(this.ruta);
  }
}

/** Para pruebas o si no hay safeStorage: nunca guarda ni devuelve nada. */
export const SECRETOS_NO_DISPONIBLES: Pick<
  SecretosGithub,
  'guardarTokenGithub' | 'leerTokenGithub' | 'borrarTokenGithub' | 'hayTokenGithub'
> = {
  guardarTokenGithub: async () => {
    throw new Error(MENSAJE_SIN_CIFRADO);
  },
  leerTokenGithub: async () => null,
  borrarTokenGithub: async () => undefined,
  hayTokenGithub: () => false,
};
