import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Ejecutor } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { SitioSchema, type Sitio } from '../tipos';

function escaparRegex(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patronLinea(nombre: string): RegExp {
  return new RegExp(
    `^((?:\\xEF\\xBB\\xBF)?\\s*(?:export\\s+)?${escaparRegex(nombre)}\\s*=\\s*)(.*)$`,
  );
}

function separar(linea: string): { cuerpo: string; fin: string } {
  const m = /(\r?\n)$/.exec(linea);
  return m ? { cuerpo: linea.slice(0, -m[1]!.length), fin: m[1]! } : { cuerpo: linea, fin: '' };
}

function finDeLinea(contenido: string): string {
  return contenido.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Pone, reemplaza o elimina (valor null) una variable de un .env conservando
 * saltos de línea, comillas de la línea existente, posición y el resto del archivo.
 */
export function ponerVariableEnv(contenido: string, nombre: string, valor: string | null): string {
  const re = patronLinea(nombre);
  const lineas = contenido.length === 0 ? [] : contenido.split(/(?<=\n)/);
  let encontrada = false;
  const salida: string[] = [];
  for (const linea of lineas) {
    const { cuerpo, fin } = separar(linea);
    const m = re.exec(cuerpo);
    if (!m) {
      salida.push(linea);
      continue;
    }
    if (valor === null) {
      encontrada = true;
      continue;
    }
    if (encontrada) {
      salida.push(linea);
      continue;
    }
    encontrada = true;
    const resto = m[2]!;
    const comilla = resto[0] === '"' || resto[0] === "'" ? resto[0] : '';
    let cola = '';
    if (comilla) {
      const cierre = resto.indexOf(comilla, 1);
      if (cierre !== -1) cola = resto.slice(cierre + 1);
    } else {
      const c = /\s+#.*$/.exec(resto);
      if (c) cola = c[0];
    }
    salida.push(`${m[1]}${comilla}${valor}${comilla}${cola}${fin}`);
  }
  if (!encontrada && valor !== null) {
    const eol = finDeLinea(contenido);
    if (salida.length > 0 && !/\n$/.test(salida[salida.length - 1]!)) {
      salida[salida.length - 1] += eol;
    }
    salida.push(`${nombre}=${valor}${eol}`);
  }
  return salida.join('');
}

/** Reemplaza la primera línea de la variable por el texto exacto; si falta, lo agrega. */
function restaurarLinea(contenido: string, nombre: string, exacta: string): string {
  const re = patronLinea(nombre);
  const lineas = contenido.length === 0 ? [] : contenido.split(/(?<=\n)/);
  let hecho = false;
  const salida = lineas.map((linea) => {
    const { cuerpo, fin } = separar(linea);
    if (!hecho && re.test(cuerpo)) {
      hecho = true;
      return exacta + fin;
    }
    return linea;
  });
  if (!hecho) {
    const eol = finDeLinea(contenido);
    if (salida.length > 0 && !/\n$/.test(salida[salida.length - 1]!)) {
      salida[salida.length - 1] += eol;
    }
    salida.push(exacta + eol);
  }
  return salida.join('');
}

interface EstadoPrevio {
  existia: boolean;
  valor: string | null;
  lineaOriginal: string | null;
  /** sha256 del .env tal como lo dejó aplicar (para saber si el usuario lo editó). */
  hashAplicado?: string;
  /** Datos del sitio para restaurar aunque ya no exista en la configuración. */
  sitio?: { carpeta: string; urlBaseVar: string; tipo: Sitio['tipo']; php: string | null };
}

const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');

export interface DepsUrlBase {
  rutas: Rutas;
  ejecutor: Ejecutor;
}

export class UrlBase {
  private readonly cadenas = new Map<string, Promise<unknown>>();

  constructor(private readonly d: DepsUrlBase) {}

  private archivoEstado(s: Sitio): string {
    return path.join(this.d.rutas.base, 'run', `urlbase-${s.id}.json`);
  }

  /** Serializa aplicar/restaurar por sitio para que nunca se crucen. */
  private serializar<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const previa = this.cadenas.get(id) ?? Promise.resolve();
    const p = previa.then(fn, fn);
    const cola = p.catch(() => undefined);
    this.cadenas.set(id, cola);
    void cola.then(() => {
      if (this.cadenas.get(id) === cola) this.cadenas.delete(id);
    });
    return p;
  }

  /** Devuelve un mensaje informativo (o de fallo parcial); null si todo fue bien. */
  aplicar(s: Sitio, url: string): Promise<string | null> {
    return this.serializar(s.id, () => this.aplicarInterno(s, url));
  }

  restaurar(s: Sitio): Promise<string | null> {
    return this.serializar(s.id, () => this.restaurarInterno(s));
  }

  private async aplicarInterno(s: Sitio, url: string): Promise<string | null> {
    const nombre = s.urlBaseVar;
    if (!nombre) return null;
    const env = path.join(s.carpeta, '.env');
    if (!existsSync(env)) return 'El sitio no tiene .env';
    const bytes = await readFile(env);
    // latin1 conserva cualquier byte al volver a escribir.
    const original = bytes.toString('latin1');
    const estado = this.archivoEstado(s);
    let previo: EstadoPrevio;
    if (existsSync(estado)) {
      previo = JSON.parse(await readFile(estado, 'utf8')) as EstadoPrevio;
    } else {
      let existia = false;
      let valor: string | null = null;
      let lineaOriginal: string | null = null;
      const re = patronLinea(nombre);
      for (const linea of original.split(/(?<=\n)/)) {
        const { cuerpo } = separar(linea);
        const m = re.exec(cuerpo);
        if (m) {
          existia = true;
          lineaOriginal = cuerpo;
          valor = m[2]!.replace(/^(["'])(.*)\1.*$/, '$2');
          break;
        }
      }
      await mkdir(path.dirname(estado), { recursive: true });
      await copyFile(env, path.join(s.carpeta, '.env.pel-respaldo'));
      previo = {
        existia,
        valor,
        lineaOriginal,
        sitio: { carpeta: s.carpeta, urlBaseVar: nombre, tipo: s.tipo, php: s.php },
      };
      await writeFile(estado, JSON.stringify(previo, null, 2), 'utf8');
    }
    const nuevo = Buffer.from(ponerVariableEnv(original, nombre, url), 'latin1');
    await writeFile(env, nuevo);
    previo.hashAplicado = sha(nuevo);
    await writeFile(estado, JSON.stringify(previo, null, 2), 'utf8');
    return this.limpiarCache(s);
  }

  /** Restaura desde run/urlbase-<id>.json aunque el sitio ya no exista en la configuración. */
  restaurarPorId(id: string): Promise<string | null> {
    return this.serializar(id, async () => {
      const archivo = path.join(this.d.rutas.base, 'run', `urlbase-${id}.json`);
      if (!existsSync(archivo)) return null;
      const previo = JSON.parse(await readFile(archivo, 'utf8')) as EstadoPrevio;
      if (!previo.sitio) return null;
      const s = SitioSchema.parse({
        id,
        nombre: id,
        dominio: id,
        carpeta: previo.sitio.carpeta,
        tipo: previo.sitio.tipo,
        php: previo.sitio.php,
        urlBaseVar: previo.sitio.urlBaseVar,
      });
      return this.restaurarInterno(s);
    });
  }

  private async restaurarInterno(s: Sitio): Promise<string | null> {
    const nombre = s.urlBaseVar;
    const estado = this.archivoEstado(s);
    if (!nombre || !existsSync(estado)) return null;
    const previo = JSON.parse(await readFile(estado, 'utf8')) as EstadoPrevio;
    const env = path.join(s.carpeta, '.env');
    const respaldo = path.join(s.carpeta, '.env.pel-respaldo');
    if (existsSync(env)) {
      const actual = await readFile(env);
      if (previo.hashAplicado && sha(actual) === previo.hashAplicado && existsSync(respaldo)) {
        // Sin ediciones del usuario: se devuelven los bytes originales tal cual.
        await writeFile(env, await readFile(respaldo));
      } else {
        const texto = actual.toString('latin1');
        let nuevo: string;
        if (previo.existia && previo.lineaOriginal !== null) {
          nuevo = restaurarLinea(texto, nombre, previo.lineaOriginal);
        } else {
          nuevo = ponerVariableEnv(texto, nombre, null);
          if (existsSync(respaldo)) {
            const orig = (await readFile(respaldo)).toString('latin1');
            if (nuevo.replace(/\r?\n$/, '') === orig.replace(/\r?\n$/, '') && nuevo !== orig) {
              nuevo = orig;
            }
          }
        }
        await writeFile(env, Buffer.from(nuevo, 'latin1'));
      }
    }
    await rm(estado, { force: true });
    await rm(respaldo, { force: true });
    return this.limpiarCache(s);
  }

  private async limpiarCache(s: Sitio): Promise<string | null> {
    if (s.tipo !== 'laravel' || !s.php) return null;
    if (!existsSync(path.join(s.carpeta, 'bootstrap', 'cache', 'config.php'))) return null;
    const php = path.join(this.d.rutas.bin('php', s.php), 'php.exe');
    try {
      const r = await this.d.ejecutor(php, ['artisan', 'config:clear'], {
        timeoutMs: 30_000,
        cwd: s.carpeta,
      });
      return r.codigo === 0
        ? null
        : `No se pudo limpiar la caché de configuración: ${r.stderr || r.stdout}`.trim();
    } catch (e) {
      return `No se pudo limpiar la caché de configuración: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
