import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { copiaConFecha } from '../herramientas/copiaConFecha';
import type { CapacidadesPlataforma } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { huellaSha1 } from './ca';

/** Preferencia de Firefox que lo hace confiar en las raíces del almacén del sistema. */
export const PREF_FIREFOX = 'user_pref("security.enterprise_roots.enabled", true);';
const INICIO_FIREFOX = '// >>> WolfCore Dev: confiar en la CA local (no editar este bloque)';
const FIN_FIREFOX = '// <<< WolfCore Dev';

const PEM = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g;
const bloquesPem = (t: string): string[] =>
  (t.match(PEM) ?? []).map((b) => b.replace(/\r\n?/g, '\n'));

const escapar = (t: string): string => t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const BLOQUE_FIREFOX = new RegExp(
  `${escapar(INICIO_FIREFOX)}[\\s\\S]*?${escapar(FIN_FIREFOX)}[^\\r\\n]*(?:\\r?\\n)?`,
  'g',
);

/**
 * `user.js` con (o sin) el bloque marcado de WolfCore Dev. Todo lo demás queda igual, con el fin
 * de línea del archivo: quitarlo devuelve el texto previo (si este no terminaba en salto de
 * línea, queda con uno al final).
 */
export function conBloqueFirefox(texto: string, activar: boolean): string {
  const fin = texto.includes('\r\n') ? '\r\n' : '\n';
  const sin = texto.replace(BLOQUE_FIREFOX, '');
  if (!activar) return sin;
  const separador = sin === '' || sin.endsWith('\n') ? '' : fin;
  return `${sin}${separador}${INICIO_FIREFOX}${fin}${PREF_FIREFOX}${fin}${FIN_FIREFOX}${fin}`;
}

/** ¿Confía Firefox en las raíces del sistema según este `user.js`? (la última línea gana). */
export function firefoxConfiaEnRaices(texto: string): boolean {
  const re =
    /^\s*user_pref\(\s*["']security\.enterprise_roots\.enabled["']\s*,\s*(true|false)\s*\)/gm;
  let ultimo: string | null = null;
  for (const m of texto.matchAll(re)) ultimo = m[1]!;
  return ultimo === 'true';
}

export interface PerfilFirefox {
  /** Nombre de la carpeta del perfil (nunca la ruta completa). */
  perfil: string;
  activo: boolean;
  /** Firefox lo tiene abierto: no se puede cambiar ahora. */
  abierto: boolean;
}

export interface ResultadoFirefox {
  perfil: string;
  ok: boolean;
  codigo?: 'firefox.abierto' | 'firefox.error';
}

export interface EstadoConfianza {
  caCreada: boolean;
  node: {
    /** Los procesos de proyecto y la terminal reciben NODE_EXTRA_CA_CERTS. */
    proyectos: boolean;
    /** Fijada como variable del usuario por WolfCore Dev. */
    global: boolean;
    /** El usuario ya tiene su propia NODE_EXTRA_CA_CERTS (no se pisa). */
    ajena: boolean;
  };
  python: { proyectos: boolean };
  firefox: PerfilFirefox[];
}

export interface DepsConfianza {
  rutas: Rutas;
  plataforma: Pick<
    CapacidadesPlataforma,
    'variableUsuario' | 'perfilesFirefox' | 'firefoxEnUso' | 'raicesSistema'
  >;
  /** Copias con fecha de lo que se reescribe (`user.js`). */
  carpetaRespaldos: string;
  /** Entorno base de los procesos (por defecto, el de este proceso). */
  entorno?: Record<string, string | undefined>;
  ahora?: () => Date;
}

const VARIABLE_NODE = 'NODE_EXTRA_CA_CERTS';

/**
 * Confianza en la CA de WolfCore Dev fuera del almacén de Windows:
 * - Node: `NODE_EXTRA_CA_CERTS` en los procesos de proyecto y la terminal; opcionalmente como
 *   variable del usuario.
 * - Python: un bundle = raíces (certifi del venv o las del sistema) + la CA; nunca solo la CA.
 * - Firefox: `security.enterprise_roots.enabled` en `user.js` de cada perfil, entre marcas, con
 *   copia previa y solo con Firefox cerrado. Nunca se toca `prefs.js`.
 * Nunca pisa una variable que el usuario ya fijó (p. ej. la CA de su empresa).
 */
export class ConfianzaCa {
  constructor(private readonly d: DepsConfianza) {}

  private get entorno(): Record<string, string | undefined> {
    return this.d.entorno ?? process.env;
  }

  private get carpeta(): string {
    return path.join(this.d.rutas.base, 'etc', 'ca');
  }

  private get archivoEstado(): string {
    return path.join(this.carpeta, 'confianza.json');
  }

  caCreada(): boolean {
    return existsSync(this.d.rutas.caCrt());
  }

  /** Variable del entorno ignorando mayúsculas (Windows). */
  private variable(nombre: string): string | undefined {
    const k = Object.keys(this.entorno).find((x) => x.toLowerCase() === nombre.toLowerCase());
    return k === undefined ? undefined : this.entorno[k] || undefined;
  }

  private async leerEstado(): Promise<{ nodeGlobal: boolean }> {
    try {
      const j = JSON.parse(await readFile(this.archivoEstado, 'utf8')) as { nodeGlobal?: unknown };
      return { nodeGlobal: j.nodeGlobal === true };
    } catch {
      return { nodeGlobal: false };
    }
  }

  private async guardarEstado(e: { nodeGlobal: boolean }): Promise<void> {
    await this.escribirAtomico(this.archivoEstado, JSON.stringify(e, null, 2));
  }

  private async escribirAtomico(destino: string, contenido: string): Promise<void> {
    await mkdir(path.dirname(destino), { recursive: true });
    const tmp = `${destino}.${process.pid}.tmp`;
    await writeFile(tmp, contenido, 'utf8');
    await rename(tmp, destino);
  }

  /** Carpeta `.venv` del proyecto (en la carpeta de trabajo del proceso o en la del proyecto). */
  private venvDe(carpetas: string[]): string | null {
    for (const dir of [...new Set(carpetas)]) {
      const v = path.join(dir, '.venv');
      if (existsSync(path.join(v, 'pyvenv.cfg'))) return v;
    }
    return null;
  }

  /** cacert.pem de certifi dentro del venv (diseño de Windows o de Unix), o null. */
  private async certifiDe(venv: string): Promise<string | null> {
    const candidatos = [path.join(venv, 'Lib', 'site-packages')];
    try {
      for (const n of await readdir(path.join(venv, 'lib'))) {
        if (n.startsWith('python')) candidatos.push(path.join(venv, 'lib', n, 'site-packages'));
      }
    } catch {
      // sin lib/ (Windows)
    }
    for (const c of candidatos) {
      const r = path.join(c, 'certifi', 'cacert.pem');
      if (existsSync(r)) return r;
    }
    return null;
  }

  /**
   * Bundle de Python: raíces de `certifi` del venv (o las del sistema si no hay) + la CA. Se
   * regenera si cambia la CA (o el certifi). Lanza `confianza.sin_raices` si no hay ninguna raíz
   * aparte de la nuestra: nunca se deja un bundle con solo la CA.
   */
  async bundlePython(venv: string | null): Promise<string> {
    if (!this.caCreada()) throw new ErrorWolf('confianza.sin_ca', 'Aún no hay CA de WolfCore Dev.');
    const caPem = bloquesPem(await readFile(this.d.rutas.caCrt(), 'utf8'))[0];
    if (!caPem) throw new ErrorWolf('confianza.sin_ca', 'La CA de WolfCore Dev no se pudo leer.');
    const huella = huellaSha1(caPem);
    const certifi = venv ? await this.certifiDe(venv) : null;
    const nombre = certifi
      ? `python-bundle-${createHash('sha256').update(path.resolve(venv!).toLowerCase()).digest('hex').slice(0, 12)}.pem`
      : 'python-bundle.pem';
    const destino = path.join(this.carpeta, nombre);
    const cabecera = `# ca-sha1: ${huella}`;

    let raices: string[];
    if (certifi) {
      raices = bloquesPem(await readFile(certifi, 'utf8'));
    } else {
      // Exportar las raíces del sistema es caro: se reusa el bundle mientras la CA sea la misma.
      try {
        const previo = await readFile(destino, 'utf8');
        if (previo.split('\n').includes(cabecera)) return destino;
      } catch {
        // no hay bundle todavía
      }
      try {
        raices = bloquesPem(await this.d.plataforma.raicesSistema());
      } catch {
        raices = [];
      }
    }
    const ajenas = raices.filter((b) => b.trim() !== caPem.trim());
    if (ajenas.length === 0) {
      throw new ErrorWolf(
        'confianza.sin_raices',
        'No se encontraron raíces de confianza para el bundle de Python (ni certifi ni del sistema).',
      );
    }
    const contenido = [
      '# Generado por WolfCore Dev: raíces de confianza + la CA local de WolfCore Dev. No editar.',
      `# origen: ${certifi ? 'certifi' : 'sistema'}`,
      cabecera,
      ...ajenas,
      '# WolfCore Dev CA',
      caPem,
      '',
    ].join('\n');
    let actual: string | null = null;
    try {
      actual = await readFile(destino, 'utf8');
    } catch {
      actual = null;
    }
    if (actual !== contenido) await this.escribirAtomico(destino, contenido);
    return destino;
  }

  /**
   * Variables para un proceso de proyecto: `NODE_EXTRA_CA_CERTS` y, si hay venv,
   * `REQUESTS_CA_BUNDLE`/`SSL_CERT_FILE` al bundle. Sin CA, nada. Nunca lanza: si el bundle no
   * se puede armar, solo va la de Node.
   */
  async envProyecto(
    sitio: { carpeta: string },
    o: { carpetaVenv?: string } = {},
  ): Promise<Record<string, string>> {
    if (!this.caCreada()) return {};
    const env: Record<string, string> = {};
    if (!this.variable(VARIABLE_NODE) || this.variable(VARIABLE_NODE) === this.d.rutas.caCrt()) {
      env[VARIABLE_NODE] = this.d.rutas.caCrt();
    }
    const venv = this.venvDe([o.carpetaVenv ?? sitio.carpeta, sitio.carpeta]);
    if (venv) {
      try {
        const bundle = await this.bundlePython(venv);
        for (const k of ['REQUESTS_CA_BUNDLE', 'SSL_CERT_FILE']) {
          if (!this.variable(k)) env[k] = bundle;
        }
      } catch {
        // sin bundle: Python sigue con su confianza de siempre
      }
    }
    return env;
  }

  /**
   * Fija (o quita) `NODE_EXTRA_CA_CERTS` como variable del usuario. Solo quita la que puso
   * WolfCore Dev, y no pisa una que el usuario ya tenga.
   */
  async nodeGlobal(activar: boolean): Promise<EstadoConfianza> {
    const e = await this.leerEstado();
    if (activar) {
      if (!this.caCreada()) {
        throw new ErrorWolf('confianza.sin_ca', 'Primero cree la CA de WolfCore Dev (HTTPS).');
      }
      const actual = this.variable(VARIABLE_NODE);
      if (!e.nodeGlobal && actual && actual !== this.d.rutas.caCrt()) {
        throw new ErrorWolf(
          'confianza.node_variable_ajena',
          'Ya hay una NODE_EXTRA_CA_CERTS del usuario: no se reemplaza.',
        );
      }
      const r = await this.d.plataforma.variableUsuario(VARIABLE_NODE, this.d.rutas.caCrt());
      if (!r.ok) {
        throw new ErrorWolf(
          'confianza.variable_fallida',
          `No se pudo fijar la variable del usuario${r.detalle ? `: ${r.detalle}` : '.'}`,
        );
      }
      await this.guardarEstado({ nodeGlobal: true });
    } else if (e.nodeGlobal) {
      const r = await this.d.plataforma.variableUsuario(VARIABLE_NODE, null);
      if (!r.ok) {
        throw new ErrorWolf(
          'confianza.variable_fallida',
          `No se pudo quitar la variable del usuario${r.detalle ? `: ${r.detalle}` : '.'}`,
        );
      }
      await this.guardarEstado({ nodeGlobal: false });
    }
    return this.estado();
  }

  private async leerUserJs(perfil: string): Promise<string | null> {
    try {
      return await readFile(path.join(perfil, 'user.js'), 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  }

  /** Perfiles de Firefox con su estado (solo el nombre de la carpeta). */
  async firefox(): Promise<PerfilFirefox[]> {
    const res: PerfilFirefox[] = [];
    for (const ruta of await this.d.plataforma.perfilesFirefox()) {
      let activo = false;
      try {
        activo = firefoxConfiaEnRaices((await this.leerUserJs(ruta)) ?? '');
      } catch {
        activo = false;
      }
      res.push({
        perfil: path.basename(ruta),
        activo,
        abierto: await this.d.plataforma.firefoxEnUso(ruta).catch(() => false),
      });
    }
    return res;
  }

  /**
   * Agrega (o quita) el bloque de WolfCore Dev en el `user.js` de cada perfil. Un perfil abierto
   * se salta (`firefox.abierto`). Antes de cambiar un `user.js` existente guarda una copia con
   * fecha; si lo escrito no se lee igual, se restaura.
   */
  async firefoxActivar(activar: boolean): Promise<ResultadoFirefox[]> {
    const res: ResultadoFirefox[] = [];
    for (const ruta of await this.d.plataforma.perfilesFirefox()) {
      const perfil = path.basename(ruta);
      if (await this.d.plataforma.firefoxEnUso(ruta).catch(() => true)) {
        res.push({ perfil, ok: false, codigo: 'firefox.abierto' });
        continue;
      }
      try {
        await this.cambiarUserJs(ruta, perfil, activar);
        res.push({ perfil, ok: true });
      } catch (e) {
        console.error(
          `No se pudo cambiar user.js de ${perfil}:`,
          e instanceof Error ? e.message : e,
        );
        res.push({ perfil, ok: false, codigo: 'firefox.error' });
      }
    }
    return res;
  }

  private async cambiarUserJs(ruta: string, perfil: string, activar: boolean): Promise<void> {
    const archivo = path.join(ruta, 'user.js');
    const previo = await this.leerUserJs(ruta);
    const nuevo = conBloqueFirefox(previo ?? '', activar);
    if (nuevo === (previo ?? '')) return;
    if (previo !== null) {
      await copiaConFecha(
        this.d.carpetaRespaldos,
        `firefox-user-js-${perfil.replace(/[^\w.-]/g, '_')}`,
        previo,
        this.d.ahora?.(),
      );
    }
    // El archivo solo tenía nuestro bloque: al quitarlo no queda nada que conservar.
    if (nuevo.trim() === '' && previo !== null) {
      await rm(archivo, { force: true });
      return;
    }
    await this.escribirAtomico(archivo, nuevo);
    if ((await this.leerUserJs(ruta)) !== nuevo) {
      if (previo === null) await rm(archivo, { force: true });
      else await this.escribirAtomico(archivo, previo);
      throw new Error('user.js no quedó como se escribió; se restauró el anterior');
    }
  }

  async estado(): Promise<EstadoConfianza> {
    const caCreada = this.caCreada();
    const e = await this.leerEstado();
    const actual = this.variable(VARIABLE_NODE);
    const ajena = !e.nodeGlobal && !!actual && actual !== this.d.rutas.caCrt();
    return {
      caCreada,
      node: { proyectos: caCreada && !ajena, global: e.nodeGlobal, ajena },
      python: { proyectos: caCreada },
      firefox: await this.firefox().catch(() => []),
    };
  }
}
