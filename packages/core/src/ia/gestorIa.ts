import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { EstiloEnv } from '../bd/env';
import { ErrorWolf } from '../errores';
import type { Config, Sitio } from '../tipos';
import {
  agregarEnvAGitignore,
  bloqueEnvIa,
  bloqueEnvIaEnmascarado,
  escribirEnvIa,
  estadoGitignore,
  limpiarRespaldosEnv,
  type EstadoGitignore,
} from './envIa';
import { errorIa } from './errores';
import type { FetchIa } from './http';
import {
  ConfigProveedorIaSchema,
  crearClienteIa,
  MAX_TOKENS_PRUEBA,
  probarConexion,
  URL_BASE_POR_DEFECTO,
  validarModeloIa,
  type ConfigProveedorIa,
  type ResultadoPruebaIa,
} from './proveedores';

/** Texto fijo del mensaje de prueba: la interfaz nunca elige qué se envía. */
export const TEXTO_PRUEBA_IA = 'Responde solo con la palabra: ok';

/** Las copias del .env más grandes que esto no se leen al buscar una clave (no son un .env). */
const MAX_BYTES_RESPALDO = 1024 * 1024;
const NOMBRE_RESPALDO_ENV = /^env-(.+)-\d{8}-\d{6}-\d{3}-[0-9a-f]{6}\.respaldo$/;

export interface DepsGestorIa {
  leerConfig(): Promise<Config>;
  modificarConfig(fn: (c: Config) => void): Promise<void>;
  /** ¿Git ya sigue el `.env` de la carpeta? (`Git.versionado`; null = no se sabe). */
  versionado(carpeta: string): Promise<boolean | null>;
  /** Carpeta de las copias del .env (`rutas.respaldosEnv()`), fuera de los proyectos. */
  carpetaRespaldos(): string;
  fetch?: FetchIa;
  /** Reloj en ms (pruebas). */
  ahora?: () => number;
}

export interface VistaPreviaEnvIa {
  /** Bloque con la clave enmascarada (`****abcd`). */
  bloque: string;
  gitignore: EstadoGitignore;
  existeEnv: boolean;
}

export interface OpcionesEnvIa {
  modelo?: string;
  /** La interfaz avisó que la clave queda en texto plano. */
  confirmado: true;
  /** Agregar `.env` al `.gitignore` (con copia previa). */
  agregarGitignore: boolean;
  /** Confirmación aparte: git ya sigue el .env, o no se pudo comprobar. */
  aceptarVersionado?: boolean;
  /** Confirmación aparte tras `ia.env_conflicto`. */
  reemplazarAjenas?: boolean;
}

export interface ResultadoEnvIa {
  respaldo: boolean;
  conflictos: string[];
  gitignoreAgregado: boolean;
}

export interface ResultadoMensajeIa {
  texto: string;
  latenciaMs: number;
  tokens?: { entrada: number; salida: number };
}

/** URL efectiva sin barras finales: dos URL que solo difieren en eso son la misma. */
function urlEfectiva(c: ConfigProveedorIa): string | null {
  return (c.urlBase ?? URL_BASE_POR_DEFECTO[c.tipo])?.replace(/\/+$/, '') ?? null;
}

/** Estilo de los valores del .env según el lector del proyecto (como el bloque de BD). */
function estiloDe(s: Sitio): EstiloEnv {
  if (s.tipo === 'codeigniter4') return 'ci4';
  if (s.tipo === 'codeigniter3') return 'literal';
  return 'dotenv';
}

/**
 * Proveedores de IA en la nube: su configuración NO secreta (`config.json` → `ia.proveedores`),
 * las pruebas y el bloque `.env` por proyecto. La clave nunca se guarda aquí: la pasa el proceso
 * principal (almacén de secretos) en cada llamada que la necesita y nunca se devuelve.
 */
export class GestorIa {
  constructor(private readonly d: DepsGestorIa) {}

  async proveedores(): Promise<ConfigProveedorIa[]> {
    return (await this.d.leerConfig()).ia.proveedores;
  }

  async proveedor(id: string): Promise<ConfigProveedorIa> {
    const p = (await this.proveedores()).find((x) => x.id === id);
    if (!p) throw new ErrorWolf('ia.proveedor_no_existe', 'El proveedor de IA ya no existe.');
    return p;
  }

  /**
   * Crea o actualiza un proveedor. Si ya tiene una clave guardada y cambia la URL efectiva (la
   * clave iría a otro host), exige `confirmarCambioUrl`.
   */
  async guardarProveedor(
    datos: ConfigProveedorIa,
    o: { tieneClave: boolean; confirmarCambioUrl?: boolean },
  ): Promise<ConfigProveedorIa[]> {
    const r = ConfigProveedorIaSchema.safeParse(datos);
    if (!r.success) throw errorIa('ia.proveedor_invalido');
    const nuevo: ConfigProveedorIa = r.data;
    const previo = (await this.proveedores()).find((x) => x.id === nuevo.id);
    if (
      previo &&
      o.tieneClave &&
      urlEfectiva(previo) !== urlEfectiva(nuevo) &&
      o.confirmarCambioUrl !== true
    ) {
      throw new ErrorWolf(
        'ia.url_cambia_con_clave',
        'El proveedor tiene una clave guardada: confirme que quiere enviarla a la nueva URL.',
      );
    }
    await this.d.modificarConfig((c) => {
      const lista = c.ia.proveedores.filter((x) => x.id !== nuevo.id);
      const i = c.ia.proveedores.findIndex((x) => x.id === nuevo.id);
      lista.splice(i < 0 ? lista.length : i, 0, nuevo);
      c.ia.proveedores = lista;
    });
    return this.proveedores();
  }

  async borrarProveedor(id: string): Promise<void> {
    await this.proveedor(id);
    await this.d.modificarConfig((c) => {
      c.ia.proveedores = c.ia.proveedores.filter((x) => x.id !== id);
    });
  }

  /** Prueba gratuita: solo lista los modelos. Nunca lanza por un fallo del proveedor. */
  async probarConexion(id: string, clave: string | null): Promise<ResultadoPruebaIa> {
    const p = await this.proveedor(id);
    return probarConexion(p, clave, {
      ...(this.d.fetch ? { fetchImpl: this.d.fetch } : {}),
      ...(this.d.ahora ? { ahora: this.d.ahora } : {}),
    });
  }

  /**
   * Un mensaje fijo y mínimo (gasta tokens): solo con la confirmación explícita de la interfaz
   * y con la respuesta acotada a `MAX_TOKENS_PRUEBA`.
   */
  async probarMensaje(
    id: string,
    clave: string | null,
    modelo: string,
    confirmado: true,
  ): Promise<ResultadoMensajeIa> {
    if (confirmado !== true) {
      throw new ErrorWolf(
        'ia.mensaje_sin_confirmar',
        'Confirme el envío del mensaje de prueba (gasta tokens de su cuenta).',
      );
    }
    const p = await this.proveedor(id);
    validarModeloIa(modelo);
    const ahora = this.d.ahora ?? (() => performance.now());
    const inicio = ahora();
    const r = await crearClienteIa(p, this.d.fetch).mensaje(clave, modelo, TEXTO_PRUEBA_IA, {
      maxTokens: MAX_TOKENS_PRUEBA,
    });
    return {
      texto: r.texto.slice(0, 500),
      latenciaMs: Math.round(ahora() - inicio),
      ...(r.tokens ? { tokens: r.tokens } : {}),
    };
  }

  private async sitio(id: string): Promise<Sitio> {
    const s = (await this.d.leerConfig()).sitios.find((x) => x.id === id);
    if (!s) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${id}`);
    return s;
  }

  /** Bloque enmascarado y estado de `.gitignore`/git del proyecto (la carpeta sale del id). */
  async previsualizarEnv(
    sitioId: string,
    proveedorId: string,
    clave: string | null,
    modelo?: string,
  ): Promise<VistaPreviaEnvIa> {
    const s = await this.sitio(sitioId);
    const p = await this.proveedor(proveedorId);
    const bloque = bloqueEnvIaEnmascarado(p, clave, modelo, estiloDe(s));
    const gitignore = await estadoGitignore(s.carpeta, { versionado: this.d.versionado });
    let existeEnv = false;
    try {
      existeEnv = (await lstat(path.join(s.carpeta, '.env'))).isFile();
    } catch {
      existeEnv = false;
    }
    return { bloque, gitignore, existeEnv };
  }

  /**
   * Escribe el bloque con la clave real en `<proyecto>/.env`. Exige `confirmado`; si git ya
   * sigue el .env o no se pudo comprobar, exige además `aceptarVersionado`. No toca nada (ni el
   * .gitignore) si falta una confirmación.
   */
  async escribirEnv(
    sitioId: string,
    proveedorId: string,
    clave: string | null,
    o: OpcionesEnvIa,
  ): Promise<ResultadoEnvIa> {
    if (o?.confirmado !== true) {
      throw new ErrorWolf(
        'ia.env_sin_confirmar',
        'Confirme que quiere escribir la clave en el .env (queda en texto plano).',
      );
    }
    const s = await this.sitio(sitioId);
    const p = await this.proveedor(proveedorId);
    const bloque = bloqueEnvIa(p, clave ?? '', o.modelo, estiloDe(s));
    const versionado = await this.d.versionado(s.carpeta);
    if (versionado === null && o.aceptarVersionado !== true) {
      throw new ErrorWolf(
        'ia.env_versionado_desconocido',
        'No se pudo comprobar si git ya sigue el .env de este proyecto; confirme aparte.',
      );
    }
    if (versionado === true && o.aceptarVersionado !== true) {
      throw new ErrorWolf(
        'ia.env_versionado',
        'Git ya sigue el .env de este proyecto: el próximo commit subiría la clave aunque esté en .gitignore. Quítelo del índice con "git rm --cached .env" o confirme aparte.',
      );
    }
    const carpetaRespaldos = this.d.carpetaRespaldos();
    let gitignoreAgregado = false;
    if (o.agregarGitignore) {
      const antes = await estadoGitignore(s.carpeta);
      if (!antes.ignoraEnv) {
        await agregarEnvAGitignore(s.carpeta, carpetaRespaldos);
        gitignoreAgregado = true;
      }
    }
    const r = await escribirEnvIa(s.carpeta, bloque, {
      confirmado: true,
      reemplazarAjenas: o.reemplazarAjenas === true,
      carpetaRespaldos,
      sitioId: s.id,
      versionado: async () => versionado,
      aceptarVersionado: o.aceptarVersionado === true,
    });
    return { respaldo: r.respaldo !== null, conflictos: r.conflictos, gitignoreAgregado };
  }

  /** Sitios con alguna copia del .env que contiene la clave (para ofrecer borrarlas). */
  async sitiosConRespaldosDeClave(clave: string | null): Promise<string[]> {
    if (!clave) return [];
    const carpeta = this.d.carpetaRespaldos();
    let nombres: string[];
    try {
      nombres = await readdir(carpeta);
    } catch {
      return [];
    }
    const sitios = new Set<string>();
    for (const n of nombres.sort()) {
      const m = NOMBRE_RESPALDO_ENV.exec(n);
      if (!m || sitios.has(m[1]!)) continue;
      const ruta = path.join(carpeta, n);
      try {
        const info = await lstat(ruta);
        if (!info.isFile() || info.size > MAX_BYTES_RESPALDO) continue;
        if ((await readFile(ruta, 'utf8')).includes(clave)) sitios.add(m[1]!);
      } catch {
        // Una copia ilegible no impide revisar las demás.
      }
    }
    return [...sitios];
  }

  /**
   * Borra TODAS las copias del .env de los sitios donde alguna tiene la clave (las más viejas
   * pueden tenerla también). Lo pide la interfaz al borrar la clave, con su confirmación.
   */
  async limpiarRespaldosDeClave(clave: string | null): Promise<{ sitios: number }> {
    const sitios = await this.sitiosConRespaldosDeClave(clave);
    for (const s of sitios) await limpiarRespaldosEnv(this.d.carpetaRespaldos(), s);
    return { sitios: sitios.length };
  }
}
