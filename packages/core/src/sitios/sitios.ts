import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Almacen } from '../almacen';
import type { Instalador } from '../catalogo/instalador';
import type { Eventos, EventosNucleo } from '../eventos';
import { DOMINIO_VALIDO } from '../hosts/bloque';
import type { GestorHosts } from '../hosts/hosts';
import { generarVhost } from '../nginx/plantillas';
import { puertosPhp } from '../nginx/principal';
import type { Rutas } from '../rutas';
import type { ServicioNginx, UpstreamPhp } from '../servicios/nginx';
import { SitioSchema, type Config, type Sitio } from '../tipos';

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

export interface AjustesServicios {
  puerto: number;
  trabajadores: number;
}

export function validarAjustes(a: AjustesServicios): void {
  if (!Number.isInteger(a.puerto) || a.puerto < 1 || a.puerto > 65535) {
    throw new Error('El puerto de Nginx debe ser un número entre 1 y 65535');
  }
  if (!Number.isInteger(a.trabajadores) || a.trabajadores < 1 || a.trabajadores > 8) {
    throw new Error('Los trabajadores de PHP deben ser entre 1 y 8');
  }
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
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sitio';

const limpiarDominios = <T extends { dominio: string; alias: string[] }>(s: T): T => ({
  ...s,
  dominio: s.dominio.trim().toLowerCase(),
  alias: s.alias.map((a) => a.trim().toLowerCase()),
});

export class GestorSitios {
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsSitios) {}

  /** Ejecuta las operaciones una a la vez, en orden de llegada. */
  private serializar<T>(fn: () => Promise<T>): Promise<T> {
    const r = this.cola.then(fn, fn);
    this.cola = r.catch(() => undefined);
    return r;
  }

  async listar(): Promise<Sitio[]> {
    return (await this.d.almacen.leer()).sitios;
  }

  private async validar(datos: Omit<Sitio, 'id'>, otros: Sitio[], previo?: Sitio): Promise<void> {
    if (!datos.dominio.endsWith('.test') || datos.dominio === '.test') {
      throw new Error('El dominio debe terminar en .test');
    }
    if (datos.alias.some((a) => !a.endsWith('.test') || a === '.test')) {
      throw new Error('El dominio debe terminar en .test');
    }
    for (const d of [datos.dominio, ...datos.alias]) {
      if (!DOMINIO_VALIDO.test(d)) {
        throw new Error(
          `Dominio inválido: ${d}. Use solo letras, números, guiones y puntos (sin tildes ni espacios).`,
        );
      }
    }
    if (datos.alias.includes(datos.dominio)) {
      throw new Error(`El alias ${datos.dominio} es igual al dominio del sitio`);
    }
    const repetido = datos.alias.find((a, i) => datos.alias.indexOf(a) !== i);
    if (repetido) throw new Error(`El alias ${repetido} está repetido`);
    for (const p of [datos.dominio, ...datos.alias]) {
      if (otros.some((o) => o.dominio === p || o.alias.includes(p))) {
        throw new Error(`Ya existe un sitio con el dominio ${p}`);
      }
    }
    if (datos.tipo === 'proxy') {
      if (datos.puertoProxy === null) throw new Error('Un sitio proxy necesita un puerto');
      return;
    }
    const cambioTipo = !previo || previo.tipo !== datos.tipo;
    const usaPhp =
      datos.tipo === 'laravel' || datos.tipo === 'codeigniter3' || datos.tipo === 'personalizado';
    if (usaPhp && !datos.php) throw new Error('Seleccione una versión de PHP para este sitio');
    if (
      usaPhp &&
      datos.php &&
      (cambioTipo || previo.php !== datos.php) &&
      !(await this.d.instalador.instalado('php', datos.php))
    ) {
      throw new Error(`PHP ${datos.php} no está instalado. Instálelo desde Servicios.`);
    }
    if ((cambioTipo || previo.carpeta !== datos.carpeta) && !existsSync(datos.carpeta)) {
      throw new Error(`La carpeta no existe: ${datos.carpeta}`);
    }
  }

  crear(datos: Omit<Sitio, 'id'>): Promise<Sitio> {
    return this.serializar(() => this.crearSinCola(datos));
  }

  private async crearSinCola(datos: Omit<Sitio, 'id'>): Promise<Sitio> {
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

  editar(id: string, cambios: Partial<Sitio>): Promise<Sitio> {
    return this.serializar(() => this.editarSinCola(id, cambios));
  }

  private async editarSinCola(id: string, cambios: Partial<Sitio>): Promise<Sitio> {
    const cfg = await this.d.almacen.leer();
    const i = cfg.sitios.findIndex((s) => s.id === id);
    if (i < 0) throw new Error(`No existe el sitio ${id}`);
    const nuevo = limpiarDominios(SitioSchema.parse({ ...cfg.sitios[i], ...cambios, id }));
    await this.validar(
      nuevo,
      cfg.sitios.filter((s) => s.id !== id),
      cfg.sitios[i],
    );
    cfg.sitios[i] = nuevo;
    await this.d.almacen.guardar(cfg);
    this.d.eventos.emit('sitio:cambio', cfg.sitios);
    return nuevo;
  }

  /** Lee, modifica y guarda la configuración en la misma cola que los sitios. */
  modificarConfig(fn: (c: Config) => void): Promise<void> {
    return this.serializar(async () => {
      const cfg = await this.d.almacen.leer();
      fn(cfg);
      await this.d.almacen.guardar(cfg);
    });
  }

  /**
   * Guarda solo el puerto de Nginx y los trabajadores de PHP (en la cola, para no pisar un
   * sitio que se esté guardando a la vez). No aplica: el llamador decide cómo.
   */
  guardarAjustes(a: AjustesServicios): Promise<void> {
    return this.serializar(async () => {
      validarAjustes(a);
      const cfg = await this.d.almacen.leer();
      cfg.servicios.nginx.puerto = a.puerto;
      cfg.servicios.php.trabajadores = a.trabajadores;
      await this.d.almacen.guardar(cfg);
    });
  }

  /** Quita el sitio de la configuración. Nunca toca la carpeta del proyecto. */
  borrar(id: string): Promise<void> {
    return this.serializar(() => this.borrarSinCola(id));
  }

  private async borrarSinCola(id: string): Promise<void> {
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

  aplicar(): Promise<ResultadoAplicar> {
    return this.serializar(() => this.aplicarSinCola());
  }

  private async aplicarSinCola(): Promise<ResultadoAplicar> {
    const cfg = await this.d.almacen.leer();
    const dir = path.dirname(this.d.rutas.vhost('x'));
    await mkdir(dir, { recursive: true });
    await mkdir(this.d.rutas.logs('sitios'), { recursive: true });
    const previo = await this.instantanea(dir);

    let nginx: { ok: boolean; salida: string };
    try {
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
    } catch (e) {
      nginx = {
        ok: false,
        salida: `No se pudo aplicar la configuración de los sitios: ${e instanceof Error ? e.message : String(e)}`,
      };
    }

    if (!nginx.ok) {
      try {
        await this.restaurar(dir, previo);
      } catch (e) {
        nginx = {
          ok: false,
          salida: `${nginx.salida}
No se pudo restaurar la configuración anterior: ${e instanceof Error ? e.message : String(e)}`,
        };
      }
    }

    // Los hosts se sincronizan aunque nginx falle: una entrada sin vhost es inofensiva
    // y evita pedir otra vez permiso de administrador (UAC) más adelante.
    const dominios = [...new Set(cfg.sitios.flatMap((s) => [s.dominio, ...s.alias]))].sort();
    const r = await this.d.hosts.sincronizar(dominios);
    const hosts = r.ok
      ? { ok: true }
      : { ok: false, motivo: r.motivo, comandoManual: r.comandoManual };

    this.d.eventos.emit('sitio:cambio', cfg.sitios);
    return { nginx, hosts };
  }
}
