import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rutas } from './rutas';
import {
  ArchivoCredencialesSchema,
  ConfigSchema,
  CredencialesSchema,
  IDS_SERVICIO_DATOS,
  type ArchivoCredenciales,
  type ClaveCredencial,
  type Config,
  type Credenciales,
} from './tipos';

export function configPorDefecto(): Config {
  return ConfigSchema.parse({});
}

/**
 * Un config.json anterior a D21 no trae `correo.puertoSmtp`: el puerto SMTP que ya tenía Mailpit
 * pasa a ser el común (los `.env` de los proyectos siguen apuntando al mismo).
 */
export function heredarPuertoSmtp(crudo: unknown): unknown {
  if (!crudo || typeof crudo !== 'object') return crudo;
  const c = crudo as Record<string, unknown>;
  const correo = c['correo'];
  if (correo && typeof correo === 'object' && 'puertoSmtp' in correo) return crudo;
  const servicios = c['servicios'] as { datos?: { mailpit?: { puerto?: unknown } } } | undefined;
  const puerto = servicios?.datos?.mailpit?.puerto;
  if (typeof puerto !== 'number') return crudo;
  return {
    ...c,
    correo: { ...(correo && typeof correo === 'object' ? correo : {}), puertoSmtp: puerto },
  };
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
      return ConfigSchema.parse(heredarPuertoSmtp(JSON.parse(texto.replace(/^\uFEFF/, ''))));
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

type Encolar = <T>(fn: () => Promise<T>) => Promise<T>;

/**
 * Credenciales de los servicios propios en etc/credenciales.json: separadas de config.json para
 * que un config corrupto o reiniciado no las pierda y para que `config.leer` (expuesto a la UI)
 * nunca las devuelva. Las escrituras son atómicas y van en la cola indicada.
 */
export class AlmacenCredenciales {
  private cola: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly rutas: Rutas,
    /** Cola común con las escrituras de config.json; por defecto, una propia. */
    private readonly encolar?: Encolar,
  ) {}

  private serializar<T>(fn: () => Promise<T>): Promise<T> {
    if (this.encolar) return this.encolar(fn);
    const r = this.cola.then(fn, fn);
    this.cola = r.catch(() => undefined);
    return r;
  }

  async todas(): Promise<ArchivoCredenciales> {
    const archivo = this.rutas.credenciales();
    let texto: string;
    try {
      texto = await readFile(archivo, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw e;
    }
    try {
      return ArchivoCredencialesSchema.parse(JSON.parse(texto.replace(/^\uFEFF/, '')));
    } catch {
      // Se conserva una copia para poder recuperarlas a mano.
      const fecha = new Date().toISOString().replace(/[:.]/g, '-');
      await rename(
        archivo,
        path.join(path.dirname(archivo), `credenciales.corrupto-${fecha}.json`),
      );
      return {};
    }
  }

  async leer(id: ClaveCredencial): Promise<Credenciales | null> {
    return (await this.todas())[id] ?? null;
  }

  /** Guarda (o reemplaza) la credencial de `id`. */
  guardar(id: ClaveCredencial, c: Credenciales): Promise<void> {
    return this.serializar(async () => {
      const todas = await this.todas();
      await this.escribir({ ...todas, [id]: CredencialesSchema.parse(c) });
    });
  }

  /** Quita la credencial de `id` (si no existe, no hace nada). */
  borrar(id: ClaveCredencial): Promise<void> {
    return this.serializar(async () => {
      const todas = await this.todas();
      if (!(id in todas)) return;
      delete todas[id];
      await this.escribir(todas);
    });
  }

  /** Devuelve las guardadas o guarda y devuelve las que da `crear`. */
  obtenerOCrear(id: ClaveCredencial, crear: () => Credenciales): Promise<Credenciales> {
    return this.serializar(async () => {
      const todas = await this.todas();
      const actual = todas[id];
      if (actual) return actual;
      const nueva = CredencialesSchema.parse(crear());
      await this.escribir({ ...todas, [id]: nueva });
      return nueva;
    });
  }

  /** Agrega las que falten (las ya guardadas ganan). */
  importar(datos: ArchivoCredenciales): Promise<void> {
    return this.serializar(async () => {
      const todas = await this.todas();
      const final = { ...datos, ...todas };
      if (Object.keys(final).length === Object.keys(todas).length) return;
      await this.escribir(final);
    });
  }

  private async escribir(datos: ArchivoCredenciales): Promise<void> {
    const archivo = this.rutas.credenciales();
    await mkdir(path.dirname(archivo), { recursive: true });
    const tmp = `${archivo}.tmp`;
    const texto = JSON.stringify(ArchivoCredencialesSchema.parse(datos), null, 2) + '\n';
    await writeFile(tmp, texto, 'utf8');
    await rename(tmp, archivo);
  }
}

/**
 * Una sola vez: mueve las credenciales que una versión anterior guardó en config.json a
 * etc/credenciales.json y las quita de config.json. Si config.json no se puede leer, no lo toca.
 */
export async function migrarCredenciales(
  rutas: Rutas,
  almacen: Almacen,
  credenciales: AlmacenCredenciales,
): Promise<void> {
  let crudo: unknown;
  try {
    crudo = JSON.parse((await readFile(rutas.config(), 'utf8')).replace(/^\uFEFF/, ''));
  } catch {
    return;
  }
  if (!crudo || typeof crudo !== 'object' || !('credenciales' in crudo)) return;
  const viejas = (crudo as { credenciales: unknown }).credenciales;
  const validas: ArchivoCredenciales = {};
  if (viejas && typeof viejas === 'object') {
    for (const id of IDS_SERVICIO_DATOS) {
      const c = CredencialesSchema.safeParse((viejas as Record<string, unknown>)[id]);
      if (c.success) validas[id] = c.data;
    }
  }
  await credenciales.importar(validas);
  // ConfigSchema ya no tiene "credenciales": guardar lo deja fuera.
  await almacen.guardar(await almacen.leer());
}
