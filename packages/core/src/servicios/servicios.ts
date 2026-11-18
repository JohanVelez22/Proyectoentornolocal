import { puertosPhp } from '../nginx/principal';
import type { Ejecutor, Plataforma } from '../plataforma/tipos';
import { puertoResponde } from '../procesos/sonda';
import type { EstadoProceso } from '../procesos/supervisor';
import { AlmacenCredenciales } from '../almacen';
import type { Rutas } from '../rutas';
import type { Config, EstadoServicio, IdServicioDatos } from '../tipos';
import { ejecutorPorDefecto } from '../plataforma/win';
import { DEFINICIONES } from './datos';
import {
  esIdServicioDatos,
  ServiciosDatos,
  type DefServicio,
  type DepsServiciosDatos,
} from './definicion';
import {
  ServicioNginx,
  type InstaladorServicios,
  type SupervisorServicios,
  type UpstreamPhp,
} from './nginx';
import { ServicioPhp } from './php';

export interface DepsServicios {
  rutas: Rutas;
  plataforma: Plataforma;
  supervisor: SupervisorServicios;
  instalador: InstaladorServicios;
  leerConfig: () => Promise<Config>;
  /** Lee, modifica y guarda la configuración en la cola común (puertos de servicios). */
  modificarConfig: (fn: (c: Config) => void) => Promise<void>;
  /** Por defecto, el registro `DEFINICIONES` de servicios/datos.ts. */
  definiciones?: readonly DefServicio[];
  /** Por defecto, etc/credenciales.json con cola propia. */
  credenciales?: Pick<AlmacenCredenciales, 'leer' | 'obtenerOCrear'>;
  /** Para pruebas: borrado recursivo de carpetas de datos. */
  borrar?: DepsServiciosDatos['borrar'];
  /** Ramas de PHP usadas por al menos un sitio (las aporta la tarea 8). */
  ramasEnUso?: () => Promise<string[]>;
  /** Upstreams para nginx.conf; por defecto, ramas en uso que estén instaladas. */
  obtenerUpstreams?: () => Promise<UpstreamPhp[]>;
  sonda?: (puerto: number) => Promise<boolean>;
  exec?: Ejecutor;
  /** Certificado de localhost del servidor por defecto (null si el HTTPS no es usable). */
  httpsPrincipal?: () => Promise<{ puerto: number; crt: string; key: string } | null>;
  /** Carpeta y puertos PHP del vhost interno de Adminer (null si no está instalado). */
  adminerPrincipal?: () => Promise<{ raiz: string; puertos: number[] } | null>;
}

export type IdServicio = 'nginx' | `php-${string}` | IdServicioDatos;

/** Se muestran solo mientras el servicio propio del mismo id no esté instalado. */
const EXTERNOS = [
  { id: 'mysql', nombre: 'MySQL (externo)', puerto: 3306 },
  { id: 'postgresql', nombre: 'PostgreSQL (externo)', puerto: 5432 },
];

const primero = (errores: unknown[]): void => {
  if (errores.length > 0) throw errores[0];
};

function agregar(estados: EstadoProceso[]): EstadoServicio['estado'] {
  if (estados.some((e) => e === 'error')) return 'error';
  if (estados.every((e) => e === 'encendido')) return 'encendido';
  if (estados.every((e) => e === 'apagado')) return 'apagado';
  return 'iniciando';
}

export class Servicios {
  readonly nginx: ServicioNginx;
  readonly php: ServicioPhp;
  readonly datos: ServiciosDatos;
  private readonly sonda: (puerto: number) => Promise<boolean>;
  private readonly ramasEnUso: () => Promise<string[]>;

  constructor(private readonly d: DepsServicios) {
    this.sonda = d.sonda ?? ((p) => puertoResponde(p));
    this.ramasEnUso = d.ramasEnUso ?? (async () => []);
    const upstreams =
      d.obtenerUpstreams ??
      (async (): Promise<UpstreamPhp[]> => {
        const cfg = await d.leerConfig();
        const instaladas = await d.instalador.instalados('php');
        return (await this.ramasEnUso())
          .filter((v) => instaladas.includes(v))
          .map((version) => ({
            version,
            puertos: puertosPhp(version, cfg.servicios.php.trabajadores),
          }));
      });
    this.nginx = new ServicioNginx(
      d.rutas,
      d.plataforma,
      d.supervisor,
      d.instalador,
      d.leerConfig,
      upstreams,
      d.exec,
      d.httpsPrincipal,
      d.adminerPrincipal,
    );
    this.php = new ServicioPhp(d.rutas, d.plataforma, d.supervisor, d.instalador, d.leerConfig);
    const definiciones = d.definiciones;
    this.datos = new ServiciosDatos({
      rutas: d.rutas,
      plataforma: d.plataforma,
      supervisor: d.supervisor,
      instalador: d.instalador,
      leerConfig: d.leerConfig,
      modificarConfig: d.modificarConfig,
      credenciales: d.credenciales ?? new AlmacenCredenciales(d.rutas),
      ...(d.borrar ? { borrar: d.borrar } : {}),
      sonda: this.sonda,
      exec: d.exec ?? ejecutorPorDefecto,
      definiciones: () => definiciones ?? DEFINICIONES,
    });
  }

  async estados(): Promise<EstadoServicio[]> {
    const cfg = await this.d.leerConfig();
    const res: EstadoServicio[] = [];

    let versionNginx: string | null = null;
    try {
      versionNginx = await this.nginx.versionActiva(cfg);
    } catch {
      versionNginx = null;
    }
    const sup = this.d.supervisor;
    res.push({
      id: 'nginx',
      nombre: 'Nginx',
      categoria: 'web',
      version: versionNginx,
      estado: sup.estado('nginx'),
      puertos: [cfg.servicios.nginx.puerto],
      pid: sup.pid('nginx'),
    });

    for (const version of await this.d.instalador.instalados('php')) {
      const puertos = puertosPhp(version, cfg.servicios.php.trabajadores);
      const ids = puertos.map((_, i) => this.php.idTrabajador(version, i));
      res.push({
        id: `php-${version}`,
        nombre: `PHP ${version}`,
        categoria: 'php',
        version,
        estado: agregar(ids.map((id) => sup.estado(id))),
        puertos,
        pid: ids.map((id) => sup.pid(id)).find((p) => p !== null) ?? null,
      });
    }

    const propios = await this.datos.estados(cfg);
    res.push(...propios);

    for (const ext of EXTERNOS) {
      if (propios.some((p) => p.id === ext.id)) continue;
      if (await this.sonda(ext.puerto)) {
        res.push({
          id: ext.id,
          nombre: ext.nombre,
          categoria: 'bd',
          version: null,
          estado: 'externo',
          puertos: [ext.puerto],
          pid: null,
        });
      }
    }
    return res;
  }

  async iniciar(id: IdServicio): Promise<void> {
    if (id === 'nginx') return this.nginx.iniciar();
    if (esIdServicioDatos(id)) return this.datos.iniciar(id);
    return this.php.iniciar(id.slice('php-'.length));
  }

  async detener(id: IdServicio): Promise<void> {
    if (id === 'nginx') return this.nginx.detener();
    if (esIdServicioDatos(id)) return this.datos.detener(id);
    return this.php.detener(id.slice('php-'.length));
  }

  /** Valida 1024–65535 y que esté libre, guarda y reinicia el servicio si estaba encendido. */
  cambiarPuerto(id: IdServicioDatos, puerto: number): Promise<void> {
    return this.datos.cambiarPuerto(id, puerto);
  }

  /** Borra los datos del servicio; `confirmacion` debe ser el id (p. ej. "mysql"). */
  borrarDatos(id: IdServicioDatos, confirmacion: string): Promise<void> {
    return this.datos.borrarDatos(id, confirmacion);
  }

  /** PHP y nginx, y luego los servicios con autoIniciar; un fallo no impide arrancar el resto. */
  async iniciarTodo(): Promise<void> {
    const errores: unknown[] = [];
    try {
      const instaladas = await this.d.instalador.instalados('php');
      for (const v of await this.ramasEnUso()) {
        if (instaladas.includes(v)) await this.php.iniciar(v);
      }
      await this.nginx.iniciar();
    } catch (e) {
      errores.push(e);
    }
    errores.push(...(await this.datos.iniciarAutomaticos()));
    primero(errores);
  }

  async detenerTodo(): Promise<void> {
    const errores: unknown[] = [];
    try {
      await this.nginx.detener();
      for (const v of await this.d.instalador.instalados('php')) await this.php.detener(v);
    } catch (e) {
      errores.push(e);
    }
    errores.push(...(await this.datos.detenerTodos()));
    primero(errores);
  }
}
