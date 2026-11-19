import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { copiaConFecha } from '../herramientas/copiaConFecha';
import type { CapacidadesPlataforma } from '../plataforma/tipos';
import type { Rutas } from '../rutas';

/** Preferencia de Firefox que lo hace confiar en las raíces del almacén del sistema. */
export const PREF_FIREFOX = 'user_pref("security.enterprise_roots.enabled", true);';
const INICIO_FIREFOX = '// >>> WolfCore Dev: confiar en la CA local (no editar este bloque)';
const FIN_FIREFOX = '// <<< WolfCore Dev';
/** Desde Firefox 120 la preferencia vale true por defecto (Windows). */
const VERSION_FIREFOX_CONFIA = 120;
/** El bundle con las raíces del sistema se vuelve a exportar como mucho cada 7 días. */
const VIDA_BUNDLE_SISTEMA_MS = 7 * 24 * 60 * 60 * 1000;

const PEM = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g;
const bloquesPem = (t: string): string[] =>
  (t.match(PEM) ?? []).map((b) => b.replace(/\r\n?/g, '\n'));

/** SHA-256 (hex) del DER de un bloque PEM: no depende de los cortes de línea ni del texto. */
export function huellaDer(pem: string): string {
  const cuerpo = pem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, '');
  return createHash('sha256').update(Buffer.from(cuerpo, 'base64')).digest('hex');
}

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

/** Valor explícito de la preferencia en un `user.js` o `prefs.js` (la última gana), o null. */
function prefExplicita(texto: string): boolean | null {
  const re =
    /^\s*user_pref\(\s*["']security\.enterprise_roots\.enabled["']\s*,\s*(true|false)\s*\)/gm;
  let ultimo: string | null = null;
  for (const m of texto.matchAll(re)) ultimo = m[1]!;
  return ultimo === null ? null : ultimo === 'true';
}

/** ¿Confía Firefox en las raíces del sistema según este `user.js`? (la última línea gana). */
export function firefoxConfiaEnRaices(texto: string): boolean {
  return prefExplicita(texto) === true;
}

/**
 * ¿Confía el perfil en las raíces del sistema? `user.js` pisa a `prefs.js` al arrancar; sin
 * valor explícito, vale el de fábrica de la versión (true desde Firefox 120).
 */
export function perfilConfia(o: {
  userJs: string | null;
  prefsJs: string | null;
  version: number | null;
}): boolean {
  const deUser = o.userJs === null ? null : prefExplicita(o.userJs);
  if (deUser !== null) return deUser;
  const dePrefs = o.prefsJs === null ? null : prefExplicita(o.prefsJs);
  if (dePrefs !== null) return dePrefs;
  return o.version !== null && o.version >= VERSION_FIREFOX_CONFIA;
}

/** Versión principal de `compatibility.ini` (`LastVersion=128.0.3_…`), o null. */
function versionFirefox(texto: string | null): number | null {
  const m = texto ? /^\s*LastVersion\s*=\s*(\d+)\./m.exec(texto) : null;
  return m ? Number(m[1]) : null;
}

export interface PerfilFirefox {
  /** Nombre de la carpeta del perfil (nunca la ruta completa). */
  perfil: string;
  activo: boolean;
  /** Firefox lo tiene abierto: no se puede cambiar ahora. */
  abierto: boolean;
  /** Está fuera de la carpeta de Firefox: solo se cambia con una confirmación aparte. */
  fuera: boolean;
}

export interface ResultadoFirefox {
  perfil: string;
  ok: boolean;
  codigo?: 'firefox.abierto' | 'firefox.error' | 'firefox.fuera';
}

export interface EstadoConfianza {
  caCreada: boolean;
  node: {
    /** Los procesos de proyecto y la terminal reciben NODE_EXTRA_CA_CERTS. */
    proyectos: boolean;
    /** La variable del usuario (registro) apunta hoy a la CA de WolfCore Dev. */
    global: boolean;
    /** El usuario tiene su propia NODE_EXTRA_CA_CERTS (no se pisa). */
    ajena: boolean;
  };
  python: { proyectos: boolean };
  firefox: PerfilFirefox[];
  /** Algo que el usuario debe saber del último cambio (p. ej. variable cambiada a mano). */
  aviso?: 'confianza.node_variable_cambiada';
}

export interface DepsConfianza {
  rutas: Rutas;
  plataforma: Pick<
    CapacidadesPlataforma,
    'variableUsuario' | 'leerVariableUsuario' | 'perfilesFirefox' | 'firefoxEnUso' | 'raicesSistema'
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
 *   variable del usuario (se decide siempre por su valor actual en el registro).
 * - Python: un bundle = raíces (certifi del venv o las del sistema) + la CA; nunca solo la CA.
 * - Firefox: `security.enterprise_roots.enabled` en `user.js` de cada perfil, entre marcas, con
 *   copia previa y solo con Firefox cerrado. `prefs.js` solo se lee.
 * Nunca pisa una variable que el usuario ya fijó (p. ej. la CA de su empresa).
 */
export class ConfianzaCa {
  constructor(private readonly d: DepsConfianza) {}

  private get entorno(): Record<string, string | undefined> {
    return this.d.entorno ?? process.env;
  }

  private get ahora(): Date {
    return this.d.ahora?.() ?? new Date();
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

  /** Variable del entorno de este proceso ignorando mayúsculas (Windows). */
  private variable(nombre: string): string | undefined {
    const k = Object.keys(this.entorno).find((x) => x.toLowerCase() === nombre.toLowerCase());
    return k === undefined ? undefined : this.entorno[k] || undefined;
  }

  /** Marca de que WolfCore Dev fijó la variable (registro de lo hecho; no decide nada). */
  private async guardarEstado(e: { nodeGlobal: boolean }): Promise<void> {
    await this.escribirAtomico(this.archivoEstado, JSON.stringify(e, null, 2));
  }

  /**
   * Escribe en un temporal con sufijo aleatorio y lo renombra. `antes` corre justo antes del
   * reemplazo: si lanza, no se reemplaza nada y el temporal se borra.
   */
  private async escribirAtomico(
    destino: string,
    contenido: string,
    antes?: () => Promise<void>,
  ): Promise<void> {
    await mkdir(path.dirname(destino), { recursive: true });
    const tmp = `${destino}.${randomUUID().slice(0, 12)}.tmp`;
    try {
      await writeFile(tmp, contenido, 'utf8');
      await antes?.();
      await rename(tmp, destino);
    } catch (e) {
      await rm(tmp, { force: true }).catch(() => undefined);
      throw e;
    }
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
   * regenera si cambia la CA (o el certifi); el de las raíces del sistema, también a los 7 días.
   * Nuestra CA se reconoce por la huella de su DER. Lanza `confianza.sin_raices` si no hay
   * ninguna raíz aparte de la nuestra: nunca se deja un bundle con solo la CA.
   */
  async bundlePython(venv: string | null): Promise<string> {
    if (!this.caCreada()) throw new ErrorWolf('confianza.sin_ca', 'Aún no hay CA de WolfCore Dev.');
    const caPem = bloquesPem(await readFile(this.d.rutas.caCrt(), 'utf8'))[0];
    if (!caPem) throw new ErrorWolf('confianza.sin_ca', 'La CA de WolfCore Dev no se pudo leer.');
    const huella = huellaDer(caPem);
    const certifi = venv ? await this.certifiDe(venv) : null;
    const nombre = certifi
      ? `python-bundle-${createHash('sha256').update(path.resolve(venv!).toLowerCase()).digest('hex').slice(0, 12)}.pem`
      : 'python-bundle.pem';
    const destino = path.join(this.carpeta, nombre);
    const cabecera = `# ca-sha256: ${huella}`;

    let raices: string[];
    if (certifi) {
      raices = bloquesPem(await readFile(certifi, 'utf8'));
    } else {
      // Exportar las raíces del sistema es caro: se reusa el bundle mientras la CA sea la misma
      // y no tenga más de 7 días (las raíces del sistema cambian con las actualizaciones).
      try {
        const lineas = (await readFile(destino, 'utf8')).split('\n');
        const fecha = Date.parse(
          lineas.find((l) => l.startsWith('# generado: '))?.slice('# generado: '.length) ?? '',
        );
        const edad = this.ahora.getTime() - fecha;
        if (lineas.includes(cabecera) && edad >= 0 && edad < VIDA_BUNDLE_SISTEMA_MS) {
          return destino;
        }
      } catch {
        // no hay bundle todavía
      }
      try {
        raices = bloquesPem(await this.d.plataforma.raicesSistema());
      } catch {
        raices = [];
      }
    }
    const ajenas = raices.filter((b) => {
      try {
        return huellaDer(b) !== huella;
      } catch {
        return false;
      }
    });
    if (ajenas.length === 0) {
      throw new ErrorWolf(
        'confianza.sin_raices',
        'No se encontraron raíces de confianza para el bundle de Python (ni certifi ni del sistema).',
      );
    }
    const contenido = (fecha: string): string =>
      [
        '# Generado por WolfCore Dev: raíces de confianza + la CA local de WolfCore Dev. No editar.',
        `# origen: ${certifi ? 'certifi' : 'sistema'}`,
        cabecera,
        `# generado: ${fecha}`,
        ...ajenas,
        '# WolfCore Dev CA',
        caPem,
        '',
      ].join('\n');
    if (certifi) {
      // Con certifi el contenido no depende de la hora: solo se escribe si cambió.
      const fijo = contenido('certifi');
      let actual: string | null = null;
      try {
        actual = await readFile(destino, 'utf8');
      } catch {
        actual = null;
      }
      if (actual !== fijo) await this.escribirAtomico(destino, fijo);
    } else {
      await this.escribirAtomico(destino, contenido(this.ahora.toISOString()));
    }
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
   * Fija (o quita) `NODE_EXTRA_CA_CERTS` como variable del usuario, decidiendo por su valor
   * ACTUAL en el registro: se fija solo si está vacía o ya es la CA, y se quita solo si sigue
   * siendo exactamente la CA. Si el usuario la cambió, no se toca y se avisa.
   */
  async nodeGlobal(activar: boolean): Promise<EstadoConfianza> {
    const ca = this.d.rutas.caCrt();
    const actual = await this.d.plataforma.leerVariableUsuario(VARIABLE_NODE);
    let aviso: EstadoConfianza['aviso'];
    if (activar) {
      if (!this.caCreada()) {
        throw new ErrorWolf('confianza.sin_ca', 'Primero cree la CA de WolfCore Dev (HTTPS).');
      }
      if (actual !== null && actual !== ca) {
        throw new ErrorWolf(
          'confianza.node_variable_ajena',
          'Ya hay una NODE_EXTRA_CA_CERTS del usuario: no se reemplaza.',
        );
      }
      if (actual !== ca) {
        const r = await this.d.plataforma.variableUsuario(VARIABLE_NODE, ca);
        if (!r.ok) {
          throw new ErrorWolf(
            'confianza.variable_fallida',
            `No se pudo fijar la variable del usuario${r.detalle ? `: ${r.detalle}` : '.'}`,
          );
        }
      }
      await this.guardarEstado({ nodeGlobal: true });
    } else {
      if (actual === ca) {
        const r = await this.d.plataforma.variableUsuario(VARIABLE_NODE, null);
        if (!r.ok) {
          throw new ErrorWolf(
            'confianza.variable_fallida',
            `No se pudo quitar la variable del usuario${r.detalle ? `: ${r.detalle}` : '.'}`,
          );
        }
      } else if (actual !== null && existsSync(this.archivoEstado)) {
        // La pusimos nosotros pero el usuario la cambió: es suya, no se borra.
        const previa = await readFile(this.archivoEstado, 'utf8').catch(() => '');
        if (/"nodeGlobal":\s*true/.test(previa)) aviso = 'confianza.node_variable_cambiada';
      }
      await this.guardarEstado({ nodeGlobal: false });
    }
    const e = await this.estado();
    return aviso ? { ...e, aviso } : e;
  }

  private async leerOpcional(archivo: string): Promise<string | null> {
    try {
      return await readFile(archivo, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  }

  private leerUserJs(perfil: string): Promise<string | null> {
    return this.leerOpcional(path.join(perfil, 'user.js'));
  }

  /** ¿Confía el perfil? Lee `user.js`, `prefs.js` y `compatibility.ini` (solo lectura). */
  private async confiaPerfil(ruta: string): Promise<boolean> {
    try {
      const [userJs, prefsJs, compat] = await Promise.all([
        this.leerUserJs(ruta),
        this.leerOpcional(path.join(ruta, 'prefs.js')).catch(() => null),
        this.leerOpcional(path.join(ruta, 'compatibility.ini')).catch(() => null),
      ]);
      return perfilConfia({ userJs, prefsJs, version: versionFirefox(compat) });
    } catch {
      return false;
    }
  }

  /** Perfiles de Firefox con su estado (solo el nombre de la carpeta). */
  async firefox(): Promise<PerfilFirefox[]> {
    const res: PerfilFirefox[] = [];
    for (const { ruta, fuera } of await this.d.plataforma.perfilesFirefox()) {
      res.push({
        perfil: path.basename(ruta),
        activo: await this.confiaPerfil(ruta),
        abierto: await this.d.plataforma.firefoxEnUso(ruta).catch(() => false),
        fuera,
      });
    }
    return res;
  }

  /**
   * Agrega (o quita) el bloque de WolfCore Dev en el `user.js` de cada perfil. Un perfil abierto
   * se salta (`firefox.abierto`), también si Firefox se abre justo antes del reemplazo; uno fuera
   * de la carpeta de Firefox se salta (`firefox.fuera`) salvo con `incluirFuera` (confirmación
   * aparte). Antes de cambiar un `user.js` existente guarda una copia con fecha; si lo escrito
   * no se lee igual, se restaura.
   */
  async firefoxActivar(
    activar: boolean,
    o: { incluirFuera?: boolean } = {},
  ): Promise<ResultadoFirefox[]> {
    const res: ResultadoFirefox[] = [];
    for (const { ruta, fuera } of await this.d.plataforma.perfilesFirefox()) {
      const perfil = path.basename(ruta);
      if (fuera && o.incluirFuera !== true) {
        res.push({ perfil, ok: false, codigo: 'firefox.fuera' });
        continue;
      }
      if (await this.enUso(ruta)) {
        res.push({ perfil, ok: false, codigo: 'firefox.abierto' });
        continue;
      }
      try {
        await this.cambiarUserJs(ruta, perfil, activar);
        res.push({ perfil, ok: true });
      } catch (e) {
        if (e instanceof ErrorWolf && e.codigo === 'firefox.abierto') {
          res.push({ perfil, ok: false, codigo: 'firefox.abierto' });
          continue;
        }
        console.error(
          `No se pudo cambiar user.js de ${perfil}:`,
          e instanceof Error ? e.message : e,
        );
        res.push({ perfil, ok: false, codigo: 'firefox.error' });
      }
    }
    return res;
  }

  private enUso(ruta: string): Promise<boolean> {
    return this.d.plataforma.firefoxEnUso(ruta).catch(() => true);
  }

  /** Lanza `firefox.abierto` si Firefox abrió el perfil (se comprueba justo antes de escribir). */
  private async exigirCerrado(ruta: string): Promise<void> {
    if (await this.enUso(ruta)) {
      throw new ErrorWolf('firefox.abierto', 'Firefox abrió el perfil: no se cambió user.js.');
    }
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
      await this.exigirCerrado(ruta);
      await rm(archivo, { force: true });
      return;
    }
    await this.escribirAtomico(archivo, nuevo, () => this.exigirCerrado(ruta));
    if ((await this.leerUserJs(ruta)) !== nuevo) {
      if (previo === null) await rm(archivo, { force: true });
      else await this.escribirAtomico(archivo, previo);
      throw new Error('user.js no quedó como se escribió; se restauró el anterior');
    }
  }

  async estado(): Promise<EstadoConfianza> {
    const caCreada = this.caCreada();
    const ca = this.d.rutas.caCrt();
    const registro = await this.d.plataforma.leerVariableUsuario(VARIABLE_NODE).catch(() => null);
    const deProceso = this.variable(VARIABLE_NODE);
    const ajenaProceso = !!deProceso && deProceso !== ca;
    const ajena = (registro !== null && registro !== ca) || ajenaProceso;
    return {
      caCreada,
      node: { proyectos: caCreada && !ajenaProceso, global: registro === ca, ajena },
      python: { proyectos: caCreada },
      firefox: await this.firefox().catch(() => []),
    };
  }
}
