import type { CerrojosServicio } from '../catalogo/cerrojo';
import type { EntradaAviso } from '../avisos/avisos';
import type { ServidorFtp } from '../ftp/servidorFtp';
import { ErrorWolf } from '../errores';
import { puertosPhp } from '../nginx/principal';
import type { Ejecutor, Plataforma } from '../plataforma/tipos';
import { puertoResponde } from '../procesos/sonda';
import { ErrorDetenidoAlIniciar, type EstadoProceso } from '../procesos/supervisor';
import { AlmacenCredenciales } from '../almacen';
import type { Rutas } from '../rutas';
import type {
  Config,
  EstadoServicio,
  IdInstancia,
  IdServicioDatos,
  PendienteArranque,
} from '../tipos';
import { esIdInstancia } from './instancias';
import { ejecutorPorDefecto } from '../plataforma/win';
import { DEFINICIONES } from './datos';
import {
  esIdServicioDatos,
  ServiciosDatos,
  type DefServicio,
  type DepsServiciosDatos,
} from './definicion';
import {
  ErrorPuertoOcupado,
  ServicioNginx,
  type InstaladorServicios,
  type SupervisorServicios,
  type UpstreamPhp,
} from './nginx';
import { ServicioPhp } from './php';
import type { ProcesosProyecto } from '../proyectos/procesos';
import type { UsoBase, UsoSitio } from './usoBases';

export interface DepsServicios {
  rutas: Rutas;
  /** Cerrojo por servicio compartido con el instalador y la limpieza de versiones. */
  cerrojos?: CerrojosServicio;
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
  /** Para pruebas: ¿sigue vivo el PID? */
  existePid?: DepsServiciosDatos['existePid'];
  /** Instalar una versión del catálogo (actualizar una instancia o crear una rama nueva). */
  instalarVersion?: DepsServiciosDatos['instalarVersion'];
  /** Volcados lógicos de las bases (respaldo previo a actualizar, copia a una rama nueva). */
  respaldo?: DepsServiciosDatos['respaldo'];
  fsCopia?: DepsServiciosDatos['fsCopia'];
  reloj?: DepsServiciosDatos['reloj'];
  plazoSaludMs?: DepsServiciosDatos['plazoSaludMs'];
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
  /** Carpeta y puertos PHP del vhost interno de phpMyAdmin (null si no está instalado). */
  phpmyadminPrincipal?: () => Promise<{ raiz: string; puertos: number[] } | null>;
  /**
   * Deja de compartir en la red local lo que está en una IP que ya no es de este equipo; true si
   * quitó algo. Se llama antes de generar la configuración de Nginx y si `nginx -t` falla.
   */
  podarRed?: () => Promise<boolean>;
  /** Pone al día los vhosts de los sitios con la plantilla actual al encender Nginx (D40). */
  alinearVhosts?: () => Promise<{ deshacer(): Promise<boolean> } | void>;
  /** Servidor FTP del proceso: aparece como servicio "ftp" (herramienta). */
  ftp?: Pick<ServidorFtp, 'estado' | 'iniciar' | 'detener'>;
  /** Procesos de los proyectos: aparecen en los estados y se detienen primero en detenerTodo. */
  procesosProyecto?: Pick<ProcesosProyecto, 'estadosServicio' | 'detenerTodos'> &
    Partial<Pick<ProcesosProyecto, 'autoIniciar' | 'pendientesAutoIniciar'>>;
  /** Bases que usa cada sitio según su `.env` ("Iniciar todo" las enciende antes que sus procesos). */
  usosDeSitios?: () => Promise<UsoSitio[]>;
  /** Publica un aviso (centro de avisos); aquí, el puerto ocupado al iniciar un servicio. */
  avisar?: (a: EntradaAviso) => unknown;
  /** Pools propios de los sitios (ini por sitio, Xdebug): viven con el pool de su rama. */
  poolsSitio?: {
    iniciarRama(rama: string): Promise<void>;
    detenerRama(rama: string): Promise<void>;
  };
}

export type IdServicio = 'nginx' | 'ftp' | `php-${string}` | IdServicioDatos | IdInstancia;

/** Se muestran solo mientras el servicio propio del mismo id no esté instalado. */
const EXTERNOS = [
  { id: 'mysql', nombre: 'MySQL (externo)', puerto: 3306 },
  { id: 'postgresql', nombre: 'PostgreSQL (externo)', puerto: 5432 },
];

interface FalloInicio {
  nombre: string;
  error: unknown;
}

const NOMBRES_BD: Record<UsoBase['servicio'], string> = {
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
};

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Un solo error con cada fallo de "Iniciar todo" (nombre: motivo), uno por línea. */
function errorIniciarTodo(fallos: FalloInicio[]): ErrorWolf {
  const nombres = [...new Set(fallos.map((f) => f.nombre))];
  const detalle = fallos
    .map((f) => {
      const m = mensajeDe(f.error);
      return m.startsWith(`${f.nombre}:`) ? `- ${m}` : `- ${f.nombre}: ${m}`;
    })
    .join('\n');
  return new ErrorWolf(
    'servicios.iniciar_todo_fallos',
    `No se pudo iniciar todo. Falló:\n${detalle}`,
    { nombres: nombres.join(', ').slice(0, 200) },
    { cause: fallos[0]?.error },
  );
}

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
      d.phpmyadminPrincipal,
      d.podarRed,
      d.alinearVhosts,
    );
    this.php = new ServicioPhp(d.rutas, d.plataforma, d.supervisor, d.instalador, d.leerConfig);
    const definiciones = d.definiciones;
    this.datos = new ServiciosDatos({
      rutas: d.rutas,
      ...(d.cerrojos ? { cerrojos: d.cerrojos } : {}),
      plataforma: d.plataforma,
      supervisor: d.supervisor,
      instalador: d.instalador,
      leerConfig: d.leerConfig,
      modificarConfig: d.modificarConfig,
      credenciales: d.credenciales ?? new AlmacenCredenciales(d.rutas),
      ...(d.borrar ? { borrar: d.borrar } : {}),
      ...(d.existePid ? { existePid: d.existePid } : {}),
      ...(d.instalarVersion ? { instalarVersion: d.instalarVersion } : {}),
      ...(d.respaldo ? { respaldo: d.respaldo } : {}),
      ...(d.fsCopia ? { fsCopia: d.fsCopia } : {}),
      ...(d.reloj ? { reloj: d.reloj } : {}),
      ...(d.plazoSaludMs !== undefined ? { plazoSaludMs: d.plazoSaludMs } : {}),
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

    if (this.d.ftp) res.push(await this.d.ftp.estado());
    if (this.d.procesosProyecto) res.push(...(await this.d.procesosProyecto.estadosServicio()));

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

  private ftpObligatorio(): NonNullable<DepsServicios['ftp']> {
    if (!this.d.ftp)
      throw new ErrorWolf('servicios.ftp_no_disponible', 'El servidor FTP no está disponible.');
    return this.d.ftp;
  }

  /** Si el usuario lo detuvo mientras arrancaba, es una parada normal: no es un error. */
  async iniciar(id: IdServicio): Promise<void> {
    try {
      await this.iniciarSinTolerancia(id);
    } catch (e) {
      if (e instanceof ErrorPuertoOcupado) {
        this.d.avisar?.({
          nivel: 'error',
          tipo: 'puerto-ocupado',
          codigo: 'avisos.puerto_ocupado',
          datos: { fuente: id, puerto: e.puerto, nombre: e.nombre },
          accion: { ruta: 'servicios', foco: `servicio:${id}` },
        });
      }
      if (!(e instanceof ErrorDetenidoAlIniciar)) throw e;
    }
  }

  private iniciarSinTolerancia(id: IdServicio): Promise<void> {
    if (id === 'nginx') return this.nginx.iniciar();
    if (id === 'ftp') return this.ftpObligatorio().iniciar();
    if (esIdServicioDatos(id) || esIdInstancia(id)) return this.datos.iniciar(id);
    return this.iniciarRama(id.slice('php-'.length));
  }

  /** Pool compartido de la rama y, detrás, los pools propios de sus sitios. */
  private async iniciarRama(rama: string): Promise<void> {
    await this.php.iniciar(rama);
    try {
      await this.d.poolsSitio?.iniciarRama(rama);
    } catch (e) {
      // El PHP de la rama ya responde: un pool de sitio que no arranca no la tumba.
      console.error(
        `PHP ${rama}: un PHP propio de un sitio no arrancó:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  private async detenerRama(rama: string): Promise<void> {
    await this.d.poolsSitio?.detenerRama(rama);
    await this.php.detener(rama);
  }

  async detener(id: IdServicio): Promise<void> {
    if (id === 'nginx') return this.nginx.detener();
    if (id === 'ftp') return this.ftpObligatorio().detener();
    if (esIdServicioDatos(id) || esIdInstancia(id)) return this.datos.detener(id);
    return this.detenerRama(id.slice('php-'.length));
  }

  /** Valida 1024–65535 y que esté libre, guarda y reinicia el servicio si estaba encendido. */
  cambiarPuerto(id: IdServicioDatos, puerto: number): Promise<void> {
    return this.datos.cambiarPuerto(id, puerto);
  }

  /** Borra los datos del servicio; `confirmacion` debe ser el id (p. ej. "mysql"). */
  borrarDatos(id: IdServicioDatos, confirmacion: string): Promise<void> {
    return this.datos.borrarDatos(id, confirmacion);
  }

  /**
   * "Iniciar todo" (botón, bandeja y `--iniciar-todo`), en orden de dependencias:
   * 1. PHP de las ramas en uso y Nginx;
   * 2. las bases: las de `autoIniciar`, la predeterminada de cada base instalada y las que usan
   *    los proyectos según su `.env`; se espera a que cada una responda en su puerto;
   * 3. los procesos de proyecto con `autoIniciar`, solo si responde la base que usan.
   * Nunca abre túneles. Un fallo no impide arrancar el resto; al final, si algo falló, lanza
   * `servicios.iniciar_todo_fallos` con el detalle de cada uno.
   */
  async iniciarTodo(): Promise<void> {
    const fallos: FalloInicio[] = [];
    const anotar = (nombre: string, e: unknown): void => {
      if (!(e instanceof ErrorDetenidoAlIniciar)) fallos.push({ nombre, error: e });
    };
    for (const v of await this.ramasPhpEnUso()) {
      try {
        await this.iniciarRama(v);
      } catch (e) {
        anotar(`PHP ${v}`, e);
      }
    }
    try {
      await this.nginx.iniciar();
    } catch (e) {
      anotar('Nginx', e);
    }

    const sitios = await this.usosDeSitios();
    const objetivos = await this.datos.objetivosIniciarTodo(sitios.flatMap((s) => s.usos));
    for (const r of await this.datos.iniciarYEsperar(objetivos)) {
      if (r.error !== undefined) anotar(r.nombre, r.error);
    }

    if (this.d.procesosProyecto?.autoIniciar) {
      const mensajes = await this.d.procesosProyecto.autoIniciar(
        () => true,
        (sitioId) => this.baseSinResponder(sitios, sitioId),
      );
      for (const m of mensajes) fallos.push({ nombre: m.split(':')[0] ?? m, error: new Error(m) });
    }
    if (fallos.length > 0) throw errorIniciarTodo(fallos);
  }

  /**
   * Lo que «Iniciar todo» encendería ahora, con el MISMO criterio que `iniciarTodo` (PHP de las
   * ramas en uso, Nginx instalado, bases con `autoIniciar`, predeterminadas o usadas por proyectos,
   * y procesos de proyecto con `autoIniciar`), solo lo que está parado o en error. No arranca nada.
   */
  async porArrancar(): Promise<PendienteArranque[]> {
    const res: PendienteArranque[] = [];
    const sup = this.d.supervisor;
    const cfg = await this.d.leerConfig();
    for (const v of await this.ramasPhpEnUso()) {
      const ids = puertosPhp(v, cfg.servicios.php.trabajadores).map((_, i) =>
        this.php.idTrabajador(v, i),
      );
      const e = agregar(ids.map((id) => sup.estado(id)));
      if (e === 'apagado' || e === 'error')
        res.push({ id: `php-${v}`, nombre: `PHP ${v}`, tipo: 'php' });
    }
    // Sin Nginx instalado «Iniciar todo» falla y no hay nada que encender: no es un pendiente.
    const nginxInstalado = await this.nginx.versionActiva(cfg).then(
      () => true,
      () => false,
    );
    const en = sup.estado('nginx');
    if (nginxInstalado && (en === 'apagado' || en === 'error'))
      res.push({ id: 'nginx', nombre: 'Nginx', tipo: 'nginx' });
    const sitios = await this.usosDeSitios();
    for (const o of await this.datos.pendientesIniciarTodo(sitios.flatMap((s) => s.usos)))
      res.push({ id: o.ref, nombre: o.nombre, tipo: 'datos' });
    for (const p of (await this.d.procesosProyecto?.pendientesAutoIniciar?.()) ?? [])
      res.push({ id: p.id, nombre: p.nombre, tipo: 'proceso' });
    return res;
  }

  /** Ramas de PHP que usa algún sitio y ya están instaladas (las que enciende un workspace). */
  async ramasPhpEnUso(): Promise<string[]> {
    const instaladas = await this.d.instalador.instalados('php');
    return (await this.ramasEnUso()).filter((v) => instaladas.includes(v));
  }

  /** Motivo para no arrancar los procesos de un sitio (su base local no responde), o null. */
  async baseSinResponderDe(sitioId: string): Promise<string | null> {
    return this.baseSinResponder(await this.usosDeSitios(), sitioId);
  }

  /** Espera a que un servicio de datos o una instancia ya encendidos respondan en su puerto. */
  esperarSaludDe(ref: IdServicioDatos | IdInstancia): Promise<void> {
    return this.datos.esperarSaludDe(ref);
  }

  /** Bases que usa cada sitio según su `.env` (sin el proveedor, ninguna). */
  private async usosDeSitios(): Promise<UsoSitio[]> {
    try {
      return (await this.d.usosDeSitios?.()) ?? [];
    } catch (e) {
      console.error('No se pudieron leer las bases de los proyectos:', mensajeDe(e));
      return [];
    }
  }

  /**
   * Motivo para no arrancar los procesos de un sitio: la base local que usa no responde (null si
   * responden todas). Así un proceso no arranca para caerse al instante sin su base.
   */
  async baseSinResponder(sitios: readonly UsoSitio[], sitioId: string): Promise<string | null> {
    const usos = sitios.find((s) => s.sitioId === sitioId)?.usos ?? [];
    for (const u of usos) {
      if (await this.sonda(u.puerto)) continue;
      const nombre = NOMBRES_BD[u.servicio];
      return `no se inició porque ${nombre} (puerto ${u.puerto}) no responde`;
    }
    return null;
  }

  /** Primero los procesos de proyecto (usan las bases y PHP), luego Nginx, PHP y el resto. */
  async detenerTodo(): Promise<void> {
    const errores: unknown[] = [];
    try {
      errores.push(...((await this.d.procesosProyecto?.detenerTodos()) ?? []));
    } catch (e) {
      errores.push(e);
    }
    try {
      await this.nginx.detener();
      for (const v of await this.d.instalador.instalados('php')) await this.detenerRama(v);
    } catch (e) {
      errores.push(e);
    }
    errores.push(...(await this.datos.detenerTodos()));
    try {
      await this.d.ftp?.detener();
    } catch (e) {
      errores.push(e);
    }
    primero(errores);
  }
}
