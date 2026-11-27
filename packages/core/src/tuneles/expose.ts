import { existsSync } from 'node:fs';
import { chmod, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { PlataformaCompleta } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { Sitio } from '../tipos';
import { leerToken, urlHttps } from './ngrok';
import {
  idSitioSeguro,
  sinAnsi,
  type ContextoTunel,
  type LanzamientoTunel,
  type ProveedorTunel,
  type ResultadoDisponible,
  type SecretosTunel,
} from './proveedor';

export const ID_SECRETO_EXPOSE = 'tunel:expose';

export interface DepsExpose {
  rutas: Rutas;
  plataforma: Pick<PlataformaCompleta, 'restringirAlUsuario' | 'buscarEjecutable'>;
  secretos: () => SecretosTunel | null;
  /** El `php` CLI de WolfCore Dev con el que se ejecuta `expose.phar` (null si no hay PHP). */
  phpCli: () => Promise<string | null>;
}

const HOST_LOCAL = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i;

/** Un valor como cadena PHP entre comillas simples (el token ya se validó; esto es defensa). */
const cadenaPhp = (v: string): string => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * Expose (beyondcode/expose, hoy `exposedev/expose`).
 *
 * - **Token**: solo en `AlmacenSecretos` (`tunel:expose`). Expose no lee el token del entorno ni
 *   lo acepta de forma segura por órdenes (`--auth=` quedaría en la lista de procesos); solo de un
 *   archivo de configuración PHP. Ese archivo (`run/expose/<sitio>.php`) se escribe en una carpeta
 *   restringida al usuario dentro de los datos, con modo 0600, se apunta con `EXPOSE_CONFIG_FILE`
 *   (que Expose prioriza sobre `.expose.php` de la carpeta actual y sobre `~/.expose/config.php`,
 *   fuente: `app/Support/ExposeConfig.php`) y se borra al cerrar, al caer y al arrancar la app.
 *   Nunca se usa su configuración global: además `HOME`/`USERPROFILE` apuntan a un inicio propio
 *   y se quitan las variables `EXPOSE_*` heredadas.
 * - **Binario**: Expose no publica ningún binario con huella (las releases de GitHub no traen
 *   archivos y el instalador oficial es `curl | sh`). Se usa el `expose` que el usuario ya tiene o
 *   su `expose.phar` en `bin/expose/` de los datos de WolfCore Dev, ejecutado con el PHP de la app.
 * - **Windows**: Expose no publica un `.exe`; allí solo funciona con `expose.phar` (y el PHP de la app).
 * - **Inspector**: Expose 3 abre un panel de peticiones en 0.0.0.0 e ignora `dashboard_port`, así que
 *   queda visible en la red local. No se cierra con cortafuegos (exige elevar permisos): con datos
 *   reales se rechaza y en los demás sitios la confirmación lo avisa.
 * - **No se pasa `-v`**: con verbosidad Expose imprime el token en pantalla.
 */
export class Expose implements ProveedorTunel {
  readonly id = 'expose' as const;
  readonly sinCloudflared = true;

  constructor(private readonly d: DepsExpose) {}

  private config(sitioId: string): string {
    return path.join(this.d.rutas.exposeRun(), `${sitioId}.php`);
  }
  private inicio(sitioId: string): string {
    return path.join(this.d.rutas.exposeRun(), `inicio-${sitioId}`);
  }
  private phar(): string {
    return path.join(this.d.rutas.exposeBin(), 'expose.phar');
  }

  /** Cómo se lanza Expose: `expose` del PATH, o `php expose.phar`. */
  private async comando(): Promise<{ comando: string; previos: string[] } | null> {
    const exe = await this.d.plataforma.buscarEjecutable('expose');
    if (exe) return { comando: exe, previos: [] };
    if (existsSync(this.phar())) {
      const php = await this.d.phpCli();
      if (php) return { comando: php, previos: [this.phar()] };
    }
    return null;
  }

  private noInstalado(): ErrorWolf {
    const carpeta = this.d.rutas.exposeBin();
    return new ErrorWolf(
      'tuneles.expose_no_instalado',
      `Expose no está instalado: instálelo o ponga expose.phar en ${carpeta}.`,
      { carpeta },
    );
  }

  async disponible(sitio: Sitio): Promise<ResultadoDisponible> {
    if (sitio.datosReales) return { ok: false, codigo: 'tuneles.expose_datos_reales' };
    if (!(await this.comando())) {
      return {
        ok: false,
        codigo: 'tuneles.expose_no_instalado',
        datos: { carpeta: this.d.rutas.exposeBin() },
      };
    }
    const s = this.d.secretos();
    if (!s || !s.disponible()) return { ok: false, codigo: 'tuneles.sin_cifrado' };
    if ((await leerToken(s, ID_SECRETO_EXPOSE)) === null) {
      return { ok: false, codigo: 'tuneles.expose_sin_token' };
    }
    return { ok: true };
  }

  async abrir(sitio: Sitio, c: ContextoTunel): Promise<LanzamientoTunel> {
    // El inspector de Expose escucha en toda la red local: nunca con datos reales de clientes.
    if (sitio.datosReales) {
      throw new ErrorWolf(
        'tuneles.expose_datos_reales',
        'Expose no se usa con sitios con datos reales: su inspector queda visible en la red local.',
      );
    }
    if (!idSitioSeguro(sitio.id) || !HOST_LOCAL.test(sitio.dominio)) {
      throw new ErrorWolf('tuneles.cloudflare_datos_invalidos', 'El sitio no es válido.');
    }
    const cmd = await this.comando();
    if (!cmd) throw this.noInstalado();
    const s = this.d.secretos();
    if (!s || !s.disponible()) {
      throw new ErrorWolf('tuneles.sin_cifrado', 'El cifrado del sistema no está disponible.');
    }
    const token = await leerToken(s, ID_SECRETO_EXPOSE);
    if (token === null)
      throw new ErrorWolf('tuneles.expose_sin_token', 'Falta el token de Expose.');
    const carpeta = this.d.rutas.exposeRun();
    await mkdir(carpeta, { recursive: true });
    // Primero la carpeta restringida: el archivo con el token nunca existe en una abierta.
    await this.d.plataforma.restringirAlUsuario(carpeta).catch(() => false);
    const inicio = this.inicio(sitio.id);
    await mkdir(inicio, { recursive: true });
    const config = this.config(sitio.id);
    const php = ['<?php', 'return [', `    'auth_token' => ${cadenaPhp(token)},`, '];', ''].join(
      '\n',
    );
    await writeFile(config, php, { encoding: 'utf8', mode: 0o600 });
    await chmod(config, 0o600).catch(() => undefined);
    // El archivo con el token: si no se puede dejar solo al usuario, no se usa.
    if (!(await this.d.plataforma.restringirAlUsuario(config).catch(() => false))) {
      await rm(config, { force: true });
      throw new ErrorWolf(
        'tuneles.credencial_no_protegida',
        'No se pudo restringir la credencial al usuario, así que no se usó.',
      );
    }
    const puerto = c.puertoNginx === 80 ? '' : `:${c.puertoNginx}`;
    return {
      comando: cmd.comando,
      args: [...cmd.previos, 'share', `http://${sitio.dominio}${puerto}`, '--no-vite-detection'],
      // Sin token en el entorno ni en la línea de órdenes: solo la ruta del archivo restringido.
      // El SQLite de peticiones y los temporales de Expose caen en su inicio (se borra al cerrar),
      // no en %TEMP% del usuario.
      env: {
        EXPOSE_CONFIG_FILE: config,
        HOME: inicio,
        USERPROFILE: inicio,
        TMP: inicio,
        TEMP: inicio,
        TMPDIR: inicio,
      },
      secretos: [token],
      quitarEntorno: ['EXPOSE_'],
      cwd: carpeta,
    };
  }

  /** La URL de la tabla de conexión de Expose (`Public URL`). */
  url(_sitio: Sitio, texto: string): string | null {
    const limpio = sinAnsi(texto);
    const m = /Public (?:URL|HTTPS)[^\n]*?(https:\/\/[A-Za-z0-9.-]+(?::\d+)?)/i.exec(limpio);
    return m ? urlHttps(m[1]!) : null;
  }

  /** Con la URL ya hay conexión: el archivo con el token deja de hacer falta y se borra. */
  async listo(sitio: Sitio): Promise<void> {
    if (idSitioSeguro(sitio.id)) await rm(this.config(sitio.id), { force: true });
  }

  async cerrar(sitioId: string): Promise<void> {
    if (!idSitioSeguro(sitioId)) return;
    await rm(this.config(sitioId), { force: true });
    await rm(this.inicio(sitioId), { recursive: true, force: true });
  }

  /** Al arrancar: borra los archivos con token que una caída dejó (los túneles vivos se reabren). */
  async barrerTemporales(conservar: ReadonlySet<string>): Promise<void> {
    let nombres: string[];
    try {
      nombres = await readdir(this.d.rutas.exposeRun());
    } catch {
      return;
    }
    for (const n of nombres) {
      const m = /^(?:inicio-)?(.+?)(?:\.php)?$/.exec(n);
      const id = m?.[1];
      if (!id || conservar.has(id)) continue;
      await rm(path.join(this.d.rutas.exposeRun(), n), { recursive: true, force: true }).catch(
        () => undefined,
      );
    }
  }
}
