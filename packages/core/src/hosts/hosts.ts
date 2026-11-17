import { readFile } from 'node:fs/promises';
import type { Eventos, EventosNucleo } from '../eventos';
import type { Plataforma } from '../plataforma/tipos';
import type { EstadoHosts } from '../tipos';
import { analizarHosts, aplicarBloque, normalizarDominios } from './bloque';

export type ResultadoSync = { ok: true } | { ok: false; motivo: string; comandoManual: string };

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

export class GestorHosts {
  constructor(
    private readonly p: Plataforma,
    private readonly eventos: Eventos<EventosNucleo>,
  ) {}

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

  async sincronizar(dominios: string[]): Promise<ResultadoSync> {
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
    const r = await this.p.escribirComoAdmin(destino, nuevo);
    if (r.ok) {
      await this.estado(dominios);
      return { ok: true };
    }
    const razon =
      r.motivo === 'cancelado'
        ? 'se canceló el permiso de administrador.'
        : r.motivo === 'denegado'
          ? 'Windows negó el acceso.'
          : `ocurrió un error${r.detalle ? ` (${r.detalle})` : ''}.`;
    await this.estado(dominios, `No se pudo actualizar el archivo hosts: ${razon}`);
    return { ok: false, motivo: r.motivo, comandoManual: comandoManualPara(destino, nuevo) };
  }
}
