import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Almacen } from '../almacen';
import type { Instalador } from '../catalogo/instalador';
import type { Eventos, EventosNucleo } from '../eventos';
import type { GestorHosts } from '../hosts/hosts';
import { generarVhost } from '../nginx/plantillas';
import { puertosPhp } from '../nginx/principal';
import type { Rutas } from '../rutas';
import type { ServicioNginx, UpstreamPhp } from '../servicios/nginx';
import { SitioSchema, type Sitio } from '../tipos';

export type ResultadoAplicar = {
  nginx: { ok: boolean; salida: string };
  hosts: { ok: boolean; motivo?: string; comandoManual?: string };
};

export interface DepsSitios {
  almacen: Pick<Almacen, 'leer' | 'guardar'>;
  rutas: Rutas;
  nginx: Pick<ServicioNginx, 'validar' | 'recargar'>;
  estadoNginx: () => 'apagado' | 'iniciando' | 'encendido' | 'error';
  hosts: Pick<GestorHosts, 'sincronizar'>;
  instalador: Pick<Instalador, 'instalado' | 'instalados'>;
  eventos: Pick<Eventos<EventosNucleo>, 'emit'>;
}

const comparar = (a: string, b: string): number => {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

/** Ramas de PHP usadas por los sitios (sin proxy ni estáticos), únicas y ordenadas. */
export function ramasEnUso(sitios: Sitio[]): string[] {
  const set = new Set<string>();
  for (const s of sitios) {
    if (s.tipo !== 'proxy' && s.tipo !== 'estatico' && s.php) set.add(s.php);
  }
  return [...set].sort(comparar);
}

/** Upstreams para nginx.conf: solo ramas en uso e instaladas. */
export function upstreamsPara(
  sitios: Sitio[],
  trabajadores: number,
  instaladas: string[],
): UpstreamPhp[] {
  return ramasEnUso(sitios)
    .filter((v) => instaladas.includes(v))
    .map((version) => ({ version, puertos: puertosPhp(version, trabajadores) }));
}

const slug = (dominio: string): string =>
  dominio
    .replace(/\.test$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sitio';

const limpiarDominios = <T extends { dominio: string; alias: string[] }>(s: T): T => ({
  ...s,
  dominio: s.dominio.trim().toLowerCase(),
  alias: s.alias.map((a) => a.trim().toLowerCase()),
});

export class GestorSitios {
  constructor(private readonly d: DepsSitios) {}

  async listar(): Promise<Sitio[]> {
    return (await this.d.almacen.leer()).sitios;
  }

  private async validar(datos: Omit<Sitio, 'id'>, otros: Sitio[]): Promise<void> {
    if (!datos.dominio.endsWith('.test') || datos.dominio === '.test') {
      throw new Error('El dominio debe terminar en .test');
    }
    if (datos.alias.some((a) => !a.endsWith('.test'))) {
      throw new Error('El dominio debe terminar en .test');
    }
    for (const p of [datos.dominio, ...datos.alias]) {
      if (otros.some((o) => o.dominio === p || o.alias.includes(p))) {
        throw new Error(`Ya existe un sitio con el dominio ${p}`);
      }
    }
    if (datos.tipo === 'proxy') {
      if (datos.puertoProxy === null) throw new Error('Un sitio proxy necesita un puerto');
      return;
    }
    const usaPhp =
      datos.tipo === 'laravel' || datos.tipo === 'codeigniter3' || datos.tipo === 'personalizado';
    if (usaPhp && datos.php && !(await this.d.instalador.instalado('php', datos.php))) {
      throw new Error(`PHP ${datos.php} no está instalado. Instálelo desde Servicios.`);
    }
    if (!existsSync(datos.carpeta)) throw new Error(`La carpeta no existe: ${datos.carpeta}`);
  }

  async crear(datos: Omit<Sitio, 'id'>): Promise<Sitio> {
    const cfg = await this.d.almacen.leer();
    const limpio = limpiarDominios(SitioSchema.omit({ id: true }).parse(datos));
    await this.validar(limpio, cfg.sitios);
    const usados = new Set(cfg.sitios.map((s) => s.id));
    const raiz = slug(limpio.dominio);
    let id = raiz;
    for (let n = 2; usados.has(id); n++) id = `${raiz}-${n}`;
    const sitio = SitioSchema.parse({ ...limpio, id });
    cfg.sitios.push(sitio);
    await this.d.almacen.guardar(cfg);
    this.d.eventos.emit('sitio:cambio', cfg.sitios);
    return sitio;
  }

  async editar(id: string, cambios: Partial<Sitio>): Promise<Sitio> {
    const cfg = await this.d.almacen.leer();
    const i = cfg.sitios.findIndex((s) => s.id === id);
    if (i < 0) throw new Error(`No existe el sitio ${id}`);
    const nuevo = limpiarDominios(SitioSchema.parse({ ...cfg.sitios[i], ...cambios, id }));
    await this.validar(
      nuevo,
      cfg.sitios.filter((s) => s.id !== id),
    );
    cfg.sitios[i] = nuevo;
    await this.d.almacen.guardar(cfg);
    this.d.eventos.emit('sitio:cambio', cfg.sitios);
    return nuevo;
  }

  /** Quita el sitio de la configuración. Nunca toca la carpeta del proyecto. */
  async borrar(id: string): Promise<void> {
    const cfg = await this.d.almacen.leer();
    cfg.sitios = cfg.sitios.filter((s) => s.id !== id);
    await this.d.almacen.guardar(cfg);
    this.d.eventos.emit('sitio:cambio', cfg.sitios);
  }

  private async instantanea(dir: string): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    for (const n of await readdir(dir)) {
      if (n.endsWith('.conf')) mapa.set(n, await readFile(path.join(dir, n), 'utf8'));
    }
    return mapa;
  }

  private async restaurar(dir: string, previo: Map<string, string>): Promise<void> {
    for (const n of await readdir(dir)) {
      if (n.endsWith('.conf') && !previo.has(n)) await rm(path.join(dir, n), { force: true });
    }
    for (const [n, c] of previo) await writeFile(path.join(dir, n), c, 'utf8');
  }

  async aplicar(): Promise<ResultadoAplicar> {
    const cfg = await this.d.almacen.leer();
    const dir = path.dirname(this.d.rutas.vhost('x'));
    await mkdir(dir, { recursive: true });
    await mkdir(this.d.rutas.logs('sitios'), { recursive: true });
    const previo = await this.instantanea(dir);

    const vigentes = new Set(cfg.sitios.map((s) => `${s.id}.conf`));
    for (const n of previo.keys()) {
      if (!vigentes.has(n)) await rm(path.join(dir, n), { force: true });
    }
    for (const s of cfg.sitios) {
      const contenido = generarVhost(s, {
        puertoNginx: cfg.servicios.nginx.puerto,
        rutasLogs: {
          acceso: this.d.rutas.logs('sitios', `${s.id}.access.log`),
          error: this.d.rutas.logs('sitios', `${s.id}.error.log`),
        },
      });
      await writeFile(this.d.rutas.vhost(s.id), contenido, 'utf8');
    }

    let nginx: { ok: boolean; salida: string };
    if ((await this.d.instalador.instalados('nginx')).length === 0) {
      nginx = {
        ok: true,
        salida: 'Nginx no está instalado; la configuración se validará al iniciarlo.',
      };
    } else if (this.d.estadoNginx() === 'encendido') {
      try {
        await this.d.nginx.recargar();
        nginx = { ok: true, salida: 'Nginx recargado.' };
      } catch (e) {
        nginx = { ok: false, salida: e instanceof Error ? e.message : String(e) };
      }
    } else {
      nginx = await this.d.nginx.validar();
    }

    if (!nginx.ok) await this.restaurar(dir, previo);

    const dominios = [...new Set(cfg.sitios.flatMap((s) => [s.dominio, ...s.alias]))].sort();
    const r = await this.d.hosts.sincronizar(dominios);
    const hosts = r.ok
      ? { ok: true }
      : { ok: false, motivo: r.motivo, comandoManual: r.comandoManual };

    this.d.eventos.emit('sitio:cambio', cfg.sitios);
    return { nginx, hosts };
  }
}
