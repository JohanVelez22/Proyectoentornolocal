import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AlmacenSecretos,
  MENSAJE_SIN_CIFRADO,
  MENSAJE_TOKEN_ILEGIBLE,
  SECRETOS_NO_DISPONIBLES,
  type CifradoSeguro,
} from '../src/main/secretos';

const TOKEN = 'github_pat_FalsoDePrueba_1234567890abcdef';
/** Clave centinela de IA: claramente falsa; nunca debe salir en errores ni estados. */
const CLAVE = 'sk-falso-CENTINELA-0123456789abcdefWXYZ';

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
/** etc/secretos (almacén nuevo). */
let carpeta: string;
/** etc/github.token (ubicación vieja del token). */
let viejo: string;
/** Donde queda el token de GitHub en el almacén nuevo. */
let ruta: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-secretos-'));
  carpeta = path.join(dir, 'etc', 'secretos');
  viejo = path.join(dir, 'etc', 'github.token');
  ruta = path.join(carpeta, 'github.bin');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const almacen = (disponible = true): AlmacenSecretos =>
  new AlmacenSecretos(carpeta, viejo, cifrado(disponible));

const escribirViejo = (contenido: Buffer | string): void => {
  mkdirSync(path.dirname(viejo), { recursive: true });
  writeFileSync(viejo, contenido);
};

describe('AlmacenSecretos: token de GitHub', () => {
  it('guarda cifrado en etc/secretos/github.bin y lo vuelve a leer', async () => {
    const s = almacen();
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
    const s = almacen(false);
    await expect(s.guardarTokenGithub(TOKEN)).rejects.toThrow(MENSAJE_SIN_CIFRADO);
    expect(existsSync(ruta)).toBe(false);
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(ruta, 'x');
    await expect(s.leerTokenGithub()).rejects.toThrow(MENSAJE_SIN_CIFRADO);
  });

  it('un token no válido se rechaza sin repetirlo en el error', async () => {
    const s = almacen();
    const malo = 'ghp_abc def\r\nX-Inyectada: 1';
    const e = await s.guardarTokenGithub(malo).catch((x: unknown) => x as Error);
    expect(e).toBeInstanceOf(Error);
    expect((e as Error).message).not.toContain('ghp_abc');
    expect(existsSync(ruta)).toBe(false);
  });

  it('un archivo que no se puede descifrar da un mensaje claro', async () => {
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(ruta, '');
    await expect(almacen().leerTokenGithub()).rejects.toThrow(MENSAJE_TOKEN_ILEGIBLE);
  });
});

describe('AlmacenSecretos: migración del token viejo', () => {
  it('un etc/github.token existente sigue funcionando y pasa al almacén nuevo', async () => {
    escribirViejo(cifrado().encryptString(TOKEN));
    const s = almacen();
    expect(s.hayTokenGithub()).toBe(true);
    expect(await s.estado('github')).toEqual({ configurada: true, final: 'cdef' });
    expect(await s.leerTokenGithub()).toBe(TOKEN);
    expect(existsSync(ruta)).toBe(true);
    expect(existsSync(viejo)).toBe(false);
    expect(await s.leer('github')).toBe(TOKEN);
    // Otra instancia (el próximo arranque) lo lee del sitio nuevo.
    expect(await almacen().leerTokenGithub()).toBe(TOKEN);
  });

  it('un token viejo ilegible no se borra ni se copia', async () => {
    escribirViejo('');
    await expect(almacen().leerTokenGithub()).rejects.toThrow(MENSAJE_TOKEN_ILEGIBLE);
    expect(existsSync(viejo)).toBe(true);
    expect(existsSync(ruta)).toBe(false);
  });

  it('borrar quita también el archivo viejo', async () => {
    escribirViejo(cifrado().encryptString(TOKEN));
    const s = almacen();
    await s.borrarTokenGithub();
    expect(existsSync(viejo)).toBe(false);
    expect(s.hayTokenGithub()).toBe(false);
  });

  it('guardar uno nuevo reemplaza al viejo', async () => {
    escribirViejo(cifrado().encryptString(TOKEN));
    const s = almacen();
    await s.guardarTokenGithub('github_pat_FalsoNuevo_abcdefghijklmnop');
    expect(existsSync(viejo)).toBe(false);
    expect(await s.leerTokenGithub()).toBe('github_pat_FalsoNuevo_abcdefghijklmnop');
  });
});

describe('AlmacenSecretos: claves de IA', () => {
  it('guarda, lee, da el estado (solo los 4 finales) y borra', async () => {
    const s = almacen();
    expect(await s.estado('ia:openai')).toEqual({ configurada: false, final: null });
    await s.guardar('ia:openai', `  ${CLAVE}\n`);
    const archivo = path.join(carpeta, 'ia-openai.bin');
    expect(existsSync(archivo)).toBe(true);
    expect(readFileSync(archivo).toString('utf8')).not.toContain(CLAVE);
    expect(await s.leer('ia:openai')).toBe(CLAVE);
    const estado = await s.estado('ia:openai');
    expect(estado).toEqual({ configurada: true, final: 'WXYZ' });
    expect(JSON.stringify(estado)).not.toContain(CLAVE);
    await s.borrar('ia:openai');
    expect(await s.leer('ia:openai')).toBeNull();
    expect(readdirSync(carpeta)).toEqual([]);
  });

  it('cada proveedor tiene su archivo', async () => {
    const s = almacen();
    await s.guardar('ia:openai', 'sk-falso-uno-123456');
    await s.guardar('ia:compatible-groq', 'gsk_falso-dos-123456');
    expect(await s.leer('ia:openai')).toBe('sk-falso-uno-123456');
    expect(await s.leer('ia:compatible-groq')).toBe('gsk_falso-dos-123456');
  });

  it('rechaza ids que podrían salir de la carpeta', async () => {
    const s = almacen();
    for (const id of ['ia:../x', 'ia:', 'ia:a/b', 'otra', 'ia:A B', 'ia:a\\b']) {
      await expect(s.guardar(id as never, CLAVE), id).rejects.toThrow();
      await expect(s.leer(id as never), id).rejects.toThrow();
    }
    expect(existsSync(carpeta)).toBe(false);
  });

  it('una clave con saltos de línea, espacios, vacía o enorme se rechaza sin repetirla', async () => {
    const s = almacen();
    for (const v of [`${CLAVE}\r\nX-Inyectada: 1`, `${CLAVE} otra`, '   ', 'x'.repeat(5000)]) {
      const e = await s.guardar('ia:openai', v).catch((x: unknown) => x as Error);
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).not.toContain('CENTINELA');
    }
    expect(existsSync(path.join(carpeta, 'ia-openai.bin'))).toBe(false);
  });

  it('una clave guardada que no se puede descifrar sigue contando como configurada', async () => {
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(path.join(carpeta, 'ia-openai.bin'), '');
    expect(await almacen().estado('ia:openai')).toEqual({ configurada: true, final: null });
  });
});

describe('AlmacenSecretos: cifrado en texto plano (Linux sin llavero)', () => {
  it("con el respaldo 'basic_text' de safeStorage se niega a guardar y a leer", async () => {
    const plano: CifradoSeguro = { ...cifrado(), getSelectedStorageBackend: () => 'basic_text' };
    const s = new AlmacenSecretos(carpeta, viejo, plano);
    await expect(s.guardar('ia:openai', CLAVE)).rejects.toThrow(MENSAJE_SIN_CIFRADO);
    expect(existsSync(carpeta)).toBe(false);
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(path.join(carpeta, 'ia-openai.bin'), cifrado().encryptString(CLAVE));
    await expect(s.leer('ia:openai')).rejects.toThrow(MENSAJE_SIN_CIFRADO);
  });

  it('I3: disponible() dice si se puede guardar antes de crear nada (basic_text o sin cifrado: no)', () => {
    const plano: CifradoSeguro = { ...cifrado(), getSelectedStorageBackend: () => 'basic_text' };
    expect(new AlmacenSecretos(carpeta, viejo, plano).disponible()).toBe(false);
    expect(new AlmacenSecretos(carpeta, viejo, cifrado(false)).disponible()).toBe(false);
    const raro: CifradoSeguro = {
      ...cifrado(),
      getSelectedStorageBackend: () => {
        throw new Error('no aplica');
      },
    };
    expect(new AlmacenSecretos(carpeta, viejo, raro).disponible()).toBe(true);
    expect(new AlmacenSecretos(carpeta, viejo, cifrado()).disponible()).toBe(true);
    expect(SECRETOS_NO_DISPONIBLES.disponible()).toBe(false);
  });

  it('con un llavero real (gnome_libsecret) funciona', async () => {
    const llavero: CifradoSeguro = {
      ...cifrado(),
      getSelectedStorageBackend: () => 'gnome_libsecret',
    };
    const s = new AlmacenSecretos(carpeta, viejo, llavero);
    await s.guardar('ia:openai', CLAVE);
    expect(await s.leer('ia:openai')).toBe(CLAVE);
  });
});

describe('AlmacenSecretos: clave del usuario propio de la base de un proyecto', () => {
  const CENTINELA = 'centinela-secreta-d';

  it('guarda cifrada como bd-<sitio>.bin, da solo el final y borra', async () => {
    const s = almacen();
    await s.guardar('bd:mi-tienda', CENTINELA);
    const archivo = path.join(carpeta, 'bd-mi-tienda.bin');
    expect(existsSync(archivo)).toBe(true);
    expect(readFileSync(archivo).toString('utf8')).not.toContain(CENTINELA);
    expect(await s.leer('bd:mi-tienda')).toBe(CENTINELA);
    const estado = await s.estado('bd:mi-tienda');
    expect(estado.configurada).toBe(true);
    expect(JSON.stringify(estado)).not.toContain(CENTINELA);
    await s.borrar('bd:mi-tienda');
    expect(await s.leer('bd:mi-tienda')).toBeNull();
    expect(readdirSync(carpeta)).toEqual([]);
  });

  it('rechaza ids que podrían salir de la carpeta o no son de un sitio', async () => {
    const s = almacen();
    for (const id of ['bd:../x', 'bd:', 'bd:a/b', 'bd:A', 'bd:a b', 'bd:a\b', 'bd:.x']) {
      await expect(s.guardar(id as never, CENTINELA), id).rejects.toThrow();
      await expect(s.leer(id as never), id).rejects.toThrow();
    }
    expect(existsSync(carpeta)).toBe(false);
  });

  it('sin cifrado del sistema no se guarda ni se lee, y el error no repite la clave', async () => {
    const s = almacen(false);
    const e = await s.guardar('bd:mi-tienda', CENTINELA).catch((x: unknown) => x as Error);
    expect((e as Error).message).toBe(MENSAJE_SIN_CIFRADO);
    expect(existsSync(carpeta)).toBe(false);
  });
});

describe('AlmacenSecretos: clave de un proveedor SMTP remoto', () => {
  const CENTINELA = 'centinela-secreta-d';

  it('guarda cifrada como smtp-<id>.bin, la lee, da solo {configurada, final} y borra', async () => {
    const s = almacen();
    await s.guardar('smtp:resend', CENTINELA);
    const archivo = path.join(carpeta, 'smtp-resend.bin');
    expect(existsSync(archivo)).toBe(true);
    expect(readFileSync(archivo).toString('utf8')).not.toContain(CENTINELA);
    expect(await s.leer('smtp:resend')).toBe(CENTINELA);
    const estado = await s.estado('smtp:resend');
    expect(Object.keys(estado).sort()).toEqual(['configurada', 'final']);
    expect(estado.configurada).toBe(true);
    expect(JSON.stringify(estado)).not.toContain(CENTINELA);
    await s.borrar('smtp:resend');
    expect(await s.leer('smtp:resend')).toBeNull();
    expect(readdirSync(carpeta)).toEqual([]);
  });

  it('admite espacios internos (contraseñas de aplicación) pero no saltos ni espacios en los extremos', async () => {
    const s = almacen();
    await s.guardar('smtp:gmail', 'abcd efgh ijkl mnop');
    expect(await s.leer('smtp:gmail')).toBe('abcd efgh ijkl mnop');
    await s.guardar('smtp:gmail', '  con borde  ');
    expect(await s.leer('smtp:gmail')).toBe('con borde');
    for (const mala of ['a\nb', 'a\tb', '', '   ']) {
      await expect(s.guardar('smtp:gmail', mala), JSON.stringify(mala)).rejects.toThrow();
    }
    // Las claves de IA siguen sin admitir espacios.
    await expect(s.guardar('ia:openai', 'a b')).rejects.toThrow();
  });

  it('rechaza ids que podrían salir de la carpeta', async () => {
    const s = almacen();
    for (const id of ['smtp:../x', 'smtp:', 'smtp:a/b', 'smtp:A', 'smtp:a b', 'smtp:.x']) {
      await expect(s.guardar(id as never, CENTINELA), id).rejects.toThrow();
      await expect(s.leer(id as never), id).rejects.toThrow();
    }
    expect(existsSync(carpeta)).toBe(false);
  });

  it('sin cifrado del sistema no se guarda y el error no repite la clave', async () => {
    const s = almacen(false);
    const e = await s.guardar('smtp:resend', CENTINELA).catch((x: unknown) => x as Error);
    expect((e as Error).message).toBe(MENSAJE_SIN_CIFRADO);
    expect(existsSync(carpeta)).toBe(false);
  });
});

describe('AlmacenSecretos: credencial de un túnel (tunel:<proveedor>)', () => {
  const CENTINELA = 'centinela-secreta-d';
  const CRED = JSON.stringify({ AccountTag: 'abcdef0123456789', TunnelSecret: CENTINELA });

  it('guarda cifrada como tunel-<proveedor>-<túnel>.bin y solo da {configurada, final}', async () => {
    const s = almacen();
    await s.guardar('tunel:cloudflare-nombre:wolf-dev', CRED);
    const archivo = path.join(carpeta, 'tunel-cloudflare-nombre-wolf-dev.bin');
    expect(existsSync(archivo)).toBe(true);
    expect(readFileSync(archivo).toString('utf8')).not.toContain(CENTINELA);
    expect(await s.leer('tunel:cloudflare-nombre:wolf-dev')).toBe(CRED);
    const estado = await s.estado('tunel:cloudflare-nombre:wolf-dev');
    expect(Object.keys(estado).sort()).toEqual(['configurada', 'final']);
    expect(JSON.stringify(estado)).not.toContain(CENTINELA);
    await s.guardar('tunel:ngrok', 'ngrok-prueba-falsa');
    expect(existsSync(path.join(carpeta, 'tunel-ngrok.bin'))).toBe(true);
    await s.borrar('tunel:cloudflare-nombre:wolf-dev');
    expect(await s.leer('tunel:cloudflare-nombre:wolf-dev')).toBeNull();
  });

  it('rechaza ids que podrían salir de la carpeta o de otro proveedor', async () => {
    const s = almacen();
    for (const id of [
      'tunel:',
      'tunel:../x',
      'tunel:cloudflare-nombre:../x',
      'tunel:cloudflare-nombre:A',
      'tunel:otro',
      'tunel:ngrok:a/b',
    ]) {
      await expect(s.guardar(id as never, CENTINELA), id).rejects.toThrow();
      await expect(s.leer(id as never), id).rejects.toThrow();
    }
    expect(existsSync(carpeta)).toBe(false);
  });

  it('sin cifrado del sistema no se guarda y el error no repite la credencial', async () => {
    const s = almacen(false);
    const e = await s
      .guardar('tunel:cloudflare-nombre:wolf-dev', CRED)
      .catch((x: unknown) => x as Error);
    expect((e as Error).message).toBe(MENSAJE_SIN_CIFRADO);
    expect(existsSync(carpeta)).toBe(false);
  });
});
