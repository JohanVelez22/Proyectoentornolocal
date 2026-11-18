import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ProgresoIa } from '../eventos';

export const SUGERIDOS = ['llama3.2', 'qwen2.5-coder', 'mistral', 'nomic-embed-text'];

const BASE_POR_DEFECTO = 'http://127.0.0.1:11434';
/** Nombres de modelo de Ollama aceptados (p. ej. llama3.2, qwen2.5-coder:7b). */
export const NOMBRE_MODELO_OLLAMA = /^[a-z0-9][a-z0-9._:/-]{0,127}$/i;
const NOMBRE_VALIDO = NOMBRE_MODELO_OLLAMA;

const MS_LISTA = 5_000;
const MS_PROBAR = 120_000;
const MS_SIN_DATOS = 60_000;
const MS_ENTRE_EVENTOS = 100; // como mucho 10 eventos por segundo y modelo

/** Variables para que el código de un sitio use la IA local. */
export function bloqueEnvIa(puerto = 11434): string {
  const base = `http://127.0.0.1:${puerto}`;
  return `OLLAMA_BASE_URL=${base}\nOPENAI_BASE_URL=${base}/v1`;
}

export interface ModeloOllama {
  nombre: string;
  tamanoBytes: number;
  modificado: string;
}

type RespuestaHttp = {
  ok: boolean;
  status?: number;
  json(): Promise<unknown>;
  body?: ReadableStream<Uint8Array> | null;
};
type Fetch = (url: string, init?: RequestInit) => Promise<RespuestaHttp>;

export interface OpcionesOllama {
  /** URL base según el puerto configurado. */
  base?: () => string;
  /** Carpeta de modelos (OLLAMA_MODELS). */
  modelosDir: () => string;
  emitir?: (p: ProgresoIa) => void;
  fetch?: Fetch;
  ahora?: () => number;
}

export class ErrorOllama extends Error {
  constructor(
    mensaje: string,
    readonly codigo?: 'cancelado' | 'apagado' | 'tiempo',
  ) {
    super(mensaje);
    this.name = 'ErrorOllama';
  }
}

const APAGADO = 'Encienda Ollama para usar la IA local';

export class ClienteOllama {
  private readonly descargas = new Map<string, AbortController>();
  private readonly base: () => string;
  private readonly peticion: Fetch;
  private readonly ahora: () => number;

  constructor(private readonly op: OpcionesOllama) {
    this.base = op.base ?? (() => BASE_POR_DEFECTO);
    this.peticion = op.fetch ?? ((u, i) => fetch(u, i) as Promise<RespuestaHttp>);
    this.ahora = op.ahora ?? Date.now;
  }

  private validar(nombre: string): void {
    if (!NOMBRE_VALIDO.test(nombre)) {
      throw new ErrorOllama(
        'Nombre de modelo no válido. Use letras, números y . _ : / - (por ejemplo llama3.2).',
      );
    }
  }

  /** Petición con tiempo máximo; traduce "servicio apagado" y "tiempo agotado". */
  private async llamar(ruta: string, init: RequestInit, ms: number): Promise<RespuestaHttp> {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      return await this.peticion(`${this.base()}${ruta}`, { ...init, signal: ctl.signal });
    } catch {
      if (ctl.signal.aborted) {
        throw new ErrorOllama('Ollama tardó demasiado en responder. Inténtelo de nuevo.', 'tiempo');
      }
      throw new ErrorOllama(APAGADO, 'apagado');
    } finally {
      clearTimeout(t);
    }
  }

  /** Detalle ": mensaje" del cuerpo de error de Ollama, o cadena vacía. */
  private async detalleError(r: RespuestaHttp): Promise<string> {
    try {
      const d = (await r.json()) as { error?: unknown };
      if (typeof d.error === 'string') return `: ${d.error}`;
    } catch {
      /* sin cuerpo */
    }
    return '';
  }

  // La lectura del cuerpo no tiene tiempo máximo propio: el servicio es local y la espera de
  // la cabecera ya está acotada por `llamar`.
  private async leerJson<T>(r: RespuestaHttp): Promise<T> {
    if (!r.ok) {
      throw new ErrorOllama(
        `Ollama respondió con un error (${r.status ?? 'desconocido'})${await this.detalleError(r)}.`,
      );
    }
    return (await r.json()) as T;
  }

  async modelos(): Promise<ModeloOllama[]> {
    const r = await this.llamar('/api/tags', {}, MS_LISTA);
    const d = await this.leerJson<{
      models?: { name: string; size?: number; modified_at?: string }[];
    }>(r);
    return (d.models ?? []).map((m) => ({
      nombre: m.name,
      tamanoBytes: typeof m.size === 'number' ? m.size : 0,
      modificado: m.modified_at ?? '',
    }));
  }

  async borrar(nombre: string): Promise<void> {
    this.validar(nombre);
    const r = await this.llamar(
      '/api/delete',
      {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: nombre }),
      },
      MS_LISTA,
    );
    await this.leerJson(r);
  }

  async probar(nombre: string, texto: string): Promise<string> {
    this.validar(nombre);
    const r = await this.llamar(
      '/api/generate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: nombre, prompt: texto, stream: false }),
      },
      MS_PROBAR,
    );
    const d = await this.leerJson<{ response?: unknown }>(r);
    return typeof d.response === 'string' ? d.response : '';
  }

  /** Aborta la descarga en curso; false si no había ninguna. */
  cancelarDescarga(nombre: string): boolean {
    const clave = nombre.toLowerCase();
    const ctl = this.descargas.get(clave);
    if (!ctl) return false;
    ctl.abort();
    this.descargas.delete(clave);
    return true;
  }

  async descargar(nombre: string): Promise<void> {
    this.validar(nombre);
    const clave = nombre.toLowerCase();
    if (this.descargas.has(clave)) {
      throw new ErrorOllama(`Ya se está descargando ${nombre}.`);
    }
    const ctl = new AbortController();
    this.descargas.set(clave, ctl);
    let estancado = false;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const armar = (): void => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        estancado = true;
        ctl.abort();
      }, MS_SIN_DATOS);
    };
    const abortado = (): ErrorOllama =>
      estancado
        ? new ErrorOllama(`La descarga de ${nombre} se detuvo: Ollama no envía datos.`, 'tiempo')
        : new ErrorOllama('Descarga cancelada', 'cancelado');

    let lector: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      armar();
      let r: RespuestaHttp;
      try {
        r = await this.peticion(`${this.base()}/api/pull`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ model: nombre, stream: true }),
          signal: ctl.signal,
        });
      } catch {
        if (ctl.signal.aborted) throw abortado();
        throw new ErrorOllama(APAGADO, 'apagado');
      }
      if (!r.ok || !r.body) {
        const detalle = r.ok ? '' : await this.detalleError(r);
        r.body?.cancel().catch(() => {});
        throw new ErrorOllama(
          `Ollama no pudo descargar ${nombre} (error ${r.status ?? 'desconocido'})${detalle}.`,
        );
      }

      lector = r.body.getReader();
      let exito = false;
      const dec = new TextDecoder('utf-8');
      let resto = '';
      let ultimoEmitido = -Infinity;
      let pendiente: ProgresoIa | undefined;

      const linea = (texto: string): void => {
        if (!texto.trim()) return;
        let d: { status?: string; completed?: number; total?: number; error?: string };
        try {
          d = JSON.parse(texto);
        } catch {
          return; // línea ajena: se ignora
        }
        if (typeof d.error === 'string') {
          throw new ErrorOllama(`Ollama no pudo descargar ${nombre}: ${d.error}`);
        }
        if (d.status === 'success') exito = true;
        const p: ProgresoIa = {
          modelo: nombre,
          estado: d.status ?? '',
          completado: typeof d.completed === 'number' ? d.completed : 0,
          total: typeof d.total === 'number' ? d.total : 0,
        };
        const t = this.ahora();
        if (t - ultimoEmitido >= MS_ENTRE_EVENTOS) {
          ultimoEmitido = t;
          pendiente = undefined;
          this.op.emitir?.(p);
        } else {
          pendiente = p;
        }
      };

      try {
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          armar();
          resto += dec.decode(value, { stream: true });
          const partes = resto.split('\n');
          resto = partes.pop() ?? '';
          for (const p of partes) linea(p);
        }
      } catch (e) {
        if (e instanceof ErrorOllama) throw e;
        if (ctl.signal.aborted) throw abortado();
        throw new ErrorOllama(`Se interrumpió la descarga de ${nombre}.`);
      }
      resto += dec.decode();
      linea(resto);
      if (!exito) {
        throw new ErrorOllama(`Se interrumpió la descarga de ${nombre}; inténtelo de nuevo.`);
      }
      // Siempre se emite el estado final.
      if (pendiente) this.op.emitir?.(pendiente);
    } finally {
      clearTimeout(temporizador);
      if (lector) {
        lector.cancel().catch(() => {});
        try {
          lector.releaseLock();
        } catch {
          /* aún hay una lectura pendiente */
        }
      }
      if (this.descargas.get(clave) === ctl) this.descargas.delete(clave);
    }
  }

  /** Suma el tamaño de todos los archivos de la carpeta de modelos (0 si no existe). */
  async espacioUsado(): Promise<number> {
    const sumar = async (dir: string): Promise<number> => {
      let entradas;
      try {
        entradas = await readdir(dir, { withFileTypes: true });
      } catch {
        return 0;
      }
      let total = 0;
      for (const e of entradas) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) total += await sumar(p);
        else if (e.isFile()) {
          try {
            total += (await stat(p)).size;
          } catch {
            /* desapareció mientras se leía */
          }
        }
      }
      return total;
    };
    return sumar(this.op.modelosDir());
  }
}
