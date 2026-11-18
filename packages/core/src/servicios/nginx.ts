import { existsSync } from 'node:fs';
import { copyFile, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Instalador } from '../catalogo/instalador';
import { generarNginxPrincipal } from '../nginx/principal';
import type { Ejecutor, Plataforma } from '../plataforma/tipos';
import { ejecutorPorDefecto } from '../plataforma/win';
import type { Supervisor } from '../procesos/supervisor';
import type { Rutas } from '../rutas';
import type { Config } from '../tipos';

export class ErrorPuertoOcupado extends Error {
  constructor(
    readonly puerto: number,
    readonly pid: number,
    readonly nombre: string,
    /** Puerto libre que se sugiere usar en su lugar. */
    readonly alternativo?: number,
  ) {
    super(
      alternativo === undefined
        ? `El puerto ${puerto} lo usa ${nombre} (PID ${pid}). Ciérrelo o cambie el puerto en Ajustes.`
        : `El puerto ${puerto} lo usa ${nombre} (PID ${pid}). Use el puerto ${alternativo}.`,
    );
    this.name = 'ErrorPuertoOcupado';
  }
}

export type SupervisorServicios = Pick<Supervisor, 'iniciar' | 'detener' | 'estado' | 'pid'> &
  Partial<Pick<Supervisor, 'marcarDeteniendo' | 'mensaje'>>;
export type InstaladorServicios = Pick<Instalador, 'instalados' | 'instalado'>;
export type UpstreamPhp = { version: string; puertos: number[] };

/** Lanza ErrorPuertoOcupado si otro proceso (no el nuestro con ese id) usa el puerto. */
export async function verificarPuerto(
  plataforma: Plataforma,
  supervisor: SupervisorServicios,
  id: string,
  puerto: number,
): Promise<void> {
  const uso = await plataforma.quienUsaPuerto(puerto);
  if (!uso) return;
  if (supervisor.pid(id) === uso.pid) return;
  throw new ErrorPuertoOcupado(puerto, uso.pid, uso.nombre);
}

/** Orden numérico de versiones "1.28.0" < "1.30.6". */
export const compararVersiones = (a: string, b: string): number => {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

const pausa = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export class ServicioNginx {
  constructor(
    private readonly rutas: Rutas,
    private readonly plataforma: Plataforma,
    private readonly supervisor: SupervisorServicios,
    private readonly instalador: InstaladorServicios,
    private readonly leerConfig: () => Promise<Config>,
    private readonly obtenerUpstreams: () => Promise<UpstreamPhp[]> = async () => [],
    private readonly exec: Ejecutor = ejecutorPorDefecto,
    /** Certificado de localhost para el servidor por defecto; null si el HTTPS no es usable. */
    private readonly httpsPrincipal: () => Promise<{
      puerto: number;
      crt: string;
      key: string;
    } | null> = async () => null,
    /** Vhost interno de Adminer (null si no está instalado). */
    private readonly adminer: () => Promise<{
      raiz: string;
      puertos: number[];
    } | null> = async () => null,
  ) {}

  /** Versión configurada si está instalada; si no, la más reciente instalada. */
  async versionActiva(config?: Config): Promise<string> {
    const cfg = config ?? (await this.leerConfig());
    const instaladas = await this.instalador.instalados('nginx');
    const elegida = cfg.servicios.nginx.version;
    if (elegida && instaladas.includes(elegida)) return elegida;
    const nueva = [...instaladas].sort(compararVersiones).at(-1);
    if (!nueva) throw new Error('Nginx no está instalado. Instálelo desde Servicios.');
    return nueva;
  }

  private async argsBase(): Promise<{ bin: string; args: string[] }> {
    const bin = this.rutas.bin('nginx', await this.versionActiva());
    // nginx abre <prefijo>/logs/error.log antes de leer el conf y usa <prefijo>/temp/*
    await mkdir(path.join(bin, 'logs'), { recursive: true });
    await mkdir(path.join(bin, 'temp'), { recursive: true });
    return { bin, args: ['-p', bin, '-c', this.rutas.nginxConf()] };
  }

  /** nginx resuelve los include relativos contra la carpeta del conf principal. */
  private async copiarIncluidos(bin: string): Promise<void> {
    const etc = path.dirname(this.rutas.nginxConf());
    await mkdir(etc, { recursive: true });
    for (const f of ['mime.types', 'fastcgi_params']) {
      const origen = path.join(bin, 'conf', f);
      if (existsSync(origen)) await copyFile(origen, path.join(etc, f));
    }
  }

  private async generarConf(bin: string, destino: string): Promise<void> {
    const https = await this.httpsPrincipal();
    const adminer = await this.adminer();
    const contenido = generarNginxPrincipal({
      prefijo: bin,
      sitesDir: path.dirname(this.rutas.vhost('x')),
      phpUpstreams: await this.obtenerUpstreams(),
      logsDir: this.rutas.logs(),
      puerto: (await this.leerConfig()).servicios.nginx.puerto,
      ...(https ? { https } : {}),
      ...(adminer ? { adminer } : {}),
    });
    await mkdir(this.rutas.logs(), { recursive: true });
    await mkdir(path.dirname(this.rutas.vhost('x')), { recursive: true });
    await this.copiarIncluidos(bin);
    await writeFile(destino, contenido, 'utf8');
  }

  async probarConfig(conf?: string): Promise<{ ok: boolean; salida: string }> {
    const { bin, args: base } = await this.argsBase();
    const args = conf ? ['-p', bin, '-c', conf] : base;
    await this.copiarIncluidos(bin);
    const r = await this.exec(
      path.join(bin, this.plataforma.ejecutable('nginx')),
      ['-t', ...args],
      {
        timeoutMs: 10_000,
      },
    );
    return { ok: r.codigo === 0, salida: `${r.stderr}${r.stdout}`.trim() };
  }

  /** Genera un candidato, lo valida y solo entonces reemplaza nginx.conf. */
  private async prepararYProbar(): Promise<{ bin: string; args: string[] }> {
    const base = await this.argsBase();
    const candidato = `${this.rutas.nginxConf()}.nuevo`;
    await this.generarConf(base.bin, candidato);
    const prueba = await this.probarConfig(candidato);
    if (!prueba.ok) {
      await rm(candidato, { force: true });
      throw new Error(prueba.salida || 'La configuración de nginx no es válida');
    }
    await rename(candidato, this.rutas.nginxConf());
    return base;
  }

  /** Genera y valida la configuración (reemplaza nginx.conf solo si es válida) sin iniciar ni recargar. */
  async validar(): Promise<{ ok: boolean; salida: string }> {
    try {
      await this.prepararYProbar();
      return { ok: true, salida: 'La configuración de nginx es válida.' };
    } catch (e) {
      return { ok: false, salida: e instanceof Error ? e.message : String(e) };
    }
  }

  async iniciar(): Promise<void> {
    const cfg = await this.leerConfig();
    const puerto = cfg.servicios.nginx.puerto;
    await verificarPuerto(this.plataforma, this.supervisor, 'nginx', puerto);
    const { bin, args } = await this.prepararYProbar();
    await this.supervisor.iniciar({
      id: 'nginx',
      comando: path.join(bin, this.plataforma.ejecutable('nginx')),
      args,
      cwd: bin,
      puerto,
      log: this.rutas.logs('nginx.log'),
      reiniciar: true,
    });
  }

  async recargar(): Promise<void> {
    const e = this.supervisor.estado('nginx');
    if (e === 'apagado' || e === 'error') return;
    const { bin, args } = await this.prepararYProbar();
    const r = await this.exec(
      path.join(bin, this.plataforma.ejecutable('nginx')),
      ['-s', 'reload', ...args],
      { timeoutMs: 10_000 },
    );
    if (r.codigo !== 0) throw new Error(`${r.stderr}${r.stdout}`.trim() || 'No se pudo recargar');
  }

  async detener(): Promise<void> {
    const pid = this.supervisor.pid('nginx');
    if (pid !== null) {
      try {
        const { bin, args } = await this.argsBase();
        await this.exec(
          path.join(bin, this.plataforma.ejecutable('nginx')),
          ['-s', 'quit', ...args],
          { timeoutMs: 5000 },
        );
        const limite = Date.now() + 3000;
        while (Date.now() < limite && (await this.plataforma.procesoVivo(pid)).vivo) {
          await pausa(100);
        }
      } catch {
        // si quit falla, el supervisor lo detiene a la fuerza
      }
    }
    await this.supervisor.detener('nginx');
  }
}
