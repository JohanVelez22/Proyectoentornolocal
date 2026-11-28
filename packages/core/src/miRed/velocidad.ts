/**
 * Prueba de velocidad (D53) contra los endpoints públicos de Cloudflare (`speed.cloudflare.com`).
 * La hace el proceso principal y NO envía ningún dato de la persona: ni cookies, ni cabeceras de
 * identidad, ni referencia; la subida son ceros. Los tamaños son moderados, cada fase tiene su
 * plazo y todo se puede cancelar.
 */

/** Servidor oficial. Solo las pruebas lo cambian (por un servidor falso local). */
export const BASE_VELOCIDAD = 'https://speed.cloudflare.com';

/** Lo que se baja y se sube (bytes) y lo que eso gasta de datos, con la latencia incluida, en MB. */
export const BYTES_BAJADA = 25_000_000;
export const BYTES_SUBIDA = 10_000_000;
export const PLAN_VELOCIDAD = {
  bajadaMb: 25,
  subidaMb: 10,
  /** Aproximado: bajada + subida + las consultas de latencia. */
  totalMb: 35,
} as const;

const PLAZO_LATENCIA_MS = 5_000;
const PLAZO_BAJADA_MS = 30_000;
const PLAZO_SUBIDA_MS = 30_000;
const PINGS_LATENCIA = 5;

export type FaseVelocidad = 'latencia' | 'bajada' | 'subida';

export interface ResultadoVelocidad {
  /** Mediana de varias consultas pequeñas (la primera, con el saludo TLS, no cuenta). */
  latenciaMs: number | null;
  /** Mbps (megabits por segundo); null si la fase no llegó a medirse. */
  bajadaMbps: number | null;
  subidaMbps: number | null;
  bytesBajados: number;
  bytesSubidos: number;
  /** Se cortó por el usuario; lo medido hasta entonces va en el resultado. */
  cancelada: boolean;
  /** Una fase llegó al plazo y se calculó con lo recibido hasta entonces. */
  incompleta: boolean;
}

export interface OpcionesVelocidad {
  /** Solo para pruebas con un servidor falso; el núcleo nunca lo cambia. */
  base?: string;
  senal?: AbortSignal;
  alFase?: (fase: FaseVelocidad) => void;
  bytesBajada?: number;
  bytesSubida?: number;
  plazoBajadaMs?: number;
  plazoSubidaMs?: number;
  fetch?: typeof fetch;
}

const mbps = (bytes: number, ms: number): number =>
  ms <= 0 ? 0 : Math.round(((bytes * 8) / 1_000_000 / (ms / 1000)) * 10) / 10;

const mediana = (v: number[]): number => {
  const o = [...v].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 === 1 ? o[m]! : (o[m - 1]! + o[m]!) / 2;
};

/** Cancelación o plazo vencido (en undici llegan como AbortError, TimeoutError o con esa causa). */
const esCorte = (e: unknown): boolean =>
  e instanceof Error &&
  (e.name === 'AbortError' ||
    e.name === 'TimeoutError' ||
    (e.cause instanceof Error &&
      (e.cause.name === 'AbortError' || e.cause.name === 'TimeoutError')));

/** Opciones de cada petición: sin cookies ni referencia, sin caché. */
const SIN_DATOS: RequestInit = {
  credentials: 'omit',
  referrerPolicy: 'no-referrer',
  redirect: 'error',
};

export async function medirVelocidad(o: OpcionesVelocidad = {}): Promise<ResultadoVelocidad> {
  const base = (o.base ?? BASE_VELOCIDAD).replace(/\/+$/, '');
  const pedir = o.fetch ?? fetch;
  const r: ResultadoVelocidad = {
    latenciaMs: null,
    bajadaMbps: null,
    subidaMbps: null,
    bytesBajados: 0,
    bytesSubidos: 0,
    cancelada: false,
    incompleta: false,
  };
  const cancelada = (): boolean => o.senal?.aborted === true;
  const con = (plazoMs: number): AbortSignal =>
    o.senal
      ? AbortSignal.any([o.senal, AbortSignal.timeout(plazoMs)])
      : AbortSignal.timeout(plazoMs);

  // Latencia: consultas de 0 bytes; la primera abre la conexión y se descarta.
  o.alFase?.('latencia');
  const tiempos: number[] = [];
  try {
    for (let i = 0; i <= PINGS_LATENCIA && !cancelada(); i++) {
      const t0 = performance.now();
      const resp = await pedir(`${base}/__down?bytes=0`, {
        ...SIN_DATOS,
        signal: con(PLAZO_LATENCIA_MS),
      });
      await resp.arrayBuffer();
      if (!resp.ok) throw new Error(`El servidor de la prueba respondió ${resp.status}`);
      if (i > 0) tiempos.push(performance.now() - t0);
    }
  } catch (e) {
    // Cancelar no es un error; un plazo sin ninguna respuesta sí (no hay conexión).
    if (!cancelada() || !esCorte(e)) throw e;
  }
  if (tiempos.length > 0) r.latenciaMs = Math.round(mediana(tiempos) * 10) / 10;

  // Bajada: se mide desde que llega el primer dato, para no contar la latencia.
  if (!cancelada()) {
    o.alFase?.('bajada');
    const bytes = o.bytesBajada ?? BYTES_BAJADA;
    const plazo = o.plazoBajadaMs ?? PLAZO_BAJADA_MS;
    const senal = con(plazo);
    let inicio = 0;
    let fin = 0;
    try {
      const resp = await pedir(`${base}/__down?bytes=${bytes}`, { ...SIN_DATOS, signal: senal });
      if (!resp.ok || !resp.body) {
        throw new Error(`El servidor de la prueba respondió ${resp.status}`);
      }
      const lector = resp.body.getReader();
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        if (inicio === 0) inicio = performance.now();
        r.bytesBajados += value.byteLength;
        fin = performance.now();
      }
    } catch (e) {
      // Plazo o cancelación: se calcula con lo recibido (si llegó algo).
      if (!esCorte(e)) throw e;
      if (cancelada()) r.cancelada = true;
      else r.incompleta = true;
      fin = performance.now();
    }
    if (r.bytesBajados > 0 && inicio > 0 && fin > inicio)
      r.bajadaMbps = mbps(r.bytesBajados, fin - inicio);
  }

  // Subida: el cuerpo son ceros; se mide hasta que el servidor confirma.
  if (!cancelada()) {
    o.alFase?.('subida');
    const bytes = o.bytesSubida ?? BYTES_SUBIDA;
    const cuerpo = new Uint8Array(bytes);
    const t0 = performance.now();
    try {
      const resp = await pedir(`${base}/__up`, {
        ...SIN_DATOS,
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: cuerpo,
        signal: con(o.plazoSubidaMs ?? PLAZO_SUBIDA_MS),
      });
      await resp.arrayBuffer();
      if (!resp.ok) throw new Error(`El servidor de la prueba respondió ${resp.status}`);
      r.bytesSubidos = bytes;
      r.subidaMbps = mbps(bytes, performance.now() - t0);
    } catch (e) {
      if (!esCorte(e)) throw e;
      if (cancelada()) r.cancelada = true;
      else r.incompleta = true;
    }
  }
  if (cancelada()) r.cancelada = true;
  return r;
}
