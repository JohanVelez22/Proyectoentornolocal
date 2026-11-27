import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { PlataformaCompleta } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { Sitio } from '../tipos';
import {
  idSitioSeguro,
  tokenTunelValido,
  type ContextoTunel,
  type LanzamientoTunel,
  type ProblemaTunel,
  type ResultadoDisponible,
  type ProveedorTunel,
  type SecretosTunel,
} from './proveedor';

export const ID_SECRETO_NGROK = 'tunel:ngrok';

export interface DepsNgrok {
  rutas: Rutas;
  plataforma: Pick<PlataformaCompleta, 'restringirAlUsuario' | 'buscarEjecutable'>;
  secretos: () => SecretosTunel | null;
}

/** Dominio `.test` (o alias) del sitio: solo letras, números, puntos y guiones. */
const HOST_LOCAL = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i;

/**
 * ngrok.
 *
 * - **Token**: solo en `AlmacenSecretos` (`tunel:ngrok`) y en el entorno del proceso como
 *   `NGROK_AUTHTOKEN` (variable documentada en https://ngrok.com/docs/gateway/agent/config).
 *   Nunca en la línea de órdenes (`--authtoken`), ni en un archivo, ni en el log.
 * - **Configuración global**: ngrok lee `ngrok.yml` del perfil del usuario si no se le indica
 *   otra con `--config`. Se le pasa siempre una propia y mínima (`run/ngrok/<sitio>.yml`, sin
 *   secretos) para no leer ni mezclar la del usuario; se borra al cerrar. Además se quitan del
 *   entorno heredado las variables `NGROK_*`.
 * - **Host**: `--host-header` está obsoleto; se reescribe `Host` con una política de tráfico
 *   (`add-headers`, la acción oficial; para `host` reemplaza el valor) en `run/ngrok/<sitio>.politica.yml`.
 * - **URL**: `--log stdout --log-format json`; la línea `started tunnel` trae `url`.
 * - **Binario**: ngrok solo publica un enlace rodante (`.../ngrok-v3-stable-windows-amd64.zip`) y una
 *   página HTML con las huellas, sin versión fija ni índice legible: no hay descarga verificable.
 *   Se usa el `ngrok` que el usuario ya tiene instalado (en el PATH).
 */
export class Ngrok implements ProveedorTunel {
  readonly id = 'ngrok' as const;
  readonly sinCloudflared = true;

  constructor(private readonly d: DepsNgrok) {}

  private config(sitioId: string): string {
    return path.join(this.d.rutas.ngrokRun(), `${sitioId}.yml`);
  }
  private politica(sitioId: string): string {
    return path.join(this.d.rutas.ngrokRun(), `${sitioId}.politica.yml`);
  }

  async disponible(): Promise<ResultadoDisponible> {
    if (!(await this.d.plataforma.buscarEjecutable('ngrok'))) {
      return { ok: false, codigo: 'tuneles.ngrok_no_instalado' };
    }
    const s = this.d.secretos();
    if (!s || !s.disponible()) return { ok: false, codigo: 'tuneles.sin_cifrado' };
    if ((await leerToken(s, ID_SECRETO_NGROK)) === null) {
      return { ok: false, codigo: 'tuneles.ngrok_sin_token' };
    }
    return { ok: true };
  }

  async abrir(sitio: Sitio, c: ContextoTunel): Promise<LanzamientoTunel> {
    if (!idSitioSeguro(sitio.id) || !HOST_LOCAL.test(sitio.dominio)) {
      throw new ErrorWolf('tuneles.cloudflare_datos_invalidos', 'El sitio no es válido.');
    }
    const exe = await this.d.plataforma.buscarEjecutable('ngrok');
    if (!exe) throw new ErrorWolf('tuneles.ngrok_no_instalado', 'ngrok no está instalado.');
    const s = this.d.secretos();
    if (!s || !s.disponible()) {
      throw new ErrorWolf('tuneles.sin_cifrado', 'El cifrado del sistema no está disponible.');
    }
    const token = await leerToken(s, ID_SECRETO_NGROK);
    if (token === null) {
      throw new ErrorWolf('tuneles.ngrok_sin_token', 'Falta el token de ngrok.');
    }
    const carpeta = this.d.rutas.ngrokRun();
    await mkdir(carpeta, { recursive: true });
    await this.d.plataforma.restringirAlUsuario(carpeta).catch(() => false);
    const config = this.config(sitio.id);
    const politica = this.politica(sitio.id);
    // Sin secretos: solo existe para que ngrok no lea la configuración global del usuario.
    await writeFile(config, 'version: "3"\n', 'utf8');
    await writeFile(
      politica,
      [
        'on_http_request:',
        '  - actions:',
        '      - type: add-headers',
        '        config:',
        '          headers:',
        `            host: ${JSON.stringify(sitio.dominio)}`,
        '',
      ].join('\n'),
      'utf8',
    );
    return {
      comando: exe,
      args: [
        'http',
        String(c.puertoNginx),
        '--config',
        config,
        '--traffic-policy-file',
        politica,
        '--inspect=false',
        '--log',
        'stdout',
        '--log-format',
        'json',
      ],
      envSecreto: { NGROK_AUTHTOKEN: token },
      secretos: [token],
      quitarEntorno: ['NGROK_'],
      cwd: carpeta,
    };
  }

  /**
   * Un ngrok 3.x antiguo no conoce `--traffic-policy-file` (o la política de tráfico) y se queja:
   * se pide actualizarlo en vez de esperar un plazo sin URL.
   */
  problema(_sitio: Sitio, texto: string): ProblemaTunel | null {
    return /unknown flag|flag provided but not defined|ERR_NGROK_121|agent version.{0,40}too old|too old/i.test(
      texto,
    )
      ? { codigo: 'tuneles.ngrok_desactualizado' }
      : null;
  }

  /** La URL de la línea `started tunnel` del log JSON de ngrok. */
  url(_sitio: Sitio, texto: string): string | null {
    for (const linea of texto.split(/\r?\n/)) {
      if (!linea.startsWith('{')) continue;
      let o: unknown;
      try {
        o = JSON.parse(linea);
      } catch {
        continue;
      }
      if (typeof o !== 'object' || o === null) continue;
      const r = o as Record<string, unknown>;
      if (r['msg'] !== 'started tunnel' || typeof r['url'] !== 'string') continue;
      const url = urlHttps(r['url']);
      if (url) return url;
    }
    return null;
  }

  async cerrar(sitioId: string): Promise<void> {
    if (!idSitioSeguro(sitioId)) return;
    await rm(this.config(sitioId), { force: true });
    await rm(this.politica(sitioId), { force: true });
  }
}

/** El token guardado, validado: uno alterado no llega a un entorno ni a un archivo. */
export async function leerToken(s: SecretosTunel, id: string): Promise<string | null> {
  const t = await s.leer(id);
  if (t === null) return null;
  if (!tokenTunelValido(t)) {
    throw new ErrorWolf(
      'tuneles.token_invalido',
      'El token guardado no es válido: guárdelo de nuevo.',
    );
  }
  return t;
}

/** `https://host[:puerto]` sin usuario ni ruta, o null. */
export function urlHttps(texto: string): string | null {
  try {
    const u = new URL(texto);
    if (u.protocol !== 'https:' || u.username || u.password || !u.hostname) return null;
    return `https://${u.host}`;
  } catch {
    return null;
  }
}
