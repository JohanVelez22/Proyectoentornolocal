import { readFile } from 'node:fs/promises';
import type { Eventos, EventosNucleo } from '../eventos';
import { ErrorWolf } from '../errores';
import type { Plataforma, ResultadoEscritura } from '../plataforma/tipos';
import type { EstadoHosts } from '../tipos';
import { analizarHosts, aplicarBloque, normalizarDominios } from './bloque';

export type ResultadoSync =
  | { ok: true }
  | {
      ok: false;
      motivo: string;
      comandoManual: string;
      /** Dominios que siguen sin estar en el bloque (cuando se pudo leer el archivo). */
      pendientes?: string[];
    };

/** Una línea para pegar en una PowerShell de administrador (contenido en base64, sin problemas de comillas). */
export function comandoManualPara(destino: string, contenido: string): string {
  const b64 = Buffer.from(contenido, 'utf8').toString('base64');
  const ruta = destino.replace(/'/g, "''");
  return (
    `[IO.File]::WriteAllText('${ruta}', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${b64}')), (New-Object Text.UTF8Encoding($false))); ` +
    'ipconfig /flushdns'
  );
}

class ErrorLecturaHosts extends Error {
  constructor(readonly codigo: string) {
    super(`No se pudo leer el archivo hosts: ${codigo}`);
  }
}

async function leerHosts(ruta: string): Promise<string> {
  try {
    return await readFile(ruta, 'utf8');
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'ENOENT') return '';
    throw new ErrorLecturaHosts(code ?? 'desconocido');
  }
}

/** Plazo por defecto para que el usuario conteste el UAC al escribir hosts. */
export const TIEMPO_LIMITE_UAC_MS = 120_000;

/** Margen sobre el plazo para el respaldo propio si la plataforma no corta a tiempo. */
const MARGEN_PLAZO_MS = 5_000;

export interface OpcionesGestorHosts {
  /** Plazo para contestar el UAC (por defecto 120 s). */
  tiempoLimiteMs?: number;
}

/**
 * Error con código para un UAC que nadie contestó a tiempo. `sincronizar` no lo lanza: lo
 * convierte en `{ ok: false, motivo: 'tiempo' }` para que el sitio quede guardado con hosts
 * pendiente; se exporta para quien quiera distinguirlo.
 */
export const errorTiempoUac = (segundos: number): ErrorWolf =>
  new ErrorWolf(
    'hosts.tiempo_agotado',
    `No hubo respuesta al permiso de administrador en ${segundos} s; el archivo hosts quedó igual.`,
    { segundos },
  );

const RAZONES: Record<'cancelado' | 'denegado' | 'tiempo', string> = {
  cancelado: 'se canceló el permiso de administrador.',
  denegado: 'Windows negó el acceso.',
  tiempo: 'no hubo respuesta al permiso de administrador a tiempo.',
};

export class GestorHosts {
  private readonly tiempoLimiteMs: number;
  /** Escritura en curso (a lo sumo una: un solo UAC a la vez). */
  private enCurso: Promise<ResultadoSync> | null = null;
  /** Pedido agrupado que espera a la escritura en curso: se queda con los dominios más nuevos. */
  private espera: { dominios: string[]; promesa: Promise<ResultadoSync> } | null = null;

  constructor(
    private readonly p: Plataforma,
    private readonly eventos: Eventos<EventosNucleo>,
    o: OpcionesGestorHosts = {},
  ) {
    this.tiempoLimiteMs = o.tiempoLimiteMs ?? TIEMPO_LIMITE_UAC_MS;
  }

  async estado(dominios: string[], mensaje?: string): Promise<EstadoHosts> {
    const pedidos = normalizarDominios(dominios);
    let texto: string;
    try {
      texto = await leerHosts(this.p.rutaHosts());
    } catch (e) {
      if (!(e instanceof ErrorLecturaHosts)) throw e;
      const fallo: EstadoHosts = { pendientes: pedidos, duplicadosFuera: [], mensaje: e.message };
      this.eventos.emit('hosts:estado', fallo);
      return fallo;
    }
    const { enBloque, fuera } = analizarHosts(texto);
    const e: EstadoHosts = {
      pendientes: pedidos.filter((d) => !enBloque.includes(d)),
      duplicadosFuera: pedidos.filter((d) => fuera.includes(d)),
    };
    if (mensaje) e.mensaje = mensaje;
    this.eventos.emit('hosts:estado', e);
    return e;
  }

  /**
   * Deja en el bloque de WolfCore exactamente `dominios`. Hay una sola escritura elevada a la
   * vez: los pedidos que llegan mientras un UAC está abierto se agrupan en uno (con la lista más
   * nueva) que corre al terminar. Si ese UAC se canceló o venció, los agrupados no abren otro:
   * quedan pendientes hasta "Aplicar hosts pendientes", que pide UNA elevación para todos.
   */
  sincronizar(dominios: string[]): Promise<ResultadoSync> {
    if (!this.enCurso) return this.arrancar(dominios, null);
    if (this.espera) {
      this.espera.dominios = dominios;
      return this.espera.promesa;
    }
    const previa = this.enCurso;
    const espera: { dominios: string[]; promesa: Promise<ResultadoSync> } = {
      dominios,
      promesa: previa
        .then(
          (r) => r,
          () => null,
        )
        .then((r) => {
          this.espera = null;
          this.enCurso = null;
          return this.arrancar(
            espera.dominios,
            r && !r.ok && r.motivo !== 'error' ? r.motivo : null,
          );
        }),
    };
    this.espera = espera;
    return espera.promesa;
  }

  private arrancar(dominios: string[], sinElevarPor: string | null): Promise<ResultadoSync> {
    const p = this.escribir(dominios, sinElevarPor);
    this.enCurso = p;
    void p.then(
      () => {
        if (this.enCurso === p) this.enCurso = null;
      },
      () => {
        if (this.enCurso === p) this.enCurso = null;
      },
    );
    return p;
  }

  /** Escribe con el plazo del UAC. Con `sinElevarPor`, no eleva: informa ese motivo. */
  private async escribir(dominios: string[], sinElevarPor: string | null): Promise<ResultadoSync> {
    const destino = this.p.rutaHosts();
    let actual: string;
    try {
      actual = await leerHosts(destino);
    } catch (e) {
      if (!(e instanceof ErrorLecturaHosts)) throw e;
      await this.estado(dominios);
      return { ok: false, motivo: 'error', comandoManual: '' };
    }
    const nuevo = aplicarBloque(actual, dominios);
    if (nuevo === actual) {
      await this.estado(dominios);
      return { ok: true };
    }
    const r: ResultadoEscritura = sinElevarPor
      ? { ok: false, motivo: sinElevarPor as 'cancelado' | 'denegado' | 'tiempo' }
      : await this.escribirConPlazo(destino, nuevo);
    if (r.ok) {
      await this.estado(dominios);
      return { ok: true };
    }
    const razon =
      r.motivo === 'error'
        ? `ocurrió un error${r.detalle ? ` (${r.detalle})` : ''}.`
        : RAZONES[r.motivo];
    const e = await this.estado(dominios, `No se pudo actualizar el archivo hosts: ${razon}`);
    return {
      ok: false,
      motivo: r.motivo,
      comandoManual: comandoManualPara(destino, nuevo),
      pendientes: e.pendientes,
    };
  }

  /**
   * La plataforma recibe el plazo y corta la elevación; además hay un respaldo propio (plazo +
   * margen) por si no lo respeta, para que la cola de configuración nunca quede colgada.
   */
  private async escribirConPlazo(destino: string, nuevo: string): Promise<ResultadoEscritura> {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const respaldo =
      this.tiempoLimiteMs < MARGEN_PLAZO_MS
        ? this.tiempoLimiteMs
        : this.tiempoLimiteMs + MARGEN_PLAZO_MS;
    const vencido = new Promise<never>((_, rechazar) => {
      temporizador = setTimeout(
        () => rechazar(errorTiempoUac(Math.round(this.tiempoLimiteMs / 1000))),
        respaldo,
      );
    });
    try {
      return await Promise.race([
        this.p.escribirComoAdmin(destino, nuevo, { tiempoLimiteMs: this.tiempoLimiteMs }),
        vencido,
      ]);
    } catch (e) {
      if (e instanceof ErrorWolf && e.codigo === 'hosts.tiempo_agotado') {
        return { ok: false, motivo: 'tiempo' };
      }
      throw e;
    } finally {
      clearTimeout(temporizador);
    }
  }
}
