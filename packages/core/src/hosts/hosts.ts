import { readFile } from 'node:fs/promises';
import type { Eventos, EventosNucleo } from '../eventos';
import type { Plataforma } from '../plataforma/tipos';
import type { EstadoHosts } from '../tipos';
import { analizarHosts, aplicarBloque } from './bloque';

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

async function leerHosts(ruta: string): Promise<string> {
  try {
    return await readFile(ruta, 'utf8');
  } catch {
    return '';
  }
}

export class GestorHosts {
  constructor(
    private readonly p: Plataforma,
    private readonly eventos: Eventos<EventosNucleo>,
  ) {}

  async estado(dominios: string[], mensaje?: string): Promise<EstadoHosts> {
    const { enBloque, fuera } = analizarHosts(await leerHosts(this.p.rutaHosts()));
    const pedidos = [...new Set(dominios.map((d) => d.toLowerCase()))].sort();
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
    const actual = await leerHosts(destino);
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
