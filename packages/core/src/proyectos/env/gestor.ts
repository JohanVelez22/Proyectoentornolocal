import { createHash } from 'node:crypto';
import { lstat, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { leerBaseDelProyecto } from '../../bd/baseProyecto';
import { ErrorWolf } from '../../errores';
import {
  agregarEnvAGitignore,
  copiasEnv,
  estadoGitignore,
  MAX_RESPALDOS_ENV,
  respaldar,
  validarSitio,
  type EstadoGitignore,
} from '../../ia/envIa';
import { escribirAtomico } from '../../sitios/urlbase';
import type { Sitio } from '../../tipos';
import { estiloDe as estiloDeTipo } from '../pasos/env';
import { diffEnv, type DiffEnv } from './diff';
import { aplicarCambios, diffTexto, validarCambios, type CambiosEnv } from './escribir';
import { enmascarar, esSecreta, escribirEnv, leerEnv, type LineaEnv } from './leer';
import {
  BLOQUES_ENV,
  PLANTILLAS_ENV,
  type BloqueEnv,
  type ContextoPlantillaEnv,
} from './plantillas';

/** Tamaño máximo de un `.env` (o de su ejemplo) que se abre. */
export const MAX_BYTES_ENV = 1024 * 1024;

/** Archivos de ejemplo, en orden de preferencia (CodeIgniter 4 trae `env`). */
const EJEMPLOS = ['.env.example', '.env.sample', '.env.dist', 'env'];

export interface FilaEnv {
  clave: string;
  /** El valor; si es secreto, enmascarado (`••••<4 últimos>`). Nunca el valor completo de un secreto. */
  valorVisible: string;
  secreta: boolean;
  /** El valor está vacío (no hay nada que mostrar). */
  vacia: boolean;
  /** Está definida más de una vez: se muestra y se cambia la última. */
  duplicada?: boolean;
  /** Ocupa varias líneas: no se cambia ni se quita desde aquí. */
  soloLectura?: boolean;
}

export interface VistaEnv {
  existe: boolean;
  filas: FilaEnv[];
  /** Solo nombres de variable. */
  diff: DiffEnv;
  /** Hay un archivo de ejemplo con el que comparar. */
  hayEjemplo: boolean;
  gitignore: EstadoGitignore;
  /** Copias que guardó WolfCore Dev de este `.env`. */
  copias: number;
  /** Huella del `.env` leído: `guardar` la exige igual (nadie lo cambió por fuera entretanto). */
  huella: string;
}

/** Lo que se quiere cambiar: variables a mano, valores tomados del ejemplo y bloques de plantilla. */
export interface PedidoEnv {
  cambios?: Record<string, string | null>;
  /** Claves cuyo valor se toma del `.env.example` (el renderer nunca ve esos valores). */
  desdeEjemplo?: string[];
  bloques?: BloqueEnv[];
}

export interface OpcionesGuardarEnv {
  /** Confirma escribir aunque git ya siga el `.env` (o no se pudo comprobar). */
  aceptarVersionado?: boolean;
  /** Agrega `.env` al `.gitignore` (con copia previa). */
  agregarGitignore?: boolean;
  /**
   * Huella del `.env` que se mostró (`ver` o `vistaPrevia`): si el archivo cambió desde entonces,
   * no se guarda (`env.cambio_externo`). El IPC la exige siempre.
   */
  huella?: string;
  /**
   * Solo para el núcleo: corre después de todas las comprobaciones y justo antes de copiar y
   * escribir (p. ej. crear el usuario de la base solo cuando el `.env` seguro se puede escribir).
   */
  antes?: () => Promise<void>;
}

export interface DepsGestorEnv {
  sitio: (id: string) => Promise<Sitio | undefined>;
  carpetaRespaldos: () => string;
  versionado: (carpeta: string) => Promise<boolean | null>;
  puertos: () => Promise<{ correo: number | null; redis: number | null }>;
  /** Puerto y master key de Meilisearch, o null si no está instalado. Nunca va al renderer. */
  meilisearch?: () => Promise<{ puerto: number; clave: string } | null>;
}

/** Lee un archivo de texto del proyecto: null si no existe; enlaces y archivos enormes se rechazan. */
async function leerArchivo(ruta: string): Promise<string | null> {
  let info;
  try {
    info = await lstat(ruta);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
  if (!info.isFile()) {
    throw new ErrorWolf(
      'env.no_regular',
      `${path.basename(ruta)} no es un archivo normal: no se lee ni se modifica.`,
    );
  }
  const grande = (): ErrorWolf =>
    new ErrorWolf('env.archivo_grande', 'El archivo de variables es demasiado grande.', {
      maximo: '1 MB',
    });
  if (info.size > MAX_BYTES_ENV) throw grande();
  const datos = await readFile(ruta);
  if (datos.length > MAX_BYTES_ENV) throw grande();
  return datos.toString('utf8');
}

/** Huella del contenido del `.env` (o de que no existe). */
export function huellaEnv(texto: string | null): string {
  return createHash('sha256')
    .update(texto === null ? '!sin-archivo' : `=${texto}`)
    .digest('hex');
}

/** Nombres de copia de este sitio: `env-<sitio>-AAAAMMDD-HHmmss-mmm-xxxxxx.respaldo`. */
const copiaValida = (sitioId: string, nombre: string): boolean =>
  new RegExp(
    `^env-${sitioId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d{8}-\\d{6}-\\d{3}-[0-9a-f]{6}\\.respaldo$`,
  ).test(nombre);

/**
 * Gestor de `.env`: lee con los secretos enmascarados, compara con el ejemplo y guarda con vista
 * previa, copia con fecha y escritura atómica. Un valor completo solo sale por `revelar` (una
 * clave, por clic explícito); `ver`, `vistaPrevia` y los errores nunca lo llevan.
 */
export class GestorEnv {
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsGestorEnv) {}

  /** Una escritura a la vez (dos guardados seguidos no se pisan). */
  private serializar<T>(fn: () => Promise<T>): Promise<T> {
    const r = this.cola.then(fn, fn);
    this.cola = r.catch(() => undefined);
    return r;
  }

  private async sitioExistente(id: string): Promise<Sitio> {
    validarSitio(id);
    const s = await this.d.sitio(id);
    if (!s) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto "${id}"`);
    return s;
  }

  private async ejemplo(carpeta: string): Promise<string | null> {
    for (const n of EJEMPLOS) {
      const t = await leerArchivo(path.join(carpeta, n)).catch(() => null);
      if (t !== null) return t;
    }
    return null;
  }

  async ver(sitioId: string): Promise<VistaEnv> {
    const s = await this.sitioExistente(sitioId);
    const texto = await leerArchivo(path.join(s.carpeta, '.env'));
    const ejemplo = await this.ejemplo(s.carpeta);
    // Una fila por variable, en el orden de su primera aparición y con el valor de la última
    // (la que se cambia al guardar).
    const ultimas = new Map<string, { l: LineaEnv; veces: number }>();
    for (const l of leerEnv(texto ?? '')) {
      if (l.tipo !== 'variable') continue;
      const previa = ultimas.get(l.clave!);
      ultimas.set(l.clave!, { l, veces: (previa?.veces ?? 0) + 1 });
    }
    const filas: FilaEnv[] = [...ultimas.values()].map(({ l, veces }) => {
      const secreta = esSecreta(l.clave!, l.valor!);
      return {
        clave: l.clave!,
        valorVisible: secreta ? enmascarar(l.valor!) : l.valor!,
        secreta,
        vacia: l.valor === '',
        ...(veces > 1 ? { duplicada: true } : {}),
        ...(l.multilinea ? { soloLectura: true } : {}),
      };
    });
    return {
      existe: texto !== null,
      filas,
      diff:
        ejemplo === null
          ? { faltan: [], sobran: [], distintas: [] }
          : diffEnv(texto ?? '', ejemplo),
      hayEjemplo: ejemplo !== null,
      gitignore: await estadoGitignore(s.carpeta, { versionado: this.d.versionado }),
      copias: (await copiasEnv(this.d.carpetaRespaldos(), s.id)).length,
      huella: huellaEnv(texto),
    };
  }

  /** El valor completo de UNA variable. Solo lo pide el usuario con "Mostrar"; no emite eventos. */
  async revelar(sitioId: string, clave: string): Promise<string> {
    const s = await this.sitioExistente(sitioId);
    const texto = await leerArchivo(path.join(s.carpeta, '.env'));
    // La última definición, la misma que muestra `ver`.
    const l = leerEnv(texto ?? '').findLast((x) => x.tipo === 'variable' && x.clave === clave);
    if (typeof clave !== 'string' || !l) {
      throw new ErrorWolf('env.clave_inexistente', 'La variable no existe en el .env.', {
        clave: typeof clave === 'string' ? clave.slice(0, 40) : '',
      });
    }
    return l.valor!;
  }

  /** Cambios del pedido ya resueltos (ejemplo y bloques incluidos) y validados. */
  private async resolver(s: Sitio, p: PedidoEnv, texto: string | null): Promise<CambiosEnv> {
    const cambios: CambiosEnv = {};
    const actuales = new Set(
      leerEnv(texto ?? '')
        .filter((l) => l.tipo === 'variable')
        .map((l) => l.clave!),
    );
    for (const b of p.bloques ?? []) {
      if (!BLOQUES_ENV.includes(b)) {
        throw new ErrorWolf('env.cambio_invalido', 'El bloque de variables no existe.');
      }
      // Un proyecto que envía por un proveedor SMTP remoto (D22) no recibe el bloque del captador.
      if (b === 'correo' && s.correo?.modo === 'smtp') continue;
      const puertos = await this.d.puertos();
      let meilisearch: ContextoPlantillaEnv['meilisearch'] = null;
      if (b === 'meilisearch') {
        meilisearch = (await this.d.meilisearch?.()) ?? null;
        if (meilisearch === null) {
          throw new ErrorWolf(
            'env.meilisearch_no_disponible',
            'Meilisearch no está instalado: instálelo en Servicios.',
          );
        }
      }
      const base = await leerBaseDelProyecto(s.carpeta).catch(() => null);
      const contexto: ContextoPlantillaEnv = {
        tipo: s.tipo,
        base: base
          ? {
              motor: base.motor,
              nombre: base.base,
              usuario: base.usuario,
              puerto: base.puerto ?? (base.motor === 'postgresql' ? 5432 : 3306),
            }
          : null,
        ...puertos,
        meilisearch,
      };
      // Un bloque solo agrega las variables que faltan: nunca pisa una que ya está (una clave
      // escrita por el usuario no se vacía).
      for (const [k, v] of Object.entries(PLANTILLAS_ENV[b](contexto))) {
        if (!actuales.has(k) && !(k in cambios)) cambios[k] = v;
      }
    }
    if (p.desdeEjemplo !== undefined && p.desdeEjemplo.length > 0) {
      const ejemplo = await this.ejemplo(s.carpeta);
      const valores = new Map(
        leerEnv(ejemplo ?? '')
          .filter((l) => l.tipo === 'variable')
          .map((l) => [l.clave!, l.valor!] as const),
      );
      for (const k of p.desdeEjemplo) {
        const v = valores.get(k);
        if (v === undefined) {
          throw new ErrorWolf('env.clave_inexistente', 'La variable no está en el ejemplo.', {
            clave: String(k).slice(0, 40),
          });
        }
        cambios[k] = v;
      }
    }
    Object.assign(cambios, p.cambios ?? {});
    return validarCambios(cambios);
  }

  private async preparar(s: Sitio, p: PedidoEnv) {
    const texto = await leerArchivo(path.join(s.carpeta, '.env'));
    const cambios = await this.resolver(s, p, texto);
    const antes = leerEnv(texto ?? '');
    const despues = aplicarCambios(antes, cambios, (clave) =>
      estiloDeTipo(s.tipo, clave.includes('.') ? 'database.default.x =' : (texto ?? '')),
    );
    return { texto, antes, despues };
  }

  /** Lo que cambiaría, con los secretos enmascarados. No escribe nada. */
  async vistaPrevia(sitioId: string, p: PedidoEnv): Promise<{ diff: string; huella: string }> {
    const s = await this.sitioExistente(sitioId);
    const { texto, antes, despues } = await this.preparar(s, p);
    return { diff: diffTexto(antes, despues), huella: huellaEnv(texto) };
  }

  /**
   * Guarda: exige `confirmado`, antes copia el `.env` actual (con fecha, fuera del proyecto) y
   * escribe de forma atómica. Conserva orden, comentarios y comillas. Si git ya sigue el `.env`
   * (o no se pudo comprobar), exige además `aceptarVersionado`.
   */
  async guardar(
    sitioId: string,
    p: PedidoEnv,
    confirmado: true,
    o: OpcionesGuardarEnv = {},
  ): Promise<{ copia: string | null; gitignoreAgregado: boolean }> {
    if (confirmado !== true) {
      throw new ErrorWolf('env.sin_confirmar', 'Confirme que quiere guardar los cambios del .env.');
    }
    const s = await this.sitioExistente(sitioId);
    return this.serializar(async () => {
      const { texto, despues } = await this.preparar(s, p);
      if (o.huella !== undefined && o.huella !== huellaEnv(texto)) {
        throw new ErrorWolf(
          'env.cambio_externo',
          'El .env cambió desde que se mostró: vuelva a revisarlo antes de guardar.',
        );
      }
      const versionado = await this.d.versionado(s.carpeta);
      if (versionado !== false && o.aceptarVersionado !== true) {
        throw new ErrorWolf(
          versionado === true ? 'env.versionado' : 'env.versionado_desconocido',
          versionado === true
            ? 'Git ya sigue el .env de este proyecto: el próximo commit subiría sus valores. Confirme aparte para continuar.'
            : 'No se pudo comprobar si git sigue el .env de este proyecto; confirme aparte para continuar.',
        );
      }
      const destino = path.join(s.carpeta, '.env');
      const carpetaRespaldos = this.d.carpetaRespaldos();
      // Primero lo que puede fallar del núcleo (p. ej. crear el usuario de la base): si falla, el
      // .gitignore tampoco se toca.
      await o.antes?.();
      let gitignoreAgregado = false;
      if (o.agregarGitignore === true && !(await estadoGitignore(s.carpeta)).ignoraEnv) {
        await agregarEnvAGitignore(s.carpeta, carpetaRespaldos);
        gitignoreAgregado = true;
      }
      let copia: string | null = null;
      if (texto !== null) copia = await respaldar(destino, carpetaRespaldos, `env-${s.id}`);
      await escribirAtomico(destino, Buffer.from(escribirEnv(despues), 'utf8'));
      await this.podarCopias(s.id);
      return { copia: copia ? path.basename(copia) : null, gitignoreAgregado };
    });
  }

  /**
   * Pone el usuario y la clave de la base en las variables de conexión que el `.env` YA tiene
   * (`DB_USERNAME`/`DB_PASSWORD`, `database.default.*`, el usuario y la clave de `DATABASE_URL`).
   * Lo demás no se toca. La clave solo se escribe en el archivo: no sale en el resultado.
   */
  async ponerUsuarioBd(
    sitioId: string,
    usuario: string,
    clave: string,
    o: OpcionesGuardarEnv = {},
  ): Promise<{ copia: string | null; gitignoreAgregado: boolean }> {
    const s = await this.sitioExistente(sitioId);
    const texto = await leerArchivo(path.join(s.carpeta, '.env'));
    const vars = new Map(
      leerEnv(texto ?? '')
        .filter((l) => l.tipo === 'variable')
        .map((l) => [l.clave!, l.valor!] as const),
    );
    const cambios: CambiosEnv = {};
    // Cada variable de usuario con su pareja de clave: si el .env tiene el usuario pero no la
    // clave (servidor sin contraseña), la clave se agrega.
    for (const [nombreUsuario, nombreClave] of [
      ['DB_USERNAME', 'DB_PASSWORD'],
      ['DB_USER', 'DB_PASS'],
      ['database.default.username', 'database.default.password'],
    ] as const) {
      if (vars.has(nombreUsuario)) {
        cambios[nombreUsuario] = usuario;
        cambios[nombreClave] = clave;
      } else if (vars.has(nombreClave)) {
        cambios[nombreClave] = clave;
      }
    }
    const url = vars.get('DATABASE_URL');
    if (url) {
      try {
        const u = new URL(url);
        u.username = usuario;
        u.password = clave;
        cambios.DATABASE_URL = u.toString();
      } catch {
        // URL ilegible: no se toca.
      }
    }
    if (Object.keys(cambios).length === 0) {
      throw new ErrorWolf(
        'env.sin_base',
        'El .env de este proyecto no tiene variables de conexión a la base de datos.',
      );
    }
    return this.guardar(sitioId, { cambios }, true, o);
  }

  private async podarCopias(sitioId: string): Promise<void> {
    const carpeta = this.d.carpetaRespaldos();
    const copias = await copiasEnv(carpeta, sitioId);
    for (const n of copias.slice(0, Math.max(0, copias.length - MAX_RESPALDOS_ENV))) {
      await rm(path.join(carpeta, n), { force: true });
    }
  }

  /** Las copias de este `.env` (de la más nueva a la más vieja): solo nombres. */
  async copias(sitioId: string): Promise<string[]> {
    const s = await this.sitioExistente(sitioId);
    return (await copiasEnv(this.d.carpetaRespaldos(), s.id)).reverse();
  }

  /**
   * Vuelve a una copia: antes guarda otra del `.env` actual (así volver también se puede
   * deshacer) y escribe de forma atómica. El nombre sale de `copias` y se valida.
   */
  async restaurarCopia(
    sitioId: string,
    nombre: string,
    confirmado: true,
  ): Promise<{ copia: string | null }> {
    if (confirmado !== true) {
      throw new ErrorWolf('env.sin_confirmar', 'Confirme que quiere volver a esta copia del .env.');
    }
    const s = await this.sitioExistente(sitioId);
    if (typeof nombre !== 'string' || !copiaValida(s.id, nombre)) {
      throw new ErrorWolf('env.copia_invalida', 'La copia del .env no es válida.');
    }
    return this.serializar(async () => {
      const carpeta = this.d.carpetaRespaldos();
      const contenido = await leerArchivo(path.join(carpeta, nombre));
      if (contenido === null) {
        throw new ErrorWolf('env.copia_invalida', 'La copia del .env ya no existe.');
      }
      const destino = path.join(s.carpeta, '.env');
      const actual = await leerArchivo(destino);
      let copia: string | null = null;
      if (actual !== null) copia = await respaldar(destino, carpeta, `env-${s.id}`);
      await escribirAtomico(destino, Buffer.from(contenido, 'utf8'));
      await this.podarCopias(s.id);
      return { copia: copia ? path.basename(copia) : null };
    });
  }
}
