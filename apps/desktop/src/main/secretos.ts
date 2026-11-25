import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { finalDeClave, ID_PROVEEDOR_IA, ID_PROVEEDOR_SMTP, validarToken } from '@pel/core';

/** Lo que se usa de `safeStorage` de Electron (en las pruebas, uno falso). */
export interface CifradoSeguro {
  isEncryptionAvailable(): boolean;
  encryptString(texto: string): Buffer;
  decryptString(cifrado: Buffer): string;
  /**
   * Solo en Linux: el respaldo elegido. 'basic_text' = sin llavero (cifra con una clave fija,
   * equivale a texto plano): se rechaza.
   */
  getSelectedStorageBackend?(): string;
}

/**
 * `github` (token de GitHub), `ia:<id del proveedor>` (clave de un proveedor de IA),
 * `bd:<id del sitio>` (clave del usuario propio de la base de un proyecto) o
 * `smtp:<id del proveedor>` (clave de un proveedor SMTP remoto).
 */
export type IdSecreto = 'github' | `ia:${string}` | `bd:${string}` | `smtp:${string}`;

/** Lo único que ve el renderer de un secreto: si hay uno y sus 4 últimos caracteres. */
export interface EstadoSecreto {
  configurada: boolean;
  final: string | null;
}

export const MENSAJE_SIN_CIFRADO =
  'El cifrado del sistema (safeStorage) no está disponible: no se pueden guardar ni leer las claves.';
export const MENSAJE_TOKEN_ILEGIBLE =
  'No se pudo descifrar la clave guardada: bórrela y vuelva a guardarla.';
const MENSAJE_ID = 'Identificador de secreto no válido.';
const MENSAJE_VALOR =
  'La clave no tiene un formato válido: sin espacios ni saltos de línea y de hasta 4096 caracteres.';

/** ASCII visible, sin espacios: así nunca puede inyectar cabeceras ni líneas de un .env. */
const VALOR_VALIDO = /^[\x21-\x7e]{1,4096}$/;
/** Las claves SMTP admiten espacios internos (p. ej. las contraseñas de aplicación de Google). */
const VALOR_SMTP = /^[\x21-\x7e]([\x20-\x7e]{0,4094}[\x21-\x7e])?$/;

/** Ids de sitio (el slug del dominio): minúsculas, números y guiones. */
const ID_SITIO_BD = /^[a-z0-9][a-z0-9-]{0,127}$/;

/** `github` → `github.bin`; `ia:openai` → `ia-openai.bin`. Lanza si el id no es válido. */
function archivoDe(id: IdSecreto): string {
  if (id === 'github') return 'github.bin';
  if (typeof id === 'string' && id.startsWith('ia:') && ID_PROVEEDOR_IA.test(id.slice(3))) {
    return `ia-${id.slice(3)}.bin`;
  }
  if (typeof id === 'string' && id.startsWith('bd:') && ID_SITIO_BD.test(id.slice(3))) {
    return `bd-${id.slice(3)}.bin`;
  }
  if (typeof id === 'string' && id.startsWith('smtp:') && ID_PROVEEDOR_SMTP.test(id.slice(5))) {
    return `smtp-${id.slice(5)}.bin`;
  }
  throw new Error(MENSAJE_ID);
}

/**
 * Almacén de secretos del proceso principal: cada uno cifrado con safeStorage en
 * `etc/secretos/<id-saneado>.bin`. Nunca van al renderer, a config.json, a los registros ni a
 * los eventos; los errores nunca repiten el valor. El token de GitHub que antes vivía en
 * `etc/github.token` se sigue leyendo y pasa solo al almacén nuevo la primera vez.
 */
export class AlmacenSecretos {
  private cola: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly carpeta: string,
    /** Ubicación vieja del token de GitHub (etc/github.token), para migrarlo. */
    private readonly tokenGithubViejo: string | null,
    private readonly cifrado: CifradoSeguro,
  ) {}

  /** Una escritura, migración o borrado a la vez. */
  private serializar<T>(fn: () => Promise<T>): Promise<T> {
    const r = this.cola.then(fn, fn);
    this.cola = r.catch(() => undefined);
    return r;
  }

  private exigirCifrado(): void {
    if (!this.cifrado.isEncryptionAvailable()) throw new Error(MENSAJE_SIN_CIFRADO);
    let respaldo: string | undefined;
    try {
      respaldo = this.cifrado.getSelectedStorageBackend?.();
    } catch {
      // Fuera de Linux puede no existir o fallar: no aplica.
    }
    if (respaldo === 'basic_text') throw new Error(MENSAJE_SIN_CIFRADO);
  }

  /**
   * ¿Se pueden guardar secretos? No si safeStorage no cifra o, en Linux, usa `basic_text` (sin
   * llavero). Se mira antes de crear algo que dependa de una clave guardada.
   */
  disponible(): boolean {
    try {
      this.exigirCifrado();
      return true;
    } catch {
      return false;
    }
  }

  private ruta(id: IdSecreto): string {
    return path.join(this.carpeta, archivoDe(id));
  }

  private async escribirAtomico(destino: string, datos: Buffer): Promise<void> {
    await mkdir(path.dirname(destino), { recursive: true });
    const tmp = `${destino}.${randomBytes(4).toString('hex')}.tmp`;
    try {
      await writeFile(tmp, datos, { mode: 0o600 });
      await rename(tmp, destino);
    } catch (e) {
      await rm(tmp, { force: true });
      throw e;
    }
  }

  /** Bytes cifrados del secreto, o null si no hay. */
  private async bytes(ruta: string): Promise<Buffer | null> {
    try {
      return await readFile(ruta);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw new Error('No se pudo leer la clave guardada.');
    }
  }

  private descifrar(datos: Buffer): string {
    this.exigirCifrado();
    try {
      return this.cifrado.decryptString(datos);
    } catch {
      throw new Error(MENSAJE_TOKEN_ILEGIBLE);
    }
  }

  /** Valida (sin repetirlo en el error) y guarda el secreto cifrado, de forma atómica. */
  async guardar(id: IdSecreto, valor: string): Promise<void> {
    const destino = this.ruta(id);
    const v = typeof valor === 'string' ? valor.trim() : '';
    if (id === 'github') validarToken(v);
    else if (!(id.startsWith('smtp:') ? VALOR_SMTP : VALOR_VALIDO).test(v)) {
      throw new Error(MENSAJE_VALOR);
    }
    this.exigirCifrado();
    const datos = this.cifrado.encryptString(v);
    await this.serializar(async () => {
      await this.escribirAtomico(destino, datos);
      if (id === 'github' && this.tokenGithubViejo)
        await rm(this.tokenGithubViejo, { force: true });
    });
  }

  /** El secreto descifrado, o null si no hay ninguno guardado. */
  async leer(id: IdSecreto): Promise<string | null> {
    const ruta = this.ruta(id);
    const datos = await this.bytes(ruta);
    if (datos !== null) return this.descifrar(datos);
    if (id !== 'github' || !this.tokenGithubViejo) return null;
    return this.migrarTokenGithub(ruta, this.tokenGithubViejo);
  }

  /**
   * Pasa el token de etc/github.token al almacén nuevo: solo si se puede descifrar (si no, el
   * archivo viejo queda como estaba), primero copia los mismos bytes y después borra el viejo.
   */
  private migrarTokenGithub(ruta: string, viejo: string): Promise<string | null> {
    return this.serializar(async () => {
      const nuevo = await this.bytes(ruta);
      if (nuevo !== null) return this.descifrar(nuevo);
      const datos = await this.bytes(viejo);
      if (datos === null) return null;
      const token = this.descifrar(datos);
      await this.escribirAtomico(ruta, datos);
      await rm(viejo, { force: true });
      return token;
    });
  }

  async borrar(id: IdSecreto): Promise<void> {
    const ruta = this.ruta(id);
    await this.serializar(async () => {
      await rm(ruta, { force: true });
      if (id === 'github' && this.tokenGithubViejo)
        await rm(this.tokenGithubViejo, { force: true });
    });
  }

  /** Solo dice si hay uno guardado (nunca lo devuelve). */
  hay(id: IdSecreto): boolean {
    if (existsSync(this.ruta(id))) return true;
    return id === 'github' && !!this.tokenGithubViejo && existsSync(this.tokenGithubViejo);
  }

  /**
   * Lo que puede ver el renderer: si hay uno y sus 4 últimos caracteres. Si no se puede
   * descifrar, sigue configurado pero sin final.
   */
  async estado(id: IdSecreto): Promise<EstadoSecreto> {
    if (!this.hay(id)) return { configurada: false, final: null };
    try {
      return { configurada: true, final: finalDeClave(await this.leer(id)) };
    } catch {
      return { configurada: true, final: null };
    }
  }

  // ---- Token de GitHub (nombres que ya usa el IPC) ----

  guardarTokenGithub(token: string): Promise<void> {
    return this.guardar('github', token);
  }

  leerTokenGithub(): Promise<string | null> {
    return this.leer('github');
  }

  borrarTokenGithub(): Promise<void> {
    return this.borrar('github');
  }

  hayTokenGithub(): boolean {
    return this.hay('github');
  }
}

/** Para pruebas o si no hay safeStorage: nunca guarda ni devuelve nada. */
export const SECRETOS_NO_DISPONIBLES: Pick<
  AlmacenSecretos,
  | 'guardar'
  | 'leer'
  | 'borrar'
  | 'hay'
  | 'estado'
  | 'guardarTokenGithub'
  | 'leerTokenGithub'
  | 'borrarTokenGithub'
  | 'hayTokenGithub'
  | 'disponible'
> = {
  disponible: () => false,
  guardar: async () => {
    throw new Error(MENSAJE_SIN_CIFRADO);
  },
  leer: async () => null,
  borrar: async () => undefined,
  hay: () => false,
  estado: async () => ({ configurada: false, final: null }),
  guardarTokenGithub: async () => {
    throw new Error(MENSAJE_SIN_CIFRADO);
  },
  leerTokenGithub: async () => null,
  borrarTokenGithub: async () => undefined,
  hayTokenGithub: () => false,
};
